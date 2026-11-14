# 加固配方手册（五层，按 ROI 排序）

每层都按「动机 → 改法 → 验证门槛 → 实测增益」组织。核心纪律：**一次只改一类；改完必须与上一版逐包 diff=0；有规范依据才改。**

## 0. 使用方式

1. 先确认当前瓶颈：看本地逐包报告的 L2 失败码与 K3 状态，判断主风险是「签名太严」还是「签名太松/规则太弱」。
2. 按 L2 → K3 → dir-mode → 读上限 → 规范级 的顺序投入；前两层通常吃掉 70% 以上的可拿增益。
3. 每层做完：public 全量逐包 diff → garbage/truncated/opaque 显式测试 → 冻结副本 → 再动下一层。

经验判据（实测）：parser 签名宽松（无前缀/只查文本）→ K3 hidden 是主风险；parser 签名严格（32 字节长前缀）→ L2 hidden 是主风险。

## 1. 第一层：L2 parser 加固

动机：隐藏样本来自不同 producer/版本，合法文件的字节头会变；写死的长前缀会把合法文件误拒，导致 L2 partial，并连带丢掉 L3 与 Z。

### 1.1 文本格式：前缀失配回退文本校验

原逻辑是「前缀不匹配直接抛」；改成下面这样（前缀不匹配时再给一次文本判定机会）：

```python
def _text_ok(raw):
    head = raw[:8192]
    if not head:
        return False
    printable = sum(1 for b in head if 9 <= b <= 13 or 32 <= b <= 126)
    return printable / len(head) >= 0.85

if PREFIX_HEX and not raw.startswith(bytes.fromhex(PREFIX_HEX)) and not _text_ok(raw):
    raise ValueError("content signature mismatch")
```

- 适用：纯文本格式（表格、XML、JSON 变体、定宽文本）。换 producer banner、换 XML 编码、换行符变化都仍应可读。
- 安全边界：4096 字节随机数据的可打印率约 37%，远低于 85%，garbage 仍被拒。
- 实测：一题 56 个、另一题 21 个文本格式按此法改造，public 侧 0 回退。

### 1.2 二进制格式：32 字节前缀收敛到 4 字节经典 magic

改前 / 改后对比：

```python
PREFIX_HEX = "<64 位十六进制，含 producer 样板>"   # 改前：把 producer/版本字节一起写死
PREFIX_HEX = "<8 位十六进制>"                      # 改后：只留格式级经典 magic 的前 4 字节
```

- 收益来源：长前缀里通常混着 producer 名、版本号、校验和或内容相关字段；隐藏样本换 producer 即整批被拒。
- 安全边界：4 字节碰撞概率约 2⁻³²；用验收器同款「确定性 4096 字节随机数据」验证仍全部抛异常。
- 风险检查：如果这 4 字节恰好是数值/长度/版本字段（不同样本会变），要再往前找一个真正的结构标记，或改用「结构签名」（如固定偏移的 magic、字节序 + 固定标记组合）。
- 实测：一题 60 个、另一题 37 个二进制格式缩到 4 字节，public 逐包 0 回退。

### 1.3 无 magic 的二进制：HEAD_TEXT 兜底

- 对没有可靠前缀的格式，用「文件头可打印率阈值」做粗筛（阈值由样本推导：要求所有公开样本通过、随机数据不通过）。
- 不要用「任何字节都恢复 payload」作为兜底——那会让 garbage 检查直接失败，也越过合规边界。

### 1.4 空 marker 文件

- 现象：部分格式的样本是 0 字节或纯空白（如某些求解器的入口文件）。
- 改法：单独分支——允许空/空白，metadata 的 `magic` 写 `empty-marker`（避免「只有裸数组、无证据」的 L0 失败）；同目录有数据时读兄弟文件兜底；随机字节仍走拒绝路径。
- 例外：公开样本里同时含 0 字节与其他变体的格式，K3 的 sniff/quality 往往在数学上不可达（任何内容规则都认不出空文件），别在上面继续投入。

### 1.5 size_field（长度关系）作为辅助判据

- 拟合：文件长 = 头整数 × multiply + adjust（扫 offset 0–95、宽 2/4/8、双端序）。
- 用途：可作为质检规则与「截断判坏」的依据；**谨慎作为 L2 拒绝条件**——换 producer 后长度字段语义可能不同，容易误杀合法 hidden。
- 经验：公开样本 ≥3 个且关系稳定才值得写；单样本拟合出的关系多为巧合，不可用。

## 2. 第二层：K3 弱嗅探与质检规则

动机：K3 的判型规则若是从某一份公开样本里截出的字面量（日期、路径、样品名、随机数值行），隐藏样本必挂；质检规则写不准则会把完整判坏。

### 2.1 弱嗅探（负数安全）

