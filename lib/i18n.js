// @ts-check
/** T专家 host 侧文案与列表/结果渲染。 */

export const NS = "t-team";

const ZH = {
  "error.rootMissing": "T专家 专家目录不存在或无法访问：\"{root}\"。插件首次启动会自动把自带名册播种到该目录；若你手工移动过数据目录，请把 root 指到正确位置。",
  "error.rootNotDir": "T专家 专家目录 \"{root}\" 不是目录",
  "error.catalogEmpty": "在 root \"{root}\" 下没有发现任何专家（*.md）。删掉这个空目录让插件下次启动重新播种，或把 root 改到正确的名册目录。",
  "error.summonRequiresAgent": "当前上下文没有可用的 parent agent，无法召唤专家。",
  "error.providerMissing": "找不到子代理 provider：{provider}",
  "error.providerNoPersona": "provider {provider} 不支持 persona，无法注入专家人格。",
  "error.providerNoToolFilter": "provider {provider} 不支持 toolFilter，无法限制专家可用工具。",
  "error.providerNoMaxDepth": "provider {provider} 不支持 depthLimit，无法应用 maxDepth。",
  "error.expertDisabled": "专家「{name}」尚未启用：请在 设置 → T专家 里先启用它。",
  "error.expertRun": "专家运行未正常结束（{reason}）：{detail}",
  "error.partialOutput": "已产生部分输出：{text}",
  "error.taskEmpty": "task 不能为空",
  "error.taskTooLong": "task 超过 {limit} 个字符",
  "error.specsEmpty": "experts 不能为空",
  "error.specsTooMany": "一次最多召唤 {limit} 位专家",
  "error.specInvalid": "experts[{index}] 需要 expert 与 task 两个字段",
  "error.settingsMissing": "T专家 设置段尚未注册",
  "error.settingsServiceMissing": "宿主没有 settings 服务：T专家 的「专家启停」不可用（名册与召唤相关能力需要它记录已启用专家）。这是宿主装配问题，不是配置错误。",
  "error.customUnknownSlug": "未知专家 slug：{slugs}（这些 slug 不在当前名册里；先用 list_t_experts 取准确的 slug）",
  "error.customSlugInvalid": "slug 只能用 a-z、0-9 与连字符，且以字母或数字开头：\"{slug}\"",
  "error.customSlugTaken": "slug「{slug}」已被内置或自建专家占用",
  "error.customDivisionInvalid": "分类目录名只能用 a-z、0-9、连字符与点，且以字母或数字开头（中文请填在「显示名」里）：\"{division}\"",
  "error.categoryOfficial": "「{division}」是官方分类：名字与存亡都跟随名册同步，只能改自建分类",
  "error.categoryExists": "分类「{division}」已经存在",
  "error.categoryMissing": "找不到自建分类「{division}」",
  "error.categoryNotEmpty": "分类「{division}」下还有 {count} 位自建专家：先把它们移到别的分类或删掉，再删这个分类",
  "error.customNameTaken": "名称「{name}」与已有专家「{other}」重复；重名会让两位都无法被召唤",
  "error.customNameEmpty": "名称不能为空",
  "error.customDescriptionEmpty": "简介不能为空（缺简介的专家不会进名册）",
  "error.customBodyEmpty": "人格正文不能为空（专家靠它工作）",
  "error.customTextTooLong": "{field} 超过 {limit} 个字符",
  "error.customNotCustom": "「{slug}」不是自建专家；内置专家由名册同步维护，请用「复制为自建」再改",
  "error.customMissing": "找不到自建专家「{slug}」",
  "error.customConflict": "这位自建专家已被别处改动，请关掉编辑框重新打开再改",
  "error.customRootMissing": "自建专家目录未配置（customRoot）",
  "list.headerAll": "T专家 花名册（已启用 {total} 位，覆盖 {divisions} 个分类）：",
  "list.headerOne": "分类 {division} 的已启用专家（{count} 位）：",
  "list.emptyAll": "还没有启用任何专家。请在 设置 → T专家 里启用。",
  "list.emptyOne": "分类「{division}」下没有已启用的专家。",
  "list.unknownDivision": "找不到分类「{query}」。可用分类：{divisions}",
  "list.hint": "用 summon_t_expert(expert, task) 召唤其中一位；批量用 summon_t_experts。",
  "summon.batchHeader": "批量召唤 {total} 位专家：成功 {ok} / 失败 {failed}",
  "summon.itemOk": "## {expert}\n{answer}",
  "summon.itemFail": "## {expert}\n失败：{error}",
};

