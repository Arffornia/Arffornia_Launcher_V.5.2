<template>
<div class="shop-container">
  <p id="shop-title"></p>

  <div class="item-container">
    <div class="item-title"</div>
    <div class="item-description"></div>
  </div>
</div>
</template>

<script setup>

</script>

<style scoped>
#title {
  font-size: 300%;
  font-weight: 500;

  border-left: 4px solid #ff7300;
  border-top-left-radius: 3px;
  border-bottom-left-radius: 3px;
}

.item-title {
  font-size: 200%;
  font-weight: 500;
}

.item-description {
  font-size: 110%;
  font-weight: 400;
}

.item-container {
  color: #fff;
  border: solid 3px #ff7300;
  padding: 20px;
  backdrop-filter: blur(4px);
}
</style>
