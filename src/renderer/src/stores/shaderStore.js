import { defineStore } from 'pinia'
import { modrinthApi } from '../js/modrinthApi'
import { useUserStore } from './userStore'

/**
 * Resolves localized strings or fallback values based on selected language.
 */
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

    catalogPage: 1,
    catalogTotalHits: 0,
    catalogPageSize: 20
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

    async searchCatalog(query = '', page = 1) {
      this.isSearching = true
      this.catalogPage = page
      const offset = (page - 1) * this.catalogPageSize

      try {
        const results = await modrinthApi.searchShaders(query, offset, this.catalogPageSize)
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
        this.installedMetadata[fileName] = match
        await window.api.saveShaderMetadata(fileName, match)
        return match
      }

      try {
        let cleanName = fileName.replace(/\.zip$/i, '').replace(/[-_]/g, ' ')
        const searchRes = await modrinthApi.searchShaders(cleanName, 0, 1)

        if (searchRes.hits && searchRes.hits.length > 0) {
          const resolvedHit = searchRes.hits[0]
          const fullDetails = await modrinthApi.getProjectDetails(resolvedHit.project_id)

          this.installedMetadata[fileName] = fullDetails
          await window.api.saveShaderMetadata(fileName, fullDetails)
          return fullDetails
        }
      } catch (err) {
        console.warn(`[ShaderStore] Could not resolve Modrinth metadata for ${fileName}:`, err)
      }

      return null
    },

    async installShader(project) {
      const projectId = typeof project === 'string' ? project : project.project_id || project.id
      try {
        const { downloadUrl, fileName } = await modrinthApi.getLatestReleaseFile(projectId)

        this.downloadProgress[fileName] = 0.01
        await window.api.downloadShader(downloadUrl, fileName)

        let metadata = typeof project === 'object' ? project : null
        if (!metadata || !metadata.description) {
          metadata = await modrinthApi.getProjectDetails(projectId)
        }

        await window.api.saveShaderMetadata(fileName, metadata)
        await this.refreshLocalState()

        window.api.logger('info', `[ShaderStore] Installed shader: ${fileName}`)
      } catch (error) {
        window.api.logger('error', `[ShaderStore] Installation failed for ${projectId}: ${error.message}`)
        throw error
      }
    },

    async setActiveShader(fileName) {
      try {
        await window.api.setActiveShader(fileName)
        this.activeShader = fileName
      } catch (error) {
        window.api.logger('error', `[ShaderStore] Failed to activate ${fileName}: ${error.message}`)
      }
    },

    async deleteShader(fileName) {
      try {
        const success = await window.api.deleteShader(fileName)
        if (success) {
          await this.refreshLocalState()
        }
      } catch (error) {
        window.api.logger('error', `[ShaderStore] Failed to delete ${fileName}: ${error.message}`)
      }
    }
  }
})
