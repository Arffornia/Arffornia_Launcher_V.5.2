<template>
  <div class="home-content">
    <h2>Welcome to the Home Page</h2>
    <p>This is the home page content.</p>
  </div>

  <canvas class="skin_viewer" data-username="The_Gost_sniper"></canvas>
</template>

<script setup>
import { onMounted } from 'vue';
import { initializeSkinViewers } from '../js/skinviewer.js';

onMounted(() => {
  initializeSkinViewers();
});
</script>

<style scoped>
.home-content {
  padding: 2em;
}
</style>
