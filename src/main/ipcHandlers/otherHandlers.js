import { app, shell } from "electron";
import { handle } from "../ipc";
import os from 'os';
import { launcherSettings } from "../launcherSettings";
import path from "path";
import { maxAllocatableRamGb } from "../memory";

export function registerOtherHandlers() {
  handle('get-total-ram', () => {
    return Math.floor(os.totalmem() / 1024 / 1024 / 1024);
  });

  handle('get-max-allocatable-ram', () => {
    return maxAllocatableRamGb(os.totalmem() / 1024 / 1024 / 1024);
  });

  handle('open-local-game-file', () => {
    const launcherRoot = path.dirname(app.getPath("exe"));
    // resolve, not join: GAME_DIR is absolute on macOS
    const gameDir = path.resolve(launcherRoot, launcherSettings.GAME_DIR);
    return shell.openPath(gameDir);
  });
}
