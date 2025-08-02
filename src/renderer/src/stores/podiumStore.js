import { defineStore } from "pinia";
import { ref } from "vue";
import { fetchBestPlayersByPoint, fetchBestPlayersByVote } from "../js/arfforniaApi.js";
import { initializeSkinViewers } from '../js/skinviewer.js';


export const usePodiumStore = defineStore('podium', () => {
  const bestPlayers = ref(null);
  const bestPlayersByVote = ref(null);
  const bestPlayersByPoint = ref(null);

  const activeScoreboard = ref("votes");

  const fetchData = async () => {
    try {
      bestPlayersByVote.value = await fetchBestPlayersByVote(3);
      bestPlayersByPoint.value = await fetchBestPlayersByPoint(3);

      bestPlayers.value = activeScoreboard.value === 'votes' ? bestPlayersByVote.value : bestPlayersByPoint.value;

      setTimeout(() => {
        initializeSkinViewers();
      }, 100);
    } catch (err) {
      window.api.logger("error", `Failed to fetch best players: ${err}`);
    }
  };

  return {
    bestPlayers,
    bestPlayersByVote,
    bestPlayersByPoint,
    activeScoreboard,
    fetchData,
  };
});
