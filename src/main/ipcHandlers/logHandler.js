import { handle } from "../ipc";
import { logger } from "..";

const LEVELS = ["info", "debug", "warn", "error"];
const MAX_MESSAGE_LENGTH = 10_000;

/**
 * Write a renderer log line with NexusLogger.
 * @param {unknown} logLevel - one of info, debug, warn, error
 * @param {unknown} message
 * @returns {boolean} true if the line was written
 */
export function logFromRenderer(logLevel, message) {
  if (!LEVELS.includes(logLevel)) return false;
  const text = String(message ?? "").slice(0, MAX_MESSAGE_LENGTH);
  logger[logLevel](`[renderer] ${text}`);
  return true;
}

export function registerLoggerHandlers() {
  // The first argument of an ipcMain handler is always the IPC event.
  handle('logger', (_event, logLevel, message) => logFromRenderer(logLevel, message));
}
