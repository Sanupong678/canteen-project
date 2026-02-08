<template>
  <LayoutUser>
    <div class="repair-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div>
            <h1 class="page-title">ประวัติการแจ้งปัญหา</h1>
            <p class="page-subtitle">ปัญหาที่แจ้งและปัญหาทั้งหมดในระบบ</p>
          </div>
          <div class="header-actions">
            <v-btn
              outlined
              class="filter-btn"
              @click="showFilterDialog = true"
            >
              <v-icon left small>mdi-filter</v-icon>
              กรองข้อมูล
            </v-btn>
            <v-btn
              color="primary"
              class="add-btn"
              @click="openRepairDialog"
            >
              <v-icon left small>mdi-plus</v-icon>
              แจ้งปัญหา
            </v-btn>
          </div>
        </div>
        </div>

      <!-- Card -->
      <v-card class="repair-card" elevation="2">
        <v-card-text class="card-content">
          <!-- Search -->
          <div class="search-section">
            <v-text-field
              v-model="searchQuery"
              placeholder="ค้นหารายการ..."
              outlined
              dense
              prepend-inner-icon="mdi-magnify"
              hide-details
              class="search-input"
            ></v-text-field>
          </div>

          <!-- Table -->
          <div class="table-wrapper">
            <table class="repair-table">
              <thead>
                <tr>
                  <th class="text-left">วันที่แจ้ง</th>
                  <th class="text-left">หมวดหมู่</th>
                  <th class="text-left">รายละเอียดปัญหา</th>
                  <th class="text-left">สถานะ</th>
                  <th class="text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading">
                  <td colspan="5" class="text-center py-4">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </td>
                </tr>
                <tr v-else-if="filteredRepairs.length === 0">
                  <td colspan="5" class="text-center py-4 text-gray-500">
                    <p class="mb-2">ยังไม่เคยแจ้งซ่อมมาก่อน</p>
                    <p class="text-sm text-gray-400">เมื่อคุณแจ้งซ่อมครั้งแรก ข้อมูลจะแสดงที่นี่</p>
                  </td>
                </tr>
                <tr v-else v-for="repair in paginatedRepairs" :key="repair._id">
                  <td class="date-cell">
                    {{ formatDateOnly(repair.report_date || repair.createdAt) }}
                    <br />
                    <span class="time-text">{{ formatTime(repair.report_date || repair.createdAt) }}</span>
                  </td>
                  <td>
                    <v-chip small class="category-chip">{{ getCategoryText(repair.category) }}</v-chip>
                  </td>
                  <td class="issue-cell">{{ repair.issue }}</td>
                  <td>
                    <v-chip
                      small
                      :class="getStatusChipClass(repair.status)"
                    >
                      {{ getStatusText(repair.status) }}
                    </v-chip>
                  </td>
                  <td class="text-right">
                    <v-menu location="bottom end">
                      <template v-slot:activator="{ props }">
                        <v-btn
                          icon
                          size="small"
                          v-bind="props"
                          variant="text"
                        >
                          <v-icon>mdi-dots-horizontal</v-icon>
                        </v-btn>
                      </template>
                      <v-list density="compact">
                        <v-list-item 
                          value="view"
                          @click="viewRepairDetails(repair)"
                        >
                          <template v-slot:prepend>
                            <v-icon size="small">mdi-eye</v-icon>
                          </template>
                          <v-list-item-title>ดูรายละเอียด</v-list-item-title>
                        </v-list-item>
                        <v-list-item 
                          v-if="repair.images && repair.images.length > 0" 
                          value="images"
                          @click="viewImages(repair.images)"
                        >
                          <template v-slot:prepend>
                            <v-icon size="small">mdi-image</v-icon>
                          </template>
                          <v-list-item-title>ดูรูปภาพ</v-list-item-title>
                        </v-list-item>
                        <v-divider v-if="canEdit(repair) || canDelete(repair)"></v-divider>
                        <v-list-item 
                          v-if="canEdit(repair)" 
                          value="edit"
                          @click="openEditDialog(repair)"
                        >
                          <template v-slot:prepend>
                            <v-icon size="small" color="primary">mdi-pencil</v-icon>
                          </template>
                          <v-list-item-title>แก้ไข</v-list-item-title>
                        </v-list-item>
                        <v-list-item 
                          v-if="canDelete(repair)" 
                          value="delete"
                          @click="confirmDelete(repair)"
                        >
                          <template v-slot:prepend>
                            <v-icon size="small" color="error">mdi-delete</v-icon>
                          </template>
                          <v-list-item-title>ลบ</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer Pagination -->
          <div class="table-footer" v-if="filteredRepairs.length > 0">
            <span class="footer-text">
              แสดง {{ startIndex }} ถึง {{ endIndex }} จาก {{ filteredRepairs.length }} รายการ
            </span>
            <div class="pagination">
              <v-btn
                v-for="page in visiblePages"
                :key="page"
                small
                :outlined="page !== currentPage"
                :color="page === currentPage ? 'primary' : ''"
                class="page-btn"
                @click="goToPage(page)"
              >
                {{ page }}
              </v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Dialog สำหรับแจ้งปัญหาใหม่ -->
      <v-dialog v-model="showRepairDialog" max-width="600px" persistent>
        <v-card>
          <v-card-title class="dialog-header">
            <span>แจ้งปัญหา</span>
            <v-spacer></v-spacer>
            <v-btn icon small @click="closeRepairDialog">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
          <v-form ref="form" v-model="isFormValid">
                <v-select
                  v-model="selectedCategory"
                  :items="categoryOptions"
                  label="หมวดหมู่"
                  :rules="categoryRules"
                  outlined
                  dense
                class="mb-3"
                ></v-select>
                <v-textarea
                  v-model="issue"
                  label="รายละเอียดปัญหา"
                  :rules="issueRules"
                  outlined
                  rows="4"
                class="mb-3"
                ></v-textarea>
                <div class="form-group">
                <label class="form-label">รูปภาพประกอบ</label>
                  <input
                    type="file"
                    ref="fileInput"
                    multiple
                    accept="image/*"
                    @change="handleImageChange"
                    class="form-input"
                  >
                  <div v-if="imagePreview.length > 0" class="image-preview-container">
                    <div v-for="(preview, index) in imagePreview" :key="index" class="image-preview">
                      <img :src="preview" alt="Preview">
                      <v-btn
                        icon
                      x-small
                        color="error"
                        class="remove-image-btn"
                        @click="removeImage(index)"
                      >
                        <v-icon>mdi-close</v-icon>
                      </v-btn>
                    </div>
                  </div>
                </div>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeRepairDialog">ยกเลิก</v-btn>
                  <v-btn
                    color="primary"
                    :loading="loading"
                    :disabled="!isFormValid || loading"
                    @click="handleSubmit"
                  >
                    ส่งเรื่อง
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog สำหรับแก้ไขปัญหา -->
      <v-dialog v-model="showEditDialog" max-width="600px" persistent>
        <v-card>
          <v-card-title class="dialog-header">
            <span>แก้ไขปัญหา</span>
            <v-spacer></v-spacer>
            <v-btn icon small @click="closeRepairDialog">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="isFormValid">
              <v-select
                v-model="selectedCategory"
                :items="categoryOptions"
                label="หมวดหมู่"
                :rules="categoryRules"
                outlined
                dense
                class="mb-3"
              ></v-select>
              <v-textarea
                v-model="issue"
                label="รายละเอียดปัญหา"
                :rules="issueRules"
                outlined
                rows="4"
                class="mb-3"
              ></v-textarea>
              <div class="form-group">
                <label class="form-label">รูปภาพประกอบ</label>
                <input
                  type="file"
                  ref="fileInput"
                  multiple
                  accept="image/*"
                  @change="handleImageChange"
                  class="form-input"
                >
                <div v-if="imagePreview.length > 0" class="image-preview-container">
                  <div v-for="(preview, index) in imagePreview" :key="index" class="image-preview">
                    <img :src="preview" alt="Preview">
                    <v-btn
                      icon
                      x-small
                      color="error"
                      class="remove-image-btn"
                      @click="removeImage(index)"
                    >
                      <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
                </div>
              </div>
          </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeRepairDialog">ยกเลิก</v-btn>
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="!isFormValid || loading"
              @click="handleSubmit"
            >
              บันทึก
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog สำหรับยืนยันการลบ -->
      <v-dialog v-model="showDeleteDialog" max-width="400px">
        <v-card>
          <v-card-title class="dialog-header">
            <span>ยืนยันการลบ</span>
            <v-spacer></v-spacer>
            <v-btn icon small @click="showDeleteDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <p>คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</p>
            <p class="text-gray-500 text-sm mt-2" v-if="repairToDelete">
              {{ repairToDelete.issue }}
            </p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showDeleteDialog = false">ยกเลิก</v-btn>
            <v-btn
              color="error"
              :loading="loading"
              :disabled="loading"
              @click="handleDelete"
            >
              ลบ
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog สำหรับดูรายละเอียด -->
      <v-dialog v-model="showDetailsDialog" max-width="700px">
        <v-card v-if="selectedRepair">
          <v-card-title class="dialog-header">
            <span>รายละเอียดการแจ้งปัญหา</span>
            <v-spacer></v-spacer>
            <v-btn icon small @click="showDetailsDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
              </v-card-title>
          <v-card-text>
            <div class="detail-section">
              <div class="detail-item">
                <label>วันที่แจ้ง:</label>
                <span>{{ formatDate(selectedRepair.report_date || selectedRepair.createdAt) }}</span>
                </div>
              <div class="detail-item">
                <label>หมวดหมู่:</label>
                <v-chip small>{{ getCategoryText(selectedRepair.category) }}</v-chip>
              </div>
              <div class="detail-item">
                <label>รายละเอียดปัญหา:</label>
                <p class="issue-detail">{{ selectedRepair.issue }}</p>
              </div>
              <div class="detail-item">
                <label>สถานะ:</label>
                <v-chip
                  small
                  :class="getStatusChipClass(selectedRepair.status)"
                >
                  {{ getStatusText(selectedRepair.status) }}
                </v-chip>
              </div>
              <div v-if="selectedRepair.images && selectedRepair.images.length > 0" class="detail-item">
                <label>รูปภาพ:</label>
                <div class="image-grid">
                      <img 
                    v-for="(image, index) in selectedRepair.images"
                    :key="index"
                        :src="image"
                    @click="viewImages(selectedRepair.images)"
                    class="detail-image"
                      />
                    </div>
                  </div>
                </div>
              </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="showDetailsDialog = false">ปิด</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog สำหรับดูรูปภาพ -->
      <v-dialog v-model="imageDialog" max-width="800px">
        <v-card>
          <v-card-title class="dialog-header">
            <span>รูปภาพประกอบ</span>
            <v-spacer></v-spacer>
            <v-btn icon small @click="imageDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text class="text-center">
            <img
              v-if="selectedImages.length > 0"
              :src="selectedImages[0]"
              alt="รูปภาพปัญหา"
              class="dialog-image"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="imageDialog = false">ปิด</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Dialog สำหรับแก้ไขปัญหา -->
      <v-dialog v-model="showEditDialog" max-width="600px" persistent>
        <v-card>
          <v-card-title class="dialog-header">
            <span>แก้ไขปัญหา</span>
            <v-spacer></v-spacer>
            <v-btn icon small @click="closeRepairDialog">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="isFormValid">
              <v-select
                v-model="selectedCategory"
                :items="categoryOptions"
                label="หมวดหมู่"
                :rules="categoryRules"
                outlined
                dense
                class="mb-3"
              ></v-select>
              <v-textarea
                v-model="issue"
                label="รายละเอียดปัญหา"
                :rules="issueRules"
                outlined
                rows="4"
                class="mb-3"
              ></v-textarea>
              <div class="form-group">
                <label class="form-label">รูปภาพประกอบ</label>
                <input
                  type="file"
                  ref="fileInput"
                  multiple
                  accept="image/*"
                  @change="handleImageChange"
                  class="form-input"
                >
                <div v-if="imagePreview.length > 0" class="image-preview-container">
                  <div v-for="(preview, index) in imagePreview" :key="index" class="image-preview">
                    <img :src="preview" alt="Preview">
                    <v-btn
                      icon
                      x-small
                      color="error"
                      class="remove-image-btn"
                      @click="removeImage(index)"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                  </div>
                </div>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeRepairDialog">ยกเลิก</v-btn>
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="!isFormValid || loading"
              @click="handleSubmit"
            >
              บันทึก
            </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

      <!-- Dialog สำหรับยืนยันการลบ -->
      <v-dialog v-model="showDeleteDialog" max-width="400px">
          <v-card>
          <v-card-title class="dialog-header">
            <span>ยืนยันการลบ</span>
            <v-spacer></v-spacer>
            <v-btn icon small @click="showDeleteDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <p>คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?</p>
            <p class="text-gray-500 text-sm mt-2" v-if="repairToDelete">
              {{ repairToDelete.issue }}
            </p>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
            <v-btn text @click="showDeleteDialog = false">ยกเลิก</v-btn>
            <v-btn
              color="error"
              :loading="loading"
              :disabled="loading"
              @click="handleDelete"
            >
              ลบ
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

      <!-- Filter Dialog -->
      <v-dialog v-model="showFilterDialog" max-width="400px">
        <v-card>
          <v-card-title>กรองข้อมูล</v-card-title>
          <v-card-text>
            <v-select
              v-model="filterStatus"
              :items="statusOptions"
              label="สถานะ"
              outlined
              dense
              clearable
            ></v-select>
            <v-select
              v-model="filterCategory"
              :items="categoryOptions"
              label="หมวดหมู่"
              outlined
              dense
              clearable
            ></v-select>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="clearFilters">ล้าง</v-btn>
            <v-btn color="primary" @click="showFilterDialog = false">ตกลง</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
    </div>
  </LayoutUser>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import LayoutUser from '@/components/LayoutUser.vue'
