<template>
  <div v-if="isMounted">
    <!-- Evaluation Modal -->
    <div v-if="show" class="modal-overlay" @click="closeModal">
      <div class="modal evaluation-modal" @click.stop>
        <div class="modal-header">
          <div class="header-content">
            <div class="header-title">
              <i class="fas fa-clipboard-check"></i>
              <h3>แบบประเมินร้านค้า: {{ shop?.name }}</h3>
            </div>
            <div class="header-subtitle">
              <div class="subtitle-row">
                <span class="evaluation-status">
                  <i class="fas fa-info-circle"></i>
                  ระบบประเมินคุณภาพร้านค้า
                </span>
                <span class="progress-status" v-if="evaluationItems.length > 0" :class="{ 'complete': isEvaluationComplete }">
                  <i class="fas fa-chart-pie"></i>
                  ความคืบหน้า: {{ evaluationProgress }}% ({{ Object.keys(evaluationResults).filter(key => evaluationResults[key] && evaluationResults[key] !== '').length }}/{{ evaluationItems.length }})
                </span>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button 
              v-if="shop" 
              @click="saveEvaluation" 
              class="save-evaluation-btn"
              :class="{ disabled: !isEvaluationComplete }"
              :disabled="!isEvaluationComplete"
            >
              <i class="fas fa-save"></i>
              <span>{{ currentEvaluation ? 'แก้ไขแบบประเมิน' : 'บันทึกแบบประเมิน' }}</span>
            </button>
            <button @click="closeModal" class="close-btn">
              <i class="fas fa-times"></i>
              <span>ปิด</span>
            </button>
          </div>
        </div>

        <div class="modal-body">
          <!-- Evaluation Items -->
          <div v-if="shop" class="evaluation-items">
            <!-- Show evaluation form -->
            <div>
              <h4>หัวข้อประเมิน {{ currentEvaluation ? '(แก้ไข)' : '' }}</h4>
              <div v-if="!isEvaluationComplete && evaluationItems.length > 0" class="incomplete-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <span>กรุณาประเมินให้ครบทุกหัวข้อ ({{ Object.keys(evaluationResults).filter(key => evaluationResults[key] && evaluationResults[key] !== '').length }}/{{ evaluationItems.length }})</span>
              </div>
              <div class="evaluation-table-container">
                <table class="evaluation-table">
                  <thead>
                    <tr>
                      <th class="col-order">ลำดับ</th>
                      <th class="col-topic">หัวข้อ</th>
                      <th class="col-pass">ผ่าน</th>
                      <th class="col-fail">ไม่ผ่าน</th>
                      <th class="col-suggestion">เสนอแนะ</th>
                      <th class="col-file">แนบไฟล์</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in evaluationItems" :key="item._id" class="evaluation-row">
                      <!-- ลำดับ -->
                      <td class="col-order">
                        <div class="order-number">{{ item.order }}</div>
                      </td>
                      
                      <!-- หัวข้อ -->
                      <td class="col-topic">
                        <div class="topic-content">
                          <div class="topic-title">{{ item.title }}</div>
                          <div v-if="item.description" class="topic-description">{{ item.description }}</div>
                          <div class="topic-score">คะแนน: {{ item.maxScore }}</div>
                        </div>
                      </td>
                      
                      <!-- ผ่าน -->
                      <td class="col-pass">
                        <div class="checkbox-container">
                          <label class="checkbox-label">
                            <input 
                              type="radio" 
                              :name="'status_' + item._id" 
                              value="ผ่าน"
                              :checked="evaluationResults[item._id] === 'ผ่าน'"
                              @change="handleStatusChange(item._id, 'ผ่าน')"
                            />
                            <span class="checkbox-custom"></span>
                          </label>
                        </div>
                      </td>
                      
                      <!-- ไม่ผ่าน -->
                      <td class="col-fail">
                        <div class="checkbox-container">
                          <label class="checkbox-label">
                            <input 
                              type="radio" 
                              :name="'status_' + item._id" 
                              value="ไม่ผ่าน"
                              :checked="evaluationResults[item._id] === 'ไม่ผ่าน'"
                              @change="handleStatusChange(item._id, 'ไม่ผ่าน')"
                            />
                            <span class="checkbox-custom"></span>
                          </label>
                        </div>
                      </td>
                      
                      <!-- เสนอแนะ -->
                      <td class="col-suggestion">
                        <div class="suggestion-container">
                          <textarea 
                            v-model="evaluationSuggestions[item._id]"
                            class="suggestion-textarea"
                            placeholder="ข้อเสนอแนะ..."
                            rows="3"
                          ></textarea>
                        </div>
                      </td>
                      
                      <!-- แนบไฟล์ -->
                      <td class="col-file">
                        <div class="file-container">
                          <input 
                            v-model="evaluationDriveLinks[item._id]"
                            type="url"
                            class="file-link-input"
                            placeholder="ลิ้งไฟล์..."
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- No Shop Selected -->
          <div v-if="!shop" class="no-shop-selected">
            <i class="fas fa-store"></i>
            <p>กรุณาเลือกร้านค้าที่ต้องการประเมิน</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'EvaluationModal',
  emits: ['close', 'evaluation-saved'],
  props: {
    show: {
      type: Boolean,
      default: false
    },
    shop: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      evaluationItems: [],
      evaluationResults: {},
      evaluationSuggestions: {},
      evaluationDriveLinks: {},
      showSuggestionFields: {},
      showDriveLinkFields: {},
      totalScore: 100,
      evaluationControl: null,
      currentEvaluation: null,
      isMounted: false,
      canteenMapping: {
        1: 'โรงอาหาร C5',
        2: 'โรงอาหาร D1', 
        3: 'โรงอาหาร Dormity',
        4: 'โรงอาหาร E1',
        5: 'โรงอาหาร E2',
        6: 'โรงอาหาร Epark',
        7: 'โรงอาหาร Msquare',
        8: 'โรงอาหาร RuemRim',
        9: 'โรงอาหาร S2'
      }
    }
  },
  computed: {
    finalStatus() {
      const maxPossibleScore = this.evaluationItems.reduce((sum, item) => sum + (item.maxScore || 1), 0);
      return this.totalScore >= (maxPossibleScore * 0.5) ? 'ผ่าน' : 'ไม่ผ่าน';
    },
    failedItems() {
      let count = 0;
      this.evaluationItems.forEach(item => {
        const result = this.evaluationResults[item._id];
        if (result === 'ไม่ผ่าน') {
          count++;
        }
      });
      return count;
    },
    isEvaluationComplete() {
      // ตรวจสอบว่าประเมินครบทุกข้อหรือไม่
      if (this.evaluationItems.length === 0) return false;
      
      let evaluatedCount = 0;
      this.evaluationItems.forEach(item => {
        if (this.evaluationResults[item._id] && this.evaluationResults[item._id] !== '') {
          evaluatedCount++;
        }
      });
      
      return evaluatedCount === this.evaluationItems.length;
    },
    evaluationProgress() {
      if (this.evaluationItems.length === 0) return 0;
      
      let evaluatedCount = 0;
      this.evaluationItems.forEach(item => {
        if (this.evaluationResults[item._id] && this.evaluationResults[item._id] !== '') {
          evaluatedCount++;
        }
      });
      
      return Math.round((evaluatedCount / this.evaluationItems.length) * 100);
    }
  },
  watch: {
    show(newVal) {
      console.log('Modal show state changed:', newVal);
      if (newVal) {
        console.log('Modal opened, shop data:', this.shop);
        this.loadEvaluationItems();
        this.checkEvaluationControl();
        this.loadCurrentEvaluation();
        // รีเซ็ตข้อมูลเมื่อเปิด modal ใหม่
        if (!this.currentEvaluation) {
          this.evaluationResults = {};
          this.evaluationSuggestions = {};
          this.evaluationDriveLinks = {};
          this.showSuggestionFields = {};
          this.showDriveLinkFields = {};
          this.totalScore = 100;
        }
      }
    }
  },
  mounted() {
    // Set mounted flag to prevent hydration issues
    this.isMounted = true;
    console.log('EvaluationModal mounted, isMounted:', this.isMounted);
    
    // โหลดข้อมูลเมื่อ component ถูกสร้าง
    if (this.show) {
      this.loadEvaluationItems();
      this.checkEvaluationControl();
      this.loadCurrentEvaluation();
    }
  },
  methods: {
    async loadEvaluationItems() {
      try {
        const response = await axios.get('/api/evaluations/items');
        this.evaluationItems = response.data || [];
        console.log('Loaded evaluation items from database:', this.evaluationItems);
      } catch (error) {
        console.error('Error loading evaluation items from database:', error);
        this.evaluationItems = [];
        if (error.response) {
          console.error('Server error:', error.response.data);
        }
      }
    },

    async checkEvaluationControl() {
      try {
        const response = await axios.get('/api/evaluations/control/current');
        this.evaluationControl = response.data;
        console.log('Evaluation control:', this.evaluationControl);
      } catch (error) {
        console.error('Error checking evaluation control:', error);
        this.evaluationControl = { isEnabled: true };
      }
    },

    async loadCurrentEvaluation() {
      if (!this.shop) return;
      
      try {
        console.log('Loading current evaluation for shop:', this.shop._id);
        
        // เรียก API เพื่อดึงข้อมูลการประเมินล่าสุด
        const response = await axios.get(`/api/evaluations/shop/${this.shop._id}/current`);
        this.currentEvaluation = response.data;
        console.log('Current evaluation from API:', this.currentEvaluation);
        
        // โหลดการประเมินที่เคยทำไว้
        if (this.currentEvaluation && this.currentEvaluation.items) {
          this.evaluationResults = {};
          this.evaluationSuggestions = {};
          this.evaluationDriveLinks = {};
          this.showSuggestionFields = {};
          this.showDriveLinkFields = {};
          console.log('Loading evaluation items:', this.currentEvaluation.items);
          
          this.currentEvaluation.items.forEach(item => {
            console.log('Processing item:', item);
            if (item.id) {
              if (item.status && item.status !== '') {
                this.evaluationResults[item.id] = item.status;
                console.log(`Set evaluationResults[${item.id}] = ${item.status}`);
              }
              // โหลดข้อเสนอแนะและลิ้ง Drive ถ้ามี
              if (item.suggestion) {
                this.evaluationSuggestions[item.id] = item.suggestion;
                this.showSuggestionFields[item.id] = true;
              }
              if (item.driveLink) {
                this.evaluationDriveLinks[item.id] = item.driveLink;
                this.showDriveLinkFields[item.id] = true;
              }
            }
          });
          
          console.log('Final evaluationResults:', this.evaluationResults);
          // คำนวณคะแนนจากข้อมูลที่โหลดมา
          this.calculateScore();
        } else {
          console.log('No current evaluation found or no items');
        }
      } catch (error) {
        console.error('Error loading current evaluation:', error);
        this.currentEvaluation = null;
      }
    },

    calculateScore() {
      let earnedScore = 0;
      
      // ตรวจสอบแต่ละหัวข้อ - ได้คะแนนเมื่อเลือก "ผ่าน"
      this.evaluationItems.forEach(item => {
        const result = this.evaluationResults[item._id];
        if (result === 'ผ่าน') {
          earnedScore += parseInt(item.maxScore) || 1;
        }
      });
      
      this.totalScore = earnedScore; // เก็บคะแนนที่ได้จริง
    },

    handleStatusChange(itemId, value) {
      this.evaluationResults[itemId] = value;
      this.calculateScore();
    },

    toggleSuggestionField(itemId) {
      this.$set(this.showSuggestionFields, itemId, !this.showSuggestionFields[itemId]);
    },

    toggleDriveLinkField(itemId) {
      this.$set(this.showDriveLinkFields, itemId, !this.showDriveLinkFields[itemId]);
    },

    async saveEvaluation() {
      if (!this.shop) {
        alert('กรุณาเลือกร้านค้า');
        return;
      }

      // ตรวจสอบว่าการประเมินเปิดอยู่หรือไม่
      if (!this.evaluationControl?.isEnabled) {
        alert(`การประเมินปิดสำหรับเดือน ${this.evaluationControl?.month}/${this.evaluationControl?.year}: ${this.evaluationControl?.reason}`);
        return;
      }

      // ไม่ต้องตรวจสอบการประเมินซ้ำ เพราะอนุญาตให้แก้ไขได้

      // ตรวจสอบว่าประเมินครบทุกข้อหรือไม่
      if (!this.isEvaluationComplete) {
        const remainingCount = this.evaluationItems.length - Object.keys(this.evaluationResults).filter(key => this.evaluationResults[key] && this.evaluationResults[key] !== '').length;
        alert(`กรุณาประเมินให้ครบทุกหัวข้อ (เหลืออีก ${remainingCount} หัวข้อ)`);
        return;
      }

      try {
        // สร้างข้อมูลการประเมิน
        const evaluationData = {
          shopId: this.shop._id,
          items: this.evaluationItems.map(item => ({
            id: item._id,
            title: item.title,
            description: item.description || '',
            maxScore: parseInt(item.maxScore) || 1,
            status: this.evaluationResults[item._id] || '',
            suggestion: this.evaluationSuggestions[item._id] || '',
            driveLink: this.evaluationDriveLinks[item._id] || ''
          })),
          evaluatedAt: new Date()
        };
        
        console.log('Frontend sending evaluation data:', evaluationData);

        // บันทึกการประเมิน
        const response = await axios.post('/api/evaluations', evaluationData);
        console.log('Evaluation saved:', response.data);

        // ข้อมูลร้านค้าจะถูกอัปเดตโดย backend แล้ว

        // แสดงผลคะแนนใน popup
        const actionText = this.currentEvaluation ? 'แก้ไข' : 'บันทึก'
        const resultMessage = `
          ผลการประเมินร้านค้า: ${this.shop.name}
          
          คะแนนรวม: ${response.data.totalScore}/${this.evaluationItems.reduce((sum, item) => sum + item.maxScore, 0)}
          สถานะ: ${response.data.finalStatus}
          ข้อที่ไม่ผ่าน: ${this.failedItems} ข้อ
          เดือน/ปี: ${this.evaluationControl?.month}/${this.evaluationControl?.year}
          
          ${actionText}การประเมินเรียบร้อยแล้ว!
        `;
        
        alert(resultMessage);
        // ซ่อนฟอร์มการประเมินและแสดงข้อความว่าเสร็จแล้ว
        this.currentEvaluation = response.data;
        this.$emit('evaluation-saved');
      } catch (error) {
        console.error('Error saving evaluation:', error);
        if (error.response) {
          alert(`เกิดข้อผิดพลาดในการบันทึกการประเมิน: ${error.response.data.message || error.response.statusText}`);
        } else {
          alert('เกิดข้อผิดพลาดในการบันทึกการประเมิน: ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
        }
      }
    },

    closeModal() {
      this.$emit('close');
    }
  }
}
</script>

