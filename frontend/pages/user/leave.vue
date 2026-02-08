<template>
  <LayoutUser>
    <div class="leave-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">ประวัติการลา</h1>
            <p class="page-subtitle">การลาที่แจ้งและประวัติการลาทั้งหมดในระบบ</p>
          </div>
          <div class="header-actions">
            <v-btn
              outlined
              class="filter-btn"
              @click="showFilterDialog = true"
            >
              <v-icon left small>mdi-filter</v-icon>
              กรองข้อมูล
            </v-btn>
            <v-btn
              color="primary"
              class="add-btn"
              @click="openLeaveDialog"
              :disabled="loading"
            >
              <v-icon left small>mdi-plus</v-icon>
              แจ้งลา
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Card -->
      <v-card class="leave-card" elevation="2">
        <v-card-text class="card-content">
          <!-- Search -->
          <div class="search-section">
            <v-text-field
              v-model="searchQuery"
              placeholder="ค้นหารายการ..."
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-magnify"
              hide-details
              class="search-input"
            ></v-text-field>
          </div>

          <!-- Table -->
          <div class="table-wrapper">
            <table class="leave-table">
              <thead>
                <tr>
                  <th class="text-left">วันที่แจ้ง</th>
                  <th class="text-left">วันที่ลา</th>
                  <th class="text-left">เหตุผล</th>
                  <th class="text-left status-column">สถานะ</th>
                  <th class="text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="5" class="text-center py-4">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </td>
                </tr>
                <tr v-else-if="filteredLeaves.length === 0">
                  <td colspan="5" class="text-center py-4 text-gray-500">
                    <p class="mb-2">ยังไม่เคยแจ้งลามาก่อน</p>
                    <p class="text-sm text-gray-400">เมื่อคุณแจ้งลาครั้งแรก ข้อมูลจะแสดงที่นี่</p>
                  </td>
                </tr>
                <tr v-else v-for="leave in paginatedLeaves" :key="leave._id">
                  <td class="date-cell">
                    {{ formatDateOnly(leave.createdAt) }}
                    <br />
                    <span class="time-text">{{ formatTime(leave.createdAt) }}</span>
                  </td>
                  <td class="date-range-cell">
                    {{ formatDateOnly(leave.startDate) }} <span class="date-separator">ถึง</span> {{ formatDateOnly(leave.endDate) }}
                  </td>
                  <td class="issue-cell">{{ leave.issue }}</td>
                  <td class="status-column">
                    <v-chip
                      small
                      :class="getStatusChipClass(leave.status)"
                    >
                      {{ getStatusText(leave.status) }}
                    </v-chip>
                  </td>
                  <td class="text-right">
                    <v-menu location="bottom end">
                      <template v-slot:activator="{ props }">
                        <v-btn
                          icon
                          size="small"
                          v-bind="props"
                          variant="text"
                        >
                          <v-icon>mdi-dots-horizontal</v-icon>
                        </v-btn>
                      </template>
                      <v-list density="compact">
                        <v-list-item 
                          value="view"
                          @click="viewLeaveDetails(leave)"
                        >
                          <template v-slot:prepend>
                            <v-icon size="small">mdi-eye</v-icon>
                          </template>
                          <v-list-item-title>ดูรายละเอียด</v-list-item-title>
                        </v-list-item>
                        <v-divider v-if="canEdit(leave) || canDelete(leave)"></v-divider>
                        <v-list-item 
                          v-if="canEdit(leave)" 
                          value="edit"
                          @click="openEditDialog(leave)"
                        >
                          <template v-slot:prepend>
                            <v-icon size="small" color="primary">mdi-pencil</v-icon>
                          </template>
                          <v-list-item-title>แก้ไข</v-list-item-title>
                        </v-list-item>
                        <v-list-item 
                          v-if="canDelete(leave)" 
                          value="delete"
                          @click="confirmDelete(leave)"
                        >
                          <template v-slot:prepend>
                            <v-icon size="small" color="error">mdi-delete</v-icon>
                          </template>
                          <v-list-item-title>ลบ</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer Pagination -->
          <div class="table-footer" v-if="filteredLeaves.length > 0">
            <span class="footer-text">
              แสดง {{ startIndex }} ถึง {{ endIndex }} จาก {{ filteredLeaves.length }} รายการ
            </span>
            <div class="pagination">
              <v-btn
                v-for="page in visiblePages"
                :key="page"
                small
                :outlined="page !== currentPage"
                :color="page === currentPage ? 'primary' : ''"
                class="page-btn"
                @click="goToPage(page)"
              >
                {{ page }}
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Dialog สำหรับแจ้งลาใหม่ -->
      <v-dialog 
        v-model="showLeaveDialog" 
        max-width="600px" 
        persistent
        :scrim="true"
      >
        <v-card>
          <v-card-title class="dialog-header">
            <span>แจ้งลา</span>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" size="small" variant="text" @click="closeLeaveDialog"></v-btn>
          </v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="isFormValid">
              <div class="form-group">
                <label class="form-label">วันที่ลา</label>
                <div class="date-inputs">
                  <v-text-field
                    v-model="startDate"
                    type="date"
                    label="วันที่เริ่มลา"
                    variant="outlined"
                    density="compact"
                    :rules="startDateRules"
                    @update:model-value="validateDateRange"
                    class="mb-3"
                  ></v-text-field>
                  <v-text-field
                    v-model="endDate"
                    type="date"
                    label="วันที่สิ้นสุดการลา"
                    variant="outlined"
                    density="compact"
                    :rules="endDateRules"
                    @update:model-value="validateDateRange"
                    class="mb-3"
                  ></v-text-field>
                </div>
                <p v-if="dateError" class="error-message">{{ dateError }}</p>
              </div>
              <v-textarea
                v-model="issue"
                label="เหตุผลการลา"
                :rules="issueRules"
                variant="outlined"
                rows="4"
                class="mb-3"
              ></v-textarea>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="closeLeaveDialog">ยกเลิก</v-btn>
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="!isFormValid || loading || !!dateError"
              @click="handleSubmit"
            >
              ส่งเรื่อง
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog สำหรับแก้ไขลา -->
      <v-dialog 
        v-model="showEditDialog" 
        max-width="600px" 
        persistent
        :scrim="true"
      >
        <v-card>
          <v-card-title class="dialog-header">
            <span>แก้ไขการลา</span>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" size="small" variant="text" @click="closeLeaveDialog"></v-btn>
          </v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="isFormValid">
              <div class="form-group">
                <label class="form-label">วันที่ลา</label>
                <div class="date-inputs">
                  <v-text-field
                    v-model="startDate"
                    type="date"
                    label="วันที่เริ่มลา"
                    variant="outlined"
                    density="compact"
                    :rules="startDateRules"
                    @update:model-value="validateDateRange"
                    class="mb-3"
                  ></v-text-field>
                  <v-text-field
                    v-model="endDate"
                    type="date"
                    label="วันที่สิ้นสุดการลา"
                    variant="outlined"
                    density="compact"
                    :rules="endDateRules"
                    @update:model-value="validateDateRange"
                    class="mb-3"
                  ></v-text-field>
                </div>
                <p v-if="dateError" class="error-message">{{ dateError }}</p>
              </div>
              <v-textarea
                v-model="issue"
                label="เหตุผลการลา"
                :rules="issueRules"
                variant="outlined"
                rows="4"
                class="mb-3"
              ></v-textarea>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="closeLeaveDialog">ยกเลิก</v-btn>
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="!isFormValid || loading || !!dateError"
              @click="handleSubmit"
            >
              บันทึก
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog สำหรับยืนยันการลบ -->
      <v-dialog v-model="showDeleteDialog" max-width="400px">
        <v-card>
          <v-card-title class="dialog-header">
            <span>ยืนยันการลบ</span>
            <v-spacer></v-spacer>
            <v-btn icon small @click="showDeleteDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <p>คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</p>
            <p class="text-gray-500 text-sm mt-2" v-if="leaveToDelete">
              {{ leaveToDelete.issue }}
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showDeleteDialog = false">ยกเลิก</v-btn>
            <v-btn
              color="error"
              :loading="loading"
              :disabled="loading"
              @click="handleDelete"
            >
              ลบ
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog สำหรับดูรายละเอียด -->
      <v-dialog v-model="showDetailsDialog" max-width="700px">
        <v-card v-if="selectedLeave">
          <v-card-title class="dialog-header">
            <span>รายละเอียดการลา</span>
            <v-spacer></v-spacer>
            <v-btn icon small @click="showDetailsDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <div class="detail-section">
              <div class="detail-item">
                <label>วันที่แจ้ง:</label>
                <span>{{ formatDate(selectedLeave.createdAt) }}</span>
              </div>
              <div class="detail-item">
                <label>วันที่เริ่มลา:</label>
                <span>{{ formatDate(selectedLeave.startDate) }}</span>
              </div>
              <div class="detail-item">
                <label>วันที่สิ้นสุดการลา:</label>
                <span>{{ formatDate(selectedLeave.endDate) }}</span>
              </div>
              <div class="detail-item">
                <label>จำนวนวันลา:</label>
                <span>{{ calculateDays(selectedLeave.startDate, selectedLeave.endDate) }} วัน</span>
              </div>
              <div class="detail-item">
                <label>เหตุผล:</label>
                <p class="issue-detail">{{ selectedLeave.issue }}</p>
              </div>
              <div class="detail-item">
                <label>สถานะ:</label>
                <v-chip
                  small
                  :class="getStatusChipClass(selectedLeave.status)"
                >
                  {{ getStatusText(selectedLeave.status) }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showDetailsDialog = false">ปิด</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Filter Dialog -->
      <v-dialog v-model="showFilterDialog" max-width="400px">
        <v-card>
          <v-card-title>กรองข้อมูล</v-card-title>
          <v-card-text>
            <v-select
              v-model="filterStatus"
              :items="statusOptions"
              label="สถานะ"
              variant="outlined"
              density="compact"
              clearable
            ></v-select>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="clearFilters">ล้าง</v-btn>
            <v-btn color="primary" @click="showFilterDialog = false">ตกลง</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </LayoutUser>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import LayoutUser from '@/components/LayoutUser.vue'
import axios from 'axios'
import { format } from 'date-fns'

// Form refs and data
const form = ref(null)
const isFormValid = ref(false)
const loading = ref(false)
const startDate = ref('')
const endDate = ref('')
const issue = ref('')
const leaveHistory = ref([])
const showLeaveDialog = ref(false)
const showEditDialog = ref(false)
const showDetailsDialog = ref(false)
const showFilterDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedLeave = ref(null)
const leaveToDelete = ref(null)
const isEditMode = ref(false)
const dateError = ref('')
const searchQuery = ref('')
const filterStatus = ref(null)

// Pagination
const pageSize = 10
const currentPage = ref(1)

// Options
const statusOptions = [
  { text: 'รออนุมัติ', value: 'pending' },
  { text: 'อนุมัติแล้ว', value: 'approved' },
  { text: 'ไม่อนุมัติ', value: 'rejected' }
]

// Rules
const startDateRules = [v => !!v || 'กรุณาเลือกวันที่เริ่มลา']
const endDateRules = [v => !!v || 'กรุณาเลือกวันที่สิ้นสุดการลา']
const issueRules = [v => !!v || 'กรุณากรอกเหตุผลการลา']

// Computed
const filteredLeaves = computed(() => {
  let result = leaveHistory.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(leave =>
      leave.issue.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (filterStatus.value) {
    result = result.filter(leave => leave.status === filterStatus.value)
  }

  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredLeaves.value.length / pageSize)))

const paginatedLeaves = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredLeaves.value.slice(start, start + pageSize)
})

