import { app } from "electron";
import { handle } from "../ipc";

import currentUser from "../user";

const SUPPORTED_LANGS = ["en", "fr"];

export function registerUserManagerHandlers() {

  handle('is-auth', () => {
    return currentUser.getIsAuth();
  });

  handle('get-user-name', () => {
    return currentUser.getName();
  });

  // The first argument of an ipcMain handler is always the IPC event.
  handle('set-lang', (_event, lang) => {
    if (!SUPPORTED_LANGS.includes(lang)) {
      throw new Error(`Unsupported language: ${String(lang).slice(0, 20)}`);
    }
    currentUser.setLang(lang);
  });

  handle('get-system-lang', () => {
    return app.getLocale();
  });
}
