<template>
  <LayoutAdmin>
    <div class="page-container">
      <div class="content-wrapper">
        <div class="header-section">
          <h1 class="page-title">จัดการการลา</h1>
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
          :items="filteredLeaves"
          :loading="isLoading"
          class="elevation-1 custom-table"
          :items-per-page="10"
          :footer-props="{
            'items-per-page-options': [10, 20, 50],
            'items-per-page-text': 'รายการต่อหน้า'
          }"
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
  const refreshInterval = setInterval(fetchLeaveRequests, 30000)
  
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