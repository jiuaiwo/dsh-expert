/**
 * T团队 离线验证：不启动 DSH，也能验证 host 插件、remote 服务与客户端产物的契约。
 *
 *   node ~/web/t-team/verify.mjs
 *
 * 覆盖：
 *   1. 插件模块形态（name/inject/Config/apply）
 *   2. 固定资产目录（~/.t-team/experts）能被解析成花名册
 *   3. apply() 注册的工具/设置段/系统提示段/服务
 *   4. 三个工具的真实执行（含 persona 注入、toolFilter、批量部分失败）
 *   5. remote 服务的 Typert 标记与三个方法
 *   6. 客户端产物（存在、ModuleLoader 信封、id、remote 描述符）
 */
import { readFile, readdir } from "node:fs/promises";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Context } from "@deepseek-ai/cordis";

/**
 * 定位两个根目录（D-2 起本脚本住在**仓库内**的 `tools/`，不再住在同级运维目录）：
 *
 * - `HERE` = 插件仓库根。`tools/` 布局下就是上一级，所以干净 clone 也能跑自检。
 * - `OPS_DIR` = 运维目录（`tz.sh` / `add-expert.py` 所在处）。它**不在仓库里**，所以只有
 *   维护者机器上才存在；候选按「环境变量 → 同级 `dsh-expert/` 的兄弟」两处找。
 *   找不到时读它的那几节会**跳过**（见 `existsSync(join(OPS_DIR, …))` 的判断），
 *   这样开发者的完整环境与 CI 的纯 clone 都能跑同一条命令。
 */
const SELF_DIR = fileURLToPath(new URL(".", import.meta.url));
const HERE = process.env.T_TEAM_REPO
  ?? (existsSync(join(SELF_DIR, "..", "lib", "index.js")) ? resolve(SELF_DIR, "..") : join(SELF_DIR, "dsh-expert"));
const OPS_DIR = process.env.T_TEAM_OPS
  ?? (existsSync(join(SELF_DIR, "tz.sh"))
    ? SELF_DIR
    : [resolve(SELF_DIR, "..", ".."), resolve(SELF_DIR, "..")].find((candidate) => existsSync(join(candidate, "tz.sh"))) ?? resolve(SELF_DIR, ".."));
/**
 * 运维目录是否真的在本机（`tz.sh` 在不在）。
 *
 * 为什么需要：`tools/` 随仓库走之后，**干净 clone / CI 上没有运维目录**。凡是要读
 * `tz.sh` / `add-expert.py` 的断言都必须先看这个开关，否则一条 ENOENT 会把整个自检打断
 * （而不是只跳过那几节）。缺失时用 `check(..., true, "skip")` 明确记一条「已跳过」，
 * 免得"少跑了"看起来像"全绿"。
 */
const HAS_OPS = existsSync(join(OPS_DIR, "tz.sh"));
/**
 * 运维台脚本正文（**权威副本优先**）。
 *
 * 2026-09-13：运维台已随仓库纳管到 `<repo>/ops/tz.sh`，工作区里那份可能只是**薄转发**。
 * 断言要检查的是真脚本（菜单、STAGE 定义、装机逻辑都在它里面），所以优先读仓库内那份；
 * 仓库里没有时才回退到工作区那份（老布局或仓库被裁剪）。本机没有运维目录时为空串，
 * 相关断言由 HAS_OPS 跳过并记一条 skip。
 */
const OPS_SCRIPT_PATH = existsSync(join(HERE, "ops", "tz.sh"))
  ? join(HERE, "ops", "tz.sh")
  : (HAS_OPS ? join(OPS_DIR, "tz.sh") : "");
const OPS_SCRIPT = OPS_SCRIPT_PATH === "" ? "" : readFileSync(OPS_SCRIPT_PATH, "utf8");
// 仓库的 lib/ 用绝对路径动态 import（本文件不在仓库内），所以必须在 HERE 之后
const { seedData } = await import(join(HERE, "lib/bootstrap.js"));

/**
 * 客户端源码全文。
 *
 * 客户端源码原本是一个 5278 行的单文件 `src/client.jsx`，2026-09-17 按职责拆成 `src/client/`
 * 下的 14 个文件（入口 `index.jsx`）。下面那些断言要看的是**客户端源码整体**（文本存在性、
 * CSS 规则、函数体切片、zh/en 字典），所以这里按**原文件的行序**拼接后返回 ——
 * 拼接顺序即 CLIENT_SOURCE_ORDER，于是依赖相对位置的断言（例如 CategoriesTab 的函数体切片）
 * 语义与拆分前完全一致。
 */
const CLIENT_SOURCE_ORDER = [
  "state.js", "i18n.js", "css.js", "remote.js", "catalog.js", "boundary.jsx",
  "ui.jsx", "settings.jsx", "tabs.jsx", "skills-panel.jsx", "insert.js", "summon.jsx", "index.jsx",
];
async function readClientSource() {
  const dir = join(HERE, "src", "client");
  const parts = [];
  for (const name of CLIENT_SOURCE_ORDER) parts.push(await readFile(join(dir, name), "utf8"));
  return parts.join("\n");
}
/**
 * 数据目录：优先用**包内快照**（data/），这样干净 clone / CI 上也能自检；
 * 想校准你本机的运行时目录再显式传 T_TEAM_EXPERTS。
 * 这同时让 `npm run prepublishOnly` 不再依赖作者机器上的 ~/.t-team。
 */
const DATA_BASE = process.env.T_TEAM_DATA
  ?? [join(HERE, "data"), join(homedir(), ".t-team")].find((candidate) => existsSync(join(candidate, "experts")))
  ?? join(homedir(), ".t-team");
const ROOT = process.env.T_TEAM_EXPERTS ?? join(DATA_BASE, "experts");
const ZH_ROOT = process.env.T_TEAM_ZH ?? join(DATA_BASE, "zh");

let failures = 0;
let checks = 0;
function check(label, condition, detail = "") {
  checks += 1;
  if (condition) {
    console.log(`  ok   ${label}${detail === "" ? "" : ` — ${detail}`}`);
  } else {
    failures += 1;
    console.log(`  FAIL ${label}${detail === "" ? "" : ` — ${detail}`}`);
  }
}

// ---------- 1. 模块形态 ----------
console.log("\n[1] 插件模块形态");
const plugin = await import(join(HERE, "lib/index.js"));
check("导出 name", plugin.name === "t-team", plugin.name);
check("导出 inject", Array.isArray(plugin.inject) && plugin.inject.includes("tools") && plugin.inject.includes("subagents"), plugin.inject.join(","));
check("导出 Config", (typeof plugin.Config === "object" || typeof plugin.Config === "function") && typeof plugin.apply === "function");
const resolved = plugin.Config["~standard"].validate({});
check("Config 校验通过", resolved.issues === undefined);

// readPrefs 的 entry 分支（0.1.7+，无 register 只有 mutate）漏读 enabledSeedRoster 时，
// seedDefaultEnabled 会把用户停用过的专家重新打开（seen 恒为 []，基线退化回 enabled）。
// 2026-09-29 修，这里用源码断言防回归（entry 模式在 verify 里走不到 scope mock）。
{
  const hostSrc = readFileSync(join(HERE, "lib", "index.js"), "utf8");
  check("readPrefs entry 分支读 enabledSeedRoster（防回归）",
    hostSrc.includes("enabledSeedRoster: unwrapVolatile(source.enabledSeedRoster)"));
}
const config = resolved.value ?? resolved;
check("root 默认指向 ~/.t-team/experts", config.root === join(homedir(), ".t-team", "experts"), config.root);
check("divisions 默认留空 = 自动发现", Array.isArray(config.divisions) && config.divisions.length === 0, JSON.stringify(config.divisions));
check("provider 默认 spawn", config.provider === "spawn", config.provider);
check("zhRoot 默认指向 ~/.t-team/zh", config.zhRoot === join(homedir(), ".t-team", "zh"), config.zhRoot);

// ---------- 2. 花名册 ----------
console.log("\n[2] 固定资产目录");
const catalogMod = await import(join(HERE, "lib/catalog.js"));
const catalog = await catalogMod.loadCatalog(ROOT, config.divisions, { zhRoot: ZH_ROOT });
// 2026-09-29：名册从 323 扩到 645 —— 323 位单文件形态 + 322 个从 WorkBuddy 导入的
// 目录形态专家包（`<分区>/<slug>/persona.md`，catalog.js 的 isExpertPack 负责识别）。
check("专家数 623", catalog.size === 623, String(catalog.size));
const conflicts = [...catalog.values()].filter((expert) => expert.conflict === true);
check("无重名冲突", conflicts.length === 0, conflicts.map((e) => e.slug).join(","));
check("自动发现 22 个分类", catalogMod.catalogDivisions(catalog).length === 22, catalogMod.catalogDivisions(catalog).join(","));
check("分类标签来自侧车数据", catalogMod.divisionOf("finance", catalog.labels).zh === "金融" && catalogMod.divisionOf("specialized", catalog.labels).zh === "专项",
  `${catalogMod.divisionOf("finance", catalog.labels).zh}/${catalogMod.divisionOf("specialized", catalog.labels).zh}`);
check("新增分类可自动带上标签", catalogMod.divisionOf("brand-new", { "brand-new": "新分类" }).zh === "新分类");
check("未知分类回退分类 key", catalogMod.divisionOf("brand-new", {}).zh === "brand-new");
check("中文侧车覆盖的 4 个分类带中文标签",
  catalogMod.divisionOf("company", catalog.labels).zh === "公司经营"
  && catalogMod.divisionOf("hr", catalog.labels).zh === "人力资源"
  && catalogMod.divisionOf("legal", catalog.labels).zh === "法务"
  && catalogMod.divisionOf("supply-chain", catalog.labels).zh === "供应链",
  ["company", "hr", "legal", "supply-chain"].map((d) => catalogMod.divisionOf(d, catalog.labels).zh).join("/"));

// 2026-09-15（用户决策）：历史上这 13 条被当作「职能重复」跳过清单挡住；现在改为**与
// agency-agents-zh 源对齐** —— 源独有的补齐、同角色的按源重命名，13 条全部落在名册里。
// 这条断言随之反转：它们必须**都在**，且分类归属与源一致。
const ALIGNED_WITH_SOURCE = [
  "marketing-xiaohongshu-operator", "marketing-ecommerce-operator", "marketing-wechat-operator",
  "support-recruitment-specialist", "hr-recruiter", "chief-of-staff", "prompt-engineer",
  "engineering-network-engineer-china", "engineering-threat-detection-engineer", "engineering-security-engineer",
  "marketing-bilibili-strategist", "specialized-pricing-optimizer", "finance-financial-forecaster",
];
const stillMissing = ALIGNED_WITH_SOURCE.filter((slug) => catalog.get(slug) === undefined);
check("与源对齐的 13 条角色都在名册里", stillMissing.length === 0, stillMissing.join(",") || "13/13 就位");
// 重命名对齐的两个分类迁移也必须落地（源把它们放在别的部门）
check("重命名对齐的分类迁移正确",
  catalog.get("chief-of-staff")?.division === "company" && catalog.get("prompt-engineer")?.division === "specialized",
  `${catalog.get("chief-of-staff")?.division} / ${catalog.get("prompt-engineer")?.division}`);

// 名册里的中国本地化角色（抽查 8 位：中文名必须对得上）
const rosterSamples = {
  "chief-technology-officer": "首席技术官（CTO）",
  "hr-performance-reviewer": "绩效管理专家",
  "legal-contract-reviewer": "合同审查专家",
  "supply-chain-route-optimizer": "物流路线优化师",
  "academic-study-planner": "学习规划师",
  "engineering-dingtalk-integration-developer": "钉钉集成开发工程师",
  "specialized-meeting-assistant": "会议效率专家",
  "testing-embedded-qa-engineer": "嵌入式测试工程师",
};
const missingSamples = Object.entries(rosterSamples).filter(([slug, zh]) => catalog.get(slug)?.nameZh !== zh);
check("抽查 8 位专家的中文名正确", missingSamples.length === 0,
  missingSamples.map(([slug, zh]) => `${slug}:${catalog.get(slug)?.nameZh ?? "缺失"}(期望 ${zh})`).join(",") || "8/8");

// 名册不是平的：既有「分区/子目录/专家.md」（game-development/unreal-engine/… 这类，15 位），
// 也有「分区/专家包名/persona.md」的目录形态（每个专家包算 1 位）。两者都必须被扫到。
const nested = [...catalog.values()].filter((expert) => String(expert.relativePath ?? "").split(/[\\/]/).length > 2);
check("嵌套与目录形态的专家都被扫到（名册不是平的）", nested.length === 315, `${nested.length} 位嵌套/目录形态`);
// source.json 是名册清单（真源计数）：它必须与扫出来的花名册一致
const sourceState = JSON.parse(await readFile(join(DATA_BASE, "source.json"), "utf8"));
check("source.json 的 expertFiles 与花名册一致", sourceState.expertFiles === catalog.size, `${sourceState.expertFiles} vs ${catalog.size}`);
check("source.json 不再记录上游来源（同步已移除）",
  sourceState.extraSource === undefined && sourceState.sourceRevision === undefined && typeof sourceState.note === "string",
  JSON.stringify(Object.keys(sourceState)));
check("source.json 记下了分类清单", Array.isArray(sourceState.divisions) && sourceState.divisions.length === 22, String(sourceState.divisions?.length));

const sample = catalog.get("engineering-platform-engineer");
check("样例专家可解析", sample !== undefined && sample.name === "Platform Engineer", sample?.name);
const body = await catalogMod.readPersona(sample, "en");
check("persona 正文可读（英文）", body.length > 1000, `${body.length} 字符`);

// 中文侧车目录
const zhNames = JSON.parse(await readFile(join(ZH_ROOT, "names.json"), "utf8"));
const zhDescriptions = JSON.parse(await readFile(join(ZH_ROOT, "descriptions.json"), "utf8"));
const zhBodies = [...catalog.values()].filter((expert) => expert.personaPathZh !== undefined).length;
// zh/ 不再从上游补译；例外有二：① 本仓自建的专家没有上游来源，中文名 / 简介手写在
// zh/names.json 与 zh/descriptions.json 里（正文仍回退英文）；② 2026-09-15 起，与
// `agency-agents-zh` 源仓库对齐时可按用户决策破例补译（那次补了 7 篇正文 + 若干改名/改写）。
check("中文名覆盖 323/323", Object.keys(zhNames).length === 323, String(Object.keys(zhNames).length));
const selfBuiltZh = { "engineering-typescript-npm-stack-maintainer": "TS/npm 开发维护者", "engineering-deepseek-harness-project-expert": "DSH 项目专家" };
check("自建专家的中文名与简介在侧车里",
  Object.entries(selfBuiltZh).every(([slug, name]) => zhNames[slug] === name && (zhDescriptions[slug] ?? "").length > 20),
  Object.keys(selfBuiltZh).filter((slug) => zhNames[slug] !== selfBuiltZh[slug]).join(",") || "2/2");
const labels = catalogMod.DIVISION_LABEL;
check("分区显示名与内置插件用词一致", labels.engineering.zh === "工程" && labels.finance.zh === "金融" && labels.marketing.zh === "营销" && labels.specialized.zh === "专项" && labels.support.zh === "支持",
  [labels.finance.zh, labels.marketing.zh, labels.specialized.zh, labels.support.zh].join("/"));
check("中文简介覆盖 323/323", Object.keys(zhDescriptions).length === 323, String(Object.keys(zhDescriptions).length));
check("中文正文覆盖 321/323（两位自建专家无译文正文，回退英文）", zhBodies === 321, String(zhBodies));
// 人工补译层（zh/manual-bodies/）里那 6 篇正文：它们是本仓手工产物，这条守住它们不被误删
const manualOnlyBodies = ["engineering-ats-validator-architect", "engineering-network-engineer-china", "engineering-pdf-engine-architect", "engineering-platform-engineer", "engineering-universal-document-compiler", "specialized-focus-music-architect"];
check("人工补译的 6 篇正文都在", manualOnlyBodies.every((slug) => catalog.get(slug)?.personaPathZh !== undefined),
  manualOnlyBodies.filter((slug) => catalog.get(slug)?.personaPathZh === undefined).join(",") || "6/6");
check("常见专家有中文名", zhNames["engineering-frontend-developer"] === "前端开发者", zhNames["engineering-frontend-developer"]);
const frontend = catalog.get("engineering-frontend-developer");
const zhBody = await catalogMod.readPersona(frontend, "zh");
const enBody = await catalogMod.readPersona(frontend, "en");
check("有译文时中文 locale 取中文正文", /[\u4e00-\u9fff]/.test(zhBody) && zhBody !== enBody, `${zhBody.length} 字符`);
// 缺译文时的回退分支：321 位有中文正文，两位自建的没有，用「去掉 personaPathZh」的同一专家对象覆盖该分支
const gapBody = await catalogMod.readPersona({ personaPath: sample.personaPath, relativePath: sample.relativePath }, "zh");
check("缺译文时回退英文正文", gapBody === body, `${gapBody.length} 字符`);
// 解析召唤目标：中文名 / 英文名 / slug 都要能命中（@ 芯片给模型的是中文名）
const geographer = catalog.get("academic-geographer");
check("地理学家 有中文名", geographer?.nameZh === "地理学家", String(geographer?.nameZh));
for (const [label, query] of [["中文名", "地理学家"], ["带 emoji 的中文名", "🗺️ 地理学家"], ["英文名", "Geographer"], ["小写+空格", "  geographer "], ["slug", "academic-geographer"]]) {
  let hit;
  try {
    hit = catalogMod.resolveExpert([...catalog.values()], query, "zh");
  } catch (error) {
    hit = undefined;
  }
  check(`召唤目标可按${label}解析`, hit?.slug === "academic-geographer", `${query} → ${hit?.slug ?? "失败"}`);
}
let unknownError = "";
try {
  catalogMod.resolveExpert([...catalog.values()], "查无此人", "zh");
} catch (error) {
  unknownError = error.message;
}
check("未知名字报错含可用示例", unknownError.includes("找不到专家") && unknownError.includes("slug"), unknownError.slice(0, 50));

const i18nMod = await import(join(HERE, "lib/i18n.js"));
const zhView = i18nMod.localized(sample, "zh");
const enView = i18nMod.localized(sample, "en");
check("localized 中文取译文", zhView.name !== enView.name && /[\u4e00-\u9fff]/.test(zhView.description), `${zhView.name} / ${enView.name}`);

// ---------- 3. apply() 契约 ----------
console.log("\n[3] apply() 注册内容");
const state = { enabled: [], enabledSeeded: true, enabledSeedVersion: 1, enabledSeedRoster: [], revision: 0 };
const tools = new Map();
const sections = [];
const provided = new Map();
const settingsCalls = [];
let settingsScope;

const fakeSettings = {
  register(ns, schema, options) {
    settingsCalls.push({ ns, options });
    settingsScope = { get: () => ({ enabled: [...state.enabled], enabledSeeded: state.enabledSeeded, enabledSeedVersion: state.enabledSeedVersion, enabledSeedRoster: [...state.enabledSeedRoster] }) };
    return settingsScope;
  },
  describe: () => [{ ns: "t-team", revision: state.revision }],
  get(ns) {
    if (ns === "locale") return { preference: "zh" };
    if (ns === "t-team") return { enabled: [...state.enabled], enabledSeeded: state.enabledSeeded, enabledSeedVersion: state.enabledSeedVersion, enabledSeedRoster: [...state.enabledSeedRoster] };
    return undefined;
  },
  async mutate(ns, ops, expectedRevision) {
    if (expectedRevision !== undefined && expectedRevision !== state.revision) {
      throw new Error(`设置冲突：期望修订 ${expectedRevision}，实际 ${state.revision}`);
    }
    for (const op of ops) {
      if (op.op === "set" && op.path.length === 1 && op.path[0] === "enabled") state.enabled = [...op.value];
      if (op.op === "set" && op.path.length === 1 && op.path[0] === "enabledSeeded") state.enabledSeeded = op.value;
      if (op.op === "set" && op.path.length === 1 && op.path[0] === "enabledSeedVersion") state.enabledSeedVersion = op.value;
      if (op.op === "set" && op.path.length === 1 && op.path[0] === "enabledSeedRoster") state.enabledSeedRoster = [...op.value];
    }
    state.revision += 1;
  },
};

let startCalls = 0;
const fakeRun = (req) => {
  startCalls += 1;
  const text = `完成：${req.prompt[0].text.slice(0, 20)}`;
  return {
    id: `run-${startCalls}`,
    result: Promise.resolve({ output: [{ type: "text", text }], stopReason: "completed" }),
    dispose: async () => {},
  };
};
const logged = { debug: [], info: [], warn: [], error: [] };
const fakeLogger = {
  debug: (line) => logged.debug.push(String(line)),
  info: (line) => logged.info.push(String(line)),
  warn: (line) => logged.warn.push(String(line)),
  error: (line) => logged.error.push(String(line)),
};
const fakeSubagents = {
  getProvider: () => ({ capabilities: { persona: true, toolFilter: true, depthLimit: true, agentOptions: false, outputSchema: false } }),
  start: async (_name, req) => fakeRun(req),
  followup: async () => {},
  sendMessage: async () => {},
};

const commands = new Map();
const preStepHandlers = [];
/** 待触发的 `ctx.inject` 回调（真 cordis 会在服务就绪后触发；这里在 ctx 构造完立即触发）。 */
const pendingInjectCallbacks = [];
/** 假作用域 ctx：真 cordis 传给 inject 回调的对象带该作用域内的服务属性 + effect/get。 */
const scopedCtx = {
  settings: fakeSettings,
  commands: { register: (definition) => { commands.set(definition.name, definition); return () => commands.delete(definition.name); } },
  skills: { register: () => () => {} },
  effect: (fn) => { const dispose = fn(); return () => { if (typeof dispose === "function") dispose(); }; },
  get: (name) => (name === "settings" ? fakeSettings : undefined),
};
const ctx = {
  logger: fakeLogger,
  settings: fakeSettings,
  subagents: fakeSubagents,
  // 真实 cordis ctx 有 get()；agents 是可选服务（官方插件写法：this.ctx.get("agents")?.get(id)）。
  // settings / commands 是**可选**服务（不能进静态 inject），插件改用 `ctx.get` 懒查 + `ctx.inject` 等就绪。
  get: (name) => {
    if (name === "agents") return { get: () => undefined };
    if (name === "settings") return fakeSettings;
    if (name === "commands") return scopedCtx.commands;
    return undefined;
  },
  tools: {
    register: (definition) => { tools.set(definition.name, definition); return () => tools.delete(definition.name); },
    // 内置团队引擎已随 T Team 模块整体下线：与真实宿主一致，这里一律查不到。
    get: () => undefined,
  },
  systemPrompt: { section: (section) => { sections.push(section); return () => {}; } },
  reflect: { provide: (name, service) => { provided.set(name, service); return () => provided.delete(name); } },
  effect: (fn) => { const dispose = fn(); return () => { if (typeof dispose === "function") dispose(); }; },
  commands: scopedCtx.commands,
  on: (event, handler) => { preStepHandlers.push(event); void handler; return () => {}; },
  // **忠实**（2026-09-13 真实 GUI 白板后补）：真 cordis 在声明的服务就绪后调回调；
  // 服务在真实宿主里通常先于本插件就绪，所以回调**同步**发生。缺了它，插件只能走
  // 「上下文没有 inject」的降级分支 → 设置段永不注册 → 面板白板。
  inject: (names, callback) => {
    if (Array.isArray(names) && (names.includes("settings") || names.includes("commands"))) pendingInjectCallbacks.push(callback);
    return () => {};
  },
};
// 服务先就绪 → 回调用作用域 ctx 调用（与真实加载顺序一致）。顺序：apply 里登记回调 → 这里触发。
function flushInjectCallbacks() {
  for (const callback of pendingInjectCallbacks.splice(0)) callback(scopedCtx);
}
// [3] 用假 ctx 走一遍 apply：任何绕过 ctx.logger 直接写 stderr 的东西都记下来。
const stderrNoise = [];
const realConsoleError = console.error;
console.error = (...args) => { stderrNoise.push(args.map((item) => String(item)).join(" ")); };
plugin.apply(ctx, config);
// `ctx.inject(["settings"], …)` 的回调：真 cordis 在服务就绪后触发（真实宿主里先于 apply 完成）。
// 桩里在 apply 登记之后再触发，语义等价：注册发生在 apply 之后、任何断言之前。
flushInjectCallbacks();
console.error = realConsoleError;
check("加载期没有任何东西直接写 stderr（日志一律走 ctx.logger）",
  stderrNoise.length === 0, stderrNoise.join(" | ").slice(0, 80) || "clean");
check("自检数据源优先包内快照（干净 clone 上也能跑）",
  process.env.T_TEAM_DATA !== undefined || DATA_BASE === join(HERE, "data"), DATA_BASE.replace(HERE, "<pkg>"));
check("注册 4 个名册工具（列名册 / 召唤单个 / 批量召唤 / 拉取附件）", tools.size === 4 && ["list_t_experts", "summon_t_expert", "summon_t_experts", "fetch_expert_assets"].every((n) => tools.has(n)), [...tools.keys()].join(","));
check("工具名与同类专家插件不冲突", ["list_t_experts", "summon_t_expert", "summon_t_experts", "fetch_expert_assets"].every((n) => tools.has(n)));

// 云端附件的 persona 路径改写（2026-09-29）：正文里的 `skills/xxx/SKILL.md` 这类**相对路径**
// 基准是「会话工作目录」而不是专家包目录 —— 模型照抄去 Read 必然落空（实测 645 位里 126 位
// 的正文引用了资源路径）。所以召唤前要改写成包内绝对路径。这里用临时目录构造确定性输入，
// 不依赖真实名册里某个包的附件还在不在本地（它们可能已经上云）。
{
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { annotatePersona, ASSET_DIRS } = await import(join(HERE, "lib", "fetch-assets.js"));
  const tmp = mkdtempSync(join(tmpdir(), "t-team-annotate-"));
  mkdirSync(join(tmp, "skills", "demo"), { recursive: true });
  writeFileSync(join(tmp, "skills", "demo", "SKILL.md"), "x");
  const out = annotatePersona({
    text: [
      "读 `skills/demo/SKILL.md`（存在）与 `skills/missing/SKILL.md`（不存在）。",
      "别人的路径不能动：`~/.workbuddy/skills-marketplace/skills/demo/SKILL.md`。",
    ].join("\n"),
    packDir: tmp,
    slug: "demo-expert",
    remote: true,
  });
  check("附件路径改写：存在的改成绝对路径、不存在的原样保留",
    out.includes(`\`${tmp}/skills/demo/SKILL.md\``) && out.includes("`skills/missing/SKILL.md`"),
    out.split("\n")[3] ?? "(空)");
  check("附件路径改写：不动 `~/.workbuddy/...` 那类别人的路径",
    out.includes("~/.workbuddy/skills-marketplace/skills/demo/SKILL.md"));
  check("附件路径改写：顶部补上资源目录与拉取工具说明",
    out.includes(tmp) && out.includes('fetch_expert_assets("demo-expert")'));
  check("附件目录清单非空（改写只认这些前缀）", Array.isArray(ASSET_DIRS) && ASSET_DIRS.includes("skills"));
  // 带 CLI 的专家（包内有 bin/）：DSH 不像 WorkBuddy 那样把包内 bin/ 挂进 PATH，
  // 而正文写的是裸命令名 —— 必须补一段说明，否则模型照正文调 `cpq ...` 就是 command not found。
  const withBin = annotatePersona({ text: "（正文）", packDir: tmp, slug: "demo-expert", remote: false, hasBin: true });
  check("带 bin/ 的专家：说明里点明「CLI 不在 PATH，要用绝对路径」",
    withBin.includes(`${tmp}/bin/`) && withBin.includes("PATH"), withBin.split("\n")[2] ?? "(空)");
  const withoutBin = annotatePersona({ text: "（正文）", packDir: tmp, slug: "demo-expert", remote: false, hasBin: false });
  check("没有 bin/ 的专家：不补那段（避免噪音）", !withoutBin.includes("可执行脚本"));
  rmSync(tmp, { recursive: true, force: true });
}
// 远端清单（roster.json 放 OBS）：只更新专家、不动插件时的清单来源。
// 安全校验必须严格 —— 远端清单能指挥客户端下载任意 URL，任何非法内容都该被拒或回退。
{
  const { sanitizeRemoteRoster, fetchRemoteRoster, readCachedRoster, writeCachedRoster } = await import(join(HERE, "lib", "fetch-assets.js"));
  const hex = (ch) => String(ch).repeat(64);
  const BASE = "https://aitoolsdata.obs.cn-south-4.myhuaweicloud.com/agetn";
  const bundled = {
    baseUrl: BASE,
    packs: {
      "academic/demo-a": { division: "academic", slug: "demo-a", path: "packs/academic/demo-a.tar.gz", bytes: 10, sha256: hex("a"), dirs: ["skills"] },
      "academic/demo-b": { division: "academic", slug: "demo-b", path: "packs/academic/demo-b.tar.gz", bytes: 10, sha256: hex("b"), dirs: ["skills"] },
    },
  };
  const good = {
    baseUrl: BASE,
    packs: {
      "academic/demo-a": { path: "packs/academic/demo-a.tar.gz", bytes: 20, sha256: hex("c"), dirs: ["skills"] },
    },
  };
  const s = sanitizeRemoteRoster(good, bundled);
  check("远端清单：合法条目通过、baseUrl 保持",
    s !== undefined && s.baseUrl === BASE && s.packs["academic/demo-a"]?.bytes === 20,
    JSON.stringify(s ?? null).slice(0, 120));
  check("远端清单：baseUrl 被篡改 → 整份拒绝",
    sanitizeRemoteRoster({ ...good, baseUrl: "https://evil.example.com/x" }, bundled) === undefined);
  check("远端清单：path 是 ../ 穿越 → 跳过",
    sanitizeRemoteRoster({ baseUrl: BASE, packs: { "academic/x": { path: "../../etc/passwd", bytes: 1, sha256: hex("d"), dirs: ["skills"] } } }, bundled)?.packs?.["academic/x"] === undefined);
  check("远端清单：path 形态不符 → 跳过",
    sanitizeRemoteRoster({ baseUrl: BASE, packs: { "academic/x": { path: "packs/academic/x.zip", bytes: 1, sha256: hex("d"), dirs: ["skills"] } } }, bundled)?.packs?.["academic/x"] === undefined);
  check("远端清单：sha256 非 64 位 hex → 跳过",
    sanitizeRemoteRoster({ baseUrl: BASE, packs: { "academic/x": { path: "packs/academic/x.tar.gz", bytes: 1, sha256: "not-hex", dirs: ["skills"] } } }, bundled)?.packs?.["academic/x"] === undefined);
  check("远端清单：bytes 超上限（>2GB）→ 跳过",
    sanitizeRemoteRoster({ baseUrl: BASE, packs: { "academic/x": { path: "packs/academic/x.tar.gz", bytes: 3 * 1024 * 1024 * 1024, sha256: hex("d"), dirs: ["skills"] } } }, bundled)?.packs?.["academic/x"] === undefined);
  // 上限必须是 2GB 而不是 200MB：roster 里真实存在 495.6 MB 的包
  // （finance/vietnam-finance-tax-expert，519652844 字节），按 200MB 会把它整条误拒。
  check("远端清单：495 MB 的大包必须放行（上限不能按 200MB）",
    sanitizeRemoteRoster({ baseUrl: BASE, packs: { "finance/legit": { path: "packs/finance/legit.tar.gz", bytes: 519652844, sha256: hex("e"), dirs: ["agents", "references"] } } }, bundled)?.packs?.["finance/legit"]?.bytes === 519652844);
  check("远端清单：dirs 含 ../ 或斜杠 → 跳过",
    sanitizeRemoteRoster({ baseUrl: BASE, packs: { "academic/x": { path: "packs/academic/x.tar.gz", bytes: 1, sha256: hex("d"), dirs: ["../evil"] } } }, bundled)?.packs?.["academic/x"] === undefined);
  {
    // 条目数上限：包内 2 条 + 200 余量 = 202。塞 205 条应整份拒绝。
    const flood = { baseUrl: BASE, packs: {} };
    for (let i = 0; i < 205; i += 1) {
      flood.packs[`academic/flood-${i}`] = { path: `packs/academic/flood-${i}.tar.gz`, bytes: 1, sha256: hex(String(i % 10)), dirs: ["skills"] };
    }
    check("远端清单：条目数超上限 → 整份拒绝", sanitizeRemoteRoster(flood, bundled) === undefined);
  }
  {
    // fetchRemoteRoster：mock fetch 覆盖合法 / 非法 / 异常三种。
    const ok = await fetchRemoteRoster(bundled, async () => ({ ok: true, status: 200, text: async () => JSON.stringify(good) }));
    check("远端拉取：合法响应 → 通过并保留条目", ok !== undefined && ok.packs["academic/demo-a"]?.bytes === 20);
    const bad = await fetchRemoteRoster(bundled, async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ ...good, baseUrl: "https://evil.example.com/x" }) }));
    check("远端拉取：非法 baseUrl → undefined", bad === undefined);
    const boom = await fetchRemoteRoster(bundled, async () => { throw new Error("网络断了"); });
    check("远端拉取：网络异常 → undefined", boom === undefined);
    const httpErr = await fetchRemoteRoster(bundled, async () => ({ ok: false, status: 500, text: async () => "oops" }));
    check("远端拉取：非 2xx → undefined", httpErr === undefined);

    // 缓存读写：往返一致 + 坏数据返回 undefined。
    const cacheDir = mkdtempSync(join(tmpdir(), "t-team-roster-cache-"));
    const cachePath = join(cacheDir, "roster-cache.json");
    await writeCachedRoster(cachePath, good);
    const back = await readCachedRoster(cachePath);
    check("清单缓存：写入再读回一致",
      back !== undefined && typeof back.fetchedAt === "number" && back.roster.packs["academic/demo-a"]?.bytes === 20);
    writeFileSync(join(cacheDir, "no-packs.json"), JSON.stringify({ fetchedAt: Date.now(), roster: { baseUrl: BASE } }));
    check("清单缓存：缺 packs → undefined", (await readCachedRoster(join(cacheDir, "no-packs.json"))) === undefined);
    writeFileSync(join(cacheDir, "bad.json"), "not json");
    check("清单缓存：坏 JSON → undefined", (await readCachedRoster(join(cacheDir, "bad.json"))) === undefined);
    writeFileSync(join(cacheDir, "no-fetchedat.json"), JSON.stringify({ roster: { packs: {} } }));
    check("清单缓存：缺 fetchedAt → undefined", (await readCachedRoster(join(cacheDir, "no-fetchedat.json"))) === undefined);
    rmSync(cacheDir, { recursive: true, force: true });

    // 并集合并：远端可能比包内旧，直接替换会让「包内独有的条目」查不到 → 那位专家的附件永远拿不到
    // （2026-09-29 实测 finance/vietnam-finance-tax-expert 的 495.6 MB 就是这么丢的）。
    const { mergeRosters } = await import(join(HERE, "lib", "fetch-assets.js"));
    const remoteOnly = { baseUrl: BASE, packs: { "academic/demo-a": { division: "academic", slug: "demo-a", path: "packs/academic/demo-a.tar.gz", bytes: 99, sha256: hex("e"), dirs: ["skills"] } } };
    const mergedR = mergeRosters(bundled, remoteOnly);
    check("清单合并：远端同名条目覆盖包内", mergedR.packs["academic/demo-a"]?.bytes === 99);
    check("清单合并：包内独有条目保留（远端更旧时不丢）", mergedR.packs["academic/demo-b"]?.bytes === 10);
    check("清单合并：远端为 undefined 时原样返回包内", mergeRosters(bundled, undefined) === bundled);
    check("清单合并：两边都有时以远端为准且不丢包内其它条目",
      Object.keys(mergeRosters(bundled, remoteOnly).packs).length === 2);
  }
}
check("注册 1 个系统提示段（专家名册）",
  sections.length === 1 && sections[0]?.name === "t-team:experts",
  sections.map((item) => item.name).join(","));
check("提示段 order = 118（与宿主其它段错开）",
  sections.every((item) => item.order === 118),
  sections.map((item) => item.order).join(","));
