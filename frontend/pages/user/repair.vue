<template>
  <LayoutUser>
    <div class="page-container">
      <div class="content-wrapper">
        <div class="header-section">
          <h1 class="page-title">แจ้งซ่อม</h1>
        </div>

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

          <div class="history-link" @click="showHistory = !showHistory">
            ประวัติการแจ้งซ่อม
          </div>

          <div v-if="showHistory" class="history-container">
            <div v-if="repairHistory.length === 0" class="text-gray-500 text-center py-4">
              <p class="text-lg font-medium mb-2">ยังไม่เคยแจ้งซ่อมมาก่อน</p>
              <p class="text-sm text-gray-400">เมื่อคุณแจ้งซ่อมครั้งแรก ข้อมูลจะแสดงที่นี่</p>
            </div>
            <div v-else class="space-y-3">
              <div
                v-for="(repair, index) in repairHistory"
                :key="repair._id"
                class="history-item"
              >
                <p class="font-semibold">วันที่แจ้ง: {{ formatDate(repair.report_date) }}</p>
                <p class="font-semibold">หมวดหมู่: {{ getCategoryText(repair.category) }}</p>
                <p class="issue-text">รายละเอียดปัญหา: {{ repair.issue }}</p>
                <p class="status-badge" :class="getStatusClass(repair.status)">
                  สถานะ: {{ getStatusText(repair.status) }}
                </p>
                <div v-if="repair.images && repair.images.length" class="image-grid">
                  <img 
                    v-for="(image, imgIndex) in repair.images" 
                    :key="imgIndex"
                    :src="image"
                    @click="viewImages(repair.images)"
                    class="history-image"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

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
    
    const response = await axios.get('http://localhost:4000/api/repairs/user')
    console.log('API Response:', response.data)
    if (response.data && Array.isArray(response.data)) {
      repairHistory.value = response.data
    } else if (response.data && Array.isArray(response.data.data)) {
      repairHistory.value = response.data.data
    } else {
      console.warn('Unexpected response format:', response.data)
      repairHistory.value = []
    }
    
    // ตรวจสอบข้อความจาก backend
    if (response.data && response.data.message) {
      console.log('Repair history message:', response.data.message)
    }
  } catch (error) {
    console.error('Error fetching repair history:', error)
    repairHistory.value = []
    // ไม่แสดง alert เพราะอาจเป็นกรณีที่ยังไม่เคยแจ้งซ่อม
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
  padding: 2rem;
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
  overflow: hidden;
}

.content-wrapper {
  max-width: 800px;
  margin: 0 auto;
  overflow: hidden;
}

.header-section {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.15);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.form-content {
  background: #ffffff;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.1);
}

.form-card {
  margin-bottom: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
}

.custom-select {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
}

.custom-textarea {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
}

.custom-file-input {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2d3748;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
}

.form-input:focus {
  outline: none;
  border-color: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.image-preview-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.image-preview {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.15);
  transition: all 0.3s ease;
}

.image-preview:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.2);
}

.image-preview img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.image-name {
  padding: 0.75rem;
  background: linear-gradient(135deg, #fdf2f2 0%, #fce8e8 100%);
  font-size: 0.875rem;
  color: #2d3748;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.remove-image-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(231, 76, 60, 0.9);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.remove-image-btn:hover {
  background: #c0392b;
  transform: scale(1.1);
}

.submit-btn {
  margin-top: 1.5rem;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.2);
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.3);
}

.submit-btn:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* History Section Styles */
.history-link {
  color: #e74c3c;
  font-weight: 600;
  padding: 12px 20px;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #fdf2f2 0%, #fce8e8 100%);
  border: none;
  cursor: pointer;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
  margin-bottom: 1rem;
  text-align: center;
  text-decoration: none;
}

.history-link:hover {
  color: #c0392b;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.15);
}

.history-container {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-top: 1rem;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.1);
  border-left: 4px solid #e74c3c;
}

.history-item {
  background: linear-gradient(135deg, #fdf2f2 0%, #fce8e8 100%);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.history-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.15);
}

.history-item:last-child {
  margin-bottom: 0;
}

.font-semibold {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.issue-text {
  margin-bottom: 0.5rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #fdf2f2 0%, #fce8e8 100%);
  border-radius: 8px;
  border-left: 4px solid #e74c3c;
  color: #2d3748;
  line-height: 1.6;
  font-size: 14px;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  margin-top: 0.5rem;
  min-width: 120px;
  text-align: center;
}

.status-pending {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  color: #92400E;
}

.status-progress {
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  color: #1E40AF;
}

.status-completed {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  color: #065F46;
}

.status-cancelled {
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  color: #991B1B;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.history-image {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.history-image:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.dialog-image {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

/* ซ่อน Scrollbar */
::-webkit-scrollbar {
  display: none;
}

* {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .header-section {
    padding: 16px;
  }

  .form-content {
    padding: 1.5rem;
  }

  .history-item {
    padding: 1rem;
  }

  .history-item-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .status-info {
    align-items: flex-start;
  }

  .status-badge {
    min-width: 100px;
  }
}

.text-gray-500 {
  color: #6b7280;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-center {
  text-align: center;
}

.py-4 {
  padding-top: 1rem;
  padding-bottom: 1rem;
}

.text-lg {
  font-size: 1.125rem;
}

.font-medium {
  font-weight: 500;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.text-sm {
  font-size: 0.875rem;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}
</style> 