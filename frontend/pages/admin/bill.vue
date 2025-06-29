<template>
  <LayoutAdmin>
    <div class="page-container">
      <div class="content-wrapper">
        <div class="header-section">
          <h1 class="page-title">จัดการบิล</h1>
        </div>

        <!-- Filters Section -->
        <div class="filters-section">
          <v-row>
            <v-col cols="12" sm="9">
              <v-select
                v-model="selectedCanteen"
                :items="canteenTypes"
                label="โรงอาหาร"
                clearable
                outlined
                dense
                hide-details
                class="custom-select"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-select
                v-model="selectedStatus"
                :items="statusTypes"
                label="สถานะ"
                clearable
                outlined
                dense
                hide-details
                class="custom-select"
              />
            </v-col>
          </v-row>
        </div>

        <!-- เพิ่ม v-btn-toggle และปุ่มอัปโหลดไฟล์ Excel โดยแบ่งซ้ายขวา (อัปโหลดอยู่ซ้าย, toggle อยู่ขวา) -->
        <div class="d-flex justify-space-between align-center mb-4">
          <div class="d-flex align-center">
            <input
              ref="fileInput"
              type="file"
              accept=".xlsx,.xls"
              style="display: none"
              @change="onFileChange"
            />
            <v-btn color="primary" class="mr-2" @click="$refs.fileInput.click()">
              <v-icon left>mdi-upload</v-icon>เลือกไฟล์ Excel
            </v-btn>
            <span v-if="fileName" class="ml-1">{{ fileName }}</span>
            <v-btn color="success" class="ml-3" :disabled="!selectedFile" @click="uploadFile">
              <v-icon left>mdi-cloud-upload</v-icon>อัปโหลด
            </v-btn>
          </div>
          <div>
            <v-btn-toggle v-model="selectedBillType" mandatory>
              <v-btn value="electricity">ค่าไฟ</v-btn>
              <v-btn value="water">ค่าน้ำ</v-btn>
            </v-btn-toggle>
          </div>
        </div>

        <!-- Data Table -->
        <v-data-table
          :headers="headers"
          :items="filteredBills"
          :loading="loading"
          class="elevation-1 custom-table"
          :items-per-page="10"
          :footer-props="{
            'items-per-page-options': [10, 20, 50],
            'items-per-page-text': 'รายการต่อหน้า'
          }"
          :no-data-text="'ยังไม่มีรายการบิล'"
          :no-results-text="'ไม่พบรายการที่ค้นหา'"
          :loading-text="'กำลังโหลดข้อมูล...'"
        >
          <!-- Header Labels -->
          <template v-slot:header.shopId>
            <span><b>ID</b></span>
          </template>
          <template v-slot:header.guestInfo>
            <span><b>Guest Information</b></span>
          </template>
          <template v-slot:header.reservation>
            <span><b>Reservation Details</b></span>
          </template>
          <template v-slot:header.special>
            <span><b>{{ selectedBillType === 'electricity' ? 'ค่าไฟ' : 'ค่าน้ำ' }}</b></span>
          </template>
          <template v-slot:header.status>
            <span><b>Status</b></span>
          </template>
          <template v-slot:header.actions>
            <span><b>Actions</b></span>
          </template>

          <!-- ID Shop -->
          <template v-slot:item.shopId="{ item }">
            {{ item.shopId }}
          </template>

          <!-- Guest Information -->
          <template v-slot:item.guestInfo="{ item }">
            <div>
              <div><b>{{ item.canteen }}</b></div>
              <div>{{ item.shopName }}</div>
              <div v-if="item.email"><v-icon small>mdi-email</v-icon> {{ item.email }}</div>
              <div v-if="item.phone"><v-icon small>mdi-phone</v-icon> {{ item.phone }}</div>
            </div>
          </template>

          <!-- Reservation Details -->
          <template v-slot:item.reservation="{ item }">
            <div>
              <div><b>Start-date:</b> {{ formatDate(item.createdAt) }}</div>
              <div><b>End-date:</b> {{ item.createdAt ? formatDate(addDays(new Date(item.createdAt), 10)) : '-' }}</div>
            </div>
          </template>

          <!-- ค่าไฟ หรือ ค่าน้ำ ตามประเภทที่เลือก -->
          <template v-slot:item.special="{ item }">
            <span v-if="selectedBillType === 'electricity'">
              <b>ค่าไฟ: {{ item.amount ? item.amount + ' บาท' : '-' }}</b>
              <span
                v-if="item.image || item.slip_image_url"
                :class="{'yellow--text': !!item.image || !!item.slip_image_url}"
                @click="(item.image || item.slip_image_url) && openImagePreview(item.image || item.slip_image_url, item)"
                style="cursor: pointer; margin-left: 8px;"
              >
                <v-icon small>mdi-image</v-icon>
              </span>
            </span>
            <span v-else>
              <b>ค่าน้ำ: {{ item.amount ? item.amount + ' บาท' : '-' }}</b>
              <span
                v-if="item.image || item.slip_image_url"
                :class="{'yellow--text': !!item.image || !!item.slip_image_url}"
                @click="(item.image || item.slip_image_url) && openImagePreview(item.image || item.slip_image_url, item)"
                style="cursor: pointer; margin-left: 8px;"
              >
                <v-icon small>mdi-image</v-icon>
              </span>
            </span>
          </template>

          <!-- Status -->
          <template v-slot:item.status="{ item }">
            <v-chip :color="item.image && item.status === 'รอดำเนินการ' ? 'warning' : getStatusColor(item.status)" x-small>
              {{ getStatusText(item.status) }}
            </v-chip>
            <div class="mt-1">
              <v-btn
                class="show-bill-btn"
                text
                small
                :color="(item.image || item.slip || item.electricityImage || item.waterImage) ? 'primary' : 'grey'"
                :style="(item.image || item.slip || item.electricityImage || item.waterImage) ? 'color:#1976d2' : 'color:#aaa'"
                :disabled="!(item.image || item.slip || item.electricityImage || item.waterImage)"
                @click="openImagePreview(item.image || item.slip || item.electricityImage || item.waterImage, item)"
              >
                แสดงบิล
              </v-btn>
            </div>
          </template>

          <!-- Actions -->
          <template v-slot:item.actions="{ item }">
            <template v-if="item.status === 'รอตรวจสอบ' || item.status === 'pending' || item.status === 'waiting' || item.image || item.slip || item.electricityImage || item.waterImage">
              <v-btn color="success" small @click="updateStatus(item._id, 'confirmed')" :disabled="item.status === 'ยืนยันแล้ว'">Approve</v-btn>
              <v-btn color="error" small @click="updateStatus(item._id, 'rejected')" :disabled="item.status === 'เลยกำหนดชำระ'">Cancel</v-btn>
            </template>
          </template>
        </v-data-table>
      </div>

      <!-- Image Preview Dialog -->
      <v-dialog v-model="showPreview" max-width="800px">
        <v-card>
          <v-card-title class="headline">
            หลักฐานการชำระเงิน
          </v-card-title>
          <v-card-text>
            <img
              v-if="currentBill && (currentBill.imageData || currentBill.image)"
              :src="`/api/bills/image/${currentBill._id}`"
              class="preview-image"
              style="max-width:100%;max-height:60vh;width:auto;height:auto;object-fit:unset;display:block;margin:1rem auto;background:#f8f8f8;border-radius:4px;"
            />
            <div v-if="currentBill && currentBill.updatedAt" style="font-size: 14px; color: #e6a800; margin-top: 12px;">
              <v-icon small style="vertical-align: middle;">mdi-clock-outline</v-icon>
              อัปโหลดเมื่อ {{ formatDate(currentBill.updatedAt) }}
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn v-if="currentBill && (currentBill.imageData || currentBill.image)" color="error" text @click="cancelSlipImage">
              ยกเลิกสลิป
            </v-btn>
            <v-btn color="primary" text @click="showPreview = false">
              ปิด
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </LayoutAdmin>
</template>

