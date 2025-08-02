import { ipcMain, app } from "electron";
import os from 'os';
import { shell } from "electron";
import { launcherSettings } from "../launcherSettings";
import path from "path";

export function registerOtherHandlers() {
  ipcMain.handle('get-total-ram', () => {
    return Math.floor(os.totalmem() / 1024 / 1024 / 1024);
  });

  ipcMain.handle('open-local-game-file', () => {
    return shell.openPath(path.join(app.getAppPath(), launcherSettings.GAME_DIR));
  });
}
