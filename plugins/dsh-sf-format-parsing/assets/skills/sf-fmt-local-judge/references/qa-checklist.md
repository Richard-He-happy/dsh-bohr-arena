# 打包与提交前 QA 清单

按顺序逐项打勾；任何一项失败都不得提交。`<包目录名>` 指格式的包目录（`unregistered:xxx` 对应 `unregistered__xxx` 目录）。

## A. 判分环境

- [ ] 本地已用官方工具包 core 跑通单包自检；非 Linux 环境已打「沙箱不行 rlimit」补丁（否则会误报 `ModuleNotFoundError: resource`）。
- [ ] 控制台/子进程编码为 UTF-8；自检脚本读报告做了 utf-8 → 本地编码回退。
- [ ] 判分前已清理 `__pycache__`；每个包用独立临时副本判分。
- [ ] 抽 2–3 个不同难度、不同 `route` 的包做过单包自检，确认不是「只过打包、不过判分」。

## B. 单包结构（逐包）

- [ ] 目录名 = 格式包目录名；`unregistered:xxx` 用双下划线目录名。
- [ ] 必交四件：`manifest.json`、`parser.py`、`knowledge.json`、`expected/<每个公开样本组>.json`。
- [ ] 单包 ≤2 MiB（不含样本）；代码文件合计 ≤1 MiB；成员 ≤128；可见 helper ≤15 个且与 `parser.py` 同目录。
- [ ] 无样本、无二进制文件、无符号链接、无子目录代码、无 `__pycache__`/`*.pyc`/点开头文件。
- [ ] `expected/` 文件名 = 公开样本组目录名（不是文件名）；组数 = 该格式公开样本组数。

## C. 包字段

- [ ] `manifest.format_id`、`manifest.domain`、`manifest.extensions` 与 `samples/<包目录名>/card.json` 一致（以 card 为权威，不是格式清单）。
- [ ] `manifest.input` 与 parser 实际能力一致（`file` 或 `directory`）；directory 模式必须写 `companions`。
- [ ] `manifest.route` 为 `synth` 且 `requirements` 为空，或声明的库全部在白名单且使用白名单导入名。
- [ ] `manifest.visualization` 的 signal 在 parser 产物中真实存在、维数匹配；compare 声明的轴一致。
- [ ] `manifest.chunking` 覆盖 parser 返回的每个数值数组；块长/单元/坐标可解析。
- [ ] `knowledge.json` 通过 schema 校验；`use_cases` ≥2 条且有 metrics 与文献链接；required 元数据键在每个公开样本都产出且单位可归一；`feature_plans` 引用的数组真实存在。
- [ ] parser 返回的 `metadata.format` 等于 `format_id`；有识别证据键；每维 axes 的 name/unit 非占位。
- [ ] 本域 `domain_fields` 至少一个键在 metadata 顶层且非空。

## D. 整包归档

- [ ] 顶层平铺各格式目录（或只多套一层目录）；无深层嵌套。
- [ ] zip ≤64 MiB；解压后 ≤256 MiB；每包 ≤2 MiB。
- [ ] 压缩包内无符号链接、无点文件、无 `__pycache__`。
- [ ] 打包工具只收白名单成员并做确定性排序（同输入产出同 zip）。

## E. 判分回归门禁

- [ ] 全量本地官方判分已跑完（全部包，不是抽样），逐包报告归档。
- [ ] 与上一版**逐包 diff = 0 回退**（比对最高等级、L0–L3 状态、L2 失败码、K/Z/F 全部字段，不只比整体分）。
- [ ] 成员差集恰好等于申报改动的文件类型与数量（如只变 `parser.py`），无意外增删。
- [ ] 若本版为零改动重交，确认与冻结版逐字节一致。

## F. 隐藏行为验证

