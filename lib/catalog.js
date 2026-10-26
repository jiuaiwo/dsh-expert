// @ts-check
/**
 * T专家 花名册：扫描固定专家目录，解析 frontmatter，按 slug 建立索引。
 *
 * 目录形态固定为 `<root>/<division>/<slug>.md`，
 * 其中 game-development 之类的分区可以再嵌套一层子目录（递归扫描）。
 * persona 正文在召唤时按需读取，不在目录列表阶段预加载。
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync } from "node:fs";
import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

/**
 * 名册本体：`Map<slug, Expert>`，另外挂上扫描诊断与分类表。
 *
 * 之所以是 Map 加属性而不是 `{bySlug, ...}`：调用方（`lib/index.js`、测试）大量直接
 * `catalog.get(slug)` / `catalog.size` / 迭代，保持 Map 形态的改动面最小。
 * @typedef {Map<string, any> & {
 *   divisions: string[],
 *   rosterDivisions: string[],
 *   customDivisions: string[],
 *   customRoot: string | undefined,
 *   customLabels: Record<string, string>,
 *   sidecarPresent: boolean,
 *   skippedFiles: number,
 *   unreadableDivisions: string[],
 *   labels: Record<string, string>,
 * }} CatalogMap
 */

/** 分区显示名（面板里用；缺省回退分区 key）。 */
export const DIVISION_LABEL = {
  academic: { zh: "学术", en: "Academic" },
  design: { zh: "设计", en: "Design" },
  engineering: { zh: "工程", en: "Engineering" },
  finance: { zh: "金融", en: "Finance" },
  "game-development": { zh: "游戏开发", en: "Game Development" },
  gis: { zh: "GIS", en: "GIS" },
  healthcare: { zh: "医疗健康", en: "Healthcare" },
  marketing: { zh: "营销", en: "Marketing" },
  "paid-media": { zh: "付费媒体", en: "Paid Media" },
  product: { zh: "产品", en: "Product" },
  "project-management": { zh: "项目管理", en: "Project Management" },
  research: { zh: "研究", en: "Research" },
  sales: { zh: "销售", en: "Sales" },
  security: { zh: "安全", en: "Security" },
  "spatial-computing": { zh: "空间计算", en: "Spatial Computing" },
  specialized: { zh: "专项", en: "Specialized" },
  support: { zh: "支持", en: "Support" },
  testing: { zh: "测试", en: "Testing" },
  /** 用户自建专家的分区（customRoot 下的默认分区），面板里与官方 22 个分区并列但可一眼分辨。 */
  custom: { zh: "自定义", en: "Custom" },
};

/**
 * 取分类显示名：优先侧车目录 zh/divisions.json（数据驱动，新增分类只需补数据），
 * 其次内置对照表，最后回退分区 key。
 */
export function divisionOf(division, labels) {
  const custom = labels?.[division];
  if (typeof custom === "string" && custom !== "") return { zh: custom, en: custom };
  if (custom !== undefined && typeof custom === "object") {
    return { zh: custom.zh ?? division, en: custom.en ?? division };
  }
  return DIVISION_LABEL[division] ?? { zh: division, en: division };
}

/** 读侧车分区标签：{ "<division>": "中文名" | { zh, en } }。 */
export async function loadDivisionLabels(zhRoot) {
  if (typeof zhRoot !== "string" || zhRoot === "") return {};
  return await readJson(join(zhRoot, "divisions.json"));
}

/**
 * 自动发现分区：root 下所有直接含 .md 的顶层目录。
 * 这样新增的分类不必改代码就能被扫描到。
 */
export async function discoverDivisions(root) {
  const report = { found: [], unreadable: [], rootError: undefined };
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    report.rootError = error;
    return report;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    let files;
    try {
      files = await readdir(join(root, entry.name), { withFileTypes: true });
    } catch (error) {
      // 分区目录读不动 —— 过去这里 `.catch(() => [])` 把它当成「没有 .md 的空分区」丢掉，
      // 于是该分区整批专家静默缺席（单个分区不可读即可让名册 316→244，见 D-18）。
      report.unreadable.push({ division: entry.name, error });
      continue;
    }
    // 分区有效 = 含单文件形态的专家（`*.md`）或目录形态的专家包（`<slug>/`）。
    let valid = files.some((f) => f.isFile() && f.name.endsWith(".md"));
    if (!valid) {
      for (const f of files) {
        if (!f.isDirectory() || f.name.startsWith(".")) continue;
        if (await isExpertPack(join(root, entry.name, f.name))) { valid = true; break; }
      }
    }
    if (valid) report.found.push(entry.name);
  }
  report.found.sort();
  return report;
}

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,127}$/;
const SEGMENT_PATTERN = /^[a-z0-9][a-z0-9.-]{0,127}$/;

