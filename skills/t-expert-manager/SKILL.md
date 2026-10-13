---
name: t-expert-manager
description: T专家 运维台 —— 本机名册的增删、名册一致性校验、统计与中文覆盖、装机到 DSH Desktop、发布到 npm。名册规模（专家数 / 分区数）一律现算，不写死。Use when the user asks to add/remove/validate/count T专家 experts, 新增专家 / 删除专家 / 校验名册 / 名册统计 / 重装插件 / 发布插件.
---

# T专家 运维（expert-manager）

运维入口只有一个：`bash "{{TZ}}"`。本机运维台根目录：`{{OPS_ROOT}}`。

这套流程解决的是「你是原作者，要维护自己的名册和插件」的场景；只想**用**专家，不要走这里
（用 `list_t_experts` / `summon_t_expert`）。

## 铁律

1. **只用 tz.sh**。不要手改 `data/experts/`、`plugin/`、`~/.t-team/`，也不要手改 `package.json` 的版本号 ——
   这些动作脚本都代劳了，绕开脚本换来的就是"源码加了、运行时没加"这类半成品状态。
2. **`data/experts/` 是真源**。增删由 `add-expert.py`（tz.sh 代跑）执行，它**同时写**源码与运行时
   `~/.t-team/experts/`，两边永远一致。
3. **统计必须递归**。有专家落在嵌套子目录（如 `game-development/unreal-engine/…`），
   只看分类目录的第一层会漏掉它们。位数一律以 `tz.sh status` 的递归结果为准 ——
   正文里不写死位数，因为每加一位专家它就会过期。
4. **数据更新不用重装、不用重启**（宿主按 mtime 指纹自动重载名册）；**改插件代码**才需要
   `tz.sh build` → `tz.sh install` → 重启 DSH Desktop。
5. **`data/zh/` 默认不动**（上游同步已移除）：新专家没有中文名/简介会回退英文，这是预期行为。
   **例外（2026-09-15 用户决策）**：与 `agency-agents-zh` 源仓库对齐时可以破例补译 —— 那就同时写两侧的
   `zh/names.json`、`zh/descriptions.json` 与 `zh/<分类>/<slug>.md`（源码 `data/zh/` + 运行时 `~/.t-team/zh/`），
   再重算 `zh/COVERAGE.json`；手工补译的正文放 `zh/manual-bodies/`。改完必须 `experts check`（它会拿
   COVERAGE 对账，数字过期即红）。
6. **破坏性动作先确认**：删除专家、卸载插件、发布 npm 之前，把影响讲给用户听，得到明确同意再执行。

## 先看状态

```bash
bash "{{TZ}}" status
```

一眼给出：名册位数 / 分类数 / 中文覆盖 / 插件版本 vs DSH 里装的版本 / 仓库是否干净。

## 工作流

### A. 新增专家

1. 先确认 slug 不冲突（`bash "{{TZ}}" roster` 看现有分类与位数）。
2. **先 dry-run**：
   ```bash
   bash "{{TZ}}" experts add --category <分区> --slug <slug> --file </绝对路径/xxx.md> --dry-run
   ```
3. 确认路径无误后去掉 `--dry-run` 正式写入。源文件缺 frontmatter 时补 `--name` / `--description`；
   目标已存在要覆盖时加 `--force`。
4. 收尾校验：`bash "{{TZ}}" experts check`，必须报"三处一致"。

### B. 删除专家

先 `--dry-run` 看清要删的两条路径，再执行：

```bash
bash "{{TZ}}" experts remove --category <分区> --slug <slug> --yes
```

源码与运行时会被一并删除（`--yes` 跳过交互确认，所以**先跟用户确认过**再用）。

### C. 校验名册

```bash
bash "{{TZ}}" experts check     # 源码 ↔ 运行时 ↔ 清单，逐文件 sha256；退出码 1 = 有漂移
bash "{{TZ}}" verify            # check + 插件自检（verify.mjs），改过代码后必跑
```

### D. 统计与中文覆盖

```bash
bash "{{TZ}}" experts stats
```

汇报时给"分类数 / 专家数 / 中文覆盖"，不要把整张分类表贴给用户。

### E. 装机（只在改过插件代码时需要）

```bash
bash "{{TZ}}" verify            # 先自检
bash "{{TZ}}" build             # 构建 client bundle
bash "{{TZ}}" install           # 装到 profile（默认 desktop）；可先 --dry-run
```

