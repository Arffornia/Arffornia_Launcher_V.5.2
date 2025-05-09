import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    isAuth: false,
    profileImg: new URL('../../../../resources/img/steve_head.png', import.meta.url).href,
    selectedLang: 'en',
    availableLangs: ['fr', 'en'],
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

    async initLang(locale) {
      const availableLangs = ['fr', 'en'];

      const savedLang = await window.api.saverLoad("lang");

      if (savedLang && availableLangs.includes(savedLang)) {
        this.selectedLang = savedLang;
        locale.value = savedLang;
        return;
      }

      const systemLangRaw = await window.api.getSystemLang();
      const baseLang = systemLangRaw.split('-')[0]; // en-us cases

      const langToSet = availableLangs.includes(baseLang) ? baseLang : 'en';

      this.setLang(locale, langToSet);
    },


    setLang(locale, lang) {
      if (this.availableLangs.includes(lang)) {
        this.selectedLang = lang;
        locale.value = lang;
        window.api.saverSave("lang", lang);
        window.api.setLang(lang);
      }
    },
  },
});
