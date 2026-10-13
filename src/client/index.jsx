/**
 * 客户端插件入口（槽位注册与上游引擎物化）
 *
 * 本文件由原单文件 `src/client.jsx`（5278 行）按职责拆分而来，**内容逐行保持不变**：
 * 拼接顺序仍是原文件的行序，跨文件引用由 esbuild 打包回同一个
 * `window.__ModuleLoader__.load({id, factory})` 产物（lib/client.js），
 * 因此对产物的断言与行为一律不变。新增代码请放进对应职责的文件。
 */
// 构建：npm run build（原 ops/tz.sh build）。入口 = 本文件；源码按职责拆在 src/client/ 下，
// esbuild 会把它们打回**同一个**客户端模块 id 的 factory。
import React from "react";
import { SectionBoundary } from "./boundary.jsx";
import { displayName, divisionLabel, matchExpert, onCatalogLoaded, referenceOf, refresh, snapshotOf, warmupAssets } from "./catalog.js";
import { CSS } from "./css.js";
import { en, zh } from "./i18n.js";
import { insertAtTarget, insertSkillHint, resolveInputTarget } from "./insert.js";
import { TYPERT_REMOTE } from "./remote.js";
import { SettingsPanel } from "./settings.jsx";
import { NS, PLUGIN_ID } from "./state.js";
import { SummonButton } from "./summon.jsx";
// ---------------------------------------------------------------- 客户端插件
// 我们的服务 + 上游 client 需要的服务（uiConversation / modelDirectories / layout）
export const inject = [
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
  "layout",
];

/**
 * 分阶段执行：任何一步失败都只记日志并降级，**不把异常抛给宿主**。
 *
 * 为什么必须这样：客户端插件 entry 一旦变成 FAILED，宿主的启动审计
 * （`web boot: N entry did not activate`，见 dsh 的 boot-client/assertEntriesActive）
 * 会让**整个 Web GUI** 停在 "Failed to load plugins" 页 —— mountClient 根本不会执行。
 * 某个扩展点在某个宿主版本上不兼容，不该有"整个 GUI 打不开"这种后果。
 * 失败一律打 `[t-team]` 前缀的 console.error，便于按阶段定位。
 */
async function stage(label, run) {
  try {
    return await run();
  } catch (error) {
    console.error(`[t-team] 阶段「${label}」失败，已降级（GUI 与其余功能不受影响）：`, error);
    return undefined;
  }
}

