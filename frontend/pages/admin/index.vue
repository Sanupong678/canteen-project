<template>
  <LayoutAdmin>
    <div class="admin-dashboard">
      <div class="full-bleed-banner">
        <BannerAd :read-only="false" />
      </div>
      <NewsSection />
    </div>
  </LayoutAdmin>
</template>

<script setup>
import LayoutAdmin from '~/components/LayoutAdmin.vue'
import BannerAd from '~/components/BannerAd.vue'
import NewsSection from '~/components/NewsSection.vue'
</script>

<style scoped>
.admin-dashboard {
  padding: 0 20px 32px 20px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Match user page: make banner full-bleed and hug navbar */
.full-bleed-banner {
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
  width: 100vw;
  margin-top: -20px; /* cancel main padding to hug navbar */
}

/* removed hero section; title now shown in navbar */
</style>
    