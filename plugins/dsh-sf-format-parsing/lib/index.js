/**
 * 科学数据格式解析工程（FMT 三题） — DSH skill provider.
 *
 * Registers the bundled contest playbook skills from ./assets/skills/<name>/.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const PROVIDER_NAME = 'sf-format-parsing'
const RANK = 600
const SKILLS_ROOT = new URL('../assets/skills/', import.meta.url)

const ENTRIES = [
  {
    dir: 'sf-fmt-overview',
    name: 'sf-fmt-overview',
    description: '大科学装置专项赛格式解析三题（谱学/衍射、计算化学与仿真、显微与成像）全景：赛题结构、计分公式、版本阶梯、最终结果与可复用结论。当复盘或复刻科学数据格式解析类题时使用。'
  },
  {
    dir: 'sf-fmt-adapter-engineering',
    name: 'sf-fmt-adapter-engineering',
    description: '格式适配器工程方法：从格式清单到通用生成器（manifest/parser/knowledge/expected），再到 L2/K3/dir-mode 加固与评测口径。当批量实现科学数据格式解析器或做兼容性加固时使用。'
  },
  {
    dir: 'sf-fmt-local-judge',
    name: 'sf-fmt-local-judge',
    description: 'FMT 离线验证体系：官方验收器复刻、合成 hidden 代理与校准系数、逐包 diff、打包与 QA 清单。当需要离线判分格式适配器包或估计隐藏集表现时使用。'
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
const name = 'sf-format-parsing'
const inject = ['skills']

function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}

export { apply, inject, name }