import axios from 'axios'
import { format } from 'date-fns'

// Form refs and data
const form = ref(null)
const isFormValid = ref(false)
const loading = ref(false)
const selectedCategory = ref('')
const issue = ref('')
const images = ref([])
const imagePreview = ref([])
const repairHistory = ref([])
const imageDialog = ref(false)
const selectedImages = ref([])
const fileInput = ref(null)
const showRepairDialog = ref(false)
const showEditDialog = ref(false)
const showDetailsDialog = ref(false)
const showFilterDialog = ref(false)
const showDeleteDialog = ref(false)
const selectedRepair = ref(null)
const repairToDelete = ref(null)
const isEditMode = ref(false)
const searchQuery = ref('')
const filterStatus = ref(null)
const filterCategory = ref(null)

// Pagination
const pageSize = 10
const currentPage = ref(1)

// Options
const categoryOptions = [
  'อุปกรณ์ไฟฟ้า',
  'ระบบน้ำ',
  'โครงสร้างอาคาร',
  'ความสะอาด',
  'อื่นๆ'
]

const statusOptions = [
  { text: 'รอดำเนินการ', value: 'pending' },
  { text: 'กำลังดำเนินการ', value: 'in_progress' },
  { text: 'เสร็จสิ้น', value: 'completed' },
  { text: 'ยกเลิก', value: 'cancelled' }
]