装机后仍需**重启 DSH Desktop**（客户端产物由宿主启动时加载）。

### F. 发布到 npm

```bash
bash "{{TZ}}" publish-dry       # 预演：只跑预检与打包预览
bash "{{TZ}}" publish --current # 直接发布 package.json 里的当前版本（不升版）—— 版本号在开发期就写好了
bash "{{TZ}}" publish           # 交互选版本（菜单里选项 1 就是"发布当前版本"）；也可 --patch / --minor / --major / --version X.Y.Z
```

> 版本号的单一来源是 `package.json`：菜单 7 会把**当前版本号自动读出来**并作为首选，
> 客户端构建版本（`CLIENT_BUILD_VERSION`）与它必须一致（verify 有断言盯着）。
> 回车＝取消（发布不可逆，没有"回车即发"的默认）。
> 选「发布当前版本」不跑 `npm version`，但会**给该版本补一个 tag** —— 发出去的版本要能对应到具体提交，失败后也才能用 `--retry` 重试。

**版本纪律（2026-09-15 用户定）**：**每次提交 git 都要同步升版本号** —— 提交前把 `package.json` 的
`version` 与 `src/client/state.js` 的 `CLIENT_BUILD_VERSION` 一起改，跑 `bash "{{TZ}}" build` 重建客户端产物，
提交信息以新版本号起头（如 `0.3.25`）。理由：npm 上已发布的同号版本，其内容与本地工作树并不相同，
不升版就分不清「装的是哪一版」，发布时也会撞上同号已存在。

**tag 纪律（2026-09-15 用户定）**：**tag 的版本号必须与 npm 上发布的版本一一对应** —— `v<X.Y.Z>`
就是 `package.json` 的 version、也就是 registry 上那个号。所以：**提交时升版本号 ≠ 打 tag**
（未发布的版本不许有 tag），而**打了 tag 就必须发出去**（不留"有 tag、npm 上没有"的悬空标记）。
tag 必须是 annotated（`git tag -a`）。发布脚本会把 tag 落在**无父的发布快照**上再推：远端 `main`
只收那一条快照，本地数百条开发历史不出本机。别手工 `git push --follow-tags` —— tag 的父链会把
整条历史送上去（`ops/git-hooks/pre-push` 会拦，安装：`git config core.hooksPath ops/git-hooks`）。

**发布前必须**：(a) 得到用户明确同意；(b) `experts check` 与 `verify` 全绿；(c) 工作区没有未提交的意外改动。

**客户端源码结构（2026-09-17 按职责拆分）**：客户端 UI 原本是一个 5278 行的单文件 `src/client.jsx`，
现拆在 `src/client/` 下、入口是 `src/client/index.jsx`（即 `npm run build` 的 entryPoints）：
`state`（模块级常量）/ `i18n`（zh·en 字典）/ `css` / `remote`（direct + TYPERT_REMOTE）/
`catalog`（名册缓存与提及解析）/ `boundary`（区块错误边界）/ `settings` / `tabs` / `insert` / `summon`。
两个曾经在这里的文件已随功能整体迁去 `dsh-helper`：`schedule`（定时任务，2026-09-25）与
`attention` + `jobs`（活跃指示与会话跳转，2026-09-28）—— 那边叫 `schedule.jsx` / `attention.jsx` /
`session-nav.js`，本仓库不再有它们的任何代码。**新增 UI 放进对应职责的文件**；`tools/verify.mjs` 用
`CLIENT_SOURCE_ORDER` 按**原行序**拼接这些文件供断言读取，所以**新增一个源文件必须同时登记进那个清单**
（有一条断言盯着"目录 = 清单"，漏登记只会让相关断言静默失去覆盖，门禁不会红）。
产物仍是**一个**客户端模块 id（`window.__ModuleLoader__.load`）—— 拆分只发生在源码层。

## 汇报约定

- 给"执行的命令 + 结尾结论"，不要贴整篇日志。
- 失败就贴出错那一段（含退出码）并说明下一步；不要静默重试或换个命令重来。
- 名册位数永远按递归结果报（见铁律 3）。

## 参考

- `references/ops-reference.md` —— 完整子命令 / 菜单号 / 参数表，以及"哪份文件是真源"的地图。
