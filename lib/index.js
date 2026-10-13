// @ts-check
/**
 * T专家 host 插件：把 ~/.t-team/experts 里的专家名册接到 DSH。
 *
 * 提供：
 *   - 工具 list_t_experts / summon_t_expert / summon_t_experts
 *   - 设置段 t-team（enabled: 已启用的专家 slug）
 *   - systemPrompt 段（只在父会话里说明 @ 召唤语义与工具用法）
 *   - 服务 tTeamCatalog（远程服务用它读名册与 persona）
 *
 * 与其它专家插件并存：工具名、设置命名空间、服务名、remote 服务名都不重叠。
 */
import { homedir } from "node:os";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { mkdir, readFile, stat, rmdir } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import schema from "@deepseek-ai/schemastery";
import { defineTool } from "@deepseek-ai/dsh-tools";
import {
  CUSTOM_DIVISION,
  CUSTOM_LIMITS,
  catalogDivisions,
  countExperts,
  customExpertPath,
  divisionOf,
  fileFingerprint,
  groupByDivision,
  isValidDivision,
  isValidSlug,
  loadCatalog,
  mapPool,
  normalizedKey,
  readPersona,
  removeCustomExpert,
  resolveExpert,
  sanitize,
  saveCustomLabel,
  serializeCustomExpert,
  truncate,
  writeFileAtomic,
} from "./catalog.js";
// 云端附件分发（2026-09-29）：人格留在本地，技能与数据文件按需从 OBS 拉取。
import { annotatePersona, assetsState, ensureAssets, kickoffAssets, loadRoster, packInfoFor, ASSETS_READY, fetchRemoteRoster, readCachedRoster, writeCachedRoster, mergeRosters, ROSTER_TTL_MS } from "./fetch-assets.js";

/**
 * 插件根目录（`lib/` 的上一级）。
 * 云端分发清单 `data/roster.json` 就放在它下面 —— 清单一律**随包走**，
 * 不从用户数据目录读：它描述的是「哪些专家包有大附件」，与用户自己的增删无关。
 */
const HERE = dirname(dirname(fileURLToPath(import.meta.url)));
// 技能开关（2026-09-28 从 dsh-plugin-skill-gate 整体搬来）：包装 ctx.skills，把名单里的技能
// 从模型目录里摘掉。装配入口是动态 inject 调的 —— 宿主没有 skills 服务时只少这一块。
import { installSkillGate } from "./skill-gate/install.js";
import { localized, NS, readLocale, renderList, renderSummonResults, t, toRenderableGroups, toRenderableSummonResults } from "./i18n.js";
import { seedData } from "./bootstrap.js";
import { installBundledSkills } from "./skill.js";
import { SNAPSHOT_DIR } from "./bootstrap.js";
// 两个插件允许同时安装同时可用，所以存储、服务名、错误码、消息来源全都各走各的。
import { createUserMessage } from "@deepseek-ai/dsh-llm";

export const name = NS;
/**
 * 静态注入的**只有硬依赖**：少了它们，名册功能本身就不成立（工具表、子代理、提示段）。
 *
 * `settings` 与 `commands` 刻意**不在这里**：它们是可选能力，cordis 遇到缺失的静态 inject
 * 会让整个 fiber 静默 pending —— 插件一行日志都不会打，用户既看不到工具也得不到原因。
 * 两者改为在 `apply` 里做同步能力检查（缺了只降级对应功能并 warn）。
 */
export const inject = ["tools", "subagents", "systemPrompt"];

/**
 * 插件配置。
 *
 * 规范要求「部署可能取不同值的参数都必须是可被 cordis.yml 覆盖的 Config 字段」，
 * 所以召唤上限/并发、任务长度上限、简介截断长度都放在这里；
 * 模块级常量只保留协议常量与固定清单。
 */
/**
 * cosmokit 的 volatile 引用所用的全局 symbol —— 跨 ESM/CJS 副本的稳定判据。
 */
const VOLATILE_WRITE = Symbol.for("cosmokit.volatile.write");

/**
 * 读一个可能是 volatile 引用的配置值。
 *
 * 为什么不用 `typeof value.get === "function"`：普通对象也可能有 get；也不用 `instanceof`：
 * 多份 cosmokit 副本之间会漏判。0.1.7 的 volatile 字段在 Config 上就是这种引用。
 * @param value - Config 上的原始值。
 * @returns 引用的当前快照，或原值。
 */
const unwrapVolatile = (value) => (
  typeof value === "object" && value !== null && VOLATILE_WRITE in value ? value.get() : value
);

/**
 * 按宿主能力给字段打 `volatile` 标记。
 *
 * 为什么需要包装：`.volatile()` 是 DSH 0.1.7 才有的 schemastery API（旧宿主上是
 * `undefined`），而本插件要同时跑在 0.1.5/0.1.6 与 0.1.7+ 上 —— 直接调 `.volatile()`
 * 会让插件在旧宿主上一启动就抛 `field.volatile is not a function`。旧宿主上原样返回即可。
 * @param field - Config 字段 schema。
 * @returns 打了 volatile 标记的字段（宿主不支持时就是原字段）。
 */
const volatileField = (field) => (
  typeof field?.volatile === "function" ? field.volatile() : field
);

export const Config = schema.object({
  root: schema.string().default(join(homedir(), ".t-team", "experts")),
  zhRoot: schema.string().default(join(homedir(), ".t-team", "zh")),
  /**
   * 用户自建专家的根目录（与内置名册分开：内置名册随包发布、升级时整棵替换，自建专家放进去会被覆盖）。
   * 面板「新建专家」写到这里，固定落在 custom 分区。
   */
  customRoot: schema.string().default(join(homedir(), ".t-team", "custom")),
  provider: schema.string().default("spawn"),
  /** 留空 = 自动扫描 root 下所有含 .md 的分类目录（新增分类不必改配置/代码）。 */
  divisions: schema.array(schema.string()).default([]),
  maxDepth: schema.natural(),
  /** 一次 summon_t_experts 最多召唤几位专家。 */
  maxSummonBatch: schema.natural().min(1).default(8),
  /** summon_t_experts 的并发度。 */
  summonConcurrency: schema.natural().min(1).default(4),
  /** 单个专家任务的最大字符数。 */
  summonTaskMaxChars: schema.natural().min(1).default(8000),
  /** list_t_experts 里简介的截断长度。 */
  descriptionLimit: schema.natural().min(1).default(120),

  /**
   * 以下五个是**用户偏好**（专家启停 + 界面开关），不是部署配置。
   *
   * 为什么它们必须待在 Config 里：DSH 0.1.7 起设置服务不再提供 `register()` / 命名空间句柄
   * （PR #4587「project volatile Config through profile-backed forms」），用户偏好改由
   * 「entry Config 的 volatile 字段 + profile patch」承载。字段不进 Config，设置服务就
   * 列不出这个 entry —— 实测表现是服务端抛「T专家 设置段尚未注册」、设置页整块白屏、
   * `list_t_experts` 报「还没有启用任何专家」（2026-09-22 定位）。
   *
   * 旧宿主（≤0.1.6）读写的仍是 settings 命名空间（见 apply 里的 prefsMode），
   * 这些字段只是多出来的、带默认值的普通配置，不影响旧行为。
   */
  enabled: volatileField(schema.array(schema.string()).default([])),
  /** 兼容位：早期实现用的「已播种」布尔标记。幂等判据已改用 enabledSeedVersion。 */
  enabledSeeded: volatileField(schema.boolean().default(false)),
  /** 「默认全部启用」已按哪一版策略播种过；+1 即对所有用户重新播种一次。 */
  enabledSeedVersion: volatileField(schema.number().default(0)),
  /** 上一次播种时见到的名册（slug）。有了它才能区分「用户停用」与「名册新增」，见 seedDefaultEnabled。 */
  enabledSeedRoster: volatileField(schema.array(schema.string()).default([])),
  /**
   * 技能开关的名单文件（技能开关那部分的配置，2026-09-28 随它一起搬进来）。
   *
   * 默认仍是原来的 `~/.dsh/skill-gate.json` —— **刻意不改路径**：用户的名单就在那里，
   * 换路径等于把已有的开关状态清零。字段类型与其它 Config 一致（普通 string，
   * 不需要 volatile：它不属于「用户偏好」那套 profile patch 机制）。
   */
  skillGateStore: schema.string().default(join(homedir(), ".dsh", "skill-gate.json")),
});

/** 供 remote 服务读取名册的服务名。 */
export const CATALOG_SERVICE = "tTeamCatalog";

/** 设置命名空间（= 插件名）。 */
export const SETTINGS_NAMESPACE = NS;

/**
 * 「未知专家 slug」的稳定错误码（与 `lib/remote.js` 共用）。
 *
 * 为什么要有它：remote 侧过去靠 `message.includes("未知专家")` 判断这是不是「未知专家」，
 * 而 message 是**显示文案**（随 locale 变，也会被改写）——用它做错误身份，等于把分类建在
 * 会漂移的字符串上。这里给出稳定码，remote 只认码（D-3）。
 */
export const UNKNOWN_SLUG_ERROR_CODE = "tTeam/unknown-slug";


/** 「默认全部启用」的当前策略版本；把它 +1 即对所有用户重新播种一次（见 seedDefaultEnabled）。 */
const ENABLED_SEED_VERSION = 1;

