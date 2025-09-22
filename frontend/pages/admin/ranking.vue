<template>
  <layout-admin class="ranking-layout">
    <div class="ranking-container">
      <!-- Left Sidebar -->
      <div class="sidebar">
        <div class="sidebar-header">
          <h2>Ranking System</h2>
      </div>

        <div class="sidebar-menu">
          <div class="menu-item" :class="{ active: activeMenu === 'control' }" @click="setActiveMenu('control')">
            <i class="fas fa-cog"></i>
            <span>ตัวควบคุมแบบประเมิน</span>
            <div class="status-indicator" :class="{ enabled: evaluationSystemEnabled }"></div>
        </div>
        
          <div class="menu-item" :class="{ active: activeMenu === 'add-topic' }" @click="setActiveMenu('add-topic')">
            <i class="fas fa-plus-circle"></i>
            <span>เพิ่มหัวข้อแบบประเมิน</span>
          </div>

          <div class="menu-item" :class="{ active: activeMenu === 'view-topic' }" @click="setActiveMenu('view-topic')">
            <i class="fas fa-list"></i>
            <span>ดูหัวข้อแบบประเมิน</span>
          </div>

          <div class="menu-item" :class="{ active: activeMenu === 'history' }" @click="setActiveMenu('history')">
            <i class="fas fa-history"></i>
            <span>ประวัติย้อนหลัง</span>
          </div>


          <div class="menu-item" :class="{ active: activeMenu === 'evaluation' }" @click="setActiveMenu('evaluation')">
            <i class="fas fa-clipboard-check"></i>
            <span>ทำแบบประเมิน</span>
          </div>
              </div>
              </div>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Header Section -->
        <div class="content-header">
          <div class="header-left">
            <h1>List details</h1>
              </div>
          <div class="header-right">
            <div class="import-buttons">
              <input 
                type="file" 
                ref="fileInput" 
                @change="handleFileSelect" 
                accept=".xlsx,.xls,.csv" 
                style="display: none;"
              />
              <button class="import-btn" @click="triggerFileSelect">
                <i class="fas fa-upload"></i>
                Import Excel
              </button>
              <button class="export-btn" @click="exportData">
                <i class="fas fa-download"></i>
                Export CSV
              </button>
            </div>
            </div>
          </div>

        <!-- Filters Section -->
        <div class="filters-section" v-if="activeMenu === 'control' || activeMenu === 'evaluation' || activeMenu === 'history'">
          <!-- Search Input -->
          <div class="search-group">
            <label>ค้นหาอะไร?</label>
            <div class="search-input-container">
              <i class="fas fa-search search-icon"></i>
              <input 
                type="text" 
                v-model="searchQuery"
                placeholder="ค้นหาตามชื่อร้าน, หมวดหมู่, โรงอาหาร..."
                class="search-input"
                @input="onFilterChange"
              />
            </div>
          </div>

          <!-- Dropdown Filters -->
          <div class="filter-group">
            <label>สถานะโรงอาหาร</label>
            <select v-model="selectedCanteen" @change="onFilterChange">
              <option value="">ทั้งหมด</option>
              <option v-for="(canteenName, canteenId) in canteenMapping" :key="canteenId" :value="canteenId">
                {{ canteenName }}
              </option>
            </select>
          </div>
          
          <div class="filter-group">
            <label>หมวดหมู่</label>
            <select v-model="selectedCategory" @change="onFilterChange">
              <option value="">ทั้งหมด</option>
              <option value="food">อาหาร</option>
              <option value="drink">เครื่องดื่ม</option>
              <option value="dessert">ของหวาน</option>
              <option value="other">อื่นๆ</option>
            </select>
          </div>
          

          <!-- Dropdown สำหรับหน้า ตัวควบคุมแบบประเมิน -->
          <div class="filter-group" v-if="activeMenu === 'control'">
            <label>สถานะ</label>
            <select v-model="selectedStatus" @change="onFilterChange">
              <option value="">ทั้งหมด</option>
              <option value="completed">เสร็จสิ้น</option>
              <option value="pending">รอดำเนินการ</option>
            </select>
          </div>

          <!-- Dropdown สำหรับหน้า ทำแบบประเมิน -->
          <div class="filter-group" v-if="activeMenu === 'evaluation'">
            <label>ประเมิน</label>
            <select v-model="selectedEvaluation" @change="onFilterChange">
              <option value="">ทั้งหมด</option>
              <option value="evaluate">ประเมิน</option>
              <option value="edit">แก้ไข</option>
            </select>
          </div>

          <!-- Dropdown สำหรับหน้า ประวัติย้อนหลัง -->
          <div class="filter-group" v-if="activeMenu === 'history'">
            <label>สถานะ</label>
            <select v-model="selectedHistoryStatus" @change="onFilterChange">
              <option value="">ทั้งหมด</option>
              <option value="passed">ผ่าน</option>
              <option value="failed">ไม่ผ่าน</option>
            </select>
          </div>

          <!-- Dropdown เรียงลำดับคะแนน สำหรับหน้า ทำแบบประเมิน และ ประวัติย้อนหลัง -->
          <div class="filter-group" v-if="activeMenu === 'evaluation' || activeMenu === 'history'">
            <label>เรียงลำดับคะแนน</label>
            <select v-model="selectedScoreSort" @change="onFilterChange">
              <option value="">ไม่เรียงลำดับ</option>
              <option value="asc">น้อยสุดไปมากสุด</option>
              <option value="desc">มากสุดไปน้อยสุด</option>
            </select>
          </div>


          <!-- ส่วนควบคุม - แสดงเฉพาะในหน้า ตัวควบคุมแบบประเมิน -->
          <div class="filter-group control-group" v-if="activeMenu === 'control'">
            <label>ควบคุม</label>
            <div class="control-container">
              <div class="control-switch-container">
                <label class="switch">
                  <input 
                    type="checkbox" 
                    v-model="evaluationSystemEnabled"
                    @change="toggleEvaluationSystem"
                  >
                  <span class="slider round"></span>
                </label>
                <span class="switch-text">
                  {{ evaluationSystemEnabled ? 'เปิดระบบประเมิน' : 'ปิดระบบประเมิน' }}
                </span>
              </div>
              <button class="reset-btn" @click="resetScores">
                <i class="fas fa-redo"></i>
                Reset คะแนน
              </button>
            </div>
          </div>
        </div>
        
        <!-- Stats Section -->
        <div class="stats-section" v-if="activeMenu === 'view-topic'">
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-list-alt"></i>
            </div>
            <div class="stat-label">จำนวนหัวข้อ</div>
            <div class="stat-value">{{ totalEvaluationTopics }}</div>
        </div>
        
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-star"></i>
            </div>
            <div class="stat-label">คะแนนเต็มรวม</div>
            <div class="stat-value">{{ totalMaxScore }} คะแนน</div>
        </div>
        
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-store"></i>
            </div>
            <div class="stat-label">จำนวนร้านค้า</div>
            <div class="stat-value">{{ totalShops }}</div>
          </div>
        </div>

        <!-- Stats Section for evaluation menu -->
        <div class="stats-section" v-if="activeMenu === 'evaluation'">
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-label">สถานะผ่าน</div>
            <div class="stat-value">{{ passedShopsCount }}</div>
        </div>
        
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-times-circle"></i>
            </div>
            <div class="stat-label">สถานะไม่ผ่าน</div>
            <div class="stat-value">{{ failedShopsCount }}</div>
        </div>
        
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-store"></i>
            </div>
            <div class="stat-label">จำนวนร้านค้า</div>
            <div class="stat-value">{{ totalShops }}</div>
          </div>
        </div>

        <!-- Stats Section for other menus (excluding history and evaluation) -->
        <div class="stats-section" v-if="activeMenu !== 'view-topic' && activeMenu !== 'history' && activeMenu !== 'evaluation'">
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-money-bill-wave"></i>
            </div>
            <div class="stat-label">รายได้ทั้งหมด</div>
            <div class="stat-value">{{ formatCurrency(totalRevenue) }}</div>
        </div>
        
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-label">รายได้เฉลี่ย</div>
            <div class="stat-value">{{ formatCurrency(averageRevenue) }}</div>
        </div>
        
          <div class="stat-item">
            <div class="stat-icon">
              <i class="fas fa-store"></i>
            </div>
            <div class="stat-label">จำนวนร้านค้า</div>
            <div class="stat-value">{{ totalShops }}</div>
          </div>
        </div>
        
        <!-- Loading Spinner -->
        <div v-if="isLoading" class="loading-container">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p class="loading-text">กำลังโหลดข้อมูล...</p>
          </div>
        </div>

        <!-- Data Table for Control and Evaluation -->
        <div class="data-table" v-if="(activeMenu === 'control' || activeMenu === 'evaluation') && !isLoading">
        <div class="table-header">
          <div class="header-cell">ลำดับ</div>
            <div class="header-cell">Shop ID</div>
          <div class="header-cell">ชื่อร้านค้า</div>
            <div class="header-cell">หมวดหมู่</div>
            <div class="header-cell">ชื่อโรงอาหาร</div>
          <div class="header-cell" v-if="activeMenu !== 'evaluation'">รายได้</div>
            <div class="header-cell">เดือน</div>
            <div class="header-cell">ปี</div>
            <div class="header-cell" v-if="activeMenu !== 'evaluation'">สถานะ</div>
            <div class="header-cell" v-if="activeMenu === 'evaluation'">สถานะ</div>
            <div class="header-cell" v-if="activeMenu === 'evaluation'">คะแนนรวม</div>
            <div class="header-cell" v-if="activeMenu === 'evaluation'">ประเมิน</div>
        </div>
        
        <div v-for="(shop, index) in paginatedShops" :key="shop._id" class="table-row">
          <div class="cell">{{ startItem + index }}</div>
            <div class="cell">{{ formatCustomId(shop.customId || shop._id) }}</div>
          <div class="cell">{{ shop.name }}</div>
          <div class="cell">{{ getCategoryName(shop.type) }}</div>
          <div class="cell">{{ getCanteenName(shop.canteenId) }}</div>
            <div class="cell" v-if="activeMenu !== 'evaluation'">{{ formatCurrency(shop.revenue || 0) }}</div>
            <div class="cell">{{ getCurrentMonthName() }}</div>
            <div class="cell">{{ new Date().getFullYear() }}</div>
            <div class="cell" v-if="activeMenu !== 'evaluation' && activeMenu !== 'control'">
              <span :class="['status-badge', getStatusClass(shop)]">
                {{ getStatusText(shop) }}
            </span>
          </div>
            <div class="cell" v-if="activeMenu === 'control'">
              <span :class="['status-badge', getEvaluationStatusClass(shop)]">
                {{ getEvaluationStatusText(shop) }}
            </span>
          </div>
            <div class="cell" v-if="activeMenu === 'evaluation'">
              <span :class="['status-badge', getEvaluationStatusClass(shop)]">
                {{ getEvaluationStatusText(shop) }}
            </span>
          </div>
            <div class="cell" v-if="activeMenu === 'evaluation'">{{ getTotalScore(shop) }}</div>
            <div class="cell" v-if="activeMenu === 'evaluation'">
            <button 
              class="evaluate-btn"
              :class="{ 
                disabled: !evaluationSystemEnabled,
                'edit-mode': isShopEvaluated(shop)
              }"
              :disabled="!evaluationSystemEnabled"
              @click="openEvaluationModal(shop)"
            >
              {{ isShopEvaluated(shop) ? 'แก้ไข' : 'ประเมิน' }}
            </button>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div class="pagination-container" v-if="filteredShops.length > 0">
        <div class="pagination-info">
          <span>Items per page:</span>
          <select v-model="itemsPerPage" @change="onItemsPerPageChange" class="items-per-page-select">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="50">50</option>
          </select>
        </div>
        
        <div class="pagination-range">
          {{ startItem }}-{{ endItem }} of {{ filteredShops.length }}
        </div>
        
        <div class="pagination-buttons">
          <button 
            class="pagination-btn prev-btn" 
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            previous
          </button>
          
          <button 
            v-for="page in visiblePages" 
            :key="page"
            class="pagination-btn page-btn"
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          
          <button 
            class="pagination-btn next-btn" 
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            next
          </button>
        </div>
      </div>
    </div>

        <!-- History Section with Evaluations Data -->
        <div v-if="activeMenu === 'history' && !isLoading">
          <!-- Evaluations History Section -->
          <div class="history-section">
            <div class="section-header">
              <div class="section-title">
                <span class="status-indicator active"></span>
                <h3>ประวัติการประเมิน</h3>
              </div>
              <span class="shop-count">{{ filteredShops.length }} รายการ</span>
            </div>
            
            <div class="data-table" v-if="filteredShops.length > 0">
              <div class="table-header">
                <div class="header-cell">ลำดับ</div>
                <div class="header-cell">Shop ID</div>
                <div class="header-cell">ชื่อร้านค้า</div>
                <div class="header-cell">หมวดหมู่</div>
                <div class="header-cell">โรงอาหาร</div>
                <div class="header-cell">รายได้</div>
                <div class="header-cell">คะแนนรวม</div>
                <div class="header-cell">สถานะ</div>
                <div class="header-cell">เดือน/ปี</div>
                <div class="header-cell">รายละเอียด</div>
              </div>
              
              <div v-for="(evaluation, index) in filteredShops" :key="evaluation._id" class="table-row">
                <div class="cell">{{ index + 1 }}</div>
                <div class="cell">{{ formatCustomId(evaluation.customId || evaluation.shopId?.customId || evaluation.shopId?._id) }}</div>
                <div class="cell">{{ evaluation.shopName || evaluation.shopId?.name || '-' }}</div>
                <div class="cell">{{ getCategoryName(evaluation.type) }}</div>
                <div class="cell">{{ evaluation.canteenName || '-' }}</div>
                <div class="cell">{{ formatCurrency(evaluation.revenue || 0) }}</div>
                <div class="cell">{{ getTotalScore(evaluation) }}</div>
                <div class="cell">
                  <span :class="['status-badge', getEvaluationStatusClass(evaluation)]">
                    {{ getEvaluationStatusText(evaluation) }}
                  </span>
                </div>
                <div class="cell">{{ getMonthName(evaluation.evaluationMonth) }} {{ evaluation.evaluationYear }}</div>
                <div class="cell">
                  <button 
                    class="details-btn"
                    @click="openEvaluationDetailsModal(evaluation)"
                    title="ดูรายละเอียดการประเมิน"
                  >
                    <i class="fas fa-eye"></i>
                    รายละเอียด
                  </button>
                </div>
              </div>
            </div>
            
            <div v-else class="no-data-message">
              <i class="fas fa-info-circle"></i>
              <p>ไม่มีข้อมูลประวัติการประเมิน</p>
            </div>
              </div>
            </div>
            
          
        <!-- Add Topic Panel -->
        <div class="topic-panel" v-if="activeMenu === 'add-topic'">
          <div class="panel-header">
            <h3>เพิ่มหัวข้อแบบประเมิน</h3>
          </div>
          <div class="panel-content">
            <div class="form-group">
              <label>ชื่อหัวข้อ:</label>
              <input v-model="newTopic.title" type="text" placeholder="กรอกชื่อหัวข้อ">
        </div>
            <div class="form-group">
              <label>คำอธิบาย:</label>
              <textarea v-model="newTopic.description" placeholder="กรอกคำอธิบาย"></textarea>
        </div>
            <div class="form-group">
              <label>คะแนนเต็ม:</label>
              <input v-model="newTopic.maxScore" type="number" placeholder="100">
            </div>
            <button class="save-btn" @click="saveTopic">บันทึก</button>
      </div>
    </div>

        <!-- View Topics Panel -->
        <div class="topics-list" v-if="activeMenu === 'view-topic'">
          <div class="panel-header">
            <h3>หัวข้อแบบประเมิน</h3>
          </div>
          
          <!-- Loading for topics -->
          <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p class="loading-text">กำลังโหลดหัวข้อแบบประเมิน...</p>
            </div>
          </div>
          
          <!-- Topics grid -->
          <div v-else class="topics-grid">
            <div v-for="topic in evaluationTopics" :key="topic._id" class="topic-card">
              <div class="topic-content">
                <h4>{{ topic.title }}</h4>
                <p v-if="topic.description" class="topic-description">{{ topic.description }}</p>
                <p v-else class="topic-description no-description">
                  <i class="fas fa-exclamation-triangle"></i>
                  ยังไม่มีคำอธิบาย - กดปุ่มแก้ไขเพื่อเพิ่มคำอธิบาย
                </p>
              </div>
              <div class="topic-meta">
                <span>คะแนนเต็ม: {{ topic.maxScore }}</span>
                <div class="topic-actions">
                  <button 
                    class="edit-btn" 
                    :class="{ 'add-description-btn': !topic.description }"
                    @click="editTopic(topic)"
                  >
                    {{ topic.description ? 'แก้ไข' : 'เพิ่มรายละเอียด' }}
                  </button>
                  <button class="delete-btn" @click="deleteTopic(topic)">ลบ</button>
                </div>
              </div>
            </div>
          </div>
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

    <!-- Evaluation Details Modal -->
    <div v-if="showEvaluationDetailsModal" class="modal-overlay" @click="closeEvaluationDetailsModal">
      <div class="modal evaluation-details-modal" @click.stop>
        <div class="modal-header">
          <div class="header-content">
            <div class="header-title">
              <i class="fas fa-clipboard-check"></i>
              <h3>รายละเอียดการประเมิน: {{ selectedEvaluation?.shopName || selectedEvaluation?.shopId?.name || '-' }}</h3>
            </div>
            <div class="header-subtitle">
              <div class="subtitle-row">
                <span class="evaluation-status">
                  <i class="fas fa-info-circle"></i>
                  ระบบประเมินคุณภาพร้านค้า
                </span>
                <span class="progress-status" v-if="currentEvaluationDetails && currentEvaluationDetails.items" :class="{ 'complete': currentEvaluationDetails.finalStatus === 'ผ่าน' }">
                  <i class="fas fa-chart-pie"></i>
                  สถานะ: {{ currentEvaluationDetails.finalStatus || 'รอดำเนินการ' }}
                </span>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <button @click="closeEvaluationDetailsModal" class="close-btn">
              <i class="fas fa-times"></i>
              <span>ปิด</span>
            </button>
          </div>
        </div>

        <div class="modal-body">
          <!-- Summary Info -->
          <div class="summary-info-section">
            <div class="summary-info-grid">
              <div class="summary-info-item">
                <div class="summary-info-label">คะแนนรวม</div>
                <div class="summary-info-value total-score">
                  {{ currentEvaluationDetails?.totalScore || 0 }} / {{ getMaxPossibleScore() }}
                </div>
              </div>
              <div class="summary-info-item">
                <div class="summary-info-label">สถานะ</div>
                <div class="summary-info-value">
                  <span :class="['status-badge', getEvaluationStatusClass(currentEvaluationDetails)]">
                    {{ currentEvaluationDetails?.finalStatus || 'รอดำเนินการ' }}
                  </span>
                </div>
              </div>
              <div class="summary-info-item" v-if="currentEvaluationDetails?.evaluatedAt">
                <div class="summary-info-label">วันที่ประเมิน</div>
                <div class="summary-info-value">{{ formatDate(currentEvaluationDetails.evaluatedAt) }}</div>
              </div>
              <div class="summary-info-item">
                <div class="summary-info-label">รอบประเมิน</div>
                <div class="summary-info-value">
                  <select 
                    v-model="selectedRound" 
                    @change="loadEvaluationDetails"
                    class="round-select"
                  >
                    <option 
                      v-for="round in availableRounds" 
                      :key="round" 
                      :value="round"
                    >
                      รอบที่ {{ round }}
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Evaluation Items -->
          <div v-if="currentEvaluationDetails && currentEvaluationDetails.items" class="evaluation-items">
            <h4>รายละเอียดการประเมิน</h4>
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
                  <tr v-for="(item, index) in currentEvaluationDetails.items" :key="index" class="evaluation-row">
                    <!-- ลำดับ -->
                    <td class="col-order">
                      <div class="order-number">{{ item.order || (index + 1) }}</div>
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
                        <div class="checkbox-custom" :class="{ 'checked': item.status === 'ผ่าน' }">
                          <i v-if="item.status === 'ผ่าน'" class="fas fa-check"></i>
                        </div>
                      </div>
                    </td>
                    
                    <!-- ไม่ผ่าน -->
                    <td class="col-fail">
                      <div class="checkbox-container">
                        <div class="checkbox-custom" :class="{ 'checked': item.status === 'ไม่ผ่าน' }">
                          <i v-if="item.status === 'ไม่ผ่าน'" class="fas fa-times"></i>
                        </div>
                      </div>
                    </td>
                    
                    <!-- เสนอแนะ -->
                    <td class="col-suggestion">
                      <div class="suggestion-container">
                        <div v-if="item.suggestion" class="suggestion-text">
                          {{ item.suggestion }}
                        </div>
                        <div v-else class="suggestion-placeholder-normal">
                          ไม่มีข้อเสนอแนะ
                        </div>
                      </div>
                    </td>
                    
                    <!-- แนบไฟล์ -->
                    <td class="col-file">
                      <div class="file-container">
                        <a v-if="item.driveLink" :href="item.driveLink" target="_blank" class="file-link">
                          <i class="fas fa-external-link-alt"></i>
                          เปิดลิงก์
                        </a>
                        <div v-else class="file-placeholder-normal">
                          ไม่มีไฟล์
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div v-else class="no-items">
            <i class="fas fa-info-circle"></i>
            <p>ไม่พบข้อมูลการประเมินสำหรับรอบนี้</p>
          </div>
        </div>
      </div>
    </div>
  </layout-admin>
