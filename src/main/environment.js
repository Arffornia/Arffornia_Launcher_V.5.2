import fs from 'fs'
import path from 'path'
import { resolveDataDir } from './dataDir'
import { buildChannel, resolveEnvironment } from '../shared/channel'

/**
 * The beta's chosen environment lives next to the per-environment game folders, not in the
 * settings file: that file sits inside the game folder, which depends on the environment.
 */
export function environmentFile(root) {
  return root ? path.join(root, 'beta', 'environment.json') : resolveDataDir(path.join('beta', 'environment.json'))
}

/** The saved environment, or production when missing, unreadable, unknown or not a beta. */
export function readEnvironment({ file = environmentFile(), channel = buildChannel(), fsImpl = fs } = {}) {
  try {
    const { id } = JSON.parse(fsImpl.readFileSync(file, 'utf8'))
    return resolveEnvironment(id, channel)
  } catch {
    return resolveEnvironment(undefined, channel)
  }
}

/** @returns {string} the environment actually stored */
export function writeEnvironment(id, { file = environmentFile(), channel = buildChannel(), fsImpl = fs } = {}) {
  const resolved = resolveEnvironment(id, channel)
  if (resolved !== id) throw new Error(`Unknown or disabled environment: ${String(id)}`)
  fsImpl.mkdirSync(path.dirname(file), { recursive: true })
  fsImpl.writeFileSync(file, JSON.stringify({ id: resolved }))
  return resolved
}
