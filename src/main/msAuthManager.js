import { secretStore, saverKeys } from './ipcHandlers/nexusSaverHandler';

import { Auth } from 'msmc';
import currentUser from './user';
import { addNotification, logger } from '.';

export async function launchMSAuth(reAsk = false) {
  try {
    // Init vars:
    const authManager = new Auth('select_account');
    var xboxManager = null;

    // Try to connect using refresh token
    const refreshToken = await secretStore.get(saverKeys.REFRESH_TOKEN);

    if (refreshToken != null && refreshToken != "") {
      // Auth from the refresh token
      xboxManager = await authManager.refresh(refreshToken);
    } else if (reAsk == true) {
      // Auth from MS credentials
      xboxManager = await authManager.launch('electron');
    }

    if (xboxManager == null) {
      return null;
    }

    // Save the new refresh token:
    await secretStore.set(saverKeys.REFRESH_TOKEN, xboxManager.save());

    // Get token for mc auth
    const token = await xboxManager.getMinecraft();

    currentUser.setName(token.mclc().name);
    currentUser.setIsAuth(true);

    return token.mclc();
  } catch (err) {
    logger.error(`Error in MS auth: ${err}`);
    addNotification("Failed to login!", "error");
  }
}

export function logoutMSAuth() {
  currentUser.setIsAuth(false);
  secretStore.delete(saverKeys.REFRESH_TOKEN);
}
