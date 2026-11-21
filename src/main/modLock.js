import axios from 'axios'
import { ModFile, getHashTypeFromStr } from '@arffornia/nexus_mods'

// modList.lock.json (Arffornia_Provisioning, generated in CI) holds the resolved download of every
// CurseForge and Modrinth entry, so a launch makes no call to their APIs (spec 015 O1). Entries
// missing from the lock, and GitHub releases, still go through Nexus_Mods' live lookup.

const LOCK_SCHEMA = 1
const HASH_LENGTH = { sha1: 40, md5: 32 }

export function lockUrlFor(modListUrl) {
  const url = new URL(modListUrl)
  url.pathname = url.pathname.replace(/\.json$/, '.lock.json')
  return url.href
}

function isValidEntry(entry) {
  if (!entry || typeof entry !== 'object') return false
  const { path, url, hashType, hash } = entry
  const fileName = typeof path === 'string' ? path.slice('mods/'.length) : ''
  return (
    typeof path === 'string' &&
    path.startsWith('mods/') &&
    fileName !== '' &&
    fileName !== '.' &&
    fileName !== '..' &&
    !/[\\/]/.test(fileName) &&
    typeof url === 'string' &&
    url.startsWith('https://') &&
    Object.hasOwn(HASH_LENGTH, hashType) &&
    typeof hash === 'string' &&
    new RegExp(`^[0-9a-f]{${HASH_LENGTH[hashType]}}$`).test(hash)
  )
}

/**
 * Split a mod list into entries the lock already resolves and a smaller mod list left for the
 * live lookup. A lock with another schema, or an invalid entry, counts as missing.
 */
export function splitModList(modList, lock) {
  const files =
    lock?.schema === LOCK_SCHEMA && lock.files && typeof lock.files === 'object' ? lock.files : {}
  const locked = []
  const take = (key) => {
    const entry = Object.hasOwn(files, key) ? files[key] : undefined
    if (isValidEntry(entry)) {
      locked.push(entry)
      return true
    }
    return false
  }

  const mods = modList.mods ?? {}
  const remaining = {
    ...modList,
    mods: {
      ...mods,
      curseforge: (mods.curseforge ?? []).filter(
        (m) => !take(`curseforge:${m.projectId}:${m.fileId}`)
      ),
      modrinth: (mods.modrinth ?? []).filter((m) => !take(`modrinth:${m.versionId}`))
    }
  }
  return { locked, remaining }
}

async function fetchJson(url) {
  const response = await axios.get(url, {
    timeout: 30000,
    responseType: 'text',
    transformResponse: (d) => d
  })
  return JSON.parse(response.data)
}

/**
 * Register every mod of `modListUrl` in `nexusMods`, reading resolved entries from the lock and
 * looking up only the rest. Without a usable lock it behaves exactly like `loadModsFromJsonUrl`.
 */
export async function loadModsWithLock(nexusMods, modListUrl, logger = console) {
  let modList
  try {
    modList = await fetchJson(modListUrl)
  } catch {
    // Let Nexus_Mods fetch it again and record the failure the usual way.
    await nexusMods.loadModsFromJsonUrl(modListUrl)
    return { locked: 0, live: null }
  }

  let lock = null
  try {
    lock = await fetchJson(lockUrlFor(modListUrl))
  } catch (error) {
    logger.warn(`No usable mod lock (${error?.message ?? error}); resolving every mod online.`)
  }

  const { locked, remaining } = splitModList(modList, lock)
  for (const entry of locked) {
    nexusMods.addModFile(
      new ModFile(entry.path, entry.hash, getHashTypeFromStr(entry.hashType), entry.url)
    )
  }

  const live =
    remaining.mods.curseforge.length +
    remaining.mods.modrinth.length +
    (remaining.mods['github-releases']?.length ?? 0)
  logger.info(`Mod list: ${locked.length} from the lock, ${live} resolved online.`)

  await nexusMods.loadModsFromJson(JSON.stringify(remaining))
  return { locked: locked.length, live }
}
