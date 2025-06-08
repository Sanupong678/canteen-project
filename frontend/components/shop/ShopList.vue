<template>
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
            <span class="notification-link" @click="$emit('show-notification', shop)">แจ้งเตือน</span>
          </div>
          <div class="row-item">
            <button class="action-btn details-btn" @click="$emit('view-details', shop)">
              <i class="fas fa-info-circle"></i>
            </button>
          </div>
          <div class="row-item">
            <button class="action-btn edit-btn" @click="$emit('edit-shop', shop)">
              <i class="fas fa-edit"></i>
            </button>
          </div>
          <div class="row-item">
            <button class="action-btn qr-btn" @click="$emit('generate-credentials', shop)">
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
            <span class="notification-link" @click="$emit('handle-expired-notification', shop)">แจ้งเตือน</span>
          </div>
          <div class="row-item">
            <button class="action-btn details-btn" @click="$emit('view-details', shop)">
              <i class="fas fa-info-circle"></i>
            </button>
          </div>
          <div class="row-item">
            <button class="action-btn edit-btn" @click="$emit('edit-shop', shop)">
              <i class="fas fa-edit"></i>
            </button>
          </div>
          <div class="row-item">
            <button class="action-btn qr-btn" @click="$emit('generate-credentials', shop)">
              <i class="fas fa-qrcode"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShopList',
  props: {
    shops: {
      type: Array,
      required: true
    },
    searchQuery: {
      type: String,
      default: ''
    },
    selectedCategory: {
      type: String,
      default: ''
    }
  },
  computed: {
    filteredActiveShops() {
      return this.shops
        .filter(shop => !this.isExpired(shop))
        .filter(shop =>
          shop.name.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
          (!this.selectedCategory || shop.type === this.selectedCategory)
        )
    },
    filteredExpiredShops() {
      return this.shops
        .filter(shop => this.isExpired(shop))
        .filter(shop =>
          shop.name.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
          (!this.selectedCategory || shop.type === this.selectedCategory)
        )
    }
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
      if (!shop.contractEndDate) return false
      const end = new Date(shop.contractEndDate)
      const now = new Date()
      return end < now
    },
    calculateRemainingDays(shop) {
      if (!shop.contractEndDate) return 0
      const end = new Date(shop.contractEndDate)
      const now = new Date()
      const diff = end - now
      return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0
    }
  }
}
</script>

<style scoped>
.shop-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.shop-section {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-title {
  padding: 15px 20px;
  margin: 0;
  font-size: 18px;
  color: #333;
  border-bottom: 1px solid #eee;
}

.active-title {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.expired-title {
  background-color: #ffebee;
  color: #c62828;
}

.shop-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  display: grid;
  grid-template-columns: 60px 2fr 1fr 1.5fr 1fr 1fr 1fr 1fr;
  background-color: #f8f9fa;
  padding: 12px 20px;
  font-weight: 500;
  color: #666;
  border-bottom: 1px solid #eee;
}

.shop-row {
  display: grid;
  grid-template-columns: 60px 2fr 1fr 1.5fr 1fr 1fr 1fr 1fr;
  padding: 12px 20px;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.shop-row:last-child {
  border-bottom: none;
}

.shop-row.expired {
  background-color: #fff5f5;
}

.row-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
  gap: 4px;
}

.status-badge.active {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.status-badge.expired {
  background-color: #ffebee;
  color: #c62828;
}

.notification-link {
  color: #2196f3;
  cursor: pointer;
  text-decoration: underline;
}

.notification-link:hover {
  color: #1976d2;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: opacity 0.2s;
}

.action-btn:hover {
  opacity: 0.9;
}

.details-btn {
  background-color: #2196f3;
}

.edit-btn {
  background-color: #ff9800;
}

.qr-btn {
  background-color: #9c27b0;
}

@media (max-width: 768px) {
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
</style> 