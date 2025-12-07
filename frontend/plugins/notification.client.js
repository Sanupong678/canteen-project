export default defineNuxtPlugin(() => {
  const notificationStore = useNotificationStore()
  
  // ตรวจสอบว่าเป็น admin หรือไม่ (admin ไม่ใช้ useNotificationStore)
  const getUserRole = () => {
    if (process.client) {
      return sessionStorage.getItem('userRole')
    }
    return null
  }
  
  // ฟังก์ชันสำหรับ refresh notifications เมื่อมีการอัปเดต
  const refreshNotifications = () => {
    // ไม่ refresh ถ้าเป็น admin (admin ใช้ AdminNotificationDropdown แทน)
    const role = getUserRole()
    if (role === 'admin') {
      console.log('⚠️ Admin detected - skipping notification refresh (admin uses AdminNotificationDropdown)')
      return
    }
    console.log('🔄 Refreshing notifications from plugin...')
    notificationStore.forceRefresh()
  }
  
  // ฟังก์ชันสำหรับ mark all as read
  const markAllAsRead = () => {
    const role = getUserRole()
    if (role === 'admin') {
      console.log('⚠️ Admin detected - skipping mark all as read (admin uses AdminNotificationDropdown)')
      return
    }
    console.log('✅ Marking all notifications as read from plugin...')
    notificationStore.markAllAsRead()
  }
  
  // ฟังก์ชันสำหรับ mark single notification as read
  const markAsRead = (notificationId) => {
    const role = getUserRole()
    if (role === 'admin') {
      console.log('⚠️ Admin detected - skipping mark as read (admin uses AdminNotificationDropdown)')
      return
    }
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
    // ไม่ initialize ถ้าเป็น admin (admin ใช้ AdminNotificationDropdown แทน)
    const role = getUserRole()
    if (role === 'admin') {
      console.log('⚠️ Admin detected - skipping notification initialization (admin uses AdminNotificationDropdown)')
      return
    }
    console.log('🚀 Initializing notifications from plugin...')
    await notificationStore.initialize()
  }
  
  // Initialize notifications ทันทีเมื่อ plugin ทำงาน (เฉพาะ user ธรรมดา)
  const role = getUserRole()
  if (role !== 'admin') {
    console.log('🚀 Plugin loaded, initializing notifications...')
    initializeNotifications()
  } else {
    console.log('⚠️ Admin detected - notification plugin skipped (admin uses AdminNotificationDropdown)')
  }
  
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