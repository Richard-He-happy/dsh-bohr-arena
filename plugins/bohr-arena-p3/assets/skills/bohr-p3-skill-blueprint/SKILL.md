---
name: bohr-p3-skill-blueprint
description: 极简 agent-first Skill 设计法与四赛道交付契约：init/show/check/build 流程、eval 等价冒烟、产物兜底、极限稳健版与包体约束。当为 reading/writing/graphics/slides 类任务编写参赛 Skill 时使用。
version: 1.0.0
---

# 极简 agent-first Skill 设计法与四赛道交付契约

## 1. 用途与何时使用

写给"要被另一个 Agent 加载、在隐藏案例上真实运行、再由评审按 rubric 打分"的参赛 Skill。解决四个问题：

1. 包怎么组织才能在评测环境跑得动、跑得完、跑出真产物；
2. 怎么让评测 Agent 真的**读材料并推导**，而不是只运行一条命令拿模板答案；
3. 四类任务（reading / writing / graphics / slides）各自的交付契约与核验资产；
4. 提交前怎么用 eval 等价路径把"本地能跑、评测必挂"的 bug 挡在门外。

不适用：比赛整体节奏与提分手段选择（见 `bohr-p3-overview`、`bohr-p3-scoring-strategy`）；逐题细节见 `bohr-p3-task-playbooks`。

## 2. 评测环境的运行契约（事实层）

| 项 | 要求 |
|---|---|
| 包根 | 包根目录即提交目录；入口 `SKILL.md` 必须在根；YAML frontmatter 合法（name kebab-case / description / version） |
| 装载 | 包被装到固定 Skill 目录，由官方 Harness 加载执行；**评审看运行产物，不看自述** |
| 输入 | 原始输入 `/input/case.json` + `/input/task.md`；附件/材料在 `/input/` 下（PDF、图片、表格、JSON、DOCX 等可能混合） |
| 工作区 | 工作目录 `/app/work`；产物写 `/app/output/`，必须含 `result.json` |
| 预算 | 64 次模型请求、900 秒、单次回复上限 16384 词元；接近 780 秒立即 finalize |
| 依赖 | 只用 Python 标准库；不联网；不依赖当前工作目录（用 `Path(__file__).resolve().parent`） |
| 稳健 | 第一步先写 partial `result.json`；任何异常捕获写入 `errors`/`degradations`；**退出码恒 0**；不伪造软件状态与数据 |

包体上限（平台侧）：单文件 ≤500KB、总 ≤2MB、UTF-8 文本文件 ≤15 个。**实际推荐**：4–8 个文件、总计 60–150KB、主脚本 ≤20–25KB。

## 3. 核心方法：极简 agent-first

### 3.1 为什么不是"脚本一条龙"

纯脚本抽取式作答的包，在隐藏案例上会被判"输出不够完整/不是真正推导"（实测：大量 55–65 分，个别 0 分）。原因有三：隐藏案例的输入形态与假设不一致；脚本抽出的内容缺表达与判断；评测 Agent 只跑入口命令、语义没有被真正推导出来。

改成"**Agent 主答 + 脚本辅助 + 兜底必成**"后，同一批题的 0 分原型做到 59~71.67，成为本期最高 ROI 的重设计。

### 3.2 五命令主路径（写进 SKILL.md，脚本提供）

```bash
python3 scripts/main.py init      # 建索引：case/材料/段落/图表/workorder + partial result.json
python3 scripts/main.py show      # 打印带 locator 的原文（Agent 引用时逐字复制）
#  Agent 亲自读材料，写 /app/work/draft.json（或 plan.json）
python3 scripts/main.py check     # 机械校验：quote 命中、字段齐全、覆盖数、数值与引文一致
python3 scripts/main.py build     # 生成主产物 + result.json（无条件 finalize）
python3 scripts/main.py selfcheck # 只复检，不重做（可选）
```

强制流程必须写在 SKILL.md 显眼处，并明确一句："**脚本不会代替你阅读理解；必须先阅读再写工作稿，禁止只运行 build 就结束**"。原因：评测 Agent 大概率照抄 SKILL.md 写出的命令序列。

### 3.3 build 兜底（不要 0 分）

`build` 在工作稿缺失/不完整时也必须产出**完整最小交付**：合法 `result.json`（契约字段全回填）、最小主产物、`status=partial`、`degradations` 写清缺口、退出码 0。这样即使评测 Agent 超时或没写工作稿，也能拿到"完整但降级"的基础分，而不是空目录。

### 3.4 规模建议

