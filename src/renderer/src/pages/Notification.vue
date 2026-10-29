<template>
  <div class="notification-content">
    <h2>{{ t('notifications_page.title') }}</h2>
    <p>{{ t('notifications_page.empty') }}</p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.notification-content {
  padding: 2em;
}
</style>
