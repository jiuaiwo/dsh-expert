# 第三方许可文本（随包分发）

本目录只放**随包分发的第三方内容**的完整许可证文本，以便再分发时履行 MIT 的
"保留版权声明与许可声明"义务。说明与署名见包根目录的 `THIRD-PARTY-NOTICES`。

| 文件 | 覆盖的随包内容 | 来源 |
| --- | --- | --- |
| `agency-agents.LICENSE` | `data/experts/`（22 分区 / 623 位；其中 323 位来自第三方 —— 279 位为上游仓库逐字节镜像、35 位来自名册来源包快照、7 位于 2026-09-15 与 `agency-agents-zh` 源仓库对齐时补齐；余 2 位为本仓自建；另有 300 位为 2026-09-29 从 WorkBuddy 专家市场导入，其许可归腾讯及其专家作者 —— 以上 304 位均不由本许可覆盖） | The Agency / AgentLand 名册快照，MIT |
| `agency-agents-zh.LICENSE` | `data/zh/` 中的中文名字、简介与人格正文（含 2026-09-15 对齐时直接取自该仓库的 7 篇正文） | `agency-agents-zh` 中文翻译与本地化资产，MIT |

两份文本都是从实际用于生成快照的来源包内**逐字节复制**的，未经改写：

```
<安装的 @michengai/dsh-agency-agents>/assets/agency-agents/LICENSE
<安装的 @michengai/dsh-agency-agents>/assets/agency-agents-zh/LICENSE
```

`@michengai/dsh-agency-agents` 自身的 TypeScript 源码与构建脚本是 Apache-2.0，
但**本插件不打包它的任何代码**，只用到了上面这两份 MIT 授权的资产，
因此这里只需分发这两份 MIT 文本。

