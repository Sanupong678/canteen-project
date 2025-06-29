<template>
  <LayoutUser>
    <div class="page-container">
      <div class="content-wrapper">
        <div class="header-section">
          <h1 class="page-title">แบบฟอร์มการลา</h1>
        </div>

        <div class="form-container">
          <div class="form-content">
            <!-- Leave Date Selection -->
            <div class="form-group">
              <label class="form-label" for="leaveDate">
                วันที่ลา
              </label>
              <div class="date-inputs">
                <input
                  type="date"
                  id="startDate"
                  v-model="startDate"
                  class="form-input"
                  @change="validateDateRange"
                />
                <span class="date-separator">ถึง</span>
                <input
                  type="date"
                  id="endDate"
                  v-model="endDate"
                  class="form-input"
                  @change="validateDateRange"
                />
              </div>
              <p v-if="dateError" class="error-message">{{ dateError }}</p>
            </div>

            <!-- Reason Text Area -->
            <div class="form-group">
              <label class="form-label" for="reason">
                เหตุผล
              </label>
              <textarea
                id="reason"
                v-model="reason"
                rows="4"
                class="form-textarea"
                placeholder="กรุณากรอกเหตุผลการลา"
              ></textarea>
            </div>

            <!-- Leave History Section -->
            <div class="form-group">
              <button
                @click="showHistory = !showHistory"
                class="history-button"
              >
                ประวัติการลา
              </button>
              
              <div v-if="showHistory" class="history-container">
                <div v-if="leaveHistory.length === 0" class="text-gray-500 text-center py-4">
                  <p class="text-lg font-medium mb-2">ยังไม่เคยแจ้งลามาก่อน</p>
                  <p class="text-sm text-gray-400">เมื่อคุณแจ้งลาครั้งแรก ข้อมูลจะแสดงที่นี่</p>
                </div>
                <div v-else class="space-y-3">
                  <div
                    v-for="(leave, index) in leaveHistory"
                    :key="index"
                    class="history-item"
                  >
                    <p class="font-semibold">วันที่ลา: {{ formatDate(leave.startDate) }} ถึง {{ formatDate(leave.endDate) }}</p>
                    <p>เหตุผล: {{ leave.issue || leave.reason }}</p>
                    <p class="status-badge" :class="leave.status">
                      สถานะ: {{ getStatusText(leave.status) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="text-center mt-6">
              <button
                @click="submitLeave"
                :disabled="!isFormValid"
                class="submit-button"
              >
                ยืนยันการลา
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </LayoutUser>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import LayoutUser from '@/components/LayoutUser.vue'
import { useNuxtApp } from '#app'

const startDate = ref('')
const endDate = ref('')
const reason = ref('')
const showHistory = ref(false)
const leaveHistory = ref([])
const dateError = ref('')
const isLoading = ref(false)

const { $axios } = useNuxtApp()

const isFormValid = computed(() => {
  return startDate.value && endDate.value && reason.value.trim().length > 0 && !dateError.value
})

// ดึงประวัติการลาจาก API
const fetchLeaveHistory = async () => {
  try {
    const token = localStorage.getItem('token')
    const response = await $axios.get('/api/leaves/user', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data && response.data.data) {
      leaveHistory.value = response.data.data
    } else {
      leaveHistory.value = []
    }
    
    // ตรวจสอบข้อความจาก backend
    if (response.data && response.data.message) {
      console.log('Leave history message:', response.data.message)
    }
  } catch (error) {
    console.error('Error fetching leave history:', error)
    leaveHistory.value = []
    // ไม่แสดง alert เพราะอาจเป็นกรณีที่ยังไม่เคยแจ้งลา
  }
}

// โหลดข้อมูลประวัติการลาเมื่อเปิดหน้า
onMounted(() => {
  fetchLeaveHistory()
})

const submitLeave = async () => {
  if (!isFormValid.value || isLoading.value) return
  
  isLoading.value = true
  try {
    const token = localStorage.getItem('token')
    // ส่งข้อมูลไปยัง backend API
    const response = await $axios.post('/api/leaves', {
      startDate: startDate.value,
      endDate: endDate.value,
      issue: reason.value // เปลี่ยนจาก reason เป็น issue ตาม leaveModel
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (response.data && response.data.data) {
      // เพิ่มข้อมูลใหม่เข้าไปในประวัติ
      await fetchLeaveHistory() // ดึงข้อมูลใหม่จาก API
      
      // Reset form
      startDate.value = ''
      endDate.value = ''
      reason.value = ''
      dateError.value = ''
      
      alert('บันทึกการลาสำเร็จ')
    }
  } catch (error) {
    console.error('Error submitting leave:', error)
    alert(error.response?.data?.message || 'ไม่สามารถบันทึกการลาได้ กรุณาลองใหม่อีกครั้ง')
  } finally {
    isLoading.value = false
  }
}

const validateDateRange = () => {
  if (!startDate.value || !endDate.value) return

  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const today = new Date()
  today.setHours(0, 0, 0, 0) // รีเซ็ตเวลาเป็น 00:00:00

  // Reset error
  dateError.value = ''

  // Check if dates are valid
  if (start > end) {
    dateError.value = 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'
    return
  }

  // Check if start date is in the past
  if (start < today) {
    dateError.value = 'ไม่สามารถลาย้อนหลังได้'
    return
  }

  // Calculate days difference
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

  if (diffDays > 3) {
    dateError.value = 'ระยะเวลาในการลาสูงสุดได้ 3 วันเท่านั้น'
  }
}

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('th-TH', options)
}

const getStatusText = (status) => {
  const statusMap = {
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ไม่อนุมัติ'
  }
  return statusMap[status] || status
}
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

.form-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.form-content {
  background: #ffffff;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.1);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  color: #2d3748;
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  resize: vertical;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
  background: white;
}

.form-textarea:focus {
  outline: none;
  border-color: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-separator {
  color: #4a5568;
  font-weight: 600;
  font-size: 14px;
}

.error-message {
  color: #e74c3c;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  font-weight: 500;
}

.history-button {
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
}

.history-button:hover {
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

.status-badge.pending {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  color: #92400E;
}

.status-badge.approved {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  color: #065F46;
}

.status-badge.rejected {
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  color: #991B1B;
}

.submit-button {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.2);
  margin-top: 1rem;
}

.submit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.3);
}

.submit-button:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
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

.font-semibold {
  font-weight: 600;
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

  .date-inputs {
    flex-direction: column;
    gap: 0.5rem;
  }

  .date-separator {
    text-align: center;
  }

  .history-container {
    padding: 1rem;
  }

  .submit-button {
    width: 100%;
    padding: 14px 24px;
  }
}
</style> 