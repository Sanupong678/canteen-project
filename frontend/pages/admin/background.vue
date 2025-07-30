<script setup>
import { ref, onMounted } from 'vue'
import LayoutAdmin from '@/components/LayoutAdmin.vue'
import axios from 'axios'

const backgrounds = ref([])
const newBackground = ref({
  name: '',
  image: null
})

// Fetch backgrounds from API
const loadBackgrounds = async () => {
  try {
    const response = await axios.get('/background-api/api/backgrounds')
    backgrounds.value = response.data
  } catch (error) {
    console.error('Error loading backgrounds:', error)
  }
}

// Add new background
const addBackground = async () => {
  if (!newBackground.value.name || !newBackground.value.image) {
    alert('กรุณากรอกชื่อและเลือกรูปภาพ')
    return
  }

  try {
    const formData = new FormData()
    formData.append('name', newBackground.value.name)
    formData.append('image', newBackground.value.image)

    const response = await axios.post('/background-api/api/backgrounds', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    backgrounds.value.push(response.data)
    newBackground.value = {
      name: '',
      image: null
    }
    alert('เพิ่มพื้นหลังสำเร็จ')
  } catch (error) {
    console.error('Error adding background:', error)
    alert('เกิดข้อผิดพลาดในการเพิ่มพื้นหลัง')
  }
}

// Delete background
const deleteBackground = async (backgroundId) => {
  if (confirm('คุณต้องการลบพื้นหลังนี้ใช่หรือไม่?')) {
    try {
      await axios.delete(`/background-api/api/backgrounds/${backgroundId}`)
      backgrounds.value = backgrounds.value.filter(bg => bg._id !== backgroundId)
      alert('ลบพื้นหลังสำเร็จ')
    } catch (error) {
      console.error('Error deleting background:', error)
      alert('เกิดข้อผิดพลาดในการลบพื้นหลัง')
    }
  }
}

// Handle image upload
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    newBackground.value.image = file
  }
}

// Load backgrounds when component mounts
onMounted(() => {
  loadBackgrounds()
})
</script> 