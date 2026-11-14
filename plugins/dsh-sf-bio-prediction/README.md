# dsh-sf-bio-prediction — 生物医学预测（CRISPRi 与药物识别）

一个 DSH 组合包（bundle），把「大科学装置专项赛」中的生物医学预测（CRISPRi 与药物识别）经验注册为 3 个技能。安装后由 Agent 按需加载。

## 技能

- `sf-bio-overview`：大科学装置专项赛生物医学预测两题（CRISPRi 跨细胞扰动预测与跨剂量药物识别）全景：评分口径、数据与合规边界、最终结果与收手判据。当复盘或复刻生物信息预测类题时使用。
- `sf-crispri-prediction`：CRISPRi 跨细胞扰动效应预测方法：相似扰动核迁移、逐行正缩放、target 自敲低与基础表达收缩、CV 噪声地板与线上校准。当做基因扰动响应/表达预测时使用。
- `sf-drug-id`：跨剂量药物识别方法：ICC 特征加权与收缩协方差 LDA 白化 + 匈牙利匹配、深度度量（SupCon）融合、CV 与反泄漏检查。当做基于细胞表型的药物身份匹配时使用。

## 安装

见仓库根目录 `README.md` 的「安装」一节。安装后需在 DSH 插件页启用；也可以直接把 `assets/skills/` 下的技能目录复制到 `$DSH_HOME/skills/` 使用。

## 结构

```text
package.json          # dsh.bundle.patch 指向 cordis.patch.yml
cordis.patch.yml      # 插入 id 为 sf-bio-prediction 的 host 插件行
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
