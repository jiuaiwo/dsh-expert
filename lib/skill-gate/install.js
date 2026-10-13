// @ts-check
/**
 * 技能开关的**宿主装配**（2026-09-28 从 dsh-plugin-skill-gate 整体搬进 T专家）。
 *
 * 逻辑一行没改，只换了落点与签名 —— 名单文件路径仍是 `~/.dsh/skill-gate.json`，
 * 所以你原有的开关名单直接沿用，不需要迁移。
 *
 * ⚠️ 合并时唯一实质性的改动在**调用方**（lib/index.js）：原插件用静态
 * `inject = ["skills"]`（强依赖），那样一旦宿主没有 skills 服务，T专家 会**整个不激活**
 * —— 连专家名册一起没。现在改成 `ctx.inject(["skills"], …)` 动态等待，拿不到就只少了
 * 技能开关这一块，名册与召唤照常。
 *
 * 原理（照搬原 README）：包装 `ctx.skills.snapshot / list / get`，把名单里技能的
 * `modelInvocable` 置 false；`dsh-tool-skill` 生成目录时本来就会 filter(isModelInvocable)，
 * 清单自然变短。`list()` 内部走 `this.snapshot()`，自有属性会遮蔽原型方法，self-call 同样命中。
 */
import { basename } from "node:path";
import { overlaySkill, projectCatalog, sanitizeDisabled } from "./overlay.js";
import { defaultSkillRoots, mergeSkillLists, scanSkillRoots } from "./discover.js";
import { defaultStorePath, readStore, writeStore } from "./store.js";
import { GATE_SERVICE } from "./constants.js";

