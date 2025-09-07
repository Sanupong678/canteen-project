<template>
  <LayoutUser>
    <div class="user-dashboard">
      <div class="full-bleed-banner">
        <BannerAd :read-only="true" />
      </div>
      <NewsSection :read-only="true" :limit="4" :show-all-link="true" all-link-path="/user/news" />
    </div>
  </LayoutUser>
</template>

<script setup>
import LayoutUser from '~/components/LayoutUser.vue'
import BannerAd from '~/components/BannerAd.vue'
import NewsSection from '~/components/NewsSection.vue'
</script>

<style scoped>
.user-dashboard {
  padding: 0 20px 32px 20px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Edge-to-edge banner like the university site */
.full-bleed-banner {
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  width: 100vw;
  margin-top: 0; /* user-main no longer adds top padding */
}
</style>
    