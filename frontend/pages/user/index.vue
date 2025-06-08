<template>
  <LayoutUser>
    <div class="user-dashboard">
      <BannerAd :read-only="true" />
      <NewsSection :read-only="true" />
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
  padding: 20px;
}
</style>
    