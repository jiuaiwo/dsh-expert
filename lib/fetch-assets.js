// @ts-check
/**
 * 专家附件的云端分发：从 OBS 下载 tar.gz → 校验 sha256 → 解包回原位。
 *
 * ## 为什么有这个东西
 *
 * 645 位专家里 322 位是「目录形态专家包」，包内附件（`skills/`、`references/`、`Databases/`
 * 等）合计约 292 MB —— 其中 `skills/` 一个目录就占 88%。全部随包发布会把 npm 包从 12 MB
 * 推到 126 MB。于是把**超过阈值**的附件挪到华为云 OBS 按需下载：
 *
 * - 清单 `data/roster.json` 随包发布（打包与上传见 `tools/pack-assets.mjs`、`tools/upload-obs.mjs`）；
 * - 人格（`persona.md`）与识别标志（`.codebuddy-plugin/`）**始终留在本地**，
 *   所以名册扫描与召唤不受影响，缺的只是技能与数据文件。
 *
 * ## 设计要点
 *
 * - **原地解包**：附件回到 `<root>/<分区>/<slug>/` 的原位置，下载前后目录结构完全一致，
 *   `catalog.js` 的剪枝判断与 `packDir` 语义都不用改。
 * - **幂等且不发多余请求**：`<packDir>/.assets.json` 记下已解包的 sha256，与清单一致就直接返回。
 * - **同一专家并发只下一次**：in-flight 表按 packDir 去重（召唤与显式拉取可能同时发起）。
 * - **先删旧目录再解包**：避免升级后新旧附件混在一起。
 */

import { createHash } from "node:crypto";
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

/** 记录「这个包已解包到哪个版本」的标记文件（放在专家包根，与 persona.md 同级）。 */
export const ASSETS_MARKER = ".assets.json";

/** 附件状态：ready = 已就位且与清单一致；stale = 本地是旧版本；absent = 从没下过。 */
export const ASSETS_READY = "ready";
export const ASSETS_STALE = "stale";
export const ASSETS_ABSENT = "absent";

/**
 * 读清单。文件缺失或格式不对时返回 `undefined`（调用方据此走「没有远程附件」的老路径）。
 * @param {string} path - `roster.json` 的路径（包内快照或运行时目录）。
 */
