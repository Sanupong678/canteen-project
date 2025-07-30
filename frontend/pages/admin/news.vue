<template>
  <LayoutAdmin>
    <div class="news-admin-container">
      <div class="header">
        <h1>จัดการข่าวสาร</h1>
        <button @click="showAddForm = true" class="add-btn">
          <span>➕</span> เพิ่มข่าวสารใหม่
        </button>
      </div>

      <!-- News List -->
      <div class="news-list">
        <div v-for="item in news" :key="item._id" class="news-item">
          <div class="news-header">
            <h3>{{ item.title }}</h3>
            <div class="news-actions">
              <button @click="editNews(item)" class="edit-btn">✏️ แก้ไข</button>
              <button @click="toggleNewsStatus(item)" class="toggle-btn" :class="{ active: item.isActive }">
                {{ item.isActive ? '✅ เปิดใช้งาน' : '❌ ปิดใช้งาน' }}
              </button>
              <button @click="deleteNews(item._id)" class="delete-btn">🗑️ ลบ</button>
            </div>
          </div>
          
          <div class="news-content">
            <p>{{ item.content }}</p>
            <img 
              v-if="item.imageFilename" 
              :src="`${backendUrl}/api/news/${item._id}/image`" 
              alt="news image" 
              class="news-image"
            />
          </div>
          
          <div class="news-footer">
            <span class="author">ผู้เขียน: {{ item.author }}</span>
            <span class="date">วันที่: {{ formatDate(item.createdAt) }}</span>
            <span class="views">👁️ {{ item.views }} ครั้ง</span>
            <span class="status" :class="{ active: item.isActive }">
              {{ item.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Add/Edit News Modal -->
      <div v-if="showAddForm || editingNews" class="modal-overlay" @click="closeModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ editingNews ? 'แก้ไขข่าวสาร' : 'เพิ่มข่าวสารใหม่' }}</h2>
            <button @click="closeModal" class="close-btn">✕</button>
          </div>
          
          <form @submit.prevent="editingNews ? updateNews() : addNews()" class="news-form">
            <div class="form-group">
              <label>หัวข้อข่าว *</label>
              <input 
                v-model="formData.title" 
                placeholder="กรอกหัวข้อข่าว" 
                required
              />
            </div>
            
            <div class="form-group">
              <label>เนื้อหาข่าว *</label>
              <textarea 
                v-model="formData.content" 
                placeholder="กรอกเนื้อหาข่าว" 
                rows="6"
                required
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>รูปภาพข่าว *</label>
              <input 
                type="file" 
                @change="handleImageUpload" 
                accept="image/*"
                required
              />
              <div v-if="selectedImage" class="image-preview">
                <img :src="selectedImage" alt="Preview" />
              </div>
            </div>
            
            <div class="form-actions">
              <button type="button" @click="closeModal" class="cancel-btn">ยกเลิก</button>
              <button type="submit" class="submit-btn">
                {{ editingNews ? 'อัปเดต' : 'เพิ่มข่าวสาร' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </LayoutAdmin>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LayoutAdmin from '@/components/LayoutAdmin.vue'
import axios from 'axios'

const news = ref([])
const showAddForm = ref(false)
const editingNews = ref(null)
const selectedImage = ref(null)
const formData = ref({
  title: '',
  content: '',
  image: null
})

// กำหนด backend URL
const backendUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-domain.com' 
  : 'http://localhost:4000'

// Fetch news from API
const loadNews = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get(`${backendUrl}/api/news/admin/all`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    news.value = response.data.data
  } catch (error) {
    console.error('Error loading news:', error)
  }
}



// Add new news
const addNews = async () => {
  if (!formData.value.title || !formData.value.content || !formData.value.image) {
    alert('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  try {
    const token = localStorage.getItem('token')
    const formDataToSend = new FormData()
    formDataToSend.append('title', formData.value.title)
    formDataToSend.append('content', formData.value.content)
    formDataToSend.append('image', formData.value.image)

    const response = await axios.post(`${backendUrl}/api/news`, formDataToSend, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    news.value.unshift(response.data.data)
    closeModal()
    alert('เพิ่มข่าวสารสำเร็จ')
  } catch (error) {
    console.error('Error adding news:', error)
    alert('เกิดข้อผิดพลาดในการเพิ่มข่าวสาร')
  }
}

// Edit news
const editNews = (item) => {
  editingNews.value = item
  formData.value = {
    title: item.title,
    content: item.content,
    image: null
  }
  selectedImage.value = `${backendUrl}/api/news/${item._id}/image`
}

// Update news
const updateNews = async () => {
  if (!formData.value.title || !formData.value.content) {
    alert('กรุณากรอกข้อมูลให้ครบถ้วน')
    return
  }

  try {
    const token = localStorage.getItem('token')
    const formDataToSend = new FormData()
    formDataToSend.append('title', formData.value.title)
    formDataToSend.append('content', formData.value.content)
    if (formData.value.image) {
      formDataToSend.append('image', formData.value.image)
    }

    const response = await axios.put(`${backendUrl}/api/news/${editingNews.value._id}`, formDataToSend, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    const index = news.value.findIndex(item => item._id === editingNews.value._id)
    if (index !== -1) {
      news.value[index] = response.data.data
    }
    closeModal()
    alert('อัปเดตข่าวสารสำเร็จ')
  } catch (error) {
    console.error('Error updating news:', error)
    alert('เกิดข้อผิดพลาดในการอัปเดตข่าวสาร')
  }
}

// Toggle news status
const toggleNewsStatus = async (item) => {
  try {
    const token = localStorage.getItem('token')
    const response = await axios.patch(`${backendUrl}/api/news/${item._id}/toggle`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    const index = news.value.findIndex(n => n._id === item._id)
    if (index !== -1) {
      news.value[index] = response.data.data
    }
  } catch (error) {
    console.error('Error toggling news status:', error)
    alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะข่าวสาร')
  }
}

// Delete news
const deleteNews = async (newsId) => {
  if (confirm('คุณต้องการลบข่าวสารนี้ใช่หรือไม่?')) {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${backendUrl}/api/news/${newsId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      news.value = news.value.filter(item => item._id !== newsId)
      alert('ลบข่าวสารสำเร็จ')
    } catch (error) {
      console.error('Error deleting news:', error)
      alert('เกิดข้อผิดพลาดในการลบข่าวสาร')
    }
  }
}

// Close modal
const closeModal = () => {
  showAddForm.value = false
  editingNews.value = null
  selectedImage.value = null
  formData.value = {
    title: '',
    content: '',
    image: null
  }
}

// Handle image upload
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    formData.value.image = file
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedImage.value = e.target.result
    }
    reader.readAsDataURL(file)
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

<style scoped>
.news-admin-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.header h1 {
  color: #333;
  margin: 0;
}

.add-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s;
}

.add-btn:hover {
  background: #45a049;
}

.news-list {
  display: grid;
  gap: 20px;
}

.news-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
}

.news-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.news-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  flex: 1;
}

.news-actions {
  display: flex;
  gap: 8px;
}

.edit-btn, .toggle-btn, .delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.edit-btn {
  background: #2196F3;
  color: white;
}

.edit-btn:hover {
  background: #1976D2;
}

.toggle-btn {
  background: #FF9800;
  color: white;
}

.toggle-btn.active {
  background: #4CAF50;
}

.toggle-btn:hover {
  background: #F57C00;
}

.delete-btn {
  background: #f44336;
  color: white;
}

.delete-btn:hover {
  background: #d32f2f;
}

.news-content {
  margin-bottom: 15px;
}

.news-content p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 15px;
}

.news-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin-top: 10px;
}

.news-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #888;
  flex-wrap: wrap;
  gap: 10px;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.status.active {
  background: #e8f5e8;
  color: #4CAF50;
}

.status:not(.active) {
  background: #ffebee;
  color: #f44336;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 0;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.news-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}

.image-preview {
  margin-top: 10px;
}

.image-preview img {
  max-width: 200px;
  height: auto;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 30px;
}

.cancel-btn, .submit-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.submit-btn {
  background: #4CAF50;
  color: white;
}

.submit-btn:hover {
  background: #45a049;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .news-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .news-actions {
    justify-content: flex-start;
  }
  
  .news-footer {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style>
