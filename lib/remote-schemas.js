// @ts-check
/**
 * Remote 线格式的**单一 schema 源**（A-2 / A-3）。
 *
 * 为什么要有这个文件：这些 schema 过去在 host（`lib/remote.js`）与客户端（`src/client/`）
 * 各写了一份。加一个 remote 方法或改一个字段要改两处，漏改一处
 * 不会在加载期报错，只会在调用期炸（或更糟：静默把字段剥掉）。
 *
 * 权威在 **host**：它同时是生产方与校验方（`lib/remote.js` 的 DESCRIPTORS 用的就是这些对象），
 * 客户端只是消费方。所以统一后 host 的校验强度不变，客户端变严——方向是安全的。
 *
 * ⚠️ 本文件只放**纯 schema**，不放 host 专属的 `descriptor()` 或客户端专属的 `direct()` 信封
 * —— 两端信封的字段（`id` 前缀、`result` 形状）本来就不同，强行合并反而更脆。
 */
import { z } from "zod";

export const expertSchema = z.object({
  slug: z.string(),
  name: z.string(),
  nameEn: z.string(),
  description: z.string(),
  descriptionEn: z.string(),
  emoji: z.string(),
  division: z.string(),
  divisionZh: z.string(),
  divisionEn: z.string(),
  conflict: z.boolean().optional(),
  /** 用户自建专家（可编辑/可删除）；内置专家不带此标记。 */
  custom: z.boolean().optional(),
  /** 自建专家文件指纹：编辑/删除时回传，用于拦住并发覆盖。 */
  hash: z.string().optional(),
  /**
   * 云端附件状态（2026-09-29 附件上云）。
   *
   * - `local`：这位专家的附件随包发布、本来就在本地，没有要下载的东西；
   * - `ready`：附件已从云端下载并校验过；
   * - `missing`：附件在云端、本地还没有 —— 面板与 `@` 弹窗据此显示「下载」按钮。
   */
  assets: z.enum(["local", "ready", "missing"]).optional(),
});

/** `fetchAssets` 的返回：拉取某位专家的云端附件之后的结果。 */
export const assetsFetchSchema = z.object({
  status: z.string(),
  bytes: z.number(),
  reason: z.string(),
});

/** 新建/编辑自建专家的入参（面板表单字段）。 */
export const customExpertInputSchema = z.object({
  slug: z.string().min(1).max(128).optional(),
  name: z.string().min(1).max(200),
  nameEn: z.string().max(200).optional(),
  description: z.string().min(1).max(1000),
  descriptionEn: z.string().max(1000).optional(),
  emoji: z.string().max(16).optional(),
  body: z.string().min(1).max(60000),
  /** 落点分区（自建分区目录名）；留空＝默认分区。服务端仍会自己校验一遍。 */
  division: z.string().max(128).optional(),
  /** 新建分区时的中文显示名（落在 <customRoot>/divisions.json）。 */
  divisionLabel: z.string().max(40).optional(),
});

/** `getCatalog` 及分类写回方法的返回快照。 */
export const catalogSnapshotSchema = z.object({
  experts: z.array(expertSchema),
  enabled: z.array(z.string()),
  revision: z.number().int().min(0),
  // 这两个字段必须声明：zod 会把 schema 里没有的键**直接剥掉**（实测），
  // 漏声明时面板拿到的快照里根本没有它们，界面上表现为"分区标签是空的"。
  customDivision: z.string().optional(),
  customDivisionLabel: z.string().optional(),
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
  sidecar: z.object({
    zhRoot: z.string(),
    present: z.boolean(),
    skippedFiles: z.number().int().min(0),
    unreadableDivisions: z.array(z.string()),
  }).optional(),
  /** 可选的落点分类（面板「分类」下拉与管理页）：官方在前，其余按目录/声明发现。 */
  categories: z.array(z.object({
    key: z.string(),
    label: z.string(),
    official: z.boolean(),
    count: z.number().int().min(0),
    customCount: z.number().int().min(0),
  })).optional(),
});

export const enabledStateSchema = z.object({
  enabled: z.array(z.string()),
  revision: z.number().int().min(0),
});

export const promptSchema = z.object({ prompt: z.string() });
