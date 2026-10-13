// @ts-check
import { z } from "zod";

/**
 * 视角数量上限。行级 `views` 与快照 `views` 共用它：
 * 一个技能最多出现在全部视角里，两处上限必须相等，否则一处放宽就漏校验。
 */
export const MAX_VIEWS = 256;

export const skillRowSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(400),
  source: z.string().min(1).max(64),
  provider: z.string().min(1).max(64),
  nativeModel: z.boolean(),
  nativeUser: z.boolean(),
  gated: z.boolean(),
  modelVisible: z.boolean(),
  /** 这条技能出现在哪些视角里；面板按视角过滤时用它。 */
  views: z.array(z.string().min(1).max(128)).max(MAX_VIEWS),
});

export const countsSchema = z.object({
  total: z.number().int().min(0),
  modelVisible: z.number().int().min(0),
  gated: z.number().int().min(0),
  nativeOff: z.number().int().min(0),
});

/**
 * 一个读取视角：谁在读这份目录，以及它实际看到多少。
 * 四个计数与 {@link countsSchema} 同构，面板在「全部来源」和具体视角之间直接换数据源即可。
 */
export const viewRowSchema = z.object({
  key: z.string().min(1).max(128),
  kind: z.string().min(1).max(32),
  name: z.string().max(120),
  total: z.number().int().min(0),
  modelVisible: z.number().int().min(0),
  gated: z.number().int().min(0),
  nativeOff: z.number().int().min(0),
});

export const snapshotSchema = z.object({
  revision: z.number().int().min(0),
  storePath: z.string().min(1).max(1024),
  skills: z.array(skillRowSchema).max(4000),
  counts: countsSchema,
  views: z.array(viewRowSchema).max(MAX_VIEWS),
});
