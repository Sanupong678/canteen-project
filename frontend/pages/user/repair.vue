<template>
  <LayoutUser>
    <div class="page-container">
      <h1 class="text-2xl font-bold mb-6 text-center">แบบฟอร์มแจ้งซ่อม</h1>
      
      <div class="form-content">
        <v-card class="form-card">
          <v-card-text>
            <v-form ref="form" v-model="isFormValid">
              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="selectedCanteen"
                    :items="canteenOptions"
                    label="โรงอาหาร"
                    :rules="[v => !!v || 'กรุณาเลือกโรงอาหาร']"
                    outlined
                    dense
                    class="custom-select"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="selectedCategory"
                    :items="categoryOptions"
                    label="หมวดหมู่"
                    :rules="[v => !!v || 'กรุณาเลือกหมวดหมู่']"
                    outlined
                    dense
                    class="custom-select"
                  ></v-select>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="issue"
                    label="รายละเอียดปัญหา"
                    :rules="[v => !!v || 'กรุณากรอกรายละเอียดปัญหา']"
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
                  <span 
                    class="status-badge"
                    :class="getStatusClass(repair.status)"
                  >
                    {{ getStatusText(repair.status) }}
                  </span>
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
import { ref, computed, onUnmounted, defineComponent, onMounted } from 'vue'
import LayoutUser from '@/components/LayoutUser.vue'
import axios from 'axios'
import { format, addMonths } from 'date-fns'
import { useRouter } from 'vue-router'

defineComponent({
  name: 'RepairPage',
  components: {
    LayoutUser
  }
})

const router = useRouter()

// Form data
const form = ref(null)
const isFormValid = ref(false)
const loading = ref(false)
const selectedCanteen = ref('')
const selectedCategory = ref('')
const issue = ref('')
const images = ref([])
const imagePreview = ref([])
const repairHistory = ref([])
const imageDialog = ref(false)
const selectedImages = ref([])
const fileInput = ref(null)
const showHistory = ref(false)

// Store repair data
const repairData = ref([])

// Options
const canteenOptions = [
  'โรงอาหารC5',
  'โรงอาหารD1',
  'โรงอาหารDormitory',
  'โรงอาหารE1',
  'โรงอาหารE2',
  'โรงอาหารEpark',
  'โรงอาหารMsquare',
  'โรงอาหารRuemrim',
  'โรงอาหารS2'
]

const categoryOptions = [
  'น้ำ',
  'ไฟ',
  'สาธารณูปโภค',
  'อื่นๆ'
]

// Methods
const handleImageChange = (event) => {
  const files = event.target.files
  if (files) {
    images.value = Array.from(files)
    imagePreview.value = []
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = e => {
        imagePreview.value.push(e.target.result)
      }
      reader.readAsDataURL(file)
    })
  }
}

const removeImage = (index) => {
  imagePreview.value.splice(index, 1)
  images.value.splice(index, 1)
}

const handleSubmit = async () => {
  if (!form.value.validate()) return

  loading.value = true
  try {
    // สร้างข้อมูลที่จะส่งไป MongoDB
    const repairData = {
      customId: 'CANTEEN001',
      canteen: selectedCanteen.value,
      category: selectedCategory.value,
      issue: issue.value,
      status: 'รอดำเนินการ',
      report_date: new Date().toISOString(),
      images: imagePreview.value // ส่ง base64 images โดยตรง
    }

    console.log('Sending data:', repairData) // เพิ่ม log

    // ส่งข้อมูลไปยัง API
    const response = await axios.post('/api/repairs', repairData, {
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('Server response:', response.data) // เพิ่ม log

    // รีเซ็ตฟอร์ม
    form.value.reset()
    selectedCanteen.value = ''
    selectedCategory.value = ''
    issue.value = ''
    images.value = []
    imagePreview.value = []
    
    // เคลียร์ช่องไฟล์
    if (fileInput.value) {
      fileInput.value.value = ''
    }

    // แสดงข้อความสำเร็จ
    alert('ส่งเรื่องแจ้งซ่อมเรียบร้อยแล้ว')
    
    // รีเฟรชประวัติ
    await fetchRepairHistory()
    
    // แสดงประวัติการแจ้งซ่อม
    showHistory.value = true

  } catch (error) {
    console.error('Error submitting repair:', error)
    if (error.response && error.response.data) {
      console.log('Server response:', error.response.data)
      alert('ส่งเรื่องแจ้งซ่อมเรียบร้อยแล้ว แต่มีข้อผิดพลาดในการแสดงผล')
      await fetchRepairHistory()
    } else {
      alert('เกิดข้อผิดพลาดในการส่งเรื่อง กรุณาลองใหม่อีกครั้ง')
    }
  } finally {
    loading.value = false
  }
}

// Clean up expired images
const cleanupExpiredImages = () => {
  const now = new Date()
  repairData.value = repairData.value.map(repair => ({
    ...repair,
    images: repair.images?.filter(img => {
      const isExpired = new Date(img.expiresAt) <= now
      if (isExpired) {
        URL.revokeObjectURL(img.url)
      }
      return !isExpired
    })
  }))
}

let cleanupInterval = null

// Set up cleanup interval
onMounted(() => {
  cleanupInterval = setInterval(cleanupExpiredImages, 24 * 60 * 60 * 1000)
})

// Clean up on component unmount
onUnmounted(() => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
  }
  // Clean up all image URLs
  repairData.value.forEach(repair => {
    repair.images?.forEach(img => URL.revokeObjectURL(img.url))
  })
})

// Fetch repair history
const fetchRepairHistory = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/repairs/user')
    console.log('History response:', response.data)

    if (response.data && response.data.data) {
      repairHistory.value = response.data.data.map(repair => ({
        customId: repair.customId,
        canteen: repair.canteen,
        category: repair.category,
        issue: repair.issue,
        status: repair.status,
        images: repair.images || [],
        report_date: repair.report_date || new Date().toISOString(),
        _id: repair._id
      }))
    } else {
      repairHistory.value = []
    }
  } catch (error) {
    console.error('Error fetching repair history:', error)
    repairHistory.value = []
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

const getCategoryText = (category) => {
  return category
}

const getCategoryColor = (category) => {
  const colorMap = {
    'น้ำ': 'blue',
    'ไฟ': 'orange',
    'สาธารณูปโภค': 'green',
    'อื่นๆ': 'grey'
  }
  return colorMap[category] || 'grey'
}

const getStatusText = (status) => {
  return status
}

const getStatusColor = (status) => {
  const colorMap = {
    'รอดำเนินการ': 'warning',
    'กำลังดำเนินการ': 'info',
    'ซ่อมแล้ว': 'success'
  }
  return colorMap[status] || 'grey'
}

const viewImages = (images) => {
  selectedImages.value = images
  imageDialog.value = true
}

// Fetch data on component mount
fetchRepairHistory()
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

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
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