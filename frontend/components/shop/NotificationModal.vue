<template>
  <div class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>ส่งการแจ้งเตือน</h3>
        <button class="modal-close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="notification-form">
          <div class="form-group">
            <label>ผู้รับการแจ้งเตือน:</label>
            <select v-model="formData.recipients" class="form-control">
              <option v-if="selectedShop" :value="selectedShop._id">{{ selectedShop.name }}</option>
              <option v-if="selectedShop" :value="`canteen_${selectedShop.canteenId}`">ร้านค้าเฉพาะโรงอาหาร ({{ getCanteenName(selectedShop.canteenId) }})</option>
              <option value="all">ทุกร้าน</option>
            </select>
          </div>

          <div class="form-group">
            <label>ความสำคัญ:</label>
            <select v-model="formData.priority" class="form-control">
              <option value="low">ต่ำ</option>
              <option value="medium">ปานกลาง</option>
              <option value="high">สูง</option>
            </select>
          </div>

          <div class="form-group">
            <label>หัวข้อ:</label>
            <input 
              type="text" 
              v-model="formData.title" 
              class="form-control"
              placeholder="กรอกหัวข้อการแจ้งเตือน"
            >
          </div>

          <div class="form-group">
            <label>รายละเอียด:</label>
            <textarea 
              v-model="formData.message" 
              class="form-control"
              rows="4"
              placeholder="กรอกรายละเอียดการแจ้งเตือน"
            ></textarea>
          </div>

          <div class="form-actions">
            <button class="cancel-btn" @click="$emit('close')">ยกเลิก</button>
            <button class="send-btn" @click="handleSubmit" :disabled="!isFormValid">
              <i class="fas fa-paper-plane"></i> ส่งการแจ้งเตือน
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotificationModal',
  props: {
    selectedShop: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      formData: {
        recipients: 'all', // ใช้ค่าเริ่มต้นเป็น 'all'
        priority: 'medium',
        title: '',
        message: ''
      }
    }
  },
  computed: {
    isFormValid() {
      return this.formData.title.trim() !== '' && 
             this.formData.message.trim() !== ''
    }
  },
  methods: {
    getCanteenName(canteenId) {
      const canteenMap = {
        1: 'C5',
        2: 'D1',
        3: 'Dormitory',
        4: 'E1',
        5: 'E2',
        6: 'Epark',
        7: 'Msquare',
        8: 'Ruemrim',
        9: 'S2'
      };
      return canteenMap[canteenId] || 'ไม่ระบุ';
    },
    async handleSubmit() {
      if (this.isFormValid) {
        try {
          console.log('📤 Form data being sent:', this.formData);
          
          const requestData = {
            recipients: this.formData.recipients,
            recipientShopId: this.formData.recipients !== 'all' && !this.formData.recipients.startsWith('canteen_') ? this.formData.recipients : null,
            recipientCanteenId: this.formData.recipients.startsWith('canteen_') ? this.formData.recipients.replace('canteen_', '') : null,
            priority: this.formData.priority,
            title: this.formData.title,
            message: this.formData.message
          };
          
          console.log('📤 Request data:', requestData);
          
          // ส่งการแจ้งเตือนไปยัง admin notification API
          const response = await this.$axios.post('/api/admin-notifications/send', requestData);

          if (response.data.success) {
            // แสดงข้อความสำเร็จก่อน
            this.$emit('success', {
              message: 'ส่งข้อความแล้ว'
            });
            
            // ปิด modal และส่งข้อมูล
            this.$emit('submit', { ...this.formData });
            this.$emit('close');
          } else {
            throw new Error(response.data.message || 'ไม่สามารถส่งการแจ้งเตือนได้');
          }
        } catch (error) {
          console.error('Error sending notification:', error);
          this.$emit('error', {
            message: 'ไม่สามารถส่งการแจ้งเตือนได้ กรุณาลองใหม่อีกครั้ง'
          });
        }
      }
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
  padding: 1.25rem 1.5rem;
  background-color: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border-radius: 12px 12px 0 0;
}

.modal-header h3 {
  font-size: clamp(1.1rem, 4.5vw, 1.25rem);
  color: #2c3e50;
  margin: 0;
  font-weight: 600;
}

.modal-body {
  padding: 2rem;
  display: flex;
  justify-content: center;
  height: auto;
}

.notification-form {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 12px;
  margin: 0 auto;
  border: 1px solid #dee2e6;
  width: 100%;
  max-width: 700px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 1.5rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #2c3e50;
  font-weight: 500;
  font-size: 0.95rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background-color: white;
}

.form-control:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.15);
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background-color: #f8f9fa;
  color: #2c3e50;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  min-width: 120px;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.cancel-btn:hover {
  background-color: #e9ecef;
}

.send-btn {
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  min-width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  line-height: 1;
}

.send-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.send-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.modal-close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: #666;
  font-size: clamp(1.05rem, 6vw, 1.5rem);
  cursor: pointer;
  width: 44px;
  height: 44px;
  min-height: 44px;
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
  .modal-content {
    margin: 1rem;
    padding: 16px;
    max-height: calc(100vh - 2rem);
  }

  .modal-body {
    padding: 1rem;
    height: auto;
  }

  .modal-header {
    padding: 16px;
  }

  .notification-form {
    padding: 1rem;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}
</style> 