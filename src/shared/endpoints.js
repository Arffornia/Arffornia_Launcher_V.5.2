// Remote endpoints used by both processes. Pure constants: the renderer imports this file, so it
// must never import Node built-ins or src/main/ (Vite replaces Node modules with an empty object
// in the renderer bundle, and a call like os.homedir() at import time blanks the whole page).

// export const ARFFORNIA_API_ENDPOINT = "http://localhost:8000/api/";
export const ARFFORNIA_API_ENDPOINT = 'https://arffornia.com/api/'

export const JSON_MOD_LIST_URL =
  'https://raw.githubusercontent.com/Arffornia/Arffornia_Provisioning/refs/heads/main/config/launcher/modList.json'
export const JSON_EXTERNAL_FILES_URL =
  'https://raw.githubusercontent.com/Arffornia/Arffornia_Provisioning/refs/heads/main/config/launcher/'
