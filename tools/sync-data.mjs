#!/usr/bin/env node
/**
 * 把运行时数据目录快照进包内 `data/`，让插件自包含：
 * 陌生机器 `dsh plugin add` 之后，插件首次启动就能从包内快照播种出一份可用名册，
 * 不需要作者本机的任何脚本、同步流程或目录布局。
 *
 * 用法：
 *   node ~/web/t-team/sync-data.mjs                     # 从默认源目录同步到 data/
 *   node ~/web/t-team/sync-data.mjs --from ~/.t-team    # 指定源目录
 *   node ~/web/t-team/sync-data.mjs --check             # 只校验快照是否与源一致（verify 用）
 *
 * 源目录默认取 $T_TEAM_DATA，其次 ~/.t-team。它必须含 `experts/`。
 *
 * `--check` 的**源缺失**语义：源目录不存在时打印「已跳过」并退 0（而不是报错退 1）——
 * 源只存在于维护者机器上，干净 clone / CI runner 上必然没有它；把「没有源」报成
 * 「快照不一致」会让 CI 的那一步永远红（详见 run() 里的注释）。同步模式仍然响亮失败。
 *
 * 快照内容（白名单，不复制同步工具，运行时不需要它们）：
 *   experts/              上游专家镜像（逐字节）
 *   zh/                   中文侧车（名字/简介/正文/分区标签/人工补译）
 *   source.json           名册来源指纹（路径已脱敏）
 *
 * 脱敏：`/Users/<名>` 与 `/home/<名>` 一律写成 `<home>`，只作用于两个元数据 JSON，
 * 不动 `experts/`、`zh/**` 这些内容文件（它们里的示例路径是内容的一部分）。
 */
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MANIFEST_NAME } from "../lib/bootstrap.js";

// 定位仓库根（D-2 起本脚本住在仓库内的 tools/）：上一级就是包根；兼容旧的"同级运维目录"布局。
const SELF_DIR = dirname(fileURLToPath(import.meta.url));
const REPO = process.env.T_TEAM_REPO
  ?? (existsSync(join(SELF_DIR, "..", "lib", "index.js")) ? resolve(SELF_DIR, "..") : resolve(SELF_DIR, "dsh-expert"));

