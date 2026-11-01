import { contextBridge, ipcRenderer } from 'electron'

/**
 * Subscribe to a main -> renderer event and return an unsubscribe function.
 * The IPC event object is never passed to the renderer.
 * @param {string} channel
 * @param {(...args: unknown[]) => void} callback
 * @returns {() => void}
 */
function subscribe(channel, callback) {
  const listener = (_event, ...args) => callback(...args)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

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
  onGameRunningState: (callback) => subscribe('gameRunningState', callback),
  onGlobalProgress: (callback) => subscribe('globalProgress', callback),
  loginMS: () => ipcRenderer.invoke('login-ms'),
  loginMSNoReAsk: () => ipcRenderer.invoke('login-ms-no-re-ask'),
  logoutMS: () => ipcRenderer.invoke('logout-ms'),

  //Other handlers:
  getTotalRAM: () => ipcRenderer.invoke('get-total-ram'),
  getMaxAllocatableRAM: () => ipcRenderer.invoke('get-max-allocatable-ram'),
  openLocalGameFile: () => ipcRenderer.invoke('open-local-game-file'),

  // Nexus Savers
  saverSave: (key, value) => ipcRenderer.invoke('saver-save', key, value),
  saverLoad: (key) => ipcRenderer.invoke('saver-load', key),

  openDiscord: () => ipcRenderer.invoke('open-discord'),
  openWebsite: (url) => ipcRenderer.invoke('open-website', url),

  addNotification: (callback) => subscribe('add-notification', callback),

  // Shader Management ContextBridge APIs
  getInstalledShaders: () => ipcRenderer.invoke('get-installed-shaders'),
  getActiveShader: () => ipcRenderer.invoke('get-active-shader'),
  setActiveShader: (shaderName) => ipcRenderer.invoke('set-active-shader', shaderName),
  downloadShader: (downloadUrl, fileName) =>
    ipcRenderer.invoke('download-shader', { downloadUrl, fileName }),
  deleteShader: (fileName) => ipcRenderer.invoke('delete-shader', fileName),
  importLocalShader: (sourcePath) => ipcRenderer.invoke('import-local-shader', sourcePath),
  onShaderDownloadProgress: (callback) => subscribe('shader-download-progress', callback),
  openShaderpacksFolder: () => ipcRenderer.invoke('open-shaderpacks-folder'),

  // Metadata cache handlers
  getShaderMetadata: () => ipcRenderer.invoke('get-shader-metadata'),
  saveShaderMetadata: (fileName, metadata) =>
    ipcRenderer.invoke('save-shader-metadata', { fileName, metadata }),

  // Logger
  logger: (logLevel, message) => ipcRenderer.invoke('logger', logLevel, message)
}

// Only the curated `api` object is exposed. The window always runs with
// contextIsolation and sandbox enabled (see src/main/index.js).
try {
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error(`Failed in preload script: ${error}`)
}
