<template>
  <LayoutAdmin>
    <div class="news-admin-container">
      <div class="section-header admin-header">
        <h2 class="section-title">จัดการข่าวและกิจกรรม</h2>
        <div class="actions">
          <v-btn color="primary" @click="openCreateDialog">สร้างข่าวใหม่</v-btn>
          <v-btn outlined @click="showAllNews">ข่าวทั้งหมด</v-btn>
        </div>
      </div>

      <div class="news-layout">
        <div class="news-col">
          <div v-if="loading" class="loading">
            <div class="spinner"></div>
            <p>กำลังโหลดข่าวสาร...</p>
          </div>

          <div v-else-if="news.length === 0" class="no-news">
            <span class="no-news-icon">📰</span>
            <h3>ไม่มีข่าวสาร</h3>
            <p>ยังไม่มีข่าวสารหรือประกาศใดๆ</p>
          </div>

          <div v-else class="news-list">
            <div 
              v-for="item in paginatedNews" 
              :key="item._id" 
              class="news-card admin-card"
            >
              <div class="card-image">
                <img 
                  v-if="item.imageFilename" 
                  :src="getNewsImageUrl(item._id)" 
                  :alt="item.title"
                  class="news-image"
                  @error="handleImageError"
                />
                <div v-else class="news-placeholder">
                  <span>📰</span>
                </div>
                <div class="card-actions">
                  <v-btn icon small @click="editNews(item)"><v-icon>mdi-pencil</v-icon></v-btn>
                  <v-btn icon small color="error" @click="confirmDelete(item)"><v-icon>mdi-delete</v-icon></v-btn>
                </div>
              </div>

              <div class="card-body">
                <h3 class="card-title">{{ item.title }}</h3>
                <p class="card-excerpt">{{ truncateContent(item.content, 120) }}</p>
                <div class="card-meta">
                  <span class="meta-item">{{ formatDate(item.createdAt) }}</span>
                  <span v-if="item.author" class="meta-item">👤 {{ item.author }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="pagination">
            <button class="page-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">ก่อนหน้า</button>
            <button 
              v-for="p in totalPages" 
              :key="p" 
              class="page-num" 
              :class="{ active: p === currentPage }" 
              @click="goToPage(p)"
            >{{ p }}</button>
            <button class="page-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">ถัดไป</button>
          </div>
        </div>

        <aside class="years-col">
          <h3 class="years-title">ข่าวย้อนหลัง</h3>
          <div class="years-list">
            <div v-for="year in years" :key="year" class="year-item">
              <button class="year-header" @click="toggleYear(year)">
                <span class="year-label">{{ year }}</span>
                <span class="year-caret" :class="{ open: yearOpen[year] }">▾</span>
              </button>
              <ul v-if="yearOpen[year]" class="year-content">
                <li v-for="m in monthsOfYear(year)" :key="m" class="year-month">
                  <button class="month-btn" @click="filterByYearMonth(year, m)">
                    <span class="month-label">{{ getMonthName(m) }}</span>
                    <span class="month-count">{{ (yearMonthGroups[year]?.[m] || []).length }}</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>

      <!-- Edit/Create Dialog -->
      <v-dialog v-model="editDialog" max-width="700px">
        <v-card>
          <v-card-title>{{ isCreating ? 'สร้างข่าวใหม่' : 'แก้ไขข่าว' }}</v-card-title>
          <v-card-text>
            <v-form ref="form" v-model="isFormValid">
              <v-text-field v-model="formTitle" label="หัวข้อ" outlined dense required></v-text-field>
              <v-textarea v-model="formContent" label="เนื้อหา" outlined rows="6" required></v-textarea>
              <div class="form-group">
                <label class="form-label">รูปภาพประกอบ</label>
                <input type="file" ref="fileInput" @change="onFileChange" accept="image/*">
                <div v-if="imagePreview" class="image-preview-small">
                  <img :src="imagePreview" alt="preview" />
                </div>
              </div>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="closeEditDialog">ยกเลิก</v-btn>
            <v-btn color="primary" @click="saveNews" :loading="saving">บันทึก</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Delete Confirm -->
      <v-dialog v-model="deleteDialog" max-width="400px">
        <v-card>
          <v-card-title>ลบข่าว</v-card-title>
          <v-card-text>คุณแน่ใจหรือไม่ว่าต้องการลบข่าวนี้?</v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="deleteDialog = false">ยกเลิก</v-btn>
            <v-btn color="error" @click="deleteNews" :loading="saving">ลบ</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </LayoutAdmin>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import LayoutAdmin from '@/components/LayoutAdmin.vue'
import axios from 'axios'

const getBackendBaseUrl = () => {
  const fromAxios = axios.defaults.baseURL || ''
  if (fromAxios) return fromAxios.replace(/\/$/, '')
  return process.client ? window.location.origin : ''
}

const getNewsImageUrl = (id) => `${getBackendBaseUrl()}/api/news/${id}/image`

const news = ref([])
const loading = ref(true)
const selectedNews = ref(null)
const currentPage = ref(1)
const itemsPerPage = 9
const yearGroups = ref({})
const yearMonthGroups = ref({})
const years = ref([])
const yearOpen = ref({})
const filter = ref({ year: null, month: null })

const editDialog = ref(false)
const deleteDialog = ref(false)
const isCreating = ref(false)
const formTitle = ref('')
const formContent = ref('')
const imageFile = ref(null)
const imagePreview = ref(null)
const isFormValid = ref(false)
const saving = ref(false)
const fileInput = ref(null)

const loadNews = async () => {
  try {
    loading.value = true
    const response = await axios.get('/api/news')
    if (response.data.success) {
      news.value = (response.data.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      // group by year/month
      const groups = {}
      const ymGroups = {}
      for (const n of news.value) {
        const y = new Date(n.createdAt).getFullYear()
        const m = new Date(n.createdAt).getMonth() + 1
        if (!groups[y]) groups[y] = []
        groups[y].push(n)
        if (!ymGroups[y]) ymGroups[y] = {}
        if (!ymGroups[y][m]) ymGroups[y][m] = []
        ymGroups[y][m].push(n)
      }
      yearGroups.value = groups
      yearMonthGroups.value = ymGroups
      years.value = Object.keys(groups).map(y => parseInt(y)).sort((a,b) => b - a)
      const openObj = {}
      for (const y of years.value) openObj[y] = false
      yearOpen.value = openObj
    }
  } catch (error) {
    console.error('Error loading news:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadNews()
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredNews.value.length / itemsPerPage)))
const filteredNews = computed(() => {
  if (!filter.value.year || !filter.value.month) return news.value
  const ym = yearMonthGroups.value[filter.value.year]?.[filter.value.month] || []
  return ym
})

const paginatedNews = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredNews.value.slice(start, start + itemsPerPage)
})

