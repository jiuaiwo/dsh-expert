#!/usr/bin/env node
/**
 * 把 `dist/assets/` 里的附件包与 `data/roster.json` 上传到华为云 OBS。
 *
 *   node tools/upload-obs.mjs --dry-run       # 列出将上传的对象（不联网）
 *   node tools/upload-obs.mjs                 # 上传（并发 6）
 *   node tools/upload-obs.mjs --only cpq      # 只传某一位专家（调试用）
 *   node tools/upload-obs.mjs --verify        # 只校验远端：下载回来重算 sha256
 *   node tools/upload-obs.mjs --concurrency 4
 *   node tools/upload-obs.mjs --delete-orphans        # 列出桶里 roster 未引用的对象（只列不删）
 *   node tools/upload-obs.mjs --delete-orphans --yes  # 真删 —— 删过专家之后清孤儿
 *
 * 凭据来源按顺序：环境变量 → `~/.dsh/.credentials.yaml`（DSH 官方凭据库）的 `refs` 段。
 * 两种都**绝不写进仓库、清单或发布包**：
 *   OBS_ACCESS_KEY_ID / OBS_SECRET_ACCESS_KEY
 * 一次性写入凭据库（之后免手）：`node tools/set-obs-credentials.mjs`
 *
 * 签名用华为 OBS 的 v2 风格（`Authorization: OBS <AK>:<Base64(HMAC-SHA1(SK, StringToSign))>`）。
 * 每个对象带上 `x-obs-meta-sha256` 元数据，`--verify` 与运行时的下载器都靠它校验完整性。
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { createHmac, createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { loadObsCredentials } from "./obs-credentials.mjs";

const HERE = dirname(dirname(fileURLToPath(import.meta.url)));
const ROSTER = join(HERE, "data", "roster.json");
const ASSETS = join(HERE, "dist", "assets");

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const DRY = has("--dry-run");
const VERIFY = has("--verify");
const NO_VERIFY = has("--no-verify");
const ONLY = valueOf("--only", "");
// `--force`：忽略「meta 一致就跳过」。用在上传中断过的对象上 —— 那种情况
// meta 已写新、内容体还是旧的，只比 meta 会误判成"已同步"（2026-09-29 实测 brand-guardian）。
const FORCE = has("--force");
const CONCURRENCY = Number(valueOf("--concurrency", "6"));
// `--delete-orphans`：独立模式 —— 列举桶里 `roster.json` 没引用的对象（删过专家之后会留下），
// 默认只列不删，加 `--yes` 才真删。详见文件头的用法说明。
const DELETE_ORPHANS = has("--delete-orphans");
const YES = has("--yes");

const log = (msg = "") => process.stdout.write(`${msg}\n`);
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

if (!existsSync(ROSTER)) {
  log(`找不到 ${ROSTER} —— 先跑 node tools/pack-assets.mjs`);
  process.exit(1);
}
const roster = JSON.parse(readFileSync(ROSTER, "utf8"));
const { baseUrl } = roster;

/** 从 baseUrl 拆出 bucket 与 endpoint：`https://<bucket>.<endpoint>/<prefix>`。 */
function parseBase(url) {
  const m = /^https:\/\/([^.]+)\.([^/]+)\/(.+)$/u.exec(url);
  if (m === null) throw new Error(`无法解析 baseUrl：${url}`);
  return { bucket: m[1], endpoint: m[2], prefix: m[3].replace(/\/$/u, "") };
}
const { bucket, endpoint, prefix } = parseBase(baseUrl);

/** OBS v2 签名。`meta` 里是 x-obs-* 头（会进 CanonicalizedHeaders，必须按字典序、小写键）。 */
function authorize({ method, key, contentType, date, meta = {} }) {
  const canonicalHeaders = Object.keys(meta)
    .map((k) => k.toLowerCase())
    .sort()
    .map((k) => `${k}:${meta[Object.keys(meta).find((orig) => orig.toLowerCase() === k)]}\n`)
    .join("");
  const stringToSign = [method, "", contentType, date, `${canonicalHeaders}/${bucket}/${key}`].join("\n");
  const { ak, sk } = loadObsCredentials();
  const signature = createHmac("sha1", sk).update(stringToSign, "utf8").digest("base64");
  return `OBS ${ak}:${signature}`;
}

function obsUrl(key) {
  return `https://${bucket}.${endpoint}/${key}`;
}

