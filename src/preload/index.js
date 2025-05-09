import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { app } from 'electron'

// Custom APIs for renderer
const api = {
  // User Manager handler:
  isAuth: () => ipcRenderer.invoke('is-auth'),
  getUserName: () => ipcRenderer.invoke('get-user-name'),
  setLang: (lang) => ipcRenderer.invoke('set-lang', lang),
  getSystemLang: () => ipcRenderer.invoke('get-system-lang'),

  // Game Manager handlers:
  launchMC: () => ipcRenderer.invoke('launch-mc'),
  getIsGameRunning: () => ipcRenderer.invoke('is-game-running'),
  loginMS: () => ipcRenderer.invoke('login-ms'),
  loginMSNoReAsk: () => ipcRenderer.invoke('login-ms-no-re-ask'),
  logoutMS: () => ipcRenderer.invoke('logout-ms'),

  //Other handlers:
  getTotalRAM: () => ipcRenderer.invoke('get-total-ram'),
  openLocalGameFile: () => ipcRenderer.invoke('open-local-game-file'),

  // Nexus Savers
  saverSave: (key, value) => ipcRenderer.invoke('saver-save', key, value),
  saverLoad: (key) => ipcRenderer.invoke('saver-load', key),

  openDiscord: () => ipcRenderer.invoke('open-discord'),
  openWebsite: (url) => ipcRenderer.invoke('open-website', url),

  addNotification: (callback) => ipcRenderer.on('add-notification', (event, message, type) => callback(message, type)),

  // Logger
  logger: (logLevel, message) => ipcRenderer.invoke('logger', logLevel, message),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
     window.api.logger("error", `Failed in preload script: ${error}`);
  }
} else {
  window.electron = electronAPI
  window.api = api
}
