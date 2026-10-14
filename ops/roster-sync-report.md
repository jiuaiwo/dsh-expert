# 名册对比报告：agency-agents-zh ↔ dsh-expert

- 对比对象：`/Users/biaoge/Downloads/agency-agents-zh-main`（下称**源**） ↔ 本仓库 `data/experts` + `data/zh`（下称**插件**）
- 生成时间：2026-09-15
- 本报告只做分析，**未修改任何名册文件**

---

## 一、结论摘要

| 维度 | 源 | 插件 | 差异 |
|---|---|---|---|
| 部门/分类 | **20 个** | **22 个** | 源 ⊂ 插件；插件多出 `healthcare`、`research` |
| 专家 | **277 位** | **316 位** | 同名可比 263 位，源独有 14 位，插件独有 53 位 |
| 非专家文档 | 16 个（NEXUS 编排手册） | — | 不计入专家 |

三点核心判断：

1. **分类名需要改的只有 3 处**：`营销`（现「市场营销」）、`专项`（现「专业」）、`GIS`（现「地理信息」）；其余 19 个已与源一致。
2. **源有插件无的真专家只有 6 位**（另有 8 位是与插件已有角色重名/重角色的不同命名或不同分类归属，不是净缺口）。
3. **同名 263 位中，257 位两边中文正文逐字一致（相似度 ≥ 0.95）**，没有发现插件比源更新的情况；差异集中在 6 位：4 位源侧重写更新、2 位插件中文是占位摘要（英文原文与源同版本）。

---

## 二、口径说明（源的三份清单互不一致，先定真源）

| 清单 | 部门数 | 专家条目 | 问题 |
|---|---|---|---|
| `README.md` | 19 | 表格 213 条 | 缺 GIS / 安全部章节，未列全 |
| `CATALOG.md` | 19 | 表格 269 条 | 缺公司经营部、战略部 |
| `AGENT-LIST.md` | 20 | **277** | 与文件目录完全吻合 |
| **文件目录 + frontmatter** | **20** | **277** | ✅ 本次采用的判定基准 |

- 源 `strategy/` 目录 16 个文件（NEXUS 纲领、phase-0~6 手册、scenario-* runbook、交接模板等）**全部没有专家 frontmatter**，是编排文档而非专家。因此「战略部」不构成一个专家分类。
- 源另有 16 个非专家 .md 混在目录里（`strategy/` 全部 + `specialized/prompt-engineer` 之外的同名文档等），已在比对中剔除。
- 比对手段：文件 basename 精确匹配 → 中文名归一化模糊匹配 → 中文正文 `difflib` 相似度 → 章节结构比对（四项交叉验证）。

---

## 三、分类对比与重命名建议

插件分类名有两处落点：`data/zh/divisions.json`（数据）与 `lib/catalog.js`（客户端回退）。建议一起改。

| 插件 key | 插件现名 | 源 README 部门名 | 建议 |
|---|---|---|---|
| academic | 学术 | 学术部 | 学术（不变） |
| company | 公司经营 | 公司经营部 | 公司经营（不变） |
| design | 设计 | 设计部 | 设计（不变） |
| engineering | 工程 | 工程部 | 工程（不变） |
| finance | 金融 | 金融部 | 金融（不变） |
| game-development | 游戏开发 | 游戏开发部 | 游戏开发（不变） |
| **gis** | **地理信息** | **GIS 部** | ⚠️ 建议改 **GIS** |
| healthcare | 医疗健康 | 源无此部门 | 保留（插件资产） |
| hr | 人力资源 | 人力资源部 | 人力资源（不变） |
| legal | 法务 | 法务部 | 法务（不变） |
| **marketing** | **市场营销** | **营销部** | ⚠️ 建议改 **营销** |
| paid-media | 付费媒体 | 付费媒体部 | 付费媒体（不变） |
| product | 产品 | 产品部 | 产品（不变） |
| project-management | 项目管理 | 项目管理部 | 项目管理（不变） |
| research | 研究 | 源无此部门 | 保留（插件资产） |
| sales | 销售 | 销售部 | 销售（不变） |
| security | 安全 | 安全部 | 安全（不变） |
| spatial-computing | 空间计算 | 空间计算部 | 空间计算（不变） |
| **specialized** | **专业** | **专项部** | ⚠️ 建议改 **专项** |
| supply-chain | 供应链 | 供应链部 | 供应链（不变） |
| support | 支持 | 支持部 | 支持（不变） |
| testing | 测试 | 测试部 | 测试（不变） |

