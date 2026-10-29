import { app } from "electron";
import { handle } from "../ipc";

import currentUser from "../user";

export function registerUserManagerHandlers() {

  handle('is-auth', () => {
    return currentUser.getIsAuth();
  });

  handle('get-user-name', () => {
    return currentUser.getName();
  });

  handle('set-lang', (lang) => {
    currentUser.setLang(lang);
  });

  handle('get-system-lang', () => {
    return app.getLocale();
  });
}
