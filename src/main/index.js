import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/img/Crafting_Table.png?asset'

import { registerNexusSaverHandlers } from './ipcHandlers/nexusSaverHandler';
import { registerOtherHandlers } from './ipcHandlers/otherHandlers';
import { registerGameManagerHandlers } from './ipcHandlers/gameManagerHandlers';
import { registerUserManagerHandlers } from './ipcHandlers/userManagerHandler';
import { registerUtilsManagerHandlers } from './ipcHandlers/utilsManagerHandler';

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

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  // Simulate update downloaded
  // setTimeout(() => {
  //   if (mainWindow) {
  //     mainWindow.webContents.send('update-downloaded');
  //   }
  // }, 3000);
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

autoUpdater.on('update-available', () => {
  console.log('New launcher version available, downloading in progress...');
});

autoUpdater.on('update-downloaded', (info) => {
  const versionInfo = info.version || 'No version available';
  console.log(`Update downloaded: ${versionInfo}`);
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', versionInfo);
  }
});
