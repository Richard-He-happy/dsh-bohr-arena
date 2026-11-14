# 四赛道 33 题总表

> 题名为公开题面信息。表中"契约形态"指隐藏案例 `output_contract` 的字段族；"已知有效路线"来自第三期实测（不含个人成绩与名次）。

## 契约形态速查

| 形态 | 根字段 | 出现在 |
|---|---|---|
| 业务型（dict） | `case_id`、`status`、`result`、`claims`、`uncertainties` | 全部 reading |
| 交付型（dict） | `case_id`、`deliverable`、`preserved_facts`、`evidence_map`、`change_log` | 全部 writing |
| 产物型（list） | `case_id`、`status`、`editable_source`、`export_artifact`、`content_map`、`compliance_checks`、`exceptions` | 全部 graphics / slides |

三种形态都要**原样回填全部键**（缺值 `null`/`[]`，不改名、不删未知键），并统一追加信封字段：`sources`、`uncertainty`、`pending_human`、`errors`、`degradations`、`changes`、`runtime`。`status` 取值按题面（业务型常见 `answered|partial|insufficient_evidence|input_error`，产物型常见 `ok|partial|insufficient_evidence|input_error`）。

## reading（10 题）

| key | 题名 | 题型特征 | 主产物 | 已知有效路线 |
|---|---|---|---|---|
| reading-02 | 科研图表解析 | 图片+表格解析；照片/示意图可能"不适用" | `result.json` + `figure_elements.json` + `table_rows.csv` + `report.md` | 按清单枚举对象；定量图逐项落轴/图例/点；照片写 `applicable:false`；像素读数四件套（值+单位+近似+误差） |
| reading-03 | 文献智能问答 | 论文+中文问题，逐题作答 | `result.json`（answers/claims/unanswered_parts/coverage） | 问题分解→段落检索→证据筛选→作答→自检；每题 status；"未报告"≠"不存在" |
| reading-04 | 多文档比较与整合 | 多篇论文统一字段比较矩阵 | `result.json` + `comparison_matrix.csv` + `field_dictionary.json` + `comparability.json` | 先对齐字段定义再填格；六维可比性判定；禁止跨文档串值、禁止 pool 不同数据集/染料 |
| reading-05 | 阅读客户端 | 打开→定位→选区提问→保存→回看→导出闭环 | `reader/index.html`（单文件自包含）+ `anchors.json` + 批注/问答记录 + `result.json` | 七步闭环逐步留产物；物理页/印刷页双记；扫描件降级为 partial + pending |
| reading-06 | 文献结论与数据提取 | 按字段清单逐字段抽取 | `result.json`（fields[]+coverage） | 逐 field_id 建槽位；值/单位/统计量/条件/对照物六要素；四状态 reported/not_reported/source_conflict/extraction_failed |
| reading-07 | 文献证据溯源与事实核验 | 待核验论断→四级判定 | `result.json`（verifications[]）+ `evidence_cards.jsonl` | claims 是问题不是事实；复合句拆子判断；四级 verdict；"未支持≠被证伪" |
| reading-08 | 公式解析与数学推理 | 公式结构化+变量表+推导+数值核验 | `result.json`（formulas/variables/derivations）+ `formulas.tex` | MathML/XML 确定性映射到 LaTeX；符号表覆盖全部符号；无公式表示时必须 insufficient_evidence |
| reading-09 | 论文复现与方法验证 | 真实运行两份候选方法 + 差异归因 | `result.json` + `repro_checklist` + `tolerance.json`（事前） + 运行日志 + `comparison.csv` | 七环节闭环；容差**事前**声明；参数三类来源（论文/代码/自定）；不伪造运行记录 |
| reading-10 | 文献阅读 Benchmark 与评测工具 | 题卡+运行器+评分表+报告 | `benchmark/cards.json` + 运行器 + `scores.csv` + 报告 + `result.json` | 分数→题→原始输出→配置→评分记录三指针可追；合成 checker 日志必须标注非真实分数 |
| reading-11 | 文献数据清洗与标准化 | 抽取记录→统一字段+变更日志 | `cleaned.csv` + `change_log.csv` + 待确认清单 + 异常报告 + `result.json` | 规则编号+优先级；每改动可复算（rule_id+formula）；未知单位不硬猜；不把不同条件行合并 |

