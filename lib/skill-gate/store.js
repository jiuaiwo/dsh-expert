// @ts-check
/**
 * 技能开关名单：~/.dsh/skill-gate.json
 *
 * 故意不走 dsh-settings：那是可选服务，apply 期探测会漏；这份文件也方便手工编辑。
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import { sanitizeDisabled } from "./overlay.js";

export const STORE_VERSION = 1;
export const DEFAULT_STORE_NAME = "skill-gate.json";

/** @param {string | undefined} configured */
export function defaultStorePath(configured) {
  if (typeof configured === "string" && configured.trim() !== "") return configured.trim();
  return join(homedir(), ".dsh", DEFAULT_STORE_NAME);
}

/**
 * @param {string} raw
 * @param {string} [path] - 仅用于错误日志；不传则日志不带路径（测试场景）。
 * @returns {{ version: number, disabled: string[] }}
 */
export function parseStore(raw, path) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    // JSON 损坏：0.4.7 之前是空 catch 静默吃，UI 会表现为"技能开关回到默认状态"且无任何线索；
    // 现在出声（保留原行为 = 回到默认），下次写盘会用原子 rename 把坏文件替换掉。
    console.warn(`[skill-gate] 解析${path !== undefined ? ` ${path}` : ""} 失败，按默认继续：`,
      error?.message ?? error);
    return { version: STORE_VERSION, disabled: [] };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { version: STORE_VERSION, disabled: [] };
  }
  const version = typeof parsed.version === "number" && Number.isInteger(parsed.version)
    ? parsed.version
    : STORE_VERSION;
  return {
    version,
    disabled: sanitizeDisabled(parsed.disabled),
  };
}

/** @param {Iterable<string>} disabled */
export function serializeStore(disabled) {
  return `${JSON.stringify({
    version: STORE_VERSION,
    disabled: sanitizeDisabled([...disabled]),
  }, null, 2)}\n`;
}

/**
 * @param {string} path
 * @returns {Promise<{ version: number, disabled: string[] }>}
 */
export async function readStore(path) {
  try {
    return parseStore(await readFile(path, "utf8"), path);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return { version: STORE_VERSION, disabled: [] };
    }
    throw error;
  }
}

/**
 * @param {string} path
 * @param {Iterable<string>} disabled
 */
export async function writeStore(path, disabled) {
  const body = serializeStore(disabled);
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, body, "utf8");
  await rename(tmp, path);
}
