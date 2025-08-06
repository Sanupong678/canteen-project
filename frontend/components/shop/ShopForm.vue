<template>
  <div class="shop-form">
    <div class="modal-overlay" @click="$emit('close')">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ isEditMode ? 'แก้ไขข้อมูลร้านค้า' : (currentStep === 1 ? 'ข้อมูลร้านค้า' : 'ตั้งค่าการเข้าสู่ระบบ') }}</h2>
          <button @click="$emit('close')" class="close-button">×</button>
        </div>
        
        <div class="modal-body">
          <div v-if="!isEditMode" class="step-indicator">
            <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
              <span class="step-number">1</span>
              <span class="step-text">ข้อมูลร้านค้า</span>
            </div>
            <div class="step-line"></div>
            <div class="step" :class="{ active: currentStep === 2 }">
              <span class="step-number">2</span>
              <span class="step-text">ตั้งค่าการเข้าสู่ระบบ</span>
            </div>
          </div>

          <form @submit.prevent="handleSubmit">
            <!-- Shop Information Form -->
            <div v-if="currentStep === 1" class="form-step">
              <div class="form-group">
                <label for="shopName">ชื่อร้าน</label>
                <input
                  type="text"
                  id="shopName"
                  v-model="shop.name"
                  required
                  class="form-input"
                >
              </div>

              <div class="form-group">
                <label for="shopType">ประเภทร้าน</label>
                <select
                  id="shopType"
                  v-model="shop.type"
                  required
                  class="form-input"
                >
                  <option value="food">อาหาร</option>
                  <option value="drink">เครื่องดื่ม</option>
                  <option value="dessert">ของหวาน</option>
                  <option value="other">อื่นๆ</option>
                </select>
              </div>

              <div class="form-group">
                <label for="shopDescription">รายละเอียดร้าน</label>
                <textarea
                  id="shopDescription"
                  v-model="shop.description"
                  rows="3"
                  class="form-input"
                ></textarea>
              </div>

              <div class="form-group">
                <label for="shopImage">รูปภาพร้าน</label>
                <input
                  type="file"
                  id="shopImage"
                  @change="handleImageUpload"
                  accept="image/*"
                  class="form-input"
                >
                <div v-if="shop.imagePreview" class="image-preview">
                  <img :src="shop.imagePreview" alt="Preview">
                </div>
              </div>

              <div class="form-group">
                <label for="shopLocation">ตำแหน่งร้าน</label>
                <input
                  type="text"
                  id="shopLocation"
                  v-model="shop.location"
                  required
                  class="form-input"
                  placeholder="เช่น โซน A, ทางเข้าหลัก"
                >
              </div>

              <div class="form-group">
                <label for="canteenId">โรงอาหาร</label>
                <select
                  id="canteenId"
                  v-model="shop.canteenId"
                  required
                  class="form-input"
                >
                  <option value="">เลือกโรงอาหาร</option>
                  <option value="1">โรงอาหาร C5</option>
                  <option value="2">โรงอาหาร D1</option>
                  <option value="3">โรงอาหาร Dormity</option>
                  <option value="4">โรงอาหาร E1</option>
                  <option value="5">โรงอาหาร E2</option>
                  <option value="6">โรงอาหาร Epark</option>
                  <option value="7">โรงอาหาร Msquare</option>
                  <option value="8">โรงอาหาร RuemRim</option>
                  <option value="9">โรงอาหาร S2</option>
                </select>
              </div>

              <div class="form-group">
                <label for="contractStartDate">วันที่เริ่มสัญญา</label>
                <input
                  type="date"
                  id="contractStartDate"
                  v-model="shop.contractStartDate"
                  required
                  class="form-input"
                >
              </div>

              <div class="form-group">
                <label for="contractEndDate">วันที่สิ้นสุดสัญญา</label>
                <input
                  type="date"
                  id="contractEndDate"
                  v-model="shop.contractEndDate"
                  required
                  class="form-input"
                >
              </div>

              <div class="form-group">
                <label>ระยะเวลาที่เหลือ</label>
                <div class="remaining-days" :class="{ 'expired': isContractExpired }">
                  {{ remainingDays }} วัน
                </div>
              </div>

              <div class="form-actions">
                <button type="button" @click="$emit('close')" class="cancel-button">
                  ยกเลิก
                </button>
                <button v-if="!isEditMode" type="button" @click="nextStep" class="next-button">
                  ถัดไป
                </button>
                <button v-else type="submit" class="submit-button">
                  บันทึกข้อมูล
                </button>
              </div>
            </div>

            <!-- Login Credentials Form (เฉพาะการเพิ่มร้านค้าใหม่) -->
            <div v-if="currentStep === 2 && !isEditMode" class="form-step">
              <div class="login-section">
                <label>ข้อมูลการเข้าสู่ระบบ <span class="required">*</span></label>
                <div class="login-credentials">
                  <div class="credential-group">
                    <label for="username">ชื่อผู้ใช้</label>
                    <input
                      type="text"
                      id="username"
                      v-model="shop.credentials.username"
                      required
                      class="form-input"
                      placeholder="กรอกชื่อผู้ใช้"
                    >
                  </div>
                  
                  <div class="credential-group">
                    <label for="password">รหัสผ่าน</label>
                    <input
                      type="password"
                      id="password"
                      v-model="shop.credentials.password"
                      required
                      class="form-input"
                      placeholder="กรอกรหัสผ่าน"
                    >
                  </div>
                  <div class="credential-group">
                    <label for="confirmPassword">ยืนยันรหัสผ่าน</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      v-model="shop.confirmPassword"
                      required
                      class="form-input"
                      placeholder="กรอกรหัสผ่านอีกครั้ง"
                    >
                    <div v-if="shop.credentials.password && shop.confirmPassword && shop.credentials.password !== shop.confirmPassword" class="error-message">
                      รหัสผ่านไม่ตรงกัน
                    </div>
                  </div>
                  <div class="password-requirements">
                    <p>รหัสผ่านต้องมี:</p>
                    <ul>
                      <li :class="{ 'met': shop.credentials.password.length >= 8 }">อย่างน้อย 8 ตัวอักษร</li>
                      <li :class="{ 'met': /[A-Z]/.test(shop.credentials.password) }">ตัวอักษรพิมพ์ใหญ่ 1 ตัว</li>
                      <li :class="{ 'met': /[a-z]/.test(shop.credentials.password) }">ตัวอักษรพิมพ์เล็ก 1 ตัว</li>
                      <li :class="{ 'met': /[0-9]/.test(shop.credentials.password) }">ตัวเลข 1 ตัว</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" @click="prevStep" class="prev-button">
                  ย้อนกลับ
                </button>
                <button type="submit" class="submit-button">
                  บันทึกข้อมูล
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  shopToEdit: {
    type: Object,
    default: null
  },
  canteenId: {
    type: [Number, String],
    required: true
  }
})