// Rules
const categoryRules = [v => !!v || 'กรุณาเลือกหมวดหมู่']
const issueRules = [v => !!v || 'กรุณากรอกรายละเอียดปัญหา']

// Computed
const filteredRepairs = computed(() => {
  let result = repairHistory.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(repair =>
      repair.issue.toLowerCase().includes(query) ||
      repair.category.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (filterStatus.value) {
    result = result.filter(repair => repair.status === filterStatus.value)
  }

  // Filter by category
  if (filterCategory.value) {
    result = result.filter(repair => repair.category === filterCategory.value)
  }

  return result
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRepairs.value.length / pageSize)))

const paginatedRepairs = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredRepairs.value.slice(start, start + pageSize)
})

const startIndex = computed(() => {
  if (filteredRepairs.value.length === 0) return 0
  return (currentPage.value - 1) * pageSize + 1
})

const endIndex = computed(() => {
  return Math.min(currentPage.value * pageSize, filteredRepairs.value.length)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const openRepairDialog = () => {
  showRepairDialog.value = true
}

const closeRepairDialog = () => {
  showRepairDialog.value = false
  showEditDialog.value = false
  isEditMode.value = false
  if (form.value) {
    form.value.reset()
  }
  selectedCategory.value = ''
  issue.value = ''
  images.value = []
  imagePreview.value = []
  selectedRepair.value = null
}

const canEdit = (repair) => {
  return repair.status === 'pending' || repair.status === 'รอดำเนินการ'
}

const canDelete = (repair) => {
  return repair.status === 'pending' || repair.status === 'รอดำเนินการ'
}

const openEditDialog = (repair) => {
  selectedRepair.value = repair
  selectedCategory.value = repair.category
  issue.value = repair.issue
  images.value = []
  imagePreview.value = []
  
  // ถ้ามีรูปภาพเดิม ให้แสดง preview
  if (repair.images && repair.images.length > 0) {
    imagePreview.value = [...repair.images]
  }
  
  isEditMode.value = true
  showEditDialog.value = true
}

const confirmDelete = (repair) => {
  repairToDelete.value = repair
  showDeleteDialog.value = true
}

const handleImageChange = (event) => {
  const files = Array.from(event.target.files)
  images.value = [...images.value, ...files]
  
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value.push(e.target.result)
    }
    reader.readAsDataURL(file)
  })
}

