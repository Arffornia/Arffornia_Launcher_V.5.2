<template>
  <div class="shader-card" :class="{ 'is-active': isActive }" @click="$emit('open-modal')">
    <div class="cover-wrapper">
      <img :src="iconUrl" class="cover-image" @error="onImageError" />
      <div class="gradient-overlay"></div>

      <!-- Top-Left Performance Tag Badge -->
      <span v-if="performanceTag" class="badge-tag perf-tag" :class="performanceTag.type">
        {{ performanceTag.label }}
      </span>

      <!-- Top-Right Status Badge -->
      <span v-if="hasUpdate" class="badge-tag update-tag">🔄 UPDATE AVAILABLE</span>
      <span v-else-if="badge" class="badge-tag featured">{{ badge }}</span>
      <span v-else-if="isActive" class="badge-tag active-tag">● ACTIVE</span>
      <span v-else-if="isInstalled" class="badge-tag installed">INSTALLED</span>
    </div>

    <div class="card-content">
      <h3 class="shader-name" :title="title">{{ title }}</h3>
      <p class="shader-desc">{{ description }}</p>

      <div v-if="downloadProgress !== undefined" class="progress-container">
        <div class="progress-bar" :style="{ width: `${downloadProgress * 100}%` }"></div>
        <span class="progress-text">{{ Math.floor(downloadProgress * 100) }}%</span>
      </div>

      <div v-else class="card-footer" @click.stop>
        <button v-if="hasUpdate" class="btn-action update-btn" @click.stop="$emit('update')">
          🔄 Update Now
        </button>

        <button v-else-if="!isInstalled" class="btn-action install" @click.stop="$emit('install')">
          Install
        </button>

        <button v-else-if="!isActive" class="btn-action activate" @click.stop="$emit('activate')">
          Activate
        </button>

        <button v-else class="btn-action active-btn" @click.stop="$emit('deactivate')">
          Active ✓
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  badge: { type: String, default: '' },
  categories: { type: Array, default: () => [] },
  isInstalled: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  hasUpdate: { type: Boolean, default: false },
  downloadProgress: { type: Number, default: undefined }
})

defineEmits(['install', 'activate', 'deactivate', 'delete', 'update', 'open-modal'])

const imageFailed = ref(false)
const fallbackImage = new URL('../../../../resources/img/bg/mainBG.png', import.meta.url).href

const iconUrl = computed(() => {
  return imageFailed.value || !props.imageUrl ? fallbackImage : props.imageUrl
})

/**
 * Analyzes categories, title, and description to categorize GPU intensity.
 */
const performanceTag = computed(() => {
  const text = `${props.title} ${props.description} ${(props.categories || []).join(' ')}`.toLowerCase()

  if (
    text.includes('rtx') ||
    text.includes('ptgi') ||
    text.includes('path tracing') ||
    text.includes('voxel') ||
    text.includes('heavy') ||
    text.includes('ultra') ||
    text.includes('extreme')
  ) {
    return { label: '🔥 Gourmand', type: 'heavy' }
  }

  if (
    text.includes('lite') ||
    text.includes('potato') ||
    text.includes('low') ||
    text.includes('fast') ||
    text.includes('performance') ||
    text.includes('vanilla')
  ) {
    return { label: '⚡ FPS Friendly', type: 'fps' }
  }

  return { label: '⚖️ Équilibré', type: 'medium' }
})

const onImageError = () => { imageFailed.value = true }
</script>

<style scoped>
.shader-card {
  background: rgba(38, 29, 49, 0.75);
  backdrop-filter: blur(12px);
  border: 2px solid rgba(255, 115, 0, 0.15);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.shader-card:hover {
  transform: translateY(-4px);
  border-color: #ff7300;
  box-shadow: 0 10px 25px rgba(255, 115, 0, 0.25);
}

.shader-card.is-active {
  border-color: #ff7300;
  box-shadow: 0 0 20px rgba(255, 115, 0, 0.4);
}

.cover-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background-color: #09070a;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.shader-card:hover .cover-image { transform: scale(1.05); }

.gradient-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(38, 29, 49, 0.95) 100%);
}

.badge-tag {
  position: absolute;
  font-size: 11px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 20px;
  color: #fff;
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

/* Top Right Badges */
.badge-tag.featured { top: 10px; right: 10px; background: #ff7300; }
.badge-tag.active-tag { top: 10px; right: 10px; background: #27ae60; }
.badge-tag.installed { top: 10px; right: 10px; background: rgba(255, 255, 255, 0.2); border: 1px solid rgba(255, 255, 255, 0.4); }
.badge-tag.update-tag { top: 10px; right: 10px; background: #e67e22; animation: pulse 1.5s infinite; }

/* Top Left Performance Tag */
.badge-tag.perf-tag {
  top: 10px;
  left: 10px;
  font-size: 10px;
  border-radius: 6px;
}

.badge-tag.perf-tag.fps {
  background: rgba(39, 174, 96, 0.85);
  border: 1px solid rgba(46, 204, 113, 0.6);
}

.badge-tag.perf-tag.medium {
  background: rgba(41, 128, 185, 0.85);
  border: 1px solid rgba(52, 152, 219, 0.6);
}

.badge-tag.perf-tag.heavy {
  background: rgba(192, 57, 43, 0.85);
  border: 1px solid rgba(231, 76, 60, 0.6);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.shader-name {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 6px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shader-desc {
  color: #b3a7c2;
  font-size: 12px;
  line-height: 1.4;
  margin: 0 0 16px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex-grow: 1;
}

.btn-action {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: none;
  font-weight: 800;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action.install { background: #ff7300; color: #fff; }
.btn-action.install:hover { background: #e06500; }
.btn-action.activate { background: #3d2f4e; color: #fff; }
.btn-action.activate:hover { background: #ff7300; }
.btn-action.active-btn { background: #27ae60; color: #fff; }
.btn-action.update-btn { background: #e67e22; color: #fff; }
.btn-action.update-btn:hover { background: #d35400; }

.progress-container {
  position: relative;
  height: 32px;
  background: #120b18;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: #ff7300;
}

.progress-text {
  position: relative;
  z-index: 1;
  color: #fff;
  font-weight: 700;
  font-size: 12px;
}
</style>
