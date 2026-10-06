/**
 * 把 src/client/index.jsx（客户端源码入口；源码按职责拆在 src/client/ 下）打成 DSH 客户端插件产物 lib/client.js。
 *
 * 产物形态（DSH 客户端插件的标准信封）：
 *   window.__ModuleLoader__.load({ id: "<包名>", factory: (require) => { …; return module.exports } })
 *   - react 保持为 require("react")，由壳的模块表提供单例；
 *   - zod 打进产物内部；
 *   - 不 import 任何 @deepseek-ai/dsh-client-* 包：那些能力通过客户端 cordis 上下文（ctx）取得。
 *
 * 同时导出 `renderClientBundle()`，让 verify 能在**不写盘**的前提下重新渲染一次产物并比对，
 * 从而挡住"改了客户端源码却忘了 npm run build"的过期产物。
 */
import { existsSync, realpathSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

// 定位仓库根（D-2 起本脚本住在仓库内的 tools/）：上一级就是包根；兼容旧的"同级运维目录"布局。
const SELF_DIR = fileURLToPath(new URL(".", import.meta.url));
const HERE = process.env.T_TEAM_REPO
  ?? (existsSync(join(SELF_DIR, "..", "lib", "index.js")) ? resolve(SELF_DIR, "..") : join(SELF_DIR, "dsh-expert"));
const OUT = join(HERE, "lib/client.js");

// 2026-09-21：内置团队引擎（@nanmicoder/dsh-agent-teams）随 T Team 模块一并下线后，
// 本脚本原有的「内联上游客户端文本 + 内联期后处理」整条链已没有输入：
// 上游产物 vendor/dsh-agent-teams/client.bundle.txt、以及围绕它逐条锚定的规则
// （VENDOR_CLIENT_TEXT / CI_ROOT / REGION_COMMENT / HARDCODED_LABEL / OVERLAY_SIZE_FALLBACK /
// LEGACY_ICON_FALLBACK / postProcessInlinedText / inlineVendorText）全部删除 ——
// 产物现在**完全**来自 src/client/。随引擎失效的那段宿主兼容知识（宿主 0.1.7 起
// `[data-shell-overlay]` 的 rect 可能塌陷成 0×0 让面板压成 1×1 像素；图标从旧命名
// `IconXxx<像素>` 换成 `…Regular`/`…Medium` 两档描边、像素档改由 size prop 传）需要追溯时
// 看仓库 git 历史。

/**
 * 客户端产物**刻意不压缩**（F-2，2026-09-13 实测结论）。
 *
 * 实测开启 esbuild minify 后产物 1,078,626 → 736,053 字节（−32%），但自检里有多条断言是
 * **对产物做文本检查**的，压缩会把标识符改名从而让它们失效：
 *   「客户端与 host 的 remote 方法集合一致」「构建产物里带上了分类入口」等
 * 也就是：省下的体积换来的是**一批门禁变成空转**——对本插件（本地安装、非 CDN 分发）
 * 不划算。verify 的 [6c] 会拦住「有人把 minify 打开却不更新那些断言」。
 */
const MINIFY = false;

/** 渲染客户端产物文本（纯函数，不写盘）。 */
export async function renderClientBundle() {
  const PKG = JSON.parse(await readFile(join(HERE, "package.json"), "utf8"));
  const result = await build({
    // absWorkingDir 必须显式指定：否则 esbuild 会按**当前工作目录**生成源路径注释
    // （`// src/client/index.jsx` vs `// dsh-expert/src/client/index.jsx`），产物就随 cwd 变化、
    // 不再可复现。搬出仓库后 tz.sh 与 npm scripts 的 cwd 不同，正是这个坑。
    absWorkingDir: HERE,
    entryPoints: [join(HERE, "src", "client", "index.jsx")],
    bundle: true,
    write: false,
    format: "cjs",
    platform: "browser",
    target: ["es2022"],
    jsx: "transform",
    // 官方客户端包一律**外部化**（2026-09-28 加，设置面板换官方 primitives 时）：交给宿主的
    // 客户端模块表提供单例 —— 打进来会得到第二份实例（React 上下文/CSS 注入各一套）、体积也翻倍。
    // 声明过的包由宿主保证「先于消费方到达」，见 package.json 的 dsh.client.inject。
    external: ["react", "@deepseek-ai/*"],
    minify: MINIFY,
    sourcemap: false,
    legalComments: "none",
    logLevel: "warning",
  });

  const body = result.outputFiles[0].text.trimEnd();
  return [
    "// T专家 client bundle — 由 build-client.mjs（运维目录）生成，勿手改。",
    "window.__ModuleLoader__.load({",
    `  id: ${JSON.stringify(PKG.name)},`,
    "  factory: (require) => {",
    "    var module = { exports: {} };",
    "    var exports = module.exports;",
    body,
    "    return module.exports;",
    "  }",
    "});",
    "",
  ].join("\n");
}

/**
 * 把 `src/client/state.js` 里的 `CLIENT_BUILD_VERSION` 对齐到 `package.json` 的 version。
 *
 * 版本号本该只有一个来源，但客户端产物要把版本印在设置页标题行，源码里就多了一份**手工维护**
 * 的副本 —— 0.3.91 那次正是漏改了它：发布预检时 `package.json` 与源码都还是旧值、两者一致，
 * 所以门禁全绿；等 `npm version` 把 `package.json` 改掉、`prepublishOnly` 再跑 build + verify
 * 时才炸，而那时 tag 已经推上去了，落成「远端有 tag、registry 上没有包」的分裂。所以在这里
 * 以 `package.json` 为准自动对齐：只改那一行，其余内容原样写回。
 *
 * **不要**把这段挪进 `renderClientBundle()` —— verify 靠它做纯渲染来比对产物新鲜度，
 * 自检期间绝不允许改动被测仓库。
 *
 * @returns `{ from, to }`（确实改了）；`null` 表示本来就一致，或源码里找不到那一行
 *（找不到时交给 verify 去响亮地报，这里不静默"修好"）。
 */
export async function syncClientVersion() {
  const PKG = JSON.parse(await readFile(join(HERE, "package.json"), "utf8"));
  const file = join(HERE, "src", "client", "state.js");
  const text = await readFile(file, "utf8");
  const pattern = /(export const CLIENT_BUILD_VERSION = ")([^"]*)(";)/u;
  const found = pattern.exec(text);
  if (found === null || found[2] === PKG.version) return null;
  await writeFile(file, text.replace(pattern, `$1${PKG.version}$3`), "utf8");
  return { from: found[2], to: PKG.version };
}

/** 把产物写到 lib/client.js。 */
export async function writeClientBundle() {
  // 先对齐版本号再打包：产物里那份版本号会印在设置页标题行上，落后一版就没法凭截图判断
  //「用户跑的是新构建还是旧构建」——那正是这行字存在的理由。
  await syncClientVersion();
  const envelope = await renderClientBundle();
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, envelope, "utf8");
  // 返回**字节数**：这份产物里有大量中文（CSS / 文案 / 注释），而 JS 字符串的 `.length`
  // 是 UTF-16 码元数 —— 拿它当"字节"报出去会比实际小两千多（曾如此，大小对不上）。
  return Buffer.byteLength(envelope);
}

/**
 * 本脚本是**被直接执行**的，还是只被 import（如 verify 取 renderClientBundle）？
 *
 * 两边都必须过 realpath 再比：路径里带符号链接时（工作区放在 /tmp 下、或仓库经软链访问），
 * `process.argv[1]` 是字面路径而 `import.meta.url` 已被解析成真实路径，直接比字符串会判成
 * "不是直接执行" —— 于是 `node <绝对路径>/build-client.mjs` **一行不输出、退出码 0**，
 * 运维台却以为"构建成功"。2026-09-26 在临时克隆里实测踩到（/tmp → /private/tmp）。
 */
function isDirectRun() {
  if (process.argv[1] === undefined) return false;
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  const synced = await syncClientVersion();
  if (synced !== null) {
    console.log(`已把 src/client/state.js 的构建版本 ${synced.from} → ${synced.to}（对齐 package.json 的 version）`);
  }
  const size = await writeClientBundle();
  console.log(`已生成 ${OUT}（${size} 字节，react 外部化，zod 已内联）`);
}