<style scoped>
/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.evaluation-modal {
  max-width: 1000px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 25px 30px;
  border-bottom: 2px solid #e2e8f0;
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  flex-wrap: wrap;
  gap: 20px;
  position: relative;
}

.modal-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 50%, #1f5f8b 100%);
}

.header-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 15px;
}

.header-title i {
  font-size: 28px;
  color: #3498db;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modal-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  line-height: 1.2;
}

.header-subtitle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subtitle-row {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.evaluation-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #718096;
  font-weight: 500;
  padding: 6px 12px;
  background: rgba(52, 152, 219, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(52, 152, 219, 0.2);
}

.evaluation-status i {
  font-size: 16px;
  color: #3498db;
}

.progress-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #f56565;
  font-weight: 600;
  padding: 6px 12px;
  background: rgba(245, 101, 101, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(245, 101, 101, 0.2);
  margin-left: 10px;
}

.progress-status i {
  font-size: 14px;
  color: #f56565;
}

.progress-status.complete {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
}

.progress-status.complete i {
  color: #10b981;
}

.modal-header .header-actions {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.save-evaluation-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
  position: relative;
  overflow: hidden;
}

.save-evaluation-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.save-evaluation-btn:hover::before {
  left: 100%;
}

.save-evaluation-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
}

.save-evaluation-btn.disabled {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.save-evaluation-btn.disabled:hover {
  transform: none;
  box-shadow: none;
}

.save-evaluation-btn i {
  font-size: 16px;
}

.close-btn {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
  color: #4a5568;
  border: none;
  padding: 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.close-btn:hover {
  background: linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.close-btn i {
  font-size: 16px;
}

.modal-body {
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto;
}

/* Evaluation Form Styles */
.evaluation-items h4 {
  margin: 0 0 20px 0;
  color: #2d3748;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 25px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.incomplete-warning {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
  border: 1px solid #ffc107;
  border-radius: 8px;
  color: #856404;
  font-weight: 600;
  font-size: 14px;
}

.incomplete-warning i {
  color: #ffc107;
  font-size: 16px;
}

.evaluation-items h4::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
  border-radius: 2px;
}

.evaluation-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.evaluation-item {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.evaluation-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
  transition: width 0.3s ease;
}

.evaluation-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-color: #3498db;
}

.evaluation-item:hover::before {
  width: 8px;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e2e8f0;
}

.item-number {
  font-weight: 900;
  color: #3498db;
  font-size: 20px;
  min-width: 40px;
  text-align: center;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
  border: 2px solid #3498db;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-title {
  font-weight: 800;
  color: #1a202c;
  font-size: 20px;
  line-height: 1.3;
  margin-bottom: 8px;
}

.item-description {
  font-weight: 400;
  color: #718096;
  font-size: 13px;
  line-height: 1.5;
  background: #f7fafc;
  padding: 12px 16px;
  border-radius: 8px;
  border-left: 3px solid #e2e8f0;
  margin-top: 4px;
}

.item-score {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 10px 18px;
  border-radius: 25px;
  font-size: 15px;
  font-weight: 800;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Evaluation Options */
.evaluation-options {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin: 20px 0;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 12px 20px;
  border-radius: 10px;
  transition: all 0.3s ease;
  border: 2px solid #e2e8f0;
  background: #ffffff;
  min-width: 120px;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.option-label::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.option-label:hover::before {
  left: 100%;
}

.option-label:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #cbd5e0;
}

.option-label input[type="radio"] {
  margin: 0;
  width: 18px;
  height: 18px;
  accent-color: #3498db;
}

.radio-custom {
  font-size: 16px;
  color: #a0aec0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.option-label input[type="radio"]:checked + .radio-custom {
  background: #3498db;
  border-color: #3498db;
  color: white;
  transform: scale(1.05);
}

.option-text {
  font-size: 15px;
  color: #4a5568;
  font-weight: 600;
}

.pass-option {
  background: #ffffff;
  border-color: #e2e8f0;
}

.pass-option:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.pass-option input[type="radio"]:checked {
  background: #48bb78;
  border-color: #48bb78;
}

.pass-option input[type="radio"]:checked + .radio-custom {
  background: #48bb78;
  border-color: #48bb78;
}

.pass-option input[type="radio"]:checked ~ .option-text {
  color: #48bb78;
  font-weight: 700;
}

.pass-option:has(input[type="radio"]:checked) {
  background: #f0fff4;
  border-color: #48bb78;
  box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.1);
}

.fail-option {
  background: #ffffff;
  border-color: #e2e8f0;
}

.fail-option:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.fail-option input[type="radio"]:checked + .radio-custom {
  background: #f56565;
  border-color: #f56565;
}

.fail-option input[type="radio"]:checked ~ .option-text {
  color: #f56565;
  font-weight: 700;
}

.fail-option:has(input[type="radio"]:checked) {
  background: #fff5f5;
  border-color: #f56565;
  box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1);
}

