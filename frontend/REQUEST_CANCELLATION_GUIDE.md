# 📖 คู่มือการใช้งาน Request Cancellation

## 🎯 วัตถุประสงค์
ป้องกันการหลุดเมื่อสลับ page ไวๆ โดยการยกเลิก requests ที่ยังไม่เสร็จเมื่อเปลี่ยน page

---

## 🚀 วิธีใช้งาน

### 1. ใช้ `usePageRequests` (แนะนำ)

```vue
<script setup>
import { usePageRequests } from '@/composables/usePageRequests'

const { axiosRequest, cancelAllRequests } = usePageRequests()

// ใช้ axiosRequest แทน axios.get/post/put/delete
const fetchData = async () => {
  try {
    const response = await axiosRequest({
      method: 'GET',
      url: '/api/notifications/user'
    }, 'fetch-notifications') // requestId (optional)
    
    if (response) {
      // Handle response
      console.log(response.data)
    }
  } catch (error) {
    // Error handling (จะไม่ throw error ถ้า request ถูก cancel)
    if (error.name !== 'AbortError') {
      console.error(error)
    }
  }
}

// Requests จะถูกยกเลิกอัตโนมัติเมื่อ component unmount
</script>
```

### 2. ใช้ `useRequestManager` (สำหรับ advanced usage)

```vue
<script setup>
import { useRequestManager } from '@/composables/useRequestManager'

const { smartRequest, axiosRequest } = useRequestManager()

// Smart request with debouncing and queuing
const fetchData = async () => {
  try {
    const response = await smartRequest(
      (signal) => axios.get('/api/notifications/user', { signal }),
      'fetch-notifications',
      {
        debounce: 300,        // Debounce 300ms
        cancelPrevious: true, // ยกเลิก request เก่า
        useQueue: true        // ใช้ request queue
      }
    )
    
    if (response) {
      console.log(response.data)
    }
  } catch (error) {
    console.error(error)
  }
}
</script>
```

### 3. ใช้ `requestHelpers` (สำหรับ manual control)

```vue
<script setup>
import { axiosWithCancel, debouncedAxios } from '@/utils/requestHelpers'

// Manual cancellation
const controller = new AbortController()

const fetchData = async () => {
  try {
    const response = await axiosWithCancel({
      method: 'GET',
      url: '/api/notifications/user'
    }, controller)
    
    if (response) {
      console.log(response.data)
    }
  } catch (error) {
    console.error(error)
  }
}

// Cancel manually
onUnmounted(() => {
  controller.abort()
})

// Debounced request
const debouncedFetch = debouncedAxios({
  method: 'GET',
  url: '/api/notifications/user'
}, 300) // 300ms debounce
</script>
```

---

## 📝 ตัวอย่างการใช้งานใน Pages

### ตัวอย่าง 1: User Bill Page

```vue
<script setup>
import { usePageRequests } from '@/composables/usePageRequests'

const { axiosRequest } = usePageRequests()
const bills = ref([])

const fetchBills = async () => {
  try {
    const response = await axiosRequest({
      method: 'GET',
      url: '/api/bills/history'
    }, 'fetch-bills')
    
    if (response && response.data.success) {
      bills.value = response.data.data
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error fetching bills:', error)
      bills.value = []
    }
  }
}

onMounted(() => {
  fetchBills()
})
</script>
```

### ตัวอย่าง 2: Notifications

```vue
<script setup>
import { usePageRequests } from '@/composables/usePageRequests'

const { axiosRequest } = usePageRequests()
const notifications = ref([])

const fetchNotifications = async () => {
  try {
    const response = await axiosRequest({
      method: 'GET',
      url: '/api/notifications/user'
    }, 'fetch-notifications')
    
    if (response && response.data.success) {
      notifications.value = response.data.data
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error fetching notifications:', error)
    }
  }
}

onMounted(() => {
  fetchNotifications()
})
</script>
```

---

## ⚙️ การตั้งค่า

### Axios Plugin
Axios plugin จะยกเลิก requests อัตโนมัติเมื่อเปลี่ยน route:

```javascript
// frontend/plugins/axios.js
// Requests จะถูกยกเลิกเมื่อ:
// 1. เปลี่ยน route
// 2. Component unmount
// 3. เรียก cancelAllPendingRequests() manually
```

### Timeout Settings
```javascript
// Default timeout: 30 seconds
// สามารถปรับได้ใน axios config
axios.defaults.timeout = 30000
```

---

## 🔍 Debugging

### ตรวจสอบ Active Requests
```javascript
import { usePageRequests } from '@/composables/usePageRequests'

const { hasActiveRequests } = usePageRequests()

console.log('Has active requests:', hasActiveRequests())
```

### Log Request Cancellation
```javascript
// ใน axios interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.name === 'AbortError' || error.name === 'CanceledError') {
      console.log('Request canceled:', error.config?.url)
    }
    return Promise.reject(error)
  }
)
```

---

## ✅ Best Practices

1. **ใช้ `usePageRequests` สำหรับทุก page**
   - ยกเลิก requests อัตโนมัติเมื่อเปลี่ยน page
   - ไม่ต้องจัดการ cleanup manually

2. **ใช้ requestId ที่ unique**
   - ช่วยให้ยกเลิก request เก่าได้ง่าย
   - ใช้ URL หรือชื่อที่อธิบายได้

3. **ตรวจสอบ response ก่อนใช้งาน**
   - Response อาจเป็น `null` ถ้า request ถูก cancel
   - ตรวจสอบ `if (response)` ก่อนใช้งาน

4. **Handle cancellation errors**
   - ไม่ต้องแสดง error ถ้า request ถูก cancel
   - ตรวจสอบ `error.name !== 'AbortError'`

5. **ใช้ debouncing สำหรับ frequent requests**
   - ลดจำนวน requests
   - ป้องกัน connection pool exhaustion

---

## 🐛 Troubleshooting

### Request ไม่ถูกยกเลิก
- ตรวจสอบว่าใช้ `axiosRequest` จาก `usePageRequests`
- ตรวจสอบว่า component มี `onUnmounted` hook

### Error ยัง throw อยู่แม้ request ถูก cancel
- ตรวจสอบ error handling
- ใช้ `if (error.name !== 'AbortError')` เพื่อ filter cancellation errors

### Requests ยังทำงานอยู่หลังเปลี่ยน page
- ตรวจสอบว่าใช้ `usePageRequests` หรือ `useRequestManager`
- ตรวจสอบว่า axios plugin ทำงานถูกต้อง

---

**อัปเดตล่าสุด:** 2024-01-XX