## writing（14 题）

| key | 题名 | 题型特征 | 主产物 | 已知有效路线 |
|---|---|---|---|---|
| writing-01 | 学术论文写作 | 材料→完整章节稿 | `manuscript.md` + 索引/证据/事实保全 + `result.json` | 章节完整性优先；事实性论断逐条 locator+quote；不造参考文献；该题对包体极敏感→极限稳健版（≤4 文件/≤30KB） |
| writing-02 | 学术格式与模板适配 | 稿件套模板，格式规格可核 | 可编辑源文件 + `format_spec.md` + `fidelity_report.json` + 导出预览 | 从模板反推规格（不凭经验）；内容单元前后计数一致；字体替换必须真实发生 |
| writing-03 | 文献证据驱动写作 | 论断→证据表→成稿三段 | `claims.json` + `evidence_table.json` + `evidence_driven_draft.md` | 三段可按 claim_id join；证据强度分级；相关性不写因果；冲突证据不隐藏 |
| writing-04 | 学术写作客户端 | 收稿→按工单局部改→accept/reject→导出 | `revised_manuscript.md` + `revision_records.json` + 回执 + 预览 | 逐 target 落有源注记；原文段落/表格/公式不动；回执真实（import/accept/reject/version/rollback） |
| writing-05 | 论文结构与逻辑优化 | 结构诊断+可执行编辑方案 | `structural_review.json` + `edit_plan.md` + `outline_after.md` | 六维逐条 finding 带 locator+quote；动作可执行（move/merge/split）；不交整篇改写稿 |
| writing-06 | 结果与讨论章节写作 | 图表数据→Results+Discussion | `results_discussion.md` + `extracted_data.csv` + `claim_strength.md` | 结果段只陈述观察，讨论段解释/对照/局限；数值逐项回图表；趋势不写因果 |
| writing-07 | 审稿回复与论文修改 | 逐条意见→修订稿+回复信+定位表 | `revised_manuscript.md` + `response_letter.md` + `comment_ledger.json` | 意见拆子要求逐条给 decision；"已修改"必须能在修订稿命中；证据状态诚实（未补做=not_done） |
| writing-08 | 学术翻译与双语写作 | 逐段对照译文+术语表+数字核对 | `translation.md` + `glossary.csv` + `number_check.csv` | 术语全篇唯一译法；数字/单位/引用原位保留；否定范围与限定强度不变 |
| writing-09 | 基金申请书写作 | 七要素章节稿+矩阵+规划单位 | `proposal.md`（1600–2600 字）+ `goal_matrix` + `planning_units.json` + `risks.md` | 逐项执行 workorder（3 目标/≤100 单位/≥3 风险/≥2 人工确认）；论文既有结果归外部作者 |
| writing-10 | 开题报告与研究计划书 | 七要素+周期相容的计划 | `proposal.md` + `timeline.csv` + `risk_register.csv` + `goal_route_map.json` | 背景写"已知—未知—待验证"缺口；问题可证伪；目标-路线-验证-成果一一对应；计划排得进周期 |
| writing-11 | 学位论文与长文档写作 | 章节级修订+跨章节一致性 | `revised_chapters/` + `revision_records.json` + 一致性报告 | 不把分章材料当已完成学位论文；两个 target 各 1 条注记；一致性覆盖术语/符号/定义/编号/引用/结论 |
| writing-12 | 科研成果转化写作 | 受众/体裁转换改写 | `converted.md` + `preservation_checklist.json` + `diff_map.md` | 关键结论/数据/限定条件必须保留；删改逐条有理由；不新增源文没有的结论 |
| writing-13 | 学术写作 Benchmark 与评测工具 | 题面+参考答案+锚点+逐题评分 | `tasks.jsonl` + `reference_answers` + `anchors` + `scores.csv` + 报告 | 锚点写成可观察现象；答案列可接受变体；逐题证据/失败类型；可复算入口 |
| writing-14 | 思维导图 | 材料→可编辑导图 | `mindmap.svg` + `mindmap.json` + `mindmap_preview.png` + `node_evidence.csv` | SVG 文字真实可编辑；层级/关系方向正确；节点与关系挂 locator+quote；类型标注事实/概括/推断 |

