<template>
  <LayoutUser>
    <div class="ranking-page">

      <!-- Header -->
      <div class="page-header">
        <div class="header-text">
          <h1 class="page-title">การจัดอันดับ</h1>
          <p class="page-subtitle">สรุปคะแนนเฉลี่ยขอเดือน {{ currentMonthName }}</p>
        </div>
        <div class="header-actions">
          <GuidePopup
            storage-key="user-ranking-guide"
            title="คู่มือหน้าการจัดอันดับ"
            intro="ทำความเข้าใจคะแนนและรายได้รายเดือนของร้านจากหน้านี้"
            :steps="rankingGuideSteps"
          />
        </div>
      </div>

      <!-- Metric Cards -->
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">รายได้เดือนนี้</div>
          <div class="metric-value money">
            {{ currentData.hasCurrentMonthUpdate ? '฿' + formatMoney(currentData.money) : 'รออัปเดต' }}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-label">คะแนนเฉลี่ย</div>
          <div class="metric-value score">{{ formatScore(currentData.score) }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">สถานะ</div>
          <div class="metric-value" style="padding-top: 4px;">
            <span
              v-if="currentData.hasCurrentMonthUpdate"
              class="badge"
              :class="scoreStatusClass(currentData.score)"
            >
              {{ getScoreStatusLabel(currentData.score) }}
            </span>
            <span v-else class="badge badge-pending">รออัปเดต</span>
          </div>
        </div>
      </div>

      <!-- History Table -->
      <div class="section" v-if="moneyHistory && moneyHistory.length >= 0">
        <div class="section-header">ประวัติรายได้และคะแนน</div>
        <div class="table-wrapper">
          <table class="history-table">
            <thead>
              <tr>
                <th>เดือน/ปี</th>
                <th>รายได้</th>
                <th>คะแนน</th>
                <th>สถานะ</th>
                <th>วันที่อัปเดต</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in moneyHistory" :key="`${item.year}-${item.month}`">
                <td>{{ getMonthName(item.month) }} {{ item.year }}</td>
                <td class="revenue-cell">
                  {{ item.revenue === null || item.revenue === undefined ? '—' : '฿' + formatMoney(item.revenue) }}
                </td>
                <td class="score-cell">
                  {{ item.score === null || item.score === undefined ? '—' : formatScore(item.score) }}
                </td>
                <td>
                  <span class="badge" :class="scoreStatusClass(item.score)">
                    {{ getScoreStatusLabel(item.score) }}
                  </span>
                </td>
                <td>
                  <div v-if="item.uploadedAt || item.evaluatedAt" class="date-info">
                    <div v-if="item.uploadedAt">
                      <span class="date-label">รายได้:</span> {{ formatDate(item.uploadedAt) }}
                    </div>
                    <div v-if="item.evaluatedAt">
                      <span class="date-label">คะแนน:</span> {{ formatDate(item.evaluatedAt) }}
                    </div>
                  </div>
                  <span v-else class="empty-cell">—</span>
                </td>
              </tr>
              <tr v-if="moneyHistory.length === 0">
                <td colspan="5" class="no-data-cell">
                  <div class="no-data">
                    <i class="fas fa-inbox"></i>
                    <p>ยังไม่มีข้อมูลประวัติรายได้และคะแนน</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </LayoutUser>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LayoutUser from '~/components/LayoutUser.vue'
import GuidePopup from '@/components/user/GuidePopup.vue'
import axios from 'axios'
import { getTokenWithState, getTokenFingerprint } from '@/utils/tokenUtils'

// Reactive data
const currentData = ref({
  money: 0,
  score: 0,
  hasCurrentMonthUpdate: false
})

// Money history data
const moneyHistory = ref([])

const rankingGuideSteps = [
  'การ์ดด้านบนแสดงข้อมูลเดือนปัจจุบัน: รายได้, คะแนนเฉลี่ย และสถานะคะแนน',
  'หากขึ้น "รออัปเดต" หมายถึงเดือนนี้ยังไม่มีข้อมูลรายได้หรือผลประเมินล่าสุด',
  'ตารางประวัติใช้ดูแนวโน้มย้อนหลังรายเดือนทั้งรายได้และคะแนน',
  'สถานะคะแนน: ดีเยี่ยม (75-100), ดี (50-74), ปรับปรุง (0-49)',
  'ใช้ข้อมูลหน้านี้วางแผนปรับปรุงคุณภาพร้านและรายได้ในเดือนถัดไป'
]

// Methods
const formatMoney = (amount) => {
  return new Intl.NumberFormat('th-TH').format(amount)
}

const formatScore = (score) => {
  if (score === null || score === undefined || score === 0) {
    return '0.00'
  }
  return parseFloat(score).toFixed(2)
}

const normalizeScore = (score) => {
  const n = Number(score)
  return Number.isFinite(n) ? n : null
}

// สถานะตามคะแนนรายเดือน/รายร้าน
// 100-75 = ดีเยี่ยม (เขียว)
// 74-50 = ดี (เหลือง)
// 49-0 = ปรับปรุง (แดง)
const getScoreStatus = (score) => {
  const n = normalizeScore(score)
  if (n === null) return { label: '—', variant: 'unknown' }
  if (n >= 75) return { label: 'ดีเยี่ยม', variant: 'excellent' }
  if (n >= 50) return { label: 'ดี', variant: 'good' }
  return { label: 'ปรับปรุง', variant: 'improve' }
}

const getScoreStatusLabel = (score) => getScoreStatus(score).label

const scoreStatusClass = (score) => {
  const { variant } = getScoreStatus(score)
  if (variant === 'excellent') return 'badge-excellent'
  if (variant === 'good') return 'badge-good'
  if (variant === 'improve') return 'badge-improve'
  return 'badge-unknown'
}

const formatDate = (dateString) => {
  if (!dateString) return 'ไม่ระบุ';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', { 
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

const getMonthName = (month) => {
  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  return monthNames[month - 1];
}

const currentMonthName = getMonthName(new Date().getMonth() + 1)

const fetchMoneyHistory = async () => {
  try {
    console.log('🔍 Fetching combined money and evaluation history...');
    
    // ตรวจสอบว่าเราอยู่ใน client-side หรือไม่
    if (typeof window === 'undefined') {
      console.log('❌ Running on server-side, skipping localStorage access')
      return
    }
    
    // ดึง shopId แบบเดียวกับ fetchCurrentData
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}')
    const shopIdFromUserData = userData.id
    const shopIdFromShopData = JSON.parse(sessionStorage.getItem('shopData') || '{}').id
    const userId = sessionStorage.getItem('userId')
    
    const shopId = shopIdFromUserData || shopIdFromShopData || userId
    
    console.log('🆔 ShopId for money history:', shopId)
    
    if (!shopId) {
      console.error('❌ No shop ID found in localStorage');
      // ใช้ fallback shopId
      const fallbackShopId = "68af13d9a31f74d33dc429ec" // shopId ของร้าน "rairak"
      console.log('🔄 Using fallback shopId for money history:', fallbackShopId)
      
      const response = await axios.get(`/api/money-history/shop/${fallbackShopId}/combined`);
      console.log('📊 Combined history response:', response.data);
      
      if (response.data.success) {
        moneyHistory.value = response.data.data;
      }
      return;
    }

    const response = await axios.get(`/api/money-history/shop/${shopId}/combined`);
    console.log('📊 Combined history response:', response.data);
    
    if (response.data.success) {
      moneyHistory.value = response.data.data;
    }
  } catch (error) {
    console.error('❌ Error fetching combined history:', error);
  }
}

const fetchCurrentData = async () => {
  try {
    console.log('🔍 === DEBUG: fetchCurrentData ===')
    
    // ตรวจสอบว่าเราอยู่ใน client-side หรือไม่
    if (typeof window === 'undefined') {
      console.log('❌ Running on server-side, skipping localStorage access')
      return
    }
    
    // 1. ตรวจสอบ sessionStorage ทั้งหมด
    console.log('📦 All sessionStorage keys:', Object.keys(sessionStorage))
    
    // 2. แสดงค่าของ sessionStorage แต่ละตัว
    for (let key of Object.keys(sessionStorage)) {
      console.log(`📋 ${key}:`, sessionStorage.getItem(key))
    }
    
    // 3. ดึง userData
    const userData = JSON.parse(sessionStorage.getItem('userData') || '{}')
    console.log('👤 userData from sessionStorage:', userData)
    console.log('🔑 userData keys:', Object.keys(userData))
    
    // 4. ลองดึง shopId จากหลายแหล่ง
    const shopIdFromUserData = userData.id
    const shopIdFromShopData = JSON.parse(sessionStorage.getItem('shopData') || '{}').id
    const userId = sessionStorage.getItem('userId')
    const displayName = sessionStorage.getItem('displayName')
    
    console.log('🆔 shopId from userData.id:', shopIdFromUserData)
    console.log('🏪 shopId from shopData.id:', shopIdFromShopData)
    console.log('👤 userId from sessionStorage:', userId)
    console.log('📝 displayName from sessionStorage:', displayName)
    
    // 5. ลองหาจาก token (ใช้ fingerprint สำหรับ debug)
    const { token, state } = getTokenWithState()
    console.log('🔐 token state:', state, 'fingerprint:', getTokenFingerprint(token || ''))
    
    // 6. เลือก shopId ที่มีค่า
    const shopId = shopIdFromUserData || shopIdFromShopData || userId
    console.log('✅ Final shopId selected:', shopId)
    
    if (!shopId) {
      console.error('❌ ไม่พบ shopId ในทุกแหล่ง')
      console.log('📋 Available keys in userData:', Object.keys(userData))
      console.log('📋 Available keys in shopData:', Object.keys(JSON.parse(sessionStorage.getItem('shopData') || '{}')))
      
      // ลองใช้ shopId จาก database โดยตรง (ชั่วคราว)
      console.log('🔄 Using fallback shopId from database')
      const fallbackShopId = "68af13d9a31f74d33dc429ec" // shopId ของร้าน "rairak"
      console.log('🆔 Using fallback shopId:', fallbackShopId)
      
      // ดึงข้อมูลเงินจาก moneyhistory
      const moneyResponse = await axios.get(`/api/money-history/shop/${fallbackShopId}/current`)
      console.log('💰 Money response:', moneyResponse.data)
      
      // ดึงข้อมูลคะแนนและลำดับจาก rankings API (เดิม)
      const rankingResponse = await axios.get('/api/rankings/current', {
        params: { shopId: fallbackShopId }
      })
      console.log('📊 Ranking response:', rankingResponse.data)
      
      // รวมข้อมูล
      const moneyData = moneyResponse.data.success ? moneyResponse.data.data : { totals: 0 }
      const rankingData = rankingResponse.data.success ? rankingResponse.data.data : { score: 0, hasCurrentMonthUpdate: false }
      
      currentData.value = {
        money: moneyData.totals || 0,
        score: rankingData.score || 0,
        hasCurrentMonthUpdate: !!rankingData.hasCurrentMonthUpdate
      }
      console.log('✅ Data updated successfully:', currentData.value)
      return
    }
    
    // 7. ดึงข้อมูลเงินจาก moneyhistory
    console.log('🌐 Sending request to /api/money-history/shop/${shopId}/current')
    const moneyResponse = await axios.get(`/api/money-history/shop/${shopId}/current`)
    console.log('💰 Money response:', moneyResponse.data)
    
    // 8. ดึงข้อมูลคะแนนและลำดับจาก rankings API (เดิม)
    console.log('🌐 Sending request to /api/rankings/current with shopId:', shopId)
    const rankingResponse = await axios.get('/api/rankings/current', {
      params: { shopId }
    })
    console.log('📊 Ranking response:', rankingResponse.data)
    
    // 9. รวมข้อมูล
    const moneyData = moneyResponse.data.success ? moneyResponse.data.data : { totals: 0 }
    const rankingData = rankingResponse.data.success ? rankingResponse.data.data : { score: 0, hasCurrentMonthUpdate: false }
    
    currentData.value = {
      money: moneyData.totals || 0,
      score: rankingData.score || 0,
      hasCurrentMonthUpdate: !!rankingData.hasCurrentMonthUpdate
    }
    console.log('✅ Data updated successfully:', currentData.value)
    
  } catch (error) {
    console.error('❌ Error fetching current data:', error)
    console.error('📋 Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    })
    // Fallback to sample data
    currentData.value = {
      money: 0,
      score: 0,
      hasCurrentMonthUpdate: false
    }
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Fetch ranking data
    fetchCurrentData()
    fetchMoneyHistory()
  } catch (error) {
    console.error('❌ Error initializing ranking page:', error)
    // Continue with data fetching even if notification store fails
    fetchCurrentData()
    fetchMoneyHistory()
  }
})
</script>

<style scoped>
.ranking-page {
  min-height: 100vh;
  padding: 24px 20px;
  font-family: 'Kanit', sans-serif;
  background: #f5f6f8;
}

/* Header */
.page-header {
  margin-bottom: 24px;
  text-align: center;
  position: relative;
}
.header-actions {
  position: absolute;
  top: 0;
  right: 0;
}
.page-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0 0 4px 0;
}
.page-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
}