</template>

<script>
import LayoutAdmin from '../../components/LayoutAdmin.vue'
import EvaluationModal from '../../components/EvaluationModal.vue'
import axios from 'axios'
import { formatCustomId } from '../../utils/customIdUtils.js'

export default {
  components: { LayoutAdmin, EvaluationModal },
  data() {
    return {
      activeMenu: 'control',
      selectedCanteen: '',
      selectedCategory: '',
      selectedYear: '',
      selectedMonth: '',
      selectedEvaluation: '',
      selectedStatus: '',
      selectedHistoryStatus: '',
      selectedScoreSort: '',
      searchQuery: '',
      shops: [],
      filteredShops: [],
      evaluationSystemEnabled: true,
      showEvaluationModal: false,
      selectedShop: null,
      newTopic: {
        title: '',
        description: '',
        maxScore: 100
      },
      evaluationTopics: [],
      isLoading: false,
      // Pagination
      currentPage: 1,
      itemsPerPage: 30,
      // Toggle for expired shops visibility
      showExpiredShops: false,
      // Evaluation Details Modal
      showEvaluationDetailsModal: false,
      currentEvaluationDetails: null,
      selectedRound: 1,
      availableRounds: [],
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
      monthNames: [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ],
      availableYears: [2023, 2024, 2025]
    }
  },
  computed: {
    totalRevenue() {
      // คำนวณรายได้เฉพาะร้านค้าที่ยังเปิดบริการ (ไม่หมดสัญญา)
      const currentDate = new Date()
      const activeShops = this.filteredShops.filter(shop => {
        const contractEndDate = new Date(shop.contractEndDate)
        return contractEndDate >= currentDate
      })
      return activeShops.reduce((sum, shop) => sum + (shop.revenue || 0), 0)
    },
    averageRevenue() {
      // คำนวณรายได้เฉลี่ยเฉพาะร้านค้าที่ยังเปิดบริการ
      const currentDate = new Date()
      const activeShops = this.filteredShops.filter(shop => {
        const contractEndDate = new Date(shop.contractEndDate)
        return contractEndDate >= currentDate
      })
      return activeShops.length > 0 ? this.totalRevenue / activeShops.length : 0
    },
    totalShops() {
      // แสดงเฉพาะร้านค้าที่ยังเปิดบริการ (ไม่หมดสัญญา)
      const currentDate = new Date()
      return this.filteredShops.filter(shop => {
        const contractEndDate = new Date(shop.contractEndDate)
        return contractEndDate >= currentDate
      }).length
    },
    totalEvaluationTopics() {
      return this.evaluationTopics.length
    },
    totalMaxScore() {
      return this.evaluationTopics.reduce((sum, topic) => sum + (topic.maxScore || 0), 0)
    },
    passedShopsCount() {
      // นับจำนวนร้านค้าที่ผ่านการประเมิน
      return this.filteredShops.filter(shop => {
        const status = this.getEvaluationStatusText(shop)
        return status === 'ผ่าน'
      }).length
    },
    failedShopsCount() {
      // นับจำนวนร้านค้าที่ไม่ผ่านการประเมิน
      return this.filteredShops.filter(shop => {
        const status = this.getEvaluationStatusText(shop)
        return status === 'ไม่ผ่าน'
      }).length
    },
    
    // เรียงลำดับร้านค้าตามโรงอาหาร (เฉพาะเมื่อไม่ได้เรียงตามคะแนน)
    sortedFilteredShops() {
      // ถ้ามีการเรียงตามคะแนนแล้ว ให้ใช้ filteredShops ที่เรียงแล้ว
      if (this.selectedScoreSort && (this.activeMenu === 'evaluation' || this.activeMenu === 'history')) {
        return this.filteredShops
      }
      
      // ถ้าไม่มีการเรียงตามคะแนน ให้เรียงตามโรงอาหารและชื่อร้านค้า
      return this.filteredShops.sort((a, b) => {
        // เรียงตาม canteenId ก่อน แล้วตามชื่อร้านค้า
        if (a.canteenId !== b.canteenId) {
          return a.canteenId - b.canteenId
        }
        return a.name.localeCompare(b.name, 'th')
      })
    },
    
    // Pagination computed properties
    paginatedShops() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.sortedFilteredShops.slice(start, end)
    },
    totalPages() {
      return Math.ceil(this.filteredShops.length / this.itemsPerPage)
    },
    startItem() {
      return (this.currentPage - 1) * this.itemsPerPage + 1
    },
    endItem() {
      const end = this.currentPage * this.itemsPerPage
      return Math.min(end, this.filteredShops.length)
    },
    visiblePages() {
      const pages = []
      const maxVisible = 5
      let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2))
      let end = Math.min(this.totalPages, start + maxVisible - 1)
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      return pages
    },
    
    
  },
  async mounted() {
    await this.loadShops()
    await this.loadEvaluationTopics()
    await this.checkEvaluationSystemStatus()
        this.filteredShops = this.shops
  },
  methods: {
    formatCustomId,
    async setActiveMenu(menu) {
      this.activeMenu = menu
      if (menu === 'control' || menu === 'history' || menu === 'evaluation') {
        // โหลดข้อมูลใหม่เมื่อเปลี่ยนไปหน้า control, history, หรือ evaluation
        await this.loadShops()
        this.filteredShops = this.shops
      }
    },
    
    async loadShops() {
      try {
        this.isLoading = true
        if (this.activeMenu === 'history') {
          // ดึงข้อมูลจาก evaluations collection สำหรับหน้า history
          const response = await axios.get('/api/evaluations/history')
          this.shops = response.data.data || []
          console.log('Evaluations history loaded:', this.shops.length)
        } else if (this.activeMenu === 'control') {
          // ดึงข้อมูลสำหรับหน้า control panel
          const response = await axios.get('/api/evaluations/control-data')
          if (response.data.success) {
            this.shops = response.data.data.shops || []
            console.log('Control data loaded:', this.shops.length)
            
          } else {
            console.error('Error loading control data:', response.data.message)
            this.shops = []
          }
        } else if (this.activeMenu === 'evaluation') {
          // ดึงข้อมูลสำหรับหน้า evaluation
          const response = await axios.get('/api/evaluations/shops')
          if (response.data.success) {
            this.shops = response.data.data || []
            console.log('Evaluation shops loaded:', this.shops.length)
          } else {
            console.error('Error loading evaluation shops:', response.data.message)
            this.shops = []
          }
        } else {
          // ดึงข้อมูลร้านค้าปกติสำหรับหน้าอื่น
          const response = await axios.get('/api/shops?includeExpired=false')
        this.shops = response.data.data || response.data
          console.log('Shops loaded:', this.shops.length)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    async loadEvaluationTopics() {
      try {
        this.isLoading = true
        const response = await axios.get('/api/evaluations/items')
        this.evaluationTopics = response.data || []
      } catch (error) {
        console.error('Error loading evaluation topics:', error)
      } finally {
        this.isLoading = false
      }
    },
    
    async checkEvaluationSystemStatus() {
      try {
        const response = await axios.get('/api/evaluations/control/current')
        this.evaluationSystemEnabled = response.data.isEnabled
      } catch (error) {
        console.error('Error checking evaluation system status:', error)
        this.evaluationSystemEnabled = true
      }
    },
    
    onFilterChange() {
      this.filteredShops = this.shops.filter(shop => {
        const canteenMatch = !this.selectedCanteen || shop.canteenId == this.selectedCanteen
        const categoryMatch = !this.selectedCategory || shop.type === this.selectedCategory
        const searchMatch = !this.searchQuery || 
          shop.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          shop.type.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          this.getCanteenName(shop.canteenId).toLowerCase().includes(this.searchQuery.toLowerCase())
        
        // Add filter logic based on active menu
        let statusMatch = true
        
        if (this.activeMenu === 'control') {
          // สำหรับหน้า ตัวควบคุมแบบประเมิน - ใช้ selectedStatus
          if (this.selectedStatus === 'completed') {
            // แสดงร้านค้าที่ประเมินเสร็จแล้ว
            statusMatch = this.getEvaluationStatusText(shop) === 'เสร็จแล้ว'
          } else if (this.selectedStatus === 'pending') {
            // แสดงร้านค้าที่ยังรอดำเนินการ
            statusMatch = this.getEvaluationStatusText(shop) === 'รอดำเนินการ'
          }
        } else if (this.activeMenu === 'evaluation') {
          // สำหรับหน้า ทำแบบประเมิน - ใช้ selectedEvaluation
          if (this.selectedEvaluation === 'evaluate') {
            // แสดงร้านค้าที่ยังไม่ได้ประเมิน (แสดงปุ่มประเมิน)
            statusMatch = !this.isShopEvaluated(shop)
          } else if (this.selectedEvaluation === 'edit') {
            // แสดงร้านค้าที่ประเมินแล้ว (แสดงปุ่มแก้ไข)
            statusMatch = this.isShopEvaluated(shop)
          }
        } else if (this.activeMenu === 'history') {
          // สำหรับหน้า ประวัติย้อนหลัง - ใช้ selectedHistoryStatus
          if (this.selectedHistoryStatus === 'passed') {
            // แสดงร้านค้าที่ผ่านการประเมิน
            statusMatch = shop.finalStatus === 'ผ่าน'
          } else if (this.selectedHistoryStatus === 'failed') {
            // แสดงร้านค้าที่ไม่ผ่านการประเมิน
            statusMatch = shop.finalStatus === 'ไม่ผ่าน'
          }
        }
        
        return canteenMatch && categoryMatch && searchMatch && statusMatch
      })
      
      // Apply score sorting if selected
      if (this.selectedScoreSort && (this.activeMenu === 'evaluation' || this.activeMenu === 'history')) {
        this.filteredShops.sort((a, b) => {
          let scoreA, scoreB
          
          if (this.activeMenu === 'history') {
            // สำหรับหน้า ประวัติย้อนหลัง ใช้ totalScore โดยตรง
            scoreA = a.totalScore || 0
            scoreB = b.totalScore || 0
          } else {
            // สำหรับหน้า ทำแบบประเมิน ใช้ getTotalScore
            scoreA = this.getTotalScore(a) || 0
            scoreB = this.getTotalScore(b) || 0
          }
          
          if (this.selectedScoreSort === 'asc') {
            return scoreA - scoreB // น้อยสุดไปมากสุด
          } else if (this.selectedScoreSort === 'desc') {
            return scoreB - scoreA // มากสุดไปน้อยสุด
          }
          return 0
        })
      }
      
      // Reset to first page when filtering
      this.currentPage = 1
    },

    // Pagination methods
    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },

    onItemsPerPageChange() {
      this.currentPage = 1
    },
    
    async resetScores() {
      if (confirm('คุณแน่ใจหรือไม่ที่จะรีเซ็ตคะแนนทั้งหมด?')) {
        try {
          this.isLoading = true
          await axios.post('/api/shops/reset-all-scores')
          alert('รีเซ็ตคะแนนทั้งหมดเรียบร้อยแล้ว!')
          await this.loadShops()
          this.filteredShops = this.shops
        } catch (error) {
          console.error('Error resetting scores:', error)
          alert('เกิดข้อผิดพลาดในการรีเซ็ตคะแนน')
        } finally {
          this.isLoading = false
        }
      }
    },

    async toggleEvaluationSystem() {
      try {
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()
        
        const response = await axios.post('/api/evaluations/control', {
          month: currentMonth,
          year: currentYear,
          isEvaluationEnabled: this.evaluationSystemEnabled,
          reason: this.evaluationSystemEnabled ? 'เปิดระบบประเมิน' : 'ปิดระบบประเมิน'
        })
        
        alert(`ระบบประเมิน${this.evaluationSystemEnabled ? 'เปิด' : 'ปิด'}เรียบร้อยแล้ว`)
      } catch (error) {
        console.error('Error toggling evaluation system:', error)
        alert('เกิดข้อผิดพลาดในการตั้งค่าระบบประเมิน')
      }
    },
    
    async saveTopic() {
      try {
        this.isLoading = true
        await axios.post('/api/evaluations/items', this.newTopic)
        alert('บันทึกหัวข้อเรียบร้อยแล้ว!')
        this.newTopic = { title: '', description: '', maxScore: 100 }
        await this.loadEvaluationTopics()
      } catch (error) {
        console.error('Error saving topic:', error)
        alert('เกิดข้อผิดพลาดในการบันทึกหัวข้อ')
      } finally {
        this.isLoading = false
      }
    },
    
    async editTopic(topic) {
      try {
        const newTitle = prompt('แก้ไขชื่อหัวข้อ:', topic.title)
        if (newTitle !== null) {
          const newDescription = prompt('แก้ไขคำอธิบาย:', topic.description || '')
          const newMaxScore = prompt('แก้ไขคะแนนเต็ม:', topic.maxScore)
          
          if (newMaxScore) {
            this.isLoading = true
            await axios.put(`/api/evaluations/items/${topic._id}`, {
              title: newTitle,
              description: newDescription || '',
              maxScore: parseInt(newMaxScore)
            })
            alert('แก้ไขหัวข้อเรียบร้อยแล้ว!')
            await this.loadEvaluationTopics()
          }
        }
      } catch (error) {
        console.error('Error editing topic:', error)
        alert('เกิดข้อผิดพลาดในการแก้ไขหัวข้อ')
      } finally {
        this.isLoading = false
      }
    },
    
    async deleteTopic(topic) {
      if (confirm(`คุณแน่ใจหรือไม่ที่จะลบหัวข้อ "${topic.title}"?`)) {
        try {
          this.isLoading = true
          await axios.delete(`/api/evaluations/items/${topic._id}`)
          alert('ลบหัวข้อเรียบร้อยแล้ว!')
          await this.loadEvaluationTopics()
        } catch (error) {
          console.error('Error deleting topic:', error)
          alert('เกิดข้อผิดพลาดในการลบหัวข้อ')
        } finally {
          this.isLoading = false
        }
      }
    },
    
    openEvaluationModal(shop) {
      this.selectedShop = shop
      this.showEvaluationModal = true
    },
    
    closeEvaluationModal() {
      this.showEvaluationModal = false
      this.selectedShop = null
    },
    
    async onEvaluationSaved() {
      this.isLoading = true
      await this.loadShops()
      this.filteredShops = this.shops
      this.isLoading = false
    },
    
    exportData() {
      try {
        // กำหนดข้อมูลที่จะ export
        let dataToExport = [];
        let filename = '';
        
        if (this.activeMenu === 'history') {
          // Export ข้อมูลประวัติการประเมิน
          dataToExport = this.filteredShops.map(evaluation => ({
            'Shop ID': evaluation.customId || evaluation.shopId?.customId || evaluation.shopId?._id || '-',
            'ชื่อร้านค้า': evaluation.shopName || evaluation.shopId?.name || '-',
            'หมวดหมู่': this.getCategoryName(evaluation.type),
            'โรงอาหาร': evaluation.canteenName || '-',
            'รายได้': evaluation.revenue || 0,
            'คะแนนรวม': evaluation.totalScore || 0,
            'สถานะ': evaluation.finalStatus || 'รอดำเนินการ',
            'รอบประเมิน': `รอบที่ ${evaluation.evaluationRound || 1}`,
            'เดือน/ปี': `${this.getMonthName(evaluation.evaluationMonth)} ${evaluation.evaluationYear}`
          }));
          filename = `evaluation-history-${new Date().toISOString().split('T')[0]}.csv`;
        } else {
          // Export ข้อมูลร้านค้าปัจจุบัน
          dataToExport = this.filteredShops.map(shop => ({
            'Shop ID': shop.customId || shop._id,
            'ชื่อร้านค้า': shop.name,
            'หมวดหมู่': this.getCategoryName(shop.type),
            'โรงอาหาร': this.getCanteenName(shop.canteenId),
            'รายได้': shop.revenue || 0,
            'สถานะ': this.getStatusText(shop),
            'คะแนน': shop.score || 0,
            'วันหมดสัญญา': this.formatDate(shop.contractEndDate)
          }));
          filename = `ranking-data-${new Date().toISOString().split('T')[0]}.csv`;
        }
        
        if (dataToExport.length === 0) {
          alert('ไม่มีข้อมูลให้ export');
          return;
        }
        
        // สร้าง CSV content
        const headers = Object.keys(dataToExport[0]);
        const csvContent = [
          headers.join(','),
          ...dataToExport.map(row => 
            headers.map(header => {
              const value = row[header];
              // Escape commas and quotes in CSV
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }).join(',')
          )
        ].join('\n');
        
        // สร้างและดาวน์โหลดไฟล์
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`Export successful: ${dataToExport.length} records to ${filename}`);
      } catch (error) {
        console.error('Error exporting data:', error);
        alert('เกิดข้อผิดพลาดในการ export ข้อมูล');
      }
    },

    async exportExcel() {
      try {
        // ตรวจสอบว่ามี XLSX library หรือไม่
        if (typeof XLSX === 'undefined') {
          alert('ไม่สามารถ export Excel ได้ กรุณาใช้ Export CSV แทน');
          return;
        }

        // กำหนดข้อมูลที่จะ export (เหมือนกับ exportData)
        let dataToExport = [];
        let filename = '';
        
        if (this.activeMenu === 'history') {
          dataToExport = this.filteredShops.map(evaluation => ({
            'Shop ID': evaluation.customId || evaluation.shopId?.customId || evaluation.shopId?._id || '-',
            'ชื่อร้านค้า': evaluation.shopName || evaluation.shopId?.name || '-',
            'หมวดหมู่': this.getCategoryName(evaluation.type),
            'โรงอาหาร': evaluation.canteenName || '-',
            'รายได้': evaluation.revenue || 0,
            'คะแนนรวม': evaluation.totalScore || 0,
            'สถานะ': evaluation.finalStatus || 'รอดำเนินการ',
            'เดือน/ปี': `${this.getMonthName(evaluation.evaluationMonth)} ${evaluation.evaluationYear}`
          }));
          filename = `evaluation-history-${new Date().toISOString().split('T')[0]}.xlsx`;
        } else {
          dataToExport = this.filteredShops.map(shop => ({
            'Shop ID': shop.customId || shop._id,
            'ชื่อร้านค้า': shop.name,
            'หมวดหมู่': this.getCategoryName(shop.type),
            'โรงอาหาร': this.getCanteenName(shop.canteenId),
            'รายได้': shop.revenue || 0,
            'สถานะ': this.getStatusText(shop),
            'คะแนน': shop.score || 0,
            'วันหมดสัญญา': this.formatDate(shop.contractEndDate)
          }));
          filename = `ranking-data-${new Date().toISOString().split('T')[0]}.xlsx`;
        }
        
        if (dataToExport.length === 0) {
          alert('ไม่มีข้อมูลให้ export');
          return;
        }
        
        // สร้าง Excel workbook
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        
        // เพิ่ม worksheet ลงใน workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ranking Data');
        
        // สร้างและดาวน์โหลดไฟล์
        XLSX.writeFile(workbook, filename);
        
        console.log(`Excel export successful: ${dataToExport.length} records to ${filename}`);
      } catch (error) {
        console.error('Error exporting Excel:', error);
        alert('เกิดข้อผิดพลาดในการ export Excel กรุณาใช้ Export CSV แทน');
      }
    },
    
    getCanteenName(canteenId) {
      return this.canteenMapping[canteenId] || `โรงอาหาร ${canteenId}`
    },
    
    getCategoryName(type) {
      const categoryMapping = {
        'food': 'อาหาร',
        'drink': 'เครื่องดื่ม',
        'dessert': 'ของหวาน',
        'other': 'อื่นๆ'
      }
      return categoryMapping[type] || type
    },
    
    getStatusText(shop) {
      // ตรวจสอบว่ามีการประเมินหรือไม่
      if (!shop.evaluationCompleted || !shop.evaluationDate) {
        return 'รอดำเนินการ'
      }
      
      // ตรวจสอบว่าเป็นการประเมินในเดือนปัจจุบันหรือไม่
      const currentDate = new Date()
      const currentMonth = currentDate.getMonth() + 1
      const currentYear = currentDate.getFullYear()
      
      const evaluationDate = new Date(shop.evaluationDate)
      if (evaluationDate.getMonth() + 1 === currentMonth && evaluationDate.getFullYear() === currentYear) {
        // ใช้คะแนนในการกำหนดสถานะ
        const maxPossibleScore = this.evaluationTopics.reduce((sum, topic) => sum + topic.maxScore, 0)
        const earnedScore = shop.score || 0
        const percentage = maxPossibleScore > 0 ? (earnedScore / maxPossibleScore) * 100 : 0
        
        return percentage >= 50 ? 'ผ่าน' : 'ไม่ผ่าน'
      }
      
      return 'รอดำเนินการ'
    },
    
    getStatusClass(shop) {
      const statusText = this.getStatusText(shop)
      if (statusText === 'ผ่าน') return 'passed'
      if (statusText === 'ไม่ผ่าน') return 'failed'
      return 'pending' // สีเหลืองสำหรับ รอดำเนินการ
    },
    
    getEvaluationStatusText(shop) {
      // สำหรับหน้า "ตัวควบคุมแบบประเมิน" ใช้ evaluationSent field
      if (this.activeMenu === 'control') {
        // ตรวจสอบจาก evaluationSent field
        if (shop.evaluationSent !== undefined) {
          return shop.evaluationSent ? 'เสร็จแล้ว' : 'รอดำเนินการ'
        } else if (shop.evaluation && shop.evaluation.evaluationSent !== undefined) {
          return shop.evaluation.evaluationSent ? 'เสร็จแล้ว' : 'รอดำเนินการ'
        }
        return 'รอดำเนินการ'
      }
      
      // สำหรับหน้า "ประวัติย้อนหลัง" ใช้ finalStatus โดยตรง
      if (this.activeMenu === 'history') {
        return shop.finalStatus || 'รอดำเนินการ'
      }
      
      // สำหรับหน้าอื่นๆ ใช้ข้อมูลจาก evaluation collection
      if (shop.evaluation && shop.evaluation.finalStatus) {
        return shop.evaluation.finalStatus
      } else if (shop.evaluationStatus) {
        return shop.evaluationStatus
      } else if (shop.hasEvaluation === false) {
        return 'รอดำเนินการ'
      }
      
      return 'รอดำเนินการ'
    },
    
    getEvaluationStatusClass(shop) {
      const status = this.getEvaluationStatusText(shop)
      
      // สำหรับหน้า "ตัวควบคุมแบบประเมิน"
      if (this.activeMenu === 'control') {
        if (status === 'เสร็จแล้ว') return 'passed' // สีเขียวสำหรับ เสร็จแล้ว
        return 'pending' // สีเหลืองสำหรับ รอดำเนินการ
      }
      
      // สำหรับหน้า "ประวัติย้อนหลัง" และหน้าอื่นๆ
      if (status === 'ผ่าน') return 'passed'
      if (status === 'ไม่ผ่าน') return 'failed'
      return 'pending' // สีเหลืองสำหรับ รอดำเนินการ
    },
    
    getTotalScore(shop) {
      // สำหรับหน้า "ประวัติย้อนหลัง" ใช้ totalScore โดยตรง
      if (this.activeMenu === 'history') {
        return shop.totalScore || 0
      }
      
      // สำหรับหน้าอื่นๆ ใช้ข้อมูลจาก evaluation collection
      if (shop.evaluation && shop.evaluation.totalScore !== undefined) {
        return shop.evaluation.totalScore
      } else if (shop.evaluationScore !== undefined) {
        return shop.evaluationScore
      } else if (shop.score !== undefined) {
        return shop.score
      }
      
      return 0
    },
    
    getCurrentMonthName() {
      return this.monthNames[new Date().getMonth()]
    },
    
    formatCurrency(amount) {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
      }).format(amount)
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },

    isShopEvaluated(shop) {
      // สำหรับหน้า "ทำแบบประเมิน" ใช้ evaluationSent
      if (this.activeMenu === 'evaluation') {
        if (shop.evaluationSent === true) {
          return true
        } else if (shop.evaluation && shop.evaluation.evaluationSent === true) {
          return true
        }
        return false
      }
      
      // สำหรับหน้าอื่นๆ ใช้ข้อมูลจาก evaluation collection
      if (shop.evaluation && shop.evaluation.finalStatus) {
        return shop.evaluation.finalStatus !== 'รอดำเนินการ'
      } else if (shop.hasEvaluation) {
        return shop.hasEvaluation
      } else if (shop.evaluationCompleted) {
        return shop.evaluationCompleted
      }
      
      return false
    },


    toggleExpiredShops() {
      this.showExpiredShops = !this.showExpiredShops
    },

    getMonthName(month) {
      return this.monthNames[month - 1] || month
    },

    // Evaluation Details Modal Methods
    async openEvaluationDetailsModal(evaluation) {
      try {
        console.log('Opening evaluation details modal for:', evaluation)
        
        this.selectedEvaluation = evaluation
        this.showEvaluationDetailsModal = true
        
        // ตั้งค่ารอบประเมินให้ตรงกับข้อมูลที่มี
        this.availableRounds = [evaluation.evaluationRound || 1]
        this.selectedRound = evaluation.evaluationRound || 1
        
        // โหลดข้อมูลการประเมินทันที
        await this.loadEvaluationDetails()
        
        // ลองดึงข้อมูลรอบประเมินอื่นๆ (ถ้ามี)
        try {
          await this.loadAvailableRounds(evaluation)
        } catch (error) {
          console.log('Could not load additional rounds, using current round only')
        }
      } catch (error) {
        console.error('Error opening evaluation details modal:', error)
        alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message)
      }
    },

    closeEvaluationDetailsModal() {
      this.showEvaluationDetailsModal = false
      this.selectedEvaluation = null
      this.currentEvaluationDetails = null
      this.selectedRound = 1
      this.availableRounds = []
    },

    async loadAvailableRounds(evaluation) {
      try {
        console.log('Loading available rounds for evaluation:', evaluation)
        
        // ใช้ evaluation ID โดยตรง
        const evaluationId = evaluation._id
        
        const response = await axios.get(`/api/evaluations/${evaluationId}/rounds`)
        
        console.log('Available rounds response:', response.data)
        
        if (response.data.success) {
          this.availableRounds = response.data.rounds || []
        } else {
          this.availableRounds = [evaluation.evaluationRound || 1]
        }
      } catch (error) {
        console.error('Error loading available rounds:', error)
        console.error('Error details:', error.response?.data)
        console.log('Using fallback round:', evaluation.evaluationRound || 1)
        this.availableRounds = [evaluation.evaluationRound || 1]
      }
    },

    async loadEvaluationDetails() {
      try {
        if (!this.selectedEvaluation) {
          console.log('No selected evaluation')
          return
        }
        
        const evaluationId = this.selectedEvaluation._id
        
        console.log('Loading evaluation details for:', {
          evaluationId: evaluationId,
          selectedRound: this.selectedRound,
          originalEvaluation: this.selectedEvaluation
        })
        
        let response
        
        // ถ้าเป็นรอบเดียวกับข้อมูลเดิม ให้ใช้ API ง่าย
        if (this.selectedRound === (this.selectedEvaluation.evaluationRound || 1)) {
          response = await axios.get(`/api/evaluations/details/${evaluationId}`)
        } else {
          // ถ้าเป็นรอบอื่น ให้ใช้ API ที่ระบุรอบ
          response = await axios.get(`/api/evaluations/details/${evaluationId}/round/${this.selectedRound}`)
        }
        
        console.log('Evaluation details response:', response.data)
        
        if (response.data.success) {
          this.currentEvaluationDetails = response.data.evaluation
        } else {
          console.error('Error loading evaluation details:', response.data.message)
          this.currentEvaluationDetails = null
        }
      } catch (error) {
        console.error('Error loading evaluation details:', error)
        console.error('Error details:', error.response?.data)
        this.currentEvaluationDetails = null
        
        // แสดงข้อความแจ้งเตือนผู้ใช้
        if (error.response?.status === 404) {
          alert('ไม่พบข้อมูลการประเมินสำหรับรอบที่ ' + this.selectedRound)
        } else {
          alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + (error.response?.data?.message || error.message))
        }
      }
    },

    getItemStatusClass(status) {
      if (status === 'ผ่าน') return 'passed'
      if (status === 'ไม่ผ่าน') return 'failed'
      return 'pending'
    },

    getMaxPossibleScore() {
      if (!this.currentEvaluationDetails || !this.currentEvaluationDetails.items) return 0
      return this.currentEvaluationDetails.items.reduce((sum, item) => sum + (item.maxScore || 0), 0)
    },

    // Import Excel methods

    triggerFileSelect() {
      this.$refs.fileInput.click()
    },

    async handleFileSelect(event) {
      const file = event.target.files[0]
      if (!file) return

      // ตรวจสอบประเภทไฟล์
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv' // .csv
      ]
      
      if (!allowedTypes.includes(file.type)) {
        alert('กรุณาเลือกไฟล์ Excel (.xlsx, .xls) หรือ CSV (.csv) เท่านั้น')
        return
      }

      // ตรวจสอบขนาดไฟล์ (ไม่เกิน 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('ขนาดไฟล์ไม่ควรเกิน 10MB')
        return
      }

      try {
        await this.importExcel(file)
      } catch (error) {
        console.error('Error importing file:', error)
        alert('เกิดข้อผิดพลาดในการ import ไฟล์')
      } finally {
        // รีเซ็ต input file
        event.target.value = ''
      }
    },

    async importExcel(file) {
      try {
        // เพิ่มการ confirm ก่อนอัปโหลด
        if (!confirm('คุณต้องการยืนยันการอัปโหลดไฟล์ Excel หรือไม่?')) {
          return
        }
        
        this.isLoading = true
        
        // สร้าง FormData สำหรับส่งไฟล์
        const formData = new FormData()
        formData.append('file', file)
        
        // ส่งไฟล์ไปยัง backend
        const response = await axios.post('/api/shops/import-revenue', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        if (response.data.success) {
          alert(`Import สำเร็จ! อัปเดตรายได้ ${response.data.updatedCount || 0} ร้านค้า`)
          // โหลดข้อมูลใหม่
          await this.loadShops()
          this.filteredShops = this.shops
        } else {
          alert(`Import ไม่สำเร็จ: ${response.data.message || 'เกิดข้อผิดพลาด'}`)
        }
        
      } catch (error) {
        console.error('Error importing Excel:', error)
        
        if (error.response?.data?.message) {
          alert(`Import ไม่สำเร็จ: ${error.response.data.message}`)
        } else if (error.response?.status === 413) {
          alert('ไฟล์ใหญ่เกินไป กรุณาเลือกไฟล์ที่เล็กกว่า')
        } else {
          alert('เกิดข้อผิดพลาดในการ import ไฟล์ กรุณาลองใหม่อีกครั้ง')
        }
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>

<style scoped>
/* Layout */
.ranking-layout {
  margin: 0 !important;
  padding: 0 !important;
}

.ranking-layout .admin-main {
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  display: flex;
  min-height: 100vh;
}

.ranking-container {
  display: flex;
  min-height: 100vh;
  background: #f5f6fa;
  width: 100%;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: #ffffff;
  color: #374151;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-shadow: 1px 0 3px rgba(0, 0, 0, 0.1);
  border-right: 1px solid #e5e7eb;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #e5e7eb;
  text-align: center;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: #111827;
}

.sidebar-menu {
  flex: 1;
  padding: 15px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 6px;
  margin: 0 10px 6px;
  color: #6b7280;
}

.menu-item:hover {
  background: #f9fafb;
  color: #374151;
  transform: translateX(2px);
}

.menu-item.active {
  background: #f3f4f6;
  color: #111827;
  font-weight: 500;
}

.menu-item i {
  width: 20px;
  margin-right: 12px;
  font-size: 16px;
}

.menu-item span {
  flex: 1;
  font-size: 14px;
}

/* Status indicator (sidebar only) */
.menu-item .status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-left: 10px;
}

.status-indicator.enabled {
  background: #10b981;
}

.status-indicator.disabled {
  background: #ef4444;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: 25px;
  background: #ffffff;
}

/* Header */
.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #e9ecef;
}

.content-header h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
}

