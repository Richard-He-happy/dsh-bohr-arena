# 任务书模板（云端构建 / 重做 / patch / 终检）

> 说明：模板里的 `{{...}}` 是占位符；使用时替换为题目信息与本题 brief 摘录。模板刻意不写具体路径与凭据，环境相关参数由调用方注入。
> 通用原则：**目标先行、契约齐全、规模有红线、自检要真实执行并回报**。每题任务书控制在 9–10KB（含题目 brief 摘录）。

## 模板 0：逐题 brief（构建前的分析产物，5–7KB）

```
# {{题号}} {{题目名}} · authoring brief

## 一句话目标
（用一句话说清"交付什么、交给谁看、合格线是什么"）

## 题面关键约束
- 组织方修订/尾注（最高优先级）：……
- 必做对象清单（workorder/scope/target-fields/claims-to-verify/…）：……
- 输出形态与硬性数量约束（字数/页数/实体数/风险条数/规划单位）：……

## 隐藏案例输入推测
- /input/case.json（case_id、task_instruction、output_contract、organizer_*）
- 材料形态（PDF/表格/图片/DOCX/XML/CSV/JSON）与可能缺失项
- 必须能处理的异常输入（无文本层、缺键、空表、单位变体、多子图错配）

## 必须产物与 result.json 字段
- 主产物：……（可编辑格式）
- 契约根字段与条目形状：……
- 计数/覆盖字段：……

## 评分点 → 实现/检查项映射
- 完成度 15 → ……
- 正确性 15 → ……
- 完整性 5 → ……
- 可核验 5 → ……
- 使用增益/创新/可靠/生态 → ……

## 校验清单（提交前逐项打勾）
- [ ] ……

## 常见失败模式
- ……（3–6 条，来自题面禁令与同类题实测）
```

## 模板 1：云构建任务书（首版）

```
你是云端 Agent，请在 /bohr-workspace/submission/ 构建一个可被官方 Harness 加载执行的 Skill 包。

## 题目
{{题目名}}：{{一句话目标}}

## 评测机制（必须理解）
包会被装到固定 Skill 目录，在 3 个隐藏案例上真实运行，再由评审按题面 rubric 打分：
实际效果 40（完成度15/正确性15/完整性5/可核验5）+ 使用增益25 + 创新15 + 可靠10 + 生态10。
评审看运行产物，不看 SKILL.md 自述。

## 第一步（硬性）
先写 /bohr-workspace/submission/SKILL.md 骨架（frontmatter + 章节标题），再写脚本。
防超时：即使后续被截断，包也必须是"有 SKILL.md 的包"。

## 运行契约（逐条满足）
- 包根即提交目录；SKILL.md 在根；frontmatter 合法（name kebab-case / description / version）。
- 输入 /input/case.json + /input/task.md + 材料；工作目录 /app/work；产物 /app/output/result.json。
- result.json 原样回填 output_contract 全部字段（不改名、不遗漏未知字段，缺值 null/[]）。
- 第一步先写 partial result.json；异常捕获写入 errors/degradations；无条件 finalize；退出码恒 0。
- 只用标准库；不联网；不依赖 CWD（用 Path(__file__).resolve().parent）。
- 预算：64 次模型请求、900 秒、单次回复上限 16384 词元；接近 780 秒立即 finalize。

## Agent 主答 + 脚本辅助 + 兜底必成（主路径）
scripts/main.py 提供子命令：init（建索引+partial result）、show（打印带 locator 原文）、
check（校验工作稿）、build（生成主产物+final result，缺工作稿也产完整最小交付）。
SKILL.md 必须明确写："脚本不会代替你阅读理解；必须先阅读再写工作稿，禁止只运行 build 就结束。"

## 本题要求
{{brief 的"必做对象/契约字段/评分映射/失败模式"摘录}}

## 规模红线
SKILL.md ≤12KB；脚本 ≤2 个、各 ≤20KB；references ≤3；总文件 ≤8；总 ≤150KB；纯标准库。

## 完成前自检（真实执行并报告）
1) 每个脚本 --help 退出码 0；
2) 在 eval 等价路径（/input、/app/output、/app/work）造最小输入跑 init→写工作稿→check→build；
3) 空输入/坏 JSON 仍产合法 partial result.json、退出码 0；
4) 报告：文件清单+字节数、契约字段缺失数、剩余风险 3 点。
```

## 模板 2：极简 agent-first 重做任务书（0 分/low 分救援）

