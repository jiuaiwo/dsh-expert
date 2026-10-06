// @ts-check
/**
 * 启动期同步：把包内自带的名册快照落到可写数据目录，让插件对任何机器都自包含。
 *
 * 背景：T专家 的运行时数据（专家名册、中文侧车）体积不大但必须先存在，
 * 插件才可用。把它们随包发布后，安装即自带一份快照；这里负责在**每次启动**把包内快照与
 * 数据目录对齐，此后由用户自己的数据目录作主。
 *
 * ⚠️ 为什么不再是「首次播种、之后一律不动」（2026-09-13 修）：
 * 旧实现按**整项**判断——目录非空就跳过、文件已存在就跳过——于是升级到新版本时，
 * 包内**新增**的专家/译文、以及包内**修订**过的只读条目，对老安装**永不送达**，
 * 而且一句日志都没有（旧代码只在 `copied.length > 0` 时打印）。这是本项目最典型的一类
 * 恒存缺陷：「同一事实多份副本 + 只在缺失时播种」= 静默过期。
 *
 * 现在的契约（**按条目分类**，不再整项跳过）：
 *   1. **缺失就补**：任何包内条目在数据目录里不存在就复制过去 —— 首次安装、半成品自愈、
 *      升级新增，走的是同一条路径。
 *   2. **只读条目一律对齐**（见 {@link PACKAGE_OWNED_DIRS}/{@link PACKAGE_OWNED_FILES}）：
 *      名册 `experts/`、`source.json`、`zh/` 的覆盖表与分区表
 *      都是**随包发布的只读内容**（`lib/catalog.js` 里也写明 root 只读，自建专家走 customRoot），
 *      安装副本与包内不同就覆盖，并进 `updated` 报告。
 *   3. **键值型用户文件只补键、不改键**（{@link MERGE_FILES}）：`zh/names.json`、
 *      `zh/descriptions.json` 的缺失键从包内补齐 —— 上游新增的译文
 *      因此能到达老安装，而用户改过的键一个都不动。
 *   4. **用户内容绝不覆盖**：`zh/<分区>/<slug>.md` 正文等与包内不同时**保留盘上那份**，
 *      进 `kept` 报告（而不是像旧实现那样静默跳过）。
 *   5. **只报告、不删除**：包内已移除的条目进 `stale`，盘上文件保留。
 *   7. **失败不致命**：只读文件系统、权限不足等导致同步失败时只报告，插件照常加载，
 *      后续会以「读不到名册」的正常错误路径报出来。
 *
 * 「送不到」也必须出声：每次同步都会把结果（新增/对齐/合并/保留/残留 + 快照版本）写进
 * 数据目录根的 {@link MANIFEST_NAME} 同步记录，调用方据此在**状态变化时**告警一次，
 * 而不是每次启动都刷屏。
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** 包内快照目录（`<包根>/data`）。 */
export const SNAPSHOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "data");

/** 同步记录文件名（写在数据目录根，不属于名册内容）。 */
export const MANIFEST_NAME = ".t-team-snapshot.json";

/** 快照里的目录项：`experts` → root，`zh` → zhRoot。 */
const SNAPSHOT_DIRS = ["experts", "zh"];
/** 快照里的文件项：全部落在数据目录（= dirname(root)）下。 */
const SNAPSHOT_FILES = ["source.json"];

/** 只读目录：随包发布、安装副本一律对齐（自建专家在 customRoot，不在这些目录里）。 */
const PACKAGE_OWNED_DIRS = ["experts"];
/** 只读文件：同上。`zh/` 下的两个表是生成物，不是用户译文。 */
const PACKAGE_OWNED_FILES = ["source.json", "zh/COVERAGE.json", "zh/divisions.json"];
/** 键值型用户文件：只补缺失键，绝不改已有键。 */
const MERGE_FILES = ["zh/names.json", "zh/descriptions.json"];
/** 遍历时跳过的垃圾与同步记录本身。 */
const JUNK = new Set([".DS_Store", MANIFEST_NAME]);

/**
 * 同步报告。
 * @typedef {object} SeedReport
 * @property {boolean} ok - 同步是否正常完成（失败不致命，调用方只报告）。
 * @property {string} error - 失败原因（`ok` 为 false 时非空）。
 * @property {string} source - 包内快照目录。
 * @property {string} version - 包内快照所属的插件版本（读包内 package.json）。
 * @property {string} previousVersion - 上次同步记录的版本（首次为 ""）。
 * @property {number} scanned - 本次检查的包内条目数。
 * @property {string[]} copied - 盘上缺失、本次落地的条目。
 * @property {string[]} updated - 只读条目与包内不同、本次对齐的条目。
 * @property {{ rel: string, keys: string[] }[]} merged - 键值型文件本次补齐的键。
 * @property {string[]} kept - 用户内容且与包内不同、**保留未覆盖**的条目。
 * @property {string[]} stale - 盘上有、包内已无的条目（只报告不删除）。
 * @property {number} unchanged - 与包内一致的条目数（含派生产物）。
 * @property {boolean} driftChanged - 与上次记录相比，版本或漂移情况是否变了（决定要不要出声）。
 * @property {string} manifestPath - 同步记录路径。
 * @property {boolean} manifestWritten - 本次是否成功写下同步记录。
 */

