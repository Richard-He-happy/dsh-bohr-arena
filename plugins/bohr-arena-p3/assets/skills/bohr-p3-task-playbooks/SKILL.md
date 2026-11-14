---
name: bohr-p3-task-playbooks
description: 第三期 33 题逐题打法：按文献阅读、学术写作、科研图形、学术演示四大赛道给出题目要点、契约字段、评分映射与失败模式。当针对具体学术效率题型设计 Skill 时使用。
version: 1.0.0
---

# 第三期 33 题逐题打法（使用指引）

## 1. 用途与何时使用

拿"具体题目"时读这一套。它回答四件事：这题要交什么、契约长什么样、rubric 的分数怎么落成检查项、哪些写法会掉分。

- 只知道赛道、想知道题级细节 → 读对应赛道的 reference。
- 已经确定题目 → 先读该题的"目标 + 契约"，再照着"有效结构"搭包。
- 写完后 → 用第 4 节通用检查项 + 该题"失败模式"逐条对照。

逐题细节在四个文件里，本文件只给阅读顺序与共性检查，不重复题目内容：

| 赛道 | 文件 | 题数 | 契约形态 |
|---|---|---|---|
| 文献阅读 | `references/reading.md` | 10 | 业务型 dict（`result`/`claims`/`uncertainties`） |
| 学术写作 | `references/writing.md` | 14 | 交付型 dict（`deliverable`/`preserved_facts`/`evidence_map`/`change_log`） |
| 科研图形 | `references/graphics.md` | 5 | 产物型 list（`editable_source`/`export_artifact`/`content_map`/`compliance_checks`/`exceptions`） |
| 学术演示 | `references/slides.md` | 4 | 产物型 list（同上，pptx 语义） |

## 2. 怎么读一道题（固定 5 步）

1. **判契约形态**：题面 `output_contract` 是 dict（业务/交付）还是 list（产物）？→ 决定 `result.json` 骨架。
2. **判"必做对象"**：workorder / scope / target-fields / claims-to-verify / comparison-workorder 等显式清单；**清单一律优先于自由发挥**（没按清单枚举 = 完成度直接掉档）。
3. **判"证据单位"**：每题都要求"结论→来源→定位→逐字引文"。先想清楚此题的证据单位是段落、表格行列、图号子图、XML 节点还是页面。
4. **判"数量/上限约束"**：字数、页数、时长、实体数、关系数、风险条数、规划单位合计、目标个数——这些是硬约束，写进脚本校验。
5. **判"诚实边界"**：哪些必须写"未报告/不适用/无法确定"，哪些禁止反推（照片不造数据点、无公式表示不反推公式、未支持≠被证伪、不把推测写成结论）。

## 3. 三种通用骨架（按契约形态套用）

### 3.1 业务型（reading）

```
SKILL.md（用途/契约/流程/schema/证据规范/降级/自检）
scripts/main.py     init / show / check / build（+ verify 可选）
scripts/<core>.py   解析与校验核心（可选第二脚本）
references/*.md     schema、判据/词表、检查清单（≤3）
```

流程：`init` 建索引 + partial result → `show` 打印带 locator 原文 → Agent 写工作稿（draft/answers/verifications）→ `check` 校验 quote/字段/覆盖 → `build` 组装主产物 + result.json。

### 3.2 交付型（writing）

同上，但工作稿是"成稿 + 事实/证据/改动三张表"；`check` 额外做**保真校验**（数字/单位/引用/术语逐字对比）与**workorder 逐项回执**；`build` 输出的主产物必须是可编辑文稿。

### 3.3 产物型（graphics/slides）

流程：`init`（扫 case/workorder/材料 + partial result）→ Agent 写 `plan.json`（实体/关系/数值 或 页级计划，**每条带 source+quote**）→ `check`（quote 命中、workorder 覆盖、数量达标）→ `build`（确定性渲染 SVG/PPTX + 真实导出 + content_map + compliance）→ `selfcheck`（复检断言）。

要点：**布局由脚本确定性生成**（不写坐标），内容与措辞由 Agent 决定；渲染失败必须落最小合法产物 + `partial`。

## 4. 跨赛道通用检查项（写完后逐条过）

| # | 检查项 | 判定 |
|---|---|---|
| 1 | 契约键齐全 | `output_contract` 每个键都在 `result.json`；list 型逐键 `CONTRACT_MAP` 比对 |
| 2 | 必做对象全覆盖 | 清单里的每个 id 都有对应条目（缺一即 `partial` 并写原因） |
| 3 | 引文逐字 | 每条 quote 能在材料中逐字命中；未命中只能降级或进 `pending_human` |
| 4 | 定位可用 | locator 指向真实段落/表行/图号/页/节点，可被第三方复核 |
| 5 | 数值保真 | 数字/单位/量级/年份/样本量与原文字面一致；换算另存原值 |
| 6 | 状态诚实 | `ok/answered`、`partial`、`insufficient_evidence`、`input_error` 与实情一致 |
| 7 | 计数自洽 | 覆盖/状态/分类计数相加等于总数；图例项数=编码分类数；PDF 页数=页数要求 |
| 8 | 产物真实 | 可编辑源非截图；PDF 有页对象；PNG 解出 IHDR；pptx 可解压 |
| 9 | 兜底成立 | 无工作稿/空输入/坏 JSON 三种情况均产出合法 minimal 交付、退出码 0 |
| 10 | 稳定复跑 | 同输入两次运行结构一致（不依赖时间/随机/机器） |

## 5. 题型识别速查

| 题面关键词 | 题型 | 读哪个文件 |
|---|---|---|
| 图表解析、问答、结论提取、事实核验、公式、复现、benchmark、清洗 | 阅读类 | `reading.md` |
| 章节稿、模板适配、证据驱动写作、客户端、结构诊断、审稿回复、翻译、基金、开题、长文档、成果转化、benchmark、思维导图 | 写作类 | `writing.md` |
| 示意图、数据图表、机制图、通路图、装置图、技术路线、graphical abstract | 图形类 | `graphics.md` |
| 论文转 PPT、PPT 生成与编辑、汇报内容组织、模板与格式适配 | 演示类 | `slides.md` |

## 6. 与其他技能的分工

- 包怎么组织、怎么冒烟：`bohr-p3-skill-blueprint`。
- 用云端批量建包、打包、终检、提交：`bohr-p3-cloud-pipeline`。
- 该题该用重 roll / patch / 重做：`bohr-p3-scoring-strategy` 与 `bohr-p3-overview` 的决策树。

## 7. 使用提示

1. 每题先看"目标 + 必产物/契约"两行，再看"评分点→实现映射"，最后用"失败模式"自查。
2. "有效结构"是本期内实测有效或题面强制的做法，可直接抄成 SKILL.md 的流程段；但不要照抄题面原文大段。
3. 逐题 failures 里出现"膨胀/堆文件/加功能"时，一律回到极简骨架，不要用功能覆盖来解决问题。
4. 同一赛道可复用工作稿 schema（字段/状态/证据结构），但**必做对象与数量约束必须按题改动**。
