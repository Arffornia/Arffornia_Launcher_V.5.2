<template>
  <transition name="fade" appear>
    <div v-if="progress > 0 && progress < 1" class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress * 100 + '%' }"></div>
        <div class="progress-text">
          <span>{{ overallStatusText }}</span>
          <span v-if="modStatusText" class="mod-status">{{ modStatusText }}</span>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const progress = ref(0)
const label = ref('')
const modName = ref('')
const modIndex = ref(0)
const totalMods = ref(0)

const handler = (_event, data) => {
  progress.value = data.value
  label.value = data.label
  modName.value = data.modName || ''
  modIndex.value = data.modIndex || 0
  totalMods.value = data.totalMods || 0
}

onMounted(() => {
  window.electron.ipcRenderer.on('globalProgress', handler)
})

onBeforeUnmount(() => {
  window.electron.ipcRenderer.removeListener('globalProgress', handler)
})

const overallStatusText = computed(() => {
  return `${label.value} - ${Math.floor(progress.value * 100)}%`;
});

const modStatusText = computed(() => {
  if (modName.value && totalMods.value > 0) {
    return `${modName.value} (${modIndex.value}/${totalMods.value})`;
  }
  return '';
});

</script>

<style scoped>
.progress-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: transparent;
  z-index: 999;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 24px;
  background-color: #1600208c;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #ff7300;
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  font-size: 13px;
  font-weight: 550;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
  box-sizing: border-box;
  pointer-events: none;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.mod-status {
  max-width: 50%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: right;
}
</style>
