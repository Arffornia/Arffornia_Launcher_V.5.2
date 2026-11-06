import fs from "fs";
import path from "path";
import { safeStorage } from "electron";
import { NexusSaver } from "@arffornia/nexus_saver";
import { handle } from "../ipc";
import { createSecretStore } from "../secretStore";
import { isRendererSettingKey, isValidRendererSetting } from "../settingsAllowList";
import { logger } from "..";

import { launcherSettings } from "../launcherSettings";

export const saverKeys = {
  REFRESH_TOKEN: "refresh-token"
}

export const saver = new NexusSaver(launcherSettings.GAME_DIR);

/** Credentials, encrypted with the OS key store. Main process only. */
// `logger` is read at call time: this module is evaluated before src/main/index.js defines it.
export const secretStore = createSecretStore({
  saver,
  safeStorage,
  logger: { warn: (m) => logger.warn(m), error: (m) => logger.error(m) }
});

export function registerNexusSaverHandlers() {
  // The settings file holds the (encrypted) session: owner-only. NexusSaver rewrites the file in
  // place, so the mode set here is kept.
  try {
    if (process.platform !== "win32") fs.chmodSync(path.join(launcherSettings.GAME_DIR, "launcherOptions.json"), 0o600);
  } catch (err) {
    logger.warn(`Could not restrict the settings file permissions: ${err.message}`);
  }

  handle('saver-save', (event, key, value) => {
    if (!isValidRendererSetting(key, value)) {
      throw new Error(`Setting not allowed: ${String(key).slice(0, 50)}`);
    }
    return saver.save(key, value);
  });

  handle('saver-load', (event, key) => {
    if (!isRendererSettingKey(key)) {
      throw new Error(`Setting not allowed: ${String(key).slice(0, 50)}`);
    }
    return saver.load(key);
  });
}
