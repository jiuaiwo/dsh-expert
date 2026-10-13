// @ts-check
/**
 * 把「本插件关掉的技能」叠到 DSH 官方 invocation 策略上。
 *
 * 只关 modelInvocable：与 SKILL.md 里 `disable-model-invocation: true` 同一语义。
 * userInvocable 不动，斜杠菜单仍能手动点。
 * 原生已经 modelInvocable=false 的条目不会被本插件打开。
 */

const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/** @param {string} name */
export function isSkillName(name) {
  return typeof name === "string" && SKILL_NAME.test(name);
}

/**
 * @param {{ modelInvocable?: boolean, userInvocable?: boolean } | undefined} invocation
 * @param {boolean} gated
 */
export function overlayInvocation(invocation, gated) {
  const modelInvocable = invocation?.modelInvocable !== false;
  const userInvocable = invocation?.userInvocable !== false;
  if (!gated) {
    return {
      modelInvocable,
      userInvocable,
    };
  }
  return {
    modelInvocable: false,
    userInvocable,
  };
}

/**
 * @template {{ name: string, invocation?: { modelInvocable?: boolean, userInvocable?: boolean } }} T
 * @param {T} skill
 * @param {ReadonlySet<string>} disabled
 * @returns {T}
 */
export function overlaySkill(skill, disabled) {
  const gated = disabled.has(skill.name);
  if (!gated) return skill;
  return {
    ...skill,
    invocation: overlayInvocation(skill.invocation, true),
  };
}

/**
 * @typedef {{ key: string, kind: string, name?: string, skills?: Iterable<{ name?: unknown }> }} SkillViewInput
 */

/**
 * 视角是「谁在读这份目录」：宿主全局层、默认 preset、某个活跃会话、或磁盘扫描。
 * 每个视角各读一份，并集落成设置页的清单，`views` 让面板能按视角回看。
 * @param {Iterable<{ name?: unknown, invocation?: { modelInvocable?: boolean, userInvocable?: boolean }, description?: unknown, source?: unknown, provider?: unknown }>} skills
 * @param {ReadonlySet<string>} disabled
 * @param {readonly SkillViewInput[]} views
 */
export function projectCatalog(skills, disabled, views = []) {
  /** @type {Map<string, string[]>} */
  const viewsByName = new Map();
  for (const view of views) {
    for (const skill of view.skills ?? []) {
      if (typeof skill?.name !== "string" || !isSkillName(skill.name)) continue;
      const keys = viewsByName.get(skill.name);
      if (keys === undefined) viewsByName.set(skill.name, [view.key]);
      else if (!keys.includes(view.key)) keys.push(view.key);
    }
  }
  /** @type {ReturnType<typeof projectSkill>[]} */
  const rows = [];
  for (const skill of skills) {
    if (typeof skill?.name !== "string" || !isSkillName(skill.name)) continue;
    rows.push(projectSkill(/** @type {never} */ (skill), disabled, viewsByName.get(skill.name) ?? []));
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));
  const counts = {
    total: rows.length,
    modelVisible: 0,
    gated: 0,
    nativeOff: 0,
  };
  for (const row of rows) {
    if (!row.nativeModel) counts.nativeOff += 1;
    else if (row.gated) counts.gated += 1;
    else counts.modelVisible += 1;
  }
  /**
   * 视角统计与 counts 同构：一次遍历按同一判据分类累加，
   * 所以 modelVisible + gated + nativeOff === total 天然成立，面板直接用这几个数。
   */
  const viewRows = views.map((view) => {
    const names = new Set();
    for (const skill of view.skills ?? []) {
      if (typeof skill?.name === "string" && isSkillName(skill.name)) names.add(skill.name);
    }
    const row = { key: view.key, kind: view.kind, name: view.name ?? "", total: 0, modelVisible: 0, gated: 0, nativeOff: 0 };
    for (const skill of rows) {
      if (!names.has(skill.name)) continue;
      row.total += 1;
      if (!skill.nativeModel) row.nativeOff += 1;
      else if (skill.gated) row.gated += 1;
      else row.modelVisible += 1;
    }
    return row;
  });
  return { skills: rows, counts, views: viewRows };
}

/**
 * @param {{ name: string, invocation?: { modelInvocable?: boolean, userInvocable?: boolean }, description?: unknown, source?: unknown, provider?: unknown }} skill
 * @param {ReadonlySet<string>} disabled
 * @param {readonly string[]} views
 */
export function projectSkill(skill, disabled, views = []) {
  const nativeModel = skill.invocation?.modelInvocable !== false;
  const nativeUser = skill.invocation?.userInvocable !== false;
  const gated = disabled.has(skill.name);
  const description = typeof skill.description === "string" ? skill.description : "";
  return {
    name: skill.name,
    description: description.length > 240 ? `${description.slice(0, 237)}…` : description,
    source: typeof skill.source === "string" && skill.source !== "" ? skill.source : "unknown",
    provider: typeof skill.provider === "string" && skill.provider !== "" ? skill.provider : "unknown",
    nativeModel,
    nativeUser,
    gated,
    modelVisible: nativeModel && !gated,
    views: [...views],
  };
}

/**
 * @param {unknown} names
 * @returns {string[]}
 */
export function sanitizeDisabled(names) {
  if (!Array.isArray(names)) return [];
  const unique = new Set();
  for (const item of names) {
    if (typeof item !== "string") continue;
    const name = item.trim();
    if (!isSkillName(name)) continue;
    unique.add(name);
  }
  return [...unique].sort();
}