/** 去掉 BOM，统一换行，避免解析抖动。 */
export function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** 去掉 YAML 标量两端的引号。 */
export function unquote(value) {
  const text = String(value ?? "").trim();
  if (text.length >= 2 && ((text.startsWith('"') && text.endsWith('"')) || (text.startsWith("'") && text.endsWith("'")))) {
    return text.slice(1, -1);
  }
  return text;
}

/** 从 frontmatter 文本里取一个标量字段。 */
function field(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}\\s*:\\s*(.*)$`, "m"));
  return match === null ? undefined : unquote(match[1]);
}

/** 解析 frontmatter 元数据（name/nameEn/description/descriptionEn/emoji/color/vibe）。 */
export function parseMetadata(frontmatter) {
  return {
    name: field(frontmatter, "name"),
    // 内置名册的英文名就是 name（英文原文），只有自建专家会单独写 nameEn；
    // 不解析它的话，自建专家的英文名落盘却读不回来，重名校验与英文locale 都会失效。
    nameEn: field(frontmatter, "nameEn"),
    description: field(frontmatter, "description"),
    descriptionEn: field(frontmatter, "descriptionEn"),
    emoji: field(frontmatter, "emoji"),
    color: field(frontmatter, "color"),
    vibe: field(frontmatter, "vibe"),
  };
}

/** 解析完整文件：frontmatter + 正文。 */
export function parseFrontmatter(raw) {
  const match = stripBom(raw).match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (match === null) return undefined;
  return { ...parseMetadata(match[1]), body: match[2].trim() };
}

/** 中和 `{{` 双花括号，避免 persona 正文被当成模板插值。 */
export function sanitize(text) {
  return text.replace(/\{(?=\{)/g, "{\u200b");
}

/** 单次截断，用于列表里的简介。 */
export function truncate(text, limit) {
  const value = String(text ?? "");
  return value.length > limit ? `${value.slice(0, Math.max(0, limit - 1))}…` : value;
}

/** 目录形态专家包的约定：这两个文件同时存在才算一个专家包。 */
const PACK_MARKER = join(".codebuddy-plugin", "plugin.json");
const PACK_PERSONA = "persona.md";

/**
 * 目录是否是「专家包」（目录形态的专家）。
 *
 * 用 `.codebuddy-plugin/plugin.json` 作识别标志：单文件形态的专家
 * （`<division>/<slug>.md`）不带这个目录，两种形态互不干扰。
 */
async function isExpertPack(dir) {
  return (await isFile(join(dir, PACK_MARKER))) && (await isFile(join(dir, PACK_PERSONA)));
}

/** `isExpertPack` 的同步版 —— 提示段的规模计算是同步的，用不了 fs/promises。 */
function isExpertPackSync(dir) {
  return existsSync(join(dir, PACK_MARKER)) && existsSync(join(dir, PACK_PERSONA));
}

/** 递归数一个分区目录下的专家条目（遇到专家包就剪枝）。供 `countExperts` 使用。 */
function countExpertEntries(dir) {
  let count = 0;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      // 剪枝：包内的 agents/*.md、skills/**/SKILL.md 都是附件，一位专家都不算。
      if (isExpertPackSync(path)) count += 1;
      else count += countExpertEntries(path);
    } else if (entry.name.endsWith(".md")) {
      count += 1;
    }
  }
  return count;
}

/**
 * 同步数名册里的**专家条目**（注意不是 `.md` 总数），口径与 `walkMarkdown` 严格一致：
 * `<分区>/<slug>.md`、`<分区>/<子目录>/<slug>.md` 各算 1 位；目录形态专家包算 1 位且不递归进去。
 *
 * 为什么单独有这么一个同步函数：提示段里那句「a N-expert, M-division roster」是在
 * systemPrompt 的 `text()` 里**同步**生成的，没法 await 一遍 `loadCatalog`。
 *
 * 2026-09-29 的教训：旧实现在别处直接 `readdirSync(root, {recursive:true})` 数所有 `.md`，
 * 于是 645 位被数成 6838 位（附件里的 agents/*.md、SKILL.md 全算成了专家）。当时包内快照与
 * 运行时目录**恰好都错得一样**，而自检断言比的正是「两者相等」，所以一路绿灯；直到附件上云、
 * 包内快照瘦身，两边口径才分叉并把这个问题暴露出来。
 *
 * @param root - 名册目录（包内快照或用户数据目录）。
 * @returns 规模；目录读不到时 `experts` 为 0（调用方据此改用不带数字的说法，而不是报 0 位）。
 */
export function countExperts(root) {
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return { experts: 0, divisions: 0 };
  }
  const divisions = entries.filter((entry) => entry.isDirectory()).length;
  let experts = 0;
  for (const entry of entries) {
    if (entry.isDirectory()) experts += countExpertEntries(join(root, entry.name));
  }
  return { experts, divisions };
}

/**
 * 递归收集目录下的 .md 文件（跳过符号链接，与 DSH 的扫描口径一致）。
 *
 * 遇到专家包目录时**剪枝**：整体交给 `onPack` 处理，不再往下递归——否则包内
 * `skills` 下的 SKILL.md、`references/*.md` 会被当成一堆独立专家扫进名册。
 *
 * 读目录失败**不再静默返回**：整个分区不可读时（EACCES 等）那批专家会**悄悄**从名册里消失
 * ——实测单个分区不可读就能让 316 位掉到 244 位且零日志（D-18）。现在错误带路径抛给调用方，
 * 由调用方逐分区记 warn，名册照旧返回其余可读的部分。
 * @param dir - 要递归的目录。
 * @param onFile - 每个 .md 文件的回调 `(fullPath, fileName)`。
 * @param onPack - 专家包目录的回调 `(packDir, dirName)`；省略时不识别专家包（兼容旧调用）。
 */
async function walkMarkdown(dir, onFile, onPack) {
  const entries = await readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (onPack !== undefined && (await isExpertPack(full))) {
        await onPack(full, entry.name);
        continue;
      }
      await walkMarkdown(full, onFile, onPack);
    } else if (entry.isFile() && entry.name.endsWith(".md")) await onFile(full, entry.name);
  }
}

