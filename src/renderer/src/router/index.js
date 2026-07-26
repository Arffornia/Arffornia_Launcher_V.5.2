import { createRouter, createWebHistory } from 'vue-router';
import MainLayout from '../components/MainLayout.vue';
import Home from '../pages/Home.vue';
import Settings from '../pages/Settings.vue';
import Profile from '../pages/Profile.vue';
import Highlight from '../pages/Highlight.vue';
import Notification from '../pages/Notification.vue';
import Shaders from '../pages/Shaders.vue';

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: Home },
      { path: 'settings', component: Settings },
      { path: 'profile/:username?', component: Profile, props: true },
      { path: 'notification', component: Notification },
      { path: 'highlight', component: Highlight },
      { path: 'shaders', component: Shaders }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
