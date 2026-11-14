# 科研图形赛道 5 题打法

> 契约：产物型 list 7 字段（`case_id`/`status`/`editable_source`/`export_artifact`/`content_map`/`compliance_checks`/`exceptions`）。铁律：**可编辑源**（分层 SVG、文字真实 `<text>`）+ **真实导出**（PNG 有 IHDR、PDF 有 `%PDF-` 与页对象）+ **元素级溯源**（每图元→locator+逐字 quote）。
> 赛道结论：图形题用**质量强化 v3**（元素/关系数量、真实导出、断言）+ 同包重 roll；**不要 patch**（实测多数掉分）。

### graphics-01 科研示意图生成与编辑
- 目标/输入：材料→「实体—关系」中间表示（`figure_model.json`）→确定性分层 SVG + 真实 PNG/PDF。产物 `figure.svg`（frame/compartments/edges/nodes/legend）+ `figure.png` + `figure.pdf` + `edit_record.json`（原图指纹、变更元素 id）。
- 契约：`editable_source{path,format:"svg",editable:true,layers[],text_count}`；`export_artifact{png:{width,height,dpi,engine},pdf:{pages,vector,engine}}`；`content_map` 实体含 `id/label(逐字)/entity_type/source{kind,locator,quote}`，关系含 `from/to/relation_type/方向/依据`；SVG 元素 id 与 content_map id 一一对应。
- 映射：完成度→SVG+PNG+PDF 三件齐且非空；正确性→实体/关系/方向/层级与来源一致，对来源文本做词项白名单校验（排除材料外名称）；完整性→workorder 实体/关系/图例项覆盖计数达标；可核验→每元素 locator+quote，id 机器可对。
- 结构：`init` 扫 workorder/材料→Agent 写 `plan.json`（实体/关系/数值+quote）→`check`（quote 命中、关系预算）→`build` 渲染三件套+content_map+自检。关系类型→箭头样式固定；图例项数=分类数。
- 失败：只交 PNG/PDF 或文字转曲（可编辑性归零）；实体关系张冠李戴（抑制画成激活、上下游颠倒）；图例与图面分类数不一致；导出件造假（空文件、文本改名 .png）。

### graphics-02 科研数据图表生成与编辑
- 目标/输入：源数据（CSV/TSV/XLSX/JSON/统计结果）→「数据→图元」模型 `chart_model.json`→可编辑 SVG 图表 + 真实 PNG/PDF。产物 `chart.svg`+`chart.png`+`chart.pdf`+`chart_model.json`。
- 契约：`content_map` 每图元含 `series/x/y/raw_value（源表逐字）/source{file,sheet,row,col,header,quote}/几何量/派生规则`；轴含 `label/unit/scale/tick 来源`；误差线/显著性含来源列与含义。
- 映射：完成度→SVG+PNG+PDF+model 齐；正确性→逐图元与源表逐字一致（重算柱高/点坐标比例、误差线长度与列对应）、轴单位量级一致、名称逐字来自表头；完整性→图型/系列/图例/误差线/显著性/子图编号齐；可核验→点级 locator。
- 结构：先建模再渲染；图例按 series 显式绑定颜色（不按字母序自动配色）；断言"图元数==源数据行数""图例项数==系列数"。
- 失败：数值挪用/取整；图例与系列错配；缺失值当 0、缺单位时编单位；只出图不出映射。

### graphics-03 生物机制图与通路图
- 目标/输入：机制材料→「实体—相互作用—区室」表示→按上下游与区室位置确定性布局。产物 `figure.svg`（compartments/entities/edges/labels/legend）+ PNG + PDF + `figure_model.json`。该题曾是 0 分题，改"Agent 写 plan + 脚本渲染 + 真实导出 + 元素级溯源"后 0→69.67。
- 契约：实体含 `name(逐字)/entity_type/species/italic_required（基因斜体·蛋白正体）/compartment/source`；关系含 `relation_type(activation|inhibition|binding|modification|transport)/语义/direction`；区室含位置与包含关系。
- 映射：完成度→读材料→定实体与边→定布局图例→出三件套闭环；正确性→五类关系可区分且方向正确、区室归属正确、基因/蛋白不混用；完整性→实体/边/图例项覆盖达标并含反馈环；可核验→实体清单+边清单+图例依据+版本可独立复核。
- 结构：机制语法库（动词→边类型词表）+ 区室布局约束（膜/胞内/胞外/细胞核）+ 断言（边类型→marker 映射、跨膜边与膜边界对齐）。
- 失败：名词平铺随意连线（激活抑制不分、方向乱、反馈环丢）；区室错位（跨膜受体画进胞内）；基因/蛋白混用；图例与图面编码不一致。

### graphics-04 实验装置与技术路线图
- 目标/输入：装置清单/装配说明/工艺描述/研究计划→「部件—接口—连接—流向—步骤/阶段」表示→装置图+流程图。产物 `figure.svg`（parts/connections/steps/stages/labels/legend）+ PNG + PDF + `figure_model.json`。
- 契约：`parts{id,name(逐字),qty,ports,source}`；`connections{from,to,medium(material|energy|information),direction,interface,source}`；`steps{no,title,source_order,locator}`；`stages{goal,methods,inputs_outputs,dependencies}`。
- 映射：完成度→workorder 指定图型真正出图（不是文字描述）；正确性→部件名与数量、接口对应、上下游顺序、箭头方向、标注数值与来源一致；完整性→科学实体/空间关系/数据编码/图例/可编辑源/导出格式六类；可核验→图稿+源文件+渲染记录可复核重绘。
- 结构：中间表示先行再布图自检；编号与正文顺序绑定；断言"连接数==清单数""编号连续""无悬空端点"。
- 失败：凭空补齐管路连接；流向箭头反向或断头；步骤编号与正文错位、并行支路编成顺序；技术路线画成并列罗列（无阶段目标/方法/依赖）。

### graphics-05 Graphical Abstract（图形摘要）
- 目标/输入：研究材料→单页四段式（problem→method→results→implication）图形摘要。产物 `figure.svg`（panels/arrows/labels/legend/annotations）+ `figure.png`（按 workorder 尺寸）+ `figure.pdf` + `figure_model.json`。该结构实测有效（曾为低分题）。
- 契约：`panels{order,role,claim(一句话),元素清单,source{locator,quote}}`；`encodings{channel→meaning→values/dataset→source}`；每个图面数字可回查来源。
- 映射：完成度→四要素单页且可编辑；正确性→实体/关系/数据编码/图例与来源一致；完整性→四要素+图例+单位/比例尺；可核验→图稿/来源映射/版本/导出记录支持独立复核。
- 结构：4 列等宽卡 + 段间箭头 + 底部证据带（来源/locator/图例/图注）；`metric` 两条 bar 各配独立引文（不拼引文）；溢出先删条目再缩字（字号下限固定）。
- 失败：热闹但不可核验（无 panel→claim→source 映射）；编码无图例/无单位；版式不稳定（两次运行换版式、文字溢出）；图上出现来源找不到的数值。
