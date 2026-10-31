import { beforeEach, describe, expect, it, vi } from 'vitest'

const handlers = new Map()
const logger = vi.hoisted(() => ({ info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() }))
const currentUser = vi.hoisted(() => ({ setLang: vi.fn(), getIsAuth: vi.fn(), getName: vi.fn() }))

vi.mock('electron', () => ({
  ipcMain: { handle: (channel, fn) => handlers.set(channel, fn) },
  app: { getLocale: () => 'fr-FR' }
}))
vi.mock('@electron-toolkit/utils', () => ({ is: { dev: false } }))
vi.mock('../../src/main/index.js', () => ({ logger }))
vi.mock('../../src/main/user', () => ({ default: currentUser }))

const { registerLoggerHandlers, logFromRenderer } = await import('../../src/main/ipcHandlers/logHandler')
const { registerUserManagerHandlers } = await import('../../src/main/ipcHandlers/userManagerHandler')

const appEvent = { senderFrame: { url: 'file:///app/out/renderer/index.html', parent: null } }

beforeEach(() => {
  handlers.clear()
  vi.clearAllMocks()
  registerLoggerHandlers()
  registerUserManagerHandlers()
})

describe('logger handler', () => {
  it.each(['info', 'debug', 'warn', 'error'])('writes %s lines from the renderer', async (level) => {
    expect(await handlers.get('logger')(appEvent, level, 'hello')).toBe(true)
    expect(logger[level]).toHaveBeenCalledWith('[renderer] hello')
  })

  it('ignores unknown levels', () => {
    expect(logFromRenderer('trace', 'x')).toBe(false)
    expect(logFromRenderer(appEvent, 'x')).toBe(false)
    expect(logger.info).not.toHaveBeenCalled()
  })

  it('caps very long messages', () => {
    logFromRenderer('info', 'a'.repeat(20_000))
    expect(logger.info.mock.calls[0][0].length).toBeLessThan(10_100)
  })
})

describe('set-lang handler', () => {
  it('stores the language string, not the IPC event', async () => {
    await handlers.get('set-lang')(appEvent, 'fr')
    expect(currentUser.setLang).toHaveBeenCalledWith('fr')
  })

  it('rejects unsupported values', () => {
    expect(() => handlers.get('set-lang')(appEvent, { evil: true })).toThrow()
    expect(() => handlers.get('set-lang')(appEvent, 'de')).toThrow()
    expect(currentUser.setLang).not.toHaveBeenCalled()
  })
})
