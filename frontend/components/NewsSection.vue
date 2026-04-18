
<template>
  <div class="news-section">
    <div class="news-header">
      <h2 class="title">ข่าวและกิจกรรม</h2>
    </div>
    <div class="divider"></div>
    
    <div class="news-container">
      <div 
        class="news-item" 
        v-for="(news, index) in displayNews" 
        :key="news._id || index"
        @click="readOnly ? openNewsDetail(news) : null"
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
            ลบ
          </button>
        </div>
        <div class="news-text">
          <h3>{{ news.title }}</h3>
          <p>{{ news.content }}</p>
          <div class="news-meta">
            <span>{{ formatDate(news.createdAt) }}</span>
            <span v-if="news.author">👤 {{ news.author }}</span>
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

    <div v-if="readOnly && showAllLink" class="view-all-wrapper">
      <button class="view-all-btn" @click="goToAllNews">ดูข่าวทั้งหมด</button>
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

    <!-- Read-only News Detail Modal -->
    <div v-if="selectedNews && readOnly" class="modal-overlay" @click="closeNewsDetail">
      <div class="detail-modal-content" @click.stop>
        <div class="detail-modal-header">
          <h3>{{ selectedNews.title }}</h3>
          <button class="close-preview-btn" @click="closeNewsDetail"><i class="fas fa-times"></i></button>
        </div>
        <div class="detail-modal-body">
          <div class="news-detail-image" v-if="selectedNews.imageFilename">
            <img :src="`${backendUrl}/api/news/${selectedNews._id}/image`" :alt="selectedNews.title">
          </div>
          <div class="news-detail-text">
            <p>{{ selectedNews.content }}</p>
          </div>
          <div class="news-detail-meta">
            <span>{{ formatDate(selectedNews.createdAt) }}</span>
            <span v-if="selectedNews.author">👤 {{ selectedNews.author }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Cropper Modal -->
    <div v-if="showCropperModal" class="cropper-overlay" @click="closeCropper">
      <div class="cropper-content" @click.stop>
        <div class="cropper-header">
          <h3 class="cropper-title">ครอปรูปภาพ</h3>
        </div>
        <div class="cropper-body">
          <img ref="cropperImg" :src="newNews.imagePreview" alt="Crop" class="cropper-img" />
        </div>
        <div class="cropper-actions">
          <button class="btn btn-secondary" @click="closeCropper">ยกเลิก</button>
          <button class="btn btn-primary" @click="confirmCrop">ยืนยัน</button>
        </div>
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
    },
    limit: {
      type: Number,
      default: null
    },
    showAllLink: {
      type: Boolean,
      default: false
    },
    allLinkPath: {
      type: String,
      default: '/user/news'
    }
  },
  data() {
    return {
      newsList: [],
      showForm: false,
      showDeleteModal: false,
      showImageModal: false,
      selectedNews: null,
      showCropperModal: false,
      cropper: null,
      cropperReady: false,
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
      backendUrl: ''
    }
  },
  computed: {
    displayNews() {
      // If limit provided (e.g., homepage), show newest first limited amount
      if (this.limit && this.readOnly) {
        return [...this.newsList]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, this.limit)
      }
      return this.newsList
    }
  },
  methods: {
    getBackendBaseUrl() {
      const fromAxios = axios.defaults.baseURL || ''
      if (fromAxios) return fromAxios.replace(/\/$/, '')
      return process.client ? window.location.origin : ''
    },
    async loadNews() {
      try {
        console.log('🔄 Loading news from API...')
        const response = await axios.get('/api/news')
        if (response.data.success) {
          this.newsList = response.data.data
          console.log('✅ Loaded news:', this.newsList.length)
        }
      } catch (error) {
        console.error('❌ Error loading news:', error)
      }
    },
    openNewsDetail(news) {
      this.selectedNews = news
    },
    closeNewsDetail() {
      this.selectedNews = null
    },
    formatDate(dateString) {
      try {
        const d = new Date(dateString)
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        return `${dd}/${mm}/${yyyy}`
      } catch { return '' }
    },
    goToAllNews() {
      this.$router.push(this.allLinkPath)
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
          this.$nextTick(() => {
            this.openCropper()
          })
        }
        reader.readAsDataURL(file)
      }
    },

    async openCropper() {
      try {
        this.showCropperModal = true
        await this.$nextTick()
        const img = this.$refs.cropperImg
        if (!img) return
        // Lazy import to avoid SSR issues
        const Cropper = (await import('cropperjs')).default
        if (this.cropper) {
          this.cropper.destroy()
          this.cropper = null
        }
        this.cropper = new Cropper(img, {
          viewMode: 1,
          dragMode: 'move',
          aspectRatio: NaN, // freeform crop for news
          autoCropArea: 1,
          responsive: true,
          background: false,
          zoomOnWheel: true
        })
      } catch (e) {
        console.error('Error initializing cropper:', e)
      }
    },

    confirmCrop() {
      if (!this.cropper) return
      const canvas = this.cropper.getCroppedCanvas()
      canvas.toBlob((blob) => {
        if (!blob) return
        this.newNews.image = new File([blob], 'cropped.jpg', { type: 'image/jpeg' })
        this.newNews.imagePreview = canvas.toDataURL('image/jpeg', 0.9)
        this.closeCropper()
      }, 'image/jpeg', 0.9)
    },

    closeCropper() {
      this.showCropperModal = false
      if (this.cropper) {
        this.cropper.destroy()
        this.cropper = null
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
        
        // ใช้ axios interceptor (validate token อัตโนมัติ)
        const formData = new FormData()
        formData.append('title', this.newNews.title)
        formData.append('content', this.newNews.content)
        formData.append('image', this.newNews.image)

        const response = await axios.post('/api/news', formData, {
          headers: {
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
        
        // ใช้ axios interceptor (validate token อัตโนมัติ)
        const response = await axios.delete(`/api/news/${this.deleteId}`)
        
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
    this.backendUrl = this.getBackendBaseUrl()
    this.loadNews()
  }
}
</script>

<style scoped>
.news-section {
  margin-top: 8px;
}

.news-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.title {
  color: #111827;
  margin: 0;
  font-size: clamp(1.5rem, 5vw, 1.75rem);
  font-weight: 800;
}

.divider {
  height: 4px;
  background-color: #e74c3c;
  border-radius: 999px;
  margin: 8px 0 18px 0;
}

.news-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 8px;
}

/* Tablet */

@media (max-width: 900px) {
  .news-container {
    grid-template-columns: repeat(2, 1fr);
  }
}

.view-all-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.view-all-btn {
  background: #e74c3c;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 999px;
  cursor: pointer;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.news-item {
  background: transparent;
  border-radius: 0;
  overflow: visible;
  box-shadow: none;
  position: relative;
  cursor: pointer;
  transition: transform 0.25s ease;
}

.news-image-container {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.25s ease, transform 0.25s ease;
  margin-bottom: 10px;
}

.news-item:hover .news-image-container {
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.14);
  transform: translateY(-2px);
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
  font-size: clamp(1.8rem, 9vw, 3rem);
  color: #ccc;
  background: #f5f5f5;
}

.news-text {
  padding: 0 2px 2px 2px;
  color: #333;
}

.news-text h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-text p {
  margin: 0 0 10px 0;
  font-size: 14px;
  line-height: 1.5;
  color: #4b5563;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.news-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 44px;
  height: 44px;
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
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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
  width: 44px;
  height: 44px;
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

/* Read-only detail modal */
.detail-modal-content { background: #fff; border-radius: 12px; width: min(900px, 96vw); max-height: 90vh; overflow: auto; padding: 16px; }
.detail-modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
.detail-modal-header h3 { margin: 0; font-weight: 800; color: #111827; }
.detail-modal-body { padding-top: 12px; }
.detail-modal-body .news-detail-image img { max-width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.detail-modal-body .news-detail-text p { color: #333; line-height: 1.7; font-size: 1rem; }
.detail-modal-body .news-detail-meta { display: flex; gap: 12px; color: #64748b; font-size: 0.9rem; margin-top: 8px; }

/* Cropper Modal */
.cropper-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 16px;
}
.cropper-content {
  background: #fff;
  border-radius: 12px;
  width: min(900px, 96vw);
  padding: 12px;
}
.cropper-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.cropper-title { margin: 0; font-weight: 800; font-size: 18px; color: #111827; }
.cropper-body { max-height: 70vh; overflow: hidden; }
.cropper-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; }
.btn { padding: 8px 14px; border-radius: 8px; border: none; cursor: pointer; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; line-height: 1; }
.btn-secondary { background: #e5e7eb; color: #111827; }
.btn-primary { background: #e74c3c; color: #fff; }
.cropper-img { max-width: 100%; display: block; }

@media (max-width: 768px) {
  .add-news-form { padding: 16px; }
  .form-group { margin-bottom: 16px; }
  .modal-content { padding: 16px; }
  .modal-buttons { margin-top: 16px; gap: 8px; }
  .delete-btn { top: 8px; right: 8px; }
  .close-preview-btn { top: -36px; right: -36px; }

  /*
   * การ์ดข่าว 3 คอลัมน์บนมือถือ — ต้องอยู่ท้ายไฟล์ หลัง .news-text / .news-meta
   * มิฉะนั้นกฎพื้นฐานจะ override display:none แล้วข้อความยาว (เช่น Administrator) จะล้น
   */
  .title {
    font-size: clamp(1.05rem, 3.8vw, 1.3rem);
  }

  .divider {
    height: 3px;
    margin: 6px 0 12px 0;
  }

  .news-container {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    overflow: hidden;
  }

  .add-news-btn,
  .add-news-form {
    grid-column: 1 / -1;
  }

  .news-item {
    display: flex;
    flex-direction: column;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    min-width: 0;
  }

  .news-image-container {
    border-radius: 6px 6px 0 0;
    aspect-ratio: 4 / 3;
    margin-bottom: 0;
  }

  .news-text {
    padding: 4px 4px 5px;
    min-width: 0;
    overflow: hidden;
  }

  /* หัวข้อ ~11px: เหมาะกับคอลัมน์แคบ; เนื้อหาหลักเว็บมือถือมักใช้ 14–16px */
  .news-text h3 {
    font-size: clamp(10px, 2.7vw, 11px);
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
  }

  .news-text p {
    display: none;
    margin: 0;
  }

  .news-meta {
    display: none;
  }
}
</style> 