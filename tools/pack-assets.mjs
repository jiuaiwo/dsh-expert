#!/usr/bin/env node
/**
 * 把专家包的大附件打成 tar.gz，并生成 `data/roster.json`（云端分发清单）。
 *
 *   node tools/pack-assets.mjs                 # 打包 + 写清单
 *   node tools/pack-assets.mjs --dry-run       # 只报告，不写任何文件
 *   node tools/pack-assets.mjs --prune         # 打完包后删掉本地已上传的附件目录（危险，慎用）
 *   node tools/pack-assets.mjs --threshold 200KB
 *
 * 背景（2026-09-29）：645 位专家里 322 位是「目录形态专家包」，附件合计约 296 MB —— 其中
 * `skills/` 一个目录就占 88%。发布包因此从 12 MB 涨到 126 MB。把**超过阈值**的附件挪到
 * 华为云 OBS 按需下载，包体回落，而人格（persona.md）与元数据始终留在本地，
 * 所以召唤体验不受影响。清单 `data/roster.json` 随包发布，运行时由 `lib/fetch-assets.js` 读取。
 *
 * 打包粒度：**每个专家一个 tar.gz**，内含它自己的全部一级子目录（skills/references/...）。
 * 不按目录类型拆 —— 那样解包时还得处理跨包依赖，得不偿失。
 */

import { readdirSync, statSync, existsSync, mkdirSync, writeFileSync, rmSync, readFileSync, renameSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(dirname(fileURLToPath(import.meta.url)));
const EXPERTS = join(HERE, "data", "experts");
const ROSTER = join(HERE, "data", "roster.json");
const DEFAULT_OUT = join(HERE, "dist", "assets");
/** OBS 上的公共读根（与 roster.json 的 baseUrl 一致）。 */
const BASE_URL = "https://aitoolsdata.obs.cn-south-4.myhuaweicloud.com/agetn";

/**
 * **绝不上云**的目录。
 *
 * `.codebuddy-plugin/` 里是 plugin.json —— 它是 `lib/catalog.js` 判定「这是不是目录形态
 * 专家包」的标志（`isExpertPack` 要求 plugin.json 与 persona.md **同时**存在）。
 * 把它挪到云端 = 本地不再具备识别标志，这位专家会直接从名册里消失。
 * 好在它只有几百字节，留着完全不占地方。
 */
// 绝不上云、随包发布的目录。
// `avatars` 是 2026-09-29 用户改的口径：云端按需下载那条链路一直不稳定（点选不触发 / 要重开面板），
// 而 281 张 128px WEBP 加起来才 0.94 MB —— 直接放包里最省事，也永远不会「显示不出来」。
const KEEP_LOCAL = new Set([".codebuddy-plugin", "avatars"]);

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

/** 解析 `50KB` / `51200` / `1MB` 这类写法。 */
function parseSize(text) {
  const m = /^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/iu.exec(String(text).trim());
  if (m === null) throw new Error(`无法解析体积：${text}`);
  const unit = (m[2] ?? "B").toUpperCase();
  const scale = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3 }[unit];
  return Math.round(Number(m[1]) * scale);
}

const THRESHOLD = parseSize(valueOf("--threshold", "50KB"));
const OUT = valueOf("--out", DEFAULT_OUT);
const DRY = has("--dry-run");
const PRUNE = has("--prune");

const log = (msg = "") => process.stdout.write(`${msg}\n`);
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