/** 目录白名单：整树复制。 */
const DIRS = ["experts", "zh"];
/** 必须存在的标志性条目（缺了说明源目录不是数据目录）。 */
const REQUIRED = ["experts"];
/** 复制时跳过的垃圾；同步记录由运行时写入数据目录，**不是名册内容**，绝不能当快照搬进包里。 */
const JUNK = new Set([
  ".DS_Store", "__pycache__", ".git", MANIFEST_NAME,
  // 附件下载器写在专家包根的状态标记（`lib/fetch-assets.js` 的 ASSETS_MARKER）：
  // 它是**本机运行时状态**，不是名册内容，绝不能进快照（2026-09-29 实测：
  // 每个下载过的专家都会多出一条「缺失 experts/<分区>/<slug>/.assets.json」把发布挡住）。
  ".assets.json",
]);
/** 一律跳过的扩展名。 */
const JUNK_EXT = [".pyc", ".pyo"];
/** 路径脱敏规则。 */
const HOME_RE = /\/(?:Users|home)\/[^/"\s]+/gu;
/** 需要脱敏的元数据文件（相对路径）。 */
const SANITIZE = new Set(["source.json", "zh/COVERAGE.json"]);
/**
 * 名册清单（`source.json`）必须有的字段 —— 与 `add-expert.py` 的 `update_source_json()` 同一 schema。
 * 两处写同一个文件，字段名漂移过一次（本文件曾合成 `{source,target,syncedAt}`），所以这里显式校验。
 */
const SOURCE_KEYS = ["updatedAt", "expertFiles", "divisions", "note"];

/**
 * 校验一份名册清单文本，缺字段或非法就**大声失败**（不写半成品）。
 * @param text - JSON 文本。
 * @param label - 出错信息里用的来源标签。
 * @returns 解析后的对象。
 */
function assertRosterManifest(text, label) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} 不是合法 JSON：${String(error)}`);
  }
  const absent = SOURCE_KEYS.filter((key) => data?.[key] === undefined);
  if (absent.length > 0) {
    throw new Error(`${label} 缺字段 ${absent.join(", ")}（名册清单的 schema 由 add-expert.py 定义，必须一致）`);
  }
  if (!Number.isInteger(data.expertFiles) || !Array.isArray(data.divisions) || data.divisions.length === 0) {
    throw new Error(`${label} 的 expertFiles/divisions 不是可用值：expertFiles=${data.expertFiles}，divisions=${data.divisions.length}`);
  }
  return data;
}

function parseArgs(argv) {
  const options = { from: process.env.T_TEAM_DATA ?? join(homedir(), ".t-team"), out: join(REPO, "data"), check: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--check") options.check = true;
    else if (arg === "--from") options.from = resolve(argv[++index] ?? "");
    else if (arg === "--out") options.out = resolve(argv[++index] ?? "");
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error(`未知参数：${arg}`);
  }
  return options;
}

function sanitize(text) {
  return text.replace(HOME_RE, "<home>");
}

function skip(name) {
  return JUNK.has(name) || JUNK_EXT.some((ext) => name.endsWith(ext));
}

/** 收集源目录里应当进快照的文件，返回相对路径列表。 */
function collectFiles(source) {
  const files = [];
  const walk = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (skip(entry.name)) continue;
      const full = join(dir, entry.name);
      const rel = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      if (entry.isDirectory()) walk(full, rel);
      else if (entry.isFile()) files.push(rel);
    }
  };
  for (const dir of DIRS) {
    if (existsSync(join(source, dir))) walk(join(source, dir), dir);
  }
  if (existsSync(join(source, "source.json"))) files.push("source.json");
  return files.sort();
}

/** 读一个快照文件的内容（对元数据 JSON 先脱敏）。 */
function contentOf(source, rel) {
  const raw = readFileSync(join(source, rel), "utf8");
  return SANITIZE.has(rel) ? sanitize(raw) : raw;
}

function hashOf(text) {
  return createHash("sha256").update(text).digest("hex");
}

/**
 * 顶层入口：任何抛错（schema 校验、IO）都折成一行 stderr + 退出码 1 ——
 * 宁可什么都不写，也不要留下一个半成品快照。
 * @returns 进程退出码。
 */
/**
 * 返回一个判据：某个相对路径是否属于「已上云的附件」。
 *
 * 附件云端分发（2026-09-29）之后，运行时目录里仍留着这些文件、而包内快照里没有 ——
 * 这是**设计如此**，不是漂移。`--check` 必须放过它们，否则每次 `npm publish` 都会在这里
 * 退 1，把发布整个挡住（实测被挡过一次）。清单读不到时退化成老行为。
 */
function cloudAssetPredicate() {
  const prefixes = [];
  try {
    const roster = JSON.parse(readFileSync(join(REPO, "data", "roster.json"), "utf8"));
    for (const info of Object.values(roster?.packs ?? {})) {
      for (const dir of info.dirs ?? []) {
        prefixes.push(`experts/${info.division}/${info.slug}/${dir}/`);
      }
    }
  } catch {
    return () => false;
  }
  return (rel) => prefixes.some((prefix) => rel.startsWith(prefix));
}

function main() {
  try {
    return run();
  } catch (error) {
    process.stderr.write(`同步失败：${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

function run() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    process.stdout.write(readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0].replace(/^\/\*\*?/u, ""));
    return 0;
  }

  if (!existsSync(options.from)) {
    // `--check` 是**门禁**，而源数据（`~/.t-team`）本来就只存在于维护者机器上：干净 clone 与
    // CI runner 上永远没有它。旧实现不分模式一律 `return 1`，于是 CI 的「Packaged data is in
    // sync」那一步**必然红** —— 一个永远红的门禁等于没有门禁，还会训练人忽略红色。
    // 这里按 verify 的 skip 语义处理：**明确说出「已跳过」并退 0**，不把「没有可比对的源」
    // 伪装成「快照不一致」（两者要采取的行动完全不同）。
    //
    // 同步（非 --check）模式仍然**响亮失败**：那时用户是要真的写快照，没有源就没法写、
    // 也不该凭空合成一份。
    if (options.check) {
      process.stdout.write(`已跳过：源数据目录不存在（${options.from}）—— 本次没有可比对的源，未做一致性判定\n`);
      return 0;
    }
    process.stderr.write(`源数据目录不存在：${options.from}\n`);
    return 1;
  }
  const missing = REQUIRED.filter((item) => !existsSync(join(options.from, item)));
  if (missing.length > 0) {
    process.stderr.write(`源目录不像数据目录（缺 ${missing.join(", ")}）：${options.from}\n`);
    return 1;
  }

  const files = collectFiles(options.from);

  if (options.check) {
    // 已上云的附件**本来就不该在包内**（2026-09-29 附件云端分发）：运行时目录里它们还在，
    // 包内快照里没有 —— 不排除掉的话，每次发布都会在这里退 1，把发布整个挡住。
    const cloudOnly = cloudAssetPredicate();
    const changed = [];
    for (const rel of files) {
      if (cloudOnly(rel)) continue;
      const want = hashOf(contentOf(options.from, rel));
      const target = join(options.out, rel);
      const got = existsSync(target) ? hashOf(readFileSync(target, "utf8")) : null;
      if (got !== want) changed.push(got === null ? `缺失 ${rel}` : `差异 ${rel}`);
    }
    // 反向：快照里多出来的文件（源已删除）
    const extra = [];
    for (const rel of collectFiles(options.out)) {
      if (!files.includes(rel)) extra.push(rel);
    }
    for (const item of [...changed, ...extra.map((rel) => `多余 ${rel}`)]) {
      process.stdout.write(`${item}\n`);
    }
    if (changed.length === 0 && extra.length === 0) {
      process.stdout.write(`快照与源一致（${files.length} 个文件）\n`);
      return 0;
    }
    process.stderr.write(`快照与源不一致：${changed.length} 项待更新、${extra.length} 项多余 —— 跑 node ~/web/t-team/sync-data.mjs\n`);
    return 1;
  }

  // 重建目标目录（只删自己管的顶层条目，避免误删开发文件）
  mkdirSync(options.out, { recursive: true });
  for (const dir of DIRS) rmSync(join(options.out, dir), { recursive: true, force: true });
  rmSync(join(options.out, "source.json"), { force: true });

  for (const dir of DIRS) {
    const from = join(options.from, dir);
    if (!existsSync(from)) continue;
    cpSync(from, join(options.out, dir), {
      recursive: true,
      filter: (src) => !skip(basename(src)),
    });
  }

  // source.json：有就脱敏搬过来（**逐字节**，不改格式，否则 --check 会永久报差异）；
  // 没有就用与 add-expert.py 相同 schema 合成一份。两条路都必须先过 schema 校验，
  // 缺字段/非法值一律抛错 → main() 打印并退出 1，不产出半成品快照。
  const sourcePath = join(options.out, "source.json");
  if (existsSync(join(options.from, "source.json"))) {
    const text = sanitize(readFileSync(join(options.from, "source.json"), "utf8"));
    assertRosterManifest(text, `${options.from}/source.json`);
    writeFileSync(sourcePath, text);
  } else {
    const divisions = readdirSync(join(options.from, "experts"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !skip(entry.name))
      .map((entry) => entry.name)
      .sort();
    // 专家条目数：`experts/<分区>/<slug>.md`（单文件形态）与
    // `experts/<分区>/<slug>/` 且含 .codebuddy-plugin/plugin.json（目录形态专家包）
    // 各算 1 个。**不能数所有 .md**——专家包内部的 agents/*.md、skills/**/SKILL.md
    // 都会被数进去，让这个数字失去意义。
    let expertFiles = 0;
    const expertsRoot = join(options.from, "experts");
    if (existsSync(expertsRoot)) {
      for (const div of readdirSync(expertsRoot, { withFileTypes: true })) {
        if (!div.isDirectory() || skip(div.name)) continue;
        const divPath = join(expertsRoot, div.name);
        for (const entry of readdirSync(divPath, { withFileTypes: true })) {
          if (entry.isFile() && entry.name.endsWith(".md")) expertFiles += 1;
          else if (entry.isDirectory()
            && existsSync(join(divPath, entry.name, ".codebuddy-plugin", "plugin.json"))) expertFiles += 1;
        }
      }
    }
    const manifest = `${JSON.stringify({
      updatedAt: new Date().toISOString().slice(0, 19).replace("T", " ") + " +0000",
      expertFiles,
      divisions,
      note: "本仓名册清单：data/experts 是真源（源数据目录没有 source.json，由 sync-data.mjs 合成）",
    }, null, 2)}\n`;
    assertRosterManifest(manifest, "sync-data.mjs 合成的 source.json");
    writeFileSync(sourcePath, manifest);
  }

  // zh/COVERAGE.json 也可能带生成环境路径，写回脱敏版本
  const coverage = join(options.out, "zh/COVERAGE.json");
  if (existsSync(coverage)) writeFileSync(coverage, sanitize(readFileSync(coverage, "utf8")));

  const count = (dir) => {
    let total = 0;
    const walk = (current) => {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        if (skip(entry.name) && entry.isDirectory()) continue;
        if (entry.isDirectory()) walk(join(current, entry.name));
        else if (!skip(entry.name)) total += 1;
      }
    };
    if (existsSync(dir)) walk(dir);
    return total;
  };
  const bytes = (p) => {
    const info = statSync(p, { throwIfNoEntry: false });
    return info === undefined ? 0 : info.size;
  };
  let size = 0;
  for (const rel of collectFiles(options.out)) size += bytes(join(options.out, rel));

  const strays = collectFiles(options.out).filter((rel) => /(?:^|\/)(?:Users|home)\//u.test(rel));
  process.stdout.write([
    `源目录   : ${options.from}`,
    `快照目录 : ${relative(process.cwd(), options.out) || options.out}`,
    `专家文件 : ${count(join(options.out, "experts"))}`,
    `中文侧车 : ${count(join(options.out, "zh"))}`,
    `总文件   : ${collectFiles(options.out).length}（约 ${(size / 1024 / 1024).toFixed(1)} MB）`,
    strays.length === 0 ? "脱敏检查 : 通过（无本机路径残留）" : `脱敏检查 : 失败 ${strays.length} 项`,
    "",
  ].join("\n"));
  return strays.length === 0 ? 0 : 1;
}

process.exitCode = main();
