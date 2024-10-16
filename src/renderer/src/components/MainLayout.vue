<template>
  <div class="main-layout">
    <nav>
      <!-- Profile btn management section -->
      <div class="top-nav-link">
        <router-link v-if="userStore.isAuth" class="nav-link" to="/profile" exact>
          <img :src="userStore.profileImg" alt="Profile">
        </router-link>

        <a v-else class="nav-link" @click.prevent="userStore.login">
          <img :src="userStore.profileImg" alt="Login">
        </a>
      </div>
      <!-- End profile btn management section -->

      <div class="middle-nav-link">
        <router-link class="nav-link" to="/" exact>
          <img src="@res/img/Crafting_Table.png" alt="Home" />
        </router-link>

        <router-link class="nav-link" to="/highlight" exact>
          <img src="@res/img/icon/photo/photo.png" alt="Highlight" />
        </router-link>

        <router-link class="nav-link" to="/notification" exact>
          <img src="@res/img/icon/bell/bell.png" alt="Notification" />
        </router-link>
      </div>

      <div class="bottom-nav-link">
        <router-link class="nav-link" to="/settings" exact>
          <img src="@res/img/icon/settings/labour-day.png" alt="Settings" />
        </router-link>
      </div>
    </nav>

    <span class="v-separator"></span>

    <router-view></router-view>

    <div class="info-bar">
      <img class="info-btn" @click="openWebsite" src="@res/img/icon/internet/internet.png" alt="Arffornia Website" title="Arffornia Website">
      <img class="info-btn" @click="openDiscord" src="@res/img/icon/discord/discord.png" alt="Discord" title="Discord">
      <ServerStatue/>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '../stores/userStore';
import { onMounted } from 'vue';
import ServerStatue from '../components/ServerStatue.vue';

const userStore = useUserStore();

function openDiscord() {
  window.api.openDiscord();
}

function openWebsite() {
  window.api.openWebsite();
}

onMounted(() => {
  userStore.loginNoReAsk();
});

</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  background-image: url("@res/img/bg/mainBG.png");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  font-family: Montserrat, sans-serif;
  overflow: hidden;
}

.info-bar {
  position: absolute;
  top: 3%;
  right: 3%;
  border: solid 3px #ff7300;
  background-color: #09070a;
  border-radius: 15px;
  display: flex;
  gap: 20px;
  align-items: center;

  padding: 0 20px;
}

.info-btn {
  width: 30px;
  height: 30%;
}

nav {
  margin: 0 10px;
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  box-sizing: border-box;
}

nav a{
  padding: 5px;
  display: flex;
  gap: 5px;
  border-radius: 10px;
  transition: background-color 0.3s;
}

.top-nav-link {
  margin-top: 10%;
}

.bottom-nav-link {
  margin-bottom: 10%;
}

.middle-nav-link {
  margin-top: auto;
  margin-bottom: auto;
  border-radius: 15px;
  border: solid 10px #09070a;
  background-color: #09070a;
  display: flex;
  flex-direction: column;
  gap: 10px;
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
  height: 75%;
  border-radius: 30px;
  background-color: #fff;
  margin-top: auto;
  margin-bottom: auto;
}

</style>