const EN = {
  "error.rootMissing": "T Expert expert directory is missing or unreadable: \"{root}\". The plugin seeds its bundled roster there on first start; point root at the right place if you moved the data directory.",
  "error.rootNotDir": "T Expert expert root \"{root}\" is not a directory",
  "error.catalogEmpty": "No experts (*.md) found under root \"{root}\". Delete this empty directory so the plugin re-seeds on next start, or point root at the real roster.",
  "error.summonRequiresAgent": "No parent agent in this context; cannot summon an expert.",
  "error.providerMissing": "Subagent provider not found: {provider}",
  "error.providerNoPersona": "Provider {provider} does not support persona injection.",
  "error.providerNoToolFilter": "Provider {provider} does not support toolFilter.",
  "error.providerNoMaxDepth": "Provider {provider} does not support depthLimit, so maxDepth cannot apply.",
  "error.expertDisabled": "Expert \"{name}\" is not enabled. Enable it in Settings → T Expert first.",
  "error.expertRun": "Expert run did not complete ({reason}): {detail}",
  "error.partialOutput": "Partial output: {text}",
  "error.taskEmpty": "task must not be empty",
  "error.taskTooLong": "task exceeds {limit} characters",
  "error.specsEmpty": "experts must not be empty",
  "error.specsTooMany": "At most {limit} experts per call",
  "error.specInvalid": "experts[{index}] requires both expert and task",
  "error.settingsMissing": "T Expert settings section is not registered yet",
  "error.settingsServiceMissing": "The host has no settings service: T Expert's enable/disable state is unavailable (the roster and summoning need it to remember which experts are enabled). This is a host wiring problem, not a configuration error.",
  "error.customUnknownSlug": "Unknown expert slug(s): {slugs} (not in the current roster; call list_t_experts for exact slugs)",
  "error.customSlugInvalid": "slug may only use a-z, 0-9 and hyphens, starting with a letter or digit: \"{slug}\"",
  "error.categoryOfficial": "\"{division}\" is an official division: its name and existence follow the built-in roster sync, so only custom divisions can be changed",
  "error.categoryExists": "Division \"{division}\" already exists",
  "error.categoryMissing": "No custom division named \"{division}\"",
  "error.categoryNotEmpty": "Division \"{division}\" still has {count} custom expert(s): move or delete them first, then delete the division",
  "error.customSlugTaken": "slug \"{slug}\" is already taken by a built-in or custom expert",
  "error.customDivisionInvalid": "A division directory name may only use a-z, 0-9, dots and hyphens, starting with a letter or digit (put the Chinese in the display name): \"{division}\"",
  "error.customNameTaken": "Name \"{name}\" duplicates existing expert \"{other}\"; duplicates make both unsummonable",
  "error.customNameEmpty": "Name cannot be empty",
  "error.customDescriptionEmpty": "Description cannot be empty (experts without one never enter the roster)",
  "error.customBodyEmpty": "Persona body cannot be empty (it is what the expert works from)",
  "error.customTextTooLong": "{field} exceeds {limit} characters",
  "error.customNotCustom": "\"{slug}\" is not a custom expert; built-in experts come from the synced roster (copy it as custom first)",
  "error.customMissing": "Custom expert not found: \"{slug}\"",
  "error.customConflict": "This custom expert changed elsewhere; close and reopen the editor",
  "error.customRootMissing": "Custom expert root is not configured (customRoot)",
  "list.headerAll": "T Expert roster ({total} enabled experts across {divisions} divisions):",
  "list.headerOne": "Enabled experts in division {division} ({count}):",
  "list.emptyAll": "No expert is enabled yet. Enable some in Settings → T Expert.",
  "list.emptyOne": "No enabled expert in division \"{division}\".",
  "list.unknownDivision": "Unknown division \"{query}\". Available: {divisions}",
  "list.hint": "Summon one with summon_t_expert(expert, task); use summon_t_experts for a batch.",
  "summon.batchHeader": "Summoned {total} experts: {ok} succeeded / {failed} failed",
  "summon.itemOk": "## {expert}\n{answer}",
  "summon.itemFail": "## {expert}\nfailed: {error}",
};

