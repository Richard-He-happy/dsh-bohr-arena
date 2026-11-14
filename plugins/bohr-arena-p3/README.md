# dsh-bohr-arena-p3 — 玻尔产品赛第三期经验（学术效率）

一个 DSH 组合包（bundle），把「玻尔产品赛」第三期（2026-11-11 起，复盘截至 2026-11-14）33 道「学术效率」题（reading 10 / writing 14 / graphics 5 / slides 4）的实操经验注册为 5 个技能。安装后由 Agent 按需加载，不额外占用模型上下文。

## 技能

| 技能 | 内容 |
|---|---|
| `bohr-p3-overview` | 33 题/4 赛道全景、赛道总分规则、核心实证结论与决策树 |
| `bohr-p3-skill-blueprint` | 极简 agent-first Skill 设计法与四赛道交付契约、eval 等价冒烟、兜底、包体约束 |
| `bohr-p3-task-playbooks` | 33 题逐题打法（reading / writing / graphics / slides 四个参考文件） |
| `bohr-p3-cloud-pipeline` | 云端建包与本地流水线：任务书、打包白名单、终检、提交、自动化守护、故障恢复 |
| `bohr-p3-scoring-strategy` | 0 分语义、评测方差、重 roll、patch 增补、融合重写结论、标准漂移与赛程决策 |

## 安装

见仓库根目录 `README.md` 的「安装」一节。安装后需在 DSH 插件页启用；也可以直接把 `assets/skills/` 下的技能目录复制到 `$DSH_HOME/skills/` 使用。

## 结构

```text
package.json          # dsh.bundle.patch 指向 cordis.patch.yml
cordis.patch.yml      # 插入 id 为 bohr-arena-p3 的 host 插件行
lib/index.js          # 技能 provider：从 assets/skills 读取 SKILL.md
assets/skills/        # 5 个技能（SKILL.md + references）
locale/{zh,en}.json   # 插件页显示名与描述
icon.svg
```

## 范围与个人信息

- 内容只来自第三期赛期的复盘材料；不含更早赛事或其他项目内容。
- 已清除个人信息与平台内部标识（姓名、凭据、密钥、本地路径、内网地址、attempt/challenge/session id 等），也不含资金或用量信息。
- 题目名称、赛道划分与评分维度来自平台公开题面。

## 许可

MIT，见仓库根目录 `LICENSE`。
