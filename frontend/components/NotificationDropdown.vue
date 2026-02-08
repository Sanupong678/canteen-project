<template>
  <div class="notification-container">
    <button 
      @click="toggleDropdown" 
      class="notification-icon"
      :class="{ 'has-notifications': unreadCount > 0 }"
    >
      <span style="font-size: 24px; color: white;">🔔</span>
      <span v-if="unreadCount > 0" class="notification-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div v-if="showDropdown" class="notification-dropdown">
      <div class="notification-header">
        <h3>การแจ้งเตือน</h3>
        <button 
          v-if="unreadCount > 0" 
          @click="markAllAsRead" 
          class="mark-all-read-btn"
        >
          อ่านทั้งหมด
        </button>
      </div>

      <div class="notification-list">
        <div 
          v-for="notification in notifications" 
          :key="notification._id"
          class="notification-item"
          :class="{ 
            'unread': !notification.isRead,
            'new-notification': isNewNotification(notification.createdAt)
          }"
          @click="handleNotificationClick(notification)"
        >
          <div class="notification-icon-wrapper">
            <span 
              :style="{ color: getNotificationIconColor(notification.type) }"
              class="notification-emoji"
            >
              {{ getNotificationIcon(notification.type) }}
            </span>
            <!-- แสดงจุดแดงสำหรับข้อมูลใหม่ -->
            <div v-if="isNewNotification(notification.createdAt)" class="new-indicator"></div>
          </div>
          
          <div class="notification-content">
            <div class="notification-title">
              {{ getNotificationTitle(notification) }}
              <span v-if="notification.type === 'admin_notification' && notification.priority" class="priority-badge" :class="`priority-${notification.priority}`">
                {{ getPriorityText(notification.priority) }}
              </span>
              <span v-if="isNewNotification(notification.createdAt)" class="new-badge">ใหม่</span>
            </div>
            <div class="notification-message">
              {{ notification.message }}
            </div>
            <div class="notification-time">
              {{ formatTime(notification.createdAt) }}
            </div>
          </div>
          
          <div class="notification-status">
            <v-chip 
              :color="getStatusColor(notification.status)" 
              size="small"
              variant="flat"
            >
              {{ getStatusText(notification.status) }}
            </v-chip>
          </div>
        </div>

        <div v-if="notifications.length === 0" class="no-notifications">
          <span style="font-size: 48px; color: grey;">🔕</span>
          <p>ไม่มีการแจ้งเตือน</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import { formatDistanceToNow } from 'date-fns'
import { th } from 'date-fns/locale'
import { useNotificationStore } from '~/composables/useNotificationStore'

