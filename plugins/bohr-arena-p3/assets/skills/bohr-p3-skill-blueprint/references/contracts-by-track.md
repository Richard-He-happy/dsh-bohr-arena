# 四赛道交付契约（字段级）

> `result.json` 是唯一必交文件；其余产物是"支撑它的核验资产"。所有契约字段必须**原样回填**：不改名、不遗漏未知键、缺值写 `null`/`[]`。
> 本文按赛道给出根字段与条目形状；逐题差异见 `bohr-p3-task-playbooks`。

## 0. 通用信封字段（三类契约都要追加）

| 字段 | 含义 | 写法要求 |
|---|---|---|
| `case_id` | 输入案例标识 | 原样保留；不得丢失（历史 bug：映射时被覆盖丢掉） |
| `status` | 整体完成度 | 按题面枚举；业务型常用 `answered/partial/insufficient_evidence/input_error`，产物型常用 `ok/partial/...` |
| `sources` | 已读材料清单 | `[{source_id, path/name, kind, pages_or_paras}]` |
| `uncertainty` / `uncertainties` | 不确定项 | 逐条写"是什么 + 为什么不确定 + 需要什么才能确认"，不要空数组糊过去 |
| `pending_human` | 需人工处理项 | 逐条给定位与建议动作 |
| `errors` | 致命异常 | 即使有内容也要记；与 `status` 一致 |
| `degradations` | 降级 | 每条写"降了什么 + 原因 + 影响范围" |
| `changes` | 本次运行产生的改动 | 生成/改写/回滚动作 |
| `runtime` | 预算消耗 | 步骤、耗时、是否截断；工具探测结果 |

## 1. reading：业务型契约（dict）

### 1.1 根字段

| 字段 | 要求 |
|---|---|
| `case_id` | 原样 |
| `status` | `answered`（清单内对象全部完成）/ `partial`（只表示"已给对象没做完"）/ `insufficient_evidence`（材料不可用/无表示）/ `input_error` |
| `result` | 本题的业务结构（见 1.2） |
| `claims` | 本次运行的结论清单（`claim_id/text/kind/evidence/conditions`） |
| `uncertainties` | 不确定项 |

### 1.2 `result` 常见业务结构（按题型取其一或组合）

- 问答类：`answers[]{question_id, answer, conditions, status, sub_questions[]}` + `unanswered_parts[]` + `coverage{...}`。
- 字段抽取类：`fields[]{field_id, field_name, value, units, statistic, condition, comparator, status, source{...}, quote, semantic_check}` + `coverage{requested, reported, not_reported, source_conflict, extraction_failed}`。
- 核验类：`verifications[]{claim_id, claim_text, sub_claims[], verdict, verdict_confidence, evidence[], aggregation_rule, rationale}`。
- 比较类：`matrix[]{field_id, cells[]{document_id, value, units, dataset, metric_basis, condition, paragraph_id, quote, status}}` + `comparability[]` + `synthesis{allowed, basis}`。
- 公式类：`formulas[]{formula_id, eq_number, latex, structure{...}, symbols[], parse_confidence, status}` + `variables[]` + `derivations[]` + `numeric_checks[]`。
- 复现类：`repro_checklist[]{item, kind, source, version_or_commit, status, locator}` + `environment{}` + `params[]`（三类来源）+ `runs[]{method, command, exit_code, log_path, metrics}` + `tolerance{}` + `comparison[]` + `attribution[]`。
- Benchmark 类：`benchmark{set_id, version, items_count}` + `run_config{permissions, budget, model, prompt_version}` + `scores[]{item_id, score, max, rationale, raw_output_ref, config_ref, scoring_record_ref}`。
- 清洗类：`counts{input_rows, output_rows, changed_values, pending_review, duplicates_merged, anomalies}` + `rules_applied[]` + `duplicates[]`。

### 1.3 `claims[]` 条目

```json
{"claim_id":"C1","text":"该处理使腐蚀电流密度由 2.4 降至 0.9 µA/cm²",
 "kind":"directly_read|inferred|undetermined",
 "evidence":[{"source_id":"D1","locator":"p.4#para2 | tbl2 r3c2 | fig1b",
              "quote":"逐字原文片段"}],
 "conditions":"温度/剂量/样本量等适用范围"}
```

