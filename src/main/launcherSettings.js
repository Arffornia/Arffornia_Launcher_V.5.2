
import { resolveDataDir } from './dataDir';
import { dataDirs } from '../shared/channel';
import { ARFFORNIA_API_ENDPOINT, JSON_EXTERNAL_FILES_URL, JSON_MOD_LIST_URL } from '../shared/endpoints';

// Prod: ./.Arffornia_V.5.2 and ./java. Beta: ./.Arffornia_beta/<env> and ./.Arffornia_beta/java.
const dirs = dataDirs();

export const launcherSettings = {
  GAME_NAME: "Arffornia",
  GAME_DIR: resolveDataDir(dirs.gameDir),
  JAVA_DIR: resolveDataDir(dirs.javaDir),
  ARFFORNIA_API_ENDPOINT,

  CUSTOM_SAVER_FILE_NAME: "",

  JAVA_VERSION: "21",

  GAME_VERSION: "1.21.1",
  GAME_VERSION_TYPE: "release",

  MOD_LOADER_VERSION: "21.1.172",
  JSON_MOD_LIST_URL,
  JSON_EXTERNAL_FILES_URL,
};
