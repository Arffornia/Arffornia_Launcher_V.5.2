// Text that arrives as data (Provisioning JSON, Arffornia API) rather than from the locale files.
// See the docs decision record "Player-visible text in data and APIs" (ADR 0008):
// - free-form content is a localized object { "en": "...", "fr": "..." };
// - the launcher asks the API for its UI language with Accept-Language.
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './translator'

/**
 * Picks the text for `locale` in a localized object, falling back to English, then to any non-empty
 * value. A plain string is returned as is (older data, or text that is the same in every language).
 * @param {string | Record<string, string> | null | undefined} field
 * @param {string} [locale]
 * @returns {string}
 */
export function localized(field, locale = DEFAULT_LOCALE) {
  if (!field) return ''
  if (typeof field === 'string') return field
  if (typeof field !== 'object') return ''
  const pick = (value) => (typeof value === 'string' && value.trim() !== '' ? value : '')
  return (
    pick(field[locale]) ||
    pick(field[DEFAULT_LOCALE]) ||
    Object.values(field).map(pick).find(Boolean) ||
    ''
  )
}

/**
 * Accept-Language value for a launcher locale: the locale itself when supported, else English.
 * @param {string | null | undefined} locale
 * @returns {string}
 */
export function acceptLanguage(locale) {
  return SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE
}
