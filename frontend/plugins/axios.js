import axios from 'axios'

export default defineNuxtPlugin((nuxtApp) => {
  // ตั้งค่า base URL และ credentials
  const baseURL = process.env.NODE_ENV === 'production' 
    ? window.location.origin 
    : 'http://localhost:4000'
  
  axios.defaults.baseURL = baseURL
  axios.defaults.withCredentials = true

  // เพิ่ม interceptor สำหรับเพิ่ม Authorization header
  axios.interceptors.request.use(
    (config) => {
      // เพิ่ม Authorization header ถ้ามี token ใน sessionStorage
      const token = sessionStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
        console.log('🔍 Adding Authorization header:', token.substring(0, 20) + '...')
      } else {
        console.log('❌ No token found in sessionStorage')
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // เพิ่ม interceptor สำหรับจัดการ error
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // ถ้า token หมดอายุหรือไม่ถูกต้อง
        sessionStorage.clear()
        
        // Clear cookies
        document.cookie = 'user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        
        // ถ้าไม่ได้อยู่ที่หน้า login หรือ welcome อยู่แล้ว ให้ redirect ไปหน้า login
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login'
        }
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