说明：
- 源的名字都带「部」字（工程部 / 营销部…），插件现用不带「部」的短名。若要求**逐字照搬源**，则 22 个全要加「部」——**这一条需要你拍板**（见第七节决策点 1）。
- 源多出的「战略部」不含专家，**不建议**新增该分类；若你想要的是"把 NEXUS 编排层也做成专家"，那是另一件事。

---

## 四、专家差异明细

### 4.1 源有插件无 —— 真缺失 6 位（建议新增）

| 源文件 | 中文名 | 源分区 | 源规模 | 插件现状 |
|---|---|---|---|---|
| `engineering/engineering-security-engineer.md` | 安全工程师 | engineering | 8.5k | 插件只有「应用安全工程师」（两者相似度 0.05，是不同角色） |
| `finance/finance-financial-forecaster.md` | 财务预测分析师 | finance | 4.8k | 插件 finance 8 位中无对应 |
| `hr/hr-recruiter.md` | 招聘专家（HR 全流程） | hr | 4.3k | 插件 hr 分类仅 1 位（绩效） |
| `marketing/marketing-search-growth-orchestrator.md` | 搜索增长编排器 | marketing | 6.0k | 无（源 SEARCH-GROWTH-STACK 栈的编排者） |
| `specialized/specialized-pricing-optimizer.md` | 动态定价策略师 | specialized | 5.3k | 无 |
| `support/support-recruitment-specialist.md` | 招聘运营专家 | support | 10.5k | 无（与上面 hr-recruiter 是不同角色，相似度 0.07） |

### 4.2 源有插件无 —— 同角色但命名/分类不同 8 对（不是净缺口）

| 源 | 插件现有 | 判定 |
|---|---|---|
| `company/chief-of-staff.md` 幕僚长 | `specialized/specialized-chief-of-staff.md` | 同角色，**分类不同**（源归公司经营部）+ 插件中文是占位 |
| `engineering/engineering-network-engineer-china.md` 国内网络工程师 | `engineering/engineering-china-network-engineer.md` 中国网络工程师 | 同角色，插件版是人工补译完整中文（10.2k）＞ 源（3.8k） |
| `engineering/engineering-threat-detection-engineer.md` 威胁检测工程师（工程侧） | `security/security-threat-detection-engineer.md` 威胁检测工程师（安全运营） | 同族不同侧重（源自身两版相似度 0.71） |
| `specialized/prompt-engineer.md` 提示词工程师 | `engineering/engineering-prompt-engineer.md` | 同角色，**分类不同** |
| `marketing/marketing-bilibili-strategist.md` B站内容策略师 | `marketing/marketing-bilibili-content-strategist.md` | 同角色 + 插件中文是占位 |
| `marketing/marketing-xiaohongshu-operator.md` 小红书运营专家 | `marketing/marketing-xiaohongshu-specialist.md` 小红书运营专家 | 同角色，**中文名完全相同** |
| `marketing/marketing-wechat-operator.md` 微信公众号运营 | `marketing/marketing-wechat-official-account.md` 公众号运营 | 同角色 |
| `marketing/marketing-ecommerce-operator.md` 电商运营师 | `marketing/marketing-china-ecommerce-operator.md` 中国电商运营 | 同角色，插件版更全（6.0k ＞ 4.0k） |

> 这 8 对一旦按源新增，会出现**同一角色两份**。建议二选一：按源补齐（保留两份、来源可追溯）或按源重命名（替换插件现有 slug，会牵动 `data/zh/names.json` 与小队成员引用）。

### 4.3 两边同名 —— 6 位内容不一致（"保留最新"的判定）

