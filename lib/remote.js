// @ts-check
/**
 * T专家 remote 服务：把 host 侧的名册/启用状态/persona 通过 Typert Gateway 暴露给客户端面板。
 *
 * 服务名（wire namespace）= "tTeam"，与其它专家插件的 wire namespace 不冲突；
 * 客户端用 ctx.remote.$mount(描述符) + ctx.get("remote.tTeam") 取得代理。
 */
import { Remote, RemoteError, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { z } from "zod";
import { CATALOG_SERVICE, SETTINGS_NAMESPACE, UNKNOWN_SLUG_ERROR_CODE } from "./index.js";

/**
 * 领域码形态：`<domain>/<reason>`（如 `tTeam/unknown-expert`）。
 *
 * 只有通过它校验的 `error.code` 才允许当 wire code 透传 —— 系统 errno（`EACCES`…）不是领域码，
 * 透传出去会让客户端按 code 分支时把「文件权限」误认成业务失败类型（D-17）。口径与宿主网关一致
 * （`<domain>/<reason>`，见 docs/cookbook/adding-a-remote-api.md）。
 */
const DOMAIN_CODE_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*\/[a-z0-9-]+$/u;
/** 与 `lib/index.js` 共用的「未知专家 slug」稳定码（不用显示文案做分类，见 D-3）。 */
const UNKNOWN_SLUG_CODE = UNKNOWN_SLUG_ERROR_CODE;

// A-2/A-3：线格式 schema 的**单一源**在 ./remote-schemas.js（客户端也从这里取），
// 不再在本文件重复定义一份。host 仍是权威（本文件是生产方与校验方）。
import {
  assetsFetchSchema,
  catalogSnapshotSchema,
  customExpertInputSchema,
  enabledStateSchema,
  expertSchema,
  promptSchema,
} from "./remote-schemas.js";
import { snapshotSchema as skillGateSnapshotSchema } from "./skill-gate/remote-schemas.js";
import { GATE_SERVICE } from "./skill-gate/constants.js";


/** 一个 direct 调用描述符。 */
function descriptor(method, parameters, typeSymbol, schema) {
  return {
    id: `dsh-expert#tTeam/${method}`,
    service: "tTeam",
    namespace: "tTeam",
    method,
    invocation: { kind: "direct" },
    parameters,
    result: { mode: "strict", typeSymbol, schema, create: () => schema },
  };
}

const DESCRIPTORS = [
  descriptor("getCatalog", [], "TTeamCatalog", catalogSnapshotSchema),
  // 本地已有的专家头像（data URL）。没下载过资源的专家不在返回里，客户端回退 emoji。
  descriptor("getAvatars", [], "TTeamCatalog", z.record(z.string(), z.string())),
  // 云端附件（2026-09-29）：面板与 @ 弹窗给「附件未下载」的专家显示下载按钮，点了走这里。
  descriptor("fetchAssets", [
    {
      name: "slug",
      wire: "slug",
      source: "json",
      codec: { mode: "strict", typeSymbol: "string", schema: z.string().max(128), create: () => z.string().max(128) },
    },
  ], "TTeamAssets", assetsFetchSchema),
  // ---- 技能开关（2026-09-28 从 dsh-plugin-skill-gate 并入）----
  // ⚠️ 它们挂在**本插件已有的 tTeam 命名空间**下，没有单开第二个 remote 入口。
  // 起因：合并时先做成独立入口（`dsh-expert/skill-gate-remote` + `skillGate` 命名空间），
  // 但同一个包再挂一份 remote 在实机上没能生效（客户端 `ctx.get("remote.skillGate")` 始终是
  // undefined，面板显示「服务不可用」）。改挂到已被证明可用的 tTeam 通路上，确定性更高、
  // 也少一个入口要维护。方法名沿用原插件的 getSnapshot / setDisabled。
  descriptor("getSnapshot", [], "SkillGateSnapshot", skillGateSnapshotSchema),
  descriptor("setDisabled", [
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
  descriptor("setEnabled", [
    {
      name: "enabled",
      wire: "enabled",
      source: "json",
      codec: { mode: "strict", typeSymbol: "string[]", schema: z.array(z.string()), create: () => z.array(z.string()) },
    },
    {
      name: "expectedRevision",
      wire: "expectedRevision",
      source: "json",
      codec: { mode: "strict", typeSymbol: "number", schema: z.number().int().min(0), create: () => z.number().int().min(0) },
    },
  ], "TTeamEnabledState", enabledStateSchema),
  descriptor("getPrompt", [
    {
      name: "slug",
      wire: "slug",
      source: "json",
      codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(128), create: () => z.string().min(1).max(128) },
    },
    {
      name: "division",
      wire: "division",
      source: "json",
      codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(64), create: () => z.string().min(1).max(64) },
    },
  ], "TTeamPrompt", promptSchema),
  // 自建专家的增删改：都回传刷新后的整份名册快照，面板拿到就能直接重绘。
  descriptor("createExpert", [
    {
      name: "expert",
      wire: "expert",
      source: "json",
      codec: { mode: "strict", typeSymbol: "TTeamCustomExpertInput", schema: customExpertInputSchema, create: () => customExpertInputSchema },
    },
  ], "TTeamCatalog", catalogSnapshotSchema),
  descriptor("updateExpert", [
    {
      name: "slug",
      wire: "slug",
      source: "json",
      codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(128), create: () => z.string().min(1).max(128) },
    },
    {
      name: "expert",
      wire: "expert",
      source: "json",
      codec: { mode: "strict", typeSymbol: "TTeamCustomExpertInput", schema: customExpertInputSchema, create: () => customExpertInputSchema },
    },
    {
      name: "expectedHash",
      wire: "expectedHash",
      source: "json",
      codec: { mode: "strict", typeSymbol: "string", schema: z.string().max(64), create: () => z.string().max(64) },
    },
  ], "TTeamCatalog", catalogSnapshotSchema),
  descriptor("deleteExpert", [
    {
      name: "slug",
      wire: "slug",
      source: "json",
      codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(128), create: () => z.string().min(1).max(128) },
    },
    {
      name: "expectedHash",
      wire: "expectedHash",
      source: "json",
      codec: { mode: "strict", typeSymbol: "string", schema: z.string().max(64), create: () => z.string().max(64) },
    },
  ], "TTeamCatalog", catalogSnapshotSchema),
  // 分类管理：都回传刷新后的整份名册快照（面板拿到就能直接重绘）。
  descriptor("createCategory", [
    {
      name: "key",
      wire: "key",
      source: "json",
      codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(128), create: () => z.string().min(1).max(128) },
    },
    {
      name: "label",
      wire: "label",
      source: "json",
      codec: { mode: "strict", typeSymbol: "string", schema: z.string().max(40), create: () => z.string().max(40) },
    },
  ], "TTeamCatalog", catalogSnapshotSchema),
  descriptor("updateCategory", [
    {
      name: "key",
      wire: "key",
      source: "json",
      codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(128), create: () => z.string().min(1).max(128) },
    },
    {
      name: "label",
      wire: "label",
      source: "json",
      codec: { mode: "strict", typeSymbol: "string", schema: z.string().max(40), create: () => z.string().max(40) },
    },
  ], "TTeamCatalog", catalogSnapshotSchema),
  descriptor("deleteCategory", [
    {
      name: "key",
      wire: "key",
      source: "json",
      codec: { mode: "strict", typeSymbol: "string", schema: z.string().min(1).max(128), create: () => z.string().min(1).max(128) },
    },
  ], "TTeamCatalog", catalogSnapshotSchema),
];