/**
 * 递归列出一个目录下的全部文件，返回相对路径（`/` 分隔，跨平台一致）。
 * @param dir - 目录。
 * @param prefix - 递归用的前缀。
 * @returns 相对路径数组。
 */
function listFiles(dir, prefix = "") {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (JUNK.has(entry.name)) continue;
    const rel = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(abs, rel));
    else if (entry.isFile()) out.push(rel);
  }
  return out;
}

/**
 * 包内条目 → 盘上目标路径。映射规则与旧实现一致：`experts/*` → root，`zh/*` → zhRoot，
 * 其余单文件 → 数据目录根。
 * @param snapshotDir - 包内快照目录。
 * @param root - 名册目录。
 * @param zhRoot - 中文侧车目录。
 * @returns 条目数组。
 */
function collectEntries(snapshotDir, root, zhRoot) {
  /** @type {{ rel: string, from: string, to: string }[]} */
  const entries = [];
  /** @type {Record<string, string>} */
  const dirTargets = { experts: root, zh: zhRoot };
  for (const name of SNAPSHOT_DIRS) {
    const from = join(snapshotDir, name);
    if (!existsSync(from)) continue;
    const to = dirTargets[name];
    for (const rel of listFiles(from)) entries.push({ rel: `${name}/${rel}`, from: join(from, rel), to: join(to, rel) });
  }
  const home = dirname(root);
  for (const name of SNAPSHOT_FILES) {
    const from = join(snapshotDir, name);
    if (!existsSync(from)) continue;
    entries.push({ rel: name, from, to: join(home, name) });
  }
  return entries;
}

/**
 * 条目分类决定「不同时怎么办」。
 * @param rel - 相对快照目录的路径。
 * @returns 分类。
 */
function classify(rel) {
  if (PACKAGE_OWNED_FILES.includes(rel)) return "package-owned";
  if (MERGE_FILES.includes(rel)) return "merge";
  for (const dir of PACKAGE_OWNED_DIRS) if (rel.startsWith(`${dir}/`)) return "package-owned";
  return "user";
}

/** 是不是普通 JSON 对象（不是数组、不是 null）。 */
function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 把包内文件里**盘上还没有的键**补进去（已有键一个都不动）。
 *
 * 两处都是真实数据形状：`zh/names.json` / `zh/descriptions.json` 是扁平的
 * `slug → 文案`；不做嵌套合并 —— 合并范围越宽，越容易覆盖用户内容。
 * @param targetText - 盘上那份的文本。
 * @param sourceText - 包内那份的文本。
 * @returns 合并后的文本（无键可补时 `text` 为 undefined）与补齐的键名。
 */
function mergeMissingKeys(targetText, sourceText) {
  /** @type {any} */
  let target;
  /** @type {any} */
  let source;
  try {
    target = JSON.parse(targetText);
    source = JSON.parse(sourceText);
  } catch {
    return { text: undefined, keys: /** @type {string[]} */ ([]) };
  }
  if (!isPlainObject(target) || !isPlainObject(source)) return { text: undefined, keys: /** @type {string[]} */ ([]) };
  /** @type {string[]} */
  const keys = [];
  for (const [key, value] of Object.entries(source)) {
    if (Object.prototype.hasOwnProperty.call(target, key)) continue;
    target[key] = value;
    keys.push(key);
  }
  if (keys.length === 0) return { text: undefined, keys };
  return { text: `${JSON.stringify(target, null, 2)}\n`, keys };
}

/**
 * 盘上有、包内已无的条目（上游删过的专家/译文）。只报告，绝不删除用户盘上的文件。
 * @param snapshotDir - 包内快照目录。
 * @param name - 目录项名（experts / zh）。
 * @param targetDir - 对应的盘上目录。
 * @returns 条目相对路径数组。
 */
function collectStale(snapshotDir, name, targetDir) {
  const from = join(snapshotDir, name);
  if (!existsSync(from) || !existsSync(targetDir)) return [];
  const packaged = new Set(listFiles(from));
  return listFiles(targetDir).filter((rel) => !packaged.has(rel)).map((rel) => `${name}/${rel}`);
}

/**
 * 读上次的同步记录；缺失/损坏都当没有（下次会重新写）。
 * @param path - 同步记录路径。
 * @returns 记录对象或 undefined。
 */
