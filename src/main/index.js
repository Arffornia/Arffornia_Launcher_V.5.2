import { app, BrowserWindow } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import prodIcon from '../../resources/img/Crafting_Table.png?asset'
import betaIcon from '../../resources/img/beta/Crafting_Table.png?asset'

import { registerNexusSaverHandlers } from './ipcHandlers/nexusSaverHandler';
import { registerOtherHandlers } from './ipcHandlers/otherHandlers';
import { registerGameManagerHandlers } from './ipcHandlers/gameManagerHandlers';
import { registerUserManagerHandlers } from './ipcHandlers/userManagerHandler';
import { registerUtilsManagerHandlers, openExternalSafe } from './ipcHandlers/utilsManagerHandler';
import { registerShaderManagerHandlers } from './ipcHandlers/shaderManagerHandler';

import { NexusLogger } from '@arffornia/nexus_logger';
import { launcherSettings } from './launcherSettings'
import { registerLoggerHandlers } from './ipcHandlers/logHandler'
import { isAllowedNavigation } from './ipc'
import { appUserModelId, isBeta, updaterOptions } from '../shared/channel'

const icon = isBeta() ? betaIcon : prodIcon

export const logger = new NexusLogger(path.join(launcherSettings.GAME_DIR, "launcher_log.txt"), "ArfforniaLogger");

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

// Prod: null, the embedded app-update.yml (GitHub releases/latest) is used unchanged.
// Beta: the rolling `beta` pre-release only (src/shared/channel.js).
const betaUpdater = updaterOptions();
if (betaUpdater) {
  autoUpdater.setFeedURL(betaUpdater.feed);
  autoUpdater.channel = betaUpdater.channel;
  autoUpdater.allowPrerelease = betaUpdater.allowPrerelease;
  autoUpdater.allowDowngrade = betaUpdater.allowDowngrade;
  autoUpdater.disableDifferentialDownload = betaUpdater.disableDifferentialDownload;
}
const updatesEnabled = betaUpdater ? betaUpdater.enabled : true;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    show: false,
    icon: icon,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false,
      // nodeIntegration: true,
      // contextIsolation: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    openExternalSafe(details.url)
    return { action: 'deny' }
  })

  // The renderer is a single-page app: never navigate the main window away from it.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url, mainWindow.webContents.getURL())) {
      event.preventDefault()
      logger.warn(`Blocked navigation to ${String(url).slice(0, 200)}`)
    }
  })

  if (is.dev && process.env[ 'ELECTRON_RENDERER_URL' ]) {
    mainWindow.loadURL(process.env[ 'ELECTRON_RENDERER_URL' ])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  if (updatesEnabled) {
    autoUpdater.checkForUpdates();
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId(appUserModelId())

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Register handlers:
  registerUserManagerHandlers();
  registerGameManagerHandlers();
  registerNexusSaverHandlers();
  registerOtherHandlers();
  registerUtilsManagerHandlers();
  registerLoggerHandlers();
  registerShaderManagerHandlers();

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Simulate update downloaded
  // setTimeout(() => {
  //   if (mainWindow) {
  //     addNotification("This is a test message", "error");
  //   }
  // }, 3000);
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

autoUpdater.on('update-available', () => {
  logger.info('New launcher version available, downloading in progress...');
});

autoUpdater.on('update-downloaded', (info) => {
  logger.info(`Update downloaded: ${info.version || 'unknown version'}`);
  if (mainWindow) {
    if (info.version) {
      addNotification('notifications.update_downloaded', "update", { version: info.version });
    } else {
      addNotification('notifications.update_downloaded_unknown', "update");
    }
  }
});

/**
 * Shows a notification in the renderer. The main process never sends display text:
 * `messageKey` is a key of src/renderer/src/i18n/locales/*.json, translated by the renderer.
 * @param {string} messageKey e.g. 'notifications.login_failed'
 * @param {'msg' | 'update' | 'error'} type
 * @param {Record<string, string | number>} [params] named interpolation values
 */
export function addNotification(messageKey, type, params = {}) {
  if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('add-notification', messageKey, type, params);
      logger.info(`Add Notification: [${type}] Key: ${messageKey}`);
  }
}

export function getMainWindow() {
  return mainWindow;
}
