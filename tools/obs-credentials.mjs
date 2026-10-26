/**
 * OBS 凭据的读取与写入 —— `upload-obs.mjs` 与 `set-obs-credentials.mjs` 共用同一份解析逻辑。
 *
 * 为什么抽出来：解析/判重这类逻辑一旦在两地各写一份，迟早漂移成一地改一地没改
 * （2026-09-29 `import-workbuddy.py` 的判重就是这么静默失效的）。
 *
 * ## 存储位置
 *
 * DSH 官方凭据库 `~/.dsh/.credentials.yaml` 的 `refs` 段 —— `version: 1`，
 * 两空格缩进的 `KEY: 值`，值通常不带引号：
 *
 * ```yaml
 * refs:
 *   DEEPSEEK_API_KEY: sk-...
 *   OBS_ACCESS_KEY_ID: ...
 *   OBS_SECRET_ACCESS_KEY: ...
 * version: 1
 * ```
 *
 * **只读这一段的浅解析**，不为两个键引一整个 YAML 依赖。密钥绝不写进仓库、清单或发布包。
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const CREDENTIALS_FILE = join(process.env.HOME ?? "", ".dsh", ".credentials.yaml");

/** 凭据键名 —— 环境变量与凭据库共用同一组名字。 */
export const OBS_AK_KEY = "OBS_ACCESS_KEY_ID";
export const OBS_SK_KEY = "OBS_SECRET_ACCESS_KEY";

/** 浅解析 `refs:` 段 → `{ KEY: 值 }`。撞到下一个顶层键即段落结束。 */
export function readRefs(text) {
  const refs = {};
  let inRefs = false;
  for (const line of text.split(/\r?\n/u)) {
    if (/^refs:\s*$/u.test(line)) {
      inRefs = true;
      continue;
    }
    if (!inRefs) continue;
    if (/^\S/u.test(line)) break; // 顶层键（如 `version:`）→ refs 段结束
    const m = /^\s+([A-Za-z0-9_.-]+):\s*(.*)$/u.exec(line);
    if (m === null) continue;
    const raw = m[2].trim();
    refs[m[1]] = /^(["']).*\1$/u.test(raw) ? raw.slice(1, -1) : raw;
  }
  return refs;
}

/** 从凭据库文件读 refs；文件不存在返回空对象。 */
export function readRefsFromFile(file = CREDENTIALS_FILE) {
  if (!existsSync(file)) return {};
  return readRefs(readFileSync(file, "utf8"));
}

/**
 * 把 `pairs` 写进 `refs:` 段：同名键**原地替换**、新键**追加到段末**，其余内容逐字保留。
 * 纯文本操作（不重新序列化整个文件），这样宿主写下的其它段落不会被我们改坏。
 */
export function upsertRefs(text, pairs) {
  const lines = text.split(/\r?\n/u);
  const start = lines.findIndex((l) => /^refs:\s*$/u.test(l));
  if (start < 0) throw new Error(`凭据文件里没有 refs: 段（${CREDENTIALS_FILE}）`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i] !== "" && /^\S/u.test(lines[i])) {
      end = i;
      break;
    }
  }
  const section = lines.slice(start + 1, end);
  for (const [key, value] of Object.entries(pairs)) {
    const line = `  ${key}: ${value}`;
    const idx = section.findIndex((l) => new RegExp(`^\\s+${key}\\s*:`, "u").test(l));
    if (idx >= 0) section[idx] = line;
    else section.push(line);
  }
  return [...lines.slice(0, start + 1), ...section, ...lines.slice(end)].join("\n");
}

/** 遮蔽显示用：只露前 4 后 4，够辨认是哪个密钥，不足以还原。 */
export function maskSecret(value) {
  if (value === "") return "(未设置)";
  if (value.length <= 8) return "*".repeat(value.length);
  return `${value.slice(0, 4)}…${value.slice(-4)}（${value.length} 位）`;
}

/** 凭据解析结果缓存 —— 一次进程内只读一次盘。 */
let cached;

/**
 * 取 OBS 凭据：**环境变量优先**（临时覆盖 / CI 场景），缺失时回退凭据库。
 * 两者都没有则抛错，错误信息里给出两条可操作的路子。
 */
export function loadObsCredentials() {
  if (cached !== undefined) return cached;
  let ak = process.env[OBS_AK_KEY] ?? "";
  let sk = process.env[OBS_SK_KEY] ?? "";
  let from = "环境变量";
  if (ak === "" || sk === "") {
    const refs = readRefsFromFile();
    ak = refs[OBS_AK_KEY] ?? "";
    sk = refs[OBS_SK_KEY] ?? "";
    from = CREDENTIALS_FILE;
  }
  if (ak === "" || sk === "") {
    throw new Error(
      `缺少 OBS 凭据：设环境变量 ${OBS_AK_KEY} / ${OBS_SK_KEY}，` +
        "或跑 node tools/set-obs-credentials.mjs 一次性写入 ~/.dsh/.credentials.yaml",
    );
  }
  cached = { ak, sk, from };
  return cached;
}
