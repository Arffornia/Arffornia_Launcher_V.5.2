<template>
  <div class="notification-content">
    <h2>Home page</h2>
    <p>This is the home page content.</p>

    <div class="podium">
      <div class="content">
        <div class="p2">
          <p class="playerName">{{ bestPlayers ? bestPlayers[1]?.name : 'Chargement...' }}</p>

          <div class="player-skin">
            <a :href="bestPlayers ? `/profile/${bestPlayers[1]?.name}` : '#'" title="Show profile">
              <canvas class="skin_viewer" :data-username="bestPlayers ? bestPlayers[1]?.name : 'MHF_Steve'"></canvas>
            </a>
          </div>

          <div class="shape">
            <div class="textContainer">
              <div class="rank">#2</div>
              <div class="score">{{ bestPlayers ? `${bestPlayers[1]?.vote_count} points` : '...' }}</div>
            </div>
          </div>
        </div>

        <div class="p1">
          <p class="playerName">{{ bestPlayers ? bestPlayers[0]?.name : 'Chargement...' }}</p>

          <div class="player-skin">
            <a :href="bestPlayers ? `/profile/${bestPlayers[0]?.name}` : '#'" title="Show profile">
              <canvas class="skin_viewer" :data-username="bestPlayers ? bestPlayers[0]?.name : 'MHF_Steve'"></canvas>
            </a>
          </div>

          <div class="shape">
            <div class="textContainer">
              <div class="rank">#1</div>
              <div class="score">{{ bestPlayers ? `${bestPlayers[0]?.vote_count} points` : '...' }}</div>
            </div>
          </div>
        </div>

        <div class="p3">
          <p class="playerName">{{ bestPlayers ? bestPlayers[2]?.name : 'Chargement...' }}</p>

          <div class="player-skin">
            <a :href="bestPlayers ? `/profile/${bestPlayers[2]?.name}` : '#'" title="Show profile">
              <canvas class="skin_viewer" :data-username="bestPlayers ? bestPlayers[2]?.name : 'MHF_Steve'"></canvas>
            </a>
          </div>

          <div class="shape">
            <div class="textContainer">
              <div class="rank">#3</div>
              <div class="score">{{ bestPlayers ? `${bestPlayers[2]?.vote_count} points` : '...' }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="title">
        <p>Meilleurs joueurs</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { initializeSkinViewers } from '../js/skinviewer.js';
import { fetchBestPlayersByVote } from '../js/arfforniaApi.js';

const bestPlayers = ref(null);
const error = ref(null);

onMounted(async () => {
  initializeSkinViewers();
  try {
    bestPlayers.value = await fetchBestPlayersByVote(3);
  } catch (err) {
    error.value = err.message;
    console.error("Failed to fetch best players:", err);
  }
});
</script>


<style scoped>

  .podium .content {

    display: flex;
    justify-content: center;
    gap: 6%;
  }

  .podium .title {
    padding: 15px;
    width: 57%;
    margin-left: auto;
    margin-right: auto;
    margin-top: 1.5%;

    text-align: center;
    color: #fff;
    border-radius: 10px;
    font-size: 250%;
    font-weight: 700;
    background-color: #2C3239;

    border: solid 3px #ff7300;
  }

  .p2, .p1, .p3 {
    align-self: flex-end;
    width: 15%;

  }

  .podium .shape {
    background-color: #2C3239;
    border-radius: 10px;
    border: solid 3px #ff7300;

  }

  .podium .shape {
    position: relative;
    padding: 15px;
  }

  .p2 .shape {
    padding-top: 55%;
  }

  .p1 .shape {
    padding-top: 75%;
  }

  .p3 .shape {
    padding-top: 40%;
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
    font-size: 150%;
    color: #d4af37;
    text-align: center;
  }

  .podium .p2 .rank {
    font-weight: 650;
    font-size: 300%;
  }

  .podium .p1 .rank {
    font-weight: 700;
    font-size: 375%;
  }

  .podium .p3 .rank {
    font-weight: 600;
    font-size: 225%;
  }

  .podium .score {
    font-weight: 500;
  }


</style>
