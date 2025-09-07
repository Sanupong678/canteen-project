<template>
  <LayoutUser>
    <div class="news-user-container">
      <div class="section-header">
        <h2 class="section-title">ข่าวและกิจกรรมทั้งหมด</h2>
      </div>

      <div class="news-layout">
        <div class="news-col">
          <!-- News List -->
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
              class="news-card"
              @click="viewNewsDetail(item)"
            >
              <div class="card-image">
                <img 
                  v-if="item.imageFilename" 
                  :src="`${backendUrl}/api/news/${item._id}/image`" 
                  :alt="item.title"
                  class="news-image"
                  @error="handleImageError"
                />
                <div v-else class="news-placeholder">
                  <span>📰</span>
                </div>
              </div>

              <div class="card-body">
                <div v-if="item.sdgs && item.sdgs.length" class="sdgs">
                  <span class="sdgs-label">SDGs :</span>
                  <span v-for="n in item.sdgs" :key="n" class="sdg-badge">{{ n }}</span>
                </div>
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

      <!-- News Detail Modal -->
      <div v-if="selectedNews" class="modal-overlay" @click="closeNewsDetail">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2>{{ selectedNews.title }}</h2>
            <button @click="closeNewsDetail" class="close-btn">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="news-detail-image">
              <img 
                v-if="selectedNews.imageFilename" 
                :src="`${backendUrl}/api/news/${selectedNews._id}/image`" 
                :alt="selectedNews.title"
                @error="handleImageError"
              />
            </div>
            
            <div class="news-detail-content">
              <p>{{ selectedNews.content }}</p>
            </div>
            
            <div class="news-detail-meta">
              <span class="detail-date">
                📅 {{ formatDate(selectedNews.createdAt) }}
              </span>
              <span class="detail-views">
                👁️ {{ selectedNews.views || 0 }} ครั้ง
              </span>
              <span v-if="selectedNews.author" class="detail-author">
                👤 {{ selectedNews.author }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </LayoutUser>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import LayoutUser from '@/components/LayoutUser.vue'
import axios from 'axios'

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

// กำหนด backend URL
const backendUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-domain.com' 
  : 'http://localhost:4000'

// Fetch news from API
const loadNews = async () => {
  try {
    loading.value = true
    const response = await axios.get(`${backendUrl}/api/news`)
    if (response.data.success) {
      news.value = (response.data.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      // group by year for sidebar
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

// View news detail
const viewNewsDetail = async (item) => {
  try {
    // Fetch full news detail to increment views
    const response = await axios.get(`${backendUrl}/api/news/${item._id}`)
    if (response.data.success) {
      selectedNews.value = response.data.data
      
      // Update the news item in the list with updated data
      const index = news.value.findIndex(n => n._id === item._id)
      if (index !== -1) {
        news.value[index] = response.data.data
      }
    }
  } catch (error) {
    console.error('Error fetching news detail:', error)
    // Fallback to show the item without incrementing views
    selectedNews.value = item
  }
}

// Close news detail modal
const closeNewsDetail = () => {
  selectedNews.value = null
}

// Handle image error
const handleImageError = (event) => {
  event.target.style.display = 'none'
  const placeholder = event.target.parentElement.querySelector('.news-placeholder')
  if (placeholder) {
    placeholder.style.display = 'flex'
  }
}

// Truncate content
const truncateContent = (content, maxLength) => {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

// Format date (DD/MM/YYYY)
const formatDate = (dateString) => {
  try {
    const d = new Date(dateString)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  } catch (e) {
    return ''
  }
}

// Load news when component mounts
onMounted(() => {
  loadNews()
})

// Pagination computed values
const totalPages = computed(() => Math.max(1, Math.ceil(news.value.length / itemsPerPage)))
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
</script>

<style scoped>
.news-user-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 30px 0;
  background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
  color: white;
  border-radius: 12px;
}

.header h1 {
  margin: 0 0 10px 0;
  font-size: 2.5rem;
  font-weight: 700;
}

.subtitle {
  margin: 0;
  font-size: 1.1rem;
  opacity: 0.9;
}

/* Section header like reference style */
.section-header { display: block; margin: 0 0 16px 0; }
.section-title { font-size: 28px; font-weight: 800; color: #111827; margin: 0; line-height: 1; padding-bottom: 6px; border-bottom: 6px solid #dc2626; }

.loading {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-news {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.no-news-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 20px;
}

.no-news h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.news-layout { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; }
.news-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }

.news-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.06);
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  gap: 20px;
  align-items: center;
}

.news-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.12);
}

/* Card grid style like reference image */
.news-card {
  background: transparent;
  border-radius: 0;
  border: none;
  box-shadow: none;
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
}

.news-card:hover {
  transform: none;
}

.card-image {
  width: 100%;
  height: 180px;
  background: #f5f5f5;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
  margin-bottom: 10px;
}

.news-card:hover .card-image {
  box-shadow: 0 12px 28px rgba(0,0,0,0.14);
  transform: translateY(-2px);
}

.news-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.news-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #ccc;
}

.card-body {
  padding: 14px 16px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sdgs { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; color: #64748b; }
.sdgs-label { font-weight: 600; color: #334155; }
.sdg-badge { background: #eef2ff; color: #3730a3; border: 1px solid #e0e7ff; padding: 2px 6px; border-radius: 6px; font-weight: 600; }

.card-title { margin: 0; color: #0f172a; font-size: 1.05rem; font-weight: 700; line-height: 1.4; }
.card-excerpt { margin: 0; color: #475569; line-height: 1.6; font-size: 0.95rem; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.card-meta { display: flex; gap: 12px; flex-wrap: wrap; color: #64748b; font-size: 0.85rem; margin-top: 4px; }
.meta-item { display: inline-flex; align-items: center; gap: 4px; }

.news-arrow {
  flex-shrink: 0;
  font-size: 1.5rem;
  color: #ccc;
  transition: color 0.3s;
}

.news-item:hover .news-arrow {
  color: #667eea;
}

/* Pagination */
.pagination {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-top: 24px;
}

.page-btn {
  padding: 8px 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-num {
  width: 36px;
  height: 36px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
}

.page-num.active {
  background: #0ea5e9;
  color: #fff;
  border-color: #0ea5e9;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
}

.news-detail-image {
  margin-bottom: 20px;
  text-align: center;
}

.news-detail-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.news-detail-content {
  margin-bottom: 20px;
}

.news-detail-content p {
  color: #333;
  line-height: 1.8;
  font-size: 1.1rem;
  margin: 0;
}

.news-detail-meta {
  display: flex;
  gap: 20px;
  font-size: 0.9rem;
  color: #888;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  flex-wrap: wrap;
}

/* Right column: year accordion */
.years-col { position: sticky; top: 16px; }
.years-title { margin: 0 0 12px 0; font-size: 24px; font-weight: 800; color: #111827; }
.years-list { display: grid; gap: 8px; }
.year-item { background: transparent; color: inherit; border-radius: 8px; }
.year-header { width: 100%; background: #1f2937; border: none; color: #e5e7eb; display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; cursor: pointer; font-weight: 700;}
.year-caret { transition: transform 0.2s ease; }
.year-caret.open { transform: rotate(180deg); }
.year-content { list-style: none; padding: 8px 2px 0 2px; margin: 0; display: grid; gap: 8px; background: transparent; }
.year-month { display: flex; }
.month-btn { width: 100%; background: #ffffff; color: #0f172a; border: 1px solid #e5e7eb; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
.month-btn:hover { background: #f8fafc; }
.month-label { font-weight: 70; }
.month-count { background: #ef4444; color: #fff; border-radius: 999px; min-width: 28px; height: 22px; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; padding: 0 6px; }

@media (max-width: 1024px) {
  .news-list { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .news-layout { grid-template-columns: 1fr; }
  .news-list { grid-template-columns: 1fr; }
  .card-image { height: 200px; }
  .card-meta { justify-content: center; }
  .modal-content { margin: 10px; }
}
</style> 