import { safeStorage } from "electron";
import { NexusSaver } from "@arffornia/nexus_saver";
import { handle } from "../ipc";
import { createSecretStore } from "../secretStore";
import { isRendererSettingKey, isValidRendererSetting } from "../settingsAllowList";
import { logger } from "..";

export const saverKeys = {
  REFRESH_TOKEN: "refresh-token"
}

export const saver = new NexusSaver('./.Arffornia_V.5.2');

/** Credentials, encrypted with the OS key store. Main process only. */
export const secretStore = createSecretStore({ saver, safeStorage, logger });

export function registerNexusSaverHandlers() {
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
