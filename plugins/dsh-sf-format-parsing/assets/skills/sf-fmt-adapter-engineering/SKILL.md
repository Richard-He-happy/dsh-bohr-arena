---
name: sf-fmt-adapter-engineering
description: 格式适配器工程方法：从格式清单到通用生成器（manifest/parser/knowledge/expected），再到 L2/K3/dir-mode 加固与评测口径。当批量实现科学数据格式解析器或做兼容性加固时使用。
version: 1.0.0
---

# 格式适配器工程方法

## 用途与何时使用

- 手上有一份「几十到上百种文件格式 + 每格式若干公开样本」的清单，需要在有限时间内批量产出可被机器验收的解析器包。
- 已有适配器包在隐藏样本上失分，需要按机制定位并加固（内容签名、判型规则、输入布局、读上限）。
- 需要一套可复用的「生成 → 本地判分 → 加固 → 打包」流水线，而不是逐格式手写。

本技能给工程方法与踩坑清单；计分判据细节见 `references/scoring-model.md`，加固配方见 `references/hardening-playbook.md`，离线判分与 QA 见 `sf-fmt-local-judge`。

## 交付契约：四件套

| 文件 | 必须写什么 | 关键约束 |
|---|---|---|
| `manifest.json` | `format_id`、`domain`、`extensions`、`input`（`file`/`directory`）、`route`、`requirements`、`visualization`、`chunking` | `format_id`/`domain`/`extensions` 以 `samples/<包目录名>/card.json` 为准；`input: directory` 必须声明 `companions` |
| `parser.py` | `load(path, format_name) → (数组或 {名字: 数组}, metadata)`；先做内容签名校验，再做载荷恢复 | 只用标准库 + numpy；**不按文件名判型**；读不了抛异常并写清原因 |
| `knowledge.json` | `format_profile`、`use_cases`（K1）、`metadata_schema`（K2）、`sniff_rules`/`quality_rules`（K3）、`feature_plans`（F） | schema 不合规时整包在运行代码前就被退回 |
| `expected/<样本组>.json` | 每个公开样本组一份 | 用生成的 parser 在真实公开样本上跑一遍后回写，保证自洽；组名 = 样本组**目录名** |

包级硬限制：单包 ≤2 MiB（不含样本）、代码文件合计 ≤1 MiB、成员 ≤128、可见 helper ≤15 个且必须与 `parser.py` 同目录；不得含样本/二进制/符号链接/子目录代码/`__pycache__`/点开头文件。

## 生成器流水线（七步）

1. **读契约**：先读工具包的 `SKILL.md` 与验收器 `core/`（契约、判据与平台同一份），再读 `formats.csv` 与每格式 `card.json`。
2. **推导内容签名**：对每格式扫公开样本主文件，按 magic → 文本 → 长度关系 → `min_size` 的优先级生成签名。
3. **生成四件套**：manifest 从 card 派生；parser 用统一模板注入签名与载荷恢复；knowledge 按域模板 + 每格式 sniff/quality；expected 占位。
4. **回写 expected**：用生成的 parser 对每个公开样本组真跑，把真实 shape/dtype/信号名写进 `expected`（不要手写 guess）。
5. **并行本地判分**：用工具包 `check.py` 逐包跑（多进程），汇总每格式最高等级 / K / Z / F / 失败码。
6. **修 P0 再加固**：先修 L0/L1 级别的确定性缺陷，再按 L2 → K3 → 布局 → 读上限 → 规范级的顺序加固（见下）。
7. **打包与 QA**：只收白名单成员、排除 `__pycache__` 与点文件、单包与整包限额校验，然后冻结 + 记 sha。

规模参考（实测）：一套生成器 + 模板可在小时级产出 100+ 个包；本赛三题共 311 个包（118 / 102 / 91）由同一套流水线产出。

## 内容签名设计（核心）

签名决定 L2：**随机字节必须被拒、合法变体必须被收**。按优先级：