/** 上传一个对象。返回 { skipped } 表示远端已有同内容。 */
async function put(key, body, { contentType, sha256, skipIfSame }) {
  const date = new Date().toUTCString();
  const meta = sha256 === undefined ? {} : { "x-obs-meta-sha256": sha256 };
  const headers = { Date: date, "Content-Type": contentType, ...meta };
  if (skipIfSame && !FORCE) {
    const head = await fetch(obsUrl(key), { method: "HEAD" }).catch(() => undefined);
    if (head?.ok === true && head.headers.get("x-obs-meta-sha256") === sha256) {
      return { skipped: true };
    }
  }
  headers.Authorization = authorize({ method: "PUT", key, contentType, date, meta });
  const res = await fetch(obsUrl(key), { method: "PUT", headers, body });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`上传失败 ${key}：HTTP ${res.status} ${text.slice(0, 200)}`);
  }
  return { skipped: false };
}

/** 带并发上限地跑一批任务。 */
async function pool(items, limit, worker) {
  const queue = [...items];
  const results = [];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      results.push(await worker(item));
    }
  });
  await Promise.all(runners);
  return results;
}

// ---------- 孤儿对象：列举与删除 ----------

/**
 * 列出桶里某个前缀下的全部对象（自动翻页）。
 *
 * ListObjects 是**桶级**请求：CanonicalizedResource 只有 `/<bucket>/`（key 为空），
 * 而 `prefix` / `marker` / `max-keys` 这些 query 参数在 OBS v2 签名里**不属于**要签的子资源 ——
 * 所以直接复用 `authorize({ key: "" })` 就行，不需要把它们拼进 StringToSign。
 */
async function listObjects(listPrefix) {
  const out = [];
  let marker = "";
  // 一次 1000 个，上限 100 页（10 万个）防死循环。
  for (let page = 0; page < 100; page += 1) {
    const params = new URLSearchParams({ prefix: listPrefix, "max-keys": "1000" });
    if (marker !== "") params.set("marker", marker);
    const date = new Date().toUTCString();
    const headers = { Date: date, Authorization: authorize({ method: "GET", key: "", contentType: "", date, meta: {} }) };
    const res = await fetch(`https://${bucket}.${endpoint}/?${params.toString()}`, { headers });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`列举对象失败（HTTP ${res.status}）：${text.slice(0, 200)}`);
    }
    const xml = await res.text();
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/gu)) {
      const key = /<Key>([^<]*)<\/Key>/u.exec(m[1])?.[1] ?? "";
      const size = Number(/<Size>(\d+)<\/Size>/u.exec(m[1])?.[1] ?? "0");
      if (key !== "") out.push({ key, size });
    }
    if (!/<IsTruncated>true<\/IsTruncated>/u.test(xml)) break;
    marker = /<NextMarker>([^<]*)<\/NextMarker>/u.exec(xml)?.[1] ?? "";
    if (marker === "") break;
  }
  return out;
}

/** 删除一个对象（404 当作「本来就没了」）。 */
async function deleteObject(key) {
  const date = new Date().toUTCString();
  const headers = { Date: date, Authorization: authorize({ method: "DELETE", key, contentType: "", date, meta: {} }) };
  const res = await fetch(obsUrl(key), { method: "DELETE", headers });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => "");
    throw new Error(`删除失败 ${key}：HTTP ${res.status} ${text.slice(0, 200)}`);
  }
  return res.ok;
}

// ---------- --delete-orphans：独立模式 ----------

/**
 * 删过专家之后，它留在桶里的 `packs/<分区>/<slug>.tar.gz` 就成了孤儿 —— `roster.json` 里没有它，
 * 不会有客户端下载，但一直占着云端空间（实测有一个 495.6 MB 的）。
 *
 * 这里**只扫 `<prefix>/packs/` 前缀**（桶里除了它就只有 `roster.json`），
 * 不去碰其它前缀的对象，免得误删手工放进去的东西。
 */
if (DELETE_ORPHANS) {
  const wanted = new Set(
    Object.values(roster.packs ?? {})
      .map((info) => `${prefix}/${String(info.path ?? "").replace(/^\//u, "")}`),
  );
  log(`列举 ${prefix}/packs/ 下的对象 …`);
  const all = await listObjects(`${prefix}/packs/`);
  const orphans = all.filter((o) => !wanted.has(o.key));
  log(`  桶里 ${all.length} 个 / 清单引用 ${wanted.size} 个 / 孤儿 ${orphans.length} 个`);
  if (orphans.length === 0) {
    log("  ✓ 没有孤儿对象");
    process.exit(0);
  }
  const totalSize = orphans.reduce((sum, o) => sum + o.size, 0);
  log("");
  for (const o of orphans.slice(0, 30)) log(`  ${mb(o.size).padStart(10)}  ${o.key}`);
  if (orphans.length > 30) log(`  …另有 ${orphans.length - 30} 个`);
  log("");
  log(`  合计 ${mb(totalSize)}`);
  if (DRY || !YES) {
    log("");
    log(DRY ? "--dry-run：未删除任何对象。" : "未删除 —— 确认要删就再加 --yes。");
    process.exit(0);
  }
  log("");
  log("删除中 …");
  let done = 0;
  let freed = 0;
  for (const o of orphans) {
    const ok = await deleteObject(o.key);
    if (ok) {
      done += 1;
      freed += o.size;
    }
    if (done > 0 && done % 25 === 0) log(`  已删除 ${done}/${orphans.length} …`);
  }
  log(`已删除 ${done} 个对象，释放 ${mb(freed)}`);
  process.exit(0);
}

