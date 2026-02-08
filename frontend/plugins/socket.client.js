import { io } from 'socket.io-client'
import { useNotificationStore } from '@/composables/useNotificationStore'
import { getTokenWithState, clearInvalidToken, TokenState, logTokenState, getTokenFingerprint } from '@/utils/tokenUtils'

export default defineNuxtPlugin((nuxtApp) => {
  if (!process.client) return

  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase || 'http://localhost:4000'

  // Get token with state
  const { token, state } = getTokenWithState()
  
  // Log token state
  logTokenState(state, token)
  
  // ถ้า token ไม่ valid ให้ clear และไม่ connect socket
  if (state !== TokenState.VALID) {
    if (state !== TokenState.MISSING) {
      clearInvalidToken()
    }
    // Don't connect socket if token is invalid
    // API should be the first to detect token issues
  }

  let invalidTokenAttempts = 0
  const MAX_INVALID_TOKEN_ATTEMPTS = 3
  const RECONNECT_DELAY_MS = 2000 // Delay intentional reconnect to prevent storm

  const socket = io(baseUrl, {
    transports: ['websocket', 'polling'], // เพิ่ม polling เป็น fallback
    auth: token ? { token } : {},
    autoConnect: state === TokenState.VALID, // Connect เฉพาะเมื่อมี valid token
    reconnection: state === TokenState.VALID, // Reconnect เฉพาะเมื่อมี valid token
    reconnectionAttempts: state === TokenState.VALID ? Infinity : 0, // ไม่ reconnect ถ้าไม่มี token
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 60000,
    withCredentials: true,
    upgrade: true,
    rememberUpgrade: true,
    forceNew: false
  })

  let reconnectAttempts = 0
  let connectionCheckInterval = null

  socket.on('connect', () => {
    // Log เฉพาะใน development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔌 Socket connected', socket.id)
    }
    
    // Reset counters เมื่อ connect สำเร็จ
    reconnectAttempts = 0
    invalidTokenAttempts = 0
    
    // Update socket auth token เมื่อ reconnect (กรณี token เปลี่ยน)
    const { token: currentToken, state: currentState } = getTokenWithState()
    if (currentState === TokenState.VALID && currentToken && socket.auth?.token !== currentToken) {
      socket.auth = { token: currentToken }
      logTokenState(currentState, currentToken)
    }
    
    // Clear any existing health check
    if (connectionCheckInterval) {
      clearInterval(connectionCheckInterval)
    }
    
    // Health check ทุก 30 วินาที - ลด log
    connectionCheckInterval = setInterval(() => {
      if (!socket.connected) {
        // ตรวจสอบ token state ก่อน reconnect
        const { token: healthToken, state: healthState } = getTokenWithState()
        if (healthState !== TokenState.VALID || !healthToken) {
          // ถ้าไม่มี valid token ให้หยุด reconnect
          logTokenState(healthState, healthToken)
          clearInvalidToken()
          socket.disconnect()
          if (connectionCheckInterval) {
            clearInterval(connectionCheckInterval)
            connectionCheckInterval = null
          }
          return
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Socket health check failed - attempting reconnect')
        }
        socket.connect()
      }
    }, 30000)
  })

  socket.on('disconnect', (reason) => {
    // Log เฉพาะใน development หรือเมื่อ reason ไม่ใช่ปกติ
    if (process.env.NODE_ENV === 'development' || 
        (reason !== 'transport close' && reason !== 'io client disconnect')) {
      console.log('🔌 Socket disconnected:', reason)
    }
    reconnectAttempts++
    
    // ถ้า disconnect เนื่องจากการปิด server หรือ transport error
    // อย่า reconnect ทันที - ใช้ delay เพื่อกัน storm และให้ auth state settle
    if (reason === 'io server disconnect' || reason === 'transport close') {
      // ตรวจสอบ token state ก่อน reconnect
      const { token: reconnectToken, state: reconnectState } = getTokenWithState()
      
      if (reconnectState === TokenState.VALID && reconnectToken) {
        // Delay intentional reconnect to prevent storm
        setTimeout(() => {
          // Double-check token state after delay (may have changed)
          const { token: delayedToken, state: delayedState } = getTokenWithState()
          if (delayedState === TokenState.VALID && delayedToken && !socket.connected) {
            if (process.env.NODE_ENV === 'development') {
              console.log(`[AUTH] Delayed reconnect after ${RECONNECT_DELAY_MS}ms, fingerprint: ${getTokenFingerprint(delayedToken)}`)
            }
            socket.auth = { token: delayedToken }
            socket.connect()
          } else {
            logTokenState(delayedState, delayedToken)
            if (process.env.NODE_ENV === 'development') {
              console.log('[AUTH] Reconnect cancelled - token state changed during delay')
            }
          }
        }, RECONNECT_DELAY_MS)
      } else {
        logTokenState(reconnectState, reconnectToken)
        if (process.env.NODE_ENV === 'development') {
          console.log('[AUTH] Reconnect cancelled - invalid token state')
        }
      }
    }
  })

  socket.on('connect_error', (error) => {
    const errorMessage = error.message || ''
    
    // ตรวจสอบว่า error เกิดจาก token issue หรือไม่
    // แต่ Socket ไม่ควรเป็นตัวแรกที่รู้ - API ควรตรวจพบก่อน
    if (errorMessage.includes('malformed') || errorMessage.includes('jwt') || errorMessage.includes('Unauthorized')) {
      invalidTokenAttempts++
      
      const { token: errorToken, state: errorState } = getTokenWithState()
      logTokenState(errorState, errorToken)
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[AUTH] Socket auth failed - state: ${errorState}, attempts: ${invalidTokenAttempts}, fingerprint: ${getTokenFingerprint(errorToken || '')}`)
        console.warn('[AUTH] Note: API should detect token issues first, not socket')
      }
      
      // ถ้า token invalid หลายครั้ง ให้ clear และหยุด reconnect
      // แต่ควรให้ API เป็นตัวแรกที่ clear token
      if (invalidTokenAttempts >= MAX_INVALID_TOKEN_ATTEMPTS) {
        clearInvalidToken()
        socket.disconnect()
        
        if (process.env.NODE_ENV === 'development') {
          console.warn('[AUTH] Max invalid token attempts reached - stopping socket reconnection')
        }
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login'
        }
        return
      }
    } else {
      // Reset counter สำหรับ error อื่นๆ
      invalidTokenAttempts = 0
      
      if (process.env.NODE_ENV === 'development') {
        console.error('🔌 Socket connection error:', errorMessage)
      }
    }
  })

  socket.on('reconnect', (attemptNumber) => {
    // Log เฉพาะใน development
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Socket reconnected after', attemptNumber, 'attempts')
    }
    reconnectAttempts = 0
  })

  socket.on('reconnect_attempt', (attemptNumber) => {
    // Log เฉพาะใน development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Reconnection attempt', attemptNumber)
    }
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




























