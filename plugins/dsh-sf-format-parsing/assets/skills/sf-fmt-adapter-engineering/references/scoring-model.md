# 计分判据与判分语义（FMT 三题）

来源：题面（公开规则）+ 随材料发布的验收器 `core/`（与平台同一份，逐项核对）。本文把「怎么给分」翻译成「实现时该做什么」。

## 1. 计分总式

```
单格式得分 = (等级权重 + K + Z + F) × 难度分        每格式满分 = 1.9 × 难度分
本题得分   = Σ 单格式得分 ÷ (Σ难度 × 1.9) × 100     满分 100
```

| 题 | Σ难度 | 分母 |
|---|---:|---:|
| 谱学、衍射与分析化学（102 格式） | 209 | 397.1 |
| 计算化学与仿真（118 格式） | 203 | 385.7 |
| 显微与成像（91 格式） | 169 | 321.1 |

重复强调（题面规则）：**做不了的格式不交，记 0 分、不扣分**；每个包独立判，一个包被退回只影响该格式。

## 2. 四等级（逐级累进，只认从 L0 起连续通过的最高一级）

### L0 能读（权重 0.2）

- 对每个公开样本，`parser.load()` 必须返回合规产物：至少一个数值/布尔数组（或 `{名字: 数组}`），metadata 合规。
- 产物要与 `expected/<组>.json` 一致（shape/dtype/信号名/关键元数据）。
- 常见扣分点：`expected_mismatch`（期望与产物不一致）、`expected_missing`（缺该组的 expected，整包退回）、`frombuffer_without_evidence`（给的是裸字节数组但没有任何格式证据键）。

### L1 有意义（权重 0.5）

四件事都要过：

1. `metadata.format` 等于 manifest 的 `format_id`（否则 `format_mismatch`）。
2. 有识别证据：metadata 顶层存在 `magic`/`header`/`signature`/`dimensions`/`columns`/`shape`/`version` 之一，或有非空的 `n_*`/`num_*`/`total_*`/`count_*` 计数键（否则 `evidence_missing`）。
3. 每维 axes：长度 = 数组维数；每维 `{name, unit}` 均为非空字符串，name 1–64 字符、unit 1–32 字符，且 unit 不在占位词表（`unknown`/`?`/`none`/`null`/`n/a`/`na`/空）（否则 `axis_unit_missing`）；若给 `labels`，长度必须等于该维长度（否则 `axis_labels_length`）。
4. **本域元数据字段**：该格式所属 domain 在验收器 `domain_fields.json` 里的 any_of 组，至少有一个键出现在 **metadata 顶层**且值非空（否则 `domain_fields_missing`）。这是 L1 最容易被忽略、且会成批丢分的点。

### L2 稳健（权重 0.8，平台用隐藏样本判）

L2 由四组检查组成：

| 检查 | 语义 | 失败码 |
|---|---|---|
| 隐藏样本 | 每个隐藏样本组必须能读且产物合规 | `hidden_failed` |
| 输入匹配 | `input: file` 模式下，隐藏组里必须恰好 1 个候选文件匹配 `extensions`（排除 companions）；0 个或多个都算不匹配 | `input_mismatch` |
| 改名不变 | 公开样本会用乱序名重跑（且不给 expected），产出必须与按原名跑一致；源码里写死样本名也会被抓 | `name_dependent_output` / `hardcoded_sample_name` |
| 垃圾与截断 | 第一个公开样本替换为 4096 字节确定性随机数据，必须抛异常（`garbage_accepted` 若返回产物）；替换为约一半截断，要么抛异常，要么给出结构合规的产物（`truncated_garbage` 若产物不合规或超时/崩溃） | 见左 |

关键语义（实测自验收器）：

- 隐藏样本组读失败时，如果**所有公开组**在同样是乱序名、无 expected 的情况下都能过 L0/L1，则判 `organizer_sample_suspect`（算 L2 partial，不按 fail）——即「解析器没问题，是隐藏样本可疑」。
- `input_mismatch` 同样归入 `organizer_sample_suspect`，因此布局问题只损失权重、不判负。
- 因此 L2 的失败原因只有两类：「解析器对合法内容不够稳」与「输入布局假设不成立」。

### L3 可视（权重 1.0）

- `manifest.visualization` 能对每个公开样本出图（本地可验证）；`image` 要二维数组、`image_grid` 要三维。
- 对比声明要求多样本横轴 name+unit 相同。
- 失败码：`viz_unresolvable`（声明的 signal 不存在/维数不符）、`visualization_invalid`。

## 3. 知识分 K（到 L1 及以上才计，合计 ≤0.4）

| 项 | 判据 | 分值 |
|---|---|---:|
| K1 | `use_cases` ≥2 条，每条都有可量化 metrics 和 DOI/URL 引用 | +0.1 |
| K2 | `metadata_schema` 中 `required: true` 的键，在**每个**公开样本产物中出现（覆盖阈值 80%），且其声明单位能在单位表归一（`index`/`1`/`null` 安全） | +0.2 |
| K3 | `sniff_rules` 认出所有公开样本且不误认内置负例（PNG/JSON/CSV/随机等）；`quality_rules` 把截断样本判坏、完整样本判好 | +0.1 |

K 的注意点：

- K2 是 K 里最大的一项，但**键宁少勿多**：全部 required 键都要在每个样本里出现且单位可换算。拿不到的单位（如 `mV`、`s/mm²`）不要给 required 键用。
- K3 是 all-or-nothing：规则写错会让隐藏样本 `quality_misjudged`，比不写更差。
- 与 L1 的区别：L1 的 `domain_fields` 看 metadata **顶层**；K2 看 `metadata_schema` 的 required 键（可写点路径）。

