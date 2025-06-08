<template>
  <LayoutUser>
    <div class="page-container">
      <div class="form-container">
        <h1 class="text-2xl font-bold mb-6 text-center">แบบฟอร์มการลา</h1>
        
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
              <div v-if="leaveHistory.length === 0" class="text-gray-500 text-center">
                ไม่มีประวัติการลา
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="(leave, index) in leaveHistory"
                  :key="index"
                  class="history-item"
                >
                  <p class="font-semibold">วันที่ลา: {{ formatDate(leave.startDate) }} ถึง {{ formatDate(leave.endDate) }}</p>
                  <p>เหตุผล: {{ leave.reason }}</p>
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
  </LayoutUser>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import LayoutUser from '@/components/LayoutUser.vue'

const startDate = ref('')
const endDate = ref('')
const reason = ref('')
const showHistory = ref(false)
const leaveHistory = ref([])
const dateError = ref('')

const isFormValid = computed(() => {
  return startDate.value && endDate.value && reason.value.trim().length > 0 && !dateError.value
})

const validateDateRange = () => {
  if (!startDate.value || !endDate.value) return

  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  const today = new Date()

  // Reset error
  dateError.value = ''

  // Check if dates are valid
  if (start > end) {
    dateError.value = 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'
    return
  }

  // Check if start date is in the past
  if (start < today) {
    dateError.value = 'ไม่สามารถลาล่วงหน้าได้'
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

const cleanupOldHistory = () => {
  const oneMonthAgo = new Date()
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  leaveHistory.value = leaveHistory.value.filter(leave => {
    const leaveDate = new Date(leave.startDate)
    return leaveDate >= oneMonthAgo
  })

  localStorage.setItem('leaveHistory', JSON.stringify(leaveHistory.value))
}

// Fetch leave history from localStorage on component mount
onMounted(() => {
  const savedHistory = localStorage.getItem('leaveHistory')
  if (savedHistory) {
    leaveHistory.value = JSON.parse(savedHistory)
    cleanupOldHistory()
  }
})

const submitLeave = () => {
  if (isFormValid.value) {
    // Create new leave request
    const newLeave = {
      id: Date.now(), // Simple unique ID
      startDate: startDate.value,
      endDate: endDate.value,
      reason: reason.value,
      status: 'pending',
      employeeName: 'User Name', // This should come from user profile
      submittedAt: new Date().toISOString()
    }
    
    // Add to history
    leaveHistory.value.push(newLeave)
    
    // Save to localStorage
    localStorage.setItem('leaveHistory', JSON.stringify(leaveHistory.value))
    
    // Save to admin leave requests
    const adminLeaveRequests = JSON.parse(localStorage.getItem('adminLeaveRequests') || '[]')
    adminLeaveRequests.push(newLeave)
    localStorage.setItem('adminLeaveRequests', JSON.stringify(adminLeaveRequests))
    
    // Reset form
    startDate.value = ''
    endDate.value = ''
    reason.value = ''
    dateError.value = ''
    
    // Show success message
    alert('บันทึกการลาสำเร็จ')
  }
}
</script>

<style scoped>
.page-container {
  min-height: calc(100vh - 200px);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background-color: #f5f6fa;
}

.form-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.form-content {
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  color: #4a5568;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  resize: vertical;
  transition: border-color 0.2s;
}

.form-textarea:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.history-button {
  color: #4299e1;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.history-button:hover {
  background-color: rgba(66, 153, 225, 0.1);
}

.history-container {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f7fafc;
  border-radius: 6px;
}

.history-item {
  padding: 1rem;
  background-color: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.submit-button {
  background-color: #4299e1;
  color: white;
  font-weight: 600;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.submit-button:hover:not(:disabled) {
  background-color: #3182ce;
}

.submit-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-block;
  margin-top: 0.5rem;
}

.status-badge.pending {
  background-color: #fffaf0;
  color: #c05621;
}

.status-badge.approved {
  background-color: #f0fff4;
  color: #2f855a;
}

.status-badge.rejected {
  background-color: #fff5f5;
  color: #c53030;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-separator {
  color: #4a5568;
  font-weight: 500;
}

.error-message {
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
</style> 