/** Host 严格描述符表；Gateway 优先读取它，避免启动期 SRC 扫描漏掉后加载的外部插件服务。 */
const TYPERT = {
  package: "dsh-expert",
  face: "host",
  schemas: [],
  model: { services: [], events: [], objects: [] },
  invocations: DESCRIPTORS,
};

/**
 * 手写 JS 里没有标准装饰器语法，这里用官方 `Remote(exportName)` 装饰器函数
 * 手工打标记：伪造一个符合 TC39 decorator context 的对象，并让 addInitializer
 * 以「原型指向宿主类原型」的假实例立即执行，从而把标记写到真正的 prototype 上。
 */
function exposeRemoteMethods(Class, methods) {
  for (const method of methods) {
    const context = {
      kind: "method",
      name: method,
      static: false,
      private: false,
      access: { has: (object) => method in object, get: (object) => object[method] },
      addInitializer: (initializer) => initializer.call(Object.create(Class.prototype)),
    };
// @ts-expect-error 上游类型缺口：ClassMethodDecoratorContext 的形状比这里手工构造的上下文更严。
// 运行时有效（dsh-typert-protocol 的 addMarkerInitializer 只读 kind/name/static/private），见 verify 的 remote 小节。
    Remote(method)(Class.prototype[method], context);
  }
}