要点：一个关键数字一条 claim；`kind` 区分"原文直读/合理推断/无法确定"；`quote` 必须是原文逐字片段（可跨行不跨段），找不到就降级或进 `pending_human`。

### 1.4 定位规范

| 材料 | locator 形态 |
|---|---|
| 文本段落 | `p.<页>#para<n>` 或 `para.<n>`（与 `show` 输出一致） |
| 表格 | 表 id + 行/列（`T2 r3 c2`） |
| 图 | 图号 + 子图号（`fig1b`）；像素读数加 `px_box` |
| 公式 | 公式号 / XML 路径（XPath） |
| 代码/日志 | 文件 + 行号 |

## 2. writing：交付型契约（dict）

### 2.1 根字段

| 字段 | 要求 |
|---|---|
| `case_id` | 原样 |
| `deliverable` | 主产物相对路径字符串（如 `manuscript.md`）；**另加**辅助字段（`deliverable_path`/`word_count`/`sections_covered`），只增不改 |
| `preserved_facts` | 保真事实清单，见 2.2 |
| `evidence_map` | 论断→来源证据，见 2.3 |
| `change_log` | 改动留痕，见 2.4 |

### 2.2 `preserved_facts[]`

```json
{"fact_id":"F1","value":"12.7","unit":"%","source_id":"D1","locator":"p3#para5",
 "quote":"逐字原文","status":"preserved|converted|flagged"}
```

写作类题的核心是"改表达不改事实"：数值、单位、样本量、统计量、引用编号、术语、作者/年份/DOI 都要能在此命中。

### 2.3 `evidence_map[]`

```json
{"claim_id":"A1","claim":"稿件中的论断（可与成稿锚点编号一致）","source_id":"D1",
 "locator":"p2#para3","quote":"逐字原文","kind":"direct|inferred|undetermined"}
```

要求覆盖成稿中的事实性论断（目标 ≥90%），每条带 locator；`kind` 区分直接/推断/未确定。

### 2.4 `change_log[]`

```json
{"id":"C1","action":"rewrite|translate|move|merge|split|annotate|format",
 "original_quote":"改前原文","revised_quote":"改后文本","reason":"为什么改","locator":"定位"}
```

### 2.5 写作题的必备附件（按题型挑）

| 附件 | 用于题型 | 作用 |
|---|---|---|
| `workorder_execution` / 回执 | 带编辑工单/基金/开题的题 | 逐 target/逐条要求的 done/rejected + 理由 |
| `format_spec` + `fidelity_report` | 格式与模板适配 | 从模板反推规格 + 内容单元前后计数一致 |
| `format_compliance` / `compliance_checks` | 字体/版式类 | 逐项"要求—实测—证据" |
| `export_preview` | 需要交付预览 | 真实 PDF/PNG，可打开 |
| `version_history` / `version compare` | 客户端/返修类 | 版本可对比、可回滚 |
| `golden_standard` + `diff_report` | patch 增补（通用） | 页/章级金标准 + 实际产物逐项对照 |

## 3. graphics：产物型契约（list 型 7 字段）

### 3.1 根字段

| 字段 | 要求 |
|---|---|
| `case_id` | 原样 |
| `status` | `ok`（齐全）/`partial`（缺件，写清缺口）/`insufficient_evidence`/`input_error` |
| `editable_source` | `{path, format:"svg", editable:true, layers:[...], text_count, sha256}` |
| `export_artifact` | `{png:{path, width, height, dpi, engine}, pdf:{path, pages, vector, engine}}` |
| `content_map` | 元素级溯源（见 3.2） |
| `compliance_checks` | 尺寸/分辨率/字体/线宽/色彩/导出/一致性检查结果（逐项 `measured/required/verdict`） |
| `exceptions` | 未能满足项 + 原因 + 影响 |

### 3.2 `content_map` 条目

