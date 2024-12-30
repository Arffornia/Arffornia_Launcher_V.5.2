import { ipcMain } from "electron";
import { logger } from "..";

export function registerLoggerHandlers() {
  ipcMain.handle('logger', (logLevel, message) => {
    switch (logLevel) {
      case "info":
        logger.info(message);
        break;
      case "debug":
        logger.debug(message);
        break;

      case "warn":
        logger.warn(message);
        break;

      case "error":
        logger.error(message);
        break;

      default:
        break;
    }
  });
}
