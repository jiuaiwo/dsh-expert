// @ts-check
/**
 * 随包发布的 skill：把「T专家 运维」做成**随 npm 包分发**的 skill。
 *
 * 为什么是 skill 而不是再加一段 systemPrompt：这些内容只在特定任务里需要（改名册/装机/发布），
 * 常驻提示段是纯浪费 token；skill 的 description 本来就是路由面。
 *
 * 形态：`<包根>/skills/<name>/SKILL.md` 是标准 skill 文件（任何 skill 扫描器都能直接发现），
 * 这里额外把它们注册进宿主的 skill 注册表，这样 npm 安装（插件在 node_modules 里、没有运维台）也能用。
 *
 * 唯一的 skill 是 `t-expert-manager`：本仓运维入口，正文带占位符，注册时按本机布局渲染。
 *
 * 两条刻意的设计：
 *   1. **可选依赖**：走 `ctx.inject(["skills"], …)`，而不是把 `skills` 加进插件的静态 `inject`。
 *      没有 skill 注册表的组合里，插件必须照常加载 —— 附属功能不该让整个插件掉线。
 *   2. **路径不写死在正文里**：注册时解出运维台根目录（`tz.sh` 所在目录）再替换 `{{TZ}}` / `{{OPS_ROOT}}`，
 *      所以同一份 skill 在开发机和别的安装布局下都不会说谎；解不出来就明说"没找到"。
 *
 * @module bundled skills
 */
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** 包内 skills 根目录：`<包根>/skills`。 */
export const SKILLS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "skills");

/**
 * 随包发布的 skill 清单（目录名 = 宿主路由用的 skill 名）。
 *
 * 顺序即注册顺序。缺文件的条目会被跳过并逐条告警，而不是让整段注册失败 ——
 * 一个 skill 文件缺失不该带走其余（见 {@link LOCAL_ONLY_SKILL_NAMES} 的例外）。
 */
export const BUNDLED_SKILL_NAMES = ["t-expert-manager"];

/**
 * **只在本机布局里存在**的 skill：不进 npm 包（见 `package.json` 的 `files`）。
 *
 * 为什么：`t-expert-manager` 的正文整篇都是 `tz.sh` 运维流程，而 `ops/`、`tools/`、`tz.sh`
 * 都不随包发布 —— 从 npm 装的人本来就不该有它，拿了也是一份跑不动的手册。所以它缺席是**预期**，
 * 不能按"缺文件"告警（否则每次启动一条"未注册"，看着像装坏了）。本机从源码装（`tz.sh install`
 * 会把整个 `skills/` 复制进运行副本）时它照常在，运维流程一字不少。
 */
export const LOCAL_ONLY_SKILL_NAMES = ["t-expert-manager"];

/** 只有运维 skill 的正文带 `{{TZ}}` / `{{OPS_ROOT}}` 占位符，其余按原样注册。 */
const PLACEHOLDER_SKILL = "t-expert-manager";

/** 运维台根目录不存在时的正文占位说明（宁可说不知道，也不要指向一个不存在的脚本）。 */
const NO_OPS_ROOT = "（未在本机找到 tz.sh：请用 T_TEAM_REPO 指定插件仓库，或从源码目录运行运维台。）";

