import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // User Manager handler:
  isAuth: () => ipcRenderer.invoke('is-auth'),
  getUserName: () => ipcRenderer.invoke('get-user-name'),

  // Game Manager handlers:
  launchMC: () => ipcRenderer.invoke('launch-mc'),
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

  onUpdateDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, releaseName) => callback(releaseName)),
  removeUpdateDownloadedListener: () => ipcRenderer.removeAllListeners('update-downloaded'),

  addNotification: (callback) => ipcRenderer.on('add-notification', (event, message, type) => callback(message, type)),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