class TTeamRemote extends TypertRemoteService {
  // ⚠️ `settings` 此前在 inject 里但**未被读过**：cordis 要等 inject 里每一个服务就绪才实例化
  // 这个类（见 cordis 的 inject 实现），宿主 settings 一旦晚到，定时任务面板就跟着报
  // "服务暂时不可用"，排查的人却被引去查 typert 与调度引擎 —— 因为这才是表面报错处。
  // [8c] 现在盯着：`static inject` 不能含任何未被读取的字段。
  static inject = ["typert"];

  constructor(ctx) {
    super(ctx, "tTeam");
// @ts-expect-error 上游类型缺口：TypertRegistry.register(contribution) 未写进 TypertRegistryContract。
// 运行时有效：DSH 实际提供的 TypertRegistry 类实现了它（dsh-typert-registry/lib/index.js:398）。
    this.ctx.typert.register(TYPERT);
  }

  /**
   * host 侧服务缺失的统一领域错误。
   *
   * 一个访问器（catalog）共用它：**不要**裸抛 `Error` —— 裸 Error 过线会被
   * 网关折成 `gateway/internal`，领域信息全丢；也**不要**把「host 没加载」塞进别的领域码
   * （例如 `tTeam/missing-expert`），那会把「服务不可用」显示成「专家不存在」（D-4）。
   * @param name - 服务名（写进 details，便于面板区分是哪一个）。
   * @param hint - 面向用户/面板的原因说明。
   * @returns 带稳定 code 的 RemoteError。
   */
  hostUnavailable(name, hint) {
// @ts-expect-error 上游类型缺口：RemoteErrorDetailsMap 是**闭合**的 gateway 错误码集合，业务码不在其中。
// 运行时有效且是设计用法：plugin 自己的 tTeam/* 稳定码（映射文本是**远端**它时自行分类的，见 remote.js 顶部的业务码说明）。
    return new RemoteError("tTeam/host-unavailable", hint, { service: name });
  }

  /** 名册服务由 host 主插件通过 ctx.reflect.provide 提供。 */
  catalog() {
    const service = this.ctx.get(CATALOG_SERVICE);
    if (service === undefined) {
      throw this.hostUnavailable(CATALOG_SERVICE, "T专家 名册服务不可用（host 插件未加载或已卸载）");
    }
    return service;
  }

  /** 技能开关：完整快照（技能清单 + 计数 + 视角）。 */
  async getSnapshot() {
    try {
      return await skillGate.call(this).snapshot();
    } catch (error) {
      throw this.businessError(error, "tTeam/skill-gate-unreadable");
    }
  }

  /** 技能开关：整份替换停用名单（带乐观锁的修订号）。 */
  async setDisabled(disabled, expectedRevision) {
    const service = skillGate.call(this);
    if (service.getRevision() !== expectedRevision) {
// @ts-expect-error 上游类型缺口：同上，tTeam/* 业务码不在闭合的 RemoteErrorDetailsMap 里。
      throw new RemoteError("tTeam/conflict", "设置已被其他窗口修改，请重试。", { expectedRevision: String(expectedRevision) });
    }
    try {
      return await service.setDisabled(disabled);
    } catch (error) {
      throw this.businessError(error, "tTeam/skill-gate-unwritable");
    }
  }

  /** 动态名册：完整专家列表 + 已启用 slug + 修订号。 */
  async getCatalog() {
    try {
      return await this.catalog().snapshot();
    } catch (error) {
      // 服务缺失已在 catalog() 里铸成 tTeam/host-unavailable；这里只兜业务失败。
      throw this.businessError(error, "tTeam/catalog-unreadable");
    }
  }

