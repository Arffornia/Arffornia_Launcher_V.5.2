import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    isAuth: false,
    profileImg: '/src/assets/img/steve_head.png',
    profileHeadImage: '/src/assets/img/TheGostMcHead.png',
  }),

  actions: {
    async login() {
      if (!this.isAuth) {
        try {
          const authSuccess = await window.api.loginMS();

          if (authSuccess) {
            this.isAuth = true;
            this.profileImg = this.profileHeadImage;
            console.log('Success to auth.');
          } else {
            console.error('Failed to auth.');
          }
        } catch (error) {
          console.error('Error during MS auth:', error);
        }
      }
    },

    logout() {
      this.isAuth = false;
      this.profileImg = '/src/assets/img/steve_head.png';
    },

    async loginNoReAsk() {
      if (!this.isAuth) {
        const authSuccess = await window.api.loginMSNoReAsk();

        if (authSuccess) {
          this.isAuth = true;
          this.profileImg = this.profileHeadImage;
          console.log('Success to re auth.');
        }
      }
    }
  }
});
