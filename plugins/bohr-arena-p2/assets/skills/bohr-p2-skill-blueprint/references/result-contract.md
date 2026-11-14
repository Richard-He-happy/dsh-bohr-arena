# result.json 契约细则（result-contract）

> 目的：把"结构化结果"写成 judge 与下游都能直接复核的形态。所有字段在每次运行中都必须存在；缺值给 `null` / `[]` / `{}`，不能省略、不能改名。
> 依据：二期题面公开的运行契约（输入 `case.json`、输出 `/app/output`、保留 `case_id`/主结果/证据/状态/不确定性），以及二期多题最好版本的实测结构。

## 1. 顶层字段（16 个）

| 字段 | 类型 | 必填内容 | 常见错误 |
|---|---|---|---|
| `case_id` | string | 输入中的案例标识；取不到时用输入目录名，最后才 `unknown` | 写死示例 id；大小写与输入不一致 |
| `status` | enum | `ok` / `partial` / `failed`；只有产物、证据、自检都满足才 `ok` | 自评 `ok` 但覆盖率不满 |
| `summary` | string | 2–4 句：做了什么、覆盖范围、主要结论、限制 | 写成宣传语或"已完成"空话 |
| `artifacts` | array | 每个主产物一条 `{path, kind, description?}`，路径真实存在 | 路径写相对路径或模板占位 |
| `primary_result` | object | 任务主结果（按题型不同，见第 3 节） | 把整段原文塞进来 |
| `evidence` | array | 关键结论的证据条目（见第 4 节） | 只有结论没有 quote |
| `sources` | array | 输入来源清单：文件、类型、页数/字符数、可读性 | 只写文件名不写可用范围 |
| `coverage` | object | 覆盖率与缺口：任务要求项数、已完成项数、缺失项列表 | 只写百分比不给分母 |
| `verification` | object | 机械校验结果：检查项、通过数、失败数、失败项 | 全 `true` 但无检查明细 |
| `uncertainty` | array | 已交付但不确信的点（写明为什么不确信） | 与 `pending_human` 混用 |
| `pending_human` | array | 必须人工接管的项，每条带可执行下一步 | 写"待补充"却没有动作 |
| `errors` | array | 运行错误、异常、脚本失败记录 | 捕获异常后不记录 |
| `degradations` | array | 降级路径：用了哪个后备方案、损失了什么 | 降级了但装作没降 |
| `changes` | array | 相对输入/上一版的改动记录（写作类必备） | 改了但不记录 |
| `runtime` | object | `{requests, elapsed_seconds, script_versions}` 真实值 | 填估计值或留空对象 |
| `output_contract` | object | 输入里的 `output_contract` **原样回填** | 改名、漏键、只回填认识的键 |

## 2. 状态判定

```
ok      = 主产物齐备 + 关键证据全部可核验 + 自检项全部通过 + 覆盖率达标
partial = 有可用产物，但存在缺口、降级、未核验或待人工项
failed  = 无法产出主产物（无输入/解析全失败/预算耗尽且未落盘）
```

- 判定必须由覆盖率与校验计数驱动，不靠自评。
- 有占位符（`〔待补:…〕`、`〔未译:…〕`）时不允许 `ok`。
- `failed` 也必须写满 16 字段，并把原因写进 `errors`。

## 3. `primary_result` 的题型差异

