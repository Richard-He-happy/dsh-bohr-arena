---
name: bohr-p2-skill-blueprint
description: 参赛 Skill 构建规范：目录布局、SKILL.md 章节、result.json 契约与逐字证据、脚本健壮性、打包与提交前自检。当编写面向隐藏案例评测的 Agent Skill/插件包时使用。
version: 1.0.0
---

# 参赛 Skill 构建规范（隐藏案例评测版）

## 1. 用途与前提

**用**：为「平台把 Skill 装进官方 Harness、在 3 个固定隐藏案例上真实运行、再由 judge 按 rubric 打分」这类比赛/评测写 Skill 包。
**核心判断**：分数来自"跑得完 + 产物可复核"，不来自 SKILL.md 的篇幅。先把运行与落盘做到 100% 稳定，再谈质量与创新。
**配套**：逐题配方见 `bohr-p2-task-playbooks`；提交与排障见 `bohr-p2-submission-ops`；全景见 `bohr-p2-overview`。

三段平台约束（题面公开）：

- 预算：每次运行 64 次模型请求 / 900 秒 / 单次响应 16384 输出上限。
- 输入：`/input/case.json` + `task.md` + 附件；工作目录 `/app/work`，最终产物 `/app/output`。
- 资源：≤50 个 UTF-8 文本文件、单文件 ≤500KB、总计 ≤2MB、无符号链接。**二期的分数分布**：多数最好版本落在 5–20 文件、90–190KB、1–6 个脚本；27–28 文件 / 240–300KB 的"完整版"在润色、引用管理、LaTeX、方法章节、笔记五类上普遍掉分（Nanopublication 是例外，见任务手册）。

## 2. 目录布局

```
submission/
  SKILL.md                  # 唯一入口，必须在提交根目录
  scripts/
    _common.py              # 路径/IO/result 骨架等共用工具（可选）
    inventory.py            # 只读盘点：文件、类型、编码、可读性、契约
    verify.py               # 确定性校验：数字/引用/quote/覆盖率
    finalize.py             # 组装主产物与 result.json，任何情况都要跑
    selftest.py             # 负例回归（可选，但强烈建议）
  resources/
    result_schema.json      # 16 字段机器可读约束
    rubric_checklist.md     # rubric → 检查项
    templates/              # result 骨架、主产物模板
    examples/               # 最小示例（必须标注"示例，非正式案例结果"）
```

硬规则：`SKILL.md` 只能有一份正式入口（提交根目录），不要在包里出现两份内容不一致的 SKILL.md；SKILL.md 提到的每个相对路径都必须真实存在；不要打包 `__pycache__`、`.pyc`、`.venv`、大二进制、示例 PDF。

## 3. SKILL.md 推荐章节（按序，14 节）

| # | 章节 | 必须写清 |
|---|---|---|
| 1 | frontmatter | 多行 YAML，`name`（kebab-case）/`description`/`version`；`---` 单独成行闭合，不要写成单行 |
| 2 | 一句话说明 + 触发 | 输入、产物、何时用/何时不用 |
| 3 | 运行契约 | 输入路径、工作目录、输出目录、状态取值、退出码约定 |
| 4 | 输入发现 | 不假设键名；递归扫附件；编码与格式探测；`case_id`/`output_contract` 定位 |
| 5 | 输出契约 | 主产物列表（路径 + 可编辑格式）；`result.json` 字段；`output_contract` 原样回填规则 |
| 6 | 核心流程 | 步骤化、带命令；每步"输入 → 动作 → 产物" |
| 7 | 质量规则映射表 | 题面每个评分要素 → 1 个字段 + 1 个检查 + 1 个产物位置 |
| 8 | 证据与定位 | quote 逐字规则、locator 语法、匹配失败如何处置 |
| 9 | 冲突/缺口/人工确认 | 不猜、不覆盖、可执行 `pending_human` |
| 10 | 预算与断点 | 64/900s/16384；约 780 秒立即 finalize |
| 11 | 异常与降级分支表 | 无输入/无文本层/依赖缺失/脚本异常/输出不可写/预算耗尽 |
| 12 | 自检清单 | 逐项可勾选，对应 rubric 维度 |
| 13 | 最小调用示例 | 明确标注"示例，非正式案例结果" |
| 14 | 文件清单与维护 | 每个文件被谁调用；版本；已知限制 |

写作要求：命令一律用脚本自算的根目录（如 `<skill_root>/scripts/x.py`），不要写死安装路径；正文中文、命令与字段名保持英文。

## 4. result.json 契约

`result.json` 必须在 `/app/output` 下**始终存在**，且 16 个顶层字段齐全（缺值给 `null` / `[]` / `{}`）：

```json
{
  "case_id": "from_input",
  "status": "ok|partial|failed",
  "summary": "",
  "artifacts": [{"path": "/app/output/...", "kind": ""}],
  "primary_result": {},
  "evidence": [],
  "sources": [],
  "coverage": {},
  "verification": {},
  "uncertainty": [],
  "pending_human": [],
  "errors": [],
  "degradations": [],
  "changes": [],
  "runtime": {"requests": 0, "elapsed_seconds": 0, "script_versions": {}},
  "output_contract": {}
}
```

- **`output_contract` 原样回填**：不改名、不合并、不删键、不丢未知字段；能填的填真实值，不能填的置 `null` 并记入 `degradations`。这是最容易被 judge 直接抓到的硬契约。
- **状态诚实**：只有主产物 + 证据 + 自检都满足才允许 `ok`，否则 `partial`；未知值写 `null`/`unknown`，不填"常见值"。
- `artifacts` 用真实路径；`runtime` 填真实请求数与耗时，不填估计值。
- 字段定义与骨架见 `references/result-contract.md`。

