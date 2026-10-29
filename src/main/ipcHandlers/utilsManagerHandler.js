import { shell } from "electron";
import { handle } from "../ipc";
import { isAllowedExternalUrl } from "../ipcValidation";
import { logger } from "..";

const DISCORD_URL = "https://discord.gg/CWH6w67";

/**
 * Open a URL in the system browser if it is on the allow-list.
 * @param {unknown} url
 * @returns {Promise<boolean>} true if the URL was opened
 */
export async function openExternalSafe(url) {
  if (!isAllowedExternalUrl(url)) {
    logger.warn(`Refused to open external URL: ${String(url).slice(0, 200)}`);
    return false;
  }
  await shell.openExternal(url);
  return true;
}

export function registerUtilsManagerHandlers() {
  // Open the community Discord in the default browser
  handle('open-discord', () => openExternalSafe(DISCORD_URL));

  handle('open-website', (event, url) => openExternalSafe(url));
}
