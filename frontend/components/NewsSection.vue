<template>
  <div class="news-section">
    <h1>ข่าวสาร</h1>
    <div class="divider"></div>
    
    <div class="news-container">
      <div 
        class="news-item" 
        v-for="(news, index) in newsList" 
        :key="news._id || index"
        @click="readOnly && showImagePreview(news.imageFilename ? `${backendUrl}/api/news/${news._id}/image` : null)"
      >
        <div class="news-image-container">
          <img 
            v-if="news.imageFilename" 
            :src="`${backendUrl}/api/news/${news._id}/image`" 
            :alt="news.title" 
            class="news-image"
            @error="handleImageError"
          >
          <div v-else class="news-placeholder">
            <span>📰</span>
          </div>
          <button 
            v-if="!readOnly" 
            class="delete-btn" 
            @click.stop="showDeleteConfirmation(news._id)"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="news-text">
          <h3>{{ news.title }}</h3>
          <p>{{ news.content }}</p>
          <div class="news-meta">
            <span v-if="news.author">👤 {{ news.author }}</span>
            <span v-if="news.views">👁️ {{ news.views }} ครั้ง</span>
          </div>
        </div>
      </div>

      <!-- Add News Form -->
      <div class="add-news-form" v-if="showForm && !readOnly">
        <div class="form-group">
          <label for="newsTitle">หัวข้อข่าว *</label>
          <input
            type="text"
            id="newsTitle"
            v-model="newNews.title"
            placeholder="กรอกหัวข้อข่าว"
            required
          >
        </div>
        <div class="form-group">
          <label for="newsContent">เนื้อหาข่าว *</label>
          <textarea
            id="newsContent"
            v-model="newNews.content"
            placeholder="กรอกเนื้อหาข่าว"
            rows="4"
            required
          ></textarea>
        </div>
        <div class="form-group">
          <label for="newsImage">รูปภาพ *</label>
          <input
            type="file"
            id="newsImage"
            ref="imageInput"
            @change="handleImageUpload"
            accept="image/*"
            required
          >
          <div class="image-preview" v-if="newNews.imagePreview">
            <img :src="newNews.imagePreview" alt="Preview">
          </div>
        </div>
        <div class="form-buttons">
          <button @click="addNews" class="confirm-btn" :disabled="isSubmitting">
            {{ isSubmitting ? 'กำลังเพิ่ม...' : 'ยืนยัน' }}
          </button>
          <button @click="cancelAdd" class="cancel-btn">ยกเลิก</button>
        </div>
      </div>

      <!-- Add News Button -->
      <div 
        class="add-news-btn" 
        v-if="!showForm && !readOnly" 
        @click="showAddForm"
      >
        <i class="fas fa-plus"></i>
        <span>เพิ่มข่าวสาร</span>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>ยืนยันการลบข่าวสาร</h3>
        <p>คุณแน่ใจหรือไม่ที่จะลบข่าวสารนี้?</p>
        <div class="modal-buttons">
          <button @click="deleteNews" class="confirm-btn" :disabled="isDeleting">
            {{ isDeleting ? 'กำลังลบ...' : 'ยืนยัน' }}
          </button>
          <button @click="closeModal" class="cancel-btn">ยกเลิก</button>
        </div>
      </div>
    </div>

    <!-- Image Preview Modal -->
    <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
      <div class="image-modal-content" @click.stop>
        <img :src="previewImage" alt="Preview" class="preview-image">
        <button class="close-preview-btn" @click="closeImageModal">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'NewsSection',
  props: {
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      newsList: [],
      showForm: false,
      showDeleteModal: false,
      showImageModal: false,
      previewImage: null,
      newNews: {
        title: '',
        content: '',
        image: null,
        imagePreview: null
      },
      deleteId: null,
      isSubmitting: false,
      isDeleting: false,
      backendUrl: process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com' 
        : 'http://localhost:4000'
    }
  },
  methods: {
    async loadNews() {
      try {
        console.log('🔄 Loading news from API...')
        const response = await axios.get(`${this.backendUrl}/api/news`)
        if (response.data.success) {
          this.newsList = response.data.data
          console.log('✅ Loaded news:', this.newsList.length)
        }
      } catch (error) {
        console.error('❌ Error loading news:', error)
      }
    },
    
    showAddForm() {
      this.showForm = true
    },
    
    cancelAdd() {
      this.showForm = false
      this.newNews = { title: '', content: '', image: null, imagePreview: null }
    },
    
    handleImageUpload(event) {
      const file = event.target.files[0]
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('ไฟล์มีขนาดใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB')
          return
        }
        
        this.newNews.image = file
        
        const reader = new FileReader()
        reader.onload = (e) => {
          this.newNews.imagePreview = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    
    async addNews() {
      if (!this.newNews.title || !this.newNews.content || !this.newNews.image) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน')
        return
      }

      try {
        this.isSubmitting = true
        console.log('🔄 Adding news...')
        
        const token = localStorage.getItem('token')
        const formData = new FormData()
        formData.append('title', this.newNews.title)
        formData.append('content', this.newNews.content)
        formData.append('image', this.newNews.image)

        const response = await axios.post(`${this.backendUrl}/api/news`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })

        if (response.data.success) {
          this.newsList.unshift(response.data.data)
          this.cancelAdd()
          alert('เพิ่มข่าวสารสำเร็จ')
          console.log('✅ News added successfully')
        } else {
          alert('เกิดข้อผิดพลาดในการเพิ่มข่าวสาร')
        }
      } catch (error) {
        console.error('❌ Error adding news:', error)
        alert('เกิดข้อผิดพลาดในการเพิ่มข่าวสาร: ' + (error.response?.data?.error || error.message))
      } finally {
        this.isSubmitting = false
      }
    },
    
    showDeleteConfirmation(newsId) {
      this.deleteId = newsId
      this.showDeleteModal = true
    },
    
    async deleteNews() {
      try {
        this.isDeleting = true
        console.log('🔄 Deleting news...')
        
        const token = localStorage.getItem('token')
        const response = await axios.delete(`${this.backendUrl}/api/news/${this.deleteId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data.success) {
          this.newsList = this.newsList.filter(news => news._id !== this.deleteId)
          this.closeModal()
          alert('ลบข่าวสารสำเร็จ')
          console.log('✅ News deleted successfully')
        } else {
          alert('เกิดข้อผิดพลาดในการลบข่าวสาร')
        }
      } catch (error) {
        console.error('❌ Error deleting news:', error)
        alert('เกิดข้อผิดพลาดในการลบข่าวสาร: ' + (error.response?.data?.error || error.message))
      } finally {
        this.isDeleting = false
      }
    },
    
    closeModal() {
      this.showDeleteModal = false
      this.deleteId = null
    },
    
    showImagePreview(imageUrl) {
      if (imageUrl) {
        this.previewImage = imageUrl
        this.showImageModal = true
      }
    },
    
    closeImageModal() {
      this.showImageModal = false
      this.previewImage = null
    },
    
    handleImageError(event) {
      event.target.style.display = 'none'
      const placeholder = event.target.parentElement.querySelector('.news-placeholder')
      if (placeholder) {
        placeholder.style.display = 'flex'
      }
    }
  },
  mounted() {
    this.loadNews()
  }
}
</script>

<style scoped>
.news-section {
  margin-top: 40px;
}

h1 {
  color: #333;
  margin-bottom: 20px;
  font-size: 28px;
}

.divider {
  height: 2px;
  background-color: #ddd;
  margin-bottom: 30px;
}

.news-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.news-item {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  cursor: pointer;
  transition: transform 0.3s;
}

.news-item:hover {
  transform: translateY(-5px);
}

.news-image-container {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.news-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.news-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  color: #ccc;
  background: #f5f5f5;
}

.news-text {
  padding: 15px;
  color: #333;
}

.news-text h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 600;
}

.news-text p {
  margin: 0 0 10px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
}

.news-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #888;
}

.delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  background-color: rgba(220, 53, 69, 0.9);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border: none;
  color: white;
  transition: all 0.3s;
  z-index: 2;
}

.delete-btn:hover {
  background-color: #dc3545;
  transform: scale(1.1);
}

.add-news-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #f8f9fa;
}

.add-news-btn:hover {
  border-color: #28a745;
  background-color: #f1f8f1;
}

.add-news-btn i {
  font-size: 32px;
  color: #28a745;
  margin-bottom: 10px;
}

.add-news-btn span {
  color: #28a745;
  font-size: 16px;
}

.add-news-form {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-group input[type="text"],
.form-group input[type="file"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  box-sizing: border-box;
}

.image-preview {
  margin-top: 10px;
  max-height: 200px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: auto;
  border-radius: 4px;
}

.form-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.confirm-btn, .cancel-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.confirm-btn {
  background-color: #28a745;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #218838;
}

.confirm-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background-color: #5a6268;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.modal-content p {
  margin: 20px 0;
  color: #666;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

/* Image Preview Modal */
.image-modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90vh;
}

.preview-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
}

.close-preview-btn {
  position: absolute;
  top: -40px;
  right: -40px;
  width: 30px;
  height: 30px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  border: none;
  color: #333;
  transition: all 0.3s;
}

.close-preview-btn:hover {
  background-color: white;
  transform: scale(1.1);
}
</style> 