/* Metric Cards */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.metric-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px 16px;
  text-align: center;
}
.metric-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
}
.metric-value {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  line-height: 1.2;
}
.metric-value.money {
  color: #059669;
}
.metric-value.score {
  color: #2563eb;
}

/* Section */
.section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}
.section-header {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.date-info {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.7;
}
.date-label {
  font-weight: 600;
  color: #9ca3af;
}
.empty-cell {
  color: #d1d5db;
}

.title-section {
  text-align: center;
  margin-bottom: 30px;
}

.main-title {
  color: #2c3e50;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sub-title {
  color: #6c757d;
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  text-transform: none;
  letter-spacing: 0.5px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.summary-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.summary-value {
  font-size: 64px;
  font-weight: 700;
  color: #007bff;
  margin-bottom: 8px;
}

.summary-label {
  font-size: 14px;
  color: #6c757d;
  font-weight: 500;
}

/* New styles for notifications */
.ranking-notifications {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-title {
  color: #2c3e50;
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
  text-align: center;
}

.notifications-container {
  max-height: 400px; /* Adjust as needed */
  overflow-y: auto;
}

.no-notifications {
  text-align: center;
  padding: 30px;
  color: #6c757d;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: center;
  padding: 15px 10px;
  border-radius: 8px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background-color: #e9ecef;
}

.notification-item.unread {
  background-color: #e3f2fd; /* Light blue for unread */
  border-color: #bbdefb;
}

.notification-item.unread:hover {
  background-color: #d1e8f7;
}

.notification-icon {
  font-size: 24px;
  color: #007bff;
  margin-right: 15px;
  flex-shrink: 0;
}

.notification-content {
  flex-grow: 1;
}

.notification-title {
  font-size: 18px;
  font-weight: 600;
  color: #343a40;
  margin-bottom: 4px;
}

.notification-message {
  font-size: 14px;
  color: #6c757d;
  margin-bottom: 8px;
  line-height: 1.4;
}

.notification-details {
  font-size: 13px;
  color: #495057;
  margin-top: 8px;
  border-top: 1px dashed #e9ecef;
  padding-top: 8px;
}

.detail-row {
  margin-bottom: 4px;
}

.detail-label {
  font-weight: 500;
  color: #6c757d;
}

.detail-value {
  font-weight: 600;
  color: #2c3e50;
}

.notification-time {
  font-size: 12px;
  color: #95a5a6;
  margin-top: 8px;
  text-align: right;
}

.unread-indicator {
  width: 10px;
  height: 10px;
  background-color: #007bff;
  border-radius: 50%;
  margin-left: 10px;
  flex-shrink: 0;
}

/* New styles for money history section */
.money-history-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-top: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-container {
  overflow-x: auto;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #343a40;
}

.history-table th,
.history-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e9ecef;
}

.history-table th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #495057;
  font-size: 15px;
}

.history-table tbody tr:last-child td {
  border-bottom: none;
}

.revenue-cell {
  font-weight: 700;
  color: #28a745; /* Green for revenue */
}

.score-cell {
  font-weight: 600;
  color: #007bff; /* Blue for score */
}

.badge {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
}

.badge-excellent {
  background-color: #c6f6d5;
  color: #2f855a;
  border: 1px solid rgba(47, 133, 90, 0.25);
}

.badge-good {
  background-color: #fefcbf;
  color: #b7791f;
  border: 1px solid rgba(183, 121, 31, 0.25);
}

.badge-improve {
  background-color: #feb2b2;
  color: #c53030;
  border: 1px solid rgba(197, 48, 48, 0.25);
}

.badge-unknown {
  background-color: #edf2f7;
  color: #4a5568;
  border: 1px solid rgba(74, 85, 104, 0.25);
}

.badge-pending {
  background-color: #e2e8f0;
  color: #4a5568;
  border: 1px dashed rgba(74, 85, 104, 0.35);
}

.no-data-cell {
  padding: 0 !important;
  text-align: center;
  vertical-align: middle;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6c757d;
  min-height: 200px;
}

.no-data i {
  font-size: 48px;
  margin-bottom: 16px;
  color: #adb5bd;
}

.no-data p {
  margin: 0;
  font-size: 16px;
  color: #6c757d;
}

.update-info {
  font-size: 13px;
  color: #6c757d;
  margin-top: 4px;
}

.update-label {
  font-weight: 500;
  color: #495057;
}

@media (max-width: 768px) {
  .ranking-page {
    padding: 12px 12px 20px;
  }

  .page-title {
    font-size: clamp(1.1rem, 4.2vw, 1.45rem);
  }

  .page-subtitle {
    font-size: clamp(0.78rem, 2.9vw, 0.9rem);
  }

  .header-actions {
    position: static;
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }
  
  .metric-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .metric-label {
    font-size: clamp(11px, 2.8vw, 13px);
  }

  .metric-value {
    font-size: clamp(1.15rem, 5vw, 1.35rem);
  }

  .section {
    padding: 12px;
  }

  .section-header {
    font-size: clamp(0.88rem, 3.2vw, 1rem);
    margin-bottom: 12px;
    padding-bottom: 8px;
  }

  .history-table {
    font-size: clamp(11px, 2.8vw, 13px);
  }

  .history-table th {
    font-size: clamp(10px, 2.6vw, 12px);
  }

  .history-table th,
  .history-table td {
    padding: 8px 6px;
    vertical-align: top;
  }

  .badge {
    font-size: clamp(10px, 2.5vw, 12px);
    padding: 5px 9px;
  }

  .date-info {
    font-size: clamp(10px, 2.4vw, 11px);
    line-height: 1.55;
  }

  .no-data {
    padding: 36px 14px;
    min-height: 160px;
  }

  .no-data p {
    font-size: clamp(13px, 3vw, 15px);
  }
}
</style> 