const removeImage = (index) => {
  images.value.splice(index, 1)
  imagePreview.value.splice(index, 1)
}

const handleSubmit = async () => {
  if (!selectedCategory.value || !issue.value) {
    const missingFields = []
    if (!selectedCategory.value) missingFields.push('หมวดหมู่')
    if (!issue.value) missingFields.push('รายละเอียดปัญหา')
    alert(`กรุณากรอก${missingFields.join(' และ ')}`)
    return
  }

  loading.value = true

  try {
    const formData = new FormData()
    formData.append('category', selectedCategory.value)
    formData.append('issue', issue.value)
    
    // ส่งรูปภาพใหม่ (ถ้ามี)
    if (images.value.length > 0) {
      images.value.forEach((file) => {
        formData.append('images', file)
      })
    }

    // ใช้ axios interceptor (validate token อัตโนมัติ)
    let response

    if (isEditMode.value && selectedRepair.value) {
      // แก้ไขรายการ
      response = await axios.put(`/api/repairs/${selectedRepair.value._id}`, formData, {
      headers: { 
          'Content-Type': 'multipart/form-data'
      }
    })

      if (response.data && response.data.success) {
        // อัปเดตรายการใน list โดยตรง
        const updatedRepair = response.data.data
        const repairId = selectedRepair.value._id || selectedRepair.value.id
        
        const index = repairHistory.value.findIndex(
          r => (r._id === repairId || r.id === repairId)
        )
        
        if (index !== -1) {
          // อัปเดตรายการใน array โดยแทนที่ข้อมูลทั้งหมด
          repairHistory.value[index] = {
            ...repairHistory.value[index],
            ...updatedRepair,
            category: updatedRepair.category,
            issue: updatedRepair.issue,
            images: updatedRepair.images || updatedRepair.imagePaths || [],
            imagePaths: updatedRepair.imagePaths || updatedRepair.images || []
          }
        } else {
          // ถ้าไม่เจอ ให้ refresh ทั้งหมด
          await fetchRepairHistory()
        }
        
        closeRepairDialog()
        alert('อัปเดตรายการแจ้งซ่อมเรียบร้อยแล้ว')
      }
    } else {
      // สร้างรายการใหม่
      response = await axios.post('/api/repairs', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data && response.data.success && response.data.data) {
        const newRepair = response.data.data
        // เพิ่มรายการใหม่ที่ด้านบน
        repairHistory.value = [newRepair, ...repairHistory.value]
        
        closeRepairDialog()
      alert('บันทึกการแจ้งซ่อมเรียบร้อยแล้ว')
      }
    }
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    alert(error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง')
  } finally {
    loading.value = false
  }
}

const handleDelete = async () => {
  if (!repairToDelete.value) return

  loading.value = true

  try {
    // ใช้ axios interceptor (validate token อัตโนมัติ)
    const response = await axios.delete(`/api/repairs/${repairToDelete.value._id}`)

    if (response.data && response.data.success) {
      // ลบรายการออกจาก list
      repairHistory.value = repairHistory.value.filter(
        repair => repair._id !== repairToDelete.value._id
      )
      
      showDeleteDialog.value = false
      repairToDelete.value = null
      alert('ลบรายการแจ้งซ่อมเรียบร้อยแล้ว')
    }
  } catch (error) {
    console.error('Error deleting repair:', error)
    alert(error.response?.data?.message || error.message || 'เกิดข้อผิดพลาดในการลบข้อมูล')
  } finally {
    loading.value = false
  }
}

const fetchRepairHistory = async () => {
  try {
    loading.value = true
    // ใช้ axios interceptor (validate token อัตโนมัติ)
    const response = await axios.get('/api/repairs/user')
    
    if (response.data && Array.isArray(response.data)) {
      repairHistory.value = response.data
    } else if (response.data && Array.isArray(response.data.data)) {
      repairHistory.value = response.data.data
    } else {
      repairHistory.value = []
    }
  } catch (error) {
    console.error('Error fetching repair history:', error)
    repairHistory.value = []
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  return format(new Date(date), 'dd/MM/yyyy HH:mm')
}

const formatDateOnly = (date) => {
  return format(new Date(date), 'dd/MM/yyyy')
}

const formatTime = (date) => {
  return format(new Date(date), 'HH:mm') + ' น.'
}

const getStatusChipClass = (status) => {
  const statusClasses = {
    'pending': 'status-pending',
    'in_progress': 'status-progress',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled',
    'รอดำเนินการ': 'status-pending',
    'กำลังดำเนินการ': 'status-progress',
    'ซ่อมแล้ว': 'status-completed',
    'เสร็จสิ้น': 'status-completed',
    'ยกเลิก': 'status-cancelled'
  }
  return statusClasses[status] || 'status-pending'
}

const getStatusText = (status) => {
  const statusTexts = {
    'pending': 'รอดำเนินการ',
    'in_progress': 'กำลังดำเนินการ',
    'completed': 'เสร็จสิ้น',
    'cancelled': 'ยกเลิก',
    'รอดำเนินการ': 'รอดำเนินการ',
    'กำลังดำเนินการ': 'กำลังดำเนินการ',
    'ซ่อมแล้ว': 'เสร็จสิ้น',
    'เสร็จสิ้น': 'เสร็จสิ้น',
    'ยกเลิก': 'ยกเลิก'
  }
  return statusTexts[status] || 'รอดำเนินการ'
}

const getCategoryText = (category) => {
  return category
}

const viewRepairDetails = (repair) => {
  selectedRepair.value = repair
  showDetailsDialog.value = true
}

const viewImages = (images) => {
  selectedImages.value = images
  imageDialog.value = true
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const clearFilters = () => {
  filterStatus.value = null
  filterCategory.value = null
  searchQuery.value = ''
  currentPage.value = 1
}

// Watch for filter changes to reset page
watch([filterStatus, filterCategory, searchQuery], () => {
  currentPage.value = 1
})

// Fetch repair history on mount
onMounted(async () => {
  await fetchRepairHistory()
})
</script>

<style scoped>
.repair-page {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: calc(100vh - 64px);
}

.page-header {
  margin-bottom: 16px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.filter-btn,
.add-btn {
  text-transform: none;
}

.repair-card {
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-content {
  padding: 16px;
}

.search-section {
  margin-bottom: 16px;
}

.search-input {
  max-width: 400px;
}

.table-wrapper {
  overflow-x: auto;
}

.repair-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.repair-table thead {
  border-bottom: 1px solid #e5e7eb;
}

.repair-table th {
  padding: 12px 8px;
  text-align: left;
  font-weight: 500;
  color: #6b7280;
  font-size: 12px;
}

.repair-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #f3f4f6;
}

.repair-table tbody tr:hover {
  background-color: #f9fafb;
}

.date-cell {
  white-space: nowrap;
}

.time-text {
  font-size: 12px;
  color: #9ca3af;
}

.category-chip {
  background-color: #f3f4f6;
  color: #374151;
}

.issue-cell {
  max-width: 400px;
  word-wrap: break-word;
}

.status-pending {
  background-color: #fef3c7 !important;
  color: #92400e !important;
}

.status-progress {
  background-color: #dbeafe !important;
  color: #1e40af !important;
}

.status-completed {
  background-color: #d1fae5 !important;
  color: #065f46 !important;
}

.status-cancelled {
  background-color: #fee2e2 !important;
  color: #991b1b !important;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  color: #6b7280;
}

.pagination {
  display: flex;
  gap: 4px;
}

.page-btn {
  min-width: 32px;
  height: 32px;
}

/* Dialog Styles */
.dialog-header {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.form-group {
  margin-top: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
}

.image-preview-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.image-preview {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100px;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
}

.detail-section {
  padding: 16px 0;
}

.detail-item {
  margin-bottom: 16px;
}

.detail-item label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
  font-size: 14px;
}

.issue-detail {
  margin: 0;
  padding: 12px;
  background-color: #f9fafb;
  border-radius: 8px;
  color: #374151;
  line-height: 1.6;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.detail-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.detail-image:hover {
  transform: scale(1.05);
}

.dialog-image {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
}

.text-center {
  text-align: center;
}

.text-gray-500 {
  color: #6b7280;
}

.text-gray-400 {
  color: #9ca3af;
}

.text-sm {
  font-size: 12px;
}

.mb-2 {
  margin-bottom: 8px;
}

.py-4 {
  padding-top: 16px;
  padding-bottom: 16px;
}

.mb-3 {
  margin-bottom: 12px;
}

/* Responsive */
@media (max-width: 768px) {
  .repair-page {
    padding: 16px;
}

  .header-content {
    flex-direction: column;
    gap: 16px;
}

  .header-actions {
    width: 100%;
}

  .filter-btn,
  .add-btn {
    flex: 1;
}

  .table-footer {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style> 