  /**
   * 拉取某位专家的云端附件 —— 面板与 `@` 弹窗里那个「下载」按钮走的就是它。
   *
   * 幂等：附件已是最新版本时直接返回 `ready`，**不发网络请求**；附件随包发布的专家返回
   * `status: "local"`（没有要下载的东西）；失败时 `status: "failed"` 且带原因。
   */
  /** 本地已有的专家头像：`{ [slug]: dataUrl }`，只含已下载资源的那些。 */
  async getAvatars() {
    try {
      return await this.catalog().avatars();
    } catch (error) {
      throw this.businessError(error, "tTeam/avatars-unreadable");
    }
  }

  async fetchAssets(slug) {
    try {
      return await this.catalog().fetchAssets(slug);
    } catch (error) {
      throw this.businessError(error, "tTeam/assets-fetch-failed");
    }
  }









  async setEnabled(enabled, expectedRevision) {
    try {
      return await this.catalog().setEnabled(enabled, expectedRevision);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code = typeof error === "object" && error !== null ? error.code : undefined;
      // 裸 Error 过线会退化成 gateway/internal 并丢掉 code，所以业务错误统一转成 RemoteError。
      //
      // 冲突**只认稳定 code**，不再按显示文案兜底（复核 F-3）。依据：
      //   · 宿主 SettingsConflictError 自带 `code = "SETTINGS_CONFLICT"`，且 dsh-settings 的
      //     Service Definition 在 JSDoc 里承诺「namespace 移动后拒绝写入即抛 SettingsConflictError」
      //     —— 也就是说这个 code 是**契约的一部分**，不是实现细节；
      //   · 原先那条 `/changed since it was read|another window|其他窗口/` 与 D-3 被修掉的根因同类：
      //     用随宿主版本/locale 变的文案做身份判断，宿主一改措辞冲突就会被误归成 settings-failed；
      //   · 「其他窗口」在本仓根本不存在于宿主侧，纯属臆测的变体。
      // 因此无 code 的同类错误会落到下面的 settings-failed（可见且可诊断），而不是被文案猜成冲突。
      if (code === "SETTINGS_CONFLICT") {
// @ts-expect-error 上游类型缺口：同上，tTeam/* 业务码不在闭合的 RemoteErrorDetailsMap 里。
        throw new RemoteError("tTeam/conflict", message, { expectedRevision: String(expectedRevision) });
      }
      // 未知专家 slug 由 host 侧抛带稳定 code 的错误（lib/index.js 的 customError）。
      // **不再**用 message.includes("未知专家") 分类 —— 显示文案随 locale 变，用它做身份会让
      // 非中文 locale（或任何文案改写）下的错误直接退化成裸 Error，客户端只剩 gateway/internal（D-3）。
      if (code === UNKNOWN_SLUG_CODE) {
// @ts-expect-error 上游类型缺口：同上，tTeam/* 业务码不在闭合的 RemoteErrorDetailsMap 里。
        throw new RemoteError("tTeam/unknown-expert", message, {});
      }
      throw this.businessError(error, "tTeam/settings-failed");
    }
  }


  /**
   * 业务错误统一转 RemoteError（裸 Error 过线会退化成 gateway/internal 并丢掉 code）。
   *
   * `error.code` 只有**形如 `<domain>/<reason>`** 才能当 wire code 用：系统 errno
   * （`EACCES`/`ENOENT`/`EPERM`…）过线后被客户端按 code 分支时会误当领域码（D-17），
   * 所以形态不符一律回落 `fallbackCode`。
   * @param {unknown} error - 被捕获的原错误。
   * @param {string} fallbackCode - 该访问器的领域码。
   *
   * ⚠️ 这两个类型标注不能省：`error` 缺标注时它是 `any`，`candidate` 跟着变 `any`，
   * 于是下面 `new RemoteError(...)` 的类型检查整个失效（TS 对 any 一律放行）——
   * 表现是这里**本该有**的那道「上游类型缺口」抑制指令根本不需要存在，
   * 而一旦谁补上标注，tsc 就会立刻报它 unused。辅助补丁同一个方法踩过这个坑（0.13.0 修）。
   */
  businessError(error, fallbackCode) {
    if (error instanceof RemoteError) return error;
    const message = error instanceof Error ? error.message : String(error);
    // `unknown` 经 `typeof === "object"` 收窄后在 TS 眼里仍是 `object`（上面没有 code），
    // 所以显式当成「可能带 code 的未知对象」来读 —— 比把参数标成 any 好，any 会往下传染。
    const maybeCode = /** @type {{ code?: unknown }} */ (
      typeof error === "object" && error !== null ? error : {}
    ).code;
    const candidate = typeof maybeCode === "string" ? maybeCode : undefined;
// @ts-expect-error 上游类型缺口：同上，tTeam/* 业务码不在闭合的 RemoteErrorDetailsMap 里。
    return new RemoteError(DOMAIN_CODE_PATTERN.test(candidate ?? "") ? candidate : fallbackCode, message, {});
  }

