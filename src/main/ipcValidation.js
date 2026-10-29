// Pure validation helpers for IPC input. No Electron import here, so they can be unit tested.

/** Hosts the launcher may open in the system browser. */
export const EXTERNAL_HOST_ALLOW_LIST = Object.freeze([
  'arffornia.com',
  'www.arffornia.com',
  'discord.gg',
  'discord.com',
  'modrinth.com',
  'www.modrinth.com'
])

/** Hosts shader downloads may come from (Modrinth CDN). */
export const SHADER_DOWNLOAD_HOSTS = Object.freeze(['cdn.modrinth.com'])

const MAX_FILE_NAME_LENGTH = 255
// Control characters (incl. NUL, CR, LF), path separators and characters Windows forbids.
// eslint-disable-next-line no-control-regex
const FORBIDDEN_FILE_NAME_CHARS = /[\u0000-\u001f\u007f/\\:*?"<>|]/

export class IpcValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'IpcValidationError'
  }
}

function parseUrl(value) {
  if (typeof value !== 'string' || value.length > 2048) return null
  try {
    return new URL(value)
  } catch {
    return null
  }
}

/**
 * True if `name` is a single, plain file or directory name (no path component).
 * @param {unknown} name
 * @returns {boolean}
 */
export function isSafeFileName(name) {
  return (
    typeof name === 'string' &&
    name.length > 0 &&
    name.length <= MAX_FILE_NAME_LENGTH &&
    name === name.trim() &&
    name !== '.' &&
    name !== '..' &&
    !FORBIDDEN_FILE_NAME_CHARS.test(name)
  )
}

/**
 * @param {unknown} name
 * @param {{ requireZip?: boolean }} [options]
 * @returns {string}
 */
export function assertShaderFileName(name, { requireZip = false } = {}) {
  if (!isSafeFileName(name)) {
    throw new IpcValidationError('Invalid shader file name')
  }
  if (requireZip && !name.toLowerCase().endsWith('.zip')) {
    throw new IpcValidationError('Shader file must be a .zip')
  }
  return name
}

/**
 * Shader selection: 'OFF' / empty / null disable shaders, anything else must be a plain file name.
 * @param {unknown} name
 * @returns {string|null}
 */
export function assertActiveShaderName(name) {
  if (name === null || name === undefined || name === '' || name === 'OFF') return name ?? null
  return assertShaderFileName(name)
}

/**
 * @param {unknown} url
 * @returns {string}
 */
export function assertShaderDownloadUrl(url) {
  const parsed = parseUrl(url)
  if (!parsed || parsed.protocol !== 'https:' || !SHADER_DOWNLOAD_HOSTS.includes(parsed.hostname)) {
    throw new IpcValidationError('Shader download URL is not allowed')
  }
  if (parsed.username || parsed.password || (parsed.port && parsed.port !== '443')) {
    throw new IpcValidationError('Shader download URL is not allowed')
  }
  return parsed.toString()
}

/**
 * True if the URL may be opened in the system browser.
 * @param {unknown} url
 * @returns {boolean}
 */
export function isAllowedExternalUrl(url) {
  const parsed = parseUrl(url)
  return (
    !!parsed &&
    parsed.protocol === 'https:' &&
    !parsed.username &&
    !parsed.password &&
    (parsed.port === '' || parsed.port === '443') &&
    EXTERNAL_HOST_ALLOW_LIST.includes(parsed.hostname)
  )
}

/**
 * Shader metadata must be a plain JSON object of reasonable size.
 * @param {unknown} metadata
 * @returns {object}
 */
export function assertShaderMetadata(metadata) {
  if (metadata === null || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new IpcValidationError('Invalid shader metadata')
  }
  let size
  try {
    size = JSON.stringify(metadata).length
  } catch {
    throw new IpcValidationError('Invalid shader metadata')
  }
  if (size > 256 * 1024) {
    throw new IpcValidationError('Shader metadata is too large')
  }
  return metadata
}

/**
 * @param {unknown} payload
 * @returns {Record<string, unknown>}
 */
export function assertPlainObject(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new IpcValidationError('Invalid payload')
  }
  return payload
}

/**
 * True if an IPC message comes from the app's own renderer page.
 * In production the renderer is loaded from a local file; in dev from ELECTRON_RENDERER_URL.
 * @param {string|undefined|null} frameUrl - `event.senderFrame.url`
 * @param {{ devServerUrl?: string, isDev?: boolean }} [options]
 * @returns {boolean}
 */
export function isTrustedSenderUrl(frameUrl, { devServerUrl, isDev = false } = {}) {
  const parsed = parseUrl(frameUrl)
  if (!parsed) return false
  if (parsed.protocol === 'file:') return true
  if (isDev && devServerUrl) {
    const dev = parseUrl(devServerUrl)
    return !!dev && dev.origin === parsed.origin
  }
  return false
}
