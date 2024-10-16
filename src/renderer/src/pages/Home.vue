<template>
  <div class="notification-content">
    <Podium/>
    <input @click="playBtnEvent" class="mediumPlayBtn" type="button" value="Jouer">
    <ServerStatue/>
  </div>
</template>

<script setup>
import Podium from '../components/Podium.vue';
import ServerStatue from '../components/ServerStatue.vue';
import { useUserStore } from '../stores/userStore';

const userStore = useUserStore();

async function playBtnEvent() {
  if (!userStore.isAuth)
  {
    await userStore.login();
    if (!userStore.isAuth)
    {
      return;
    }
  }

  window.api.launchMC().then(() => {
    console.log('Minecraft launch command sent.');
  }).catch(err => {
    console.error('Failed to launch Minecraft:', err);
  });
}
</script>


<style scoped>
 .notification-content {

 }

 .mediumPlayBtn{
  height: 50px;
  font-weight: 1000;
  min-width: 250px;
  font-size: 125%;
  border-radius: 5px;
  padding: 2px 10px;
  transition: 0.3s all ease;
  background-color: #ff7300;
  display: block;
  outline: none;
  border: none;
  width: fit-content;
  color: white;
}

.mediumPlayBtn:hover {
  font-size: 140%;
  box-shadow: 0px 15px 20px #ff730097;
  transform: translateY(-3px);
}
</style>
