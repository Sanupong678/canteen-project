<template>
  <LayoutAdmin>
    <div class="admin-dashboard">
      <BannerAd :read-only="false" />
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
  padding: 20px;
}
</style>
    