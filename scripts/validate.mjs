#!/usr/bin/env node
/**
 * Static + runtime validation for every bundled DSH plugin in this repository.
 *
 * - package.json / cordis.patch.yml / icon / locale / README presence
 * - host plugin loads under a mock Cordis context and registers a provider
 * - provider list()/get() work for every entry
 * - each SKILL.md has frontmatter whose name/description match the provider
 * - relative reference links resolve inside the skill directory
 * - size limits hold and no orphan skill directories exist
 *
 * Usage: node scripts/validate.mjs
 * Exit code 0 = pass, 1 = failures.
 */
import { readFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const MAX_FILE_BYTES = 25 * 1024
const MAX_SKILL_BYTES = 64 * 1024
const MAX_PLUGIN_BYTES = 320 * 1024

const failures = []
const notes = []
const fail = (message) => failures.push(message)
const note = (message) => notes.push(message)

const rel = (path) => relative(ROOT, path).replaceAll('\\', '/')

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (entry.isFile()) out.push(full)
  }
  return out
}

function parseFrontmatter(text) {
  const normalized = text.replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n')) return { data: {}, body: normalized }
  const end = normalized.indexOf('\n---\n', 4)
  if (end === -1) return { data: {}, body: normalized }
  const block = normalized.slice(4, end)
  const data = {}
  for (const line of block.split('\n')) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/u.exec(line)
    if (match) data[match[1]] = match[2].replace(/^['"]|['"]$/gu, '')
  }
  return { data, body: normalized.slice(end + 5) }
}

async function mockApply(pluginDir, expectedNames) {
  const modulePath = join(pluginDir, 'lib', 'index.js')
  const module = await import(pathToFileURL(modulePath).href)
  if (typeof module.apply !== 'function') throw new Error('lib/index.js exports no apply()')
  if (!Array.isArray(module.inject) || !module.inject.includes('skills'))
    throw new Error('lib/index.js must inject ["skills"]')
  const exportedName = module.name
  if (!expectedNames.includes(exportedName))
    throw new Error(`exported name "${exportedName}" should be one of ${expectedNames.join(' / ')}`)

  let factory
  const ctx = {
    skills: {
      registerProvider(create) {
        factory = create
      },
    },
  }
  module.apply(ctx)
  if (typeof factory !== 'function') throw new Error('apply() did not register a skill provider')
  return factory({ signal: new AbortController().signal, invalidate() {} })
}

async function validatePlugin(pluginName) {
  const pluginDir = join(ROOT, 'plugins', pluginName)
  if (!existsSync(pluginDir)) {
    fail(`${pluginName}: plugin directory missing`)
    return
  }

  let pkg
  try {
    pkg = JSON.parse(await readFile(join(pluginDir, 'package.json'), 'utf8'))
  } catch (error) {
    fail(`${pluginName}: unreadable package.json (${error.message})`)
    return
  }
  if (pkg.name !== pluginName && pkg.name !== `dsh-${pluginName}`)
    fail(`${pluginName}: package.json name "${pkg.name}" should be "${pluginName}" or "dsh-${pluginName}"`)
  if (typeof pkg.version !== 'string' || !/^\d+\.\d+\.\d+$/u.test(pkg.version))
    fail(`${pluginName}: version must be exact SemVer`)
  if (pkg.type !== 'module') fail(`${pluginName}: package.json must declare "type": "module"`)
  if (pkg?.dsh?.bundle?.patch !== './cordis.patch.yml') fail(`${pluginName}: dsh.bundle.patch must be ./cordis.patch.yml`)
  if (pkg?.exports?.['.'] !== './lib/index.js') fail(`${pluginName}: exports["."] must be ./lib/index.js`)
  for (const required of ['cordis.patch.yml', 'icon.svg', 'lib/index.js', 'locale/zh.json', 'locale/en.json', 'README.md']) {
    if (!existsSync(join(pluginDir, required))) fail(`${pluginName}: missing ${required}`)
  }
  try {
    JSON.parse(await readFile(join(pluginDir, 'locale', 'zh.json'), 'utf8'))
    JSON.parse(await readFile(join(pluginDir, 'locale', 'en.json'), 'utf8'))
  } catch (error) {
    fail(`${pluginName}: locale JSON invalid (${error.message})`)
  }

  const patch = await readFile(join(pluginDir, 'cordis.patch.yml'), 'utf8')
  if (!patch.includes(`name: '${pkg.name}'`)) fail(`${pluginName}: cordis.patch.yml does not insert ${pkg.name}`)

  const expectedNames = [pluginName, pluginName.replace(/^dsh-/, '')]
  let provider
  try {
    provider = await mockApply(pluginDir, expectedNames)
  } catch (error) {
    fail(`${pluginName}: mock apply failed: ${error.message}`)
    return
  }

  let candidates
  try {
    candidates = await provider.list()
  } catch (error) {
    fail(`${pluginName}: provider.list() threw: ${error.message}`)
    return
  }
  if (!Array.isArray(candidates) || candidates.length === 0) {
    fail(`${pluginName}: provider.list() returned no candidates`)
    return
  }
  note(`${pluginName}: ${candidates.length} skills`)

  const skillsDir = join(pluginDir, 'assets', 'skills')
  const dirs = existsSync(skillsDir)
    ? (await readdir(skillsDir, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    : []
  const names = new Set(candidates.map((candidate) => candidate.name))
  for (const dir of dirs) if (!names.has(dir)) fail(`${pluginName}: orphan skill directory ${dir}`)
  for (const name of names) if (!dirs.includes(name)) fail(`${pluginName}: candidate ${name} has no assets/skills/${name}`)

  for (const candidate of candidates) {
    const label = `${pluginName}/${candidate.name}`
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(candidate.name)) fail(`${label}: invalid skill name`)
    if (typeof candidate.description !== 'string' || candidate.description.trim() === '')
      fail(`${label}: empty description`)
    if (candidate.provider !== provider.name) fail(`${label}: candidate.provider must be ${provider.name}`)
    if (candidate.source !== 'bundled') fail(`${label}: candidate.source must be bundled`)
    if (!candidate.invocation?.modelInvocable || !candidate.invocation?.userInvocable)
      fail(`${label}: invocation must allow model and user`)
    if (candidate.rank !== 600) fail(`${label}: candidate.rank must be 600`)

    const skillDir = join(skillsDir, candidate.name)
    const skillFile = join(skillDir, 'SKILL.md')
    if (!existsSync(skillFile)) {
      fail(`${label}: SKILL.md missing`)
      continue
    }
    const raw = await readFile(skillFile, 'utf8')
    const { data, body } = parseFrontmatter(raw)
    if (data.name !== candidate.name) fail(`${label}: frontmatter name "${data.name}" != "${candidate.name}"`)
    if (data.description !== candidate.description) fail(`${label}: frontmatter description differs from provider description`)
    if (typeof data.version !== 'string') fail(`${label}: frontmatter version missing`)
    if (body.trim() === '') fail(`${label}: empty body`)

    let loaded
    try {
      loaded = await provider.get(candidate)
    } catch (error) {
      fail(`${label}: provider.get() threw: ${error.message}`)
      continue
    }
    if (loaded === undefined) fail(`${label}: provider.get() returned undefined`)
    else {
      if (loaded.name !== candidate.name) fail(`${label}: loaded name mismatch`)
      if (loaded.provider !== provider.name) fail(`${label}: loaded provider mismatch`)
      if (loaded.content.startsWith('---')) fail(`${label}: frontmatter was not stripped`)
      if (loaded.content.trim().length < 200) fail(`${label}: body too short`)
      if (loaded.resourceBase?.kind !== 'directory' || !existsSync(loaded.resourceBase.path))
        fail(`${label}: resourceBase directory missing`)
    }

    const files = await walk(skillDir)
    let total = 0
    for (const file of files) {
      const size = (await stat(file)).size
      total += size
      if (size > MAX_FILE_BYTES) fail(`${label}: ${rel(file)} is ${size} bytes (> ${MAX_FILE_BYTES})`)
    }
    if (total > MAX_SKILL_BYTES) fail(`${label}: skill directory ${total} bytes (> ${MAX_SKILL_BYTES})`)
    note(`${label}: ${files.length} files, ${(total / 1024).toFixed(1)} KiB`)

    for (const file of files.filter((item) => item.endsWith('.md'))) {
      const text = await readFile(file, 'utf8')
      for (const match of text.matchAll(/\]\((?!https?:|mailto:|#)([^)\s]+)\)/gu)) {
        const target = decodeURIComponent(match[1].split('#')[0])
        if (target === '') continue
        const resolvedPath = resolve(dirname(file), target)
        if (!resolvedPath.startsWith(ROOT) || !existsSync(resolvedPath))
          fail(`${label}: broken relative link ${match[1]} in ${rel(file)}`)
      }
    }
  }

  const allFiles = await walk(pluginDir)
  let pluginBytes = 0
  for (const file of allFiles) pluginBytes += (await stat(file)).size
  if (pluginBytes > MAX_PLUGIN_BYTES) fail(`${pluginName}: plugin directory ${pluginBytes} bytes (> ${MAX_PLUGIN_BYTES})`)
  note(`${pluginName}: total ${(pluginBytes / 1024).toFixed(1)} KiB`)
}

const pluginsDir = join(ROOT, 'plugins')
const plugins = (await readdir(pluginsDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()
if (plugins.length === 0) fail('no plugins found')
for (const plugin of plugins) await validatePlugin(plugin)

for (const line of notes) console.log(`note   ${line}`)
for (const line of failures) console.error(`FAIL   ${line}`)
console.log(failures.length === 0 ? `PASS: ${plugins.length} plugins validated` : `${failures.length} failure(s)`)
process.exit(failures.length === 0 ? 0 : 1)
