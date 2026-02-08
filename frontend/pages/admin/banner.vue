<template>
  <LayoutAdmin>
    <div class="banner-management-page">
      <div class="content-wrapper">
        <!-- Header Section -->
        <div class="header-section">
          <div class="header-content">
            <div>
              <h1 class="page-title">จัดการแบนเนอร์</h1>
              <p class="page-subtitle">อัปโหลดและจัดการภาพแบนเนอร์ที่จะแสดงในหน้าแรก</p>
            </div>
            <div class="header-stats">
              <div class="stat-card">
                <div class="stat-icon">
                  <i class="fas fa-image"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ banners.length }}</div>
                  <div class="stat-label">แบนเนอร์ทั้งหมด</div>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon active">
                  <i class="fas fa-check-circle"></i>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ activeBannersCount }}</div>
                  <div class="stat-label">เปิดใช้งาน</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Add New Banner Card -->
        <v-card class="add-banner-card" elevation="2">
          <v-card-title class="card-title">
            <i class="fas fa-plus-circle card-icon"></i>
            <span>เพิ่มแบนเนอร์ใหม่</span>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newBanner.title"
                  label="ชื่อแบนเนอร์"
                  placeholder="กรุณากรอกชื่อแบนเนอร์"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-text"
                  :rules="[v => !!v || 'กรุณากรอกชื่อแบนเนอร์']"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="newBanner.link"
                  label="ลิงก์ (ไม่บังคับ)"
                  placeholder="https://example.com"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-link"
                />
              </v-col>
              <v-col cols="12">
                <div class="image-upload-section">
                  <label class="upload-label">
                    <i class="fas fa-cloud-upload-alt upload-icon"></i>
                    <span class="upload-text">เลือกรูปภาพ</span>
                    <input
                      type="file"
                      ref="fileInput"
                      @change="handleImageUpload"
                      accept="image/*"
                      class="file-input"
                    />
                  </label>
                  <div v-if="imagePreview" class="image-preview">
                    <img :src="imagePreview" alt="Preview" />
                    <button @click="clearImagePreview" class="remove-preview-btn">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <p v-if="newBanner.image" class="file-name">
                    <i class="fas fa-file-image"></i>
                    {{ newBanner.image.name }}
                  </p>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="card-actions">
            <v-spacer />
            <v-btn
              @click="resetForm"
              variant="outlined"
              color="grey"
              prepend-icon="mdi-refresh"
            >
              รีเซ็ต
            </v-btn>
            <v-btn
              @click="addBanner"
              color="primary"
              prepend-icon="mdi-plus"
              :loading="uploading"
              :disabled="!newBanner.title || !newBanner.image"
            >
              เพิ่มแบนเนอร์
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- Banners List -->
        <v-card class="banners-list-card" elevation="2">
          <v-card-title class="card-title">
            <i class="fas fa-images card-icon"></i>
            <span>แบนเนอร์ทั้งหมด ({{ banners.length }})</span>
          </v-card-title>
          <v-card-text>
            <div v-if="banners.length === 0" class="empty-state">
              <div class="empty-icon">
                <i class="fas fa-image"></i>
              </div>
              <h3 class="empty-title">ยังไม่มีแบนเนอร์</h3>
              <p class="empty-description">เริ่มต้นโดยการเพิ่มแบนเนอร์ใหม่</p>
            </div>
            <div v-else class="banners-grid">
              <div
                v-for="banner in banners"
                :key="banner._id"
                class="banner-card"
                :class="{ inactive: !banner.isActive }"
              >
                <div class="banner-image-wrapper">
                  <img
                    v-if="banner.imageFilename"
                    :src="getImageUrl(banner)"
                    :alt="banner.title"
                    class="banner-image"
                    @error="handleImageError"
                  />
                  <div v-else class="banner-placeholder">
                    <i class="fas fa-image"></i>
                    <span>ไม่มีรูปภาพ</span>
                  </div>
                  <div class="banner-overlay">
                    <v-chip
                      :color="banner.isActive ? 'success' : 'error'"
                      size="small"
                      class="status-chip"
                    >
                      <i class="fas" :class="banner.isActive ? 'fa-check-circle' : 'fa-times-circle'"></i>
                      {{ banner.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
                    </v-chip>
                  </div>
                </div>
                <div class="banner-content">
                  <h3 class="banner-title">{{ banner.title }}</h3>
                  <p v-if="banner.description" class="banner-description">
                    <i class="fas fa-link"></i>
                    {{ banner.description }}
                  </p>
                  <div class="banner-actions">
                    <v-btn
                      @click="toggleBannerStatus(banner)"
                      :color="banner.isActive ? 'warning' : 'success'"
                      size="small"
                      variant="outlined"
                      prepend-icon="mdi-power"
                    >
                      {{ banner.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน' }}
                    </v-btn>
                    <v-btn
                      @click="confirmDelete(banner)"
                      color="error"
                      size="small"
                      variant="outlined"
                      prepend-icon="mdi-delete"
                    >
                      ลบ
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Delete Confirmation Dialog -->
      <v-dialog v-model="showDeleteDialog" max-width="500" persistent>
        <v-card>
          <v-card-title class="dialog-title">
            <i class="fas fa-exclamation-triangle warning-icon"></i>
            ยืนยันการลบ
          </v-card-title>
          <v-card-text>
            <p>คุณต้องการลบแบนเนอร์ "<strong>{{ bannerToDelete?.title }}</strong>" ใช่หรือไม่?</p>
            <p class="warning-text">การกระทำนี้ไม่สามารถยกเลิกได้</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              @click="showDeleteDialog = false"
              variant="outlined"
              color="grey"
            >
              ยกเลิก
            </v-btn>
            <v-btn
              @click="deleteBanner"
              color="error"
              prepend-icon="mdi-delete"
              :loading="deleting"
            >
              ลบ
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </LayoutAdmin>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import LayoutAdmin from '@/components/LayoutAdmin.vue'
import axios from 'axios'

const banners = ref([])
const uploading = ref(false)
const deleting = ref(false)
const showDeleteDialog = ref(false)
const bannerToDelete = ref(null)
const fileInput = ref(null)
const imagePreview = ref(null)

const newBanner = ref({
  title: '',
  image: null,
  link: '',
  active: true
})

const backendUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-domain.com' 
  : 'http://localhost:4000'

const activeBannersCount = computed(() => {
  return banners.value.filter(b => b.isActive).length
})

const getImageUrl = (banner) => {
  return `${backendUrl}/api/backgrounds/${banner._id}/image`
}

// Fetch banners from API
const loadBanners = async () => {
  try {
    const response = await axios.get(`${backendUrl}/api/backgrounds`)
    if (response.data.success) {
      banners.value = response.data.data
    }
  } catch (error) {
    console.error('Error loading banners:', error)
  }
}

// Handle image upload
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5MB')
      return
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกรูปภาพเท่านั้น')
      return
    }
    
    newBanner.value.image = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const clearImagePreview = () => {
  imagePreview.value = null
  newBanner.value.image = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const resetForm = () => {
  newBanner.value = {
    title: '',
    image: null,
    link: '',
    active: true
  }
  clearImagePreview()
}

// Add new banner
const addBanner = async () => {
  if (!newBanner.value.title || !newBanner.value.image) {
    alert('กรุณากรอกชื่อและเลือกรูปภาพ')
    return
  }

  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('title', newBanner.value.title)
    formData.append('image', newBanner.value.image)
    formData.append('description', newBanner.value.link || '')

    const response = await axios.post(`${backendUrl}/api/backgrounds`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data.success) {
      banners.value.push(response.data.data)
      resetForm()
      alert('เพิ่มแบนเนอร์สำเร็จ')
    }
  } catch (error) {
    console.error('Error adding banner:', error)
    alert('เกิดข้อผิดพลาดในการเพิ่มแบนเนอร์: ' + (error.response?.data?.error || error.message))
  } finally {
    uploading.value = false
  }
}

// Confirm delete
const confirmDelete = (banner) => {
  bannerToDelete.value = banner
  showDeleteDialog.value = true
}

// Delete banner
const deleteBanner = async () => {
  if (!bannerToDelete.value) return

  deleting.value = true
  try {
    await axios.delete(`${backendUrl}/api/backgrounds/${bannerToDelete.value._id}`)
    banners.value = banners.value.filter(banner => banner._id !== bannerToDelete.value._id)
    showDeleteDialog.value = false
    bannerToDelete.value = null
    alert('ลบแบนเนอร์สำเร็จ')
  } catch (error) {
    console.error('Error deleting banner:', error)
    alert('เกิดข้อผิดพลาดในการลบแบนเนอร์: ' + (error.response?.data?.error || error.message))
  } finally {
    deleting.value = false
  }
}

// Toggle banner status
const toggleBannerStatus = async (banner) => {
  try {
    const response = await axios.patch(`${backendUrl}/api/backgrounds/${banner._id}/toggle`, {})
    
    if (response.data.success) {
      const index = banners.value.findIndex(b => b._id === banner._id)
      if (index !== -1) {
        banners.value[index] = response.data.data
      }
    }
  } catch (error) {
    console.error('Error toggling banner status:', error)
    alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะแบนเนอร์: ' + (error.response?.data?.error || error.message))
  }
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
}

// Load banners when component mounts
onMounted(() => {
  loadBanners()
})
</script>

<style scoped>
.banner-management-page {
  padding: 1rem;
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
}

.content-wrapper {
  max-width: 1400px;
  margin: 0 auto;
}

/* Header Section */
.header-section {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.15);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;
  font-family: 'Kanit', sans-serif;
}

.page-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.header-stats {
  display: flex;
  gap: 1rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 150px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
}

.stat-icon.active {
  background: rgba(76, 175, 80, 0.3);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.25rem;
}

/* Cards */
.add-banner-card,
.banners-list-card {
  margin-bottom: 2rem;
  border-radius: 16px;
  overflow: hidden;
}

.card-title {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a202c;
}

.card-icon {
  font-size: 1.5rem;
  color: #667eea;
}

.card-actions {
  padding: 1rem 1.5rem;
  background: #f8f9fa;
}

/* Image Upload Section */
.image-upload-section {
  margin-top: 0.5rem;
}

.upload-label {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border: 2px dashed #cbd5e0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #f8f9fa;
  width: 100%;
  justify-content: center;
}

.upload-label:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.upload-icon {
  font-size: 1.5rem;
  color: #667eea;
}

.upload-text {
  font-weight: 500;
  color: #4a5568;
}

.file-input {
  display: none;
}

.image-preview {
  position: relative;
  margin-top: 1rem;
  border-radius: 12px;
  overflow: hidden;
  max-width: 400px;
}

.image-preview img {
  width: 100%;
  height: auto;
  display: block;
}

.remove-preview-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.3s ease;
}

.remove-preview-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.file-name {
  margin-top: 0.5rem;
  color: #4a5568;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  color: #cbd5e0;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #4a5568;
  margin: 0 0 0.5rem 0;
}

.empty-description {
  color: #718096;
  margin: 0;
}

/* Banners Grid */
.banners-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.banner-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.banner-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  border-color: #667eea;
}

.banner-card.inactive {
  opacity: 0.7;
}

.banner-image-wrapper {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f8f9fa;
}

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #cbd5e0;
  gap: 0.5rem;
}

.banner-placeholder i {
  font-size: 3rem;
}

.banner-overlay {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
}

.status-chip {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9) !important;
}

.banner-content {
  padding: 1.25rem;
}

.banner-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
}

.banner-description {
  font-size: 0.875rem;
  color: #718096;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  word-break: break-all;
}

.banner-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Dialog */
.dialog-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #e74c3c;
}

.warning-icon {
  font-size: 1.5rem;
}

.warning-text {
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-stats {
    width: 100%;
  }

  .stat-card {
    flex: 1;
  }

  .banners-grid {
    grid-template-columns: 1fr;
  }
}
</style>
