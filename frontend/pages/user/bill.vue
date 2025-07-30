<template>
  <LayoutUser>
    <div class="page-container">
      <div class="content-wrapper">
        <div class="header-section">
          <h1 class="page-title">บิลค่าบริการ</h1>
        </div>

        <div class="bill-container">
          <!-- Payment Type Buttons -->
          <div class="payment-type-dropdown">
            <select id="paymentTypeSelect" v-model="selectedType" class="select-type">
              <option value="water">ค่าน้ำ</option>
              <option value="electricity">ค่าไฟ</option>
            </select>
            <label for="paymentTypeSelect" class="re-only">เลือกประเภท</label>
          </div>

          <!-- Bill List -->
          <div class="bills-list">
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
                    <h3 class="amount">฿{{ formatAmount(bill.amount) }}</h3>
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
import { ref, computed } from 'vue'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import axios from 'axios'

export default {
  name: 'BillPage',
  setup() {
    const selectedType = ref('water')
    const bills = ref([])
    const uploading = ref(false)
    // เพิ่ม state สำหรับไฟล์ที่เลือกต่อ bill
    const selectedFiles = ref({})

    const filteredBills = computed(() => {
      return bills.value.filter(bill => bill.type === selectedType.value)
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
      return type === 'water' ? 'ค่าน้ำ' : 'ค่าไฟ'
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
      // แสดงปุ่มเมื่อ status เป็น 'รอดำเนินการ' หรือ 'เลยกำหนด'
      if (bill.status === 'รอดำเนินการ' || bill.status === 'เลยกำหนด') {
        return true
      }
      
      // ซ่อนปุ่มเมื่อ status เป็น 'รอตรวจสอบ' หรือ 'เสร็จสิ้น'
      if (bill.status === 'รอตรวจสอบ' || bill.status === 'เสร็จสิ้น') {
        return false
      }
      
      // กรณีไม่มี status ให้แสดงปุ่ม
      if (!bill.status) {
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
        
        const token = localStorage.getItem('token')
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
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          bills.value = []
          return
        }
        // เรียก API backend พร้อมแนบ token
        const response = await axios.get(`/api/bills/history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          console.log('📊 API Response:', response.data.data)
          // แปลงข้อมูลให้เหมาะกับการแสดงผล
          bills.value = response.data.data.map(bill => {
            console.log('🔍 Processing bill:', bill)
            return {
            id: bill._id,
            type: bill.billType,
            amount: bill.amount,
            billMonth: new Date(bill.year, bill.month ? bill.month-1 : 0),
            createdAt: bill.createdAt,
            dueDate: bill.dueDate || bill.contractEndDate,
            accountNumber: 'XXX-X-XXXXX-X', // ปรับตามจริงถ้ามีใน backend
            accountName: bill.shopName || localStorage.getItem('displayName') || 'มหาวิทยาลัย',
              paymentDate: bill.payment_date || null,
              status: bill.status || 'รอดำเนินการ', // เพิ่ม status
              image: bill.image || null // เพิ่ม image
            }
          })
          console.log('✅ Processed bills:', bills.value)
        } else {
          bills.value = []
        }
      } catch (error) {
        console.error('Error fetching bills:', error)
        bills.value = []
      }
    }

    fetchBills()

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
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.bill-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0;
}

.payment-type-dropdown {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.select-type {
  padding: 12px 24px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  min-width: 200px;
  cursor: pointer;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
}

.select-type:focus {
  outline: none;
  border-color: #e74c3c;
  box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
}

.select-label {
  font-size: 14px;
  color: #4a5568;
  font-weight: 600;
  user-select: none;
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
    padding: 16px;
  }

  .payment-type-dropdown {
    padding: 16px;
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
