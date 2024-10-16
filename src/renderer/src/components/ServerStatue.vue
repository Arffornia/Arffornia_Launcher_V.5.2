<template>
  <div class="serverStatue-content">
    <img class="server-icon" src="@res/img/icon/server/icon-server.png" alt="">
    <p class="statue-info">{{ serverStatusDisplay }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { fetchServerStatus } from '../js/mcstatusAPI';

const serverStatusData = ref(null);
const serverStatusDisplay = ref("off");

onMounted(async () => {
  try {
    serverStatusData.value = await fetchServerStatus();

    if (serverStatusData.value === null || serverStatusData.value.online === false) {
      serverStatusDisplay.value = "off";
    } else if (serverStatusData.value.online === true) {
      const onlinePlayers = serverStatusData.value.players.online;
      const maxPlayers = serverStatusData.value.players.max;

      serverStatusDisplay.value = `${onlinePlayers} / ${maxPlayers}`;
    }
  } catch (err) {
    console.error("Failed to fetch server status:", err);
    serverStatusDisplay.value = "off";
  }
});
</script>




<style scoped>

  .serverStatue-content {
    display: flex;
    align-items: center;
  }

  .server-icon {
    height: 40px;
  }

  .statue-info {
    padding-left: 15px;
    color: #fff;
    font-size: 150%;
    font-weight: 600;
  }

</style>
