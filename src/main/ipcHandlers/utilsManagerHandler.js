import { ipcMain } from "electron";
import { shell } from "electron";

export function registerUtilsManagerHandlers() {

  // Launch the MS COnnexion window, then launch the game
  ipcMain.handle('open-discord', () => {
    shell.openExternal("https://discord.gg/CWH6w67");
  });

  ipcMain.handle('open-website', () => {
    shell.openExternal("https://arffornia.ddns.net");
  });
}