<script>
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import { useNuxtApp } from '#app'
import LayoutAdmin from '@/components/LayoutAdmin.vue'
import { format, addDays } from 'date-fns'
import { th } from 'date-fns/locale'

export default {
  name: 'BillAdmin',
  components: {
    LayoutAdmin
  },
  setup() {
    const { $axios } = useNuxtApp()
    
    const bills = ref([])
    const loading = ref(false)
    const selectedType = ref('')
    const selectedCanteen = ref('')
    const selectedStatus = ref('')
    const selectedMonth = ref('')
    const showPreview = ref(false)
    const previewImage = ref('')
    const currentBill = ref(null)

    // เพิ่มตัวแปรสำหรับเลือกประเภทบิล (ค่าไฟ/ค่าน้ำ)
    const selectedBillType = ref('electricity') // 'electricity' หรือ 'water'

    const canteenMap = {
      1: 'โรงอาหาร C5',
      2: 'โรงอาหาร D1',
      3: 'โรงอาหาร Dormitory',
      4: 'โรงอาหาร E1',
      5: 'โรงอาหาร E2',
      6: 'โรงอาหาร Epark',
      7: 'โรงอาหาร Msquare',
      8: 'โรงอาหาร Ruemrim',
      9: 'โรงอาหาร S2'
    }

    const headers = computed(() => [
      { text: 'ID', value: 'shopId', align: 'start' },
      { text: 'Guest Information', value: 'guestInfo', align: 'start' },
      { text: 'Reservation Details', value: 'reservation', align: 'start' },
      { text: selectedBillType.value === 'electricity' ? 'ค่าไฟ' : 'ค่าน้ำ', value: 'special', align: 'start' },
      { text: 'Status', value: 'status', align: 'center' },
      { text: 'Actions', value: 'actions', align: 'center', sortable: false }
    ])

    const billTypes = [
      'ทั้งหมด',
      'ค่าน้ำ',
      'ค่าไฟ'
    ]

    const statusTypes = [
      'ทั้งหมด',
      'รอตรวจสอบ',
      'ยืนยันแล้ว',
      'เลยกำหนดชำระ'
    ]

    const canteenTypes = Object.values(canteenMap)
    canteenTypes.unshift('ทั้งหมด')

    const monthTypes = [
      'ทั้งหมด',
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม'
    ]

    const monthToNumber = {
      'มกราคม': '1',
      'กุมภาพันธ์': '2',
      'มีนาคม': '3',
      'เมษายน': '4',
      'พฤษภาคม': '5',
      'มิถุนายน': '6',
      'กรกฎาคม': '7',
      'สิงหาคม': '8',
      'กันยายน': '9',
      'ตุลาคม': '10',
      'พฤศจิกายน': '11',
      'ธันวาคม': '12'
    }

    const numberToMonth = {
      '1': 'มกราคม',
      '2': 'กุมภาพันธ์',
      '3': 'มีนาคม',
      '4': 'เมษายน',
      '5': 'พฤษภาคม',
      '6': 'มิถุนายน',
      '7': 'กรกฎาคม',
      '8': 'สิงหาคม',
      '9': 'กันยายน',
      '10': 'ตุลาคม',
      '11': 'พฤศจิกายน',
      '12': 'ธันวาคม'
    }

    const formatDate = (date) => {
      if (!date) return '-'
      return format(new Date(date), 'dd MMMM yyyy', { locale: th })
    }

    const formatDateTime = (date) => {
      if (!date) return '-'
      return format(new Date(date), 'dd/MM/yyyy HH:mm:ss')
    }

    const formatAmount = (amount) => {
      return amount.toLocaleString('th-TH')
    }

    const getBillTypeText = (type) => {
      const types = {
        water: 'ค่าน้ำ',
        electricity: 'ค่าไฟ'
      }
      return types[type] || type
    }

    const getBillTypeColor = (type) => {
      const colors = {
        water: 'blue',
        electricity: 'amber'
      }
      return colors[type] || 'grey'
    }

    const getStatusText = (status) => {
      const statusMap = {
        pending: 'รอตรวจสอบ',
        confirmed: 'ยืนยันแล้ว',
        rejected: 'เลยกำหนดชำระ'
      }
      return statusMap[status] || status
    }

    const getStatusColor = (status) => {
      const colors = {
        'รอดำเนินการ': 'grey',
        'รอตรวจสอบ': 'warning',
        'ยืนยันแล้ว': 'success',
        'เลยกำหนดชำระ': 'error'
      }
      return colors[status] || 'grey'
    }

    const fetchBills = async () => {
      loading.value = true
      try {
        const query = new URLSearchParams()
        if (selectedType.value && selectedType.value !== 'ทั้งหมด') {
          const billTypeMap = {
            'ค่าน้ำ': 'water',
            'ค่าไฟ': 'electricity'
          }
          query.append('billType', billTypeMap[selectedType.value])
        }
        if (selectedStatus.value && selectedStatus.value !== 'ทั้งหมด') {
          const statusMap = {
            'รอดำเนินการ': 'pending',
            'รอตรวจสอบ': 'waiting',
            'ยืนยันแล้ว': 'confirmed',
            'เลยกำหนดชำระ': 'rejected'
          }
          query.append('status', statusMap[selectedStatus.value])
        }
        if (selectedCanteen.value && selectedCanteen.value !== 'ทั้งหมด') {
          const canteenId = Object.keys(canteenMap).find(key => canteenMap[key] === selectedCanteen.value)
          if (canteenId) query.append('canteenId', canteenId)
        }
        if (selectedMonth.value && selectedMonth.value !== 'ทั้งหมด') {
          query.append('month', monthToNumber[selectedMonth.value])
        }

        const response = await $axios.get(`/api/bills/admin?${query.toString()}`)
        console.log('API Response:', response.data)
        console.log('First bill data:', response.data.data[0]) // Debug: ดูข้อมูลบิลแรก
        
        bills.value = response.data.data.map(bill => {
          console.log('Processing bill:', bill) // Debug: ดูข้อมูลแต่ละบิล
          return {
            ...bill,
            billType: bill.billType === 'water' ? 'ค่าน้ำ' : bill.billType === 'electricity' ? 'ค่าไฟ' : bill.billType,
            canteen: canteenMap[bill.canteenId],
            month: numberToMonth[bill.month] || bill.month,
            year: bill.year,
            // ดึงข้อมูล amount จาก MongoDB
            amount: bill.amount || null,
            image: bill.image || null,
            slip_image_url: bill.slip_image_url || null
          }
        })

      } catch (error) {
        console.error('Error fetching bills:', error)
        alert('ไม่สามารถดึงข้อมูลบิลได้')
      } finally {
        loading.value = false
      }
    }

    // Watch for filter changes
    watch([selectedType, selectedStatus, selectedCanteen, selectedMonth], () => {
      fetchBills()
    })

    // Initial data fetch and auto refresh
    onMounted(() => {
      fetchBills()
      const refreshInterval = setInterval(fetchBills, 30000)
      
      onUnmounted(() => {
        clearInterval(refreshInterval)
      })
    })

    const updateStatus = async (billId, newStatus) => {
      if (!confirm(`คุณต้องการ${newStatus === 'confirmed' ? 'ยืนยัน' : 'ปฏิเสธ'}บิลนี้ใช่หรือไม่?`)) {
        return
      }

      loading.value = true
      try {
        await $axios.put(`/api/bills/admin/verify/${billId}`, {
          status: newStatus
        })
        await fetchBills()
        alert('อัพเดทสถานะเรียบร้อยแล้ว')
      } catch (error) {
        console.error('Error updating bill status:', error)
        alert('ไม่สามารถอัพเดทสถานะได้')
      } finally {
        loading.value = false
      }
    }

    const openImagePreview = (imageUrl, bill) => {
      previewImage.value = imageUrl
      currentBill.value = bill
      showPreview.value = true
    }

    // filter ข้อมูลตามประเภทที่เลือก
    const filteredBills = computed(() => {
      return bills.value.filter(bill => {
        return selectedBillType.value === 'electricity'
          ? (bill.billType === 'ค่าไฟ' || bill.billType === 'electricity')
          : (bill.billType === 'ค่าน้ำ' || bill.billType === 'water')
      })
    })

    const selectedFile = ref(null)
    const fileName = ref("")
    const fileInput = ref(null)

    const onFileChange = (e) => {
      const file = e.target.files[0]
      selectedFile.value = file
      fileName.value = file ? file.name : ""
    }

    const uploadFile = async () => {
      if (!selectedFile.value) return
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      await $axios.post('/api/bills/admin/import-excel', formData)
      alert('อัปโหลดสำเร็จ!')
      selectedFile.value = null
      fileName.value = ""
    }

    const getImageUrl = (path) => {
      if (!path) return ''
      let url = path.replace(/\\/g, '/').replace(/\\/g, '/').replace(/\//g, '/')
      if (!url.startsWith('/')) url = '/' + url
      return url
    }

    const cancelSlipImage = async () => {
      if (!currentBill.value) return
      if (!confirm('คุณต้องการลบรูปภาพสลิปนี้หรือไม่?')) return
      loading.value = true
      try {
        await $axios.put(`/api/bills/admin/cancel-image/${currentBill.value._id}`)
        await fetchBills()
        showPreview.value = false
        alert('ลบรูปภาพสลิปเรียบร้อยแล้ว')
      } catch (error) {
        console.error('Error cancelling slip image:', error)
        alert('ไม่สามารถลบรูปภาพสลิปได้')
      } finally {
        loading.value = false
      }
    }

    return {
      bills,
      loading,
      headers,
      selectedType,
      selectedStatus,
      selectedCanteen,
      selectedMonth,
      showPreview,
      previewImage,
      selectedBillType,
      filteredBills,
      canteenTypes,
      monthTypes,
      billTypes,
      statusTypes,
      canteenMap,
      formatDate,
      formatAmount,
      getBillTypeText,
      getBillTypeColor,
      getStatusText,
      getStatusColor,
      updateStatus,
      openImagePreview,
      addDays,
      selectedFile,
      fileName,
      fileInput,
      onFileChange,
      uploadFile,
      currentBill,
      formatDateTime,
      getImageUrl,
      cancelSlipImage
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

.filters-section {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.1);
}

.custom-select {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
}

.custom-select :deep(.v-select__selections) {
  font-size: 14px;
  font-weight: 500;
}

.custom-table {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.1);
  overflow: hidden;
}

.v-data-table :deep(.v-data-table__wrapper) {
  border-radius: 12px;
  overflow: hidden;
}

.v-data-table :deep(tbody tr) {
  transition: all 0.3s ease;
}

.v-data-table :deep(tbody tr:hover) {
  background: linear-gradient(135deg, #fdf2f2 0%, #fce8e8 100%) !important;
  transform: scale(1.01);
}

.v-data-table :deep(th) {
  background: #c0392b !important;
  color: white !important;
  font-weight: 700 !important;
  text-transform: none !important;
  white-space: nowrap;
  padding: 16px 12px !important;
}

.v-data-table :deep(td) {
  padding: 12px !important;
  border-bottom: 1px solid #fecaca;
}

.v-chip {
  margin: 4px;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  padding: 4px 0;
}

.v-btn {
  border-radius: 8px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  transition: all 0.3s ease !important;
  min-width: 100px;
  margin: 4px;
}

.v-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.15) !important;
}

.preview-image {
  max-width: 100%;
  max-height: 60vh;
  width: auto;
  height: auto;
  display: block;
  margin: 1rem auto;
  border-radius: 4px;
  object-fit: contain;
  background: #f8f8f8;
}

/* Dialog styles */
.v-dialog .v-card {
  padding: 1rem;
}

.v-dialog .v-card-title {
  padding: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.v-dialog .v-card-text {
  padding: 1rem;
}

.v-dialog .v-card-actions {
  padding: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.font-weight-medium {
  font-weight: 500;
}

.v-list-item {
  min-width: 120px;
}

.v-list-item__title {
  display: flex;
  align-items: center;
}

.bill-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.bill-info {
  padding: 8px 0;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.info-label {
  font-weight: 500;
  margin-right: 8px;
  color: rgba(0, 0, 0, 0.6);
  min-width: 80px;
}

.info-value {
  flex: 1;
}

.v-card-title {
  font-size: 1.1rem;
  line-height: 1.2;
  word-break: break-word;
}

.v-card-subtitle {
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.6);
}

.show-bill-btn {
  min-width: 120px;
  border-radius: 8px;
}

/* เพิ่ม CSS สำหรับการแสดงข้อมูลค่าไฟและค่าน้ำ */
.bills-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: linear-gradient(135deg, #fdf2f2 0%, #fce8e8 100%);
  border-radius: 12px;
  border: 1px solid #fecaca;
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.1);
}

.bill-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #fecaca;
  transition: all 0.3s ease;
}

.bill-row:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.15);
  border-color: #e74c3c;
}

