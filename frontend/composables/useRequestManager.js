import { ref, onUnmounted } from 'vue'
import axios from 'axios'

/**
 * Composable สำหรับจัดการ request cancellation และ debouncing
 * ใช้เพื่อป้องกันการหลุดเมื่อสลับ page ไวๆ
 */
export const useRequestManager = () => {
  // เก็บ AbortController สำหรับแต่ละ request
  const activeRequests = ref(new Map())
  
  // เก็บ debounce timers
  const debounceTimers = ref(new Map())
  
  // เก็บ request queue
  const requestQueue = ref([])
  const maxConcurrentRequests = 10
  let currentConcurrentRequests = 0

  /**
   * สร้าง AbortController สำหรับ request
   */
  const createAbortController = (requestId) => {
    const controller = new AbortController()
    activeRequests.value.set(requestId, controller)
    return controller
  }

  /**
   * ยกเลิก request ที่ยังไม่เสร็จ
   */
  const cancelRequest = (requestId) => {
    const controller = activeRequests.value.get(requestId)
    if (controller) {
      controller.abort()
      activeRequests.value.delete(requestId)
    }
  }

  /**
   * ยกเลิก requests ทั้งหมด
   */
  const cancelAllRequests = () => {
    activeRequests.value.forEach((controller, requestId) => {
      controller.abort()
    })
    activeRequests.value.clear()
  }

  /**
   * Debounced request - รอให้ request ก่อนหน้าสิ้นสุดก่อน
   */
  const debouncedRequest = async (requestFn, requestId, delay = 300) => {
    // ยกเลิก request เก่าถ้ามี
    if (debounceTimers.value.has(requestId)) {
      clearTimeout(debounceTimers.value.get(requestId))
    }

    // ยกเลิก request ที่กำลังทำงานอยู่
    cancelRequest(requestId)

    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        debounceTimers.value.delete(requestId)
        try {
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          // ถ้า error เกิดจาก cancellation ไม่ต้อง reject
          if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
            reject(error)
          }
        }
      }, delay)

      debounceTimers.value.set(requestId, timer)
    })
  }

  /**
   * Request พร้อม cancellation support
   */
  const requestWithCancel = async (requestFn, requestId) => {
    // ยกเลิก request เก่าถ้ามี
    cancelRequest(requestId)

    // สร้าง AbortController ใหม่
    const controller = createAbortController(requestId)

    try {
      // เพิ่ม signal ไปยัง request config
      const result = await requestFn(controller.signal)
      
      // ลบ controller เมื่อ request เสร็จ
      activeRequests.value.delete(requestId)
      
      return result
    } catch (error) {
      // ลบ controller เมื่อเกิด error
      activeRequests.value.delete(requestId)
      
      // ถ้า error เกิดจาก cancellation ไม่ต้อง throw
      if (error.name === 'AbortError' || error.name === 'CanceledError' || error.message === 'canceled') {
        return null // Return null แทนการ throw error
      }
      
      throw error
    }
  }

  /**
   * Queued request - จำกัดจำนวน concurrent requests
   */
  const queuedRequest = async (requestFn, requestId) => {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        if (currentConcurrentRequests >= maxConcurrentRequests) {
          // รอให้มี slot ว่าง
          requestQueue.value.push({ requestFn, requestId, resolve, reject })
          return
        }

        currentConcurrentRequests++
        
        try {
          const result = await requestFn()
          resolve(result)
        } catch (error) {
          if (error.name !== 'AbortError' && error.name !== 'CanceledError') {
            reject(error)
          }
        } finally {
          currentConcurrentRequests--
          
          // ทำงาน request ถัดไปใน queue
          if (requestQueue.value.length > 0) {
            const next = requestQueue.value.shift()
            executeRequest.call(next)
          }
        }
      }

      executeRequest()
    })
  }

  /**
   * Combined request - รวม debounce, cancel, และ queue
   */
  const smartRequest = async (requestFn, requestId, options = {}) => {
    const {
      debounce = 300,
      cancelPrevious = true,
      useQueue = true
    } = options

    // ถ้าใช้ debounce
    if (debounce > 0) {
      return debouncedRequest(
        () => {
          if (useQueue) {
            return queuedRequest(
              () => requestWithCancel(requestFn, requestId),
              requestId
            )
          } else {
            return requestWithCancel(requestFn, requestId)
          }
        },
        requestId,
        debounce
      )
    }

    // ถ้าใช้ queue
    if (useQueue) {
      return queuedRequest(
        () => requestWithCancel(requestFn, requestId),
        requestId
      )
    }

    // ใช้แค่ cancellation
    return requestWithCancel(requestFn, requestId)
  }

  /**
   * Axios request wrapper พร้อม cancellation
   */
  const axiosRequest = async (config, requestId, options = {}) => {
    return smartRequest(
      (signal) => {
        return axios({
          ...config,
          signal, // เพิ่ม AbortSignal
          cancelToken: config.cancelToken // รองรับ cancelToken เก่า
        })
      },
      requestId,
      options
    )
  }

  // Cleanup เมื่อ component unmount
  onUnmounted(() => {
    cancelAllRequests()
    
    // Clear debounce timers
    debounceTimers.value.forEach(timer => clearTimeout(timer))
    debounceTimers.value.clear()
    
    // Clear request queue
    requestQueue.value = []
  })

  return {
    // Methods
    cancelRequest,
    cancelAllRequests,
    requestWithCancel,
    debouncedRequest,
    queuedRequest,
    smartRequest,
    axiosRequest,
    
    // State
    activeRequests,
    requestQueue,
    currentConcurrentRequests: () => currentConcurrentRequests
  }
}

