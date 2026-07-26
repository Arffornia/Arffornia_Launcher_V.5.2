import { ipcMain, shell } from 'electron'
import { shaderManager } from '../shaderManager'

export function registerShaderManagerHandlers() {
  ipcMain.handle('get-installed-shaders', () => shaderManager.getInstalledShaders())
  ipcMain.handle('get-active-shader', () => shaderManager.getActiveShader())
  ipcMain.handle('set-active-shader', (_event, shaderName) => shaderManager.setActiveShader(shaderName))

  ipcMain.handle('get-shader-metadata', () => shaderManager.getShaderMetadata())
  ipcMain.handle('save-shader-metadata', (_event, { fileName, metadata }) =>
    shaderManager.saveShaderMetadata(fileName, metadata)
  )

  ipcMain.handle('download-shader', async (event, { downloadUrl, fileName }) => {
    return await shaderManager.downloadShader(downloadUrl, fileName, (progress) => {
      event.sender.send('shader-download-progress', { fileName, progress })
    })
  })

  ipcMain.handle('delete-shader', (_event, fileName) => shaderManager.deleteShader(fileName))

  /**
   * Opens the shaderpacks directory in System File Explorer / Finder.
   */
  ipcMain.handle('open-shaderpacks-folder', () => {
    return shell.openPath(shaderManager.shaderpacksDir)
  })
}