## 5. 逐字证据规范

一条可核验证据 = `claim`（或 `unit`/`field`）+ `quote` + `locator`。

1. `quote`：从原文复制的**连续逐字片段**（建议 8–160 字符），不改标点、不补省略、不翻译、不拼接。
2. `locator`：文件/页码/段落/章节/行列/JSON Pointer，例如 `paper p.3-4 [U0012]`、`§Methods ¶3`、`L120-134`、`/materials/0/content#...`。
3. 匹配算法：NFKC 归一 + 空白折叠 + 断词连字符复原 + 引号/破折号统一后再做子串匹配；匹配失败即"不可核验"，不允许改写原文凑通过。
4. 找不到证据就进 `pending_human`（写明可执行的下一步），**不要把不可核验内容写成事实**。
5. 每个关键数字、引用、结论、表行、图注都要有对应证据；同一 quote 支撑多条结论时可合并。

## 6. 脚本健壮性硬规则

| 规则 | 具体要求 |
|---|---|
| 纯标准库 | 只用 Python 3 标准库；PDF/Office 处理按"环境工具 → 内置降级"阶梯，第三方库只 try/except 可选 |
| 不依赖 CWD | 根目录由 `Path(__file__).resolve().parent` 推导，并对 `<root>/scripts`、`<root>/submission/scripts`、`/app/submission/scripts` 多布局回退 |
| 退出码恒 0 | 捕获所有异常，把错误写进 `result.json.errors`；绝不让 harness 因非零退出拿不到结果 |
| 先落盘后优化 | **第一步就写 partial `result.json`**；此后每完成一块产物就重写一次；最后无条件 finalize 覆盖 |
| 异常隔离 | 单文件/单页/单材料失败不影响全局，逐项 try/except 并记 `degradations` |
| 无导入期副作用 | 顶层不读文件、不起子进程、不联网；全部放进函数/`main()` |
| 包体控制 | 二期最好版本多为 5–20 文件、90–190KB、1–6 个脚本；27–28 文件 / 240–300KB 的包多数掉分。单文件 ≤500KB、包 ≤2MB 是平台硬上限 |
| 预算 | 约 780 秒或 56 次请求即停止扩写，直接 finalize；已写内容不删 |
| 幂等 | 重复运行输出一致；时间戳/随机数不进主产物，或写进 `runtime` |

## 7. 打包与提交前清理

1. 只把 `submission/` 打包；确认根目录就是 `submission/SKILL.md`。
2. 清理：`__pycache__`、`.pyc`、`.venv`、`.DS_Store`、示例 PDF、日志、任何凭据或密钥文件。
3. 脚本化校验：解析 SKILL.md 里出现的所有相对路径，逐个确认文件存在；确认没有第二份 SKILL.md 与正文冲突。
4. 检查包内文件数与总大小，留出余量（bundle 还要额外附带轨迹与结果副本，实际体积约为 outputs 的 2–3 倍）。
5. 提交前跑一遍负例：空输入、坏 JSON、缺附件、超长输入，都必须仍产出一个合法 `result.json`。

## 8. 失败模式与对策

| 失败模式 | 典型症状 | 对策 |
|---|---|---|
| frontmatter 不合法 | 单行 `--- name: … ---`；解析失败直接 evaluation_error | 标准多行 YAML，闭合 `---` 单独一行 |
| 入口位置错 | 只有 `scripts/`、或 SKILL.md 在工作区根目录 | 唯一入口放提交根目录；自动识别前缀不可靠时显式指定 |
| 引用文件缺失 | SKILL.md 提到 `resources/xx.json` 但包内没有 | 提交前脚本化路径检查 |
| CWD/硬编码路径 | 换目录运行即失败 | 用 `__file__` 自算，多布局回退 |
| 脚本超大或链路太长 | 50KB 以上单脚本叠加多阶段串行，易超时/异常中断 | 优先拆成 ≤3 个脚本并各自 ≤20KB；保留大脚本时必须验证时长、异常分支与中途落盘 |
| 示例依赖第三方 | 示例里 `import torch` 之类导致扫描崩溃 | 示例只用标准库；可选依赖 try/except |
| 未先落盘 | 超时后 0 产出 | 第一条命令写 partial |
| 证据不可核验 | 无 quote、页码编造、不匹配仍判过 | 逐字 quote + 匹配失败降级 |
| 契约丢字段 | `output_contract` 被改名/漏键 | 原样透传，不认识的键也保留 |

## 9. 提交前自检（可执行版）

- [ ] `submission/SKILL.md` 存在，frontmatter 合法（name/description/version 三键），`name` 与目录名一致；
- [ ] SKILL.md 提到的每个路径都在提交包内；
- [ ] 每个脚本 `python3 -B script.py --help` 退出码 0（或明确的 selftest 入口）；
- [ ] 空输入 / 坏 JSON / 缺附件测试后仍有合法 `result.json`；
- [ ] `result.json` 16 字段齐全，`output_contract` 与输入逐键一致；
- [ ] 抽查 3 条 quote 能在原文逐字检索到；
- [ ] `status` 与覆盖率/校验结果自洽；
- [ ] 无 `__pycache__`、无大二进制、无凭据；
- [ ] 文件数 ≤50、单文件 ≤500KB、总计 ≤2MB。

完整清单与负例夹具设计见 `references/selftest-checklist.md`；字段细则见 `references/result-contract.md`。

## 10. 参考文件

- `references/result-contract.md`：16 字段逐项定义、状态语义、`output_contract` 规则、证据/来源/覆盖率结构、读写示例。
- `references/selftest-checklist.md`：A–G 分组执行清单、60 秒快速协议、负例回归设计、rubric 维度 ↔ 检查项映射。
