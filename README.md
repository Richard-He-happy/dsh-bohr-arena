# 玻尔比赛经验插件（DSH Plugins）

把参加过的两场玻尔比赛（「玻尔产品周赛」与「大科学装置专项赛」）的实操经验，整理为可直接安装的 [DSH（DeepSeek Harness）](https://github.com/deepseek-ai/deepseek-harness) 插件。安装后，Agent 会在技能目录中看到这些经验技能，按需加载「构建规范 / 逐题打法 / 平台机制 / 评分与提分策略 / 故障诊断」。

## 一、内容范围

| 赛事 | 插件 | 主题 | 技能数 |
|---|---|---|---|
| 玻尔产品周赛·第二期（2026-11-06 ~ 11-11） | `dsh-bohr-arena-p2` | 学术写作全流程：10 道 `product-arena` 题 | 4 |
| 玻尔产品周赛·第三期（2026-11-11 起，复盘截至 11-14） | `dsh-bohr-arena-p3` | 学术效率：33 道题 / reading、writing、graphics、slides 四大赛道 | 5 |
| 大科学装置专项赛·第一期（24 小时赛） | `dsh-sf-format-parsing` | 科学数据格式解析（FMT 三题：谱学/衍射、计算化学、显微成像） | 3 |
| 大科学装置专项赛·第一期 | `dsh-sf-instrument-vision` | 仪器视觉与模拟器（FIB-SEM 视觉识别 + FIBSEM 模拟器操作） | 3 |
| 大科学装置专项赛·第一期 | `dsh-sf-bio-prediction` | 生物医学预测（CRISPRi 扰动预测 + 跨剂量药物识别） | 3 |
| 大科学装置专项赛·第一期 | `dsh-sf-contest-ops` | 平台参赛作战（评分机制 / 额度 / 租约 / 24h 执行 / 故障诊断 / 本轮教训） | 4 |

说明：

- 本仓库**只包含上述比赛**的经验，不包含其他项目、非参赛内容或未实际参赛的轮次。
- 两项赛事的评测机制不同：产品周赛是「Skill 装进 Harness + 3 个隐藏案例 + rubric 评审」；大科学装置专项赛是「提交产物 + 原生 trace，平台按题面 metric 自动评分」。经验均来自各自机制下的实测复盘。
- 题目名称、赛道划分、评分维度来自平台公开题面；仓库已做个人信息清除：不包含真实姓名、团队名、账号、凭据、密钥、本地路径、内网地址、第三方参赛者身份、平台内部 ID（attempt/challenge/session 等），也不包含资金或用量信息。比赛过程产生的临时文件未被包含。

## 二、插件与技能清单

### 玻尔产品周赛

#### `dsh-bohr-arena-p2` — 第二期（学术写作全流程）

| 技能 | 用途 |
|---|---|
| `bohr-p2-overview` | 10 题全景：评分模型、成绩演进、可行与不可行策略、投递节奏 |
| `bohr-p2-skill-blueprint` | 参赛 Skill 构建规范：目录布局、SKILL.md 章节、result.json 契约与逐字证据、脚本健壮性、打包与自检 |
| `bohr-p2-task-playbooks` | 10 题逐题打法：题目要点、评分点映射、最好版本结构、失败模式 |
| `bohr-p2-submission-ops` | 提交与评测机制：CLI 版本、trace 准入、attempt 状态机、评测方差、排名与节奏 |

#### `dsh-bohr-arena-p3` — 第三期（学术效率）

| 技能 | 用途 |
|---|---|
| `bohr-p3-overview` | 33 题 / 4 赛道全景、赛道总分规则、核心实证结论与决策树 |
| `bohr-p3-skill-blueprint` | 极简 agent-first Skill 设计法与四赛道交付契约、eval 等价冒烟、兜底与包体约束 |
| `bohr-p3-task-playbooks` | 33 题逐题打法（按四大赛道分四个参考文件） |
| `bohr-p3-cloud-pipeline` | 云端建包与本地流水线：任务书、打包白名单、终检、提交、自动化守护、故障恢复 |
| `bohr-p3-scoring-strategy` | 0 分语义、评测方差、重 roll、patch 增补、融合重写结论、标准漂移与赛程决策 |

### 大科学装置专项赛

#### `dsh-sf-format-parsing` — 科学数据格式解析工程（FMT 三题）

| 技能 | 用途 |
|---|---|
| `sf-fmt-overview` | 三题结构、单格式计分公式、版本阶梯与可复用结论 |
| `sf-fmt-adapter-engineering` | 通用适配器生成器、L2/K3/dir-mode 加固、解析器工程原则 |
| `sf-fmt-local-judge` | 官方验收器复刻、合成 hidden 代理与校准、逐包 diff 与打包 QA |

#### `dsh-sf-instrument-vision` — 仪器视觉与模拟器（FIB-SEM 两题）

| 技能 | 用途 |
|---|---|
| `sf-instrument-overview` | 两题子任务结构、评分公式、分项构成与关键结论 |
| `sf-fibsem-vision` | 四子任务打法（分割/提示分割/针尖定位/AI 数据）与配额策略 |
| `sf-fibsem-simulator` | 十入口、lease 容量机制、几何标定与自动求解、最后一发决策 |

#### `dsh-sf-bio-prediction` — 生物医学预测（Q03/D03）

| 技能 | 用途 |
|---|---|
| `sf-bio-overview` | 两题评分口径、数据与合规边界、收手判据 |
| `sf-crispri-prediction` | 扰动核迁移、逐行正缩放、CV 噪声地板与异常高分审计 |
| `sf-drug-id` | ICC 加权 + 收缩协方差 LDA + 匈牙利匹配、深度度量融合、契约审计 |

#### `dsh-sf-contest-ops` — 平台参赛作战

| 技能 | 用途 |
|---|---|
| `sf-platform-mechanics` | 评分恒等式与 trace 门控、提交额度、评分队列、租约容量、合规红线 |
| `sf-contest-execution` | 24 小时赛执行手册：赛前准备、提交顺序、额度纪律、最后 2 小时、团队分工 |
| `sf-failure-diagnosis` | 故障诊断决策树、证据链与恢复后重提策略 |
| `sf-round-lessons` | 本轮关键教训：配额规划失误、最后一发决策、故障窗口、val/hidden 背离、工程题 ROI |

## 三、安装

各插件都是标准 DSH 组合包（bundle），带 `dsh.bundle.patch`，安装后需在插件页启用。

### 方式 A：通过插件市场索引安装（推荐）

1. 打开 DSH 侧栏的**插件**页，切到**发现**标签。
2. 点击**添加索引源**，填入本仓库的索引地址：

   ```text
   https://raw.githubusercontent.com/Richard-He-happy/dsh-bohr-arena/main/index.json
   ```

3. 在列表中打开对应条目，点**安装**，完成后**启用**。

### 方式 B：直接安装 Git 包

打开**插件 → 添加插件 → 安装第三方插件**，在包名输入框中填入对应插件的 Git 地址（`path:` 指向仓库中的插件目录；`#main` 跟随主分支，可换成 `index.json` 里记录的完整提交号来锁定版本）：

```text
git+https://github.com/Richard-He-happy/dsh-bohr-arena.git#main&path:/plugins/dsh-bohr-arena-p2
git+https://github.com/Richard-He-happy/dsh-bohr-arena.git#main&path:/plugins/dsh-bohr-arena-p3
git+https://github.com/Richard-He-happy/dsh-bohr-arena.git#main&path:/plugins/dsh-sf-format-parsing
git+https://github.com/Richard-He-happy/dsh-bohr-arena.git#main&path:/plugins/dsh-sf-instrument-vision
git+https://github.com/Richard-He-happy/dsh-bohr-arena.git#main&path:/plugins/dsh-sf-bio-prediction
git+https://github.com/Richard-He-happy/dsh-bohr-arena.git#main&path:/plugins/dsh-sf-contest-ops
```

安装完成后在插件页**启用**。

### 方式 C：命令行安装（进阶）

```bash
dsh plugin --profile <profile> add "git+https://github.com/Richard-He-happy/dsh-bohr-arena.git#main&path:/plugins/dsh-sf-format-parsing"
```

然后在 DSH 插件页启用；或在 profile 的 `package.json` 的 `dsh.profile.bundles` 中加入包名。

### 方式 D：不装插件，只使用技能

每个插件的技能就是标准的 DSH 目录技能。把 `plugins/<插件>/assets/skills/` 下需要的技能目录复制到用户技能目录（默认 `~/.dsh/skills/`，即 `$DSH_HOME/skills/`）即可。

## 四、目录结构

```text
plugins/
  dsh-bohr-arena-p2/       # 玻尔产品周赛第二期（4 技能）
  dsh-bohr-arena-p3/       # 玻尔产品周赛第三期（5 技能）
  dsh-sf-format-parsing/   # 大科学装置专项赛 · 格式解析（3 技能）
  dsh-sf-instrument-vision/ # 大科学装置专项赛 · 仪器视觉与模拟（3 技能）
  dsh-sf-bio-prediction/   # 大科学装置专项赛 · 生物医学预测（3 技能）
  dsh-sf-contest-ops/      # 大科学装置专项赛 · 平台作战（3 技能）
index.json                 # 插件市场索引（format 1），按提交号固定
scripts/
  validate.mjs             # 结构与 provider 自检
  build-index.mjs          # 重新生成 index.json
```

每个插件目录包含：`package.json`（`dsh.bundle.patch`）、`cordis.patch.yml`、`lib/index.js`（技能 provider）、`assets/skills/`（SKILL.md + references）、`locale/{zh,en}.json`、`icon.svg`、`README.md`。

## 五、内容组织原则

- **按赛事与场景拆分**：一个比赛经验包可按「场景簇」拆成多个插件（如格式解析 / 仪器视觉 / 生物预测 / 平台作战），每个插件内含多个技能。
- **只沉淀可复用经验**：结论、数字、失败模式都能在对应比赛的复盘材料中找到出处；推断类结论会标注「推断」。
- **严格脱敏**：个人信息、第三方身份、平台内部 ID、本地路径与凭据全部清除；平台机制只保留可公开描述的规则。
- **技能可单独复用**：不依赖插件运行时也能复制到 DSH 技能目录使用（方式 D）。

## 六、维护

- 修改内容后运行 `node scripts/validate.mjs` 自检，再按需运行 `node scripts/build-index.mjs --repo <本仓库地址> --commit <提交号>` 更新 `index.json`。
- 版本升级时修改插件 `package.json` 的 `version` 与 `index.json` 中对应 `versions`。

## 七、许可与声明

- 代码与文档以 MIT 许可发布（见 `LICENSE`）。
- 本仓库是对特定赛期的经验复盘，不构成平台官方说明；平台机制与评分标准可能随版本变化，请以实际平台为准。
