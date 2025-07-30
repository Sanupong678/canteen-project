export default defineNuxtPlugin(() => {
  const notificationStore = useNotificationStore()
  
  // ฟังก์ชันสำหรับ refresh notifications เมื่อมีการอัปเดต
  const refreshNotifications = () => {
    console.log('🔄 Refreshing notifications from plugin...')
    notificationStore.forceRefresh()
  }
  
  // ฟังก์ชันสำหรับ mark all as read
  const markAllAsRead = () => {
    console.log('✅ Marking all notifications as read from plugin...')
    notificationStore.markAllAsRead()
  }
  
  // ฟังก์ชันสำหรับ mark single notification as read
  const markAsRead = (notificationId) => {
    console.log('✅ Marking notification as read from plugin:', notificationId)
    notificationStore.markAsRead(notificationId)
  }
  
  // ฟังก์ชันสำหรับ get notification count
  const getNotificationCount = () => {
    return notificationStore.unreadCount
  }
  
  // ฟังก์ชันสำหรับ get notifications
  const getNotifications = () => {
    return notificationStore.notifications
  }
  
  // ฟังก์ชันสำหรับ initialize notifications
  const initializeNotifications = async () => {
    console.log('🚀 Initializing notifications from plugin...')
    await notificationStore.initialize()
  }
  
  // Initialize notifications ทันทีเมื่อ plugin ทำงาน
  console.log('🚀 Plugin loaded, initializing notifications...')
  initializeNotifications()
  
  return {
    provide: {
      // Notification methods
      refreshNotifications,
      markAllAsRead,
      markAsRead,
      getNotificationCount,
      getNotifications,
      initializeNotifications,
      
      // Notification state (readonly)
      notificationCount: readonly(notificationStore.unreadCount),
      notifications: readonly(notificationStore.notifications)
    }
  }
}) 