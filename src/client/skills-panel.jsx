import React from "react";
import { CLIENT_BUILD_VERSION } from "./state.js";
import { unwrap } from "./remote.js";
// 控件一律走官方 primitives（与面板其余部分同一套，2026-09-28 并入时换的）。
import { Button, ChoiceGroup, Select, Switch, TextInput } from "./ui.jsx";

/**
 * 来源 key → 字典键的**显式映射**（2026-09-28 从动态拼接改成映射表）。
 *
 * 原来写的是 `t(\`sg.source.${source}\`)`：自检那条「字典里没有无人引用的键」只认字面量，
 * 于是这 8 个键全被判成死键；映射表两头都写死，键与用法一读即知。
 */
const SOURCE_KEYS = {
  "user-dsh": "sg.source.user-dsh",
  "user-agents": "sg.source.user-agents",
  bundled: "sg.source.bundled",
  "project-dsh": "sg.source.project-dsh",
  "project-agents": "sg.source.project-agents",
  custom: "sg.source.custom",
  runtime: "sg.source.runtime",
  unknown: "sg.source.unknown",
};

function sourceLabel(t, source) {
  const key = SOURCE_KEYS[source];
  return key === undefined ? source : t(key);
}

function matchSkill(skill, query) {
  if (query === "") return true;
  const hay = `${skill.name} ${skill.description}`.toLowerCase();
  return hay.includes(query);
}

function statusOf(skill) {
  if (!skill.nativeModel) return "native";
  if (skill.gated) return "off";
  return "on";
}

/** 视角标签按 kind 走字典，具体名字（preset id / 会话目录）由 host 提供。 */
function viewLabel(t, view) {
  if (view === undefined) return "";
  if (view.kind === "host") return t("sg.view.host");
  if (view.kind === "preset") return t("sg.view.preset", { name: view.name });
  if (view.kind === "agent") return t("sg.view.agent", { name: view.name });
  if (view.kind === "disk") return t("sg.view.disk");
  return view.key;
}

/**
 * @param props.initialSnapshot - 可选的初始快照。真机上不传（挂载后自己拉）；离线预览
 *   （ops/preview-panel.mjs）传一份，因为 SSR 不跑 effect，不注入就只能看到「正在读取…」。
 */
