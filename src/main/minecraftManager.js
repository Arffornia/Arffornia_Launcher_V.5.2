import { Client } from 'minecraft-launcher-core';
import { Auth } from 'msmc';
import { downloadNeoforge } from './neoforgeDownloader';
import path from 'path';
import { NexusMods } from '@arffornia/nexus_mods'

import { saver, saverKeys } from './ipcHandlers/nexusSaverHandler';
import { launcherSettings } from './launcherSettings';

export async function launchMC() {
  // Init vars:
  const launcher = new Client();

  const neoforgeInstallerPath = await downloadNeoforge(
    launcherSettings.GAME_DIR,
    launcherSettings.MOD_LOADER_VERSION,
    false
  );

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
