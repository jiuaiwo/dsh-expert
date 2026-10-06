# 更新日志

本项目遵循[语义化版本](https://semver.org/lang/zh-CN/)与 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)。

> **本文件是 2026-09-28 才建的**（0.4.5 起）—— 此前这个仓库一直没有 CHANGELOG，
> 变更历史只存在于 git 提交标题里。所以：
>
> - **0.4.5 起**的条目是当时手写的，细节完整；
> - **0.3.93 – 0.4.4** 的条目由 `git log` 的提交标题**回溯生成**（每条附提交号与日期），
>   只有一句话摘要，细节以对应提交为准；
> - **0.3.92 及更早**（共 51 个版本提交）不再逐条回溯：npm 上发布的最后一个版本是
>   **v0.3.92**，`git tag` 与 `git log` 是唯一可信来源。
>
> 版本号规矩（与 dsh-helper 同一套，用户 2026-09-26 定）：**每次 git 提交都升一级版本号** ——
> 改 `package.json` 的 `version` 与本文件顶部段落，两者连同提交一起走；
> 发布时**不要再跑 `npm version`**（那会把已提交好的版本又升一级，发出去的号与 CHANGELOG、tag 就对不上），
> 只补一个 annotated tag（`git tag -a`，因为 `git push --follow-tags` 只推带注释的 tag）。

## [0.5.4] — 未发布

**运维台菜单从 14 项裁到 7 项** —— 只留与辅助补丁同级的常用动作。

### 变更

- `ops/tz.sh` 的菜单只保留：**名册统计 / 安装·重装 / 卸载 / 构建 / 校验 / 发布预演 / 一键发布**，
  与 `dsh-helper` 运维台的 `status / install / uninstall / build / verify / publish-dry / publish`
  对齐。
- **能力一个都没删**，只是不再占菜单：新增·删除专家、单独的名册一致性校验、中文覆盖报告、打开
  源码与运行时目录、同步数据快照，仍可经子命令或直接调 `ops/add-expert.py` 使用 ——
  名册增删现在走 `tz.sh experts add|remove|stats|check`。
- 连带修正所有引用旧编号的文案：`ops/README.md`（菜单 13 → 7）、
  `skills/t-expert-manager/SKILL.md`（菜单 15 → 7）、`ops/add-expert.py`
  （原写「用 `tz.sh 1` 新增」，编号变了会误触发名册统计 → 改为子命令）、
  工作区 `README.md`（菜单 8 → 2）。
- `tools/verify.mjs`：原「菜单把 1/2/3/5 接到名册工具上」改为盯**子命令**接线（能力还在），
  另加一条钉住裁剪结果（菜单只 7 项、不许出现第 8 项）。自检 554 → 555。

## [0.5.3] — 未发布

**移除一个含真实云凭据的 `.env`** —— WorkBuddy 专家包自带的，导入时被原样复制了进来。

### 安全

- `data/experts/security/invoice-verify-workbuddy/.env`（716 B）里是**真实的阿里云 OSS
  AccessKey ID + Secret**，另有若干第三方接口地址与账号。它随 2026-09-29 的 0.4.27
  「接入 WorkBuddy 专家市场」一起进来（`import-workbuddy.py` 是整包复制），此后**随 npm
  发布了多个版本**。
- **发现方式**：2026-10-06 往**新建的**公开仓库推第一条快照时，被 GitHub 的 **push protection**
  当场拦下，并直接指名了文件与行号。注意发现渠道的来源：它一直是「随包发布」的，而拦下它的
  却是 GitHub 的新仓库推送 —— npm 那边从 0.4.27 起就带着它，没有任何机制提醒过。
  （旧仓库在 9-29 之后同样含它，但那个仓库今天已删，无从回溯确认。）
- **处置**：删除该文件（该专家包的 `mcp-config.json` 用的本来就是 `${VAR}` 占位符，配置由
  使用者自己提供，删掉不影响包的结构）；`.gitignore` 增加 `.env` / `.env.*` / `**/.env` 等
  规则；`tools/verify.mjs` 新增两条断言，把「被 git 跟踪的凭证类文件」与「npm 包里的凭证类
  文件」两个出口一起堵上（自检项数 552 → 554）。
- ⚠️ **凭据本身需要轮换**：它存在于本地 git 历史（提交 `8f96fe00`）与已发布的 npm 包中。

## [0.5.2] — 未发布

**修交叉引用** —— 两个仓库会互相引用对方的包名/目录名，这次改名各改各的，交叉的那部分漏了。

### 变更

- `src/client/{css,state,index}.jsx` 与 `src/client/ui.jsx`：注释里「迁去 `dsh-helper-patch`」
  「与 `dsh-helper-patch` 同一处」这类历史叙述改成当前名 —— 留着旧名，后来的人（或 agent）
  会去找一个已经不存在的东西。
- `tools/verify.mjs`：4 处断言说明与注释同理。
- `README.md`、`skills/t-expert-manager/SKILL.md` 同步。
- `lib/client.js` 重新构建：产物里 esbuild 生成的 sourcemap 路径注释
  （`// ../dsh-plugin-t-expert/node_modules/...`）跟着更新。

## [0.5.1] — 未发布

**修 `tz.sh status` 的名册数** —— 它一直把专家包里的附件也算成专家。

### 修复

- `ops/tz.sh` 的 status 用 `find "$DATA/experts" -name '*.md'` 数专家，而名册里 322 位是
  **目录形态的专家包**（`<分区>/<slug>/persona.md` + 包内 skills/、references/ 等附件）——
  那些附件同样是 `.md`，于是全被算成了专家：**623 位的名册显示成 5633 位**。
  改用插件自己的 `catalog.countExperts()`（递归 .md，遇到专家包剪枝计 1），与 `verify.mjs`
  断言的 623 位同口径，两处数字再也不会各说各话。
- 中文覆盖那行标注「该表已冻结」：它读 `~/.t-team/zh/COVERAGE.json`，那份停在 323 位时代、
  不再随名册更新，不加说明会被当成当前覆盖率。

## [0.5.0] — 未发布

**改名为 `dsh-expert`**（原 `dsh-plugin-t-expert`）—— npm 包名与 GitHub 仓库名一起改，一次理清。

### 变更

- **npm 包名**：`dsh-plugin-t-expert` → `dsh-expert`；
- **插件 id 与设置卡片 key** 一律跟随包名：`cordis.patch.yml` 的 `name:`、客户端 settings key、
  TYPERT 注册 id，以及 `tools/` 里几处「兄弟目录推断」和自检断言里的硬编码。
- **工具名不变**：`list_t_experts` / `summon_t_expert` / `summon_t_experts` 照旧 —— 已经写进
  提示词与定时任务里的调用不受影响。
- **数据目录不变**：运行时数据仍在 `~/.t-team/`（它本来就不带包名，天生免疫改名）；
  技能开关名单仍在 `~/.dsh/skill-gate.json`（沿用旧路径的先例）。

### 迁移

旧包 `dsh-plugin-t-expert` 会被 `npm deprecate` 指向新包。装旧包的用户：

```bash
dsh plugin --profile web remove dsh-plugin-t-expert
dsh plugin --profile web add dsh-expert
```

数据目录不动，装完即可用。

### 顺带

- `tools/__pycache__/` 从版本库移除并写进 `.gitignore`：编译缓存不该进 git，而且它里面还留着旧包名。

## [0.4.70] — 未发布

**README 对齐实现，并去掉本机开发那套** —— 面向用户的门面只说用户要听的话。

### 变更

- 「安装」不再分「本机开发 / 维护者（file: 装到 profile）」与「发布到 npm 之后（普通用户）」
  两条路，只留 **DSH Web / CLI**（`dsh plugin --profile web add dsh-plugin-t-expert`）与
  **DSH Desktop**（插件市场）两种；`~/web/t-team/tz.sh` 那套维护者流程从面向公众的文档里移除。
- 依赖表述与实际解耦：原文写死 `^0.1.5-rc.1 || ^0.1.6-alpha.2 || ^0.1.7-rc.1`，而
  peerDependencies 实际就是 `>=0.1.5-rc.1`（无上界），改为与 package.json 一致。
- 修正三处与实现矛盾的描述：设置页是**三个标签**（专家 / 分类 / 技能），不是两个；
  自建专家与自建分类的入口是「插件列表 → T专家 → 对应标签」，不再是「设置 → 专家 / 分类」
  （面板 2026-09-28 起就搬去插件信息页了，旧文案一直没跟上）。
- 删掉「技能开关」章节末尾的实现细节段（包装 `ctx.skills` / 动态 inject 那些）——
  面向用户的 README 不需要，源码里写得更清楚。
- `tools/verify.mjs`：原「README 说明设置页只有专家 / 分类两个标签」那条断言把数字写死了，
  可客户端早就是三个 —— 它靠着 README 里一句无关的「两个标签都带计数」蒙混过关。
  改成**直接读 `settings.jsx` 的标签集合**再与 README 对照，实现变了这里就红。

## [0.4.69] — 未发布

**发布不再把开发历史推上 GitHub** —— 远端只收一条无父提交的发布快照，本地历史永不出本机。

背景（2026-10-06 实测）：远端 `main` 已改成「只有一条 `--orphan` 起点的无父快照」，但发布链
还在用 `git push --follow-tags`，而 tag 是**带父链**的 —— 实测复现：分支推送被 non-fast-forward
拒绝、命令退出码为 1，脚本于是打印「推送失败」，看起来像什么都没推上去，**可 tag 已经推成功了**，
从远端 clone 顺着它就能看到全部 288 条开发提交。

### 变更

- `ops/tz.sh`：3/6 末尾新增「发布快照」步骤 —— 用 `git commit-tree` 造一条**无父提交**的快照
  （树 = 本次发布提交的树），把 tag 重指到它，并让 `refs/heads/github` 指向它；4/6 改成
  `git push -f origin refs/heads/github:refs/heads/main` + `git push origin refs/tags/v$target`。
  两条推送各自失败都只 warn，不影响 npm 发布。`--no-push` 逃生口保留，跳过时打印补推命令。
- `ops/git-hooks/pre-push`（新增）：pre-push 保险闸 —— 拒收「交给 `refs/heads/main` 的带父提交」
  与「指向带父链提交的 tag」，提示里报出**沿父链回溯有多少条提交**。
  安装：`git config core.hooksPath ops/git-hooks`。
- `tools/verify.mjs`：原「默认推送」断言改写成四条 —— 不再执行 `--follow-tags`（判定跳过注释行，
  因为脚本里有意保留着当初为什么踩坑的记录）、有快照逻辑、tag 落在快照上、`--no-push` 逃生口仍在；
  另加一条守住保险闸。自检项数 548 → 552，`.github/workflows/ci.yml` 的数字同步跟齐。
- 文档与提示语同步：`ops/README.md`、`skills/t-expert-manager/SKILL.md`、
  `references/ops-reference.md`、`tools/sync-from-workbuddy.mjs` 的收尾提示。

## [0.4.68] — 未发布

**OBS 凭据可入库，同步链路不再卡在上传** —— 为「一条提示词跑完整同步（含上传）」扫掉唯一的人工前置。

- `tools/obs-credentials.mjs`（新增）：OBS 凭据的读写收敛到一个模块 —— **环境变量优先**，
  缺失时回退 `~/.dsh/.credentials.yaml` 的 `refs` 段（DSH 官方凭据库）。只做该段的浅解析，
  不为两个键引一整个 YAML 依赖。抽公共模块是为了避免解析逻辑两处各写一份、日后漂移
  （判重逻辑重复的坑在 `import-workbuddy.py` 上已经踩过一次）。
- `tools/set-obs-credentials.mjs`（新增）：一次性写入凭据库。交互式输入**隐藏回显**
  （密钥不打屏、不进对话历史）；写前自动备份 `.bak-obs-<时间戳>`（600 权限），
  写后回读校验、**校验失败自动回滚** —— 凭据库是宿主的文件，写坏会连带其它凭据一起读不出。
  另有 `--show`（遮蔽查看现状）与 `--from-env`（非交互）两种用法。
- `tools/upload-obs.mjs`：签名处改为调用共享模块；「两个来源都没有就报错」仍是最终兜底，
  错误信息里直接给出两条可操作的路子。

## [0.4.67] — 未发布

**单文件专家也有头像了** —— 308 位 `<分区>/<slug>.md` 形态的专家补上头像。

- `lib/index.js` 的 `avatars()` 支持第二种形态：没有包目录的单文件专家去**分区级**
  `<root>/<分区>/avatars/<slug>.webp` 取图（此前 `packDir === undefined` 直接跳过，
  生成了也显示不出来）。
- `tools/gen_avatars.py`：支持单文件形态（落盘到分区级目录）、`--model` 切换模型、
  单文件 / 目录两种形态自动识别。

### prompt 教训（已写进脚本注释）

往 prompt 里塞 `no grid, no collage, no multiple faces, no contact sheet…` 一连串负向词
**完全适得其反** —— 扩散模型把它们当正向内容，画出「一张图排满几十个小头像」的拼贴画。
改成一句短正向描述 `Portrait of one single person, professional headshot, {style}, plain solid background`
之后，Kolors / Z-Image-Turbo 都 100% 出单人肖像。

头像合计 **608 张**（目录形态 300 + 单文件 308）。



**verify 补一条断言**：locale 描述里的名册数必须与实际一致 —— 防再次出现「package.json 改了、
locale 还写旧数字」这类漏改。自检项数 547 → 548。



**修正插件描述里的名册数字** —— `locale/zh.json` 与 `locale/en.json` 的 description 还写着
「323 位专家」，而 `package.json` 的英文 description 早已是 623（上次更新数字时只改了英文、漏了两处 locale）。



**修 #6 优化其实没生效的问题** —— `enabledSet` 每次渲染都 `new Set(...)`、引用恒变，
导致 `visible` 的 `useMemo` 依赖恒变、每次都重算（白加一层 memo）。

把 `enabledSet` 也包 `React.useMemo`（依赖 `[snapshot]`），`useMemo` 才真正生效。



**补 0.4.62 漏写的 `avatarsCache` 声明** —— 上一版只写了「失效」，漏了 `let avatarsCache` 声明与缓存判断，
导致 `tsc` 报 `Cannot find name 'avatarsCache'`、`npm publish` 的 typecheck 失败。

把 `let avatarsCache` + 命中判断 + 写回补齐，`tsc` 通过。



**三处性能优化**（审查报告里挑出的高收益项）。

- `settings.jsx`：专家过滤与分组套 `React.useMemo`（600+ 项不再随任意 state 变更全量重算，对齐 summon.jsx）。
- `lib/index.js` 的 `avatars()`：结果进程内缓存，只有 `fetchAssets` / `fetch_expert_assets` 拉来新头像才失效 ——
  避免每次打开设置页/浮层都读 281 张 webp 并拼 base64（约 1.3 MB RPC 传输）。
- `summon.jsx` 的 `toggle()`：改 stale-while-revalidate —— 打开弹窗先用缓存的 snap 立即显示、后台再刷，
  不再 await 最慢的那次 RPC。



**修两个代码审查发现的 bug**（逐条读码验证属实后修）。

1. **`readPrefs()` 漏读 `enabledSeedRoster`**（数据正确性）。entry 模式（0.1.7+，无 register 只有
   mutate）下 `seedDefaultEnabled` 拿到的 `seen` 恒为 `[]`，基线退化成当前 enabled —— 用户停用过、
   但仍在名册里的专家会被当成「新增」重新写回 enabled。补上 `enabledSeedRoster: unwrapVolatile(...)`。
2. **`deleteExpert` 未 guard `settingsService`**。settings 未就绪时硬调 `settingsService.mutate` 会抛错
   打断删除流程（文件已删、enabled 留 ghost 反而无害）。加上 `&& settingsService !== undefined`，
   与 `pruneStaleEnabled` / `seedDefaultEnabled` 对齐。

verify 补一条源码级回归断言（entry 模式走不到 scope mock，用源码断言防回归），546 → 547。



**清理 0.4.59 遗留的两处死代码**（代码检查时发现）。

`avatars` 进了 `KEEP_LOCAL` 之后就不再出现在 `dirs` 里，于是：

- `collect()` 里「只装 avatars」那个分支永远不会触发（`dirs.includes("avatars")` 恒为 false）；
- `isRemote` 里的 `|| p.dirs.includes("avatars")` 同样恒为 false。

两处都删掉，`isRemote` 回到单纯的体积判断。**死分支留着会误导后来人** —— 看着像「头像要上云」，
实际早就不是了。

复核过的两点：

- `prune()` 按 `p.dirs` 删，而 `avatars` 已被排除在 `dirs` 之外 —— **不会被误删** ✓
- roster 条目里没有 `avatarsOnly` 这类临时字段残留 ✓



**头像改为随包发布** —— 放弃云端按需下载那条链路。

### 为什么改

用户实测云端链路始终不稳定：点选/点 ☁️ 不触发下载、下载完要重开面板才刷新，几轮修下来
仍会「有的能显示、有的不能」。而 **281 张 128px WEBP 加起来总共才 0.94 MB** ——
直接进包最省事，也永远不会「显示不出来」。**能用简单办法解决的复杂度，就不该留着。**

### 改动

- `pack-assets.mjs`：`avatars` 加入 `KEEP_LOCAL`（与 `.codebuddy-plugin` 同级 —— 绝不上云、随包发布）。
- `lib/index.js` 的 `assetsOf`：roster 里那些「只装 avatars」的条目**视为本地** ——
  否则面板会给 105 位专家挂一个点了也没必要的 ☁️。
- `tools/import-avatars.py` 的收尾提示同步更新。

### 保留的部分

客户端与 host 的那一层**全部保留**（`getAvatars` / `unwrap` / 卡片渲染 / 下载后广播）：
逻辑不变，只是头像的来源从「云端下载」换成了「包内自带」。云端资源包里的 avatars 存量
不再维护，下次同步重打包时会自然消失。

代价：npm 包 +0.94 MB。



**面板的 ☁️ 标识改成可点的下载入口** —— 之前它只是个 `<span>`，注释却写着「点选与召唤都会自动下载」。

### 现象

用户反馈：「部分专家有头像、部分怎么点都没有」。

### 根因

`warmupAssets`（下载预热）只挂在两处：

- `@` 弹窗的 `pick()`（`summon.jsx`）
- 输入框 `@` 菜单的 `onPick()`（`index.jsx`）

**面板列表（`settings.jsx`）完全没有触发点**。于是规律很清楚：

- **召唤过 / 在 @ 弹窗选过**的专家 → 附件已下载 → 有头像 ✓
- **只在面板里看过**的专家 → 永远不触发下载 → 永远 emoji ✗

而面板那个 ☁️ 标识本身是个 `<span>`（注释写着「只是个标识、不是按钮」），点它同样没用。

### 修复

把 ☁️ 改成 `<button>`，点击即 `warmupAssets(remote, expert)`；点完立刻收起标识
（下载在后台跑，不给即时反馈会让人以为没生效）。CSS 加 `.t-team-cloud` 抹掉按钮默认外观。

### 教训

**同一个动作（下载预热）在三个入口里只挂了两处** —— 注释写的是「点选与召唤都会自动下载」，
但面板那条路径压根没实现。写「A 和 B 都会做 X」这类注释时，得真的去核对 B。



**清理残留的诊断 alert** —— 0.4.55 那次「移除诊断」的字符串替换没匹配上，`alert` 留到了源码里。

- `settings.jsx` 删除 `alert('[头像诊断]…')` 残留（否则每次取头像都会弹窗）。
- 更新过时注释：头像 effect 的依赖早已改成 `[avatarRev]`，注释却还写着「依赖用 []（只跑一次）」。

### 教训

用字符串替换「删除调试代码」不可靠 —— 匹配串与实际代码对不上时会**静默失败**，
留下一段每次执行都弹窗的代码。删调试代码后要 `grep` 全库确认，而不是只看替换的返回。



**点选专家下载完头像后，面板自动显示头像**（之前必须重开面板）。

### 现象

用户实测：点选专家 → 头像确实下载到了本地 → **但面板还是 emoji，要重开面板/重启才看得到**。

### 原因

`warmupAssets()`（点选预热）下载完成时只做了 `refresh(remote, true)` —— **刷新名册**；
而**头像是在面板/弹窗挂载时单独取一次的**（`getAvatars`）—— 两者互不知情。
结果名册刷新了、`assets` 状态更新了，但头像那份 state 还是旧的。

### 修复

`warmupAssets` 完成后额外广播 `t-team:avatars-changed`；面板与 `@` 弹窗各加一个监听，
收到就把 `avatarRev` +1，带动取头像的 effect 重跑。

### 教训

**同一份数据被两处独立取用时，刷新必须一起刷** —— 只刷了名册、漏了头像，
表现就是「东西明明下好了，界面纹丝不动」，看起来像功能根本没生效。



**头像显示的真凶：RPC 返回值外面套着 `{ok, value}` 信封，我没解。**

### 根因

DSH 的 remote 调用返回值形如 `{ ok: true, value: 真实数据 }`，**必须用 `unwrap()` 解掉**
（`src/client/catalog.js:21`，`getCatalog` 等所有既有调用都这么写）。新加的 `getAvatars` 漏了这一步，
客户端拿到的是**信封本身** —— 诊断时打印 `Object.keys(map)` 得到 `["ok", "value"]`，
而 `map["novel-generator"]` 永远是 `undefined` → 卡片全部回退 emoji。

**把 `Object.keys(map)` 弹出来这一步是一击定位的关键**：那两个字段名直接暴露了信封结构。

### 修复

`settings.jsx` / `summon.jsx` 改用 `unwrap(await remote?.getAvatars?.(), "getAvatars")`，
失败兜底成 `{}`；诊断代码移除。

### 这一轮叠在一起的三个坑

1. **`useEffect` 依赖 `[remote]` 不稳定** → effect 反复重挂 → `alive` 恒为 false →
   `setAvatars` 一次都没执行（真 bug，0.4.54 已修）。
2. **pnpm 的 `file:` 依赖是「拷贝」不是符号链接** → 改源码 + build 后 `desktop/node_modules`
   里那份纹丝不动 → **前两次修复根本没到 App**，一直在看旧 client.js。必须
   `rm -rf node_modules/dsh-plugin-t-expert && pnpm add file:...` 强制重挂
   （`realpath` 看着像链接，很容易误判成软链 —— 这次就被它骗了一轮）。
3. **RPC 返回值信封没解**（本条）。

### 附带发现

`~/.t-team/experts` 是 325（目录形态）+ 323（单文件）= **648**，而 `data/experts` 是 300 + 323 = **623** ——
运行时目录**多 25 位历史残留**（删过但没同步回运行时），面板上的「专家 648」就是这么来的。
不影响功能，要清需单独处理。



**修掉「头像数据取到了却显示不出来」的 bug** —— 用户实测：诊断弹窗显示 RPC 返回 2 条，界面却全是 emoji。

### 根因

`settings.jsx` / `summon.jsx` 里取头像的 `useEffect` 依赖写成了 `[remote]`：

```js
React.useEffect(() => {
  let alive = true;
  (async () => { ... if (alive && ...) setAvatars(map); })();
  return () => { alive = false; };
}, [remote]);        // ← desktop 上 remote 走 /api 网关，引用不稳定
```

desktop 的 remote 是经 `/api` API Gateway 构造的，**引用不稳定** → 每次重渲染 effect 都重挂 →
cleanup 把 `alive` 置回 `false` → **数据取到了也被 `if (alive …)` 丢掉**，state 永远停在空对象。

`alert` 写在 `.then` 里、不看 `alive`，所以照样弹「OK 返回 2 条」—— 这个反差正是定位根因的关键。

### 修复

依赖改 `[]`（只跑一次）。`remote` 在组件生命周期内是稳定的，本来就不需要跟。

### 教训

**用 `alive` 防 setState-on-unmounted 时，依赖数组必须是稳定的** —— 否则它防的不是「卸载后 setState」，
而是「一切 setState」，而且**完全静默**。另外这次能一步定位，靠的是把被 `catch(() => void 0)`
吞掉的结果/错误暴露出来：**给静默失败装一个能看见的出口**，比反复猜快得多。



**面板与 @ 弹窗显示专家头像** —— 0.4.52 只做到数据链路，这一版接上最后一环。

### 做法

- **host**：`lib/index.js` 的 catalog 服务加 `avatars()` —— 扫本地各专家包的
  `avatars/avatar.webp`，返回 `{ slug: dataUrl }`。**只含已下载过资源的专家**（没下载的本地
  根本没这个文件，自然不在返回里），这正是「没下载过显示默认头像」的落地方式。
- **remote**：`lib/remote.js` 加 `getAvatars` 描述符 + 转发方法，**并加进 `exposeRemoteMethods`
  的装饰清单** —— 漏这一步 `remoteMethods()` 就扫不到它，verify 的「方法与描述符一一对应」会直接拦下。
- **客户端**：`src/client/remote.js` 加配对的 direct 声明；`settings.jsx`（面板卡片）与
  `summon.jsx`（@ 弹窗）各取一次头像 map，**有头像渲染 `<img>`、否则回退原来的 emoji / 分区图标**；
  `css.js` 给两个头像圆各加 `img{width:100%;height:100%;border-radius:50%;object-fit:cover}`。
- **代价**：只返回本地已有的那些，未下载过资源的专家不产生任何数据传输，列表加载不受影响。

### 自检

546/546（「卡片头像」那条断言已更新以反映新渲染）。



**专家头像：从 WorkBuddy 取回、压成 128px WEBP，随资源包按需下发（不进 npm 包）。**

### 背景

WorkBuddy 的头像在**拉取阶段**就被丢弃了（`workbuddy-expert-fetch` 默认不保存头像，省 315 MB），
面板此前只有 emoji。现在按用户口径加回来：**没下载过的专家显示默认（emoji），下载过的显示真实头像**。

### 做法

- **拉取**：`--only <281 位> --with-avatars --force`，只拉现役专家，已删的不拉。
- **压缩**：新增 `tools/import-avatars.py` —— 取 `plugin.json` 的 `avatar` 字段指定的**主头像**，
  压成 **128px WEBP**，统一命名为 `avatars/avatar.webp`，**原图一概不留**。
  实测原图是 1024² PNG、约 200 KB～1.5 MB，压后 **3.4 KB/张**，281 位合计 **0.94 MB**。
- **上云**（`pack-assets.mjs` 两处）：
  ① `avatars` 列入**强制上云** —— 它只有 5 KB、远低于 50 KB 阈值，否则会被塞进 npm 包；
  ② 附件本来就小（≤ 阈值）但含头像的包，**tar.gz 只装 avatars**，其余（skills 等）继续随 npm 包
     发布、立即可用 —— 不因为一张头像就把整个包挪上云端。
- **运行时**：`ASSET_DIRS` 加 `avatars`；解包逻辑不用改（它按 roster 的 `dirs` 走）。

### 自检

roster **181 → 289 条**（105 个「只装头像」的小包 + 若干含头像的大包），云端 174 MB；546/546。
抽验 `marketing/seo-content-team` 的 sha256 与 OBS 元数据一致 ✓。

### 遗留

面板显示头像还差**客户端与 host 那一层**：浏览器读不到本地文件，需要 host 提供读取接口。

### 教训

本轮**又踩了一次「别单独手跑 `pack-assets.mjs`」** —— 附件早已 prune，它按「本地还能打包的包」
重算，把 181 条 roster 清成了 281 条纯头像条目。靠 `git checkout -- data/roster.json` 恢复，
再用 `assets.mjs fetch --all` 把附件拉回本地，才重新打对。

## [0.4.51] — 未发布

**`upload-obs.mjs` 新增 `--delete-orphans`：清理删过专家后留在桶里的孤儿对象。**

### 新增

    node tools/upload-obs.mjs --delete-orphans        # 只列不删
    node tools/upload-obs.mjs --delete-orphans --yes  # 真删

- 用 ListObjects（自动翻页）扫 `<prefix>/packs/`，与 `roster.json` 引用的 path 集合比对，
  列出没被引用的对象；**只扫 `packs/` 前缀**，不碰桶里其它东西，免得误删手工放进去的。
- **默认只列不删**，要 `--yes` 才真删（破坏性操作两道闸）。
- 实现细节：OBS v2 签名里 `prefix` / `marker` / `max-keys` **不属于**要签的子资源，
  桶级 LIST 的 CanonicalizedResource 只有 `/<bucket>/` —— 所以直接复用 `authorize({ key: "" })`。

### 实测（这就是加它的原因）

```
桶里 244 个对象 / 清单引用 181 个 / 孤儿 63 个 / 合计 529.0 MB
```

其中 `vietnam-finance-tax-expert.tar.gz` 一个就 495.6 MB（占 93.7%），其余 62 个来自更早的几次删除：
内部依赖专家（`omics-*`、`fundus-disease-analysis`…）与「去分区前缀重名」那批
（`ui-designer`、`backend-architect`、`frontend-developer`… —— 判重修复之前导入的）。

## [0.4.50] — 未发布

**移除 `finance/vietnam-finance-tax-expert`（495.6 MB）** —— roster 里最大的包，是第二名的 12.5 倍。

### 为什么

它是个「**离线 RAG 型**」专家：自带 723 篇越南财税法规语料，外加

| 文件 | 大小 |
|---|---|
| `tfidf_matrix.npz`（预计算检索索引）| **382.9 MB** |
| `chunks_metadata.json`（分块元数据）| 41.7 MB |
| 法规原文（PDF/HTML/TXT）| 约 70 MB |

功能上很完整（不联网就能查越南税法，还配了企业所得税／工资／关税／选址四个计算器），
但**单个专家 495.6 MB 太重**（第二名 `legal/malaysia-hr-admin` 才 39.6 MB），
按需下载的设计不值得为它付这个代价。

名册 **624 → 623**；roster **182 → 181**；README / npm description / THIRD-PARTY-NOTICES /
许可说明 / source.json / verify 数字同步校准。

### 遗留

OBS 上的 `packs/finance/vietnam-finance-tax-expert.tar.gz`（495.6 MB）现在是**孤儿对象** ——
`roster.json` 里没有它，不会有任何客户端去下载，但占着云端空间。清理方式见技能
`t-expert-roster-sync` 的说明（`tools/upload-obs.mjs` 目前只有上传与校验，没有删除）。

## [0.4.49] — 未发布

**远端清单的两个缺陷：一个是功能性的（495 MB 附件拿不到），一个是我自己设错的上限。**

### 背景

按用户要求实测「召唤专家能否下载附件」：两位专家（`seo-content-team`、`fin-research-expert`）
都下载成功，sha256 与清单**逐字节一致**，解包后文件齐备。但顺带查出远端清单的两个问题。

### 修复

1. **远端清单改成「并集合并」而非替换**。远端可能比包内**旧**（改了专家但还没重传 roster），
   直接替换会让包内独有的条目查不到 —— 表现是那位专家被判成「没有云端附件」，附件**永远下载不下来**。
   实测踩到：`finance/vietnam-finance-tax-expert`（**495.6 MB**）在包内清单里有、远端那份是旧的因而没有，
   它的 `agents/` 与 `references/` 一直缺失。
   现在 `mergeRosters(bundled, remote)`：远端同名条目优先（那是新版本），包内独有条目保留（兜底）。
   **所有返回路径都过合并**（含缓存命中 —— 否则插件升级后、缓存 TTL 内，包内新增条目会因
   「缓存还新鲜」而丢失）。
2. **单包体积上限 200 MB → 2 GB**。这是我上一版设错的：roster 里真实存在 495.6 MB 的包，
   200 MB 上限会把它当异常条目**整条拒掉**，同样导致附件拿不到。

### 自检

新增 5 条断言（并集的覆盖/保留/undefined 回退 + 「495 MB 大包必须放行」），541 → **546**。
端到端验证：包内 182 条 ∪ 远端 203 条 = **204 条**，那条 495.6 MB 的条目现在查得到。

### 运维提醒

远端 `agetn/roster.json` 目前比包内**旧**（它是删掉那批内部依赖专家之前上传的：多 22 条孤儿条目、
少 1 条）。并集逻辑已保证不影响使用，要让它干净就重跑一次 `node tools/upload-obs.mjs`。

## [0.4.48] — 未发布

**逐行审查 0.4.47 的远端清单代码，修掉一个会导致「远端故障时频繁打远端」的 bug。**

### 修复

- `refreshRoster` 失败时不更新 `rosterFetchedAt`：首次 `resolveRoster` 失败会标记时间（TTL 内不再试），
  但后台刷新 `refreshRoster` 失败时直接 return、没标记 —— 于是远端故障期间，每次召唤专家都会
  重新触发一次 8 秒超时的远端拉取，一路打到远端。现在无论成败都标记。
- `readCachedRoster` 对齐 `loadRoster`：补上 `packs` 必须是对象的校验（缺 packs 的坏缓存现在返回
  undefined，而不是一份查不到任何附件的空清单）。

### 自检

- 新增 4 条清单缓存断言（往返一致 / 缺 packs / 坏 JSON / 缺 fetchedAt），537 → 541。

## [0.4.47] — 未发布

**远端清单：只更新专家、不动插件，用户也能拿到新版附件。**

### 背景

之前 `roster.json` 只随插件包发布，于是「改专家 → 必须发版 → 用户必须升级」，否则老用户
手上的清单停在旧 sha256、判定 READY、永不刷新。现在清单也放云端 —— `upload-obs.mjs` 早就在传
`agetn/roster.json`，这里补上「运行时优先读远端」这半边。

### 实现

- `lib/fetch-assets.js` 新增 `sanitizeRemoteRoster` / `fetchRemoteRoster` / `readCachedRoster` /
  `writeCachedRoster`。清单来源三级：**磁盘缓存（TTL 12h）→ 远端 → 包内快照**。
- `lib/index.js` 的 `rosterOnce` 改成三级回退 + **TTL 过期后台刷新**（不阻塞召唤）：
  远端拉到新清单就替换，拉不到静默用旧值。
- **安全校验**（远端清单会指挥客户端下载任意 URL，必须过白名单）：
  - `baseUrl` 只能等于包内清单的 `baseUrl`（随 npm 签名包走、可信），包内缺失时退回写死常量；
  - `path` 严格等于 `packs/<分区>/<slug>.tar.gz`（拒 `../`、绝对路径、其它形态）；
  - `sha256` 必须 64 位十六进制；`bytes` 非负整数且 ≤ 200MB；`dirs` 必须是纯目录名（拒斜杠、`..`）；
  - 条目数 ≤ 包内 + 200；roster 本体 ≤ 2MB。
  - 任何一条非法 → 该条跳过 / 整份拒绝 → 回退缓存或包内。

### 效果

| 场景 | 行为 |
|---|---|
| 只更新专家（OBS roster 变了） | 用户下次用（TTL 内缓存、之后后台刷新）自动拿到新版，**不用升级插件** |
| 插件也升级 | 照常 |
| 离线 / OBS 挂了 | 回退缓存 → 包内，不影响使用 |

### 自检

新增 12 条断言（sanitize 各条白名单 + fetchRemoteRoster 合法/非法/异常路径），525 → 537。
实测：真实远端 226ms 拉到 203 条、样本 sha256 与包内一致；缓存往返一致；坏缓存/缺字段均返回 undefined。

## [0.4.46] — 未发布

**修掉「把关」完全失效的 bug，并清掉因此回流名册的 24 个内部依赖专家**（648 → 624）。

### 修复

`scan-internal-deps.py` 的布局判断把「是不是分区目录」放在前面，而它的判据是
`persona.md` —— **那是 T专家导入时生成的，上游 WorkBuddy 包里根本没有**；上游的标志是
`.codebuddy-plugin/plugin.json`。

后果：扫 WorkBuddy 导出目录时**每一层包都被当成「分区」**，产出的 key 变成 `<slug>/skills`
这种形式，而编排脚本按 key 的**末段**取专家名 —— 拿到的是 `skills`、`agents`。
于是 `blocked` 集合里**一个专家都没有，把关形同虚设**。

**实际后果**：0.4.45 那次「完整跑通」的同步，把之前删掉的 24 个内部依赖专家
**原样导回**了名册（`cpq`、`txzhaopin`、`omics-*`、`mi-zhen-expert`、`migraq`…）。

现在判据补上 `.codebuddy-plugin`：扫 447 个包**命中 24 个**，与人工核对过的清单完全一致。

### 清理

名册 **648 → 624**；`source.json` / README（两处）/ npm description / THIRD-PARTY-NOTICES /
许可说明同步校准。

### 教训

**「跑通了」不等于「跑对了」。** 0.4.45 那轮六阶段全绿、同源校验通过、名册数字也合理 ——
但**把关那一环悄无声息地什么都没做**，而且没有任何迹象。

守卫必须能在**失效时自己报警**：这里只要在 `blocked` 为空时打印一句
「⚠️ 本轮没有拦下任何专家 —— 扫描器可能没生效」，这类问题就不会带着满屏绿灯过关。
下次改编排脚本时补上。

## [0.4.44] — 未发布

**加一条守卫：打包产物必须与 `roster.json` 同源** —— 在上传之前就拦下，而不是等远端校验。

### 为什么

排查过程中我手动恢复过一次 `roster.json` 备份（来自那次 722 位的同步），而 `dist/assets/`
是另一轮的产物，**两者对不上**。这个错位一路蒙混到**上传校验阶段**才暴露 —— 那时 tgz
已经传上去了、清单却是旧的，还得再绕一圈（`brand-guardian` 就是这个状态）。

现在编排脚本在**阶段 4 之后、阶段 5 之前**逐个重算 `dist/assets/**/*.tar.gz` 的 sha256，
与 `roster.json` 的记录比对，不一致就**直接退出并给出是哪几个**。实测它拦下了
`marketing/brand-guardian`（`7878732f… ≠ d072a301…`），流程没有继续往下走。

### 教训

**手工修数据要留痕**。我恢复 roster 备份时只想着"把清单救回来"，没意识到它和 `dist/`
已经不同源 —— 而这类不一致不会自曝，只会在最下游以"校验失败"的形式出现，让人误以为是
上传工具的问题。守卫的价值就在这里：**把不变式写成代码，别指望人记住。**

## [0.4.43] — 未发布

**修掉三个让「增量同步」实际不可用的 bug** —— 全量真跑时逐个暴露。

### 修复

1. **`import-workbuddy.py` 的 `--only` 会丢弃判重结果**（最严重）：
   `wanted = [p for p in idx if p in want]` 从**全部候选**重新取，把刚算好的 `dups` 整个覆盖。
   于是**只有走 `--only` 的路径**（正是编排脚本用的那条）判重形同虚设。实测全量同步因此产生
   50+ 组 slug 冲突（`ai-engineer` vs `engineering-ai-engineer`、`ui-designer` vs
   `design-ui-designer`…），两两都变成不可召唤；而不带 `--only` 的干跑却显示「跳过 300 个」——
   这个差异是排查的关键线索。
2. **判重规则漏了「去分区前缀」这一整类**：T专家存量里有一批 slug 带分区前缀
   （`engineering-`、`design-`、`marketing-`…），而 WorkBuddy 收录同一位专家时用的是**不带前缀**
   的名字。现在把存量 slug 归一化后再比。同时**补上目录形态**（原先只收 `.md` 单文件，
   目录形态的专家根本不在比对范围里）。
3. **`upload-obs.mjs` 缺 `--force`**：上传中断过的对象会出现「meta 已写新、内容体还是旧的」，
   而跳过逻辑只比 meta，会把它误判成"已同步"，永远修不好。加了 `--force` 忽略跳过判断。

### 实测数据（判重修复前后，同一批 447 个候选）

| | 修复前 | 修复后 |
|---|---|---|
| 被拦下 | **0** | **404** |
| 实际导入 | 447 | **27** |
| 名册 | 621 → 722（50+ 组冲突）| 621 → **648**（无冲突）|

### 编排脚本 `sync-from-workbuddy.mjs`

- **去掉 `--include-dups`**：那会关掉判重。上一步已把「要更新的」旧包删掉，它们不再同名、
  会正常导入；真正重复的（去前缀后同名 / 同职业名 / 同正文）则被拦下。
- **`--prune` 移到上传成功之后**（反过来就没东西可传），且它重写 `roster.json`，要先护住再恢复。
- 「名册里有没有」**收全两种形态**（单文件 + 目录），只收目录会把几百个单文件专家误报成「新增」。

> **本轮未完成**：完整跑完六阶段还差两处 —— ① 上传中断遗留的坏对象（`brand-guardian`，
> 远端 meta 与内容不一致）；② `dist/assets/` 与 `roster.json` 的**同源性**校验：
> 排查过程中我手动恢复过一次 roster 备份，造成两者不同源，已回滚。
> 下一步先加一条「打包产物与清单必须同源」的守卫，再重跑全量。

## [0.4.42] — 未发布

**用真包把六阶段全跑通了一遍，并修掉途中暴露的四处问题。**

### 修复

- **新增 `--only` / `--limit`**（安全试点开关）：打通流程不可能一上来就动 447 个包。
- **拉取脚本的路径拼错了**：原来用 `join(TOOLS, "..", "..", "..", ".dsh", ...)` 拼出来是
  `~/web/.dsh/...`（错），改用 `$HOME` 常量，并加了「脚本不存在就明确报错」的检查。
- **文档里的 OBS 环境变量名是错的**：写的是 `OBS_AK` / `OBS_SK`，实际要 `OBS_ACCESS_KEY_ID` /
  `OBS_SECRET_ACCESS_KEY`（`upload-obs.mjs` 只认后者，用错会在上传时报「缺少环境变量」）。
- ETag 快照（`tools/.workbuddy-etags.json`）与打包备份（`data/roster.json.bak-before-pack`）不入库 ——
  都是机器相关或用完即弃的状态。

### 实测（拿 `book-co-creator` 真跑一遍）

| 阶段 | 结果 |
|---|---|
| ① 检测 | 447 个包全部可探测，其中 149 个名册里没有、298 个内容变了 |
| ② 拉取 | 495 个文件落到 `~/web/t-team/workbuddy-experts/experts/book-co-creator/` |
| ③ 把关 | 无内部依赖，放行 |
| ④ 导入 | 先删旧包再导；**名册仍 621（无重复）**，包内 6 → **497 个文件** |
| ⑤ 打包 | roster 备份 + 合并（178 → 178），tgz **1.1 MB / 491 文件**，落 `dist/assets/marketing/` |
| ⑥ 上传 | OBS 元数据 sha256 与 roster 一致；**下载回来逐字节校验 491/491 一致** |

> 关键验证点：④ 走的是「删旧包 → 重新导入」——因为 `import-workbuddy.py` 的判重**不认目录形态**。
> 实测名册总数没有变化，证明这条路没有产生重复。

## [0.4.41] — 未发布

**新增增量同步入口 `tools/sync-from-workbuddy.mjs`** —— 配套 `t-expert-roster-sync` 技能（在 `~/aitools/skills/engineering/`）。

### 新增

- `tools/sync-from-workbuddy.mjs`：六阶段编排（检测 / 拉取 / 把关 / 导入 / 打包 / 上传），
  面向**日常维护**（腾讯更新了，同步一次），首次导入仍用 `import-workbuddy.py`。
  - **检测**用 HTTP HEAD 拿 ETag（COS 的 ETag 即内容 MD5）—— 几百个包几秒探完，**不下载**就知道谁变了；
    快照存 `tools/.workbuddy-etags.json`。实测：447 个包全部可探测，其中 **149 个名册里还没有**、
    298 个已有但内容变了。
  - **把关**接 `scan-internal-deps.py`，拦掉绑定腾讯内部系统的专家。这是硬约束 —— 否则下次同步会把
    已清理的同类原样灌回来。
  - **导入**用「更新 = 先删旧包目录，再 `--only` 导入」：`import-workbuddy.py` 的判重只认单文件形态
    （`<分区>/<slug>.md`）、**不认目录形态**，它是给「往空名册里灌」写的，所以不去改那个脚本。
  - **打包**在 `pack-assets.mjs` 前后对 `roster.json` 做**备份与合并** —— 它写的是全量清单，而它按
    「本地还能打包的包」重算，附件早在云端时算出来是空的（0.4.39 那条坑的自动化处理）。
- 支持 `--check`（只报告，不落盘）/ `--dry-run` / `--stage fetch|scan|import|pack|upload`。

## [0.4.40] — 未发布

**新增内部依赖扫描器 `tools/scan-internal-deps.py`** —— 把手工清理时的一次性判定固化成规则。

### 新增

- 判定「这位专家是不是绑定腾讯内部系统」：**算**代码层 API base / MCP URL / 鉴权端点里的
  `*.woa.com` 与内部服务域名；**不算**遥测（`otlp`/`gocp`/`galileo`）、公开服务
  （企业微信 / 腾讯文档 / 问卷 / 埋点 / `cloud.tencent.com`）、注释行。
  支持 `--src` / `--json` / `--exit-code`。

### 修复

- 一个会**静默漏检**的正则 bug：内部服务域名的前缀写成 `+`，而锚定串**自带子域**
  （`omics.qq.com`），`(?:x\.)+` 贪婪吃掉 `omics.` 后剩 `qq.com` 去匹配 → **必然失败**。
  实测 `omics` / `andon` 系列**一个都没抓到**（`woa.com` 侥幸正常，因为前缀与锚定串不重叠）。
- 借此揪出并清掉 2 个更早的漏网专家：`healthcare/mi-zhen-expert`（小于 50 KB 的**本地目录包**，
  上一轮的取样方式没覆盖到）、`engineering/omics-diagnosis-expert`（被上述正则遮蔽）。
  名册 **623 → 621**。
- 教训写进脚本注释：**扫描器必须在已知样本上验证召回率**，否则规则写错会安静地放过该拦的包。

## [0.4.39] — 未发布

**移除 22 位绑定腾讯内部系统的专家** —— 名册 645 → **623**。

### 为什么

从 WorkBuddy 专家市场导入的这批专家里，有一部分**本质上是内部系统的客户端**：脚本把
API 端点指向腾讯内网域名（`*.woa.com`）或内部服务（`pacs.qq.com`、`andon.qq.com`…）。
在腾讯内网之外这些专家**核心功能不可用** —— 用户照着正文操作，只会拿到连接失败。

实测例：`sales/cpq` 的 `bin/cpq --help` 报 `status=-401 code=UNAUTHORIZED`，域名指向
`knot.woa.com` / `cpq.woa.com` / `agent-dashboard.huijin.woa.com`。

### 判定方式（全量扫描 322 个包的代码文件）

- ✅ **算**：代码层作为 API base / MCP URL / 鉴权端点出现的腾讯内网域名
- ❌ **不算**：**遥测** —— `otlp.j.woa.com`、`gocp.woa.com` 是 OpenTelemetry / GalileoTrace
  上报（多份 SDK 内嵌了它），失败不影响功能，曾据此误判过一批
- ❌ **不算**：**公开服务** —— `qyapi.weixin.qq.com`（企业微信）、`doc.weixin.qq.com`（腾讯文档）、
  `wj.qq.com`（问卷）、`beacon.qq.com`（埋点）、`cloud.tencent.com`（文档链接）
- ❌ **不算**：`.md` 里的说明性链接（如安全专家正文里的 `10.0.0.4` 示例数据）

### 移除清单（22）

`hr/txzhaopin` `hr/hr-digital-expert` `hr/career-broker`
`engineering/tiderider-sentiment` `engineering/databrain-opinion-expert` `engineering/wentu`
`engineering/pneumonia-ai-analyst` `engineering/fundus-disease-analysis`
`engineering/omics-{bioinfo,iggm,ori,tfold}-expert`
`research/ab-experiment-analyst` `game-development/databrain-agent-v2` `sales/cpq`
`supply-chain/tencent-cloud-quote-assistant` `support/tencent-cloud-price-expert`
`support/migraq` `support/andon-q-expert` `support/cloud-ops-team`
`design/cloud-requirement-expert` `finance/stock-partner-team`

### 配套

- 新增 **`tools/remove-experts.py`**：按 `<分区>/<slug>` 移除，一次照顾四处（专家包目录、
  中文侧车、`zh/descriptions.json`、云端清单 `roster.json`），支持 `--dry-run` / `--from`。
  文件头写明了一个坑：**别再跑 `pack-assets.mjs`** —— 它按「本地还能打包的包」重算
  `roster.json`，而附件早在云端，会把清单清成空的（本次踩过，已从 git 恢复）。
- 云端清单 200 → **178**；`data/source.json` 计数 645 → 623；README（两处）/ npm description /
  许可说明 / 合规声明（`THIRD-PARTY-NOTICES`，无后缀）同步更新 —— 自检盯着这五处数字必须
  与包内快照一致。
- `sales/cpq` 的附件仍留在 OBS（约 2.8 MB 孤儿对象）。**故意不删**：无害，且万一要恢复还在。

> **已安装的机器**：升级后名册变 623，但**旧的那 22 个专家目录仍会留在
> `~/.t-team/experts/`** —— 播种是「增量补新」，不删旧。清掉的办法：删对应目录，
> 或整体删掉 `~/.t-team` 让宿主重新播种。

## [0.4.38] — 未发布

**带 CLI 的专家：补上「脚本不在 PATH 里」那段说明** —— 实测 `bin/` 脚本时踩到的真实缺口。

### 修复

- 专家包 `bin/` 下的 CLI（cpq、tcloud-price、reason、oagent…）**不在 PATH 里**：
  WorkBuddy 的宿主会把专家包的 `bin/` 挂进 PATH，**DSH 不会**。而人格正文写的是裸命令名
  （「用 `cpq` 命令」「`use_skill inquiry-price`」），模型照做就是 `command not found`。
  2026-09-29 实测：`cpq` 的 `bin/health-check` 报「❌ cpq: 未找到（请检查 bin/ 目录）」，
  五个 CLI 全部报「未找到」。
  现在 `annotatePersona` 在该专家有 `bin/` 时补一段说明：点明 CLI 在哪个目录、要用**绝对路径**调用，
  或先 `export PATH="<包目录>/bin:$PATH"`。23 个带 `bin/`/`scripts/` 的专家都因此受益。
- 那段路径仍是**运行时按机器拼**的（取自 `expert.packDir`），不随包发布 ——
  每个用户看到的是自己机器上的目录，包内一个绝对路径都没有。

### 自检

- 新增 2 条断言：「带 bin/ 的专家会补上说明」「没有 bin/ 的不补（避免噪音）」。项数 523 → 525。

## [0.4.37] — 未发布

**跳过 0.4.36 这个号** —— 它在 npm 上卡在「tarball 已上传、发布未完成」的状态，同名再发报 409。

**内容与 0.4.36 完全相同**，只是版本号 +1（没有代码改动）。

### 说明

- `npm publish 0.4.36` 报 `E409 Cannot publish over previously staged version`：
  npm 的发布分两阶段（先传 tarball、再写 dist-tag），0.4.36 的 tarball 传上去了、
  但发布没走完，于是这个号被占住。`dist-tags.latest` 仍是 0.4.26，说明它**没有真正发布**。
- 本机 npm 是 **10.9.4**，没有 `stage` 子命令（那是 npm 11+ 的），所以那个占位清不掉 ——
  直接换号最省事。

## [0.4.36] — 未发布

**修掉两个挡住 `npm publish` 的问题** —— 附件上云之后第一次真正走发布流程才暴露出来。

### 修复

- **`tools/verify.mjs` 的 `npm pack` 在发布环境里打出空包**：`npm publish --dry-run` 会把 dry-run
  灌进**环境变量**，于是 verify 里再调起的 `npm pack` 也进了 dry-run —— 一个文件都不写，
  自检报「打不出 tgz」、后续断言连环崩（而手动跑 verify 却一切正常，所以一直没暴露）。
  现在显式剥掉继承来的 `npm_config_dry*` / `npm_config_pack_destination`；tgz 名也改成
  **扫目标目录**取，不再从 stdout 最后一行猜（那个格式随环境变，实测在发布环境里取到过非文件名）。
- **`tools/sync-data.mjs --check` 把已上云的附件判成「缺失」**：运行时目录里附件还在、包内快照里
  没有，这是**设计如此**，但检查会因此退 1、把 `prepublishOnly` 整个挡住。
  现在按 `data/roster.json` 跳过这些路径；另外把下载器写的 `.assets.json`（本机运行时状态，
  不是名册内容）加进 JUNK 集，不让它进快照。

### 效果

`npm publish` 现在能完整跑通：**8.5 MB（tgz）/ 21.3 MB 解包 / 2909 个文件**
（附件上云前是 126 MB / 328 MB / 14887 个文件）。

## [0.4.35] — 未发布

**「下载附件」按钮换成 `☁️` 标识** —— 用户口径：既然点选与召唤都会自动下载，按钮是多余的。

### 变更

- **`@` 召唤弹窗**与**插件设置页**：删掉「⬇ 下载附件」按钮，改成纯标识 **`☁️`**（悬停提示
  「配套资源在云端，点选或召唤时会自动下载」）。只在 `assets === "missing"` 时出现，
  下载完成后随名册刷新一起消失。
- 随之删掉两处的下载状态机（`downloading` / `assetsNote` / `assetsError` 与 `downloadAssets`）：
  没有按钮就不需要「下载中／成功／失败」的即时反馈了。真正的兜底仍在 `warmupAssets`
  （点选预热）与 `fetch_expert_assets`（模型侧补救）。
- i18n 收成一条 `assets.cloud`（原 `assets.download` / `.downloading` / `.done` / `.failed` 删除）。

## [0.4.34] — 未发布

**点选即预热** —— 在选择器里点了某位专家，就立刻开始下载它的附件。

### 变更

- **`@` 召唤弹窗**与 **`@` 触发器菜单**：点选专家（往输入框插入 `@专家名`）时，后台同时开始
  拉取它的附件。用户口径（2026-09-29）：「用户既然点了肯定是要使用的」。
  插入引用这个动作**仍然是瞬时的**（`warmupAssets` 不 await），失败也**静默** —— 这只是提前量，
  真正用到时还有召唤时的后台预取与 `fetch_expert_assets` 工具兜底。下完再刷新一次名册，
  UI 上那个「未下载」标记随之消失。
- 在此之前附件只会在**真正召唤**时才开始下载，于是「召唤后专家立刻要读 SKILL.md」会正好撞上
  那几秒空窗。现在把起点提前到了「点选」这一步。

## [0.4.33] — 未发布

**未下载的专家可以一键下载** —— `@` 召唤弹窗与插件设置页都给「附件未下载」的专家加了入口。

### 新增

- **remote 方法 `fetchAssets(slug)`**（host）：两处 UI 的下载按钮走它。幂等 —— 附件已就绪时
  直接返回、**不发网络请求**；附件随包发布的专家返回 `status: "local"`（没有要下载的东西）。
- **名册快照多一个 `assets` 字段**（`local` / `ready` / `missing`）：客户端据此知道哪位专家的
  附件还没下载。代价是每次 snapshot 多 322 次 `.assets.json` 存在性检查，实测可忽略。
- **`@` 召唤弹窗**：未下载的专家在标签行多一个「⬇ 下载附件」，点了当场拉取，完成后刷新名册。
- **插件设置页**：未下载的专家卡片上多一个「下载附件」按钮（官方 `Button`），带下载中禁用态。

### 说明

- 弹窗里那个入口只能用带 `role="button"` 的 `span` —— 整张卡片本身就是一个 `<button>`，
  嵌套真的 `<button>` 是非法 HTML。
- 设置页的下载失败**刻意不复用页面顶部的 `error`**：那个渲染时会被包上「保存失败」的壳，
  附件失败塞进去会显示成「保存失败：附件下载失败：…」，所以单开了一个状态。

## [0.4.32] — 未发布

**附件上云第三步：接进召唤流程** —— 路径改写 + 召唤时后台预取 + `fetch_expert_assets` 工具。

### 新增

- **`fetch_expert_assets(expert)` 工具**（C 路径）：模型需要某位专家的技能或数据文件、而按路径
  读取失败时显式拉取。返回资源根路径与可用目录清单。附件小于阈值（随包发布）的专家直接返回
  `status: "local"`，**不做任何网络请求**；拉取失败时返回 `status: "failed"` 与原因，
  并提示模型「人格仍可用，但不要假装读过那些文件」。

### 变更

- **persona 路径改写**（`annotatePersona`）：目录形态专家的正文里，`skills/xxx/SKILL.md` 这类
  **相对路径**的基准是「当前会话的工作目录」而不是专家包目录 —— 模型照抄去 `Read` **必然落空**。
  实测 645 位里 126 位（20%）的正文引用了资源路径，其中目录形态 115 个（占 322 个包的 36%）；
  也就是说不改写的话，这批专家的技能与数据文件即使下载完整也用不上。
  现在召唤前统一改写成包内绝对路径，并在正文顶部补一段资源说明（含附件未下载时的拉取指引）。
  改写规则刻意收窄：只碰已知附件目录名开头的路径、**只改包内确实存在的那个**（把模型指向不存在
  的文件比不改更糟）、不动 `~/.workbuddy/...` 这类别人的路径（用负向后顾实现 —— 第一版没加，
  实测把 `skills-marketplace/skills/xxx` 里的第二段误改了）。
- **召唤时后台预取**（A 路径）：`summon_t_expert` 返回人格的同时异步拉取该专家的附件，**不 await**
  —— 人格在本地、立即可用，召唤不该被网络拖住；结果只写日志。同一专家被并发召唤时，
  由 `ensureAssets` 的 in-flight 表合并成一次下载。
- `prompt(slug, division)`（面板按需取正文）同样走改写，保证两条读人格的路径行为一致。

### 自检

- 新增 4 条断言：工具数为 4 且名字正确（`fetch_expert_assets`）、路径改写「存在的改成绝对路径、
  不存在的原样保留」、「不动 `~/.workbuddy/...`」、「顶部补上资源目录与拉取工具说明」。
  路径改写的测试用**临时目录构造确定性输入**，不依赖真实名册里某个包的附件是否还在本地。
- 自检项数 519 → 523。

## [0.4.31] — 未发布

**附件上云第二步：下载器** —— 从 OBS 拉取附件、校验 sha256、解包回原位。

### 新增

- `lib/fetch-assets.js`：附件下载器（`loadRoster` / `packInfoFor` / `assetUrl` / `assetsState` /
  `ensureAssets` / `dropAssets`）。
  - **原地解包**：附件回到 `<root>/<分区>/<slug>/` 的原位置，下载前后目录结构完全一致，
    `catalog.js` 的剪枝判断与 `packDir` 语义都不用改。
  - **幂等**：`<packDir>/.assets.json` 记下已解包的 sha256，与清单一致就**不发任何网络请求**。
  - **并发去重**：同一位专家被并发请求（召唤与显式拉取）只会下载一次。
  - **先删旧目录再解包**：避免版本升级后新旧附件混在一起。
- `tools/assets.mjs`：手动命令（本步的验收工具）。
  `status` 看哪些附件已就位；`fetch <slug>` / `fetch --all` 拉取；
  `verify <slug>` 把「OBS 下载后解包的结果」与「本地 tar 解包的结果」逐文件比对 sha256。

### 修复

- **打包非确定性**（`tools/pack-assets.mjs`）：`tar -czf` 会把**当前时间**写进 gzip 头，同一份
  内容两次打包得到两个 sha256 —— 清单里记的那个随即失效、而远端还是旧对象。实测踩过：改完脚本
  重跑一次打包、忘了重传，下载器就报「sha256 不匹配」，而远端对象其实完好。
  现在拆成 `tar -cf` + `gzip -n`（不写时间戳），已实测两次打包结果一致。
- **上传流程加固**（`tools/upload-obs.mjs`）：上传完成后**自动把远端对象下载回来重算 sha256**，
  不一致即非零退出并明确提示「先别 prune」；新增 `--no-verify` 可跳过。
  因为「清单与远端脱节」这种状态在本地看起来完全正常（`--prune` 照跑），只有真的去下载才会暴露。
- `lib/fetch-assets.js` 纳入 `tsconfig.json` 的 `include`，并修掉三处 JSDoc 写法问题
  （`@param options.x` 缺 `@param {object} options` 前缀，tsc 报 TS8032）。自研 host 文件一旦带
  `// @ts-check` 就必须在 include 里列名，否则那个标记是**死的** —— 自检 [20] 盯着这条不变量。

### 说明

- 仍然**没有接进召唤流程**：第 3 步（召唤时后台预取 + `fetch_expert_assets` 工具 +
  persona 路径改写）随后单独提交。本版可用 `node tools/assets.mjs fetch <slug>` 手动拉取。

## [0.4.30] — 未发布

**附件上云第一步：打包 → 上传 OBS → 瘦身本地** —— `data/experts` 从 342 MB 降到 **23 MB**。

### 新增

- `tools/pack-assets.mjs`：把专家包里**超过阈值**（默认 50 KB）的附件打成
  `dist/assets/<分区>/<slug>.tar.gz`，并生成 `data/roster.json`（路径 / 字节数 / sha256 /
  内含目录清单）。开关：`--dry-run` / `--threshold 200KB` / `--prune`（删本地已上传的附件）。
- `tools/upload-obs.mjs`：上传到华为云 OBS 公共读桶。用 OBS v2 签名，凭据**只从环境变量读**
  （`OBS_ACCESS_KEY_ID` / `OBS_SECRET_ACCESS_KEY`，不落盘、不进包），每个对象带
  `x-obs-meta-sha256` 元数据；开关：`--dry-run` / `--only <slug>` / `--verify`
  （把远端对象下载回来重算 sha256）。
- `data/roster.json`：云端分发清单，**随包发布**（已加入 `package.json` 的 `files` 白名单
  与自检的 data 根层白名单）。

### 变更

- `data/experts` **342 MB → 23 MB**：200 个包的附件（原 292.3 MB）移到 OBS，压缩后
  **115.8 MB / 201 个对象**（含清单本身）；122 个附件不足 50 KB 的小包原样留在本地。
- **`.codebuddy-plugin/` 绝不上云**：它是 `lib/catalog.js` 判定「目录形态专家包」的标志
  （`isExpertPack` 要求 `plugin.json` 与 `persona.md` **同时**存在），挪走会让专家从名册里直接消失。

### 修复

- **提示段把名册规模数成了 `.md` 总数**：`rosterScale()` 递归数 `data/experts` 下所有 `.md`，
  把附件里的 agents 提示词、skills 下的 SKILL.md 也算成专家 —— 645 位被显示成 **6838** 位。
  此前包内快照与运行时目录都有完整附件、**两边错得一模一样**，而自检断言比的正是「两者相等」，
  所以一路绿灯；附件上云、包内快照瘦身后两边口径分叉，问题才暴露出来。
  现在口径统一交给新增的 `catalog.countExperts()`（同步版，与 `walkMarkdown` 的剪枝规则一致），
  自检也改用同一函数取值，不再两边各数一遍。

### 说明

- **本版只做了上传，还没有下载器**：附件此刻不在本地，运行时读不到专家的技能与数据文件。
  第 2 步（`lib/fetch-assets.js` 下载器）与第 3 步（召唤时后台预取 + `fetch_expert_assets`
  工具 + persona 路径改写）随后单独提交。

## [0.4.29] — 未发布

**修复：名册新增的专家进不了 `@` 菜单** —— 面板显示 645 位、`@` 弹窗却只有 323 位。

### 修复

- `seedDefaultEnabled()` 原本只看「策略版本号有没有追上」，追上就再也不播种。于是名册从 323 扩到
  645 之后，老用户（`enabledSeedVersion` 早已是 1）那 322 位新专家**永远进不了启用名单**：
  面板的 645 是名册总数、不受影响，而 `@` 菜单只列「已启用」的，于是只显示 323。
  现在改为按**名册基线**（新增字段 `enabledSeedRoster`）做增量 —— 只把名册里新出现的补进
  `enabled`，用户自己停用过的（已在基线里）不会被重新打开；名册没变化时什么都不写。
  基线缺席的老数据以现有 `enabled` 当基线：于是「从未播种」= 整份名册都算新增（全启用），
  「老用户升级」= 只有新导入的那批算新增。这比单纯把版本号 +1 精确 —— 后者会把用户手动停用的
  专家一并重新打开。
- `tools/verify.mjs`：设置 mock 支持 `enabledSeedRoster`，并新增断言「名册新增的专家自动补入
  启用名单（用户自己的启停不受影响）」。自检项数 518 → 519。

## [0.4.28] — 未发布

**清理 13 个「换了名字重复收录」的影子专家** —— 名册 658 → 645。

### 修复

- 上一版导入 WorkBuddy 专家时，`tools/import-workbuddy.py` 只按 slug 与**职业名**判重，
  漏掉了 13 个「职业名不同、正文却与 T专家 现存专家一字不差」的包（例如
  `design/sprint-priority-manager` 与 `product/product-sprint-prioritizer.md`）。
  它们会让面板出现内容相同的影子专家。现在导入器增加了**正文哈希**兜底判重
  （去掉 frontmatter、抹平空白后比对），这 13 个已清除，并保证以后重跑也不会再进来。

### 变更

- 名册 658 → **645** 位（323 单文件形态 + 322 目录形态专家包）。
- README、npm description、THIRD-PARTY-NOTICES、vendor 许可说明与 `tools/verify.mjs`
  的断言/计数同步到 645。

## [0.4.27] — 未发布

**名册扩到 658 位：接入 WorkBuddy 专家市场（含完整专家包形态）** —— 用户口径：「把 WorkBuddy 专家整合到 T专家」。

### 新增

- **目录形态专家包**：名册除 `<分区>/<slug>.md` 单文件外，新增支持 `<分区>/<slug>/` 目录形态 ——
  以包内 `persona.md` 为名册入口，原始 `agents/`、`skills/`、`references/`、`Databases/` 等附件
  原样保留。识别标志是 `.codebuddy-plugin/plugin.json` 与 `persona.md` 同时存在。
- `tools/import-workbuddy.py`：WorkBuddy 专家导入脚本。含分区映射（复用现有 22 个分区、不新建分类）、
  多角色团队合成单份 persona、同 slug / 同职业去重（保留 updatedAt 较新者）、打包者本机路径清洗。

### 变更

- 名册从 323 位扩到 **658 位**（323 单文件 + 335 目录形态），分类数不变（22 个）。
- `lib/catalog.js`：`walkMarkdown` 遇到专家包时**剪枝**（不再递归进包内 —— 否则包内
  `skills/**/SKILL.md`、`references/*.md` 会被当成一堆独立专家扫进名册）；`ingest` 参数化以同时
  支持两种形态；`discoverDivisions` 识别「只含专家包」的分区；专家条目新增 `packDir` 字段。
- `tools/sync-data.mjs`：专家计数改为「单文件 + 专家包」两种形态，不再数所有 `.md`。
- 发布包体积从 ~12MB 涨到 **126MB**（tgz）/ 328MB（解包），随包分发 14887 个文件。

### 修复

- `tools/verify.mjs`：`spawnSync("npm", ["pack", …])` 的 `maxBuffer` 从默认 1MB 提到 64MB ——
  包内文件数近 1.5 万后，npm 的 tarball 清单（走 stderr）超过 1MB，进程被 SIGTERM，
  表现为「打不出 tgz」而实际打包是成功的。
- 导入时清洗 WorkBuddy 官方包内残留的打包者本机绝对路径（`/Users/...`，实测 100 处），
  否则会随包发布泄露他人信息。

### 说明

- WorkBuddy 专家的版权与许可归腾讯及其各自的专家作者所有。本插件只做本地聚合与形态转换，
  已在 `THIRD-PARTY-NOTICES` 与 `vendor/third-party-licenses/README.md` 中声明。

## [0.4.26] — 未发布

**放大头像 emoji、并让淡色底看得见** —— 用户口径：「给这些图标加一个淡淡的背景，现在 emoji 都很小，
看着很不协调」。

### 变更

- emoji 字号 **22 → 26px**（44px 的圆里更饱满，上下各留 9px）。
- 专家的淡色圆底 alpha **14% → 24%**（`color-mix`）：14% 铺在白卡片上几乎看不出圆 ——
  圆没边、里面又是个小 emoji，整体就显得飘。
- 没有 `color` 时的兜底底色从近白的 `--dsw-alias-bg-layer-3` 换成淡灰的
  `--dsw-alias-interactive-bg-hover`（老数据、或颜色名在宿主上不被支持时，也还看得见一个圆）；
  技能卡的 🧰 本来就用这档淡灰，两边因此是同一套观感。

### 自检

- 同一条断言改写：`tintOf` 的 alpha 24%、头像字号 26px，并加了一条否定条件 ——
  兜底底色不许再回到 `bg-layer-3`（那正是"看不见圆"的老写法）。
- typecheck / check-client（13 个文件 0 处未定义标识符）/ render-smoke（9/9）/
  verify（**518/518**）全绿。

## [0.4.25] — 未发布

**面板改成不透明实色、去掉毛玻璃** —— 用户口径：在「保持官方材质 / 改不透明实色 / 缩小模糊半径」
三选一里选了 **B**。

### 变更

- `.t-team-pop-official`（官方 `MenuSurface` 那条路径）与 `.t-team-pop`（缺官方件时的兜底）都改成
  **实色 `--dsw-alias-bg-layer-3`**，两条规则里的 `backdrop-filter` 全部拿掉。
- **只换父级底色不够**：官方材质层是 `MenuSurface` 内部那个 `aria-hidden` 的绝对定位兄弟
  （`inset:0` 铺满，`background` 与 `backdrop-filter` 都挂在它身上），所以补了一条
  `.t-team-pop-official > [aria-hidden="true"]{display:none}` 把它关掉 —— 否则它照样在跑 `blur(40px)`。
- 这是面板上**仅剩的大合成开销**：面板内容是实心卡片，本来也不需要透出背后内容。代价是失去
  「与官方菜单同款毛玻璃」的观感（最初「材质交给官方」时就明说过这条代价）。
- 顺带更新 css.js 里「用 `--dsw-specific-menu` 填色就必须配 `backdrop-filter`」那条历史注释：
  规矩仍适用于别处还在用菜单材质的地方（如 `.t-team-expert-pick-panel`），但面板自己不再走这条路。

### 自检

- 改写 1 条断言（官方材质那条从「清掉自绘材质」改成「铺实色 + 关掉官方材质层」），新增 1 条：
  **两条容器规则里都不许再有真的 `backdrop-filter`**（允许 `backdrop-filter:none`）。
- typecheck / check-client（13 个文件 0 处未定义标识符）/ render-smoke（9/9）/
  verify（**518/518**，`ci.yml` 同步）全绿。

## [0.4.24] — 未发布

**回到系统 emoji 头像** —— 用户口径：「还是采用系统 emoji，（太）卡了」。

### 回退

- 撤销 0.4.23 的 Fluent Emoji 方案（`git revert 5731cbb`）：删掉内联的 22 枚 SVG
  （`src/client/fluent-icons.jsx`）、`DivisionIcon`、`.t-team-div-icon`，连同它们的许可声明与自检断言。
  头像回到 **专家自己的 emoji + 名册 `color` 的淡色圆底**（0.4.21 / 0.4.22 那一版），
  回退链简化为 emoji → 🧩。
- **为什么卡**（回退时的分析）：那 22 枚是 Fluent 的 **Color** 档，每枚 5–27 KB，内含大量
  `feGaussianBlur` / `feColorMatrix` 复合滤镜与渐变；它们以 data URI 形式各是一份**独立 SVG 文档**，
  每张卡片一个 `<img>` —— 浏览器要逐张解析 XML、解码并光栅化，还叠在面板已有的
  `backdrop-filter` 毛玻璃上。系统 emoji 是**字体字形**，走字体缓存、几乎零成本；
  这也是「换上去就卡、换回来就好」的直接原因。客户端产物同时从 1.29 MB 回到约 950 KB。
- **保留** `tools/sync-fluent-icons.mjs`（22 枚的映射表与上游 sha256 都在里面）：将来若想要
  统一插画风，跑一次就能重新生成；脚本头部已注明「当前未启用」与原因。

### 自检

- 随回退一并还原：断言数 519 → **517**（`ci.yml` 同步），`[13b]` 的随包许可清单不再列 Fluent。
- typecheck / check-client（13 个文件 0 处未定义标识符）/ render-smoke（9/9）/
  verify（**517/517**）全绿。

## [0.4.22] — 未发布

**补上「颜色名」形态的色底** —— 0.4.21 的淡色圆底只认 `#RRGGBB`，而名册里 308 位专家有 **182 位**
写的是 CSS 颜色名（`blue` / `teal` / `navy` / `gold`…），这些人的头像当时会退回中性灰底。

### 修复

- `tintOf` 改用 `color-mix(in srgb, <color> 14%, transparent)`：hex 与颜色名两种写法都吃，
  也不用自己算 rgba（颜色名后面拼 alpha 后缀是无效值，整条声明会被丢掉）。
  只放行「#RRGGBB 或纯字母颜色名」两种形态。
- 老宿主不支持 `color-mix` 时该声明失效，退回 CSS 的中性底色（不影响布局，只是少了那个性色）。

### 自检

- 断言补上颜色名那条正则与 `color-mix` 写法 —— 原来钉的是 `${value}24`，那正是 0.4.21 漏掉
  颜色名的原因：断言把实现钉死在了 hex 上。
- typecheck / check-client / render-smoke 9/9 / verify（**517/517**）全绿。

## [0.4.21] — 未发布

**卡片头像改回彩色 emoji（配专家专属色底）** —— 用户口径：「有没有更好的图标库，最好带颜色的」。

### 变更

- 头像内容**优先用专家自己的 emoji**：系统 emoji 本身就是彩色的，而且名册里 323 位专家各自带一个
  （跟分区无关、每人不同），配上名册 `color` 压出的淡色圆底，正是参考图那种「淡色圆 + 彩色图形」。
  0.4.20 换上的官方线性图标退居**回退位**：没有 emoji 的老数据才用它，最后兜 🧩。
- 技能卡头像从官方 `Skill` 图标换回彩色 emoji 🧰（技能没有 color，保留固定灰底）。
- 淡色底 alpha 12%→14%（`1f`→`24`）：里面放的是彩色图形，底色要再显一点才看得出圆。
- emoji 字号 20→22px（44px 的圆里更饱满）。顺带删掉不再使用的 `SKILL_ICON` 导出。

### 彩色图标库调研（都是第一手许可文件核过的）

| 库 | 许可 | 单枚体积（实测） | 风格 |
|---|---|---|---|
| **Fluent Emoji — Flat** | MIT | **1–3 KB** | 扁平彩色（推荐，22 枚约 30–50KB） |
| Fluent Emoji — Color | MIT | 5–22 KB | 微软 3D 感插画（22 枚约 200–350KB） |
| Twemoji | 图形 CC-BY 4.0（需署名） | 1–3 KB | 扁平 |
| OpenMoji | CC BY-SA 4.0 | — | ShareAlike 对插件许可有传染性，不建议 |
| DiceBear | MIT | — | 生成式头像，但 323 位要生成/内联 323 张，太重 |

本轮先落地**零依赖那一条**（专家自带 emoji）。要统一插画风的话，下一步可把 Fluent Emoji 的
22 枚按分区内联（Flat 约 30–50KB / Color 约 200–350KB，MIT，加一条 THIRD-PARTY-NOTICES）——
预览图已给用户看过，等他定。

### 自检

- 更新 2 条断言：头像改为「emoji 优先 + 回退分区图标 → 🧩」（含 22px 字号与 `24` alpha），
  技能卡改为「彩色 emoji + 固定灰底」；图标替身数量断言 23 → 22（`SKILL_ICON` 已删）。
- typecheck / check-client（13 个文件 0 处未定义标识符）/ render-smoke（9/9）/
  verify（**517/517**）全绿。

## [0.4.20] — 未发布

**专家卡照新参考图重做（官方图标头像 + 大名字 + 底部标签），并修掉「名称不在左边」** ——
用户口径：「对话框 t 专家弹窗里面的卡片都设计成这种风格，名称都靠左，更换图标，网上找找有没有精美点的图标」。

### 新增

- **头像换成官方图标**：22 个分区各配一个宿主自带的官方产品图标（`Icon*OutlineMedium`），
  技能卡固定用官方 `Skill` 图标；底色用名册 frontmatter 里的 `color` 压一层 12% 的淡色圆、
  图标本身用同色实色 —— 就是参考图那种「淡色圆 + 同色图形」。
  逐级回退：分区图标 → 专家自己的 emoji → 🧩（宿主换图标命名也不会空着）。
  为什么不去外链图标库：宿主 `primitives` 的 280 个导出里本来就有一百多个 `Icon*`
  （用它们等于跟官方同一套视觉语言，本插件一贯的口径）；引 CDN 在离线/内网会白给；
  第三方库（Lucide / Tabler / Phosphor）内联几十 KB 虽然可行，但要连带许可署名与后续升级，
  收益只是「换一套线性风格」。真要换我再动。
- **底部标签行**（参考图里那排胶囊）：专家卡放「分区 [+ 自建]」、技能卡放「技能 [+ 仅用户]」；
  「仅用户」从副标题挪到这里，不再两处重复。
- 尺寸照参考图再放大一轮：圆角 12→16、头像与头部 40→44、名称 14→15、底高 114→146
  （14+44+8+36+8+20+14+2），`contain-intrinsic-size` 同步到 146px。

### 修复

- **「名称都靠左」是一处真 bug，不是排版口味**：`.t-team-pop-head` 这个名字同时被**面板标题行**
  （顶栏「T专家 + 关闭」）用着，而那条规则带 `justify-content:space-between` —— 于是卡片里的
  「头像 + 名称」被推成两端对齐，名称跑到右边去了。现在用 `.t-team-pop-item .t-team-pop-head`
  这条更高特异性的规则把它掰回 `flex-start`。断言把两件事同时钉住：卡片头必须覆盖它，
  而面板标题行那条 `space-between` 也必须在（那才是顶栏该有的样子）。

### 自检

- 更新 3 条（头像 40→44、卡片 114→146、底部标签"回来"了所以那条否定断言改为"带标签但不带召唤按钮"）；
  新增 5 条：图标 + `color` 淡色底与逐级回退、技能卡头像、名称靠左的修正、底部标签内容、
  **替身补齐全部 23 个官方图标**（缺一个，那个分区就会静默走 emoji，「图标能渲染」这条等于没覆盖）。
- typecheck / check-client（13 个文件 0 处未定义标识符）/ render-smoke（9/9）/
  verify（**517/517**，`ci.yml` 计数同步）全绿。
- 又双叒踩了一次 CSS 模板的裸反引号（这次是在注释里写 `justify-content:…`），
  `check-client-refs` 报出行号、esbuild 直接报 `Expected ";" but found "justify"` —— 已改。

## [0.4.19] — 未发布

**箭头圆改成实色、并且真正是正圆** —— 用户口径：「为什么是半透明的？还有要正圆」。

### 修复

- **半透明的来源是圆自己，不是面板**：上一版底色用了 `--dsw-alias-interactive-bg-hover`，
  这个 token 本身就是 alpha 色（fallback `#0000000d`，约 5% 黑）—— 叠在半透明的官方菜单材质上，
  整个圆都透出底下的内容。现在换成**实色**的 `--dsw-alias-bg-layer-3`（fallback `#f7f8fa`）。
- **正圆两处**：
  · 分类标签与圆**同高 32px**（原先标签 30px、圆 32px）。圆是绝对定位、不参与布局，行高由标签决定
    —— 两者不等时圆会上下各溢出一部分到行外，看着就是个「被切过的圆」；
  · 垂直居中去掉 `top:50% + translateY(-50%)`，改成 `top:0;bottom:0;margin:auto 0`：半像素高度下
    `translateY` 会把圆落在 .5px 上、边缘被重采样，这是「看着不圆」的另一个原因。

### 说明（面板本身的半透明）

如果问的是**整块弹窗**透出下面内容：那是官方菜单材质（`--dsw-menu-surface-fill` 是半透明色
+ `backdrop-filter: blur(40px)`），属于上一轮「材质交给官方 `MenuSurface`」的既定行为，与这次的圆无关。
要改成不透明实色完全可行（在 `.t-team-pop-official` 上覆盖背景并去掉 backdrop-filter），
代价是观感与官方菜单不再一致、也会失去 macOS 下的 vibrancy 底层 —— 这一条等确认后再动。

### 自检

- 「箭头」那条断言重写为钉住这次的两件事：底色必须是 `bg-layer-3`（并加了一条**否定**条件：
  圆底色不许再出现 `interactive-bg-hover`），垂直居中必须是 `top:0;bottom:0;margin:auto 0`
  且规则里不许出现 `translateY`；同一断言里再钉住标签与圆同高（`height:32px`）。
- typecheck / check-client（13 个文件 0 处未定义标识符）/ render-smoke（9/9）/
  verify（**512/512**）全绿。

## [0.4.18] — 未发布

**分类行两端的箭头照参考图放大成实心圆** —— 用户口径：「这种圆形风格行吗，再大一点点」
（附参考图：浅灰实心圆 + 深灰箭头，没有明显描边）。

### 变更

- 直径 **26px → 32px**，箭头字号 **15px → 18px**（参考图里箭头约占圆的 40%）。
- 底色 `--dsw-alias-bg-layer-2` → `--dsw-alias-interactive-bg-hover`：参考图里那层灰比底板明显深，
  而 `layer-2` 铺在半透明菜单材质上几乎融进背景 —— 这其实是上一轮「看着不明显」的另一半原因
  （不只是没有边线）。
- 描边随之**收淡**：`border-l2` → `border-l1`（保留一条收边、不再抢眼），hover 时回到 `border-l2`
  并把箭头颜色提到 `label-primary`。
- 让位内边距 **32px → 38px**（= 直径 32 + 6px 间隙）：箭头是绝对定位的浮层元素、不占布局高度，
  这条 padding 是唯一能把它压住的最后一个标签让出来的手段，尺寸一变它必须跟着变。

### 自检

- 「对齐」那条断言里的让位值同步改成 38px；「箭头」那条断言重写为钉住参考图的四件：
  `box-sizing:border-box` + `width/height:32px`、`border:1px solid var(--dsw-alias-border-l1)`、
  `background:var(--dsw-alias-interactive-bg-hover…)`、`font-size:18px`，以及 hover 收边到 `border-l2`。
- typecheck / check-client（13 个文件 0 处未定义标识符）/ render-smoke（9/9）/
  verify（**512/512**）全绿。

## [0.4.17] — 未发布

**分类行两端的箭头加上描边** —— 用户口径：「左右滚动的图标 < > 最好添加一个表边线，现在看着不明显」。

### 修复

- `.t-team-div-scroll` 原先 `border:0` + 只有一层浅灰底：它浮在半透明的官方菜单材质上，圆的边界
  与底板糊在一起，看着像一个"没画完"的灰点。现在改成与卡片同一套描边 —— `1px solid
  var(--dsw-alias-border-l2)`（浅色下约 10% 黑），hover 时加深到 `border-l3`
  （与 `.t-team-pop-item:hover` 同一档）。
- 加描边必须同时补 `box-sizing:border-box`：这个圆是 `width/height:26px` 且原本没有
  `box-sizing`，边框会把外径撑到 28px、把分类行的高度顶起来 —— 分类行的高度直接决定面板高度上限。

### 自检

- 新增 1 条断言钉住这两点：`.t-team-div-scroll` 规则里必须同时有 `box-sizing:border-box` 与
  `border:1px solid var(--dsw-alias-border-l2)`，且 hover 规则要加深到 `border-l3`。
- typecheck / check-client（13 个文件 0 处未定义标识符）/ render-smoke（9/9）/
  verify（**512/512**，`ci.yml` 计数同步到 512）全绿。
- 又踩了一次 CSS 模板的裸反引号（这次是把 `border:0` 括进了反引号里），`check-client-refs` 立刻报出行号。

## [0.4.16] — 未发布

**分类行支持鼠标滚轮左右滚；顺手治了「弹窗有点卡」** —— 用户口径：「分类这一行要支持鼠标滚轮滚动，
就是分类可以左右滚动，还有我感觉弹窗页面有点卡，也分析检查下」。

### 新增

- 分类行支持**鼠标滚轮左右滚**（触控板横滑也认，`deltaX` 优先）。用**原生**
  `addEventListener("wheel", …, { passive: false })` 而不是 React 的 `onWheel`：React 17 起 wheel 是
  passive 委托，回调里 `preventDefault()` 不生效（还会在控制台告警），纵向滚轮会在滚完分类行之后
  继续滚下面的列表。现在只在**真的还能往那个方向滚**时才拦，滚到两端就放手 —— 滚轮自然回到列表上，
  不会「卡住不动」。
- 分类行去掉了 `scroll-behavior:smooth`：滚轮要的是「转多少走多少」的跟手，平滑只留给那两颗箭头按钮
  （它们各自传 `scrollBy({ behavior: "smooth" })`）。

### 性能（「弹窗有点卡」的四处收紧）

先说清**卡在哪**，按影响从大到小（每一条都能在代码里指到位置）：

1. **浮层位置每帧 setState，把 300 多张卡片整棵树重新 diff 一遍**（最大的一条）。官方
   `useAnchoredPosition` 每次重算都是 `setPosition({ left, top })` —— **新对象**，React 必然重渲染
   拥有这个 state 的组件；而这个 state 原先住在 `SummonButton` 里。更糟的是它监听 `scroll`（捕获阶段），
   **列表自己滚动也算** —— 「在专家列表里滚一下」于是等于每帧重渲染整棵面板。两处收紧：
   ① `ui.jsx` 新增 `FloatingPop` 组件把外壳（定位 / 材质 / 关闭）收进去，位置变化只重渲染它，
   而 `children` 是父级传进来的**同一个 element 引用**，React 直接跳过它的子树（同引用 bailout）；
   ② 本插件自己的几何重算跳过「浮层内部滚动」（`panelRef.current.contains(event.target)` 就 return）。
2. **派生数据每个 state 变化都重算**：`experts` 过滤、分类表、`visible`、`grouped`、`visibleSkills`
   原先都写在渲染函数体里 —— 浮层位置、分类行溢出标记这类完全无关的 state 也会把 300+ 项重新过滤、
   重新分组。现在六处全部 `useMemo`，依赖写清楚。
3. **搜索串每次输入都重拼**：`matchExpert` 原本每次调用都把五项字段拼起来再 `toLowerCase()`，
   323 项 × 每敲一个字符 = 上千次字符串拼接。改成按对象缓存的 `WeakMap`（名册刷新后旧对象自动回收）。
   本机量化（临时基准 `/tmp/panel-bench.mjs`，323 项 × 200 轮 = 6.46 万次匹配）：
   **旧 37.1 ms → 新 5.5 ms（约 6.7×）**。
4. **首屏把 323 张卡片全画出来**：面板一打开就是 323 张卡片 / 2621 个元素 / 191 KB HTML
   （`renderToString` 中位数 6.2 ms；浏览器还要建真实 DOM、跑 grid 布局、合成毛玻璃，量级更高）。
   等高卡片（114px，见卡片那段的说明）正好适合 `content-visibility:auto`
   + `contain-intrinsic-size:auto 114px`：屏幕外的卡片跳过样式 / 布局 / 绘制，真正要画的是可视区那十几张。

**仍可能让人觉得"卡"、这次刻意没动的**：官方菜单材质 `backdrop-filter: blur(40px)` 铺满整块面板，
大面积毛玻璃合成本身就贵（这是"与官方观感一致"的代价）；面板也没有上真正的虚拟列表
（`content-visibility` 是低风险的等效手段）。如果实机还是卡，下一步的候选是：材质降级为不透明底色、
或给列表上虚拟滚动 —— 都等你实机感受后再定。

### 自检

- 新增 7 条断言：滚轮横向滚（原生非 passive + 两端放手）、滚轮跟手 / 箭头平滑（分类行不许再写
  `scroll-behavior`）、`FloatingPop` 收口（且父级不许写成 `{open && <FloatingPop`）、内部滚动不重算几何、
  六处 `useMemo`、卡片 `content-visibility`、`matchExpert` 的 `WeakMap` 缓存。
- typecheck / check-client（13 个文件 0 处未定义标识符）/ render-smoke（9/9）/
  verify（**511/511**，`ci.yml` 计数同步到 511）全绿。

## [0.4.15] — 未发布

**分类行两端都能滚** —— 用户口径：「点更多分类按钮后，左边也应该有这个按钮，这样用户才能回到左侧」。

### 修复

- 分类行原来只有右端的圆形箭头，滚到中间之后**没有任何回到左侧的入口**（只能手动横向拖）。
  现在左侧会出现一个同款的 `‹`：
  · 左端在「已经滚过去了」时出现（`scrollLeft > 1`），右端在「右边还有没露出来的」时出现
    （`scrollLeft + clientWidth < scrollWidth - 1`），滚到两端时对应的箭头自己消失；
  · 两个方向各滚一屏的 80%（左为负、右为正），带 `behavior:"smooth"`；
  · 两个箭头都是 26px 圆形、各贴一侧（`.t-team-div-scroll[data-dir="prev"|"next"]`）。
- 给箭头让位的内边距**只在那一侧的箭头真的出现时才加**（`.t-team-divbar[data-back="true"]` /
  `[data-more="true"]`）：没滚动时左侧不加 `padding-left`，第一个标签仍与搜索框左边缘对齐 ——
  上一轮用户点的那条「对齐宽度」不受影响。

### 自检

- 「对齐」那条断言补上左侧让位规则；「溢出」那条扩成两端：两个 `data-dir` 规则、两个方向的滚动量
  （一正一负）、`setDivBack(node.scrollLeft > 1)` 与 `setDivMore(...)` 都在；文案断言补 `pop.divisionsPrev`。
- typecheck / check-client（13 个文件 0 处未定义标识符）/ render-smoke（9/9）/ verify（**504/504**）全绿。
- 顺手记一笔：这条断言的标签里第一次误用了英文双引号，把 JS 字符串截断了 —— 本仓库中文文案一律用「」。

## [0.4.14] — 未发布

**输入区面板的搜索框下面加一行分类标签** —— 用户口径：「对话框的 T专家 弹窗在搜索框下面增加一行
分类标签，注意对齐宽度」（附了一张分类标签行的参考图：圆角标签、选中项浅灰底、右端一个圆形箭头）。

### 新增

- 专家标签页的搜索框下方新增**分类筛选行**：第一项「全部」，后面依次是名册里出现过的分区
  （学术、公司经营、设计、工程、金融… 就是列表里那些分组标题，随界面语言显示中文或英文名）。
  点一个只看那一类；与搜索词**叠加**生效（选了分类还能继续搜），切换时列表回到顶部。
- 选项**从名册现算**并保持首次出现的顺序，与下面列表里分组标题的顺序、文案完全一致
  （列表本来就按 `snap.experts` 的顺序分组）；不学设置页那样按 slug 排序，免得同一屏里两处顺序对不上。
  名册还没到、或一位专家都没有时不渲染这一行。
- **横向滚动**：22 个分区在一屏里放不下（浮层宽度跟输入框走），所以这一行横向滚动、隐藏滚动条，
  并在溢出时于右端露出一个圆形箭头按钮（点一下滚一屏的 80%）。箭头挂在行外层 `.t-team-divbar` 上
  而不是滚动容器里 —— 滚动容器的绝对定位子元素会跟着内容一起滚走。
- 只在**专家**标签里出现：技能没有分类概念，技能页保持原样。

### 对齐宽度（用户特别点的那句）

- 这一行与搜索框、下面的卡片对齐靠的是**结构**而不是数值：它就是 `.t-team-pop` 的直接子元素，
  和别的行一样吃 `> *:not([aria-hidden])` 的 10px 右内边距，左边同样由容器自己的 `padding-left` 提供。
  所以这一行（以及里面两个容器）都**不许**写左右内边距 —— 写下就会比搜索框窄一截或偏一截。
  唯一允许的一处 padding 是给右端箭头让位的 `padding-right:32px`，且它挂在 `[data-more="true"]` 上，
  没溢出时根本不生效。
- 自检里把这两件事都钉住了：三处选择器的**精确**写法（`.t-team-divbar{…min-width:0}` /
  `.t-team-pop-divs{…overflow-x:auto` / 那条 `> *:not([aria-hidden])` 规则），
  以及"唯一那条 data-more 上的 padding"。

### 自检

- 新增 5 条断言：分类行在搜索框下面且只在专家标签、选项从名册现算（「全部」+ 分区 + 叠加筛选）、
  对齐宽度（上面那组精确写法）、溢出处理（横向滚动 + 箭头在 bar 上 + 点击滚动量）、
  两种语言的文案都在且被字面量引用。
- typecheck / check-client（13 个文件 0 处未定义标识符）/ render-smoke（9/9）/
  verify（**504/504**，`ci.yml` 计数同步到 504）全绿。中途又踩了一次 CSS 模板的裸反引号
  （注释里写「> *」时手滑加成反引号），`check-client-refs` 立刻报出行号。

## [0.4.13] — 未发布

**输入区「T专家」面板的外壳改用官方 primitives** —— 用户口径：这个弹窗要拉齐官方。
定位与跟随、视口钳制、外部点击关闭、菜单材质四件事交回官方；官方**没有**的那几件仍由本插件负责。

### 变更

- 外壳（`ui.jsx` 新增 `useFloatingShell` / `PopSurface`）走官方三件：
  · `useAnchoredPosition` —— 坐标与跟随（`scroll` 捕获 / `resize` / 面板自身 `ResizeObserver`）；
  · `useDismissOnOutsidePointer` —— `pointerdown` 落在浮层外就关（顺带覆盖触屏与笔）；
  · `MenuSurface` —— 菜单材质，外加 macOS 下给 Chromium 用的 vibrancy 底层。
  为什么只换外壳、不整块照搬官方：官方 primitives 里**没有浮层组件**，只有 hooks 与材质容器，
  官方自己也按需组合 —— `dsh-client-ui-conversation` 的 ContextMeter 是
  `useAnchoredPosition`（`side` 写死 `"top"`）+ `useDismissOnOutsidePointer` + **手写 Escape**；
  `dsh-client-ui-input-trigger` 的 `/` 菜单则把位置交给布局，只用 `useAnchoredMaxHeight` 钳高度。
- **翻转、宽度、高度上限、Escape 四件仍由本插件负责**，逐条都有理由（都对着上游源码核过）：
  · **翻转**：官方 `side` 是静态入参，全部 4 个 `useAnchoredPosition` 调用点都是字面量，没有
    「上方不够就翻下去」的先例；而这条正是我们修过的 bug（新会话输入框居中时面板顶部被裁）。
    判据沿用改造前的行为（哪边空间多朝哪边、相等时朝上），交互不变；
  · **宽度**：官方 `useAnchoredPosition` 不管宽度（只用面板自身宽度钳右边界），「和输入框一样宽」
    继续走 `--t-team-pop-w`；
  · **高度上限**：官方 `useAnchoredMaxHeight` 是给「底边由布局固定」的浮层用的（读自身 `bottom` 算上界），
    而我们的位置由高度反推（`top = 锚点顶 - 间距 - 高度`），拿它算会因为 `bottom` 随位置一起动而
    **不收敛**，所以自己按**同一套上界规则**算；
  · **Escape**：官方 hook 不管它。
- **上边界改按官方规则让位**：新增 `overlayTopMargin`（算法照抄 primitives：框架顶部占用区
  `--dsh-frame-top-clearance` + 20px，原生全屏时不算占用区）。桌面端向上弹时面板因此比之前矮一点、
  不再顶到窗口框架那一带。
- **兜底与老宿主**：三件官方件任一缺席（老宿主、自检替身）就退回本插件的等价实现（同样的算法与重算时机），
  材质退回 `.t-team-pop` 自绘那一套 —— 与 `ui.jsx` 顶部「官方优先、缺了退回自绘」同一条约定。
  走官方材质时容器多加 `t-team-pop-official`，把自绘的边框/底色/滤镜清掉：官方材质是父级内部一个
  `aria-hidden`、`z-index:-1` 的兄弟层，父级自己再铺一层底色就会把它整个盖住。
- 顺带修一处会被材质层踩到的 CSS：`.t-team-pop > *` 补 10px 右内边距那条要排除 `[aria-hidden]`
  （否则官方材质层少吃一条、右边露出底色）。

### 自检

- 新增 6 条断言：官方三件都被探测并使用、翻转仍自写、顶部让位按官方规则、官方材质模式下自绘材质被清掉、
  Escape 仍自写、**替身补齐三件**（缺一件，官方分支在自检里就等于没有覆盖）。
- 改写 2 条旧断言（手算的 `place()` / `wantedLeft` 已删）：宽度与左边缘对齐改为钉「宽度变量 + 官方
  `align:"start"`」；右边界钳制改为钉「官方 hook + 兜底实现里同一句钳制」。
- typecheck / check-client（13 个文件 0 处未定义标识符）/ render-smoke（9/9）/ verify（**499/499**，
  `ci.yml` 里的计数同步到 499）全绿。

### 待真机确认（本机没有真实布局，离线复现不了的三件事）

- 面板打开时**不抖动**：定位 hook 的 `top` 依赖面板高度、高度上限又由本插件算，两者靠 `ResizeObserver` 收敛；
- 向上弹时按官方顶部让位（桌面 48+20）后的高度，观感是否可接受；
- 官方 `MenuSurface` 的 macOS vibrancy 底层在桌面壳里没有黑块或闪烁。

## [0.4.12] — 未发布

### 新增

- **提示词弹窗加了「复制」按钮**（用户要求：放在关闭按钮旁边）。官方 `Modal` 的标题栏只有
  「标题 + 关闭」两个位置、**没有插槽**，所以按钮渲染在正文之前，靠 CSS 绝对定位"落"到关闭
  按钮左侧：定位基准是官方 `.dialog`（`Modal.module.css` 给它 `position: relative`），
  因此正文滚动时按钮不动；偏移量照着官方 `.header` 的 padding 与 `.close` 的 28×28 算 ——
  `top:22px`（header 的 padding-top）、`right:50px`（14px 右内边距 + 28px 关闭按钮 + 8px 间隔）。
  点一下变「已复制」，写不进去变「复制失败」，1.6s 后回到「复制」。
  **失败也要出声**：Clipboard API 在非安全上下文里缺席是常态，点了毫无反应只会被当成按钮坏了。
  复制走官方的 `writeClipboard`（异步 Clipboard API + `execCommand` 兜底），不是裸
  `navigator.clipboard`。正文还在读、读失败、或本身为空时按钮禁用 —— 复制一段"正在读取…"
  没有意义。换一位专家会重置反馈，免得把上一位的"已复制"看成这一位的。

### 修复

- **新增一道构建前门禁：CSS 模板里的裸反引号**。`css.js` 整个 CSS 是一个 JS 模板字符串
  （`export const CSS = ...`），注释里再写一个反引号就会把它提前终止；
  而 esbuild 报的是 `Expected ";" but found "max"` 并指向 **CSS 内容本身**，完全看不出是
  模板字符串被截断。而且它只在真正构建时炸，`lib/client.js` 又是提交进仓库的产物 ——
  构建失败意味着产物悄悄停在上一版。2026-09-28 一次会话里连踩三次（顺手把
  `max-height: 100%`、`min(380px,100%)`、`position: relative` 用反引号括了起来）。
  现在 `check-client-refs.mjs`（build / verify / prepublishOnly 都会先跑它）会扫描
  `css.js` 的模板体并报出首个反引号的行号；已用「故意插一个」反向验证过能拦住。

### 自检

- 490 → **493 项**：新增三条 —— 复制按钮接入且文案走字典（禁硬编码）、
  定位规则在位（丢了按钮会掉进正文按钮流，不在关闭按钮旁边）、
  复制优先走官方 `writeClipboard`（退回裸 API 会在非安全上下文静默失败）。
  「CSS 模板裸反引号」那道门禁落在 `check-client-refs.mjs` 里（build 的前置），不在 verify 计数内。
  ci.yml 计数同步到 493。
- typecheck / check-client / build / verify（493/493）全绿；`lib/client.js` 已重建（对齐 0.4.12）。

## [0.4.11] — 未发布

弹窗**形状**：0.4.10 治了「漫出屏幕」，但没治「长得不对」—— 用户接着反馈「太长 太窄」。

### 修复

- **提示词弹窗恢复成适合阅读的形状**。官方 `.dialog` 的 `min(380px, 100%)` 宽 + 不设高度
  上限，是给**确认框**设计的尺寸（一句话 + 两个按钮）；拿它装专家 persona 全文（动辄上万行）
  就成了又高又窄的窄条：380px 宽意味着长行几乎每句都折行，再撑满视口高度，读起来像从门缝
  里看。0.4.10 只解决了"内容漫出视口"，形状问题当时没看见 —— 这两件事得分开修。
  现在按内容类型给尺寸：
  - 提示词弹窗（纯阅读）→ `width:min(960px,94vw)` + `max-height:min(84vh,800px)`；
  - 编辑器弹窗（有表单）→ `width:min(860px,94vw)` + `max-height:min(84vh,800px)`
    （宽度是 0.4.10 恢复的那条，这次补上高度上限）。
  两档高度一致，来回切不会跳。
  ⚠️ 这两条**必须写在 `.t-team-modal-fit` 之后**：同为单类选择器、特异性相同，`max-height`
  谁在后面谁生效；顺序一反，`max-height:100%` 就会盖掉弹窗自己的高度上限，表现正是
  "又占满整屏"。这条顺序本身也进了自检。

### 自检

- 488 → **490 项**，新增两条：提示词弹窗的宽高约束在位、两条尺寸规则确实写在
  `.t-team-modal-fit` 之后。第二条**当场抓到一处真问题** —— 编辑器那条规则被写了两遍
  （第一轮的 860px 留在文件开头，第二轮又写了一份），开头那份会让顺序约束失效。
  ci.yml 计数同步到 490。
- typecheck / build / verify（490/490）全绿；`lib/client.js` 已重建（版本对齐 0.4.11）。

## [0.4.10] — 未发布

两个**弹窗**的回归：都是「改用官方 `Modal`」那一批留下的，用户看到的是"弹窗样式出问题"。

### 修复

- **查看提示词时弹窗漫出屏幕**（用户 2026-09-28 报）。官方 `Modal` 的 `.dialog`
  **没有 `max-height`** —— `Modal.module.css` 的注释把这件事明确交给调用方
  （*cards size against this padding box: consumers cap growth with `max-height: 100%`*），
  而它同时 `createPortal(…, document.body)`、`.root` 只负责居中不做滚动。于是内容一长就
  整体顶出视口：专家 persona 动辄上万行，弹窗被撑到远超屏幕高度，看起来就是"样式崩了、
  文字漫出来"，而不是一个能滚的对话框。
  修法按官方约定分三层，缺一层都不生效：
  - `.t-team-modal-fit` → dialog 相对 `.root` 的 padding box 兜住高度（`max-height:100%`）；
  - `.t-team-modal-fit-content` → 官方 `.content` 允许收缩（flex 子项默认 `min-height:auto`
    会把父级继续撑破）；
  - `.content > div:last-child`（官方 `.body`）自己 `overflow:auto` —— 标题栏与关闭按钮
    因此固定在顶部、始终可点。
  这一层做在 `ui.jsx` 的 `Modal` 封装里，**所有调用方自动受益**，不必各自处理高度。
- **自建专家编辑器被压窄到 380px**（同一批改动的遗漏）。`.t-team-editor-modal`
  （`width:min(860px,94vw)`）是自绘 Modal 时代的类名，改用官方封装后**没有任何代码再引用它**
  —— 而官方 `.dialog` 默认只有 `min(380px,100%)` 宽，编辑器要编辑 persona 正文（多行
  Markdown），380px 挤不下。现已把该类名重新接到 editor 弹窗上（死代码复活）。
  同类死规则 `.t-team-editor-body`（含它的 `.t-team-picker-list` 上限）确认无引用者，删除。
- 顺带修正 `.t-team-prompt-body` 的职责：提示词正文原先复用自绘兜底 Modal 的内部类名
  `.t-team-modal-body`，会带上不属于它的 `padding:14px`（官方 `.body` 已有 `padding:0 24px`，
  叠加成 38px）。现在两者各用各的名字，滚动交给上面那层 `.body`。

### 自检

- 483 → **488 项**，[6b] 新增 5 条专钉这次的两个回归与一个死代码：官方 Modal 的三层高度约束
  齐备、`Modal` 封装**真把限高类交给了官方组件**（只断言"CSS 里有这个类名"挡不住
  "封装没传"，那正是这次的成因）、提示词正文不再复用兜底类名、编辑器宽度约束在位、
  `.t-team-editor-body` 死样式没长回来。ci.yml 两处计数同步到 488。
- typecheck / build / verify（488/488）全绿；`lib/client.js` 已重建（内嵌版本常量对齐 0.4.10）。

## [0.4.9] — 未发布

对宿主版本的 peer 范围收敛为**只保留下限**：内核以后升级，这一行不用再改。

### 变更

- **18 个 `@deepseek-ai/dsh-*` 的 peer 范围由四段 caret 改为 `>=0.1.5-rc.1`**。
  原文是 `^0.1.5-rc.1 || ^0.1.6-alpha.2 || ^0.1.7-rc.1 || ^0.2.0-rc.1` —— 每来一个内核
  版本就补一段，是一份只增不减的清单。实测（直接跑 `dshmarket` 的
  `deriveHostCompatibility`）表明**这些分段并没有起到门禁作用**：判定链是
  `rangeResult`（裸 semver）→ 不满足时再走 `classifyPeer`，而后者只在「低于下限」
  或「超出**显式**上界」时给 `risk`；超出 caret 的**隐式**上界只算 `warning` 并被
  `declarationResult` 放行。所以三段写法在宿主 `0.5.0` 上照样判 `compatible`，
  第四段纯属表意。
  改成 `>=0.1.5-rc.1` 之后：
  - 下限仍是真正验证过的 `0.1.5-rc.1` —— 更老的宿主照旧判 `incompatible` 被拦；
  - 上限彻底不存在，`0.2.3-rc.4` / `0.3.0` / `0.5.0` / `1.0.0` 实测全部 `compatible`，
    不必再为装机判定改这一行。
  ⚠️ 这只解决**装机门禁**。内核若有破坏性 API 变更（改槽位名、改 codec 协议、改配置
  字段机制、改包结构），插件仍要改代码并重新发布 —— peer 范围管不到运行时。

## [0.4.8] — 未发布

### 修复

- **`dsh.client.inject` 补上 `@deepseek-ai/dsh-client-ui-slots`**。客户端源码 `src/client/index.jsx`
  的静态 `inject` 列出了 `"slots"` 服务（`ctx.slots.inject` / `ctx.slots.register` 都依赖它），
  但 `package.json` 的 `dsh.client.inject` 没有映射它的提供者（`@deepseek-ai/dsh-client-ui-slots`）。
  slots 是 shell 级服务，在大多数启动顺序下别的插件或宿主 shell 会先加载它，所以此前没报错；
  但在极端启动顺序下 `ctx.slots` 会是 `undefined`，设置卡片与 @ 召唤菜单一同消失且不报错。
  补上后，插件本身的依赖链才完整，不再依赖"别人先加载了它"这个巧合。同一修复在
  `dsh-helper-patch` 建仓时就已经做了（[#b1f2c8b](https://github.com/jiuaiwo/dsh-helper-patch/commit/b1f2c8b)），
  当时 T专家 那份被漏掉了。

## [0.4.7] — 未发布

这一批是 2026-09-28 审查的尾巴——杂项清理与"模型可见的事实不能写死"那条原则的延伸。
共同主题是**让长期沉默的代码开口说话**：要么删掉，要么留一句可归因的日志。

### 修复

- **`TTeamRemote` 的 `static inject` 去掉从未读取的 `settings`**。cordis 要等 inject 里
  **每一个**服务就绪才实例化这个类（见 cordis 源码的 inject 实现）；宿主 settings 一旦
  晚到或出错，T专家 的整个面板就跟着报"服务暂时不可用"，而排查的人却被引去查 typert
  与调度引擎——因为这才是表面报错处。删掉之后 T专家 的激活就不再依赖宿主 settings 的
  加载顺序。同一类问题在 dsh-helper-patch 0.13.0 那批也修过一次（schedule-remote 的死
  依赖），模式相同。
- **死代码清理**：`lib/index.js` 里的 `renderPlanReport`（预检报告的中文渲染器，
  0.4.7 之前已**全仓零调用**——预检功能本身已随定时任务迁出）、dangling 的 `/**`
  JSDoc 起点（148 行，一行空 `/**` 后另起一行真注释）、空的 `if (typeof ctx.on === "function") {}`
  占位（361 行，预留但从未填过）。三者都是"代码看着在跑、其实没在跑"。
- **`readJson`（`lib/catalog.js`）与 `parseStore`（`lib/skill-gate/store.js`）不再把错误
  吞了**。0.4.7 之前是空 `catch`：JSON 损坏、读权限问题等都被无声地当成"文件不存在"。
  UI 表现是"中文名/简介静默变全英文"或"技能开关回到默认状态"，用户无一可查的线索。
  现在 ENOENT 仍当空对象（侧车目录可缺省——这是正常路径）；其它错误 `console.warn` 出
  一句 `[t-team] 读 <path> 失败，按空对象继续：…`，保留原行为（仍当空对象），但下次
  写盘会用原子 rename 把坏文件替换掉。

### 变更

- **名册规模不再以字面量形式出现在模型可见的文本里**。`src/client/i18n.js` 的
  `settings.summary` 原来写"专家名册（323 位 · 22 个分区）"——这是**模型可见的事实**
  （提示段会进 prompt），一旦名册增删或改分区就立刻过期，且没有任何东西会红。
  `lib/index.js` 的 `rosterScale` 本来就是从目录现算的（并按目录缓存），数字应当
  永远从真源来。这一版把字面量从文案里清掉，模型可见的事实只能来自运行时——规模
  已经在面板的 `tab.count` 与 `hint` 里动态显示了，summary 本身不需要再含数字。
- **`lib/index.js` 里两处解释性注释的字面量也清掉**（"a 316-expert, 22-division roster"
  与"一层 301 / 递归 316"）。同样是"上一次见到的数字"被写死成注释：写注释的那天是对的，
  之后就是错的；而且它解释了**机制**（为什么要递归），不是**当下**值。
- **README 的"浮层标签"表述**：原文是"专家 → 技能 → 任务"——「任务」标签在 0.3.x 已
  随定时任务功能一起迁出（T专家 不再做定时任务，由 `dsh-helper-patch` 接管）。
  改回"专家 / 技能"两个标签，并在备注里说明「任务」的去向。`verify` 里钉这条的正则
  同步更新（旧的 `/浮层标签：\*\*专家 → 技能 → 任务\*\*/u` 与实际不一致，修了之后
  会红）。

### 自检

- 474 → **483 项**，新增 [21b] 一节（9 条）专门钉死"代码看起来在跑、其实没在跑"与
  "文档与实现不符"：remote inject 不含未读 settings、`renderPlanReport` 不在
  `lib/index.js`、没有连续 `/**` + `/**` 的孤立注释、i18n 不含字面量数字、README
  没有"专家 → 技能 → 任务"、没有单行 if + 紧邻空块的占位、`parseStore` 与 `readJson`
  的 JSON 损坏会 `console.warn`。**这一节是反向回归**：任何一条后来又把 0.4.7 清掉的
  问题长回来都会立刻红。
- ci.yml 里两处写死的断言数同步到 483。
- typecheck / check-client（13 文件 0 处未定义标识符）/ render-smoke（9/9）/
  verify（483/483）/ npm pack --dry-run（698 个文件）/ sync-data --check（656 个文件）
  全绿；lib/client.js 已重建（内嵌的 CLIENT_BUILD_VERSION 由 build 自动对齐到 0.4.7，
  [6c] 的产物新鲜度与版本一致性两道门禁都盯着它）。

## [0.4.6] — 未发布

四个"端到端消息没通"的修复 + 一组工程化配套。共同点是：单看每段都很小，串起来才让
host 早就在说的话**真的被面板听到**。

### 修复

- **技能开关的 `skills` 服务换实例时不再静默失效**。`apply` 里那一个"只装一次"的守卫
  是必要的：cordis 的 `reflect.provide` 对同名服务是**硬冲突**（`service "X" has been
  registered at <fiber>`，见 cordis 源码的 `if (this.store[key]) throw`），第二次装配
  必然抛；但"只装一次"不等于"之后什么都不说"——宿主真把 `ctx.skills` 换成新实例时（另一个
  插件重载并重新 provide 了它），停用名单仍作用在旧实例上，新实例的技能不受约束，那是
  静默失效。现在改为记下已包装的 skills 对象，新回调给的是**同一个对象**就幂等返回，
  **不是同一个**就 `logger.warn` 出声（说明重载 T专家 即可恢复），专家名册与召唤不受影响。
- **名册健康状态 `sidecar` 字段终于穿过 schema**。host 早就在快照里返回它（lib/index.js 的
  `getCatalog`，把中文侧车缺失/跳过的文件/读不出的分类目录都报上），注释也写着
  "面板可以据此提示"。但 `catalogSnapshotSchema` 从 0.3.x 一直**没声明**它，zod 会把
  schema 里没有的键**直接剥掉**——上面 `customDivision` 那两个字段的注释已经警告过
  "漏声明会被剥掉"，这次踩在一个嵌套对象上，更难发现。0.4.6 把它写进 schema，
  面板新增 `roster.sidecarMissing` / `skippedFiles` / `unreadableDivisions` 三条警告
  （中英，i18n 已同步），新增 `.t-team-warn` CSS 类——比 `t-team-error` 轻（功能仍在）、
  比 `t-team-note` 醒目（**名册正在静默缺东西**，不容忽视）。
  [20c] 把这条**端到端**钉住：单独每条都好做，加起来才证明"消息通了"。

### 工程化

- **`tsconfig.json` 把 `lib/skill-gate/` 下 6 个文件纳入 include**。它们此前**全部**标了
  `// @ts-check` 但又**全部**不在 include 里——和 dsh-helper-patch 0.13.0 修的那个坑
  一模一样，只是踩在子目录里，常规 `readdirSync(join(HERE, "lib"))` 看不见。
  `[20]` 同步改成**递归**扫（对照辅助补丁那边的写法），并把硬编码阈值从 7 提到 13
  （7 个老 + 6 个 skill-gate）。补上之后第一次跑 typecheck：**全部通过**——说明
  lib/skill-gate/*.js 写得干净；这也是"标记死了"和"标记下其实有真问题"两种情况中
  比较幸运的那一种，但意义在于此后的任何修改都被 typecheck 盯着。
- 新增 `[20c] sidecar 端到端`（7 条）：import `catalogSnapshotSchema` 真跑一遍解析，
  确认 sidecar 字段被保留；读 host 源码确认 `sidecar: { zhRoot, skippedFiles,
  unreadableDivisions }` 真在快照里被拼出（不是只在 schema 里写）；读 settings.jsx 确认
  引用了 `snapshot.sidecar` 与 `healthNotice`；读 css.js 确认 `.t-team-warn` 类存在；
  在 zh/en 两份字典里各查一次 i18n 三个新键（缺一个就红——中文少一个、英文少一个、
  多打一遍都会被抓）。
- 总数 467 → **474 项**，ci.yml 里两处写死的断言数同步到 474。

### 自检

- typecheck / check-client（13 文件 0 处未定义标识符）/ render-smoke（9/9）/
  verify（474/474）/ npm pack --dry-run（698 个文件）/ sync-data --check（656 个文件）全绿。

## [0.4.5] — 未发布

一次代码审查（2026-09-28，与 dsh-helper-patch 一起做的只读复查）查出的问题，这一版修的是
**客户端与 host 之间错误码对不上**的那一组。这类缺陷不会报错，只会静默走错分支，
所以两处都补了自检断言把两端的字符串钉在一起。

### 修复

- **技能开关的乐观锁冲突码对不上**：`skills-panel.jsx` 比的是 `skillGate/conflict`，
  而 host 的 `setDisabled` 抛的是 `tTeam/conflict` —— `skillGate` 那个命名空间在 0.4.0
  已整体并进 `tTeam`（见 `lib/remote.js` 顶部的说明），这处是合并时漏改的残留。
  后果不是报错，而是**静默走 else 分支**：冲突时面板不会自动重拉快照，用户只看到一句
  "保存失败"，再点一次仍然失败（手里的修订号还是旧的），非得手动刷新页面才解得开 ——
  而这条路径偏偏只在多窗口同时改设置时才走到，于是它既难复现又难归因。
- **自建专家的冲突判断在本地化文案里搜错误码**：`settings.jsx` 写的是
  `message.includes("custom-slug-taken")`，而 host 的 `customError` 把那串铸在
  **`error.code`** 上（`tTeam/custom-slug-taken`），`message` 是给人看的中/英文句子
  —— 里面根本不含这串码，于是那个 `if` **永远为 false**。后果：slug 或名称撞车时
  面板不重拉名册，用户看到"已被占用"却不知道该跟谁比，本地快照里也始终没有那个占用者，
  改完再存还是撞。改为判 `cause.code`，并把 `tTeam/custom-conflict`（编辑时指纹不符 =
  别的窗口改过同一个文件）一并纳入重拉条件。
- **`businessError` 的 `error` 参数缺类型标注**：它是 `any`，于是 `candidate` 也跟着是
  `any`，`new RemoteError(...)` 的类型检查整个失效（TS 对 any 一律放行）。表现是
  这里**本该有**的那道「上游类型缺口」抑制指令根本不需要存在 —— 也就是说
  `RemoteErrorDetailsMap` 是闭合集合、`tTeam/*` 业务码不在其中这件事，此前没有任何东西在检查。
  补上 `{unknown}` 与显式取值后，抑制指令才名副其实（临时删掉它会立刻报
  `TS2345: Argument of type 'string' is not assignable to parameter of type 'keyof RemoteErrorDetailsMap'`）。
  dsh-helper-patch 同一个方法踩过同一个坑（那边 0.13.0 修）。

### 自检

- 459 → **467 项**，新增「错误码两端对齐」一组：复现 host 侧 `customError` 的铸码规则
  （并先断言那行规则还在，否则比对就是自说自话）、逐个核对
  `error.customSlugTaken` / `customNameTaken` / `customConflict` 铸出的码在客户端源码里
  确实被用来分支、客户端不再出现 `if (message.includes("custom-…")` 这种写法、
  `skillGate/conflict` 无残留、host 的 `setDisabled` 抛的确实是 `tTeam/conflict`、
  `businessError` 的 `error` 有类型标注。
- `.github/workflows/ci.yml` 里两处写死的断言数同步到 467（`[21] 文档计数一致性` 会拿它
  与实测总数比，不同步就红）。
- 那条「不再在文案里搜错误码」的断言只匹配**真实代码形式**：`readClientSource()` 读的是
  `src/client` 源码，而修复处的注释必然会引用旧写法来说明"原先错在哪"，
  用裸 `includes` 会被自己的注释触发（第一版就这么红过一次）。

## [0.4.4] — 未发布

- 细节清理（ChoiceGroup 的唯一 id、输入框类名语义、死导出）（`d851aaf`，2026-09-28）

## [0.4.3] — 未发布

- 技能开关的装配加一次性守卫（动态 inject 会重复触发）（`aaff105`，2026-09-28）

## [0.4.2] — 未发布

- 去掉中文字典里重复的 tab.skills（`776b576`，2026-09-28）

## [0.4.1] — 未发布

- 技能开关改挂到已有的 tTeam remote（第二份 remote 入口在实机上挂不上）（`7a9c696`，2026-09-28）

## [0.4.0] — 未发布

- 技能开关（dsh-plugin-skill-gate）整体并入（`f03a50b`，2026-09-28）

## [0.3.103] — 未发布

- 分类页小节与列表之间补上间距（`775010d`，2026-09-28）

## [0.3.102] — 未发布

- 分类列表恢复成一张有边框的卡片（内容是留白不够，不是不要框）（`9ff9182`，2026-09-28）

## [0.3.101] — 未发布

- 分类页去掉两处多余的横线（`714123b`，2026-09-28）

## [0.3.100] — 未发布

- 分类页的列表边框贴住了行内按钮（`6853892`，2026-09-28）

## [0.3.99] — 未发布

- 分类折叠头改成条状卡片（`a04007c`，2026-09-28）

## [0.3.98] — 未发布

- 专家名册按分类折叠（`c66d236`，2026-09-28）

## [0.3.97] — 未发布

- 面板标签页被拉满整行（官方 SegmentedTabs 的类名撞了自绘那套）（`c6903ee`，2026-09-28）

## [0.3.96] — 未发布

- 设置面板搬到「插件列表 → T专家」并换官方 primitives（`5ab56be`，2026-09-28）

## [0.3.94] — 未发布

- 输入框尺寸修复：分类新建栏与专家页搜索框自己钉死尺寸（`3af1e51`，2026-09-28）

## [0.3.93] — 未发布

- 插件列表的名称/简介改为中英双语（`cb95d0c`，2026-09-28）

---

## 0.3.92 及更早

npm 上发布的最后一个版本是 **v0.3.92**（`git tag` 里最新的那个）。0.3.92 及更早共有 51 个
带版本号的提交，不在这里逐条回溯 —— 需要时用：

```bash
git log --oneline --reverse | grep -E '升版本到 |^0\.[0-9]+\.[0-9]+'
git tag --sort=v:refname
```
