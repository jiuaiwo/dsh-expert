/**
 * `@deepseek-ai/dsh-client-ui-primitives` 在**静态自检**里的替身。
 *
 * 为什么不在测试里装真包：真组件自带 CSS Modules 与 react 依赖，还要求宿主的客户端模块表才拿得到
 * 单例（产物里是外部 require）。自检要验的是「面板渲染出来长什么样、文案在不在」，用一份同签名、
 * 能渲染出真实 DOM 的替身就够。
 *
 * 用 `React.createElement` 而不是 JSX：这个文件要同时被 **verify.mjs 直接 import**（Node 不认识
 * JSX）与 **render-smoke 的 esbuild alias** 使用 —— 同一个文件两处共用，桩才不会漂移。
 * （client-smoke 用的是**假 React**，那边的桩仍在它自己文件里，不能合并。）
 *
 * ⚠️ 只覆盖本插件用到的组件。新增用法时这里要同步补，否则自检会因为
 * `undefined is not a component` 报错 —— 那正是它该报的。
 */
import React from "react";

/** 官方 Switch 的签名：checked / onChange / label / disabled / title。 */
export function Switch({ checked, onChange, label, disabled, title }) {
  return React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": checked,
    "aria-label": label,
    title,
    disabled,
    onClick: () => onChange(!checked),
  });
}

/**
 * 官方 Button：variant/size 之外的属性原样透传（aria-label 等断言要用）。
 *
 * 视觉按官方 Button.module.css 画三档 —— 预览图（ops/preview-panel.mjs）直接吃这份替身，
 * 不画的话「主按钮」与「次按钮」在预览里长得一样，看不出主次。
 */
const BUTTON_VARIANTS = {
  primary: { background: "var(--dsw-alias-button-primary-fill, #0f1115)", color: "var(--dsw-alias-label-primary-foreground, #fff)", border: "0.5px solid transparent" },
  outline: { background: "transparent", color: "var(--dsw-alias-label-primary, #0f1115)", border: "0.5px solid var(--dsw-alias-border-l3, #d8dadc)" },
  ghost: { background: "transparent", color: "var(--dsw-alias-label-primary, #0f1115)", border: "0.5px solid transparent" },
  toolbar: { background: "transparent", color: "var(--dsw-alias-label-secondary, #61666b)", border: "0.5px solid transparent" },
};

export function Button({ children, onClick, disabled, title, variant = "ghost", size = "sm", icon, type, ...rest }) {
  const skin = BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.ghost;
  return React.createElement("button", {
    type: type ?? "button",
    onClick,
    disabled,
    title,
    "data-variant": variant,
    "data-size": size,
    ...rest,
    style: {
      boxSizing: "border-box", display: "inline-flex", alignItems: "center", justifyContent: "center",
      gap: 4, height: size === "md" ? 36 : 28, padding: "0 10px",
      borderRadius: "var(--dsw-radius-sm, 8px)", fontFamily: "inherit",
      fontSize: size === "md" ? 14 : 12, lineHeight: "18px",
      cursor: disabled === true ? "not-allowed" : "pointer",
      opacity: disabled === true ? 0.4 : 1,
      ...skin,
    },
  }, icon, children);
}

/** 官方 Input：wrapper span 装原生 input（className 加在 wrapper 上，与真件一致）。 */
export function Input({ icon, className, ...rest }) {
  return React.createElement("span", { className },
    icon,
    React.createElement("input", rest),
  );
}

/**
 * 官方 SegmentedTabs：只出标签行，面板归调用方（与真件契约一致）。
 *
 * 视觉照官方 SegmentedTabs.module.css 画：底槽背景 + 4px 内边距 + 选中项白底描边。
 * 真机的滑动指示器靠 CSS 变量算位置，替身不做那一层，但**底槽与比例要对**——
 * 预览工具直接吃这份替身，底槽画不出来的话，"标签是不是被拉满整行"这类问题就看不出来
 * （2026-09-28 用户报的那个问题正是先靠这张预览图定位的）。
 */
