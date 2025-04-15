<template>
  <div class="podium">
    <div class="content">
      <div class="p2">
        <p class="playerName">{{ podiumStore.bestPlayers ? podiumStore.bestPlayers[ 1 ]?.name : 'Chargement...' }}
        </p>
        <div class="player-skin">
          <router-link class="nav-link"
            :to="podiumStore.bestPlayers ? `/profile/${podiumStore.bestPlayers[ 1 ]?.name}` : '#'"
            title="Show profile" exact>
            <canvas class="skin_viewer" :data-width="skinWidth" :data-height="skinHeight"
              :data-username="podiumStore.bestPlayers ? podiumStore.bestPlayers[ 1 ]?.name : 'MHF_Steve'"></canvas>
          </router-link>
        </div>
        <div class="shape">
          <div class="textContainer">
            <div class="rank">#2</div>
            <div class="score">{{ podiumStore.bestPlayers ? `${podiumStore.bestPlayers[ 1 ]?.value}
              ${podiumStore.scoreboardUnit}` : '...' }}</div>
          </div>
        </div>
      </div>

      <div class="p1">
        <p class="playerName">{{ podiumStore.bestPlayers ? podiumStore.bestPlayers[ 0 ]?.name : 'Chargement...' }}
        </p>
        <div class="player-skin">
          <router-link class="nav-link"
            :to="podiumStore.bestPlayers ? `/profile/${podiumStore.bestPlayers[ 0 ]?.name}` : '#'"
            title="Show profile" exact>
            <canvas class="skin_viewer" :data-width="skinWidth" :data-height="skinHeight"
              :data-username="podiumStore.bestPlayers ? podiumStore.bestPlayers[ 0 ]?.name : 'MHF_Steve'"></canvas>
          </router-link>
        </div>
        <div class="shape">
          <div class="textContainer">
            <div class="rank">#1</div>
            <div class="score">{{ podiumStore.bestPlayers ? `${podiumStore.bestPlayers[ 0 ]?.value}
              ${podiumStore.scoreboardUnit}` : '...' }}</div>
          </div>
        </div>
      </div>

      <div class="p3">
        <p class="playerName">{{ podiumStore.bestPlayers ? podiumStore.bestPlayers[ 2 ]?.name : 'Chargement...' }}
        </p>
        <div class="player-skin">
          <router-link class="nav-link"
            :to="podiumStore.bestPlayers ? `/profile/${podiumStore.bestPlayers[ 2 ]?.name}` : '#'"
            title="Show profile" exact>
            <canvas class="skin_viewer" :data-width="skinWidth" :data-height="skinHeight"
              :data-username="podiumStore.bestPlayers ? podiumStore.bestPlayers[ 2 ]?.name : 'MHF_Steve'"></canvas>
          </router-link>
        </div>
        <div class="shape">
          <div class="textContainer">
            <div class="rank">#3</div>
            <div class="score">{{ podiumStore.bestPlayers ? `${podiumStore.bestPlayers[ 2 ]?.value}
              ${podiumStore.scoreboardUnit}` : '...' }}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="title" :title="`Switch to ${podiumStore.scoreboardUnit}`" @click="scoreboardTitleSwitcher">
      <button class="titleBtn">
        <p>{{ podiumStore.scoreboardTitle }}</p>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePodiumStore } from '../stores/podiumStore.js';
import { initializeSkinViewers } from '../js/skinviewer.js';

const skinWidth = ref(66);
const skinHeight = ref(100);

const podiumStore = usePodiumStore();


onMounted(() => {
  refreshSkinViewers();
});

function scoreboardTitleSwitcher(event) {
  if (podiumStore.scoreboardTitle === "Best voters") {
    podiumStore.scoreboardTitle = "Best players";
    podiumStore.scoreboardUnit = "points";

    podiumStore.bestPlayers = podiumStore.bestPlayersByPoint;
  } else {
    podiumStore.scoreboardTitle = "Best voters";
    podiumStore.scoreboardUnit = "votes";

    podiumStore.bestPlayers = podiumStore.bestPlayersByVote;
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
  width: 30%;
  min-width: 400px;
}

.podium .content {
  display: flex;
  justify-content: center;
  gap: 6%;
  min-height: 300px;
}

.podium .title {
  width: 80%;
  margin-left: auto;
  margin-right: auto;
  margin-top: 1.5%;
  text-align: center;
  color: #fff;
  background-color: #160020d1;
  border: solid 2px #ff7300;
  border-radius: 10px;
}

.podium .title:hover,
.podium .titleBtn:hover {
  cursor: pointer;
}


.podium .titleBtn {
  background-color: #00000000;
  text-align: center;
  color: #fff;
  font-size: 125%;
  font-weight: 600;
  white-space: nowrap;
  border: none;
}

.p2,
.p1,
.p3 {
  align-self: flex-end;
  width: 20%;
}

.podium .shape {
  background-color: #160020d1;
  border-radius: 10px;
  border: solid 2px #ff7300;
  position: relative;
  padding: 20px 25px;
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
  font-size: 30%;
  color: #d4af37;
  text-align: center;
  transform: scale(2);

}

.podium .p2 .rank {
  font-weight: 600;
  font-size: 112.5%;
}

.podium .p1 .rank {
  font-weight: 650;
  font-size: 150%;
}

.podium .p3 .rank {
  font-weight: 550;
  font-size: 87.5%;
}

.podium .score {
  font-weight: 300;
  font-size: 60%;
}
</style>
