/**
 * 名册缓存、投影与提及解析
 *
 * 本文件由原单文件 `src/client.jsx`（5278 行）按职责拆分而来，**内容逐行保持不变**：
 * 拼接顺序仍是原文件的行序，跨文件引用由 esbuild 打包回同一个
 * `window.__ModuleLoader__.load({id, factory})` 产物（lib/client.js），
 * 因此对产物的断言与行为一律不变。新增代码请放进对应职责的文件。
 */
import { DIVISION_FALLBACK, NS } from "./state.js";
// ---------------------------------------------------------------- 工具函数
export const catalogCache = new Map();

export function snapshotOf(remote) {
  return catalogCache.get(remote);
}

/**
 * 解开 RemoteResult：远程调用成功返回 { ok: true, value }，失败返回 { ok: false, error }。
 * 失败时抛出带 code 的 Error，让调用方按 code 判别（载体失败不能用 try/catch 捕）。
 */
export function unwrap(result, action) {
  if (result !== null && typeof result === "object" && typeof result.ok === "boolean") {
    if (result.ok !== true) {
      const error = new Error(result.error?.message ?? `${action} failed`);
      error.code = result.error?.code;
      throw error;
    }
    return result.value;
  }
  return result;
}

/** 名册读取成功后的通知点：@ 菜单靠它补注册（早期失败后仍能自愈）。 */
export const catalogListeners = new Set();
export function onCatalogLoaded(listener) {
  catalogListeners.add(listener);
  return () => catalogListeners.delete(listener);
}

/**
 * 写名册缓存并**通知订阅者**—— 所有更新路径都必须走这里。
 *
 * 为什么要有这个统一入口：凡是"悄悄"改缓存的路径（设置页启停专家就是），如果直接
 * `catalogCache.set`，靠 {@link onCatalogLoaded} 订阅名册的界面就永远看不到变化 ——
 * 设置页刚启用的专家，靠订阅这份缓存的界面要能立刻看到（否则得刷新整页）
 * （2026-09-15 实测到的缺陷）。写 + 通知绑在一起，就没法只做一半。
 *
 * @param remote - remote 命名空间（缓存按它分实例）。
 * @param next - 新的名册快照（含 enabledSet）。
 * @returns 传进来的快照，方便调用方链式返回。
 */
export function publishCatalog(remote, next) {
  catalogCache.set(remote, next);
  for (const listener of catalogListeners) {
    try {
      listener();
    } catch (cause) {
      console.error("[t-team] 名册通知回调失败：", cause);
    }
  }
  return next;
}

export async function refresh(remote, force = false) {
  const cached = catalogCache.get(remote);
  if (cached !== undefined && !force) return cached;
  const next = unwrap(await remote.getCatalog(), "getCatalog");
  next.enabledSet = new Set(next.enabled);
  return publishCatalog(remote, next);
}

export function displayName(expert, active) {
  return active === "en" ? (expert.nameEn || expert.name) : (expert.name || expert.nameEn);
}

/**
 * 点选即预热云端附件（2026-09-29 用户口径：**点了就是要用**）。
 *
 * 用户在选择器里点了某位专家，就不该再等「真召唤那一下」才开始下载 —— 后台立刻拉起，
 * 而插入引用这个动作本身仍然是瞬时的（**不 await**）。失败也**静默**：这只是提前量，
 * 真正用到时还有召唤时的后台预取与 `fetch_expert_assets` 工具兜底。
 *
 * @param remote - remote 命名空间。
 * @param expert - 被点选的专家（读它的 `assets` 字段判断要不要下）。
 */
const warming = new Set();
export function warmupAssets(remote, expert) {
  if (expert?.assets !== "missing" || warming.has(expert.slug)) return;
  warming.add(expert.slug);
  void remote
    .fetchAssets(expert.slug)
    .then(() => {
      refresh(remote, true);   // 下完刷新名册，UI 上的「未下载」随即消失
      // 头像也随资源包一起下来了 —— 广播一声让面板/弹窗重取头像。
      // 它们只在挂载时取一次，不广播就得重开面板才看得到（2026-09-29 用户实测反馈）。
      try { window.dispatchEvent(new CustomEvent("t-team:avatars-changed")); } catch { /* 非浏览器环境 */ }
    })
    .catch(() => undefined)
    .finally(() => warming.delete(expert.slug));
}

