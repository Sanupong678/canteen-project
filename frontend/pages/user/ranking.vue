<template>
  <LayoutUser>
    <div class="ranking-page">

      <!-- Current Month Summary -->
      <div class="current-summary">
        <div class="title-section">
          <h2 class="main-title">การจัดอันดับ</h2>
          <h3 class="sub-title">ของเดือนปัจจุบัน</h3>
        </div>
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">{{ formatMoney(currentData.money) }}</div>
            <div class="summary-label">เงิน</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">{{ formatScore(currentData.score) }}</div>
            <div class="summary-label">คะแนนเฉลี่ย</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">{{ currentData.rank }}</div>
            <div class="summary-label">ลำดับ</div>
          </div>
        </div>
      </div>

      <!-- Money History Section -->
      <div class="money-history-section" v-if="moneyHistory && moneyHistory.length >= 0">
        <h2 class="section-title">ประวัติรายได้และคะแนน</h2>
        <div class="table-container">
          <table class="history-table">
            <thead>
              <tr>
                <th>เดือน/ปี</th>
                <th>รายได้</th>
                <th>คะแนน</th>
                <th>ลำดับ</th>
                <th>วันที่อัปเดต</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in moneyHistory" :key="`${item.year}-${item.month}`">
                <td>{{ getMonthName(item.month) }} {{ item.year }}</td>
                <td class="revenue-cell">{{ item.revenue ? formatMoney(item.revenue) : '-' }}</td>
                <td class="score-cell">{{ item.score || '-' }}</td>
                <td class="rank-cell">{{ item.rank ? `อันดับที่ ${item.rank}` : '-' }}</td>
                <td>
                  <div v-if="item.uploadedAt || item.evaluatedAt">
                    <div v-if="item.uploadedAt" class="update-info">
                      <span class="update-label">รายได้:</span> {{ formatDate(item.uploadedAt) }}
                    </div>
                    <div v-if="item.evaluatedAt" class="update-info">
                      <span class="update-label">คะแนน:</span> {{ formatDate(item.evaluatedAt) }}
                    </div>
                  </div>
                  <span v-else>-</span>
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
import axios from 'axios'
import { getTokenWithState, getTokenFingerprint } from '@/utils/tokenUtils'

// Reactive data
const currentData = ref({
  money: 0,
  score: 0,
  rank: 0
})

// Money history data
const moneyHistory = ref([])

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
      const rankingData = rankingResponse.data.success ? rankingResponse.data.data : { score: 0, rank: 0 }
      
      currentData.value = {
        money: moneyData.totals || 0,
        score: rankingData.score || 0,
        rank: rankingData.rank || 0
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
    const rankingData = rankingResponse.data.success ? rankingResponse.data.data : { score: 0, rank: 0 }
    
    currentData.value = {
      money: moneyData.totals || 0,
      score: rankingData.score || 0,
      rank: rankingData.rank || 0
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
      rank: 0
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
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  padding: 20px;
  font-family: 'Kanit', sans-serif;
}

.current-summary {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.rank-cell {
  font-weight: 600;
  color: #dc3545; /* Red for rank */
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
    padding: 16px;
  }
  
  .summary-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .history-table th,
  .history-table td {
    padding: 8px 10px;
  }
}
</style> 