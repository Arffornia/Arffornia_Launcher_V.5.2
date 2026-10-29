// Encrypted storage for credentials on top of Nexus_Saver, using Electron safeStorage
// (DPAPI on Windows, Keychain on macOS, the Secret Service / kwallet on Linux).

export const ENCRYPTED_PREFIX = 'enc:v1:'

/**
 * @param {object} deps
 * @param {{ save(k: string, v: string): any, load(k: string): any, delete(k: string): any }} deps.saver
 * @param {{ isEncryptionAvailable(): boolean, encryptString(s: string): Buffer, decryptString(b: Buffer): string }} deps.safeStorage
 * @param {{ warn(m: string): void, error(m: string): void }} deps.logger
 */
export function createSecretStore({ saver, safeStorage, logger }) {
  // Used when the OS offers no encryption: the secret is kept for this session only.
  const memory = new Map()

  const available = () => {
    try {
      return safeStorage.isEncryptionAvailable()
    } catch {
      return false
    }
  }

  async function set(key, value) {
    if (typeof value !== 'string' || value === '') {
      await remove(key)
      return
    }
    if (!available()) {
      logger.warn('OS encryption unavailable: the session will not be remembered after restart')
      memory.set(key, value)
      await saver.delete(key)
      return
    }
    const encrypted = safeStorage.encryptString(value).toString('base64')
    memory.delete(key)
    await saver.save(key, ENCRYPTED_PREFIX + encrypted)
  }

  async function get(key) {
    if (memory.has(key)) return memory.get(key)

    const stored = await saver.load(key)
    if (typeof stored !== 'string' || stored === '') return ''

    if (!stored.startsWith(ENCRYPTED_PREFIX)) {
      // Plaintext value written by an older launcher version: migrate it.
      await set(key, stored)
      return stored
    }

    if (!available()) {
      logger.warn('OS encryption unavailable: cannot read the saved session')
      return ''
    }
    try {
      return safeStorage.decryptString(Buffer.from(stored.slice(ENCRYPTED_PREFIX.length), 'base64'))
    } catch (err) {
      logger.error(`Could not decrypt the saved session, a new login is needed: ${err}`)
      await saver.delete(key)
      return ''
    }
  }

  async function remove(key) {
    memory.delete(key)
    await saver.delete(key)
  }

  return { get, set, delete: remove }
}