- [ ] garbage：judge 同款 4096 字节确定性随机数据 → 全部包仍抛异常（无 `garbage_accepted`）。
- [ ] truncated：约一半截断 → 抛异常或给出结构合规产物（无 `truncated_garbage`）。
- [ ] opaque/改名：公开样本以乱序名重跑（不给 expected）→ 产出与原名一致（无 `name_dependent_output`/`hardcoded_sample_name`）。
- [ ] 合成 hidden 代理已跑：`h1` 全过；`h2` 变体为「改前 partial → 改后 pass」；残余失败已人工复核并说明（区分真实风险与构造假象）。
- [ ] dir-mode 若为改动项：同款 garbage 目录（组内文件全替换为随机字节）仍全部抛异常；单文件 hidden 回归与 file-mode 相同。

## G. 冻结与提交

- [ ] 本版已冻结：完整包 + 成员清单 + 报告 + 包 sha。
- [ ] dry-run 通过：bundle 内 `adapters.zip` 的 sha 与冻结件逐字节一致。
- [ ] 输出目录只放一个 `adapters.zip`（多文件曾导致整份 0 分）。
- [ ] **提交前完成全量本地官方判分；未验证的版本不占用提交额度。**
- [ ] **单包冻结已做**，提交内容 = 冻结件，可直接回滚。
- [ ] **版本与分数对账表**就绪：提交编号 ↔ 包 sha ↔ 分数。

## H. 出分后

- [ ] 先核对状态：已评分、分数 >0、包 sha 与冻结件一致；异常状态先区分「平台问题」与「包缺陷」。
- [ ] 分数与本地口径对照：用平台分反推隐藏 L2 通过率，更新下一轮方向（见 `judging-pipeline.md` §3）。
- [ ] 记录本轮「改动类型 / 影响格式数 / 代理增益 / 真实增益 / 校准比 / 回归数」。
- [ ] 更新冻结版本与回滚锚点；把最优版本标记为可回滚基线。

## I. 常见退回/失败码速查

| 码 | 层 | 处理 |
|---|---|---|
| `expected_missing` / `expected_mismatch` | 包级 / L0 | 补齐每组 expected；用 parser 真跑回写，查重复键覆盖 |
| `knowledge_missing` / `knowledge_invalid` | 包级 | 补文件；跑 schema 校验 |
| `package_bad_member` | 包级 | 清 `__pycache__`/点文件/样本/子目录代码，重打干净 zip |
| `manifest_domain_mismatch` | 包级 | 以 card.json 为准改 extensions/domain |
| `requirement_unavailable` / `requirement_not_whitelisted` | 包级 | 改 `route: synth` 或白名单导入名 |
| `format_mismatch` / `evidence_missing` / `axis_unit_missing` / `domain_fields_missing` | L1 | 见 `scoring-model.md` 对应条目 |
| `garbage_accepted` / `truncated_garbage` | L2 | 补格式级签名/质检规则；不要用「总恢复 payload」兜底 |
| `hidden_failed` / `input_mismatch` / `organizer_sample_suspect` | L2 | 前者放宽到格式级结构签名；中者改布局（dir-mode）；后者多为隐藏样本问题 |
| `viz_unresolvable` | L3 | 可视化声明与产物结构对齐 |
| `chunk_too_large` / `chunk_too_small` / `unit_misaligned` | Z3 | 按物理单元长度重设块长（单块 ≤128 MiB、多块时每块 ≥1 MiB、块长为单元整数倍） |

## J. 一页执行顺序（占位命令，按本地路径替换）

```
1) 清理字节码 + 抽样单包自检        check.py <包目录> --samples <样本目录>
2) 全量批量判分                     并行、独立临时副本
3) 逐包 diff 上一版                 0 回退才继续
4) garbage/truncated/opaque 显式验证
5) 合成 hidden 代理 + 残余复核
6) 打包检查 + 干净打包              packages -> adapters.zip
7) dry-run                          bundle 内 zip sha == 冻结件
8) 冻结 + 提交 + 记录提交编号/sha/分数
```

完成后再提交；出分后回到 H 节对账。
