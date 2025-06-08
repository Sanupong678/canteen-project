// stores/repairImageStore.js
import { defineStore } from 'pinia'

export const useRepairImageStore = defineStore('repairImageStore', {
  state: () => ({
    repairImages: [{ url: null }],
  }),
  actions: {
    setRepairImageUrl(index, url) {
      this.repairImages[index].url = url
    },
    addRepairImage() {
      this.repairImages.push({ url: null })
    },
    removeRepairImage(index) {
      // ตรวจสอบว่า repairImages มีมากกว่าหนึ่งรูปก่อนจะลบ
      if (this.repairImages.length > 1) {
        this.repairImages.splice(index, 1) // ลบเฉพาะภาพที่เลือก
      } else {
        console.log("ไม่สามารถลบได้เมื่อมีแค่ 1 รูป")
      }
    },
  },
})
