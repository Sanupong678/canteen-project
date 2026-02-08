import axios from 'axios'

/**
 * สร้าง AbortController สำหรับ request
 */
export const createRequestController = () => {
  return new AbortController()
}

/**
 * Debounce function สำหรับ API calls
 */
export const debounce = (func, wait = 300) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function สำหรับ API calls
 */
export const throttle = (func, limit = 1000) => {
  let inThrottle
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Axios request พร้อม cancellation
 */
export const axiosWithCancel = async (config, controller) => {
  const abortController = controller || createRequestController()
  
  try {
    const response = await axios({
      ...config,
      signal: abortController.signal
    })
    return response
  } catch (error) {
    // ถ้า error เกิดจาก cancellation ไม่ต้อง throw
    if (error.name === 'AbortError' || error.name === 'CanceledError' || error.message === 'canceled') {
      return null
    }
    throw error
  }
}

/**
 * Debounced axios request
 */
export const debouncedAxios = (config, delay = 300) => {
  let timeoutId
  let abortController = null
  
  return new Promise((resolve, reject) => {
    // ยกเลิก request เก่า
    if (abortController) {
      abortController.abort()
    }
    
    // Clear timeout เก่า
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    // สร้าง AbortController ใหม่
    abortController = createRequestController()
    
    timeoutId = setTimeout(async () => {
      try {
        const response = await axios({
          ...config,
          signal: abortController.signal
        })
        resolve(response)
      } catch (error) {
        if (error.name !== 'AbortError' && error.name !== 'CanceledError' && error.message !== 'canceled') {
          reject(error)
        }
      }
    }, delay)
  })
}

