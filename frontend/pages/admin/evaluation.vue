<template>
  <layout-admin>
    <div class="container">
      <div class="header">
        <h1><i class="fas fa-clipboard-check"></i> จัดการการประเมินร้านค้า</h1>
        <p>ควบคุมการเปิด/ปิดการประเมินสำหรับแต่ละเดือน</p>
      </div>

      <!-- Current Month Status -->
      <div class="current-status-card">
        <div class="status-header">
          <h3><i class="fas fa-calendar-alt"></i> สถานะเดือนปัจจุบัน</h3>
          <div class="current-month">
            {{ currentMonth }}/{{ currentYear }}
          </div>
        </div>
        <div class="status-content">
          <div class="status-indicator">
            <div :class="['status-badge', evaluationControl?.isEnabled ? 'enabled' : 'disabled']">
              <i :class="evaluationControl?.isEnabled ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
              {{ evaluationControl?.isEnabled ? 'เปิดการประเมิน' : 'ปิดการประเมิน' }}
            </div>
          </div>
          <div v-if="evaluationControl?.reason" class="reason">
            <strong>เหตุผล:</strong> {{ evaluationControl.reason }}
          </div>
        </div>
      </div>

      <!-- Control Form -->
      <div class="control-form-card">
        <div class="form-header">
          <h3><i class="fas fa-cog"></i> ตั้งค่าการประเมิน</h3>
        </div>
        <div class="form-content">
          <div class="form-row">
            <div class="form-group">
              <label>เดือน:</label>
              <select v-model="controlForm.month" class="form-select">
                <option value="">เลือกเดือน</option>
                <option v-for="month in months" :key="month.value" :value="month.value">
                  {{ month.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>ปี:</label>
              <select v-model="controlForm.year" class="form-select">
                <option value="">เลือกปี</option>
                <option v-for="year in years" :key="year" :value="year">
                  {{ year }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="form-group">
            <label>สถานะ:</label>
            <div class="radio-group">
              <label class="radio-label">
                <input 
                  type="radio" 
                  v-model="controlForm.isEnabled" 
                  :value="true"
                  class="radio-input"
                />
                <span class="radio-custom"></span>
                <span class="radio-text">เปิดการประเมิน</span>
              </label>
              <label class="radio-label">
                <input 
                  type="radio" 
                  v-model="controlForm.isEnabled" 
                  :value="false"
                  class="radio-input"
                />
                <span class="radio-custom"></span>
                <span class="radio-text">ปิดการประเมิน</span>
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label>เหตุผล (ถ้าปิด):</label>
            <textarea 
              v-model="controlForm.reason" 
              class="form-textarea"
              placeholder="ระบุเหตุผลในการปิดการประเมิน..."
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-actions">
            <button @click="saveControl" class="save-btn">
              <i class="fas fa-save"></i>
              บันทึกการตั้งค่า
            </button>
            <button @click="resetForm" class="reset-btn">
              <i class="fas fa-redo"></i>
              รีเซ็ต
            </button>
          </div>
        </div>
      </div>

      <!-- Evaluation History -->
      <div class="history-card">
        <div class="history-header">
          <h3><i class="fas fa-history"></i> ประวัติการตั้งค่า</h3>
        </div>
        <div class="history-content">
          <div v-if="controlHistory.length === 0" class="no-data">
            <i class="fas fa-info-circle"></i>
            <p>ยังไม่มีประวัติการตั้งค่า</p>
          </div>
          <div v-else class="history-list">
            <div v-for="control in controlHistory" :key="control._id" class="history-item">
              <div class="history-info">
                <div class="history-month">{{ control.month }}/{{ control.year }}</div>
                <div class="history-date">{{ formatDate(control.createdAt) }}</div>
                <div :class="['history-status', control.isEvaluationEnabled ? 'enabled' : 'disabled']">
                  <i :class="control.isEvaluationEnabled ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                  {{ control.isEvaluationEnabled ? 'เปิด' : 'ปิด' }}
                </div>
              </div>
              <div v-if="control.reason" class="history-reason">
                <strong>เหตุผล:</strong> {{ control.reason }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="stats-card">
        <div class="stats-header">
          <h3><i class="fas fa-chart-bar"></i> สถิติการประเมิน</h3>
        </div>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalShops }}</div>
              <div class="stat-label">ร้านค้าทั้งหมด</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.passedCount }}</div>
              <div class="stat-label">ผ่านการประเมิน</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">❌</div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.failedCount }}</div>
              <div class="stat-label">ไม่ผ่านการประเมิน</div>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-value">{{ Math.round(stats.averageScore) }}</div>
              <div class="stat-label">คะแนนเฉลี่ย</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </layout-admin>
</template>

<script>
import LayoutAdmin from '../../components/LayoutAdmin.vue'
import axios from 'axios'

