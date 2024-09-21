import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  launchMC: () => ipcRenderer.invoke('launch-mc'),

  //Other handler:
  getTotalRAM: () => ipcRenderer.invoke('get-total-ram'),
  openLocalGameFile: () => ipcRenderer.invoke('open-local-game-file'),

  // Nexus Saver
  saverSave: (key, value) => ipcRenderer.invoke('saver-save', key, value),
  saverLoad: (key) => ipcRenderer.invoke('saver-load', key),
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
