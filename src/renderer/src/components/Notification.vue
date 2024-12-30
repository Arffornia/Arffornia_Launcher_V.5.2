<template>
  <div @click="clickEvent" class="notification-content">
    <a @click.stop="closeEvent" class="close-btn">x</a>
    <img class="image" :src="imageSrc" alt="Close" title="Close"/>
    <p class="title">{{ props.message }}</p>
    <p class="time">{{ notifTime }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const notifTime = ref(getCurrentTime());

const props = defineProps({
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  id: {
    type: [String, Number],
    required: true,
  },
});

const imageMap = {
  "msg": new URL('../../../../resources/img/icon/mail/email_icon.png', import.meta.url).href,
  "update": new URL('../../../../resources/img/icon/update/update_white.png', import.meta.url).href,
  "error": new URL('../../../../resources/img/icon/error/circle.png', import.meta.url).href,
};

const imageSrc = computed(() => {
  return imageMap[props.type] || imageMap["msg"];
});

const emit = defineEmits();

function clickEvent() {
  window.api.logger("info", `Click on the notif !`);
}

function closeEvent() {
  window.api.logger("info", `Close the notif !`);
  emit('close', props.id);
}

function getCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
</script>

<style scoped>
.notification-content {
  width: 300px;
  height: 90px;
  background-color: #261d31;
  border: 2px solid #ff7300;
  border-radius: 2em 20px 2.5em 0.2in;
  display: flex;
  position: relative;
  animation: slideIn 1s ease;
}

.image {
  margin-top: auto;
  margin-bottom: auto;
  height: 40px;
  max-width: 80px;
  margin-left: 15px;
}

.title {
  margin-top: auto;
  margin-bottom: auto;
  color: #fff;
  padding-left: 15px;
  font-size: 100%;
  line-height: 130%;
  white-space: pre-line;
}

.close-btn {
  width: 20px;
  height: 20px;
  position: absolute;
  top: 0;
  right: 0;
  color: #fff;
  font-weight: 700;
  border: 2px solid #ff7300;
  border-radius: 50%;
  text-align: center;
  cursor: pointer;
  background-color: #261d31;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

.time {
  margin: 0;
  position: absolute;
  bottom: 0%;
  right: 0%;

  padding-bottom: 7px;
  padding-right: 15px;

  color: #c2c2c2d3;
}
</style>