const startIndex = computed(() => {
  if (filteredLeaves.value.length === 0) return 0
  return (currentPage.value - 1) * pageSize + 1
})

const endIndex = computed(() => {
  return Math.min(currentPage.value * pageSize, filteredLeaves.value.length)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const openLeaveDialog = () => {
  console.log('Opening leave dialog...')
  // Reset form
  startDate.value = ''
  endDate.value = ''
  issue.value = ''
  dateError.value = ''
  isEditMode.value = false
  selectedLeave.value = null
  
  showLeaveDialog.value = true
  console.log('showLeaveDialog value:', showLeaveDialog.value)
}

const closeLeaveDialog = () => {
  showLeaveDialog.value = false
  showEditDialog.value = false
  isEditMode.value = false
  if (form.value) {
    form.value.reset()
  }
  startDate.value = ''
  endDate.value = ''
  issue.value = ''
  dateError.value = ''
  selectedLeave.value = null
}

const canEdit = (leave) => {
  return leave.status === 'pending'
}

const canDelete = (leave) => {
  return leave.status === 'pending'
}

const openEditDialog = (leave) => {
  selectedLeave.value = leave
  startDate.value = format(new Date(leave.startDate), 'yyyy-MM-dd')
  endDate.value = format(new Date(leave.endDate), 'yyyy-MM-dd')
  issue.value = leave.issue
  
  isEditMode.value = true
  showEditDialog.value = true
}

const confirmDelete = (leave) => {
  leaveToDelete.value = leave
  showDeleteDialog.value = true
}

const validateDateRange = () => {
  if (!startDate.value || !endDate.value) {
    dateError.value = ''
    return
  }

  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  dateError.value = ''

  if (start > end) {
    dateError.value = 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'
    return
  }

  if (start < today) {
    dateError.value = 'ไม่สามารถลาย้อนหลังได้'
    return
  }

  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

  if (diffDays > 3) {
    dateError.value = 'ระยะเวลาในการลาสูงสุดได้ 3 วันเท่านั้น'
  }
}

const handleSubmit = async () => {
  if (!startDate.value || !endDate.value || !issue.value) {
    const missingFields = []
    if (!startDate.value) missingFields.push('วันที่เริ่มลา')
    if (!endDate.value) missingFields.push('วันที่สิ้นสุดการลา')
    if (!issue.value) missingFields.push('เหตุผลการลา')
    alert(`กรุณากรอก${missingFields.join(' และ ')}`)
    return
  }

  if (dateError.value) {
    alert(dateError.value)
    return
  }

  loading.value = true

  try {
    // ใช้ axios interceptor (validate token อัตโนมัติ)
    let response

    if (isEditMode.value && selectedLeave.value) {
      // แก้ไขรายการ
      response = await axios.put(`/api/leaves/${selectedLeave.value._id}`, {
        startDate: startDate.value,
        endDate: endDate.value,
        issue: issue.value
      }, {
        headers: { 
          'Content-Type': 'application/json'
        }
      })

      if (response.data && response.data.success) {
        // อัปเดตรายการใน list โดยตรง
        const updatedLeave = response.data.data
        const leaveId = selectedLeave.value._id || selectedLeave.value.id
        
        const index = leaveHistory.value.findIndex(
          l => (l._id === leaveId || l.id === leaveId)
        )
        
        if (index !== -1) {
          leaveHistory.value[index] = {
            ...leaveHistory.value[index],
            ...updatedLeave,
            startDate: updatedLeave.startDate,
            endDate: updatedLeave.endDate,
            issue: updatedLeave.issue
          }
        } else {
          await fetchLeaveHistory()
        }
        
        closeLeaveDialog()
        alert('อัปเดตรายการลารีบร้อยแล้ว')
      }
    } else {
      // สร้างรายการใหม่
      response = await axios.post('/api/leaves', {
        startDate: startDate.value,
        endDate: endDate.value,
        issue: issue.value
      }, {
        headers: { 
          'Content-Type': 'application/json'
        }
      })

      if (response.data && response.data.success && response.data.data) {
        const newLeave = response.data.data
        leaveHistory.value = [newLeave, ...leaveHistory.value]
        
        closeLeaveDialog()
        alert('บันทึกการลาสำเร็จ')
      }
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

const handleDelete = async () => {
  if (!leaveToDelete.value) return

  loading.value = true

  try {
    // ใช้ axios interceptor (validate token อัตโนมัติ)
    const response = await axios.delete(`/api/leaves/${leaveToDelete.value._id}`)

    if (response.data && response.data.success) {
      leaveHistory.value = leaveHistory.value.filter(
        leave => leave._id !== leaveToDelete.value._id
      )
      
      showDeleteDialog.value = false
      leaveToDelete.value = null
      alert('ลบรายการลารีบร้อยแล้ว')
    }
  } catch (error) {
    console.error('Error deleting leave:', error)
    alert(error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการลบข้อมูล')
  } finally {
    loading.value = false
  }
}

const fetchLeaveHistory = async () => {
  try {
    loading.value = true
    // ใช้ axios interceptor (validate token อัตโนมัติ)
    const response = await axios.get('/api/leaves/user')
    
    if (response.data && Array.isArray(response.data)) {
      leaveHistory.value = response.data
    } else if (response.data && Array.isArray(response.data.data)) {
      leaveHistory.value = response.data.data
    } else {
      leaveHistory.value = []
    }
  } catch (error) {
    console.error('Error fetching leave history:', error)
    leaveHistory.value = []
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

const formatDateOnly = (date) => {
  return format(new Date(date), 'dd/MM/yyyy')
}

const formatTime = (date) => {
  return format(new Date(date), 'HH:mm') + ' น.'
}

const calculateDays = (startDate, endDate) => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  return diffDays
}

const getStatusChipClass = (status) => {
  const statusClasses = {
    'pending': 'status-pending',
    'approved': 'status-approved',
    'rejected': 'status-rejected'
  }
  return statusClasses[status] || 'status-pending'
}

const getStatusText = (status) => {
  const statusTexts = {
    'pending': 'รออนุมัติ',
    'approved': 'อนุมัติแล้ว',
    'rejected': 'ไม่อนุมัติ'
  }
  return statusTexts[status] || 'รออนุมัติ'
}

const viewLeaveDetails = (leave) => {
  selectedLeave.value = leave
  showDetailsDialog.value = true
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const clearFilters = () => {
  filterStatus.value = null
  searchQuery.value = ''
  currentPage.value = 1
}

// Watch for filter changes to reset page
watch([filterStatus, searchQuery], () => {
  currentPage.value = 1
})

// Fetch leave history on mount
onMounted(async () => {
  await fetchLeaveHistory()
})
</script>

<style scoped>
.leave-page {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 64px);
}

.page-header {
  margin-bottom: 16px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.filter-btn,
.add-btn {
  text-transform: none;
}

.leave-card {
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-content {
  padding: 16px;
}

.search-section {
  margin-bottom: 16px;
}

.search-input {
  max-width: 400px;
}

.table-wrapper {
  overflow-x: auto;
}

.leave-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.leave-table thead {
  border-bottom: 1px solid #e5e7eb;
}

.leave-table th {
  padding: 12px 8px;
  text-align: left;
  font-weight: 500;
  color: #6b7280;
  font-size: 12px;
}

.leave-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #f3f4f6;
}

.leave-table tbody tr:hover {
  background-color: #f9fafb;
}

.date-cell {
  white-space: nowrap;
}

.date-range-cell {
  white-space: nowrap;
  line-height: 1.6;
}

.date-separator {
  font-size: 14px;
  color: #6b7280;
  margin: 0 4px;
}

.time-text {
  font-size: 12px;
  color: #9ca3af;
}

.issue-cell {
  max-width: 400px;
  word-wrap: break-word;
}

.status-column {
  width: 240px;
  max-width: 240px;
  min-width: 240px;
}

.status-pending {
  background-color: #fef3c7 !important;
  color: #92400e !important;
}

.status-approved {
  background-color: #d1fae5 !important;
  color: #065f46 !important;
}

.status-rejected {
  background-color: #fee2e2 !important;
  color: #991b1b !important;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  color: #6b7280;
}

.pagination {
  display: flex;
  gap: 4px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
}

/* Dialog Styles */
.dialog-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.date-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.error-message {
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
}

.detail-section {
  padding: 16px 0;
}

.detail-item {
  margin-bottom: 16px;
}

.detail-item label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  font-size: 14px;
}

.issue-detail {
  margin: 0;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 8px;
  color: #374151;
  line-height: 1.6;
}

.text-center {
  text-align: center;
}

.text-gray-500 {
  color: #6b7280;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-sm {
  font-size: 12px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mt-2 {
  margin-top: 8px;
}

.py-4 {
  padding-top: 16px;
  padding-bottom: 16px;
}

/* Responsive */
@media (max-width: 768px) {
  .leave-page {
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .header-actions {
    width: 100%;
  }

  .filter-btn,
  .add-btn {
    flex: 1;
  }

  .table-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .date-inputs {
    flex-direction: column;
  }
}
</style>