const settingsSchema = schema.object({
  enabled: schema.array(schema.string()).default([]),
  /** 兼容位：早期实现用的「已播种」布尔标记。幂等判据已改用 enabledSeedVersion，保留它只为不弄坏已写入的旧数据。 */
  enabledSeeded: schema.boolean().default(false),
  /**
   * 「默认全部启用」已按哪一版策略播种过。见 seedDefaultEnabled。
   *
   * 为什么用版本号而不是布尔：策略本身会演进，而布尔是一次性的。早期实现是「只在 enabled 为空时播种」
   * 且播完就把布尔置 true —— 于是「早就手动启用过一部分」的老用户永远拿不到默认值（用户实测报过），
   * 而且置了 true 之后连改逻辑都救不回来。换成版本号后，+1 就能对所有人重新播种一次。
   */
  enabledSeedVersion: schema.number().default(0),
  /**
   * 上一次播种时见到的名册（slug 列表）。
   *
   * 为什么需要它：enabled 是白名单 —— 某位专家不在里面时，光看名单**分不清**「用户主动停用了它」
   * 还是「当时名册里压根还没有它」。有了名册基线就能区分：只有**名册新增**的才补进 enabled，
   * 用户停用过的（已在基线里）不会被重新打开。
   *
   * 2026-09-29 实测到的缺陷：导入 322 位 WorkBuddy 专家后，老用户的 enabledSeedVersion 早已是 1，
   * 播种被版本号挡住，于是这 322 位永远进不了 @ 菜单（面板显示名册 645、@ 弹窗只有 323）。
   * 光把版本号 +1 能修，但会连带把用户手动停用的专家全部重新打开 —— 所以改成按名册基线做增量。
   */
  enabledSeedRoster: schema.array(schema.string()).default([]),
});

/**
 * 把启动期名册同步的结果写进日志：**送达的内容要留痕，送不到的内容要出声**。
 *
 * 为什么单独成函数：旧实现只有一句 `copied.length > 0` 才打印的 info —— 于是「升级后
 * 包内新增的专家/译文一个都没到达」这件事在日志里**完全不存在**（2026-09-13 定性的
 * 恒存缺陷）。这里把「漂移状态变化」变成唯一告警条件：既不静默，也不每次启动刷屏。
 * @param logger - `ctx.logger`（可能缺席）。
 * @param seeded - `seedData` 的报告。
 * @param dataHome - 数据目录（日志里给人看的位置）。
 */
function logSeedReport(logger, seeded, dataHome) {
  const sample = (list) => (list.length === 0 ? "" : `，如 ${list.slice(0, 3).join("、")}${list.length > 3 ? " 等" : ""}`);
  const mergedKeys = seeded.merged.reduce((sum, item) => sum + item.keys.length, 0);
  const delivered = seeded.copied.length + seeded.updated.length + mergedKeys;
  const versionNote = seeded.previousVersion !== "" && seeded.previousVersion !== seeded.version
    ? `（包内快照 v${seeded.previousVersion} → v${seeded.version}）`
    : "";

  if (delivered > 0 || versionNote !== "") {
    const parts = [];
    if (seeded.copied.length > 0) parts.push(`新增 ${seeded.copied.length} 项${sample(seeded.copied)}`);
    if (seeded.updated.length > 0) parts.push(`对齐只读条目 ${seeded.updated.length} 项${sample(seeded.updated)}`);
    if (mergedKeys > 0) parts.push(`补齐键 ${mergedKeys} 个${sample(seeded.merged.flatMap((item) => item.keys))}`);
    logger?.info?.(`[t-team] 名册快照已同步到 ${dataHome}${versionNote}：${parts.join("；") || "无内容变更"}`);
  }

  // 送不到的必须出声：只在「与上次记录相比有变化」时告警一次，避免每次启动刷屏。
  if ((seeded.kept.length > 0 || seeded.stale.length > 0) && seeded.driftChanged) {
    const parts = [];
    if (seeded.kept.length > 0) parts.push(`${seeded.kept.length} 项与包内快照不同${sample(seeded.kept)}`);
    if (seeded.stale.length > 0) parts.push(`${seeded.stale.length} 项包内已移除${sample(seeded.stale)}`);
    logger?.warn?.(
      `[t-team] 名册快照有${parts.join("、")}；已按「不覆盖你的内容」保留盘上那份，未做任何覆盖。`
      + "若这些不是你改的，删掉对应文件后重启即可重新播种。",
    );
  }
}

/**
 * 包内名册的规模（专家数 / 分区数），**从名册目录现算**并按目录缓存。
 *
 * 为什么不能写死：提示段是**模型可见的事实**。把「a N-expert, M-division roster」写成
 * 字面量之后，名册增删或改分区之后那个 N/M 就对模型说谎，且没有任何东西会红
 * （2026-09-13 定性的恒存缺陷之一：数据更新了，模型看到的事实还是旧的）。现算 + 按目录
 * 缓存：一次 readdir 的开销，换来提示永远等于该名册的真实规模。
 *
 * 口径交给 `catalog.countExperts` —— 与名册扫描严格一致（目录形态专家包算 1 位、
 * **不递归进包内**）。旧实现在这里直接 `readdirSync(root, {recursive:true})` 数所有 `.md`，
 * 把附件里的 agents 提示词、skills 下的 SKILL.md 也算成了专家：645 位会显示成 6838 位。
 * 当时包内快照与运行时目录都有完整附件、**两边错得一样**，所以自检没红；
 * 2026-09-29 附件上云、包内快照瘦身后两边口径分叉，这个问题才暴露出来。
 *
 * @param root - 名册目录（包内快照或用户数据目录）。
 * @returns 规模；目录读不到时 `experts` 为 0（调用方据此改用不带数字的说法，而不是报 0 位）。
 */
const rosterScaleCache = new Map();
function rosterScale(root) {
  const key = typeof root === "string" ? root : "";
  const cached = rosterScaleCache.get(key);
  if (cached !== undefined) return cached;
  const scale = countExperts(key);
  rosterScaleCache.set(key, scale);
  return scale;
}

