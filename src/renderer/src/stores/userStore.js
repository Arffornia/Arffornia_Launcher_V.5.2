import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    isAuth: false,
    profileImg: '/src/assets/img/steve_head.png',
    profileHeadImage: '/src/assets/img/TheGostMcHead.png',
  }),

  actions: {
    login() {
      this.isAuth = true;
      this.profileImg = this.profileHeadImage;
    },
    logout() {
      this.isAuth = false;
      this.profileImg = '/src/assets/img/steve_head.png';
    },
    checkAuth() {
      this.isAuth = window.api.isAuth();
      if (this.isAuth) {
        this.profileImg = this.profileHeadImage;
      }
    }
  }
});
