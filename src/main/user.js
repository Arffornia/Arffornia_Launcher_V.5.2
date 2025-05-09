import { logger } from ".";
import { app } from 'electron'

class User {
  constructor(name) {
    this.name = name;
    this.isAuth = false;
    this.lang = 'en';
  }

  setIsAuth(authStatus) {
    logger.info("Turn " + authStatus + " the authStatus");
    this.isAuth = authStatus;
  }

  setLang(lang) {
    this.lang = lang;
  }

  getLang() {
    return this.lang;
  }

  getIsAuth() {
    return this.isAuth;
  }

  setName(name) {
    logger.info("Set the current user name to: " + name);
    this.name = name;
  }

  getName() {
    return this.name;
  }
}

function detectSystemLang() {
  const rawLang = app.getLocale();
  const baseLang = rawLang.split('-')[0];

  const supportedLangs = ['fr', 'en'];
  return supportedLangs.includes(baseLang) ? baseLang : 'en';
}

const currentUser = new User("NoName", false, detectSystemLang());

export default currentUser;
