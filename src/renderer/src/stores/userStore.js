import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    isAuth: false,
    profileImg: new URL('../../../../resources/img/steve_head.png', import.meta.url).href,
  }),

  actions: {
    async login() {
      if (!this.isAuth) {
        try {
          const authSuccess = await window.api.loginMS();

          if (authSuccess) {
            this.isAuth = true;
            await this.updateProfileImage();
            window.api.logger("info", 'Success to auth.');
          } else {
            window.api.logger("error", `Failed to auth.`);
          }
        } catch (error) {
          window.api.logger("error", `Error during MS auth: ${error}`);
        }
      }
    },

    logout() {
      this.isAuth = false;
      this.profileImg = new URL('../../../../resources/img/steve_head.png', import.meta.url).href;
    },

    async loginNoReAsk() {
      if (!this.isAuth) {
        const authSuccess = await window.api.loginMSNoReAsk();

        if (authSuccess) {
          this.isAuth = true;
          await this.updateProfileImage();
          window.api.logger("info", "Success to re auth.");
        }
      }
    },

    async updateProfileImage() {
      try {
        const userName = await window.api.getUserName();
        this.profileImg = `https://minotar.net/avatar/${userName}/50`;
      } catch (error) {
        window.api.logger("error", `Error fetching profile image: ${error}`);
        this.profileImg = '/src/assets/img/steve_head.png';
      }
    },
  },
});
