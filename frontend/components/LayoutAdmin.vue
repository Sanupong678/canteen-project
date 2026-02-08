<template>
  <div class="admin-layout">
    <!-- Navbar ชั้นที่ 1 -->
    <nav class="navbar-top">
      <div class="navbar-container grid navbar-top-container">
        <div class="brand area-left">
          <div class="logo">
            <img src="/images/Logo.jpg" alt="Logo">
          </div>
          <div class="navbar-title">
            <h1 class="navbar-title-text">มหาวิทยาลัยเเม่ฟ้าหลวง</h1>
            <p class="navbar-subtitle-text">ระบบบริหารจัดการโรงอาหาร</p>
          </div>
        </div>
        <div class="user-actions area-right">
          <AdminNotificationDropdown />
          <div class="user-profile" @click="toggleUserMenu">
            <div class="avatar">{{ displayInitials }}</div>
            <span class="username">{{ displayName }}</span>
            <span class="caret">▾</span>
            <div class="user-menu" v-if="showUserMenu">
              <div class="menu-item" @click="openWelcomeEditModal">
                <i class="fas fa-edit menu-icon"></i>
                <span class="menu-text">แก้ไข Welcome Page</span>
              </div>
              <div class="menu-item" @click="openBannerManagement">
                <i class="fas fa-image menu-icon"></i>
                <span class="menu-text">จัดการแบนเนอร์</span>
              </div>
              <div class="menu-divider"></div>
              <div class="menu-item logout-item" @click="handleLogout">
                <i class="fas fa-sign-out-alt menu-icon"></i>
                <span class="menu-text">ออกจากระบบ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Navbar ชั้นที่ 2 -->
    <nav class="navbar-bottom">
      <div class="navbar-container">
        <ul class="nav-list">
          <li><router-link to="/admin" class="nav-link" active-class="active">หน้าแรก</router-link></li>
          <li><router-link to="/admin/management" class="nav-link" active-class="active">การจัดการ</router-link></li>
          <li><router-link to="/admin/ranking" class="nav-link" active-class="active">จัดอันดับ</router-link></li>
          <li><router-link to="/admin/repair" class="nav-link" active-class="active">แจ้งซ่อม</router-link></li>
          <li><router-link to="/admin/leave" class="nav-link" active-class="active">แจ้งลา</router-link></li>
          <li><router-link to="/admin/bill" class="nav-link" active-class="active">บิล</router-link></li>
        </ul>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="admin-main">
      <slot></slot>
    </main>

    <!-- Welcome Page Edit Modal -->
    <div v-if="showWelcomeEditModal" class="modal-overlay" @click="closeWelcomeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>แก้ไข Welcome Page</h3>
          <button class="close-btn" @click="closeWelcomeEditModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>อัปโหลดรูปภาพใหม่:</label>
            <input 
              type="file" 
              ref="imageInput"
              @change="handleImageUpload"
              accept="image/*"
              class="file-input"
            />
          </div>
          
          <div v-if="selectedImage" class="image-preview">
            <h4>รูปภาพที่เลือก:</h4>
            <div class="preview-container">
              <img :src="selectedImagePreview" alt="Preview" class="preview-image" />
              <div class="crop-controls">
                <button @click="startCrop" class="crop-btn">
                  <i class="fas fa-crop"></i>
                  ตัดรูป
                </button>
              </div>
            </div>
          </div>

          <div v-if="showCropModal" class="crop-modal">
            <div class="crop-container">
              <div class="crop-area" ref="cropArea">
                <img :src="selectedImagePreview" ref="cropImage" class="crop-image" />
                <div class="crop-overlay" ref="cropOverlay"></div>
              </div>
              <div class="crop-actions">
                <button @click="cancelCrop" class="btn btn-secondary">ยกเลิก</button>
                <button @click="applyCrop" class="btn btn-primary">ยืนยัน</button>
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button @click="closeWelcomeEditModal" class="btn btn-secondary">ยกเลิก</button>
            <button @click="saveWelcomePage" class="btn btn-primary" :disabled="!selectedImage">
              บันทึก
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="admin-footer">
      <div class="footer-content">
        <div class="footer-section">
          <h3 class="footer-title">ติดต่อเรา</h3>
          <div class="contact-info">
            <div class="contact-item">
              <i class="fas fa-building"></i>
              <span>ศูนย์อาหารมหาวิทยาลัยแม่ฟ้าหลวง (Mfu Food Court)</span>
            </div>
            <div class="contact-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>Chiang Rai, Thailand, Chiang Rai</span>
            </div>
            <div class="contact-item">
              <i class="fas fa-phone"></i>
              <span>053 917 144</span>
            </div>
          </div>
        </div>
        
        <div class="footer-section">
          <h3 class="footer-title">ติดตาม</h3>
          <div class="social-links">
            <a href="https://asset.mfu.ac.th/asset-home.html" 
               class="social-link" 
               title="สำนักงานจัดการทรัพย์สินและรายได้"
               target="_blank">
              <i class="fas fa-university"></i>
              <span>สำนักงานจัดการทรัพย์สินและรายได้</span>
            </a>
            <a href="https://www.facebook.com/MFUFOODCOURT" 
               class="social-link facebook" 
               target="_blank">
              <i class="fab fa-facebook-f"></i>
              <span>Facebook</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
