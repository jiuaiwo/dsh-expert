#!/usr/bin/env node
/**
 * 客户端组件的**渲染冒烟测试**：把每个组件真的渲染一遍（react-dom/server + 桩上下文）。
 *
 * 为什么需要它 —— 0.3.49 引入、0.3.69 才清掉的 ExpertPicker 残留就是靠它才抓得住的：
 *   · `tsc` 只看静态引用（tools/check-client-refs.mjs 能抓「引用另一个组件的局部变量」）；
 *   · esbuild **打包不报**；
 *   · verify 的文本断言看不出异常；
 *   · 而这类错误只在**那个组件真的被渲染**时炸成 ReferenceError（当时表现是定时任务点
 *     「添加/编辑」整块白屏）。
 * 所以这里把「每个组件至少能渲染成功一次」变成可执行的门禁；桩数据按**真实形状**给
 * （名册快照带 enabledSet、anchor 是矩形、getActive 返回 Set）——桩给错会误报成代码 bug，
 * 反而浪费排查时间。
 *
 * 退出码：0 = 全部渲染成功；1 = 有组件渲染失败（逐条打印组件与错误首行）。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const SELF_DIR = fileURLToPath(new URL(".", import.meta.url));
const HERE = process.env.T_TEAM_REPO
  ?? (existsSync(join(SELF_DIR, "..", "lib", "index.js")) ? resolve(SELF_DIR, "..") : join(SELF_DIR, "dsh-expert"));
const CLIENT_DIR = join(HERE, "src", "client");

/** 带 React 组件的客户端源文件（不含 index.jsx：它只做注册与注入，组件由这些文件导出）。 */
const COMPONENT_SOURCES = ["boundary.jsx", "ui.jsx", "settings.jsx", "tabs.jsx", "skills-panel.jsx", "summon.jsx", "catalog.js"];

// 产物必须落在**仓库内**：它 `require("react")` 才能解析到本仓的 react（与测试脚本同一个实例；
// 放到 /tmp 会变成两个 React，报 "Invalid hook call"）。node_modules/.cache 不进 git。
const CACHE = join(HERE, "node_modules", ".cache", "t-team-render-smoke");
mkdirSync(CACHE, { recursive: true });
const ENTRY = join(CACHE, "entry.jsx");
const BUNDLE = join(CACHE, "bundle.cjs");
writeFileSync(ENTRY, `${COMPONENT_SOURCES.map((name) => `export * from ${JSON.stringify(join(CLIENT_DIR, name))};`).join("\n")}\n`);
await build({
  // 官方客户端包在产物里是外部 require（宿主模块表提供单例），测试环境里指向共享替身：
  // 自检验的是"我们的组件树能不能被真 React 渲染出来"，不是上游包本身。
  alias: { "@deepseek-ai/dsh-client-ui-primitives": join(SELF_DIR, "primitives-stub.js") },
  entryPoints: [ENTRY],
  outfile: BUNDLE,
  bundle: true,
  format: "cjs",
  platform: "node",
  external: ["react"],
  jsx: "transform",
  logLevel: "error",
});

const require = createRequire(import.meta.url);
const React = require("react");
const { renderToString } = require("react-dom/server");
const M = require(BUNDLE);

