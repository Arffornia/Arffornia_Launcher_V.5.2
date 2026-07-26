<template>
  <div class="shaders-page">
    <!-- Header -->
    <div class="top-header">
      <div class="title-block">
        <h1 class="page-title">{{ $t('shaders.title') }}</h1>
        <p class="subtitle">{{ $t('shaders.subtitle') }}</p>
      </div>
    </div>

    <!-- Navigation Pills -->
    <div class="nav-bar">
      <div class="pills-group">
        <button
          class="pill-btn"
          :class="{ active: activeTab === 'featured' }"
          @click="activeTab = 'featured'"
        >
          {{ $t('shaders.tabs.featured') }}
        </button>
        <button
          class="pill-btn"
          :class="{ active: activeTab === 'catalog' }"
          @click="switchTab('catalog')"
        >
          {{ $t('shaders.tabs.catalog') }}
        </button>
        <button
          class="pill-btn"
          :class="{ active: activeTab === 'installed' }"
          @click="activeTab = 'installed'"
        >
          {{ $t('shaders.tabs.installed') }} ({{ shaderStore.installedShaders.length }})
        </button>
      </div>

      <!-- Search Input -->
      <div v-if="activeTab === 'catalog'" class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('shaders.search_placeholder')"
          @keyup.enter="performSearch(1)"
        />
        <button class="btn-search" @click="performSearch(1)">🔍</button>
      </div>
    </div>

    <!-- Content Grids -->
    <div class="grid-container">
      <!-- Tab 1: Featured -->
      <div v-if="activeTab === 'featured'" class="shaders-grid">
        <ShaderCard
          v-for="shader in shaderStore.featuredShaders"
          :key="shader.id"
          :title="shader.title"
          :description="shader.customDescription || shader.description"
          :image-url="shader.icon_url"
          :badge="shader.badge"
          :is-installed="isInstalled(shader)"
          :is-active="isActive(shader)"
          :download-progress="getDownloadProgress(shader)"
          @open-modal="openShaderModal(shader)"
          @install="shaderStore.installShader(shader)"
          @activate="activateShaderProject(shader)"
          @deactivate="shaderStore.setActiveShader('OFF')"
        />
      </div>

      <!-- Tab 2: Catalog -->
      <div v-else-if="activeTab === 'catalog'" class="catalog-section">
        <div class="shaders-grid">
          <ShaderCard
            v-for="shader in shaderStore.catalogShaders"
            :key="shader.project_id"
            :title="shader.title"
            :description="shader.description"
            :image-url="shader.icon_url"
            :is-installed="isInstalled(shader)"
            :is-active="isActive(shader)"
            :download-progress="getDownloadProgress(shader)"
            @open-modal="openShaderModal(shader)"
            @install="shaderStore.installShader(shader)"
            @activate="activateShaderProject(shader)"
            @deactivate="shaderStore.setActiveShader('OFF')"
          />
        </div>

        <!-- Pagination Bar -->
        <div v-if="shaderStore.catalogTotalHits > 0" class="pagination-bar">
          <button
            class="btn-page"
            :disabled="shaderStore.catalogPage <= 1"
            @click="changePage(shaderStore.catalogPage - 1)"
          >
            {{ $t('shaders.prev_page') }}
          </button>

          <span class="page-indicator">
            {{ $t('shaders.page_indicator', { current: shaderStore.catalogPage, total: shaderStore.totalPages }) }}
          </span>

          <button
            class="btn-page"
            :disabled="shaderStore.catalogPage >= shaderStore.totalPages"
            @click="changePage(shaderStore.catalogPage + 1)"
          >
            {{ $t('shaders.next_page') }}
          </button>
        </div>
      </div>

      <!-- Tab 3: Installed Local Shaders -->
      <div v-else-if="activeTab === 'installed'" class="installed-view">
        <div v-if="shaderStore.installedShaders.length === 0" class="empty-state">
          {{ $t('shaders.no_installed') }}
        </div>

        <div v-else class="shaders-grid">
          <ShaderCard
            v-for="fileName in shaderStore.installedShaders"
            :key="fileName"
            :title="getShaderTitle(fileName)"
            :description="getShaderDescription(fileName)"
            :image-url="getShaderIcon(fileName)"
            :is-installed="true"
            :is-active="shaderStore.activeShader === fileName"
            @open-modal="openInstalledShaderModal(fileName)"
            @activate="shaderStore.setActiveShader(fileName)"
            @deactivate="shaderStore.setActiveShader('OFF')"
            @delete="shaderStore.deleteShader(fileName)"
          />
        </div>
      </div>
    </div>

    <!-- Modal Detail View -->
    <ShaderModal
      :is-open="isModalOpen"
      :shader="selectedShader"
      :is-installed="isInstalled(selectedShader)"
      :is-active="isActive(selectedShader)"
      @close="isModalOpen = false"
      @install="shaderStore.installShader(selectedShader)"
      @activate="activateShaderProject(selectedShader)"
      @deactivate="shaderStore.setActiveShader('OFF')"
      @delete="deleteShaderProject(selectedShader)"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useShaderStore } from '../stores/shaderStore'
import { useUserStore } from '../stores/userStore'
import ShaderCard from '../components/ShaderCard.vue'
import ShaderModal from '../components/ShaderModal.vue'

const shaderStore = useShaderStore()
const userStore = useUserStore()

const activeTab = ref('featured')
const searchQuery = ref('')
const isModalOpen = ref(false)
const selectedShader = ref({})

