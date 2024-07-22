<template>
  <div class="profile-content">
    <h2>Welcome to the profile page</h2>
    <p>This is the profile page content.</p>

    <PlayerCard username="The_Gost_sniper"/>
  </div>
</template>

<script setup>
  import PlayerCard from '../components/PlayerCard.vue';
</script>

<style scoped>
.profile-content {
  width: 100%;
}
</style>
