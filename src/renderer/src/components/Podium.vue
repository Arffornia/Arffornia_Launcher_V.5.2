<template>
  <div class="podium">
    <div class="content">
      <div class="p2">
        <p class="playerName">{{ bestPlayers ? bestPlayers[1]?.name : 'Chargement...' }}</p>
        <div class="player-skin">
          <router-link class="nav-link" :to="bestPlayers ? `/profile/${bestPlayers[1]?.name}` : '#'" title="Show profile" exact>
            <canvas class="skin_viewer" :data-username="bestPlayers ? bestPlayers[1]?.name : 'MHF_Steve'"></canvas>
          </router-link>
        </div>
        <div class="shape">
          <div class="textContainer">
            <div class="rank">#2</div>
            <div class="score">{{ bestPlayers ? `${bestPlayers[1]?.value} ${scoreboardUnit}` : '...' }}</div>
          </div>
        </div>
      </div>

      <div class="p1">
        <p class="playerName">{{ bestPlayers ? bestPlayers[0]?.name : 'Chargement...' }}</p>
        <div class="player-skin">
          <router-link class="nav-link" :to="bestPlayers ? `/profile/${bestPlayers[0]?.name}` : '#'" title="Show profile" exact>
            <canvas class="skin_viewer" :data-username="bestPlayers ? bestPlayers[0]?.name : 'MHF_Steve'"></canvas>
          </router-link>
        </div>
        <div class="shape">
          <div class="textContainer">
            <div class="rank">#1</div>
            <div class="score">{{ bestPlayers ? `${bestPlayers[0]?.value} ${scoreboardUnit}` : '...' }}</div>
          </div>
        </div>
      </div>

      <div class="p3">
        <p class="playerName">{{ bestPlayers ? bestPlayers[2]?.name : 'Chargement...' }}</p>
        <div class="player-skin">
          <router-link class="nav-link" :to="bestPlayers ? `/profile/${bestPlayers[2]?.name}` : '#'" title="Show profile" exact>
            <canvas class="skin_viewer" :data-username="bestPlayers ? bestPlayers[2]?.name : 'MHF_Steve'"></canvas>
          </router-link>
        </div>
        <div class="shape">
          <div class="textContainer">
            <div class="rank">#3</div>
            <div class="score">{{ bestPlayers ? `${bestPlayers[2]?.value} ${scoreboardUnit}` : '...' }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="title" :title="`Switch to ${scoreboardUnit}`" @click="scoreboardTitleSwitcher">
      <button class="titleBtn">
        <p>{{ scoreboardTitle }}</p>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { initializeSkinViewers } from '../js/skinviewer.js';
import { fetchBestPlayersByVote, fetchBestPlayersByPoint } from '../js/arfforniaApi.js';

const bestPlayers = ref(null);
const bestPlayersByVote = ref(null);
const bestPlayersByPoint = ref(null);

const scoreboardUnit = ref("votes");
const scoreboardTitle = ref("Best voters");

onMounted(async () => {
  try {
    bestPlayersByVote.value = await fetchBestPlayersByVote(3);
    bestPlayersByPoint.value = await fetchBestPlayersByPoint(3);
    bestPlayers.value = bestPlayersByPoint.value;

    refreshSkinViewers();
  } catch (err) {
    console.error("Failed to fetch best players:", err);
  }
});

function scoreboardTitleSwitcher(event) {
  if (scoreboardTitle.value === "Best voters") {
    scoreboardTitle.value = "Best players";
    scoreboardUnit.value = "points";

    bestPlayers.value = bestPlayersByPoint.value;
  } else {
    scoreboardTitle.value = "Best voters";
    scoreboardUnit.value = "votes";

    bestPlayers.value = bestPlayersByVote.value;
  }

  refreshSkinViewers();
}

function refreshSkinViewers() {
  // wait a bit, to allow the canvas to load
  setTimeout(() => {
    initializeSkinViewers();
  }, 100);
}
</script>

<style scoped>
  .podium {
    transform: scale(0.4);
    transform-origin: top left;
  }

  .podium .content {
    display: flex;
    justify-content: center;
    gap: 6%;
  }

  .podium .title {
    width: 80%;
    margin-left: auto;
    margin-right: auto;
    margin-top: 1.5%;
    text-align: center;
    color: #fff;
    background-color: #160020d1;
    border: solid 3px #ff7300;
    border-radius: 10px;
  }

  .podium .title:hover, .podium .titleBtn:hover {
    cursor: pointer;
  }


  .podium .titleBtn {
    background-color: #00000000;
    text-align: center;
    color: #fff;
    font-size: 250%;
    font-weight: 700;
    white-space: nowrap;
    border: none;
  }

  .p2, .p1, .p3 {
    align-self: flex-end;
    width: 20%;
  }

  .podium .shape {
    background-color: #160020d1;
    border-radius: 10px;
    border: solid 3px #ff7300;
    position: relative;
    padding: 40px 50px;
  }

  .p2 .shape {
    padding-top: 37%;
  }

  .p1 .shape {
    padding-top: 55%;
  }

  .p3 .shape {
    padding-top: 25%;
  }

  .podium .player-skin {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 10px;
  }

  .podium .textContainer {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    color: white;
  }

  .podium .playerName {
    font-weight: 700;
    font-size: 60%;
    color: #d4af37;
    text-align: center;
    transform: scale(2);

  }

  .podium .p2 .rank {
    font-weight: 600;
    font-size: 225%;
  }

  .podium .p1 .rank {
    font-weight: 650;
    font-size: 300%;
  }

  .podium .p3 .rank {
    font-weight: 550;
    font-size: 175%;
  }

  .podium .score {
    font-weight: 500;
  }


</style>
