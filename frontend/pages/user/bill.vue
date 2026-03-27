<template>
  <LayoutUser>
    <div class="page-container">
      <div class="content-wrapper">
        <!-- Header -->
        <div class="header-section">
          <div class="header-content">
            <h1 class="page-title">บิลค่าบริการ</h1>
            <p class="page-subtitle">รายการบิลที่ต้องดำเนินการ</p>
          </div>
          <router-link to="/user/bill-history" class="history-link">
            ดูประวัติทั้งหมด →
          </router-link>
        </div>

        <!-- Tabs -->
        <div class="tabs-container">
          <button
            :class="['tab-button', { active: selectedType === 'water' }]"
            @click="selectedType = 'water'"
          >
            💧 ค่าน้ำ
          </button>
          <button
            :class="['tab-button', { active: selectedType === 'electricity' }]"
            @click="selectedType = 'electricity'"
          >
            ⚡ ค่าไฟ
          </button>
        </div>

        <!-- Current Bill Card -->
        <div v-if="currentBill" class="current-bill-card">
          <!-- Card Header -->
          <div class="card-header">
            <div class="header-left">
              <div class="icon-circle">
                📅
              </div>
              <div>
                <p class="bill-title">{{ getBillTypeText(currentBill.type) }}ประจำเดือน {{ formatMonth(currentBill.billMonth) }}</p>
                <p class="bill-id">{{ currentBill.id }}</p>
              </div>
            </div>
            <span :class="['status-badge-new', getStatusClass(currentBill)]">
              ● {{ getStatusText(currentBill) }}
            </span>
          </div>

          <!-- Bill Info Grid -->
          <div class="bill-info-grid">
            <div class="info-item">
              <p class="info-label">วันที่ออกบิล</p>
              <p class="info-value">{{ formatDate(currentBill.createdAt) }}</p>
            </div>
            <div class="info-item">
              <p class="info-label">เลขบัญชี</p>
              <p class="info-value">{{ currentBill.accountNumber }}</p>
            </div>
            <div class="info-item">
              <p class="info-label">วันครบกำหนด</p>
              <p class="info-value due-date-text">{{ formatDate(currentBill.dueDate) }}</p>
            </div>
            <div class="info-item">
              <p class="info-label">ชื่อบัญชี</p>
              <p class="info-value">{{ currentBill.accountName }}</p>
            </div>
          </div>

          <!-- Waiting Section or Upload Section -->
          <div v-if="!hasAmount(currentBill)" class="waiting-section">
            <div class="waiting-content">
              <div class="waiting-icon">
                <v-progress-circular
                  v-if="!currentBill.image && currentBill.status !== 'รอตรวจสอบ'"
                  indeterminate
                  color="primary"
                  size="24"
                  width="3"
                ></v-progress-circular>
                <div v-else class="check-icon">✓</div>
              </div>
              <div>
                <p class="waiting-title">
                  <span v-if="!currentBill.image && currentBill.status !== 'รอตรวจสอบ'">รอการอัปโหลดสลิปการโอนเงิน</span>
                  <span v-else>อัปโหลดสลิปสำเร็จ</span>
                </p>
                <p class="waiting-subtitle">
                  <span v-if="!currentBill.image && currentBill.status !== 'รอตรวจสอบ'">รอการคำนวณจากผู้ดูแลระบบ</span>
                  <span v-else>รอการตรวจสอบจากผู้ดูแลระบบ</span>
                </p>
              </div>
            </div>
            <input
              type="file"
              :id="'fileInput_' + currentBill.id"
              :ref="'fileInput_' + currentBill.id"
              accept="image/*"
              class="hidden-file-input"
              @change="handleFileChange($event, currentBill)"
            />
            <button
              v-if="!selectedFiles[currentBill.id] && !currentBill.image && currentBill.status !== 'รอตรวจสอบ'"
              class="pay-button-active"
              @click="triggerFileInput(currentBill.id)"
            >
              อัปโหลดสลิป
            </button>
            <button
              v-else-if="selectedFiles[currentBill.id]"
              class="pay-button-confirm"
              @click="confirmUpload(currentBill)"
            >
              ยืนยันอัปโหลด
            </button>
            <button
              v-else-if="currentBill.image || currentBill.status === 'รอตรวจสอบ'"
              class="pay-button-disabled"
              disabled
            >
              รอตรวจสอบ
            </button>
          </div>
          <div v-else class="upload-section">
            <div class="amount-display">
              <h3 class="amount-text">฿{{ formatAmount(currentBill.amount) }}</h3>
            </div>
            <input
              type="file"
              :id="'fileInput_' + currentBill.id"
              :ref="'fileInput_' + currentBill.id"
              accept="image/*"
              class="hidden-file-input"
              @change="handleFileChange($event, currentBill)"
            />
            <button
              v-if="canUploadSlip(currentBill) && !currentBill.image && !selectedFiles[currentBill.id]"
              class="pay-button-active"
              @click="triggerFileInput(currentBill.id)"
            >
              แจ้งชำระเงิน
            </button>
            <button
              v-else-if="selectedFiles[currentBill.id]"
              class="pay-button-confirm"
              @click="confirmUpload(currentBill)"
            >
              ยืนยันอัปโหลด
            </button>
            <button
              v-else-if="currentBill.image || currentBill.status === 'รอตรวจสอบ'"
              class="pay-button-disabled"
              disabled
            >
              รอตรวจสอบ
            </button>
          </div>
        </div>

        <!-- No Current Bill Message -->
        <div v-if="!currentBill && filteredBills.length === 0" class="no-bills-message">
          <div class="no-bills-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <h3>ไม่มีรายการที่ต้องดำเนินการ</h3>
          <p>ยอดเยี่ยม! คุณได้ชำระบิลทั้งหมดแล้ว</p>
        </div>

        <!-- Previous Bills -->
        <div v-for="bill in previousBills" :key="bill.id" class="previous-bill-card">
          <div class="previous-bill-content">
            <div class="previous-bill-left">
              <div class="previous-icon">✓</div>
              <div>
                <p class="previous-bill-title">{{ getBillTypeText(bill.type) }}ประจำเดือน {{ formatMonth(bill.billMonth) }}</p>
                <p class="previous-bill-date">ชำระแล้วเมื่อ {{ formatDate(bill.paymentDate) }}</p>
              </div>
            </div>
            <div class="previous-bill-amount">
              <p class="previous-amount-text">฿{{ formatAmount(bill.amount) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </LayoutUser>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import axios from 'axios'
import { useNuxtApp } from '#app'

export default {
  name: 'BillPage',
  setup() {
    const selectedType = ref('water')
    const bills = ref([])
    const uploading = ref(false)
    // เพิ่ม state สำหรับไฟล์ที่เลือกต่อ bill
    const selectedFiles = ref({})

    const filteredBills = computed(() => {
      console.log('🔍 filteredBills computed - Total bills:', bills.value.length)
      console.log('🔍 selectedType:', selectedType.value)
      console.log('🔍 All bills:', bills.value.map(b => ({
        id: b.id,
        type: b.type,
        amount: b.amount,
        amountType: typeof b.amount,
        status: b.status
      })))
      
      const filtered = bills.value.filter(bill => {
        console.log('🔍 Checking bill:', {
          id: bill.id,
          type: bill.type,
          selectedType: selectedType.value,
          amount: bill.amount,
          amountType: typeof bill.amount,
          status: bill.status
        })
        
        // ตรวจสอบว่า type ตรงกัน
        if (bill.type !== selectedType.value) {
          console.log('❌ Type mismatch:', bill.type, '!==', selectedType.value)
          return false
        }
        
        // ตรวจสอบว่า status ไม่ใช่ 'เสร็จสิ้น'
        if (bill.status === 'เสร็จสิ้น') {
          console.log('❌ Status is เสร็จสิ้น, skipping')
          return false
        }
        
        // แสดงบิลที่มี amount แล้ว (ไม่ใช่ null, undefined, หรือ "-")
        // amount ต้องเป็นตัวเลขที่มากกว่า 0
        // ตรวจสอบว่า amount เป็น number และมากกว่า 0
        const hasAmount = bill.amount !== null && 
                         bill.amount !== undefined && 
                         typeof bill.amount === 'number' &&
                         !isNaN(bill.amount) &&
                         bill.amount > 0
        
        // แสดงบิลที่มี amount หรือ status เป็น 'รอดำเนินการ', 'เลยกำหนด', หรือ 'รอตรวจสอบ'
        const shouldShow = hasAmount || 
                          bill.status === 'รอดำเนินการ' || 
                          bill.status === 'เลยกำหนด' ||
                          bill.status === 'รอตรวจสอบ'
        
        console.log('✅ Bill passed filter:', {
          id: bill.id,
          hasAmount,
          status: bill.status,
          shouldShow
        })
        
        // แสดงบิลที่มี amount หรือ status เป็น 'รอดำเนินการ', 'เลยกำหนด', หรือ 'รอตรวจสอบ'
        return shouldShow
      })
      
      console.log('✅ Filtered bills count:', filtered.length)
      return filtered
    })

    // Current bill (บิลปัจจุบันที่ต้องดำเนินการ)
    const currentBill = computed(() => {
      return filteredBills.value.length > 0 ? filteredBills.value[0] : null
    })

    // Previous bills (บิลที่ชำระแล้ว)
    const previousBills = computed(() => {
      return bills.value
        .filter(bill => 
          bill.type === selectedType.value && 
          bill.status === 'เสร็จสิ้น' &&
          bill.paymentDate &&
          hasAmount(bill)
        )
        .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
        .slice(0, 5) // แสดงแค่ 5 รายการล่าสุด
    })

    // Helper function to check if bill has amount
    const hasAmount = (bill) => {
      return bill.amount !== null && 
             bill.amount !== undefined && 
             typeof bill.amount === 'number' &&
             !isNaN(bill.amount) &&
             bill.amount > 0
    }

    const formatDate = (date) => {
      return format(new Date(date), 'dd/MM/yyyy', { locale: th })
    }

    const formatMonth = (date) => {
      return format(new Date(date), 'MMMM yyyy', { locale: th })
    }

    const formatAmount = (amount) => {
      return amount.toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    const getBillTypeText = (type) => {
      if (type === 'water') return 'ค่าน้ำ'
      if (type === 'electricity') return 'ค่าไฟ'
      return type
    }

    const getStatusText = (bill) => {
      console.log('🔍 getStatusText called with bill:', bill)
      console.log('📊 Bill status:', bill.status)
      
      if (!bill.status) return 'รอดำเนินการ'
      
      const statusMap = {
        'รอดำเนินการ': 'รอดำเนินการ',
        'รอตรวจสอบ': 'รอตรวจสอบ',
        'เสร็จสิ้น': 'เสร็จสิ้น',
        'เลยกำหนด': 'เลยกำหนด'
      }
      
      const result = statusMap[bill.status] || bill.status
      console.log('📝 Status text result:', result)
      return result
    }

    const getStatusClass = (bill) => {
      console.log('🔍 getStatusClass called with bill:', bill)
      console.log('📊 Bill status:', bill.status)
      
      if (!bill.status) return 'status-pending'
      
      const statusClassMap = {
        'รอดำเนินการ': 'status-pending',    // สีเหลือง
        'รอตรวจสอบ': 'status-review',        // สีฟ้า
        'เสร็จสิ้น': 'status-paid',          // สีเขียว
        'เลยกำหนด': 'status-expired'         // สีแดง
      }
      
      const result = statusClassMap[bill.status] || 'status-pending'
      console.log('🎨 Status class result:', result)
      return result
    }

    const isExpired = (bill) => {
      return new Date(bill.dueDate) < new Date() && !bill.paymentDate
    }

    // ฟังก์ชันตรวจสอบว่าสามารถอัปโหลดสลิปได้หรือไม่
    const canUploadSlip = (bill) => {
      // ตรวจสอบว่า amount มีค่าและถูกต้อง (ไม่ใช่ null, undefined, "", หรือ "-")
      // amount ต้องเป็น number และมากกว่า 0
      const hasAmount = bill.amount !== null && 
                       bill.amount !== undefined && 
                       typeof bill.amount === 'number' &&
                       !isNaN(bill.amount) &&
                       bill.amount > 0
      
      console.log('🔍 canUploadSlip check:', {
        id: bill.id,
        amount: bill.amount,
        amountType: typeof bill.amount,
        hasAmount: hasAmount,
        status: bill.status
      })
      
      // อนุญาตให้อัปโหลดได้แม้ยังไม่มี amount (เพื่อให้สามารถอัปโหลดสลิปก่อนได้)
      // แต่ต้องไม่ใช่ status 'รอตรวจสอบ' หรือ 'เสร็จสิ้น'
      if (bill.status === 'รอตรวจสอบ' || bill.status === 'เสร็จสิ้น') {
        return false
      }
      
      // แสดงปุ่มเมื่อ status เป็น 'รอดำเนินการ' หรือ 'เลยกำหนด' หรือไม่มี status
      if (bill.status === 'รอดำเนินการ' || bill.status === 'เลยกำหนด' || !bill.status) {
        return true
      }
      
      return false
    }

    const triggerFileInput = (billId) => {
      const fileInput = document.querySelector(`#fileInput_${billId}`)
      if (fileInput) {
        fileInput.click()
      }
    }

    // เปลี่ยน handleFileUpload ให้แค่เก็บไฟล์ ไม่อัปโหลดทันที
    const handleFileChange = (event, bill) => {
      const file = event.target.files[0]
      if (!file) return
      selectedFiles.value[bill.id] = file
    }

    // ฟังก์ชันสำหรับอัปโหลดเมื่อกดยืนยัน
    const confirmUpload = async (bill) => {
      const file = selectedFiles.value[bill.id]
      if (!file) {
        alert('กรุณาเลือกไฟล์ก่อน')
        return
      }
      
      uploading.value = true
      
      try {
        console.log('\n=== FRONTEND UPLOAD DEBUG ===')
        console.log('File details:', {
          name: file.name,
          size: file.size,
          type: file.type
        })
        console.log('Bill details:', {
          id: bill.id,
          type: bill.type,
          amount: bill.amount
        })
        
        const formData = new FormData()
        formData.append('slip', file)
        formData.append('billId', bill.id)
        formData.append('transferDate', new Date().toISOString())
        formData.append('billType', bill.type)
        
        // ใช้ axios interceptor (validate token อัตโนมัติ)
        // แสดง FormData contents
        console.log('FormData contents:')
        for (let [key, value] of formData.entries()) {
          console.log(key, value)
        }
        
        const response = await axios.post('/api/bills/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 วินาที timeout
        })
        
        console.log('✅ Upload successful:', response.data)
        await fetchBills()
        selectedFiles.value[bill.id] = null
        alert('อัปโหลดสลิปสำเร็จ')
        
      } catch (error) {
        console.error('❌ Upload error:', error)
        console.error('Error response:', error.response?.data)
        console.error('Error status:', error.response?.status)
        
        let errorMessage = 'เกิดข้อผิดพลาดในการอัปโหลดสลิป'
        
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.response?.status === 401) {
          errorMessage = 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่'
        } else if (error.response?.status === 403) {
          errorMessage = 'ไม่มีสิทธิ์เข้าถึงบิลนี้'
        } else if (error.response?.status === 404) {
          errorMessage = 'ไม่พบบิลที่ระบุ'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        alert(errorMessage)
      } finally {
        uploading.value = false
      }
    }

    const fetchBills = async () => {
      console.log('🚀 fetchBills() called')
      try {
        // ใช้ axios interceptor (validate token อัตโนมัติ)
        console.log('📡 Calling API: /api/bills/history')
        const response = await axios.get(`/api/bills/history`)
        console.log('📥 API Response received:', {
          success: response.data?.success,
          dataLength: response.data?.data?.length,
          data: response.data
        })
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          console.log('📊 API Response - Total bills:', response.data.data.length)
          console.log('📊 API Response data:', response.data.data)
          // แปลงข้อมูลให้เหมาะกับการแสดงผล
          bills.value = response.data.data.map(bill => {
            console.log('🔍 Processing bill (raw):', {
              _id: bill._id,
              billType: bill.billType,
            amount: bill.amount,
              amountType: typeof bill.amount,
              status: bill.status,
              month: bill.month,
              year: bill.year
            })
            // แปลง amount ให้เป็นตัวเลขถ้าเป็น string ที่เป็นตัวเลข
            // หรือใช้ค่า number โดยตรงถ้าเป็น number แล้ว
            let amount = bill.amount
            if (amount === null || amount === undefined) {
              amount = null
            } else if (typeof amount === 'string') {
              // ถ้าเป็น string ให้ parse ถ้าเป็นตัวเลข
              const trimmed = amount.trim()
              if (trimmed === '' || trimmed === '-') {
                amount = null
              } else {
                const parsed = parseFloat(trimmed)
                amount = isNaN(parsed) ? null : parsed
              }
            } else if (typeof amount === 'number') {
              // ถ้าเป็น number แล้ว ใช้ค่าโดยตรง
              amount = isNaN(amount) ? null : amount
            } else {
              // กรณีอื่นๆ ให้เป็น null
              amount = null
            }
            
            console.log('💰 Amount processed:', { original: bill.amount, processed: amount, type: typeof bill.amount })
            
            const processedBill = {
            id: bill._id,
            type: bill.billType, // ใช้ billType จาก API โดยตรง (water/electricity)
            amount: amount, // ใช้ amount ที่ประมวลผลแล้ว (number หรือ null)
            billMonth: new Date(bill.year, bill.month ? bill.month-1 : 0),
            createdAt: bill.createdAt,
            dueDate: bill.dueDate || bill.contractEndDate,
            accountNumber: 'XXX-X-XXXXX-X', // ปรับตามจริงถ้ามีใน backend
            accountName: bill.shopName || localStorage.getItem('displayName') || 'มหาวิทยาลัย',
              paymentDate: bill.payment_date || null,
              status: bill.status || 'รอดำเนินการ', // เพิ่ม status
              image: bill.image || null // เพิ่ม image
            }
            
            console.log('✅ Processed bill:', {
              id: processedBill.id,
              type: processedBill.type,
              amount: processedBill.amount,
              amountType: typeof processedBill.amount,
              status: processedBill.status,
              month: bill.month,
              year: bill.year
            })
            return processedBill
          })
          console.log('✅ All processed bills:', bills.value)
          
          // ตรวจสอบว่ามีบิลที่มี amount แล้วหรือไม่
          const billsWithAmount = bills.value.filter(b => 
            b.amount !== null && 
            b.amount !== undefined && 
            typeof b.amount === 'number' && 
            !isNaN(b.amount) && 
            b.amount > 0
          )
          
          console.log('✅ Bills summary:', {
            total: bills.value.length,
            water: bills.value.filter(b => b.type === 'water').length,
            electricity: bills.value.filter(b => b.type === 'electricity').length,
            withAmount: billsWithAmount.length,
            withoutAmount: bills.value.filter(b => !b.amount || b.amount === null).length,
            statuses: bills.value.reduce((acc, b) => {
              acc[b.status || 'ไม่มี status'] = (acc[b.status || 'ไม่มี status'] || 0) + 1
              return acc
            }, {}),
            billsWithAmountByType: {
              water: billsWithAmount.filter(b => b.type === 'water').length,
              electricity: billsWithAmount.filter(b => b.type === 'electricity').length
            }
          })
          
          // ถ้า selectedType ปัจจุบันไม่มีบิลที่มี amount แล้ว แต่มีบิล type อื่นที่มี amount
          // ให้เปลี่ยน selectedType อัตโนมัติเพื่อแสดงบิลที่มี amount
          const currentTypeBillsWithAmount = billsWithAmount.filter(b => b.type === selectedType.value)
          if (currentTypeBillsWithAmount.length === 0 && billsWithAmount.length > 0) {
            const firstBillWithAmount = billsWithAmount[0]
            if (selectedType.value !== firstBillWithAmount.type) {
              console.log(`🔄 Auto-switching selectedType from '${selectedType.value}' to '${firstBillWithAmount.type}' (ไม่มีบิล ${selectedType.value} ที่มี amount แต่มีบิล ${firstBillWithAmount.type} ที่มี amount)`)
              selectedType.value = firstBillWithAmount.type
            }
          } else if (currentTypeBillsWithAmount.length > 0) {
            console.log(`✅ มีบิล ${selectedType.value} ที่มี amount แล้ว: ${currentTypeBillsWithAmount.length} รายการ`)
          }
        } else {
          console.log('⚠️ API response format invalid:', response.data)
          bills.value = []
        }
      } catch (error) {
        console.error('❌ Error fetching bills:', error)
        console.error('❌ Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        })
        bills.value = []
      }
    }

    console.log('🔄 Calling fetchBills() on component setup')
    fetchBills()

    // Realtime updates via socket
    let socketRefreshTimer = null
    let socket = null
    
    const debouncedSocketRefresh = () => {
      clearTimeout(socketRefreshTimer)
      socketRefreshTimer = setTimeout(() => {
        fetchBills()
      }, 1000) // รอ 1 วินาทีหลังจาก event สุดท้าย
    }

    onMounted(() => {
      console.log('📌 Component mounted, calling fetchBills() again')
      fetchBills() // เรียกอีกครั้งเมื่อ component mount
      
      try {
        const { $socket } = useNuxtApp()
        if ($socket) {
          socket = $socket
          // Listen for bill amount updates from admin
          $socket.on('user:bill:amountUpdated', debouncedSocketRefresh)
          // Listen for other bill updates
          $socket.on('user:bill:updated', debouncedSocketRefresh)
          $socket.on('user:bill:imageCancelled', debouncedSocketRefresh)
        }
      } catch (e) {
        console.warn('Socket connection error:', e)
      }
    })

    onUnmounted(() => {
      if (socketRefreshTimer) clearTimeout(socketRefreshTimer)
      if (socket) {
        socket.off('user:bill:amountUpdated', debouncedSocketRefresh)
        socket.off('user:bill:updated', debouncedSocketRefresh)
        socket.off('user:bill:imageCancelled', debouncedSocketRefresh)
      }
    })

    return {
      selectedType,
      filteredBills,
      currentBill,
      previousBills,
      uploading,
      formatDate,
      formatMonth,
      formatAmount,
      getBillTypeText,
      getStatusClass,
      getStatusText,
      isExpired,
      canUploadSlip,
      triggerFileInput,
      handleFileChange,
      confirmUpload,
      selectedFiles,
      hasAmount
    }
  }
}
</script>

<style scoped>
.page-container {
  padding: 2.5rem 1.5rem;
  background-color: #f9fafb;
  min-height: calc(100vh - 64px);
}

.content-wrapper {
  max-width: 48rem;
  margin: 0 auto;
}

/* Header Section */
.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.history-link {
  color: #2563eb;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.history-link:hover {
  text-decoration: underline;
}

/* Tabs */
.tabs-container {
  display: inline-flex;
  background-color: #f3f4f6;
  border-radius: 0.75rem;
  padding: 0.25rem;
  margin-bottom: 1.5rem;
}

.tab-button {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-button.active {
  background-color: #2563eb;
  color: white;
}

/* Current Bill Card */
.current-bill-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-circle {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.bill-title {
  font-weight: 500;
  color: #1f2937;
  margin: 0;
}

.bill-id {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.status-badge-new {
  font-size: 0.875rem;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-weight: 500;
}

.status-badge-new.status-pending {
  background-color: #fef3c7;
  color: #92400e;
}

.status-badge-new.status-review {
  background-color: #dbeafe;
  color: #1e40af;
}

.status-badge-new.status-paid {
  background-color: #d1fae5;
  color: #065f46;
}

.status-badge-new.status-expired {
  background-color: #fee2e2;
  color: #991b1b;
}

/* Bill Info Grid */
.bill-info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.info-label {
  color: #6b7280;
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
}

.info-value {
  font-weight: 500;
  color: #1f2937;
  margin: 0;
}

.due-date-text {
  color: #ef4444;
}

/* Waiting Section */
.waiting-section {
  border: 1px dashed #d1d5db;
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.waiting-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #6b7280;
}

.waiting-icon {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.waiting-title {
  font-weight: 500;
  color: #4b5563;
  margin: 0 0 0.125rem 0;
}

.waiting-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.check-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #d1fae5;
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
}

/* Upload Section */
.upload-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.amount-display {
  text-align: center;
}

.amount-text {
  font-size: 1.75rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.hidden-file-input {
  display: none;
}

.pay-button-active {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background-color: #2563eb;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pay-button-active:hover {
  background-color: #1d4ed8;
}

.pay-button-confirm {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background-color: #10b981;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pay-button-confirm:hover {
  background-color: #059669;
}

.pay-button-disabled {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background-color: #e5e7eb;
  color: #9ca3af;
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: not-allowed;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Previous Bill Card */
.previous-bill-card {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 1rem 1.5rem;
  margin-bottom: 0.75rem;
}

.previous-bill-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.previous-bill-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.previous-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: #d1fae5;
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.previous-bill-title {
  font-weight: 500;
  color: #1f2937;
  margin: 0;
}

.previous-bill-date {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.25rem 0 0 0;
}

.previous-bill-amount {
  text-align: right;
}

.previous-amount-text {
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.no-bills-message {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.1);
}

.no-bills-icon {
  font-size: clamp(2.2rem, 8vw, 4rem);
  color: #27ae60;
  margin-bottom: 20px;
}

.no-bills-message h3 {
  color: #2d3748;
  margin-bottom: 12px;
  font-size: 1.5rem;
}

.no-bills-message p {
  color: #718096;
  font-size: 1rem;
  margin-bottom: 24px;
}

.view-history-link {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.2);
}

.view-history-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.3);
}

/* ซ่อน Scrollbar */
::-webkit-scrollbar {
  display: none;
}

* {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* Responsive Design */
@media (max-width: 768px) {
  .page-container {
    padding: 1rem;
  }

  .header-section {
    flex-direction: column;
    gap: 16px;
    text-align: center;
    padding: 16px;
  }

  .header-actions {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }

  .header-select-type {
    width: 100%;
    max-width: 200px;
  }

  .history-button {
    width: 100%;
    max-width: 200px;
    justify-content: center;
  }

  .bill-card {
    padding: 20px;
  }

  .bill-details {
    flex-direction: column;
    gap: 20px;
  }

  .right-section {
    padding-left: 0;
    padding-top: 20px;
    border-left: none;
    border-top: 1px solid #e2e8f0;
  }

  .payment-info {
    text-align: left;
  }

  .amount {
    font-size: clamp(1.2rem, 4vw, 1.5rem);
  }

  .pay-button {
    width: 100%;
    padding: 14px 24px;
  }
}

/* Extra-small mobile: prevent slip upload button text wrapping */
@media (max-width: 640px) {
  .waiting-section,
  .upload-section {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px;
  }

  .waiting-content {
    flex: 1;
    min-width: 0;
  }

  .waiting-title,
  .waiting-subtitle {
    font-size: 12px;
    line-height: 1.4;
    color: #6b7280;
    margin: 0;
  }

  .pay-button-active,
  .pay-button-confirm,
  .pay-button-disabled {
    flex-shrink: 0;
    width: auto !important;
    min-width: 80px !important;
    max-width: 90px;
    height: 44px;
    font-size: 12px !important;
    padding: 8px 10px !important;
    white-space: nowrap;
    border-radius: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