.bill-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #495057;
  min-width: 100px;
}

.bill-label .v-icon {
  margin-right: 4px;
  font-size: 18px;
}

.bill-amount {
  font-weight: 700;
  font-size: 16px;
  color: #e74c3c;
  padding: 4px 12px;
  background: linear-gradient(135deg, #fdf2f2 0%, #fce8e8 100%);
  border-radius: 20px;
  border: 2px solid #e74c3c;
  transition: all 0.3s ease;
}

.bill-amount:hover {
  background: linear-gradient(135deg, #fce8e8 0%, #fadbd8 100%);
  transform: scale(1.05);
}

.bill-status {
  margin-top: 4px;
}

.yellow--text {
  color: #e74c3c !important;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(231, 76, 60, 0.1);
  transition: all 0.3s ease;
}

.yellow--text:hover {
  color: #c0392b !important;
  text-decoration: underline;
  transform: scale(1.02);
}

/* ปรับปรุง Status section */
.status-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #fdf2f2 0%, #fce8e8 100%);
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: white;
  border-radius: 6px;
  border: 1px solid #fecaca;
}

.status-label {
  font-weight: 600;
  color: #495057;
  font-size: 12px;
}

/* ปรับปรุง Action buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: linear-gradient(135deg, #fdf2f2 0%, #fce8e8 100%);
  border-radius: 8px;
  border: 1px solid #fecaca;
}

.action-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-label {
  font-weight: 600;
  color: #495057;
  font-size: 12px;
  margin-bottom: 4px;
}

.no-action {
  color: #6c757d;
  font-style: italic;
  font-size: 12px;
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
    gap: 1rem;
    align-items: flex-start;
    padding: 16px;
  }

  .filters-section {
    padding: 16px;
  }

  .bill-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .bill-label {
    min-width: auto;
  }
  
  .status-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .action-buttons {
    gap: 6px;
  }
  
  .v-btn {
    min-width: 90px;
    margin: 2px;
  }

  .v-data-table :deep(td),
  .v-data-table :deep(th) {
    padding: 8px !important;
  }
}
</style> 