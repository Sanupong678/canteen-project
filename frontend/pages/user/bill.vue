<template>
  <LayoutUser>
    <div class="page-container">
      <div class="content-wrapper">
        <div class="header-section">
          <div class="header-content">
            <h1 class="page-title">บิลค่าบริการ</h1>
            <p class="page-subtitle">รายการบิลที่ต้องดำเนินการ</p>
          </div>
          <div class="header-actions">
            <select id="paymentTypeSelect" v-model="selectedType" class="header-select-type">
              <option value="water">ค่าน้ำ</option>
              <option value="electricity">ค่าไฟ</option>
            </select>
            <router-link to="/user/bill-history" class="history-button">
              <i class="fas fa-history"></i>
              ดูประวัติ
            </router-link>
          </div>
        </div>

        <div class="bill-container">

          <!-- Bill List -->
          <div class="bills-list">
            <div v-if="filteredBills.length === 0" class="no-bills-message">
              <div class="no-bills-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <h3>ไม่มีรายการที่ต้องดำเนินการ</h3>
              <p>ยอดเยี่ยม! คุณได้ชำระบิลทั้งหมดแล้ว</p>
              <router-link to="/user/bill-history" class="view-history-link">
                <i class="fas fa-history"></i>
                ดูประวัติการชำระ
              </router-link>
            </div>
            
            <div v-for="bill in filteredBills" :key="bill.id" class="bill-card">
              <div class="bill-details">
                <div class="left-section">
                  <div class="bill-period">
                    <h3>{{ getBillTypeText(bill.type) }}ประจำเดือน {{ formatMonth(bill.billMonth) }}</h3>
                    <p class="date">วันที่ {{ formatDate(bill.createdAt) }}</p>
                  </div>

                  <div class="due-date">
                    <p>วันครบกำหนดชำระ: {{ formatDate(bill.dueDate) }}</p>
                    <p v-if="bill.paymentDate">วันที่ชำระ: {{ formatDate(bill.paymentDate) }}</p>
                  </div>

                  <div class="status-section">
                    <span :class="['status-badge', getStatusClass(bill)]">
                      {{ getStatusText(bill) }}
                    </span>
                  </div>
                </div>

                <div class="right-section">
                  <div class="payment-info">
                    <h3 v-if="bill.amount !== null && bill.amount !== undefined && typeof bill.amount === 'number' && !isNaN(bill.amount) && bill.amount > 0" class="amount">฿{{ formatAmount(bill.amount) }}</h3>
                    <h3 v-else class="amount amount-pending">รอการกำหนดจำนวนเงิน</h3>
                    <div class="account-info">
                      <p>เลขบัญชี: {{ bill.accountNumber }}</p>
                      <p>ชื่อบัญชี: {{ bill.accountName }}</p>
                    </div>
                    <input
                      type="file"
                      :id="'fileInput_' + bill.id"
                      :ref="'fileInput_' + bill.id"
                      accept="image/*"
                      class="hidden-file-input"
                      @change="handleFileChange($event, bill)"
                    />
                    <button
                      v-if="canUploadSlip(bill)"
                      class="pay-button"
                      :style="bill.image ? 'background: #bdbdbd; cursor: not-allowed;' : ''"
                      :disabled="!!bill.image"
                      @click="triggerFileInput(bill.id)"
                    >
                      อัปโหลดสลิป
                    </button>
                    <div v-else-if="!bill.amount || bill.amount === null || bill.amount === undefined || typeof bill.amount !== 'number' || isNaN(bill.amount) || bill.amount <= 0" class="waiting-message">
                      <p>รอการกำหนดจำนวนเงินจากผู้ดูแลระบบ</p>
                    </div>
                    <!-- ปุ่มยืนยันอัปโหลด -->
                    <button
                      v-if="selectedFiles[bill.id]"
                      class="pay-button"
                      style="margin-top: 8px; background: #27ae60;"
                      @click="confirmUpload(bill)"
                    >
                      ยืนยันอัปโหลด
                    </button>
                  </div>
                </div>
              </div>
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
        
        const shouldShow = hasAmount || bill.status === 'รอดำเนินการ' || bill.status === 'เลยกำหนด'
        
        console.log('✅ Bill passed filter:', {
          id: bill.id,
          hasAmount,
          status: bill.status,
          shouldShow
        })
        
        // แสดงบิลที่มี amount หรือ status เป็น 'รอดำเนินการ' หรือ 'เลยกำหนด'
        return shouldShow
      })
      
      console.log('✅ Filtered bills count:', filtered.length)
      return filtered
    })

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
      
      // ไม่แสดงปุ่มเมื่อยังไม่มี amount (รอ admin อัปโหลด Excel)
      if (!hasAmount) {
        return false
      }
      
      // แสดงปุ่มเมื่อ status เป็น 'รอดำเนินการ' หรือ 'เลยกำหนด'
      if (bill.status === 'รอดำเนินการ' || bill.status === 'เลยกำหนด') {
        return true
      }
      
      // ซ่อนปุ่มเมื่อ status เป็น 'รอตรวจสอบ' หรือ 'เสร็จสิ้น'
      if (bill.status === 'รอตรวจสอบ' || bill.status === 'เสร็จสิ้น') {
        return false
      }
      
      // กรณีไม่มี status แต่มี amount ให้แสดงปุ่ม (เพื่อให้สามารถอัปโหลดสลิปได้)
      if (!bill.status && hasAmount) {
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
        
        // ตรวจสอบ token จากทั้ง localStorage และ sessionStorage
        let token = localStorage.getItem('token')
        if (!token) {
          token = sessionStorage.getItem('token')
        }
        console.log('Token status:', token ? 'Present' : 'Missing')
        
        // ตรวจสอบ token
        if (!token) {
          throw new Error('ไม่พบ token กรุณาเข้าสู่ระบบใหม่')
        }
        
        // แสดง FormData contents
        console.log('FormData contents:')
        for (let [key, value] of formData.entries()) {
          console.log(key, value)
        }
        
        const response = await axios.post('/api/bills/upload', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
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
        // ตรวจสอบ token จากทั้ง localStorage และ sessionStorage
        let token = localStorage.getItem('token')
        if (!token) {
          token = sessionStorage.getItem('token')
          console.log('🔑 Token from sessionStorage:', token ? 'Present' : 'Missing')
        } else {
          console.log('🔑 Token from localStorage:', 'Present')
        }
        
        if (!token) {
          console.log('❌ No token found in localStorage or sessionStorage')
          bills.value = []
          return
        }
        console.log('📡 Calling API: /api/bills/history')
        // เรียก API backend พร้อมแนบ token
        const response = await axios.get(`/api/bills/history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
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
      selectedFiles
    }
  }
}
</script>

<style scoped>
.page-container {
  padding: 2rem;
  background-color: #f0f2f5;
  min-height: calc(100vh - 64px);
  overflow: hidden;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  overflow: hidden;
}

.header-section {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.15);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.page-subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-select-type {
  padding: 12px 20px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  min-width: 150px;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  transition: all 0.3s ease;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.header-select-type:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}

.header-select-type option {
  background: #c0392b;
  color: white;
}

.history-button {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  text-decoration: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(10px);
}

.history-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.bill-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

.bills-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.bill-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #e74c3c;
}

.bill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(231, 76, 60, 0.15);
}

.bill-details {
  display: flex;
  justify-content: space-between;
  gap: 30px;
}

.left-section {
  flex: 2;
}

.right-section {
  flex: 1;
  padding-left: 30px;
  border-left: 1px solid #e2e8f0;
}

.bill-period h3 {
  font-size: 20px;
  color: #2d3748;
  margin-bottom: 8px;
  font-weight: 700;
}

.date {
  color: #718096;
  font-size: 14px;
  font-weight: 500;
}

.due-date {
  margin: 20px 0;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
}

.due-date p {
  margin: 4px 0;
}

.status-badge {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 14px;
  min-width: 120px;
  text-align: center;
  transition: all 0.3s ease;
}

.status-pending {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  color: #92400E;
}

.status-paid {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  color: #065F46;
}

.status-expired {
  background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);
  color: #991B1B;
}

.status-review {
  background: linear-gradient(135deg, #BEE3F8 0%, #90CDF4 100%);
  color: #2B6CB0;
}

.payment-info {
  text-align: right;
}

.amount {
  font-size: 28px;
  color: #e74c3c;
  margin-bottom: 20px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(231, 76, 60, 0.1);
}

.amount-pending {
  color: #f39c12;
  font-size: 20px;
  font-weight: 600;
}

.account-info {
  color: #4a5568;
  margin-bottom: 24px;
  font-size: 14px;
  font-weight: 500;
}

.account-info p {
  margin: 4px 0;
}

.hidden-file-input {
  display: none;
}

.pay-button {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.2);
  min-width: 140px;
}

.pay-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.3);
}

.pay-button:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.waiting-message {
  background: linear-gradient(135deg, #FFF3CD 0%, #FEF3C7 100%);
  border: 1px solid #FDE68A;
  border-radius: 8px;
  padding: 12px 16px;
  text-align: center;
  margin-top: 8px;
}

.waiting-message p {
  color: #92400E;
  font-weight: 600;
  font-size: 14px;
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
  font-size: 4rem;
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
    font-size: 24px;
  }

  .pay-button {
    width: 100%;
    padding: 14px 24px;
  }
}
</style>