check("settings.register 用 t-team 命名空间", settingsCalls[0]?.ns === "t-team", JSON.stringify(settingsCalls.map((c) => c.ns)));
check("provide tTeamCatalog 服务", provided.has("tTeamCatalog"));
check("不再注册任何 /t 命令（随团队引擎下线）", commands.size === 0, [...commands.keys()].join(",") || "(无)");

console.log("\n[3d] 可配置项与配置错误");
{
  const makeCtx = (onPlugin) => {
    const record = { tools: new Map(), sections: [], commands: new Map(), provided: new Map(), injectCallbacks: [] };
    const contractSubagents = {
      getProvider: () => ({ prepareContinuable: () => {}, capabilities: { persona: true, toolFilter: true } }),
      list: () => [],
      startContinuable: () => ({ childId: "c" }),
      sendMessage: async () => {},
      interrupt: () => {},
      drainContinuableChildren: async () => {},
      followup: async () => {},
      [Symbol.for("dsh.subagent.deliverPrompt")]: async (_parent, _childId, _content, _source, _signal, _delivery) => {},
    };
    const fakeSettings = {
      register: () => ({ get: () => ({ enabled: [], enabledSeeded: true, enabledSeedVersion: 1 }) }),
      describe: () => [{ ns: "t-team", revision: 0 }],
      get: (ns) => (ns === "locale" ? { preference: "zh" } : { enabled: [], enabledSeeded: true, enabledSeedVersion: 1 }),
      mutate: async () => {},
    };
    const fakeCommands = { register: (definition) => { record.commands.set(definition.name, definition); return () => {}; } };
    const fakeCtx = {
      logger: { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} },
      agents: { get: () => undefined, list: () => [] },
      subagents: contractSubagents,
      // 真 cordis ctx 的懒查（settings / commands 是可选服务，插件用 `ctx.get` 取）。
      // `agents` 也走 `ctx.get`（成员活动用它）：桩必须与真 ctx 一样两种取法都能解析，
      // 否则「缺服务就降级」的路径会被假绿，掩盖属性访问那类崩溃。
      get: (name) => (name === "settings" ? fakeSettings : name === "commands" ? fakeCommands : name === "agents" ? { get: () => undefined } : undefined),
      settings: fakeSettings,
      tools: {
        register: (definition) => { record.tools.set(definition.name, definition); return () => {}; },
        get: (name) => record.tools.get(name),
        restrict: () => () => {},
      },
      systemPrompt: { section: (section) => { record.sections.push(section); return () => {}; } },
      reflect: { provide: (name, service) => { record.provided.set(name, service); return () => {}; } },
      effect: (fn) => { const dispose = fn(); return () => { if (typeof dispose === "function") dispose(); }; },
      on: () => () => {},
      // `inject` 必须**忠实**：真 cordis 在声明的服务就绪后调回调。真实宿主里 settings 通常比
      // 本插件先就绪，所以这里是**同步**回调（放在 plugin() 里、apply 之前触发）。
      // 插件靠它等 settings 就绪再注册设置段——不能用 ctx.get 同步探测（服务可能还没到，
      // 且 cordis 的 provide 不回溯通知；2026-09-13 真实 GUI 白板就是这么来的）。
      inject: (names, callback) => {
        if (Array.isArray(names) && (names.includes("settings") || names.includes("commands"))) record.injectCallbacks.push(callback);
        return () => {};
      },
      commands: fakeCommands,
      plugin: (pluginObject, pluginConfig) => {
        onPlugin?.(pluginObject, pluginConfig);
        // 服务先就绪 → 回调先跑 → 插件 apply 时设置段已经可以注册（与真实加载顺序一致）。
        for (const callback of record.injectCallbacks.splice(0)) callback(fakeCtx);
        if (typeof pluginObject?.apply === "function") pluginObject.apply(fakeCtx, pluginConfig ?? {});
        return () => {};
      },
    };
    return { fakeCtx, record };
  };

  // (a) 原先的模块常量现在都是 Config 字段
  check("召唤上限/并发/任务长度/简介截断都是 Config 字段",
    config.maxSummonBatch === 8 && config.summonConcurrency === 4
    && config.summonTaskMaxChars === 8000 && config.descriptionLimit === 120,
    [config.maxSummonBatch, config.summonConcurrency, config.summonTaskMaxChars, config.descriptionLimit].join("/"));

  // (b) 提示段里的数字必须跟随实际配置，不许写死字面量
  const { fakeCtx: ctxB, record: recordB } = makeCtx();
  plugin.apply(ctxB, { ...config, maxSummonBatch: 2 });
  {
    // 提示段是**模型可见的事实**，所以名册规模与批量上限都不许写死：
    //  - 名册增删后规模字面量会对模型说谎（2026-09-13 定性的恒存缺陷之一）；
    //  - 用户把 maxSummonBatch 调大后，写死的「at most 8」会让模型自我限流到 8。
    // 下面第二条用 override 成 2 的配置来证伪：写死 8 就必红。
    const expertsSection = recordB.sections.find((section) => section.name === "t-team:experts");
    const promptText = expertsSection?.text?.({ agent: undefined }) ?? "";
    // 期望值必须用**与插件同一个口径**（catalog.countExperts 数专家条目），不能数 `.md` 总数：
    // 附件里的 agents/*.md、skills/**/SKILL.md 不是专家。旧断言两边都数 .md，恰好同错同对，
    // 于是「提示段把 645 位说成 6838 位」这件事一路绿灯到 2026-09-29 附件上云才暴露。
    const { experts: pkgExperts, divisions: pkgDivisions } = catalogMod.countExperts(join(HERE, "data", "experts"));
    check("专家提示段里的名册规模 = 包内快照真实规模（现算，不是写死的字面量）",
      promptText.includes(`${pkgExperts}-expert`) && promptText.includes(`${pkgDivisions}-division`),
      promptText.split("\n")[1] ?? "(空)");
    check("专家提示段里的批量上限跟随 Config.maxSummonBatch（override 2 时必须是 2）",
      promptText.includes("at most 2"), (promptText.match(/at most \d+/u) ?? ["(缺)"])[0]);
  }
}

// ---------- 4. 工具执行 ----------
console.log("\n[4] 工具执行");
const listTool = tools.get("list_t_experts");
const exec = { agent: { id: "parent-agent" }, signal: new AbortController().signal };

// 默认全启用（2026-09-16 用户要求）：只要还没按当前策略播种过，就把全部可用专家写进 enabled。
// 这里把 state 摆回「从未播种」态，触发一次 ensureReady 后断言播种结果。
state.enabled = [];
state.enabledSeeded = false;
state.enabledSeedVersion = 0;
await listTool.execute({});
check("首次运行默认启用全部专家", state.enabledSeedVersion === 1 && state.enabled.length > 0,
  JSON.stringify({ version: state.enabledSeedVersion, count: state.enabled.length }));
// 场景 2：老用户 —— 升级前 enabled 里已有部分记录，且旧布尔标记早就被置成 true，
// 而且**那时还没有 enabledSeedRoster 这个字段**（它随本次改动才引入，老数据里必然缺席）。
// 这正是用户实际报的 bug：拿「名单非空」当挡箭牌，老用户永远停在部分启用。
// 现在判据是名册基线；基线缺席时以现有 enabled 当基线，于是新名册里没见过的都算新增。
state.enabled = ["engineering-platform-engineer", "design-ui-designer"];
state.enabledSeeded = true;
state.enabledSeedVersion = 0;
state.enabledSeedRoster = [];
await listTool.execute({});
check("老用户（已有部分启用 + 旧布尔已 true）也会补齐为全部",
  state.enabledSeedVersion === 1 && state.enabled.length > 2 && state.enabled.includes("academic-geographer"),
  JSON.stringify({ version: state.enabledSeedVersion, count: state.enabled.length }));
// 场景 3：播种之后再启动不得覆盖用户自己的选择（版本号已追上）。
state.enabled = ["engineering-platform-engineer"];
await listTool.execute({});
check("播种过之后不再覆盖用户自己的选择",
  state.enabled.length === 1 && state.enabled[0] === "engineering-platform-engineer", JSON.stringify(state.enabled));
// 场景 4（2026-09-29 修复）—— **名册新增**：只把新出现的补进 enabled，用户停用过的保持停用。
// 这正是导入 322 位 WorkBuddy 专家后「面板显示 645、@ 菜单只有 323」的根因场景：老用户的
// enabledSeedVersion 早已追上，旧实现直接 return，新专家永远进不了名单。
{
  const all = [...state.enabledSeedRoster];
  const kept = all[0];
  const newcomer = all[1];          // 假装上次的名册里还没有它
  state.enabled = [kept];           // 用户只启用了第一位
  state.enabledSeedVersion = 1;     // 版本号早已追上 —— 旧实现就是死在这条上
  state.enabledSeedRoster = all.filter((slug) => slug !== newcomer);
  await listTool.execute({});
  check("名册新增的专家自动补入启用名单（用户自己的启停不受影响）",
    state.enabled.length === 2 && state.enabled.includes(newcomer) && state.enabled.includes(kept),
    JSON.stringify({ count: state.enabled.length, newcomer: state.enabled.includes(newcomer) }));
}
// 恢复成「已按当前策略播种 + 空名单」，让下面「未启用」这条老路径继续按显式名单语义测。
state.enabled = [];
state.enabledSeedVersion = 1;
state.revision = 0;

let listed = await listTool.execute({});
check("未启用时 total=0", listed.total === 0, String(listed.total));
const emptyText = listTool.output.render({}, listed)[0].text;
check("未启用时给出提示", emptyText.includes("启用"), emptyText.slice(0, 40));

state.enabled = ["engineering-platform-engineer", "security-architect", "design-ui-designer"];
state.revision += 1;
listed = await listTool.execute({});
check("启用后 total=3", listed.total === 3, String(listed.total));
check("按分区分组", listed.divisions.length === 3, JSON.stringify(listed.divisions.map((d) => d.division)));

const filtered = await listTool.execute({ division: "engineering" });
check("按分区过滤命中 1 位", filtered.total === 1, String(filtered.total));
const filteredText = listTool.output.render({ division: "engineering" }, filtered)[0].text;
check("分区文本含中文专家名与简介", filteredText.includes("平台工程专家") && filteredText.includes("—"), filteredText.split("\n")[1]?.slice(0, 50));

// 召唤
const summon = tools.get("summon_t_expert");
const result = await summon.execute({ expert: "Platform Engineer", task: "评估现有 CI 平台" }, exec);
check("召唤成功返回 answer（专家名为中文）", result.expert === "平台工程专家" && result.answer.startsWith("完成："), `${result.expert} / ${result.answer}`);
check("summon render 只回 answer", summon.output.render({}, result)[0].text === result.answer);
check("传了 persona 与 toolFilter", startCalls === 1);

let disabledError = "";
try {
  await summon.execute({ expert: "Security Architect's peer", task: "x" }, exec);
} catch (error) {
  disabledError = error.message;
}
check("未启用/找不到的专家报错", disabledError !== "", disabledError.slice(0, 60));

state.enabled = [...state.enabled, "agentic-identity-trust"];
state.revision += 1;
let disabledMsg = "";
try {
  await summon.execute({ expert: "Agentic Identity & Trust Architect", task: "审计 token 设计" }, exec);
} catch (error) {
  disabledMsg = error.message;
}
check("已启用专家可召唤", disabledMsg === "", disabledMsg.slice(0, 60));

// 端到端：@ 芯片给的是中文名，召唤必须能用中文名命中
state.enabled = [...state.enabled, "academic-geographer"];
state.revision += 1;
const byChinese = await summon.execute({ expert: "地理学家", task: "什么是喀斯特地貌" }, exec);
check("用中文名召唤成功", byChinese.expert === "地理学家" && byChinese.answer.startsWith("完成："), `${byChinese.expert} / ${byChinese.answer}`);
const byEmoji = await summon.execute({ expert: "🗺️ 地理学家", task: "再讲一遍" }, exec);
check("用带 emoji 的中文名召唤成功", byEmoji.expert === "地理学家", byEmoji.expert);

const batch = tools.get("summon_t_experts");
const batchResult = await batch.execute({
  experts: [
    { expert: "Platform Engineer", task: "任务 A" },
    { expert: "不存在的专家", task: "任务 B" },
  ],
}, exec);
check("批量返回部分失败", batchResult.results.length === 2 && batchResult.results[0].ok === true && batchResult.results[1].ok === false,
  JSON.stringify(batchResult.results.map((r) => r.ok)));
const batchText = batch.output.render({}, batchResult)[0].text;
check("批量文本渲染成功/失败", batchText.includes("成功 1") && batchText.includes("失败 1"), batchText.split("\n")[0]);

// ---------- 4b. 名册热更新（数据变了自动重载，无需重启） ----------
console.log("\n[4b] 名册热更新");
{
  const { mkdtemp, mkdir, writeFile, utimes } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const tempRoot = await mkdtemp(join(tmpdir(), "t-team-hot-"));
  const tempZh = join(tempRoot, "zh");
  await mkdir(join(tempRoot, "academic"), { recursive: true });
  await mkdir(tempZh, { recursive: true });
  const persona = (name) => `---\nname: ${name}\ndescription: 测试用专家\n---\n\n# ${name}\n\n正文。\n`;
  await writeFile(join(tempRoot, "academic", "academic-one.md"), persona("One"));
  await writeFile(join(tempZh, "names.json"), JSON.stringify({ "academic-one": "一号" }));

  const provided = new Map();
  let scope;
  const hotSettings = {
    register: (ns, schema, options) => { scope = { get: () => ({ enabled: [], enabledSeeded: true, enabledSeedVersion: 1 }) }; return scope; },
    describe: () => [{ ns: "t-team", revision: 0 }],
    get: (ns) => (ns === "locale" ? { preference: "zh" } : { enabled: [], enabledSeeded: true, enabledSeedVersion: 1 }),
    mutate: async () => {},
  };
  const hotCommands = { register: () => () => {} };
  const hotCtx = {
    settings: hotSettings,
    subagents: { getProvider: () => undefined, start: async () => { throw new Error("n/a"); } },
    tools: { register: () => () => {}, get: () => undefined },
    systemPrompt: { section: () => () => {} },
    reflect: { provide: (name, service) => { provided.set(name, service); return () => {}; } },
    effect: (fn) => { fn(); return () => {}; },
    commands: hotCommands,
    // 真 cordis ctx 的懒查：settings / commands 是可选服务，插件按 `ctx.get("…")` 取。
    get: (name) => (name === "settings" ? hotSettings : name === "commands" ? hotCommands : undefined),
    // 忠实：真 cordis 用作用域 ctx 调 inject 回调（插件靠它等 settings 就绪再注册设置段）。
    inject: (names, callback) => {
      if (Array.isArray(names) && (names.includes("settings") || names.includes("commands")))
        callback({ settings: hotSettings, commands: hotCommands, effect: (fn) => fn(), get: (name) => (name === "settings" ? hotSettings : name === "commands" ? hotCommands : undefined) });
      return () => {};
    },
    on: () => () => {},
    plugin: () => () => {},
  };
  const hotConfig = { ...config, root: tempRoot, zhRoot: tempZh, divisions: [] };
  plugin.apply(hotCtx, hotConfig);
  const service = provided.get("tTeamCatalog");
  const first = await service.snapshot();
  // 2026-09-13 起 seedData **按条目同步**：这个临时 root 在 apply 时会被补齐包内名册，
  // 所以「初始 1 位」不再是契约。契约是：用户自己那位在场、中文名可读，且新增后**增量**可见。
  const hotBaseline = first.experts.length;
  check("热更新：初始基线含包内名册与用户自己的那位，且取到中文名",
    hotBaseline >= 2 && first.experts.some((e) => e.name === "一号"),
    `${hotBaseline} 位 / ${first.experts.find((e) => e.name === "一号")?.name ?? "(缺一号)"}`);

  // 模拟 sync.sh：新增一位专家 + 重写中文侧车，然后把 mtime 推后
  await writeFile(join(tempRoot, "academic", "academic-two.md"), persona("Two"));
  await writeFile(join(tempZh, "names.json"), JSON.stringify({ "academic-one": "一号", "academic-two": "二号" }));
  const future = new Date(Date.now() + 4000);
  await utimes(join(tempRoot, "academic"), future, future);
  await utimes(join(tempRoot, "academic", "academic-two.md"), future, future);
  await utimes(join(tempZh, "names.json"), future, future);

  const second = await service.snapshot();
  check("热更新：新增专家后无需重启即可见",
    second.experts.length === hotBaseline + 1 && second.experts.some((e) => e.name === "二号"),
    `${second.experts.length} / 基线 ${hotBaseline}`);
  const prompt = await service.prompt("academic-two", "academic");
  check("热更新：新专家 persona 可读", prompt.prompt.includes("正文"), prompt.prompt.slice(0, 20).replace(/\n/g, " "));

  // 给某位专家**新增**一篇中文正文（运行期真正读的是 zh/<分区>/<slug>.md）必须触发重载：
  // 旧指纹只看 names/descriptions/divisions 三个 JSON 与 root 的分区目录，
  // 于是"只补正文、没动 JSON"这条最常见的补译操作不会重载，召唤时继续读英文。
  const chineseBody = "---\nname: Two\n---\n\n# 补译正文\n\n中文人工正文，用于验证热重载。\n";
  const { mkdir: mkdirZh } = await import("node:fs/promises");
  await mkdirZh(join(tempZh, "academic"), { recursive: true });
  await writeFile(join(tempZh, "academic", "academic-two.md"), chineseBody);
  const later = new Date(Date.now() + 9000);
  await utimes(join(tempZh, "academic"), later, later);
  await utimes(join(tempZh, "academic", "academic-two.md"), later, later);
  const zhPrompt = await service.prompt("academic-two", "academic");
  check("热更新：新增 zh/<分区> 中文正文后按指纹重载（不再继续读英文）",
    zhPrompt.prompt.includes("中文人工正文"), zhPrompt.prompt.slice(0, 24).replace(/\n/g, " "));

  // 反向：删掉中文正文后也要回到英文（同样只有目录 mtime 会变）
  rmSync(join(tempZh, "academic", "academic-two.md"));
  const removed = new Date(Date.now() + 12000);
  await utimes(join(tempZh, "academic"), removed, removed);
  const enPrompt = await service.prompt("academic-two", "academic");
  check("热更新：移除中文正文后回退英文",
    !enPrompt.prompt.includes("中文人工正文"), enPrompt.prompt.slice(0, 24).replace(/\n/g, " "));
}

// ---------- 5. remote 服务 ----------
console.log("\n[5] remote 服务");
const remoteMod = await import(join(HERE, "lib/remote.js"));
const registeredDescriptors = [];
const root = new Context();
root.reflect.provide("settings", fakeSettings);
root.reflect.provide("typert", { register: (descriptor) => { registeredDescriptors.push(descriptor); } });
root.reflect.provide("tTeamCatalog", provided.get("tTeamCatalog"));
const RemoteClass = remoteMod.default;
const remote = new RemoteClass(root);

const { remoteMethods } = await import("@deepseek-ai/dsh-typert-protocol");
const markers = remoteMethods(remote);
check("方法与描述符一一对应", markers.length >= 3 && markers.length === registeredDescriptors[0]?.invocations?.length, markers.map((m) => m.method).join(","));
check("描述符已交给 typert", registeredDescriptors.length === 1 && registeredDescriptors[0].invocations.length >= 3,
  JSON.stringify(registeredDescriptors[0]?.invocations?.map((i) => i.id)));
check("描述符 id 前缀正确", registeredDescriptors[0].invocations[0].id === "dsh-expert#tTeam/getCatalog", registeredDescriptors[0].invocations[0].id);

const snapshot = await remote.getCatalog();
check("getCatalog 返回 623 位", snapshot.experts.length === 623, String(snapshot.experts.length));

// locale 描述里的名册数必须与实际一致 —— 否则中/英文插件描述会显示过时的「N 位专家」
// （2026-09-29 就漏过一次：package.json 英文改到 623，locale/zh.json、en.json 仍写 323）。
{
  const zhDesc = JSON.parse(readFileSync(join(HERE, "locale", "zh.json"), "utf8")).meta?.description ?? "";
  const enDesc = JSON.parse(readFileSync(join(HERE, "locale", "en.json"), "utf8")).meta?.description ?? "";
  const zhN = /\d+(?= 位专家)/.exec(zhDesc)?.[0];
  const enN = /(\d+)-expert/.exec(enDesc)?.[1];
  const actual = snapshot.experts.length;
  check("locale 描述里的名册数 = 实际名册数",
    Number(zhN) === actual && Number(enN) === actual,
    `zh=${zhN ?? "?"} en=${enN ?? "?"} 实际=${actual}`);
}
const plat = snapshot.experts.find((e) => e.slug === "engineering-platform-engineer");
check("快照 name 为中文、nameEn 为英文", plat.name === "平台工程专家" && plat.nameEn === "Platform Engineer", `${plat.name} / ${plat.nameEn}`);
check("getCatalog 带 enabled 与 revision", Array.isArray(snapshot.enabled) && typeof snapshot.revision === "number", JSON.stringify({ enabled: snapshot.enabled.length, revision: snapshot.revision }));



let conflict = "";
try {
  await remote.setEnabled(["nope"], state.revision);
} catch (error) {
  conflict = error.message;
}
check("setEnabled 拒绝未知 slug", conflict.includes("未知"), conflict.slice(0, 50));

const nextRevision = state.revision;
const enabled = await remote.setEnabled(["engineering-platform-engineer"], nextRevision);
check("setEnabled 成功并回写修订号", enabled.enabled.length === 1 && enabled.revision === nextRevision + 1, JSON.stringify(enabled));

const prompt = await remote.getPrompt("engineering-platform-engineer", "engineering");
check("getPrompt 返回 persona 正文", prompt.prompt.length > 1000, `${prompt.prompt.length} 字符`);

// ---------- 5d. 技能开关（原 dsh-plugin-skill-gate）----------
console.log("\n[5d] 技能开关");
/* ---- 技能开关（2026-09-28 从 dsh-plugin-skill-gate 并入，断言一并搬过来）---- */
const { overlaySkill, projectCatalog, sanitizeDisabled } = await import(join(HERE, "lib/skill-gate/overlay.js"));
const { mergeSkillLists, parseFrontmatterScalars, scanSkillRoots } = await import(join(HERE, "lib/skill-gate/discover.js"));
const { parseStore, readStore, serializeStore, writeStore } = await import(join(HERE, "lib/skill-gate/store.js"));
const { MAX_VIEWS, snapshotSchema, viewRowSchema } = await import(join(HERE, "lib/skill-gate/remote-schemas.js"));
// 临时目录与文件读写（store 往返、磁盘扫描那两条要用）
const sgFs = await import("node:fs/promises");
const sgTmpdir = (await import("node:os")).tmpdir;

const sg_sample = [
  {
    name: "keep-me",
    description: "stay visible",
    invocation: { modelInvocable: true, userInvocable: true },
    source: "user-dsh",
    provider: "filesystem",
  },
  {
    name: "gate-me",
    description: "should drop from catalog",
    invocation: { modelInvocable: true, userInvocable: true },
    source: "user-dsh",
    provider: "filesystem",
  },
  {
    name: "native-off",
    description: "already disabled in frontmatter",
    invocation: { modelInvocable: false, userInvocable: true },
    source: "bundled",
    provider: "filesystem",
  },
];

const sg_disabled = new Set(["gate-me"]);
const sg_gated = overlaySkill(sg_sample[1], sg_disabled);
check("技能开关：关掉的技能 modelInvocable=false", sg_gated.invocation.modelInvocable === false);
check("技能开关：关掉的技能仍 userInvocable", sg_gated.invocation.userInvocable === true);
check("技能开关：未关的技能原样返回", overlaySkill(sg_sample[0], sg_disabled) === sg_sample[0]);
check("技能开关：原生关闭不会被 overlay 打开", overlaySkill(sg_sample[2], new Set()).invocation.modelInvocable === false);

const sg_projected = projectCatalog(sg_sample, sg_disabled);
check("技能开关：投影计数 total=3", sg_projected.counts.total === 3);
check("技能开关：投影计数 modelVisible=1", sg_projected.counts.modelVisible === 1);
check("技能开关：投影计数 sg_gated=1", sg_projected.counts.gated === 1);
check("技能开关：投影计数 nativeOff=1", sg_projected.counts.nativeOff === 1);
check("技能开关：三类互斥相加等于总数", sg_projected.counts.modelVisible + sg_projected.counts.gated + sg_projected.counts.nativeOff === sg_projected.counts.total);

/* —— 视角：并集仍是管理用清单，视角让面板能按「谁在读」回看 —— */
const sg_views = [
  { key: "host", kind: "host", skills: [sg_sample[0]] },
  { key: "preset:demo", kind: "preset", name: "demo", skills: sg_sample },
  { key: "disk", kind: "disk", skills: [] },
];
const sg_viewed = projectCatalog(sg_sample, sg_disabled, sg_views);
check("技能开关：行级 sg_views 记住所属视角", sg_viewed.skills.find((row) => row.name === "keep-me").views.join(",") === "host,preset:demo");
check("技能开关：只在 preset 里的行不带 host", sg_viewed.skills.find((row) => row.name === "gate-me").views.join(",") === "preset:demo");
check("技能开关：视角统计按并集行回算", sg_viewed.views[1].total === 3 && sg_viewed.views[1].modelVisible === 1);
check("技能开关：空视角统计为 0", sg_viewed.views[2].total === 0 && sg_viewed.views[2].modelVisible === 0);
check("技能开关：视角 name 缺省为空串", sg_viewed.views[0].name === "");
check("技能开关：视角四项相加等于 total", sg_viewed.views.every((v) => v.modelVisible + v.gated + v.nativeOff === v.total));
check("技能开关：并集计数不受视角影响", sg_viewed.counts.total === 3 && sg_viewed.counts.modelVisible === 1);

const sg_dirty = projectCatalog(sg_sample, sg_disabled, [{ key: "v-dirty", kind: "agent", name: "x", skills: [...sg_sample, { name: "Bad_Name" }] }]);
check("技能开关：非法名不进视角统计", sg_dirty.views[0].total === 3);
check("技能开关：非法名也不破坏四项相加", sg_dirty.views[0].modelVisible + sg_dirty.views[0].gated + sg_dirty.views[0].nativeOff === sg_dirty.views[0].total);

const sg_parsedSnap = snapshotSchema.parse({
  revision: 1,
  storePath: "/tmp/skill-gate.json",
  skills: sg_viewed.skills,
  counts: sg_viewed.counts,
  views: sg_viewed.views,
});
check("技能开关：schema 保留 keep-me 的两个视角", sg_parsedSnap.skills.find((row) => row.name === "keep-me").views.join(",") === "host,preset:demo");
check("技能开关：schema 保留 gate-me 的一个视角", sg_parsedSnap.skills.find((row) => row.name === "gate-me").views.join(",") === "preset:demo");
check("技能开关：schema 保留视角清单", sg_parsedSnap.views.length === 3);
check("技能开关：schema 认视角 kind/name", viewRowSchema.parse({ key: "preset:x", kind: "preset", name: "x", total: 1, modelVisible: 1, gated: 0, nativeOff: 0 }).name === "x");

/* 行级 sg_views 与快照 sg_views 共用同一个上限，改一处忘另一处就会漏校验。 */
const sg_emptySnap = { revision: 0, storePath: "/tmp/skill-gate.json", skills: [], counts: sg_viewed.counts };
const sg_manyViews = Array.from({ length: MAX_VIEWS }, (_, i) => ({ key: `agent:${i}`, kind: "agent", name: "", total: 0, modelVisible: 0, gated: 0, nativeOff: 0 }));
check("技能开关：快照接受 MAX_VIEWS 个视角", snapshotSchema.safeParse({ ...sg_emptySnap, views: sg_manyViews }).success);
check("技能开关：快照拒绝 MAX_VIEWS+1 个视角", !snapshotSchema.safeParse({ ...sg_emptySnap, views: [...sg_manyViews, sg_manyViews[0]] }).success);
check("技能开关：行级 sg_views 上限与快照一致", !snapshotSchema.safeParse({
  ...sg_emptySnap,
  views: [],
  skills: [{ ...sg_viewed.skills[0], views: Array.from({ length: MAX_VIEWS + 1 }, (_, i) => `v${i}`) }],
}).success);

const sg_nativeAlsoListed = projectCatalog(sg_sample, new Set(["gate-me", "native-off"]));
check("技能开关：原生关闭即使在名单里也不算已关", sg_nativeAlsoListed.counts.gated === 1 && sg_nativeAlsoListed.counts.nativeOff === 1);
check("技能开关：原生关闭在名单里仍三类相加", sg_nativeAlsoListed.counts.modelVisible + sg_nativeAlsoListed.counts.gated + sg_nativeAlsoListed.counts.nativeOff === sg_nativeAlsoListed.counts.total);
check("技能开关：sanitize 丢掉非法名", sanitizeDisabled(["ok-skill", "NOPE", 1, "also-ok"]).join(",") === "also-ok,ok-skill");

const sg_parsed = parseStore('{"version":1,"disabled":["gate-me","NOPE"]}');
check("技能开关：store 解析丢掉非法名", sg_parsed.disabled.join(",") === "gate-me");
check("技能开关：serialize 稳定排序", serializeStore(["b-skill", "a-skill"]).includes('"a-skill"') && serializeStore(["b-skill", "a-skill"]).indexOf("a-skill") < serializeStore(["b-skill", "a-skill"]).indexOf("b-skill"));

const sg_dir = await sgFs.mkdtemp(join(sgTmpdir(), "skill-gate-"));
try {
  const path = join(sg_dir, "skill-gate.json");
  await writeStore(path, ["gate-me", "other-skill"]);
  const sg_round = await readStore(path);
  check("技能开关：store 往返", sg_round.disabled.join(",") === "gate-me,other-skill");
  const sg_missing = await readStore(join(sg_dir, "sg_missing.json"));
  check("技能开关：缺文件当空名单", sg_missing.disabled.length === 0);
} finally {
  await sgFs.rm(sg_dir, { recursive: true, force: true });
}

// 版本号与产物一致性由 T专家 自己的断言盯着（[6] 那两节），这里不重复。

// 2026-09-28：技能开关的方法**挂在 tTeam 命名空间下**，没有第二个 remote 入口。
// 起因是独立入口（skillGate）在实机上挂不上（ctx.get("remote.skillGate") 始终 undefined），
// 改走已被证明可用的通路。这条断言钉住这个决定，免得有人又去单开一个入口。
const sg_hostRemote = await readFile(join(HERE, "lib/remote.js"), "utf8");
const sg_clientRemote = await readFile(join(HERE, "src/client/remote.js"), "utf8");
const sg_patch = await readFile(join(HERE, "cordis.patch.yml"), "utf8");
check("技能开关：方法挂在 tTeam remote 上（不单开第二个 remote 入口）",
  sg_hostRemote.includes('descriptor("getSnapshot"') && sg_hostRemote.includes('descriptor("setDisabled"')
  && !sg_hostRemote.includes("skillGate/getSnapshot")
  && sg_clientRemote.includes('direct("getSnapshot"') && !sg_clientRemote.includes("directSkillGate")
  && !sg_patch.includes("skill-gate-remote"));

// 产物一致性由 [6c]「lib/client.js 与当前客户端源码一致」盯着；这里只看技能开关那几处锚点，
// 而且读的是**源码拼接**（产物里中文被转义成 \\uXXXX，文本断言读源码更稳）。
const sg_bundle = await readClientSource();
check("技能开关：客户端产物挂 remote.skillGate", sg_bundle.includes("remote.skillGate") || sg_bundle.includes('get("remote.skillGate")'));
check("技能开关：客户端含 getSnapshot / setDisabled", sg_bundle.includes("getSnapshot") && sg_bundle.includes("setDisabled"));
check("技能开关：客户端含当前列出计数", sg_bundle.includes("filterCount"));
check("技能开关：客户端含视角选择", sg_bundle.includes("sg.view.option") && sg_bundle.includes("sg.filter.view"));
check("技能开关：客户端含空列表文案", sg_bundle.includes("sg.settings.empty"));
check("技能开关：面板挂在第三个标签页上", sg_bundle.includes('t("tab.skills")') && sg_bundle.includes('<SkillsPanel'));

const sg_hostFile = await readFile(join(HERE, "lib/skill-gate/install.js"), "utf8");
check("技能开关：host 包装 snapshot/list/get", sg_hostFile.includes("wrappedSnapshot") && sg_hostFile.includes("wrappedList") && sg_hostFile.includes("wrappedGet"));
check("技能开关：host 按 preset/会话收集技能", sg_hostFile.includes("standingKeyFor") && sg_hostFile.includes("scanSkillRoots"));
check("技能开关：host 输出视角清单", sg_hostFile.includes("collectViews") && sg_hostFile.includes("views: projected.views"));
check("技能开关：host 不改 SKILL.md", !sg_hostFile.includes("disable-model-invocation"));
// 合并时最关键的一处：**不能**用静态 inject（宿主没 skills 服务时 T专家 会整个不激活）。
const sg_indexFile = await readFile(join(HERE, "lib", "index.js"), "utf8");
check("技能开关：skills 走动态注入，没改成静态强依赖",
  sg_indexFile.includes('ctx.inject(["skills"]') && !/export const inject = \[[^\]]*"skills"/u.test(sg_indexFile),
  "静态 inject 会让 T专家 在缺 skills 服务的宿主上整个不加载");

const sg_parsedFm = parseFrontmatterScalars("---\nname: demo-skill\ndescription: hello\ndisable-model-invocation: true\n---\nbody\n");
check("技能开关：frontmatter 读 name", sg_parsedFm.name === "demo-skill");
check("技能开关：frontmatter 读 disable-model-invocation", sg_parsedFm["disable-model-invocation"] === "true");
check("技能开关：merge 去重保先", mergeSkillLists([[{ name: "a" }, { name: "b" }], [{ name: "a" }, { name: "c" }]]).map((s) => s.name).join(",") === "a,b,c");

const sg_skillDir = await sgFs.mkdtemp(join(sgTmpdir(), "skill-gate-scan-"));
try {
  await sgFs.mkdir(join(sg_skillDir, "sample-skill"));
  await sgFs.writeFile(join(sg_skillDir, "sample-skill", "SKILL.md"), "---\nname: sample-skill\ndescription: from disk\n---\n", "utf8");
  const sg_scanned = await scanSkillRoots([{ path: sg_skillDir, source: "user-dsh" }]);
  check("技能开关：扫描目录技能", sg_scanned.length === 1 && sg_scanned[0].name === "sample-skill" && sg_scanned[0].source === "user-dsh");
} finally {
  await sgFs.rm(sg_skillDir, { recursive: true, force: true });
}


