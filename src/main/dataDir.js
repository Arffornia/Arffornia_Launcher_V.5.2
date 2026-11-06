import fs from 'fs'
import os from 'os'
import path from 'path'

/**
 * Per-user root folder for the game, Java and the launcher's own files.
 * - Windows: %LOCALAPPDATA%\Arffornia (Local, not Roaming: the modpack is several GB and must not
 *   follow a roaming profile).
 * - macOS: ~/Library/Application Support/Arffornia
 * - Linux: $XDG_DATA_HOME/arffornia, default ~/.local/share/arffornia
 */
export function dataRoot(platform = process.platform, env = process.env, home = os.homedir()) {
  if (platform === 'win32') {
    return path.win32.join(
      env.LOCALAPPDATA || path.win32.join(home, 'AppData', 'Local'),
      'Arffornia'
    )
  }
  if (platform === 'darwin') {
    return path.posix.join(home, 'Library', 'Application Support', 'Arffornia')
  }
  // The XDG spec says a relative XDG_DATA_HOME is invalid and must be ignored.
  const xdg = env.XDG_DATA_HOME && path.posix.isAbsolute(env.XDG_DATA_HOME) ? env.XDG_DATA_HOME : ''
  return path.posix.join(xdg || path.posix.join(home, '.local', 'share'), 'arffornia')
}

/** @param {string} relativeDir a folder from dataDirs() */
export function resolveDataDir(relativeDir, root = dataRoot()) {
  return path.join(root, relativeDir)
}

/**
 * Where older launchers kept a folder: relative to the process working directory on
 * Windows and Linux (the install dir, the desktop, $HOME, ...), and under the data root on macOS.
 */
export function legacyLocations(
  legacyRelativeDir,
  { platform = process.platform, cwd = process.cwd(), exeDir, root = dataRoot() } = {}
) {
  const candidates = [path.resolve(cwd, legacyRelativeDir)]
  if (exeDir) candidates.push(path.resolve(exeDir, legacyRelativeDir))
  if (platform === 'darwin') candidates.push(path.join(root, legacyRelativeDir))
  return [...new Set(candidates)]
}

/**
 * Moves an older launcher's folder to its standard location, once. Runs before anything opens files in
 * these folders (logger, settings file). A failed move is not fatal: the launcher starts with an
 * empty folder and downloads the game again, the old folder stays where it was.
 * @returns {{ from: string, to: string } | { error: string, from: string, to: string } | null}
 */
export function migrateLegacyDir(target, legacyCandidates, fsImpl = fs) {
  if (fsImpl.existsSync(target)) return null
  const from = legacyCandidates.find((dir) => {
    try {
      return path.resolve(dir) !== path.resolve(target) && fsImpl.statSync(dir).isDirectory()
    } catch {
      return false
    }
  })
  if (!from) return null
  try {
    fsImpl.mkdirSync(path.dirname(target), { recursive: true })
    fsImpl.renameSync(from, target)
    return { from, to: target }
  } catch (err) {
    return { error: String(err && err.message ? err.message : err), from, to: target }
  }
}
