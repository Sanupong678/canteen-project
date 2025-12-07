<template>
  <LayoutUser>
    <div class="page-container">
      <div class="content-wrapper">
        <div class="header-section">
          <div class="header-content">
            <h1 class="page-title">ประวัติบิลค่าบริการ</h1>
            <p class="page-subtitle">รายการบิลที่ชำระเสร็จสิ้นแล้ว</p>
          </div>
          <div class="header-actions">
            <select id="paymentTypeSelect" v-model="selectedType" class="header-select-type">
              <option value="water">ค่าน้ำ</option>
              <option value="electricity">ค่าไฟ</option>
            </select>
            <router-link to="/user/bill" class="back-button">
              <i class="fas fa-arrow-left"></i>
              กลับไปหน้ารายการปัจจุบัน
            </router-link>
          </div>
        </div>

        <div class="bill-container">

          <!-- Bill List -->
          <div class="bills-list">
            <div v-if="filteredBills.length === 0" class="no-bills-message">
              <div class="no-bills-icon">
                <i class="fas fa-receipt"></i>
              </div>
              <h3>ไม่มีประวัติบิล</h3>
              <p>ยังไม่มีรายการบิลที่เสร็จสิ้นในประเภทที่เลือก</p>
            </div>
            
            <div v-for="bill in filteredBills" :key="bill.id" class="bill-card history-card">
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
                    <span class="status-badge status-completed">
                      <i class="fas fa-check-circle"></i>
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
                    
                    <!-- แสดงรูปภาพสลิปถ้ามี -->
                    <div v-if="bill.image" class="slip-image-section">
                      <button 
                        class="view-slip-button"
                        @click="viewSlip(bill)"
                      >
                        <i class="fas fa-image"></i>
                        ดูสลิปการชำระ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal สำหรับดูสลิป -->
    <div v-if="showSlipModal" class="modal-overlay" @click="closeSlipModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>สลิปการชำระ</h3>
          <button class="close-button" @click="closeSlipModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <img 
            v-if="currentSlipImage" 
            :src="currentSlipImage" 
            alt="สลิปการชำระ"
            class="slip-image"
          />
        </div>
      </div>
    </div>
  </LayoutUser>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import axios from 'axios'

export default {
  name: 'BillHistoryPage',
  setup() {
    const selectedType = ref('water')
    const bills = ref([])
    const showSlipModal = ref(false)
    const currentSlipImage = ref('')

    const filteredBills = computed(() => {
      return bills.value.filter(bill => 
        bill.type === selectedType.value && 
        bill.status === 'เสร็จสิ้น'
      )
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
      return bill.status || 'เสร็จสิ้น'
    }

    const viewSlip = async (bill) => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          alert('กรุณาเข้าสู่ระบบใหม่')
          return
        }

        const response = await axios.get(`/api/bills/image/${bill.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        })

        const imageUrl = URL.createObjectURL(response.data)
        currentSlipImage.value = imageUrl
        showSlipModal.value = true
      } catch (error) {
        console.error('Error loading slip image:', error)
        alert('ไม่สามารถโหลดรูปภาพสลิปได้')
      }
    }

    const closeSlipModal = () => {
      showSlipModal.value = false
      if (currentSlipImage.value) {
        URL.revokeObjectURL(currentSlipImage.value)
        currentSlipImage.value = ''
      }
    }

    const fetchBills = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          bills.value = []
          return
        }

        const response = await axios.get(`/api/bills/history`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          bills.value = response.data.data.map(bill => ({
            id: bill._id,
            type: bill.billType,
            amount: bill.amount,
            billMonth: new Date(bill.year, bill.month ? bill.month-1 : 0),
            createdAt: bill.createdAt,
            dueDate: bill.dueDate || bill.contractEndDate,
            accountNumber: 'XXX-X-XXXXX-X',
            accountName: bill.shopName || localStorage.getItem('displayName') || 'มหาวิทยาลัย',
            paymentDate: bill.payment_date || null,
            status: bill.status || 'รอดำเนินการ',
            image: bill.image || null
          }))
        } else {
          bills.value = []
        }
      } catch (error) {
        console.error('Error fetching bills:', error)
        bills.value = []
      }
    }

    onMounted(() => {
      fetchBills()
    })

    return {
      selectedType,
      filteredBills,
      formatDate,
      formatMonth,
      formatAmount,
      getBillTypeText,
      getStatusText,
      viewSlip,
      showSlipModal,
      currentSlipImage,
      closeSlipModal
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
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(39, 174, 96, 0.15);
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
  background: #27ae60;
  color: white;
}

.back-button {
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

.back-button:hover {
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
  box-shadow: 0 4px 20px rgba(39, 174, 96, 0.1);
  transition: all 0.3s ease;
  border-left: 4px solid #27ae60;
}

.history-card {
  border-left-color: #27ae60;
  background: linear-gradient(135deg, #ffffff 0%, #f8fff9 100%);
}

.bill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(39, 174, 96, 0.15);
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
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 14px;
  min-width: 120px;
  text-align: center;
  transition: all 0.3s ease;
}

.status-completed {
  background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);
  color: #065F46;
}

.payment-info {
  text-align: right;
}

.amount {
  font-size: 28px;
  color: #27ae60;
  margin-bottom: 20px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(39, 174, 96, 0.1);
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

.slip-image-section {
  margin-top: 16px;
}

.view-slip-button {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-slip-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.3);
}

.no-bills-message {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(39, 174, 96, 0.1);
}

.no-bills-icon {
  font-size: 4rem;
  color: #bdc3c7;
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
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #718096;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: #e2e8f0;
  color: #2d3748;
}

.modal-body {
  padding: 24px;
  text-align: center;
}

.slip-image {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
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

  .back-button {
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

  .view-slip-button {
    width: 100%;
    justify-content: center;
  }
}
</style>