export default {
  name: 'NotificationDropdown',
  
  setup() {
    const showDropdown = ref(false)
    const notificationStore = useNotificationStore()
    
    // ใช้ state จาก global store
    const notifications = notificationStore.notifications
    const unreadCount = notificationStore.unreadCount

    // Toggle dropdown
    const toggleDropdown = async () => {
      showDropdown.value = !showDropdown.value
      if (showDropdown.value) {
        // โหลดข้อมูลใหม่ทุกครั้งที่เปิด dropdown
        console.log('🔄 Loading fresh notifications...')
        console.log('📊 Current notifications count:', notifications.value.length)
        console.log('📊 Current unread count:', unreadCount.value)
        await notificationStore.fetchNotifications()
        console.log('✅ Fresh notifications loaded')
        console.log('📊 Final notifications count:', notifications.value.length)
        console.log('📊 Final unread count:', unreadCount.value)
      }
    }

    // Mark notification as read
    const markAsRead = async (notificationId) => {
      await notificationStore.markAsRead(notificationId)
    }

    // Handle notification click with navigation
    const handleNotificationClick = async (notification) => {
      // Mark as read first
      await markAsRead(notification._id)
      
      // Navigate based on notification type
      if (notification.type === 'monthly_ranking' || notification.type === 'ranking_evaluation') {
        // Navigate to ranking page
        await navigateTo('/user/ranking')
      } else if (notification.type === 'bill') {
        // Navigate to bill page
        await navigateTo('/user/bill')
      } else if (notification.type === 'leave') {
        // Navigate to leave page
        await navigateTo('/user/leave')
      } else if (notification.type === 'repair') {
        // Navigate to repair page
        await navigateTo('/user/repair')
      }
      
      // Close dropdown
      showDropdown.value = false
    }

    // Mark all as read
    const markAllAsRead = async () => {
      await notificationStore.markAllAsRead()
    }

    // Get notification icon
    const getNotificationIcon = (type) => {
      const icons = {
        'bill': '🧾',
        'leave': '🗓️',
        'repair': '🛠️',
        'admin_notification': '📢',
        'monthly_ranking': '📊'
      }
      return icons[type] || '🔔'
    }

    // Get notification icon color
    const getNotificationIconColor = (type) => {
      const colors = {
        'bill': '#e74c3c',
        'leave': '#3498db',
        'repair': '#f39c12',
        'admin_notification': '#9b59b6',
        'monthly_ranking': '#27ae60'
      }
      return colors[type] || '#95a5a6'
    }

    // Get notification title
    const getNotificationTitle = (notification) => {
      return notification.title || 'การแจ้งเตือน'
    }

    // Get priority text
    const getPriorityText = (priority) => {
      const priorityMap = {
        'low': 'ต่ำ',
        'medium': 'ปานกลาง',
        'high': 'สูง'
      }
      return priorityMap[priority] || priority
    }

    // Get notification message
    const getNotificationMessage = (notification) => {
      return notification.message || 'มีข้อมูลใหม่'
    }

    // Get status text
    const getStatusText = (status) => {
      const statusMap = {
        'approved': 'อนุมัติแล้ว',
        'rejected': 'ปฏิเสธแล้ว',
        'pending': 'รอดำเนินการ',
        'in_progress': 'กำลังดำเนินการ',
        'completed': 'เสร็จสิ้น',
        'cancelled': 'ยกเลิก',
        'อนุมัติแล้ว': 'อนุมัติแล้ว',
        'ปฏิเสธแล้ว': 'ปฏิเสธแล้ว',
        'รอดำเนินการ': 'รอดำเนินการ',
        'กำลังดำเนินการ': 'กำลังดำเนินการ',
        'เสร็จสิ้น': 'เสร็จสิ้น',
        'ยกเลิก': 'ยกเลิก',
        'ซ่อมแล้ว': 'ซ่อมแล้ว'
      }
      return statusMap[status] || status
    }

    // Get status color
    const getStatusColor = (status) => {
      const colors = {
        'approved': 'success',
        'อนุมัติแล้ว': 'success',
        'completed': 'success',
        'เสร็จสิ้น': 'success',
        'ซ่อมแล้ว': 'success',
        'rejected': 'error',
        'ปฏิเสธแล้ว': 'error',
        'cancelled': 'error',
        'ยกเลิก': 'error',
        'pending': 'warning',
        'รอดำเนินการ': 'warning',
        'in_progress': 'info',
        'กำลังดำเนินการ': 'info'
      }
      return colors[status] || 'grey'
    }

    // Format time
    const formatTime = (date) => {
      try {
        if (!date) return 'ไม่ระบุเวลา'
        
        const dateObj = new Date(date)
        if (isNaN(dateObj.getTime())) {
          return 'ไม่ระบุเวลา'
        }
        
        const now = new Date()
        const diffInMinutes = (now.getTime() - dateObj.getTime()) / (1000 * 60)
        
        if (diffInMinutes < 1) {
          return 'เมื่อสักครู่'
        } else if (diffInMinutes < 60) {
          return `${Math.floor(diffInMinutes)} นาทีที่แล้ว`
        } else if (diffInMinutes < 1440) {
          return `${Math.floor(diffInMinutes / 60)} ชั่วโมงที่แล้ว`
        } else {
          return `${Math.floor(diffInMinutes / 1440)} วันที่แล้ว`
        }
      } catch (error) {
        console.error('Error formatting time:', error, 'date:', date)
        return 'ไม่ระบุเวลา'
      }
    }

    // Check if notification is new (less than 10 minutes old)
    const isNewNotification = (createdAt) => {
      if (!createdAt) return false;
      const notificationDate = new Date(createdAt);
      const now = new Date();
      const diffInMinutes = (now.getTime() - notificationDate.getTime()) / (1000 * 60);
      return diffInMinutes < 10; // เพิ่มเป็น 10 นาที
    };

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.notification-container')) {
        showDropdown.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      
      // Initialize notification store ทันที
      console.log('🔄 Initializing notifications in NotificationDropdown...')
      // ใช้ token validation สำหรับ debug
      const { getTokenWithState, getTokenFingerprint } = await import('@/utils/tokenUtils')
      const { token, state } = getTokenWithState()
      console.log('🔍 Token state:', state, 'fingerprint:', getTokenFingerprint(token || ''))
      console.log('🔍 Is authenticated:', !!localStorage.getItem('isAuthenticated'))
      notificationStore.initialize()
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })

    return {
      showDropdown,
      notifications,
      unreadCount,
      toggleDropdown,
      markAsRead,
      markAllAsRead,
      handleNotificationClick,
      getNotificationIcon,
      getNotificationIconColor,
      getNotificationTitle,
      getPriorityText,
      getNotificationMessage,
      getStatusText,
      getStatusColor,
      formatTime,
      isNewNotification
    }
  }
}
</script>

