# T专家 运维参考

本文件是 `SKILL.md` 的展开版：完整命令、菜单号、参数与"哪份文件是真源"的地图。
命令里的 `<ops>` = 运维台根目录（`tz.sh` 所在目录）。

## 一、子命令（脚本化用，agent 优先用这一组）

| 子命令 | 作用 | 备注 |
| --- | --- | --- |
| `tz.sh status` | 状态头：名册/中文/版本/仓库是否干净 | 只读 |
| `tz.sh experts add` | 新增专家 | 参数见下；无参数 = 交互 |
| `tz.sh experts remove` | 删除专家（源码 + 运行时） | 先 `--dry-run` |
| `tz.sh experts stats` | 名册统计（分类 / 专家数 / 中文覆盖） | 递归统计 |
| `tz.sh experts check` | 名册一致性（源码 ↔ 运行时 ↔ 清单） | 退出码 1 = 漂移 |
| `tz.sh roster` | 同 `experts stats` | |
| `tz.sh verify` | `experts check` + `verify.mjs` 插件自检 | 改代码后必跑 |
| `tz.sh build` | 构建 client bundle | `npm run build` |
| `tz.sh install` | 安装/重装到 profile | 见参数；`--dry-run` 预演 |
| `tz.sh uninstall` | 卸载（保留 `experts/` 与 `zh/`） | |
| `tz.sh sync-data` | 把运行时数据快照同步回包内 `data/` | 发布前用 |
| `tz.sh publish-dry` / `publish` | 发布预演 / 发布到 npm | 见参数 |
| `tz.sh open` | 打开运行时数据目录 | |

## 二、交互菜单号（`tz.sh <编号>` 等价）

| # | 动作 | # | 动作 |
| --- | --- | --- | --- |
| 1 | 新增专家 | 8 | 安装/重装到 profile |
| 2 | 删除专家 | 9 | 卸载插件（保留数据） |
| 3 | 名册统计 | 10 | 校验：名册一致性 + 插件自检 |
| 4 | 打开源码专家目录 `data/experts` | 11 | 构建插件产物（client bundle） |
| 5 | 名册一致性校验 | 12 | 发布预演（dry-run） |
| 6 | 中文覆盖报告 | 13 | 一键发布到 npm |
| 7 | 打开运行时数据目录 | 14 | 同步包内数据快照 |

## 三、`experts add` / `experts remove` 参数

`add`（`--repo` / `--runtime` 由 tz.sh 自动注入，不要手写）：

| 参数 | 说明 |
| --- | --- |
| `--category <分区>` | 目标分类（已存在或新建） |
| `--slug <slug>` | 文件名即 slug：`a-z 0-9 -`；中文名必须显式给 `--slug` |
| `--file <路径>` | 源 Markdown（绝对路径最稳） |
| `--label <显示名>` | 新建分类时的中文显示名 |
| `--name` / `--description` / `--emoji` | 源文件缺 frontmatter 时补齐 |
| `--force` | 目标已存在时覆盖 |
| `--yes` | 跳过交互确认 |
| `--dry-run` | 只打印将写入的路径，不落盘 |

`remove`：`--category` + `--slug`（+ `--yes` / `--dry-run`）。
`slug` 就是文件名；工具会在分类树下**递归**定位它，嵌套子目录也能删对。

## 四、`install` / `publish` 参数

```
tz.sh install [--profile <名或路径>] [--dry-run]
tz.sh uninstall
tz.sh publish-dry | publish [--current|--patch|--minor|--major|--version X.Y.Z] [--retry] [--no-push]
```

- 默认 profile：`~/.dsh/profiles/desktop`。
- `install` 会：把仓库复制成运行副本 `plugin/`（STAGE）→ 复制到 profile 的 `node_modules/` →
  改 profile 的 `package.json` 依赖/bundles。**必须重启 DSH Desktop 才生效**。
- `publish` **不带参数**时给菜单，选项 1 就是「直接发布当前版本（不升版）」——版本号在开发期已经写进
  `package.json`（客户端 `CLIENT_BUILD_VERSION` 必须跟它一致），所以那是默认路径；**回车＝取消**（发布不可逆，
  不给"回车即发"）。非交互：`--current`（不升版）或 `--patch` / `--minor` / `--major` / `--version X.Y.Z`（升版）。
  `--retry` = 上次发布中断后沿用当前版本重试。**推送是默认行为**（见下条），只有 `--no-push` 才跳过
  （`--push` 仍接受，但已等同于默认，保留只为兼容旧脚本调用）。
  `publish-dry` 默认按 patch **预演**（只跑预检与打包预览，不动仓库、不发布）。
