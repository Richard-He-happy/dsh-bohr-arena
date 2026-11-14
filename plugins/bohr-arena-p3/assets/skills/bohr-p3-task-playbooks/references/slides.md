# 学术演示赛道 4 题打法

> 契约：产物型 list 7 字段；`editable_source`=真实可编辑 pptx（保模板继承）、`export_artifact`=真实 PDF（页数==幻灯片数+预览）、`content_map`=逐页映射。铁律：先出**页级计划**（每页一主张+证据定位）再成稿；数字/图表/引用与源材料一致；模板继承可机器验证。
> 赛道结论：幻灯片是 **patch 最有效**的题型（页级金标准/逐页 diff/版本记录/导出检查，实测 +19~21）；**融合重写会掉分**。

### slides-01 论文转学术 PPT
- 目标/输入：论文→主线成立、页序可讲的汇报；先页级计划（每页一主张+图表/章节定位）与讲稿再成稿。产物 `presentation.pptx` + `presentation.pdf` + `plan.json` + `evidence_map.json` + 备注。
- 契约：`editable_source{slides:N,template{path,master,layouts_used}}`；`export_artifact{pdf:{pages,engine}}`；每页 `content_map{ n,title,claim,role(title|background|method|result|discussion|limitation|conclusion),evidence[]{type:figure|table|section|page,id,locator,quote},assets[],notes}`，notes 与页面文字不重复。
- 映射：完成度→主线成立、页序可讲、目标模板内可交付；正确性→页面数字/单位/方法名/结论与论文一致、图表编号对得上、示意图不当实验数据；完整性→主线/页结构/图表引用/讲解逻辑/模板约束/导出渲染六类；可核验→每页有图表章节页码定位+页级金标准。
- 结构：先建证据表（每页 claim→论文定位）→排页→填充→校验；PDF 校验 `%PDF-` 头+页数==slide_count；pptx 校验可解压且 `ppt/presentation.xml` 存在。
- 失败：段落搬家（Abstract/Results 逐段塞框、主线丢失）；图表编号错位或示意图当数据；数值/单位改写；图无法提取时生成"看起来像"占位曲线。

### slides-02 学术 PPT 生成与编辑
- 目标/输入：同时覆盖「从零生成」与「在既有 deck 上局部编辑/换受众换语言」：先读 workorder 判 mode。产物 `presentation.pptx` + `presentation.pdf` + `plan.json` + `claim_source_map.json` + `changes.json` + 备注。
- 契约：`editable_source` 加 `mode(create|edit|adapt)/starting_deck{path}`；每页含 `changed:true|false` 与变更摘要；`changes[]` 记逐页/逐 shape 变更与时间。
- 映射：完成度→按 mode 交付可打开演示稿（页数/页序/角色/备注/导出件齐）；正确性→数字/图表/图注/引用编号与源材料一致；完整性→六类要素；可核验→源文件+页级金标准+导出件+逐页 diff+运行日志可复跑。
- 结构（patch 样板）：`page_golden.json`（逐页金标准）、`page_diff.md`（逐页对照）、`version_history.md`、`run.log`、`export_check.json`、`template_check.json`、`format_compliance.json` + result.json 对应字段；edit 模式只改目标页、保留其余页与母版。
- 失败：忽略 mode（要 edit 却整体重做）；改一页坏全套（重写母版/重建所有页）；数值图表失真；长句塞窄框压字号到不可读。

### slides-03 学术汇报内容组织
- 目标/输入：报告目的+听众+时长+页数+源材料→可直接上台的汇报：先出汇报目标/叙事骨架/取舍记录/问答预案。产物 `presentation.pptx` + `presentation.pdf` + `plan.json` + `qa_prep.json` + 逐页映射 + 备注。
- 契约：每页 `claim`（唯一）、`role`、`evidence[]`、`evidence_strength(direct|indirect|preliminary|not_reported)`、`notes`；plan 写"哪些内容没上页、为什么"；`content_map` 含 goal/audience/duration_minutes/narrative[]。
- 映射：完成度→目标/听众/叙事/逐页重点/问答闭环；正确性→页码内容/数字/图表引用与源材料一致、结论强度与证据匹配（preliminary 不能写成 confirmed）；完整性→六类要素；可核验→取舍记录+页级映射+导出链路可复核。
- 结构：五步"目标→听众→时长→页数→骨架→逐页"；页数按时长预算（每页 1–2 分钟）；问答预案覆盖质疑类型并映射备用页；讲稿重复率写入 compliance_checks。
- 失败：摘要式搬运（按论文目录堆页）；页数与时长脱节且无取舍记录；结论强度越级；问答裸奔。

### slides-04 学术 PPT 模板与格式适配
- 目标/输入：论文内容真实套进给定模板：保母版/版式/主题继承（可机器验证），固定版心内填充、图表等比适配、批量一致。产物 `presentation.pptx` + 一致 `presentation.pdf` + `plan.json`（模板分析→槽位→页）+ `template_map.json` + `changes.json`。
- 契约：`template{master_sha256,theme_sha256,layouts_used[]}`；每页含 layout id/名称、填充占位符 `ph idx/type`、自由文本框数量与替代原因、逐页偏差记录；模板分析（母版数/版式数/主题字体色）写 plan.json。
- 映射：完成度→真正套进指定模板且可打开可编辑；正确性→页内文字/数字/图号与源材料一致、继承真实发生、PDF 与 pptx 渲染一致；完整性→封面到结论主要页型齐+六类要素；可核验→源文件/模板/导出件/偏差记录可复跑。
- 结构：模板解析（母版/版式/主题指纹）→占位符映射→填充→批量一致性→导出比对；断言 `placeholder_fill_rate`、`freetextbox_count`、pptx 与 PDF 页级标题抽样一致。
- 失败：伪继承（新建空白 pptx 贴文本框）；只修前几页后面默认版式；压字号硬塞；图表变形/引用错位/矢量被光栅化。

## 4 题通用检查

- [ ] pptx 可解压且有 `ppt/presentation.xml`、页数==要求；PDF 有 `%PDF-` 头、页数与 pptx 页级标题抽样一致。
- [ ] 每页唯一 claim 与证据（type/id/locator/quote），notes 不复述页面。
- [ ] 模板题：母版/版式/主题指纹未变、占位符填充率落盘、伪继承检查通过；edit 模式未涉及页 diff 为空。
- [ ] 数字/单位/图表编号与源材料一致；无 soffice 时才用标准库 PDF 兜底（硬加劣质兜底会掉分）。
