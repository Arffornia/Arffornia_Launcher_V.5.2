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

  // Shader Management ContextBridge APIs
  getInstalledShaders: () => ipcRenderer.invoke('get-installed-shaders'),
  getActiveShader: () => ipcRenderer.invoke('get-active-shader'),
  setActiveShader: (shaderName) => ipcRenderer.invoke('set-active-shader', shaderName),
  downloadShader: (downloadUrl, fileName) => ipcRenderer.invoke('download-shader', { downloadUrl, fileName }),
  deleteShader: (fileName) => ipcRenderer.invoke('delete-shader', fileName),
  importLocalShader: (sourcePath) => ipcRenderer.invoke('import-local-shader', sourcePath),
  onShaderDownloadProgress: (callback) =>
    ipcRenderer.on('shader-download-progress', (_event, data) => callback(data)),

  // Metadata cache handlers
  getShaderMetadata: () => ipcRenderer.invoke('get-shader-metadata'),
  saveShaderMetadata: (fileName, metadata) =>
    ipcRenderer.invoke('save-shader-metadata', { fileName, metadata }),

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