import AdminNotificationDropdown from './AdminNotificationDropdown.vue'

export default {
  name: 'LayoutAdmin',
  components: {
    AdminNotificationDropdown
  },
  data() {
    return {
      showUserMenu: false,
      displayName: sessionStorage.getItem('displayName') || 'Admin User',
      showWelcomeEditModal: false,
      selectedImage: null,
      selectedImagePreview: null,
      showCropModal: false,
      cropData: null
    }
  },
  computed: {
    displayInitials() {
      const parts = (this.displayName || '').trim().split(' ')
      const initials = parts.filter(Boolean).slice(0, 2).map(p => p[0]).join('')
      return initials || 'A'
    }
  },
  methods: {
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu
    },
    handleLogout() {
      // Clear all session data
      sessionStorage.clear()
      
      // Clear cookies
      document.cookie = 'user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      
      this.showUserMenu = false // ปิด user menu
      this.$router.push('/login')
    },
    checkAuth() {
      if (process.client) {
        const isAuthenticated = sessionStorage.getItem('isAuthenticated')
        const userRole = sessionStorage.getItem('userRole')
        // ตรวจสอบว่าอยู่ในหน้า admin หรือไม่ ถ้าไม่ใช่ให้ผ่าน
        if (this.$route.path.startsWith('/admin') && (!isAuthenticated || userRole !== 'admin')) {
          this.$router.push('/login')
        }
      }
    },
    openWelcomeEditModal() {
      this.showWelcomeEditModal = true
      this.showUserMenu = false // ปิด user menu
    },
    openBannerManagement() {
      this.showUserMenu = false // ปิด user menu
      // ไปที่หน้า banner management
      this.$router.push('/admin/banner')
    },
    closeWelcomeEditModal() {
      this.showWelcomeEditModal = false
      this.selectedImage = null
      this.selectedImagePreview = null
      this.showCropModal = false
      this.cropData = null
    },
    handleImageUpload(event) {
      const file = event.target.files[0]
      if (file) {
        this.selectedImage = file
        const reader = new FileReader()
        reader.onload = (e) => {
          this.selectedImagePreview = e.target.result
        }
        reader.readAsDataURL(file)
      }
    },
    startCrop() {
      this.showCropModal = true
      this.$nextTick(() => {
        this.initCrop()
      })
    },
    initCrop() {
      // Simple crop implementation
      const cropArea = this.$refs.cropArea
      const cropOverlay = this.$refs.cropOverlay
      
      if (cropArea && cropOverlay) {
        cropOverlay.style.position = 'absolute'
        cropOverlay.style.top = '10%'
        cropOverlay.style.left = '10%'
        cropOverlay.style.width = '80%'
        cropOverlay.style.height = '80%'
        cropOverlay.style.border = '2px dashed #fff'
        cropOverlay.style.backgroundColor = 'rgba(0,0,0,0.3)'
        cropOverlay.style.cursor = 'move'
      }
    },
    cancelCrop() {
      this.showCropModal = false
    },
    applyCrop() {
      // Simple crop implementation - in real app, use a proper crop library
      this.showCropModal = false
      alert('การตัดรูปเสร็จสิ้น (ในเวอร์ชันจริงจะใช้ library สำหรับ crop)')
    },
    async saveWelcomePage() {
      if (!this.selectedImage) return
      
      try {
        const formData = new FormData()
        formData.append('image', this.selectedImage)
        
        // ใช้ axios interceptor (validate token อัตโนมัติ)
        console.log('Sending request with validated token')
        
        const response = await this.$axios.post('/api/welcome/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        if (response.data.success) {
          alert('บันทึก Welcome Page สำเร็จ!')
          this.closeWelcomeEditModal()
          // รีเฟรชหน้าเพื่อแสดงรูปภาพใหม่
          window.location.reload()
        } else {
          alert('เกิดข้อผิดพลาด: ' + (response.data.error || 'ไม่ทราบสาเหตุ'))
        }
      } catch (error) {
        console.error('Error saving welcome page:', error)
        
        let errorMessage = 'เกิดข้อผิดพลาดในการบันทึก'
        
        if (error.response) {
          // Server responded with error status
          const status = error.response.status
          const data = error.response.data
          
          if (status === 401) {
            errorMessage = 'กรุณาเข้าสู่ระบบใหม่ (Token หมดอายุ)'
          } else if (status === 403) {
            errorMessage = 'คุณไม่มีสิทธิ์ในการแก้ไข (ต้องเป็น Admin)'
          } else if (status === 400) {
            errorMessage = 'ข้อมูลไม่ถูกต้อง: ' + (data.error || 'กรุณาตรวจสอบไฟล์')
          } else if (status === 500) {
            errorMessage = 'เกิดข้อผิดพลาดในระบบ: ' + (data.error || 'ไม่ทราบสาเหตุ')
          } else {
            errorMessage = `เกิดข้อผิดพลาด (${status}): ` + (data.error || 'ไม่ทราบสาเหตุ')
          }
        } else if (error.request) {
          // Request was made but no response received
          errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
        } else {
          // Something else happened
          errorMessage = 'เกิดข้อผิดพลาด: ' + error.message
        }
        
        alert(errorMessage)
      }
    }
  },
  mounted() {
    this.checkAuth()
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700;800;900&family=Inter:wght@400;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navbar ชั้นที่ 1 */
.navbar-top {
  background-color: white;
  padding: 6px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-top-container {
  max-width: none;
  margin: 0;
  padding: 0 35px;
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Make top and bottom nav stretch edge-to-edge */
.navbar-top .navbar-container {
  max-width: none;
  margin: 0;
  padding: 0 35px;
}

.navbar-container.grid {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
}

.area-left { justify-self: start; }
.area-center { justify-self: center; }
.area-right { justify-self: end; }

.logo img { height: 72px; }

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.navbar-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 2px;
}

.navbar-title-text {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  color: #111827;
  font-family: 'Kanit', 'Noto Sans Thai', sans-serif;
  line-height: 1.1;
}

.navbar-subtitle-text {
  margin: 0;
  font-size: 16px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  font-family: 'Kanit', 'Noto Sans Thai', sans-serif;
  align-self: center;
  text-align: center;
  line-height: 1.1;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification {
  position: relative;
  cursor: pointer;
}

.notification-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: #e74c3c;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
}

.user-profile {
  position: relative;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #111827;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.caret {
  color: #6b7280;
  font-size: 12px;
}

.user-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  padding: 8px 0;
  border: 1px solid #e2e8f0;
  z-index: 1000;
  margin-top: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #374151;
  font-weight: 500;
}

.menu-item:hover {
  background: #f3f4f6;
  color: #111827;
}

.menu-item.logout-item {
  color: #dc2626;
}

.menu-item.logout-item:hover {
  background: #fef2f2;
  color: #b91c1c;
}

.menu-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
}

