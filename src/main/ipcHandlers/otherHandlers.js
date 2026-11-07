import { app, shell } from "electron";
import { handle } from "../ipc";
import os from 'os';
import { launcherSettings } from "../launcherSettings";
import { maxAllocatableRamGb } from "../memory";
import { writeEnvironment } from "../environment";
import { gameIsRunning } from "../minecraftManager";

export function registerOtherHandlers() {
  handle('get-total-ram', () => {
    return Math.floor(os.totalmem() / 1024 / 1024 / 1024);
  });

  handle('get-max-allocatable-ram', () => {
    return maxAllocatableRamGb(os.totalmem() / 1024 / 1024 / 1024);
  });

  handle('open-local-game-file', () => shell.openPath(launcherSettings.GAME_DIR));

  handle('get-environment', () => ({ ...launcherSettings.ENVIRONMENT }));

  // Folders, endpoints, logger and settings file are bound at start-up: a change restarts the launcher.
  handle('set-environment', (event, id) => {
    if (gameIsRunning()) throw new Error('Cannot change the environment while the game is running');
    if (writeEnvironment(id) === launcherSettings.ENVIRONMENT.id) return;
    app.relaunch();
    app.exit(0);
  });
}
