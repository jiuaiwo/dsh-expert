// @ts-check
/**
 * 扫描默认技能根（~/.dsh/skills、~/.agents/skills）。
 *
 * 设置页不能只靠 `ctx.skills.snapshot({})`：web 上 skill-filesystem 挂在 preset 层，
 * 不带 scope 时全局层往往只剩宿主 runtime 注册的那几条。
 */
import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { isSkillName } from "./overlay.js";

/** @param {string} [configuredHome] */
export function defaultSkillRoots(configuredHome) {
  const dshHome = typeof configuredHome === "string" && configuredHome.trim() !== ""
    ? configuredHome.trim()
    : (process.env.DSH_HOME ?? join(homedir(), ".dsh"));
  const agentsHome = process.env.DSH_AGENTS_HOME ?? join(homedir(), ".agents");
  return [
    { path: join(dshHome, "skills"), source: "user-dsh" },
    { path: join(agentsHome, "skills"), source: "user-agents" },
  ];
}

/**
 * @param {Iterable<{ path: string, source: string }>} roots
 * @returns {Promise<{ name: string, description: string, source: string, provider: string, invocation: { modelInvocable: boolean, userInvocable: boolean } }[]>}
 */
export async function scanSkillRoots(roots) {
  /** @type {Map<string, { name: string, description: string, source: string, provider: string, invocation: { modelInvocable: boolean, userInvocable: boolean } }>} */
  const found = new Map();
  for (const root of roots) {
    let entries;
    try {
      entries = await readdir(root.path, { withFileTypes: true });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") continue;
      throw error;
    }
    for (const entry of entries) {
      if (entry.name === ".system" || entry.name.startsWith(".")) continue;
      const full = join(root.path, entry.name);
      const file = entry.isDirectory()
        ? join(full, "SKILL.md")
        : (entry.isFile() && entry.name.endsWith(".md") ? full : "");
      if (file === "") continue;
      const parsed = await readSkillSummary(file, entry.isDirectory() ? entry.name : entry.name.replace(/\.md$/u, ""));
      if (parsed === undefined) continue;
      if (!found.has(parsed.name)) {
        found.set(parsed.name, {
          ...parsed,
          source: root.source,
          provider: "filesystem",
        });
      }
    }
  }
  return [...found.values()];
}

/**
 * @param {Iterable<Iterable<{ name?: unknown } | undefined> | undefined | null>} lists
 * @returns {object[]}
 */
export function mergeSkillLists(lists) {
  /** @type {Map<string, object>} */
  const byName = new Map();
  for (const list of lists) {
    if (list == null) continue;
    for (const skill of list) {
      if (skill === undefined || skill === null || typeof skill.name !== "string") continue;
      if (!byName.has(skill.name)) byName.set(skill.name, skill);
    }
  }
  return [...byName.values()];
}

/**
 * @param {string} path
 * @param {string} fallbackName
 */
async function readSkillSummary(path, fallbackName) {
  let raw;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return undefined;
    throw error;
  }
  const fields = parseFrontmatterScalars(raw);
  const name = isSkillName(fields.name ?? "") ? fields.name : (isSkillName(fallbackName) ? fallbackName : "");
  if (name === "") return undefined;
  const nativeOff = truthy(fields["disable-model-invocation"]);
  return {
    name,
    description: fields.description ?? "",
    invocation: {
      modelInvocable: !nativeOff,
      userInvocable: !falsey(fields["user-invocable"]),
    },
  };
}

/** @param {string} raw */
export function parseFrontmatterScalars(raw) {
  const block = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(raw);
  if (block === null) return {};
  /** @type {Record<string, string>} */
  const fields = {};
  for (const line of block[1].split(/\r?\n/u)) {
    const match = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/u.exec(line.trim());
    if (match === null) continue;
    fields[match[1]] = stripScalar(match[2]);
  }
  return fields;
}

/** @param {string} value */
function stripScalar(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/** @param {string | undefined} value */
function truthy(value) {
  if (value === undefined) return false;
  const lowered = value.trim().toLowerCase();
  return lowered === "true" || lowered === "yes" || lowered === "1";
}

/** @param {string | undefined} value */
function falsey(value) {
  if (value === undefined) return false;
  const lowered = value.trim().toLowerCase();
  return lowered === "false" || lowered === "no" || lowered === "0";
}
