<template>
  <div class="main-layout">
    <nav>
      <!-- Profile btn management section -->
      <div class="top-nav-link">
        <router-link v-if="userStore.isAuth && userStore.username" class="nav-link" :to="`/profile/${userStore.username}`" exact>
          <img :src="userStore.profileImg" :alt="t('nav.profile')" :title="t('nav.profile')">
        </router-link>

        <a v-else class="nav-link" @click.prevent="userStore.login">
          <img :src="userStore.profileImg" :alt="t('nav.login')" :title="t('nav.login')">
        </a>
      </div>
      <!-- End profile btn management section -->

      <div class="middle-nav-link">
        <router-link class="nav-link" to="/" exact :title="t('nav.home')">
          <img src="@res/img/Crafting_Table.png" :alt="t('nav.home')" />
        </router-link>

        <router-link class="nav-link" to="/highlight" exact :title="t('nav.highlight')">
          <img src="@res/img/icon/photo/photo.png" :alt="t('nav.highlight')" />
        </router-link>

        <router-link class="nav-link" to="/notification" exact :title="t('nav.notifications')">
          <img src="@res/img/icon/bell/bell.png" :alt="t('nav.notifications')" />
        </router-link>

        <router-link class="nav-link" to="/shaders" exact :title="t('nav.shaders')">
          <img src="@res/img/icon/shader/shader-icon.png" :alt="t('nav.shaders')" />
        </router-link>
      </div>

      <div class="bottom-nav-link">
        <router-link class="nav-link" to="/settings" exact :title="t('nav.settings')">
          <img src="@res/img/icon/settings/labour-day.png" :alt="t('nav.settings')" />
        </router-link>
      </div>
    </nav>

    <span class="v-separator"></span>

    <div class="scroll-container">
      <TopBar />
      <NotificationContainer />
      <GlobalProgressBar />

      <transition name="fade" mode="out-in">
        <router-view />
      </transition>
    </div>
  </div>
</template>

<script setup>
import { useUserStore } from '../stores/userStore';
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import NotificationContainer from './NotificationContainer.vue';
import { useNotificationStore } from '../stores/notificationStore';
import TopBar from './TopBar.vue';
import GlobalProgressBar from './GlobalProgressBar.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const userStore = useUserStore();
const notificationStore = useNotificationStore();

const router = useRouter();

const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    console.info("Escape btn pressed.");
    router.back();
  }
};

onMounted(() => {
  userStore.loginNoReAsk();

  // The main process sends translation keys + params, never display strings.
  window.api.addNotification((messageKey, type, params) => {
    notificationStore.addNotification(messageKey, type, params)
  });

  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
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
  width: 60px;
  height: 60px;
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
