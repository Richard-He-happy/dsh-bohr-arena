# 学术写作赛道 14 题打法

> 契约：交付型 dict（`case_id`/`deliverable`/`preserved_facts`/`evidence_map`/`change_log`+信封字段）。铁律：改表达不改事实；不新增材料外内容；workorder 逐项回执；每条改动 original→revised→reason→locator。

### writing-01 学术论文写作
- 目标/输入：源论文分节文本/数据表/图注/参考文献 → 结构完整、可进入修改环节的章节稿。产物 `manuscript.md` + `materials_index.md`（材料→章节→论断）+ `evidence_map.json` + `preserved_facts.json` + `change_log.json`。
- 契约：`deliverable` 填主产物路径；`preserved_facts{fact_id,value,unit,source_id,locator,quote,status}`；`evidence_map{claim_id,source_id,locator,quote,kind}`。
- 映射：完成度→task_instruction 指定章节逐条出现（标题清单比对 covered/missing）；正确性→稿件数字/单位/DOI 在 preserved_facts 命中同一 locator；可核验→evidence_map 覆盖 ≥90% 事实论断。
- 结构：该题对包体极敏感 → 极限稳健版（≤4 文件/≤30KB、PDF 只读文件头、2MB 单文件上限、10 秒级超时、退出码恒 0、坏输入测试）。
- 失败：交提纲/建议/素材清单；自造参考文献 DOI 或补作者年份；数字取整、相关写因果。

### writing-02 学术格式与模板适配
- 目标/输入：真实稿件按目标模板适配到可交付，不丢正文/图表/公式/脚注/批注/域代码。产物可编辑源文件（docx 优先）+ `format_spec.md`（栏数/页边距/字体字号行距/标题层级/题注/参考文献样式/页码目录/导出格式，各带模板 locator）+ `fidelity_report.json` + 导出预览。
- 契约：`preserved_facts` 复用为内容单元保真（段落/表/公式/图/脚注/批注/修订/域代码前后计数）；`change_log` 记每处格式动作。
- 映射：完成度→四件齐、规格数≥要求；正确性→每条规格在成品可 grep（styles.xml/前导区）；完整性→计数一致并逐项列差异；可核验→每规格有模板 locator。
- 结构：解析模板→抽规格→适配；字体/样式真实应用不静默替换；导出前跑内容单元计数。
- 失败：只改字号加粗；凭经验编造规格；声称满足指定字体实际用默认。

### writing-03 文献证据驱动写作
- 目标/输入：论断清单→证据表→成稿三段可核对；每条论断匹配具体文献段落与逐字原文，标证据强度与支撑范围。产物 `claims.json` + `evidence_table.json` + `evidence_driven_draft.md` + `evidence_strength.md` + `reference_check.md`。
- 契约：`evidence_table{claim_id,source_id,locator,quote,source_type(原始研究/综述/指南/预印本),strength(高/中/低/不足),support_scope,conflicts[]}`；三段用 claim_id 与成稿引用锚点 join。
- 映射：完成度→三段齐、引用标记数≥证据覆盖论断数；正确性→quote 逐字命中、元数据与材料一致；完整性→论断/来源/强度/不确定性四类齐；可核验→每条 locator+理由。
- 结构：先拆论断再找证据（不要先写段落再补引用）；强度结合设计/样本量/重复验证/共识；冲突单列不隐藏。
- 失败：只做引用装饰；quote 改写/拼接冒充原文；相关写因果、单篇小样本写共识。

### writing-04 学术写作客户端
- 目标/输入：端到端"收稿→按编辑工单局部改→保留可接受/拒绝的修订记录→导出可编辑文档+真实预览"；每个 target 一条有源依据注记，原文不改。产物 `revised_manuscript.md` + 预览 + `revision_records.json` + `operation_receipts.json`。
- 契约：`revision_records{target_id,original_quote,annotation,status,reason}`；回执含导入/accept-reject 计数/版本比较/回滚重放/受控无效操作；`result.workorder_execution{target_ids,receipts,requirements_met}`。
- 映射：完成度→5 项 operation_requirements 全有产物与回执、target_ids 每个有注记；正确性→注记 quote 命中、区分注记与原研究；完整性→原段落/表/公式/引用/标题计数一致、未要求块未动；可核验→改动可在指定版本定位。
- 结构：读 workorder+源稿写操作计划→逐 target 加注记→回执→版本比较→导出；只改 target。
- 失败：把加注记做成整段改写/全篇重写；漏 target 或只做第一个；伪造回执。

### writing-05 论文结构与逻辑优化
- 目标/输入：对完整稿件做结构诊断，交付可执行修改方案（移到哪/与谁合并/从哪拆分/哪句收窄）。产物 `structural_review.json` + `edit_plan.md` + `outline_after.md`（以 finding_id join）+ `argument_map.json`。
- 契约：`finding{维度/severity/locator/quote/diagnosis/confidence}`；`action{operation:move|merge|split|narrow|delete,target,reason}`；六维：问题与贡献对齐/章节结构/论证链/段落关系与重复/结论边界/表述尺度。
- 映射：完成度→六维各≥1 条（或"本稿无问题"并给证据）、动作可执行；正确性→quote 逐字命中、diagnosis 与 quote 一致、不虚构缺陷；完整性→六维×四类问题（断裂/重复/跳跃/越界）。
- 结构：先画论证链（问题→方法→结果→结论）找断点；动作写成可执行清单；诊断与改写分离。
- 失败：通用原则无 locator；虚构缺陷或把风格偏好当结构错误；交整篇润色稿代替诊断。

