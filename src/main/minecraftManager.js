import { Client } from 'minecraft-launcher-core';
import { downloadNeoforge } from './neoforgeDownloader';
import { NexusMods } from '@arffornia/nexus_mods'
import { NexusJava, JavaType, JavaVersionInfo } from '@arffornia/nexus_java'

import { launcherSettings } from './launcherSettings';
import { launchMSAuth } from './msAuthManager';
import { getArchType, getOsType } from './utils';
import { addNotification, logger, getMainWindow } from '.';
import { handle } from "./ipc";
import { createRedactor, authorizationSecrets } from './redact';
import { computeMemoryOptions } from './memory';
import { saver } from './ipcHandlers/nexusSaverHandler';
import os from 'os';

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

export function registerGameStateHandlers() {
  handle('is-game-running', () => {
    return isGameRunning;
  });
}

export async function launchMC() {
  if (isGameRunning) {
    addNotification("The game is already running!", "error");
    return;
  }

  progressManager.reset();
  updateGameState(true);

  try {
    const authToken = await launchMSAuth(true);
    if (!authToken) {
      logger.warn("Launch aborted: Microsoft authentication failed or was cancelled.");
      resetLaunchState();
      return;
    }

    const launcher = new Client();

    const nexusJava = new NexusJava(
      launcherSettings.JAVA_DIR,
      new JavaVersionInfo(
        launcherSettings.JAVA_VERSION,
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
      memory: computeMemoryOptions(
        await saver.load('allocatedRam'),
        os.totalmem() / 1024 / 1024 / 1024
      ),
      overrides: {
        detached: true,
      }
    };

    const nexusMods = new NexusMods(launcherSettings.GAME_DIR, handleNexusModsCallback);

    progressManager.updateStep(StepName.FETCHING_MODS, 0.1);
    await nexusMods.loadModsFromJsonUrl(launcherSettings.JSON_MOD_LIST_URL);
    await nexusMods.loadExternalFilesFromJsonUrl(launcherSettings.JSON_EXTERNAL_FILES_URL);
    progressManager.updateStep(StepName.FETCHING_MODS, 1);

    await nexusMods.updateMods(true, true);

    logger.info(
      `Starting Minecraft ${opts.version.number} (forge installer: ${opts.forge}, ` +
      `memory: ${opts.memory.min}-${opts.memory.max})`
    );

    const redact = createRedactor(authorizationSecrets(authToken));
    launcher.on('debug', (e) => logger.debug(redact(e)));
    launcher.on('data', (e) => logger.info(redact(e)));

    launcher.on('progress', (e) => {
      handleMCLCEvent(e);
    });

    launcher.on('close', () => {
      updateGameState(false);
      logger.info("Game closed.");
    });

    // MCLC resolves null (often without a 'close' event) when it cannot start the game.
    const gameProcess = await launcher.launch(opts);
    if (!gameProcess) {
      logger.error("LaunchMC error: Minecraft could not be started (see the [MCLC] lines above).");
      addNotification("An error occur", "error");
      resetLaunchState();
    }
  } catch (err) {
    logger.error("LaunchMC error: " + err);
    addNotification("An error occur", "error");
    resetLaunchState();
  }
}

function resetLaunchState() {
  progressManager.reset();
  updateGameState(false);
}