.import-buttons {
  display: flex;
  gap: 10px;
}


.import-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.import-btn:hover {
  background: linear-gradient(135deg, #20c997 0%, #28a745 100%);
}

.export-btn {
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.export-btn:hover {
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
}

/* Filters */
.filters-section {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 120px;
}

.filter-group label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.filter-group select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  width: 100%;
  min-width: 130px;
}

/* Search Group */
.search-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 2;
  min-width: 250px;
}

.search-group label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
}

.search-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: #999;
  font-size: 14px;
  z-index: 1;
}

.search-input {
  width: 100%;
  padding: 8px 10px 8px 35px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
  background: white;
  color: #333;
}

.search-input:focus {
  outline: none;
  border-color: #007bff;
}

.search-input::placeholder {
  color: #999;
}


.reset-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  min-width: 190px;
  justify-content: center;
}

.reset-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.reset-btn i {
  font-size: 12px;
}


/* Stats */
.stats-section {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  flex-wrap: wrap;
}

.stat-item {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-icon {
  font-size: 24px;
  color: #3b82f6;
  margin-bottom: 5px;
}

.stat-icon .fa-check-circle {
  color: #10b981;
}

.stat-icon .fa-times-circle {
  color: #ef4444;
}

.stat-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-top: 5px;
}

