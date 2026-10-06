/**
 * 输入区「T专家」按钮与专家挑选弹窗
 *
 * 本文件由原单文件 `src/client.jsx`（5278 行）按职责拆分而来，**内容逐行保持不变**：
 * 拼接顺序仍是原文件的行序，跨文件引用由 esbuild 打包回同一个
 * `window.__ModuleLoader__.load({id, factory})` 产物（lib/client.js），
 * 因此对产物的断言与行为一律不变。新增代码请放进对应职责的文件。
 */
import React from "react";
import { displayDescription, displayName, divisionLabel, matchExpert, referenceOf, refresh, snapshotOf, unwrap, warmupAssets } from "./catalog.js";
import { cacheSkills, insertSkillHint, skillsCache } from "./insert.js";
import { FloatingPop, PopIcon, divisionIconName, tintOf } from "./ui.jsx";
// ---------------------------------------------------------------- 工具行按钮
export function SummonButton({ t, ctx, remote, getActive, insertReference, insertSkillHint, sessionId, preview, rootRemote }) {
  // preview 只给离线预览用（弹窗默认是关闭状态，SSR 渲染不出来）
  const [open, setOpen] = React.useState(preview?.open === true);
  // 点开后默认停在「专家」（用户口径：这个浮层主要就是用来挑专家的；标签顺序也是专家打头）。
  const [popTab, setPopTab] = React.useState(preview?.tab ?? "experts");
  /** 技能清单：null = 还没拉过（切到技能标签时才拉，免得白跑一次 remote）。 */
  const [skills, setSkills] = React.useState(null);

  // 本地已有的专家头像（data URL）。没下载过资源的专家不在里面 → 回退 emoji/图标，
  // 与面板卡片同一套口径（「下载过才显示真头像」）。
  const [avatars, setAvatars] = React.useState({});
  // 头像刷新计数器：下载完头像后 warmupAssets 会广播，+1 触发下面的 effect 重取。
  const [avatarRev, setAvatarRev] = React.useState(0);
  React.useEffect(() => {
    const onAvatarsChanged = () => setAvatarRev((n) => n + 1);
    window.addEventListener("t-team:avatars-changed", onAvatarsChanged);
    return () => window.removeEventListener("t-team:avatars-changed", onAvatarsChanged);
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      // RPC 返回值外面套着一层信封（形如 {ok, value}），必须 unwrap —— 与 getCatalog 一致（catalog.js）。
      let map = {};
      try { map = unwrap(await remote?.getAvatars?.(), "getAvatars") ?? {}; } catch { map = {}; }
      if (alive && map !== undefined && map !== null) setAvatars(map);
    })();
    return () => { alive = false; };
  // 依赖用 []（只跑一次）：desktop 上 remote 走 /api 网关、引用不稳定，写 [remote]
  // 会让 effect 反复重挂、cleanup 把 alive 置回 false，数据取到了却被丢弃（2026-09-29 实测）。
  }, [avatarRev]);
  const [skillQuery, setSkillQuery] = React.useState("");
  /** 取数失败的原因（渲染到界面，便于当场定位，而不是在 console 里来回）。 */
  const [skillsDiag, setSkillsDiag] = React.useState("");

  /**
   * 技能清单走**官方** remote（`skills/list`，按会话取）—— 与输入框里那个 `/skill` 菜单完全同源。
   * ⚠️ 这个 effect 必须待在 SummonButton 里：它读的是本组件的 `open` / `popTab` / `skills`。
   *    （上一版被误放进 ExpertPicker，结果技能标签永远停在 null，且那个组件一开会因 popTab 未定义抛错。）
   */
  React.useEffect(() => {
    // 浮层一打开就后台拉取（不是等切到技能标签）：首次 list 要发现 250+ 个技能、可能几秒。
    // stale-while-revalidate：命中缓存先秒开旧列表，同时仍后台重新 list 刷新 ——
    // 这样新装/删除的技能会在下次打开浮层后几秒内自动反映出来，又不必每次干等。
    if (!open) return undefined;
    const cached = skillsCache.get(sessionId);
    if (cached !== undefined) setSkills(cached);
    let alive = true;
    void (async () => {
      try {
        const remoteObj = rootRemote;
        const skillNs = remoteObj?.skills;
        if (skillNs === undefined || skillNs === null) {
          // 有旧列表就别清空：接口挂了保留上次结果，比刷成空白好。
          if (alive && cached === undefined) {
            setSkills([]);
            setSkillsDiag(`rootRemote.skills 不存在（sessionId=${JSON.stringify(sessionId)}，rootRemote=${typeof remoteObj}，skills=${typeof skillNs}）`);
          }
          return;
        }
        if (typeof skillNs.list !== "function") {
          if (alive && cached === undefined) { setSkills([]); setSkillsDiag(`skills.list 不是函数（${typeof skillNs.list}）`); }
          return;
        }
        const result = await skillNs.list({ sessionId });
        if (result?.ok !== true) {
          if (alive && cached === undefined) {
            setSkills([]);
            setSkillsDiag(`skills.list 返回 !ok：${JSON.stringify(result?.error ?? result)}`);
          }
          return;
        }
        const list = result.value?.skills ?? [];
        cacheSkills(sessionId, list);
        if (alive) {
          setSkills(list);
          setSkillsDiag(list.length > 0 ? "" : `ok 但 0 项（value=${JSON.stringify(result.value)}）`);
        }
      } catch (error) {
        if (alive && cached === undefined) {
          setSkills([]);
          setSkillsDiag(`异常：${error instanceof Error ? (error.message || error.name) : String(error)}`);
        }
      }
    })();
    return () => { alive = false; };
  }, [open, sessionId, rootRemote]);

  const [popNote, setPopNote] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [failed, setFailed] = React.useState("");
  /** 分类筛选：`"all"` = 不筛（用户口径里这一项就叫「全部」，与参考图一致）。 */
  const [division, setDivision] = React.useState("all");
  /** 分类行右侧还有没有未露出的内容（决定右端那个圆形箭头显不显示，参考图里那个）。 */
  const [divMore, setDivMore] = React.useState(false);
  /** 分类行左侧是否已经滚过去了 —— 滚过去就得给一个回去的箭头，否则回不到最前面的分类。 */
  const [divBack, setDivBack] = React.useState(false);
  const rootRef = React.useRef(null);
  /** 分类标签行的滚动容器（横向滚动 + 溢出检测 + 滚轮左右滚）。 */
  const divRef = React.useRef(null);
  /** 列表的滚动容器：换分类或改搜索词时回到顶部。 */
  const listRef = React.useRef(null);
  const snap = snapshotOf(remote);

  async function toggle() {
    const next = !open;
    setOpen(next);
    setFailed("");
    setPopNote("");
    if (!next) return;
    // stale-while-revalidate：先让弹窗用缓存的 snap 立即显示（上面 snapshotOf 已拿过），
    // 后台再拉一次最新的；不再 await —— 首次打开不该被最慢的那次 RPC 卡住。
    void refresh(remote, false).catch(() => undefined);
  }

  const active = getActive();
  // 标签顺序（用户口径）：专家 → 技能。
  const popTabs = [["experts", "tab.experts"], ["skills", "tab.skills"]];

  /**
   * 派生数据一律 `useMemo`（2026-09-29 用户报「弹窗有点卡」之后收的）。
   *
   * 面板里有 300+ 位专家、250+ 个技能，而这些过滤/分组原先写在渲染函数体里：**任何** state 变化
   * （浮层位置、分类行溢出标记、页签…）都会把 300 多项重新过滤一遍 —— 白算。
   * 依赖写清楚之后，只有名册、语言、分类、搜索词真的变了才重算。
   */
  const experts = React.useMemo(
    () => (snap?.experts ?? []).filter((expert) => expert.conflict !== true && snap.enabledSet.has(expert.slug)),
    [snap],
  );
  const needle = query.trim().toLowerCase();

  /**
   * 分类筛选（2026-09-29 用户要求：搜索框下面加一行分类标签，附参考图）。
   *
   * 选项**从名册现算**并保持首次出现的顺序 —— 与下面列表里分组标题的顺序、文案完全一致
   * （列表本来就按 `snap.experts` 的顺序分组）；不学设置页那样按 slug 排序，免得两处对不上。
   * 「全部」那一项不在名册里，由界面自己补在最前面。
   */
  const divisionLabels = React.useMemo(() => {
    const map = new Map();
    for (const expert of experts) {
      if (!map.has(expert.division)) map.set(expert.division, divisionLabel(expert, active));
    }
    return map;
  }, [experts, active]);
  const divisionKeys = React.useMemo(() => [...divisionLabels.keys()], [divisionLabels]);
  const visible = React.useMemo(
    () => experts.filter((expert) => (division === "all" || expert.division === division)
      && matchExpert(expert, active, needle)),
    [experts, division, active, needle],
  );
  const grouped = React.useMemo(() => {
    const out = [];
    for (const expert of visible) {
      const last = out[out.length - 1];
      if (last !== undefined && last.division === expert.division) last.items.push(expert);
      else out.push({ division: expert.division, items: [expert] });
    }
    return out;
  }, [visible]);

  /**
   * 分类行溢出检测：内容超出一屏时露出右端的圆形滚动按钮。
   * 量不到尺寸时（自检用 `renderToString`、jsdom 里没有真实布局）clientWidth 与 scrollWidth 都是 0，
   * 判定自然落到"没有更多"，所以这里不需要为测试环境开特例。
   */
  React.useEffect(() => {
    if (!open || popTab !== "experts") return undefined;
    const sync = () => {
      const node = divRef.current;
      if (node === null || node === undefined) return;
      // 右端：还有没露出来的；左端：已经滚过去了（滚过去就得给一个能回去的箭头）。
      setDivMore(node.scrollLeft + node.clientWidth < node.scrollWidth - 1);
      setDivBack(node.scrollLeft > 1);
    };
    sync();
    const node = divRef.current;
    node?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      node?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [open, popTab, division, active, snap]);

  /**
   * 分类行支持**鼠标滚轮左右滚**（用户 2026-09-29 要求：「分类这一行要支持鼠标滚轮滚动」）。
   *
   * 用原生监听而不是 React 的 `onWheel`：React 17 起把 `wheel` 委托注册成 **passive**，
   * 回调里 `preventDefault()` 不生效（还会在控制台告警）；于是纵向滚轮在把分类行滚到头之后
   * 会继续滚下面的列表/页面 —— 用户要的是"在这一行上滚 = 左右滚分类"。
   * 只在**真的还能往那个方向滚**时才拦，滚到两端就放手（让滚轮回到列表上，不至于"卡住不动"）。
   * 触控板横滑（`deltaX`）也一并支持，且优先用它。
   */
  React.useEffect(() => {
    if (!open || popTab !== "experts") return undefined;
    const node = divRef.current;
    if (node === null || node === undefined) return undefined;
    const onWheel = (event) => {
      const bar = divRef.current;
      if (bar === null || bar === undefined) return;
      if (bar.scrollWidth <= bar.clientWidth) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) return;
      const atStart = bar.scrollLeft <= 0;
      const atEnd = bar.scrollLeft + bar.clientWidth >= bar.scrollWidth - 1;
      if ((delta > 0 && atEnd) || (delta < 0 && atStart)) return;
      bar.scrollLeft += delta;
      event.preventDefault();
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [open, popTab]);

  /** 换分类 / 改搜索词 / 切标签都让列表回到顶部（否则停在上一批结果的位置，看着像"没反应"）。 */
  React.useEffect(() => {
    const node = listRef.current;
    if (node === null || node === undefined) return;
    node.scrollTop = 0;
  }, [division, query, skillQuery, popTab]);

  function pick(expert) {
    const ok = insertReference?.(referenceOf(expert, active)) === true;
    if (ok) {
      setOpen(false);
      setQuery("");
      setFailed("");
      // 点了就是要用（用户口径 2026-09-29）：后台把附件拉起来，不必等真召唤那一下。
      warmupAssets(remote, expert);
    } else {
      setFailed(t("button.insertFailed"));
    }
  }

  const skillNeedle = skillQuery.trim().toLowerCase();
  // 官方 skills/list 只给 name/description/whenToUse/modelInvocable（**没有 userInvocable**），
  // 所以这里不做过滤，只按搜索词筛 —— 与输入框里那个 /skill 菜单的行为保持一致。
  // 同样 memo：250+ 个技能，别让浮层位置变化这类无关 state 把这份过滤重跑一遍。
  const visibleSkills = React.useMemo(() => (skills ?? []).filter((skill) => {
    if (skillNeedle === "") return true;
    return `${skill.name} ${skill.description ?? ""} ${skill.whenToUse ?? ""}`.toLowerCase().includes(skillNeedle);
  }), [skills, skillNeedle]);

  /**
   * 标签上的计数（用户口径：专家、技能两个标签各带一个括号数字）。
   *
   * 只统计**总数**，不跟搜索词走：搜索框里敲字时标签上的数字保持不变，
   * 它回答的是"这里一共有多少"，而不是"当前筛出多少"。
   * 数据没到位时给 undefined —— 名册还没拉到（snap 未加载）、技能还在取数中
   * （skills === null）时显示 "(·0)" 是假信息，宁可先不显示括号。
   */
  const tabCounts = {
    experts: snap === undefined ? undefined : experts.length,
    skills: skills === null ? undefined : skills.length,
  };

  /** 点一个技能：把「使用技能「X」」写进输入框（技能正文由模型自己去 skill 工具加载）。 */
  function pickSkill(skill) {
    // 与输入框 /skill 菜单的 onPick 完全一致：插 `/技能名 `（宿主据此调用该技能）。
    const ok = insertSkillHint?.(`/${skill.name}`) === true;
    if (ok) {
      setOpen(false);
      setSkillQuery("");
      setFailed("");
    } else {
      setFailed(t("button.insertFailed"));
    }
  }

  return (
    <span ref={rootRef} className="t-team-btn-wrap">
      <button className="t-team-btn" type="button" title={t("button.title")} onClick={() => void toggle()}>
        🧩 {t("button.label")}
      </button>
      {/* 外壳（定位 / 材质 / 关闭）收在 FloatingPop 里：它内部的 setState 不会再重渲染这个组件，
          下面这棵 300+ 张卡片的面板因此不受"浮层位置每帧变化"的牵连（见 ui.jsx 的说明）。 */}
      <FloatingPop open={open} setOpen={setOpen} rootRef={rootRef} className="t-team-pop" data-tab={popTab}>
          <div className="t-team-pop-head">
            <span>{t("pop.title")}</span>
            <button className="t-team-chip" type="button" onClick={() => setOpen(false)}>{t("button.close")}</button>
          </div>
          <div className="t-team-tabs" role="tablist">
            {popTabs.map(([key, label]) => (
              <button
                className="t-team-tab"
                type="button"
                role="tab"
                key={key}
                data-active={popTab === key}
                aria-selected={popTab === key}
                onClick={() => { setPopTab(key); setFailed(""); }}
              >
                {t(label)}
                {tabCounts[key] === undefined ? null : <span className="t-team-tab-count">{t("tab.count", { count: tabCounts[key] })}</span>}
              </button>
            ))}
          </div>
          {popNote !== "" && <div className="t-team-ok">{popNote}</div>}
          {failed !== "" && <div className="t-team-error">{failed}</div>}
          {popTab === "experts" && (
          <>
          <input
            className="t-team-input"
            autoFocus
            placeholder={t("settings.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {/*
            分类标签行（2026-09-29 用户要求，附参考图）：搜索框下面一行分类，点一个只看那一类。
            宽度与搜索框、下面的卡片对齐靠的是**它就是 .t-team-pop 的直接子元素** —— 与别的行一样
            吃 `> *` 的 10px 右内边距，左边由容器自己的 padding-left 提供。
            所以这一行（以及里面那两个容器）都**不许**再写左右内边距，否则会比搜索框窄一截或偏一截。
          */}
          {/*
            分类标签行（2026-09-29 用户要求，附参考图）：搜索框下面一行分类，点一个只看那一类。
            宽度与搜索框、下面的卡片对齐靠的是**它就是 .t-team-pop 的直接子元素** —— 与别的行一样
            吃 `> *` 的 10px 右内边距，左边由容器自己的 padding-left 提供。
            所以这一行（以及里面的滚动容器）只允许由"给箭头让位"那两条规则提供内边距，别处一律不许写，
            否则这一行会比搜索框窄一截或偏一截。
            箭头两个方向（用户 2026-09-29 追加：点了右箭头之后左边也得有箭头，否则回不去）：
            左端在"已经滚过去了"时出现，右端在"右边还有没露出来的"时出现，各点一次滚一屏的 80%。
          */}
          <div className="t-team-divbar" data-more={divMore} data-back={divBack}>
            {divBack && (
              <button
                className="t-team-div-scroll"
                type="button"
                data-dir="prev"
                title={t("pop.divisionsPrev")}
                aria-label={t("pop.divisionsPrev")}
                onClick={() => {
                  const node = divRef.current;
                  node?.scrollBy?.({ left: -Math.round((node.clientWidth || 0) * 0.8), behavior: "smooth" });
                }}
              >
                ‹
              </button>
            )}
            <div className="t-team-pop-divs" ref={divRef} role="group" aria-label={t("pop.divisions")}>
              <button
                className="t-team-div-chip"
                type="button"
                aria-pressed={division === "all"}
                data-active={division === "all"}
                onClick={() => { setDivision("all"); setFailed(""); }}
              >
                {t("pop.all")}
              </button>
              {divisionKeys.map((key) => (
                <button
                  className="t-team-div-chip"
                  type="button"
                  key={key}
                  aria-pressed={division === key}
                  data-active={division === key}
                  onClick={() => { setDivision(key); setFailed(""); }}
                >
                  {divisionLabels.get(key)}
                </button>
              ))}
            </div>
            {/* 右端那个圆形箭头：只在右边还有没露出来的分类时出现（参考图里有它）。 */}
            {divMore && (
              <button
                className="t-team-div-scroll"
                type="button"
                data-dir="next"
                title={t("pop.divisionsMore")}
                aria-label={t("pop.divisionsMore")}
                onClick={() => {
                  const node = divRef.current;
                  node?.scrollBy?.({ left: Math.round((node.clientWidth || 0) * 0.8), behavior: "smooth" });
                }}
              >
                ›
              </button>
            )}
          </div>
          <div className="t-team-pop-list" ref={listRef}>
            {grouped.map((group) => (
              <React.Fragment key={group.division}>
                <div className="t-team-division">{divisionLabel(group.items[0], active)}</div>
                {group.items.map((expert) => {
                  // 副标题放「对照名」：中文界面显示英文名、英文界面显示中文名 —— 与主标题
                  // （displayName 随 locale）互补，不会在同一语言下重复同一串。
                  const alt = active === "en" ? expert.name : expert.nameEn;
                  // 分区图标（2026-09-29 用户口径）：宿主没这个图标时回退到专家自己的 emoji。
                  const iconName = divisionIconName(expert.division);
                  return (
                    <button className="t-team-pop-item" type="button" key={expert.slug} onClick={() => pick(expert)}>
                      {/* 头像**优先用专家自己的 emoji**：系统 emoji 本身就是彩色的、而且每位专家都不一样，
                          配名册 color 的淡色圆底就是参考图那种「淡色圆 + 彩色图形」。
                          只有老数据没写 emoji 时才回退到分区线性图标，最后兜 🧩。
                          宿主没有这个分区图标、或名册没有 color，也都有回退（见 ui.jsx 的两个函数）。 */}
                      <span className="t-team-pop-head">
                        <span className="t-team-pop-avatar" style={tintOf(expert.color) ?? undefined}>
                          {avatars[expert.slug] === undefined ? (expert.emoji || (iconName === null ? "🧩" : <PopIcon name={iconName} />)) : <img src={avatars[expert.slug]} alt="" />}
                        </span>
                        <span className="t-team-pop-title">
                          <span className="t-team-pop-name">{displayName(expert, active)}</span>
                          {alt !== undefined && alt !== "" && <span className="t-team-pop-sub">{alt}</span>}
                        </span>
                      </span>
                      <span className="t-team-pop-desc">{displayDescription(expert, active)}</span>
                      {/* 底部标签（参考图）：所属分区 + 自建标记。技能卡也有这一行 —— 两卡因此等高。 */}
                      <span className="t-team-pop-tags">
                        <span className="t-team-pop-tag">{divisionLabel(expert, active)}</span>
                        {expert.custom === true && <span className="t-team-pop-tag">{t("custom.badge")}</span>}
                        {/* 这只是个**标识**、不是按钮：点选与召唤都会自动下载（见 warmupAssets），
                            所以它只负责让用户知道「这位的资源还在云端」。 */}
                        {expert.assets === "missing" && (
                          <span className="t-team-pop-tag" title={t("assets.cloud")}>☁️</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
            {experts.length === 0 && <div className="t-team-pop-empty">{t("button.empty")}</div>}
            {experts.length > 0 && visible.length === 0 && <div className="t-team-pop-empty">{t("button.noMatch")}</div>}
          </div>
          </>
          )}
          {popTab === "skills" && (
          <>
          <input
            className="t-team-input"
            autoFocus
            placeholder={t("pop.skillSearch")}
            value={skillQuery}
            onChange={(event) => setSkillQuery(event.target.value)}
          />
          <div className="t-team-pop-list">
            {visibleSkills.map((skill) => (
              <button className="t-team-pop-item" type="button" key={skill.name} onClick={() => pickSkill(skill)}>
                <span className="t-team-pop-head">
                  {/* 技能卡头像：技能没有自己的图标，固定用彩色 emoji + 固定灰底（与专家卡的彩底一致）。 */}
                  <span className="t-team-pop-avatar t-team-pop-avatar-skill">🧰</span>
                  <span className="t-team-pop-title">
                    <span className="t-team-pop-name">{skill.name}</span>
                  </span>
                </span>
                <span className="t-team-pop-desc">{skill.description ?? ""}</span>
                {/* 与专家卡同一行标签（两卡等高）；「仅用户」从副标题挪到这里，不再两处重复。 */}
                <span className="t-team-pop-tags">
                  <span className="t-team-pop-tag">{t("tab.skills")}</span>
                  {skill.modelInvocable === false && <span className="t-team-pop-tag">{t("pop.skillUserOnly")}</span>}
                </span>
              </button>
            ))}
            {visibleSkills.length === 0 && (
              <div className="t-team-pop-empty">{skills === null ? t("pop.skillEmpty") : t("pop.skillNoMatch")}</div>
            )}
            {skillsDiag !== "" && (
              <div className="t-team-error" style={{ fontSize: "11px", whiteSpace: "pre-wrap" }}>诊断：{skillsDiag}</div>
            )}
          </div>
          </>
          )}
      </FloatingPop>
    </span>
  );
}
