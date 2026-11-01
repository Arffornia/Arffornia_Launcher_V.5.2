// Guards for the launcher translations (src/renderer/src/i18n/locales).
// - en.json and fr.json have exactly the same keys, and no empty values;
// - every translation key referenced from src/ (t('...'), $t('...'), notification keys sent
//   by the main process, label keys in components) exists in both files;
// - every progress step and supported locale has a label.
import { describe, expect, it, vi } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative, resolve } from 'path'
import en from '../../src/renderer/src/i18n/locales/en.json'
import fr from '../../src/renderer/src/i18n/locales/fr.json'
import { StepName } from '../../src/main/progressManager.js'
import { SUPPORTED_LOCALES, resolveLocale } from '../../src/renderer/src/i18n/translator.js'
import { ENVIRONMENTS } from '../../src/shared/channel.js'

// progressManager imports the Electron entry point; only its StepName enum is needed here.
vi.mock('../../src/main/index.js', () => ({ getMainWindow: () => null, logger: { info() {} } }))

const SRC = resolve(__dirname, '../../src')
const LOCALES = { en, fr }

function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatten(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]
  )
}

function sourceFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return name === 'locales' ? [] : sourceFiles(path)
    return /\.(vue|js|mjs|cjs)$/.test(name) ? [path] : []
  })
}

const flat = Object.fromEntries(Object.entries(LOCALES).map(([l, m]) => [l, Object.fromEntries(flatten(m))]))
const namespaces = Object.keys(en)

/** Collects quoted strings that look like translation keys ("<namespace>.<a>[.<b>...]"). */
function referencedKeys() {
  const nsAlt = namespaces.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const keyRe = new RegExp(`['"\`]((?:${nsAlt})(?:\\.[A-Za-z0-9_]+)+)['"\`]`, 'g')
  const refs = []
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8')
    for (const m of text.matchAll(keyRe)) refs.push({ key: m[1], file: relative(SRC, file) })
  }
  return refs
}

describe('launcher i18n', () => {
  it('en and fr have exactly the same keys', () => {
    const enKeys = Object.keys(flat.en).sort()
    const frKeys = Object.keys(flat.fr).sort()
    expect(frKeys.filter((k) => !(k in flat.en)), 'keys only in fr.json').toEqual([])
    expect(enKeys.filter((k) => !(k in flat.fr)), 'keys only in en.json').toEqual([])
  })

  it('has no empty or non-string translations', () => {
    for (const [locale, entries] of Object.entries(flat)) {
      const bad = Object.entries(entries).filter(([, v]) => typeof v !== 'string' || v.trim() === '')
      expect(bad.map(([k]) => `${locale}:${k}`)).toEqual([])
    }
  })

  it('uses the same {placeholders} in every locale', () => {
    const params = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    const diff = Object.keys(flat.en).filter(
      (k) => JSON.stringify(params(flat.en[k])) !== JSON.stringify(params(flat.fr[k]))
    )
    expect(diff).toEqual([])
  })

  it('every key referenced in src/ exists in en and fr', () => {
    const refs = referencedKeys()
    expect(refs.length).toBeGreaterThan(50)
    const missing = refs
      .filter(({ key }) => !(key in flat.en) || !(key in flat.fr))
      .map(({ key, file }) => `${file}: ${key}`)
    expect([...new Set(missing)]).toEqual([])
  })

  it('every t()/$t() call uses a literal key or a known dynamic prefix', () => {
    const allowedDynamic = [
      'languages.', // Settings.vue: t(`languages.${lang}`)
      'settings.environment.', // Settings.vue: t(`settings.environment.${env.id}`), checked below
      'stepKey', // GlobalProgressBar.vue: `progress.steps.${stepName}`, covered by the step test
      'performanceTag.labelKey', // ShaderCard.vue: literal keys checked above
      'props.messageKey' // Notification.vue: keys from addNotification, checked above
    ]
    const offenders = []
    for (const file of sourceFiles(join(SRC, 'renderer'))) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(/\$?\bt\(\s*([^'"\s][^,)]*)/g)) {
        const arg = m[1].replace(/^`/, '')
        if (!allowedDynamic.some((p) => arg.startsWith(p))) offenders.push(`${relative(SRC, file)}: t(${m[1]})`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('has a label for every beta environment', () => {
    for (const { id } of ENVIRONMENTS) {
      for (const locale of Object.keys(LOCALES)) {
        expect(flat[locale][`settings.environment.${id}`], `${locale}: settings.environment.${id}`).toBeTruthy()
      }
    }
  })

  it('has a label for every progress step and every supported locale', () => {
    for (const step of Object.values(StepName)) {
      expect(flat.en[`progress.steps.${step}`], step).toBeTruthy()
      expect(flat.fr[`progress.steps.${step}`], step).toBeTruthy()
    }
    for (const locale of SUPPORTED_LOCALES) {
      expect(LOCALES[locale], locale).toBeTruthy()
      expect(flat.en[`languages.${locale}`], locale).toBeTruthy()
    }
  })

  it('resolves the OS locale: fr* is French, anything else English', () => {
    expect(resolveLocale('fr')).toBe('fr')
    expect(resolveLocale('fr-FR')).toBe('fr')
    expect(resolveLocale('fr-CA')).toBe('fr')
    expect(resolveLocale('en-US')).toBe('en')
    expect(resolveLocale('de-DE')).toBe('en')
    expect(resolveLocale('')).toBe('en')
    expect(resolveLocale(undefined)).toBe('en')
  })
})
