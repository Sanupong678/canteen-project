<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>รายละเอียดร้านค้า</h3>
        <button class="close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-body">
        <div class="shop-image-container" @click="showImagePopup = true">
          <img :src="shop.image || '/images/default-shop.jpg'" alt="รูปภาพร้านค้า" class="shop-image">
        </div>
        <div class="shop-info">
          <div class="detail-item">
            <label>รหัสร้าน:</label>
            <span>{{ shop.customId || 'ไม่ระบุ' }}</span>
          </div>
          <div class="detail-item">
            <label>ชื่อร้าน:</label>
            <span>{{ shop.name }}</span>
          </div>
          <div class="detail-item">
            <label>ประเภท:</label>
            <span>{{ getShopTypeLabel(shop.type) }}</span>
          </div>
          <div class="detail-item">
            <label>ตำแหน่ง:</label>
            <span>{{ shop.location }}</span>
          </div>
          <div class="detail-item">
            <label>รายละเอียด:</label>
            <span>{{ shop.description }}</span>
          </div>
          <div class="detail-item">
            <label>โรงอาหาร:</label>
            <span>{{ getCanteenName(shop.canteenId) }}</span>
          </div>
          <div class="detail-item">
            <label>วันที่เริ่มสัญญา:</label>
            <span>{{ formatDate(shop.contractStartDate) || 'ไม่ระบุ' }}</span>
          </div>
          <div class="detail-item">
            <label>วันที่สิ้นสุดสัญญา:</label>
            <span class="detail-value">{{ formatDate(shop.contractEndDate) }}</span>
          </div>
          <div class="detail-item">
            <label>สถานะสัญญา:</label>
            <span :class="{ 'expired': isExpired(shop) }">
              <i :class="isExpired(shop) ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
              {{ isExpired(shop) ? 'หมดอายุ' : 'มีผล' }}
            </span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="close-btn" @click="$emit('close')">ปิด</button>
      </div>
    </div>
  </div>

  <!-- Image Popup -->
  <div v-if="showImagePopup" class="image-popup" @click="showImagePopup = false">
    <div class="image-popup-content">
      <button class="close-btn" @click="showImagePopup = false">
        <i class="fas fa-times"></i>
      </button>
      <img :src="shop.image" :alt="shop.name" class="popup-image">
    </div>
  </div>
</template>

<script>
export default {
  name: 'ShopDetailsModal',
  props: {
    shop: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      showImagePopup: false
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
    getCanteenName(canteenId) {
      const canteens = {
        1: 'โรงอาหาร 1',
        2: 'โรงอาหาร 2',
        3: 'โรงอาหาร 3',
        4: 'โรงอาหาร 4',
        5: 'โรงอาหาร 5'
      }
      return canteens[canteenId] || `โรงอาหาร ${canteenId}` || 'ไม่ระบุ'
    },
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  cursor: pointer;
}

.modal-content {
  cursor: default;
  background: white;
  padding: 20px;
  border-radius: 0;
  width: 98%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: modalFadeIn 0.3s ease;
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
  border-radius: 0 12px 0 0;
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

.modal-body {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  padding: 1rem;
}

.shop-image-container {
  width: 100%;
  height: 300px;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
}

.shop-image-container:hover {
  transform: scale(1.02);
}

.shop-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shop-info {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.detail-item {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.detail-item:last-child {
  margin-bottom: 0;
}

.detail-item label {
  font-weight: 500;
  color: #4a5568;
  font-size: 0.95rem;
}

.detail-item span {
  color: #2d3748;
  font-size: 0.95rem;
}

.detail-item span.expired {
  color: #e53e3e;
}

.image-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.image-popup-content {
  position: relative;
  max-width: 90%;
  max-height: 90vh;
}

.image-popup .close-btn {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
}

.popup-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #666;
  font-size: 24px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background-color: #f8f9fa;
  color: #333;
  transform: scale(1.1);
}

@media (max-width: 768px) {
  .modal-body {
    grid-template-columns: 1fr;
  }

  .shop-image-container {
    height: 200px;
  }

  .detail-item {
    grid-template-columns: 1fr;
    gap: 5px;
  }
}
</style> 