export function displayDescription(expert, active) {
  return active === "en" ? (expert.descriptionEn || expert.description) : expert.description;
}

export function divisionLabel(expert, active) {
  return active === "en" ? (expert.divisionEn || expert.division) : (expert.divisionZh || expert.division);
}

/**
 * 在串首匹配一位专家（`@名字`）：中文名 / 英文名 / slug 都认，互为子串时取更长的那个
 * （例如「X」与「X 助理」）。命中返回 `{ name, display, length }`，否则 undefined。
 */
export function matchExpertAtHead(text, experts, active) {
  if (!text.startsWith("@")) return undefined;
  /** @type {{ name: string, display: string } | undefined} */
  let matched;
  for (const expert of experts ?? []) {
    const names = [displayName(expert, active), expert?.name, expert?.nameEn, expert?.slug]
      .filter((name) => typeof name === "string" && name !== "");
    for (const name of names) {
      if (!text.startsWith(`@${name}`)) continue;
      if (matched === undefined || name.length > matched.name.length) {
        matched = { name, display: displayName(expert, active) };
      }
    }
  }
  return matched;
}

/**
 * 把提示词切成「正文」与「专家」两种片段（专家可出现在**任意位置**，不限于开头）。
 *
 * 面板用它把字符串还原成"文字 + 芯片"的富文本，也用它统计点名了哪些专家
 * （两处判据保持一致：谁渲染引用、谁落成召唤指令，都认同一套 `@名字` 写法。）
 *
 * @returns {{ type: "text" | "expert", text?: string, name?: string }[]}
 */
export function tokenizePrompt(text, experts, active) {
  const raw = String(text ?? "");
  const tokens = [];
  let buffer = "";
  let rest = raw;
  const flush = () => {
    if (buffer === "") return;
    tokens.push({ type: "text", text: buffer });
    buffer = "";
  };
  while (rest !== "") {
    // 只在 `@` 处做名册匹配：逐字符都匹配一遍是 316×3 次比较，白烧性能。
    const hit = rest.startsWith("@") ? matchExpertAtHead(rest, experts, active) : undefined;
    if (hit === undefined) {
      buffer += rest[0];
      rest = rest.slice(1);
      continue;
    }
    flush();
    tokens.push({ type: "expert", name: hit.display });
    rest = rest.slice(hit.name.length + 1);
  }
  flush();
  return tokens;
}

/** 提示词里点名了哪些已启用专家（去重、保持出现顺序）—— 面板据此显示「到点会召唤谁」。 */
export function collectExpertMentions(text, experts, active) {
  const names = [];
  for (const token of tokenizePrompt(text, experts, active)) {
    if (token.type === "expert" && !names.includes(token.name)) names.push(token.name);
  }
  return names;
}

/**
 * 搜索用的「大字符串」按对象缓存（2026-09-29，用户报「弹窗有点卡」之后加的）。
 *
 * 面板里 300+ 位专家，敲**每一个字符**都要把每项的五个字段拼起来再 `toLowerCase()` ——
 * 一次输入等于上千次字符串拼接 + 几百 KB 的临时字符串。这些字段在整个快照生命周期里不会变，
 * 所以按对象缓存一份。用 `WeakMap`：名册刷新后旧对象整体回收，不会攒住内存。
 */
const HAYSTACKS = new WeakMap();
function haystackOf(expert) {
  let cached = HAYSTACKS.get(expert);
  if (cached === undefined) {
    cached = `${expert.name} ${expert.nameEn} ${expert.description} ${expert.descriptionEn} ${expert.slug}`.toLowerCase();
    HAYSTACKS.set(expert, cached);
  }
  return cached;
}

export function matchExpert(expert, active, query) {
  if (query === "") return true;
  // `active` 留在签名里：调用方一直按 (expert, active, query) 传，而这份索引同时含中英两套字段、
  // 语言不影响命中 —— 别为了省一个参数去改十几处调用点。
  return haystackOf(expert).includes(query);
}

export function referenceOf(expert, active) {
  const name = displayName(expert, active);
  return {
    source: `${NS}:${expert.division || DIVISION_FALLBACK}`,
    ref: expert.slug,
    label: name,
    appearance: "session",
    clipboardText: `@${name}\u00a0`,
  };
}