/* Evaluation Table */
.evaluation-table-container {
  margin-top: 20px;
  overflow-x: auto;
}

.evaluation-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.evaluation-table thead {
  background: #f8f9fa;
}

.evaluation-table th {
  padding: 15px 12px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
}

.evaluation-table th:last-child {
  border-right: none;
}

.evaluation-table td {
  padding: 15px 12px;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
  vertical-align: top;
}

.evaluation-table td:last-child {
  border-right: none;
}

.evaluation-row:hover {
  background: #f9fafb;
}

/* Column widths */
.col-order {
  width: 80px;
  text-align: center;
}

.col-topic {
  width: 300px;
}

.col-pass, .col-fail {
  width: 100px;
  text-align: center;
}

.col-suggestion {
  width: 250px;
}

.col-file {
  width: 200px;
}

/* Order number */
.order-number {
  font-weight: 600;
  font-size: 16px;
  color: #374151;
}

/* Topic content */
.topic-content {
  text-align: left;
}

.topic-title {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
  margin-bottom: 5px;
  line-height: 1.4;
}

.topic-description {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  line-height: 1.5;
}

.topic-score {
  font-size: 12px;
  color: #059669;
  font-weight: 500;
}

/* Checkbox styling */
.checkbox-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  width: 24px;
  height: 24px;
}