/** 只读前置检查：根目录必须存在且是目录。 */
export async function assertDirectory(root) {
  const info = await stat(root).catch(() => undefined);
  if (info === undefined) throw new Error(`专家目录不存在：${root}`);
  if (!info.isDirectory()) throw new Error(`专家目录不是目录：${root}`);
}

/**
 * 载入花名册。
 *
 * 两个根：`root` 是随包发布的内置名册（**只读**，由 add-expert.py 维护）；`options.customRoot`
 * 是用户自建专家的独立目录（默认 `~/.t-team/custom`）。两者必须分开——内置根是破坏性镜像，
 * 放进去的自建专家会在下次同步时被当成"意外文件"删掉（2026-09-12 实测）。
 *
 * @param root 内置专家根目录
 * @param divisions 要扫描的分区目录名
 * @returns Map<slug, Expert>，Expert 额外带 personaPath（正文按需读取）
 */
export async function loadCatalog(root, divisions, options = {}) {
  await assertDirectory(root);
  const zhRoot = typeof options.zhRoot === "string" && options.zhRoot !== "" ? options.zhRoot : undefined;
  const customRoot = typeof options.customRoot === "string" && options.customRoot !== "" ? options.customRoot : undefined;
  /** 宿主 logger（可选）：所有「本该说话却过去没说」的地方都走它，不再 console（N-3）。 */
  const logger = options.logger;
  const warn = (message) => logger?.warn?.(message);
  // 中文侧车目录：names.json / descriptions.json / <与 experts 同相对路径的 .md>。
  // 译文永不写进 experts（那是随包发布的只读名册），所以名册更新不受影响。
  // 侧车缺失是**自洽的错配**（它由 seedData 播种、路径来自 Config.zhRoot），必须可观察：
  // 过去这里静默变成「全英文名册」，面板与工具都不报错（D-5）。
  // 侧车「可用」= 目录存在**且**至少有一个内容锚点（names/descriptions/divisions/manual/manual-bodies
  // 或任一分区目录）。只看目录存在是不够的：一个锚点都没有时中文名/简介会全空却什么都不说 ——
  // 正是 D-5 要消灭的静默降级。（2026-09-13 起 seedData 按**条目**同步，空目录会被逐文件补齐，
  // 所以这里判的是「补齐之后仍无可用侧车」，而不是「播种跳过了」。）
  const sidecarDirExists = zhRoot === undefined ? true : await isDirectory(zhRoot);
  const sidecarAnchor = zhRoot === undefined || !sidecarDirExists
    ? undefined
    : await firstExisting([
      join(zhRoot, "names.json"),
      join(zhRoot, "descriptions.json"),
      join(zhRoot, "divisions.json"),
      join(zhRoot, "manual.json"),
      join(zhRoot, "manual-bodies"),
    ]);
  const sidecarPresent = zhRoot === undefined || (sidecarDirExists && sidecarAnchor !== undefined);
  if (zhRoot !== undefined && !sidecarDirExists) {
    warn(`[t-team] 中文侧车目录不存在：${zhRoot}（中文名/简介/分类标签会全部回退英文；跑一次首启播种或把 zhRoot 指到正确位置）`);
  } else if (zhRoot !== undefined && !sidecarPresent) {
    warn(`[t-team] 中文侧车目录存在但没有任何内容（缺少 names.json/descriptions.json 等）：${zhRoot}`
      + `（中文名/简介/分类标签会全部回退英文；删掉这个空目录让插件下次启动重新播种）`);
  }
  const zhNames = zhRoot === undefined || !sidecarPresent ? {} : await readJson(join(zhRoot, "names.json"));
  const zhDescriptions = zhRoot === undefined || !sidecarPresent ? {} : await readJson(join(zhRoot, "descriptions.json"));
  const divisionLabels = sidecarPresent ? await loadDivisionLabels(zhRoot) : {};
  // 自建分类的显示名表（键 = 声明过的自建分类）；官方标签优先级更高，见文件末尾的合并处。
  const customLabels = await loadCustomLabels(customRoot);
  // 未显式配置分类时自动发现：新增分类无需改代码。
  // 发现结果一律按 isValidDivision 过一遍，**列表与扫描共用同一份过滤结果** ——
  // 否则目录名不合规时会出现「分区名在列表里、专家却一个都没扫到」的空分区（已实测）。
  // 显式配置了 divisions 就不自动发现；否则用发现结果，并把「读不动的分区」报出来（D-18）。
  const discovery = divisions !== undefined && divisions.length > 0 ? undefined : await discoverDivisions(root);
  if (discovery?.rootError !== undefined) {
    warn(`[t-team] 无法列出专家根目录下的分区：${root}（${String(discovery.rootError)}）`);
  }
  for (const item of discovery?.unreadable ?? []) {
    warn(`[t-team] 分区目录无法读取，该分区专家已全部跳过：${join(root, item.division)}（${String(item.error)}）`);
  }
  const scanned = (divisions !== undefined && divisions.length > 0 ? divisions : discovery.found)
    .filter(isValidDivision);
  /** 读不动的分区（供 host 侧 snapshot 暴露，诊断用）。 */
  const unreadableDivisions = (discovery?.unreadable ?? []).map((item) => item.division);
  /** @type {CatalogMap} 名册本体 + 扫描诊断（见 CatalogMap 的各字段说明）。 */
  const catalog = /** @type {CatalogMap} */ (new Map());

  /**
   * 解析一个 persona 并放进名册；自定义根的额外带 custom 标记与写回路径。
   *
   * 两种来源共用这条路径：单文件形态（`<division>/<slug>.md`）与目录形态的专家包
   * （`<division>/<slug>/persona.md`，由 walkMarkdown 的 onPack 剪枝后交过来）。
   * @param slug - 专家标识：单文件取文件名去 `.md`，专家包取目录名。
   * @param personaPath - 人格文件路径。
   * @param label - 日志里显示的来源：单文件是文件路径，专家包是目录路径。
   */
  async function ingest(fromRoot, division, slug, personaPath, label, isCustom) {
    if (!SLUG_PATTERN.test(slug)) {
      // 名字不合规 → 这位专家不会进名册。过去完全无声（D-18 同类）；降到 debug 是刻意的：
      // 它属于「命名不合规」，不该在正常安装里刷 warn。
      logger?.debug?.(`[t-team] 跳过名称不合规的专家：${label}`);
      return "skipped";
    }
    let raw;
    try {
      raw = stripBom(await readFile(personaPath, "utf8"));
    } catch (error) {
      // 读不到就是这位专家静默缺席的直接原因，必须可见（过去 `catch { return; }` 什么都不说）。
      warn(`[t-team] 读不到专家文件，已跳过：${label}（${String(error)}）`);
      return "skipped";
    }
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (match === null) {
      logger?.debug?.(`[t-team] 跳过没有 frontmatter 的专家文件：${label}`);
      return "skipped";
    }
    const meta = parseMetadata(match[1]);
    if (!meta.name || !meta.description) {
      // 缺 name/description 的专家**不会进名册**，而这是作者最常犯的错 —— 过去零信号。
      warn(`[t-team] 专家文件缺 name 或 description，已跳过：${label}`);
      return "skipped";
    }
    if (catalog.has(slug)) {
      if (isCustom) {
        // 内置优先：自定义目录里出现同名 slug 时保留内置那位，不覆盖也不报冲突。
        warn(`[t-team] 自定义专家与内置专家同 slug，已忽略：${slug}（${label}）`);
        return "skipped";
      }
      warn(`[t-team] slug 冲突，后者覆盖前者：${slug}`);
    }
    const entry = {
      slug,
      name: meta.name,
      nameEn: meta.nameEn ?? meta.name,
      description: meta.description,
      descriptionEn: meta.descriptionEn ?? "",
      emoji: meta.emoji ?? "",
      color: meta.color ?? "",
      vibe: meta.vibe ?? "",
      division,
      personaPath,
      relativePath: relative(fromRoot, personaPath),
      /** 目录形态的专家包带完整附件（skills/references/…），面板与调用方据此区分。 */
      packDir: personaPath === join(dirname(personaPath), PACK_PERSONA) ? dirname(personaPath) : undefined,
    };
    if (isCustom) {
      // 自建专家的名字就是用户写的那一个（通常是中文），不需要侧车译文即可显示中文。
      entry.nameZh = meta.name;
      entry.custom = true;
      entry.customPath = personaPath;
    }
    catalog.set(slug, entry);
  }

  /** 返回值用于把「跳过」计数汇总成一条 warn；逐条 debug 太吵，全静默又看不见。 */
  let skipped = 0;
  const walkInto = async (baseRoot, division, isCustom) => {
    const dir = join(baseRoot, division);
    if (!(await isDirectory(dir))) return;
    try {
      await walkMarkdown(dir, async (filePath, fileName) => {
        const slug = fileName.slice(0, -3);
        if ((await ingest(baseRoot, division, slug, filePath, filePath, isCustom)) === "skipped") skipped += 1;
      }, async (packDir, dirName) => {
        const personaPath = join(packDir, PACK_PERSONA);
        if ((await ingest(baseRoot, division, dirName, personaPath, packDir, isCustom)) === "skipped") skipped += 1;
      });
    } catch (error) {
      // 分区读不动 = 这个分区下的专家整批缺席。这是「无声掉专家」的根源，必须逐分区报出来。
      // 不抛错：其余分区仍然可用，名册照旧返回（降级但可观察）。
      warn(`[t-team] 分区目录无法读取，该分区专家已全部跳过：${dir}（${String(error)}）`);
    }
  };

  for (const division of scanned) await walkInto(root, division, false);

  // 自建专家根：目录可以不存在（还没建过任何自建专家），分区同样自动发现。
  let customDivisions = [];
  if (customRoot !== undefined) {
    const customDiscovery = await discoverDivisions(customRoot);
    for (const item of customDiscovery.unreadable) {
      warn(`[t-team] 自建分区目录无法读取，该分区专家已全部跳过：${join(customRoot, item.division)}（${String(item.error)}）`);
    }
    customDivisions = customDiscovery.found.filter(isValidDivision);
    for (const division of customDivisions) await walkInto(customRoot, division, true);
  }

  if (skipped > 0) warn(`[t-team] 名册加载跳过了 ${skipped} 个专家文件（原因见上面的逐条日志）`);
  if (catalog.size === 0) throw new Error(`专家目录为空或没有可解析的专家：${root}`);
  markConflicts(catalog);
  catalog.divisions = [...scanned, ...customDivisions.filter((item) => !scanned.includes(item))];
  catalog.rosterDivisions = scanned;          // 只来自内置根（官方分类，只读）
  catalog.customDivisions = customDivisions;
  catalog.customRoot = customRoot;
  // 自建分类的显示名表；它的**键**同时就是"声明过的自建分类"——允许空分类（目录里还没有专家）。
  catalog.customLabels = customLabels;
  // 供 host 侧 snapshot() 暴露给面板：侧车缺了、有没有专家因此跳过。
  catalog.sidecarPresent = sidecarPresent;
  catalog.skippedFiles = skipped;
  catalog.unreadableDivisions = unreadableDivisions;
  // 官方标签优先：官方分类的显示名跟随中文侧车，不允许被本机覆盖（2026-09-12 用户选定）。
  catalog.labels = { ...customLabels, ...divisionLabels };
  if (zhRoot !== undefined) {
    for (const expert of catalog.values()) {
      if (expert.custom === true) continue;              // 自建专家不查侧车
      const nameZh = zhNames[expert.slug];
      if (typeof nameZh === "string" && nameZh !== "") expert.nameZh = nameZh;
      const descriptionZh = zhDescriptions[expert.slug];
      if (typeof descriptionZh === "string" && descriptionZh !== "") expert.descriptionZh = descriptionZh;
      const zhPath = join(zhRoot, expert.relativePath);
      if (await isFile(zhPath)) expert.personaPathZh = zhPath;
    }
  }
  return catalog;
}

