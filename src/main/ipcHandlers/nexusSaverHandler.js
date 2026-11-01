import { handle } from "../ipc";
import { NexusSaver } from "@arffornia/nexus_saver";

import { launcherSettings } from "../launcherSettings";

export const saverKeys = {
  REFRESH_TOKEN: "refresh-token"
}

export const saver = new NexusSaver(launcherSettings.GAME_DIR);

export function registerNexusSaverHandlers() {
  handle('saver-save', (event, key, value) => {
    return saver.save(key, value);
  });

  handle('saver-load', (event, key) => {
    return saver.load(key);
  });
}
