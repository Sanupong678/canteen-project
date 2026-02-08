<template>
  <LayoutUser>
    <div class="bill-history-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">ประวัติบิลค่าบริการ</h1>
            <p class="page-subtitle">รายการบิลที่ตรวจสอบแล้วและรอตรวจสอบ</p>
          </div>
          <div class="header-actions">
            <v-btn
              variant="outlined"
              class="filter-btn"
              @click="showFilterDialog = true"
            >
              <v-icon left size="small">mdi-filter</v-icon>
              กรองข้อมูล
            </v-btn>
            <router-link to="/user/bill" class="back-link">
              <v-icon left size="small">mdi-arrow-left</v-icon>
              กลับไปหน้ารายการปัจจุบัน
            </router-link>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs-container">
        <button
          :class="['tab-button', { active: selectedType === 'water' }]"
          @click="selectedType = 'water'"
        >
          💧 ค่าน้ำ
        </button>
        <button
          :class="['tab-button', { active: selectedType === 'electricity' }]"
          @click="selectedType = 'electricity'"
        >
          ⚡ ค่าไฟ
        </button>
      </div>

      <!-- Card -->
      <v-card class="bill-history-card" elevation="2">
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
            <table class="bill-history-table">
              <thead>
                <tr>
                  <th class="text-left">วันที่ออกบิล</th>
                  <th class="text-left">ประเภท</th>
                  <th class="text-left">จำนวนเงิน</th>
                  <th class="text-left">สถานะ</th>
                  <th class="text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="5" class="text-center py-4">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </td>
                </tr>
                <tr v-else-if="filteredBills.length === 0">
                  <td colspan="5" class="text-center py-4 text-gray-500">
                    <p class="mb-2">ไม่มีประวัติบิล</p>
                    <p class="text-sm text-gray-400">ยังไม่มีรายการบิลที่เสร็จสิ้นในประเภทที่เลือก</p>
                  </td>
                </tr>
                <tr v-else v-for="bill in paginatedBills" :key="bill.id">
                  <td class="date-cell">
                    {{ formatDateOnly(bill.createdAt) }}
                    <br />
                    <span class="time-text">{{ formatTime(bill.createdAt) }}</span>
                  </td>
                  <td>
                    <v-chip small class="type-chip">
                      {{ getBillTypeText(bill.type) }}ประจำเดือน {{ formatMonth(bill.billMonth) }}
                    </v-chip>
                  </td>
                  <td class="amount-cell">
                    <span v-if="bill.amount && bill.amount > 0" class="amount-text">฿{{ formatAmount(bill.amount) }}</span>
                    <span v-else class="amount-text text-gray-400">รอการคำนวณ</span>
                  </td>
                  <td>
                    <v-chip
                      small
                      :class="getStatusChipClass(bill.status)"
                    >
                      {{ getStatusText(bill.status) }}
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
                          @click="viewBillDetails(bill)"
                        >
                          <template v-slot:prepend>
                            <v-icon size="small">mdi-eye</v-icon>
                          </template>
                          <v-list-item-title>ดูรายละเอียด</v-list-item-title>
                        </v-list-item>
                        <v-list-item 
                          v-if="bill.image" 
                          value="slip"
                          @click="viewSlip(bill)"
                        >
                          <template v-slot:prepend>
                            <v-icon size="small">mdi-image</v-icon>
                          </template>
                          <v-list-item-title>ดูสลิปการชำระ</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer Pagination -->
          <div class="table-footer" v-if="filteredBills.length > 0">
            <span class="footer-text">
              แสดง {{ startIndex }} ถึง {{ endIndex }} จาก {{ filteredBills.length }} รายการ
            </span>
            <div class="pagination">
              <v-btn
                v-for="page in visiblePages"
                :key="page"
                size="small"
                :variant="page === currentPage ? 'flat' : 'outlined'"
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

      <!-- Dialog สำหรับดูรายละเอียด -->
      <v-dialog v-model="showDetailsDialog" max-width="700px" :scrim="true">
        <v-card v-if="selectedBill">
          <v-card-title class="dialog-header">
            <span>รายละเอียดบิล</span>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" size="small" variant="text" @click="showDetailsDialog = false"></v-btn>
          </v-card-title>
          <v-card-text>
            <div class="detail-section">
              <div class="detail-item">
                <span class="detail-label">ประเภทบิล:</span>
                <span class="detail-value">{{ getBillTypeText(selectedBill.type) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">ประจำเดือน:</span>
                <span class="detail-value">{{ formatMonth(selectedBill.billMonth) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">วันที่ออกบิล:</span>
                <span class="detail-value">{{ formatDate(selectedBill.createdAt) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">วันครบกำหนดชำระ:</span>
                <span class="detail-value">{{ formatDate(selectedBill.dueDate) }}</span>
              </div>
              <div class="detail-item" v-if="selectedBill.paymentDate">
                <span class="detail-label">วันที่ชำระ:</span>
                <span class="detail-value">{{ formatDate(selectedBill.paymentDate) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">จำนวนเงิน:</span>
                <span v-if="selectedBill.amount && selectedBill.amount > 0" class="detail-value amount-highlight">฿{{ formatAmount(selectedBill.amount) }}</span>
                <span v-else class="detail-value text-gray-400">รอการคำนวณ</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">เลขบัญชี:</span>
                <span class="detail-value">{{ selectedBill.accountNumber }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">ชื่อบัญชี:</span>
                <span class="detail-value">{{ selectedBill.accountName }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">สถานะ:</span>
                <v-chip
                  small
                  :class="getStatusChipClass(selectedBill.status)"
                >
                  {{ getStatusText(selectedBill.status) }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="showDetailsDialog = false">ปิด</v-btn>
            <v-btn
              v-if="selectedBill.image"
              color="primary"
              @click="viewSlip(selectedBill)"
            >
              ดูสลิปการชำระ
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog สำหรับดูสลิป -->
      <v-dialog v-model="showSlipDialog" max-width="900px" :scrim="true">
        <v-card>
          <v-card-title class="dialog-header">
            <span>สลิปการชำระ</span>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" size="small" variant="text" @click="closeSlipDialog"></v-btn>
          </v-card-title>
          <v-card-text>
            <div class="slip-image-container">
              <img 
                v-if="currentSlipImage" 
                :src="currentSlipImage" 
                alt="สลิปการชำระ"
                class="slip-image"
              />
              <div v-else class="loading-container">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <p class="mt-4">กำลังโหลดรูปภาพ...</p>
              </div>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="closeSlipDialog">ปิด</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog สำหรับกรองข้อมูล -->
      <v-dialog v-model="showFilterDialog" max-width="500px" :scrim="true">
        <v-card>
          <v-card-title class="dialog-header">
            <span>กรองข้อมูล</span>
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" size="small" variant="text" @click="showFilterDialog = false"></v-btn>
          </v-card-title>
          <v-card-text>
            <v-select
              v-model="filterStatus"
              :items="statusOptions"
              label="สถานะ"
              variant="outlined"
              density="compact"
              clearable
              class="mb-3"
            ></v-select>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="clearFilter">ล้างตัวกรอง</v-btn>
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
import { th } from 'date-fns/locale'

// Data
const selectedType = ref('water')
const bills = ref([])
const loading = ref(false)
const searchQuery = ref('')
const filterStatus = ref(null)
const showDetailsDialog = ref(false)
const showSlipDialog = ref(false)
const showFilterDialog = ref(false)
const selectedBill = ref(null)
const currentSlipImage = ref('')

// Pagination
const pageSize = 10
const currentPage = ref(1)

// Options
const statusOptions = [
  { title: 'เสร็จสิ้น', value: 'เสร็จสิ้น' },
  { title: 'รอตรวจสอบ', value: 'รอตรวจสอบ' },
  { title: 'รอดำเนินการ', value: 'รอดำเนินการ' },
  { title: 'เลยกำหนด', value: 'เลยกำหนด' }
]

// Computed
const filteredBills = computed(() => {
  // แสดงบิลที่ admin ตรวจเช็คแล้ว (เสร็จสิ้น) หรือรอตรวจสอบ
  // ไม่ต้องรอให้ผ่านเดือน เพราะถ้า admin ตรวจเช็คและยืนยันแล้วก็ควรแสดงในประวัติได้เลย
  let result = bills.value.filter(bill => 
    bill.type === selectedType.value && 
    (bill.status === 'เสร็จสิ้น' || bill.status === 'รอตรวจสอบ')
  )

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(bill => {
      const billTypeText = getBillTypeText(bill.type).toLowerCase()
      const monthText = formatMonth(bill.billMonth).toLowerCase()
      const amountText = bill.amount && bill.amount > 0 ? formatAmount(bill.amount) : 'รอการคำนวณ'
      return billTypeText.includes(query) || 
             monthText.includes(query) || 
             amountText.toLowerCase().includes(query)
    })
  }

  // Filter by status
  if (filterStatus.value) {
    result = result.filter(bill => bill.status === filterStatus.value)
  }

  // Sort by date (newest first)
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredBills.value.length / pageSize)))

const paginatedBills = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredBills.value.slice(start, start + pageSize)
})

const startIndex = computed(() => {
  if (filteredBills.value.length === 0) return 0
  return (currentPage.value - 1) * pageSize + 1
})

const endIndex = computed(() => {
  return Math.min(currentPage.value * pageSize, filteredBills.value.length)
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

// Watch selectedType to reset page
watch(selectedType, () => {
  currentPage.value = 1
})

// Methods
const formatDate = (date) => {
  return format(new Date(date), 'dd/MM/yyyy', { locale: th })
}

const formatDateOnly = (date) => {
  return format(new Date(date), 'dd/MM/yyyy', { locale: th })
}

const formatTime = (date) => {
  return format(new Date(date), 'HH:mm น.', { locale: th })
}

const formatMonth = (date) => {
  return format(new Date(date), 'MMMM yyyy', { locale: th })
}

const formatAmount = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '-'
  }
  return amount.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const getBillTypeText = (type) => {
  if (type === 'water') return 'ค่าน้ำ'
  if (type === 'electricity') return 'ค่าไฟ'
  return type
}

const getStatusText = (status) => {
  return status || 'เสร็จสิ้น'
}

const getStatusChipClass = (status) => {
  const statusClassMap = {
    'เสร็จสิ้น': 'status-completed',
    'รอตรวจสอบ': 'status-review',
    'รอดำเนินการ': 'status-pending',
    'เลยกำหนด': 'status-expired'
  }
  return statusClassMap[status] || 'status-pending'
}

const viewBillDetails = (bill) => {
  selectedBill.value = bill
  showDetailsDialog.value = true
}

const viewSlip = async (bill) => {
  try {
    showSlipDialog.value = true
    currentSlipImage.value = ''
    
    // ใช้ axios interceptor (validate token อัตโนมัติ)
    const response = await axios.get(`/api/bills/image/${bill.id}`, {
      responseType: 'blob'
    })

    const imageUrl = URL.createObjectURL(response.data)
    currentSlipImage.value = imageUrl
  } catch (error) {
    console.error('Error loading slip image:', error)
    alert('ไม่สามารถโหลดรูปภาพสลิปได้')
    showSlipDialog.value = false
  }
}

const closeSlipDialog = () => {
  showSlipDialog.value = false
  if (currentSlipImage.value) {
    URL.revokeObjectURL(currentSlipImage.value)
    currentSlipImage.value = ''
  }
}

const clearFilter = () => {
  filterStatus.value = null
  searchQuery.value = ''
  currentPage.value = 1
}

const goToPage = (page) => {
  currentPage.value = page
}

const fetchBills = async () => {
  loading.value = true
  try {
    // ใช้ axios interceptor (validate token อัตโนมัติ)
    const response = await axios.get(`/api/bills/history`)
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      bills.value = response.data.data.map(bill => {
        let amount = bill.amount
        if (amount === null || amount === undefined) {
          amount = null
        } else if (typeof amount === 'string') {
          const trimmed = amount.trim()
          if (trimmed === '' || trimmed === '-') {
            amount = null
          } else {
            const parsed = parseFloat(trimmed)
            amount = isNaN(parsed) ? null : parsed
          }
        } else if (typeof amount === 'number') {
          amount = isNaN(amount) ? null : amount
        } else {
          amount = null
        }
        
        return {
          id: bill._id,
          type: bill.billType,
          amount: amount,
          billMonth: new Date(bill.year, bill.month ? bill.month-1 : 0),
          createdAt: bill.createdAt,
          dueDate: bill.dueDate || bill.contractEndDate,
          accountNumber: 'XXX-X-XXXXX-X',
          accountName: bill.shopName || localStorage.getItem('displayName') || 'มหาวิทยาลัย',
          paymentDate: bill.payment_date || null,
          status: bill.status || 'รอดำเนินการ',
          image: bill.image || null
        }
      })
    } else {
      bills.value = []
    }
  } catch (error) {
    console.error('Error fetching bills:', error)
    bills.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchBills()
})
</script>

<style scoped>
.bill-history-page {
  padding: 1.5rem;
  background-color: #f9fafb;
  min-height: calc(100vh - 64px);
}

.page-header {
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.filter-btn {
  text-transform: none;
}

.back-link {
  display: inline-flex;
  align-items: center;
  color: #2563eb;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.back-link:hover {
  background-color: #eff6ff;
  text-decoration: none;
}

/* Tabs */
.tabs-container {
  display: inline-flex;
  background-color: #f3f4f6;
  border-radius: 0.75rem;
  padding: 0.25rem;
  margin-bottom: 1.5rem;
}

.tab-button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button.active {
  background-color: #2563eb;
  color: white;
}

/* Card */
.bill-history-card {
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-content {
  padding: 1rem;
}

.search-section {
  margin-bottom: 1rem;
}

.search-input {
  max-width: 24rem;
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}

.bill-history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.bill-history-table thead {
  border-bottom: 1px solid #e5e7eb;
}

.bill-history-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 500;
  color: #6b7280;
  font-size: 0.875rem;
}

.bill-history-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s;
}

.bill-history-table tbody tr:hover {
  background-color: #f9fafb;
}

.bill-history-table td {
  padding: 0.75rem 1rem;
}

.date-cell {
  white-space: nowrap;
}

.time-text {
  font-size: 0.75rem;
  color: #9ca3af;
}

.type-chip {
  background-color: #e0e7ff;
  color: #3730a3;
}

.amount-cell {
  font-weight: 600;
}

.amount-text {
  color: #059669;
  font-size: 1rem;
}

.status-completed {
  background-color: #d1fae5;
  color: #065f46;
}

.status-review {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-expired {
  background-color: #fee2e2;
  color: #991b1b;
}

/* Footer */
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  font-size: 0.875rem;
  color: #6b7280;
}

.pagination {
  display: flex;
  gap: 0.25rem;
}

.page-btn {
  min-width: 2rem;
}

/* Dialog */
.dialog-header {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 1.125rem;
  font-weight: 600;
}

.detail-section {
  padding: 0.5rem 0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  font-weight: 500;
  color: #6b7280;
}

.detail-value {
  color: #1f2937;
  font-weight: 500;
}

.amount-highlight {
  color: #059669;
  font-size: 1.25rem;
  font-weight: 600;
}

.slip-image-container {
  text-align: center;
  padding: 1rem;
}

.slip-image {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 0.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.loading-container {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

/* Responsive */
@media (max-width: 768px) {
  .bill-history-page {
    padding: 1rem;
  }

  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .table-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>
