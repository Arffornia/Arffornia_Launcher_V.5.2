import axios from 'axios'
import { JSON_EXTERNAL_FILES_URL } from '../../../shared/endpoints'

const MODRINTH_BASE_URL = 'https://api.modrinth.com/v2'
const FEATURED_SHADERS_URL = `${JSON_EXTERNAL_FILES_URL}featuredShaders.json`

/**
 * Modrinth API and Featured Shaders Data Service.
 */
export const modrinthApi = {
  /**
   * Fetches the curated shader list from the Arffornia Provisioning repository.
   * @returns {Promise<Array<{ modrinthId: string, badge?: string, customDescription?: string }>>}
   */
  async fetchFeaturedConfig() {
    try {
      const response = await axios.get(FEATURED_SHADERS_URL)
      return response.data?.featured || []
    } catch (error) {
      console.warn('[ModrinthAPI] Failed to load featuredShaders.json, falling back to empty list:', error.message)
      return []
    }
  },

  /**
   * Batch fetches project details for a list of Modrinth project IDs or slugs.
   * @param {string[]} projectIds
   * @returns {Promise<Array<Object>>} Modrinth project objects.
   */
  async fetchProjectsBatch(projectIds) {
    if (!projectIds || projectIds.length === 0) return []

    try {
      const formattedIds = JSON.stringify(projectIds)
      const response = await axios.get(`${MODRINTH_BASE_URL}/projects`, {
        params: { ids: formattedIds }
      })
      return response.data
    } catch (error) {
      console.error('[ModrinthAPI] Batch project request failed:', error.message)
      throw error
    }
  },

  /**
   * Fetches full project details including gallery screenshots for a specific project ID/slug.
   * @param {string} projectIdOrSlug
   * @returns {Promise<Object>} Full Modrinth project object.
   */
  async getProjectDetails(projectIdOrSlug) {
    try {
      const response = await axios.get(`${MODRINTH_BASE_URL}/project/${projectIdOrSlug}`)
      return response.data
    } catch (error) {
      console.error(`[ModrinthAPI] Failed to fetch project details for ${projectIdOrSlug}:`, error.message)
      throw error
    }
  },

  /**
   * Searches Modrinth for Minecraft 1.21.1 compatible shaderpacks.
   * @param {string} query - Search string keyword.
   * @param {number} [offset=0] - Pagination offset.
   * @param {number} [limit=20] - Number of items to retrieve.
   * @returns {Promise<{ hits: Array<Object>, total_hits: number }>}
   */
  async searchShaders(query = '', offset = 0, limit = 20, sortIndex = 'downloads') {
    try {
      const facets = JSON.stringify([
        ['project_type:shader'],
        ['versions:1.21.1']
      ])

      const response = await axios.get(`${MODRINTH_BASE_URL}/search`, {
        params: {
          query,
          facets,
          offset,
          limit,
          index: sortIndex
        }
      })
      return response.data
    } catch (error) {
      console.error('[ModrinthAPI] Shader search failed:', error.message)
      throw error
    }
  },

  /**
   * Resolves the primary download URL and target file name for a project's latest 1.21.1 release.
   * @param {string} projectIdOrSlug
   * @returns {Promise<{ downloadUrl: string, fileName: string }>}
   */
  async getLatestReleaseFile(projectIdOrSlug) {
    try {
      const response = await axios.get(`${MODRINTH_BASE_URL}/project/${projectIdOrSlug}/version`, {
        params: {
          game_versions: JSON.stringify(['1.21.1'])
        }
      })

      const versions = response.data
      if (!versions || versions.length === 0) {
        throw new Error(`No compatible 1.21.1 versions found for ${projectIdOrSlug}`)
      }

      const latestVersion = versions[0]
      const primaryFile = latestVersion.files.find((f) => f.primary) || latestVersion.files[0]

      return {
        downloadUrl: primaryFile.url,
        fileName: primaryFile.filename
      }
    } catch (error) {
      console.error(`[ModrinthAPI] Failed to fetch version file for ${projectIdOrSlug}:`, error.message)
      throw error
    }
  }
}