/* Table */
.data-table {
  background: white;
  border-radius: 8px;
  overflow-x: auto;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  border: 1px solid #e5e7eb;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 80px 120px 2fr 1fr 1.5fr 1fr 1fr 1fr 1fr;
  font-size: 14px;
  gap: 0;
}

/* Grid layout for evaluation menu (10 columns) */
.table-header:has(.header-cell:nth-child(10)),
.table-row:has(.cell:nth-child(10)) {
  grid-template-columns: 80px 120px 2fr 1fr 1.5fr 1fr 1fr 1fr 1fr 1fr;
}

/* Grid layout for history menu (11 columns) */
.table-header:has(.header-cell:nth-child(11):last-child),
.table-row:has(.cell:nth-child(11):last-child) {
  grid-template-columns: 80px 120px 2fr 1fr 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr;
}

.table-header {
  background: #f9fafb;
  font-weight: 600;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
  border-radius: 8px 8px 0 0;
}

.header-cell,
.cell {
  padding: 8px 12px;
  text-align: left;
  border-right: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
}

.header-cell:last-child,
.cell:last-child {
  border-right: none;
}

.header-cell {
  color: #374151;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.cell {
  color: #374151;
  font-size: 12px;
  font-weight: 400;
}

.table-row {
  border-bottom: 1px solid #e5e7eb;
  transition: all 0.2s ease;
}

