/**
 * 模块级常量（跨槽位树共享）
 *
 * 本文件由原单文件 `src/client.jsx`（5278 行）按职责拆分而来，**内容逐行保持不变**：
 * 拼接顺序仍是原文件的行序，跨文件引用由 esbuild 打包回同一个
 * `window.__ModuleLoader__.load({id, factory})` 产物（lib/client.js），
 * 因此对产物的断言与行为一律不变。新增代码请放进对应职责的文件。
 *
 * 2026-09-28：「界面偏好」那套（uiPrefs / UI_PREF_KEYS / setUiPrefs / subscribeUiPrefs /
 * useUiPref / useShowActivePulse）随「活跃指示」整体迁去 dsh-helper 一并删除 ——
 * 活跃指示是它唯一的消费者（名册页与分类页都不需要跨槽位共享的界面开关）。
 */
export const NS = "t-team";
/**
 * 客户端构建版本（显示在设置页标题行，与 `package.json` 的 version 一致；verify 会盯着这条一致性）。
 *
 * 为什么把它印在界面上：宿主对客户端模块用的是 `immutable` 强缓存、缓存键是**内容哈希**，
 * 排查"改了没生效"时最需要一句话就能确认"页面里跑的是哪一版"。用户截一张设置页的图，
 * 我就能判断他看到的是新构建还是旧构建 —— 而不是靠猜。
 */
export const CLIENT_BUILD_VERSION = "0.5.5";
export const PLUGIN_ID = "dsh-expert";
export const DIVISION_FALLBACK = "specialized";
/** 「分区」下拉里代表"新建一个分区"的哨兵值（不会与真实分区名冲突：分区名只允许 a-z0-9.-）。 */
export const NEW_DIVISION = "__new";