export function SkillsPanel({ t, remote, initialSnapshot }) {
  const [snapshot, setSnapshot] = React.useState(initialSnapshot ?? null);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState("all");
  const [source, setSource] = React.useState("");
  const [view, setView] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const reload = React.useCallback(async () => {
    try {
      const next = unwrap(await remote.getSnapshot(), "getSnapshot");
      setSnapshot(next);
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
      const next = await reload();
      if (alive && next !== undefined) setSnapshot(next);
    })();
    return () => { alive = false; };
  }, [reload]);

  async function save(disabled) {
    if (snapshot === null || busy) return;
    setBusy(true);
    setError("");
    try {
      const next = unwrap(await remote.setDisabled(disabled, snapshot.revision), "setDisabled");
      setSnapshot(next);
    } catch (cause) {
      const code = cause && typeof cause === "object" ? cause.code : undefined;
      // ⚠️ 必须是 `tTeam/conflict`：`skillGate` 那个命名空间在 0.4.0 已整体并进 `tTeam`
      // （见 lib/remote.js 顶部的说明），host 侧 setDisabled 抛的也正是 tTeam/conflict。
      // 写成 skillGate/conflict 的后果不是报错，而是**静默走 else 分支**：乐观锁冲突时
      // 面板不会自动重拉快照，用户只看到一句"保存失败"，再点一次仍然失败（手里的修订号
      // 还是旧的），非得手动刷新页面才解得开 —— 而这条路径偏偏只在多窗口同时改设置时才走到，
      // 于是它既难复现又难归因。
      if (code === "tTeam/conflict") {
        await reload();
        setError(t("sg.settings.conflict"));
      } else {
        setError(t("sg.settings.saveFailed", { detail: cause instanceof Error ? cause.message : String(cause) }));
      }
    } finally {
      setBusy(false);
    }
  }

  if (snapshot === null && error === "") {
    return <div className="sg-settings"><div className="sg-empty">{t("sg.settings.loading")}</div></div>;
  }
  if (snapshot === null) {
    return (
      <div className="sg-settings">
        <div className="sg-error">{t("sg.settings.loadFailed", { detail: error })}</div>
        <Button onClick={() => void reload()}>{t("sg.settings.retry")}</Button>
      </div>
    );
  }

  const needle = query.trim().toLowerCase();
  const skills = snapshot.skills ?? [];
  const views = snapshot.views ?? [];
  const viewKey = view !== "" && views.some((item) => item.key === view) ? view : "";
  const activeView = views.find((item) => item.key === viewKey);
  const inView = (skill) => viewKey === "" || (skill.views ?? []).includes(viewKey);
  const scoped = skills.filter(inView);
  const sources = [...new Set(scoped.map((item) => item.source))].sort();
  const sourceKey = source !== "" && sources.includes(source) ? source : "";
  const filtered = scoped.filter((skill) => {
    if (!matchSkill(skill, needle)) return false;
    if (sourceKey !== "" && skill.source !== sourceKey) return false;
    if (status !== "all" && statusOf(skill) !== status) return false;
    return true;
  });

  /* host 侧 counts 与每个视角的计数同构，且由一次遍历分类累加，
     所以「可见 + 已关 + 原生关闭 = 共」在 host 就成立。前端只换数据源，不再重复回算。 */
  const scopeCounts = viewKey === "" ? snapshot.counts : (activeView ?? snapshot.counts);

  const groups = new Map();
  for (const skill of filtered) {
    const list = groups.get(skill.source) ?? [];
    list.push(skill);
    groups.set(skill.source, list);
  }

  const gatedNow = new Set(skills.filter((skill) => skill.gated).map((skill) => skill.name));

  function toggle(skill) {
    if (!skill.nativeModel) return;
    const next = new Set(gatedNow);
    if (skill.gated) next.delete(skill.name);
    else next.add(skill.name);
    void save([...next].sort());
  }

  function setFiltered(gated) {
    if (needle === "") return;
    const next = new Set(gatedNow);
    for (const skill of filtered) {
      if (!skill.nativeModel) continue;
      if (gated) next.add(skill.name);
      else next.delete(skill.name);
    }
    void save([...next].sort());
  }

  const hasSearch = needle !== "";
  const toggleable = filtered.filter((skill) => skill.nativeModel);
  const canBulk = !busy && hasSearch && toggleable.length > 0;
  const bulkTitle = hasSearch ? undefined : t("sg.actions.needSearch");

  return (
    <div className="sg-settings">
      <div className="sg-head">
        <div className="sg-meta">{t("sg.settings.meta", {
          scope: viewKey === "" ? t("sg.view.all") : (viewLabel(t, activeView) || viewKey),
          visible: scopeCounts.modelVisible,
          gated: scopeCounts.gated,
          native: scopeCounts.nativeOff,
          total: scopeCounts.total,
          version: CLIENT_BUILD_VERSION,
        })}</div>
        <div className="sg-hint">{t("sg.settings.hint")}</div>
      </div>
      {error !== "" && <div className="sg-error">{error}</div>}
      <div className="sg-toolbar">
        <TextInput
          value={query}
          placeholder={t("sg.settings.search")}
          aria-label={t("sg.settings.search")}
          onChange={(event) => setQuery(event.target.value)}
        />
        <Select
          value={viewKey}
          onChange={(value) => { setView(value); setSource(""); }}
          title={t("sg.filter.view")}
          ariaLabel={t("sg.filter.view")}
          options={[
            { key: "", label: t("sg.view.all") },
            ...views.map((item) => ({
              key: item.key,
              label: t("sg.view.option", { label: viewLabel(t, item), visible: item.modelVisible, total: item.total }),
            })),
          ]}
        />
        <Select
          value={sourceKey}
          onChange={setSource}
          title={t("sg.filter.source")}
          ariaLabel={t("sg.filter.source")}
          options={[
            { key: "", label: t("sg.filter.allSources") },
            ...sources.map((key) => ({ key, label: sourceLabel(t, key) })),
          ]}
        />
      </div>
      <div className="sg-chips">
        <ChoiceGroup
          id="sg-status-filter"
          label={t("sg.filter.status")}
          value={status}
          onSelect={setStatus}
          options={[
            ["all", "sg.filter.all"],
            ["on", "sg.filter.on"],
            ["off", "sg.filter.off"],
            ["native", "sg.filter.native"],
          ].map(([id, key]) => ({ id, label: t(key) }))}
        />
        <span className="sg-filter-count">{t("sg.settings.filterCount", { shown: filtered.length, groups: groups.size })}</span>
      </div>
      <div className="sg-actions">
        <Button disabled={!canBulk} title={bulkTitle} onClick={() => setFiltered(false)}>
          {t("sg.actions.enableFiltered")}
        </Button>
        <Button disabled={!canBulk} title={bulkTitle} onClick={() => setFiltered(true)}>
          {t("sg.actions.disableFiltered")}
        </Button>
      </div>
      {filtered.length === 0 ? (
        <div className="sg-empty">{t("sg.settings.empty")}</div>
      ) : (
        <div className="sg-groups">
          {[...groups.entries()].map(([key, rows]) => (
            <section className="sg-group" key={key}>
              <div className="sg-group-head">
                <span>{sourceLabel(t, key)}</span>
                <span>{rows.length}</span>
              </div>
              <div className="sg-list">
                {rows.map((skill) => {
                  const on = skill.modelVisible;
                  const locked = !skill.nativeModel;
                  return (
                    <div className="sg-row" key={skill.name} data-off={!on}>
                      <div className="sg-row-head">
                        <span className="sg-name">
                          {skill.name}
                          {locked && <span className="sg-badge">{t("sg.filter.native")}</span>}
                        </span>
                        <Switch
                          checked={on}
                          disabled={locked || busy}
                          label={skill.name}
                          title={locked ? t("sg.settings.nativeOff") : skill.name}
                          onChange={() => toggle(skill)}
                        />
                      </div>
                      {skill.description !== "" && <div className="sg-desc">{skill.description}</div>}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
