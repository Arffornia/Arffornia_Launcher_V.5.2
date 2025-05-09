import { ipcMain, app } from "electron";

import currentUser from "../user";

export function registerUserManagerHandlers() {

  ipcMain.handle('is-auth', () => {
    return currentUser.getIsAuth();
  });

  ipcMain.handle('get-user-name', () => {
    return currentUser.getName();
  });

  ipcMain.handle('set-lang', (lang) => {
    currentUser.setLang(lang);
  });

  ipcMain.handle('get-system-lang', () => {
    return app.getLocale();
  });
}
