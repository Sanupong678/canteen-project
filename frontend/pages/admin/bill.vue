<template>
  <LayoutAdmin>
    <div class="page-container">
      <div class="content-wrapper">
        <div class="header-section">
          <h1 class="page-title">จัดการบิล</h1>
        </div>

        <!-- Filters Section -->
        <div class="filters-section">
          <v-row class="filters-row" align="center" no-gutters>
            <!-- Search on the right (desktop) / on top (mobile) -->
            <v-col cols="12" md="auto" class="filter-col search-col">
              <v-text-field
                v-model="searchShopName"
                placeholder="ค้นหาชื่อร้านค้า"
                variant="solo"
                hide-details
                class="search-input filter-input filter-input--search"
                append-inner-icon="mdi-magnify"
                @click:append-inner="triggerSearch"
                @keyup.enter="triggerSearch"
                aria-label="ค้นหาชื่อร้านค้า"
              />
            </v-col>

            <!-- Dropdown group (left aligned) -->
            <v-col cols="12" md="auto" class="filters-left">
              <div class="filters-left-row">
                <v-select
                  v-model="selectedCanteen"
                  :items="canteenTypes"
                  label="โรงอาหาร"
                  variant="solo"
                  hide-details
                  class="custom-select pill-select filter-input filter-input--md"
                  menu-icon="mdi-menu-down"
                  prepend-inner-icon="mdi-store-outline"
                />
                <v-select
                  v-model="selectedStatus"
                  :items="statusTypes"
                  label="สถานะ"
                  variant="solo"
                  hide-details
                  class="custom-select pill-select filter-input filter-input--md"
                  menu-icon="mdi-menu-down"
                  prepend-inner-icon="mdi-check-circle-outline"
                />
                <v-select
                  v-model="selectedMonth"
                  :items="monthTypes"
                  label="เดือน"
                  variant="solo"
                  hide-details
                  class="custom-select pill-select filter-input filter-input--md"
                  menu-icon="mdi-menu-down"
                  prepend-inner-icon="mdi-calendar-month-outline"
                />
                <v-select
                  v-model="selectedYear"
                  :items="yearOptions"
                  label="ปี"
                  variant="solo"
                  hide-details
                  class="custom-select pill-select filter-input filter-input--md"
                  menu-icon="mdi-menu-down"
                  prepend-inner-icon="mdi-calendar-outline"
                />
              </div>
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
              <v-btn value="utilities">รวม (Utilities)</v-btn>
            </v-btn-toggle>
          </div>
        </div>

        <!-- Data Table -->
        <v-data-table
          :headers="headers"
          :items="pagedBills"
          :loading="loading"
          class="elevation-1 custom-table"
          hide-default-footer
          :no-data-text="'ยังไม่มีรายการบิล'"
          :no-results-text="'ไม่พบรายการที่ค้นหา'"
          :loading-text="'กำลังโหลดข้อมูล...'"
        >
          <!-- Header Labels -->
          <template v-slot:header.shopId>
            <span><b>รหัสร้าน</b></span>
          </template>
          <template v-slot:header.guestInfo>
            <span><b>ข้อมูลร้านค้า</b></span>
          </template>
          <template v-slot:header.reservation>
            <span><b>รายละเอียดวัน</b></span>
          </template>
          <template v-slot:header.special>
            <span><b>{{ selectedBillType === 'electricity' ? 'ค่าไฟ' : 'ค่าน้ำ' }}</b></span>
          </template>
          <template v-slot:header.status>
            <span><b>สถานะ</b></span>
          </template>
          <template v-slot:header.actions>
            <span><b>การจัดการ</b></span>
          </template>

          <!-- ID Shop -->
          <template v-slot:item.shopId="{ item }">
            {{ item.shopId }}
          </template>

          <!-- Guest Information -->
          <template v-slot:item.guestInfo="{ item }">
            <div class="guest-info">
              <div class="guest-info-line">
                <v-icon x-small class="guest-info-icon">mdi-domain</v-icon>
                <span class="guest-info-label">โรงอาหาร:</span>
                <span class="guest-info-value"><b>{{ item.canteen }}</b></span>
              </div>
              <div class="guest-info-line">
                <v-icon x-small class="guest-info-icon">mdi-account-outline</v-icon>
                <span class="guest-info-label">ชื่อร้านค้า:</span>
                <span class="guest-info-value">{{ item.shopName }}</span>
              </div>
              <div v-if="item.email" class="guest-info-line">
                <v-icon x-small class="guest-info-icon">mdi-email</v-icon>
                <span class="guest-info-label">อีเมล:</span>
                <span class="guest-info-value">{{ item.email }}</span>
              </div>
              <div v-if="item.phone" class="guest-info-line">
                <v-icon x-small class="guest-info-icon">mdi-phone</v-icon>
                <span class="guest-info-label">โทร:</span>
                <span class="guest-info-value">{{ item.phone }}</span>
              </div>
            </div>
          </template>

          <!-- Reservation Details -->
          <template v-slot:item.reservation="{ item }">
            <div>
              <div class="guest-info-line">
                <v-icon x-small class="guest-info-icon">mdi-calendar-start</v-icon>
                <span class="guest-info-label">วันที่เริ่ม:</span>
                <span class="guest-info-value">{{ formatDate(item.createdAt) }}</span>
              </div>
              <div class="guest-info-line">
                <v-icon x-small class="guest-info-icon">mdi-calendar-end</v-icon>
                <span class="guest-info-label">วันที่สิ้นสุด:</span>
                <span class="guest-info-value">{{ item.createdAt ? formatDate(addDays(new Date(item.createdAt), 10)) : '-' }}</span>
              </div>
            </div>
          </template>

          <!-- ค่าไฟ หรือ ค่าน้ำ ตามประเภทที่เลือก -->
          <template v-slot:item.special="{ item }">
            <template v-if="selectedBillType === 'electricity'">
              <b>ค่าไฟ: {{ item.amount ? item.amount + ' บาท' : '-' }}</b>
            </template>
            <template v-else-if="selectedBillType === 'water'">
              <b>ค่าน้ำ: {{ item.amount ? item.amount + ' บาท' : '-' }}</b>
            </template>
            <template v-else>
              <b>รวม (ค่าน้ำ+ค่าไฟ): {{ item.amount ? item.amount + ' บาท' : '-' }}</b>
            </template>
            <span
              v-if="item.image || item.slip_image_url"
              :class="{'yellow--text': !!item.image || !!item.slip_image_url}"
              @click="(item.image || item.slip_image_url) && openImagePreview(item.image || item.slip_image_url, item)"
              style="cursor: pointer; margin-left: 8px;"
            >
              <v-icon small>mdi-image</v-icon>
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
            <template v-if="item.image && item.status !== 'เสร็จสิ้น'">
              <v-btn color="success" small @click="updateStatus(item._id, 'confirmed')">Approve</v-btn>
              <v-btn color="error" small @click="cancelSlipImage(item._id)">ยกเลิกสลิป</v-btn>
            </template>
          </template>
        </v-data-table>
        <!-- Pagination (10 per page, same as repair admin) -->
        <div v-if="filteredBills.length > 0" class="pagination-section">
          <div class="items-per-page">
            <span class="label">Items per page:</span>
            <span class="fixed-size">10</span>
            <span class="range">{{ startIndexDisplay }}-{{ endIndexDisplay }} of {{ filteredBills.length }}</span>
          </div>
          <div class="pagination">
            <button
              v-for="p in totalPages"
              :key="'pg-'+p"
              class="page-num"
              :class="{ active: p === currentPage }"
              @click="goToPage(p)"
            >{{ p }}</button>
            <button class="page-next" :disabled="currentPage === totalPages" @click="nextPage">next</button>
          </div>
        </div>
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
              :src="getImageUrl(currentBill._id)"
              class="preview-image"
              style="max-width:100%;max-height:60vh;width:auto;height:auto;object-fit:unset;display:block;margin:1rem auto;background:#f8f8f8;border-radius:4px;"
              @error="handleImageError"
              crossorigin="anonymous"
            />
            <div v-if="imageError" style="text-align: center; padding: 2rem; color: #666;">
              <v-icon large color="grey">mdi-image-off</v-icon>
              <p>ไม่สามารถโหลดรูปภาพได้</p>
              <p style="font-size: 0.9rem; color: #999;">รูปภาพอาจถูกลบหรือไม่พบ</p>
            </div>
            <div v-if="currentBill && currentBill.updatedAt" style="font-size: 14px; color: #e6a800; margin-top: 12px;">
              <v-icon small style="vertical-align: middle;">mdi-clock-outline</v-icon>
              อัปโหลดเมื่อ {{ formatDate(currentBill.updatedAt) }}
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn v-if="currentBill && (currentBill.imageData || currentBill.image)" color="error" text @click="cancelSlipImage(currentBill._id)">
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
    const selectedYear = ref('')
    const searchShopName = ref('')
    const showPreview = ref(false)
    const previewImage = ref('')
    const currentBill = ref(null)
    const imageError = ref(false)

    // เพิ่มตัวแปรสำหรับเลือกประเภทบิล (ค่าไฟ/ค่าน้ำ)
    const selectedBillType = ref('electricity') // 'electricity' | 'water' | 'utilities'

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
      { text: 'ข้อมูลร้านค้า', value: 'guestInfo', align: 'start' },
      { text: 'รายละเอียดวัน', value: 'reservation', align: 'start' },
      { text: selectedBillType.value === 'electricity' ? 'ค่าไฟ' : selectedBillType.value === 'water' ? 'ค่าน้ำ' : 'รวม (Utilities)', value: 'special', align: 'start' },
      { text: 'สถานะ', value: 'status', align: 'center' },
      { text: 'การจัดการ', value: 'actions', align: 'center', sortable: false }
    ])

    const billTypes = [
      'ทั้งหมด',
      'ค่าน้ำ',
      'ค่าไฟ',
      'รวม (Utilities)'
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

    const yearOptions = (() => {
      const currentYear = new Date().getFullYear()
      const years = ['ทั้งหมด']
      for (let y = currentYear; y >= currentYear - 5; y--) {
        years.push(String(y))
      }
      return years
    })()

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
        electricity: 'ค่าไฟ',
        utilities: 'รวม (ค่าน้ำ+ค่าไฟ)'
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
      if (!status) return 'รอดำเนินการ'
      const statusMap = {
        'รอดำเนินการ': 'รอดำเนินการ',
        'รอตรวจสอบ': 'รอตรวจสอบ',
        'เสร็จสิ้น': 'เสร็จสิ้น',
        'เลยกำหนด': 'เลยกำหนด'
      }
      return statusMap[status] || status
    }

    const getStatusColor = (status) => {
      const colors = {
        'รอดำเนินการ': 'warning',    // สีเหลือง
        'รอตรวจสอบ': 'info',         // สีฟ้า
        'เสร็จสิ้น': 'success',       // สีเขียว
        'เลยกำหนด': 'error'          // สีแดง
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
            'ค่าไฟ': 'electricity',
            'รวม (Utilities)': 'utilities'
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
        if (selectedYear.value && selectedYear.value !== 'ทั้งหมด') {
          query.append('year', selectedYear.value)
        }
        if (searchShopName.value && searchShopName.value.trim()) {
          query.append('shopName', searchShopName.value.trim())
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
    watch([selectedType, selectedStatus, selectedCanteen, selectedMonth, selectedYear, searchShopName], () => {
      fetchBills()
    })

    // Initial data fetch and realtime updates
    onMounted(() => {
      fetchBills()
      try {
        const { $socket } = useNuxtApp()
        if ($socket) {
          const refresh = () => fetchBills()
          $socket.on('admin:bill:newUpload', refresh)
          $socket.on('user:bill:updated', refresh)
          $socket.on('user:bill:imageCancelled', refresh)
          onUnmounted(() => {
            $socket.off('admin:bill:newUpload', refresh)
            $socket.off('user:bill:updated', refresh)
            $socket.off('user:bill:imageCancelled', refresh)
          })
        }
      } catch (e) { /* no-op */ }
    })

    const updateStatus = async (billId, newStatus) => {
      if (!confirm(`คุณต้องการยืนยันบิลนี้ใช่หรือไม่?`)) {
        return
      }

      loading.value = true
      try {
        await $axios.put(`/api/bills/admin/verify/${billId}`, {
          status: 'เสร็จสิ้น'
        })
        await fetchBills()
        alert('อัพเดทสถานะเรียบร้อยแล้ว')
      } catch (error) {
        console.error('Error updating bill status:', error)
        console.error('Error response:', error.response?.data)
        console.error('Error status:', error.response?.status)
        alert(`ไม่สามารถอัพเดทสถานะได้: ${error.response?.data?.message || error.message}`)
      } finally {
        loading.value = false
      }
    }

    const openImagePreview = (imageUrl, bill) => {
      previewImage.value = imageUrl
      currentBill.value = bill
      showPreview.value = true
      imageError.value = false
    }

    const handleImageError = (event) => {
      console.error('Image load error:', event)
      imageError.value = true
    }

    // filter ข้อมูลตามประเภทที่เลือก
    const filteredBills = computed(() => {
      return bills.value.filter(bill => {
        if (selectedBillType.value === 'electricity') {
          return bill.billType === 'ค่าไฟ' || bill.billType === 'electricity'
        }
        if (selectedBillType.value === 'water') {
          return bill.billType === 'ค่าน้ำ' || bill.billType === 'water'
        }
        return bill.billType === 'รวม (ค่าน้ำ+ค่าไฟ)' || bill.billType === 'utilities'
      })
    })

    // Pagination (same behavior as repair admin: 10 per page)
    const pageSize = 10
    const currentPage = ref(1)
    const totalPages = computed(() => Math.max(1, Math.ceil(filteredBills.value.length / pageSize)))
    const pagedBills = computed(() => {
      const start = (currentPage.value - 1) * pageSize
      return filteredBills.value.slice(start, start + pageSize)
    })
    const goToPage = (p) => { if (p < 1 || p > totalPages.value) return; currentPage.value = p }
    const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
    const startIndexDisplay = computed(() => (filteredBills.value.length ? (currentPage.value - 1) * pageSize + 1 : 0))
    const endIndexDisplay = computed(() => Math.min(currentPage.value * pageSize, filteredBills.value.length))

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

    const getImageUrl = (billId) => {
      // ใช้ static file URL แทน API endpoint
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com' 
        : ''
      
      // หา bill เพื่อดึง image path
      const bill = bills.value.find(b => b._id === billId)
      if (bill && bill.image) {
        // ใช้ static file URL - ใช้ imagePath ที่มี full path
        if (bill.imagePath) {
          // แปลง path ให้เป็น URL ที่ถูกต้อง
          const imagePath = bill.imagePath.replace(/\\/g, '/')
          // ลบ uploads/ ออกจาก path เพราะ static route มี /uploads อยู่แล้ว
          const relativePath = imagePath.replace(/^uploads\//, '')
          console.log('Image URL:', `${backendUrl}/uploads/${relativePath}`)
          return `${backendUrl}/uploads/${relativePath}`
        }
        // fallback ไปใช้ API endpoint
        console.log('Using API endpoint:', `${backendUrl}/api/bills/image/${billId}`)
        return `${backendUrl}/api/bills/image/${billId}`
      }
      
      // fallback ไปใช้ API endpoint
      console.log('No image found, using API endpoint:', `${backendUrl}/api/bills/image/${billId}`)
      return `${backendUrl}/api/bills/image/${billId}`
    }

    const cancelSlipImage = async (billId) => {
      if (!confirm('คุณต้องการลบรูปภาพสลิปนี้หรือไม่?')) return
      loading.value = true
      try {
        await $axios.put(`/api/bills/admin/cancel-image/${billId}`)
        await fetchBills()
        alert('ยกเลิกสลิปเรียบร้อยแล้ว')
      } catch (error) {
        console.error('Error cancelling slip image:', error)
        alert('ไม่สามารถยกเลิกสลิปได้')
      } finally {
        loading.value = false
      }
    }

    const triggerSearch = () => {
      fetchBills()
    }

    return {
      bills,
      loading,
      headers,
      selectedType,
      selectedStatus,
      selectedCanteen,
      selectedMonth,
      selectedYear,
      searchShopName,
      showPreview,
      previewImage,
      selectedBillType,
      filteredBills,
      canteenTypes,
      monthTypes,
      yearOptions,
      billTypes,
      statusTypes,
      canteenMap,
      formatDate,
      formatAmount,
      handleImageError,
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
      cancelSlipImage,
      triggerSearch,
      imageError,
      showPreview,
      previewImage,
      // pagination
      currentPage,
      totalPages,
      pagedBills,
      goToPage,
      nextPage,
      startIndexDisplay,
      endIndexDisplay
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
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(231, 76, 60, 0.1);
}

.filters-row {
  gap: 12px;
  flex-wrap: wrap;
}

.filter-col { flex: 2 1 auto; }
.search-col { order: 1; }
.filters-left { order: 2; flex: 1 1 auto; }

.filters-left-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-input :deep(.v-field) { height: 44px !important; }
.filter-input :deep(.v-field__input) { align-items: center !important; }
.filter-input :deep(.v-field__prepend-inner),
.filter-input :deep(.v-field__append-inner) { align-items: center !important; }
.filter-input :deep(.v-field__prepend-inner .v-icon),
.filter-input :deep(.v-field__append-inner .v-icon) { align-self: center !important; margin-top: 0 !important; }

/* Keep label centered like a placeholder (no floating) */
.pill-select :deep(.v-field-label) {
  top: 50% !important;
  transform: translateY(-50%) scale(1) !important;
  opacity: 1 !important;
}

/* Ensure v-select selection text sits middle */
.pill-select :deep(.v-select__selection-text),
.pill-select :deep(.v-select__selection) {
  display: flex !important;
  align-items: center !important;
}

/* Right arrow vertical centering */
.filter-input--md :deep(.v-select__menu-icon),
.filter-input--md :deep(.v-select__menu-icon .v-icon) {
  display: flex !important;
  align-items: center !important;
  height: 100% !important;
}

.filter-input--md { width: 130px; }

.filter-input--search { width: min(520px, 100%); }

.custom-select {
  background: transparent;
  box-shadow: none;
}

.custom-select :deep(.v-select__selections) {
  font-size: 14px;
  font-weight: 500;
}

.custom-select :deep(.v-input__control),
.custom-select :deep(.v-field) {
  min-height: 40px !important;
}

.pill-select :deep(.v-field) {
  border-radius: 28px !important;
  background: #fff !important;
  border: 1px solid #e9ecef !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}

.pill-select :deep(.v-field--focused) {
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.18), 0 2px 8px rgba(0,0,0,0.08) !important;
  border-color: #2196f3 !important; /* ring-primary */
}

.pill-select :deep(.v-select__selections) {
  padding-left: 10px !important;
}

.pill-select :deep(.v-select__menu-icon .v-icon) {
  color: #6b7280 !important; /* gray-500 */
}

.pill-select:focus-within :deep(.v-select__menu-icon .v-icon) {
  color: #2563eb !important; /* blue-600 */
}

.search-input {
  --pill-radius: 28px;
}

.search-input :deep(.v-field) {
  border-radius: var(--pill-radius) !important;
  background: #fff !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  border: 1px solid #eee !important;
}

.search-input :deep(.v-field__input) {
  padding-left: 16px !important;
  font-size: 16px !important;
  color: #333 !important;
}

.search-input :deep(.v-field__append-inner .v-icon) {
  color: #c0392b !important;
  transition: color 0.2s ease;
}

.search-input :deep(.v-field__clearable) {
  display: none !important;
}

.search-input:hover :deep(.v-field__append-inner .v-icon),
.search-input:focus-within :deep(.v-field__append-inner .v-icon) {
  color: #e74c3c !important;
}

/* Desktop alignment: search left, dropdowns right */
@media (min-width: 992px) {
  .search-col { order: 1; }
  .filters-left { order: 2; }
  .filters-left-row { flex-wrap: nowrap; }
}

/* Mobile-first: search on top, dropdowns stack below */
@media (max-width: 991px) {
  .filters-row { gap: 10px; }
  .search-col { order: 1; width: 100%; }
  .filters-left { order: 2; width: 100%; }
  .filter-input--md { width: calc(50% - 6px); }
  .filter-input--search { width: 100%; }
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

/* Pagination styles (copied from repair admin) */
.pagination-section { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; margin-top: 12px; }
.items-per-page { display: flex; align-items: center; gap: 10px; color: #374151; font-size: 14px; }
.items-per-page .fixed-size { padding: 6px 12px; border: 1px solid #e5e7eb; border-radius: 6px; background: #fff; min-width: 48px; text-align: center; }
.items-per-page .range { margin-left: 12px; color: #6b7280; }
.pagination { display: flex; gap: 6px; }
.page-num { min-width: 32px; height: 32px; border: 1px solid #e5e7eb; background: #fff; color: #7f1d1d; border-radius: 2px; cursor: pointer; }
.page-num.active { background: #7f1d1d; color: #fff; border-color: #7f1d1d; }
.page-next { border: 1px solid #e5e7eb; background: #fff; color: #7f1d1d; border-radius: 2px; padding: 0 10px; cursor: pointer; }

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

/* Guest info lines with icons */
.guest-info { display: flex; flex-direction: column; gap: 4px; }
.guest-info-line { display: flex; align-items: center; gap: 6px; }
.guest-info-icon { color: #6b7280; }
.guest-info-label { color: #6b7280; font-weight: 500; font-size: 12px; }
.guest-info-value { font-size: 14px; }

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