| 优先级 | 签名类型 | 判据 | 适用 |
|---:|---|---|---|
| 1 | 标准 magic | 首字节或固定偏移的规范标记（如 PNG `89 50 4E 47`、HDF5 `89 48 44 46`、MRC 的 `MAP ` @208、DICOM 的 `DICM` @128、RIFF 的 `RIFF`+`WEBP`、TIFF 的 `II*\0` / `MM\0*`） | 有公开规范/容器头的格式 |
| 2 | 文本载荷 | 前 8 KiB 可打印字节占比 ≥85% | 纯文本格式 |
| 3 | 头部字段与长度关系 | 文件长 = 头整数 × multiply + adjust（扫 offset 0–95、宽 2/4/8、双端序拟合） | 无 magic 的定长二进制 |
| 4 | 最小尺寸 | 阈值满足「完整样本全过、半截断全判坏」 | 补充质检规则 |

推导算法要点（实测有效）：

- 公共前缀 = 所有公开样本主文件前 32 字节的最长公共前缀，≥2 字节才采用。
- 文本类 = 所有样本可打印率 >85%。
- 无前缀二进制 → 扫头部找线性长度关系；拟合不出就别硬造。
- 实测分布：某题 118 格式中 97 个有 magic、17 个文本、4 个用长度关系；另一题 102 格式中 61 文本 / 40 magic / 1 长度守卫。

**硬规则：签名里不能出现 producer 名、版本字节、日期、样本文件名或样本文本字面量。** 这些在隐藏样本上必变（实测：把 32 字节公共前缀（含 producer/版本）写死，hidden 掉 L2；收到 4 字节经典 magic 后同类 hidden 转 pass）。

反例拒绝能力：4 字节 magic 的随机碰撞概率约 2⁻³²；文本兜底对 4096 字节随机数据的可打印率约 37%，必然拒绝。

## 判据要点（实现视角）

| 项 | 实现时最容易漏的点 |
|---|---|
| L0 | `expected` 必须由 parser 真跑回写；`n_points` 等统计键要与数组真实大小一致（重复键覆盖会静默改值） |
| L1 | `metadata.format` 必须等于 manifest 的 `format_id`；顶层要有识别证据键（`magic`/`header`/`signature`/`dimensions`/`columns`/`shape`/`version` 或 `n_*`/`num_*`/`total_*`/`count_*`）；每维 axes 的 name 1–64 字符、unit 1–32 字符且不是占位词；**本域 `domain_fields` 至少一个键在 metadata 顶层且非空** |
| L2 | 隐藏样本换名跑；公开样本也会用乱序名重跑一遍且不给 expected（产出必须只由内容决定）；半个文件截断要么抛异常要么给出合规产物；4096 字节随机数据必须抛异常 |
| L3 | `visualization` 声明的 signal 必须真实存在且维数匹配（`image` 要二维、`image_grid` 要三维）；对比模式要求多样本横轴 name+unit 一致 |
| K2 | required 键在**每个**公开样本产物中出现（覆盖 ≥80%），且声明单位能在单位表归一（`index`/`1`/`null` 安全） |
| K3 | 判型规则要认出每个公开样本且不误认内置负例；质检规则要同时做到「完整判好、截断判坏」，两条都满足才得分（all-or-nothing） |
| Z | 声明要覆盖 parser 返回的**每个**数值数组；坐标要么 `index`，要么 metadata 里有 start+step；块长是物理单元长度整数倍 |
| F | 特征方案引用的数组必须真实存在；检索元数据键要在 schema 内且实际产出 |

## P0 类缺陷清单（按危害排序）

