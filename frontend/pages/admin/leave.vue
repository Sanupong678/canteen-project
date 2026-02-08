<template>
  <LayoutAdmin>
    <div class="page-container">
      <div class="content-wrapper">
        <div class="header-section">
          <h1 class="page-title">จัดการการลา</h1>
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
                  :items="['ทั้งหมด', ...statusOptions.map(s => s.text || s)]"
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
          :items="pagedLeaves"
          :loading="isLoading"
          class="elevation-1 custom-table"
          hide-default-footer
          :no-data-text="'ยังไม่มีรายการลา'"
          :no-results-text="'ไม่พบรายการที่ค้นหา'"
          :loading-text="'กำลังโหลดข้อมูล...'"
        >
          <!-- Header Labels -->
          <template v-slot:header.shopName>
            <span><b>ชื่อร้านค้า</b></span>
          </template>
          <template v-slot:header.canteen>
            <span><b>โรงอาหาร</b></span>
          </template>
          <template v-slot:header.dateRange>
            <span><b>วันที่ลา</b></span>
          </template>
          <template v-slot:header.issue>
            <span><b>เหตุผล</b></span>
          </template>
          <template v-slot:header.status>
            <span><b>สถานะ</b></span>
          </template>
          <template v-slot:header.actions>
            <span><b>การจัดการ</b></span>
          </template>

          <!-- Shop Name Column -->
          <template v-slot:item.shopName="{ item }">
            <div class="d-flex align-center">
              <span class="font-weight-medium">{{ item.shopName }}</span>
            </div>
          </template>

          <!-- Canteen Column -->
          <template v-slot:item.canteen="{ item }">
            <div class="d-flex align-center">
              <span class="font-weight-medium">{{ item.canteen }}</span>
            </div>
          </template>

          <!-- Date Range Column -->
          <template v-slot:item.dateRange="{ item }">
            <div class="date-range">
              {{ formatDate(item.startDate) }} ถึง {{ formatDate(item.endDate) }}
            </div>
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

          <!-- Actions Column -->
          <template v-slot:item.actions="{ item }">
            <div class="action-buttons" v-if="item.status === 'pending'">
              <v-btn
                small
                @click="updateLeaveStatus(item._id, 'approved')"
                class="action-btn confirm-btn"
                :loading="isLoading"
              >
                อนุมัติ
              </v-btn>
              <v-btn
                small
                @click="updateLeaveStatus(item._id, 'rejected')"
                class="action-btn reject-btn"
                :loading="isLoading"
              >
                ไม่อนุมัติ
              </v-btn>
            </div>
          </template>
        </v-data-table>

        <!-- Pagination (10 per page) -->
        <div v-if="filteredLeaves.length > 0" class="pagination-section">
          <div class="items-per-page">
            <span class="label">Items per page:</span>
            <span class="fixed-size">10</span>
            <span class="range">{{ startIndexDisplay }}-{{ endIndexDisplay }} of {{ filteredLeaves.length }}</span>
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
    </div>
  </LayoutAdmin>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import LayoutAdmin from '@/components/LayoutAdmin.vue'
import { useNuxtApp } from '#app'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

const { $axios } = useNuxtApp()
const leaveRequests = ref([])
const isLoading = ref(false)
const search = ref('')

// Filters
const filters = ref({
  canteen: '',
  status: ''
})

// Table headers
const headers = [
  { text: 'ชื่อร้านค้า', value: 'shopName', align: 'center' },
  { text: 'โรงอาหาร', value: 'canteen', align: 'center' },
  { text: 'วันที่ลา', value: 'dateRange', align: 'center' },
  { text: 'เหตุผล', value: 'issue', align: 'center' },
  { text: 'สถานะ', value: 'status', align: 'center' },
  { text: 'การจัดการ', value: 'actions', align: 'center', sortable: false }
]

