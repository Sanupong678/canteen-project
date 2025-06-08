<template>
  <LayoutAdmin>
    <div class="canteen-detail">
      <div class="canteen-header">
        <div class="header-actions">
        </div>
      </div>

      <div class="canteen-content">
        <div class="shop-management">
          <div class="shop-header">
            <h2>จัดการโรงอาหารS2</h2>
            <div class="search-container">
              <div class="search-box">
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  class="search-input"
                  placeholder="ค้นหาร้านค้า..."
                >
                <i class="fas fa-search search-icon"></i>
              </div>
              <select v-model="selectedCategory" class="category-select">
                <option value="">ทุกประเภท</option>
                <option value="food">อาหาร</option>
                <option value="drink">เครื่องดื่ม</option>
                <option value="dessert">ของหวาน</option>
                <option value="other">อื่นๆ</option>
              </select>
              <button class="add-btn" @click="showAddShopForm = true">
                <i class="fas fa-plus"></i> เพิ่มร้านค้า
              </button>
            </div>
          </div>

          <div class="shop-list">
            <div v-if="filteredActiveShops.length === 0 && filteredExpiredShops.length === 0" class="empty-state">
              ยังไม่มีร้านค้าในโรงอาหารนี้
            </div>

            <!-- Active Shops Section -->
            <div v-if="filteredActiveShops.length > 0" class="shop-section">
              <h3 class="section-title active-title">ร้านค้าที่มีสัญญา</h3>
              <div class="shop-table">
                <div class="table-header">
                  <div class="header-item">ลำดับ</div>
                  <div class="header-item">ชื่อร้านค้า</div>
                  <div class="header-item">หมวดหมู่</div>
                  <div class="header-item">สถานะ</div>
                  <div class="header-item">การแจ้งเตือน</div>
                  <div class="header-item">รายละเอียด</div>
                  <div class="header-item">แก้ไข</div>
                  <div class="header-item">เปลี่ยนรหัสผ่าน</div>
                </div>

                <div class="shop-row" v-for="(shop, index) in filteredActiveShops" :key="shop.id">
                  <div class="row-item">{{ index + 1 }}</div>
                  <div class="row-item">{{ shop.name }}</div>
                  <div class="row-item">{{ getShopTypeLabel(shop.type) }}</div>
                  <div class="row-item">
                    <span class="status-badge active">
                      <i class="fas fa-clock"></i> เหลือเวลา: {{ calculateRemainingDays(shop) }} วัน
                    </span>
                  </div>
                  <div class="row-item">
                    <span class="notification-link" @click="handleShowNotification(shop)">แจ้งเตือน</span>
                  </div>
                  <div class="row-item">
                    <button class="action-btn details-btn" @click="handleViewDetails(shop)">
                      <i class="fas fa-info-circle"></i>
                    </button>
                  </div>
                  <div class="row-item">
                    <button class="action-btn edit-btn" @click="handleEditShop(shop)">
                      <i class="fas fa-edit"></i>
                    </button>
                  </div>
                  <div class="row-item">
                    <button class="action-btn qr-btn" @click="handleGenerateCredentials(shop)">
                      <i class="fas fa-qrcode"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Expired Shops Section -->
            <div v-if="filteredExpiredShops.length > 0" class="shop-section">
              <h3 class="section-title expired-title">
                <i class="fas fa-exclamation-circle"></i> ร้านค้าที่หมดสัญญา
              </h3>
              <div class="shop-table">
                <div class="table-header">
                  <div class="header-item">ลำดับ</div>
                  <div class="header-item">ชื่อร้านค้า</div>
                  <div class="header-item">หมวดหมู่</div>
                  <div class="header-item">สถานะ</div>
                  <div class="header-item">การแจ้งเตือน</div>
                  <div class="header-item">รายละเอียด</div>
                  <div class="header-item">แก้ไข</div>
                  <div class="header-item">เปลี่ยนรหัสผ่าน</div>
                </div>

                <div class="shop-row expired" v-for="(shop, index) in filteredExpiredShops" :key="shop.id">
                  <div class="row-item">{{ filteredActiveShops.length + index + 1 }}</div>
                  <div class="row-item">{{ shop.name }}</div>
                  <div class="row-item">{{ getShopTypeLabel(shop.type) }}</div>
                  <div class="row-item">
                    <span class="status-badge expired">
                      <i class="fas fa-exclamation-circle"></i> สัญญาหมดอายุ
                    </span>
                  </div>
                  <div class="row-item">
                    <span class="notification-link" @click="handleExpiredNotification(shop)">แจ้งเตือน</span>
                  </div>
                  <div class="row-item">
                    <button class="action-btn details-btn" @click="handleViewDetails(shop)">
                      <i class="fas fa-info-circle"></i>
                    </button>
                  </div>
                  <div class="row-item">
                    <button class="action-btn edit-btn" @click="handleEditShop(shop)">
                      <i class="fas fa-edit"></i>
                    </button>
                  </div>
                  <div class="row-item">
                    <button class="action-btn qr-btn" @click="handleGenerateCredentials(shop)">
                      <i class="fas fa-qrcode"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Shop Form Modal -->
    <div v-if="showAddShopForm" class="modal-overlay" @click="closeShopForm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ shopToEdit ? 'แก้ไขร้านค้า' : 'เพิ่มร้านค้าใหม่' }}</h3>
          <button class="close-btn" @click="closeShopForm">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <ShopForm
          :shop-to-edit="shopToEdit"
          @close="closeShopForm"
          @add-shop="handleAddShop"
        />
      </div>
    </div>

    <!-- Shop Details Modal -->
    <ShopDetailsModal
      v-if="showDetailsModal"
      :shop="selectedShop"
      @close="showDetailsModal = false"
    />

    <!-- QR Code Modal -->
    <PasswordForm
      v-if="showPasswordForm"
      :shop="selectedShop"
      @close="showPasswordForm = false"
      @change-password="handleChangePassword"
    />

    <!-- Notification Modal -->
    <NotificationModal
      v-if="showNotificationModal"
      :shops="s2Shops"
      :selected-shop="selectedShop"
      @close="showNotificationModal = false"
      @send-notification="handleSendNotification"
    />
  </LayoutAdmin>
