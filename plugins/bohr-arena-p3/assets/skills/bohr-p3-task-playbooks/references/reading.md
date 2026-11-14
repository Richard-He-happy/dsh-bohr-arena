# 文献阅读赛道 10 题打法

> 契约：业务型 dict（`case_id`/`status`/`result`/`claims`/`uncertainties` + 信封字段）。铁律：清单优先枚举；quote 逐字；未报告≠0；不反推材料没给的。

### reading-02 科研图表解析
- 目标/输入：每例 1 张原图 + 全部原表 → 结构化解析；照片/示意图写"不适用"，不造数据点、误差线。产物 `figure_elements.json`（轴/图例/系列/点/误差线/显著性/比例尺/子图）+ `table_rows.csv` + `report.md`。
- 契约：`claims` 带 `kind`（directly_read/inferred/undetermined）；像素读数四件套（值+单位+`approx:true`+误差）+ `px_box`；`coverage{required,parsed,missing}`。
- 映射：完成度→按 `organizer_supplied_scope` 枚举，产物数=清单数；正确性→轴类型（log/linear/双轴）+刻度/单位一致；可核验→quote 命中校验。
- 结构：`init` 打清单与表 id → 逐图判"是否定量图" → `check` 校验 → `build` 汇总。
- 失败：照片硬解析成曲线编数据；只写总结无 locator；单位静默统一（mV 当 V、无单位当无量纲）。

### reading-03 文献智能问答
- 目标/输入：1 篇带段落编号论文 + 3 个中文问题逐题作答；未报告就说未报告，不补外部知识。产物 `result.json`（answers/unanswered_parts/coverage）+ `answers.json` 兼容件。
- 契约：`answers{question_id,answer,conditions,status,sub_questions[]}`；`claims{claim_id,text,kind,evidence[]{paper_id,paragraph_id,quote,section}}`；`unanswered_parts` 写"缺什么+为什么+需要什么"。
- 映射：完成度→按问题清单建槽位（含无法回答者）题数=输入数；正确性→数值/单位/比较对象逐字对齐；可核验→quote 命中对应段落。
- 结构：五步"问题分解→段落检索→证据筛选→作答→自检"；每题带 status 与证据条数。
- 失败：把"未报告"写成"不存在"或编答案；quote 中文改写/拼接；只给整体总结。

### reading-04 多文档比较与整合
- 目标/输入：读 `comparison-workorder.json` + 全部语料，多篇落到同一套字段；先判可比性（任务/指标/单位/材料/污染物/预算）再定量综合。产物 `comparison_matrix.csv` + `field_dictionary.json` + `comparability.json`。
- 契约：单元格 `status`∈reported/not_reported/source_conflict/not_comparable，带单位/数据集/指标口径/条件/quote；`synthesis{allowed,basis}` 仅全部可比时给数；`coverage` 六项计数。
- 映射：完成度→文档×字段建笛卡尔骨架，计数=期望值；正确性→每格值来自该文档该段（跨文档串值是最大错分点）；完整性→六类字段组齐、非可比项有条目。
- 结构：`field_dictionary`（先对齐定义）→`matrix`（填值）→`comparability`→`agreement`（一致/冲突归因）。
- 失败：退化成多篇单文档摘要拼接；跨文档串值/错配 id；无可比性判定就 pool 不同数据集/染料；冲突只记一方。

### reading-05 阅读客户端
- 目标/输入：同一次运行内走完"打开→定位→选中提问→保存批注→回看→导出"闭环。产物 `reader/index.html`（单文件自包含、不引 CDN/外部字体）+ `anchors.json`（段落→物理页/印刷页/字符起止）+ 批注问答记录 + 导出件。
- 契约：`closed_loop[]` 七步各带 status/输入/输出/artifact；`anchor_precision` 四档（char_exact/paragraph_level/page_level/unresolved）并计数；答案 evidence 含物理页+印刷页+paragraph_id+quote，且与 `selections[].quote` 一致。
- 映射：完成度→七步逐步执行并记录 artifact，缺步即 partial；正确性→答案只基于选中段落上下文；可核验→char offset + 页码双记录。
- 结构：选区上下文="选中句 ± 所在段落 + 章节标题"，落 `context_scope`；批注边产生边落盘。
- 失败：只交问答 JSON 无客户端；HTML 引 CDN（无网络=空白）；页码靠猜、物理页/印刷页不分；答案脱离选中文本。

### reading-06 文献结论与数据提取
- 目标/输入：按 `target-fields.json` 逐 `field_id` 输出值/单位/统计量/条件/对照物 + `paragraph_id` + 逐字 quote + 四状态（reported/not_reported/source_conflict/extraction_failed）。产物 `result.json`（`result.fields[]`+`coverage`）+ 抽取表。
- 契约：字段含 `source{section,paragraph_id,table_id,row,col}`、`semantic_check`；`value` 保留原文字面（±、范围、n=3、p<0.05），另给 `parsed_value/parsed_unit`；换算另存原值+规则。
- 映射：完成度→先写全部 field_id 骨架，字段数=请求数；正确性→quote 命中+数字在 quote 内+单位在 quote 或紧邻表头；可核验→paragraph_id 真实存在。
- 结构：结论/限制/推测三分类 + hedge 词表（may/suggest/indicate）；每字段一条 claim 带 `claim_type`。
- 失败：猜值/补全缺失（"guessed value is not extraction"）；quote 命中但语义错位（数值配错条件）；缺字段省略；把 "may indicate" 写成 "proves"。

