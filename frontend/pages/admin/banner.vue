<template>
  <LayoutAdmin>
    <div class="banner-management">
      <h1 class="text-2xl font-bold mb-6">จัดการแบนเนอร์</h1>
      
      <!-- Add new banner form -->
      <div class="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 class="text-lg font-semibold mb-4">เพิ่มแบนเนอร์ใหม่</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">ชื่อแบนเนอร์</label>
            <input 
              v-model="newBanner.title" 
              type="text" 
              class="w-full p-2 border border-gray-300 rounded-md"
              placeholder="ชื่อแบนเนอร์"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">ลิงก์ (ไม่บังคับ)</label>
            <input 
              v-model="newBanner.link" 
              type="text" 
              class="w-full p-2 border border-gray-300 rounded-md"
              placeholder="https://example.com"
            />
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium mb-2">รูปภาพ</label>
            <input 
              @change="handleImageUpload" 
              type="file" 
              accept="image/*"
              class="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        <button 
          @click="addBanner"
          class="mt-4 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          เพิ่มแบนเนอร์
        </button>
      </div>

      <!-- Banners list -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h2 class="text-lg font-semibold mb-4">แบนเนอร์ทั้งหมด</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="banner in banners" 
            :key="banner._id"
            class="border border-gray-200 rounded-lg p-4"
          >
            <div class="mb-3">
              <img 
                v-if="banner.imageFilename"
                :src="`/api/banner/${banner.imageFilename}`"
                :alt="banner.title"
                class="w-full h-32 object-cover rounded-md"
              />
              <div v-else class="w-full h-32 bg-gray-200 rounded-md flex items-center justify-center">
                <span class="text-gray-500">ไม่มีรูปภาพ</span>
              </div>
            </div>
            <h3 class="font-semibold mb-2">{{ banner.title }}</h3>
            <p v-if="banner.description" class="text-sm text-gray-600 mb-2">{{ banner.description }}</p>
            <div class="flex items-center justify-between">
              <span 
                :class="banner.isActive ? 'text-green-600' : 'text-red-600'"
                class="text-sm font-medium"
              >
                {{ banner.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
              </span>
              <div class="flex gap-2">
                <button 
                  @click="toggleBannerStatus(banner)"
                  :class="banner.isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'"
                  class="text-white px-3 py-1 rounded-md text-sm"
                >
                  {{ banner.isActive ? 'ปิด' : 'เปิด' }}
                </button>
                <button 
                  @click="deleteBanner(banner._id)"
                  class="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
                >
                  ลบ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </LayoutAdmin>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LayoutAdmin from '@/components/LayoutAdmin.vue'
import axios from 'axios'

const banners = ref([])
const newBanner = ref({
  title: '',
  image: null,
  link: '',
  active: true
})

// Fetch banners from API
const loadBanners = async () => {
  try {
    const response = await axios.get('/api/backgrounds')
    if (response.data.success) {
      banners.value = response.data.data
    }
  } catch (error) {
    console.error('Error loading banners:', error)
  }
}

// Add new banner
const addBanner = async () => {
  if (!newBanner.value.title || !newBanner.value.image) {
    alert('กรุณากรอกชื่อและเลือกรูปภาพ')
    return
  }

  try {
    const token = localStorage.getItem('token')
    const formData = new FormData()
    formData.append('title', newBanner.value.title)
    formData.append('image', newBanner.value.image)
    formData.append('description', newBanner.value.link || '')

    const response = await axios.post('/api/backgrounds', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data.success) {
      banners.value.push(response.data.data)
      newBanner.value = {
        title: '',
        image: null,
        link: '',
        active: true
      }
      alert('เพิ่มแบนเนอร์สำเร็จ')
    }
  } catch (error) {
    console.error('Error adding banner:', error)
    alert('เกิดข้อผิดพลาดในการเพิ่มแบนเนอร์')
  }
}

// Delete banner
const deleteBanner = async (bannerId) => {
  if (confirm('คุณต้องการลบแบนเนอร์นี้ใช่หรือไม่?')) {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`/api/backgrounds/${bannerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      banners.value = banners.value.filter(banner => banner._id !== bannerId)
      alert('ลบแบนเนอร์สำเร็จ')
    } catch (error) {
      console.error('Error deleting banner:', error)
      alert('เกิดข้อผิดพลาดในการลบแบนเนอร์')
    }
  }
}

// Toggle banner status
const toggleBannerStatus = async (banner) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.patch(`/api/backgrounds/${banner._id}/toggle`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (response.data.success) {
      const index = banners.value.findIndex(b => b._id === banner._id)
      if (index !== -1) {
        banners.value[index] = response.data.data
      }
    }
  } catch (error) {
    console.error('Error toggling banner status:', error)
    alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะแบนเนอร์')
  }
}

// Handle image upload
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    newBanner.value.image = file
  }
}

// Load banners when component mounts
onMounted(() => {
  loadBanners()
})
</script> 