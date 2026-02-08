<template>
  <LayoutAdmin>
    <div class="page-container">
      <div class="content-wrapper">
        <div class="header-section">
          <h1 class="page-title">รายการแจ้งซ่อม</h1>
        </div>

        <!-- Filters Section (Bill-style) -->
        <div class="filters-section">
          <v-row class="filters-row" align="center" no-gutters>
            <v-col cols="12" md="auto" class="filter-col search-col">
              <v-text-field
                v-model="search"
                placeholder="ค้นหาชื่อร้านค้า"
                variant="solo"
                hide-details
                class="search-input filter-input filter-input--search"
                append-inner-icon="mdi-magnify"
                @click:append-inner="() => {}"
                @keyup.enter="() => {}"
              />
            </v-col>
            <v-col cols="12" md="auto" class="filters-left">
              <div class="filters-left-row">
                <v-select
                  v-model="filters.canteen"
                  :items="['ทั้งหมด', ...canteenOptions]"
                  label="โรงอาหาร"
                  variant="solo"
                  hide-details
                  class="custom-select pill-select filter-input filter-input--md"
                  menu-icon="mdi-menu-down"
                  prepend-inner-icon="mdi-store-outline"
                />
                <v-select
                  v-model="filters.status"
                  :items="['ทั้งหมด', ...statusOptions]"
                  label="สถานะ"
                  variant="solo"
                  hide-details
                  class="custom-select pill-select filter-input filter-input--md"
                  menu-icon="mdi-menu-down"
                  prepend-inner-icon="mdi-check-circle-outline"
                />
              </div>
            </v-col>
          </v-row>
        </div>

        <!-- Data Table -->
        <v-data-table
          :headers="headers"
          :items="pagedRepairs"
          :loading="loading"
          :search="search"
          class="elevation-1 custom-table"
          hide-default-footer
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

        <!-- Pagination (10 per page) -->
        <div v-if="filteredRepairs.length > 0" class="pagination-section">
          <div class="items-per-page">
            <span class="label">Items per page:</span>
            <span class="fixed-size">10</span>
            <span class="range">{{ startIndexDisplay }}-{{ endIndexDisplay }} of {{ filteredRepairs.length }}</span>
          </div>
          <div class="pagination">
            <button
              v-for="p in totalPages"
              :key="'pg-'+p"
              class="page-num"
              :class="{ active: p === currentPage }"
              @click="goToPage(p)"
            >{{ p }}</button>
            <button class="page-next" :disabled="currentPage === totalPages" @click="nextPage">next</button>
          </div>
        </div>
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

// Client-side pagination (10 per page)
const pageSize = 10
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRepairs.value.length / pageSize)))
const pagedRepairs = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredRepairs.value.slice(start, start + pageSize)
})
const goToPage = (p) => { if (p < 1 || p > totalPages.value) return; currentPage.value = p }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
const startIndexDisplay = computed(() => (filteredRepairs.value.length ? (currentPage.value - 1) * pageSize + 1 : 0))
const endIndexDisplay = computed(() => Math.min(currentPage.value * pageSize, filteredRepairs.value.length))

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
  // Realtime via socket
  try {
    const { $socket } = useNuxtApp()
    if ($socket) {
      const refresh = () => refreshData()
      $socket.on('admin:repair:new', refresh)
      $socket.on('user:repair:updated', refresh)
      onUnmounted(() => {
        $socket.off('admin:repair:new', refresh)
        $socket.off('user:repair:updated', refresh)
      })
    }
  } catch (e) { /* no-op */ }
})
</script>

<style scoped>
.filters-section {
  background: #ffffff;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.1);
}

