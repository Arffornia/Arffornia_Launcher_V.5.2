import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { launcherSettings } from './launcherSettings'
import { logger } from '.'

/**
 * Service managing local shaderpack files, Iris config/iris.properties, and metadata cache.
 */
export class ShaderManager {
  constructor() {
    this.gameDir = path.resolve(launcherSettings.GAME_DIR)
    this.shaderpacksDir = path.join(this.gameDir, 'shaderpacks')
    this.irisConfigDir = path.join(this.gameDir, 'config')
    this.irisConfigPath = path.join(this.irisConfigDir, 'iris.properties')
    this.metadataPath = path.join(this.gameDir, 'shaderMetadata.json')

    this.ensureDirectories()
  }

  /**
   * Resolve a shader file name inside the shaderpacks directory.
   * Throws if the result would escape it.
   * @param {string} fileName
   * @returns {string}
   */
  resolveShaderPath(fileName) {
    if (typeof fileName !== 'string' || fileName.length === 0) {
      throw new Error('Invalid shader file name')
    }
    const targetPath = path.resolve(this.shaderpacksDir, fileName)
    if (path.dirname(targetPath) !== path.resolve(this.shaderpacksDir)) {
      throw new Error('Shader path escapes the shaderpacks directory')
    }
    return targetPath
  }

  ensureDirectories() {
    if (!fs.existsSync(this.gameDir)) {
      fs.mkdirSync(this.gameDir, { recursive: true })
    }
    if (!fs.existsSync(this.shaderpacksDir)) {
      fs.mkdirSync(this.shaderpacksDir, { recursive: true })
    }
    if (!fs.existsSync(this.irisConfigDir)) {
      fs.mkdirSync(this.irisConfigDir, { recursive: true })
    }
  }

  getShaderMetadata() {
    try {
      if (!fs.existsSync(this.metadataPath)) return {}
      const raw = fs.readFileSync(this.metadataPath, 'utf-8')
      return JSON.parse(raw)
    } catch (error) {
      logger.error(`[ShaderManager] Failed to read shaderMetadata.json: ${error.message}`)
      return {}
    }
  }

  saveShaderMetadata(fileName, metadata) {
    try {
      const current = this.getShaderMetadata()
      current[fileName] = { ...current[fileName], ...metadata }
      fs.writeFileSync(this.metadataPath, JSON.stringify(current, null, 2), 'utf-8')
    } catch (error) {
      logger.error(`[ShaderManager] Failed to write shaderMetadata.json: ${error.message}`)
    }
  }

  getInstalledShaders() {
    try {
      this.ensureDirectories()
      const files = fs.readdirSync(this.shaderpacksDir)
      return files.filter(
        (file) =>
          file.endsWith('.zip') ||
          fs.statSync(path.join(this.shaderpacksDir, file)).isDirectory()
      )
    } catch (error) {
      logger.error(`[ShaderManager] Failed to list installed shaders: ${error.message}`)
      return []
    }
  }

  /**
   * Reads active shader from `config/iris.properties`.
   * @returns {string} Filename of active shader or "OFF".
   */
  getActiveShader() {
    try {
      if (!fs.existsSync(this.irisConfigPath)) return 'OFF'

      const content = fs.readFileSync(this.irisConfigPath, 'utf-8')
      const lines = content.split('\n')

      let enableShaders = true
      let shaderPack = ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('#') || !trimmed.includes('=')) continue

        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim()

        if (key.trim() === 'enableShaders') {
          enableShaders = value.toLowerCase() === 'true'
        } else if (key.trim() === 'shaderPack') {
          shaderPack = value
        }
      }

      if (!enableShaders || !shaderPack) return 'OFF'
      return shaderPack
    } catch (error) {
      logger.error(`[ShaderManager] Failed to read iris.properties: ${error.message}`)
      return 'OFF'
    }
  }

  /**
   * Writes target active shader to `config/iris.properties`.
   * @param {string|null} shaderName
   */
  setActiveShader(shaderName) {
    const isOff = !shaderName || shaderName.trim() === '' || shaderName === 'OFF'
    const targetPack = isOff ? '' : shaderName.trim()
    const enableVal = isOff ? 'false' : 'true'

    try {
      this.ensureDirectories()

      let lines = []
      if (fs.existsSync(this.irisConfigPath)) {
        lines = fs.readFileSync(this.irisConfigPath, 'utf-8').split('\n')
      }

      let hasEnable = false
      let hasPack = false

      const newLines = lines.map((line) => {
        const trimmed = line.trim()
        if (trimmed.startsWith('enableShaders=')) {
          hasEnable = true
          return `enableShaders=${enableVal}`
        }
        if (trimmed.startsWith('shaderPack=')) {
          hasPack = true
          return `shaderPack=${targetPack}`
        }
        return line
      })

      if (!hasEnable) newLines.push(`enableShaders=${enableVal}`)
      if (!hasPack) newLines.push(`shaderPack=${targetPack}`)

      fs.writeFileSync(this.irisConfigPath, newLines.join('\n').trim() + '\n', 'utf-8')
      logger.info(`[ShaderManager] Updated iris.properties -> enableShaders=${enableVal}, shaderPack=${targetPack}`)
    } catch (error) {
      logger.error(`[ShaderManager] Failed to write iris.properties: ${error.message}`)
    }
  }

  async downloadShader(downloadUrl, fileName, progressCallback) {
    this.ensureDirectories()
    const targetPath = this.resolveShaderPath(fileName)

    try {
      const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'stream'
      })

      const totalLength = parseInt(response.headers['content-length'] || '0', 10)
      let downloadedBytes = 0

      const writer = fs.createWriteStream(targetPath)

      response.data.on('data', (chunk) => {
        downloadedBytes += chunk.length
        if (totalLength > 0 && typeof progressCallback === 'function') {
          progressCallback(downloadedBytes / totalLength)
        }
      })

      response.data.pipe(writer)

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          logger.info(`[ShaderManager] Download complete: ${fileName}`)
          resolve(targetPath)
        })
        writer.on('error', (err) => {
          fs.unlink(targetPath, () => {})
          reject(err)
        })
      })
    } catch (error) {
      logger.error(`[ShaderManager] Download failed for ${fileName}: ${error.message}`)
      throw error
    }
  }

  deleteShader(fileName) {
    const targetPath = this.resolveShaderPath(fileName)
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true })

      const meta = this.getShaderMetadata()
      delete meta[fileName]
      fs.writeFileSync(this.metadataPath, JSON.stringify(meta, null, 2), 'utf-8')

      if (this.getActiveShader() === fileName) {
        this.setActiveShader('OFF')
      }
      return true
    }
    return false
  }

  importLocalShader(sourcePath) {
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file does not exist: ${sourcePath}`)
    }

    this.ensureDirectories()
    const fileName = path.basename(sourcePath)
    const targetPath = path.join(this.shaderpacksDir, fileName)

    fs.copyFileSync(sourcePath, targetPath)
    logger.info(`[ShaderManager] Imported local shader: ${fileName}`)
    return fileName
  }
}

export const shaderManager = new ShaderManager()
