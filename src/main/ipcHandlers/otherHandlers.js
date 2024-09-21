import { ipcMain } from "electron";
import os from 'os';
import { shell } from "electron";

export function registerOtherHandlers() {


  // Get the total ram on the computer (rounded to Go)
  ipcMain.handle('get-total-ram', () => {
    return Math.floor(os.totalmem() / 1024 / 1024 / 1024);
  });

  ipcMain.handle('open-local-game-file', () => {
    shell.openPath('./.Arffornia_V.5.2');
  });
}
