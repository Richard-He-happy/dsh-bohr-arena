---
name: sci-skill-design
description: 为科研任务编写可被 Agent 调用、可被他人复核的 Skill：目录结构、输入输出契约、证据溯源、健壮性与自检、可编辑产物规范。当需要把某类科研流程沉淀成可复用 Skill 时使用。
version: 1.0.0
---

# 科研 Agent Skill 设计与实现

## 1. 用途

把一类科研工作（读文献、写章节、画图、做幻灯片、清洗数据……）沉淀成"别人或别的 Agent 能直接调用并复现"的 Skill 包。核心要求不是写得长，而是：**输入可解析、输出可复核、失败可解释、重复运行结果一致**。

不适用：一次性脚本（直接写脚本即可）；纯聊天式问答。

## 2. 最小目录结构

```text
<skill-name>/
├── SKILL.md            # 必需：用途、调用方式、输入/输出契约、异常处理、自检
├── scripts/            # 可选：main.py 等实现（纯标准库优先）
└── references/         # 可选：规范、模板、示例（单个 ≤25KB 为宜）
```

- SKILL.md 放在包根；被引用的脚本/参考文件必须真实存在。
- 文件数宁少勿多：常见有效包为 4–11 个文件、60–170KB；堆到 20+ 文件通常掉可靠性。

## 3. 输入约定（先发现，再假设）

1. 扫描输入目录，不假设固定文件名/键名：`case.json`、`materials/`、`notes.md` 等都要能识别。
2. 输入契约（若有 `output_contract`）必须**原样回填全部键**：缺值给 `null`/`[]`，不改名、不删未知键。
3. 文本按 `utf-8-sig` 读取并容错（BOM、坏编码、坏 JSON 都要能降级，不崩溃）。
4. 单文件设置大小上限（如 2MB），超限跳过并记录。

## 4. 输出约定

- **先写一份合法的 partial 结果**，再做分析：任何中途异常都不会留下不完整产物。
- 主产物格式要"可打开、可编辑、可复现"：文本类给 `.md`/`.json`/`.csv`；图形给可编辑 `SVG` + 真实 `PDF`；办公文档给 `.docx`/`.pptx`/`.xlsx`。
- 结果文件（如 `result.json`）至少包含：
  - `case_id` / `status`（`ok | partial | insufficient_evidence | input_error`）
  - 主产物路径、证据映射（每项带 locator + 逐字 quote）
  - `sources`、`uncertainty`、`pending_human`、`errors`、`degradations`、`runtime`
- `status` 要诚实：材料不足就 `insufficient_evidence`，不要编造数据或结论。

## 5. 证据溯源（科研场景的硬要求）

- 每个关键结论/数值/图元，都要能指回材料中的**逐字片段**（locator + quote）。
- 证据可以是 `materials/paper.md#p3` 这样的段落定位；规范化后写入 evidence map。
- 冲突信息不隐藏：同一指标两个来源不一致时，两个都记录并标 `source_conflict`。
- 不虚构引用、DOI、数值；缺失就写 `pending_human` 或 `not_reported`。

## 6. 健壮性清单

| 场景 | 要求 |
|---|---|
| 空输入目录 | 退出码 0，写合法结果（`insufficient_evidence`），不抛异常 |
| 坏 JSON / 坏编码 | 捕获并记录到 `errors`/`degradations`，继续处理其余材料 |
| 缺参数/未知参数 | `--input/--output/--work` 缺省指向 `/input`、`/app/output`、`/app/work` |
| 写盘失败 | 降级到最小合法产物，不让进程崩溃 |
| 重复运行 | 同一输入两次运行结果一致（固定随机种子、确定性布局） |

## 7. 自检（提交/交付前）

```bash
python3 -B scripts/main.py --help                 # 退出码 0
python3 -B scripts/main.py --input ./demo/input --output ./demo/output
python3 - <<'PY'
import json, xml.etree.ElementTree as ET
r = json.load(open('./demo/output/result.json'))
assert r.get('case_id') and r.get('status')
ET.parse('./demo/output/figure.svg')   # 若产出 SVG
print('ok', r['status'])
PY
```

- 空目录、坏 JSON、缺输入三种情况各跑一次。
- 产物：主文件存在、格式合法（SVG 可解析 / PDF 以 `%PDF-` 开头 / Office 可打开）。

## 8. 示例（示例，非正式案例）

把一个"材料 → 六章节论文初稿"的流程做成 Skill：`main.py` 负责发现材料、按六要素归位、抽取数值事实、生成 `manuscript.md` 与 `evidence_map.json`；`SKILL.md` 写清调用方式与缺口处理；空输入返回 `insufficient_evidence` 并列出缺口，而不是编造章节。

## 9. 边界

- 不做"通用大而全"的 Skill：一个 Skill 只解决一类任务，抽象过度会同时降低成功率与可复核性。
- 没有真实材料时，输出"材料不足"而不是示例填充。
- 交付给他人前，先在一个不属于作者的环境（不同机器/不同 Python 版本）里跑一遍。
