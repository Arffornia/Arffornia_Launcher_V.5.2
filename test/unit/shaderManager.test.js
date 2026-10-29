import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../src/main/index.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

let tmpDir
let ShaderManager

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'arffornia-shaders-'))
  vi.resetModules()
  vi.doMock('../../src/main/launcherSettings', () => ({
    launcherSettings: { GAME_DIR: path.join(tmpDir, 'game') }
  }))
  ;({ ShaderManager } = await import('../../src/main/shaderManager'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

describe('ShaderManager path confinement', () => {
  it('resolves plain names inside shaderpacks', () => {
    const manager = new ShaderManager()
    expect(manager.resolveShaderPath('BSL.zip')).toBe(path.join(manager.shaderpacksDir, 'BSL.zip'))
  })

  it.each(['../launcherOptions.json', '../../outside', '..', '.', 'sub/dir.zip', path.join(os.tmpdir(), 'abs.zip'), ''])(
    'refuses %j',
    (name) => {
      const manager = new ShaderManager()
      expect(() => manager.resolveShaderPath(name)).toThrow()
    }
  )

  it('deleteShader cannot remove files outside shaderpacks', () => {
    const manager = new ShaderManager()
    const victim = path.join(manager.gameDir, 'launcherOptions.json')
    fs.writeFileSync(victim, '{}')
    expect(() => manager.deleteShader('../launcherOptions.json')).toThrow()
    expect(fs.existsSync(victim)).toBe(true)
  })

  it('deleteShader removes an installed shader', () => {
    const manager = new ShaderManager()
    const file = path.join(manager.shaderpacksDir, 'BSL.zip')
    fs.writeFileSync(file, 'zip')
    expect(manager.deleteShader('BSL.zip')).toBe(true)
    expect(fs.existsSync(file)).toBe(false)
  })

  it('downloadShader refuses a traversal target before any network call', async () => {
    const manager = new ShaderManager()
    await expect(
      manager.downloadShader('https://cdn.modrinth.com/x.zip', '../../evil.zip')
    ).rejects.toThrow()
    expect(fs.existsSync(path.join(tmpDir, 'evil.zip'))).toBe(false)
  })
})

describe('ShaderManager iris.properties', () => {
  it('round-trips the active shader and keeps other lines', () => {
    const manager = new ShaderManager()
    fs.writeFileSync(manager.irisConfigPath, '# comment\nmaxShadowRenderDistance=32\n')
    manager.setActiveShader('BSL.zip')
    expect(manager.getActiveShader()).toBe('BSL.zip')
    const content = fs.readFileSync(manager.irisConfigPath, 'utf-8')
    expect(content).toContain('# comment')
    expect(content).toContain('maxShadowRenderDistance=32')
    manager.setActiveShader('OFF')
    expect(manager.getActiveShader()).toBe('OFF')
  })
})
