<template>
  <div @click="clickEvent" class="notification-content">
    <a @click.stop="closeEvent" class="close-btn">x</a>
    <img class="image" src="@res/img/icon/update/update_white.png" alt="Close" title="Close"/>
    <p class="title">{{ props.message }}</p>
  </div>
</template>

<script setup>
const props = defineProps({
  message: {
    type: String,
    required: true,
  },
  id: {
    type: [String, Number],
    required: true,
  },
});

const emit = defineEmits();

function clickEvent() {
  console.log('Click on the notif !')
}

function closeEvent() {
  console.log('Close the notif !')
  emit('close', props.id);
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
  animation: slideIn 2s forwards;
}

.image {
  margin-top: auto;
  margin-bottom: auto;
  width: 40px;
  height: 40px;
  margin-left: 15px;
  border-radius: 15px;
}

.title {
  margin-top: auto;
  margin-bottom: auto;
  color: #fff;
  padding-left: 15px;
}

.close-btn {
  width: 20px;
  height: 20px;
  position: absolute;
  top: 0%;
  right: 0%;
  color: #fff;
  font-weight: 700;
  border: 2px solid #ff7300;
  border-radius: 45px;
  text-align: center;
  cursor: pointer;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
