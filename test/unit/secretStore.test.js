import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSecretStore, ENCRYPTED_PREFIX } from '../../src/main/secretStore'
import { isRendererSettingKey, isValidRendererSetting } from '../../src/main/settingsAllowList'

function fakeSaver() {
  const data = {}
  return {
    data,
    save: vi.fn(async (k, v) => {
      data[k] = v
    }),
    load: vi.fn(async (k) => data[k] || ''),
    delete: vi.fn(async (k) => delete data[k])
  }
}

// Reversible fake "encryption" so tests can assert the stored value is not the plaintext.
function fakeSafeStorage(available = true) {
  return {
    isEncryptionAvailable: vi.fn(() => available),
    encryptString: vi.fn((s) => Buffer.from(`x${s.split('').reverse().join('')}`)),
    decryptString: vi.fn((b) => {
      const s = b.toString()
      if (!s.startsWith('x')) throw new Error('bad ciphertext')
      return s.slice(1).split('').reverse().join('')
    })
  }
}

const logger = { warn: vi.fn(), error: vi.fn() }
const TOKEN = 'M.C123_BAY.refresh-token-value'

let saver
beforeEach(() => {
  saver = fakeSaver()
})

describe('secretStore', () => {
  it('stores the value encrypted and reads it back', async () => {
    const store = createSecretStore({ saver, safeStorage: fakeSafeStorage(), logger })
    await store.set('refresh-token', TOKEN)
    expect(saver.data['refresh-token'].startsWith(ENCRYPTED_PREFIX)).toBe(true)
    expect(saver.data['refresh-token']).not.toContain(TOKEN)
    expect(await store.get('refresh-token')).toBe(TOKEN)
  })

  it('migrates a plaintext value from older versions', async () => {
    saver.data['refresh-token'] = TOKEN
    const store = createSecretStore({ saver, safeStorage: fakeSafeStorage(), logger })
    expect(await store.get('refresh-token')).toBe(TOKEN)
    expect(saver.data['refresh-token'].startsWith(ENCRYPTED_PREFIX)).toBe(true)
  })

  it('keeps the value in memory only when encryption is unavailable', async () => {
    saver.data['refresh-token'] = TOKEN // legacy plaintext
    const store = createSecretStore({ saver, safeStorage: fakeSafeStorage(false), logger })
    expect(await store.get('refresh-token')).toBe(TOKEN)
    expect(saver.data['refresh-token']).toBeUndefined()
    expect(await store.get('refresh-token')).toBe(TOKEN)

    await store.set('refresh-token', 'new-token-value')
    expect(saver.data['refresh-token']).toBeUndefined()
    expect(await store.get('refresh-token')).toBe('new-token-value')
  })

  it('returns empty and clears an undecryptable value', async () => {
    saver.data['refresh-token'] = `${ENCRYPTED_PREFIX}${Buffer.from('garbage').toString('base64')}`
    const store = createSecretStore({ saver, safeStorage: fakeSafeStorage(), logger })
    expect(await store.get('refresh-token')).toBe('')
    expect(saver.data['refresh-token']).toBeUndefined()
  })

  it('returns empty when encryption becomes unavailable for an encrypted value', async () => {
    saver.data['refresh-token'] = `${ENCRYPTED_PREFIX}abcd`
    const store = createSecretStore({ saver, safeStorage: fakeSafeStorage(false), logger })
    expect(await store.get('refresh-token')).toBe('')
  })

  it('delete and empty set remove the value', async () => {
    const store = createSecretStore({ saver, safeStorage: fakeSafeStorage(), logger })
    await store.set('refresh-token', TOKEN)
    await store.delete('refresh-token')
    expect(await store.get('refresh-token')).toBe('')
    await store.set('refresh-token', TOKEN)
    await store.set('refresh-token', '')
    expect(saver.data['refresh-token']).toBeUndefined()
  })
})

describe('renderer settings allow-list', () => {
  it('allows lang and allocatedRam only', () => {
    expect(isRendererSettingKey('lang')).toBe(true)
    expect(isRendererSettingKey('allocatedRam')).toBe(true)
    expect(isRendererSettingKey('refresh-token')).toBe(false)
    expect(isRendererSettingKey('__proto__')).toBe(false)
    expect(isRendererSettingKey('constructor')).toBe(false)
    expect(isRendererSettingKey(undefined)).toBe(false)
  })

  it('validates values', () => {
    expect(isValidRendererSetting('lang', 'fr')).toBe(true)
    expect(isValidRendererSetting('lang', 'de')).toBe(false)
    expect(isValidRendererSetting('allocatedRam', 6)).toBe(true)
    expect(isValidRendererSetting('allocatedRam', '6')).toBe(true)
    expect(isValidRendererSetting('allocatedRam', 0)).toBe(false)
    expect(isValidRendererSetting('allocatedRam', 1.5)).toBe(false)
    expect(isValidRendererSetting('allocatedRam', 'abc')).toBe(false)
    expect(isValidRendererSetting('refresh-token', 'x')).toBe(false)
  })
})