### writing-06 结果与讨论章节写作
- 目标/输入：把"数据在手、图表已画"写成可投稿的 Results + Discussion：数值可回溯、趋势表述与数据相符、讨论每句对应本研究或文献。产物 `results_discussion.md`（含 Limitations）+ `extracted_data.csv`（读数带 locator）+ `evidence_map.json` + `claim_strength.md`。
- 契约：`evidence_map{claim_id,section(results|discussion),source_id,locator,quote,kind(observation|interpretation)}`；`preserved_facts{value,unit,figure_or_table_id,read_path}`。
- 映射：完成度→两节有实质内容、覆盖指定图表与字数；正确性→每个数值在 extracted_data 同 locator 命中（含单位/有效数字）、显著性表述一致；完整性→图表覆盖计数、阴性结果与不一致文献有交代。
- 结构：Results 只陈述观察（按图序或问题），Discussion 承担解释/对照/局限；用"在…条件下…；未达显著"的有边界写法。
- 失败：图读数靠猜（对数轴当线性、SEM 当 SD、mV/V 混淆）；补造 p 值/样本量；两节混写。

### writing-07 审稿回复与论文修改
- 目标/输入：受控返修：对指定基线逐条处理审稿意见（含一条意见内多个子要求）。产物 `revised_manuscript.md` + `response_letter.md` + `comment_ledger.json` + `change_locator.json` + `evidence_pending.md`。
- 契约：`comment_ledger{comment_id,sub_requirements[],decision(accept/partial/reject/clarify/invalid),change_ids[],evidence_needed}`；定位表段落 ID/原句锚点须与回复信引用一致（可 join）。
- 映射：完成度→意见数=ledger 数、子要求逐条有 decision；正确性→"已修改"能按 locator 命中改后文本、证据状态与材料一致；完整性→四件齐、每条意见有明确结论；可核验→回复信引用与定位表一致。
- 结构：六维（拆解/逐条回应/修改定位/证据补充/语气控制/版本一致性）；语气四档；需补实验的给可查证证据或说明无法补做。
- 失败：空话回复；声称"已修改"但稿中找不到；因材料不足跳过多条本可执行的修改。

### writing-08 学术翻译与双语写作
- 目标/输入：整篇学术翻译/双语写作：可逐段对照译文 + 术语表 + 数字/引用核对表。产物 `translation.md`（纯译文或"段落 ID+原文+译文"）+ `glossary.csv` + `number_check.csv` + `citation_retention.md`。
- 契约：`preserved_facts` 记数字/单位/引用/术语（含 `translated_location`）；`evidence_map` 记译文关键句→原文 locator+quote；术语全篇唯一译法。
- 映射：完成度→覆盖源文全部段落（译出段/源文段）、形态符合要求；正确性→数字/单位/年份/样本量逐项一致、引用标记与编号保留；完整性→公式/表格/题注/脚注/参考文献条目不缺；可核验→每段可追原文 locator+quote。
- 结构：先建术语表（含来源 given/derived）→逐段翻译并同步记录数字/引用→全篇回扫（尤其图注与附录）。
- 失败：数字四舍五入/顺手取整；术语漂移；漏译公式表格脚注或改图表编号。

### writing-09 基金申请书写作
- 目标/输入：七要素章节稿（立项依据/科学问题/研究目标/研究内容/创新点/技术路线/研究基础与可行性，1600–2600 字）+ 目标—工作包—里程碑—指标矩阵 + 规划单位（合计≤100）+ ≥3 风险备选 + ≥2 人工确认。产物 `proposal.md` + `evidence_map.json` + `goal_matrix.csv` + `planning_units.json` + `risks.md`。
- 契约：拟开展内容明确标注、论文既有结果归还外部作者；`workorder_execution` 逐项回执；G1/G2/G3×工作包×里程碑×指标可逐行核对。
- 映射：完成度→七节实质正文、字数落区间、四件齐；正确性→源论文事实可追、"已完成/拟开展"区分、无"首次/国际领先/填补空白"无据表述；完整性→七要素+3 目标+≥3 风险+≥2 人工确认+分项单位。
- 结构：必要性用数据与缺口论证；创新点写与某具体工作的差别；目标-内容-路线-指标逐条对应。
- 失败：把论文作者既有成果写成申请人前期基础；规划单位>100、目标不是 3 个、超时间限制；七节只写标题套话。

