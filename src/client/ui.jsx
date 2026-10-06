/**
 * T专家的界面基础件：**官方 primitives 的薄封装** + 卡片容器。
 *
 * 2026-09-28：整个设置面板从「设置 → T专家」搬到「插件列表 → T专家」的插件信息页
 * （用户口径：不要在设置里了，也做到插件里），控件一并换成 DSH 官方 primitives ——
 * 与 dsh-helper、dsh-mnemon 等同一套观感（那套是 mnemon 用的，用户拿它作参照）。
 *
 * 三条约定：
 *
 *   1. **官方优先、缺了退回自绘**。这个包是外部 require（由宿主的客户端模块表提供，见
 *      package.json 的 `dsh.client.inject`），取不到组件时不能连累整棵面板 ——
 *      客户端 entry 一抛错，宿主会让整个 Web GUI 停在 "Failed to load plugins" 页。
 *   2. **内容容器继续用 t-team-* 类名**（专家卡片网格、分类行…）：它们是内容不是控件，
 *      换掉只会让 verify 里几十条结构断言一起红，而用户要的是"控件像官方"。
 *   3. 文案一律由调用方传进来（面板那边走 locale 字典），这里不硬编码产品文案。
 */
import React from "react";
import * as primitives from "@deepseek-ai/dsh-client-ui-primitives";

/* ------------------------------------------------------------ 官方件（带兜底） */

const PButton = typeof primitives.Button === "function" ? primitives.Button : null;
const PInput = typeof primitives.Input === "function" ? primitives.Input : null;
const PTabs = typeof primitives.SegmentedTabs === "function" ? primitives.SegmentedTabs : null;
const PModal = typeof primitives.Modal === "function" ? primitives.Modal : null;
const PTag = typeof primitives.Tag === "function" ? primitives.Tag : null;
const PSwitch = typeof primitives.Switch === "function" ? primitives.Switch : null;
const PSegmentedControl = typeof primitives.SegmentedControl === "function" ? primitives.SegmentedControl : null;
const PWriteClipboard = typeof primitives.writeClipboard === "function" ? primitives.writeClipboard : null;

/**
 * 复制文本到系统剪贴板。返回是否真的写进去了。
 *
 * 优先用官方的 `writeClipboard` —— 它内部先走异步 Clipboard API，在 jsdom / 非安全
 * 上下文（`navigator.clipboard` 缺席）时退回 `execCommand('copy')`，这两种环境恰好是
 * 自绘实现最容易漏掉的。取不到官方件时才退回裸 Clipboard API。
 */
