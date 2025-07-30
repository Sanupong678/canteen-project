import { ref, reactive, readonly } from 'vue'
import axios from 'axios'

// Global notification store
const notifications = ref([])
const unreadCount = ref(0)
const isInitialized = ref(false)
const lastFetchTime = ref(null)

// Event emitter สำหรับแจ้งเตือนการอัปเดต
const notificationEvents = reactive({
  listeners: new Set()
})

export const useNotificationStore = () => {
  // เพิ่ม event listener
  const addEventListener = (callback) => {
    notificationEvents.listeners.add(callback)
  }

  // ลบ event listener
  const removeEventListener = (callback) => {
    notificationEvents.listeners.delete(callback)
  }

  // แจ้งเตือน event listeners
  const emitEvent = (eventType, data) => {
    notificationEvents.listeners.forEach(callback => {
      callback(eventType, data)
    })
  }

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token')
      const isAuthenticated = localStorage.getItem('isAuthenticated')
      
      if (!token || !isAuthenticated) {
        console.log('❌ No token or not authenticated')
        return
      }

      console.log('🔍 Fetching notifications with token:', token.substring(0, 20) + '...')

      const response = await axios.get('/api/notifications/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.data.success) {
        console.log('📋 Raw notification data:', response.data.data)
        
        // เรียงลำดับข้อมูลใหม่ให้อยู่บนสุด
        const sortedNotifications = response.data.data.sort((a, b) => {
          // เรียงตามวันที่อัปเดตล่าสุด (ใหม่สุดอยู่บน)
          return new Date(b.createdAt) - new Date(a.createdAt)
        })
        
        // อัปเดต global state
        notifications.value = sortedNotifications
        unreadCount.value = notifications.value.filter(n => !n.isRead).length
        lastFetchTime.value = Date.now()
        
        console.log('✅ Notifications fetched:', notifications.value.length)
        console.log('📊 Unread count:', unreadCount.value)
        console.log('📋 Notifications with isRead status:')
        notifications.value.forEach((n, index) => {
          console.log(`  ${index + 1}. ${n.type} - ${n.message} - isRead: ${n.isRead}`)
        })
        console.log('📅 Sorted notifications by date (newest first)')
        
        // แจ้งเตือน components อื่นๆ
        emitEvent('notificationsUpdated', {
          notifications: notifications.value,
          unreadCount: unreadCount.value
        })
      } else {
        console.error('❌ Failed to fetch notifications:', response.data)
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error.response?.data || error.message)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put('/api/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.success) {
        console.log('✅ All notifications marked as read')
        
        // อัปเดต local state
        notifications.value.forEach(n => n.isRead = true)
        unreadCount.value = 0
        
        // แจ้งเตือน components อื่นๆ
        emitEvent('allNotificationsRead', {
          notifications: notifications.value,
          unreadCount: unreadCount.value
        })
      }
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error)
    }
  }

  // Mark single notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // อัปเดต local state
      const notification = notifications.value.find(n => n._id === notificationId)
      if (notification && !notification.isRead) {
        notification.isRead = true
        unreadCount.value--
        
        // แจ้งเตือน components อื่นๆ
        emitEvent('notificationRead', {
          notificationId,
          unreadCount: unreadCount.value
        })
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error)
    }
  }

  // Initialize store
  const initialize = async () => {
    console.log('🚀 Initializing notification store...')
    await fetchNotifications()
    isInitialized.value = true
    
    // ตั้งค่า auto-refresh ทุก 30 วินาที (เฉพาะเมื่อ user อยู่ในหน้า)
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Auto-refreshing notifications...')
        fetchNotifications()
      }
    }, 30000)
  }

  // Force refresh (สำหรับเมื่อ admin อัปเดตข้อมูล)
  const forceRefresh = async () => {
    console.log('🔄 Force refreshing notifications...')
    await fetchNotifications()
  }

  return {
    // State
    notifications: readonly(notifications),
    unreadCount: readonly(unreadCount),
    isInitialized: readonly(isInitialized),
    lastFetchTime: readonly(lastFetchTime),
    
    // Methods
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    initialize,
    forceRefresh,
    addEventListener,
    removeEventListener
  }
} 