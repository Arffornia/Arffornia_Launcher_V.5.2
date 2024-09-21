import { ipcMain } from "electron";

import { launchMC } from "../minecraftManager";

export function registerGameManagerHandlers() {

  // Launch the MS COnnexion window, then launch the game
  ipcMain.handle('launch-mc', async () => {
    await launchMC();
  });
}