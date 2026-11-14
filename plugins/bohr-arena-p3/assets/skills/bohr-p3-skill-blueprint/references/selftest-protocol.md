# eval 等价冒烟与提交前终检协议

> 目的：把"本地能跑、评测必挂"的 bug 挡在提交之前。第三期多次踩到默认路径差异、契约回填、代码插入位置一类问题，全部由这套协议发现。

## 一、为什么必须"eval 等价"

评测环境的固定事实：输入在 `/input`，工作目录 `/app/work`，产物写 `/app/output`。本地开发时若用"相对路径 + 当前目录"试跑，会掩盖三类问题：路径假设、契约回填、超时/异常分支。因此冒烟必须在**同名路径**下进行：

| 评测路径 | 本地等价做法 |
|---|---|
| `/input` | 建一个 `input` 目录，把最小输入放进去，运行时以参数指过去（若脚本支持 `--input`）；不支持则在隔离目录内软链/复制为 `/input` |
| `/app/work` | 同上，`work` 目录；必须为空目录起跑 |
| `/app/output` | 同上，`output` 目录；跑前清空 |

> 关键：**默认路径**也要测一遍（不带参数运行）。评测 Agent 往往直接照抄 SKILL.md 里的默认命令。

## 二、冒烟协议（按顺序执行，每步留输出）

### 1. 静态检查

```bash
python3 -B -c "import ast,sys; ast.parse(open('scripts/main.py',encoding='utf-8').read())"
python3 -B scripts/main.py --help          # 退出码必须 0
```

同时检查：包根有 `SKILL.md`；frontmatter 有 name/description/version；SKILL.md 里引用的每个相对路径都存在；无 `__pycache__`/`.pyc`。

### 2. 造最小输入（按契约形态二选一）

- 业务型（reading/writing）：`case.json` 里放 `case_id`、`task_instruction`、`output_contract`（dict 形态）+ 1 份 200–400 字的材料（含 1 个可引用的数字句）+ 1 个工作单/字段清单形状的 JSON。
- 产物型（graphics/slides）：`case.json` 的 `output_contract` 用 list 形态（7 个键），另放 1 个 workorder（含 `required_elements`/`deliverable`）与 1 份材料。

### 3. 主路径三步跑

```bash
python3 -B scripts/main.py init                 # 期望：index.json + partial result.json
# 手写一份最小工作稿（draft.json / plan.json）——不要跳过，这一步是评测 Agent 的主工作
python3 -B scripts/main.py check                # 期望：无 FAIL；有 FAIL 就按提示改工作稿
python3 -B scripts/main.py build                # 期望：主产物 + final result.json
```

断言：

- [ ] `output/result.json` 存在且是合法 JSON（`utf-8-sig` 也能读）。
- [ ] `output_contract` 每个键都出现在 result.json（逐键比对，缺失数为 0）。
- [ ] `case_id` 与输入一致。
- [ ] 主产物存在且大小 > 0；导出件是真实文件（PDF 头/PNG IHDR/pptx 可解压）。
- [ ] `status` 与实际一致，`errors`/`degradations`/`pending_human` 能解释缺口。

### 4. 兜底路径（必须测，决定"不会 0 分"）

| 输入形态 | 期望 |
|---|---|
| 不写工作稿直接 `build` | 仍产出完整最小交付；`status=partial`；`degradations` 写明"无工作稿"；退出码 0 |
| 空 `/input`（连 case.json 都没有） | 合法 partial/`input_error` result.json；退出码 0 |
| 坏 JSON（`{` 截断） | 捕获异常写 `errors`；仍产出合法 result.json；退出码 0 |
| 材料只有 1 个且不可解析（如空 PDF / 假图片） | 该材料降级，其余照常；`degradations` 记录；不崩 |

### 5. 稳定性与一致性

- 同一输入连续跑两次：`result.json` 的结构/计数一致，SVG/图表结构一致（不依赖时间、随机数、机器）。
- 若产物含时间戳等易变量，写入 `runtime` 而不是主产物，避免"两次不一致"被判不稳定。

## 三、历史 bug 清单（同类包高频复现）

| # | 现象 | 根因 | 修法 |
|---|---|---|---|
| 1 | 幻灯片包 `build` 崩溃 | 追加代码放在 `if __name__ == "__main__"` guard 之后，运行期 NameError | 新函数插到 guard 之前；改包后重跑 `--help` 与最小 case |
| 2 | result.json 缺 `editable_source`/`content_map` 等字段 | 只回填了几个键，list 型契约没有逐字段映射 | 内置 `CONTRACT_MAP`，finalize 逐键比对，缺失写 `null` 并计数 |
| 3 | `status` 变成聚合对象、`case_id` 丢失 | 字段匹配用了子串（`status` 命中 `stats`） | 精确/词边界匹配 + 显式映射表 |
| 4 | 评测环境无 `soffice` 时没有导出件 → 完整性扣分 | 导出只依赖 LibreOffice，无兜底 | 加纯标准库 PDF 兜底；但**只在缺件时**用，不覆盖正常渲染路径 |
| 5 | 空/坏输入直接抛栈、退出码非 0 | 顶层无 try/except，未先写 partial | 顶层捕获 + 先写 partial + 无条件 finalize + 恒 0 退出 |
| 6 | JSON 读取首字符异常 | 输入是带 BOM 的 UTF-8 | 一律 `utf-8-sig` 读；输出统一 UTF-8 无 BOM |
| 7 | 换目录运行即失败 | 依赖当前工作目录 / 硬编码 Skill 安装路径 | `Path(__file__).resolve().parent` + 可覆盖参数 |
| 8 | 一个附件失败导致整包空 | 解析无隔离 | 分材料 try/except；失败降级该材料 |

## 四、提交前终检流程（按顺序）

1. **清包**：只保留 `SKILL.md` + `scripts/*.py` + `references/*`（+ 少量确定性资产）；排除 `__pycache__`、`.pyc`、`demo/`、`test/`、`upload/`、临时输出、示例大二进制。
2. **查重与查密**：包内不含正式案例答案、不含本地路径、凭据、内部标识；示例标注"示例，非正式案例结果"。
3. **体量检查**：文件数 4–8（上限 15）、总量 60–150KB（上限 300KB/2MB）、主脚本 ≤20–25KB。
4. **冒烟复跑**：第二节 1–5 全过；把关键输出（`--help` 退出码、契约缺失数、主产物大小）记进自检资产。
5. **提交材料**：输出目录 + 真实 Agent 原生会话 trace（`trace validate` 通过）+ 模型/harness 元数据。
6. **提交后**：记录本次提交的包版本与自检结果，保留可回滚快照；不要覆盖"当前最佳包"。

## 五、可以固化到脚本里的断言（伪代码）

```python
def assert_contract(result: dict, contract_keys: list[str]) -> list[str]:
    return [k for k in contract_keys if k not in result]      # 期望为空

def assert_artifact(path: str) -> bool:
    data = Path(path).read_bytes()
    if path.endswith(".pdf"):  return data.startswith(b"%PDF-") and b"/Page" in data
    if path.endswith(".png"):  return data[:8] == b"\x89PNG\r\n\x1a\n"
    if path.endswith(".pptx"): return data[:2] == b"PK"
    return len(data) > 0

def smoke(contract: dict) -> int:
    assert_contract(load("output/result.json"), list(contract))
    for p in ["output/result.json", MAIN_ARTIFACT]:
        assert Path(p).stat().st_size > 0
    return 0
```

> 断言失败不要 raise 到顶层：把结果写进 `self_check.json`/`degradations`，让交付仍然成立（先交付，再自曝缺口）。
