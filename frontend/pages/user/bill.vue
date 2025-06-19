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
