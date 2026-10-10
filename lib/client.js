// T专家 client bundle — 由 build-client.mjs（运维目录）生成，勿手改。
window.__ModuleLoader__.load({
  id: "dsh-expert",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.jsx
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);
var import_react7 = __toESM(require("react"), 1);

// src/client/boundary.jsx
var import_react = __toESM(require("react"), 1);
var SectionBoundary = class extends import_react.default.Component {
  constructor(props) {
    super(props);
    this.state = { error: "" };
  }
  static getDerivedStateFromError(error62) {
    return { error: error62 instanceof Error ? error62.message : String(error62) };
  }
  componentDidCatch(error62) {
    console.error("[t-team] \u533A\u5757\u6E32\u67D3\u5931\u8D25\uFF1A", error62);
  }
  componentDidUpdate(previous) {
    if (previous.reloadKey !== this.props.reloadKey && this.state.error !== "") this.setState({ error: "" });
  }
  render() {
    if (this.state.error !== "") {
      return /* @__PURE__ */ import_react.default.createElement("div", { className: "t-team-error" }, this.props.t("settings.crashed", { detail: this.state.error }));
    }
    return this.props.children;
  }
};

// src/client/state.js
var NS = "t-team";
var CLIENT_BUILD_VERSION = "0.5.8";
var PLUGIN_ID = "dsh-expert";
var DIVISION_FALLBACK = "specialized";
var NEW_DIVISION = "__new";

// src/client/catalog.js
var catalogCache = /* @__PURE__ */ new Map();
function snapshotOf(remote) {
  return catalogCache.get(remote);
}
function unwrap(result, action) {
  if (result !== null && typeof result === "object" && typeof result.ok === "boolean") {
    if (result.ok !== true) {
      const error62 = new Error(result.error?.message ?? `${action} failed`);
      error62.code = result.error?.code;
      throw error62;
    }
    return result.value;
  }
  return result;
}
var catalogListeners = /* @__PURE__ */ new Set();
function onCatalogLoaded(listener) {
  catalogListeners.add(listener);
  return () => catalogListeners.delete(listener);
}
function publishCatalog(remote, next) {
  catalogCache.set(remote, next);
  for (const listener of catalogListeners) {
    try {
      listener();
    } catch (cause) {
      console.error("[t-team] \u540D\u518C\u901A\u77E5\u56DE\u8C03\u5931\u8D25\uFF1A", cause);
    }
  }
  return next;
}
async function refresh(remote, force = false) {
  const cached2 = catalogCache.get(remote);
  if (cached2 !== void 0 && !force) return cached2;
  const next = unwrap(await remote.getCatalog(), "getCatalog");
  next.enabledSet = new Set(next.enabled);
  return publishCatalog(remote, next);
}
function displayName(expert, active) {
  return active === "en" ? expert.nameEn || expert.name : expert.name || expert.nameEn;
}
var warming = /* @__PURE__ */ new Set();
function warmupAssets(remote, expert) {
  if (expert?.assets !== "missing" || warming.has(expert.slug)) return;
  warming.add(expert.slug);
  void remote.fetchAssets(expert.slug).then(() => {
    refresh(remote, true);
    try {
      window.dispatchEvent(new CustomEvent("t-team:avatars-changed"));
    } catch {
    }
  }).catch(() => void 0).finally(() => warming.delete(expert.slug));
}
function displayDescription(expert, active) {
  return active === "en" ? expert.descriptionEn || expert.description : expert.description;
}
function divisionLabel(expert, active) {
  return active === "en" ? expert.divisionEn || expert.division : expert.divisionZh || expert.division;
}
var HAYSTACKS = /* @__PURE__ */ new WeakMap();
function haystackOf(expert) {
  let cached2 = HAYSTACKS.get(expert);
  if (cached2 === void 0) {
    cached2 = `${expert.name} ${expert.nameEn} ${expert.description} ${expert.descriptionEn} ${expert.slug}`.toLowerCase();
    HAYSTACKS.set(expert, cached2);
  }
  return cached2;
}
function matchExpert(expert, active, query) {
  if (query === "") return true;
  return haystackOf(expert).includes(query);
}
function referenceOf(expert, active) {
  const name = displayName(expert, active);
  return {
    source: `${NS}:${expert.division || DIVISION_FALLBACK}`,
    ref: expert.slug,
    label: name,
    appearance: "session",
    clipboardText: `@${name}\xA0`
  };
}

// src/client/css.js
var CSS = `
/* \u5C0F\u8282\u6807\u9898\uFF08\u81EA\u5EFA\u5206\u7C7B / \u5B98\u65B9\u5206\u7C7B\uFF09\uFF1A**\u4E0D\u753B\u4E0A\u8FB9\u7EBF**\u3002
   2026-09-28 \u7528\u6237\u6307\u51FA\u4E24\u5904\u591A\u4F59\u7684\u6A2A\u7EBF\uFF0C\u8FD9\u662F\u7B2C\u4E00\u5904 \u2014\u2014 \u6807\u9898\u4E0A\u65B9\u7684\u7EBF\u7D27\u8D34\u7740\u4E0A\u4E00\u4E2A\u533A\u5757
   \uFF08\u8F93\u5165\u6846\u90A3\u4E00\u884C / \u4E0A\u4E00\u4E2A\u5C0F\u8282\uFF09\uFF0C\u770B\u7740\u50CF"\u7EBF\u8D34\u5230\u4E86\u6309\u94AE\u4E0A"\u3002\u53BB\u6389\u8FB9\u6846\uFF0C\u9760\u5B57\u91CD\u4E0E\u95F4\u8DDD\u5206\u5C42\u5C31\u591F\u4E86\u3002 */
.t-team-section-head{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}
/* \u5206\u7C7B\u9875\u7684\u95F4\u8DDD\uFF082026-09-28 \u7528\u6237\uFF1A\u300C\u81EA\u5EFA\u5206\u7C7B / \u5B98\u65B9\u5206\u7C7B \u91CC\u4E0B\u65B9\u5143\u7D20\u589E\u52A0\u70B9\u95F4\u9694\u300D\uFF09\uFF1A
   \u9875\u7EA7 14px \u9694\u5F00\u533A\u5757\uFF0C\u5C0F\u8282\u7EA7 8px \u9694\u5F00\u300C\u6807\u9898 \u2192 \u8BF4\u660E \u2192 \u5217\u8868\u300D\u3002
   \u95F4\u8DDD\u4E00\u5F8B\u7531\u5BB9\u5668\u7684 gap \u63D0\u4F9B\uFF0C\u5143\u7D20\u81EA\u5DF1\u4E0D\u518D\u5199 margin \u2014\u2014 \u514D\u5F97\u4E24\u5904\u76F8\u52A0\u3001\u4EE5\u540E\u6539\u4E0D\u52A8\u3002 */
.t-team-cat-page{display:flex;flex-direction:column;gap:14px}
.t-team-cat-section{display:flex;flex-direction:column;gap:8px}
.t-team-tabs{display:flex;gap:6px;border-bottom:1px solid var(--dsw-alias-border-l2);padding-bottom:6px}
.t-team-tab{border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;padding:4px 10px;border-radius:6px;cursor:pointer}
.t-team-tab[data-active="true"]{background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-primary);font-weight:600}
.t-team-tabbody{display:flex;flex-direction:column;gap:12px;min-height:0}
.t-team-tabbody[hidden]{display:none}
.t-team-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.t-team-label{font-size:12px;color:var(--dsw-alias-label-caption);min-width:52px}
.t-team-emoji{font-size:14px;line-height:1}
.t-team-groups{display:flex;flex-direction:column;gap:6px}
.t-team-editor{display:flex;flex-direction:column;gap:10px;border-top:1px dashed var(--dsw-alias-border-l2);padding-top:10px}
.t-team-field{display:flex;flex-direction:column;gap:4px}
.t-team-field > span{font-size:12px;color:var(--dsw-alias-label-caption)}
/* \u8868\u5355\u91CC\u7684\u8F93\u5165\u6846\uFF1A.t-team-input \u7684 flex-basis \u662F\u7ED9\u6A2A\u5411\u641C\u7D22\u6761\u7528\u7684\uFF0C\u7AD6\u5411\u5BB9\u5668\u91CC\u4F1A\u628A\u5B83\u6491\u6210 200px \u9AD8 */
.t-team-field .t-team-input{flex:0 0 auto;width:100%;min-width:0;height:30px}
.t-team-editor .t-team-input{flex:0 0 auto;height:30px}
/* \u81EA\u5EFA\u4E13\u5BB6\u7F16\u8F91\u5668\uFF1A\u6B63\u6587\u662F\u591A\u884C Markdown\uFF0C\u6587\u672C\u6846\u8981\u80FD\u62C9\u9AD8 */
.t-team-editor textarea.t-team-input{height:auto;min-height:150px;resize:vertical;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:18px}
.t-team-editor .t-team-editor-actions{display:flex;gap:8px;justify-content:flex-end}
.t-team-badge-custom{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);font-size:10px;line-height:16px;vertical-align:middle;color:var(--dsw-alias-label-caption)}
.t-team-danger{color:var(--dsw-alias-state-error-primary);border-color:var(--dsw-alias-state-error-primary)}
/* \u7AD6\u5411 tab \u5BB9\u5668\u91CC\u7684\u641C\u7D22\u6846\u540C\u7406\uFF1A\u8BBE\u7F6E\u9875\u300C\u961F\u4F0D\u300Dtab \u7684\u641C\u7D22\u6846\u66FE\u7ECF\u88AB\u6491\u6210 200px \u9AD8 */
.t-team-tabbody > .t-team-input{flex:0 0 auto;width:100%;min-width:0;height:30px}
.t-team-picker{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}
.t-team-picker-list{max-height:220px;overflow:auto;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;padding:6px}
.t-team-picker-row{display:flex;align-items:center;gap:6px;padding:3px 4px;border-radius:6px;font-size:12px;cursor:pointer}
.t-team-picker-row:hover{background:var(--dsw-alias-bg-layer-3)}
.t-team-picker-slug{color:var(--dsw-alias-label-caption);font-family:var(--dsw-font-markdown-code-block-small);font-size:11px}
.t-team-selected-row{display:flex;align-items:center;gap:6px;font-size:12px;padding:3px 4px;border-bottom:1px solid var(--dsw-alias-border-l2)}
.t-team-badge{font-size:11px;border-radius:999px;padding:1px 8px;background:var(--dsw-alias-bg-layer-3);color:var(--dsw-alias-label-secondary)}
.t-team-badge[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.t-team-badge[data-tone="error"]{color:var(--dsw-alias-state-error-primary)}
.t-team-team-meta{font-size:12px;color:var(--dsw-alias-label-caption);display:flex;gap:10px;flex-wrap:wrap}
.t-team-note{font-size:11px;color:var(--dsw-alias-label-caption)}
.t-team-ok{font-size:12px;color:var(--dsw-alias-state-success-primary)}
/* ---- \u8BBE\u7F6E\u9762\u677F\u5916\u58F3\u4E0E\u5361\u7247\uFF082026-09-28\uFF09----
   \u9762\u677F\u4ECE\u300C\u8BBE\u7F6E \u2192 T\u4E13\u5BB6\u300D\u642C\u5230\u300C\u63D2\u4EF6\u5217\u8868 \u2192 T\u4E13\u5BB6\u300D\u7684\u63D2\u4EF6\u4FE1\u606F\u9875\uFF0C\u5916\u89C2\u5BF9\u9F50 dsh-helper \u7684\u8BBE\u7F6E\u5361\u7247\uFF1A
   1px \u8FB9\u6846 + 12px \u5706\u89D2\u3002\u8FB9\u6846\u523B\u610F\u4E0D\u7528\u5B98\u65B9\u7684 0.5px \u2014\u2014 \u6D45\u8272\u4E3B\u9898\u4E0B --dsw-alias-border-l3 \u53EA\u6709 12% \u9ED1\uFF0C
   0.5px \u5728\u767D\u5E95\u4E0A\u51E0\u4E4E\u770B\u4E0D\u89C1\u8FB9\u754C\uFF0C\u800C\u5206\u7EC4\u5168\u9760\u8FD9\u6761\u7EBF\uFF08bg-layer-* \u5728\u6D45\u8272\u4E0B\u5168\u662F #fff\uFF0C\u5E95\u8272\u6307\u671B\u4E0D\u4E0A\uFF09\u3002 */
.t-team-panel{display:flex;flex-direction:column;gap:12px;min-height:0;color:var(--dsw-alias-label-primary)}
.t-team-panel-card{display:flex;flex-direction:column;gap:10px;padding:12px 14px;border:1px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md,12px);min-width:0}
.t-team-panel-card-head{display:flex;flex-direction:column;gap:2px}
.t-team-panel-card-title{font-size:13.5px;line-height:20px;font-weight:600;color:var(--dsw-alias-label-primary)}
.t-team-panel-card-hint{font-size:12px;line-height:18px;color:var(--dsw-alias-label-caption)}
/* \u5B98\u65B9 SegmentedTabs \u7684\u5E95\u69FD\u662F grid\uFF0C\u843D\u5728 flex \u5217\u5BB9\u5668\u91CC\u4F1A\u88AB\u62C9\u4F38\u5230\u6574\u884C\u5BBD\uFF08\u6807\u7B7E\u6324\u5728\u5DE6\u8FB9\uFF09\u3002
   \u8FD9\u91CC\u53EA\u8BA9\u5B83\u6536\u7F29\u5230\u5185\u5BB9\u5BBD\u5EA6 \u2014\u2014 \u522B\u7684\u5E03\u5C40\u5C5E\u6027\u4E00\u4E2A\u90FD\u522B\u5199\uFF1A\u4E0E\u5B98\u65B9 .tabs \u7279\u5F02\u6027\u76F8\u540C\uFF0C
   \u6211\u4EEC\u7684\u6837\u5F0F\u8868\u540E\u6CE8\u5165\uFF0C\u591A\u5199\u4E00\u6761\u5C31\u76D6\u6389\u5B98\u65B9\u4E00\u6761\uFF08\u7B2C\u4E00\u7248\u590D\u7528 .t-team-tabs \u5C31\u662F\u8FD9\u4E48\u574F\u7684\uFF09\u3002 */
.t-team-panel-tabs{align-self:flex-start;width:fit-content;max-width:100%}
.t-team-settings{display:flex;flex-direction:column;gap:12px;min-height:0;color:var(--dsw-alias-label-primary)}
.t-team-head{display:flex;flex-direction:column;gap:4px}
.t-team-title{font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary)}
.t-team-meta{font-size:12px;color:var(--dsw-alias-label-secondary)}
.t-team-bar{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
/* \u5206\u7C7B\u7BA1\u7406\u9875\u300C\u65B0\u5EFA\u5206\u7C7B\u300D\u680F\u7684\u4E24\u4E2A\u8F93\u5165\u6846\uFF082026-09-28 \u7528\u6237\u62A5\u300C\u6837\u5F0F\u4E0D\u6B63\u5E38\uFF0C\u592A\u5927\u4E86\u300D\uFF0C\u968F\u540E\u8865\u4E00\u53E5
   \u300C\u660E\u663E\u8F93\u5165\u6846\u91CC\u9762\u7684\u5B57\u4F53\u6BD4\u522B\u7684\u5730\u65B9\u5927\u300D\uFF09\uFF1A
   \u5B83\u4EEC\u539F\u5148\u5B8C\u5168\u5403 .t-team-input \u7684\u901A\u7528\u9ED8\u8BA4\u503C \u2014\u2014
     \xB7 flex:1 1 200px \u8BA9\u4E24\u4E2A\u6846\u5728\u6574\u884C\u91CC\u5BF9\u534A\u6491\u5F00\uFF08\u5B9E\u6D4B\u5404\u7EA6 236px\uFF0C\u51E0\u4E4E\u5360\u6EE1\u4E00\u884C\uFF09\uFF1B
     \xB7 \u6CA1\u6709\u663E\u5F0F height / font-size\uFF0C\u5B57\u53F7\u4E0E\u884C\u9AD8\u5168\u90E8\u7EE7\u627F\u5BBF\u4E3B\u8BBE\u7F6E\u9875\uFF0814px / 1.6\uFF09\uFF0C
       padding \u53C8\u662F\u7ED9\u6A2A\u5411\u641C\u7D22\u6761\u7528\u7684 6px 10px\u3002
   \u4E8E\u662F\u5B83\u4EEC\u6BD4\u540C\u9875\u5176\u5B83\u63A7\u4EF6\uFF08\u80F6\u56CA\u6309\u94AE 12px \u5B57\uFF09\u5927\u4E00\u53F7\uFF0C\u7A84\u9762\u677F\u4E0B\u8FD8\u628A\u300C\u521B\u5EFA\u5206\u7C7B\u300D\u6324\u5230\u7B2C\u4E8C\u884C\u3002
   \u8FD9\u91CC\u6309\u540C\u9875\u63A7\u4EF6\u90A3\u4E00\u6863\u9489\u6B7B\uFF1A28px \u9AD8 / 12px \u5B57\u53F7\u3001padding 4px 8px\u3001\u884C\u9AD8 18px
   \uFF0828 - 4\xD72 - 1\xD72 = 18\uFF0C\u6B63\u597D\u88C5\u4E0B\uFF09\uFF1B\u5BBD\u5EA6\u300C\u57FA\u51C6 190px + \u4E0A\u9650 280px\u300D\u2014\u2014 \u7A84\u9762\u677F\u4E0B\u4E0E\u6309\u94AE\u540C\u6392\uFF0C
   \u5BBD\u9762\u677F\u4E0B\u4E5F\u4E0D\u4F1A\u88AB\u62C9\u6210\u5927\u957F\u6761\u3002
   \u26A0\uFE0F \u9009\u62E9\u5668**\u5FC5\u987B\u5E26 .t-team-bar \u524D\u7F00**\uFF08= \u7279\u5F02\u6027 0,2,0\uFF09\uFF1A\u901A\u7528\u89C4\u5219 .t-team-input \u662F 0,1,0\uFF0C
   \u4F46\u5B83\u5B9A\u4E49\u5728\u672C\u6761**\u540E\u9762**\uFF0C\u540C\u7EA7\u7279\u5F02\u6027\u4E0B\u540E\u8005\u80DC \u2014\u2014 2026-09-28 \u7B2C\u4E00\u7248\u5C31\u662F\u53EA\u7528 .t-team-cat-new\uFF080,1,0\uFF09\uFF0C
   \u7ED3\u679C font:inherit / padding / flex \u4E09\u6837\u5168\u88AB\u5B83\u76D6\u56DE\u53BB\uFF1A\u6846\u77EE\u4E86\uFF08height \u751F\u6548\uFF09\u4F46\u5B57\u6CA1\u53D8\u5C0F\uFF0C
   \u4E8E\u662F\u7528\u6237\u770B\u5230\u7684\u6B63\u662F\u300C\u6846\u53D8\u5C0F\u4E86\u3001\u5B57\u8FD8\u662F\u5927\u7684\u300D\u3002\u524D\u7F00\u4E00\u52A0\u5C31\u7A33\uFF08\u4E0D\u4F9D\u8D56\u4E66\u5199\u987A\u5E8F\uFF09\u3002
   \u26A0\uFE0F \u7C7B\u540D\u5199\u5728 input \u81EA\u5DF1\u8EAB\u4E0A\uFF08\u4E0D\u5199\u5BB9\u5668\uFF09\uFF0C\u662F\u672C\u4ED3\u5E93 CSS \u4E0E verify \u7684\u5171\u540C\u7EA6\u5B9A\uFF1A
   t-team-cat-new \u5FC5\u987B\u662F**\u7D27\u8DDF\u89C4\u5219\u4F53**\u7684\u7C7B\u540D\uFF08verify \u53EA\u8BA4\u300C.\u7C7B\u540D + \u5DE6\u82B1\u62EC\u53F7\u300D\uFF09\u3002 */
.t-team-bar .t-team-cat-new{flex:1 1 190px;min-width:0;max-width:280px;height:28px;box-sizing:border-box;padding:4px 8px;font-size:12px;line-height:18px}
/* \u4E13\u5BB6\u9875\u641C\u7D22\u6846\uFF082026-09-28 \u7528\u6237\u62A5\u300C\u8FD9\u4E2A\u8F93\u5165\u6846\u4E5F\u4FEE\u590D\u4E0B\u300D\uFF09\uFF1A\u4E0E\u5206\u7C7B\u65B0\u5EFA\u680F\u540C\u6E90 \u2014\u2014 \u5C3A\u5BF8\u5168\u9760\u4E0B\u9762\u7684
   \u901A\u7528\u9ED8\u8BA4\u503C\u3002\u5B57\u53F7\u7531\u57FA\u7C7B\u7EDF\u4E00\u9489\uFF08\u89C1 .t-team-input\uFF09\uFF0C\u8FD9\u91CC\u53EA\u9489\u9AD8\u5EA6\uFF1A28px\uFF08\u4E0E\u540C\u6392\u7684\u80F6\u56CA\u6309\u94AE\u3001
   \u5206\u7C7B\u65B0\u5EFA\u680F\u4E00\u81F4\uFF0C\u4E0D\u518D\u662F\u7EE7\u627F\u6765\u7684 32px\uFF09\u3002\u5BBD\u5EA6\u7EE7\u7EED\u8D70\u57FA\u7C7B\u7684 flex:1 1 200px\uFF0C\u81EA\u9002\u5E94\u5360\u6EE1\u641C\u7D22\u6761\u4F59\u91CF\u3002 */
/* \u7B5B\u9009\u680F\u91CC\u7684\u8F93\u5165\u6846\u6491\u5F00\u4F59\u91CF\uFF08\u7C7B\u540D\u7531 ui.jsx \u7684 TextInput \u52A0\u5728\u5B98\u65B9 Input \u7684 wrapper \u4E0A\uFF09\u3002
   2026-09-28 \u4ECE .t-team-search \u6539\u540D\uFF1A\u539F\u540D\u5B57\u6697\u793A\u5B83\u53EA\u5C5E\u4E8E\u4E13\u5BB6\u9875\u641C\u7D22\u6846\uFF0C\u5B9E\u9645\u5206\u7C7B\u9875\u65B0\u5EFA\u680F\u3001
   \u7F16\u8F91\u5668\u5B57\u6BB5\u4E5F\u7528\u540C\u4E00\u4E2A\u7EC4\u4EF6 \u2014\u2014 \u540D\u5B57\u4E0E\u7528\u9014\u5BF9\u9F50\uFF0C\u6539\u6837\u5F0F\u65F6\u624D\u4E0D\u4F1A\u8BEF\u4F24\u3002 */
.t-team-bar .t-team-input-field{flex:1 1 220px;min-width:0}
/* \u26A0\uFE0F font-size / line-height \u5FC5\u987B\u5199\u5728 font:inherit **\u4E4B\u540E**\uFF08\u540C\u4E00\u89C4\u5219\u4F53\u5185\u540E\u58F0\u660E\u8005\u80DC\uFF09\uFF1A
   font \u7B80\u5199\u4F1A\u628A size/line-height \u4E00\u8D77\u91CD\u7F6E\u6210\u7EE7\u627F\u503C\u30022026-09-28 \u7684\u6559\u8BAD \u2014\u2014 \u63D2\u4EF6\u5185\u6240\u6709\u6CA1\u663E\u5F0F\u5199
   font-size \u7684\u8F93\u5165\u6846\uFF08\u5206\u7C7B\u65B0\u5EFA\u680F\u3001\u4E13\u5BB6\u9875\u641C\u7D22\u6846\u3001\u7F16\u8F91\u5668\u5B57\u6BB5\u3001@ \u53EC\u5524\u5F39\u7A97\u7684\u641C\u7D22\u6846\u2026\uFF09\u90FD\u5728\u7EE7\u627F
   \u5BBF\u4E3B\u8BBE\u7F6E\u9875\u7684 14px\uFF0C\u6BD4\u65C1\u8FB9\u7684\u80F6\u56CA\u6309\u94AE\uFF0812px\uFF09\u5927\u4E00\u53F7\uFF0C\u7528\u6237\u662F\u4E00\u4E2A\u4E00\u4E2A\u62A5\u8FC7\u6765\u7684\u3002\u8FD9\u91CC\u4ECE\u57FA\u7C7B
   \u7EDF\u4E00\u9489\u6B7B 12px / 18px\uFF0C\u5404\u5904\u4E0D\u7528\u518D\u5404\u5199\u4E00\u904D\u3002 */
.t-team-input{flex:1 1 200px;min-width:160px;box-sizing:border-box;padding:6px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:18px;outline:none}
.t-team-input:focus{border-color:var(--dsw-alias-button-primary-fill)}
.t-team-select{box-sizing:border-box;height:30px;padding:0 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;cursor:pointer;max-width:180px}
.t-team-select:hover{background:var(--dsw-alias-interactive-bg-hover)}
.t-team-chip{padding:3px 10px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;cursor:pointer}
.t-team-chip:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.t-team-chip:disabled{opacity:.5;cursor:default}
.t-team-chip[data-active="true"]{background:var(--dsw-alias-button-ghost-active-fill);border-color:var(--dsw-alias-button-ghost-active-border);color:var(--dsw-alias-label-primary);font-weight:600}
/* \u7834\u574F\u6027\u52A8\u4F5C\uFF08\u5220\u9664\u81EA\u5EFA\u4E13\u5BB6 / \u5206\u7C7B\uFF09\uFF1A\u5E38\u6001\u5C31\u5E26\u4E0A\u9519\u8BEF\u8272\uFF0C\u522B\u7B49 hover \u624D\u63D0\u793A\u3002 */
.t-team-chip[data-tone="error"]{color:var(--dsw-alias-state-error-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 40%,transparent)}
.t-team-chip[data-tone="error"]:hover{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary)}
.t-team-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px 12px}
.t-team-group{margin-top:0}
.t-team-division{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary)}
/* \u5206\u7C7B\u6298\u53E0\u5934 = **\u6761\u72B6\u5361\u7247**\uFF082026-09-28 \u7528\u6237\uFF1A\u300C\u6298\u53E0\u4F4D\u7F6E\u6709\u70B9\u4E0D\u660E\u663E\uFF0C\u505A\u4E00\u4E2A\u5E95\u5361\u7247\u300D\uFF09\uFF1A
   \u65E9\u5148\u53EA\u6709\u4E00\u884C\u88F8\u6587\u672C + \u4E00\u4E2A\u5C0F chevron\uFF0C14 \u4E2A\u5206\u7C7B\u6392\u4E0B\u6765\u50CF\u4E00\u4E32\u6563\u5F00\u7684\u5B57\uFF0C\u770B\u4E0D\u51FA\u54EA\u5757\u80FD\u70B9\u3002
   \u73B0\u5728\u6574\u6761\u6709\u8FB9\u6846\u3001\u5706\u89D2\u4E0E\u5E95\u8272\uFF0Cchevron \u63A8\u5230\u53F3\u7AEF\uFF1B\u5C55\u5F00\u6001\u6362\u6210\u767D\u5E95 + \u6DF1\u4E00\u6863\u8FB9\u6846\uFF0C
   \u4E00\u773C\u80FD\u770B\u51FA\u54EA\u4E2A\u5206\u7C7B\u662F\u5F00\u7740\u7684\u3002
   \u5E95\u8272\u7528 --dsw-alias-interactive-bg-hover \u800C\u4E0D\u662F bg-layer-*\uFF1A\u6D45\u8272\u4E3B\u9898\u4E0B\u540E\u8005\u662F #fff\uFF0C
   \u4E0E\u9875\u9762\u540C\u8272\uFF08\u5B9E\u6D4B\u8FC7\uFF09\uFF0C\u5361\u7247\u5C31\u767D\u505A\u4E86\u3002 */
.t-team-group-head{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;padding:9px 12px;margin:0 0 8px;border:1px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-interactive-bg-hover);color:inherit;font:inherit;cursor:pointer;text-align:left}
.t-team-group-head:hover{border-color:var(--dsw-alias-border-l2)}
.t-team-group-head[aria-expanded="true"]{background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-border-l2)}
.t-team-group-head:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.t-team-group-chevron{margin-left:auto;flex:none;font-size:11px;line-height:1;color:var(--dsw-alias-label-caption)}
/* \u7EDF\u8BA1\u884C\u4E0E\u300C\u5168\u90E8\u5C55\u5F00 / \u5168\u90E8\u6536\u8D77\u300D\u540C\u4E00\u884C\uFF1A\u5DE6\u7EDF\u8BA1\u3001\u53F3\u6309\u94AE\u3002 */
.t-team-meta-row{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0}
/* \u5361\u7247\u8FB9\u6846\uFF082026-09-26 \u7528\u6237\u53CD\u9988\u300C\u8FB9\u6846\u592A\u660E\u663E\u4E86\uFF0C\u4E0D\u534F\u8C03\u300D\uFF09\uFF1A
   \u539F\u5148\u300C\u5DF2\u542F\u7528\u300D\u7684\u5361\u7247\u7528 button-primary-fill \u63CF\u8FB9\uFF0C\u4F46\u9010\u4E13\u5BB6\u542F\u505C\u5F00\u5173\u65E9\u5DF2\u4E0B\u7EBF
   \uFF08\u89C1 settings.jsx \u91CC\u90A3\u6BB5\u6CE8\u91CA\uFF09\uFF0C\u540D\u5355\u9ED8\u8BA4\u5168\u90E8\u542F\u7528 \u2014\u2014 \u4E8E\u662F 323 \u5F20\u5361\u65E0\u4E00\u4F8B\u5916\u90FD\u6302\u4E0A
   \u8FD1\u767D\u4E3B\u8272\u63CF\u8FB9\uFF08\u6DF1\u8272\u4E3B\u9898\u4E0B\u5C31\u662F --dsw-static-neutral-bluish-50 = #f9fafb\uFF09\uFF0C
   \u5728 #2c2c2e \u7684\u5361\u7247\u5E95\u4E0A\u4EAE\u6210\u4E00\u6761\u6761\u767D\u6846\uFF0C\u65E2\u6CA1\u6709\u533A\u5206\u610F\u4E49\u53C8\u5F88\u624E\u773C\u3002
   \u73B0\u5728\uFF1A\u5E38\u6001\u7528\u6700\u6DE1\u7684 border-l1\uFF0C\u60AC\u505C\u624D\u62AC\u5230 border-l2\uFF1B\u5361\u7247\u4E0E\u9875\u9762\u7684\u5C42\u6B21\u4EA4\u7ED9
   bg-layer-2 \u672C\u8EAB\u53BB\u8868\u8FBE\u3002\u82E5\u4EE5\u540E\u6062\u590D\u300C\u6309\u4E13\u5BB6\u542F\u505C\u300D\uFF0C\u518D\u6309\u9700\u7ED9\u505C\u7528\u7684\u5361\u7247\u52A0\u533A\u5206
   \uFF08\u522B\u518D\u7528\u4E3B\u8272\u63CF\u8FB9\uFF0C\u5B83\u662F\u7ED9\u6309\u94AE\u7528\u7684\uFF09\u3002 */
.t-team-card{position:relative;display:grid;min-width:0;min-height:132px;overflow:hidden;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2)}
.t-team-card:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l2)}
/* \u53F3\u4E0A\u89D2\u5DE5\u5177\u4F4D\uFF1A\u67E5\u770B\u63D0\u793A\u8BCD + \u542F\u505C\u5F00\u5173 */
.t-team-card-tools{position:absolute;top:8px;right:8px;display:flex;align-items:center;gap:6px;z-index:1}
.t-team-icon-btn{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;padding:0;border-radius:6px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-tertiary);font:inherit;font-size:13px;line-height:1;cursor:pointer}
.t-team-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.t-team-icon-btn:disabled{opacity:.45;cursor:not-allowed}
.t-team-card-body{display:grid;grid-template-columns:44px minmax(0,1fr);column-gap:10px;row-gap:8px;padding:12px}
/* \u63D0\u793A\u8BCD\u5F39\u7A97 */
.t-team-mask{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;padding:32px;background:var(--dsw-alias-bg-mask-1,#0000003d)}
.t-team-modal{display:flex;flex-direction:column;width:min(720px,100%);max-height:min(70vh,640px);overflow:hidden;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-3);box-shadow:var(--dsw-shadow-lv3);color:var(--dsw-alias-label-primary)}
.t-team-modal-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid var(--dsw-alias-border-l2);font-size:14px;font-weight:600}
.t-team-modal-body{margin:0;padding:14px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:19px;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-secondary)}
/* ---- \u5B98\u65B9 Modal \u7684\u9AD8\u5EA6\u7EA6\u675F\uFF082026-09-28 \u4FEE\uFF1A\u63D0\u793A\u8BCD\u5F39\u7A97\u6F2B\u51FA\u5C4F\u5E55\uFF09----
   \u5B98\u65B9 .dialog \u6CA1\u6709 max-height \u2014\u2014 Modal.module.css \u7684\u6CE8\u91CA\u628A\u8FD9\u4EF6\u4E8B\u660E\u786E\u4EA4\u7ED9\u8C03\u7528\u65B9
   \uFF08consumers cap growth with max-height: 100%\uFF09\u3002\u5B83\u540C\u65F6 createPortal \u5230 body\uFF0C
   .root \u53EA\u8D1F\u8D23\u5C45\u4E2D\u3001\u4E0D\u6EDA\u52A8\uFF0C\u6240\u4EE5\u5185\u5BB9\u4E00\u957F\u5C31\u6574\u4F53\u9876\u51FA\u89C6\u53E3\uFF1A\u7528\u6237\u770B\u5230\u7684\u662F\u300C\u5F39\u7A97\u6837\u5F0F\u5D29\u4E86\u3001
   \u6587\u5B57\u6F2B\u51FA\u5C4F\u5E55\u300D\uFF0C\u800C\u4E0D\u662F\u4E00\u4E2A\u80FD\u6EDA\u7684\u5BF9\u8BDD\u6846\u3002\u4E13\u5BB6 persona \u52A8\u8F84\u4E0A\u4E07\u884C\uFF0C\u5FC5\u7136\u89E6\u53D1\u3002
   \u4E09\u5C42\u7684\u5206\u5DE5\uFF08\u7F3A\u4E00\u5C42\u90FD\u4E0D\u751F\u6548\uFF09\uFF1A
     .t-team-modal-fit         \u2192 dialog \u76F8\u5BF9 .root \u7684 padding box \u515C\u4F4F\u9AD8\u5EA6
     .t-team-modal-fit-content \u2192 .content \u5141\u8BB8\u6536\u7F29\uFF08flex \u5B50\u9879\u9ED8\u8BA4 min-height:auto\uFF0C\u4F1A\u628A\u7236\u7EA7\u6491\u7834\uFF09
     .content > div:last-child \u2192 \u5B98\u65B9 .body\uFF08\u6807\u9898\u680F\u4E0E footer \u7684\u5144\u5F1F\uFF09\uFF0C\u8BA9\u5B83\u81EA\u5DF1\u6EDA\uFF0C
                                 \u4E8E\u662F\u6807\u9898\u56FA\u5B9A\u5728\u9876\u90E8\u3001\u5173\u95ED\u6309\u94AE\u59CB\u7EC8\u53EF\u70B9
   \u26A0\uFE0F \u4E0D\u8981\u628A\u8FD9\u4E9B\u89C4\u5219\u5408\u5E76\u8FDB\u4E0A\u9762\u90A3\u5957 .t-team-modal-*\uFF1A\u90A3\u662F\u81EA\u7ED8\u515C\u5E95 Modal \u7684\u6837\u5F0F\uFF0C
   \u7ED9\u5B98\u65B9 dialog \u5957\u4E0A\u53BB\u4F1A\u628A\u5B98\u65B9\u5916\u89C2\uFF08380px \u5BBD\u300124px \u5706\u89D2\u3001layer-2 \u5E95\u8272\uFF09\u6574\u7247\u8986\u76D6\u6389\u3002 */
.t-team-modal-fit{max-height:100%}
.t-team-modal-fit-content{min-height:0}
.t-team-modal-fit-content > div:last-child{min-height:0;overflow:auto}
/* \u63D0\u793A\u8BCD\u5F39\u7A97\u7684\u590D\u5236\u6309\u94AE\uFF1A\u5B98\u65B9\u6807\u9898\u680F\u53EA\u6709\u300C\u6807\u9898 + \u5173\u95ED\u300D\u4E24\u4E2A\u4F4D\u7F6E\u3001\u6CA1\u6709\u63D2\u69FD\uFF0C\u6240\u4EE5\u6309\u94AE\u6E32\u67D3\u5728
   \u6B63\u6587\u4E4B\u524D\uFF0C\u9760\u7EDD\u5BF9\u5B9A\u4F4D"\u843D"\u5230\u5173\u95ED\u6309\u94AE\u5DE6\u4FA7\u3002\u5B9A\u4F4D\u57FA\u51C6\u662F\u5B98\u65B9 .dialog \u2014\u2014 Modal.module.css
   \u7ED9\u5B83 position: relative\uFF0C\u56E0\u6B64\u6B63\u6587\u6EDA\u52A8\u65F6\u6309\u94AE\u7EB9\u4E1D\u4E0D\u52A8\u3002
   top/right \u662F\u7167\u7740\u5B98\u65B9 .header \u7684 padding \u4E0E .close \u7684\u5C3A\u5BF8\u7B97\u7684\uFF1A
     top    = header \u7684 padding-top 22px\uFF08\u4E0E\u5173\u95ED\u6309\u94AE\u540C\u9AD8\u8D77\u7B97\uFF09\uFF1B
     right  = header \u7684 padding-right 14px + .close \u7684 28px \u5BBD + 8px \u95F4\u9694 = 50px\u3002
   \u26A0\uFE0F \u8FD9\u4E09\u4E2A\u6570\u503C\u6765\u81EA Modal.module.css\uFF0C\u5B98\u65B9\u82E5\u8C03\u6574\u6807\u9898\u680F\u5C3A\u5BF8\uFF0C\u8FD9\u91CC\u8981\u8DDF\u7740\u6539
   \uFF08verify \u6709\u4E00\u6761\u65AD\u8A00\u76EF\u7740\u8FD9\u6761\u89C4\u5219\u5728\u4E0D\u5728\uFF0C\u4F46\u7B97\u4E0D\u51FA\u504F\u79FB\u91CF\u662F\u5426\u4ECD\u5BF9\u9F50\uFF09\u3002 */
.t-team-prompt-tools{position:absolute;top:22px;right:50px;z-index:2;display:flex;align-items:center;height:28px}
/* ---- \u4E24\u4E2A\u5F39\u7A97\u7684\u5C3A\u5BF8\uFF082026-09-28 \u7B2C\u4E8C\u8F6E\uFF1A\u7528\u6237\u300C\u592A\u957F \u592A\u7A84\u300D\uFF09----
   \u5B98\u65B9 .dialog \u662F min(380px,100%) \u5BBD\u3001\u9AD8\u5EA6\u4E0D\u8BBE\u9650 \u2014\u2014 \u90A3\u5957\u5C3A\u5BF8\u662F\u7ED9\u300C\u786E\u8BA4\u6846\u300D\u8BBE\u8BA1\u7684
   \uFF08\u4E00\u53E5\u8BDD + \u4E24\u4E2A\u6309\u94AE\uFF09\u3002\u6211\u4EEC\u62FF\u5B83\u88C5\u4E24\u7C7B**\u957F\u5185\u5BB9**\uFF0C\u5F62\u72B6\u5C31\u5B8C\u5168\u4E0D\u5BF9\u4E86\uFF1A
     \xB7 \u63D0\u793A\u8BCD\u5F39\u7A97\uFF1A\u4E13\u5BB6 persona \u5168\u6587\uFF0C\u52A8\u8F84\u4E0A\u4E07\u884C\uFF1B
     \xB7 \u7F16\u8F91\u5668\u5F39\u7A97\uFF1A\u591A\u884C Markdown \u6B63\u6587\u3002
   380px \u5BBD\u5BF9\u957F\u884C\u6587\u672C\u610F\u5473\u7740\u51E0\u4E4E\u6BCF\u53E5\u90FD\u6298\u884C\uFF0C\u518D\u914D\u5408\u6491\u6EE1\u89C6\u53E3\u7684\u9AD8\u5EA6 = \u53C8\u9AD8\u53C8\u7A84\u7684\u7A84\u6761\uFF0C
   \u8BFB\u8D77\u6765\u50CF\u4ECE\u95E8\u7F1D\u91CC\u770B\u3002
   \u7B2C\u4E00\u8F6E\uFF080.4.10\uFF09\u53EA\u6CBB\u4E86\u300C\u6F2B\u51FA\u5C4F\u5E55\u300D\uFF0C\u6CA1\u6709\u6CBB\u5F62\u72B6\u3002\u8FD9\u91CC\u6309\u5185\u5BB9\u7C7B\u578B\u7ED9\u5C3A\u5BF8\uFF1A
     \xB7 \u63D0\u793A\u8BCD\u662F\u7EAF\u9605\u8BFB\uFF0C\u7ED9\u6700\u5BBD\u7684\u4E00\u6863\uFF0C\u884C\u5C3D\u91CF\u4E0D\u6298\uFF1B
     \xB7 \u7F16\u8F91\u5668\u6709\u8868\u5355\u5B57\u6BB5\uFF0C\u7A0D\u7A84\u4E00\u70B9\u66F4\u805A\u62E2\u3002
   \u4E24\u6863\u9AD8\u5EA6\u4E00\u81F4\uFF0C\u5207\u6765\u5207\u53BB\u4E0D\u4F1A\u8DF3\u3002
   \u26A0\uFE0F \u5FC5\u987B\u5199\u5728 .t-team-modal-fit \u4E4B\u540E\uFF1A\u4E24\u7EC4\u90FD\u662F\u5355\u7C7B\u9009\u62E9\u5668\u3001\u7279\u5F02\u6027\u76F8\u540C\uFF0C
   max-height \u8C01\u5728\u540E\u9762\u8C01\u751F\u6548\u3002 */
.t-team-prompt-modal{width:min(960px,94vw);max-height:min(84vh,800px)}
.t-team-editor-modal{width:min(860px,94vw);max-height:min(84vh,800px)}
/* \u63D0\u793A\u8BCD\u6B63\u6587\uFF1A\u53EA\u8D1F\u8D23\u6392\u7248\uFF0C\u6EDA\u52A8\u4EA4\u7ED9\u4E0A\u9762\u90A3\u5C42 .body\uFF0C\u6240\u4EE5\u8FD9\u91CC\u4E0D\u8BBE padding/overflow\u3002 */
.t-team-prompt-body{margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:19px;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-secondary)}
.t-team-avatar{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:50%;background:var(--dsw-alias-bg-layer-3);font-size:22px;line-height:1}
.t-team-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}
.t-team-cloud{border:0;background:none;padding:0;margin-inline-start:4px;cursor:pointer;font-size:inherit;line-height:1}.t-team-cloud:hover{opacity:.7}
.t-team-identity{display:flex;min-width:0;flex-direction:column;padding-right:46px}
.t-team-card-name{font-size:14px;font-weight:600;line-height:20px;color:var(--dsw-alias-label-primary);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.t-team-card-division{font-size:13px;line-height:18px;margin-top:2px;color:var(--dsw-alias-label-secondary)}
.t-team-card-slug{font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.t-team-card-desc{grid-column:1/-1;margin:0;min-height:60px;font-size:14px;line-height:20px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden}
/* \u5206\u7C7B\u5217\u8868 = \u4E00\u5F20\u5361\u7247\u3002\u8FD9\u662F\u4E24\u8F6E\u53CD\u9988\u5F97\u51FA\u7684\u7ED3\u8BBA\uFF1A
   \u7B2C\u4E00\u8F6E\u300C\u7EBF\u8D34\u4F4F\u4E86\u6309\u94AE\u300D\u2192 \u884C\u9AD8\u653E\u5F00\u5230 40px\uFF1B\u7B2C\u4E8C\u8F6E\u6211\u628A\u5916\u6846\u6574\u4E2A\u5220\u6389 \u2192 \u7528\u6237\u300C\u6CA1\u8FB9\u6846\u4E86\u300D\u3002
   \u4E5F\u5C31\u662F\u8BF4**\u8FB9\u6846\u662F\u8981\u7684**\uFF0C\u6BDB\u75C5\u53EA\u662F\u5B83\u79BB\u5185\u5BB9\u592A\u8FD1\u3002\u73B0\u5728\u6062\u590D 1px \u8FB9\u6846 + 10px \u5706\u89D2 + \u8F7B\u5E95\u8272\uFF0C
   \u5E76\u7ED9\u5217\u8868\u52A0 4px \u5185\u8FB9\u8DDD\uFF1A\u6846\u4E0E\u884C\u4E4B\u95F4 4px\u3001\u884C\u81EA\u5DF1\u8FD8\u6709 6px\uFF0C\u4E00\u5171 10px \u7559\u767D\u3002
   \u89C2\u611F\u4E0E\u9762\u677F\u91CC\u5176\u5B83\u5361\u7247\uFF08\u5206\u7C7B\u6298\u53E0\u5934\u3001\u4E13\u5BB6\u5361\u7247\uFF09\u4E00\u81F4\u3002 */
.t-team-cat-list{display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-layer-2);padding:4px 0;overflow:hidden}
.t-team-cat-list[data-scroll="true"]{max-height:300px;overflow-y:auto}
/* 2026-09-28 \u7528\u6237\uFF1A\u300C\u6709 2 \u6761\u6A2A\u7EBF\u90FD\u8D34\u5230\u4E86\u6309\u94AE\u300D\u2014\u2014 \u5206\u7C7B\u5217\u8868\u7684\u5916\u6846\u4E0A\u4E0B\u8FB9\u7D27\u8D34\u884C\u91CC\u90A3\u9897
   \u5B98\u65B9 Button\uFF0828px \u9AD8\uFF09\uFF0C\u800C\u539F\u5148\u884C\u5185\u8FB9\u8DDD\u53EA\u6709 3px\uFF0C\u7B49\u4E8E\u7EBF\u4E0E\u6309\u94AE\u4E4B\u95F4\u6CA1\u6709\u7F1D\u3002
   \u73B0\u5728\u884C\u9AD8 40px\uFF0828 + \u4E0A\u4E0B\u5404 6\uFF09\uFF0C\u7EBF\u5C31\u843D\u5728\u7559\u767D\u91CC\u4E86\u3002 */
.t-team-cat-row{display:flex;flex-direction:row;align-items:center;gap:8px;min-height:40px;padding:6px 10px;box-sizing:border-box;border-top:1px solid var(--dsw-alias-border-l2)}
.t-team-cat-row:first-child{border-top:0}
.t-team-cat-row:hover{background:var(--dsw-alias-interactive-bg-hover)}
.t-team-cat-name{flex:0 1 auto;min-width:0;font-size:13px;font-weight:600;line-height:18px;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.t-team-cat-key{flex:0 1 auto;min-width:0;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.t-team-cat-count{flex:none;margin-left:auto;font-size:12px;line-height:16px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.t-team-cat-actions{flex:none;display:flex;align-items:center;gap:6px}
.t-team-cat-row .t-team-input{flex:0 1 180px;min-width:120px;height:26px;padding:2px 8px;font-size:12px}
.t-team-cat-row .t-team-chip{flex:none;white-space:nowrap}
.t-team-cat-empty{padding:8px 10px;font-size:12px;color:var(--dsw-alias-label-caption)}
.t-team-cat-list .t-team-badge{flex:none}
.t-team-badge[data-tone="custom"]{color:var(--dsw-alias-label-primary);border:1px solid var(--dsw-alias-border-l2);background:transparent}
/* \u4E13\u5BB6\u5361\u7247\u4E0A\u7684\u542F\u7528\u5F00\u5173\u3002\u26A0\uFE0F \u7C7B\u540D\u5FC5\u987B**\u81EA\u6210\u4E00\u5957**\uFF1A\u5B83\u66FE\u4E0E\u8BBE\u7F6E\u9875\u90A3\u4E2A\u5F00\u5173\u5171\u7528 .t-team-switch\uFF0C
 * \u4E8E\u662F\u540E\u5B9A\u4E49\u7684\u8FD9\u5957\uFF0828\xD716\u3001\u5F00\u542F\u8272\u6302\u5728 data-enabled \u4E0A\uFF09\u6574\u4F53\u8986\u76D6\u4E86\u8BBE\u7F6E\u9875\u90A3\u5957
 * \uFF0838\xD722\u3001\u5F00\u542F\u8272\u6302\u5728 data-on \u4E0A\uFF09\u2014\u2014 \u5BBD\u5EA6\u88AB\u538B\u6210 28px\u3001\u5F00\u542F\u8272\u6C38\u4E0D\u751F\u6548\uFF0C
 * \u754C\u9762\u4E0A\u5C31\u53D8\u6210"\u770B\u4E0D\u89C1\u7684\u5C0F\u80F6\u56CA"\u3002\u8BBE\u7F6E\u9875\u90A3\u4E2A\u5F00\u5173\u5DF2\u968F\u6D3B\u8DC3\u6307\u793A\u8FC1\u53BB dsh-helper
 * \uFF082026-09-28\uFF09\uFF0C\u4F46\u8FD9\u6761\u6559\u8BAD\u7559\u7740\uFF1A\u8FD9\u4E2A\u7C7B\u540D\u4E0D\u8981\u518D\u88AB\u522B\u7684\u5F00\u5173\u590D\u7528\u3002 */
.t-team-card-switch{position:relative;flex:none;width:28px;height:16px;padding:0;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);cursor:pointer;transition:background .15s ease,border-color .15s ease}
.t-team-card-switch-knob{position:absolute;top:1px;left:1px;width:12px;height:12px;border-radius:50%;background:var(--dsw-alias-label-tertiary);transition:transform .15s ease,background .15s ease}
.t-team-card-switch[data-enabled="true"]{background:var(--dsw-alias-button-primary-fill);border-color:var(--dsw-alias-button-primary-fill)}
.t-team-card-switch[data-enabled="true"] .t-team-card-switch-knob{transform:translateX(12px);background:var(--dsw-alias-label-primary-foreground)}
.t-team-card-switch:disabled{opacity:.45;cursor:not-allowed}
.t-team-conflict{font-size:11px;color:var(--dsw-alias-state-warn-primary)}
.t-team-error{font-size:12px;color:var(--dsw-alias-state-error-primary)}
/* \u540D\u518C\u5065\u5EB7\u63D0\u793A\uFF08sidecar \u7F3A\u5931 / \u6587\u4EF6\u88AB\u8DF3\u8FC7 / \u5206\u7C7B\u8BFB\u4E0D\u51FA\uFF09\uFF1A\u529F\u80FD\u4ECD\u5728\uFF0C\u6240\u4EE5\u4E0D\u662F error\uFF1B
   \u4F46\u5B83\u8BF4\u7684\u90FD\u662F"\u540D\u518C\u6B63\u5728\u9759\u9ED8\u7F3A\u4E1C\u897F"\uFF0C\u6BD4 note \u90A3\u79CD\u7070\u8272\u8BF4\u660E\u5FC5\u987B\u9192\u76EE \u2014\u2014 \u7528\u8B66\u544A\u8272\u3002 */
.t-team-warn{font-size:12px;line-height:1.6;color:var(--dsw-alias-state-warn-primary)}
/* \u9632\u5FA1\uFF1ArootRef <span> \u82E5\u88AB\u7236\u7EA7 flex/grid \u5BB9\u5668\u62C9\u6210\u5168\u5BBD\uFF08\u66FE\u89C1 1265px\uFF09\uFF0C\u6309\u94AE\u4F4D\u7F6E\u4F1A\u6F02\u8D70\u3002
   position:relative \u7ED9 pop \u63D0\u4F9B left/bottom \u5B9A\u4F4D\u4E0A\u4E0B\u6587\uFF1Bdisplay:inline-flex + align-self:flex-start +
   max-width:fit-content \u9501\u5B9A\u81EA\u8EAB\u5BBD\u5EA6\u4E3A\u6309\u94AE\u5185\u5BB9\u5BBD\u5EA6\u3002 */
.t-team-btn-wrap{position:relative;display:inline-flex;align-self:flex-start;width:auto;max-width:fit-content}
.t-team-btn{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:8px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;white-space:nowrap;cursor:pointer}
.t-team-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
/* \u6D6E\u5C42\u9AD8\u5EA6\u4E0A\u9650\uFF1A2026-09-20 \u7528\u6237\u8981\u6C42\u300C\u592A\u9AD8\u4E86\uFF0C\u7EDF\u4E00\u8C03\u77EE\u4E00\u70B9\u300D\u2014\u2014590px \u2192 460px\uFF1B
   2026-09-23 \u7528\u6237\u53C8\u8981\u300C\u518D\u9AD8\u4E00\u4E9B\uFF0C\u9AD8\u4E00\u4E2A\u5361\u7247\u591A\u4E00\u70B9\u300D\u2014\u2014460px \u2192 600px
   \uFF08\u5361\u7247 146px + \u884C\u95F4\u8DDD 10px = 156px\uFF0C\u518D\u7559\u70B9\u4F59\u91CF\uFF0C\u6B63\u597D\u591A\u5BB9\u4E00\u6574\u884C\u5361\u7247\uFF09\u3002
   \u4E13\u5BB6/\u6280\u80FD\u4E24\u4E2A\u6807\u7B7E\u5171\u7528\u8FD9\u4E00\u4E2A\u6570\u5B57\uFF0C\u9AD8\u5EA6\u53D6 600px \u4E0E\u89C6\u53E3\u9AD8\u5EA6\u4E2D\u7684\u5C0F\u8005\uFF0C\u77EE\u5C4F\u81EA\u52A8\u6536\u7F29\u3002
   \u6CE8\u610F\uFF1A\u672C\u5757\u6CE8\u91CA\u5FC5\u987B\u95ED\u5408 \u2014\u2014 2026-09-23 \u66FE\u56E0\u8FD9\u91CC\u4E22\u4E86\u6CE8\u91CA\u7ED3\u5C3E\uFF0C\u628A\u4E0B\u9762 .t-team-pop \u4E0E
   .t-team-pop .t-team-input \u4E24\u6761\u89C4\u5219\u4E00\u8D77\u541E\u6389\uFF0C\u5F39\u7A97\u9000\u5316\u6210\u65E0\u6837\u5F0F\u5757\u7EA7\u5143\u7D20\uFF081265\xD712420\uFF09\uFF0C
   \u5173\u95ED\u6309\u94AE\u88AB\u9876\u51FA\u5C4F\u5E55\u3002CSS \u6CE8\u91CA\u4E0D\u53EF\u5D4C\u5957\uFF0C\u4E22\u4E86\u7ED3\u5C3E\u5C31\u4F1A\u4E00\u8DEF\u541E\u5230\u4E0B\u4E00\u4E2A\u7ED3\u675F\u7B26\u3002
   2026-09-23 \u7528\u6237\u53CD\u9988\u300C\u5F39\u7A97\u8FB9\u7EBF\u592A\u660E\u663E\u4E86\uFF0C\u592A\u7C97\u4E86\u300D\uFF1A\u8FB9\u6846\u4ECE 1px + border-l2 \u6539\u4E3A
   .5px + border-l1\uFF08\u6D45\u8272\u4E0B alpha 10% \u2192 4%\uFF09\uFF0C\u8FB9\u6846\u4E0D\u518D\u62A2\u773C\u3002
   \u5F39\u7A97\u9634\u5F71\u539F\u7528 var(--dsw-shadow-lv3)\uFF0C\u5B83\u662F\u4E09\u5C42\u53E0\u52A0\uFF1A0 0 1px \u5747\u5300\u63CF\u8FB9\u30010 0 4px \u5747\u5300\u67D4\u5149\u3001
   0 12px 32px \u5411\u4E0B\u504F\u79FB\u7684\u5927\u6295\u5F71\u3002\u7528\u6237\u8981\u6C42\u53BB\u6389\u300C\u5E95\u90E8\u300D\u7684\u6295\u5F71\u2014\u2014\u5373\u7B2C\u4E09\u5C42\u5411\u4E0B 12px \u90A3\u9053
   \uFF08\u843D\u5728\u8F93\u5165\u6846\u4E0A\u5F88\u660E\u663E\uFF09\uFF0C\u6545\u8FD9\u91CC\u53EA\u4FDD\u7559\u524D\u4E24\u5C42\u5747\u5300\u63CF\u8FB9/\u67D4\u5149\uFF08\u5199\u6B7B\u6570\u503C\uFF0C\u5BBF\u4E3B\u6CA1\u6709\u53EA\u542B\u524D\u4E24\u5C42\u7684\u53D8\u91CF\uFF09\u3002
   Retina \u4E0A .5px \u6B63\u597D\u662F\u4E00\u4E2A\u7269\u7406\u50CF\u7D20\uFF1B\u5BBF\u4E3B\u81EA\u5DF1\u7684\u6309\u94AE\u4E5F\u7528 .5px\u3002 */
/* \u6D6E\u5C42\u6750\u8D28\uFF082026-09-22\uFF09\uFF1A\u5BBF\u4E3B 0.1.7 \u7684\u89C6\u89C9\u7EDF\u4E00\u6539\u7248\u628A --dsw-specific-menu \u4ECE
   \u300C= \u4E0D\u900F\u660E\u7684 --dsw-alias-bg-layer-3\u300D\u6539\u6210\u4E86**\u534A\u900F\u660E\u83DC\u5355\u6750\u8D28**
   \uFF08\u4EAE\u8272 rgba(248,249,250,.58) / \u6697\u8272 rgba(48,49,54,.5)\uFF09\uFF0C\u5E76\u914D\u5957
   --dsw-menu-backdrop-filter = blur(40px) saturate(150%) \u624D\u6709\u6BDB\u73BB\u7483\u89C2\u611F\u3002
   \u6240\u4EE5\u51E1\u662F background \u7528\u4E86 --dsw-specific-menu \u7684\u89C4\u5219\uFF0C\u90FD\u5FC5\u987B\u7D27\u8DDF\u4E00\u6761 backdrop-filter\uFF0C
   \u5426\u5219\u5728 0.1.7 \u4E0A\u5C31\u662F\u300C\u5F39\u7A97\u534A\u900F\u660E\u3001\u80FD\u770B\u89C1\u5E95\u4E0B\u7684\u5BF9\u8BDD\u300D\uFF08\u7528\u6237\u5B9E\u6D4B\u62A5\u969C\uFF09\u3002
   \u26A0\uFE0F 2026-09-29\uFF1A**T\u4E13\u5BB6 \u9762\u677F\u81EA\u5DF1\u4E0D\u518D\u8D70\u6BDB\u73BB\u7483**\uFF08\u7528\u6237\u53E3\u5F84\u300C\u592A\u5361\u4E86\u300D\u2192 \u9009\u300C\u9762\u677F\u6539\u6210\u4E0D\u900F\u660E\u5B9E\u8272\u300D\uFF09\uFF1A
   blur(40px) \u94FA\u6EE1\u6574\u5757\u9762\u677F\u662F\u9762\u677F\u4E0A\u4EC5\u5269\u7684\u5927\u5408\u6210\u5F00\u9500\uFF0C\u800C\u9762\u677F\u5185\u5BB9\u672C\u8EAB\u662F\u5B9E\u5FC3\u5361\u7247\u3001\u5E76\u4E0D\u9700\u8981\u900F\u51FA\u80CC\u540E\u5185\u5BB9\u3002
   \u6240\u4EE5 .t-team-pop \u4E0E\u5B98\u65B9\u6750\u8D28\u8DEF\u5F84\uFF08.t-team-pop-official\uFF09\u90FD\u6539\u6210\u5B9E\u8272 --dsw-alias-bg-layer-3\uFF0C
   \u5E76\u628A\u5B98\u65B9 MenuSurface \u5185\u90E8\u90A3\u5C42\u6750\u8D28\uFF08aria-hidden \u7684\u5144\u5F1F\u8282\u70B9\uFF0Cblur \u5C31\u6302\u5728\u5B83\u8EAB\u4E0A\uFF09\u5173\u6389\u3002
   \u8FD9\u6761\u300C\u586B\u8272\u5FC5\u987B\u914D filter\u300D\u7684\u89C4\u77E9\u4ECD\u7136\u9002\u7528\u4E8E**\u522B\u5904**\u8FD8\u5728\u7528\u83DC\u5355\u6750\u8D28\u7684\u5730\u65B9\uFF08\u5982 .t-team-expert-pick-panel\uFF09\u3002 */
.t-team-pop{position:fixed;z-index:60;width:var(--t-team-pop-w, 720px);max-width:calc(100vw - 16px);max-height:min(600px, calc(100vh - 16px));overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;padding:10px 0 10px 10px;border-radius:12px;border:.5px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-3, var(--dsw-specific-menu, #fff));box-shadow:0 0 1px 0 #0003, 0 0 4px 0 #00000005;color:var(--dsw-alias-label-primary)}
/* \u6750\u8D28\u4EA4\u7ED9\u5B98\u65B9 MenuSurface \u65F6\uFF08\u5BBF\u4E3B\u6709\u8BE5\u7EC4\u4EF6 \u2014\u2014 \u89C1 ui.jsx \u7684 PopSurface\uFF09\uFF0C\u628A\u4E0A\u9762\u90A3\u5957\u81EA\u7ED8\u6750\u8D28\u6E05\u6389\u3002
   \u5B98\u65B9\u6750\u8D28\u662F**\u7236\u7EA7\u5185\u90E8**\u4E00\u4E2A aria-hidden\u3001absolute\u3001z-index:-1 \u7684\u5144\u5F1F\u5C42\uFF1B\u7236\u7EA7\u81EA\u5DF1\u518D\u94FA\u4E00\u5C42\u5E95\u8272
   \u5C31\u4F1A\u628A\u5B83\u6574\u4E2A\u76D6\u4F4F\uFF0C\u6362\u5916\u58F3\u8FD9\u4EF6\u4E8B\u5C31\u7B49\u4E8E\u767D\u505A\u3002\u5706\u89D2\u4E00\u5E76\u8FD8\u7ED9\u5B98\u65B9\u90A3\u4E00\u6863\uFF08.surface \u7528 --dsw-radius-lg\uFF09\u3002 */
.t-team-pop-official{position:fixed;border:0;background:var(--dsw-alias-bg-layer-3, var(--dsw-specific-menu, #fff));backdrop-filter:none;box-shadow:none;border-radius:var(--dsw-radius-lg,12px)}
/* \u5173\u6389\u5B98\u65B9 MenuSurface \u5185\u90E8\u90A3\u5C42\u6750\u8D28\uFF08\u5B83\u662F\u4E2A aria-hidden \u7684\u7EDD\u5BF9\u5B9A\u4F4D\u5144\u5F1F\uFF0Cinset:0 \u94FA\u6EE1\uFF0C
   background \u4E0E backdrop-filter \u90FD\u6302\u5728\u5B83\u8EAB\u4E0A\uFF09\u3002\u53EA\u628A\u7236\u7EA7\u6362\u6210\u5B9E\u8272\u8FD8\u4E0D\u591F \u2014\u2014
   \u6750\u8D28\u5C42\u7167\u6837\u5728\u8DD1 blur\u3002 */
.t-team-pop-official > [aria-hidden="true"]{display:none}
/* \u4E0D\u5199 width:100%\uFF1A\u5B83\u91CF\u7684\u662F\u5BB9\u5668 content \u5BBD\uFF0C\u518D\u53E0\u4E0A\u300C> *\u300D\u7684 margin-right \u5C31\u4F1A\u6A2A\u5411\u6EA2\u51FA\uFF1B
   \u9760 flex \u5BB9\u5668\u9ED8\u8BA4\u7684 align-items:stretch \u81EA\u52A8\u6491\u6EE1\u51CF\u6389 margin \u540E\u7684\u5BBD\u5EA6\u3002 */
.t-team-pop .t-team-input{flex:0 0 auto;min-width:0}
/* \u5F39\u7A97\u53F3\u4FA7\u4E0D\u8BBE\u5185\u8FB9\u8DDD\uFF08\u89C1 .t-team-pop \u7684 padding\uFF09\uFF0C\u662F\u4E3A\u4E86\u8BA9\u4E0B\u9762 .t-team-pop-list \u7684\u6EDA\u52A8\u6761
   \u8D34\u4F4F\u5F39\u7A97\u53F3\u8FB9\u7F18 \u2014\u2014 \u6EDA\u52A8\u6761\u753B\u5728\u6EDA\u52A8\u5BB9\u5668\u7684 padding box \u8FB9\u7F18\uFF0C\u7236\u7EA7\u7559 10px \u5C31\u4F1A\u628A\u5B83\u63A8\u8FDB\u6765 10px\uFF0C
   \u4E5F\u5C31\u662F\u7528\u6237\u770B\u5230\u7684\u300C\u6EDA\u52A8\u6761\u6CA1\u9760\u8FB9\u300D\u3002\u4EE3\u4EF7\u662F**\u6BCF\u4E2A\u4E0D\u6EDA\u52A8\u7684\u5144\u5F1F\u5143\u7D20**\u90FD\u5F97\u81EA\u5DF1\u8865\u56DE\u8FD9 10px\uFF0C
   \u6F0F\u4E00\u4E2A\u5C31\u9876\u8FB9\uFF082026-09-23 \u5C31\u6F0F\u4E86\u641C\u7D22\u6846\uFF09\u3002\u6240\u4EE5\u7528\u300C> *\u300D\u4E00\u628A\u515C\u4F4F\uFF0C\u518D\u628A\u552F\u4E00\u7684\u6EDA\u52A8\u5BB9\u5668\u6392\u9664\u6389\uFF1A
   \u4EE5\u540E\u5F80\u5F39\u7A97\u91CC\u52A0\u65B0\u884C\u4E0D\u5FC5\u518D\u8BB0\u5F97\u8865\u3002
   \u26A0\uFE0F 2026-09-29 \u8D77\u8FD8\u8981\u6392\u9664\u300Caria-hidden\u300D\uFF1A\u5B98\u65B9 MenuSurface \u7684\u6750\u8D28\u5C42\u5C31\u662F\u7236\u7EA7\u91CC\u4E00\u4E2A aria-hidden
   \u7684\u7EDD\u5BF9\u5B9A\u4F4D\u5144\u5F1F\uFF08inset:0 \u94FA\u6EE1\uFF09\u2014\u2014 \u5B83\u5403\u8FD9 10px \u7684 margin-right \u4F1A\u8BA9\u6750\u8D28\u53F3\u8FB9\u5C11\u4E00\u6761\uFF0C\u9732\u51FA\u5E95\u8272\u3002 */
.t-team-pop > *:not([aria-hidden="true"]){margin-right:10px}
.t-team-pop > .t-team-pop-list{margin-right:0}
/* \u5206\u7C7B\u6807\u7B7E\u884C\uFF082026-09-29 \u7528\u6237\u8981\u6C42\uFF1A\u641C\u7D22\u6846\u4E0B\u9762\u52A0\u4E00\u884C\u5206\u7C7B\uFF0C\u9644\u53C2\u8003\u56FE\uFF09\u3002
   \u5BF9\u9F50\u5BBD\u5EA6\u9760\u7684\u662F**\u7ED3\u6784**\uFF1A\u8FD9\u4E00\u884C\u662F .t-team-pop \u7684\u76F4\u63A5\u5B50\u5143\u7D20\uFF0C\u4E0E\u641C\u7D22\u6846\u5403\u540C\u4E00\u6761\u300C> *\u300D\u53F3\u5185\u8FB9\u8DDD\u3001
   \u5DE6\u8FB9\u540C\u6837\u7531\u5BB9\u5668\u81EA\u5DF1\u7684 padding-left \u63D0\u4F9B \u2014\u2014 \u6240\u4EE5\u8FD9\u91CC\uFF08\u4EE5\u53CA\u91CC\u9762\u4E24\u4E2A\u5BB9\u5668\uFF09**\u4E0D\u8BB8**\u518D\u5199\u5DE6\u53F3\u5185\u8FB9\u8DDD\uFF0C
   \u5199\u4E86\u8FD9\u4E00\u884C\u5C31\u4F1A\u6BD4\u641C\u7D22\u6846\u7A84\u4E00\u622A\u6216\u504F\u4E00\u622A\uFF0C\u90A3\u6B63\u662F\u7528\u6237\u76EF\u7684"\u5BF9\u9F50"\u3002
   \u6A2A\u5411\u6EA2\u51FA\u7167\u53C2\u8003\u56FE\u5904\u7406\uFF1A\u4E00\u884C\u6A2A\u5411\u6EDA\u52A8 + \u53F3\u7AEF\u4E00\u4E2A\u5706\u5F62\u7BAD\u5934\u3002
   \u26A0\uFE0F \u7BAD\u5934\u6309\u94AE\u5FC5\u987B\u653E\u5728\u5916\u5C42 .t-team-divbar \u4E0A\uFF1A\u6EDA\u52A8\u5BB9\u5668\u7684\u7EDD\u5BF9\u5B9A\u4F4D\u5B50\u5143\u7D20\u4F1A**\u8DDF\u7740\u5185\u5BB9\u4E00\u8D77\u6EDA\u8D70**\u3002 */
.t-team-divbar{position:relative;display:flex;align-items:center;min-width:0}
/* \u7ED9\u7BAD\u5934\u8BA9\u4F4D\uFF1A\u53EA\u5728\u5BF9\u5E94\u90A3\u4E00\u4FA7\u7684\u7BAD\u5934\u771F\u7684\u51FA\u73B0\u65F6\u624D\u52A0\u5185\u8FB9\u8DDD \u2014\u2014 \u6CA1\u6EDA\u52A8\u65F6\u5DE6\u4FA7\u4E0D\u52A0\uFF0C
   \u6240\u4EE5\u7B2C\u4E00\u4E2A\u6807\u7B7E\u4ECD\u7136\u4E0E\u641C\u7D22\u6846\u5DE6\u8FB9\u7F18\u5BF9\u9F50\uFF08\u7528\u6237\u7279\u522B\u70B9\u7684\u90A3\u6761\u300C\u5BF9\u9F50\u5BBD\u5EA6\u300D\uFF09\u3002
   38px = \u7BAD\u5934\u76F4\u5F84 32px + 6px \u95F4\u9699\uFF08\u7BAD\u5934\u653E\u5927\u540E\u8FD9\u91CC\u5FC5\u987B\u8DDF\u7740\u6539\uFF0C\u5426\u5219\u5B83\u4F1A\u538B\u4F4F\u6700\u540E\u4E00\u4E2A\u6807\u7B7E\uFF09\u3002 */
.t-team-divbar[data-more="true"] .t-team-pop-divs{padding-right:38px}
.t-team-divbar[data-back="true"] .t-team-pop-divs{padding-left:38px}
/* \u26A0\uFE0F \u8FD9\u91CC**\u4E0D\u5199** scroll-behavior:smooth\uFF082026-09-29 \u52A0\u4E86\u6EDA\u8F6E\u6A2A\u5411\u6EDA\u52A8\u4E4B\u540E\u53BB\u6389\u7684\uFF09\uFF1A
   \u6EDA\u8F6E\u8981\u6C42"\u8F6C\u591A\u5C11\u8D70\u591A\u5C11"\u7684\u5373\u65F6\u8DDF\u624B\uFF0Csmooth \u4F1A\u8BA9\u6BCF\u4E00\u683C\u6EDA\u8F6E\u90FD\u53D8\u6210\u4E00\u6BB5\u52A8\u753B\uFF0C\u53CD\u800C\u53D1\u98D8\u3002
   \u9700\u8981\u5E73\u6ED1\u7684\u662F\u90A3\u4E24\u9897\u7BAD\u5934\u6309\u94AE \u2014\u2014 \u5B83\u4EEC\u81EA\u5DF1\u4F20 scrollBy({behavior:"smooth"})\u3002 */
.t-team-pop-divs{display:flex;align-items:center;gap:6px;flex:1 1 auto;min-width:0;overflow-x:auto;overflow-y:hidden;scrollbar-width:none}
.t-team-pop-divs::-webkit-scrollbar{display:none}
/* \u5206\u7C7B\u6807\u7B7E\u4E0E\u7AEF\u5934\u7684\u5706**\u540C\u9AD8**\uFF0832px\uFF09\uFF1A\u5706\u662F\u7EDD\u5BF9\u5B9A\u4F4D\u3001\u4E0D\u53C2\u4E0E\u5E03\u5C40\uFF0C\u884C\u9AD8\u7531\u6807\u7B7E\u51B3\u5B9A \u2014\u2014
   \u4E24\u8005\u4E0D\u76F8\u7B49\u65F6\u5706\u4F1A\u4E0A\u4E0B\u6EA2\u51FA\u5230\u884C\u5916\uFF0C\u770B\u7740\u5C31\u4E0D\u50CF\u4E2A\u5B8C\u6574\u7684\u6B63\u5706\uFF082026-09-29 \u7528\u6237\uFF1A\u300C\u8981\u6B63\u5706\u300D\uFF09\u3002 */
.t-team-div-chip{flex:0 0 auto;box-sizing:border-box;height:32px;padding:0 12px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;line-height:32px;white-space:nowrap;cursor:pointer}
.t-team-div-chip:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.t-team-div-chip[data-active="true"]{background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-interactive-bg-hover));color:var(--dsw-alias-label-primary);font-weight:500}
/* \u5206\u7C7B\u884C\u4E24\u7AEF\u7684\u7BAD\u5934\uFF082026-09-29 \u4E09\u8F6E\u7528\u6237\u53E3\u5F84\u5408\u5E76\u7684\u7ED3\u679C\uFF09\uFF1A
   \u2460 \u300C< > \u6700\u597D\u52A0\u4E2A\u8FB9\u7EBF\uFF0C\u73B0\u5728\u770B\u7740\u4E0D\u660E\u663E\u300D\u2192 \u52A0\u63CF\u8FB9\uFF1B
   \u2461 \u300C\u8FD9\u79CD\u5706\u5F62\u98CE\u683C\u884C\u5417\uFF0C\u518D\u5927\u4E00\u70B9\u70B9\u300D\uFF08\u9644\u53C2\u8003\u56FE\uFF09\u2192 \u653E\u5927\u5230 32px\u3001\u7BAD\u5934 18px\uFF1B
   \u2462 \u300C\u4E3A\u4EC0\u4E48\u662F\u534A\u900F\u660E\u7684\uFF1F\u8FD8\u6709\u8981\u6B63\u5706\u300D\u2192 \u4E24\u5904\u90FD\u6539\uFF1A
      \xB7 \u5E95\u8272\u6362\u6210**\u5B9E\u8272**\u7684\u300C--dsw-alias-bg-layer-3\u300D\u3002\u4E0A\u4E00\u7248\u7528\u7684\u300Cinteractive-bg-hover\u300D\u672C\u8EAB\u5C31\u662F
        alpha \u8272\uFF08fallback #0000000d\uFF0C\u7EA6 5% \u9ED1\uFF09\uFF0C\u53E0\u5728\u534A\u900F\u660E\u83DC\u5355\u6750\u8D28\u4E0A\u6574\u4E2A\u5706\u90FD\u662F\u900F\u7684 \u2014\u2014
        \u90A3\u662F"\u770B\u8D77\u6765\u534A\u900F\u660E"\u7684\u76F4\u63A5\u539F\u56E0\uFF0C\u4E0D\u662F\u9762\u677F\u7684\u95EE\u9898\uFF1B
      \xB7 \u5782\u76F4\u5C45\u4E2D\u4E0D\u518D\u7528\u300Ctop:50% + translateY(-50%)\u300D\uFF1A\u534A\u50CF\u7D20\u9AD8\u5EA6\u4E0B\u5B83\u4F1A\u843D\u5728 .5px \u4E0A\uFF0C\u5706\u5F62\u8FB9\u7F18\u88AB
        \u91CD\u91C7\u6837\u3001\u770B\u7740\u5C31\u4E0D\u5706\u3002\u6539\u6210\u300Ctop:0;bottom:0;margin:auto 0\u300D\uFF08\u884C\u9AD8\u4E0E\u5706\u540C\u9AD8\u65F6\u662F\u6574\u6570\u50CF\u7D20\u5BF9\u9F50\uFF09\u3002
   \u26A0\uFE0F \u52A0\u63CF\u8FB9\u5FC5\u987B\u540C\u65F6\u7ED9 box-sizing:border-box\uFF0C\u5426\u5219\u8FB9\u6846\u4F1A\u628A\u5706\u6491\u5927\u3001\u628A\u5206\u7C7B\u884C\u9876\u9AD8\u3002 */
.t-team-div-scroll{position:absolute;top:0;bottom:0;margin:auto 0;box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:32px;height:32px;padding:0;border:1px solid var(--dsw-alias-border-l1);border-radius:50%;background:var(--dsw-alias-bg-layer-3,#f7f8fa);color:var(--dsw-alias-label-secondary);font-size:18px;line-height:1;cursor:pointer;box-shadow:0 0 1px 0 #0003, 0 0 4px 0 #00000008}
/* \u4E24\u4E2A\u65B9\u5411\u5404\u8D34\u4E00\u8FB9\uFF1A\u53F3\u7AEF\u300C\u8FD8\u6709\u66F4\u591A\u300D\u3001\u5DE6\u7AEF\u300C\u5DF2\u7ECF\u6EDA\u8FC7\u53BB\u4E86\uFF0C\u70B9\u6211\u56DE\u53BB\u300D\u3002 */
.t-team-div-scroll[data-dir="next"]{right:0}
.t-team-div-scroll[data-dir="prev"]{left:0}
.t-team-div-scroll:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l2)}
.t-team-pop .t-team-tabs{gap:2px;padding-bottom:4px}
.t-team-pop .t-team-tab{font-size:12px;padding:3px 8px}
/* \u6807\u7B7E\u4E0A\u7684\u8BA1\u6570\uFF1A\u6BD4\u6807\u7B7E\u5C0F\u4E00\u53F7\u3001\u7A0D\u6DE1\uFF0Ctabular-nums \u8BA9\u6570\u5B57\u7B49\u5BBD \u2014\u2014 \u5426\u5219 401 \u2192 99 \u65F6\u6807\u7B7E\u5BBD\u5EA6\u4F1A\u8DF3\u3002 */
.t-team-pop .t-team-tab-count{font-size:11px;opacity:.72;margin-left:2px;font-variant-numeric:tabular-nums}
.t-team-pop .t-team-tabbody{gap:8px;overflow:auto;min-height:0}
.t-team-pop .t-team-picker-list{max-height:150px}
.t-team-pop-list{display:flex;flex-direction:column;gap:6px;overflow:auto;min-height:0;padding-right:10px}
/* \u4E13\u5BB6 tab\uFF1A\u6BCF\u884C\u56FA\u5B9A 4 \u5217\uFF082026-09-23 \u7528\u6237\u8981\u6C42\u300C\u5361\u7247\u6BCF\u884C 4 \u4E2A\u300D\uFF09\u3002
   \u6F14\u53D8\uFF1A\u5148\u662F\u56FA\u5B9A 3 \u5217 \u2192 \u5F39\u7A97\u5BBD\u5EA6\u8DDF\u8F93\u5165\u6846\u5BF9\u9F50\u540E\u5361\u7247\u88AB\u62C9\u5F97\u8FC7\u5BBD\uFF0C\u6539\u6210\u968F\u5BBD\u5EA6\u81EA\u9002\u5E94\u7684
   auto-fill(minmax(220px,1fr))\uFF08720px \u5F39\u7A97\u4ECD\u662F 3 \u5217\uFF0C\u7EA6 915px \u8D77 4 \u5217\uFF09\u2192 \u7528\u6237\u660E\u786E\u8981\u56FA\u5B9A 4 \u4E2A\uFF0C
   \u4E8E\u662F\u9489\u6B7B\u5217\u6570\u3002\u56FA\u5B9A\u5217\u6570\u540E\u4E0E\u5F39\u7A97\u5BBD\u5EA6\u89E3\u8026\uFF0Cminmax(0,1fr) \u8BA9\u56DB\u5217\u7B49\u5206\u4E14\u5141\u8BB8\u6536\u7F29
   \uFF08\u82E5\u6CBF\u7528 minmax(220px,1fr)\uFF0C\u7A84\u5F39\u7A97\u4E0B\u7F51\u683C\u4F1A\u88AB\u6491\u51FA\u6A2A\u5411\u6EDA\u52A8\u6761\uFF09\u3002
   \u914D\u5957\u4E09\u5904\uFF1A\u5206\u533A\u6807\u9898\u6A2A\u8DE8\u6574\u884C\uFF1Bflex \u5B50\u9879\u9ED8\u8BA4 min-width:auto \u4F1A\u628A\u5217\u6491\u5F00\uFF0C\u6240\u4EE5\u8981\u663E\u5F0F\u6536\u8D77\u3002 */
.t-team-pop[data-tab="experts"] .t-team-pop-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 12px;align-content:start}
.t-team-pop[data-tab="experts"] .t-team-division{grid-column:1/-1}
.t-team-pop[data-tab="experts"] .t-team-pop-item{min-width:0}
/* \u6280\u80FD\u6807\u7B7E\u7528\u540C\u4E00\u5957\u5361\u7247\u7F51\u683C\uFF08\u540C\u6837\u662F\u5934\u50CF + \u540D\u5B57 + \u526F\u6807\u9898 + \u4E09\u884C\u7B80\u4ECB\uFF09\u3002 */
.t-team-pop[data-tab="skills"] .t-team-pop-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 12px;align-content:start}
.t-team-pop[data-tab="skills"] .t-team-pop-item{min-width:0}
/* \u4E13\u5BB6\u5361\u7247\uFF082026-09-16 \u7528\u6237\u6309\u53C2\u8003\u56FE\u5B9A\u7684\u98CE\u683C\uFF09\uFF1A\u5706\u5F62\u5934\u50CF + \u540D\u5B57/\u5BF9\u7167\u540D + \u591A\u884C\u7B80\u4ECB\uFF0C\u5361\u7247\u63CF\u8FB9\u3002
   \u53C2\u8003\u56FE\u91CC\u7684\u5E95\u90E8\u6807\u7B7E\u6309\u7528\u6237\u8981\u6C42\u4E0D\u505A\uFF1B\u300C\u53EC\u5524\u300D\u4E5F\u6CA1\u505A\u6210\u6309\u94AE \u2014\u2014 \u6574\u5F20\u5361\u7247\u53EF\u70B9\u5373\u53EC\u5524
   \uFF08\u6BCF\u5217\u53EA\u6709 220px \u4E0A\u4E0B\uFF0C\u585E\u4E0D\u4E0B\u4E00\u4E2A\u80F6\u56CA\u6309\u94AE\uFF09\u3002
   2026-09-20 \u7528\u6237\u8981\u6C42\u300C\u4E13\u5BB6\u6807\u7B7E\u7684\u5361\u7247\u548C\u6280\u80FD\u91CC\u4E00\u6837\u5927\u300D\uFF1A\u4E24\u4E2A tab \u672C\u6765\u5C31\u5171\u7528\u8FD9\u5F20\u5361\u7247\uFF0C
   \u5DEE\u522B\u5168\u5728\u5185\u5BB9 \u2014\u2014 \u4E13\u5BB6\u6BD4\u6280\u80FD\u591A\u4E00\u884C\u5BF9\u7167\u540D\u3001\u7B80\u4ECB\u53C8\u603B\u662F\u5360\u6EE1\u4E09\u884C\uFF0C\u4E8E\u662F\u6BD4\u6280\u80FD\u5361\u9AD8\u51FA\u4E00\u622A\u3002
   \u73B0\u5728\u5934\u90E8\u9AD8\u5EA6\u5199\u6B7B\uFF08=\u5934\u50CF\u9AD8\uFF0C\u6B63\u597D\u5BB9\u5F97\u4E0B\u540D\u5B57 + \u5BF9\u7167\u540D\u4E24\u884C\uFF09\u3001\u7B80\u4ECB\u56FA\u5B9A\u4E24\u884C\u5360\u4F4D\uFF0C
   \u5361\u7247\u9AD8\u5EA6\u56E0\u6B64\u6052\u5B9A\uFF0C\u4E13\u5BB6\u4E0E\u6280\u80FD\u9010\u4E2A\u4E00\u6837\u5927\u3002
   2026-09-23 \u7528\u6237\u53CD\u9988\u300C\u5361\u7247\u592A\u7D27\u51D1\u4E86\uFF0C\u5927\u4E00\u70B9\u300D\uFF1A\u5185\u8FB9\u8DDD 10\u219214\u3001\u5361\u7247\u95F4\u8DDD 6/8\u219210/12\u3001
   \u5934\u50CF\u4E0E\u5934\u90E8 32\u219240\u3001\u540D\u5B57 13\u219214\u3001\u526F\u6807\u9898\u4E0E\u7B80\u4ECB 11\u219212\u3001\u5361\u7247\u5E95\u9AD8 93\u2192114\uFF0814+40+8+36+14+2\uFF09\u3002
   \u8FD9\u51E0\u5904\u5C3A\u5BF8\u662F\u8054\u52A8\u7684\uFF0C\u6539\u4E00\u4E2A\u5C31\u5F97\u6539\u5176\u4F59\u7684\uFF0C\u5426\u5219\u4E24\u4E2A tab \u53C8\u4F1A\u4E0D\u7B49\u9AD8\u3002 */
.t-team-pop-item{display:flex;flex-direction:column;gap:8px;min-width:0;min-height:146px;box-sizing:border-box;overflow:hidden;text-align:left;padding:14px;border-radius:16px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:inherit;font:inherit;cursor:pointer;content-visibility:auto;contain-intrinsic-size:auto 146px}
/* content-visibility\uFF082026-09-29\uFF0C\u7528\u6237\u62A5\u300C\u5F39\u7A97\u6709\u70B9\u5361\u300D\uFF09\uFF1A\u4E13\u5BB6/\u6280\u80FD\u5361\u7247\u662F**\u7B49\u9AD8**\u7684
   \uFF08min-height:146px\uFF0C\u5934\u90E8 44 + \u7B80\u4ECB\u4E24\u884C + \u6807\u7B7E\u884C\uFF0C\u89C1\u4E0B\u9762\u7684\u8BF4\u660E\uFF09\uFF0C\u6B63\u597D\u662F\u5B83\u6700\u5408\u9002\u7684\u7528\u6CD5 \u2014\u2014
   \u5C4F\u5E55\u5916\u7684\u5361\u7247\u76F4\u63A5\u8DF3\u8FC7\u6837\u5F0F/\u5E03\u5C40/\u7ED8\u5236\uFF0C\u6253\u5F00\u9762\u677F\u65F6\u771F\u6B63\u8981\u6E32\u67D3\u7684\u4ECE 300+ \u5F20\u964D\u5230\u53EF\u89C6\u533A\u7684\u5341\u51E0\u5F20\u3002
   contain-intrinsic-size \u5FC5\u987B\u5199\u3001\u4E14\u8981\u8D34\u7740\u771F\u5B9E\u9AD8\u5EA6\uFF08146px\uFF09\uFF0C\u5426\u5219\u6EDA\u52A8\u6761\u7684\u4F30\u7B97\u957F\u5EA6\u4F1A\u8DF3\u3002
   \u8001\u5BBF\u4E3B\uFF08\u4E0D\u652F\u6301\u8BE5\u5C5E\u6027\uFF09\u4F1A\u5FFD\u7565\u8FD9\u4E24\u6761\uFF0C\u884C\u4E3A\u4E0D\u53D8\u3002 */
.t-team-pop-item:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3)}
/* \u5361\u7247\u88C1\u8FB9\uFF08overflow:hidden\uFF09\u4F1A\u628A\u5BBF\u4E3B\u9ED8\u8BA4\u7684 focus \u8F6E\u5ED3\u4E00\u8D77\u88C1\u6389\uFF0C\u952E\u76D8 Tab \u9009\u4E2D\u5C31\u770B\u4E0D\u51FA\u6765\u4E86\uFF0C
   \u6240\u4EE5\u7126\u70B9\u73AF\u81EA\u5DF1\u753B\u3001\u5E76\u538B\u5728\u5361\u7247\u5185\u4FA7\uFF08offset \u8D1F\u503C\uFF09\u3002 */
.t-team-pop-item:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
/* \u5934\u90E8\u9AD8\u5EA6\u5199\u6B7B 44px\uFF1A\u5361\u7247\u7B49\u9AD8\u7684\u524D\u63D0\u3002\u6280\u80FD\u5361\u91CC\u6807\u9898\u53EA\u6709\u4E00\u884C\uFF0C\u6491\u5230 44px \u7684\u662F\u5934\u50CF\uFF1B
   \u4E13\u5BB6\u5361\u91CC\u6807\u9898\u6709\u4E24\u884C\uFF08\u540D\u5B57 + \u5BF9\u7167\u540D \u2248 34px\uFF09\uFF0C\u5FC5\u987B\u9489\u4F4F\uFF0C\u5426\u5219\u5B83\u4F1A\u6BD4\u6280\u80FD\u5361\u9AD8\u3002
   \u26A0\uFE0F \u300Cjustify-content:flex-start\u300D\u662F 2026-09-29 \u8865\u7684**\u4FEE bug**\u3001\u4E0D\u662F\u6392\u7248\u504F\u597D\uFF1A
   \u300C.t-team-pop-head\u300D\u8FD9\u4E2A\u540D\u5B57\u540C\u65F6\u88AB**\u9762\u677F\u6807\u9898\u884C**\uFF08\u9876\u680F\u300CT\u4E13\u5BB6 + \u5173\u95ED\u300D\uFF09\u7528\u7740\uFF0C\u800C\u5B83\u90A3\u6761\u89C4\u5219\u5E26
   \u300Cjustify-content:space-between\u300D\u2014\u2014 \u4E8E\u662F\u5361\u7247\u91CC\u7684\u300C\u5934\u50CF + \u540D\u79F0\u300D\u88AB\u63A8\u6210\u4E24\u7AEF\u5BF9\u9F50\u3001\u540D\u79F0\u8D34\u5230\u4E86\u53F3\u8FB9\u3002
   \u7528\u6237\u5F53\u65F6\u7684\u53E3\u5F84\u300C\u540D\u79F0\u90FD\u9760\u5DE6\u300D\u8BF4\u7684\u5C31\u662F\u8FD9\u4E2A\u3002\u8FD9\u91CC\u7528\u66F4\u9AD8\u7684\u7279\u5F02\u6027\u63B0\u56DE\u6765\uFF08\u987A\u5E8F\u4E5F\u6392\u5728\u5B83\u4E4B\u540E\uFF09\u3002 */
.t-team-pop-item .t-team-pop-head{height:44px;justify-content:flex-start}
.t-team-pop-head{display:flex;align-items:center;gap:10px;min-width:0}
/* \u5934\u50CF\uFF1A44px \u5706\u3002\u5E95\u8272\u9ED8\u8BA4\u6DE1\u7070\uFF0C\u4E13\u5BB6\u5361\u7531 inline style \u7528\u540D\u518C frontmatter \u7684\u300Ccolor\u300D\u538B\u6210\u6DE1\u8272\u5706\u5E95
   \uFF08\u89C1 ui.jsx \u7684 tintOf\uFF0Calpha 24%\uFF09\uFF1B\u91CC\u9762\u662F\u4E13\u5BB6\u81EA\u5DF1\u7684\u5F69\u8272 emoji\u3002
   2026-09-29 \u7528\u6237\u53E3\u5F84\u300C\u7ED9\u8FD9\u4E9B\u56FE\u6807\u52A0\u4E00\u4E2A\u6DE1\u6DE1\u7684\u80CC\u666F\uFF0C\u73B0\u5728 emoji \u90FD\u5F88\u5C0F\uFF0C\u770B\u7740\u4E0D\u534F\u8C03\u300D\u4E09\u5904\u4E00\u8D77\u8C03\uFF1A
     \u2460 \u6DE1\u8272\u5E95 14% \u2192 24%\uFF0814% \u94FA\u5728\u767D\u5361\u7247\u4E0A\u51E0\u4E4E\u770B\u4E0D\u51FA\u5706\uFF0C\u5706\u6CA1\u8FB9\u3001\u91CC\u9762\u53C8\u662F\u5C0F emoji\uFF0C\u6574\u4F53\u5C31\u53D1\u98D8\uFF09\uFF1B
     \u2461 emoji \u5B57\u53F7 22 \u2192 26px\uFF0844px \u7684\u5706\u91CC\u66F4\u9971\u6EE1\uFF0C\u4E0A\u4E0B\u5404\u7559 9px\uFF09\uFF1B
     \u2462 \u6CA1\u6709 color \u65F6\u7684\u515C\u5E95\u5E95\u8272\u4ECE\u8FD1\u767D\u7684 layer-3 \u6362\u6210\u6DE1\u7070\u7684 interactive-bg-hover
        \uFF08\u8001\u6570\u636E\u3001\u6216\u989C\u8272\u540D\u4E0D\u88AB\u652F\u6301\u7684\u5BBF\u4E3B\u4E0A\uFF0C\u4E5F\u8FD8\u770B\u5F97\u89C1\u4E00\u4E2A\u5706\uFF09\u3002 */
.t-team-pop-avatar{flex:none;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font-size:26px;line-height:1}
.t-team-pop-avatar img{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}
/* \u6280\u80FD\u5361\u5934\u50CF\uFF1A\u6280\u80FD\u6CA1\u6709 color \u5B57\u6BB5\uFF0C\u56FA\u5B9A\u7528\u540C\u4E00\u6863\u6DE1\u7070\u5E95 + \u5F69\u8272 emoji\uFF08\u{1F9F0}\uFF09\u2014\u2014 \u4E0E\u4E13\u5BB6\u5361\u7684\u6DE1\u8272\u5706\u540C\u4E00\u5957\u89C2\u611F\u3002 */
.t-team-pop-avatar-skill{background:var(--dsw-alias-interactive-bg-hover)}
.t-team-pop-title{display:flex;flex-direction:column;gap:3px;min-width:0}
/* \u540D\u79F0\uFF1A15px/600\uFF08\u53C2\u8003\u56FE\u91CC\u5B83\u662F\u5361\u7247\u91CC\u6700\u5927\u7684\u4E00\u884C\uFF09\u3002\u5B83\u5FC5\u987B\u9760\u5DE6 \u2014\u2014 \u9760\u7684\u662F .t-team-pop-item \u7684
   text-align:left \u52A0\u4E0A\u90A3\u4E00\u884C\u5BF9 justify-content \u7684\u4FEE\u6B63\uFF0C\u89C1\u4E0A\u9762\u7684\u8BF4\u660E\u3002 */
.t-team-pop-name{font-size:15px;font-weight:600;color:var(--dsw-alias-label-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.t-team-pop-sub{font-size:12px;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* \u7B80\u4ECB\u56FA\u5B9A\u4E24\u884C\uFF1A\u5185\u5BB9\u591A\u7684\u622A\u65AD\uFF08-webkit-line-clamp:2\uFF09\uFF0C\u5185\u5BB9\u5C11\u7684\u7528 min-height \u5360\u4F4F\u4E24\u884C\u7684\u9AD8\u5EA6 \u2014\u2014
   \u8FD9\u4E00\u6761\u662F\u300C\u4E13\u5BB6\u5361 = \u6280\u80FD\u5361\u300D\u7684\u53E6\u4E00\u534A\uFF1A\u6280\u80FD\u63CF\u8FF0\u666E\u904D\u504F\u77ED\uFF0C\u4E0D\u5360\u4F4D\u7684\u8BDD\u6280\u80FD\u5361\u4F1A\u6BD4\u4E13\u5BB6\u5361\u77EE\u4E00\u622A\u3002
   \u4E24\u884C = 12px \xD7 1.5 \xD7 2 = 36px\u3002\u60F3\u8C03\u884C\u6570\u5C31\u628A line-clamp \u4E0E min-height \u4E00\u8D77\u6539\u3002 */
.t-team-pop-desc{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:36px;font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}
/* \u5361\u7247\u5E95\u90E8\u6807\u7B7E\u884C\uFF082026-09-29 \u53C2\u8003\u56FE\uFF09\uFF1A\u6D45\u7070\u80F6\u56CA\u3002\u4E13\u5BB6\u5361\u653E\u300C\u5206\u533A [+ \u81EA\u5EFA]\u300D\u3001\u6280\u80FD\u5361\u653E\u300C\u6280\u80FD [+ \u4EC5\u7528\u6237]\u300D\u3002
   \u4E24\u5361\u90FD\u6709\u8FD9\u4E00\u884C\u3001\u9AD8\u5EA6\u56FA\u5B9A 20px \u2014\u2014 \u5B83\u662F"\u4E24\u5361\u7B49\u9AD8"\u7684\u6700\u540E\u4E00\u5757\u3002
   nowrap + overflow:hidden\uFF1A\u5217\u5F88\u7A84\uFF0C\u5B81\u53EF\u622A\u65AD\u4E5F\u4E0D\u8981\u6362\u884C\uFF08\u6362\u884C\u4F1A\u7834\u574F\u7B49\u9AD8\u4E0E contain-intrinsic-size \u7684\u4F30\u7B97\uFF09\u3002 */
.t-team-pop-tags{display:flex;flex-wrap:nowrap;gap:6px;height:20px;overflow:hidden}
.t-team-pop-tag{flex:0 0 auto;box-sizing:border-box;height:20px;padding:0 8px;border-radius:6px;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-secondary);font-size:11px;line-height:20px;white-space:nowrap}
.t-team-pop-empty{font-size:12px;color:var(--dsw-alias-label-tertiary);padding:6px 2px}
.t-team-pop-head{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}
/* \u952E\u76D8\u7126\u70B9\u73AF\uFF1A\u5B98\u65B9\u7ED9\u6574\u9875\u4E00\u6761\u7EDF\u4E00\u89C4\u5219\uFF08.t-XoWW_page :focus-visible{outline:2px solid \u2026;offset:2px}\uFF09\uFF0C
   \u53EA\u6709\u5927\u6807\u9898\u8F93\u5165\u6846\u4E0E\u63D0\u793A\u8BCD\u8F93\u5165\u533A\u4F8B\u5916\u2014\u2014\u5B83\u4EEC\u81EA\u5DF1\u6709 focus \u8868\u73B0\uFF08\u4E0B\u5212\u7EBF / \u5916\u6846\u53D8\u84DD\uFF09\u3002
   \u7167\u6284\uFF0C\u514D\u5F97\u5404\u5904\u6309\u94AE\u4E0E\u8F93\u5165\u6846\u7684\u7126\u70B9\u6837\u5F0F\u5404\u5199\u5404\u7684\u3002 */
/* \u5DE6\u680F\uFF08\u5217\u8868\uFF09\uFF1Aflex:1 \u6491\u6EE1\uFF0C\u53F3\u4FA7\u6709\u8BE6\u60C5\u65F6\u81EA\u7136\u8BA9\u51FA\u4E00\u534A\uFF1B\u81EA\u5DF1\u4E0D\u5206\u680F\u6EDA\u52A8\uFF0C\u6EDA\u52A8\u4EA4\u7ED9\u91CC\u9762\u7684 pageScroll\u3002
   2026-09-25 \u7528\u6237\u53E3\u5F84\uFF1A\u65B0\u5EFA/\u7F16\u8F91\u6539\u6210\u5B98\u65B9\u90A3\u79CD\u300C\u5DE6\u5217\u8868 + \u53F3\u8BE6\u60C5\u300D\u7684\u53CC\u680F\u3002 */
/* \u26A0\uFE0F \u6EDA\u52A8\u5BB9\u5668\u5FC5\u987B\u662F\u5DE6\u680F\u91CC**\u5168\u5BBD**\u7684\u8FD9\u4E00\u5C42\uFF0C\u5185\u5BB9\u5217\uFF08.t-team-sched-page\uFF09\u53EA\u8D1F\u8D23\u5C45\u4E2D\u3002
 * 2026-09-25 \u7528\u6237\u53D1\u73B0\u300C\u6EDA\u52A8\u6761\u4E0D\u5728\u6700\u53F3\u8FB9\u300D\uFF1A\u6B64\u524D\u6EDA\u52A8\u6302\u5728 960px \u7684\u5C45\u4E2D\u5217\u4E0A\uFF0C\u6EDA\u52A8\u6761\u5C31\u957F\u5728
 * \u90A3\u4E00\u5217\u7684\u53F3\u8FB9\u7F18\u3001\u79BB\u7A97\u53E3\u53F3\u8FB9\u8FD8\u6709\u4E00\u5927\u622A\u7A7A\u767D\u3002\u5B98\u65B9\u90A3\u4E00\u9875\u4E5F\u662F\u8FD9\u4E48\u5206\u7684\uFF1A
 * .t-XoWW_pageScroll\uFF08flex:1 + overflow:auto + scrollbar-gutter:stable\uFF09\u5957 .t-XoWW_pageContent
 * \uFF08max-width + margin auto\uFF09\u3002scrollbar-gutter:stable \u8BA9\u6709/\u65E0\u6EDA\u52A8\u6761\u65F6\u5185\u5BB9\u4E0D\u5DE6\u53F3\u8DF3\uFF1B
 * 9px \u5BBD\u4E0E 2px \u5185\u7F29\u4E5F\u662F\u5B98\u65B9\u90A3\u4E24\u4E2A\u503C\uFF08\u6EDA\u52A8\u6761\u914D\u8272\u8D70\u5BBF\u4E3B\u7684 --dsh-scrollbar-* \u53D8\u91CF\uFF09\u3002
 * \u26A0\uFE0F \u8FD9\u4E00\u5C42\u662F**\u5757\u7EA7**\u5BB9\u5668\uFF08\u4E0D\u52A0 display:flex\uFF09\uFF1A\u5B98\u65B9\u7684 pageScroll \u4E5F\u6CA1\u6709 display\uFF0C\u5185\u5BB9\u5217\u56E0\u6B64
 * \u8D70\u5757\u7EA7\u7684 width:auto + max-width \u89C4\u5219\u3002\u7ED9\u5B83\u52A0 flex \u4F1A\u8BA9\u5B50\u9879\u7684\u81EA\u52A8\u5916\u8FB9\u8DDD\u6539\u53D8\u5BBD\u5EA6\u7B97\u6CD5\u3002 */
/* \u26A0\uFE0F \u5185\u5BB9\u5217\u4E0E\u5B98\u65B9 .t-XoWW_pageContent **\u9010\u5B57\u4E00\u81F4**\uFF1Amax-width:960px + padding\uFF0C\u5757\u7EA7\uFF08\u4E0D\u52A0 display:flex\uFF09\u3001
 * **\u4E0D\u8981** box-sizing:border-box \u4E0E width:100%\uFF082026-09-25 \u7528\u6237\u62A5\u300C\u533A\u57DF\u5BBD\u548C\u5B98\u65B9\u4E0D\u4E00\u6837\u300D\u5C31\u662F\u90A3\u4E24\u6761\u6765\u7684\uFF09\uFF1A
 *   \xB7 \u5B98\u65B9 max-width \u9650\u7684\u662F**\u5185\u5BB9\u76D2** \u2192 \u6574\u5217\u6700\u5BBD 960 + 2\xD7padding\uFF08\u6700\u5927 1056\uFF09\uFF1B
 *   \xB7 \u52A0\u4E86 border-box + width:100% \u5C31\u53D8\u6210\u300C\u5185\u5BB9 + padding \u4E00\u5171 960\u300D\u2192 \u5185\u5BB9\u53EA\u6709 864\uFF0C\u7A84\u4E86 96px\u3002
 * \u5757\u7EA7\u6D41\u91CC\u5404\u6BB5\u7684\u95F4\u8DDD\u7531\u5143\u7D20\u81EA\u5DF1\u7684 margin \u63D0\u4F9B\uFF08heading 24 / filters 14 / search 16\uFF09\uFF0C\u4E0E\u5B98\u65B9\u540C\u6B3E\uFF1B
 * \u8FD9\u91CC\u4E0D\u7528 flex + gap \u2014\u2014 \u90A3\u4F1A\u8BA9\u540C\u4E00\u5904\u95F4\u8DDD\u7531\u4E24\u5957\u673A\u5236\u53E0\u52A0\uFF0C\u5B9E\u6D4B\u5C31\u4E0E\u5B98\u65B9\u5DEE 2px\u3002 */
/* \u53F3\u680F\uFF08\u8BE6\u60C5 / \u65B0\u5EFA / \u7F16\u8F91\uFF09\uFF1A\u5B98\u65B9 detail \u90A3\u5957 \u2014\u2014 47% \u5BBD\u3001\u5DE6\u4FA7 .5px \u5206\u9694\u7EBF\u3001\u9876\u90E8 tab \u884C\u3001
   \u4E2D\u95F4\u6EDA\u52A8\u533A\u3001\u5E95\u90E8\u56FA\u5B9A\u52A8\u4F5C\u6761\u3002\u5DE6\u53F3\u7559\u767D\u7EDF\u4E00\u8D70\u5B98\u65B9\u7684 --detail-gutter\uFF0824 / 20 / 16 \u4E09\u6863\u65AD\u70B9\uFF09\uFF0C
   \u7A84\u5C4F\uFF08<=760px\uFF09\u65F6\u53F3\u680F\u72EC\u5360\u6574\u9875\u3001\u5217\u8868\u8BA9\u4F4D\uFF08\u5B98\u65B9\u540C\u6B3E\u65AD\u70B9\uFF09\u3002 */
/* \u5E95\u90E8\u52A8\u4F5C\u6761\uFF1A\u5B98\u65B9 saveFooter \u7684 20px \u5185\u8FB9\u8DDD + \u6700\u540E\u4E00\u4E2A\u6309\u94AE\u53F3\u79FB 8px\uFF08\u89C6\u89C9\u53F3\u8FB9\u7F18\u4E0E\u5185\u5BB9\u5BF9\u9F50\uFF09\u3002 */
/* \u6807\u9898\u884C\uFF1A\u4E0E\u5B98\u65B9 .t-XoWW_pageHeading \u540C\u6B3E\uFF08padding-top 28 / margin-bottom 24 / gap 16\uFF09\u3002
   \u5185\u5BB9\u5217\u6539\u6210\u5757\u7EA7\u6D41\u4E4B\u540E\uFF0C24px \u7531\u5B83\u81EA\u5DF1\u7ED9\uFF0C\u4E0D\u518D\u4E0E page \u7684 gap \u53E0\u52A0\u3002 */
/* \u63D0\u793A\u6587\u5B57\uFF08\u52A0\u8F7D\u4E2D\uFF09\uFF1A\u5B98\u65B9\u90A3\u9875\u6CA1\u6709\u8FD9\u4E00\u53E5\uFF0C\u7ED9\u5B83\u4E00\u4E2A\u4E0D\u8D34\u4F4F\u4E0B\u4E00\u6BB5\u7684\u4E0B\u8FB9\u8DDD\u3002 */
/* \u7A7A\u6001 / \u65E0\u5339\u914D\uFF1A\u5B98\u65B9 .t-XoWW_empty \u662F**\u5C45\u4E2D**\u7684\u4E00\u5757\uFF08flex column + \u5C45\u4E2D + 48px 20px \u5185\u8FB9\u8DDD\uFF09\u3002 */
/* \u9875\u5C3E\u4E0D\u518D\u6302\u300C\u5B89\u5168\u63D0\u793A\u300D\u4E0E\u300C\u6570\u636E\u6587\u4EF6\u8DEF\u5F84\u300D\u4E24\u884C\uFF082026-09-25 \u7528\u6237\u53E3\u5F84\uFF09\uFF1A
   tip \u632A\u5230\u63D0\u793A\u8BCD\u8F93\u5165\u6846\u4E0B\u9762\uFF0C\u7528 .t-team-sched-hint\uFF1B\u8DEF\u5F84\u90A3\u884C\u6574\u4E2A\u5220\u6389\u3002 */
/* \u5217\u8868\u533A\u5BB9\u5668\uFF1A\u5B98\u65B9 pageContent \u91CC\u6CA1\u6709\u8FD9\u4E00\u5C42\uFF08heading/filters/search/list \u76F4\u63A5\u662F\u5144\u5F1F\uFF09\uFF0C
   \u6240\u4EE5\u8FD9\u91CC**\u4E0D\u7ED9\u4EFB\u4F55\u95F4\u8DDD**\u2014\u2014\u95F4\u8DDD\u7531\u5404\u5143\u7D20\u81EA\u5DF1\u7684 margin \u63D0\u4F9B\uFF0C\u8DDF\u5B98\u65B9\u4E00\u6A21\u4E00\u6837\uFF0C\u907F\u514D\u4E24\u5957\u673A\u5236\u53E0\u52A0\u3002 */
/* \u8FC7\u6EE4\u6807\u7B7E\u884C + \u641C\u7D22\u6846\uFF1A\u5B98\u65B9\u9875\u9762\u7684\u90A3\u4E24\u884C\uFF0C\u6570\u503C\u7167\u6284\uFF0828px \u80F6\u56CA / 36px \u5706\u89D2 12px \u8F93\u5165\u6846\uFF09\uFF0C
 * \u8FDE\u95F4\u8DDD\u7684**\u6765\u6E90**\u4E5F\u7167\u6284\uFF1Afilters{margin-bottom:14px}\u3001searchField{margin:0 0 16px}\u3002 */
/* \u26A0\uFE0F \u641C\u7D22\u6846\u9010\u6761\u5BF9\u9F50\u5B98\u65B9 .t-XoWW_searchField\uFF1A**content-box**\uFF08\u5B98\u65B9\u6CA1\u5199 box-sizing\uFF0C\u52A0\u4E86 border-box
 * \u4F1A\u8BA9\u5916\u9AD8\u4ECE 37 \u53D8 36\uFF09\u3001**\u4E0D\u8BBE gap**\uFF08\u56FE\u6807\u4E0E\u8F93\u5165\u6846\u4E4B\u95F4\u90A3 6px \u5C5E\u4E8E\u5B98\u65B9\u7684 Input \u7EC4\u4EF6\uFF0C
 * \u7531\u56FE\u6807\u76D2\u81EA\u5DF1\u7684 margin-right \u7ED9\uFF09\u3001margin 0 0 16px\u3002 */
/* \u56FE\u6807\u76D2\uFF1A\u5B98\u65B9 Input \u7684 .icon \u662F 16\xD716 \u7684 inline-flex \u5C45\u4E2D\u76D2\uFF08\u91CC\u9762\u7684 svg 14px\uFF09\uFF0C
   \u56FE\u6807\u76D2\u4E0E\u8F93\u5165\u6846\u4E4B\u95F4 6px \u2014\u2014 \u7167\u6284\uFF0C\u5426\u5219\u6587\u5B57\u8D77\u59CB\u4F4D\u7F6E\u4F1A\u5DEE 2~4px\u3002 */
/* \u8F93\u5165\u5143\u7D20\uFF1A\u5B98\u65B9 .input \u53EA\u91CD\u7F6E\u4E86 border/outline/background\uFF0C**\u4FDD\u7559\u4E86 UA \u9ED8\u8BA4\u7684 padding:1px 2px**
 * \uFF08\u6240\u4EE5\u5360\u4F4D\u6587\u5B57\u7684\u8D77\u59CB\u4F4D\u7F6E\u6BD4\u6211\u4EEC\u6309\u4F4F padding \u65F6\u591A 2px\uFF09\u3002\u7167\u6284\uFF1Apadding \u7528 UA \u9ED8\u8BA4\u503C\uFF0C\u522B\u6E05\u96F6\u3002 */
/* \u6E05\u7A7A\u6309\u94AE\uFF1A\u5B98\u65B9 .t-XoWW_searchClear \u662F 28\xD728\u3001\u53F3\u79FB 6px\uFF08\u56FE\u6807 14px\uFF09\u3002 */
/* \u4EFB\u52A1\u884C\uFF1A\u5B98\u65B9 .t-XoWW_row \u7684\u89C2\u611F \u2014\u2014 \u65E0\u8FB9\u6846\u3001\u60AC\u505C\u6D45\u7070\u3001\u56FE\u6807 + \u4E3B\u526F\u4E24\u884C\uFF1B\u64CD\u4F5C\u6309\u94AE\u56FA\u5B9A\u5728\u884C\u5C3E\u3002
 * \u5B98\u65B9\u90A3\u884C\u662F content-box + width:100% + padding 8px\uFF08\u5BBF\u4E3B\u6CA1\u6709\u5168\u5C40 box-sizing reset\uFF1A\u5B98\u65B9\u5728
 * instruction / zoneSearch / confirmDialog \u56DB\u5904\u90FD**\u663E\u5F0F**\u8865\u4E86 border-box\uFF0C\u6B63\u8BF4\u660E\u9ED8\u8BA4\u662F content-box\uFF09\u3002
 * \u4E8E\u662F\u8FD9\u4E00\u884C\u7684 border box \u6BD4\u5185\u5BB9\u5217**\u53F3\u51FA\u8840 16px** \u2014\u2014 \u90A3 16px \u843D\u5728\u5185\u5BB9\u5217\u7684 padding\uFF08\u226524px\uFF09\u91CC\uFF0C
 * \u4E0D\u4F1A\u6EA2\u51FA\u5230\u6EDA\u52A8\u5C42\uFF0C\u6240\u4EE5\u7167\u6284\u4E0D\u4F1A\u6709\u6A2A\u5411\u6EDA\u52A8\u6761\u3002\u522B\u6539\u56DE border-box\uFF0C\u90A3\u6837\u884C\u4F1A\u6BD4\u5B98\u65B9\u7A84 16px\u3002 */
/* \u56FE\u6807\u69FD\uFF1A\u5B98\u65B9\u53EA\u6709 width/height/margin-top\uFF08svg \u662F inline\uFF09\uFF0C\u8FD9\u91CC\u4E5F\u4E0D\u52A0 flex \u2014\u2014
   \u52A0\u4E86\u4F1A\u8BA9\u56FE\u6807\u76F8\u5BF9\u884C\u6807\u9898\u7684\u5782\u76F4\u4F4D\u7F6E\u5DEE 1~2px\u3002 */
/* \u884C\u6807\u9898\u524D\u7684\u72B6\u6001\u56FE\u6807\uFF0814px\uFF0C\u4E0E 23px \u884C\u9AD8\u7684\u6587\u5B57\u5BF9\u9F50\uFF09\uFF1A
   \u542F\u7528 = \u7EFF\uFF08state-success-primary\uFF09\uFF0C\u505C\u7528 = **\u6DE1\u7EA2**\uFF08state-error-secondary\uFF0C\u7528\u6237\u53E3\u5F84\u300C\u6DE1\u7EA2\u624D\u660E\u663E\u300D\uFF09\u3002
   \u989C\u8272\u56FA\u5B9A\u3001\u4E0D\u968F\u884C\u7684\u60AC\u505C\u6001\u53D8\u5316 \u2014\u2014 \u60AC\u505C\u65F6\u6807\u9898\u62AC\u56DE\u6B63\u5E38\u8272\uFF0C\u56FE\u6807\u7EE7\u7EED\u8868\u793A\u8FD9\u6761\u4EFB\u52A1\u7684\u72B6\u6001\u3002 */
/* \u5DF2\u505C\u7528\u7684\u884C\u6309\u5B98\u65B9\u300C\u5DF2\u7ED3\u675F\u300D\u7684\u5904\u7406\u65B9\u5F0F\u538B\u6697\u6807\u9898\u4E0E\u6458\u8981\uFF08\u60AC\u505C\u65F6\u518D\u62AC\u56DE\u6765\uFF0C\u4FDD\u8BC1\u53EF\u8BFB\uFF09\u3002 */
/* ---- \u6267\u884C\u8BB0\u5F55\u9875\uFF08\u53F3\u680F\u7B2C\u4E8C\u4E2A tab\uFF09\uFF1A\u5B98\u65B9\u300C\u4EFB\u52A1\u8FD0\u884C\u8BB0\u5F55\u300D\u90A3\u5957\u65F6\u95F4\u7EBF ----
 * \u5EA6\u91CF\u7167\u6284 .t-XoWW_delivery*\uFF1A\u6BCF\u6761 = \u56FE\u6807 + \u65F6\u95F4\uFF0814/500\uFF09+ \u7ED3\u679C\uFF0C\u5DE6\u4FA7\u4E00\u6761 .5px \u7AD6\u7EBF\u628A\u5404\u6761\u4E32\u8D77\u6765
 * \uFF08left:15.75px \u662F\u56FE\u6807\u4E2D\u5FC3\uFF1A\u884C margin -8 + padding 8 \u2192 \u56FE\u6807\u4E2D\u5FC3 16\uFF09\u3002 */
/* \u72B6\u6001\u8DDF\u5728\u65F6\u95F4\u540E\u9762\uFF082026-09-25 \u7528\u6237\u53E3\u5F84\uFF09\uFF1A\u5C0F\u56FE\u6807 + \u6587\u5B57\uFF0C\u6210\u529F\u7EFF\u3001\u5931\u8D25\u7EA2\u3002
   \u56FE\u6807\u7528 14px\uFF08\u5BBF\u4E3B\u90A3\u4E9B\u56FE\u6807\u672C\u8EAB\u662F 16px \u7684 viewBox\uFF0C\u8FD9\u91CC\u7F29\u653E\u4E00\u4E0B\u4E0E 14px \u7684\u65F6\u95F4\u5B57\u53F7\u66F4\u8D34\uFF09\u3002 */
/* \u5931\u8D25\u539F\u56E0\u5355\u72EC\u4E00\u884C\uFF08\u522B\u628A"\u65F6\u95F4 + \u72B6\u6001"\u90A3\u4E00\u884C\u6491\u957F\uFF09\u3002 */
/* \u4F1A\u8BDD\u884C\uFF1Aid + \u540E\u9762\u90A3\u679A\u300C\u5173\u8054\u4F1A\u8BDD \u203A\u300D\u6309\u94AE\uFF08\u5E76\u6392\uFF0C\u7A84\u4E86\u81EA\u52A8\u6362\u884C\uFF09\u3002 */
/* \u300C\u8FD9\u4E2A\u4F1A\u8BDD\u6253\u4E0D\u5F00\u300D\u7684\u63D0\u793A\u884C\uFF1A\u5F52\u6863\u8D70 warn \u8272\uFF08\u65C1\u8FB9\u8FD8\u6709\u4E00\u679A\u300C\u6062\u590D\u5E76\u6253\u5F00\u300D\uFF09\uFF0C\u5DF2\u5220\u8D70\u9519\u8BEF\u8272\u3002 */
/* \u90A3\u4E00\u6B21\u63D0\u4EA4\u7684\u63D0\u793A\u8BCD\uFF1A\u5B98\u65B9 savedPrompt \u90A3\u5957 \u2014\u2014 \u4E24\u884C\u622A\u65AD\uFF08line-clamp:2\uFF09\uFF0C\u70B9\u300C\u5C55\u5F00\u300D\u770B\u5168\u6587\u3002 */
/* \u672B\u5C3E\u4E00\u884C\uFF1A\u8BF4\u660E\u53EA\u7559\u6700\u8FD1\u591A\u5C11\u6B21\uFF08\u5B98\u65B9\u7684 retentionEnd \u540C\u6B3E\u5C0F\u5B57\uFF09\u3002 */
/* \u6309\u94AE\uFF1A\u5B98\u65B9\u90A3\u4E24\u6863 \u2014\u2014 \u6B21\u7EA7\u662F\u900F\u660E\u80F6\u56CA\uFF08h28 / r14\uFF09\uFF0C\u4E3B\u6309\u94AE\u6309\u5B98\u65B9 Button + newButton \u7684\u89C4\u683C\uFF1A
 * \u80CC\u666F\u8D70 --dsw-alias-button-primary-fill\u3001\u6587\u5B57\u8D70 --dsw-alias-label-primary-foreground\uFF08\u4E0D\u662F\u6211\u4EEC\u81EA\u5DF1
 * \u62FC\u7684 label-primary/bg-base \u2014\u2014 \u6362\u4E86\u54C1\u724C\u8272\u5C31\u4F1A\u770B\u51FA\u5DEE\u522B\uFF09\u3001h32 / r16 / padding 0 12px / gap 4px\u3002 */
/* \u53F3\u680F\u8868\u5355\u91CC\u7684\u5B57\u6BB5\u7EC4\u4E0E\u63A7\u4EF6\uFF1A\u5B98\u65B9\u8BE6\u60C5\u9875\u90A3\u5957\uFF08.5px \u63CF\u8FB9 + 12px \u5706\u89D2\u8F93\u5165\u6846\u300136px \u9AD8\u3001
   \u805A\u7126\u6362\u6210\u4E3B\u9898\u84DD\uFF09\uFF1B\u5206\u7EC4\u6807\u9898\u662F\u5B98\u65B9 ruleCard h3 \u90A3\u4E2A 13px \u5C0F\u6807\u9898\u3002 */
/* cron \u9009\u62E9\u5668\uFF1A\u8FD0\u884C\u65F6\u95F4\u5361\u7247\uFF08\u5B98\u65B9 ruleRows \u90A3\u5957\uFF09+ \u5361\u7247\u4E0B\u65B9\u7684\u5E38\u7528\u6A21\u677F + \u6458\u8981 + \u6700\u8FD1\u51E0\u6B21\u9884\u89C8 */
/* \u8FD0\u884C\u65F6\u95F4\u5361\u7247\uFF1A\u5EA6\u91CF\u7167\u6284\u5B98\u65B9 .t-XoWW_ruleRows / ruleRow / ruleLabel / ruleValue / ruleInput \u2014\u2014
 * .5px \u63CF\u8FB9 + 16px \u5706\u89D2\u5BB9\u5668\u3001\u6BCF\u884C min-height 48px\u3001\u884C\u95F4\u4E00\u6761 .5px \u5206\u9694\u7EBF\uFF08\u6700\u540E\u4E00\u884C\u4E0D\u8981\uFF09\uFF0C
 * \u5DE6\u8FB9\u6807\u7B7E 14px\u3001\u53F3\u8FB9\u53D6\u503C\uFF08\u539F\u751F select / input \u505A\u6210\u65E0\u8FB9\u6846\u3001hover \u624D\u6D6E\u51FA\u6D45\u7070\u5706\u89D2\u5E95\uFF09\u3002 */
/* \u53D6\u503C\u9762\uFF08\u5B98\u65B9 ruleValue / ruleValueFace / pickerTrigger / pickerIcon \u7684\u5F62\u6001\uFF09\uFF1A\u4E00\u884C\u53F3\u4FA7\u662F
 * \u300C\u5F53\u524D\u503C + \u4E00\u4E2A\u6307\u793A\u56FE\u6807\u300D\u7684\u53EF\u70B9\u9762\uFF0Chover \u65F6\u6574\u9762\u6D6E\u6D45\u7070\uFF0C\u70B9\u5F00\u4E00\u4E2A\u540C\u6E90\u5C0F\u9762\u677F\u3002
 * \u26A0\uFE0F \u523B\u610F\u4E0D\u7528\u539F\u751F select\uFF1A\u5B83\u7684\u7BAD\u5934\u4E0E\u4E0B\u62C9\u5F39\u5C42\u7531\u6D4F\u89C8\u5668\u753B\uFF0C\u6DF1\u6D45\u4E3B\u9898\u4E0B\u90FD\u6CA1\u6CD5\u4E0E\u5B98\u65B9\u4E00\u81F4\u3002 */
/* \u70B9\u5F00\u7684\u5C0F\u9762\u677F\uFF1A\u4E0E ExpertPicker \u540C\u6E90\uFF08\u83DC\u5355\u5E95\u8272 + \u80CC\u666F\u6A21\u7CCA\uFF0C\u523B\u610F\u4E0D\u5E26\u6295\u5F71\uFF09\u3002
 * \u5355\u5217\u7528 .t-team-sched-pickerList\uFF08\u7AD6\u6392\uFF09\uFF0C\u53CC\u5217\uFF08\u65F6/\u5206\uFF09\u76F4\u63A5\u662F\u4E24\u4E2A .t-team-sched-pickerCol \u5E76\u6392\u3002 */
/* \u81EA\u5B9A\u4E49\u8868\u8FBE\u5F0F\u7684\u8F93\u5165\u6846\uFF1A\u5B98\u65B9 ruleInput\uFF08\u65E0\u6846\u3001\u53F3\u5BF9\u9F50\u3001hover \u6D6E\u6D45\u7070\uFF09 */
/* \u5E38\u7528\u6A21\u677F\uFF1A\u5361\u7247\u4E0B\u65B9\u7684\u5C0F\u80F6\u56CA\uFF08\u4E0E\u5217\u8868\u9875\u7684\u8FC7\u6EE4\u6807\u7B7E\u540C\u6B3E\uFF09\u3002
 * \u26A0\uFE0F \u7C7B\u540D\u5FC5\u987B\u662F .t-team-sched-preset\uFF1A.t-team-sched-chip \u5F52\u63D0\u793A\u8BCD\u91CC\u7684\u4E13\u5BB6\u82AF\u7247\uFF0C
 * \u4E24\u8FB9\u540C\u540D\u65F6\u540E\u5B9A\u4E49\u7684\u90A3\u6761\u4F1A\u628A\u524D\u9762\u7684\u8986\u76D6\u6389\uFF08\u8E29\u8FC7\uFF1A\u6A21\u677F\u6309\u94AE\u957F\u6210\u84DD\u8272\u82AF\u7247\uFF09\u3002 */
/* \u63D0\u793A\u8BCD\u8F93\u5165\u533A\uFF1A\u6846\u5185\u7B2C\u4E00\u884C\u662F\u4E13\u5BB6\u82AF\u7247\uFF08\u6807\u7B7E\u89C2\u611F\uFF0C\u4E0E\u5BF9\u8BDD\u8F93\u5165\u6846\u4E00\u81F4\uFF09\uFF0C\u4E0B\u9762\u662F\u6B63\u6587\u3002
 * \u5916\u6846\u5BF9\u9F50\u5B98\u65B9\u8BE6\u60C5\u9875\u7684\u63D0\u793A\u8BCD\u8F93\u5165\u6846\uFF1A\u5706\u89D2 16px\u3001.5px \u63CF\u8FB9\u3001\u805A\u7126\u65F6\u6362\u6210\u4E3B\u9898\u84DD\u3002 */
/* \u82AF\u7247\u89C2\u611F\u5BF9\u9F50\u5BF9\u8BDD\u8F93\u5165\u6846\u91CC\u7684\u5F15\u7528\u82AF\u7247\uFF1A\u6D45\u7070\u5E95\u3001\u5706\u89D2\u77E9\u5F62\uFF08\u4E0D\u662F\u5168\u80F6\u56CA\uFF09\u3001\u84DD\u8272\u6587\u5B57\u3001
 * \u5DE6\u4FA7\u4E00\u4E2A\u5706\u5F62\u7EBF\u6761\u5C0F\u56FE\u6807\uFF1B\xD7 \u5E73\u65F6\u4E0D\u663E\u793A\uFF0C\u60AC\u505C\u624D\u6D6E\u51FA\u6765\uFF08\u622A\u56FE\u91CC\u5C31\u662F\u6CA1\u6709 \xD7 \u7684\u6837\u5B50\uFF09\u3002 */
/* \u60AC\u505C\u7ED9\u4E00\u5708\u6DE1\u63CF\u8FB9\uFF1A\u8BA9"\u9F20\u6807\u5728\u8FD9\u679A\u82AF\u7247\u4E0A"\u8FD9\u4EF6\u4E8B\u6709\u786E\u5B9A\u7684\u89C6\u89C9\u53CD\u9988\uFF08\u522B\u9760\u6D4F\u89C8\u5668\u9ED8\u8BA4\uFF09\u3002 */
/* \u63D0\u793A\u8BCD\u7F16\u8F91\u533A\uFF1Acontenteditable \u7684\u5BCC\u6587\u672C\u6D41\uFF08\u7EAF\u6587\u5B57 + \u82AF\u7247\uFF09\uFF0C\u82AF\u7247\u56E0\u6B64\u80FD\u63D2\u5728\u6B63\u6587\u4EFB\u610F\u4F4D\u7F6E\u3002
 * \u26A0\uFE0F \u9009\u62E9\u5668\u8981\u5E26 .t-team-sched-promptbox \u524D\u7F00\uFF08\u539F\u6765\u662F .t-team-sched-field\uFF09\uFF1A\u5426\u5219\u7279\u5F02\u6027\u4F4E\u4E8E
 * \u901A\u7528\u7684 ".t-team-sched-group textarea/input" \u90A3\u7C7B\u89C4\u5219\uFF0C\u7F16\u8F91\u533A\u4F1A\u81EA\u5E26\u4E00\u5708\u8FB9\u6846\uFF08\u8E29\u8FC7\uFF1A\u6846\u91CC\u5957\u6846\uFF09\u3002 */
/* \u7A84\u5C4F\uFF08\u4E0E\u5B98\u65B9\u540C\u6B3E\u65AD\u70B9\uFF09\uFF1A\u8BE6\u60C5/\u8868\u5355\u72EC\u5360\u6574\u9875\uFF0C\u5217\u8868\u8BA9\u4F4D \u2014\u2014 \u6324\u6210\u4E24\u680F\u4E24\u8FB9\u90FD\u6CA1\u6CD5\u7528\u3002 */
/* \u5B98\u65B9\u7684\u4E09\u6863\u65AD\u70B9\uFF08\u6570\u503C\u7167\u6284\uFF09\uFF1A\u53F3\u680F\u5DE6\u53F3\u7559\u767D 24 \u2192 20 \u2192 16\uFF1B<=760 \u65F6\u53F3\u680F\u72EC\u5360\u6574\u9875\u3002 */
@media (width<=1100px){
  .t-team-sched-detailForm{--detail-gutter:20px}
}
@media (width<=760px){
  .t-team-sched-listPane[data-detail="true"]{display:none}
  .t-team-sched-detailForm{flex-basis:100%;border-left:0}
  .t-team-sched-detailScroll{padding-top:20px}
}
@media (width<=400px){
  .t-team-sched-detailForm{--detail-gutter:16px}
  .t-team-sched-detailTabsBar{gap:16px}
}
/* \u63D0\u793A\u8BCD\u6846\u4E0B\u65B9\u7684\u300CT\u4E13\u5BB6\u300D\u6311\u9009\u5668\uFF1A\u6309\u94AE + \u53EA\u542B\u4E13\u5BB6\u5217\u8868\u7684\u6D6E\u5C42\uFF08\u7C7B\u540D\u72EC\u7ACB\uFF0C\u907F\u514D\u4E0E\u65E2\u6709\u7C7B\u4E92\u76F8\u8986\u76D6\uFF09 */
.t-team-expert-pick{position:relative;display:flex;align-items:center;gap:8px;margin-top:2px}
.t-team-expert-pick-hint{font-size:12px;color:var(--dsw-alias-label-secondary)}
/* \u540C\u4EFB\u52A1\u6D6E\u5C42\uFF1A\u4E0D\u5E26\u6295\u5F71\uFF08\u6DF1\u8272\u4E3B\u9898\u4E0B\u4F1A\u53D8\u6210\u5916\u53D1\u5149\uFF0C\u89C1 .t-team-pop \u5904\u7684\u8BF4\u660E\uFF09\u3002 */
.t-team-expert-pick-panel{position:absolute;left:0;top:calc(100% + 6px);z-index:26;display:flex;flex-direction:column;gap:6px;width:min(420px,90vw);max-height:300px;box-sizing:border-box;padding:8px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-layer-3));backdrop-filter:var(--dsw-menu-backdrop-filter,blur(20px) saturate(1.4))}
.t-team-expert-pick-search{box-sizing:border-box;width:100%;padding:7px 9px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px}
.t-team-expert-pick-search:focus{outline:none;border-color:var(--dsw-alias-brand-primary, var(--dsw-alias-label-primary))}
.t-team-expert-pick-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px;overflow:auto;min-height:0}
.t-team-expert-pick-item{box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:6px 8px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;text-align:left;cursor:pointer}
.t-team-expert-pick-item[data-active="true"]{background:var(--dsw-alias-interactive-bg-hover)}
.t-team-expert-pick-item[data-picked="true"]{color:var(--dsw-alias-label-primary);font-weight:500}
.t-team-expert-pick-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.t-team-expert-pick-meta{flex:none;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.t-team-expert-pick-empty{font-size:12px;color:var(--dsw-alias-label-tertiary);padding:6px}

/* ---- \u6280\u80FD\u5F00\u5173\uFF082026-09-28 \u4ECE dsh-plugin-skill-gate \u5E76\u5165\uFF09----
   \u53EA\u7559\u5E03\u5C40\u7C7B\uFF1A\u6309\u94AE / \u8F93\u5165\u6846 / \u4E0B\u62C9 / \u72B6\u6001\u7B5B\u9009 / \u5F00\u5173\u90FD\u6362\u6210\u4E86\u5B98\u65B9 primitives \u7684\u7EC4\u4EF6\uFF0C
   \u90A3\u51E0\u5957 sg-* \u63A7\u4EF6\u6837\u5F0F\u968F\u4E4B\u4E0B\u7EBF\uFF08\u5B98\u65B9\u7684\u5728\u5B83\u81EA\u5DF1\u7684 CSS Module \u91CC\uFF09\u3002 */

.sg-settings{display:flex;flex-direction:column;gap:12px;min-height:0}
.sg-head{display:flex;flex-direction:column;gap:4px}
.sg-meta{font-size:12px;color:var(--dsw-alias-label-caption)}
.sg-hint{font-size:12px;line-height:1.45;color:var(--dsw-alias-label-secondary)}
.sg-error{font-size:12px;color:var(--dsw-alias-state-error-primary);line-height:1.4}
.sg-toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.sg-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.sg-filter-count{font-size:12px;color:var(--dsw-alias-label-caption);margin-left:auto}
.sg-actions{display:flex;flex-wrap:wrap;gap:6px}
.sg-groups{display:flex;flex-direction:column;gap:14px;min-height:0}
.sg-group{display:flex;flex-direction:column;gap:8px}
.sg-group-head{display:flex;align-items:baseline;justify-content:space-between;gap:8px;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.sg-list{display:flex;flex-direction:column;gap:8px}
.sg-row{display:flex;flex-direction:column;gap:4px;padding:9px 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-2)}
.sg-row[data-off="true"]{opacity:.72}
.sg-row-head{display:flex;align-items:center;justify-content:space-between;gap:12px;min-width:0}
.sg-name{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--dsw-font-markdown-code-block-small, ui-monospace, Menlo, monospace)}
.sg-desc{font-size:12px;line-height:1.4;color:var(--dsw-alias-label-caption)}
.sg-badge{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);font-size:10px;line-height:16px;vertical-align:middle;color:var(--dsw-alias-label-caption);font-weight:500}
.sg-empty{font-size:13px;color:var(--dsw-alias-label-caption);padding:16px 4px}
`;

// src/client/i18n.js
var zh = {
  "settings.title": "T\u4E13\u5BB6",
  "settings.summary": "\u4E13\u5BB6\u540D\u518C\u3001\u5206\u7C7B\u7BA1\u7406\u4E0E @ \u53EC\u5524",
  "group.expandAll": "\u5168\u90E8\u5C55\u5F00",
  "group.collapseAll": "\u5168\u90E8\u6536\u8D77",
  "group.toggle": "\u5C55\u5F00\u6216\u6536\u8D77\u300C{name}\u300D",
  "settings.loading": "\u6B63\u5728\u8BFB\u53D6\u540D\u518C\u2026",
  "settings.retry": "\u91CD\u8BD5",
  "settings.search": "\u641C\u7D22\u4E13\u5BB6\u540D\u6216\u7B80\u4ECB",
  "filter.division": "\u5206\u7C7B",
  "filter.allDivisions": "\u5168\u90E8\u5206\u7C7B",
  "filter.clear": "\u6E05\u9664\u7B5B\u9009",
  "filter.summary": "\u663E\u793A {shown} / {total}",
  "settings.enabledCount": "\u5171 {total} \u4F4D\u4E13\u5BB6",
  "settings.empty": "\u6CA1\u6709\u5339\u914D\u7684\u4E13\u5BB6\u3002",
  "settings.conflict": "\u540D\u79F0\u51B2\u7A81\uFF0C\u6682\u4E0D\u53EF\u53EC\u5524",
  "card.prompt": "\u67E5\u770B\u63D0\u793A\u8BCD",
  "card.promptTitle": "{name} \xB7 \u63D0\u793A\u8BCD",
  "card.promptLoading": "\u6B63\u5728\u8BFB\u53D6\u63D0\u793A\u8BCD\u2026",
  "card.promptFailed": "\u8BFB\u53D6\u63D0\u793A\u8BCD\u5931\u8D25\uFF1A{detail}",
  "card.promptEmpty": "\u8BE5\u4E13\u5BB6\u6CA1\u6709\u53EF\u663E\u793A\u7684\u63D0\u793A\u8BCD\u6B63\u6587\u3002",
  "card.close": "\u5173\u95ED",
  "card.copy": "\u590D\u5236",
  "card.copied": "\u5DF2\u590D\u5236",
  "card.copyFailed": "\u590D\u5236\u5931\u8D25",
  "settings.saveFailed": "\u4FDD\u5B58\u5931\u8D25\uFF1A{detail}",
  "settings.loadFailed": "\u8BFB\u53D6\u540D\u518C\u5931\u8D25\uFF1A{detail}",
  "settings.conflictRetry": "\u8BBE\u7F6E\u5DF2\u88AB\u5176\u4ED6\u7A97\u53E3\u4FEE\u6539\uFF0C\u5DF2\u91CD\u65B0\u8BFB\u53D6\u540D\u518C\uFF0C\u8BF7\u91CD\u8BD5\u3002",
  "settings.crashed": "\u8FD9\u5757\u5185\u5BB9\u6E32\u67D3\u5931\u8D25\uFF1A{detail}\u3002\u5207\u5230\u522B\u7684\u6807\u7B7E\u518D\u56DE\u6765\u53EF\u91CD\u8BD5\u3002",
  "error.remoteUnavailable": "T\u4E13\u5BB6 \u8FDC\u7A0B\u670D\u52A1\u4E0D\u53EF\u7528\uFF08host \u63D2\u4EF6\u672A\u52A0\u8F7D\u6216\u5DF2\u5378\u8F7D\uFF09",
  "trigger.removed": "@\u5DF2\u79FB\u9664\u4E13\u5BB6\uFF08\u8BF7\u91CD\u65B0\u9009\u62E9\uFF09",
  "button.label": "T\u4E13\u5BB6",
  "button.title": "\u6253\u5F00 T\u4E13\u5BB6 \u540D\u518C\uFF0C\u9009\u4E2D\u540E\u63D2\u5165\u5F15\u7528",
  "button.empty": "\u8FD8\u6CA1\u6709\u542F\u7528\u7684\u4E13\u5BB6\uFF0C\u5148\u53BB \u8BBE\u7F6E \u2192 T\u4E13\u5BB6 \u542F\u7528",
  "button.noMatch": "\u6CA1\u6709\u5339\u914D\u7684\u4E13\u5BB6",
  "button.insertFailed": "\u63D2\u5165\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5",
  "button.close": "\u5173\u95ED",
  "trigger.group": "T\u4E13\u5BB6 \xB7 {division}",
  "tab.experts": "\u4E13\u5BB6",
  "tab.categories": "\u5206\u7C7B",
  "tab.skills": "\u6280\u80FD",
  "tab.count": "(\xB7{count})",
  "pop.skillSearch": "\u641C\u7D22\u6280\u80FD\u540D\u6216\u63CF\u8FF0",
  "pop.skillEmpty": "\u8FD8\u6CA1\u6709\u53EF\u7528\u7684\u6280\u80FD\u3002",
  "pop.skillNoMatch": "\u6CA1\u6709\u5339\u914D\u7684\u6280\u80FD\u3002",
  "pop.skillUserOnly": "\u4EC5\u7528\u6237",
  "roster.expertsHint": "\u540D\u518C\uFF1A\u80FD\u88AB @ \u53EC\u5524\u7684\u4E13\u5BB6\u3002\u5E26\u300C\u81EA\u5EFA\u300D\u6807\u8BB0\u7684\u53EF\u4EE5\u5728\u8FD9\u91CC\u6539\u6216\u5220\u3002",
  // 名册健康提示（数据来自快照的 sidecar 字段）。三种情况都是**静默**的：
  // 侧车缺失 → 名册整个变英文；文件被跳过 → 专家凭空少几位；分类目录读不出 → 那一类不出现。
  // host 一直在报，但 0.4.6 之前 schema 没声明 sidecar、zod 把它剥掉了，面板收不到。
  "roster.sidecarMissing": "\u4E2D\u6587\u4FA7\u8F66\u6CA1\u627E\u5230\uFF08{path}\uFF09\uFF1A\u540D\u518C\u4F1A\u5168\u90E8\u9000\u56DE\u82F1\u6587\u540D\u3002",
  "roster.skippedFiles": "\u6709 {count} \u4E2A\u4E13\u5BB6\u6587\u4EF6\u56E0\u683C\u5F0F\u95EE\u9898\u88AB\u8DF3\u8FC7\uFF0C\u540D\u518C\u91CC\u4F1A\u5C11\u8FD9\u51E0\u4F4D\u3002",
  "roster.unreadableDivisions": "\u8FD9\u4E9B\u5206\u7C7B\u76EE\u5F55\u8BFB\u4E0D\u51FA\u6765\uFF1A{list}\u3002",
  "custom.new": "\uFF0B \u65B0\u5EFA\u4E13\u5BB6",
  "custom.titleNew": "\u65B0\u5EFA\u4E13\u5BB6",
  "custom.titleEdit": "\u7F16\u8F91\u300C{name}\u300D",
  "custom.slug": "slug\uFF08\u6587\u4EF6\u540D\uFF1A\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u8FDE\u5B57\u7B26\uFF09",
  "custom.name": "\u540D\u79F0\uFF08\u4E2D\u6587\uFF09*",
  "custom.nameEn": "\u82F1\u6587\u540D\uFF08\u53EF\u9009\uFF09",
  "custom.emoji": "\u56FE\u6807 emoji",
  "custom.description": "\u4E00\u53E5\u8BDD\u7B80\u4ECB*\uFF08\u7F3A\u7B80\u4ECB\u7684\u4E13\u5BB6\u4E0D\u4F1A\u8FDB\u540D\u518C\uFF09",
  "custom.body": "\u4EBA\u683C\u6B63\u6587\uFF08Markdown\uFF09*\uFF1A\u5199\u6E05\u5B83\u662F\u8C01\u3001\u600E\u4E48\u5E72\u6D3B\u3001\u4EA4\u4ED8\u4EC0\u4E48",
  "custom.hint": "\u81EA\u5EFA\u4E13\u5BB6\u5355\u72EC\u5B58\u653E\uFF0C\u4E0E\u968F\u5305\u53D1\u5E03\u7684\u5185\u7F6E\u540D\u518C\u5206\u5F00\u2014\u2014\u5347\u7EA7\u63D2\u4EF6\u4E0D\u4F1A\u8986\u76D6\u5B83\u3002\u5B98\u65B9\u5206\u7C7B\u5C5E\u4E8E\u5305\u5185\u540D\u518C\uFF0C\u81EA\u5EFA\u4E13\u5BB6\u53EA\u80FD\u843D\u5728\u81EA\u5EFA\u5206\u7C7B\u91CC\u3002\u5EFA\u597D\u540E\u8BB0\u5F97\u53BB\u542F\u7528\u5B83\u3002",
  "custom.division": "\u5206\u7C7B",
  "custom.divisionNew": "\uFF0B \u65B0\u5EFA\u5206\u7C7B\u2026",
  "custom.divisionKey": "\u5206\u7C7B\u76EE\u5F55\u540D\uFF08\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u8FDE\u5B57\u7B26\uFF0C\u4EC5 ASCII\uFF09",
  "custom.divisionLabel": "\u5206\u7C7B\u663E\u793A\u540D\uFF08\u53EF\u9009\uFF0C\u4E2D\u6587\uFF09",
  "cat.hint": "\u5206\u7C7B\u662F\u4E13\u5BB6\u7684\u5F52\u7C7B\uFF1A\u5B98\u65B9\u5206\u7C7B\u6765\u81EA\u5185\u7F6E\u540D\u518C\uFF08\u53EA\u8BFB\uFF0C\u540D\u5B57\u8DDF\u968F\u4E0A\u6E38\u4E2D\u6587\uFF09\uFF0C\u81EA\u5EFA\u5206\u7C7B\u53EF\u4EE5\u65B0\u5EFA\u3001\u6539\u540D\u3001\u5220\u9664\u3002\u81EA\u5EFA\u4E13\u5BB6\u80FD\u5F52\u5230\u4EFB\u610F\u5206\u7C7B\uFF08\u542B\u5B98\u65B9\u5206\u7C7B\u540D\uFF09\uFF0C\u4F46\u6587\u4EF6\u59CB\u7EC8\u5199\u5728\u4F60\u81EA\u5DF1\u7684\u6570\u636E\u76EE\u5F55\u91CC\uFF0C\u4E0D\u4F1A\u78B0\u5B98\u65B9\u955C\u50CF\u3002",
  "cat.key": "\u5206\u7C7B\u76EE\u5F55\u540D\uFF08\u5C0F\u5199\u5B57\u6BCD\u3001\u6570\u5B57\u3001\u8FDE\u5B57\u7B26\uFF0C\u4EC5 ASCII\uFF09",
  "cat.label": "\u663E\u793A\u540D\uFF08\u53EF\u9009\uFF0C\u4E2D\u6587\uFF09",
  "cat.create": "\u521B\u5EFA\u5206\u7C7B",
  "cat.mine": "\u81EA\u5EFA\u5206\u7C7B",
  "cat.official": "\u5B98\u65B9\u5206\u7C7B",
  "cat.officialNote": "\u5B98\u65B9\u5206\u7C7B\u7684\u540D\u5B57\u4E0E\u5B58\u4EA1\u90FD\u8DDF\u968F\u540D\u518C\u540C\u6B65\uFF0C\u8FD9\u91CC\u53EA\u8BFB\u3002",
  "cat.empty": "\u8FD8\u6CA1\u6709\u81EA\u5EFA\u5206\u7C7B\uFF1A\u4E0A\u9762\u586B\u76EE\u5F55\u540D\u4E0E\u663E\u793A\u540D\u5373\u53EF\u65B0\u5EFA\u4E00\u4E2A\u3002",
  "cat.officialBadge": "\u5B98\u65B9",
  "cat.customBadge": "\u81EA\u5EFA",
  "cat.count": "{count} \u4F4D\uFF08\u81EA\u5EFA {custom}\uFF09",
  "cat.rename": "\u6539\u540D",
  "cat.save": "\u4FDD\u5B58",
  "cat.delete": "\u5220\u9664",
  "cat.confirmDelete": "\u786E\u8BA4\u5220\u9664",
  "custom.save": "\u4FDD\u5B58",
  "custom.saving": "\u4FDD\u5B58\u4E2D\u2026",
  "custom.cancel": "\u53D6\u6D88",
  "custom.edit": "\u7F16\u8F91",
  "custom.delete": "\u5220\u9664",
  "custom.confirmDelete": "\u786E\u8BA4\u5220\u9664",
  "custom.deleteHint": "\u5220\u9664\u300C{name}\u300D\uFF1F\u53EA\u5220\u8FD9\u4E2A\u81EA\u5EFA\u4E13\u5BB6\u6587\u4EF6\uFF0C\u4E0D\u53EF\u64A4\u9500\u3002",
  "custom.badge": "\u81EA\u5EFA",
  "assets.cloud": "\u914D\u5957\u8D44\u6E90\u5728\u4E91\u7AEF\uFF0C\u70B9\u9009\u6216\u53EC\u5524\u65F6\u4F1A\u81EA\u52A8\u4E0B\u8F7D",
  "custom.loadingBody": "\u6B63\u5728\u8BFB\u53D6\u4EBA\u683C\u6B63\u6587\u2026",
  "pop.title": "T\u4E13\u5BB6",
  // 输入区面板的分类标签行（2026-09-29 用户要求：搜索框下面加一行分类）
  "pop.all": "\u5168\u90E8",
  "pop.divisions": "\u6309\u5206\u7C7B\u7B5B\u9009",
  "pop.divisionsMore": "\u66F4\u591A\u5206\u7C7B",
  "pop.divisionsPrev": "\u524D\u9762\u7684\u5206\u7C7B",
  // 列表过滤与搜索（与官方「自动化任务」页同一套：标签行 + 搜索框）
  // 三档：全部 / 已启用 / 已停用 —— 停用 ≠ 删除（停用的任务保留数据、只是不触发）。
  // 运行时间卡片（对齐官方详情页的「运行时间」：重复 / 时间 / 星期 三行）
  // 周几：键必须**逐行**写、并且在代码里以字面量引用（字典无人引用自检会盯着这一点）。
  /* ---- 技能开关（2026-09-28 从 dsh-plugin-skill-gate 并入）----
     键名统一加 `sg.` 前缀：两套字典现在住在同一个命名空间（t-team）里，不加前缀会与
     专家/分类那边的 settings.* / filter.* 直接撞车。 */
  "sg.settings.meta": "{scope}\uFF1A\u6A21\u578B\u53EF\u89C1 {visible} \xB7 \u5DF2\u5173 {gated} \xB7 \u539F\u751F\u5173\u95ED {native} \xB7 \u5171 {total} \xB7 v{version}",
  "sg.settings.hint": "\u5173\u6389\u7684\u6280\u80FD\u4E0D\u4F1A\u8FDB\u5165\u6BCF\u6B21\u8BF7\u6C42\u7684\u6280\u80FD\u6E05\u5355\uFF0C\u4ECE\u800C\u5C11\u5360\u4E0A\u4E0B\u6587\u3002\u659C\u6760\u83DC\u5355\u91CC\u4ECD\u53EF\u624B\u52A8\u70B9\u3002\u4E0B\u4E00\u8F6E\u5BF9\u8BDD\u751F\u6548\uFF0C\u4E0D\u7528\u91CD\u542F\u3002\u5217\u8868\u662F\u5404\u6765\u6E90\u7684\u5E76\u96C6\uFF1B\u5207\u6362\u89C6\u89D2\u53EF\u770B\u67D0\u4E2A\u4F1A\u8BDD\u6216\u9ED8\u8BA4 preset \u5B9E\u9645\u8BFB\u5230\u54EA\u4E9B\u6280\u80FD\u3002",
  "sg.settings.search": "\u641C\u7D22\u6280\u80FD\u540D\u6216\u7B80\u4ECB",
  "sg.filter.all": "\u5168\u90E8",
  "sg.filter.on": "\u6A21\u578B\u53EF\u89C1",
  "sg.filter.off": "\u5DF2\u5173\u95ED",
  "sg.filter.native": "\u539F\u751F\u5173\u95ED",
  "sg.filter.source": "\u6765\u6E90",
  "sg.filter.status": "\u72B6\u6001",
  "sg.settings.unavailable": "\u6280\u80FD\u5F00\u5173\u670D\u52A1\u4E0D\u53EF\u7528\uFF1A\u5BBF\u4E3B\u6CA1\u6302\u4E0A skillGate \u8FDC\u7A0B\u670D\u52A1\uFF08\u91CD\u542F DSH \u540E\u4ECD\u672A\u51FA\u73B0\u7684\u8BDD\uFF0C\u68C0\u67E5\u63D2\u4EF6\u662F\u5426\u52A0\u8F7D\u6210\u529F\uFF09\u3002",
  "sg.filter.view": "\u89C6\u89D2",
  "sg.filter.allSources": "\u5168\u90E8\u6765\u6E90",
  "sg.view.all": "\u5168\u90E8\u6765\u6E90\uFF08\u5E76\u96C6\uFF09",
  "sg.view.host": "\u5BBF\u4E3B\u5168\u5C40\u5C42",
  "sg.view.preset": "\u9ED8\u8BA4 preset \xB7 {name}",
  "sg.view.agent": "\u4F1A\u8BDD \xB7 {name}",
  "sg.view.disk": "\u78C1\u76D8\u626B\u63CF\uFF08~/.dsh/skills \u4E0E ~/.agents/skills\uFF09",
  "sg.view.option": "{label}\uFF08{visible}/{total}\uFF09",
  "sg.source.user-dsh": "\u7528\u6237\u6280\u80FD\uFF08~/.dsh/skills\uFF09",
  "sg.source.user-agents": "\u7528\u6237\u6280\u80FD\uFF08~/.agents\uFF09",
  "sg.source.bundled": "\u968F\u5305\u6280\u80FD",
  "sg.source.project-dsh": "\u9879\u76EE .dsh",
  "sg.source.project-agents": "\u9879\u76EE .agents",
  "sg.source.custom": "\u81EA\u5B9A\u4E49\u76EE\u5F55",
  "sg.source.runtime": "\u8FD0\u884C\u65F6",
  "sg.source.unknown": "\u672A\u77E5\u6765\u6E90",
  "sg.actions.enableFiltered": "\u542F\u7528\u5F53\u524D\u7B5B\u9009",
  "sg.actions.disableFiltered": "\u505C\u7528\u5F53\u524D\u7B5B\u9009",
  "sg.actions.needSearch": "\u5148\u5728\u641C\u7D22\u6846\u8F93\u5165\u5173\u952E\u8BCD\uFF0C\u624D\u80FD\u6279\u91CF\u542F\u7528\u6216\u505C\u7528\u5F53\u524D\u7ED3\u679C\u3002",
  "sg.settings.filterCount": "\u5F53\u524D\u5217\u51FA {shown}\uFF08{groups} \u7EC4\uFF09",
  "sg.settings.empty": "\u6CA1\u6709\u5339\u914D\u7684\u6280\u80FD\u3002",
  "sg.settings.loading": "\u6B63\u5728\u8BFB\u53D6\u6280\u80FD\u6E05\u5355\u2026",
  "sg.settings.retry": "\u91CD\u8BD5",
  "sg.settings.loadFailed": "\u8BFB\u53D6\u5931\u8D25\uFF1A{detail}",
  "sg.settings.saveFailed": "\u4FDD\u5B58\u5931\u8D25\uFF1A{detail}",
  "sg.settings.conflict": "\u8BBE\u7F6E\u5DF2\u88AB\u5176\u4ED6\u7A97\u53E3\u4FEE\u6539\uFF0C\u5DF2\u91CD\u65B0\u8BFB\u53D6\uFF0C\u8BF7\u91CD\u8BD5\u3002",
  "sg.settings.nativeOff": "\u6280\u80FD\u6587\u4EF6\u91CC\u5DF2\u58F0\u660E disable-model-invocation\uFF0C\u4E0D\u80FD\u7528\u672C\u63D2\u4EF6\u6253\u5F00\u3002"
};
var en = {
  "settings.title": "T Expert",
  "settings.summary": "Expert roster (323 experts \xB7 22 divisions), category management and @ summoning",
  "group.expandAll": "Expand all",
  "group.collapseAll": "Collapse all",
  "group.toggle": "Expand or collapse \u201C{name}\u201D",
  "settings.loading": "Loading roster\u2026",
  "settings.retry": "Retry",
  "settings.search": "Search expert name or description",
  "filter.division": "Division",
  "filter.allDivisions": "All divisions",
  "filter.clear": "Clear filters",
  "filter.summary": "Showing {shown} / {total}",
  "settings.enabledCount": "{total} experts",
  "settings.empty": "No matching expert.",
  "settings.conflict": "Name conflict \u2014 cannot be summoned",
  "card.prompt": "View prompt",
  "card.promptTitle": "{name} \xB7 prompt",
  "card.promptLoading": "Loading prompt\u2026",
  "card.promptFailed": "Failed to load prompt: {detail}",
  "card.promptEmpty": "This expert has no prompt body to show.",
  "card.close": "Close",
  "card.copy": "Copy",
  "card.copied": "Copied",
  "card.copyFailed": "Copy failed",
  "settings.saveFailed": "Save failed: {detail}",
  "settings.loadFailed": "Failed to load roster: {detail}",
  "settings.conflictRetry": "Settings changed elsewhere; roster reloaded, please retry.",
  "settings.crashed": "This section failed to render: {detail}. Switch tabs and back to retry.",
  "error.remoteUnavailable": "T Expert remote service is unavailable (host plugin not loaded or already disposed)",
  "trigger.removed": "@Removed expert (please reselect)",
  "button.label": "T Expert",
  "button.title": "Open the T Expert roster and insert a reference",
  "button.empty": "No expert enabled yet \u2014 enable some in Settings \u2192 T Expert",
  "button.noMatch": "No matching expert",
  "button.insertFailed": "Insert failed, please retry",
  "button.close": "Close",
  "trigger.group": "T Expert \xB7 {division}",
  "tab.experts": "Experts",
  "tab.categories": "Divisions",
  "tab.skills": "Skills",
  "tab.count": "(\xB7{count})",
  "pop.skillSearch": "Search skill name or description",
  "pop.skillEmpty": "No skills available yet.",
  "pop.skillNoMatch": "No matching skill.",
  "pop.skillUserOnly": "user-only",
  "roster.expertsHint": "The roster: experts available for @-mention. Custom ones can be edited or deleted here.",
  // Roster health (from the snapshot's `sidecar` field). All three fail silently:
  // missing sidecar → the whole roster falls back to English; skipped files → experts
  // simply absent; unreadable division → that category never shows up.
  "roster.sidecarMissing": "Chinese sidecar not found ({path}): the roster falls back to English names.",
  "roster.skippedFiles": "{count} expert file(s) were skipped due to format problems and are missing from the roster.",
  "roster.unreadableDivisions": "These division directories could not be read: {list}.",
  "custom.new": "\uFF0B New expert",
  "custom.titleNew": "New expert",
  "custom.titleEdit": "Edit \u201C{name}\u201D",
  "custom.slug": "slug (file name: lowercase letters, digits, hyphen)",
  "custom.name": "Name (Chinese)*",
  "custom.nameEn": "English name (optional)",
  "custom.emoji": "Emoji",
  "custom.description": "One-line description* (without it the expert never enters the roster)",
  "custom.body": "Persona body (Markdown)*: who it is, how it works, what it delivers",
  "custom.hint": "Custom experts live in their own directory, kept apart from the bundled roster \u2014 upgrades never overwrite them. Official divisions belong to that bundled roster, so custom experts can only live in custom divisions. Remember to enable them afterwards.",
  "custom.division": "Division",
  "custom.divisionNew": "\uFF0B New division\u2026",
  "custom.divisionKey": "Division directory name (lowercase ASCII letters, digits, hyphen)",
  "custom.divisionLabel": "Division display name (optional)",
  "cat.hint": "A division groups experts: the official ones come from the built-in roster (read-only, names follow upstream Chinese), while custom ones can be created, renamed and deleted. A custom expert can be filed under any division (including an official name), but its file always lives in your own data directory \u2014 the built-in mirror is never touched.",
  "cat.key": "Division directory name (lowercase ASCII letters, digits, hyphen)",
  "cat.label": "Display name (optional)",
  "cat.create": "Create division",
  "cat.mine": "Custom divisions",
  "cat.official": "Official divisions",
  "cat.officialNote": "Official divisions follow the roster sync \u2014 their names and existence are read-only here.",
  "cat.empty": "No custom division yet: fill in a directory name and a display name above to create one.",
  "cat.officialBadge": "Official",
  "cat.customBadge": "Custom",
  "cat.count": "{count} ({custom} custom)",
  "cat.rename": "Rename",
  "cat.save": "Save",
  "cat.delete": "Delete",
  "cat.confirmDelete": "Confirm delete",
  "custom.save": "Save",
  "custom.saving": "Saving\u2026",
  "custom.cancel": "Cancel",
  "custom.edit": "Edit",
  "custom.delete": "Delete",
  "custom.confirmDelete": "Confirm delete",
  "custom.deleteHint": "Delete \u201C{name}\u201D? Only this custom expert file is removed; this cannot be undone.",
  "custom.badge": "Custom",
  "assets.cloud": "Companion assets live in the cloud; they download automatically when picked or summoned",
  "custom.loadingBody": "Loading persona body\u2026",
  "pop.title": "T Expert",
  // Division filter row inside the composer panel (2026-09-29).
  "pop.all": "All",
  "pop.divisions": "Filter by division",
  "pop.divisionsMore": "More divisions",
  "pop.divisionsPrev": "Previous divisions",
  // List filter and search (same shape as the built-in Automation page: tab row + search field).
  // Three lanes: All / Active / Disabled — disabled keeps its data and simply never fires.
  // Run-time card (mirrors the built-in page's "Run time": repeat / time / weekday rows)
  "sg.settings.meta": "{scope}: visible {visible} \xB7 gated {gated} \xB7 native-off {native} \xB7 total {total} \xB7 v{version}",
  "sg.settings.hint": "Off skills leave the per-request catalog (saving context). They stay in the slash menu. Takes effect on the next model turn, no restart. The list is the union of every source; switch views to see what one session or the default preset actually reads.",
  "sg.settings.search": "Search skill name or description",
  "sg.filter.all": "All",
  "sg.filter.on": "Visible",
  "sg.filter.off": "Gated",
  "sg.filter.native": "Natively off",
  "sg.filter.source": "Source",
  "sg.filter.status": "Status",
  "sg.settings.unavailable": "Skill gate service unavailable: the skillGate remote is not mounted (if it persists after restarting DSH, check that the plugin loaded).",
  "sg.filter.view": "View",
  "sg.filter.allSources": "All sources",
  "sg.view.all": "All sources (union)",
  "sg.view.host": "Host layer",
  "sg.view.preset": "Default preset \xB7 {name}",
  "sg.view.agent": "Session \xB7 {name}",
  "sg.view.disk": "Disk scan (~/.dsh/skills and ~/.agents/skills)",
  "sg.view.option": "{label} ({visible}/{total})",
  "sg.source.user-dsh": "User skills (~/.dsh/skills)",
  "sg.source.user-agents": "User skills (~/.agents)",
  "sg.source.bundled": "Bundled",
  "sg.source.project-dsh": "Project .dsh",
  "sg.source.project-agents": "Project .agents",
  "sg.source.custom": "Custom dirs",
  "sg.source.runtime": "Runtime",
  "sg.source.unknown": "Unknown source",
  "sg.actions.enableFiltered": "Enable filtered",
  "sg.actions.disableFiltered": "Disable filtered",
  "sg.actions.needSearch": "Type a search query first to enable or disable the filtered results.",
  "sg.settings.filterCount": "Showing {shown} ({groups} groups)",
  "sg.settings.empty": "No matching skills.",
  "sg.settings.loading": "Loading skills\u2026",
  "sg.settings.retry": "Retry",
  "sg.settings.loadFailed": "Failed to load: {detail}",
  "sg.settings.saveFailed": "Failed to save: {detail}",
  "sg.settings.conflict": "Updated in another window; reloaded. Please retry.",
  "sg.settings.nativeOff": "This skill already sets disable-model-invocation and cannot be turned on here."
};

// src/client/insert.js
function resolveInputTarget(ctx, sessionId) {
  const sessions = ctx.sessions;
  const targetSessionId = sessionId ?? sessions?.list?.getSnapshot?.().current;
  if (targetSessionId === void 0 || targetSessionId === null) return void 0;
  const actx = sessions?.scope?.(targetSessionId) ?? sessions?.binding?.(targetSessionId)?.ctx;
  if (actx === void 0) return void 0;
  return actx.get?.("conversation")?.input?.for?.(actx);
}
function referencePrefixEnd(snapshot) {
  const offsets = new Set((snapshot.occurrences ?? []).map((occurrence) => occurrence.offset));
  let end = 0;
  while (offsets.has(end)) {
    end += 1;
    if (snapshot.draft[end] === " ") end += 1;
  }
  while (snapshot.draft[end] === "\uFFFC") {
    end += 1;
    if (snapshot.draft[end] === " ") end += 1;
  }
  return end;
}
var skillsCache = /* @__PURE__ */ new Map();
var SKILLS_CACHE_MAX = 20;
function cacheSkills(sessionId, list) {
  if (skillsCache.has(sessionId)) skillsCache.delete(sessionId);
  skillsCache.set(sessionId, list);
  while (skillsCache.size > SKILLS_CACHE_MAX) {
    const oldest = skillsCache.keys().next().value;
    skillsCache.delete(oldest);
  }
}
function insertSkillHint(target, text) {
  if (target === void 0 || typeof target.insertText !== "function") return false;
  const snapshot = target.state.getSnapshot();
  const draft = String(snapshot.draft ?? "");
  const prefix = draft === "" || /\s$/u.test(draft) ? "" : " ";
  const at = draft.length;
  return target.insertText(`${prefix}${text} `, { start: at, end: at, draftRev: snapshot.draftRev }) === true;
}
function insertAtTarget(target, reference) {
  if (target === void 0 || typeof target.insertReference !== "function") return false;
  const snapshot = target.state.getSnapshot();
  const offset = referencePrefixEnd(snapshot);
  return target.insertReference(reference, { start: offset, end: offset, draftRev: snapshot.draftRev }) === true;
}

// node_modules/zod/v4/classic/external.js
var external_exports = {};
__export(external_exports, {
  $brand: () => $brand,
  $input: () => $input,
  $output: () => $output,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  TimePrecision: () => TimePrecision,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBase64: () => ZodBase64,
  ZodBase64URL: () => ZodBase64URL,
  ZodBigInt: () => ZodBigInt,
  ZodBigIntFormat: () => ZodBigIntFormat,
  ZodBoolean: () => ZodBoolean,
  ZodCIDRv4: () => ZodCIDRv4,
  ZodCIDRv6: () => ZodCIDRv6,
  ZodCUID: () => ZodCUID,
  ZodCUID2: () => ZodCUID2,
  ZodCatch: () => ZodCatch,
  ZodCodec: () => ZodCodec,
  ZodCompileAsyncError: () => ZodCompileAsyncError,
  ZodCompileUnsupportedError: () => ZodCompileUnsupportedError,
  ZodCreditCard: () => ZodCreditCard,
  ZodCustom: () => ZodCustom,
  ZodCustomStringFormat: () => ZodCustomStringFormat,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodE164: () => ZodE164,
  ZodEmail: () => ZodEmail,
  ZodEmoji: () => ZodEmoji,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodExactOptional: () => ZodExactOptional,
  ZodFile: () => ZodFile,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodGUID: () => ZodGUID,
  ZodIBAN: () => ZodIBAN,
  ZodIPv4: () => ZodIPv4,
  ZodIPv6: () => ZodIPv6,
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  ZodInstanceOf: () => ZodInstanceOf,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodJWT: () => ZodJWT,
  ZodKSUID: () => ZodKSUID,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMAC: () => ZodMAC,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNanoID: () => ZodNanoID,
  ZodNever: () => ZodNever,
  ZodNonOptional: () => ZodNonOptional,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodNumberFormat: () => ZodNumberFormat,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodPipe: () => ZodPipe,
  ZodPrefault: () => ZodPrefault,
  ZodPreprocess: () => ZodPreprocess,
  ZodPromise: () => ZodPromise,
  ZodProperties: () => ZodProperties,
  ZodReadonly: () => ZodReadonly,
  ZodRealError: () => ZodRealError,
  ZodRecord: () => ZodRecord,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodStringFormat: () => ZodStringFormat,
  ZodSuccess: () => ZodSuccess,
  ZodSymbol: () => ZodSymbol,
  ZodTemplateLiteral: () => ZodTemplateLiteral,
  ZodTransform: () => ZodTransform,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodULID: () => ZodULID,
  ZodURL: () => ZodURL,
  ZodUUID: () => ZodUUID,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  ZodXID: () => ZodXID,
  ZodXor: () => ZodXor,
  _ZodString: () => _ZodString,
  _default: () => _default2,
  _function: () => _function,
  any: () => any,
  array: () => array,
  base64: () => base642,
  base64url: () => base64url2,
  bigint: () => bigint2,
  boolean: () => boolean2,
  catch: () => _catch2,
  check: () => check,
  cidrv4: () => cidrv42,
  cidrv6: () => cidrv62,
  clone: () => clone,
  codec: () => codec,
  coerce: () => coerce_exports,
  compile: () => compile,
  config: () => config,
  core: () => core_exports2,
  creditCard: () => creditCard2,
  cuid: () => cuid3,
  cuid2: () => cuid22,
  custom: () => custom,
  date: () => date2,
  decode: () => decode2,
  decodeAsync: () => decodeAsync2,
  deepPartial: () => deepPartial,
  describe: () => describe2,
  discriminatedUnion: () => discriminatedUnion,
  e164: () => e1642,
  email: () => email2,
  emoji: () => emoji2,
  encode: () => encode2,
  encodeAsync: () => encodeAsync2,
  endsWith: () => _endsWith,
  enum: () => _enum2,
  exactOptional: () => exactOptional,
  file: () => file,
  flattenError: () => flattenError,
  float32: () => float32,
  float64: () => float64,
  formatError: () => formatError,
  fromJSONSchema: () => fromJSONSchema,
  function: () => _function,
  getDiscriminatedOption: () => getDiscriminatedOption,
  getErrorMap: () => getErrorMap,
  globalRegistry: () => globalRegistry,
  gt: () => _gt,
  gte: () => _gte,
  guid: () => guid2,
  hash: () => hash,
  hex: () => hex2,
  hostname: () => hostname2,
  httpUrl: () => httpUrl,
  iban: () => iban2,
  includes: () => _includes,
  input: () => input,
  instanceof: () => _instanceof,
  int: () => int,
  int32: () => int32,
  int64: () => int64,
  intersection: () => intersection,
  invertCodec: () => invertCodec,
  ipv4: () => ipv42,
  ipv6: () => ipv62,
  iso: () => iso_exports,
  json: () => json,
  jwt: () => jwt,
  keyof: () => keyof,
  ksuid: () => ksuid2,
  lazy: () => lazy,
  length: () => _length,
  literal: () => literal,
  locales: () => locales_exports,
  looseObject: () => looseObject,
  looseRecord: () => looseRecord,
  lowercase: () => _lowercase,
  lt: () => _lt,
  lte: () => _lte,
  mac: () => mac2,
  map: () => map,
  maxLength: () => _maxLength,
  maxSize: () => _maxSize,
  memoizer: () => memoizer,
  meta: () => meta2,
  mime: () => _mime,
  minLength: () => _minLength,
  minSize: () => _minSize,
  multipleOf: () => _multipleOf,
  nan: () => nan,
  nanoid: () => nanoid2,
  nativeEnum: () => nativeEnum,
  negative: () => _negative,
  never: () => never,
  nonnegative: () => _nonnegative,
  nonoptional: () => nonoptional,
  nonpositive: () => _nonpositive,
  normalize: () => _normalize,
  null: () => _null3,
  nullable: () => nullable,
  nullish: () => nullish2,
  number: () => number2,
  object: () => object,
  optional: () => optional,
  output: () => output,
  overwrite: () => _overwrite,
  parse: () => parse2,
  parseAsync: () => parseAsync2,
  partialRecord: () => partialRecord,
  pipe: () => pipe,
  positive: () => _positive,
  prefault: () => prefault,
  preprocess: () => preprocess,
  prettifyError: () => prettifyError,
  promise: () => promise,
  properties: () => properties,
  property: () => _property,
  readonly: () => readonly,
  record: () => record,
  refine: () => refine,
  regex: () => _regex,
  regexes: () => regexes_exports,
  registry: () => registry,
  safeDecode: () => safeDecode2,
  safeDecodeAsync: () => safeDecodeAsync2,
  safeEncode: () => safeEncode2,
  safeEncodeAsync: () => safeEncodeAsync2,
  safeParse: () => safeParse2,
  safeParseAsync: () => safeParseAsync2,
  set: () => set,
  setErrorMap: () => setErrorMap,
  size: () => _size,
  slugify: () => _slugify,
  startsWith: () => _startsWith,
  strictObject: () => strictObject,
  string: () => string2,
  stringFormat: () => stringFormat,
  stringbool: () => stringbool,
  success: () => success,
  superRefine: () => superRefine,
  symbol: () => symbol,
  templateLiteral: () => templateLiteral,
  toJSONSchema: () => toJSONSchema,
  toLowerCase: () => _toLowerCase,
  toUpperCase: () => _toUpperCase,
  toZod: () => toZod,
  transform: () => transform,
  treeifyError: () => treeifyError,
  trim: () => _trim,
  tuple: () => tuple,
  uint32: () => uint32,
  uint64: () => uint64,
  ulid: () => ulid2,
  undefined: () => _undefined3,
  union: () => union,
  unknown: () => unknown,
  uppercase: () => _uppercase,
  url: () => url,
  util: () => util_exports,
  uuid: () => uuid2,
  uuidv4: () => uuidv4,
  uuidv6: () => uuidv6,
  uuidv7: () => uuidv7,
  validate: () => validate,
  validateAsync: () => validateAsync,
  void: () => _void2,
  withParser: () => withParser,
  xid: () => xid2,
  xor: () => xor
});

// node_modules/zod/v4/core/index.js
var core_exports2 = {};
__export(core_exports2, {
  $ZodAny: () => $ZodAny,
  $ZodArray: () => $ZodArray,
  $ZodAsyncError: () => $ZodAsyncError,
  $ZodBase64: () => $ZodBase64,
  $ZodBase64URL: () => $ZodBase64URL,
  $ZodBigInt: () => $ZodBigInt,
  $ZodBigIntFormat: () => $ZodBigIntFormat,
  $ZodBoolean: () => $ZodBoolean,
  $ZodCIDRv4: () => $ZodCIDRv4,
  $ZodCIDRv6: () => $ZodCIDRv6,
  $ZodCUID: () => $ZodCUID,
  $ZodCUID2: () => $ZodCUID2,
  $ZodCatch: () => $ZodCatch,
  $ZodCheck: () => $ZodCheck,
  $ZodCheckBigIntFormat: () => $ZodCheckBigIntFormat,
  $ZodCheckEndsWith: () => $ZodCheckEndsWith,
  $ZodCheckGreaterThan: () => $ZodCheckGreaterThan,
  $ZodCheckIncludes: () => $ZodCheckIncludes,
  $ZodCheckLengthEquals: () => $ZodCheckLengthEquals,
  $ZodCheckLessThan: () => $ZodCheckLessThan,
  $ZodCheckLowerCase: () => $ZodCheckLowerCase,
  $ZodCheckMaxLength: () => $ZodCheckMaxLength,
  $ZodCheckMaxSize: () => $ZodCheckMaxSize,
  $ZodCheckMimeType: () => $ZodCheckMimeType,
  $ZodCheckMinLength: () => $ZodCheckMinLength,
  $ZodCheckMinSize: () => $ZodCheckMinSize,
  $ZodCheckMultipleOf: () => $ZodCheckMultipleOf,
  $ZodCheckNumberFormat: () => $ZodCheckNumberFormat,
  $ZodCheckOverwrite: () => $ZodCheckOverwrite,
  $ZodCheckProperty: () => $ZodCheckProperty,
  $ZodCheckRegex: () => $ZodCheckRegex,
  $ZodCheckSizeEquals: () => $ZodCheckSizeEquals,
  $ZodCheckStartsWith: () => $ZodCheckStartsWith,
  $ZodCheckStringFormat: () => $ZodCheckStringFormat,
  $ZodCheckUpperCase: () => $ZodCheckUpperCase,
  $ZodCodec: () => $ZodCodec,
  $ZodCreditCard: () => $ZodCreditCard,
  $ZodCustom: () => $ZodCustom,
  $ZodCustomStringFormat: () => $ZodCustomStringFormat,
  $ZodCyclicError: () => $ZodCyclicError,
  $ZodDate: () => $ZodDate,
  $ZodDefault: () => $ZodDefault,
  $ZodDiscriminatedUnion: () => $ZodDiscriminatedUnion,
  $ZodE164: () => $ZodE164,
  $ZodEmail: () => $ZodEmail,
  $ZodEmoji: () => $ZodEmoji,
  $ZodEncodeError: () => $ZodEncodeError,
  $ZodEnum: () => $ZodEnum,
  $ZodError: () => $ZodError,
  $ZodExactOptional: () => $ZodExactOptional,
  $ZodFile: () => $ZodFile,
  $ZodFunction: () => $ZodFunction,
  $ZodGUID: () => $ZodGUID,
  $ZodIBAN: () => $ZodIBAN,
  $ZodIPv4: () => $ZodIPv4,
  $ZodIPv6: () => $ZodIPv6,
  $ZodISODate: () => $ZodISODate,
  $ZodISODateTime: () => $ZodISODateTime,
  $ZodISODuration: () => $ZodISODuration,
  $ZodISOTime: () => $ZodISOTime,
  $ZodIntersection: () => $ZodIntersection,
  $ZodJWT: () => $ZodJWT,
  $ZodKSUID: () => $ZodKSUID,
  $ZodLazy: () => $ZodLazy,
  $ZodLiteral: () => $ZodLiteral,
  $ZodMAC: () => $ZodMAC,
  $ZodMap: () => $ZodMap,
  $ZodNaN: () => $ZodNaN,
  $ZodNanoID: () => $ZodNanoID,
  $ZodNever: () => $ZodNever,
  $ZodNonOptional: () => $ZodNonOptional,
  $ZodNull: () => $ZodNull,
  $ZodNullable: () => $ZodNullable,
  $ZodNumber: () => $ZodNumber,
  $ZodNumberFormat: () => $ZodNumberFormat,
  $ZodObject: () => $ZodObject,
  $ZodObjectJIT: () => $ZodObjectJIT,
  $ZodOptional: () => $ZodOptional,
  $ZodPipe: () => $ZodPipe,
  $ZodPrefault: () => $ZodPrefault,
  $ZodPreprocess: () => $ZodPreprocess,
  $ZodPromise: () => $ZodPromise,
  $ZodProperties: () => $ZodProperties,
  $ZodReadonly: () => $ZodReadonly,
  $ZodRealError: () => $ZodRealError,
  $ZodRecord: () => $ZodRecord,
  $ZodRegistry: () => $ZodRegistry,
  $ZodSet: () => $ZodSet,
  $ZodString: () => $ZodString,
  $ZodStringFormat: () => $ZodStringFormat,
  $ZodSuccess: () => $ZodSuccess,
  $ZodSymbol: () => $ZodSymbol,
  $ZodTemplateLiteral: () => $ZodTemplateLiteral,
  $ZodTransform: () => $ZodTransform,
  $ZodTuple: () => $ZodTuple,
  $ZodType: () => $ZodType,
  $ZodULID: () => $ZodULID,
  $ZodURL: () => $ZodURL,
  $ZodUUID: () => $ZodUUID,
  $ZodUndefined: () => $ZodUndefined,
  $ZodUnion: () => $ZodUnion,
  $ZodUnknown: () => $ZodUnknown,
  $ZodVoid: () => $ZodVoid,
  $ZodXID: () => $ZodXID,
  $ZodXor: () => $ZodXor,
  $brand: () => $brand,
  $constructor: () => $constructor,
  $input: () => $input,
  $output: () => $output,
  Doc: () => Doc,
  INVALID: () => INVALID,
  JSONSchema: () => json_schema_exports,
  JSONSchemaGenerator: () => JSONSchemaGenerator,
  NEVER: () => NEVER,
  TimePrecision: () => TimePrecision,
  URL_BAD_FORMAT: () => URL_BAD_FORMAT,
  URL_UNPARSEABLE: () => URL_UNPARSEABLE,
  ZodCompileAsyncError: () => ZodCompileAsyncError,
  ZodCompileUnsupportedError: () => ZodCompileUnsupportedError,
  _any: () => _any,
  _array: () => _array,
  _base64: () => _base64,
  _base64url: () => _base64url,
  _bigint: () => _bigint,
  _boolean: () => _boolean,
  _catch: () => _catch,
  _check: () => _check,
  _cidrv4: () => _cidrv4,
  _cidrv6: () => _cidrv6,
  _coercedBigint: () => _coercedBigint,
  _coercedBoolean: () => _coercedBoolean,
  _coercedDate: () => _coercedDate,
  _coercedNumber: () => _coercedNumber,
  _coercedString: () => _coercedString,
  _creditCard: () => _creditCard,
  _cuid: () => _cuid,
  _cuid2: () => _cuid2,
  _custom: () => _custom,
  _date: () => _date,
  _decode: () => _decode,
  _decodeAsync: () => _decodeAsync,
  _default: () => _default,
  _discriminatedUnion: () => _discriminatedUnion,
  _e164: () => _e164,
  _email: () => _email,
  _emoji: () => _emoji2,
  _encode: () => _encode,
  _encodeAsync: () => _encodeAsync,
  _endsWith: () => _endsWith,
  _enum: () => _enum,
  _file: () => _file,
  _float32: () => _float32,
  _float64: () => _float64,
  _gt: () => _gt,
  _gte: () => _gte,
  _guid: () => _guid,
  _iban: () => _iban,
  _includes: () => _includes,
  _int: () => _int,
  _int32: () => _int32,
  _int64: () => _int64,
  _intersection: () => _intersection,
  _ipv4: () => _ipv4,
  _ipv6: () => _ipv6,
  _isoDate: () => _isoDate,
  _isoDateTime: () => _isoDateTime,
  _isoDuration: () => _isoDuration,
  _isoTime: () => _isoTime,
  _jwt: () => _jwt,
  _ksuid: () => _ksuid,
  _lazy: () => _lazy,
  _length: () => _length,
  _literal: () => _literal,
  _lowercase: () => _lowercase,
  _lt: () => _lt,
  _lte: () => _lte,
  _mac: () => _mac,
  _map: () => _map,
  _max: () => _lte,
  _maxLength: () => _maxLength,
  _maxSize: () => _maxSize,
  _mime: () => _mime,
  _min: () => _gte,
  _minLength: () => _minLength,
  _minSize: () => _minSize,
  _multipleOf: () => _multipleOf,
  _nan: () => _nan,
  _nanoid: () => _nanoid,
  _nativeEnum: () => _nativeEnum,
  _negative: () => _negative,
  _never: () => _never,
  _nonnegative: () => _nonnegative,
  _nonoptional: () => _nonoptional,
  _nonpositive: () => _nonpositive,
  _normalize: () => _normalize,
  _null: () => _null2,
  _nullable: () => _nullable,
  _number: () => _number,
  _optional: () => _optional,
  _overwrite: () => _overwrite,
  _parse: () => _parse,
  _parseAsync: () => _parseAsync,
  _pipe: () => _pipe,
  _positive: () => _positive,
  _promise: () => _promise,
  _properties: () => _properties,
  _property: () => _property,
  _readonly: () => _readonly,
  _record: () => _record,
  _refine: () => _refine,
  _regex: () => _regex,
  _safeDecode: () => _safeDecode,
  _safeDecodeAsync: () => _safeDecodeAsync,
  _safeEncode: () => _safeEncode,
  _safeEncodeAsync: () => _safeEncodeAsync,
  _safeParse: () => _safeParse,
  _safeParseAsync: () => _safeParseAsync,
  _set: () => _set,
  _size: () => _size,
  _slugify: () => _slugify,
  _startsWith: () => _startsWith,
  _string: () => _string,
  _stringFormat: () => _stringFormat,
  _stringbool: () => _stringbool,
  _success: () => _success,
  _superRefine: () => _superRefine,
  _symbol: () => _symbol,
  _templateLiteral: () => _templateLiteral,
  _toLowerCase: () => _toLowerCase,
  _toUpperCase: () => _toUpperCase,
  _transform: () => _transform,
  _trim: () => _trim,
  _tuple: () => _tuple,
  _uint32: () => _uint32,
  _uint64: () => _uint64,
  _ulid: () => _ulid,
  _undefined: () => _undefined2,
  _union: () => _union,
  _unknown: () => _unknown,
  _uppercase: () => _uppercase,
  _url: () => _url,
  _uuid: () => _uuid,
  _uuidv4: () => _uuidv4,
  _uuidv6: () => _uuidv6,
  _uuidv7: () => _uuidv7,
  _void: () => _void,
  _xid: () => _xid,
  _xor: () => _xor,
  base64Charset: () => base64Charset,
  base64urlCharset: () => base64urlCharset,
  clone: () => clone,
  compile: () => compile,
  compileFn: () => compileFn,
  config: () => config,
  createStandardJSONSchemaMethod: () => createStandardJSONSchemaMethod,
  createToJSONSchemaMethod: () => createToJSONSchemaMethod,
  decode: () => decode,
  decodeAsync: () => decodeAsync,
  describe: () => describe,
  encode: () => encode,
  encodeAsync: () => encodeAsync,
  extractDefs: () => extractDefs,
  finalize: () => finalize,
  flattenError: () => flattenError,
  formatError: () => formatError,
  getDiscriminatedOption: () => getDiscriminatedOption,
  globalConfig: () => globalConfig,
  globalRegistry: () => globalRegistry,
  handleUnrepresentable: () => handleUnrepresentable,
  initializeContext: () => initializeContext,
  isBackEdge: () => isBackEdge,
  isRecursiveSchema: () => isRecursiveSchema,
  isTransforming: () => isTransforming,
  isValidBase64: () => isValidBase64,
  isValidBase64URL: () => isValidBase64URL,
  isValidCIDRv6: () => isValidCIDRv6,
  isValidCreditCard: () => isValidCreditCard,
  isValidIBAN: () => isValidIBAN,
  isValidIPv6: () => isValidIPv6,
  isValidJWT: () => isValidJWT,
  locales: () => locales_exports,
  memoizer: () => memoizer,
  mergeValues: () => mergeValues,
  meta: () => meta,
  parse: () => parse,
  parseAsync: () => parseAsync,
  parseURLObject: () => parseURLObject,
  prettifyError: () => prettifyError,
  process: () => processSchema,
  processSchema: () => processSchema,
  regexes: () => regexes_exports,
  registry: () => registry,
  safeDecode: () => safeDecode,
  safeDecodeAsync: () => safeDecodeAsync,
  safeEncode: () => safeEncode,
  safeEncodeAsync: () => safeEncodeAsync,
  safeParse: () => safeParse,
  safeParseAsync: () => safeParseAsync,
  standardProps: () => standardProps,
  stripTabAndNewline: () => stripTabAndNewline,
  toDotPath: () => toDotPath,
  toJSONSchema: () => toJSONSchema,
  toZod: () => toZod,
  treeifyError: () => treeifyError,
  urlHostnameOk: () => urlHostnameOk,
  urlProtocolOk: () => urlProtocolOk,
  util: () => util_exports,
  validate: () => validate,
  validateAsync: () => validateAsync,
  version: () => version,
  withParser: () => withParser
});

// node_modules/zod/v4/core/util.js
var util_exports = {};
__export(util_exports, {
  BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
  CONSTANT_CATCH: () => CONSTANT_CATCH,
  Class: () => Class,
  NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
  aborted: () => aborted,
  allowsEval: () => allowsEval,
  assert: () => assert,
  assertEqual: () => assertEqual,
  assertIs: () => assertIs,
  assertNever: () => assertNever,
  assertNotEqual: () => assertNotEqual,
  assignProp: () => assignProp,
  attachSchema: () => attachSchema,
  base64ToUint8Array: () => base64ToUint8Array,
  base64urlToUint8Array: () => base64urlToUint8Array,
  cached: () => cached,
  captureStackTrace: () => captureStackTrace,
  cleanEnum: () => cleanEnum,
  cleanRegex: () => cleanRegex,
  clone: () => clone,
  cloneDef: () => cloneDef,
  codePointLength: () => codePointLength,
  constantCatch: () => constantCatch,
  createTransparentProxy: () => createTransparentProxy,
  defineLazy: () => defineLazy,
  defineLazyInternal: () => defineLazyInternal,
  derived: () => derived,
  esc: () => esc,
  escapeRegex: () => escapeRegex,
  explicitlyAborted: () => explicitlyAborted,
  extend: () => extend,
  finalizeIssue: () => finalizeIssue,
  floatSafeRemainder: () => floatSafeRemainder,
  getElementAtPath: () => getElementAtPath,
  getEnumValues: () => getEnumValues,
  getLengthableOrigin: () => getLengthableOrigin,
  getParsedType: () => getParsedType,
  getSizableOrigin: () => getSizableOrigin,
  hexToUint8Array: () => hexToUint8Array,
  hide: () => hide,
  installLazyProp: () => installLazyProp,
  isObject: () => isObject,
  isPlainObject: () => isPlainObject,
  issue: () => issue,
  joinValues: () => joinValues,
  jsonStringifyReplacer: () => jsonStringifyReplacer,
  members: () => members,
  merge: () => merge,
  mergeDefs: () => mergeDefs,
  normalizeParams: () => normalizeParams,
  nullish: () => nullish,
  numKeys: () => numKeys,
  objectClone: () => objectClone,
  omit: () => omit,
  optionalKeys: () => optionalKeys,
  own: () => own,
  parsedType: () => parsedType,
  partial: () => partial,
  pick: () => pick,
  prefixIssues: () => prefixIssues,
  primitiveTypes: () => primitiveTypes,
  promiseAllObject: () => promiseAllObject,
  propertyKeyTypes: () => propertyKeyTypes,
  randomString: () => randomString,
  rawShape: () => rawShape,
  required: () => required,
  safeExtend: () => safeExtend,
  shallowClone: () => shallowClone,
  slugify: () => slugify,
  stringifyPrimitive: () => stringifyPrimitive,
  toZod: () => toZod,
  uint8ArrayToBase64: () => uint8ArrayToBase64,
  uint8ArrayToBase64url: () => uint8ArrayToBase64url,
  uint8ArrayToHex: () => uint8ArrayToHex,
  unwrapMessage: () => unwrapMessage
});
function assertEqual(val) {
  return val;
}
function assertNotEqual(val) {
  return val;
}
function toZod() {
  return (schema) => schema;
}
function assertIs(_arg) {
}
function assertNever(_x) {
  throw new Error("Unexpected value in exhaustive check");
}
function assert(_) {
}
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function joinValues(array2, separator = "|") {
  return array2.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
var Cached = class {
  constructor(getter) {
    this._getter = getter;
    this._value = void 0;
  }
  get value() {
    const getter = this._getter;
    if (getter !== void 0) {
      this._value = getter();
      this._getter = void 0;
    }
    return this._value;
  }
};
function cached(getter) {
  return new Cached(getter);
}
function nullish(input2) {
  return input2 === null || input2 === void 0;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = 4 * Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
var EVALUATING = /* @__PURE__ */ Symbol("evaluating");
function defineLazy(object2, key, getter) {
  let value = void 0;
  Object.defineProperty(object2, key, {
    get() {
      if (value === EVALUATING) {
        return void 0;
      }
      if (value === void 0) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object2, key, {
        value: v
        // configurable: true,
      });
    },
    configurable: true
  });
}
function objectClone(obj) {
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function rawShape(def) {
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  return desc?.get ? desc.get.raw : desc?.value;
}
function sourceShape(schema) {
  return rawShape(schema._zod.def) ?? schema._zod.def.shape;
}
function deferProp(target, key, getter) {
  Object.defineProperty(target, key, {
    get() {
      const value = getter();
      assignProp(this, key, value);
      return value;
    },
    enumerable: true,
    configurable: true
  });
}
function putProp(target, key, value) {
  if (key in target)
    assignProp(target, key, value);
  else
    target[key] = value;
}
function mirrorShape(target, source, keys, wrap) {
  const raw = sourceShape(source);
  for (const key of keys) {
    const desc = Object.getOwnPropertyDescriptor(raw, key);
    if (!desc.enumerable)
      continue;
    if (desc.get) {
      deferProp(target, key, () => {
        const value = source._zod.def.shape[key];
        return wrap ? wrap(value, key) : value;
      });
    } else
      putProp(target, key, wrap ? wrap(desc.value, key) : desc.value);
  }
}
function mirrorProps(target, source) {
  for (const key of Reflect.ownKeys(source)) {
    const desc = Object.getOwnPropertyDescriptor(source, key);
    if (!desc.enumerable)
      continue;
    if (desc.get)
      deferProp(target, key, () => source[key]);
    else
      putProp(target, key, desc.value);
  }
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function cloneDef(schema) {
  return mergeDefs(schema._zod.def);
}
function getElementAtPath(obj, path) {
  if (!path)
    return obj;
  return path.reduce((acc, key) => acc?.[key], obj);
}
function promiseAllObject(promisesObj) {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => promisesObj[key]);
  return Promise.all(promises).then((results) => {
    const resolvedObj = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObj[keys[i]] = results[i];
    }
    return resolvedObj;
  });
}
function randomString(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
function esc(str) {
  return JSON.stringify(str);
}
function slugify(input2) {
  return input2.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
function numKeys(data) {
  let keyCount = 0;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      keyCount++;
    }
  }
  return keyCount;
}
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return Number.isNaN(data) ? "nan" : "number";
    case "boolean":
      return "boolean";
    case "function":
      return "function";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
    case "object":
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return "promise";
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return "map";
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return "set";
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return "date";
      }
      if (typeof File !== "undefined" && data instanceof File) {
        return "file";
      }
      return "object";
    default:
      throw new Error(`Unknown data type: ${t}`);
  }
};
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
var primitiveTypes = /* @__PURE__ */ new Set([
  "string",
  "number",
  "bigint",
  "boolean",
  "symbol",
  "undefined"
]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function createTransparentProxy(getter) {
  let target;
  return new Proxy({}, {
    get(_, prop, receiver) {
      target ?? (target = getter());
      return Reflect.get(target, prop, receiver);
    },
    set(_, prop, value, receiver) {
      target ?? (target = getter());
      return Reflect.set(target, prop, value, receiver);
    },
    has(_, prop) {
      target ?? (target = getter());
      return Reflect.has(target, prop);
    },
    deleteProperty(_, prop) {
      target ?? (target = getter());
      return Reflect.deleteProperty(target, prop);
    },
    ownKeys(_) {
      target ?? (target = getter());
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(_, prop) {
      target ?? (target = getter());
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    defineProperty(_, prop, descriptor) {
      target ?? (target = getter());
      return Reflect.defineProperty(target, prop, descriptor);
    }
  });
}
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return `"${value}"`;
  return `${value}`;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin !== void 0 && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = /* @__PURE__ */ (() => ({
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
}))();
var BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const newShape = {};
  mirrorShape(newShape, schema, maskedKeys(schema, mask));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
function maskedKeys(schema, mask) {
  const raw = sourceShape(schema);
  const keys = [];
  for (const key of Reflect.ownKeys(mask)) {
    if (!Object.getOwnPropertyDescriptor(raw, key)?.enumerable) {
      throw new Error(`Unrecognized key: "${String(key)}"`);
    }
    if (mask[key])
      keys.push(key);
  }
  return keys;
}
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const omitted = new Set(maskedKeys(schema, mask));
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)).filter((key) => !omitted.has(key)));
  return clone(schema, mergeDefs(currDef, { shape: newShape, checks: [] }));
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = sourceShape(schema);
    for (const key of Reflect.ownKeys(shape)) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function extended(schema, shape) {
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)));
  mirrorProps(newShape, shape);
  return newShape;
}
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  return clone(schema, mergeDefs(schema._zod.def, { shape: extended(schema, shape) }));
}
function merge(a, b) {
  if (!b?._zod?.def) {
    throw new Error("Invalid input to merge: expected an object schema. To merge a plain shape, use `.extend()`.");
  }
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const newShape = {};
  mirrorShape(newShape, a, Reflect.ownKeys(sourceShape(a)));
  mirrorShape(newShape, b, Reflect.ownKeys(sourceShape(b)));
  const def = mergeDefs(a._zod.def, {
    shape: newShape,
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
function partial(Class2, schema, mask, name = "partial") {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(`.${name}() cannot be used on object schemas containing refinements`);
  }
  const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), Class2 && ((value, key) => selected && !selected.has(key) ? value : new Class2({ type: "optional", innerType: value })));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape, checks: [] }));
}
function required(Class2, schema, mask) {
  const selected = mask ? new Set(maskedKeys(schema, mask)) : void 0;
  const newShape = {};
  mirrorShape(newShape, schema, Reflect.ownKeys(sourceShape(schema)), (value, key) => (
    // overwrite with non-optional
    selected && !selected.has(key) ? value : new Class2({ type: "nonoptional", innerType: value })
  ));
  return clone(schema, mergeDefs(schema._zod.def, { shape: newShape }));
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a3;
    (_a3 = iss).path ?? (_a3.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function attachSchema(issues, start, inst) {
  var _a3;
  for (let i = start; i < issues.length; i++) {
    (_a3 = issues[i]).schema ?? (_a3.schema = inst);
  }
}
function finalizeIssue(iss, ctx, config2) {
  var _a3;
  const traits = iss.inst?._zod?.traits;
  if (traits?.has("$ZodType")) {
    if (traits.has("$ZodCheck"))
      (_a3 = iss).schema ?? (_a3.schema = iss.inst);
    else
      iss.schema = iss.inst;
  }
  const schemaError = iss.schema !== iss.inst ? iss.schema?._zod.def?.error : void 0;
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(schemaError?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
  const full = {};
  for (const k of Object.keys(iss)) {
    if (k === "inst" || k === "schema" || k === "continue" || k === "input" || k === "__proto__")
      continue;
    full[k] = iss[k];
  }
  full.path ?? (full.path = []);
  full.message = message;
  if (ctx?.reportInput) {
    full.input = iss.input;
  }
  return full;
}
function getSizableOrigin(input2) {
  if (input2 instanceof Set)
    return "set";
  if (input2 instanceof Map)
    return "map";
  if (input2 instanceof File)
    return "file";
  return "unknown";
}
var highSurrogate = /[\uD800-\uDBFF]/;
function codePointLength(str) {
  const units = str.length;
  if (!highSurrogate.test(str))
    return units;
  let count = units;
  for (let i = 0; i < units - 1; i++) {
    if ((str.charCodeAt(i) & 64512) === 55296 && (str.charCodeAt(i + 1) & 64512) === 56320) {
      count--;
      i++;
    }
  }
  return count;
}
function getLengthableOrigin(input2) {
  if (Array.isArray(input2))
    return "array";
  if (typeof input2 === "string")
    return "string";
  return "unknown";
}
function parsedType(data) {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "nan" : "number";
    }
    case "object": {
      if (data === null) {
        return "null";
      }
      if (Array.isArray(data)) {
        return "array";
      }
      const obj = data;
      if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
        return obj.constructor.name;
      }
    }
  }
  return t;
}
function issue(...args) {
  const [iss, input2, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input: input2,
      inst
    };
  }
  return { ...iss };
}
function cleanEnum(obj) {
  return Object.entries(obj).filter(([k, _]) => {
    return Number.isNaN(Number.parseInt(k, 10));
  }).map((el) => el[1]);
}
function base64ToUint8Array(base643) {
  const binaryString = atob(base643);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
function uint8ArrayToBase64(bytes) {
  let binaryString = "";
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}
function base64urlToUint8Array(base64url3) {
  const base643 = base64url3.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - base643.length % 4) % 4);
  return base64ToUint8Array(base643 + padding);
}
function uint8ArrayToBase64url(bytes) {
  return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function hexToUint8Array(hex3) {
  const cleanHex = hex3.replace(/^0x/, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}
function uint8ArrayToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var Class = class {
  constructor(..._args) {
  }
};
function members(proto, table) {
  for (const key in table) {
    const desc = Object.getOwnPropertyDescriptor(table, key);
    if (desc.get)
      Object.defineProperty(proto, key, { ...desc, enumerable: false });
    else
      defineBound(proto, key, desc.value);
  }
  for (const sym of Object.getOwnPropertySymbols(table)) {
    defineBound(proto, sym, table[sym]);
  }
}
function own(inst, key, value, enumerable = true) {
  Object.defineProperty(inst, key, { configurable: true, writable: true, enumerable, value });
  return value;
}
function hide(inst, key, value) {
  return own(inst, key, value, false);
}
// @__NO_SIDE_EFFECTS__
function derived(computes, table) {
  for (const key in computes) {
    const compute = computes[key];
    Object.defineProperty(table, key, {
      configurable: true,
      enumerable: true,
      get() {
        return own(this, key, compute(this));
      },
      set(value) {
        own(this, key, value);
      }
    });
  }
  return table;
}
function defineBound(proto, key, fn) {
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      return this == null ? fn : own(this, key, fn.bind(this));
    },
    set(value) {
      own(this, key, value);
    }
  });
}
function claim(inst, sentinel) {
  const proto = Object.getPrototypeOf(inst);
  return sentinel in proto ? void 0 : proto;
}
var installing;
var broke = false;
var breaker = {
  configurable: true,
  get() {
    broke = true;
    return void 0;
  }
};
function defineLazyInternal(inst, key, compute) {
  const proto = Object.getPrototypeOf(inst._zod);
  if (key in proto && installing !== inst._zod) {
    installing = void 0;
    return;
  }
  installing = inst._zod;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      Object.defineProperty(this, key, breaker);
      const outer = broke;
      broke = false;
      try {
        const value = compute(this);
        if (broke)
          delete this[key];
        else
          Object.defineProperty(this, key, { configurable: true, writable: true, value });
        broke = broke || outer;
        return value;
      } catch (err) {
        delete this[key];
        broke = broke || outer;
        throw err;
      }
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, value });
    }
  });
}
function installLazyProp(inst, key, make, enumerable) {
  const proto = claim(inst, key);
  if (!proto)
    return;
  Object.defineProperty(proto, key, {
    configurable: true,
    get() {
      const desc = { configurable: true, writable: true, enumerable, value: void 0 };
      Object.defineProperty(this, key, desc);
      desc.value = make(this);
      Object.defineProperty(this, key, desc);
      return desc.value;
    },
    set(value) {
      Object.defineProperty(this, key, { configurable: true, writable: true, enumerable, value });
    }
  });
}
var CONSTANT_CATCH = "~constantCatch";
function constantCatch(value) {
  const fn = () => value;
  fn[CONSTANT_CATCH] = true;
  return fn;
}

// node_modules/zod/v4/core/core.js
var _a;
var NEVER = /* @__PURE__ */ Object.freeze({
  status: "aborted"
});
var _zodDesc = { value: void 0, enumerable: false };
var _E = "captureStackTrace" in Error ? Error : null;
function newError(Definition) {
  const E = _E;
  if (E) {
    const saved = E.stackTraceLimit;
    if (typeof saved === "number") {
      try {
        E.stackTraceLimit = 0;
      } catch {
        _E = null;
        return new Definition();
      }
      try {
        return new Definition();
      } finally {
        E.stackTraceLimit = saved;
      }
    }
  }
  return new Definition();
}
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer3, proto, params) {
  const zodProto = {};
  function Internals(def) {
    this.def = def;
    this.constr = _;
    this.traits = /* @__PURE__ */ new Set();
  }
  Internals.prototype = zodProto;
  const protoMembers = proto;
  const initialized = protoMembers && /* @__PURE__ */ new WeakSet();
  function init(inst, def) {
    if (!inst._zod) {
      _zodDesc.value = new Internals(def);
      try {
        Object.defineProperty(inst, "_zod", _zodDesc);
      } finally {
        _zodDesc.value = void 0;
      }
    }
    if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer3(inst, def);
    if (initialized) {
      const own2 = Object.getPrototypeOf(inst);
      const ctorProto = inst._zod.constr.prototype;
      let up = own2;
      while (up && up !== ctorProto)
        up = Object.getPrototypeOf(up);
      const target = up ?? own2;
      if (!initialized.has(target)) {
        initialized.add(target);
        members(target, protoMembers);
      }
    }
    const proto2 = _.prototype;
    for (const k in proto2) {
      if (!Object.prototype.hasOwnProperty.call(proto2, k))
        continue;
      if (!(k in inst)) {
        inst[k] = proto2[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    const inst = params?.Parent ? newError(Definition) : this;
    init(inst, def);
    const deferred = inst._zod.deferred;
    if (deferred) {
      for (const fn of deferred) {
        fn();
      }
      inst._zod.deferred = void 0;
    }
    const pp = globalThis.__zod_globalConfig?.postProcessor;
    if (pp)
      pp(inst);
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $brand = /* @__PURE__ */ Symbol("zod_brand");
var $ZodAsyncError = class extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
};
var $ZodEncodeError = class extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
};
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}

// node_modules/zod/v4/core/errors.js
function _getMessage() {
  const internals = this._zod;
  internals.message ?? (internals.message = JSON.stringify(internals.def, jsonStringifyReplacer, 2));
  return internals.message;
}
function _setMessage(value) {
  this._zod.message = value;
}
var _messageDesc = {
  get: _getMessage,
  set: _setMessage,
  enumerable: true,
  configurable: true
};
var _issuesDesc = { value: void 0, enumerable: false };
var _installedToString = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  _issuesDesc.value = def;
  Object.defineProperty(inst, "issues", _issuesDesc);
  _issuesDesc.value = void 0;
  Object.defineProperty(inst, "message", _messageDesc);
  const proto = Object.getPrototypeOf(inst);
  if (!_installedToString.has(proto)) {
    _installedToString.add(proto);
    Object.defineProperty(proto, "toString", {
      configurable: true,
      enumerable: false,
      get() {
        const value = () => this.message;
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
        return value;
      },
      set(value) {
        Object.defineProperty(this, "toString", { value, configurable: true, writable: true });
      }
    });
  }
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, void 0, {
  Parent: Error
});
function node(obj, key, make) {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) {
    if (key === "__proto__") {
      Object.defineProperty(obj, key, { value: make(), writable: true, enumerable: true, configurable: true });
    } else {
      obj[key] = make();
    }
  }
  return obj[key];
}
function flattenError(error62, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error62.issues) {
    if (sub.path.length > 0) {
      node(fieldErrors, sub.path[0], () => []).push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error62, mapper = (issue2) => issue2.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error63, path = []) => {
    for (const issue2 of error63.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, [...path, ...issue2.path]));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else {
        const fullpath = [...path, ...issue2.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue2));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (el === "_errors") {
              if (terminal)
                curr._errors.push(mapper(issue2));
              i++;
              continue;
            }
            if (!Object.prototype.hasOwnProperty.call(curr, el)) {
              Object.defineProperty(curr, el, {
                value: { _errors: [] },
                enumerable: true,
                writable: true,
                configurable: true
              });
            }
            const node2 = curr[el];
            if (terminal) {
              node2._errors.push(mapper(issue2));
            }
            curr = node2;
            i++;
          }
        }
      }
    }
  };
  processError(error62);
  return fieldErrors;
}
function treeifyError(error62, mapper = (issue2) => issue2.message) {
  const result = { errors: [] };
  const processError = (error63, path = []) => {
    var _a3;
    for (const issue2 of error63.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, [...path, ...issue2.path]));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else {
        const fullpath = [...path, ...issue2.path];
        if (fullpath.length === 0) {
          result.errors.push(mapper(issue2));
          continue;
        }
        let curr = result;
        let i = 0;
        while (i < fullpath.length) {
          const el = fullpath[i];
          const terminal = i === fullpath.length - 1;
          if (typeof el === "string") {
            curr.properties ?? (curr.properties = {});
            if (!Object.prototype.hasOwnProperty.call(curr.properties, el)) {
              Object.defineProperty(curr.properties, el, {
                value: { errors: [] },
                enumerable: true,
                writable: true,
                configurable: true
              });
            }
            curr = curr.properties[el];
          } else {
            curr.items ?? (curr.items = []);
            (_a3 = curr.items)[el] ?? (_a3[el] = { errors: [] });
            curr = curr.items[el];
          }
          if (terminal) {
            curr.errors.push(mapper(issue2));
          }
          i++;
        }
      }
    }
  };
  processError(error62);
  return result;
}
function toDotPath(_path) {
  const segs = [];
  const path = _path.map((seg) => typeof seg === "object" ? seg.key : seg);
  for (const seg of path) {
    if (typeof seg === "number")
      segs.push(`[${seg}]`);
    else if (typeof seg === "symbol")
      segs.push(`[${JSON.stringify(String(seg))}]`);
    else if (/[^\w$]/.test(seg))
      segs.push(`[${JSON.stringify(seg)}]`);
    else {
      if (segs.length)
        segs.push(".");
      segs.push(seg);
    }
  }
  return segs.join("");
}
function prettifyError(error62) {
  const lines = [];
  const issues = [...error62.issues].sort((a, b) => (a.path ?? []).length - (b.path ?? []).length);
  for (const issue2 of issues) {
    lines.push(`\u2716 ${issue2.message}`);
    if (issue2.path?.length)
      lines.push(`  \u2192 at ${toDotPath(issue2.path)}`);
  }
  return lines.join("\n");
}

// node_modules/zod/v4/core/parse.js
function finalizeParams(callee, params) {
  return { callee: params?.callee ?? callee, Err: params?.Err };
}
var _parse = (_Err) => {
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
    const result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise) {
      throw new $ZodAsyncError();
    }
    if (result.issues.length) {
      const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, _params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var parse = /* @__PURE__ */ _parse($ZodRealError);
var _parseAsync = (_Err) => {
  const fn = async (schema, value, _ctx, params) => {
    const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
    let result = schema._zod.run({ value, issues: [] }, ctx);
    if (result instanceof Promise)
      result = await result;
    if (result.issues.length) {
      const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
      captureStackTrace(e, params?.callee ?? fn);
      throw e;
    }
    return result.value;
  };
  return fn;
};
var parseAsync = /* @__PURE__ */ _parseAsync($ZodRealError);
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
var safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
function failure(Err, issues, ctx) {
  let error62;
  return {
    success: false,
    get error() {
      if (!error62) {
        error62 = new Err(issues.map((iss) => finalizeIssue(iss, ctx, config())));
        issues = void 0;
        ctx = void 0;
      }
      return error62;
    },
    set error(e) {
      error62 = e;
      issues = void 0;
      ctx = void 0;
    }
  };
}
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? failure(_Err, result.issues, ctx) : { success: true, data: result.value };
};
var safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);
var COMPILE_INVALID = /* @__PURE__ */ Symbol.for("zod.compile.invalid");
var COMPILE_FALLBACK = /* @__PURE__ */ Symbol.for("zod.compile.fallback");
var validate = ((schema, value, _ctx) => {
  const validator = schema._zod.bag.validator;
  if (validator !== void 0) {
    if (validator(value) !== COMPILE_INVALID)
      return true;
    if (validator.definite === true && _ctx === void 0)
      return false;
  }
  return validateFallback(schema, value, _ctx);
});
function validateFallback(schema, value, _ctx) {
  const ctx = _ctx ? { ..._ctx, async: false, abortEarly: true } : { async: false, abortEarly: true };
  const fallbackRun = schema._zod.bag.fallbackRun;
  let result;
  if (fallbackRun) {
    ctx[COMPILE_FALLBACK] = true;
    result = fallbackRun({ value, issues: [] }, ctx);
  } else {
    result = schema._zod.run({ value, issues: [] }, ctx);
  }
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length === 0;
}
var validateAsync = async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true, abortEarly: true } : { async: true, abortEarly: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length === 0;
};
var _encode = (_Err) => {
  const parse3 = _parse(_Err);
  const fn = (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return parse3(schema, value, ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var encode = /* @__PURE__ */ _encode($ZodRealError);
var _decode = (_Err) => {
  const parse3 = _parse(_Err);
  const fn = (schema, value, _ctx, _params) => {
    return parse3(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var decode = /* @__PURE__ */ _decode($ZodRealError);
var _encodeAsync = (_Err) => {
  const parseAsync3 = _parseAsync(_Err);
  const fn = async (schema, value, _ctx, _params) => {
    const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
    return await parseAsync3(schema, value, ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var encodeAsync = /* @__PURE__ */ _encodeAsync($ZodRealError);
var _decodeAsync = (_Err) => {
  const parseAsync3 = _parseAsync(_Err);
  const fn = async (schema, value, _ctx, _params) => {
    return await parseAsync3(schema, value, _ctx, finalizeParams(fn, _params));
  };
  return fn;
};
var decodeAsync = /* @__PURE__ */ _decodeAsync($ZodRealError);
var _safeEncode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParse(_Err)(schema, value, ctx);
};
var safeEncode = /* @__PURE__ */ _safeEncode($ZodRealError);
var _safeDecode = (_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
};
var safeDecode = /* @__PURE__ */ _safeDecode($ZodRealError);
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParseAsync(_Err)(schema, value, ctx);
};
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync($ZodRealError);
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
};
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync($ZodRealError);

// node_modules/zod/v4/core/regexes.js
var regexes_exports = {};
__export(regexes_exports, {
  anyString: () => anyString,
  base64: () => base64,
  base64url: () => base64url,
  bigint: () => bigint,
  boolean: () => boolean,
  browserEmail: () => browserEmail,
  cidrv4: () => cidrv4,
  cidrv6: () => cidrv6,
  creditCard: () => creditCard,
  cuid: () => cuid,
  cuid2: () => cuid2,
  date: () => date,
  datetime: () => datetime,
  domain: () => domain,
  duration: () => duration,
  e164: () => e164,
  email: () => email,
  emoji: () => emoji,
  extendedDuration: () => extendedDuration,
  guid: () => guid,
  hex: () => hex,
  hostname: () => hostname,
  html5Email: () => html5Email,
  httpProtocol: () => httpProtocol,
  iban: () => iban,
  idnEmail: () => idnEmail,
  integer: () => integer,
  ipv4: () => ipv4,
  ipv6: () => ipv6,
  ksuid: () => ksuid,
  lowercase: () => lowercase,
  mac: () => mac,
  md5_base64: () => md5_base64,
  md5_base64url: () => md5_base64url,
  md5_hex: () => md5_hex,
  nanoid: () => nanoid,
  nanoidOfLength: () => nanoidOfLength,
  null: () => _null,
  number: () => number,
  rfc5322Email: () => rfc5322Email,
  sha1_base64: () => sha1_base64,
  sha1_base64url: () => sha1_base64url,
  sha1_hex: () => sha1_hex,
  sha256_base64: () => sha256_base64,
  sha256_base64url: () => sha256_base64url,
  sha256_hex: () => sha256_hex,
  sha384_base64: () => sha384_base64,
  sha384_base64url: () => sha384_base64url,
  sha384_hex: () => sha384_hex,
  sha512_base64: () => sha512_base64,
  sha512_base64url: () => sha512_base64url,
  sha512_hex: () => sha512_hex,
  string: () => string,
  time: () => time,
  ulid: () => ulid,
  undefined: () => _undefined,
  unicodeEmail: () => unicodeEmail,
  uppercase: () => uppercase,
  uuid: () => uuid,
  uuid4: () => uuid4,
  uuid6: () => uuid6,
  uuid7: () => uuid7,
  xid: () => xid
});
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-7][0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{25}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
function nanoidOfLength(length) {
  return new RegExp(`^[a-zA-Z0-9_-]{${length}}$`);
}
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var extendedDuration = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = (version2) => {
  if (!version2)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var uuid4 = /* @__PURE__ */ uuid(4);
var uuid6 = /* @__PURE__ */ uuid(6);
var uuid7 = /* @__PURE__ */ uuid(7);
var email = /^(?:[A-Za-z0-9_'+\-]+\.)*[A-Za-z0-9_'+\-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var html5Email = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var rfc5322Email = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var unicodeEmail = /^[^\s@"]{1,64}@[^\s@]{1,255}$/u;
var idnEmail = unicodeEmail;
var browserEmail = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var _emoji = `^(?=[\\s\\S]*[\\p{Extended_Pictographic}\\p{Regional_Indicator}\\u20E3])[\\p{Extended_Pictographic}\\p{Emoji_Component}]+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var mac = (delimiter) => {
  const escapedDelim = escapeRegex(delimiter ?? ":");
  return new RegExp(`^(?:[0-9A-F]{2}${escapedDelim}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${escapedDelim}){5}[0-9a-f]{2}$`);
};
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^(?:[A-Za-z0-9_-]{4})*(?:[A-Za-z0-9_-]{2,3})?$/;
var hostname = /^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/;
var domain = /^(?=.{1,253}$)([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var creditCard = /^\d(?:[ -]?\d){11,18}$/;
var iban = /^[A-Z]{2}(?!00|01|99)\d{2}[A-Z0-9]{11,30}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
function anchor(source) {
  return new RegExp(`^${source}$`);
}
var date = /* @__PURE__ */ anchor(dateSource);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : args.seconds ? `${hhmm}:[0-5]\\d(?:\\.\\d+)?` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const opts = ["Z"];
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const qualified = `${timeSource({ precision: args.precision, seconds: true })}(?:${opts.join("|")})`;
  const timeRegex = args.local ? `${qualified}|${timeSource({ precision: args.precision })}` : qualified;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var anyString = /^[\s\S]{0,}$/;
var string = (params) => {
  const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
};
var bigint = /^-?\d+n?$/;
var integer = /^-?\d+$/;
var number = /^-?\d+(?:\.\d+)?$/;
var boolean = /^(?:true|false)$/i;
var _null = /^null$/i;
var _undefined = /^undefined$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;
var hex = /^[0-9a-fA-F]*$/;
function fixedBase64(bodyLength, padding) {
  return new RegExp(`^[A-Za-z0-9+/]{${bodyLength}}${padding}$`);
}
function fixedBase64url(length) {
  return new RegExp(`^[A-Za-z0-9_-]{${length}}$`);
}
var md5_hex = /^[0-9a-fA-F]{32}$/;
var md5_base64 = /* @__PURE__ */ fixedBase64(22, "==");
var md5_base64url = /* @__PURE__ */ fixedBase64url(22);
var sha1_hex = /^[0-9a-fA-F]{40}$/;
var sha1_base64 = /* @__PURE__ */ fixedBase64(27, "=");
var sha1_base64url = /* @__PURE__ */ fixedBase64url(27);
var sha256_hex = /^[0-9a-fA-F]{64}$/;
var sha256_base64 = /* @__PURE__ */ fixedBase64(43, "=");
var sha256_base64url = /* @__PURE__ */ fixedBase64url(43);
var sha384_hex = /^[0-9a-fA-F]{96}$/;
var sha384_base64 = /* @__PURE__ */ fixedBase64(64, "");
var sha384_base64url = /* @__PURE__ */ fixedBase64url(64);
var sha512_hex = /^[0-9a-fA-F]{128}$/;
var sha512_base64 = /* @__PURE__ */ fixedBase64(86, "==");
var sha512_base64url = /* @__PURE__ */ fixedBase64url(86);

// node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a3;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a3 = inst._zod).onattach ?? (_a3.onattach = []);
});
var _whenHasSize = (payload) => {
  const val = payload.value;
  return !nullish(val) && val.size !== void 0;
};
var _whenHasLength = (payload) => {
  const val = payload.value;
  return !nullish(val) && val.length !== void 0;
};
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_big",
      maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin: numericOriginMap[typeof payload.value] ?? origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? (
      // `value % 0n` throws, and nothing is a multiple of zero — the number branch already fails this way via NaN
      def.value !== BigInt(0) && payload.value % def.value === BigInt(0)
    ) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.check = (payload) => {
    const input2 = payload.value;
    if (isInt) {
      if (!Number.isInteger(input2)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input: input2,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input2)) {
        if (input2 > 0) {
          payload.issues.push({
            input: input2,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input: input2,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input2 < minimum) {
      payload.issues.push({
        origin: "number",
        input: input2,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input2 > maximum) {
      payload.issues.push({
        origin: "number",
        input: input2,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckBigIntFormat = /* @__PURE__ */ $constructor("$ZodCheckBigIntFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  const [minimum, maximum] = BIGINT_FORMAT_RANGES[def.format];
  inst._zod.check = (payload) => {
    const input2 = payload.value;
    if (input2 < minimum) {
      payload.issues.push({
        origin: "bigint",
        input: input2,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input2 > maximum) {
      payload.issues.push({
        origin: "bigint",
        input: input2,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckMaxSize = /* @__PURE__ */ $constructor("$ZodCheckMaxSize", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasSize);
  inst._zod.check = (payload) => {
    const input2 = payload.value;
    const size = input2.size;
    if (size <= def.maximum)
      return;
    payload.issues.push({
      origin: getSizableOrigin(input2),
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input: input2,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinSize = /* @__PURE__ */ $constructor("$ZodCheckMinSize", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasSize);
  inst._zod.check = (payload) => {
    const input2 = payload.value;
    const size = input2.size;
    if (size >= def.minimum)
      return;
    payload.issues.push({
      origin: getSizableOrigin(input2),
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input: input2,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckSizeEquals = /* @__PURE__ */ $constructor("$ZodCheckSizeEquals", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasSize);
  inst._zod.check = (payload) => {
    const input2 = payload.value;
    const size = input2.size;
    if (size === def.size)
      return;
    const tooBig = size > def.size;
    payload.issues.push({
      origin: getSizableOrigin(input2),
      ...tooBig ? { code: "too_big", maximum: def.size } : { code: "too_small", minimum: def.size },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input2 = payload.value;
    const units = input2.length;
    const length = typeof input2 === "string" && units > def.maximum ? codePointLength(input2) : units;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input2);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input: input2,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input2 = payload.value;
    const units = input2.length;
    const length = typeof input2 === "string" && units >= def.minimum && units < def.minimum * 2 ? codePointLength(input2) : units;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input2);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input: input2,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = _whenHasLength);
  inst._zod.check = (payload) => {
    const input2 = payload.value;
    const units = input2.length;
    const length = typeof input2 === "string" && units >= def.length && units <= def.length * 2 ? codePointLength(input2) : units;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input2);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a3, _b;
  $ZodCheck.init(inst, def);
  if (def.pattern)
    (_a3 = inst._zod).check ?? (_a3.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {
    });
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position},}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function handleCheckPropertyResult(result, payload, property) {
  if (result.issues.length) {
    payload.issues.push(...prefixIssues(property, result.issues));
  }
}
var $ZodCheckProperty = /* @__PURE__ */ $constructor("$ZodCheckProperty", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    const result = def.schema._zod.run({
      value: payload.value[def.property],
      issues: []
    }, {});
    if (result instanceof Promise) {
      return result.then((result2) => handleCheckPropertyResult(result2, payload, def.property));
    }
    handleCheckPropertyResult(result, payload, def.property);
    return;
  };
});
var $ZodCheckMimeType = /* @__PURE__ */ $constructor("$ZodCheckMimeType", (inst, def) => {
  $ZodCheck.init(inst, def);
  const mimeSet = new Set(def.mime);
  inst._zod.check = (payload) => {
    if (mimeSet.has(payload.value.type))
      return;
    payload.issues.push({
      code: "invalid_value",
      values: def.mime,
      input: payload.value.type,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// node_modules/zod/v4/core/doc.js
var Doc = class {
  constructor(args = [], closed = {}) {
    this.content = [];
    this.indent = 0;
    this.args = args;
    this.closed = closed;
  }
  // the compiler catches a child's throw and keeps writing into this doc, so the indent has to unwind with it
  indented(fn) {
    this.indent += 1;
    try {
      fn(this);
    } finally {
      this.indent -= 1;
    }
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split("\n").filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const content = this?.content ?? [``];
    const factory = new F(...Object.keys(this.closed), `return function (${this.args.join(", ")}) {
${content.join("\n")}
};`);
    return factory(...Object.values(this.closed));
  }
};

// node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 6,
  patch: 2
};

// node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a3;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const defChecks = inst._zod.def.checks;
  const checks = inst._zod.traits.has("$ZodCheck") ? [inst, ...defChecks ?? []] : defChecks?.length ? [...defChecks] : [];
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      if (payload.memo)
        return payload;
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            attachSchema(payload.issues, currLen, inst);
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          attachSchema(payload.issues, currLen, inst);
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary2) => {
            return handleCanaryResult(canary2, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
}, {
  // Wrappers extend this by installing a richer factory over it; reading it eagerly would defeat the laziness.
  get "~standard"() {
    return hide(this, "~standard", standardProps(this));
  },
  set "~standard"(value) {
    own(this, "~standard", value);
  }
});
var toStandardResult = (r, ctx) => r.issues.length ? { issues: r.issues.map((iss) => finalizeIssue(iss, ctx, config())) } : { value: r.value };
async function validateAsync2(inst, value) {
  const ctx = { async: true };
  return toStandardResult(await inst._zod.run({ value, issues: [] }, ctx), ctx);
}
function standardProps(inst) {
  return {
    validate: (value) => {
      const ctx = { async: false };
      try {
        const r = inst._zod.run({ value, issues: [] }, ctx);
        if (!(r instanceof Promise))
          return toStandardResult(r, ctx);
      } catch (_) {
      }
      return validateAsync2(inst, value);
    },
    vendor: "zod",
    version: 1
  };
}
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = def.pattern ?? anyString;
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === void 0)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var URL_BAD_FORMAT = 1;
var URL_UNPARSEABLE = 2;
function parseURLObject(trimmed, def) {
  if (!def.normalize && def.protocol?.source === httpProtocol.source && !/^https?:\/\//i.test(trimmed)) {
    return URL_BAD_FORMAT;
  }
  try {
    return new URL(trimmed);
  } catch {
    return URL_UNPARSEABLE;
  }
}
var asciiTabOrNewline = /[\t\n\r]/g;
function stripTabAndNewline(value) {
  return value.replace(asciiTabOrNewline, "");
}
function urlHostnameOk(url2, hostname3) {
  hostname3.lastIndex = 0;
  return hostname3.test(url2.hostname);
}
function urlProtocolOk(url2, protocol) {
  protocol.lastIndex = 0;
  return protocol.test(url2.protocol.endsWith(":") ? url2.protocol.slice(0, -1) : url2.protocol);
}
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      const url2 = parseURLObject(trimmed, def);
      if (url2 === URL_BAD_FORMAT) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid URL format",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (url2 === URL_UNPARSEABLE) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          input: payload.value,
          inst,
          continue: !def.abort
        });
        return;
      }
      if (def.hostname && !urlHostnameOk(url2, def.hostname)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid hostname",
          pattern: def.hostname.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      if (def.protocol && !urlProtocolOk(url2, def.protocol)) {
        payload.issues.push({
          code: "invalid_format",
          format: "url",
          note: "Invalid protocol",
          pattern: def.protocol.source,
          input: payload.value,
          inst,
          continue: !def.abort
        });
      }
      payload.value = def.normalize ? url2.href : stripTabAndNewline(trimmed);
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  if (def.length !== void 0 && (!Number.isInteger(def.length) || def.length < 1))
    throw new Error(`Invalid nanoid length: ${def.length}`);
  def.pattern ?? (def.pattern = def.length === void 0 ? nanoid : nanoidOfLength(def.length));
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
});
var ipv6Alphabet = /^[0-9a-fA-F:.]+$/;
function isValidIPv6(value) {
  if (!ipv6Alphabet.test(value))
    return false;
  try {
    new URL(`http://[${value}]`);
    return true;
  } catch {
    return false;
  }
}
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidIPv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodMAC = /* @__PURE__ */ $constructor("$ZodMAC", (inst, def) => {
  def.pattern ?? (def.pattern = mac(def.delimiter));
  $ZodStringFormat.init(inst, def);
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
function isValidCIDRv6(value) {
  const parts = value.split("/");
  if (parts.length !== 2)
    return false;
  const [address, prefix] = parts;
  if (!prefix)
    return false;
  const prefixNum = Number(prefix);
  if (`${prefixNum}` !== prefix)
    return false;
  if (prefixNum < 0 || prefixNum > 128)
    return false;
  return isValidIPv6(address);
}
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (!isValidCIDRv6(payload.value)) {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var base64Charset = /^[0-9a-zA-Z+/]*={0,2}$/;
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64Charset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var base64urlCharset = /^[A-Za-z0-9_-]*$/;
function isValidBase64URL(data) {
  if (!base64urlCharset.test(data))
    return false;
  const base643 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base643.padEnd(Math.ceil(base643.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64urlCharset);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
var CC_SANITIZE = /[- ]/g;
function isLuhnAlgo(digits) {
  let length = digits.length;
  let bit = 1;
  let sum = 0;
  while (length) {
    const value = digits.charCodeAt(--length) - 48;
    bit ^= 1;
    sum += bit ? [0, 2, 4, 6, 8, 1, 3, 5, 7, 9][value] : value;
  }
  return sum % 10 === 0;
}
function isValidCreditCard(input2) {
  if (!creditCard.test(input2))
    return false;
  return isLuhnAlgo(input2.replace(CC_SANITIZE, ""));
}
var $ZodCreditCard = /* @__PURE__ */ $constructor("$ZodCreditCard", (inst, def) => {
  def.pattern ?? (def.pattern = creditCard);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidCreditCard(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "credit_card",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isIso7064Mod97(iban3) {
  let remainder = 0;
  const len = iban3.length;
  for (let i = 4; i < len; i++) {
    const code = iban3.charCodeAt(i);
    remainder = (code >= 65 ? remainder * 100 + (code - 55) : remainder * 10 + (code - 48)) % 97;
  }
  for (let i = 0; i < 4; i++) {
    const code = iban3.charCodeAt(i);
    remainder = (code >= 65 ? remainder * 100 + (code - 55) : remainder * 10 + (code - 48)) % 97;
  }
  return remainder === 1;
}
function isValidIBAN(input2) {
  if (!iban.test(input2))
    return false;
  return isIso7064Mod97(input2);
}
var $ZodIBAN = /* @__PURE__ */ $constructor("$ZodIBAN", (inst, def) => {
  def.pattern ?? (def.pattern = iban);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidIBAN(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "iban",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCustomStringFormat = /* @__PURE__ */ $constructor("$ZodCustomStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (def.fn(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: def.format,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {
      }
    const input2 = payload.value;
    if (typeof input2 === "number" && !Number.isNaN(input2) && Number.isFinite(input2)) {
      return payload;
    }
    const received = typeof input2 === "number" ? Number.isNaN(input2) ? "NaN" : !Number.isFinite(input2) ? String(input2) : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input: input2,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {
      }
    const input2 = payload.value;
    if (typeof input2 === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input: input2,
      inst
    });
    return payload;
  };
});
var $ZodBigInt = /* @__PURE__ */ $constructor("$ZodBigInt", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = bigint;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = BigInt(payload.value);
      } catch (_) {
      }
    if (typeof payload.value === "bigint")
      return payload;
    payload.issues.push({
      expected: "bigint",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodBigIntFormat = /* @__PURE__ */ $constructor("$ZodBigIntFormat", (inst, def) => {
  $ZodCheckBigIntFormat.init(inst, def);
  $ZodBigInt.init(inst, def);
});
var $ZodSymbol = /* @__PURE__ */ $constructor("$ZodSymbol", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input2 = payload.value;
    if (typeof input2 === "symbol")
      return payload;
    payload.issues.push({
      expected: "symbol",
      code: "invalid_type",
      input: input2,
      inst
    });
    return payload;
  };
});
var $ZodUndefined = /* @__PURE__ */ $constructor("$ZodUndefined", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _undefined;
  inst._zod.values = /* @__PURE__ */ new Set([void 0]);
  inst._zod.parse = (payload, _ctx) => {
    const input2 = payload.value;
    if (typeof input2 === "undefined")
      return payload;
    payload.issues.push({
      expected: "undefined",
      code: "invalid_type",
      input: input2,
      inst
    });
    return payload;
  };
});
var $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _null;
  inst._zod.values = /* @__PURE__ */ new Set([null]);
  inst._zod.parse = (payload, _ctx) => {
    const input2 = payload.value;
    if (input2 === null)
      return payload;
    payload.issues.push({
      expected: "null",
      code: "invalid_type",
      input: input2,
      inst
    });
    return payload;
  };
});
var $ZodAny = /* @__PURE__ */ $constructor("$ZodAny", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodVoid = /* @__PURE__ */ $constructor("$ZodVoid", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input2 = payload.value;
    if (typeof input2 === "undefined")
      return payload;
    payload.issues.push({
      expected: "void",
      code: "invalid_type",
      input: input2,
      inst
    });
    return payload;
  };
});
var $ZodDate = /* @__PURE__ */ $constructor("$ZodDate", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce) {
      try {
        payload.value = new Date(payload.value);
      } catch (_err) {
      }
    }
    const input2 = payload.value;
    const isDate = input2 instanceof Date;
    const isValidDate = isDate && !Number.isNaN(input2.getTime());
    if (isValidDate)
      return payload;
    payload.issues.push({
      expected: "date",
      code: "invalid_type",
      input: input2,
      ...isDate ? { received: "Invalid Date" } : {},
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  const memo2 = globalConfig.memoizer;
  memo2?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input2 = payload.value;
    if (!Array.isArray(input2)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input: input2,
        inst
      });
      return payload;
    }
    payload.value = memo2 ? memo2.alloc(inst, payload, Array(input2.length), ctx) : Array(input2.length);
    const proms = [];
    const abortEarly = ctx?.abortEarly;
    for (let i = 0; i < input2.length; i++) {
      const item = input2[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
        if (abortEarly && result.issues.length !== 0 && aborted(result))
          break;
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key, input2, optin, optout) {
  const isPresent = key in input2;
  const isOptionalOut = optout === "optional";
  if (!isPresent && isOptionalOut && optin === "optional") {
    return;
  }
  if (result.issues.length) {
    if (optin !== void 0 && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && optin === void 0) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: void 0,
        path: [key]
      });
    }
    return;
  }
  if (result.value === void 0) {
    if (isPresent || optin === "defaulted" && !isOptionalOut) {
      final.value[key] = void 0;
    }
  } else {
    final.value[key] = result.value;
  }
}
var NO_SYMBOL_KEYS = [];
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  const ownSymbols = Object.getOwnPropertySymbols(def.shape);
  const symbolKeys = ownSymbols.length ? ownSymbols : NO_SYMBOL_KEYS;
  const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
  for (const k of allKeys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${String(k)}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    allKeys,
    symbolKeys,
    // string-only: handleCatchall matches it against `for...in`, which never yields a symbol
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input2, payload, ctx, def, inst, abortEarly) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const optin = _catchall.optin;
  const optout = _catchall.optout;
  let seen = 0;
  for (const key in input2) {
    if (abortEarly && payload.issues.length !== seen) {
      if (aborted(payload, seen))
        break;
      seen = payload.issues.length;
    }
    if (keySet.has(key))
      continue;
    if (key === "__proto__") {
      if (t === "never")
        unrecognized.push(key);
      continue;
    }
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input2[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input2, optin, optout)));
    } else {
      handlePropertyResult(r, payload, key, input2, optin, optout);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input: input2,
      inst,
      // Describes the shape of the input, not the validity of the parsed value, so it never aborts. The parse still fails; the schema's own checks just get to run first, and an enclosing intersection can reconcile the key against a sibling operand.
      continue: true
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  const sh = desc?.get ? desc.get.raw : def.shape ?? {};
  if (sh) {
    const get = () => {
      const newSh = { ...sh };
      Object.defineProperty(def, "shape", { value: newSh });
      get.raw = newSh;
      return newSh;
    };
    get.raw = sh;
    Object.defineProperty(def, "shape", { get });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazyInternal(inst, "propValues", (zod) => {
    const shape = zod.def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        if (!Object.prototype.hasOwnProperty.call(propValues, key)) {
          assignProp(propValues, key, /* @__PURE__ */ new Set());
        }
        for (const v of field.values)
          propValues[key].add(v);
        if (field.optin !== void 0)
          propValues[key].add(void 0);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  const memo2 = globalConfig.memoizer;
  memo2?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input2 = payload.value;
    if (!isObject2(input2)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input: input2,
        inst
      });
      return payload;
    }
    payload.value = memo2 ? memo2.alloc(inst, payload, {}, ctx) : {};
    const proms = [];
    const shape = value.shape;
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const key of value.allKeys) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      if (key === "__proto__")
        continue;
      const el = shape[key];
      const optin = el._zod.optin;
      const optout = el._zod.optout;
      const r = el._zod.run({ value: input2[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handlePropertyResult(r2, payload, key, input2, optin, optout)));
      } else {
        handlePropertyResult(r, payload, key, input2, optin, optout);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input2, payload, ctx, _normalized.value, inst, abortEarly === true);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const memo2 = globalConfig.memoizer;
  const generateFastpass = (shape) => {
    const normalized = _normalized.value;
    const syms = normalized.symbolKeys;
    const doc = new Doc(["payload", "ctx"], { shape, inst, memo: memo2, syms });
    const parseStr = (k) => `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    const prefixStr = (id, k) => `
          let ${id}_ab = false;
          for (let i = 0; i < ${id}.issues.length; i++) {
            const iss = ${id}.issues[i];
            iss.path = iss.path ? [${k}, ...iss.path] : [${k}];
            payload.issues.push(iss);
            if (iss.continue !== true) ${id}_ab = true;
          }
          if (${id}_ab && ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }`;
    doc.write(`const input = payload.value;`);
    const ids = /* @__PURE__ */ Object.create(null);
    let counter = 0;
    for (const key of normalized.allKeys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(memo2 ? `const newResult = memo.alloc(inst, payload, {}, ctx);` : `const newResult = {};`);
    for (const key of normalized.allKeys) {
      if (key === "__proto__")
        continue;
      const id = ids[key];
      const k = typeof key === "symbol" ? `syms[${syms.indexOf(key)}]` : esc(key);
      const isPresent = `${k} in input`;
      const schema = shape[key];
      const optin = schema?._zod?.optin;
      const isOptionalIn = optin !== void 0;
      const isOptionalOut = schema?._zod?.optout === "optional";
      doc.write(`const ${id} = ${parseStr(k)};`);
      if (isOptionalIn && isOptionalOut) {
        const assign = optin === "optional" ? `${id}_present` : `${id}.value !== undefined || ${id}_present`;
        doc.write(`
        const ${id}_present = ${isPresent};
        if (!${id}.issues.length || ${id}_present) {
          if (${id}.issues.length) {${prefixStr(id, k)}
          }

          if (${assign}) {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
      } else if (!isOptionalIn) {
        doc.write(`
        const ${id}_present = ${isPresent};
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
          if (ctx && ctx.abortEarly) {
            payload.value = newResult;
            return payload;
          }
        }

        if (${id}_present) {
          newResult[${k}] = ${id}.value;
        }

      `);
      } else {
        doc.write(`
        if (${id}.issues.length) {${prefixStr(id, k)}
        }
      `);
        if (optin === "defaulted") {
          doc.write(`newResult[${k}] = ${id}.value;`);
        } else {
          doc.write(`
        if (${id}.value !== undefined || ${isPresent}) {
          newResult[${k}] = ${id}.value;
        }
      `);
        }
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    return doc.compile();
  };
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input2 = payload.value;
    if (!isObject2(input2)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input: input2,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input2, payload, ctx, value, inst, ctx?.abortEarly === true);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.options.some((o) => o._zod.optin === "defaulted") ? "defaulted" : zod.def.options.some((o) => o._zod.optin !== void 0) ? "optional" : void 0);
  defineLazyInternal(inst, "optout", (zod) => zod.def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
  defineLazyInternal(inst, "values", (zod) => {
    if (zod.def.options.every((o) => o._zod.values)) {
      return new Set(zod.def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return void 0;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    if (zod.def.options.every((o) => o._zod.pattern)) {
      const patterns = zod.def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return void 0;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleUnionResults(results2, payload, inst, ctx);
    });
  };
});
function handleExclusiveUnionResults(results, final, inst, ctx) {
  const matches = [];
  for (let i = 0; i < results.length; i++) {
    if (results[i].issues.length === 0)
      matches.push(i);
  }
  if (matches.length === 1) {
    final.value = results[matches[0]].value;
    return final;
  }
  if (matches.length === 0) {
    final.issues.push({
      code: "invalid_union",
      input: final.value,
      inst,
      errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
    });
  } else {
    final.issues.push({
      code: "invalid_union",
      input: final.value,
      inst,
      errors: [],
      inclusive: false,
      matches
    });
  }
  return final;
}
var $ZodXor = /* @__PURE__ */ $constructor("$ZodXor", (inst, def) => {
  $ZodUnion.init(inst, def);
  def.inclusive = false;
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        results.push(result);
      }
    }
    if (!async)
      return handleExclusiveUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleExclusiveUnionResults(results2, payload, inst, ctx);
    });
  };
});
function getDiscriminatedOption(union2, value) {
  const internals = union2._zod;
  let map2 = internals.bag.optionsMap;
  if (!map2) {
    map2 = discriminatorMap(internals.def);
    internals.bag.optionsMap = map2;
  }
  const option = map2.get(value);
  if (option === null)
    throw new Error(`Ambiguous discriminator value "${String(value)}"`);
  return option;
}
function discriminatorMap(def) {
  const map2 = /* @__PURE__ */ new Map();
  for (const option of def.options) {
    const values = option._zod.propValues?.[def.discriminator];
    if (!values || values.size === 0)
      throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
    for (const value of values) {
      if (map2.has(value)) {
        if (value !== void 0)
          throw new Error(`Duplicate discriminator value "${String(value)}"`);
        map2.set(value, null);
      } else {
        map2.set(value, option);
      }
    }
  }
  return map2;
}
var $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
  def.inclusive = false;
  $ZodUnion.init(inst, def);
  const _super = inst._zod.parse;
  defineLazyInternal(inst, "propValues", (zod) => {
    const propValues = {};
    let undefinedCount = 0;
    for (const option of zod.def.options) {
      const pv = option._zod.propValues;
      if (!pv || Object.keys(pv).length === 0)
        throw new Error(`Invalid discriminated union option at index "${zod.def.options.indexOf(option)}"`);
      if (pv[zod.def.discriminator]?.has(void 0))
        undefinedCount++;
      for (const [k, v] of Object.entries(pv)) {
        if (!Object.prototype.hasOwnProperty.call(propValues, k)) {
          assignProp(propValues, k, /* @__PURE__ */ new Set());
        }
        for (const val of v) {
          propValues[k].add(val);
        }
      }
    }
    if (!zod.def.unionFallback && undefinedCount > 1)
      propValues[zod.def.discriminator]?.delete(void 0);
    return propValues;
  });
  def.options.forEach((option, i) => {
    const propShape = rawShape(option._zod.def);
    if (propShape && !Object.prototype.hasOwnProperty.call(propShape, def.discriminator)) {
      throw new Error(`Invalid discriminated union option at index "${i}"`);
    }
  });
  const disc = cached(() => discriminatorMap(def));
  inst._zod.parse = (payload, ctx) => {
    const input2 = payload.value;
    if (!isObject(input2)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "object",
        input: input2,
        inst
      });
      return payload;
    }
    const value = input2?.[def.discriminator];
    const opt = disc.value.get(value);
    if (opt && (value !== void 0 || ctx.direction !== "backward")) {
      return opt._zod.run(payload, ctx);
    }
    if (def.unionFallback || ctx.direction === "backward") {
      return _super(payload, ctx);
    }
    payload.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      discriminator: def.discriminator,
      options: Array.from(disc.value.keys()).filter((value2) => disc.value.get(value2) !== null),
      input: input2,
      path: [def.discriminator],
      inst
    });
    return payload;
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input2 = payload.value;
    const left = def.left._zod.run({ value: input2, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input2, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left2, right2]) => {
        return handleIntersectionResults(payload, left2, right2);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    if (Object.prototype.hasOwnProperty.call(newObj, "__proto__"))
      delete newObj.__proto__;
    for (const key of sharedKeys) {
      if (key === "__proto__")
        continue;
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = /* @__PURE__ */ new Map();
  let unrecIssue;
  const keyIssues = /* @__PURE__ */ new Map();
  const collect = (iss, side) => {
    let keys;
    if (iss.code === "unrecognized_keys" && !iss.path?.length) {
      unrecIssue ?? (unrecIssue = iss);
      keys = iss.keys;
    } else if (iss.code === "invalid_key" && iss.origin === "record" && iss.path?.length === 1) {
      const k = String(iss.path[0]);
      if (!keyIssues.has(k))
        keyIssues.set(k, iss);
      keys = [k];
    } else {
      return false;
    }
    for (const k of keys) {
      if (!unrecKeys.has(k))
        unrecKeys.set(k, {});
      unrecKeys.get(k)[side] = true;
    }
    return true;
  };
  for (const iss of left.issues) {
    if (!collect(iss, "l"))
      result.issues.push(iss);
  }
  for (const iss of right.issues) {
    if (!collect(iss, "r"))
      result.issues.push(iss);
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length) {
    const aggregated = unrecIssue ? bothKeys.filter((k) => unrecIssue.keys.includes(k)) : [];
    if (aggregated.length)
      result.issues.push({ ...unrecIssue, keys: aggregated });
    for (const k of bothKeys) {
      if (!aggregated.includes(k) && keyIssues.has(k))
        result.issues.push(keyIssues.get(k));
    }
  }
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    if (aborted(result))
      return result;
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodTuple = /* @__PURE__ */ $constructor("$ZodTuple", (inst, def) => {
  $ZodType.init(inst, def);
  const items = def.items;
  const memo2 = globalConfig.memoizer;
  memo2?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input2 = payload.value;
    if (!Array.isArray(input2)) {
      payload.issues.push({
        input: input2,
        inst,
        expected: "tuple",
        code: "invalid_type"
      });
      return payload;
    }
    payload.value = memo2 ? memo2.alloc(inst, payload, [], ctx) : [];
    const proms = [];
    const optinStart = getTupleOptStart(items, "optin");
    const optoutStart = getTupleOptStart(items, "optout");
    if (!def.rest) {
      if (input2.length < optinStart) {
        payload.issues.push({
          code: "too_small",
          minimum: optinStart,
          inclusive: true,
          input: input2,
          inst,
          origin: "array"
        });
        return payload;
      }
      if (input2.length > items.length) {
        payload.issues.push({
          code: "too_big",
          maximum: items.length,
          inclusive: true,
          input: input2,
          inst,
          origin: "array"
        });
      }
    }
    const itemResults = new Array(items.length);
    const abortEarly = def.rest ? ctx?.abortEarly : void 0;
    let itemAborted = false;
    for (let i = 0; i < items.length; i++) {
      const r = items[i]._zod.run({ value: input2[i], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((rr) => {
          itemResults[i] = rr;
        }));
      } else {
        itemResults[i] = r;
        if (abortEarly && !itemAborted && r.issues.length)
          itemAborted = aborted(r);
      }
    }
    if (def.rest && !itemAborted) {
      let i = items.length - 1;
      const rest = input2.slice(items.length);
      let seen = payload.issues.length;
      for (const el of rest) {
        if (abortEarly && payload.issues.length !== seen) {
          if (aborted(payload, seen))
            break;
          seen = payload.issues.length;
        }
        i++;
        const result = def.rest._zod.run({ value: el, issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((r) => handleTupleResult(r, payload, i)));
        } else {
          handleTupleResult(result, payload, i);
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => handleTupleResults(itemResults, payload, items, input2, optoutStart));
    }
    return handleTupleResults(itemResults, payload, items, input2, optoutStart);
  };
});
function getTupleOptStart(items, key) {
  for (let i = items.length - 1; i >= 0; i--) {
    const omittable = key === "optin" ? items[i]._zod.optin !== void 0 : items[i]._zod.optout === "optional";
    if (!omittable)
      return i + 1;
  }
  return 0;
}
function handleTupleResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
function handleTupleResults(itemResults, final, items, input2, optoutStart) {
  for (let i = 0; i < items.length; i++) {
    const r = itemResults[i];
    const isPresent = i < input2.length;
    if (!isPresent && i >= optoutStart && items[i]._zod.optin === "optional") {
      final.value.length = i;
      break;
    }
    if (r.issues.length) {
      if (!isPresent && i >= optoutStart) {
        final.value.length = i;
        break;
      }
      final.issues.push(...prefixIssues(i, r.issues));
    }
    final.value[i] = r.value;
  }
  for (let i = final.value.length - 1; i >= input2.length; i--) {
    if (items[i]._zod.optout === "optional" && final.value[i] === void 0) {
      final.value.length = i;
    } else {
      break;
    }
  }
  return final;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  const memo2 = globalConfig.memoizer;
  memo2?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input2 = payload.value;
    if (!isPlainObject(input2)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input: input2,
        inst
      });
      return payload;
    }
    const proms = [];
    const values = def.keyType._zod.values;
    if (values && !def.partial) {
      payload.value = memo2 ? memo2.alloc(inst, payload, {}, ctx) : {};
      const recordKeys = /* @__PURE__ */ new Set();
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          recordKeys.add(typeof key === "number" ? key.toString() : key);
          if (key === "__proto__")
            continue;
          const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
            continue;
          }
          const outKey = keyResult.value;
          if (outKey === "__proto__")
            continue;
          const result = def.valueType._zod.run({ value: input2[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key, result2.issues));
              }
              payload.value[outKey] = result2.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input2) {
        if (!recordKeys.has(key)) {
          if (def.mode === "loose") {
            if (key === "__proto__")
              continue;
            payload.value[key] = input2[key];
          } else {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          }
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input: input2,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    } else {
      payload.value = memo2 ? memo2.alloc(inst, payload, {}, ctx) : {};
      let unrecognized;
      for (const key of Reflect.ownKeys(input2)) {
        if (key === "__proto__")
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(input2, key))
          continue;
        let keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        const checkNumericKey = typeof key === "string" && number.test(key) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run({ value: Number(key), issues: [] }, ctx);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key] = input2[key];
          } else if (values) {
            unrecognized = unrecognized ?? [];
            unrecognized.push(key);
          } else {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
              input: key,
              path: [key],
              inst
            });
          }
          continue;
        }
        const outKey = keyResult.value;
        if (outKey === "__proto__")
          continue;
        const result = def.valueType._zod.run({ value: input2[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => {
            if (result2.issues.length) {
              payload.issues.push(...prefixIssues(key, result2.issues));
            }
            payload.value[outKey] = result2.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[outKey] = result.value;
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input: input2,
          inst,
          keys: unrecognized,
          continue: true
        });
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodMap = /* @__PURE__ */ $constructor("$ZodMap", (inst, def) => {
  $ZodType.init(inst, def);
  const memo2 = globalConfig.memoizer;
  memo2?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input2 = payload.value;
    if (!(input2 instanceof Map)) {
      payload.issues.push({
        expected: "map",
        code: "invalid_type",
        input: input2,
        inst
      });
      return payload;
    }
    const proms = [];
    payload.value = memo2 ? memo2.alloc(inst, payload, /* @__PURE__ */ new Map(), ctx) : /* @__PURE__ */ new Map();
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const [key, value] of input2) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
      const valueResult = def.valueType._zod.run({ value, issues: [] }, ctx);
      if (keyResult instanceof Promise || valueResult instanceof Promise) {
        proms.push(Promise.all([keyResult, valueResult]).then(([keyResult2, valueResult2]) => {
          handleMapResult(keyResult2, valueResult2, payload, key, input2, inst, ctx);
        }));
      } else {
        handleMapResult(keyResult, valueResult, payload, key, input2, inst, ctx);
      }
    }
    if (proms.length)
      return Promise.all(proms).then(() => payload);
    return payload;
  };
});
function handleMapResult(keyResult, valueResult, final, key, input2, inst, ctx) {
  if (keyResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, keyResult.issues));
    } else {
      final.issues.push({
        code: "invalid_key",
        origin: "map",
        input: input2,
        inst,
        issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      });
    }
  }
  if (valueResult.issues.length) {
    if (propertyKeyTypes.has(typeof key)) {
      final.issues.push(...prefixIssues(key, valueResult.issues));
    } else {
      final.issues.push({
        origin: "map",
        code: "invalid_element",
        input: input2,
        inst,
        key,
        issues: valueResult.issues.map((iss) => finalizeIssue(iss, ctx, config()))
      });
    }
  }
  final.value.set(keyResult.value, valueResult.value);
}
var $ZodSet = /* @__PURE__ */ $constructor("$ZodSet", (inst, def) => {
  $ZodType.init(inst, def);
  const memo2 = globalConfig.memoizer;
  memo2?.attach(inst);
  inst._zod.parse = (payload, ctx) => {
    const input2 = payload.value;
    if (!(input2 instanceof Set)) {
      payload.issues.push({
        input: input2,
        inst,
        expected: "set",
        code: "invalid_type"
      });
      return payload;
    }
    const proms = [];
    payload.value = memo2 ? memo2.alloc(inst, payload, /* @__PURE__ */ new Set(), ctx) : /* @__PURE__ */ new Set();
    const abortEarly = ctx?.abortEarly;
    let seen = payload.issues.length;
    for (const item of input2) {
      if (abortEarly && payload.issues.length !== seen) {
        if (aborted(payload, seen))
          break;
        seen = payload.issues.length;
      }
      const result = def.valueType._zod.run({ value: item, issues: [] }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleSetResult(result2, payload)));
      } else
        handleSetResult(result, payload);
    }
    if (proms.length)
      return Promise.all(proms).then(() => payload);
    return payload;
  };
});
function handleSetResult(result, final) {
  if (result.issues.length) {
    final.issues.push(...result.issues);
  }
  final.value.add(result.value);
}
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  defineLazyInternal(inst, "pattern", (zod) => {
    const patternValues = getEnumValues(zod.def.entries).filter((k) => propertyKeyTypes.has(typeof k));
    return new RegExp(patternValues.length ? `^(${patternValues.map((o) => escapeRegex(o.toString())).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input2 = payload.value;
    if (valuesSet.has(input2)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input: input2,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  const values = new Set(def.values);
  inst._zod.values = values;
  defineLazyInternal(inst, "pattern", (zod) => {
    const vals = zod.def.values;
    return new RegExp(vals.length ? `^(${vals.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$` : "^[^\\s\\S]$");
  });
  inst._zod.parse = (payload, _ctx) => {
    const input2 = payload.value;
    if (values.has(input2)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input: input2,
      inst
    });
    return payload;
  };
});
var $ZodFile = /* @__PURE__ */ $constructor("$ZodFile", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const input2 = payload.value;
    if (input2 instanceof File)
      return payload;
    payload.issues.push({
      expected: "file",
      code: "invalid_type",
      input: input2,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  globalConfig.memoizer?.guard(inst);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output2 = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output2.then((output3) => {
        payload.value = output3;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError();
    }
    payload.value = _out;
    return payload;
  };
});
function handleOptionalResult(payload, result) {
  payload.value = result.issues.length ? void 0 : result.value;
  return payload;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  inst._zod.optout = "optional";
  defineLazyInternal(inst, "values", (zod) => {
    const values = zod.def.innerType._zod.values;
    return values ? /* @__PURE__ */ new Set([...values, void 0]) : void 0;
  });
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === void 0) {
      if (def.innerType._zod.optin !== "defaulted")
        return payload;
      const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
      if (result instanceof Promise)
        return result.then((result2) => handleOptionalResult(payload, result2));
      return handleOptionalResult(payload, result);
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "pattern", (zod) => zod.def.innerType._zod.pattern);
  inst._zod.parse = (payload, ctx) => {
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "pattern", (zod) => {
    const pattern = zod.def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
  });
  defineLazyInternal(inst, "values", (zod) => {
    return zod.def.innerType._zod.values ? /* @__PURE__ */ new Set([...zod.def.innerType._zod.values, null]) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleDefaultResult(result2, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "defaulted";
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => {
    const v = zod.def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleNonOptionalResult(result2, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
var $ZodSuccess = /* @__PURE__ */ $constructor("$ZodSuccess", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError("ZodSuccess");
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.issues.length === 0;
        return payload;
      });
    }
    payload.value = result.issues.length === 0;
    return payload;
  };
});
function handleCatchResult(payload, result, def, ctx) {
  if (!result.issues.length) {
    payload.value = result.value;
    if (result.memo)
      payload.memo = true;
    return payload;
  }
  payload.value = def.catchValue({
    ...result,
    value: payload.value,
    error: {
      issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
    },
    input: payload.value
  });
  return payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType._zod.optin === "defaulted" ? "defaulted" : "optional");
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType._zod.optout);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run({ value: payload.value, issues: [] }, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleCatchResult(payload, result2, def, ctx));
    }
    return handleCatchResult(payload, result, def, ctx);
  };
});
var $ZodNaN = /* @__PURE__ */ $constructor("$ZodNaN", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    if (typeof payload.value !== "number" || !Number.isNaN(payload.value)) {
      payload.issues.push({
        input: payload.value,
        inst,
        expected: "nan",
        code: "invalid_type"
      });
      return payload;
    }
    return payload;
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right2) => handlePipeResult(right2, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.some((iss) => iss.code !== "unrecognized_keys")) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues }, ctx);
}
var $ZodCodec = /* @__PURE__ */ $constructor("$ZodCodec", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "values", (zod) => zod.def.in._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.in._zod.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.out._zod.optout);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    const direction = ctx.direction || "forward";
    if (direction === "forward") {
      const left = def.in._zod.run(payload, ctx);
      if (left instanceof Promise) {
        return left.then((left2) => handleCodecAResult(left2, def, ctx));
      }
      return handleCodecAResult(left, def, ctx);
    } else {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right2) => handleCodecAResult(right2, def, ctx));
      }
      return handleCodecAResult(right, def, ctx);
    }
  };
});
function handleCodecAResult(result, def, ctx) {
  if (result.issues.length) {
    result.aborted = true;
    return result;
  }
  const direction = ctx.direction || "forward";
  if (direction === "forward") {
    const transformed = def.transform(result.value, result);
    if (transformed instanceof Promise) {
      return transformed.then((value) => handleCodecTxResult(result, value, def.out, ctx));
    }
    return handleCodecTxResult(result, transformed, def.out, ctx);
  } else {
    const transformed = def.reverseTransform(result.value, result);
    if (transformed instanceof Promise) {
      return transformed.then((value) => handleCodecTxResult(result, value, def.in, ctx));
    }
    return handleCodecTxResult(result, transformed, def.in, ctx);
  }
}
function handleCodecTxResult(left, value, nextSchema, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return nextSchema._zod.run({ value, issues: left.issues }, ctx);
}
var $ZodPreprocess = /* @__PURE__ */ $constructor("$ZodPreprocess", (inst, def) => {
  $ZodPipe.init(inst, def);
});
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazyInternal(inst, "propValues", (zod) => zod.def.innerType._zod.propValues);
  defineLazyInternal(inst, "values", (zod) => zod.def.innerType._zod.values);
  defineLazyInternal(inst, "optin", (zod) => zod.def.innerType?._zod?.optin);
  defineLazyInternal(inst, "optout", (zod) => zod.def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  if (!payload.memo)
    payload.value = Object.freeze(payload.value);
  return payload;
}
function leafPattern(schema) {
  const def = schema._zod.def;
  let pattern = def.pattern;
  let isInt = !!def.format?.includes("int");
  let minimum;
  let maximum;
  for (const ch of def.checks ?? []) {
    const d = ch._zod.def;
    if (d.pattern)
      pattern = d.pattern;
    isInt || (isInt = !!d.format?.includes("int"));
    const lo = d.minimum ?? d.length;
    const hi = d.maximum ?? d.length;
    if (lo !== void 0 && (minimum === void 0 || lo > minimum))
      minimum = lo;
    if (hi !== void 0 && (maximum === void 0 || hi < maximum))
      maximum = hi;
  }
  if (pattern)
    return pattern.source;
  if (minimum !== void 0 && maximum !== void 0 && minimum > maximum)
    return "(?!)";
  if (minimum !== void 0 || maximum !== void 0)
    return string({ minimum, maximum }).source;
  const own2 = schema._zod.pattern;
  return (isInt && own2 === number ? integer : own2)?.source;
}
function partPattern(schema) {
  const def = schema._zod.def;
  const own2 = schema._zod.pattern?.source;
  const inner = def.innerType ?? schema._zod.innerType;
  if (inner) {
    const before = inner._zod.pattern?.source;
    const after = partPattern(inner);
    if (own2 && before && after && after !== before) {
      return own2.replace(cleanRegex(before), () => cleanRegex(after));
    }
    return own2;
  }
  if (def.options) {
    const sources = def.options.map(partPattern);
    if (sources.every(Boolean))
      return `^(${sources.map((s) => cleanRegex(s)).join("|")})$`;
  }
  return leafPattern(schema);
}
var $ZodTemplateLiteral = /* @__PURE__ */ $constructor("$ZodTemplateLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  const regexParts = [];
  for (const part of def.parts) {
    if (typeof part === "object" && part !== null) {
      const source = partPattern(part);
      if (!source) {
        throw new Error(`Invalid template literal part, no pattern found: ${[...part._zod.traits].shift()}`);
      }
      regexParts.push(cleanRegex(source));
    } else if (part === null || primitiveTypes.has(typeof part)) {
      regexParts.push(escapeRegex(`${part}`));
    } else {
      throw new Error(`Invalid template literal part: ${part}`);
    }
  }
  inst._zod.pattern = new RegExp(`^${regexParts.join("")}$`);
  inst._zod.parse = (payload, _ctx) => {
    if (typeof payload.value !== "string") {
      payload.issues.push({
        input: payload.value,
        inst,
        expected: "string",
        code: "invalid_type"
      });
      return payload;
    }
    inst._zod.pattern.lastIndex = 0;
    if (!inst._zod.pattern.test(payload.value)) {
      payload.issues.push({
        input: payload.value,
        inst,
        code: "invalid_format",
        format: def.format ?? "template_literal",
        pattern: inst._zod.pattern.source
      });
      return payload;
    }
    return payload;
  };
});
var $ZodFunction = /* @__PURE__ */ $constructor("$ZodFunction", (inst, def) => {
  $ZodType.init(inst, def);
  Object.defineProperty(inst, "_def", { value: def });
  inst._zod.def = def;
  inst.implement = (func) => {
    if (typeof func !== "function") {
      throw new Error("implement() must be called with a function");
    }
    return Object.defineProperty(function(...args) {
      const parsedArgs = inst._def.input ? parse(inst._def.input, args) : args;
      const result = Reflect.apply(func, this, parsedArgs);
      if (inst._def.output) {
        return parse(inst._def.output, result);
      }
      return result;
    }, "_zod", { value: inst._zod, enumerable: false });
  };
  inst.implementAsync = (func) => {
    if (typeof func !== "function") {
      throw new Error("implementAsync() must be called with a function");
    }
    return Object.defineProperty(async function(...args) {
      const parsedArgs = inst._def.input ? await parseAsync(inst._def.input, args) : args;
      const result = await Reflect.apply(func, this, parsedArgs);
      if (inst._def.output) {
        return await parseAsync(inst._def.output, result);
      }
      return result;
    }, "_zod", { value: inst._zod, enumerable: false });
  };
  inst._zod.parse = (payload, _ctx) => {
    if (typeof payload.value !== "function") {
      payload.issues.push({
        code: "invalid_type",
        expected: "function",
        input: payload.value,
        inst
      });
      return payload;
    }
    const hasPromiseOutput = inst._def.output && inst._def.output._zod.def.type === "promise";
    if (hasPromiseOutput) {
      payload.value = inst.implementAsync(payload.value);
    } else {
      payload.value = inst.implement(payload.value);
    }
    return payload;
  };
  inst.input = (...args) => {
    const F = inst.constructor;
    if (Array.isArray(args[0])) {
      return new F({
        type: "function",
        input: new $ZodTuple({
          type: "tuple",
          items: args[0],
          rest: args[1]
        }),
        output: inst._def.output
      });
    }
    return new F({
      type: "function",
      input: args[0],
      output: inst._def.output
    });
  };
  inst.output = (output2) => {
    const F = inst.constructor;
    return new F({
      type: "function",
      input: inst._def.input,
      output: output2
    });
  };
  return inst;
});
var $ZodPromise = /* @__PURE__ */ $constructor("$ZodPromise", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    return Promise.resolve(payload.value).then((inner) => def.innerType._zod.run({ value: inner, issues: [] }, ctx));
  };
});
var $ZodLazy = /* @__PURE__ */ $constructor("$ZodLazy", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "innerType", () => {
    const d = def;
    if (!d._cachedInner)
      d._cachedInner = def.getter();
    return d._cachedInner;
  });
  defineLazyInternal(inst, "pattern", (zod) => zod.innerType?._zod?.pattern);
  defineLazyInternal(inst, "propValues", (zod) => zod.innerType?._zod?.propValues);
  defineLazyInternal(inst, "optin", (zod) => zod.innerType?._zod?.optin ?? void 0);
  defineLazyInternal(inst, "optout", (zod) => zod.innerType?._zod?.optout ?? void 0);
  inst._zod.parse = (payload, ctx) => {
    const inner = inst._zod.innerType;
    return inner._zod.run(payload, ctx);
  };
});
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input2 = payload.value;
    const r = def.fn(input2);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input2, inst));
    }
    handleRefineResult(r, payload, input2, inst);
    return;
  };
});
function handleRefineResult(result, payload, input2, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input: input2,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
function handlePropertiesResult(result, payload, key) {
  if (result.issues.length) {
    payload.issues.push(...prefixIssues(key, result.issues));
  }
}
var $ZodProperties = /* @__PURE__ */ $constructor("$ZodProperties", (inst, def) => {
  $ZodType.init(inst, def);
  $ZodCheck.init(inst, def);
  const memo2 = globalConfig.memoizer;
  memo2?.attach(inst);
  let entries;
  const runShape = (payload, ctx) => {
    entries ?? (entries = Reflect.ownKeys(def.shape).map((key) => [key, def.shape[key]]));
    const input2 = payload.value;
    let proms;
    for (const [key, schema] of entries) {
      const result = schema._zod.run({ value: input2[key], issues: [] }, ctx);
      if (result instanceof Promise) {
        proms ?? (proms = []);
        proms.push(result.then((result2) => handlePropertiesResult(result2, payload, key)));
      } else {
        handlePropertiesResult(result, payload, key);
      }
    }
    if (proms)
      return Promise.all(proms).then(() => void 0);
    return void 0;
  };
  inst._zod.parse = (payload, ctx) => {
    const input2 = payload.value;
    if (input2 === null || typeof input2 !== "object" && typeof input2 !== "function") {
      payload.issues.push({ expected: "object", code: "invalid_type", input: input2, inst });
      return payload;
    }
    if (ctx.direction === "backward")
      ctx = { ...ctx, direction: "forward" };
    if (memo2)
      memo2.alloc(inst, payload, input2, ctx);
    const result = runShape(payload, ctx);
    return result instanceof Promise ? result.then(() => payload) : payload;
  };
  inst._zod.check = (payload) => {
    if (payload.value == null) {
      payload.issues.push({ expected: "object", code: "invalid_type", input: payload.value, inst });
      return void 0;
    }
    return runShape(payload, {});
  };
}, {
  *[Symbol.iterator]() {
    yield this;
  }
});

// node_modules/zod/v4/core/memoizer.js
var $ZodCyclicError = class extends Error {
  constructor() {
    super(`Cannot parse a reference cycle that closes through a transform`);
    this.name = "ZodCyclicError";
  }
};
var STATE = "~memo";
var NO_ISSUES = [];
function isRef(value) {
  return value !== null && (typeof value === "object" || typeof value === "function");
}
function cloneIssues(issues) {
  return issues.map((iss) => iss.path ? { ...iss, path: iss.path.slice() } : { ...iss });
}
var recursive = /* @__PURE__ */ new WeakMap();
var NONE = 0;
var ASSUMED = 1;
var PROVEN = 2;
function isRecursive(inst, stack, resolve) {
  const cached2 = recursive.get(inst);
  if (cached2 !== void 0)
    return cached2 ? PROVEN : NONE;
  if (stack.has(inst))
    return PROVEN;
  stack.add(inst);
  let result = NONE;
  const check2 = (child) => {
    if (result !== PROVEN && child?._zod) {
      const answer = isRecursive(child, stack, resolve);
      if (answer > result)
        result = answer;
    }
  };
  const shape = (sh, spread) => {
    let answer = NONE;
    for (const key of Reflect.ownKeys(sh)) {
      const desc = Object.getOwnPropertyDescriptor(sh, key);
      if (spread && !desc.enumerable)
        continue;
      const child = desc.get ? ASSUMED : desc.value?._zod ? isRecursive(desc.value, stack, resolve) : NONE;
      if (child > answer)
        answer = child;
    }
    return answer;
  };
  const merge2 = (answer) => {
    if (answer > result)
      result = answer;
  };
  const def = inst._zod.def;
  const kind = def.type;
  switch (kind) {
    case "object": {
      const raw = rawShape(def);
      merge2(raw ? shape(raw, true) : ASSUMED);
      check2(def.catchall);
      break;
    }
    case "properties":
      merge2(shape(def.shape, false));
      break;
    case "array":
      check2(def.element);
      break;
    case "tuple":
      for (const el of def.items)
        check2(el);
      check2(def.rest);
      break;
    case "record":
    case "map":
      check2(def.keyType);
      check2(def.valueType);
      break;
    case "set":
      check2(def.valueType);
      break;
    case "union":
      for (const el of def.options)
        check2(el);
      break;
    case "intersection":
      check2(def.left);
      check2(def.right);
      break;
    case "optional":
    case "nullable":
    case "default":
    case "prefault":
    case "catch":
    case "readonly":
    case "nonoptional":
    case "promise":
    case "success":
      check2(def.innerType);
      break;
    case "pipe":
      check2(def.in);
      check2(def.out);
      break;
    case "function":
      check2(def.input);
      check2(def.output);
      break;
    // `$ZodLazy` caches its inner on the def, so a resolved edge is followed exactly
    case "lazy": {
      const inner = def._cachedInner ?? (resolve ? inst._zod.innerType : void 0);
      merge2(inner ? isRecursive(inner, stack, false) : ASSUMED);
      break;
    }
    // a leaf by choice: `parts` are regex fragments, not data positions
    case "template_literal":
    // leaves
    case "string":
    case "number":
    case "int":
    case "boolean":
    case "bigint":
    case "symbol":
    case "undefined":
    case "null":
    case "void":
    case "never":
    case "any":
    case "unknown":
    case "date":
    case "nan":
    case "enum":
    case "literal":
    case "file":
    case "transform":
    case "custom":
      break;
    default: {
      kind;
      for (const key in def) {
        const desc = Object.getOwnPropertyDescriptor(def, key);
        if (!desc || desc.get)
          continue;
        const value = desc.value;
        if (!value || typeof value !== "object")
          continue;
        if (value._zod)
          check2(value);
        else if (Array.isArray(value))
          for (const el of value)
            check2(el);
      }
    }
  }
  stack.delete(inst);
  return settle(inst, result);
}
function settle(inst, answer) {
  if (answer !== ASSUMED)
    recursive.set(inst, answer === PROVEN);
  return answer;
}
function isRecursiveSchema(inst) {
  return isRecursive(inst, /* @__PURE__ */ new Set(), true) !== NONE;
}
function bucketFor(state, inst) {
  let bucket = state.buckets.get(inst);
  if (!bucket) {
    bucket = /* @__PURE__ */ new WeakMap();
    state.buckets.set(inst, bucket);
  }
  return bucket;
}
var handoff;
var open = [];
var memo = {
  alloc(_inst, payload, empty) {
    const bucket = handoff;
    if (!bucket)
      return empty;
    handoff = void 0;
    const entry = { value: empty, issues: null };
    bucket.set(payload.value, entry);
    open.push(entry);
    return empty;
  },
  guard(inst) {
    var _a3;
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = (payload, ctx) => {
        if (ctx.direction !== "backward" && isBackEdge(ctx, payload.value))
          throw new $ZodCyclicError();
        return base(payload, ctx);
      };
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  },
  attach(inst) {
    var _a3;
    let isRecursiveInst;
    let rechecked = false;
    let lastCtx;
    let lastBucket;
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred.push(() => {
      const base = inst._zod.parse;
      const wrapped = (payload, ctx) => {
        if (isRecursiveInst === void 0) {
          const walked = isRecursive(inst, /* @__PURE__ */ new Set(), false);
          if (walked === NONE) {
            inst._zod.parse = base;
            if (inst._zod.run === wrapped)
              inst._zod.run = base;
            return base(payload, ctx);
          }
          if (walked === PROVEN || rechecked)
            isRecursiveInst = true;
          else
            rechecked = true;
        }
        const input2 = payload.value;
        if (!isRef(input2))
          return base(payload, ctx);
        let state = ctx[STATE];
        if (!state) {
          state = { buckets: /* @__PURE__ */ new WeakMap(), backEdges: void 0 };
          ctx[STATE] = state;
        }
        let bucket;
        if (lastCtx === ctx) {
          bucket = lastBucket;
        } else {
          bucket = bucketFor(state, inst);
          lastCtx = ctx;
          lastBucket = bucket;
        }
        const hit = bucket.get(input2);
        if (hit) {
          payload.value = hit.value;
          if (hit.issues) {
            if (hit.issues.length)
              payload.issues.push(...cloneIssues(hit.issues));
          } else {
            payload.memo = true;
            state.backEdges ?? (state.backEdges = /* @__PURE__ */ new WeakSet());
            state.backEdges.add(hit.value);
          }
          return payload;
        }
        handoff = bucket;
        const depth = open.length;
        const result = base(payload, ctx);
        handoff = void 0;
        const entry = open.length > depth ? open.pop() : void 0;
        if (result instanceof Promise) {
          return result.then((r) => {
            if (entry)
              entry.issues = r.issues.length ? cloneIssues(r.issues) : NO_ISSUES;
            return r;
          });
        }
        if (entry)
          entry.issues = result.issues.length ? cloneIssues(result.issues) : NO_ISSUES;
        return result;
      };
      inst._zod.parse = wrapped;
      if (inst._zod.run === base)
        inst._zod.run = wrapped;
    });
  }
};
function memoizer() {
  return memo;
}
function isBackEdge(ctx, value) {
  const backEdges = ctx[STATE]?.backEdges;
  return backEdges !== void 0 && isRef(value) && backEdges.has(value);
}

// node_modules/zod/v4/locales/index.js
var locales_exports = {};
__export(locales_exports, {
  ar: () => ar_default,
  az: () => az_default,
  be: () => be_default,
  bg: () => bg_default,
  bn: () => bn_default,
  ca: () => ca_default,
  ckb: () => ckb_default,
  cs: () => cs_default,
  da: () => da_default,
  de: () => de_default,
  el: () => el_default,
  en: () => en_default,
  eo: () => eo_default,
  es: () => es_default,
  fa: () => fa_default,
  fi: () => fi_default,
  fr: () => fr_default,
  frCA: () => fr_CA_default,
  gu: () => gu_default,
  he: () => he_default,
  hi: () => hi_default,
  hr: () => hr_default,
  hu: () => hu_default,
  hy: () => hy_default,
  id: () => id_default,
  is: () => is_default,
  it: () => it_default,
  ja: () => ja_default,
  ka: () => ka_default,
  kh: () => kh_default,
  km: () => km_default,
  kn: () => kn_default,
  ko: () => ko_default,
  lt: () => lt_default,
  mk: () => mk_default,
  ms: () => ms_default,
  ne: () => ne_default,
  nl: () => nl_default,
  nn: () => nn_default,
  no: () => no_default,
  ota: () => ota_default,
  pl: () => pl_default,
  ps: () => ps_default,
  pt: () => pt_default,
  ptBR: () => pt_BR_default,
  ro: () => ro_default,
  ru: () => ru_default,
  sk: () => sk_default,
  sl: () => sl_default,
  sv: () => sv_default,
  ta: () => ta_default,
  tg: () => tg_default,
  th: () => th_default,
  tk: () => tk_default,
  tr: () => tr_default,
  ua: () => ua_default,
  uk: () => uk_default,
  ur: () => ur_default,
  uz: () => uz_default,
  vi: () => vi_default,
  yo: () => yo_default,
  zhCN: () => zh_CN_default,
  zhTW: () => zh_TW_default
});

// node_modules/zod/v4/locales/ar.js
var error = () => {
  const Sizable = {
    string: { unit: "\u062D\u0631\u0641", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" },
    file: { unit: "\u0628\u0627\u064A\u062A", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" },
    array: { unit: "\u0639\u0646\u0635\u0631", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" },
    set: { unit: "\u0639\u0646\u0635\u0631", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" },
    map: { unit: "\u0639\u0646\u0635\u0631", verb: "\u0623\u0646 \u064A\u062D\u0648\u064A" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0645\u062F\u062E\u0644",
    email: "\u0628\u0631\u064A\u062F \u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A",
    url: "\u0631\u0627\u0628\u0637",
    emoji: "\u0625\u064A\u0645\u0648\u062C\u064A",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u062A\u0627\u0631\u064A\u062E \u0648\u0648\u0642\u062A \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
    date: "\u062A\u0627\u0631\u064A\u062E \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
    time: "\u0648\u0642\u062A \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
    duration: "\u0645\u062F\u0629 \u0628\u0645\u0639\u064A\u0627\u0631 ISO",
    ipv4: "\u0639\u0646\u0648\u0627\u0646 IPv4",
    ipv6: "\u0639\u0646\u0648\u0627\u0646 IPv6",
    mac: "\u0639\u0646\u0648\u0627\u0646 MAC",
    cidrv4: "\u0645\u062F\u0649 \u0639\u0646\u0627\u0648\u064A\u0646 \u0628\u0635\u064A\u063A\u0629 IPv4",
    cidrv6: "\u0645\u062F\u0649 \u0639\u0646\u0627\u0648\u064A\u0646 \u0628\u0635\u064A\u063A\u0629 IPv6",
    base64: "\u0646\u064E\u0635 \u0628\u062A\u0631\u0645\u064A\u0632 base64-encoded",
    base64url: "\u0646\u064E\u0635 \u0628\u062A\u0631\u0645\u064A\u0632 base64url-encoded",
    json_string: "\u0646\u064E\u0635 \u0639\u0644\u0649 \u0647\u064A\u0626\u0629 JSON",
    e164: "\u0631\u0642\u0645 \u0647\u0627\u062A\u0641 \u0628\u0645\u0639\u064A\u0627\u0631 E.164",
    credit_card: "\u0631\u0642\u0645 \u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0627\u0626\u062A\u0645\u0627\u0646",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0645\u062F\u062E\u0644"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 instanceof ${issue2.expected}\u060C \u0648\u0644\u0643\u0646 \u062A\u0645 \u0625\u062F\u062E\u0627\u0644 ${received}`;
        }
        return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 ${expected}\u060C \u0648\u0644\u0643\u0646 \u062A\u0645 \u0625\u062F\u062E\u0627\u0644 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0645\u062F\u062E\u0644\u0627\u062A \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644\u0629: \u064A\u0641\u062A\u0631\u0636 \u0625\u062F\u062E\u0627\u0644 ${stringifyPrimitive(issue2.values[0])}`;
        return `\u0627\u062E\u062A\u064A\u0627\u0631 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062A\u0648\u0642\u0639 \u0627\u0646\u062A\u0642\u0627\u0621 \u0623\u062D\u062F \u0647\u0630\u0647 \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A: ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return ` \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0623\u0646 \u062A\u0643\u0648\u0646 ${issue2.origin ?? "\u0627\u0644\u0642\u064A\u0645\u0629"} ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631"}`;
        return `\u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0623\u0646 \u062A\u0643\u0648\u0646 ${issue2.origin ?? "\u0627\u0644\u0642\u064A\u0645\u0629"} ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0623\u0635\u063A\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0644\u0640 ${issue2.origin} \u0623\u0646 \u064A\u0643\u0648\u0646 ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u0623\u0635\u063A\u0631 \u0645\u0646 \u0627\u0644\u0644\u0627\u0632\u0645: \u064A\u0641\u062A\u0631\u0636 \u0644\u0640 ${issue2.origin} \u0623\u0646 \u064A\u0643\u0648\u0646 ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0628\u062F\u0623 \u0628\u0640 "${issue2.prefix}"`;
        if (_issue.format === "ends_with")
          return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0646\u062A\u0647\u064A \u0628\u0640 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u062A\u0636\u0645\u0651\u064E\u0646 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u0646\u064E\u0635 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0637\u0627\u0628\u0642 \u0627\u0644\u0646\u0645\u0637 ${_issue.pattern}`;
        return `${FormatDictionary[_issue.format] ?? issue2.format} \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644`;
      }
      case "not_multiple_of":
        return `\u0631\u0642\u0645 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644: \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0645\u0646 \u0645\u0636\u0627\u0639\u0641\u0627\u062A ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u0645\u0639\u0631\u0641${issue2.keys.length > 1 ? "\u0627\u062A" : ""} \u063A\u0631\u064A\u0628${issue2.keys.length > 1 ? "\u0629" : ""}: ${joinValues(issue2.keys, "\u060C ")}`;
      case "invalid_key":
        return `\u0645\u0639\u0631\u0641 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644 \u0641\u064A ${issue2.origin}`;
      case "invalid_union":
        return "\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644";
      case "invalid_element":
        return `\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644 \u0641\u064A ${issue2.origin}`;
      default:
        return "\u0645\u062F\u062E\u0644 \u063A\u064A\u0631 \u0645\u0642\u0628\u0648\u0644";
    }
  };
};
function ar_default() {
  return {
    localeError: error()
  };
}

// node_modules/zod/v4/locales/az.js
var error2 = () => {
  const Sizable = {
    string: { unit: "simvol", verb: "olmal\u0131d\u0131r" },
    file: { unit: "bayt", verb: "olmal\u0131d\u0131r" },
    array: { unit: "element", verb: "olmal\u0131d\u0131r" },
    set: { unit: "element", verb: "olmal\u0131d\u0131r" },
    map: { unit: "element", verb: "olmal\u0131d\u0131r" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    mac: "MAC address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    credit_card: "kredit kart\u0131 n\xF6mr\u0259si",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n instanceof ${issue2.expected}, daxil olan ${received}`;
        }
        return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n ${expected}, daxil olan ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Yanl\u0131\u015F d\u0259y\u0259r: g\xF6zl\u0259nil\u0259n ${stringifyPrimitive(issue2.values[0])}`;
        return `Yanl\u0131\u015F se\xE7im: a\u015Fa\u011F\u0131dak\u0131lardan biri olmal\u0131d\u0131r: ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\xC7ox b\xF6y\xFCk: g\xF6zl\u0259nil\u0259n ${issue2.origin ?? "d\u0259y\u0259r"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "element"}`;
        return `\xC7ox b\xF6y\xFCk: g\xF6zl\u0259nil\u0259n ${issue2.origin ?? "d\u0259y\u0259r"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\xC7ox ki\xE7ik: g\xF6zl\u0259nil\u0259n ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        return `\xC7ox ki\xE7ik: g\xF6zl\u0259nil\u0259n ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Yanl\u0131\u015F m\u0259tn: "${_issue.prefix}" il\u0259 ba\u015Flamal\u0131d\u0131r`;
        if (_issue.format === "ends_with")
          return `Yanl\u0131\u015F m\u0259tn: "${_issue.suffix}" il\u0259 bitm\u0259lidir`;
        if (_issue.format === "includes")
          return `Yanl\u0131\u015F m\u0259tn: "${_issue.includes}" daxil olmal\u0131d\u0131r`;
        if (_issue.format === "regex")
          return `Yanl\u0131\u015F m\u0259tn: ${_issue.pattern} \u015Fablonuna uy\u011Fun olmal\u0131d\u0131r`;
        return `Yanl\u0131\u015F ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Yanl\u0131\u015F \u0259d\u0259d: ${issue2.divisor} il\u0259 b\xF6l\xFCn\u0259 bil\u0259n olmal\u0131d\u0131r`;
      case "unrecognized_keys":
        return `Tan\u0131nmayan a\xE7ar${issue2.keys.length > 1 ? "lar" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} daxilind\u0259 yanl\u0131\u015F a\xE7ar`;
      case "invalid_union":
        return "Yanl\u0131\u015F d\u0259y\u0259r";
      case "invalid_element":
        return `${issue2.origin} daxilind\u0259 yanl\u0131\u015F d\u0259y\u0259r`;
      default:
        return `Yanl\u0131\u015F d\u0259y\u0259r`;
    }
  };
};
function az_default() {
  return {
    localeError: error2()
  };
}

// node_modules/zod/v4/locales/be.js
function getBelarusianPlural(count, one, few, many) {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  return many;
}
var error3 = () => {
  const Sizable = {
    string: {
      unit: {
        one: "\u0441\u0456\u043C\u0432\u0430\u043B",
        few: "\u0441\u0456\u043C\u0432\u0430\u043B\u044B",
        many: "\u0441\u0456\u043C\u0432\u0430\u043B\u0430\u045E"
      },
      verb: "\u043C\u0435\u0446\u044C"
    },
    array: {
      unit: {
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u045E"
      },
      verb: "\u043C\u0435\u0446\u044C"
    },
    set: {
      unit: {
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u045E"
      },
      verb: "\u043C\u0435\u0446\u044C"
    },
    map: {
      unit: {
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u045E"
      },
      verb: "\u043C\u0435\u0446\u044C"
    },
    file: {
      unit: {
        one: "\u0431\u0430\u0439\u0442",
        few: "\u0431\u0430\u0439\u0442\u044B",
        many: "\u0431\u0430\u0439\u0442\u0430\u045E"
      },
      verb: "\u043C\u0435\u0446\u044C"
    }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0443\u0432\u043E\u0434",
    email: "email \u0430\u0434\u0440\u0430\u0441",
    url: "URL",
    emoji: "\u044D\u043C\u043E\u0434\u0437\u0456",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0434\u0430\u0442\u0430 \u0456 \u0447\u0430\u0441",
    date: "ISO \u0434\u0430\u0442\u0430",
    time: "ISO \u0447\u0430\u0441",
    duration: "ISO \u043F\u0440\u0430\u0446\u044F\u0433\u043B\u0430\u0441\u0446\u044C",
    ipv4: "IPv4 \u0430\u0434\u0440\u0430\u0441",
    ipv6: "IPv6 \u0430\u0434\u0440\u0430\u0441",
    mac: "MAC \u0430\u0434\u0440\u0430\u0441",
    cidrv4: "IPv4 \u0434\u044B\u044F\u043F\u0430\u0437\u043E\u043D",
    cidrv6: "IPv6 \u0434\u044B\u044F\u043F\u0430\u0437\u043E\u043D",
    base64: "\u0440\u0430\u0434\u043E\u043A \u0443 \u0444\u0430\u0440\u043C\u0430\u0446\u0435 base64",
    base64url: "\u0440\u0430\u0434\u043E\u043A \u0443 \u0444\u0430\u0440\u043C\u0430\u0446\u0435 base64url",
    json_string: "JSON \u0440\u0430\u0434\u043E\u043A",
    e164: "\u043D\u0443\u043C\u0430\u0440 E.164",
    credit_card: "\u043D\u0443\u043C\u0430\u0440 \u043A\u0440\u044D\u0434\u044B\u0442\u043D\u0430\u0439 \u043A\u0430\u0440\u0442\u044B",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0443\u0432\u043E\u0434"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u043B\u0456\u043A",
    array: "\u043C\u0430\u0441\u0456\u045E"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u045E\u0441\u044F instanceof ${issue2.expected}, \u0430\u0442\u0440\u044B\u043C\u0430\u043D\u0430 ${received}`;
        }
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u045E\u0441\u044F ${expected}, \u0430\u0442\u0440\u044B\u043C\u0430\u043D\u0430 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F ${stringifyPrimitive(issue2.values[0])}`;
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0432\u0430\u0440\u044B\u044F\u043D\u0442: \u0447\u0430\u043A\u0430\u045E\u0441\u044F \u0430\u0434\u0437\u0456\u043D \u0437 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const maxValue = Number(issue2.maximum);
          const unit = getBelarusianPlural(maxValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u0432\u044F\u043B\u0456\u043A\u0456: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435"} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 ${sizing.verb} ${adj}${issue2.maximum.toString()} ${unit}`;
        }
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u0432\u044F\u043B\u0456\u043A\u0456: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435"} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 \u0431\u044B\u0446\u044C ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const minValue = Number(issue2.minimum);
          const unit = getBelarusianPlural(minValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u043C\u0430\u043B\u044B: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 ${sizing.verb} ${adj}${issue2.minimum.toString()} ${unit}`;
        }
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u0430 \u043C\u0430\u043B\u044B: \u0447\u0430\u043A\u0430\u043B\u0430\u0441\u044F, \u0448\u0442\u043E ${issue2.origin} \u043F\u0430\u0432\u0456\u043D\u043D\u0430 \u0431\u044B\u0446\u044C ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u043F\u0430\u0447\u044B\u043D\u0430\u0446\u0446\u0430 \u0437 "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0437\u0430\u043A\u0430\u043D\u0447\u0432\u0430\u0446\u0446\u0430 \u043D\u0430 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0437\u043C\u044F\u0448\u0447\u0430\u0446\u044C "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u0440\u0430\u0434\u043E\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0430\u0434\u043F\u0430\u0432\u044F\u0434\u0430\u0446\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u043B\u0456\u043A: \u043F\u0430\u0432\u0456\u043D\u0435\u043D \u0431\u044B\u0446\u044C \u043A\u0440\u0430\u0442\u043D\u044B\u043C ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u041D\u0435\u0440\u0430\u0441\u043F\u0430\u0437\u043D\u0430\u043D\u044B ${issue2.keys.length > 1 ? "\u043A\u043B\u044E\u0447\u044B" : "\u043A\u043B\u044E\u0447"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u043A\u043B\u044E\u0447 \u0443 ${issue2.origin}`;
      case "invalid_union":
        return "\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434";
      case "invalid_element":
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u0430\u0435 \u0437\u043D\u0430\u0447\u044D\u043D\u043D\u0435 \u045E ${issue2.origin}`;
      default:
        return `\u041D\u044F\u043F\u0440\u0430\u0432\u0456\u043B\u044C\u043D\u044B \u045E\u0432\u043E\u0434`;
    }
  };
};
function be_default() {
  return {
    localeError: error3()
  };
}

// node_modules/zod/v4/locales/bg.js
var error4 = () => {
  const Sizable = {
    string: { unit: "\u0441\u0438\u043C\u0432\u043E\u043B\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" },
    file: { unit: "\u0431\u0430\u0439\u0442\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" },
    array: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" },
    set: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" },
    map: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430", verb: "\u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0432\u0445\u043E\u0434",
    email: "\u0438\u043C\u0435\u0439\u043B \u0430\u0434\u0440\u0435\u0441",
    url: "URL",
    emoji: "\u0435\u043C\u043E\u0434\u0436\u0438",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0432\u0440\u0435\u043C\u0435",
    date: "ISO \u0434\u0430\u0442\u0430",
    time: "ISO \u0432\u0440\u0435\u043C\u0435",
    duration: "ISO \u043F\u0440\u043E\u0434\u044A\u043B\u0436\u0438\u0442\u0435\u043B\u043D\u043E\u0441\u0442",
    ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441",
    ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441",
    mac: "MAC \u0430\u0434\u0440\u0435\u0441",
    cidrv4: "IPv4 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
    cidrv6: "IPv6 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
    base64: "base64-\u043A\u043E\u0434\u0438\u0440\u0430\u043D \u043D\u0438\u0437",
    base64url: "base64url-\u043A\u043E\u0434\u0438\u0440\u0430\u043D \u043D\u0438\u0437",
    json_string: "JSON \u043D\u0438\u0437",
    e164: "E.164 \u043D\u043E\u043C\u0435\u0440",
    credit_card: "\u043D\u043E\u043C\u0435\u0440 \u043D\u0430 \u043A\u0440\u0435\u0434\u0438\u0442\u043D\u0430 \u043A\u0430\u0440\u0442\u0430",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0432\u0445\u043E\u0434"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0447\u0438\u0441\u043B\u043E",
    array: "\u043C\u0430\u0441\u0438\u0432"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D instanceof ${issue2.expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D ${received}`;
        }
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D ${expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434: \u043E\u0447\u0430\u043A\u0432\u0430\u043D ${stringifyPrimitive(issue2.values[0])}`;
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430 \u043E\u043F\u0446\u0438\u044F: \u043E\u0447\u0430\u043A\u0432\u0430\u043D\u043E \u0435\u0434\u043D\u043E \u043E\u0442 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0422\u0432\u044A\u0440\u0434\u0435 \u0433\u043E\u043B\u044F\u043C\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue2.origin ?? "\u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442"} \u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0430"}`;
        return `\u0422\u0432\u044A\u0440\u0434\u0435 \u0433\u043E\u043B\u044F\u043C\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue2.origin ?? "\u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442"} \u0434\u0430 \u0431\u044A\u0434\u0435 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0422\u0432\u044A\u0440\u0434\u0435 \u043C\u0430\u043B\u043A\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue2.origin} \u0434\u0430 \u0441\u044A\u0434\u044A\u0440\u0436\u0430 ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u0422\u0432\u044A\u0440\u0434\u0435 \u043C\u0430\u043B\u043A\u043E: \u043E\u0447\u0430\u043A\u0432\u0430 \u0441\u0435 ${issue2.origin} \u0434\u0430 \u0431\u044A\u0434\u0435 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0437\u0430\u043F\u043E\u0447\u0432\u0430 \u0441 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0437\u0430\u0432\u044A\u0440\u0448\u0432\u0430 \u0441 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0432\u043A\u043B\u044E\u0447\u0432\u0430 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043D\u0438\u0437: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0441\u044A\u0432\u043F\u0430\u0434\u0430 \u0441 ${_issue.pattern}`;
        let invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D";
        if (_issue.format === "emoji")
          invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
        if (_issue.format === "datetime")
          invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
        if (_issue.format === "date")
          invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430";
        if (_issue.format === "time")
          invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E";
        if (_issue.format === "duration")
          invalid_adj = "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430";
        return `${invalid_adj} ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u043E \u0447\u0438\u0441\u043B\u043E: \u0442\u0440\u044F\u0431\u0432\u0430 \u0434\u0430 \u0431\u044A\u0434\u0435 \u043A\u0440\u0430\u0442\u043D\u043E \u043D\u0430 ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u041D\u0435\u0440\u0430\u0437\u043F\u043E\u0437\u043D\u0430\u0442${issue2.keys.length > 1 ? "\u0438" : ""} \u043A\u043B\u044E\u0447${issue2.keys.length > 1 ? "\u043E\u0432\u0435" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u043A\u043B\u044E\u0447 \u0432 ${issue2.origin}`;
      case "invalid_union":
        return "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434";
      case "invalid_element":
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u0430 \u0441\u0442\u043E\u0439\u043D\u043E\u0441\u0442 \u0432 ${issue2.origin}`;
      default:
        return `\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u0435\u043D \u0432\u0445\u043E\u0434`;
    }
  };
};
function bg_default() {
  return {
    localeError: error4()
  };
}

// node_modules/zod/v4/locales/bn.js
var error5 = () => {
  const Sizable = {
    string: { unit: "\u0985\u0995\u09CD\u09B7\u09B0", verb: "\u09A5\u09BE\u0995\u09A4\u09C7 \u09B9\u09AC\u09C7" },
    file: { unit: "\u09AC\u09BE\u0987\u099F", verb: "\u09A5\u09BE\u0995\u09A4\u09C7 \u09B9\u09AC\u09C7" },
    array: { unit: "\u0986\u0987\u099F\u09C7\u09AE", verb: "\u09A5\u09BE\u0995\u09A4\u09C7 \u09B9\u09AC\u09C7" },
    set: { unit: "\u0986\u0987\u099F\u09C7\u09AE", verb: "\u09A5\u09BE\u0995\u09A4\u09C7 \u09B9\u09AC\u09C7" },
    map: { unit: "\u098F\u09A8\u09CD\u099F\u09CD\u09B0\u09BF", verb: "\u09A5\u09BE\u0995\u09A4\u09C7 \u09B9\u09AC\u09C7" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0987\u09A8\u09AA\u09C1\u099F",
    email: "\u0987\u09AE\u09C7\u0987\u09B2 \u09A0\u09BF\u0995\u09BE\u09A8\u09BE",
    url: "URL",
    emoji: "\u0987\u09AE\u09CB\u099C\u09BF",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u09A4\u09BE\u09B0\u09BF\u0996 \u0993 \u09B8\u09AE\u09AF\u09BC",
    date: "ISO \u09A4\u09BE\u09B0\u09BF\u0996",
    time: "ISO \u09B8\u09AE\u09AF\u09BC",
    duration: "ISO \u09B8\u09AE\u09AF\u09BC\u0995\u09BE\u09B2",
    ipv4: "IPv4 \u09A0\u09BF\u0995\u09BE\u09A8\u09BE",
    ipv6: "IPv6 \u09A0\u09BF\u0995\u09BE\u09A8\u09BE",
    mac: "MAC \u09A0\u09BF\u0995\u09BE\u09A8\u09BE",
    cidrv4: "IPv4 \u09B0\u09C7\u099E\u09CD\u099C",
    cidrv6: "IPv6 \u09B0\u09C7\u099E\u09CD\u099C",
    base64: "base64-\u098F\u09A8\u0995\u09CB\u09A1\u09C7\u09A1 \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u0982",
    base64url: "base64url-\u098F\u09A8\u0995\u09CB\u09A1\u09C7\u09A1 \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u0982",
    json_string: "JSON \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u0982",
    e164: "E.164 \u09A8\u09AE\u09CD\u09AC\u09B0",
    credit_card: "\u0995\u09CD\u09B0\u09C7\u09A1\u09BF\u099F \u0995\u09BE\u09B0\u09CD\u09A1 \u09A8\u09AE\u09CD\u09AC\u09B0",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0987\u09A8\u09AA\u09C1\u099F"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        return `\u0985\u09AC\u09C8\u09A7 \u0987\u09A8\u09AA\u09C1\u099F: \u09AA\u09CD\u09B0\u09A4\u09CD\u09AF\u09BE\u09B6\u09BF\u09A4 ${expected}, \u09AA\u09CD\u09B0\u09BE\u09AA\u09CD\u09A4 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0985\u09AC\u09C8\u09A7 \u0987\u09A8\u09AA\u09C1\u099F: \u09AA\u09CD\u09B0\u09A4\u09CD\u09AF\u09BE\u09B6\u09BF\u09A4 ${stringifyPrimitive(issue2.values[0])}`;
        return `\u0985\u09AC\u09C8\u09A7 \u0985\u09AA\u09B6\u09A8: ${joinValues(issue2.values, " | ")} \u098F\u09B0 \u09AE\u09A7\u09CD\u09AF\u09C7 \u098F\u0995\u099F\u09BF \u09AA\u09CD\u09B0\u09A4\u09CD\u09AF\u09BE\u09B6\u09BF\u09A4`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0985\u09A8\u09C7\u0995 \u09AC\u09A1\u09BC: ${issue2.origin ?? "\u09AE\u09BE\u09A8"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u098F\u09B2\u09BF\u09AE\u09C7\u09A8\u09CD\u099F"} \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7`;
        return `\u0985\u09A8\u09C7\u0995 \u09AC\u09A1\u09BC: ${issue2.origin ?? "\u09AE\u09BE\u09A8"} ${adj}${issue2.maximum.toString()} \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0985\u09A8\u09C7\u0995 \u099B\u09CB\u099F: ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7`;
        }
        return `\u0985\u09A8\u09C7\u0995 \u099B\u09CB\u099F: ${issue2.origin} ${adj}${issue2.minimum.toString()} \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0985\u09AC\u09C8\u09A7 \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u0982: "${_issue.prefix}" \u09A6\u09BF\u09AF\u09BC\u09C7 \u09B6\u09C1\u09B0\u09C1 \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7`;
        }
        if (_issue.format === "ends_with")
          return `\u0985\u09AC\u09C8\u09A7 \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u0982: "${_issue.suffix}" \u09A6\u09BF\u09AF\u09BC\u09C7 \u09B6\u09C7\u09B7 \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7`;
        if (_issue.format === "includes")
          return `\u0985\u09AC\u09C8\u09A7 \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u0982: "${_issue.includes}" \u0985\u09A8\u09CD\u09A4\u09B0\u09CD\u09AD\u09C1\u0995\u09CD\u09A4 \u09A5\u09BE\u0995\u09A4\u09C7 \u09B9\u09AC\u09C7`;
        if (_issue.format === "regex")
          return `\u0985\u09AC\u09C8\u09A7 \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u0982: ${_issue.pattern} \u09AA\u09CD\u09AF\u09BE\u099F\u09BE\u09B0\u09CD\u09A8 \u09AE\u09BF\u09B2\u09A4\u09C7 \u09B9\u09AC\u09C7`;
        return `\u0985\u09AC\u09C8\u09A7 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u0985\u09AC\u09C8\u09A7 \u09A8\u09AE\u09CD\u09AC\u09B0: ${issue2.divisor} \u098F\u09B0 \u0997\u09C1\u09A3\u09BF\u09A4\u0995 \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7`;
      case "unrecognized_keys":
        return `\u0985\u099A\u09C7\u09A8\u09BE \u0995\u09C0${issue2.keys.length > 1 ? "\u0997\u09C1\u09B2\u09CB" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} \u098F \u0985\u09AC\u09C8\u09A7 \u0995\u09C0`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `\u0985\u09AC\u09C8\u09A7 \u09A1\u09BF\u09B8\u0995\u09CD\u09B0\u09BF\u09AE\u09BF\u09A8\u09C7\u099F\u09B0 \u09AE\u09BE\u09A8\u0964 \u09AA\u09CD\u09B0\u09A4\u09CD\u09AF\u09BE\u09B6\u09BF\u09A4 ${opts}`;
        }
        return "\u0985\u09AC\u09C8\u09A7 \u0987\u09A8\u09AA\u09C1\u099F";
      case "invalid_element":
        return `${issue2.origin} \u098F \u0985\u09AC\u09C8\u09A7 \u09AE\u09BE\u09A8`;
      default:
        return "\u0985\u09AC\u09C8\u09A7 \u0987\u09A8\u09AA\u09C1\u099F";
    }
  };
};
function bn_default() {
  return {
    localeError: error5()
  };
}

// node_modules/zod/v4/locales/ca.js
var error6 = () => {
  const Sizable = {
    string: { unit: "car\xE0cters", verb: "contenir" },
    file: { unit: "bytes", verb: "contenir" },
    array: { unit: "elements", verb: "contenir" },
    set: { unit: "elements", verb: "contenir" },
    map: { unit: "elements", verb: "contenir" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "entrada",
    email: "adre\xE7a electr\xF2nica",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "data i hora ISO",
    date: "data ISO",
    time: "hora ISO",
    duration: "durada ISO",
    ipv4: "adre\xE7a IPv4",
    ipv6: "adre\xE7a IPv6",
    mac: "adre\xE7a MAC",
    cidrv4: "rang IPv4",
    cidrv6: "rang IPv6",
    base64: "cadena codificada en base64",
    base64url: "cadena codificada en base64url",
    json_string: "cadena JSON",
    e164: "n\xFAmero E.164",
    credit_card: "n\xFAmero de targeta de cr\xE8dit",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "entrada"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Tipus inv\xE0lid: s'esperava instanceof ${issue2.expected}, s'ha rebut ${received}`;
        }
        return `Tipus inv\xE0lid: s'esperava ${expected}, s'ha rebut ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Valor inv\xE0lid: s'esperava ${stringifyPrimitive(issue2.values[0])}`;
        return `Opci\xF3 inv\xE0lida: s'esperava una de ${joinValues(issue2.values, " o ")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "com a m\xE0xim" : "menys de";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Massa gran: s'esperava que ${issue2.origin ?? "el valor"} contingu\xE9s ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
        return `Massa gran: s'esperava que ${issue2.origin ?? "el valor"} fos ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "com a m\xEDnim" : "m\xE9s de";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Massa petit: s'esperava que ${issue2.origin} contingu\xE9s ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Massa petit: s'esperava que ${issue2.origin} fos ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Format inv\xE0lid: ha de comen\xE7ar amb "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Format inv\xE0lid: ha d'acabar amb "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Format inv\xE0lid: ha d'incloure "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Format inv\xE0lid: ha de coincidir amb el patr\xF3 ${_issue.pattern}`;
        return `Format inv\xE0lid per a ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `N\xFAmero inv\xE0lid: ha de ser m\xFAltiple de ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Clau${issue2.keys.length > 1 ? "s" : ""} no reconeguda${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Clau inv\xE0lida a ${issue2.origin}`;
      case "invalid_union":
        return "Entrada inv\xE0lida";
      // Could also be "Tipus d'unió invàlid" but "Entrada invàlida" is more general
      case "invalid_element":
        return `Element inv\xE0lid a ${issue2.origin}`;
      default:
        return `Entrada inv\xE0lida`;
    }
  };
};
function ca_default() {
  return {
    localeError: error6()
  };
}

// node_modules/zod/v4/locales/ckb.js
var error7 = () => {
  const Sizable = {
    string: { unit: "\u067E\u06CC\u062A", verb: "\u0628\u06CE\u062A" },
    file: { unit: "\u0628\u0627\u06CC\u062A", verb: "\u0628\u06CE\u062A" },
    array: { unit: "\u062F\u0627\u0646\u06D5", verb: "\u0628\u06CE\u062A" },
    set: { unit: "\u062F\u0627\u0646\u06D5", verb: "\u0628\u06CE\u062A" },
    map: { unit: "\u062F\u0627\u0646\u06D5", verb: "\u0628\u06CE\u062A" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "regex",
    email: "\u0626\u06CC\u0645\u06D5\u06CC\u06B5",
    url: "\u0628\u06D5\u0633\u062A\u06D5\u0631 (URL)",
    emoji: "\u0626\u06CC\u0645\u06C6\u062C\u06CC",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u0695\u06CE\u06A9\u06D5\u0648\u062A \u0648 \u06A9\u0627\u062A",
    date: "\u0695\u06CE\u06A9\u06D5\u0648\u062A",
    time: "\u06A9\u0627\u062A",
    duration: "\u0645\u0627\u0648\u06D5",
    ipv4: "\u0646\u0627\u0648\u0646\u06CC\u0634\u0627\u0646\u06CC IPv4",
    ipv6: "\u0646\u0627\u0648\u0646\u06CC\u0634\u0627\u0646\u06CC IPv6",
    mac: "\u0646\u0627\u0648\u0646\u06CC\u0634\u0627\u0646\u06CC MAC",
    cidrv4: "\u0645\u06D5\u0648\u062F\u0627\u06CC IPv4",
    cidrv6: "\u0645\u06D5\u0648\u062F\u0627\u06CC IPv6",
    base64: "\u062F\u06D5\u0642\u06CC base64",
    base64url: "\u062F\u06D5\u0642\u06CC base64url",
    json_string: "\u062F\u06D5\u0642\u06CC JSON",
    e164: "\u0698\u0645\u0627\u0631\u06D5\u06CC E.164",
    credit_card: "\u0698\u0645\u0627\u0631\u06D5\u06CC \u06A9\u0627\u0631\u062A\u06CC \u06A9\u0631\u06CE\u062F\u06CC\u062A",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u062A\u06CE\u06A9\u0631\u062F\u06D5"
  };
  const TypeDictionary = {
    nan: "NaN",
    string: "\u0646\u0648\u0648\u0633\u06CC\u0646",
    number: "\u0698\u0645\u0627\u0631\u06D5",
    boolean: "boolean",
    array: "array",
    object: "object",
    date: "\u0695\u06CE\u06A9\u06D5\u0648\u062A",
    integer: "\u0698\u0645\u0627\u0631\u06D5",
    float: "\u0698\u0645\u0627\u0631\u06D5",
    null: "null",
    undefined: "undefined",
    function: "function",
    symbol: "symbol",
    unknown: "unknown",
    promise: "promise",
    void: "void",
    never: "never",
    map: "map",
    set: "set"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        const postfix = ["\u0627", "\u0648", "\u06C6", "\u0648\u0648", "\u06D5", "\u06CC", "\u06CE"].some((p) => received.endsWith(p)) ? "\u06CC\u06D5" : "\u06D5";
        const isEnglish = /^[a-zA-Z]+$/.test(received);
        if (receivedType === "null" || receivedType === "undefined")
          return `\u062F\u0627\u0648\u0627\u06A9\u0631\u0627\u0648\u06D5`;
        return `\u0686\u0627\u0648\u06D5\u0695\u0648\u0627\u0646\u06A9\u0631\u0627\u0648\u06D5 ${expected} \u0628\u06CE\u062A\u060C \u0628\u06D5\u06B5\u0627\u0645 ${received}${isEnglish ? "" : postfix}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0628\u06D5\u0647\u0627\u06A9\u06D5 \u0646\u0627\u062F\u0631\u0648\u0648\u0633\u062A\u06D5: \u0686\u0627\u0648\u06D5\u0695\u0648\u0627\u0646\u06A9\u0631\u0627\u0648\u06D5 ${stringifyPrimitive(issue2.values[0])} \u0628\u06CE\u062A`;
        return `\u0647\u06D5\u06B5\u0628\u0698\u0627\u0631\u062F\u06D5\u06CC \u0646\u0627\u062F\u0631\u0648\u0633\u062A: \u0686\u0627\u0648\u06D5\u0695\u0648\u0627\u0646\u06A9\u0631\u0627\u0648\u06D5 \u06CC\u06D5\u06A9\u06CE\u06A9 \u0628\u06CE\u062A \u0644\u06D5 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u067E\u06CE\u0648\u06CC\u0633\u062A\u06D5 \u0628\u06D5 \u0644\u0627\u06CC\u06D5\u0646\u06CC \u0632\u06C6\u0631\u06D5\u0648\u06D5 ${issue2.maximum.toString()} ${sizing.unit} ${sizing.verb}`;
        return `\u067E\u06CE\u0648\u06CC\u0633\u062A\u06D5 \u0628\u06D5 \u0644\u0627\u06CC\u06D5\u0646\u06CC \u0632\u06C6\u0631\u06D5\u0648\u06D5 ${issue2.maximum.toString()} \u0628\u06CE\u062A`;
      }
      case "too_small": {
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u067E\u06CE\u0648\u06CC\u0633\u062A\u06D5 \u0628\u06D5 \u0644\u0627\u06CC\u06D5\u0646\u06CC \u06A9\u06D5\u0645\u06D5\u0648\u06D5 ${issue2.minimum.toString()} ${sizing.unit} ${sizing.verb}`;
        return `\u067E\u06CE\u0648\u06CC\u0633\u062A\u06D5 \u0628\u06D5 \u0644\u0627\u06CC\u06D5\u0646\u06CC \u06A9\u06D5\u0645\u06D5\u0648\u06D5 ${issue2.minimum.toString()} \u0628\u06CE\u062A`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u062F\u06D5\u0642\u06CC \u0646\u0627\u062F\u0631\u0648\u0633\u062A: \u067E\u06CE\u0648\u06CC\u0633\u062A\u06D5 \u062F\u06D5\u0633\u062A\u067E\u06CE\u0628\u06A9\u0627\u062A \u0628\u06D5 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u062F\u06D5\u0642\u06CC \u0646\u0627\u062F\u0631\u0648\u0633\u062A: \u067E\u06CE\u0648\u06CC\u0633\u062A\u06D5 \u06A9\u06C6\u062A\u0627\u06CC\u06CC\u0628\u06CE\u062A \u0628\u06D5 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u062F\u06D5\u0642\u06CC \u0646\u0627\u062F\u0631\u0648\u0633\u062A: \u067E\u06CE\u0648\u06CC\u0633\u062A\u06D5 "${_issue.includes}" \u0644\u06D5\u062E\u06C6\u0628\u06AF\u0631\u06CE\u062A`;
        if (_issue.format === "regex")
          return `\u062F\u06D5\u0642\u06CC \u0646\u0627\u062F\u0631\u0648\u0633\u062A: \u067E\u06CE\u0648\u06CC\u0633\u062A\u06D5 \u0644\u06D5\u06AF\u06D5\u06B5 \u067E\u0627\u062A\u06CE\u0631\u0646\u06CC ${_issue.pattern} \u0628\u06AF\u0648\u0646\u062C\u06CE\u062A`;
        return `\u0628\u06D5\u0647\u0627\u06CC ${FormatDictionary[_issue.format] ?? issue2.format} \u0646\u0627\u062F\u0631\u0648\u0633\u062A\u06D5`;
      }
      case "not_multiple_of":
        return `\u0698\u0645\u0627\u0631\u06D5\u06CC \u0646\u0627\u062F\u0631\u0648\u0633\u062A: \u062F\u06D5\u0628\u06CE\u062A \u0686\u06D5\u0646\u062F \u0647\u06CE\u0646\u062F\u06D5 \u0628\u06CE\u062A \u0628\u06C6 ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u06A9\u0644\u06CC\u0644\u06CC \u0646\u06D5\u0646\u0627\u0633\u0631\u0627\u0648: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u06A9\u0644\u06CC\u0644\u06CC \u0646\u0627\u062F\u0631\u0648\u0633\u062A \u0644\u06D5 ${issue2.origin}`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `\u0628\u06D5\u0647\u0627\u06CC \u0646\u06D5\u0646\u0627\u0633\u0631\u0627\u0648 \u0647\u06D5\u06CC\u06D5. \u0628\u06D5\u0647\u0627\u06CC \u0686\u0627\u0648\u06D5\u0695\u0648\u0627\u0646\u06A9\u0631\u0627\u0648: ${opts}`;
        }
        return "\u06CC\u06D5\u06A9\u06AF\u0631\u062A\u0646\u06CC \u0646\u0627\u062F\u0631\u0648\u0633\u062A";
      case "invalid_element":
        return `${issue2.origin} \u0628\u06D5\u0647\u0627\u06A9\u06D5 \u0646\u0627\u062F\u0631\u0648\u0633\u062A\u06D5`;
      default:
        return `\u062A\u06CE\u06A9\u0631\u062F\u06D5\u06CC \u0646\u0627\u062F\u0631\u0648\u0633\u062A`;
    }
  };
};
function ckb_default() {
  return {
    localeError: error7()
  };
}

// node_modules/zod/v4/locales/cs.js
var error8 = () => {
  const Sizable = {
    string: { unit: "znak\u016F", verb: "m\xEDt" },
    file: { unit: "bajt\u016F", verb: "m\xEDt" },
    array: { unit: "prvk\u016F", verb: "m\xEDt" },
    set: { unit: "prvk\u016F", verb: "m\xEDt" },
    map: { unit: "prvk\u016F", verb: "m\xEDt" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "regul\xE1rn\xED v\xFDraz",
    email: "e-mailov\xE1 adresa",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "datum a \u010Das ve form\xE1tu ISO",
    date: "datum ve form\xE1tu ISO",
    time: "\u010Das ve form\xE1tu ISO",
    duration: "doba trv\xE1n\xED ISO",
    ipv4: "IPv4 adresa",
    ipv6: "IPv6 adresa",
    mac: "MAC adresa",
    cidrv4: "rozsah IPv4",
    cidrv6: "rozsah IPv6",
    base64: "\u0159et\u011Bzec zak\xF3dovan\xFD ve form\xE1tu base64",
    base64url: "\u0159et\u011Bzec zak\xF3dovan\xFD ve form\xE1tu base64url",
    json_string: "\u0159et\u011Bzec ve form\xE1tu JSON",
    e164: "\u010D\xEDslo E.164",
    credit_card: "\u010D\xEDslo kreditn\xED karty",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "vstup"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u010D\xEDslo",
    string: "\u0159et\u011Bzec",
    function: "funkce",
    array: "pole"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no instanceof ${issue2.expected}, obdr\u017Eeno ${received}`;
        }
        return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no ${expected}, obdr\u017Eeno ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Neplatn\xFD vstup: o\u010Dek\xE1v\xE1no ${stringifyPrimitive(issue2.values[0])}`;
        return `Neplatn\xE1 mo\u017Enost: o\u010Dek\xE1v\xE1na jedna z hodnot ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Hodnota je p\u0159\xEDli\u0161 velk\xE1: ${issue2.origin ?? "hodnota"} mus\xED m\xEDt ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "prvk\u016F"}`;
        }
        return `Hodnota je p\u0159\xEDli\u0161 velk\xE1: ${issue2.origin ?? "hodnota"} mus\xED b\xFDt ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Hodnota je p\u0159\xEDli\u0161 mal\xE1: ${issue2.origin ?? "hodnota"} mus\xED m\xEDt ${adj}${issue2.minimum.toString()} ${sizing.unit ?? "prvk\u016F"}`;
        }
        return `Hodnota je p\u0159\xEDli\u0161 mal\xE1: ${issue2.origin ?? "hodnota"} mus\xED b\xFDt ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Neplatn\xFD \u0159et\u011Bzec: mus\xED za\u010D\xEDnat na "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Neplatn\xFD \u0159et\u011Bzec: mus\xED kon\u010Dit na "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Neplatn\xFD \u0159et\u011Bzec: mus\xED obsahovat "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Neplatn\xFD \u0159et\u011Bzec: mus\xED odpov\xEDdat vzoru ${_issue.pattern}`;
        return `Neplatn\xFD form\xE1t ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Neplatn\xE9 \u010D\xEDslo: mus\xED b\xFDt n\xE1sobkem ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Nezn\xE1m\xE9 kl\xED\u010De: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Neplatn\xFD kl\xED\u010D v ${issue2.origin}`;
      case "invalid_union":
        return "Neplatn\xFD vstup";
      case "invalid_element":
        return `Neplatn\xE1 hodnota v ${issue2.origin}`;
      default:
        return `Neplatn\xFD vstup`;
    }
  };
};
function cs_default() {
  return {
    localeError: error8()
  };
}

// node_modules/zod/v4/locales/da.js
var error9 = () => {
  const Sizable = {
    string: { unit: "tegn", verb: "havde" },
    file: { unit: "bytes", verb: "havde" },
    array: { unit: "elementer", verb: "indeholdt" },
    set: { unit: "elementer", verb: "indeholdt" },
    map: { unit: "elementer", verb: "indeholdt" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "e-mailadresse",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO dato- og klokkesl\xE6t",
    date: "ISO-dato",
    time: "ISO-klokkesl\xE6t",
    duration: "ISO-varighed",
    ipv4: "IPv4-adresse",
    ipv6: "IPv6-adresse",
    mac: "MAC-adresse",
    cidrv4: "IPv4-spektrum",
    cidrv6: "IPv6-spektrum",
    base64: "base64-kodet streng",
    base64url: "base64url-kodet streng",
    json_string: "JSON-streng",
    e164: "E.164-nummer",
    credit_card: "kreditkortnummer",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN",
    string: "streng",
    number: "tal",
    boolean: "boolean",
    array: "liste",
    object: "objekt",
    set: "s\xE6t",
    file: "fil"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ugyldigt input: forventede instanceof ${issue2.expected}, fik ${received}`;
        }
        return `Ugyldigt input: forventede ${expected}, fik ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Ugyldig v\xE6rdi: forventede ${stringifyPrimitive(issue2.values[0])}`;
        return `Ugyldigt valg: forventede en af f\xF8lgende ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing)
          return `For stor: forventede ${origin ?? "value"} ${sizing.verb} ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "elementer"}`;
        return `For stor: forventede ${origin ?? "value"} havde ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing) {
          return `For lille: forventede ${origin} ${sizing.verb} ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `For lille: forventede ${origin} havde ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Ugyldig streng: skal starte med "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Ugyldig streng: skal ende med "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Ugyldig streng: skal indeholde "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Ugyldig streng: skal matche m\xF8nsteret ${_issue.pattern}`;
        return `Ugyldig ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Ugyldigt tal: skal v\xE6re deleligt med ${issue2.divisor}`;
      case "unrecognized_keys":
        return `${issue2.keys.length > 1 ? "Ukendte n\xF8gler" : "Ukendt n\xF8gle"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Ugyldig n\xF8gle i ${issue2.origin}`;
      case "invalid_union":
        return "Ugyldigt input: matcher ingen af de tilladte typer";
      case "invalid_element":
        return `Ugyldig v\xE6rdi i ${issue2.origin}`;
      default:
        return `Ugyldigt input`;
    }
  };
};
function da_default() {
  return {
    localeError: error9()
  };
}

// node_modules/zod/v4/locales/de.js
var error10 = () => {
  const Sizable = {
    string: { unit: "Zeichen", verb: "zu haben" },
    file: { unit: "Bytes", verb: "zu haben" },
    array: { unit: "Elemente", verb: "zu haben" },
    set: { unit: "Elemente", verb: "zu haben" },
    map: { unit: "Elemente", verb: "zu haben" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "Eingabe",
    email: "E-Mail-Adresse",
    url: "URL",
    emoji: "Emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO-Datum und -Uhrzeit",
    date: "ISO-Datum",
    time: "ISO-Uhrzeit",
    duration: "ISO-Dauer",
    ipv4: "IPv4-Adresse",
    ipv6: "IPv6-Adresse",
    mac: "MAC-Adresse",
    cidrv4: "IPv4-Bereich",
    cidrv6: "IPv6-Bereich",
    base64: "Base64-codierter String",
    base64url: "Base64-URL-codierter String",
    json_string: "JSON-String",
    e164: "E.164-Nummer",
    credit_card: "Kreditkartennummer",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "Eingabe"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "Zahl",
    array: "Array"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ung\xFCltige Eingabe: erwartet instanceof ${issue2.expected}, erhalten ${received}`;
        }
        return `Ung\xFCltige Eingabe: erwartet ${expected}, erhalten ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Ung\xFCltige Eingabe: erwartet ${stringifyPrimitive(issue2.values[0])}`;
        return `Ung\xFCltige Option: erwartet eine von ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Zu gro\xDF: erwartet, dass ${issue2.origin ?? "Wert"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "Elemente"} hat`;
        return `Zu gro\xDF: erwartet, dass ${issue2.origin ?? "Wert"} ${adj}${issue2.maximum.toString()} ist`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Zu klein: erwartet, dass ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} hat`;
        }
        return `Zu klein: erwartet, dass ${issue2.origin} ${adj}${issue2.minimum.toString()} ist`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Ung\xFCltiger String: muss mit "${_issue.prefix}" beginnen`;
        if (_issue.format === "ends_with")
          return `Ung\xFCltiger String: muss mit "${_issue.suffix}" enden`;
        if (_issue.format === "includes")
          return `Ung\xFCltiger String: muss "${_issue.includes}" enthalten`;
        if (_issue.format === "regex")
          return `Ung\xFCltiger String: muss dem Muster ${_issue.pattern} entsprechen`;
        return `Ung\xFCltig: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Ung\xFCltige Zahl: muss ein Vielfaches von ${issue2.divisor} sein`;
      case "unrecognized_keys":
        return `${issue2.keys.length > 1 ? "Unbekannte Schl\xFCssel" : "Unbekannter Schl\xFCssel"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Ung\xFCltiger Schl\xFCssel in ${issue2.origin}`;
      case "invalid_union":
        return "Ung\xFCltige Eingabe";
      case "invalid_element":
        return `Ung\xFCltiger Wert in ${issue2.origin}`;
      default:
        return `Ung\xFCltige Eingabe`;
    }
  };
};
function de_default() {
  return {
    localeError: error10()
  };
}

// node_modules/zod/v4/locales/el.js
var error11 = () => {
  const Sizable = {
    string: { unit: "\u03C7\u03B1\u03C1\u03B1\u03BA\u03C4\u03AE\u03C1\u03B5\u03C2", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" },
    file: { unit: "bytes", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" },
    array: { unit: "\u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" },
    set: { unit: "\u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" },
    map: { unit: "\u03BA\u03B1\u03C4\u03B1\u03C7\u03C9\u03C1\u03AE\u03C3\u03B5\u03B9\u03C2", verb: "\u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2",
    email: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u03B7\u03BC\u03B5\u03C1\u03BF\u03BC\u03B7\u03BD\u03AF\u03B1 \u03BA\u03B1\u03B9 \u03CE\u03C1\u03B1",
    date: "ISO \u03B7\u03BC\u03B5\u03C1\u03BF\u03BC\u03B7\u03BD\u03AF\u03B1",
    time: "ISO \u03CE\u03C1\u03B1",
    duration: "ISO \u03B4\u03B9\u03AC\u03C1\u03BA\u03B5\u03B9\u03B1",
    ipv4: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 IPv4",
    ipv6: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 IPv6",
    mac: "\u03B4\u03B9\u03B5\u03CD\u03B8\u03C5\u03BD\u03C3\u03B7 MAC",
    cidrv4: "\u03B5\u03CD\u03C1\u03BF\u03C2 IPv4",
    cidrv6: "\u03B5\u03CD\u03C1\u03BF\u03C2 IPv6",
    base64: "\u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC \u03BA\u03C9\u03B4\u03B9\u03BA\u03BF\u03C0\u03BF\u03B9\u03B7\u03BC\u03AD\u03BD\u03B7 \u03C3\u03B5 base64",
    base64url: "\u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC \u03BA\u03C9\u03B4\u03B9\u03BA\u03BF\u03C0\u03BF\u03B9\u03B7\u03BC\u03AD\u03BD\u03B7 \u03C3\u03B5 base64url",
    json_string: "\u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC JSON",
    e164: "\u03B1\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2 E.164",
    credit_card: "\u03B1\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2 \u03C0\u03B9\u03C3\u03C4\u03C9\u03C4\u03B9\u03BA\u03AE\u03C2 \u03BA\u03AC\u03C1\u03C4\u03B1\u03C2",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (typeof issue2.expected === "string" && /^[A-Z]/.test(issue2.expected)) {
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD instanceof ${issue2.expected}, \u03BB\u03AE\u03C6\u03B8\u03B7\u03BA\u03B5 ${received}`;
        }
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${expected}, \u03BB\u03AE\u03C6\u03B8\u03B7\u03BA\u03B5 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${stringifyPrimitive(issue2.values[0])}`;
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03C0\u03B9\u03BB\u03BF\u03B3\u03AE: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD \u03AD\u03BD\u03B1 \u03B1\u03C0\u03CC ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B5\u03B3\u03AC\u03BB\u03BF: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue2.origin ?? "\u03C4\u03B9\u03BC\u03AE"} \u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u03C3\u03C4\u03BF\u03B9\u03C7\u03B5\u03AF\u03B1"}`;
        return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B5\u03B3\u03AC\u03BB\u03BF: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue2.origin ?? "\u03C4\u03B9\u03BC\u03AE"} \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B9\u03BA\u03C1\u03CC: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue2.origin} \u03BD\u03B1 \u03AD\u03C7\u03B5\u03B9 ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u03A0\u03BF\u03BB\u03CD \u03BC\u03B9\u03BA\u03C1\u03CC: \u03B1\u03BD\u03B1\u03BC\u03B5\u03BD\u03CC\u03C4\u03B1\u03BD ${issue2.origin} \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03BE\u03B5\u03BA\u03B9\u03BD\u03AC \u03BC\u03B5 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03C4\u03B5\u03BB\u03B5\u03B9\u03CE\u03BD\u03B5\u03B9 \u03BC\u03B5 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03C0\u03B5\u03C1\u03B9\u03AD\u03C7\u03B5\u03B9 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C3\u03C5\u03BC\u03B2\u03BF\u03BB\u03BF\u03C3\u03B5\u03B9\u03C1\u03AC: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03C4\u03B1\u03B9\u03C1\u03B9\u03AC\u03B6\u03B5\u03B9 \u03BC\u03B5 \u03C4\u03BF \u03BC\u03BF\u03C4\u03AF\u03B2\u03BF ${_issue.pattern}`;
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF\u03C2 \u03B1\u03C1\u03B9\u03B8\u03BC\u03CC\u03C2: \u03C0\u03C1\u03AD\u03C0\u03B5\u03B9 \u03BD\u03B1 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C0\u03BF\u03BB\u03BB\u03B1\u03C0\u03BB\u03AC\u03C3\u03B9\u03BF \u03C4\u03BF\u03C5 ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u0386\u03B3\u03BD\u03C9\u03C3\u03C4${issue2.keys.length > 1 ? "\u03B1" : "\u03BF"} \u03BA\u03BB\u03B5\u03B9\u03B4${issue2.keys.length > 1 ? "\u03B9\u03AC" : "\u03AF"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03BF \u03BA\u03BB\u03B5\u03B9\u03B4\u03AF \u03C3\u03C4\u03BF ${issue2.origin}`;
      case "invalid_union":
        return "\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2";
      case "invalid_element":
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03C4\u03B9\u03BC\u03AE \u03C3\u03C4\u03BF ${issue2.origin}`;
      default:
        return `\u039C\u03B7 \u03AD\u03B3\u03BA\u03C5\u03C1\u03B7 \u03B5\u03AF\u03C3\u03BF\u03B4\u03BF\u03C2`;
    }
  };
};
function el_default() {
  return {
    localeError: error11()
  };
}

// node_modules/zod/v4/locales/en.js
var error12 = () => {
  const Sizable = {
    string: { unit: "characters", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    array: { unit: "items", verb: "to have" },
    set: { unit: "items", verb: "to have" },
    map: { unit: "entries", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    mac: "MAC address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    credit_card: "credit card number",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    // Compatibility: "nan" -> "NaN" for display
    nan: "NaN"
    // All other type names omitted - they fall back to raw values via ?? operator
  };
  function getTypeName(type, input2) {
    if (type === "number" && typeof input2 === "number" && !Number.isFinite(input2)) {
      return String(input2);
    }
    return TypeDictionary[type] ?? type;
  }
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = getTypeName(issue2.expected);
        const receivedType = parsedType(issue2.input);
        const received = getTypeName(receivedType, issue2.input);
        return `Invalid input: expected ${expected}, received ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
        return `Invalid option: expected one of ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.exact ? "exactly " : issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Too big: expected ${issue2.origin ?? "value"} to have ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
        return `Too big: expected ${issue2.origin ?? "value"} to be ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.exact ? "exactly " : issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Too small: expected ${issue2.origin} to have ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Too small: expected ${issue2.origin} to be ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Invalid string: must start with "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Invalid string: must end with "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Invalid string: must include "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Invalid string: must match pattern ${_issue.pattern}`;
        return `Invalid ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Invalid number: must be a multiple of ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Unrecognized key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Invalid key in ${issue2.origin}`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `Invalid discriminator value. Expected ${opts}`;
        }
        if (issue2.inclusive === false) {
          return "Invalid input: more than one option matched";
        }
        return "Invalid input";
      case "invalid_element":
        return `Invalid value in ${issue2.origin}`;
      default:
        return `Invalid input`;
    }
  };
};
function en_default() {
  return {
    localeError: error12()
  };
}

// node_modules/zod/v4/locales/eo.js
var error13 = () => {
  const Sizable = {
    string: { unit: "karaktrojn", verb: "havi" },
    file: { unit: "bajtojn", verb: "havi" },
    array: { unit: "elementojn", verb: "havi" },
    set: { unit: "elementojn", verb: "havi" },
    map: { unit: "elementojn", verb: "havi" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "enigo",
    email: "retadreso",
    url: "URL",
    emoji: "emo\u011Dio",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO-datotempo",
    date: "ISO-dato",
    time: "ISO-tempo",
    duration: "ISO-da\u016Dro",
    ipv4: "IPv4-adreso",
    ipv6: "IPv6-adreso",
    mac: "MAC-adreso",
    cidrv4: "IPv4-rango",
    cidrv6: "IPv6-rango",
    base64: "64-ume kodita karaktraro",
    base64url: "URL-64-ume kodita karaktraro",
    json_string: "JSON-karaktraro",
    e164: "E.164-nombro",
    credit_card: "kreditkarta numero",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "enigo"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "nombro",
    array: "tabelo",
    null: "senvalora"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Nevalida enigo: atendi\u011Dis instanceof ${issue2.expected}, ricevi\u011Dis ${received}`;
        }
        return `Nevalida enigo: atendi\u011Dis ${expected}, ricevi\u011Dis ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Nevalida enigo: atendi\u011Dis ${stringifyPrimitive(issue2.values[0])}`;
        return `Nevalida opcio: atendi\u011Dis unu el ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Tro granda: atendi\u011Dis ke ${issue2.origin ?? "valoro"} havu ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementojn"}`;
        return `Tro granda: atendi\u011Dis ke ${issue2.origin ?? "valoro"} havu ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Tro malgranda: atendi\u011Dis ke ${issue2.origin} havu ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Tro malgranda: atendi\u011Dis ke ${issue2.origin} estu ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Nevalida karaktraro: devas komenci\u011Di per "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Nevalida karaktraro: devas fini\u011Di per "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Nevalida karaktraro: devas inkluzivi "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Nevalida karaktraro: devas kongrui kun la modelo ${_issue.pattern}`;
        return `Nevalida ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Nevalida nombro: devas esti oblo de ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Nekonata${issue2.keys.length > 1 ? "j" : ""} \u015Dlosilo${issue2.keys.length > 1 ? "j" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Nevalida \u015Dlosilo en ${issue2.origin}`;
      case "invalid_union":
        return "Nevalida enigo";
      case "invalid_element":
        return `Nevalida valoro en ${issue2.origin}`;
      default:
        return `Nevalida enigo`;
    }
  };
};
function eo_default() {
  return {
    localeError: error13()
  };
}

// node_modules/zod/v4/locales/es.js
var error14 = () => {
  const Sizable = {
    string: { unit: "caracteres", verb: "tener" },
    file: { unit: "bytes", verb: "tener" },
    array: { unit: "elementos", verb: "tener" },
    set: { unit: "elementos", verb: "tener" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "entrada",
    email: "direcci\xF3n de correo electr\xF3nico",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "fecha y hora ISO",
    date: "fecha ISO",
    time: "hora ISO",
    duration: "duraci\xF3n ISO",
    ipv4: "direcci\xF3n IPv4",
    ipv6: "direcci\xF3n IPv6",
    mac: "direcci\xF3n MAC",
    cidrv4: "rango IPv4",
    cidrv6: "rango IPv6",
    base64: "cadena codificada en base64",
    base64url: "URL codificada en base64",
    json_string: "cadena JSON",
    e164: "n\xFAmero E.164",
    credit_card: "n\xFAmero de tarjeta de cr\xE9dito",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "entrada"
  };
  const TypeDictionary = {
    nan: "NaN",
    string: "texto",
    number: "n\xFAmero",
    boolean: "booleano",
    array: "arreglo",
    object: "objeto",
    set: "conjunto",
    file: "archivo",
    date: "fecha",
    bigint: "n\xFAmero grande",
    symbol: "s\xEDmbolo",
    undefined: "indefinido",
    null: "nulo",
    function: "funci\xF3n",
    map: "mapa",
    record: "registro",
    tuple: "tupla",
    enum: "enumeraci\xF3n",
    union: "uni\xF3n",
    literal: "literal",
    promise: "promesa",
    void: "vac\xEDo",
    never: "nunca",
    unknown: "desconocido",
    any: "cualquiera"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Entrada inv\xE1lida: se esperaba instanceof ${issue2.expected}, recibido ${received}`;
        }
        return `Entrada inv\xE1lida: se esperaba ${expected}, recibido ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Entrada inv\xE1lida: se esperaba ${stringifyPrimitive(issue2.values[0])}`;
        return `Opci\xF3n inv\xE1lida: se esperaba una de ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing)
          return `Demasiado grande: se esperaba que ${origin ?? "valor"} tuviera ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementos"}`;
        return `Demasiado grande: se esperaba que ${origin ?? "valor"} fuera ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing) {
          return `Demasiado peque\xF1o: se esperaba que ${origin} tuviera ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Demasiado peque\xF1o: se esperaba que ${origin} fuera ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Cadena inv\xE1lida: debe comenzar con "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Cadena inv\xE1lida: debe terminar en "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Cadena inv\xE1lida: debe incluir "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Cadena inv\xE1lida: debe coincidir con el patr\xF3n ${_issue.pattern}`;
        return `Inv\xE1lido ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `N\xFAmero inv\xE1lido: debe ser m\xFAltiplo de ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Llave${issue2.keys.length > 1 ? "s" : ""} desconocida${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Llave inv\xE1lida en ${TypeDictionary[issue2.origin] ?? issue2.origin}`;
      case "invalid_union":
        return "Entrada inv\xE1lida";
      case "invalid_element":
        return `Valor inv\xE1lido en ${TypeDictionary[issue2.origin] ?? issue2.origin}`;
      default:
        return `Entrada inv\xE1lida`;
    }
  };
};
function es_default() {
  return {
    localeError: error14()
  };
}

// node_modules/zod/v4/locales/fa.js
var error15 = () => {
  const Sizable = {
    string: { unit: "\u06A9\u0627\u0631\u0627\u06A9\u062A\u0631", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" },
    file: { unit: "\u0628\u0627\u06CC\u062A", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" },
    array: { unit: "\u0622\u06CC\u062A\u0645", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" },
    set: { unit: "\u0622\u06CC\u062A\u0645", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" },
    map: { unit: "\u0622\u06CC\u062A\u0645", verb: "\u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0648\u0631\u0648\u062F\u06CC",
    email: "\u0622\u062F\u0631\u0633 \u0627\u06CC\u0645\u06CC\u0644",
    url: "URL",
    emoji: "\u0627\u06CC\u0645\u0648\u062C\u06CC",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u062A\u0627\u0631\u06CC\u062E \u0648 \u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
    date: "\u062A\u0627\u0631\u06CC\u062E \u0627\u06CC\u0632\u0648",
    time: "\u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
    duration: "\u0645\u062F\u062A \u0632\u0645\u0627\u0646 \u0627\u06CC\u0632\u0648",
    ipv4: "IPv4 \u0622\u062F\u0631\u0633",
    ipv6: "IPv6 \u0622\u062F\u0631\u0633",
    mac: "MAC \u0622\u062F\u0631\u0633",
    cidrv4: "IPv4 \u062F\u0627\u0645\u0646\u0647",
    cidrv6: "IPv6 \u062F\u0627\u0645\u0646\u0647",
    base64: "base64-encoded \u0631\u0634\u062A\u0647",
    base64url: "base64url-encoded \u0631\u0634\u062A\u0647",
    json_string: "JSON \u0631\u0634\u062A\u0647",
    e164: "E.164 \u0639\u062F\u062F",
    credit_card: "\u0634\u0645\u0627\u0631\u0647 \u06A9\u0627\u0631\u062A \u0627\u0639\u062A\u0628\u0627\u0631\u06CC",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0648\u0631\u0648\u062F\u06CC"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0639\u062F\u062F",
    array: "\u0622\u0631\u0627\u06CC\u0647"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A instanceof ${issue2.expected} \u0645\u06CC\u200C\u0628\u0648\u062F\u060C ${received} \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F`;
        }
        return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A ${expected} \u0645\u06CC\u200C\u0628\u0648\u062F\u060C ${received} \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F`;
      }
      case "invalid_value":
        if (issue2.values.length === 1) {
          return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A ${stringifyPrimitive(issue2.values[0])} \u0645\u06CC\u200C\u0628\u0648\u062F`;
        }
        return `\u06AF\u0632\u06CC\u0646\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0645\u06CC\u200C\u0628\u0627\u06CC\u0633\u062A \u06CC\u06A9\u06CC \u0627\u0632 ${joinValues(issue2.values, "|")} \u0645\u06CC\u200C\u0628\u0648\u062F`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u062E\u06CC\u0644\u06CC \u0628\u0632\u0631\u06AF: ${issue2.origin ?? "\u0645\u0642\u062F\u0627\u0631"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631"} \u0628\u0627\u0634\u062F`;
        }
        return `\u062E\u06CC\u0644\u06CC \u0628\u0632\u0631\u06AF: ${issue2.origin ?? "\u0645\u0642\u062F\u0627\u0631"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} \u0628\u0627\u0634\u062F`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u062E\u06CC\u0644\u06CC \u06A9\u0648\u0686\u06A9: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} ${sizing.unit} \u0628\u0627\u0634\u062F`;
        }
        return `\u062E\u06CC\u0644\u06CC \u06A9\u0648\u0686\u06A9: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} \u0628\u0627\u0634\u062F`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 "${_issue.prefix}" \u0634\u0631\u0648\u0639 \u0634\u0648\u062F`;
        }
        if (_issue.format === "ends_with") {
          return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 "${_issue.suffix}" \u062A\u0645\u0627\u0645 \u0634\u0648\u062F`;
        }
        if (_issue.format === "includes") {
          return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0634\u0627\u0645\u0644 "${_issue.includes}" \u0628\u0627\u0634\u062F`;
        }
        if (_issue.format === "regex") {
          return `\u0631\u0634\u062A\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0628\u0627 \u0627\u0644\u06AF\u0648\u06CC ${_issue.pattern} \u0645\u0637\u0627\u0628\u0642\u062A \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u062F`;
        }
        return `${FormatDictionary[_issue.format] ?? issue2.format} \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
      }
      case "not_multiple_of":
        return `\u0639\u062F\u062F \u0646\u0627\u0645\u0639\u062A\u0628\u0631: \u0628\u0627\u06CC\u062F \u0645\u0636\u0631\u0628 ${issue2.divisor} \u0628\u0627\u0634\u062F`;
      case "unrecognized_keys":
        return `\u06A9\u0644\u06CC\u062F${issue2.keys.length > 1 ? "\u0647\u0627\u06CC" : ""} \u0646\u0627\u0634\u0646\u0627\u0633: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u06A9\u0644\u06CC\u062F \u0646\u0627\u0634\u0646\u0627\u0633 \u062F\u0631 ${issue2.origin}`;
      case "invalid_union":
        return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
      case "invalid_element":
        return `\u0645\u0642\u062F\u0627\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u062F\u0631 ${issue2.origin}`;
      default:
        return `\u0648\u0631\u0648\u062F\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631`;
    }
  };
};
function fa_default() {
  return {
    localeError: error15()
  };
}

// node_modules/zod/v4/locales/fi.js
var error16 = () => {
  const Sizable = {
    string: { unit: "merkki\xE4", subject: "merkkijonon" },
    file: { unit: "tavua", subject: "tiedoston" },
    array: { unit: "alkiota", subject: "listan" },
    set: { unit: "alkiota", subject: "joukon" },
    map: { unit: "alkiota", subject: "kuvauksen" },
    number: { unit: "", subject: "luvun" },
    bigint: { unit: "", subject: "suuren kokonaisluvun" },
    int: { unit: "", subject: "kokonaisluvun" },
    date: { unit: "", subject: "p\xE4iv\xE4m\xE4\xE4r\xE4n" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "s\xE4\xE4nn\xF6llinen lauseke",
    email: "s\xE4hk\xF6postiosoite",
    url: "URL-osoite",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO-aikaleima",
    date: "ISO-p\xE4iv\xE4m\xE4\xE4r\xE4",
    time: "ISO-aika",
    duration: "ISO-kesto",
    ipv4: "IPv4-osoite",
    ipv6: "IPv6-osoite",
    mac: "MAC-osoite",
    cidrv4: "IPv4-alue",
    cidrv6: "IPv6-alue",
    base64: "base64-koodattu merkkijono",
    base64url: "base64url-koodattu merkkijono",
    json_string: "JSON-merkkijono",
    e164: "E.164-luku",
    credit_card: "luottokortin numero",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "templaattimerkkijono"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Virheellinen tyyppi: odotettiin instanceof ${issue2.expected}, oli ${received}`;
        }
        return `Virheellinen tyyppi: odotettiin ${expected}, oli ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Virheellinen sy\xF6te: t\xE4ytyy olla ${stringifyPrimitive(issue2.values[0])}`;
        return `Virheellinen valinta: t\xE4ytyy olla yksi seuraavista: ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Liian suuri: ${sizing.subject} t\xE4ytyy olla ${adj}${issue2.maximum.toString()} ${sizing.unit}`.trim();
        }
        return `Liian suuri: arvon t\xE4ytyy olla ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Liian pieni: ${sizing.subject} t\xE4ytyy olla ${adj}${issue2.minimum.toString()} ${sizing.unit}`.trim();
        }
        return `Liian pieni: arvon t\xE4ytyy olla ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Virheellinen sy\xF6te: t\xE4ytyy alkaa "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Virheellinen sy\xF6te: t\xE4ytyy loppua "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Virheellinen sy\xF6te: t\xE4ytyy sis\xE4lt\xE4\xE4 "${_issue.includes}"`;
        if (_issue.format === "regex") {
          return `Virheellinen sy\xF6te: t\xE4ytyy vastata s\xE4\xE4nn\xF6llist\xE4 lauseketta ${_issue.pattern}`;
        }
        return `Virheellinen ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Virheellinen luku: t\xE4ytyy olla luvun ${issue2.divisor} monikerta`;
      case "unrecognized_keys":
        return `${issue2.keys.length > 1 ? "Tuntemattomat avaimet" : "Tuntematon avain"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return "Virheellinen avain tietueessa";
      case "invalid_union":
        return "Virheellinen unioni";
      case "invalid_element":
        return "Virheellinen arvo joukossa";
      default:
        return `Virheellinen sy\xF6te`;
    }
  };
};
function fi_default() {
  return {
    localeError: error16()
  };
}

// node_modules/zod/v4/locales/fr.js
var error17 = () => {
  const Sizable = {
    string: { unit: "caract\xE8res", verb: "avoir" },
    file: { unit: "octets", verb: "avoir" },
    array: { unit: "\xE9l\xE9ments", verb: "avoir" },
    set: { unit: "\xE9l\xE9ments", verb: "avoir" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "expression r\xE9guli\xE8re",
    email: "adresse e-mail",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "date et heure ISO",
    date: "date ISO",
    time: "heure ISO",
    duration: "dur\xE9e ISO",
    ipv4: "adresse IPv4",
    ipv6: "adresse IPv6",
    mac: "adresse MAC",
    cidrv4: "plage IPv4",
    cidrv6: "plage IPv6",
    base64: "cha\xEEne de caract\xE8res encod\xE9e en base64",
    base64url: "cha\xEEne de caract\xE8res encod\xE9e en base64url",
    json_string: "cha\xEEne de caract\xE8res JSON",
    e164: "num\xE9ro au format E.164",
    credit_card: "num\xE9ro de carte de cr\xE9dit",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "entr\xE9e"
  };
  const TypeDictionary = {
    string: "cha\xEEne de caract\xE8res",
    number: "nombre",
    int: "entier",
    boolean: "bool\xE9en",
    bigint: "grand entier",
    symbol: "symbole",
    undefined: "ind\xE9fini",
    null: "null",
    never: "jamais",
    void: "vide",
    date: "date",
    array: "tableau",
    object: "objet",
    tuple: "tuple",
    record: "record",
    map: "map",
    set: "ensemble",
    file: "fichier",
    nonoptional: "non optionnel",
    nan: "NaN",
    function: "fonction"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Entr\xE9e invalide : instance de ${issue2.expected} attendu, ${received} re\xE7u`;
        }
        return `Entr\xE9e invalide : ${expected} attendu, ${received} re\xE7u`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Entr\xE9e invalide : ${stringifyPrimitive(issue2.values[0])} attendu`;
        return `Option invalide : une valeur parmi ${joinValues(issue2.values, "|")} attendue`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Trop grand : ${TypeDictionary[issue2.origin] ?? "valeur"} doit ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\xE9l\xE9ment(s)"}`;
        return `Trop grand : ${TypeDictionary[issue2.origin] ?? "valeur"} doit \xEAtre ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Trop petit : ${TypeDictionary[issue2.origin] ?? "valeur"} doit ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        return `Trop petit : ${TypeDictionary[issue2.origin] ?? "valeur"} doit \xEAtre ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Cha\xEEne de caract\xE8res invalide : doit commencer par "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Cha\xEEne de caract\xE8res invalide : doit se terminer par "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Cha\xEEne de caract\xE8res invalide : doit inclure "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Cha\xEEne de caract\xE8res invalide : doit correspondre au motif ${_issue.pattern}`;
        return `${FormatDictionary[_issue.format] ?? issue2.format} invalide`;
      }
      case "not_multiple_of":
        return `Nombre invalide : doit \xEAtre un multiple de ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Cl\xE9${issue2.keys.length > 1 ? "s" : ""} non reconnue${issue2.keys.length > 1 ? "s" : ""} : ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Cl\xE9 invalide dans ${issue2.origin}`;
      case "invalid_union":
        return "Entr\xE9e invalide";
      case "invalid_element":
        return `Valeur invalide dans ${issue2.origin}`;
      default:
        return `Entr\xE9e invalide`;
    }
  };
};
function fr_default() {
  return {
    localeError: error17()
  };
}

// node_modules/zod/v4/locales/fr-CA.js
var error18 = () => {
  const Sizable = {
    string: { unit: "caract\xE8res", verb: "avoir" },
    file: { unit: "octets", verb: "avoir" },
    array: { unit: "\xE9l\xE9ments", verb: "avoir" },
    set: { unit: "\xE9l\xE9ments", verb: "avoir" },
    map: { unit: "\xE9l\xE9ments", verb: "avoir" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "entr\xE9e",
    email: "adresse courriel",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "date-heure ISO",
    date: "date ISO",
    time: "heure ISO",
    duration: "dur\xE9e ISO",
    ipv4: "adresse IPv4",
    ipv6: "adresse IPv6",
    mac: "adresse MAC",
    cidrv4: "plage IPv4",
    cidrv6: "plage IPv6",
    base64: "cha\xEEne encod\xE9e en base64",
    base64url: "cha\xEEne encod\xE9e en base64url",
    json_string: "cha\xEEne JSON",
    e164: "num\xE9ro E.164",
    credit_card: "num\xE9ro de carte de cr\xE9dit",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "entr\xE9e"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Entr\xE9e invalide : attendu instanceof ${issue2.expected}, re\xE7u ${received}`;
        }
        return `Entr\xE9e invalide : attendu ${expected}, re\xE7u ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Entr\xE9e invalide : attendu ${stringifyPrimitive(issue2.values[0])}`;
        return `Option invalide : attendu l'une des valeurs suivantes ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "\u2264" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Trop grand : attendu que ${issue2.origin ?? "la valeur"} ait ${adj}${issue2.maximum.toString()} ${sizing.unit}`;
        return `Trop grand : attendu que ${issue2.origin ?? "la valeur"} soit ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\u2265" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Trop petit : attendu que ${issue2.origin} ait ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Trop petit : attendu que ${issue2.origin} soit ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Cha\xEEne invalide : doit commencer par "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Cha\xEEne invalide : doit se terminer par "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Cha\xEEne invalide : doit inclure "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Cha\xEEne invalide : doit correspondre au motif ${_issue.pattern}`;
        return `${FormatDictionary[_issue.format] ?? issue2.format} invalide`;
      }
      case "not_multiple_of":
        return `Nombre invalide : doit \xEAtre un multiple de ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Cl\xE9${issue2.keys.length > 1 ? "s" : ""} non reconnue${issue2.keys.length > 1 ? "s" : ""} : ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Cl\xE9 invalide dans ${issue2.origin}`;
      case "invalid_union":
        return "Entr\xE9e invalide";
      case "invalid_element":
        return `Valeur invalide dans ${issue2.origin}`;
      default:
        return `Entr\xE9e invalide`;
    }
  };
};
function fr_CA_default() {
  return {
    localeError: error18()
  };
}

// node_modules/zod/v4/locales/gu.js
var error19 = () => {
  const Sizable = {
    string: { unit: "\u0A85\u0A95\u0ACD\u0AB7\u0AB0", verb: "\u0AB9\u0ACB\u0AB5\u0ABE \u0A9C\u0ACB\u0A88\u0A8F" },
    file: { unit: "\u0AAC\u0ABE\u0AAF\u0A9F", verb: "\u0AB9\u0ACB\u0AB5\u0ABE \u0A9C\u0ACB\u0A88\u0A8F" },
    array: { unit: "\u0A86\u0A87\u0A9F\u0AAE", verb: "\u0AB9\u0ACB\u0AB5\u0ABE \u0A9C\u0ACB\u0A88\u0A8F" },
    set: { unit: "\u0A86\u0A87\u0A9F\u0AAE", verb: "\u0AB9\u0ACB\u0AB5\u0ABE \u0A9C\u0ACB\u0A88\u0A8F" },
    map: { unit: "\u0A8F\u0AA8\u0ACD\u0A9F\u0ACD\u0AB0\u0AC0", verb: "\u0AB9\u0ACB\u0AB5\u0ABE \u0A9C\u0ACB\u0A88\u0A8F" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0A87\u0AA8\u0AAA\u0AC1\u0A9F",
    email: "\u0A88\u0AAE\u0AC7\u0A87\u0AB2 \u0A8F\u0AA1\u0ACD\u0AB0\u0AC7\u0AB8",
    url: "URL",
    emoji: "\u0A87\u0AAE\u0ACB\u0A9C\u0AC0",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0AA4\u0ABE\u0AB0\u0AC0\u0A96 \u0A85\u0AA8\u0AC7 \u0AB8\u0AAE\u0AAF",
    date: "ISO \u0AA4\u0ABE\u0AB0\u0AC0\u0A96",
    time: "ISO \u0AB8\u0AAE\u0AAF",
    duration: "ISO \u0A85\u0AB5\u0AA7\u0ABF",
    ipv4: "IPv4 \u0A8F\u0AA1\u0ACD\u0AB0\u0AC7\u0AB8",
    ipv6: "IPv6 \u0A8F\u0AA1\u0ACD\u0AB0\u0AC7\u0AB8",
    mac: "MAC \u0A8F\u0AA1\u0ACD\u0AB0\u0AC7\u0AB8",
    cidrv4: "IPv4 \u0AB6\u0ACD\u0AB0\u0AC7\u0AA3\u0AC0",
    cidrv6: "IPv6 \u0AB6\u0ACD\u0AB0\u0AC7\u0AA3\u0AC0",
    base64: "base64-\u0A8F\u0AA8\u0ACD\u0A95\u0ACB\u0AA1\u0AC7\u0AA1 \u0AB8\u0ACD\u0A9F\u0ACD\u0AB0\u0ABF\u0A82\u0A97",
    base64url: "base64url-\u0A8F\u0AA8\u0ACD\u0A95\u0ACB\u0AA1\u0AC7\u0AA1 \u0AB8\u0ACD\u0A9F\u0ACD\u0AB0\u0ABF\u0A82\u0A97",
    json_string: "JSON \u0AB8\u0ACD\u0A9F\u0ACD\u0AB0\u0ABF\u0A82\u0A97",
    e164: "E.164 \u0AA8\u0A82\u0AAC\u0AB0",
    credit_card: "\u0A95\u0ACD\u0AB0\u0AC7\u0AA1\u0ABF\u0A9F \u0A95\u0ABE\u0AB0\u0ACD\u0AA1 \u0AA8\u0A82\u0AAC\u0AB0",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0A87\u0AA8\u0AAA\u0AC1\u0A9F"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        return `\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0A87\u0AA8\u0AAA\u0AC1\u0A9F: \u0A85\u0AAA\u0AC7\u0A95\u0ACD\u0AB7\u0ABF\u0AA4 ${expected}, \u0AAA\u0ACD\u0AB0\u0ABE\u0AAA\u0ACD\u0AA4 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0A87\u0AA8\u0AAA\u0AC1\u0A9F: \u0A85\u0AAA\u0AC7\u0A95\u0ACD\u0AB7\u0ABF\u0AA4 ${stringifyPrimitive(issue2.values[0])}`;
        return `\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AB5\u0ABF\u0A95\u0AB2\u0ACD\u0AAA: ${joinValues(issue2.values, " | ")} \u0AAE\u0ABE\u0AA7\u0ACD\u0AAF\u0AAE\u0AA5\u0AC0 \u0A8F\u0A95 \u0A85\u0AAA\u0AC7\u0A95\u0ACD\u0AB7\u0ABF\u0AA4`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0A96\u0AC2\u0AAC \u0AAE\u0ACB\u0A9F\u0AC1\u0A82: ${issue2.origin ?? "\u0AAE\u0AC2\u0AB2\u0ACD\u0AAF"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0A8F\u0AB2\u0ABF\u0AAE\u0AC7\u0AA8\u0ACD\u0A9F"} \u0AB9\u0ACB\u0AB5\u0ABE \u0A9C\u0ACB\u0A88\u0A8F`;
        return `\u0A96\u0AC2\u0AAC \u0AAE\u0ACB\u0A9F\u0AC1\u0A82: ${issue2.origin ?? "\u0AAE\u0AC2\u0AB2\u0ACD\u0AAF"} ${adj}${issue2.maximum.toString()} \u0AB9\u0ACB\u0AB5\u0AC1\u0A82 \u0A9C\u0ACB\u0A88\u0A8F`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0A96\u0AC2\u0AAC \u0AA8\u0ABE\u0AA8\u0AC1\u0A82: ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} \u0AB9\u0ACB\u0AB5\u0ABE \u0A9C\u0ACB\u0A88\u0A8F`;
        }
        return `\u0A96\u0AC2\u0AAC \u0AA8\u0ABE\u0AA8\u0AC1\u0A82: ${issue2.origin} ${adj}${issue2.minimum.toString()} \u0AB9\u0ACB\u0AB5\u0AC1\u0A82 \u0A9C\u0ACB\u0A88\u0A8F`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AB8\u0ACD\u0A9F\u0ACD\u0AB0\u0ABF\u0A82\u0A97: "${_issue.prefix}" \u0AA5\u0AC0 \u0AB6\u0AB0\u0AC2 \u0AA5\u0AB5\u0AC1\u0A82 \u0A9C\u0ACB\u0A88\u0A8F`;
        }
        if (_issue.format === "ends_with")
          return `\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AB8\u0ACD\u0A9F\u0ACD\u0AB0\u0ABF\u0A82\u0A97: "${_issue.suffix}" \u0AAA\u0AB0 \u0AB8\u0AAE\u0ABE\u0AAA\u0ACD\u0AA4 \u0AA5\u0AB5\u0AC1\u0A82 \u0A9C\u0ACB\u0A88\u0A8F`;
        if (_issue.format === "includes")
          return `\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AB8\u0ACD\u0A9F\u0ACD\u0AB0\u0ABF\u0A82\u0A97: "${_issue.includes}" \u0AB6\u0ABE\u0AAE\u0AC7\u0AB2 \u0AB9\u0ACB\u0AB5\u0AC1\u0A82 \u0A9C\u0ACB\u0A88\u0A8F`;
        if (_issue.format === "regex")
          return `\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AB8\u0ACD\u0A9F\u0ACD\u0AB0\u0ABF\u0A82\u0A97: \u0AAA\u0AC7\u0A9F\u0AB0\u0ACD\u0AA8 ${_issue.pattern} \u0AB8\u0ABE\u0AA5\u0AC7 \u0AAE\u0AC7\u0AB3 \u0A96\u0ABE\u0AB5\u0AC1\u0A82 \u0A9C\u0ACB\u0A88\u0A8F`;
        return `\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AA8\u0A82\u0AAC\u0AB0: ${issue2.divisor} \u0AA8\u0ACB \u0A97\u0AC1\u0AA3\u0ABE\u0A82\u0A95 \u0AB9\u0ACB\u0AB5\u0ACB \u0A9C\u0ACB\u0A88\u0A8F`;
      case "unrecognized_keys":
        return `\u0A93\u0AB3\u0A96\u0AC0 \u0AB6\u0A95\u0ABE\u0AA4\u0ABE \u0AA8\u0AB9\u0AC0\u0A82 \u0AA4\u0AC7 \u0A95\u0AC0${issue2.keys.length > 1 ? "\u0A93" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} \u0AAE\u0ABE\u0A82 \u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0A95\u0AC0`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AA1\u0ABF\u0AB8\u0ACD\u0A95\u0ACD\u0AB0\u0ABF\u0AAE\u0ABF\u0AA8\u0AC7\u0A9F\u0AB0 \u0AAE\u0AC2\u0AB2\u0ACD\u0AAF. \u0A85\u0AAA\u0AC7\u0A95\u0ACD\u0AB7\u0ABF\u0AA4 ${opts}`;
        }
        return "\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0A87\u0AA8\u0AAA\u0AC1\u0A9F";
      case "invalid_element":
        return `${issue2.origin} \u0AAE\u0ABE\u0A82 \u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0AAE\u0AC2\u0AB2\u0ACD\u0AAF`;
      default:
        return "\u0A85\u0AAE\u0ABE\u0AA8\u0ACD\u0AAF \u0A87\u0AA8\u0AAA\u0AC1\u0A9F";
    }
  };
};
function gu_default() {
  return {
    localeError: error19()
  };
}

// node_modules/zod/v4/locales/he.js
var error20 = () => {
  const TypeNames = {
    string: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA", gender: "f" },
    number: { label: "\u05DE\u05E1\u05E4\u05E8", gender: "m" },
    boolean: { label: "\u05E2\u05E8\u05DA \u05D1\u05D5\u05DC\u05D9\u05D0\u05E0\u05D9", gender: "m" },
    bigint: { label: "BigInt", gender: "m" },
    date: { label: "\u05EA\u05D0\u05E8\u05D9\u05DA", gender: "m" },
    array: { label: "\u05DE\u05E2\u05E8\u05DA", gender: "m" },
    object: { label: "\u05D0\u05D5\u05D1\u05D9\u05D9\u05E7\u05D8", gender: "m" },
    null: { label: "\u05E2\u05E8\u05DA \u05E8\u05D9\u05E7 (null)", gender: "m" },
    undefined: { label: "\u05E2\u05E8\u05DA \u05DC\u05D0 \u05DE\u05D5\u05D2\u05D3\u05E8 (undefined)", gender: "m" },
    symbol: { label: "\u05E1\u05D9\u05DE\u05D1\u05D5\u05DC (Symbol)", gender: "m" },
    function: { label: "\u05E4\u05D5\u05E0\u05E7\u05E6\u05D9\u05D4", gender: "f" },
    map: { label: "\u05DE\u05E4\u05D4 (Map)", gender: "f" },
    set: { label: "\u05E7\u05D1\u05D5\u05E6\u05D4 (Set)", gender: "f" },
    file: { label: "\u05E7\u05D5\u05D1\u05E5", gender: "m" },
    promise: { label: "Promise", gender: "m" },
    NaN: { label: "NaN", gender: "m" },
    unknown: { label: "\u05E2\u05E8\u05DA \u05DC\u05D0 \u05D9\u05D3\u05D5\u05E2", gender: "m" },
    value: { label: "\u05E2\u05E8\u05DA", gender: "m" }
  };
  const Sizable = {
    string: { unit: "\u05EA\u05D5\u05D5\u05D9\u05DD", shortLabel: "\u05E7\u05E6\u05E8", longLabel: "\u05D0\u05E8\u05D5\u05DA" },
    file: { unit: "\u05D1\u05D9\u05D9\u05D8\u05D9\u05DD", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" },
    array: { unit: "\u05E4\u05E8\u05D9\u05D8\u05D9\u05DD", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" },
    set: { unit: "\u05E4\u05E8\u05D9\u05D8\u05D9\u05DD", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" },
    number: { unit: "", shortLabel: "\u05E7\u05D8\u05DF", longLabel: "\u05D2\u05D3\u05D5\u05DC" }
    // no unit
  };
  const typeEntry = (t) => t ? TypeNames[t] : void 0;
  const typeLabel = (t) => {
    const e = typeEntry(t);
    if (e)
      return e.label;
    return t ?? TypeNames.unknown.label;
  };
  const withDefinite = (t) => `\u05D4${typeLabel(t)}`;
  const verbFor = (t) => {
    const e = typeEntry(t);
    const gender = e?.gender ?? "m";
    return gender === "f" ? "\u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05D9\u05D5\u05EA" : "\u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA";
  };
  const getSizing = (origin) => {
    if (!origin)
      return null;
    return Sizable[origin] ?? null;
  };
  const FormatDictionary = {
    regex: { label: "\u05E7\u05DC\u05D8", gender: "m" },
    email: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05D0\u05D9\u05DE\u05D9\u05D9\u05DC", gender: "f" },
    url: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA \u05E8\u05E9\u05EA", gender: "f" },
    emoji: { label: "\u05D0\u05D9\u05DE\u05D5\u05D2'\u05D9", gender: "m" },
    uuid: { label: "UUID", gender: "m" },
    uuidv4: { label: "UUIDv4", gender: "m" },
    uuidv6: { label: "UUIDv6", gender: "m" },
    nanoid: { label: "nanoid", gender: "m" },
    guid: { label: "GUID", gender: "m" },
    cuid: { label: "cuid", gender: "m" },
    cuid2: { label: "cuid2", gender: "m" },
    ulid: { label: "ULID", gender: "m" },
    xid: { label: "XID", gender: "m" },
    ksuid: { label: "KSUID", gender: "m" },
    datetime: { label: "\u05EA\u05D0\u05E8\u05D9\u05DA \u05D5\u05D6\u05DE\u05DF ISO", gender: "m" },
    date: { label: "\u05EA\u05D0\u05E8\u05D9\u05DA ISO", gender: "m" },
    time: { label: "\u05D6\u05DE\u05DF ISO", gender: "m" },
    duration: { label: "\u05DE\u05E9\u05DA \u05D6\u05DE\u05DF ISO", gender: "m" },
    ipv4: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA IPv4", gender: "f" },
    ipv6: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA IPv6", gender: "f" },
    mac: { label: "\u05DB\u05EA\u05D5\u05D1\u05EA MAC", gender: "f" },
    cidrv4: { label: "\u05D8\u05D5\u05D5\u05D7 IPv4", gender: "m" },
    cidrv6: { label: "\u05D8\u05D5\u05D5\u05D7 IPv6", gender: "m" },
    base64: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D1\u05D1\u05E1\u05D9\u05E1 64", gender: "f" },
    base64url: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D1\u05D1\u05E1\u05D9\u05E1 64 \u05DC\u05DB\u05EA\u05D5\u05D1\u05D5\u05EA \u05E8\u05E9\u05EA", gender: "f" },
    json_string: { label: "\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA JSON", gender: "f" },
    e164: { label: "\u05DE\u05E1\u05E4\u05E8 E.164", gender: "m" },
    credit_card: { label: "\u05DE\u05E1\u05E4\u05E8 \u05DB\u05E8\u05D8\u05D9\u05E1 \u05D0\u05E9\u05E8\u05D0\u05D9", gender: "m" },
    iban: { label: "IBAN", gender: "m" },
    jwt: { label: "JWT", gender: "m" },
    template_literal: { label: "\u05E7\u05DC\u05D8", gender: "m" },
    ends_with: { label: "\u05E7\u05DC\u05D8", gender: "m" },
    includes: { label: "\u05E7\u05DC\u05D8", gender: "m" },
    lowercase: { label: "\u05E7\u05DC\u05D8", gender: "m" },
    starts_with: { label: "\u05E7\u05DC\u05D8", gender: "m" },
    uppercase: { label: "\u05E7\u05DC\u05D8", gender: "m" }
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expectedKey = issue2.expected;
        const expected = TypeDictionary[expectedKey ?? ""] ?? typeLabel(expectedKey);
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? TypeNames[receivedType]?.label ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA instanceof ${issue2.expected}, \u05D4\u05EA\u05E7\u05D1\u05DC ${received}`;
        }
        return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${expected}, \u05D4\u05EA\u05E7\u05D1\u05DC ${received}`;
      }
      case "invalid_value": {
        if (issue2.values.length === 1) {
          return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05E2\u05E8\u05DA \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05EA ${stringifyPrimitive(issue2.values[0])}`;
        }
        const stringified = issue2.values.map((v) => stringifyPrimitive(v));
        if (issue2.values.length === 2) {
          return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05D0\u05E4\u05E9\u05E8\u05D5\u05D9\u05D5\u05EA \u05D4\u05DE\u05EA\u05D0\u05D9\u05DE\u05D5\u05EA \u05D4\u05DF ${stringified[0]} \u05D0\u05D5 ${stringified[1]}`;
        }
        const lastValue = stringified[stringified.length - 1];
        const restValues = stringified.slice(0, -1).join(", ");
        return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D4\u05D0\u05E4\u05E9\u05E8\u05D5\u05D9\u05D5\u05EA \u05D4\u05DE\u05EA\u05D0\u05D9\u05DE\u05D5\u05EA \u05D4\u05DF ${restValues} \u05D0\u05D5 ${lastValue}`;
      }
      case "too_big": {
        const sizing = getSizing(issue2.origin);
        const subject = withDefinite(issue2.origin ?? "value");
        if (issue2.origin === "string") {
          return `${sizing?.longLabel ?? "\u05D0\u05E8\u05D5\u05DA"} \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05DB\u05D9\u05DC ${issue2.maximum.toString()} ${sizing?.unit ?? ""} ${issue2.inclusive ? "\u05D0\u05D5 \u05E4\u05D7\u05D5\u05EA" : "\u05DC\u05DB\u05DC \u05D4\u05D9\u05D5\u05EA\u05E8"}`.trim();
        }
        if (issue2.origin === "number") {
          const comparison = issue2.inclusive ? `\u05E7\u05D8\u05DF \u05D0\u05D5 \u05E9\u05D5\u05D5\u05D4 \u05DC-${issue2.maximum}` : `\u05E7\u05D8\u05DF \u05DE-${issue2.maximum}`;
          return `\u05D2\u05D3\u05D5\u05DC \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${comparison}`;
        }
        if (issue2.origin === "array" || issue2.origin === "set") {
          const verb = issue2.origin === "set" ? "\u05E6\u05E8\u05D9\u05DB\u05D4" : "\u05E6\u05E8\u05D9\u05DA";
          const comparison = issue2.inclusive ? `${issue2.maximum} ${sizing?.unit ?? ""} \u05D0\u05D5 \u05E4\u05D7\u05D5\u05EA` : `\u05E4\u05D7\u05D5\u05EA \u05DE-${issue2.maximum} ${sizing?.unit ?? ""}`;
          return `\u05D2\u05D3\u05D5\u05DC \u05DE\u05D3\u05D9: ${subject} ${verb} \u05DC\u05D4\u05DB\u05D9\u05DC ${comparison}`.trim();
        }
        const adj = issue2.inclusive ? "<=" : "<";
        const be = verbFor(issue2.origin ?? "value");
        if (sizing?.unit) {
          return `${sizing.longLabel} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue2.maximum.toString()} ${sizing.unit}`;
        }
        return `${sizing?.longLabel ?? "\u05D2\u05D3\u05D5\u05DC"} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const sizing = getSizing(issue2.origin);
        const subject = withDefinite(issue2.origin ?? "value");
        if (issue2.origin === "string") {
          return `${sizing?.shortLabel ?? "\u05E7\u05E6\u05E8"} \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05D4\u05DB\u05D9\u05DC ${issue2.minimum.toString()} ${sizing?.unit ?? ""} ${issue2.inclusive ? "\u05D0\u05D5 \u05D9\u05D5\u05EA\u05E8" : "\u05DC\u05E4\u05D7\u05D5\u05EA"}`.trim();
        }
        if (issue2.origin === "number") {
          const comparison = issue2.inclusive ? `\u05D2\u05D3\u05D5\u05DC \u05D0\u05D5 \u05E9\u05D5\u05D5\u05D4 \u05DC-${issue2.minimum}` : `\u05D2\u05D3\u05D5\u05DC \u05DE-${issue2.minimum}`;
          return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${subject} \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05D5\u05EA ${comparison}`;
        }
        if (issue2.origin === "array" || issue2.origin === "set") {
          const verb = issue2.origin === "set" ? "\u05E6\u05E8\u05D9\u05DB\u05D4" : "\u05E6\u05E8\u05D9\u05DA";
          if (issue2.minimum === 1 && issue2.inclusive) {
            const singularPhrase = issue2.origin === "set" ? "\u05DC\u05E4\u05D7\u05D5\u05EA \u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3" : "\u05DC\u05E4\u05D7\u05D5\u05EA \u05E4\u05E8\u05D9\u05D8 \u05D0\u05D7\u05D3";
            return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${subject} ${verb} \u05DC\u05D4\u05DB\u05D9\u05DC ${singularPhrase}`;
          }
          const comparison = issue2.inclusive ? `${issue2.minimum} ${sizing?.unit ?? ""} \u05D0\u05D5 \u05D9\u05D5\u05EA\u05E8` : `\u05D9\u05D5\u05EA\u05E8 \u05DE-${issue2.minimum} ${sizing?.unit ?? ""}`;
          return `\u05E7\u05D8\u05DF \u05DE\u05D3\u05D9: ${subject} ${verb} \u05DC\u05D4\u05DB\u05D9\u05DC ${comparison}`.trim();
        }
        const adj = issue2.inclusive ? ">=" : ">";
        const be = verbFor(issue2.origin ?? "value");
        if (sizing?.unit) {
          return `${sizing.shortLabel} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `${sizing?.shortLabel ?? "\u05E7\u05D8\u05DF"} \u05DE\u05D3\u05D9: ${subject} ${be} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05EA\u05D7\u05D9\u05DC \u05D1 "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05E1\u05EA\u05D9\u05D9\u05DD \u05D1 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05DB\u05DC\u05D5\u05DC "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u05D4\u05DE\u05D7\u05E8\u05D5\u05D6\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05DC\u05D4\u05EA\u05D0\u05D9\u05DD \u05DC\u05EA\u05D1\u05E0\u05D9\u05EA ${_issue.pattern}`;
        const nounEntry = FormatDictionary[_issue.format];
        const noun = nounEntry?.label ?? _issue.format;
        const gender = nounEntry?.gender ?? "m";
        const adjective = gender === "f" ? "\u05EA\u05E7\u05D9\u05E0\u05D4" : "\u05EA\u05E7\u05D9\u05DF";
        return `${noun} \u05DC\u05D0 ${adjective}`;
      }
      case "not_multiple_of":
        return `\u05DE\u05E1\u05E4\u05E8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF: \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D9\u05D5\u05EA \u05DE\u05DB\u05E4\u05DC\u05D4 \u05E9\u05DC ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u05DE\u05E4\u05EA\u05D7${issue2.keys.length > 1 ? "\u05D5\u05EA" : ""} \u05DC\u05D0 \u05DE\u05D6\u05D5\u05D4${issue2.keys.length > 1 ? "\u05D9\u05DD" : "\u05D4"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key": {
        return `\u05E9\u05D3\u05D4 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF \u05D1\u05D0\u05D5\u05D1\u05D9\u05D9\u05E7\u05D8`;
      }
      case "invalid_union":
        return "\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF";
      case "invalid_element": {
        const place = withDefinite(issue2.origin ?? "array");
        return `\u05E2\u05E8\u05DA \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF \u05D1${place}`;
      }
      default:
        return `\u05E7\u05DC\u05D8 \u05DC\u05D0 \u05EA\u05E7\u05D9\u05DF`;
    }
  };
};
function he_default() {
  return {
    localeError: error20()
  };
}

// node_modules/zod/v4/locales/hi.js
var error21 = () => {
  const Sizable = {
    string: { unit: "\u0905\u0915\u094D\u0937\u0930", verb: "\u0930\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F" },
    file: { unit: "\u092C\u093E\u0907\u091F\u094D\u0938", verb: "\u0930\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F" },
    array: { unit: "\u0924\u0924\u094D\u0935", verb: "\u0930\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F" },
    set: { unit: "\u0924\u0924\u094D\u0935", verb: "\u0930\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F" },
    map: { unit: "\u092A\u094D\u0930\u0935\u093F\u0937\u094D\u091F\u093F\u092F\u093E\u0901", verb: "\u0930\u0916\u0928\u0947 \u0915\u0947 \u0932\u093F\u090F" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0907\u0928\u092A\u0941\u091F",
    email: "\u0908\u092E\u0947\u0932 \u092A\u0924\u093E",
    url: "URL",
    emoji: "\u0907\u092E\u094B\u091C\u0940",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0924\u093F\u0925\u093F \u0914\u0930 \u0938\u092E\u092F",
    date: "ISO \u0924\u093F\u0925\u093F",
    time: "ISO \u0938\u092E\u092F",
    duration: "ISO \u0905\u0935\u0927\u093F",
    ipv4: "IPv4 \u092A\u0924\u093E",
    ipv6: "IPv6 \u092A\u0924\u093E",
    mac: "MAC \u092A\u0924\u093E",
    cidrv4: "IPv4 \u0936\u094D\u0930\u0947\u0923\u0940",
    cidrv6: "IPv6 \u0936\u094D\u0930\u0947\u0923\u0940",
    base64: "Base64-\u090F\u0928\u094D\u0915\u094B\u0921\u0947\u0921 \u0938\u094D\u091F\u094D\u0930\u093F\u0902\u0917",
    base64url: "Base64URL-\u090F\u0928\u094D\u0915\u094B\u0921\u0947\u0921 \u0938\u094D\u091F\u094D\u0930\u093F\u0902\u0917",
    json_string: "JSON \u0938\u094D\u091F\u094D\u0930\u093F\u0902\u0917",
    e164: "E.164 \u0938\u0902\u0916\u094D\u092F\u093E",
    credit_card: "\u0915\u094D\u0930\u0947\u0921\u093F\u091F \u0915\u093E\u0930\u094D\u0921 \u0938\u0902\u0916\u094D\u092F\u093E",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0907\u0928\u092A\u0941\u091F"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        return `\u0905\u092E\u093E\u0928\u094D\u092F \u0907\u0928\u092A\u0941\u091F: \u0905\u092A\u0947\u0915\u094D\u0937\u093F\u0924 ${expected}, \u092A\u094D\u0930\u093E\u092A\u094D\u0924 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0905\u092E\u093E\u0928\u094D\u092F \u0907\u0928\u092A\u0941\u091F: \u0905\u092A\u0947\u0915\u094D\u0937\u093F\u0924 ${stringifyPrimitive(issue2.values[0])}`;
        return `\u0905\u092E\u093E\u0928\u094D\u092F \u0935\u093F\u0915\u0932\u094D\u092A: \u0905\u092A\u0947\u0915\u094D\u0937\u093F\u0924 \u092E\u093E\u0928\u094B\u0902 \u092E\u0947\u0902 \u0938\u0947 \u090F\u0915 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u092C\u0939\u0941\u0924 \u092C\u0921\u093C\u093E: \u0905\u092A\u0947\u0915\u094D\u0937\u093F\u0924 \u0925\u093E \u0915\u093F ${issue2.origin ?? "\u092E\u093E\u0928"} \u092E\u0947\u0902 ${adj}${issue2.maximum} ${sizing.unit} \u0939\u094B\u0902`;
        return `\u092C\u0939\u0941\u0924 \u092C\u0921\u093C\u093E: \u0905\u092A\u0947\u0915\u094D\u0937\u093F\u0924 \u0925\u093E \u0915\u093F ${issue2.origin ?? "\u092E\u093E\u0928"} ${adj}${issue2.maximum} \u0939\u094B`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u092C\u0939\u0941\u0924 \u091B\u094B\u091F\u093E: \u0905\u092A\u0947\u0915\u094D\u0937\u093F\u0924 \u0925\u093E \u0915\u093F ${issue2.origin} \u092E\u0947\u0902 ${adj}${issue2.minimum} ${sizing.unit} \u0939\u094B\u0902`;
        return `\u092C\u0939\u0941\u0924 \u091B\u094B\u091F\u093E: \u0905\u092A\u0947\u0915\u094D\u0937\u093F\u0924 \u0925\u093E \u0915\u093F ${issue2.origin} ${adj}${issue2.minimum} \u0939\u094B`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u0905\u092E\u093E\u0928\u094D\u092F \u0938\u094D\u091F\u094D\u0930\u093F\u0902\u0917: "${_issue.prefix}" \u0938\u0947 \u0936\u0941\u0930\u0942 \u0939\u094B\u0928\u093E \u091A\u093E\u0939\u093F\u090F`;
        if (_issue.format === "ends_with")
          return `\u0905\u092E\u093E\u0928\u094D\u092F \u0938\u094D\u091F\u094D\u0930\u093F\u0902\u0917: "${_issue.suffix}" \u092A\u0930 \u0938\u092E\u093E\u092A\u094D\u0924 \u0939\u094B\u0928\u093E \u091A\u093E\u0939\u093F\u090F`;
        if (_issue.format === "includes")
          return `\u0905\u092E\u093E\u0928\u094D\u092F \u0938\u094D\u091F\u094D\u0930\u093F\u0902\u0917: \u0907\u0938\u092E\u0947\u0902 "${_issue.includes}" \u0936\u093E\u092E\u093F\u0932 \u0939\u094B\u0928\u093E \u091A\u093E\u0939\u093F\u090F`;
        if (_issue.format === "regex")
          return `\u0905\u092E\u093E\u0928\u094D\u092F \u0938\u094D\u091F\u094D\u0930\u093F\u0902\u0917: \u092A\u0948\u091F\u0930\u094D\u0928 ${_issue.pattern} \u0938\u0947 \u092E\u0947\u0932 \u0916\u093E\u0928\u093E \u091A\u093E\u0939\u093F\u090F`;
        return `\u0905\u092E\u093E\u0928\u094D\u092F ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u0905\u092E\u093E\u0928\u094D\u092F \u0938\u0902\u0916\u094D\u092F\u093E: \u092F\u0939 ${issue2.divisor} \u0915\u093E \u0917\u0941\u0923\u091C \u0939\u094B\u0928\u093E \u091A\u093E\u0939\u093F\u090F`;
      case "unrecognized_keys":
        return `\u0905\u092A\u0930\u093F\u091A\u093F\u0924 \u0915\u0941\u0902\u091C\u0940${issue2.keys.length > 1 ? "\u092F\u093E\u0901" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u0905\u092E\u093E\u0928\u094D\u092F \u0915\u0941\u0902\u091C\u0940: ${issue2.origin} \u092E\u0947\u0902`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `\u0905\u092E\u093E\u0928\u094D\u092F \u0921\u093F\u0938\u094D\u0915\u094D\u0930\u093F\u092E\u093F\u0928\u0947\u091F\u0930 \u092E\u093E\u0928: \u0905\u092A\u0947\u0915\u094D\u0937\u093F\u0924 ${opts}`;
        }
        return "\u0905\u092E\u093E\u0928\u094D\u092F \u0907\u0928\u092A\u0941\u091F";
      case "invalid_element":
        return `\u0905\u092E\u093E\u0928\u094D\u092F \u092E\u093E\u0928: ${issue2.origin} \u092E\u0947\u0902`;
      default:
        return `\u0905\u092E\u093E\u0928\u094D\u092F \u0907\u0928\u092A\u0941\u091F`;
    }
  };
};
function hi_default() {
  return {
    localeError: error21()
  };
}

// node_modules/zod/v4/locales/hr.js
var error22 = () => {
  const Sizable = {
    string: { unit: "znakova", verb: "imati" },
    file: { unit: "bajtova", verb: "imati" },
    array: { unit: "stavki", verb: "imati" },
    set: { unit: "stavki", verb: "imati" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "unos",
    email: "email adresa",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datum i vrijeme",
    date: "ISO datum",
    time: "ISO vrijeme",
    duration: "ISO trajanje",
    ipv4: "IPv4 adresa",
    ipv6: "IPv6 adresa",
    mac: "MAC adresa",
    cidrv4: "IPv4 raspon",
    cidrv6: "IPv6 raspon",
    base64: "base64 kodirani tekst",
    base64url: "base64url kodirani tekst",
    json_string: "JSON tekst",
    e164: "E.164 broj",
    credit_card: "broj kreditne kartice",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "unos"
  };
  const TypeDictionary = {
    nan: "NaN",
    string: "tekst",
    number: "broj",
    boolean: "boolean",
    array: "niz",
    object: "objekt",
    set: "skup",
    file: "datoteka",
    date: "datum",
    bigint: "bigint",
    symbol: "simbol",
    undefined: "undefined",
    null: "null",
    function: "funkcija",
    map: "mapa"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Neispravan unos: o\u010Dekuje se instanceof ${issue2.expected}, a primljeno je ${received}`;
        }
        return `Neispravan unos: o\u010Dekuje se ${expected}, a primljeno je ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Neispravna vrijednost: o\u010Dekivano ${stringifyPrimitive(issue2.values[0])}`;
        return `Neispravna opcija: o\u010Dekivano jedno od ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing)
          return `Preveliko: o\u010Dekivano da ${origin ?? "vrijednost"} ima ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemenata"}`;
        return `Preveliko: o\u010Dekivano da ${origin ?? "vrijednost"} bude ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        if (sizing) {
          return `Premalo: o\u010Dekivano da ${origin} ima ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Premalo: o\u010Dekivano da ${origin} bude ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Neispravan tekst: mora zapo\u010Dinjati s "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Neispravan tekst: mora zavr\u0161avati s "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Neispravan tekst: mora sadr\u017Eavati "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Neispravan tekst: mora odgovarati uzorku ${_issue.pattern}`;
        return `Neispravna ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Neispravan broj: mora biti vi\u0161ekratnik od ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Neprepoznat${issue2.keys.length > 1 ? "i klju\u010Devi" : " klju\u010D"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Neispravan klju\u010D u ${TypeDictionary[issue2.origin] ?? issue2.origin}`;
      case "invalid_union":
        return "Neispravan unos";
      case "invalid_element":
        return `Neispravna vrijednost u ${TypeDictionary[issue2.origin] ?? issue2.origin}`;
      default:
        return `Neispravan unos`;
    }
  };
};
function hr_default() {
  return {
    localeError: error22()
  };
}

// node_modules/zod/v4/locales/hu.js
var error23 = () => {
  const Sizable = {
    string: { unit: "karakter", verb: "legyen" },
    file: { unit: "byte", verb: "legyen" },
    array: { unit: "elem", verb: "legyen" },
    set: { unit: "elem", verb: "legyen" },
    map: { unit: "elem", verb: "legyen" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "bemenet",
    email: "email c\xEDm",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO id\u0151b\xE9lyeg",
    date: "ISO d\xE1tum",
    time: "ISO id\u0151",
    duration: "ISO id\u0151intervallum",
    ipv4: "IPv4 c\xEDm",
    ipv6: "IPv6 c\xEDm",
    mac: "MAC c\xEDm",
    cidrv4: "IPv4 tartom\xE1ny",
    cidrv6: "IPv6 tartom\xE1ny",
    base64: "base64-k\xF3dolt string",
    base64url: "base64url-k\xF3dolt string",
    json_string: "JSON string",
    e164: "E.164 sz\xE1m",
    credit_card: "hitelk\xE1rtyasz\xE1m",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "bemenet"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "sz\xE1m",
    array: "t\xF6mb"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k instanceof ${issue2.expected}, a kapott \xE9rt\xE9k ${received}`;
        }
        return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k ${expected}, a kapott \xE9rt\xE9k ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\xC9rv\xE9nytelen bemenet: a v\xE1rt \xE9rt\xE9k ${stringifyPrimitive(issue2.values[0])}`;
        return `\xC9rv\xE9nytelen opci\xF3: valamelyik \xE9rt\xE9k v\xE1rt ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `T\xFAl nagy: ${issue2.origin ?? "\xE9rt\xE9k"} m\xE9rete t\xFAl nagy ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elem"}`;
        return `T\xFAl nagy: a bemeneti \xE9rt\xE9k ${issue2.origin ?? "\xE9rt\xE9k"} t\xFAl nagy: ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `T\xFAl kicsi: a bemeneti \xE9rt\xE9k ${issue2.origin} m\xE9rete t\xFAl kicsi ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `T\xFAl kicsi: a bemeneti \xE9rt\xE9k ${issue2.origin} t\xFAl kicsi ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\xC9rv\xE9nytelen string: "${_issue.prefix}" \xE9rt\xE9kkel kell kezd\u0151dnie`;
        if (_issue.format === "ends_with")
          return `\xC9rv\xE9nytelen string: "${_issue.suffix}" \xE9rt\xE9kkel kell v\xE9gz\u0151dnie`;
        if (_issue.format === "includes")
          return `\xC9rv\xE9nytelen string: "${_issue.includes}" \xE9rt\xE9ket kell tartalmaznia`;
        if (_issue.format === "regex")
          return `\xC9rv\xE9nytelen string: ${_issue.pattern} mint\xE1nak kell megfelelnie`;
        return `\xC9rv\xE9nytelen ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\xC9rv\xE9nytelen sz\xE1m: ${issue2.divisor} t\xF6bbsz\xF6r\xF6s\xE9nek kell lennie`;
      case "unrecognized_keys":
        return `Ismeretlen kulcs${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\xC9rv\xE9nytelen kulcs ${issue2.origin}`;
      case "invalid_union":
        return "\xC9rv\xE9nytelen bemenet";
      case "invalid_element":
        return `\xC9rv\xE9nytelen \xE9rt\xE9k: ${issue2.origin}`;
      default:
        return `\xC9rv\xE9nytelen bemenet`;
    }
  };
};
function hu_default() {
  return {
    localeError: error23()
  };
}

// node_modules/zod/v4/locales/hy.js
function getArmenianPlural(count, one, many) {
  return Math.abs(count) === 1 ? one : many;
}
function withDefiniteArticle(word) {
  if (!word)
    return "";
  const vowels = ["\u0561", "\u0565", "\u0568", "\u056B", "\u0578", "\u0578\u0582", "\u0585"];
  const lastChar = word[word.length - 1];
  return word + (vowels.includes(lastChar) ? "\u0576" : "\u0568");
}
var error24 = () => {
  const Sizable = {
    string: {
      unit: {
        one: "\u0576\u0577\u0561\u0576",
        many: "\u0576\u0577\u0561\u0576\u0576\u0565\u0580"
      },
      verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C"
    },
    file: {
      unit: {
        one: "\u0562\u0561\u0575\u0569",
        many: "\u0562\u0561\u0575\u0569\u0565\u0580"
      },
      verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C"
    },
    array: {
      unit: {
        one: "\u057F\u0561\u0580\u0580",
        many: "\u057F\u0561\u0580\u0580\u0565\u0580"
      },
      verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C"
    },
    set: {
      unit: {
        one: "\u057F\u0561\u0580\u0580",
        many: "\u057F\u0561\u0580\u0580\u0565\u0580"
      },
      verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C"
    },
    map: {
      unit: {
        one: "\u057F\u0561\u0580\u0580",
        many: "\u057F\u0561\u0580\u0580\u0565\u0580"
      },
      verb: "\u0578\u0582\u0576\u0565\u0576\u0561\u056C"
    }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0574\u0578\u0582\u057F\u0584",
    email: "\u0567\u056C. \u0570\u0561\u057D\u0581\u0565",
    url: "URL",
    emoji: "\u0567\u0574\u0578\u057B\u056B",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0561\u0574\u057D\u0561\u0569\u056B\u057E \u0587 \u056A\u0561\u0574",
    date: "ISO \u0561\u0574\u057D\u0561\u0569\u056B\u057E",
    time: "ISO \u056A\u0561\u0574",
    duration: "ISO \u057F\u0587\u0578\u0572\u0578\u0582\u0569\u0575\u0578\u0582\u0576",
    ipv4: "IPv4 \u0570\u0561\u057D\u0581\u0565",
    ipv6: "IPv6 \u0570\u0561\u057D\u0581\u0565",
    mac: "MAC \u0570\u0561\u057D\u0581\u0565",
    cidrv4: "IPv4 \u0574\u056B\u057B\u0561\u056F\u0561\u0575\u0584",
    cidrv6: "IPv6 \u0574\u056B\u057B\u0561\u056F\u0561\u0575\u0584",
    base64: "base64 \u0571\u0587\u0561\u0579\u0561\u0583\u0578\u057E \u057F\u0578\u0572",
    base64url: "base64url \u0571\u0587\u0561\u0579\u0561\u0583\u0578\u057E \u057F\u0578\u0572",
    json_string: "JSON \u057F\u0578\u0572",
    e164: "E.164 \u0570\u0561\u0574\u0561\u0580",
    credit_card: "\u056F\u0580\u0565\u0564\u056B\u057F \u0584\u0561\u0580\u057F\u056B \u0570\u0561\u0574\u0561\u0580",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0574\u0578\u0582\u057F\u0584"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0569\u056B\u057E",
    array: "\u0566\u0561\u0576\u0563\u057E\u0561\u056E"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 instanceof ${issue2.expected}, \u057D\u057F\u0561\u0581\u057E\u0565\u056C \u0567 ${received}`;
        }
        return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 ${expected}, \u057D\u057F\u0561\u0581\u057E\u0565\u056C \u0567 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 ${stringifyPrimitive(issue2.values[1])}`;
        return `\u054D\u056D\u0561\u056C \u057F\u0561\u0580\u0562\u0565\u0580\u0561\u056F\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567\u0580 \u0570\u0565\u057F\u0587\u0575\u0561\u056C\u0576\u0565\u0580\u056B\u0581 \u0574\u0565\u056F\u0568\u055D ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const maxValue = Number(issue2.maximum);
          const unit = getArmenianPlural(maxValue, sizing.unit.one, sizing.unit.many);
          return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0574\u0565\u056E \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue2.origin ?? "\u0561\u0580\u056A\u0565\u0584")} \u056F\u0578\u0582\u0576\u0565\u0576\u0561 ${adj}${issue2.maximum.toString()} ${unit}`;
        }
        return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0574\u0565\u056E \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue2.origin ?? "\u0561\u0580\u056A\u0565\u0584")} \u056C\u056B\u0576\u056B ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const minValue = Number(issue2.minimum);
          const unit = getArmenianPlural(minValue, sizing.unit.one, sizing.unit.many);
          return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0583\u0578\u0584\u0580 \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue2.origin)} \u056F\u0578\u0582\u0576\u0565\u0576\u0561 ${adj}${issue2.minimum.toString()} ${unit}`;
        }
        return `\u0549\u0561\u0583\u0561\u0566\u0561\u0576\u0581 \u0583\u0578\u0584\u0580 \u0561\u0580\u056A\u0565\u0584\u2024 \u057D\u057A\u0561\u057D\u057E\u0578\u0582\u0574 \u0567, \u0578\u0580 ${withDefiniteArticle(issue2.origin)} \u056C\u056B\u0576\u056B ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u057D\u056F\u057D\u057E\u056B "${_issue.prefix}"-\u0578\u057E`;
        if (_issue.format === "ends_with")
          return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u0561\u057E\u0561\u0580\u057F\u057E\u056B "${_issue.suffix}"-\u0578\u057E`;
        if (_issue.format === "includes")
          return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u057A\u0561\u0580\u0578\u0582\u0576\u0561\u056F\u056B "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u054D\u056D\u0561\u056C \u057F\u0578\u0572\u2024 \u057A\u0565\u057F\u0584 \u0567 \u0570\u0561\u0574\u0561\u057A\u0561\u057F\u0561\u057D\u056D\u0561\u0576\u056B ${_issue.pattern} \u0571\u0587\u0561\u0579\u0561\u0583\u056B\u0576`;
        return `\u054D\u056D\u0561\u056C ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u054D\u056D\u0561\u056C \u0569\u056B\u057E\u2024 \u057A\u0565\u057F\u0584 \u0567 \u0562\u0561\u0566\u0574\u0561\u057A\u0561\u057F\u056B\u056F \u056C\u056B\u0576\u056B ${issue2.divisor}-\u056B`;
      case "unrecognized_keys":
        return `\u0549\u0573\u0561\u0576\u0561\u0579\u057E\u0561\u056E \u0562\u0561\u0576\u0561\u056C\u056B${issue2.keys.length > 1 ? "\u0576\u0565\u0580" : ""}. ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u054D\u056D\u0561\u056C \u0562\u0561\u0576\u0561\u056C\u056B ${withDefiniteArticle(issue2.origin)}-\u0578\u0582\u0574`;
      case "invalid_union":
        return "\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574";
      case "invalid_element":
        return `\u054D\u056D\u0561\u056C \u0561\u0580\u056A\u0565\u0584 ${withDefiniteArticle(issue2.origin)}-\u0578\u0582\u0574`;
      default:
        return `\u054D\u056D\u0561\u056C \u0574\u0578\u0582\u057F\u0584\u0561\u0563\u0580\u0578\u0582\u0574`;
    }
  };
};
function hy_default() {
  return {
    localeError: error24()
  };
}

// node_modules/zod/v4/locales/id.js
var error25 = () => {
  const Sizable = {
    string: { unit: "karakter", verb: "memiliki" },
    file: { unit: "byte", verb: "memiliki" },
    array: { unit: "item", verb: "memiliki" },
    set: { unit: "item", verb: "memiliki" },
    map: { unit: "item", verb: "memiliki" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "alamat email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "tanggal dan waktu format ISO",
    date: "tanggal format ISO",
    time: "jam format ISO",
    duration: "durasi format ISO",
    ipv4: "alamat IPv4",
    ipv6: "alamat IPv6",
    mac: "alamat MAC",
    cidrv4: "rentang alamat IPv4",
    cidrv6: "rentang alamat IPv6",
    base64: "string dengan enkode base64",
    base64url: "string dengan enkode base64url",
    json_string: "string JSON",
    e164: "angka E.164",
    credit_card: "nomor kartu kredit",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Input tidak valid: diharapkan instanceof ${issue2.expected}, diterima ${received}`;
        }
        return `Input tidak valid: diharapkan ${expected}, diterima ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Input tidak valid: diharapkan ${stringifyPrimitive(issue2.values[0])}`;
        return `Pilihan tidak valid: diharapkan salah satu dari ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Terlalu besar: diharapkan ${issue2.origin ?? "value"} memiliki ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemen"}`;
        return `Terlalu besar: diharapkan ${issue2.origin ?? "value"} menjadi ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Terlalu kecil: diharapkan ${issue2.origin} memiliki ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Terlalu kecil: diharapkan ${issue2.origin} menjadi ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `String tidak valid: harus dimulai dengan "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `String tidak valid: harus berakhir dengan "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `String tidak valid: harus menyertakan "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `String tidak valid: harus sesuai pola ${_issue.pattern}`;
        return `${FormatDictionary[_issue.format] ?? issue2.format} tidak valid`;
      }
      case "not_multiple_of":
        return `Angka tidak valid: harus kelipatan dari ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Kunci tidak dikenali ${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Kunci tidak valid di ${issue2.origin}`;
      case "invalid_union":
        return "Input tidak valid";
      case "invalid_element":
        return `Nilai tidak valid di ${issue2.origin}`;
      default:
        return `Input tidak valid`;
    }
  };
};
function id_default() {
  return {
    localeError: error25()
  };
}

// node_modules/zod/v4/locales/is.js
var error26 = () => {
  const Sizable = {
    string: { unit: "stafi", verb: "a\xF0 hafa" },
    file: { unit: "b\xE6ti", verb: "a\xF0 hafa" },
    array: { unit: "hluti", verb: "a\xF0 hafa" },
    set: { unit: "hluti", verb: "a\xF0 hafa" },
    map: { unit: "hluti", verb: "a\xF0 hafa" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "gildi",
    email: "netfang",
    url: "vefsl\xF3\xF0",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO dagsetning og t\xEDmi",
    date: "ISO dagsetning",
    time: "ISO t\xEDmi",
    duration: "ISO t\xEDmalengd",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    mac: "MAC address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded strengur",
    base64url: "base64url-encoded strengur",
    json_string: "JSON strengur",
    e164: "E.164 t\xF6lugildi",
    credit_card: "kreditkortan\xFAmer",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "gildi"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "n\xFAmer",
    array: "fylki"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Rangt gildi: \xDE\xFA sl\xF3st inn ${received} \xFEar sem \xE1 a\xF0 vera instanceof ${issue2.expected}`;
        }
        return `Rangt gildi: \xDE\xFA sl\xF3st inn ${received} \xFEar sem \xE1 a\xF0 vera ${expected}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Rangt gildi: gert r\xE1\xF0 fyrir ${stringifyPrimitive(issue2.values[0])}`;
        return `\xD3gilt val: m\xE1 vera eitt af eftirfarandi ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Of st\xF3rt: gert er r\xE1\xF0 fyrir a\xF0 ${issue2.origin ?? "gildi"} hafi ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "hluti"}`;
        return `Of st\xF3rt: gert er r\xE1\xF0 fyrir a\xF0 ${issue2.origin ?? "gildi"} s\xE9 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Of l\xEDti\xF0: gert er r\xE1\xF0 fyrir a\xF0 ${issue2.origin} hafi ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Of l\xEDti\xF0: gert er r\xE1\xF0 fyrir a\xF0 ${issue2.origin} s\xE9 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\xD3gildur strengur: ver\xF0ur a\xF0 byrja \xE1 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\xD3gildur strengur: ver\xF0ur a\xF0 enda \xE1 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\xD3gildur strengur: ver\xF0ur a\xF0 innihalda "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\xD3gildur strengur: ver\xF0ur a\xF0 fylgja mynstri ${_issue.pattern}`;
        return `Rangt ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `R\xF6ng tala: ver\xF0ur a\xF0 vera margfeldi af ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\xD3\xFEekkt ${issue2.keys.length > 1 ? "ir lyklar" : "ur lykill"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Rangur lykill \xED ${issue2.origin}`;
      case "invalid_union":
        return "Rangt gildi";
      case "invalid_element":
        return `Rangt gildi \xED ${issue2.origin}`;
      default:
        return `Rangt gildi`;
    }
  };
};
function is_default() {
  return {
    localeError: error26()
  };
}

// node_modules/zod/v4/locales/it.js
var error27 = () => {
  const Sizable = {
    string: { unit: "caratteri", verb: "avere" },
    file: { unit: "byte", verb: "avere" },
    array: { unit: "elementi", verb: "avere" },
    set: { unit: "elementi", verb: "avere" },
    map: { unit: "elementi", verb: "avere" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "indirizzo email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "data e ora ISO",
    date: "data ISO",
    time: "ora ISO",
    duration: "durata ISO",
    ipv4: "indirizzo IPv4",
    ipv6: "indirizzo IPv6",
    mac: "indirizzo MAC",
    cidrv4: "intervallo IPv4",
    cidrv6: "intervallo IPv6",
    base64: "stringa codificata in base64",
    base64url: "URL codificata in base64",
    json_string: "stringa JSON",
    e164: "numero E.164",
    credit_card: "numero di carta di credito",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "numero",
    array: "vettore"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Input non valido: atteso instanceof ${issue2.expected}, ricevuto ${received}`;
        }
        return `Input non valido: atteso ${expected}, ricevuto ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Input non valido: atteso ${stringifyPrimitive(issue2.values[0])}`;
        return `Opzione non valida: atteso uno tra ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Troppo grande: ${issue2.origin ?? "valore"} deve avere ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementi"}`;
        return `Troppo grande: ${issue2.origin ?? "valore"} deve essere ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Troppo piccolo: ${issue2.origin} deve avere ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Troppo piccolo: ${issue2.origin} deve essere ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Stringa non valida: deve iniziare con "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Stringa non valida: deve terminare con "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Stringa non valida: deve includere "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Stringa non valida: deve corrispondere al pattern ${_issue.pattern}`;
        return `Input non valido: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Numero non valido: deve essere un multiplo di ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Chiav${issue2.keys.length > 1 ? "i" : "e"} non riconosciut${issue2.keys.length > 1 ? "e" : "a"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Chiave non valida in ${issue2.origin}`;
      case "invalid_union":
        return "Input non valido";
      case "invalid_element":
        return `Valore non valido in ${issue2.origin}`;
      default:
        return `Input non valido`;
    }
  };
};
function it_default() {
  return {
    localeError: error27()
  };
}

// node_modules/zod/v4/locales/ja.js
var error28 = () => {
  const Sizable = {
    string: { unit: "\u6587\u5B57", verb: "\u3067\u3042\u308B" },
    file: { unit: "\u30D0\u30A4\u30C8", verb: "\u3067\u3042\u308B" },
    array: { unit: "\u8981\u7D20", verb: "\u3067\u3042\u308B" },
    set: { unit: "\u8981\u7D20", verb: "\u3067\u3042\u308B" },
    map: { unit: "\u8981\u7D20", verb: "\u3067\u3042\u308B" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u5165\u529B\u5024",
    email: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9",
    url: "URL",
    emoji: "\u7D75\u6587\u5B57",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO\u65E5\u6642",
    date: "ISO\u65E5\u4ED8",
    time: "ISO\u6642\u523B",
    duration: "ISO\u671F\u9593",
    ipv4: "IPv4\u30A2\u30C9\u30EC\u30B9",
    ipv6: "IPv6\u30A2\u30C9\u30EC\u30B9",
    mac: "MAC\u30A2\u30C9\u30EC\u30B9",
    cidrv4: "IPv4\u7BC4\u56F2",
    cidrv6: "IPv6\u7BC4\u56F2",
    base64: "base64\u30A8\u30F3\u30B3\u30FC\u30C9\u6587\u5B57\u5217",
    base64url: "base64url\u30A8\u30F3\u30B3\u30FC\u30C9\u6587\u5B57\u5217",
    json_string: "JSON\u6587\u5B57\u5217",
    e164: "E.164\u756A\u53F7",
    credit_card: "\u30AF\u30EC\u30B8\u30C3\u30C8\u30AB\u30FC\u30C9\u756A\u53F7",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u5165\u529B\u5024"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u6570\u5024",
    array: "\u914D\u5217"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u7121\u52B9\u306A\u5165\u529B: instanceof ${issue2.expected}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F\u304C\u3001${received}\u304C\u5165\u529B\u3055\u308C\u307E\u3057\u305F`;
        }
        return `\u7121\u52B9\u306A\u5165\u529B: ${expected}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F\u304C\u3001${received}\u304C\u5165\u529B\u3055\u308C\u307E\u3057\u305F`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u7121\u52B9\u306A\u5165\u529B: ${stringifyPrimitive(issue2.values[0])}\u304C\u671F\u5F85\u3055\u308C\u307E\u3057\u305F`;
        return `\u7121\u52B9\u306A\u9078\u629E: ${joinValues(issue2.values, "\u3001")}\u306E\u3044\u305A\u308C\u304B\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      case "too_big": {
        const adj = issue2.inclusive ? "\u4EE5\u4E0B\u3067\u3042\u308B" : "\u3088\u308A\u5C0F\u3055\u3044";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u5927\u304D\u3059\u304E\u308B\u5024: ${issue2.origin ?? "\u5024"}\u306F${issue2.maximum.toString()}${sizing.unit ?? "\u8981\u7D20"}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        return `\u5927\u304D\u3059\u304E\u308B\u5024: ${issue2.origin ?? "\u5024"}\u306F${issue2.maximum.toString()}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\u4EE5\u4E0A\u3067\u3042\u308B" : "\u3088\u308A\u5927\u304D\u3044";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u5C0F\u3055\u3059\u304E\u308B\u5024: ${issue2.origin}\u306F${issue2.minimum.toString()}${sizing.unit}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        return `\u5C0F\u3055\u3059\u304E\u308B\u5024: ${issue2.origin}\u306F${issue2.minimum.toString()}${adj}\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.prefix}"\u3067\u59CB\u307E\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        if (_issue.format === "ends_with")
          return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.suffix}"\u3067\u7D42\u308F\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        if (_issue.format === "includes")
          return `\u7121\u52B9\u306A\u6587\u5B57\u5217: "${_issue.includes}"\u3092\u542B\u3080\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        if (_issue.format === "regex")
          return `\u7121\u52B9\u306A\u6587\u5B57\u5217: \u30D1\u30BF\u30FC\u30F3${_issue.pattern}\u306B\u4E00\u81F4\u3059\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
        return `\u7121\u52B9\u306A${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u7121\u52B9\u306A\u6570\u5024: ${issue2.divisor}\u306E\u500D\u6570\u3067\u3042\u308B\u5FC5\u8981\u304C\u3042\u308A\u307E\u3059`;
      case "unrecognized_keys":
        return `\u8A8D\u8B58\u3055\u308C\u3066\u3044\u306A\u3044\u30AD\u30FC${issue2.keys.length > 1 ? "\u7FA4" : ""}: ${joinValues(issue2.keys, "\u3001")}`;
      case "invalid_key":
        return `${issue2.origin}\u5185\u306E\u7121\u52B9\u306A\u30AD\u30FC`;
      case "invalid_union":
        return "\u7121\u52B9\u306A\u5165\u529B";
      case "invalid_element":
        return `${issue2.origin}\u5185\u306E\u7121\u52B9\u306A\u5024`;
      default:
        return `\u7121\u52B9\u306A\u5165\u529B`;
    }
  };
};
function ja_default() {
  return {
    localeError: error28()
  };
}

// node_modules/zod/v4/locales/ka.js
var error29 = () => {
  const Sizable = {
    string: { unit: "\u10E1\u10D8\u10DB\u10D1\u10DD\u10DA\u10DD", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" },
    file: { unit: "\u10D1\u10D0\u10D8\u10E2\u10D8", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" },
    array: { unit: "\u10D4\u10DA\u10D4\u10DB\u10D4\u10DC\u10E2\u10D8", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" },
    set: { unit: "\u10D4\u10DA\u10D4\u10DB\u10D4\u10DC\u10E2\u10D8", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" },
    map: { unit: "\u10D4\u10DA\u10D4\u10DB\u10D4\u10DC\u10E2\u10D8", verb: "\u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0",
    email: "\u10D4\u10DA-\u10E4\u10DD\u10E1\u10E2\u10D8\u10E1 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8",
    url: "URL",
    emoji: "\u10D4\u10DB\u10DD\u10EF\u10D8",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8-\u10D3\u10E0\u10DD",
    date: "\u10D7\u10D0\u10E0\u10D8\u10E6\u10D8",
    time: "\u10D3\u10E0\u10DD",
    duration: "\u10EE\u10D0\u10DC\u10D2\u10E0\u10EB\u10DA\u10D8\u10D5\u10DD\u10D1\u10D0",
    ipv4: "IPv4 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8",
    ipv6: "IPv6 \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8",
    mac: "MAC \u10DB\u10D8\u10E1\u10D0\u10DB\u10D0\u10E0\u10D7\u10D8",
    cidrv4: "IPv4 \u10D3\u10D8\u10D0\u10DE\u10D0\u10D6\u10DD\u10DC\u10D8",
    cidrv6: "IPv6 \u10D3\u10D8\u10D0\u10DE\u10D0\u10D6\u10DD\u10DC\u10D8",
    base64: "base64-\u10D9\u10DD\u10D3\u10D8\u10E0\u10D4\u10D1\u10E3\u10DA\u10D8 \u10D5\u10D4\u10DA\u10D8",
    base64url: "base64url-\u10D9\u10DD\u10D3\u10D8\u10E0\u10D4\u10D1\u10E3\u10DA\u10D8 \u10D5\u10D4\u10DA\u10D8",
    json_string: "JSON \u10D5\u10D4\u10DA\u10D8",
    e164: "E.164 \u10DC\u10DD\u10DB\u10D4\u10E0\u10D8",
    credit_card: "\u10E1\u10D0\u10D9\u10E0\u10D4\u10D3\u10D8\u10E2\u10DD \u10D1\u10D0\u10E0\u10D0\u10D7\u10D8\u10E1 \u10DC\u10DD\u10DB\u10D4\u10E0\u10D8",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u10E0\u10D8\u10EA\u10EE\u10D5\u10D8",
    string: "\u10D5\u10D4\u10DA\u10D8",
    boolean: "\u10D1\u10E3\u10DA\u10D4\u10D0\u10DC\u10D8",
    function: "\u10E4\u10E3\u10DC\u10E5\u10EA\u10D8\u10D0",
    array: "\u10DB\u10D0\u10E1\u10D8\u10D5\u10D8"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 instanceof ${issue2.expected}, \u10DB\u10D8\u10E6\u10D4\u10D1\u10E3\u10DA\u10D8 ${received}`;
        }
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${expected}, \u10DB\u10D8\u10E6\u10D4\u10D1\u10E3\u10DA\u10D8 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${stringifyPrimitive(issue2.values[0])}`;
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D0\u10E0\u10D8\u10D0\u10DC\u10E2\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8\u10D0 \u10D4\u10E0\u10D7-\u10D4\u10E0\u10D7\u10D8 ${joinValues(issue2.values, "|")}-\u10D3\u10D0\u10DC`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10D3\u10D8\u10D3\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue2.origin ?? "\u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit}`;
        return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10D3\u10D8\u10D3\u10D8: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue2.origin ?? "\u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0"} \u10D8\u10E7\u10DD\u10E1 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10DE\u10D0\u10E2\u10D0\u10E0\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u10D6\u10D4\u10D3\u10DB\u10D4\u10E2\u10D0\u10D3 \u10DE\u10D0\u10E2\u10D0\u10E0\u10D0: \u10DB\u10DD\u10E1\u10D0\u10DA\u10DD\u10D3\u10DC\u10D4\u10DA\u10D8 ${issue2.origin} \u10D8\u10E7\u10DD\u10E1 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10D8\u10EC\u10E7\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 "${_issue.prefix}"-\u10D8\u10D7`;
        }
        if (_issue.format === "ends_with")
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10DB\u10D7\u10D0\u10D5\u10E0\u10D3\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 "${_issue.suffix}"-\u10D8\u10D7`;
        if (_issue.format === "includes")
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D8\u10EA\u10D0\u10D5\u10D3\u10D4\u10E1 "${_issue.includes}"-\u10E1`;
        if (_issue.format === "regex")
          return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D5\u10D4\u10DA\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10E8\u10D4\u10D4\u10E1\u10D0\u10D1\u10D0\u10DB\u10D4\u10D1\u10DD\u10D3\u10D4\u10E1 \u10E8\u10D0\u10D1\u10DA\u10DD\u10DC\u10E1 ${_issue.pattern}`;
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E0\u10D8\u10EA\u10EE\u10D5\u10D8: \u10E3\u10DC\u10D3\u10D0 \u10D8\u10E7\u10DD\u10E1 ${issue2.divisor}-\u10D8\u10E1 \u10EF\u10D4\u10E0\u10D0\u10D3\u10D8`;
      case "unrecognized_keys":
        return `\u10E3\u10EA\u10DC\u10DD\u10D1\u10D8 \u10D2\u10D0\u10E1\u10D0\u10E6\u10D4\u10D1${issue2.keys.length > 1 ? "\u10D4\u10D1\u10D8" : "\u10D8"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10D2\u10D0\u10E1\u10D0\u10E6\u10D4\u10D1\u10D8 ${issue2.origin}-\u10E8\u10D8`;
      case "invalid_union":
        return "\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0";
      case "invalid_element":
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10DB\u10DC\u10D8\u10E8\u10D5\u10DC\u10D4\u10DA\u10DD\u10D1\u10D0 ${issue2.origin}-\u10E8\u10D8`;
      default:
        return `\u10D0\u10E0\u10D0\u10E1\u10EC\u10DD\u10E0\u10D8 \u10E8\u10D4\u10E7\u10D5\u10D0\u10DC\u10D0`;
    }
  };
};
function ka_default() {
  return {
    localeError: error29()
  };
}

// node_modules/zod/v4/locales/km.js
var error30 = () => {
  const Sizable = {
    string: { unit: "\u178F\u17BD\u17A2\u1780\u17D2\u179F\u179A", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" },
    file: { unit: "\u1794\u17C3", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" },
    array: { unit: "\u1792\u17B6\u178F\u17BB", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" },
    set: { unit: "\u1792\u17B6\u178F\u17BB", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" },
    map: { unit: "\u1792\u17B6\u178F\u17BB", verb: "\u1782\u17BD\u179A\u1798\u17B6\u1793" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B",
    email: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793\u17A2\u17CA\u17B8\u1798\u17C2\u179B",
    url: "URL",
    emoji: "\u179F\u1789\u17D2\u1789\u17B6\u17A2\u17B6\u179A\u1798\u17D2\u1798\u178E\u17CD",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u1780\u17B6\u179B\u1794\u179A\u17B7\u1785\u17D2\u1786\u17C1\u1791 \u1793\u17B7\u1784\u1798\u17C9\u17C4\u1784 ISO",
    date: "\u1780\u17B6\u179B\u1794\u179A\u17B7\u1785\u17D2\u1786\u17C1\u1791 ISO",
    time: "\u1798\u17C9\u17C4\u1784 ISO",
    duration: "\u179A\u1799\u17C8\u1796\u17C1\u179B ISO",
    ipv4: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv4",
    ipv6: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv6",
    mac: "\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 MAC",
    cidrv4: "\u178A\u17C2\u1793\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv4",
    cidrv6: "\u178A\u17C2\u1793\u17A2\u17B6\u179F\u1799\u178A\u17D2\u178B\u17B6\u1793 IPv6",
    base64: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u17A2\u17CA\u17B7\u1780\u17BC\u178A base64",
    base64url: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u17A2\u17CA\u17B7\u1780\u17BC\u178A base64url",
    json_string: "\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A JSON",
    e164: "\u179B\u17C1\u1781 E.164",
    credit_card: "\u179B\u17C1\u1781\u1794\u17D0\u178E\u17D2\u178E\u17A5\u178E\u1791\u17B6\u1793",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u179B\u17C1\u1781",
    array: "\u17A2\u17B6\u179A\u17C1 (Array)",
    null: "\u1782\u17D2\u1798\u17B6\u1793\u178F\u1798\u17D2\u179B\u17C3 (null)"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A instanceof ${issue2.expected} \u1794\u17C9\u17BB\u1793\u17D2\u178F\u17C2\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793 ${received}`;
        }
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${expected} \u1794\u17C9\u17BB\u1793\u17D2\u178F\u17C2\u1791\u1791\u17BD\u179B\u1794\u17B6\u1793 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1794\u1789\u17D2\u1785\u17BC\u179B\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${stringifyPrimitive(issue2.values[0])}`;
        return `\u1787\u1798\u17D2\u179A\u17BE\u179F\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1787\u17B6\u1798\u17BD\u1799\u1780\u17D2\u1793\u17BB\u1784\u1785\u17C6\u178E\u17C4\u1798 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u1792\u17C6\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin ?? "\u178F\u1798\u17D2\u179B\u17C3"} ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "\u1792\u17B6\u178F\u17BB"}`;
        return `\u1792\u17C6\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin ?? "\u178F\u1798\u17D2\u179B\u17C3"} ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u178F\u17BC\u1785\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin} ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u178F\u17BC\u1785\u1796\u17C1\u1780\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1780\u17B6\u179A ${issue2.origin} ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1785\u17B6\u1794\u17CB\u1795\u17D2\u178F\u17BE\u1798\u178A\u17C4\u1799 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1794\u1789\u17D2\u1785\u1794\u17CB\u178A\u17C4\u1799 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u1798\u17B6\u1793 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u1781\u17D2\u179F\u17C2\u17A2\u1780\u17D2\u179F\u179A\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u178F\u17C2\u1795\u17D2\u1782\u17BC\u1795\u17D2\u1782\u1784\u1793\u17B9\u1784\u1791\u1798\u17D2\u179A\u1784\u17CB\u178A\u17C2\u179B\u1794\u17B6\u1793\u1780\u17C6\u178E\u178F\u17CB ${_issue.pattern}`;
        return `\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u179B\u17C1\u1781\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u17D6 \u178F\u17D2\u179A\u17BC\u179C\u178F\u17C2\u1787\u17B6\u1796\u17A0\u17BB\u1782\u17BB\u178E\u1793\u17C3 ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u179A\u1780\u1783\u17BE\u1789\u179F\u17C4\u1798\u17B7\u1793\u179F\u17D2\u1782\u17B6\u179B\u17CB\u17D6 ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u179F\u17C4\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u1793\u17C5\u1780\u17D2\u1793\u17BB\u1784 ${issue2.origin}`;
      case "invalid_union":
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C`;
      case "invalid_element":
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C\u1793\u17C5\u1780\u17D2\u1793\u17BB\u1784 ${issue2.origin}`;
      default:
        return `\u1791\u17B7\u1793\u17D2\u1793\u1793\u17D0\u1799\u1798\u17B7\u1793\u178F\u17D2\u179A\u17B9\u1798\u178F\u17D2\u179A\u17BC\u179C`;
    }
  };
};
function km_default() {
  return {
    localeError: error30()
  };
}

// node_modules/zod/v4/locales/kh.js
function kh_default() {
  return km_default();
}

// node_modules/zod/v4/locales/kn.js
var error31 = () => {
  const Sizable = {
    string: { unit: "\u0C85\u0C95\u0CCD\u0CB7\u0CB0\u0C97\u0CB3\u0CC1", verb: "\u0CB9\u0CCA\u0C82\u0CA6\u0CB2\u0CC1" },
    file: { unit: "\u0CAC\u0CC8\u0C9F\u0CCD\u200C\u0C97\u0CB3\u0CC1", verb: "\u0CB9\u0CCA\u0C82\u0CA6\u0CB2\u0CC1" },
    array: { unit: "\u0CB5\u0CB8\u0CCD\u0CA4\u0CC1\u0C97\u0CB3\u0CC1", verb: "\u0CB9\u0CCA\u0C82\u0CA6\u0CB2\u0CC1" },
    set: { unit: "\u0CB5\u0CB8\u0CCD\u0CA4\u0CC1\u0C97\u0CB3\u0CC1", verb: "\u0CB9\u0CCA\u0C82\u0CA6\u0CB2\u0CC1" },
    map: { unit: "entries", verb: "\u0CB9\u0CCA\u0C82\u0CA6\u0CB2\u0CC1" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0C87\u0CA8\u0CCD\u0CAA\u0CC1\u0C9F\u0CCD",
    email: "email \u0CB5\u0CBF\u0CB3\u0CBE\u0CB8",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0CA6\u0CBF\u0CA8\u0CBE\u0C82\u0C95\u0CA6 \u0CB8\u0CAE\u0CAF",
    date: "ISO \u0CA6\u0CBF\u0CA8\u0CBE\u0C82\u0C95",
    time: "ISO \u0CB8\u0CAE\u0CAF",
    duration: "ISO \u0C85\u0CB5\u0CA7\u0CBF",
    ipv4: "IPv4 \u0CB5\u0CBF\u0CB3\u0CBE\u0CB8",
    ipv6: "IPv6 \u0CB5\u0CBF\u0CB3\u0CBE\u0CB8",
    mac: "MAC \u0CB5\u0CBF\u0CB3\u0CBE\u0CB8",
    cidrv4: "IPv4 \u0CB5\u0CCD\u0CAF\u0CBE\u0CAA\u0CCD\u0CA4\u0CBF\u0CAF",
    cidrv6: "IPv6 \u0CB5\u0CCD\u0CAF\u0CBE\u0CAA\u0CCD\u0CA4\u0CBF\u0CAF",
    base64: "base64-encoded\u0CB8\u0CCD\u0C9F\u0CCD\u0CB0\u0CBF\u0C82\u0C97\u0CCD",
    base64url: "base64url-encoded\u0CB8\u0CCD\u0C9F\u0CCD\u0CB0\u0CBF\u0C82\u0C97\u0CCD",
    json_string: "JSON\u0CB8\u0CCD\u0C9F\u0CCD\u0CB0\u0CBF\u0C82\u0C97\u0CCD",
    e164: "E.164 \u0CB8\u0C82\u0C96\u0CCD\u0CAF\u0CC6",
    credit_card: "\u0C95\u0CCD\u0CB0\u0CC6\u0CA1\u0CBF\u0C9F\u0CCD \u0C95\u0CBE\u0CB0\u0CCD\u0CA1\u0CCD \u0CB8\u0C82\u0C96\u0CCD\u0CAF\u0CC6",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0C87\u0CA8\u0CCD\u0CAA\u0CC1\u0C9F\u0CCD"
  };
  const TypeDictionary = {
    // Compatibility: "nan" -> "NaN" for display
    nan: "NaN"
    // All other type names omitted - they fall back to raw values via ?? operator
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        return `\u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF \u0C87\u0CA8\u0CCD\u200C\u0CAA\u0CC1\u0C9F\u0CCD: \u0CA8\u0CBF\u0CB0\u0CC0\u0C95\u0CCD\u0CB7\u0CBF\u0CB8\u0CB2\u0CBE\u0C97\u0CBF\u0CA6\u0CC6 ${expected}, \u0CB8\u0CCD\u0CB5\u0CC0\u0C95\u0CB0\u0CBF\u0CB8\u0CBF\u0CA6\u0CA8\u0CC1 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF \u0C87\u0CA8\u0CCD\u200C\u0CAA\u0CC1\u0C9F\u0CCD: \u0CA8\u0CBF\u0CB0\u0CC0\u0C95\u0CCD\u0CB7\u0CBF\u0CB8\u0CB2\u0CBE\u0C97\u0CBF\u0CA6\u0CC6 ${stringifyPrimitive(issue2.values[0])}`;
        return `\u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF \u0C86\u0CAF\u0CCD\u0C95\u0CC6: \u0C87\u0CB5\u0CC1\u0C97\u0CB3\u0CB2\u0CCD\u0CB2\u0CBF \u0C92\u0C82\u0CA6\u0CA8\u0CCD\u0CA8\u0CC1 \u0CA8\u0CBF\u0CB0\u0CC0\u0C95\u0CCD\u0CB7\u0CBF\u0CB8\u0CB2\u0CBE\u0C97\u0CBF\u0CA6\u0CC6 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0CA4\u0CC1\u0C82\u0CAC\u0CBE \u0CA6\u0CCA\u0CA1\u0CCD\u0CA1\u0CA6\u0CC1: \u0CA8\u0CBF\u0CB0\u0CC0\u0C95\u0CCD\u0CB7\u0CBF\u0CB8\u0CB2\u0CBE\u0C97\u0CBF\u0CA6\u0CC6 ${issue2.origin ?? "value"} \u0CB9\u0CCA\u0C82\u0CA6\u0CB2\u0CC1 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0C85\u0C82\u0CB6\u0C97\u0CB3\u0CC1"}`;
        return `\u0CA4\u0CC1\u0C82\u0CAC\u0CBE \u0CA6\u0CCA\u0CA1\u0CCD\u0CA1\u0CA6\u0CC1: \u0CA8\u0CBF\u0CB0\u0CC0\u0C95\u0CCD\u0CB7\u0CBF\u0CB8\u0CB2\u0CBE\u0C97\u0CBF\u0CA6\u0CC6 ${issue2.origin ?? "value"} \u0C8E\u0C82\u0CA6\u0CC1 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0CA4\u0CC1\u0C82\u0CAC\u0CBE \u0C9A\u0CBF\u0C95\u0CCD\u0C95\u0CA6\u0CC1: \u0CA8\u0CBF\u0CB0\u0CC0\u0C95\u0CCD\u0CB7\u0CBF\u0CB8\u0CB2\u0CBE\u0C97\u0CBF\u0CA6\u0CC6 ${issue2.origin} \u0CB9\u0CCA\u0C82\u0CA6\u0CB2\u0CC1 ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u0CA4\u0CC1\u0C82\u0CAC\u0CBE \u0C9A\u0CBF\u0C95\u0CCD\u0C95\u0CA6\u0CC1: \u0CA8\u0CBF\u0CB0\u0CC0\u0C95\u0CCD\u0CB7\u0CBF\u0CB8\u0CB2\u0CBE\u0C97\u0CBF\u0CA6\u0CC6 ${issue2.origin} \u0C8E\u0C82\u0CA6\u0CC1 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF\u0CB5\u0CBE\u0CA6 \u0CB8\u0CCD\u0C9F\u0CCD\u0CB0\u0CBF\u0C82\u0C97\u0CCD: \u0C87\u0CA6\u0CB0\u0CCA\u0C82\u0CA6\u0CBF\u0C97\u0CC6 \u0CAA\u0CCD\u0CB0\u0CBE\u0CB0\u0C82\u0CAD\u0CBF\u0CB8\u0CAC\u0CC7\u0C95\u0CC1 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF\u0CB5\u0CBE\u0CA6 \u0CB8\u0CCD\u0C9F\u0CCD\u0CB0\u0CBF\u0C82\u0C97\u0CCD: \u0C87\u0CA6\u0CB0\u0CCA\u0C82\u0CA6\u0CBF\u0C97\u0CC6 \u0C95\u0CCA\u0CA8\u0CC6\u0C97\u0CCA\u0CB3\u0CCD\u0CB3\u0CAC\u0CC7\u0C95\u0CC1 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF \u0CB8\u0CCD\u0C9F\u0CCD\u0CB0\u0CBF\u0C82\u0C97\u0CCD: \u0C92\u0CB3\u0C97\u0CCA\u0C82\u0CA1\u0CBF\u0CB0\u0CAC\u0CC7\u0C95\u0CC1 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF\u0CB5\u0CBE\u0CA6 \u0CB8\u0CCD\u0C9F\u0CCD\u0CB0\u0CBF\u0C82\u0C97\u0CCD: \u0CAE\u0CBE\u0CA6\u0CB0\u0CBF\u0C97\u0CC6 \u0CB9\u0CCA\u0C82\u0CA6\u0CBF\u0C95\u0CC6\u0CAF\u0CBE\u0C97\u0CAC\u0CC7\u0C95\u0CC1 ${_issue.pattern}`;
        return `\u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF \u0CB8\u0C82\u0C96\u0CCD\u0CAF\u0CC6: \u0CAC\u0CB9\u0CC1\u0CB8\u0C82\u0C96\u0CCD\u0CAF\u0CC6\u0CAF\u0CBE\u0C97\u0CBF\u0CB0\u0CAC\u0CC7\u0C95\u0CC1 ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u0C97\u0CC1\u0CB0\u0CC1\u0CA4\u0CBF\u0CB8\u0CB2\u0CBE\u0C97\u0CA6 \u0C95\u0CC0 ${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF\u0CB5\u0CBE\u0CA6 \u0C95\u0CC0 \u0C87\u0CA8\u0CCD ${issue2.origin}`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `\u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF \u0CA4\u0CBE\u0CB0\u0CA4\u0CAE\u0CCD\u0CAF \u0CAE\u0CCC\u0CB2\u0CCD\u0CAF. \u0CA8\u0CBF\u0CB0\u0CC0\u0C95\u0CCD\u0CB7\u0CBF\u0CB8\u0CB2\u0CBE\u0C97\u0CBF\u0CA6\u0CC6 ${opts}`;
        }
        return "\u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF \u0C87\u0CA8\u0CCD\u200C\u0CAA\u0CC1\u0C9F\u0CCD";
      case "invalid_element":
        return `\u0CB0\u0CB2\u0CCD\u0CB2\u0CBF \u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF \u0CAE\u0CCC\u0CB2\u0CCD\u0CAF ${issue2.origin}`;
      default:
        return `\u0C85\u0CAE\u0CBE\u0CA8\u0CCD\u0CAF \u0C87\u0CA8\u0CCD\u200C\u0CAA\u0CC1\u0C9F\u0CCD`;
    }
  };
};
function kn_default() {
  return {
    localeError: error31()
  };
}

// node_modules/zod/v4/locales/ko.js
var error32 = () => {
  const Sizable = {
    string: { unit: "\uBB38\uC790", verb: "to have" },
    file: { unit: "\uBC14\uC774\uD2B8", verb: "to have" },
    array: { unit: "\uAC1C", verb: "to have" },
    set: { unit: "\uAC1C", verb: "to have" },
    map: { unit: "\uAC1C", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\uC785\uB825",
    email: "\uC774\uBA54\uC77C \uC8FC\uC18C",
    url: "URL",
    emoji: "\uC774\uBAA8\uC9C0",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \uB0A0\uC9DC\uC2DC\uAC04",
    date: "ISO \uB0A0\uC9DC",
    time: "ISO \uC2DC\uAC04",
    duration: "ISO \uAE30\uAC04",
    ipv4: "IPv4 \uC8FC\uC18C",
    ipv6: "IPv6 \uC8FC\uC18C",
    mac: "MAC \uC8FC\uC18C",
    cidrv4: "IPv4 \uBC94\uC704",
    cidrv6: "IPv6 \uBC94\uC704",
    base64: "base64 \uC778\uCF54\uB529 \uBB38\uC790\uC5F4",
    base64url: "base64url \uC778\uCF54\uB529 \uBB38\uC790\uC5F4",
    json_string: "JSON \uBB38\uC790\uC5F4",
    e164: "E.164 \uBC88\uD638",
    credit_card: "\uC2E0\uC6A9\uCE74\uB4DC \uBC88\uD638",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\uC785\uB825"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\uC798\uBABB\uB41C \uC785\uB825: \uC608\uC0C1 \uD0C0\uC785\uC740 instanceof ${issue2.expected}, \uBC1B\uC740 \uD0C0\uC785\uC740 ${received}\uC785\uB2C8\uB2E4`;
        }
        return `\uC798\uBABB\uB41C \uC785\uB825: \uC608\uC0C1 \uD0C0\uC785\uC740 ${expected}, \uBC1B\uC740 \uD0C0\uC785\uC740 ${received}\uC785\uB2C8\uB2E4`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\uC798\uBABB\uB41C \uC785\uB825: \uAC12\uC740 ${stringifyPrimitive(issue2.values[0])} \uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4`;
        return `\uC798\uBABB\uB41C \uC635\uC158: ${joinValues(issue2.values, "\uB610\uB294 ")} \uC911 \uD558\uB098\uC5EC\uC57C \uD569\uB2C8\uB2E4`;
      case "too_big": {
        const adj = issue2.inclusive ? "\uC774\uD558" : "\uBBF8\uB9CC";
        const suffix = adj === "\uBBF8\uB9CC" ? "\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4" : "\uC5EC\uC57C \uD569\uB2C8\uB2E4";
        const sizing = getSizing(issue2.origin);
        const unit = sizing?.unit ?? "\uC694\uC18C";
        if (sizing)
          return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${issue2.maximum.toString()}${unit} ${adj}${suffix}`;
        return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4: ${issue2.maximum.toString()} ${adj}${suffix}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\uC774\uC0C1" : "\uCD08\uACFC";
        const suffix = adj === "\uC774\uC0C1" ? "\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4" : "\uC5EC\uC57C \uD569\uB2C8\uB2E4";
        const sizing = getSizing(issue2.origin);
        const unit = sizing?.unit ?? "\uC694\uC18C";
        if (sizing) {
          return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uC791\uC2B5\uB2C8\uB2E4: ${issue2.minimum.toString()}${unit} ${adj}${suffix}`;
        }
        return `${issue2.origin ?? "\uAC12"}\uC774 \uB108\uBB34 \uC791\uC2B5\uB2C8\uB2E4: ${issue2.minimum.toString()} ${adj}${suffix}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.prefix}"(\uC73C)\uB85C \uC2DC\uC791\uD574\uC57C \uD569\uB2C8\uB2E4`;
        }
        if (_issue.format === "ends_with")
          return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.suffix}"(\uC73C)\uB85C \uB05D\uB098\uC57C \uD569\uB2C8\uB2E4`;
        if (_issue.format === "includes")
          return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: "${_issue.includes}"\uC744(\uB97C) \uD3EC\uD568\uD574\uC57C \uD569\uB2C8\uB2E4`;
        if (_issue.format === "regex")
          return `\uC798\uBABB\uB41C \uBB38\uC790\uC5F4: \uC815\uADDC\uC2DD ${_issue.pattern} \uD328\uD134\uACFC \uC77C\uCE58\uD574\uC57C \uD569\uB2C8\uB2E4`;
        return `\uC798\uBABB\uB41C ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\uC798\uBABB\uB41C \uC22B\uC790: ${issue2.divisor}\uC758 \uBC30\uC218\uC5EC\uC57C \uD569\uB2C8\uB2E4`;
      case "unrecognized_keys":
        return `\uC778\uC2DD\uD560 \uC218 \uC5C6\uB294 \uD0A4: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\uC798\uBABB\uB41C \uD0A4: ${issue2.origin}`;
      case "invalid_union":
        return `\uC798\uBABB\uB41C \uC785\uB825`;
      case "invalid_element":
        return `\uC798\uBABB\uB41C \uAC12: ${issue2.origin}`;
      default:
        return `\uC798\uBABB\uB41C \uC785\uB825`;
    }
  };
};
function ko_default() {
  return {
    localeError: error32()
  };
}

// node_modules/zod/v4/locales/lt.js
var capitalizeFirstCharacter = (text) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};
function getUnitTypeFromNumber(number4) {
  const abs = Math.abs(number4);
  const last = abs % 10;
  const last2 = abs % 100;
  if (last2 >= 11 && last2 <= 19 || last === 0)
    return "many";
  if (last === 1)
    return "one";
  return "few";
}
var error33 = () => {
  const Sizable = {
    string: {
      unit: {
        one: "simbolis",
        few: "simboliai",
        many: "simboli\u0173"
      },
      verb: {
        smaller: {
          inclusive: "turi b\u016Bti ne ilgesn\u0117 kaip",
          notInclusive: "turi b\u016Bti trumpesn\u0117 kaip"
        },
        bigger: {
          inclusive: "turi b\u016Bti ne trumpesn\u0117 kaip",
          notInclusive: "turi b\u016Bti ilgesn\u0117 kaip"
        }
      }
    },
    file: {
      unit: {
        one: "baitas",
        few: "baitai",
        many: "bait\u0173"
      },
      verb: {
        smaller: {
          inclusive: "turi b\u016Bti ne didesnis kaip",
          notInclusive: "turi b\u016Bti ma\u017Eesnis kaip"
        },
        bigger: {
          inclusive: "turi b\u016Bti ne ma\u017Eesnis kaip",
          notInclusive: "turi b\u016Bti didesnis kaip"
        }
      }
    },
    array: {
      unit: {
        one: "element\u0105",
        few: "elementus",
        many: "element\u0173"
      },
      verb: {
        smaller: {
          inclusive: "turi tur\u0117ti ne daugiau kaip",
          notInclusive: "turi tur\u0117ti ma\u017Eiau kaip"
        },
        bigger: {
          inclusive: "turi tur\u0117ti ne ma\u017Eiau kaip",
          notInclusive: "turi tur\u0117ti daugiau kaip"
        }
      }
    },
    set: {
      unit: {
        one: "element\u0105",
        few: "elementus",
        many: "element\u0173"
      },
      verb: {
        smaller: {
          inclusive: "turi tur\u0117ti ne daugiau kaip",
          notInclusive: "turi tur\u0117ti ma\u017Eiau kaip"
        },
        bigger: {
          inclusive: "turi tur\u0117ti ne ma\u017Eiau kaip",
          notInclusive: "turi tur\u0117ti daugiau kaip"
        }
      }
    }
  };
  function getSizing(origin, unitType, inclusive, targetShouldBe) {
    const result = Sizable[origin] ?? null;
    if (result === null)
      return result;
    return {
      unit: result.unit[unitType],
      verb: result.verb[targetShouldBe][inclusive ? "inclusive" : "notInclusive"]
    };
  }
  const FormatDictionary = {
    regex: "\u012Fvestis",
    email: "el. pa\u0161to adresas",
    url: "URL",
    emoji: "jaustukas",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO data ir laikas",
    date: "ISO data",
    time: "ISO laikas",
    duration: "ISO trukm\u0117",
    ipv4: "IPv4 adresas",
    ipv6: "IPv6 adresas",
    mac: "MAC adresas",
    cidrv4: "IPv4 tinklo prefiksas (CIDR)",
    cidrv6: "IPv6 tinklo prefiksas (CIDR)",
    base64: "base64 u\u017Ekoduota eilut\u0117",
    base64url: "base64url u\u017Ekoduota eilut\u0117",
    json_string: "JSON eilut\u0117",
    e164: "E.164 numeris",
    credit_card: "kredito kortel\u0117s numeris",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u012Fvestis"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "skai\u010Dius",
    bigint: "sveikasis skai\u010Dius",
    string: "eilut\u0117",
    boolean: "login\u0117 reik\u0161m\u0117",
    undefined: "neapibr\u0117\u017Eta reik\u0161m\u0117",
    function: "funkcija",
    symbol: "simbolis",
    array: "masyvas",
    object: "objektas",
    null: "nulin\u0117 reik\u0161m\u0117"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Gautas tipas ${received}, o tik\u0117tasi - instanceof ${issue2.expected}`;
        }
        return `Gautas tipas ${received}, o tik\u0117tasi - ${expected}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Privalo b\u016Bti ${stringifyPrimitive(issue2.values[0])}`;
        return `Privalo b\u016Bti vienas i\u0161 ${joinValues(issue2.values, "|")} pasirinkim\u0173`;
      case "too_big": {
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        const sizing = getSizing(issue2.origin, getUnitTypeFromNumber(Number(issue2.maximum)), issue2.inclusive ?? false, "smaller");
        if (sizing?.verb)
          return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} ${sizing.verb} ${issue2.maximum.toString()} ${sizing.unit ?? "element\u0173"}`;
        const adj = issue2.inclusive ? "ne didesnis kaip" : "ma\u017Eesnis kaip";
        return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} turi b\u016Bti ${adj} ${issue2.maximum.toString()} ${sizing?.unit}`;
      }
      case "too_small": {
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        const sizing = getSizing(issue2.origin, getUnitTypeFromNumber(Number(issue2.minimum)), issue2.inclusive ?? false, "bigger");
        if (sizing?.verb)
          return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} ${sizing.verb} ${issue2.minimum.toString()} ${sizing.unit ?? "element\u0173"}`;
        const adj = issue2.inclusive ? "ne ma\u017Eesnis kaip" : "didesnis kaip";
        return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} turi b\u016Bti ${adj} ${issue2.minimum.toString()} ${sizing?.unit}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Eilut\u0117 privalo prasid\u0117ti "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Eilut\u0117 privalo pasibaigti "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Eilut\u0117 privalo \u012Ftraukti "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Eilut\u0117 privalo atitikti ${_issue.pattern}`;
        return `Neteisingas ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Skai\u010Dius privalo b\u016Bti ${issue2.divisor} kartotinis.`;
      case "unrecognized_keys":
        return `Neatpa\u017Eint${issue2.keys.length > 1 ? "i" : "as"} rakt${issue2.keys.length > 1 ? "ai" : "as"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return "Rastas klaidingas raktas";
      case "invalid_union":
        return "Klaidinga \u012Fvestis";
      case "invalid_element": {
        const origin = TypeDictionary[issue2.origin] ?? issue2.origin;
        return `${capitalizeFirstCharacter(origin ?? issue2.origin ?? "reik\u0161m\u0117")} turi klaiding\u0105 \u012Fvest\u012F`;
      }
      default:
        return "Klaidinga \u012Fvestis";
    }
  };
};
function lt_default() {
  return {
    localeError: error33()
  };
}

// node_modules/zod/v4/locales/mk.js
var error34 = () => {
  const Sizable = {
    string: { unit: "\u0437\u043D\u0430\u0446\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" },
    file: { unit: "\u0431\u0430\u0458\u0442\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" },
    array: { unit: "\u0441\u0442\u0430\u0432\u043A\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" },
    set: { unit: "\u0441\u0442\u0430\u0432\u043A\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" },
    map: { unit: "\u0441\u0442\u0430\u0432\u043A\u0438", verb: "\u0434\u0430 \u0438\u043C\u0430\u0430\u0442" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0432\u043D\u0435\u0441",
    email: "\u0430\u0434\u0440\u0435\u0441\u0430 \u043D\u0430 \u0435-\u043F\u043E\u0448\u0442\u0430",
    url: "URL",
    emoji: "\u0435\u043C\u043E\u045F\u0438",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0434\u0430\u0442\u0443\u043C \u0438 \u0432\u0440\u0435\u043C\u0435",
    date: "ISO \u0434\u0430\u0442\u0443\u043C",
    time: "ISO \u0432\u0440\u0435\u043C\u0435",
    duration: "ISO \u0432\u0440\u0435\u043C\u0435\u0442\u0440\u0430\u0435\u045A\u0435",
    ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441\u0430",
    ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441\u0430",
    mac: "MAC \u0430\u0434\u0440\u0435\u0441\u0430",
    cidrv4: "IPv4 \u043E\u043F\u0441\u0435\u0433",
    cidrv6: "IPv6 \u043E\u043F\u0441\u0435\u0433",
    base64: "base64-\u0435\u043D\u043A\u043E\u0434\u0438\u0440\u0430\u043D\u0430 \u043D\u0438\u0437\u0430",
    base64url: "base64url-\u0435\u043D\u043A\u043E\u0434\u0438\u0440\u0430\u043D\u0430 \u043D\u0438\u0437\u0430",
    json_string: "JSON \u043D\u0438\u0437\u0430",
    e164: "E.164 \u0431\u0440\u043E\u0458",
    credit_card: "\u0431\u0440\u043E\u0458 \u043D\u0430 \u043A\u0440\u0435\u0434\u0438\u0442\u043D\u0430 \u043A\u0430\u0440\u0442\u0438\u0447\u043A\u0430",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0432\u043D\u0435\u0441"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0431\u0440\u043E\u0458",
    array: "\u043D\u0438\u0437\u0430"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 instanceof ${issue2.expected}, \u043F\u0440\u0438\u043C\u0435\u043D\u043E ${received}`;
        }
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${expected}, \u043F\u0440\u0438\u043C\u0435\u043D\u043E ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
        return `\u0413\u0440\u0435\u0448\u0430\u043D\u0430 \u043E\u043F\u0446\u0438\u0458\u0430: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 \u0435\u0434\u043D\u0430 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u0433\u043E\u043B\u0435\u043C: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin ?? "\u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442\u0430"} \u0434\u0430 \u0438\u043C\u0430 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0438"}`;
        return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u0433\u043E\u043B\u0435\u043C: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin ?? "\u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442\u0430"} \u0434\u0430 \u0431\u0438\u0434\u0435 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u043C\u0430\u043B: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin} \u0434\u0430 \u0438\u043C\u0430 ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u041F\u0440\u0435\u043C\u043D\u043E\u0433\u0443 \u043C\u0430\u043B: \u0441\u0435 \u043E\u0447\u0435\u043A\u0443\u0432\u0430 ${issue2.origin} \u0434\u0430 \u0431\u0438\u0434\u0435 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0437\u0430\u043F\u043E\u0447\u043D\u0443\u0432\u0430 \u0441\u043E "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0437\u0430\u0432\u0440\u0448\u0443\u0432\u0430 \u0441\u043E "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0432\u043A\u043B\u0443\u0447\u0443\u0432\u0430 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u041D\u0435\u0432\u0430\u0436\u0435\u0447\u043A\u0430 \u043D\u0438\u0437\u0430: \u043C\u043E\u0440\u0430 \u0434\u0430 \u043E\u0434\u0433\u043E\u0430\u0440\u0430 \u043D\u0430 \u043F\u0430\u0442\u0435\u0440\u043D\u043E\u0442 ${_issue.pattern}`;
        return `Invalid ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u0431\u0440\u043E\u0458: \u043C\u043E\u0440\u0430 \u0434\u0430 \u0431\u0438\u0434\u0435 \u0434\u0435\u043B\u0438\u0432 \u0441\u043E ${issue2.divisor}`;
      case "unrecognized_keys":
        return `${issue2.keys.length > 1 ? "\u041D\u0435\u043F\u0440\u0435\u043F\u043E\u0437\u043D\u0430\u0435\u043D\u0438 \u043A\u043B\u0443\u0447\u0435\u0432\u0438" : "\u041D\u0435\u043F\u0440\u0435\u043F\u043E\u0437\u043D\u0430\u0435\u043D \u043A\u043B\u0443\u0447"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u043A\u043B\u0443\u0447 \u0432\u043E ${issue2.origin}`;
      case "invalid_union":
        return "\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441";
      case "invalid_element":
        return `\u0413\u0440\u0435\u0448\u043D\u0430 \u0432\u0440\u0435\u0434\u043D\u043E\u0441\u0442 \u0432\u043E ${issue2.origin}`;
      default:
        return `\u0413\u0440\u0435\u0448\u0435\u043D \u0432\u043D\u0435\u0441`;
    }
  };
};
function mk_default() {
  return {
    localeError: error34()
  };
}

// node_modules/zod/v4/locales/ms.js
var error35 = () => {
  const Sizable = {
    string: { unit: "aksara", verb: "mempunyai" },
    file: { unit: "bait", verb: "mempunyai" },
    array: { unit: "elemen", verb: "mempunyai" },
    set: { unit: "elemen", verb: "mempunyai" },
    map: { unit: "elemen", verb: "mempunyai" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "alamat e-mel",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "tarikh masa ISO",
    date: "tarikh ISO",
    time: "masa ISO",
    duration: "tempoh ISO",
    ipv4: "alamat IPv4",
    ipv6: "alamat IPv6",
    mac: "alamat MAC",
    cidrv4: "julat IPv4",
    cidrv6: "julat IPv6",
    base64: "string dikodkan base64",
    base64url: "string dikodkan base64url",
    json_string: "string JSON",
    e164: "nombor E.164",
    credit_card: "nombor kad kredit",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "nombor"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Input tidak sah: dijangka instanceof ${issue2.expected}, diterima ${received}`;
        }
        return `Input tidak sah: dijangka ${expected}, diterima ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Input tidak sah: dijangka ${stringifyPrimitive(issue2.values[0])}`;
        return `Pilihan tidak sah: dijangka salah satu daripada ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Terlalu besar: dijangka ${issue2.origin ?? "nilai"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemen"}`;
        return `Terlalu besar: dijangka ${issue2.origin ?? "nilai"} adalah ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Terlalu kecil: dijangka ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Terlalu kecil: dijangka ${issue2.origin} adalah ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `String tidak sah: mesti bermula dengan "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `String tidak sah: mesti berakhir dengan "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `String tidak sah: mesti mengandungi "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `String tidak sah: mesti sepadan dengan corak ${_issue.pattern}`;
        return `${FormatDictionary[_issue.format] ?? issue2.format} tidak sah`;
      }
      case "not_multiple_of":
        return `Nombor tidak sah: perlu gandaan ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Kunci tidak dikenali: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Kunci tidak sah dalam ${issue2.origin}`;
      case "invalid_union":
        return "Input tidak sah";
      case "invalid_element":
        return `Nilai tidak sah dalam ${issue2.origin}`;
      default:
        return `Input tidak sah`;
    }
  };
};
function ms_default() {
  return {
    localeError: error35()
  };
}

// node_modules/zod/v4/locales/ne.js
var error36 = () => {
  const Sizable = {
    string: { unit: "\u0905\u0915\u094D\u0937\u0930", verb: "\u0939\u0941\u0928\u0941\u092A\u0930\u094D\u091B" },
    file: { unit: "\u092C\u093E\u0907\u091F", verb: "\u0939\u0941\u0928\u0941\u092A\u0930\u094D\u091B" },
    array: { unit: "\u0924\u0924\u094D\u0935", verb: "\u0939\u0941\u0928\u0941\u092A\u0930\u094D\u091B" },
    set: { unit: "\u0924\u0924\u094D\u0935", verb: "\u0939\u0941\u0928\u0941\u092A\u0930\u094D\u091B" },
    map: { unit: "\u092A\u094D\u0930\u0935\u093F\u0937\u094D\u091F\u093F", verb: "\u0939\u0941\u0928\u0941\u092A\u0930\u094D\u091B" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0907\u0928\u092A\u0941\u091F",
    email: "\u0907\u092E\u0947\u0932 \u0920\u0947\u0917\u093E\u0928\u093E",
    url: "URL",
    emoji: "\u0907\u092E\u094B\u091C\u0940",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u092E\u093F\u0924\u093F \u0930 \u0938\u092E\u092F",
    date: "ISO \u092E\u093F\u0924\u093F",
    time: "ISO \u0938\u092E\u092F",
    duration: "ISO \u0905\u0935\u0927\u093F",
    ipv4: "IPv4 \u0920\u0947\u0917\u093E\u0928\u093E",
    ipv6: "IPv6 \u0920\u0947\u0917\u093E\u0928\u093E",
    mac: "MAC \u0920\u0947\u0917\u093E\u0928\u093E",
    cidrv4: "IPv4 \u0926\u093E\u092F\u0930\u093E",
    cidrv6: "IPv6 \u0926\u093E\u092F\u0930\u093E",
    base64: "base64-\u0907\u0928\u094D\u0915\u094B\u0921 \u0917\u0930\u093F\u090F\u0915\u094B \u0938\u094D\u091F\u094D\u0930\u093F\u0919",
    base64url: "base64url-\u0907\u0928\u094D\u0915\u094B\u0921 \u0917\u0930\u093F\u090F\u0915\u094B \u0938\u094D\u091F\u094D\u0930\u093F\u0919",
    json_string: "JSON \u0938\u094D\u091F\u094D\u0930\u093F\u0919",
    e164: "E.164 \u0928\u092E\u094D\u092C\u0930",
    credit_card: "\u0915\u094D\u0930\u0947\u0921\u093F\u091F \u0915\u093E\u0930\u094D\u0921 \u0928\u092E\u094D\u092C\u0930",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0907\u0928\u092A\u0941\u091F"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        return `\u0905\u092E\u093E\u0928\u094D\u092F \u0907\u0928\u092A\u0941\u091F: \u0905\u092A\u0947\u0915\u094D\u0937\u093F\u0924 ${expected}, \u092A\u094D\u0930\u093E\u092A\u094D\u0924 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0905\u092E\u093E\u0928\u094D\u092F \u0907\u0928\u092A\u0941\u091F: \u0905\u092A\u0947\u0915\u094D\u0937\u093F\u0924 ${stringifyPrimitive(issue2.values[0])}`;
        return `\u0905\u092E\u093E\u0928\u094D\u092F \u0935\u093F\u0915\u0932\u094D\u092A: \u0905\u092A\u0947\u0915\u094D\u0937\u093F\u0924 \u092E\u093E\u0928\u0939\u0930\u0942 \u092E\u0927\u094D\u092F\u0947 \u090F\u0915 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0927\u0947\u0930\u0948 \u0920\u0942\u0932\u094B: ${issue2.origin ?? "\u092E\u093E\u0928"} \u092E\u093E ${adj}${issue2.maximum.toString()} ${sizing.unit} ${sizing.verb}`;
        return `\u0927\u0947\u0930\u0948 \u0920\u0942\u0932\u094B: ${issue2.origin ?? "\u092E\u093E\u0928"} ${adj}${issue2.maximum.toString()} \u0939\u0941\u0928\u0941\u092A\u0930\u094D\u091B`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0927\u0947\u0930\u0948 \u0938\u093E\u0928\u094B: ${issue2.origin} \u092E\u093E ${adj}${issue2.minimum.toString()} ${sizing.unit} ${sizing.verb}`;
        return `\u0927\u0947\u0930\u0948 \u0938\u093E\u0928\u094B: ${issue2.origin} ${adj}${issue2.minimum.toString()} \u0939\u0941\u0928\u0941\u092A\u0930\u094D\u091B`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u0905\u092E\u093E\u0928\u094D\u092F \u0938\u094D\u091F\u094D\u0930\u093F\u0919: "${_issue.prefix}" \u092C\u093E\u091F \u0938\u0941\u0930\u0941 \u0939\u0941\u0928\u0941\u092A\u0930\u094D\u091B`;
        if (_issue.format === "ends_with")
          return `\u0905\u092E\u093E\u0928\u094D\u092F \u0938\u094D\u091F\u094D\u0930\u093F\u0919: "${_issue.suffix}" \u092E\u093E \u0938\u092E\u093E\u092A\u094D\u0924 \u0939\u0941\u0928\u0941\u092A\u0930\u094D\u091B`;
        if (_issue.format === "includes")
          return `\u0905\u092E\u093E\u0928\u094D\u092F \u0938\u094D\u091F\u094D\u0930\u093F\u0919: "${_issue.includes}" \u0938\u092E\u093E\u0935\u0947\u0936 \u0939\u0941\u0928\u0941\u092A\u0930\u094D\u091B`;
        if (_issue.format === "regex")
          return `\u0905\u092E\u093E\u0928\u094D\u092F \u0938\u094D\u091F\u094D\u0930\u093F\u0919: \u0922\u093E\u0901\u091A\u093E ${_issue.pattern} \u0938\u0901\u0917 \u092E\u0947\u0932 \u0916\u093E\u0928\u0941\u092A\u0930\u094D\u091B`;
        return `\u0905\u092E\u093E\u0928\u094D\u092F ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u0905\u092E\u093E\u0928\u094D\u092F \u0938\u0902\u0916\u094D\u092F\u093E: ${issue2.divisor} \u0915\u094B \u0917\u0941\u0923\u091C \u0939\u0941\u0928\u0941\u092A\u0930\u094D\u091B`;
      case "unrecognized_keys":
        return `\u0905\u092A\u0930\u093F\u091A\u093F\u0924 \u0915\u0941\u091E\u094D\u091C\u0940${issue2.keys.length > 1 ? "\u0939\u0930\u0942" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u0905\u092E\u093E\u0928\u094D\u092F \u0915\u0941\u091E\u094D\u091C\u0940: ${issue2.origin} \u092E\u093E`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `\u0905\u092E\u093E\u0928\u094D\u092F \u0921\u093F\u0938\u094D\u0915\u094D\u0930\u093F\u092E\u093F\u0928\u0947\u091F\u0930 \u092E\u093E\u0928: \u0905\u092A\u0947\u0915\u094D\u0937\u093F\u0924 ${opts}`;
        }
        return "\u0905\u092E\u093E\u0928\u094D\u092F \u0907\u0928\u092A\u0941\u091F";
      case "invalid_element":
        return `\u0905\u092E\u093E\u0928\u094D\u092F \u092E\u093E\u0928: ${issue2.origin} \u092E\u093E`;
      default:
        return `\u0905\u092E\u093E\u0928\u094D\u092F \u0907\u0928\u092A\u0941\u091F`;
    }
  };
};
function ne_default() {
  return {
    localeError: error36()
  };
}

// node_modules/zod/v4/locales/nl.js
var error37 = () => {
  const Sizable = {
    string: { unit: "tekens", verb: "heeft" },
    file: { unit: "bytes", verb: "heeft" },
    array: { unit: "elementen", verb: "heeft" },
    set: { unit: "elementen", verb: "heeft" },
    map: { unit: "elementen", verb: "heeft" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "invoer",
    email: "emailadres",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datum en tijd",
    date: "ISO datum",
    time: "ISO tijd",
    duration: "ISO duur",
    ipv4: "IPv4-adres",
    ipv6: "IPv6-adres",
    mac: "MAC-adres",
    cidrv4: "IPv4-bereik",
    cidrv6: "IPv6-bereik",
    base64: "base64-gecodeerde tekst",
    base64url: "base64 URL-gecodeerde tekst",
    json_string: "JSON string",
    e164: "E.164-nummer",
    credit_card: "creditcardnummer",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "invoer"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "getal"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ongeldige invoer: verwacht instanceof ${issue2.expected}, ontving ${received}`;
        }
        return `Ongeldige invoer: verwacht ${expected}, ontving ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Ongeldige invoer: verwacht ${stringifyPrimitive(issue2.values[0])}`;
        return `Ongeldige optie: verwacht \xE9\xE9n van ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        const longName = issue2.origin === "date" ? "laat" : issue2.origin === "string" ? "lang" : "groot";
        if (sizing)
          return `Te ${longName}: verwacht dat ${issue2.origin ?? "waarde"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementen"} ${sizing.verb}`;
        return `Te ${longName}: verwacht dat ${issue2.origin ?? "waarde"} ${adj}${issue2.maximum.toString()} is`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        const shortName = issue2.origin === "date" ? "vroeg" : issue2.origin === "string" ? "kort" : "klein";
        if (sizing) {
          return `Te ${shortName}: verwacht dat ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} ${sizing.verb}`;
        }
        return `Te ${shortName}: verwacht dat ${issue2.origin} ${adj}${issue2.minimum.toString()} is`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Ongeldige tekst: moet met "${_issue.prefix}" beginnen`;
        }
        if (_issue.format === "ends_with")
          return `Ongeldige tekst: moet op "${_issue.suffix}" eindigen`;
        if (_issue.format === "includes")
          return `Ongeldige tekst: moet "${_issue.includes}" bevatten`;
        if (_issue.format === "regex")
          return `Ongeldige tekst: moet overeenkomen met patroon ${_issue.pattern}`;
        return `Ongeldig: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Ongeldig getal: moet een veelvoud van ${issue2.divisor} zijn`;
      case "unrecognized_keys":
        return `Onbekende key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Ongeldige key in ${issue2.origin}`;
      case "invalid_union":
        return "Ongeldige invoer";
      case "invalid_element":
        return `Ongeldige waarde in ${issue2.origin}`;
      default:
        return `Ongeldige invoer`;
    }
  };
};
function nl_default() {
  return {
    localeError: error37()
  };
}

// node_modules/zod/v4/locales/nn.js
var error38 = () => {
  const Sizable = {
    string: { unit: "teikn", verb: "\xE5 ha" },
    file: { unit: "bytes", verb: "\xE5 ha" },
    array: { unit: "element", verb: "\xE5 innehalde" },
    set: { unit: "element", verb: "\xE5 innehalde" },
    map: { unit: "element", verb: "\xE5 innehalde" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "e-postadresse",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO dato- og klokkeslett",
    date: "ISO-dato",
    time: "ISO-klokkeslett",
    duration: "ISO-varigheit",
    ipv4: "IPv4-adresse",
    ipv6: "IPv6-adresse",
    mac: "MAC-adresse",
    cidrv4: "IPv4-spekter",
    cidrv6: "IPv6-spekter",
    base64: "base64-enkoda streng",
    base64url: "base64url-enkoda streng",
    json_string: "JSON-streng",
    e164: "E.164-nummer",
    credit_card: "kredittkortnummer",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "tal",
    array: "liste"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ugyldig input: forventa instanceof ${issue2.expected}, fekk ${received}`;
        }
        return `Ugyldig input: forventa ${expected}, fekk ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Ugyldig verdi: forventa ${stringifyPrimitive(issue2.values[0])}`;
        return `Ugyldig val: forventa eitt av ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `For stor(t): forventa ${issue2.origin ?? "value"} til \xE5 ha ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "element"}`;
        return `For stor(t): forventa ${issue2.origin ?? "value"} til \xE5 ha ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `For lite(n): forventa ${issue2.origin} til \xE5 ha ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `For lite(n): forventa ${issue2.origin} til \xE5 ha ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Ugyldig streng: m\xE5 starte med "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Ugyldig streng: m\xE5 slutte med "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Ugyldig streng: m\xE5 innehalde "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Ugyldig streng: m\xE5 matche m\xF8nsteret ${_issue.pattern}`;
        return `Ugyldig ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Ugyldig tal: m\xE5 vere eit multiplum av ${issue2.divisor}`;
      case "unrecognized_keys":
        return `${issue2.keys.length > 1 ? "Ukjende n\xF8klar" : "Ukjend n\xF8kkel"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Ugyldig n\xF8kkel i ${issue2.origin}`;
      case "invalid_union":
        return "Ugyldig input";
      case "invalid_element":
        return `Ugyldig verdi i ${issue2.origin}`;
      default:
        return `Ugyldig input`;
    }
  };
};
function nn_default() {
  return {
    localeError: error38()
  };
}

// node_modules/zod/v4/locales/no.js
var error39 = () => {
  const Sizable = {
    string: { unit: "tegn", verb: "\xE5 ha" },
    file: { unit: "bytes", verb: "\xE5 ha" },
    array: { unit: "elementer", verb: "\xE5 inneholde" },
    set: { unit: "elementer", verb: "\xE5 inneholde" },
    map: { unit: "elementer", verb: "\xE5 inneholde" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "e-postadresse",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO dato- og klokkeslett",
    date: "ISO-dato",
    time: "ISO-klokkeslett",
    duration: "ISO-varighet",
    ipv4: "IPv4-adresse",
    ipv6: "IPv6-adresse",
    mac: "MAC-adresse",
    cidrv4: "IPv4-spekter",
    cidrv6: "IPv6-spekter",
    base64: "base64-enkodet streng",
    base64url: "base64url-enkodet streng",
    json_string: "JSON-streng",
    e164: "E.164-nummer",
    credit_card: "kredittkortnummer",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "tall",
    array: "liste"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ugyldig input: forventet instanceof ${issue2.expected}, fikk ${received}`;
        }
        return `Ugyldig input: forventet ${expected}, fikk ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Ugyldig verdi: forventet ${stringifyPrimitive(issue2.values[0])}`;
        return `Ugyldig valg: forventet en av ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `For stor(t): forventet ${issue2.origin ?? "value"} til \xE5 ha ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementer"}`;
        return `For stor(t): forventet ${issue2.origin ?? "value"} til \xE5 ha ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `For lite(n): forventet ${issue2.origin} til \xE5 ha ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `For lite(n): forventet ${issue2.origin} til \xE5 ha ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Ugyldig streng: m\xE5 starte med "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Ugyldig streng: m\xE5 ende med "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Ugyldig streng: m\xE5 inneholde "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Ugyldig streng: m\xE5 matche m\xF8nsteret ${_issue.pattern}`;
        return `Ugyldig ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Ugyldig tall: m\xE5 v\xE6re et multiplum av ${issue2.divisor}`;
      case "unrecognized_keys":
        return `${issue2.keys.length > 1 ? "Ukjente n\xF8kler" : "Ukjent n\xF8kkel"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Ugyldig n\xF8kkel i ${issue2.origin}`;
      case "invalid_union":
        return "Ugyldig input";
      case "invalid_element":
        return `Ugyldig verdi i ${issue2.origin}`;
      default:
        return `Ugyldig input`;
    }
  };
};
function no_default() {
  return {
    localeError: error39()
  };
}

// node_modules/zod/v4/locales/ota.js
var error40 = () => {
  const Sizable = {
    string: { unit: "harf", verb: "olmal\u0131d\u0131r" },
    file: { unit: "bayt", verb: "olmal\u0131d\u0131r" },
    array: { unit: "unsur", verb: "olmal\u0131d\u0131r" },
    set: { unit: "unsur", verb: "olmal\u0131d\u0131r" },
    map: { unit: "unsur", verb: "olmal\u0131d\u0131r" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "giren",
    email: "epostag\xE2h",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO heng\xE2m\u0131",
    date: "ISO tarihi",
    time: "ISO zaman\u0131",
    duration: "ISO m\xFCddeti",
    ipv4: "IPv4 ni\u015F\xE2n\u0131",
    ipv6: "IPv6 ni\u015F\xE2n\u0131",
    mac: "MAC ni\u015F\xE2n\u0131",
    cidrv4: "IPv4 menzili",
    cidrv6: "IPv6 menzili",
    base64: "base64-\u015Fifreli metin",
    base64url: "base64url-\u015Fifreli metin",
    json_string: "JSON metin",
    e164: "E.164 say\u0131s\u0131",
    credit_card: "i'tib\xE2r kart\u0131 numaras\u0131",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "giren"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "numara",
    array: "saf",
    null: "gayb"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `F\xE2sit giren: umulan instanceof ${issue2.expected}, al\u0131nan ${received}`;
        }
        return `F\xE2sit giren: umulan ${expected}, al\u0131nan ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `F\xE2sit giren: umulan ${stringifyPrimitive(issue2.values[0])}`;
        return `F\xE2sit tercih: m\xFBteberler ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Fazla b\xFCy\xFCk: ${issue2.origin ?? "value"}, ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"} sahip olmal\u0131yd\u0131.`;
        return `Fazla b\xFCy\xFCk: ${issue2.origin ?? "value"}, ${adj}${issue2.maximum.toString()} olmal\u0131yd\u0131.`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Fazla k\xFC\xE7\xFCk: ${issue2.origin}, ${adj}${issue2.minimum.toString()} ${sizing.unit} sahip olmal\u0131yd\u0131.`;
        }
        return `Fazla k\xFC\xE7\xFCk: ${issue2.origin}, ${adj}${issue2.minimum.toString()} olmal\u0131yd\u0131.`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `F\xE2sit metin: "${_issue.prefix}" ile ba\u015Flamal\u0131.`;
        if (_issue.format === "ends_with")
          return `F\xE2sit metin: "${_issue.suffix}" ile bitmeli.`;
        if (_issue.format === "includes")
          return `F\xE2sit metin: "${_issue.includes}" ihtiv\xE2 etmeli.`;
        if (_issue.format === "regex")
          return `F\xE2sit metin: ${_issue.pattern} nak\u015F\u0131na uymal\u0131.`;
        return `F\xE2sit ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `F\xE2sit say\u0131: ${issue2.divisor} kat\u0131 olmal\u0131yd\u0131.`;
      case "unrecognized_keys":
        return `Tan\u0131nmayan anahtar ${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} i\xE7in tan\u0131nmayan anahtar var.`;
      case "invalid_union":
        return "Giren tan\u0131namad\u0131.";
      case "invalid_element":
        return `${issue2.origin} i\xE7in tan\u0131nmayan k\u0131ymet var.`;
      default:
        return `K\u0131ymet tan\u0131namad\u0131.`;
    }
  };
};
function ota_default() {
  return {
    localeError: error40()
  };
}

// node_modules/zod/v4/locales/ps.js
var error41 = () => {
  const Sizable = {
    string: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" },
    file: { unit: "\u0628\u0627\u06CC\u067C\u0633", verb: "\u0648\u0644\u0631\u064A" },
    array: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" },
    set: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" },
    map: { unit: "\u062A\u0648\u06A9\u064A", verb: "\u0648\u0644\u0631\u064A" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0648\u0631\u0648\u062F\u064A",
    email: "\u0628\u0631\u06CC\u069A\u0646\u0627\u0644\u06CC\u06A9",
    url: "\u06CC\u0648 \u0622\u0631 \u0627\u0644",
    emoji: "\u0627\u06CC\u0645\u0648\u062C\u064A",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u0646\u06CC\u067C\u0647 \u0627\u0648 \u0648\u062E\u062A",
    date: "\u0646\u06D0\u067C\u0647",
    time: "\u0648\u062E\u062A",
    duration: "\u0645\u0648\u062F\u0647",
    ipv4: "\u062F IPv4 \u067E\u062A\u0647",
    ipv6: "\u062F IPv6 \u067E\u062A\u0647",
    mac: "\u062F MAC \u067E\u062A\u0647",
    cidrv4: "\u062F IPv4 \u0633\u0627\u062D\u0647",
    cidrv6: "\u062F IPv6 \u0633\u0627\u062D\u0647",
    base64: "base64-encoded \u0645\u062A\u0646",
    base64url: "base64url-encoded \u0645\u062A\u0646",
    json_string: "JSON \u0645\u062A\u0646",
    e164: "\u062F E.164 \u0634\u0645\u06D0\u0631\u0647",
    credit_card: "\u062F \u06A9\u0631\u06CC\u0689\u06CC\u067C \u06A9\u0627\u0631\u062A \u0634\u0645\u06CC\u0631\u0647",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0648\u0631\u0648\u062F\u064A"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0639\u062F\u062F",
    array: "\u0627\u0631\u06D0"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F instanceof ${issue2.expected} \u0648\u0627\u06CC, \u0645\u06AB\u0631 ${received} \u062A\u0631\u0644\u0627\u0633\u0647 \u0634\u0648`;
        }
        return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F ${expected} \u0648\u0627\u06CC, \u0645\u06AB\u0631 ${received} \u062A\u0631\u0644\u0627\u0633\u0647 \u0634\u0648`;
      }
      case "invalid_value":
        if (issue2.values.length === 1) {
          return `\u0646\u0627\u0633\u0645 \u0648\u0631\u0648\u062F\u064A: \u0628\u0627\u06CC\u062F ${stringifyPrimitive(issue2.values[0])} \u0648\u0627\u06CC`;
        }
        return `\u0646\u0627\u0633\u0645 \u0627\u0646\u062A\u062E\u0627\u0628: \u0628\u0627\u06CC\u062F \u06CC\u0648 \u0644\u0647 ${joinValues(issue2.values, "|")} \u0685\u062E\u0647 \u0648\u0627\u06CC`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0689\u06CC\u0631 \u0644\u0648\u06CC: ${issue2.origin ?? "\u0627\u0631\u0632\u069A\u062A"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0635\u0631\u0648\u0646\u0647"} \u0648\u0644\u0631\u064A`;
        }
        return `\u0689\u06CC\u0631 \u0644\u0648\u06CC: ${issue2.origin ?? "\u0627\u0631\u0632\u069A\u062A"} \u0628\u0627\u06CC\u062F ${adj}${issue2.maximum.toString()} \u0648\u064A`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0689\u06CC\u0631 \u06A9\u0648\u0686\u0646\u06CC: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} ${sizing.unit} \u0648\u0644\u0631\u064A`;
        }
        return `\u0689\u06CC\u0631 \u06A9\u0648\u0686\u0646\u06CC: ${issue2.origin} \u0628\u0627\u06CC\u062F ${adj}${issue2.minimum.toString()} \u0648\u064A`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F "${_issue.prefix}" \u0633\u0631\u0647 \u067E\u06CC\u0644 \u0634\u064A`;
        }
        if (_issue.format === "ends_with") {
          return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F "${_issue.suffix}" \u0633\u0631\u0647 \u067E\u0627\u06CC \u062A\u0647 \u0648\u0631\u0633\u064A\u0696\u064A`;
        }
        if (_issue.format === "includes") {
          return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F "${_issue.includes}" \u0648\u0644\u0631\u064A`;
        }
        if (_issue.format === "regex") {
          return `\u0646\u0627\u0633\u0645 \u0645\u062A\u0646: \u0628\u0627\u06CC\u062F \u062F ${_issue.pattern} \u0633\u0631\u0647 \u0645\u0637\u0627\u0628\u0642\u062A \u0648\u0644\u0631\u064A`;
        }
        return `${FormatDictionary[_issue.format] ?? issue2.format} \u0646\u0627\u0633\u0645 \u062F\u06CC`;
      }
      case "not_multiple_of":
        return `\u0646\u0627\u0633\u0645 \u0639\u062F\u062F: \u0628\u0627\u06CC\u062F \u062F ${issue2.divisor} \u0645\u0636\u0631\u0628 \u0648\u064A`;
      case "unrecognized_keys":
        return `\u0646\u0627\u0633\u0645 ${issue2.keys.length > 1 ? "\u06A9\u0644\u06CC\u0689\u0648\u0646\u0647" : "\u06A9\u0644\u06CC\u0689"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u0646\u0627\u0633\u0645 \u06A9\u0644\u06CC\u0689 \u067E\u0647 ${issue2.origin} \u06A9\u06D0`;
      case "invalid_union":
        return `\u0646\u0627\u0633\u0645\u0647 \u0648\u0631\u0648\u062F\u064A`;
      case "invalid_element":
        return `\u0646\u0627\u0633\u0645 \u0639\u0646\u0635\u0631 \u067E\u0647 ${issue2.origin} \u06A9\u06D0`;
      default:
        return `\u0646\u0627\u0633\u0645\u0647 \u0648\u0631\u0648\u062F\u064A`;
    }
  };
};
function ps_default() {
  return {
    localeError: error41()
  };
}

// node_modules/zod/v4/locales/pl.js
var error42 = () => {
  const Sizable = {
    string: { unit: "znak\xF3w", verb: "mie\u0107" },
    file: { unit: "bajt\xF3w", verb: "mie\u0107" },
    array: { unit: "element\xF3w", verb: "mie\u0107" },
    set: { unit: "element\xF3w", verb: "mie\u0107" },
    map: { unit: "element\xF3w", verb: "mie\u0107" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "wyra\u017Cenie",
    email: "adres email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "data i godzina w formacie ISO",
    date: "data w formacie ISO",
    time: "godzina w formacie ISO",
    duration: "czas trwania ISO",
    ipv4: "adres IPv4",
    ipv6: "adres IPv6",
    mac: "adres MAC",
    cidrv4: "zakres IPv4",
    cidrv6: "zakres IPv6",
    base64: "ci\u0105g znak\xF3w zakodowany w formacie base64",
    base64url: "ci\u0105g znak\xF3w zakodowany w formacie base64url",
    json_string: "ci\u0105g znak\xF3w w formacie JSON",
    e164: "liczba E.164",
    credit_card: "numer karty kredytowej",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "wej\u015Bcie"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "liczba",
    array: "tablica"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano instanceof ${issue2.expected}, otrzymano ${received}`;
        }
        return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano ${expected}, otrzymano ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Nieprawid\u0142owe dane wej\u015Bciowe: oczekiwano ${stringifyPrimitive(issue2.values[0])}`;
        return `Nieprawid\u0142owa opcja: oczekiwano jednej z warto\u015Bci ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Za du\u017Ca warto\u015B\u0107: oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie mie\u0107 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "element\xF3w"}`;
        }
        return `Zbyt du\u017C(y/a/e): oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie wynosi\u0107 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Za ma\u0142a warto\u015B\u0107: oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie mie\u0107 ${adj}${issue2.minimum.toString()} ${sizing.unit ?? "element\xF3w"}`;
        }
        return `Zbyt ma\u0142(y/a/e): oczekiwano, \u017Ce ${issue2.origin ?? "warto\u015B\u0107"} b\u0119dzie wynosi\u0107 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi zaczyna\u0107 si\u0119 od "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi ko\u0144czy\u0107 si\u0119 na "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi zawiera\u0107 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Nieprawid\u0142owy ci\u0105g znak\xF3w: musi odpowiada\u0107 wzorcowi ${_issue.pattern}`;
        return `Nieprawid\u0142ow(y/a/e) ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Nieprawid\u0142owa liczba: musi by\u0107 wielokrotno\u015Bci\u0105 ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Nierozpoznane klucze${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Nieprawid\u0142owy klucz w ${issue2.origin}`;
      case "invalid_union":
        return "Nieprawid\u0142owe dane wej\u015Bciowe";
      case "invalid_element":
        return `Nieprawid\u0142owa warto\u015B\u0107 w ${issue2.origin}`;
      default:
        return `Nieprawid\u0142owe dane wej\u015Bciowe`;
    }
  };
};
function pl_default() {
  return {
    localeError: error42()
  };
}

// node_modules/zod/v4/locales/pt.js
var error43 = () => {
  const Sizable = {
    string: { unit: "caracteres" },
    file: { unit: "bytes" },
    array: { unit: "elementos" },
    set: { unit: "elementos" },
    map: { unit: "entradas" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "a entrada",
    email: "o endere\xE7o de e-mail",
    url: "o URL",
    emoji: "o emoji",
    uuid: "o UUID",
    uuidv4: "o UUIDv4",
    uuidv6: "o UUIDv6",
    nanoid: "o nanoid",
    guid: "o GUID",
    cuid: "o cuid",
    cuid2: "o cuid2",
    ulid: "o ULID",
    xid: "o XID",
    ksuid: "o KSUID",
    datetime: "a data e hora ISO",
    date: "a data ISO",
    time: "a hora ISO",
    duration: "a dura\xE7\xE3o ISO",
    ipv4: "o endere\xE7o IPv4",
    ipv6: "o endere\xE7o IPv6",
    mac: "o endere\xE7o MAC",
    cidrv4: "o intervalo de endere\xE7os IPv4",
    cidrv6: "o intervalo de endere\xE7os IPv6",
    base64: "o texto codificado em base64",
    base64url: "o texto codificado em base64url",
    json_string: "o texto JSON",
    e164: "o n\xFAmero E.164",
    credit_card: "o n\xFAmero de cart\xE3o de cr\xE9dito",
    iban: "o IBAN",
    jwt: "o JWT",
    template_literal: "a entrada"
  };
  const Gender = {
    masculine: { definite: "o", indefinite: "um" },
    feminine: { definite: "a", indefinite: "uma" }
  };
  const TypeDictionary = {
    string: { name: "texto", articles: Gender.masculine },
    number: { name: "n\xFAmero", articles: Gender.masculine },
    int: { name: "n\xFAmero inteiro", articles: Gender.masculine },
    boolean: { name: "valor booleano", articles: Gender.masculine },
    bigint: { name: "n\xFAmero bigint", articles: Gender.masculine },
    symbol: { name: "s\xEDmbolo", articles: Gender.masculine },
    undefined: { name: 'valor "undefined"', articles: Gender.masculine },
    null: { name: 'valor "nulo"', articles: Gender.masculine },
    never: { name: 'valor "never"', articles: Gender.masculine },
    void: { name: 'valor "void"', articles: Gender.masculine },
    date: { name: "data", articles: Gender.feminine },
    array: { name: "vetor", articles: Gender.masculine },
    object: { name: "objeto", articles: Gender.masculine },
    tuple: { name: "tuplo", articles: Gender.masculine },
    record: { name: "registo", articles: Gender.masculine },
    map: { name: "mapa", articles: Gender.masculine },
    set: { name: "conjunto", articles: Gender.masculine },
    file: { name: "ficheiro", articles: Gender.masculine },
    nonoptional: { name: "valor n\xE3o opcional", articles: Gender.masculine },
    nan: { name: 'valor "NaN"', articles: Gender.masculine },
    // Compatibility: "nan" -> "NaN" for display
    function: { name: "fun\xE7\xE3o", articles: Gender.feminine }
  };
  function translateOriginWithArticle(type, articleType) {
    const translatedValue = TypeDictionary[type] ?? { name: `valor "${type}"`, articles: Gender.masculine };
    return `${translatedValue.articles[articleType]} ${translatedValue.name}`;
  }
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = translateOriginWithArticle(issue2.expected, "indefinite");
        const receivedType = parsedType(issue2.input);
        const received = translateOriginWithArticle(receivedType, "indefinite");
        return `Entrada inv\xE1lida: esperava ${expected}, recebeu ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Entrada inv\xE1lida: esperava ${stringifyPrimitive(issue2.values[0])}`;
        return `Op\xE7\xE3o inv\xE1lida: esperava uma das seguintes op\xE7\xF5es: ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Demasiado grande: esperava que ${translateOriginWithArticle(issue2.origin, "definite")} tivesse ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "elementos"}`;
        return `Demasiado grande: esperava que ${translateOriginWithArticle(issue2.origin, "definite")} fosse ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Demasiado pequeno: esperava que ${translateOriginWithArticle(issue2.origin, "definite")} tivesse ${adj} ${issue2.minimum.toString()} ${sizing.unit ?? "elementos"}`;
        }
        return `Demasiado pequeno: esperava que ${translateOriginWithArticle(issue2.origin, "definite")} fosse ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Texto inv\xE1lido: deve come\xE7ar por "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Texto inv\xE1lido: deve terminar em "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Texto inv\xE1lido: deve incluir "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Texto inv\xE1lido: deve corresponder ao padr\xE3o ${_issue.pattern}`;
        return `Formato d${FormatDictionary[_issue.format] ?? issue2.format} inv\xE1lido`;
      }
      case "not_multiple_of":
        return `N\xFAmero inv\xE1lido: deve ser m\xFAltiplo de ${issue2.divisor}`;
      case "unrecognized_keys": {
        const plural2 = issue2.keys.length > 1 ? "s" : "";
        return `Chave${plural2} inv\xE1lida${plural2}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key":
        return `Entrada inv\xE1lida n${translateOriginWithArticle(issue2.origin, "definite")}`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `Valor de discrimina\xE7\xE3o inv\xE1lido. Esperava ${opts}`;
        }
        return "Entrada inv\xE1lida";
      case "invalid_element":
        return `Entrada inv\xE1lida n${translateOriginWithArticle(issue2.origin, "definite")}`;
      default:
        return `Entrada inv\xE1lida`;
    }
  };
};
function pt_default() {
  return {
    localeError: error43()
  };
}

// node_modules/zod/v4/locales/pt-BR.js
var error44 = () => {
  const Sizable = {
    string: { unit: "caracteres" },
    file: { unit: "bytes" },
    array: { unit: "elementos" },
    set: { unit: "elementos" },
    map: { unit: "entradas" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "a entrada",
    email: "o endere\xE7o de e-mail",
    url: "o URL",
    emoji: "o emoji",
    uuid: "o UUID",
    uuidv4: "o UUIDv4",
    uuidv6: "o UUIDv6",
    nanoid: "o nanoid",
    guid: "o GUID",
    cuid: "o cuid",
    cuid2: "o cuid2",
    ulid: "o ULID",
    xid: "o XID",
    ksuid: "o KSUID",
    datetime: "a data e hora ISO",
    date: "a data ISO",
    time: "a hora ISO",
    duration: "a dura\xE7\xE3o ISO",
    ipv4: "o endere\xE7o IPv4",
    ipv6: "o endere\xE7o IPv6",
    mac: "o endere\xE7o MAC",
    cidrv4: "a faixa de endere\xE7os IPv4",
    cidrv6: "a faixa de endere\xE7os IPv6",
    base64: "o texto codificado em base64",
    base64url: "o texto codificado em base64url",
    json_string: "o texto JSON",
    e164: "o n\xFAmero E.164",
    credit_card: "o n\xFAmero de cart\xE3o de cr\xE9dito",
    iban: "o IBAN",
    jwt: "o JWT",
    template_literal: "a entrada"
  };
  const Gender = {
    masculine: { definite: "o", indefinite: "um" },
    feminine: { definite: "a", indefinite: "uma" }
  };
  const TypeDictionary = {
    string: { name: "texto", articles: Gender.masculine },
    number: { name: "n\xFAmero", articles: Gender.masculine },
    int: { name: "n\xFAmero inteiro", articles: Gender.masculine },
    boolean: { name: "valor booleano", articles: Gender.masculine },
    bigint: { name: "n\xFAmero bigint", articles: Gender.masculine },
    symbol: { name: "s\xEDmbolo", articles: Gender.masculine },
    undefined: { name: 'valor "undefined"', articles: Gender.masculine },
    null: { name: 'valor "nulo"', articles: Gender.masculine },
    never: { name: 'valor "never"', articles: Gender.masculine },
    void: { name: 'valor "void"', articles: Gender.masculine },
    date: { name: "data", articles: Gender.feminine },
    array: { name: "vetor", articles: Gender.masculine },
    object: { name: "objeto", articles: Gender.masculine },
    tuple: { name: "tupla", articles: Gender.feminine },
    record: { name: "registro", articles: Gender.masculine },
    map: { name: "mapa", articles: Gender.masculine },
    set: { name: "conjunto", articles: Gender.masculine },
    file: { name: "arquivo", articles: Gender.masculine },
    nonoptional: { name: "valor n\xE3o opcional", articles: Gender.masculine },
    nan: { name: 'valor "NaN"', articles: Gender.masculine },
    // Compatibility: "nan" -> "NaN" for display
    function: { name: "fun\xE7\xE3o", articles: Gender.feminine }
  };
  function translateOriginWithArticle(type, articleType) {
    const translatedValue = TypeDictionary[type] ?? { name: `valor "${type}"`, articles: Gender.masculine };
    return `${translatedValue.articles[articleType]} ${translatedValue.name}`;
  }
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = translateOriginWithArticle(issue2.expected, "indefinite");
        const receivedType = parsedType(issue2.input);
        const received = translateOriginWithArticle(receivedType, "indefinite");
        return `Entrada inv\xE1lida: esperava ${expected}, recebeu ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Entrada inv\xE1lida: esperava ${stringifyPrimitive(issue2.values[0])}`;
        return `Op\xE7\xE3o inv\xE1lida: esperava uma das seguintes op\xE7\xF5es: ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Grande demais: esperava que ${translateOriginWithArticle(issue2.origin, "definite")} tivesse ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "elementos"}`;
        return `Grande demais: esperava que ${translateOriginWithArticle(issue2.origin, "definite")} fosse ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Pequeno demais: esperava que ${translateOriginWithArticle(issue2.origin, "definite")} tivesse ${adj} ${issue2.minimum.toString()} ${sizing.unit ?? "elementos"}`;
        }
        return `Pequeno demais: esperava que ${translateOriginWithArticle(issue2.origin, "definite")} fosse ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Texto inv\xE1lido: deve come\xE7ar com "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Texto inv\xE1lido: deve terminar com "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Texto inv\xE1lido: deve incluir "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Texto inv\xE1lido: deve corresponder ao padr\xE3o ${_issue.pattern}`;
        return `Formato d${FormatDictionary[_issue.format] ?? issue2.format} inv\xE1lido`;
      }
      case "not_multiple_of":
        return `N\xFAmero inv\xE1lido: deve ser m\xFAltiplo de ${issue2.divisor}`;
      case "unrecognized_keys": {
        const plural2 = issue2.keys.length > 1 ? "s" : "";
        return `Chave${plural2} inv\xE1lida${plural2}: ${joinValues(issue2.keys, ", ")}`;
      }
      case "invalid_key":
        return `Entrada inv\xE1lida n${translateOriginWithArticle(issue2.origin, "definite")}`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `Valor de discrimina\xE7\xE3o inv\xE1lido. Esperava ${opts}`;
        }
        return "Entrada inv\xE1lida";
      case "invalid_element":
        return `Entrada inv\xE1lida n${translateOriginWithArticle(issue2.origin, "definite")}`;
      default:
        return `Entrada inv\xE1lida`;
    }
  };
};
function pt_BR_default() {
  return {
    localeError: error44()
  };
}

// node_modules/zod/v4/locales/ro.js
var error45 = () => {
  const Sizable = {
    string: { unit: "caractere", verb: "s\u0103 aib\u0103" },
    file: { unit: "octe\u021Bi", verb: "s\u0103 aib\u0103" },
    array: { unit: "elemente", verb: "s\u0103 aib\u0103" },
    set: { unit: "elemente", verb: "s\u0103 aib\u0103" },
    map: { unit: "intr\u0103ri", verb: "s\u0103 aib\u0103" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "intrare",
    email: "adres\u0103 de email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "dat\u0103 \u0219i or\u0103 ISO",
    date: "dat\u0103 ISO",
    time: "or\u0103 ISO",
    duration: "durat\u0103 ISO",
    ipv4: "adres\u0103 IPv4",
    ipv6: "adres\u0103 IPv6",
    mac: "adres\u0103 MAC",
    cidrv4: "interval IPv4",
    cidrv6: "interval IPv6",
    base64: "\u0219ir codat base64",
    base64url: "\u0219ir codat base64url",
    json_string: "\u0219ir JSON",
    e164: "num\u0103r E.164",
    credit_card: "num\u0103r de card de credit",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "intrare"
  };
  const TypeDictionary = {
    nan: "NaN",
    string: "\u0219ir",
    number: "num\u0103r",
    boolean: "boolean",
    function: "func\u021Bie",
    array: "matrice",
    object: "obiect",
    undefined: "nedefinit",
    symbol: "simbol",
    bigint: "num\u0103r mare",
    void: "void",
    never: "never",
    map: "hart\u0103",
    set: "set"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        return `Intrare invalid\u0103: a\u0219teptat ${expected}, primit ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Intrare invalid\u0103: a\u0219teptat ${stringifyPrimitive(issue2.values[0])}`;
        return `Op\u021Biune invalid\u0103: a\u0219teptat una dintre ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Prea mare: a\u0219teptat ca ${issue2.origin ?? "valoarea"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elemente"}`;
        return `Prea mare: a\u0219teptat ca ${issue2.origin ?? "valoarea"} s\u0103 fie ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Prea mic: a\u0219teptat ca ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Prea mic: a\u0219teptat ca ${issue2.origin} s\u0103 fie ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0218ir invalid: trebuie s\u0103 \xEEnceap\u0103 cu "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u0218ir invalid: trebuie s\u0103 se termine cu "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u0218ir invalid: trebuie s\u0103 includ\u0103 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u0218ir invalid: trebuie s\u0103 se potriveasc\u0103 cu modelul ${_issue.pattern}`;
        return `Format invalid: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Num\u0103r invalid: trebuie s\u0103 fie multiplu de ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Chei nerecunoscute: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Cheie invalid\u0103 \xEEn ${issue2.origin}`;
      case "invalid_union":
        return "Intrare invalid\u0103";
      case "invalid_element":
        return `Valoare invalid\u0103 \xEEn ${issue2.origin}`;
      default:
        return `Intrare invalid\u0103`;
    }
  };
};
function ro_default() {
  return {
    localeError: error45()
  };
}

// node_modules/zod/v4/locales/ru.js
function getRussianPlural(count, one, few, many) {
  const absCount = Math.abs(count);
  const lastDigit = absCount % 10;
  const lastTwoDigits = absCount % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  return many;
}
var error46 = () => {
  const Sizable = {
    string: {
      unit: {
        one: "\u0441\u0438\u043C\u0432\u043E\u043B",
        few: "\u0441\u0438\u043C\u0432\u043E\u043B\u0430",
        many: "\u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432"
      },
      verb: "\u0438\u043C\u0435\u0442\u044C"
    },
    file: {
      unit: {
        one: "\u0431\u0430\u0439\u0442",
        few: "\u0431\u0430\u0439\u0442\u0430",
        many: "\u0431\u0430\u0439\u0442"
      },
      verb: "\u0438\u043C\u0435\u0442\u044C"
    },
    array: {
      unit: {
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432"
      },
      verb: "\u0438\u043C\u0435\u0442\u044C"
    },
    set: {
      unit: {
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432"
      },
      verb: "\u0438\u043C\u0435\u0442\u044C"
    },
    map: {
      unit: {
        one: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442",
        few: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430",
        many: "\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432"
      },
      verb: "\u0438\u043C\u0435\u0442\u044C"
    }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0432\u0432\u043E\u0434",
    email: "email \u0430\u0434\u0440\u0435\u0441",
    url: "URL",
    emoji: "\u044D\u043C\u043E\u0434\u0437\u0438",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0434\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F",
    date: "ISO \u0434\u0430\u0442\u0430",
    time: "ISO \u0432\u0440\u0435\u043C\u044F",
    duration: "ISO \u0434\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
    ipv4: "IPv4 \u0430\u0434\u0440\u0435\u0441",
    ipv6: "IPv6 \u0430\u0434\u0440\u0435\u0441",
    mac: "MAC \u0430\u0434\u0440\u0435\u0441",
    cidrv4: "IPv4 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
    cidrv6: "IPv6 \u0434\u0438\u0430\u043F\u0430\u0437\u043E\u043D",
    base64: "\u0441\u0442\u0440\u043E\u043A\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 base64",
    base64url: "\u0441\u0442\u0440\u043E\u043A\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 base64url",
    json_string: "JSON \u0441\u0442\u0440\u043E\u043A\u0430",
    e164: "\u043D\u043E\u043C\u0435\u0440 E.164",
    credit_card: "\u043D\u043E\u043C\u0435\u0440 \u043A\u0440\u0435\u0434\u0438\u0442\u043D\u043E\u0439 \u043A\u0430\u0440\u0442\u044B",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0432\u0432\u043E\u0434"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0447\u0438\u0441\u043B\u043E",
    array: "\u043C\u0430\u0441\u0441\u0438\u0432"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C instanceof ${issue2.expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E ${received}`;
        }
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C ${expected}, \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0432\u043E\u0434: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C ${stringifyPrimitive(issue2.values[0])}`;
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0432\u0430\u0440\u0438\u0430\u043D\u0442: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0434\u043D\u043E \u0438\u0437 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const maxValue = Number(issue2.maximum);
          const unit = getRussianPlural(maxValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
          return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435"} \u0431\u0443\u0434\u0435\u0442 \u0438\u043C\u0435\u0442\u044C ${adj}${issue2.maximum.toString()} ${unit}`;
        }
        return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435"} \u0431\u0443\u0434\u0435\u0442 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          const minValue = Number(issue2.minimum);
          const unit = getRussianPlural(minValue, sizing.unit.one, sizing.unit.few, sizing.unit.many);
          return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin} \u0431\u0443\u0434\u0435\u0442 \u0438\u043C\u0435\u0442\u044C ${adj}${issue2.minimum.toString()} ${unit}`;
        }
        return `\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u0430\u043B\u0435\u043D\u044C\u043A\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435: \u043E\u0436\u0438\u0434\u0430\u043B\u043E\u0441\u044C, \u0447\u0442\u043E ${issue2.origin} \u0431\u0443\u0434\u0435\u0442 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u043D\u0430\u0447\u0438\u043D\u0430\u0442\u044C\u0441\u044F \u0441 "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0437\u0430\u043A\u0430\u043D\u0447\u0438\u0432\u0430\u0442\u044C\u0441\u044F \u043D\u0430 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u041D\u0435\u0432\u0435\u0440\u043D\u0430\u044F \u0441\u0442\u0440\u043E\u043A\u0430: \u0434\u043E\u043B\u0436\u043D\u0430 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u043E\u0432\u0430\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0447\u0438\u0441\u043B\u043E: \u0434\u043E\u043B\u0436\u043D\u043E \u0431\u044B\u0442\u044C \u043A\u0440\u0430\u0442\u043D\u044B\u043C ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u041D\u0435\u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u043D\u043D${issue2.keys.length > 1 ? "\u044B\u0435" : "\u044B\u0439"} \u043A\u043B\u044E\u0447${issue2.keys.length > 1 ? "\u0438" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u043A\u043B\u044E\u0447 \u0432 ${issue2.origin}`;
      case "invalid_union":
        return "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435";
      case "invalid_element":
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u0432 ${issue2.origin}`;
      default:
        return `\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0435 \u0432\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435`;
    }
  };
};
function ru_default() {
  return {
    localeError: error46()
  };
}

// node_modules/zod/v4/locales/sk.js
var error47 = () => {
  const Sizable = {
    string: { unit: "znakov", verb: "ma\u0165" },
    file: { unit: "bajtov", verb: "ma\u0165" },
    array: { unit: "prvkov", verb: "ma\u0165" },
    set: { unit: "prvkov", verb: "ma\u0165" },
    map: { unit: "polo\u017Eiek", verb: "ma\u0165" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "regul\xE1rny v\xFDraz",
    email: "e-mailov\xE1 adresa",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "d\xE1tum a \u010Das vo form\xE1te ISO",
    date: "d\xE1tum vo form\xE1te ISO",
    time: "\u010Das vo form\xE1te ISO",
    duration: "doba trvania ISO",
    ipv4: "IPv4 adresa",
    ipv6: "IPv6 adresa",
    mac: "MAC adresa",
    cidrv4: "rozsah IPv4",
    cidrv6: "rozsah IPv6",
    base64: "re\u0165azec zak\xF3dovan\xFD vo form\xE1te base64",
    base64url: "re\u0165azec zak\xF3dovan\xFD vo form\xE1te base64url",
    json_string: "re\u0165azec vo form\xE1te JSON",
    e164: "\u010D\xEDslo E.164",
    credit_card: "\u010D\xEDslo kreditnej karty",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "vstup"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u010D\xEDslo",
    string: "re\u0165azec",
    function: "funkcia",
    array: "pole"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Neplatn\xFD vstup: o\u010Dak\xE1van\xE9 instanceof ${issue2.expected}, obdr\u017Ean\xE9 ${received}`;
        }
        return `Neplatn\xFD vstup: o\u010Dak\xE1van\xE9 ${expected}, obdr\u017Ean\xE9 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Neplatn\xFD vstup: o\u010Dak\xE1van\xE9 ${stringifyPrimitive(issue2.values[0])}`;
        return `Neplatn\xFD vstup: o\u010Dak\xE1van\xE1 jedna z hodn\xF4t ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Hodnota je pr\xEDli\u0161 ve\u013Ek\xE1: ${issue2.origin ?? "hodnota"} mus\xED ma\u0165 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "prvkov"}`;
        }
        return `Hodnota je pr\xEDli\u0161 ve\u013Ek\xE1: ${issue2.origin ?? "hodnota"} mus\xED by\u0165 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Hodnota je pr\xEDli\u0161 mal\xE1: ${issue2.origin ?? "hodnota"} mus\xED ma\u0165 ${adj}${issue2.minimum.toString()} ${sizing.unit ?? "prvkov"}`;
        }
        return `Hodnota je pr\xEDli\u0161 mal\xE1: ${issue2.origin ?? "hodnota"} mus\xED by\u0165 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Neplatn\xFD re\u0165azec: mus\xED za\u010D\xEDna\u0165 na "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Neplatn\xFD re\u0165azec: mus\xED kon\u010Di\u0165 na "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Neplatn\xFD re\u0165azec: mus\xED obsahova\u0165 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Neplatn\xFD re\u0165azec: mus\xED zodpoveda\u0165 vzoru ${_issue.pattern}`;
        return `Neplatn\xFD form\xE1t ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Neplatn\xE9 \u010D\xEDslo: mus\xED by\u0165 n\xE1sobkom ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Nezn\xE1me kl\xFA\u010De: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Neplatn\xFD kl\xFA\u010D v ${issue2.origin}`;
      case "invalid_union":
        return "Neplatn\xFD vstup";
      case "invalid_element":
        return `Neplatn\xE1 hodnota v ${issue2.origin}`;
      default:
        return `Neplatn\xFD vstup`;
    }
  };
};
function sk_default() {
  return {
    localeError: error47()
  };
}

// node_modules/zod/v4/locales/sl.js
var error48 = () => {
  const Sizable = {
    string: { unit: "znakov", verb: "imeti" },
    file: { unit: "bajtov", verb: "imeti" },
    array: { unit: "elementov", verb: "imeti" },
    set: { unit: "elementov", verb: "imeti" },
    map: { unit: "elementov", verb: "imeti" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "vnos",
    email: "e-po\u0161tni naslov",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datum in \u010Das",
    date: "ISO datum",
    time: "ISO \u010Das",
    duration: "ISO trajanje",
    ipv4: "IPv4 naslov",
    ipv6: "IPv6 naslov",
    mac: "MAC naslov",
    cidrv4: "obseg IPv4",
    cidrv6: "obseg IPv6",
    base64: "base64 kodiran niz",
    base64url: "base64url kodiran niz",
    json_string: "JSON niz",
    e164: "E.164 \u0161tevilka",
    credit_card: "\u0161tevilka kreditne kartice",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "vnos"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0161tevilo",
    array: "tabela"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Neveljaven vnos: pri\u010Dakovano instanceof ${issue2.expected}, prejeto ${received}`;
        }
        return `Neveljaven vnos: pri\u010Dakovano ${expected}, prejeto ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Neveljaven vnos: pri\u010Dakovano ${stringifyPrimitive(issue2.values[0])}`;
        return `Neveljavna mo\u017Enost: pri\u010Dakovano eno izmed ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Preveliko: pri\u010Dakovano, da bo ${issue2.origin ?? "vrednost"} imelo ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elementov"}`;
        return `Preveliko: pri\u010Dakovano, da bo ${issue2.origin ?? "vrednost"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Premajhno: pri\u010Dakovano, da bo ${issue2.origin} imelo ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Premajhno: pri\u010Dakovano, da bo ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Neveljaven niz: mora se za\u010Deti z "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Neveljaven niz: mora se kon\u010Dati z "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Neveljaven niz: mora vsebovati "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Neveljaven niz: mora ustrezati vzorcu ${_issue.pattern}`;
        return `Neveljaven ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Neveljavno \u0161tevilo: mora biti ve\u010Dkratnik ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Neprepoznan${issue2.keys.length > 1 ? "i klju\u010Di" : " klju\u010D"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Neveljaven klju\u010D v ${issue2.origin}`;
      case "invalid_union":
        return "Neveljaven vnos";
      case "invalid_element":
        return `Neveljavna vrednost v ${issue2.origin}`;
      default:
        return "Neveljaven vnos";
    }
  };
};
function sl_default() {
  return {
    localeError: error48()
  };
}

// node_modules/zod/v4/locales/sv.js
var error49 = () => {
  const Sizable = {
    string: { unit: "tecken", verb: "att ha" },
    file: { unit: "bytes", verb: "att ha" },
    array: { unit: "objekt", verb: "att inneh\xE5lla" },
    set: { unit: "objekt", verb: "att inneh\xE5lla" },
    map: { unit: "objekt", verb: "att inneh\xE5lla" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "regulj\xE4rt uttryck",
    email: "e-postadress",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO-datum och tid",
    date: "ISO-datum",
    time: "ISO-tid",
    duration: "ISO-varaktighet",
    ipv4: "IPv4-adress",
    ipv6: "IPv6-adress",
    mac: "MAC-adress",
    cidrv4: "IPv4-spektrum",
    cidrv6: "IPv6-spektrum",
    base64: "base64-kodad str\xE4ng",
    base64url: "base64url-kodad str\xE4ng",
    json_string: "JSON-str\xE4ng",
    e164: "E.164-nummer",
    credit_card: "kreditkortsnummer",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "mall-literal"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "antal",
    array: "lista"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ogiltig inmatning: f\xF6rv\xE4ntat instanceof ${issue2.expected}, fick ${received}`;
        }
        return `Ogiltig inmatning: f\xF6rv\xE4ntat ${expected}, fick ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Ogiltig inmatning: f\xF6rv\xE4ntat ${stringifyPrimitive(issue2.values[0])}`;
        return `Ogiltigt val: f\xF6rv\xE4ntade en av ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `F\xF6r stor(t): f\xF6rv\xE4ntade ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "element"}`;
        }
        return `F\xF6r stor(t): f\xF6rv\xE4ntat ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `F\xF6r lite(t): f\xF6rv\xE4ntade ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `F\xF6r lite(t): f\xF6rv\xE4ntade ${issue2.origin ?? "v\xE4rdet"} att ha ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Ogiltig str\xE4ng: m\xE5ste b\xF6rja med "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Ogiltig str\xE4ng: m\xE5ste sluta med "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Ogiltig str\xE4ng: m\xE5ste inneh\xE5lla "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Ogiltig str\xE4ng: m\xE5ste matcha m\xF6nstret "${_issue.pattern}"`;
        return `Ogiltig(t) ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Ogiltigt tal: m\xE5ste vara en multipel av ${issue2.divisor}`;
      case "unrecognized_keys":
        return `${issue2.keys.length > 1 ? "Ok\xE4nda nycklar" : "Ok\xE4nd nyckel"}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Ogiltig nyckel i ${issue2.origin ?? "v\xE4rdet"}`;
      case "invalid_union":
        return "Ogiltig input";
      case "invalid_element":
        return `Ogiltigt v\xE4rde i ${issue2.origin ?? "v\xE4rdet"}`;
      default:
        return `Ogiltig input`;
    }
  };
};
function sv_default() {
  return {
    localeError: error49()
  };
}

// node_modules/zod/v4/locales/ta.js
var error50 = () => {
  const Sizable = {
    string: { unit: "\u0B8E\u0BB4\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0B95\u0BCD\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" },
    file: { unit: "\u0BAA\u0BC8\u0B9F\u0BCD\u0B9F\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" },
    array: { unit: "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" },
    set: { unit: "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" },
    map: { unit: "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD", verb: "\u0B95\u0BCA\u0BA3\u0BCD\u0B9F\u0BBF\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1",
    email: "\u0BAE\u0BBF\u0BA9\u0BCD\u0BA9\u0B9E\u0BCD\u0B9A\u0BB2\u0BCD \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u0BA4\u0BC7\u0BA4\u0BBF \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD",
    date: "ISO \u0BA4\u0BC7\u0BA4\u0BBF",
    time: "ISO \u0BA8\u0BC7\u0BB0\u0BAE\u0BCD",
    duration: "ISO \u0B95\u0BBE\u0BB2 \u0B85\u0BB3\u0BB5\u0BC1",
    ipv4: "IPv4 \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
    ipv6: "IPv6 \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
    mac: "MAC \u0BAE\u0BC1\u0B95\u0BB5\u0BB0\u0BBF",
    cidrv4: "IPv4 \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BC1",
    cidrv6: "IPv6 \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BC1",
    base64: "base64-encoded \u0B9A\u0BB0\u0BAE\u0BCD",
    base64url: "base64url-encoded \u0B9A\u0BB0\u0BAE\u0BCD",
    json_string: "JSON \u0B9A\u0BB0\u0BAE\u0BCD",
    e164: "E.164 \u0B8E\u0BA3\u0BCD",
    credit_card: "\u0B95\u0B9F\u0BA9\u0BCD \u0B85\u0B9F\u0BCD\u0B9F\u0BC8 \u0B8E\u0BA3\u0BCD",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0B8E\u0BA3\u0BCD",
    array: "\u0B85\u0BA3\u0BBF",
    null: "\u0BB5\u0BC6\u0BB1\u0BC1\u0BAE\u0BC8"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 instanceof ${issue2.expected}, \u0BAA\u0BC6\u0BB1\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${received}`;
        }
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${expected}, \u0BAA\u0BC6\u0BB1\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${stringifyPrimitive(issue2.values[0])}`;
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BB5\u0BBF\u0BB0\u0BC1\u0BAA\u0BCD\u0BAA\u0BAE\u0BCD: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${joinValues(issue2.values, "|")} \u0B87\u0BB2\u0BCD \u0B92\u0BA9\u0BCD\u0BB1\u0BC1`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0BAE\u0BBF\u0B95 \u0BAA\u0BC6\u0BB0\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin ?? "\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0B89\u0BB1\u0BC1\u0BAA\u0BCD\u0BAA\u0BC1\u0B95\u0BB3\u0BCD"} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        }
        return `\u0BAE\u0BBF\u0B95 \u0BAA\u0BC6\u0BB0\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin ?? "\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1"} ${adj}${issue2.maximum.toString()} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0BAE\u0BBF\u0B95\u0B9A\u0BCD \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        }
        return `\u0BAE\u0BBF\u0B95\u0B9A\u0BCD \u0B9A\u0BBF\u0BB1\u0BBF\u0BAF\u0BA4\u0BC1: \u0B8E\u0BA4\u0BBF\u0BB0\u0BCD\u0BAA\u0BBE\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1 ${issue2.origin} ${adj}${issue2.minimum.toString()} \u0B86\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.prefix}" \u0B87\u0BB2\u0BCD \u0BA4\u0BCA\u0B9F\u0B99\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        if (_issue.format === "ends_with")
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.suffix}" \u0B87\u0BB2\u0BCD \u0BAE\u0BC1\u0B9F\u0BBF\u0BB5\u0B9F\u0BC8\u0BAF \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        if (_issue.format === "includes")
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: "${_issue.includes}" \u0B90 \u0B89\u0BB3\u0BCD\u0BB3\u0B9F\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        if (_issue.format === "regex")
          return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B9A\u0BB0\u0BAE\u0BCD: ${_issue.pattern} \u0BAE\u0BC1\u0BB1\u0BC8\u0BAA\u0BBE\u0B9F\u0BCD\u0B9F\u0BC1\u0B9F\u0BA9\u0BCD \u0BAA\u0BCA\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B8E\u0BA3\u0BCD: ${issue2.divisor} \u0B87\u0BA9\u0BCD \u0BAA\u0BB2\u0BAE\u0BBE\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD`;
      case "unrecognized_keys":
        return `\u0B85\u0B9F\u0BC8\u0BAF\u0BBE\u0BB3\u0BAE\u0BCD \u0BA4\u0BC6\u0BB0\u0BBF\u0BAF\u0BBE\u0BA4 \u0BB5\u0BBF\u0B9A\u0BC8${issue2.keys.length > 1 ? "\u0B95\u0BB3\u0BCD" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} \u0B87\u0BB2\u0BCD \u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BB5\u0BBF\u0B9A\u0BC8`;
      case "invalid_union":
        return "\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1";
      case "invalid_element":
        return `${issue2.origin} \u0B87\u0BB2\u0BCD \u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC1`;
      default:
        return `\u0BA4\u0BB5\u0BB1\u0BBE\u0BA9 \u0B89\u0BB3\u0BCD\u0BB3\u0BC0\u0B9F\u0BC1`;
    }
  };
};
function ta_default() {
  return {
    localeError: error50()
  };
}

// node_modules/zod/v4/locales/tg.js
var error51 = () => {
  const Sizable = {
    string: { unit: "\u0430\u043B\u043E\u043C\u0430\u0442", verb: "\u0434\u043E\u0448\u0442\u0430 \u0431\u043E\u0448\u0430\u0434" },
    file: { unit: "\u0431\u0430\u0439\u0442", verb: "\u0434\u043E\u0448\u0442\u0430 \u0431\u043E\u0448\u0430\u0434" },
    array: { unit: "\u0443\u043D\u0441\u0443\u0440", verb: "\u0434\u043E\u0448\u0442\u0430 \u0431\u043E\u0448\u0430\u0434" },
    set: { unit: "\u0443\u043D\u0441\u0443\u0440", verb: "\u0434\u043E\u0448\u0442\u0430 \u0431\u043E\u0448\u0430\u0434" },
    map: { unit: "\u0441\u0430\u0431\u0442", verb: "\u0434\u043E\u0448\u0442\u0430 \u0431\u043E\u0448\u0430\u0434" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0432\u0443\u0440\u0443\u0434",
    email: "\u0441\u0443\u0440\u043E\u0493\u0430\u0438 email",
    url: "URL",
    emoji: "\u044D\u043C\u043E\u04B7\u0438",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u0441\u0430\u043D\u0430\u0432\u0443 \u0432\u0430\u049B\u0442\u0438 ISO",
    date: "\u0441\u0430\u043D\u0430\u0438 ISO",
    time: "\u0432\u0430\u049B\u0442\u0438 ISO",
    duration: "\u0434\u0430\u0432\u043E\u043C\u043D\u043E\u043A\u0438\u0438 ISO",
    ipv4: "\u0441\u0443\u0440\u043E\u0493\u0430\u0438 IPv4",
    ipv6: "\u0441\u0443\u0440\u043E\u0493\u0430\u0438 IPv6",
    mac: "\u0441\u0443\u0440\u043E\u0493\u0430\u0438 MAC",
    cidrv4: "\u043C\u0430\u04B3\u0434\u0443\u0434\u0430\u0438 IPv4",
    cidrv6: "\u043C\u0430\u04B3\u0434\u0443\u0434\u0430\u0438 IPv6",
    base64: "\u0441\u0430\u0442\u0440\u0438 \u0434\u0430\u0440 \u0444\u043E\u0440\u043C\u0430\u0442\u0438 base64",
    base64url: "\u0441\u0430\u0442\u0440\u0438 \u0434\u0430\u0440 \u0444\u043E\u0440\u043C\u0430\u0442\u0438 base64url",
    json_string: "\u0441\u0430\u0442\u0440\u0438 JSON",
    e164: "\u0440\u0430\u049B\u0430\u043C\u0438 E.164",
    credit_card: "\u0440\u0430\u049B\u0430\u043C\u0438 \u043A\u043E\u0440\u0442\u0438 \u043A\u0440\u0435\u0434\u0438\u0442\u04E3",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0432\u0443\u0440\u0443\u0434"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0440\u0430\u049B\u0430\u043C",
    string: "\u0441\u0430\u0442\u0440",
    array: "\u043C\u0430\u0441\u0441\u0438\u0432",
    object: "\u043E\u0431\u044A\u0435\u043A\u0442",
    date: "\u0441\u0430\u043D\u0430"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        return `\u0412\u0443\u0440\u0443\u0434\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442: ${expected} \u0438\u043D\u0442\u0438\u0437\u043E\u0440 \u043C\u0435\u0440\u0430\u0444\u0442, ${received} \u0433\u0438\u0440\u0438\u0444\u0442\u0430 \u0448\u0443\u0434`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0412\u0443\u0440\u0443\u0434\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442: ${stringifyPrimitive(issue2.values[0])} \u0438\u043D\u0442\u0438\u0437\u043E\u0440 \u043C\u0435\u0440\u0430\u0444\u0442`;
        return `\u0418\u043D\u0442\u0438\u0445\u043E\u0431\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442: \u044F\u043A\u0435 \u0430\u0437 ${joinValues(issue2.values, "|")} \u0438\u043D\u0442\u0438\u0437\u043E\u0440 \u043C\u0435\u0440\u0430\u0444\u0442`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0425\u0435\u043B\u0435 \u043A\u0430\u043B\u043E\u043D: ${issue2.origin ?? "\u049B\u0438\u043C\u0430\u0442"} \u0431\u043E\u044F\u0434 ${adj}${issue2.maximum.toString()} ${sizing.unit} ${sizing.verb}`;
        return `\u0425\u0435\u043B\u0435 \u043A\u0430\u043B\u043E\u043D: ${issue2.origin ?? "\u049B\u0438\u043C\u0430\u0442"} \u0431\u043E\u044F\u0434 ${adj}${issue2.maximum.toString()} \u0431\u043E\u0448\u0430\u0434`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0425\u0435\u043B\u0435 \u0445\u0443\u0440\u0434: ${issue2.origin} \u0431\u043E\u044F\u0434 ${adj}${issue2.minimum.toString()} ${sizing.unit} ${sizing.verb}`;
        return `\u0425\u0435\u043B\u0435 \u0445\u0443\u0440\u0434: ${issue2.origin} \u0431\u043E\u044F\u0434 ${adj}${issue2.minimum.toString()} \u0431\u043E\u0448\u0430\u0434`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u0421\u0430\u0442\u0440\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442: \u0431\u043E\u044F\u0434 \u0431\u043E "${_issue.prefix}" \u043E\u0493\u043E\u0437 \u0448\u0430\u0432\u0430\u0434`;
        if (_issue.format === "ends_with")
          return `\u0421\u0430\u0442\u0440\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442: \u0431\u043E\u044F\u0434 \u0431\u043E "${_issue.suffix}" \u0430\u043D\u04B7\u043E\u043C \u0451\u0431\u0430\u0434`;
        if (_issue.format === "includes")
          return `\u0421\u0430\u0442\u0440\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442: \u0431\u043E\u044F\u0434 "${_issue.includes}"-\u0440\u043E \u0434\u0430\u0440 \u0431\u0430\u0440 \u0433\u0438\u0440\u0430\u0434`;
        if (_issue.format === "regex")
          return `\u0421\u0430\u0442\u0440\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442: \u0431\u043E\u044F\u0434 \u0431\u0430 \u043D\u0430\u043C\u0443\u043D\u0430\u0438 ${_issue.pattern} \u043C\u0443\u0432\u043E\u0444\u0438\u049B\u0430\u0442 \u043A\u0443\u043D\u0430\u0434`;
        return `${FormatDictionary[_issue.format] ?? issue2.format}-\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442`;
      }
      case "not_multiple_of":
        return `\u0420\u0430\u049B\u0430\u043C\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442: \u0431\u043E\u044F\u0434 \u0431\u0430 ${issue2.divisor} \u0431\u0435 \u0431\u0430\u049B\u0438\u044F \u0442\u0430\u049B\u0441\u0438\u043C \u0448\u0430\u0432\u0430\u0434`;
      case "unrecognized_keys":
        return `\u041A\u0430\u043B\u0438\u0434${issue2.keys.length > 1 ? "\u04B3\u043E\u0438" : "\u0438"} \u043D\u043E\u043C\u0430\u044A\u043B\u0443\u043C: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u041A\u0430\u043B\u0438\u0434\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442 \u0434\u0430\u0440 ${issue2.origin}`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `\u049A\u0438\u043C\u0430\u0442\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442\u0438 \u0434\u0438\u0441\u043A\u0440\u0438\u043C\u0438\u043D\u0430\u0442\u043E\u0440: ${opts} \u0438\u043D\u0442\u0438\u0437\u043E\u0440 \u043C\u0435\u0440\u0430\u0444\u0442`;
        }
        return "\u0412\u0443\u0440\u0443\u0434\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442";
      case "invalid_element":
        return `\u049A\u0438\u043C\u0430\u0442\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442 \u0434\u0430\u0440 ${issue2.origin}`;
      default:
        return `\u0412\u0443\u0440\u0443\u0434\u0438 \u043D\u043E\u0434\u0443\u0440\u0443\u0441\u0442`;
    }
  };
};
function tg_default() {
  return {
    localeError: error51()
  };
}

// node_modules/zod/v4/locales/th.js
var error52 = () => {
  const Sizable = {
    string: { unit: "\u0E15\u0E31\u0E27\u0E2D\u0E31\u0E01\u0E29\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" },
    file: { unit: "\u0E44\u0E1A\u0E15\u0E4C", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" },
    array: { unit: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" },
    set: { unit: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" },
    map: { unit: "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23", verb: "\u0E04\u0E27\u0E23\u0E21\u0E35" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E49\u0E2D\u0E19",
    email: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48\u0E2D\u0E35\u0E40\u0E21\u0E25",
    url: "URL",
    emoji: "\u0E2D\u0E34\u0E42\u0E21\u0E08\u0E34",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
    date: "\u0E27\u0E31\u0E19\u0E17\u0E35\u0E48\u0E41\u0E1A\u0E1A ISO",
    time: "\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
    duration: "\u0E0A\u0E48\u0E27\u0E07\u0E40\u0E27\u0E25\u0E32\u0E41\u0E1A\u0E1A ISO",
    ipv4: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 IPv4",
    ipv6: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 IPv6",
    mac: "\u0E17\u0E35\u0E48\u0E2D\u0E22\u0E39\u0E48 MAC",
    cidrv4: "\u0E0A\u0E48\u0E27\u0E07 IP \u0E41\u0E1A\u0E1A IPv4",
    cidrv6: "\u0E0A\u0E48\u0E27\u0E07 IP \u0E41\u0E1A\u0E1A IPv6",
    base64: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A Base64",
    base64url: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A Base64 \u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A URL",
    json_string: "\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E41\u0E1A\u0E1A JSON",
    e164: "\u0E40\u0E1A\u0E2D\u0E23\u0E4C\u0E42\u0E17\u0E23\u0E28\u0E31\u0E1E\u0E17\u0E4C\u0E23\u0E30\u0E2B\u0E27\u0E48\u0E32\u0E07\u0E1B\u0E23\u0E30\u0E40\u0E17\u0E28 (E.164)",
    credit_card: "\u0E2B\u0E21\u0E32\u0E22\u0E40\u0E25\u0E02\u0E1A\u0E31\u0E15\u0E23\u0E40\u0E04\u0E23\u0E14\u0E34\u0E15",
    iban: "IBAN",
    jwt: "\u0E42\u0E17\u0E40\u0E04\u0E19 JWT",
    template_literal: "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E17\u0E35\u0E48\u0E1B\u0E49\u0E2D\u0E19"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02",
    array: "\u0E2D\u0E32\u0E23\u0E4C\u0E40\u0E23\u0E22\u0E4C (Array)",
    null: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E04\u0E48\u0E32 (null)"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 instanceof ${issue2.expected} \u0E41\u0E15\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A ${received}`;
        }
        return `\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 ${expected} \u0E41\u0E15\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0E04\u0E48\u0E32\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19 ${stringifyPrimitive(issue2.values[0])}`;
        return `\u0E15\u0E31\u0E27\u0E40\u0E25\u0E37\u0E2D\u0E01\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E04\u0E27\u0E23\u0E40\u0E1B\u0E47\u0E19\u0E2B\u0E19\u0E36\u0E48\u0E07\u0E43\u0E19 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "\u0E44\u0E21\u0E48\u0E40\u0E01\u0E34\u0E19" : "\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin ?? "\u0E04\u0E48\u0E32"} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "\u0E23\u0E32\u0E22\u0E01\u0E32\u0E23"}`;
        return `\u0E40\u0E01\u0E34\u0E19\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin ?? "\u0E04\u0E48\u0E32"} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? "\u0E2D\u0E22\u0E48\u0E32\u0E07\u0E19\u0E49\u0E2D\u0E22" : "\u0E21\u0E32\u0E01\u0E01\u0E27\u0E48\u0E32";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u0E19\u0E49\u0E2D\u0E22\u0E01\u0E27\u0E48\u0E32\u0E01\u0E33\u0E2B\u0E19\u0E14: ${issue2.origin} \u0E04\u0E27\u0E23\u0E21\u0E35${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E02\u0E36\u0E49\u0E19\u0E15\u0E49\u0E19\u0E14\u0E49\u0E27\u0E22 "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E25\u0E07\u0E17\u0E49\u0E32\u0E22\u0E14\u0E49\u0E27\u0E22 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21\u0E15\u0E49\u0E2D\u0E07\u0E21\u0E35 "${_issue.includes}" \u0E2D\u0E22\u0E39\u0E48\u0E43\u0E19\u0E02\u0E49\u0E2D\u0E04\u0E27\u0E32\u0E21`;
        if (_issue.format === "regex")
          return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E15\u0E49\u0E2D\u0E07\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14 ${_issue.pattern}`;
        return `\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E15\u0E49\u0E2D\u0E07\u0E40\u0E1B\u0E47\u0E19\u0E08\u0E33\u0E19\u0E27\u0E19\u0E17\u0E35\u0E48\u0E2B\u0E32\u0E23\u0E14\u0E49\u0E27\u0E22 ${issue2.divisor} \u0E44\u0E14\u0E49\u0E25\u0E07\u0E15\u0E31\u0E27`;
      case "unrecognized_keys":
        return `\u0E1E\u0E1A\u0E04\u0E35\u0E22\u0E4C\u0E17\u0E35\u0E48\u0E44\u0E21\u0E48\u0E23\u0E39\u0E49\u0E08\u0E31\u0E01: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u0E04\u0E35\u0E22\u0E4C\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E19 ${issue2.origin}`;
      case "invalid_union":
        return "\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07: \u0E44\u0E21\u0E48\u0E15\u0E23\u0E07\u0E01\u0E31\u0E1A\u0E23\u0E39\u0E1B\u0E41\u0E1A\u0E1A\u0E22\u0E39\u0E40\u0E19\u0E35\u0E22\u0E19\u0E17\u0E35\u0E48\u0E01\u0E33\u0E2B\u0E19\u0E14\u0E44\u0E27\u0E49";
      case "invalid_element":
        return `\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07\u0E43\u0E19 ${issue2.origin}`;
      default:
        return `\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E44\u0E21\u0E48\u0E16\u0E39\u0E01\u0E15\u0E49\u0E2D\u0E07`;
    }
  };
};
function th_default() {
  return {
    localeError: error52()
  };
}

// node_modules/zod/v4/locales/tk.js
var error53 = () => {
  const Sizable = {
    string: { unit: "simwol", verb: "bolmaly" },
    file: { unit: "ba\xFDt", verb: "bolmaly" },
    array: { unit: "elementler", verb: "bolmaly" },
    set: { unit: "elementler", verb: "bolmaly" },
    map: { unit: "elementler", verb: "bolmaly" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "giri\u015F",
    email: "e-po\xE7ta salgysy",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO sene we wagt",
    date: "ISO sene",
    time: "ISO wagt",
    duration: "ISO wagt aralygy",
    ipv4: "IPv4 salgysy",
    ipv6: "IPv6 salgysy",
    mac: "MAC salgysy",
    cidrv4: "IPv4 aralygy",
    cidrv6: "IPv6 aralygy",
    base64: "base64 bilen \u015Fifrlenen setir",
    base64url: "base64url bilen \u015Fifrlenen setir",
    json_string: "JSON setiri",
    e164: "E.164 nomeri",
    credit_card: "kredit kartyny\u0148 nomeri",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u015Fablon"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        return `N\xE4dogry baha: gara\u015Fylan ${expected} \xFDerine ${received} alyndy`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `N\xE4dogry baha: ${stringifyPrimitive(issue2.values[0])} bolmaly`;
        return `N\xE4dogry sa\xFDlaw: a\u015Fakdakylardan biri bolmaly: ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Has uly: gara\u015Fyl\xFDan ${issue2.origin ?? "baha"} ${adj} ${issue2.maximum.toString()} ${sizing.unit ?? "element"}`;
        return `Has uly: gara\u015Fyl\xFDan ${issue2.origin ?? "baha"} ${adj} ${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Has ki\xE7i: gara\u015Fyl\xFDan ${issue2.origin} ${adj} ${issue2.minimum.toString()} ${sizing.unit}`;
        return `Has ki\xE7i: gara\u015Fyl\xFDan ${issue2.origin} ${adj} ${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `N\xE4dogry setir: "${_issue.prefix}" bilen ba\u015Flamaly`;
        if (_issue.format === "ends_with")
          return `N\xE4dogry setir: "${_issue.suffix}" bilen gutarmaly`;
        if (_issue.format === "includes")
          return `N\xE4dogry setir: "${_issue.includes}" saklamaly`;
        if (_issue.format === "regex")
          return `N\xE4dogry setir: ${_issue.pattern} nusga la\xFDyk bolmaly`;
        return `N\xE4dogry ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `N\xE4dogry san: ${issue2.divisor} bilen galyndysyz b\xF6l\xFCnmeli`;
      case "unrecognized_keys":
        return `Tanalma\xFDan a\xE7ar${issue2.keys.length > 1 ? "lar" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} i\xE7inde n\xE4dogry a\xE7ar`;
      case "invalid_union":
        return "N\xE4dogry baha";
      case "invalid_element":
        return `${issue2.origin} i\xE7inde n\xE4dogry baha`;
      default:
        return `N\xE4dogry baha`;
    }
  };
};
function tk_default() {
  return {
    localeError: error53()
  };
}

// node_modules/zod/v4/locales/tr.js
var error54 = () => {
  const Sizable = {
    string: { unit: "karakter", verb: "olmal\u0131" },
    file: { unit: "bayt", verb: "olmal\u0131" },
    array: { unit: "\xF6\u011Fe", verb: "olmal\u0131" },
    set: { unit: "\xF6\u011Fe", verb: "olmal\u0131" },
    map: { unit: "\xF6\u011Fe", verb: "olmal\u0131" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "girdi",
    email: "e-posta adresi",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO tarih ve saat",
    date: "ISO tarih",
    time: "ISO saat",
    duration: "ISO s\xFCre",
    ipv4: "IPv4 adresi",
    ipv6: "IPv6 adresi",
    mac: "MAC adresi",
    cidrv4: "IPv4 aral\u0131\u011F\u0131",
    cidrv6: "IPv6 aral\u0131\u011F\u0131",
    base64: "base64 ile \u015Fifrelenmi\u015F metin",
    base64url: "base64url ile \u015Fifrelenmi\u015F metin",
    json_string: "JSON dizesi",
    e164: "E.164 say\u0131s\u0131",
    credit_card: "kredi kart\u0131 numaras\u0131",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u015Eablon dizesi"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Ge\xE7ersiz de\u011Fer: beklenen instanceof ${issue2.expected}, al\u0131nan ${received}`;
        }
        return `Ge\xE7ersiz de\u011Fer: beklenen ${expected}, al\u0131nan ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Ge\xE7ersiz de\u011Fer: beklenen ${stringifyPrimitive(issue2.values[0])}`;
        return `Ge\xE7ersiz se\xE7enek: a\u015Fa\u011F\u0131dakilerden biri olmal\u0131: ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\xC7ok b\xFCy\xFCk: beklenen ${issue2.origin ?? "de\u011Fer"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\xF6\u011Fe"}`;
        return `\xC7ok b\xFCy\xFCk: beklenen ${issue2.origin ?? "de\u011Fer"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\xC7ok k\xFC\xE7\xFCk: beklenen ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        return `\xC7ok k\xFC\xE7\xFCk: beklenen ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Ge\xE7ersiz metin: "${_issue.prefix}" ile ba\u015Flamal\u0131`;
        if (_issue.format === "ends_with")
          return `Ge\xE7ersiz metin: "${_issue.suffix}" ile bitmeli`;
        if (_issue.format === "includes")
          return `Ge\xE7ersiz metin: "${_issue.includes}" i\xE7ermeli`;
        if (_issue.format === "regex")
          return `Ge\xE7ersiz metin: ${_issue.pattern} desenine uymal\u0131`;
        return `Ge\xE7ersiz ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Ge\xE7ersiz say\u0131: ${issue2.divisor} ile tam b\xF6l\xFCnebilmeli`;
      case "unrecognized_keys":
        return `Tan\u0131nmayan anahtar${issue2.keys.length > 1 ? "lar" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} i\xE7inde ge\xE7ersiz anahtar`;
      case "invalid_union":
        return "Ge\xE7ersiz de\u011Fer";
      case "invalid_element":
        return `${issue2.origin} i\xE7inde ge\xE7ersiz de\u011Fer`;
      default:
        return `Ge\xE7ersiz de\u011Fer`;
    }
  };
};
function tr_default() {
  return {
    localeError: error54()
  };
}

// node_modules/zod/v4/locales/uk.js
var error55 = () => {
  const Sizable = {
    string: { unit: "\u0441\u0438\u043C\u0432\u043E\u043B\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" },
    file: { unit: "\u0431\u0430\u0439\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" },
    array: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" },
    set: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" },
    map: { unit: "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432", verb: "\u043C\u0430\u0442\u0438\u043C\u0435" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456",
    email: "\u0430\u0434\u0440\u0435\u0441\u0430 \u0435\u043B\u0435\u043A\u0442\u0440\u043E\u043D\u043D\u043E\u0457 \u043F\u043E\u0448\u0442\u0438",
    url: "URL",
    emoji: "\u0435\u043C\u043E\u0434\u0437\u0456",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\u0434\u0430\u0442\u0430 \u0442\u0430 \u0447\u0430\u0441 ISO",
    date: "\u0434\u0430\u0442\u0430 ISO",
    time: "\u0447\u0430\u0441 ISO",
    duration: "\u0442\u0440\u0438\u0432\u0430\u043B\u0456\u0441\u0442\u044C ISO",
    ipv4: "\u0430\u0434\u0440\u0435\u0441\u0430 IPv4",
    ipv6: "\u0430\u0434\u0440\u0435\u0441\u0430 IPv6",
    mac: "\u0430\u0434\u0440\u0435\u0441\u0430 MAC",
    cidrv4: "\u0434\u0456\u0430\u043F\u0430\u0437\u043E\u043D IPv4",
    cidrv6: "\u0434\u0456\u0430\u043F\u0430\u0437\u043E\u043D IPv6",
    base64: "\u0440\u044F\u0434\u043E\u043A \u0443 \u043A\u043E\u0434\u0443\u0432\u0430\u043D\u043D\u0456 base64",
    base64url: "\u0440\u044F\u0434\u043E\u043A \u0443 \u043A\u043E\u0434\u0443\u0432\u0430\u043D\u043D\u0456 base64url",
    json_string: "\u0440\u044F\u0434\u043E\u043A JSON",
    e164: "\u043D\u043E\u043C\u0435\u0440 E.164",
    credit_card: "\u043D\u043E\u043C\u0435\u0440 \u043A\u0440\u0435\u0434\u0438\u0442\u043D\u043E\u0457 \u043A\u0430\u0440\u0442\u043A\u0438",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0447\u0438\u0441\u043B\u043E",
    array: "\u043C\u0430\u0441\u0438\u0432"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F instanceof ${issue2.expected}, \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E ${received}`;
        }
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F ${expected}, \u043E\u0442\u0440\u0438\u043C\u0430\u043D\u043E ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F ${stringifyPrimitive(issue2.values[0])}`;
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0430 \u043E\u043F\u0446\u0456\u044F: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F \u043E\u0434\u043D\u0435 \u0437 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0432\u0435\u043B\u0438\u043A\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0435\u043B\u0435\u043C\u0435\u043D\u0442\u0456\u0432"}`;
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u0432\u0435\u043B\u0438\u043A\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin ?? "\u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F"} \u0431\u0443\u0434\u0435 ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u043C\u0430\u043B\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u0417\u0430\u043D\u0430\u0434\u0442\u043E \u043C\u0430\u043B\u0435: \u043E\u0447\u0456\u043A\u0443\u0454\u0442\u044C\u0441\u044F, \u0449\u043E ${issue2.origin} \u0431\u0443\u0434\u0435 ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043F\u043E\u0447\u0438\u043D\u0430\u0442\u0438\u0441\u044F \u0437 "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u0437\u0430\u043A\u0456\u043D\u0447\u0443\u0432\u0430\u0442\u0438\u0441\u044F \u043D\u0430 "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u043C\u0456\u0441\u0442\u0438\u0442\u0438 "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u0440\u044F\u0434\u043E\u043A: \u043F\u043E\u0432\u0438\u043D\u0435\u043D \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0430\u0442\u0438 \u0448\u0430\u0431\u043B\u043E\u043D\u0443 ${_issue.pattern}`;
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0435 \u0447\u0438\u0441\u043B\u043E: \u043F\u043E\u0432\u0438\u043D\u043D\u043E \u0431\u0443\u0442\u0438 \u043A\u0440\u0430\u0442\u043D\u0438\u043C ${issue2.divisor}`;
      case "unrecognized_keys":
        return `\u041D\u0435\u0440\u043E\u0437\u043F\u0456\u0437\u043D\u0430\u043D\u0438\u0439 \u043A\u043B\u044E\u0447${issue2.keys.length > 1 ? "\u0456" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0438\u0439 \u043A\u043B\u044E\u0447 \u0443 ${issue2.origin}`;
      case "invalid_union":
        return "\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456";
      case "invalid_element":
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u043D\u044F \u0443 ${issue2.origin}`;
      default:
        return `\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0456 \u0432\u0445\u0456\u0434\u043D\u0456 \u0434\u0430\u043D\u0456`;
    }
  };
};
function uk_default() {
  return {
    localeError: error55()
  };
}

// node_modules/zod/v4/locales/ua.js
function ua_default() {
  return uk_default();
}

// node_modules/zod/v4/locales/ur.js
var error56 = () => {
  const Sizable = {
    string: { unit: "\u062D\u0631\u0648\u0641", verb: "\u06C1\u0648\u0646\u0627" },
    file: { unit: "\u0628\u0627\u0626\u0679\u0633", verb: "\u06C1\u0648\u0646\u0627" },
    array: { unit: "\u0622\u0626\u0679\u0645\u0632", verb: "\u06C1\u0648\u0646\u0627" },
    set: { unit: "\u0622\u0626\u0679\u0645\u0632", verb: "\u06C1\u0648\u0646\u0627" },
    map: { unit: "\u0622\u0626\u0679\u0645\u0632", verb: "\u06C1\u0648\u0646\u0627" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0627\u0646 \u067E\u0679",
    email: "\u0627\u06CC \u0645\u06CC\u0644 \u0627\u06CC\u0688\u0631\u06CC\u0633",
    url: "\u06CC\u0648 \u0622\u0631 \u0627\u06CC\u0644",
    emoji: "\u0627\u06CC\u0645\u0648\u062C\u06CC",
    uuid: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    uuidv4: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC \u0648\u06CC 4",
    uuidv6: "\u06CC\u0648 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC \u0648\u06CC 6",
    nanoid: "\u0646\u06CC\u0646\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    guid: "\u062C\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    cuid: "\u0633\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    cuid2: "\u0633\u06CC \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC 2",
    ulid: "\u06CC\u0648 \u0627\u06CC\u0644 \u0622\u0626\u06CC \u0688\u06CC",
    xid: "\u0627\u06CC\u06A9\u0633 \u0622\u0626\u06CC \u0688\u06CC",
    ksuid: "\u06A9\u06D2 \u0627\u06CC\u0633 \u06CC\u0648 \u0622\u0626\u06CC \u0688\u06CC",
    datetime: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0688\u06CC\u0679 \u0679\u0627\u0626\u0645",
    date: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u062A\u0627\u0631\u06CC\u062E",
    time: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0648\u0642\u062A",
    duration: "\u0622\u0626\u06CC \u0627\u06CC\u0633 \u0627\u0648 \u0645\u062F\u062A",
    ipv4: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 4 \u0627\u06CC\u0688\u0631\u06CC\u0633",
    ipv6: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 6 \u0627\u06CC\u0688\u0631\u06CC\u0633",
    mac: "\u0627\u06CC\u0645 \u0627\u06D2 \u0633\u06CC \u0627\u06CC\u0688\u0631\u06CC\u0633",
    cidrv4: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 4 \u0631\u06CC\u0646\u062C",
    cidrv6: "\u0622\u0626\u06CC \u067E\u06CC \u0648\u06CC 6 \u0631\u06CC\u0646\u062C",
    base64: "\u0628\u06CC\u0633 64 \u0627\u0646 \u06A9\u0648\u0688\u0688 \u0633\u0679\u0631\u0646\u06AF",
    base64url: "\u0628\u06CC\u0633 64 \u06CC\u0648 \u0622\u0631 \u0627\u06CC\u0644 \u0627\u0646 \u06A9\u0648\u0688\u0688 \u0633\u0679\u0631\u0646\u06AF",
    json_string: "\u062C\u06D2 \u0627\u06CC\u0633 \u0627\u0648 \u0627\u06CC\u0646 \u0633\u0679\u0631\u0646\u06AF",
    e164: "\u0627\u06CC 164 \u0646\u0645\u0628\u0631",
    credit_card: "\u06A9\u0631\u06CC\u0688\u0679 \u06A9\u0627\u0631\u0688 \u0646\u0645\u0628\u0631",
    iban: "IBAN",
    jwt: "\u062C\u06D2 \u0688\u0628\u0644\u06CC\u0648 \u0679\u06CC",
    template_literal: "\u0627\u0646 \u067E\u0679"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u0646\u0645\u0628\u0631",
    array: "\u0622\u0631\u06D2",
    null: "\u0646\u0644"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: instanceof ${issue2.expected} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627\u060C ${received} \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648\u0627`;
        }
        return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: ${expected} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627\u060C ${received} \u0645\u0648\u0635\u0648\u0644 \u06C1\u0648\u0627`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679: ${stringifyPrimitive(issue2.values[0])} \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
        return `\u063A\u0644\u0637 \u0622\u067E\u0634\u0646: ${joinValues(issue2.values, "|")} \u0645\u06CC\u06BA \u0633\u06D2 \u0627\u06CC\u06A9 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u0628\u06C1\u062A \u0628\u0691\u0627: ${issue2.origin ?? "\u0648\u06CC\u0644\u06CC\u0648"} \u06A9\u06D2 ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u0639\u0646\u0627\u0635\u0631"} \u06C1\u0648\u0646\u06D2 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u06D2`;
        return `\u0628\u06C1\u062A \u0628\u0691\u0627: ${issue2.origin ?? "\u0648\u06CC\u0644\u06CC\u0648"} \u06A9\u0627 ${adj}${issue2.maximum.toString()} \u06C1\u0648\u0646\u0627 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u0628\u06C1\u062A \u0686\u06BE\u0648\u0679\u0627: ${issue2.origin} \u06A9\u06D2 ${adj}${issue2.minimum.toString()} ${sizing.unit} \u06C1\u0648\u0646\u06D2 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u06D2`;
        }
        return `\u0628\u06C1\u062A \u0686\u06BE\u0648\u0679\u0627: ${issue2.origin} \u06A9\u0627 ${adj}${issue2.minimum.toString()} \u06C1\u0648\u0646\u0627 \u0645\u062A\u0648\u0642\u0639 \u062A\u06BE\u0627`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.prefix}" \u0633\u06D2 \u0634\u0631\u0648\u0639 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        }
        if (_issue.format === "ends_with")
          return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.suffix}" \u067E\u0631 \u062E\u062A\u0645 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        if (_issue.format === "includes")
          return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: "${_issue.includes}" \u0634\u0627\u0645\u0644 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        if (_issue.format === "regex")
          return `\u063A\u0644\u0637 \u0633\u0679\u0631\u0646\u06AF: \u067E\u06CC\u0679\u0631\u0646 ${_issue.pattern} \u0633\u06D2 \u0645\u06CC\u0686 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
        return `\u063A\u0644\u0637 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u063A\u0644\u0637 \u0646\u0645\u0628\u0631: ${issue2.divisor} \u06A9\u0627 \u0645\u0636\u0627\u0639\u0641 \u06C1\u0648\u0646\u0627 \u0686\u0627\u06C1\u06CC\u06D2`;
      case "unrecognized_keys":
        return `\u063A\u06CC\u0631 \u062A\u0633\u0644\u06CC\u0645 \u0634\u062F\u06C1 \u06A9\u06CC${issue2.keys.length > 1 ? "\u0632" : ""}: ${joinValues(issue2.keys, "\u060C ")}`;
      case "invalid_key":
        return `${issue2.origin} \u0645\u06CC\u06BA \u063A\u0644\u0637 \u06A9\u06CC`;
      case "invalid_union":
        return "\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679";
      case "invalid_element":
        return `${issue2.origin} \u0645\u06CC\u06BA \u063A\u0644\u0637 \u0648\u06CC\u0644\u06CC\u0648`;
      default:
        return `\u063A\u0644\u0637 \u0627\u0646 \u067E\u0679`;
    }
  };
};
function ur_default() {
  return {
    localeError: error56()
  };
}

// node_modules/zod/v4/locales/uz.js
var error57 = () => {
  const Sizable = {
    string: { unit: "belgi", verb: "bo\u2018lishi kerak" },
    file: { unit: "bayt", verb: "bo\u2018lishi kerak" },
    array: { unit: "element", verb: "bo\u2018lishi kerak" },
    set: { unit: "element", verb: "bo\u2018lishi kerak" },
    map: { unit: "yozuv", verb: "bo\u2018lishi kerak" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "kirish",
    email: "elektron pochta manzili",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO sana va vaqti",
    date: "ISO sana",
    time: "ISO vaqt",
    duration: "ISO davomiylik",
    ipv4: "IPv4 manzil",
    ipv6: "IPv6 manzil",
    mac: "MAC manzil",
    cidrv4: "IPv4 diapazon",
    cidrv6: "IPv6 diapazon",
    base64: "base64 kodlangan satr",
    base64url: "base64url kodlangan satr",
    json_string: "JSON satr",
    e164: "E.164 raqam",
    credit_card: "kredit karta raqami",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "kirish"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "raqam",
    array: "massiv"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `Noto\u2018g\u2018ri kirish: kutilgan instanceof ${issue2.expected}, qabul qilingan ${received}`;
        }
        return `Noto\u2018g\u2018ri kirish: kutilgan ${expected}, qabul qilingan ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Noto\u2018g\u2018ri kirish: kutilgan ${stringifyPrimitive(issue2.values[0])}`;
        return `Noto\u2018g\u2018ri variant: quyidagilardan biri kutilgan ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Juda katta: kutilgan ${issue2.origin ?? "qiymat"} ${adj}${issue2.maximum.toString()} ${sizing.unit} ${sizing.verb}`;
        return `Juda katta: kutilgan ${issue2.origin ?? "qiymat"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Juda kichik: kutilgan ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit} ${sizing.verb}`;
        }
        return `Juda kichik: kutilgan ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Noto\u2018g\u2018ri satr: "${_issue.prefix}" bilan boshlanishi kerak`;
        if (_issue.format === "ends_with")
          return `Noto\u2018g\u2018ri satr: "${_issue.suffix}" bilan tugashi kerak`;
        if (_issue.format === "includes")
          return `Noto\u2018g\u2018ri satr: "${_issue.includes}" ni o\u2018z ichiga olishi kerak`;
        if (_issue.format === "regex")
          return `Noto\u2018g\u2018ri satr: ${_issue.pattern} shabloniga mos kelishi kerak`;
        return `Noto\u2018g\u2018ri ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Noto\u2018g\u2018ri raqam: ${issue2.divisor} ning karralisi bo\u2018lishi kerak`;
      case "unrecognized_keys":
        return `Noma\u2019lum kalit${issue2.keys.length > 1 ? "lar" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} dagi kalit noto\u2018g\u2018ri`;
      case "invalid_union":
        return "Noto\u2018g\u2018ri kirish";
      case "invalid_element":
        return `${issue2.origin} da noto\u2018g\u2018ri qiymat`;
      default:
        return `Noto\u2018g\u2018ri kirish`;
    }
  };
};
function uz_default() {
  return {
    localeError: error57()
  };
}

// node_modules/zod/v4/locales/vi.js
var error58 = () => {
  const Sizable = {
    string: { unit: "k\xFD t\u1EF1", verb: "c\xF3" },
    file: { unit: "byte", verb: "c\xF3" },
    array: { unit: "ph\u1EA7n t\u1EED", verb: "c\xF3" },
    set: { unit: "ph\u1EA7n t\u1EED", verb: "c\xF3" },
    map: { unit: "ph\u1EA7n t\u1EED", verb: "c\xF3" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u0111\u1EA7u v\xE0o",
    email: "\u0111\u1ECBa ch\u1EC9 email",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ng\xE0y gi\u1EDD ISO",
    date: "ng\xE0y ISO",
    time: "gi\u1EDD ISO",
    duration: "kho\u1EA3ng th\u1EDDi gian ISO",
    ipv4: "\u0111\u1ECBa ch\u1EC9 IPv4",
    ipv6: "\u0111\u1ECBa ch\u1EC9 IPv6",
    mac: "\u0111\u1ECBa ch\u1EC9 MAC",
    cidrv4: "d\u1EA3i IPv4",
    cidrv6: "d\u1EA3i IPv6",
    base64: "chu\u1ED7i m\xE3 h\xF3a base64",
    base64url: "chu\u1ED7i m\xE3 h\xF3a base64url",
    json_string: "chu\u1ED7i JSON",
    e164: "s\u1ED1 E.164",
    credit_card: "s\u1ED1 th\u1EBB t\xEDn d\u1EE5ng",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u0111\u1EA7u v\xE0o"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "s\u1ED1",
    array: "m\u1EA3ng"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i instanceof ${issue2.expected}, nh\u1EADn \u0111\u01B0\u1EE3c ${received}`;
        }
        return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i ${expected}, nh\u1EADn \u0111\u01B0\u1EE3c ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i ${stringifyPrimitive(issue2.values[0])}`;
        return `T\xF9y ch\u1ECDn kh\xF4ng h\u1EE3p l\u1EC7: mong \u0111\u1EE3i m\u1ED9t trong c\xE1c gi\xE1 tr\u1ECB ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Qu\xE1 l\u1EDBn: mong \u0111\u1EE3i ${issue2.origin ?? "gi\xE1 tr\u1ECB"} ${sizing.verb} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "ph\u1EA7n t\u1EED"}`;
        return `Qu\xE1 l\u1EDBn: mong \u0111\u1EE3i ${issue2.origin ?? "gi\xE1 tr\u1ECB"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Qu\xE1 nh\u1ECF: mong \u0111\u1EE3i ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Qu\xE1 nh\u1ECF: mong \u0111\u1EE3i ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i b\u1EAFt \u0111\u1EA7u b\u1EB1ng "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i k\u1EBFt th\xFAc b\u1EB1ng "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i bao g\u1ED3m "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Chu\u1ED7i kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i kh\u1EDBp v\u1EDBi m\u1EABu ${_issue.pattern}`;
        return `${FormatDictionary[_issue.format] ?? issue2.format} kh\xF4ng h\u1EE3p l\u1EC7`;
      }
      case "not_multiple_of":
        return `S\u1ED1 kh\xF4ng h\u1EE3p l\u1EC7: ph\u1EA3i l\xE0 b\u1ED9i s\u1ED1 c\u1EE7a ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Kh\xF3a kh\xF4ng \u0111\u01B0\u1EE3c nh\u1EADn d\u1EA1ng: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Kh\xF3a kh\xF4ng h\u1EE3p l\u1EC7 trong ${issue2.origin}`;
      case "invalid_union":
        return "\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7";
      case "invalid_element":
        return `Gi\xE1 tr\u1ECB kh\xF4ng h\u1EE3p l\u1EC7 trong ${issue2.origin}`;
      default:
        return `\u0110\u1EA7u v\xE0o kh\xF4ng h\u1EE3p l\u1EC7`;
    }
  };
};
function vi_default() {
  return {
    localeError: error58()
  };
}

// node_modules/zod/v4/locales/zh-CN.js
var error59 = () => {
  const Sizable = {
    string: { unit: "\u5B57\u7B26", verb: "\u5305\u542B" },
    file: { unit: "\u5B57\u8282", verb: "\u5305\u542B" },
    array: { unit: "\u9879", verb: "\u5305\u542B" },
    set: { unit: "\u9879", verb: "\u5305\u542B" },
    map: { unit: "\u9879", verb: "\u5305\u542B" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u8F93\u5165",
    email: "\u7535\u5B50\u90AE\u4EF6",
    url: "URL",
    emoji: "\u8868\u60C5\u7B26\u53F7",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO\u65E5\u671F\u65F6\u95F4",
    date: "ISO\u65E5\u671F",
    time: "ISO\u65F6\u95F4",
    duration: "ISO\u65F6\u957F",
    ipv4: "IPv4\u5730\u5740",
    ipv6: "IPv6\u5730\u5740",
    mac: "MAC\u5730\u5740",
    cidrv4: "IPv4\u7F51\u6BB5",
    cidrv6: "IPv6\u7F51\u6BB5",
    base64: "base64\u7F16\u7801\u5B57\u7B26\u4E32",
    base64url: "base64url\u7F16\u7801\u5B57\u7B26\u4E32",
    json_string: "JSON\u5B57\u7B26\u4E32",
    e164: "E.164\u53F7\u7801",
    credit_card: "\u4FE1\u7528\u5361\u53F7",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u8F93\u5165"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "\u6570\u5B57",
    array: "\u6570\u7EC4",
    null: "\u7A7A\u503C(null)"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B instanceof ${issue2.expected}\uFF0C\u5B9E\u9645\u63A5\u6536 ${received}`;
        }
        return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B ${expected}\uFF0C\u5B9E\u9645\u63A5\u6536 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u65E0\u6548\u8F93\u5165\uFF1A\u671F\u671B ${stringifyPrimitive(issue2.values[0])}`;
        return `\u65E0\u6548\u9009\u9879\uFF1A\u671F\u671B\u4EE5\u4E0B\u4E4B\u4E00 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u6570\u503C\u8FC7\u5927\uFF1A\u671F\u671B ${issue2.origin ?? "\u503C"} ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u4E2A\u5143\u7D20"}`;
        return `\u6570\u503C\u8FC7\u5927\uFF1A\u671F\u671B ${issue2.origin ?? "\u503C"} ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u6570\u503C\u8FC7\u5C0F\uFF1A\u671F\u671B ${issue2.origin} ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u6570\u503C\u8FC7\u5C0F\uFF1A\u671F\u671B ${issue2.origin} ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u4EE5 "${_issue.prefix}" \u5F00\u5934`;
        if (_issue.format === "ends_with")
          return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u4EE5 "${_issue.suffix}" \u7ED3\u5C3E`;
        if (_issue.format === "includes")
          return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u5305\u542B "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u65E0\u6548\u5B57\u7B26\u4E32\uFF1A\u5FC5\u987B\u6EE1\u8DB3\u6B63\u5219\u8868\u8FBE\u5F0F ${_issue.pattern}`;
        return `\u65E0\u6548${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u65E0\u6548\u6570\u5B57\uFF1A\u5FC5\u987B\u662F ${issue2.divisor} \u7684\u500D\u6570`;
      case "unrecognized_keys":
        return `\u51FA\u73B0\u672A\u77E5\u7684\u952E(key): ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `${issue2.origin} \u4E2D\u7684\u952E(key)\u65E0\u6548`;
      case "invalid_union":
        return "\u65E0\u6548\u8F93\u5165";
      case "invalid_element":
        return `${issue2.origin} \u4E2D\u5305\u542B\u65E0\u6548\u503C(value)`;
      default:
        return `\u65E0\u6548\u8F93\u5165`;
    }
  };
};
function zh_CN_default() {
  return {
    localeError: error59()
  };
}

// node_modules/zod/v4/locales/zh-TW.js
var error60 = () => {
  const Sizable = {
    string: { unit: "\u5B57\u5143", verb: "\u64C1\u6709" },
    file: { unit: "\u4F4D\u5143\u7D44", verb: "\u64C1\u6709" },
    array: { unit: "\u9805\u76EE", verb: "\u64C1\u6709" },
    set: { unit: "\u9805\u76EE", verb: "\u64C1\u6709" },
    map: { unit: "\u9805\u76EE", verb: "\u64C1\u6709" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u8F38\u5165",
    email: "\u90F5\u4EF6\u5730\u5740",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO \u65E5\u671F\u6642\u9593",
    date: "ISO \u65E5\u671F",
    time: "ISO \u6642\u9593",
    duration: "ISO \u671F\u9593",
    ipv4: "IPv4 \u4F4D\u5740",
    ipv6: "IPv6 \u4F4D\u5740",
    mac: "MAC \u4F4D\u5740",
    cidrv4: "IPv4 \u7BC4\u570D",
    cidrv6: "IPv6 \u7BC4\u570D",
    base64: "base64 \u7DE8\u78BC\u5B57\u4E32",
    base64url: "base64url \u7DE8\u78BC\u5B57\u4E32",
    json_string: "JSON \u5B57\u4E32",
    e164: "E.164 \u6578\u503C",
    credit_card: "\u4FE1\u7528\u5361\u865F",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u8F38\u5165"
  };
  const TypeDictionary = {
    nan: "NaN"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA instanceof ${issue2.expected}\uFF0C\u4F46\u6536\u5230 ${received}`;
        }
        return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA ${expected}\uFF0C\u4F46\u6536\u5230 ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\u7121\u6548\u7684\u8F38\u5165\u503C\uFF1A\u9810\u671F\u70BA ${stringifyPrimitive(issue2.values[0])}`;
        return `\u7121\u6548\u7684\u9078\u9805\uFF1A\u9810\u671F\u70BA\u4EE5\u4E0B\u5176\u4E2D\u4E4B\u4E00 ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `\u6578\u503C\u904E\u5927\uFF1A\u9810\u671F ${issue2.origin ?? "\u503C"} \u61C9\u70BA ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "\u500B\u5143\u7D20"}`;
        return `\u6578\u503C\u904E\u5927\uFF1A\u9810\u671F ${issue2.origin ?? "\u503C"} \u61C9\u70BA ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `\u6578\u503C\u904E\u5C0F\uFF1A\u9810\u671F ${issue2.origin} \u61C9\u70BA ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `\u6578\u503C\u904E\u5C0F\uFF1A\u9810\u671F ${issue2.origin} \u61C9\u70BA ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u4EE5 "${_issue.prefix}" \u958B\u982D`;
        }
        if (_issue.format === "ends_with")
          return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u4EE5 "${_issue.suffix}" \u7D50\u5C3E`;
        if (_issue.format === "includes")
          return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u5305\u542B "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u7121\u6548\u7684\u5B57\u4E32\uFF1A\u5FC5\u9808\u7B26\u5408\u683C\u5F0F ${_issue.pattern}`;
        return `\u7121\u6548\u7684 ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `\u7121\u6548\u7684\u6578\u5B57\uFF1A\u5FC5\u9808\u70BA ${issue2.divisor} \u7684\u500D\u6578`;
      case "unrecognized_keys":
        return `\u7121\u6CD5\u8B58\u5225\u7684\u9375\u503C${issue2.keys.length > 1 ? "\u5011" : ""}\uFF1A${joinValues(issue2.keys, "\u3001")}`;
      case "invalid_key":
        return `${issue2.origin} \u4E2D\u6709\u7121\u6548\u7684\u9375\u503C`;
      case "invalid_union":
        return "\u7121\u6548\u7684\u8F38\u5165\u503C";
      case "invalid_element":
        return `${issue2.origin} \u4E2D\u6709\u7121\u6548\u7684\u503C`;
      default:
        return `\u7121\u6548\u7684\u8F38\u5165\u503C`;
    }
  };
};
function zh_TW_default() {
  return {
    localeError: error60()
  };
}

// node_modules/zod/v4/locales/yo.js
var error61 = () => {
  const Sizable = {
    string: { unit: "\xE0mi", verb: "n\xED" },
    file: { unit: "bytes", verb: "n\xED" },
    array: { unit: "nkan", verb: "n\xED" },
    set: { unit: "nkan", verb: "n\xED" },
    map: { unit: "nkan", verb: "n\xED" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "\u1EB9\u0300r\u1ECD \xECb\xE1w\u1ECDl\xE9",
    email: "\xE0d\xEDr\u1EB9\u0301s\xEC \xECm\u1EB9\u0301l\xEC",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "\xE0k\xF3k\xF2 ISO",
    date: "\u1ECDj\u1ECD\u0301 ISO",
    time: "\xE0k\xF3k\xF2 ISO",
    duration: "\xE0k\xF3k\xF2 t\xF3 p\xE9 ISO",
    ipv4: "\xE0d\xEDr\u1EB9\u0301s\xEC IPv4",
    ipv6: "\xE0d\xEDr\u1EB9\u0301s\xEC IPv6",
    mac: "\xE0d\xEDr\u1EB9\u0301s\xEC MAC",
    cidrv4: "\xE0gb\xE8gb\xE8 IPv4",
    cidrv6: "\xE0gb\xE8gb\xE8 IPv6",
    base64: "\u1ECD\u0300r\u1ECD\u0300 t\xED a k\u1ECD\u0301 n\xED base64",
    base64url: "\u1ECD\u0300r\u1ECD\u0300 base64url",
    json_string: "\u1ECD\u0300r\u1ECD\u0300 JSON",
    e164: "n\u1ECD\u0301mb\xE0 E.164",
    credit_card: "n\u1ECDmba kaadi gbese",
    iban: "IBAN",
    jwt: "JWT",
    template_literal: "\u1EB9\u0300r\u1ECD \xECb\xE1w\u1ECDl\xE9"
  };
  const TypeDictionary = {
    nan: "NaN",
    number: "n\u1ECD\u0301mb\xE0",
    array: "akop\u1ECD"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        if (/^[A-Z]/.test(issue2.expected)) {
          return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi instanceof ${issue2.expected}, \xE0m\u1ECD\u0300 a r\xED ${received}`;
        }
        return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi ${expected}, \xE0m\u1ECD\u0300 a r\xED ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e: a n\xED l\xE1ti fi ${stringifyPrimitive(issue2.values[0])}`;
        return `\xC0\u1E63\xE0y\xE0n a\u1E63\xEC\u1E63e: yan \u1ECD\u0300kan l\xE1ra ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `T\xF3 p\u1ECD\u0300 j\xF9: a n\xED l\xE1ti j\u1EB9\u0301 p\xE9 ${issue2.origin ?? "iye"} ${sizing.verb} ${adj}${issue2.maximum} ${sizing.unit}`;
        return `T\xF3 p\u1ECD\u0300 j\xF9: a n\xED l\xE1ti j\u1EB9\u0301 ${adj}${issue2.maximum}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `K\xE9r\xE9 ju: a n\xED l\xE1ti j\u1EB9\u0301 p\xE9 ${issue2.origin} ${sizing.verb} ${adj}${issue2.minimum} ${sizing.unit}`;
        return `K\xE9r\xE9 ju: a n\xED l\xE1ti j\u1EB9\u0301 ${adj}${issue2.minimum}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with")
          return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 b\u1EB9\u0300r\u1EB9\u0300 p\u1EB9\u0300l\xFA "${_issue.prefix}"`;
        if (_issue.format === "ends_with")
          return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 par\xED p\u1EB9\u0300l\xFA "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 n\xED "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `\u1ECC\u0300r\u1ECD\u0300 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 b\xE1 \xE0p\u1EB9\u1EB9r\u1EB9 mu ${_issue.pattern}`;
        return `A\u1E63\xEC\u1E63e: ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `N\u1ECD\u0301mb\xE0 a\u1E63\xEC\u1E63e: gb\u1ECD\u0301d\u1ECD\u0300 j\u1EB9\u0301 \xE8y\xE0 p\xEDp\xEDn ti ${issue2.divisor}`;
      case "unrecognized_keys":
        return `B\u1ECDt\xECn\xEC \xE0\xECm\u1ECD\u0300: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `B\u1ECDt\xECn\xEC a\u1E63\xEC\u1E63e n\xEDn\xFA ${issue2.origin}`;
      case "invalid_union":
        return "\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e";
      case "invalid_element":
        return `Iye a\u1E63\xEC\u1E63e n\xEDn\xFA ${issue2.origin}`;
      default:
        return "\xCCb\xE1w\u1ECDl\xE9 a\u1E63\xEC\u1E63e";
    }
  };
};
function yo_default() {
  return {
    localeError: error61()
  };
}

// node_modules/zod/v4/core/registries.js
var _a2;
var $output = /* @__PURE__ */ Symbol("ZodOutput");
var $input = /* @__PURE__ */ Symbol("ZodInput");
var $ZodRegistry = class {
  constructor() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema, ..._meta) {
    const meta3 = _meta[0];
    this._map.set(schema, meta3);
    if (meta3 && typeof meta3 === "object" && "id" in meta3) {
      this._idmap.set(meta3.id, schema);
    }
    return this;
  }
  clear() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
    return this;
  }
  remove(schema) {
    const meta3 = this._map.get(schema);
    if (meta3 && typeof meta3 === "object" && "id" in meta3) {
      this._idmap.delete(meta3.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : void 0;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
};
function registry() {
  return new $ZodRegistry();
}
(_a2 = globalThis).__zod_globalRegistry ?? (_a2.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;

// node_modules/zod/v4/core/compile.js
var INVALID = Symbol.for("zod.compile.invalid");
var FALLBACK_FLAG = Symbol.for("zod.compile.fallback");
var ZodCompileAsyncError = class extends Error {
  constructor(message = "z.compile does not support async refinements, transforms, or checks") {
    super(message);
    this.name = "ZodCompileAsyncError";
  }
};
var ZodCompileUnsupportedError = class extends Error {
  constructor(feature, islandable = true) {
    super(`z.compile does not support ${feature}; this schema must use the runtime parser`);
    this.name = "ZodCompileUnsupportedError";
    this.islandable = islandable;
  }
};
function compileValidator(schema, parser) {
  try {
    return compileFn(schema, { assertOnly: true });
  } catch {
    return parser;
  }
}
function compile(schema, options) {
  try {
    const parser = compileFn(schema);
    const clone2 = withParser(schema, parser);
    clone2._zod.bag.validator = compileValidator(schema, parser);
    return clone2;
  } catch (err) {
    if (options?.strict)
      throw err;
    return schema;
  }
}
function withParser(schema, parser) {
  if (isRecursiveSchema(schema)) {
    throw new ZodCompileUnsupportedError("a schema whose subtree contains a reference cycle");
  }
  const clone2 = clone(schema);
  const liveRun = schema._zod.run;
  const originalRun = liveRun.__originalRun ?? liveRun;
  const wrapped = (payload, ctx) => {
    if (ctx?.async || ctx?.direction === "backward" || ctx?.skipChecks || ctx?.[FALLBACK_FLAG]) {
      return originalRun(payload, ctx);
    }
    if (ctx && isBackEdge(ctx, payload.value)) {
      return originalRun(payload, ctx);
    }
    const out = parser(payload.value);
    if (out !== INVALID) {
      payload.value = out;
      return payload;
    }
    if (ctx)
      ctx[FALLBACK_FLAG] = true;
    return originalRun(payload, ctx);
  };
  wrapped.__originalRun = originalRun;
  clone2._zod.bag.fallbackRun = originalRun;
  clone2._zod.bag.validator = parser;
  clone2._zod.run = wrapped;
  if (!liveRun.__originalRun)
    installCompiledUserMethods(clone2, schema, parser);
  return clone2;
}
function installCompiledUserMethods(target, source, parser) {
  const targetAny = target;
  const sourceAny = source;
  if (typeof sourceAny.safeParse === "function") {
    const originalSafeParse = sourceAny.safeParse;
    targetAny.safeParse = (data, params) => {
      const out = parser(data);
      if (out !== INVALID) {
        return { success: true, data: out };
      }
      return originalSafeParse(data, params);
    };
  }
  if (typeof sourceAny.parse === "function") {
    const originalParse = sourceAny.parse;
    targetAny.parse = (data, params) => {
      const out = parser(data);
      if (out !== INVALID) {
        return out;
      }
      return originalParse(data, params);
    };
  }
}
function compileFn(schema, options) {
  let recursive2 = true;
  try {
    recursive2 = isRecursiveSchema(schema);
  } catch {
  }
  if (recursive2) {
    throw new ZodCompileUnsupportedError("a schema whose subtree contains a reference cycle");
  }
  const ctx = {
    constants: /* @__PURE__ */ new Map(),
    constantCounter: 0,
    varCounter: 0,
    definite: true
  };
  const doc = new Doc(["input"]);
  const outputAccessor = generateCheck(doc, ctx, schema, "input", !options?.assertOnly);
  doc.write(outputAccessor === null ? `return true;` : `return ${outputAccessor};`);
  const constantNames = ["INVALID", ...ctx.constants.keys()];
  const constantValues = [INVALID, ...ctx.constants.values()];
  const code = doc.content.join("\n");
  const fullCode = options?.debug ? constantNames.length > 0 ? `// Constants: ${constantNames.join(", ")}
${code}` : code : "";
  const F = Function;
  const factoryCode = `return (input) => {
${code}
}`;
  let fn;
  try {
    const factory = new F(...constantNames, factoryCode);
    fn = factory(...constantValues);
  } catch (err) {
    throw new ZodCompileUnsupportedError(`this schema (generated code failed to evaluate: ${err.message})`);
  }
  if (options?.debug) {
    fn.code = fullCode;
  }
  fn.definite = ctx.definite;
  return fn;
}
function addConstant(ctx, value) {
  for (const [name2, v] of ctx.constants) {
    if (v === value)
      return name2;
  }
  const name = `c${ctx.constantCounter++}`;
  ctx.constants.set(name, value);
  return name;
}
function addUserConstant(ctx, fn) {
  ctx.definite = false;
  return addConstant(ctx, fn);
}
function newVar(ctx) {
  return `v${ctx.varCounter++}`;
}
function runtimeRun(schema, value) {
  const result = schema._zod.run({ value, issues: [] }, {});
  if (result && typeof result.then === "function")
    return INVALID;
  const r = result;
  return r.issues.length === 0 ? r.value : INVALID;
}
function compileChild(doc, ctx, schema, accessor, needsValue = true) {
  const contentLen = doc.content.length;
  const constantCount = ctx.constants.size;
  const constantCounter = ctx.constantCounter;
  const varCounter = ctx.varCounter;
  try {
    return generateCheck(doc, ctx, schema, accessor, needsValue);
  } catch (err) {
    if (!(err instanceof ZodCompileUnsupportedError) || !err.islandable)
      throw err;
    doc.content.length = contentLen;
    if (ctx.constants.size > constantCount) {
      const trailing = Array.from(ctx.constants.keys()).slice(constantCount);
      for (const k of trailing)
        ctx.constants.delete(k);
    }
    ctx.constantCounter = constantCounter;
    ctx.varCounter = varCounter;
    return emitRuntimeIsland(doc, ctx, schema, accessor);
  }
}
function emitRuntimeIsland(doc, ctx, schema, accessor) {
  ctx.definite = false;
  const schemaConst = addConstant(ctx, schema);
  const runConst = addConstant(ctx, runtimeRun);
  const outVar = newVar(ctx);
  doc.write(`const ${outVar} = ${runConst}(${schemaConst}, ${accessor});`);
  doc.write(`if (${outVar} === INVALID) return INVALID;`);
  return outVar;
}
var WHEN_DEFAULTED_CHECKS = /* @__PURE__ */ new Set([
  "max_size",
  "min_size",
  "size_equals",
  "max_length",
  "min_length",
  "length_equals"
]);
function generateChecks(doc, ctx, schema, accessor) {
  const schemaChecks = schema._zod.def.checks;
  if (!schemaChecks || schemaChecks.length === 0)
    return accessor;
  let currentAccessor = accessor;
  for (const check2 of schemaChecks) {
    const def = check2._zod.def;
    if (def.when && !WHEN_DEFAULTED_CHECKS.has(def.check)) {
      throw new ZodCompileUnsupportedError(`check with a custom "when" condition`);
    }
    switch (def.check) {
      case "greater_than":
        generateGreaterThanCheck(doc, ctx, def, currentAccessor);
        break;
      case "less_than":
        generateLessThanCheck(doc, ctx, def, currentAccessor);
        break;
      case "multiple_of":
        generateMultipleOfCheck(doc, ctx, def, currentAccessor);
        break;
      case "number_format":
        generateNumberFormatCheck(doc, def, currentAccessor);
        break;
      case "min_length": {
        const min = numericOperand(def.minimum, "min_length");
        const len = codePointLengthVar(doc, ctx, currentAccessor, `${currentAccessor}.length >= ${min} && ${currentAccessor}.length < ${def.minimum * 2}`);
        doc.write(`if (${len} < ${min}) return INVALID;`);
        break;
      }
      case "max_length": {
        const max = numericOperand(def.maximum, "max_length");
        const len = codePointLengthVar(doc, ctx, currentAccessor, `${currentAccessor}.length > ${max}`);
        doc.write(`if (${len} > ${max}) return INVALID;`);
        break;
      }
      case "length_equals": {
        const exact = numericOperand(def.length, "length_equals");
        const len = codePointLengthVar(doc, ctx, currentAccessor, `${currentAccessor}.length >= ${exact} && ${currentAccessor}.length <= ${def.length * 2}`);
        doc.write(`if (${len} !== ${exact}) return INVALID;`);
        break;
      }
      case "min_size":
        doc.write(`if (${currentAccessor}.size < ${numericOperand(def.minimum, "min_size")}) return INVALID;`);
        break;
      case "max_size":
        doc.write(`if (${currentAccessor}.size > ${numericOperand(def.maximum, "max_size")}) return INVALID;`);
        break;
      case "size_equals":
        doc.write(`if (${currentAccessor}.size !== ${numericOperand(def.size, "size_equals")}) return INVALID;`);
        break;
      case "string_format":
        currentAccessor = generateStringFormatCheck(doc, ctx, def, currentAccessor);
        break;
      case "custom":
        currentAccessor = generateCustomRefineCheck(doc, ctx, check2, currentAccessor);
        break;
      case "bigint_format":
        generateBigIntFormatCheck(doc, def, currentAccessor);
        break;
      case "mime_type":
        generateMimeTypeCheck(doc, ctx, def, currentAccessor);
        break;
      case "property":
        generatePropertyCheck(doc, ctx, def, currentAccessor);
        break;
      case "properties":
        generatePropertiesChecks(doc, ctx, def, currentAccessor, false);
        break;
      case "overwrite": {
        const newAccessor = newVar(ctx);
        generateOverwriteCheck(doc, ctx, check2, currentAccessor, newAccessor);
        currentAccessor = newAccessor;
        break;
      }
      default: {
        void def;
        throw new ZodCompileUnsupportedError(`check type ${def.check}`);
      }
    }
  }
  return currentAccessor;
}
function codePointLengthVar(doc, ctx, accessor, inDoubt) {
  const cpLen = addConstant(ctx, codePointLength);
  const v = newVar(ctx);
  doc.write(`const ${v} = typeof ${accessor} === "string" && ${inDoubt} ? ${cpLen}(${accessor}) : ${accessor}.length;`);
  return v;
}
function numericOperand(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ZodCompileUnsupportedError(`${label} bound of type ${typeof value}`);
  }
  return `${value}`;
}
function comparisonOperand(ctx, value) {
  if (typeof value === "bigint")
    return `${value}n`;
  if (typeof value === "number") {
    if (Number.isNaN(value))
      throw new ZodCompileUnsupportedError("comparison check with NaN bound");
    return `${value}`;
  }
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new ZodCompileUnsupportedError("comparison check with Invalid Date bound");
    }
    return addConstant(ctx, value);
  }
  throw new ZodCompileUnsupportedError(`comparison check bound of type ${typeof value}`);
}
function generateGreaterThanCheck(doc, ctx, def, accessor) {
  const op = def.inclusive ? "<" : "<=";
  doc.write(`if (${accessor} ${op} ${comparisonOperand(ctx, def.value)}) return INVALID;`);
}
function generateLessThanCheck(doc, ctx, def, accessor) {
  const op = def.inclusive ? ">" : ">=";
  doc.write(`if (${accessor} ${op} ${comparisonOperand(ctx, def.value)}) return INVALID;`);
}
function generateMultipleOfCheck(doc, ctx, def, accessor) {
  if (typeof def.value === "bigint") {
    if (def.value === BigInt(0))
      throw new ZodCompileUnsupportedError("multiple_of check with a zero divisor");
    doc.write(`if (${accessor} % ${def.value}n !== 0n) return INVALID;`);
  } else {
    const remainder = addConstant(ctx, floatSafeRemainder);
    doc.write(`if (${remainder}(${accessor}, ${numericOperand(def.value, "multiple_of")}) !== 0) return INVALID;`);
  }
}
function generateNumberFormatCheck(doc, def, accessor) {
  const format = def.format;
  switch (format) {
    case "safeint":
      doc.write(`if (!Number.isSafeInteger(${accessor})) return INVALID;`);
      break;
    case "int32":
      doc.write(`if (!Number.isInteger(${accessor}) || ${accessor} < -2147483648 || ${accessor} > 2147483647) return INVALID;`);
      break;
    case "uint32":
      doc.write(`if (!Number.isInteger(${accessor}) || ${accessor} < 0 || ${accessor} > 4294967295) return INVALID;`);
      break;
    case "float32":
      doc.write(`if (!Number.isFinite(${accessor}) || ${accessor} < -3.4028234663852886e38 || ${accessor} > 3.4028234663852886e38) return INVALID;`);
      break;
    case "float64":
      doc.write(`if (!Number.isFinite(${accessor})) return INVALID;`);
      break;
    default: {
      void format;
      throw new ZodCompileUnsupportedError(`number format ${format}`);
    }
  }
}
function generateBigIntFormatCheck(doc, def, accessor) {
  const format = def.format;
  if (!format)
    return;
  switch (format) {
    case "int64":
      doc.write(`if (${accessor} < -9223372036854775808n || ${accessor} > 9223372036854775807n) return INVALID;`);
      break;
    case "uint64":
      doc.write(`if (${accessor} < 0n || ${accessor} > 18446744073709551615n) return INVALID;`);
      break;
    default: {
      void format;
      throw new ZodCompileUnsupportedError(`bigint format ${format}`);
    }
  }
}
function generateMimeTypeCheck(doc, ctx, def, accessor) {
  const mimeTypes = def.mime;
  if (mimeTypes && mimeTypes.length > 0) {
    const mimeSet = addConstant(ctx, new Set(mimeTypes));
    doc.write(`if (!${mimeSet}.has(${accessor}.type)) return INVALID;`);
  }
}
function generatePropertiesChecks(doc, ctx, def, accessor, schemaRole) {
  if (def.when) {
    throw new ZodCompileUnsupportedError(`check with a custom "when" condition`);
  }
  doc.write(schemaRole ? `if (${accessor} === null || (typeof ${accessor} !== "object" && typeof ${accessor} !== "function")) return INVALID;` : `if (${accessor} == null) return INVALID;`);
  const shape = def.shape;
  for (const key of Reflect.ownKeys(shape)) {
    const keyExpr = typeof key === "symbol" ? addConstant(ctx, key) : esc(key);
    const inputVar = newVar(ctx);
    doc.write(`const ${inputVar} = ${accessor}[${keyExpr}];`);
    compileChild(doc, ctx, shape[key], inputVar, false);
  }
}
function generatePropertyCheck(doc, ctx, def, accessor) {
  const propAccessor = `${accessor}[${JSON.stringify(def.property)}]`;
  generateCheck(doc, ctx, def.schema, propAccessor);
}
function generateOverwriteCheck(doc, ctx, check2, currentAccessor, newAccessor) {
  const tx = check2._zod.def.tx;
  if (!tx) {
    throw new ZodCompileUnsupportedError("overwrite check without a transform function");
  }
  if (isAsyncFunction(tx)) {
    throw new ZodCompileAsyncError("z.compile: async overwrite transforms are not supported");
  }
  const txConst = addConstant(ctx, tx);
  doc.write(`const ${newAccessor} = ${txConst}(${currentAccessor});`);
}
function throwAsync() {
  throw new $ZodAsyncError();
}
function pushIssue(issue2) {
  this.issues.push(issue2);
}
function generateCustomRefineCheck(doc, ctx, check2, accessor) {
  const def = check2._zod.def;
  if (def.fn) {
    if (isAsyncFunction(def.fn)) {
      throw new ZodCompileAsyncError("z.compile: async .refine() predicates are not supported");
    }
    const fnConst = addUserConstant(ctx, def.fn);
    const throwAsyncConst = addConstant(ctx, throwAsync);
    const resVar = newVar(ctx);
    doc.write(`const ${resVar} = ${fnConst}(${accessor});`);
    doc.write(`if (${resVar} instanceof Promise) ${throwAsyncConst}();`);
    doc.write(`if (!${resVar}) return INVALID;`);
    return accessor;
  }
  if (check2._zod.check) {
    if (isAsyncFunction(check2._zod.check)) {
      throw new ZodCompileAsyncError("z.compile: async .superRefine() / check functions are not supported");
    }
    const checkFn = check2._zod.check;
    const helperFn = (value) => {
      const fakePayload = { value, issues: [], addIssue: pushIssue };
      const result = checkFn(fakePayload);
      if (result instanceof Promise)
        throwAsync();
      return fakePayload.issues.length === 0 ? fakePayload.value : INVALID;
    };
    const helperConst = addUserConstant(ctx, helperFn);
    const outVar = newVar(ctx);
    doc.write(`const ${outVar} = ${helperConst}(${accessor});`);
    doc.write(`if (${outVar} === INVALID) return INVALID;`);
    return outVar;
  }
  throw new ZodCompileUnsupportedError("custom check without a predicate or check function");
}
var PATTERN_IS_COMPLETE = /* @__PURE__ */ new Set([
  "cidrv4",
  "cuid",
  "cuid2",
  "date",
  "datetime",
  "duration",
  "e164",
  "email",
  "emoji",
  "ends_with",
  "guid",
  "includes",
  "ipv4",
  "ksuid",
  "lowercase",
  "mac",
  "nanoid",
  "regex",
  "starts_with",
  "time",
  "ulid",
  "uppercase",
  "uuid",
  "xid"
]);
function generateStringFormatCheck(doc, ctx, def, accessor) {
  const fmt = def.format;
  if (fmt === "base64") {
    const validator = addConstant(ctx, isValidBase64);
    doc.write(`if (!${validator}(${accessor})) return INVALID;`);
    return accessor;
  }
  if (fmt === "base64url") {
    const validator = addConstant(ctx, isValidBase64URL);
    doc.write(`if (!${validator}(${accessor})) return INVALID;`);
    return accessor;
  }
  if (fmt === "jwt") {
    const validator = addConstant(ctx, isValidJWT);
    const alg = addConstant(ctx, def.alg ?? null);
    doc.write(`if (!${validator}(${accessor}, ${alg})) return INVALID;`);
    return accessor;
  }
  if (fmt === "ipv6") {
    const validator = addConstant(ctx, isValidIPv6);
    doc.write(`if (!${validator}(${accessor})) return INVALID;`);
    return accessor;
  }
  if (fmt === "cidrv6") {
    const validator = addConstant(ctx, isValidCIDRv6);
    doc.write(`if (!${validator}(${accessor})) return INVALID;`);
    return accessor;
  }
  if (fmt === "credit_card") {
    const validator = addConstant(ctx, isValidCreditCard);
    doc.write(`if (!${validator}(${accessor})) return INVALID;`);
    return accessor;
  }
  if (fmt === "iban") {
    const validator = addConstant(ctx, isValidIBAN);
    doc.write(`if (!${validator}(${accessor})) return INVALID;`);
    return accessor;
  }
  const formatDef = def;
  if (fmt === "url" || fmt === "httpurl" || formatDef.normalize || formatDef.hostname !== void 0 || formatDef.protocol !== void 0) {
    const parseConst = addConstant(ctx, parseURLObject);
    const defConst = addConstant(ctx, def);
    const trimVar = newVar(ctx);
    const urlVar = newVar(ctx);
    doc.write(`const ${trimVar} = ${accessor}.trim();`);
    doc.write(`const ${urlVar} = ${parseConst}(${trimVar}, ${defConst});`);
    doc.write(`if (typeof ${urlVar} === "number") return INVALID;`);
    if (formatDef.hostname !== void 0) {
      const hostnameConst = addConstant(ctx, urlHostnameOk);
      doc.write(`if (!${hostnameConst}(${urlVar}, ${defConst}.hostname)) return INVALID;`);
    }
    if (formatDef.protocol !== void 0) {
      const protocolConst = addConstant(ctx, urlProtocolOk);
      doc.write(`if (!${protocolConst}(${urlVar}, ${defConst}.protocol)) return INVALID;`);
    }
    const outputVar = newVar(ctx);
    const outputExpr = formatDef.normalize ? `${urlVar}.href` : `${addConstant(ctx, stripTabAndNewline)}(${trimVar})`;
    doc.write(`const ${outputVar} = ${outputExpr};`);
    return outputVar;
  }
  const customFn = def.fn;
  if (customFn) {
    if (isAsyncFunction(customFn))
      throw new ZodCompileUnsupportedError(`async string format ${fmt}`);
    const fnConst = addConstant(ctx, customFn);
    doc.write(`if (!${fnConst}(${accessor})) return INVALID;`);
    return accessor;
  }
  if (PATTERN_IS_COMPLETE.has(fmt) && def.pattern) {
    const patternConst = addConstant(ctx, def.pattern);
    doc.write(`${patternConst}.lastIndex = 0;`);
    doc.write(`if (!${patternConst}.test(${accessor})) return INVALID;`);
    return accessor;
  }
  const format = def.format;
  switch (format) {
    case "regex":
      throw new ZodCompileUnsupportedError("regex format without a pattern");
    case "lowercase":
      doc.write(`if (${accessor} !== ${accessor}.toLowerCase()) return INVALID;`);
      break;
    case "uppercase":
      doc.write(`if (${accessor} !== ${accessor}.toUpperCase()) return INVALID;`);
      break;
    case "includes":
      doc.write(`if (!${accessor}.includes(${esc(def.includes)})) return INVALID;`);
      break;
    case "starts_with": {
      const prefix = def.prefix;
      doc.write(`if (${accessor}.slice(0, ${prefix.length}) !== ${esc(prefix)}) return INVALID;`);
      break;
    }
    case "ends_with": {
      const suffix = def.suffix;
      doc.write(`if (${accessor}.slice(-${suffix.length}) !== ${esc(suffix)}) return INVALID;`);
      break;
    }
    default: {
      void format;
      throw new ZodCompileUnsupportedError(`string format ${format}`);
    }
  }
  return accessor;
}
function generateCheck(doc, ctx, schema, accessor, needsValue = true) {
  const def = schema._zod.def;
  const type = def.type;
  if (def.coerce) {
    throw new ZodCompileUnsupportedError(`coercion (z.coerce.${type}())`);
  }
  const buildsValue = needsValue || !!def.checks?.length;
  let typeAccessor;
  switch (type) {
    case "string":
      typeAccessor = generateStringCheck(doc, ctx, schema, accessor);
      break;
    case "number":
      typeAccessor = generateNumberCheck(doc, schema, accessor);
      break;
    case "boolean":
      typeAccessor = generateBooleanCheck(doc, accessor);
      break;
    case "bigint":
      typeAccessor = generateBigIntCheck(doc, schema, accessor);
      break;
    case "symbol":
      typeAccessor = generateSymbolCheck(doc, accessor);
      break;
    case "undefined":
      typeAccessor = generateUndefinedCheck(doc, accessor);
      break;
    case "null":
      typeAccessor = generateNullCheck(doc, accessor);
      break;
    case "any":
    case "unknown":
      typeAccessor = accessor;
      break;
    case "never":
      doc.write("return INVALID;");
      typeAccessor = accessor;
      break;
    case "void":
      typeAccessor = generateVoidCheck(doc, accessor);
      break;
    case "nan":
      typeAccessor = generateNaNCheck(doc, accessor);
      break;
    case "date":
      typeAccessor = generateDateCheck(doc, accessor);
      break;
    case "object":
      typeAccessor = generateObjectCheck(doc, ctx, schema, accessor, buildsValue);
      break;
    case "optional":
      typeAccessor = generateOptionalCheck(doc, ctx, schema, accessor, buildsValue);
      break;
    case "nullable":
      typeAccessor = generateNullableCheck(doc, ctx, schema, accessor, buildsValue);
      break;
    case "array":
      typeAccessor = generateArrayCheck(doc, ctx, schema, accessor, buildsValue);
      break;
    case "literal":
      typeAccessor = generateLiteralCheck(doc, ctx, schema, accessor);
      break;
    case "enum":
      typeAccessor = generateEnumCheck(doc, ctx, schema, accessor);
      break;
    case "readonly": {
      const innerOut = generateWrapperCheck(doc, ctx, schema, accessor);
      const frozenVar = newVar(ctx);
      doc.write(`const ${frozenVar} = Object.freeze(${innerOut});`);
      typeAccessor = frozenVar;
      break;
    }
    case "success":
      generateWrapperCheck(doc, ctx, schema, accessor);
      typeAccessor = "true";
      break;
    case "default":
    case "prefault":
      typeAccessor = generateDefaultCheck(doc, ctx, schema, accessor);
      break;
    case "nonoptional":
      typeAccessor = generateNonOptionalCheck(doc, ctx, schema, accessor);
      break;
    case "tuple":
      typeAccessor = generateTupleCheck(doc, ctx, schema, accessor);
      break;
    case "union":
      typeAccessor = generateUnionCheck(doc, ctx, schema, accessor);
      break;
    case "intersection":
      typeAccessor = generateIntersectionCheck(doc, ctx, schema, accessor);
      break;
    case "record":
      typeAccessor = generateRecordCheck(doc, ctx, schema, accessor);
      break;
    case "map":
      typeAccessor = generateMapCheck(doc, ctx, schema, accessor);
      break;
    case "set":
      typeAccessor = generateSetCheck(doc, ctx, schema, accessor);
      break;
    case "file":
      typeAccessor = generateFileCheck(doc, accessor);
      break;
    case "template_literal":
      typeAccessor = generateTemplateLiteralCheck(doc, ctx, schema, accessor);
      break;
    case "lazy":
      typeAccessor = generateLazyCheck(doc, ctx, schema, accessor);
      break;
    case "pipe":
      typeAccessor = generatePipeCheck(doc, ctx, schema, accessor);
      break;
    case "custom":
      typeAccessor = generateCustomCheck(doc, ctx, schema, accessor);
      break;
    case "properties":
      generatePropertiesChecks(doc, ctx, schema._zod.def, accessor, true);
      typeAccessor = accessor;
      break;
    case "transform":
      typeAccessor = generateTransformCheck(doc, ctx, schema, accessor);
      break;
    case "catch":
      typeAccessor = generateCatchCheck(doc, ctx, schema, accessor);
      break;
    default: {
      void type;
      throw new ZodCompileUnsupportedError(`schema type ${type}`);
    }
  }
  if (typeAccessor === null)
    return null;
  return generateChecks(doc, ctx, schema, typeAccessor);
}
function generateStringCheck(doc, ctx, schema, accessor) {
  doc.write(`if (typeof ${accessor} !== "string") return INVALID;`);
  const def = schema._zod.def;
  if (def.format === void 0)
    return accessor;
  return generateStringFormatCheck(doc, ctx, def, accessor);
}
function generateNumberCheck(doc, schema, accessor) {
  doc.write(`if (typeof ${accessor} !== "number" || !Number.isFinite(${accessor})) return INVALID;`);
  const def = schema._zod.def;
  if (def.check === "number_format" && def.format) {
    generateNumberFormatCheck(doc, { format: def.format }, accessor);
  }
  return accessor;
}
function generateBooleanCheck(doc, accessor) {
  doc.write(`if (typeof ${accessor} !== "boolean") return INVALID;`);
  return accessor;
}
function generateBigIntCheck(doc, schema, accessor) {
  doc.write(`if (typeof ${accessor} !== "bigint") return INVALID;`);
  const def = schema._zod.def;
  if (def.format) {
    switch (def.format) {
      case "int64":
        doc.write(`if (${accessor} < -9223372036854775808n || ${accessor} > 9223372036854775807n) return INVALID;`);
        break;
      case "uint64":
        doc.write(`if (${accessor} < 0n || ${accessor} > 18446744073709551615n) return INVALID;`);
        break;
    }
  }
  return accessor;
}
function generateSymbolCheck(doc, accessor) {
  doc.write(`if (typeof ${accessor} !== "symbol") return INVALID;`);
  return accessor;
}
function generateUndefinedCheck(doc, accessor) {
  doc.write(`if (${accessor} !== undefined) return INVALID;`);
  return accessor;
}
function generateNullCheck(doc, accessor) {
  doc.write(`if (${accessor} !== null) return INVALID;`);
  return accessor;
}
function generateVoidCheck(doc, accessor) {
  doc.write(`if (${accessor} !== undefined) return INVALID;`);
  return accessor;
}
function generateNaNCheck(doc, accessor) {
  doc.write(`if (typeof ${accessor} !== "number" || !Number.isNaN(${accessor})) return INVALID;`);
  return accessor;
}
function generateDateCheck(doc, accessor) {
  doc.write(`if (!(${accessor} instanceof Date) || Number.isNaN(${accessor}.getTime())) return INVALID;`);
  return accessor;
}
function generateObjectCheck(doc, ctx, schema, accessor, buildsValue = true) {
  const def = schema._zod.def;
  doc.write(`if (typeof ${accessor} !== "object" || ${accessor} === null || Array.isArray(${accessor})) return INVALID;`);
  const shape = def.shape;
  const keys = Object.keys(shape);
  const symbolKeys = Object.getOwnPropertySymbols(shape);
  const allKeys = symbolKeys.length ? [...keys, ...symbolKeys] : keys;
  const keyExpr = (k) => typeof k === "symbol" ? addConstant(ctx, k) : esc(k);
  const propKey = (k) => typeof k === "symbol" ? `[${keyExpr(k)}]` : esc(k);
  const propShape = shape;
  if (keys.includes("__proto__")) {
    throw new ZodCompileUnsupportedError('object shape key "__proto__"');
  }
  const propOutputs = /* @__PURE__ */ new Map();
  for (const key of allKeys) {
    const propSchema = propShape[key];
    const kx = keyExpr(key);
    const inputVar = newVar(ctx);
    doc.write(`const ${inputVar} = ${accessor}[${kx}];`);
    if (propSchema._zod.optin !== void 0) {
      const outputVar2 = newVar(ctx);
      doc.write(`let ${outputVar2} = (() => {`);
      doc.indented((d) => {
        const outputAccessor = compileChild(d, ctx, propSchema, inputVar);
        d.write(`return ${outputAccessor};`);
      });
      doc.write(`})();`);
      if (propSchema._zod.optout === "optional") {
        doc.write(`if (${outputVar2} === INVALID) {`);
        doc.indented((d) => {
          d.write(`if (${kx} in ${accessor}) return INVALID;`);
          d.write(`${outputVar2} = undefined;`);
        });
        doc.write(`}`);
      } else {
        doc.write(`if (${outputVar2} === INVALID) return INVALID;`);
      }
      propOutputs.set(key, outputVar2);
    } else {
      if (requiresPresenceCheck(propSchema)) {
        doc.write(`if (!(${kx} in ${accessor})) return INVALID;`);
      }
      const outputAccessor = compileChild(doc, ctx, propSchema, inputVar, buildsValue);
      if (outputAccessor !== null)
        propOutputs.set(key, outputAccessor);
    }
  }
  const catchall = def.catchall;
  let unknownKeysMode = "none";
  if (catchall) {
    const catchallType = catchall._zod.def.type;
    if (catchallType === "never") {
      const condition = keys.map((k) => `k !== ${esc(k)}`).join(" && ") || "true";
      doc.write(`for (const k in ${accessor}) {`);
      doc.indented((d) => {
        d.write(`if (${condition}) return INVALID;`);
      });
      doc.write(`}`);
    } else if ((catchallType === "unknown" || catchallType === "any") && !catchall._zod.def.checks?.length) {
      unknownKeysMode = "passthrough";
    } else {
      unknownKeysMode = "schema";
    }
  }
  const outputVar = newVar(ctx);
  const hasConditionalKeys = allKeys.some((k) => mayOmitUndefined(propShape[k]) || dropsWhenAbsent(propShape[k]));
  if (!buildsValue) {
    if (unknownKeysMode === "schema") {
      const knownSet = keys.length > 0 ? addConstant(ctx, new Set(keys)) : null;
      doc.write(`for (const k in ${accessor}) {`);
      doc.indented((d) => {
        d.write(`if (k === "__proto__") continue;`);
        if (knownSet)
          d.write(`if (${knownSet}.has(k)) continue;`);
        const valVar = newVar(ctx);
        d.write(`const ${valVar} = ${accessor}[k];`);
        compileChild(d, ctx, catchall, valVar, false);
      });
      doc.write(`}`);
    }
    return null;
  }
  if (!hasConditionalKeys) {
    const propLiterals = allKeys.map((k) => `${propKey(k)}: ${propOutputs.get(k)}`).join(", ");
    doc.write(`const ${outputVar} = { ${propLiterals} };`);
  } else {
    doc.write(`const ${outputVar} = {};`);
    for (const k of allKeys) {
      const kx = keyExpr(k);
      const out = propOutputs.get(k);
      if (dropsWhenAbsent(propShape[k])) {
        doc.write(`if (${kx} in ${accessor}) ${outputVar}[${kx}] = ${out};`);
      } else if (mayOmitUndefined(propShape[k])) {
        doc.write(`if (${out} !== undefined || ${kx} in ${accessor}) ${outputVar}[${kx}] = ${out};`);
      } else {
        doc.write(`${outputVar}[${kx}] = ${out};`);
      }
    }
  }
  if (unknownKeysMode !== "none") {
    const knownSet = keys.length > 0 ? addConstant(ctx, new Set(keys)) : null;
    doc.write(`for (const k in ${accessor}) {`);
    doc.indented((d) => {
      d.write(`if (k === "__proto__") continue;`);
      if (knownSet)
        d.write(`if (${knownSet}.has(k)) continue;`);
      if (unknownKeysMode === "passthrough") {
        d.write(`${outputVar}[k] = ${accessor}[k];`);
      } else {
        const valVar = newVar(ctx);
        d.write(`const ${valVar} = ${accessor}[k];`);
        const catchallOut = compileChild(d, ctx, catchall, valVar);
        d.write(`${outputVar}[k] = ${catchallOut};`);
      }
    });
    doc.write(`}`);
  }
  return outputVar;
}
function generateOptionalCheck(doc, ctx, schema, accessor, buildsValue = true) {
  const def = schema._zod.def;
  if (isExactOptional(schema)) {
    return generateCheck(doc, ctx, def.innerType, accessor, buildsValue);
  }
  if (def.innerType._zod.optin === "defaulted") {
    const outputVar2 = newVar(ctx);
    const branchVar = newVar(ctx);
    doc.write(`let ${outputVar2};`);
    doc.write(`if (${accessor} === undefined) {`);
    doc.indented((d) => {
      d.write(`const ${branchVar} = (() => {`);
      d.indented((d2) => {
        const innerOutput = generateCheck(d2, ctx, def.innerType, accessor);
        d2.write(`return ${innerOutput};`);
      });
      d.write(`})();`);
      d.write(`if (${branchVar} !== INVALID) ${outputVar2} = ${branchVar};`);
    });
    doc.write(`} else {`);
    doc.indented((d) => {
      const innerOutput = generateCheck(d, ctx, def.innerType, accessor);
      d.write(`${outputVar2} = ${innerOutput};`);
    });
    doc.write(`}`);
    return outputVar2;
  }
  const outputVar = buildsValue ? newVar(ctx) : null;
  if (outputVar)
    doc.write(`let ${outputVar};`);
  doc.write(`if (${accessor} !== undefined) {`);
  doc.indented((d) => {
    const innerOutput = generateCheck(d, ctx, def.innerType, accessor, buildsValue);
    if (outputVar && innerOutput !== null)
      d.write(`${outputVar} = ${innerOutput};`);
  });
  doc.write(`}`);
  return outputVar;
}
function isExactOptional(schema) {
  return schema._zod.traits?.has("$ZodExactOptional") === true;
}
function requiresPresenceCheck(schema) {
  return schema._zod.optin === void 0 && fastPathAcceptsAbsence(schema);
}
function fastPathAcceptsAbsence(schema) {
  if (schema._zod.def.coerce)
    return true;
  const def = schema._zod.def;
  switch (def.type) {
    case "any":
    case "unknown":
    case "undefined":
    case "void":
    case "default":
    case "prefault":
    case "transform":
    case "custom":
    case "lazy":
      return true;
    case "string":
    case "number":
    case "boolean":
    case "bigint":
    case "symbol":
    case "null":
    case "never":
    case "nan":
    case "date":
    case "object":
    case "array":
    case "tuple":
    case "record":
    case "map":
    case "set":
    case "file":
    case "template_literal":
      return false;
    case "nonoptional":
      return def.innerType ? fastPathAcceptsAbsence(def.innerType) : false;
    case "literal":
      return !!def.values?.includes(void 0);
    case "enum":
      return !!schema._zod.values?.has(void 0);
    case "optional":
    case "nullable":
    case "readonly":
    case "success":
      return def.innerType ? fastPathAcceptsAbsence(def.innerType) : true;
    case "catch":
      return true;
    case "union":
      return def.options ? def.options.some(fastPathAcceptsAbsence) : true;
    case "intersection":
      if (!def.left || !def.right)
        return true;
      return fastPathAcceptsAbsence(def.left) && fastPathAcceptsAbsence(def.right);
    case "pipe":
      return def.in ? fastPathAcceptsAbsence(def.in) : true;
    default:
      return true;
  }
}
function dropsWhenAbsent(schema) {
  return schema._zod.optin === "optional" && schema._zod.optout === "optional";
}
function mayOmitUndefined(schema) {
  return (schema._zod.optin !== "defaulted" || schema._zod.optout === "optional") && mayOutputUndefined(schema);
}
function mayOutputUndefined(schema) {
  const def = schema._zod.def;
  switch (def.type) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
    case "symbol":
    case "null":
    case "nan":
    case "date":
    case "object":
    case "array":
    case "tuple":
    case "record":
    case "map":
    case "set":
    case "file":
    case "template_literal":
    case "never":
    case "success":
      return false;
    case "literal":
      return !!def.values?.includes(void 0);
    case "enum":
      return !!schema._zod.values?.has(void 0);
    case "optional":
      return true;
    case "nullable":
    case "readonly":
    case "nonoptional":
      return def.innerType ? mayOutputUndefined(def.innerType) : true;
    case "union":
      return def.options ? def.options.some(mayOutputUndefined) : true;
    case "intersection":
      return !def.left || !def.right || mayOutputUndefined(def.left) || mayOutputUndefined(def.right);
    case "pipe":
      return def.out ? mayOutputUndefined(def.out) : true;
    default:
      return true;
  }
}
function generateNullableCheck(doc, ctx, schema, accessor, buildsValue = true) {
  const def = schema._zod.def;
  const outputVar = buildsValue ? newVar(ctx) : null;
  if (outputVar)
    doc.write(`let ${outputVar} = null;`);
  doc.write(`if (${accessor} !== null) {`);
  doc.indented((d) => {
    const innerOutput = generateCheck(d, ctx, def.innerType, accessor, buildsValue);
    if (outputVar && innerOutput !== null)
      d.write(`${outputVar} = ${innerOutput};`);
  });
  doc.write(`}`);
  return outputVar;
}
function generateArrayCheck(doc, ctx, schema, accessor, buildsValue = true) {
  const def = schema._zod.def;
  doc.write(`if (!Array.isArray(${accessor})) return INVALID;`);
  const outputVar = buildsValue ? newVar(ctx) : null;
  const iVar = newVar(ctx);
  const elemVar = newVar(ctx);
  if (outputVar)
    doc.write(`const ${outputVar} = new Array(${accessor}.length);`);
  doc.write(`for (let ${iVar} = 0; ${iVar} < ${accessor}.length; ${iVar}++) {`);
  doc.indented((d) => {
    d.write(`const ${elemVar} = ${accessor}[${iVar}];`);
    const elemOutput = compileChild(d, ctx, def.element, elemVar, buildsValue);
    if (outputVar && elemOutput !== null)
      d.write(`${outputVar}[${iVar}] = ${elemOutput};`);
  });
  doc.write(`}`);
  return outputVar;
}
function generateLiteralCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  const values = def.values;
  if (values.length !== 1) {
    const literalSet = addConstant(ctx, new Set(values));
    doc.write(`if (!${literalSet}.has(${accessor})) return INVALID;`);
    return accessor;
  }
  const value = values[0];
  if (typeof value === "number" && Number.isNaN(value)) {
    const literalSet = addConstant(ctx, new Set(values));
    doc.write(`if (!${literalSet}.has(${accessor})) return INVALID;`);
    return accessor;
  }
  if (typeof value === "string") {
    doc.write(`if (${accessor} !== ${esc(value)}) return INVALID;`);
  } else if (typeof value === "number" || typeof value === "boolean") {
    doc.write(`if (${accessor} !== ${value}) return INVALID;`);
  } else if (value === null) {
    doc.write(`if (${accessor} !== null) return INVALID;`);
  } else if (value === void 0) {
    doc.write(`if (${accessor} !== undefined) return INVALID;`);
  } else if (typeof value === "bigint") {
    doc.write(`if (${accessor} !== ${value}n) return INVALID;`);
  } else {
    throw new ZodCompileUnsupportedError(`literal type ${typeof value}`);
  }
  return accessor;
}
function generateEnumCheck(doc, ctx, schema, accessor) {
  const values = schema._zod.values;
  if (!values) {
    throw new ZodCompileUnsupportedError("enum schema without enumerated values");
  }
  const enumSet = addConstant(ctx, values);
  doc.write(`if (!${enumSet}.has(${accessor})) return INVALID;`);
  return accessor;
}
function generateWrapperCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  return generateCheck(doc, ctx, def.innerType, accessor);
}
function generateDefaultCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  const descriptor = Object.getOwnPropertyDescriptor(schema._zod.def, "defaultValue");
  const defaultGetter = descriptor ? () => schema._zod.def.defaultValue : void 0;
  if (schema._zod.def.type === "prefault") {
    if (!defaultGetter) {
      return generateCheck(doc, ctx, def.innerType, accessor);
    }
    const defaultFn = addConstant(ctx, defaultGetter);
    const inputVar = newVar(ctx);
    doc.write(`let ${inputVar} = ${accessor};`);
    doc.write(`if (${accessor} === undefined) ${inputVar} = ${defaultFn}();`);
    return generateCheck(doc, ctx, def.innerType, inputVar);
  }
  const outputVar = newVar(ctx);
  if (defaultGetter) {
    const defaultFn = addConstant(ctx, defaultGetter);
    const cloneFn = addConstant(ctx, shallowClone);
    doc.write(`let ${outputVar};`);
    doc.write(`if (${accessor} === undefined) {`);
    doc.indented((d) => {
      d.write(`${outputVar} = ${cloneFn}(${defaultFn}());`);
    });
    doc.write(`} else {`);
    doc.indented((d) => {
      const innerOutput = generateCheck(d, ctx, def.innerType, accessor);
      d.write(`${outputVar} = ${innerOutput} === undefined ? ${cloneFn}(${defaultFn}()) : ${innerOutput};`);
    });
    doc.write(`}`);
  } else {
    doc.write(`let ${outputVar};`);
    doc.write(`if (${accessor} !== undefined) {`);
    doc.indented((d) => {
      const innerOutput = generateCheck(d, ctx, def.innerType, accessor);
      d.write(`${outputVar} = ${innerOutput};`);
    });
    doc.write(`}`);
  }
  return outputVar;
}
function generateNonOptionalCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  const innerOutput = generateCheck(doc, ctx, def.innerType, accessor);
  const outputVar = newVar(ctx);
  doc.write(`const ${outputVar} = ${innerOutput};`);
  doc.write(`if (${outputVar} === undefined) return INVALID;`);
  return outputVar;
}
function generateTupleCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  const items = def.items;
  const rest = def.rest;
  doc.write(`if (!Array.isArray(${accessor})) return INVALID;`);
  const optinStart = getTupleOptStart2(items, "optin");
  const optoutStart = getTupleOptStart2(items, "optout");
  if (rest) {
    doc.write(`if (${accessor}.length < ${optinStart}) return INVALID;`);
  } else {
    doc.write(`if (${accessor}.length < ${optinStart} || ${accessor}.length > ${items.length}) return INVALID;`);
  }
  const outputVar = newVar(ctx);
  doc.write(`const ${outputVar} = [];`);
  for (let i = 0; i < items.length; i++) {
    const itemSchema = items[i];
    if (i >= optoutStart) {
      doc.write(`if (${outputVar}.length === ${i}) {`);
      doc.indented((d) => {
        d.write(`if (${i} < ${accessor}.length) {`);
        d.indented((d2) => {
          const elemVar = newVar(ctx);
          d2.write(`const ${elemVar} = ${accessor}[${i}];`);
          const elemOutput = compileChild(d2, ctx, itemSchema, elemVar);
          d2.write(`${outputVar}[${i}] = ${elemOutput};`);
        });
        d.write(`} else {`);
        d.indented((d2) => {
          if (dropsWhenAbsent(itemSchema)) {
            d2.write(`${outputVar}.length = ${i};`);
            return;
          }
          const elemVar = newVar(ctx);
          const branchVar = newVar(ctx);
          d2.write(`const ${elemVar} = undefined;`);
          d2.write(`const ${branchVar} = (() => {`);
          d2.indented((d3) => {
            const elemOutput = compileChild(d3, ctx, itemSchema, elemVar);
            d3.write(`return ${elemOutput};`);
          });
          d2.write(`})();`);
          d2.write(`if (${branchVar} === INVALID || ${branchVar} === undefined) ${outputVar}.length = ${i};`);
          d2.write(`else ${outputVar}[${i}] = ${branchVar};`);
        });
        d.write(`}`);
      });
      doc.write(`}`);
    } else {
      const elemVar = newVar(ctx);
      doc.write(`const ${elemVar} = ${accessor}[${i}];`);
      const elemOutput = compileChild(doc, ctx, itemSchema, elemVar);
      doc.write(`${outputVar}[${i}] = ${elemOutput};`);
    }
  }
  if (rest) {
    const iVar = newVar(ctx);
    const elemVar = newVar(ctx);
    doc.write(`for (let ${iVar} = ${items.length}; ${iVar} < ${accessor}.length; ${iVar}++) {`);
    doc.indented((d) => {
      d.write(`const ${elemVar} = ${accessor}[${iVar}];`);
      const elemOutput = compileChild(d, ctx, rest, elemVar);
      d.write(`${outputVar}[${iVar}] = ${elemOutput};`);
    });
    doc.write(`}`);
  }
  return outputVar;
}
function getTupleOptStart2(items, key) {
  for (let i = items.length - 1; i >= 0; i--) {
    const omittable = key === "optin" ? items[i]._zod.optin !== void 0 : items[i]._zod.optout === "optional";
    if (!omittable)
      return i + 1;
  }
  return 0;
}
function generateUnionCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  const options = def.options;
  if (def.discriminator) {
    return generateDiscriminatedUnionCheck(doc, ctx, def, accessor);
  }
  if (def.inclusive === false) {
    throw new ZodCompileUnsupportedError("exclusive unions (z.xor)");
  }
  if (options.length === 0) {
    doc.write("return INVALID;");
    return accessor;
  }
  if (options.length === 1) {
    return generateCheck(doc, ctx, options[0], accessor);
  }
  const allLiterals = options.every((opt) => opt._zod.def.type === "literal" && !opt._zod.def.checks?.length);
  if (allLiterals) {
    const values = new Set(options.flatMap((opt) => opt._zod.def.values));
    const valuesConst = addConstant(ctx, values);
    doc.write(`if (!${valuesConst}.has(${accessor})) return INVALID;`);
    return accessor;
  }
  const outputVar = newVar(ctx);
  doc.write(`let ${outputVar};`);
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    if (i === 0) {
      doc.write(`${outputVar} = (() => {`);
    } else {
      doc.write(`if (${outputVar} === INVALID) ${outputVar} = (() => {`);
    }
    doc.indented((d) => {
      const branchOutput = generateCheck(d, ctx, opt, accessor);
      d.write(`return ${branchOutput};`);
    });
    doc.write(`})();`);
  }
  doc.write(`if (${outputVar} === INVALID) return INVALID;`);
  return outputVar;
}
function generateDiscriminatedUnionCheck(doc, ctx, def, accessor) {
  if (def.unionFallback) {
    throw new ZodCompileUnsupportedError("discriminated union with unionFallback");
  }
  if (def.options.length === 0) {
    doc.write("return INVALID;");
    return accessor;
  }
  const discVar = newVar(ctx);
  const outputVar = newVar(ctx);
  doc.write(`const ${discVar} = ${accessor}?.[${esc(def.discriminator)}];`);
  doc.write(`let ${outputVar};`);
  let firstBranch = true;
  const claimed = /* @__PURE__ */ new Set();
  for (const option of def.options) {
    const values = option._zod.propValues?.[def.discriminator];
    if (!values || values.size === 0) {
      throw new ZodCompileUnsupportedError("discriminated union option without static discriminator values");
    }
    for (const value of values) {
      if (claimed.has(value)) {
        throw new ZodCompileUnsupportedError(`duplicate discriminator value ${String(value)}`);
      }
      claimed.add(value);
    }
    const conditions = Array.from(values, (value) => literalEquality(ctx, discVar, value));
    const prefix = firstBranch ? "if" : "else if";
    doc.write(`${prefix} (${conditions.join(" || ")}) {`);
    doc.indented((d) => {
      const branchOutput = generateCheck(d, ctx, option, accessor);
      d.write(`${outputVar} = ${branchOutput};`);
    });
    doc.write(`}`);
    firstBranch = false;
  }
  doc.write(`else { return INVALID; }`);
  return outputVar;
}
function literalEquality(ctx, accessor, value) {
  if (typeof value === "string")
    return `${accessor} === ${esc(value)}`;
  if (typeof value === "number") {
    if (Number.isNaN(value))
      return `Number.isNaN(${accessor})`;
    return `${accessor} === ${value}`;
  }
  if (typeof value === "boolean")
    return `${accessor} === ${value}`;
  if (value === null)
    return `${accessor} === null`;
  if (value === void 0)
    return `${accessor} === undefined`;
  if (typeof value === "bigint")
    return `${accessor} === ${value}n`;
  if (typeof value === "symbol") {
    const symbolConst = addConstant(ctx, value);
    return `${accessor} === ${symbolConst}`;
  }
  throw new ZodCompileUnsupportedError(`literal discriminator value ${String(value)}`);
}
function generateIntersectionCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  ctx.definite = false;
  const leftOutput = compileChild(doc, ctx, def.left, accessor);
  const rightOutput = compileChild(doc, ctx, def.right, accessor);
  const mergeConst = addConstant(ctx, mergeValues);
  const mergedVar = newVar(ctx);
  doc.write(`const ${mergedVar} = ${mergeConst}(${leftOutput}, ${rightOutput});`);
  doc.write(`if (!${mergedVar}.valid) return INVALID;`);
  return `${mergedVar}.data`;
}
function generateRecordCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  const isPlainObjectConst = addConstant(ctx, isPlainObject);
  doc.write(`if (!${isPlainObjectConst}(${accessor})) return INVALID;`);
  const outputVar = newVar(ctx);
  const kVar = newVar(ctx);
  const valVar = newVar(ctx);
  doc.write(`const ${outputVar} = {};`);
  const recordDef = def;
  const keyValues = recordDef.partial ? void 0 : def.keyType._zod.values;
  if (keyValues) {
    const inputKeys = [];
    for (const key of keyValues) {
      if (!(typeof key === "string" || typeof key === "number" || typeof key === "symbol")) {
        throw new ZodCompileUnsupportedError(`record key value ${String(key)}`);
      }
      const inputKey = typeof key === "number" ? key.toString() : key;
      if (inputKey === "__proto__") {
        throw new ZodCompileUnsupportedError('record key "__proto__"');
      }
      inputKeys.push(inputKey);
      const keyConst = addConstant(ctx, key);
      const outKey = generateCheck(doc, ctx, def.keyType, keyConst);
      const valueVar = newVar(ctx);
      doc.write(`const ${valueVar} = ${accessor}[${literalPropertyKey(ctx, inputKey)}];`);
      const valOutput = compileChild(doc, ctx, def.valueType, valueVar);
      doc.write(`${outputVar}[${outKey}] = ${valOutput};`);
    }
    const knownKeysConst = addConstant(ctx, new Set(inputKeys));
    doc.write(`for (const ${kVar} in ${accessor}) {`);
    doc.indented((d) => {
      d.write(`if (${knownKeysConst}.has(${kVar})) continue;`);
      if (recordDef.mode === "loose") {
        d.write(`if (${kVar} !== "__proto__") ${outputVar}[${kVar}] = ${accessor}[${kVar}];`);
      } else {
        d.write(`return INVALID;`);
      }
    });
    doc.write(`}`);
    return outputVar;
  }
  const keyDef = def.keyType._zod.def;
  const keyIsBareString = keyDef.type === "string" && keyDef.format === void 0 && !keyDef.coerce && (keyDef.checks?.length ?? 0) === 0;
  if (!keyIsBareString) {
    const isLoose = def.mode === "loose";
    const keyFn = compileFn(def.keyType);
    if (keyFn.definite === false)
      ctx.definite = false;
    const keyFast = addConstant(ctx, keyFn);
    const numericConst = addConstant(ctx, number);
    const outKeyVar = newVar(ctx);
    emitOwnKeys(doc, ctx, accessor, kVar, (d) => {
      d.write(`let ${outKeyVar} = ${keyFast}(${kVar});`);
      d.write(`if (${outKeyVar} === INVALID && typeof ${kVar} === "string" && ${numericConst}.test(${kVar})) ${outKeyVar} = ${keyFast}(Number(${kVar}));`);
      if (isLoose) {
        d.write(`if (${outKeyVar} === INVALID) { ${outputVar}[${kVar}] = ${accessor}[${kVar}]; continue; }`);
      } else {
        d.write(`if (${outKeyVar} === INVALID) return INVALID;`);
      }
      d.write(`if (${outKeyVar} === "__proto__") continue;`);
      const valueVar = newVar(ctx);
      d.write(`const ${valueVar} = ${accessor}[${kVar}];`);
      const valOutput = compileChild(d, ctx, def.valueType, valueVar);
      d.write(`${outputVar}[${outKeyVar}] = ${valOutput};`);
    });
    return outputVar;
  }
  emitOwnKeys(doc, ctx, accessor, kVar, (d) => {
    d.write(`const ${valVar} = ${accessor}[${kVar}];`);
    const valOutput = compileChild(d, ctx, def.valueType, valVar);
    d.write(`${outputVar}[${kVar}] = ${valOutput};`);
  }, `return INVALID;`);
  return outputVar;
}
function emitOwnKeys(doc, ctx, accessor, kVar, body, onSymbol) {
  const propIsEnumerableConst = addConstant(ctx, Object.prototype.propertyIsEnumerable);
  const symsVar = newVar(ctx);
  const keysVar = newVar(ctx);
  const iVar = newVar(ctx);
  doc.write(`const ${symsVar} = Object.getOwnPropertySymbols(${accessor});`);
  doc.write(`const ${keysVar} = Object.getOwnPropertyNames(${accessor});`);
  doc.write(`for (let ${iVar} = 0; ${iVar} < ${keysVar}.length; ${iVar}++) {`);
  doc.indented((d) => {
    d.write(`const ${kVar} = ${keysVar}[${iVar}];`);
    d.write(`if (${kVar} === "__proto__" || !${propIsEnumerableConst}.call(${accessor}, ${kVar})) continue;`);
    body(d);
  });
  doc.write(`}`);
  doc.write(`for (let ${iVar} = 0; ${iVar} < ${symsVar}.length; ${iVar}++) {`);
  doc.indented((d) => {
    d.write(`const ${kVar} = ${symsVar}[${iVar}];`);
    d.write(`if (!${propIsEnumerableConst}.call(${accessor}, ${kVar})) continue;`);
    if (onSymbol)
      d.write(onSymbol);
    else
      body(d);
  });
  doc.write(`}`);
}
function literalPropertyKey(ctx, key) {
  if (typeof key === "string")
    return esc(key);
  return addConstant(ctx, key);
}
function generateMapCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  doc.write(`if (!(${accessor} instanceof Map)) return INVALID;`);
  const outputVar = newVar(ctx);
  const kVar = newVar(ctx);
  const valVar = newVar(ctx);
  doc.write(`const ${outputVar} = new Map();`);
  doc.write(`for (const [${kVar}, ${valVar}] of ${accessor}) {`);
  doc.indented((d) => {
    const keyOutput = generateCheck(d, ctx, def.keyType, kVar);
    const valOutput = generateCheck(d, ctx, def.valueType, valVar);
    d.write(`${outputVar}.set(${keyOutput}, ${valOutput});`);
  });
  doc.write(`}`);
  return outputVar;
}
function generateSetCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  doc.write(`if (!(${accessor} instanceof Set)) return INVALID;`);
  const outputVar = newVar(ctx);
  const valVar = newVar(ctx);
  doc.write(`const ${outputVar} = new Set();`);
  doc.write(`for (const ${valVar} of ${accessor}) {`);
  doc.indented((d) => {
    const valOutput = generateCheck(d, ctx, def.valueType, valVar);
    d.write(`${outputVar}.add(${valOutput});`);
  });
  doc.write(`}`);
  return outputVar;
}
function generateFileCheck(doc, accessor) {
  doc.write(`if (!(${accessor} instanceof File)) return INVALID;`);
  return accessor;
}
function generateTemplateLiteralCheck(doc, ctx, schema, accessor) {
  doc.write(`if (typeof ${accessor} !== "string") return INVALID;`);
  const pattern = schema._zod.pattern;
  if (pattern) {
    const patternConst = addConstant(ctx, pattern);
    doc.write(`${patternConst}.lastIndex = 0;`);
    doc.write(`if (!${patternConst}.test(${accessor})) return INVALID;`);
  }
  return accessor;
}
function generateLazyCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  const getterConst = addUserConstant(ctx, def.getter);
  const cacheConst = addConstant(ctx, { parser: null });
  doc.write(`if (!${cacheConst}.parser) {`);
  doc.indented((d) => {
    d.write(`const inner = ${getterConst}();`);
    d.write(`${cacheConst}.parser = function(input) {`);
    d.indented((d2) => {
      d2.write(`const result = inner._zod.run({ value: input, issues: [] }, {});`);
      d2.write(`return result.issues.length === 0 ? result.value : INVALID;`);
    });
    d.write(`};`);
  });
  doc.write(`}`);
  const outputVar = newVar(ctx);
  doc.write(`const ${outputVar} = ${cacheConst}.parser(${accessor});`);
  doc.write(`if (${outputVar} === INVALID) return INVALID;`);
  return outputVar;
}
function generatePipeCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  const inputOutput = generateCheck(doc, ctx, def.in, accessor);
  if (def.transform) {
    if (isAsyncFunction(def.transform)) {
      throw new ZodCompileAsyncError("z.compile: async transforms in pipes are not supported");
    }
    const transformFn = def.transform;
    const helperFn = (value) => {
      const fakePayload = { value, issues: [], addIssue: pushIssue };
      const result = transformFn(value, fakePayload);
      if (result instanceof Promise)
        return INVALID;
      return fakePayload.issues.length === 0 ? result : INVALID;
    };
    const helperConst = addUserConstant(ctx, helperFn);
    const transformedVar = newVar(ctx);
    doc.write(`const ${transformedVar} = ${helperConst}(${inputOutput});`);
    doc.write(`if (${transformedVar} === INVALID) return INVALID;`);
    return generateCheck(doc, ctx, def.out, transformedVar);
  } else {
    return generateCheck(doc, ctx, def.out, inputOutput);
  }
}
function isAsyncFunction(fn) {
  return typeof fn === "function" && (fn.constructor.name === "AsyncFunction" || fn[Symbol.toStringTag] === "AsyncFunction");
}
function generateCustomCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  if (def.fn) {
    if (isAsyncFunction(def.fn)) {
      throw new ZodCompileAsyncError("z.compile: async custom predicates are not supported");
    }
    const fnConst = addUserConstant(ctx, def.fn);
    const throwAsyncConst = addConstant(ctx, throwAsync);
    const resVar = newVar(ctx);
    doc.write(`const ${resVar} = ${fnConst}(${accessor});`);
    doc.write(`if (${resVar} instanceof Promise) ${throwAsyncConst}();`);
    doc.write(`if (!${resVar}) return INVALID;`);
  } else {
    throw new ZodCompileUnsupportedError("custom schema without a predicate function");
  }
  return accessor;
}
function runtimeCatch(innerSchema, catchValue, value) {
  const result = innerSchema._zod.run({ value, issues: [] }, {});
  if (result && typeof result.then === "function")
    return INVALID;
  const r = result;
  if (r.issues.length === 0)
    return r.value;
  return catchValue();
}
function generateCatchCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  if (!def.catchValue[CONSTANT_CATCH]) {
    throw new ZodCompileUnsupportedError("catch with a callback (only a constant catch value compiles)", false);
  }
  const outputVar = newVar(ctx);
  doc.write(`let ${outputVar} = (() => {`);
  doc.indented((d) => {
    const innerOut = compileChild(d, ctx, def.innerType, accessor);
    d.write(`return ${innerOut};`);
  });
  doc.write(`})();`);
  const innerConst = addConstant(ctx, def.innerType);
  const catchConst = addUserConstant(ctx, def.catchValue);
  const catchHelperConst = addConstant(ctx, runtimeCatch);
  doc.write(`if (${outputVar} === INVALID) {`);
  doc.indented((d) => {
    d.write(`${outputVar} = ${catchHelperConst}(${innerConst}, ${catchConst}, ${accessor});`);
    d.write(`if (${outputVar} === INVALID) return INVALID;`);
  });
  doc.write(`}`);
  return outputVar;
}
function generateTransformCheck(doc, ctx, schema, accessor) {
  const def = schema._zod.def;
  if (def.transform) {
    if (isAsyncFunction(def.transform)) {
      throw new ZodCompileAsyncError("z.compile: async transforms are not supported");
    }
    const transformFn = def.transform;
    const helperFn = (value) => {
      const fakePayload = { value, issues: [], addIssue: pushIssue };
      const result = transformFn(value, fakePayload);
      if (result instanceof Promise)
        return INVALID;
      return fakePayload.issues.length === 0 ? result : INVALID;
    };
    const helperConst = addUserConstant(ctx, helperFn);
    const outputVar = newVar(ctx);
    doc.write(`const ${outputVar} = ${helperConst}(${accessor});`);
    doc.write(`if (${outputVar} === INVALID) return INVALID;`);
    return outputVar;
  }
  return accessor;
}

// node_modules/zod/v4/core/api.js
// @__NO_SIDE_EFFECTS__
function _string(Class2, params) {
  return new Class2({
    type: "string",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedString(Class2, params) {
  return new Class2({
    type: "string",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _email(Class2, params) {
  return new Class2({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _guid(Class2, params) {
  return new Class2({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _url(Class2, params) {
  return new Class2({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _emoji2(Class2, params) {
  return new Class2({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class2, params) {
  return new Class2({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _xid(Class2, params) {
  return new Class2({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _mac(Class2, params) {
  return new Class2({
    type: "string",
    format: "mac",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _e164(Class2, params) {
  return new Class2({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _creditCard(Class2, params) {
  return new Class2({
    type: "string",
    format: "credit_card",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _iban(Class2, params) {
  return new Class2({
    type: "string",
    format: "iban",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class2, params) {
  return new Class2({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
var TimePrecision = {
  Any: null,
  Minute: -1,
  Second: 0,
  Millisecond: 3,
  Microsecond: 6
};
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class2, params) {
  return new Class2({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class2, params) {
  return new Class2({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _number(Class2, params) {
  return new Class2({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedNumber(Class2, params) {
  return new Class2({
    type: "number",
    coerce: true,
    checks: [],
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _float32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float32",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _float64(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "float64",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "int32",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uint32(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "uint32",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class2, params) {
  return new Class2({
    type: "boolean",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedBoolean(Class2, params) {
  return new Class2({
    type: "boolean",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _bigint(Class2, params) {
  return new Class2({
    type: "bigint",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedBigint(Class2, params) {
  return new Class2({
    type: "bigint",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int64(Class2, params) {
  return new Class2({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "int64",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uint64(Class2, params) {
  return new Class2({
    type: "bigint",
    check: "bigint_format",
    abort: false,
    format: "uint64",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _symbol(Class2, params) {
  return new Class2({
    type: "symbol",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _undefined2(Class2, params) {
  return new Class2({
    type: "undefined",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _null2(Class2, params) {
  return new Class2({
    type: "null",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _any(Class2) {
  return new Class2({
    type: "any"
  });
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class2) {
  return new Class2({
    type: "unknown"
  });
}
// @__NO_SIDE_EFFECTS__
function _never(Class2, params) {
  return new Class2({
    type: "never",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _void(Class2, params) {
  return new Class2({
    type: "void",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _date(Class2, params) {
  return new Class2({
    type: "date",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _coercedDate(Class2, params) {
  return new Class2({
    type: "date",
    coerce: true,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nan(Class2, params) {
  return new Class2({
    type: "nan",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _positive(params) {
  return /* @__PURE__ */ _gt(0, params);
}
// @__NO_SIDE_EFFECTS__
function _negative(params) {
  return /* @__PURE__ */ _lt(0, params);
}
// @__NO_SIDE_EFFECTS__
function _nonpositive(params) {
  return /* @__PURE__ */ _lte(0, params);
}
// @__NO_SIDE_EFFECTS__
function _nonnegative(params) {
  return /* @__PURE__ */ _gte(0, params);
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
// @__NO_SIDE_EFFECTS__
function _maxSize(maximum, params) {
  return new $ZodCheckMaxSize({
    check: "max_size",
    ...normalizeParams(params),
    maximum
  });
}
// @__NO_SIDE_EFFECTS__
function _minSize(minimum, params) {
  return new $ZodCheckMinSize({
    check: "min_size",
    ...normalizeParams(params),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _size(size, params) {
  return new $ZodCheckSizeEquals({
    check: "size_equals",
    ...normalizeParams(params),
    size
  });
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
// @__NO_SIDE_EFFECTS__
function _property(property, schema, params) {
  return new $ZodCheckProperty({
    check: "property",
    property,
    schema,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _properties(Class2, shape, params) {
  return new Class2({
    type: "properties",
    check: "properties",
    shape,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _mime(types, params) {
  return new $ZodCheckMimeType({
    check: "mime_type",
    mime: types,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
  return /* @__PURE__ */ _overwrite((input2) => input2.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
  return /* @__PURE__ */ _overwrite((input2) => input2.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
  return /* @__PURE__ */ _overwrite((input2) => input2.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
  return /* @__PURE__ */ _overwrite((input2) => input2.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
  return /* @__PURE__ */ _overwrite((input2) => slugify(input2));
}
// @__NO_SIDE_EFFECTS__
function _array(Class2, element, params) {
  return new Class2({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _union(Class2, options, params) {
  return new Class2({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
function _xor(Class2, options, params) {
  return new Class2({
    type: "union",
    options,
    inclusive: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _discriminatedUnion(Class2, discriminator, options, params) {
  return new Class2({
    type: "union",
    options,
    discriminator,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _intersection(Class2, left, right) {
  return new Class2({
    type: "intersection",
    left,
    right
  });
}
// @__NO_SIDE_EFFECTS__
function _tuple(Class2, items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof $ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new Class2({
    type: "tuple",
    items,
    rest,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _record(Class2, keyType, valueType, params) {
  return new Class2({
    type: "record",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _map(Class2, keyType, valueType, params) {
  return new Class2({
    type: "map",
    keyType,
    valueType,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _set(Class2, valueType, params) {
  return new Class2({
    type: "set",
    valueType,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _enum(Class2, values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new Class2({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nativeEnum(Class2, entries, params) {
  return new Class2({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _literal(Class2, value, params) {
  return new Class2({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _file(Class2, params) {
  return new Class2({
    type: "file",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _transform(Class2, fn) {
  return new Class2({
    type: "transform",
    transform: fn
  });
}
// @__NO_SIDE_EFFECTS__
function _optional(Class2, innerType) {
  return new Class2({
    type: "optional",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _nullable(Class2, innerType) {
  return new Class2({
    type: "nullable",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _default(Class2, innerType, defaultValue) {
  return new Class2({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
// @__NO_SIDE_EFFECTS__
function _nonoptional(Class2, innerType, params) {
  return new Class2({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _success(Class2, innerType) {
  return new Class2({
    type: "success",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _catch(Class2, innerType, catchValue) {
  return new Class2({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : constantCatch(catchValue)
  });
}
// @__NO_SIDE_EFFECTS__
function _pipe(Class2, in_, out) {
  return new Class2({
    type: "pipe",
    in: in_,
    out
  });
}
// @__NO_SIDE_EFFECTS__
function _readonly(Class2, innerType) {
  return new Class2({
    type: "readonly",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _templateLiteral(Class2, parts, params) {
  return new Class2({
    type: "template_literal",
    parts,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _lazy(Class2, getter) {
  return new Class2({
    type: "lazy",
    getter
  });
}
// @__NO_SIDE_EFFECTS__
function _promise(Class2, innerType) {
  return new Class2({
    type: "promise",
    innerType
  });
}
// @__NO_SIDE_EFFECTS__
function _custom(Class2, fn, _params) {
  const norm = normalizeParams(_params);
  norm.abort ?? (norm.abort = true);
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...norm
  });
  return schema;
}
// @__NO_SIDE_EFFECTS__
function _refine(Class2, fn, _params) {
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
  const ch = /* @__PURE__ */ _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
// @__NO_SIDE_EFFECTS__
function describe(description) {
  const ch = new $ZodCheck({ check: "describe" });
  ch._zod.onattach = [
    (inst) => {
      const existing = globalRegistry.get(inst) ?? {};
      globalRegistry.add(inst, { ...existing, description });
    }
  ];
  ch._zod.check = () => {
  };
  return ch;
}
// @__NO_SIDE_EFFECTS__
function meta(metadata) {
  const ch = new $ZodCheck({ check: "meta" });
  ch._zod.onattach = [
    (inst) => {
      const existing = globalRegistry.get(inst) ?? {};
      globalRegistry.add(inst, { ...existing, ...metadata });
    }
  ];
  ch._zod.check = () => {
  };
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _stringbool(Classes, _params) {
  const params = normalizeParams(_params);
  let truthyArray = params.truthy ?? ["true", "1", "yes", "on", "y", "enabled"];
  let falsyArray = params.falsy ?? ["false", "0", "no", "off", "n", "disabled"];
  if (params.case !== "sensitive") {
    truthyArray = truthyArray.map((v) => typeof v === "string" ? v.toLowerCase() : v);
    falsyArray = falsyArray.map((v) => typeof v === "string" ? v.toLowerCase() : v);
  }
  const truthySet = new Set(truthyArray);
  const falsySet = new Set(falsyArray);
  const _Codec = Classes.Codec ?? $ZodCodec;
  const _Boolean = Classes.Boolean ?? $ZodBoolean;
  const _String = Classes.String ?? $ZodString;
  const stringSchema = new _String({ type: "string", error: params.error });
  const booleanSchema = new _Boolean({ type: "boolean", error: params.error });
  const codec2 = new _Codec({
    type: "pipe",
    in: stringSchema,
    out: booleanSchema,
    transform: ((input2, payload) => {
      let data = input2;
      if (params.case !== "sensitive")
        data = data.toLowerCase();
      if (truthySet.has(data)) {
        return true;
      } else if (falsySet.has(data)) {
        return false;
      } else {
        payload.issues.push({
          code: "invalid_value",
          expected: "stringbool",
          values: [...truthySet, ...falsySet],
          input: payload.value,
          inst: codec2,
          continue: false
        });
        return {};
      }
    }),
    reverseTransform: ((input2, _payload) => {
      if (input2 === true) {
        return truthyArray[0] || "true";
      } else {
        return falsyArray[0] || "false";
      }
    }),
    error: params.error
  });
  codec2._zod.bag.truthy = truthyArray;
  codec2._zod.bag.falsy = falsyArray;
  codec2._zod.bag.case = params.case ?? "insensitive";
  return codec2;
}
// @__NO_SIDE_EFFECTS__
function _stringFormat(Class2, format, fnOrRegex, _params = {}) {
  const params = normalizeParams(_params);
  const def = {
    check: "string_format",
    type: "string",
    format,
    fn: typeof fnOrRegex === "function" ? fnOrRegex : (val) => fnOrRegex.test(val),
    ...params
  };
  if (fnOrRegex instanceof RegExp) {
    def.pattern = fnOrRegex;
  }
  const inst = new Class2(def);
  return inst;
}

// node_modules/zod/v4/core/to-json-schema.js
function assignProps(target, ...sources) {
  for (const source of sources) {
    for (const key of Reflect.ownKeys(source)) {
      if (Object.prototype.propertyIsEnumerable.call(source, key)) {
        assignProp(target, key, source[key]);
      }
    }
  }
  return target;
}
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {
    }),
    io: params?.io ?? "output",
    counter: 0,
    seen: /* @__PURE__ */ new Map(),
    sharedDefsExtractedFor: void 0,
    sharedEmitDoneFor: void 0,
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    intersections: [],
    deferred: [],
    external: params?.external ?? void 0
  };
}
function handleUnrepresentable(schema, ctx, json2, params, message) {
  const result = typeof ctx.unrepresentable === "function" ? ctx.unrepresentable({ zodSchema: schema, path: params.path, message }) : ctx.unrepresentable;
  if (result === "any")
    return false;
  if (result === void 0 || result === "throw")
    throw new Error(message);
  Object.assign(json2, result);
  return true;
}
function processSchema(schema, ctx, _params = { path: [], schemaPath: [] }) {
  var _a3;
  const def = schema._zod.def;
  const seen = ctx.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
  ctx.seen.set(schema, result);
  ctx.sharedDefsExtractedFor = void 0;
  ctx.sharedEmitDoneFor = void 0;
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema],
      path: _params.path
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema, ctx, _json, params);
    }
    const parent = schema._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      processSchema(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta3 = ctx.metadataRegistry.get(schema);
  if (meta3)
    assignProps(result.schema, meta3);
  if (ctx.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema)
    (_a3 = result.schema).default ?? (_a3.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema);
  return _result.schema;
}
function encodeJSONPointerSegment(segment) {
  return segment.replace(/~/g, "~0").replace(/\//g, "~1");
}
function extractDefs(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  if (ctx.external && ctx.sharedDefsExtractedFor === ctx.external)
    return;
  const idToSchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id2) => id2);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${encodeJSONPointerSegment(id)}` };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    if (entry[1] === root && !entry[1].schema.id) {
      return { ref: uriPrefix };
    }
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + encodeJSONPointerSegment(defId) };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema2 = seen.schema;
    for (const key in schema2) {
      delete schema2[key];
    }
    schema2.$ref = ref;
  };
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
      }
    }
  }
  if (ctx.external)
    ctx.sharedDefsExtractedFor = ctx.external;
}
function compactTypeUnion(schema) {
  const options = schema.anyOf;
  if (!Array.isArray(options) || options.length === 0 || schema.type !== void 0)
    return;
  const types = [];
  for (const option of options) {
    if (!option || typeof option !== "object")
      return;
    compactTypeUnion(option);
    const keys = Object.keys(option);
    if (keys.length !== 1 || keys[0] !== "type")
      return;
    const type = option.type;
    for (const member of Array.isArray(type) ? type : [type]) {
      if (typeof member !== "string")
        return;
      if (!types.includes(member))
        types.push(member);
    }
  }
  delete schema.anyOf;
  schema.type = types.length === 1 ? types[0] : types;
}
var FOLDABLE_KEYS = /* @__PURE__ */ new Set(["type", "properties", "required", "additionalProperties"]);
var UNION_KEYS = ["oneOf", "anyOf"];
function undeclaredConstraint(member) {
  const extra = member.additionalProperties;
  if (extra === void 0 || extra === false || typeof extra !== "object" || extra === null)
    return null;
  return Object.keys(extra).length ? extra : null;
}
function foldObjects(members2) {
  const objects = [];
  for (const member of members2) {
    if (typeof member !== "object" || member.type !== "object")
      return null;
    for (const key in member) {
      if (!FOLDABLE_KEYS.has(key))
        return null;
    }
    objects.push(member);
  }
  const properties2 = {};
  const required2 = /* @__PURE__ */ new Set();
  for (const object2 of objects) {
    for (const key in object2.properties) {
      if (Object.prototype.hasOwnProperty.call(properties2, key))
        continue;
      const parts = [];
      for (const other of objects) {
        const part = other.properties?.[key] ?? undeclaredConstraint(other);
        if (part === null || part === void 0)
          continue;
        if (!parts.some((seen) => JSON.stringify(seen) === JSON.stringify(part)))
          parts.push(part);
      }
      const merged = parts.length === 1 ? parts[0] : foldObjects(parts) ?? { allOf: parts };
      assignProp(properties2, key, merged);
    }
    for (const key of object2.required ?? [])
      required2.add(key);
  }
  const folded = { type: "object", properties: properties2 };
  if (required2.size)
    folded.required = [...required2];
  if (objects.every((object2) => object2.additionalProperties === false)) {
    folded.additionalProperties = false;
  } else {
    const constraints = [];
    for (const object2 of objects) {
      const constraint = undeclaredConstraint(object2);
      if (constraint && !constraints.some((seen) => JSON.stringify(seen) === JSON.stringify(constraint)))
        constraints.push(constraint);
    }
    if (constraints.length === 1)
      folded.additionalProperties = constraints[0];
    else if (constraints.length > 1)
      folded.additionalProperties = { allOf: constraints };
  }
  return folded;
}
function foldIntersection(json2) {
  const allOf = json2.allOf;
  if (!Array.isArray(allOf) || allOf.length < 2)
    return;
  for (const key of FOLDABLE_KEYS)
    if (key in json2)
      return;
  const unions = allOf.filter((m) => UNION_KEYS.some((k) => Array.isArray(m[k])));
  let folded = null;
  if (!unions.length) {
    folded = foldObjects(allOf);
  } else {
    const union2 = unions[0];
    const keyword = UNION_KEYS.find((k) => Array.isArray(union2[k]));
    if (Object.keys(union2).length !== 1)
      return;
    const rest = allOf.filter((m) => m !== union2);
    const branches = union2[keyword].map((branch) => foldObjects([...rest, branch]));
    if (branches.some((b) => !b))
      return;
    folded = { [keyword]: branches };
  }
  if (!folded)
    return;
  delete json2.allOf;
  assignProps(json2, folded);
}
function finalize(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema2 = seen.def ?? seen.schema;
    const _cached = { ...schema2 };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema2.allOf = schema2.allOf ?? [];
        schema2.allOf.push(refSchema);
      } else {
        assignProps(schema2, refSchema);
      }
      assignProps(schema2, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema2[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema2) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema2[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema2.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema2) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema2[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema2[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema2,
      path: seen.path ?? []
    });
  };
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of [...ctx.seen.entries()].reverse()) {
      flattenRef(entry[0]);
    }
    if (ctx.target !== "openapi-3.0") {
      for (const entry of ctx.seen.entries()) {
        compactTypeUnion(entry[1].def ?? entry[1].schema);
      }
    }
    for (const rewrite of ctx.deferred)
      rewrite();
    if (ctx.intersections.length) {
      const carriers = /* @__PURE__ */ new Map();
      for (const seen of ctx.seen.values()) {
        for (const json2 of [seen.schema, seen.def]) {
          const allOf = json2?.allOf;
          if (!Array.isArray(allOf))
            continue;
          const existing = carriers.get(allOf);
          if (existing)
            existing.push(json2);
          else
            carriers.set(allOf, [json2]);
        }
      }
      for (const allOf of ctx.intersections) {
        for (const json2 of carriers.get(allOf) ?? [])
          foldIntersection(json2);
      }
    }
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") {
  } else {
  }
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  assignProps(result, root.defId ? root.schema : root.def ?? root.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
  if (rootMetaId !== void 0 && result.id === rootMetaId)
    delete result.id;
  const defs = ctx.external?.defs ?? {};
  if (!ctx.external || ctx.sharedEmitDoneFor !== ctx.external) {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.def && seen.defId) {
        if (seen.def.id === seen.defId)
          delete seen.def.id;
        assignProp(defs, seen.defId, seen.def);
      }
    }
  }
  if (ctx.external)
    ctx.sharedEmitDoneFor = ctx.external;
  if (ctx.external) {
  } else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault" || def.type === "catch") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
  const ctx = initializeContext({ ...params, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  processSchema(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};

// node_modules/zod/v4/core/json-schema-processors.js
var narrowMin = (agg, key, value) => {
  if (agg[key] === void 0 || value > agg[key])
    agg[key] = value;
};
var narrowMax = (agg, key, value) => {
  if (agg[key] === void 0 || value < agg[key])
    agg[key] = value;
};
var narrowBoth = (agg, value) => {
  narrowMin(agg, "minimum", value);
  narrowMax(agg, "maximum", value);
};
var addDivisor = (agg, value) => {
  agg.multipleOf ?? (agg.multipleOf = []);
  if (!agg.multipleOf.includes(value))
    agg.multipleOf.push(value);
};
var addPattern = (agg, pattern) => {
  agg.patterns ?? (agg.patterns = /* @__PURE__ */ new Set());
  agg.patterns.add(pattern);
};
var intersectMime = (agg, mime) => {
  agg.mime = agg.mime ? agg.mime.filter((m) => mime.includes(m)) : [...mime];
};
var setFormat = (agg, format) => {
  agg.format = format;
  if (format.includes("int"))
    agg.isInt = true;
};
var minContributor = (agg, def) => narrowMin(agg, "minimum", def.minimum);
var maxContributor = (agg, def) => narrowMax(agg, "maximum", def.maximum);
var formatContributor = (ranges) => (agg, def) => {
  setFormat(agg, def.format);
  const [minimum, maximum] = ranges[def.format];
  narrowMin(agg, "minimum", minimum);
  narrowMax(agg, "maximum", maximum);
};
var contributors = {
  greater_than: (agg, def) => narrowMin(agg, def.inclusive ? "minimum" : "exclusiveMinimum", def.value),
  less_than: (agg, def) => narrowMax(agg, def.inclusive ? "maximum" : "exclusiveMaximum", def.value),
  multiple_of: (agg, def) => addDivisor(agg, def.value),
  number_format: formatContributor(NUMBER_FORMAT_RANGES),
  bigint_format: formatContributor(BIGINT_FORMAT_RANGES),
  min_length: minContributor,
  max_length: maxContributor,
  length_equals: (agg, def) => narrowBoth(agg, def.length),
  min_size: minContributor,
  max_size: maxContributor,
  size_equals: (agg, def) => narrowBoth(agg, def.size),
  string_format: (agg, def) => {
    setFormat(agg, def.format);
    if (def.pattern)
      addPattern(agg, def.pattern);
    if (def.format === "base64" || def.format === "base64url")
      agg.contentEncoding = def.format;
    if (def.local || def.precision === -1)
      agg.laxFormat = true;
  },
  mime_type: (agg, def) => intersectMime(agg, def.mime)
};
function aggregateChecks(schema) {
  const agg = {};
  const def = schema._zod.def;
  const list = schema._zod.traits.has("$ZodCheck") ? [schema, ...def.checks ?? []] : def.checks ?? [];
  for (const ch of list)
    contributors[ch._zod.def.check]?.(agg, ch._zod.def);
  const bag = schema._zod.bag;
  if (bag.minimum !== void 0)
    narrowMin(agg, "minimum", bag.minimum);
  if (bag.exclusiveMinimum !== void 0)
    narrowMin(agg, "exclusiveMinimum", bag.exclusiveMinimum);
  if (bag.maximum !== void 0)
    narrowMax(agg, "maximum", bag.maximum);
  if (bag.exclusiveMaximum !== void 0)
    narrowMax(agg, "exclusiveMaximum", bag.exclusiveMaximum);
  if (bag.multipleOf !== void 0)
    addDivisor(agg, bag.multipleOf);
  if (bag.format !== void 0) {
    agg.format ?? (agg.format = bag.format);
    if (bag.format.includes("int"))
      agg.isInt = true;
  }
  if (bag.mime)
    intersectMime(agg, bag.mime);
  for (const pattern of bag.patterns ?? [])
    addPattern(agg, pattern);
  return agg;
}
var formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
  // do not set
};
var exactPatterns = /* @__PURE__ */ new Map([
  [base64Charset, base64],
  [base64urlCharset, base64url]
]);
var exactPattern = (p) => exactPatterns.get(p) ?? p;
var stringProcessor = (schema, ctx, _json, _params) => {
  const json2 = _json;
  json2.type = "string";
  const { minimum, maximum, format, patterns, contentEncoding, laxFormat } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json2.minLength = minimum;
  if (typeof maximum === "number")
    json2.maxLength = maximum;
  if (format) {
    json2.format = formatMap[format] ?? format;
    if (json2.format === "")
      delete json2.format;
    if (format === "time" || laxFormat) {
      delete json2.format;
    }
  }
  if (contentEncoding)
    json2.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const patternList = [...patterns].map(exactPattern);
    if (patternList.length === 1)
      json2.pattern = patternList[0].source;
    else if (patternList.length > 1) {
      json2.allOf = [
        ...patternList.map((regex) => ({
          ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex.source
        }))
      ];
    }
  }
};
var numberProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const { minimum, maximum, multipleOf, exclusiveMaximum, exclusiveMinimum, isInt } = aggregateChecks(schema);
  json2.type = isInt ? "integer" : "number";
  const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json2.minimum = exclusiveMinimum;
      json2.exclusiveMinimum = true;
    } else {
      json2.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json2.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json2.maximum = exclusiveMaximum;
      json2.exclusiveMaximum = true;
    } else {
      json2.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json2.maximum = maximum;
  }
  if (multipleOf) {
    const divisors = /* @__PURE__ */ new Set();
    for (const divisor of multipleOf) {
      if (Number.isFinite(divisor) && divisor !== 0)
        divisors.add(Math.abs(divisor));
      else
        handleUnrepresentable(schema, ctx, json2, params, `A multipleOf divisor of ${divisor} cannot be represented in JSON Schema`);
    }
    const [first, ...rest] = divisors;
    if (first !== void 0)
      json2.multipleOf = first;
    if (rest.length)
      json2.allOf = [...json2.allOf ?? [], ...rest.map((m) => ({ multipleOf: m }))];
  }
};
var booleanProcessor = (_schema, _ctx, json2, _params) => {
  json2.type = "boolean";
};
var bigintProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "BigInt cannot be represented in JSON Schema");
};
var symbolProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Symbols cannot be represented in JSON Schema");
};
var nullProcessor = (_schema, ctx, json2, _params) => {
  if (ctx.target === "openapi-3.0") {
    json2.type = "string";
    json2.nullable = true;
    json2.enum = [null];
  } else {
    json2.type = "null";
  }
};
var undefinedProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Undefined cannot be represented in JSON Schema");
};
var voidProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Void cannot be represented in JSON Schema");
};
var neverProcessor = (_schema, _ctx, json2, _params) => {
  json2.not = {};
};
var anyProcessor = (_schema, _ctx, _json, _params) => {
};
var unknownProcessor = (_schema, _ctx, _json, _params) => {
};
var dateProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Date cannot be represented in JSON Schema");
};
var enumProcessor = (schema, _ctx, json2, _params) => {
  const def = schema._zod.def;
  const values = getEnumValues(def.entries);
  if (values.length === 0) {
    json2.not = {};
    return;
  }
  if (values.every((v) => typeof v === "number"))
    json2.type = "number";
  if (values.every((v) => typeof v === "string"))
    json2.type = "string";
  json2.enum = values;
};
var literalProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  if (def.values.length === 0) {
    json2.not = {};
    return;
  }
  const vals = [];
  for (const val of def.values) {
    if (val === void 0) {
      if (handleUnrepresentable(schema, ctx, json2, params, "Literal `undefined` cannot be represented in JSON Schema"))
        return;
    } else if (typeof val === "bigint") {
      if (handleUnrepresentable(schema, ctx, json2, params, "BigInt literals cannot be represented in JSON Schema"))
        return;
      vals.push(Number(val));
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) {
  } else if (vals.length === 1) {
    const val = vals[0];
    json2.type = val === null ? "null" : typeof val;
    if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") {
      json2.enum = [val];
    } else {
      json2.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number"))
      json2.type = "number";
    if (vals.every((v) => typeof v === "string"))
      json2.type = "string";
    if (vals.every((v) => typeof v === "boolean"))
      json2.type = "boolean";
    if (vals.every((v) => v === null))
      json2.type = "null";
    json2.enum = vals;
  }
};
var nanProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "NaN cannot be represented in JSON Schema");
};
var templateLiteralProcessor = (schema, _ctx, json2, _params) => {
  const _json = json2;
  const pattern = schema._zod.pattern;
  if (!pattern)
    throw new Error("Pattern not found in template literal");
  _json.type = "string";
  _json.pattern = pattern.source;
};
var fileProcessor = (schema, _ctx, json2, _params) => {
  const _json = json2;
  _json.type = "string";
  _json.format = "binary";
  _json.contentEncoding = "binary";
  const { minimum, maximum, mime } = aggregateChecks(schema);
  if (minimum !== void 0)
    _json.minLength = minimum;
  if (maximum !== void 0)
    _json.maxLength = maximum;
  if (!mime)
    return;
  if (mime.length === 0)
    _json.not = {};
  else if (mime.length === 1)
    _json.contentMediaType = mime[0];
  else
    _json.anyOf = mime.map((m) => ({ contentMediaType: m }));
};
var successProcessor = (_schema, _ctx, json2, _params) => {
  json2.type = "boolean";
};
var customProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Custom types cannot be represented in JSON Schema");
};
var functionProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Function types cannot be represented in JSON Schema");
};
var transformProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Transforms cannot be represented in JSON Schema");
};
var mapProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Map cannot be represented in JSON Schema");
};
var setProcessor = (schema, ctx, json2, params) => {
  handleUnrepresentable(schema, ctx, json2, params, "Set cannot be represented in JSON Schema");
};
var arrayProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const def = schema._zod.def;
  const { minimum, maximum } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json2.minItems = minimum;
  if (typeof maximum === "number")
    json2.maxItems = maximum;
  json2.type = "array";
  json2.items = processSchema(def.element, ctx, {
    ...params,
    path: [...params.path, "items"]
  });
};
function inputOptin(schema) {
  const def = schema._zod.def;
  if (def.type === "pipe" && def.in._zod.traits.has("$ZodTransform")) {
    return inputOptin(def.out);
  }
  if (def.type === "catch") {
    return inputOptin(def.innerType);
  }
  return schema._zod.optin;
}
var objectProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const def = schema._zod.def;
  const shape = def.shape;
  const symbolKeys = Object.getOwnPropertySymbols(shape);
  if (symbolKeys.length && handleUnrepresentable(schema, ctx, json2, params, "Symbol keys cannot be represented in JSON Schema")) {
    return;
  }
  json2.type = "object";
  json2.properties = {};
  for (const key in shape) {
    assignProp(json2.properties, key, processSchema(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    }));
  }
  const allKeys = new Set(Object.keys(shape));
  const requiredKeys = new Set([...allKeys].filter((key) => {
    const field = def.shape[key];
    if (ctx.io === "input") {
      return inputOptin(field) === void 0;
    } else {
      return field._zod.optout === void 0;
    }
  }));
  if (requiredKeys.size > 0) {
    json2.required = Array.from(requiredKeys);
  }
  if (def.catchall?._zod.def.type === "never") {
    json2.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output")
      json2.additionalProperties = false;
  } else if (def.catchall) {
    json2.additionalProperties = processSchema(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
};
var propertiesProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const def = schema._zod.def;
  if (Object.getOwnPropertySymbols(def.shape).length && handleUnrepresentable(schema, ctx, json2, params, "Symbol keys cannot be represented in JSON Schema")) {
    return;
  }
  if (ctx.io === "output") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key]) && handleUnrepresentable(schema, ctx, json2, params, `z.properties() returns its input, so the output of a transforming schema at key "${key}" cannot be represented in JSON Schema`)) {
        return;
      }
    }
  }
  json2.type = "object";
  json2.properties = {};
  for (const key in def.shape) {
    assignProp(json2.properties, key, processSchema(def.shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    }));
  }
  const required2 = Object.keys(def.shape).filter((key) => inputOptin(def.shape[key]) === void 0);
  if (required2.length > 0)
    json2.required = required2;
};
var unionProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) => processSchema(x, ctx, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json2.oneOf = options;
  } else {
    json2.anyOf = options;
  }
};
var intersectionProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  const a = processSchema(def.left, ctx, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = processSchema(def.right, ctx, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json2.allOf = allOf;
  ctx.intersections.push(allOf);
};
var tupleProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const def = schema._zod.def;
  json2.type = "array";
  const prefixPath = ctx.target === "draft-2020-12" ? "prefixItems" : "items";
  const restPath = ctx.target === "draft-2020-12" ? "items" : ctx.target === "openapi-3.0" ? "items" : "additionalItems";
  const prefixItems = def.items.map((x, i) => processSchema(x, ctx, {
    ...params,
    path: [...params.path, prefixPath, i]
  }));
  const rest = def.rest ? processSchema(def.rest, ctx, {
    ...params,
    path: [...params.path, restPath, ...ctx.target === "openapi-3.0" ? [def.items.length] : []]
  }) : null;
  let minItems = def.items.length;
  while (minItems > 0) {
    const item = def.items[minItems - 1];
    const optional2 = ctx.io === "input" ? inputOptin(item) !== void 0 : item._zod.optout === "optional";
    if (!optional2)
      break;
    minItems--;
  }
  const maxItems = def.items.length;
  const isClosed = !def.rest;
  if (ctx.target === "draft-2020-12") {
    json2.prefixItems = prefixItems;
    if (isClosed) {
      json2.items = false;
    } else if (rest) {
      json2.items = rest;
    }
    if (minItems > 0)
      json2.minItems = minItems;
    if (isClosed)
      json2.maxItems = maxItems;
  } else if (ctx.target === "openapi-3.0") {
    json2.items = {
      anyOf: prefixItems
    };
    if (rest) {
      json2.items.anyOf.push(rest);
    }
    if (minItems > 0)
      json2.minItems = minItems;
    if (isClosed)
      json2.maxItems = maxItems;
  } else {
    json2.items = prefixItems;
    if (isClosed) {
      json2.additionalItems = false;
    } else if (rest) {
      json2.additionalItems = rest;
    }
    if (minItems > 0)
      json2.minItems = minItems;
    if (isClosed)
      json2.maxItems = maxItems;
  }
  const { minimum, maximum } = aggregateChecks(schema);
  if (typeof minimum === "number")
    json2.minItems = minimum;
  if (typeof maximum === "number")
    json2.maxItems = maximum;
};
function stringifyKeyNames(bySchema, json2, visited) {
  if (json2.$ref) {
    if (visited.has(json2))
      return json2;
    visited.add(json2);
    const def = bySchema.get(json2)?.def;
    if (!def)
      return json2;
    const inlined = stringifyKeyNames(bySchema, def, visited);
    return inlined === def ? json2 : inlined;
  }
  for (const keyword of ["anyOf", "oneOf"]) {
    const branches = json2[keyword];
    if (!Array.isArray(branches))
      continue;
    const mapped = branches.map((branch) => stringifyKeyNames(bySchema, branch, visited));
    if (mapped.some((branch, i) => branch !== branches[i]))
      json2 = { ...json2, [keyword]: mapped };
  }
  const types = Array.isArray(json2.type) ? json2.type : [json2.type];
  const numericType = !types.includes("string") && types.some((t) => t === "number" || t === "integer");
  const values = json2.enum ?? (json2.const !== void 0 ? [json2.const] : void 0);
  if (!numericType && !values?.some((v) => typeof v === "number"))
    return json2;
  const { minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf, format, id, ...rest } = json2;
  if (rest.enum)
    rest.enum = rest.enum.map((v) => typeof v === "number" ? String(v) : v);
  else if (typeof rest.const === "number")
    rest.const = String(rest.const);
  if (!numericType)
    return rest;
  rest.type = "string";
  if (!values)
    rest.pattern = (types.includes("number") ? number : integer).source;
  return rest;
}
var pendingRecords = /* @__PURE__ */ new WeakMap();
function rewriteKeyNames(ctx) {
  const bySchema = /* @__PURE__ */ new Map();
  for (const entry of ctx.seen.values()) {
    if (entry.def && !bySchema.has(entry.schema))
      bySchema.set(entry.schema, entry);
  }
  const rewrites = /* @__PURE__ */ new Map();
  for (const record2 of pendingRecords.get(ctx) ?? []) {
    const seen = ctx.seen.get(record2);
    const names = (seen?.def ?? seen?.schema)?.propertyNames;
    if (!names || names === true || rewrites.has(names))
      continue;
    const rewritten = stringifyKeyNames(bySchema, names, /* @__PURE__ */ new Set());
    if (rewritten !== names)
      rewrites.set(names, rewritten);
  }
  if (!rewrites.size)
    return;
  for (const entry of ctx.seen.values()) {
    for (const carrier of [entry.schema, entry.def]) {
      const rewritten = carrier && rewrites.get(carrier.propertyNames);
      if (rewritten)
        carrier.propertyNames = rewritten;
    }
  }
}
var recordProcessor = (schema, ctx, _json, params) => {
  const json2 = _json;
  const def = schema._zod.def;
  json2.type = "object";
  const keyType = def.keyType;
  const patterns = aggregateChecks(keyType).patterns;
  if (def.mode === "loose" && patterns && patterns.size > 0) {
    const valueSchema = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "patternProperties", "*"]
    });
    json2.patternProperties = {};
    for (const pattern of patterns) {
      assignProp(json2.patternProperties, exactPattern(pattern).source, valueSchema);
    }
  } else {
    if (ctx.target === "draft-07" || ctx.target === "draft-2020-12") {
      json2.propertyNames = processSchema(def.keyType, ctx, {
        ...params,
        path: [...params.path, "propertyNames"]
      });
      let pending = pendingRecords.get(ctx);
      if (!pending) {
        pending = [];
        pendingRecords.set(ctx, pending);
        ctx.deferred.push(() => rewriteKeyNames(ctx));
      }
      pending.push(schema);
    }
    json2.additionalProperties = processSchema(def.valueType, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
  const keyValues = keyType._zod.values;
  const omittableOnInput = ctx.io === "input" && inputOptin(def.valueType) !== void 0;
  if (keyValues && !def.partial && !omittableOnInput) {
    const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
    if (validKeyValues.length > 0) {
      json2.required = validKeyValues.map(String);
    }
  }
};
var nullableProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  const inner = processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json2.nullable = true;
  } else {
    json2.anyOf = [inner, { type: "null" }];
  }
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var UNREPRESENTABLE_DEFAULT = Symbol();
function serializeDefaultValue(value, schema, ctx, json2, params) {
  let unrepresentable = false;
  const serialized = JSON.stringify(value, (_, val) => {
    if (typeof val !== "bigint")
      return val;
    unrepresentable = true;
    return null;
  });
  if (!unrepresentable)
    return JSON.parse(serialized);
  handleUnrepresentable(schema, ctx, json2, params, "BigInt defaults cannot be represented in JSON Schema");
  return UNREPRESENTABLE_DEFAULT;
}
var defaultProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json2, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json2.default = value;
};
var prefaultProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  if (ctx.io !== "input")
    return;
  const value = serializeDefaultValue(def.defaultValue, schema, ctx, json2, params);
  if (value !== UNREPRESENTABLE_DEFAULT)
    json2._prefault = value;
};
var catchProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(void 0);
  } catch {
    handleUnrepresentable(schema, ctx, json2, params, "Dynamic catch values are not supported in JSON Schema");
    return;
  }
  json2.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
  processSchema(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json2, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json2.readOnly = true;
};
var promiseProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var optionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  processSchema(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var lazyProcessor = (schema, ctx, _json, params) => {
  const innerType = schema._zod.innerType;
  processSchema(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var allProcessors = {
  string: stringProcessor,
  number: numberProcessor,
  boolean: booleanProcessor,
  bigint: bigintProcessor,
  symbol: symbolProcessor,
  null: nullProcessor,
  undefined: undefinedProcessor,
  void: voidProcessor,
  never: neverProcessor,
  any: anyProcessor,
  unknown: unknownProcessor,
  date: dateProcessor,
  enum: enumProcessor,
  literal: literalProcessor,
  nan: nanProcessor,
  template_literal: templateLiteralProcessor,
  file: fileProcessor,
  success: successProcessor,
  custom: customProcessor,
  properties: propertiesProcessor,
  function: functionProcessor,
  transform: transformProcessor,
  map: mapProcessor,
  set: setProcessor,
  array: arrayProcessor,
  object: objectProcessor,
  union: unionProcessor,
  intersection: intersectionProcessor,
  tuple: tupleProcessor,
  record: recordProcessor,
  nullable: nullableProcessor,
  nonoptional: nonoptionalProcessor,
  default: defaultProcessor,
  prefault: prefaultProcessor,
  catch: catchProcessor,
  pipe: pipeProcessor,
  readonly: readonlyProcessor,
  promise: promiseProcessor,
  optional: optionalProcessor,
  lazy: lazyProcessor
};
function toJSONSchema(input2, params) {
  if ("_idmap" in input2) {
    const registry2 = input2;
    const ctx2 = initializeContext({ ...params, processors: allProcessors });
    const defs = {};
    for (const entry of registry2._idmap.entries()) {
      const [_, schema] = entry;
      processSchema(schema, ctx2);
    }
    const schemas = {};
    const external = {
      registry: registry2,
      uri: params?.uri,
      defs
    };
    ctx2.external = external;
    for (const entry of registry2._idmap.entries()) {
      const [key, schema] = entry;
      extractDefs(ctx2, schema);
      assignProp(schemas, key, finalize(ctx2, schema));
    }
    if (Object.keys(defs).length > 0) {
      const defsSegment = ctx2.target === "draft-2020-12" ? "$defs" : "definitions";
      schemas.__shared = {
        [defsSegment]: defs
      };
    }
    return { schemas };
  }
  const ctx = initializeContext({ ...params, processors: allProcessors });
  processSchema(input2, ctx);
  extractDefs(ctx, input2);
  return finalize(ctx, input2);
}

// node_modules/zod/v4/core/json-schema-generator.js
var JSONSchemaGenerator = class {
  /** @deprecated Access via ctx instead */
  get metadataRegistry() {
    return this.ctx.metadataRegistry;
  }
  /** @deprecated Access via ctx instead */
  get target() {
    return this.ctx.target;
  }
  // annotated so the .d.cts emits an indexed access rather than an inline `import()` of an ESM path
  /** @deprecated Access via ctx instead */
  get unrepresentable() {
    return this.ctx.unrepresentable;
  }
  /** @deprecated Access via ctx instead */
  get override() {
    return this.ctx.override;
  }
  /** @deprecated Access via ctx instead */
  get io() {
    return this.ctx.io;
  }
  /** @deprecated Access via ctx instead */
  get counter() {
    return this.ctx.counter;
  }
  set counter(value) {
    this.ctx.counter = value;
  }
  /** @deprecated Access via ctx instead */
  get seen() {
    return this.ctx.seen;
  }
  constructor(params) {
    let normalizedTarget = params?.target ?? "draft-2020-12";
    if (normalizedTarget === "draft-4")
      normalizedTarget = "draft-04";
    if (normalizedTarget === "draft-7")
      normalizedTarget = "draft-07";
    this.ctx = initializeContext({
      processors: allProcessors,
      target: normalizedTarget,
      ...params?.metadata && { metadata: params.metadata },
      ...params?.unrepresentable && { unrepresentable: params.unrepresentable },
      ...params?.override && { override: params.override },
      ...params?.io && { io: params.io }
    });
  }
  /**
   * Process a schema to prepare it for JSON Schema generation.
   * This must be called before emit().
   */
  process(schema, _params = { path: [], schemaPath: [] }) {
    return processSchema(schema, this.ctx, _params);
  }
  /**
   * Emit the final JSON Schema after processing.
   * Must call process() first.
   */
  emit(schema, _params) {
    if (_params) {
      if (_params.cycles)
        this.ctx.cycles = _params.cycles;
      if (_params.reused)
        this.ctx.reused = _params.reused;
      if (_params.external)
        this.ctx.external = _params.external;
    }
    this.ctx.sharedDefsExtractedFor = void 0;
    this.ctx.sharedEmitDoneFor = void 0;
    extractDefs(this.ctx, schema);
    const result = finalize(this.ctx, schema);
    const { "~standard": _, ...plainResult } = result;
    return plainResult;
  }
};

// node_modules/zod/v4/core/json-schema.js
var json_schema_exports = {};

// node_modules/zod/v4/classic/schemas.js
var schemas_exports2 = {};
__export(schemas_exports2, {
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBase64: () => ZodBase64,
  ZodBase64URL: () => ZodBase64URL,
  ZodBigInt: () => ZodBigInt,
  ZodBigIntFormat: () => ZodBigIntFormat,
  ZodBoolean: () => ZodBoolean,
  ZodCIDRv4: () => ZodCIDRv4,
  ZodCIDRv6: () => ZodCIDRv6,
  ZodCUID: () => ZodCUID,
  ZodCUID2: () => ZodCUID2,
  ZodCatch: () => ZodCatch,
  ZodCodec: () => ZodCodec,
  ZodCreditCard: () => ZodCreditCard,
  ZodCustom: () => ZodCustom,
  ZodCustomStringFormat: () => ZodCustomStringFormat,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodE164: () => ZodE164,
  ZodEmail: () => ZodEmail,
  ZodEmoji: () => ZodEmoji,
  ZodEnum: () => ZodEnum,
  ZodExactOptional: () => ZodExactOptional,
  ZodFile: () => ZodFile,
  ZodFunction: () => ZodFunction,
  ZodGUID: () => ZodGUID,
  ZodIBAN: () => ZodIBAN,
  ZodIPv4: () => ZodIPv4,
  ZodIPv6: () => ZodIPv6,
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  ZodInstanceOf: () => ZodInstanceOf,
  ZodIntersection: () => ZodIntersection,
  ZodJWT: () => ZodJWT,
  ZodKSUID: () => ZodKSUID,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMAC: () => ZodMAC,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNanoID: () => ZodNanoID,
  ZodNever: () => ZodNever,
  ZodNonOptional: () => ZodNonOptional,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodNumberFormat: () => ZodNumberFormat,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodPipe: () => ZodPipe,
  ZodPrefault: () => ZodPrefault,
  ZodPreprocess: () => ZodPreprocess,
  ZodPromise: () => ZodPromise,
  ZodProperties: () => ZodProperties,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodStringFormat: () => ZodStringFormat,
  ZodSuccess: () => ZodSuccess,
  ZodSymbol: () => ZodSymbol,
  ZodTemplateLiteral: () => ZodTemplateLiteral,
  ZodTransform: () => ZodTransform,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodULID: () => ZodULID,
  ZodURL: () => ZodURL,
  ZodUUID: () => ZodUUID,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  ZodXID: () => ZodXID,
  ZodXor: () => ZodXor,
  _ZodString: () => _ZodString,
  _default: () => _default2,
  _function: () => _function,
  any: () => any,
  array: () => array,
  base64: () => base642,
  base64url: () => base64url2,
  bigint: () => bigint2,
  boolean: () => boolean2,
  catch: () => _catch2,
  check: () => check,
  cidrv4: () => cidrv42,
  cidrv6: () => cidrv62,
  codec: () => codec,
  creditCard: () => creditCard2,
  cuid: () => cuid3,
  cuid2: () => cuid22,
  custom: () => custom,
  date: () => date2,
  describe: () => describe2,
  discriminatedUnion: () => discriminatedUnion,
  e164: () => e1642,
  email: () => email2,
  emoji: () => emoji2,
  enum: () => _enum2,
  exactOptional: () => exactOptional,
  file: () => file,
  float32: () => float32,
  float64: () => float64,
  function: () => _function,
  guid: () => guid2,
  hash: () => hash,
  hex: () => hex2,
  hostname: () => hostname2,
  httpUrl: () => httpUrl,
  iban: () => iban2,
  instanceof: () => _instanceof,
  int: () => int,
  int32: () => int32,
  int64: () => int64,
  intersection: () => intersection,
  invertCodec: () => invertCodec,
  ipv4: () => ipv42,
  ipv6: () => ipv62,
  json: () => json,
  jwt: () => jwt,
  keyof: () => keyof,
  ksuid: () => ksuid2,
  lazy: () => lazy,
  literal: () => literal,
  looseObject: () => looseObject,
  looseRecord: () => looseRecord,
  mac: () => mac2,
  map: () => map,
  meta: () => meta2,
  nan: () => nan,
  nanoid: () => nanoid2,
  nativeEnum: () => nativeEnum,
  never: () => never,
  nonoptional: () => nonoptional,
  null: () => _null3,
  nullable: () => nullable,
  nullish: () => nullish2,
  number: () => number2,
  object: () => object,
  optional: () => optional,
  partialRecord: () => partialRecord,
  pipe: () => pipe,
  prefault: () => prefault,
  preprocess: () => preprocess,
  promise: () => promise,
  properties: () => properties,
  readonly: () => readonly,
  record: () => record,
  refine: () => refine,
  set: () => set,
  strictObject: () => strictObject,
  string: () => string2,
  stringFormat: () => stringFormat,
  stringbool: () => stringbool,
  success: () => success,
  superRefine: () => superRefine,
  symbol: () => symbol,
  templateLiteral: () => templateLiteral,
  transform: () => transform,
  tuple: () => tuple,
  uint32: () => uint32,
  uint64: () => uint64,
  ulid: () => ulid2,
  undefined: () => _undefined3,
  union: () => union,
  unknown: () => unknown,
  url: () => url,
  uuid: () => uuid2,
  uuidv4: () => uuidv4,
  uuidv6: () => uuidv6,
  uuidv7: () => uuidv7,
  void: () => _void2,
  xid: () => xid2,
  xor: () => xor
});

// node_modules/zod/v4/classic/checks.js
var checks_exports2 = {};
__export(checks_exports2, {
  endsWith: () => _endsWith,
  gt: () => _gt,
  gte: () => _gte,
  includes: () => _includes,
  length: () => _length,
  lowercase: () => _lowercase,
  lt: () => _lt,
  lte: () => _lte,
  maxLength: () => _maxLength,
  maxSize: () => _maxSize,
  mime: () => _mime,
  minLength: () => _minLength,
  minSize: () => _minSize,
  multipleOf: () => _multipleOf,
  negative: () => _negative,
  nonnegative: () => _nonnegative,
  nonpositive: () => _nonpositive,
  normalize: () => _normalize,
  overwrite: () => _overwrite,
  positive: () => _positive,
  property: () => _property,
  regex: () => _regex,
  size: () => _size,
  slugify: () => _slugify,
  startsWith: () => _startsWith,
  toLowerCase: () => _toLowerCase,
  toUpperCase: () => _toUpperCase,
  trim: () => _trim,
  uppercase: () => _uppercase
});

// node_modules/zod/v4/classic/errors.js
var _installedErrorProtos = /* @__PURE__ */ new WeakSet([Object.prototype, Error.prototype]);
function _lazyMethod(proto, key, make) {
  Object.defineProperty(proto, key, {
    configurable: true,
    enumerable: false,
    get() {
      const value = make(this);
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
      return value;
    },
    set(value) {
      Object.defineProperty(this, key, { value, configurable: true, writable: true });
    }
  });
}
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  const proto = Object.getPrototypeOf(inst);
  if (_installedErrorProtos.has(proto))
    return;
  _installedErrorProtos.add(proto);
  _lazyMethod(proto, "format", (self) => (mapper) => formatError(self, mapper));
  _lazyMethod(proto, "flatten", (self) => (mapper) => flattenError(self, mapper));
  _lazyMethod(proto, "addIssue", (self) => (issue2) => {
    self.issues.push(issue2);
    self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
  });
  _lazyMethod(proto, "addIssues", (self) => (issues2) => {
    self.issues.push(...issues2);
    self.message = JSON.stringify(self.issues, jsonStringifyReplacer, 2);
  });
  Object.defineProperty(proto, "isEmpty", {
    configurable: true,
    enumerable: false,
    get() {
      return this.issues.length === 0;
    }
  });
};
var ZodError = /* @__PURE__ */ $constructor("ZodError", initializer2);
var ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer2, void 0, {
  Parent: Error
});

// node_modules/zod/v4/classic/parse.js
var parse2 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync2 = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse2 = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync2 = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode2 = /* @__PURE__ */ _encode(ZodRealError);
var decode2 = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync2 = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync2 = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode2 = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode2 = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync2 = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync2 = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// node_modules/zod/v4/classic/schemas.js
function _ensureDefaultLocale() {
  if (!globalConfig.localeError)
    config(en_default());
}
function _ensureDefaultMemoizer() {
  if (!globalConfig.memoizer)
    config({ memoizer: memoizer() });
}
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  _ensureDefaultLocale();
  $ZodType.init(inst, def);
  inst.def = def;
  inst.type = def.type;
  return inst;
}, {
  check(...chks) {
    const def = this.def;
    return this.clone(util_exports.mergeDefs(def, {
      checks: [
        ...def.checks ?? [],
        ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    }), { parent: true });
  },
  with(...chks) {
    return this.check(...chks);
  },
  clone(def, params) {
    return clone(this, def, params);
  },
  brand() {
    return this;
  },
  register(reg, meta3) {
    reg.add(this, meta3);
    return this;
  },
  refine(check2, params) {
    return this.check(refine(check2, params));
  },
  superRefine(refinement, params) {
    return this.check(superRefine(refinement, params));
  },
  overwrite(fn) {
    return this.check(_overwrite(fn));
  },
  optional() {
    return optional(this);
  },
  exactOptional() {
    return exactOptional(this);
  },
  nullable() {
    return nullable(this);
  },
  nullish() {
    return optional(nullable(this));
  },
  nonoptional(params) {
    return nonoptional(this, params);
  },
  array() {
    return array(this);
  },
  or(arg) {
    return union([this, arg]);
  },
  and(arg) {
    return intersection(this, arg);
  },
  transform(tx) {
    return pipe(this, transform(tx));
  },
  default(d) {
    return _default2(this, d);
  },
  prefault(d) {
    return prefault(this, d);
  },
  catch(params) {
    return _catch2(this, params);
  },
  pipe(target) {
    return pipe(this, target);
  },
  readonly() {
    return readonly(this);
  },
  describe(description) {
    const cl = this.clone();
    globalRegistry.add(cl, { description });
    return cl;
  },
  meta(...args) {
    if (args.length === 0)
      return globalRegistry.get(this);
    const cl = this.clone();
    globalRegistry.add(cl, args[0]);
    return cl;
  },
  isOptional() {
    return this.safeParse(void 0).success;
  },
  isNullable() {
    return this.safeParse(null).success;
  },
  apply(fn, ...args) {
    return args.length === 0 ? fn(this) : fn(this, ...args);
  },
  // Overrides core's `~standard` to add `jsonSchema`. Must stay a prototype entry: redefining it per instance demotes instances to dictionary mode.
  get "~standard"() {
    return util_exports.hide(this, "~standard", {
      ...standardProps(this),
      jsonSchema: {
        input: createStandardJSONSchemaMethod(this, "input"),
        output: createStandardJSONSchemaMethod(this, "output")
      }
    });
  },
  set "~standard"(value) {
    util_exports.own(this, "~standard", value);
  },
  parse: function _parse2(data, params) {
    return parse2(this, data, params, { callee: _parse2 });
  },
  parseAsync: async function _parseAsync2(data, params) {
    return await parseAsync2(this, data, params, { callee: _parseAsync2 });
  },
  safeParse(data, params) {
    return safeParse2(this, data, params);
  },
  async safeParseAsync(data, params) {
    return safeParseAsync2(this, data, params);
  },
  // `spa` is an alias: same function object as `safeParseAsync`, as before.
  get spa() {
    return this?.safeParseAsync;
  },
  set spa(value) {
    util_exports.own(this, "spa", value);
  },
  validate(data, params) {
    return validate(this, data, params);
  },
  validateAsync(data, params) {
    return validateAsync(this, data, params);
  },
  encode: function _encode2(data, params) {
    return encode2(this, data, params, { callee: _encode2 });
  },
  decode: function _decode2(data, params) {
    return decode2(this, data, params, { callee: _decode2 });
  },
  encodeAsync: async function _encodeAsync2(data, params) {
    return await encodeAsync2(this, data, params, { callee: _encodeAsync2 });
  },
  decodeAsync: async function _decodeAsync2(data, params) {
    return await decodeAsync2(this, data, params, { callee: _decodeAsync2 });
  },
  safeEncode(data, params) {
    return safeEncode2(this, data, params);
  },
  safeDecode(data, params) {
    return safeDecode2(this, data, params);
  },
  async safeEncodeAsync(data, params) {
    return safeEncodeAsync2(this, data, params);
  },
  async safeDecodeAsync(data, params) {
    return safeDecodeAsync2(this, data, params);
  },
  toJSONSchema(params) {
    return createToJSONSchemaMethod(this, {})(params);
  },
  // Reads through to the registry on every access, so it must not cache.
  get description() {
    return globalRegistry.get(this)?.description;
  },
  // No setter: `schema._def = x` throws, as it did when `_def` was a non-writable own property.
  get _def() {
    return this._zod.def;
  }
});
var _ZodString = /* @__PURE__ */ $constructor(
  "_ZodString",
  (inst, def) => {
    $ZodString.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json2, params) => stringProcessor(inst, ctx, json2, params);
  },
  /* @__PURE__ */ util_exports.derived({
    format: (inst) => aggregateChecks(inst).format ?? null,
    minLength: (inst) => aggregateChecks(inst).minimum ?? null,
    maxLength: (inst) => aggregateChecks(inst).maximum ?? null
  }, {
    regex(...args) {
      return this.check(_regex(...args));
    },
    includes(...args) {
      return this.check(_includes(...args));
    },
    startsWith(...args) {
      return this.check(_startsWith(...args));
    },
    endsWith(...args) {
      return this.check(_endsWith(...args));
    },
    min(...args) {
      return this.check(_minLength(...args));
    },
    max(...args) {
      return this.check(_maxLength(...args));
    },
    length(...args) {
      return this.check(_length(...args));
    },
    nonempty(...args) {
      return this.check(_minLength(1, ...args));
    },
    lowercase(params) {
      return this.check(_lowercase(params));
    },
    uppercase(params) {
      return this.check(_uppercase(params));
    },
    trim() {
      return this.check(_trim());
    },
    normalize(...args) {
      return this.check(_normalize(...args));
    },
    toLowerCase() {
      return this.check(_toLowerCase());
    },
    toUpperCase() {
      return this.check(_toUpperCase());
    },
    slugify() {
      return this.check(_slugify());
    }
  })
);
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
}, {
  email(params) {
    return this.check(_email(ZodEmail, params));
  },
  url(params) {
    return this.check(_url(ZodURL, params));
  },
  jwt(params) {
    return this.check(_jwt(ZodJWT, params));
  },
  emoji(params) {
    return this.check(_emoji2(ZodEmoji, params));
  },
  guid(params) {
    return this.check(_guid(ZodGUID, params));
  },
  uuid(params) {
    return this.check(_uuid(ZodUUID, params));
  },
  uuidv4(params) {
    return this.check(_uuidv4(ZodUUID, params));
  },
  uuidv6(params) {
    return this.check(_uuidv6(ZodUUID, params));
  },
  uuidv7(params) {
    return this.check(_uuidv7(ZodUUID, params));
  },
  nanoid(params) {
    return this.check(_nanoid(ZodNanoID, params));
  },
  cuid(params) {
    return this.check(_cuid(ZodCUID, params));
  },
  cuid2(params) {
    return this.check(_cuid2(ZodCUID2, params));
  },
  ulid(params) {
    return this.check(_ulid(ZodULID, params));
  },
  base64(params) {
    return this.check(_base64(ZodBase64, params));
  },
  base64url(params) {
    return this.check(_base64url(ZodBase64URL, params));
  },
  xid(params) {
    return this.check(_xid(ZodXID, params));
  },
  ksuid(params) {
    return this.check(_ksuid(ZodKSUID, params));
  },
  ipv4(params) {
    return this.check(_ipv4(ZodIPv4, params));
  },
  ipv6(params) {
    return this.check(_ipv6(ZodIPv6, params));
  },
  cidrv4(params) {
    return this.check(_cidrv4(ZodCIDRv4, params));
  },
  cidrv6(params) {
    return this.check(_cidrv6(ZodCIDRv6, params));
  },
  e164(params) {
    return this.check(_e164(ZodE164, params));
  },
  datetime(params) {
    return this.check(_isoDateTime(ZodISODateTime, params));
  },
  date(params) {
    return this.check(_isoDate(ZodISODate, params));
  },
  time(params) {
    return this.check(_isoTime(ZodISOTime, params));
  },
  duration(params) {
    return this.check(_isoDuration(ZodISODuration, params));
  }
});
function string2(params) {
  return _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function email2(params) {
  return _email(ZodEmail, params);
}
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function guid2(params) {
  return _guid(ZodGUID, params);
}
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function uuid2(params) {
  return _uuid(ZodUUID, params);
}
function uuidv4(params) {
  return _uuidv4(ZodUUID, params);
}
function uuidv6(params) {
  return _uuidv6(ZodUUID, params);
}
function uuidv7(params) {
  return _uuidv7(ZodUUID, params);
}
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function url(params) {
  return _url(ZodURL, params);
}
function httpUrl(params) {
  return _url(ZodURL, {
    protocol: regexes_exports.httpProtocol,
    hostname: regexes_exports.domain,
    ...util_exports.normalizeParams(params)
  });
}
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function emoji2(params) {
  return _emoji2(ZodEmoji, params);
}
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function nanoid2(params) {
  return _nanoid(ZodNanoID, params);
}
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cuid3(params) {
  return _cuid(ZodCUID, params);
}
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cuid22(params) {
  return _cuid2(ZodCUID2, params);
}
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ulid2(params) {
  return _ulid(ZodULID, params);
}
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function xid2(params) {
  return _xid(ZodXID, params);
}
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ksuid2(params) {
  return _ksuid(ZodKSUID, params);
}
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ipv42(params) {
  return _ipv4(ZodIPv4, params);
}
var ZodMAC = /* @__PURE__ */ $constructor("ZodMAC", (inst, def) => {
  $ZodMAC.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function mac2(params) {
  return _mac(ZodMAC, params);
}
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function ipv62(params) {
  return _ipv6(ZodIPv6, params);
}
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cidrv42(params) {
  return _cidrv4(ZodCIDRv4, params);
}
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function cidrv62(params) {
  return _cidrv6(ZodCIDRv6, params);
}
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function base642(params) {
  return _base64(ZodBase64, params);
}
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function base64url2(params) {
  return _base64url(ZodBase64URL, params);
}
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function e1642(params) {
  return _e164(ZodE164, params);
}
var ZodCreditCard = /* @__PURE__ */ $constructor("ZodCreditCard", (inst, def) => {
  $ZodCreditCard.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function creditCard2(params) {
  return _creditCard(ZodCreditCard, params);
}
var ZodIBAN = /* @__PURE__ */ $constructor("ZodIBAN", (inst, def) => {
  $ZodIBAN.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function iban2(params) {
  return _iban(ZodIBAN, params);
}
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function jwt(params) {
  return _jwt(ZodJWT, params);
}
var ZodCustomStringFormat = /* @__PURE__ */ $constructor("ZodCustomStringFormat", (inst, def) => {
  $ZodCustomStringFormat.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function stringFormat(format, fnOrRegex, _params = {}) {
  return _stringFormat(ZodCustomStringFormat, format, fnOrRegex, _params);
}
function hostname2(_params) {
  return _stringFormat(ZodCustomStringFormat, "hostname", regexes_exports.hostname, _params);
}
function hex2(_params) {
  return _stringFormat(ZodCustomStringFormat, "hex", regexes_exports.hex, _params);
}
function hash(alg, params) {
  const enc = params?.enc ?? "hex";
  const format = `${alg}_${enc}`;
  const regex = regexes_exports[format];
  if (!regex)
    throw new Error(`Unrecognized hash format: ${format}`);
  return _stringFormat(ZodCustomStringFormat, format, regex, params);
}
var ZodNumber = /* @__PURE__ */ $constructor(
  "ZodNumber",
  (inst, def) => {
    $ZodNumber.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json2, params) => numberProcessor(inst, ctx, json2, params);
    inst.isFinite = true;
  },
  /* @__PURE__ */ util_exports.derived({
    minValue: (inst) => {
      const { minimum, exclusiveMinimum } = aggregateChecks(inst);
      return Math.max(minimum ?? Number.NEGATIVE_INFINITY, exclusiveMinimum ?? Number.NEGATIVE_INFINITY);
    },
    maxValue: (inst) => {
      const { maximum, exclusiveMaximum } = aggregateChecks(inst);
      return Math.min(maximum ?? Number.POSITIVE_INFINITY, exclusiveMaximum ?? Number.POSITIVE_INFINITY);
    },
    isInt: (inst) => {
      const { isInt, multipleOf } = aggregateChecks(inst);
      return !!isInt || !!multipleOf?.some(Number.isSafeInteger);
    },
    format: (inst) => aggregateChecks(inst).format ?? null
  }, {
    gt(value, params) {
      return this.check(_gt(value, params));
    },
    gte(value, params) {
      return this.check(_gte(value, params));
    },
    min(value, params) {
      return this.check(_gte(value, params));
    },
    lt(value, params) {
      return this.check(_lt(value, params));
    },
    lte(value, params) {
      return this.check(_lte(value, params));
    },
    max(value, params) {
      return this.check(_lte(value, params));
    },
    int(params) {
      return this.check(int(params));
    },
    safe(params) {
      return this.check(int(params));
    },
    positive(params) {
      return this.check(_gt(0, params));
    },
    nonnegative(params) {
      return this.check(_gte(0, params));
    },
    negative(params) {
      return this.check(_lt(0, params));
    },
    nonpositive(params) {
      return this.check(_lte(0, params));
    },
    multipleOf(value, params) {
      return this.check(_multipleOf(value, params));
    },
    step(value, params) {
      return this.check(_multipleOf(value, params));
    },
    finite() {
      return this;
    }
  })
);
function number2(params) {
  return _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
function float32(params) {
  return _float32(ZodNumberFormat, params);
}
function float64(params) {
  return _float64(ZodNumberFormat, params);
}
function int32(params) {
  return _int32(ZodNumberFormat, params);
}
function uint32(params) {
  return _uint32(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => booleanProcessor(inst, ctx, json2, params);
});
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
var ZodBigInt = /* @__PURE__ */ $constructor(
  "ZodBigInt",
  (inst, def) => {
    $ZodBigInt.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json2, params) => bigintProcessor(inst, ctx, json2, params);
  },
  /* @__PURE__ */ util_exports.derived({
    minValue: (inst) => aggregateChecks(inst).minimum ?? null,
    maxValue: (inst) => aggregateChecks(inst).maximum ?? null,
    format: (inst) => aggregateChecks(inst).format ?? null
  }, {
    gte(value, params) {
      return this.check(_gte(value, params));
    },
    min(value, params) {
      return this.check(_gte(value, params));
    },
    gt(value, params) {
      return this.check(_gt(value, params));
    },
    lt(value, params) {
      return this.check(_lt(value, params));
    },
    lte(value, params) {
      return this.check(_lte(value, params));
    },
    max(value, params) {
      return this.check(_lte(value, params));
    },
    positive(params) {
      return this.check(_gt(BigInt(0), params));
    },
    negative(params) {
      return this.check(_lt(BigInt(0), params));
    },
    nonpositive(params) {
      return this.check(_lte(BigInt(0), params));
    },
    nonnegative(params) {
      return this.check(_gte(BigInt(0), params));
    },
    multipleOf(value, params) {
      return this.check(_multipleOf(value, params));
    }
  })
);
function bigint2(params) {
  return _bigint(ZodBigInt, params);
}
var ZodBigIntFormat = /* @__PURE__ */ $constructor("ZodBigIntFormat", (inst, def) => {
  $ZodBigIntFormat.init(inst, def);
  ZodBigInt.init(inst, def);
});
function int64(params) {
  return _int64(ZodBigIntFormat, params);
}
function uint64(params) {
  return _uint64(ZodBigIntFormat, params);
}
var ZodSymbol = /* @__PURE__ */ $constructor("ZodSymbol", (inst, def) => {
  $ZodSymbol.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => symbolProcessor(inst, ctx, json2, params);
});
function symbol(params) {
  return _symbol(ZodSymbol, params);
}
var ZodUndefined = /* @__PURE__ */ $constructor("ZodUndefined", (inst, def) => {
  $ZodUndefined.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => undefinedProcessor(inst, ctx, json2, params);
});
function _undefined3(params) {
  return _undefined2(ZodUndefined, params);
}
var ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
  $ZodNull.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nullProcessor(inst, ctx, json2, params);
});
function _null3(params) {
  return _null2(ZodNull, params);
}
var ZodAny = /* @__PURE__ */ $constructor("ZodAny", (inst, def) => {
  $ZodAny.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => anyProcessor(inst, ctx, json2, params);
});
function any() {
  return _any(ZodAny);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => unknownProcessor(inst, ctx, json2, params);
});
function unknown() {
  return _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => neverProcessor(inst, ctx, json2, params);
});
function never(params) {
  return _never(ZodNever, params);
}
var ZodVoid = /* @__PURE__ */ $constructor("ZodVoid", (inst, def) => {
  $ZodVoid.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => voidProcessor(inst, ctx, json2, params);
});
function _void2(params) {
  return _void(ZodVoid, params);
}
var ZodDate = /* @__PURE__ */ $constructor(
  "ZodDate",
  (inst, def) => {
    $ZodDate.init(inst, def);
    ZodType.init(inst, def);
    inst._zod.processJSONSchema = (ctx, json2, params) => dateProcessor(inst, ctx, json2, params);
    inst.min = (value, params) => inst.check(_gte(value, params));
    inst.max = (value, params) => inst.check(_lte(value, params));
  },
  /* @__PURE__ */ util_exports.derived({
    minDate: (inst) => {
      const { minimum } = aggregateChecks(inst);
      return minimum ? new Date(minimum) : null;
    },
    maxDate: (inst) => {
      const { maximum } = aggregateChecks(inst);
      return maximum ? new Date(maximum) : null;
    }
  }, {})
);
function date2(params) {
  return _date(ZodDate, params);
}
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => arrayProcessor(inst, ctx, json2, params);
  inst.element = def.element;
}, {
  min(n, params) {
    return this.check(_minLength(n, params));
  },
  nonempty(params) {
    return this.check(_minLength(1, params));
  },
  max(n, params) {
    return this.check(_maxLength(n, params));
  },
  length(n, params) {
    return this.check(_length(n, params));
  },
  unwrap() {
    return this.element;
  }
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
function keyof(schema) {
  const shape = schema._zod.def.shape;
  return _enum2(Object.keys(shape));
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => objectProcessor(inst, ctx, json2, params);
  util_exports.installLazyProp(inst, "shape", (self) => self._zod.def.shape, false);
}, {
  keyof() {
    return _enum2(Object.keys(this._zod.def.shape));
  },
  catchall(catchall) {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall }));
  },
  passthrough() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  loose() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: unknown() }));
  },
  strict() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: never() }));
  },
  strip() {
    return this.clone(util_exports.mergeDefs(this._zod.def, { catchall: void 0 }));
  },
  extend(incoming) {
    return util_exports.extend(this, incoming);
  },
  safeExtend(incoming) {
    return util_exports.safeExtend(this, incoming);
  },
  merge(other) {
    return util_exports.merge(this, other);
  },
  pick(mask) {
    return util_exports.pick(this, mask);
  },
  omit(mask) {
    return util_exports.omit(this, mask);
  },
  partial(...args) {
    return util_exports.partial(ZodOptional, this, args[0]);
  },
  exactPartial(...args) {
    return util_exports.partial(ZodExactOptional, this, args[0], "exactPartial");
  },
  required(...args) {
    return util_exports.required(ZodNonOptional, this, args[0]);
  }
});
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...util_exports.normalizeParams(params)
  };
  return new ZodObject(def);
}
function strictObject(shape, params) {
  return new ZodObject({
    type: "object",
    shape,
    catchall: never(),
    ...util_exports.normalizeParams(params)
  });
}
function looseObject(shape, params) {
  return new ZodObject({
    type: "object",
    shape,
    catchall: unknown(),
    ...util_exports.normalizeParams(params)
  });
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => unionProcessor(inst, ctx, json2, params);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...util_exports.normalizeParams(params)
  });
}
var ZodXor = /* @__PURE__ */ $constructor("ZodXor", (inst, def) => {
  ZodUnion.init(inst, def);
  $ZodXor.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => unionProcessor(inst, ctx, json2, params);
  inst.options = def.options;
});
function xor(options, params) {
  return new ZodXor({
    type: "union",
    options,
    inclusive: false,
    ...util_exports.normalizeParams(params)
  });
}
var ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
  ZodUnion.init(inst, def);
  $ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
  return new ZodDiscriminatedUnion({
    type: "union",
    options,
    discriminator,
    ...util_exports.normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => intersectionProcessor(inst, ctx, json2, params);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodTuple = /* @__PURE__ */ $constructor("ZodTuple", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodTuple.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => tupleProcessor(inst, ctx, json2, params);
}, {
  rest(rest) {
    return this.clone({
      ...this._zod.def,
      rest
    });
  },
  partial() {
    const def = this._zod.def;
    if (def.checks?.length)
      throw new Error(".partial() cannot be used on tuple schemas containing refinements");
    return this.clone({
      ...def,
      items: def.items.map((item) => new ZodOptional({ type: "optional", innerType: item }))
    });
  }
});
function tuple(items, _paramsOrRest, _params) {
  const hasRest = _paramsOrRest instanceof $ZodType;
  const params = hasRest ? _params : _paramsOrRest;
  const rest = hasRest ? _paramsOrRest : null;
  return new ZodTuple({
    type: "tuple",
    items,
    rest,
    ...util_exports.normalizeParams(params)
  });
}
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => recordProcessor(inst, ctx, json2, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodRecord({
      type: "record",
      keyType: string2(),
      valueType: keyType,
      ...util_exports.normalizeParams(valueType)
    });
  }
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
function partialRecord(keyType, valueType, params) {
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params),
    partial: true
  });
}
function looseRecord(keyType, valueType, params) {
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    mode: "loose",
    ...util_exports.normalizeParams(params)
  });
}
var ZodMap = /* @__PURE__ */ $constructor("ZodMap", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodMap.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => mapProcessor(inst, ctx, json2, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
  inst.min = (...args) => inst.check(_minSize(...args));
  inst.nonempty = (params) => inst.check(_minSize(1, params));
  inst.max = (...args) => inst.check(_maxSize(...args));
  inst.size = (...args) => inst.check(_size(...args));
});
function map(keyType, valueType, params) {
  return new ZodMap({
    type: "map",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodSet = /* @__PURE__ */ $constructor("ZodSet", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodSet.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => setProcessor(inst, ctx, json2, params);
  inst.min = (...args) => inst.check(_minSize(...args));
  inst.nonempty = (params) => inst.check(_minSize(1, params));
  inst.max = (...args) => inst.check(_maxSize(...args));
  inst.size = (...args) => inst.check(_size(...args));
});
function set(valueType, params) {
  return new ZodSet({
    type: "set",
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => enumProcessor(inst, ctx, json2, params);
  inst.enum = def.entries;
  inst.options = [...inst._zod.values];
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum2(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
function nativeEnum(entries, params) {
  return new ZodEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => literalProcessor(inst, ctx, json2, params);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util_exports.normalizeParams(params)
  });
}
var ZodFile = /* @__PURE__ */ $constructor("ZodFile", (inst, def) => {
  $ZodFile.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => fileProcessor(inst, ctx, json2, params);
  inst.min = (size, params) => inst.check(_minSize(size, params));
  inst.max = (size, params) => inst.check(_maxSize(size, params));
  inst.mime = (types, params) => inst.check(_mime(Array.isArray(types) ? types : [types], params));
});
function file(params) {
  return _file(ZodFile, params);
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => transformProcessor(inst, ctx, json2, params);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(util_exports.issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        if (!("input" in _issue))
          _issue.input = payload.value;
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(util_exports.issue(_issue));
      }
    };
    const output2 = def.transform(payload.value, payload);
    if (output2 instanceof Promise) {
      return output2.then((output3) => {
        payload.value = output3;
        return payload;
      });
    }
    payload.value = output2;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => optionalProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
  $ZodExactOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => optionalProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nullableProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
function nullish2(innerType) {
  return optional(nullable(innerType));
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => defaultProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default2(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => prefaultProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nonoptionalProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodSuccess = /* @__PURE__ */ $constructor("ZodSuccess", (inst, def) => {
  $ZodSuccess.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => successProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function success(innerType) {
  return new ZodSuccess({
    type: "success",
    innerType
  });
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => catchProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch2(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : util_exports.constantCatch(catchValue)
  });
}
var ZodNaN = /* @__PURE__ */ $constructor("ZodNaN", (inst, def) => {
  $ZodNaN.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => nanProcessor(inst, ctx, json2, params);
});
function nan(params) {
  return _nan(ZodNaN, params);
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => pipeProcessor(inst, ctx, json2, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
    // ...util.normalizeParams(params),
  });
}
var ZodCodec = /* @__PURE__ */ $constructor("ZodCodec", (inst, def) => {
  ZodPipe.init(inst, def);
  $ZodCodec.init(inst, def);
});
function codec(in_, out, params) {
  return new ZodCodec({
    type: "pipe",
    in: in_,
    out,
    transform: params.decode,
    reverseTransform: params.encode
  });
}
function invertCodec(codec2) {
  const def = codec2._zod.def;
  return new ZodCodec({
    type: "pipe",
    in: def.out,
    out: def.in,
    transform: def.reverseTransform,
    reverseTransform: def.transform
  });
}
var ZodPreprocess = /* @__PURE__ */ $constructor("ZodPreprocess", (inst, def) => {
  ZodPipe.init(inst, def);
  $ZodPreprocess.init(inst, def);
});
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => readonlyProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodTemplateLiteral = /* @__PURE__ */ $constructor("ZodTemplateLiteral", (inst, def) => {
  $ZodTemplateLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => templateLiteralProcessor(inst, ctx, json2, params);
});
function templateLiteral(parts, params) {
  return new ZodTemplateLiteral({
    type: "template_literal",
    parts,
    ...util_exports.normalizeParams(params)
  });
}
var ZodLazy = /* @__PURE__ */ $constructor("ZodLazy", (inst, def) => {
  $ZodLazy.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => lazyProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.getter();
});
function lazy(getter) {
  return new ZodLazy({
    type: "lazy",
    getter
  });
}
var ZodPromise = /* @__PURE__ */ $constructor("ZodPromise", (inst, def) => {
  $ZodPromise.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => promiseProcessor(inst, ctx, json2, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function promise(innerType) {
  return new ZodPromise({
    type: "promise",
    innerType
  });
}
var ZodFunction = /* @__PURE__ */ $constructor("ZodFunction", (inst, def) => {
  $ZodFunction.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => functionProcessor(inst, ctx, json2, params);
});
function _function(params) {
  return new ZodFunction({
    type: "function",
    input: Array.isArray(params?.input) ? tuple(params?.input) : params?.input ?? array(unknown()),
    output: params?.output ?? unknown()
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json2, params) => customProcessor(inst, ctx, json2, params);
});
var ZodProperties = /* @__PURE__ */ $constructor("ZodProperties", (inst, def) => {
  _ensureDefaultMemoizer();
  $ZodProperties.init(inst, def);
  ZodType.init(inst, def);
});
function properties(shape, params) {
  return _properties(ZodProperties, shape, params);
}
function check(fn) {
  const ch = new $ZodCheck({
    check: "custom"
    // ...util.normalizeParams(params),
  });
  ch._zod.check = fn;
  return ch;
}
function custom(fn, _params) {
  return _custom(ZodCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
  return _superRefine(fn, params);
}
var describe2 = describe;
var meta2 = meta;
var ZodInstanceOf = /* @__PURE__ */ $constructor("ZodInstanceOf", (inst, def) => {
  ZodCustom.init(inst, def);
}, {
  properties(shape, params) {
    return this.check(properties(shape, params));
  }
});
function _instanceof(cls, params = {}) {
  const inst = new ZodInstanceOf({
    type: "custom",
    check: "custom",
    fn: (data) => data instanceof cls,
    abort: true,
    ...util_exports.normalizeParams(params)
  });
  inst._zod.bag.Class = cls;
  inst._zod.check = (payload) => {
    if (!(payload.value instanceof cls)) {
      payload.issues.push({
        code: "invalid_type",
        expected: cls.name,
        input: payload.value,
        inst,
        path: [...inst._zod.def.path ?? []]
      });
    }
  };
  return inst;
}
var stringbool = (...args) => _stringbool({
  Codec: ZodCodec,
  Boolean: ZodBoolean,
  String: ZodString
}, ...args);
function json(params) {
  const jsonSchema = lazy(() => {
    return union([string2(params), number2(), boolean2(), _null3(), array(jsonSchema), record(string2(), jsonSchema)]);
  });
  return jsonSchema;
}
function preprocess(fn, schema) {
  return new ZodPreprocess({
    type: "pipe",
    in: transform(fn),
    out: schema
  });
}

// node_modules/zod/v4/classic/compat.js
var ZodIssueCode = {
  invalid_type: "invalid_type",
  too_big: "too_big",
  too_small: "too_small",
  invalid_format: "invalid_format",
  not_multiple_of: "not_multiple_of",
  unrecognized_keys: "unrecognized_keys",
  invalid_union: "invalid_union",
  invalid_key: "invalid_key",
  invalid_element: "invalid_element",
  invalid_value: "invalid_value",
  custom: "custom"
};
function setErrorMap(map2) {
  config({
    customError: map2
  });
}
function getErrorMap() {
  return config().customError;
}
var ZodFirstPartyTypeKind;
/* @__PURE__ */ (function(ZodFirstPartyTypeKind2) {
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));

// node_modules/zod/v4/classic/iso.js
var iso_exports = {};
__export(iso_exports, {
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  date: () => date3,
  datetime: () => datetime2,
  duration: () => duration2,
  time: () => time2
});
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
function date3(params) {
  return _isoDate(ZodISODate, params);
}
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}

// node_modules/zod/v4/classic/from-json-schema.js
var z = {
  ...schemas_exports2,
  ...checks_exports2,
  iso: iso_exports
};
var RECOGNIZED_KEYS = /* @__PURE__ */ new Set([
  // Schema identification
  "$schema",
  "$ref",
  "$defs",
  "definitions",
  // Core schema keywords
  "$id",
  "id",
  "$comment",
  "$anchor",
  "$vocabulary",
  "$dynamicRef",
  "$dynamicAnchor",
  // Type
  "type",
  "enum",
  "const",
  // Composition
  "anyOf",
  "oneOf",
  "allOf",
  "not",
  // Object
  "properties",
  "required",
  "additionalProperties",
  "patternProperties",
  "propertyNames",
  "minProperties",
  "maxProperties",
  // Array
  "items",
  "prefixItems",
  "additionalItems",
  "minItems",
  "maxItems",
  "uniqueItems",
  "contains",
  "minContains",
  "maxContains",
  // String
  "minLength",
  "maxLength",
  "pattern",
  "format",
  // Number
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "multipleOf",
  // Already handled metadata
  "description",
  "default",
  // Content
  "contentEncoding",
  "contentMediaType",
  "contentSchema",
  // Unsupported (error-throwing)
  "unevaluatedItems",
  "unevaluatedProperties",
  "if",
  "then",
  "else",
  "dependentSchemas",
  "dependentRequired",
  // OpenAPI
  "nullable",
  "readOnly"
]);
function detectVersion(schema, defaultTarget) {
  const $schema = schema.$schema;
  if ($schema === "https://json-schema.org/draft/2020-12/schema") {
    return "draft-2020-12";
  }
  if ($schema === "http://json-schema.org/draft-07/schema#") {
    return "draft-7";
  }
  if ($schema === "http://json-schema.org/draft-04/schema#") {
    return "draft-4";
  }
  return defaultTarget ?? "draft-2020-12";
}
function applyMinItems(items, minItems) {
  return items.map((item, index) => index < minItems ? item : item.optional());
}
function decodeJSONPointerSegment(segment) {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}
function resolveRef(ref, ctx) {
  if (!ref.startsWith("#")) {
    throw new Error("External $ref is not supported, only local refs (#/...) are allowed");
  }
  const path = ref.slice(1).split("/").filter(Boolean);
  if (path.length === 0) {
    return ctx.rootSchema;
  }
  const defsKey = ctx.version === "draft-2020-12" ? "$defs" : "definitions";
  if (path[0] === defsKey) {
    const key = path[1] === void 0 ? void 0 : decodeJSONPointerSegment(path[1]);
    if (!key || !ctx.defs[key]) {
      throw new Error(`Reference not found: ${ref}`);
    }
    return ctx.defs[key];
  }
  throw new Error(`Reference not found: ${ref}`);
}
function checkObjectGuards(objectSchema, guards) {
  const guard = z.transform((value) => value).check((payload) => {
    const value = payload.value;
    if (typeof value !== "object" || value === null || Array.isArray(value))
      return;
    const keys = Object.getOwnPropertyNames(value);
    if (guards.minProperties !== void 0 && keys.length < guards.minProperties) {
      payload.issues.push({
        origin: "object",
        code: "too_small",
        minimum: guards.minProperties,
        inclusive: true,
        message: `Too small: expected object to have >=${guards.minProperties} properties`,
        input: value,
        inst: objectSchema,
        continue: true
      });
    }
    if (guards.maxProperties !== void 0 && keys.length > guards.maxProperties) {
      payload.issues.push({
        origin: "object",
        code: "too_big",
        maximum: guards.maxProperties,
        inclusive: true,
        message: `Too big: expected object to have <=${guards.maxProperties} properties`,
        input: value,
        inst: objectSchema,
        continue: true
      });
    }
    if (guards.keySchema) {
      for (const key of keys) {
        const result = guards.keySchema.safeParse(key);
        if (result.success)
          continue;
        payload.issues.push({
          code: "invalid_key",
          origin: "record",
          issues: result.error.issues,
          input: key,
          path: [key],
          continue: true
        });
      }
    }
  });
  return guard.pipe(objectSchema);
}
function canonicalKey(value, seen) {
  if (value === null)
    return "z";
  const type = typeof value;
  if (type !== "object") {
    if (type === "number" && Number.isNaN(value))
      return null;
    const raw = String(value);
    return `${type[0]}${raw.length}:${raw}`;
  }
  if (seen.has(value))
    return null;
  seen.add(value);
  try {
    if (Array.isArray(value)) {
      const parts2 = [];
      for (const item of value) {
        const key = canonicalKey(item, seen);
        if (key === null)
          return null;
        parts2.push(key);
      }
      return `a${parts2.length}:[${parts2.join(",")}]`;
    }
    const keys = Object.keys(value).sort();
    const parts = [];
    for (const k of keys) {
      const key = canonicalKey(value[k], seen);
      if (key === null)
        return null;
      parts.push(`${k.length}:${k}=${key}`);
    }
    return `o${parts.length}:{${parts.join(",")}}`;
  } finally {
    seen.delete(value);
  }
}
var SCHEMA_KEYWORDS = /* @__PURE__ */ new Set([
  "items",
  "prefixItems",
  "additionalItems",
  "additionalProperties",
  "contains",
  "propertyNames",
  "not",
  "if",
  "then",
  "else",
  "allOf",
  "anyOf",
  "oneOf",
  "unevaluatedItems",
  "unevaluatedProperties",
  "contentSchema"
]);
var SCHEMA_MAP_KEYWORDS = /* @__PURE__ */ new Set([
  "properties",
  "patternProperties",
  "dependentSchemas",
  "dependencies",
  "$defs",
  "definitions"
]);
function containsRef(value) {
  if (typeof value !== "object" || value === null)
    return false;
  if (Array.isArray(value))
    return value.some(containsRef);
  if (typeof value.$ref === "string")
    return true;
  return Object.entries(value).some(([key, sub]) => {
    if (SCHEMA_KEYWORDS.has(key))
      return containsRef(sub);
    if (!SCHEMA_MAP_KEYWORDS.has(key) || typeof sub !== "object" || sub === null)
      return false;
    return Object.values(sub).some(containsRef);
  });
}
function plural(n) {
  return n === 1 ? "element" : "elements";
}
function checkArrayGuards(arraySchema, guards) {
  const guard = z.transform((value) => value).check((payload) => {
    const items = payload.value;
    if (!Array.isArray(items))
      return;
    if (guards.uniqueItems === true) {
      const firstSeen = /* @__PURE__ */ new Map();
      for (let i = 0; i < items.length; i++) {
        const key = canonicalKey(items[i], /* @__PURE__ */ new Set());
        if (key === null)
          continue;
        const first = firstSeen.get(key);
        if (first === void 0) {
          firstSeen.set(key, i);
          continue;
        }
        payload.issues.push({
          code: "custom",
          message: `Array items must be unique: element at index ${i} duplicates the one at index ${first}`,
          input: items,
          path: [i],
          continue: true
        });
      }
    }
    if (guards.containsSchema) {
      const minContains = guards.minContains ?? 1;
      const ceiling = guards.maxContains !== void 0 ? guards.maxContains + 1 : Number.POSITIVE_INFINITY;
      let matches = 0;
      for (const item of items) {
        if (guards.containsSchema.safeParse(item).success && ++matches >= ceiling)
          break;
      }
      if (matches < minContains) {
        payload.issues.push({
          code: "custom",
          message: `Array must contain at least ${minContains} matching ${plural(minContains)}; found ${matches}`,
          input: items,
          continue: true
        });
      }
      if (guards.maxContains !== void 0 && matches > guards.maxContains) {
        payload.issues.push({
          code: "custom",
          message: `Array must contain at most ${guards.maxContains} matching ${plural(guards.maxContains)}`,
          input: items,
          continue: true
        });
      }
    }
  });
  return guard.pipe(arraySchema);
}
function getTupleRest(restSchema, ctx) {
  if (restSchema === false) {
    return void 0;
  }
  if (restSchema === void 0 || restSchema === true) {
    return z.any();
  }
  return convertSchema(restSchema, ctx);
}
var fullTime = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
function convertBaseSchema(schema, ctx) {
  if (schema.not !== void 0) {
    if (typeof schema.not === "object" && Object.keys(schema.not).length === 0) {
      return z.never();
    }
    throw new Error("not is not supported in Zod (except { not: {} } for never)");
  }
  if (schema.unevaluatedItems !== void 0) {
    throw new Error("unevaluatedItems is not supported");
  }
  if (schema.unevaluatedProperties !== void 0) {
    throw new Error("unevaluatedProperties is not supported");
  }
  if (schema.if !== void 0 || schema.then !== void 0 || schema.else !== void 0) {
    throw new Error("Conditional schemas (if/then/else) are not supported");
  }
  if (schema.dependentSchemas !== void 0 || schema.dependentRequired !== void 0) {
    throw new Error("dependentSchemas and dependentRequired are not supported");
  }
  if (schema.$ref) {
    const refPath = schema.$ref;
    if (ctx.refs.has(refPath)) {
      return ctx.refs.get(refPath);
    }
    if (ctx.processing.has(refPath)) {
      return z.lazy(() => {
        if (!ctx.refs.has(refPath)) {
          throw new Error(`Circular reference not resolved: ${refPath}`);
        }
        return ctx.refs.get(refPath);
      });
    }
    ctx.processing.add(refPath);
    const resolved = resolveRef(refPath, ctx);
    const zodSchema2 = convertSchema(resolved, ctx);
    ctx.refs.set(refPath, zodSchema2);
    ctx.processing.delete(refPath);
    return zodSchema2;
  }
  if (schema.enum !== void 0) {
    const enumValues = schema.enum;
    if (ctx.version === "openapi-3.0" && schema.nullable === true && enumValues.length === 1 && enumValues[0] === null) {
      return z.null();
    }
    if (enumValues.length === 0) {
      return z.never();
    }
    if (enumValues.length === 1) {
      return z.literal(enumValues[0]);
    }
    if (enumValues.every((v) => typeof v === "string")) {
      return z.enum(enumValues);
    }
    const literalSchemas = enumValues.map((v) => z.literal(v));
    if (literalSchemas.length < 2) {
      return literalSchemas[0];
    }
    return z.union([literalSchemas[0], literalSchemas[1], ...literalSchemas.slice(2)]);
  }
  if (schema.const !== void 0) {
    return z.literal(schema.const);
  }
  const type = schema.type;
  if (Array.isArray(type)) {
    const typeSchemas = type.map((t) => {
      const typeSchema = { ...schema, type: t };
      return convertBaseSchema(typeSchema, ctx);
    });
    if (typeSchemas.length === 0) {
      return z.never();
    }
    if (typeSchemas.length === 1) {
      return typeSchemas[0];
    }
    return z.union(typeSchemas);
  }
  if (!type) {
    return z.any();
  }
  let zodSchema;
  switch (type) {
    case "string": {
      let stringSchema = z.string();
      if (schema.format) {
        const format = schema.format;
        if (format === "email") {
          stringSchema = stringSchema.check(z.email());
        } else if (format === "uri" || format === "uri-reference") {
          stringSchema = stringSchema.check(z.url());
        } else if (format === "uuid" || format === "guid") {
          stringSchema = stringSchema.check(z.uuid());
        } else if (format === "date-time") {
          stringSchema = stringSchema.check(z.iso.datetime({ offset: true }));
        } else if (format === "date") {
          stringSchema = stringSchema.check(z.iso.date());
        } else if (format === "time") {
          stringSchema = stringSchema.check(z.regex(fullTime));
        } else if (format === "duration") {
          stringSchema = stringSchema.check(z.iso.duration());
        } else if (format === "hostname") {
          stringSchema = stringSchema.check(z.hostname());
        } else if (format === "ipv4") {
          stringSchema = stringSchema.check(z.ipv4());
        } else if (format === "ipv6") {
          stringSchema = stringSchema.check(z.ipv6());
        } else if (format === "mac") {
          stringSchema = stringSchema.check(z.mac());
        } else if (format === "cidr") {
          stringSchema = stringSchema.check(z.cidrv4());
        } else if (format === "cidr-v6") {
          stringSchema = stringSchema.check(z.cidrv6());
        } else if (format === "base64") {
          stringSchema = stringSchema.check(z.base64());
        } else if (format === "base64url") {
          stringSchema = stringSchema.check(z.base64url());
        } else if (format === "e164") {
          stringSchema = stringSchema.check(z.e164());
        } else if (format === "credit_card") {
          stringSchema = stringSchema.check(z.creditCard());
        } else if (format === "iban") {
          stringSchema = stringSchema.check(z.iban());
        } else if (format === "jwt") {
          stringSchema = stringSchema.check(z.jwt());
        } else if (format === "emoji") {
          stringSchema = stringSchema.check(z.emoji());
        } else if (format === "nanoid") {
          stringSchema = stringSchema.check(z.nanoid());
        } else if (format === "cuid") {
          stringSchema = stringSchema.check(z.cuid());
        } else if (format === "cuid2") {
          stringSchema = stringSchema.check(z.cuid2());
        } else if (format === "ulid") {
          stringSchema = stringSchema.check(z.ulid());
        } else if (format === "xid") {
          stringSchema = stringSchema.check(z.xid());
        } else if (format === "ksuid") {
          stringSchema = stringSchema.check(z.ksuid());
        }
      }
      if (typeof schema.minLength === "number") {
        stringSchema = stringSchema.min(schema.minLength);
      }
      if (typeof schema.maxLength === "number") {
        stringSchema = stringSchema.max(schema.maxLength);
      }
      if (schema.pattern) {
        stringSchema = stringSchema.regex(new RegExp(schema.pattern));
      }
      zodSchema = stringSchema;
      break;
    }
    case "number":
    case "integer": {
      let numberSchema = type === "integer" ? z.number().int() : z.number();
      if (typeof schema.minimum === "number" && schema.exclusiveMinimum !== true) {
        numberSchema = numberSchema.min(schema.minimum);
      }
      if (typeof schema.maximum === "number" && schema.exclusiveMaximum !== true) {
        numberSchema = numberSchema.max(schema.maximum);
      }
      if (typeof schema.exclusiveMinimum === "number") {
        numberSchema = numberSchema.gt(schema.exclusiveMinimum);
      } else if (schema.exclusiveMinimum === true && typeof schema.minimum === "number") {
        numberSchema = numberSchema.gt(schema.minimum);
      }
      if (typeof schema.exclusiveMaximum === "number") {
        numberSchema = numberSchema.lt(schema.exclusiveMaximum);
      } else if (schema.exclusiveMaximum === true && typeof schema.maximum === "number") {
        numberSchema = numberSchema.lt(schema.maximum);
      }
      if (typeof schema.multipleOf === "number") {
        numberSchema = numberSchema.multipleOf(schema.multipleOf);
      }
      zodSchema = numberSchema;
      break;
    }
    case "boolean": {
      zodSchema = z.boolean();
      break;
    }
    case "null": {
      zodSchema = z.null();
      break;
    }
    case "object": {
      const shape = {};
      const properties2 = schema.properties || {};
      const requiredSet = new Set(schema.required || []);
      const additionalSchema = typeof schema.additionalProperties === "object" ? convertSchema(schema.additionalProperties, ctx) : void 0;
      for (const [key, propSchema] of Object.entries(properties2)) {
        const propZodSchema = convertSchema(propSchema, ctx);
        assignProp(shape, key, requiredSet.has(key) ? propZodSchema : propZodSchema.optional());
      }
      if (schema.patternProperties) {
        const patternProps = schema.patternProperties;
        const patternKeys = Object.keys(patternProps);
        const looseRecords = [];
        for (const pattern of patternKeys) {
          const patternValue = convertSchema(patternProps[pattern], ctx);
          const keySchema = z.string().regex(new RegExp(pattern));
          looseRecords.push(z.looseRecord(keySchema, patternValue));
        }
        const schemasToIntersect = [];
        if (Object.keys(shape).length > 0) {
          schemasToIntersect.push(z.object(shape).passthrough());
        }
        schemasToIntersect.push(...looseRecords);
        if (schemasToIntersect.length === 0) {
          zodSchema = z.object({}).passthrough();
        } else if (schemasToIntersect.length === 1) {
          zodSchema = schemasToIntersect[0];
        } else {
          let result = z.intersection(schemasToIntersect[0], schemasToIntersect[1]);
          for (let i = 2; i < schemasToIntersect.length; i++) {
            result = z.intersection(result, schemasToIntersect[i]);
          }
          zodSchema = result;
        }
        if (schema.additionalProperties === false) {
          const propertyKeys = Object.keys(shape);
          const patterns = patternKeys.map((p) => new RegExp(p));
          const basePatternSchema = zodSchema;
          zodSchema = zodSchema.check((payload) => {
            if (!isPlainObject(payload.value))
              return;
            const unrecognized = [];
            for (const key of Object.keys(payload.value)) {
              if (propertyKeys.includes(key))
                continue;
              if (patterns.some((regex) => regex.test(key)))
                continue;
              unrecognized.push(key);
            }
            if (unrecognized.length) {
              payload.issues.push({
                code: "unrecognized_keys",
                keys: unrecognized,
                input: payload.value,
                inst: basePatternSchema
              });
            }
          });
        }
      } else {
        const objectSchema = z.object(shape);
        if (schema.additionalProperties === false) {
          zodSchema = objectSchema.strict();
        } else if (additionalSchema) {
          zodSchema = objectSchema.catchall(additionalSchema);
        } else {
          zodSchema = objectSchema.passthrough();
        }
      }
      const hasKeyGuard = schema.propertyNames !== void 0 && schema.propertyNames !== true;
      const minProperties = typeof schema.minProperties === "number" ? schema.minProperties : void 0;
      const maxProperties = typeof schema.maxProperties === "number" ? schema.maxProperties : void 0;
      if (hasKeyGuard || minProperties !== void 0 || maxProperties !== void 0) {
        let keySchema;
        if (hasKeyGuard) {
          const keyJSONSchema = typeof schema.propertyNames === "object" && schema.propertyNames.type === void 0 ? { type: "string", ...schema.propertyNames } : schema.propertyNames;
          keySchema = convertSchema(keyJSONSchema, ctx);
        }
        zodSchema = checkObjectGuards(zodSchema, { keySchema, minProperties, maxProperties });
      }
      break;
    }
    case "array": {
      const prefixItems = schema.prefixItems;
      const items = schema.items;
      if (prefixItems && Array.isArray(prefixItems)) {
        const minItems = typeof schema.minItems === "number" ? schema.minItems : 0;
        const tupleItems = prefixItems.map((item) => convertSchema(item, ctx));
        const positionalItems = applyMinItems(tupleItems, minItems);
        const rest = !Array.isArray(items) ? getTupleRest(items, ctx) : void 0;
        const tupleSchema = z.tuple(positionalItems);
        zodSchema = rest ? tupleSchema.rest(rest) : tupleSchema;
        if (typeof schema.minItems === "number") {
          zodSchema = zodSchema.check(z.minLength(schema.minItems));
        }
        if (typeof schema.maxItems === "number") {
          zodSchema = zodSchema.check(z.maxLength(schema.maxItems));
        }
      } else if (Array.isArray(items)) {
        const minItems = typeof schema.minItems === "number" ? schema.minItems : 0;
        const tupleItems = items.map((item) => convertSchema(item, ctx));
        const positionalItems = applyMinItems(tupleItems, minItems);
        const rest = getTupleRest(schema.additionalItems, ctx);
        const tupleSchema = z.tuple(positionalItems);
        zodSchema = rest ? tupleSchema.rest(rest) : tupleSchema;
        if (typeof schema.minItems === "number") {
          zodSchema = zodSchema.check(z.minLength(schema.minItems));
        }
        if (typeof schema.maxItems === "number") {
          zodSchema = zodSchema.check(z.maxLength(schema.maxItems));
        }
      } else if (items !== void 0) {
        const element = convertSchema(items, ctx);
        let arraySchema = z.array(element);
        if (typeof schema.minItems === "number") {
          arraySchema = arraySchema.min(schema.minItems);
        }
        if (typeof schema.maxItems === "number") {
          arraySchema = arraySchema.max(schema.maxItems);
        }
        zodSchema = arraySchema;
      } else {
        zodSchema = z.array(z.any());
      }
      if (schema.uniqueItems === true || schema.contains !== void 0) {
        zodSchema = checkArrayGuards(zodSchema, {
          uniqueItems: schema.uniqueItems === true,
          containsSchema: schema.contains !== void 0 ? convertSchema(schema.contains, ctx) : void 0,
          minContains: typeof schema.minContains === "number" ? schema.minContains : void 0,
          maxContains: typeof schema.maxContains === "number" ? schema.maxContains : void 0
        });
      }
      break;
    }
    default:
      throw new Error(`Unsupported type: ${type}`);
  }
  return zodSchema;
}
function convertSchema(schema, ctx) {
  if (typeof schema === "boolean") {
    return schema ? z.any() : z.never();
  }
  let baseSchema = convertBaseSchema(schema, ctx);
  const hasExplicitType = schema.type || schema.enum !== void 0 || schema.const !== void 0;
  if (schema.anyOf && Array.isArray(schema.anyOf)) {
    const options = schema.anyOf.map((s) => convertSchema(s, ctx));
    const anyOfUnion = z.union(options);
    baseSchema = hasExplicitType ? z.intersection(baseSchema, anyOfUnion) : anyOfUnion;
  }
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    const options = schema.oneOf.map((s) => convertSchema(s, ctx));
    const oneOfUnion = z.xor(options);
    baseSchema = hasExplicitType ? z.intersection(baseSchema, oneOfUnion) : oneOfUnion;
  }
  if (schema.allOf && Array.isArray(schema.allOf)) {
    if (schema.allOf.length === 0) {
      baseSchema = hasExplicitType ? baseSchema : z.any();
    } else {
      let result = hasExplicitType ? baseSchema : convertSchema(schema.allOf[0], ctx);
      const startIdx = hasExplicitType ? 0 : 1;
      for (let i = startIdx; i < schema.allOf.length; i++) {
        result = z.intersection(result, convertSchema(schema.allOf[i], ctx));
      }
      baseSchema = result;
    }
  }
  if (schema.nullable === true && ctx.version === "openapi-3.0") {
    baseSchema = z.nullable(baseSchema);
  }
  if (schema.readOnly === true) {
    baseSchema = z.readonly(baseSchema);
  }
  if (schema.default !== void 0) {
    baseSchema = baseSchema.default(schema.default);
  }
  const extraMeta = {};
  const coreMetadataKeys = ["$id", "id", "$comment", "$anchor", "$vocabulary", "$dynamicRef", "$dynamicAnchor"];
  for (const key of coreMetadataKeys) {
    if (key in schema) {
      extraMeta[key] = schema[key];
    }
  }
  const contentMetadataKeys = ["contentEncoding", "contentMediaType", "contentSchema"];
  for (const key of contentMetadataKeys) {
    if (key in schema) {
      extraMeta[key] = schema[key];
    }
  }
  if (schema.type === "object" && schema.$ref === void 0) {
    if (schema.propertyNames !== void 0 && !containsRef(schema.propertyNames)) {
      extraMeta.propertyNames = schema.propertyNames;
    }
    for (const key of ["minProperties", "maxProperties"]) {
      if (schema[key] !== void 0)
        extraMeta[key] = schema[key];
    }
  }
  if (schema.type === "array" && schema.$ref === void 0) {
    if (schema.contains !== void 0 && !containsRef(schema.contains)) {
      extraMeta.contains = schema.contains;
    }
    for (const key of ["uniqueItems", "minContains", "maxContains"]) {
      if (schema[key] !== void 0)
        extraMeta[key] = schema[key];
    }
  }
  for (const key of Object.keys(schema)) {
    if (!RECOGNIZED_KEYS.has(key)) {
      assignProp(extraMeta, key, schema[key]);
    }
  }
  if (Object.keys(extraMeta).length > 0) {
    ctx.registry.add(baseSchema, extraMeta);
  }
  if (schema.description) {
    baseSchema = baseSchema.describe(schema.description);
  }
  return baseSchema;
}
function fromJSONSchema(schema, params) {
  if (typeof schema === "boolean") {
    return schema ? z.any() : z.never();
  }
  let normalized;
  try {
    normalized = JSON.parse(JSON.stringify(schema));
  } catch {
    throw new Error("fromJSONSchema input is not valid JSON (possibly cyclic); use $defs/$ref for recursive schemas");
  }
  const version2 = detectVersion(normalized, params?.defaultTarget);
  const defs = normalized.$defs || normalized.definitions || {};
  const ctx = {
    version: version2,
    defs,
    refs: /* @__PURE__ */ new Map(),
    processing: /* @__PURE__ */ new Set(),
    rootSchema: normalized,
    registry: params?.registry ?? globalRegistry
  };
  return convertSchema(normalized, ctx);
}

// node_modules/zod/v4/core/visit.js
var RESOLVING = Symbol("z.visit/resolving");
function visit(schema, fnOrHandlers) {
  const fn = typeof fnOrHandlers === "function" ? fnOrHandlers : (node2, rewritten) => {
    const h = fnOrHandlers[node2._zod.def.type];
    return h ? h(node2, rewritten) : node2;
  };
  const cache = /* @__PURE__ */ new Map();
  function run(s) {
    const cached2 = cache.get(s);
    if (cached2 === RESOLVING) {
      return new $ZodLazy({
        type: "lazy",
        getter: () => cache.get(s)
      });
    }
    if (cached2 !== void 0)
      return cached2;
    cache.set(s, RESOLVING);
    const inner = mapInner(s);
    const mapped = fn(inner, inner !== s);
    cache.set(s, mapped);
    return mapped;
  }
  function mapInner(s) {
    const def = s._zod.def;
    const kind = def.type;
    switch (kind) {
      case "object": {
        const oldShape = def.shape;
        const keys = Object.keys(oldShape);
        let changed = false;
        const newShape = {};
        for (const k of keys) {
          const mapped = run(oldShape[k]);
          if (mapped !== oldShape[k])
            changed = true;
          newShape[k] = mapped;
        }
        let newCatchall = def.catchall;
        if (def.catchall) {
          newCatchall = run(def.catchall);
          if (newCatchall !== def.catchall)
            changed = true;
        }
        return changed ? clone(s, { ...def, shape: newShape, catchall: newCatchall }) : s;
      }
      case "array": {
        const mapped = run(def.element);
        return mapped === def.element ? s : clone(s, { ...def, element: mapped });
      }
      case "tuple": {
        const oldItems = def.items;
        let changed = false;
        const newItems = [];
        for (const item of oldItems) {
          const mapped = run(item);
          if (mapped !== item)
            changed = true;
          newItems.push(mapped);
        }
        let newRest = def.rest;
        if (def.rest) {
          newRest = run(def.rest);
          if (newRest !== def.rest)
            changed = true;
        }
        return changed ? clone(s, { ...def, items: newItems, rest: newRest }) : s;
      }
      case "record":
      case "map": {
        const newKey = run(def.keyType);
        const newVal = run(def.valueType);
        return newKey === def.keyType && newVal === def.valueType ? s : clone(s, { ...def, keyType: newKey, valueType: newVal });
      }
      case "set": {
        const newVal = run(def.valueType);
        return newVal === def.valueType ? s : clone(s, { ...def, valueType: newVal });
      }
      case "union": {
        const oldOptions = def.options;
        let changed = false;
        const newOptions = [];
        for (const opt of oldOptions) {
          const mapped = run(opt);
          if (mapped !== opt)
            changed = true;
          newOptions.push(mapped);
        }
        return changed ? clone(s, { ...def, options: newOptions }) : s;
      }
      case "intersection": {
        const newLeft = run(def.left);
        const newRight = run(def.right);
        return newLeft === def.left && newRight === def.right ? s : clone(s, { ...def, left: newLeft, right: newRight });
      }
      case "optional":
      case "nullable":
      case "default":
      case "prefault":
      case "catch":
      case "readonly":
      case "nonoptional":
      case "promise":
      case "success": {
        const newInner = run(def.innerType);
        return newInner === def.innerType ? s : clone(s, { ...def, innerType: newInner });
      }
      case "pipe": {
        const newIn = run(def.in);
        const newOut = run(def.out);
        return newIn === def.in && newOut === def.out ? s : clone(s, { ...def, in: newIn, out: newOut });
      }
      case "function": {
        const newInput = run(def.input);
        const newOutput = run(def.output);
        return newInput === def.input && newOutput === def.output ? s : clone(s, { ...def, input: newInput, output: newOutput });
      }
      case "lazy": {
        const original = def.getter;
        const { _cachedInner, ...rest } = def;
        return clone(s, { ...rest, getter: () => run(original()) });
      }
      case "properties": {
        const oldShape = def.shape;
        let changed = false;
        const newShape = {};
        for (const k of Reflect.ownKeys(oldShape)) {
          const mapped = run(oldShape[k]);
          if (mapped !== oldShape[k])
            changed = true;
          newShape[k] = mapped;
        }
        return changed ? clone(s, { ...def, shape: newShape }) : s;
      }
      // A leaf by choice: `parts` are regex fragments, not data positions.
      case "template_literal":
      // Leaves.
      case "string":
      case "number":
      case "int":
      case "boolean":
      case "bigint":
      case "symbol":
      case "undefined":
      case "null":
      case "void":
      case "never":
      case "any":
      case "unknown":
      case "date":
      case "nan":
      case "enum":
      case "literal":
      case "file":
      case "transform":
      case "custom":
        return s;
      default: {
        kind;
        return s;
      }
    }
  }
  return run(schema);
}

// node_modules/zod/v4/classic/deep-partial.js
function deepPartial(schema) {
  return visit(schema, {
    object: (s) => s.partial(),
    // Every partialed option now admits `undefined`, which the constructor rejects as a duplicate.
    union: (s) => {
      const def = s._zod.def;
      return def.discriminator === void 0 ? s : union(def.options);
    }
  });
}

// node_modules/zod/v4/classic/in-out.js
function withChecks(side, checks) {
  if (!checks?.length)
    return side;
  const def = side._zod.def;
  return clone(side, mergeDefs(def, { checks: [...def.checks ?? [], ...checks] }), { parent: true });
}
function outSide(def) {
  return withChecks(def.out, def.checks);
}
function inSide(def) {
  return def.in._zod.traits.has("$ZodTransform") ? outSide(def) : def.in;
}
function input(schema) {
  return visit(schema, {
    pipe: (s) => inSide(s._zod.def),
    // A default value belongs to the output side, so a rewritten inner type leaves it stranded. `.default()` widens the declared input type with `undefined`, and `optional` is what carries that across.
    default: (s, rewritten) => rewritten ? optional(s._zod.def.innerType) : s,
    // A catch value is output-side too, but `.catch()` leaves the declared input type alone, so the inner schema stands on its own.
    catch: (s, rewritten) => rewritten ? s._zod.def.innerType : s
  });
}
function output(schema) {
  return visit(schema, {
    pipe: (s) => outSide(s._zod.def),
    // A prefault value is fed through the schema, which makes it input-side, so a rewritten inner type leaves it stranded.
    prefault: (s, rewritten) => rewritten ? s._zod.def.innerType : s
  });
}

// node_modules/zod/v4/classic/coerce.js
var coerce_exports = {};
__export(coerce_exports, {
  bigint: () => bigint3,
  boolean: () => boolean3,
  date: () => date4,
  number: () => number3,
  string: () => string3
});
function string3(params) {
  return _coercedString(ZodString, params);
}
function number3(params) {
  return _coercedNumber(ZodNumber, params);
}
function boolean3(params) {
  return _coercedBoolean(ZodBoolean, params);
}
function bigint3(params) {
  return _coercedBigint(ZodBigInt, params);
}
function date4(params) {
  return _coercedDate(ZodDate, params);
}

// lib/remote-schemas.js
var expertSchema = external_exports.object({
  slug: external_exports.string(),
  name: external_exports.string(),
  nameEn: external_exports.string(),
  description: external_exports.string(),
  descriptionEn: external_exports.string(),
  emoji: external_exports.string(),
  division: external_exports.string(),
  divisionZh: external_exports.string(),
  divisionEn: external_exports.string(),
  conflict: external_exports.boolean().optional(),
  /** 用户自建专家（可编辑/可删除）；内置专家不带此标记。 */
  custom: external_exports.boolean().optional(),
  /** 自建专家文件指纹：编辑/删除时回传，用于拦住并发覆盖。 */
  hash: external_exports.string().optional(),
  /**
   * 云端附件状态（2026-09-29 附件上云）。
   *
   * - `local`：这位专家的附件随包发布、本来就在本地，没有要下载的东西；
   * - `ready`：附件已从云端下载并校验过；
   * - `missing`：附件在云端、本地还没有 —— 面板与 `@` 弹窗据此显示「下载」按钮。
   */
  assets: external_exports.enum(["local", "ready", "missing"]).optional()
});
var assetsFetchSchema = external_exports.object({
  status: external_exports.string(),
  bytes: external_exports.number(),
  reason: external_exports.string()
});
var customExpertInputSchema = external_exports.object({
  slug: external_exports.string().min(1).max(128).optional(),
  name: external_exports.string().min(1).max(200),
  nameEn: external_exports.string().max(200).optional(),
  description: external_exports.string().min(1).max(1e3),
  descriptionEn: external_exports.string().max(1e3).optional(),
  emoji: external_exports.string().max(16).optional(),
  body: external_exports.string().min(1).max(6e4),
  /** 落点分区（自建分区目录名）；留空＝默认分区。服务端仍会自己校验一遍。 */
  division: external_exports.string().max(128).optional(),
  /** 新建分区时的中文显示名（落在 <customRoot>/divisions.json）。 */
  divisionLabel: external_exports.string().max(40).optional()
});
var catalogSnapshotSchema = external_exports.object({
  experts: external_exports.array(expertSchema),
  enabled: external_exports.array(external_exports.string()),
  revision: external_exports.number().int().min(0),
  // 这两个字段必须声明：zod 会把 schema 里没有的键**直接剥掉**（实测），
  // 漏声明时面板拿到的快照里根本没有它们，界面上表现为"分区标签是空的"。
  customDivision: external_exports.string().optional(),
  customDivisionLabel: external_exports.string().optional(),
  /**
   * 名册健康状态。
   *
   * ⚠️ 这个字段在 0.4.6 之前**一直没声明**：host 侧早就在快照里返回它、注释也写着
   * 「面板可以据此提示『中文侧车没找到 / 有 N 个专家文件被跳过』」，但 zod 会把它剥掉 ——
   * 面板永远收不到。于是"中文侧车没找到"这种会让整个名册**静默变全英文**的状况，
   * 用户在界面上看不到任何线索，只能对着一片英文名猜。
   * 与上面 `customDivision` 那两个字段是同一个坑（那里的注释已经警告过"漏声明会被剥掉"），
   * 只是这次踩在一个嵌套对象上，更不容易被发现。
   */
  sidecar: external_exports.object({
    zhRoot: external_exports.string(),
    present: external_exports.boolean(),
    skippedFiles: external_exports.number().int().min(0),
    unreadableDivisions: external_exports.array(external_exports.string())
  }).optional(),
  /** 可选的落点分类（面板「分类」下拉与管理页）：官方在前，其余按目录/声明发现。 */
  categories: external_exports.array(external_exports.object({
    key: external_exports.string(),
    label: external_exports.string(),
    official: external_exports.boolean(),
    count: external_exports.number().int().min(0),
    customCount: external_exports.number().int().min(0)
  })).optional()
});
var enabledStateSchema = external_exports.object({
  enabled: external_exports.array(external_exports.string()),
  revision: external_exports.number().int().min(0)
});
var promptSchema = external_exports.object({ prompt: external_exports.string() });

// lib/skill-gate/remote-schemas.js
var MAX_VIEWS = 256;
var skillRowSchema = external_exports.object({
  name: external_exports.string().min(1).max(128),
  description: external_exports.string().max(400),
  source: external_exports.string().min(1).max(64),
  provider: external_exports.string().min(1).max(64),
  nativeModel: external_exports.boolean(),
  nativeUser: external_exports.boolean(),
  gated: external_exports.boolean(),
  modelVisible: external_exports.boolean(),
  /** 这条技能出现在哪些视角里；面板按视角过滤时用它。 */
  views: external_exports.array(external_exports.string().min(1).max(128)).max(MAX_VIEWS)
});
var countsSchema = external_exports.object({
  total: external_exports.number().int().min(0),
  modelVisible: external_exports.number().int().min(0),
  gated: external_exports.number().int().min(0),
  nativeOff: external_exports.number().int().min(0)
});
var viewRowSchema = external_exports.object({
  key: external_exports.string().min(1).max(128),
  kind: external_exports.string().min(1).max(32),
  name: external_exports.string().max(120),
  total: external_exports.number().int().min(0),
  modelVisible: external_exports.number().int().min(0),
  gated: external_exports.number().int().min(0),
  nativeOff: external_exports.number().int().min(0)
});
var snapshotSchema = external_exports.object({
  revision: external_exports.number().int().min(0),
  storePath: external_exports.string().min(1).max(1024),
  skills: external_exports.array(skillRowSchema).max(4e3),
  counts: countsSchema,
  views: external_exports.array(viewRowSchema).max(MAX_VIEWS)
});

// src/client/remote.js
function directIn(namespace, method, parameters, typeSymbol, schema) {
  return {
    id: `${PLUGIN_ID}#${namespace}/${method}`,
    service: namespace,
    namespace,
    method,
    invocation: { kind: "direct" },
    parameters,
    result: { mode: "strict", typeSymbol, schema, create: () => schema }
  };
}
function direct(method, parameters, typeSymbol, schema) {
  return directIn("tTeam", method, parameters, typeSymbol, schema);
}
var TYPERT_REMOTE = {
  package: PLUGIN_ID,
  descriptors: [
    direct("getCatalog", [], "TTeamCatalog", catalogSnapshotSchema),
    // 本地已有的专家头像（data URL）—— 必须与宿主 descriptor 成对，否则 verify 会拦。
    direct("getAvatars", [], "TTeamCatalog", external_exports.record(external_exports.string(), external_exports.string())),
    // 云端附件（2026-09-29）：面板与 @ 弹窗里那个「下载」按钮走这里。
    direct("fetchAssets", [
      { name: "slug", wire: "slug", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: external_exports.string().min(1).max(128), create: () => external_exports.string().min(1).max(128) } }
    ], "TTeamAssets", assetsFetchSchema),
    // ---- 技能开关（2026-09-28 从 dsh-plugin-skill-gate 并入）----
    // 挂在同一个 tTeam 命名空间下：合并时先做成独立入口（skillGate），实机上没能挂上
    // （`ctx.get("remote.skillGate")` 始终 undefined），改走这条已被证明可用的通路。
    direct("getSnapshot", [], "SkillGateSnapshot", snapshotSchema),
    direct("setDisabled", [
      {
        name: "disabled",
        wire: "disabled",
        source: "json",
        codec: { mode: "strict", typeSymbol: "string[]", schema: external_exports.array(external_exports.string().max(128)).max(4e3), create: () => external_exports.array(external_exports.string().max(128)).max(4e3) }
      },
      {
        name: "expectedRevision",
        wire: "expectedRevision",
        source: "json",
        codec: { mode: "strict", typeSymbol: "number", schema: external_exports.number().int().min(0), create: () => external_exports.number().int().min(0) }
      }
    ], "SkillGateSnapshot", snapshotSchema),
    direct("setEnabled", [
      { name: "enabled", wire: "enabled", source: "json", codec: { mode: "strict", typeSymbol: "string[]", schema: external_exports.array(external_exports.string()), create: () => external_exports.array(external_exports.string()) } },
      { name: "expectedRevision", wire: "expectedRevision", source: "json", codec: { mode: "strict", typeSymbol: "number", schema: external_exports.number().int().min(0), create: () => external_exports.number().int().min(0) } }
    ], "TTeamEnabledState", enabledStateSchema),
    direct("getPrompt", [
      { name: "slug", wire: "slug", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: external_exports.string().min(1).max(128), create: () => external_exports.string().min(1).max(128) } },
      { name: "division", wire: "division", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: external_exports.string().min(1).max(64), create: () => external_exports.string().min(1).max(64) } }
    ], "TTeamPrompt", promptSchema),
    direct("createExpert", [
      { name: "expert", wire: "expert", source: "json", codec: { mode: "strict", typeSymbol: "TTeamCustomExpertInput", schema: customExpertInputSchema, create: () => customExpertInputSchema } }
    ], "TTeamCatalog", catalogSnapshotSchema),
    direct("updateExpert", [
      { name: "slug", wire: "slug", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: external_exports.string().min(1).max(128), create: () => external_exports.string().min(1).max(128) } },
      { name: "expert", wire: "expert", source: "json", codec: { mode: "strict", typeSymbol: "TTeamCustomExpertInput", schema: customExpertInputSchema, create: () => customExpertInputSchema } },
      { name: "expectedHash", wire: "expectedHash", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: external_exports.string().max(64), create: () => external_exports.string().max(64) } }
    ], "TTeamCatalog", catalogSnapshotSchema),
    direct("deleteExpert", [
      { name: "slug", wire: "slug", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: external_exports.string().min(1).max(128), create: () => external_exports.string().min(1).max(128) } },
      { name: "expectedHash", wire: "expectedHash", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: external_exports.string().max(64), create: () => external_exports.string().max(64) } }
    ], "TTeamCatalog", catalogSnapshotSchema),
    direct("createCategory", [
      { name: "key", wire: "key", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: external_exports.string().min(1).max(128), create: () => external_exports.string().min(1).max(128) } },
      { name: "label", wire: "label", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: external_exports.string().max(40), create: () => external_exports.string().max(40) } }
    ], "TTeamCatalog", catalogSnapshotSchema),
    direct("updateCategory", [
      { name: "key", wire: "key", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: external_exports.string().min(1).max(128), create: () => external_exports.string().min(1).max(128) } },
      { name: "label", wire: "label", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: external_exports.string().max(40), create: () => external_exports.string().max(40) } }
    ], "TTeamCatalog", catalogSnapshotSchema),
    direct("deleteCategory", [
      { name: "key", wire: "key", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: external_exports.string().min(1).max(128), create: () => external_exports.string().min(1).max(128) } }
    ], "TTeamCatalog", catalogSnapshotSchema)
  ]
};
function unwrap2(result, action) {
  if (result !== null && typeof result === "object" && typeof result.ok === "boolean") {
    if (result.ok !== true) {
      const error62 = new Error(result.error?.message ?? `${action} failed`);
      error62.code = result.error?.code;
      throw error62;
    }
    return result.value;
  }
  return result;
}

// src/client/settings.jsx
var import_react5 = __toESM(require("react"), 1);

// src/client/tabs.jsx
var import_react3 = __toESM(require("react"), 1);

// src/client/ui.jsx
var import_react2 = __toESM(require("react"), 1);
var primitives = __toESM(require("@deepseek-ai/dsh-client-ui-primitives"), 1);
var PButton = typeof primitives.Button === "function" ? primitives.Button : null;
var PInput = typeof primitives.Input === "function" ? primitives.Input : null;
var PTabs = typeof primitives.SegmentedTabs === "function" ? primitives.SegmentedTabs : null;
var PModal = typeof primitives.Modal === "function" ? primitives.Modal : null;
var PTag = typeof primitives.Tag === "function" ? primitives.Tag : null;
var PSwitch = typeof primitives.Switch === "function" ? primitives.Switch : null;
var PSegmentedControl = typeof primitives.SegmentedControl === "function" ? primitives.SegmentedControl : null;
var PWriteClipboard = typeof primitives.writeClipboard === "function" ? primitives.writeClipboard : null;
async function copyText(text) {
  if (PWriteClipboard !== null) return await PWriteClipboard(text);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
function Card({ title, hint, children }) {
  return /* @__PURE__ */ import_react2.default.createElement("section", { className: "t-team-panel-card", "aria-label": title }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "t-team-panel-card-head" }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "t-team-panel-card-title" }, title), hint === void 0 ? null : /* @__PURE__ */ import_react2.default.createElement("div", { className: "t-team-panel-card-hint" }, hint)), children);
}
function Button2({ children, onClick, disabled, title, variant = "outline", size = "sm", icon, type = "button", className }) {
  if (PButton !== null) {
    return /* @__PURE__ */ import_react2.default.createElement(PButton, { variant, size, onClick, disabled, title, icon, type, className }, children);
  }
  return /* @__PURE__ */ import_react2.default.createElement("button", { className: "t-team-chip", type, onClick, disabled, title }, icon, children);
}
function TextInput({ icon, className, ...rest }) {
  const cls = className === void 0 ? "t-team-input-field" : `t-team-input-field ${className}`;
  if (PInput !== null) return /* @__PURE__ */ import_react2.default.createElement(PInput, { icon, className: cls, ...rest });
  return /* @__PURE__ */ import_react2.default.createElement("input", { className: `t-team-input ${cls}`, ...rest });
}
function Select({ value, onChange, title, options, ariaLabel }) {
  return /* @__PURE__ */ import_react2.default.createElement(
    "select",
    {
      className: "t-team-select",
      value,
      title,
      "aria-label": ariaLabel,
      onChange: (event) => onChange(event.target.value)
    },
    options.map((item) => /* @__PURE__ */ import_react2.default.createElement("option", { key: item.key, value: item.key }, item.label))
  );
}
function Tabs({ items, value, onChange, label }) {
  if (PTabs !== null) {
    const official = items.map((item) => ({
      value: item.value,
      label: item.label,
      id: item.id,
      panelId: item.panelId
    }));
    return /* @__PURE__ */ import_react2.default.createElement(PTabs, { items: official, value, onChange, label, className: "t-team-panel-tabs" });
  }
  return /* @__PURE__ */ import_react2.default.createElement("div", { className: "t-team-tabs", role: "tablist", "aria-label": label }, items.map((item) => /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      className: "t-team-tab",
      type: "button",
      role: "tab",
      key: item.value,
      id: item.id,
      "aria-controls": item.panelId,
      "data-active": value === item.value,
      "aria-selected": value === item.value,
      onClick: () => onChange(item.value)
    },
    item.label
  )));
}
function Modal2({ open: open2, title, onClose, closeLabel, description, children, footer, className }) {
  if (!open2) return null;
  if (PModal !== null) {
    const dialogCls = className === void 0 ? "t-team-modal-fit" : `t-team-modal-fit ${className}`;
    return /* @__PURE__ */ import_react2.default.createElement(
      PModal,
      {
        open: open2,
        title,
        onClose,
        closeLabel,
        description,
        footer,
        className: dialogCls,
        contentClassName: "t-team-modal-fit-content"
      },
      children
    );
  }
  return /* @__PURE__ */ import_react2.default.createElement(
    "div",
    {
      className: "t-team-mask",
      onClick: (event) => {
        if (event.target === event.currentTarget) onClose();
      }
    },
    /* @__PURE__ */ import_react2.default.createElement("div", { className: "t-team-modal", role: "dialog", "aria-modal": "true", "aria-label": title }, /* @__PURE__ */ import_react2.default.createElement("div", { className: "t-team-modal-head" }, /* @__PURE__ */ import_react2.default.createElement("span", null, title), /* @__PURE__ */ import_react2.default.createElement("button", { className: "t-team-chip", type: "button", onClick: onClose }, closeLabel)), description === void 0 ? null : /* @__PURE__ */ import_react2.default.createElement("div", { className: "t-team-note" }, description), /* @__PURE__ */ import_react2.default.createElement("div", { className: "t-team-modal-body" }, children), footer === void 0 ? null : /* @__PURE__ */ import_react2.default.createElement("div", { className: "t-team-editor-actions" }, footer))
  );
}
function Tag2({ tone = "outline", children }) {
  if (PTag !== null) return /* @__PURE__ */ import_react2.default.createElement(PTag, { tone }, children);
  return /* @__PURE__ */ import_react2.default.createElement("span", { className: "t-team-badge", "data-tone": tone === "outline" ? void 0 : tone }, children);
}
function Field({ label, children }) {
  return /* @__PURE__ */ import_react2.default.createElement("label", { className: "t-team-field" }, /* @__PURE__ */ import_react2.default.createElement("span", null, label), children);
}
function Switch2({ checked, onChange, label, disabled, title }) {
  if (PSwitch !== null) {
    return /* @__PURE__ */ import_react2.default.createElement(PSwitch, { checked: checked === true, onChange, label, disabled, title });
  }
  return /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      className: "t-team-switch-fallback",
      type: "button",
      role: "switch",
      "aria-checked": checked === true,
      "aria-label": label,
      title,
      disabled,
      onClick: () => onChange(!(checked === true)),
      style: {
        boxSizing: "border-box",
        position: "relative",
        flex: "0 0 auto",
        width: 36,
        height: 20,
        padding: 2,
        border: 0,
        borderRadius: 999,
        cursor: "pointer",
        background: checked === true ? "var(--dsw-alias-brand-primary, #0f1115)" : "var(--dsw-alias-border-l3, #d8dadc)"
      }
    },
    /* @__PURE__ */ import_react2.default.createElement("span", { style: {
      display: "block",
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: "var(--dsw-alias-label-primary-foreground, #fff)",
      transform: checked === true ? "translateX(16px)" : "none"
    } })
  );
}
function ChoiceGroup({ label, options, value, onSelect, disabled, id }) {
  const autoId = import_react2.default.useId();
  const baseId = id ?? `t-team-choice-${autoId}`;
  if (PSegmentedControl !== null) {
    return /* @__PURE__ */ import_react2.default.createElement(
      PSegmentedControl,
      {
        id: baseId,
        label,
        value,
        disabled,
        onChange: onSelect,
        options: options.map((item) => ({ value: item.id, label: item.label, disabled: item.disabled, title: item.title }))
      }
    );
  }
  return /* @__PURE__ */ import_react2.default.createElement("div", { className: "t-team-choice-fallback", role: "radiogroup", "aria-label": label, style: { display: "flex", gap: 6, margin: "6px 0 2px", flexWrap: "wrap" } }, options.map((item) => /* @__PURE__ */ import_react2.default.createElement(
    "button",
    {
      key: item.id,
      className: "t-team-chip",
      type: "button",
      role: "radio",
      "aria-checked": item.id === value,
      "data-active": item.id === value,
      disabled,
      onClick: () => onSelect(item.id)
    },
    item.label
  )));
}
var PAnchoredPosition = typeof primitives.useAnchoredPosition === "function" ? primitives.useAnchoredPosition : null;
var PDismissOnOutsidePointer = typeof primitives.useDismissOnOutsidePointer === "function" ? primitives.useDismissOnOutsidePointer : null;
var PMenuSurface = typeof primitives.MenuSurface === "function" ? primitives.MenuSurface : null;
var useLayout = typeof window === "undefined" ? import_react2.default.useEffect : import_react2.default.useLayoutEffect;
function anchorInput(rootRef) {
  let node2 = rootRef.current?.parentElement ?? null;
  for (let i = 0; i < 8 && node2 !== null; i += 1) {
    if (node2.matches?.("[data-composer-card]") === true) return node2;
    node2 = node2.parentElement;
  }
  node2 = rootRef.current?.parentElement ?? null;
  for (let i = 0; i < 8 && node2 !== null; i += 1) {
    const found = node2.querySelector?.("textarea, [contenteditable='true']");
    if (found !== null && found !== void 0) return found;
    node2 = node2.parentElement;
  }
  return void 0;
}
function overlayTopMargin(min) {
  const root = document.documentElement;
  const clearance = Number.parseFloat(getComputedStyle(root).getPropertyValue("--dsh-frame-top-clearance"));
  if (Number.isNaN(clearance)) return min;
  return Math.max(min, (root.hasAttribute("data-fullscreen") ? 0 : clearance) + 20);
}
function useOwnAnchoredPosition({ open: open2, anchorRef, panelRef, side = "bottom", align = "start", gap = 6, margin = 8 }) {
  const [position, setPosition] = import_react2.default.useState(null);
  useLayout(() => {
    if (!open2) {
      setPosition(null);
      return void 0;
    }
    const place = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (rect === void 0) return;
      const panel2 = panelRef.current;
      const width = panel2?.offsetWidth ?? 0;
      const height = panel2?.offsetHeight ?? 0;
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
    if (typeof ResizeObserver !== "undefined" && panel !== null && panel !== void 0) {
      observer = new ResizeObserver(place);
      observer.observe(panel);
    }
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open2, anchorRef, panelRef, side, align, gap, margin]);
  return position;
}
var useAnchoredPosition2 = PAnchoredPosition ?? useOwnAnchoredPosition;
function useOwnDismissOnOutsidePointer(root, open2, setOpen, portal) {
  import_react2.default.useEffect(() => {
    if (!open2) return void 0;
    const onDown = (event) => {
      if (event.target instanceof Node && root.current?.contains(event.target) !== true && portal?.current?.contains(event.target) !== true) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [root, open2, setOpen, portal]);
}
var useDismissOnOutsidePointer2 = PDismissOnOutsidePointer ?? useOwnDismissOnOutsidePointer;
function useFloatingShell({ open: open2, setOpen, rootRef, panelRef, gap = 6, margin = 8, ideal = 600 }) {
  const anchorRef = import_react2.default.useRef(null);
  const [side, setSide] = import_react2.default.useState("top");
  const [width, setWidth] = import_react2.default.useState(0);
  const [maxHeight, setMaxHeight] = import_react2.default.useState(ideal);
  const [fallback, setFallback] = import_react2.default.useState(null);
  useLayout(() => {
    if (!open2) return;
    anchorRef.current = anchorInput(rootRef) ?? rootRef.current ?? null;
  }, [open2, rootRef]);
  const officialPosition = useAnchoredPosition2({ open: open2, anchorRef, panelRef, side, align: "start", gap, margin });
  useLayout(() => {
    if (!open2) return void 0;
    const fit = () => {
      const node2 = anchorRef.current ?? rootRef.current;
      const inputRect = node2?.getBoundingClientRect();
      if (inputRect === void 0) return;
      const windowW = window.innerWidth;
      const windowH = window.innerHeight;
      const inputWidth = inputRect.width > 0 ? Math.max(160, Math.min(Math.round(inputRect.width), windowW - 16)) : 0;
      const spaceAbove = inputRect.top - margin;
      const spaceBelow = windowH - inputRect.bottom - margin;
      const up = spaceAbove >= spaceBelow;
      const cap = Math.max(0, Math.min(ideal, windowH - margin * 2));
      const roof = up ? inputRect.top - gap - overlayTopMargin(margin) : spaceBelow;
      setSide(up ? "top" : "bottom");
      setWidth(inputWidth);
      setMaxHeight(Math.max(0, Math.min(cap, roof)));
      if (PAnchoredPosition === null) {
        const measured = panelRef.current?.offsetWidth ?? 0;
        const laidOut = measured > 0 ? measured : inputWidth;
        const maxLeft = laidOut === 0 ? Number.POSITIVE_INFINITY : Math.max(margin, windowW - laidOut - margin);
        const left = Math.min(Math.max(margin, inputRect.left), maxLeft);
        setFallback(up ? { left, bottom: Math.max(margin, windowH - inputRect.top + gap) } : { left, top: Math.max(margin, inputRect.bottom + gap) });
      }
    };
    const onScroll = (event) => {
      const node2 = panelRef.current;
      if (node2 !== null && node2 !== void 0 && event.target instanceof Node && node2.contains(event.target)) return;
      fit();
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open2, rootRef, panelRef, gap, margin, ideal]);
  useDismissOnOutsidePointer2(rootRef, open2, setOpen);
  import_react2.default.useEffect(() => {
    if (!open2) return void 0;
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open2, setOpen]);
  const style = import_react2.default.useMemo(() => {
    const next = { maxHeight: `${maxHeight}px` };
    if (width > 0) next["--t-team-pop-w"] = `${width}px`;
    if (PAnchoredPosition !== null) {
      if (officialPosition === null) next.visibility = "hidden";
      else {
        next.left = officialPosition.left;
        next.top = officialPosition.top;
      }
    } else if (fallback !== null) {
      next.left = fallback.left;
      if (fallback.top !== void 0) next.top = fallback.top;
      else next.bottom = fallback.bottom;
    } else {
      next.visibility = "hidden";
    }
    return next;
  }, [officialPosition, fallback, maxHeight, width]);
  return { style, side, official: PAnchoredPosition !== null };
}
var PopSurface = import_react2.default.forwardRef(function PopSurface2({ official = false, className = "", style, children, ...rest }, ref) {
  const cls = official ? `${className} t-team-pop-official` : className;
  if (PMenuSurface !== null) {
    return /* @__PURE__ */ import_react2.default.createElement(PMenuSurface, { ref, className: cls, style, ...rest }, children);
  }
  return /* @__PURE__ */ import_react2.default.createElement("div", { ref, className, style, ...rest }, children);
});
function FloatingPop({ open: open2, setOpen, rootRef, className, children, ...rest }) {
  const panelRef = import_react2.default.useRef(null);
  const shell = useFloatingShell({ open: open2, setOpen, rootRef, panelRef });
  if (!open2) return null;
  return /* @__PURE__ */ import_react2.default.createElement(PopSurface, { ref: panelRef, official: shell.official, className, style: shell.style, ...rest }, children);
}
var DIVISION_ICONS = {
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
  testing: "IconInspectOutlineMedium"
};
function PopIcon({ name, size = 22 }) {
  const Icon = primitives[name];
  if (typeof Icon !== "function") return null;
  return /* @__PURE__ */ import_react2.default.createElement(Icon, { size });
}
function divisionIconName(division) {
  const name = DIVISION_ICONS[division];
  if (typeof name !== "string" || typeof primitives[name] !== "function") return null;
  return name;
}
function tintOf(color) {
  const value = typeof color === "string" ? color.trim() : "";
  if (!/^#[0-9a-fA-F]{6}$/u.test(value) && !/^[a-zA-Z]{3,20}$/u.test(value)) return null;
  return { background: `color-mix(in srgb, ${value} 24%, transparent)`, color: value };
}

// src/client/tabs.jsx
function CategoriesTab({ t, remote, categories, onChanged }) {
  const [key, setKey] = import_react3.default.useState("");
  const [label, setLabel] = import_react3.default.useState("");
  const [editing, setEditing] = import_react3.default.useState(null);
  const [pendingDelete, setPendingDelete] = import_react3.default.useState("");
  const [error62, setError] = import_react3.default.useState("");
  const [busy, setBusy] = import_react3.default.useState(false);
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
  const row = (item) => /* @__PURE__ */ import_react3.default.createElement("div", { className: "t-team-cat-row", key: item.key }, /* @__PURE__ */ import_react3.default.createElement("span", { className: "t-team-cat-name", title: item.label }, item.label), /* @__PURE__ */ import_react3.default.createElement(Tag2, { tone: item.official ? "outline" : "info" }, item.official ? t("cat.officialBadge") : t("cat.customBadge")), /* @__PURE__ */ import_react3.default.createElement("span", { className: "t-team-cat-key", title: item.key }, item.key), /* @__PURE__ */ import_react3.default.createElement("span", { className: "t-team-cat-count" }, t("cat.count", { count: item.count, custom: item.customCount })), !item.official && /* @__PURE__ */ import_react3.default.createElement("span", { className: "t-team-cat-actions" }, editing !== null && editing.key === item.key ? /* @__PURE__ */ import_react3.default.createElement(import_react3.default.Fragment, null, /* @__PURE__ */ import_react3.default.createElement(
    TextInput,
    {
      value: editing.label,
      placeholder: t("cat.label"),
      "aria-label": t("cat.label"),
      onChange: (event) => setEditing({ key: item.key, label: event.target.value })
    }
  ), /* @__PURE__ */ import_react3.default.createElement(
    Button2,
    {
      disabled: busy,
      variant: "primary",
      onClick: () => void run(() => remote.updateCategory(item.key, editing.label.trim()))
    },
    t("cat.save")
  ), /* @__PURE__ */ import_react3.default.createElement(Button2, { disabled: busy, onClick: () => setEditing(null) }, t("custom.cancel"))) : /* @__PURE__ */ import_react3.default.createElement(import_react3.default.Fragment, null, /* @__PURE__ */ import_react3.default.createElement(Button2, { disabled: busy, onClick: () => setEditing({ key: item.key, label: item.label }) }, t("cat.rename")), pendingDelete === item.key ? /* @__PURE__ */ import_react3.default.createElement(import_react3.default.Fragment, null, /* @__PURE__ */ import_react3.default.createElement(
    Button2,
    {
      disabled: busy,
      variant: "primary",
      onClick: () => void run(() => remote.deleteCategory(item.key))
    },
    t("cat.confirmDelete")
  ), /* @__PURE__ */ import_react3.default.createElement(Button2, { disabled: busy, onClick: () => setPendingDelete("") }, t("custom.cancel"))) : /* @__PURE__ */ import_react3.default.createElement(Button2, { disabled: busy, onClick: () => setPendingDelete(item.key) }, t("cat.delete")))));
  return (
    // 间距交给两层 flex 容器（2026-09-28 用户：「自建分类 / 官方分类 里下方元素增加点间隔」）：
    // 页级 14px 隔开三个区块，小节级 8px 隔开「标题 → 说明 → 列表」。
    // 用容器 gap 而不是给每个元素写 margin：margin 叠起来既难算也难改，而且 .t-team-meta
    // 这种类别处也在用，加全局 margin 会误伤。
    /* @__PURE__ */ import_react3.default.createElement("div", { className: "t-team-cat-page" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "t-team-note" }, t("cat.hint")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "t-team-bar" }, /* @__PURE__ */ import_react3.default.createElement(
      TextInput,
      {
        placeholder: t("cat.key"),
        "aria-label": t("cat.key"),
        spellCheck: false,
        value: key,
        onChange: (event) => setKey(event.target.value)
      }
    ), /* @__PURE__ */ import_react3.default.createElement(
      TextInput,
      {
        placeholder: t("cat.label"),
        "aria-label": t("cat.label"),
        value: label,
        onChange: (event) => setLabel(event.target.value)
      }
    ), /* @__PURE__ */ import_react3.default.createElement(
      Button2,
      {
        variant: "primary",
        disabled: busy || key.trim() === "",
        onClick: () => void run(() => remote.createCategory(key.trim(), label.trim()))
      },
      t("cat.create")
    )), error62 !== "" && /* @__PURE__ */ import_react3.default.createElement("div", { className: "t-team-error" }, error62), /* @__PURE__ */ import_react3.default.createElement("div", { className: "t-team-cat-section" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "t-team-section-head" }, t("cat.mine")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "t-team-cat-list" }, mine.length === 0 ? /* @__PURE__ */ import_react3.default.createElement("div", { className: "t-team-cat-empty" }, t("cat.empty")) : mine.map(row))), /* @__PURE__ */ import_react3.default.createElement("div", { className: "t-team-cat-section" }, /* @__PURE__ */ import_react3.default.createElement("div", { className: "t-team-section-head" }, t("cat.official")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "t-team-meta" }, t("cat.officialNote")), /* @__PURE__ */ import_react3.default.createElement("div", { className: "t-team-cat-list", "data-scroll": "true" }, official.map(row))))
  );
}

// src/client/skills-panel.jsx
var import_react4 = __toESM(require("react"), 1);
var SOURCE_KEYS = {
  "user-dsh": "sg.source.user-dsh",
  "user-agents": "sg.source.user-agents",
  bundled: "sg.source.bundled",
  "project-dsh": "sg.source.project-dsh",
  "project-agents": "sg.source.project-agents",
  custom: "sg.source.custom",
  runtime: "sg.source.runtime",
  unknown: "sg.source.unknown"
};
function sourceLabel(t, source) {
  const key = SOURCE_KEYS[source];
  return key === void 0 ? source : t(key);
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
function viewLabel(t, view) {
  if (view === void 0) return "";
  if (view.kind === "host") return t("sg.view.host");
  if (view.kind === "preset") return t("sg.view.preset", { name: view.name });
  if (view.kind === "agent") return t("sg.view.agent", { name: view.name });
  if (view.kind === "disk") return t("sg.view.disk");
  return view.key;
}
function SkillsPanel({ t, remote, initialSnapshot }) {
  const [snapshot, setSnapshot] = import_react4.default.useState(initialSnapshot ?? null);
  const [query, setQuery] = import_react4.default.useState("");
  const [status, setStatus] = import_react4.default.useState("all");
  const [source, setSource] = import_react4.default.useState("");
  const [view, setView] = import_react4.default.useState("");
  const [error62, setError] = import_react4.default.useState("");
  const [busy, setBusy] = import_react4.default.useState(false);
  const reload = import_react4.default.useCallback(async () => {
    try {
      const next = unwrap2(await remote.getSnapshot(), "getSnapshot");
      setSnapshot(next);
      setError("");
      return next;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      return void 0;
    }
  }, [remote]);
  import_react4.default.useEffect(() => {
    let alive = true;
    (async () => {
      const next = await reload();
      if (alive && next !== void 0) setSnapshot(next);
    })();
    return () => {
      alive = false;
    };
  }, [reload]);
  async function save(disabled) {
    if (snapshot === null || busy) return;
    setBusy(true);
    setError("");
    try {
      const next = unwrap2(await remote.setDisabled(disabled, snapshot.revision), "setDisabled");
      setSnapshot(next);
    } catch (cause) {
      const code = cause && typeof cause === "object" ? cause.code : void 0;
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
  if (snapshot === null && error62 === "") {
    return /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-settings" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-empty" }, t("sg.settings.loading")));
  }
  if (snapshot === null) {
    return /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-settings" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-error" }, t("sg.settings.loadFailed", { detail: error62 })), /* @__PURE__ */ import_react4.default.createElement(Button2, { onClick: () => void reload() }, t("sg.settings.retry")));
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
  const scopeCounts = viewKey === "" ? snapshot.counts : activeView ?? snapshot.counts;
  const groups = /* @__PURE__ */ new Map();
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
  const bulkTitle = hasSearch ? void 0 : t("sg.actions.needSearch");
  return /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-settings" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-head" }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-meta" }, t("sg.settings.meta", {
    scope: viewKey === "" ? t("sg.view.all") : viewLabel(t, activeView) || viewKey,
    visible: scopeCounts.modelVisible,
    gated: scopeCounts.gated,
    native: scopeCounts.nativeOff,
    total: scopeCounts.total,
    version: CLIENT_BUILD_VERSION
  })), /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-hint" }, t("sg.settings.hint"))), error62 !== "" && /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-error" }, error62), /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-toolbar" }, /* @__PURE__ */ import_react4.default.createElement(
    TextInput,
    {
      value: query,
      placeholder: t("sg.settings.search"),
      "aria-label": t("sg.settings.search"),
      onChange: (event) => setQuery(event.target.value)
    }
  ), /* @__PURE__ */ import_react4.default.createElement(
    Select,
    {
      value: viewKey,
      onChange: (value) => {
        setView(value);
        setSource("");
      },
      title: t("sg.filter.view"),
      ariaLabel: t("sg.filter.view"),
      options: [
        { key: "", label: t("sg.view.all") },
        ...views.map((item) => ({
          key: item.key,
          label: t("sg.view.option", { label: viewLabel(t, item), visible: item.modelVisible, total: item.total })
        }))
      ]
    }
  ), /* @__PURE__ */ import_react4.default.createElement(
    Select,
    {
      value: sourceKey,
      onChange: setSource,
      title: t("sg.filter.source"),
      ariaLabel: t("sg.filter.source"),
      options: [
        { key: "", label: t("sg.filter.allSources") },
        ...sources.map((key) => ({ key, label: sourceLabel(t, key) }))
      ]
    }
  )), /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-chips" }, /* @__PURE__ */ import_react4.default.createElement(
    ChoiceGroup,
    {
      id: "sg-status-filter",
      label: t("sg.filter.status"),
      value: status,
      onSelect: setStatus,
      options: [
        ["all", "sg.filter.all"],
        ["on", "sg.filter.on"],
        ["off", "sg.filter.off"],
        ["native", "sg.filter.native"]
      ].map(([id, key]) => ({ id, label: t(key) }))
    }
  ), /* @__PURE__ */ import_react4.default.createElement("span", { className: "sg-filter-count" }, t("sg.settings.filterCount", { shown: filtered.length, groups: groups.size }))), /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-actions" }, /* @__PURE__ */ import_react4.default.createElement(Button2, { disabled: !canBulk, title: bulkTitle, onClick: () => setFiltered(false) }, t("sg.actions.enableFiltered")), /* @__PURE__ */ import_react4.default.createElement(Button2, { disabled: !canBulk, title: bulkTitle, onClick: () => setFiltered(true) }, t("sg.actions.disableFiltered"))), filtered.length === 0 ? /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-empty" }, t("sg.settings.empty")) : /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-groups" }, [...groups.entries()].map(([key, rows]) => /* @__PURE__ */ import_react4.default.createElement("section", { className: "sg-group", key }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-group-head" }, /* @__PURE__ */ import_react4.default.createElement("span", null, sourceLabel(t, key)), /* @__PURE__ */ import_react4.default.createElement("span", null, rows.length)), /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-list" }, rows.map((skill) => {
    const on = skill.modelVisible;
    const locked = !skill.nativeModel;
    return /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-row", key: skill.name, "data-off": !on }, /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-row-head" }, /* @__PURE__ */ import_react4.default.createElement("span", { className: "sg-name" }, skill.name, locked && /* @__PURE__ */ import_react4.default.createElement("span", { className: "sg-badge" }, t("sg.filter.native"))), /* @__PURE__ */ import_react4.default.createElement(
      Switch2,
      {
        checked: on,
        disabled: locked || busy,
        label: skill.name,
        title: locked ? t("sg.settings.nativeOff") : skill.name,
        onChange: () => toggle(skill)
      }
    )), skill.description !== "" && /* @__PURE__ */ import_react4.default.createElement("div", { className: "sg-desc" }, skill.description));
  }))))));
}

// src/client/settings.jsx
function SettingsPanel({ t, ctx, remote, skillRemote, getActive, initialTab, view }) {
  const [snapshot, setSnapshot] = import_react5.default.useState(() => snapshotOf(remote) ?? null);
  const [query, setQuery] = import_react5.default.useState("");
  const [avatars, setAvatars] = import_react5.default.useState({});
  const [avatarRev, setAvatarRev] = import_react5.default.useState(0);
  const [cloudClicked, setCloudClicked] = import_react5.default.useState({});
  const [division, setDivision] = import_react5.default.useState("");
  const [status, setStatus] = import_react5.default.useState("");
  const [error62, setError] = import_react5.default.useState("");
  const [busy, setBusy] = import_react5.default.useState(false);
  const [promptView, setPromptView] = import_react5.default.useState(null);
  const [copyState, setCopyState] = import_react5.default.useState("");
  const [editor, setEditor] = import_react5.default.useState(null);
  const [pendingDelete, setPendingDelete] = import_react5.default.useState("");
  const [tab, setTab] = import_react5.default.useState(initialTab ?? "experts");
  const [expandedGroups, setExpandedGroups] = import_react5.default.useState(null);
  const reload = import_react5.default.useCallback(async (force) => {
    try {
      const next = await refresh(remote, force);
      setSnapshot({ ...next });
      setError("");
      return next;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      return void 0;
    }
  }, [remote]);
  import_react5.default.useEffect(() => {
    let alive = true;
    (async () => {
      const next = await reload(false);
      if (alive && next !== void 0) setSnapshot({ ...next });
    })();
    return () => {
      alive = false;
    };
  }, [reload]);
  import_react5.default.useEffect(() => {
    const onAvatarsChanged = () => setAvatarRev((n) => n + 1);
    window.addEventListener("t-team:avatars-changed", onAvatarsChanged);
    return () => window.removeEventListener("t-team:avatars-changed", onAvatarsChanged);
  }, []);
  import_react5.default.useEffect(() => {
    let alive = true;
    (async () => {
      let map2 = {};
      try {
        map2 = unwrap(await remote?.getAvatars?.(), "getAvatars") ?? {};
      } catch {
        map2 = {};
      }
      if (alive && map2 !== void 0 && map2 !== null) {
        setAvatars(map2);
      }
    })();
    return () => {
      alive = false;
    };
  }, [avatarRev]);
  const active = getActive();
  async function openPrompt(expert) {
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
        error: cause instanceof Error ? cause.message : String(cause)
      });
    }
  }
  import_react5.default.useEffect(() => {
    if (promptView === null) return void 0;
    const onKey = (event) => {
      if (event.key === "Escape") setPromptView(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [promptView]);
  import_react5.default.useEffect(() => {
    if (copyState === "") return void 0;
    const timer = window.setTimeout(() => setCopyState(""), 1600);
    return () => window.clearTimeout(timer);
  }, [copyState]);
  async function copyPrompt() {
    const text = promptView?.text ?? "";
    if (text === "") return;
    setCopyState(await copyText(text) ? "done" : "failed");
  }
  const customDivisionLabel = snapshot?.customDivisionLabel ?? "";
  const categories = snapshot?.categories ?? [];
  const divisionOptions = (() => {
    const base = categories.length > 0 ? categories.map((item) => ({ key: item.key, label: item.label })) : [{ key: snapshot?.customDivision ?? "", label: customDivisionLabel }];
    const fallback = snapshot?.customDivision ?? "";
    if (fallback !== "" && !base.some((item) => item.key === fallback)) {
      base.unshift({ key: fallback, label: snapshot?.customDivisionLabel ?? fallback });
    }
    return base;
  })();
  const editorDivisionOptions = editor !== null && editor.division !== "" && !divisionOptions.some((item) => item.key === editor.division) ? [{ key: editor.division, label: editor.division }, ...divisionOptions] : divisionOptions;
  function openEditorNew() {
    setError("");
    setEditor({
      mode: "new",
      slug: "",
      hash: "",
      name: "",
      nameEn: "",
      emoji: "\u{1F9E9}",
      description: "",
      body: "",
      division: snapshot?.customDivision ?? "",
      divisionNew: false,
      divisionKey: "",
      divisionLabel: "",
      loading: false,
      saving: false,
      error: ""
    });
  }
  async function openEditorEdit(expert) {
    setError("");
    setEditor({
      mode: "edit",
      slug: expert.slug,
      hash: expert.hash ?? "",
      name: expert.name ?? "",
      nameEn: expert.nameEn ?? "",
      emoji: expert.emoji || "\u{1F9E9}",
      description: expert.description ?? "",
      body: "",
      division: expert.division ?? "",
      divisionNew: false,
      divisionKey: "",
      divisionLabel: "",
      loading: true,
      saving: false,
      error: ""
    });
    try {
      const data = unwrap(await remote.getPrompt(expert.slug, expert.division), "getPrompt");
      setEditor((current) => current === null ? current : { ...current, body: data?.prompt ?? "", loading: false });
    } catch (cause) {
      setEditor((current) => current === null ? current : {
        ...current,
        loading: false,
        error: cause instanceof Error ? cause.message : String(cause)
      });
    }
  }
  function patchEditor(patch) {
    setEditor((current) => current === null ? current : { ...current, ...patch });
  }
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
      divisionLabel: editor.divisionNew ? editor.divisionLabel.trim() : ""
    };
    try {
      const result = editor.mode === "new" ? await remote.createExpert(payload) : await remote.updateExpert(editor.slug, payload, editor.hash);
      unwrap(result, editor.mode === "new" ? "createExpert" : "updateExpert");
      setEditor(null);
      await reload(true);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      const code = cause && typeof cause === "object" ? cause.code : void 0;
      if (code === "tTeam/custom-slug-taken" || code === "tTeam/custom-name-taken" || code === "tTeam/custom-conflict") {
        await reload(true);
      }
      patchEditor({ saving: false, error: message });
    }
  }
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
  const enabledSet = import_react5.default.useMemo(() => snapshot != null ? new Set(snapshot.enabled ?? []) : /* @__PURE__ */ new Set(), [snapshot]);
  const divisions = [];
  for (const expert of experts) {
    if (!divisions.includes(expert.division)) divisions.push(expert.division);
  }
  divisions.sort();
  const labelOf = (division2) => {
    const first = experts.find((expert) => expert.division === division2);
    return first === void 0 ? division2 : divisionLabel(first, active);
  };
  const needle = query.trim().toLowerCase();
  const visible = import_react5.default.useMemo(() => experts.filter((expert) => {
    if (division !== "" && expert.division !== division) return false;
    if (status === "on" && !enabledSet.has(expert.slug)) return false;
    if (status === "off" && enabledSet.has(expert.slug)) return false;
    return matchExpert(expert, active, needle);
  }), [experts, division, status, enabledSet, query, active]);
  const filtered = query !== "" || division !== "" || status !== "";
  const grouped = import_react5.default.useMemo(() => {
    const out = [];
    for (const expert of visible) {
      const last = out[out.length - 1];
      if (last !== void 0 && last.division === expert.division) last.items.push(expert);
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
    setSnapshot({ ...snapshot, enabled: list });
    try {
      const state = unwrap(await remote.setEnabled(list, snapshot.revision), "setEnabled");
      publishCatalog(remote, { ...snapshot, enabled: state.enabled, enabledSet: new Set(state.enabled), revision: state.revision });
      setSnapshot({ ...snapshot, enabled: state.enabled, revision: state.revision });
      setError("");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      const code = typeof cause === "object" && cause !== null ? cause.code : void 0;
      const conflict = code === "tTeam/conflict" || code === "SETTINGS_CONFLICT" || /changed since it was read|another window|其他窗口|冲突/.test(message);
      await reload(true);
      setError(conflict ? "CONFLICT" : message);
    } finally {
      setBusy(false);
    }
  }
  if (view === "summary") {
    return /* @__PURE__ */ import_react5.default.createElement("span", null, t("settings.summary"));
  }
  const panelId = (key) => `t-team-panel-${key}`;
  const tabId = (key) => `t-team-tab-${key}`;
  if (snapshot === null) {
    return /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-panel" }, /* @__PURE__ */ import_react5.default.createElement(Card, { title: t("settings.title") }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-meta" }, t("settings.loading")), error62 !== "" && /* @__PURE__ */ import_react5.default.createElement(import_react5.default.Fragment, null, /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-error" }, t("settings.loadFailed", { detail: error62 })), /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-row" }, /* @__PURE__ */ import_react5.default.createElement(Button2, { onClick: () => void reload(true) }, t("settings.retry"))))));
  }
  const enabledCount = snapshot.enabled.length;
  const healthNotice = (() => {
    const sc = snapshot.sidecar;
    if (sc === null || typeof sc !== "object") return "";
    const parts = [];
    if (sc.present !== true) parts.push(t("roster.sidecarMissing", { path: sc.zhRoot ?? "?" }));
    if (typeof sc.skippedFiles === "number" && sc.skippedFiles > 0) {
      parts.push(t("roster.skippedFiles", { count: sc.skippedFiles }));
    }
    if (Array.isArray(sc.unreadableDivisions) && sc.unreadableDivisions.length > 0) {
      parts.push(t("roster.unreadableDivisions", { list: sc.unreadableDivisions.join("\u3001") }));
    }
    return parts.join(" ");
  })();
  const defaultExpanded = grouped.length === 0 ? [] : [grouped[0].division];
  const openDivisions = expandedGroups ?? defaultExpanded;
  const isGroupOpen = (division2) => filtered || openDivisions.includes(division2);
  const allGroupsOpen = grouped.length > 0 && grouped.every((group) => openDivisions.includes(group.division));
  const toggleGroup = (division2) => {
    const current = [...openDivisions];
    setExpandedGroups(current.includes(division2) ? current.filter((item) => item !== division2) : [...current, division2]);
  };
  const toggleAllGroups = () => {
    setExpandedGroups(allGroupsOpen ? [] : grouped.map((group) => group.division));
  };
  return /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-panel" }, /* @__PURE__ */ import_react5.default.createElement(
    Card,
    {
      title: t("settings.title"),
      hint: `${t("settings.enabledCount", { enabled: enabledCount, total: experts.length })} \xB7 v${CLIENT_BUILD_VERSION}`
    },
    /* @__PURE__ */ import_react5.default.createElement(
      Tabs,
      {
        value: tab,
        onChange: setTab,
        label: t("settings.title"),
        items: [
          { value: "experts", label: t("tab.experts"), id: tabId("experts"), panelId: panelId("experts") },
          { value: "categories", label: t("tab.categories"), id: tabId("categories"), panelId: panelId("categories") },
          { value: "skills", label: t("tab.skills"), id: tabId("skills"), panelId: panelId("skills") }
        ]
      }
    ),
    /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-tabbody", id: panelId("categories"), role: "tabpanel", "aria-labelledby": tabId("categories"), hidden: tab !== "categories" }, /* @__PURE__ */ import_react5.default.createElement(SectionBoundary, { t, reloadKey: tab }, /* @__PURE__ */ import_react5.default.createElement(CategoriesTab, { t, remote, categories, onChanged: () => reload(true) }))),
    /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-tabbody", id: panelId("skills"), role: "tabpanel", "aria-labelledby": tabId("skills"), hidden: tab !== "skills" }, /* @__PURE__ */ import_react5.default.createElement(SectionBoundary, { t, reloadKey: tab }, skillRemote === void 0 ? /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-note" }, t("sg.settings.unavailable")) : /* @__PURE__ */ import_react5.default.createElement(SkillsPanel, { t, remote: skillRemote }))),
    /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-tabbody", id: panelId("experts"), role: "tabpanel", "aria-labelledby": tabId("experts"), hidden: tab !== "experts" }, /* @__PURE__ */ import_react5.default.createElement(SectionBoundary, { t, reloadKey: tab }, healthNotice !== "" && /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-warn", role: "status" }, healthNotice), /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-note" }, t("roster.expertsHint")), /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-bar" }, /* @__PURE__ */ import_react5.default.createElement(
      TextInput,
      {
        placeholder: t("settings.search"),
        "aria-label": t("settings.search"),
        value: query,
        onChange: (event) => setQuery(event.target.value)
      }
    ), /* @__PURE__ */ import_react5.default.createElement(
      Select,
      {
        value: division,
        onChange: setDivision,
        title: t("filter.division"),
        ariaLabel: t("filter.division"),
        options: [
          { key: "", label: t("filter.allDivisions") },
          ...divisions.map((item) => ({
            key: item,
            label: `${labelOf(item)} (${experts.filter((expert) => expert.division === item).length})`
          }))
        ]
      }
    ), filtered && /* @__PURE__ */ import_react5.default.createElement(Button2, { onClick: () => {
      setQuery("");
      setDivision("");
      setStatus("");
    } }, t("filter.clear")), /* @__PURE__ */ import_react5.default.createElement(Button2, { variant: "primary", onClick: openEditorNew }, t("custom.new"))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-meta t-team-meta-row" }, /* @__PURE__ */ import_react5.default.createElement("span", null, t("filter.summary", { shown: visible.length, total: experts.length, enabled: enabledSet.size })), filtered ? null : /* @__PURE__ */ import_react5.default.createElement(Button2, { onClick: toggleAllGroups }, allGroupsOpen ? t("group.collapseAll") : t("group.expandAll"))), error62 !== "" && /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-error" }, error62 === "CONFLICT" ? t("settings.conflictRetry") : t("settings.saveFailed", { detail: error62 })), /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-groups" }, grouped.map((group) => {
      const open2 = isGroupOpen(group.division);
      return /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-group", key: group.division }, /* @__PURE__ */ import_react5.default.createElement(
        "button",
        {
          className: "t-team-group-head",
          type: "button",
          "aria-expanded": open2,
          title: t("group.toggle", { name: divisionLabel(group.items[0], active) }),
          onClick: () => toggleGroup(group.division)
        },
        /* @__PURE__ */ import_react5.default.createElement("span", { className: "t-team-division" }, divisionLabel(group.items[0], active), " \xB7 ", group.items.length),
        /* @__PURE__ */ import_react5.default.createElement("span", { className: "t-team-group-chevron", "aria-hidden": "true" }, open2 ? "\u25BE" : "\u25B8")
      ), open2 && /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-grid" }, group.items.map((expert) => {
        const on = enabledSet.has(expert.slug);
        return /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-card", "data-enabled": on, key: expert.slug }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-card-body" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-avatar" }, avatars[expert.slug] === void 0 ? expert.emoji || "\u{1F9E9}" : /* @__PURE__ */ import_react5.default.createElement("img", { src: avatars[expert.slug], alt: "" })), /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-identity" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-card-name" }, displayName(expert, active), expert.custom === true && /* @__PURE__ */ import_react5.default.createElement(Tag2, { tone: "info" }, t("custom.badge")), expert.assets === "missing" && cloudClicked[expert.slug] !== true && /* @__PURE__ */ import_react5.default.createElement(
          "button",
          {
            type: "button",
            className: "t-team-cloud",
            title: t("assets.cloud"),
            onClick: () => {
              warmupAssets(remote, expert);
              setCloudClicked((prev) => ({ ...prev, [expert.slug]: true }));
            }
          },
          "\u2601\uFE0F"
        )), /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-card-division" }, divisionLabel(expert, active)), /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-card-slug" }, expert.slug)), /* @__PURE__ */ import_react5.default.createElement("p", { className: "t-team-card-desc" }, displayDescription(expert, active)), expert.conflict === true && /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-conflict", style: { gridColumn: "1/-1" } }, t("settings.conflict"))), /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-card-tools" }, /* @__PURE__ */ import_react5.default.createElement(
          Button2,
          {
            variant: "ghost",
            onClick: () => void openPrompt(expert),
            title: t("card.prompt"),
            "aria-label": t("card.prompt")
          },
          "\u{1F4C4}"
        ), expert.custom === true && /* @__PURE__ */ import_react5.default.createElement(
          Button2,
          {
            variant: "ghost",
            onClick: () => void openEditorEdit(expert),
            title: t("custom.edit"),
            "aria-label": t("custom.edit")
          },
          "\u270F\uFE0F"
        ), expert.custom === true && (pendingDelete === expert.slug ? /* @__PURE__ */ import_react5.default.createElement(
          Button2,
          {
            variant: "outline",
            title: t("custom.deleteHint", { name: displayName(expert, active) }),
            onClick: () => void removeExpert(expert)
          },
          t("custom.confirmDelete")
        ) : /* @__PURE__ */ import_react5.default.createElement(
          Button2,
          {
            variant: "ghost",
            onClick: () => setPendingDelete(expert.slug),
            title: t("custom.delete"),
            "aria-label": t("custom.delete")
          },
          "\u{1F5D1}"
        ))));
      })));
    }), visible.length === 0 && /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-meta" }, t("settings.empty")))))
  ), promptView !== null && /* @__PURE__ */ import_react5.default.createElement(
    Modal2,
    {
      open: true,
      className: "t-team-prompt-modal",
      title: t("card.promptTitle", { name: promptView.name }),
      onClose: () => setPromptView(null),
      closeLabel: t("card.close")
    },
    /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-prompt-tools" }, /* @__PURE__ */ import_react5.default.createElement(
      Button2,
      {
        size: "sm",
        variant: "ghost",
        disabled: promptView.loading || promptView.error !== "" || promptView.text === "",
        title: t("card.copy"),
        onClick: () => void copyPrompt()
      },
      copyState === "done" ? t("card.copied") : copyState === "failed" ? t("card.copyFailed") : t("card.copy")
    )),
    /* @__PURE__ */ import_react5.default.createElement("pre", { className: "t-team-prompt-body" }, promptView.loading ? t("card.promptLoading") : promptView.error !== "" ? t("card.promptFailed", { detail: promptView.error }) : promptView.text === "" ? t("card.promptEmpty") : promptView.text)
  ), editor !== null && /* @__PURE__ */ import_react5.default.createElement(
    Modal2,
    {
      open: true,
      className: "t-team-editor-modal",
      title: editor.mode === "new" ? t("custom.titleNew") : t("custom.titleEdit", { name: editor.name || editor.slug }),
      onClose: () => {
        if (!editor.saving) setEditor(null);
      },
      closeLabel: t("custom.cancel"),
      footer: /* @__PURE__ */ import_react5.default.createElement(import_react5.default.Fragment, null, /* @__PURE__ */ import_react5.default.createElement(Button2, { onClick: () => setEditor(null), disabled: editor.saving }, t("custom.cancel")), /* @__PURE__ */ import_react5.default.createElement(
        Button2,
        {
          variant: "primary",
          onClick: () => void saveEditor(),
          disabled: editor.saving || editor.loading
        },
        editor.saving ? t("custom.saving") : t("custom.save")
      ))
    },
    /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-editor" }, /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-note" }, t("custom.hint")), /* @__PURE__ */ import_react5.default.createElement(Field, { label: t("custom.division") }, /* @__PURE__ */ import_react5.default.createElement(
      Select,
      {
        value: editor.divisionNew ? NEW_DIVISION : editor.division,
        onChange: (value) => {
          if (value === NEW_DIVISION) patchEditor({ divisionNew: true, divisionKey: "", divisionLabel: "" });
          else patchEditor({ divisionNew: false, division: value });
        },
        ariaLabel: t("custom.division"),
        options: [
          ...editorDivisionOptions.map((item) => ({ key: item.key, label: `${item.label} \xB7 ${item.key}` })),
          { key: NEW_DIVISION, label: t("custom.divisionNew") }
        ]
      }
    )), editor.divisionNew && /* @__PURE__ */ import_react5.default.createElement(import_react5.default.Fragment, null, /* @__PURE__ */ import_react5.default.createElement(Field, { label: t("custom.divisionKey") }, /* @__PURE__ */ import_react5.default.createElement(
      TextInput,
      {
        placeholder: t("custom.divisionKey"),
        spellCheck: false,
        value: editor.divisionKey,
        onChange: (event) => patchEditor({ divisionKey: event.target.value })
      }
    )), /* @__PURE__ */ import_react5.default.createElement(Field, { label: t("custom.divisionLabel") }, /* @__PURE__ */ import_react5.default.createElement(
      TextInput,
      {
        placeholder: t("custom.divisionLabel"),
        value: editor.divisionLabel,
        onChange: (event) => patchEditor({ divisionLabel: event.target.value })
      }
    ))), /* @__PURE__ */ import_react5.default.createElement(Field, { label: t("custom.slug") }, /* @__PURE__ */ import_react5.default.createElement(
      TextInput,
      {
        value: editor.slug,
        readOnly: editor.mode === "edit",
        spellCheck: false,
        onChange: (event) => patchEditor({ slug: event.target.value })
      }
    )), /* @__PURE__ */ import_react5.default.createElement(Field, { label: t("custom.name") }, /* @__PURE__ */ import_react5.default.createElement(TextInput, { value: editor.name, onChange: (event) => patchEditor({ name: event.target.value }) })), /* @__PURE__ */ import_react5.default.createElement(Field, { label: t("custom.nameEn") }, /* @__PURE__ */ import_react5.default.createElement(TextInput, { value: editor.nameEn, onChange: (event) => patchEditor({ nameEn: event.target.value }) })), /* @__PURE__ */ import_react5.default.createElement(Field, { label: t("custom.emoji") }, /* @__PURE__ */ import_react5.default.createElement(TextInput, { maxLength: 8, value: editor.emoji, onChange: (event) => patchEditor({ emoji: event.target.value }) })), /* @__PURE__ */ import_react5.default.createElement(Field, { label: t("custom.description") }, /* @__PURE__ */ import_react5.default.createElement(TextInput, { value: editor.description, onChange: (event) => patchEditor({ description: event.target.value }) })), /* @__PURE__ */ import_react5.default.createElement(Field, { label: t("custom.body") }, /* @__PURE__ */ import_react5.default.createElement(
      "textarea",
      {
        className: "t-team-input",
        value: editor.body,
        disabled: editor.loading,
        onChange: (event) => patchEditor({ body: event.target.value })
      }
    )), editor.loading && /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-meta" }, t("custom.loadingBody")), editor.error !== "" && /* @__PURE__ */ import_react5.default.createElement("div", { className: "t-team-error" }, editor.error))
  ));
}

// src/client/summon.jsx
var import_react6 = __toESM(require("react"), 1);
function SummonButton({ t, ctx, remote, getActive, insertReference, insertSkillHint: insertSkillHint2, sessionId, preview, rootRemote }) {
  const [open2, setOpen] = import_react6.default.useState(preview?.open === true);
  const [popTab, setPopTab] = import_react6.default.useState(preview?.tab ?? "experts");
  const [skills, setSkills] = import_react6.default.useState(null);
  const [avatars, setAvatars] = import_react6.default.useState({});
  const [avatarRev, setAvatarRev] = import_react6.default.useState(0);
  import_react6.default.useEffect(() => {
    const onAvatarsChanged = () => setAvatarRev((n) => n + 1);
    window.addEventListener("t-team:avatars-changed", onAvatarsChanged);
    return () => window.removeEventListener("t-team:avatars-changed", onAvatarsChanged);
  }, []);
  import_react6.default.useEffect(() => {
    let alive = true;
    (async () => {
      let map2 = {};
      try {
        map2 = unwrap(await remote?.getAvatars?.(), "getAvatars") ?? {};
      } catch {
        map2 = {};
      }
      if (alive && map2 !== void 0 && map2 !== null) setAvatars(map2);
    })();
    return () => {
      alive = false;
    };
  }, [avatarRev]);
  const [skillQuery, setSkillQuery] = import_react6.default.useState("");
  const [skillsDiag, setSkillsDiag] = import_react6.default.useState("");
  import_react6.default.useEffect(() => {
    if (!open2) return void 0;
    const cached2 = skillsCache.get(sessionId);
    if (cached2 !== void 0) setSkills(cached2);
    let alive = true;
    void (async () => {
      try {
        const remoteObj = rootRemote;
        const skillNs = remoteObj?.skills;
        if (skillNs === void 0 || skillNs === null) {
          if (alive && cached2 === void 0) {
            setSkills([]);
            setSkillsDiag(`rootRemote.skills \u4E0D\u5B58\u5728\uFF08sessionId=${JSON.stringify(sessionId)}\uFF0CrootRemote=${typeof remoteObj}\uFF0Cskills=${typeof skillNs}\uFF09`);
          }
          return;
        }
        if (typeof skillNs.list !== "function") {
          if (alive && cached2 === void 0) {
            setSkills([]);
            setSkillsDiag(`skills.list \u4E0D\u662F\u51FD\u6570\uFF08${typeof skillNs.list}\uFF09`);
          }
          return;
        }
        const result = await skillNs.list({ sessionId });
        if (result?.ok !== true) {
          if (alive && cached2 === void 0) {
            setSkills([]);
            setSkillsDiag(`skills.list \u8FD4\u56DE !ok\uFF1A${JSON.stringify(result?.error ?? result)}`);
          }
          return;
        }
        const list = result.value?.skills ?? [];
        cacheSkills(sessionId, list);
        if (alive) {
          setSkills(list);
          setSkillsDiag(list.length > 0 ? "" : `ok \u4F46 0 \u9879\uFF08value=${JSON.stringify(result.value)}\uFF09`);
        }
      } catch (error62) {
        if (alive && cached2 === void 0) {
          setSkills([]);
          setSkillsDiag(`\u5F02\u5E38\uFF1A${error62 instanceof Error ? error62.message || error62.name : String(error62)}`);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [open2, sessionId, rootRemote]);
  const [popNote, setPopNote] = import_react6.default.useState("");
  const [query, setQuery] = import_react6.default.useState("");
  const [failed, setFailed] = import_react6.default.useState("");
  const [division, setDivision] = import_react6.default.useState("all");
  const [divMore, setDivMore] = import_react6.default.useState(false);
  const [divBack, setDivBack] = import_react6.default.useState(false);
  const rootRef = import_react6.default.useRef(null);
  const divRef = import_react6.default.useRef(null);
  const listRef = import_react6.default.useRef(null);
  const snap = snapshotOf(remote);
  async function toggle() {
    const next = !open2;
    setOpen(next);
    setFailed("");
    setPopNote("");
    if (!next) return;
    void refresh(remote, false).catch(() => void 0);
  }
  const active = getActive();
  const popTabs = [["experts", "tab.experts"], ["skills", "tab.skills"]];
  const experts = import_react6.default.useMemo(
    () => (snap?.experts ?? []).filter((expert) => expert.conflict !== true && snap.enabledSet.has(expert.slug)),
    [snap]
  );
  const needle = query.trim().toLowerCase();
  const divisionLabels = import_react6.default.useMemo(() => {
    const map2 = /* @__PURE__ */ new Map();
    for (const expert of experts) {
      if (!map2.has(expert.division)) map2.set(expert.division, divisionLabel(expert, active));
    }
    return map2;
  }, [experts, active]);
  const divisionKeys = import_react6.default.useMemo(() => [...divisionLabels.keys()], [divisionLabels]);
  const visible = import_react6.default.useMemo(
    () => experts.filter((expert) => (division === "all" || expert.division === division) && matchExpert(expert, active, needle)),
    [experts, division, active, needle]
  );
  const grouped = import_react6.default.useMemo(() => {
    const out = [];
    for (const expert of visible) {
      const last = out[out.length - 1];
      if (last !== void 0 && last.division === expert.division) last.items.push(expert);
      else out.push({ division: expert.division, items: [expert] });
    }
    return out;
  }, [visible]);
  import_react6.default.useEffect(() => {
    if (!open2 || popTab !== "experts") return void 0;
    const sync = () => {
      const node3 = divRef.current;
      if (node3 === null || node3 === void 0) return;
      setDivMore(node3.scrollLeft + node3.clientWidth < node3.scrollWidth - 1);
      setDivBack(node3.scrollLeft > 1);
    };
    sync();
    const node2 = divRef.current;
    node2?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      node2?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [open2, popTab, division, active, snap]);
  import_react6.default.useEffect(() => {
    if (!open2 || popTab !== "experts") return void 0;
    const node2 = divRef.current;
    if (node2 === null || node2 === void 0) return void 0;
    const onWheel = (event) => {
      const bar = divRef.current;
      if (bar === null || bar === void 0) return;
      if (bar.scrollWidth <= bar.clientWidth) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (delta === 0) return;
      const atStart = bar.scrollLeft <= 0;
      const atEnd = bar.scrollLeft + bar.clientWidth >= bar.scrollWidth - 1;
      if (delta > 0 && atEnd || delta < 0 && atStart) return;
      bar.scrollLeft += delta;
      event.preventDefault();
    };
    node2.addEventListener("wheel", onWheel, { passive: false });
    return () => node2.removeEventListener("wheel", onWheel);
  }, [open2, popTab]);
  import_react6.default.useEffect(() => {
    const node2 = listRef.current;
    if (node2 === null || node2 === void 0) return;
    node2.scrollTop = 0;
  }, [division, query, skillQuery, popTab]);
  function pick2(expert) {
    const ok = insertReference?.(referenceOf(expert, active)) === true;
    if (ok) {
      setOpen(false);
      setQuery("");
      setFailed("");
      warmupAssets(remote, expert);
    } else {
      setFailed(t("button.insertFailed"));
    }
  }
  const skillNeedle = skillQuery.trim().toLowerCase();
  const visibleSkills = import_react6.default.useMemo(() => (skills ?? []).filter((skill) => {
    if (skillNeedle === "") return true;
    return `${skill.name} ${skill.description ?? ""} ${skill.whenToUse ?? ""}`.toLowerCase().includes(skillNeedle);
  }), [skills, skillNeedle]);
  const tabCounts = {
    experts: snap === void 0 ? void 0 : experts.length,
    skills: skills === null ? void 0 : skills.length
  };
  function pickSkill(skill) {
    const ok = insertSkillHint2?.(`/${skill.name}`) === true;
    if (ok) {
      setOpen(false);
      setSkillQuery("");
      setFailed("");
    } else {
      setFailed(t("button.insertFailed"));
    }
  }
  return /* @__PURE__ */ import_react6.default.createElement("span", { ref: rootRef, className: "t-team-btn-wrap" }, /* @__PURE__ */ import_react6.default.createElement("button", { className: "t-team-btn", type: "button", title: t("button.title"), onClick: () => void toggle() }, "\u{1F9E9} ", t("button.label")), /* @__PURE__ */ import_react6.default.createElement(FloatingPop, { open: open2, setOpen, rootRef, className: "t-team-pop", "data-tab": popTab }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "t-team-pop-head" }, /* @__PURE__ */ import_react6.default.createElement("span", null, t("pop.title")), /* @__PURE__ */ import_react6.default.createElement("button", { className: "t-team-chip", type: "button", onClick: () => setOpen(false) }, t("button.close"))), /* @__PURE__ */ import_react6.default.createElement("div", { className: "t-team-tabs", role: "tablist" }, popTabs.map(([key, label]) => /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      className: "t-team-tab",
      type: "button",
      role: "tab",
      key,
      "data-active": popTab === key,
      "aria-selected": popTab === key,
      onClick: () => {
        setPopTab(key);
        setFailed("");
      }
    },
    t(label),
    tabCounts[key] === void 0 ? null : /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-tab-count" }, t("tab.count", { count: tabCounts[key] }))
  ))), popNote !== "" && /* @__PURE__ */ import_react6.default.createElement("div", { className: "t-team-ok" }, popNote), failed !== "" && /* @__PURE__ */ import_react6.default.createElement("div", { className: "t-team-error" }, failed), popTab === "experts" && /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, null, /* @__PURE__ */ import_react6.default.createElement(
    "input",
    {
      className: "t-team-input",
      autoFocus: true,
      placeholder: t("settings.search"),
      value: query,
      onChange: (event) => setQuery(event.target.value)
    }
  ), /* @__PURE__ */ import_react6.default.createElement("div", { className: "t-team-divbar", "data-more": divMore, "data-back": divBack }, divBack && /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      className: "t-team-div-scroll",
      type: "button",
      "data-dir": "prev",
      title: t("pop.divisionsPrev"),
      "aria-label": t("pop.divisionsPrev"),
      onClick: () => {
        const node2 = divRef.current;
        node2?.scrollBy?.({ left: -Math.round((node2.clientWidth || 0) * 0.8), behavior: "smooth" });
      }
    },
    "\u2039"
  ), /* @__PURE__ */ import_react6.default.createElement("div", { className: "t-team-pop-divs", ref: divRef, role: "group", "aria-label": t("pop.divisions") }, /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      className: "t-team-div-chip",
      type: "button",
      "aria-pressed": division === "all",
      "data-active": division === "all",
      onClick: () => {
        setDivision("all");
        setFailed("");
      }
    },
    t("pop.all")
  ), divisionKeys.map((key) => /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      className: "t-team-div-chip",
      type: "button",
      key,
      "aria-pressed": division === key,
      "data-active": division === key,
      onClick: () => {
        setDivision(key);
        setFailed("");
      }
    },
    divisionLabels.get(key)
  ))), divMore && /* @__PURE__ */ import_react6.default.createElement(
    "button",
    {
      className: "t-team-div-scroll",
      type: "button",
      "data-dir": "next",
      title: t("pop.divisionsMore"),
      "aria-label": t("pop.divisionsMore"),
      onClick: () => {
        const node2 = divRef.current;
        node2?.scrollBy?.({ left: Math.round((node2.clientWidth || 0) * 0.8), behavior: "smooth" });
      }
    },
    "\u203A"
  )), /* @__PURE__ */ import_react6.default.createElement("div", { className: "t-team-pop-list", ref: listRef }, grouped.map((group) => /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, { key: group.division }, /* @__PURE__ */ import_react6.default.createElement("div", { className: "t-team-division" }, divisionLabel(group.items[0], active)), group.items.map((expert) => {
    const alt = active === "en" ? expert.name : expert.nameEn;
    const iconName = divisionIconName(expert.division);
    return /* @__PURE__ */ import_react6.default.createElement("button", { className: "t-team-pop-item", type: "button", key: expert.slug, onClick: () => pick2(expert) }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-head" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-avatar", style: tintOf(expert.color) ?? void 0 }, avatars[expert.slug] === void 0 ? expert.emoji || (iconName === null ? "\u{1F9E9}" : /* @__PURE__ */ import_react6.default.createElement(PopIcon, { name: iconName })) : /* @__PURE__ */ import_react6.default.createElement("img", { src: avatars[expert.slug], alt: "" })), /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-title" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-name" }, displayName(expert, active)), alt !== void 0 && alt !== "" && /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-sub" }, alt))), /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-desc" }, displayDescription(expert, active)), /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-tags" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-tag" }, divisionLabel(expert, active)), expert.custom === true && /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-tag" }, t("custom.badge")), expert.assets === "missing" && /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-tag", title: t("assets.cloud") }, "\u2601\uFE0F")));
  }))), experts.length === 0 && /* @__PURE__ */ import_react6.default.createElement("div", { className: "t-team-pop-empty" }, t("button.empty")), experts.length > 0 && visible.length === 0 && /* @__PURE__ */ import_react6.default.createElement("div", { className: "t-team-pop-empty" }, t("button.noMatch")))), popTab === "skills" && /* @__PURE__ */ import_react6.default.createElement(import_react6.default.Fragment, null, /* @__PURE__ */ import_react6.default.createElement(
    "input",
    {
      className: "t-team-input",
      autoFocus: true,
      placeholder: t("pop.skillSearch"),
      value: skillQuery,
      onChange: (event) => setSkillQuery(event.target.value)
    }
  ), /* @__PURE__ */ import_react6.default.createElement("div", { className: "t-team-pop-list" }, visibleSkills.map((skill) => /* @__PURE__ */ import_react6.default.createElement("button", { className: "t-team-pop-item", type: "button", key: skill.name, onClick: () => pickSkill(skill) }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-head" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-avatar t-team-pop-avatar-skill" }, "\u{1F9F0}"), /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-title" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-name" }, skill.name))), /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-desc" }, skill.description ?? ""), /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-tags" }, /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-tag" }, t("tab.skills")), skill.modelInvocable === false && /* @__PURE__ */ import_react6.default.createElement("span", { className: "t-team-pop-tag" }, t("pop.skillUserOnly"))))), visibleSkills.length === 0 && /* @__PURE__ */ import_react6.default.createElement("div", { className: "t-team-pop-empty" }, skills === null ? t("pop.skillEmpty") : t("pop.skillNoMatch")), skillsDiag !== "" && /* @__PURE__ */ import_react6.default.createElement("div", { className: "t-team-error", style: { fontSize: "11px", whiteSpace: "pre-wrap" } }, "\u8BCA\u65AD\uFF1A", skillsDiag)))));
}

// src/client/index.jsx
var inject = [
  "slots",
  "inputTriggers",
  // 技能标签要读**官方**的 skills/list remote —— 命名空间必须在静态 inject 里声明，
  // 否则 ctx.remote.skills 是 undefined，可选链会把它静默吃成"没有技能"。
  "remote.skills",
  "locale",
  "remote",
  "sessions",
  "conversation",
  "uiConversation",
  "modelDirectories",
  "layout"
];
async function stage(label, run) {
  try {
    return await run();
  } catch (error62) {
    console.error(`[t-team] \u9636\u6BB5\u300C${label}\u300D\u5931\u8D25\uFF0C\u5DF2\u964D\u7EA7\uFF08GUI \u4E0E\u5176\u4F59\u529F\u80FD\u4E0D\u53D7\u5F71\u54CD\uFF09\uFF1A`, error62);
    return void 0;
  }
}
async function apply(ctx) {
  await stage("\u6837\u5F0F\u6CE8\u5165", () => ctx.effect(() => {
    const tag = document.createElement("style");
    tag.dataset.plugin = PLUGIN_ID;
    tag.textContent = CSS;
    document.head.appendChild(tag);
    return () => tag.remove();
  }, "t-team: style"));
  await stage("\u5B57\u5178\u6CE8\u518C", () => ctx.effect(() => ctx.locale.register(NS, { zh, en }), "t-team: dictionaries"));
  const getActive = () => String(ctx.locale.getSnapshot().active ?? "").toLowerCase().startsWith("zh") ? "zh" : "en";
  const remote = await stage("remote \u6302\u8F7D", async () => {
    const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE);
    ctx.effect(() => disposeRemote, "t-team: remote");
    return ctx.get("remote.tTeam");
  });
  const skillRemote = remote;
  if (remote === void 0) {
    console.error(`[t-team] remote \u547D\u540D\u7A7A\u95F4\u4E0D\u53EF\u7528\uFF08${ctx.locale.bind(NS)("error.remoteUnavailable")}\uFF09\uFF1A\u4E13\u5BB6\u540D\u518C\u3001\u9762\u677F\u4E0E @ \u53EC\u5524\u5747\u4E0D\u53EF\u7528\uFF0C\u4F46 GUI \u6B63\u5E38\u542F\u52A8\u3002`);
    return;
  }
  await refresh(remote, true).catch((cause) => {
    console.warn("[t-team] \u521D\u59CB\u540D\u518C\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BBE\u7F6E\u9875\u53EF\u91CD\u8BD5\uFF1A", cause);
  });
  await stage("UI \u6CE8\u518C", async () => {
    ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
      name: "plugins.bundle.config",
      key: PLUGIN_ID,
      // 文案一律走字典（规范：产品可见文案由 locale 拥有，不接受硬编码分支）
      locale: NS
    }, (props) => import_react7.default.createElement(SettingsPanel, { ...props, t: ctx.locale.bind(NS), remote, skillRemote, getActive })));
    ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
      name: "conversation.input.left",
      id: NS,
      order: 10,
      locale: NS,
      inject: (sessionId) => {
        const target = () => resolveInputTarget(ctx, sessionId);
        return {
          sessionId,
          insertReference: (reference) => insertAtTarget(target(), reference),
          insertSkillHint: (text) => insertSkillHint(target(), text)
        };
      }
    }, (props) => import_react7.default.createElement(SummonButton, { ...props, t: ctx.locale.bind(NS), remote, getActive, rootRemote: ctx.remote })));
    const registerSources = (active, divisions) => {
      const disposers = [];
      try {
        for (const [index, item] of divisions.entries()) {
          const sourceName = `${NS}:${item}`;
          disposers.push(ctx.inputTriggers.registerSource({
            trigger: "@",
            name: sourceName,
            order: 100 + index,
            showGroupTitle: false,
            async candidates(_session, request) {
              const current = await refresh(remote).catch(() => void 0);
              if (current === void 0) return [];
              const query = String(request?.query ?? "").toLowerCase();
              return current.experts.filter((expert) => expert.division === item && expert.conflict !== true && current.enabledSet.has(expert.slug) && matchExpert(expert, getActive(), query)).map((expert) => ({
                name: displayName(expert, getActive()),
                hint: expert.slug,
                section: ctx.locale.bind(NS)("trigger.group", { division: divisionLabel(expert, getActive()) })
              }));
            },
            onPick(pick2) {
              const slug = pick2?.candidate?.hint ?? "";
              const current = snapshotOf(remote);
              const expert = current?.experts.find((entry) => entry.slug === slug && current.enabledSet.has(slug));
              if (expert === void 0) return void 0;
              warmupAssets(remote, expert);
              return { insert: referenceOf(expert, getActive()) };
            },
            codec: {
              clipboardText: (slug) => {
                const current = snapshotOf(remote);
                const expert = current?.experts.find((entry) => entry.slug === slug);
                return expert === void 0 ? ctx.locale.bind(NS)("trigger.removed") : `@${displayName(expert, getActive())}\xA0`;
              },
              // 提交草稿时宿主用它把芯片展开成纯文本；专家被停用/移除时抛错阻止发送。
              async serialize(slug) {
                const current = await refresh(remote).catch(() => void 0);
                const expert = current?.experts.find((entry) => entry.slug === slug);
                if (expert === void 0 || current.enabledSet.has(expert.slug) !== true) {
                  throw new Error(ctx.locale.bind(NS)("trigger.removed"));
                }
                return `@${displayName(expert, getActive())}\xA0`;
              }
            }
          }));
        }
      } catch (cause) {
        for (const dispose of disposers.reverse()) dispose();
        throw cause;
      }
      return () => {
        for (const dispose of disposers.reverse()) dispose();
      };
    };
    ctx.effect(() => {
      const installed = { signature: "", dispose: () => void 0 };
      const syncSources = () => {
        const snapshot = snapshotOf(remote);
        const divisions = [...new Set((snapshot?.experts ?? []).map((expert) => expert.division))].sort();
        if (divisions.length === 0) {
          installed.signature = "";
          return;
        }
        const signature = `${getActive()}|${divisions.join(",")}`;
        if (signature === installed.signature) return;
        installed.dispose();
        installed.dispose = () => void 0;
        try {
          installed.dispose = registerSources(getActive(), divisions);
          installed.signature = signature;
        } catch (cause) {
          console.error("[t-team] \u6CE8\u518C @ \u83DC\u5355\u5931\u8D25\uFF0C\u4E0B\u4E00\u6B21\u540D\u518C\u8BFB\u53D6\u65F6\u4F1A\u91CD\u8BD5\uFF1A", cause);
          installed.signature = "";
        }
      };
      const stopCatalog = onCatalogLoaded(syncSources);
      const unsubscribe = ctx.locale.subscribe(syncSources);
      syncSources();
      return () => {
        stopCatalog();
        unsubscribe();
        installed.dispose();
      };
    }, "t-team: input triggers");
  });
}
    return module.exports;
  }
});