// ---------- 6. 客户端产物 ----------
console.log("\n[6] 客户端产物（VM 加载 + 真实 apply）");
const clientPath = join(HERE, "lib/client.js");
if (!existsSync(clientPath)) {
  check("lib/client.js 存在", false, "尚未构建，先跑 tz.sh 12（构建）");
} else {
  const client = await readFile(clientPath, "utf8");
  const vm = await import("node:vm");
  const React = (await import("react")).default;
  const { renderToStaticMarkup } = await import("react-dom/server");

  let registration;
  const sandbox = {
    window: { __ModuleLoader__: { load: (value) => { registration = value; } } },
    // 内置引擎的客户端产物物化时会碰 DOM（查已有 style / 注入 CSS），所以桩要够用
    document: {
      createElement: () => ({
        dataset: {}, textContent: "", style: {}, remove() {},
        setAttribute() {}, appendChild() {}, addEventListener() {}, removeEventListener() {},
      }),
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      addEventListener() {}, removeEventListener() {},
      head: { appendChild() {}, querySelector: () => null },
      body: { appendChild() {}, querySelector: () => null },
    },
    console,
  };
  vm.createContext(sandbox);
  vm.runInContext(client, sandbox, { filename: "lib/client.js" });
  check("ModuleLoader 信封被调用", registration !== undefined);
  check("注册 id 等于包名", registration?.id === "dsh-expert", registration?.id);
  check("factory 是函数", typeof registration?.factory === "function");

  // 官方 primitives 的替身：与 render-smoke 共用 tools/primitives-stub.js（同一个文件两处用，
  // 桩才不会漂移）。**不能**用「任何属性都返回 () => null」的空桩 —— 那样按钮文字、标签页文案
  // 全都不出现在渲染结果里，一大片文案断言会变成假绿（2026-09-28 换控件时踩过）。
  const primitivesStub = await import(join(HERE, "tools", "primitives-stub.js"));
  const exports = registration.factory((spec) => {
    if (spec === "react") return React;
    if (spec === "react/jsx-runtime") return { jsx: React.createElement, jsxs: React.createElement, Fragment: React.Fragment };
    if (spec === "@deepseek-ai/dsh-client-ui-primitives") return primitivesStub;
    throw new Error(`未声明的 require：${spec}`);
  });
  check("导出 inject", Array.isArray(exports.inject) && ["slots", "inputTriggers", "locale", "remote", "sessions", "conversation"].every((s) => exports.inject.includes(s)), exports.inject?.join(","));
  check("导出 apply", typeof exports.apply === "function");
  {
    // 真检查（原来是字面 true）：产物里 require 的模块必须都在宿主模块表里，
    // 否则运行期会 "require(...) missed the module table" 而整个客户端插件挂掉。
    const specs = [...new Set([...client.matchAll(/require\("([^"]+)"\)/gu)].map((m) => m[1]))].sort();
    const seedTable = new Set(["react", "react/jsx-runtime", "react-dom", "react-dom/client", "@deepseek-ai/cordis",
      "@deepseek-ai/dsh-client-store", "@deepseek-ai/dsh-client-ui-slots", "@deepseek-ai/dsh-client-ui-primitives",
      "@deepseek-ai/dsh-client-ui-dockkit"]);
    const unknown = specs.filter((spec) => !seedTable.has(spec));
    check("客户端产物的 require 全部落在宿主模块表内", unknown.length === 0, specs.join(","));
  }

  // ---- 用假客户端上下文真实跑一遍 apply ----
  const dictionaries = new Map();
  const inserted = { records: [], machine: undefined };
  inserted.machine = {
    state: { getSnapshot: () => ({ draft: "", draftRev: 7, occurrences: [] }) },
    insertReference: (reference, span) => {
      inserted.records.push({ reference, span });
      return true;
    },
  };
  const sources = [];
  const slots = [];
  let activeLocale = "zh";   // 供标签/文案随语言切换的断言使用；默认 zh 与之前一致
  const fakeRemote = {
    async getCatalog() {
      return { ok: true, value: {
        experts: [
          { slug: "engineering-platform-engineer", name: "Platform Engineer", nameEn: "Platform Engineer", description: "平台工程", descriptionEn: "IDP", emoji: "🛤️", division: "engineering", divisionZh: "工程", divisionEn: "Engineering" },
          { slug: "security-architect", name: "Security Architect", nameEn: "Security Architect", description: "安全架构", descriptionEn: "security", emoji: "🛡️", division: "security", divisionZh: "安全", divisionEn: "Security" },
        ],
        enabled: ["engineering-platform-engineer"],
        revision: 4,
        // 分类管理页的数据：官方在前、自建在后（面板的分类下拉与分类页都吃这份）
        categories: [
          { key: "engineering", label: "工程", official: true, count: 1, customCount: 0 },
          { key: "security", label: "安全", official: true, count: 1, customCount: 0 },
          { key: "custom", label: "自定义", official: false, count: 0, customCount: 0 },
          { key: "research", label: "研究", official: false, count: 0, customCount: 0 },
        ],
      } };
    },
    async setEnabled(enabled, expectedRevision) {
      if (expectedRevision !== 4) {
        return { ok: false, error: { code: "tTeam/conflict", message: "settings section changed since it was read (expected revision 4, now 9)", details: {} } };
      }
      return { ok: true, value: { enabled, revision: expectedRevision + 1 } };
    },
    async getPrompt() {
      return { ok: true, value: { prompt: "persona" } };
    },
  };
  const clientCtx = {
    effect: (fn) => { const dispose = fn(); return () => { if (typeof dispose === "function") dispose(); }; },
    locale: {
      register: (ns, dicts) => { dictionaries.set(ns, dicts); return () => dictionaries.delete(ns); },
      getSnapshot: () => ({ active: activeLocale }),
      subscribe: () => () => {},
      bind: (ns) => (key, params = {}) => {
        const dicts = dictionaries.get(ns) ?? {};
        const table = activeLocale === "en" ? dicts.en : dicts.zh;
        let text = table?.[key] ?? dicts.zh?.[key] ?? key;
        for (const [name, value] of Object.entries(params)) text = text.split(`{${name}}`).join(String(value));
        return text;
      },
    },
    remote: { $mount: async () => () => {} },
    get: (name) => (name === "remote.tTeam" ? fakeRemote : undefined),
    slots: {
      inject: (_name, fn) => fn(),
      register: (options, render) => { slots.push({ options, render }); return () => {}; },
    },
    inputTriggers: { registerSource: (source) => { sources.push(source); return () => {}; } },
  modelDirectories: {},
  layout: {},
    sessions: {
      list: { getSnapshot: () => ({ current: "session-1" }) },
      scope: () => ({
        get: (name) => (name === "conversation"
          ? { input: { for: () => inserted.machine } }
          : undefined),
      }),
    },
  };
  await exports.apply(clientCtx);
  const ourSlots = slots.filter((s) => s.options.id === "t-team");


  // ---- 定时任务：入口在「新会话」下方、页面挂在 main、开关门控真的生效 ----
  {
    // sidebar 的渲染顺序是 logoRow → newSession → panelList（`sidebar.panellist`）→ 工作区 → 底部。
    // 所以注册进 sidebar.panellist 的条目**就在「新会话」按钮下面**；该槽的 id 必须等于 main 面板
    // 的 key（宿主点那一行时就是 `selectPanel(id)`），我们的组件只负责画那一行的图标。
    const entrySlot = slots.find((s) => s.options.name === "sidebar.panellist");
    const mainSlot = slots.find((s) => s.options.name === "main");

    if (entrySlot !== undefined && mainSlot !== undefined) {
      const glyphHtml = renderToStaticMarkup(React.createElement(entrySlot.render, { size: 16, active: false }));
      const panelHtml = renderToStaticMarkup(React.createElement(mainSlot.render, {}));
    }

    // 门控与「关闭即停用」的接线（SSR 下 useSyncExternalStore 走 server 快照＝默认显示，
    // 所以开关关闭后的行为用源码断言钉住，运行期由引擎单测与真机复核覆盖）。
    const clientSrc = await readClientSource();
    // 入口行由宿主渲染、class 是 CSS Modules 哈希：2026-09-25 用户口径是「与侧栏里官方
    // 「自动化任务」入口同款」，所以样式**整段交回宿主**（面板行默认样式），插件不许再覆写。
    // 这里钉住两件事：不再有 :has() 覆写，也没有任何宽度/高度/底色的自定义。

    // 2026-09-25 用户报过「滚动条不靠边」：滚动一旦挂在 960px 的居中内容列上，滚动条就长在
    // 那一列的右边缘。所以滚动必须在**全宽**的 pageScroll 层，page 只负责居中（与官方那一页
    // 的 pageScroll / pageContent 同构）。
    // 2026-09-25 用户报「定时任务的区域宽和官方不一样」：根因是内容列多了 box-sizing:border-box
    // 与 width:100%。官方 .t-XoWW_pageContent 的 max-width 限的是**内容盒**（整列最宽 960 + 2×padding），
    // 加了那两条就变成「内容 + padding 一共 960」→ 内容只有 864，比官方窄 96px。
    // 判据逐条钉住：有 max-width:960px、没有 box-sizing、没有 width:100%、pageScroll 是块级（不加 flex）。
    {
      // 客户端构建版本必须与 package.json 一致，并且**印在设置页标题行上**。
      // 宿主对客户端模块用 immutable 强缓存、键是内容哈希 —— 排查"改了没生效"时，
      // 用户截一张设置页就能确认页面里跑的是哪一版，不必靠猜。
      const pkgJson = JSON.parse(await readFile(join(HERE, "package.json"), "utf8"));
      const shown = clientSrc.match(/const CLIENT_BUILD_VERSION = "([^"]+)"/u)?.[1];
      check("客户端构建版本与 package.json 一致，且印在设置页标题行（改了没生效时可一眼辨认）",
        shown !== undefined && shown === pkgJson.version && clientSrc.includes("· v${CLIENT_BUILD_VERSION}"),
        `${shown} / ${pkgJson.version}`);
    }
    // 芯片是**行内**元素（与文字同一文本流），编辑区自带 placeholder 与滚动。
    // 工作区：新任务默认绑「定时任务」工作区（目录 <默认目录>/tesk），同时留一个自定义目录的口子。
    // 名册缓存只有一个写入入口（写缓存 + 通知订阅者绑在一起）：设置页启停专家走的是"悄悄改缓存"
    // 的老路子时，靠 onCatalogLoaded 订阅名册的界面永远看不到变化 —— 用户得刷新整页才行
    // （2026-09-15 实测：定时任务面板「T专家」挑选器里少刚启用的专家）。
    check("名册缓存只有一个写入入口（写缓存与通知订阅者绑在一起）",
      (clientSrc.match(/catalogCache\.set\(/gu) ?? []).length === 1
      && clientSrc.includes("function publishCatalog(remote, next)")
      && clientSrc.includes("return publishCatalog(remote, next)")
      && clientSrc.includes("publishCatalog(remote, { ...snapshot, enabled: state.enabled"));
  }
  // 2026-09-28 用户口径：设置面板**不再占「设置」里的分区**，改挂官方「插件信息」页的配置卡片槽
  // （`plugins.bundle.config`，key = 包名）—— 与 dsh-helper 同一处。
  const settingsSlot = slots.find((s) => s.options.name === "plugins.bundle.config");
  const buttonSlot = slots.find((s) => s.options.name === "conversation.input.left");
  check("设置卡片挂在插件信息页，key 就是本 bundle 的包名（写错卡片就不出现）",
    settingsSlot?.options.key === "dsh-expert", JSON.stringify(settingsSlot?.options));
  check("不再占用「设置」页的 settings.section 分区（用户口径：不要在设置里）",
    slots.every((s) => s.options.name !== "settings.section"),
    slots.map((s) => s.options.name).join(","));
  {
    // 规范：产品可见文案由 locale 字典拥有，不接受硬编码分支。这里渲染 summary 视图两次、
    // 中间切一次语言 —— 硬编码的话第二次不会变（label 那套随 settings.section 一起下线了：
    // 插件信息页的卡片标题由宿主画，插件只出内容）。
    const summaryOf = (locale) => {
      activeLocale = locale;
      return renderToStaticMarkup(React.createElement(settingsSlot.render, { view: "summary" }));
    };
    const zh = summaryOf("zh");
    const en = summaryOf("en");
    activeLocale = "zh";
    check("设置卡片的摘要随语言切换", zh.includes("专家名册") && en.includes("Expert roster"), `${zh} / ${en}`);
    {
      // 设置页那两个开关必须真渲染出来，而且**不能被卡片那套同名样式覆盖**。
      // 真实缺陷（用户实机截图报回）：两处曾共用 .t-team-switch，后定义的卡片那套
      // （28×16、开启色挂在 data-enabled 上）整体覆盖了设置页这套
      // （38×22、开启色挂在 data-on 上）—— 宽度被压成 28px、开启色永不生效，
      // 界面上看就是"开关不见了"。
      const settingsHtml = renderToStaticMarkup(React.createElement(settingsSlot.render, {}));
      // 界面开关一个个搬去了 dsh-helper（定时事项按钮 2026-09-25、活跃指示 2026-09-28），
      // 设置页现在只剩名册 / 分类两个标签页 —— 这里钉住「不再冒出开关」这个结果。
      const switchCount = (settingsHtml.match(/class="t-team-switch"/gu) ?? []).length;
      check("设置页不再有界面开关（活跃指示已迁到 dsh-helper）",
        switchCount === 0 && !settingsHtml.includes("显示活跃指示"),
        `${switchCount} 个开关`);
      const clientSource = await readClientSource();
      const cssText = clientSource.match(/const CSS = `([\s\S]*?)`;/u)?.[1] ?? "";
      // 面板里的开关一律走官方 primitives 的 Switch（2026-09-28 换控件），自绘那两套都不该再出现：
      // 设置页那套（.t-team-switch）随活跃指示下线，卡片那套（.t-team-card-switch）随启停开关下线
      // —— 规则留在样式表里是给「以后恢复按专家启停」用的，但面板上不该再画出这类元素。
      check("面板里没有自绘开关（开关一律走官方 primitives 的 Switch）",
        !/\.t-team-switch\{/u.test(cssText)
        && (settingsHtml.match(/role="switch"/gu) ?? []).length === 0,
        `${(settingsHtml.match(/role="switch"/gu) ?? []).length} 个开关元素`);

    }
    // 更强的探针：临时把字典里的这个键抽掉。真正"由字典供给"的实现会退化成键名本身，
    // 而"按语言分支硬编码"的实现照样返回中文/英文 —— 只有前者算文案由 locale 拥有。
    // 键名换成卡片标题（settings.title），面板里那处正是它渲染出来的。
    const dict = dictionaries.get("t-team");
    const saved = dict?.zh?.["settings.title"];
    if (dict?.zh !== undefined) delete dict.zh["settings.title"];
    activeLocale = "zh";
    const probe = renderToStaticMarkup(React.createElement(settingsSlot.render, {}));
    if (dict?.zh !== undefined && saved !== undefined) dict.zh["settings.title"] = saved;
    check("面板标题确实由字典供给（抽掉键会退化成键名）", probe.includes("settings.title"), probe.slice(0, 60));
  }
  check("工具行按钮槽存在且带 inject 工厂", buttonSlot !== undefined && typeof buttonSlot.options.inject === "function");
  const shared = buttonSlot.options.inject("session-1");
  check("inject 工厂给出 insertReference", typeof shared?.insertReference === "function");
  const insertOk = shared.insertReference({ source: "t-team:engineering", ref: "engineering-platform-engineer", label: "平台工程专家", appearance: "session", clipboardText: "@平台工程专家\u00a0" });
  check("insertReference 写入草稿并带 draftRev", insertOk === true && inserted.records.length === 1 && inserted.records[0].span.draftRev === 7,
    JSON.stringify(inserted.records[0]?.span));
  check("按分区注册 @ 来源", sources.length === 2, sources.map((s) => s.name).join(","));
  check("@ 来源 trigger 是 @", sources.every((s) => s.trigger === "@"));

  const engineering = sources.find((s) => s.name === "t-team:engineering");
  const candidates = await engineering.candidates(null, { query: "" });
  check("候选只含已启用专家", candidates.length === 1 && candidates[0].hint === "engineering-platform-engineer", JSON.stringify(candidates));
  const picked = engineering.onPick({ candidate: { hint: "engineering-platform-engineer" } });
  check("选中返回原子引用", picked?.insert?.appearance === "session" && picked.insert.ref === "engineering-platform-engineer" && picked.insert.clipboardText.startsWith("@"), JSON.stringify(picked));
  check("codec 提供 clipboardText 与 serialize", typeof engineering.codec?.clipboardText === "function" && typeof engineering.codec?.serialize === "function");
  const serialized = await engineering.codec.serialize("engineering-platform-engineer");
  check("serialize 产出 @专家名", serialized === "@Platform Engineer\u00a0", JSON.stringify(serialized));
  let serializeError = "";
  try {
    await engineering.codec.serialize("security-architect");
  } catch (error) {
    serializeError = error.message;
  }
  check("serialize 拒绝未启用专家", serializeError !== "", serializeError.slice(0, 40));

  const security = sources.find((s) => s.name === "t-team:security");
  check("未启用专家的分区无候选", (await security.candidates(null, { query: "" })).length === 0);

  const element = settingsSlot.render({});
  check("槽渲染出 React 元素", React.isValidElement(element));
  const html = renderToStaticMarkup(element);
  check("面板 HTML 含品牌与专家", html.includes("T专家") && html.includes("Platform Engineer"), html.slice(0, 80).replace(/\n/g, " "));
  check("标题下没有上游来源副标题（品牌化残留检查）", !html.includes("独立资产目录") && !html.includes("msitarzewski") && !html.includes("t-team-sub"));

  const buttonElement = buttonSlot.render({});
  check("按钮渲染出 React 元素", React.isValidElement(buttonElement));
  const buttonHtml = renderToStaticMarkup(buttonElement);
  check("按钮文案是 T专家（不再是召唤专家）", buttonHtml.includes("T专家") && !buttonHtml.includes("召唤专家") && buttonHtml.includes("t-team-btn"), buttonHtml.slice(0, 90));

    const popHtml = renderToStaticMarkup(buttonSlot.render({ ctx, preview: { open: true } }));
    {
      // 点开浮层的**默认标签**是「专家」（用户口径：这个浮层主要就是用来挑专家的）。
      // 不给 preview.tab 时渲染出来的激活标签就应该是 experts —— 改了默认值这条会立刻红。
      const defaultHtml = renderToStaticMarkup(buttonSlot.render({ ctx, preview: { open: true } }));
      check("浮层点开默认停在「专家」标签",
        defaultHtml.includes('data-tab="experts"') && !defaultHtml.includes('data-tab="tasks"'),
        defaultHtml.slice(0, 80).replace(/\n/gu, " "));
    }
    {
      // 标签顺序是用户口径（2026-09-21 随 T Team 引擎下线收敛，2026-09-23 再收起「任务」页），
      // 顺序漂回去很难自己发现 —— 钉住它。
      const tabLabels = [...popHtml.matchAll(/role="tab"[^>]*>([^<]*)</gu)].map((match) => match[1].trim());
      check("浮层标签顺序是 专家 → 技能",
        JSON.stringify(tabLabels) === JSON.stringify(["专家", "技能"]),
        JSON.stringify(tabLabels));
      // 标签计数（2026-09-18 用户要求）只在数据到位后才出现。SSR 没跑过 skills/list
      //（skills 停在 null），所以「技能」标签后面不该跟计数节点 —— 出现就说明给未知补了 0，
      // 界面会先闪一个假的「技能(·0)」再跳成真数。
      // （「专家」标签这时候可能已经有名册缓存，那是真实数据，它的计数逻辑由下面的源码断言覆盖。）
      const tabHtml = (name) => popHtml.match(new RegExp(`role="tab"[^>]*>${name}[\\s\\S]{0,160}?</button>`, "u"))?.[0] ?? "";
      const skillTabHtml = tabHtml("技能");
      check("数据未到位时「技能」标签不带计数（不写假 0）",
        skillTabHtml !== "" && !skillTabHtml.includes("t-team-tab-count"),
        skillTabHtml || "（没渲染出技能标签）");
    }

  // 2026-09-16：启停开关下线后，计数里再报「已启用 N」就没有意义了（用户改不了），只报总数。
  check("面板 HTML 显示专家总数（不再提已启用）", html.includes("共 2 位专家") && !html.includes("已启用 1 / 2"), "共 2 位专家");
  check("面板有搜索框与分区筛选", html.includes("搜索专家名或简介") && html.includes("工程"));
  check("分类下拉用中文而非分区 key", html.includes('value="engineering">工程 (1)') && html.includes('value="security">安全 (1)') && !html.includes(">engineering</option>"), "分类选项中文");
  // 状态筛选随启停开关一起下线（全部启用后它只剩「全部」和空列表两种结果）。
  check("状态下拉已下线（分区下拉仍在）", !html.includes("全部状态") && !html.includes('value="on"') && html.includes("全部分类"), "状态档位已下线");
  check("筛选栏只剩搜索 + 分类（状态筛选已下线）", html.includes("搜索专家名或简介") && (html.match(/class="t-team-select"/g) ?? []).length === 1, "一个下拉");
  check("统计行只显示 显示 / 总数", html.includes("显示 2 / 2") && !html.includes("已启用 1"), "统计行");
  check("面板是卡片网格", html.includes('class="t-team-grid"') && html.includes('class="t-team-card"') && html.includes('class="t-team-avatar"'), "grid+card+avatar");
  {
    // 分类折叠（2026-09-28 用户：「专家太多了，可以按分类折叠」）：323 位专家按 22 个分类铺开
    // 既没法看、又要在插件详情页里一次渲染 323 张卡片。
    const heads = (html.match(/class="t-team-group-head"/g) ?? []).length;
    const grids = (html.match(/class="t-team-grid"/g) ?? []).length;
    check("专家按分类折叠：默认只展开第一个分类",
      heads === 2 && grids === 1, `${heads} 个分类头 / ${grids} 个展开的分类`);
    check("分类头标了 aria-expanded（收起/展开对无障碍是可见的）",
      (html.match(/aria-expanded="true"/g) ?? []).length === 1
      && (html.match(/aria-expanded="false"/g) ?? []).length === 1,
      (html.match(/aria-expanded="[a-z]+"/g) ?? []).join(",") || "无");
    check("有「全部展开 / 全部收起」入口（未筛选时）",
      html.includes("全部展开") || html.includes("全部收起"));
    check("搜索/筛选时分类强制全展开（命中的专家藏在折叠里等于没搜到）",
      (await readClientSource()).includes("const isGroupOpen = (division) => filtered || openDivisions.includes(division);"));
    // 用户 2026-09-28：「折叠位置有点不明显，做一个底卡片」—— 分类头必须是**条状卡片**
    // （边框 + 圆角 + 底色），不是一行裸文本 + 小箭头：14 个分类排下来那样像一串散字，
    // 看不出哪块能点。底色必须用非 bg-layer-* 的 token —— 浅色主题下 bg-layer-* 全是 #fff，
    // 与页面同色，卡片就白做了（实测踩过）。
    const cssAll = (await readClientSource()).match(/const CSS = `([\s\S]*?)`;/u)?.[1] ?? "";
    const headRule = /\.t-team-group-head\{[^}]*\}/u.exec(cssAll)?.[0] ?? "";
    check("分类折叠头是条状卡片（边框 + 圆角 + 底色，且底色不取 bg-layer-*）",
      /border:[^;}]+/u.test(headRule) && /border-radius:[^;}]+/u.test(headRule)
      && /background:var\(--dsw-alias-interactive-bg-hover/u.test(headRule),
      headRule.slice(0, 80) || "找不到 .t-team-group-head 规则");
    check("展开中的分类与收起的分类看得出区别（展开态换底色与边框）",
      /\.t-team-group-head\[aria-expanded="true"\]\{[^}]*background:/u.test(cssAll));
  }
  // 任务列表在输入区浮层里，不在设置页 —— 设置页只放配置。
  // 2026-09-21：运行中的团队与小队随 T Team 引擎下线，设置页只剩 专家 / 分类 两个标签。
  // 标签换成了官方 SegmentedTabs（role="tab" + aria-selected），不再是自己画的 .t-team-tab。
  // 2026-09-28：技能开关并入后是三个标签。
  check("面板是 专家 / 分类 / 技能 三个标签（官方 SegmentedTabs）",
    (html.match(/role="tab"/g) ?? []).length === 3
    && html.includes('aria-controls="t-team-panel-experts"')
    && html.includes('aria-controls="t-team-panel-categories"')
    && html.includes('aria-controls="t-team-panel-skills"'),
    String((html.match(/role="tab"/g) ?? []).length));
  check("分类管理页真的渲染出来了（有自建/官方两组 + 新建入口）",
    html.includes("自建分类") && html.includes("官方分类") && html.includes("创建分类"), html.slice(0, 60).replace(/\n/g, " "));
  {
    // 分类页曾经的毛病：借用了专家卡片的样式（.t-team-card：min-height:132px + 44px 头像列 +
    // 三行简介夹取），而且借的 .t-team-card-head / .t-team-card-actions 根本没有样式规则 ——
    // 结果是一排又高又空的盒子。这里钉死两件事：用紧凑行、且用到的每个 class 都真有样式。
    const catSource0 = await readClientSource();
    // CategoriesTab 是客户端源码里最后一个组件：切到它后面出现的第一个 \`function\`
    // 为止（没有就切到末尾）。教训：这里曾经锚一个固定函数名，那个函数被删掉之后
    // 切片长度恒为 0，整节断言会静默退化成"什么都没查"；改成「下一个 function」就与该
    // 函数是否存在无关了。
    const catStart = catSource0.indexOf("function CategoriesTab(");
    const catNextFn = catSource0.indexOf("\nfunction ", catStart + 1);
    const catSource = catSource0.slice(catStart, catNextFn === -1 ? catSource0.length : catNextFn);
    // 注释里也会出现 "t-team-card"（说明为什么不用它），所以先剥注释再判断
    const catCode = catSource.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/^\s*\/\/.*$/gmu, "");
    check("分类管理页用紧凑行，不再借用专家卡片样式",
      catCode.includes("t-team-cat-row") && !catCode.includes("t-team-card"),
      catCode.includes("t-team-card") ? "仍在用 t-team-card" : "clean");
    const usedClasses = [...new Set([...catSource.matchAll(/className="([^"]+)"/gu)]
      .flatMap((match) => match[1].split(" ")).filter((name) => name !== ""))];
    const undefinedClasses = usedClasses.filter((name) => !new RegExp(`\\.${name}[{[:,]`, "u").test(catSource0));
    check("分类管理页用到的每个 class 都有样式规则（曾用了没定义的 card-head/card-actions）",
      undefinedClasses.length === 0, undefinedClasses.join(",") || `${usedClasses.length} 个都已定义`);
    // 2026-09-28 用户报「新建栏这 2 个输入框太大了」：根因是它们完全吃 .t-team-input 的通用默认值 ——
    // flex:1 1 200px 把两个框在整行里对半撑开，字号/行高又全靠继承宿主设置页（宿主字号一变就跟着变）。
    // 修法是给它们自己的类（t-team-cat-new）显式钉死尺寸。这条自检把「必须自己给定 height 与
    // font-size、并有宽度上限」钉住，免得以后有人把这条规则删了、又退回"跟着宿主字号跑"。
    check("分类新建栏的输入框自己钉死了尺寸（height + font-size + 宽度上限），不靠继承宿主字号",
      /\.t-team-cat-new\{[^}]*\bheight:[^;}]+;[^}]*\bfont-size:[^;}]+/u.test(catSource0)
      && /\.t-team-cat-new\{[^}]*\bmax-width:[^;}]+/u.test(catSource0),
      "显式 height / font-size / max-width");
    // ⚠️ 2026-09-28 第一版就是栽在这里：规则写成了裸的 .t-team-cat-new（特异性 0,1,0），
    // 而通用规则 .t-team-input（也是 0,1,0）定义在它**后面** —— 同级特异性下后者胜，
    // 于是 font:inherit / padding / flex 全被盖回去：height 生效（框矮了）、字号却没变小。
    // 这条把「必须带 .t-team-bar 前缀（0,2,0）」钉住，否则上面那条自检在"字没变小"时依然是绿的。
    check("分类新建栏的尺寸规则带 .t-team-bar 前缀（裸 0,1,0 会被后面的 .t-team-input{font:inherit} 盖回去）",
      /\.t-team-bar \.t-team-cat-new\{/u.test(catSource0), "选择器 .t-team-bar .t-team-cat-new");
    // 2026-09-28：字号问题**从基类治本** —— 插件里凡是没有自己写 font-size 的输入框（分类新建栏、
    // 专家页搜索框、编辑器字段、@ 召唤弹窗的搜索框…）都在继承宿主设置页的 14px，比旁边的胶囊按钮
    // （12px）大一号，用户是一个一个报过来的。现在统一钉在 .t-team-input 上：12px / 18px。
    // 断言里刻意要求 font-size 出现在 font:inherit **之后** —— font 简写会把它重置回继承值，
    // 顺序写反了这条规则等于没写（第一版就是这么栽的）。
    check("输入框基类统一钉死字号（font-size 写在 font:inherit 之后，不再继承宿主设置页的 14px）",
      /\.t-team-input\{[^}]*font:inherit;[^}]*font-size:[^;}]+/u.test(catSource0),
      "基类 .t-team-input 含「font:inherit 后跟 font-size」");
    // 2026-09-28 换官方 primitives 后，搜索框的尺寸由官方 Input 自己负责（32px / 14px 字号），
    // 我们只负责让它在筛选栏里撑开余量 —— 那条规则改成了 flex。
    check("筛选栏里的输入框交给官方 Input（我们只管撑开宽度；类名 2026-09-28 由 t-team-search 改为通用的 t-team-input-field）",
      /\.t-team-bar \.t-team-input-field\{[^}]*flex:[^;}]+/u.test(catSource0), "选择器 .t-team-bar .t-team-input-field");
    // 行高下限**不是**随便定的：行里那颗官方 Button 是 28px，上限 48px 防止有人把它做成卡片。
    // 2026-09-28 用户报「有 2 条横线都贴到了按钮」—— 原先行高 28px + 内边距 3px，
    // 列表外框的上下边正好压在按钮上；现在 40px（28 + 上下各 6）留出呼吸。
    const catRowHeight = Number(/\.t-team-cat-row\{[^}]*min-height:(\d+)px/u.exec(catSource0)?.[1] ?? 0);
    // 2026-09-28 用户：「自建分类 / 官方分类 里下方元素增加点间隔」—— 标题与列表原先是贴着的。
    // 间距一律由容器 gap 提供，元素自己不许再写 margin（两处相加以后就改不动了）。
    check("分类页的区块与小节用容器 gap 分隔（标题与列表不贴在一起）",
      /\.t-team-cat-page\{[^}]*gap:[^;}]+/u.test(catSource0)
      && /\.t-team-cat-section\{[^}]*gap:[^;}]+/u.test(catSource0)
      && !/\.t-team-section-head\{[^}]*margin/u.test(catSource0),
      "cat-page / cat-section 的 gap");
    check("分类行是横向单行（flex-row + 有界高度 36–48px，给行里的官方按钮留出呼吸），不是卡片网格",
      /\.t-team-cat-row\{[^}]*flex-direction:row/u.test(catSource0)
      && catRowHeight >= 36 && catRowHeight <= 48
      && !/\.t-team-cat-list\{[^}]*grid/u.test(catSource0),
      `min-height=${catRowHeight}px`);
    const renderedRows = (html.match(/class="t-team-cat-row"/g) ?? []).length;
    const renderedLists = (html.match(/class="t-team-cat-list"/g) ?? []).length;
    check("渲染结果里分类行确实是紧凑行（自建 2 行 + 官方 2 行，两个列表容器）",
      renderedRows === 4 && renderedLists === 2, `rows=${renderedRows} lists=${renderedLists}`);
    // 旧实现每行是一个 <div> 卡片里再套 <div class="t-team-card-head"> / <div class="t-team-card-actions">；
    // 紧凑行是扁平的（只有 span/button/input），所以「行内没有任何 div」就是没有卡片结构。
    const catHtmlStart = html.indexOf('<div class="t-team-cat-list"');
    const catHtmlEnd = html.indexOf('<div class="t-team-tabbody"', catHtmlStart);
    const catHtml = catHtmlEnd > catHtmlStart ? html.slice(catHtmlStart, catHtmlEnd) : html.slice(catHtmlStart);
    const catRowInner = catHtml.split('<div class="t-team-cat-row">').slice(1)
      .map((part) => part.slice(0, part.indexOf("</div>")));
    check("分类行是扁平的紧凑行（4 行、行内没有任何 div = 不是卡片结构）",
      catRowInner.length === 4 && catRowInner.every((inner) => !inner.includes("<div")),
      `${catRowInner.length} 行，含 div 的 ${catRowInner.filter((inner) => inner.includes("<div")).length} 行`);
    // 可选：把渲染结果落盘，方便本地用 Chrome 量真实布局（自检本身不依赖浏览器）
    const dumpPath = process.env.T_TEAM_RENDER_DUMP;
    if (dumpPath !== undefined && dumpPath !== "") {
      const { writeFile } = await import("node:fs/promises");
      const cssBlock = /const CSS = `([\s\S]*?)`;/u.exec(catSource0)?.[1] ?? "";
      const probe = `<script>window.addEventListener("load",()=>{`
        + `const w=Number((location.hash.match(/w=(\\d+)/)||[])[1]||0);if(w)document.body.style.width=w+"px";`
        // 面板只显示当前标签，其余是 [hidden]（display:none → 高度恒为 0）；量尺寸前先全部展开
        + `document.querySelectorAll(".t-team-tabbody[hidden]").forEach(e=>{e.hidden=false;});`
        + `const rows=[...document.querySelectorAll(".t-team-cat-row")];`
        + `const lists=[...document.querySelectorAll(".t-team-cat-list")];`
        + `const cards=[...document.querySelectorAll(".t-team-card")];`
        + `document.documentElement.setAttribute("data-measure",JSON.stringify({`
        + `width:w,rows:rows.length,rowHeight:rows.map(r=>Math.round(r.getBoundingClientRect().height)),`
        + `listHeight:lists.map(l=>Math.round(l.getBoundingClientRect().height)),`
        + `cardHeight:cards.map(c=>Math.round(c.getBoundingClientRect().height)),`
        + `fontSize:rows[0]?getComputedStyle(rows[0]).fontSize:null}));});<\/script>`;
      await writeFile(dumpPath, `<!doctype html><meta charset="utf-8"><style>${cssBlock}</style>${html}${probe}`, "utf8");
    }
  }
  {
    // 注意：bundle 里的中文被 esbuild 转义成 \uXXXX，中文断言要读源码（ASCII 键可查 bundle）
    const source = await readClientSource();
    // 输入区「T专家」浮层：2026-09-16 用户要求加宽，专家不再单列。
    // 2026-09-23 用户要求浮层贴输入框上方，宽度与对齐方式几经调整（90% 居中 → 与输入框左右边缘对齐），
    // 列数最终定为每行固定 4 个。
    // 钉四件事：CSS 兜底宽度、专家 tab 的网格（且只对它生效）、分区标题跨整行、
    // 简介的省略宽度跟随列宽；另加一条 —— 加宽后必须钳制右边界，否则靠右的按钮会把浮层顶出视口。
    {
      const popRule = source.match(/\.t-team-pop\{[^}]*\}/u)?.[0] ?? "";
      // 2026-09-23 用户要求：浮层贴在输入框正上方，先要「宽度的 90%」，随后改口「和输入框一样对齐」。
      // 宽度由 JS 实测输入框后写进 CSS 变量 --t-team-pop-w，CSS 里只留兜底值（找不到输入框时用它）。
      const popWidth = Number(/width:var\(--t-team-pop-w,\s*(\d+)px\)/u.exec(popRule)?.[1] ?? "0");
      check("T专家浮层宽度走 --t-team-pop-w（兜底值够放一排 3 个专家）", popWidth >= 700, `width=${popWidth}px`);
      // 2026-09-23 用户反馈「弹窗边线太明显了，太粗了」：外框由 1px + border-l2（alpha 10%）
      // 收到 .5px + border-l1（alpha 4%），层次交给 box-shadow。别再放回去。
      check("T专家浮层外框细而淡（.5px + border-l1，不是 1px + border-l2）",
        /\.t-team-pop\{[^}]*border:\.5px solid var\(--dsw-alias-border-l1\)/u.test(source)
        && !/\.t-team-pop\{[^}]*border:1px solid var\(--dsw-alias-border-l2\)/u.test(source));
      // 新交互的护栏：弹窗与输入框左右边缘对齐 —— 宽度取输入框宽度（经 --t-team-pop-w 交给 CSS），
      // 左边缘由官方 `useAnchoredPosition` 的 `align:"start"` 对齐到锚点（锚点就是输入卡片本身）。
      // ⚠️ 2026-09-29 换外壳后坐标不再由本插件手算（`wantedLeft` / `style={position}` 都已删掉），
      // 所以这条改写为钉「锚点 + 宽度变量 + 官方对齐参数」，别让宽度退化成 CSS 里写死的数。
      check("浮层宽度与左边缘都跟输入框对齐（宽度走 --t-team-pop-w，左边缘走官方 align:start）",
        source.includes("function anchorInput(") && source.includes('"--t-team-pop-w"')
        && /Math\.round\(inputRect\.width\)/u.test(source)
        && source.includes('align: "start"')
        // 变量必须真进 style：逐键挑 left/bottom 会把它丢掉（2026-09-23 真踩过，宽度永远是 720px）。
        && source.includes("style={shell.style}"));
      // ---- 浮层外壳改用官方 primitives（2026-09-29，用户口径「拉齐官方」）----
      // 官方 primitives 里**没有浮层组件**，只有三个 hooks 与一个材质容器，官方自己也是按需组合：
      // conversation 的 ContextMeter = useAnchoredPosition（side 写死）+ useDismissOnOutsidePointer
      // + 手写 Escape；input-trigger 的 `/` 菜单 = 只用 useAnchoredMaxHeight。
      // 所以这里分开钉：**该交的交给官方**、**该留的仍在本插件**。
      check("浮层外壳走官方件（定位 / 外部点击关闭 / 菜单材质三件都探测官方 primitives）",
        source.includes("primitives.useAnchoredPosition") && source.includes("primitives.useDismissOnOutsidePointer")
        && source.includes("primitives.MenuSurface")
        && source.includes("<PopSurface")
        // 外壳现在收在 FloatingPop 组件里（性能改造），调用点因此是它内部那一句。
        && source.includes("useFloatingShell({ open, setOpen, rootRef, panelRef })"));
      check("翻转仍由本插件决定（官方 side 是静态入参，没有「上方不够就翻下去」）",
        source.includes("const up = spaceAbove >= spaceBelow;")
        && source.includes('setSide(up ? "top" : "bottom")'));
      check("浮层上边界按官方 overlayTopMargin 让位（框架顶部占位 + 20，全屏时不算占位）",
        source.includes("--dsh-frame-top-clearance")
        && source.includes('root.hasAttribute("data-fullscreen") ? 0 : clearance')
        && source.includes("+ 20"));
      check("官方材质路径改成不透明实色：铺实色底 + 关掉 MenuSurface 内部那层材质",
        /\.t-team-pop-official\{[^}]*border:0/u.test(source)
        && /\.t-team-pop-official\{[^}]*background:var\(--dsw-alias-bg-layer-3/u.test(source)
        // ⚠️ 只把父级换成实色还不够：官方材质层（aria-hidden 的兄弟、inset:0）照样在跑 blur。
        && source.includes('.t-team-pop-official > [aria-hidden="true"]{display:none}')
        && source.includes("official ? `${className} t-team-pop-official` : className"));
      // 用户 2026-09-29 口径：面板「太卡了」→ 选「改成不透明实色」。
      // blur(40px) 铺满整块面板是面板上仅剩的大合成开销，而面板内容是实心卡片、不需要透出背景。
      check("面板整体不再走毛玻璃（两条容器规则里都不许再有真的 backdrop-filter）",
        !/\.t-team-pop\{[^}]*backdrop-filter/u.test(source)
        && !/\.t-team-pop-official\{[^}]*backdrop-filter:(?!none)/u.test(source)
        && /\.t-team-pop\{[^}]*background:var\(--dsw-alias-bg-layer-3/u.test(source));
      check("Escape 关闭仍自写（官方 hook 不管它，官方 ContextMeter 也是手写）",
        source.includes('event.key === "Escape"') && source.includes('document.addEventListener("keydown", onKey)'));
      {
        const stub = await readFile(join(HERE, "tools", "primitives-stub.js"), "utf8");
        check("官方件替身补齐浮层三件（缺一件，官方分支在自检里就没有覆盖）",
          stub.includes("export function useAnchoredPosition")
          && stub.includes("export function useDismissOnOutsidePointer")
          && stub.includes("export const MenuSurface"));
      }
      // 2026-09-23 踩过：锚点必须认宿主的输入卡片标记 data-composer-card。
      // 只找 textarea 会永远落空 —— 宿主主输入框是 contenteditable 的 DraftEditor，
      // 那时宽度会静默退回兜底 720px，用户看到的就是「什么都没变」。
      check("浮层锚点是宿主输入卡片（data-composer-card），并保留 contenteditable 兜底",
        source.includes('node.matches?.("[data-composer-card]")') && source.includes("contenteditable='true'"));
      // 2026-09-23 用户问「为什么这个弹窗的滚动条没靠边」：滚动条画在滚动容器的 padding box
      // 边缘，父级 .t-team-pop 上留 10px 内边距就会把它推进来 10px。所以弹窗右侧 padding 归零，
      // 改由滚动容器（.t-team-pop-list）自己用 padding-right 撑出内容与滚动条的留白。
      // 代价是每个不滚动的兄弟元素都得补回 10px —— 第一版只补了标题行，搜索框顶了边（用户报的），
      // 所以换成 `> *` 一把兜住 + 单独把滚动容器摘出去。
      // ⚠️ 2026-09-29 起还要排除 `[aria-hidden]`：官方 MenuSurface 的材质层就是父级里那个 aria-hidden
      // 的绝对定位兄弟（inset:0），它吃这 10px 会让材质右边少一条、露出底色。
      check("弹窗滚动条贴住右边缘（右内边距由滚动容器承担，其余子元素统一补 10px）",
        source.includes("gap:8px;padding:10px 0 10px 10px;border-radius:12px")
        && source.includes('.t-team-pop > *:not([aria-hidden="true"]){margin-right:10px}')
        && source.includes(".t-team-pop > .t-team-pop-list{margin-right:0}")
        && source.includes("overflow:auto;min-height:0;padding-right:10px}"));
      // ---- 分类标签行（2026-09-29 用户要求：搜索框下面加一行分类，附参考图）----
      // 四条：位置（在搜索框**下面**、只属于专家标签）、选项来源（名册现算 + 「全部」）、
      // 对齐宽度（自己不写左右内边距，靠父级 padding 与「> *」的右内边距）、溢出处理（横向滚动 + 右端箭头）。
      check("分类行在搜索框下面、且只在专家标签里（技能没有分类概念）",
        /placeholder=\{t\("settings\.search"\)\}[\s\S]{0,900}?className="t-team-divbar"/u.test(source)
        && !/popTab === "skills"[\s\S]{0,800}?t-team-divbar/u.test(source));
      check("分类选项从名册现算（「全部」+ 名册里出现过的分区，顺序与列表分组一致）",
        source.includes("const divisionLabels = React.useMemo(() => {")
        && source.includes("map.set(expert.division, divisionLabel(expert, active))")
        && source.includes('t("pop.all")')
        && source.includes('(division === "all" || expert.division === division)'));
      check("分类行与搜索框对齐（自己不写左右内边距，靠父级 padding 与「> *」的右内边距）",
        source.includes(".t-team-divbar{position:relative;display:flex;align-items:center;min-width:0}")
        && source.includes(".t-team-pop-divs{display:flex;align-items:center;gap:6px;flex:1 1 auto;min-width:0;overflow-x:auto")
        && source.includes('.t-team-pop > *:not([aria-hidden="true"]){margin-right:10px}')
        // 只允许"给箭头让位"这两条内边距，且都挂在 data 属性上 —— 对应那一侧的箭头不出现就不生效
        // （没滚动时左侧不加 padding，第一个标签仍与搜索框左边缘对齐，这正是用户点的那条）。
        && source.includes('.t-team-divbar[data-more="true"] .t-team-pop-divs{padding-right:38px}')
        && source.includes('.t-team-divbar[data-back="true"] .t-team-pop-divs{padding-left:38px}'));
      // 用户 2026-09-29 追加：点了右箭头之后左边也得有箭头，否则回不到最前面的分类。
      check("分类行溢出时横向滚动 + 两端各一个圆形箭头（右端「还有更多」、左端「滚过去了」）",
        source.includes("overflow-x:auto;overflow-y:hidden;scrollbar-width:none}")
        && source.includes(".t-team-div-scroll[data-dir=\"next\"]{right:0}")
        && source.includes(".t-team-div-scroll[data-dir=\"prev\"]{left:0}")
        && source.includes('className="t-team-divbar" data-more={divMore} data-back={divBack}')
        && source.includes("setDivMore(node.scrollLeft + node.clientWidth < node.scrollWidth - 1)")
        && source.includes("setDivBack(node.scrollLeft > 1)")
        && source.includes('data-dir="prev"') && source.includes('data-dir="next"')
        // 两个方向各滚一屏的 80%，方向相反。
        && source.includes("left: -Math.round((node.clientWidth || 0) * 0.8)")
        && source.includes("left: Math.round((node.clientWidth || 0) * 0.8)"));
      // 2026-09-29 三轮用户口径：①「< > 最好加个边线，现在看着不明显」；② 附参考图 +「这种圆形风格行吗，
      // 再大一点点」；③「为什么是半透明的？还有要正圆」。
      check("两端箭头是实色正圆（32px、与标签行同高、18px 箭头、淡描边；不许用 alpha 底或 translateY 居中）",
        /\.t-team-div-scroll\{[^}]*box-sizing:border-box[^}]*width:32px;height:32px/u.test(source)
        // 实色底：上一版用的 interactive-bg-hover 本身就是 alpha 色，叠在半透明材质上整个圆都是透的
        // —— 那才是"看起来半透明"的原因（不是面板的问题）。
        && /\.t-team-div-scroll\{[^}]*background:var\(--dsw-alias-bg-layer-3/u.test(source)
        && !/\.t-team-div-scroll\{[^}]*background:var\(--dsw-alias-interactive-bg-hover/u.test(source)
        // 正圆两件：垂直居中用 margin:auto（translateY(-50%) 在半像素高度上会落在 .5px，边缘被重采样
        // 就不圆了）；行高与圆同高（圆不参与布局、行高由标签决定，两者不等就会溢出成"被切过的圆"）。
        && /\.t-team-div-scroll\{[^}]*top:0;bottom:0;margin:auto 0/u.test(source)
        && !/\.t-team-div-scroll\{[^}]*translateY/u.test(source)
        && /\.t-team-div-chip\{[^}]*height:32px;padding:0 12px;border:0;border-radius:8px/u.test(source)
        && /\.t-team-div-scroll\{[^}]*border:1px solid var\(--dsw-alias-border-l1\)/u.test(source)
        && /\.t-team-div-scroll\{[^}]*font-size:18px/u.test(source)
        && /\.t-team-div-scroll:hover\{[^}]*border-color:var\(--dsw-alias-border-l2\)/u.test(source));
      check("分类行的文案两种语言都有（字典自检盯着键集合与字面量引用）",
        source.includes('"pop.all": "全部"') && source.includes('"pop.all": "All"')
        && source.includes('t("pop.divisions")') && source.includes('t("pop.divisionsMore")')
        && source.includes('t("pop.divisionsPrev")'));
      // ---- 滚轮横向滚（2026-09-29 用户要求：「分类这一行要支持鼠标滚轮滚动」）----
      // 用原生监听：React 17 起 wheel 是 passive 委托，onWheel 里 preventDefault() 不生效，
      // 纵向滚轮会"滚完分类行继续滚列表"。只在还能往那个方向滚时才拦，到两端放手。
      check("分类行支持鼠标滚轮左右滚（原生非 passive 监听，滚到两端就放手）",
        source.includes('node.addEventListener("wheel", onWheel, { passive: false })')
        && source.includes("Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY")
        && source.includes("if ((delta > 0 && atEnd) || (delta < 0 && atStart)) return;")
        && source.includes("bar.scrollLeft += delta;")
        && source.includes("event.preventDefault();"));
      // 滚轮要"转多少走多少"，平滑只留给那两颗箭头按钮。
      check("滚轮跟手、箭头平滑（分类行不写 scroll-behavior，两个箭头各自传 smooth）",
        !/\.t-team-pop-divs\{[^}]*scroll-behavior/u.test(source)
        && (source.match(/behavior: "smooth"/gu) ?? []).length >= 2);
      // ---- 性能：用户 2026-09-29 报「弹窗有点卡」之后的四处收紧 ----
      check("浮层外壳收进 FloatingPop（位置 state 不再住在 SummonButton 里）",
        source.includes("export function FloatingPop({")
        && source.includes('<FloatingPop open={open} setOpen={setOpen} rootRef={rootRef} className="t-team-pop"')
        // 父级必须**始终挂载**它：写成 `{open && <FloatingPop` 就退回"每次开关重建整棵面板"。
        && !/open && \(\s*<FloatingPop/u.test(source)
        && !source.includes("useFloatingShell({ open, setOpen, rootRef, panelRef: popRef })"));
      check("浮层内部的滚动不再触发几何重算（列表滚动不重渲染整棵面板）",
        source.includes("const onScroll = (event) => {")
        && source.includes("node.contains(event.target)) return;")
        && source.includes('window.addEventListener("scroll", onScroll, true);'));
      check("面板的派生数据都走 useMemo（300+ 专家、250+ 技能不再被无关 state 重算）",
        source.includes("const experts = React.useMemo(")
        && source.includes("const divisionLabels = React.useMemo(")
        && source.includes("const divisionKeys = React.useMemo(")
        && source.includes("const visible = React.useMemo(")
        && source.includes("const grouped = React.useMemo(")
        && source.includes("const visibleSkills = React.useMemo("));
      check("等高卡片加 content-visibility（屏幕外的不渲染，打开面板只画可视区那十几张）",
        /\.t-team-pop-item\{[^}]*content-visibility:auto[^}]*contain-intrinsic-size:auto 146px/u.test(source));
      {
        const catalogSrc = await readFile(join(HERE, "src", "client", "catalog.js"), "utf8");
        check("matchExpert 的搜索串按对象缓存（WeakMap，一次输入不再拼上千个字符串）",
          catalogSrc.includes("const HAYSTACKS = new WeakMap();")
          && catalogSrc.includes("return haystackOf(expert).includes(query);"));
      }
      // 2026-09-23 踩过：src/client/css.js 的 CSS 是一整个 JS 模板字符串，注释里随手写个反引号
      // 就会提前终止它 —— 后面的 CSS 全变成 JS 代码，esbuild 报 `Unexpected "*"`（那次是注释里
      // 的 > * 被反引号括起来）。${ 同理，会被当成插值。模板里写这类字符请改用「」。
      {
        const cssOpen = "export const CSS = `";
        const cssAt = source.indexOf(cssOpen);
        const cssEnd = cssAt === -1 ? -1 : source.indexOf("\n`;", cssAt);
        const cssBody = cssAt === -1 || cssEnd === -1 ? "" : source.slice(cssAt + cssOpen.length, cssEnd);
        check("CSS 模板字符串内没有裸反引号与 ${（会提前终止模板 / 触发插值）",
          cssAt !== -1 && cssEnd !== -1 && !cssBody.includes("`") && !cssBody.includes("${"));
      }
      check("专家 tab 每行固定 4 列卡片网格（分区标题跨整行；其它 tab 不受影响）",
        source.includes('.t-team-pop[data-tab="experts"] .t-team-pop-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))')
        && source.includes('.t-team-pop[data-tab="experts"] .t-team-division{grid-column:1/-1}')
        && source.includes('.t-team-pop[data-tab="experts"] .t-team-pop-item{min-width:0}'));
      // 2026-09-16 用户按参考图定的卡片风格：圆形头像 + 名字 + 对照名 + 多行简介，卡片描边。
      check("专家条目是卡片式（44px 圆形头像、名字/对照名两层、卡片描边）",
        source.includes('className="t-team-pop-head"')
        && source.includes('className="t-team-pop-avatar"')
        && source.includes('className="t-team-pop-sub"')
        && /\.t-team-pop-item\{[^}]*border:1px solid var\(--dsw-alias-border-l2\)/u.test(source)
        && /\.t-team-pop-avatar\{[^}]*width:44px;height:44px;border-radius:50%/u.test(source));
      // 卡片等高（2026-09-20 用户：专家标签的卡片要和技能里一样大）。
      // 两个 tab 本来就共用同一张卡片，尺寸差全在内容 —— 专家多一行对照名、简介又总占满，
      // 于是专家卡比技能卡高一截。所以钉三件事：头部高度写死 40px（=头像高）、
      // 简介固定两行并用 min-height 占位（技能描述偏短也不缩）、卡片有统一的 114px 底高。
      // 2026-09-23 用户反馈「卡片太紧凑了，大一点」，三个数一起放大，联动关系不变。
      // 2026-09-29 参考图改版：头像与头部 40→44、名字 14→15、圆角 12→16、补回底部标签行，
      // 底高 114→146（14+44+8+36+8+20+14+2）。这几个数字仍然联动，改一个就得改其余。
      check("专家/技能卡片等高（头部 44px、简介两行占位、标签行 20px、卡片 146px）",
        source.includes(".t-team-pop-item .t-team-pop-head{height:44px;justify-content:flex-start}")
        && /\.t-team-pop-desc\{[^}]*line-clamp:2[^}]*min-height:36px/u.test(source)
        && /\.t-team-pop-tags\{[^}]*height:20px/u.test(source)
        && /\.t-team-pop-item\{[^}]*min-height:146px/u.test(source));
      // 参考图里的底部标签用户明确不要；「召唤」也没做成按钮（整张卡片可点即召唤）。
      {
        const itemAt = source.indexOf('className="t-team-pop-item"');
        const itemBlock = source.slice(itemAt, itemAt + 1600);
        // 2026-09-29 参考图：底部标签"回来"了（0.3.x 时用户明确不要），但仍然不做召唤按钮 —— 整卡可点即召唤。
        check("专家卡片带底部标签、但不额外放召唤按钮（整张卡片可点）",
          itemBlock.includes('className="t-team-pop-tags"')
          && !itemBlock.includes("t-team-member-chip") && !itemBlock.includes("t-team-chip"));
      }
      // ---- 卡片头像与底部标签（2026-09-29 用户参考图：圆头像 + 大名字 + 简介 + 标签）----
      check("卡片头像优先用专家自己的彩色 emoji + 名册 color 的淡色圆底；缺 emoji 才回退分区图标 → 🧩",
        source.includes("const DIVISION_ICONS = {")
        && source.includes("export function divisionIconName(division)")
        && source.includes('typeof primitives[name] !== "function") return null')
        && source.includes("export function tintOf(color)")
        // 名册里 color 有两种写法：hex（126 位）与 CSS 颜色名（182 位）——两种都要接住，
        // 所以淡色底走 color-mix 而不是在 hex 后面拼 alpha 后缀（`purple24` 不是颜色）。
        && source.includes("/^#[0-9a-fA-F]{6}$/u.test(value)")
        && source.includes("/^[a-zA-Z]{3,20}$/u.test(value)")
        && source.includes("{ background: `color-mix(in srgb, ${value} 24%, transparent)`, color: value }")
        // 2026-09-29 头像：有本地头像（下载过该专家资源）就显示真头像，否则回退 emoji / 分区图标。
        && source.includes('{avatars[expert.slug] === undefined ? (expert.emoji || (iconName === null ? "🧩" : <PopIcon name={iconName} />)) : <img src={avatars[expert.slug]} alt="" />}')
        // 2026-09-29 用户口径「emoji 都很小，看着不协调」→ 字号 22→26px；兜底底色换成淡灰
        // （没有 color 的老数据也要看得见一个圆）。
        && /\.t-team-pop-avatar\{[^}]*font-size:26px/u.test(source)
        && /\.t-team-pop-avatar\{[^}]*background:var\(--dsw-alias-interactive-bg-hover\)/u.test(source));
      check("技能卡头像用彩色 emoji（固定灰底），与专家卡同一套圆",
        source.includes('className="t-team-pop-avatar t-team-pop-avatar-skill">🧰<')
        && /\.t-team-pop-avatar-skill\{[^}]*background:var\(--dsw-alias-interactive-bg-hover\)/u.test(source));
      check("名称靠左是修出来的：卡片头必须覆盖面板标题行那条 space-between",
        source.includes(".t-team-pop-item .t-team-pop-head{height:44px;justify-content:flex-start}")
        && /\.t-team-pop-head\{[^}]*justify-content:space-between/u.test(source));
      check("底部标签：专家卡放分区（+ 自建），技能卡放技能（+ 仅用户）",
        source.includes('<span className="t-team-pop-tag">{divisionLabel(expert, active)}</span>')
        && source.includes('{expert.custom === true && <span className="t-team-pop-tag">{t("custom.badge")}</span>}')
        && source.includes('<span className="t-team-pop-tag">{t("tab.skills")}</span>')
        && source.includes('{skill.modelInvocable === false && <span className="t-team-pop-tag">{t("pop.skillUserOnly")}</span>}'));
      {
        // 图标替身必须跟得上映射表：缺一个，那个分区就会静默走回退（emoji），
        // 而"图标能渲染出来"这条在自检里也就等于没覆盖。
        const uiSource = await readFile(join(HERE, "src", "client", "ui.jsx"), "utf8");
        const stubSource = await readFile(join(HERE, "tools", "primitives-stub.js"), "utf8");
        const names = [...uiSource.matchAll(/"Icon[A-Za-z]+Medium"/gu)].map((m) => m[0].slice(1, -1));
        const missing = names.filter((name) => !stubSource.includes(`export const ${name} =`));
        check(`替身补齐了卡片用到的全部官方图标（${names.length} 个）`,
          names.length >= 22 && missing.length === 0, missing.join("、"));
      }
      // 用户要求「宽度也和专家一致」：非专家 tab 的宽度不能自己缩。
      // 2026-09-23 起所有 tab 共用 --t-team-pop-w 一个变量，任何 tab 都不再另写死宽度
      // （任务面板下线时那条 [data-tab="tasks"] 覆盖规则也已删除）。
      check("浮层各 tab 不再各自写死宽度（统一走 --t-team-pop-w）",
        !/\.t-team-pop\[data-tab="[a-z-]+"\][^{]*\{[^}]*width:\d+px/u.test(source));
      // 技能标签（2026-09-16 用户要求：弹窗里也能选技能）。
      // 钉四件事：标签存在、数据源是宿主**官方**的 skills/list remote（不是自己又挂一份 host 接口）、
      // 只列用户能点名的技能、点下去是把「使用技能「X」」写进输入框（技能正文由模型自己加载）。
      // 技能标签（2026-09-16 用户要求：弹窗里也能选技能）。
      // 数据源与输入框那个 /skill 菜单**完全一致**（官方 remote skills/list）。
      // ⚠️ 命名空间必须在静态 inject 里声明成 "remote.skills" —— 少了它 ctx.remote.skills 就是
      //    undefined，可选链会把它静默吃成「没有技能」（这个坑真踩过：标签空着，本机 250+ 技能一个不显示），
      //    所以这里专门钉住 inject 声明，别再被"看起来没问题"的写法骗过去。
      check("弹窗有「技能」标签，数据源是官方的 skills/list remote（与输入框 /skill 同源）",
        source.includes('["skills", "tab.skills"]')
        && source.includes("const skillNs = remoteObj?.skills;")
        && source.includes("skillNs.list({ sessionId })")
        && /export const inject = \[[\s\S]*?"remote\.skills"/u.test(source));
      // 点击行为也对齐 /skill 菜单的 onPick：插 `/技能名 `，宿主据此调用该技能。
      check("点技能插入 `/技能名 `（与输入区 /skill 菜单的 onPick 一致）",
        source.includes("insertSkillHint?.(`/${skill.name}`)"));
      // 首次 list 要发现 250+ 个技能、可能几秒：浮层一打开就后台预取 + 按会话缓存，切到技能标签秒开。
      check("技能清单在浮层打开时就预取并按会话缓存（切标签不再等几秒）",
        source.includes("if (!open) return undefined;")
        && source.includes("const cached = skillsCache.get(sessionId);")
        && source.includes("skillsCache.set(sessionId, list)"));
      // stale-while-revalidate：命中缓存秒开，同时后台仍重新 list —— 新装/删除的技能下次打开就自动反映。
      check("命中缓存后仍在后台重新拉取（新技能会自动出现）",
        source.includes("if (cached !== undefined) setSkills(cached);")
        && source.includes("alive && cached === undefined"));
      // 低分辨率自适应：宽度已有 max-width:calc(100vw - 16px)，高度也要有视口钳制 ——
      // min(600px, calc(100vh - 16px))：高屏用 600，矮屏自动收缩，不顶出屏幕（内容区 overflow:auto 兜底滚动）。
      // 2026-09-20 用户：590px 太高，统一调矮到 460px（原本两处 max-height，任务面板下线后只剩本体一处）；
      // 2026-09-23 用户又要「再高一些，高一个卡片多一点」，于是回到 600px —— 正好比 460 多出一整行卡片
      // （卡片 114px + 行距 10px = 124px，再加一点余量）。
      check("弹窗高度有视口钳制（低分辨率自动收缩）",
        /\.t-team-pop\{[^}]*max-height:min\(/u.test(source));
      check("弹窗高度上限 600px（仅本体一处；任务标签页覆盖规则已随面板下线删除）",
        [...source.matchAll(/max-height:min\((\d+)px, calc\(100vh - 16px\)\)/gu)].map((m) => m[1]).join(",") === "600",
        [...source.matchAll(/max-height:min\((\d+)px, calc\(100vh - 16px\)\)/gu)].map((m) => m[1]).join(","));
      // 技能缓存要有界：每个会话 250+ 条技能对象，无上限会随会话数单调增长。LRU 保留最近 20 个会话。
      check("技能清单缓存有上限（LRU 淘汰，防内存单调增长）",
        source.includes("const SKILLS_CACHE_MAX = 20;")
        && source.includes("while (skillsCache.size > SKILLS_CACHE_MAX)")
        && source.includes("cacheSkills(sessionId, list);"));
      // 标签计数（2026-09-18 用户要求：专家、技能两个标签各带一个括号数字，形如「技能(·401)」）。
      // 钉四件事：文案走字典（zh/en 各一份）、统计的是**总数**而不是筛后条数、
      // 未知时给 undefined（渲染层据此不画括号）、数字等宽（401 → 99 时标签宽度不跳）。
      check("专家/技能标签带计数，且计数走字典、只统计总数",
        source.includes('t("tab.count", { count: tabCounts[key] })')
        && source.includes('"tab.count": "(·{count})"')
        && source.includes("experts: snap === undefined ? undefined : experts.length")
        && source.includes("skills: skills === null ? undefined : skills.length")
        && source.includes(".t-team-pop .t-team-tab-count{"));
      // ⚠️ 真正的根因（2026-09-16，靠界面诊断才定位到）：SummonButton 是经 slot 渲染的组件，
      //    它拿到的 props.ctx 是**宿主的 scoped ctx**，上面没有 remote；
      //    而插件自己的 remote 门面在**根 ctx** 上。所以正确做法不是覆盖 ctx，而是
      //    把根 ctx 的 remote 门面单独作为 rootRemote 传进去。漏了它，技能取数拿到的就是 undefined。
      check("SummonButton 的挂载处把 rootRemote（根 ctx 的 remote 门面）传进去了",
        /React\.createElement\(SummonButton, \{ \.\.\.props, t: ctx\.locale\.bind\(NS\), remote, getActive, rootRemote: ctx\.remote \}\)/u.test(source));
      // ⚠️ 取数 effect 必须待在 SummonButton **里面**：上一版它被误加进了 ExpertPicker
      //    （定时任务面板的挑选器），结果技能标签永远停在 skills === null —— 界面显示
      //    「还没有可用的技能」，而且那个组件一打开就会因为 popTab 未定义直接抛错。
      //    只查"文本存在"的断言抓不到这种错，所以这里按**组件切片**来钉。
      {
        const summonAt = source.indexOf("function SummonButton(");
        const nextFnAt = source.indexOf("\nfunction ", summonAt + 1);
        const summonBody = source.slice(summonAt, nextFnAt === -1 ? source.length : nextFnAt);
        check("技能取数 effect 与 skills 状态在同一个组件（SummonButton）里",
          summonBody.includes("const [skills, setSkills]")
          && summonBody.includes("skillNs.list({ sessionId })"));
      }
      check("技能是插进输入框、不发送（复用插入桥）",
        source.includes("function insertSkillHint(target, text)")
        && source.includes("insertSkillHint: (text) => insertSkillHint(target(), text)"));
      check("技能标签同样每行固定 4 列",
        source.includes('.t-team-pop[data-tab="skills"] .t-team-pop-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))'));
      // 加宽之后靠右的按钮会把浮层顶出视口 —— 钳制现在是**官方 hook 的职责**（它按浮层自身宽度把
      // left 钳进视口）；本插件那份等价实现（官方件缺席时用）保留同一句钳制。两条路都不许退回"不钳"。
      check("浮层定位钳制右边界（加宽后不会顶出视口）",
        source.includes("window.innerWidth - width - margin")
        && source.includes("useAnchoredPosition({ open, anchorRef, panelRef, side, align: \"start\", gap, margin })"));
    }
  }
  check("专家标签内容被包进 tabbody（不再是裸面板）", html.includes('class="t-team-tabbody"'), "tabbody");
  {
    const clientMethods = [...client.matchAll(/direct\("([A-Za-z]+)"/g)].map((match) => match[1]).sort();
    const hostMethods = [...(await readFile(join(HERE, "lib/remote.js"), "utf8")).matchAll(/descriptor\("([A-Za-z]+)"/g)].map((match) => match[1]).sort();
    check("客户端与 host 的 remote 方法集合一致", JSON.stringify(clientMethods) === JSON.stringify(hostMethods),
      `${clientMethods.join(",")} vs ${hostMethods.join(",")}`);

    // A-2/A-3：schema 已提到 lib/remote-schemas.js 共用一份，但**信封**（host 的 descriptor /
    // 客户端的 direct）仍是两端各写一遍 —— 参数名或 typeSymbol 漏改一处就会在调用期才炸。
    // 这里按方法名机械比对参数名集合与 typeSymbol，把"漏改"变成加载期就能抓到的错误。
    const hostSrc = await readFile(join(HERE, "lib/remote.js"), "utf8");
    const clientSrc = await readClientSource();
    const envelopeNames = (src, fn) => {
      const map = new Map();
      const re = new RegExp(`${fn}\\("([A-Za-z]+)"\\s*,\\s*\\[([\\s\\S]*?)\\]\\s*,\\s*"([^"]+)"`, "g");
      for (const match of src.matchAll(re)) {
        map.set(match[1], {
          params: [...match[2].matchAll(/name:\s*"([A-Za-z]+)"/g)].map((item) => item[1]).sort(),
          typeSymbol: match[3],
        });
      }
      return map;
    };
    const hostEnv = envelopeNames(hostSrc, "descriptor");
    const clientEnv = envelopeNames(clientSrc, "direct");
    const envelopeDrift = [];
    for (const method of new Set([...hostEnv.keys(), ...clientEnv.keys()])) {
      const hostSide = hostEnv.get(method);
      const clientSide = clientEnv.get(method);
      if (hostSide === undefined || clientSide === undefined) { envelopeDrift.push(`${method}:两端不齐`); continue; }
      if (JSON.stringify(hostSide.params) !== JSON.stringify(clientSide.params)) {
        envelopeDrift.push(`${method}:参数名 ${clientSide.params.join("/")} ≠ ${hostSide.params.join("/")}`);
      }
      if (hostSide.typeSymbol !== clientSide.typeSymbol) {
        envelopeDrift.push(`${method}:typeSymbol ${clientSide.typeSymbol} ≠ ${hostSide.typeSymbol}`);
      }
    }
    check("A-2/A-3：每个 remote 方法的参数名与 typeSymbol 两端一致（漏改一处就会被抓）",
      envelopeDrift.length === 0, envelopeDrift.slice(0, 3).join("；") || `${hostEnv.size} 个方法全对齐`);
  }
  check("卡片含名称/分区/简介", html.includes('class="t-team-card-name"') && html.includes('class="t-team-card-division"') && html.includes('class="t-team-card-desc"'));
  // 右侧留白只应该在名称列（避开右上角开关），不能加在整块正文上，否则描述文字会提前换行
  {
    const css = (await readClientSource()).match(/const CSS = `([\s\S]*?)`;/)?.[1] ?? "";
    const bodyRule = css.match(/\.t-team-card-body\{[^}]*\}/)?.[0] ?? "";
    const identityRule = css.match(/\.t-team-identity\{[^}]*\}/)?.[0] ?? "";
    check("正文不留右侧空白、名称列才留白", bodyRule.includes("padding:12px}") && identityRule.includes("padding-right:46px"), `${bodyRule} | ${identityRule}`);
    // 2026-09-26 用户反馈「专家的边框太明显了，不协调」：那条
    // `.t-team-card[data-enabled="true"]{border-color:var(--dsw-alias-button-primary-fill)}`
    // 本是给「已启用」用的，可启停开关 2026-09-16 就下线了、名单默认全启用 ——
    // 于是 323 张卡一张不落全挂上近白主色描边（深色下 --dsw-static-neutral-bluish-50 = #f9fafb，
    // 压在 #2c2c2e 的卡片底上亮成一条条白框）。现在常态用最淡的 border-l1、悬停才抬到 border-l2，
    // 卡片与页面的层次交给 bg-layer-2 表达。这条两头钉住：白边不许回来。
    check("专家卡片边框淡而不刺眼（常态 border-l1，不再按启用状态涂主色）",
      /\.t-team-card\{[^}]*border:1px solid var\(--dsw-alias-border-l1\)/u.test(css)
      && !/\.t-team-card\[data-enabled/u.test(css),
      css.match(/\.t-team-card\{[^}]*\}/u)?.[0]?.slice(0, 96) ?? "(找不到 .t-team-card 规则)");
  }
  {
    const src = await readClientSource();
    // 2026-09-16 用户要求：既然默认全部启用，专家列表里就不再放启停开关（代码以注释形式保留，便于以后恢复）。
    // 两头一起钉：渲染结果里必须没有开关和状态筛选，源码里必须还留着它们 ——
    // 否则就成了「删掉」而不是「注释掉」，以后想恢复还得重写。
    check("专家卡片不再渲染启停开关、状态筛选一并下线（两段代码仍留在源码里）",
      !html.includes('class="t-team-card-switch"')
      && !html.includes('value="on"')
      && src.includes('className="t-team-card-switch"')
      && src.includes("{/* 状态筛选（已启用 / 未启用）随启停开关一起下线"));
  }
  check("不再有底部整宽动作条", !html.includes("t-team-card-foot") && !html.includes("t-team-card-action"));
  // 按钮换成官方 Button（ghost 档）：不再有自绘的 .t-team-icon-btn，改由 data-variant 认。
  check("每张卡有查看提示词按钮（官方 Button，ghost 档）",
    html.includes('title="查看提示词"') && html.includes("📄") && html.includes('data-variant="ghost"'), "提示词按钮");
  {
    const css = (await readClientSource()).match(/const CSS = `([\s\S]*?)`;/)?.[1] ?? "";
    check("标题字号已缩小到 14px", /\.t-team-card-name\{font-size:14px/.test(css), css.match(/\.t-team-card-name\{[^}]*\}/)?.[0]?.slice(0, 60));
    // ⚠️ 这条原本断言的是 .t-team-switch —— 但那个 class 当时**被两处共用**（设置页那套 38×22
    // 与卡片这套 28×16），后定义的卡片样式把设置页的整套覆盖掉，设置页开关因此"看不见"。
    // 现在各用各的名字：卡片 = .t-team-card-switch（尺寸保持不变），设置页 = .t-team-switch。
    check("卡片上的开关保持 28×16（滑块 12px）",
      /\.t-team-card-switch\{[^}]*width:28px;height:16px/.test(css)
      && /\.t-team-card-switch-knob\{[^}]*width:12px;height:12px/.test(css), "开关尺寸");
    check("弹窗样式齐备", [".t-team-mask{", ".t-team-modal{", ".t-team-modal-head{", ".t-team-modal-body{"].every((s) => css.includes(s)));

    // ---- 官方 Modal 的高度约束（2026-09-28 修「提示词弹窗漫出屏幕」）----
    // 官方 .dialog **没有** max-height：Modal.module.css 的注释把这件事交给调用方
    // （consumers cap growth with `max-height: 100%`）。它同时 createPortal 到 body、
    // .root 只做居中不做滚动，所以内容一长就整体顶出视口 —— 专家 persona 动辄上万行，
    // 必然触发。三层缺一条都不生效（flex 子项默认 min-height:auto 会把父级继续撑破），
    // 所以逐条钉住：只断言"CSS 里有这两个类名"挡不住"封装没把类传给官方组件"。
    check("官方 Modal 的高度约束齐备（dialog 兜高 / content 可收缩 / body 自滚）",
      css.includes(".t-team-modal-fit{max-height:100%}")
      && css.includes(".t-team-modal-fit-content{min-height:0}")
      && /\.t-team-modal-fit-content > div:last-child\{[^}]*overflow:auto/.test(css),
      "高度约束缺项 —— 长内容会把弹窗顶出视口");
    {
      const uiSource = await readFile(join(HERE, "src/client/ui.jsx"), "utf8");
      check("Modal 封装把限高类真交给了官方 Modal（className + contentClassName）",
        uiSource.includes("className={dialogCls}")
        && uiSource.includes('contentClassName="t-team-modal-fit-content"'),
        "封装没透传限高类 —— CSS 写得再全也不生效");
      const settingsSource = await readFile(join(HERE, "src/client/settings.jsx"), "utf8");
      check("提示词正文改用 .t-team-prompt-body，不再复用自绘兜底的 .t-team-modal-body",
        css.includes(".t-team-prompt-body{")
        && settingsSource.includes('className="t-team-prompt-body"')
        && !settingsSource.includes("t-team-modal-body"),
        "提示词正文又在复用兜底 Modal 的内部类名（会带上不属于它的 padding/overflow）");
      check("编辑器弹窗要回 860px 宽（官方默认 380px 装不下 persona 正文）",
        css.includes(".t-team-editor-modal{width:min(860px,94vw)")
        && settingsSource.includes('className="t-team-editor-modal"'),
        "编辑器宽度约束丢了 —— 类名会再度变成死代码");

      // ---- 两个弹窗的尺寸（2026-09-28 第二轮：用户「太长 太窄」）----
      // 官方 .dialog 的 min(380px,100%) 是给**确认框**的尺寸（一句话 + 两个按钮）。
      // 拿它装长内容就成了又高又窄的窄条 —— 长行几乎每句折行，再撑满视口高度。
      // 0.4.10 只治了"漫出屏幕"，没治形状，所以这里把宽高一起钉住。
      check("提示词弹窗有合适的宽高（不是官方那个又高又窄的 380px）",
        css.includes(".t-team-prompt-modal{width:min(960px,94vw);max-height:min(84vh,800px)}")
        && settingsSource.includes('className="t-team-prompt-modal"'),
        "提示词弹窗尺寸约束丢了 —— 会退回 380px 窄条");
      // 两组规则都是单类选择器、特异性相同，max-height 谁在后面谁生效。
      // 顺序一反，.t-team-modal-fit 的 max-height:100% 就会盖掉弹窗自己的高度上限，
      // 表现正是"又占满整屏"——所以顺序本身也要断言。
      check("尺寸规则写在 .t-team-modal-fit 之后（同特异性靠源顺序生效）",
        css.indexOf(".t-team-prompt-modal{") > css.indexOf(".t-team-modal-fit{")
        && css.indexOf(".t-team-editor-modal{") > css.indexOf(".t-team-modal-fit{"),
        "顺序反了：max-height:100% 会盖掉弹窗自己的高度上限，弹窗又撑满整屏");
      check("编辑器弹窗的死样式已清（.t-team-editor-body 无引用者）",
        !css.includes(".t-team-editor-body"), "死样式回来了");

      // ---- 提示词弹窗的复制按钮（2026-09-28 用户要求：关闭按钮旁边加一个）----
      check("提示词弹窗接了复制按钮，文案走字典（两端都要有）",
        settingsSource.includes("copyPrompt")
        && settingsSource.includes('t("card.copy")')
        && settingsSource.includes('t("card.copied")')
        && settingsSource.includes('t("card.copyFailed")'),
        "复制按钮没接到弹窗上，或文案硬编码了");
      // 官方标题栏只有「标题 + 关闭」两个位置、没有插槽 —— 按钮是靠绝对定位"落"上去的。
      // 这条规则一丢，按钮就会掉回正文的按钮流里（出现在文字上方，而不是关闭按钮左边）。
      check("复制按钮的定位规则在位（标题栏没有插槽，只能绝对定位）",
        css.includes(".t-team-prompt-tools{position:absolute"),
        "定位规则丢了 —— 按钮会掉进正文流，不在关闭按钮旁边");
      // 非安全上下文里 navigator.clipboard 缺席是常态，官方 writeClipboard 自带
      // execCommand 兜底；换成裸 Clipboard API 会在那些环境里静默失败（点了没反应）。
      check("复制优先走官方 writeClipboard（自带 execCommand 兜底）",
        uiSource.includes("primitives.writeClipboard"),
        "复制退回自绘 —— 非安全上下文会静默失败");
    }
  }

  // 冲突路径：revision 过期 → 客户端应识别 tTeam/conflict（不是靠猜 message）
  const conflictResult = await fakeRemote.setEnabled(["x"], 99);
  check("冲突返回稳定 code", conflictResult.ok === false && conflictResult.error.code === "tTeam/conflict", JSON.stringify(conflictResult.error.code));
}

// ---------- 6c. 产物新鲜度：lib/client.js 必须能由 src/client/ 的源码复现 ----------
console.log("\n[6c] 客户端产物新鲜度");
{
  // 只断言"内容里有某段字符串"挡不住"改了源码却忘了 build" —— 这里真重新渲染一次比对。
  // 产物新鲜度要复现构建：build-client.mjs 就住在同级 tools/（D-2 起随仓库走）。
  const { renderClientBundle } = await import(join(SELF_DIR, "build-client.mjs"));
  const expected = await renderClientBundle();
  const actual = await readFile(join(HERE, "lib/client.js"), "utf8");
  check("lib/client.js 与当前客户端源码一致（不是过期产物）",
    expected === actual,
    expected === actual
      ? `${Buffer.byteLength(actual)} 字节`
      : `期望 ${Buffer.byteLength(expected)} / 实际 ${Buffer.byteLength(actual)}`);
  // 拆分后的目录清单必须与读取顺序**逐项一致**：新增或改名一个客户端源文件却忘了登记，
  // 上面所有基于 readClientSource() 的断言都会**读不到那段代码** —— 门禁不会红，只是静默失去覆盖。
  {
    const onDisk = readdirSync(join(HERE, "src", "client")).filter((name) => /\.jsx?$/u.test(name)).sort();
    const listed = [...CLIENT_SOURCE_ORDER].sort();
    check("客户端源码目录与读取清单一致（文件全在、没有未登记的孤儿文件）",
      onDisk.join(",") === listed.join(","),
      onDisk.join(",") === listed.join(",") ? `${onDisk.length} 个文件` : `目录：${onDisk.join(",")} / 清单：${listed.join(",")}`);
  }
}

// 客户端源码的**未定义标识符**（TS2304/TS2552）：这类引用 esbuild **打包不报**（它把未知标识符
// 当全局变量）、文本断言也看不出异常，只在**那个组件真的被渲染**时炸成 ReferenceError ——
// 0.3.49 把 SummonButton 的浮层 effect 误复制进 ExpertPicker（引用 place()/popTab），
// 于是定时任务点「添加/编辑」整块白屏，直到 0.3.69 才清掉。门禁本体是独立脚本（CI 与
// prepublishOnly 也直接跑它），这里保证它在自检里**真的被执行且真的干净**。
{
  const { spawnSync } = await import("node:child_process");
  const refs = spawnSync(process.execPath, [join(HERE, "tools", "check-client-refs.mjs")], { cwd: HERE, encoding: "utf8" });
  check("客户端源码没有未定义标识符（只在渲染时炸的引用会被这道门禁拦住）",
    refs.status === 0,
    refs.status === 0
      ? (refs.stdout ?? "").trim()
      : (refs.stderr ?? "").trim().split("\n").slice(0, 4).join(" / "));
  const pkgForCheck = JSON.parse(await readFile(join(HERE, "package.json"), "utf8"));
  const ciText = existsSync(join(HERE, ".github", "workflows", "ci.yml"))
    ? await readFile(join(HERE, ".github", "workflows", "ci.yml"), "utf8")
    : "";
  check("未定义标识符检查已挂在发布链与 CI 上（否则它只是个没人跑的工具）",
    String(pkgForCheck.scripts?.prepublishOnly ?? "").includes("check-client") && ciText.includes("check-client"),
    `prepublishOnly=${String(pkgForCheck.scripts?.prepublishOnly ?? "").includes("check-client")} / ci=${ciText.includes("check-client")}`);
}

// 客户端组件的**渲染**冒烟：把每个组件（含设置页五个标签）真的渲染一遍。tsc 只能看静态引用，
// 而"引用了另一个组件的局部变量"这类错误**打包不报、文本断言看不出**，只在那个组件被渲染时
// 炸成 ReferenceError —— 0.3.49 的 ExpertPicker 残留就是这么漏了两个版本（定时任务表单白屏）。
{
  const { spawnSync } = await import("node:child_process");
  const smoke = spawnSync(process.execPath, [join(HERE, "tools", "render-smoke.mjs")], { cwd: HERE, encoding: "utf8" });
  check("客户端每个组件都能渲染（渲染冒烟：只在渲染时炸的引用会被它抓住）",
    smoke.status === 0,
    smoke.status === 0
      ? (smoke.stdout ?? "").trim()
      : (smoke.stderr ?? "").trim().split("\n").slice(0, 4).join(" / "));
  const pkgForSmoke = JSON.parse(await readFile(join(HERE, "package.json"), "utf8"));
  const ciTextSmoke = existsSync(join(HERE, ".github", "workflows", "ci.yml"))
    ? await readFile(join(HERE, ".github", "workflows", "ci.yml"), "utf8")
    : "";
  check("渲染冒烟已挂在发布链与 CI 上（否则它只是个没人跑的工具）",
    String(pkgForSmoke.scripts?.prepublishOnly ?? "").includes("render-smoke") && ciTextSmoke.includes("render-smoke"),
    `prepublishOnly=${String(pkgForSmoke.scripts?.prepublishOnly ?? "").includes("render-smoke")} / ci=${ciTextSmoke.includes("render-smoke")}`);
}

// ---------- 6b. 客户端修复回归（每条对应一个已修缺陷） ----------
console.log("\n[6b] 客户端修复回归");
{
  const source = await readClientSource();
  const dicts = source.match(/const zh = \{([\s\S]*?)\n\};[\s\S]*?const en = \{([\s\S]*?)\n\};/u);

  if (dicts === null) {
    check("能解析 zh/en 两份字典", false);
  } else {
    const keysOf = (block) => new Set([...block.matchAll(/^\s*"([^"]+)":/gmu)].map((m) => m[1]));
    const zhKeys = keysOf(dicts[1]);
    const enKeys = keysOf(dicts[2]);
    const onlyZh = [...zhKeys].filter((k) => !enKeys.has(k));
    const onlyEn = [...enKeys].filter((k) => !zhKeys.has(k));
    check("zh/en 字典键集合一致", onlyZh.length === 0 && onlyEn.length === 0, [...onlyZh, ...onlyEn].join(",") || `${zhKeys.size} 键`);
    // 用法包括 t("k")、t("k", {...})、ctx.locale.bind(NS)("k") —— 所以直接看"字典块之外还有没有出现这个键"
    const outsideDicts = source.replace(dicts[0], "");
    const dead = [...zhKeys].filter((k) => !outsideDicts.includes(`"${k}"`));
    check("字典里没有无人引用的键", dead.length === 0, dead.join(",") || "clean");
    // 同一个概念在同一个面板里必须同一个词：过滤器从第一天起叫「分类」，
    // 新建专家表单如果换个词（曾经叫「分区」），用户会以为是两回事。
    const entryValue = (block, key) => new RegExp(`"${key}": "([^"]*)"`, "u").exec(block)?.[1] ?? "";
    check("面板：过滤器与新建专家的落点字段用同一个词",
      entryValue(dicts[1], "filter.division") === entryValue(dicts[1], "custom.division")
      && entryValue(dicts[2], "filter.division") === entryValue(dicts[2], "custom.division"),
      `zh ${entryValue(dicts[1], "filter.division")}/${entryValue(dicts[1], "custom.division")} · en ${entryValue(dicts[2], "filter.division")}/${entryValue(dicts[2], "custom.division")}`);
  }

  check("分类编辑器把错误渲染在区块内部（否则被遮罩盖住＝按钮像没反应）",
    /\{error !== "" && <div className="t-team-error">\{error\}<\/div>\}/u.test(source));
  check("@ 菜单注册失败后能自愈（名册通知 + 分区签名，不再是「只注册一次」）",
    source.includes("onCatalogLoaded") && source.includes("catalogListeners") && source.includes("const syncSources"));
  check("首屏读取失败给对的文案且可重试",
    source.includes('t("settings.loadFailed"') && source.includes('onClick={() => void reload(true)}'));
  check("冲突提示不会被随后的 reload 抹掉（先刷新再落错误）",
    source.includes("await reload(true);\n      setError(conflict"));
  // 2026-09-21：设置页收敛为 专家 / 分类 两个标签；2026-09-28 技能开关并入后是三个 —— 边界数跟着变。
  check("设置面板每个标签都有区块错误边界（一条坏数据不再白屏整页）",
    source.includes("class SectionBoundary extends React.Component") && (source.match(/<SectionBoundary /gu) ?? []).length === 3,
    String((source.match(/<SectionBoundary /gu) ?? []).length));
  check("弹窗位置随 resize/scroll 重算",
    /window\.addEventListener\("resize", place\)/u.test(source) && /window\.addEventListener\("scroll", place, true\)/u.test(source));
  check("locale 兜底：zh* 走中文、其余走英文（zh-Hant 不再是混合界面）",
    source.includes('startsWith("zh") ? "zh" : "en"'));
  // 只查"字典之外 + 去掉注释后"的 JSX 文本节点：那里出现中文才会在英文界面里露出来
  {
    // 面板的「分区」入口：新建/编辑表单必须能选分区、也能新建分区（否则用户只能去手工建目录）
    check("面板：新建/编辑表单带「分区」下拉与「新建分区」入口",
      source.includes('t("custom.division")') && source.includes('t("custom.divisionNew")')
      && source.includes("NEW_DIVISION") && source.includes("editorDivisionOptions"));
    check("面板：保存时把分区一并交给服务端（新建分区用输入框里的目录名）",
      source.includes("editor.divisionNew ? editor.divisionKey : editor.division")
      && source.includes("divisionLabel: editor.divisionNew ? editor.divisionLabel.trim() : \"\""));
    check("面板：编辑落在列表外分类的专家时，当前分类会补进下拉（看得见与存下去的一致）",
      source.includes("!divisionOptions.some((item) => item.key === editor.division)"));
    // 分类管理页：三个写回动作都要真的接到 remote 上，官方分类行不给编辑入口
    check("面板：分类管理接到 createCategory / updateCategory / deleteCategory 三个写回动作",
      source.includes("remote.createCategory(") && source.includes("remote.updateCategory(")
      && source.includes("remote.deleteCategory("));
    check("面板：官方分类行没有改名/删除入口（只读，靠 official 标记判断）",
      source.includes("{!item.official && (") && source.includes('t("cat.officialNote")'));
    check("面板：默认分类必须在选项里（构造下拉时兜底补上）",
      source.includes("!base.some((item) => item.key === fallback)"));
    // 光在源码里不算数：产物里必须真的带上（改了 src 忘了 build 是最常见的翻车方式；
    // 中文会被 esbuild 转义成 \uXXXX，所以这里断言的是 ASCII 部分）。
    const bundleText = await readFile(join(HERE, "lib/client.js"), "utf8");
    check("面板：构建产物里带上了分类入口（不只在源码里）",
      bundleText.includes("__new") && bundleText.includes("custom.divisionNew")
      && bundleText.includes("categories") && bundleText.includes("CategoriesTab")
      && bundleText.includes("createCategory"));
    const withoutDicts = source.replace(dicts?.[0] ?? "", "");
    const jsxOnly = withoutDicts.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/^\s*\/\/.*$/gmu, "");
    const hardcoded = [...jsxOnly.matchAll(/>[^<>{}]*[\u4e00-\u9fff][^<>{}]*</gu)].map((m) => m[0].slice(0, 40));
    check("客户端不再有硬编码的 locale 分支文案",
    !/getActive\(\) === "en" \? "/u.test(source), "clean");
  check("用户可见文案不再有硬编码中文（JSX 文本节点）", hardcoded.length === 0, hardcoded.join(" | ") || "clean");
  }
  check("不再引用随包未发布的同步脚本（sync.sh / sync-zh.py）",
    !/sync\.sh|sync-zh/u.test(source) && !/sync\.sh|sync-zh/u.test(await readFile(join(HERE, "lib/i18n.js"), "utf8")));
  check("已删除的两处硬编码拼接不再出现",
    !source.includes("${working} 工作中") && !source.includes("${action} 调用失败"));

  // 浮层材质配对（2026-09-22）：宿主 0.1.7 的视觉统一改版把 --dsw-specific-menu 从
  // 「= 不透明的 --dsw-alias-bg-layer-3」换成了**半透明菜单材质**，配套的
  // --dsw-menu-backdrop-filter 才是毛玻璃观感。只填色不配 filter 的规则在 0.1.7 上
  // 就是「弹窗半透明、能看见底下的对话」（用户实测报障）。宿主自己的 elevation 测试
  // （translucentMenusWithoutBackdrop）钉的是同一条规范，这里跟上。
  const cssSource = await readFile(join(HERE, "src/client/css.js"), "utf8");
  const menuFilled = [...cssSource.matchAll(/\{([^{}]*)\}/gu)]
    .map((match) => match[1])
    .filter((body) => /background(?:-color)?:\s*var\(--dsw-specific-menu/u.test(body));
  const menuWithoutFilter = menuFilled.filter((body) => !/backdrop-filter:/u.test(body));
  check("浮层材质：用 --dsw-specific-menu 填色的规则都配了 backdrop-filter",
    menuFilled.length > 0 && menuWithoutFilter.length === 0,
    `${menuFilled.length} 条填色规则，缺 filter ${menuWithoutFilter.length} 条`);

  // ---------- 错误码两端对齐 ----------
  //
  // 2026-09-28 审计抓到两处「客户端在等一个 host 永远不会抛的码」。这类缺陷不报错，
  // 只会**静默走错分支**，所以必须用断言把两端的字符串钉在一起：
  //   · 技能开关的乐观锁冲突码在 0.4.0 把 skillGate 命名空间并进 tTeam 时漏改，
  //     客户端仍比 `skillGate/conflict` → 冲突时不自动重拉快照，用户反复点保存反复失败，
  //     只有手动刷新页面才解得开（而这条路径偏偏只在多窗口同时改设置时才走到）；
  //   · 自建专家那边更彻底：它在**本地化文案**里搜 "custom-slug-taken"，而 host 的
  //     customError 把那串铸在 `error.code` 上、message 是给人看的句子 → 那个 if 永远 false，
  //     slug 撞车时名册不刷新，用户改完再存还是撞。
  {
    const hostSource = await readFile(join(HERE, "lib/index.js"), "utf8");
    const remoteSource = await readFile(join(HERE, "lib/remote.js"), "utf8");
    // 复现 host 侧 customError 的铸码规则；先断言那行还在，否则下面的比对就是自说自话
    const rule = /error\.code = `(.*?)`;/u.exec(hostSource)?.[1];
    check("host 的 customError 仍是「tTeam/ + 去掉 error. 前缀 + 驼峰转连字符」这条铸码规则",
      typeof rule === "string" && rule.includes("tTeam/") && rule.includes("replace"),
      rule ?? "没找到铸码那一行（规则变了？下面的码比对需要同步改）");
    const toCode = (key) => `tTeam/${key.replace(/^error\./u, "").replace(/[A-Z]/gu, (ch) => `-${ch.toLowerCase()}`)}`;
    for (const key of ["error.customSlugTaken", "error.customNameTaken", "error.customConflict"]) {
      const code = toCode(key);
      check(`客户端按 host 真正会抛的码分支：${key} → ${code}`,
        source.includes(`"${code}"`),
        source.includes(`"${code}"`) ? code : `客户端源码里找不到 "${code}"`);
    }
    // 只匹配**真实代码形式**（`if (message.includes("custom-…")`）：readClientSource 读的是
    // src/client 源码，而修复处的注释里必然会引用那串旧写法来说明"原先错在哪"，
    // 用裸 includes 会被自己的注释触发（第一版就这么红过一次）。
    check("客户端不再在本地化文案里搜错误码（那永远搜不到）",
      !/if\s*\(\s*message\.includes\(\s*["']custom-/u.test(source),
      '仍有 if (message.includes("custom-…")) 形式的判断');
    check("技能开关的冲突码跟着命名空间合并改成了 tTeam/conflict",
      source.includes('code === "tTeam/conflict"') && !source.includes('"skillGate/conflict"'),
      source.includes('"skillGate/conflict"') ? "仍有 skillGate/conflict 残留" : "ok");
    check("host 的 setDisabled 抛的确实是 tTeam/conflict（客户端比的就是它）",
      /setDisabled[\s\S]{0,600}?RemoteError\("tTeam\/conflict"/u.test(remoteSource));
    check("businessError 的 error 参数有类型标注（缺标注时它是 any，那道 @ts-expect-error 形同虚设）",
      /@param \{unknown\} error/u.test(remoteSource));
  }
}

// ---------- 8c. inject 静态体检 ----------
// 精确语义（2026-09-13 用真 cordis 4.0.2 实测，别记成更粗的说法）：
//   · 宿主**有**该服务（任一祖先 fiber provide 了它）→ 属性访问 `ctx.settings` 读得到，
//     即使没写进 inject —— 所以这类 bug 在"什么服务都齐"的机器上根本不会现形；
//   · 宿主**没有**该服务 → `ctx.settings` 抛 `cannot get property "settings" without inject`，
//     而 `ctx.get("settings")` 干净地返回 undefined。
// 这正是本闸门存在的理由：属性访问要靠 try/catch 兜，缺服务的宿主上静默降级、日志无线索。
console.log("\n[8c] inject 静态体检");
{
  // `fiber` 是 Context 的**固有实例属性**（vendor/cordis 的 Context 构造函数里就赋了值），
  // 不是宿主服务：它不会因缺服务抛 `cannot get property ... without inject`，而且是 0.1.7 的
  // `settings.configure(policy, owner)` 指定「这条页面策略属于哪个插件实例」的唯一正规写法
  // （宿主 README 的适配指引即 `configure({ auto: false }, ctx.fiber)`）。
  const allow = new Set(["get", "inject", "on", "effect", "plugin", "logger", "reflect", "dispose", "scope", "root", "fiber"]);
  const strip = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/([^:])\/\/.*$/gm, "$1");
  const indexSource = await readFile(join(HERE, "lib/index.js"), "utf8");
  const pluginInject = new Set(
    (indexSource.match(/export const inject = \[([^\]]*)\]/)?.[1] ?? "")
      .split(",").map((item) => item.trim().replace(/["']/g, "")).filter((item) => item !== ""),
  );
  const offenders = [];
  // 名单必须覆盖**所有**会碰宿主服务的自研 host 模块：i18n.js（读 locale）与 skill.js（注册
  // 随包 skill）过去不在名单里，于是 i18n.js 里那处 `ctx.settings` 属性访问一路绿灯。
  for (const file of ["lib/index.js", "lib/remote.js", "lib/i18n.js", "lib/skill.js"]) {
    const source = strip(await readFile(join(HERE, file), "utf8"));
    const injected = new Set(pluginInject);
    const localInject = source.match(/static inject = \[([^\]]*)\]/)?.[1] ?? source.match(/export const inject = \[([^\]]*)\]/)?.[1] ?? "";
    for (const item of localInject.split(",")) {
      const name = item.trim().replace(/["']/g, "");
      if (name !== "") injected.add(name);
    }
    for (const match of source.matchAll(/\bthis\.ctx\.([A-Za-z_][A-Za-z0-9_]*)|\bctx\.([A-Za-z_][A-Za-z0-9_]*)/g)) {
      const name = match[1] ?? match[2];
      if (injected.has(name) || allow.has(name)) continue;
      offenders.push(`${file}:ctx.${name}`);
    }
  }
  check("没有「未注入就用属性访问」的服务", offenders.length === 0, offenders.join(","));

  // 行为断言（反向可证伪）：旧实现 `ctx.settings?.get?.("locale")` 在**只提供 `ctx.get` 的忠实
  // ctx** 下必然读到 zh —— 也就是说这条断言在修复前一定是红的，不是把已有绿灯又写一遍。
  const { readLocale } = await import(join(HERE, "lib/i18n.js"));
  const onlyGetCtx = {
    get: (name) => (name === "settings" ? { get: (ns) => (ns === "locale" ? { preference: "en-US" } : undefined) } : undefined),
  };
  check("readLocale 用 ctx.get 取可选 settings（只给 get 的 ctx 也必须真读到 en）",
    readLocale(onlyGetCtx) === "en", readLocale(onlyGetCtx));
  check("readLocale：settings 缺席 / 无 get / get 抛错 / 非 en 偏好 → 一律 zh 且不抛",
    readLocale({}) === "zh"
      && readLocale(undefined) === "zh"
      && readLocale({ get: () => { throw new Error("boom"); } }) === "zh"
      && readLocale({ get: () => ({ get: () => ({ preference: "zh-Hant" }) }) }) === "zh"
      && readLocale({ get: () => ({}) }) === "zh",
    [readLocale({}), readLocale(undefined), readLocale({ get: () => ({}) })].join("/"));

  // 作用域 ctx 的形状（2026-09-13 实测钉住）：`ctx.inject(names, cb)` 回调收到的 scoped 是
  // **完整 Context** —— 代码注释里曾写「`scoped.effect` 是 undefined」，那是过时说法。
  // 事实是可执行的，所以跑一次真 cordis 钉住它，而不是再补一句注释。
  const { Context: ScopeContext } = await import("@deepseek-ai/cordis");
  const scopeRoot = new ScopeContext();
  scopeRoot.reflect.provide("tools", { register: () => () => {} });
  let scopeShape;
  scopeRoot.inject(["tools"], (scoped) => { scopeShape = scoped; });
  await new Promise((resolve) => setTimeout(resolve, 10)); // inject 回调是异步（微任务后）触发的
  check("作用域 ctx 是完整 Context（effect/get/logger/inject 都在）—— 「scoped 没 effect」是过时说法",
    typeof scopeShape?.effect === "function" && typeof scopeShape?.get === "function"
      && typeof scopeShape?.logger === "function" && typeof scopeShape?.inject === "function",
    scopeShape === undefined
      ? "inject 回调没触发（探针本身失效）"
      : `effect=${typeof scopeShape.effect} get=${typeof scopeShape.get} logger=${typeof scopeShape.logger}`);
}



console.log("\n[12] 自包含（包内快照与播种）");
{
  const dataDir = join(HERE, "data");
  const snapshotExperts = join(dataDir, "experts");
  check("包内快照存在 data/experts", existsSync(snapshotExperts));
  // 专家条目 = `<分区>/<slug>.md`、`<分区>/<子目录>/<slug>.md`（game-development 下的引擎分层）
  // 或 `<分区>/<slug>/persona.md`（目录形态专家包，算 1 位）。
  // 专家包内部**不再递归** —— 那里的 agents/*.md、skills/**/SKILL.md 是附件不是专家。
  const countExperts = (dir, depth) => {
    let n = 0;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (existsSync(join(dir, entry.name, "persona.md"))) n += 1;
        else if (depth < 2) n += countExperts(join(dir, entry.name), depth + 1);
      } else if (entry.name.endsWith(".md")) n += 1;
    }
    return n;
  };
  const snapshotCount = existsSync(snapshotExperts) ? countExperts(snapshotExperts, 0) : 0;
  check("快照专家数 623", snapshotCount === 623, String(snapshotCount));
  for (const file of ["zh/names.json", "zh/descriptions.json", "source.json"]) {
    check(`快照含 ${file}`, existsSync(join(dataDir, file)));
  }
  // 自建专家是用户的私人内容，绝不能进包内快照（sync-data.mjs 只收 experts/ 与 zh/）。
  // 这条盯住的是"发布物里没有 data/custom/"这个事实，而不是脚本的实现细节。
  check("包内快照不含自建专家目录（用户私人内容不随包发布）", !existsSync(join(dataDir, "custom")));

  // 脱敏：快照是要公开发布的内容，不能带作者本机路径
  // 脱敏：快照是要公开发布的内容，不能带作者本机路径。
  // 正则**不要求**结尾有 `/`（旧版要求，于是 "/Users/alice" 这种恰好漏过），
  // 但区分大小写，避免把上游正文里的普通 URL（如 /users/new）误判成泄漏。
  const LEAK = /(?:\/Users\/|\/home\/)[A-Za-z0-9._-]+/u;
  const offenders = [];
  const scan = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const target = join(dir, entry.name);
      if (entry.isDirectory()) scan(target);
      else if (/\.(?:md|json|py|txt|ya?ml)$/u.test(entry.name)) {
        const hit = LEAK.exec(readFileSync(target, "utf8"));
        if (hit !== null) offenders.push(`${target.slice(HERE.length)} → ${hit[0]}`);
      }
    }
  };
  if (existsSync(dataDir)) scan(dataDir);
  check("快照无本机路径残留", offenders.length === 0, offenders.slice(0, 3).join(", ") || "clean");


  // 同步行为（2026-09-13 重写）：首次全量、再次幂等、用户内容不被覆盖**且必须出声**、
  // 升级新增/修订必到达、只读条目对齐、包内移除只报告不删除、缺项自愈。
  // 旧实现按整项跳过（目录非空就不动），下面这些断言在旧代码下会红 —— 这正是它们的价值。
  const tmp = mkdtempSync(join(tmpdir(), "t-team-seed-"));
  const root = join(tmp, ".t-team", "experts");
  const zhRoot = join(tmp, ".t-team", "zh");
  // 抽样条目要兼容两种形态：单文件 `<slug>.md` 与目录形态专家包 `<slug>/persona.md`。
  const engineeringEntry = readdirSync(join(dataDir, "experts", "engineering"), { withFileTypes: true })[0];
  const sampleExpert = engineeringEntry.isDirectory()
    ? `experts/engineering/${engineeringEntry.name}/persona.md`
    : `experts/engineering/${engineeringEntry.name}`;
  const first = seedData({ root, zhRoot });
  check("首次同步：名册与中文侧车落地",
    first.copied.includes(sampleExpert) && existsSync(join(root, "engineering")) && existsSync(join(zhRoot, "names.json")),
    `copied=${first.copied.length} scanned=${first.scanned}`);
  check("首次同步：全新目录 = 包内条目全部落地（无一处静默跳过）",
    first.copied.length === first.scanned && first.updated.length === 0 && first.kept.length === 0 && first.stale.length === 0,
    `copied=${first.copied.length} scanned=${first.scanned} kept=${first.kept.length}`);
  check("首次同步：写下同步记录（升级/漂移因此可感知）",
    first.manifestWritten && existsSync(first.manifestPath) && JSON.parse(readFileSync(first.manifestPath, "utf8")).version === JSON.parse(readFileSync(join(HERE, "package.json"), "utf8")).version,
    first.manifestPath);

  const second = seedData({ root, zhRoot });
  check("再次同步：幂等（不重复复制/对齐/合并，也没有无谓改写）",
    second.copied.length === 0 && second.updated.length === 0 && second.merged.length === 0 && second.unchanged > 0,
    `copied=${second.copied.length} updated=${second.updated.length} merged=${second.merged.length} unchanged=${second.unchanged}`);
  check("再次同步：无漂移时不重复告警", second.kept.length === 0 && second.stale.length === 0 && second.driftChanged === false);

  // 用户内容：改了就不许被覆盖，**而且必须进 kept + driftChanged**（旧代码这里是静默跳过）
  const userBody = join(zhRoot, "engineering", "engineering-platform-engineer.md");
  writeFileSync(userBody, "用户自己补译的正文\n");
  const third = seedData({ root, zhRoot });
  check("用户改过的中文正文不被覆盖，且进入 kept 报告",
    readFileSync(userBody, "utf8") === "用户自己补译的正文\n" && third.kept.includes("zh/engineering/engineering-platform-engineer.md"),
    `kept=${third.kept.join(",")}`);
  check("漂移状态变化时 driftChanged 为真（送不到必须出声）",
    third.driftChanged === true && third.ok === true, String(third.driftChanged));
  const fourth = seedData({ root, zhRoot });
  check("漂移状态未变化时不重复告警", fourth.driftChanged === false && fourth.kept.length === 1);
  rmSync(userBody);
  const fifth = seedData({ root, zhRoot });
  check("告警里的逃生路径有效：删掉文件后重新播种",
    fifth.copied.includes("zh/engineering/engineering-platform-engineer.md") && !readFileSync(userBody, "utf8").startsWith("用户"));

  // 键值型用户文件：只补缺失键（这是「升级送不到新译文」的正面修复）
  writeFileSync(join(zhRoot, "names.json"), '{"custom-user-key":"用户自己加的"}\n');
  const sixth = seedData({ root, zhRoot });
  const mergedNames = JSON.parse(readFileSync(join(zhRoot, "names.json"), "utf8"));
  const pkgNameKeys = Object.keys(JSON.parse(readFileSync(join(dataDir, "zh", "names.json"), "utf8")));
  check("用户删空的 zh/names.json：包内键被按条目补回，用户自己的键原样保留",
    mergedNames["custom-user-key"] !== undefined
    && pkgNameKeys.every((key) => mergedNames[key] !== undefined)
    && Object.keys(mergedNames).length === 1 + pkgNameKeys.length,
    `包内 ${pkgNameKeys.length} 键 / 盘上 ${Object.keys(mergedNames).length} 键`);
  check("用户改动不被覆盖（用户键仍在盘上）",
    readFileSync(join(zhRoot, "names.json"), "utf8").includes("custom-user-key"));
  check("缺项自愈：单个配置文件缺失可补齐", (() => {
    rmSync(join(zhRoot, "names.json"));
    const seventh = seedData({ root, zhRoot });
    return seventh.copied.includes("zh/names.json") && existsSync(join(zhRoot, "names.json"));
  })());

  // 宿主接线：报告里的 kept/stale 必须真的被日志消费，否则「送不到就出声」会退回静默
  const indexSeedSource = readFileSync(join(HERE, "lib", "index.js"), "utf8");
  check("宿主接线：同步报告的 kept/stale/driftChanged 被日志消费",
    indexSeedSource.includes("seeded.kept") && indexSeedSource.includes("seeded.stale") && indexSeedSource.includes("seeded.driftChanged"));

  // 升级：用**合成快照**验「包内新增/修订的条目必须到达，用户内容必须不动」（不碰真包内数据）
  {
    const pkgData = join(tmp, "pkg", "data");
    const upHome = join(tmp, "up", ".t-team");
    const upRoot = join(upHome, "experts");
    const upZh = join(upHome, "zh");
    const writePkg = (rel, text) => {
      mkdirSync(join(pkgData, rel, ".."), { recursive: true });
      writeFileSync(join(pkgData, rel), text);
    };
    // 包根要能被 readPackageVersion 读到（它读 `<snapshotDir>/../package.json`）——目录得先建。
    mkdirSync(join(tmp, "pkg"), { recursive: true });
    writeFileSync(join(tmp, "pkg", "package.json"), '{"name":"fake-snapshot","version":"1.0.0"}\n');
    writePkg("experts/old/old-expert.md", "v1\n");
    writePkg("experts/gone/gone-expert.md", "gone\n");
    writePkg("zh/names.json", '{\n  "old-expert": "旧专家"\n}\n');
    writePkg("zh/engineering/old-expert.md", "包内正文 v1\n");

    const up1 = seedData({ root: upRoot, zhRoot: upZh, snapshotDir: pkgData });
    check("升级基线：合成快照首次同步全量落地",
      up1.copied.length === 4 && up1.scanned === 4 && up1.version === "1.0.0", `copied=${up1.copied.length} scanned=${up1.scanned}`);

    // 用户在盘上改了三处用户内容
    writeFileSync(join(upZh, "names.json"), '{\n  "old-expert": "我改过的名字"\n}\n');
    writeFileSync(join(upZh, "engineering", "old-expert.md"), "用户补译正文\n");

    // 包内升级：新增专家、修订只读名册、移除一个专家、新增译文键、修订中文正文
    writeFileSync(join(tmp, "pkg", "package.json"), '{"name":"fake-snapshot","version":"2.0.0"}\n');
    writePkg("experts/old/old-expert.md", "v2\n");
    writePkg("experts/new/new-expert.md", "new\n");
    rmSync(join(pkgData, "experts", "gone"), { recursive: true });
    writePkg("zh/names.json", '{\n  "old-expert": "旧专家",\n  "new-expert": "新专家"\n}\n');
    writePkg("zh/engineering/old-expert.md", "包内正文 v2\n");

    const up2 = seedData({ root: upRoot, zhRoot: upZh, snapshotDir: pkgData });
    check("升级：包内新增的专家文件到达运行时",
      existsSync(join(upRoot, "new", "new-expert.md")) && up2.copied.includes("experts/new/new-expert.md"),
      up2.copied.join(","));
    check("升级：只读名册被修订时安装副本对齐",
      readFileSync(join(upRoot, "old", "old-expert.md"), "utf8") === "v2\n" && up2.updated.includes("experts/old/old-expert.md"));
    check("升级：新增的中文名键合并进来，用户改过的键不动",
      JSON.parse(readFileSync(join(upZh, "names.json"), "utf8"))["new-expert"] === "新专家"
      && JSON.parse(readFileSync(join(upZh, "names.json"), "utf8"))["old-expert"] === "我改过的名字"
      && up2.merged.some((item) => item.rel === "zh/names.json"));
    check("升级：用户补译的中文正文仍不被覆盖，并进入 kept",
      readFileSync(join(upZh, "engineering", "old-expert.md"), "utf8") === "用户补译正文\n"
      && up2.kept.includes("zh/engineering/old-expert.md"), up2.kept.join(","));
    check("升级：包内移除的专家只报告、不删除盘上文件",
      up2.stale.includes("experts/gone/gone-expert.md") && existsSync(join(upRoot, "gone", "gone-expert.md")));
    check("升级：快照版本变化可感知（v1.0.0 → v2.0.0）",
      up2.previousVersion === "1.0.0" && up2.version === "2.0.0" && up2.driftChanged === true,
      `${up2.previousVersion} → ${up2.version}`);

    const up3 = seedData({ root: upRoot, zhRoot: upZh, snapshotDir: pkgData });
    check("升级后再次同步：幂等且不再重复告警",
      up3.copied.length === 0 && up3.updated.length === 0 && up3.merged.length === 0 && up3.driftChanged === false,
      `copied=${up3.copied.length} merged=${up3.merged.length} kept=${up3.kept.length}`);
  }

  rmSync(tmp, { recursive: true, force: true });

}

// ---------- 13. 发布形态（npm 元数据） ----------
console.log("\n[13] 发布形态");
{
  const pkg = JSON.parse(readFileSync(join(HERE, "package.json"), "utf8"));
  check("已声明 MIT 且带 LICENSE 文件", pkg.license === "MIT" && existsSync(join(HERE, "LICENSE")));
  check("第三方归属声明存在", existsSync(join(HERE, "THIRD-PARTY-NOTICES")));
  check("可发布（没有 private 字段）", pkg.private === undefined, String(pkg.private));
  check("publishConfig 指向 npmjs 公共 registry",
    pkg.publishConfig?.access === "public" && pkg.publishConfig?.registry === "https://registry.npmjs.org/",
    JSON.stringify(pkg.publishConfig));
  // 包内 data 的内容由 sync-data 的白名单定义（experts/zh 两棵树 + 四个数据文件 + source.json）。
  // 这里**逐条点名**，不再要求收整目录 `data`：`data/` 根层还住着运行时同步记录
  // `.t-team-snapshot.json`（.gitignore 里写着「绝不能进包」），而 npm 的 files 白名单收整目录时
  // 会绕过 .gitignore 把它一起发出去（2026-09-17 实测：tgz 里确实带着作者机器的 version/时间戳）。
  {
    const required = [
      "data/experts", "data/zh", "data/source.json",
    ];
    const listed = pkg.files ?? [];
    const missing = required.filter((item) => !listed.includes(item));
    check("files 白名单逐条列出包内 data（不收整目录 data，否则运行时同步记录会随包发出）",
      listed.includes("lib") && !listed.includes("data") && missing.length === 0,
      missing.length > 0
        ? `缺 ${missing.join(",")}`
        : listed.includes("data") ? "收的是整目录 data" : `${required.length} 条`);
  }
  const peers = Object.keys(pkg.peerDependencies ?? {});
  const optional = pkg.peerDependenciesMeta ?? {};
  // 契约（见 audit/12-plugins-audit-0.2.7.md D-6）：**被静态 import 的宿主包绝不能标 optional** ——
  // optional 的语义是「缺了也能装」，而静态 import 缺一个就 ERR_MODULE_NOT_FOUND、整个插件加载失败。
  // 只经客户端产物 / 构建引入的 peer 可以继续 optional。旧断言写的是「全部标 optional」，
  // 方向正好相反：它把 D-6 这个缺陷当成了契约，修 D-6 反而会让自检转红。
  {
    const staticallyImported = new Set();
    const scanDirs = [join(HERE, "lib")];
    while (scanDirs.length > 0) {
      const dir = scanDirs.pop();
      let entries = [];
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
      for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) { scanDirs.push(full); continue; }
        if (!entry.name.endsWith(".js")) continue;
        if (full === join(HERE, "lib", "client.js")) continue; // 构建产物，运行时由宿主注入
        const text = readFileSync(full, "utf8");
        for (const match of text.matchAll(/from\s+["'](@deepseek-ai\/[a-z0-9-]+)/gu)) staticallyImported.add(match[1]);
      }
    }
    const wronglyOptional = [...staticallyImported]
      .filter((name) => peers.includes(name) && optional[name]?.optional === true);
    check("被静态 import 的宿主包没有被标成 optional（缺了不是「也能装」，是整个插件加载失败）",
      staticallyImported.size > 0 && wronglyOptional.length === 0,
      wronglyOptional.length > 0
        ? `误标 optional：${wronglyOptional.join(",")}`
        : `静态 import ${staticallyImported.size} 个：${[...staticallyImported].sort().join(",")}`);
  }
  check("peerDependencies 各键都有 peerDependenciesMeta 条目（声明形态完整）",
    peers.length > 0 && peers.every((name) => optional[name] !== undefined),
    peers.filter((name) => optional[name] === undefined).join(",") || `${peers.length} 项`);
  check("dsh.bundle.patch 已被 exports 导出（否则装完读不到补丁）",
    typeof pkg.dsh?.bundle?.patch === "string" && pkg.exports?.[pkg.dsh.bundle.patch] !== undefined,
    pkg.dsh?.bundle?.patch);
  check("keywords 含 dsh-plugin（市场检索用）", (pkg.keywords ?? []).includes("dsh-plugin"));

  // 依赖声明规则（仓库约定）：peer 必须与 dev 成对；dsh.client.inject 只放 dev 里的包名
  {
    const devNames = new Set(Object.keys(pkg.devDependencies ?? {}));
    const peerNotDev = Object.keys(pkg.peerDependencies ?? {}).filter((name) => !devNames.has(name));
    check("每个 peerDependency 都在 devDependencies 里有对应项", peerNotDev.length === 0, peerNotDev.join(",") || `${Object.keys(pkg.peerDependencies ?? {}).length} 项`);
    const clientInject = pkg.dsh?.client?.inject ?? [];
    const injectNotDev = clientInject.filter((name) => !devNames.has(name));
    check("dsh.client.inject 的每一项都是 devDependency", injectNotDev.length === 0, injectNotDev.join(",") || `${clientInject.length} 项`);
    // 该包从未被装到宿主里、客户端产物也从不 require 它：留着就是一条错误的信息性依赖边
    check("dsh.client.inject 不再含宿主里不存在的包", !clientInject.includes("@deepseek-ai/dsh-client-runtime"), clientInject.join(","));
    // ⚠️ 第三层根因（2026-09-16）：客户端 remote 命名空间由**包级** dsh.client.inject 决定要不要加载。
    //    skills/list 属于 @deepseek-ai/dsh-api-session-controller —— 少声明它，那个客户端包根本不会加载，
    //    ctx.remote.skills 就是 undefined（服务级 inject 里写的 "remote.skills" 也就无从生效），
    //    表现是技能标签永远空白，而且不报任何错。这条专门盯着包级声明。
    check("技能依赖的 session-controller 客户端包已在 dsh.client.inject 里声明（否则 ctx.remote.skills 不存在）",
      clientInject.includes("@deepseek-ai/dsh-api-session-controller"));
    // 运行时依赖必须**随运行副本**走：`croner` 若只指望 profile 顶层那份，而那份是别的插件
    // （同样用 croner 的 dsh-tasks）带进来的，那么卸载那个插件后 pnpm 会把它清掉，
    // 本插件随后 ERR_MODULE_NOT_FOUND、整个 fiber 静默 pending —— 装机链上的真实断点。
  }
  check("engines.node 已声明", typeof pkg.engines?.node === "string", pkg.engines?.node);
  check("repository/homepage 已声明", typeof pkg.repository?.url === "string" && typeof pkg.homepage === "string");
  check("prepublishOnly 会先构建与自检", typeof pkg.scripts?.prepublishOnly === "string", pkg.scripts?.prepublishOnly);
}

// ---------- 13b. 许可与随包文件完整性 ----------
console.log("\n[13b] 许可与随包文件");
{
  const pkg = JSON.parse(readFileSync(join(HERE, "package.json"), "utf8"));
  const files = pkg.files ?? [];
  // files 里写了不存在的路径不会报错，只会静默少文件 —— 逐条确认存在
  const absent = files.filter((entry) => !existsSync(join(HERE, entry)));
  check("files 白名单里的每一项都真实存在", absent.length === 0, absent.join(",") || `${files.length} 项`);

  // 第三方许可全文必须随包（MIT 要求"随副本附带版权与许可声明"）
  const licenseFiles = [
    "vendor/third-party-licenses/agency-agents.LICENSE",
    "vendor/third-party-licenses/agency-agents-zh.LICENSE",
    // 定时事项调度器（croner）是**运行时依赖**（源码不进包），它的许可也随包放一份：
    // 离线安装/再分发时署名文本仍然拿得到。
    "vendor/third-party-licenses/croner.LICENSE",
  ];
  const missingLicense = licenseFiles.filter((relative) => !existsSync(join(HERE, relative)));
  check("第三方许可全文随包存在", missingLicense.length === 0, missingLicense.join(",") || `${licenseFiles.length} 份`);
  const notShipped = licenseFiles.filter((relative) => !files.some((entry) => relative === entry || relative.startsWith(`${entry}/`)));
  check("第三方许可文件都在 files 白名单内（会进 npm 包）", notShipped.length === 0, notShipped.join(",") || "全部在列");
  const notMit = licenseFiles.filter((relative) => {
    const text = existsSync(join(HERE, relative)) ? readFileSync(join(HERE, relative), "utf8") : "";
    return !text.includes("MIT License") || !text.includes("WITHOUT WARRANTY");
  });
  check("许可文本是完整的 MIT 正文", notMit.length === 0, notMit.join(",") || "clean");

  // 署名：THIRD-PARTY-NOTICES 必须点名每一份随包许可，别让再分发者找不到
  const notices = readFileSync(join(HERE, "THIRD-PARTY-NOTICES"), "utf8");
  const unnamed = licenseFiles.filter((relative) => !notices.includes(relative));
  check("THIRD-PARTY-NOTICES 点名了每一份随包许可", unnamed.length === 0, unnamed.join(",") || "clean");
  check("THIRD-PARTY-NOTICES 说明了中文译文来源", notices.includes("agency-agents-zh") || notices.includes("jnMetaCode"));

  // 运行副本（install-desktop.sh 的产物）也要带上许可：THIRD-PARTY-NOTICES 要求再分发时保留它们
  // 安装逻辑现在住在运维台（仓库不再有 scripts/）
  check("运维台的安装逻辑把第三方许可一并复制进运行副本",
    !HAS_OPS || OPS_SCRIPT.includes("third-party-licenses"),
    HAS_OPS ? "" : "skip（本机没有运维目录）");

  // 发布脚本：语法错只会在真正发布时才暴露，这里提前拦一次；且它不该被发布出去。
  {
    const { execFileSync } = await import("node:child_process");
    let publishScriptOk = false;
    try {
      execFileSync("bash", ["-n", OPS_SCRIPT_PATH], { stdio: "ignore" });
      publishScriptOk = true;
    } catch {
      publishScriptOk = false;
    }
    check("运维台脚本语法有效（bash -n tz.sh，含发布流程）", !HAS_OPS || publishScriptOk, HAS_OPS ? "tz.sh" : "skip（本机没有运维目录）");

    // 发布流程的**版本决策逻辑**：把 tz.sh 那一段抽出来、注入假变量跑遍每条路径，钉死 (target, skip_bump)。
    // 踩过的坑：菜单选「1) 直接发布当前版本」后 skip_bump 仍是 0，于是去跑 npm version <同版本> 而失败。
    {
      let logicOut = "";
      let logicOk = false;
      try {
        logicOut = execFileSync("bash", [join(HERE, "ops", "test-publish-logic.sh")], { encoding: "utf8", cwd: HERE });
        logicOk = true;
      } catch (error) {
        logicOut = String(error?.stdout ?? error?.message ?? error);
      }
      check("发布流程的版本决策逻辑全绿（--current／菜单选 1／手输同版本 都走不升版；回车＝取消）",
        logicOk && logicOut.includes("全部通过"),
        logicOk ? logicOut.trim().split("\n").at(-1) : logicOut.split("\n").filter((line) => line.includes("FAIL")).slice(0, 2).join("；") || "脚本运行失败");
    }
    // 静态护栏：npm version 失败必须中止（否则会带着"没升成版"的状态继续推送与发布）
    check("发布流程里 npm version 失败会中止（不带着半升版状态去推送/发布）",
      /npm version "\$spec"[^\n]*\\\n[^\n]*\|\| die/u.test(OPS_SCRIPT),
      OPS_SCRIPT.includes("未推送、未发布") ? "有 die 保护" : "缺少 die 保护");
    // 不升版路径必须补 tag：否则发出去的版本没有 git 标记，失败后也无法用 --retry 重试。
    // 而且必须是 **annotated（-a）**：发布 tag 要与 GitHub Release、npm 上的号一一对应
    // （轻量 tag 在 `--follow-tags` 时代会被静默忽略 —— 2026-09-15 实测：提交推上去了，
    //  三个 v0.3.x tag 全留在本地，npm 上却有包）。
    check("不升版的发布路径会给发出去的版本补 tag（且是 annotated）",
      /git tag -a "v\$target" -m/.test(OPS_SCRIPT) && OPS_SCRIPT.includes("已补 tag"),
      OPS_SCRIPT.includes("已补 tag") ? "有补 tag 逻辑（annotated）" : "缺少补 tag 逻辑");
    // 2026-10-06 起：远端只收**一条无父提交的发布快照**，本地数百条开发历史永不出本机。
    // 下面四条守的就是这件事 —— 任何一条被改回去，开发历史都会随 tag 一起上 GitHub。
    // 判定要跳过注释行：脚本里有意保留着「当初为什么踩坑」的记录（含 --follow-tags 字样）。
    const opsCodeLines = OPS_SCRIPT.split("\n").filter((line) => !line.trim().startsWith("#"));
    const stillFollowsTags = opsCodeLines.some((line) => line.includes("git push --follow-tags"));
    check("发布流程不再执行 --follow-tags（tag 自带父链，会连整条开发历史一起推上去）",
      !stillFollowsTags, stillFollowsTags ? "仍在执行 --follow-tags" : "已改为推发布快照");
    const snapshotLogic = OPS_SCRIPT.includes("git commit-tree")
      && OPS_SCRIPT.includes("git update-ref refs/heads/github")
      && OPS_SCRIPT.includes("refs/heads/github:refs/heads/main");
    check("发布流程造无父提交的发布快照并推它（远端 main 永远只有 1 条）",
      snapshotLogic,
      OPS_SCRIPT.includes("git commit-tree") ? "有快照逻辑" : "缺少快照逻辑（git commit-tree / update-ref / refspec）");
    const tagOnSnapshot = /git tag -fa "v\$target" -m "v\$target" "\$snap"/u.test(OPS_SCRIPT);
    check("发布 tag 落在快照上而不是本地 main（落 main 就等于把历史送出去）",
      tagOnSnapshot,
      tagOnSnapshot ? "tag 重指到快照" : "缺少把 tag 重指到 $snap 的逻辑");
    // 2026-09-15 用户定：发布 npm 时**同时**把快照与 tag 推上去 —— 默认推送，不再「问一句、
    // 回车即跳过」（那个默认正是「npm 上有包、远端连 tag 都没有」的成因）。只保留 --no-push。
    check("发布流程默认推送、只保留 --no-push 逃生口",
      OPS_SCRIPT.includes('"$push" = "no"')
      && OPS_SCRIPT.includes("refs/tags/v$target")
      && !OPS_SCRIPT.includes("要把提交与 tag 推到 origin 吗"),
      OPS_SCRIPT.includes("要把提交与 tag 推到 origin 吗") ? "仍在交互询问（回车即跳过）" : "默认推送");
    // 保险闸：光靠「记得别这么推」不够 —— 2026-10-06 实测过一次：分支推送被拒、命令退出码非 0，
    // tag 却推成功了，开发历史照样上了 GitHub。所以让机器再拦一道。
    const hookPath = join(HERE, "ops", "git-hooks", "pre-push");
    const hookSrc = existsSync(hookPath) ? readFileSync(hookPath, "utf8") : "";
    const hookOk = hookSrc.includes("refs/tags/*") && hookSrc.includes("rev-list --parents");
    check("pre-push 保险闸在仓库里（拦下会带出开发历史的 tag 与分支推送）",
      hookOk, hookOk ? "在" : "缺少 ops/git-hooks/pre-push 或其拦截逻辑");
    check("scripts/ 不随 npm 包分发（运维逻辑不会被装给用户）",
      !files.some((entry) => String(entry).startsWith("scripts")), files.join(","));
    check("仓库里不再有 scripts/ 目录（运维脚本统一在运维台）",
      !existsSync(join(HERE, "scripts")), existsSync(join(HERE, "scripts")) ? "仍存在" : "已清空");
    // 可移植性护栏：bash 在 UTF-8 locale 下会把「$var 紧跟非 ASCII 字符」里的首字节并进变量名
    // （LC_CTYPE=C 时不会，所以本机默认环境跑不出来 —— 必须用花括号界定）。这条是真踩过的坑。
    const opsText = OPS_SCRIPT;
    const adjacency = [];
    opsText.split("\n").forEach((line, index) => {
      if (/\$[A-Za-z_][A-Za-z0-9_]*[^\x00-\x7F]/u.test(line)) adjacency.push(`第 ${index + 1} 行`);
    });
    check("tz.sh 里没有「$变量紧跟非 ASCII 字符」（UTF-8 locale 下会被吞进变量名）",
      !HAS_OPS || adjacency.length === 0, HAS_OPS ? (adjacency.slice(0, 5).join(",") || "clean") : "skip（本机没有运维目录）");
    // 结构性护栏：运行副本与数据目录必须分家。历史上 STAGE 写成 $HOME/.t-team/plugin
    // （= 数据目录内部），于是「清空/迁移数据目录」会连累 profile 的 file: 依赖解析。
    // 按**语义**判定而不是钉变量名：自定位版本用 `$_ws/plugin`（工作区 = 仓库上一级），
    // 旧版本用 `$OPS_DIR/plugin`。两者都要求「在工作区顶层、且不在数据目录内部」。
    const stageDefault = /^STAGE="\$\{T_TEAM_STAGE:-([^}]+)\}"/mu.exec(opsText)?.[1] ?? "";
    const stageAtWorkspaceTop = /^\$(?:OPS_DIR|_ws)\//u.test(stageDefault);
    check("tz.sh 的运行副本默认路径在工作区顶层、不在数据目录内", !HAS_OPS ||
      (stageAtWorkspaceTop && !stageDefault.includes(".t-team")),
      stageDefault || "未找到 STAGE 定义");

    // DSH 家目录护栏：宿主认 `DSH_HOME`，装机目标也必须认。此前 resolve_profile 的缺省分支、
    // 状态头的已装版本探测、两处「要不要重启 Desktop」的判断都写死了 `$HOME/.dsh` ——
    // 设了 DSH_HOME 的机器上会装到 DSH 根本不读的地方，而且状态头永远显示「未安装」。
    const hardcodedDshHome = [];
    opsText.split("\n").forEach((line, index) => {
      if (line.trimStart().startsWith("#")) return;        // 注释里写 `$HOME/.dsh` 当说明是可以的
      if (line.startsWith("DSH_HOME_DIR=")) return;        // 唯一允许的落地点：那条回退定义本身
      if (/\$HOME\/\.dsh/u.test(line)) hardcodedDshHome.push(`第 ${index + 1} 行`);
    });
    check("tz.sh 里没有写死的 $HOME/.dsh（DSH_HOME 必须一路生效到装机目标）",
      !HAS_OPS || hardcodedDshHome.length === 0,
      HAS_OPS ? (hardcodedDshHome.slice(0, 5).join(",") || "clean") : "skip（本机没有运维目录）");
    check("tz.sh 的 DSH 家目录解析认 DSH_HOME",
      !HAS_OPS || /^DSH_HOME_DIR="\$\{DSH_HOME:-\$HOME\/\.dsh\}"/mu.test(opsText),
      HAS_OPS ? "DSH_HOME_DIR" : "skip（本机没有运维目录）");
  }

  // README 是对外文案：不得引用不随包发布的图片，也不得出现本机路径
  const readme = readFileSync(join(HERE, "README.md"), "utf8");
  const imageRefs = [...readme.matchAll(/!\[[^\]]*\]\(([^)]+)\)/gu)].map((m) => m[1]);
  const brokenImages = imageRefs.filter((target) => !existsSync(join(HERE, target)));
  check("README 不引用不随包发布的图片（npm 页面不会裂图）", brokenImages.length === 0, brokenImages.join(",") || `${imageRefs.length} 张引用`);
  check("README 无本机路径", !/(?:\/Users\/|\/home\/)[A-Za-z0-9._-]+/u.test(readme), "clean");
  // 设置页的标签集合**直接读实现**（settings.jsx 的 SegmentedTabs items），README 必须与它一致。
  // 2026-10-06 修：这条断言原先写死「两个标签」，可客户端在技能开关并入后早就是三个
  // （专家 / 分类 / 技能）—— 它靠着 README 里一句无关的「两个标签都带计数」蒙混过关，
  // 于是「README 与实现各说各话」一路绿灯。现在改成两边对照，实现变了这里就红。
  const settingsSrc = readFileSync(join(HERE, "src", "client", "settings.jsx"), "utf8");
  const settingsTabs = [...settingsSrc.matchAll(/value: "(experts|categories|skills)", label: t\("tab\.[a-z]+"\)/gu)].map((match) => match[1]);
  check("README 说的设置页标签 = settings.jsx 实际渲染的（专家 / 分类 / 技能）",
    settingsTabs.join(",") === "experts,categories,skills"
    && readme.includes("三个标签")
    && readme.includes("**专家**") && readme.includes("**分类**") && readme.includes("**技能**")
    && !readme.includes("四个标签"),
    `实现=${settingsTabs.join(",")}`);
  check("README 说明输入区浮层是 专家 / 技能 两个标签（第三个「任务」已在 0.3.x 迁出）",
    /浮层标签：\*\*专家[^→\n]*技能\*\*/u.test(readme) && !/→ 任务/u.test(readme),
    (readme.match(/浮层标签：[^\n]{0,50}/u) ?? ["(缺)"])[0]);


  const indexSrc = readFileSync(join(HERE, "lib/index.js"), "utf8");

  // C-2：召唤工具必须声明时间预算（声明 ≠ 强制，但至少不是无界）。
  const summonOne = indexSrc.slice(indexSrc.indexOf('name: "summon_t_expert"'), indexSrc.indexOf('name: "summon_t_experts"'));
  const summonMany = indexSrc.slice(indexSrc.indexOf('name: "summon_t_experts"'));
  check("C-2：两个召唤工具都声明了 timeoutMs（时间预算显式化）",
    /timeoutMs:\s*\d+/u.test(summonOne) && /timeoutMs:\s*\d+/u.test(summonMany),
    `单个=${/timeoutMs:\s*\d+/u.test(summonOne)} 批量=${/timeoutMs:\s*\d+/u.test(summonMany)}`);

  // A-4：settings / commands 不得回到静态 inject —— 静态缺服务会让整个 fiber 静默 pending，
  // 插件一行日志都不打（这是唯一一条「整插件无提示地不在」的路径）。
  const injectLine = indexSrc.match(/export const inject = \[([^\]]*)\]/u)?.[1] ?? "";
  check("A-4：settings / commands 不在静态 inject 里（缺服务时必须能加载并降级）",
    injectLine.includes('"tools"') && injectLine.includes('"subagents"') && injectLine.includes('"systemPrompt"')
    && !injectLine.includes('"settings"') && !injectLine.includes('"commands"'),
    `inject=[${injectLine.trim()}]`);
  // settings 的注册必须**等就绪**（用 ctx.inject），不能用 ctx.get 同步探测：
  // 同步探测在「settings 比本插件晚就绪」的真实宿主里恒为 undefined，
  // 且 provide 不回溯通知 → 设置段永不注册（真实 GUI 白板事故，2026-09-13）。
  check("A-4：settings 注册等就绪（ctx.inject），不用同步探测",
    /ctx\.inject\(\["settings"\]/u.test(indexSrc) && !/const settingsService = ctx\.get\("settings"\)/u.test(indexSrc),
    /ctx\.inject\(\["settings"\]/u.test(indexSrc) ? "用 inject 等就绪" : "仍在同步探测（会白板）");
  // 降级告警的**意图**是「申请时要说话、缺失时也要说话」，所以这里认的是这一对语义，
  // 不是某一句具体文案：0.1.7 起 settings 服务不再有 register（PR #4587 改成 entry Config
  // 的 volatile 字段），缺失告警随之改成「既没有 register 也没有 mutate」——两条都算数。
  check("A-4：settings 申请时与缺失时都有可诊断告警（不留 undefined 崩溃）",
    /等待 settings 服务就绪/u.test(indexSrc)
    && /settings 服务没有 register|既没有 register 也没有 mutate/u.test(indexSrc)
    && /上下文没有 inject/u.test(indexSrc),
    "settings 降级告警");


  // F-2：客户端产物不得开启 minify —— 自检里有多条断言是对产物做**文本检查**的
  // （remote 方法集合、分类入口、引擎 UI）。实测压缩省 32%，但会把标识符改名从而让那些
  // 断言变成空转；要开压缩必须先把它们改成结构性检查，所以这里先拦住。
  const buildSrc = readFileSync(join(SELF_DIR, "build-client.mjs"), "utf8");
  check("F-2：客户端产物保持不压缩（压缩会让多条产物文本断言变空转）",
    /const MINIFY = false;/u.test(buildSrc) && !/minify:\s*true/u.test(buildSrc),
    /const MINIFY = false;/u.test(buildSrc) ? "未压缩" : "有人打开了 minify（请先改造产物文本断言）");


}

// ---------- 13c. A-4 行为：缺 settings / commands 时插件仍能加载并降级 ----------
// 为什么必须有：这两项过去在静态 `inject` 里，宿主没挂它们时 cordis 会让**整个 fiber 静默
// pending** —— 插件一行日志都不打，用户在工具表里看不到任何 T专家 工具，也拿不到任何原因。
// 这条断言用真 cordis Context（故意不 provide settings / commands）证明「加载 + 降级 + 告警」。
console.log("\n[13c] A-4：缺 settings/commands 时的降级加载");
{
  const { Context: DegradedContext } = await import("@deepseek-ai/cordis");
  const registry = new Map();
  const warns = [];
  const root = new DegradedContext();
  root.reflect.provide("tools", { register: (def) => { registry.set(def.name, def); return () => registry.delete(def.name); }, get: (n) => registry.get(n), restrict: () => () => {} });
  root.reflect.provide("subagents", { getProvider: () => undefined, list: () => [], startContinuable: () => ({ childId: "c" }), sendMessage: async () => {}, interrupt: () => {}, drainContinuableChildren: async () => {}, followup: async () => {}, [Symbol.for("dsh.subagent.deliverPrompt")]: async (_parent, _childId, _content, _source, _signal, _delivery) => {} });
  root.reflect.provide("systemPrompt", { section: () => () => {} });
  // 刻意**不** provide settings / commands —— 这正是被测场景。
  root.logger = { debug: () => {}, info: () => {}, warn: (m) => warns.push(String(m)), error: (m) => warns.push(String(m)) };

  const degraded = await import(join(HERE, "lib/index.js"));
  const degradedCfg = degraded.Config["~standard"].validate({}).value;
  degraded.apply(root, degradedCfg);

  const rosterTools = ["list_t_experts", "summon_t_expert", "summon_t_experts"];
  check("A-4 行为：缺 settings/commands 时插件**没有**被静默挂起（名册工具全部注册）",
    rosterTools.every((name) => registry.has(name)),
    [...registry.keys()].join(",") || "(空 —— 插件没加载)");
  // `ctx.inject` 对永不出现的服务没有回调，所以告警必须在**申请时**就发一条，
  // 否则宿主真没给 settings 时日志里什么线索都没有（这正是本次白板事故难以自查的原因）。
  check("A-4 行为：缺 settings 时给出可操作告警（而不是无声降级）",
    warns.some((m) => m.includes("等待 settings 服务就绪")),
    warns.slice(0, 2).join(" | ").slice(0, 140) || "(无告警)");
  let listError = "";
  try {
    await registry.get("list_t_experts").execute({}, { agent: undefined });
  } catch (error) { listError = String(error); }
  check("A-4 行为：缺 settings 时工具响亮报错而不是给空名册（不误导成「什么都没启用」）",
    /settings 服务/u.test(listError) && !/Cannot read propert/u.test(listError),
    listError.slice(0, 110) || "(未抛错 —— 会静默给空名册)");
}

// ---------- 13d. C-6 行为：启用列表里的失效 slug 会被清掉（且不误清有效项）----------
// 为什么必须有：`enabled` 只是 slug 列表，专家被删后旧 slug 会留下；`list_t_experts` 的 total
// 取 `enabled.size`，于是出现「共 3 位」却只列出 2 位的对不上，且没有任何地方说明原因。
console.log("\n[13d] C-6：失效 slug 自动清理");
{
  const { Context: PruneContext } = await import("@deepseek-ai/cordis");
  const registry = new Map();
  const warns = [];
  const state = { enabled: ["academic-geographer", "slug-that-no-longer-exists", "also-gone"], revision: 5 };
  const settingsService = {
    register: () => ({ get: () => ({ enabled: [...state.enabled] }) }),
    describe: () => [{ ns: "t-team", revision: state.revision }],
    get: (ns) => (ns === "locale" ? { preference: "zh" } : { enabled: [...state.enabled] }),
    async mutate(_ns, ops, expectedRevision) {
      if (expectedRevision !== undefined && expectedRevision !== state.revision) throw new Error("设置冲突");
      for (const op of ops) if (op.op === "set" && op.path[0] === "enabled") state.enabled = [...op.value];
      state.revision += 1;
    },
  };
  const root = new PruneContext();
  root.reflect.provide("tools", { register: (def) => { registry.set(def.name, def); return () => registry.delete(def.name); }, get: (n) => registry.get(n), restrict: () => () => {} });
  root.reflect.provide("subagents", { getProvider: () => undefined, list: () => [], startContinuable: () => ({ childId: "c" }), sendMessage: async () => {}, interrupt: () => {}, drainContinuableChildren: async () => {}, followup: async () => {}, [Symbol.for("dsh.subagent.deliverPrompt")]: async (_parent, _childId, _content, _source, _signal, _delivery) => {} });
  root.reflect.provide("systemPrompt", { section: () => () => {} });
  root.reflect.provide("settings", settingsService);
  root.logger = { debug: () => {}, info: () => {}, warn: (m) => warns.push(String(m)), error: (m) => warns.push(String(m)) };

  const prunePlugin = await import(join(HERE, "lib/index.js"));
  prunePlugin.apply(root, prunePlugin.Config["~standard"].validate({}).value);
  // 触发一次真实读取（ensureReady 内会清 stale）
  await registry.get("list_t_experts").execute({}, { agent: undefined });

  check("C-6 行为：名册里不存在的 slug 被移除",
    !state.enabled.includes("slug-that-no-longer-exists") && !state.enabled.includes("also-gone"),
    JSON.stringify(state.enabled));
  check("C-6 行为：仍然有效的启用项**没有被误清**", state.enabled.includes("academic-geographer"), JSON.stringify(state.enabled));
  check("C-6 行为：清理留下可诊断的 warn（用户的启用列表被改过，不能无声）",
    warns.some((m) => m.includes("名册里不存在的 slug")),
    warns.filter((m) => m.includes("slug")).join(" | ").slice(0, 120) || "(无告警)");
}



console.log("\n[14] 自建专家");
{
  const { mkdtemp, mkdir, writeFile: wf, readFile: rf } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const customBase = await mkdtemp(join(tmpdir(), "t-team-custom-"));
  const customExpertsRoot = join(customBase, "experts");
  const customZhRoot = join(customBase, "zh");
  const customRoot = join(customBase, "custom");
  await mkdir(join(customExpertsRoot, "academic"), { recursive: true });
  await mkdir(customZhRoot, { recursive: true });
  const builtinPath = join(customExpertsRoot, "academic", "academic-one.md");
  await wf(builtinPath, "---\nname: One\ndescription: 内置样例\n---\n\n# One\n\n内置正文。\n");
  await wf(join(customZhRoot, "names.json"), JSON.stringify({ "academic-one": "一号" }));

  const customProvided = new Map();
  const customState = { enabled: [], revision: 1 };
  const customSettings = {
    register: () => ({ get: () => ({ enabled: [...customState.enabled] }) }),
    describe: () => [{ ns: "t-team", revision: customState.revision }],
    get: (ns) => (ns === "locale" ? { preference: "zh" } : ns === "t-team" ? { enabled: [...customState.enabled] } : undefined),
    async mutate(_ns, ops, expectedRevision) {
      if (expectedRevision !== undefined && expectedRevision !== customState.revision) throw new Error("设置冲突");
      for (const op of ops) if (op.op === "set" && op.path[0] === "enabled") customState.enabled = [...op.value];
      customState.revision += 1;
    },
  };
  const customCommands = { register: () => () => {} };
  const customCtx = {
    logger: { debug() {}, info() {}, warn() {}, error() {} },
    settings: customSettings,
    // 可选服务（settings / commands）走 `ctx.get` 懒查（A-4），假 ctx 必须像真 ctx 一样解析。
    get: (name) => (name === "settings" ? customSettings : name === "commands" ? customCommands : undefined),
    // 忠实：真 cordis 用作用域 ctx 调 inject 回调（插件靠它等 settings 就绪再注册设置段）。
    inject: (names, callback) => {
      if (Array.isArray(names) && (names.includes("settings") || names.includes("commands")))
        callback({ settings: customSettings, commands: customCommands, effect: (fn) => fn(), get: (name) => (name === "settings" ? customSettings : name === "commands" ? customCommands : undefined) });
      return () => {};
    },
    tools: { register: () => () => {}, get: () => undefined },
    systemPrompt: { section: () => () => {} },
    reflect: { provide: (name, service) => { customProvided.set(name, service); return () => {}; } },
    effect: (fn) => { fn(); return () => {}; },
    commands: customCommands,
    on: () => () => {},
    plugin: () => () => {},
  };
  plugin.apply(customCtx, { ...config, root: customExpertsRoot, zhRoot: customZhRoot, customRoot, divisions: [] });
  const customService = customProvided.get("tTeamCatalog");
  const codeOf = async (promise) => {
    try { await promise; return "NO-ERROR"; } catch (error) { return error?.code ?? String(error?.message ?? error); }
  };

  // 2026-09-13 起 seedData **按条目同步**：这个临时 root 在 apply 时会被补齐包内名册，
  // 于是「初始 1 位内置」不再是契约 —— 计数断言一律改成「基线 + 本次新建」的增量口径，
  // 而断言真正要守的「自建专家出现在快照里 / 落对分区 / 落对文件」一个字都没放松。
  const rosterBaseline = (await catalogMod.loadCatalog(customExpertsRoot, [], { zhRoot: customZhRoot, customRoot })).size;
  const created = await customService.createExpert({
    slug: "my-analyst", name: "我的分析师", nameEn: "My Analyst", description: "一句话简介",
    emoji: "🧪", body: "# 我的分析师\n\n自建人格正文",
  });
  const academicBaseline = created.categories.find((item) => item.key === "academic")?.count ?? 0;
  const mine = created.experts.find((e) => e.slug === "my-analyst");
  check("自建专家：新建后即出现在快照里（基线 + 1）",
    mine !== undefined && created.experts.length === rosterBaseline + 1,
    `${created.experts.length} 位（基线 ${rosterBaseline}）`);
  check("自建专家：标记 custom 且落在自定义分区", mine?.custom === true && mine?.division === "custom" && created.customDivision === "custom");
  check("自建专家：中文名直接可用（不依赖中文侧车）", mine?.name === "我的分析师", mine?.name);
  check("自建专家：带内容指纹（并发编辑用）", typeof mine?.hash === "string" && mine.hash.length === 12, mine?.hash);
  const customFile = await rf(join(customRoot, "custom", "my-analyst.md"), "utf8");
  check("自建专家：落盘为 frontmatter + 正文", customFile.startsWith("---\nname: 我的分析师") && customFile.includes("自建人格正文"));
  check("自建专家：内置镜像根一个字节都没写", !(await rf(builtinPath, "utf8")).includes("我的分析师"));

  check("自建专家：slug 非法被拒", (await codeOf(customService.createExpert({ slug: "Bad Slug", name: "X", description: "d", body: "b" }))) === "tTeam/custom-slug-invalid");
  check("自建专家：slug 撞内置被拒", (await codeOf(customService.createExpert({ slug: "academic-one", name: "X2", description: "d", body: "b" }))) === "tTeam/custom-slug-taken");
  check("自建专家：重名被拒（重名会连累内置一起不可召唤）", (await codeOf(customService.createExpert({ slug: "dup", name: "我的分析师", description: "d", body: "b" }))) === "tTeam/custom-name-taken");
  check("自建专家：缺简介被拒（缺简介不会进名册）", (await codeOf(customService.createExpert({ slug: "nodesc", name: "无简介", description: "", body: "b" }))) === "tTeam/custom-description-empty");
  check("自建专家：缺正文被拒", (await codeOf(customService.createExpert({ slug: "nobody", name: "无正文", description: "d", body: " " }))) === "tTeam/custom-body-empty");
  check("自建专家：校验失败不留垃圾文件",
    (await catalogMod.loadCatalog(customExpertsRoot, [], { zhRoot: customZhRoot, customRoot })).size === rosterBaseline + 1);

  const updated = await customService.updateExpert("my-analyst", { name: "我的分析师 v2", description: "改过的简介", body: "# v2\n\n改过的正文" }, mine.hash);
  const after = updated.experts.find((e) => e.slug === "my-analyst");
  check("自建专家：编辑生效且指纹随之变化", after?.name === "我的分析师 v2" && after?.hash !== mine?.hash, `${mine?.hash} → ${after?.hash}`);
  check("自建专家：内置专家不可编辑", (await codeOf(customService.updateExpert("academic-one", { name: "改内置", description: "d", body: "b" }, ""))) === "tTeam/custom-not-custom");
  check("自建专家：指纹不符 = 并发冲突", (await codeOf(customService.updateExpert("my-analyst", { name: "别人改的", description: "d", body: "b" }, mine.hash))) === "tTeam/custom-conflict");
  // 回归点：parseMetadata 曾经不解析 nameEn，自建专家的英文名落盘却读不回来
  // （表现为 nameEn 回退成中文名），重名校验与英文 locale 都会失效。
  check("自建专家：英文名落盘后可读（nameEn 不回退成中文名）", mine?.nameEn === "My Analyst", String(mine?.nameEn));
  check("自建专家：编辑时留空英文名 = 清掉它",
    (await catalogMod.loadCatalog(customExpertsRoot, [], { zhRoot: customZhRoot, customRoot })).get("my-analyst")?.nameEn === "我的分析师 v2");
  const hotPrompt = await customService.prompt("my-analyst", "custom");
  check("自建专家：persona 正文可读（热重载后）", hotPrompt.prompt.includes("改过的正文"), hotPrompt.prompt.slice(0, 14).replace(/\n/g, " "));

  customState.enabled = ["my-analyst", "academic-one"];
  const deleted = await customService.deleteExpert("my-analyst", after.hash);
  check("自建专家：删除后从名册消失", !deleted.experts.some((e) => e.slug === "my-analyst"));
  check("自建专家：删除时一并从启用列表摘掉（不留悬空 slug）",
    !deleted.enabled.includes("my-analyst") && deleted.enabled.includes("academic-one"), deleted.enabled.join(","));
  check("自建专家：文件真的删了", !existsSync(join(customRoot, "custom", "my-analyst.md")));
  check("自建专家：内置专家不可删除", (await codeOf(customService.deleteExpert("academic-one", ""))) === "tTeam/custom-not-custom");

  // 线协议契约：zod 会把 schema 里没声明的键直接剥掉（实测），所以「服务端多返回一个字段」
  // 不等于「面板收得到」。这里把快照真过一遍描述符的 result schema，钉住声明完整性。
  {
    const remoteMod = await import(join(HERE, "lib/remote.js"));
    const catalogDescriptor = remoteMod.DESCRIPTORS.find((item) => item.method === "getCatalog");
    const parsed = catalogDescriptor.result.schema.parse(await customService.snapshot());
    check("自建专家：getCatalog 的 wire schema 覆盖了自定义分区的两个字段（不会被 zod 剥掉）",
      parsed.customDivision === "custom" && parsed.customDivisionLabel === "自定义",
      `${parsed.customDivision}/${parsed.customDivisionLabel}`);
    const parsedExpert = parsed.experts.find((e) => e.slug === "my-analyst") ?? parsed.experts[0];
    check("自建专家：每位专家的 custom/hash 字段也在 wire schema 里",
      Object.hasOwn(parsedExpert, "custom") && Object.hasOwn(parsedExpert, "hash"),
      Object.keys(parsedExpert).join(","));
  }

  // ---- 分类：归属 + 管理（新建 / 改名 / 删除）----
  // 背景：分类 = 专家的**归属**（官方 22 个来自只读镜像，自建的可新建/改名/删除）。
  // 自建专家可以归到官方分类名下，但文件始终写 customRoot —— 官方镜像目录一个字节都不动。
  // 另外「分类列表」与「扫描口径」必须同一个判断：手建非 ASCII 目录名时曾出现零专家的空分类。
  {
    const { mkdir: mkDiv, writeFile: wfDiv } = await import("node:fs/promises");
    const divRoot = join(customBase, "div-custom");
    await mkDiv(join(divRoot, "mine"), { recursive: true });
    await mkDiv(join(divRoot, "我的分类"), { recursive: true });
    await wfDiv(join(divRoot, "mine", "handwritten.md"), "---\nname: 手写专家\nemoji: \"🧩\"\ndescription: d\n---\n\n正文\n");
    await wfDiv(join(divRoot, "我的分类", "ghost.md"), "---\nname: 幽灵专家\nemoji: \"🧩\"\ndescription: d\n---\n\n正文\n");
    const scanned = await catalogMod.loadCatalog(customExpertsRoot, [], { zhRoot: customZhRoot, customRoot: divRoot });
    check("分类：合法自建分类被列进分类表、其中的专家被扫描到",
      scanned.divisions.includes("mine") && scanned.get("handwritten")?.division === "mine",
      scanned.divisions.join(","));
    // 反向证伪点：把 loadCatalog 里 customDivisions 的 .filter(isValidDivision) 去掉，
    // 「我的分类」会重新出现在分类表里（而里面的专家依旧扫不到）→ 这条立刻 FAIL。
    check("分类：非 ASCII 目录名不再以空分类形式出现（分类表与扫描同一个口径）",
      !scanned.divisions.includes("我的分类") && scanned.get("ghost") === undefined,
      scanned.divisions.join(","));
    check("分类：目录名校验与扫描口径一致（小写 ASCII、不许 ..、不许大写/空）",
      catalogMod.isValidDivision("team-2") && catalogMod.isValidDivision("a.b")
      && !catalogMod.isValidDivision("我的分类") && !catalogMod.isValidDivision("a..b")
      && !catalogMod.isValidDivision("Bad") && !catalogMod.isValidDivision(""));
    // 官方的显示名跟随中文侧车，本机标签不许覆盖它；自建分类才用本机标签。
    const zhLab = join(customBase, "label-zh");
    const cusLab = join(customBase, "label-custom");
    await mkDiv(zhLab, { recursive: true });
    await mkDiv(cusLab, { recursive: true });
    await wfDiv(join(zhLab, "divisions.json"), JSON.stringify({ academic: "官方学术" }));
    await wfDiv(join(cusLab, "divisions.json"), JSON.stringify({ academic: "我改的", mine: "我的" }));
    const labelCatalog = await catalogMod.loadCatalog(customExpertsRoot, [], { zhRoot: zhLab, customRoot: cusLab });
    check("分类：官方分类的显示名以侧车为准（本机标签不许覆盖它），自建分类用本机标签",
      labelCatalog.labels.academic === "官方学术" && labelCatalog.labels.mine === "我的",
      `${labelCatalog.labels.academic} / ${labelCatalog.labels.mine}`);

    // 1) 自建专家归到官方分类名下（用户要的："新建专家时能选学术/金融/游戏"）
    //    这里用 try 接住：万一这条规则被改回去，应该是一条干净的 FAIL，而不是整个套件崩掉。
    let intoOfficial;
    let intoOfficialError = "NO-ERROR";
    try {
      intoOfficial = await customService.createExpert({
        slug: "official-filed", name: "归到学术的人", description: "一句话简介", body: "# 正文\n\n正文",
        division: "academic",
      });
    } catch (error) {
      intoOfficial = { experts: [], categories: [] };
      intoOfficialError = String(error?.message ?? error);
    }
    const filed = intoOfficial.experts.find((expert) => expert.slug === "official-filed");
    check("分类：自建专家可以归到官方分类名下",
      intoOfficialError === "NO-ERROR" && filed?.division === "academic" && filed?.divisionZh === "学术",
      intoOfficialError === "NO-ERROR" ? String(filed?.division) : intoOfficialError);
    check("分类：归到官方分类时文件仍写自建根（官方镜像目录不动，同步不会删它）",
      existsSync(join(customRoot, "academic", "official-filed.md"))
      && !existsSync(join(customExpertsRoot, "academic", "official-filed.md")));
    check("分类：内置镜像文件一个字节都没被改", (await rf(builtinPath, "utf8")).includes("内置正文"));
    const academicRow = intoOfficial.categories.find((item) => item.key === "academic");
    check("分类：官方分类的计数把自建专家算进去，并标出其中自建多少",
      academicRow?.official === true && academicRow.count === academicBaseline + 1 && academicRow.customCount === 1,
      `${JSON.stringify(academicRow)}（基线 ${academicBaseline}）`);
    check("分类：非法分类名仍被拒（中文目录名 / .. 越界）",
      (await codeOf(customService.createExpert({ slug: "bad-div", name: "X", description: "d", body: "b", division: "我的分类" }))) === "tTeam/custom-division-invalid"
      && (await codeOf(customService.createExpert({ slug: "bad-div2", name: "X", description: "d", body: "b", division: "../escape" }))) === "tTeam/custom-division-invalid");
    check("分类：被拒的新建没留下任何文件",
      !existsSync(join(customRoot, "我的分类")) && !existsSync(join(customExpertsRoot, "我的分类")));

    // 2) 分类管理：新建 / 改名
    // ⚠️ 这里**不能用 `research` 当自建分类名**：真名册的中文侧车把 research 列为**官方分类**，
    // 而 2026-09-13 起这个临时 root 也会被补齐包内侧车 —— 用官方名新建会被正当地拒绝
    // （正是下面那条断言的语义），继续沿用旧名字只会让整个套件崩在未捕获的 promise 上。
    const customCategory = "test-research";
    const madeCategory = await customService.createCategory(customCategory, "研究");
    check("分类管理：新建分类后立刻出现在分类表（可以先是空分类）",
      madeCategory.categories.some((item) => item.key === customCategory && item.label === "研究" && item.official === false && item.count === 0),
      JSON.stringify(madeCategory.categories.find((item) => item.key === customCategory)));
    check("分类管理：新建官方同名分类被拒（官方分类已存在，含真名册里的 research）",
      (await codeOf(customService.createCategory("academic", "再来一个"))) === "tTeam/category-exists"
      && (await codeOf(customService.createCategory("research", "研究"))) === "tTeam/category-exists");
    check("分类管理：重复新建被拒",
      (await codeOf(customService.createCategory(customCategory, "研究2"))) === "tTeam/category-exists");
    check("分类管理：非法目录名被拒",
      (await codeOf(customService.createCategory("我的分类", "中文"))) === "tTeam/custom-division-invalid");
    const renamed = await customService.updateCategory(customCategory, "研究方法");
    check("分类管理：改自建分类的显示名生效",
      renamed.categories.some((item) => item.key === customCategory && item.label === "研究方法"));
    check("分类管理：官方分类改名被拒（名字跟随名册同步，只读）",
      (await codeOf(customService.updateCategory("academic", "学术研究"))) === "tTeam/category-official");
    check("分类管理：改不存在的分类被拒",
      (await codeOf(customService.updateCategory("nope", "x"))) === "tTeam/category-missing");

    // 3) 新建专家时可以落进刚建的空分类（面板「＋ 新建分类…」那条路径）
    const inNew = await customService.createExpert({
      slug: "researcher", name: "研究员", description: "一句话简介", body: "# 正文\n\n正文", division: customCategory,
    });
    check("分类：新建专家时选中的分类就是落点",
      inNew.experts.find((expert) => expert.slug === "researcher")?.division === customCategory
      && existsSync(join(customRoot, customCategory, "researcher.md")));

    // 4) 删除分类：非空拒绝，清空后删除（含空目录收尾）
    check("分类管理：删除非空分类被拒并报出人数",
      (await codeOf(customService.deleteCategory(customCategory))) === "tTeam/category-not-empty");
    check("分类管理：删除官方分类被拒",
      (await codeOf(customService.deleteCategory("academic"))) === "tTeam/category-official");
    const researcher = inNew.experts.find((expert) => expert.slug === "researcher");
    await customService.deleteExpert("researcher", researcher.hash);
    const afterDelete = await customService.deleteCategory(customCategory);
    check("分类管理：清空后可以删除，分类从表里消失",
      !afterDelete.categories.some((item) => item.key === customCategory),
      afterDelete.categories.map((item) => item.key).join(","));
    check("分类管理：删除分类会收掉空目录（不留空壳）", !existsSync(join(customRoot, customCategory)));

    // 5) 换分类 = 移动文件（老文件必须删掉，否则同一 slug 两份并存）
    const intoCustom = await customService.createExpert({
      slug: "div-expert", name: "分类专家", description: "一句话简介", body: "# 正文\n\n正文", division: "custom",
    });
    const divExpert = intoCustom.experts.find((expert) => expert.slug === "div-expert");
    const moved = await customService.updateExpert("div-expert",
      { name: "分类专家", description: "一句话简介", body: "# 正文\n\n正文", division: "archive" }, divExpert.hash);
    check("分类：编辑时换分类 = 移动文件，老文件必须删掉",
      !existsSync(join(customRoot, "custom", "div-expert.md")) && existsSync(join(customRoot, "archive", "div-expert.md")));
    const movedExpert = moved.experts.find((expert) => expert.slug === "div-expert");
    check("分类：换分类后快照随之更新", movedExpert?.division === "archive", String(movedExpert?.division));
    const kept = await customService.updateExpert("div-expert",
      { name: "分类专家 v2", description: "一句话简介", body: "# v2\n\n改过的正文" }, movedExpert.hash);
    check("分类：编辑时不传分类 = 留在原分类（不会被弹回默认分类）",
      kept.experts.find((expert) => expert.slug === "div-expert")?.division === "archive");

    // 6) 线协议：分类字段必须声明（zod 会把未声明的键直接剥掉）
    const remoteMod2 = await import(join(HERE, "lib/remote.js"));
    const inputDescriptor = remoteMod2.DESCRIPTORS.find((item) => item.method === "createExpert");
    const parsedInput = inputDescriptor.parameters[0].codec.schema.parse({
      name: "x", description: "d", body: "b", division: "research", divisionLabel: "研究",
    });
    check("分类：createExpert 的入参 schema 保留 division/divisionLabel",
      parsedInput.division === "research" && parsedInput.divisionLabel === "研究", JSON.stringify(parsedInput));
    for (const method of ["createCategory", "updateCategory", "deleteCategory"]) {
      const descriptor = remoteMod2.DESCRIPTORS.find((item) => item.method === method);
      check(`分类管理：${method} 有严格描述符（面板才能调到）`,
        descriptor !== undefined && descriptor.service === "tTeam"
        && descriptor.parameters[0].codec.schema.safeParse("research").success,
        descriptor === undefined ? "缺描述符" : descriptor.parameters.map((p) => p.name).join(","));
    }
    const parsedSnapshot = remoteMod2.DESCRIPTORS.find((item) => item.method === "getCatalog")
      .result.schema.parse(await customService.snapshot());
    check("分类：getCatalog 的 wire schema 覆盖 categories（否则面板拿不到分类表）",
      Array.isArray(parsedSnapshot.categories)
      && parsedSnapshot.categories.some((item) => item.key === "academic" && item.official === true && item.count === academicBaseline + 1)
      && parsedSnapshot.categories.some((item) => item.key === "archive" && item.official === false)
      && parsedSnapshot.categories.some((item) => item.key === "custom" && item.official === false),
      JSON.stringify(parsedSnapshot.categories?.map((item) => `${item.key}:${item.official}:${item.count}`)));

    // 7) 分类显示名表必须单独进指纹：改一个**已有文件**不会变动父目录 mtime，
    // 漏了它手工编辑 divisions.json 后分类名不会刷新（与「新增 zh 正文不重载」同一类坑）。
    const { utimes } = await import("node:fs/promises");
    const labelPath = join(customRoot, "divisions.json");
    await wfDiv(labelPath, JSON.stringify({ archive: "归档" }));
    const futureLabel = new Date(Date.now() + 5000);
    await utimes(labelPath, futureLabel, futureLabel);
    const relabeled = await customService.snapshot();
    check("分类：手工改 divisions.json 后显示名按指纹重载",
      relabeled.categories.some((item) => item.key === "archive" && item.label === "归档"),
      JSON.stringify(relabeled.categories.find((item) => item.key === "archive")));
  }
}

// ---------- 15. 名册工具（上游同步已移除：data/experts 是真源） ----------
// 用户 2026-09-12 要求：不再从上游获取专家，运维菜单里加「新增专家」——
// 选分类（或新建分类）→ 给一个 .md 路径 → 脚本同时写源码与运行时。
console.log("\n[15] 名册工具");
if (!HAS_OPS) {
  // add-expert.py 属于运维目录（不随仓库分发），干净 clone / CI 上没有它。
  // 明确记一条 skip，避免"少跑了"看起来像"全绿"。
  check("名册工具节已跳过（本机没有运维目录：add-expert.py 不在）", true, "skip");
} else {
  const { mkdtemp, mkdir, writeFile: wfR, readFile: rfR } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { spawnSync } = await import("node:child_process");
  // 与 OPS_SCRIPT_PATH 同一约定：2026-09-13 起运维台随仓库纳管到 `<repo>/ops/`，
  // 工作区里那份可能只是薄转发（本机的 ~/web/t-team 就没有 add-expert.py）。
  // 所以仓库内 ops/ 优先，仓库里没有时才回退工作区那份。
  const tool = existsSync(join(HERE, "ops", "add-expert.py"))
    ? join(HERE, "ops", "add-expert.py")
    : join(OPS_DIR, "add-expert.py");
  const opsText = OPS_SCRIPT;

  // 「工具在不在」与「能不能真跑」是两件事：python3 环境不齐（缺依赖 / PATH 指向的 runtime
  // 不完整）时，后面那段"真跑一遍"会连环失败，并在第一个 rmSync / rfR 上抛 ENOENT 把**整个
  // verify 打断** —— [16] 起的全部段落都跑不到，等于静默丢掉一半覆盖。
  // 所以「在」是硬断言，「能跑」只决定整段真跑还是明确 skip（跑不动不该判红）。
  const toolPresent = existsSync(tool);
  const toolRuns = toolPresent
    && spawnSync("python3", [tool, "--help"], { encoding: "utf8" }).status === 0;
  check("名册工具存在（add-expert.py 在运维目录里）",
    toolPresent, toolPresent ? "在" : "skip（本机没有 add-expert.py）");

  // 上游代码必须删干净：这些名字再出现在 tz.sh 里就说明回归了
  const upstreamLeftovers = ["UPSTREAM", "sync.py", "sync-zh.py", "roster-skip.json", "brand.mjs", "engine-sync"]
    .filter((token) => opsText.includes(token));
  check("tz.sh 里不再有任何上游同步痕迹（UPSTREAM / sync.py / sync-zh.py / roster-skip / brand.mjs / engine-sync）",
    upstreamLeftovers.length === 0, upstreamLeftovers.join(",") || "clean");
  const repoLeftovers = ["brand.mjs", join("vendor", "dsh-agent-teams", "upstream"), "VENDOR.md"]
    .filter((rel) => existsSync(join(OPS_DIR, rel)) || existsSync(join(HERE, rel)));
  check("品牌化链与上游镜像目录已从磁盘删除",
    repoLeftovers.length === 0 && !existsSync(join(OPS_DIR, "sync.py")) && !existsSync(join(OPS_DIR, "sync-zh.py")),
    repoLeftovers.join(",") || "clean");
  check("package.json 的 build 不再调用 brand.mjs",
    !JSON.parse(await readFile(join(HERE, "package.json"), "utf8")).scripts.build.includes("brand"));
  check("名册工具仍接在 tz.sh 上（子命令 experts add|remove|stats|check；菜单里不单列）",
    opsText.includes("do_expert_add") && opsText.includes("do_expert_remove")
    && opsText.includes("do_roster \"$@\"") && opsText.includes("do_roster_check \"$@\"")
    && /experts\)/u.test(opsText));
  // 2026-10-06 用户要求：运维台只留「和辅助补丁差不多常用」的动作，14 项裁到 7 项
  // （删掉新增/删除专家、打开两个目录、单独的名册校验与中文覆盖、同步数据快照 —— 能力都没删，
  //  只是不再占菜单；名册增删走 `tz.sh experts add|remove`）。这条钉住裁剪结果，免得日后长回来。
  check("tz.sh 菜单只保留 7 项常用动作（与辅助补丁对齐）",
    /^  1\) 名册统计/mu.test(opsText) && /^  7\) 一键发布到 npm/mu.test(opsText) && !/^  8\)/mu.test(opsText));

  if (!toolRuns) {
    // 工具跑不动就整段跳过（原因见上面那条 check 的注释）。记一条 skip 而不是静默略过，
    // 免得"少跑了一大段"看起来像"全绿"。
    check("名册工具真跑环节已跳过（python3 跑不起 add-expert.py，环境缺依赖）", true, "skip");
  } else {
  // 真跑一遍工具（临时仓库 + 临时运行时，不碰真数据）
  const base = await mkdtemp(join(tmpdir(), "t-team-roster-"));
  const repo = join(base, "repo");
  const runtime = join(base, "runtime");
  await mkdir(join(repo, "data", "experts", "academic"), { recursive: true });
  await mkdir(join(repo, "data", "zh"), { recursive: true });
  await mkdir(join(runtime, "experts", "academic"), { recursive: true });
  await mkdir(join(runtime, "zh"), { recursive: true });
  await wfR(join(repo, "data", "experts", "academic", "alpha.md"), "---\nname: Alpha\ndescription: 样例\n---\n\n正文\n");
  await wfR(join(runtime, "experts", "academic", "alpha.md"), "---\nname: Alpha\ndescription: 样例\n---\n\n正文\n");
  await wfR(join(repo, "data", "source.json"), JSON.stringify({ expertFiles: 1, divisions: ["academic"] }));
  await wfR(join(runtime, "source.json"), JSON.stringify({ expertFiles: 1, divisions: ["academic"] }));
  // 分区标签的真身是 `{en, zh}` 对象（真实数据就是这个形态；纯字符串是旧形态，插件两种都吃）。
  // 夹具刻意用对象形态：只按字符串假设去读的实现会在格式化时抛 TypeError（`stats` / 选分类菜单），
  // 而写回时更糟 —— 会把对象压成字符串，英文名静默丢掉。
  await wfR(join(repo, "data", "zh", "divisions.json"), JSON.stringify({ academic: { en: "Academic", zh: "学术" } }));
  await wfR(join(runtime, "zh", "divisions.json"), JSON.stringify({ academic: { en: "Academic", zh: "学术" } }));
  const sourceMd = join(base, "newbie.md");
  await wfR(sourceMd, "---\nname: 我的研究员\ndescription: 研究财务\nemoji: \"🔬\"\n---\n\n# 人格\n\n认真研究。\n");
  const bareMd = join(base, "bare.md");
  await wfR(bareMd, "# 没有 frontmatter\n\n只有正文。\n");
  const run = (...args) => spawnSync("python3", [tool, ...args, "--repo", repo, "--runtime", runtime],
    { encoding: "utf8" });

  check("check：一致时退出 0", run("check").status === 0, run("check").stdout.trim().split("\n").pop());
  const added = run("add", "--category", "finance", "--file", sourceMd, "--slug", "my-researcher", "--label", "金融", "--force");
  check("add：同时写源码与运行时（两处都要有）",
    added.status === 0 && existsSync(join(repo, "data", "experts", "finance", "my-researcher.md"))
    && existsSync(join(runtime, "experts", "finance", "my-researcher.md")),
    `exit=${added.status} ${added.stderr.trim().slice(0, 80)}`);
  const manifestAfterAdd = JSON.parse(await rfR(join(repo, "data", "source.json"), "utf8"));
  check("add：清单计数与分类同步更新（运行时那份也一样）",
    manifestAfterAdd.expertFiles === 2 && manifestAfterAdd.divisions.includes("finance")
    && JSON.parse(await rfR(join(runtime, "source.json"), "utf8")).expertFiles === 2,
    JSON.stringify(manifestAfterAdd));
  check("add：新分类的中文显示名写进两边的 divisions.json",
    JSON.parse(await rfR(join(repo, "data", "zh", "divisions.json"), "utf8")).finance === "金融"
    && JSON.parse(await rfR(join(runtime, "zh", "divisions.json"), "utf8")).finance === "金融");
  check("add：没有 frontmatter 的文件可以靠 --name/--description 补出来",
    run("add", "--category", "finance", "--file", bareMd, "--slug", "bare-one",
        "--name", "裸专家", "--description", "没有 frontmatter 的例子", "--force").status === 0
    && (await rfR(join(repo, "data", "experts", "finance", "bare-one.md"), "utf8")).startsWith("---\nname: 裸专家"));
  check("add：slug 不合法被拒（中文文件名不能当 slug）",
    run("add", "--category", "finance", "--file", sourceMd, "--slug", "中文名", "--force").status !== 0);
  check("add：分类名不合法被拒（与插件扫描口径同一个正则）",
    run("add", "--category", "我的分类", "--file", sourceMd, "--slug", "x", "--force").status !== 0);
  // 反向证伪点：把运行时那份删掉，check 必须报不一致并以退出码 1 结束。
  // force:true —— 上面那几条 add 依赖 Python 名册工具，环境缺依赖时会没生成这个文件；
  // 那种情况下应该让后面的断言如实失败，而不是在这里抛 ENOENT 把整个 verify 打断
  // （打断后 [16] 起的全部段落都跑不到，等于静默丢掉一半覆盖）。
  rmSync(join(runtime, "experts", "finance", "my-researcher.md"), { force: true });
  const drifted = run("check");
  check("check：运行时缺一位 → 退出码 1 并点名它（反向证伪点）",
    drifted.status === 1 && drifted.stdout.includes("my-researcher"), `exit=${drifted.status}`);
  await wfR(join(runtime, "experts", "finance", "my-researcher.md"),
    await rfR(join(repo, "data", "experts", "finance", "my-researcher.md"), "utf8"));
  check("check：补回来又一致", run("check").status === 0);
  const removed = run("remove", "--category", "finance", "--slug", "bare-one", "--yes");
  check("remove：源码与运行时两份一起删",
    removed.status === 0 && !existsSync(join(repo, "data", "experts", "finance", "bare-one.md"))
    && !existsSync(join(runtime, "experts", "finance", "bare-one.md")));
  const stats = run("stats");
  check("stats：列出分类与计数", stats.status === 0 && stats.stdout.includes("finance") && stats.stdout.includes("academic"));
  check("stats：分类显示名兼容 {en, zh} 对象形态（纯字符串假设会 TypeError）",
    stats.status === 0 && stats.stdout.includes("学术"),
    stats.stderr.trim().split("\n").pop() ?? "");
  // 往**已存在**的分类里加人：不能把 `{en, zh}` 标签压成字符串（英文名会丢）
  const keptLabel = run("add", "--category", "academic", "--file", sourceMd, "--slug", "academic-one", "--force");
  const divisionsAfter = JSON.parse(await rfR(join(repo, "data", "zh", "divisions.json"), "utf8"));
  check("add：已有分类的 {en, zh} 标签写回时保持对象形态",
    keptLabel.status === 0 && divisionsAfter.academic?.zh === "学术" && divisionsAfter.academic?.en === "Academic",
    JSON.stringify(divisionsAfter.academic));
  rmSync(base, { recursive: true, force: true });
  }
}

// ---------- 16. 发布包自洽（陌生人拿到的就是它） ----------
// 前面所有章节验的都是**源码树**；这一节把真正的 tgz 打出来、解开、再验一遍 ——
// 「src 里对」不等于「装到别人机器上对」。用 --ignore-scripts 避免 npm pack 触发
// prepublishOnly 而递归调用本自检。
console.log("\n[16] 发布包自洽（真实 tgz）");
{
  const { mkdtemp, readFile: rfP, readdirSync: rdP } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { spawnSync } = await import("node:child_process");
  const packDir = await mkdtemp(join(tmpdir(), "t-team-pack-"));
  // maxBuffer 必须放大：npm pack 会把 tarball 的文件清单逐条走 stderr（npm notice），
  // 名册扩到 645 位后包内近 1.5 万个文件，默认 1MB 缓冲直接 ENOBUFS —— 进程被 SIGTERM、
  // status 变 null，表现为「打不出 tgz」，而实际上 npm pack 是成功的（2026-09-29 实测
  // stderr 已达 1,039,143 字节）。
  // 子进程必须**真的打包**：`npm publish --dry-run` 会把 dry-run 灌进环境变量，
  // 于是这里调起的 `npm pack` 也进了 dry-run —— 一个文件都不写，自检就成了假失败
  // （2026-09-29 实测：发布预演时 packDir 是空的，而手动跑 verify 一切正常）。
  // 显式剥掉继承来的这几个开关，让子进程回到正常模式。
  const packEnv = { ...process.env };
  for (const key of Object.keys(packEnv)) {
    if (key === "npm_config_pack_destination" || key.startsWith("npm_config_dry")) delete packEnv[key];
  }
  const packed = spawnSync("npm", ["pack", "--ignore-scripts", "--pack-destination", packDir],
    { cwd: HERE, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: packEnv });
  // **不从 stdout 猜文件名**：`npm pack` 的输出会随环境变（夹 notice、空行），
  // 在 `npm publish` 的 `prepublishOnly` 里跑时更不可靠 —— 2026-09-29 实测发布预演时
  // 取到的"文件名"根本不是文件名，于是 tar 拿到一个不存在的路径、后面 walk() 直接 ENOENT 崩掉。
  // 目标目录里本来就只有那一个 .tgz，直接扫它。
  const tgz = existsSync(packDir) ? (readdirSync(packDir).find((name) => name.endsWith(".tgz")) ?? "") : "";
  check("能打出 tgz（npm pack --ignore-scripts）",
    packed.status === 0 && tgz !== "" && existsSync(join(packDir, tgz)),
    tgz !== "" ? tgz : `status=${packed.status} ${String(packed.stderr ?? "").trim().slice(-160)}`);

  const extracted = tgz === ""
    ? { status: 1, stderr: "没有 tgz 可解" }
    : spawnSync("tar", ["-xzf", join(packDir, tgz), "-C", packDir], { encoding: "utf8" });
  const root = join(packDir, "package");
  check("tgz 能解开（package/）", extracted.status === 0 && existsSync(join(root, "lib", "index.js")),
    String(extracted.stderr ?? "").trim().slice(0, 120));

  const walk = (dir, base = dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path, base) : [path.slice(base.length + 1)];
  });
  // 解包失败时别在这里崩：后面那批断言会各自 FAIL，那才是该看到的信号。
  const files = existsSync(root) ? walk(root) : [];
  const md = (prefix) => files.filter((name) => name.startsWith(prefix) && name.endsWith(".md")).length;
  // 凭证类文件：绝不进仓库、绝不进 npm 包 —— 两条出口都要堵。这里的 `files` 是**真实打包清单**
  // （tarball 解包后 walk 出来的），所以查得到具体文件；package.json 的 files 白名单是目录级的，
  // 拿它查不出来。
  // 2026-10-06：WorkBuddy 专家包 invoice-verify-workbuddy 自带一个 .env，里面是**真实的**阿里云
  // OSS AccessKey ID + Secret。导入脚本原样复制进来，随 npm 发了十几个版本，直到推新仓库时被
  // GitHub 的 push protection 当场拦下才现形 —— GitHub 那边反倒成了唯一的发现渠道。
  // 该专家包的 mcp-config.json 用的本来就是 ${VAR} 占位符：这种文件属于使用者自己的配置。
  {
    const { execFileSync } = await import("node:child_process");
    const secretLike = /(^|\/)\.env($|\.)|\.pem$|_rsa$|\.p12$|\.pfx$/iu;
    const notExample = (name) => !String(name).endsWith(".env.example");
    const packedSecrets = files.filter((name) => secretLike.test(name) && notExample(name));
    check("npm 包里不含凭证类文件（.env / .pem / 私钥）—— WorkBuddy 专家包会自带 .env",
      packedSecrets.length === 0, packedSecrets.join(",") || "clean");
    let trackedSecrets = [];
    try {
      trackedSecrets = execFileSync("git", ["ls-files"], { encoding: "utf8", cwd: HERE })
        .split("\n").filter(Boolean).filter((name) => secretLike.test(name) && notExample(name));
    } catch {
      trackedSecrets = [];   // 不在 git 仓库里跑（例如解包后的目录）就跳过这条
    }
    check("仓库里没有被 git 跟踪的凭证类文件（.env / .pem / 私钥）",
      trackedSecrets.length === 0, trackedSecrets.join(",") || "clean");
  }
  // 专家条目数（注意不是 .md 总数）：`<分区>/<slug>.md`、`<分区>/<子目录>/<slug>.md`
  // 与目录形态的 `<分区>/<slug>/persona.md` 各算 1 位。
  // 专家包内部的 agents/*.md、skills/**/SKILL.md 是附件，不能算进名册规模
  // （2026-09-29 引入目录形态专家后，按 .md 总数会得出 6877 这种虚数）。
  // 先定位所有「目录形态专家包」（`<分区>/<slug>/persona.md`）：这些包内部的 .md
  // （README.md、agents/*.md、skills/**/SKILL.md）都是附件，一位专家都不算。
  const packDirs = new Set();
  for (const name of files) {
    if (!name.startsWith("data/experts/")) continue;
    const parts = name.slice("data/experts/".length).split("/");
    if (parts.length === 3 && parts[2] === "persona.md") packDirs.add(`${parts[0]}/${parts[1]}`);
  }
  const expertEntries = files.filter((name) => {
    if (!name.startsWith("data/experts/")) return false;
    const parts = name.slice("data/experts/".length).split("/");
    if (parts.length === 2) return parts[1].endsWith(".md");
    if (parts.length === 3) {
      if (packDirs.has(`${parts[0]}/${parts[1]}`)) return parts[2] === "persona.md";
      return parts[2].endsWith(".md");
    }
    return false;
  }).length;

  // 不该随包发出去的东西：源码 / 运维脚本 / 上游镜像 / 客户端 bundle（已内联进 lib/client.js）
  const forbidden = [
    ["src/", (n) => n.startsWith("src/")],
    ["scripts/", (n) => n.startsWith("scripts/")],
    ["运维脚本", (n) => /^(tz\.sh|add-expert\.py|brand\.mjs|verify\.mjs|build-client\.mjs|sync-data\.mjs|preview-panel\.mjs)$/u.test(n)],
    ["上游镜像", (n) => n.startsWith("vendor/dsh-agent-teams/upstream/")],
    ["client.bundle.txt（已内联）", (n) => n === "vendor/dsh-agent-teams/client.bundle.txt"],
    ["VENDOR.md", (n) => n === "vendor/dsh-agent-teams/VENDOR.md"],
  ].filter(([, test]) => files.some(test)).map(([label]) => label);
  check("包里没有源码 / 运维脚本 / 上游镜像", forbidden.length === 0, forbidden.join(",") || "clean");

  check("包里带着 623 位专家与中文侧车", expertEntries === 623 && md("data/zh/") > 300,
    `${expertEntries} 位 / zh ${md("data/zh/")} 篇`);

  // 包内 data 的**根层**只允许白名单里的那几个条目。这一条是对**打出来的 tgz**钉的，
  // 与上面 [13] 的 package.json 声明、sync-data.mjs 的白名单构成三处一致：
  // `data/` 根层还住着运行时同步记录 `.t-team-snapshot.json`（`.gitignore` 与 sync-data 的
  // JUNK 集都写着「不是名册内容、绝不能进包」），但 npm 的 files 白名单一旦收整目录就会绕过
  // .gitignore 把它发出去 —— 用户装到的包里带着作者机器的版本号与时间戳，且会被 seedData
  // 当成「上次对齐记录」读走（2026-09-17 实测发现）。
  {
    const allowedData = [
      "data/experts", "data/zh", "data/source.json", "data/roster.json",
    ];
    const dataRoot = [...new Set(files
      .filter((name) => name.startsWith("data/"))
      .map((name) => {
        const rest = name.slice("data/".length);
        const cut = rest.indexOf("/");
        return cut === -1 ? name : `data/${rest.slice(0, cut)}`;
      }))].sort();
    const extra = dataRoot.filter((name) => !allowedData.includes(name));
    check("包内 data 根层只有白名单条目（运行时同步记录 .t-team-snapshot.json 不得随包发布）",
      extra.length === 0 && dataRoot.length === allowedData.length,
      extra.length > 0 ? `多余：${extra.join(",")}` : `${dataRoot.length} 条`);
  }

  // 客户端产物必须**自包含**（否则装到别人机器上设置页整个不存在）
  const packagedClient = await rfP(join(root, "lib", "client.js"), "utf8");
  check("包里的 lib/client.js 内联了 T专家设置页（分类页 + 模块装载器）",
    packagedClient.includes("CategoriesTab") && packagedClient.includes("__ModuleLoader__"));

  // 包内 data 必须能被插件的解析器直接读起来（换一棵树真跑一次 loadCatalog）
  const packagedCatalog = await import(join(root, "lib", "catalog.js"));
  const loaded = await packagedCatalog.loadCatalog(join(root, "data", "experts"), undefined, {
    zhRoot: join(root, "data", "zh"),
  });
  check("包内 data 用插件自己的解析器能读满（623 位 / 22 分类）",
    loaded.size === 623 && packagedCatalog.catalogDivisions(loaded).length === 22,
    `${loaded.size} 位 / ${packagedCatalog.catalogDivisions(loaded).length} 分类`);

  // 实打实的打包结果（不是 package.json 的声明）：运维 skill 整篇是 tz.sh 流程，而 ops/ 不在包里，
  // 发给 npm 用户只会是一份"找不到 tz.sh"的手册 —— 所以它**不进包**（本机从源码装照样有）。
  check("运维 skill 不随 npm 包发布（包内不带任何 skills/）",
    !files.some((name) => name.startsWith("skills/")),
    files.filter((name) => name.startsWith("skills/")).join(",") || "(没有 skills 条目)");

  // 给人看的地方（README 门面 / npm description / 第三方许可说明）**允许**写死名册规模 ——
  // 那是有信息量的门面话；但必须等于包内快照：作者增删专家后忘了改，就红在这儿
  // （2026-09-15 用户提问「写死的数字过期了也没人发现」时定性）。数字从快照现算，断言本身不写死。
  {
    const docReadme = await rfP(join(root, "README.md"), "utf8");
    const docLicenses = await rfP(join(root, "vendor", "third-party-licenses", "README.md"), "utf8");
    // THIRD-PARTY-NOTICES 同样是 `files` 白名单内**随包发布**的文件，而且是**许可合规声明** ——
    // 但它此前漏在这条断言之外：9-15 把名册从 316 补到 323 时只同步了上面的 vendor 说明，
    // README 与 npm description 也对上了，唯独这里仍写着 316 与 279+35+2 的旧分解，无人发现
    // （2026-09-17 审计 F2；2026-09-19 修复时把本文件纳入）。合规文件里的错数字比门面话更需要盯。
    const docNotices = await rfP(join(root, "THIRD-PARTY-NOTICES"), "utf8");
    const experts = expertEntries;   // 专家条目数，不是 .md 总数（见上面的说明）
    const divisions = packagedCatalog.catalogDivisions(loaded).length;
    const pkgDescription = JSON.parse(await rfP(join(root, "package.json"), "utf8")).description;
    check("文档里的名册规模 = 包内快照（README 两处 / npm description / 许可说明 / 合规声明）",
      docReadme.includes(`${divisions} 个分类 / ${experts} 位专家`)
      && docReadme.includes(`${divisions} 个分类、${experts} 位`)
      && pkgDescription.includes(`${experts}-expert, ${divisions}-division`)
      && docLicenses.includes(`${divisions} 分区 / ${experts} 位`)
      && docNotices.includes(`${divisions} 个分类 / ${experts} 位`)
      && docNotices.includes(`总计 ${experts} 位`),
      `快照 ${experts} 位 / ${divisions} 分区`);
    // 上一条只锁**总数**，构成分解本身写错照样能过（279+35+2 曾经停在旧总数上，而总数已是 323）。
    // 这里把「**N 位来自…」与「**N 位为本仓自建」全部抓出来求和，让分解的加数也必须闭合到总数。
    const noticeParts = [...docNotices.matchAll(/\*\*(\d+) 位(?:来自|为本仓自建)/gu)].map((m) => Number(m[1]));
    const noticeSum = noticeParts.reduce((sum, value) => sum + value, 0);
    check("THIRD-PARTY-NOTICES 的构成分解加数之和 = 名册总数",
      noticeParts.length >= 2 && noticeSum === experts,
      `分解 ${noticeParts.join(" + ") || "(未识别)"} = ${noticeSum}，名册 ${experts}`);
  }

  // patch 与许可：cordis.patch.yml 必须真在包里，许可文本一份不少
  const packedManifest = JSON.parse(await rfP(join(root, "package.json"), "utf8"));
  check("包内 package.json 声明了 dsh.bundle 且 patch 文件真的在",
    packedManifest.dsh?.bundle?.patch === "./cordis.patch.yml" && files.includes("cordis.patch.yml"));
  check("包内许可齐备（LICENSE / THIRD-PARTY-NOTICES / 三份第三方 MIT）",
    ["LICENSE", "THIRD-PARTY-NOTICES", "vendor/third-party-licenses/agency-agents.LICENSE",
     "vendor/third-party-licenses/agency-agents-zh.LICENSE",
     "vendor/third-party-licenses/croner.LICENSE"]
      .every((name) => files.includes(name)),
    files.filter((n) => /LICENSE|NOTICES/u.test(n)).join(","));
  check("包内 source.json 是名册清单形态（不再有上游字段）",
    (() => {
      const state = JSON.parse(readFileSync(join(root, "data", "source.json"), "utf8"));
      return state.expertFiles === 623 && state.extraSource === undefined && state.sourceRevision === undefined;
    })());
  rmSync(packDir, { recursive: true, force: true });
}

