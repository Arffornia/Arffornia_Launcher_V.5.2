import { defineStore } from 'pinia';

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
  }),
  actions: {
    addNotification(message, type = "msg") {
      const id = Date.now();
      this.notifications.push({ id, message, type });
    },
    removeNotification(id) {
      const index = this.notifications.findIndex((notif) => notif.id === id);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    },
  },
});