export async function apply(ctx) {
  await stage("样式注入", () => ctx.effect(() => {
    const tag = document.createElement("style");
    tag.dataset.plugin = PLUGIN_ID;
    tag.textContent = CSS;
    document.head.appendChild(tag);
    return () => tag.remove();
  }, "t-team: style"));

  await stage("字典注册", () => ctx.effect(() => ctx.locale.register(NS, { zh, en }), "t-team: dictionaries"));

  // 只有 zh/en 两套内容：任何 zh* 变体（zh-Hant 等）都按中文取，其余按英文取。
  // 之前只认 "en"，于是 zh-Hant 会拿到英文界面 + 中文专家名，变成混合语言界面。
  const getActive = () => (String(ctx.locale.getSnapshot().active ?? "").toLowerCase().startsWith("zh") ? "zh" : "en");

  // remote 是全部功能的根：挂不上就没有名册、面板与 @ 召唤，但**不抛错**（理由见 stage）。
  // 降级退出后 GUI 照常启动，console 里会留下失败的那个阶段与原始异常。
  const remote = await stage("remote 挂载", async () => {
    const disposeRemote = await ctx.remote.$mount(TYPERT_REMOTE);
    ctx.effect(() => disposeRemote, "t-team: remote");
    return ctx.get("remote.tTeam");
  });

  // 技能开关（2026-09-28 并入）与专家名册共用**同一份** remote：它的两个方法
  // （getSnapshot / setDisabled）就挂在 tTeam 命名空间下，所以这里没有第二次 mount。
  const skillRemote = remote;
  if (remote === undefined) {
    console.error(`[t-team] remote 命名空间不可用（${ctx.locale.bind(NS)("error.remoteUnavailable")}）：专家名册、面板与 @ 召唤均不可用，但 GUI 正常启动。`);
    return;
  }

  await refresh(remote, true).catch((cause) => {
    console.warn("[t-team] 初始名册读取失败，设置页可重试：", cause);
  });

  // 其余 UI 注册整段保护：任何一项在某个宿主版本上注册失败，都只降级并记录，
  // 绝不让 entry 变成 FAILED（那会让整个 Web GUI 停在 "Failed to load plugins"）。
  await stage("UI 注册", async () => {
  // ---- 设置卡片：挂在官方「插件信息」页 ----
  // 2026-09-28 用户口径：**不要在「设置」里单开分区**，做到插件自己的信息页上
  // （与 dsh-helper 同一处：插件列表 → T专家 → 详情页里那张配置卡片）。
  // 宿主正是拿这个槽位的 key 集合判断某个 bundle 有没有配置可展示（详情页的 configured），
  // key 必须等于本 bundle 的包名，写错卡片就不会出现。
  ctx.slots.inject("plugins.bundle.config", () => ctx.slots.register({
    name: "plugins.bundle.config",
    key: PLUGIN_ID,
    // 文案一律走字典（规范：产品可见文案由 locale 拥有，不接受硬编码分支）
    locale: NS,
  }, (props) => React.createElement(SettingsPanel, { ...props, t: ctx.locale.bind(NS), remote, skillRemote, getActive })));

  // ---- 工具行「召唤专家」按钮（conversation.input.left）----
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
        insertSkillHint: (text) => insertSkillHint(target(), text),
      };
    },
  }, (props) => React.createElement(SummonButton, { ...props, t: ctx.locale.bind(NS), remote, getActive, rootRemote: ctx.remote })));

  // ---- @ 触发菜单：每个分区一个来源 ----
  /**
   * 按给定分区列表注册 source（返回清理函数）。
   * 分区列表由调用方决定：名册还没读到时**不能**注册任何 source，
   * 否则 `@` 菜单会在这个会话里永久为空（旧实现在 refresh 失败时就是这个行为）。
   */
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
            const current = await refresh(remote).catch(() => undefined);
            if (current === undefined) return [];
            const query = String(request?.query ?? "").toLowerCase();
            return current.experts
              .filter((expert) => expert.division === item && expert.conflict !== true && current.enabledSet.has(expert.slug) && matchExpert(expert, getActive(), query))
              .map((expert) => ({
                name: displayName(expert, getActive()),
                hint: expert.slug,
                section: ctx.locale.bind(NS)("trigger.group", { division: divisionLabel(expert, getActive()) }),
              }));
          },
          onPick(pick) {
            const slug = pick?.candidate?.hint ?? "";
            const current = snapshotOf(remote);
            const expert = current?.experts.find((entry) => entry.slug === slug && current.enabledSet.has(slug));
            if (expert === undefined) return undefined;
            // 点了就是要用（用户口径 2026-09-29）：后台预热云端附件 —— 插入引用本身仍是瞬时的。
            warmupAssets(remote, expert);
            return { insert: referenceOf(expert, getActive()) };
          },
          codec: {
            clipboardText: (slug) => {
              const current = snapshotOf(remote);
              const expert = current?.experts.find((entry) => entry.slug === slug);
              return expert === undefined ? ctx.locale.bind(NS)("trigger.removed") : `@${displayName(expert, getActive())}\u00a0`;
            },
            // 提交草稿时宿主用它把芯片展开成纯文本；专家被停用/移除时抛错阻止发送。
            async serialize(slug) {
              const current = await refresh(remote).catch(() => undefined);
              const expert = current?.experts.find((entry) => entry.slug === slug);
              if (expert === undefined || current.enabledSet.has(expert.slug) !== true) {
                throw new Error(ctx.locale.bind(NS)("trigger.removed"));
              }
              return `@${displayName(expert, getActive())}\u00a0`;
            },
          },
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
    // 已注册的快照：签名 = 当前语言 + 分区列表。名册或语言一变就重建。
    const installed = { signature: "", dispose: () => undefined };
    const syncSources = () => {
      const snapshot = snapshotOf(remote);
      const divisions = [...new Set((snapshot?.experts ?? []).map((expert) => expert.division))].sort();
      if (divisions.length === 0) {
        // 名册还没读到：保持未注册状态，等下一次成功读取时再补（catalog 通知会回调这里）。
        installed.signature = "";
        return;
      }
      const signature = `${getActive()}|${divisions.join(",")}`;
      if (signature === installed.signature) return;
      installed.dispose();
      installed.dispose = () => undefined;
      try {
        installed.dispose = registerSources(getActive(), divisions);
        installed.signature = signature;
      } catch (cause) {
        console.error("[t-team] 注册 @ 菜单失败，下一次名册读取时会重试：", cause);
        installed.signature = "";
      }
    };

    const stopCatalog = onCatalogLoaded(syncSources);
    const unsubscribe = ctx.locale.subscribe(syncSources);
    syncSources();                       // 名册已经读过时立即注册；否则留给通知回调
    return () => {
      stopCatalog();
      unsubscribe();
      installed.dispose();
    };
  }, "t-team: input triggers");
  });
}
