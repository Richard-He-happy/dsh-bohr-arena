/**
 * 仪器视觉与模拟器（FIB-SEM 两题） — DSH skill provider.
 *
 * Registers the bundled contest playbook skills from ./assets/skills/<name>/.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const PROVIDER_NAME = 'sf-instrument-vision'
const RANK = 600
const SKILLS_ROOT = new URL('../assets/skills/', import.meta.url)

const ENTRIES = [
  {
    dir: 'sf-instrument-overview',
    name: 'sf-instrument-overview',
    description: '大科学装置专项赛仪器类两题（FIB-SEM 视觉识别与 FIBSEM 模拟器操作）全景：子任务结构、评分公式、最终结果与关键结论。当复盘或复刻仪器图像与模拟器操作类题时使用。'
  },
  {
    dir: 'sf-fibsem-vision',
    name: 'sf-fibsem-vision',
    description: 'FIB-SEM 视觉识别四子任务打法：八类分割、零训练提示分割、针尖定位、AI 成对数据生成，以及组合评分下的配额与单变量探针策略。当处理仪器图像分割/定位或组合型视觉任务时使用。'
  },
  {
    dir: 'sf-fibsem-simulator',
    name: 'sf-fibsem-simulator',
    description: 'FIBSEM 模拟器操作打法：十子题入口、lease 容量机制、几何标定与自动求解、运动指令与评测判据、提交窗口与最后一发决策。当在模拟器中完成仪器操作类任务时使用。'
  }
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

/** Cordis plugin name. */
const name = 'sf-instrument-vision'
const inject = ['skills']

function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}

export { apply, inject, name }
