import { ipcMain } from "electron";
import os from 'os';

export function registerOtherHandlers() {


  // Get the total ram on the computer (rounded to Go)
  ipcMain.handle('get-total-ram', () => {
    return Math.floor(os.totalmem() / 1024 / 1024 / 1024);
  });
}