export function apply(ctx, config) {
  const locale = () => readLocale(ctx);
  const maxDepth = config.maxDepth;

  // ---- 启动期同步：包内自带名册快照 → 可写数据目录（缺失就补、只读对齐、用户内容不动）----
  const seeded = seedData({ root: config.root, zhRoot: config.zhRoot });
  logSeedReport(ctx.logger, seeded, dirname(config.root));
  if (!seeded.ok) {
    // 同步失败不当作致命：名册目录若因此缺失，第一次读名册会在 ensureReady() 里**响亮地**抛出
    // （error.rootMissing），那才是最早可解析点。这里只保证失败一定会出现在日志里。
    ctx.logger?.error?.(`[t-team] 名册快照同步失败，将按已有数据继续：${seeded.error}`);
  }

  // ---- 技能开关（原 dsh-plugin-skill-gate）----
  // ⚠️ 用**动态** ctx.inject 而不是静态 `inject = ["skills"]`：后者是强依赖，宿主某版本没有
  // skills 服务时 T专家 会整个不激活 —— 连专家名册与召唤一起没。这里拿不到就只少技能开关。
  if (typeof ctx.inject === "function") {
    // ⚠️ 只装一次：`ctx.inject` 的回调在依赖服务**被重新提供**时会再次触发，重复装配会把
    // `ctx.skills` 层层包装（wrapper 累积、卸载时的还原也会错位），而且 cordis 的
    // `reflect.provide` 对同名服务是**硬冲突**（`service "skillGateHost" has been registered
    // at <fiber>`，见 cordis 的 provide 实现：`if (this.store[key]) throw`）—— 第二次装配
    // 必然抛在 provide 那一步。
    //
    // 但"只装一次"不能等于"之后什么都不说"：宿主真把 skills 换成新实例时（另一个插件重载并
    // 重新 provide 了它），停用名单仍作用在**旧**实例上，新实例的技能不受约束 ——
    // 那是静默失效，用户关掉技能却发现它照样能被召唤，且日志里一个字都没有。所以这里出声。
    let installedSkills;   // undefined = 还没装过
    ctx.inject(["skills"], (scoped) => {
      const skillsCtx = scoped ?? ctx;
      const skills = skillsCtx?.skills;
      if (installedSkills === undefined) {
        installedSkills = skills;
        try {
          installSkillGate(skillsCtx, { storePath: config.skillGateStore });
        } catch (error) {
          ctx.logger?.error?.("[t-team] 技能开关装配失败（专家名册不受影响）：", error);
        }
        return;
      }
      if (skills === installedSkills) return;   // 同一个实例：已经包过，幂等
      ctx.logger?.warn?.("[t-team] 宿主的 skills 服务换了新实例，而技能开关仍作用在旧实例上："
        + "此后新装/重载的技能可能不受停用名单约束。重载 T专家 插件（或重启宿主）即可恢复；"
        + "专家名册与召唤不受影响。");
    });
  } else {
    ctx.logger?.warn?.("[t-team] 上下文没有 inject：技能开关不可用（专家名册不受影响）。");
  }




  // ---- 设置段（T专家 自己的命名空间，与其它插件不冲突）----
  // `settings` 是**可选**服务（见文件顶部的 inject 注释）：宿主没挂它时本插件仍要能加载并工作，
  // 所以不在静态 `inject` 里。
  //
  // ⚠️ 但**不能**用 `ctx.get("settings")` 做同步探测（2026-09-13 实测踩到）：把 settings 移出静态
  // inject 之后，`apply` 不再等待 settings 就绪，于是那一刻 `ctx.get("settings")` 是 undefined；
  // 而 cordis 的 `provide` **不会回溯通知**已经跑过的同步代码，于是这个判断**永久**为假 ——
  // 真实 GUI 里表现为「设置段没注册 → 点 T专家 是白板」（host 日志有对应 warn）。
  //
  // 正解是用 cordis 的 `ctx.inject`：它等的就是「该服务就绪」这件事，服务迟到也能补上。
  // `ctx.inject(["settings"])` 同时保留了「宿主真没有 settings 就不注册、只降级」的语义。
  /** @type {undefined | { get: () => any }} 设置段句柄；只有旧宿主（≤0.1.6）的 register 会给。 */
  let scope;
  /** @type {any} settings 服务本体；就绪后由 inject 赋值，`requireSettings()` 用它。 */
  let settingsService;
  /**
   * 偏好来源，两条路径**必须二选一**，不能"读得到就用、读不到就退"：
   * - `scope`：≤0.1.6 —— 偏好存在 settings 命名空间里，只有 register 返回的句柄读得到。
   * - `entry`：0.1.7+ —— 偏好就是本 entry 的 Config 字段（volatile 引用），直接读 Config。
   *
   * 为什么不能一律读 Config：0.1.7 给这些字段带了 schema 默认值，在旧宿主上误读 Config
   * 会把用户真实的启用名单读成一份空数组 —— 那正是这次事故的表象（「专家列表空了」）。
   */
  let prefsMode = "none";
  if (typeof ctx.inject !== "function") {
    // 只可能出现在极简/测试上下文里：如实说明，不要静默。
    ctx.logger?.warn?.("[t-team] 上下文没有 inject：无法等待 settings 就绪，专家启停不可用。");
  } else {
    // 先如实说一句"在等 settings"：`ctx.inject` 对**永不出现**的服务不会有任何回调，
    // 所以只在回调里告警的话，宿主真没给 settings 时用户/日志里**什么都看不到**（实测如此）。
    // 服务随后到了就正常注册；一直没到，这行就是唯一的原因线索。
    ctx.logger?.warn?.("[t-team] 正在等待 settings 服务就绪以注册设置段；若宿主不提供它，专家启停与设置页的 T专家 段将不可用。");
    ctx.inject(["settings"], (scoped) => {
      settingsService = scoped.settings ?? scoped.get?.("settings");
      if (typeof settingsService?.register === "function") {
        // ── 旧宿主（≤0.1.6）：按命名空间注册，读写都走返回的句柄。
        scope = settingsService.register(SETTINGS_NAMESPACE, settingsSchema, {
          base: { enabled: [], enabledSeeded: false, enabledSeedVersion: 0 },
          applies: "live",
          validate: (value) => {
            const list = value?.enabled;
            if (!Array.isArray(list) || list.some((item) => typeof item !== "string")) {
              throw new Error("t-team.enabled 必须是字符串数组");
            }
          },
        });
        prefsMode = "scope";
        return;
      }
      if (typeof settingsService?.mutate === "function") {
        // ── 0.1.7+：设置服务改由「entry Config 的 volatile 字段 + profile patch」承载
        //    （PR #4587 移除了 register/SettingsScope），没有句柄可拿，也没有东西要注册。
        //    读走 Config；写与修订号仍走 settings.mutate / settings.describe ——
        //    它们的 ns 就是 profile entry id，而本插件的 entry id 正是 SETTINGS_NAMESPACE。
        prefsMode = "entry";
        // 声明「本插件自带设置页」：否则 0.1.7 会按 Config schema 为这个 entry 自动生成
        // 一个表单页，与插件自己注册的「T专家」页重复（宿主 README 的适配指引即此）。
        if (typeof settingsService?.configure === "function" && typeof ctx.effect === "function") {
          ctx.effect(
            () => settingsService.configure({ auto: false }, ctx.fiber),
            "t-team: 设置页策略",
          );
        }
        return;
      }
      ctx.logger?.warn?.("[t-team] settings 服务既没有 register 也没有 mutate：专家启停不可用（名册与召唤不受影响）。");
    });
  }
  /**
   * 读偏好段（专家启停）。
   *
   * 来源严格按 `prefsMode` 二选一（理由见 prefsMode 注释）；0.1.7 的 Config 字段是
   * volatile 引用，统一 unwrap 后再用。
   * @returns 偏好对象；设置段不可用时为 undefined（调用方按各自语义处理）。
   */
  function readPrefs() {
    if (prefsMode === "scope") return scope?.get?.();
    if (prefsMode === "entry") {
      const source = config ?? {};
      return {
        enabled: unwrapVolatile(source.enabled),
        enabledSeeded: unwrapVolatile(source.enabledSeeded),
        enabledSeedVersion: unwrapVolatile(source.enabledSeedVersion),
      // 2026-09-29 修：漏读 enabledSeedRoster 会让 seedDefaultEnabled 把用户停用过的专家重新打开
      // （entry 模式下 seen 恒为 []，基线退化成当前 enabled，停用的 slug 被当成「新增」再写回）。
      enabledSeedRoster: unwrapVolatile(source.enabledSeedRoster),
      };
    }
    return undefined;
  }
  const enabledSet = () => new Set(
    (readPrefs()?.enabled ?? []).filter((value) => typeof value === "string"),
  );
  /**
   * 需要读写「专家启停」的路径在 settings 缺席时必须**响亮失败**。
   *
   * 为什么不能给个空集合凑合：那样 `list_t_experts` 会返回 `total=0`、readonly 工具报「未启用」，
   * 用户与模型都以为「名册是空的 / 什么都没开」，而不是「宿主没挂 settings」—— 正是要被消灭的
   * 那类静默错误。异常经工具错误面报出，原因可读（A-4）。
   */
  const requireSettings = () => {
    if (settingsService === undefined) throw new Error(t(locale(), "error.settingsServiceMissing"));
    return settingsService;
  };

  // ---- 花名册加载 ----
  let entries = [];
  // 初始为显式配置的分区（默认空）；空数组 = 交给 loadCatalog 自动发现，
  // 加载后 effectiveDivisions 会被 catalogDivisions() 的发现结果覆盖（不再有硬编码分区清单）。
  let effectiveDivisions = config.divisions.slice();
  /** 自建专家根下发现的分区（默认只有 custom）；进指纹，用于新建/删除后自动重载。 */
  let customDivisions = [];
  /** 只来自内置根的分区（官方、只读）：自建分区不许与它们重名。 */
  let rosterDivisions = [];
  /** 自建分类的显示名表（键 = 声明过的自建分类，允许空分类）。 */
  let customLabels = {};
  let divisionLabels = {};
  let loaded = false;
  let loading = null;
  let stamp = "";
  let loadError = null;
  /** 中文侧车目录是否存在（D-5：缺了要能被面板/日志看见，而不是静默变英文名册）。 */
  let sidecarPresent = true;
  /** 加载期被跳过的专家文件数（缺 frontmatter / 读不到 / 冲突，见 lib/catalog.js）。 */
  let skippedFiles = 0;
  /** 加载期读不动的分区目录（该分区专家整批缺席，D-18）。 */
  let unreadableDivisions = [];

  /**
   * 名册指纹：source.json、各分区目录、以及中文侧车文件的 mtime。
   *
   * 要点：运行期读的中文正文路径是 `zh/<分区>/<slug>.md`（不是 `manual-bodies/`，那是
   * 数据层的输入层，已冻结）。所以 `zhRoot` 与每个
   * `zh/<分区>/` 目录都必须进指纹 —— 否则「给某位专家**新增**一篇中文正文」这条最常见的
   * 补译操作不会触发重载：该专家的 personaPathZh 一直是 undefined，召唤时只能读英文。
   * （已在 verify 里用临时数据目录做过行为验证。）
   */
  async function fingerprint() {
    const mtimeOf = (path) => stat(path).then((info) => info.mtimeMs).catch(() => 0);
    const parts = await Promise.all([
      mtimeOf(config.root),
      mtimeOf(config.zhRoot),
      mtimeOf(join(config.zhRoot, "manual-bodies")),
      mtimeOf(join(dirname(config.root), "source.json")),
      mtimeOf(join(config.zhRoot, "names.json")),
      mtimeOf(join(config.zhRoot, "descriptions.json")),
      mtimeOf(join(config.zhRoot, "divisions.json")),
      mtimeOf(join(config.zhRoot, "manual.json")),
      ...effectiveDivisions.map((division) => mtimeOf(join(config.root, division))),
      ...effectiveDivisions.map((division) => mtimeOf(join(config.zhRoot, division))),
      ...effectiveDivisions.map((division) => mtimeOf(join(config.zhRoot, "manual-bodies", division))),
      // 自建专家根：目录本身（新增/删除分区目录时变）+ 各分区目录（增删改单个专家时变）。
      // 少了后一项，新建一位专家后指纹不变，面板要等到别的原因触发重载才看得到。
      mtimeOf(config.customRoot),
      ...customDivisions.map((division) => mtimeOf(join(config.customRoot, division))),
      // 自建分区的显示名表：改一个已有文件不会变动父目录的 mtime，必须单独进指纹，
      // 否则手工编辑 divisions.json 之后分区名不会刷新（与「新增 zh 正文不重载」同一类坑）。
      mtimeOf(config.customRoot === undefined || config.customRoot === "" ? "" : join(config.customRoot, "divisions.json")),
    ]);
    return parts.join("|");
  }

  async function load() {
    try {
      const catalog = await loadCatalog(config.root, config.divisions, {
        zhRoot: config.zhRoot,
        customRoot: config.customRoot,
        // 名册加载的诊断必须走宿主日志通道，而不是 console（N-3）：桌面/Web 里 stderr 用户看不到。
        logger: ctx.logger,
      });
      entries = [...catalog.values()];
      sidecarPresent = catalog.sidecarPresent !== false;
      skippedFiles = typeof catalog.skippedFiles === "number" ? catalog.skippedFiles : 0;
      unreadableDivisions = Array.isArray(catalog.unreadableDivisions) ? catalog.unreadableDivisions : [];
      const discovered = catalogDivisions(catalog);
      if (catalog.customDivisions !== undefined) customDivisions = catalog.customDivisions;
      if (catalog.rosterDivisions !== undefined) rosterDivisions = catalog.rosterDivisions;
      customLabels = catalog.customLabels ?? {};
      if (discovered.length > 0) effectiveDivisions = discovered;
      divisionLabels = catalog.labels ?? {};
      loadError = null;
      loaded = true;
      // 名册重载后让规模缓存失效：提示段的「a N-expert, M-division roster」现算一次即可跟上
      // 运行时增删（rosterScale 按目录永久缓存，不清就会滞后到下次重启，与本文件「绝不对模型
      // 说谎」的口径相悖）。只在真发生重载时删一次，不给每次渲染添 I/O。
      rosterScaleCache.delete(config.root);
      stamp = await fingerprint();      // 记录加载后的指纹
    } catch (error) {
      loadError = error instanceof Error ? error : new Error(String(error));
      loaded = false;
    }
  }

  async function ensureReady() {
    const now = await fingerprint();
    if (!loaded || now !== stamp) {
      if (loading === null) {
        loading = load().finally(() => {
          loading = null;
        });
      }
      await loading;
    }
    if (loadError !== null) throw loadError;
    await pruneStaleEnabled();
    await seedDefaultEnabled();
  }
  /**
   * 清掉设置里**名册已不存在**的 slug（C-6）。
   *
   * 为什么必须清：`enabled` 只是 slug 列表，专家被删（自建专家删除、名册升级）后旧 slug 会留下。
   * 后果不是"多一条无用配置"，而是 `list_t_experts` 的 `total` 取 `enabled.size`、与真正展示出来的
   * 条数**对不上**（用户看到「共 3 位」却只列出 2 位），而且没有任何地方会说明原因。
   *
   * 只在 settings 可用时清；清完写回并留一条 warn（用户的启用列表被改动过，应该看得见）。
   * 防误清靠「名册为空就不动」那条判断（见下），不靠"只清一次"。
   */
  async function pruneStaleEnabled() {
    if (settingsService === undefined) return;
    const known = new Set(entries.map((expert) => expert.slug));
    const list = [...enabledSet()];
    const stale = list.filter((slug) => !known.has(slug));
    if (stale.length === 0) return;
    // 名册为空说明这次 load 是残缺的（例如分区目录暂时读不到），此时**不要**清 ——
    // 否则一次临时故障会把用户全部启用项抹掉。
    if (known.size === 0) return;
    try {
      const next = list.filter((slug) => known.has(slug));
      await settingsService.mutate(SETTINGS_NAMESPACE, [{ op: "set", path: ["enabled"], value: next }], revision());
      ctx.logger?.warn?.(`[t-team] 已从启用列表移除 ${stale.length} 个名册里不存在的 slug：${stale.slice(0, 5).join(", ")}`
        + `${stale.length > 5 ? " …" : ""}（名册升级或自建专家删除后的收尾）`);
    } catch (error) {
      // 清不掉不影响可用性（那些 slug 本来也不会被展示），但不能因为并发冲突把加载搞挂。
      ctx.logger?.warn?.(`[t-team] 启用列表里的失效 slug 未能清理：${String(error)}`);
    }
  }
  /**
   * 把「默认启用」落到 enabled 名单上：**名册新增的专家补进去，用户自己的启停原样保留**。
   *
   * enabled 是白名单，缺省 [] 本意是"一个都没启用"，这让新装用户得逐个开关几百个专家。
   * 历史上这里只看"策略版本号有没有追上"，追上就再不管了 —— 于是 2026-09-29 导入 322 位
   * WorkBuddy 专家后，老用户（enabledSeedVersion 早就是 1）那 322 位永远进不了 @ 菜单：
   * 面板显示名册 645，@ 弹窗只有 323。那时只能把版本号 +1 逼所有人重新播种，代价是
   * **把用户手动停用过的专家也全部重新打开**。
   *
   * 现在改成按名册基线做增量：只有 `名册 - 上次见到的名册` 才补进 enabled，
   * 用户停用过的（已在基线里）不会被重新打开；名册没变化时什么都不写。
   */
  async function seedDefaultEnabled() {
    if (settingsService === undefined) return;
    const state = readPrefs();
    if (state === undefined) return;
    const roster = usable().map((expert) => expert.slug);
    // 名册残缺（例如分区目录暂时读不到）时绝不写：否则等于用一份空名单把用户的启用项抹掉。
    if (roster.length === 0) return;

    const current = state.enabled ?? [];
    const seen = state.enabledSeedRoster ?? [];
    // 首次运行（还没记过名册基线）拿现有 enabled 当基线：那时 enabled 里就是用户已经见过的全部，
    // 于是「从未播种」= 整份名册都算新增（全启用），「老用户升级」= 只有新导入的那批算新增。
    const baseline = new Set(seen.length > 0 ? seen : current);
    const added = roster.filter((slug) => !baseline.has(slug));
    const upToDate = (state.enabledSeedVersion ?? 0) >= ENABLED_SEED_VERSION;
    // 名册没变化且策略版本已追上 → 不写。用户自己的启停必须原样保留。
    if (upToDate && added.length === 0) return;

    const nextEnabled = [...new Set([...current, ...added])];
    try {
      await settingsService.mutate(SETTINGS_NAMESPACE, [
        { op: "set", path: ["enabled"], value: nextEnabled },
        // 老键一并置 true：保持它在语义上的"已播种"，也免得多版本并存时两边打架。
        { op: "set", path: ["enabledSeeded"], value: true },
        { op: "set", path: ["enabledSeedVersion"], value: ENABLED_SEED_VERSION },
        { op: "set", path: ["enabledSeedRoster"], value: roster },
      ], revision());
      ctx.logger?.info?.(`[t-team] 已启用 ${nextEnabled.length} 位专家（本次补入 ${added.length} 位，名册共 ${roster.length} 位）`);
    } catch (error) {
      // 写不进（并发 / 服务暂不可用）不致命：下次 ensureReady 还会再试。
      ctx.logger?.warn?.(`[t-team] 默认启用写入失败：${String(error)}`);
    }
  }
  /** 可召唤/可展示的专家（排除重名冲突项）。 */
  const usable = () => entries.filter((expert) => expert.conflict !== true);

  /**
   * 把一次召唤目标（中文名 / 英文名 / slug 都行）解析成**该语言下的显示名**。
   * 解析不到就原样返回：失败项也要让模型看清它请求的是谁。
   * @param query - 模型给的召唤目标。
   * @param current - 执行期语言。
   */
  function displayNameOf(query, current) {
    const text = String(query ?? "").trim();
    if (text === "") return "";
    try {
      return localized(resolveExpert(usable(), text, current), current).name;
    } catch {
      return text;
    }
  }

  // ---- 设置段修订号与写入 ----
  const revision = () => {
    // settings 是可选服务：缺它时给出同一个可读错误（error.settingsMissing），
    // 而不是 `Cannot read properties of undefined` 这种对用户毫无意义的 TypeError。
    const descriptor = settingsService?.describe?.().find((item) => item.ns === SETTINGS_NAMESPACE);
    if (descriptor === undefined) throw new Error(t(locale(), "error.settingsMissing"));
    return descriptor.revision;
  };

  /** 客户端面板用的名册快照。 */
  async function snapshot() {
    await ensureReady();
    // 走工具面的读路径在 settings 缺席时响亮失败（见 requireSettings 的说明）：
    // 返回一套 "全部未启用" 的空快照会让用户以为是名册空了，而不是宿主少挂了一个服务。
    requireSettings();
    const enabled = enabledSet();
    const roster = await rosterOnce();
    // 映射本身是同步的；只有**自建**专家需要读文件算内容指纹（await）。所以不要为了形式
    // 统一给所有专家都套 async —— 这里保留 Promise.all 是因为 custom 分支确实要 await。
    const experts = await Promise.all(usable().map(async (expert) => ({
      // 面板按 locale 取字段：name/description 为中文（缺译回退英文），nameEn/descriptionEn 恒为英文。
      slug: expert.slug,
      name: expert.nameZh ?? expert.name,
      nameEn: expert.nameEn,
      description: expert.descriptionZh ?? expert.description,
      descriptionEn: expert.descriptionEn,
      emoji: expert.emoji,
      division: expert.division,
      divisionZh: divisionOf(expert.division, divisionLabels).zh,
      divisionEn: divisionOf(expert.division, divisionLabels).en,
      conflict: expert.conflict === true,
      custom: expert.custom === true,
      // 自建专家的内容指纹：编辑/删除时回传，拦住并发覆盖（内置专家不读文件、恒为空）。
      hash: expert.custom === true ? await fileFingerprint(expert.personaPath) : "",
      // 云端附件状态：客户端据此给「附件未下载」的专家显示下载按钮。
      assets: await assetsOf(expert, roster),
    })));
    return {
      experts,
      enabled: [...enabled],
      revision: revision(),
      // 名册健康状态：面板可以据此提示「中文侧车没找到 / 有 N 个专家文件被跳过」，
      // 而不是让用户对着一个静默变全英文的名册猜。
      sidecar: {
        zhRoot: config.zhRoot,
        present: sidecarPresent,
        skippedFiles,
        unreadableDivisions,
      },
      // 自建专家固定落在这个分区；连同中文标签一起给面板，省得两端各写一份常量。
      customDivision: CUSTOM_DIVISION,
      customDivisionLabel: divisionOf(CUSTOM_DIVISION, divisionLabels).zh,
      // 全部分类（面板的「分类」下拉与管理页）：
      //   official=官方分类（只读镜像的一部分，名字跟随中文侧车）
      //   count=该分类下的专家总数，customCount=其中自建的
      // 自建专家可以归到官方分类名下 —— 分类是**归属**，文件始终写 customRoot，官方镜像不受影响。
      // 默认分类恒在（它就是新建专家的落点），其余官方在前、自建在后。
      categories: [...new Set([CUSTOM_DIVISION, ...rosterDivisions, ...customDivisions, ...Object.keys(customLabels)])]
        .filter((key) => key !== "")
        .map((key) => {
          const inCategory = entries.filter((expert) => expert.division === key);
          return {
            key,
            label: divisionOf(key, divisionLabels).zh,
            official: rosterDivisions.includes(key),
            count: inCategory.length,
            customCount: inCategory.filter((expert) => expert.custom === true).length,
          };
        })
        .sort((a, b) => Number(b.official) - Number(a.official) || a.label.localeCompare(b.label, "zh")),
    };
  }

  /** 云端分发清单：缓存 → 远端 → 包内，三级回退（见 fetch-assets.js 的远端清单段）。 */
  let rosterPromise;
  let rosterFetchedAt = 0;
  let rosterRefreshing = false;
  /** 缓存文件放数据目录（`~/.t-team/`），不进包、不进名册扫描。 */
  const rosterCachePath = () => join(dirname(config.root), "roster-cache.json");

  /**
   * 首次解析：缓存新鲜直接用 → 拉远端 → 回退缓存/包内。
   *
   * **每一条返回路径都经过 `mergeRosters`**：远端清单可能比包内旧（改了专家但没重传 roster），
   * 也可能缓存是上一版包内快照合并出来的 —— 只有并集才能保证「包内清单里声明过的附件」永远查得到。
   */
  async function resolveRoster() {
    const bundled = await loadRoster(join(HERE, "data", "roster.json"));
    const cached = await readCachedRoster(rosterCachePath());
    if (cached !== undefined && Date.now() - cached.fetchedAt < ROSTER_TTL_MS) {
      rosterFetchedAt = cached.fetchedAt;
      // 缓存再合一次包内：插件升级后包内新增的条目，不该因为「缓存还新鲜」而丢失。
      return mergeRosters(bundled, cached.roster);
    }
    const remote = await fetchRemoteRoster(bundled);
    if (remote !== undefined) {
      const merged = mergeRosters(bundled, remote);
      rosterFetchedAt = Date.now();
      await writeCachedRoster(rosterCachePath(), merged);
      return merged;
    }
    // 远端拉不到：这次也标记时间，TTL 内不再重复打远端；回退缓存（即使过期）→ 包内。
    rosterFetchedAt = Date.now();
    if (cached !== undefined) return mergeRosters(bundled, cached.roster);
    return bundled;
  }

  /** 后台刷新（TTL 过期后触发，不阻塞当前调用）：强制拉远端，拉到才替换。 */
  async function refreshRoster() {
    const bundled = await loadRoster(join(HERE, "data", "roster.json"));
    const remote = await fetchRemoteRoster(bundled);
    // 无论成败都标记时间：失败时若不动这个值，rosterOnce 会在「still 超 TTL 且 not refreshing」
    // 的条件下对每次召唤都再触发一次 8 秒超时的远端拉取（2026-09-29 逐行审查发现）。
    rosterFetchedAt = Date.now();
    if (remote === undefined) return undefined;
    const merged = mergeRosters(bundled, remote);
    await writeCachedRoster(rosterCachePath(), merged);
    return merged;
  }

  function rosterOnce() {
    if (rosterPromise === undefined) {
      rosterPromise = resolveRoster();
    } else if (Date.now() - rosterFetchedAt > ROSTER_TTL_MS && rosterRefreshing === false) {
      // 过期了：先用旧清单继续跑，后台拉新的，拉到就替换。
      rosterRefreshing = true;
      void refreshRoster()
        .then((fresh) => {
          if (fresh !== undefined) rosterPromise = Promise.resolve(fresh);
        })
        .finally(() => {
          rosterRefreshing = false;
        });
    }
    return rosterPromise;
  }

  /**
   * 客户端要的附件状态三态：`local`（附件随包发布，没有要下载的）/ `ready`（已下载并校验）/
   * `missing`（在云端、本地还没有 —— 面板与 `@` 弹窗据此显示「下载」按钮）。
   */
  async function assetsOf(expert, roster) {
    if (expert.packDir === undefined) return "local";
    const info = packInfoFor(roster, expert.division, expert.slug);
    if (info === undefined) return "local";
    // 头像自 2026-09-29 起随包发布（不再走云端）：roster 里那些「只装 avatars」的条目已无意义，
    // 一律视为本地 —— 否则面板会给它们挂一个点了也没必要的 ☁️。
    if ((info.dirs ?? []).filter((d) => d !== "avatars").length === 0) return "local";
    return (await assetsState(expert.packDir, info)) === ASSETS_READY ? "ready" : "missing";
  }

  /**
   * 取一位专家的 persona，并按需补两件事：
   *
   * 1. **路径改写**（目录形态专家）：正文里 `skills/xxx/SKILL.md` 这类相对路径的基准是
   *    「当前会话的工作目录」而不是专家包目录，模型照抄去 Read **必然落空** —— 所以改写成
   *    包内绝对路径，并在顶部补一段资源说明（细节见 fetch-assets.js 的 `annotatePersona`）。
   * 2. **后台预取**（`kickoff: true` 时）：该专家有云端附件就异步拉取，**不 await** ——
   *    人格在本地、立即可用，召唤不该被网络拖住。
   */
  async function preparePersona(expert, locale, { kickoff = false } = {}) {
    const raw = await readPersona(expert, locale);
    if (expert.packDir === undefined) return raw;   // 单文件形态：本来就没有附件
    const roster = await rosterOnce();
    const info = packInfoFor(roster, expert.division, expert.slug);
    if (kickoff && info !== undefined) {
      void kickoffAssets({
        packDir: expert.packDir,
        roster,
        info,
        onDone: (res) => ctx.logger?.info?.(`[t-team] ${expert.slug} 附件已就绪（${res.bytes ?? 0} 字节）`),
        onError: (res) => ctx.logger?.warn?.(`[t-team] ${expert.slug} 附件拉取失败：${res.reason ?? res.status}`),
      });
    }
    return annotatePersona({
      text: raw,
      packDir: expert.packDir,
      slug: expert.slug,
      remote: info !== undefined,
      // 有 bin/ 的专家，CLI 得用绝对路径调（DSH 不像 WorkBuddy 那样把包内 bin/ 挂进 PATH）：
      // 清单里登记了 bin 就写这段说明（附件还没下载时同样有用），目录已在本地也算数。
      hasBin: (info?.dirs ?? []).includes("bin") || existsSync(join(expert.packDir, "bin")),
    });
  }

  /** 按需读取一位专家的 persona 正文。 */
  async function prompt(slug, division) {
    await ensureReady();
    const expert = usable().find((item) => item.slug === slug && item.division === division);
    if (expert === undefined) throw new Error(`找不到专家：${slug}`);
    return { prompt: await preparePersona(expert) };
  }

  // ---- 自建专家（面板「新建 / 编辑 / 删除」）----
  // 写的是 customRoot（默认 ~/.t-team/custom），**不碰内置名册** —— 内置根是破坏性镜像，
  // 往里写自建专家会在下次同步时被当成"意外文件"删掉。
  /** 带业务码的错误：remote 的 businessError 会原样透传 code 给面板。 */
  function customError(codeKey, params = {}) {
    /** @type {Error & { code?: string }} */
    const error = new Error(t(locale(), codeKey, params));
    error.code = `tTeam/${codeKey.replace(/^error\./, "").replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)}`;
    return error;
  }

  /** 校验并归一化自建专家表单；重名会连累内置专家一起不可召唤，所以挡在写盘前。 */
  function normalizeCustomInput(input, editingSlug) {
    const name = String(input?.name ?? "").trim();
    if (name === "") throw customError("error.customNameEmpty");
    if (name.length > CUSTOM_LIMITS.name) {
      throw customError("error.customTextTooLong", { field: "名称", limit: CUSTOM_LIMITS.name });
    }
    const description = String(input?.description ?? "").trim();
    if (description === "") throw customError("error.customDescriptionEmpty");
    if (description.length > CUSTOM_LIMITS.description) {
      throw customError("error.customTextTooLong", { field: "简介", limit: CUSTOM_LIMITS.description });
    }
    const body = String(input?.body ?? "").trim();
    if (body === "") throw customError("error.customBodyEmpty");
    if (body.length > CUSTOM_LIMITS.body) {
      throw customError("error.customTextTooLong", { field: "人格正文", limit: CUSTOM_LIMITS.body });
    }
    const nameEn = String(input?.nameEn ?? "").trim();
    if (nameEn.length > CUSTOM_LIMITS.nameEn) {
      throw customError("error.customTextTooLong", { field: "英文名", limit: CUSTOM_LIMITS.nameEn });
    }
    const descriptionEn = String(input?.descriptionEn ?? "").trim();
    const emoji = String(input?.emoji ?? "").trim();

    // 重名（中文名或英文名撞车）：markConflicts 会把两位都标成冲突、双双不可召唤，
    // 所以这里直接拒绝，并告诉用户撞上了谁。
    for (const candidate of [name, nameEn]) {
      if (candidate === "") continue;
      const key = normalizedKey(candidate);
      const clash = entries.find((expert) => expert.slug !== editingSlug
        && (normalizedKey(expert.nameZh ?? expert.name) === key || normalizedKey(expert.nameEn) === key));
      if (clash !== undefined) {
        throw customError("error.customNameTaken", { name: candidate, other: clash.nameZh ?? clash.name });
      }
    }
    return { name, nameEn, description, descriptionEn, emoji, body };
  }

  /** 写完立刻重载（不靠 mtime 分辨率：同一毫秒内的连续写也要看到最新结果）。 */
  async function refreshCatalog() {
    await load();
    if (loadError !== null) throw loadError;
  }

  function requireCustomRoot() {
    if (typeof config.customRoot !== "string" || config.customRoot.trim() === "") {
      throw customError("error.customRootMissing");
    }
    return config.customRoot;
  }

  /**
   * 定下这位自建专家该归到哪个分类（分类 = 面板里的归属，不决定文件写在哪）。
   *
   * 规则（服务端说了算，不信任面板传什么）：
   *   - 空 → 默认分类 `custom`；
   *   - 必须过 `isValidDivision`（与扫描口径同一个判断，避免写出「列表里有、扫不到」的目录）；
   *   - **可以**用官方分类名（学术/金融/游戏…）：分类是归属，文件始终写 customRoot，
   *     官方镜像目录一个字节都不动，所以不会被同步删掉（2026-09-12 用户选定）。
   *
   * @param keep - 当前所在分类：编辑时保留原值可以跳过校验（历史遗留的非 ASCII 目录名仍能就地保存）。
   */
  async function resolveDivision(raw, customRoot, keep) {
    const requested = String(raw ?? "").trim();
    const key = requested === "" ? (typeof keep === "string" && keep !== "" ? keep : CUSTOM_DIVISION) : requested;
    if (typeof keep === "string" && key === keep) return key;
    if (!isValidDivision(key)) throw customError("error.customDivisionInvalid", { division: key });
    return key;
  }

  /** 分类管理只允许动自建分类：官方分类随包发布（名字与存亡都跟包内名册走，本机改不了）。 */
  function requireCustomCategory(key) {
    const name = String(key ?? "").trim();
    if (!isValidDivision(name)) throw customError("error.customDivisionInvalid", { division: name });
    if (rosterDivisions.includes(name)) throw customError("error.categoryOfficial", { division: name });
    return name;
  }

  /** 该分类下已有的自建专家（删除分类前的安全检查）。 */
  function customExpertsIn(division) {
    return entries.filter((expert) => expert.division === division && expert.custom === true);
  }

  /** 分类是否已存在（官方名、已声明、或目录里已有专家都算）。 */
  function categoryExists(key) {
    return rosterDivisions.includes(key) || customDivisions.includes(key) || Object.hasOwn(customLabels, key);
  }

  /** 新建自建分类（可以暂时是空分类：目录等第一位专家落进来时才创建）。 */
  async function createCategory(key, label) {
    await ensureReady();
    const customRoot = requireCustomRoot();
    const name = String(key ?? "").trim();
    if (!isValidDivision(name)) throw customError("error.customDivisionInvalid", { division: name });
    if (categoryExists(name)) throw customError("error.categoryExists", { division: name });
    const text = String(label ?? "").trim();
    if (text.length > CUSTOM_LIMITS.divisionLabel) {
      throw customError("error.customTextTooLong", { field: "分类显示名", limit: CUSTOM_LIMITS.divisionLabel });
    }
    await saveCustomLabel(customRoot, name, text);
    await refreshCatalog();
    return await snapshot();
  }

  /** 改自建分类的显示名（清空＝回退到目录名本身）。 */
  async function updateCategory(key, label) {
    await ensureReady();
    const customRoot = requireCustomRoot();
    const name = requireCustomCategory(key);
    if (!categoryExists(name)) throw customError("error.categoryMissing", { division: name });
    const text = String(label ?? "").trim();
    if (text.length > CUSTOM_LIMITS.divisionLabel) {
      throw customError("error.customTextTooLong", { field: "分类显示名", limit: CUSTOM_LIMITS.divisionLabel });
    }
    await saveCustomLabel(customRoot, name, text);
    await refreshCatalog();
    return await snapshot();
  }

  /** 删除自建分类：里面还有自建专家就拒绝（不静默连删），删完顺手收掉空目录。 */
  async function deleteCategory(key) {
    await ensureReady();
    const customRoot = requireCustomRoot();
    const name = requireCustomCategory(key);
    if (!categoryExists(name)) throw customError("error.categoryMissing", { division: name });
    const owned = customExpertsIn(name);
    if (owned.length > 0) {
      throw customError("error.categoryNotEmpty", { division: name, count: owned.length });
    }
    await saveCustomLabel(customRoot, name, "");
    // 只收空目录：目录里若还有别的文件（用户自己放的），rmdir 会失败，忽略即可。
    await rmdirIfEmpty(join(customRoot, name));
    await refreshCatalog();
    return await snapshot();
  }

  /** 记下自建分区的中文显示名（没传就什么都不做，不动已有标签）。 */
  async function rememberDivisionLabel(customRoot, division, label) {
    const text = String(label ?? "").trim();
    if (text === "" || text.length > CUSTOM_LIMITS.divisionLabel) return;
    await saveCustomLabel(customRoot, division, text);
  }

  /** 新建自建专家 → 返回刷新后的整份快照。 */
  async function createExpert(input) {
    await ensureReady();
    const customRoot = requireCustomRoot();
    const slug = String(input?.slug ?? "").trim().toLowerCase();
    if (!isValidSlug(slug)) throw customError("error.customSlugInvalid", { slug });
    if (entries.some((expert) => expert.slug === slug)) {
      throw customError("error.customSlugTaken", { slug });
    }
    const fields = normalizeCustomInput(input);
    const division = await resolveDivision(input?.division, customRoot);
    await writeFileAtomic(customExpertPath(customRoot, slug, division), serializeCustomExpert(fields));
    await rememberDivisionLabel(customRoot, division, input?.divisionLabel);
    await refreshCatalog();
    return await snapshot();
  }

  /** 编辑自建专家（不改 slug；改分区＝移动文件）→ 返回刷新后的快照。 */
  async function updateExpert(slug, input, expectedHash) {
    await ensureReady();
    const customRoot = requireCustomRoot();
    const expert = entries.find((item) => item.slug === slug);
    if (expert === undefined) throw customError("error.customMissing", { slug });
    if (expert.custom !== true) throw customError("error.customNotCustom", { slug });
    const path = expert.customPath ?? customExpertPath(customRoot, slug, expert.division);
    const actual = await fileFingerprint(path);
    if (typeof expectedHash === "string" && expectedHash !== "" && actual !== expectedHash) {
      throw customError("error.customConflict");
    }
    const fields = normalizeCustomInput(input, slug);
    const division = await resolveDivision(input?.division, customRoot, expert.division);
    const target = customExpertPath(customRoot, slug, division);
    await writeFileAtomic(target, serializeCustomExpert(fields));
    // 换分区＝移动：老文件必须删掉，否则同一个 slug 会以两份文件出现在两个分区里
    // （扫描按 slug 去重，面板上表现为"改完分区又弹回原处"）。
    if (target !== path) await removeCustomExpert(customRoot, slug, expert.division);
    await rememberDivisionLabel(customRoot, division, input?.divisionLabel);
    await refreshCatalog();
    return await snapshot();
  }

  /** 删除自建专家 → 返回刷新后的快照。 */
  async function deleteExpert(slug, expectedHash) {
    await ensureReady();
    const customRoot = requireCustomRoot();
    const expert = entries.find((item) => item.slug === slug);
    if (expert === undefined) throw customError("error.customMissing", { slug });
    if (expert.custom !== true) throw customError("error.customNotCustom", { slug });
    const path = expert.customPath ?? customExpertPath(customRoot, slug, expert.division);
    const actual = await fileFingerprint(path);
    if (typeof expectedHash === "string" && expectedHash !== "" && actual !== expectedHash) {
      throw customError("error.customConflict");
    }
    await removeCustomExpert(customRoot, slug, expert.division);
    // 删除后把该专家从启用列表里摘掉，否则设置段会留下一个指向空气的 slug
    const enabled = [...enabledSet()].filter((item) => item !== slug);
    // settings 未就绪时跳过写入：文件已删、enabled 里残留一个 ghost slug 不致命（pruneStaleEnabled 下次清），
    // 但硬调 settingsService.mutate 会抛错把整个删除流程打断（与 pruneStaleEnabled / seedDefaultEnabled 对齐）。
    if (enabled.length !== enabledSet().size && settingsService !== undefined) {
      await settingsService.mutate(SETTINGS_NAMESPACE, [{ op: "set", path: ["enabled"], value: enabled }], revision());
    }
    await refreshCatalog();
    return await snapshot();
  }

  /** 整体替换启用列表（远程服务用）。 */
  async function setEnabled(next, expectedRevision) {
    const list = (Array.isArray(next) ? next : []).filter((item) => typeof item === "string");
    const known = new Set(usable().map((expert) => expert.slug));
    const unknown = list.filter((slug) => !known.has(slug));
    if (unknown.length > 0) {
      // 稳定 code（不是显示文案）：remote 侧按它分类成 tTeam/unknown-expert，与 locale 无关（D-3）。
      // 文案走正确的 t() 通道（过去这里也是硬编码中文，非中文 locale 下会中英混排）。
      const slugs = unknown.slice(0, 5);
      /** @type {Error & { code?: string, details?: { slugs: string[] } }} */
      const error = new Error(t(locale(), "error.customUnknownSlug", { slugs: slugs.join(", ") }));
      error.code = UNKNOWN_SLUG_ERROR_CODE;
      error.details = { slugs };
      throw error;
    }
    await settingsService.mutate(SETTINGS_NAMESPACE, [{ op: "set", path: ["enabled"], value: list }], expectedRevision);
    return { enabled: [...enabledSet()], revision: revision() };
  }

  /** 删掉一个空目录；非空或不存在都当没事（只用于分类删除后的收尾）。 */
  async function rmdirIfEmpty(path) {
    try {
      await rmdir(path);
    } catch {
      // ENOTEMPTY / ENOENT 都无所谓：里面还有别的东西就不动它。
    }
  }

  /**
   * 拉取某位专家的云端附件（面板与 `@` 弹窗的「下载」按钮）。幂等：已就绪时不发网络请求。
   * 返回 `{ status, bytes, reason }` —— `local` 表示这位专家本来就没有云端附件。
   */
  /**
   * 本地已有的专家头像（`avatars/avatar.webp`，128px WEBP、约 3.4 KB）。
   *
   * 头像随资源包按需下发：**没下载过某位专家的资源，它的头像就不在本机**，这里也就不返回它 ——
   * 面板据此回退到 emoji（这正是用户要的「没下载过显示默认头像、下载过显示真头像」）。
   * 返回 data URL 而不是路径，是因为客户端跑在浏览器里、读不到本地文件。
   */
  // 头像随包发布、结果进程内缓存；fetchAssets / fetch_expert_assets 拉来新头像才失效。
  let avatarsCache;
  async function avatars() {
    await ensureReady();
    if (avatarsCache !== undefined) return avatarsCache;
    const out = {};
    await Promise.all(usable().map(async (expert) => {
      // 两种形态，头像位置不同：
      // ① 目录形态专家包（有 packDir）→ 包内 `avatars/avatar.webp`；
      // ② 单文件专家（`<分区>/<slug>.md`，没有包目录）→ 分区级 `avatars/<slug>.webp`。
      //    2026-09-29 加：否则给单文件专家生成的头像面板永远读不到。
      const candidates = expert.packDir !== undefined
        ? [join(expert.packDir, "avatars", "avatar.webp")]
        : [join(config.root, expert.division, "avatars", `${expert.slug}.webp`)];
      for (const candidate of candidates) {
        const buffer = await readFile(candidate).catch(() => undefined);
        if (buffer !== undefined) {
          out[expert.slug] = `data:image/webp;base64,${buffer.toString("base64")}`;
          return;
        }
      }
    }));
    avatarsCache = out;
    return out;
  }

  async function fetchAssets(slug) {
    await ensureReady();
    const expert = usable().find((item) => item.slug === slug);
    if (expert === undefined) throw new Error(`找不到专家：${slug}`);
    if (expert.packDir === undefined) return { status: "local", bytes: 0, reason: "" };
    const roster = await rosterOnce();
    const info = packInfoFor(roster, expert.division, expert.slug);
    if (info === undefined) return { status: "local", bytes: 0, reason: "" };
    const res = await ensureAssets({ packDir: expert.packDir, roster, info });
    avatarsCache = undefined;   // 头像可能刚下到本地，清缓存让下次重读
    return {
      status: res.status,
      bytes: res.bytes ?? info.bytes ?? 0,
      reason: res.reason ?? "",
    };
  }

  const catalogService = {
    snapshot, prompt, setEnabled, root: config.root,
    fetchAssets,
    avatars,
    createExpert, updateExpert, deleteExpert,
    createCategory, updateCategory, deleteCategory,
  };
  ctx.reflect.provide(CATALOG_SERVICE, catalogService);

  // ---- 召唤 ----
  /**
   * 召唤一位专家：**启动即返回，不等结果**。
   *
   * 为什么是异步的：宿主从 0.2.x 起把 subagents 服务改成了纯异步模型——
   * `startActivation` 只负责启动，子代理的产出通过**完成通知**回到父会话；
   * 该服务上没有任何等待结果的入口（方法全集只有 getProvider / registerProvider /
   * resolveMaxDepth / startActivation，事件里也没有「子代理完成」）。
   * 这与宿主内置的 subagent 工具是同一套语义，所以这里与之保持一致。
   *
   * 启动期的错误（专家不存在、provider 能力不满足等）仍然同步抛出，
   * 这样调用方拿到的失败一定是「没启动成功」，而不是「启动了但结果丢了」。
   */
  async function startExpert(query, task, exec) {
    const current = locale();
    requireSettings();
    const taskText = String(task ?? "").trim();
    if (taskText === "") throw new Error(t(current, "error.taskEmpty"));
    if ([...taskText].length > config.summonTaskMaxChars) {
      throw new Error(t(current, "error.taskTooLong", { limit: config.summonTaskMaxChars }));
    }
    if (exec.agent === undefined) throw new Error(t(current, "error.summonRequiresAgent"));

    const provider = ctx.subagents.getProvider(config.provider);
    if (provider === undefined) {
      throw new Error(t(current, "error.providerMissing", { provider: config.provider }));
    }
    if (provider.capabilities.persona !== true) {
      throw new Error(t(current, "error.providerNoPersona", { provider: config.provider }));
    }
    if (provider.capabilities.toolFilter !== true) {
      throw new Error(t(current, "error.providerNoToolFilter", { provider: config.provider }));
    }
    if (maxDepth !== undefined && provider.capabilities.depthLimit !== true) {
      throw new Error(t(current, "error.providerNoMaxDepth", { provider: config.provider }));
    }

    await ensureReady();
    const expert = resolveExpert(usable(), query, current);
    if (!enabledSet().has(expert.slug)) {
      throw new Error(t(current, "error.expertDisabled", { name: localized(expert, current).name }));
    }
    // 路径改写 + 后台预取附件（方案 A）：人格本地立即可用，技能/数据文件异步到位。
    const persona = await preparePersona(expert, current, { kickoff: true });

    // 静态 inject 只保证服务存在，不保证方法签名对得上（宿主重构过这里）。
    // 显式探测一次，报出「缺什么 + 实际有什么」，而不是抛一个裸的 TypeError。
    if (typeof ctx.subagents.startActivation !== "function") {
      const keys = Object.keys(ctx.subagents)
        .filter((key) => typeof ctx.subagents[key] === "function")
        .join(", ");
      throw new Error(t(current, "error.subagentsApiMismatch", { keys: keys === "" ? "（无）" : keys }));
    }

    const activation = await ctx.subagents.startActivation({
      provider: config.provider,
      label: `t-team:${expert.slug}`,
      request: {
        prompt: [{ type: "text", text: taskText }],
        parent: exec.agent,
        persona: sanitize(persona),
        toolFilter: { deny: ["summon_t_expert", "summon_t_experts", "list_t_experts"] },
        ...(maxDepth === undefined ? {} : { maxDepth }),
      },
      signal: exec.signal,
      // 结果投递给父会话 —— 与宿主内置 subagent 工具同一模式。
      delivery: "parent",
    });

    // 宿主返回 { childId }；对别的键名留一手，免得下次改字段名就直接丢掉 id。
    const subagentId = activation?.childId ?? activation?.subagentId ?? "";
    return {
      expert: localized(expert, current).name,
      slug: expert.slug,
      subagentId: String(subagentId),
    };
  }

  // ---- 工具 ----
  ctx.tools.register(defineTool({
    name: "fetch_expert_assets",
    description: "Download a T专家 expert's companion assets (its skills, references and data files) from the cloud and unpack them locally, returning the resource root path. The expert's **persona is always available locally** — only large attachments are fetched on demand, and summoning an expert already kicks off that download in the background. Call this when you need an expert's skill or reference files and reading them from disk fails (file not found). Experts whose attachments are small ship entirely inside the package, and for those this returns immediately with status \"local\" — nothing to download.",
    parameters: {
      expert: {
        type: "string",
        required: true,
        description: "Expert name — the Chinese display name, the English name, or its slug.",
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          expert: { type: "string", required: true },
          slug: { type: "string", required: true },
          status: { type: "string", required: true },
          root: { type: "string", required: true },
          dirs: { type: "array", required: true, items: { type: "string" } },
          bytes: { type: "number", required: true },
          reason: { type: "string", required: true },
        },
      },
      render: (args, value) => {
        if (value.status === "ready") {
          return [{ type: "text", text: `专家「${value.expert}」的配套资源已就绪（${value.bytes} 字节）。\n资源目录：${value.root}\n可用目录：${value.dirs.join("、") || "（无）"}\n现在可以按 persona 里给出的绝对路径读取其中的文件了。` }];
        }
        if (value.status === "local") {
          return [{ type: "text", text: `专家「${value.expert}」没有云端附件 —— 它的全部内容（含技能与参考资料）本来就在本地。\n资源目录：${value.root}` }];
        }
        return [{ type: "text", text: `专家「${value.expert}」的配套资源拉取失败：${value.reason === "" ? "未知原因" : value.reason}\n人格不受影响、仍然可用；但依赖该专家技能或数据文件的步骤此刻做不了 —— 请如实告诉用户，不要假装读过那些文件。` }];
      },
    },
    async execute(args) {
      const current = locale();
      await ensureReady();
      const expert = resolveExpert(usable(), args.expert, current);
      const name = localized(expert, current).name;
      const base = { expert: name, slug: expert.slug, root: expert.packDir ?? config.root, dirs: [], bytes: 0, reason: "" };
      if (expert.packDir === undefined) return { ...base, status: "local" };
      const roster = await rosterOnce();
      const info = packInfoFor(roster, expert.division, expert.slug);
      if (info === undefined) return { ...base, status: "local" };
      const res = await ensureAssets({ packDir: expert.packDir, roster, info });
    avatarsCache = undefined;   // 头像可能刚下到本地，清缓存让下次重读
      if (res.status === ASSETS_READY) {
        return { ...base, status: "ready", dirs: [...(info.dirs ?? [])], bytes: res.bytes ?? info.bytes ?? 0 };
      }
      return { ...base, status: "failed", reason: res.reason ?? res.status };
    },
  }));

  ctx.tools.register(defineTool({
    name: "list_t_experts",
    description: "List the enabled T专家 domain experts grouped by division. Without a division filter it returns division names and counts; pass a division to expand it with expert names, slugs and descriptions. Use this only to DISCOVER an expert when the user named none; if the user already named one (a leading `@专家名` chip, or an explicit name/slug), skip this and call summon_t_expert directly.",
    parameters: {
      division: {
        type: "string",
        description: "Optional division key to filter (e.g. engineering, marketing, security, design).",
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          divisions: { type: "array", required: true, items: { type: "json" } },
          total: { type: "number", required: true },
          // 渲染期事实：语言与过滤词进 canonical value，render 才能是纯函数（D-11）。
          locale: { type: "string", required: true },
          query: { type: "string", required: true },
          allDivisions: { type: "array", required: true, items: { type: "string" } },
        },
      },
      // render 只读 (args, value)：同一个 value 在日志里回放时渲染出同一段文本。
      render: (args, value) => [{ type: "text", text: renderList(args, value) }],
    },
    async execute(args) {
      await ensureReady();
      const current = locale();
      requireSettings();
      const query = args.division === undefined ? "" : String(args.division).trim();
      const enabled = enabledSet();
      const groups = groupByDivision(usable(), enabled);
      // 简介截断是**执行期**的可配项（Config.descriptionLimit），所以在投影时一次做完，
      // render 拿到的就是最终文本（纯函数，不再读 config）。
      const projection = (list) => toRenderableGroups(list, current).map((group) => ({
        ...group,
        experts: group.experts.map((expert) => ({
          ...expert,
          description: truncate(expert.description, config.descriptionLimit),
        })),
      }));
      if (query === "") {
        return {
          divisions: projection(groups),
          total: enabled.size,
          locale: current,
          query,
          allDivisions: effectiveDivisions.slice(),
        };
      }
      const needle = query.toLowerCase();
      const matched = groups
        .filter((group) => group.division.toLowerCase() === needle
          || group.label.toLowerCase() === needle
          || group.labelEn.toLowerCase() === needle);
      return {
        divisions: projection(matched),
        total: matched.reduce((sum, group) => sum + group.count, 0),
        locale: current,
        query,
        allDivisions: effectiveDivisions.slice(),
      };
    },
  }));

  ctx.tools.register(defineTool({
    name: "summon_t_expert",
    description: "Summon one T专家 domain expert to work on a task. A specialist subagent starts with that expert's full persona and works in its own context. **This call returns as soon as the expert has started — it does NOT wait for the answer.** The expert's result arrives later as a completion notice, so do not call this and then sit idle waiting for it in the same turn; report that the expert is working and continue with other work. If the user already named the expert (a leading `@专家名` chip, or an explicit name/slug), summon it right away — no list_t_experts lookup is needed. Call list_t_experts only when no expert is named.",
    // 启动是立刻返回的，所以只要一个很短的预算就够：这里留 60 秒覆盖
    // 「名册解析 + persona 组装 + 附件 kickoff」这几步，而不是覆盖专家跑完的时间。
    timeoutMs: 60_000,
    parameters: {
      expert: { type: "string", required: true, description: "Expert name to summon — the Chinese display name (e.g. \"前端开发者\"), the English name (e.g. \"Frontend Developer\"), or its slug (e.g. engineering-frontend-developer). A name copied from a composer `@` chip works as-is; variants and an emoji prefix (e.g. \"🧠 心理学家\") resolve to the same expert, so no exact-spelling lookup is required." },
      task: { type: "string", required: true, description: "The complete, self-contained task to give the expert. Include all necessary context." },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          expert: { type: "string", required: true },
          slug: { type: "string", required: true },
          subagentId: { type: "string", required: true },
        },
      },
      // 渲染的是「已启动」，不是专家答案——答案由宿主的完成通知送达。
      render: (_args, value) => [{
        type: "text",
        text: t(locale(), "summon.started", { expert: value.expert, id: value.subagentId }),
      }],
    },
    async execute(args, exec) {
      await ensureReady();
      return startExpert(args.expert, args.task, exec);
    },
  }));

  ctx.tools.register(defineTool({
    name: "summon_t_experts",
    description: `Summon multiple T专家 experts in parallel for one mission. At most ${config.maxSummonBatch} experts start with concurrency ${config.summonConcurrency}; experts that fail to start are reported individually while the rest keep running. **This call returns as soon as the experts have started — it does NOT wait for their answers.** Results arrive later as completion notices, so do not call this and then idle waiting in the same turn. Each expert is usually pre-named by the caller (a composer @ chip, or an explicit @专家名 anywhere in the text — including a stored prompt from elsewhere) — when so, summon directly without list_t_experts; only call list_t_experts when no expert is named.`,
    // 启动是立刻返回的；20 秒覆盖批量「名册解析 + persona 组装 + kickoff」即可。
    timeoutMs: 20_000,
    parameters: {
      experts: {
        type: "array",
        required: true,
        description: "The experts to summon, each with its own name and task.",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            expert: { type: "string", required: true, description: "Expert name — Chinese display name, English name, or slug." },
            task: { type: "string", required: true, description: "That expert's complete task." },
          },
        },
      },
    },
    output: {
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          results: { type: "array", required: true, items: { type: "json" } },
          // 渲染期事实（D-11）：语言进 canonical value，render 才不需要读宿主。
          locale: { type: "string", required: true },
        },
      },
      render: (args, value) => [{ type: "text", text: renderSummonResults(args, value) }],
    },
    async execute(args, exec) {
      await ensureReady();
      const current = locale();
      const specs = Array.isArray(args.experts) ? args.experts : [];
      if (specs.length === 0) throw new Error(t(current, "error.specsEmpty"));
      if (specs.length > config.maxSummonBatch) {
        throw new Error(t(current, "error.specsTooMany", { limit: config.maxSummonBatch }));
      }
      specs.forEach((spec, index) => {
        if (spec === null || typeof spec !== "object" || typeof spec.expert !== "string" || typeof spec.task !== "string") {
          throw new Error(t(current, "error.specInvalid", { index }));
        }
      });
      const results = await mapPool(specs, config.summonConcurrency, async (spec) => {
        try {
          const result = await startExpert(spec.expert, spec.task, exec);
          return { expert: result.expert, ok: true, subagentId: result.subagentId };
        } catch (error) {
          return {
            // 失败项也要在**执行期**定好显示名：否则 render 得自己去解析名册才说得清是谁失败了
            // （D-11：render 必须是 (args,value) 的纯函数，不能读名册/宿主 locale）。
            expert: displayNameOf(spec.expert, current),
            ok: false,
            subagentId: "",
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });
      return {
        results: toRenderableSummonResults(results, current),
        locale: current,
      };
    },
  }));



  ctx.systemPrompt.section({
    name: "t-team:experts",
    order: 118,
    text: (context) => {
      if (context.agent?.session?.header?.parentSession !== undefined) return "";
      // 名册规模与批量上限都**现算**：写死会在名册变更 / 用户改 Config 之后对模型说谎。
      const scale = rosterScale(config.root);
      const scope = scale.experts > 0
        ? `The parent session has T专家 — a ${scale.experts}-expert, ${scale.divisions}-division roster with full Chinese translations, exposed as summonable domain experts.`
        : "The parent session has T专家 — a curated roster of domain experts with full Chinese translations, exposed as summonable domain experts.";
      return [
        "## T专家 (T Expert) expert mode",
        scope,
        "Experts are individually enabled/disabled in the T专家 settings tab; all experts are enabled by default and a disabled expert cannot be summoned.",
        "A composer selection inserts one enabled expert as a native reference chip; the remaining draft text is that expert's task. The chip reaches you as plain text `@专家名` at the head of the user's message — that IS the user's selection, and the name as written is enough (the resolver accepts the Chinese display name, the English name or the slug, and tolerates an emoji prefix).",
        "Summoning is ASYNCHRONOUS on this host: `summon_t_expert` / `summon_t_experts` start the expert and return immediately with its subagentId — they do NOT return the expert's answer. The result arrives later as a completion notice in this conversation. So after summoning, tell the user the expert is working and continue with anything that does not depend on it; never call a summon and then idle waiting for it in the same turn.",
        "When the user's message already names the expert — a leading `@专家名` chip, or an explicit name/slug in the text — call `summon_t_expert` FIRST with that name. Do NOT call `list_t_experts` to confirm or spell the name: the lookup costs two extra round trips and does not change which expert runs.",
        `Only when the user named no expert, discover one first: call \`list_t_experts()\` for enabled division names and counts, then \`list_t_experts(division)\` to expand the relevant division, then \`summon_t_expert(expert, task)\` — or \`summon_t_experts\` for a parallel group (at most ${config.maxSummonBatch} at a time; experts that fail to start are reported individually while the rest keep running).`,
      ].join("\n");
    },
  });

  // ---- 随包 skill（运维入口）----
  // 它只对特定任务有用，所以不占常驻提示段，改成按需加载的 skill：
  //   · t-expert-manager      维护这个插件的人：名册 / 装机 / 发布
  // 可选依赖：宿主没有 skill 注册表时静默跳过，不影响上面任何功能。
  installBundledSkills(ctx, config);
}
