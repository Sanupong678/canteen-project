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
              <span class="evaluation-status">
                <i class="fas fa-info-circle"></i>
                ระบบประเมินคุณภาพร้านค้า
              </span>
            </div>
          </div>
          <div class="header-actions">
            <button 
              v-if="activeTab === 'evaluate' && shop" 
              @click="saveEvaluation" 
              class="save-evaluation-btn"
            >
              <i class="fas fa-save"></i>
              <span>บันทึกแบบประเมิน</span>
            </button>
            <button @click="closeModal" class="close-btn">
              <i class="fas fa-times"></i>
              <span>ปิด</span>
            </button>
          </div>
        </div>
      <div class="modal-body">
                 <!-- Tabs -->
         <div class="tabs">
           <button 
             @click="activeTab = 'evaluate'" 
             :class="['tab-btn', { active: activeTab === 'evaluate' }]"
           >
             <i class="fas fa-clipboard-check"></i>
             ประเมินร้านค้า
           </button>
           <button 
             @click="activeTab = 'manage'" 
             :class="['tab-btn', { active: activeTab === 'manage' }]"
           >
             <i class="fas fa-list"></i>
             จัดการหัวข้อประเมิน
           </button>
         </div>

        <!-- Manage Items Tab -->
        <div v-if="activeTab === 'manage'" class="tab-content">
          <div class="section-header">
            <h4>หัวข้อประเมิน</h4>
            <button @click="showAddItemModal = true" class="add-item-btn">
              <i class="fas fa-plus"></i>
              เพิ่มหัวข้อใหม่
            </button>
          </div>

          <!-- Items List -->
          <div class="items-list">
            <div v-for="item in evaluationItems" :key="item._id" class="item-card">
              <div class="item-content">
                <div class="item-title">{{ item.title }}</div>
                <div class="item-order">ลำดับ: {{ item.order }}</div>
              </div>
                             <div class="item-actions">
                 <button @click="editItem(item)" class="edit-btn">
                   <i class="fas fa-edit"></i>
                   แก้ไข
                 </button>
                 <button @click="deleteItem(item._id)" class="delete-btn">
                   <i class="fas fa-trash"></i>
                   ลบ
                 </button>
               </div>
            </div>
          </div>

          <!-- No Items Message -->
          <div v-if="evaluationItems.length === 0" class="no-items">
            <i class="fas fa-clipboard-list"></i>
            <p>ยังไม่มีหัวข้อประเมิน</p>
          </div>
        </div>

        <!-- Evaluate Shop Tab -->
        <div v-if="activeTab === 'evaluate'" class="tab-content">
          <!-- Evaluation Items -->
          <div v-if="shop" class="evaluation-items">
            <!-- Show evaluation form if no current evaluation -->
            <div v-if="!currentEvaluation">
              <h4>หัวข้อประเมิน</h4>
              <div class="evaluation-table">
                <div class="table-header">
                  <div class="header-cell factor-header">
                    <i class="fas fa-list-check"></i>
                    ประเด็นปัจจัย
                  </div>
                  <div class="header-cell pass-header">
                    <i class="fas fa-check-circle"></i>
                    ผ่าน
                  </div>
                  <div class="header-cell fail-header">
                    <i class="fas fa-times-circle"></i>
                    ไม่ผ่าน
                  </div>
                </div>
                <div class="table-body">
                  <div v-for="item in evaluationItems" :key="item._id" class="table-row">
                    <div class="cell factor-cell">
                      <div class="item-content">
                        <span class="item-number">{{ item.order }}.</span>
                        <span class="item-title">{{ item.title }}</span>
                      </div>
                    </div>
                    <div class="cell checkbox-cell">
                      <label class="checkbox-label pass-label">
                        <input 
                          type="checkbox" 
                          :name="'status_' + item._id" 
                          :value="'ผ่าน'"
                          :checked="evaluationResults[item._id] && evaluationResults[item._id].includes('ผ่าน')"
                          :data-debug="`item._id: ${item._id}, evaluationResults: ${JSON.stringify(evaluationResults[item._id])}`"
                          @change="handleCheckboxChange(item._id, 'ผ่าน')"
                        />
                        <span class="checkbox-custom">
                          <i class="fas fa-check"></i>
                        </span>
                        <span class="checkbox-text">ผ่าน</span>
                      </label>
                    </div>
                    <div class="cell checkbox-cell">
                      <label class="checkbox-label fail-label">
                        <input 
                          type="checkbox" 
                          :name="'status_' + item._id" 
                          :value="'ไม่ผ่าน'"
                          :checked="evaluationResults[item._id] && evaluationResults[item._id].includes('ไม่ผ่าน')"
                          :data-debug="`item._id: ${item._id}, evaluationResults: ${JSON.stringify(evaluationResults[item._id])}`"
                          @change="handleCheckboxChange(item._id, 'ไม่ผ่าน')"
                        />
                        <span class="checkbox-custom">
                          <i class="fas fa-times"></i>
                        </span>
                        <span class="checkbox-text">ไม่ผ่าน</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Show message if evaluation is completed -->
            <div v-else class="evaluation-completed-message">
              <div class="message-card">
                <div class="message-icon">
                  <i class="fas fa-check"></i>
                </div>
                <div class="message-content">
                  <h4>คุณได้ทำแบบประเมินร้านค้านี้ไปแล้ว</h4>
                  <p>หากต้องการแก้ไข สามารถแก้ไขได้ที่ประวัติด้านล่าง</p>
                </div>
              </div>
            </div>

            <!-- Score Summary -->
            <div class="score-summary">
              <div class="score-summary-header">
                <h4><i class="fas fa-chart-line"></i> สรุปคะแนน</h4>
              </div>
              <div class="score-summary-grid">
                <div class="score-item">
                  <div class="score-label">
                    <i class="fas fa-star"></i>
                    คะแนนรวม
                  </div>
                  <div class="score-value">
                    <span class="score-number">{{ scoreSummaryData.totalScore }}</span>
                    <span class="score-max">/100</span>
                  </div>
                </div>
                <div class="score-item">
                  <div class="score-label">
                    <i class="fas fa-check-circle"></i>
                    สถานะ
                  </div>
                  <div class="score-value">
                    <span :class="['status-badge', scoreSummaryData.finalStatus === 'ผ่าน' ? 'passed' : 'failed']">
                      <i :class="scoreSummaryData.finalStatus === 'ผ่าน' ? 'fas fa-check' : 'fas fa-times'"></i>
                      {{ scoreSummaryData.finalStatus }}
                    </span>
                  </div>
                </div>
                <div class="score-item">
                  <div class="score-label">
                    <i class="fas fa-exclamation-triangle"></i>
                    ข้อที่ไม่ผ่าน
                  </div>
                  <div class="score-value failed-count">
                    {{ databaseFailedItemsData.failedCount }} ข้อ
                  </div>
                </div>
              </div>
              
              <!-- Failed Items List -->
              <div v-if="databaseFailedItemsData.failedCount > 0" class="failed-items-section">
                <div class="failed-items-header">
                  <h5><i class="fas fa-list-ul"></i> รายการข้อที่ไม่ผ่าน</h5>
                </div>
                <div class="failed-items-list">
                  <div v-for="item in databaseFailedItemsData.failedItemsList" :key="item.id" class="failed-item">
                    <div class="failed-item-content">
                      <span class="failed-item-number">{{ item.order || '?' }}.</span>
                      <span class="failed-item-title">{{ item.title }}</span>
                    </div>
                    <div class="failed-item-status">
                      <span class="status-indicator failed">
                        <i class="fas fa-times"></i>
                        ไม่ผ่าน
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>


              <!-- Evaluation History -->
              <div v-if="evaluationHistory.length > 0" class="evaluation-history">
                <div class="history-header">
                  <h4><i class="fas fa-history"></i> ประวัติการประเมิน</h4>
                  <span class="history-count">{{ evaluationHistory.length }} รายการ</span>
                </div>
                <div class="history-grid">
                  <div v-for="history in evaluationHistory" :key="history._id" class="history-card">
                                      <div class="history-card-content">
                    <div class="history-date-time">
                      <span class="history-month">{{ history.evaluationMonth }}/{{ history.evaluationYear }}</span>
                      <span class="history-date">{{ formatDate(history.evaluatedAt) }}</span>
                    </div>
                    <div class="history-score">
                      <span class="score-number">{{ history.totalScore }}</span>
                      <span class="score-max">/100</span>
                    </div>
                    <div class="history-actions">
                      <button @click="viewHistoryDetails(history)" class="action-btn detail-btn">
                        <i class="fas fa-eye"></i>
                          <span>รายละเอียด</span>
                      </button>
                      <button @click="editHistory(history)" class="action-btn edit-btn">
                        <i class="fas fa-edit"></i>
                          <span>แก้ไข</span>
                      </button>
                    </div>
                  </div>
                  </div>
                </div>
              </div>
              
              <!-- No History Message -->
              <div v-else class="no-history-message">
                <div class="no-history-content">
                  <i class="fas fa-history"></i>
                  <h5>ยังไม่มีประวัติการประเมิน</h5>
                  <p>เมื่อมีการประเมินร้านค้านี้ ประวัติจะแสดงที่นี่</p>
                </div>
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

    <!-- Add/Edit Item Modal -->
    <div v-if="showAddItemModal" class="modal-overlay" @click="closeAddItemModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ editingItem ? 'แก้ไขหัวข้อ' : 'เพิ่มหัวข้อใหม่' }}</h3>
          <button @click="closeAddItemModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
                 <div class="modal-body">
           <div class="form-group">
             <label>หัวข้อประเมิน:</label>
             <input 
               v-model="itemForm.title" 
               type="text" 
               class="form-input"
               placeholder="พิมพ์หัวข้อประเมิน..."
             />
           </div>
         </div>
        <div class="modal-footer">
          <button @click="closeAddItemModal" class="cancel-btn">ยกเลิก</button>
          <button @click="saveItem" class="save-btn">
            {{ editingItem ? 'อัปเดต' : 'เพิ่ม' }}
          </button>
        </div>
      </div>
    </div>

    <!-- History Details Modal -->
    <div v-if="showHistoryDetails" class="modal-overlay" @click="showHistoryDetails = false">
      <div class="modal history-modal" @click.stop>
        <div class="modal-header">
          <div class="header-content">
            <div class="header-title">
              <i class="fas fa-clipboard-list"></i>
              <h3>รายละเอียดการประเมิน</h3>
            </div>
            <div class="header-subtitle">
              <span class="shop-name">{{ selectedHistory?.shopName }}</span>
              <span class="evaluation-date">{{ formatDate(selectedHistory?.evaluatedAt) }}</span>
            </div>
          </div>
          <div class="header-actions">
            <button v-if="!isEditing" @click="toggleEditMode" class="edit-mode-btn">
              <i class="fas fa-edit"></i>
              แก้ไข
            </button>
            <button v-else @click="cancelEdit" class="cancel-edit-btn">
              <i class="fas fa-times"></i>
              ยกเลิก
            </button>
            <button @click="showHistoryDetails = false" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <div class="modal-body">
          <div v-if="selectedHistory" class="history-details">
            <!-- Evaluation Details -->
            <div class="evaluation-details-section">
              <div class="section-header">
                <h4>
                  <i class="fas fa-list-check"></i>
                  {{ isEditing ? 'แก้ไขการประเมิน' : 'รายละเอียดการประเมิน' }}
                </h4>
                <div v-if="isEditing" class="edit-info">
                  <i class="fas fa-info-circle"></i>
                  <span>คลิกที่ช่องเพื่อเปลี่ยนสถานะ</span>
                </div>
              </div>

              <div class="evaluation-items-grid">
                <div v-for="item in getEvaluationItemsForHistory(selectedHistory)" :key="item._id" class="evaluation-item-card">
                  <div class="item-row">
                    <div class="item-info">
                      <span class="item-number">{{ item.order || '?' }}.</span>
                      <span class="item-title">{{ item.title }}</span>
                  </div>
                  
                  <div v-if="isEditing" class="evaluation-options">
                    <label class="option-label pass-option">
                      <input 
                        type="checkbox" 
                        :name="'status_' + item._id" 
                        :value="'ผ่าน'"
                        :checked="evaluationResults[item._id] && evaluationResults[item._id].includes('ผ่าน')"
                        @change="handleCheckboxChange(item._id, 'ผ่าน')"
                      />
                      <span class="checkbox-custom">
                        <i class="fas fa-check"></i>
                      </span>
                      <span class="option-text">ผ่าน</span>
                    </label>
                    <label class="option-label fail-option">
                      <input 
                        type="checkbox" 
                        :name="'status_' + item._id" 
                        :value="'ไม่ผ่าน'"
                        :checked="evaluationResults[item._id] && evaluationResults[item._id].includes('ไม่ผ่าน')"
                        @change="handleCheckboxChange(item._id, 'ไม่ผ่าน')"
                      />
                      <span class="checkbox-custom">
                        <i class="fas fa-times"></i>
                      </span>
                      <span class="option-text">ไม่ผ่าน</span>
                    </label>
                  </div>
                  
                  <div v-else class="item-status">
                    <span :class="['status-indicator', item.status === 'ผ่าน' ? 'passed' : 'failed']">
                      <i :class="item.status === 'ผ่าน' ? 'fas fa-check' : 'fas fa-times'"></i>
                      {{ item.status === 'ผ่าน' ? 'ผ่าน' : 'ไม่ผ่าน' }}
                    </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Live Score Summary (when editing) -->
              <div v-if="isEditing" class="live-score-summary">
                <div class="score-card">
                  <div class="score-header">
                    <h5><i class="fas fa-calculator"></i> คะแนนปัจจุบัน</h5>
                  </div>
                  <div class="score-content">
                    <div class="score-display">
                      <span class="current-score">{{ scoreSummaryData.totalScore }}</span>
                      <span class="score-max">/100</span>
                    </div>
                    <div class="score-status">
                      <span :class="['status-badge', scoreSummaryData.finalStatus === 'ผ่าน' ? 'passed' : 'failed']">
                        <i :class="scoreSummaryData.finalStatus === 'ผ่าน' ? 'fas fa-check' : 'fas fa-times'"></i>
                        {{ scoreSummaryData.finalStatus }}
                      </span>
                    </div>
                    <div class="failed-items">
                      <i class="fas fa-exclamation-triangle"></i>
                      <span>ข้อที่ไม่ผ่าน: {{ databaseFailedItemsData.failedCount }} ข้อ</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button @click="showHistoryDetails = false" class="cancel-btn">
            <i class="fas fa-times"></i>
            ปิด
          </button>
          <button v-if="isEditing" @click="updateEvaluation" class="save-btn">
            <i class="fas fa-save"></i>
            บันทึกการแก้ไข
          </button>
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
      activeTab: 'evaluate',
      evaluationItems: [],
      showAddItemModal: false,
      editingItem: null,
      itemForm: {
        title: ''
      },
      evaluationResults: {},
      totalScore: 100,
      evaluationControl: null,
      currentEvaluation: null,
      evaluationHistory: [],
      showHistoryDetails: false,
      selectedHistory: null,
      isEditing: false,
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
       return this.totalScore >= 50 ? 'ผ่าน' : 'ไม่ผ่าน';
     },
    failedItems() {
      let count = 0;
      const itemsToCheck = this.isEditing && this.selectedHistory 
        ? this.getEvaluationItemsForHistory(this.selectedHistory)
        : this.evaluationItems;
      
      itemsToCheck.forEach(item => {
        const result = this.evaluationResults[item._id];
        if (result && result.includes('ไม่ผ่าน')) {
          count++;
        }
      });
      return count;
    },
    // เพิ่ม computed property สำหรับดึงข้อมูลจาก database
    scoreSummaryData() {
      // ถ้ามีการประเมินปัจจุบัน ให้ใช้ข้อมูลจากนั้น
      if (this.currentEvaluation) {
        // ดึงข้อมูลข้อที่ไม่ผ่านจาก database
        const failedItemsFromDB = this.currentEvaluation.items?.filter(item => item.status === 'ไม่ผ่าน') || [];
        
        return {
          totalScore: this.currentEvaluation.totalScore || 100,
          finalStatus: this.currentEvaluation.finalStatus || 'ไม่ผ่าน',
          failedItems: failedItemsFromDB.length,
          failedItemsList: failedItemsFromDB // เพิ่มรายการข้อที่ไม่ผ่าน
        };
      }
      
      // ถ้าไม่มี ให้คำนวณจากข้อมูลปัจจุบัน
      const currentFailedItems = this.evaluationItems.filter(item => {
        const result = this.evaluationResults[item._id];
        return result && result.includes('ไม่ผ่าน');
      });
      
      return {
        totalScore: this.totalScore,
        finalStatus: this.finalStatus,
        failedItems: this.failedItems,
        failedItemsList: currentFailedItems // เพิ่มรายการข้อที่ไม่ผ่าน
      };
    },
    // เพิ่ม computed property สำหรับดึงข้อมูลข้อที่ไม่ผ่านจาก history
    historyFailedItemsData() {
      if (!this.selectedHistory) return { failedItems: 0, failedItemsList: [] };
      
      const failedItemsFromHistory = this.selectedHistory.items?.filter(item => item.status === 'ไม่ผ่าน') || [];
      
      return {
        failedItems: failedItemsFromHistory.length,
        failedItemsList: failedItemsFromHistory
      };
    },
    // เพิ่ม computed property สำหรับดึงข้อมูล failed items จาก database
    databaseFailedItemsData() {
      // ถ้ามี currentEvaluation ให้ใช้ข้อมูลจากนั้น
      if (this.currentEvaluation && this.currentEvaluation.items) {
        const failedItems = this.currentEvaluation.items.filter(item => item.status === 'ไม่ผ่าน');
        return {
          failedCount: failedItems.length,
          totalItems: this.currentEvaluation.items.length,
          failedItemsList: failedItems.map(item => ({
            id: item.id,
            title: item.title,
            status: item.status,
            order: item.order || 1
          }))
        };
      }
      
      // ถ้าไม่มี currentEvaluation ให้ใช้ข้อมูลจาก evaluationHistory ล่าสุด
      if (this.evaluationHistory && this.evaluationHistory.length > 0) {
        const latestHistory = this.evaluationHistory[0];
        const failedItems = latestHistory.items?.filter(item => item.status === 'ไม่ผ่าน') || [];
        return {
          failedCount: failedItems.length,
          totalItems: latestHistory.items?.length || 0,
          failedItemsList: failedItems.map(item => ({
            id: item.id,
            title: item.title,
            status: item.status,
            order: item.order || 1
          }))
        };
      }
      
      // ถ้าไม่มีข้อมูลใดๆ
      return {
        failedCount: 0,
        totalItems: 0,
        failedItemsList: []
      };
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
        this.loadEvaluationHistory();
        // รีเซ็ตข้อมูลเมื่อเปิด modal ใหม่
        if (!this.currentEvaluation) {
          this.evaluationResults = {};
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
      this.loadEvaluationHistory();
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
        // ตรวจสอบสถานะการประเมินจาก database
        console.log('Checking shop evaluation status:', {
          evaluationCompleted: this.shop.evaluationCompleted,
          evaluationDate: this.shop.evaluationDate,
          score: this.shop.score,
          evaluationStatus: this.shop.evaluationStatus
        });
        
        if (this.shop.evaluationCompleted === true && this.shop.evaluationDate) {
          console.log('Shop has completed evaluation:', this.shop);
          this.currentEvaluation = {
            evaluationMonth: new Date(this.shop.evaluationDate).getMonth() + 1,
            evaluationYear: new Date(this.shop.evaluationDate).getFullYear(),
            totalScore: this.shop.score || 100,
            finalStatus: this.shop.evaluationStatus || 'ผ่าน',
            evaluatedAt: this.shop.evaluationDate
          };
          console.log('Set currentEvaluation from shop data:', this.currentEvaluation);
          return;
        }
        
        // ตรวจสอบว่ามีหัวข้อใหม่หรือไม่
        const checkResponse = await axios.get(`/api/evaluations/check-new-items/${this.shop._id}`);
        const { hasNewItems, needsReset } = checkResponse.data;
        
        if (hasNewItems && needsReset) {
          console.log('New evaluation items detected, resetting evaluation');
          const shouldReset = confirm('พบหัวข้อการประเมินใหม่ที่เพิ่มเข้ามา ต้องการรีเซ็ตการประเมินและทำใหม่หรือไม่?');
          if (shouldReset) {
            await this.resetEvaluationForNewItems();
            return;
          }
        }
        
        const response = await axios.get(`/api/evaluations/shop/${this.shop._id}/current`);
        this.currentEvaluation = response.data;
        console.log('Current evaluation:', this.currentEvaluation);
        
        // โหลดการประเมินที่เคยทำไว้
        if (this.currentEvaluation && this.currentEvaluation.items) {
          this.evaluationResults = {};
          console.log('Loading evaluation items:', this.currentEvaluation.items);
          
          this.currentEvaluation.items.forEach(item => {
            console.log('Processing item:', item);
            if (item.id) {
              // ถ้า status เป็นค่าว่าง ให้ข้ามไป
              if (item.status && item.status !== '') {
                this.evaluationResults[item.id] = [item.status];
                console.log(`Set evaluationResults[${item.id}] = [${item.status}]`);
              } else {
                console.log(`Skipping item ${item.id} because status is empty or undefined`);
                // ตั้งค่าเริ่มต้นเป็นค่าว่าง
                this.evaluationResults[item.id] = [];
              }
            }
          });
          
          console.log('Final evaluationResults:', this.evaluationResults);
          // คำนวณคะแนนจากข้อมูลที่โหลดมา
          this.calculateScore();
        } else {
          console.log('No current evaluation found or no items');
        }
        
        // แจ้งเตือนถ้าไม่มีข้อมูลการประเมินที่ถูกต้อง
        if (this.currentEvaluation && this.currentEvaluation.items) {
          const hasValidStatus = this.currentEvaluation.items.some(item => item.status && item.status !== '');
          if (!hasValidStatus) {
            console.log('Warning: Current evaluation exists but all items have empty status');
            const shouldDelete = confirm('พบข้อมูลการประเมินที่ยังไม่เสร็จสมบูรณ์ ต้องการลบข้อมูลเก่าและทำการประเมินใหม่หรือไม่?');
            if (shouldDelete) {
              await this.deleteIncompleteEvaluation();
            }
          }
        }
      } catch (error) {
        console.error('Error loading current evaluation:', error);
        this.currentEvaluation = null;
      }
    },

    async deleteIncompleteEvaluation() {
      if (!this.currentEvaluation) return;
      
      try {
        await axios.delete(`/api/evaluations/${this.currentEvaluation._id}`);
        console.log('Deleted incomplete evaluation');
        this.currentEvaluation = null;
        this.evaluationResults = {};
        this.totalScore = 100;
        alert('ลบข้อมูลการประเมินที่ไม่เสร็จสมบูรณ์เรียบร้อยแล้ว');
      } catch (error) {
        console.error('Error deleting incomplete evaluation:', error);
        alert('เกิดข้อผิดพลาดในการลบข้อมูลการประเมิน');
      }
    },

    async loadEvaluationHistory() {
      if (!this.shop) {
        console.log('No shop selected, skipping history load');
        return;
      }
      
      console.log('Loading evaluation history for shop:', this.shop._id);
      
      try {
        const response = await axios.get(`/api/evaluations/shop/${this.shop._id}/history`);
        this.evaluationHistory = response.data || [];
        console.log('Loaded evaluation history:', this.evaluationHistory);
        console.log('History length:', this.evaluationHistory.length);
      } catch (error) {
        console.error('Error loading evaluation history:', error);
        if (error.response) {
          console.error('Server error:', error.response.data);
        }
        this.evaluationHistory = [];
      }
    },

    async loadFailedItemsData() {
      console.log('🔄 loadFailedItemsData called');
      console.log('📊 Shop data:', this.shop);
      
      if (!this.shop) {
        console.log('❌ No shop selected, skipping failed items load');
        return;
      }
      
      if (!this.shop._id) {
        console.log('❌ Shop has no _id, skipping failed items load');
        return;
      }
      
      console.log('🔄 Loading failed items data for shop:', this.shop._id);
      
      try {
        // เพิ่ม timeout และ retry logic
        const response = await axios.get(`/api/evaluations/shop/${this.shop._id}/failed-count`, {
          timeout: 10000 // 10 seconds timeout
        });
        console.log('📊 API Response:', response.data);
        
        this.failedItemsData = response.data || {
          failedCount: 0,
          totalItems: 0,
          failedItemsList: []
        };
        
        console.log('✅ Loaded failed items data:', this.failedItemsData);
        console.log('📈 Failed count:', this.failedItemsData.failedCount);
        console.log('📋 Failed items list:', this.failedItemsData.failedItemsList);
        
        // Force reactivity update
        this.$forceUpdate();
      } catch (error) {
        console.error('❌ Error loading failed items data:', error);
        if (error.response) {
          console.error('Server error:', error.response.data);
        }
        this.failedItemsData = {
          failedCount: 0,
          totalItems: 0,
          failedItemsList: []
        };
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    viewHistoryDetails(history) {
      this.selectedHistory = history;
      this.showHistoryDetails = true;
      this.isEditing = false;
    },

    editHistory(history) {
      this.selectedHistory = history;
      this.showHistoryDetails = true;
      this.isEditing = true;
      // โหลดข้อมูลการประเมินเพื่อแก้ไข
      this.loadHistoryForEdit(history);
    },

    toggleEditMode() {
      this.isEditing = true;
      this.loadHistoryForEdit(this.selectedHistory);
    },

    cancelEdit() {
      this.isEditing = false;
      // รีเซ็ตข้อมูลการประเมิน
      this.evaluationResults = {};
      this.totalScore = 100;
    },

    async loadHistoryForEdit(history) {
      try {
        // โหลดข้อมูลการประเมินเพื่อแก้ไข (เฉพาะหัวข้อที่มีในเดือนนั้น)
        this.evaluationResults = {};
        if (history.items) {
          history.items.forEach(item => {
            if (item.id && item.status) {
              this.evaluationResults[item.id] = [item.status];
            }
          });
        }
        this.calculateScore();
      } catch (error) {
        console.error('Error loading history for edit:', error);
      }
    },

    // ดึงหัวข้อเฉพาะเดือนที่ทำการประเมิน
    getEvaluationItemsForHistory(history) {
      if (!history || !history.items) return [];
      
      // สร้าง map ของหัวข้อที่มีในเดือนนั้น
      const historyItemMap = {};
      history.items.forEach(item => {
        historyItemMap[item.id] = {
          _id: item.id,
          title: item.title,
          status: item.status,
          order: item.order || 1
        };
      });
      
      // เรียงลำดับตาม order
      return Object.values(historyItemMap).sort((a, b) => a.order - b.order);
    },

    async updateEvaluation() {
      if (!this.selectedHistory) return;
      
      try {
        // ใช้หัวข้อเฉพาะเดือนที่ทำการประเมิน
        const historyItems = this.getEvaluationItemsForHistory(this.selectedHistory);
        const evaluationData = {
          items: historyItems.map(item => ({
            id: item._id,
            title: item.title,
            status: this.evaluationResults[item._id] && this.evaluationResults[item._id].length > 0 
              ? this.evaluationResults[item._id][0] : ''
          })),
          totalScore: this.totalScore,
          finalStatus: this.finalStatus
        };

        await axios.put(`/api/evaluations/${this.selectedHistory._id}`, evaluationData);
        
        // อัปเดตข้อมูลร้านค้า
        await axios.put(`/api/shops/${this.shop._id}`, {
          score: this.totalScore,
          evaluationStatus: this.finalStatus
        });

        alert('อัปเดตการประเมินเรียบร้อยแล้ว');
        this.showHistoryDetails = false;
        this.selectedHistory = null;
        this.isEditing = false;
        
        // โหลดประวัติใหม่
        await this.loadEvaluationHistory();
      } catch (error) {
        console.error('Error updating evaluation:', error);
        alert('เกิดข้อผิดพลาดในการอัปเดตการประเมิน');
      }
    },

    editCurrentEvaluation() {
      this.isEditing = true;
      this.selectedHistory = this.currentEvaluation;
      this.showHistoryDetails = true;
      this.loadHistoryForEdit(this.currentEvaluation);
    },

    async resetEvaluationForNewItems() {
      if (!this.currentEvaluation) return;
      
      try {
        // ลบการประเมินปัจจุบัน
        await axios.delete(`/api/evaluations/${this.currentEvaluation._id}`);
        console.log('Deleted current evaluation for new items');
        
        // รีเซ็ตข้อมูล
        this.currentEvaluation = null;
        this.evaluationResults = {};
        this.totalScore = 100;
        
        alert('รีเซ็ตการประเมินเรียบร้อยแล้ว กรุณาทำการประเมินใหม่');
      } catch (error) {
        console.error('Error resetting evaluation for new items:', error);
        alert('เกิดข้อผิดพลาดในการรีเซ็ตการประเมิน');
      }
    },

         closeModal() {
       this.$emit('close');
       this.activeTab = 'evaluate';
       // ไม่รีเซ็ต evaluationResults เพื่อเก็บข้อมูลการประเมินไว้
       // this.evaluationResults = {};
       // this.totalScore = 100;
     },

    editItem(item) {
      this.editingItem = item;
      this.itemForm = {
        title: item.title
      };
      this.showAddItemModal = true;
    },

    async deleteItem(itemId) {
      if (!confirm('คุณต้องการลบหัวข้อนี้หรือไม่?')) return;

      try {
        const response = await axios.delete(`/api/evaluations/items/${itemId}`);
        console.log('Deleted evaluation item from database:', response.data);
        
        // โหลดข้อมูลใหม่จาก database
        await this.loadEvaluationItems();
        alert('ลบหัวข้อเรียบร้อยแล้ว');
      } catch (error) {
        console.error('Error deleting evaluation item from database:', error);
        if (error.response) {
          alert(`เกิดข้อผิดพลาดในการลบหัวข้อ: ${error.response.data.message || error.response.statusText}`);
        } else {
          alert('เกิดข้อผิดพลาดในการลบหัวข้อ: ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
        }
      }
    },

    closeAddItemModal() {
      this.showAddItemModal = false;
      this.editingItem = null;
      this.itemForm = {
        title: ''
      };
    },

    async saveItem() {
      if (!this.itemForm.title.trim()) {
        alert('กรุณาใส่หัวข้อประเมิน');
        return;
      }

      try {
        // เพิ่ม order อัตโนมัติเป็นจำนวนหัวข้อที่มีอยู่ + 1
        const newOrder = this.evaluationItems.length + 1;
        const itemData = {
          title: this.itemForm.title.trim(),
          order: newOrder
        };

        let response;
        if (this.editingItem) {
          // อัปเดตหัวข้อที่มีอยู่
          response = await axios.put(`/api/evaluations/items/${this.editingItem._id}`, itemData);
          console.log('Updated evaluation item:', response.data);
        } else {
          // สร้างหัวข้อใหม่
          response = await axios.post('/api/evaluations/items', itemData);
          console.log('Created new evaluation item:', response.data);
          
          // แจ้งเตือนว่ามีหัวข้อใหม่เพิ่มเข้ามา
          alert('เพิ่มหัวข้อใหม่เรียบร้อยแล้ว การประเมินในเดือนปัจจุบันจะถูกรีเซ็ตเพื่อรวมหัวข้อใหม่ (ประวัติเก่าไม่ได้รับผลกระทบ)');
        }
        
        // โหลดข้อมูลใหม่จาก database
        await this.loadEvaluationItems();
        this.closeAddItemModal();
        
        const message = this.editingItem ? 'อัปเดตหัวข้อเรียบร้อยแล้ว' : 'เพิ่มหัวข้อเรียบร้อยแล้ว';
        if (this.editingItem) {
          alert(message);
        }
        console.log('Evaluation items saved to database successfully');
      } catch (error) {
        console.error('Error saving evaluation item to database:', error);
        if (error.response) {
          alert(`เกิดข้อผิดพลาดในการบันทึก: ${error.response.data.message || error.response.statusText}`);
        } else {
          alert('เกิดข้อผิดพลาดในการบันทึก: ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
        }
      }
    },

    calculateScore() {
      let score = 100;
      let failedCount = 0;
      
      // ตรวจสอบแต่ละหัวข้อ (ใช้หัวข้อปัจจุบันหรือหัวข้อในประวัติ)
      const itemsToCheck = this.isEditing && this.selectedHistory 
        ? this.getEvaluationItemsForHistory(this.selectedHistory)
        : this.evaluationItems;
      
      itemsToCheck.forEach(item => {
        const result = this.evaluationResults[item._id];
        if (result && result.includes('ไม่ผ่าน')) {
          score -= 1;
          failedCount++;
        }
      });
      
      this.totalScore = Math.max(0, score);
    },

    handleCheckboxChange(itemId, value) {
      // ถ้าเลือก checkbox นี้ ให้ยกเลิกการเลือก checkbox อื่นของหัวข้อเดียวกัน
      if (this.evaluationResults[itemId] && this.evaluationResults[itemId].includes(value)) {
        // ถ้าเลือกอยู่แล้ว ให้ยกเลิก
        this.evaluationResults[itemId] = this.evaluationResults[itemId].filter(v => v !== value);
      } else {
        // ถ้าเลือกใหม่ ให้ยกเลิกตัวอื่นก่อน แล้วเลือกตัวนี้
        this.evaluationResults[itemId] = [value];
      }
      
      this.calculateScore();
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

      // ตรวจสอบว่าประเมินซ้ำในเดือนเดียวกันหรือไม่
      if (this.currentEvaluation) {
        alert(`ร้านค้านี้ได้รับการประเมินแล้วในเดือน ${this.evaluationControl?.month}/${this.evaluationControl?.year}`);
        return;
      }

      // ตรวจสอบว่าประเมินครบทุกข้อหรือไม่
      const evaluatedItems = Object.keys(this.evaluationResults).length;
      if (evaluatedItems < this.evaluationItems.length) {
        alert('กรุณาประเมินให้ครบทุกหัวข้อ');
        return;
      }

      // ตรวจสอบว่าทุกหัวข้อมีการเลือกหรือไม่
      for (let item of this.evaluationItems) {
        if (!this.evaluationResults[item._id] || this.evaluationResults[item._id].length === 0) {
          alert('กรุณาประเมินให้ครบทุกหัวข้อ');
          return;
        }
      }

      try {
        // สร้างข้อมูลการประเมิน
        const evaluationData = {
          shopId: this.shop._id,
          items: this.evaluationItems.map(item => ({
            id: item._id,
            title: item.title,
            status: this.evaluationResults[item._id] && this.evaluationResults[item._id].length > 0 
              ? this.evaluationResults[item._id][0] : ''
          })),
          totalScore: this.totalScore,
          finalStatus: this.finalStatus,
          evaluatedAt: new Date()
        };
        
        console.log('Sending evaluation data:', evaluationData);

        // บันทึกการประเมิน
        const response = await axios.post('/api/evaluations', evaluationData);
        console.log('Evaluation saved:', response.data);

        // อัปเดตข้อมูลร้านค้า
        await axios.put(`/api/shops/${this.shop._id}`, {
          score: this.totalScore,
          evaluationStatus: this.finalStatus,
          evaluationCompleted: true,
          evaluationDate: new Date()
        });

        // แสดงผลคะแนนใน popup
        const resultMessage = `
          ผลการประเมินร้านค้า: ${this.shop.name}
          
          คะแนนรวม: ${this.totalScore}/100
          สถานะ: ${this.finalStatus}
          ข้อที่ไม่ผ่าน: ${this.failedItemsData.failedCount} ข้อ
          เดือน/ปี: ${this.evaluationControl?.month}/${this.evaluationControl?.year}
          
          บันทึกการประเมินเรียบร้อยแล้ว!
        `;
        
        alert(resultMessage);
        // ซ่อนฟอร์มการประเมินและแสดงข้อความว่าเสร็จแล้ว
        this.currentEvaluation = response.data;
        this.loadEvaluationHistory();
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

    toggleEditMode() {
      this.isEditing = true;
      this.loadHistoryForEdit(this.selectedHistory);
    },

    cancelEdit() {
      this.isEditing = false;
      this.selectedHistory = null;
      this.showHistoryDetails = false;
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

.save-evaluation-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(72, 187, 120, 0.4);
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

/* Tabs */
.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 30px;
  border-bottom: 2px solid #e2e8f0;
  background: #f7fafc;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.tab-btn {
  background: none;
  border: none;
  padding: 18px 30px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  color: #718096;
  border-bottom: 3px solid transparent;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  flex: 1;
  justify-content: center;
  min-width: 0;
}

.tab-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1;
}

.tab-btn:hover {
  color: #3498db;
  background: rgba(52, 152, 219, 0.05);
}

.tab-btn.active {
  color: #3498db;
  border-bottom-color: #3498db;
  background: white;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
}

.tab-btn.active::before {
  opacity: 0.05;
}

.tab-btn i {
  font-size: 18px;
  transition: transform 0.3s ease;
}

.tab-btn:hover i {
  transform: scale(1.1);
}

.tab-btn.active i {
  color: #3498db;
  transform: scale(1.1);
}

.modal-body {
  padding: 20px;
  flex-grow: 1;
  overflow-y: auto;
}

/* Score Summary */
.score-summary {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 25px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 25px;
  transition: all 0.3s ease;
}

.score-summary:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.score-summary-header {
  margin-bottom: 20px;
  text-align: center;
}

.score-summary-header h4 {
  margin: 0;
  color: #2d3748;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.score-summary-header h4 i {
  font-size: 24px;
  color: #3498db;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.score-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.score-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 15px;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.score-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
}

.score-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #3498db;
}

.score-label {
  font-size: 13px;
  color: #718096;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.score-label i {
  font-size: 16px;
  color: #3498db;
}

.score-value {
  font-size: 28px;
  font-weight: bold;
  color: #2d3748;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.score-value .score-number {
  font-size: 36px;
  font-weight: 900;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.score-value .score-max {
  font-size: 18px;
  color: #a0aec0;
  font-weight: 500;
}

.score-value .status-badge {
  padding: 8px 16px;
  border-radius: 25px;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.score-value .status-badge.passed {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.score-value .status-badge.failed {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
}

.score-value .status-badge i {
  font-size: 16px;
}

.score-value .failed-count {
  color: #e53e3e;
  font-size: 24px;
  font-weight: 900;
  text-shadow: 0 2px 4px rgba(229, 62, 62, 0.2);
}

/* Live Score Summary */
.live-score-summary {
  margin-top: 25px;
  border-top: 2px solid #e2e8f0;
  padding-top: 25px;
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.score-card {
  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.score-card:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  text-align: center;
}

.score-header h5 {
  margin: 0;
  color: #2d3748;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.score-header h5 i {
  font-size: 24px;
  color: #3498db;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.score-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.score-display {
  font-size: 52px;
  font-weight: 900;
  color: #2d3748;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}

.score-display .current-score {
  font-size: 64px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 8px rgba(52, 152, 219, 0.2);
}

.score-display .score-max {
  font-size: 28px;
  color: #a0aec0;
  font-weight: 600;
}

.score-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  font-size: 18px;
  font-weight: bold;
}

.score-status .status-badge {
  padding: 12px 24px;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.score-status .status-badge:hover {
  transform: scale(1.05);
}

.score-status .status-badge.passed {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.score-status .status-badge.failed {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  color: white;
}

.score-status .status-badge i {
  font-size: 20px;
}

.failed-items {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  color: #e53e3e;
  font-weight: 700;
  padding: 12px 20px;
  background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
  border-radius: 25px;
  border: 2px solid #feb2b2;
  box-shadow: 0 2px 10px rgba(229, 62, 62, 0.2);
  transition: all 0.3s ease;
}

.failed-items:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 15px rgba(229, 62, 62, 0.3);
}

.failed-items i {
  font-size: 18px;
  color: #e53e3e;
}

/* Evaluation History */
.evaluation-history {
  margin-top: 30px;
  border-top: 2px solid #e2e8f0;
  padding-top: 25px;
  animation: fadeInUp 0.6s ease-out;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding: 20px 25px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.history-header h4 {
  margin: 0;
  color: #2d3748;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

.history-header h4 i {
  font-size: 24px;
  color: #3498db;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.history-count {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
  padding: 8px 16px;
  border-radius: 25px;
  font-size: 13px;
  font-weight: 700;
  border: 2px solid #3498db;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
}

.history-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.history-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
  transition: width 0.3s ease;
}

.history-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
  border-color: #3498db;
}

.history-card:hover::before {
  width: 8px;
}

.history-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 10px 0;
}

.history-date-time {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 100px;
  flex-shrink: 0;
}

.history-month {
  font-size: 18px;
  font-weight: 900;
  color: #2d3748;
  text-align: left;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.history-date {
  font-size: 12px;
  color: #718096;
  text-align: left;
  font-weight: 500;
}

.history-score {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  min-width: 80px;
  flex: 1;
  justify-content: center;
}

.history-score .score-number {
  font-size: 24px;
  font-weight: 900;
  color: #3498db;
  text-align: center;
}

.history-score .score-max {
  font-size: 14px;
  color: #718096;
  font-weight: 600;
  text-align: center;
}

.history-actions {
  display: flex;
  gap: 10px;
  min-width: 160px;
  justify-content: flex-end;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-btn.detail-btn {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.action-btn.detail-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.action-btn.edit-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.action-btn.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
}

.action-btn i {
  font-size: 14px;
}

.action-btn span {
  font-size: 12px;
  font-weight: 600;
}

/* Form Styles */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #3498db;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
  position: relative;
  z-index: 10;
}

.cancel-btn, .save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-btn {
  background-color: #e0e0e0;
  color: #333;
}

.cancel-btn:hover {
  background-color: #d0d0d0;
}

.save-btn {
  background: #10b981;
  color: white;
}

.save-btn:hover {
  background: #059669;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Failed Items Section */
.failed-items-section {
  margin-top: 25px;
  padding-top: 25px;
  border-top: 2px solid #e2e8f0;
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.failed-items-header {
  margin-bottom: 20px;
  text-align: center;
}

.failed-items-header h5 {
  margin: 0;
  color: #2d3748;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.failed-items-header h5 i {
  font-size: 20px;
  color: #e53e3e;
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.failed-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.failed-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #fed7d7 0%, #feb2b2 100%);
  border-radius: 10px;
  border: 2px solid #feb2b2;
  color: #742a2a;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.failed-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #e53e3e 0%, #c53030 100%);
}

.failed-item:hover {
  transform: translateX(5px);
  box-shadow: 0 4px 15px rgba(229, 62, 62, 0.2);
  border-color: #e53e3e;
}

.failed-item-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.failed-item-number {
  font-size: 18px;
  font-weight: 900;
  color: #e53e3e;
  background: white;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(229, 62, 62, 0.2);
}

.failed-item-title {
  font-weight: 600;
  color: #742a2a;
  line-height: 1.4;
}

.failed-item-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.failed-item-status .status-indicator {
  padding: 8px 16px;
  border-radius: 25px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.failed-item-status .status-indicator.passed {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.failed-item-status .status-indicator.failed {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  color: white;
}

.failed-item-status .status-indicator i {
   font-size: 14px;
}

/* Responsive Design */
@media (max-width: 768px) {
.score-summary {
  padding: 20px;
  margin-bottom: 20px;
}

.score-summary-header h4 {
  font-size: 18px;
}

.score-summary-header h4 i {
  font-size: 20px;
}

.score-summary-grid {
    grid-template-columns: 1fr;
  gap: 15px;
}

.score-item {
    padding: 15px 12px;
}

.score-value .score-number {
    font-size: 28px;
}

.score-value .score-max {
  font-size: 16px;
  }
  
  .score-value .failed-count {
    font-size: 20px;
}

.score-value .status-badge {
  padding: 6px 12px;
    font-size: 11px;
}

.score-value .status-badge i {
  font-size: 14px;
}

  /* Failed Items Responsive */
  .failed-items-section {
    margin-top: 20px;
    padding-top: 20px;
  }
  
  .failed-items-header h5 {
    font-size: 16px;
  }
  
  .failed-items-header h5 i {
    font-size: 18px;
  }
  
  .failed-items-list {
    gap: 10px;
  }
  
  .failed-item {
    padding: 12px 15px;
    font-size: 13px;
  flex-direction: column;
  gap: 10px;
  text-align: center;
  }
  
  .failed-item-content {
  flex-direction: column;
    gap: 8px;
    text-align: center;
  }
  
  .failed-item-number {
    width: 25px;
    height: 25px;
  font-size: 14px;
}

  .failed-item-title {
    font-size: 13px;
    text-align: center;
  }
  
  .failed-item-status {
    justify-content: center;
  }
  
  .failed-item-status .status-indicator {
  padding: 6px 12px;
    font-size: 11px;
  }
  
  /* Live Score Summary Responsive */
  .live-score-summary {
    margin-top: 20px;
    padding-top: 20px;
  }
  
  .score-card {
  padding: 20px;
  }
  
  .score-header h5 {
  font-size: 18px;
}

  .score-header h5 i {
  font-size: 20px;
}

  .score-display {
    font-size: 40px;
  }
  
  .score-display .current-score {
    font-size: 48px;
  }
  
  .score-display .score-max {
    font-size: 24px;
  }
  
  .score-status {
    font-size: 16px;
    flex-direction: column;
    gap: 10px;
  }
  
  .score-status .status-badge {
    padding: 10px 20px;
    font-size: 14px;
  }
  
  .score-status .status-badge i {
  font-size: 18px;
}

  .failed-items {
  font-size: 14px;
    padding: 10px 15px;
    flex-direction: column;
  gap: 8px;
    text-align: center;
  }
  
  .failed-items i {
    font-size: 16px;
  }
  
  /* History Cards Responsive */
  .history-grid {
    grid-template-columns: 1fr;
  }
  
  .history-card {
    padding: 15px;
  }
  
  .history-card-content {
    flex-direction: column;
    align-items: flex-start;
  gap: 15px;
    text-align: center;
  }
  
  .history-date-time {
  align-items: center;
    text-align: center;
  }
  
  .history-score {
    align-self: center;
  }
  
  .history-actions {
    flex-direction: column;
    gap: 8px;
    min-width: auto;
    width: 100%;
  }
  
  .action-btn {
    padding: 12px 16px;
    width: 100%;
  justify-content: center;
}

  .action-btn span {
    font-size: 13px;
  }
  
  /* History Header Responsive */
  .history-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
  
  .history-header h4 {
  font-size: 18px;
}

  .history-header h4 i {
  font-size: 20px;
}

  .history-count {
    align-self: center;
  }
}

/* Tablet Responsive */
@media (min-width: 769px) and (max-width: 1024px) {
  .score-summary-grid {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 15px;
  }
  
  .score-item {
    padding: 18px 12px;
}

.score-value .score-number {
    font-size: 32px;
}

.score-value .score-max {
  font-size: 16px;
}

  .failed-items-list {
  gap: 10px;
}

  .failed-item {
    padding: 12px 18px;
}

.score-display {
  font-size: 48px;
}

.score-display .current-score {
    font-size: 56px;
}

.score-display .score-max {
    font-size: 26px;
  }
}

/* Animation for score items */
.score-item {
  animation: fadeInScale 0.5s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Hover effects for better interactivity */
.score-item:hover .score-value .score-number {
  transform: scale(1.1);
  transition: transform 0.3s ease;
}

.score-value .status-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
}

/* Loading animation */
.score-summary.loading {
  opacity: 0.7;
  pointer-events: none;
}

.score-summary.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  margin: -10px 0 0 -10px;
  border: 2px solid #3498db;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Section Header */
  .section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding: 20px 25px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-header h4 {
  margin: 0;
  color: #2d3748;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-header h4::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
  border-radius: 2px;
}

.add-item-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  position: relative;
  overflow: hidden;
}

.add-item-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.add-item-btn:hover::before {
  left: 100%;
}

.add-item-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.add-item-btn i {
  font-size: 16px;
}

/* Items List */
.items-list {
  margin-bottom: 25px;
}

.item-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 15px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.item-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
  transition: width 0.3s ease;
}

.item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #3498db;
}

.item-card:hover::before {
  width: 8px;
}

.item-content {
  flex: 1;
}

.item-title {
  font-weight: 700;
  color: #2d3748;
  font-size: 16px;
  margin-bottom: 6px;
  line-height: 1.4;
}

.item-order {
  color: #718096;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-order::before {
  content: '#';
  color: #3498db;
  font-weight: 700;
}

.item-actions {
  display: flex;
  gap: 10px;
  }

.edit-btn, .delete-btn {
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.edit-btn {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.edit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
}

.delete-btn {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  color: white;
}

.delete-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(229, 62, 62, 0.3);
}

.edit-btn i, .delete-btn i {
  font-size: 14px;
}

.no-items {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
  border: 2px dashed #cbd5e0;
  margin: 20px 0;
}

.no-items i {
  font-size: 3rem;
  margin-bottom: 15px;
  color: #a0aec0;
  display: block;
}

.no-items p {
    font-size: 16px;
  font-weight: 500;
  margin: 0;
  color: #718096;
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

.evaluation-items h4::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
  border-radius: 2px;
  }

  .evaluation-table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 25px;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }

  .table-header {
  background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%);
  border-bottom: 2px solid #e2e8f0;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1px;
}

.header-cell {
  padding: 20px 25px;
  text-align: center;
  font-weight: 700;
  color: #2d3748;
  font-size: 15px;
  background: linear-gradient(135deg, #f7fafc 0%, #e2e8f0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
    gap: 10px;
  position: relative;
}

.header-cell::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3498db 0%, #2980b9 100%);
}

.factor-header {
    grid-column: 1;
  text-align: left;
    justify-content: flex-start;
}

.pass-header, .fail-header {
  text-align: center;
}

.pass-header i {
  color: #48bb78;
}

.fail-header i {
  color: #e53e3e;
}

.table-body {
  display: flex;
    flex-direction: column;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  position: relative;
}

.table-row:hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:nth-child(even) {
  background: #fafbfc;
}

.table-row:nth-child(even):hover {
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
}

.cell {
  padding: 20px 25px;
  border-right: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.cell:last-child {
  border-right: none;
}

.factor-cell {
  grid-column: 1;
    text-align: left;
  font-weight: 600;
  color: #2d3748;
  font-size: 15px;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 100%;
}

.item-number {
  font-weight: 900;
  color: #3498db;
  font-size: 18px;
  min-width: 35px;
  text-align: center;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
  border: 2px solid #3498db;
}

.checkbox-cell {
  grid-column: auto;
  justify-content: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 15px 20px;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background: #f8f9fa;
  min-width: 140px;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.checkbox-label::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.checkbox-label:hover::before {
  left: 100%;
}

.checkbox-label:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
  width: 22px;
  height: 22px;
  accent-color: #3498db;
}

.checkbox-custom {
  font-size: 18px;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.checkbox-label input[type="checkbox"]:checked + .checkbox-custom {
  background: #3498db;
  border-color: #3498db;
  color: white;
  transform: scale(1.1);
}

.checkbox-text {
  font-size: 15px;
  color: #2d3748;
  font-weight: 600;
}

.pass-label {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-color: #0ea5e9;
}

.pass-label:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-color: #0284c7;
}

.pass-label input[type="checkbox"]:checked + .checkbox-custom {
  background: #0ea5e9;
  border-color: #0ea5e9;
}

.pass-label input[type="checkbox"]:checked ~ .checkbox-text {
  color: #0ea5e9;
  font-weight: 700;
}

.fail-label {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #ef4444;
}

.fail-label:hover {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-color: #dc2626;
}

.fail-label input[type="checkbox"]:checked + .checkbox-custom {
  background: #ef4444;
  border-color: #ef4444;
}

.fail-label input[type="checkbox"]:checked ~ .checkbox-text {
  color: #ef4444;
  font-weight: 700;
}

/* No History Message */
.no-history-message {
  text-align: center;
  padding: 60px 20px;
  color: #718096;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 16px;
  border: 2px dashed #cbd5e0;
  margin: 20px 0;
}

.no-history-content {
  display: flex;
    flex-direction: column;
  align-items: center;
  gap: 15px;
}

.no-history-content i {
  font-size: 3rem;
  color: #a0aec0;
}

.no-history-content h5 {
  margin: 0;
  color: #2d3748;
  font-size: 18px;
  font-weight: 700;
}

.no-history-content p {
  margin: 0;
  color: #718096;
  font-size: 16px;
  font-weight: 500;
}

/* Evaluation Items Grid */
.evaluation-items-grid {
  display: flex;
    flex-direction: column;
  gap: 15px;
}

.evaluation-item-card {
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.evaluation-item-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #3498db 0%, #2980b9 100%);
  transition: width 0.3s ease;
}

.evaluation-item-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #3498db;
}

.evaluation-item-card:hover::before {
  width: 8px;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.item-info {
  display: flex;
  align-items: center;
    gap: 15px;
  flex: 1;
}

.item-number {
  font-weight: 900;
  color: #3498db;
  font-size: 18px;
  min-width: 35px;
  text-align: center;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-radius: 50%;
  width: 35px;
  height: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.2);
  border: 2px solid #3498db;
  flex-shrink: 0;
}

.item-title {
  font-weight: 600;
  color: #2d3748;
    font-size: 16px;
  line-height: 1.4;
}

.evaluation-options {
  display: flex;
  gap: 15px;
  flex-shrink: 0;
}

.option-label {
  display: flex;
  align-items: center;
    gap: 10px;
  cursor: pointer;
  padding: 12px 18px;
  border-radius: 10px;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  background: #f8f9fa;
  min-width: 120px;
  justify-content: center;
  position: relative;
  overflow: hidden;
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
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.option-label input[type="checkbox"] {
  margin: 0;
  width: 20px;
  height: 20px;
  accent-color: #3498db;
}

.checkbox-custom {
  font-size: 16px;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 2px solid #dee2e6;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.option-label input[type="checkbox"]:checked + .checkbox-custom {
  background: #3498db;
  border-color: #3498db;
  color: white;
  transform: scale(1.1);
}

.option-text {
    font-size: 14px;
  color: #2d3748;
  font-weight: 600;
}

.pass-option {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-color: #0ea5e9;
}

.pass-option:hover {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border-color: #0284c7;
}

.pass-option input[type="checkbox"]:checked + .checkbox-custom {
  background: #0ea5e9;
  border-color: #0ea5e9;
}

.pass-option input[type="checkbox"]:checked ~ .option-text {
  color: #0ea5e9;
  font-weight: 700;
}

.fail-option {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  border-color: #ef4444;
}

.fail-option:hover {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-color: #dc2626;
}

.fail-option input[type="checkbox"]:checked + .checkbox-custom {
  background: #ef4444;
  border-color: #ef4444;
}

.fail-option input[type="checkbox"]:checked ~ .option-text {
  color: #ef4444;
  font-weight: 700;
}

.item-status {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.item-status .status-indicator {
  padding: 10px 20px;
  border-radius: 25px;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
    gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.item-status .status-indicator:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.item-status .status-indicator.passed {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.item-status .status-indicator.failed {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
  color: white;
}

.item-status .status-indicator i {
  font-size: 16px;
}

/* Evaluation Items Responsive */
.evaluation-item-card {
  padding: 15px;
}

.item-row {
  flex-direction: column;
  gap: 15px;
  text-align: center;
}

.item-info {
  flex-direction: column;
  gap: 10px;
  text-align: center;
}

.item-number {
  width: 30px;
  height: 30px;
  font-size: 16px;
}

.item-title {
  font-size: 15px;
  text-align: center;
}

.evaluation-options {
    flex-direction: column;
    gap: 10px;
  width: 100%;
}

.option-label {
  width: 100%;
  justify-content: center;
  padding: 15px 20px;
}

.item-status {
    justify-content: center;
  }

.item-status .status-indicator {
  padding: 12px 24px;
  font-size: 13px;
}
</style> 