  /** 按需读取一位专家的 persona 正文（面板预览用）。 */
  async getPrompt(slug, division) {
    // 先判服务：服务缺失要说「host 不可用」，不能说「专家不存在」——客户端把后者当
    // 「这位专家不在名册里」，用户于是去一个根本没加载的名册里找人（D-4）。
    const service = this.catalog();
    try {
      return await service.prompt(slug, division);
    } catch (error) {
      throw this.businessError(error, "tTeam/missing-expert");
    }
  }

  /**
   * 新建自建专家。服务侧校验 slug 合法性、与内置/自建 slug 撞车、以及与既有专家重名
   * （重名会把内置那位一起标成冲突、双双不可召唤，所以必须挡在写盘前）。
   */
  async createExpert(expert) {
    try {
      return await this.catalog().createExpert(expert);
    } catch (error) {
      throw this.businessError(error, "tTeam/custom-invalid");
    }
  }

  /** 编辑自建专家；`expectedHash` 是打开表单时拿到的指纹，不符即并发冲突。 */
  async updateExpert(slug, expert, expectedHash) {
    try {
      return await this.catalog().updateExpert(slug, expert, expectedHash);
    } catch (error) {
      throw this.businessError(error, "tTeam/custom-invalid");
    }
  }

  /** 删除自建专家；同样做指纹校验。 */
  async deleteExpert(slug, expectedHash) {
    try {
      return await this.catalog().deleteExpert(slug, expectedHash);
    } catch (error) {
      throw this.businessError(error, "tTeam/custom-invalid");
    }
  }

  /** 新建自建分类（可以先是空分类）。 */
  async createCategory(key, label) {
    try {
      return await this.catalog().createCategory(key, label);
    } catch (error) {
      throw this.businessError(error, "tTeam/category-invalid");
    }
  }

  /** 改自建分类的显示名（官方分类只读，服务端会拒）。 */
  async updateCategory(key, label) {
    try {
      return await this.catalog().updateCategory(key, label);
    } catch (error) {
      throw this.businessError(error, "tTeam/category-invalid");
    }
  }

  /** 删除自建分类（里面还有自建专家就拒）。 */
  async deleteCategory(key) {
    try {
      return await this.catalog().deleteCategory(key);
    } catch (error) {
      throw this.businessError(error, "tTeam/category-invalid");
    }
  }
}

/**
 * host 侧的技能开关服务（由 lib/skill-gate/install.js 在 skills 就绪后 provide）。
 * 与 catalog() 同样的口径：服务缺失给领域错误，不裸抛。
 */
function skillGate() {
  const service = this.ctx.get(GATE_SERVICE);
  if (service === undefined) {
    throw this.hostUnavailable(GATE_SERVICE, "技能开关服务不可用（宿主没挂上 skills 服务，或技能开关装配失败）");
  }
  return service;
}

exposeRemoteMethods(TTeamRemote, [
  "getCatalog", "setEnabled", "getPrompt",
  // 云端附件（2026-09-29）：面板与 @ 弹窗的「下载」按钮走它。
  "fetchAssets",
  // 本地已有的专家头像（2026-09-29）：面板与 @ 弹窗据此显示真头像，缺了就回退 emoji。
  "getAvatars",
  // 技能开关（原 dsh-plugin-skill-gate 的两个方法，2026-09-28 并入）
  "getSnapshot", "setDisabled",
  "createExpert", "updateExpert", "deleteExpert",
  "createCategory", "updateCategory", "deleteCategory",
]);

export { SETTINGS_NAMESPACE, DESCRIPTORS, TYPERT };
export default TTeamRemote;
