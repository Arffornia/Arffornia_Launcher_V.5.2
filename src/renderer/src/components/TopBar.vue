<template>
  <div class="info-bar">
    <img class="info-btn" @click="openWebsite" src="@res/img/icon/internet/internet.png" alt="Arffornia Website" title="Arffornia Website">
    <img class="info-btn" @click="openDiscord" src="@res/img/icon/discord/discord.png" alt="Discord" title="Discord">
    <ServerStatue/>
  </div>
</template>

<script setup>
import ServerStatue from '../components/ServerStatue.vue';

function openDiscord() {
  window.api.openDiscord();
}

function openWebsite() {
  window.api.openWebsite("https://arffornia.com");
}

</script>

<style scoped>

.info-bar {
  transform: scale(0.73);
  transform-origin: top right;

  position: absolute;
  top: 3%;
  right: 3%;
  border: solid 3px #ff7300;
  background-color: #09070a;
  border-radius: 15px;
  display: flex;
  gap: 20px;
  align-items: center;

  padding: 0 20px;
}

.info-btn {
  width: 30px;
  height: 30%;
}

.info-btn:hover {
  cursor: pointer;
}

</style>
