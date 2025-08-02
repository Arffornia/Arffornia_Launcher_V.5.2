<template>
  <div class="settings-content">
    <p id="page-title">{{ t('settings.title') }}</p>
    <div class="section-container">
      <div class="section-box">
        <p class="title">{{ t('settings.game.title') }}</p>
        <div class="info">
          <div class="info-list">
            <div class="content">
              {{ t('settings.game.ram') }}
              <div class="container">
                <div class="select">
                  <select id="ram-select" v-if="ramOptions.length" v-model="selectedRAM" @change="onRamChangeEvent">
                    <option v-for="ram in ramOptions" :key="ram" :value="ram">
                      {{ ram }}Go
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="content">
              {{ t('settings.game.language') }}
              <div class="select">
                <select id="lang-select" v-model="userStore.selectedLang" @change="onLangChangeEvent">
                  <option v-for="lang in userStore.availableLangs" :key="lang" :value="lang">
                    {{ lang.toUpperCase() }}
                  </option>
                </select>
              </div>
            </div>

            <div class="content">
              {{ t('settings.game.logout') }}
              <input @click="logoutMSEvent" class="mediumBtn" type="button" :value="t('settings.game.logout_btn')">
            </div>

          </div>
        </div>
      </div>

      <div class="section-box">
        <p class="title">{{ t('settings.launcher.title') }}</p>
        <div class="info">
          <div class="info-list">

            <div class="content">
              {{ t('settings.launcher.game_file') }}
              <input @click="openLocalGameFileEvent" class="mediumBtn" type="button" :value="t('settings.launcher.game_file_btn')">
            </div>

            <div class="content">
              {{ t('settings.launcher.launcher_version') }}
              <p id="launcherVersion">Alpha 0.1.10</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../stores/userStore';

import { useI18n } from 'vue-i18n';

const { t } = useI18n()
const { locale } = useI18n();

const totalRAM = ref(0);
const ramOptions = ref([]);
const selectedRAM = ref(5);

const userStore = useUserStore();

onMounted(async () => {
  await initRam();
});

async function initRam() {
  const savedSelectedRam = await window.api.saverLoad("allocatedRam");
  if (savedSelectedRam !== '') {
    selectedRAM.value = savedSelectedRam;
  }

  totalRAM.value = await window.api.getTotalRAM();
  ramOptions.value = Array.from({ length: totalRAM.value }, (_, i) => i + 1);
}

const onLangChangeEvent = () => {
  userStore.setLang(locale, userStore.selectedLang);
};

const onRamChangeEvent = () => {
  window.api.saverSave("allocatedRam", selectedRAM.value);
};

function openLocalGameFileEvent() {
  window.api.openLocalGameFile();
}

function logoutMSEvent() {
  window.api.logoutMS();
  userStore.logout();
}
</script>

<style scoped>
select {
  /* Reset Select */
  appearance: none;
  outline: 10px red;
  border: 0;
  box-shadow: none;
  /* Personalize */
  flex: 1;
  padding: 0 1em;
  color: #fff;
  font-weight: 700;
  font-size: 100%;
  background-color: #2c3e50;
  background-image: none;
  cursor: pointer;
}

/* Custom Select wrapper */
.select {
  position: relative;
  display: flex;
  width: 10em;
  height: 3em;
  border-radius: 7px;
  overflow: hidden;
  border: 2px solid transparent;
}

.select:hover {
  transition: .25s all ease;
  border: 2px solid #f39c12;
}

/* Arrow */
.select::after {
  content: '\25BC';
  position: absolute;
  top: 0;
  right: 0;
  padding: 1em;
  background-color: #34495e;
  transition: .25s all ease;
  pointer-events: none;
}

/* Transition */
.select:hover::after {
  color: #f39c12;
}

#page-title {
  font-size: 250%;
  font-weight: 800;
  margin: 0%;
  margin-top: 60px;
  margin: 60px 0px 10px 0px;
}

#launcherVersion {
  font-weight: 700;
  font-size: 125%;
  color: #ff7300;
}

.info-list {
  padding-left: 30px;
  display: flex;
  flex-direction: column;
  gap: 25px;

}

.info-list .content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-list .content::before {
  content: '⮚';
}

.section-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.settings-content {
  padding: 0em 2em;
  color: #fff;
}

.section-box {
  padding: 20px 25px;
  border: solid 3px #ff7300;
  border-radius: 10px;
  background-color: #160020d1;
}

.section-box .title {
  font-weight: 700;
  font-size: 175%;
  margin: 0px 0px 35px 0px;
}

.mediumBtn {
  height: 50px;
  font-weight: 1000;
  min-width: 200px;
  font-size: 125%;
  border-radius: 5px;
  padding: 2px 10px;
  transition: 0.3s all ease;
  background-color: #ff7300;
  display: block;
  outline: none;
  border: none;
  width: fit-content;
  color: white;
}

.mediumBtn:hover {
  font-size: 140%;
  box-shadow: 0px 15px 20px #ff730097;
  transform: translateY(-3px);
}
</style>
