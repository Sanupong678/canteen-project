import axios from 'axios'
import { getTokenWithState, clearInvalidToken, TokenState, logTokenState, getTokenFingerprint } from '@/utils/tokenUtils'

export default defineNuxtPlugin((nuxtApp) => {
  // ตั้งค่า base URL จาก runtime config กลาง
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase
  
  // ตั้งค่า timeout และ defaults
  axios.defaults.baseURL = baseURL
  axios.defaults.withCredentials = true
  axios.defaults.timeout = 60000 // 60 seconds
  axios.defaults.headers.common['Content-Type'] = 'application/json'

  // Retry logic สำหรับ requests ที่ล้มเหลว
  const retryRequest = async (error, config = {}) => {
    const { retryCount = 0, retryDelay = 1000, maxRetries = 3 } = config
    const shouldRetry = 
      (!error.response || error.response.status >= 500 || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') &&
      retryCount < maxRetries

    if (shouldRetry) {
      const delay = retryDelay * Math.pow(2, retryCount) // Exponential backoff
      console.log(`🔄 Retrying request (${retryCount + 1}/${maxRetries}) after ${delay}ms...`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Retry ครั้งใหม่
      const newConfig = {
        ...error.config,
        retryCount: retryCount + 1,
        retryDelay,
        maxRetries
      }
      
      try {
        return await axios.request(newConfig)
      } catch (retryError) {
        return retryRequest(retryError, newConfig)
      }
    }
    
    return Promise.reject(error)
  }

  // เก็บ pending requests เพื่อยกเลิกเมื่อเปลี่ยน page
  const pendingRequests = new Map()
  
  // เพิ่ม interceptor สำหรับเพิ่ม Authorization header และ request tracking
  axios.interceptors.request.use(
    (config) => {
      // สร้าง request ID ถ้ายังไม่มี
      if (!config.requestId) {
        config.requestId = `${config.method}_${config.url}_${Date.now()}`
      }
      
      // เก็บ request reference
      if (config.signal) {
        pendingRequests.set(config.requestId, config)
      }
      
      // ไม่เพิ่ม Authorization header สำหรับ login และ logout endpoints
      const isAuthEndpoint = config.url?.includes('/api/auth/login') || config.url?.includes('/api/auth/logout')
      
      // Validate token state ก่อนส่ง
      if (process.client && !isAuthEndpoint) {
        const { token, state } = getTokenWithState()
        
        if (state === TokenState.VALID && token) {
          config.headers.Authorization = `Bearer ${token}`
          logTokenState(state, token)
        } else {
          // ถ้า token ไม่ valid ให้ clear และไม่ส่ง header
          logTokenState(state, token)
          if (state !== TokenState.MISSING) {
            clearInvalidToken()
          }
          // ลบ Authorization header ถ้ามี (เพื่อป้องกันการส่ง token เก่า)
          delete config.headers.Authorization
        }
      } else if (isAuthEndpoint) {
        // สำหรับ login/logout endpoints ให้ลบ Authorization header ถ้ามี
        delete config.headers.Authorization
      }
      
      // ตั้งค่า timeout สำหรับ request นี้ (ถ้ายังไม่มี)
      if (!config.timeout) {
        config.timeout = 30000 // ลด timeout เป็น 30 วินาที
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )
  
  // เพิ่ม interceptor สำหรับ cleanup เมื่อ request เสร็จ
  axios.interceptors.response.use(
    (response) => {
      // ลบ request จาก pending list
      if (response.config?.requestId) {
        pendingRequests.delete(response.config.requestId)
      }
      return response
    },
    (error) => {
      // ลบ request จาก pending list
      if (error.config?.requestId) {
        pendingRequests.delete(error.config.requestId)
      }
      
      // ถ้า error เกิดจาก cancellation ไม่ต้อง log
      if (error.name === 'AbortError' || error.name === 'CanceledError' || error.message === 'canceled') {
        return Promise.reject(error)
      }
      
      return Promise.reject(error)
    }
  )
  
  // เพิ่ม function สำหรับยกเลิก requests ทั้งหมด
  const cancelAllPendingRequests = () => {
    pendingRequests.forEach((config, requestId) => {
      if (config.signal && !config.signal.aborted) {
        config.signal.abort()
      }
      pendingRequests.delete(requestId)
    })
  }
  
  // ยกเลิก requests เมื่อเปลี่ยน route
  if (process.client) {
    // Listen to route changes using Nuxt router
    nuxtApp.hook('app:beforeMount', () => {
      // Setup route change listener
      const router = nuxtApp.$router
      if (router) {
        router.beforeEach((to, from, next) => {
          // ยกเลิก requests ที่ยังไม่เสร็จเมื่อเปลี่ยน route
          cancelAllPendingRequests()
          next()
        })
      }
    })
    
    // Cleanup เมื่อ app unmount
    nuxtApp.hook('app:beforeUnmount', () => {
      cancelAllPendingRequests()
    })
  }

  // เพิ่ม interceptor สำหรับจัดการ error และ retry
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Retry logic สำหรับ network errors และ server errors
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET' || (error.response && error.response.status >= 500)) {
        try {
          return await retryRequest(error, {
            retryCount: error.config?.retryCount || 0,
            retryDelay: 1000,
            maxRetries: 3
          })
        } catch (retryError) {
          // ถ้า retry ทั้งหมดล้มเหลว ให้ fallback ไป error handling เดิม
          error = retryError
        }
      }

      // จัดการ 401 Unauthorized (token invalid, expired, or malformed)
      // API เป็นตัวแรกที่รู้ว่า token พัง → clear token → disconnect socket → redirect
      if (error.response?.status === 401) {
        if (process.client) {
          const errorMessage = error.response?.data?.message || error.message || ''
          
          // Determine token state from error message
          let tokenState = TokenState.MISSING
          if (errorMessage.includes('malformed') || errorMessage.includes('jwt malformed')) {
            tokenState = TokenState.MALFORMED
          } else if (errorMessage.includes('expired') || errorMessage.includes('jwt expired')) {
            tokenState = TokenState.EXPIRED
          } else if (errorMessage.includes('Invalid token')) {
            tokenState = TokenState.MALFORMED
          }
          
          // Log token state with fingerprint
          const { token } = getTokenWithState()
          logTokenState(tokenState, token)
          console.log(`[AUTH] API detected token issue: ${tokenState}, fingerprint: ${getTokenFingerprint(token || '')}`)
          
          // Clear invalid token
          clearInvalidToken()
          
          // Disconnect socket (socket should not be the first to know)
          try {
            const { $socket } = useNuxtApp()
            if ($socket && $socket.connected) {
              console.log('[AUTH] Disconnecting socket due to token issue')
              $socket.disconnect()
            }
          } catch (e) {
            // Socket not available, ignore
          }
          
          // Redirect to login if not already there
          if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
            window.location.href = '/login'
          }
        }
      }

      // Log connection errors
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
        console.error('🔌 Connection error:', error.code, error.message)
      }
      
      return Promise.reject(error)
    }
  )

  return {
    provide: {
      axios: axios
    }
  }
}) 