| 组成 | 建议 | 说明 |
|---|---|---|
| `SKILL.md` | 8–14KB | 用途/契约/流程/工作稿 schema/证据规范/降级表/自检/示例/维护；实测有效包多为 9–19KB |
| `scripts/main.py` | ≤20–25KB | 子命令入口 + 编排 |
| 第二脚本 | ≤20KB | 渲染/解析/校验等专用能力，按赛道加 |
| `references/*.md` | ≤3 个 | schema、判据词表、检查清单；不要放大段题面 |
| 文件总数 | 4–8 | >8 文件时评测失败概率显著升高 |
| 总量 | 60–150KB | 超 300KB 的"完整版"掉分最狠 |

## 4. 四赛道交付契约（摘要）

完整字段级契约见 `references/contracts-by-track.md`。

| 赛道 | 契约形态 | 根字段 | 必交主产物 | 附加核验资产（高分关键） |
|---|---|---|---|---|
| reading | 业务型 dict | `case_id`、`status`、`result`、`claims`、`uncertainties` | 结构化结果 + 可复核 CSV/JSON/MD | `coverage` 计数、`method_notes`、逐条 evidence（locator+逐字 quote） |
| writing | 交付型 dict | `case_id`、`deliverable`、`preserved_facts`、`evidence_map`、`change_log` | 可编辑文稿（md/docx/tex）+ 事实保全 + 修改记录 | `workorder` 逐项回执、`preserved_facts` 计数一致、`export_preview` |
| graphics | 产物型 list | `case_id`、`status`、`editable_source`、`export_artifact`、`content_map`、`compliance_checks`、`exceptions` | 分层可编辑 SVG + 真实 PNG + 真实 PDF + 中间模型 | content_map 元素级溯源、合规检查、图例/编码一致性断言、两次运行一致 |
| slides | 产物型 list | 同 graphics | 真实可编辑 pptx + 真实 PDF 导出 + 逐页 content_map | 页级计划/金标准、逐页 diff、模板继承证据、页数一致断言、变更记录 |

通用规则：

1. `output_contract` **原样回填**：不改名、不遗漏未知字段；缺值 `null`/`[]`。list 型契约要逐字段建映射表（见第 6 节）。
2. 主产物必须**真实可编辑**（md/tex/csv/json/svg/pptx），不是截图；导出件必须**真实可打开**（%PDF- 头 + 页对象；PNG 解出 IHDR）。
3. 每个关键结论/元素/页面/单元格都要能回到 `source + locator + 逐字 quote`。
4. 状态诚实：做到 `ok`，部分完成 `partial` 并写缺口，缺材料 `insufficient_evidence`，输入坏 `input_error`。

## 5. 纯标准库兜底（评测镜像不保证有渲染器）

| 场景 | 兜底做法 | 必须记录 |
|---|---|---|
| 无 LibreOffice / soffice，需要 PDF | 纯标准库写字面量 PDF：`%PDF-1.4` + 页对象 + xref/trailer + 逐页文本（标题+要点）；中文字符用 CID 或转写 | `degradations` 注明"文本层 PDF，非排版渲染" |
| 无 python-pptx，需要 pptx | `zipfile` 手写最小 OOXML：`[Content_Types].xml`、`ppt/presentation.xml`、slide XML、rels；文字用占位符文本框 | 同上；保证 zipfile 可打开、页数正确 |
| 无 matplotlib / Pillow，需要 PNG | 用 `zlib` 手写 PNG（IHDR/IDAT/IEND）；退化为"白底 + 标题块"也要是合法图 | 同上 |
| 图片/扫描件无 OCR | 不猜内容，列缺口进 `pending_human`；有 OCR 工具时先调用并落文件 | `degradations` |
| PDF 文本抽取 | 优先平台 PDF 文本工具；无工具时内置最小解析（zlib 流 + 文本域），页号 locator 降级说明 | 降级说明 |

**反例（实测）**：给"本来有可用渲染路径"的包强行加劣质 PDF 兜底，反而掉分（同一幻灯片题的兜底版 57.67 vs 正常版 83）。兜底是**缺件时**的保险，不是常规路径。

平台可能提供的工具（按需调用、失败即降级）：PDF 文本/渲染、OCR、LaTeX 编译、Office 渲染、字体发现、科学计算、浏览器自动化。SKILL.md 应写一节"工具优先、脚本兜底"，并要求工具产出落盘到 `/app/work` 供脚本引用。

## 6. 三个容易踩的实现坑（实测）

1. **list 型 `output_contract` 没有逐字段回填**：只写了几个字段就 finalize，契约缺字段。做法：内置 `CONTRACT_MAP`（契约键 → 产物/字段路径），finalize 时逐键比对，缺失写 `null` 并计数。
2. **字段匹配用了子串**：把 `status` 映射到 `stats` 聚合对象，类型错误、`case_id` 丢失。做法：精确/词边界匹配；契约键与内部字段建立显式映射，不做模糊匹配。
3. **在 `if __name__ == "__main__"` guard 之后追加函数**：运行期 NameError。做法：新增函数插到 guard 之前；改包后必须重跑 `--help` 与最小 case。

