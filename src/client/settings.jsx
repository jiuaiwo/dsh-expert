/**
 * 设置面板（四个标签）
 *
 * 本文件由原单文件 `src/client.jsx`（5278 行）按职责拆分而来，**内容逐行保持不变**：
 * 拼接顺序仍是原文件的行序，跨文件引用由 esbuild 打包回同一个
 * `window.__ModuleLoader__.load({id, factory})` 产物（lib/client.js），
 * 因此对产物的断言与行为一律不变。新增代码请放进对应职责的文件。
 */
import React from "react";
import { SectionBoundary } from "./boundary.jsx";
import { displayDescription, displayName, divisionLabel, matchExpert, publishCatalog, refresh, snapshotOf, unwrap, warmupAssets } from "./catalog.js";
import { CLIENT_BUILD_VERSION, NEW_DIVISION } from "./state.js";
import { CategoriesTab } from "./tabs.jsx";
import { SkillsPanel } from "./skills-panel.jsx";
import { Button, Card, Field, Modal, Select, Tabs, Tag, TextInput, copyText } from "./ui.jsx";
export function SettingsPanel({ t, ctx, remote, skillRemote, getActive, initialTab, view }) {
  const [snapshot, setSnapshot] = React.useState(() => snapshotOf(remote) ?? null);
  const [query, setQuery] = React.useState("");
  // 本地已有的专家头像（data URL）。没下载过资源的专家不在里面，卡片就回退 emoji。
  const [avatars, setAvatars] = React.useState({});
  // 头像刷新计数器：下载完头像后 warmupAssets 会广播，+1 触发下面的 effect 重取。
  const [avatarRev, setAvatarRev] = React.useState(0);
  // 点过 ☁️ 的专家：立刻把标识收起来 —— 下载是后台的，不给即时反馈会让人以为没生效。
  const [cloudClicked, setCloudClicked] = React.useState({});
  const [division, setDivision] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  /** 提示词弹窗：null=关闭，否则 { name, loading, text, error } */
  const [promptView, setPromptView] = React.useState(null);
  /**
   * 提示词弹窗里那颗复制按钮的状态："" = 待复制，"done" = 刚复制成功，"failed" = 写不进去。
   *
   * 用字符串而不是布尔：**失败也要说一句**。点一下毫无反应，用户只会当成按钮坏了，
   * 而这恰恰是 Clipboard API 在非安全上下文里最常见的表现。
   */
  const [copyState, setCopyState] = React.useState("");
  /** 自建专家编辑器：null = 关闭；mode = "new" | "edit"。 */
  const [editor, setEditor] = React.useState(null);
  /** 待确认删除的自建专家 slug（两步确认，不用 window.confirm：沙箱 iframe 里可能被拦）。 */
  const [pendingDelete, setPendingDelete] = React.useState("");
  /** 顶部标签：专家名册 / 分类管理 */
  const [tab, setTab] = React.useState(initialTab ?? "experts");
  /**
   * 展开着哪些分类。`null` = 用户还没手动动过（默认只展开第一个分类）。
   *
   * 2026-09-28 用户：「专家太多了，可以按分类折叠」—— 323 位专家按分类铺开有 22 组，
   * 一屏看不过来，而且一次渲染 323 张卡片在插件详情页里又慢又费。
   * 搜索 / 筛选时**强制全展开**：命中的专家藏在折叠里等于没搜到。
   */
  const [expandedGroups, setExpandedGroups] = React.useState(null);

  const reload = React.useCallback(async (force) => {
    try {
      const next = await refresh(remote, force);
      setSnapshot({ ...next });
      setError("");
      return next;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      return undefined;
    }
  }, [remote]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const next = await reload(false);
      if (alive && next !== undefined) setSnapshot({ ...next });
    })();
    return () => { alive = false; };
  }, [reload]);

  // 头像单独取：它只含「本地已下载过资源」的专家，体积很小（3.4 KB/张），
  // 取不到就保持空对象 → 卡片显示 emoji（这正是「没下载过=默认头像」的口径）。
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
      if (alive && map !== undefined && map !== null) {
        setAvatars(map);
      }
    })();
    return () => { alive = false; };
  // 依赖用 [avatarRev]：头像下载完成会 +1 触发重取；不能写 [remote] —— desktop 上 remote
  // 走 /api 网关、引用不稳定，会让 effect 反复重挂、cleanup 把 alive 置回 false，数据取到了却被丢弃（2026-09-29 实测）。
  }, [avatarRev]);

  const active = getActive();

  /** 读取某位专家的 persona 正文并弹窗展示（走 remote.getPrompt，按需加载，不预取全部）。 */
  async function openPrompt(expert) {
    // 换一位专家就重置反馈：留着上一位的"已复制"，会让人以为刚打开的这份也复制好了。
    setCopyState("");
    setPromptView({ name: displayName(expert, getActive()), loading: true, text: "", error: "" });
    try {
      const data = unwrap(await remote.getPrompt(expert.slug, expert.division), "getPrompt");
      setPromptView({ name: displayName(expert, getActive()), loading: false, text: data?.prompt ?? "", error: "" });
    } catch (cause) {
      setPromptView({
        name: displayName(expert, getActive()),
        loading: false,
        text: "",
        error: cause instanceof Error ? cause.message : String(cause),
      });
    }
  }

  React.useEffect(() => {
    if (promptView === null) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") setPromptView(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [promptView]);

  /**
   * 「已复制 / 复制失败」的短暂反馈：1.6s 后自己回到待复制。
   *
   * 定时器写在 effect 里而不是复制函数里，为的是**卸载时自动清掉** —— 写完就关弹窗
   * （或直接关掉插件页）时，悬着的 setTimeout 会去 setState 一个已卸载的组件。
   */
  React.useEffect(() => {
    if (copyState === "") return undefined;
    const timer = window.setTimeout(() => setCopyState(""), 1600);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  /** 复制当前提示词正文。只在正文真的到手时才动作 —— loading / 出错时按钮是禁用的。 */
  async function copyPrompt() {
    const text = promptView?.text ?? "";
    if (text === "") return;
    setCopyState((await copyText(text)) ? "done" : "failed");
  }

  const customDivisionLabel = snapshot?.customDivisionLabel ?? "";
  /** 面板可选的分类（服务端给定：官方在前、自建在后，默认分类恒在）。 */
  const categories = snapshot?.categories ?? [];
  /** 下拉用的分类；服务端没给就退回默认分类。 */
  const divisionOptions = (() => {
    const base = categories.length > 0
      ? categories.map((item) => ({ key: item.key, label: item.label }))
      : [{ key: snapshot?.customDivision ?? "", label: customDivisionLabel }];
    // 默认分类必须在选项里：否则新建时下拉会显示成第一个分类，而状态里还是默认值 ——
    // 「看得见的」和「存下去的」必须是同一个（服务端虽然也认默认值，但那样就骗了用户）。
    const fallback = snapshot?.customDivision ?? "";
    if (fallback !== "" && !base.some((item) => item.key === fallback)) {
      base.unshift({ key: fallback, label: snapshot?.customDivisionLabel ?? fallback });
    }
    return base;
  })();
  // 编辑一位落在"列表外分区"（例如手工建的历史目录）的专家时，把当前分区补进选项，
  // 否则下拉会显示成别的分区，而状态里还是原值 —— 看得见与存下去的必须是同一个。
  const editorDivisionOptions = editor !== null
    && editor.division !== ""
    && !divisionOptions.some((item) => item.key === editor.division)
    ? [{ key: editor.division, label: editor.division }, ...divisionOptions]
    : divisionOptions;

  /** 新建：空表单，slug 由用户填（中文名没法自动转 ASCII）。 */
  function openEditorNew() {
    setError("");
    setEditor({
      mode: "new", slug: "", hash: "",
      name: "", nameEn: "", emoji: "🧩", description: "", body: "",
      division: snapshot?.customDivision ?? "", divisionNew: false, divisionKey: "", divisionLabel: "",
      loading: false, saving: false, error: "",
    });
  }

  /** 编辑：先按需取回人格正文（走 getPrompt，不预取），再打开表单。 */
  async function openEditorEdit(expert) {
    setError("");
    setEditor({
      mode: "edit", slug: expert.slug, hash: expert.hash ?? "",
      name: expert.name ?? "", nameEn: expert.nameEn ?? "", emoji: expert.emoji || "🧩",
      description: expert.description ?? "", body: "",
      division: expert.division ?? "", divisionNew: false, divisionKey: "", divisionLabel: "",
      loading: true, saving: false, error: "",
    });
    try {
      const data = unwrap(await remote.getPrompt(expert.slug, expert.division), "getPrompt");
      setEditor((current) => (current === null ? current : { ...current, body: data?.prompt ?? "", loading: false }));
    } catch (cause) {
      setEditor((current) => (current === null ? current : {
        ...current, loading: false,
        error: cause instanceof Error ? cause.message : String(cause),
      }));
    }
  }

  function patchEditor(patch) {
    setEditor((current) => (current === null ? current : { ...current, ...patch }));
  }

  /** 保存（新建或编辑）→ 成功后整份刷新名册。 */
  async function saveEditor() {
    if (editor === null || editor.saving) return;
    patchEditor({ saving: true, error: "" });
    const payload = {
      slug: editor.slug.trim(),
      name: editor.name.trim(),
      nameEn: editor.nameEn.trim(),
      description: editor.description.trim(),
      emoji: editor.emoji.trim(),
      body: editor.body,
      // 新建分区时用的是输入框里的目录名，否则用下拉选中的分区（空＝服务端默认分区）。
      division: (editor.divisionNew ? editor.divisionKey : editor.division).trim(),
      divisionLabel: editor.divisionNew ? editor.divisionLabel.trim() : "",
    };
    try {
      const result = editor.mode === "new"
        ? await remote.createExpert(payload)
        : await remote.updateExpert(editor.slug, payload, editor.hash);
      unwrap(result, editor.mode === "new" ? "createExpert" : "updateExpert");
      setEditor(null);
      await reload(true);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      // 判**错误码**，不要在本地化文案里搜关键字。
      //
      // host 的 customError 已经把码铸成 `tTeam/custom-slug-taken` 这一类（见 lib/index.js 的
      // customError，businessError 会原样带过线），而 message 是给人看的中/英文句子，
      // 里面根本不含这串码 —— 原先那句 `message.includes("custom-slug-taken")` 因此**永远为 false**。
      // 后果：slug 或名称撞车时面板不会重拉名册，用户看到"已被占用"却不知道该跟谁比，
      // 本地快照里也始终没有那个占用者，改完再存还是撞。
      //
      // custom-conflict 一并纳入：那是编辑时指纹不符（别的窗口改过同一个文件），
      // 同样必须重拉快照才可能存成功。
      const code = cause && typeof cause === "object" ? cause.code : undefined;
      if (code === "tTeam/custom-slug-taken"
        || code === "tTeam/custom-name-taken"
        || code === "tTeam/custom-conflict") {
        await reload(true);
      }
      patchEditor({ saving: false, error: message });
    }
  }

  /** 删除（两步确认）→ 成功后整份刷新名册。 */
  async function removeExpert(expert) {
    setError("");
    try {
      unwrap(await remote.deleteExpert(expert.slug, expert.hash ?? ""), "deleteExpert");
      setPendingDelete("");
      await reload(true);
    } catch (cause) {
      setPendingDelete("");
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }
  const experts = snapshot?.experts ?? [];
  // `snapshot` 既可能是 undefined（还没装载）也可能是 null（remote 失败后的显式空态）。
  // 这里必须同时兜住两者：此前只判 undefined，null 会一路走到 `new Set(null.enabled)`
  // 抛 TypeError，React 随即卸载整个设置页 —— 用户看到的是「点 T专家 一片空白」
  // （2026-09-22 实机复现：服务端抛「设置段尚未注册」时正是这条路径）。
  // enabledSet 必须 memo 化：它每次都 new Set(...) 会导致下面 visible 的 useMemo 依赖恒变、
  // 每次渲染都重算（useMemo 白加）。只在 snapshot 真变时才重建。
  const enabledSet = React.useMemo(() => (snapshot != null ? new Set(snapshot.enabled ?? []) : new Set()), [snapshot]);
  const divisions = [];
  for (const expert of experts) {
    if (!divisions.includes(expert.division)) divisions.push(expert.division);
  }
  divisions.sort();
  /** 分区 key → 当前语言显示名（标签取自该分区第一位专家携带的本地化字段）。 */
  const labelOf = (division) => {
    const first = experts.find((expert) => expert.division === division);
    return first === undefined ? division : divisionLabel(first, active);
  };

  const needle = query.trim().toLowerCase();
  // 600+ 位专家：过滤/分组只在依赖变化时重算（对齐 summon.jsx 的 memo，2026-09-29 卡顿反馈）。
  const visible = React.useMemo(() => experts.filter((expert) => {
    if (division !== "" && expert.division !== division) return false;
    if (status === "on" && !enabledSet.has(expert.slug)) return false;
    if (status === "off" && enabledSet.has(expert.slug)) return false;
    return matchExpert(expert, active, needle);
  }), [experts, division, status, enabledSet, query, active]);
  const filtered = query !== "" || division !== "" || status !== "";
  const grouped = React.useMemo(() => {
    const out = [];
    for (const expert of visible) {
      const last = out[out.length - 1];
      if (last !== undefined && last.division === expert.division) last.items.push(expert);
      else out.push({ division: expert.division, items: [expert] });
    }
    return out;
  }, [visible]);

  async function toggle(expert) {
    if (snapshot === null || busy) return;
    const next = new Set(snapshot.enabled);
    if (next.has(expert.slug)) next.delete(expert.slug);
    else next.add(expert.slug);
    const list = [...next];
    setBusy(true);
    // 乐观更新
    setSnapshot({ ...snapshot, enabled: list });
    try {
      const state = unwrap(await remote.setEnabled(list, snapshot.revision), "setEnabled");
      // 走统一入口：写缓存 + 通知订阅者（订阅了名册缓存的界面靠它当场更新）。
      publishCatalog(remote, { ...snapshot, enabled: state.enabled, enabledSet: new Set(state.enabled), revision: state.revision });
      setSnapshot({ ...snapshot, enabled: state.enabled, revision: state.revision });
      setError("");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      const code = typeof cause === "object" && cause !== null ? cause.code : undefined;
      const conflict = code === "tTeam/conflict" || code === "SETTINGS_CONFLICT"
        || /changed since it was read|another window|其他窗口|冲突/.test(message);
      // 必须先刷新再落错误：reload() 成功时会把 error 清空，
      // 反过来写的话冲突提示只会闪一帧，等于看不见。
      await reload(true);
      setError(conflict ? "CONFLICT" : message);
    } finally {
      setBusy(false);
    }
  }

  // 「插件信息」页折叠那一行时只给一句说明，不摆整张面板（宿主只要 summary 视图）。
  if (view === "summary") {
    return <span>{t("settings.summary")}</span>;
  }

  const panelId = (key) => `t-team-panel-${key}`;
  const tabId = (key) => `t-team-tab-${key}`;

  if (snapshot === null) {
    return (
      <div className="t-team-panel">
        <Card title={t("settings.title")}>
          <div className="t-team-meta">{t("settings.loading")}</div>
          {error !== "" && (
            <>
              <div className="t-team-error">{t("settings.loadFailed", { detail: error })}</div>
              <div className="t-team-row">
                <Button onClick={() => void reload(true)}>{t("settings.retry")}</Button>
              </div>
            </>
          )}
        </Card>
      </div>
    );
  }

  const enabledCount = snapshot.enabled.length;

  /**
   * 名册健康提示（一切正常时是空串，什么都不渲染）。
   *
   * 数据来自快照的 `sidecar` 字段：host 一直在报这三件事，但 0.4.6 之前
   * `catalogSnapshotSchema` 没声明它、zod 把它剥掉了，面板根本收不到 ——
   * 于是"中文侧车没找到"这种会让整个名册**静默变全英文**的状况，界面上没有任何线索。
   * 三种情况都是静默的，所以宁可多说一句：侧车缺失（全变英文）、文件被跳过（专家少几位）、
   * 分类目录读不出（那一类不出现）。
   */
  const healthNotice = (() => {
    const sc = snapshot.sidecar;
    if (sc === null || typeof sc !== "object") return "";
    const parts = [];
    if (sc.present !== true) parts.push(t("roster.sidecarMissing", { path: sc.zhRoot ?? "?" }));
    if (typeof sc.skippedFiles === "number" && sc.skippedFiles > 0) {
      parts.push(t("roster.skippedFiles", { count: sc.skippedFiles }));
    }
    if (Array.isArray(sc.unreadableDivisions) && sc.unreadableDivisions.length > 0) {
      parts.push(t("roster.unreadableDivisions", { list: sc.unreadableDivisions.join("、") }));
    }
    return parts.join(" ");
  })();

  /** 某个分类此刻是否展开（筛选状态下一律展开）。 */
  const defaultExpanded = grouped.length === 0 ? [] : [grouped[0].division];
  const openDivisions = expandedGroups ?? defaultExpanded;
  const isGroupOpen = (division) => filtered || openDivisions.includes(division);
  const allGroupsOpen = grouped.length > 0 && grouped.every((group) => openDivisions.includes(group.division));
  /** 开合一个分类：第一次点会把「默认只开第一个」落成显式集合，之后按集合走。 */
  const toggleGroup = (division) => {
    const current = [...openDivisions];
    setExpandedGroups(current.includes(division) ? current.filter((item) => item !== division) : [...current, division]);
  };
  const toggleAllGroups = () => {
    setExpandedGroups(allGroupsOpen ? [] : grouped.map((group) => group.division));
  };
  return (
    <div className="t-team-panel">
      <Card
        title={t("settings.title")}
        hint={`${t("settings.enabledCount", { enabled: enabledCount, total: experts.length })} · v${CLIENT_BUILD_VERSION}`}
      >
        <Tabs
          value={tab}
          onChange={setTab}
          label={t("settings.title")}
          items={[
            { value: "experts", label: t("tab.experts"), id: tabId("experts"), panelId: panelId("experts") },
            { value: "categories", label: t("tab.categories"), id: tabId("categories"), panelId: panelId("categories") },
            { value: "skills", label: t("tab.skills"), id: tabId("skills"), panelId: panelId("skills") },
          ]}
        />

        <div className="t-team-tabbody" id={panelId("categories")} role="tabpanel" aria-labelledby={tabId("categories")} hidden={tab !== "categories"}>
          <SectionBoundary t={t} reloadKey={tab}>
            <CategoriesTab t={t} remote={remote} categories={categories} onChanged={() => reload(true)} />
          </SectionBoundary>
        </div>

        <div className="t-team-tabbody" id={panelId("skills")} role="tabpanel" aria-labelledby={tabId("skills")} hidden={tab !== "skills"}>
          <SectionBoundary t={t} reloadKey={tab}>
            {skillRemote === undefined
              ? <div className="t-team-note">{t("sg.settings.unavailable")}</div>
              : <SkillsPanel t={t} remote={skillRemote} />}
          </SectionBoundary>
        </div>

        <div className="t-team-tabbody" id={panelId("experts")} role="tabpanel" aria-labelledby={tabId("experts")} hidden={tab !== "experts"}>
          <SectionBoundary t={t} reloadKey={tab}>
            {/* 名册健康提示（一切正常时不渲染）：sidecar 缺失 → 名册静默变全英文；
                文件被跳过 → 专家凭空少几位；分类目录读不出 → 那一类不出现。
                host 一直在报这三件事，但 0.4.6 之前 schema 没声明 sidecar、zod 把它剥掉了。 */}
            {healthNotice !== "" && <div className="t-team-warn" role="status">{healthNotice}</div>}
            <div className="t-team-note">{t("roster.expertsHint")}</div>
            <div className="t-team-bar">
              <TextInput
                placeholder={t("settings.search")}
                aria-label={t("settings.search")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <Select
                value={division}
                onChange={setDivision}
                title={t("filter.division")}
                ariaLabel={t("filter.division")}
                options={[
                  { key: "", label: t("filter.allDivisions") },
                  ...divisions.map((item) => ({
                    key: item,
                    label: `${labelOf(item)} (${experts.filter((expert) => expert.division === item).length})`,
                  })),
                ]}
              />
              {/* 状态筛选（已启用 / 未启用）随启停开关一起下线：既然全部启用，它只剩「全部」和空列表两种结果。
                  恢复开关时把这段注释去掉即可（2026-09-28 换官方控件后，恢复时要换成 ui.jsx 的 Select）。
              <Select
                value={status}
                onChange={setStatus}
                title={t("filter.status")}
                ariaLabel={t("filter.status")}
                options={[
                  { key: "", label: t("filter.allStatus") },
                  { key: "on", label: `${t("filter.statusOn")} (${enabledSet.size})` },
                  { key: "off", label: `${t("filter.statusOff")} (${experts.length - enabledSet.size})` },
                ]}
              />
              */}
              {filtered && (
                <Button onClick={() => { setQuery(""); setDivision(""); setStatus(""); }}>{t("filter.clear")}</Button>
              )}
              <Button variant="primary" onClick={openEditorNew}>{t("custom.new")}</Button>
            </div>
            <div className="t-team-meta t-team-meta-row">
              <span>{t("filter.summary", { shown: visible.length, total: experts.length, enabled: enabledSet.size })}</span>
              {filtered ? null : (
                <Button onClick={toggleAllGroups}>
                  {allGroupsOpen ? t("group.collapseAll") : t("group.expandAll")}
                </Button>
              )}
            </div>
            {error !== "" && <div className="t-team-error">{error === "CONFLICT" ? t("settings.conflictRetry") : t("settings.saveFailed", { detail: error })}</div>}
            <div className="t-team-groups">
              {grouped.map((group) => {
                const open = isGroupOpen(group.division);
                return (
                <div className="t-team-group" key={group.division}>
                  <button
                    className="t-team-group-head"
                    type="button"
                    aria-expanded={open}
                    title={t("group.toggle", { name: divisionLabel(group.items[0], active) })}
                    onClick={() => toggleGroup(group.division)}
                  >
                    <span className="t-team-division">{divisionLabel(group.items[0], active)} · {group.items.length}</span>
                    <span className="t-team-group-chevron" aria-hidden="true">{open ? "▾" : "▸"}</span>
                  </button>
                  {open && (
                  <div className="t-team-grid">
                    {group.items.map((expert) => {
                      const on = enabledSet.has(expert.slug);
                      // 只服务于下面那个已下线的启停开关；恢复开关时把这行一起取消注释。
                      // const locked = busy || expert.conflict === true;
                      return (
                        <div className="t-team-card" data-enabled={on} key={expert.slug}>
                          <div className="t-team-card-body">
                            <div className="t-team-avatar">{avatars[expert.slug] === undefined ? (expert.emoji || "🧩") : <img src={avatars[expert.slug]} alt="" />}</div>
                            <div className="t-team-identity">
                              <div className="t-team-card-name">
                                {displayName(expert, active)}
                                {expert.custom === true && <Tag tone="info">{t("custom.badge")}</Tag>}
                                {/* 可点：面板里没有别的下载入口（@ 弹窗与召唤各自有预热），
                                    不点它就永远只有 emoji —— 用户口径「点了就会自动下」。 */}
                                {expert.assets === "missing" && cloudClicked[expert.slug] !== true && (
                                  <button
                                    type="button"
                                    className="t-team-cloud"
                                    title={t("assets.cloud")}
                                    onClick={() => {
                                      warmupAssets(remote, expert);
                                      setCloudClicked((prev) => ({ ...prev, [expert.slug]: true }));
                                    }}
                                  >☁️</button>
                                )}
                              </div>
                              <div className="t-team-card-division">{divisionLabel(expert, active)}</div>
                              <div className="t-team-card-slug">{expert.slug}</div>
                            </div>
                            <p className="t-team-card-desc">{displayDescription(expert, active)}</p>
                            {expert.conflict === true && <div className="t-team-conflict" style={{ gridColumn: "1/-1" }}>{t("settings.conflict")}</div>}
                          </div>
                          <div className="t-team-card-tools">
                            <Button
                              variant="ghost"
                              onClick={() => void openPrompt(expert)}
                              title={t("card.prompt")}
                              aria-label={t("card.prompt")}
                            >
                              📄
                            </Button>
                            {expert.custom === true && (
                              <Button
                                variant="ghost"
                                onClick={() => void openEditorEdit(expert)}
                                title={t("custom.edit")}
                                aria-label={t("custom.edit")}
                              >
                                ✏️
                              </Button>
                            )}
                            {expert.custom === true && (pendingDelete === expert.slug ? (
                              <Button
                                variant="outline"
                                title={t("custom.deleteHint", { name: displayName(expert, active) })}
                                onClick={() => void removeExpert(expert)}
                              >
                                {t("custom.confirmDelete")}
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                onClick={() => setPendingDelete(expert.slug)}
                                title={t("custom.delete")}
                                aria-label={t("custom.delete")}
                              >
                                🗑
                              </Button>
                            ))}
                            {/* 专家启停开关（2026-09-16 下线，原写法是 <button className="t-team-card-switch">）：
                                既然默认全部启用，列表里就不再逐个放开关。
                                代码原样留在这里 —— 以后若又需要「按专家启停」，把这段注释去掉即可恢复
                                （2026-09-28 换官方控件时这里改成了 ui.jsx 的 Switch 写法）。
                                注意 host 侧的 enabled 名单与 remote setEnabled 都还留着：summon / list_t_experts /
                                会话里的 @ 展开仍依赖它，下线的只是「手动改名单」这个入口。
                            <Switch
                              checked={on}
                              disabled={locked}
                              label={on ? t("settings.disable") : t("settings.enable")}
                              title={on ? t("settings.disable") : t("settings.enable")}
                              onChange={() => void toggle(expert)}
                            />
                            */}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  )}
                </div>
                );
              })}
              {visible.length === 0 && <div className="t-team-meta">{t("settings.empty")}</div>}
            </div>
          </SectionBoundary>
        </div>
      </Card>

      {promptView !== null && (
        <Modal
          open
          className="t-team-prompt-modal"
          title={t("card.promptTitle", { name: promptView.name })}
          onClose={() => setPromptView(null)}
          closeLabel={t("card.close")}
        >
          {/*
            复制按钮：官方 Modal 的标题栏只有「标题 + 关闭」两个位置，没有插槽，所以按钮
            渲染在正文之前、靠 CSS 绝对定位"落"到关闭按钮左侧（见 css.js 的
            .t-team-prompt-tools；基准是官方 .dialog，它自带 position:relative，因此正文
            滚动时按钮不动）。正文还没到手时禁用 —— 复制一段"正在读取…"没有意义。
          */}
          <div className="t-team-prompt-tools">
            <Button
              size="sm"
              variant="ghost"
              disabled={promptView.loading || promptView.error !== "" || promptView.text === ""}
              title={t("card.copy")}
              onClick={() => void copyPrompt()}
            >
              {copyState === "done"
                ? t("card.copied")
                : copyState === "failed"
                  ? t("card.copyFailed")
                  : t("card.copy")}
            </Button>
          </div>
          <pre className="t-team-prompt-body">
            {promptView.loading
              ? t("card.promptLoading")
              : promptView.error !== ""
                ? t("card.promptFailed", { detail: promptView.error })
                : promptView.text === ""
                  ? t("card.promptEmpty")
                  : promptView.text}
          </pre>
        </Modal>
      )}

      {editor !== null && (
        <Modal
          open
          className="t-team-editor-modal"
          title={editor.mode === "new" ? t("custom.titleNew") : t("custom.titleEdit", { name: editor.name || editor.slug })}
          onClose={() => { if (!editor.saving) setEditor(null); }}
          closeLabel={t("custom.cancel")}
          footer={
            <>
              <Button onClick={() => setEditor(null)} disabled={editor.saving}>{t("custom.cancel")}</Button>
              <Button
                variant="primary"
                onClick={() => void saveEditor()}
                disabled={editor.saving || editor.loading}
              >
                {editor.saving ? t("custom.saving") : t("custom.save")}
              </Button>
            </>
          }
        >
          <div className="t-team-editor">
            <div className="t-team-note">{t("custom.hint")}</div>
            <Field label={t("custom.division")}>
              <Select
                value={editor.divisionNew ? NEW_DIVISION : editor.division}
                onChange={(value) => {
                  if (value === NEW_DIVISION) patchEditor({ divisionNew: true, divisionKey: "", divisionLabel: "" });
                  else patchEditor({ divisionNew: false, division: value });
                }}
                ariaLabel={t("custom.division")}
                options={[
                  ...editorDivisionOptions.map((item) => ({ key: item.key, label: `${item.label} · ${item.key}` })),
                  { key: NEW_DIVISION, label: t("custom.divisionNew") },
                ]}
              />
            </Field>
            {editor.divisionNew && (
              <>
                <Field label={t("custom.divisionKey")}>
                  <TextInput
                    placeholder={t("custom.divisionKey")}
                    spellCheck={false}
                    value={editor.divisionKey}
                    onChange={(event) => patchEditor({ divisionKey: event.target.value })}
                  />
                </Field>
                <Field label={t("custom.divisionLabel")}>
                  <TextInput
                    placeholder={t("custom.divisionLabel")}
                    value={editor.divisionLabel}
                    onChange={(event) => patchEditor({ divisionLabel: event.target.value })}
                  />
                </Field>
              </>
            )}
            <Field label={t("custom.slug")}>
              <TextInput
                value={editor.slug}
                readOnly={editor.mode === "edit"}
                spellCheck={false}
                onChange={(event) => patchEditor({ slug: event.target.value })}
              />
            </Field>
            <Field label={t("custom.name")}>
              <TextInput value={editor.name} onChange={(event) => patchEditor({ name: event.target.value })} />
            </Field>
            <Field label={t("custom.nameEn")}>
              <TextInput value={editor.nameEn} onChange={(event) => patchEditor({ nameEn: event.target.value })} />
            </Field>
            <Field label={t("custom.emoji")}>
              <TextInput maxLength={8} value={editor.emoji} onChange={(event) => patchEditor({ emoji: event.target.value })} />
            </Field>
            <Field label={t("custom.description")}>
              <TextInput value={editor.description} onChange={(event) => patchEditor({ description: event.target.value })} />
            </Field>
            <Field label={t("custom.body")}>
              {/* 多行正文：官方 primitives 没有文本域，保留原生 textarea、沿用 .t-team-input 的尺寸 */}
              <textarea
                className="t-team-input"
                value={editor.body}
                disabled={editor.loading}
                onChange={(event) => patchEditor({ body: event.target.value })}
              />
            </Field>
            {editor.loading && <div className="t-team-meta">{t("custom.loadingBody")}</div>}
            {editor.error !== "" && <div className="t-team-error">{editor.error}</div>}
          </div>
        </Modal>
      )}
    </div>
  );
}