- **补的 tag 必须是 annotated（`git tag -a`）**，别改回轻量 tag：发布 tag 要与 GitHub 上的 Release、
  npm 上的号一一对应（轻量 tag 在 `--follow-tags` 时代还会被静默忽略 —— 2026-09-15 实测踩过：
  提交推上去了，`v0.3.6 / v0.3.24 / v0.3.25` 三个 tag 全留在本地，而 npm 上已经有对应包）。
- **推送只推「发布快照」**（2026-10-06 定）：远端 `main` 永远只有一条**无父提交**的快照
  （`git commit-tree` 造，树 = 本次发布提交的树），`tag` 由脚本重指到该快照后再推；本地 `main`
  的完整开发历史（数百条）永不出本机。**别用 `git push --follow-tags`**：tag 自带父链，在本地
  `main` 上打 tag 再推时，分支推送会被 non-fast-forward 拒绝、命令退出码非 0，但 **tag 照样推成功**
  —— 从远端 clone 顺着它就能看到全部开发提交（2026-10-06 实测）。`ops/git-hooks/pre-push` 会拦住
  这类推送，安装：`git config core.hooksPath ops/git-hooks`。
- **tag 的版本号必须与 npm 上发布的版本一一对应**（用户 2026-09-15 定）：
  `v<X.Y.Z>` 的 `X.Y.Z` 就是 `package.json` 的 version，也就是 npm registry 上那个版本号。
  两条推论：① **发布才打 tag** —— 提交时升版本号不等于打 tag（未发布的版本不许有 tag）；
  ② **打了 tag 就必须发出去** —— 别留下"有 tag、npm 上没有"的悬空标记。发布流程本身满足这条
  （不升版路径补 `v$target`、升版路径由 `npm version` 打 annotated tag，两者都等于即将发布的版本号）。
  历史遗留（`v0.2.0 / v0.2.8 / v0.2.11` 有 tag 无发布、`0.1.0` 有发布无 tag）**保持原样不动**：
  改历史 tag 只会让"包 ↔ 提交"的对应更含糊。
- **版本纪律（2026-09-15 用户定）**：**每次提交 git 都要同步升版本号** —— 提交前改 `package.json` 的
  `version` 与 `src/client/state.js` 的 `CLIENT_BUILD_VERSION`（两处必须一致，verify 有断言），跑 `tz.sh build`
  重建客户端产物，提交信息以新版本号起头。别等发布时才 bump：npm 上已发布的同号版本内容与本地工作树
  并不相同，不升版会让「装的是哪一版」无从分辨，发布时也会撞同号已存在。

## 五、真源地图（改哪份才是改对了）

| 内容 | 真源 | 说明 |
| --- | --- | --- |
| 专家名册 | `<ops>/dsh-expert/data/experts/` | 规模**现算**（`tz.sh status`），别写死；运行时是它的同步副本 |
| 中文侧车 | `<ops>/dsh-expert/data/zh/` | 默认只读；与源仓库对齐时可按用户决策补译（repo + 运行时两侧都写，并重算 `COVERAGE.json`） |
| 面板自建专家 | `<数据目录>/custom/custom/<slug>.md` | 不属于快照，同步脚本永不碰它 |
| 运行副本 | `<ops>/plugin/` | 安装产物，删了重跑 `tz.sh install` 即可重建 |

## 六、环境变量（覆盖路径）

| 变量 | 默认 | 作用 |
| --- | --- | --- |
| `T_TEAM_REPO` | `<ops>/dsh-expert` | 插件仓库位置 |
| `T_TEAM_DATA` | 优先 `~/.t-team`，缺失时回退 `<ops>/data` | 数据目录（插件的 `root`/`zhRoot` 默认就是 `~/.t-team`；脚本必须跟插件看同一棵树） |
| `T_TEAM_STAGE` | `<ops>/plugin` | 运行副本目录 |

## 七、常见故障

| 现象 | 原因 / 处理 |
| --- | --- |
| 名册少了几位 | 只数了分类目录的第一层（嵌套子目录里的专家被漏掉）—— 必须递归，以 `tz.sh status` 为准 |
| `experts check` 报"运行时缺/多出" | 绕开脚本手工拷贝过文件；用 `experts add` 重做那一条 |
| 新增专家后面板看不到 | 面板按 mtime 指纹自动重载；仍看不到就查该专家是否被**启用**（设置页 T专家 标签，默认全禁用） |
| 装了新版本但没变化 | 只跑了 `build` 没跑 `install`，或没重启 |
| `找不到插件仓库` | 设 `T_TEAM_REPO`，或用 `--repo` 指定 |
