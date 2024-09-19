<template>
  <div class="settings-content">
    <p id="page-title">Settings :</p>


    <div class="section-container">
      <div class="section-box">
        <p class="title">Game settings :</p>
        <div class="info">
          <div class="info-list">

            <div class="content">
              Allocated Ram:
              <div class="container">
                <div class="select">
                  <select>
                    <option value="1">1Go</option>
                    <option value="2">2Go</option>
                    <option value="3">3Go</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="content">
              Logout from your Minecraft Account:
              <input @click="logoutBtnEvent" class="mediumBtn" type="button" value="Logout">
            </div>

          </div>
        </div>
      </div>

      <div class="section-box">
        <p class="title">Launcher settings :</p>
        <div class="info">
          <div class="info-list">

              <div class="content">
                Launcher install location:
                <input @click="localFileBtnEvent" class="mediumBtn" type="button" value="Open">
              </div>

              <div class="content">
                Launcher version:
                <p id="launcherVersion">Alpha 0.1.0</p>
              </div>

          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
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

.mediumBtn{
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
