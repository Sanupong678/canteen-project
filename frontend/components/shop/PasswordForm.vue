<template>
  <div class="password-modal" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>เปลี่ยนรหัสผ่าน</h3>
        <button class="modal-close-btn" @click="$emit('close')">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="credentials-section">
          <div class="shop-info-header">
            <h4>ข้อมูลร้านค้า</h4>
            <p class="shop-name">{{ shop.name }}</p>
          </div>
          <div class="credentials-info">
            <h4>ข้อมูลการเข้าสู่ระบบ</h4>
            <div class="credential-item">
              <label>ชื่อผู้ใช้:</label>
              <span>{{ shop.credentials?.username }}</span>
            </div>
            <div class="credential-item">
              <label>รหัสผ่านปัจจุบัน:</label>
              <span>{{ shop.credentials?.password }}</span>
            </div>
          </div>
          <div class="password-section">
            <h4>เปลี่ยนรหัสผ่าน</h4>
            <div class="form-group">
              <label>รหัสผ่านใหม่:</label>
              <input 
                type="password" 
                v-model="passwordForm.newPassword" 
                placeholder="กรอกรหัสผ่านใหม่"
                :class="{ 'error': passwordError }"
              >
              <small class="error-message" v-if="passwordError">{{ passwordError }}</small>
            </div>
            <div class="form-group">
              <label>ยืนยันรหัสผ่าน:</label>
              <input 
                type="password" 
                v-model="passwordForm.confirmPassword" 
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                :class="{ 'error': confirmPasswordError }"
              >
              <small class="error-message" v-if="confirmPasswordError">{{ confirmPasswordError }}</small>
            </div>
            <div class="password-requirements">
              <p>รหัสผ่านต้องมี:</p>
              <ul>
                <li :class="{ 'met': passwordForm.newPassword.length >= 8 }">อย่างน้อย 8 ตัวอักษร</li>
                <li :class="{ 'met': /[A-Z]/.test(passwordForm.newPassword) }">ตัวอักษรพิมพ์ใหญ่ 1 ตัว</li>
                <li :class="{ 'met': /[a-z]/.test(passwordForm.newPassword) }">ตัวอักษรพิมพ์เล็ก 1 ตัว</li>
                <li :class="{ 'met': /[0-9]/.test(passwordForm.newPassword) }">ตัวเลข 1 ตัว</li>
              </ul>
            </div>
            <div class="form-actions">
              <button class="cancel-btn" @click="$emit('close')">ยกเลิก</button>
              <button class="save-btn" @click="handleSubmit" :disabled="!isPasswordValid">
                <i class="fas fa-key"></i> เปลี่ยนรหัสผ่าน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PasswordForm',
  props: {
    shop: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      passwordForm: {
        newPassword: '',
        confirmPassword: ''
      },
      passwordError: '',
      confirmPasswordError: ''
    }
  },
  computed: {
    isPasswordValid() {
      return (
        this.passwordForm.newPassword &&
        this.passwordForm.confirmPassword &&
        this.passwordForm.newPassword === this.passwordForm.confirmPassword &&
        this.passwordForm.newPassword.length >= 8 &&
        /[A-Z]/.test(this.passwordForm.newPassword) &&
        /[a-z]/.test(this.passwordForm.newPassword) &&
        /[0-9]/.test(this.passwordForm.newPassword) &&
        !this.passwordError &&
        !this.confirmPasswordError
      )
    }
  },
  methods: {
    validatePassword() {
      this.passwordError = ''
      this.confirmPasswordError = ''

      if (!this.passwordForm.newPassword) {
        this.passwordError = 'กรุณากรอกรหัสผ่านใหม่'
        return false
      }

      if (this.passwordForm.newPassword.length < 8) {
        this.passwordError = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
        return false
      }

      if (!/[A-Z]/.test(this.passwordForm.newPassword)) {
        this.passwordError = 'รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่ 1 ตัว'
        return false
      }

      if (!/[a-z]/.test(this.passwordForm.newPassword)) {
        this.passwordError = 'รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก 1 ตัว'
        return false
      }

      if (!/[0-9]/.test(this.passwordForm.newPassword)) {
        this.passwordError = 'รหัสผ่านต้องมีตัวเลข 1 ตัว'
        return false
      }

      if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
        this.confirmPasswordError = 'รหัสผ่านไม่ตรงกัน'
        return false
      }

      return true
    },
    async handleSubmit() {
      if (this.validatePassword()) {
        try {
          this.$emit('change-password', this.passwordForm.newPassword)
          this.$emit('close')
        } catch (error) {
          console.error('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน:', error)
        }
      }
    }
  }
}
</script>

<style scoped>
.password-modal {
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
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
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
  color: #333;
  font-size: 20px;
}

.modal-close-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 24px;
  cursor: pointer;
  padding: 5px;
}

.modal-body {
  padding: 20px;
}

.credentials-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.shop-info-header {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}

.shop-info-header h4 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 16px;
}

.shop-name {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 500;
}

.credentials-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}

.credentials-info h4 {
  margin: 0 0 10px 0;
  color: #666;
  font-size: 16px;
}

.credential-item {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.credential-item:last-child {
  margin-bottom: 0;
}

.credential-item label {
  color: #666;
  font-weight: 500;
}

.credential-item span {
  color: #333;
}

.password-section {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}

.password-section h4 {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 16px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #666;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input.error {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
}

.password-requirements {
  margin: 15px 0;
  padding: 15px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.password-requirements p {
  margin: 0 0 10px 0;
  color: #666;
  font-weight: 500;
}

.password-requirements ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.password-requirements li {
  color: #666;
  margin-bottom: 5px;
  padding-left: 20px;
  position: relative;
}

.password-requirements li:before {
  content: '×';
  position: absolute;
  left: 0;
  color: #dc3545;
}

.password-requirements li.met {
  color: #28a745;
}

.password-requirements li.met:before {
  content: '✓';
  color: #28a745;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn,
.save-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cancel-btn {
  background-color: #f8f9fa;
  color: #666;
}

.save-btn {
  background-color: #28a745;
  color: white;
}

.save-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
  }

  .credential-item {
    grid-template-columns: 1fr;
    gap: 5px;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-btn,
  .save-btn {
    width: 100%;
    justify-content: center;
  }
}
</style> 