<template>
  <div class="highlight-content">
    <div v-if="isLoading" class="loading-container">
      <p>Loading highlights...</p>
    </div>

    <div v-else-if="highlights.length > 0" class="slideshow-container">
      <div
        class="slides-wrapper"
        :style="{ transform: `translateX(-${currentIndex * 100}%)` }"
      >
        <div v-for="item in highlights" :key="item.path" class="slide">
          <img :src="item.path" alt="Launcher Highlight" />
        </div>
      </div>

      <div class="navigation-overlay">
        <button
          @click="navigate('prev')"
          class="nav-button prev"
        >
          &#10094;
        </button>

        <div class="player-card-animation-container">
          <transition :name="slideDirection" mode="out-in">
            <PlayerCard
              v-if="currentPlayerName"
              :key="currentPlayerName"
              :username="currentPlayerName"
              class="highlight-player-card"
            />
          </transition>
        </div>

        <button
          @click="navigate('next')"
          class="nav-button next"
        >
          &#10095;
        </button>
      </div>
    </div>

    <div v-else class="no-images-container">
      <p>No highlights to display at the moment.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { fetchLauncherImages } from '../js/arfforniaApi.js';
import PlayerCard from '../components/PlayerCard.vue';

const highlights = ref([]);
const currentIndex = ref(0);
const isLoading = ref(true);
const slideDirection = ref('slide-next');
let intervalId = null;

const currentPlayerName = computed(() => {
  if (highlights.value.length === 0) return null;
  return highlights.value[currentIndex.value]?.player_name;
});

const nextSlide = () => {
  slideDirection.value = 'slide-next';
  currentIndex.value = (currentIndex.value + 1) % highlights.value.length;
};

const prevSlide = () => {
  slideDirection.value = 'slide-prev';
  currentIndex.value = (currentIndex.value - 1 + highlights.value.length) % highlights.value.length;
};

const startInterval = () => {
  if (highlights.value.length > 1) {
    intervalId = setInterval(nextSlide, 3000);
  }
};

const resetInterval = () => {
  clearInterval(intervalId);
  startInterval();
};

const navigate = (direction) => {
  if (direction === 'next') {
    nextSlide();
  } else {
    prevSlide();
  }
  resetInterval();
};

onMounted(async () => {
  try {
    highlights.value = await fetchLauncherImages();
    startInterval();
  } catch (error) {
    window.api.logger("error", `Failed to fetch launcher images: ${error}`);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId);
  }
});
</script>

<style scoped>
.highlight-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px;
  box-sizing: border-box;
}

.slideshow-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 15px;
  border: 3px solid #ff7300;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.slides-wrapper {
  display: flex;
  height: 100%;
  transition: transform 1s ease-in-out;
}

.slide {
  flex-shrink: 0;
  width: 100%;
  height: 100%;
}

.slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.loading-container,
.no-images-container {
  color: white;
  font-size: 1.5em;
}

.navigation-overlay {
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  z-index: 10;
  pointer-events: none;
}

.nav-button {
  background-color: #09070a;
  border: 2px solid #ff7300;
  color: white;
  cursor: pointer;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  font-size: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.5s ease;
  line-height: 1;
  flex-shrink: 0;
  pointer-events: auto;
}

.nav-button:hover {
  background-color: #ff7300;
  transform: scale(1.1);
}

.nav-button.prev {
  padding-right: 10px;
}

.nav-button.next {
  padding-right: 5px;
}

.player-card-animation-container {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.highlight-player-card {
  margin: 0;
  pointer-events: none;
  transform: scale(0.7);
}

.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: opacity 0.4s ease;
}

.slide-next-enter-from {
  opacity: 0;
}
.slide-next-leave-to {
  opacity: 0;
}

.slide-prev-enter-from {
  opacity: 0;
}
.slide-prev-leave-to {
  opacity: 0;
}
</style>
