import { handle } from "../ipc";

import { launchMC, registerGameStateHandlers } from "../minecraftManager";
import { logoutMSAuth, launchMSAuth } from "../msAuthManager";

export function registerGameManagerHandlers() {
  registerGameStateHandlers();

  // Launch the Microsoft login window, then launch the game
  handle('launch-mc', async () => {
    await launchMC();
  });

  handle('login-ms', async () => {
    return await launchMSAuth(true) != null;
  });

  handle('login-ms-no-re-ask', async () => {
    return await launchMSAuth() != null;
  });

  handle('logout-ms', () => {
    logoutMSAuth();
  });

}
