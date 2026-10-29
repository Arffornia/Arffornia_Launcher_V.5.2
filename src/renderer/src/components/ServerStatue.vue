<template>
  <div class="serverStatue-content">
    <img class="server-icon" src="@res/img/icon/server/icon-server.png" alt="">
    <p class="statue-info">{{ serverStatusDisplay }}</p>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { fetchServerStatus } from '../js/mcstatusAPI';

const serverStatusData = ref(null);
const { t } = useI18n();
const players = ref(null);
const serverStatusDisplay = computed(() =>
  players.value ? t('server_status.players', players.value) : t('server_status.offline')
);

onMounted(async () => {
  try {
    serverStatusData.value = await fetchServerStatus();

    if (serverStatusData.value === null || serverStatusData.value.online === false) {
      players.value = null;
    } else if (serverStatusData.value.online === true) {
      const onlinePlayers = serverStatusData.value.players.online;
      const maxPlayers = serverStatusData.value.players.max;

      players.value = { online: onlinePlayers, max: maxPlayers };
    }
  } catch (err) {
    window.api.logger("error", `Failed to fetch server status: ${err}`);
    players.value = null;
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
