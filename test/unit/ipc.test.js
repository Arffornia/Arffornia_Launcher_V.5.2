import { beforeEach, describe, expect, it, vi } from 'vitest'

const handlers = new Map()

vi.mock('electron', () => ({
  ipcMain: { handle: (channel, fn) => handlers.set(channel, fn) }
}))
vi.mock('@electron-toolkit/utils', () => ({ is: { dev: false } }))

const { handle, isTrustedSender } = await import('../../src/main/ipc')

function eventFrom(url, { parent = null } = {}) {
  return { senderFrame: { url, parent } }
}

beforeEach(() => handlers.clear())

describe('handle()', () => {
  it('forwards calls from the app renderer', async () => {
    const listener = vi.fn((_e, a, b) => a + b)
    handle('sum', listener)
    const result = await handlers.get('sum')(eventFrom('file:///app/out/renderer/index.html'), 1, 2)
    expect(result).toBe(3)
  })

  it('rejects calls from a remote origin', () => {
    const listener = vi.fn()
    handle('x', listener)
    expect(() => handlers.get('x')(eventFrom('https://evil.example/'))).toThrow(/untrusted sender/)
    expect(listener).not.toHaveBeenCalled()
  })

  it('rejects calls from a sub-frame', () => {
    handle('y', vi.fn())
    const event = eventFrom('file:///app/out/renderer/index.html', { parent: {} })
    expect(() => handlers.get('y')(event)).toThrow(/untrusted sender/)
  })

  it('rejects events without a sender frame', () => {
    expect(isTrustedSender({})).toBe(false)
    expect(isTrustedSender(undefined)).toBe(false)
  })
})
