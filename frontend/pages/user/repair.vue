<template>
  <LayoutUser>
    <div class="page-container">
      <h1 class="text-2xl font-bold mb-6 text-center">แบบฟอร์มแจ้งซ่อม</h1>
      
      <div class="form-content">
        <v-card class="form-card">
          <v-card-text>
            <v-form ref="form" v-model="isFormValid">
              <v-row>
                <v-col cols="12">
                  <v-select
                    v-model="selectedCategory"
                    :items="categoryOptions"
                    label="หมวดหมู่"
                    :rules="categoryRules"
                    outlined
                    dense
                    class="custom-select"
                  ></v-select>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="issue"
                    label="รายละเอียดปัญหา"
                    :rules="issueRules"
                    outlined
                    rows="4"
                    class="custom-textarea"
                  ></v-textarea>
                </v-col>
                <v-col cols="12">
                  <div class="form-group">
                    <label>รูปภาพประกอบ</label>
                    <input
                      type="file"
                      ref="fileInput"
                      multiple
                      accept="image/*"
                      @change="handleImageChange"
                      class="form-input"
                    >
                    <div v-if="imagePreview.length > 0" class="image-preview-container">
                      <div v-for="(preview, index) in imagePreview" :key="index" class="image-preview">
                        <img :src="preview" alt="Preview">
                        <div class="image-name">{{ images[index].name }}</div>
                        <v-btn
                          icon
                          small
                          color="error"
                          class="remove-image-btn"
                          @click="removeImage(index)"
                        >
                          <v-icon>mdi-close</v-icon>
                        </v-btn>
                      </div>
                    </div>
                  </div>
                </v-col>
                <v-col cols="12">
                  <v-btn
                    color="primary"
                    block
                    :loading="loading"
                    :disabled="!isFormValid || loading"
                    @click="handleSubmit"
                    class="submit-btn"
                  >
                    ส่งเรื่อง
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>

        <div class="history-link" @click="showHistory = true">
          ดูประวัติการแจ้งซ่อม
        </div>
      </div>

      <!-- Repair History Dialog -->
      <v-dialog v-model="showHistory" max-width="800px">
        <v-card>
          <v-card-title>
            ประวัติการแจ้งซ่อม
          </v-card-title>
          <v-card-text>
            <div v-if="loading" class="text-center">
              <div class="loading-spinner"></div>
            </div>
            <div v-else-if="repairHistory.length === 0" class="text-center text-gray-500">
              ยังไม่มีประวัติการแจ้งซ่อม
            </div>
            <div v-else class="history-list">
              <div 
                v-for="repair in repairHistory" 
                :key="repair._id"
                class="history-item"
              >
                <div class="history-item-header">
                  <div class="history-info">
                    <h3 class="canteen-name">{{ repair.canteen }}</h3>
                    <span class="report-date">{{ formatDate(repair.report_date) }}</span>
                  </div>
                  <div class="status-info">
                    <span 
                      class="status-badge"
                      :class="getStatusClass(repair.status)"
                    >
                      {{ getStatusText(repair.status) }}
                    </span>
                    <span v-if="repair.statusNote" class="status-note">
                      หมายเหตุ: {{ repair.statusNote }}
                    </span>
                  </div>
                </div>
                <div class="history-item-content">
                  <p class="category">หมวดหมู่: {{ getCategoryText(repair.category) }}</p>
                  <p class="issue">{{ repair.issue }}</p>
                  <div v-if="repair.images && repair.images.length" class="image-grid">
                    <img 
                      v-for="(image, index) in repair.images" 
                      :key="index"
                      :src="image"
                      @click="viewImages(repair.images)"
                      class="history-image"
                    />
                  </div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- Image Preview Dialog -->
      <v-dialog v-model="imageDialog" max-width="800px">
        <v-card>
          <v-card-text class="text-center">
            <img :src="selectedImages[0]" alt="รูปภาพปัญหา" class="dialog-image" />
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="imageDialog = false">
              ปิด
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </LayoutUser>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import LayoutUser from '@/components/LayoutUser.vue'
import axios from 'axios'
import { format } from 'date-fns'

const router = useRouter()

// Form refs and data
const form = ref(null)
const isFormValid = ref(false)
const loading = ref(false)
const selectedCategory = ref('')
const issue = ref('')
const images = ref([])
const imagePreview = ref([])
const repairHistory = ref([])
const imageDialog = ref(false)
const selectedImages = ref([])
const fileInput = ref(null)
const showHistory = ref(false)

// ดึงข้อมูลร้านค้าจาก localStorage
const shopData = ref(JSON.parse(localStorage.getItem('shopData') || '{}'))
const userId = ref(localStorage.getItem('userId'))

// Options
const categoryOptions = [
  'อุปกรณ์ไฟฟ้า',
  'ระบบน้ำ',
  'โครงสร้างอาคาร',
  'ความสะอาด',
  'อื่นๆ'
]

// Add these in the script setup section after the other refs
const categoryRules = [v => !!v || 'กรุณาเลือกหมวดหมู่']
const issueRules = [v => !!v || 'กรุณากรอกรายละเอียดปัญหา']

// Methods
const handleImageChange = (event) => {
  const files = Array.from(event.target.files)
  images.value = [...images.value, ...files]
  
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value.push(e.target.result)
    }
    reader.readAsDataURL(file)
  })
}

