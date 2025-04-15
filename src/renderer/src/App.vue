<template>
  <router-view></router-view>
</template>

<script setup>
import { onMounted } from 'vue';
import { usePodiumStore } from './stores/podiumStore';
import router from './router';

const launcherStore = usePodiumStore();

onMounted(async () => {
  launcherStore.fetchData();
  router.push('/');
});


</script>

<style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
}
</style>