- 实体/部件/节点：`id`、`label`（逐字来自来源）、`type`、可选 `compartment/species/qty/ports`、`source{kind, locator, quote}`。
- 关系/连接：`from`、`to`、`relation_type`（激活/抑制/结合/修饰/转运/材料/能量/信息…）、`direction`、`source{locator, quote}`。
- 数据图元（图表类）：`series`、`x`、`y`、`raw_value`（源表逐字字符串）、`source{file, sheet, row, col, header}`、几何量、派生规则。
- 面板（图形摘要类）：`order`、`role`（problem/method/result/conclusion）、`claim`、元素清单、`source`。
- 编码/图例：`channel`（颜色/线宽/形状/长度）→ `meaning` → `values/dataset` → `source`。

**机器校验点**：`content_map` 中每个元素 id 必须与 SVG 元素 id 一一对应；图例项数 == 图面编码分类数；图面出现的名称/数值必须能在 quote 中找到。

### 3.3 导出件的最小真实性检查

- SVG：纯文本、`<text>` 保留可编辑文字、分层 `<g id="layer-*">`；文字不转曲。
- PNG：能解出 IHDR 宽高/位深；非白像素比例 > 0（空白图判失败）；不允许文本改名。
- PDF：`%PDF-` 头 + 页对象 + 页数正确；不空文件。
- 同一输入两次运行：SVG 结构一致（或 diff 为空），写入 `compliance_checks`。

## 4. slides：产物型契约（list 型 7 字段）

根字段与 graphics 相同，但语义按幻灯片：

| 字段 | 差异要求 |
|---|---|
| `editable_source` | `{path, format:"pptx", slides:N, mode:create|edit|adapt, template{path, master, layouts_used[]}, starting_deck{path}, sha256}` |
| `export_artifact` | `{pdf:{path, pages, engine}, png:{path或dir, count, engine}}`；PDF 页数必须 == `slides` |
| `content_map` | 逐页：`n`、`title`、`claim`（一句话主张）、`role`（title/background/method/result/discussion/limitation/conclusion）、`evidence[]{type:figure|table|section|page, id, locator, quote}`、`assets[]`、`notes`；edit 模式加 `changed` + 变更摘要 |
| `compliance_checks` | 页数==要求、模板继承证据（母版/版式/主题指纹）、占位符填充率、自由文本框数量、字体/字号、页脚/致谢、pptx 与 PDF 页级一致性 |
| `exceptions` | 图表无法提取、公式为图片、模板占位符不足、字体缺失、页数超限等 |

幻灯片专属核验资产（patch 首选）：

- `page_golden.json`：逐页金标准（页序/角色/必含要点/证据定位）。
- `page_diff.md`：实际成品 vs 金标准逐页对照（达标/缺失/偏差）。
- `template_spec` / `template_map.json`：模板规格与"母版/版式/占位符 → 页"映射。
- `format_compliance.json`：逐项格式合规（字体/字号/行距/页边距/页脚）。
- `export_check.json`：导出件真实性 + 页数一致。
- `version_history.md`、`run.log`、`self_check.json`：版本与自检。

## 5. 状态语义对照

| 场景 | 应写 | 常见错写 |
|---|---|---|
| 清单内对象全部解析 | `answered`（reading）/`ok`（writing/graphics/slides） | 一律写 `ok`（reading 题面可能不认） |
| 已给对象没做完 | `partial` + 缺口 | 用 `partial` 暗示"材料没给更多对象"（会被判错） |
| 材料没有该表示/无文本层 | `insufficient_evidence` + `pending_human` | 反推/编造/填 0 |
| 输入不可读/坏 JSON | `input_error` + `errors` | 空文件或非零退出码 |
| 降级但产物齐全 | `ok`/`partial` + `degradations` | 静默降级不写 |

## 6. 契约自检（finalize 前逐项）

- [ ] 契约键逐一存在（list 型按 `CONTRACT_MAP` 逐键检查，缺失写 `null` 并计数）。
- [ ] `case_id` 与输入一致（未被内部映射覆盖）。
- [ ] `status` 与实情一致，且 `errors`/`degradations`/`pending_human` 能解释所有缺口。
- [ ] 主产物路径字段指向真实存在的文件，大小 > 0。
- [ ] 每个 claim/元素/页面/单元格都有 `source + locator + quote`，quote 逐字命中。
- [ ] 计数自洽：`coverage` 各档相加 == 总数；图例项数 == 编码分类数；PDF 页数 == 幻灯片页数。
