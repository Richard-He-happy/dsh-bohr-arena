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

const categories = {
  'bohr-product-arena': { title: { en: 'Bohr Product Arena playbooks', zh: '玻尔产品周赛打法' } },
  'scientific-facilities': { title: { en: 'Scientific Facilities contest playbooks', zh: '大科学装置专项赛打法' } },
}
const labels = {
  'academic-writing': { title: { en: 'Academic writing', zh: '学术写作' } },
  'academic-efficiency': { title: { en: 'Academic efficiency', zh: '学术效率' } },
  'format-parsing': { title: { en: 'Format parsing', zh: '科学数据格式解析' } },
  'instrument-vision': { title: { en: 'Instrument vision & simulation', zh: '仪器视觉与模拟' } },
  'bio-prediction': { title: { en: 'Biomedical prediction', zh: '生物医学预测' } },
  'contest-ops': { title: { en: 'Contest operations', zh: '平台参赛作战' } },
}
const sortKey = { title: { en: 'Listing order', zh: '推荐顺序' }, order: 'asc' }

/** Map a plugin directory to its market category and labels. */
function classify(dir) {
  if (dir.startsWith('dsh-bohr-arena-p2')) return { category: 'bohr-product-arena', labels: ['academic-writing'] }
  if (dir.startsWith('dsh-bohr-arena-p3')) return { category: 'bohr-product-arena', labels: ['academic-efficiency'] }
  if (dir.includes('format-parsing')) return { category: 'scientific-facilities', labels: ['format-parsing'] }
  if (dir.includes('instrument-vision')) return { category: 'scientific-facilities', labels: ['instrument-vision'] }
  if (dir.includes('bio-prediction')) return { category: 'scientific-facilities', labels: ['bio-prediction'] }
  if (dir.includes('contest-ops')) return { category: 'scientific-facilities', labels: ['contest-ops'] }
  return { category: 'scientific-facilities', labels: [] }
}

const pluginsDir = join(ROOT, 'plugins')
const names = (await readdir(pluginsDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

const entries = []
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
  const { category, labels: pluginLabels } = classify(dir)
  entries.push({
    name: pkg.name,
    title: { en: en.title ?? pkg.name, zh: zh.title ?? pkg.name },
    description: { en: en.description ?? pkg.description ?? '', zh: zh.description ?? pkg.description ?? '' },
    ...(hasIcon ? { icon: `${rawBase}plugins/${dir}/icon.svg` } : {}),
    author: 'Bohr Product Arena Playbook',
    repository: { url: repo, directory: `plugins/${dir}` },
    metadata: {
      category,
      keywords: pkg.keywords ?? [],
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
    en: 'Bohr contest experience plugins',
    zh: '玻尔比赛经验插件',
  },
  description: {
    en: 'DSH plugins that preserve practical contest playbooks: Bohr Product Arena academic writing (period 2) and academic efficiency (period 3), plus Scientific Facilities format parsing, instrument vision/simulation, biomedical prediction, and contest operations.',
    zh: '把玻尔产品周赛（第二期学术写作、第三期学术效率）与大科学装置专项赛（格式解析、仪器视觉与模拟、生物医学预测、平台作战）的实操经验沉淀为可分发的 DSH 插件。',
  },
  metadata: {
    categories,
    labels,
    sortKeys: { order: sortKey },
  },
  plugins: entries,
}

await writeFile(outPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8')
console.log(`wrote ${outPath}`)
for (const entry of entries) console.log(`  ${entry.name}@${entry.versions[0].version} (${entry.versions[0].source.path})`)
console.log(`pinned to ${commit}`)