- 给每包追加若干「弱规则」，`sniff_match: any` 聚合。候选类型：短 magic（2–8 字节）、XML 根元素、正文 token（8–96 可打印字符）、尾部标记。
- **逐条用官方 core 验证**：schema 合法 → 所有公开样本被认出 → 内置负例（PNG/JSON/CSV/随机）一个不误认。三条全过才写回；没有候选通过就保持原包不动。
- 实测：一题 117 个包、共数百条规则，public K3 只升不降；对 hidden 的额外保护约 +1.37 分（代理预测 +4.25，×32%）。

### 2.2 质检规则优先级

1. `min_size`：选一个阈值，让完整样本全过、半截断全判坏（阈值 = ⌈最大半长⌉+1，且 ≤ 最小全长；尺寸差 >2 倍时不可行）。
2. `trailer_hex` / `regex_tail`：所有完整样本共有的尾部标记；注意有的生产者会在尾部多写几个字节，按长度精确相等的规则会误判。
3. `size_field` / `size_expr`：头字段与长度的关系（如「头 3 个整数 × 类型字节数 + 固定头长」）。
4. 都不成立 → **不写**（K3 不得分但不是错误；写错会让隐藏样本 `quality_misjudged`）。

### 2.3 验证

- public 侧 K3 通过数只升不降；`knowledge` schema 全部合法；负例集合不变。
- 不要在 K3 上为了「补齐最后几个格式」冒险：单格式 K3 只值 0.1×难度，写错可能连累整格式。

## 3. 第三层：dir-mode（布局鲁棒）

动机：`input: file` 模式下隐藏组必须恰好 1 个候选文件；多文件组/换扩展名/嵌套目录都会 `input_mismatch`，L2 只按 partial 计（损失约 0.8×难度 与 Z 的 0.3）。

### 3.1 三处改动

1. `manifest.input`: `file → directory`。
2. `manifest.companions`: 设为**主扩展名**，保证 K3 的 anchor 仍是原来的主文件（改造前 companions 为空）。
3. `parser.load`: 收到目录时自己选文件。

```python
def _choose_dir_file(root):
    files = sorted(p for p in Path(root).rglob("*") if p.is_file())
    if not files:
        raise ValueError("empty directory")
    marked = [f for f in files
              if any(f.name.lower().endswith(e.lower()) for e in DIR_EXTENSIONS)
              and not any(f.name.lower().endswith(c.lower()) for c in DIR_COMPANIONS)]
    for f in marked or files:
        try:
            candidate = _read_capped(f)
            _check(candidate)          # 目录模式也必须验签，garbage 才能被拒
            return candidate
        except Exception:
            continue
    return _read_capped((marked or files)[0])   # 都不通过时仍会走 load 内的校验
```

### 3.2 验证与边界

- public：与改造前逐包 diff=0（公开组里「extensions − companions」恰好唯一确定原主文件）。
- garbage：目录内所有文件替换为随机字节 → 无候选通过 → 仍抛异常（实测 191/191 全拒）。
- 单文件 hidden：行为与 file-mode 完全相同（实测回归一致）。
- 已知边界：隐藏组主文件为 0 字节时目录模式会跳到兄弟文件兜底；概率极低，可不修。
- 收益取决于布局：实测三题分别 +1.89 / +1.11 / +0（零增益也零回退）。

## 4. 第四层：64 MiB 读上限

```python
MAX_READ_BYTES = 64 * 1024 * 1024

with open(path, "rb") as stream:
    raw = stream.read(MAX_READ_BYTES)
```

- 动机：超大隐藏文件整读会撞时间/内存限制（每样本 300 秒、4 GiB），造成 L2 partial。
- 验证：公开样本最大远小于上限 → public 逐包 diff=0；产物 `n_points`/`payload_kind` 与截断读保持一致。
- 实测：内存从随文件线性增长（数百 MB 文件 → 近 1 GB RSS）降到恒定约 115 MB；平台分零增益（hidden 无超大文件），属零成本保险。

## 5. 第五层：规范级 parser 修复（收尾期）

### 5.1 方法

1. 只挑「当前实现把规范里的可变字段写死」的格式。
2. 每个修复都必须能引用格式规范/官方文档；**保留原来的严格前缀作为 fallback**。
3. 每批记录格式数与 diff 数；用「规范允许的变体」造 hidden 验证：改前 partial → 改后 pass 才算成立。
4. 每批都跑 public 全量 diff=0 + garbage 显式测试。

通用形态是「新形态 OR 原前缀」，fallback 永不删除：

```python
ok = _accepts_standard_variant(raw) or raw.startswith(bytes.fromhex(OLD_PREFIX_HEX))
```

### 5.2 可用案例清单（均有规范依据、实测 0 回退）