/**
 * 读 JSON：文件不存在/侧车目录缺省当空对象（正常路径，0.4.7 之前是空 catch 静默吃）；
 * 其他错误（JSON 损坏、读权限、EISDIR 等）出声 + 返回空对象——调用方拿到的 {} 行为不变，
 * 但日志里有了线索，否则用户侧只会表现为"中文名/简介静默变全英文"，无法归因。
 */
async function readJson(path) {
  try {
    const parsed = JSON.parse(await readFile(path, "utf8"));
    return parsed !== null && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn(`[t-team] 读 ${path} 失败，按空对象继续：`, error?.message ?? error);
    }
    return {};
  }
}

/** 返回第一个存在的路径（侧车「有没有内容」的锚点探测）。 */
async function firstExisting(paths) {
  for (const path of paths) {
    if (await isPath(path)) return path;
  }
  return undefined;
}

/** 路径是否存在（文件或目录）。 */
async function isPath(path) {
  const info = await stat(path).catch(() => undefined);
  return info !== undefined;
}

/** 是否为目录（用于「侧车/分区是否存在」的存在性探测）。 */
async function isDirectory(path) {
  const info = await stat(path).catch(() => undefined);
  return info !== undefined && info.isDirectory();
}

/** 是否为普通文件。 */
async function isFile(path) {
  const info = await stat(path).catch(() => undefined);
  return info !== undefined && info.isFile();
}

