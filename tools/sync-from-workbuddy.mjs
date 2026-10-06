#!/usr/bin/env node
/**
 * 从 WorkBuddy 增量同步专家到 T专家名册，并把新增/变化的附件推上 OBS。
 *
 * 面向的场景是**日常维护**（腾讯那边更新了，我同步一次），不是首次导入 ——
 * 首次导入用 `tools/import-workbuddy.py` 就够了。
 *
 * ## 为什么不复用 import-workbuddy.py 的判重
 *
 * 那个脚本判重时只看 `<分区>/<slug>.md`（**单文件**形态），**不认 `<分区>/<slug>/persona.md`
 * （目录形态）** —— 它是为「往空名册里灌」写的。所以这里的「更新一位已有专家」的做法是
 * **先删掉它的包目录，再用 `--only` 导入**：删了自然不判重，也就不会改动那个 19.6 KB 的脚本。
 *
 * ## 六阶段
 *
 * | 阶段 | 做什么 | 关键点 |
 * |---|---|---|
 * | 0 检测 | 比清单时间戳；对每个包发 HTTP HEAD 拿 ETag | COS 的 ETag 就是内容 MD5，**不用下载**就能看出哪个包变了 |
 * | 1 拉取 | `fetch-workbuddy-experts.py --only <变化的>` | 只下变化的 |
 * | 2 把关 | `scan-internal-deps.py` 扫候选 | 拦掉绑定腾讯内部系统的 —— 否则下次同步会把删过的灌回来 |
 * | 3 导入 | 删旧包 + `import-workbuddy.py --only` | 见上面「为什么不复用判重」 |
 * | 4 打包 | `pack-assets.mjs` | ⚠️ 它写的是**全量** roster.json，所以这里先备份、之后**合并**回去 |
 * | 5 上传 | `upload-obs.mjs` | 自带跳过同内容（HEAD 比对 sha256） |
 *
 * 用法：
 *   node tools/sync-from-workbuddy.mjs --check          # 只检测，报告有什么变化（不落盘）
 *   node tools/sync-from-workbuddy.mjs --stage fetch    # 只跑某一阶段
 *   node tools/sync-from-workbuddy.mjs --dry-run        # 打印将执行的命令，不真跑
 *   node tools/sync-from-workbuddy.mjs                  # 全流程
 *
 * ⚠️ 会写 roster.json 的只有 `pack-assets.mjs`，而它按「本地还能打包的包」重算 ——
 * 附件早在云端时它算出来是空的。本脚本因此在第 4 阶段前后做备份与合并，
 * 单独手跑 `pack-assets.mjs` 仍会清空清单（2026-09-29 踩过）。
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(dirname(fileURLToPath(import.meta.url)));
const TOOLS = join(HERE, "tools");
const EXPERT_DIR = join(HERE, "data", "experts");
const ROSTER = join(HERE, "data", "roster.json");
const WORKBUDDY = join(process.env.HOME ?? "", "web", "t-team", "workbuddy-experts");
/** 拉取那一步的脚本来自**另一个技能**（`workbuddy-expert-fetch`），它在 ~/.dsh/skills 下。 */
const FETCH_SCRIPT = join(process.env.HOME ?? "", ".dsh", "skills", "workbuddy-expert-fetch", "scripts", "fetch-workbuddy-experts.py");
const MANIFEST = "https://acc-1258344699.cos.accelerate.myqcloud.com/workbuddy/expert-marketplace";
const ETAG_SNAPSHOT = join(TOOLS, ".workbuddy-etags.json");

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const STAGE = valueOf("--stage", "all");
const DRY = has("--dry-run");
const CHECK = has("--check");
/** 只处理指定包（逗号分隔）或前 N 个 —— 用于安全试点，跳过"只看变更"的过滤。 */
const ONLY = valueOf("--only", "");
const LIMIT = Number(valueOf("--limit", "0"));

const log = (msg) => process.stdout.write(`  ${msg}\n`);
const head = (msg) => process.stdout.write(`\n── ${msg}\n`);

