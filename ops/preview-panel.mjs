/**
 * 离线预览 T专家 设置页：把真实花名册数据渲染成静态 HTML（含 DSH 的主题 token），
 * 以便用 Chrome headless 截图肉眼验收布局。
 *
 *   node ~/web/t-team/preview-panel.mjs            # 生成 /tmp/t-team-preview.html
 *   node ~/web/t-team/preview-panel.mjs --out X.html --limit 8 --enabled 3
 *
 * 主题 token 从 app.asar 里的 body{...} 规则原样取出，颜色与真实界面一致。
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";

const OPS_DIR = fileURLToPath(new URL(".", import.meta.url));
// 自定位：本文件住在仓库的 ops/ 里（旧布局下与仓库同级）——两种都要能跑。
const SELF_DIR = fileURLToPath(new URL(".", import.meta.url));
const SELF_PARENT = fileURLToPath(new URL("..", import.meta.url));
const HERE = process.env.T_TEAM_REPO
  ?? (existsSync(join(SELF_PARENT, "lib", "index.js")) ? SELF_PARENT : join(SELF_PARENT, "dsh-expert"));

// 仓库的 lib/ 要用绝对路径动态 import（静态相对路径会指到运维目录外）。
// ⚠️ 这三行必须排在 `HERE` **之后**：2026-09-15 修 —— 它们原先写在自定位之前，
// 模块顶层 await 一执行就撞 TDZ（Cannot access 'HERE' before initialization），整个探针跑不起来。
const catalogMod = await import(join(HERE, "lib/catalog.js"));
const i18n = await import(join(HERE, "lib/i18n.js"));
const args = process.argv.slice(2);
const argValue = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] !== undefined ? args[index + 1] : fallback;
};
const OUT = argValue("--out", "/tmp/t-team-preview.html");
const ONLY = argValue("--only", "");   // ""=全部；pop=只出输入框弹窗（便于单独截图）
const LIMIT = Number(argValue("--limit", "6"));
const ENABLED = Number(argValue("--enabled", "2"));
// 面板默认停在「专家」标签；--tab categories 可以直接预览分类页（改那页样式时不必来回点）。
const TAB = argValue("--tab", "experts");

// ---- 主题 token（从 app.asar 的 body 规则里取）----
async function themeTokens() {
  // App 名先后叫过 DSH Desktop 与 DeepSeek Harness —— 两个都试，别写死一个（写死过，token 变 0 字节）。
  const asar = ["/Applications/DeepSeek Harness.app/Contents/Resources/app.asar",
    "/Applications/DSH Desktop.app/Contents/Resources/app.asar"].find((path) => existsSync(path));
  if (asar === undefined) return "";
  const buf = await readFile(asar);
  const text = buf.toString("utf8");
  // 需要两块：:root 里的静态色板 + body 里的 alias 层（alias 引用 static，缺一块颜色就解析不出来）
  // asar 里的主题规则是内嵌在 JS 字符串里的（design-platform.css.mjs），
  // 所以直接按「规则起始文本 → 下一个 }」切片，并去掉 JS 转义。
  const blocks = [];
  const rule = (marker) => {
    const i = text.indexOf(marker);
    if (i < 0) return undefined;
    const raw = text.slice(i, text.indexOf("}", i) + 1);
    return raw.replace(/\\(.)/g, "$1");
  };
  for (const marker of ["body{--dsw-static-amber-100:", "body{--dsw-alias-bg-base:"]) {
    const block = rule(marker);
    if (block !== undefined && !blocks.includes(block)) blocks.push(block);
  }
  return blocks.join("\n");
}

// ---- 取真实花名册（中文字段与宿主 snapshot 一致）----
async function snapshot(limit = LIMIT) {
  const root = join(homedir(), ".t-team", "experts");
  const zhRoot = join(homedir(), ".t-team", "zh");
  const catalog = await catalogMod.loadCatalog(root, [], { zhRoot });
  const divisions = catalogMod.catalogDivisions(catalog);
  const experts = [...catalog.values()].filter((expert) => expert.conflict !== true).slice(0, limit);
  return {
    experts: experts.map((expert) => {
      const label = catalogMod.divisionOf(expert.division, catalog.labels);
      return {
        slug: expert.slug,
        name: expert.nameZh ?? expert.name,
        nameEn: expert.nameEn,
        description: expert.descriptionZh ?? expert.description,
        descriptionEn: expert.descriptionEn,
        emoji: expert.emoji,
        division: expert.division,
        divisionZh: label.zh,
        divisionEn: label.en,
      };
    }),
    enabled: experts.slice(0, ENABLED).map((expert) => expert.slug),
    revision: 1,
    divisions,
    // 分类页的数据：一个自建分类（带改名/删除按钮，就是用户截图里那一行）+ 名册里出现的官方分类。
    // 少了它，--tab categories 预览出来是空的。
    categories: [
      { key: "custom", label: "自定义", official: false, count: 0, customCount: 0 },
      ...[...new Map(experts.map((expert) => [expert.division, expert])).entries()].map(([key, sample]) => ({
        key,
        label: sample.divisionZh ?? key,
        official: true,
        count: experts.filter((expert) => expert.division === key).length,
        customCount: 0,
      })),
    ],
  };
}

const fake = await snapshot();
const dictionaries = new Map();
let panelElement;
let panelRender;
let buttonElement;
let buttonRender;

const clientCode = await readFile(join(HERE, "lib/client.js"), "utf8");
let registration;
const sandbox = {
  window: { __ModuleLoader__: { load: (value) => { registration = value; } } },
  document: { createElement: () => ({ dataset: {}, textContent: "", remove() {} }), head: { appendChild() {} } },
  console,
};
vm.createContext(sandbox);
vm.runInContext(clientCode, sandbox, { filename: "lib/client.js" });

// 官方 primitives 的替身：与 verify / render-smoke 共用 tools/primitives-stub.js。
// ⚠️ 别退回「任何属性都返回空组件」的 Proxy —— 那样按钮文字、标签页、输入框 placeholder
// 全都不出现在预览图里，截出来的版面是假的（2026-09-28 换成官方控件时踩过）。
const primitivesStub = await import(join(HERE, "tools", "primitives-stub.js"));

const fakeRemote = {
  getCatalog: async () => ({ ok: true, value: fake }),
  setEnabled: async (enabled, revision) => ({ ok: true, value: { enabled, revision: revision + 1 } }),
  getPrompt: async () => ({ ok: true, value: { prompt: "" } }),
};
const clientCtx = {
  effect: (fn) => { const dispose = fn(); return () => { if (typeof dispose === "function") dispose(); }; },
  locale: {
    register: (ns, dicts) => { dictionaries.set(ns, dicts); return () => dictionaries.delete(ns); },
    getSnapshot: () => ({ active: "zh" }),
    subscribe: () => () => {},
    bind: (ns) => (key, params = {}) => {
      const dicts = dictionaries.get(ns) ?? {};
      let text = dicts.zh?.[key] ?? dicts.en?.[key] ?? key;
      for (const [name, value] of Object.entries(params)) text = text.split(`{${name}}`).join(String(value));
      return text;
    },
  },
  remote: { $mount: async () => () => {} },
  get: (name) => (name === "remote.tTeam" ? fakeRemote : undefined),
  slots: {
    inject: (_name, fn) => fn(),
    register: (options, render) => {
      if (options.name === "settings.section") {
        panelRender = (extra) => render({ close: () => {}, t: clientCtx.locale.bind("t-team"), ...extra });
        panelElement = panelRender();
      }
      if (options.name === "conversation.input.left") {
        const shared = typeof options.inject === "function" ? options.inject("preview-session") : {};
        buttonRender = (extra) => render({ ...shared, t: clientCtx.locale.bind("t-team"), ...extra });
        buttonElement = buttonRender();
      }
      return () => {};
    },
  },
  inputTriggers: { registerSource: () => () => {} },
  sessions: { list: { getSnapshot: () => ({ current: "s" }) }, scope: () => undefined },
};
const exports = registration.factory((spec) => {
  if (spec === "react") return React;
  if (spec === "react/jsx-runtime") return jsxRuntime;
  // 壳在运行时提供的 UI primitives：预览只要不崩，给个占位组件即可（我们预览的是 T专家 自己的三个标签）
  if (spec === "@deepseek-ai/dsh-client-ui-primitives") return primitivesStub;
  throw new Error(`未声明 require：${spec}`);
});
await exports.apply(clientCtx);

const cssMatch = (await readFile(join(HERE, "src", "client", "css.js"), "utf8")).match(/const CSS = `([\s\S]*?)`;/);
const css = cssMatch?.[1] ?? "";
const tokens = await themeTokens();
// 面板**直接打包 src 渲染**（2026-09-28 改）：
// vm 加载产物的那条路在这里走不通 —— SSR 不跑 useEffect，名册缓存是空的，面板只会渲染出
// 「正在装载名册…」那一屏（换成官方控件后我第一次跑预览就是这么被骗了一轮）。
// 打包 src 才拿得到 refresh()，预热缓存后面板才有内容。
const { build } = await import("esbuild");
const { createRequire } = await import("node:module");
const CACHE = join(HERE, "node_modules", ".cache", "t-team-panel-preview");
await mkdir(CACHE, { recursive: true });
const ENTRY = join(CACHE, "entry.jsx");
const BUNDLE = join(CACHE, "bundle.cjs");
await writeFile(ENTRY, [
  `export { SettingsPanel } from ${JSON.stringify(join(HERE, "src/client/settings.jsx"))};`,
  `export { refresh } from ${JSON.stringify(join(HERE, "src/client/catalog.js"))};`,
  `export { zh } from ${JSON.stringify(join(HERE, "src/client/i18n.js"))};`,
  `export { SkillsPanel } from ${JSON.stringify(join(HERE, "src/client/skills-panel.jsx"))};`,
].join("\n") + "\n");
await build({
  entryPoints: [ENTRY], outfile: BUNDLE, bundle: true, format: "cjs", platform: "node",
  external: ["react"], jsx: "transform", logLevel: "error",
  // 官方客户端包在产物里是外部 require（宿主模块表提供单例），预览里指向共享替身。
  alias: { "@deepseek-ai/dsh-client-ui-primitives": join(HERE, "tools", "primitives-stub.js") },
});
const previewRequire = createRequire(import.meta.url);
const panelModule = previewRequire(BUNDLE);
const panelRemote = {
  async getCatalog() { return { ok: true, value: fake }; },
  async setEnabled(enabled, expectedRevision) { return { ok: true, value: { enabled, revision: expectedRevision + 1 } }; },
  async getPrompt() { return { ok: true, value: { prompt: "" } }; },
};
// 预热名册缓存：面板的 useState 初始化正是读它（snapshotOf(remote)）。
await panelModule.refresh(panelRemote, true);
// 技能开关面板（2026-09-28 并入）要的那份快照：造几条技能，覆盖「可见 / 已关 / 原生关闭」
// 三种状态，以及多个来源与视角 —— 面板的分组、筛选与计数才都能看得到。
const sgRow = (name, description, source, state, views) => ({
  name,
  description,
  source,
  provider: "filesystem",
  nativeModel: state !== "native",
  nativeUser: true,
  gated: state === "off",
  modelVisible: state === "on",
  views,
});
const skillRemote = {
  async getSnapshot() {
    const skills = [
      sgRow("agent-browser", "Browser automation CLI for AI agents.", "user-dsh", "on", ["host", "disk"]),
      sgRow("web-clone", "网站复刻 / 克隆方法论。", "user-dsh", "on", ["host", "disk"]),
      sgRow("see-the-world", "看图说话：把图片转成结构化描述。", "user-agents", "off", ["host", "disk"]),
      sgRow("reverse-skill-router", "逆向工程与授权渗透的技能路由包。", "custom", "off", ["disk"]),
      sgRow("dsh-harness-project", "deepseek-harness 仓库的架构与扩展点。", "bundled", "on", ["host", "preset:default"]),
      sgRow("internal-audit", "随包附带的内部审计技能（SKILL.md 里已声明关闭）。", "bundled", "native", ["host", "preset:default"]),
    ];
    return { ok: true, value: {
      revision: 3,
      storePath: join(homedir(), ".dsh", "skill-gate.json"),
      skills,
      counts: { total: skills.length, modelVisible: 3, gated: 2, nativeOff: 1 },
      views: [
        { key: "host", kind: "host", name: "", total: 5, modelVisible: 3, gated: 2, nativeOff: 0 },
        { key: "preset:default", kind: "preset", name: "default", total: 2, modelVisible: 1, gated: 0, nativeOff: 1 },
        { key: "disk", kind: "disk", name: "", total: 4, modelVisible: 2, gated: 2, nativeOff: 0 },
      ],
    } };
  },
  async setDisabled() { return { ok: true, value: await this.getSnapshot().then((r) => r.value) }; },
};

const translate = (key, params = {}) => {
  let text = panelModule.zh[key] ?? key;
  for (const [name, value] of Object.entries(params)) text = text.split(`{${name}}`).join(String(value));
  return text;
};
// 技能面板单独出一块：SSR 不跑 effect，得把快照直接喂进去才看得到内容。
const sgSnapshot = (await skillRemote.getSnapshot()).value;
const skillsHtml = renderToStaticMarkup(React.createElement(panelModule.SkillsPanel, {
  t: translate,
  remote: skillRemote,
  initialSnapshot: sgSnapshot,
}));

const panelHtml = renderToStaticMarkup(React.createElement(panelModule.SettingsPanel, {
  t: translate,
  remote: panelRemote,
  getActive: () => "zh",
  view: "page",
  initialTab: TAB,
  skillRemote,
}));
// 演示用：第一位专家的真实 persona（zh 侧车优先），截断展示弹窗外观
const firstExpertRaw = [...(await catalogMod.loadCatalog(join(homedir(), ".t-team", "experts"), [], { zhRoot: join(homedir(), ".t-team", "zh") })).values()][0];
const promptSample = (await catalogMod.readPersona(firstExpertRaw, "zh")).split("\n").slice(0, 14).join("\n");
const buttonHtml = buttonElement === undefined ? "" : renderToStaticMarkup(buttonElement);
const popExpertsHtml = renderToStaticMarkup(buttonRender({ preview: { open: true, tab: "experts" } }));

const page = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>T专家 面板预览</title>
<style>
:root{color-scheme:light}
html,body{margin:0;padding:0}
${tokens}
body{font-family:-apple-system,"PingFang SC",system-ui,sans-serif;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);padding:20px}
.preview-frame{max-width:860px;margin:0 auto;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-base)}
h1{font-size:15px;margin:0 0 4px;font-weight:650}
.muted{font-size:12px;color:var(--dsw-alias-label-tertiary);margin:0 0 14px}
${css}
</style></head><body><div class="preview-frame"><h1>设置 → T专家（离线预览）</h1>
<p class="muted">数据来自 ~/.t-team/experts + zh 侧车；主题 token 取自 DSH app.asar（浅色）。共 ${fake.experts.length} 张卡片，${fake.enabled.length} 位已启用。</p>
${ONLY === "pop" ? "" : panelHtml}

${ONLY === "pop" || ONLY === "panel" ? "" : `<h1 style="margin-top:26px">技能开关面板（离线预览 · 并入 T专家 的第三个标签页）</h1>
<div class="preview-frame">${skillsHtml}</div>`}
${ONLY === "pop" ? "" : `<h1 style="margin-top:26px">输入框工具行（离线预览）</h1>`}
<p class="muted">对话输入框下方的工具栏，左侧就是 T专家 按钮；点击后弹出专家选择面板。</p>
<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2)">
  <span class="muted">＋ 附件</span>
  ${buttonHtml}
  <span class="muted">◇ 专家</span>
  <span style="flex:1 1 auto"></span>
  <span class="muted">DeepSeek-V4</span>
</div>

<h1 style="margin-top:26px">输入框「T专家」弹窗 → 专家（离线预览）</h1>
<p class="muted">工具行按钮弹出的对话框有三个标签：专家（@ 召唤）/ 技能（插技能提示）/ 任务（每个专家的待办）。</p>
<div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">
  <div class="t-team-btn-wrap" style="position:relative">
    <button class="t-team-btn" type="button">🧩 T专家</button>
    ${popExpertsHtml.replace('class="t-team-pop"', 'class="t-team-pop" style="position:static"')}
  </div>
</div>

<h1 style="margin-top:26px">「查看提示词」弹窗（离线预览）</h1>
<p class="muted">点卡片右上角 📄 打开；正文是该专家真正会注入子代理的系统提示词（中文侧车优先，缺译文回退英文）。</p>
<div class="t-team-mask" style="position:static;padding:0;background:none">
  <div class="t-team-modal">
    <div class="t-team-modal-head">
      <span>${firstExpertRaw.nameZh ?? firstExpertRaw.name} · 提示词</span>
      <button class="t-team-chip" type="button">关闭</button>
    </div>
    <pre class="t-team-modal-body">${promptSample.replace(/</g, "&lt;")}
…（共 ${promptSample.length} 字符预览）</pre>
  </div>
</div>
</div></body></html>`;

await writeFile(OUT, page, "utf8");
console.log(`已生成 ${OUT}（${page.length} 字节，${fake.experts.length} 张卡片，token ${tokens.length} 字节）`);