/**
 * 标记重名专家：同名（含英文名）的两位都无法召唤，避免召唤到错误角色。
 * 冲突项仍留在列表里（面板可见），但解析与召唤会跳过它们。
 */
export function markConflicts(catalog) {
  const owners = new Map();
  for (const expert of catalog.values()) {
    for (const name of new Set([expert.name, expert.nameEn])) {
      const key = normalizeName(name);
      if (key === "") continue;
      const slugs = owners.get(key) ?? new Set();
      slugs.add(expert.slug);
      owners.set(key, slugs);
    }
  }
  for (const slugs of owners.values()) {
    if (slugs.size < 2) continue;
    for (const slug of slugs) {
      const expert = catalog.get(slug);
      if (expert !== undefined) expert.conflict = true;
    }
  }
  return catalog;
}

/**
 * 读取一位专家的 persona 正文（召唤时用）。
 * 中文 locale 下优先用侧车目录里的中文正文，缺失则回退英文。
 */
export async function readPersona(expert, locale = "zh") {
  const zhPath = locale === "zh" ? expert.personaPathZh : undefined;
  const raw = zhPath === undefined
    ? stripBom(await readFile(expert.personaPath, "utf8"))
    : stripBom(await readFile(zhPath, "utf8").catch(() => readFile(expert.personaPath, "utf8")));
  const parsed = parseFrontmatter(raw);
  if (parsed === undefined) return raw.trim();      // 容忍没有 frontmatter 的译文文件
  if (parsed.body === "") throw new Error(`专家提示词格式无效：${expert.relativePath}`);
  return parsed.body;
}

