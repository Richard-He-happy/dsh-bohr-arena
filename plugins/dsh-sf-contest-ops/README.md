# dsh-sf-contest-ops — 平台参赛作战（大科学装置专项赛）

一个 DSH 组合包（bundle），把「大科学装置专项赛」中的平台参赛作战经验注册为 4 个技能。安装后由 Agent 按需加载。

## 技能

- `sf-platform-mechanics`：限时科学竞赛平台机制：score=100×harbor_reward×trace 门控、提交额度、评分队列、评测租约容量、worker 故障语义与合规红线。当在玻尔 Playground 类平台参赛、需要理解评分与提交通道时使用。
- `sf-contest-execution`：24 小时短赛执行手册：赛前准备、动态规划与提交顺序、额度纪律、评分轮询、最后 2 小时收尾与多 agent 分工。当参加限时科学计算/工程类竞赛时使用。
- `sf-failure-diagnosis`：平台故障诊断与申诉证据链：同包不同分、全平台 0 分、上传/队列故障、evaluation_error 语义、保留产物与恢复后重提策略。当比赛遇到评分异常或提交失败时使用。
- `sf-round-lessons`：本轮关键教训汇总：配额未规划导致有候选无额度、最后一发决策、故障窗口、val 与 hidden 背离、工程型题 ROI 与合规边界。当复盘失误或制定下期改进时使用。

## 安装

见仓库根目录 `README.md` 的「安装」一节。安装后需在 DSH 插件页启用；也可以直接把 `assets/skills/` 下的技能目录复制到 `$DSH_HOME/skills/` 使用。

## 结构

```text
package.json          # dsh.bundle.patch 指向 cordis.patch.yml
cordis.patch.yml      # 插入 id 为 sf-contest-ops 的 host 插件行
lib/index.js          # 技能 provider：从 assets/skills 读取 SKILL.md
assets/skills/        # 4 个技能（SKILL.md + references）
locale/{zh,en}.json   # 插件页显示名与描述
icon.svg
```

## 范围与个人信息

- 内容只来自「大科学装置专项赛第一期」的赛前准备与实战复盘；不含其他赛事内容。
- 已做个人信息清除：不含真实姓名、账号、密钥、本地路径、内网地址、平台内部 ID（attempt/challenge/session 等）。
- 题目名称与评分维度来自平台公开题面。

## 许可

MIT，见仓库根目录 `LICENSE`。
