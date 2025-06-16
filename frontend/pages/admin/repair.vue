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
          <!-- Header Labels -->
          <template v-slot:header.canteen>
            <span><b>โรงอาหาร</b></span>
          </template>
          <template v-slot:header.shopName>
            <span><b>ชื่อร้านค้า</b></span>
          </template>
          <template v-slot:header.category>
            <span><b>หมวดหมู่</b></span>
          </template>
          <template v-slot:header.issue>
            <span><b>ปัญหา</b></span>
          </template>
          <template v-slot:header.status>
            <span><b>สถานะ</b></span>
          </template>
          <template v-slot:header.report_date>
            <span><b>วันที่แจ้ง</b></span>
          </template>
          <template v-slot:header.actions>
            <span><b>การจัดการ</b></span>
          </template>

          <!-- Canteen Column -->
          <template v-slot:item.canteen="{ item }">
            <div class="d-flex align-center">
              <span class="font-weight-medium">{{ item.canteen }}</span>
            </div>
          </template>

          <!-- Shop Name Column -->
          <template v-slot:item.shopName="{ item }">
            <div class="d-flex align-center">
              <span class="font-weight-medium">{{ item.shopName }}</span>
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
const selectedImages = ref([])
const selectedStatus = ref('')
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

// เพิ่ม canteenMap
const canteenMap = {
  1: 'โรงอาหารC5',
  2: 'โรงอาหารD1',
  3: 'โรงอาหารDormitory',
  4: 'โรงอาหารE1',
  5: 'โรงอาหารE2',
  6: 'โรงอาหารEpark',
  7: 'โรงอาหารMsquare',
  8: 'โรงอาหารRuemrim',
  9: 'โรงอาหารS2'
}

// Table Headers
const headers = [
  { text: 'โรงอาหาร', value: 'canteen', sortable: true },
  { text: 'ร้านค้า', value: 'shopName', sortable: true },
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

  return result.map(repair => ({
    ...repair,
    canteen: repair.canteen || canteenMap[repair.canteenId] || 'ไม่ระบุโรงอาหาร',
    shopName: repair.shopName || 'ไม่ระบุร้านค้า'
  }))
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
        canteenId: repair.canteenId,
        canteen: repair.canteen || canteenMap[repair.canteenId] || 'ไม่ระบุโรงอาหาร',
        shopName: repair.shopName || 'ไม่ระบุร้านค้า',
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
        canteenId: repair.canteenId,
        canteen: repair.canteen || canteenMap[repair.canteenId] || 'ไม่ระบุโรงอาหาร',
        shopName: repair.shopName || 'ไม่ระบุร้านค้า',
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
  statusDialog.value = true
}

const updateStatus = async () => {
  if (!selectedStatus.value || !selectedRepair.value?._id) {
    alert('กรุณาเลือกสถานะที่ต้องการอัปเดต')
    return
  }
  
  updating.value = true
  try {
    const updateData = {
      status: selectedStatus.value
    }

    console.log('Sending update request:', {
      repairId: selectedRepair.value._id,
      data: updateData
    })

    const response = await axios.put(`/api/repairs/${selectedRepair.value._id}/status`, updateData)
    
    if (response.data) {
      const index = repairs.value.findIndex(repair => repair._id === selectedRepair.value._id)
      if (index !== -1) {
        const updatedRepair = {
          ...repairs.value[index],
          status: selectedStatus.value,
          updated_at: new Date().toISOString()
        }
        
        repairs.value.splice(index, 1, updatedRepair)
        await fetchRepairs()
      }
      
      statusDialog.value = false
      selectedStatus.value = ''
      selectedRepair.value = null

      alert('อัปเดตสถานะเรียบร้อยแล้ว')
    }
  } catch (error) {
    console.error('Error updating status:', error)
    alert('เกิดข้อผิดพลาดในการอัปเดตสถานะ กรุณาลองใหม่อีกครั้ง')
  } finally {
    updating.value = false
  }
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

.font-weight-medium {
  font-weight: 500;
}
</style> 