/** 名称归一化，用于解析召唤目标。 */
function normalizeName(value) {
  return String(value ?? "").trim().toLowerCase();
}

/** 导出给写回服务做「重名」校验用（与 resolveExpert 同一口径）。 */
export function normalizedKey(value) {
  return normalizeName(value);
}

// ---------------------------------------------------------------- 自建专家（写回）

/** 自建专家的默认分区目录名（新建时的落点；用户可以在面板里另建分区）。 */
export const CUSTOM_DIVISION = "custom";
/** 自建专家的字段长度上限（校验用，写回前拦，不给面板塞坏数据）。 */
export const CUSTOM_LIMITS = { name: 60, nameEn: 80, description: 240, body: 40000, divisionLabel: 40 };

/**
 * 分区目录名是否合法 —— **与扫描口径完全一致**（`SEGMENT_PATTERN` + 不许 `..`）。
 *
 * 两处必须共用这一个判断：`discoverDivisions()` 发现什么、`loadCatalog()` 就扫什么。
 * 曾经列表用未过滤的结果、扫描用过滤过的结果，于是手建一个中文目录名后，
 * 面板上凭空多出一个零专家的分区（2026-09-12 实测）。非 ASCII 分区名一律不支持：
 * 分区 key 会进 `@` 源 id 与文件路径，ASCII 才和 slug 的口径一致；
 * 中文显示名走 `customDivisions[].label`（落在 `<customRoot>/divisions.json`）。
 */
