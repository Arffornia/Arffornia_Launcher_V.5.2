<template>
  <div class="main-layout">
    <nav>
      <div class="top-nav-link">
        <router-link class="nav-link" to="/profile" exact>
          <img src="@res/img/TheGostMcHead.png" alt="Profile">
        </router-link>
      </div>

      <div class="middle-nav-link">
        <router-link class="nav-link" to="/" exact>
          <img src="@res/img/Crafting_Table.png" alt="Home">
        </router-link>

        <router-link class="nav-link" to="/highlight" exact>
          <img src="@res/img/icon/photo/photo.png" alt="Highlight">
        </router-link>

        <router-link class="nav-link" to="/notification" exact>
          <img src="@res/img/icon/bell/bell.png" alt="Notification">
        </router-link>
      </div>

      <div class="bottom-nav-link">
        <router-link class="nav-link" to="/settings" exact>
          <img src="@res/img/icon/settings/labour-day.png" alt="Settings">
        </router-link>
      </div>
    </nav>

    <span class="v-separator"></span>

    <router-view></router-view>
  </div>
</template>

<script setup>
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
}

nav {
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  box-sizing: border-box;
  background-color: #2c2f33;
}

nav a {
  margin: 10px 0;
  padding: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 15px;
  transition: background-color 0.3s;
}

.top-nav-link {
  margin-top: 5%;
}

.bottom-nav-link {
  margin-bottom: 5%;
}

.middle-nav-link {
  margin-top: auto;
  margin-bottom: auto;
}

.nav-link {
  background-color: #261d31;
}

.nav-link:hover {
  background-color: #b74512;
}

.nav-link.router-link-exact-active {
  background-color: #b74512;
}

nav img {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  transition: transform 0.3s;
  transform: scale(0.85);
}

nav .nav-link:hover img {
  transform: scale(0.925);
}

.v-separator {
  width: 3px;
  height: 80%;
  border-radius: 30px;
  background-color: #fff;
  margin-top: auto;
  margin-bottom: auto;
}

router-view {
  flex-grow: 1;
  padding: 10px;
  box-sizing: border-box;
}
</style>
