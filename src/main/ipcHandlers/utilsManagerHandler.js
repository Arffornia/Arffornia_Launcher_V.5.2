import { ipcMain } from "electron";
import { shell } from "electron";

export function registerUtilsManagerHandlers() {

  // Open the community Discord in the default browser
  ipcMain.handle('open-discord', () => {
    shell.openExternal("https://discord.gg/CWH6w67");
  });

  ipcMain.handle('open-website', (event, url) => {
    shell.openExternal(url);
  });
}