.filters-row { gap: 12px; flex-wrap: wrap; }
.filter-col { flex: 1 1 auto; }
.search-col { order: 1; }
.filters-left { order: 2; flex: 1 1 auto; }
.filters-left-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.filter-input :deep(.v-field) { height: 44px !important; }
.filter-input :deep(.v-field__input) { align-items: center !important; }
.filter-input :deep(.v-field__prepend-inner), .filter-input :deep(.v-field__append-inner) { align-items: center !important; }
.pill-select :deep(.v-field) { border-radius: 28px !important; background: #fff !important; border: 1px solid #e9ecef !important; box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important; }
.pill-select :deep(.v-field--focused) { box-shadow: 0 0 0 3px rgba(33,150,243,0.18), 0 2px 8px rgba(0,0,0,0.08) !important; border-color: #2196f3 !important; }
.filter-input--md { width: 130px; }
.filter-input--search { width: min(520px, 100%); }
.pill-select :deep(.v-select__menu-icon .v-icon) { color: #374151 !important; }
.search-input :deep(.v-field__append-inner .v-icon) { color: #374151 !important; }

@media (min-width: 992px) {
  .search-col { order: 1; }
  .filters-left { order: 2; }
  .filters-left-row { flex-wrap: nowrap; }
}

@media (max-width: 991px) {
  .search-col { width: 100%; }
  .filters-left { width: 100%; }
}
.page-container {
  padding: 1rem;
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
  overflow: hidden;
}

.content-wrapper {
  max-width: 1600px;
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
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.1);
}

.filters-row {
  gap: 12px;
  flex-wrap: wrap;
}

.filter-col { flex: 2 1 auto; }
.search-col { order: 1; }
.filters-left { order: 2; flex: 1 1 auto; }

.filters-left-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-input :deep(.v-field) { height: 44px !important; }
.filter-input :deep(.v-field__input) { align-items: center !important; }
.filter-input :deep(.v-field__prepend-inner),
.filter-input :deep(.v-field__append-inner) { align-items: center !important; }
.filter-input :deep(.v-field__prepend-inner .v-icon),
.filter-input :deep(.v-field__append-inner .v-icon) { align-self: center !important; margin-top: 0 !important; }

/* Keep label centered like a placeholder (no floating) */
.pill-select :deep(.v-field-label) {
  top: 28% !important;
  transform: translateY(-50%) scale(1) !important;
  opacity: 1 !important;
}

/* Ensure v-select selection text sits middle */
.pill-select :deep(.v-select__selection-text),
.pill-select :deep(.v-select__selection) {
  display: flex !important;
  align-items: center !important;
  font-size: 13px !important;
  margin-top: -2px !important;
}

/* Right arrow vertical centering */
.filter-input--md :deep(.v-select__menu-icon),
.filter-input--md :deep(.v-select__menu-icon .v-icon) {
  display: flex !important;
  align-items: center !important;
  height: 100% !important;
}

.filter-input--md { width: 130px; }

.filter-input--search { width: min(520px, 100%); }

.custom-select {
  background: transparent;
  box-shadow: none;
}

.custom-select :deep(.v-select__selections) {
  font-size: 14px;
  font-weight: 500;
}

.custom-select :deep(.v-input__control),
.custom-select :deep(.v-field) {
  min-height: 40px !important;
}

.pill-select :deep(.v-field) {
  border-radius: 28px !important;
  background: #fff !important;
  border: 1px solid #e9ecef !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}

.pill-select :deep(.v-field--focused) {
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.18), 0 2px 8px rgba(0,0,0,0.08) !important;
  border-color: #2196f3 !important; /* ring-primary */
}

.pill-select :deep(.v-select__selections) {
  padding-left: 10px !important;
}

.pill-select :deep(.v-select__menu-icon .v-icon) {
  color: #6b7280 !important; /* gray-500 */
}

.pill-select:focus-within :deep(.v-select__menu-icon .v-icon) {
  color: #2563eb !important; /* blue-600 */
}

.search-input {
  --pill-radius: 28px;
}

.search-input :deep(.v-field) {
  border-radius: var(--pill-radius) !important;
  background: #fff !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  border: 1px solid #eee !important;
}

.search-input :deep(.v-field__input) {
  padding-left: 16px !important;
  font-size: 16px !important;
  color: #333 !important;
}

.search-input :deep(.v-field__append-inner .v-icon) {
  color: #c0392b !important;
  transition: color 0.2s ease;
}

.search-input :deep(.v-field__clearable) {
  display: none !important;
}

.search-input:hover :deep(.v-field__append-inner .v-icon),
.search-input:focus-within :deep(.v-field__append-inner .v-icon) {
  color: #e74c3c !important;
}

/* Desktop alignment: search left, dropdowns right */
@media (min-width: 992px) {
  .search-col { order: 1; }
  .filters-left { order: 2; }
  .filters-left-row { flex-wrap: nowrap; }
}

/* Mobile-first: search on top, dropdowns stack below */
@media (max-width: 991px) {
  .filters-row { gap: 10px; }
  .search-col { order: 1; width: 100%; }
  .filters-left { order: 2; width: 100%; }
  .filter-input--md { width: calc(50% - 6px); }
  .filter-input--search { width: 100%; }
}

.custom-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.1);
  overflow: hidden;
}

/* Pagination styles */
.pagination-section { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; margin-top: 12px; }
.items-per-page { display: flex; align-items: center; gap: 10px; color: #374151; font-size: 14px; }
.items-per-page .fixed-size { padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; min-width: 48px; text-align: center; }
.items-per-page .range { margin-left: 12px; color: #6b7280; }
.pagination { display: flex; gap: 6px; }
.page-num { min-width: 32px; height: 32px; border: 1px solid #e5e7eb; background: #fff; color: #7f1d1d; border-radius: 2px; cursor: pointer; }
.page-num.active { background: #7f1d1d; color: #fff; border-color: #7f1d1d; }
.page-next { border: 1px solid #e5e7eb; background: #fff; color: #7f1d1d; border-radius: 2px; padding: 0 10px; cursor: pointer; }

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

/* ซ่อน Scrollbar แนวนอน แต่แสดง Scrollbar แนวตั้ง */
.v-data-table :deep(.v-data-table__wrapper) {
  overflow-x: hidden !important;
  overflow-y: auto !important;
  /* ซ่อน scrollbar แนวนอน */
  scrollbar-width: thin !important;
  scrollbar-color: #cbd5e0 transparent !important;
  -ms-overflow-style: auto !important;
}

/* ซ่อน scrollbar แนวนอน แต่แสดง scrollbar แนวตั้ง */
.v-data-table :deep(.v-data-table__wrapper)::-webkit-scrollbar {
  width: 8px !important;
  height: 0 !important;
}

.v-data-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-track {
  background: transparent !important;
}

.v-data-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-thumb {
  background-color: #cbd5e0 !important;
  border-radius: 4px !important;
}

.v-data-table :deep(.v-data-table__wrapper)::-webkit-scrollbar-thumb:hover {
  background-color: #a0aec0 !important;
}

/* ซ่อน Scrollbar ในทุกส่วนของ table */
.v-data-table :deep(table) {
  overflow-x: hidden !important;
}

.v-data-table :deep(.v-data-table__wrapper table) {
  overflow-x: hidden !important;
}

.v-data-table :deep(.v-data-table__tr) {
  overflow-x: hidden !important;
}

.v-data-table :deep(.v-data-table__tbody) {
  overflow-x: hidden !important;
}

.v-data-table :deep(.v-data-table__thead) {
  overflow-x: hidden !important;
}

/* ซ่อน scrollbar ในทุก element ภายใน table */
.v-data-table :deep(*) {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

.v-data-table :deep(*)::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
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