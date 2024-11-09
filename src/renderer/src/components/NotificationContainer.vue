<template>
  <div class="notification-content">
    <div ref="notificationsContainer" class="notification-container">
      <Notification
        v-for="notif in notifications"
        :key="notif.id"
        :id="notif.id"
        :message="notif.message"
        @close="removeNotification(notif.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useNotificationStore } from '../stores/notificationStore';
import Notification from '../components/Notification.vue';

const notificationStore = useNotificationStore();
const notifications = notificationStore.notifications;

function addNotif(message) {
  notificationStore.addNotification(message);
}

function removeNotification(id) {
  notificationStore.removeNotification(id);
}

onMounted(() => {
  addNotif("Test add notif");
});
</script>

<style scoped>
.notification-container {
  position: absolute;
  top: 15%;
  right: 0%;
  z-index: 99;
  padding-right: 2%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
</style>
