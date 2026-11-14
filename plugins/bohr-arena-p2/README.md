# dsh-bohr-arena-p2 — 玻尔产品赛第二期经验（学术写作全流程）

一个 DSH 组合包（bundle），把「玻尔产品赛」第二期（2026-11-06 ~ 2026-11-11）10 道学术写作类 `product-arena` 题的实操经验注册为 4 个技能。安装后由 Agent 按需加载，不额外占用模型上下文。

## 技能

| 技能 | 内容 |
|---|---|
| `bohr-p2-overview` | 10 题全景、评分模型、成绩演进、可行/不可行策略、投递节奏 |
| `bohr-p2-skill-blueprint` | 参赛 Skill 构建规范：目录布局、SKILL.md 章节、result.json 契约与逐字证据、脚本健壮性、打包与自检 |
| `bohr-p2-task-playbooks` | 10 题逐题打法：题目要点、评分点映射、最好版本结构特征、失败模式 |
| `bohr-p2-submission-ops` | 提交与评测机制：CLI 版本、trace 准入、attempt 状态机、评测方差、排名与投递节奏 |

## 安装

见仓库根目录 `README.md` 的「安装」一节。安装后需在 DSH 插件页启用；也可以直接把 `assets/skills/` 下的技能目录复制到 `$DSH_HOME/skills/` 使用。

## 结构

```text
package.json          # dsh.bundle.patch 指向 cordis.patch.yml
cordis.patch.yml      # 插入 id 为 bohr-arena-p2 的 host 插件行
lib/index.js          # 技能 provider：从 assets/skills 读取 SKILL.md
assets/skills/        # 4 个技能（SKILL.md + references）
locale/{zh,en}.json   # 插件页显示名与描述
icon.svg
```

## 范围与个人信息

- 内容只来自第二期赛期的复盘材料；不含更早赛事或其他项目内容。
- 已清除个人信息与平台内部标识（姓名、凭据、密钥、本地路径、内网地址、attempt/challenge/session id 等），也不含资金或用量信息。
- 题目名称与评分维度来自平台公开题面。

## 许可

MIT，见仓库根目录 `LICENSE`。
