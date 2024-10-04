import { ipcMain } from "electron";
import { NexusSaver } from "@arffornia/nexus_saver";

export const saverKeys = {
  REFRESH_TOKEN: "refresh-token",
}

export const saver = new NexusSaver('./.Arffornia_V.5.2');

export function registerNexusSaverHandlers() {
  ipcMain.handle('saver-save', (event, key, value) => {
    return saver.save(key, value);
  });

  ipcMain.handle('saver-load', (event, key) => {
    return saver.load(key);
  });
}
