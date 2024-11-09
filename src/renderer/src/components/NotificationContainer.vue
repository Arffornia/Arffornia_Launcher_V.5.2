<template>
  <div class="notification-content">
    <div ref="notificationsContainer" class="notification-container"></div>
  </div>
</template>

<script setup>
import { onMounted, h, render,  ref } from 'vue';
import Notification from '../components/Notification.vue';

const notificationsContainer = ref(null);

function addNotif(message) {
  const notificationNode = document.createElement('div');
  notificationsContainer.value.appendChild(notificationNode);

  const closeNotification = () => {
    notificationsContainer.value.removeChild(notificationNode);
  };

  const vnode = h(Notification, {
    message,
    onClose: closeNotification,
  });

  render(vnode, notificationNode);
}

onMounted(() => {
  addNotif("Test add notif");
});
</script>

<style scoped>
.notification-container {
  position: absolute;
  top: 15%;
  right: 2%;
  z-index: 99;
}
</style>
