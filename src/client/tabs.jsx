/**
 * 设置面板的分类管理标签
 *
 * 本文件由原单文件 `src/client.jsx`（5278 行）按职责拆分而来，**内容逐行保持不变**：
 * 拼接顺序仍是原文件的行序，跨文件引用由 esbuild 打包回同一个
 * `window.__ModuleLoader__.load({id, factory})` 产物（lib/client.js），
 * 因此对产物的断言与行为一律不变。新增代码请放进对应职责的文件。
 *
 * 2026-09-28：面板搬到「插件列表 → T专家」的插件信息页，控件换成官方 primitives
 * （按钮 / 输入框 / 徽标）。**分类行的容器与布局类名一个没动**（`t-team-cat-row` 等）：
 * 它们是内容不是控件，换了只会让 verify 里那批结构断言一起红。
 */
import React from "react";
import { unwrap } from "./catalog.js";
import { Button, Tag, TextInput } from "./ui.jsx";

/**
 * 分类管理：新建 / 改名 / 删除**自建**分类。
 *
 * 官方分类只读（名字来自包内中文侧车），所以这一页对官方行只展示、不给编辑入口 ——
 * 想改官方分类的中文名，那是数据层（`zh/divisions.json`）的事，不是本机覆盖。
 * 自建专家可以归到任意分类（含官方分类名），但文件始终写 `customRoot`，官方镜像目录不受影响。
 */
export function CategoriesTab({ t, remote, categories, onChanged }) {
  const [key, setKey] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [editing, setEditing] = React.useState(null);   // { key, label }
  const [pendingDelete, setPendingDelete] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const list = categories ?? [];
  const mine = list.filter((item) => !item.official);
  const official = list.filter((item) => item.official);

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      unwrap(await action(), "category");
      setPendingDelete("");
      setEditing(null);
      setKey("");
      setLabel("");
      await onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  // 一行一个分类：分类名 + 官方/自建 + 目录名 + 计数在右，自建的才有操作按钮。
  // 刻意**不用** .t-team-card —— 那是专家卡片（min-height:132px、带 44px 头像列、三行简介夹取），
  // 拿来装一行分类会变成一排高盒子（曾经就是这样）。
  const row = (item) => (
    <div className="t-team-cat-row" key={item.key}>
      <span className="t-team-cat-name" title={item.label}>{item.label}</span>
      <Tag tone={item.official ? "outline" : "info"}>
        {item.official ? t("cat.officialBadge") : t("cat.customBadge")}
      </Tag>
      <span className="t-team-cat-key" title={item.key}>{item.key}</span>
      <span className="t-team-cat-count">{t("cat.count", { count: item.count, custom: item.customCount })}</span>
      {!item.official && (
        <span className="t-team-cat-actions">
          {editing !== null && editing.key === item.key ? (
            <>
              <TextInput
                value={editing.label}
                placeholder={t("cat.label")}
                aria-label={t("cat.label")}
                onChange={(event) => setEditing({ key: item.key, label: event.target.value })}
              />
              <Button disabled={busy} variant="primary"
                onClick={() => void run(() => remote.updateCategory(item.key, editing.label.trim()))}>
                {t("cat.save")}
              </Button>
              <Button disabled={busy} onClick={() => setEditing(null)}>
                {t("custom.cancel")}
              </Button>
            </>
          ) : (
            <>
              <Button disabled={busy} onClick={() => setEditing({ key: item.key, label: item.label })}>
                {t("cat.rename")}
              </Button>
              {pendingDelete === item.key ? (
                <>
                  <Button disabled={busy} variant="primary"
                    onClick={() => void run(() => remote.deleteCategory(item.key))}>
                    {t("cat.confirmDelete")}
                  </Button>
                  <Button disabled={busy} onClick={() => setPendingDelete("")}>
                    {t("custom.cancel")}
                  </Button>
                </>
              ) : (
                <Button disabled={busy} onClick={() => setPendingDelete(item.key)}>
                  {t("cat.delete")}
                </Button>
              )}
            </>
          )}
        </span>
      )}
    </div>
  );

  // 外层容器不再自带 t-team-tabbody：那个类现在挂在设置面板的 tabpanel 上（verify 的
  // 「把隐藏的标签页展开再数行数」那条断言正是按 `.t-team-tabbody[hidden]` 找它的）。
  return (
    // 间距交给两层 flex 容器（2026-09-28 用户：「自建分类 / 官方分类 里下方元素增加点间隔」）：
    // 页级 14px 隔开三个区块，小节级 8px 隔开「标题 → 说明 → 列表」。
    // 用容器 gap 而不是给每个元素写 margin：margin 叠起来既难算也难改，而且 .t-team-meta
    // 这种类别处也在用，加全局 margin 会误伤。
    <div className="t-team-cat-page">
      <div className="t-team-note">{t("cat.hint")}</div>
      <div className="t-team-bar">
        <TextInput
          placeholder={t("cat.key")}
          aria-label={t("cat.key")}
          spellCheck={false}
          value={key}
          onChange={(event) => setKey(event.target.value)}
        />
        <TextInput
          placeholder={t("cat.label")}
          aria-label={t("cat.label")}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <Button
          variant="primary"
          disabled={busy || key.trim() === ""}
          onClick={() => void run(() => remote.createCategory(key.trim(), label.trim()))}
        >
          {t("cat.create")}
        </Button>
      </div>
      {error !== "" && <div className="t-team-error">{error}</div>}
      <div className="t-team-cat-section">
        <div className="t-team-section-head">{t("cat.mine")}</div>
        <div className="t-team-cat-list">
          {mine.length === 0 ? <div className="t-team-cat-empty">{t("cat.empty")}</div> : mine.map(row)}
        </div>
      </div>
      <div className="t-team-cat-section">
        <div className="t-team-section-head">{t("cat.official")}</div>
        <div className="t-team-meta">{t("cat.officialNote")}</div>
        <div className="t-team-cat-list" data-scroll="true">{official.map(row)}</div>
      </div>
    </div>
  );
}
