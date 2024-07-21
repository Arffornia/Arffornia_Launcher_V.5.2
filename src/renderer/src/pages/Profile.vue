<template>
  <div class="profile-content">
    <h2>Welcome to the profile page</h2>
    <p>This is the profile page content.</p>
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
.profile-content {
  padding: 2em;
}
</style>
