/**
 * 客户端侧 remote 信封（direct + TYPERT_REMOTE）
 *
 * 本文件由原单文件 `src/client.jsx`（5278 行）按职责拆分而来，**内容逐行保持不变**：
 * 拼接顺序仍是原文件的行序，跨文件引用由 esbuild 打包回同一个
 * `window.__ModuleLoader__.load({id, factory})` 产物（lib/client.js），
 * 因此对产物的断言与行为一律不变。新增代码请放进对应职责的文件。
 */
import { z } from "zod";
import { PLUGIN_ID } from "./state.js";
import {
  assetsFetchSchema,
  expertSchema,
  customExpertInputSchema,
  enabledStateSchema,
  promptSchema,
  catalogSnapshotSchema as catalogSchema,
} from "../../lib/remote-schemas.js";
import { snapshotSchema as skillGateSnapshotSchema } from "../../lib/skill-gate/remote-schemas.js";
// ---------------------------------------------------------------- remote 契约


/** 新建/编辑自建专家的表单载荷。 */



// A-2/A-3：线格式 schema 的**单一源**在 lib/remote-schemas.js（host 与客户端共用一份）。
// 本地别名保持下游引用名不变：catalogSchema 是客户端的旧名，共享源里叫 catalogSnapshotSchema。

/**
 * 客户端侧的 direct 调用信封（host 侧对应 `lib/remote.js` 的 `descriptor()`）。
 *
 * namespace 参数化（2026-09-28 并入技能开关时）：本插件现在提供**两个** Typert 服务 ——
 * `tTeam`（专家名册、分类）与 `skillGate`（技能开关，从 dsh-plugin-skill-gate 搬来）。
 * 刻意保留两个独立命名空间而不是合并成一个：两边的 wire schema、客户端信封与断言
 * 都能原地不动，合并的风险面最小。
 */
export function directIn(namespace, method, parameters, typeSymbol, schema) {
  return {
    id: `${PLUGIN_ID}#${namespace}/${method}`,
    service: namespace,
    namespace,
    method,
    invocation: { kind: "direct" },
    parameters,
    result: { mode: "strict", typeSymbol, schema, create: () => schema },
  };
}

/** 默认命名空间（专家名册）的 direct：老的调用点写法不变。 */
export function direct(method, parameters, typeSymbol, schema) {
  return directIn("tTeam", method, parameters, typeSymbol, schema);
}

export const TYPERT_REMOTE = {
  package: PLUGIN_ID,
  descriptors: [
    direct("getCatalog", [], "TTeamCatalog", catalogSchema),
    // 本地已有的专家头像（data URL）—— 必须与宿主 descriptor 成对，否则 verify 会拦。
    direct("getAvatars", [], "TTeamCatalog", z.record(z.string(), z.string())),
    // 云端附件（2026-09-29）：面板与 @ 弹窗里那个「下载」按钮走这里。
    direct("fetchAssets", [
      { name: "slug", wire: "slug", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(128), create: () => z.string().min(1).max(128) } },
    ], "TTeamAssets", assetsFetchSchema),
    // ---- 技能开关（2026-09-28 从 dsh-plugin-skill-gate 并入）----
    // 挂在同一个 tTeam 命名空间下：合并时先做成独立入口（skillGate），实机上没能挂上
    // （`ctx.get("remote.skillGate")` 始终 undefined），改走这条已被证明可用的通路。
    direct("getSnapshot", [], "SkillGateSnapshot", skillGateSnapshotSchema),
    direct("setDisabled", [
      {
        name: "disabled",
        wire: "disabled",
        source: "json",
        codec: { mode: "strict", typeSymbol: "string[]", schema: z.array(z.string().max(128)).max(4000), create: () => z.array(z.string().max(128)).max(4000) },
      },
      {
        name: "expectedRevision",
        wire: "expectedRevision",
        source: "json",
        codec: { mode: "strict", typeSymbol: "number", schema: z.number().int().min(0), create: () => z.number().int().min(0) },
      },
    ], "SkillGateSnapshot", skillGateSnapshotSchema),
    direct("setEnabled", [
      { name: "enabled", wire: "enabled", source: "json", codec: { mode: "strict", typeSymbol: "string[]", schema: z.array(z.string()), create: () => z.array(z.string()) } },
      { name: "expectedRevision", wire: "expectedRevision", source: "json", codec: { mode: "strict", typeSymbol: "number", schema: z.number().int().min(0), create: () => z.number().int().min(0) } },
    ], "TTeamEnabledState", enabledStateSchema),
    direct("getPrompt", [
      { name: "slug", wire: "slug", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(128), create: () => z.string().min(1).max(128) } },
      { name: "division", wire: "division", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(64), create: () => z.string().min(1).max(64) } },
    ], "TTeamPrompt", promptSchema),
    direct("createExpert", [
      { name: "expert", wire: "expert", source: "json", codec: { mode: "strict", typeSymbol: "TTeamCustomExpertInput", schema: customExpertInputSchema, create: () => customExpertInputSchema } },
    ], "TTeamCatalog", catalogSchema),
    direct("updateExpert", [
      { name: "slug", wire: "slug", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(128), create: () => z.string().min(1).max(128) } },
      { name: "expert", wire: "expert", source: "json", codec: { mode: "strict", typeSymbol: "TTeamCustomExpertInput", schema: customExpertInputSchema, create: () => customExpertInputSchema } },
      { name: "expectedHash", wire: "expectedHash", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: z.string().max(64), create: () => z.string().max(64) } },
    ], "TTeamCatalog", catalogSchema),
    direct("deleteExpert", [
      { name: "slug", wire: "slug", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(128), create: () => z.string().min(1).max(128) } },
      { name: "expectedHash", wire: "expectedHash", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: z.string().max(64), create: () => z.string().max(64) } },
    ], "TTeamCatalog", catalogSchema),
    direct("createCategory", [
      { name: "key", wire: "key", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(128), create: () => z.string().min(1).max(128) } },
      { name: "label", wire: "label", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: z.string().max(40), create: () => z.string().max(40) } },
    ], "TTeamCatalog", catalogSchema),
    direct("updateCategory", [
      { name: "key", wire: "key", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(128), create: () => z.string().min(1).max(128) } },
      { name: "label", wire: "label", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: z.string().max(40), create: () => z.string().max(40) } },
    ], "TTeamCatalog", catalogSchema),
    direct("deleteCategory", [
      { name: "key", wire: "key", source: "json", codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(128), create: () => z.string().min(1).max(128) } },
    ], "TTeamCatalog", catalogSchema),
  ],
};

/** remote 结果解包（原 skill-gate 的 unwrap：失败分支抛带 code 的 Error）。 */
export function unwrap(result, action) {
  if (result !== null && typeof result === "object" && typeof result.ok === "boolean") {
    if (result.ok !== true) {
      const error = new Error(result.error?.message ?? `${action} failed`);
      error.code = result.error?.code;
      throw error;
    }
    return result.value;
  }
  return result;
}