export async function copyText(text) {
  if (PWriteClipboard !== null) return await PWriteClipboard(text);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------ 卡片容器 */

/**
 * 面板里的分组卡片：与 dsh-helper 的设置卡片同一套外观（1px 边框 + 12px 圆角）。
 *
 * 边框取 1px 而不是官方的 0.5px：浅色主题下 `--dsw-alias-border-l3` 只有 12% 黑，
 * 0.5px 在白底页面上几乎看不出边界，而分组全靠这条线（`--dsw-alias-bg-layer-*` 在浅色下
 * 全是 #fff，底色指望不上）。
 */
export function Card({ title, hint, children }) {
  return (
    <section className="t-team-panel-card" aria-label={title}>
      <div className="t-team-panel-card-head">
        <div className="t-team-panel-card-title">{title}</div>
        {hint === undefined ? null : <div className="t-team-panel-card-hint">{hint}</div>}
      </div>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------ 控件 */

/**
 * 按钮：官方 Button 的薄封装。
 *
 * `variant` 默认 `outline`（次要动作），主动作传 `primary`；`iconOnly` 用于卡片工具条上
 * 那些只有图标的按钮（官方 Button 收 16px 图标节点）。
 */
export function Button({ children, onClick, disabled, title, variant = "outline", size = "sm", icon, type = "button", className }) {
  if (PButton !== null) {
    return (
      <PButton variant={variant} size={size} onClick={onClick} disabled={disabled} title={title} icon={icon} type={type} className={className}>
        {children}
      </PButton>
    );
  }
  return (
    <button className="t-team-chip" type={type} onClick={onClick} disabled={disabled} title={title}>
      {icon}{children}
    </button>
  );
}

/**
 * 单行文本输入：官方 Input（`icon` 可放 16px 前置图标），其余 input 属性原样透传。
 *
 * 类名 `t-team-input-field` 加在官方 Input 的 wrapper 上（筛选栏靠它撑开宽度）。
 * 2026-09-28 之前这里硬编码的是 `t-team-search` —— 那是"专家页搜索框"的名字，却被分类页
 * 新建栏、编辑器字段一起穿上了，语义不对（样式碰巧一样，改起来就会踩）。
 */
export function TextInput({ icon, className, ...rest }) {
  const cls = className === undefined ? "t-team-input-field" : `t-team-input-field ${className}`;
  if (PInput !== null) return <PInput icon={icon} className={cls} {...rest} />;
  return <input className={`t-team-input ${cls}`} {...rest} />;
}

/**
 * 下拉选择：**原生 `<select>`**。
 *
 * 官方 primitives 里没有选择器（`Menu` 是菜单/命令列表，语义与键盘行为都不是"选一个值"），
 * 所以这里保留原生控件、只把尺寸字号对齐官方那一档：原生 select 的键盘、移动端与无障碍
 * 行为是白送的，换成一个自绘下拉只会更差。
 */
export function Select({ value, onChange, title, options, ariaLabel }) {
  return (
    <select
      className="t-team-select"
      value={value}
      title={title}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((item) => (
        <option key={item.key} value={item.key}>{item.label}</option>
      ))}
    </select>
  );
}

/**
 * 标签页：官方 `SegmentedTabs`（等宽 + 滑动指示器）。
 *
 * 官方组件的契约要求每项带 `id` / `panelId`（它只出标签行，面板仍归调用方）——
 * 这两个 id 由调用方按 tab 值拼出来，见 settings.jsx 的 TAB_IDS。
 */
export function Tabs({ items, value, onChange, label }) {
  if (PTabs !== null) {
    const official = items.map((item) => ({
      value: item.value,
      label: item.label,
      id: item.id,
      panelId: item.panelId,
    }));
    // 容器类名**不能**复用自绘那套（.t-team-tabs）：它带着 display:flex 与 border-bottom，
    // 与官方 .tabs 的特异性相同、而我们的样式表后注入 —— 会把官方的 grid 布局整个盖掉，
    // 表现就是「底槽被拉满整行、标签挤在左边」（2026-09-28 用户截图报的就是这个）。
    return <PTabs items={official} value={value} onChange={onChange} label={label} className="t-team-panel-tabs" />;
  }
  return (
    <div className="t-team-tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          className="t-team-tab"
          type="button"
          role="tab"
          key={item.value}
          id={item.id}
          aria-controls={item.panelId}
          data-active={value === item.value}
          aria-selected={value === item.value}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/**
 * 弹窗：官方 `Modal`（带遮罩、Escape、焦点处理）。`footer` 放动作按钮。
 * 官方件要求 `closeLabel`（关闭按钮的可访问名），调用方传本地化文案。
 *
 * ⚠️ 官方 `.dialog` **没有高度上限**（`Modal.module.css` 的注释原话：cards size against
 * this padding box，*consumers cap growth with `max-height: 100%`*），而它又是
 * `createPortal(…, document.body)` 出去、`.root` 只做居中不做滚动 —— 所以内容一长就把
 * 弹窗顶出视口，看到的是"弹窗样式崩了、内容漫出屏幕"，而不是一个能滚的对话框。
 * 解法按官方约定来：给 dialog 兜一层 `max-height:100%`，再让 `.content` 里最后那个
 * 容器（官方的 `.body`）自己滚 —— 标题栏与关闭按钮因此固定在顶部。
 * 这一层对所有调用方生效，调用方不必各自处理高度。
 */
export function Modal({ open, title, onClose, closeLabel, description, children, footer, className }) {
  if (!open) return null;
  if (PModal !== null) {
    // 官方把 `className` 加在 `.dialog`、`contentClassName` 加在 `.content` 上。
    const dialogCls = className === undefined ? "t-team-modal-fit" : `t-team-modal-fit ${className}`;
    return (
      <PModal
        open={open}
        title={title}
        onClose={onClose}
        closeLabel={closeLabel}
        description={description}
        footer={footer}
        className={dialogCls}
        contentClassName="t-team-modal-fit-content"
      >
        {children}
      </PModal>
    );
  }
  // 兜底：自绘遮罩（点空白与 Escape 都关）。
  return (
    <div
      className="t-team-mask"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="t-team-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="t-team-modal-head">
          <span>{title}</span>
          <button className="t-team-chip" type="button" onClick={onClose}>{closeLabel}</button>
        </div>
        {description === undefined ? null : <div className="t-team-note">{description}</div>}
        <div className="t-team-modal-body">{children}</div>
        {footer === undefined ? null : <div className="t-team-editor-actions">{footer}</div>}
      </div>
    </div>
  );
}

/** 只读标签：官方 `Tag`（自建专家徽标、官方/自建分类徽标）。 */
export function Tag({ tone = "outline", children }) {
  if (PTag !== null) return <PTag tone={tone}>{children}</PTag>;
  return <span className="t-team-badge" data-tone={tone === "outline" ? undefined : tone}>{children}</span>;
}

/** 字段：左标签 + 控件（编辑器表单用）。 */
export function Field({ label, children }) {
  return (
    <label className="t-team-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

/**
 * 开关：官方 `Switch`（36×20 胶囊）。缺组件时退回自绘，形状照官方 CSS。
 * 技能开关面板用它替代原来的 `.sg-switch`。
 */
export function Switch({ checked, onChange, label, disabled, title }) {
  if (PSwitch !== null) {
    return <PSwitch checked={checked === true} onChange={onChange} label={label} disabled={disabled} title={title} />;
  }
  return (
    <button
      className="t-team-switch-fallback"
      type="button"
      role="switch"
      aria-checked={checked === true}
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={() => onChange(!(checked === true))}
      style={{
        boxSizing: "border-box", position: "relative", flex: "0 0 auto",
        width: 36, height: 20, padding: 2, border: 0, borderRadius: 999, cursor: "pointer",
        background: checked === true ? "var(--dsw-alias-brand-primary, #0f1115)" : "var(--dsw-alias-border-l3, #d8dadc)",
      }}
    >
      <span style={{
        display: "block", width: 16, height: 16, borderRadius: "50%",
        background: "var(--dsw-alias-label-primary-foreground, #fff)",
        transform: checked === true ? "translateX(16px)" : "none",
      }} />
    </button>
  );
}

/**
 * 一组互斥选项：官方 `SegmentedControl`（等宽滑块）。
 * 项数多到会溢出时别用它（它不换行）—— 见 dsh-helper 里那份同名组件的说明。
 */
export function ChoiceGroup({ label, options, value, onSelect, disabled, id }) {
  // 官方 SegmentedControl 要一个 base id：它据此拼每个分段的 id 与 aria 关联。
  // 默认写死会在同一页出现两组时撞 HTML id（id 必须唯一），所以用 useId 生成。
  // hook 必须无条件调用 —— 所以放在组件最顶上，别挪进下面的分支里。
  const autoId = React.useId();
  const baseId = id ?? `t-team-choice-${autoId}`;
  if (PSegmentedControl !== null) {
    return (
      <PSegmentedControl
        id={baseId}
        label={label}
        value={value}
        disabled={disabled}
        onChange={onSelect}
        options={options.map((item) => ({ value: item.id, label: item.label, disabled: item.disabled, title: item.title }))}
      />
    );
  }
  return (
    <div className="t-team-choice-fallback" role="radiogroup" aria-label={label} style={{ display: "flex", gap: 6, margin: "6px 0 2px", flexWrap: "wrap" }}>
      {options.map((item) => (
        <button
          key={item.id}
          className="t-team-chip"
          type="button"
          role="radio"
          aria-checked={item.id === value}
          data-active={item.id === value}
          disabled={disabled}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ 浮层外壳（官方 primitives 优先） */

/**
 * 2026-09-29：输入区那个「T专家」面板（`summon.jsx`）的**外壳**改用官方 primitives ——
 * 定位/跟随/视口钳制、外部点击关闭、菜单材质三件事交回官方，本插件只保留官方**没有**提供的那部分。
 *
 * 为什么只换外壳、不整块照搬官方：官方 primitives 里没有「浮层组件」，只有三个 hooks 与一个材质容器，
 * 官方自己也是按需组合的（对照过上游源码）：
 *   · `dsh-client-ui-conversation` 的 ContextMeter：`useAnchoredPosition`（`side` 写死 "top"）
 *     + `useDismissOnOutsidePointer` + **自己手写 Escape**；
 *   · `dsh-client-ui-input-trigger` 的 `/` 菜单：位置交给布局（底边贴 composer），
 *     只用 `useAnchoredMaxHeight` 钳高度，外部点击也自己写。
 * 也就是说**「上方不够就翻到下面」官方没有**（全部 4 个 `useAnchoredPosition` 调用点的 `side`
 * 都是字面量），而这条正是我们修过的 bug（新会话输入框居中时浮层顶部被裁）——所以翻转由本插件保留。
 *
 * 三条约定与文件顶部一致：官方优先、缺了退回自绘（`ui.jsx` 的老规矩），且**不许在渲染期碰 DOM**
 * （自检用 `react-dom/server`，没有 window/document）。
 */

const PAnchoredPosition = typeof primitives.useAnchoredPosition === "function" ? primitives.useAnchoredPosition : null;
const PDismissOnOutsidePointer = typeof primitives.useDismissOnOutsidePointer === "function" ? primitives.useDismissOnOutsidePointer : null;
const PMenuSurface = typeof primitives.MenuSurface === "function" ? primitives.MenuSurface : null;

/** SSR（render-smoke 的 renderToString）里 useLayoutEffect 只会告警，退回 useEffect。 */
const useLayout = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

/**
 * 从「T专家」按钮往上找宿主的**输入卡片**。
 *
 * 2026-09-23 踩过：这里原先只找 textarea，但宿主的主输入框是 contenteditable 的 DraftEditor
 * （`dsh-client-ui-conversation` 整个 bundle 里 textarea 只用在排队消息的 QueueEditor 上），
 * 因此永远找不到、每次都静默降级回 720px 固定宽度。宿主的输入卡片带 `data-composer-card` 标记，
 * 就是用户说的输入框本体 —— 优先认它，老宿主上再退回输入控件本身。
 */
export function anchorInput(rootRef) {
  let node = rootRef.current?.parentElement ?? null;
  for (let i = 0; i < 8 && node !== null; i += 1) {
    if (node.matches?.("[data-composer-card]") === true) return node;
    node = node.parentElement;
  }
  node = rootRef.current?.parentElement ?? null;
  for (let i = 0; i < 8 && node !== null; i += 1) {
    const found = node.querySelector?.("textarea, [contenteditable='true']");
    if (found !== null && found !== undefined) return found;
    node = node.parentElement;
  }
  return undefined;
}

/**
 * 官方 `overlayTopMargin` 的等价实现 —— 算法**照抄** `dsh-client-ui-primitives`（不是估的）：
 * 浮层上边界要让开框架发布的顶部占用区（桌面端 `--dsh-frame-top-clearance`，本机是 48px），
 * 再加 20px 余量；原生全屏时不算占用区；拿不到变量就退回调用方给的最小边距。
 * 只在 effect 里调用（渲染期没有 window/getComputedStyle）。
 */
export function overlayTopMargin(min) {
  const root = document.documentElement;
  const clearance = Number.parseFloat(getComputedStyle(root).getPropertyValue("--dsh-frame-top-clearance"));
  if (Number.isNaN(clearance)) return min;
  return Math.max(min, (root.hasAttribute("data-fullscreen") ? 0 : clearance) + 20);
}

/**
 * `useAnchoredPosition` 的本地等价实现：官方件缺席时（老宿主、自检替身）用它。
 * 算法与重算时机都对齐官方：算 left/top → 钳进视口 → 跟随 scroll（捕获，内层滚动容器也收得到）、
 * resize 与浮层自身尺寸变化（ResizeObserver）。
 */
function useOwnAnchoredPosition({ open, anchorRef, panelRef, side = "bottom", align = "start", gap = 6, margin = 8 }) {
  const [position, setPosition] = React.useState(null);
  useLayout(() => {
    if (!open) {
      setPosition(null);
      return undefined;
    }
    const place = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect === undefined) return;
      const panel = panelRef.current;
      const width = panel?.offsetWidth ?? 0;
      const height = panel?.offsetHeight ?? 0;
      let left = align === "end" ? rect.right - width : rect.left;
      let top = side === "top" ? rect.top - gap - height : rect.bottom + gap;
      if (width > 0) left = Math.min(Math.max(left, margin), window.innerWidth - width - margin);
      if (height > 0) top = Math.min(Math.max(top, overlayTopMargin(margin)), window.innerHeight - height - margin);
      setPosition({ left, top });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    const panel = panelRef.current;
    let observer = null;
    if (typeof ResizeObserver !== "undefined" && panel !== null && panel !== undefined) {
      observer = new ResizeObserver(place);
      observer.observe(panel);
    }
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, anchorRef, panelRef, side, align, gap, margin]);
  return position;
}
/** 两条路签名一致，模块加载时二选一 —— 这样 hook 调用是无条件的（条件调用 hook 会炸）。 */
const useAnchoredPosition = PAnchoredPosition ?? useOwnAnchoredPosition;

/** `useDismissOnOutsidePointer` 的本地等价实现（同样签名：root / open / setOpen / portal）。 */
function useOwnDismissOnOutsidePointer(root, open, setOpen, portal) {
  React.useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      if (event.target instanceof Node
        && root.current?.contains(event.target) !== true
        && portal?.current?.contains(event.target) !== true) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [root, open, setOpen, portal]);
}
const useDismissOnOutsidePointer = PDismissOnOutsidePointer ?? useOwnDismissOnOutsidePointer;

/**
 * 浮层外壳：**定位 + 翻转 + 宽度 + 高度 + 关闭**一次给全。
 *
 * 交给官方的：坐标计算与视口钳制（`useAnchoredPosition`）、外部点击关闭（`useDismissOnOutsidePointer`）。
 * 本插件保留的（官方没有，逐条都在上游源码里确认过）：
 *   · **翻转** —— 官方 `side` 是静态入参，没有「上方不够就翻下去」；这里的判据沿用改造前的行为
 *     （哪边空间多就朝哪边，空间相等时朝上），免得同一个交互在换外壳时悄悄变样；
 *   · **宽度** —— 官方 `useAnchoredPosition` 不管宽度（只用浮层自身宽度钳右边界），
 *     「和输入框一样宽」得自己量，走 CSS 变量 `--t-team-pop-w`；
 *   · **高度上限** —— 官方 `useAnchoredMaxHeight` 是给「底边由布局固定」的浮层用的（读自身 bottom
 *     算上边界）。我们的位置由高度反推（`top = 锚点顶 - 间距 - 高度`），拿它算会因为 bottom 随位置
 *     一起动而**不收敛**，所以这里自己按同一套上界规则算：`min(理想高度, 上方减去框架顶部让位)`；
 *   · **Escape** —— 官方也没有（ContextMeter 里同样是手写的）。
 *
 * @param options.open - 浮层是否打开。
 * @param options.setOpen - 关闭时用的 setter（外部点击与 Escape 都会调它）。
 * @param options.rootRef - 包住触发按钮的容器（也是「内部点击」的判定范围）。
 * @param options.panelRef - 浮层本体（量宽度、算高度、官方 hook 定位都用它）。
 * @param options.gap - 浮层与锚点的间距。
 * @param options.margin - 与视口/框架边缘的最小留白（官方的同名参数）。
 * @param options.ideal - 空间充足时的理想高度上限。
 * @returns `{ style, side, official }`：style 直接挂到浮层上；official 表示定位是否走的官方件。
 */
export function useFloatingShell({ open, setOpen, rootRef, panelRef, gap = 6, margin = 8, ideal = 600 }) {
  const anchorRef = React.useRef(null);
  const [side, setSide] = React.useState("top");
  const [width, setWidth] = React.useState(0);
  const [maxHeight, setMaxHeight] = React.useState(ideal);
  /** 官方件缺席时的兜底坐标（官方路径不需要它）。 */
  const [fallback, setFallback] = React.useState(null);

  // ① 先认锚点：必须在官方 hook 的 layout effect 之前赋值，同一帧里它才读得到 rect。
  useLayout(() => {
    if (!open) return;
    anchorRef.current = anchorInput(rootRef) ?? rootRef.current ?? null;
  }, [open, rootRef]);

  // ② 坐标（官方优先）
  const officialPosition = useAnchoredPosition({ open, anchorRef, panelRef, side, align: "start", gap, margin });

  // ③ 翻转方向 / 宽度 / 高度上限（自写，见上方说明）
  useLayout(() => {
    if (!open) return undefined;
    const fit = () => {
      const node = anchorRef.current ?? rootRef.current;
      const inputRect = node?.getBoundingClientRect();
      if (inputRect === undefined) return;
      const windowW = window.innerWidth;
      const windowH = window.innerHeight;
      const inputWidth = inputRect.width > 0
        ? Math.max(160, Math.min(Math.round(inputRect.width), windowW - 16))
        : 0;
      const spaceAbove = inputRect.top - margin;
      const spaceBelow = windowH - inputRect.bottom - margin;
      const up = spaceAbove >= spaceBelow;
      const cap = Math.max(0, Math.min(ideal, windowH - margin * 2));
      // 上边界与官方 useAnchoredPosition 同一套规则：浮层顶不越过框架顶部让位线。
      const roof = up ? inputRect.top - gap - overlayTopMargin(margin) : spaceBelow;
      setSide(up ? "top" : "bottom");
      setWidth(inputWidth);
      setMaxHeight(Math.max(0, Math.min(cap, roof)));
      if (PAnchoredPosition === null) {
        // 兜底坐标：向上弹贴**底边**（与自身高度解耦，和改造前一致），向下弹贴顶边。
        const measured = panelRef.current?.offsetWidth ?? 0;
        const laidOut = measured > 0 ? measured : inputWidth;
        const maxLeft = laidOut === 0 ? Number.POSITIVE_INFINITY : Math.max(margin, windowW - laidOut - margin);
        const left = Math.min(Math.max(margin, inputRect.left), maxLeft);
        setFallback(up
          ? { left, bottom: Math.max(margin, windowH - inputRect.top + gap) }
          : { left, top: Math.max(margin, inputRect.bottom + gap) });
      }
    };
    /**
     * 滚动时重算几何 —— 但**浮层自己内部**的滚动要跳过（用户 2026-09-29 报「弹窗有点卡」）。
     *
     * 专家列表、分类行都在浮层内部滚，它们不影响锚点位置；而 capture 监听会把它们一并收进来，
     * 于是列表每滚一帧就 setState 一次，把 300 多张卡片整棵树重新渲染 —— 那正是"滚起来发涩"的来源。
     */
    const onScroll = (event) => {
      const node = panelRef.current;
      if (node !== null && node !== undefined && event.target instanceof Node && node.contains(event.target)) return;
      fit();
    };
    fit();
    window.addEventListener("resize", fit);
    // capture=true：滚动的可能是内层容器，不捕获就收不到。
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, rootRef, panelRef, gap, margin, ideal]);

  // ④ 外部点击关闭（官方 hook；浮层本身在 rootRef 里，所以不用额外传 portal）
  useDismissOnOutsidePointer(rootRef, open, setOpen);

  // ⑤ Escape 关闭：官方只在自己的 Menu 组件里处理，浮层这一层得自己来（官方 ContextMeter 同款）。
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  const style = React.useMemo(() => {
    const next = { maxHeight: `${maxHeight}px` };
    if (width > 0) next["--t-team-pop-w"] = `${width}px`;
    if (PAnchoredPosition !== null) {
      // 首次测量前不给坐标：先藏起来，免得在默认位置闪一帧。
      if (officialPosition === null) next.visibility = "hidden";
      else { next.left = officialPosition.left; next.top = officialPosition.top; }
    } else if (fallback !== null) {
      next.left = fallback.left;
      if (fallback.top !== undefined) next.top = fallback.top;
      else next.bottom = fallback.bottom;
    } else {
      next.visibility = "hidden";
    }
    return next;
  }, [officialPosition, fallback, maxHeight, width]);

  return { style, side, official: PAnchoredPosition !== null };
}

/**
 * 浮层容器：官方 `MenuSurface`（材质 + macOS 下给 Chromium 用的 vibrancy 底层）优先，
 * 缺件退回普通 div —— 退回时材质由 `.t-team-pop` 自己的 CSS 出（见 css.js）。
 * 走官方材质时多加一个 `t-team-pop-official`，把自绘那套边框/底色/滤镜清掉：
 * 两套叠着会盖住官方材质层（它是 `z-index:-1` 的兄弟节点，被父级底色遮住就白换了）。
 */
export const PopSurface = React.forwardRef(function PopSurface({ official = false, className = "", style, children, ...rest }, ref) {
  const cls = official ? `${className} t-team-pop-official` : className;
  if (PMenuSurface !== null) {
    return <PMenuSurface ref={ref} className={cls} style={style} {...rest}>{children}</PMenuSurface>;
  }
  return <div ref={ref} className={className} style={style} {...rest}>{children}</div>;
});

/**
 * 浮层的**组件形态**：定位、材质、外部点击关闭与 Escape 都收在它内部，调用方只管往里塞内容。
 *
 * 为什么非要拆出一个组件（2026-09-29 用户报「弹窗有点卡」之后加的）：
 * 官方 `useAnchoredPosition` 每次重算位置都是 `setPosition({ left, top })` —— **新对象**，React 必然
 * 重渲染拥有这个 state 的组件。这个 state 原先住在 `SummonButton` 里，于是「列表滚一下」或
 * 「窗口 resize」都会把 300 多张专家卡片整棵树重新 diff 一遍。
 * 收进这里之后：位置变化只重渲染本组件，而 `children` 是父级传进来的**同一个 element 引用**，
 * React 直接跳过它的子树（同引用 bailout）—— 列表不再跟着位置一起重渲染。
 *
 * ⚠️ 父级要**始终挂载**它（把 `open` 当 prop 传进来），不要在父级写 `{open && <FloatingPop …/>}`：
 * 那样每次开关都会卸载/重建整棵面板，反而更慢。本组件自己用 `if (!open) return null` 收口。
 */
export function FloatingPop({ open, setOpen, rootRef, className, children, ...rest }) {
  const panelRef = React.useRef(null);
  const shell = useFloatingShell({ open, setOpen, rootRef, panelRef });
  if (!open) return null;
  return (
    <PopSurface ref={panelRef} official={shell.official} className={className} style={shell.style} {...rest}>
      {children}
    </PopSurface>
  );
}

/* ------------------------------------------------------------ 专家卡的头像图标 */

/**
 * 22 个分区各配一个**宿主自带的官方图标**（`Icon*OutlineMedium`，1.3px 描边那一档）。
 *
 * 为什么不去外链图标库（2026-09-29 用户口径：「更换图标，网上找找有没有精美点的图标」）：
 *   ① 这些图标本来就随宿主一起来 —— primitives 的 280 个导出里有一百多个 `Icon*`，
 *      用它等于跟官方同一套视觉语言（本插件一贯的口径）；
 *   ② 客户端插件跑的是本地 bundle，引 CDN 在离线/内网时白给，字体图标还要处理加载闪现；
 *   ③ 第三方库（Lucide / Tabler / Phosphor 之类）内联几十 KB 路径虽然可行，但要连带
 *      许可署名与后续升级，收益只是"换一套线性风格"，不值得。
 * 名字取自 `dsh-client-ui-primitives` 的导出表；宿主将来改了命名也不要紧 —— 查不到就逐级回退
 * （分区图标 → 专家自己的 emoji → 🧩），绝不空着。
 */
const DIVISION_ICONS = {
  academic: "IconListPenOutlineMedium",
  company: "IconUsersOutlineMedium",
  design: "IconSparkleMedium",
  engineering: "IconCodeOutlineMedium",
  finance: "IconDataOutlineMedium",
  "game-development": "IconPlayOutlineMedium",
  gis: "IconGlobeOutlineMedium",
  healthcare: "IconCheckCircleOutlineMedium",
  hr: "IconUserOutlineMedium",
  legal: "IconArchiveOutlineMedium",
  marketing: "IconSendOutlineMedium",
  "paid-media": "IconGaugeOutlineMedium",
  product: "IconPlanOutlineMedium",
  "project-management": "IconChecklistOutlineMedium",
  research: "IconSearchOutlineMedium",
  sales: "IconRightUpOutlineMedium",
  security: "IconShieldOutlineMedium",
  "spatial-computing": "IconFullscreenOutlineMedium",
  specialized: "IconSlidersTwoOutlineMedium",
  "supply-chain": "IconQueueOutlineMedium",
  support: "IconQuestionOutlineMedium",
  testing: "IconInspectOutlineMedium",
};

/**
 * 渲染一个官方产品图标；宿主没有这个名字时返回 null（调用方据此回退到 emoji）。
 * `size` 是官方图标的渲染尺寸（它们自己按 size 缩放，别用 CSS 去改宽高）。
 */
export function PopIcon({ name, size = 22 }) {
  const Icon = primitives[name];
  if (typeof Icon !== "function") return null;
  return <Icon size={size} />;
}

/** 分区 → 图标名；映射缺失**或**宿主没这个图标时返回 null。 */
export function divisionIconName(division) {
  const name = DIVISION_ICONS[division];
  if (typeof name !== "string" || typeof primitives[name] !== "function") return null;
  return name;
}

/**
 * 头像的淡色圆底：用专家 frontmatter 里的 `color` ——参考图里那种「淡色圆 + 彩色图形」，
 * 颜色本身也是每位专家的个性标识。
 *
 * alpha 用 24%（用户 2026-09-29：「给这些图标加一个淡淡的背景」）：14% 铺在白卡片上几乎看不出圆，
 * 圆一没边、里面又是个小 emoji，整体就显得飘；24% 仍然淡，但边界清楚。
 *
 * ⚠️ 名册里这个字段有**两种写法**（2026-09-29 实测 308 位里 hex 126 位、CSS 颜色名 182 位）：
 *   `"#9333EA"` 与 `blue` / `teal` / `navy` / `gold` 这类颜色名。所以这里不能只在 hex 后面拼 alpha
 *   后缀（`purple24` 不是颜色，整条声明会被丢掉）—— 用 `color-mix()` 统一压到 14%：
 *   两种写法都吃，而且不用自己算 rgba。
 *   老宿主不支持 `color-mix` 时这条声明失效、退回 CSS 里那个中性底色（不影响布局）。
 *   只放行「#RRGGBB 或纯字母颜色名」两种形态，别的一律当没写 —— 免得把任意字符串塞进样式。
 */
export function tintOf(color) {
  const value = typeof color === "string" ? color.trim() : "";
  if (!/^#[0-9a-fA-F]{6}$/u.test(value) && !/^[a-zA-Z]{3,20}$/u.test(value)) return null;
  return { background: `color-mix(in srgb, ${value} 24%, transparent)`, color: value };
}