export function installSkillGate(ctx, config = {}) {
  const storePath = defaultStorePath(config.storePath);
  /** @type {Set<string>} */
  let disabled = new Set();
  let revision = 0;
  /** @type {Promise<void>} */
  let writeChain = Promise.resolve();

  const skills = ctx.skills;
  const hadOwnSnapshot = Object.prototype.hasOwnProperty.call(skills, "snapshot");
  const hadOwnList = Object.prototype.hasOwnProperty.call(skills, "list");
  const hadOwnGet = Object.prototype.hasOwnProperty.call(skills, "get");
  const previousSnapshot = skills.snapshot;
  const previousList = skills.list;
  const previousGet = skills.get;

  async function load() {
    const stored = await readStore(storePath);
    disabled = new Set(stored.disabled);
    revision += 1;
  }

  /**
   * @param {string[]} names
   */
  async function persist(names) {
    const next = sanitizeDisabled(names);
    writeChain = writeChain.catch(() => {}).then(async () => {
      await writeStore(storePath, next);
    });
    await writeChain;
    disabled = new Set(next);
    revision += 1;
    try {
      ctx.emit("skills/change");
    } catch (error) {
      ctx.logger?.warn?.("[skill-gate] 无法广播 skills/change：", error);
    }
    return snapshotState();
  }

  async function snapshotState() {
    const views = await collectViews();
    const merged = mergeSkillLists(views.map((view) => view.skills));
    const projected = projectCatalog(merged, disabled, views);
    return {
      revision,
      storePath,
      skills: projected.skills,
      counts: projected.counts,
      views: projected.views,
    };
  }

  /**
   * 设置页要看到模型实际能看到的那份目录。
   * 空 options 只读宿主全局层（web 上往往只剩 T专家 注册的 2 条随包 skill）；
   * 用户目录里那 300+ 条挂在 preset 的 skill-filesystem 上，必须带 scope。
   * 每个来源记成一个视角，面板才能按「某个会话 / 默认 preset」回看，而不是只看并集。
   */
  async function collectViews() {
    /** @type {{ key: string, kind: string, name?: string, skills: object[] }[]} */
    const views = [];
    await pushView(views, { key: "host", kind: "host" }, {});

    const agents = ctx.get("agents");
    if (agents !== undefined && typeof agents.list === "function") {
      for (const agent of agents.list()) {
        await pushView(views, { key: `agent:${agent.id}`, kind: "agent", name: agentLabel(agent) }, {
          scope: agent,
          cwd: agent.session?.header?.cwd,
        });
      }
    }

    const presets = ctx.get("agentPresets");
    if (presets !== undefined && typeof presets.standingKeyFor === "function") {
      const id = typeof presets.defaultId === "string" && presets.defaultId !== "" ? presets.defaultId : "default";
      try {
        const scope = await presets.standingKeyFor();
        await pushView(views, { key: `preset:${id}`, kind: "preset", name: id }, { scope });
      } catch (error) {
        ctx.logger?.warn?.("[skill-gate] 读取默认 preset 技能失败：", error);
      }
    }

    await pushView(views, { key: "disk", kind: "disk" }, null, () => scanSkillRoots(defaultSkillRoots(undefined)));

    return views;
  }

  /**
   * @param {{ key: string, kind: string, name?: string, skills: object[] }[]} views
   * @param {{ key: string, kind: string, name?: string }} meta
   * @param {object | null} options
   * @param {() => Promise<object[]>} [loader]
   */
  async function pushView(views, meta, options, loader) {
    try {
      /** 局部名不能叫 skills：外层 `skills` 是服务实例，遮蔽后会撞 TDZ。 */
      const found = loader !== undefined
        ? await loader()
        : (await previousSnapshot.call(skills, options))?.skills ?? [];
      views.push({ ...meta, skills: found });
    } catch (error) {
      ctx.logger?.warn?.(`[skill-gate] 读取视角「${meta.key}」失败：`, error);
    }
  }

  /** @param {{ id?: unknown, session?: { header?: { cwd?: unknown } } }} agent */
  function agentLabel(agent) {
    const cwd = agent?.session?.header?.cwd;
    if (typeof cwd === "string" && cwd !== "") {
      const name = basename(cwd);
      if (name !== "" && name !== "/") return name;
    }
    const id = agent?.id;
    return typeof id === "string" && id !== "" ? id.slice(0, 8) : "agent";
  }

  async function wrappedSnapshot(options) {
    const snap = await previousSnapshot.call(skills, options);
    return {
      ...snap,
      skills: (snap?.skills ?? []).map((skill) => overlaySkill(skill, disabled)),
    };
  }

  async function wrappedList(options) {
    return (await wrappedSnapshot(options)).skills;
  }

  async function wrappedGet(skillName, options) {
    const definition = await previousGet.call(skills, skillName, options);
    if (definition === undefined || definition === null) return definition;
    return overlaySkill(definition, disabled);
  }

  skills.snapshot = wrappedSnapshot;
  skills.list = wrappedList;
  skills.get = wrappedGet;

  ctx.effect(() => () => {
    if (skills.snapshot === wrappedSnapshot) {
      if (hadOwnSnapshot) skills.snapshot = previousSnapshot;
      else delete skills.snapshot;
    }
    if (skills.list === wrappedList) {
      if (hadOwnList) skills.list = previousList;
      else delete skills.list;
    }
    if (skills.get === wrappedGet) {
      if (hadOwnGet) skills.get = previousGet;
      else delete skills.get;
    }
  }, "skill-gate: unwrap skills");

  const ready = load().catch((error) => {
    ctx.logger?.error?.("[skill-gate] 读取名单失败，按全部开启继续：", error);
  });

  ctx.reflect.provide(GATE_SERVICE, {
    storePath,
    getRevision: () => revision,
    getDisabled: () => [...disabled].sort(),
    snapshot: async () => {
      await ready;
      return snapshotState();
    },
    setDisabled: async (names) => {
      await ready;
      return persist(names);
    },
  });

  void ready.then(() => {
    if (disabled.size === 0) return;
    try {
      ctx.emit("skills/change");
    } catch (error) {
      ctx.logger?.warn?.("[skill-gate] 无法广播 skills/change：", error);
    }
  });
}