// ---------- 18. 随包 skill（运维入口 + DeepSeek Harness 项目知识） ----------
console.log("\n[18] 随包 skill");
{
  const skillMod = await import(join(HERE, "lib/skill.js"));
  const indexSource = await readFile(join(HERE, "lib/index.js"), "utf8");

  // 形态：包内 skill 文件 + frontmatter 解析。
  const bundled = skillMod.buildBundledSkills({ root: join(HERE, "data", "experts") });
  const byName = new Map(bundled.map((item) => [item.name, item]));
  check("随包 skill 可解析",
    bundled.length === 1 && skillMod.BUNDLED_SKILL_NAMES.every((name) => byName.has(name)),
    bundled.map((item) => item.name).join(",") || "(空)");
  const skill = byName.get("t-expert-manager");
  check("包内 skill 可解析", skill !== undefined && skill.name === "t-expert-manager", skill?.name ?? "(undefined)");
  check("description 带触发词（路由靠它）",
    typeof skill?.description === "string" && /Use when/u.test(skill.description) && /新增专家/u.test(skill.description),
    (skill?.description ?? "").slice(0, 60));
  // 随包 skill 是**模型读**的东西（描述是路由面、正文会被逐条执行），且没有人复核环节：
  // 写死规模（「323 位专家 / 22 分区」「22 分类 / 323 位」）每加一位专家就过期，
  // 而模型会把它当事实读（2026-09-15 用户提问时定性）。规模一律现算，三处都不许写死。
  // 模式要求两位以上数字：正文里「每加一位专家」这种量词短语不该被误判。
  const scalePattern = /\d{2,}\s*(?:位|个)?\s*(?:专家|分类|分区)|\d{2,}\s*[-–]\s*(?:experts?|divisions?)/u;
  const opsReferencePath = join(skill?.resourceBase?.path ?? join(HERE, "skills", "t-expert-manager"), "references", "ops-reference.md");
  const opsReference = existsSync(opsReferencePath) ? readFileSync(opsReferencePath, "utf8") : "";
  check("随包 skill（描述 / 正文 / 参考文件）不写死名册规模",
    typeof skill?.description === "string" && typeof skill?.content === "string"
    && !scalePattern.test(skill.description)
    && !scalePattern.test(skill.content)
    && !scalePattern.test(opsReference),
    (skill?.description ?? "").slice(0, 60));
  // 运维参考是模型的执行手册：它写的发布语义必须与 tz.sh 实现一致（默认发当前版本，不是默认 patch 升版）。
  check("运维参考里的发布语义与实现一致（默认发当前版本）",
    opsReference.includes("--current") && opsReference.includes("不升版")
    && !opsReference.includes("默认 patch 升版"));
  check("正文不留占位符", typeof skill?.content === "string" && !skill.content.includes("{{"), "{{ 残留");
  check("正文不含 frontmatter", typeof skill?.content === "string" && !skill.content.startsWith("---"));
  check("资源基准目录指向本 skill（相对引用可解析）",
    skill?.resourceBase?.kind === "directory" && existsSync(join(skill.resourceBase.path, "references", "ops-reference.md")),
    skill?.resourceBase?.path ?? "(none)");

  // 2026-09-20 移除了两个「DeepSeek Harness 项目知识」随包 skill（dsh-harness-project /
  // dsh-harness-languages）：它们是开发本插件时用的参考资料，插件做完即失去用途，正文还会随
  // 上游仓库版本漂移。它们连同 tools/skill-drift.mjs 的同名副本漂移护栏一起删掉 —— 那条护栏
  // 是为「随包副本 vs 宿主同名副本」设的，包内不再有这两份，也就没有比对对象了。

  // 本机有运维台时，正文必须给出真实可用路径（不写死、不说谎）
  const opsRoot = skillMod.resolveOpsRoot({ dataDir: join(HERE, "data"), packageDir: HERE });
  if (existsSync(join(OPS_DIR, "tz.sh"))) {
    check("解析出运维台根目录（tz.sh 所在处）", opsRoot === resolve(OPS_DIR), opsRoot || "(空)");
    check("正文用的是解析出来的 tz.sh 绝对路径",
      skill?.content?.includes(join(OPS_DIR, "tz.sh")) === true);
  } else {
    check("没有运维台时明说找不到，而不是指向不存在的脚本",
      opsRoot === "" && skill?.content?.includes("未在本机找到 tz.sh") === true, opsRoot || "(空)");
  }

  // 注册：可选依赖 —— 没有 skills 服务时整段跳过，且不碰静态 inject
  check("installBundledSkills 在缺 inject 的上下文里安全返回 0",
    skillMod.installBundledSkills({}, {}) === 0 && skillMod.installBundledSkills(undefined, {}) === 0);
  {
    const seen = [];
    const registered = [];
    const fakeCtx = {
      logger: { info: () => {}, warn: () => {} },
      inject: (deps, callback) => {
        seen.push(deps);
        callback({
          skills: { register: (definition) => { registered.push(definition); return () => {}; } },
          effect: (fn) => fn(),
        });
        return () => {};
      },
    };
    check("installBundledSkills 排入一个注册",
      skillMod.installBundledSkills(fakeCtx, { root: join(HERE, "data", "experts") }) === 1);
    check("依赖声明为 [\"skills\"]（不污染插件静态 inject）",
      seen.length === 1 && seen[0].length === 1 && seen[0][0] === "skills", JSON.stringify(seen));
    check("注册的是同一批 skill 定义",
      registered.length === 1 && registered[0].name === "t-expert-manager" && registered[0].content === skill?.content,
      registered.map((item) => item.name).join(","));
    // 宿主只兜 invocation / provider，**不兜 source**；加载路径却校验 source 必须是字符串。
    // 少给 source 的症状是「目录里看得见、一加载就报 source must be a string」——回归护栏放这里。
    check("每个注册定义自带 source（不能指望宿主兜底，否则加载期直接抛错）",
      registered.every((item) => item.source === "runtime"),
      registered.map((item) => item.source ?? "(缺 source)").join(","));
    check("注册定义满足加载期契约（name/description/content/source 都是字符串）",
      registered.every((item) => ["name", "description", "content", "source"].every((key) => typeof item[key] === "string" && item[key] !== "")),
      JSON.stringify(registered.map((item) => ["name", "description", "content", "source"].filter((k) => typeof item[k] !== "string"))));
    // N-19（缺一个随包 skill 必须**响亮**告警）在本包已无测试对象：现在只剩 t-expert-manager
    // 一个条目，而它是 LOCAL_ONLY，缺席属于预期 —— 由下面那条「npm 用户零注册、零告警」探针覆盖。
    // 若将来再加入第二个随包 skill，这段要恢复；它当年修的是「三个缺其一完全静默」。
  }

  // 真注册表端到端：上面的假 ctx 抓不到「缺 source」这类加载期问题（宿主只在 get() 时校验），
  // 必须挂真实 SkillRegistry 走一遍「注册 → 目录可见 → 能加载出正文」。
  {
    const skillPkg = await import("@deepseek-ai/dsh-skill");
    const Registry = skillPkg.SkillRegistry ?? skillPkg.default;
    const skillCtx = new Context();
    await skillCtx.plugin(Registry);
    check("真注册表：installBundledSkills 排入注册", skillMod.installBundledSkills(skillCtx, { root: join(HERE, "data", "experts") }) === 1);
    await new Promise((done) => setTimeout(done, 50));
    const catalog = await skillCtx.skills.list({ cwd: HERE });
    const missing = skillMod.BUNDLED_SKILL_NAMES.filter((name) => !catalog.some((item) => item.name === name));
    check("真注册表：随包 skill 都在目录里可见", missing.length === 0, missing.join(",") || `${skillMod.BUNDLED_SKILL_NAMES.length}/${skillMod.BUNDLED_SKILL_NAMES.length}`);
    const hit = catalog.find((item) => item.name === "t-expert-manager");
    check("真注册表：目录里可见（provider/source 都是 runtime）",
      hit !== undefined && hit.provider === "runtime" && hit.source === "runtime", JSON.stringify(hit?.provider));
    const loaded = await skillCtx.skills.get("t-expert-manager", { cwd: HERE });
    // 正文里必须带「本机解出来的 tz.sh 绝对路径」——但那只在**本机有运维目录**时成立；
    // 干净 clone / CI 上正文写的是「未在本机找到 tz.sh」，所以这里只断言正文真的加载出来了。
    const opsPathInBody = !HAS_OPS || loaded?.content?.includes(join(resolve(OPS_DIR), "tz.sh")) === true;
    check("真注册表：能加载出正文（这条才是「用户点了能不能用」）",
      typeof loaded?.content === "string" && loaded.content.length > 1000 && loaded.content.includes("## 铁律") && opsPathInBody,
      loaded === undefined ? "get() 返回 undefined" : `${loaded.content.length} 字符`);
    await skillCtx.stop?.();
  }
  check("index.js 真的调了 installBundledSkills（否则上面全是空转）",
    indexSource.includes('import { installBundledSkills } from "./skill.js"') && /installBundledSkills\(ctx, config\)/u.test(indexSource));
  check("skills 没有被加进静态 inject（可选依赖必须保持可选）",
    !(indexSource.match(/export const inject = \[([^\]]*)\]/)?.[1] ?? "").includes("skills"));

  // frontmatter 解析器本身：单行标量、引号、缺字段
  check("frontmatterField 取单行标量并去掉引号",
    skillMod.frontmatterField('---\nname: x-y\ndescription: "a b"\n---\n\n正文\n', "description") === "a b"
    && skillMod.frontmatterField("没有 frontmatter", "name") === "");

  // 装机链路：少拷一层 skills/ 不会报错，只会静默没有这个 skill —— 必须由自检拦住
  const opsScript = OPS_SCRIPT;
  check("运维台把 skills/ 一并复制进运行副本（否则装机后 skill 静默消失）",
    !HAS_OPS || /cp -R "\$REPO\/skills"/u.test(opsScript), HAS_OPS ? "" : "skip（本机没有运维目录）");
  check("运维台把 locale/ 一并复制进运行副本（否则插件列表的名称/简介静默退回英文描述）",
    !HAS_OPS || /cp -R "\$REPO\/locale"/u.test(opsScript), HAS_OPS ? "" : "skip（本机没有运维目录）");
  check("运维台把随包 skill 文件列入装机前置检查（缺了要响亮地失败）",
    !HAS_OPS || skillMod.BUNDLED_SKILL_NAMES.every((name) => opsScript.includes(`skills/${name}/SKILL.md`)),
    HAS_OPS ? (skillMod.BUNDLED_SKILL_NAMES.filter((name) => !opsScript.includes(`skills/${name}/SKILL.md`)).join(",") || `${skillMod.BUNDLED_SKILL_NAMES.length}/${skillMod.BUNDLED_SKILL_NAMES.length}`) : "skip（本机没有运维目录）");
  /**
   * `t-expert-manager` 是**本机专有**的：它整篇是 `tz.sh` 运维流程，而 `ops/`、`tools/`、`tz.sh`
   * 都不随包发布 —— 从 npm 装的人拿到它也只能看到"找不到 tz.sh"。所以它走
   * `LOCAL_ONLY_SKILL_NAMES`：不进 npm 白名单、缺席时也不告警（否则每次启动一条"未注册"，
   * 看着像装坏了）。本机从源码装照常在，能力一字不少。
   */
  {
    const files = JSON.parse(readFileSync(join(HERE, "package.json"), "utf8")).files ?? [];
    check("package.json 的 files 白名单不带任何 skills/（运维 skill 不随包发布）",
      !files.some((entry) => entry.includes("skills")),
      files.filter((entry) => entry.startsWith("skills")).join(",") || "(没有 skills 条目)");
    check("运维 skill 登记为「本机专有」（缺席是预期，不许当缺文件告警）",
      skillMod.LOCAL_ONLY_SKILL_NAMES.includes("t-expert-manager")
      && skillMod.BUNDLED_SKILL_NAMES.includes("t-expert-manager"));
    // 真探针：临时把运维 skill 挪走 —— 必须"少注册一个、零告警"，而且 finally 里原样还原。
    const { renameSync } = await import("node:fs");
    const victim = join(HERE, "skills", "t-expert-manager");
    const parked = join(HERE, "skills", ".verify-parked-t-expert-manager");
    const marker = join(victim, "SKILL.md");
    const original = readFileSync(marker, "utf8");
    let renamed = false;
    try {
      rmSync(parked, { recursive: true, force: true });
      renameSync(victim, parked);
      renamed = true;
      const warns = [];
      const localCtx = {
        logger: { info: () => {}, warn: (line) => warns.push(String(line)) },
        inject: (deps, callback) => {
          callback({ skills: { register: () => () => {} }, effect: (fn) => fn() });
          return () => {};
        },
      };
      const count = skillMod.installBundledSkills(localCtx, {});
      check("npm 用户（包内没有任何 skill）：零注册，且**零告警**",
        count === 0 && warns.length === 0,
        `注册 ${count} 个 / 告警 ${warns.length} 条${warns.length > 0 ? `：${warns.join(" | ").slice(0, 80)}` : ""}`);
    } finally {
      if (renamed) {
        rmSync(victim, { recursive: true, force: true });
        renameSync(parked, victim);
      }
      check("运维 skill 探针结束后目录已还原（自检不得改动被测仓库）",
        existsSync(marker) && readFileSync(marker, "utf8") === original, marker);
    }
  }
}