/** 统计一组子目录里的文件数与字节数（跳过符号链接 —— WorkBuddy 包里有指向打包者本机的坏链接）。 */
function measure(packDir, dirs) {
  let bytes = 0;
  let files = 0;
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) {
        bytes += statSync(path).size;
        files += 1;
      }
    }
  };
  for (const dir of dirs) walk(join(packDir, dir));
  return { bytes, files };
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/** 收集所有目录形态专家包，及其附件体积。 */
function collect() {
  const packs = [];
  const divisions = readdirSync(EXPERTS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  for (const division of divisions) {
    const dir = join(EXPERTS, division);
    const slugs = readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
    for (const slug of slugs) {
      const packDir = join(dir, slug);
      // 目录形态的判据与 lib/catalog.js 的 isExpertPack 一致：persona.md 是名册入口。
      if (!existsSync(join(packDir, "persona.md"))) continue;
      const dirs = readdirSync(packDir, { withFileTypes: true })
        .filter((e) => e.isDirectory() && !KEEP_LOCAL.has(e.name))
        .map((e) => e.name)
        .sort();
      if (dirs.length === 0) continue;
      const { bytes, files } = measure(packDir, dirs);
      packs.push({ division, slug, packDir, dirs, bytes, files });
    }
  }
  return packs;
}

/**
 * 打一个专家包的附件。
 *
 * **必须确定性**：`tar -czf` 每次都会把「当前时间」写进 gzip 头，于是同一份内容两次打包
 * 会得到两个不同的 sha256 —— 清单里记的那个随即失效，而远端还是旧对象。2026-09-29 实测踩过：
 * 改完脚本重跑了一次打包、忘了重传，结果下载器报「sha256 不匹配」，而远端对象其实完好。
 *
 * 所以拆成两步：`tar -cf` 出裸包，再 `gzip -n`（`-n` = 不写时间戳与原始文件名）。
 * （tar 头里仍带文件自己的 mtime，所以同一台机器上可复现；换机器重新打包会得到新哈希，
 * 这时本就该重新上传并更新清单。）
 */
function pack(p) {
  const out = join(OUT, p.division, `${p.slug}.tar.gz`);
  mkdirSync(dirname(out), { recursive: true });
  const tmpTar = `${out}.tmp.tar`;
  // --no-mac-metadata：不带 macOS 扩展属性/`._` 影子文件，解包更干净。
  const tar = spawnSync("tar", ["--no-mac-metadata", "-cf", tmpTar, "-C", p.packDir, ...p.dirs], {
    encoding: "utf8",
  });
  if (tar.status !== 0) {
    rmSync(tmpTar, { force: true });
    throw new Error(`打包失败 ${p.division}/${p.slug}：${tar.stderr?.trim() ?? tar.error}`);
  }
  const gz = spawnSync("gzip", ["-n", "-f", tmpTar], { encoding: "utf8" });
  if (gz.status !== 0) {
    rmSync(tmpTar, { force: true });
    throw new Error(`压缩失败 ${p.division}/${p.slug}：${gz.stderr?.trim() ?? gz.error}`);
  }
  renameSync(`${tmpTar}.gz`, out);
  return { out, bytes: statSync(out).size, sha256: sha256File(out) };
}

function prune(p) {
  for (const dir of p.dirs) rmSync(join(p.packDir, dir), { recursive: true, force: true });
}

// ---------- 主流程 ----------

log(`扫描 ${relative(HERE, EXPERTS)} …`);
const packs = collect();
// 按体积分流：超阈值的上云，其余随 npm 包发布。
// （`avatars` 自 2026-09-29 起在 KEEP_LOCAL 里、压根不进 `dirs`，所以这里不用再特判。）
const remote = packs.filter((p) => p.bytes > THRESHOLD);
const local = packs.filter((p) => p.bytes <= THRESHOLD);
const remoteTotal = remote.reduce((sum, p) => sum + p.bytes, 0);
const localTotal = local.reduce((sum, p) => sum + p.bytes, 0);

log(`目录形态专家包：${packs.length} 个`);
log(`  阈值 ${kb(THRESHOLD)}：上云 ${remote.length} 个 / ${mb(remoteTotal)}，本地留 ${local.length} 个 / ${mb(localTotal)}`);

if (DRY) {
  log("");
  log("将打包的（前 8 大）：");
  for (const p of [...remote].sort((a, b) => b.bytes - a.bytes).slice(0, 8)) {
    log(`  ${mb(p.bytes).padStart(9)}  ${p.division}/${p.slug}  [${p.dirs.join(", ")}]`);
  }
  log("");
  log(`--dry-run：未写任何文件。清单将写到 ${relative(HERE, ROSTER)}，tar 包写到 ${relative(HERE, OUT)}/`);
  process.exit(0);
}

log("");
log("打包中 …");
const entries = {};
let tarTotal = 0;
for (const [index, p] of remote.entries()) {
  const built = pack(p);
  tarTotal += built.bytes;
  entries[`${p.division}/${p.slug}`] = {
    division: p.division,
    slug: p.slug,
    path: `packs/${p.division}/${p.slug}.tar.gz`,
    bytes: built.bytes,
    rawBytes: p.bytes,
    files: p.files,
    sha256: built.sha256,
    dirs: p.dirs,
  };
  if ((index + 1) % 50 === 0) log(`  已打包 ${index + 1}/${remote.length} …`);
}

const roster = {
  version: 1,
  generatedAt: new Date().toISOString(),
  baseUrl: BASE_URL,
  threshold: THRESHOLD,
  packs: entries,
};
writeFileSync(ROSTER, `${JSON.stringify(roster, null, 2)}\n`, "utf8");

log("");
log(`已打包 ${remote.length} 个 → ${relative(HERE, OUT)}/ （合计 ${mb(tarTotal)}，压缩后为原体积的 ${((tarTotal / remoteTotal) * 100).toFixed(0)}%）`);
log(`已写清单 → ${relative(HERE, ROSTER)} （${Object.keys(entries).length} 条）`);

if (PRUNE) {
  log("");
  log(`--prune：删除本地已上传的附件目录（${remote.length} 个包）…`);
  for (const p of remote) prune(p);
  log(`已删除。未上传（<${kb(THRESHOLD)}）的 ${local.length} 个包原样保留。`);
} else {
  log("");
  log("下一步：node tools/upload-obs.mjs --dry-run  → 核对将上传的对象");
  log("      node tools/upload-obs.mjs            → 真正上传（AK/SK 走环境变量）");
  log("      上传并校验通过后，再跑 --prune 瘦身本地");
}
