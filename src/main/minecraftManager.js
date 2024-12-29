import { Client } from 'minecraft-launcher-core';
import { downloadNeoforge } from './neoforgeDownloader';
import path from 'path';
import { NexusMods } from '@arffornia/nexus_mods'
import { NexusJava, JavaType, JavaVersionInfo } from '@arffornia/nexus_java'

import { launcherSettings } from './launcherSettings';
import { launchMSAuth } from './msAuthManager';
import { getArchType, getOsType } from '../utils';
import { addNotification } from '.';

export async function launchMC() {
  try {
    // Is MS auth ?
    const authToken = launchMSAuth(true);
    if (authToken == null) {
      return;
    }

    // Init vars:
    const launcher = new Client();

    const callback = {
      onStep(step) {
        console.log(step);
      },
    };

    const nexusJava = new NexusJava(
      launcherSettings.JAVA_DIR,
      new JavaVersionInfo(
        "17",
        JavaType.JRE,
        getOsType(),
        getArchType(),
        false
      ),
      callback,
      true);

    if (!nexusJava.isJavaInstalled()) {
      await nexusJava.downloadAndExtract();
    }

    const neoforgeInstallerPath = await downloadNeoforge(
      launcherSettings.GAME_DIR,
      launcherSettings.MOD_LOADER_VERSION,
      false
    );

    let opts = {
      clientPackage: null,
      authorization: authToken,
      root: launcherSettings.GAME_DIR,
      javaPath: nexusJava.getJavaPath(),
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
  } catch (err) {
    console.error("Test try catch error: " + err);
    addNotification("An error occur", "error");
  }
}
