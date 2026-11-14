# 提交、回执字段与额度管理

## 1. 提交流程（标准循环）

```text
准备产物目录
  → 真实 Agent 会话跑关键步骤，得到原生会话 trace
  → playground trace validate（必须 valid）
  → playground submit --dry-run（只建包/校验，不真投）
  → 检查 bundle 大小与结构
  → playground submit（真投）
  → 60 秒内核对回执
  → 记入提交台账
```

关键点：

- **先 dry-run**：能提前发现包结构、trace、体积问题，不浪费额度。
- **bundle 体积**：CLI 会复制 outputs→results，实际 bundle 常是 outputs 的 2–3 倍；接近上限时先瘦身（删 results/ 重复副本、去缓存、去示例大文件），记录瘦身前后字节数。
- **一次只改一个变量**：题目取历史最高分时新提交无下行风险，但改动越单一，归因越干净。
- 同一份字节不变的文件在多次提交间复用，可减少"整包重评分"的变量。

## 2. 回执字段（核对清单）

提交后读取并记录：

| 字段 | 用途 |
|---|---|
| attempt id | 唯一标识；台账主键 |
| status / scoringState | 是否入队、评测中、已出分 |
| queuePosition | 队列位置，估算出分时间 |
| countsTowardQuota | 是否计本轮额度（失败重投时要确认） |
| quota {limit, used, window_end} | 剩余额度与窗口 |
| bundle sha / 大小 / entries | 与本地冻结产物对账 |
| score / harbor_reward / trace_factor | 评分归因 |
| zeroReason / 错误码 | 0 分或失败原因 |

## 3. 错误码与语义

| 错误 | 语义 | 动作 |
|---|---|---|
| 429 `quotaExhausted` / `contest_quota_exceeded` | 该题额度用尽 | 停手，冻结剩余候选 |
| 409 `submission_conflict` | attempt 已绑定不同 bundle | 新建 attempt 重投 |
| `evaluation_error` / `pending_review` | 评测失败/待复核（常见为评测侧） | 先等自动重评（约 30 分钟）；确认不重评再新建 attempt |
| 上传超时 / 网络错误 | 上传通道失败 | 不计分；恢复后重投同产物 |
| 409/422 字段超长等参数错误 | 元数据不合法 | 修正 model/harness 等字段长度与格式 |

## 4. 额度预算模板（每题 10 发/24h）

| 用途 | 发数 | 说明 |
|---|---:|---|
| 基线锚点 | 1 | 确认包结构与通道，锁定当前最好分 |
| 单变量探针 | 4–5 | 每次只改一个因素，用平台分归因 |
| 组合验证 | 2 | 只组合已证明有效的因素 |
| 最后 2 小时预留 | 2–3 | 只交已验证最优版本；额度不用会作废，但不要用来做"探测" |

纪律：

- 全程维护 `ledger`（本地台账）：时间、题目、版本、bundle 字节/sha 摘要、回执状态、分数、额度用量。
- 提交前先看台账确认额度；不要凭记忆。
- 平台取每题历史最高分：新提交无下行风险，但失败提交会挤占额度与队列。
- 最后 2 小时不要做"同内容探测"以外的实验；同内容重复提交的唯一意义是抽更好的评测条件。

## 5. 提交流程自检

- [ ] trace validate valid
- [ ] dry-run 通过、bundle 大小在限内
- [ ] 产物目录无缓存/临时文件/示例大文件
- [ ] 元数据（model/harness）长度与格式合规
- [ ] 台账已记录本次版本与额度余量
- [ ] 提交后 60 秒内核对回执，异常按错误码处理