## graphics（5 题）

| key | 题名 | 题型特征 | 主产物 | 已知有效路线 |
|---|---|---|---|---|
| graphics-01 | 科研示意图生成与编辑 | 材料→实体关系示意图 | 分层 SVG + 真实 PNG + PDF + `figure_model.json` + `result.json` | 先建"实体—关系"中间表示再渲染；SVG id↔content_map id 一一对应；图例项数=编码分类数 |
| graphics-02 | 科研数据图表生成与编辑 | 源数据→数据图表 | SVG + PNG + PDF + `chart_model.json` + `result.json` | 每个柱/点回溯到源表行号与逐字数值；柱高可回算；图例按 series 显式绑定颜色 |
| graphics-03 | 生物机制图与通路图 | 机制文字→通路图 | SVG（分区室/实体/边）+ PNG/PDF + `figure_model.json` | 激活/抑制/结合/修饰/转运可区分且方向正确；区室归属正确；基因斜体蛋白正体；反馈环不丢 |
| graphics-04 | 实验装置与技术路线图 | 装置/工艺/计划→装置图+路线图 | SVG + PNG/PDF + 部件/连接/步骤模型 | 部件名与数量逐字；接口对应；流向箭头有端点；步骤编号与正文一致；技术路线分阶段（目标/方法/输入输出/依赖） |
| graphics-05 | Graphical Abstract（图形摘要） | 研究→单页四段式图形摘要 | SVG + PNG + PDF + `figure_model.json` | 四段 problem→method→results→implication；每面板 claim+source；编码有图例与单位；两次运行版式一致 |

## slides（4 题）

| key | 题名 | 题型特征 | 主产物 | 已知有效路线 |
|---|---|---|---|---|
| slides-01 | 论文转学术 PPT | 论文→主线成立的可讲幻灯片 | `presentation.pptx` + `presentation.pdf` + `plan.json` + 逐页 content_map | 先出页级计划（每页一个主张+论文图表定位）再成稿；图表编号与引用对得上；不段落搬家 |
| slides-02 | 学术 PPT 生成与编辑 | create / edit / adapt 三模式 | pptx（保模板继承）+ PDF + `plan.json` + `claim_source_map.json` + `changes.json` | 先判 mode；edit 只改目标页、保留其余页；逐页金标准+逐页 diff+版本记录+导出检查（patch 有效） |
| slides-03 | 学术汇报内容组织 | 目的/听众/时长→可讲汇报 | pptx + PDF + `plan.json` + `qa_prep.json` + 逐页映射 | 目标/听众/叙事/取舍记录/问答预案闭环；页数与时长匹配；证据强度不越级 |
| slides-04 | 学术 PPT 模板与格式适配 | 内容真实套模板 | pptx（真继承母版/版式）+ 一致 PDF + `template_map.json` + 逐页偏差 | 幻灯片解析模板（母版/版式/主题哈希）→占位符映射→批量一致性；禁止"新建空白+贴文本框"的伪继承 |

## 读表提示

1. 先用本表确定该题的**契约形态**与**主产物**，再去看逐题打法（`bohr-p3-task-playbooks` 的四个 references）。
2. "已知有效路线"是结果层结论；具体到字段与校验，以逐题打法与交付契约 references 为准。
3. 图形/幻灯片题的根字段是 list 型 7 字段，不要套用阅读/写作的 dict 型 5 字段。
