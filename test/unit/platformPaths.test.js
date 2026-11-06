import { describe, expect, it } from 'vitest'
import path from 'path'
import { ArchType } from '@arffornia/nexus_java'
import fs from 'fs'
import os from 'os'
import { afterEach, beforeEach } from 'vitest'
import { dataRoot, legacyLocations, migrateLegacyDir, resolveDataDir } from '../../src/main/dataDir'
import { getArchType } from '../../src/main/utils'

describe('dataRoot', () => {
  it.each([
    [
      'win32',
      { LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local' },
      'C:\\Users\\me',
      'C:\\Users\\me\\AppData\\Local\\Arffornia'
    ],
    ['win32', {}, 'C:\\Users\\me', 'C:\\Users\\me\\AppData\\Local\\Arffornia'],
    ['darwin', {}, '/Users/me', '/Users/me/Library/Application Support/Arffornia'],
    ['linux', {}, '/home/me', '/home/me/.local/share/arffornia'],
    ['linux', { XDG_DATA_HOME: '/data/xdg' }, '/home/me', '/data/xdg/arffornia'],
    ['linux', { XDG_DATA_HOME: 'relative/xdg' }, '/home/me', '/home/me/.local/share/arffornia']
  ])('on %s with %j uses the standard per-user folder', (platform, env, home, expected) => {
    expect(dataRoot(platform, env, home)).toBe(expected)
  })

  it('never depends on the working directory', () => {
    expect(path.isAbsolute(resolveDataDir('game'))).toBe(true)
  })
})

describe('legacyLocations', () => {
  it('looks next to the working directory and the executable', () => {
    const found = legacyLocations('.Arffornia_V.5.2', {
      platform: 'linux',
      cwd: '/home/me',
      exeDir: '/opt/arffornia',
      root: '/r'
    })
    expect(found).toEqual(['/home/me/.Arffornia_V.5.2', '/opt/arffornia/.Arffornia_V.5.2'])
  })

  it('also looks under the data root on macOS, where older launchers kept it', () => {
    const found = legacyLocations('.Arffornia_V.5.2', {
      platform: 'darwin',
      cwd: '/',
      root: '/Users/me/Library/Application Support/Arffornia'
    })
    expect(found).toContain('/Users/me/Library/Application Support/Arffornia/.Arffornia_V.5.2')
  })
})

describe('migrateLegacyDir', () => {
  let tmp
  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'arffornia-datadir-'))
  })
  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true })
  })

  it('moves an older install to the new folder with its content', () => {
    const legacy = path.join(tmp, 'home', '.Arffornia_V.5.2')
    fs.mkdirSync(path.join(legacy, 'mods'), { recursive: true })
    fs.writeFileSync(path.join(legacy, 'launcherOptions.json'), '{}')
    const target = path.join(tmp, 'share', 'arffornia', 'game')

    const result = migrateLegacyDir(target, [path.join(tmp, 'missing'), legacy])

    expect(result).toEqual({ from: legacy, to: target })
    expect(fs.existsSync(path.join(target, 'launcherOptions.json'))).toBe(true)
    expect(fs.existsSync(legacy)).toBe(false)
  })

  it('does nothing when the new folder already exists', () => {
    const legacy = path.join(tmp, '.Arffornia_V.5.2')
    const target = path.join(tmp, 'game')
    fs.mkdirSync(legacy)
    fs.mkdirSync(target)

    expect(migrateLegacyDir(target, [legacy])).toBeNull()
    expect(fs.existsSync(legacy)).toBe(true)
  })

  it('does nothing on a fresh install', () => {
    expect(migrateLegacyDir(path.join(tmp, 'game'), [path.join(tmp, 'nope')])).toBeNull()
  })

  it('ignores a legacy path that is a file, not a folder', () => {
    const legacy = path.join(tmp, '.Arffornia_V.5.2')
    fs.writeFileSync(legacy, '')

    expect(migrateLegacyDir(path.join(tmp, 'game'), [legacy])).toBeNull()
  })

  it('reports a failed move instead of throwing', () => {
    const fsStub = {
      existsSync: () => false,
      statSync: () => ({ isDirectory: () => true }),
      mkdirSync: () => {},
      renameSync: () => {
        throw new Error('EXDEV: cross-device link not permitted')
      }
    }

    const result = migrateLegacyDir('/new/game', ['/old/.Arffornia_V.5.2'], fsStub)

    expect(result.error).toMatch(/EXDEV/)
  })
})

describe('getArchType', () => {
  it('maps Node arch names to Azul arch names', () => {
    expect(getArchType('x64', 'linux', false)).toBe(ArchType.X64)
    expect(getArchType('arm64', 'linux', false)).toBe(ArchType.AARCH64)
    expect(getArchType('arm64', 'darwin', false)).toBe(ArchType.AARCH64)
  })

  it('asks for an arm64 Java when an x64 build runs under Rosetta on Apple Silicon', () => {
    expect(getArchType('x64', 'darwin', true)).toBe(ArchType.AARCH64)
    expect(getArchType('x64', 'darwin', false)).toBe(ArchType.X64)
  })
})
