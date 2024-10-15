import { saver, saverKeys } from './ipcHandlers/nexusSaverHandler';

import { Auth } from 'msmc';

export async function launchMSAuth()
{
  // Init vars:
  const authManager = new Auth('select_account');
  var xboxManager = null;

  // Try to connect using refresh token
  const refreshToken = await saver.load(saverKeys.REFRESH_TOKEN);

  if (refreshToken != null && refreshToken != "") {
    // Auth from the refresh token
    xboxManager = await authManager.refresh(refreshToken);
  } else {
    // Auth from MS credentials
    xboxManager = await authManager.launch('electron');
  }

  // Save the new refresh token:
  saver.save(saverKeys, xboxManager.save());

  // Get token for mc auth
  const token = await xboxManager.getMinecraft();

  return token.mclc;
}
