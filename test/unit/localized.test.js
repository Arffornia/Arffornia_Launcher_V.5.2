// Data text (Provisioning JSON, Arffornia API): localized objects and the API locale header.
import { describe, expect, it, vi } from 'vitest'
import { AxiosHeaders } from 'axios'
import featuredShaders from '../fixtures/featuredShaders.json'
import { acceptLanguage, localized } from '../../src/renderer/src/i18n/localized.js'
import i18n from '../../src/renderer/src/i18n/translator.js'
import { withUiLocale } from '../../src/renderer/src/js/arfforniaApi.js'

vi.mock('../../src/main/launcherSettings', () => ({ launcherSettings: { ARFFORNIA_API_ENDPOINT: 'http://api.test/' } }))

describe('localized()', () => {
  const field = { fr: 'Recommandé', en: 'Recommended' }

  it('picks the requested locale', () => {
    expect(localized(field, 'fr')).toBe('Recommandé')
    expect(localized(field, 'en')).toBe('Recommended')
  })

  it('falls back to English, then to any non-empty value', () => {
    expect(localized(field, 'de')).toBe('Recommended')
    expect(localized({ fr: 'Seulement en français', en: '  ' }, 'en')).toBe('Seulement en français')
  })

  it('accepts plain strings and empty values', () => {
    expect(localized('Same everywhere', 'fr')).toBe('Same everywhere')
    expect(localized(null, 'fr')).toBe('')
    expect(localized(undefined)).toBe('')
    expect(localized({}, 'fr')).toBe('')
    expect(localized(42, 'fr')).toBe('')
  })

  it('resolves every featured shader text in both locales', () => {
    for (const entry of featuredShaders.featured) {
      for (const key of ['badge', 'customDescription']) {
        for (const locale of ['en', 'fr']) {
          expect(localized(entry[key], locale), `${entry.modrinthId}.${key}.${locale}`).not.toBe('')
        }
      }
    }
  })
})

describe('API locale', () => {
  it('maps the UI locale to Accept-Language', () => {
    expect(acceptLanguage('fr')).toBe('fr')
    expect(acceptLanguage('en')).toBe('en')
    expect(acceptLanguage('de')).toBe('en')
    expect(acceptLanguage(undefined)).toBe('en')
  })

  it('sends the launcher UI language, not the OS one', () => {
    i18n.global.locale.value = 'fr'
    expect(withUiLocale({ headers: new AxiosHeaders() }).headers.get('Accept-Language')).toBe('fr')
    i18n.global.locale.value = 'en'
    expect(withUiLocale({ headers: new AxiosHeaders() }).headers.get('Accept-Language')).toBe('en')
  })
})
