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
    const response = await axios.get('http://localhost:5000/api/banners')
    banners.value = response.data
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
    const formData = new FormData()
    formData.append('title', newBanner.value.title)
    formData.append('image', newBanner.value.image)
    formData.append('link', newBanner.value.link)
    formData.append('active', newBanner.value.active)

    const response = await axios.post('http://localhost:5000/api/banners', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    banners.value.push(response.data)
    newBanner.value = {
      title: '',
      image: null,
      link: '',
      active: true
    }
    alert('เพิ่มแบนเนอร์สำเร็จ')
  } catch (error) {
    console.error('Error adding banner:', error)
    alert('เกิดข้อผิดพลาดในการเพิ่มแบนเนอร์')
  }
}

// Delete banner
const deleteBanner = async (bannerId) => {
  if (confirm('คุณต้องการลบแบนเนอร์นี้ใช่หรือไม่?')) {
    try {
      await axios.delete(`http://localhost:5000/api/banners/${bannerId}`)
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
    const response = await axios.patch(`http://localhost:5000/api/banners/${banner._id}`, {
      active: !banner.active
    })
    
    const index = banners.value.findIndex(b => b._id === banner._id)
    if (index !== -1) {
      banners.value[index] = response.data
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