### writing-10 开题报告与研究计划书
- 目标/输入：七要素齐全、与给定周期/资源相容的开题方案。产物 `proposal.md` + `timeline.csv` + `risk_register.csv` + `goal_route_map.json` + `evidence_map.json`。
- 契约：`goal{question_id,objective,metric,sample,control,timepoint}`；`risk{category,trigger_signal,impact,alternative,decision_point}`；1–3 个可证伪问题；timeline 每行可 join goal_id。
- 映射：完成度→七要素齐全且实质；正确性→论断与引用一一对应、指标阈值有依据、问题可证伪；完整性→1–3 问题/目标-路线-验证-成果映射/四类风险/成果考核方式/周期内里程碑；可核验→里程碑有月份与交付物。
- 结构：背景写"已知—未知—待验证"（不是文献综述）；路线每步给输入输出与依赖；风险覆盖数据/方法/进度/伦理四类。
- 失败：背景写成综述无缺口；问题不可证伪；目标/路线/成果各写各的。

### writing-11 学位论文与长文档写作
- 目标/输入：完成 `organizer_edit_workorder` 的章节级修订与注记（每 target 1 条、原文保留、回执齐）+ 跨章节一致性报告（术语/符号/定义/编号/引用/结论）。产物 `revised_chapters/` + 预览 + `revision_records.json` + `operation_receipts.json` + 一致性报告。
- 契约：每个 target 1 条注记（target_id/original_quote/annotation/status/reason）；回执含导入/accept-reject/版本比较/回滚重放；不把分章材料当已完成学位论文。
- 映射：完成度→两个 target 各有 1 条注记、5 项 operation_requirements 有回执、一致性六类覆盖；正确性→注记 quote 命中、发现与原文一致；完整性→原段落/表/公式/引用/标题计数一致；可核验→改动可定位。
- 结构：长上下文管理（前文定义/材料/结论保持可见）+ 改动影响面分析 + 版本记录。
- 失败：把分章材料当完整学位论文宣称完成；漏第二个 target 或合并两条注记；用机械术语清单当一致性核验。

### writing-12 科研成果转化写作
- 目标/输入：受众/体裁转换改写（论文摘要→科普、技术报告→申报材料）：指定篇幅内读懂，同时保留关键结论/数据/限定条件/样本/指标口径/图表引用。产物 `converted.md` + `preservation_checklist.json` + `diff_map.md` + `audience_profile.md`。
- 契约：`preserved_facts{fact_id,value,unit,source_locator,converted_location,retained(是/压缩/删),reason}`；`diff_map` 源段→改稿段+留/压/删决策。
- 映射：完成度→按体裁/读者/篇幅完成（字数落上限、体裁要素齐）非提纲；正确性→数值/单位/比较基准/样本量/图表编号与源文一致、无新增结论；完整性→必须保留项全部有状态；可核验→每处删改有理由与 locator。
- 结构：先定受众与体裁→列必须保留清单→再改写；压缩先删冗余表达，不删证据与限定条件。
- 失败：压缩时把证据/限定条件一起删；受众错配；数值口径被改写（"提高 2.3 倍"→"三倍"）。

### writing-13 学术写作 Benchmark 与评测工具
- 目标/输入：可运行的 Benchmark 工具包：题面（输入+指令+必需要点+可接受变体+完成判定）→参考答案→可观察锚点→逐题评分→报告。产物 `tasks.jsonl` + `reference_answers` + `anchors` + `scores.csv` + `evaluation_report.md` + `reproducibility.md`。
- 契约：`task{task_id,direction(六类),instruction,must_include_points,acceptable_variants,fail_criteria,format_requirements}`；`score{verdict,failure_type,判据}`。
- 映射：完成度→五件齐、题量达承诺、六类方向覆盖；正确性→锚点与 must_include_points 一一对应、逐题得分与质量对得上；完整性→每题有判据/答案/锚点/得分/证据/失败类型；可核验→他人可复算同一批分数。
- 结构：锚点写成可观察现象（"是否给出样本量 n"而非"表达流畅"）；答案列可接受变体；双评分歧只改锚点不改分数。
- 失败：只交 rubric/总分表或演示无闭环；锚点不可观察；参考答案只有一份范文。

### writing-14 思维导图
- 目标/输入：从科研材料产出可打开、可读、可继续编辑的思维导图。产物 `mindmap.svg`（真实 `<text>`、层级用 group）+ `mindmap.json` + `mindmap_preview.png` + `node_evidence.csv` + `coverage_report.md`。
- 契约：`nodes{id,label,parent_id,level,type(概念/问题/方法/证据/结论/任务/风险),evidence_ids}`；`edges{source,target,relation(因果/依赖/对比/时间/引用/支持/冲突),evidence_id}`；每条 node/edge 能在 evidence 表命中。
- 映射：完成度→SVG+JSON+PNG 三件齐、覆盖必含分支；正确性→节点标签来自材料、关系方向正确、无材料外连接；完整性→七类关键项（缺类说明"材料未给"）；可核验→关键节点/关系有 locator+quote 与类型标注。
- 结构：先写 `mindmap.json`（结构+证据）再渲染 SVG；中心主题→分支（问题/方法/证据/结论/局限）→叶节点；同一概念不重复。
- 失败：装饰性词语当核心节点、漏方法/证据/结论；层级混乱/节点重复；关系方向搞反或硬造因果。