const goToPage = (p) => {
  if (p < 1 || p > totalPages.value) return
  currentPage.value = p
}

const toggleYear = (y) => {
  yearOpen.value[y] = !yearOpen.value[y]
}

const monthsOfYear = (y) => {
  const dict = yearMonthGroups.value[y] || {}
  return Object.keys(dict).map(n => parseInt(n)).sort((a,b) => b - a)
}

const getMonthName = (m) => {
  const names = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
  return names[m-1]
}

const filterByYearMonth = (y, m) => {
  filter.value = { year: y, month: m }
  currentPage.value = 1
}

const truncateContent = (content, maxLength) => {
  if (!content) return ''
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

const formatDate = (dateString) => {
  try {
    const d = new Date(dateString)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  } catch (e) { return '' }
}

const openCreateDialog = () => {
  isCreating.value = true
  selectedNews.value = null
  formTitle.value = ''
  formContent.value = ''
  imagePreview.value = null
  editDialog.value = true
}

const editNews = (item) => {
  isCreating.value = false
  selectedNews.value = item
  formTitle.value = item.title || ''
  formContent.value = item.content || ''
  imagePreview.value = item.imageFilename ? getNewsImageUrl(item._id) : null
  editDialog.value = true
}

const closeEditDialog = () => {
  editDialog.value = false
  isCreating.value = false
}

const onFileChange = (e) => {
  const f = e.target.files && e.target.files[0]
  if (f) {
    imageFile.value = f
    const reader = new FileReader()
    reader.onload = (ev) => { imagePreview.value = ev.target.result }
    reader.readAsDataURL(f)
  }
}

const saveNews = async () => {
  if (!formTitle.value || !formContent.value) {
    alert('กรุณากรอกหัวข้อและเนื้อหา')
    return
  }
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('title', formTitle.value)
    fd.append('content', formContent.value)
    if (imageFile.value) fd.append('image', imageFile.value)

    let res
    if (isCreating.value) {
      res = await axios.post('/api/news', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    } else if (selectedNews.value) {
      res = await axios.put(`/api/news/${selectedNews.value._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    }

    if (res && res.data && res.data.success) {
      await loadNews()
      closeEditDialog()
      alert('บันทึกเรียบร้อย')
    }
  } catch (err) {
    console.error('Save news error', err)
    alert(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด')
  } finally { saving.value = false }
}

const confirmDelete = (item) => {
  selectedNews.value = item
  deleteDialog.value = true
}

const deleteNews = async () => {
  if (!selectedNews.value) return
  saving.value = true
  try {
    const res = await axios.delete(`/api/news/${selectedNews.value._id}`)
    if (res.data && res.data.success) {
      await loadNews()
      deleteDialog.value = false
      alert('ลบเรียบร้อย')
    }
  } catch (err) {
    console.error('Delete news', err)
    alert(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาด')
  } finally { saving.value = false }
}

const showAllNews = () => {
  filter.value = { year: null, month: null }
  currentPage.value = 1
}

const handleImageError = (event) => {
  event.target.style.display = 'none'
  const placeholder = event.target.parentElement.querySelector('.news-placeholder')
  if (placeholder) placeholder.style.display = 'flex'
}
</script>

<style scoped>
/* reuse styles from user page with minor admin tweaks */
.news-admin-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
.admin-header { display:flex; justify-content:space-between; align-items:center; gap:12px }
.actions { display:flex; gap:8px }
.news-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; }
.news-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.admin-card { position: relative; }
.card-actions { position: absolute; right: 8px; top: 8px; display:flex; gap:4px }
.image-preview-small img { max-width: 100%; max-height: 160px; display:block }
.no-news { text-align:center; padding:60px 20px }
.pagination { margin-top: 16px; display:flex; gap:6px }

/* Cards / images */
.card-image { width: 100%; aspect-ratio: 16 / 9; background: #f5f5f5; overflow: hidden; border-radius: 12px; }
.news-image { width: 100%; height: 100%; object-fit: cover; display: block; }
.news-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #ccc; background: #f5f5f5; }

/* Pagination touch targets (>= 44px) */
.page-btn { min-height: 44px; min-width: 44px; padding: 0 12px; border-radius: 6px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.page-num { min-height: 44px; min-width: 44px; padding: 0; border-radius: 6px; border: 1px solid #e5e7eb; background: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.page-num.active { background: #0ea5e9; color: #fff; border-color: #0ea5e9; }

/* Tablet */
@media (max-width: 1024px) {
  .news-layout { grid-template-columns: 1fr 280px; }
  .news-list { grid-template-columns: repeat(2, 1fr); }
}

/* Mobile */
@media (max-width: 768px) {
  .news-admin-container { padding: 16px; }
  .news-layout { grid-template-columns: 1fr; gap: 16px; }
  .news-list { grid-template-columns: 1fr; gap: 16px; }
  .admin-header { flex-direction: column; align-items: flex-start; }
  .actions { width: 100%; flex-wrap: wrap; }
}
</style>