export function isValidDivision(division) {
  const key = String(division ?? "").trim();
  return SEGMENT_PATTERN.test(key) && !key.includes("..");
}

/** 自建专家的文件路径：`<customRoot>/<division>/<slug>.md`（division 省缺时落默认分区）。 */
export function customExpertPath(customRoot, slug, division = CUSTOM_DIVISION) {
  return join(customRoot, division, `${slug}.md`);
}

/** 自建分区的显示名表：`{ "<division>": "<显示名>" }`（缺文件当空表）。 */
export async function loadCustomLabels(customRoot) {
  if (typeof customRoot !== "string" || customRoot === "") return {};
  const raw = await readJson(join(customRoot, "divisions.json"));
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string" && value.trim() !== "" && isValidDivision(key)) out[key] = value.trim();
  }
  return out;
}

/**
 * 记下一个自建分区的显示名（原子写；label 为空则删除该键）。
 * 面板里「新建分区」填的中文名落在这里，`divisionOf()` 就能把它显示成中文。
 */
export async function saveCustomLabel(customRoot, division, label) {
  if (!isValidDivision(division)) return false;
  const path = join(customRoot, "divisions.json");
  const current = await loadCustomLabels(customRoot);
  const text = String(label ?? "").trim();
  if (text === "") delete current[division];
  else current[division] = text;
  await writeFileAtomic(path, `${JSON.stringify(current, null, 2)}\n`);
  return true;
}

/** slug 是否合法（与扫描口径一致）。 */
export function isValidSlug(slug) {
  return SLUG_PATTERN.test(String(slug ?? ""));
}

/**
 * 写 frontmatter 标量。常规值裸写；以引号/空白/特殊符号开头结尾时加引号。
 * 两端都有半角引号的极端情况把 `"` 换成全角 `”`——保住结构，且没人会把这种名字当标识符用。
 */
