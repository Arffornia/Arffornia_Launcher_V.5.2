import { logger } from ".";
import { app } from 'electron'

class User {
  constructor(name, isAuth = false, lang = 'en') {
    this.name = name;
    this.isAuth = isAuth;
    this.lang = lang;
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
  const rawLang = app.getLocale() || '';
  return rawLang.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

const currentUser = new User("NoName", false, detectSystemLang());

export default currentUser;
