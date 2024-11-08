<template>
  <div class="scroll-container">
    <div class="home-content">
      <!-- <img class="isoimg" src="@res/img/iso/testiso1ps.png" alt=""> -->
       <div class="podium-container">
          <Podium/>
       </div>

      <div class="playBox">
        <p id="title">ARFFORNIA</p>
        <div class="description">
          <p class="description-content">+ 330 Mods</p>
          <p class="description-content">+ 25 Paliers de progression</p>

        </div>
        <input @click="playBtnEvent" class="mediumPlayBtn" type="button" value="Jouer">
      </div>
      <div class="shop">
        <div class="shop-section">
          <p class="section-title">Arrivals: </p>
          <div class="items-container">
            <a v-for="item in newestItems" :key="item.id" @click.prevent="redirect_item_shop(item.img_url)" class="shop-item" title="See on Website">
              <div class="item-container">
                <img class="item-icon" :src="item.img_url" :alt="item.name" />
                <p class="item-title">{{ item.name }}</p>
                <p class="item-price">{{item.real_price }}</p>
              </div>
            </a>
          </div>
          <p class="section-title">This Week's Deals: </p>
          <div class="items-container">
            <a v-for="item in saleItems" :key="item.id" @click.prevent="redirect_item_shop(item.img_url)" class="shop-item" title="See on Website">
              <div class="item-container">
                <img class="item-icon" :src="item.img_url" :alt="item.name" />
                <p class="item-title">{{ item.name }}</p>
                  <p class="item-price">
                    <span class="item-price-sale">
                      {{ item.real_price }}
                    </span>
                      {{ item.promo_price }}
                  </p>
              </div>
            </a>
          </div>
          <p class="section-title">Best Sellers: </p>
          <div class="items-container">
            <a v-for="item in bestSellerItems" :key="item.id" @click.prevent="redirect_item_shop(item.img_url)" class="shop-item" title="See on Website">
              <div class="item-container">
                <img class="item-icon" :src="item.img_url" :alt="item.name" />
                <p class="item-title">{{ item.name }}</p>
                <p class="item-price">{{ item.real_price }}</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>

  <TopBar/>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Podium from '../components/Podium.vue';
import TopBar from '../components/TopBar.vue';
import { useUserStore } from '../stores/userStore';
import { fetchBestSellers, fetchNewestItems, fetchSaleItems } from '../js/arfforniaApi.js';

const userStore = useUserStore();
const bestSellerItems = ref([]);
const newestItems = ref([]);
const saleItems = ref([]);

onMounted(async () => {
  try {
    const bestSellerData = await fetchBestSellers(3);
    bestSellerItems.value = bestSellerData;

    const newestData = await fetchNewestItems(3);
    newestItems.value = newestData;

    const saleData = await fetchSaleItems(3);
    saleItems.value = saleData;
  } catch (error) {
    console.error("Error fetching items:", error.message);
  }
});

function redirect_item_shop(url) {
  window.api.openWebsite(url);
}

async function playBtnEvent() {
  if (!userStore.isAuth)
  {
    await userStore.login();
    if (!userStore.isAuth)
    {
      return;
    }
  }

  window.api.launchMC().then(() => {
    console.log('Minecraft launch command sent.');
  }).catch(err => {
    console.error('Failed to launch Minecraft:', err);
  });
}
</script>


<style scoped>
.scroll-container {
  height: 100vh;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  position: relative;
}

.isoimg {
  top: 20%;
  left: 20%;
  position: absolute;
  width: 1000px;
 }

#title {
  color: white;
  font-size: 400%;
  font-weight: 800;
  margin: 0;
}

.playBox {
  background: linear-gradient(135deg, rgba(33, 33, 33, 0.737) 0%, rgba(29, 29, 29, 0.236) 100%);
  box-shadow: rgba(14, 30, 37, 0.12) 0px 2px 4px 0px, rgba(14, 30, 37, 0.32) 0px 2px 16px 0px;
  backdrop-filter: blur(4px);
  position: absolute;
  top: 31%;
  left: 5%;
  border-radius: 15px;
  max-width: fit-content;

  padding: 30px;
}

.playBox .description {
  display: flex;
  flex-direction: column;
  gap: 0px;
  padding: 5px 0px 5px 5px;
  margin: 10px 0px;

  border-left: 4px solid #ff7300;
  border-top-left-radius: 3px;
  border-bottom-left-radius: 3px;
}

.playBox .description-content {
  color: #ffffffbd;
  margin: 0;
  font-size: 110%;
  font-weight: 400;
}

 .podium-container {
  transform: translate(60%, 13%);
 }

 .mediumPlayBtn{
  height: 50px;
  font-weight: 1000;
  min-width: 250px;
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

.mediumPlayBtn:hover {
  font-size: 140%;
  box-shadow: 0px 15px 20px #ff730097;
  transform: translateY(-3px);
}

.shop {
  display: flex;
  padding-left: 5%;
  position: absolute;
  top: 75%;
}

.shop-item {
  cursor: pointer;
}

.shop-section {
  display: flex;
  flex-direction: column;
}

.section-title {
  color: #ffffff;
  font-size: 200%;
  font-weight: 700;
  margin: 0;
  padding-left: 10px;
  margin-bottom: 15px;


  border-left: 4px solid #ff7300;
  border-top-left-radius: 3px;
  border-bottom-left-radius: 3px;
}

.item-title {
  color: #fff;
  font-size: 135%;
  font-weight: 730;
  margin: 0;

  white-space: nowrap;
  overflow: hidden;
}

.section-title:nth-of-type(n+2) {
  margin-top: 75px;
}

.item-price {
  font-size: 115%;
  font-weight: 700;
  color: #f39c12;
  margin: 0;
}

.item-price-sale {
  color: #261d31;
  text-decoration: line-through;
  text-decoration-color: #ff0000;
  text-decoration-thickness: 3px;
 }

.item-icon {
  max-width: 90px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.item-container:hover .item-icon {
  transform: scale(1.1);
}

.items-container {
  display: flex;
  gap: 25px;
}

.item-container {
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(33, 33, 33, 0.737) 0%, rgba(29, 29, 29, 0.236) 100%);
  box-shadow: rgba(14, 30, 37, 0.12) 0px 2px 4px 0px, rgba(14, 30, 37, 0.32) 0px 2px 16px 0px;
  backdrop-filter: blur(4px);
  border-radius: 15px;
  border: 2px solid #ff7300;

  padding: 15px;
  text-align: center;
  align-items: center;
  width: 130px;
}
</style>
