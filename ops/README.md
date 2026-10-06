# `ops/` —— 维护者运维台（随仓库纳管，**不随 npm 包发布**）

这里的脚本只服务**维护者**（名册增删、装机、发布、探针），不参与插件运行。
`package.json` 的 `files` 白名单不含 `ops`，所以它们不会进 npm 包。

## 里面有什么

| 文件 | 作用 |
| --- | --- |
| `tz.sh` | **唯一运维入口**：交互菜单 + 子命令（status / experts / install / uninstall / publish / …） |
| `add-expert.py` | 名册工具：`add` / `remove` / `stats` / `check`（同时写源码与运行时两份） |
| `preview-panel.mjs` | 面板预览探针：把真实名册渲染成静态 HTML（含 DSH 主题 token），Chrome headless 截图验收布局 |
| `roster-sync-report.md` | 名册对齐分析报告（2026-09-15 与 `agency-agents-zh` 源仓库对齐的依据、逐项判定与执行结果） |

## 三种入口都能用

这几个脚本都做了**自定位**，所以下面两种布局都成立：

```bash
# ① 仓库内（推荐：与代码同一个提交，换机器也带着）
cd <repo>/ops && ./tz.sh status

# ② 你原来的运维目录（脚本与仓库同级）
cd ~/web/t-team && ./tz.sh status
```

工作区与数据目录的解析规则：

- **工作区**（放运行副本 `plugin/`）：从**仓库内** `ops/` 运行 → 仓库的上一级；从**运维目录**运行 → 该目录本身。
- **数据目录**（`experts/`、`zh/`、`source.json`）：**优先 `~/.t-team`** —— 那是插件真实读的那棵树
  （`lib/index.js` 的 `root`/`zhRoot`/`customRoot` 默认值就是它）。只有当 `~/.t-team/experts` 不存在时，
  才回退旧布局 `<工作区>/data`。2026-09-15 修：此前默认只看 `<工作区>/data`，脚本与插件会指向两棵不同的树
  （`experts check` 拿旧那棵报「不一致」、`experts add` 写错地方）。

想强制指定时用环境变量：`T_TEAM_REPO`（仓库）、`T_TEAM_DATA`（数据目录）、
`T_TEAM_STAGE`（运行副本）、`T_TEAM_OPS`（运维根，供 `tools/verify.mjs` 找 `tz.sh`）。

## 与仓库内 `tools/` 的分工

| 目录 | 内容 | 谁能跑 |
| --- | --- | --- |
| `tools/` | `build-client.mjs` / `verify.mjs` / `sync-data.mjs` —— 构建链 | 干净 clone + `npm install` 即可（CI 也跑这些） |
| `ops/` | 本目录 —— 维护者运维台 | 需要本机完整工作区（`data/`、安装副本、npm 凭据） |

## 注意

- `tz.sh` 的发布流程（菜单 `7`）会**升版 → 预检 → 提交/发布快照+tag → 推送 → npm 发布**，其中
  **推送是默认行为**（2026-09-15 用户定：发 npm 时同时把 tag 推上去），只有显式加 `--no-push`
  才跳过；跳过时它会打印补推的两条命令。
- **推送推的是「发布快照」，不是本地历史**（2026-10-06 定）：远端 `main` 永远只有一条**无父提交**的
  快照（树 = 本次发布提交的树），tag 也由脚本重指到那条快照上再推；本地 `main` 的数百条开发提交
  永不出本机。为什么必须这样：**tag 自带父链** —— 在本地 `main` 上打 tag 再 `git push --follow-tags`，
  即使分支推送被 non-fast-forward 拒绝、命令退出码非 0，**tag 照样推成功**，从远端 clone 顺着它就能
  看到全部开发提交（2026-10-06 实测复现）。`ops/git-hooks/pre-push` 就是拦这件事的闸，
  安装（每个克隆一次）：`git config core.hooksPath ops/git-hooks`。
  （此前这里问一句"要推吗 [y/N]"、回车即跳过，于是出现过"npm 上有包、远端连 tag 都没有"。）
- 发布前置检查会先看 `npm whoami`；**未登录时会就地提示并调用 `npm login`**，
  并且会区分"没有凭据"与"有 token 但被服务端拒绝（401，通常是过期/被吊销）"两种情况。
- 仓库内的这份是**事实源**；运维目录里那份是原稿。两者目前内容一致——
  以后改运维逻辑，请改这里并同步过去（或把运维目录那份换成指向本目录的薄转发）。