.checkbox-label input[type="radio"] {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  background: white;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkbox-label input[type="radio"]:checked + .checkbox-custom {
  background: #10b981;
  border-color: #10b981;
}

.checkbox-label input[type="radio"]:checked + .checkbox-custom::after {
  content: '✓';
  color: white;
  font-size: 12px;
  font-weight: bold;
}

/* Suggestion and file inputs */
.suggestion-container, .file-container {
  width: 100%;
}

.suggestion-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  font-family: inherit;
  background: white;
  transition: border-color 0.3s ease;
  resize: vertical;
  min-height: 60px;
}

.suggestion-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.suggestion-textarea::placeholder {
  color: #9ca3af;
}

.file-link-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  transition: border-color 0.3s ease;
}

.file-link-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.file-link-input::placeholder {
  color: #9ca3af;
}

/* Evaluation Completed Message */
.evaluation-completed-message {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
  border: 2px dashed #cbd5e0;
  margin: 20px 0;
}

.message-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.message-icon {
  font-size: 4rem;
  color: #48bb78;
}

.message-content h4 {
  margin: 0;
  color: #2d3748;
  font-size: 20px;
  font-weight: 700;
}

.message-content p {
  margin: 10px 0 0 0;
  color: #718096;
  font-size: 16px;
  font-weight: 500;
}

/* No Shop Selected */
.no-shop-selected {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
  border: 2px dashed #cbd5e0;
  margin: 20px 0;
}

.no-shop-selected i {
  font-size: 3rem;
  margin-bottom: 15px;
  color: #a0aec0;
  display: block;
}

.no-shop-selected p {
  font-size: 16px;
  font-weight: 500;
  margin: 0;
  color: #718096;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal {
    width: 95%;
    max-height: 95vh;
  }

  .modal-header {
    padding: 20px;
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .header-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .modal-header h3 {
    font-size: 20px;
  }

  .header-actions {
    justify-content: center;
  }

  .evaluation-item {
    padding: 20px;
  }

  .item-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    text-align: center;
  }

  .item-info {
    align-items: center;
    text-align: center;
  }

  .item-title {
    font-size: 16px;
    text-align: center;
  }

  .item-description {
    font-size: 13px;
    text-align: center;
  }

  .evaluation-options {
    flex-direction: column;
    gap: 15px;
  }

  .option-label {
    width: 100%;
    justify-content: center;
  }

  .suggestion-textarea {
    min-height: 60px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .evaluation-options {
    gap: 15px;
  }

  .option-label {
    min-width: 130px;
    padding: 12px 20px;
  }
}
</style>