</template>

<script>
import LayoutAdmin from '@/components/LayoutAdmin.vue'
import ShopForm from '@/components/shop/ShopForm.vue'
import ShopDetailsModal from '@/components/shop/ShopDetailsModal.vue'
import PasswordForm from '@/components/shop/PasswordForm.vue'
import NotificationModal from '@/components/shop/NotificationModal.vue'
import { shopService } from '@/services/shopService'
export default {
  name: 's2',
  components: {
    LayoutAdmin,
    ShopForm,
    ShopDetailsModal,
    PasswordForm,
    NotificationModal
  },
  data() {
    return {
      s2Shops: [],
      searchQuery: '',
      selectedCategory: '',
      showAddShopForm: false,
      showDetailsModal: false,
      showPasswordForm: false,
      showNotificationModal: false,
      selectedShop: null,
      shopToEdit: null,
      timer: null
    }
  },
  computed: {
    filteredActiveShops() {
      return this.s2Shops
        .filter(shop => shop && !this.isExpired(shop))
        .filter(shop =>
          shop.name.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
          (!this.selectedCategory || shop.type === this.selectedCategory)
        )
    },
    filteredExpiredShops() {
      return this.s2Shops
        .filter(shop => shop && this.isExpired(shop))
        .filter(shop =>
          shop.name.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
          (!this.selectedCategory || shop.type === this.selectedCategory)
        )
    }
  },
  created() {
    this.loadS2Shops()
  },
  mounted() {
    this.startRealtimeUpdate()
  },
  beforeDestroy() {
    this.stopRealtimeUpdate()
  },
  methods: {
    getShopTypeLabel(type) {
      const types = {
        food: 'อาหาร',
        drink: 'เครื่องดื่ม',
        dessert: 'ของหวาน',
        other: 'อื่นๆ'
      }
      return types[type] || type
    },
    isExpired(shop) {
      if (!shop || !shop.contractEndDate) return false
      const end = new Date(shop.contractEndDate)
      const now = new Date()
      return end < now
    },
    calculateRemainingDays(shop) {
      if (!shop || !shop.contractEndDate) return 0
      const end = new Date(shop.contractEndDate)
      const now = new Date()
      const diff = end - now
      return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0
    },
    async loadS2Shops() {
      try {
        const response = await shopService.getS2Shops()
        if (response && Array.isArray(response)) {
          this.s2Shops = response
          console.log('โหลดข้อมูลร้านค้าสำเร็จ:', this.s2Shops)
        } else {
          console.error('Invalid response format:', response)
          this.s2Shops = []
        }
      } catch (error) {
        console.error('Error loading shops:', error)
        this.s2Shops = []
      }
    },
    handleViewDetails(shop) {
      this.selectedShop = shop
      this.showDetailsModal = true
    },
    handleEditShop(shop) {
      // Format dates to YYYY-MM-DD for input type="date"
      const formatDateForInput = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toISOString().split('T')[0]
      }

      // Create a copy of the shop data with formatted dates
      this.shopToEdit = {
        ...shop,
        contractStartDate: formatDateForInput(shop.contractStartDate),
        contractEndDate: formatDateForInput(shop.contractEndDate),
        imagePreview: shop.image // Use existing image as preview
      }
      this.showAddShopForm = true
    },
    handleGenerateCredentials(shop) {
      this.selectedShop = shop
      this.showPasswordForm = true
    },
    handleShowNotification(shop) {
      this.selectedShop = shop
      this.showNotificationModal = true
    },
    handleExpiredNotification(shop) {
      this.selectedShop = shop
      this.showNotificationModal = true
    },
    closeShopForm() {
      this.showAddShopForm = false
      this.shopToEdit = null
    },
    async handleAddShop(shopData) {
      try {
        console.log('Updating shop with data:', shopData)
        // Format dates to ISO string
        const formattedData = {
          name: shopData.name,
          type: shopData.type,
          description: shopData.description,
          location: shopData.location,
          contractStartDate: new Date(shopData.contractStartDate).toISOString(),
          contractEndDate: new Date(shopData.contractEndDate).toISOString(),
          image: shopData.imagePreview || (this.shopToEdit ? this.shopToEdit.image : ''),
          // ใช้ credentials เดิมเมื่อแก้ไขร้านค้า
          credentials: this.shopToEdit ? this.shopToEdit.credentials : shopData.credentials
        }
        console.log('Formatted data:', formattedData)

        if (this.shopToEdit) {
          console.log('Updating existing shop with ID:', this.shopToEdit._id)
          try {
            // Update existing shop
            const updatedShop = await shopService.updateShop(this.shopToEdit._id, formattedData)
            console.log('Received updated shop from server:', updatedShop)
            
            if (!updatedShop) {
              throw new Error('ไม่ได้รับข้อมูลร้านค้าที่อัพเดทจาก server')
            }

            // Reload all shops to ensure data consistency
            await this.loadS2Shops()
            
            // Update selectedShop if it's the same shop being edited
            if (this.selectedShop && this.selectedShop._id === this.shopToEdit._id) {
              this.selectedShop = updatedShop
            }

            this.closeShopForm()
          } catch (updateError) {
            console.error('Error updating shop:', updateError)
            if (updateError.response) {
              console.error('Server response:', updateError.response.data)
              alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${updateError.response.data.message || 'ไม่สามารถอัพเดทข้อมูลได้'}`)
            } else {
              alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง')
            }
          }
        } else {
          try {
            // Add new shop
            const newShop = await shopService.createShop({
              ...formattedData,
              canteenId: 9
            })
            console.log('Created new shop:', newShop)
            
            if (!newShop) {
              throw new Error('ไม่ได้รับข้อมูลร้านค้าใหม่จาก server')
            }

            // Reload all shops to ensure data consistency
            await this.loadS2Shops()
            this.closeShopForm()
          } catch (createError) {
            console.error('Error creating shop:', createError)
            if (createError.response) {
              console.error('Server response:', createError.response.data)
              alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${createError.response.data.message || 'ไม่สามารถสร้างร้านค้าใหม่ได้'}`)
            } else {
              alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง')
            }
          }
        }
      } catch (error) {
        console.error('Error in handleAddShop:', error)
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง')
      }
    },
    async handleChangePassword(newPassword) {
      try {
        if (!this.selectedShop || !this.selectedShop._id) {
          return
        }

        // อัพเดตรหัสผ่านเฉพาะร้านค้าที่เลือก
        const updatedShop = await shopService.updateShop(this.selectedShop._id, {
          ...this.selectedShop,
          credentials: {
            ...this.selectedShop.credentials,
            password: newPassword
          }
        })

        if (!updatedShop) {
          return
        }

        // รีโหลดข้อมูลร้านค้าทั้งหมดเพื่อให้แสดงข้อมูลล่าสุด
        await this.loadS2Shops()
        
        // อัพเดตข้อมูลร้านค้าที่เลือกอยู่ถ้าเป็นร้านค้าที่เพิ่งแก้ไข
        if (this.selectedShop._id === updatedShop._id) {
          this.selectedShop = updatedShop
        }

        // ปิดฟอร์ม
        this.showPasswordForm = false
      } catch (error) {
        console.error('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน:', error)
      }
    },
    async handleSendNotification(notificationData) {
      try {
        console.log('Sending notification:', notificationData)
        this.showNotificationModal = false
        this.handleShowNotification({
          type: 'success',
          message: 'ส่งการแจ้งเตือนเรียบร้อยแล้ว'
        })
      } catch (error) {
        console.error('Error sending notification:', error)
        this.handleShowNotification({
          type: 'error',
          message: 'ไม่สามารถส่งการแจ้งเตือนได้'
        })
      }
    },
    startRealtimeUpdate() {
      this.timer = setInterval(() => {
        this.loadS2Shops()
      }, 60000) // Update every minute
    },
    stopRealtimeUpdate() {
      if (this.timer) {
        clearInterval(this.timer)
      }
    }
  }
}
</script>

