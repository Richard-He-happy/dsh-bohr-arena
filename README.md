# 玻尔产品赛经验插件（DSH Plugins）

把两期「玻尔产品赛」的实操经验整理为两个可直接安装的 [DSH（DeepSeek Harness）](https://github.com/deepseek-ai/deepseek-harness) 插件。安装后，Agent 会在技能目录中看到这些经验技能，按需加载「Skill 构建规范 / 逐题打法 / 提交机制 / 评分与提分策略」。

## 一、内容范围

| 插件 | 来源赛期 | 主题 | 技能数 |
|---|---|---|---|
| `dsh-bohr-arena-p2` | 第二期（2026-11-06 ~ 2026-11-11） | 学术写作全流程：10 道 `product-arena` 题 | 4 |
| `dsh-bohr-arena-p3` | 第三期（2026-11-11 起，复盘截至 2026-11-14） | 学术效率：33 道题 / reading、writing、graphics、slides 四大赛道 | 5 |

说明：

- 本仓库**只包含这两期**的经验，不包含更早的赛事或其他项目内容。
- 平台对参赛 Skill 的评测方式：把 Skill 安装到运行环境，在 3 个固定隐藏案例上真实运行，再由评审按题面 rubric 打分。仓库中的经验均来自这一机制下的实测复盘。
- 题目名称、赛道划分、评分维度来自平台公开题面；仓库已做个人信息清除：不包含真实姓名、凭据、密钥、本地路径、内网地址、平台内部 ID（attempt/challenge/session 等），也不包含任何资金或用量信息。代码与比赛过程产生的临时文件也未被包含。

## 二、插件与技能清单

### `dsh-bohr-arena-p2` — 第二期（学术写作全流程）

| 技能 | 用途 |
|---|---|
| `bohr-p2-overview` | 10 题全景：评分模型、成绩演进、可行与不可行策略、投递节奏 |
| `bohr-p2-skill-blueprint` | 参赛 Skill 构建规范：目录布局、SKILL.md 章节、result.json 契约与逐字证据、脚本健壮性、打包与自检 |
| `bohr-p2-task-playbooks` | 10 题逐题打法：题目要点、评分点映射、最好版本结构、失败模式 |
| `bohr-p2-submission-ops` | 提交与评测机制：CLI 版本、trace 准入、attempt 状态机、评测方差、排名与节奏 |

### `dsh-bohr-arena-p3` — 第三期（学术效率）

| 技能 | 用途 |
|---|---|
| `bohr-p3-overview` | 33 题 / 4 赛道全景、赛道总分规则、核心实证结论与决策树 |
| `bohr-p3-skill-blueprint` | 极简 agent-first Skill 设计法与四赛道交付契约、eval 等价冒烟、兜底与包体约束 |
| `bohr-p3-task-playbooks` | 33 题逐题打法（按四大赛道分四个参考文件） |
| `bohr-p3-cloud-pipeline` | 云端建包与本地流水线：任务书、打包白名单、终检、提交、自动化守护、故障恢复 |
| `bohr-p3-scoring-strategy` | 0 分语义、评测方差、重 roll、patch 增补、融合重写结论、标准漂移与赛程决策 |

## 三、安装

两个插件都是标准 DSH 组合包（bundle），带 `dsh.bundle.patch`，安装后需在插件页启用。

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
git+https://github.com/Richard-He-happy/dsh-bohr-arena.git#main&path:/plugins/bohr-arena-p2
git+https://github.com/Richard-He-happy/dsh-bohr-arena.git#main&path:/plugins/bohr-arena-p3
```

安装完成后在插件页**启用**。

### 方式 C：命令行安装（进阶）

```bash
dsh plugin --profile <profile> add "git+https://github.com/Richard-He-happy/dsh-bohr-arena.git#main&path:/plugins/bohr-arena-p2"
dsh plugin --profile <profile> add "git+https://github.com/Richard-He-happy/dsh-bohr-arena.git#main&path:/plugins/bohr-arena-p3"
```

然后在 DSH 插件页启用两个组合包；或在 profile 的 `package.json` 的 `dsh.profile.bundles` 中加入包名。

### 方式 D：不装插件，只使用技能

每个插件的技能就是标准的 DSH 目录技能。把 `plugins/<插件>/assets/skills/` 下需要的技能目录复制到用户技能目录即可（默认 `~/.dsh/skills/`，即 `$DSH_HOME/skills/`）：

```text
~/.dsh/skills/
  bohr-p3-task-playbooks/
    SKILL.md
    references/...
```

重启会话后即可在技能目录中看到。

## 四、目录结构

```text
plugins/
  bohr-arena-p2/
    package.json            # DSH 组合包元信息（dsh.bundle.patch）
    cordis.patch.yml        # 插入 host 插件行
    lib/index.js            # 技能 provider（从 assets 读取技能）
    assets/skills/          # 4 个技能（SKILL.md + references）
    locale/{zh,en}.json     # 插件页显示名与描述
    icon.svg
  bohr-arena-p3/
    ...                     # 结构同上，5 个技能
index.json                  # 插件市场索引（format 1），按提交号固定
scripts/
  validate.mjs              # 结构与 provider 自检
  build-index.mjs           # 重新生成 index.json
```

## 五、内容组织原则

- **一个插件对应一期比赛**，插件内按「全景 → 构建规范 → 逐题打法 → 平台/流水线/策略」分层；技能名带期数前缀，避免两个插件同时安装时重名。
- **经验只来自这两期材料**：结论、数字、失败模式都能在对应赛期的复盘记录中找到出处；推断类结论会标注「推断」。
- **技能可单独复用**：不依赖插件运行时也能复制到 DSH 技能目录使用（方式 D）。

## 六、维护

- 修改技能内容后运行 `node scripts/validate.mjs` 自检，再按需运行 `node scripts/build-index.mjs --repo <本仓库地址> --commit <提交号>` 更新 `index.json`。
- 版本升级时修改插件 `package.json` 的 `version` 与 `index.json` 中对应 `versions`。

## 七、许可与声明

- 代码与文档以 MIT 许可发布（见 `LICENSE`）。
- 本仓库是对特定赛期的经验复盘，不构成平台官方说明；平台机制与评分标准可能随版本变化，请以实际平台为准。
