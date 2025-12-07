<template>
  <div class="admin-notification-container">
    <button 
      @click="toggleDropdown" 
      class="admin-notification-icon"
      :class="{ 'has-notifications': unreadCount > 0 }"
    >
      <span style="font-size: 24px; color: white;">🔔</span>
      <span v-if="unreadCount > 0" class="admin-notification-badge">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <div v-if="showDropdown" class="admin-notification-dropdown">
      <div class="admin-notification-header">
        <h3>การแจ้งเตือนจาก User</h3>
        <button 
          v-if="unreadCount > 0" 
          @click="markAllAsRead" 
          class="mark-all-read-btn"
        >
          อ่านทั้งหมด
        </button>
      </div>

      <div class="admin-notification-list">
        <div 
          v-for="notification in notifications" 
          :key="notification._id"
          class="admin-notification-item"
          :class="{ 
            'unread': !notification.isRead,
            'new-notification': isNewNotification(notification.createdAt)
          }"
          @click="markAsRead(notification._id)"
        >
          <div class="admin-notification-icon-wrapper">
            <span 
              :style="{ color: getNotificationIconColor(notification.type) }"
              class="admin-notification-emoji"
            >
              {{ getNotificationIcon(notification.type) }}
            </span>
            <!-- แสดงจุดแดงสำหรับข้อมูลใหม่ -->
            <div v-if="isNewNotification(notification.createdAt)" class="new-indicator"></div>
          </div>
          
          <div class="admin-notification-content">
            <div class="admin-notification-title">
              {{ notification.title }}
              <span v-if="isNewNotification(notification.createdAt)" class="new-badge">ใหม่</span>
            </div>
            <div class="admin-notification-message">
              {{ notification.message }}
            </div>
            <div class="admin-notification-details">
              <div class="user-info">
                <strong>ผู้ส่ง:</strong> {{ notification.details?.userDisplayName || notification.details?.userName }}
              </div>
              <div class="shop-info">
                <strong>ร้านค้า:</strong> {{ notification.details?.shopName }}
              </div>
              <div class="canteen-info">
                <strong>โรงอาหาร:</strong> {{ notification.details?.canteenName }}
              </div>
            </div>
            <div class="admin-notification-time">
              {{ formatTime(notification.createdAt) }}
            </div>
          </div>
          
          <div class="admin-notification-status">
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
          <p>ไม่มีการแจ้งเตือนจาก User</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'
import { useNuxtApp } from '#app'

