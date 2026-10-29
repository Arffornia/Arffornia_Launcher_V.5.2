import { defineStore } from 'pinia';

let nextId = 0;

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
  }),
  actions: {
    /**
     * Queues a notification. The text is a vue-i18n key, translated when rendered.
     * @param {string} messageKey translation key, e.g. 'notifications.shader_installed'
     * @param {'msg' | 'update' | 'error'} type
     * @param {Record<string, unknown>} [params] named interpolation values
     */
    addNotification(messageKey, type = "msg", params = {}) {
      const id = `${Date.now()}-${nextId++}`;
      this.notifications.push({ id, messageKey, params, type });
    },
    removeNotification(id) {
      const index = this.notifications.findIndex((notif) => notif.id === id);
      if (index !== -1) {
        this.notifications.splice(index, 1);
      }
    },
  },
});
