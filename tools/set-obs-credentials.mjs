#!/usr/bin/env node
/**
 * 一次性把华为云 OBS 的 AK/SK 写进 DSH 官方凭据库（`~/.dsh/.credentials.yaml` 的 `refs` 段）。
 * 写进去之后 `tools/upload-obs.mjs` 会自动回退读它 —— 不必每次手动 export，
 * 「一条提示词跑完整同步（含上传）」才真正成立。
 *
 *   node tools/set-obs-credentials.mjs             # 交互式输入（隐藏回显，密钥不进对话历史）
 *   node tools/set-obs-credentials.mjs --show      # 只看当前配没配（遮蔽显示）
 *   node tools/set-obs-credentials.mjs --from-env  # 从环境变量 OBS_ACCESS_KEY_ID / _SECRET_ACCESS_KEY 写入
 *
 * 安全约定：写前自动备份原文件（`.bak-obs-<时间戳>`，600 权限）；明文只在内存里，
 * **不打印、不进仓库、不进发布包**。写后回读校验，确保原有凭据一个都没丢。
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, chmodSync } from "node:fs";
import {
  CREDENTIALS_FILE,
  OBS_AK_KEY,
  OBS_SK_KEY,
  maskSecret,
  readRefs,
  upsertRefs,
} from "./obs-credentials.mjs";

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const valueOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};

const FILE = valueOf("--file", CREDENTIALS_FILE);
const SHOW = has("--show");
const FROM_ENV = has("--from-env");

const log = (msg = "") => process.stdout.write(`${msg}\n`);

/** 隐藏回显地读一行 —— 密钥不打屏、也不进任何日志。 */
function askHidden(prompt) {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY !== true) {
      reject(new Error("当前不是交互终端，改用 --from-env（或在终端里跑本命令）"));
      return;
    }
    process.stdout.write(prompt);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    let buf = "";
    const finish = (value) => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      process.stdout.write("\n");
      resolve(value);
    };
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") return finish(buf);
        if (ch === "\u0003") {
          stdin.setRawMode(false);
          process.stdout.write("\n");
          process.exit(130);
        }
        if (ch === "\u007f" || ch === "\b") {
          if (buf.length > 0) {
            buf = buf.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        buf += ch;
        process.stdout.write("*");
      }
      return undefined;
    };
    stdin.on("data", onData);
  });
}

/** 现状：环境变量与凭据库各有没有。 */
if (SHOW) {
  const refs = existsSync(FILE) ? readRefs(readFileSync(FILE, "utf8")) : {};
  log(`凭据库：${FILE}`);
  log(`  是否存在文件  : ${existsSync(FILE) ? "是" : "否"}`);
  log(`  ${OBS_AK_KEY}   : ${maskSecret(refs[OBS_AK_KEY] ?? "")}`);
  log(`  ${OBS_SK_KEY}   : ${maskSecret(refs[OBS_SK_KEY] ?? "")}`);
  log("环境变量（优先于凭据库）：");
  log(`  ${OBS_AK_KEY}   : ${maskSecret(process.env[OBS_AK_KEY] ?? "")}`);
  log(`  ${OBS_SK_KEY}   : ${maskSecret(process.env[OBS_SK_KEY] ?? "")}`);
  log("");
  log("上传脚本取用顺序：环境变量 → 凭据库。");
  process.exit(0);
}

/** 取要写入的值：--from-env 从环境变量，否则交互式问。 */
let ak = "";
let sk = "";
if (FROM_ENV) {
  ak = process.env[OBS_AK_KEY] ?? "";
  sk = process.env[OBS_SK_KEY] ?? "";
  if (ak === "" || sk === "") {
    log(`✗ --from-env 但环境变量 ${OBS_AK_KEY} / ${OBS_SK_KEY} 有空值`);
    process.exit(1);
  }
} else {
  log("华为云 OBS 凭据（AK/SK 在「我的凭证 → 访问密钥」里；输入时不回显）：");
  ak = await askHidden(`  ${OBS_AK_KEY}: `);
  sk = await askHidden(`  ${OBS_SK_KEY}: `);
}
ak = ak.trim();
sk = sk.trim();

if (ak.length < 10 || sk.length < 10) {
  log("✗ AK/SK 长度明显不对（华为云 AK 20 位、SK 40 位左右），已中止，未写入任何内容");
  process.exit(1);
}
if (/\s/u.test(ak) || /\s/u.test(sk)) {
  log("✗ AK/SK 里含空白字符，已中止（多半是复制时带了换行）");
  process.exit(1);
}

/** 目标文件不存在时给出最小骨架，避免 upsert 无处可落。 */
const before = existsSync(FILE) ? readFileSync(FILE, "utf8") : "refs:\nversion: 1\n";
const refsBefore = readRefs(before);
const after = upsertRefs(before, { [OBS_AK_KEY]: ak, [OBS_SK_KEY]: sk });

// 写前备份 + 保持 600 —— 凭据库是宿主的文件，坏了会连带其它凭据一起读不出。
if (existsSync(FILE)) {
  const stamp = new Date().toISOString().replace(/[:.]/gu, "-");
  const backup = `${FILE}.bak-obs-${stamp}`;
  copyFileSync(FILE, backup);
  chmodSync(backup, 0o600);
  log(`  已备份原文件 → ${backup}`);
}
writeFileSync(FILE, after, "utf8");
chmodSync(FILE, 0o600);

// 回读校验：**除本次写入的两个键外**，原有凭据一个都不能丢、不能变
// （宿主可能往 refs 里放别的凭据，改坏它们会连带其它功能一起失效）。
const refsAfter = readRefs(readFileSync(FILE, "utf8"));
const written = new Set([OBS_AK_KEY, OBS_SK_KEY]);
const broken = Object.keys(refsBefore).filter(
  (k) => !written.has(k) && refsAfter[k] !== refsBefore[k],
);
const ok =
  broken.length === 0 && refsAfter[OBS_AK_KEY] === ak && refsAfter[OBS_SK_KEY] === sk;
if (!ok) {
  writeFileSync(FILE, before, "utf8"); // 自动回滚，别把宿主的凭据库留在半坏状态
  chmodSync(FILE, 0o600);
  log("");
  log("✗ 回读校验失败，已自动回滚到写入前的内容");
  if (broken.length > 0) log(`  受影响的原有凭据：${broken.join(", ")}`);
  else log("  写入的 AK/SK 与预期不一致");
  process.exit(1);
}

log("");
log(`✓ 已写入 ${FILE}`);
log(`  ${OBS_AK_KEY}   : ${maskSecret(ak)}`);
log(`  ${OBS_SK_KEY}   : ${maskSecret(sk)}`);
log(`  原有凭据 ${Object.keys(refsBefore).length} 条全部完好`);
log("");
log("现在可以直接跑（无需再 export 任何环境变量）：");
log("  node tools/upload-obs.mjs --verify      # 只校验远端，适合先探一下凭据通不通");
