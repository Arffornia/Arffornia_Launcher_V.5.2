import { saver, saverKeys } from './ipcHandlers/nexusSaverHandler';

import { Auth } from 'msmc';

export async function launchMSAuth(reAsk = false) {
  // Init vars:
  const authManager = new Auth('select_account');
  var xboxManager = null;

  // Try to connect using refresh token
  const refreshToken = await saver.load(saverKeys.REFRESH_TOKEN);

  if (refreshToken != null && refreshToken != "") {
    // Auth from the refresh token
    xboxManager = await authManager.refresh(refreshToken);
  } else if(reAsk == true) {
    // Auth from MS credentials
    xboxManager = await authManager.launch('electron');
  }

  if (xboxManager == null)
  {
    return null;
  }

  // Save the new refresh token:
  saver.save(saverKeys.REFRESH_TOKEN, xboxManager.save());

  // Get token for mc auth
  const token = await xboxManager.getMinecraft();

  console.log("token name: " + token.mclc().name);

  return token.mclc();
}