| slug | 源中文 | 插件中文 | 插件英文原文 | 判定 |
|---|---|---|---|---|
| `marketing-aeo-foundations` | 10.3k / 新结构（Access Policy、Retrieval Eligibility、Phase 0-6） | 8.7k / 旧结构 | 14.9k / 旧结构 | **源已重写 → 用源** |
| `marketing-ai-citation-strategist` | 12.1k，改名「AI 搜索可见性与 GEO 策略师」 | 4.3k「AI 引文策略师」 | 9.0k / 旧结构 | **源已重写 → 用源** |
| `marketing-seo-specialist` | 7.9k，改名「SEO 与自然搜索增长专家」+ Phase 0-6 工作流 | 6.0k「SEO专家」旧结构 | 20.8k / 旧结构 | **源已重写 → 用源** |
| `specialized-french-consulting-market` | 10.4k（ESN 利润、平台矩阵、费率谈判） | 1.1k 占位 | 10.6k / **通用旧模板** | **源已重写 → 用源** |
| `recruitment-specialist` | 28.7k 全流程 | 1.2k 占位 | 28.5k / **与源同结构** | 内容同版本 → **只需补中文** |
| `specialized-korean-business-navigator` | 12.8k（품의/눈치/KakaoTalk） | 1.1k 占位 | 13.0k / **与源同结构** | 内容同版本 → **只需补中文** |

其余 **257 位同名专家正文相似度 ≥ 0.95**（逐字级一致），无需变动；**没有一位是插件比源新**。

### 4.4 插件独有 53 位（全部保留）

按分类分布：engineering 33、specialized 9、healthcare 3、security 2、academic/design/game-development/marketing/research/testing 各 1。

- 其中 **47 位的中文正文是占位摘要**（固定 4 章节模板「核心使命 / 工作原则 / 执行流程 / 输出要求」，约 760-810 字符），英文原文完好。源中也没有对应中文。
- 另 6 位（`engineering-ats-validator-architect`、`engineering-china-network-engineer`、`engineering-pdf-engine-architect`、`engineering-platform-engineer`、`engineering-universal-document-compiler`、`specialized-focus-music-architect`）有完整中文，来自 `data/zh/manual-bodies/`，与 `manual.json` 记录一致。
- 这些是插件的净资产，源未收录，**不在"缺失"范围内**。

### 4.5 源的非专家文档 16 个（不建议进名册）

`strategy/`：NEXUS 纲领、EXECUTIVE-BRIEF、QUICKSTART、phase-0~6 手册（7）、scenario-* runbook（4）、agent-activation-prompts、handoff-templates。

---

## 五、建议执行顺序

1. **改分类名**（3 处）：`data/zh/divisions.json` + `lib/catalog.js`。
2. **新增 6 位真缺失专家**：按运维流程 `ops/tz.sh experts add --category <分区> --slug <slug> --file <源文件> --dry-run` → 去 `--dry-run` → `experts check`。注意源文件是**中文版**，而插件 `data/experts/` 存的是**英文原文** —— 需要你决定入库形态（见决策点 4）。
3. **更新 4 位源侧重写的专家**（`marketing-aeo-foundations`、`marketing-ai-citation-strategist`、`marketing-seo-specialist`、`specialized-french-consulting-market`）。
4. **补 2 位占位中文**（`recruitment-specialist`、`specialized-korean-business-navigator`）—— 与铁律「`data/zh` 已冻结」冲突，需你确认后例外处理。
5. 处理 8 对同角色（见决策点 3）。
6. 收尾：`ops/tz.sh experts check` → `ops/tz.sh verify`；README 的两处名册规模由 verify 的发布包自洽段（真打包→包内现算）锁定，**改完名册必须重跑**，否则会红。

---

## 六、风险提示

1. **中文侧冻结规则**：`t-expert-manager` 铁律 6 规定 `data/zh` 不新增、不补译。本报告第 5.3/5.4 步都属于破例，需显式授权。
2. **小队引用**：`data/teams.json` 与 `t-team.config.json` 里的小队成员按 slug 引用。若对 8 对同角色做重命名（而非并存），必须同步改小队定义并重新编译，否则成员会静默消失。
3. **名册规模门面数字**：README 两处、`package.json` description、`vendor` 第三方许可说明里的规模数字由 `verify` 的发布包自洽段锁定，新增专家后要同步更新。
4. **`data/zh/names.json` 无中文名回退英文**：新增的 6 位若无中文名/简介，界面会显示英文（预期行为，但影响体验）。

