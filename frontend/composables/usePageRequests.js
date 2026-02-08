import { onUnmounted, onBeforeUnmount } from 'vue'
import axios from 'axios'

/**
 * Composable สำหรับจัดการ requests ใน page
 * ยกเลิก requests อัตโนมัติเมื่อ component unmount หรือเปลี่ยน page
 */
export const usePageRequests = () => {
  const controllers = new Map()
  const requestIds = []

  /**
   * สร้าง request พร้อม cancellation
   */
  const createRequest = async (requestFn, requestId = null) => {
    // สร้าง request ID ถ้ายังไม่มี
    const id = requestId || `request_${Date.now()}_${Math.random()}`
    
    // ยกเลิก request เก่าถ้ามี
    if (controllers.has(id)) {
      controllers.get(id).abort()
    }
    
    // สร้าง AbortController ใหม่
    const controller = new AbortController()
    controllers.set(id, controller)
    requestIds.push(id)
    
    try {
      const result = await requestFn(controller.signal)
      
      // ลบ controller เมื่อ request เสร็จ
      controllers.delete(id)
      const index = requestIds.indexOf(id)
      if (index > -1) {
        requestIds.splice(index, 1)
      }
      
      return result
    } catch (error) {
      // ลบ controller เมื่อเกิด error
      controllers.delete(id)
      const index = requestIds.indexOf(id)
      if (index > -1) {
        requestIds.splice(index, 1)
      }
      
      // ถ้า error เกิดจาก cancellation ไม่ต้อง throw
      if (error.name === 'AbortError' || error.name === 'CanceledError' || error.message === 'canceled') {
        return null
      }
      
      throw error
    }
  }

  /**
   * Axios request wrapper
   */
  const axiosRequest = async (config, requestId = null) => {
    return createRequest((signal) => {
      return axios({
        ...config,
        signal
      })
    }, requestId || config.url)
  }

  /**
   * ยกเลิก request ตาม ID
   */
  const cancelRequest = (requestId) => {
    if (controllers.has(requestId)) {
      controllers.get(requestId).abort()
      controllers.delete(requestId)
      const index = requestIds.indexOf(requestId)
      if (index > -1) {
        requestIds.splice(index, 1)
      }
    }
  }

  /**
   * ยกเลิก requests ทั้งหมด
   */
  const cancelAllRequests = () => {
    controllers.forEach((controller) => {
      controller.abort()
    })
    controllers.clear()
    requestIds.length = 0
  }

  // Cleanup เมื่อ component unmount
  onBeforeUnmount(() => {
    cancelAllRequests()
  })

  onUnmounted(() => {
    cancelAllRequests()
  })

  return {
    createRequest,
    axiosRequest,
    cancelRequest,
    cancelAllRequests,
    hasActiveRequests: () => controllers.size > 0
  }
}