.menu-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 4px 0;
}

/* Navbar ชั้นที่ 2 */
.navbar-bottom {
  background-color: #e74c3c;
  padding: 6px 0;
}

.navbar-bottom .navbar-container {
  max-width: none;
  padding: 0 12px;
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  justify-content: space-evenly;
}

.nav-list li {
  display: flex;
  justify-content: center;
  align-items: center;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  text-align: center;
  padding: 8px 16px;
  border-radius: 6px;
  transition: background-color 0.2s ease, transform 0.1s ease;
}

.nav-link:hover {
  background: rgba(255,255,255,0.15);
  transform: translateY(-1px);
}

.nav-link.active {
  background: rgba(255,255,255,0.25);
}

/* Main Content */
.admin-main {
  flex: 1;
  padding: 20px;
  background-color: #f5f6fa;
}

/* Footer */
.admin-footer {
  background-color: #e74c3c;
  color: white;
  padding: 30px 20px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  gap: 60px;
  text-align: center;
}

.footer-section {
  flex: 1;
}

.footer-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 20px;
  color: white;
  font-family: 'Kanit', sans-serif;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  line-height: 1.5;
}

.contact-item i {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #ffd700;
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.social-link {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
  text-decoration: none;
  font-size: 16px;
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.social-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.social-link.facebook:hover {
  background-color: #1877f2;
  border-color: #1877f2;
}

.social-link i {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #ffd700;
}

.social-link.facebook i {
  color: #1877f2;
}

.social-link.facebook:hover i {
  color: white;
}


/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #2d3748;
  font-size: 1.25rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #718096;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #2d3748;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2d3748;
}

.file-input {
  width: 100%;
  padding: 12px;
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  background: #f7fafc;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-input:hover {
  border-color: #667eea;
  background: #edf2f7;
}

.image-preview {
  margin-top: 20px;
}

.image-preview h4 {
  margin-bottom: 12px;
  color: #2d3748;
}

.preview-container {
  position: relative;
  display: inline-block;
}

.preview-image {
  max-width: 300px;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.crop-controls {
  margin-top: 12px;
}

.crop-btn {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.crop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(72, 187, 120, 0.4);
}

.crop-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 20px;
}

.crop-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 80vw;
  max-height: 80vh;
}

.crop-area {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.crop-image {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
}

.crop-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-content {
    margin: 10px;
    max-height: 95vh;
  }
  
  .preview-image {
    max-width: 100%;
  }
  
  .user-menu {
    min-width: 200px;
  }
  
  .menu-item {
    padding: 10px 14px;
  }
  
  .menu-text {
    font-size: 13px;
  }
  
  .footer-content {
    flex-direction: column;
    gap: 30px;
  }
  
  .footer-title {
    font-size: 20px;
  }
  
  .contact-item,
  .social-link {
    font-size: 14px;
  }
}
</style>
