/**
 * 区块级错误边界
 *
 * 本文件由原单文件 `src/client.jsx`（5278 行）按职责拆分而来，**内容逐行保持不变**：
 * 拼接顺序仍是原文件的行序，跨文件引用由 esbuild 打包回同一个
 * `window.__ModuleLoader__.load({id, factory})` 产物（lib/client.js），
 * 因此对产物的断言与行为一律不变。新增代码请放进对应职责的文件。
 */
import React from "react";
// ---------------------------------------------------------------- 设置面板
/**
 * 区块级错误边界：远程数据不做客户端校验（结果 schema 在 gateway 侧不生效），
 * 一条畸形记录就足以让 team.tasks.filter 之类抛错并白屏整个设置页。
 * 这里把崩溃限制在一个标签内部，并提供"切走再回来"的重置（reloadKey 变化即清错）。
 */
export class SectionBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: "" };
  }

  static getDerivedStateFromError(error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error) {
    console.error("[t-team] 区块渲染失败：", error);
  }

  componentDidUpdate(previous) {
    if (previous.reloadKey !== this.props.reloadKey && this.state.error !== "") this.setState({ error: "" });
  }

  render() {
    if (this.state.error !== "") {
      return <div className="t-team-error">{this.props.t("settings.crashed", { detail: this.state.error })}</div>;
    }
    return this.props.children;
  }
}