## 4. 分块分 Z（到 L2 及以上才计，合计 ≤0.3）

- Z1 声明齐全：`chunking` 覆盖 parser 返回的每个数值/布尔数组；每维写块长（正整数或 `all`）；`unit` 写清「一块在物理上是什么」；`coords` 每维给 `index` 或 metadata 中可解析的 start+step。
- Z2 拼回一致：平台按声明写 zarr 后，各块拼回与解析结果逐元素相同；单独读块与对应切片相同；坐标一致。
- Z3 合理：单块（未压缩）≤128 MiB；数组切成多块时每块 ≥1 MiB；块数是物理单元长度的整数倍（不能切在单元中间）；块数不超过上限；边缘补齐空白不超过数组 25%。

典型扣分码：`chunking_schema_invalid`、`array_undeclared`、`array_not_produced`、`array_not_chunkable`、`unit_placeholder`、`coord_unresolved`、`store_invalid`、`reassembly_mismatch`、`chunk_too_large`、`chunk_too_small`、`unit_misaligned`。

实现建议：让 parser 对同类格式统一维数（如统一 5D `(t,c,z,y,x)`），一份 `chunking` 声明就能覆盖同格式所有样本（实测有效）。

## 5. 特征方案分 F（到 L1 及以上才计，合计 ≤0.2）

- F1 方案齐全：用哪个数组、什么单位、什么方法、多少维、解决哪些任务、文献与代码仓库、从产物到向量的步骤。
- F2 可检索：`retrieval.metadata_keys` ≥2 个、不重复、都在 `metadata_schema` 内且实际产出（否则失分）。
- 本期只交方案、不交模型。

## 6. 常见失败码速查

| 失败码 | 位置 | 含义 | 对策 |
|---|---|---|---|
| `expected_mismatch` | L0 | 产物与 expected 不一致 | 用 parser 真跑回写 expected；查重复键覆盖 |
| `expected_missing` | 包级 | 缺公开样本组的 expected | 每个 public group 一份，组名=目录名 |
| `format_mismatch` | L1 | metadata.format ≠ manifest.format_id | 统一用 manifest/card 的 format_id（含冒号形式） |
| `evidence_missing` | L1 | 无识别证据键 | 顶层写 `magic`/`header`/`signature` 等 |
| `axis_unit_missing` | L1 | axes 缺失/占位单位/长度不符 | 每维非空 name+unit，长度=维数 |
| `domain_fields_missing` | L1 | 本域 any_of 一个都不在顶层 | 按域输出合法字段（优先可计算计数键） |
| `input_mismatch` | L2 | 隐藏组候选文件数 ≠1 | dir-mode 或修正 extensions/companions |
| `garbage_accepted` | L2 | 随机字节被当合法文件 | 补格式级签名/文本兜底 |
| `truncated_garbage` | L2 | 截断后产物不合规 | 质检规则或结构校验 |
| `hidden_failed` | L2 | 合法隐藏样本读不了 | 放宽到格式级结构签名（勿写死 producer） |
| `organizer_sample_suspect` | L2 | 隐藏样本可疑（partial，不判 fail） | 通常无需修；排查是否普遍出现 |
| `hardcoded_sample_name` / `name_dependent_output` | L2 | 源码/输出依赖样本名 | 去掉样本名，产出只由内容决定 |
| `frombuffer_without_evidence` | L0 | 只有裸字节数组、无证据 | 增加 metadata 证据键 |
| `requirement_unavailable` / `requirement_not_whitelisted` | 包级 | 声明库不可用/不在白名单 | 改 `route: synth` 或白名单导入名 |
| `package_bad_member` | 包级 | 有多余成员（`__pycache__`/点文件/样本等） | 打包白名单 + 清理 |
| `knowledge_missing` / `knowledge_invalid` | 包级 | 知识卡缺失/schema 不合规 | 跑 schema 校验，逐包验证 |
| `manifest_domain_mismatch` | 包级 | extensions/domain 与 card 不符 | card.json 为权威 |
| `viz_unresolvable` | L3 | 可视化声明解析不出来 | 声明与产物结构对齐 |

## 7. 本地可见 vs 平台可见

| 项 | 本地（公开样本） | 平台（加隐藏样本） |
|---|---|---|
| L0、L1、L3 | 可完整判 | 同左（公开部分） |
| L2 | 只显示「公开部分通过」；garbage/truncated/改名可在本地复现 | 隐藏样本决定最终 weight |
| K1/K2 | 可判（公开样本口径） | 隐藏样本参与后可能降 |
| K3 | 可判（公开样本 + 内置负例） | 隐藏样本参与后可能降 |
| Z1–Z3 | 可判（公开样本） | 隐藏样本参与后可能降 |
| F1/F2 | 可判 | 同左 |

分配预期时：本地「乐观分」= 假设 L2 全过 + K3/Z 在隐藏上也全过；本地「保守分」= 假设 L2 全不过（停在 L1、Z 不计）。真实分大概率落在两者之间且更靠近保守侧的抬升版——用合成 hidden 代理估方向（见 `sf-fmt-local-judge`）。

## 8. 算分示例（校验用）

- 难度 2 的格式：L3 + K 满 0.4 + Z 满 0.3 + F 满 0.2 → (1.0+0.9)×2 = 3.8；到 L3 + K 满、无 Z/F → 2.8；到 L1 + K 0.3 → (0.5+0.3)×2 = 1.6。
- 整题自检：把所有格式的「实测单格式分」相加 ÷ 分母 × 100，应与平台分一致；用本地报告复算时，L2/K3/Z 的命中率差异会造成偏差，属正常。
