<template>
  <div class="profile-content">
    <PlayerCard :key="username" :username="username" />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { ref, watchEffect } from 'vue';
import PlayerCard from '../components/PlayerCard.vue';

const route = useRoute();
const username = ref(route.params.username || 'The_Gost_sniper');

watchEffect(() => {
  username.value = route.params.username || 'The_Gost_sniper';
});

</script>

<style scoped>
.profile-content {
  width: 100%;
}
</style>
