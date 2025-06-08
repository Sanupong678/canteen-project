<template>
  <div class="banner-container">
    <input
      type="file"
      ref="fileInput"
      @change="handleFileUpload"
      accept="image/*"
      style="display: none"
    />
    <div 
      class="banner-display" 
      :class="{ 'has-image': currentImage }"
      @click="!readOnly && isAdmin && !currentImage && triggerFileInput()"
    >
      <div v-if="!readOnly && isAdmin && currentImage" class="delete-btn" @click.stop="showDeleteConfirmation">
        <i class="fas fa-times"></i>
      </div>
      <img
        v-if="currentImage"
        :src="currentImage"
        alt="Banner Advertisement"
        class="banner-image"
      />
      <div v-else class="placeholder">
        <i class="fas fa-image"></i>
        <p v-if="!readOnly && isAdmin">คลิกเพื่ออัปโหลดรูปภาพ</p>
        <p v-else>ยังไม่มีรูปภาพ</p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>ยืนยันการลบรูปภาพ</h3>
        <p>คุณแน่ใจหรือไม่ที่จะลบรูปภาพนี้?</p>
        <div class="modal-buttons">
          <button @click="removeImage" class="confirm-btn">ยืนยัน</button>
          <button @click="closeModal" class="cancel-btn">ยกเลิก</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BannerAd',
  props: {
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      currentImage: null,
      isAdmin: false,
      showDeleteModal: false
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleFileUpload(event) {
      const file = event.target.files[0]
      if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('ไฟล์มีขนาดใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB')
          return
        }
        
        const reader = new FileReader()
        reader.onload = (e) => {
          this.currentImage = e.target.result
          // Save to localStorage with a specific key
          localStorage.setItem('bannerImageData', e.target.result)
          // Also save the last update timestamp
          localStorage.setItem('bannerImageLastUpdate', new Date().toISOString())
        }
        reader.readAsDataURL(file)
      }
    },
    showDeleteConfirmation() {
      this.showDeleteModal = true
    },
    closeModal() {
      this.showDeleteModal = false
    },
    removeImage() {
      this.currentImage = null
      // Remove both the image data and timestamp
      localStorage.removeItem('bannerImageData')
      localStorage.removeItem('bannerImageLastUpdate')
      this.closeModal()
    },
    checkUserRole() {
      const userRole = localStorage.getItem('userRole')
      this.isAdmin = userRole === 'admin'
    },
    loadSavedImage() {
      // Try to load the image from localStorage
      const savedImage = localStorage.getItem('bannerImageData')
      if (savedImage) {
        this.currentImage = savedImage
      }
    }
  },
  mounted() {
    this.checkUserRole()
    this.loadSavedImage()
  }
}
</script>

<style scoped>
.banner-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 30px;
  position: relative;
}

.banner-display {
  width: 100%;
  height: 450px;
  border: 2px dashed #ddd;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.banner-display.has-image {
  border-style: solid;
}

.banner-display:hover {
  border-color: #28a745;
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
  z-index: 2;
  transition: all 0.3s ease;
}

.delete-btn:hover {
  background-color: #dc3545;
  transform: scale(1.1);
}

.delete-btn i {
  color: white;
  font-size: 14px;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.placeholder {
  color: #666;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.placeholder i {
  font-size: 48px;
  color: #ccc;
}

.placeholder p {
  margin: 0;
  font-size: 18px;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
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

.confirm-btn, .cancel-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.confirm-btn {
  background-color: #dc3545;
  color: white;
}

.confirm-btn:hover {
  background-color: #c82333;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background-color: #5a6268;
}
</style> 