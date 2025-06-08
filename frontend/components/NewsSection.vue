<template>
  <div class="news-section">
    <h1>ข่าวสาร</h1>
    <div class="divider"></div>
    
    <div class="news-container">
      <div 
        class="news-item" 
        v-for="(news, index) in newsList" 
        :key="index"
        @click="readOnly && showImagePreview(news.image)"
      >
        <div class="news-image-container">
          <img :src="news.image" :alt="news.title" class="news-image">
          <button 
            v-if="!readOnly" 
            class="delete-btn" 
            @click.stop="showDeleteConfirmation(index)"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="news-text">{{ news.text }}</div>
      </div>

      <!-- Add News Form -->
      <div class="add-news-form" v-if="showForm && !readOnly">
        <div class="form-group">
          <label for="newsImage">รูปภาพ</label>
          <input
            type="file"
            id="newsImage"
            ref="imageInput"
            @change="handleImageUpload"
            accept="image/*"
          >
          <div class="image-preview" v-if="newNews.image">
            <img :src="newNews.image" alt="Preview">
          </div>
        </div>
        <div class="form-group">
          <label for="newsText">ข้อความ</label>
          <textarea
            id="newsText"
            v-model="newNews.text"
            placeholder="กรอกข้อความประชาสัมพันธ์"
            rows="3"
          ></textarea>
        </div>
        <div class="form-buttons">
          <button @click="addNews" class="confirm-btn">ยืนยัน</button>
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
          <button @click="deleteNews" class="confirm-btn">ยืนยัน</button>
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
        image: null,
        text: ''
      },
      deleteIndex: null
    }
  },
  methods: {
    showAddForm() {
      this.showForm = true
    },
    cancelAdd() {
      this.showForm = false
      this.newNews = { image: null, text: '' }
    },
    handleImageUpload(event) {
      const file = event.target.files[0]
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('ไฟล์มีขนาดใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB')
          return
        }
        
        const reader = new FileReader()
        reader.onload = (e) => {
          this.newNews.image = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    addNews() {
      if (!this.newNews.image || !this.newNews.text.trim()) {
        alert('กรุณากรอกข้อมูลให้ครบถ้วน')
        return
      }

      this.newsList.push({...this.newNews})
      this.saveNews()
      this.cancelAdd()
    },
    showDeleteConfirmation(index) {
      this.deleteIndex = index
      this.showDeleteModal = true
    },
    deleteNews() {
      this.newsList.splice(this.deleteIndex, 1)
      this.saveNews()
      this.closeModal()
    },
    closeModal() {
      this.showDeleteModal = false
      this.deleteIndex = null
    },
    showImagePreview(image) {
      this.previewImage = image
      this.showImageModal = true
    },
    closeImageModal() {
      this.showImageModal = false
      this.previewImage = null
    },
    saveNews() {
      localStorage.setItem('newsList', JSON.stringify(this.newsList))
    },
    loadNews() {
      const savedNews = localStorage.getItem('newsList')
      if (savedNews) {
        this.newsList = JSON.parse(savedNews)
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

.news-text {
  padding: 15px;
  color: #333;
  font-size: 16px;
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

.form-group input[type="file"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
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

.confirm-btn:hover {
  background-color: #218838;
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