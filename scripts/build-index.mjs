#!/usr/bin/env node
/**
 * Generate the DSH plugin-market index (format 1) for this repository.
 *
 * Each plugin is published as a git source pinned to one commit, so the index
 * keeps installing the reviewed content even after later commits.
 *
 * Usage:
 *   node scripts/build-index.mjs --repo https://github.com/<owner>/<repo> --commit <sha>
 *   node scripts/build-index.mjs --repo ... --commit HEAD --ref main
 *
 * Options:
 *   --repo    repository web URL (no .git suffix required)
 *   --commit  40-hex commit SHA that contains the plugin directories (default HEAD)
 *   --ref     branch or tag used only for the icon URLs (default main)
 *   --out     output path (default index.json at the repository root)
 */
import { readFile, readdir, writeFile, stat } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = new Map()
for (let index = 2; index < process.argv.length; index += 1) {
  const token = process.argv[index]
  if (token.startsWith('--')) args.set(token.slice(2), process.argv[index + 1] ?? '')
}
const repo = (args.get('repo') ?? '').replace(/\.git$/u, '').replace(/\/$/u, '')
if (!/^https:\/\/[^/]+\/[^/]+\/[^/]+$/u.test(repo)) {
  console.error('--repo must look like https://github.com/<owner>/<repo>')
  process.exit(1)
}
const ref = args.get('ref') ?? 'main'
const outPath = resolve(ROOT, args.get('out') ?? 'index.json')

function git(...gitArgs) {
  return execFileSync('git', gitArgs, { cwd: ROOT, encoding: 'utf8' }).trim()
}

let commit = args.get('commit') ?? 'HEAD'
if (commit !== 'HEAD' && !/^[0-9a-f]{40}$/u.test(commit)) {
  console.error('--commit must be a 40-hex commit SHA')
  process.exit(1)
}
commit = git('rev-parse', commit)
if (!/^[0-9a-f]{40}$/u.test(commit)) {
  console.error('could not resolve commit')
  process.exit(1)
}
const commitSeconds = Number(git('show', '-s', '--format=%ct', commit))
const rawBase = `https://raw.githubusercontent.com/${repo.replace(/^https:\/\/github\.com\//u, '')}/${ref}/`

const category = {
  title: { en: 'Contest playbooks', zh: '比赛经验与打法' },
}
const labels = {
  writing: { title: { en: 'Academic writing', zh: '学术写作' } },
  efficiency: { title: { en: 'Academic efficiency', zh: '学术效率' } },
  skills: { title: { en: 'Skill authoring', zh: 'Skill 构建' } },
}
const sortKey = { title: { en: 'Listing order', zh: '推荐顺序' }, order: 'asc' }

const pluginsDir = join(ROOT, 'plugins')
const entries = []
const names = (await readdir(pluginsDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

let order = 10
for (const dir of names) {
  const pluginDir = join(pluginsDir, dir)
  const pkg = JSON.parse(await readFile(join(pluginDir, 'package.json'), 'utf8'))
  const zh = JSON.parse(await readFile(join(pluginDir, 'locale', 'zh.json'), 'utf8')).meta ?? {}
  const en = JSON.parse(await readFile(join(pluginDir, 'locale', 'en.json'), 'utf8')).meta ?? {}
  const hasIcon = await stat(join(pluginDir, 'icon.svg')).then(
    () => true,
    () => false,
  )
  const pluginLabels = []
  const text = `${zh.title ?? ''} ${en.title ?? ''} ${zh.description ?? ''}`
  if (/写作/.test(text)) pluginLabels.push('writing')
  if (/效率/.test(text)) pluginLabels.push('efficiency')
  if (/Skill/.test(text)) pluginLabels.push('skills')
  entries.push({
    name: pkg.name,
    title: { en: en.title ?? pkg.name, zh: zh.title ?? pkg.name },
    description: { en: en.description ?? pkg.description ?? '', zh: zh.description ?? pkg.description ?? '' },
    ...(hasIcon ? { icon: `${rawBase}plugins/${dir}/icon.svg` } : {}),
    author: 'Bohr Product Arena Playbook',
    repository: { url: `${repo}`, directory: `plugins/${dir}` },
    metadata: {
      category: 'contest-playbooks',
      keywords: ['bohr', 'product-arena', 'skill', 'academic'],
      labels: pluginLabels,
      sortKeys: { order },
    },
    versions: [
      {
        version: pkg.version,
        publishTimestamp: commitSeconds,
        source: {
          type: 'git',
          url: repo,
          commit,
          path: `plugins/${dir}`,
        },
      },
    ],
  })
  order += 10
}

const index = {
  format: 1,
  title: {
    en: 'Bohr Product Arena experience plugins',
    zh: '玻尔产品赛经验插件',
  },
  description: {
    en: 'Two DSH plugins that preserve the practical playbooks of the Bohr Product Arena academic writing (period 2) and academic efficiency (period 3) contests: skill blueprints, per-task playbooks, submission mechanics, cloud pipeline, and scoring strategy.',
    zh: '两个 DSH 插件，分别沉淀玻尔产品赛第二期（学术写作全流程）与第三期（学术效率）的实操经验：Skill 构建规范、逐题打法、提交与评测机制、云端建包流水线、评分与提分策略。',
  },
  metadata: {
    categories: { 'contest-playbooks': category },
    labels,
    sortKeys: { order: sortKey },
  },
  plugins: entries,
}

await writeFile(outPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8')
console.log(`wrote ${outPath}`)
for (const entry of entries) console.log(`  ${entry.name}@${entry.versions[0].version} (${entry.versions[0].source.path})`)
console.log(`pinned to ${commit}`)