| 格式类别 | 规范事实 | 改法 | 实测 |
|---|---|---|---|
| DICOM | 前导（preamble）内容任意，魔数是 offset 128 的 `DICM` | 接受 `raw[128:132] == b"DICM"` 或全零前导，或 group-0002 raw dataset 头；原前缀 fallback | 单批 +0.50（含另 3 个格式） |
| TIFF 容器 | 允许小端 `II*\0` 与大端 `MM\0*` 两种字节序 | 接受两种字节序 | 7 个格式一批 |
| BigTIFF | 同上，magic 43：`II+\0` / `MM\0+` | 接受两种字节序 | 一批 +0.44 |
| Igor IBW | 前 2 字节 = version（5），3–4 字节 = checksum（内容相关） | 只校验 `raw[:2] == b"\x05\x00"` | 同上批 |
| TIA SER | 0–2 字节 = 字节序 `II`，2–4 字节 = 版本 | 只校验 `raw[:2] == b"II"` 或原前缀 | 同上批 |
| TIA EMI | magic `JK` + version word | 只校验 `raw[:2] == b"JK"` 或原前缀 | 同上批 |
| netCDF classic | `CDF` + version ∈ {1, 2, 5}；netCDF-4 是 HDF5 | 接受 `CDF`+版本 或 HDF5 magic；原前缀 fallback | COMP 一批 +0.57（4 格式） |
| CGNS | ADF 2.0：offset 4 的 magic `ADF `/`CGNS`；CGNS 3.x 为 HDF5 | 接受 offset 4 两种 magic 或 HDF5 | 同上 |
| GDSII / OASIS | GDSII 以 HEADER 记录开头；OASIS 的 SEMI P39 magic 是 `%SEMI-OASIS` | 两套魔数都接受 | 同上 |
| HDF5 容器 | 规范允许 user block，签名可位于 offset 0/512/1024/2048… | 在若干偏移尝试签名，原 offset 0 fallback | 零增益（hidden 未命中），零风险 |
| JPEG | 首个 marker 可为 APP0–APPn（EXIF 等） | 只校验 `FF D8 FF` 三字节 | 一批 +0.44 |
| gzip | 第 4 字节是 FLG 标志位，不固定 | 只校验前 3 字节 `1F 8B 08` | 同上批 |
| MRC/CCP4 | `MAP ` 魔数在 offset 208，头 1024 字节，像素 1/2/4 字节每像素 | 校验 offset 208 的 `MAP `；质检用 `1024 + nx*ny*nz*bytes` | K3 修复 |
| RIFF 容器（WebP） | `RIFF` + offset 4 的 uint32 = 文件长 − 8 | 两段 magic + `size_field(offset=4, adjust=8)` | K3 修复 |
| CDB/CBF 等 | 体积小、样本少、无公开规范结论 | **不改**（无依据） | 0 |

注意：上表只写「规范允许什么」；具体偏移与阈值要回到该格式的公开规范核对，不要照抄猜测。

## 6. 验证门槛与真实增益校准

每批改动的固定门槛（缺一不可）：

1. public 全量官方判分逐包 diff=0（highest/levels/L2 checks/K/Z/F 全字段）。
2. judge 同款确定性 garbage（4096 字节）仍全部被拒；truncated/opaque 行为不变。
3. 合成 hidden 前后对比：变体 partial → pass，且没有格式变差。
4. 独立复核（另一 Agent 从冻结包复算成员差异与分数）。

真实增益校准（实测）：

| 层 | 代理增益 | 真实增益 | 折扣 |
|---|---:|---:|---:|
| L2 加固 | +32～+35 | +13.7～+14.9 | ×39%～46% |
| K3 弱嗅探 | +4.25 | +1.37 | ×32% |
| dir-mode | 压力代理 +41～+42 | +0～+1.89 | 0%～4.5%（按受影响格式权重） |
| 读上限 | 内存大幅下降 | 0 | — |
| 规范级修复 | 变体 hidden 4/4–11/11 转 pass | 每批 0～+0.57 | 2.2%～9.5%/diff |

## 7. 常见失败与回滚

- **放宽过头**：garbage 被接受 → 回退该批放宽，或加回结构校验（先查是否只改了文本兜底）。
- **误杀合法 hidden**：出现 `organizer_sample_suspect` 聚集 → 说明签名仍偏严，继续收敛到格式级结构签名，而不是加更多字面量。
- **K3 规则误判**：隐藏样本 `quality_misjudged` → 删除该条规则（K3 不得分好过判错）。
- **布局改动无收益**：某题 dir-mode 零增益 → 保留（零回退）或回退到 file-mode，但不要为它继续扩大改动面。
- **回滚锚点**：每版冻结完整包 + 成员清单；回滚时按冻结包重新提交，不要从被改动过的工作目录重打。
