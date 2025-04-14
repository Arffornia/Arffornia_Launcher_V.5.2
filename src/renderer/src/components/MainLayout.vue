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

    <div class="scroll-container">
      <NotificationContainer />
      <transition name="fade" mode="out-in">
        <router-view />
      </transition>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '../stores/userStore';
import { onMounted } from 'vue';
import NotificationContainer from './NotificationContainer.vue';
import { useNotificationStore } from '../stores/notificationStore';

const userStore = useUserStore();
const notificationStore = useNotificationStore();

onMounted(() => {
  userStore.loginNoReAsk();

  window.api.addNotification((message, type) => {
    notificationStore.addNotification(message, type)
  });
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

nav {
  margin: 0 10px;
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  box-sizing: border-box;
}

nav a {
  padding: 5px;
  display: flex;
  gap: 5px;
  border-radius: 10px;
  transition: background-color 0.3s;
}

.scroll-container {
  height: 100vh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  position: relative;
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