const emit = defineEmits(['close', 'add-shop'])

const currentStep = ref(1)
const isEditMode = computed(() => !!props.shopToEdit)

const shop = ref({
  name: '',
  type: 'food',
  description: '',
  image: null,
  imagePreview: null,
  location: '',
  contractStartDate: '',
  contractEndDate: '',
  credentials: {
    username: '',
    password: ''
  },
  confirmPassword: '',
  canteenId: props.canteenId
})

const updateInterval = ref(null)

const remainingDays = computed(() => {
  if (!shop.value.contractEndDate) return 0
  const endDate = new Date(shop.value.contractEndDate)
  const today = new Date()
  const diffTime = endDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

const isContractExpired = computed(() => {
  return remainingDays.value <= 0
})

const startUpdateInterval = () => {
  updateInterval.value = setInterval(() => {
    // Force reactivity update
    shop.value = { ...shop.value }
  }, 60000) // Update every minute
}

const stopUpdateInterval = () => {
  if (updateInterval.value) {
    clearInterval(updateInterval.value)
  }
}

onMounted(() => {
  if (props.shopToEdit) {
    shop.value = {
      ...props.shopToEdit,
      imagePreview: props.shopToEdit.image,
      credentials: {
        username: '',
        password: ''
      },
      confirmPassword: '',
      canteenId: props.shopToEdit.canteenId || props.canteenId
    }
  } else {
    // สำหรับร้านค้าใหม่ ให้ใช้ canteenId จาก props
    shop.value.canteenId = props.canteenId
  }
  startUpdateInterval()
})

onUnmounted(() => {
  stopUpdateInterval()
})

const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    shop.value.image = file
    const reader = new FileReader()
    reader.onload = (e) => {
      shop.value.imagePreview = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const nextStep = () => {
  // ตรวจสอบข้อมูลร้านค้าที่จำเป็น
  if (!shop.value.name || !shop.value.type || !shop.value.location || 
      !shop.value.contractStartDate || !shop.value.contractEndDate) {
    alert('กรุณากรอกข้อมูลร้านค้าให้ครบถ้วน')
    return
  }

  // ตรวจสอบวันที่สัญญา
  const startDate = new Date(shop.value.contractStartDate)
  const endDate = new Date(shop.value.contractEndDate)
  if (endDate <= startDate) {
    alert('วันที่สิ้นสุดสัญญาต้องมากกว่าวันที่เริ่มสัญญา')
    return
  }

  // ตรวจสอบรูปภาพ
  if (!shop.value.imagePreview) {
    alert('กรุณาอัพโหลดรูปภาพร้านค้า')
    return
  }

  if (currentStep.value < 2) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleSubmit = () => {
  if (!isEditMode.value) {
    // ตรวจสอบข้อมูลการเข้าสู่ระบบสำหรับการเพิ่มร้านค้าใหม่
    if (!shop.value.credentials.username || !shop.value.credentials.password || !shop.value.confirmPassword) {
      alert('กรุณากรอกข้อมูลการเข้าสู่ระบบให้ครบถ้วน')
      return
    }

    if (shop.value.credentials.password !== shop.value.confirmPassword) {
      alert('กรุณาตรวจสอบรหัสผ่านให้ตรงกัน')
      return
    }

    // ตรวจสอบความซับซ้อนของรหัสผ่าน
    if (shop.value.credentials.password.length < 8) {
      alert('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }

    if (!/[A-Z]/.test(shop.value.credentials.password)) {
      alert('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่ 1 ตัว')
      return
    }

    if (!/[a-z]/.test(shop.value.credentials.password)) {
      alert('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก 1 ตัว')
      return
    }

    if (!/[0-9]/.test(shop.value.credentials.password)) {
      alert('รหัสผ่านต้องมีตัวเลข 1 ตัว')
      return
    }
  }

  // ส่งข้อมูลร้านค้าไปยัง parent component
  const shopData = {
    ...shop.value,
    credentials: {
      username: shop.value.credentials.username,
      password: shop.value.credentials.password
    }
  }
  
  console.log('Sending shop data:', shopData) // เพิ่ม log เพื่อตรวจสอบข้อมูล
  emit('add-shop', shopData)
  
  // รีเซ็ตฟอร์ม
  shop.value = {
    name: '',
    type: 'food',
    description: '',
    image: null,
    imagePreview: null,
    location: '',
    contractStartDate: '',
    contractEndDate: '',
    credentials: {
      username: '',
      password: ''
    },
    confirmPassword: '',
    canteenId: ''
  }
  
  currentStep.value = 1
  emit('close')
}
</script>

<style scoped>
.shop-form {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
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
}

.modal-content {
  background-color: white;
  border-radius: 0 12px 12px 0;
  width: 98%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0 12px 0 0;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #2d3748;
  font-weight: 600;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #718096;
  cursor: pointer;
  padding: 0.5rem;
}

.modal-body {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
}

.image-preview {
  margin-top: 1rem;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.image-preview img {
  max-width: 100%;
  max-height: 250px;
  object-fit: contain;
  width: 100%;
}

.remaining-days {
  padding: 0.6rem;
  background-color: #48bb78;
  color: white;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
  font-size: 0.95rem;
}

.remaining-days.expired {
  background-color: #f56565;
}

.form-actions {
  margin-top: auto;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.cancel-button {
  padding: 0.6rem 1.2rem;
  background-color: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.cancel-button:hover {
  background-color: #cbd5e0;
  transform: translateY(-1px);
}

.submit-button {
  padding: 0.6rem 1.2rem;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.submit-button:hover {
  background-color: #3182ce;
  transform: translateY(-1px);
}

.login-credentials {
  background-color: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.credential-group {
  margin-bottom: 1rem;
}

.credential-group:last-child {
  margin-bottom: 0;
}

.credential-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #4a5568;
  font-weight: 500;
  font-size: 0.95rem;
}

.error-message {
  color: #e53e3e;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.required {
  color: #e53e3e;
  margin-left: 0.25rem;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.step {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.step-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #e2e8f0;
  color: #4a5568;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
}

.step.active .step-number {
  background-color: #4299e1;
  color: white;
}

.step.completed .step-number {
  background-color: #48bb78;
  color: white;
}

.step-text {
  font-size: 0.95rem;
  color: #4a5568;
}

.step.active .step-text {
  color: #2d3748;
  font-weight: 500;
}

.step-line {
  width: 100px;
  height: 2px;
  background-color: #e2e8f0;
  margin: 0 1rem;
}

.next-button {
  padding: 0.6rem 1.2rem;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.next-button:hover {
  background-color: #3182ce;
  transform: translateY(-1px);
}

.prev-button {
  padding: 0.6rem 1.2rem;
  background-color: #e2e8f0;
  color: #4a5568;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.prev-button:hover {
  background-color: #cbd5e0;
  transform: translateY(-1px);
}

.form-step {
  animation: fadeIn 0.3s ease;
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.login-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  .form-input {
    font-size: 0.9rem;
    padding: 0.5rem;
  }
  
  .form-group label {
    font-size: 0.9rem;
  }
  
  .cancel-button,
  .submit-button {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
}

.password-requirements {
  margin: 1.5rem auto;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  max-width: 500px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.password-requirements p {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-weight: 500;
  font-size: 0.95rem;
}

.password-requirements ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.password-requirements li {
  color: #6c757d;
  margin-bottom: 0.5rem;
  padding-left: 1.5rem;
  position: relative;
  font-size: 0.9rem;
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
</style> 