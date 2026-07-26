import { defineStore } from 'pinia'
import { modrinthApi } from '../js/modrinthApi'
import { useUserStore } from './userStore'
import { useNotificationStore } from './notificationStore'

const getLocalizedValue = (field, lang = 'fr') => {
  if (!field) return ''
  if (typeof field === 'string') return field
  return field[lang] || field['en'] || field['fr'] || ''
}

export const useShaderStore = defineStore('shader', {
  state: () => ({
    installedShaders: [],
    installedMetadata: {},
    activeShader: 'OFF',
    featuredShaders: [],
    catalogShaders: [],
    isSearching: false,
    isLoadingFeatured: false,
    downloadProgress: {},
    downloadingProjectIds: [],
    availableUpdates: {}, // { [oldFileName]: { downloadUrl, newFileName, project } }

    catalogPage: 1,
    catalogTotalHits: 0,
    catalogPageSize: 20,
    catalogSort: 'downloads'
  }),

  getters: {
    totalPages: (state) => Math.ceil(state.catalogTotalHits / state.catalogPageSize) || 1
  },

  actions: {
    async init() {
      window.api.onShaderDownloadProgress(({ fileName, progress }) => {
        this.downloadProgress[fileName] = progress
        if (progress >= 1) {
          setTimeout(() => {
            delete this.downloadProgress[fileName]
          }, 1000)
        }
      })

      await this.refreshLocalState()
      this.checkShaderUpdates()
    },

    async refreshLocalState() {
      try {
        this.installedShaders = await window.api.getInstalledShaders()
        this.activeShader = await window.api.getActiveShader()
        this.installedMetadata = (await window.api.getShaderMetadata()) || {}
      } catch (error) {
        window.api.logger('error', `[ShaderStore] Local state refresh failed: ${error.message}`)
      }
    },

    /**
     * Checks Modrinth for newer release files for all installed shaders.
     */
    async checkShaderUpdates() {
      for (const fileName of this.installedShaders) {
        const meta = this.installedMetadata[fileName]
        const projectId = meta?.id || meta?.project_id || meta?.slug

        if (!projectId) continue

        try {
          const latest = await modrinthApi.getLatestReleaseFile(projectId)
          if (latest.fileName && latest.fileName !== fileName) {
            this.availableUpdates[fileName] = {
              downloadUrl: latest.downloadUrl,
              newFileName: latest.fileName,
              project: meta
            }
          }
        } catch (err) {
          // Ignore individual check errors quietly
        }
      }
    },

    async loadFeaturedShaders() {
      this.isLoadingFeatured = true
      const userStore = useUserStore()
      const lang = userStore.selectedLang || 'fr'

      try {
        const featuredConfig = await modrinthApi.fetchFeaturedConfig()
        if (featuredConfig.length === 0) {
          this.featuredShaders = []
          return
        }

        const projectIds = featuredConfig.map((item) => item.modrinthId)
        const projects = await modrinthApi.fetchProjectsBatch(projectIds)

        this.featuredShaders = projects.map((project) => {
          const config = featuredConfig.find(
            (c) =>
              c.modrinthId.toLowerCase() === project.id.toLowerCase() ||
              c.modrinthId.toLowerCase() === project.slug.toLowerCase()
          )
          return {
            ...project,
            badge: getLocalizedValue(config?.badge, lang) || 'Featured',
            customDescription: getLocalizedValue(config?.customDescription, lang) || project.description
          }
        })
      } catch (error) {
        window.api.logger('error', `[ShaderStore] Failed to load featured shaders: ${error.message}`)
      } finally {
        this.isLoadingFeatured = false
      }
    },

    async searchCatalog(query = '', page = 1, sortIndex = this.catalogSort) {
      this.isSearching = true
      this.catalogPage = page
      this.catalogSort = sortIndex
      const offset = (page - 1) * this.catalogPageSize

      try {
        const results = await modrinthApi.searchShaders(query, offset, this.catalogPageSize, sortIndex)
        this.catalogShaders = results.hits || []
        this.catalogTotalHits = results.total_hits || 0
      } catch (error) {
        window.api.logger('error', `[ShaderStore] Catalog search error: ${error.message}`)
      } finally {
        this.isSearching = false
      }
    },

    async resolveShaderMetadata(fileName) {
      if (this.installedMetadata[fileName]?.title) {
        return this.installedMetadata[fileName]
      }

      const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const normFile = normalize(fileName)

      let match =
        this.featuredShaders.find(
          (p) => normFile.includes(normalize(p.slug)) || normFile.includes(normalize(p.title))
        ) ||
        this.catalogShaders.find(
          (p) => normFile.includes(normalize(p.slug)) || normFile.includes(normalize(p.title))
        )

      if (match) {
        const plainMatch = JSON.parse(JSON.stringify(match))
        this.installedMetadata[fileName] = plainMatch
        await window.api.saveShaderMetadata(fileName, plainMatch)
        return plainMatch
      }

      try {
        let cleanName = fileName.replace(/\.zip$/i, '').replace(/[-_]/g, ' ')
        const searchRes = await modrinthApi.searchShaders(cleanName, 0, 1)

        if (searchRes.hits && searchRes.hits.length > 0) {
          const resolvedHit = searchRes.hits[0]
          const fullDetails = await modrinthApi.getProjectDetails(resolvedHit.project_id)

          const plainDetails = JSON.parse(JSON.stringify(fullDetails))
          this.installedMetadata[fileName] = plainDetails
          await window.api.saveShaderMetadata(fileName, plainDetails)
          return plainDetails
        }
      } catch (err) {
        console.warn(`[ShaderStore] Could not resolve Modrinth metadata for ${fileName}:`, err)
      }

      return null
    },

    async installShader(project) {
      const notificationStore = useNotificationStore()
      const projectId = typeof project === 'string' ? project : project.project_id || project.id || project.slug

      if (this.downloadingProjectIds.includes(projectId)) return
      this.downloadingProjectIds.push(projectId)

      try {
        const { downloadUrl, fileName } = await modrinthApi.getLatestReleaseFile(projectId)

        this.downloadProgress[fileName] = 0.01
        await window.api.downloadShader(downloadUrl, fileName)

        let metadata = typeof project === 'object' ? project : null
        if (!metadata || !metadata.description) {
          metadata = await modrinthApi.getProjectDetails(projectId)
        }

        const plainMetadata = JSON.parse(JSON.stringify(metadata))
        await window.api.saveShaderMetadata(fileName, plainMetadata)
        await this.refreshLocalState()

        notificationStore.addNotification(`Shader installed successfully!`, 'update')
      } catch (error) {
        notificationStore.addNotification(`Failed to install shader: ${error.message}`, 'error')
        window.api.logger('error', `[ShaderStore] Installation failed for ${projectId}: ${error.message}`)
      } finally {
        this.downloadingProjectIds = this.downloadingProjectIds.filter((id) => id !== projectId)
      }
    },

    /**
     * Updates an installed shader to its latest release and cleans up the old zip file.
     * @param {string} oldFileName
     */
    async updateShader(oldFileName) {
      const update = this.availableUpdates[oldFileName]
      if (!update) return

      const notificationStore = useNotificationStore()
      const wasActive = this.activeShader === oldFileName

      try {
        this.downloadProgress[update.newFileName] = 0.01
        await window.api.downloadShader(update.downloadUrl, update.newFileName)

        // Transfer metadata to new filename and save
        const plainMetadata = JSON.parse(JSON.stringify(update.project))
        await window.api.saveShaderMetadata(update.newFileName, plainMetadata)

        // Delete old shader zip file
        await window.api.deleteShader(oldFileName)
        delete this.availableUpdates[oldFileName]

        // Re-activate new file if old one was active
        if (wasActive) {
          await this.setActiveShader(update.newFileName)
        }

        await this.refreshLocalState()
        notificationStore.addNotification(`Shader updated to ${update.newFileName}!`, 'update')
      } catch (err) {
        notificationStore.addNotification(`Failed to update shader: ${err.message}`, 'error')
      }
    },

    async setActiveShader(fileName) {
      const notificationStore = useNotificationStore()
      try {
        await window.api.setActiveShader(fileName)
        this.activeShader = fileName

        if (fileName === 'OFF') {
          notificationStore.addNotification('Shaders disabled.', 'msg')
        } else {
          notificationStore.addNotification(`Shader activated!`, 'msg')
        }
      } catch (error) {
        notificationStore.addNotification(`Failed to change active shader.`, 'error')
      }
    },

    async deleteShader(fileName) {
      const notificationStore = useNotificationStore()
      try {
        const success = await window.api.deleteShader(fileName)
        if (success) {
          delete this.availableUpdates[fileName]
          await this.refreshLocalState()
          notificationStore.addNotification(`Shader uninstalled.`, 'msg')
        }
      } catch (error) {
        notificationStore.addNotification(`Failed to delete shader.`, 'error')
      }
    }
  }
})
