import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { environmentFile, readEnvironment, writeEnvironment } from '../../src/main/environment'

let root

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'arffornia-env-'))
})

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true })
})

describe('beta environment file', () => {
  it('reads production when nothing was saved', () => {
    expect(readEnvironment({ file: environmentFile(root), channel: 'beta' })).toBe('production')
  })

  it('reads back the environment it saved', () => {
    const file = environmentFile(root)

    writeEnvironment('staging', { file, channel: 'beta' })

    expect(readEnvironment({ file, channel: 'beta' })).toBe('staging')
  })

  it('reads production from a corrupt file', () => {
    const file = environmentFile(root)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, '{not json')

    expect(readEnvironment({ file, channel: 'beta' })).toBe('production')
  })

  it('refuses an unknown environment and writes nothing', () => {
    const file = environmentFile(root)

    expect(() => writeEnvironment('../etc', { file, channel: 'beta' })).toThrow()
    expect(fs.existsSync(file)).toBe(false)
  })

  it('refuses any environment but production in the prod launcher', () => {
    expect(() => writeEnvironment('staging', { file: environmentFile(root), channel: '' })).toThrow()
  })
})
