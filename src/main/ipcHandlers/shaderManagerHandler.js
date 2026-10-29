import { shell } from 'electron'
import { handle } from '../ipc'
import { shaderManager } from '../shaderManager'
import {
  assertActiveShaderName,
  assertPlainObject,
  assertShaderDownloadUrl,
  assertShaderFileName,
  assertShaderMetadata
} from '../ipcValidation'

export function registerShaderManagerHandlers() {
  handle('get-installed-shaders', () => shaderManager.getInstalledShaders())
  handle('get-active-shader', () => shaderManager.getActiveShader())
  handle('set-active-shader', (_event, shaderName) =>
    shaderManager.setActiveShader(assertActiveShaderName(shaderName))
  )

  handle('get-shader-metadata', () => shaderManager.getShaderMetadata())
  handle('save-shader-metadata', (_event, payload) => {
    const { fileName, metadata } = assertPlainObject(payload)
    return shaderManager.saveShaderMetadata(
      assertShaderFileName(fileName),
      assertShaderMetadata(metadata)
    )
  })

  handle('download-shader', async (event, payload) => {
    const { downloadUrl, fileName } = assertPlainObject(payload)
    const safeUrl = assertShaderDownloadUrl(downloadUrl)
    const safeName = assertShaderFileName(fileName, { requireZip: true })
    return await shaderManager.downloadShader(safeUrl, safeName, (progress) => {
      event.sender.send('shader-download-progress', { fileName: safeName, progress })
    })
  })

  handle('delete-shader', (_event, fileName) =>
    shaderManager.deleteShader(assertShaderFileName(fileName))
  )

  /**
   * Opens the shaderpacks directory in System File Explorer / Finder.
   */
  handle('open-shaderpacks-folder', () => {
    return shell.openPath(shaderManager.shaderpacksDir)
  })
}
