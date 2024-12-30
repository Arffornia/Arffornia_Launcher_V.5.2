<template>
  <div class="player-card-content">
    <div class="player-card-container">
      <div class="player-info">
        <div class="username">{{ $props.username }}</div>
        <div class="player-details">
          <div class="day-streak">
            {{ playerProfile ? playerProfile.day_streak : '0' }}
            <img :src="streakImgSrc" id="streak-img" alt="Streak Image">
          </div>
          <span class="v-separator"></span>
          <div class="player-grade">
            {{ playerProfile ? playerProfile.grade : 'Loading...' }}
          </div>
        </div>
      </div>

      <div class="v-red-separator"></div>

      <div class="skinViewer-overlay">
        <canvas class="skin_viewer" :data-username="username" data-control="true"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { initializeSkinViewers } from '../js/skinviewer.js';
import { fetchPlayerProfile } from '../js/arfforniaApi.js';

import firesImg from '@res/img/icon/fire/fires.png';
import noFiresImg from '@res/img/icon/fire/no-fires.png';

const props = defineProps(['username']);

const playerProfile = ref(null);

const streakImgSrc = computed(() => {
  return playerProfile.value && playerProfile.value.day_streak !== 0 ? firesImg : noFiresImg;
});

onMounted(async () => {
  initializeSkinViewers();
  try {
    playerProfile.value = await fetchPlayerProfile(props.username);
  } catch (err) {
    window.api.logger("error", `Failed to fetch player profile: ${err}`);
  }
});

</script>


<style scoped>
  .player-card-content {
    margin: 5%;
    margin-left: auto;
    margin-right: auto;
    width: 80%;
    height: 300px;
    border-radius: 30px;
    background-color: #261d31;
    box-shadow: rgba(17, 17, 26, 0.7) 0px 4px 16px, rgba(17, 17, 26, 0.35) 0px 8px 32px;
  }

  .player-info {
    margin-left: 10%;
  }

  .v-red-separator {
    margin-left: auto;
    margin-right: auto;
    width: 300px;
    height: 100%;
    background-color: #e63946;
    clip-path: polygon(30% 0%, 100% 0%, 70% 100%, 0% 100%);
    box-shadow: rgba(121, 10, 34, 0.7) 0px 4px 16px, rgba(253, 2, 18, 0.35) 0px 8px 32px;
  }

  .player-card-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
  }

  .skinViewer-overlay {
    margin-left: auto;
    margin-right: 10%;
    background: linear-gradient(90deg, #4776E6, #8E54E9);
    border: solid 2px #23003e;
    box-shadow: rgba(17, 17, 26, 0.7) 0px 4px 16px, rgba(17, 17, 26, 0.35) 0px 8px 32px;
    border-radius: 30px;
    transform: scale(1.2);
  }


  .player-details {
    color: #fff;
    font-size: 300%;
    font-weight: 600;
    height: 75px;
    display: flex;
    align-items: center;
  }

  .username {
    color: #fff;
    font-size: 225%;
    font-weight: 700;
  }

  .day-streak {
    display: flex;
    align-items: center;
  }

  #streak-img {
    width: 75px;
  }

  .v-separator {
    width: 3px;
    height: 100%;
    border-radius: 30px;
    background-color: #fff;
  }

  .player-grade {
    color: #ffcd18;
    padding-left: 15px;
  }
</style>