| 缺陷 | 现象 | 修法 |
|---|---|---|
| 重复键覆盖 | 域字段机制把静态值写进 metadata 字面量，与真实统计键同名（如 `n_points`），后者被覆盖 → `expected_mismatch` → 整格式 L0 失败 | 域字段写回时过滤保留键（`format`/`magic`/`n_points`/`axes`/`acquisition`/`provenance`/`processing`），并逐包断言 `meta.n_points == data.size` |
| 域字段落空 | 生成器只在元数据写 `n_points`，而某些域的 any_of 不含它 → 该域全部格式 L1 失败（可波及 50 个格式、近半分数） | 按域输出 any_of 里的键；优先用可从 shape 计算的计数键，宁少勿多 |
| 多段扩展名匹配 | 用 `Path.suffix` 比较，`.ome.tif`/`.metadata.txt` 永远匹配不上 → 格式被跳过或主文件识别错 | 统一 `name.lower().endswith(ext.lower())` |
| manifest 与 card 不一致 | extensions/format_id/domain 取自别处，个别格式与 `card.json` 不一致 → 整包退回 | 一律以 `samples/<包目录名>/card.json` 为权威 |
| 冒号格式编号 | `unregistered:xxx` 的目录名是 `unregistered__xxx`，但 `format_id` 必须写冒号原编号 | 两处分别处理：目录名下划线、manifest 冒号 |
| 样本名进代码 | parser 的 docstring/注释里写了公开样本文件名 → 隐藏改名重跑时判 `hardcoded_sample_name` | 源码中不出现任何样本名；用通用文案 |
| 空 marker 文件 | 0 字节或纯空白文件（如某些求解器的 `.foam` 入口）被当坏文件 | 单独处理：允许空/空白，元数据 `magic` 写 `empty-marker`，随机字节仍拒绝；或读同目录数据兜底 |
| 白名单库名错 | 声明的库名不在白名单/环境没装（如把 `PIL` 写成 `Pillow`、声明 zarr）→ 退回或运行期缺库 | 优先 `route: synth`（纯标准库+numpy）；要声明库时用白名单导入名 |
| helper 与标准库同名 | 辅助模块命名为 `codecs.py`/`json.py` → 第三方库内部报怪错 | helper 用项目前缀命名 |
| `__pycache__` 入包 | 反复 import 后打包 → `package_bad_member` 整包退回 | 判分/打包前清理；生成器设 `sys.dont_write_bytecode` 并在打包时排除 |
| expected 缺组/组名错 | 按文件名而不是样本组目录名写 → `expected_missing` 整包退回 | 每个 public group 一份；组名取目录名 |

## 加固分层（按 ROI 顺序）

### 第一层：L2 parser 加固（单笔最大收益）

- **文本回退**：前缀不匹配时改判「文本载荷」（前 8 KiB 可打印率 ≥85% 即接受）。适合所有文本格式：换 producer banner、换 XML 编码仍应能读。
- **二进制收前缀**：32 字节公共前缀 → 前 4 字节经典 magic。长前缀里通常混着 producer/版本字段，隐藏样本换 producer 即被误拒。
- **HEAD_TEXT 兜底**：没有 magic 的二进制格式，用文件头可打印率阈值（由样本推导）拒绝随机字节，而不是靠「总是恢复 payload」。
- **空 marker 处理**：见上表。
- 验证：public 逐包 diff=0；judge 同款确定性的 4096 字节随机数据仍全部被拒；截断行为不变。

### 第二层：K3 弱嗅探与质检规则

- 对每包追加「负数安全」的弱判型规则（短 magic、XML 根元素、正文 token、尾部标记），`sniff_match: any` 聚合。
- **每条候选规则必须用官方 core 现场验证**：schema 合法 + 所有公开样本被认出 + 内置负例一个不误认；未通过就原包不动（宁可不加，不要误认）。
- 质检规则优先顺序：`min_size`（完整全过、半截断全判坏）→ `trailer_hex`/`regex_tail`（公共尾标）→ `size_field`/`size_expr`（头字段长度关系）。
- **写不准就不写**：K3 是 all-or-nothing，写错的规则会让隐藏样本 `quality_misjudged`；宁缺勿错。
- 验证：public 侧 K3 只升不降；负例集合（PNG/JSON/CSV/随机）一个不误认。

### 第三层：dir-mode（布局鲁棒）

- 动机：`input: file` 模式下，隐藏样本组必须**恰好 1 个**候选文件匹配 `extensions`（排除 companions）；0 个或多个 → `input_mismatch` → L2 只按 partial 计。
- 改造：`manifest.input: file → directory`；`companions` 设为主扩展名（保证 K3 锚点仍是原来的主文件）；parser 收到目录时按 `extensions − companions` 选候选、逐个 `_check`、取第一个通过者；全部不通过则取第一个（load 时仍会 `_check`）。
- 收益依赖隐藏布局：同组多文件/换扩展名时有收益，单文件 hidden 时与 file-mode 完全等价（实测：一题 +1.89，一题 +1.11，一题 +0）。
- 验证：public 逐包 diff=0；同款 garbage 目录（组内所有文件替换为随机字节）仍全部抛异常；单文件 hidden 回归完全相同。

