// Imported first by src/main/index.js, before the logger and Nexus_Saver open files in GAME_DIR.
import path from 'path'
import { app } from 'electron'
import { legacyLocations, migrateLegacyDir } from './dataDir'
import { legacyDataDirs } from '../shared/channel'
import { launcherSettings } from './launcherSettings'

export const dataDirMigrations = []

const legacy = legacyDataDirs(undefined, launcherSettings.ENVIRONMENT.id)
const exeDir = path.dirname(app.getPath('exe'))
const pairs = [
  [launcherSettings.GAME_DIR, legacy.gameDir],
  [launcherSettings.JAVA_DIR, legacy.javaDir]
]
for (const [target, legacyDir] of pairs) {
  if (!legacyDir) continue
  const result = migrateLegacyDir(target, legacyLocations(legacyDir, { exeDir }))
  if (result) dataDirMigrations.push(result)
}
