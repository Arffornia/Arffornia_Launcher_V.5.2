import { logger } from ".";

class User
{
  constructor(name)
  {
    this.name = name;
    this.isAuth = false;
  }

  setIsAuth(authStatus) {
    logger.info("Turn " + authStatus + " the authStatus");
    this.isAuth = authStatus;
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

const currentUser = new User("NoName", false);

export default currentUser;
