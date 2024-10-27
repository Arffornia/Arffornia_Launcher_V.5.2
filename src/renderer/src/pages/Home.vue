<template>
  <div class="scroll-container">
    <div class="home-content">
      <!-- <img class="isoimg" src="@res/img/iso/testiso1ps.png" alt=""> -->
       <div class="podium-container">
          <Podium/>
       </div>

      <div class="playBox">
        <p id="title">ARFFORNIA</p>
        <div class="description">
          <p class="description-content">+ 330 Mods</p>
          <p class="description-content">+ 25 Paliers de progression</p>

        </div>
        <input @click="playBtnEvent" class="mediumPlayBtn" type="button" value="Jouer">
      </div>
    </div>
  </div>

  <TopBar/>
</template>

<script setup>
import Podium from '../components/Podium.vue';
import TopBar from '../components/TopBar.vue';
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
.scroll-container {
  height: 100vh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  position: relative;
}

.isoimg {
  top: 20%;
  left: 20%;
  position: absolute;
  width: 1000px;
 }

#title {
  color: white;
  font-size: 400%;
  font-weight: 800;
  margin: 0;
}

.playBox {
  background: linear-gradient(135deg, rgba(33, 33, 33, 0.737) 0%, rgba(29, 29, 29, 0.236) 100%);
  box-shadow: rgba(14, 30, 37, 0.12) 0px 2px 4px 0px, rgba(14, 30, 37, 0.32) 0px 2px 16px 0px;
  backdrop-filter: blur(4px);
  position: absolute;
  top: 36%;
  left: 5%;
  border-radius: 15px;
  max-width: fit-content;

  padding: 30px;
}

.playBox .description {
  display: flex;
  flex-direction: column;
  gap: 0px;
  padding: 5px 0px 5px 5px;
  margin: 10px 0px;

  border-left: 4px solid #ff7300;
  border-top-left-radius: 3px;
  border-bottom-left-radius: 3px;
}

.playBox .description-content {
  color: #ffffffbd;
  margin: 0;
  font-size: 110%;
  font-weight: 400;
}

 .podium-container {
  transform: translate(60%, 13%);
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