// ---------- 组装待传清单 ----------

const packs = Object.entries(roster.packs)
  .filter(([, info]) => ONLY === "" || info.slug === ONLY)
  .map(([id, info]) => ({ id, ...info }));

const jobs = [];
for (const p of packs) {
  const file = join(ASSETS, p.division, `${p.slug}.tar.gz`);
  if (!existsSync(file)) {
    log(`⚠ 缺本地包，跳过：${p.id}（${file}）—— 先跑 pack-assets.mjs`);
    continue;
  }
  jobs.push({ key: `${prefix}/${p.path}`, file, sha256: p.sha256, label: p.id, size: statSync(file).size });
}
const rosterBody = readFileSync(ROSTER);
jobs.push({
  key: `${prefix}/roster.json`,
  body: rosterBody,
  sha256: createHash("sha256").update(rosterBody).digest("hex"),
  label: "roster.json",
  size: rosterBody.length,
});

const total = jobs.reduce((sum, j) => sum + j.size, 0);
log(`目标：${baseUrl}`);
log(`待传：${jobs.length} 个对象 / ${mb(total)}`);
log("");

if (DRY) {
  for (const j of jobs.slice(0, 5)) log(`  ${mb(j.size).padStart(9)}  ${j.key}`);
  if (jobs.length > 5) log(`  …（其余 ${jobs.length - 5} 个）`);
  log("");
  log("--dry-run：未联网。");
  process.exit(0);
}

// ---------- 校验 ----------

/**
 * 把远端对象下载回来重算 sha256，返回不一致的条目。
 *
 * 这一步是**流程的保险丝**：打包脚本改过之后重跑打包会得到新的 sha256，若忘记重传，
 * 清单与远端就脱节了 —— 而那时本地看起来一切正常（`--prune` 也能跑），
 * 直到有人真的去下载才报「sha256 不匹配」。所以上传完自动跑一次，不一致就非零退出。
 */
async function verifyAll(jobs) {
  const bad = [];
  await pool(jobs, CONCURRENCY, async (j) => {
    const res = await fetch(obsUrl(j.key));
    if (!res.ok) {
      bad.push(`${j.key}（HTTP ${res.status}）`);
      return;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const actual = createHash("sha256").update(buf).digest("hex");
    if (actual !== j.sha256) {
      bad.push(`${j.key}（sha256 不符：${actual.slice(0, 12)}… ≠ ${j.sha256.slice(0, 12)}…）`);
    }
  });
  return bad;
}

if (VERIFY) {
  log("校验模式：下载远端对象并重算 sha256 …");
  const bad = await verifyAll(jobs);
  log(`  一致 ${jobs.length - bad.length}/${jobs.length}`);
  if (bad.length > 0) {
    log("");
    for (const line of bad.slice(0, 10)) log(`  ✗ ${line}`);
    process.exit(1);
  }
  log("  全部一致 ✓");
  process.exit(0);
}

// ---------- 上传 ----------

log(`上传中（并发 ${CONCURRENCY}）…`);
let done = 0;
let skipped = 0;
await pool(jobs, CONCURRENCY, async (j) => {
  const body = j.body ?? readFileSync(j.file);
  const res = await put(j.key, body, {
    contentType: j.key.endsWith(".json") ? "application/json" : "application/gzip",
    sha256: j.sha256,
    skipIfSame: true,
  });
  if (res.skipped) skipped += 1;
  done += 1;
  if (done % 25 === 0 || done === jobs.length) log(`  已处理 ${done}/${jobs.length} …`);
});

log("");
log(`上传完成：${jobs.length} 个对象（跳过 ${skipped} 个与远端一致的）`);

if (NO_VERIFY) {
  log("");
  log("（--no-verify：跳过自动校验）");
} else {
  log("");
  log("自动校验：把远端对象下载回来重算 sha256 …");
  const bad = await verifyAll(jobs);
  if (bad.length > 0) {
    log(`  ✗ ${bad.length} 个不一致：`);
    for (const line of bad.slice(0, 8)) log(`    ${line}`);
    log("");
    log("**先别 prune** —— 清单与远端不一致时瘦身会丢附件。");
    process.exit(1);
  }
  log(`  一致 ${jobs.length}/${jobs.length} ✓`);
}

log("");
log("下一步：确认无误后跑 node tools/pack-assets.mjs --prune 瘦身本地。");
