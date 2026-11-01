// The renderer is web content. Vite replaces Node built-ins with an empty object in its bundle, so a
// Node call reached at import time (e.g. os.homedir() in src/main/dataDir.js through
// src/main/launcherSettings.js) throws before Vue mounts and leaves a blank window. CI runs no
// `make arch`, so this keeps the two rules that prevent it: the renderer never imports src/main/,
// and src/shared/ (imported by both sides) imports nothing but itself.
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative, resolve } from 'path'

const SRC = resolve(__dirname, '../../src')

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    return statSync(p).isDirectory() ? files(p) : /\.(js|mjs|vue)$/.test(name) ? [p] : []
  })
}

function imports(file) {
  const text = readFileSync(file, 'utf8')
  return [...text.matchAll(/^\s*import\s[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1])
}

describe('renderer imports', () => {
  it('never imports src/main/', () => {
    const bad = files(join(SRC, 'renderer')).flatMap((f) =>
      imports(f)
        .filter((i) => /(^|\/)main\//.test(i))
        .map((i) => `${relative(SRC, f)} -> ${i}`)
    )
    expect(bad).toEqual([])
  })

  it('src/shared/ imports only src/shared/', () => {
    const bad = files(join(SRC, 'shared')).flatMap((f) =>
      imports(f)
        .filter((i) => !i.startsWith('./'))
        .map((i) => `${relative(SRC, f)} -> ${i}`)
    )
    expect(bad).toEqual([])
  })
})