/** 取文案并按 {name} 占位替换。 */
export function t(locale, key, params = {}) {
  const table = locale === "en" ? EN : ZH;
  let text = table[key] ?? ZH[key] ?? key;
  for (const [key2, value] of Object.entries(params)) {
    text = text.split(`{${key2}}`).join(String(value));
  }
  return text;
}

/**
 * 从宿主 locale 设置读语言，缺失或异常回退 zh。
 *
 * ⚠️ `settings` 是**可选服务**，必须用 `ctx.get("settings")` 懒查，不要写成 `ctx.settings`
 * 属性访问：它不在本插件的静态 `inject` 里，而宿主**没提供**这个服务时，属性访问会被
 * cordis 抛 `cannot get property "settings" without inject`，只剩 try/catch 兜底、
 * 静默退中文（2026-09-13 用真 cordis 4.0.2 实测：宿主**有**这个服务时属性访问读得到，
 * 所以这类 bug 只在"服务不全"的宿主上现形，正常机器上不会露头）。
 * 与 lib/index.js 里 workspaceRegistry / agents 的取值方式保持一致。
 *
 * 这里是**执行期**读取（工具调用那一刻），不是 apply 期探测，所以 `get` 是正确用法：
 * 那一刻 settings 若存在一定已经就绪；不存在就退中文，不会挂起本插件。
 */
export function readLocale(ctx) {
  try {
    const settings = typeof ctx?.get === "function" ? ctx.get("settings") : undefined;
    const section = settings?.get?.("locale");
    const preference = section?.preference;
    if (typeof preference === "string" && preference.toLowerCase().startsWith("en")) return "en";
  } catch {
    /* 读不到就用中文 */
  }
  return "zh";
}

/**
 * 按语言取专家显示名与简介。
 * 中文优先用侧车目录的译文（expert.nameZh / descriptionZh），缺失则回退英文原文。
 */
export function localized(expert, locale) {
  if (locale === "en") {
    return { name: expert.nameEn || expert.name, description: expert.descriptionEn || expert.description };
  }
  return {
    name: expert.nameZh || expert.name,
    description: expert.descriptionZh || expert.description,
  };
}

/**
 * 把执行期名册分组投影成渲染期就绪的形状。
 *
 * 为什么在这里做：`output.render(args, value)` 必须是 `(args, value)` 的纯函数
 * ——同一个 canonical value 在会话日志里回放时必须渲染出同一段文本。而「用哪种语言」
 * 是**执行期**才知道的事实（读宿主 locale 设置），所以它必须和分组一起进 canonical value，
 * 不能在 render 里再读一次宿主。
 *
 * @param groups - `groupByDivision()` 的分组（带 label/labelEn 与 expert 条目）。
 * @param locale - 执行期语言（"zh" | "en"）。
 * @returns 只含渲染所需字段的分组数组。
 */
