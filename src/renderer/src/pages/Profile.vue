<template>
  <div class="profile-content">
    <PlayerCard :key="username" :username="username" />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { ref, watchEffect } from 'vue';
import PlayerCard from '../components/PlayerCard.vue';
import { useUserStore } from '../stores/userStore';

const route = useRoute();
const userStore = useUserStore();
const username = ref(route.params.username || userStore.username);

watchEffect(() => {
  username.value = route.params.username || userStore.username;
});

</script>

<style scoped>
.profile-content {
  padding-top: 5%;
  width: 100%;
}
</style>
