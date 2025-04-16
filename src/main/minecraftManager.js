import { Client } from 'minecraft-launcher-core';
import { downloadNeoforge } from './neoforgeDownloader';
import { NexusMods } from '@arffornia/nexus_mods'
import { NexusJava, JavaType, JavaVersionInfo } from '@arffornia/nexus_java'

import { launcherSettings } from './launcherSettings';
import { launchMSAuth } from './msAuthManager';
import { getArchType, getOsType } from './utils';
import { addNotification, logger, getMainWindow } from '.';
import { ipcMain } from "electron";

import { handleJavaCallback, handleNexusModLoaderCallback, handleNexusModsCallback, handleMCLCEvent, progressManager, StepName } from './progressManager';

let isGameRunning = false;

function updateGameState(isRunning) {
  if (isGameRunning === isRunning) return;

  isGameRunning = isRunning;

  const mainWindow = getMainWindow();
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('gameRunningState', {
      isRunning
    });
  }
}

ipcMain.handle('is-game-running', () => {
  return isGameRunning;
});

export async function launchMC() {
  if (isGameRunning) {
    addNotification("The game is already running!", "error");
    return;
  }

  progressManager.reset();
  updateGameState(true);

  try {
    // Is MS auth ?
    const authToken = launchMSAuth(true);
    if (authToken == null) {
      return;
    }

    // Init vars:
    const launcher = new Client();

    const nexusJava = new NexusJava(
      launcherSettings.JAVA_DIR,
      new JavaVersionInfo(
        "17",
        JavaType.JRE,
        getOsType(),
        getArchType(),
        false
      ),
      handleJavaCallback,
      true);

    if (!nexusJava.isJavaInstalled()) {
      await nexusJava.downloadAndExtract();
    }

    const neoforgeInstallerPath = await downloadNeoforge(
      launcherSettings.GAME_DIR,
      launcherSettings.MOD_LOADER_VERSION,
      false,
      handleNexusModLoaderCallback
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
        detached: true,
      }
    };

    const nexusMods = new NexusMods(launcherSettings.GAME_DIR, handleNexusModsCallback);

    await nexusMods.loadModsFromJsonUrl(launcherSettings.JSON_MOD_LIST_URL);

    await nexusMods.updateMods(true, true);

    logger.info('Starting Minecraft with options:', opts);
    launcher.launch(opts);

    launcher.on('debug', (e) => logger.debug(e));
    launcher.on('data', (e) => logger.info(e));

    launcher.on('progress', (e) => {
      handleMCLCEvent(e);
    });

    launcher.on('close', () => {
      updateGameState(false);
      logger.info("Game closed.");
    });
  } catch (err) {
    logger.error("LaunchMC error: " + err);
    addNotification("An error occur", "error");
    updateGameState(false);
  }
}
