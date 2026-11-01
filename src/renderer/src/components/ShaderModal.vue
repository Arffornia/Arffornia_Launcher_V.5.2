<template>
  <teleport to="body">
    <transition name="fade">
      <div v-if="isOpen" class="modal-backdrop" @click.self="close">
        <div class="modal-window">
          <button class="btn-close" :title="t('common.close')" :aria-label="t('common.close')" @click="close">✕</button>

          <!-- Header Section -->
          <div class="modal-header">
            <img :src="iconUrl" class="shader-icon" @error="onIconError" />
            <div class="header-info">
              <h2 class="shader-title">{{ displayShader.title }}</h2>
              <p class="shader-author">{{ t('shaders.modal.by') }} <span>{{ displayShader.author || t('shaders.modal.unknown_author') }}</span></p>

              <div class="stats-row">
                <span v-if="displayShader.downloads" class="stat-item">{{ t('shaders.modal.downloads', { count: formatNumber(displayShader.downloads) }) }}</span>
                <span v-if="displayShader.followers" class="stat-item">{{ t('shaders.modal.likes', { count: formatNumber(displayShader.followers) }) }}</span>
              </div>
            </div>
          </div>

          <!-- Gallery Screenshots Carousel -->
          <div v-if="isLoadingDetails" class="gallery-loading">
            <span>{{ t('shaders.modal.loading_screenshots') }}</span>
          </div>

          <div v-else-if="galleryImages.length > 0" class="gallery-section">
            <div class="main-preview">
              <button
                v-if="galleryImages.length > 1"
                class="nav-arrow prev"
                :title="t('shaders.modal.previous_image')"
                @click="prevImage"
              >
                ‹
              </button>

              <img :src="galleryImages[activeImageIndex]" class="preview-img" @error="onPreviewError" />

              <button
                v-if="galleryImages.length > 1"
                class="nav-arrow next"
                :title="t('shaders.modal.next_image')"
                @click="nextImage"
              >
                ›
              </button>
            </div>

            <div v-if="galleryImages.length > 1" class="thumbnails-row">
              <img
                v-for="(img, idx) in galleryImages"
                :key="idx"
                :src="img"
                class="thumb-img"
                :class="{ active: activeImageIndex === idx }"
                @click="activeImageIndex = idx"
              />
            </div>
          </div>

          <!-- Description -->
          <div class="description-section">
            <h3>{{ t('shaders.modal.about') }}</h3>
            <p class="description-text">{{ displayShader.description || displayShader.customDescription }}</p>
          </div>

          <!-- Footer Actions -->
          <div class="modal-footer">
            <template v-if="isInstalled">
              <button
                v-if="isActive"
                class="btn btn-secondary"
                @click="$emit('deactivate')"
              >
                {{ t('shaders.deactivate') }}
              </button>
              <button
                v-else
                class="btn btn-primary"
                @click="$emit('activate')"
              >
                {{ t('shaders.activate') }}
              </button>
              <button class="btn btn-danger" @click="$emit('delete')">
                {{ t('shaders.delete') }}
              </button>
            </template>

            <template v-else>
              <!-- Progress Bar when Downloading -->
              <div v-if="downloadProgress !== undefined" class="progress-bar-container full-width">
                <div class="progress-fill" :style="{ width: `${downloadProgress * 100}%` }"></div>
                <span class="progress-text">{{ Math.floor(downloadProgress * 100) }}%</span>
              </div>

              <!-- Install Button -->
              <button v-else class="btn btn-primary full-width" @click="$emit('install')">
                {{ t('shaders.download') }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { modrinthApi } from '../js/modrinthApi'

const { t, locale } = useI18n()

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  shader: { type: Object, default: () => ({}) },
  isInstalled: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  downloadProgress: { type: Number, default: undefined }
})

const emit = defineEmits(['close', 'install', 'activate', 'deactivate', 'delete'])

const activeImageIndex = ref(0)
const iconFailed = ref(false)
const fullDetails = ref(null)
const isLoadingDetails = ref(false)

const fallbackImage = new URL('../../../../resources/img/bg/mainBG.png', import.meta.url).href

const handleKeydown = (e) => {
  if (!props.isOpen) return
  if (e.key === 'ArrowLeft') prevImage()
  if (e.key === 'ArrowRight') nextImage()
  if (e.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.shader) {
    activeImageIndex.value = 0
    iconFailed.value = false
    fullDetails.value = null

    const projectId = props.shader.id || props.shader.project_id || props.shader.slug
    if (projectId) {
      isLoadingDetails.value = true
      try {
        const details = await modrinthApi.getProjectDetails(projectId)
        fullDetails.value = details
      } catch (err) {
        console.warn('[ShaderModal] Could not fetch detailed gallery:', err)
      } finally {
        isLoadingDetails.value = false
      }
    }
  }
})

