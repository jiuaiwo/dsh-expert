/**
 * 输入区插入工具（引用 chip / 技能名）
 *
 * 本文件由原单文件 `src/client.jsx`（5278 行）按职责拆分而来，**内容逐行保持不变**：
 * 拼接顺序仍是原文件的行序，跨文件引用由 esbuild 打包回同一个
 * `window.__ModuleLoader__.load({id, factory})` 产物（lib/client.js），
 * 因此对产物的断言与行为一律不变。新增代码请放进对应职责的文件。
 */
export function resolveInputTarget(ctx, sessionId) {
  const sessions = ctx.sessions;
  const targetSessionId = sessionId ?? sessions?.list?.getSnapshot?.().current;
  if (targetSessionId === undefined || targetSessionId === null) return undefined;
  const actx = sessions?.scope?.(targetSessionId) ?? sessions?.binding?.(targetSessionId)?.ctx;
  if (actx === undefined) return undefined;
  return actx.get?.("conversation")?.input?.for?.(actx);
}

/** 草稿开头已有 chip 的末端，保证新增专家追加在已有专家之后。 */
export function referencePrefixEnd(snapshot) {
  const offsets = new Set((snapshot.occurrences ?? []).map((occurrence) => occurrence.offset));
  let end = 0;
  while (offsets.has(end)) {
    end += 1;
    if (snapshot.draft[end] === " ") end += 1;
  }
  while (snapshot.draft[end] === "\ufffc") {
    end += 1;
    if (snapshot.draft[end] === " ") end += 1;
  }
  return end;
}

/** 把一位专家作为原生引用插入当前草稿；返回是否成功。 */

/**
 * 把「使用技能「X」」这类提示写进当前草稿（不发送）。
 *
 * 技能在宿主里只有「模型通过 skill 工具加载」这一条路（`invocation.userInvocable` 只是允许用户点名）。
 * 好在技能的 name / description 本来就在模型的可用技能目录里，所以这里只需要**点名**：
 * 追加到草稿末尾并留一个空格，用户接着写任务，模型看到名字就会去加载那个技能。
 */
/** 技能清单缓存（按会话分）：列表变化不频繁，跨浮层打开复用，省掉每次几秒的发现。 */
export const skillsCache = new Map();
/** 最多缓存多少个会话的技能清单：每个会话 250+ 条技能对象，无上限会随会话数单调增长。 */
export const SKILLS_CACHE_MAX = 20;
/** 写入并按 LRU 淘汰最老的会话，保证缓存大小有界。 */
export function cacheSkills(sessionId, list) {
  if (skillsCache.has(sessionId)) skillsCache.delete(sessionId); // 命中过就挪到最新
  skillsCache.set(sessionId, list);
  while (skillsCache.size > SKILLS_CACHE_MAX) {
    const oldest = skillsCache.keys().next().value;
    skillsCache.delete(oldest);
  }
}

export function insertSkillHint(target, text) {
  if (target === undefined || typeof target.insertText !== "function") return false;
  const snapshot = target.state.getSnapshot();
  const draft = String(snapshot.draft ?? "");
  // 前面已有内容就空一格，免得和上一个字粘在一起；插完再补个空格，光标正好落在该写任务的地方。
  const prefix = draft === "" || /\s$/u.test(draft) ? "" : " ";
  const at = draft.length;
  return target.insertText(`${prefix}${text} `, { start: at, end: at, draftRev: snapshot.draftRev }) === true;
}

export function insertAtTarget(target, reference) {
  if (target === undefined || typeof target.insertReference !== "function") return false;
  const snapshot = target.state.getSnapshot();
  const offset = referencePrefixEnd(snapshot);
  return target.insertReference(reference, { start: offset, end: offset, draftRev: snapshot.draftRev }) === true;
}
