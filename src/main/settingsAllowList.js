// Settings the renderer may read and write through IPC. Everything else in the
// settings file (credentials in particular) stays main-process only.

const SUPPORTED_LANGS = ['en', 'fr']

/** @type {Record<string, (value: unknown) => boolean>} */
export const RENDERER_SETTINGS = Object.freeze({
  lang: (value) => typeof value === 'string' && SUPPORTED_LANGS.includes(value),
  allocatedRam: (value) => {
    const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : value
    return Number.isInteger(n) && n >= 1 && n <= 1024
  }
})

/**
 * @param {unknown} key
 * @returns {boolean}
 */
export function isRendererSettingKey(key) {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(RENDERER_SETTINGS, key)
}

/**
 * @param {unknown} key
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidRendererSetting(key, value) {
  return isRendererSettingKey(key) && RENDERER_SETTINGS[key](value)
}