.table-row:hover {
  background: #f9fafb;
}

.table-row:last-child {
  border-bottom: none;
  border-radius: 0 0 8px 8px;
}

.status-badge {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  min-width: 50px;
  text-align: center;
}

.status-badge.passed { background: #dcfce7; color: #166534; }
.status-badge.failed { background: #fee2e2; color: #991b1b; }
.status-badge.pending { background: #fef3c7; color: #92400e; }
.status-badge.completed { background: #dbeafe; color: #1e40af; }
.status-badge.expired { background: #f3f4f6; color: #6b7280; }

.round-badge {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
  min-width: 60px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(139, 92, 246, 0.3);
}

.details-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

.details-btn:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);
}

.details-btn i {
  font-size: 10px;
}

.update-type-badge {
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 500;
  min-width: 50px;
  text-align: center;
}

.update-type-badge.revenue { background: #dbeafe; color: #1e40af; }
.update-type-badge.evaluation { background: #fef3c7; color: #92400e; }
.update-type-badge.both { background: #f3e8ff; color: #7c3aed; }
.update-type-badge.default { background: #f3f4f6; color: #6b7280; }

.evaluate-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(40, 167, 69, 0.3);
  letter-spacing: 0.3px;
}

.evaluate-btn:hover:not(.disabled) {
  background: linear-gradient(135deg, #20c997 0%, #28a745 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.4);
}

.evaluate-btn.disabled {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  cursor: not-allowed;
  opacity: 0.6;
  box-shadow: none;
}

.evaluate-btn.edit-mode {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.evaluate-btn.edit-mode:hover:not(.disabled) {
  background: linear-gradient(135deg, #c82333 0%, #a71e2a 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.4);
}

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.pagination-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #374151;
}

.items-per-page-select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  background: white;
}

.pagination-range {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.pagination-buttons {
  display: flex;
  gap: 4px;
}

.pagination-btn {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #dc2626;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-btn.active {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.pagination-btn:disabled {
  background: #f9fafb;
  color: #9ca3af;
  border-color: #e5e7eb;
  cursor: not-allowed;
}

/* Control Switch in Filters */
.control-container {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 0;
  flex-wrap: wrap;
  width: 100%;
}

.control-switch-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch {
  position: relative;
  display: inline-block;
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
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: #28a745;
}

input:checked + .slider:before {
  transform: translateX(22px);
}

.switch-text {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  min-width: 120px;
}

/* History Section */
.history-section {
  background: white;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  overflow: hidden;
}

.section-header {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px 25px;
  border-bottom: 2px solid #e9ecef;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.status-indicator.active {
  background-color: #28a745;
  box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.2);
}

.status-indicator.inactive {
  background-color: #dc3545;
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.2);
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.shop-count {
  background: #007bff;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.toggle-btn {
  background: linear-gradient(135deg, #6c757d 0%, #5a6268 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(108, 117, 125, 0.3);
}

.toggle-btn:hover {
  background: linear-gradient(135deg, #5a6268 0%, #495057 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.4);
}

.toggle-btn.active {
  background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
  box-shadow: 0 2px 4px rgba(220, 53, 69, 0.3);
}

.toggle-btn.active:hover {
  background: linear-gradient(135deg, #c82333 0%, #a71e2a 100%);
  box-shadow: 0 4px 8px rgba(220, 53, 69, 0.4);
}

.toggle-btn i {
  font-size: 12px;
}



.expired-row {
  background-color: #f8f9fa;
  opacity: 0.8;
}

.expired-row:hover {
  background-color: #e9ecef;
}

.no-data-message {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  background: #f8f9fa;
  border-radius: 6px;
  margin: 20px;
}

.no-data-message i {
  font-size: 2rem;
  margin-bottom: 10px;
  color: #adb5bd;
  display: block;
}

.no-data-message p {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

/* Panels */
.topic-panel,
.topics-list {
  background: white;
  border-radius: 6px;
  padding: 20px;
  margin-top: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}


.panel-header {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #e9ecef;
}

.panel-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.4rem;
  font-weight: 600;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  height: 80px;
  resize: vertical;
}

.save-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn:hover {
  background: linear-gradient(135deg, #20c997 0%, #28a745 100%);
  transform: translateY(-1px);
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.topic-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.topic-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.topic-content {
  flex: 1;
}

.topic-card h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.2rem;
  font-weight: 600;
}

.topic-description {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.topic-description.no-description {
  color: #ffc107;
  background: #fff3cd;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 4px solid #ffc107;
  font-size: 13px;
  font-weight: 500;
}

.topic-description.no-description i {
  margin-right: 6px;
}

.topic-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: auto;
  padding-top: 15px;
  border-top: 1px solid #e9ecef;
}

.topic-meta span {
  color: #28a745;
  font-weight: 600;
  font-size: 14px;
}

.topic-actions {
  display: flex;
  gap: 8px;
}

.edit-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.edit-btn {
  background: #007bff;
  color: white;
}

.edit-btn:hover {
  background: #0056b3;
}

.add-description-btn {
  background: #ffc107 !important;
  color: #212529 !important;
}

.add-description-btn:hover {
  background: #e0a800 !important;
}

.delete-btn {
  background: #dc3545;
  color: white;
}

.delete-btn:hover {
  background: #c82333;
}


/* Loading Spinner */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border: 1px solid #e9ecef;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #dc3545;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin: 0;
  color: #666;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .ranking-container {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    min-height: auto;
  }

  .filters-section {
    flex-direction: column;
  }

  .stats-section {
    flex-direction: column;
  }

  .table-header,
  .table-row {
    grid-template-columns: 60px 100px 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr;
    font-size: 12px;
  }

  /* Mobile grid layout for evaluation menu (10 columns) */
  .table-header:has(.header-cell:nth-child(10)),
  .table-row:has(.cell:nth-child(10)) {
    grid-template-columns: 60px 100px 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  }

  /* Mobile grid layout for history menu (10 columns) */
  .table-header:has(.header-cell:nth-child(10):last-child),
  .table-row:has(.cell:nth-child(10):last-child) {
    grid-template-columns: 60px 100px 1.5fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
  }

  .header-cell,
  .cell {
    padding: 12px 8px;
  }

  .status-badge {
    padding: 6px 12px;
    font-size: 11px;
    min-width: 70px;
  }

  .evaluate-btn {
    padding: 6px 12px;
    font-size: 11px;
  }

  .control-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .control-switch-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .switch-text {
    min-width: auto;
    font-size: 12px;
  }

  .loading-container {
    min-height: 150px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border-width: 3px;
  }

  .loading-text {
    font-size: 14px;
  }

  .section-actions {
    flex-direction: column;
    gap: 10px;
    align-items: flex-end;
  }

  .toggle-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .toggle-btn i {
    font-size: 11px;
  }
}

/* Evaluation Details Modal Styles - Copy from EvaluationModal */
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

.evaluation-details-modal {
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

/* Summary Info Section */
.summary-info-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px 25px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.summary-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.summary-info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.summary-info-label {
  font-size: 14px;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-info-value {
  font-size: 16px;
  color: #2d3748;
  font-weight: 700;
}

.summary-info-value.total-score {
  color: #3498db;
  font-size: 16px;
}

/* Status badge ใน summary */
.summary-info-value .status-badge {
  font-size: 16px !important;
  font-weight: 700 !important;
}

.round-select {
  padding: 8px 12px;
  border: 2px solid #3498db;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  color: #374151;
  min-width: 120px;
  cursor: pointer;
  font-weight: 700;
}

.round-select:focus {
  outline: none;
  border-color: #2980b9;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

/* Evaluation Items */
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

.checkbox-custom.checked {
  background: #10b981;
  border-color: #10b981;
}

.checkbox-custom.checked i {
  color: white;
  font-size: 12px;
}

/* Suggestion and file */
.suggestion-container, .file-container {
  width: 100%;
}

.suggestion-text {
  font-size: 12px;
  color: #374151;
  line-height: 1.5;
  background: #f8f9fa;
  padding: 8px 10px;
  border-radius: 4px;
  border-left: 3px solid #3498db;
}

.suggestion-placeholder {
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
}

.suggestion-placeholder-normal {
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
  font-style: normal;
}

.file-link {
  color: #3498db;
  text-decoration: none;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  background: #eff6ff;
  transition: all 0.2s;
}

.file-link:hover {
  background: #dbeafe;
  color: #2980b9;
}

.file-placeholder {
  font-size: 12px;
  color: #9ca3af;
  font-style: italic;
}

.file-placeholder-normal {
  font-size: 12px;
  color: #6b7280;
  font-weight: 400;
  font-style: normal;
}

/* Summary */
.evaluation-summary {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 20px 25px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-top: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-label {
  font-size: 14px;
  color: #718096;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 16px;
  color: #2d3748;
  font-weight: 700;
}

.total-score {
  color: #3498db;
  font-size: 18px;
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

  .summary-info-grid {
    grid-template-columns: 1fr;
  }
}
</style>