const removeImage = (index) => {
  images.value.splice(index, 1)
  imagePreview.value.splice(index, 1)
}

const handleSubmit = async () => {
  if (!selectedCategory.value || !issue.value) {
    const missingFields = []
    if (!selectedCategory.value) missingFields.push('หมวดหมู่')
    if (!issue.value) missingFields.push('รายละเอียดปัญหา')
    alert(`กรุณากรอก${missingFields.join(' และ ')}`)
    return
  }

  loading.value = true

  try {
    let base64Images = []
    if (images.value.length > 0) {
      const imagePromises = images.value.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve(e.target.result)
          reader.onerror = e => reject(e)
          reader.readAsDataURL(file)
        })
      })
      base64Images = await Promise.all(imagePromises)
    }

    const payload = {
      category: selectedCategory.value,
      issue: issue.value,
      images: base64Images
    }

    const response = await axios.post('http://localhost:4000/api/repairs', payload)

    if (response.data.success) {
      if (form.value) {
        form.value.reset()
      }
      
      selectedCategory.value = null
      issue.value = ''
      images.value = []
      imagePreview.value = []
      
      alert('บันทึกการแจ้งซ่อมเรียบร้อยแล้ว')
      await fetchRepairHistory()
      showHistory.value = true
    }
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    alert(error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง')
  } finally {
    loading.value = false
  }
}

const fetchRepairHistory = async () => {
  try {
    loading.value = true
    const token = localStorage.getItem('token')
    
    const response = await axios.get('http://localhost:4000/api/repairs/user', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    console.log('API Response:', response.data)
    if (response.data && Array.isArray(response.data)) {
      repairHistory.value = response.data
    } else if (response.data && Array.isArray(response.data.data)) {
      repairHistory.value = response.data.data
    } else {
      console.warn('Unexpected response format:', response.data)
      repairHistory.value = []
    }
  } catch (error) {
    console.error('Error fetching repair history:', error)
    alert('ไม่สามารถดึงข้อมูลประวัติการแจ้งซ่อมได้ กรุณาลองใหม่อีกครั้ง')
    repairHistory.value = []
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

const getStatusClass = (status) => {
  const statusClasses = {
    'pending': 'status-pending',
    'in_progress': 'status-progress',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled',
    'รอดำเนินการ': 'status-pending',
    'กำลังดำเนินการ': 'status-progress',
    'ซ่อมแล้ว': 'status-completed',
    'ยกเลิก': 'status-cancelled'
  }
  return statusClasses[status] || 'status-pending'
}

const getStatusText = (status) => {
  const statusTexts = {
    'pending': 'รอดำเนินการ',
    'in_progress': 'กำลังดำเนินการ',
    'completed': 'ซ่อมแล้ว',
    'cancelled': 'ยกเลิก',
    'รอดำเนินการ': 'รอดำเนินการ',
    'กำลังดำเนินการ': 'กำลังดำเนินการ',
    'ซ่อมแล้ว': 'ซ่อมแล้ว',
    'ยกเลิก': 'ยกเลิก'
  }
  return statusTexts[status] || 'รอดำเนินการ'
}

const getCategoryText = (category) => {
  return category
}

const viewImages = (images) => {
  selectedImages.value = images
  imageDialog.value = true
}

// Fetch repair history on mount
onMounted(async () => {
  await fetchRepairHistory()
})
</script>

<style scoped>
.page-container {
  min-height: calc(100vh - 200px);
  padding: 2rem;
  background-color: #f5f6fa;
  max-width: 800px;
  margin: 0 auto;
}

.form-content {
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.form-card {
  margin-bottom: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.custom-select {
  background-color: white;
}

.custom-textarea {
  background-color: white;
}

.custom-file-input {
  background-color: white;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #4a5568;
}

.form-input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
}

.image-preview-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.image-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-preview img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.image-name {
  padding: 0.5rem;
  background-color: #f8fafc;
  font-size: 0.875rem;
  color: #4a5568;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: rgba(255, 255, 255, 0.9);
}

.submit-btn {
  margin-top: 1rem;
}

/* History Section Styles */
.history-link {
  margin-top: 1rem;
  text-align: left;
  color: #4a5568;
  cursor: pointer;
  text-decoration: underline;
}

.history-link:hover {
  color: #2d3748;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 60vh;
  overflow-y: auto;
}

.history-item {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
}

.history-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.canteen-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
}

.report-date {
  font-size: 0.875rem;
  color: #718096;
}

.status-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.status-note {
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
  max-width: 300px;
  text-align: right;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-pending {
  background-color: #FEF3C7;
  color: #92400E;
}

.status-progress {
  background-color: #DBEAFE;
  color: #1E40AF;
}

.status-completed {
  background-color: #D1FAE5;
  color: #065F46;
}

.status-cancelled {
  background-color: #FEE2E2;
  color: #991B1B;
}

.history-item-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category {
  color: #4a5568;
  font-weight: 500;
}

.issue {
  color: #2d3748;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.history-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 4px;
  cursor: pointer;
}

.dialog-image {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 2rem auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Design */
@media (max-width: 640px) {
  .history-container {
    width: calc(100% - 32px);
    bottom: 80px;
  }
}

.upload-btn {
  height: 48px;
  font-size: 1rem;
  text-transform: none;
  letter-spacing: normal;
}
</style> 