// ---- 桩（形状必须贴近真实调用，否则会把桩的问题误报成代码 bug）----
const noop = () => {};
const t = (key) => key;
const experts = [
  { slug: "engineering-frontend-developer", name: "前端开发者", nameEn: "Frontend Developer", division: "engineering", description: "d", emoji: "🎨" },
  { slug: "marketing-x", name: "营销", nameEn: "Marketer", division: "marketing", description: "d2", emoji: "📣" },
];
const enabled = ["engineering-frontend-developer"];
const snapshot = { byId: {}, jobsBySession: {}, subagentsByParent: {} };
const remote = {
  getSchedule: async () => ({ ok: true, value: { items: [], workspaces: [] } }),
  getCatalog: async () => ({ ok: true, value: { experts, enabled, revision: 1 } }),
  getUiPrefs: async () => ({ ok: true, value: {} }),
};
const ctx = {
  sessions: { list: { getSnapshot: () => snapshot, subscribe: () => noop }, open: noop },
  locale: { getSnapshot: () => ({ active: "zh" }), subscribe: () => noop, bind: () => () => t },
  remote: { skills: { list: async () => ({ ok: true, value: [] }) } },
  get: () => undefined,
  effect: (fn) => { try { fn(); } catch { /* 桩环境下的 effect 失败不影响渲染 */ } return noop; },
  slots: { register: () => ({ dispose: noop }) },
  inputTriggers: { registerSource: () => ({ dispose: noop }) },
};
// 审计修复（#17）：getActive 的真实契约是返回 locale 字符串 "zh"/"en"（index.jsx:94），
// 组件里用 `active === "en"` 分支。旧桩返回 Set 与契约不符，让所有 locale 分支恒走中文、
// 语言相关回归测不出。改回返回 "zh" 以贴近真实契约。
const getActive = () => "zh";
const anchor = { left: 10, right: 210, top: 20, bottom: 50, width: 200, height: 30 };

/** 名册快照要在渲染设置页/浮层之前进缓存（真实环境由 apply 里的 refresh() 完成）。 */
M.publishCatalog(remote, {
  experts,
  enabled,
  enabledSet: new Set(enabled),
  revision: 1,
  divisions: [{ key: "engineering", label: "工程", labelEn: "Engineering", count: 1 }],
});

const cases = [
  ["SectionBoundary", () => React.createElement(M.SectionBoundary, { t, reloadKey: "k" }, React.createElement("div", null, "ok"))],
  // ★ 回归锚点：0.3.49 的残留让这个组件一渲染就 ReferenceError（定时任务表单白屏）。
  ["CategoriesTab", () => React.createElement(M.CategoriesTab, { t, remote, categories: [{ key: "engineering", label: "工程" }], onChanged: noop })],
  // ★ 设置面板本体（2026-09-28 换了官方控件 + 搬到插件信息页）：它一炸就是整个面板白屏，
  //   而 esbuild 打包不报、文本断言也看不出——只有真渲染一遍才知道。
  ["SettingsPanel", () => React.createElement(M.SettingsPanel, { t, remote, getActive: () => "zh", view: "page" })],
  ["SettingsPanel（summary 视图）", () => React.createElement(M.SettingsPanel, { t, remote, getActive: () => "zh", view: "summary" })],
  // 技能开关面板（2026-09-28 从 dsh-plugin-skill-gate 并入）：没挂上 remote 时也不能炸，
  // 卡片那边会替成一句「服务不可用」的说明。
  ["SkillsPanel", () => React.createElement(M.SkillsPanel, { t, remote })],
  ["SkillsPanel（remote 缺失）", () => React.createElement(M.SkillsPanel, { t, remote: undefined })],
  ["SummonButton", () => React.createElement(M.SummonButton, {
    t, ctx, remote, getActive, insertReference: noop, insertSkillHint: noop,
    sessionId: "s1", preview: undefined, rootRemote: remote,
  })],
];
// 设置页每个标签各渲染一次：标签内容互不相同，只测默认标签会漏掉另一个的渲染路径。
for (const tab of ["experts", "categories"]) {
  cases.push([`SettingsPanel(tab=${tab})`, () => React.createElement(M.SettingsPanel, {
    t, ctx, remote, getActive, refreshCatalog: noop, initialTab: tab,
  })]);
}

const failures = [];
for (const [name, make] of cases) {
  try {
    renderToString(make());
  } catch (error) {
    failures.push(`${name}：${String(error?.message ?? error).split("\n")[0]}`);
  }
}

if (failures.length > 0) {
  process.stderr.write(`客户端组件渲染失败 ${failures.length}/${cases.length}：\n`);
  for (const line of failures) process.stderr.write(`  ✗ ${line}\n`);
  process.stderr.write("提示：若错误指向桩数据（例如某字段 undefined），先核对本脚本的桩形状是否与真实调用一致。\n");
  process.exit(1);
}
process.stdout.write(`客户端组件渲染冒烟通过（${cases.length}/${cases.length}）\n`);
