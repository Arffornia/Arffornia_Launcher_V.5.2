class User
{
  constructor(name)
  {
    this.name = name;
    this.isAuth = false;
  }

  setIsAuth(authStatus) {
    console.log("Turn " + authStatus + " the authStatus");
    this.isAuth = authStatus;
  }

  getIsAuth() {
    return this.isAuth;
  }

  setName(name) {
    console.log("Set the current user name to: " + name);
    this.name = name;
  }

  getName() {
    return this.name;
  }
}

const currentUser = new User("NoName", false);

export default currentUser;