export default {
  name: 'Evaluation',
  components: { LayoutAdmin },
  data() {
    return {
      currentMonth: new Date().getMonth() + 1,
      currentYear: new Date().getFullYear(),
      evaluationControl: null,
      controlHistory: [],
      stats: {
        totalShops: 0,
        passedCount: 0,
        failedCount: 0,
        averageScore: 0
      },
      controlForm: {
        month: '',
        year: '',
        isEnabled: true,
        reason: ''
      },
      months: [
        { value: 1, label: 'มกราคม' },
        { value: 2, label: 'กุมภาพันธ์' },
        { value: 3, label: 'มีนาคม' },
        { value: 4, label: 'เมษายน' },
        { value: 5, label: 'พฤษภาคม' },
        { value: 6, label: 'มิถุนายน' },
        { value: 7, label: 'กรกฎาคม' },
        { value: 8, label: 'สิงหาคม' },
        { value: 9, label: 'กันยายน' },
        { value: 10, label: 'ตุลาคม' },
        { value: 11, label: 'พฤศจิกายน' },
        { value: 12, label: 'ธันวาคม' }
      ],
      years: []
    }
  },
  async mounted() {
    this.generateYears()
    await this.loadCurrentControl()
    await this.loadControlHistory()
    await this.loadStats()
  },
  methods: {
    generateYears() {
      const currentYear = new Date().getFullYear()
      this.years = []
      for (let year = currentYear - 2; year <= currentYear + 2; year++) {
        this.years.push(year)
      }
    },

    async loadCurrentControl() {
      try {
        const response = await axios.get('/api/evaluations/control/current')
        this.evaluationControl = response.data
      } catch (error) {
        console.error('Error loading current control:', error)
      }
    },

    async loadControlHistory() {
      try {
        const response = await axios.get('/api/evaluations/control/history')
        this.controlHistory = response.data
      } catch (error) {
        console.error('Error loading control history:', error)
      }
    },

    async loadStats() {
      try {
        const response = await axios.get('/api/evaluations/stats')
        this.stats = response.data
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    },

    async saveControl() {
      if (!this.controlForm.month || !this.controlForm.year) {
        alert('กรุณาเลือกเดือนและปี')
        return
      }

      try {
        await axios.post('/api/evaluations/control', {
          month: parseInt(this.controlForm.month),
          year: parseInt(this.controlForm.year),
          isEvaluationEnabled: this.controlForm.isEnabled,
          reason: this.controlForm.reason
        })

        alert('บันทึกการตั้งค่าเรียบร้อยแล้ว')
        await this.loadCurrentControl()
        await this.loadControlHistory()
        this.resetForm()
      } catch (error) {
        console.error('Error saving control:', error)
        alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า')
      }
    },

    resetForm() {
      this.controlForm = {
        month: '',
        year: '',
        isEnabled: true,
        reason: ''
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  padding: 40px 20px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: white;
  margin-bottom: 30px;
}

.header h1 {
  color: white;
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.header p {
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  font-size: 16px;
}

.current-status-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.status-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.current-month {
  background: #e3f2fd;
  color: #1976d2;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 16px;
}

.status-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.status-indicator {
  display: flex;
  justify-content: center;
}

.status-badge {
  padding: 12px 24px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge.enabled {
  background: #d4edda;
  color: #155724;
}

.status-badge.disabled {
  background: #f8d7da;
  color: #721c24;
}

.reason {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 8px;
  padding: 12px;
  color: #856404;
}

.control-form-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.form-header {
  margin-bottom: 20px;
}

.form-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.form-select,
.form-textarea {
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: border-color 0.3s ease;
}

.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3498db;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s ease;
}

.radio-label:hover {
  background: #f8f9fa;
}

.radio-input {
  display: none;
}

.radio-custom {
  width: 18px;
  height: 18px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  position: relative;
  transition: all 0.3s ease;
}

.radio-input:checked + .radio-custom {
  border-color: #3498db;
  background: #3498db;
}

.radio-input:checked + .radio-custom::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
}

.radio-text {
  font-size: 14px;
  color: #333;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.save-btn,
.reset-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.save-btn {
  background: #28a745;
  color: white;
}

.save-btn:hover {
  background: #218838;
}

.reset-btn {
  background: #6c757d;
  color: white;
}

.reset-btn:hover {
  background: #5a6268;
}

.history-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.history-header {
  margin-bottom: 20px;
}

.history-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.history-content {
  min-height: 200px;
}

.no-data {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 15px;
  color: #d1d5db;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.history-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
}

.history-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-month {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.history-date {
  color: #6b7280;
  font-size: 14px;
}

.history-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.history-status.enabled {
  background: #d4edda;
  color: #155724;
}

.history-status.disabled {
  background: #f8d7da;
  color: #721c24;
}

.history-reason {
  color: #856404;
  font-size: 14px;
  padding-top: 10px;
  border-top: 1px solid #e9ecef;
}

.stats-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-header {
  margin-bottom: 20px;
}

.stats-header h3 {
  margin: 0;
  color: #333;
  font-size: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.stat-icon {
  font-size: 2rem;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .radio-group {
    flex-direction: column;
    gap: 10px;
  }

  .form-actions {
    flex-direction: column;
  }

  .history-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style> 