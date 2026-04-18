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
          <GuidePopup
            storage-key="user-bill-guide"
            title="คู่มือหน้าบิลค่าบริการ"
            intro="ทำตามขั้นตอนนี้เพื่อชำระบิลและอัปโหลดสลิปได้ถูกต้อง"
            :steps="billGuideSteps"
          />
          <router-link to="/user/bill-history" class="history-link">
            ดูประวัติทั้งหมด →
          </router-link>
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
                <p class="bill-title">บิลรวมค่าน้ำและค่าไฟ ประจำเดือน {{ formatMonth(currentBill.billMonth) }}</p>
                <p class="bill-id">เดือนปัจจุบัน {{ formatMonth(currentBill.billMonth) }}</p>
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
              <p class="info-value">{{ paymentSettings.accountNumber }}</p>
            </div>
            <div class="info-item">
              <p class="info-label">วันครบกำหนด</p>
              <p class="info-value due-date-text">{{ formatDate(currentBill.dueDate) }}</p>
            </div>
            <div class="info-item">
              <p class="info-label">ธนาคาร</p>
              <p class="info-value">{{ paymentSettings.bankName }}</p>
            </div>
            <div class="info-item">
              <p class="info-label">ค่าน้ำ</p>
              <p class="info-value">฿{{ formatAmount(currentBill.waterAmount || 0) }}</p>
            </div>
            <div class="info-item">
              <p class="info-label">ค่าไฟ</p>
              <p class="info-value">฿{{ formatAmount(currentBill.electricityAmount || 0) }}</p>
            </div>
            <div class="info-item info-item--full">
              <p class="info-label">ยอดรวมทั้งหมด</p>
              <p class="info-value info-value--total">฿{{ formatAmount(currentBill.totalAmount || 0) }}</p>
            </div>
          </div>
          <div class="qr-action-row">
            <button
              class="show-qr-button"
              @click="showQrDialog = true"
            >
              แสดง QR Code
            </button>
          </div>

          <!-- Waiting Section or Upload Section -->
          <div v-if="!hasAmount(currentBill)" class="waiting-section">
            <div class="waiting-content">
              <div class="waiting-icon">
                <v-progress-circular
                  v-if="!currentBill.hasAnyImage && currentBill.status !== 'รอตรวจสอบ'"
                  indeterminate
                  color="primary"
                  size="24"
                  width="3"
                ></v-progress-circular>
                <div v-else class="check-icon">✓</div>
              </div>
              <div>
                <p class="waiting-title">
                  <span v-if="!currentBill.hasAnyImage && currentBill.status !== 'รอตรวจสอบ'">รอการอัปโหลดสลิปการโอนเงิน</span>
                  <span v-else>อัปโหลดสลิปสำเร็จ</span>
                </p>
                <p class="waiting-subtitle">
                  <span v-if="!currentBill.hasAnyImage && currentBill.status !== 'รอตรวจสอบ'">รอการคำนวณจากผู้ดูแลระบบ</span>
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
              v-if="!selectedFiles[currentBill.id] && !currentBill.hasAnyImage && currentBill.status !== 'รอตรวจสอบ'"
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
              v-else-if="currentBill.hasAnyImage || currentBill.status === 'รอตรวจสอบ'"
              class="pay-button-disabled"
              disabled
            >
              รอตรวจสอบ
            </button>
          </div>
          <div v-else class="upload-section">
            <div class="amount-display">
              <h3 class="amount-text">฿{{ formatAmount(currentBill.totalAmount || 0) }}</h3>
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
              v-if="canUploadSlip(currentBill) && !currentBill.hasAnyImage && !selectedFiles[currentBill.id]"
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
              v-else-if="currentBill.hasAnyImage || currentBill.status === 'รอตรวจสอบ'"
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
                <p class="previous-bill-title">บิลรวมค่าน้ำและค่าไฟ ประจำเดือน {{ formatMonth(bill.billMonth) }}</p>
                <p class="previous-bill-date">ชำระแล้วเมื่อ {{ formatDate(bill.paymentDate) }}</p>
              </div>
            </div>
            <div class="previous-bill-amount">
              <p class="previous-amount-text">฿{{ formatAmount(bill.totalAmount || 0) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showQrDialog" class="qr-dialog-overlay" @click.self="showQrDialog = false">
      <div class="qr-dialog-card">
        <div class="qr-dialog-header">
          <h3 class="qr-dialog-title">QR Code สำหรับชำระเงิน</h3>
          <p class="qr-dialog-description">สแกนเพื่อโอนเงินและอัปโหลดสลิปในหน้านี้ได้ทันที</p>
        </div>
        <div
          v-if="paymentSettings.qrItems && paymentSettings.qrItems.length > 1"
          class="qr-title-list"
        >
          <button
            v-for="item in paymentSettings.qrItems"
            :key="item._id"
            class="qr-title-chip"
            :class="{ 'qr-title-chip--active': selectedQrItemId === item._id }"
            @click="selectedQrItemId = item._id"
          >
            {{ item.title }}
          </button>
        </div>
        <div class="qr-dialog-summary" v-if="currentBill">
          <div class="qr-summary-item">
            <span class="qr-summary-label">ยอดที่ต้องโอน</span>
            <span class="qr-summary-value qr-summary-value--amount">฿{{ formatAmount(currentBill.totalAmount || 0) }}</span>
          </div>
          <div class="qr-summary-item">
            <span class="qr-summary-label">ธนาคาร</span>
            <span class="qr-summary-value">{{ paymentSettings.bankName || '-' }}</span>
          </div>
          <div class="qr-summary-item">
            <span class="qr-summary-label">เลขบัญชี</span>
            <span class="qr-summary-value">{{ paymentSettings.accountNumber || '-' }}</span>
          </div>
        </div>
        <h4 v-if="activeQrItem" class="qr-dialog-subtitle">{{ activeQrItem.title }}</h4>
        <div class="qr-dialog-image-wrap" v-if="activeQrImageUrl">
          <img
            :src="activeQrImageUrl"
            alt="Payment QR Code"
            class="qr-dialog-image"
          />
        </div>
        <p class="qr-dialog-empty" v-else>ยังไม่มี QR Code จากผู้ดูแลระบบ</p>
        <p class="qr-dialog-tip">หลังโอนเงินเรียบร้อย กรุณาอัปโหลดสลิปเพื่อรอตรวจสอบ</p>
        <div class="qr-dialog-actions">
          <a
            v-if="activeQrImageUrl"
            :href="activeQrImageUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="qr-dialog-open-image"
          >
            เปิดรูป QR เต็มจอ
          </a>
          <button class="qr-dialog-close" @click="showQrDialog = false">ปิด</button>
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
import GuidePopup from '@/components/user/GuidePopup.vue'

export default {
  name: 'BillPage',
  components: {
    GuidePopup
  },
  setup() {
    const bills = ref([])
    const uploading = ref(false)
    // เพิ่ม state สำหรับไฟล์ที่เลือกต่อ bill
    const selectedFiles = ref({})
    const paymentSettings = ref({
      accountNumber: '6720407581',
      bankName: 'ธนาคารกรุงเทพ',
      qrItems: []
    })
    const showQrDialog = ref(false)
    const selectedQrItemId = ref('')
    const billGuideSteps = [
      'ตรวจสอบยอดค่าน้ำ ค่าไฟ และวันครบกำหนดก่อนชำระเงิน',
      'กดปุ่ม "แสดง QR Code" แล้วโอนเงินให้ตรงยอดรวม',
      'หลังโอนเสร็จให้แนบสลิปด้วยปุ่ม "แจ้งชำระเงิน" หรือ "อัปโหลดสลิป"',
      'หากอัปโหลดแล้ว สถานะจะเป็น "รอตรวจสอบ" จนผู้ดูแลระบบอนุมัติ',
      'ตรวจสอบบิลเก่าย้อนหลังได้ที่ปุ่ม "ดูประวัติทั้งหมด"'
    ]

    const activeQrItem = computed(() => {
      const items = Array.isArray(paymentSettings.value.qrItems) ? paymentSettings.value.qrItems : []
      if (!items.length) return null
      if (!selectedQrItemId.value) return items[0]
      return items.find((item) => item._id === selectedQrItemId.value) || items[0]
    })

    const activeQrImageUrl = computed(() => {
      const imagePath = activeQrItem.value?.imagePath || ''
      if (!imagePath) return ''
      if (/^https?:\/\//i.test(imagePath)) {
        return imagePath
      }
      const baseURL = axios.defaults.baseURL || (process.client ? window.location.origin : '')
      const normalizedPath = imagePath.startsWith('/')
        ? imagePath
        : `/${imagePath}`
      return `${baseURL}${normalizedPath}`
    })

    const filteredBills = computed(() => {
      const groupedMap = new Map()

      bills.value.forEach((bill) => {
        const monthDate = bill.billMonth ? new Date(bill.billMonth) : null
        if (!monthDate || Number.isNaN(monthDate.getTime())) return
        const key = `${monthDate.getFullYear()}-${monthDate.getMonth()}`

        if (!groupedMap.has(key)) {
          groupedMap.set(key, {
            id: key,
            billMonth: monthDate,
            createdAt: bill.createdAt,
            dueDate: bill.dueDate,
            waterAmount: 0,
            electricityAmount: 0,
            totalAmount: 0,
            waterBillId: null,
            electricityBillId: null,
            waterStatus: null,
            electricityStatus: null,
            waterImage: null,
            electricityImage: null,
            paymentDate: null,
            status: 'รอดำเนินการ',
            uploadBillId: null,
            uploadBillType: null,
            hasAnyImage: false
          })
        }

        const group = groupedMap.get(key)
        const billAmount = typeof bill.amount === 'number' && !isNaN(bill.amount) ? bill.amount : 0

        if (bill.type === 'water') {
          group.waterAmount = billAmount
          group.waterBillId = bill.id
          group.waterStatus = bill.status || null
          group.waterImage = bill.image || null
        } else if (bill.type === 'electricity') {
          group.electricityAmount = billAmount
          group.electricityBillId = bill.id
          group.electricityStatus = bill.status || null
          group.electricityImage = bill.image || null
        }

        group.totalAmount = (group.waterAmount || 0) + (group.electricityAmount || 0)
        group.hasAnyImage = Boolean(group.waterImage || group.electricityImage)

        const statuses = [group.waterStatus, group.electricityStatus].filter(Boolean)
        if (statuses.includes('เลยกำหนด')) {
          group.status = 'เลยกำหนด'
        } else if (statuses.every(s => s === 'เสร็จสิ้น') && statuses.length > 0) {
          group.status = 'เสร็จสิ้น'
        } else if (statuses.includes('รอตรวจสอบ')) {
          group.status = 'รอตรวจสอบ'
        } else {
          group.status = 'รอดำเนินการ'
        }

        const uploadElectricity = group.electricityBillId && group.electricityStatus !== 'เสร็จสิ้น' ? {
          id: group.electricityBillId,
          type: 'electricity'
        } : null
        const uploadWater = group.waterBillId && group.waterStatus !== 'เสร็จสิ้น' ? {
          id: group.waterBillId,
          type: 'water'
        } : null
        const uploadTarget = uploadElectricity || uploadWater
        group.uploadBillId = uploadTarget?.id || null
        group.uploadBillType = uploadTarget?.type || null

        if (bill.paymentDate && (!group.paymentDate || new Date(bill.paymentDate) > new Date(group.paymentDate))) {
          group.paymentDate = bill.paymentDate
        }
      })

      return Array.from(groupedMap.values()).sort((a, b) => new Date(b.billMonth) - new Date(a.billMonth))
    })

    // Current bill (ต้องเป็นเดือนปัจจุบันก่อน)
    const currentBill = computed(() => {
      if (!filteredBills.value.length) return null
      const now = new Date()
      const currentMonthBill = filteredBills.value.find((bill) => {
        const date = new Date(bill.billMonth)
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
      })
      return currentMonthBill || filteredBills.value[0]
    })

    // Previous bills (บิลที่ชำระแล้ว)
    const previousBills = computed(() => {
      return filteredBills.value
        .filter(bill => bill.status === 'เสร็จสิ้น')
        .sort((a, b) => new Date(b.paymentDate || b.billMonth) - new Date(a.paymentDate || a.billMonth))
        .slice(0, 5)
    })

    // Helper function to check if bill has amount
    const hasAmount = (bill) => {
      return bill.totalAmount !== null &&
             bill.totalAmount !== undefined &&
             typeof bill.totalAmount === 'number' &&
             !isNaN(bill.totalAmount) &&
             bill.totalAmount > 0
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
      const hasAmount = bill.totalAmount !== null &&
                        bill.totalAmount !== undefined &&
                        typeof bill.totalAmount === 'number' &&
                        !isNaN(bill.totalAmount) &&
                        bill.totalAmount > 0
      
      console.log('🔍 canUploadSlip check:', {
        id: bill.id,
        amount: bill.totalAmount,
        amountType: typeof bill.totalAmount,
        hasAmount: hasAmount,
        status: bill.status,
        uploadBillId: bill.uploadBillId,
        uploadBillType: bill.uploadBillType
      })
      
      // อนุญาตให้อัปโหลดได้แม้ยังไม่มี amount (เพื่อให้สามารถอัปโหลดสลิปก่อนได้)
      // แต่ต้องไม่ใช่ status 'รอตรวจสอบ' หรือ 'เสร็จสิ้น'
      if (bill.status === 'รอตรวจสอบ' || bill.status === 'เสร็จสิ้น' || !bill.uploadBillId) {
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
          uploadBillId: bill.uploadBillId,
          uploadBillType: bill.uploadBillType,
          amount: bill.totalAmount
        })
        
        const formData = new FormData()
        formData.append('slip', file)
        formData.append('billId', bill.uploadBillId)
        formData.append('transferDate', new Date().toISOString())
        formData.append('billType', bill.uploadBillType)
        
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
          
          console.log('✅ grouped bills ready for combined display')
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

    const fetchPaymentSettings = async () => {
      try {
        const response = await axios.get('/api/payment-settings')
        if (response.data?.success && response.data.data) {
          paymentSettings.value = {
            accountNumber: response.data.data.accountNumber || '6720407581',
            bankName: response.data.data.bankName || 'ธนาคารกรุงเทพ',
            qrItems: Array.isArray(response.data.data.qrItems) ? response.data.data.qrItems : []
          }
          selectedQrItemId.value = paymentSettings.value.qrItems[0]?._id || ''
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error)
      }
    }

    console.log('🔄 Calling fetchBills() on component setup')
    fetchBills()
    fetchPaymentSettings()

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
      fetchPaymentSettings()
      
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
      filteredBills,
      currentBill,
      previousBills,
      uploading,
      formatDate,
      formatMonth,
      formatAmount,
      getStatusClass,
      getStatusText,
      isExpired,
      canUploadSlip,
      triggerFileInput,
      handleFileChange,
      confirmUpload,
      selectedFiles,
      hasAmount,
      paymentSettings,
      showQrDialog,
      selectedQrItemId,
      billGuideSteps,
      activeQrItem,
      activeQrImageUrl
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  width: 100%;
}

.header-content {
  flex: none;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  font-size: 0.8125rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
  padding: 0.35rem 0.75rem;
  border-radius: 0.375rem;
}

.history-link:hover {
  text-decoration: underline;
  background-color: #eff6ff;
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

.info-item--full {
  grid-column: 1 / -1;
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

.info-value--total {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}

.due-date-text {
  color: #ef4444;
}

.qr-action-row {
  margin-bottom: 1rem;
  display: flex;
  justify-content: flex-start;
}

.show-qr-button {
  padding: 0.45rem 0.85rem;
  border-radius: 0.5rem;
  border: 1px solid #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 38px;
}

.show-qr-button:hover:not(:disabled) {
  background: #dbeafe;
}

.show-qr-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

.qr-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.qr-dialog-card {
  width: min(420px, 94vw);
  background: #fff;
  border-radius: 16px;
  padding: 18px;
  text-align: center;
  box-shadow: 0 16px 40px rgba(17, 24, 39, 0.22);
}

.qr-dialog-header {
  margin-bottom: 12px;
}

.qr-dialog-title {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
  font-weight: 700;
}

.qr-dialog-description {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 0.84rem;
}

.qr-title-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-bottom: 10px;
}

.qr-title-chip {
  border: 1px solid #dbe4ff;
  background: #f8faff;
  color: #1f3b88;
  border-radius: 999px;
  font-size: 0.77rem;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.qr-title-chip--active {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
}

.qr-dialog-summary {
  display: grid;
  gap: 8px;
  text-align: left;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 12px;
}

.qr-summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.qr-summary-label {
  color: #6b7280;
  font-size: 0.8rem;
}

.qr-summary-value {
  color: #111827;
  font-size: 0.86rem;
  font-weight: 600;
}

.qr-summary-value--amount {
  color: #dc2626;
  font-size: 0.96rem;
}

.qr-dialog-subtitle {
  margin: 0 0 8px;
  font-size: 0.82rem;
  color: #4b5563;
  font-weight: 600;
}

.qr-dialog-image-wrap {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f9fafb 100%);
  padding: 10px;
}

.qr-dialog-image {
  width: min(300px, 72vw);
  height: min(300px, 72vw);
  object-fit: contain;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  padding: 8px;
  background: #fff;
}

.qr-dialog-empty {
  font-size: 0.875rem;
  color: #6b7280;
}

.qr-dialog-tip {
  margin: 10px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.qr-dialog-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.qr-dialog-open-image {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0.4rem 0.9rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  background: #fff;
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 500;
}

.qr-dialog-close {
  min-height: 38px;
  padding: 0.4rem 0.9rem;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
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
    gap: 0.65rem;
    padding: 0.5rem 0;
  }

  .history-link {
    font-size: clamp(0.7rem, 2.8vw, 0.8125rem);
    padding: 0.3rem 0.6rem;
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

  .qr-action-row {
    justify-content: center;
  }

  .show-qr-button {
    font-size: clamp(11px, 2.8vw, 13px);
    min-height: 34px;
  }

  .qr-dialog-actions {
    flex-direction: column;
  }

  .qr-dialog-open-image,
  .qr-dialog-close {
    width: 100%;
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
