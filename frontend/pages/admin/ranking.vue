<template>
  <layout-admin>
    <div class="container">
      <div class="header">
        <h1>รายชื่อร้านค้า</h1>
      </div>

      <!-- Enhanced Filters Section -->
      <div class="filters-container">
        <div class="filters-header">
          <h3>เลือกโรงอาหาร</h3>
        </div>
        
        <div class="filters-content">
          <!-- Canteen Selection -->
          <div class="filter-group">
            <label class="filter-label">
              <i class="fas fa-building"></i>
              เลือกโรงอาหาร
            </label>
            <div class="select-wrapper">
              <select 
                v-model="selectedCanteenId"
                @change="onCanteenChange"
                class="custom-select"
              >
                <option value="">ทั้งหมด</option>
                <option 
                  v-for="(canteenName, canteenId) in canteenMapping" 
                  :key="canteenId" 
                  :value="canteenId"
                >
                  {{ canteenName }}
                </option>
              </select>
              <i class="fas fa-chevron-down select-arrow"></i>
            </div>
          </div>

          <!-- Search Box -->
          <div class="filter-group">
            <label class="filter-label">
              <i class="fas fa-search"></i>
              ค้นหาร้านค้า
            </label>
            <div class="search-wrapper">
              <input 
                type="text" 
                v-model="searchQuery" 
                @input="filterShops"
                placeholder="พิมพ์ชื่อร้านค้า..."
                class="search-input"
              />
              <i class="fas fa-search search-icon"></i>
            </div>
          </div>

          <!-- Upload Excel Button -->
          <div class="filter-group">
            <label class="filter-label">
              <i class="fas fa-file-excel"></i>
              อัปโหลดรายได้
            </label>
            <button @click="showUploadModal = true" class="upload-excel-btn">
              <i class="fas fa-upload"></i>
              อัปโหลด Excel
            </button>
          </div>

          <!-- Reset Scores Button -->
          <div class="filter-group">
            <label class="filter-label">
              <i class="fas fa-redo"></i>
              รีเซ็ตคะแนน
            </label>
            <button @click="showResetModal = true" class="reset-scores-btn">
              <i class="fas fa-redo"></i>
              รีเซ็ตคะแนนทั้งหมด
            </button>
          </div>

          <!-- Month Control Section -->
          <div class="filter-group month-control-group">
            <label class="filter-label">
              <i class="fas fa-calendar-alt"></i>
              ควบคุมระบบประเมิน
            </label>
            <div class="month-control-container">
              <div class="current-month-display">
                <span class="month-label">เดือนปัจจุบัน:</span>
                <span class="month-value">{{ getCurrentMonthName() }}</span>
              </div>
              <div class="system-status">
                <span class="status-label">สถานะระบบ:</span>
                <span :class="['status-indicator', evaluationSystemEnabled ? 'enabled' : 'disabled']">
                  {{ evaluationSystemEnabled ? 'เปิดใช้งาน' : 'ปิดใช้งาน' }}
                </span>
              </div>
              <div class="switch-container">
                <label class="switch">
                  <input 
                    type="checkbox" 
                    v-model="evaluationSystemEnabled"
                    @change="toggleEvaluationSystem"
                  >
                  <span class="slider round"></span>
                </label>
                <span class="switch-label">
                  {{ evaluationSystemEnabled ? 'เปิดระบบประเมิน' : 'ปิดระบบประเมิน' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Month Settings Button -->
          <div class="filter-group">
            <label class="filter-label">
              <i class="fas fa-cog"></i>
              ตั้งค่าเดือน
            </label>
            <button @click="showMonthSettingsModal = true" class="month-settings-btn">
              <i class="fas fa-calendar-check"></i>
              กำหนดเดือนเปิด/ปิด
            </button>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalShops }}</div>
            <div class="stat-label">ร้านค้าทั้งหมด</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(stats.totalRevenue) }}</div>
            <div class="stat-label">รายได้รวม</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-content">
            <div class="stat-value">{{ formatCurrency(stats.averageRevenue) }}</div>
            <div class="stat-label">รายได้เฉลี่ย</div>
          </div>
        </div>
        
        <div class="stat-card passed">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.passedEvaluation || 0 }}</div>
            <div class="stat-label">ผ่านการประเมิน</div>
          </div>
        </div>
        
        <div class="stat-card failed">
          <div class="stat-icon">❌</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.failedEvaluation || 0 }}</div>
            <div class="stat-label">ไม่ผ่านการประเมิน</div>
          </div>
        </div>
      </div>

      <!-- Shops Table -->
      <div class="shops-table">
        <div class="table-header">
          <div class="header-cell">ลำดับ</div>
          <div class="header-cell">ชื่อร้านค้า</div>
          <div class="header-cell">โรงอาหาร</div>
          <div class="header-cell">รายได้</div>
          <div class="header-cell">คะแนน</div>
          <div class="header-cell">สถานะประเมิน</div>
          <div class="header-cell">ผลการประเมิน</div>
          <div class="header-cell">ประเมิน</div>
        </div>
        
        <div v-for="(shop, index) in filteredShops" :key="shop._id" class="table-row">
          <div class="cell">{{ index + 1 }}</div>
          <div class="cell">{{ shop.name }}</div>
          <div class="cell">{{ getCanteenName(shop.canteenId) }}</div>
          <div class="cell revenue-cell">{{ formatCurrency(shop.revenue || 0) }}</div>
          <div class="cell score-cell">{{ shop.score || 100 }}/100</div>
          <div class="cell status-cell">
            <span :class="['status-badge', getEvaluationStatusClass(shop)]">
              {{ getEvaluationStatusText(shop) }}
            </span>
          </div>
          <div class="cell result-cell">
            <span :class="['result-badge', getEvaluationResultClass(shop)]">
              {{ getEvaluationResultText(shop) }}
            </span>
          </div>
          <div class="cell evaluation-cell">
            <button 
              @click="openEvaluationModal(shop)" 
              :disabled="!evaluationSystemEnabled"
              class="evaluate-btn"
            >
              <i class="fas fa-clipboard-check"></i>
              ประเมิน
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click="showUploadModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>อัปโหลดข้อมูลรายได้จากไฟล์ Excel</h3>
          <div class="modal-actions">
            <button @click="addNewTopic" class="add-topic-btn">
              <i class="fas fa-plus"></i>
              เพิ่มหัวข้อ
            </button>
            <button @click="showUploadModal = false" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="modal-body">
          <div class="upload-area">
            <input 
              type="file" 
              ref="fileInput"
              @change="handleFileUpload"
              accept=".xlsx,.xls"
              class="file-input"
            />
            <div class="upload-placeholder">
              <i class="fas fa-file-excel"></i>
              <p>คลิกเพื่อเลือกไฟล์ Excel ที่มีข้อมูลรายได้ หรือลากไฟล์มาวางที่นี่</p>
              <p class="file-info">รองรับไฟล์ .xlsx และ .xls ขนาดไม่เกิน 5MB</p>
            </div>
          </div>
          
          <div v-if="uploadProgress" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
            </div>
            <p>กำลังอัปโหลด... {{ uploadProgress }}%</p>
          </div>
          
          <div v-if="uploadResult" class="upload-result">
            <h4>ผลการอัปโหลด:</h4>
            <p>✅ ประมวลผล: {{ uploadResult.totalProcessed }} รายการ</p>
            <p>✅ สำเร็จ: {{ uploadResult.successCount }} รายการ</p>
            <p v-if="uploadResult.errorCount > 0" class="error">
              ❌ ผิดพลาด: {{ uploadResult.errorCount }} รายการ
            </p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showUploadModal = false" class="cancel-btn">ยกเลิก</button>
          <button @click="uploadFile" :disabled="!selectedFile" class="upload-btn">
            อัปโหลด
          </button>
        </div>
      </div>
    </div>

    <!-- Add Canteen Modal -->
    <div v-if="showAddCanteenModal" class="modal-overlay" @click="showAddCanteenModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>สร้างโรงอาหารใหม่</h3>
          <div class="modal-actions">
            <button @click="addNewTopic" class="add-topic-btn">
              <i class="fas fa-plus"></i>
              เพิ่มหัวข้อ
            </button>
            <button @click="showAddCanteenModal = false" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>ชื่อโรงอาหาร:</label>
            <input 
              v-model="newCanteenName" 
              type="text" 
              class="form-input"
              placeholder="พิมพ์ชื่อโรงอาหาร..."
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAddCanteenModal = false" class="cancel-btn">ยกเลิก</button>
          <button @click="createNewCanteen" class="save-btn">สร้าง</button>
        </div>
      </div>
    </div>

    <!-- Evaluation Modal -->
    <ClientOnly>
      <EvaluationModal 
        :key="`evaluation-modal-${selectedShop?._id || 'no-shop'}`"
        :show="showEvaluationModal"
        :shop="selectedShop"
        @close="closeEvaluationModal"
        @evaluation-saved="onEvaluationSaved"
      />
      <template #fallback>
        <div></div>
      </template>
    </ClientOnly>

    <!-- Reset Scores Modal -->
    <div v-if="showResetModal" class="modal-overlay" @click="showResetModal = false">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>รีเซ็ตคะแนนทั้งหมด</h3>
          <button @click="showResetModal = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="warning-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h4>คำเตือน!</h4>
            <p>การรีเซ็ตคะแนนจะ:</p>
            <ul>
              <li>ตั้งค่าคะแนนของร้านค้าทั้งหมดให้เป็น 100</li>
              <li>ลบประวัติการประเมินเก่าทั้งหมด</li>
              <li>ไม่สามารถกู้คืนข้อมูลได้</li>
            </ul>
            <p><strong>คุณแน่ใจหรือไม่ที่จะดำเนินการต่อ?</strong></p>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showResetModal = false" class="cancel-btn">ยกเลิก</button>
          <button @click="resetAllScores" class="reset-btn">
            <i class="fas fa-redo"></i>
            รีเซ็ตคะแนนทั้งหมด
          </button>
        </div>
      </div>
    </div>

    <!-- Month Settings Modal -->
    <div v-if="showMonthSettingsModal" class="month-settings-modal-overlay" @click="closeMonthSettingsModal">
      <div class="month-settings-modal" @click.stop>
        <div class="month-settings-modal-header">
          <h3>ตั้งค่าระบบประเมินตามเดือน</h3>
          <button @click="closeMonthSettingsModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="month-settings-modal-body">
          <div class="month-settings-info">
            <p><strong>คำแนะนำ:</strong> เลือกเดือนที่ต้องการเปิดหรือปิดระบบประเมิน</p>
            <p>• <span class="enabled-text">เปิด</span> = ระบบประเมินทำงานปกติ</p>
            <p>• <span class="disabled-text">ปิด</span> = ระบบประเมินไม่ทำงาน (ปุ่มประเมินจะเปลี่ยนเป็นสีเทา)</p>
          </div>
          
          <div class="month-settings-list">
            <div 
              v-for="month in 12" 
              :key="month"
              :class="['month-setting-item', { active: getMonthSetting(month)?.enabled }]"
            >
              <div class="month-name">{{ getMonthName(month) }}</div>
              <div class="switch-container">
                <label class="switch">
                  <input 
                    type="checkbox" 
                    :checked="getMonthSetting(month)?.enabled || false"
                    @change="toggleMonthSetting(month)"
                  >
                  <span class="slider round"></span>
                </label>
                <span class="switch-label">
                  {{ getMonthSetting(month)?.enabled ? 'เปิด' : 'ปิด' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="month-settings-modal-footer">
          <button @click="closeMonthSettingsModal" class="cancel-btn">ยกเลิก</button>
          <button @click="saveMonthSettings" class="save-btn">
            <i class="fas fa-save"></i>
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  </layout-admin>
</template>

<script>
import LayoutAdmin from '../../components/LayoutAdmin.vue'
import axios from 'axios'
import EvaluationModal from '../../components/EvaluationModal.vue' // Added import for EvaluationModal

export default {
  components: { LayoutAdmin, EvaluationModal }, // Added EvaluationModal to components
  data() {
    return {
      shops: [],
      selectedCanteenId: '',
      searchQuery: '',
      stats: {
        totalShops: 0,
        totalRevenue: 0,
        averageRevenue: 0,
        passedEvaluation: 0,
        failedEvaluation: 0
      },
      showUploadModal: false,
      selectedFile: null,
      uploadProgress: 0,
      uploadResult: null,
      showEvaluationModal: false,
      selectedShop: null,
      showAddCanteenModal: false,
      showResetModal: false,
      newCanteenForm: {
        name: '',
        canteenId: '',
        path: ''
      },
      unknownCanteenIds: new Set(), // เก็บ canteenId ที่ไม่รู้จัก
      newCanteenName: '', // Added for new canteen modal
      filteredShops: [], // Added for filtered shops
      // Mapping table สำหรับ canteenId กับชื่อโรงอาหาร
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
      },
      evaluationSystemEnabled: true, // สถานะของระบบประเมิน (เปิด/ปิด)
      showMonthSettingsModal: false, // สถานะของ modal ตั้งค่าเดือน
      currentMonth: new Date().getMonth() + 1, // เดือนปัจจุบัน (1-12)
      monthSettings: [], // ข้อมูลการตั้งค่าเดือนทั้งหมด
      loadingMonthSettings: true, // สถานะการโหลดข้อมูลการตั้งค่าเดือน
    }
  },
  async mounted() {
    console.log('Ranking page mounted');
    await this.loadCanteens()
    await this.loadShops() // โหลดร้านค้าทั้งหมด
    await this.loadStats()
    this.filteredShops = this.shops // Initialize filteredShops
    await this.loadMonthSettings() // โหลดข้อมูลการตั้งค่าเดือนทั้งหมด
    await this.checkCurrentMonthStatus() // ตรวจสอบสถานะเดือนปัจจุบัน
    console.log('Ranking page initialization complete');
  },
  methods: {
    async loadCanteens() {
      try {
        const response = await axios.get('/api/canteens')
        this.canteens = response.data.data || response.data
      } catch (error) {
        console.error('Error loading canteens:', error)
      }
    },
    
    async loadShops(canteenId = null) {
      try {
        const params = {}
        if (canteenId) {
          params.canteenId = canteenId
        }
        
        console.log('🔄 Loading shops from database...');
        const response = await axios.get('/api/shops', { params })
        this.shops = response.data.data || response.data
        console.log('✅ Shops loaded from database:', this.shops.length, 'shops');
        
        // ดึงข้อมูลการประเมินจาก evaluations collection เพื่อรวมกับข้อมูลร้านค้า
        console.log('🔄 Loading evaluation data to merge with shops...');
        const evaluationResponse = await axios.get('/api/evaluations');
        const evaluations = evaluationResponse.data.data || evaluationResponse.data;
        console.log('✅ Evaluations loaded:', evaluations.length, 'evaluations');
        
        // รวมข้อมูล shops กับ evaluations
        this.shops.forEach(shop => {
          // หาการประเมินล่าสุดของร้านค้านี้
          const shopEvaluation = evaluations.find(evaluation => evaluation.shopId === shop._id);
          if (shopEvaluation) {
            console.log(`📊 Found evaluation for shop ${shop.name}:`, {
              totalScore: shopEvaluation.totalScore,
              finalStatus: shopEvaluation.finalStatus,
              evaluatedAt: shopEvaluation.evaluatedAt
            });
            
            // อัปเดตข้อมูลร้านค้าด้วยข้อมูลการประเมิน
            shop.score = shopEvaluation.totalScore;
            shop.evaluationStatus = shopEvaluation.finalStatus;
            shop.evaluationCompleted = true;
            shop.evaluationDate = shopEvaluation.evaluatedAt;
          } else {
            console.log(`❌ No evaluation found for shop ${shop.name} - using default values`);
            // ใช้ค่า default จาก shops collection ถ้าไม่มีข้อมูลการประเมิน
            shop.score = shop.score || 100;
            shop.evaluationCompleted = shop.evaluationCompleted || false;
            shop.evaluationStatus = shop.evaluationStatus || 'ยังไม่ประเมิน';
          }
        });
        
        // แสดงข้อมูลแต่ละร้านค้าที่ดึงมาจาก database
        this.shops.forEach((shop, index) => {
          console.log(`🏪 Shop ${index + 1}: ${shop.name}`);
          console.log('   📊 Final merged data:');
          console.log('     - name:', shop.name);
          console.log('     - canteenId:', shop.canteenId);
          console.log('     - revenue:', shop.revenue);
          console.log('     - score:', shop.score);
          console.log('     - evaluationCompleted:', shop.evaluationCompleted);
          console.log('     - evaluationStatus:', shop.evaluationStatus);
          console.log('     - evaluationDate:', shop.evaluationDate);
          console.log('   ---');
        });
        
        // รีเซ็ต unknownCanteenIds เมื่อโหลดข้อมูลใหม่
        this.unknownCanteenIds.clear()
      } catch (error) {
        console.error('❌ Error loading shops:', error)
      }
    },
    
    async loadStats() {
      try {
        // กรองร้านค้าที่ยังไม่หมดสัญญา
        const currentDate = new Date();
        const activeShops = this.shops.filter(shop => {
          if (!shop.contractEndDate) return true;
          const endDate = new Date(shop.contractEndDate);
          return endDate >= currentDate;
        });
        
        // คำนวณ stats จากร้านค้าที่ยังไม่หมดสัญญา
        const totalRevenue = activeShops.reduce((sum, shop) => sum + (shop.revenue || 0), 0);
        const averageRevenue = activeShops.length > 0 ? totalRevenue / activeShops.length : 0;
        const passedEvaluation = activeShops.filter(shop => shop.evaluationStatus === 'ผ่าน').length;
        const failedEvaluation = activeShops.filter(shop => shop.evaluationStatus === 'ไม่ผ่าน').length;
        
        this.stats = {
          totalShops: activeShops.length,
          totalRevenue: totalRevenue,
          averageRevenue: averageRevenue,
          passedEvaluation: passedEvaluation,
          failedEvaluation: failedEvaluation
        }
      } catch (error) {
        console.error('Error loading stats:', error)
      }
    },
    
    formatCurrency(amount) {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
      }).format(amount)
    },
    
    formatDate(dateString) {
      if (!dateString) return 'วันที่ไม่ระบุ';
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', { 
        year: 'numeric',
        month: 'numeric', 
        day: 'numeric'
      });
    },

    getSelectedCanteenName() {
      if (!this.selectedCanteenId) return 'โรงอาหารทั้งหมด';
      
      // ใช้ mapping table ก่อน
      if (this.canteenMapping[this.selectedCanteenId]) {
        return this.canteenMapping[this.selectedCanteenId];
      }
      
      // ถ้าไม่มีใน mapping table ลองหาใน canteens array
      const selectedCanteen = this.canteens.find(c => c._id === this.selectedCanteenId);
      return selectedCanteen ? selectedCanteen.name : 'โรงอาหารไม่ระบุ';
    },

    getCanteenName(canteenId) {
      if (!canteenId) return 'ไม่ระบุโรงอาหาร';
      
      // ใช้ mapping table ก่อน
      if (this.canteenMapping[canteenId]) {
        return this.canteenMapping[canteenId];
      }
      
      // ถ้าไม่มีใน mapping table ลองหาใน canteens array
      let canteen = this.canteens.find(c => c._id === canteenId);
      
      // ถ้าไม่เจอ ลองหาโดยแปลง canteenId เป็น string และเปรียบเทียบ
      if (!canteen) {
        canteen = this.canteens.find(c => String(c._id) === String(canteenId));
      }
      
      return canteen ? canteen.name : `โรงอาหาร ${canteenId}`;
    },

    // ฟังก์ชันสำหรับสถานะประเมิน
    getEvaluationStatusText(shop) {
      // ใช้ข้อมูลที่รวมจาก shops + evaluations แล้ว
      if (shop.evaluationCompleted === true) {
        return 'ประเมินเสร็จสิ้น';
      }
      return 'ยังไม่ประเมิน';
    },

    getEvaluationStatusClass(shop) {
      // ใช้ข้อมูลที่รวมจาก shops + evaluations แล้ว
      if (shop.evaluationCompleted === true) {
        return 'completed';
      }
      return 'not-evaluated';
    },

    // ฟังก์ชันสำหรับผลการประเมิน
    getEvaluationResultText(shop) {
      // ใช้ข้อมูลที่รวมจาก shops + evaluations แล้ว
      return shop.evaluationStatus || 'ยังไม่ประเมิน';
    },

    getEvaluationResultClass(shop) {
      // ใช้ข้อมูลที่รวมจาก shops + evaluations แล้ว
      const status = shop.evaluationStatus;
      if (status === 'ผ่าน') {
        return 'passed';
      } else if (status === 'ไม่ผ่าน') {
        return 'failed';
      }
      return 'not-evaluated';
    },
    
    openEvaluationModal(shop) {
      // เปิด modal สำหรับประเมินร้านค้า
      this.selectedShop = shop;
      this.showEvaluationModal = true;
    },

    async onCanteenChange() {
      if (this.selectedCanteenId) {
        await this.loadShops(this.selectedCanteenId)
      } else {
        await this.loadShops() // โหลดร้านค้าทั้งหมด
      }
      await this.loadStats()
      this.filteredShops = this.shops // Update filteredShops after canteen change
    },

    filterShops() {
      // กรองร้านค้าตามคำค้นหา
      if (!this.searchQuery.trim()) {
        // ถ้าไม่มีคำค้นหา ให้โหลดร้านค้าทั้งหมด
        this.filteredShops = this.shops;
        return;
      }
      
      // กรองตามชื่อร้านค้า, รหัสร้านค้า, ประเภท
      const searchTerm = this.searchQuery.toLowerCase();
      this.filteredShops = this.shops.filter(shop => 
        shop.name.toLowerCase().includes(searchTerm) ||
        (shop.customId && shop.customId.toLowerCase().includes(searchTerm)) ||
        (shop.type && shop.type.toLowerCase().includes(searchTerm))
      );
    },

    handleFileUpload(event) {
      this.selectedFile = event.target.files[0];
      if (this.selectedFile) {
        // this.uploadPlaceholder.style.display = 'none'; // This line is removed as per the new_code
        this.uploadProgress = 0;
        this.uploadResult = null;
      }
    },

    async uploadFile() {
      if (!this.selectedFile) {
        alert('กรุณาเลือกไฟล์ Excel ที่ต้องการอัปโหลด');
        return;
      }

      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('canteenId', this.selectedCanteenId || ''); // ส่ง ID ของโรงอาหารที่เลือก

      try {
        this.uploadProgress = 0;
        this.uploadResult = null;
        const response = await axios.post('/api/money-history/upload-revenue', formData, {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            this.uploadProgress = percentCompleted;
          }
        });
        this.uploadResult = response.data;
        this.showUploadModal = false;
        this.selectedFile = null;
        alert('อัปโหลดข้อมูลรายได้เรียบร้อยแล้ว!');
        this.$nextTick(() => {
          this.loadShops(this.selectedCanteenId); // อัพเดทรายชื่อร้านค้าใหม่
          this.loadStats(); // อัพเดทสถิติใหม่
          this.filteredShops = this.shops; // Update filteredShops after upload
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        this.uploadResult = {
          totalProcessed: 0,
          successCount: 0,
          errorCount: 0,
          errors: []
        };
        if (error.response) {
          alert(`อัปโหลดไฟล์ Excel ล้มเหลว: ${error.response.data.message || error.response.statusText}`);
        } else {
          alert('อัปโหลดไฟล์ Excel ล้มเหลว: ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
        }
      }
    },

    // ฟังก์ชันสำหรับสร้างโรงอาหารใหม่
    openAddCanteenModal(canteenId = null) {
      this.showAddCanteenModal = true;
      if (canteenId) {
        this.newCanteenName = `โรงอาหารใหม่ (ID: ${canteenId})`;
      } else {
        this.newCanteenName = '';
      }
    },

    async createNewCanteen() {
      try {
        // สร้างโรงอาหารใหม่
        const response = await axios.post('/api/canteens', {
          name: this.newCanteenName,
          type: 'canteen',
          path: `/admin/canteen/new-${Date.now()}`,
          image: '/images/default-canteen.png'
        });

        const newCanteen = response.data;
        
        // เพิ่มเข้า mapping table
        this.canteenMapping[newCanteen._id] = this.newCanteenName;
        
        // ปิด modal
        this.showAddCanteenModal = false;
        this.newCanteenName = '';
        
        alert('สร้างโรงอาหารใหม่เรียบร้อยแล้ว!');
        
        // รีโหลดข้อมูล
        await this.loadShops();
        await this.loadStats();
      } catch (error) {
        console.error('Error creating new canteen:', error);
        alert('เกิดข้อผิดพลาดในการสร้างโรงอาหารใหม่');
      }
    },

    // ฟังก์ชันสำหรับแสดงรายการ canteenId ที่ไม่รู้จัก
    getUnknownCanteenIdsList() {
      return Array.from(this.unknownCanteenIds).join(', ');
    },

    closeEvaluationModal() {
      this.showEvaluationModal = false;
      this.selectedShop = null;
    },

    async onEvaluationSaved() {
      console.log('Evaluation saved, reloading shop data...');
      // โหลดข้อมูลร้านค้าใหม่เพื่อให้ได้คะแนนที่อัพเดทแล้ว
      await this.loadShops(this.selectedCanteenId);
      await this.loadStats();
      this.filteredShops = this.shops; // Update filteredShops after evaluation is saved
      console.log('Shop data reloaded:', this.shops);
      
      // ตรวจสอบข้อมูลการประเมินจาก database
      await this.checkEvaluationData();
      
      // ตรวจสอบสถานะการประเมินของร้านค้าที่เพิ่งประเมิน
      if (this.selectedShop) {
        const updatedShop = this.shops.find(shop => shop._id === this.selectedShop._id);
        if (updatedShop) {
          console.log('Updated shop evaluation status:', {
            name: updatedShop.name,
            evaluationCompleted: updatedShop.evaluationCompleted,
            evaluationDate: updatedShop.evaluationDate,
            score: updatedShop.score,
            evaluationStatus: updatedShop.evaluationStatus
          });
          
          // ตรวจสอบเงื่อนไขการแสดงผล
          const statusText = this.getEvaluationStatusText(updatedShop);
          const statusClass = this.getEvaluationStatusClass(updatedShop);
          console.log('Evaluation status result:', { statusText, statusClass });
        }
      }
    },

    async checkEvaluationData() {
      try {
        console.log('=== Checking Evaluation Data from Database ===');
        const response = await axios.get('/api/shops/debug/evaluation-data');
        console.log('Database evaluation data:', response.data);
        
        // ตรวจสอบข้อมูลร้านค้าที่เพิ่งประเมิน
        const currentShop = this.selectedShop;
        if (currentShop) {
          const dbShop = response.data.data.find(shop => shop._id === currentShop._id);
          if (dbShop) {
            console.log('Current shop evaluation data from DB:', {
              name: dbShop.name,
              evaluationCompleted: dbShop.evaluationCompleted,
              evaluationDate: dbShop.evaluationDate,
              score: dbShop.score,
              evaluationStatus: dbShop.evaluationStatus
            });
            
            // เปรียบเทียบข้อมูลจาก API กับข้อมูลใน frontend
            const frontendShop = this.shops.find(shop => shop._id === currentShop._id);
            if (frontendShop) {
              console.log('Frontend vs Database comparison:', {
                frontend: {
                  evaluationCompleted: frontendShop.evaluationCompleted,
                  evaluationDate: frontendShop.evaluationDate,
                  score: frontendShop.score,
                  evaluationStatus: frontendShop.evaluationStatus
                },
                database: {
                  evaluationCompleted: dbShop.evaluationCompleted,
                  evaluationDate: dbShop.evaluationDate,
                  score: dbShop.score,
                  evaluationStatus: dbShop.evaluationStatus
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Error checking evaluation data:', error);
      }
    },

    addNewTopic() {
      // ฟังก์ชันสำหรับเพิ่มหัวข้อใหม่
      console.log('เพิ่มหัวข้อใหม่');
      // เพิ่มโค้ดสำหรับเพิ่มหัวข้อตามที่ต้องการ
    },

    async resetAllScores() {
      if (confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตคะแนนทั้งหมด? การดำเนินการนี้ไม่สามารถยกเลิกได้!')) {
        try {
          await axios.post('/api/shops/reset-all-scores');
          alert('รีเซ็ตคะแนนทั้งหมดเรียบร้อยแล้ว!');
          this.loadStats();
          this.filteredShops = this.shops; // Update filteredShops after reset
        } catch (error) {
          console.error('Error resetting scores:', error);
          alert('เกิดข้อผิดพลาดในการรีเซ็ตคะแนนทั้งหมด');
        }
      }
    },

    // ฟังก์ชันสำหรับควบคุมระบบประเมิน
    async toggleEvaluationSystem() {
      console.log('🔄 Toggling evaluation system...', {
        currentMonth: this.currentMonth,
        currentStatus: this.evaluationSystemEnabled,
        monthSettings: this.monthSettings
      });

      const monthSetting = this.monthSettings.find(
        (setting) => setting.month === this.currentMonth
      );

      console.log('📅 Found month setting:', monthSetting);

      if (monthSetting && monthSetting._id) {
        // ถ้ามีการตั้งค่าแล้วและมี _id ให้สลับสถานะ
        monthSetting.enabled = !monthSetting.enabled;
        console.log('🔄 Updating existing month setting:', monthSetting);
        
        try {
          const response = await axios.put(`/api/month-settings/${monthSetting._id}`, {
            enabled: monthSetting.enabled
          });
          console.log('✅ Month setting updated successfully:', response.data);
          alert(`ระบบประเมินเดือน ${this.getCurrentMonthName()} ได้รับการตั้งค่าใหม่: ${monthSetting.enabled ? 'เปิด' : 'ปิด'}`);
          
          // โหลดข้อมูลใหม่เพื่อให้แน่ใจว่าข้อมูลตรงกับ server
          await this.reloadMonthSettings();
        } catch (error) {
          console.error('❌ Error updating month setting:', {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url,
            method: error.config?.method,
            data: error.response?.data
          });
          alert('เกิดข้อผิดพลาดในการตั้งค่าระบบประเมิน');
          this.evaluationSystemEnabled = !this.evaluationSystemEnabled; // Revert state on error
        }
      } else {
        // ถ้าไม่มีการตั้งค่าหรือไม่มี _id ให้สร้างใหม่
        console.log('📝 No existing month setting found or missing _id, creating new one...');
        
        if (confirm(`คุณต้องการตั้งค่าระบบประเมินสำหรับเดือน ${this.getCurrentMonthName()} ใช่หรือไม่?`)) {
          try {
            console.log('🔄 Creating new month setting:', {
              month: this.currentMonth,
              enabled: this.evaluationSystemEnabled
            });
            
            const response = await axios.post('/api/month-settings', {
              month: this.currentMonth,
              enabled: this.evaluationSystemEnabled
            });
            
            console.log('✅ New month setting created successfully:', response.data);
            alert(`ระบบประเมินเดือน ${this.getCurrentMonthName()} ได้รับการตั้งค่าใหม่: ${this.evaluationSystemEnabled ? 'เปิด' : 'ปิด'}`);
            
            // อัพเดท local state ด้วยข้อมูลใหม่จาก server
            if (monthSetting) {
              // อัพเดทข้อมูลที่มีอยู่
              Object.assign(monthSetting, response.data.data);
            } else {
              // เพิ่มข้อมูลใหม่
              this.monthSettings.push(response.data.data);
            }
            
            // โหลดข้อมูลใหม่เพื่อให้แน่ใจว่าข้อมูลตรงกับ server
            await this.reloadMonthSettings();
          } catch (error) {
            console.error('❌ Error creating month setting:', {
              message: error.message,
              status: error.response?.status,
              statusText: error.response?.statusText,
              url: error.config?.url,
              method: error.config?.method,
              data: error.response?.data
            });
            alert('เกิดข้อผิดพลาดในการตั้งค่าระบบประเมิน');
          }
        } else {
          console.log('❌ User cancelled month setting creation');
          this.evaluationSystemEnabled = !this.evaluationSystemEnabled; // Revert state if user cancels
        }
      }
    },

    async loadMonthSettings() {
      try {
        console.log('🔄 Loading month settings...');
        const response = await axios.get('/api/month-settings');
        console.log('✅ Month settings loaded successfully:', response.data);
        this.monthSettings = response.data.data || response.data;
        this.loadingMonthSettings = false;
      } catch (error) {
        console.error('❌ Error loading month settings:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method
        });
        this.loadingMonthSettings = false;
      }
    },

    getCurrentMonthName() {
      const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      return monthNames[this.currentMonth - 1];
    },

    openMonthSettingsModal() {
      this.showMonthSettingsModal = true;
    },

    closeMonthSettingsModal() {
      this.showMonthSettingsModal = false;
    },

    async saveMonthSettings() {
      try {
        console.log('🔄 Saving month settings...', this.monthSettings);
        await axios.post('/api/month-settings/bulk', { monthSettings: this.monthSettings });
        console.log('✅ Month settings saved successfully');
        alert('ตั้งค่าระบบประเมินทั้งหมดเรียบร้อยแล้ว!');
        this.closeMonthSettingsModal();
      } catch (error) {
        console.error('❌ Error saving month settings:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method,
          data: error.response?.data
        });
        alert('เกิดข้อผิดพลาดในการบันทึกตั้งค่าระบบประเมิน');
      }
    },

    getMonthSetting(month) {
      return this.monthSettings.find(setting => setting.month === month);
    },

    toggleMonthSetting(month) {
      const setting = this.getMonthSetting(month);
      if (setting) {
        setting.enabled = !setting.enabled;
      } else {
        this.monthSettings.push({ month: month, enabled: true }); // Default to enabled if not found
      }
    },

    getMonthName(month) {
      const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      return monthNames[month - 1];
    },

    async checkCurrentMonthStatus() {
      try {
        console.log('🔄 Checking current month status...');
        const response = await axios.get('/api/month-settings/current');
        console.log('✅ Current month status loaded:', response.data);
        this.evaluationSystemEnabled = response.data.data.enabled;
        this.loadingMonthSettings = false;
      } catch (error) {
        console.error('❌ Error checking current month status:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method,
          data: error.response?.data
        });
        this.loadingMonthSettings = false;
        // Default to enabled if API fails
        this.evaluationSystemEnabled = true;
      }
    },

    // ฟังก์ชันสำหรับโหลดข้อมูลการตั้งค่าเดือนใหม่
    async reloadMonthSettings() {
      try {
        console.log('🔄 Reloading month settings...');
        const response = await axios.get('/api/month-settings');
        console.log('✅ Month settings reloaded:', response.data);
        this.monthSettings = response.data.data || response.data;
        
        // อัพเดทสถานะของเดือนปัจจุบัน
        const currentMonthSetting = this.monthSettings.find(
          setting => setting.month === this.currentMonth
        );
        this.evaluationSystemEnabled = currentMonthSetting ? currentMonthSetting.enabled : true;
      } catch (error) {
        console.error('❌ Error reloading month settings:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method
        });
      }
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  color: white;
}

.header h1 {
  color: white;
  margin: 0;
  font-size: 28px;
  font-weight: 600;
}

/* Enhanced Filters Section */
.filters-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  overflow: hidden;
}

.filters-header {
  background: #f7fafc;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
}

.filters-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.filters-content {
  padding: 30px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 25px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #333;
  font-size: 14px;
}

.filter-label i {
  color: #6b7280;
  width: 16px;
}

/* Enhanced Select */
.select-wrapper {
  position: relative;
}

.custom-select {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
  appearance: none;
}

.custom-select:focus {
  outline: none;
  border-color: #3498db;
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
}

/* Search Box */
.search-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 16px;
  padding-right: 40px; /* Adjust for icon */
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
  pointer-events: none;
}

/* Upload Excel Button */
.upload-excel-btn {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #3498db;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  color: #3498db;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.upload-excel-btn:hover {
  background-color: #e0f2fe;
  border-color: #2980b9;
}

.upload-excel-btn i {
  color: #3498db;
}

/* Reset Scores Button */
.reset-scores-btn {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #dc2626; /* Red border for reset */
  border-radius: 4px;
  font-size: 14px;
  background: white;
  color: #dc2626;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.reset-scores-btn:hover {
  background-color: #fee2e2;
  border-color: #c0392b;
}

.reset-scores-btn i {
  color: #dc2626;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-content h3 {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.stat-content p {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  color: #111827;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #111827;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-card.passed {
  /* ลบสี background */
}

.stat-card.passed .stat-value {
  color: #0277bd;
}

.stat-card.failed {
  /* ลบสี background */
}

.stat-card.failed .stat-value {
  color: #dc2626;
}

.shops-section {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
  padding: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.section-header h3 {
  margin: 0;
  color: #333;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.section-header h3 i {
  color: #3498db;
}

.section-header h3 .selected-canteen {
  color: #4b5563;
  font-weight: 500;
  margin-left: 10px;
  padding: 4px 12px;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.section-header h3 .selected-canteen i {
  color: #3498db;
  font-size: 12px;
}

.section-header h3 .selected-canteen .canteen-name {
  color: #4b5563;
  font-weight: 600;
  font-size: 14px;
}

.section-header h3 .shop-count {
  color: #6b7280;
  font-weight: 400;
  margin-left: 5px;
  font-size: 12px;
}

.section-header h3 .total-shops {
  color: #4b5563;
  font-weight: 500;
  margin-left: 10px;
  padding: 4px 12px;
  background: #f3f4f6;
  border-radius: 20px;
  font-size: 14px;
}

.section-actions {
  margin-left: auto; /* Push content to the right */
}

.add-canteen-btn {
  background: #4CAF50; /* A green color for adding new canteens */
  color: white;
  padding: 8px 15px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s ease;
  white-space: nowrap; /* Prevent text wrapping */
}

.add-canteen-btn:hover {
  background: #45a049;
}

.add-canteen-btn i {
  color: white;
}

.shops-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-top: 20px;
}

.table-header {
  display: grid;
  grid-template-columns: 80px 2fr 1.5fr 1fr 1fr 1fr 1fr 120px;
  background: #f7fafc;
  font-weight: 600;
  padding: 16px 0;
  border-bottom: 2px solid #e2e8f0;
}

.header-cell {
  padding: 0 15px;
  color: #333;
  font-size: 14px;
  text-align: left;
  display: flex;
  align-items: center;
}

.header-cell:first-child {
  justify-content: center;
}

.header-cell:nth-child(4) {
  justify-content: flex-end;
  text-align: right;
}

.header-cell:nth-child(5) {
  justify-content: center;
  text-align: center;
}

.header-cell:nth-child(6) {
  justify-content: center;
  text-align: center;
}

.header-cell:nth-child(7) {
  justify-content: center;
  text-align: center;
}

.header-cell:last-child {
  justify-content: center;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 2fr 1.5fr 1fr 1fr 1fr 1fr 120px;
  border-bottom: 1px solid #e2e8f0;
  transition: background-color 0.2s;
}

.table-row:hover {
  background: #f7fafc;
}

.table-row:last-child {
  border-bottom: none;
}

.cell {
  padding: 16px 15px;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.rank-cell {
  font-weight: bold;
  color: #3498db;
  justify-content: center;
}

.shop-name-cell {
  font-weight: 600;
  color: #333;
}

.canteen-cell {
  color: #4b5563;
  font-weight: 500;
}

.canteen-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4b5563;
  font-weight: 500;
}

.canteen-info i {
  color: #3498db;
  font-size: 14px;
}

.canteen-info span {
  color: #4b5563;
  font-weight: 500;
}

.canteen-name {
  color: #4b5563;
  font-weight: 500;
  font-size: 14px;
}

.shop-type-cell {
  color: #4b5563;
}

.revenue-cell {
  color: #059669;
  font-weight: 600;
  justify-content: flex-end;
  text-align: right;
}

.score-cell {
  justify-content: center;
  text-align: center;
  font-weight: 600;
  color: #3498db;
}

.status-cell {
  justify-content: center;
  text-align: center;
}

.result-cell {
  justify-content: center;
  text-align: center;
}

.evaluation-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.evaluate-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.3s ease;
}

.evaluate-btn:hover {
  background: #2980b9;
}

.evaluate-btn:disabled {
  background: #9ca3af;
  color: #6b7280;
  cursor: not-allowed;
  opacity: 0.6;
}

.evaluate-btn:disabled:hover {
  background: #9ca3af;
}

.evaluate-btn:disabled i {
  color: #6b7280;
}

.shop-status-cell {
  display: flex;
  align-items: center;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  min-width: 80px;
  display: inline-block;
}

.status-badge.passed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.failed {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.completed {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.not-evaluated {
  background: #fee2e2;
  color: #991b1b;
}

.result-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  min-width: 60px;
}

.result-badge.passed {
  background: transparent;
  color: #10b981;
  border: 1px solid #10b981;
}

.result-badge.failed {
  background: transparent;
  color: #e74c3c;
  border: 1px solid #e74c3c;
}

.no-data {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 15px;
  color: #d1d5db;
}

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
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f7fafc;
}

.modal-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.add-topic-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.3s ease;
}

.add-topic-btn:hover {
  background: #059669;
}

.add-topic-btn i {
  font-size: 12px;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 20px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
  background: #f9fafb;
}

.upload-area:hover {
  border-color: #3498db;
}

.file-input {
  display: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  font-size: 14px;
}

.upload-placeholder i {
  font-size: 3rem;
  color: #3498db;
}

.file-info {
  font-size: 12px;
  color: #9ca3af;
}

.upload-progress {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.progress-bar {
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #3498db, #2980b9);
  border-radius: 4px;
  transition: width 0.3s ease-in-out;
}

.upload-result {
  padding: 15px;
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
  border-radius: 8px;
  color: #155724;
}

.upload-result h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 600;
}

.upload-result p {
  margin: 5px 0;
  font-size: 14px;
}

.upload-result .error {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
  padding: 10px;
  border-radius: 5px;
  margin-top: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
}

.cancel-btn,
.upload-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease, opacity 0.3s ease;
}