<style scoped>
.notification-container {
  position: relative;
  display: inline-block;
}

.notification-icon {
  position: relative;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  box-shadow: none;
}

.notification-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.notification-icon:active {
  transform: scale(0.95);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ff4757;
  color: white;
  border-radius: 50%;
  min-width: 18px;
  height: 18px;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 420px;
  max-height: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  margin-top: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20px);
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
}

.notification-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.no-notifications {
  text-align: center;
  padding: 60px 24px;
  color: #64748b;
}

.no-notifications p {
  margin: 20px 0 0 0;
  font-size: 16px;
  font-weight: 500;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-item:hover {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  transform: translateX(4px);
}

.notification-item.unread {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-left: 4px solid #3b82f6;
  position: relative;
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 0 2px 2px 0;
}

.notification-item.new-notification {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-left: 4px solid #3b82f6;
  position: relative;
}

.notification-item.new-notification::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border-radius: 0 2px 2px 0;
}

.notification-icon-wrapper {
  margin-right: 16px;
  margin-top: 2px;
  padding: 8px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative; /* Added for new-indicator positioning */
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 700;
  font-size: 15px;
  color: #1e293b;
  margin-bottom: 6px;
  line-height: 1.3;
  display: flex; /* Added for new-badge positioning */
  align-items: center; /* Added for new-badge positioning */
}

.notification-title .new-badge {
  background-color: #3b82f6;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 8px;
  white-space: nowrap;
}

.priority-badge {
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: bold;
  margin-left: 6px;
  white-space: nowrap;
  color: white;
}

.priority-low {
  background-color: #10b981;
}

.priority-medium {
  background-color: #f59e0b;
}

.priority-high {
  background-color: #ef4444;
}

.notification-message {
  font-size: 14px;
  color: #475569;
  margin-bottom: 6px;
  line-height: 1.4;
  font-weight: 500;
}

.notification-time {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}

.notification-status {
  margin-left: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* Scrollbar styling */
.notification-list::-webkit-scrollbar {
  width: 8px;
}

.notification-list::-webkit-scrollbar-track {
  background: #f8fafc;
  border-radius: 4px;
}

.notification-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
  border-radius: 4px;
  border: 2px solid #f8fafc;
}

.notification-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
}

.new-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: #ef4444;
  border-radius: 50%;
  border: 2px solid white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.notification-emoji {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style> 