| 题型 | `primary_result` 建议结构 |
|---|---|
| 解析类 | `{document:{title, pages, sections:[{heading, page}], tables:[], figures:[], formulas:[]}, extracted_text_path}` |
| 翻译类 | `{unit_index:[{id, page, src_chars}], glossary:[{src, tgt, status}], coverage:{units_total, units_translated}}` |
| 笔记类 | `{paper_card:{research_question,data,method_conditions,main_findings,limitations}, sections:[{order,heading,page_range,key_points}]}` |
| 断言类（Nanopublication） | `{assertions:[{id, subject, predicate, object, evidence_ids}], provenance:[], publication:{}}` |
| 图谱类 | `{nodes:[{id,type,label}], edges:[{source,target,type,evidence_id}], queries:[{q,result_ids}]}` |
| 润色类 | `{edits:[{id, unit, type, before, after, reason}], protected_spans:[], term_table:[]}` |
| 引用管理类 | `{citations:[{marker, ref_id, position}], bibliography:[{id, fields, source}], dedup_decisions:[]}` |
| LaTeX 类 | `{files:[], build:{engine, passes, status, log_path}, fixes:[{file,line,root_cause}]}` |
| 引言/方法类 | `{sections:[{heading, paragraphs}], claim_source_map:[], parameters:[]}` |

原则：主结果要能被程序读取，不要用一段散文代替字段；行文正文放独立主产物（md/tex/csv），`primary_result` 只放可核对的索引。

## 4. `evidence` / `sources` / `coverage` / `verification` 结构

```json
{
  "evidence": [
    {"id": "E1", "claim": "该结论", "quote": "原文逐字片段",
     "locator": "paper p.3-4 [U0012]", "kind": "direct|derived", "verified": true}
  ],
  "sources": [
    {"id": "S1", "file": "paper.pdf", "kind": "pdf", "pages": 12, "readable": true, "text_layer": true}
  ],
  "coverage": {
    "required": 6, "done": 5, "rate": 0.83,
    "missing": ["基线版本"], "notes": "材料未给基线版本，已列入 pending_human"
  },
  "verification": {
    "checks": [{"id": "C1", "name": "quote 逐字匹配", "checked": 42, "passed": 42, "failed": 0}],
    "fail_count": 0, "warn_count": 2
  }
}
```

- `evidence` 的 `quote` 必须逐字可检索；匹配失败要 `verified: false` 并进 `uncertainty`，不能删掉了事。
- `coverage` 必须有分母与缺失项；只有百分比不算可复核。
- `verification` 要写检查项 id，便于 `verify.py` 与 SKILL.md 的自检表互相引用。

## 5. `output_contract` 回填规则

1. 在 `case.json` 任意层级递归找键名归一化后等于 `output_contract` 的对象（也接受 `output_schema`/`contract`）。
2. 找到后**整体原样**放进 `result.output_contract`：键名、层级、未知键全部保留。
3. 能映射到同名顶层字段的，尽量映射（例如契约要求 `notes_path`，就在 `artifacts` 中列出该路径）。
4. 映射不上的置 `null`，并写 `degradations` / `pending_human` 说明原因。
5. 输入没有契约时写 `{}`，不要编造。

## 6. 骨架（脚本不可用时手写）

```json
{"case_id":"unknown","status":"partial","summary":"","artifacts":[],"primary_result":{},
 "evidence":[],"sources":[],"coverage":{},"verification":{},"uncertainty":[],
 "pending_human":[],"errors":[],"degradations":[],"changes":[],
 "runtime":{"requests":0,"elapsed_seconds":0,"script_versions":{}},"output_contract":{}}
```

底线：**宁可只写 3 个字段的真话，也不要凑满字段的假话**；但字段结构（16 个键）必须齐全，否则契约校验直接失败。

## 7. 常见契约失败

| 现象 | 根因 | 修法 |
|---|---|---|
| 判分直接失败 | `result.json` 缺失或不可解析 | 第一条命令写 partial；finalize 无条件执行 |
| 契约项判 0 | `output_contract` 被改名/漏键 | 原样透传整对象 |
| 完整性低 | 只有摘要没有章节/条目级结构 | 按主结果表补结构 |
| 可核验性低 | evidence 只有结论 | 每结论补 quote + locator |
| 状态不可信 | `ok` 但覆盖率 0.5 | 由计数规则决定 status |
| 归因不清 | 异常被静默吞掉 | `errors`/`degradations` 记录并写进 summary |