/** 跑一个子命令；`--dry-run` 时只打印。 */
function run(cmd, cmdArgs, { label } = {}) {
  const shown = [cmd, ...cmdArgs].join(" ");
  if (DRY) {
    log(`[dry-run] ${shown}`);
    return { status: 0, stdout: "", stderr: "" };
  }
  log(`${label ?? "执行"}: ${shown}`);
  const res = spawnSync(cmd, cmdArgs, { cwd: HERE, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
  if (res.status !== 0) {
    process.stderr.write(`\n✗ 失败（exit ${res.status}）：${shown}\n`);
    process.exit(res.status ?? 1);
  }
  return res;
}

// ───────────────────────── 阶段 0：检测 ─────────────────────────
head("阶段 0 · 检测变化");

/** 拉一份远端清单并算出内容指纹（不再依赖清单里的时间戳：它由腾讯维护，未必更新）。 */
async function fetchManifestFingerprint() {
  const parts = ["expert_center.json", "internalExpert.json", "externalExpert.json"];
  const lines = [];
  for (const p of parts) {
    const res = await fetch(`${MANIFEST}/${p}`).catch(() => undefined);
    if (!res?.ok) return { ok: false, reason: `${p} 拉取失败（HTTP ${res?.status ?? "?"}）` };
    lines.push(await res.text());
  }
  return { ok: true, text: lines.join("\n"), count: (lines.join("").match(/"plugin"/g) ?? []).length };
}

const manifest = await fetchManifestFingerprint();
if (!manifest.ok) {
  process.stderr.write(`✗ 拿不到 WorkBuddy 清单：${manifest.reason}\n`);
  process.exit(1);
}
log(`清单已拉取（约 ${manifest.count} 个 plugin 条目）`);

const prevEtags = existsSync(ETAG_SNAPSHOT)
  ? JSON.parse(readFileSync(ETAG_SNAPSHOT, "utf8"))
  : null;
log(prevEtags ? `上次快照：${Object.keys(prevEtags.etags ?? {}).length} 个包` : "没有上次快照 —— 首次运行，全部视为新包");

/** 用 HEAD 拿 ETag（COS 的 ETag 即内容 MD5），不下载就能判断包变没变。 */
async function headEtag(bundle) {
  const url = `${MANIFEST}/bundles/${bundle}.tar.gz`;
  const res = await fetch(url, { method: "HEAD" }).catch(() => undefined);
  if (!res?.ok) return undefined;
  return res.headers.get("etag") ?? res.headers.get("last-modified") ?? undefined;
}

/** 从清单里抽出 plugin → bundleName 的映射。 */
function bundleNames(text) {
  const names = new Set();
  for (const m of text.matchAll(/"plugin"\s*:\s*"([^"]+)"/g)) names.add(m[1]);
  return [...names].sort();
}

const plugins = bundleNames(manifest.text);
log(`清单里有 ${plugins.length} 个 plugin`);

const etags = {};
let changed = [];
let unprobed = 0;
for (const plugin of plugins) {
  const etag = await headEtag(plugin);
  if (etag === undefined) {
    unprobed += 1;
    continue;
  }
  etags[plugin] = etag;
  if (!prevEtags || prevEtags.etags?.[plugin] !== etag) changed.push(plugin);
}
log(`探测完成：${Object.keys(etags).length} 个可探测${unprobed ? `、${unprobed} 个无响应` : ""}`);
log(`内容有变化：${changed.length} 个`);

// 名册里已有的专家 slug —— **两种形态都必须收**：
//   ① 单文件 `<分区>/<slug>.md`   ② 目录形态 `<分区>/<slug>/persona.md`
// 只收目录形态会漏掉几百个单文件专家，把它们误报成「新增」（2026-09-29 用户当场指出）。
// 这里只是**按 slug 的粗筛**；真正的判重是 import-workbuddy.py 的三重判重（slug / 职业名 / 正文哈希）。
const localSlugs = new Set();
if (existsSync(EXPERT_DIR)) {
  const { readdirSync } = await import("node:fs");
  for (const division of readdirSync(EXPERT_DIR)) {
    const dpath = join(EXPERT_DIR, division);
    let entries;
    try { entries = readdirSync(dpath); } catch { continue; }
    for (const name of entries) {
      if (name.endsWith(".md")) localSlugs.add(name.slice(0, -3));
      else if (existsSync(join(dpath, name, "persona.md"))) localSlugs.add(name);
    }
  }
}
const fresh = changed.filter((p) => !localSlugs.has(p));
const updated = changed.filter((p) => localSlugs.has(p));
log(`其中名册里没有同 slug 的 ${fresh.length} 个、已有的 ${updated.length} 个`);
log("（「没有同 slug」≠「新专家」—— 还要过三重判重：slug / 职业名 / 正文哈希）");

// `--only` / `--limit` 是**试点开关**：直接指定要处理的包，跳过"只看变更"的筛选。
// 打通流程时用它跑 1~2 个包，避免一上来就动 447 个。
let targets = changed;
if (ONLY) {
  targets = ONLY.split(",").map((s) => s.trim()).filter(Boolean);
  log(`--only 指定 ${targets.length} 个包（跳过变更筛选）`);
} else if (LIMIT > 0) {
  targets = changed.slice(0, LIMIT);
  log(`--limit 取前 ${targets.length} 个`);
}
changed = targets;

if (CHECK || (targets.length === 0 && !ONLY)) {
  if (targets.length === 0) log("✓ 没有变化，无需同步");
  else {
    log("\n变化清单：");
    for (const p of targets.slice(0, 40)) log(`  ${localSlugs.has(p) ? "更新" : "新增"}  ${p}`);
    if (targets.length > 40) log(`  …另有 ${targets.length - 40} 个`);
  }
  process.exit(0);
}

// ───────────────────────── 阶段 1：拉取 ─────────────────────────
head("阶段 1 · 拉取变化的包");
if (STAGE === "all" || STAGE === "fetch") {
  if (!existsSync(FETCH_SCRIPT)) {
    process.stderr.write(`✗ 找不到拉取脚本：${FETCH_SCRIPT}\n  它属于技能 workbuddy-expert-fetch（~/aitools/skills/engineering/），先确认已安装。\n`);
    process.exit(1);
  }
  run("python3", [FETCH_SCRIPT, "--only", changed.join(",")], { label: "拉取" });
} else log("（跳过）");

// ───────────────────────── 阶段 2：把关 ─────────────────────────
head("阶段 2 · 扫描把关（拦掉绑定腾讯内部系统的）");
let allowed = changed;
if (STAGE === "all" || STAGE === "scan") {
  const res = DRY
    ? { status: 0, stdout: '{"hits":{}}' }
    : run("python3", [join(TOOLS, "scan-internal-deps.py"), "--src", join(WORKBUDDY, "experts"), "--json"], { label: "扫描" });
  let hits = {};
  try { hits = JSON.parse(res.stdout ?? "{}").hits ?? {}; } catch { /* 解析失败就当作没命中 */ }
  const blocked = new Set(Object.keys(hits).map((k) => k.split("/").pop()));
  if (blocked.size > 0) {
    log(`⛔ 拦下 ${blocked.size} 个（绑定腾讯内部系统，导入也用不了）：`);
    for (const [key, info] of Object.entries(hits).slice(0, 20)) {
      log(`   ${key}  ←  ${(info.domains ?? []).slice(0, 2).join(", ")}`);
    }
  } else log("✓ 候选包里没有发现内部依赖");
  allowed = changed.filter((p) => !blocked.has(p));
  log(`放行 ${allowed.length} 个`);
} else log("（跳过）");

if (allowed.length === 0) {
  log("\n没有可导入的包，结束。");
  process.exit(0);
}

// ───────────────────────── 阶段 3：导入 ─────────────────────────
head("阶段 3 · 导入名册（更新 = 先删旧包再导）");
if (STAGE === "all" || STAGE === "import") {
  const { rmSync } = await import("node:fs");
  for (const plugin of allowed) {
    if (!localSlugs.has(plugin)) continue;   // 只对已在名册里的做"删旧包"
    // 目录形态的旧包必须删掉：import 脚本的判重不认目录形态，留着会重复导入。
    const found = [];
    const { readdirSync } = await import("node:fs");
    for (const division of readdirSync(EXPERT_DIR)) {
      const d = join(EXPERT_DIR, division, plugin);
      if (existsSync(d)) found.push(d);
    }
    for (const d of found) {
      if (DRY) log(`[dry-run] 删除旧包 ${d.replace(HERE + "/", "")}`);
      else { rmSync(d, { recursive: true, force: true }); log(`删旧包 ${d.replace(HERE + "/", "")}`); }
    }
  }
  // **不要**加 `--include-dups`：那会关掉判重，让 `ai-engineer`（与存量的
  // `engineering-ai-engineer` 同一位专家）这类照样灌进来，产生 slug 冲突。
  // 上一步已经把「要更新的」旧包删掉了，它们不再同名，会正常导入；
  // 真正重复的（去分区前缀后同名 / 同职业名 / 同正文）则被拦下。
  run("python3", [join(TOOLS, "import-workbuddy.py"), "--only", allowed.join(",")], { label: "导入" });
} else log("（跳过）");

// ───────────────────────── 阶段 4：打包 ─────────────────────────
head("阶段 4 · 打包附件");
let rosterBackup = null;
if (STAGE === "all" || STAGE === "pack") {
  // pack-assets 写的是**全量** roster.json，而它按「本地还能打包的包」重算 ——
  // 附件早在云端时算出来是空的。所以先备份，打完再合并回去。
  if (existsSync(ROSTER) && !DRY) {
    rosterBackup = JSON.parse(readFileSync(ROSTER, "utf8"));
    copyFileSync(ROSTER, `${ROSTER}.bak-before-pack`);
    log(`已备份 roster.json（${Object.keys(rosterBackup.packs ?? {}).length} 条）`);
  }
  run("node", [join(TOOLS, "pack-assets.mjs")], { label: "打包" });

  if (rosterBackup) {
    const now = JSON.parse(readFileSync(ROSTER, "utf8"));
    const merged = { ...rosterBackup, packs: { ...(rosterBackup.packs ?? {}), ...(now.packs ?? {}) } };
    writeFileSync(ROSTER, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
    const before = Object.keys(rosterBackup.packs ?? {}).length;
    const after = Object.keys(merged.packs).length;
    log(`roster 合并：${before} → ${after} 条（新增/更新 ${after - before}）`);
  }
} else log("（跳过）");

// 守卫：`dist/assets/` 里每个 tgz 的 sha256 必须与 roster 记的一致。
// 排查中曾因手动恢复 roster 备份造成两者不同源，一路蒙混到上传校验阶段才暴露
// （那时 tgz 已经传上去、清单却是旧的）。宁可在本地多花几秒。
if (!DRY && (STAGE === "all" || STAGE === "pack" || STAGE === "upload")) {
  const { createHash } = await import("node:crypto");
  const { readdirSync, statSync } = await import("node:fs");
  const rosterNow = JSON.parse(readFileSync(ROSTER, "utf8"));
  let checked = 0;
  const bad = [];
  for (const [key, info] of Object.entries(rosterNow.packs ?? {})) {
    const tgz = join(HERE, "dist", "assets", key + ".tar.gz");
    if (!existsSync(tgz)) continue;
    const hash = createHash("sha256").update(readFileSync(tgz)).digest("hex");
    checked += 1;
    if (hash !== info.sha256) bad.push(`${key}（${hash.slice(0, 12)}… ≠ ${String(info.sha256).slice(0, 12)}…）`);
  }
  if (bad.length > 0) {
    process.stderr.write(`\n✗ 打包产物与 roster.json 不同源（${bad.length} 个）：\n`);
    for (const b of bad.slice(0, 5)) process.stderr.write(`    ${b}\n`);
    process.stderr.write("  先跑 node tools/pack-assets.mjs 重新生成，别带着不一致上传。\n");
    process.exit(1);
  }
  log(`同源校验通过：${checked} 个 tgz 的 sha256 与 roster 一致`);
}

// ───────────────────────── 阶段 5：上传 ─────────────────────────
head("阶段 5 · 上传 OBS（同内容自动跳过）");
if (STAGE === "all" || STAGE === "upload") {
  run("node", [join(TOOLS, "upload-obs.mjs")], { label: "上传" });

  // 上传**成功之后**才删本地附件 —— 顺序反了就没东西可传。
  // `--prune` 会重新打包一遍（结果与阶段 4 一致）并重写 roster.json，所以先护住清单再恢复。
  // 少了这一步，仓库里会堆满本该只存在于云端的附件（2026-09-29 实测 data/experts 涨到 1.2 G）。
  if (!DRY) {
    const guard = readFileSync(ROSTER, "utf8");
    run("node", [join(TOOLS, "pack-assets.mjs"), "--prune"], { label: "清理本地附件" });
    writeFileSync(ROSTER, guard, "utf8");
    log("已恢复 roster.json（prune 会重写它）");
  }
} else log("（跳过）");

// ───────────────────────── 收尾 ─────────────────────────
if (!DRY) {
  writeFileSync(ETAG_SNAPSHOT, `${JSON.stringify({ checkedAt: new Date().toISOString(), etags }, null, 2)}\n`, "utf8");
  log(`\n已更新 ETag 快照（${Object.keys(etags).length} 个包）→ ${ETAG_SNAPSHOT.replace(HERE + "/", "")}`);
}
head("下一步（手工）");
log("node tools/verify.mjs            # 自检；数字类期望要跟着改");
log("升版本 + CHANGELOG + git commit  # 工作区铁律：每次提交都升一级版本号");
log("npm publish                  # 发布（prepublishOnly 会重跑构建与自检）");
log("bash ops/tz.sh publish       # 或走运维台一键：升版 → 预检 → 发布快照+tag → 2FA 发布");
log("                             # 别手工 git push --follow-tags：tag 的父链会把本地开发历史送上远端");