// Options for filters
const statusOptions = [
  { text: 'ทั้งหมด', value: '' },
  { text: 'รออนุมัติ', value: 'pending' },
  { text: 'อนุมัติแล้ว', value: 'approved' },
  { text: 'ไม่อนุมัติ', value: 'rejected' }
]

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

// Filtered leaves based on selected filters
const filteredLeaves = computed(() => {
  let filtered = [...leaveRequests.value]
  
  // ค้นหาตามชื่อร้านค้า
  if (search.value) {
    filtered = filtered.filter(leave => 
      leave.shopName && leave.shopName.toLowerCase().includes(search.value.toLowerCase())
    )
  }
  
  if (filters.value.canteen) {
    filtered = filtered.filter(leave => leave.canteen === filters.value.canteen)
  }
  
  if (filters.value.status) {
    filtered = filtered.filter(leave => leave.status === filters.value.status)
  }
  
  return filtered
})

// Client-side pagination (10 per page)
const pageSize = 10
const currentPage = ref(1)
const totalPages = computed(() => Math.max(1, Math.ceil(filteredLeaves.value.length / pageSize)))
const pagedLeaves = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredLeaves.value.slice(start, start + pageSize)
})
const goToPage = (p) => { if (p < 1 || p > totalPages.value) return; currentPage.value = p }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
const startIndexDisplay = computed(() => (filteredLeaves.value.length ? (currentPage.value - 1) * pageSize + 1 : 0))
const endIndexDisplay = computed(() => Math.min(currentPage.value * pageSize, filteredLeaves.value.length))

const formatDate = (dateString) => {
  return format(new Date(dateString), 'dd MMMM yyyy', { locale: th })
}

const getStatusText = (status) => {
  const statusMap = {
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ไม่อนุมัติ'
  }
  return statusMap[status] || status
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  }
  return colors[status] || 'grey'
}

// ดึงข้อมูลการลาทั้งหมด
const fetchLeaveRequests = async () => {
  isLoading.value = true
  try {
    const response = await $axios.get('/api/leaves/admin')
    if (response.data && response.data.data) {
      leaveRequests.value = response.data.data
    }
  } catch (error) {
    console.error('Error fetching leave requests:', error)
    alert('ไม่สามารถดึงข้อมูลการลาได้')
  } finally {
    isLoading.value = false
  }
}

// อัพเดทสถานะการลา
const updateLeaveStatus = async (leaveId, newStatus) => {
  if (!confirm(`คุณต้องการ${newStatus === 'approved' ? 'อนุมัติ' : 'ไม่อนุมัติ'}การลานี้ใช่หรือไม่?`)) {
    return
  }

  isLoading.value = true
  try {
    await $axios.put(`/api/leaves/${leaveId}/status`, { status: newStatus })
    await fetchLeaveRequests()
    alert('อัพเดทสถานะเรียบร้อยแล้ว')
  } catch (error) {
    console.error('Error updating leave status:', error)
    alert(error.response?.data?.message || 'ไม่สามารถอัพเดทสถานะได้')
  } finally {
    isLoading.value = false
  }
}

// Auto refresh data every 30 seconds
onMounted(() => {
  fetchLeaveRequests()
  // Realtime via socket
  try {
    const { $socket } = useNuxtApp()
    if ($socket) {
      $socket.on('admin:leave:new', fetchLeaveRequests)
      $socket.on('user:leave:updated', fetchLeaveRequests)
      onUnmounted(() => {
        $socket.off('admin:leave:new', fetchLeaveRequests)
        $socket.off('user:leave:updated', fetchLeaveRequests)
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
  max-width: 300px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.date-range {
  font-weight: 500;
  color: #2d3748;
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

.confirm-btn {
  background-color: #4CAF50;
}

.confirm-btn:hover {
  background-color: #388E3C;
}

.reject-btn {
  background-color: #F44336;
}

.reject-btn:hover {
  background-color: #D32F2F;
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