console.log("\n[20] 类型检查覆盖（@ts-check ↔ tsconfig include）");
{
  const tsconfig = JSON.parse(await readFile(join(HERE, "tsconfig.json"), "utf8"));
  const included = new Set(tsconfig.include ?? []);
  // 递归：lib/ 下任何子目录（如 lib/skill-gate/）里的 @ts-check 文件都必须纳入检查。
  // 第一版用 readdirSync(join(HERE, "lib")) 只看顶层，于是 lib/skill-gate/*.js 整个不在视野内 —
  // 它们的 @ts-check 标记是**死的**（tsc 不会去读它们），而 tsconfig include 也同样漏列。
  // dsh-helper 那边的同类自检（0.13.0 修）已经踩过这个坑；这里跟用同一份递归写法。
  const marked = [];
  const collectMarked = async (dir, prefix) => {
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.isDirectory()) {
        await collectMarked(join(dir, entry.name), `${prefix}${entry.name}/`);
      } else if (entry.name.endsWith(".js")) {
        const source = await readFile(join(dir, entry.name), "utf8");
        if (/^\s*\/\/\s*@ts-check/mu.test(source)) marked.push(`${prefix}${entry.name}`);
      }
    }
  };
  await collectMarked(join(HERE, "lib"), "lib/");
  const dead = marked.filter((file) => !included.has(file));
  check("带 // @ts-check 的自研 host 文件都在 tsconfig include 里（标记不会白写）",
    marked.length >= 13 && dead.length === 0,
    dead.length > 0 ? `@ts-check 是死的：${dead.join(",")}` : `${marked.length} 个文件真被检查`);
  const ghost = [...included].filter((file) => file.startsWith("lib/") && !marked.includes(file));
  check("tsconfig include 里没有「列了但没开 @ts-check」的文件（include 不等于被检查）",
    ghost.length === 0,
    ghost.length > 0 ? `列了却不会被检查：${ghost.join(",")}` : "名单与标记一一对应");
}

