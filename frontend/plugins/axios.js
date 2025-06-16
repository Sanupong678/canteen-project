import axios from 'axios'

export default defineNuxtPlugin((nuxtApp) => {
  // ตั้งค่า base URL และ credentials
  axios.defaults.baseURL = 'http://localhost:4000'
  axios.defaults.withCredentials = true

  // เพิ่ม interceptor สำหรับจัดการ error
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // ถ้า token หมดอายุหรือไม่ถูกต้อง
        localStorage.removeItem('userRole')
        localStorage.removeItem('displayName')
        localStorage.removeItem('isAuthenticated')
        
        // ถ้าไม่ได้อยู่ที่หน้า login อยู่แล้ว ให้ redirect ไปหน้า login
        if (window.location.pathname !== '/login') {
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