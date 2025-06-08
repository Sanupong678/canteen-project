<template>
  <LayoutAdmin>
    <div>
      <h2>ข่าวสาร</h2>

      <div v-for="item in news" :key="item._id" class="news-item" style="margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px;">
        <h3>{{ item.title }}</h3>
        <p>{{ item.content }}</p>
        <img 
          v-if="item.imagePath" 
          :src="`http://localhost:5000/${item.imagePath}`" 
          alt="news image" 
          style="max-width: 300px; margin-top: 10px;" 
        />
        <p>วันที่: {{ formatDate(item.createdAt) }}</p>
        <button @click="deleteNews(item._id)">ลบข่าวสาร</button>
      </div>

      <h2>เพิ่มข่าวสาร</h2>
      <input v-model="newNews.title" placeholder="หัวข้อข่าว" />
      <br />
      <textarea v-model="newNews.content" placeholder="เนื้อหาข่าว" rows="4" cols="50"></textarea>
      <br />
      <input type="file" @change="handleImageUpload" />
      <br />
      <button @click="addNews">เพิ่มข่าวสาร</button>
    </div>
  </LayoutAdmin>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LayoutAdmin from '@/components/LayoutAdmin.vue'
import axios from 'axios'

const news = ref([])
const newNews = ref({
  title: '',
  content: '',
  image: null
})

// Fetch news from API
const loadNews = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/news')
    news.value = response.data
  } catch (error) {
    console.error('Error loading news:', error)
  }
}

// Add new news
const addNews = async () => {
  if (!newNews.value.title || !newNews.value.content) {
    alert('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  try {
    const formData = new FormData()
    formData.append('title', newNews.value.title)
    formData.append('content', newNews.value.content)
    if (newNews.value.image) {
      formData.append('image', newNews.value.image)
    }

    const response = await axios.post('http://localhost:5000/api/news', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    news.value.unshift(response.data)
    newNews.value = {
      title: '',
      content: '',
      image: null
    }
    alert('เพิ่มข่าวสารสำเร็จ')
  } catch (error) {
    console.error('Error adding news:', error)
    alert('เกิดข้อผิดพลาดในการเพิ่มข่าวสาร')
  }
}

// Delete news
const deleteNews = async (newsId) => {
  if (confirm('คุณต้องการลบข่าวสารนี้ใช่หรือไม่?')) {
    try {
      await axios.delete(`http://localhost:5000/api/news/${newsId}`)
      news.value = news.value.filter(item => item._id !== newsId)
      alert('ลบข่าวสารสำเร็จ')
    } catch (error) {
      console.error('Error deleting news:', error)
      alert('เกิดข้อผิดพลาดในการลบข่าวสาร')
    }
  }
}

// Handle image upload
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    newNews.value.image = file
  }
}

// Format date
const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('th-TH', options)
}

// Load news when component mounts
onMounted(() => {
  loadNews()
})
</script>
