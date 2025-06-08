<template>
  <LayoutAdmin>
    <div class="page-container">
      <div class="content-wrapper">
        <div class="header-section">
          <h1 class="page-title">รายการแจ้งซ่อม</h1>
        </div>

        <!-- Filters Section -->
        <div class="filters-section">
          <v-row>
            <v-col cols="12" sm="6">
              <v-select
                v-model="filters.canteen"
                :items="canteenOptions"
                label="โรงอาหาร"
                clearable
                outlined
                dense
                hide-details
                class="custom-select"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="filters.status"
                :items="statusOptions"
                label="สถานะ"
                clearable
                outlined
                dense
                hide-details
                class="custom-select"
              ></v-select>
            </v-col>
          </v-row>
        </div>

        <!-- Data Table -->
        <v-data-table
          :headers="headers"
          :items="filteredRepairs"
          :loading="loading"
          :search="search"
          class="elevation-1 custom-table"
          :items-per-page="10"
          :footer-props="{
            'items-per-page-options': [10, 20, 50],
            'items-per-page-text': 'รายการต่อหน้า'
          }"
          :no-data-text="'ยังไม่มีรายการแจ้งซ่อม'"
          :no-results-text="'ไม่พบรายการที่ค้นหา'"
          :loading-text="'กำลังโหลดข้อมูล...'"
        >
          <!-- Canteen Column -->
          <template v-slot:item.canteen="{ item }">
            <div class="d-flex align-center">
              <span class="font-weight-medium">{{ getCanteenText(item.canteen) }}</span>
            </div>
          </template>

          <!-- Category Column -->
          <template v-slot:item.category="{ item }">
            <v-chip
              :color="getCategoryColor(item.category)"
              small
              class="font-weight-medium"
            >
              {{ getCategoryText(item.category) }}
            </v-chip>
          </template>

          <!-- Issue Column -->
          <template v-slot:item.issue="{ item }">
            <div class="issue-cell">
              <span class="issue-text">{{ item.issue }}</span>
            </div>
          </template>

          <!-- Status Column -->
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              small
              class="font-weight-medium status-chip"
            >
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>

          <!-- Report Date Column -->
          <template v-slot:item.report_date="{ item }">
            {{ formatDate(item.report_date) }}
          </template>

          <!-- Actions Column -->
          <template v-slot:item.actions="{ item }">
            <div class="action-buttons">
              <v-btn
                v-if="item.images && item.images.length"
                small
                @click="viewImages(item.images)"
                class="action-btn image-btn"
              >
                รูปภาพ
              </v-btn>
              <v-btn
                small
                @click="openStatusDialog(item)"
                class="action-btn manage-btn"
              >
                จัดการ
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </div>

      <!-- Image Preview Dialog -->
      <v-dialog v-model="imageDialog" max-width="800px">
        <v-card>
          <v-card-title class="headline">
            รูปภาพประกอบ
          </v-card-title>
          <v-card-text>
            <v-carousel
              v-if="selectedImages.length > 0"
              hide-delimiter-background
              show-arrows-on-hover
            >
              <v-carousel-item
                v-for="(image, i) in selectedImages"
                :key="i"
                :src="image"
                contain
              ></v-carousel-item>
            </v-carousel>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="imageDialog = false">
              ปิด
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Status Update Dialog -->
      <v-dialog v-model="statusDialog" max-width="500px">
        <v-card>
          <v-card-title class="headline">
            อัปเดตสถานะ
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedStatus"
              :items="statusOptions"
              label="สถานะ"
              outlined
              :rules="[v => !!v || 'กรุณาเลือกสถานะ']"
            ></v-select>
            <v-textarea
              v-model="statusNote"
              label="หมายเหตุ (ถ้ามี)"
              outlined
              rows="3"
              placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey" text @click="statusDialog = false">
              ยกเลิก
            </v-btn>
            <v-btn 
              color="primary" 
              @click="updateStatus"
              :loading="updating"
              :disabled="!selectedStatus || updating"
            >
              บันทึก
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Note Dialog -->
      <v-dialog v-model="noteDialog" max-width="500px">
        <v-card>
          <v-card-title class="headline">
            หมายเหตุ
          </v-card-title>
          <v-card-text>
            <v-textarea
              v-model="selectedNote"
              label="หมายเหตุ"
              outlined
              rows="5"
              readonly
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" text @click="noteDialog = false">
              ปิด
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </LayoutAdmin>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import LayoutAdmin from '@/components/LayoutAdmin.vue'
import axios from 'axios'
import { format } from 'date-fns'

// Data
const loading = ref(false)
const repairs = ref([])
const search = ref('')
const imageDialog = ref(false)
const statusDialog = ref(false)
const noteDialog = ref(false)
const selectedImages = ref([])
const selectedStatus = ref('')
const statusNote = ref('')
const selectedNote = ref('')
const selectedRepair = ref(null)
const updating = ref(false)

// Filters
const filters = ref({
  canteen: null,
  status: null
})

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

const statusOptions = [
  'รอดำเนินการ',
  'กำลังดำเนินการ',
  'ซ่อมแล้ว'
]

// Table Headers
const headers = [
  { text: 'โรงอาหาร', value: 'canteen', sortable: true },
  { text: 'หมวดหมู่', value: 'category', sortable: true },
  { text: 'รายละเอียดปัญหา', value: 'issue', sortable: true },
  { text: 'สถานะ', value: 'status', sortable: true },
  { text: 'วันที่แจ้ง', value: 'report_date', sortable: true },
  { text: 'จัดการ', value: 'actions', sortable: false }
]

