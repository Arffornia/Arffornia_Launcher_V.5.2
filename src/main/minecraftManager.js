import { Client } from 'minecraft-launcher-core';
import { Auth } from 'msmc';
import { downloadNeoforge } from './neoforgeDownloader';
import path from 'path';
import { NexusMods } from '@arffornia/nexus_mods'

import { saver, saverKeys } from './ipcHandlers/nexusSaverHandler';
import { launcherSettings } from './launcherSettings';

export async function launchMC() {
  const refreshToken = await saver.load(saverKeys.REFRESH_TOKEN);

  const authManager = new Auth('select_account');
  const launcher = new Client();
  var xboxManager = null;

  if (refreshToken != null && refreshToken != "") {
    // Auth from the refresh token
    xboxManager = await authManager.refresh(refreshToken);
  } else {
    // Auth from MS credentials
    xboxManager = await authManager.launch('electron');
  }

  // Save the new refresh token:
  saver.save(saverKeys, xboxManager.save());

  const token = await xboxManager.getMinecraft();
  const neoforgeInstallerPath = await downloadNeoforge(
    launcherSettings.GAME_DIR,
    launcherSettings.MOD_LOADER_VERSION,
    false
  );

  // console.log('NeoForge installer path:', neoforgeInstallerPath);

  let opts = {
    clientPackage: null,
    authorization: token.mclc(),
    root: launcherSettings.GAME_DIR,
    version: {
      number: launcherSettings.GAME_VERSION,
      type: launcherSettings.GAME_VERSION_TYPE,
    },
    forge: neoforgeInstallerPath,
    memory: {
      max: '8G',
      min: '3G',
    },
    overrides: {
      detached: false,
    }
  };

  const modDir = path.join(launcherSettings.GAME_DIR, "mods");
  const nexusMods = new NexusMods(modDir);

  await nexusMods.loadModsFromJsonUrl(launcherSettings.JSON_MOD_LIST_URL);

  await nexusMods.updateMods(true, true);

  console.log('Starting Minecraft with options:', opts);
  launcher.launch(opts);

  launcher.on('debug', (e) => console.log(e));
  launcher.on('data', (e) => console.log(e));
}