### 第四层：读上限

- `open().read(64 MiB)` 而不是整文件 `read_bytes()`：避免超大隐藏样本把内存/时间打爆（每样本 300 秒、4 GiB 限制）。
- 公开样本最大远小于上限 → 公开侧天然 0 回退；平台若无超大样本则零增益（实测），成本为零，属纯保险。

### 第五层：规范级 parser 修复（收尾期）

- 只改能用格式规范/官方文档论证的识别逻辑，且**保留原校验作为 fallback**（`接受新形态 or 原前缀`）。
- 每批记录「格式数 / diff 数」，用「允许的变体」造 hidden 对照：改前 partial → 改后 pass 才算成立。
- 实测案例：DICOM 前导可任意但魔数在 offset 128；Igor IBW 前 2 字节是 version、3–4 字节是 checksum（内容相关）；TIA SER 以 `II` 开头；netCDF `CDF` + version∈{1,2,5} 或 HDF5；CGNS 在 offset 4 的 `ADF `/`CGNS` 或 HDF5；GDSII/OASIS 两套魔数；TIFF 容器允许双字节序；JPEG 首个 marker 可为 APPn；HDF5 签名可位于 512/1024/2048 的 user block。
- 期望值：Σdiff × 2.2%–9.5%（实测区间，取区间下沿做决策）；零增益批次（如 HDF5 user block 未命中）视为安全彩票，不追加。

## 工程原则（硬约束）

1. **纯标准库 + numpy**（`route: synth`）：不要依赖第三方解析库；确实需要时只声明白名单导入名。
2. **不按文件名判型**：格式身份来自调用方传入的 `format_name`；解析只看内容。
3. **expected 与 parser 自洽**：先有 parser 再回写 expected，不要手写期望值。
4. **读不了就抛异常并写清原因**：不返回占位数组；截断文件允许抛异常或给出合规产物，两者都合法。
5. **没有规范依据就不改**：收尾阶段的每个放宽都要能引用规范/官方文档；不能引用就不动（宁少勿猜）。
6. **一次只改一类**：同一批只动一种机制（如只收紧 garbage、或只放宽签名），并保留上一版作为回滚锚点。

## 质量与验证

- 每批改动跑全量本地官方判分，与上一版**逐包 diff**（highest/levels/L2 checks/K/Z/F 全字段），要求 0 回退。
- 显式验证 garbage/truncated/opaque 三类行为不变。
- 用合成 hidden 代理验证方向（见 `sf-fmt-local-judge`）；代理分只做相对比较。
- 独立复核：由另一个 Agent 从冻结包复算成员差异与判分，确认「提交的包 = 验证过的包」。

## 自检清单

- [ ] 四件套齐全；`manifest.format_id`/`domain`/`extensions` 与 `card.json` 一致。
- [ ] 每个公开样本组各有一份 `expected/<组名>.json`，由 parser 真跑回写。
- [ ] 全量 public：L0/L1/L3 全过；K/Z/F 本地可验证项全过。
- [ ] garbage 全拒；truncated 行为合规；改名后产出不变。
- [ ] 包内无样本、无 `__pycache__`、无点文件、无子目录代码、无符号链接。
- [ ] `route: synth` 且 `requirements` 为空（或只用白名单导入名）。
- [ ] 本批改动 public 逐包 diff=0，且有规范依据与 fallback。
- [ ] **提交前已跑完全量本地官方判分**（不是抽样），逐包报告归档；未验证的版本不占用提交额度。
- [ ] **本版已单包冻结**：完整包 + 成员清单 + 包 sha；提交内容与冻结件逐字节一致。
- [ ] **版本与分数已对账**：提交编号 ↔ 包 sha ↔ 分数 三方记录齐全，回滚锚点可用。

## 参考文件

- `references/scoring-model.md`：L0–L3/K/Z/F 的完整判据、隐藏样本判分语义、常见失败码与扣分位置。
- `references/hardening-playbook.md`：五层加固的逐步配方、代码级改法、验证门槛与真实增益校准。