export default {
  name: 'AdminNotificationDropdown',
  
  setup() {
    const showDropdown = ref(false)
    const notifications = ref([])
    const unreadCount = ref(0)

    // ฟังก์ชันสำหรับเข้าถึง localStorage อย่างปลอดภัย
    const getLocalStorage = (key, defaultValue = '0') => {
      if (process.client) {
        return localStorage.getItem(key) || defaultValue
      }
      return defaultValue
    }

    const setLocalStorage = (key, value) => {
      if (process.client) {
        localStorage.setItem(key, value)
      }
    }

    // อัปเดต unread count เมื่อมี notifications ใหม่
    const updateUnreadCount = () => {
      const newUnreadCount = notifications.value.filter(n => !n.isRead).length
      if (newUnreadCount !== unreadCount.value) {
        unreadCount.value = newUnreadCount
        setLocalStorage('adminUnreadCount', unreadCount.value.toString())
        console.log('📊 Updated unread count:', unreadCount.value)
      }
    }

    // Fetch admin notifications
    const fetchNotifications = async () => {
      try {
        // ตรวจสอบ token จากทั้ง localStorage และ sessionStorage
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        if (!token) {
          console.log('❌ No token found in localStorage or sessionStorage')
          return
        }

        console.log('🔍 Fetching admin notifications from /api/admin-notifications/admin...')

        const response = await axios.get('/api/admin-notifications/admin', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.data.success) {
          console.log('📋 Admin notification data:', response.data.data)
          
          // ใช้ข้อมูลที่เรียงมาแล้วจาก server (ยังไม่อ่านขึ้นก่อน)
          // ไม่ต้อง sort ใหม่เพราะ backend ได้ sort แล้วให้ยังไม่อ่านขึ้นก่อน
          notifications.value = response.data.data
          
          // อัปเดต unread count จาก server response
          const newUnreadCount = notifications.value.filter(n => !n.isRead).length
          const savedUnreadCount = parseInt(getLocalStorage('adminUnreadCount', '0'))
          
          // ถ้า localStorage เป็น 0 และ server ก็ไม่มี unread notifications
          if (savedUnreadCount === 0 && newUnreadCount === 0) {
            unreadCount.value = 0
            console.log('📱 Using saved unread count (0) from localStorage')
          } else {
            // อัปเดตจาก server response
            unreadCount.value = newUnreadCount
            setLocalStorage('adminUnreadCount', unreadCount.value.toString())
            console.log('📊 Updated unread count from server:', unreadCount.value)
          }
          
          console.log('✅ Admin notifications fetched:', notifications.value.length)
          console.log('📊 Current unread count from localStorage:', unreadCount.value)
        }
      } catch (error) {
        console.error('❌ Error fetching admin notifications:', error.response?.data || error.message)
      }
    }

    // Toggle dropdown
    const toggleDropdown = async () => {
      showDropdown.value = !showDropdown.value
      if (showDropdown.value) {
        console.log('🔄 Loading fresh admin notifications...')
        await fetchNotifications()
      }
    }

    // Mark notification as read
    const markAsRead = async (notificationId) => {
      try {
        console.log('🔄 Marking notification as read:', notificationId)
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        if (!token) {
          console.error('❌ No token found')
          return
        }
        
        const response = await axios.put(`/api/admin-notifications/admin/${notificationId}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        console.log('✅ Server response:', response.data)
        
        // Update local state
        const notification = notifications.value.find(n => n._id === notificationId)
        if (notification && !notification.isRead) {
          notification.isRead = true
          unreadCount.value--
          setLocalStorage('adminUnreadCount', unreadCount.value.toString())
          console.log('✅ Notification marked as read. New unread count:', unreadCount.value)
        } else {
          console.log('ℹ️ Notification already read or not found')
        }
        
        // ไม่ต้อง refresh เพราะเราได้อัปเดต local state แล้ว
        
      } catch (error) {
        console.error('❌ Error marking admin notification as read:', error.response?.data || error.message)
      }
    }

    // Mark all as read
    const markAllAsRead = async () => {
      try {
        console.log('🔄 Marking all admin notifications as read...')
        console.log('📊 Current unread count:', unreadCount.value)
        
        const token = localStorage.getItem('token') || sessionStorage.getItem('token')
        if (!token) {
          console.error('❌ No token found')
          return
        }
        
        const response = await axios.put('/api/admin-notifications/admin/mark-all-read', {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        console.log('✅ Server response:', response.data)
        
        // Update local state
        notifications.value.forEach(n => {
          if (!n.isRead) {
            n.isRead = true
            console.log('✅ Marked notification as read:', n._id)
          }
        })
        
        unreadCount.value = 0
        setLocalStorage('adminUnreadCount', '0')
        console.log('✅ All notifications marked as read. New unread count:', unreadCount.value)
        console.log('💾 Saved to localStorage:', getLocalStorage('adminUnreadCount'))
        
        // ไม่ต้อง refresh เพราะเราได้อัปเดต local state แล้ว
        // และ backend ได้อัปเดต isRead = true แล้ว
        
      } catch (error) {
        console.error('❌ Error marking all admin notifications as read:', error.response?.data || error.message)
      }
    }

    // Get notification icon
    const getNotificationIcon = (type) => {
      const icons = {
        'bill': '🧾',
        'leave': '🗓️',
        'repair': '🛠️'
      }
      return icons[type] || '🔔'
    }

    // Get notification icon color
    const getNotificationIconColor = (type) => {
      const colors = {
        'bill': '#e74c3c',
        'leave': '#3498db',
        'repair': '#f39c12'
      }
      return colors[type] || '#95a5a6'
    }

    // Get status text
    const getStatusText = (status) => {
      const statusMap = {
        'pending': 'รอดำเนินการ',
        'approved': 'อนุมัติแล้ว',
        'rejected': 'ปฏิเสธแล้ว',
        'in_progress': 'กำลังดำเนินการ',
        'completed': 'เสร็จสิ้น',
        'cancelled': 'ยกเลิก'
      }
      return statusMap[status] || status
    }

    // Get status color
    const getStatusColor = (status) => {
      const colors = {
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'error',
        'in_progress': 'info',
        'completed': 'success',
        'cancelled': 'error'
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
      return diffInMinutes < 10;
    };

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (!event.target.closest('.admin-notification-container')) {
        showDropdown.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      
      // โหลด unread count จาก localStorage ก่อน
      const savedUnreadCount = getLocalStorage('adminUnreadCount')
      if (savedUnreadCount !== null) {
        unreadCount.value = parseInt(savedUnreadCount)
        console.log('📱 Loaded unread count from localStorage:', unreadCount.value)
      }
      
      fetchNotifications()
      
      // Realtime via socket plugin
      try {
        const { $socket } = useNuxtApp()
        if ($socket) {
          $socket.on('admin:bill:newUpload', fetchNotifications)
          $socket.on('admin:leave:new', fetchNotifications)
          $socket.on('admin:repair:new', fetchNotifications)
        }
        onUnmounted(() => {
          if ($socket) {
            $socket.off('admin:bill:newUpload', fetchNotifications)
            $socket.off('admin:leave:new', fetchNotifications)
            $socket.off('admin:repair:new', fetchNotifications)
          }
        })
      } catch (e) { /* no-op */ }
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
      updateUnreadCount,
      getNotificationIcon,
      getNotificationIconColor,
      getStatusText,
      getStatusColor,
      formatTime,
      isNewNotification
    }
  }
}
</script>

<style scoped>
.admin-notification-container {
  position: relative;
  display: inline-block;
}

.admin-notification-icon {
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

.admin-notification-icon:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}

.admin-notification-icon:active {
  transform: scale(0.95);
}

.admin-notification-badge {
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

.admin-notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 400px;
  max-height: 500px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
}

.admin-notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.admin-notification-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
}

.mark-all-read-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.mark-all-read-btn:hover {
  background: #2563eb;
}

.admin-notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.admin-notification-item {
  display: flex;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: background 0.3s ease;
  position: relative;
}

.admin-notification-item:hover {
  background: #f8fafc;
}

.admin-notification-item.unread {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
}

.admin-notification-item.new-notification {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-left: 4px solid #3b82f6;
}

.admin-notification-icon-wrapper {
  margin-right: 16px;
  margin-top: 2px;
  position: relative;
}

.admin-notification-emoji {
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-notification-content {
  flex: 1;
  min-width: 0;
}

.admin-notification-title {
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 6px;
  line-height: 1.3;
  display: flex;
  align-items: center;
}

.admin-notification-title .new-badge {
  background-color: #3b82f6;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  margin-left: 8px;
  white-space: nowrap;
}

.admin-notification-message {
  color: #4a5568;
  font-size: 14px;
  margin-bottom: 8px;
  line-height: 1.4;
}

.admin-notification-details {
  background: #f7fafc;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #4a5568;
}

.admin-notification-details > div {
  margin-bottom: 4px;
}

.admin-notification-details > div:last-child {
  margin-bottom: 0;
}

.admin-notification-time {
  color: #718096;
  font-size: 12px;
}

.admin-notification-status {
  margin-left: 12px;
  display: flex;
  align-items: flex-start;
}

.no-notifications {
  text-align: center;
  padding: 32px 16px;
  color: #718096;
}

.no-notifications p {
  margin: 8px 0 0 0;
  font-size: 14px;
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
</style> 