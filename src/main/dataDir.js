import os from 'os';
import path from 'path';

// Where the launcher keeps the game, Java and its own files on macOS.
// Apps started from Finder or the Dock run with the working directory "/", which is a read-only
// system volume on macOS, so the historical cwd-relative paths cannot be created there.
export const MACOS_DATA_ROOT = path.join(os.homedir(), 'Library', 'Application Support', 'Arffornia');

/**
 * Resolves a launcher data directory.
 * Windows and Linux keep the historical relative path (resolved against the working directory),
 * so existing installs keep finding their files. macOS uses MACOS_DATA_ROOT instead.
 */
export function resolveDataDir(relativeDir, platform = process.platform, macRoot = MACOS_DATA_ROOT) {
  if (platform !== 'darwin') {
    return relativeDir;
  }
  return path.join(macRoot, relativeDir);
}