```
题目「{{题目名}}」此前的 Skill 在官方评测中只有 {{当前分}}（judge 认为输出不够完整/不是真正推导）。
请从零重做一个极简、稳健、Agent 主导的版本；不要读旧 baseline。

## 核心设计（必须遵守）
1) SKILL.md 第一步要求评测 Agent：读 case/task/材料；脚本 init 打印材料索引与 workorder 摘要；
   然后 Agent 亲自写工作稿（plan/draft JSON 或 md），再 check 校验、build 成稿。
2) scripts/main.py 四子命令：init / show / check / build（+ selfcheck 可选）。
3) build 必须自成兜底：工作稿缺失/不完整时，用确定性方法产出最小但完整的交付
   （不空、不崩、退出码 0、status=partial 并记录缺口）。
4) 极简规模：SKILL.md ≤12KB；脚本 ≤2、各 ≤20KB；references ≤2；总文件 ≤6、总 ≤60KB。
5) 输入发现：递归扫描 /input，JSON 用 utf-8-sig（防 BOM），键名语义识别；按扩展名+魔数识别材料。
6) 输出契约：result.json 原样回填 output_contract 全部字段 + case_id/status/sources/
   uncertainty/pending_human/errors/degradations/runtime。
7) 先写 partial；异常捕获；退出码恒 0；输出 UTF-8 无 BOM。
8) 示例标注"示例，非正式案例结果"。

## 本题必须产出
{{主产物 + 辅助产物清单}}

## 本题特有要求
{{brief 摘录：必做对象、四状态/四级判定、事前容差、数量约束、诚实边界}}

## 完成前自检（真实执行并报告）
- 文件清单+字节数；两个脚本 --help 退出码 0；
- eval 等价路径跑 init→（模拟 Agent 写工作稿）→check→build：result.json 合法、契约字段齐全、主产物存在；
- 空输入/坏 JSON：仍写合法 partial result.json、退出码 0；
- 与旧版最大差异 + 剩余风险 3 点。
```

## 模板 3：patch 增补任务书（在 best 包上最小增补）

```
题目「{{题目名}}」当前最好分 {{当前分}}（baseline 包即当前最佳版本）。
官方 rubric 把「结果可核验性」「完整性」「生态贡献」作为评分项，而当前包缺少以下可核验资产。

请基于 baseline 做最小增补（patch，不重写、不改变原有调用方式），产出到 /bohr-workspace/submission/：

## 必须新增的资产（在原有产物之外）
1. golden_standard.json：本题核心产物的金标准——逐项列出期望交付内容（{{golden 项}}），
   每项附来源 locator 与逐字 quote。
2. diff_report.md：实际产物与金标准逐项对照（达标/缺失/偏差）。
3. version_history.md：v0 骨架 → v1 成稿的版本记录（改了什么、为什么、如何回退）。
4. run.log：完整运行日志（步骤、耗时、降级、异常）。
5. self_check.json：自检结果（契约字段完整性、证据覆盖率、数字/引用一致性、空/坏输入兜底、退出码）。
6. 在 result.json 增加 golden_standard/diff_report/version_history/self_check 字段；
   原 output_contract 全部字段必须保留并正确回填。

## 硬性约束
- 保留原入口与调用方式（可加可选参数，不得破坏原调用）；
- 纯标准库、离线、不依赖 CWD、退出码恒 0；先写 partial result.json；异常捕获不崩溃；
- 不降低原包已有质量；总文件 ≤10、总 ≤120KB。

## 本题特有要求
{{特定资产的题级要求，如幻灯片的页级金标准/逐页 diff/模板检查/导出检查}}

## 完成前自检（必须真实执行并报告结果）
1) scripts/main.py --help 退出码 0；
2) eval 等价路径造最小输入跑全流程：原有主产物 + 5 个新增资产全部生成，契约字段齐全且含新字段；
3) 空输入/坏 JSON：仍写合法 partial result.json 与最小产物，退出码 0；
4) 报告：最终文件清单+字节数、与 baseline 的差异、剩余风险 3 点。
```

## 模板 4：本地终检任务书

```
你是本地终检 Agent。工作目录就是本题的包目录。任务：逐项核验包的可运行性与契约，只做最小修复，
不做重写。完成后写 VALIDATION.md。

## 核验项
1) 包根 SKILL.md 存在、frontmatter 合法、引用的每个相对路径存在；无 __pycache__/.pyc/临时文件。
2) 每个脚本 `python3 -B <script> --help` 退出码 0；ast.parse 通过。
3) 用 eval 等价路径（/input、/app/output、/app/work）造最小输入：
   case.json（含 output_contract、task_instruction）+ 1 份材料 + 1 个 workorder 形状对象；
   跑 init → 写最小工作稿 → check → build。
4) 空 /input、坏 JSON、缺材料三种情况：均产出合法 partial result.json、退出码 0。
5) 检查 output/result.json：契约键逐键存在、case_id 与输入一致、主产物存在且非空、导出件真实。
6) 记录发现的问题与修复（≤3 文件的小改动）；无法修的问题写进 VALIDATION.md 的剩余风险。
7) 报告：核验命令、关键输出、修复清单、剩余风险 3 点。
```

## 模板 5：超时续跑收尾指令（同会话追加）

```
上一轮构建被超时截断。请只做收尾，不要重写已完成部分：
1) 先补全 submission/SKILL.md（frontmatter + 全部章节，含运行契约、命令、工作稿 schema、降级表、自检）；
2) 检查 scripts/ 下脚本能 --help 且无语法错误；
3) 删除 __pycache__、临时文件、demo/upload 目录；
4) 在 submission/ 内补一份最小自检报告（文件清单+字节数、--help 结果、契约字段缺失数）；
5) 直接结束，不要开始新设计。
```