.cancel-btn {
  background-color: #e0e0e0;
  color: #333;
}

.cancel-btn:hover {
  background-color: #d0d0d0;
}

.upload-btn {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.upload-btn:hover {
  background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
  opacity: 0.9;
}

.upload-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

/* Evaluation Form Styles */
.evaluation-form {
  display: flex;
  flex-direction: column;
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

.form-input,
.form-select,
.form-textarea {
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3498db;
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.save-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.save-btn:hover {
  background: #059669;
}

.unknown-canteens-info {
  background: #fdf6e3; /* Light yellow background */
  border: 1px solid #f0d9b5; /* Light orange border */
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  color: #856404; /* Darker text color */
}

.unknown-canteens-info h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #856404;
}

.unknown-ids {
  font-size: 14px;
  font-weight: 500;
  color: #856404;
  margin-bottom: 10px;
}

.info-text {
  font-size: 13px;
  color: #856404;
  margin-top: 0;
}

.score-cell {
  color: #0277bd;
  font-weight: 600;
  justify-content: center;
}

.warning-message {
  background-color: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  color: #faad14;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.warning-message i {
  font-size: 3rem;
  color: #faad14;
}

.warning-message h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.warning-message p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.warning-message ul {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  font-size: 14px;
  color: #faad14;
}

.warning-message ul li {
  margin-bottom: 5px;
  position: relative;
  padding-left: 20px;
}

.warning-message ul li::before {
  content: "•";
  color: #faad14;
  position: absolute;
  left: 0;
}

.reset-btn {
  background: #dc2626; /* Red color for reset */
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.reset-btn:hover {
  background: #c0392b;
}

.reset-btn i {
  color: white;
}

/* Month Control Styles */
.month-control-group {
  grid-column: span 2; /* Take up two columns */
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.month-control-container {
  display: flex;
  align-items: center;
  gap: 15px;
  background: #f7fafc;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.current-month-display {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.month-label {
  color: #6b7280;
  font-size: 14px;
}

.month-value {
  color: #111827;
  font-size: 16px;
}

.switch-container {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.switch {
  position: relative;
  width: 50px;
  height: 28px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 28px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #3498db;
}

input:focus + .slider {
  box-shadow: 0 0 1px #3498db;
}

input:checked + .slider:before {
  transform: translateX(22px);
}

.switch-label {
  color: #333;
  font-size: 16px;
}

.month-settings-btn {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #3498db;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  color: #3498db;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.month-settings-btn:hover {
  background-color: #e0f2fe;
  border-color: #2980b9;
}

.month-settings-btn i {
  color: #3498db;
}

/* Month Settings Modal Styles */
.month-settings-modal-overlay {
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

.month-settings-modal {
  background: white;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.month-settings-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e2e8f0;
  background: #f7fafc;
}

.month-settings-modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.month-settings-modal-body {
  padding: 20px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
}

.month-settings-info {
  background: #fdf6e3; /* Light yellow background */
  border: 1px solid #f0d9b5; /* Light orange border */
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  color: #856404; /* Darker text color */
}

.month-settings-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #856404;
}

.month-settings-info strong {
  color: #856404;
  font-weight: 600;
}

.month-settings-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.month-setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background: #f9fafb;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.month-setting-item:hover {
  background-color: #f0f9eb;
  border-color: #d1fae5;
}

.month-setting-item.active {
  background-color: #d1fae5;
  border-color: #10b981;
  font-weight: 600;
  color: #065f46;
}

.month-setting-item.active .switch-label {
  color: #065f46;
}

.month-setting-item .month-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.month-setting-item .switch-container {
  flex-direction: row-reverse; /* Switch to the right */
  align-items: center;
  gap: 10px;
}

.month-setting-item .switch-label {
  font-size: 16px;
}

.month-setting-item .switch {
  width: 40px; /* Smaller switch for list items */
  height: 24px;
}

.month-setting-item .switch input:checked + .slider:before {
  transform: translateX(16px); /* Adjust for smaller switch */
}

.month-settings-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px;
  border-top: 1px solid #e2e8f0;
  background: #f7fafc;
}

.month-settings-modal-footer .cancel-btn {
  background-color: #e0e0e0;
  color: #333;
}

.month-settings-modal-footer .cancel-btn:hover {
  background-color: #d0d0d0;
}

.month-settings-modal-footer .save-btn {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.month-settings-modal-footer .save-btn:hover {
  background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
  opacity: 0.9;
}

@media (max-width: 768px) {
  .filters-content {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .stats-cards {
    grid-template-columns: 1fr;
  }
  
  .header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .shops-table .table-header,
  .shops-table .table-row {
    grid-template-columns: 60px 1.5fr 1fr 1fr 1fr 1fr 1fr;
    font-size: 12px;
  }

  .shops-table .header-cell,
  .shops-table .cell {
    padding: 12px 8px;
    font-size: 12px;
  }

  .shops-table .shop-name-cell {
    font-size: 13px;
  }

  .shops-table .canteen-cell {
    font-size: 11px;
  }

  .shops-table .revenue-cell {
    font-size: 11px;
  }

  .shops-table .score-cell {
    font-size: 11px;
  }

  .shops-table .evaluation-cell {
    gap: 6px;
  }

  .shops-table .evaluate-btn {
    padding: 6px 10px;
    font-size: 10px;
    gap: 4px;
  }

  .shops-table .status-badge {
    padding: 3px 6px;
    font-size: 10px;
    min-width: 60px;
  }

  .month-control-group {
    grid-column: span 1; /* Take up one column */
  }

  .month-control-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .current-month-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .system-status {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .switch-container {
    width: 100%;
    justify-content: space-between;
  }

  .switch {
    width: 100%;
  }

  .switch-label {
    font-size: 14px;
  }

  .month-settings-btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .shops-table .table-header,
  .shops-table .table-row {
    grid-template-columns: 50px 1.2fr 0.8fr 0.8fr 0.8fr 0.8fr 1fr;
    font-size: 11px;
  }

  .shops-table .header-cell,
  .shops-table .cell {
    padding: 8px 4px;
    font-size: 11px;
  }

  .shops-table .evaluate-btn {
    padding: 4px 8px;
    font-size: 9px;
    gap: 2px;
  }

  .shops-table .status-badge {
    padding: 2px 4px;
    font-size: 9px;
    min-width: 50px;
  }
}

.month-settings-info .enabled-text {
  color: #10b981;
  font-weight: 600;
}

.month-settings-info .disabled-text {
  color: #e74c3c;
  font-weight: 600;
}

.month-settings-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.month-setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px;
  background: #f9fafb;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

.month-setting-item:hover {
  background-color: #f0f9eb;
  border-color: #d1fae5;
}

.month-setting-item.active {
  background-color: #d1fae5;
  border-color: #10b981;
  font-weight: 600;
  color: #065f46;
}

.month-setting-item.active .switch-label {
  color: #065f46;
}

.month-setting-item .month-name {
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.month-setting-item .switch-container {
  flex-direction: row-reverse; /* Switch to the right */
  align-items: center;
  gap: 10px;
}

.month-setting-item .switch-label {
  font-size: 16px;
}

.month-setting-item .switch {
  width: 40px; /* Smaller switch for list items */
  height: 24px;
}

.month-setting-item .switch input:checked + .slider:before {
  transform: translateX(16px); /* Adjust for smaller switch */
}

.status-indicator {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-indicator.enabled {
  background-color: #d1fae5;
  color: #065f46;
}

.status-indicator.disabled {
  background-color: #fee2e2;
  color: #991b1b;
}

.status-label {
  font-size: 14px;
  font-weight: 600;
  margin-right: 10px;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #333;
  font-size: 16px;
}

.status-label {
  color: #6b7280;
  font-size: 14px;
}

.status-indicator {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-indicator.enabled {
  background-color: #d1fae5;
  color: #065f46;
}

.status-indicator.disabled {
  background-color: #fee2e2;
  color: #991b1b;
}
</style>