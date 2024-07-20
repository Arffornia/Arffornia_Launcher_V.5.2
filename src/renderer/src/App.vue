<template>
  <router-view></router-view>
</template>

<script setup>
import { onMounted } from 'vue';
import router from './router';

onMounted(() => {
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