function readManifest(path) {
  try {
    const raw = JSON.parse(readFileSync(path, "utf8"));
    return isPlainObject(raw) ? raw : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 读包内快照所属的插件版本（`<包根>/package.json`）。自检用合成快照时这份可能是假的，
 * 所以只用于「升级可感知」的日志，读不到就是空串。
 * @param snapshotDir - 包内快照目录。
 * @returns 版本号或 ""。
 */
function readPackageVersion(snapshotDir) {
  try {
    const pkg = JSON.parse(readFileSync(join(snapshotDir, "..", "package.json"), "utf8"));
    return typeof pkg?.version === "string" ? pkg.version : "";
  } catch {
    return "";
  }
}

/**
 * 原子写（先写临时文件再 rename）：同步记录与合并后的 JSON 都不能留半截。
 *
 * 临时名带 pid + 时间戳（与 `catalog.js` 的 `writeFileAtomic` 同口径）：两个 DSH 实例
 * 同时首启、对同一个 `~/.t-team/` 播种时，固定的 `<path>.tmp` 会互相覆盖对方的半截写入，
 * 唯一化之后两边各写各的临时文件，rename 才是各自原子的。
 * @param path - 目标路径。
 * @param text - 内容。
 */
function writeFileAtomic(path, text) {
  const tmp = `${path}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tmp, text);
  renameSync(tmp, path);
}

/**
 * 两个文件内容是否逐字节相同。
 *
 * 先比 `size`：大小不同必然内容不同，直接短路 —— 省掉两次全量读取。这条路径命中的是
 * "包内条目被改过 / 用户改过译文正文" 这类**确实有差异**的文件（升级、补译后），
 * 让 seedData 不必把两份都读进内存再逐字节比对才发现它们不一样。
 * 大小相同才回退到全量字节比较（不同内容同长度虽罕见，但必须判准，不能只看 size）。
 */
function sameContent(from, to) {
  try {
    if (statSync(from).size !== statSync(to).size) return false;
    return readFileSync(from).equals(readFileSync(to));
  } catch {
    return false;
  }
}

/**
 * 把包内快照与数据目录对齐。
 * @param options - `root` 名册目录、`zhRoot` 中文侧车目录；`snapshotDir` 仅自检用于合成快照。
 * @returns 同步报告。
 */
export function seedData({ root, zhRoot, snapshotDir = SNAPSHOT_DIR }) {
  const home = dirname(root);
  const manifestPath = join(home, MANIFEST_NAME);
  const previous = readManifest(manifestPath);
  const version = readPackageVersion(snapshotDir);
  /** @type {SeedReport} */
  const report = {
    ok: true,
    error: "",
    source: snapshotDir,
    version,
    previousVersion: typeof previous?.version === "string" ? previous.version : "",
    scanned: 0,
    copied: [],
    updated: [],
    merged: [],
    kept: [],
    stale: [],
    unchanged: 0,
    driftChanged: false,
    manifestPath,
    manifestWritten: false,
  };
  if (!existsSync(snapshotDir)) {
    report.ok = false;
    report.error = `包内快照不存在：${snapshotDir}`;
    return report;
  }

  try {
    mkdirSync(home, { recursive: true });
    const entries = collectEntries(snapshotDir, root, zhRoot);
    report.scanned = entries.length;

    for (const { rel, from, to } of entries) {
      const kind = classify(rel);
      if (!existsSync(to)) {
        mkdirSync(dirname(to), { recursive: true });
        cpSync(from, to);
        report.copied.push(rel);
        continue;
      }
      if (sameContent(from, to)) {
        report.unchanged += 1;
        continue;
      }
      if (kind === "package-owned") {
        cpSync(from, to);
        report.updated.push(rel);
        continue;
      }
      if (kind === "merge") {
        const { text, keys } = mergeMissingKeys(readFileSync(to, "utf8"), readFileSync(from, "utf8"));
        if (text === undefined) report.unchanged += 1;
        else {
          writeFileAtomic(to, text);
          report.merged.push({ rel, keys });
        }
        continue;
      }
      // 用户内容：保留盘上那份，进报告让调用方出声。
      report.kept.push(rel);
    }

    for (const name of SNAPSHOT_DIRS) {
      report.stale.push(...collectStale(snapshotDir, name, name === "experts" ? root : zhRoot));
    }

    report.driftChanged = previous === undefined
      || previous.version !== version
      || previous.kept !== report.kept.length
      || previous.stale !== report.stale.length;

    writeFileAtomic(manifestPath, `${JSON.stringify({
      version,
      at: new Date().toISOString(),
      scanned: report.scanned,
      copied: report.copied.length,
      updated: report.updated.length,
      merged: report.merged.reduce((sum, item) => sum + item.keys.length, 0),
      kept: report.kept.length,
      stale: report.stale.length,
    }, null, 2)}\n`);
    report.manifestWritten = true;
  } catch (error) {
    report.ok = false;
    report.error = error instanceof Error ? error.message : String(error);
  }
  return report;
}
