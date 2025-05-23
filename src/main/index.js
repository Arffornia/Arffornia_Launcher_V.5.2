import { app, shell, BrowserWindow } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/img/Crafting_Table.png?asset'

import { registerNexusSaverHandlers } from './ipcHandlers/nexusSaverHandler';
import { registerOtherHandlers } from './ipcHandlers/otherHandlers';
import { registerGameManagerHandlers } from './ipcHandlers/gameManagerHandlers';
import { registerUserManagerHandlers } from './ipcHandlers/userManagerHandler';
import { registerUtilsManagerHandlers } from './ipcHandlers/utilsManagerHandler';

import { NexusLogger } from '@arffornia/nexus_logger';
import { launcherSettings } from './launcherSettings'
import { registerLoggerHandlers } from './ipcHandlers/logHandler'

export const logger = new NexusLogger(path.join(launcherSettings.GAME_DIR, "launcher_log.txt"), "ArfforniaLogger");

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

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
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env[ 'ELECTRON_RENDERER_URL' ]) {
    mainWindow.loadURL(process.env[ 'ELECTRON_RENDERER_URL' ])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  autoUpdater.checkForUpdates();
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

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
  const versionInfo = info.version || 'No version available';
  logger.info(`Update downloaded: ${versionInfo}`);
  if (mainWindow) {
    addNotification(`Update downloaded: ${versionInfo} !\n It will be installed at the next start-up.`, "update");
  }
});

export function addNotification(message, type) {
  if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('add-notification', message, type);
      logger.info(`Add Notification: [${type}] Message: ${message}`);
  }
}

export function getMainWindow() {
  return mainWindow;
}