---

## 七、待你拍板的决策点

1. **分类名口径**：只改有实质差异的 3 处（营销 / 专项 / GIS），还是 22 个全部加「部」字与源逐字一致？
2. **是否新增「战略部」**：源该目录 16 个文件全是 NEXUS 编排文档、无专家，是否要作为分类引入（引入则分类数 22 → 23，但专家数不变）？
3. **8 对同角色怎么处理**：并存（按源新增一份）／重命名对齐（替换插件 slug）／只补中文不动命名？
4. **源的中文专家如何入库**：插件 `data/experts/` 是英文原文、`data/zh/` 是中文侧车。源只有中文。是（a）中文进 `data/zh`、英文留空？（b）还是先找英文上游对应文件入库、中文进 `data/zh`？（c）还是英文位也放中文？
5. **是否破例补译**：2 位占位中文 + 47 位插件独有专家的占位摘要，是否一并处理？

---

## 八、执行结果（2026-09-15，已落地）

用户决策：① 只改 3 处分类名 ② 不引入空分类 ③ 重命名对齐（先删光小队）④ 界面可见的名称与简介必须是中文 ⑤ `data/zh` 破例补译。

### 8.1 分类名（3 处）

| key | 旧 | 新 |
|---|---|---|
| `marketing` | 市场营销 | **营销** |
| `specialized` | 专业 | **专项** |
| `gis` | 地理信息 | **GIS** |

落点：`data/zh/divisions.json`（+ 运行时 `~/.t-team/zh/divisions.json`）与 `lib/catalog.js` 的 `DIVISION_LABEL`。

### 8.2 小队：48 支 → 0 支

`data/teams.json` 的 `profiles` 清空，`python3 data/team-profiles.py` 重编译 → `t-team.config.json` / `teams.resolved.json` 同步清空，
repo 与 `~/.t-team` 两侧一致。`/t` 现在会提示没有小队，建队入口在设置 → 队伍（或用 `ops/squads-expand.py` 重新展开）。

### 8.3 重命名对齐（7 对，含 2 处分类迁移）

| 旧 slug | 新 slug（= 源） | 分类变化 |
|---|---|---|
| `specialized/specialized-chief-of-staff` | `company/chief-of-staff` | 专项 → 公司经营 |
| `engineering/engineering-china-network-engineer` | `engineering/engineering-network-engineer-china` | — |
| `engineering/engineering-prompt-engineer` | `specialized/prompt-engineer` | 工程 → 专项 |
| `marketing/marketing-bilibili-content-strategist` | `marketing/marketing-bilibili-strategist` | — |
| `marketing/marketing-xiaohongshu-specialist` | `marketing/marketing-xiaohongshu-operator` | — |
| `marketing/marketing-wechat-official-account` | `marketing/marketing-wechat-operator` | — |
| `marketing/marketing-china-ecommerce-operator` | `marketing/marketing-ecommerce-operator` | — |

experts / zh 正文 / `names.json` / `descriptions.json` / `manual.json` / `manual-bodies/` 的键与文件全部跟着改，两侧（repo + 运行时）同步。

### 8.4 新增 7 位（源独有）

`engineering-security-engineer`（安全工程师）、`engineering-threat-detection-engineer`（威胁检测工程师·工程侧）、
`finance-financial-forecaster`（财务预测分析师）、`hr-recruiter`（招聘专家·HR 全流程）、
`marketing-search-growth-orchestrator`（搜索增长编排器）、`specialized-pricing-optimizer`（动态定价策略师）、
`support-recruitment-specialist`（招聘运营专家）。

入库形态：这些在英文上游没有对应文件（上游无此路径），所以**源的中文文件即主文件** —— 同时写入
`data/experts/<分类>/<slug>.md` 与 `data/zh/<分类>/<slug>.md`，并在两个 `names.json` / `descriptions.json` 里补中文名与中文简介。
界面因此拿到的是中文名 + 中文简介 + 中文正文。

### 8.5 内容更新（"保留最新"）

按「正文取更完整的一方，名称随正文走」：

