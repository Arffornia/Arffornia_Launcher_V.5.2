<template>
  <router-view></router-view>
</template>

<script setup>
import { onMounted } from 'vue';
import { usePodiumStore } from './stores/podiumStore';
import router from './router';
import { useUserStore } from './stores/userStore';

import { useI18n } from 'vue-i18n';
const userStore = useUserStore();

const launcherStore = usePodiumStore();

const { locale } = useI18n();

onMounted(async () => {
  launcherStore.fetchData();
  userStore.initLang(locale);
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
