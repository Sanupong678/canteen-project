import axios from 'axios'

export default defineNuxtPlugin((nuxtApp) => {
  // ตั้งค่า base URL และ credentials
  const baseURL = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:4000'
  
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

  // เพิ่ม interceptor สำหรับเพิ่ม Authorization header
  axios.interceptors.request.use(
    (config) => {
      // เพิ่ม Authorization header ถ้ามี token ใน sessionStorage
      if (process.client) {
        const token = sessionStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      }
      
      // ตั้งค่า timeout สำหรับ request นี้ (ถ้ายังไม่มี)
      if (!config.timeout) {
        config.timeout = 60000
      }
      
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

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

      // จัดการ 401 Unauthorized
      if (error.response?.status === 401) {
        if (process.client) {
          // ถ้า token หมดอายุหรือไม่ถูกต้อง
          sessionStorage.clear()
          localStorage.clear()
          
          // Clear cookies
          document.cookie = 'user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          
          // ถ้าไม่ได้อยู่ที่หน้า login หรือ welcome อยู่แล้ว ให้ redirect ไปหน้า login
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