// Computed
const filteredRepairs = computed(() => {
  let result = [...repairs.value]

  if (filters.value.canteen) {
    result = result.filter(repair => repair.canteen === filters.value.canteen)
  }

  if (filters.value.status) {
    result = result.filter(repair => repair.status === filters.value.status)
  }

  return result
})

// Methods
const fetchRepairs = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/repairs/admin')
    console.log('API Response:', response.data)

    if (response.data && Array.isArray(response.data)) {
      repairs.value = response.data.map(repair => ({
        _id: repair._id,
        canteen: repair.canteen,
        category: repair.category,
        issue: repair.issue,
        status: repair.status,
        images: repair.images || [],
        report_date: repair.report_date,
        note: repair.note || ''
      }))
    } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
      repairs.value = response.data.data.map(repair => ({
        _id: repair._id,
        canteen: repair.canteen,
        category: repair.category,
        issue: repair.issue,
        status: repair.status,
        images: repair.images || [],
        report_date: repair.report_date,
        note: repair.note || ''
      }))
    } else {
      repairs.value = []
    }
    console.log('Processed Repairs:', repairs.value)
  } catch (error) {
    console.error('Error fetching repairs:', error)
    repairs.value = []
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

const getCategoryText = (category) => {
  return category || ''
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
  return status || ''
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

const openStatusDialog = (item) => {
  selectedRepair.value = item
  selectedStatus.value = item.status
  statusNote.value = item.note || ''
  statusDialog.value = true
}

const updateStatus = async () => {
  if (!selectedStatus.value || !selectedRepair.value?._id) {
    alert('กรุณาเลือกสถานะที่ต้องการอัปเดต')
    return
  }
  
  updating.value = true
  try {
    // ตรวจสอบข้อมูลก่อนส่ง request
    const updateData = {
      status: selectedStatus.value,
      note: statusNote.value || ''
    }

    console.log('Sending update request:', {
      repairId: selectedRepair.value._id,
      data: updateData
    })

    // อัปเดตสถานะผ่าน API
    const response = await axios.put(`/api/repairs/${selectedRepair.value._id}/status`, updateData)
    
    if (response.data) {
      // อัปเดตข้อมูลในตาราง admin
      const index = repairs.value.findIndex(repair => repair._id === selectedRepair.value._id)
      if (index !== -1) {
        // สร้าง object ใหม่เพื่อให้ Vue ตรวจจับการเปลี่ยนแปลง
        const updatedRepair = {
          ...repairs.value[index],
          status: selectedStatus.value,
          note: statusNote.value || '',
          updated_at: new Date().toISOString()
        }
        
        // อัปเดตข้อมูลในอาร์เรย์
        repairs.value.splice(index, 1, updatedRepair)
        
        // รีเฟรชข้อมูลทั้งหมด
        await fetchRepairs()
      }
      
      // ปิด dialog
      statusDialog.value = false
      
      // รีเซ็ตค่า
      selectedStatus.value = ''
      statusNote.value = ''
      selectedRepair.value = null

      // แสดงข้อความสำเร็จ
      alert('อัปเดตสถานะเรียบร้อยแล้ว')
    }
  } catch (error) {
    console.error('Error updating status:', error)
    if (error.response) {
      // กรณีมี response จาก server
      console.error('Server response:', error.response.data)
      alert(`เกิดข้อผิดพลาด: ${error.response.data.message || 'กรุณาลองใหม่อีกครั้ง'}`)
    } else if (error.request) {
      // กรณีไม่ได้รับ response
      console.error('No response received:', error.request)
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง')
    } else {
      // กรณีอื่นๆ
      console.error('Error message:', error.message)
      alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ กรุณาลองใหม่อีกครั้ง')
    }
  } finally {
    updating.value = false
  }
}

const openNoteDialog = (item) => {
  selectedNote.value = item.note || 'ไม่มีหมายเหตุ'
  noteDialog.value = true
}

const getCanteenText = (value) => {
  return value || ''
}

// เพิ่มฟังก์ชันสำหรับรีเฟรชข้อมูล
const refreshData = async () => {
  try {
    await fetchRepairs()
  } catch (error) {
    console.error('Error refreshing data:', error)
  }
}

// เพิ่มการเรียกใช้ refreshData ทุก 30 วินาที
onMounted(() => {
  fetchRepairs()
  // รีเฟรชข้อมูลทุก 30 วินาที
  const refreshInterval = setInterval(refreshData, 30000)
  
  // ล้าง interval เมื่อ component ถูกทำลาย
  onUnmounted(() => {
    clearInterval(refreshInterval)
  })
})
</script>

<style scoped>
.page-container {
  padding: 2rem;
  background-color: #f5f6fa;
  min-height: calc(100vh - 64px);
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
}

.filters-section {
  background-color: white;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.custom-select {
  background-color: white;
}

.custom-select :deep(.v-select__selections) {
  font-size: 14px;
}

.custom-table :deep(.v-data-table__wrapper) {
  border-radius: 8px;
  overflow: hidden;
}

.status-chip {
  min-width: 120px;
  justify-content: center;
}

.issue-cell {
  display: flex;
  align-items: center;
  max-width: 300px;
}

.issue-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.action-btn {
  border-radius: 20px;
  min-width: 80px;
  height: 32px;
  padding: 0 16px;
  margin: 0 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  font-size: 14px;
  text-transform: none;
  letter-spacing: normal;
  color: white;
}

.image-btn {
  background-color: #2196F3;
}

.image-btn:hover {
  background-color: #1976D2;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.manage-btn {
  background-color: #4CAF50;
}

.manage-btn:hover {
  background-color: #388E3C;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

/* Responsive Design */
@media (max-width: 600px) {
  .page-container {
    padding: 1rem;
  }

  .header-section {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .filters-section {
    padding: 0.5rem;
  }

  .status-chip {
    min-width: 100px;
  }
}
</style> 