onMounted(async () => {
  await shaderStore.init()
  await shaderStore.loadFeaturedShaders()
})

watch(() => userStore.selectedLang, async () => {
  await shaderStore.loadFeaturedShaders()
})

const switchTab = (tab) => {
  activeTab.value = tab
  if (tab === 'catalog' && shaderStore.catalogShaders.length === 0) {
    performSearch(1)
  }
}

const performSearch = (page = 1) => shaderStore.searchCatalog(searchQuery.value, page)

const changePage = (newPage) => {
  if (newPage >= 1 && newPage <= shaderStore.totalPages) {
    performSearch(newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '')

const getShaderTitle = (fileName) => {
  if (!fileName || fileName === 'OFF') return ''
  const meta = shaderStore.installedMetadata[fileName]
  if (meta?.title) return meta.title

  let name = fileName.replace(/\.zip$/i, '')
  name = name.replace(/[-_](r|v)?\d+(\.\d+)*.*/i, '')
  name = name.replace(/[-_]/g, ' ')
  name = name.replace(/([a-z])([A-Z])/g, '$1 $2')
  return name.trim()
}

const getShaderDescription = (fileName) => {
  const meta = shaderStore.installedMetadata[fileName]
  return meta?.description || `Installed shader pack (${fileName})`
}

const getShaderIcon = (fileName) => {
  const meta = shaderStore.installedMetadata[fileName]
  return meta?.icon_url || ''
}

const isInstalled = (shader) => {
  if (!shader) return false
  if (typeof shader === 'string') return shaderStore.installedShaders.includes(shader)

  const slugNorm = normalize(shader.slug)
  const titleNorm = normalize(shader.title)

  return shaderStore.installedShaders.some((file) => {
    const fileNorm = normalize(file)
    return (slugNorm && fileNorm.includes(slugNorm)) || (titleNorm && fileNorm.includes(titleNorm))
  })
}

const isActive = (shader) => {
  if (!shader || shaderStore.activeShader === 'OFF') return false
  if (typeof shader === 'string') return shaderStore.activeShader === shader

  const slugNorm = normalize(shader.slug)
  const titleNorm = normalize(shader.title)
  const activeNorm = normalize(shaderStore.activeShader)

  return (slugNorm && activeNorm.includes(slugNorm)) || (titleNorm && activeNorm.includes(titleNorm))
}

const getDownloadProgress = (shader) => {
  if (!shader?.slug) return undefined
  const matchingKey = Object.keys(shaderStore.downloadProgress).find((file) =>
    normalize(file).includes(normalize(shader.slug))
  )
  return matchingKey ? shaderStore.downloadProgress[matchingKey] : undefined
}

const openShaderModal = (shader) => {
  selectedShader.value = shader
  isModalOpen.value = true
}

const openInstalledShaderModal = async (fileName) => {
  let meta = await shaderStore.resolveShaderMetadata(fileName)
  if (meta) {
    selectedShader.value = meta
  } else {
    selectedShader.value = {
      id: fileName,
      slug: fileName,
      title: getShaderTitle(fileName),
      description: getShaderDescription(fileName),
      icon_url: getShaderIcon(fileName)
    }
  }
  isModalOpen.value = true
}

const activateShaderProject = (shader) => {
  const slugNorm = normalize(shader.slug)
  const titleNorm = normalize(shader.title)

  const file = shaderStore.installedShaders.find((f) => {
    const fNorm = normalize(f)
    return (slugNorm && fNorm.includes(slugNorm)) || (titleNorm && fNorm.includes(titleNorm))
  })

  if (file) shaderStore.setActiveShader(file)
}

const deleteShaderProject = (shader) => {
  const slugNorm = normalize(shader.slug)
  const titleNorm = normalize(shader.title)

  const file = shaderStore.installedShaders.find((f) => {
    const fNorm = normalize(f)
    return (slugNorm && fNorm.includes(slugNorm)) || (titleNorm && fNorm.includes(titleNorm))
  })

  if (file) shaderStore.deleteShader(file)
}
</script>

<style scoped>
.shaders-page {
  padding: 40px 60px;
  color: #fff;
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 30px;
}

.page-title {
  font-size: 36px;
  font-weight: 800;
  margin: 0;
  border-left: 5px solid #ff7300;
  padding-left: 15px;
}

.subtitle {
  color: #b3a7c2;
  margin: 6px 0 0 20px;
  font-size: 14px;
}

.nav-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.pills-group {
  display: flex;
  gap: 12px;
  background: #09070a;
  padding: 6px;
  border-radius: 14px;
  border: 1px solid #261d31;
}

.pill-btn {
  background: none;
  border: none;
  color: #b3a7c2;
  padding: 10px 22px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.pill-btn.active {
  background: #ff7300;
  color: #fff;
}

.search-box {
  display: flex;
  gap: 8px;
  background: #09070a;
  border: 2px solid #261d31;
  border-radius: 12px;
  padding: 4px 12px;
}

.search-box input {
  background: none;
  border: none;
  color: #fff;
  outline: none;
  padding: 8px;
  font-size: 14px;
}

.btn-search {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
}

.shaders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 25px;
}

.pagination-bar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 40px;
  padding-top: 20px;
}

.btn-page {
  background: #1a1224;
  border: 2px solid #ff7300;
  color: #fff;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-page:hover:not(:disabled) {
  background: #ff7300;
  transform: translateY(-2px);
}

.btn-page:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: #3d2f4e;
}

.page-indicator {
  font-size: 14px;
  color: #b3a7c2;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #b3a7c2;
  font-size: 16px;
}
</style>
