# yunzhi-doc-quality-expert · 腾讯云知知识评审专家

> WorkBuddy Agent 型专家 · 面向云计算产品文档的一站式质量检测 · 七维全量检测 + 百分制综合评分 · 标准化 JSON + 可视化 HTML 报告

## 专家简介

- **专家名称**：腾讯云知知识评审专家
- **专家类型**：Agent 型（`expertType: agent`）
- **行业分类**：`10-ProjectQuality`（项目质量）
- **核心技能**：`cloud-doc-quality-suite`

腾讯云知知识评审专家 面向售前弹药库文档（产品白皮书 / 案例集 / 解决方案 / 产品介绍 / 产品彩页 / 竞品分析 / 快速入门 / 销售一指禅 / 交付标准流程 / POC 测试申请指引 / 产品报价指引），一键完成七维全量质量检测与百分制综合评分。

## 七维检测能力

| 维度 | 检测内容 |
|------|----------|
| 🏗️ 结构质量 | 基于官方模板对比的结构完整性、产品定位、场景、案例、技术深度 |
| ⏰ 时效性 | 标题 / Roadmap / 版本 / 封面中超过 6 个月的过期时间 |
| 🔗 超链接异常 | HTTP / DNS / 锚点 / 平台文档链接可用性 |
| 📐 排版格式 | 标题层级、空段落、列表、表格、标记闭合（pptx/xlsx 自动跳过） |
| 📝 产品写作规范 | 《腾讯云产品写作规范》三大类别：用词 / 数字及数量 / 词汇表 |
| 💰 货币规范 | 非美元货币单位与货币符号格式（中文文档自动跳过） |
| ⚖️ 法律合规 | 五大核心红线：国家元素 / 公序良俗 / 赛事元素 / 虚假宣传 / 控标字眼 |

七维检测完成后执行**百分制综合评分**：内容时效性 45 + 结构规范性 45 + 内容准确性 10 = 100，内容价值性加分 +0~10，等级映射为 优秀 / 良好 / 合格 / 待改进。

## 目录结构

```
yunzhi-doc-quality-expert/
├── .codebuddy-plugin/
│   └── plugin.json                     # ★ 专家配置（运行 + 市场展示）
├── avatars/
│   └── expert.png                      # ★ 专家头像（512×512 PNG）
├── agents/
│   └── doc-quality-inspector.md        # ★ 专家定义（系统提示词）
├── skills/
│   └── cloud-doc-quality-suite/        #   内置技能（七维检测规则 + 模板 + 脚本）
│       ├── SKILL.md
│       ├── manifest.yaml
│       ├── references/                 #   七维检测规则正文
│       ├── scripts/                    #   HTML 报告渲染脚本
│       └── assets/                     #   HTML 模板 + 11 套官方文档模板
└── README.md                           #   本文件
```

## 环境配置

- **运行时**：WorkBuddy 专家市场（召唤后直接对话使用，无额外安装）
- **HTML 报告脚本**：Python ≥ 3.8（仅标准库，无第三方依赖），详见 `skills/cloud-doc-quality-suite/scripts/README.md`

## 使用方式

1. 在 WorkBuddy 专家市场召唤 **腾讯云知知识评审专家（腾讯云知知识评审专家）**。
2. 上传待检测文档（支持 .md / .docx / .pptx / .xlsx / .pdf / 纯文本）。
3. 输入触发语，例如：
   - 帮我全面检测这份文档的质量
   - 请对这份销售一指禅做语言润色和规范性检查，让表达更适合售前场景
   - 检查这份产品白皮书是否存在合规风险和写作规范问题
   - 检查这份文档的写作规范和错别字
   - 这份产品介绍的写作规范和排版有哪些需要改进的地方
4. 腾讯云知知识评审专家 自动按 `agents/doc-quality-inspector.md` 的编排流程，加载技能 `cloud-doc-quality-suite`，逐维度检测并汇总输出 JSON + 可视化 HTML 报告。

> 脚本辅助生成 HTML 报告需 Python ≥ 3.8（仅标准库，无第三方依赖），详见 `skills/cloud-doc-quality-suite/scripts/README.md`。

## 输出说明

- **JSON**：`文档名称` / `检测时间` / `文档类型` / `检测结果.<dimension>` / `统计摘要` / `scoring` / `总体评价`。
- **HTML 报告**：严格「三大模块」结构——① 文档基本信息 → ② 综合评分 → ③ 七维检测明细；每条问题固定 5 字段（问题类型 / 问题描述 / 问题位置 / 原文片段 / 修改建议）。

详细规则与 schema 见 `skills/cloud-doc-quality-suite/SKILL.md`。

## 许可

Internal use only.