export function toRenderableGroups(groups, locale) {
  return (Array.isArray(groups) ? groups : []).map((group) => ({
    division: group.division,
    label: locale === "en" ? (group.labelEn ?? group.label ?? group.division) : (group.label ?? group.division),
    count: group.count ?? (group.experts ?? []).length,
    experts: (group.experts ?? []).map((expert) => {
      const { name, description } = localized(expert, locale);
      return {
        slug: expert.slug,
        emoji: expert.emoji ?? "",
        // 渲染期不再读侧车译文：名字与简介在执行期就按 locale 定好。
        name,
        description,
      };
    }),
  }));
}

/**
 * list_t_experts 的文本渲染（纯函数）。
 *
 * 语言只从 `value.locale` 取，不读宿主设置：同一个 `value` 永远渲染出同一段文本。
 * @param args - 工具入参（只用来取 division 过滤词）。
 * @param value - `list_t_experts.execute` 返回的 canonical value。
 */
export function renderList(_args, value) {
  const query = typeof value.query === "string" ? value.query : "";
  const locale = value.locale === "en" ? "en" : "zh";
  const groups = Array.isArray(value.divisions) ? value.divisions : [];
  const total = typeof value.total === "number" ? value.total : 0;
  const allDivisions = Array.isArray(value.allDivisions) ? value.allDivisions : [];
  if (query !== "" && groups.length === 0) {
    return t(locale, "list.unknownDivision", { query, divisions: allDivisions.join(", ") });
  }
  if (total === 0) {
    return query === "" ? t(locale, "list.emptyAll") : t(locale, "list.emptyOne", { division: query });
  }
  const lines = [];
  if (query === "") {
    lines.push(t(locale, "list.headerAll", { total, divisions: groups.length }));
    for (const group of groups) {
      lines.push(`- ${group.label} (${group.division}) — ${group.count}`);
    }
    lines.push(t(locale, "list.hint"));
  } else {
    const group = groups[0];
    lines.push(t(locale, "list.headerOne", { division: `${group.label} (${group.division})`, count: group.count }));
    for (const expert of group.experts ?? []) {
      // 带上 slug：模型可以直接拿它当召唤参数，避免只靠名字解析
      lines.push(`- ${expert.emoji} ${expert.name} (${expert.slug}) — ${expert.description}`);
    }
  }
  return lines.join("\n");
}

/**
 * 把一批召唤结果投影成渲染期就绪的形状。
 * @param results - `summon_t_experts` 的结果项；`expert` 已是**执行期按 locale 定好的显示名**
 *   （`summon_t_experts.execute` 负责解析，render 不再碰名册）。
 * @param locale - 执行期语言（写进 value，供 render 取文案）。
 */
export function toRenderableSummonResults(results, locale) {
  return (Array.isArray(results) ? results : []).map((item) => ({
    expert: typeof item?.expert === "string" ? item.expert : "",
    ok: item?.ok === true,
    answer: item?.answer ?? "",
    error: item?.error ?? "",
  }));
}

/**
 * summon_t_experts 的文本渲染（纯函数）。
 * 语言只从 `value.locale` 取，专家名来自 `value.results[].expert`（执行期已本地化）。
 * @param args - 工具入参（未使用）。
 * @param value - `summon_t_experts.execute` 返回的 canonical value。
 */
export function renderSummonResults(_args, value) {
  const locale = value.locale === "en" ? "en" : "zh";
  const results = Array.isArray(value.results) ? value.results : [];
  const ok = results.filter((item) => item.ok === true).length;
  const lines = [t(locale, "summon.batchHeader", { total: results.length, ok, failed: results.length - ok })];
  for (const item of results) {
    lines.push(item.ok === true
      ? t(locale, "summon.itemOk", { expert: item.expert ?? "", answer: item.answer ?? "" })
      : t(locale, "summon.itemFail", { expert: item.expert ?? "", error: item.error ?? "" }));
  }
  return lines.join("\n\n");
}
