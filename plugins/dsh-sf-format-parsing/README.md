# dsh-sf-format-parsing — 科学数据格式解析工程（FMT 三题）

一个 DSH 组合包（bundle），把「大科学装置专项赛」中的科学数据格式解析工程（FMT 三题）经验注册为 3 个技能。安装后由 Agent 按需加载。

## 技能

- `sf-fmt-overview`：大科学装置专项赛格式解析三题（谱学/衍射、计算化学与仿真、显微与成像）全景：赛题结构、计分公式、版本阶梯、最终结果与可复用结论。当复盘或复刻科学数据格式解析类题时使用。
- `sf-fmt-adapter-engineering`：格式适配器工程方法：从格式清单到通用生成器（manifest/parser/knowledge/expected），再到 L2/K3/dir-mode 加固与评测口径。当批量实现科学数据格式解析器或做兼容性加固时使用。
- `sf-fmt-local-judge`：FMT 离线验证体系：官方验收器复刻、合成 hidden 代理与校准系数、逐包 diff、打包与 QA 清单。当需要离线判分格式适配器包或估计隐藏集表现时使用。

## 安装

见仓库根目录 `README.md` 的「安装」一节。安装后需在 DSH 插件页启用；也可以直接把 `assets/skills/` 下的技能目录复制到 `$DSH_HOME/skills/` 使用。

## 结构

```text
package.json          # dsh.bundle.patch 指向 cordis.patch.yml
cordis.patch.yml      # 插入 id 为 sf-format-parsing 的 host 插件行
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
