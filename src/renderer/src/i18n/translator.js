import { createI18n } from 'vue-i18n'
import fr from './locales/fr.json'
import en from './locales/en.json'

export const SUPPORTED_LOCALES = ['en', 'fr']
export const DEFAULT_LOCALE = 'en'

/**
 * Maps a raw OS/browser locale (e.g. "fr-FR", "en-US") to a supported launcher locale:
 * anything starting with "fr" is French, everything else falls back to English.
 * @param {string | null | undefined} raw
 * @returns {'en' | 'fr'}
 */
export function resolveLocale(raw) {
  return typeof raw === 'string' && raw.toLowerCase().startsWith('fr') ? 'fr' : DEFAULT_LOCALE
}

// The real locale is applied at start-up by userStore.initLang (saved choice, else the OS locale).
const i18n = createI18n({
  legacy: false,
  locale: resolveLocale(typeof navigator !== 'undefined' ? navigator.language : undefined),
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    fr,
    en
  }
})

export default i18n
