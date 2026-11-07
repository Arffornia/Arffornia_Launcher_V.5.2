import { resolveDataDir } from './dataDir';
import { dataDirs, environmentConfig } from '../shared/channel';
import { readEnvironment } from './environment';

// Absolute, per-user folders (src/main/dataDir.js). Prod: <root>/game and <root>/java.
// Beta: <root>/beta/<env> and <root>/beta/java.
// Read once at start-up: changing it restarts the launcher (set-environment).
const environment = environmentConfig(readEnvironment());
const dirs = dataDirs(undefined, environment.id);

export const launcherSettings = {
  GAME_NAME: "Arffornia",
  GAME_DIR: resolveDataDir(dirs.gameDir),
  JAVA_DIR: resolveDataDir(dirs.javaDir),
  ENVIRONMENT: environment,
  ARFFORNIA_API_ENDPOINT: environment.api,

  CUSTOM_SAVER_FILE_NAME: "",

  JAVA_VERSION: "21",

  GAME_VERSION: "1.21.1",
  GAME_VERSION_TYPE: "release",

  MOD_LOADER_VERSION: "21.1.172",
  JSON_MOD_LIST_URL: environment.modList,
  JSON_EXTERNAL_FILES_URL: environment.externalFiles,
};
