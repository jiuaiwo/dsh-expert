#!/usr/bin/env node
/**
 * 客户端源码的**未定义标识符**检查（TS2304 / TS2552）。
 *
 * 为什么需要单独一道门禁：客户端源码是 JSX，不参与 `tsconfig.json` 那套 tsc 检查（它只覆盖
 * 自研 host 文件）。而"某个组件引用了**另一个组件**的局部变量"这类错误：
 *   · esbuild **打包不报** —— 它把未知标识符当全局变量，产物照样生成；
 *   · verify 的文本断言抓不到 —— 源码里那几行的文本完全正常；
 *   · SSR 冒烟渲染也抓不到 —— 要等**那个组件真的被渲染**才炸成 ReferenceError。
 * 0.3.49 就把 SummonButton 的浮层 effect 误复制进了 ExpertPicker（引用 `place()` / `popTab`），
 * 于是定时任务点「添加/编辑」整块白屏；0.3.55 只把 effect 主体搬回去、漏删了残留，直到 0.3.69
 * 才清掉 —— 这类漏网正是本脚本要拦的。
 *
 * 判据**只取未定义标识符那一类诊断**，其余（React 类型不全、隐式 any 等）一律忽略：否则这个
 * 门禁会因为噪音永远红，而永远红的门禁等于没有门禁。
 *
 * 退出码：0 = 干净；1 = 有未定义引用（逐条打印文件:行号）。
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SELF_DIR = fileURLToPath(new URL(".", import.meta.url));
const HERE = process.env.T_TEAM_REPO
  ?? (existsSync(join(SELF_DIR, "..", "lib", "index.js")) ? resolve(SELF_DIR, "..") : join(SELF_DIR, "dsh-expert"));
const CLIENT_DIR = join(HERE, "src", "client");

/** 客户端源文件清单（按路径排序，保证输出稳定）。 */
const sources = readdirSync(CLIENT_DIR)
  .filter((name) => /\.jsx?$/u.test(name))
  .sort()
  .map((name) => join(CLIENT_DIR, name));

if (sources.length === 0) {
  process.stderr.write(`客户端源码目录是空的：${CLIENT_DIR}\n`);
  process.exit(1);
}

// ---- 先拦一类"打包必炸、但报错指向别处"的写法：CSS 模板里的裸反引号 ----
//
// css.js 整个 CSS 是 `export const CSS = \`...\`` 的模板字符串，注释里再写一个反引号
// 就会把它提前终止。这个坑 2026-09-28 一次会话里连踩三次（写注释时顺手把
// max-height: 100% / min(380px,100%) / position: relative 用反引号括了起来），
// 而 esbuild 报的是 `Expected ";" but found "max"` 并指向**CSS 内容本身** ——
// 完全看不出是模板字符串被截断。更糟的是它只在真正构建时才炸，
// 而 lib/client.js 是提交进仓库的产物，构建失败意味着产物停在上一版。
// 本脚本在 build / verify / prepublishOnly 里都先跑，放这里拦最靠前。
{
  const cssPath = join(CLIENT_DIR, "css.js");
  const source = readFileSync(cssPath, "utf8");
  const body = source.match(/const CSS = `([\s\S]*)`;/u)?.[1];
  if (body === undefined) {
    process.stderr.write(`没能从 ${cssPath} 里定位 CSS 模板字符串（期望 export const CSS = \`...\`）。\n`);
    process.exit(1);
  }
  const stray = (body.match(/`/gu) ?? []).length;
  if (stray > 0) {
    const line = source.slice(0, source.indexOf(body) + body.search(/`/u)).split(/\r?\n/u).length;
    process.stderr.write(`src/client/css.js 的 CSS 模板里出现裸反引号（${stray} 个，首个约在第 ${line} 行）：\n`);
    process.stderr.write("  整个 CSS 是 export const CSS = `...` 的模板字符串，注释里再写一个反引号会把它提前终止；\n");
    process.stderr.write('  esbuild 会报 Expected ";" but found ... 并指向 CSS 内容本身。改用普通引号或直接去掉。\n');
    process.exit(1);
  }
}

// 本地 tsc 优先；没有就退回 npx（CI 上 npm ci 之后两者都在）。
const localTsc = join(HERE, "node_modules", ".bin", "tsc");
const [command, prefix] = existsSync(localTsc) ? [localTsc, []] : ["npx", ["tsc"]];

const result = spawnSync(command, [
  ...prefix,
  "--noEmit",
  "--allowJs",
  "--checkJs",
  "--jsx", "preserve",
  "--target", "es2022",
  "--module", "esnext",
  "--moduleResolution", "bundler",
  "--skipLibCheck",
  "--lib", "es2023,dom",
  ...sources,
], { cwd: HERE, encoding: "utf8" });

if (result.error !== undefined && result.error !== null) {
  process.stderr.write(`跑不动 tsc：${result.error.message}（先 npm install）\n`);
  process.exit(1);
}
const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
const offenders = output
  .split(/\r?\n/u)
  .filter((line) => /error TS(?:2304|2552):/u.test(line));

if (offenders.length > 0) {
  process.stderr.write(`客户端源码里有未定义的标识符（渲染时才炸，打包与静态断言都拦不住）：\n`);
  for (const line of offenders) process.stderr.write(`  ${line.trim()}\n`);
  process.stderr.write(`通常是引用了**另一个组件**的局部变量 —— 见 ${dirname(CLIENT_DIR)}/client 下对应文件的上下文。\n`);
  process.exit(1);
}

process.stdout.write(`客户端源码未定义标识符检查通过（${sources.length} 个文件，0 处）\n`);