export async function loadRoster(path) {
  const text = await readFile(path, "utf8").catch(() => undefined);
  if (text === undefined) return undefined;
  try {
    const data = JSON.parse(text);
    if (data === null || typeof data !== "object" || typeof data.packs !== "object" || data.packs === null) {
      return undefined;
    }
    return data;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// 远端清单（roster.json 放 OBS）：让「只更新专家、不动插件」成为可能。
//
// 背景：原来 `data/roster.json` 只随插件包发布，于是改专家必须发版、用户必须升级，
// 否则老用户手上的清单永远停在旧 sha256、判定 READY 永不刷新。解法是清单也放云端：
// `upload-obs.mjs` 早就在传 `agetn/roster.json`，这里补「运行时优先读远端」这半边。
//
// 安全：远端清单一旦成为权威来源，就能指挥客户端下载任意 URL。所以**必须**过一道
// `sanitizeRemoteRoster` —— baseUrl 只能等于包内清单的 baseUrl（随 npm 签名包走、可信），
// path / sha256 / bytes / dirs 逐条校验形态，条目数设上限。任何一条不合法就整份丢弃、
// 回退缓存或包内。宁可退回旧清单，也不能让一份被篡改的清单指挥下载。
// ---------------------------------------------------------------------------

/** 兜底白名单：包内清单没有 baseUrl 时的唯一允许地址。 */
const ALLOWED_BASE_URL = "https://aitoolsdata.obs.cn-south-4.myhuaweicloud.com/agetn";

/** 远端清单拉取的超时（毫秒）—— 拉不到就回退，别拖住召唤。 */
export const ROSTER_FETCH_TIMEOUT_MS = 8000;

/** 缓存清单的保鲜期（毫秒）。过期后下次调用会触发后台刷新。 */
export const ROSTER_TTL_MS = 12 * 60 * 60 * 1000;

/**
 * 单包体积上限（防清单里塞进一个超大对象把客户端下爆）。
 *
 * 定 2 GB 而不是最初写的 200 MB —— 实测 roster 里真实存在 **495.6 MB** 的包
 * （`finance/vietnam-finance-tax-expert`），200 MB 的上限会把它当异常条目整条拒掉，
 * 附件就永远拿不到了（2026-09-29 实测发现）。留足余量，同时仍能挡住「塞一个几十 GB 对象」。
 */
const MAX_PACK_BYTES = 2 * 1024 * 1024 * 1024;

/** 远端条目数最多比包内多出这么多（防塞入海量条目）。 */
const MAX_ROSTER_EXTRA = 200;

/** 远端 roster.json 本体的体积上限（防塞大 JSON）。 */
const MAX_ROSTER_TEXT = 2 * 1024 * 1024;

/**
 * 校验一份**远端**清单，只保留逐条通过白名单规则的条目。
 *
 * 原则：**宁可丢掉条目，也不放行可疑内容**。校验不过的条目直接跳过，不是整个报错 ——
 * 但若整份清单连 baseUrl / 结构 / 条数上限都过不了，就返回 `undefined` 让调用方回退。
 *
 * @param {unknown} data - `JSON.parse` 后的远端清单。
 * @param {object|undefined} bundled - 包内清单（可信基线：baseUrl 与条目数上限都取自它）。
 * @returns {object|undefined} 干净的清单（结构与包内一致），或 `undefined` 表示整份不可用。
 */
export function sanitizeRemoteRoster(data, bundled) {
  if (data === null || typeof data !== "object") return undefined;
  const obj = /** @type {any} */ (data);
  // baseUrl 只能等于包内清单的 baseUrl（随 npm 包走、可信）；包内没有时退回写死常量。
  const allowedBase = typeof bundled?.baseUrl === "string" && bundled.baseUrl !== ""
    ? bundled.baseUrl
    : ALLOWED_BASE_URL;
  if (typeof obj.baseUrl !== "string" || obj.baseUrl !== allowedBase) return undefined;
  if (obj.packs === null || typeof obj.packs !== "object") return undefined;

  const bundledCount = bundled?.packs && typeof bundled.packs === "object"
    ? Object.keys(bundled.packs).length
    : 0;

  const packs = {};
  for (const [key, raw] of Object.entries(obj.packs)) {
    if (raw === null || typeof raw !== "object") continue;
    const info = /** @type {any} */ (raw);
    // key 必须是 `<分区>/<slug>`：小写字母数字与连字符两段，其它一律拒。
    const m = /^([a-z0-9-]+)\/([a-z0-9-]+)$/u.exec(key);
    if (m === null) continue;
    // path 必须严格等于 `packs/<分区>/<slug>.tar.gz`（没有 ../、没有绝对路径、没有其它目录）。
    if (typeof info.path !== "string" || info.path !== `packs/${m[1]}/${m[2]}.tar.gz`) continue;
    // sha256 必须是 64 位十六进制。
    if (typeof info.sha256 !== "string" || !/^[0-9a-f]{64}$/u.test(info.sha256)) continue;
    // bytes 非负整数且不超上限。
    if (!Number.isInteger(info.bytes) || info.bytes < 0 || info.bytes > MAX_PACK_BYTES) continue;
    // dirs 必须是字符串数组，且每项是「纯目录名」（不含斜杠、不含 `..`）—— 解包时按它删目录。
    if (!Array.isArray(info.dirs) || info.dirs.length === 0) continue;
    if (info.dirs.some((d) => typeof d !== "string" || d === "" || d.includes("/") || d.includes("..") || d.includes("\\"))) continue;
    packs[key] = {
      division: m[1],
      slug: m[2],
      path: info.path,
      bytes: info.bytes,
      sha256: info.sha256,
      dirs: info.dirs,
    };
  }

  const count = Object.keys(packs).length;
  if (count > bundledCount + MAX_ROSTER_EXTRA) return undefined;
  return { ...obj, packs };
}

/**
 * 拉一份远端清单，经 {@link sanitizeRemoteRoster} 校验。
 *
 * @param {object|undefined} bundled - 包内清单（校验基线）。
 * @param {typeof fetch} [fetchImpl] - 仅测试用。
 * @returns {Promise<object|undefined>} 通过校验的清单，失败/超时/非法一律 `undefined`。
 */
export async function fetchRemoteRoster(bundled, fetchImpl = fetch) {
  const base = typeof bundled?.baseUrl === "string" && bundled.baseUrl !== ""
    ? bundled.baseUrl
    : ALLOWED_BASE_URL;
  const url = `${base.replace(/\/$/u, "")}/roster.json`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ROSTER_FETCH_TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (res.ok !== true) return undefined;
    const text = await res.text();
    if (text.length > MAX_ROSTER_TEXT) return undefined;
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return undefined;
    }
    return sanitizeRemoteRoster(data, bundled);
  } catch {
    return undefined;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 把远端清单**合并**进包内清单：同名条目以远端为准，包内独有的条目保留。
 *
 * ## 为什么是并集而不是替换
 *
 * 远端清单可能比包内**旧**（改了专家但还没重传 roster）。若直接替换，包内独有的条目就查不到了 ——
 * 表现是那位专家被判成「没有云端附件」，附件**永远下载不下来**。
 * 2026-09-29 实测就踩到了：`finance/vietnam-finance-tax-expert`（495.6 MB）在包内清单里有、
 * 远端那份是旧的因而没有，于是它的 `agents/` 与 `references/` 一直缺失。
 *
 * 并集的方向是「远端优先」：远端有的用远端的（那是新版本），远端没有的用包内的（兜底）。
 * 反向的风险（远端多出来的条目）无害：条目只在名册里真的有那位专家时才会被引用。
 *
 * @param {object|undefined} bundled - 包内清单（可信、完整）。
 * @param {object|undefined} remote - 已过 {@link sanitizeRemoteRoster} 的远端清单。
 * @returns {object|undefined} 合并后的清单；两边都没有时 `undefined`。
 */
export function mergeRosters(bundled, remote) {
  if (remote === undefined) return bundled;
  if (bundled === null || typeof bundled !== "object") return remote;
  return {
    ...remote,
    packs: { ...(bundled.packs ?? {}), ...(remote.packs ?? {}) },
  };
}

/**
 * 读磁盘上的清单缓存。返回 `{ fetchedAt, roster }` 或 `undefined`。
 * @param {string} path - 缓存文件路径。
 */
export async function readCachedRoster(path) {
  const text = await readFile(path, "utf8").catch(() => undefined);
  if (text === undefined) return undefined;
  try {
    const data = JSON.parse(text);
    if (data === null || typeof data !== "object") return undefined;
    if (typeof data.fetchedAt !== "number" || data.roster === null || typeof data.roster !== "object") {
      return undefined;
    }
    // 与 loadRoster 对齐：packs 必须是对象，否则视为坏缓存（缺 packs 的清单会让后续查不到任何附件）。
    if (typeof data.roster.packs !== "object" || data.roster.packs === null) return undefined;
    return { fetchedAt: data.fetchedAt, roster: data.roster };
  } catch {
    return undefined;
  }
}

/**
 * 写清单缓存。失败不抛（缓存只是加速，不是正确性依赖）。
 * @param {string} path - 缓存文件路径。
 * @param {object} roster - 已校验的清单。
 */
export async function writeCachedRoster(path, roster) {
  await writeFile(
    path,
    `${JSON.stringify({ fetchedAt: Date.now(), roster }, null, 2)}\n`,
    "utf8",
  ).catch(() => undefined);
}

/**
 * 查某位专家的远程附件信息。
 * @returns 清单条目（含 path / bytes / sha256 / dirs），没有则 `undefined`。
 */
export function packInfoFor(roster, division, slug) {
  return roster?.packs?.[`${division}/${slug}`];
}

/** 拼出对象的下载地址。 */
export function assetUrl(roster, info) {
  const base = String(roster?.baseUrl ?? "").replace(/\/$/u, "");
  return `${base}/${String(info?.path ?? "").replace(/^\//u, "")}`;
}

/**
 * 本地附件处于什么状态。
 * @param packDir - 专家包目录（`<root>/<分区>/<slug>`）。
 * @param info - 清单条目；`undefined` 表示这位专家没有远程附件。
 */
export async function assetsState(packDir, info) {
  if (info === undefined) return ASSETS_ABSENT;
  const marker = await readFile(join(packDir, ASSETS_MARKER), "utf8").catch(() => undefined);
  if (marker === undefined) return ASSETS_ABSENT;
  try {
    const parsed = JSON.parse(marker);
    return parsed?.sha256 === info.sha256 ? ASSETS_READY : ASSETS_STALE;
  } catch {
    return ASSETS_ABSENT;
  }
}

/** 下载并校验 sha256。 */
async function download(url, expectedSha, fetchImpl) {
  const res = await fetchImpl(url);
  if (res.ok !== true) throw new Error(`下载失败（HTTP ${res.status}）：${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const actual = createHash("sha256").update(buffer).digest("hex");
  if (actual !== expectedSha) {
    throw new Error(`sha256 不匹配：期望 ${String(expectedSha).slice(0, 12)}…，实际 ${actual.slice(0, 12)}…`);
  }
  return buffer;
}

/**
 * 把 tar.gz 解包到专家包目录。**先删旧目录**，避免版本升级后新旧附件混在一起。
 * 用系统 `tar`：macOS 与 Linux 都自带，不引第三方依赖。
 */
function untar(buffer, packDir, dirs) {
  const tmp = join(tmpdir(), `t-team-assets-${process.pid}-${Date.now()}.tar.gz`);
  writeFileSync(tmp, buffer);
  try {
    for (const dir of dirs ?? []) {
      rmSync(join(packDir, dir), { recursive: true, force: true });
    }
    const res = spawnSync("tar", ["-xzf", tmp, "-C", packDir], { encoding: "utf8" });
    if (res.status !== 0) {
      throw new Error(`解包失败：${res.stderr?.trim() || res.error?.message || "未知错误"}`);
    }
  } finally {
    rmSync(tmp, { force: true });
  }
}

/** 同一专家并发只下一次。 */
const inFlight = new Map();

/**
 * 确保某位专家的附件已就位于本地。幂等：已是最新版本时**不发任何网络请求**。
 *
 * @param {object} options - 入参。
 * @param {string} options.packDir - 专家包目录。
 * @param {object} options.roster - 清单（`loadRoster` 的返回值）。
 * @param {object|undefined} options.info - 该专家的清单条目；`undefined` 时直接返回 absent。
 * @param {typeof fetch} [options.fetchImpl] - 仅测试用，替换 fetch。
 * @returns {Promise<{ status: string, bytes?: number, reason?: string, cached?: boolean }>} status 为
 *   ready 时附件已可用。
 */
export async function ensureAssets({ packDir, roster, info, fetchImpl = fetch }) {
  if (info === undefined) {
    return { status: ASSETS_ABSENT, reason: "该专家没有远程附件（附件体积小于阈值，始终随包发布）" };
  }
  if (existsSync(packDir) !== true) {
    return { status: ASSETS_ABSENT, reason: `专家包目录不存在：${packDir}` };
  }
  const state = await assetsState(packDir, info);
  if (state === ASSETS_READY) return { status: ASSETS_READY, bytes: info.bytes, cached: true };

  const running = inFlight.get(packDir);
  if (running !== undefined) return running;

  const task = (async () => {
    let bytes;
    try {
      const buffer = await download(assetUrl(roster, info), info.sha256, fetchImpl);
      bytes = buffer.length;
      untar(buffer, packDir, info.dirs);
    } catch (error) {
      return { status: ASSETS_ABSENT, reason: String(error?.message ?? error) };
    }
    await writeFile(
      join(packDir, ASSETS_MARKER),
      `${JSON.stringify({ sha256: info.sha256, dirs: info.dirs, bytes, at: new Date().toISOString() }, null, 2)}\n`,
      "utf8",
    ).catch(() => undefined);
    return { status: ASSETS_READY, bytes };
  })();

  inFlight.set(packDir, task);
  try {
    return await task;
  } finally {
    inFlight.delete(packDir);
  }
}

/** 抹掉本地附件与标记（重新下载用；`ensureAssets` 自己也会在解包前清目录）。 */
export async function dropAssets(packDir, info) {
  for (const dir of info?.dirs ?? []) {
    rmSync(join(packDir, dir), { recursive: true, force: true });
  }
  await rm(join(packDir, ASSETS_MARKER), { force: true });
}

/**
 * persona 正文里可能出现的附件目录名（与 tools/pack-assets.mjs 打包的那批一致）。
 * 只有以这些名字开头的相对路径才参与改写，避免误伤正文里的普通文字。
 */
export const ASSET_DIRS = [
  "skills", "references", "Databases", "bin", "render-bundle", "Reference_Texts",
  "scripts", "rules", "license", "schemas", "src", "examples", "contracts", "templates",
  "agents",
  // 头像（`avatars/avatar.webp`，128px WEBP、约 5 KB）。它随资源包按需下发 ——
  // 没下载过的专家本地就没有这个目录，面板显示默认头像（emoji）。
  "avatars",
];

/**
 * 把 persona 正文里指向**包内附件**的相对路径改写成绝对路径，并在顶部补一段资源说明。
 *
 * ## 为什么必须做这件事
 *
 * 专家正文里写的是相对路径，例如：
 *
 *     必须读取并遵循 `skills/frontend-slides/SKILL.md`
 *
 * 而模型执行 `Read` 时，相对路径的基准是**当前会话的工作目录**，不是专家包目录 ——
 * 于是它去找 `<cwd>/skills/frontend-slides/SKILL.md`，**必然落空**。附件下载得再完整也没用。
 * 实测 645 位里 126 位（20%）的正文引用了资源路径，其中目录形态 115 个（占 322 个包的 36%）。
 *
 * ## 改写规则（刻意收窄，宁可不改也不改错）
 *
 * - 只碰以 {@link ASSET_DIRS} 里那些目录名开头的路径；
 * - 只改写**包内确实存在**的那一个 —— 把模型指向不存在的文件比不改写更糟；
 * - 本来已是绝对路径、或指向 `~/.workbuddy/...` 的一律不动。
 *
 * 改不到的情况由顶部那段说明兜底（并告诉模型附件可能还没下载、可以调 fetch_expert_assets）。
 *
 * @param {object} options - 入参。
 * @param {string} options.text - persona 正文。
 * @param {string} options.packDir - 专家包目录（绝对路径）。
 * @param {string} options.slug - 专家 slug（写进说明里的工具调用示例）。
 * @param {boolean} [options.remote] - 该专家的附件是否走云端（决定要不要提「尚未下载」）。
 * @param {boolean} [options.hasBin] - 包内是否有 `bin/`（决定要不要补「CLI 不在 PATH 里」那段）。
 * @returns {string} 改写后的正文。
 */
export function annotatePersona({ text, packDir, slug, remote = false, hasBin = false }) {
  const root = packDir.endsWith("/") ? packDir : `${packDir}/`;
  // 负向后顾是关键：`~/.workbuddy/skills-marketplace/skills/xxx/SKILL.md` 里第二个 `skills/`
  // 前面是 `/`，那是别人的路径、不该动（2026-09-29 实测误改过一次）。
  const pattern = new RegExp(`(?<![A-Za-z0-9._\\-/])(?:${ASSET_DIRS.join("|")})/[A-Za-z0-9._\\-/]+`, "gu");
  const rewritten = text.replace(pattern, (match) =>
    existsSync(join(packDir, match)) ? `${root}${match}` : match,
  );
  const lines = [
    `> **资源目录**：\`${root}\``,
    "> 正文里出现的 `skills/`、`references/` 等相对路径都相对于该目录；请用上面的绝对路径读取。",
  ];
  // 带 CLI 的专家（包内有 bin/）：命令名本身**不在 PATH 里**，得用绝对路径调。
  // WorkBuddy 的宿主会把专家包的 bin/ 挂进 PATH，DSH 不会 —— 而正文里写的是裸命令名
  // （「用 `cpq` 命令」「`use_skill inquiry-price`」），照做就是 command not found。
  // 2026-09-29 实测：cpq 的 bin/health-check 报「❌ cpq: 未找到（请检查 bin/ 目录）」。
  if (hasBin === true) {
    const binDir = `${root}bin/`;
    lines.push(
      `> **可执行脚本**：本专家的 CLI 在 \`${binDir}\`（注意它**不在** PATH 里）。` +
      `调用时用绝对路径，例如 \`${binDir}<脚本名> --help\`；` +
      `要先按正文里的裸命令名调用，可先执行 \`export PATH="${root}bin:$PATH"\`。`,
    );
  }
  if (remote === true) {
    lines.push(`> 若某个文件不存在，说明配套资源尚未下载到本机 —— 先调用 \`fetch_expert_assets("${slug}")\` 拉取，再读。`);
  }
  return `${lines.join("\n")}\n\n${rewritten}`;
}

/**
 * 后台预取附件（方案 A）：**不 await**，失败只回调、不打断召唤。
 *
 * 人格在本地、立即可用，所以召唤不该等下载；附件晚几百毫秒到位即可。
 * 同一专家并发召唤时由 `ensureAssets` 的 in-flight 表合并成一次下载。
 *
 * @param {object} options - 透传给 `ensureAssets` 的 `packDir` / `roster` / `info`，外加两个回调。
 * @returns {Promise<{status: string}>} 供调用方在需要时 await（一般不 await）。
 */
export function kickoffAssets({ packDir, roster, info, onDone, onError }) {
  return ensureAssets({ packDir, roster, info })
    .then((res) => {
      if (res.status === ASSETS_READY) onDone?.(res);
      else onError?.(res);
      return res;
    })
    .catch((error) => {
      const res = { status: ASSETS_ABSENT, reason: String(error?.message ?? error) };
      onError?.(res);
      return res;
    });
}