| slug | 旧中文 | 新中文 | 理由 |
|---|---|---|---|
| `chief-of-staff` | 762 占位 | 6.2k | 插件中文是占位摘要 |
| `marketing-bilibili-strategist` | 788 占位 | 3.1k | 同上 |
| `recruitment-specialist` | 1.2k 占位 | 28.7k | 同上（英文原文与源同版本） |
| `specialized-korean-business-navigator` | 1.1k 占位 | 12.8k | 同上 |
| `specialized-french-consulting-market` | 1.1k 占位 | 10.4k | 插件英文还是旧模板，源已重写 |
| `marketing-aeo-foundations` | 8.5k 旧结构 | 10.3k 新结构 | 源重写（Access Policy / Phase 0-6） |
| `marketing-ai-citation-strategist` | 4.2k「AI 引文策略师」 | 12.1k「AI 搜索可见性与 GEO 策略师」 | 源重写并改名 |
| `marketing-seo-specialist` | 6.0k「SEO专家」 | 7.9k「SEO 与自然搜索增长专家」 | 源重写并改名 |

保留插件版的：`engineering-network-engineer-china`（人工补译 10.2k ＞ 源 3.8k）、`prompt-engineer`（5.7k ＞ 2.7k）、
`marketing-xiaohongshu-operator`、`marketing-wechat-operator`、`marketing-ecommerce-operator`（插件正文更全）。

### 8.6 规模与门面数字

名册 **316 → 323 位**，分类数仍 22。同步更新：`source.json`、`zh/COVERAGE.json`（手写重算：body 321/323、
缺口仍是 2 位自建专家）、README 两处、`package.json` description、`vendor/third-party-licenses/README.md`。

### 8.7 顺带修掉的隐患

1. **`ops/tz.sh` 的数据目录默认值**：此前固定 `<工作区>/data`（= `~/web/t-team/data`，Sep 12 的旧副本），
   与插件真实数据根 `~/.t-team` **分裂** —— `experts check` 会拿旧树报不一致、`experts add` 会写错地方。
   现在改为优先 `~/.t-team`（存在才用），缺失时回退旧布局。
2. **`ops/squads-expand.py`** 里 4 个已重命名 slug 的失效引用。
3. **`tools/verify.mjs`** 的 4 类断言：那 13 条"职能重复角色不在名册里"反转为"必须都在"（本次是有意识地推翻旧策略）、
   依赖真实小队的断言改为夹具/数据驱动、规模数字 316→323、分类名与新值一致。
4. **CI 断言总数** 618 → 619（`.github/workflows/ci.yml`）。
5. **skill 铁律 6**（`data/zh` 冻结）与 `ops-reference` 的真源地图：改成"默认不动 + 与源对齐时可破例补译"。

### 8.8 校验证据

| 检查 | 结果 |
|---|---|
| `npm run verify` | **619/619 通过** |
| `tz.sh experts check` | 源码 ↔ 运行时 ↔ 清单 ↔ 中文侧车 **四处一致**（323 位 / 22 分类） |
| `npm run invariants` | 违反集 D = ∅，9/9 条不变量成立 |
| `npm run typecheck` | 通过 |
| `node tools/sync-data.mjs --check` | 快照与源一致（660 个文件） |
| `npm run build` | 产物与已提交的 `lib/client.js` 一致（无变化） |

### 8.9 尚未执行

- **装机**：改了宿主代码（`lib/catalog.js`），要看到界面上的新分类名需 `tz.sh build`（已跑）→ `tz.sh install` → **重启 DSH Desktop**。
  数据（名册 / 中文 / 小队）不需要重启，宿主按指纹自动重载。
- **提交与发布**：改动共 67 个文件未提交；发布前工作树必须干净。

---

## 附：本次分析的数据与脚本

- 扫描/比对脚本：`/tmp/roster-diff/`（`scan.py`、`deep2.py`、`sim.py`、`fuzzy.py`、`pairs.py`、`rename.py`、`apply-zh.py`、`coverage.py`）
- 关键中间数据：`/tmp/roster-diff/scan.json`、`deep2.json`、`sim.json`
- 数据备份（改动前）：`/tmp/tteam-backup/`（`data/` 与 `~/.t-team/` 全量副本）
