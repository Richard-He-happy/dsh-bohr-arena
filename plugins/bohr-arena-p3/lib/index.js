/**
 * Bohr Product Arena — Period 3 (academic efficiency) skill provider.
 *
 * Bundles five localized skills that preserve the period-3 contest playbook:
 * overview, minimal agent-first skill design, per-task playbooks for four
 * tracks, cloud build pipeline, and scoring strategy.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const PROVIDER_NAME = 'bohr-arena-p3'
const RANK = 600
const SKILLS_ROOT = new URL('../assets/skills/', import.meta.url)

const ENTRIES = [
  {
    dir: 'bohr-p3-overview',
    name: 'bohr-p3-overview',
    description:
      '第三期（学术效率）33 题/4 赛道全景：赛道总分规则、成绩演进、核心实证结论与策略决策树。当复盘或复刻第三期打法、制定多题并行竞赛策略时使用。',
  },
  {
    dir: 'bohr-p3-skill-blueprint',
    name: 'bohr-p3-skill-blueprint',
    description:
      '极简 agent-first Skill 设计法与四赛道交付契约：init/show/check/build 流程、eval 等价冒烟、产物兜底、极限稳健版与包体约束。当为 reading/writing/graphics/slides 类任务编写参赛 Skill 时使用。',
  },
  {
    dir: 'bohr-p3-task-playbooks',
    name: 'bohr-p3-task-playbooks',
    description:
      '第三期 33 题逐题打法：按文献阅读、学术写作、科研图形、学术演示四大赛道给出题目要点、契约字段、评分映射与失败模式。当针对具体学术效率题型设计 Skill 时使用。',
  },
  {
    dir: 'bohr-p3-cloud-pipeline',
    name: 'bohr-p3-cloud-pipeline',
    description:
      '玻尔·科学空间云端建包与本地流水线：任务书结构、云端会话要点、产物打包白名单、本地终检、提交、自动化守护与故障恢复。当用云端 Agent 批量构建 Skill 包并流水线提交时使用。',
  },
  {
    dir: 'bohr-p3-scoring-strategy',
    name: 'bohr-p3-scoring-strategy',
    description:
      '第三期评分与提分实证：0 分=evaluation_error、评测方差、重 roll、patch 增补、融合重写失败结论、评测标准漂移与门槛/赛程决策。当需要决定提分手段与提交节奏时使用。',
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
const name = 'bohr-arena-p3'
const inject = ['skills']

function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}

export { apply, inject, name }