## 7. 极限稳健版（v4）：0 分题的最后一招

适用：同一题多个正常包都返回 evaluation_error（实测出现过连续 5 次），且小包也失败。

配置要点（实测把 0 分题拉到 56.33）：

- 总文件 ≤4、总 ≤30KB；主脚本短、无复杂依赖链。
- PDF 只识别文件头，不解析二进制内容；单文件读取设 2MB 上限。
- 全流程有硬超时（约 10 秒级），超时即写 partial 结果退出。
- 所有异常捕获；退出码恒 0；先写 partial 再 finalize。
- 必须做坏输入测试：空 `/input`、坏 JSON、缺材料三种都要产出合法 partial 结果。
- 结果字段可以少，但契约字段一个不能少。

## 8. eval 等价冒烟（提交前必须做）

本地默认路径与评测路径不同会掩盖 bug。必须按评测路径造环境：

1. `/input`：`case.json`（含 `output_contract`、`task_instruction`）+ `task.md` + 1–2 个最小材料；材料里放 1 个"含关键数字的句子"和 1 个"图表/workorder"形状的对象。
2. `/app/output`、`/app/work` 清空后运行。
3. 检查项：`--help` 退出码 0；`init` 后已有 partial `result.json`；写一份最小工作稿后 `check` 无 FAIL；`build` 后主产物存在且非空、契约字段无缺失；空输入/坏 JSON 仍 exit 0 且 `result.json` 合法。
4. 同一输入跑两次，产物结构一致（不依赖时间/随机/机器差异）。

详细协议与历史 bug 清单见 `references/selftest-protocol.md`。

## 9. 常见失败模式与对策

| 失败模式 | 后果 | 对策 |
|---|---|---|
| 只交 scripts 没有 SKILL.md / SKILL.md 引用不存在的文件 | 包不可用或直接低分 | 构建任务书第一步先写 SKILL.md 骨架；提交前校验每个相对路径存在 |
| 加功能、堆文件、堆脚本 | 掉分最狠（文件 20+ / 240KB+ 的"完整版"） | 极简三件套；新增能力必须先证明 rubric 有对应得分点 |
| 大脚本 50–90KB、第三方依赖、多阶段脆弱链 | 评测失败概率高 | 主脚本 ≤20–25KB；只用标准库；链路 ≤3 段 |
| 硬编码 Skill 安装路径、依赖 CWD | 换环境即挂 | `Path(__file__).resolve().parent`；参数可覆盖默认路径 |
| 一个材料失败拖垮全流程 | 整包 0 分 | 分材料 try/except 隔离；失败降级该部分并记 `errors` |
| 预制答案 / 把示例当正式结果 | 视为伪造，风险最高 | 示例放 references 并标注"示例，非正式案例结果"，不参与 `/input` 扫描 |
| 只在 SKILL.md 写"我会做什么" | 评审看运行结果，文字不算 | 每条 rubric 都要有对应检查/字段/产物落点 |
| 非零退出码 / 空产物 | 直接判失败 | 顶层 try/except + finalize + 恒 0 退出码 |

## 10. 自检清单（打包前逐项打勾）

- [ ] 包根有 `SKILL.md`，frontmatter 合法，引用的每个相对路径存在。
- [ ] `scripts/*.py` 均能 `--help` 退出码 0；`ast.parse` 通过；无 `__pycache__`/`.pyc`/临时文件。
- [ ] 默认路径（`/input`、`/app/work`、`/app/output`）可直接运行，无需参数。
- [ ] `init` 后已有合法 partial `result.json`；`build` 后契约字段零缺失。
- [ ] 空输入、坏 JSON、缺材料三种降级均 exit 0 且 `result.json` 合法。
- [ ] 主产物非空且可编辑；导出件是真实文件（PDF 头/PNG IHDR/pptx 可解压）。
- [ ] 文件数 4–8、总量 60–150KB、主脚本 ≤20–25KB。
- [ ] 示例标注"示例，非正式案例结果"，包内无正式案例答案。
- [ ] eval 等价路径两次运行结果结构一致。

## 11. 参考文件

- `references/contracts-by-track.md`：四赛道字段级交付契约（根字段、条目形状、可编辑源/导出件、content_map、compliance_checks、状态语义）。
- `references/selftest-protocol.md`：eval 等价冒烟协议、历史 bug 清单、提交前终检流程。