// ---------- 20b. 客户端 bundle 的外部 require 必须在 dsh.client.inject 里声明 ----------
// 契约（@deepseek-ai/dsh-client-modules README「Lazy-CJS / 到达顺序」）：`dsh.client.inject`
// 让被点名的包**先于消费方到达**；bundle 里每一个 `require("@deepseek-ai/…")` 都是外部请求，
// 都该有这份到达保证，否则消费方可能先物化、require 当场抛错。
//
// 为什么单独立一条：2026-09-13 审计时曾把「声明了非 client 包 ui-primitives」判成配置错误
// —— **判错了**：lib/client.js 真的 `require("@deepseek-ai/dsh-client-ui-primitives")`，那条声明
// 是承重的（且上游 dsh-client-ui-jobs 等也这么做）。所以这里把它固化成不变量，让以后新增
// require 却忘了声明的人当场红。
console.log("\n[20b] 客户端外部 require ↔ dsh.client.inject");
{
  const pkg = JSON.parse(await readFile(join(HERE, "package.json"), "utf8"));
  const declared = pkg.dsh?.client?.inject ?? [];
  const declaredSet = new Set(declared);
  const bundle = await readFile(join(HERE, "lib/client.js"), "utf8");
  const required = [...new Set([...bundle.matchAll(/require\("(@deepseek-ai\/[^"]+)"\)/gu)].map((m) => m[1]))].sort();
  const undeclared = required.filter((name) => !declaredSet.has(name));
  {
    // 两端 remote 方法必须成对（只加一端会在调用期才炸）
    const hostRemote = await readFile(join(HERE, "lib", "remote.js"), "utf8");
    const clientSrc = await readClientSource();
    const hostMethods = new Set([...hostRemote.matchAll(/descriptor\("([A-Za-z]+)"/gu)].map((m) => m[1]));
    const clientMethods = new Set([...clientSrc.matchAll(/direct\("([A-Za-z]+)"/gu)].map((m) => m[1]));
    const onlyHost = [...hostMethods].filter((name) => !clientMethods.has(name));
    const onlyClient = [...clientMethods].filter((name) => !hostMethods.has(name));
    check("远端方法两端成对（宿主 descriptor ↔ 客户端 direct 完全一致）",
      onlyHost.length === 0 && onlyClient.length === 0,
      onlyHost.length || onlyClient.length ? `仅宿主=${onlyHost} / 仅客户端=${onlyClient}` : `${hostMethods.size} 个方法一致`);

  }

  // 方向是**单向**的：产物里出现的每个外部 require 都必须声明过（漏声明要红）；
  // 但「产物一个外部 require 都没有」不构成失败 —— T Team 引擎 UI 下线后，内联的上游
  // bundle 不再随包，产物侧也就不再直接 require 任何 @deepseek-ai/* 客户端包了。
  check("bundle 里的 @deepseek-ai/* 外部 require 全部已在 dsh.client.inject 里声明（否则消费方能赶在提供方前物化）",
    undeclared.length === 0,
    undeclared.length > 0 ? `漏声明：${undeclared.join(",")}` : `${required.length} 个外部 require，均已声明`);
  check("dsh.client.inject 名单本身干净（无重复、无空项、都是 @deepseek-ai/ 作用域）",
    declared.length === declaredSet.size && declared.every((name) => typeof name === "string" && name.startsWith("@deepseek-ai/")),
    declared.join(",") || "(空)");
}

// ---------- 20c. sidecar 端到端：schema 声明 + host 真返回 + 面板消费 ----------
//
// host 早就在快照里返回 sidecar（lib/index.js 的 getCatalog，把中文侧车缺失/跳过的文件/
// 读不出的分类目录都报上），注释也写着「面板可以据此提示」。但 0.4.6 之前
// catalogSnapshotSchema 没声明它，zod 把它剥掉了 —— "侧车缺失"会让名册**静默变全英文**，
// 用户看不到任何线索。修复在 0.4.6 一次到位：schema 声明 sidecar + 面板用 t-team-warn 渲染
// + i18n 三键（中英）。本组断言把它**端到端**钉住：单独每条都好做，加起来才证明"消息通了"。
console.log("\n[20c] sidecar 端到端");
{
  const { catalogSnapshotSchema } = await import(join(HERE, "lib/remote-schemas.js"));
  // 端到端 1：zod 真的把 sidecar 留下来了（不是只 grep schema 文本）
  const sample = {
    experts: [],
    enabled: [],
    revision: 0,
    sidecar: {
      zhRoot: "/tmp/zh",
      present: false,
      skippedFiles: 2,
      unreadableDivisions: ["engineering"],
    },
  };
  const parsed = catalogSnapshotSchema.parse(sample);
  check("schema 留住了 sidecar（而不是只 grep 一下声明文本）：zod 实跑解析后字段没被剥",
    parsed.sidecar !== undefined
    && parsed.sidecar.present === false
    && parsed.sidecar.skippedFiles === 2
    && Array.isArray(parsed.sidecar.unreadableDivisions)
    && parsed.sidecar.unreadableDivisions[0] === "engineering",
    `sidecar=${JSON.stringify(parsed.sidecar)}`);
  // 端到端 2：host 真在返回 sidecar（不是只在 schema 里写了，lib/index.js 的 getCatalog
  // 必须真的拼出这个对象）。直接 grep catalogSnapshotSchema 附近的源码会太脆（关键字一
  // 改就漏判），这里抽离成一个对 host 输出的最小断言。
  const hostIndex = await readFile(join(HERE, "lib/index.js"), "utf8");
  const assemblesSidecar = /sidecar\s*:\s*\{[\s\S]*?zhRoot[\s\S]*?skippedFiles[\s\S]*?unreadableDivisions[\s\S]*?\}/u.test(hostIndex);
  check("host 的 getCatalog 真在快照里拼出 sidecar 对象（不是只在 schema 里写）",
    assemblesSidecar,
    "lib/index.js 没找到 sidecar: { zhRoot, skippedFiles, unreadableDivisions } 这一块");
  // 端到端 3：面板真在消费（healthNotice 读 snapshot.sidecar，UI 渲染 t-team-warn）
  const settingsSource = await readFile(join(HERE, "src/client/settings.jsx"), "utf8");
  const cssSource = await readFile(join(HERE, "src/client/css.js"), "utf8");
  check("settings.jsx 真在读 snapshot.sidecar，并据此拼接提示",
    /snapshot\.sidecar/u.test(settingsSource) && /healthNotice/u.test(settingsSource),
    "src/client/settings.jsx 既没引用 snapshot.sidecar 也没生成 healthNotice");
  check("面板用 t-team-warn 类（不是 t-team-error：功能仍在，不是错误；不是 t-team-note：太弱）",
    /\.t-team-warn\s*\{/u.test(cssSource),
    "src/client/css.js 里没有 .t-team-warn");
  // 端到端 4：i18n 三键在中英两份字典里都有，且字典键集合一致（[6b] 会再次扫描，但那
  // 是通用检查，这里专盯 sidecar 用的三个键）
  const i18n = await readFile(join(HERE, "src/client/i18n.js"), "utf8");
  for (const key of ["roster.sidecarMissing", "roster.skippedFiles", "roster.unreadableDivisions"]) {
    const escaped = key.replace(/\./g, "\\.");
    const hits = (i18n.match(new RegExp(`"${escaped}":`, "gu")) ?? []).length;
    check(`i18n：${key} 在 zh 与 en 两份字典里都存在（共 2 处）`,
      hits === 2,
      `匹配到 ${hits} 处（应为 2）`);
  }
}

// ---------- 21b. 死代码 / 文档与实现不符：本轮（0.4.7）清理的不变量 ----------
//
// 这组是 2026-09-28 那次代码审查发现、并由 0.4.7 这一批清理掉的"代码看着在跑、其实没在跑"
// 与"文档在说一句实现已经不再做的事"。每一项都钉得很具体 —— 防止将来重构时把它们又长回来。
console.log("\n[21b] 死代码与文档一致性");
{
  // 死代码：这些函数/字段在 0.4.7 之前定义了但全仓无调用方。把"没调用"这件事钉成不变量。
  const remoteSrc = await readFile(join(HERE, "lib/remote.js"), "utf8");
  const indexSrc = await readFile(join(HERE, "lib/index.js"), "utf8");
  check("lib/remote.js 的 static inject 不再含未读取的 settings（cordis 会等它就绪）",
    !/static inject\s*=\s*\[\s*"settings"/u.test(remoteSrc),
    /static inject\s*=\s*\[[^\]]*settings[^\]]*\]/u.exec(remoteSrc)?.[0] ?? "已清");
  check("lib/index.js 里没有 renderPlanReport 这个 0 调用的预检报告渲染器",
    !/function renderPlanReport\b/u.test(indexSrc),
    "死函数回来了");
  check("lib/index.js 没有「连续两个 /** 而中间无 */」的孤立 JSDoc 起点（0.4.7 清了一个）",
    !/\/\*\*\s*\n\s*\/\*\*/u.test(indexSrc),
    indexSrc.match(/\/\*\*\s*\n\s*\/\*\*[^\n]{0,40}/u)?.[0] ?? "ok");

  // 陈旧数字：这几处 0.4.7 之前是把当时的名册规模写死的字面量。模型可见的事实不能写死。
  const i18n = await readFile(join(HERE, "src/client/i18n.js"), "utf8");
  check("i18n.js：settings.summary 不再含「N 位 · M 分区」字面量（数字应现算：rosterScale 已在 hint 里）",
    !/settings\.summary.*?\d+\s*位/u.test(i18n) && !/settings\.summary.*?\d+\s*分区/u.test(i18n),
    "字面量数字回来了");
  check("lib/index.js 不再含「N-expert, M-division」型字面量（rosterScale 是从目录现算的）",
    !/\b\d{2,4}-expert\b/u.test(indexSrc) && !/\b\d{2,4}-division\b/u.test(indexSrc),
    "字面量回来了");

  // 文档与实现：README 的"浮层标签"必须只剩 专家 / 技能 两个；原"任务"标签已迁出。
  // （这一条会被 [21a] 的 README 文本检查重复覆盖一次，这里再加一条防止"硬编码三个标签"复活）
  const readme = await readFile(join(HERE, "README.md"), "utf8");
  check("README 不再说「专家 → 技能 → 任务」（「任务」标签已在 0.3.x 迁出）",
    !/专家\s*→\s*技能\s*→\s*任务/u.test(readme),
    /专家[^\n]{0,15}任务/u.exec(readme)?.[0] ?? "ok");

  // 空 if 是死代码的一种常见形态：声明"我会做某事"然后什么都没做。0.4.7 清了 1 处。
  // 这是结构性护栏；用静态扫描而非行号（行号会一直漂）。
  const emptyIfBlocks = indexSrc.split("\n").reduce((count, line, index, all) => {
    if (/^\s*if\s*\([^)]*\)\s*\{\s*$/u.test(line)
      && index + 1 < all.length
      && /^\s*\}\s*$/u.test(all[index + 1])) {
      return count + 1;
    }
    return count;
  }, 0);
  check("lib/index.js 没有「单行 if + 紧邻空块」的占位（0.4.7 清掉 1 处，是 ctx.on 钩子的死壳）",
    emptyIfBlocks === 0,
    `${emptyIfBlocks} 处`);

  // parseStore 与 readJson 不再把错误吞了。0.4.7 之前是空 catch；现在 JSON 损坏或读权限
  // 失败会出声。这里钉住两点——不只是"有 console.warn"，还要确认旧空 catch 已被替换。
  const storeSrc = await readFile(join(HERE, "lib/skill-gate/store.js"), "utf8");
  const catalogSrc = await readFile(join(HERE, "lib/catalog.js"), "utf8");
  check("lib/skill-gate/store.js 的 parseStore JSON 损坏会 console.warn（旧空 catch 已替换）",
    /export function parseStore\([\s\S]*?JSON\.parse[\s\S]*?catch\s*\([\s\S]*?console\.warn/u.test(storeSrc),
    "空 catch 还在");
  check("lib/catalog.js 的 readJson 非 ENOENT 错误会 console.warn（旧空 catch 已替换）",
    /async function readJson\([\s\S]*?catch\s*\([\s\S]*?error\?\.code\s*!==\s*"ENOENT"[\s\S]*?console\.warn/u.test(catalogSrc),
    "空 catch 还在");
}

// ---------- 21. 文档里的自检计数不许漂移 ----------
// 为什么必须有：README 与 CI 步骤名把自检项数写成了**字面量**，而字面量已经漂过
// （文档写 468，2026-09-13 实测 476）—— 读者按文档去数会对不上，进而怀疑自检没跑全。
// 这条把「文档数字 = 本次实测总数」变成红灯，改断言的人被迫同步改文案。
// ⚠️ 本条必须始终是自检的**最后一条**：它只能数到「包含自己」的最终总数。
// ⚠️ 且只在**有运维台**的环境里做等值比较：干净 clone / CI 上没有 `ops/`，[15] 名册工具等
// 19 项根本不会跑，总数天然少一截 —— 在那里硬比会把 CI 判红（本条第一版就踩了这个坑：
// 本机 484/484 全绿，模拟无运维台时立刻红）。缺运维台时退化为「文档必须存在计数、且不小于
console.log("\n[21] 文档计数一致性");
{
  const finalTotal = checks + 1; // 本条 check 自己也算一项
  const quoted = [];
  for (const file of ["README.md", ".github/workflows/ci.yml"]) {
    const text = await readFile(join(HERE, file), "utf8");
    for (const match of text.matchAll(/(\d+)\s*(?:项断言|项自检|assertions)/gu)) quoted.push(`${file} 写的是 ${match[1]}`);
  }
  const documented = quoted.map((item) => Number(item.slice(item.lastIndexOf(" ") + 1)));
  if (HAS_OPS) {
    check(`文档引用的自检项数 = 本次实测总数（${finalTotal}）`,
      quoted.length > 0 && documented.every((value) => value === finalTotal),
      quoted.join(" / ") || "README 与 CI 里都没有「N 项断言 / N 项自检 / N assertions」字样");
  } else {
    check(`文档计数一致性（本环境无运维台 → 少跑 19 项，只查「有计数且 ≥ 实测 ${finalTotal}」）`,
      quoted.length > 0 && documented.every((value) => value >= finalTotal),
      quoted.join(" / ") || "README 与 CI 里都没有可识别的计数");
  }
}

console.log(`\n结果：${checks - failures}/${checks} 项通过${failures === 0 ? " ✓" : ""}`);
process.exit(failures === 0 ? 0 : 1);