export function SegmentedTabs({ items, value, onChange, label, className }) {
  return React.createElement("div", {
    className,
    role: "tablist",
    "aria-label": label,
    style: {
      display: "grid", gridAutoFlow: "column", gridAutoColumns: "max-content",
      gap: 2, padding: 4, borderRadius: "var(--dsw-radius-lg, 10px)",
      background: "var(--dsw-alias-bg-module-platform, rgba(128,128,128,0.10))",
    },
  },
    items.map((item) => {
      const on = item.value === value;
      return React.createElement("button", {
        key: item.value,
        type: "button",
        role: "tab",
        id: item.id,
        "aria-controls": item.panelId,
        "aria-selected": on,
        "data-active": on,
        onClick: () => onChange(item.value),
        style: {
          position: "relative", boxSizing: "border-box", height: 34, padding: "0 12px",
          border: on ? "0.5px solid var(--dsw-alias-border-l3, #d8dadc)" : "0.5px solid transparent",
          borderRadius: "var(--dsw-radius-md, 8px)",
          background: on ? "var(--dsw-alias-bg-layer-3, #fff)" : "transparent",
          color: on ? "var(--dsw-alias-label-primary, #0f1115)" : "var(--dsw-alias-label-secondary, #61666b)",
          fontFamily: "inherit", fontSize: 14, lineHeight: "20px", fontWeight: on ? 600 : 400,
          cursor: "pointer",
        },
      }, item.label);
    }),
  );
}

/** 官方 Modal：开着就渲染内容（真件是 portal + 遮罩，自检只关心内容在不在）。 */
export function Modal({ open, title, onClose, closeLabel, description, children, footer }) {
  if (!open) return null;
  return React.createElement("div", { role: "dialog", "aria-modal": "true", "aria-label": title },
    React.createElement("div", { className: "t-team-modal-head" },
      React.createElement("span", null, title),
      React.createElement("button", { type: "button", onClick: onClose }, closeLabel),
    ),
    description === undefined ? null : React.createElement("div", null, description),
    children,
    footer,
  );
}

/** 官方 Tag：只读标签。 */
export function Tag({ tone, children, className }) {
  return React.createElement("span", { className, "data-tone": tone }, children);
}

/* ---- 浮层外壳三件（2026-09-29 起 T专家 的输入区面板改用它们）----
   ⚠️ 这三件必须在：缺一件，插件就会退回自己那套实现，**官方分支在自检里等于没有覆盖**
   （verify 有一条断言盯着这里在不在）。 */

/**
 * 官方 `useAnchoredPosition`：真件在 layout effect 里量锚点 rect 算 fixed 坐标。
 * 替身返回 null —— 自检只跑 `renderToString`（不跑 effect、也没有真实布局），
 * 这就是真件在首帧的返回值，插件据此把浮层先藏起来，正是它该走的那条路。
 */
export function useAnchoredPosition() {
  return null;
}

/** 官方 `useDismissOnOutsidePointer`：真件绑 document 的 pointerdown；自检里没有窗口交互。 */
export function useDismissOnOutsidePointer() {}

/** 官方 MenuSurface：材质容器（真件还往 body 挂一个 macOS 用的 vibrancy 底层）。 */
export const MenuSurface = React.forwardRef(function MenuSurface({ compact = false, className, style, children, ...props }, ref) {
  return React.createElement("div", { ...props, ref, "data-menu-material": "translucent", className, style },
    React.createElement("div", { "aria-hidden": "true", className: "t-team-menu-material" }),
    children,
  );
});

/* ---- 官方产品图标（2026-09-29：专家卡的头像改用分区图标）----
   真件是按 size 缩放的一批 SVG 组件；替身统一渲染成一个带 data-icon 的占位 span ——
   自检只关心「图标渲染出来了、回退路径没被误走」。
   ⚠️ 名字必须与 src/client/ui.jsx 的 DIVISION_ICONS / SKILL_ICON 一致：那里查不到就会回退 emoji，
   verify 有一条断言专门比对这张表与这里的导出。 */
function IconStub({ size, ...rest }) {
  return React.createElement("span", { "data-icon": "stub", "data-size": size, "aria-hidden": "true", ...rest });
}
export const IconListPenOutlineMedium = IconStub;
export const IconUsersOutlineMedium = IconStub;
export const IconSparkleMedium = IconStub;
export const IconCodeOutlineMedium = IconStub;
export const IconDataOutlineMedium = IconStub;
export const IconPlayOutlineMedium = IconStub;
export const IconGlobeOutlineMedium = IconStub;
export const IconCheckCircleOutlineMedium = IconStub;
export const IconUserOutlineMedium = IconStub;
export const IconArchiveOutlineMedium = IconStub;
export const IconSendOutlineMedium = IconStub;
export const IconGaugeOutlineMedium = IconStub;
export const IconPlanOutlineMedium = IconStub;
export const IconChecklistOutlineMedium = IconStub;
export const IconSearchOutlineMedium = IconStub;
export const IconRightUpOutlineMedium = IconStub;
export const IconShieldOutlineMedium = IconStub;
export const IconFullscreenOutlineMedium = IconStub;
export const IconSlidersTwoOutlineMedium = IconStub;
export const IconQueueOutlineMedium = IconStub;
export const IconQuestionOutlineMedium = IconStub;
export const IconInspectOutlineMedium = IconStub;
export const IconSkillOutlineMedium = IconStub;
