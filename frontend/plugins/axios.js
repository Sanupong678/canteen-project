import axios from 'axios'

export default defineNuxtPlugin((nuxtApp) => {
  // ตั้งค่า base URL
  axios.defaults.baseURL = 'http://localhost:4000'

  // เพิ่ม interceptor สำหรับจัดการ token
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // เพิ่ม interceptor สำหรับจัดการ error
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // ถ้า token หมดอายุหรือไม่ถูกต้อง
        localStorage.removeItem('token')
        localStorage.removeItem('userRole')
        localStorage.removeItem('isAuthenticated')
        window.location.href = '/login'
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