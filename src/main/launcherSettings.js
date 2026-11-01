
import { resolveDataDir } from './dataDir';
import { ARFFORNIA_API_ENDPOINT, JSON_EXTERNAL_FILES_URL, JSON_MOD_LIST_URL } from '../shared/endpoints';

export const launcherSettings = {
  GAME_NAME: "Arffornia",
  GAME_DIR: resolveDataDir("./.Arffornia_V.5.2"),
  JAVA_DIR: resolveDataDir("./java"),
  ARFFORNIA_API_ENDPOINT,

  CUSTOM_SAVER_FILE_NAME: "",

  JAVA_VERSION: "21",

  GAME_VERSION: "1.21.1",
  GAME_VERSION_TYPE: "release",

  MOD_LOADER_VERSION: "21.1.172",
  JSON_MOD_LIST_URL,
  JSON_EXTERNAL_FILES_URL,
};
