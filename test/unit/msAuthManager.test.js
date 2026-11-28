import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  store: new Map(),
  auth: { refresh: vi.fn(), launch: vi.fn() },
  addNotification: vi.fn(),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}))

vi.mock('msmc', () => ({
  Auth: vi.fn(function () {
    return mocks.auth
  })
}))
vi.mock('electron', () => ({ app: { getLocale: () => 'en-US' } }))
vi.mock('../../src/main/index.js', () => ({
  logger: mocks.logger,
  addNotification: mocks.addNotification
}))
vi.mock('../../src/main/ipcHandlers/nexusSaverHandler', () => ({
  saverKeys: { REFRESH_TOKEN: 'refreshToken' },
  secretStore: {
    get: vi.fn(async (key) => mocks.store.get(key) ?? null),
    set: vi.fn(async (key, value) => mocks.store.set(key, value)),
    delete: vi.fn((key) => mocks.store.delete(key))
  }
}))

const { launchMSAuth, logoutMSAuth } = await import('../../src/main/msAuthManager')
const { default: currentUser } = await import('../../src/main/user')

const xboxManager = (name) => ({
  save: () => 'new-refresh-token',
  getMinecraft: async () => ({ mclc: () => ({ name, access_token: 'x' }) })
})

beforeEach(() => {
  mocks.store.clear()
  currentUser.setIsAuth(false)
  mocks.auth.refresh.mockReset()
  mocks.auth.launch.mockReset()
  mocks.addNotification.mockReset()
})

describe('launchMSAuth', () => {
  it('returns null without opening a login window when there is no saved session and no re-ask', async () => {
    const result = await launchMSAuth(false)

    expect(result).toBeNull()
    expect(mocks.auth.launch).not.toHaveBeenCalled()
  })

  it('signs in from the saved refresh token and stores the rotated one', async () => {
    mocks.store.set('refreshToken', 'old')
    mocks.auth.refresh.mockResolvedValue(xboxManager('Steve'))

    const result = await launchMSAuth(false)

    expect(result.name).toBe('Steve')
    expect(mocks.store.get('refreshToken')).toBe('new-refresh-token')
    expect(currentUser.getIsAuth()).toBe(true)
  })

  it('opens the Microsoft window when asked to and nothing is saved', async () => {
    mocks.auth.launch.mockResolvedValue(xboxManager('Alex'))

    await launchMSAuth(true)

    expect(currentUser.getName()).toBe('Alex')
  })

  it('notifies the user and stays logged out when the refresh fails', async () => {
    mocks.store.set('refreshToken', 'expired')
    mocks.auth.refresh.mockRejectedValue(new Error('invalid_grant'))

    const result = await launchMSAuth(false)

    expect(result).toBeUndefined()
    expect(mocks.addNotification).toHaveBeenCalledWith('notifications.login_failed', 'error')
    expect(currentUser.getIsAuth()).toBe(false)
  })
})

describe('logoutMSAuth', () => {
  it('forgets the refresh token and marks the user logged out', () => {
    mocks.store.set('refreshToken', 'old')
    currentUser.setIsAuth(true)

    logoutMSAuth()

    expect(mocks.store.has('refreshToken')).toBe(false)
    expect(currentUser.getIsAuth()).toBe(false)
  })
})