function readText(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

/**
 * 取 SKILL.md frontmatter 里的一个单行标量字段。
 *
 * 只认单行，所以随包 skill 的 `description` 必须写在一行里 —— 刻意不引 YAML 依赖，
 * frontmatter 里就只有 name/description 两个键。
 * @param text - 完整 SKILL.md 文本。
 * @param key - 字段名。
 * @returns 字段值；缺失或非单行时返回空串。
 */
export function frontmatterField(text, key) {
  const block = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/u.exec(text);
  if (block === null) return "";
  for (const line of block[1].split(/\r?\n/u)) {
    const match = new RegExp(`^${key}\\s*:\\s*(.+)$`, "u").exec(line.trim());
    if (match !== null) return match[1].trim().replace(/^["']|["']$/gu, "");
  }
  return "";
}

/**
 * 解析运维台根目录（`tz.sh` 所在目录）。
 *
 * 候选按序：`T_TEAM_REPO` 的父目录 → 数据目录的父目录 → 包目录的父目录。
 * 每个候选都要**真的存在 tz.sh** 才算数，否则返回空串（不猜）。
 * @param {object} [options] 调用选项
 * @param {string} [options.dataDir] 数据目录（默认 `~/.t-team`，本机是指向 `<ops>/data` 的软链）
 * @param {string} [options.packageDir] 本包根目录
 * @param {Record<string, string | undefined>} [options.env] 环境变量（测试可注入）
 * @returns 运维台根目录，或空串。
 */
export function resolveOpsRoot({ dataDir, packageDir, env = process.env } = {}) {
  const candidates = [];
  const fromEnv = env?.T_TEAM_REPO;
  if (typeof fromEnv === "string" && fromEnv.trim() !== "") candidates.push(dirname(resolve(fromEnv.trim())));
  if (typeof dataDir === "string" && dataDir.trim() !== "") {
    // 数据目录常常是指向 `<ops>/data` 的软链：先 realpath 再取父目录，才能得到真正的运维台根。
    candidates.push(dirname(realpathOf(dataDir)));
  }
  if (typeof packageDir === "string" && packageDir.trim() !== "") candidates.push(dirname(resolve(packageDir)));
  for (const candidate of candidates) {
    if (existsSync(join(candidate, "tz.sh"))) return candidate;
  }
  return "";
}

/** realpath，失败时退回原路径（目录不存在不该让这里抛错）。 */
function realpathOf(path) {
  try {
    return realpathSync(path);
  } catch {
    return resolve(path);
  }
}

/**
 * 渲染最终正文：替换 `{{TZ}}` 与 `{{OPS_ROOT}}`。
 * @param template - SKILL.md 正文（不含 frontmatter）。
 * @param opsRoot - 运维台根目录（空串 = 未找到）。
 * @returns 替换后的正文；未找到运维台时把两个占位符都换成说明文字。
 */
export function renderOpsSkill({ template, opsRoot }) {
  const root = typeof opsRoot === "string" && opsRoot !== "" ? opsRoot : "";
  const tz = root === "" ? "<找不到 tz.sh>" : join(root, "tz.sh");
  return template
    .replaceAll("{{TZ}}", tz)
    .replaceAll("{{OPS_ROOT}}", root === "" ? NO_OPS_ROOT : root);
}

/**
 * 组织出一个随包 skill，并带上失败原因（供调用方逐条告警）。
 *
 * 与 {@link buildBundledSkill} 的区别只在「失败时说什么」：这里保留原因，那里只看有没有。
 * @param name - skill 名（= `<包根>/skills/<name>/SKILL.md` 的目录名）。
 * @param config - 插件配置；只有运维 skill 用到（由 `root` 推数据目录）。
 * @returns `{ skill }` 或 `{ reason }`；`reason` 是给人/日志看的一句话。
 */
function loadBundledSkill(name, config = {}) {
  const directory = join(SKILLS_ROOT, name);
  const path = join(directory, "SKILL.md");
  const text = readText(path);
  if (text === "") return { reason: `读不到 ${path}` };
  const skillName = frontmatterField(text, "name") || name;
  const description = frontmatterField(text, "description");
  if (description === "") {
    return { reason: `${path} 的 frontmatter 缺 description（没有它就没法作为 skill 的路由面）` };
  }
  let body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, "").trim();
  if (name === PLACEHOLDER_SKILL) {
    const dataDir = typeof config.root === "string" && config.root !== "" ? dirname(config.root) : undefined;
    // `resolveOpsRoot` 取的是传入目录的父目录，所以这里传**包根**（skills/ 的上一层）。
    body = renderOpsSkill({ template: body, opsRoot: resolveOpsRoot({ dataDir, packageDir: resolve(SKILLS_ROOT, "..") }) });
  }
  return {
    skill: {
      name: skillName,
      description,
      content: body,
      // `source` 必须自己给：宿主只给 invocation / provider 兜默认值，**不兜 source**，
      // 而加载路径（skills.get）会校验 source 必须是字符串 —— 少了它，skill 在目录里
      // 显示正常、一加载就抛 `source must be a string`。
      source: "runtime",
      // 让模型能从资源基准目录读到同目录下的附属文件（如运维 skill 的 references/）。
      resourceBase: { kind: "directory", path: directory },
    },
  };
}

/**
 * 逐个构建随包 skill，并**记下**哪些条目没建成以及为什么。
 *
 * 注册方靠 `missing` 逐条告警 —— 缺一个文件不该静默、也不该带走另外两个；
 * 唯一的例外是 {@link LOCAL_ONLY_SKILL_NAMES}：它们不随 npm 包发布，缺席是预期。
 * @param config - 插件配置。
 * @returns `{ skills, missing }`；`skills` 顺序与 {@link BUNDLED_SKILL_NAMES} 一致。
 */
function collectBundledSkills(config = {}) {
  const skills = [];
  const missing = [];
  for (const name of BUNDLED_SKILL_NAMES) {
    const loaded = loadBundledSkill(name, config);
    if (loaded.skill !== undefined) {
      skills.push(loaded.skill);
      continue;
    }
    // 本机专有的 skill（npm 包里本来就没有）：缺席是预期，既不告警也不进 missing。
    if (LOCAL_ONLY_SKILL_NAMES.includes(name)) continue;
    missing.push({ name, reason: loaded.reason });
  }
  return { skills, missing };
}

/**
 * 组织出全部随包 skill（失败条目不进数组，见 {@link collectBundledSkills} 拿原因）。
 * @param config - 插件配置。
 * @returns 定义数组；缺文件的条目被跳过（顺序与 {@link BUNDLED_SKILL_NAMES} 一致）。
 */
export function buildBundledSkills(config = {}) {
  return collectBundledSkills(config).skills;
}

/**
 * 把随包 skill 注册进宿主。`skills` 服务缺席时什么都不做（可选依赖，见文件头注释）。
 *
 * 缺失条目**逐条 warn**（一个 skill 文件缺失不该带走其余，但也不能悄悄消失）；
 * 全军覆没时额外再给一条汇总 warn，保持既有的「都读不到」信号。
 * @param ctx - 插件上下文。
 * @param config - 插件配置。
 * @returns 排入注册的 skill 数；`0` 表示宿主没有 skill 注册表，或包内一个 skill 文件都读不到。
 */
export function installBundledSkills(ctx, config) {
  if (typeof ctx?.inject !== "function") return 0;
  const { skills, missing } = collectBundledSkills(config);
  for (const item of missing) {
    ctx.logger?.warn?.(`[t-team] 随包 skill「${item.name}」未注册：${item.reason}（其余 skill 照常注册）`);
  }
  if (skills.length === 0) {
    /* 没有 `missing` 就说明缺席的全是 LOCAL_ONLY：那是 npm 安装的预期状态，出声反而是噪音。 */
    if (missing.length > 0) {
      ctx.logger?.warn?.(`[t-team] 随包 skill 未注册：读不到 ${join(SKILLS_ROOT, "<name>", "SKILL.md")}`);
    }
    return 0;
  }
  ctx.inject(["skills"], (scoped) => {
    for (const skill of skills) scoped.effect(() => scoped.skills.register(skill));
    ctx.logger?.info?.(`[t-team] 已注册随包 skill：${skills.map((skill) => skill.name).join("、")}`);
  });
  return skills.length;
}