const displayShader = computed(() => ({
  ...props.shader,
  ...(fullDetails.value || {})
}))

const iconUrl = computed(() => {
  if (iconFailed.value || !displayShader.value?.icon_url) {
    return fallbackImage
  }
  return displayShader.value.icon_url
})

const galleryImages = computed(() => {
  const urls = []
  const target = displayShader.value

  if (target?.gallery && Array.isArray(target.gallery)) {
    target.gallery.forEach((item) => {
      if (typeof item === 'string' && item.startsWith('http')) {
        urls.push(item)
      } else if (item && typeof item === 'object' && item.url) {
        urls.push(item.url)
      }
    })
  }

  if (target?.featured_gallery && typeof target.featured_gallery === 'string') {
    if (!urls.includes(target.featured_gallery)) {
      urls.push(target.featured_gallery)
    }
  }

  if (urls.length === 0 && target?.icon_url) {
    urls.push(target.icon_url)
  }

  return urls
})

const nextImage = () => {
  if (galleryImages.value.length > 0) {
    activeImageIndex.value = (activeImageIndex.value + 1) % galleryImages.value.length
  }
}

const prevImage = () => {
  if (galleryImages.value.length > 0) {
    activeImageIndex.value = (activeImageIndex.value - 1 + galleryImages.value.length) % galleryImages.value.length
  }
}

const close = () => emit('close')
const onIconError = () => { iconFailed.value = true }
const onPreviewError = () => {
  if (galleryImages.value.length > 0) {
    galleryImages.value[activeImageIndex.value] = fallbackImage
  }
}

const formatNumber = (num) => !num ? '0' : new Intl.NumberFormat(locale.value, { notation: 'compact' }).format(num)
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(9, 7, 10, 0.85);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-window {
  background: #1a1224;
  border: 2px solid #ff7300;
  border-radius: 20px;
  width: 90%;
  max-width: 680px;
  max-height: 85vh;
  overflow-y: auto;
  padding: 28px;
  position: relative;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 115, 0, 0.2);
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.modal-window::-webkit-scrollbar { display: none; }

.btn-close {
  position: absolute;
  top: 18px;
  right: 18px;
  background: #261d31;
  border: 1px solid #ff7300;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
  z-index: 10;
}

.modal-header {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
}

.shader-icon {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  object-fit: cover;
  border: 2px solid #ff7300;
}

.shader-title {
  margin: 0;
  color: #fff;
  font-size: 24px;
  font-weight: 800;
}

.shader-author {
  color: #b3a7c2;
  font-size: 14px;
  margin: 4px 0 8px 0;
}

.shader-author span { color: #ff7300; font-weight: 600; }

.stats-row {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #d1c4e9;
}

.gallery-loading {
  text-align: center;
  padding: 30px;
  color: #ff7300;
  font-weight: bold;
}

.gallery-section { margin-bottom: 20px; }

.main-preview {
  position: relative;
  width: 100%;
  height: 280px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #3d2f4e;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(9, 7, 10, 0.6);
  border: 1px solid rgba(255, 115, 0, 0.4);
  color: #fff;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
  z-index: 5;
}

.nav-arrow:hover {
  background: #ff7300;
  border-color: #ff7300;
  transform: translateY(-50%) scale(1.1);
}

.nav-arrow.prev { left: 12px; }
.nav-arrow.next { right: 12px; }

.thumbnails-row {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.thumbnails-row::-webkit-scrollbar { display: none; }

.thumb-img {
  width: 80px;
  height: 50px;
  object-fit: cover;
  border-radius: 6px;
  cursor: pointer;
  opacity: 0.6;
  transition: all 0.2s;
  flex-shrink: 0;
}

.thumb-img.active, .thumb-img:hover {
  opacity: 1;
  border: 2px solid #ff7300;
}

.description-section {
  color: #d1c4e9;
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.description-section h3 { color: #fff; margin-bottom: 8px; }

.modal-footer { display: flex; gap: 12px; }

.btn {
  padding: 12px 20px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary { background: #ff7300; color: #fff; }
.btn-primary:hover { background: #e06500; }
.btn-secondary { background: #3d2f4e; color: #fff; }
.btn-danger { background: #c0392b; color: #fff; }
.full-width { width: 100%; }

.progress-bar-container {
  position: relative;
  height: 40px;
  background: #120b18;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #ff7300;
  transition: width 0.2s ease;
}

.progress-text {
  position: relative;
  z-index: 1;
  color: #fff;
  font-weight: 800;
  font-size: 14px;
}
</style>