### reading-07 文献证据溯源与事实核验
- 目标/输入：`claims-to-verify.json` 里是**问题不是事实**；拆复合句为子判断，按完整上下文判 supported/partially_supported/contradicted/insufficient_evidence。产物 `result.json`（判定放 `result.verifications[]`，不与契约 `claims` 混用）+ `evidence_cards.jsonl` + 报告。
- 契约：每条含 `sub_claims{type:fact|comparison|causal|scope}`、`aggregation_rule`、`rationale`；`coverage` 四类计数自洽。
- 映射：完成度→每条输入 claim 都有 verdict，子判断独立判定；正确性→与原文 entailment 一致，校验否定词/比较词/显著性保留（误支持是最大扣分项）；可核验→五段证据链齐全。
- 结构：四级判定定义表 + 决策树；"关键词命中但方向不符"要区分 partially/contradicted；未支持的推断只能 insufficient_evidence。
- 失败：把主题相关当支持；把未支持的推断判 contradicted；不拆复合论断；quote 只截关键词丢否定/比较。

### reading-08 公式解析与数学推理
- 目标/输入：公式对象无歧义还原为 LaTeX/MathML + 变量表（定义/单位/范围/出处，分原文定义·推断·常识）+ 推导（假设/近似/边界）+ 可复算数值核验；无公式表示的案例如实报 partial/insufficient_evidence。产物 `result.json` + `formulas.tex` + `symbol_table.csv`。
- 契约：`formulas{formula_id,eq_number,latex,structure{fracs,subsups,radicals,matrices,cases},symbols[],parse_confidence}`；`variables{definition_basis,locator}`；`derivations[]`/`numeric_checks[]` 带假设。
- 映射：完成度→按 XML 公式节点建槽位 + 变量/推导/数值三子清单；正确性→确定性映射（mfrac→\frac、msubsup→_{}^{}、msqrt→\sqrt）+括号配对/上下标数量/符号覆盖；可核验→符号定义给 locator+quote。
- 结构：先解析 MathML 再补缺，缺失标近似/不可读；`formulas.tex` 每条一行带 `% source_id`。
- 失败：只贴一段 LaTeX；把公式目录 XML 当答案（题面："不是线性化答案或推导"）；无表示时编公式或填 0；符号定义按常识猜。

### reading-09 论文复现与方法验证
- 目标/输入：真实运行包内两份候选数值方法，把论文声明指标与两份结果按**事前容差**逐项对比。产物 `result.json` + `repro_report.md` + `param_table.csv` + `comparison.csv` + `runs/*.log` + `tolerance.json`。
- 契约：`repro_checklist{kind:code|data|param|dependency|license|eval_script,status:available|missing|needs_request}`；`runs{command,exit_code,metrics}`；`comparison{within_tolerance}`；`attribution[]` 归因环境/数据/实现/描述不足。
- 映射：完成度→七环节各有产物与状态；正确性→两份方法真实运行（有 exit_code 与日志），对比值来自运行输出；完整性→六类材料齐全；可核验→每条 run 有 command+输入指纹，容差有"事前"证据。
- 结构：先写 `tolerance.json` 再跑对比并记声明步骤；参数三类来源；缺失数据/仓库显式登记。
- 失败：只写复现步骤不真跑；没有事前容差、事后凑；把仓库默认值当论文参数；伪造/抄写指标或日志。

### reading-10 文献阅读 Benchmark 与评测工具
- 目标/输入：按 workorder 建可判分/可复跑/可版本化的 Benchmark：题卡+运行器+逐题评分+面板+失败样例+版本对比。产物 `benchmark/cards.json` + `scores.csv` + 报告 + `version_diff`。
- 契约：`cards{item_id,task,source_refs,reference_answer,scoring_rule,difficulty,license,version}`；`scores` 三条指针 `raw_output_ref/config_ref/scoring_record_ref`；六覆盖方向各有落点。
- 映射：完成度→六件套齐、题卡数=workorder 项；正确性→自动分与规则结论一致（明显对/错/边缘各 1 条自测）；可核验→三指针可解析到实际文件片段。
- 结构：运行器固定预算与输出归一 → 逐题评分 → 面板从 scores 读取（不手写）→ 失败样例转下一版专项题。
- 失败：交"题单+截图"无可跑工具；自造 gold answer/伪造分数；把合成 checker 日志当真实比赛分数；只有总分无三指针。

### reading-11 文献数据清洗与标准化
- 目标/输入：抽取记录 + 单位/数字规则 + 行身份 → 可统计表：`cleaned.csv` + `change_log.csv`（before/after/unit/formula/precision/source）+ 待确认清单 + 异常报告。
- 契约：`counts{input_rows,output_rows,changed,unchanged,pending_review,duplicates_merged,anomalies}`；未确认值只进待确认（可留行标 `needs_review`）；每行带 `row_id`+`source_document_id`+`rule_ids`。
- 映射：完成度→五件套齐、输入/输出行数关系可解释；正确性→按 formula 复算 change_log 并与 after 比对；完整性→字段规范/单位/同义/缺失异常/重复/来源记录六方面；可核验→每行可回输入行与规则。
- 结构：规则库带编号与优先级、可增删；换算留原值+公式（如 ×1e-3）；区间/误差/精度不压成单值。
- 失败：只演示换算脚本无规则库/变更记录；未知单位硬猜或按 0；只出成品表无行级记录；把不同条件/物质行合并。
