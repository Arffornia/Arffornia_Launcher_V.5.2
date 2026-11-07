// main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';
import i18n from './i18n/translator';
import { loadEnvironment } from './js/environment';

import './assets/global.css'

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);

loadEnvironment().finally(() => app.mount('#app'));
