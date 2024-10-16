import { ipcMain } from "electron";

import { launchMC } from "../minecraftManager";
import { logoutMSAuth, launchMSAuth } from "../msAuthManager";

export function registerGameManagerHandlers() {

  // Launch the MS COnnexion window, then launch the game
  ipcMain.handle('launch-mc', async () => {
    await launchMC();
  });

  ipcMain.handle('login-ms', async () => {
    return await launchMSAuth(true) != null;
  });

  ipcMain.handle('login-ms-no-re-ask', async () => {
    return await launchMSAuth() != null;
  });

  ipcMain.handle('logout-ms', () => {
    logoutMSAuth();
  });

}