function yamlScalar(value) {
  const text = String(value ?? "").replace(/[\r\n]+/g, " ").trim();
  if (text === "") return "";
  if (!/^[\s"']|[\s"']$|^[#\-?:!,&*|>%@`[\]{}]/.test(text)) return text;
  if (!text.includes('"')) return `"${text}"`;
  if (!text.includes("'")) return `'${text}'`;
  return `"${text.replace(/"/g, "”")}"`;
}

/** 把自建专家序列化成文件文本（frontmatter + persona 正文）。 */
export function serializeCustomExpert(fields) {
  const lines = ["---", `name: ${yamlScalar(fields.name)}`];
  if (fields.nameEn) lines.push(`nameEn: ${yamlScalar(fields.nameEn)}`);
  lines.push(`description: ${yamlScalar(fields.description)}`);
  if (fields.descriptionEn) lines.push(`descriptionEn: ${yamlScalar(fields.descriptionEn)}`);
  if (fields.emoji) lines.push(`emoji: ${yamlScalar(fields.emoji)}`);
  lines.push("custom: true");
  lines.push("---", "", String(fields.body ?? "").trim(), "");
  return lines.join("\n");
}

/** 文件内容指纹（并发编辑用：两个窗口改同一位自建专家时，后写的会因指纹不符被拒）。 */
export async function fileFingerprint(path) {
  try {
    return createHash("sha256").update(await readFile(path)).digest("hex").slice(0, 12);
  } catch {
    return "";
  }
}

/** 原子写入：先写临时文件再 rename，避免面板读到半截文件。 */
export async function writeFileAtomic(path, text) {
  await mkdir(dirname(path), { recursive: true });
  const temp = `${path}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temp, text, "utf8");
  await rename(temp, path);
}

/** 删除自建专家文件；文件已不在时返回 false（幂等）。 */
export async function removeCustomExpert(customRoot, slug, division = CUSTOM_DIVISION) {
  const path = customExpertPath(customRoot, slug, division);
  try {
    await unlink(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

/**
 * 去掉 emoji / 标点后的比较形式：面板与 @ 芯片里会带 emoji 与全角空格，
 * 模型也可能把「🗺️ 地理学家」原样传回来，所以比较前摘掉非文字字符。
 */
function cleanName(value) {
  return normalizeName(value).replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s+/g, " ").trim();
}

/** 一位专家所有可用来指名它的键：中文名、英文名、slug。 */
function matchKeys(expert) {
  return [expert.nameZh, expert.name, expert.nameEn, expert.slug].filter((v) => typeof v === "string" && v !== "");
}

/**
 * 解析召唤目标：中文名 / 英文名 / slug 都能用（面板与 @ 芯片传的是中文名，模型也可能带 emoji 回传）。
 * 顺序：全名精确 → 唯一子串；歧义或缺省都给出可操作的报错。
 */
export function resolveExpert(experts, query, locale = "zh") {
  const target = normalizeName(query);
  const targetClean = cleanName(query);
  if (target === "") throw new Error("expert 参数不能为空");
  const display = (expert) => (locale === "en" ? (expert.nameEn || expert.name) : (expert.nameZh || expert.name));
  const isExact = (expert) => matchKeys(expert).some((key) => normalizeName(key) === target || (targetClean !== "" && cleanName(key) === targetClean));
  const exact = experts.filter(isExact);
  if (exact.length === 1) return exact[0];
  const isSubstring = (expert) => matchKeys(expert).some((key) => {
    const normalized = normalizeName(key);
    const cleaned = cleanName(key);
    return normalized.includes(target) || (targetClean.length >= 2 && cleaned.includes(targetClean));
  });
  const matches = exact.length > 1 ? exact : experts.filter(isSubstring);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    const preview = matches.slice(0, 12).map((e) => `${display(e)}(${e.slug})`).join(", ");
    throw new Error(`专家名「${query}」有歧义，候选：${preview}`);
  }
  const samples = experts.slice(0, 8).map((e) => `${display(e)}(${e.slug})`).join(", ");
  throw new Error(`找不到专家「${query}」；可以用中文名、英文名或 slug。可用示例：${samples}`);
}

/** 按分区分组（面板与 list_t_experts 共用）。 */
/** 取该名册的分区清单（loadCatalog 把发现结果挂在返回的 Map 上）。 */
export function catalogDivisions(catalog) {
  return Array.isArray(catalog?.divisions) ? catalog.divisions : [];
}

export function groupByDivision(experts, enabled) {
  const groups = new Map();
  for (const expert of experts) {
    if (enabled !== undefined && !enabled.has(expert.slug)) continue;
    const list = groups.get(expert.division) ?? [];
    list.push(expert);
    groups.set(expert.division, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([division, list]) => ({
      division,
      label: DIVISION_LABEL[division]?.zh ?? division,
      labelEn: DIVISION_LABEL[division]?.en ?? division,
      count: list.length,
      experts: list.slice().sort((a, b) => a.slug.localeCompare(b.slug)),
    }));
}

/** 受限并发映射，结果顺序与输入一致。 */
export async function mapPool(items, concurrency, mapper) {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}
