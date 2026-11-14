# dsh-sf-instrument-vision — 仪器视觉与模拟器（FIB-SEM 两题）

一个 DSH 组合包（bundle），把「大科学装置专项赛」中的仪器视觉与模拟器（FIB-SEM 两题）经验注册为 3 个技能。安装后由 Agent 按需加载。

## 技能

- `sf-instrument-overview`：大科学装置专项赛仪器类两题（FIB-SEM 视觉识别与 FIBSEM 模拟器操作）全景：子任务结构、评分公式、最终结果与关键结论。当复盘或复刻仪器图像与模拟器操作类题时使用。
- `sf-fibsem-vision`：FIB-SEM 视觉识别四子任务打法：八类分割、零训练提示分割、针尖定位、AI 成对数据生成，以及组合评分下的配额与单变量探针策略。当处理仪器图像分割/定位或组合型视觉任务时使用。
- `sf-fibsem-simulator`：FIBSEM 模拟器操作打法：十子题入口、lease 容量机制、几何标定与自动求解、运动指令与评测判据、提交窗口与最后一发决策。当在模拟器中完成仪器操作类任务时使用。

## 安装

见仓库根目录 `README.md` 的「安装」一节。安装后需在 DSH 插件页启用；也可以直接把 `assets/skills/` 下的技能目录复制到 `$DSH_HOME/skills/` 使用。

## 结构

```text
package.json          # dsh.bundle.patch 指向 cordis.patch.yml
cordis.patch.yml      # 插入 id 为 sf-instrument-vision 的 host 插件行
lib/index.js          # 技能 provider：从 assets/skills 读取 SKILL.md
assets/skills/        # 3 个技能（SKILL.md + references）
locale/{zh,en}.json   # 插件页显示名与描述
icon.svg
```

## 范围与个人信息

- 内容只来自「大科学装置专项赛第一期」的赛前准备与实战复盘；不含其他赛事内容。
- 已做个人信息清除：不含真实姓名、账号、密钥、本地路径、内网地址、平台内部 ID（attempt/challenge/session 等）。
- 题目名称与评分维度来自平台公开题面。

## 许可

MIT，见仓库根目录 `LICENSE`。
