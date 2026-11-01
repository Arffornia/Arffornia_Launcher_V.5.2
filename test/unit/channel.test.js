// Spec 016, phase 1: the beta flavour must never leak into the prod launcher, and the beta must
// never update from the stable releases (or the reverse).
import { describe, expect, it } from 'vitest'
import { createRequire } from 'module'
import {
  BETA_APP_ID,
  BETA_FEED_URL,
  ENVIRONMENTS,
  appUserModelId,
  buildChannel,
  buildVersion,
  dataDirs,
  isBeta,
  updaterOptions
} from '../../src/shared/channel'

const require = createRequire(import.meta.url)
const pkg = require('../../package.json')
const betaConfig = require('../../electron-builder.beta.cjs')

describe('prod build (no ARFFORNIA_CHANNEL)', () => {
  it('compiles as prod when the constant is absent', () => {
    expect(buildChannel()).toBe('')
    expect(isBeta()).toBe(false)
  })

  it('leaves the updater alone: no channel, no allowPrerelease, no feed override', () => {
    expect(updaterOptions('')).toBeNull()
  })

  it('keeps the historical data folders and app user model id', () => {
    expect(dataDirs('')).toEqual({ gameDir: './.Arffornia_V.5.2', javaDir: './java' })
    expect(appUserModelId('')).toBe('com.electron')
  })

  it('publishes stable GitHub releases only (package.json build is the live config)', () => {
    expect(pkg.build.publish).toEqual([
      { provider: 'github', owner: 'Arffornia', repo: 'Arffornia_Launcher_V.5.2', releaseType: 'release' }
    ])
    for (const p of pkg.build.publish) {
      expect(p).not.toHaveProperty('channel')
      expect(p).not.toHaveProperty('allowPrerelease')
    }
  })
})

describe('beta build (ARFFORNIA_CHANNEL=beta)', () => {
  it('updates only from the rolling beta pre-release, never through the GitHub provider', () => {
    const u = updaterOptions('beta')
    expect(u.feed).toEqual({ provider: 'generic', url: BETA_FEED_URL, channel: 'beta' })
    expect(u.feed.provider).not.toBe('github')
    expect(u.channel).toBe('beta')
    expect(u.allowDowngrade).toBe(false)
    expect(u.enabled).toBe(true)
    expect(updaterOptions('beta', false).enabled).toBe(false)
  })

  it('keeps its data under .Arffornia_beta/<env>, apart from the prod launcher', () => {
    expect(dataDirs('beta')).toEqual({
      gameDir: './.Arffornia_beta/production',
      javaDir: './.Arffornia_beta/java'
    })
    expect(dataDirs('beta', 'staging').gameDir).toBe('./.Arffornia_beta/staging')
    expect(appUserModelId('beta')).toBe(BETA_APP_ID)
  })

  it('offers Production only until phase 2', () => {
    expect(ENVIRONMENTS.filter((e) => e.enabled).map((e) => e.id)).toEqual(['production'])
  })
})

describe('electron-builder.beta.cjs', () => {
  it('is a separate app that installs next to the prod launcher', () => {
    expect(betaConfig.appId).toBe(BETA_APP_ID)
    expect(betaConfig.productName).toBe('Arffornia Launcher Beta')
    expect(betaConfig.extraMetadata).toEqual({
      name: 'arffornia-launcher-beta',
      productName: 'Arffornia Launcher Beta'
    })
    expect(betaConfig.nsis.shortcutName).toBe('Arffornia Launcher Beta')
  })

  it('never points at the GitHub provider and matches the runtime feed', () => {
    expect(betaConfig.publish).toEqual([{ provider: 'generic', url: BETA_FEED_URL, channel: 'beta' }])
  })

  it('names artifacts without spaces, so the beta*.yml paths match the release assets', () => {
    expect(betaConfig.nsis.artifactName).not.toMatch(/\s/)
    expect(betaConfig.appImage.artifactName).not.toMatch(/\s/)
  })

  it('does not change the prod config it starts from', () => {
    expect(pkg.build.appId).toBeUndefined()
    expect(pkg.productName).toBe('Arffornia Launcher')
  })
})

describe('buildVersion', () => {
  it('is empty without the build constant (unit tests), set by electron-vite otherwise', () => {
    expect(buildVersion()).toBe('')
  })
})