<style scoped>
.canteen-detail {
  padding: 20px;
}

.canteen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

h1 {
  color: #333;
  font-size: 28px;
}

.header-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
  max-width: 800px;
}


.canteen-content {
  display: grid;
  gap: 30px;
}

.shop-management {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.shop-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

h2 {
  color: #444;
  font-size: 20px;
}

.search-container {
  display: flex;
  gap: 10px;
  width: 100%;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
}

.search-input {
  width: 100%;
  padding: 8px 35px 8px 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.category-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 120px;
  background-color: white;
  height: 38px;
}

.add-btn {
  padding: 8px 16px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  white-space: nowrap;
}

.shop-list {
  display: grid;
  gap: 15px;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.shop-section {
  margin-bottom: 30px;
}

.section-title {
  color: #333;
  font-size: 18px;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #eee;
}

.active-title {
  color: #28a745;
  margin-top: 8px;
}

.expired-title {
  color: #e74c3c;
}

.expired-title i {
  margin-right: 8px;
}

.shop-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-top: 20px;
}

.table-header {
  display: grid;
  grid-template-columns: 0.5fr 2fr 1fr 1.5fr 1fr 1fr 1fr 1fr;
  padding: 15px;
  background-color: #f8f9fa;
  font-weight: bold;
  border-bottom: 2px solid #e9ecef;
}

.shop-row {
  display: grid;
  grid-template-columns: 0.5fr 2fr 1fr 1.5fr 1fr 1fr 1fr 1fr;
  padding: 15px;
  align-items: center;
  border-bottom: 1px solid #e9ecef;
  transition: background-color 0.3s;
}

.shop-row:hover {
  background-color: #f8f9fa;
}

.shop-row.expired {
  background-color: #fff5f5;
}

.shop-row.expired:hover {
  background-color: #ffe0e0;
}

.header-item {
  color: #495057;
  font-size: 14px;
  text-align: center;
}

.row-item {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
}

.status-badge.active {
  background-color: rgba(46, 204, 113, 0.1);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.2);
}

.status-badge.expired {
  background-color: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.2);
}

.status-badge i {
  margin-right: 6px;
}

.notification-link {
  color: #1976d2;
  cursor: pointer;
  font-size: 14px;
}

.notification-link:hover {
  color: #1565c0;
}

.action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100px;
  margin: 0 auto;
}

.details-btn {
  background-color: #e3f2fd;
  color: #1976d2;
}

.edit-btn {
  background-color: #fff3e0;
  color: #f57c00;
}

.qr-btn {
  background-color: #e8f5e9;
  color: #388e3c;
}

.action-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.action-btn i {
  font-size: 14px;
}

@media (max-width: 768px) {
  .shop-header {
    flex-direction: column;
    gap: 15px;
  }

  .search-container {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .category-select {
    width: 100%;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
  }

  .table-header,
  .shop-row {
    grid-template-columns: 40px 2fr 1fr 1.5fr 1fr 1fr 1fr 1fr;
    padding: 8px 12px;
    font-size: 0.9rem;
  }

  .status-badge {
    font-size: 0.8rem;
    padding: 2px 4px;
  }

  .action-btn {
    width: 28px;
    height: 28px;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-btn:hover {
  color: #333;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 10px;
  }
}
</style> 