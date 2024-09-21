import { ipcMain } from "electron";
import { NexusSaver } from "@arffornia/nexus_saver";

const saver = new NexusSaver('./.Arffornia_V.5.2');

export function registerNexusSaverHandlers() {
  ipcMain.handle('saver-save', (event, key, value) => {
    return saver.save(key, value);
  });

  ipcMain.handle('saver-load', (event, key) => {
    return saver.load(key);
  });
}
