<template>
  <LayoutAdmin>
    <div class="page-container">
      <div class="content-container">
        <h1 class="text-2xl font-bold mb-6">จัดการการลา</h1>
        
        <!-- Leave Requests Table -->
        <div class="table-container">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-100">
                <th class="table-header text-center">ชื่อพนักงาน</th>
                <th class="table-header text-center">วันที่ลา</th>
                <th class="table-header text-center">เหตุผล</th>
                <th class="table-header text-center">สถานะ</th>
                <th class="table-header text-center">การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="leave in leaveRequests" :key="leave.id" class="border-b">
                <td class="table-cell text-center">{{ leave.employeeName }}</td>
                <td class="table-cell text-center">
                  {{ formatDate(leave.startDate) }} ถึง {{ formatDate(leave.endDate) }}
                </td>
                <td class="table-cell text-center">{{ leave.reason }}</td>
                <td class="table-cell text-center">
                  <span class="status-badge" :class="leave.status">
                    {{ getStatusText(leave.status) }}
                  </span>
                </td>
                <td class="table-cell text-center">
                  <div class="flex justify-center gap-2" v-if="leave.status === 'pending'">
                    <button
                      @click="updateLeaveStatus(leave.id, 'approved')"
                      class="action-button approve"
                    >
                      อนุมัติ
                    </button>
                    <button
                      @click="updateLeaveStatus(leave.id, 'rejected')"
                      class="action-button reject"
                    >
                      ไม่อนุมัติ
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </LayoutAdmin>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LayoutAdmin from '@/components/LayoutAdmin.vue'

const leaveRequests = ref([])

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

const updateLeaveStatus = (leaveId, newStatus) => {
  // Update in user's leave history
  const userLeaveHistory = JSON.parse(localStorage.getItem('leaveHistory') || '[]')
  const updatedHistory = userLeaveHistory.map(leave => {
    if (leave.id === leaveId) {
      return { ...leave, status: newStatus }
    }
    return leave
  })
  localStorage.setItem('leaveHistory', JSON.stringify(updatedHistory))
  
  // Update local state
  leaveRequests.value = updatedHistory
}

onMounted(() => {
  // Fetch leave history from user's localStorage
  const userLeaveHistory = JSON.parse(localStorage.getItem('leaveHistory') || '[]')
  leaveRequests.value = userLeaveHistory
})
</script>

<style scoped>
.page-container {
  padding: 2rem;
  min-height: calc(100vh - 200px);
  background-color: #f5f6fa;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
}

.table-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  color: #4a5568;
  background-color: #f7fafc;
  width: 20%;
}

.table-cell {
  padding: 1rem;
  color: #2d3748;
  text-align: center;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  display: inline-block;
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

.action-button {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
}

.action-button.approve {
  background-color: #48bb78;
  color: white;
}

.action-button.approve:hover {
  background-color: #38a169;
}

.action-button.reject {
  background-color: #f56565;
  color: white;
}

.action-button.reject:hover {
  background-color: #e53e3e;
}
</style> 