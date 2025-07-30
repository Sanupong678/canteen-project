<template>
  <LayoutUser>
    <div class="news-user-container">
      <div class="header">
        <h1>📰 ข่าวสารและประกาศ</h1>
        <p class="subtitle">ติดตามข่าวสารและประกาศล่าสุดจากระบบ</p>
      </div>

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
          v-for="item in news" 
          :key="item._id" 
          class="news-item"
          @click="viewNewsDetail(item)"
        >
          <div class="news-image-container">
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
          
          <div class="news-content">
            <h3 class="news-title">{{ item.title }}</h3>
            <p class="news-excerpt">{{ truncateContent(item.content, 150) }}</p>
            
            <div class="news-meta">
              <span class="news-date">
                📅 {{ formatDate(item.createdAt) }}
              </span>
              <span class="news-views">
                👁️ {{ item.views || 0 }} ครั้ง
              </span>
            </div>
          </div>
          
          <div class="news-arrow">
            <span>→</span>
          </div>
        </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  </LayoutUser>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LayoutUser from '@/components/LayoutUser.vue'
import axios from 'axios'

const news = ref([])
const loading = ref(true)
const selectedNews = ref(null)

// กำหนด backend URL
const backendUrl = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-domain.com' 
  : 'http://localhost:4000'

// Fetch news from API
const loadNews = async () => {
  try {
    loading.value = true
    const response = await axios.get(`${backendUrl}/api/news`)
    news.value = response.data.data
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
    selectedNews.value = response.data.data
    
    // Update the news item in the list with updated data
    const index = news.value.findIndex(n => n._id === item._id)
    if (index !== -1) {
      news.value[index] = response.data.data
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

// Format date
const formatDate = (dateString) => {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }
  return new Date(dateString).toLocaleDateString('th-TH', options)
}

// Load news when component mounts
onMounted(() => {
  loadNews()
})
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.news-list {
  display: grid;
  gap: 20px;
}

.news-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  gap: 20px;
  align-items: center;
}

.news-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.news-image-container {
  flex-shrink: 0;
  width: 120px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
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

.news-content {
  flex: 1;
  min-width: 0;
}

.news-title {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.4;
}

.news-excerpt {
  margin: 0 0 15px 0;
  color: #666;
  line-height: 1.6;
}

.news-meta {
  display: flex;
  gap: 15px;
  font-size: 0.9rem;
  color: #888;
}

.news-arrow {
  flex-shrink: 0;
  font-size: 1.5rem;
  color: #ccc;
  transition: color 0.3s;
}

.news-item:hover .news-arrow {
  color: #667eea;
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
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }
  
  .news-item {
    flex-direction: column;
    text-align: center;
  }
  
  .news-image-container {
    width: 100%;
    height: 200px;
  }
  
  .news-arrow {
    display: none;
  }
  
  .news-meta {
    justify-content: center;
  }
  
  .modal-content {
    margin: 10px;
  }
}
</style> 