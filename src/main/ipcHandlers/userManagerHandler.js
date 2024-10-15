import { ipcMain } from "electron";

import currentUser from "../user";

export function registerUserManagerHandlers() {

  ipcMain.handle('is-auth', () => {
    return currentUser.getIsAuth();
  });

  ipcMain.handle('get-user-name', () => {
    return currentUser.getName();
  });
}
