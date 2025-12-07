import { io } from 'socket.io-client'
import { useNotificationStore } from '@/composables/useNotificationStore'

export default defineNuxtPlugin((nuxtApp) => {
  if (!process.client) return

  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase || 'http://localhost:4000'

  const token = process.client ? (sessionStorage.getItem('token') || localStorage.getItem('token')) : null

  const socket = io(baseUrl, {
    transports: ['websocket', 'polling'], // เพิ่ม polling เป็น fallback
    auth: token ? { token } : {},
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000, // ลดจาก 10s เป็น 5s เพื่อ reconnect เร็วขึ้น
    timeout: 60000, // เพิ่มจาก 20s เป็น 60s
    withCredentials: true,
    // เพิ่ม options สำหรับความเสถียร
    upgrade: true,
    rememberUpgrade: true,
    forceNew: false
  })

  let reconnectAttempts = 0
  let connectionCheckInterval = null

  socket.on('connect', () => {
    console.log('🔌 Socket connected', socket.id)
    reconnectAttempts = 0
    
    // Clear any existing health check
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval)
    }
    
    // Health check ทุก 30 วินาที
    connectionCheckInterval = setInterval(() => {
      if (!socket.connected) {
        console.warn('⚠️ Socket health check failed - attempting reconnect')
        socket.connect()
      }
    }, 30000)
  })

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason)
    reconnectAttempts++
    
    // ถ้า disconnect เนื่องจากการปิด server หรือ transport error ให้ reconnect ทันที
    if (reason === 'io server disconnect' || reason === 'transport close') {
      console.log('🔄 Attempting immediate reconnect...')
      socket.connect()
    }
  })

  socket.on('connect_error', (error) => {
    console.error('🔌 Socket connection error:', error.message)
    // ไม่ต้อง reconnect อัตโนมัติ เพราะมี reconnection options อยู่แล้ว
  })

  socket.on('reconnect', (attemptNumber) => {
    console.log('✅ Socket reconnected after', attemptNumber, 'attempts')
    reconnectAttempts = 0
  })

  socket.on('reconnect_attempt', (attemptNumber) => {
    console.log('🔄 Reconnection attempt', attemptNumber)
  })

  socket.on('reconnect_error', (error) => {
    console.error('🔌 Reconnection error:', error.message)
  })

  socket.on('reconnect_failed', () => {
    console.error('❌ Reconnection failed after all attempts')
    // ลอง reconnect อีกครั้ง
    setTimeout(() => {
      if (!socket.connected) {
        console.log('🔄 Manually attempting reconnect...')
        socket.connect()
      }
    }, 5000)
  })

  // Wire events to stores and simple refreshers
  // ตรวจสอบว่าเป็น admin หรือไม่ (admin ไม่ใช้ useNotificationStore)
  const getUserRole = () => {
    if (process.client) {
      return sessionStorage.getItem('userRole')
    }
    return null
  }

  const notificationStore = useNotificationStore()
  const safeRefreshNotifications = async () => {
    // ไม่ refresh ถ้าเป็น admin (admin ใช้ AdminNotificationDropdown แทน)
    const role = getUserRole()
    if (role === 'admin') {
      console.log('⚠️ Admin detected - skipping notification refresh from socket (admin uses AdminNotificationDropdown)')
      return
    }
    try { await notificationStore.fetchNotifications?.() } catch (_) {}
  }

  socket.on('user:notification:new', () => safeRefreshNotifications())
  socket.on('user:bill:updated', () => safeRefreshNotifications())
  socket.on('user:bill:imageCancelled', () => safeRefreshNotifications())
  socket.on('user:leave:updated', () => safeRefreshNotifications())
  socket.on('user:repair:updated', () => safeRefreshNotifications())

  // Admin side can listen and refresh lists
  nuxtApp.provide('socket', socket)

  // Cleanup เมื่อ app unmount
  nuxtApp.hook('app:beforeMount', () => {
    // ไม่ต้องทำอะไร เพราะ socket จะ manage connection เอง
  })

  nuxtApp.hook('app:beforeUnmount', () => {
    // Clear health check interval
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval)
      connectionCheckInterval = null
    }
    // ไม่ disconnect socket เพราะอาจจะใช้ในหลาย pages
    // socket.disconnect()
  })
})




























