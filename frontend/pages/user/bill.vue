<template>
  <LayoutUser>
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
                <input type="file" :ref="'fileInput_' + bill.id" accept="image/*" class="hidden-file-input"
                  @change="handleFileUpload($event, bill)" />
                <button v-if="!bill.paymentDate && !isExpired(bill)" class="pay-button"
                  @click="triggerFileInput(bill.id)">
                  อัปโหลดสลิป
                </button>
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

export default {
  name: 'BillPage',
  setup() {
    const selectedType = ref('water')
    const bills = ref([])
    const uploading = ref(false)

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

    const getStatusClass = (bill) => {
      if (bill.paymentDate) return 'status-paid'
      if (isExpired(bill)) return 'status-expired'
      return 'status-pending'
    }

    const getStatusText = (bill) => {
      if (bill.paymentDate) return 'ชำระแล้ว'
      if (isExpired(bill)) return 'เลยกำหนดชำระ'
      return 'รอชำระเงิน'
    }

    const isExpired = (bill) => {
      return new Date(bill.dueDate) < new Date() && !bill.paymentDate
    }

    const triggerFileInput = (billId) => {
      const fileInput = document.querySelector(`#fileInput_${billId}`)
      if (fileInput) {
        fileInput.click()
      }
    }

    const handleFileUpload = async (event, bill) => {
      const file = event.target.files[0]
      if (!file) return

      uploading.value = true
      try {
        const formData = new FormData()
        formData.append('slip', file)
        formData.append('billId', bill.id)
        formData.append('transferDate', new Date().toISOString())

        // TODO: Implement API call
        // await axios.post('/api/bills/upload-slip', formData)

        await fetchBills()
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการอัปโหลดสลิป')
      } finally {
        uploading.value = false
      }
    }

    const fetchBills = async () => {
      try {
        // TODO: Replace with real API
        bills.value = [
          {
            id: 1,
            type: 'water',
            amount: 1571.21,
            billMonth: new Date(),
            createdAt: new Date(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            accountNumber: 'XXX-X-XXXXX-X',
            accountName: 'มหาวิทยาลัย',
            paymentDate: null
          },
          {
            id: 2,
            type: 'electricity',
            amount: 942.75,
            billMonth: new Date(),
            createdAt: new Date(),
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            accountNumber: 'YYY-Y-YYYYY-Y',
            accountName: 'มหาวิทยาลัย',
            paymentDate: null
          }
        ]
      } catch (error) {
        console.error('Error fetching bills:', error)
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
      triggerFileInput,
      handleFileUpload
    }
  }
}
</script>

<style scoped>
.bill-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.payment-type-dropdown {

  display: flex;
  flex-direction: column; /* ทำให้ label อยู่ใต้ select */
  align-items: center;
  gap: 6px; /* ช่องว่างระหว่าง select กับ label */
  margin-bottom: 30px;
}


.select-type {
  padding: 10px 20px;
  font-size: 16px;
  border-radius: 8px;
  border: 1px solid #ccc;
  min-width: 150px;
  cursor: pointer;
}

.select-label {
  font-size: 14px;
  color: #666;
  user-select: none; /* ป้องกันเลือกข้อความโดยไม่ตั้งใจ */
}

.bills-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.bill-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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
}

.bill-period h3 {
  font-size: 18px;
  color: #333;
  margin-bottom: 8px;
}

.date {
  color: #666;
  font-size: 14px;
}

.due-date {
  margin: 15px 0;
  color: #666;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 14px;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-paid {
  background-color: #d4edda;
  color: #155724;
}

.status-expired {
  background-color: #f8d7da;
  color: #721c24;
}

.payment-info {
  text-align: right;
}

.amount {
  font-size: 24px;
  color: #1976d2;
  margin-bottom: 15px;
}

.account-info {
  color: #666;
  margin-bottom: 20px;
}

.hidden-file-input {
  display: none;
}

.pay-button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.pay-button:hover {
  background-color: #388e3c;
}

@media (max-width: 768px) {
  .bill-details {
    flex-direction: column;
  }

  .right-section {
    padding-left: 0;
    padding-top: 20px;
  }

  .payment-info {
    text-align: left;
  }
}
</style>
