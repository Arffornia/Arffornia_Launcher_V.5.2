/* global __ARFFORNIA_CHANNEL__, __ARFFORNIA_UPDATES__, __ARFFORNIA_VERSION__ */
// Build flavour of the launcher (spec 016, phase 1).
//
// One build-time constant decides the flavour: ARFFORNIA_CHANNEL, injected by electron-vite
// `define` as __ARFFORNIA_CHANNEL__ (see electron.vite.config.mjs).
//   - unset or ""  -> the prod launcher, exactly as before: GitHub releases/latest, prod folders.
//   - "beta"       -> "Arffornia Launcher Beta": own data folder, updates only from the rolling
//                     `beta` pre-release, environment picker.
// Pure module: imported by main and by the renderer, so no Node built-ins here.

import { ARFFORNIA_API_ENDPOINT, JSON_EXTERNAL_FILES_URL, JSON_MOD_LIST_URL } from './endpoints'

export const BETA = 'beta'

/** Where the beta updater reads beta.yml / beta-linux.yml and the installers. */
export const BETA_FEED_URL =
  'https://github.com/Arffornia/Arffornia_Launcher_V.5.2/releases/download/beta'

export const PROD_APP_USER_MODEL_ID = 'com.electron'
export const BETA_APP_ID = 'fr.arffornia.launcher.beta'

/** The channel compiled into this build ('' for prod). */
export function buildChannel() {
  return typeof __ARFFORNIA_CHANNEL__ === 'string' ? __ARFFORNIA_CHANNEL__ : ''
}

/** False only for builds that must not update themselves (per-PR artifacts). */
export function buildUpdatesEnabled() {
  return typeof __ARFFORNIA_UPDATES__ === 'boolean' ? __ARFFORNIA_UPDATES__ : true
}

/** The launcher version compiled into this build (package.json, or the beta version). */
export function buildVersion() {
  return typeof __ARFFORNIA_VERSION__ === 'string' ? __ARFFORNIA_VERSION__ : ''
}

export function isBeta(channel = buildChannel()) {
  return channel === BETA
}

const STAGING_PACK_URL = 'https://staging.arffornia.com/pack/config/launcher/'

/**
 * Game environments the beta can target (spec 016). Staging and Test slot share the staging website
 * and pack, and the test server; in phase 3 a PR can take the test slot over. `joinOnPlay` starts
 * the game straight on the environment's server: the in-game server list only knows prod.
 */
export const ENVIRONMENTS = [
  {
    id: 'production',
    enabled: true,
    website: 'https://arffornia.com',
    api: ARFFORNIA_API_ENDPOINT,
    modList: JSON_MOD_LIST_URL,
    externalFiles: JSON_EXTERNAL_FILES_URL,
    server: 'arffornia.com:25565',
    joinOnPlay: false
  },
  {
    id: 'staging',
    enabled: true,
    website: 'https://staging.arffornia.com',
    api: 'https://staging.arffornia.com/api/',
    modList: `${STAGING_PACK_URL}modList.json`,
    externalFiles: STAGING_PACK_URL,
    server: 'test.arffornia.com:25566',
    joinOnPlay: true
  },
  {
    id: 'slot',
    enabled: true,
    website: 'https://staging.arffornia.com',
    api: 'https://staging.arffornia.com/api/',
    modList: `${STAGING_PACK_URL}modList.json`,
    externalFiles: STAGING_PACK_URL,
    server: 'test.arffornia.com:25566',
    joinOnPlay: true
  }
]
export const DEFAULT_ENVIRONMENT = 'production'

/** The prod launcher always plays on production; the beta on any enabled environment. */
export function resolveEnvironment(id, channel = buildChannel()) {
  if (!isBeta(channel)) return DEFAULT_ENVIRONMENT
  const env = ENVIRONMENTS.find((e) => e.id === id && e.enabled)
  return env ? env.id : DEFAULT_ENVIRONMENT
}

export function environmentConfig(id) {
  return ENVIRONMENTS.find((e) => e.id === id) || ENVIRONMENTS[0]
}

/**
 * Data folders, relative to the per-user data root (src/main/dataDir.js).
 * The beta keeps everything under beta/, one game folder per environment, so it never touches
 * the prod launcher's game and java folders.
 */
export function dataDirs(channel = buildChannel(), environment = DEFAULT_ENVIRONMENT) {
  if (!isBeta(channel)) {
    return { gameDir: 'game', javaDir: 'java' }
  }
  return { gameDir: `beta/${environment}`, javaDir: 'beta/java' }
}

/**
 * The same folders as older launchers named them, relative to their working directory.
 * The prod Java folder was a bare `java` (on Linux often ~/java): too generic to move safely, so
 * it is null and Java is downloaded again.
 */
export function legacyDataDirs(channel = buildChannel(), environment = DEFAULT_ENVIRONMENT) {
  if (!isBeta(channel)) {
    return { gameDir: '.Arffornia_V.5.2', javaDir: null }
  }
  return { gameDir: `.Arffornia_beta/${environment}`, javaDir: '.Arffornia_beta/java' }
}

/**
 * How electron-updater is configured at start-up.
 * - prod: null. Nothing is changed: the app-update.yml written by electron-builder from
 *   package.json `build.publish` (GitHub provider, releases/latest, no pre-release) is used.
 * - beta: the generic provider on the rolling `beta` pre-release, channel `beta`. Never the
 *   GitHub provider, so a beta can't pick up a stable release's update file, and the stable
 *   launcher can't pick up a beta. Differential download is off: the rolling release keeps
 *   only the newest blockmap.
 */
export function updaterOptions(channel = buildChannel(), updatesEnabled = buildUpdatesEnabled()) {
  if (!isBeta(channel)) return null
  return {
    enabled: updatesEnabled,
    feed: { provider: 'generic', url: BETA_FEED_URL, channel: BETA },
    channel: BETA,
    allowPrerelease: true,
    allowDowngrade: false,
    disableDifferentialDownload: true
  }
}

export function appUserModelId(channel = buildChannel()) {
  return isBeta(channel) ? BETA_APP_ID : PROD_APP_USER_MODEL_ID
}
