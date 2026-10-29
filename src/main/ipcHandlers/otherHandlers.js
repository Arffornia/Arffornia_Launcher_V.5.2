import { ipcMain, app, shell } from "electron";
import os from 'os';
import { launcherSettings } from "../launcherSettings";
import path from "path";

export function registerOtherHandlers() {
  ipcMain.handle('get-total-ram', () => {
    return Math.floor(os.totalmem() / 1024 / 1024 / 1024);
  });

  ipcMain.handle('open-local-game-file', () => {
    const launcherRoot = path.dirname(app.getPath("exe"));
    // resolve, not join: GAME_DIR is absolute on macOS
    const gameDir = path.resolve(launcherRoot, launcherSettings.GAME_DIR);
    return shell.openPath(gameDir);
  });
}
