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
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="search"
                label="ค้นหาชื่อร้านค้า"
                outlined
                dense
                hide-details
                class="custom-select"
                prepend-inner-icon="mdi-magnify"
                clearable
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="4">
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
            <v-col cols="12" sm="4">
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

          <!-- Images Column -->
          <template v-slot:item.images="{ item }">
            <div class="d-flex align-center">
              <v-btn
                v-if="item.imagePaths && item.imagePaths.length > 0"
                color="primary"
                small
                text
                @click="showImages(item.imagePaths, item._id)"
              >
                ดูรูปภาพ ({{ item.imagePaths.length }})
              </v-btn>
              <span v-else class="text-grey">ไม่มีรูปภาพ</span>
            </div>
          </template>

          <!-- Actions Column -->
          <template v-slot:item.actions="{ item }">
            <div class="action-buttons">
              <v-btn
                v-if="item.imagePaths && item.imagePaths.length > 0"
                small
                @click="showImages(item.imagePaths, item._id)"
                class="action-btn image-btn"
              >
                รูปภาพ ({{ item.imagePaths.length }})
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
                @error="handleImageError"
                crossorigin="anonymous"
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
import { useNuxtApp } from '#app'
import LayoutAdmin from '@/components/LayoutAdmin.vue'
import { format } from 'date-fns'

// Get $axios from Nuxt
const { $axios } = useNuxtApp()

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

  // ค้นหาตามชื่อร้านค้า
  if (search.value) {
    result = result.filter(repair => 
      repair.shopName && repair.shopName.toLowerCase().includes(search.value.toLowerCase())
    )
  }

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
    const response = await $axios.get('/api/repairs/admin')
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
        note: repair.note || '',
        imagePaths: repair.imagePaths || [] // ใช้ imagePaths จาก backend
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
        note: repair.note || '',
        imagePaths: repair.imagePaths || [] // ใช้ imagePaths จาก backend
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

const showImages = (imagePaths, repairId) => {
  // สร้าง URL สำหรับรูปภาพ
  const imageUrls = imagePaths.map((_, index) => {
    return `${$axios.defaults.baseURL}/api/repairs/${repairId}/image/${index}`
  })
  selectedImages.value = imageUrls
  imageDialog.value = true
}

// เพิ่มฟังก์ชันสำหรับจัดการ error ของรูปภาพ
const handleImageError = (event) => {
  console.log('Image failed to load:', event.target.src)
  event.target.src = `${$axios.defaults.baseURL}/images/default-repair.png` // รูปภาพ default
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

    const response = await $axios.put(`/api/repairs/${selectedRepair.value._id}/status`, updateData)
    
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
    console.error('Error response:', error.response?.data)
    console.error('Error status:', error.response?.status)
    alert(`เกิดข้อผิดพลาดในการอัปเดตสถานะ: ${error.response?.data?.message || error.message}`)
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
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
  overflow: hidden;
}

.content-wrapper {
  max-width: 1200px;
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

.filters-section {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.1);
}

.custom-select {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
}

.custom-select :deep(.v-select__selections) {
  font-size: 14px;
  font-weight: 500;
}

.custom-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.1);
  overflow: hidden;
}

.v-data-table :deep(.v-data-table__wrapper) {
  border-radius: 12px;
  overflow: hidden;
}

.v-data-table :deep(tbody tr) {
  transition: all 0.3s ease;
}

.v-data-table :deep(tbody tr:hover) {
  background: linear-gradient(135deg, #fdf2f2 0%, #fce8e8 100%) !important;
  transform: scale(1.01);
}

.v-data-table :deep(th) {
  background: #c0392b !important;
  color: white !important;
  font-weight: 700 !important;
  text-transform: none !important;
  white-space: nowrap;
  padding: 16px 12px !important;
}

.v-data-table :deep(td) {
  padding: 12px !important;
  border-bottom: 1px solid #fecaca;
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
  border-radius: 8px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  transition: all 0.3s ease !important;
  min-width: 80px;
  height: 32px;
  padding: 0 16px;
  margin: 0 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 14px;
  letter-spacing: normal;
  color: white;
}

.action-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.15) !important;
}

.image-btn {
  background-color: #2196F3;
}

.image-btn:hover {
  background-color: #1976D2;
}

.manage-btn {
  background-color: #4CAF50;
}

.manage-btn:hover {
  background-color: #388E3C;
}

.font-weight-medium {
  font-weight: 500;
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
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
    padding: 16px;
  }

  .filters-section {
    padding: 16px;
  }

  .status-chip {
    min-width: 100px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }

  .action-btn {
    min-width: 70px !important;
    font-size: 12px !important;
  }
}
</style> 