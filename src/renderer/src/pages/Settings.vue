<template>
  <div class="settings-content">
    <p id="page-title">Settings :</p>


    <div class="section-container">
      <div class="section-box">
        <p class="title">Game settings :</p>
        <div class="info">
          <ul>
            <li class="content">Allocated Ram</li>
            <li class="content">Logout</li>
          </ul>
        </div>
      </div>

      <div class="section-box">
        <p class="title">Launcher settings :</p>
        <div class="info">
          <ul>
            <li class="content">Launcher install location</li>
            <li class="content">Launcher version: Alpha 0.1.0</li>
          </ul>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
#page-title {
  font-size: 250%;
  font-weight: 800;
}

.section-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.settings-content {
  padding: 2em;
  color: #fff;
}

.section-box {
  padding: 0px 25px;
  border: solid 3px #ff7300;
  border-radius: 10px;
  background-color: #160020d1;
}

.section-box .title {
  font-weight: 700;
  font-size: 175%;
}
</style>
