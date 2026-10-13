#!/usr/bin/env node
/**
 * 附件分发的手动命令 —— 第 2 步的验收工具，平时也用来排查「这位专家的附件到底在不在」。
 *
 *   node tools/assets.mjs status [--root <名册目录>]        # 统计已就位 / 待下载
 *   node tools/assets.mjs fetch <slug> [--root <…>]         # 下载并解包一位
 *   node tools/assets.mjs fetch --all [--root <…>]          # 全部（谨慎，约 116 MB）
 *   node tools/assets.mjs verify <slug>                     # 解包结果与 dist/assets 里的 tar 逐字节比对
 *
 * `--root` 默认是运行时目录 `~/.t-team/experts`。清单固定读仓库里的 `data/roster.json`。
 */

import { readdirSync, existsSync, rmSync, mkdtempSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { homedir, tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(dirname(fileURLToPath(import.meta.url)));
import { loadRoster, packInfoFor, assetsState, ensureAssets, assetUrl, ASSETS_READY, ASSETS_MARKER } from "../lib/fetch-assets.js";

const args = process.argv.slice(2);
const command = args[0] ?? "status";
const valueOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const ROOT = valueOf("--root", join(homedir(), ".t-team", "experts"));
const ROSTER_PATH = join(HERE, "data", "roster.json");
const log = (msg = "") => process.stdout.write(`${msg}\n`);
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

const roster = await loadRoster(ROSTER_PATH);
if (roster === undefined) {
  log(`读不到清单：${ROSTER_PATH}`);
  process.exit(1);
}

/** 把清单里的条目与磁盘上的专家包目录对上。 */
function enumerate() {
  const out = [];
  for (const [id, info] of Object.entries(roster.packs)) {
    const packDir = join(ROOT, info.division, info.slug);
    out.push({ id, info, packDir });
  }
  return out;
}

if (command === "status") {
  log(`名册目录：${ROOT}`);
  log(`清单    ：${ROSTER_PATH}（${Object.keys(roster.packs).length} 个远程附件包）`);
  log("");
  let ready = 0;
  let stale = 0;
  let absent = 0;
  let readyBytes = 0;
  const missing = [];
  for (const item of enumerate()) {
    const state = existsSync(item.packDir) ? await assetsState(item.packDir, item.info) : "absent";
    if (state === ASSETS_READY) {
      ready += 1;
      readyBytes += item.info.rawBytes ?? 0;
    } else if (state === "stale") {
      stale += 1;
      missing.push(item.id);
    } else {
      absent += 1;
      missing.push(item.id);
    }
  }
  log(`  已就位  ${ready} 个（${mb(readyBytes)}）`);
  log(`  待下载  ${absent + stale} 个${stale > 0 ? `（其中 ${stale} 个是旧版本）` : ""}`);
  if (missing.length > 0 && missing.length <= 12) {
    log("");
    for (const id of missing) log(`    · ${id}`);
  } else if (missing.length > 12) {
    log("");
    log(`  前 12 个待下载：`);
    for (const id of missing.slice(0, 12)) log(`    · ${id}`);
  }
  process.exit(0);
}

if (command === "fetch") {
  const target = args[1]?.startsWith("--") === true ? "" : (args[1] ?? "");
  const all = args.includes("--all");
  if (all !== true && target === "") {
    log("用法：node tools/assets.mjs fetch <slug> | fetch --all");
    process.exit(1);
  }
  const items = all ? enumerate() : enumerate().filter((item) => item.info.slug === target);
  if (items.length === 0) {
    log(`清单里没有这个专家：${target}`);
    process.exit(1);
  }
  log(`下载 ${items.length} 个附件包到 ${ROOT} …`);
  let ok = 0;
  const failed = [];
  for (const [index, item] of items.entries()) {
    const started = Date.now();
    const res = await ensureAssets({ packDir: item.packDir, roster, info: item.info });
    if (res.status === ASSETS_READY) {
      ok += 1;
      log(`  ✓ ${item.id}  ${mb(res.bytes ?? 0)}  ${Date.now() - started}ms${res.cached === true ? "（已是最新）" : ""}`);
    } else {
      failed.push(`${item.id}：${res.reason ?? res.status}`);
      log(`  ✗ ${item.id}  ${res.reason ?? res.status}`);
    }
    if (all && (index + 1) % 25 === 0) log(`  … 已处理 ${index + 1}/${items.length}`);
  }
  log("");
  log(`完成：成功 ${ok} / ${items.length}`);
  if (failed.length > 0) process.exit(1);
  process.exit(0);
}

if (command === "verify") {
  const slug = args[1];
  if (slug === undefined) {
    log("用法：node tools/assets.mjs verify <slug>");
    process.exit(1);
  }
  const item = enumerate().find((entry) => entry.info.slug === slug);
  if (item === undefined) {
    log(`清单里没有这个专家：${slug}`);
    process.exit(1);
  }
  const tarPath = join(HERE, "dist", "assets", item.info.division, `${slug}.tar.gz`);
  if (!existsSync(tarPath)) {
    log(`本地没有 ${relative(HERE, tarPath)} —— 先跑 node tools/pack-assets.mjs（或在 OBS 侧用 --verify 校验）`);
    process.exit(1);
  }

  /** 列出一棵树的「相对路径 + sha256」清单。 */
  const fingerprint = (dir) => {
    const out = new Map();
    const walk = (base, current) => {
      for (const entry of readdirSync(current, { withFileTypes: true })) {
        const path = join(current, entry.name);
        if (entry.isDirectory()) walk(base, path);
        else if (entry.isFile()) {
          // 跳过下载器自己写的标记文件 —— 它是本地状态，不属于附件内容。
          if (entry.name === ASSETS_MARKER) continue;
          out.set(relative(base, path), createHash("sha256").update(readFileSync(path)).digest("hex"));
        }
      }
    };
    walk(dir, dir);
    return out;
  };

  log(`比对两种来源的解包结果（${slug}）：`);
  const dirA = mkdtempSync(join(tmpdir(), "t-team-a-"));
  const dirB = mkdtempSync(join(tmpdir(), "t-team-b-"));
  try {
    // A：从 OBS 下载（走 lib/fetch-assets.js，与运行时同一条代码路径）
    log(`  A：${assetUrl(roster, item.info)}`);
    const res = await ensureAssets({ packDir: dirA, roster, info: item.info });
    if (res.status !== ASSETS_READY) {
      log(`  ✗ 下载失败：${res.reason ?? res.status}`);
      process.exit(1);
    }
    // B：本地 dist/assets 里的同一个 tar
    spawnSync("tar", ["-xzf", tarPath, "-C", dirB], { encoding: "utf8" });

    const a = fingerprint(dirA);
    const b = fingerprint(dirB);
    const onlyA = [...a.keys()].filter((k) => !b.has(k));
    const onlyB = [...b.keys()].filter((k) => !a.has(k));
    const differing = [...a.keys()].filter((k) => b.has(k) && a.get(k) !== b.get(k));
    log("");
    log(`  文件数：OBS ${a.size} / 本地 tar ${b.size}`);
    if (onlyA.length > 0) log(`  仅 OBS 有：${onlyA.slice(0, 5).join(", ")}`);
    if (onlyB.length > 0) log(`  仅本地有：${onlyB.slice(0, 5).join(", ")}`);
    if (differing.length > 0) log(`  内容不同：${differing.slice(0, 5).join(", ")}`);
    const same = onlyA.length === 0 && onlyB.length === 0 && differing.length === 0;
    log("");
    log(same ? "  ✓ 逐字节一致" : "  ✗ 不一致");
    process.exit(same ? 0 : 1);
  } finally {
    rmSync(dirA, { recursive: true, force: true });
    rmSync(dirB, { recursive: true, force: true });
  }
}

log(`未知命令：${command}`);
log("可用：status / fetch <slug> / fetch --all / verify <slug>");
process.exit(1);
