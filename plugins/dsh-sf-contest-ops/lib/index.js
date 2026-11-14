/**
 * 平台参赛作战（大科学装置专项赛） — DSH skill provider.
 *
 * Registers the bundled contest playbook skills from ./assets/skills/<name>/.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const PROVIDER_NAME = 'sf-contest-ops'
const RANK = 600
const SKILLS_ROOT = new URL('../assets/skills/', import.meta.url)

const ENTRIES = [
  {
    dir: 'sf-platform-mechanics',
    name: 'sf-platform-mechanics',
    description: '限时科学竞赛平台机制：score=100×harbor_reward×trace 门控、提交额度、评分队列、评测租约容量、worker 故障语义与合规红线。当在玻尔 Playground 类平台参赛、需要理解评分与提交通道时使用。'
  },
  {
    dir: 'sf-contest-execution',
    name: 'sf-contest-execution',
    description: '24 小时短赛执行手册：赛前准备、动态规划与提交顺序、额度纪律、评分轮询、最后 2 小时收尾与多 agent 分工。当参加限时科学计算/工程类竞赛时使用。'
  },
  {
    dir: 'sf-failure-diagnosis',
    name: 'sf-failure-diagnosis',
    description: '平台故障诊断与申诉证据链：同包不同分、全平台 0 分、上传/队列故障、evaluation_error 语义、保留产物与恢复后重提策略。当比赛遇到评分异常或提交失败时使用。'
  },
  {
    dir: 'sf-round-lessons',
    name: 'sf-round-lessons',
    description: '大科学装置专项赛第一期关键教训汇总：配额未规划导致有候选无额度、最后一发决策、平台故障窗口、val 与 hidden 背离、工程型题 ROI 与合规边界。当复盘比赛失误或制定下期改进时使用。'
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
const name = 'sf-contest-ops'
const inject = ['skills']

function apply(ctx) {
  ctx.skills.registerProvider(() => provider)
}

export { apply, inject, name }
