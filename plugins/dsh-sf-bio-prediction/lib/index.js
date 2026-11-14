/**
 * 生物医学预测（CRISPRi 与药物识别） — DSH skill provider.
 *
 * Registers the bundled contest playbook skills from ./assets/skills/<name>/.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const PROVIDER_NAME = 'sf-bio-prediction'
const RANK = 600
const SKILLS_ROOT = new URL('../assets/skills/', import.meta.url)

const ENTRIES = [
  {
    dir: 'sf-bio-overview',
    name: 'sf-bio-overview',
    description: '大科学装置专项赛生物医学预测两题（CRISPRi 跨细胞扰动预测与跨剂量药物识别）全景：评分口径、数据与合规边界、最终结果与收手判据。当复盘或复刻生物信息预测类题时使用。'
  },
  {
    dir: 'sf-crispri-prediction',
    name: 'sf-crispri-prediction',
    description: 'CRISPRi 跨细胞扰动效应预测方法：相似扰动核迁移、逐行正缩放、target 自敲低与基础表达收缩、CV 噪声地板与线上校准。当做基因扰动响应/表达预测时使用。'
  },
  {
    dir: 'sf-drug-id',
    name: 'sf-drug-id',
    description: '跨剂量药物识别方法：ICC 特征加权与收缩协方差 LDA 白化 + 匈牙利匹配、深度度量（SupCon）融合、CV 与反泄漏检查。当做基于细胞表型的药物身份匹配时使用。'
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
const name = 'sf-bio-prediction'
const inject = ['skills']

function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}

export { apply, inject, name }
