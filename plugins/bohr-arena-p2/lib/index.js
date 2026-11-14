/**
 * Bohr Product Arena — Period 2 (academic writing) skill provider.
 *
 * Bundles four localized skills that preserve the period-2 contest playbook:
 * overview, skill authoring blueprint, per-task playbooks, submission mechanics.
 * The provider reads each SKILL.md from ./assets/skills/<dir>/ so relative
 * reference paths keep working through the skill resource base.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const PROVIDER_NAME = 'bohr-arena-p2'
const RANK = 600
const SKILLS_ROOT = new URL('../assets/skills/', import.meta.url)

/**
 * Registration order is also stable fallback order; names stay kebab-case so
 * the skill registry accepts them.
 */
const ENTRIES = [
  {
    dir: 'bohr-p2-overview',
    name: 'bohr-p2-overview',
    description:
      '第二期（学术写作全流程）10 题参赛全景：评分模型、成绩演进、可行与不可行策略、投递节奏。当需要复盘或复刻玻尔产品赛第二期打法、规划同类学术写作 Skill 竞赛时使用。',
  },
  {
    dir: 'bohr-p2-skill-blueprint',
    name: 'bohr-p2-skill-blueprint',
    description:
      '参赛 Skill 构建规范：目录布局、SKILL.md 章节、result.json 契约与逐字证据、脚本健壮性、打包与提交前自检。当编写面向隐藏案例评测的 Agent Skill/插件包时使用。',
  },
  {
    dir: 'bohr-p2-task-playbooks',
    name: 'bohr-p2-task-playbooks',
    description:
      '第二期 10 题逐题打法：题目要点、评分点映射、最好版本结构特征与常见失败模式（文献翻译/润色/引用管理/引言/方法/LaTeX/解析/笔记/图谱等）。当针对具体学术写作题型设计 Skill 时使用。',
  },
  {
    dir: 'bohr-p2-submission-ops',
    name: 'bohr-p2-submission-ops',
    description:
      '玻尔 Playground 提交与评测机制：CLI 版本维护、trace 准入、attempt 状态机、评测方差、并列感知排名与投递节奏。当在玻尔产品赛提交、排障或制定提分节奏时使用。',
  },
]

/** Strip a leading YAML frontmatter block; the body alone is rendered to the model. */
function stripFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n')) return normalized
  const end = normalized.indexOf('\n---\n', 4)
  if (end === -1) return normalized
  return normalized.slice(end + 5).replace(/^\n+/, '')
}

function candidateOf(entry) {
  return {
    name: entry.name,
    description: entry.description,
    invocation: { modelInvocable: true, userInvocable: true },
    provider: PROVIDER_NAME,
    source: 'bundled',
    resourceBase: {
      kind: 'directory',
      path: fileURLToPath(new URL(`${entry.dir}/`, SKILLS_ROOT)),
    },
    rank: RANK,
    locator: new URL(`${entry.dir}/SKILL.md`, SKILLS_ROOT),
  }
}

const provider = {
  name: PROVIDER_NAME,
  list() {
    return Promise.resolve(ENTRIES.map(candidateOf))
  },
  async get(candidate) {
    const entry = ENTRIES.find((item) => item.name === candidate.name)
    if (entry === undefined) return undefined
    const content = await readFile(new URL(`${entry.dir}/SKILL.md`, SKILLS_ROOT), 'utf8')
    return {
      name: entry.name,
      description: entry.description,
      invocation: { modelInvocable: true, userInvocable: true },
      provider: PROVIDER_NAME,
      source: 'bundled',
      resourceBase: {
        kind: 'directory',
        path: fileURLToPath(new URL(`${entry.dir}/`, SKILLS_ROOT)),
      },
      content: stripFrontmatter(content),
    }
  },
}

/** Cordis plugin name; keeps the loader entry id and provider id distinct. */
const name = 'bohr-arena-p2'
const inject = ['skills']

function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}

export { apply, inject, name }
