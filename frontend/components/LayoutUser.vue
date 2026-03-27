<template>
  <div class="user-layout">
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
          <NotificationDropdown />
          <div class="user-profile" @click="toggleUserMenu">
            <div class="avatar">{{ userInitials }}</div>
            <span class="username">{{ displayName }}</span>
            <span class="caret">▾</span>
            <div class="user-menu" v-if="showUserMenu">
              <div class="menu-item" @click="openChangePasswordModal">
                <i class="fas fa-key menu-icon"></i>
                <span class="menu-text">เปลี่ยนรหัส</span>
              </div>
              <div class="menu-item" @click="openDetailsModal">
                <i class="fas fa-info-circle menu-icon"></i>
                <span class="menu-text">รายละเอียด</span>
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
        <input type="checkbox" id="mobile-nav-toggle" class="mobile-nav-toggle" />
        <label for="mobile-nav-toggle" class="mobile-nav-button" aria-label="Toggle navigation">
          <span class="hamburger-lines" aria-hidden="true"></span>
        </label>
        <ul class="nav-list">
          <li><router-link to="/user" class="nav-link" active-class="active">หน้าแรก</router-link></li>
          <li><router-link to="/user/ranking" class="nav-link" active-class="active">จัดอันดับ</router-link></li>
          <li><router-link to="/user/repair" class="nav-link" active-class="active">แจ้งซ่อม</router-link></li>
          <li><router-link to="/user/leave" class="nav-link" active-class="active">แจ้งลา</router-link></li>
          <li><router-link to="/user/bill" class="nav-link" active-class="active">บิล</router-link></li>
        </ul>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="user-main">
      <slot></slot>
    </main>

    <!-- Footer -->
    <footer class="user-footer">
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

    <!-- Change Password Modal -->
    <div v-if="showChangePasswordModal" class="password-modal" @click="closeChangePasswordModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>เปลี่ยนรหัสผ่าน</h3>
          <button class="modal-close-btn" @click="closeChangePasswordModal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="credentials-section">
            <div class="shop-info-header">
              <h4>ข้อมูลร้านค้า</h4>
              <p class="shop-name">{{ shopData.name || 'ไม่ระบุ' }}</p>
            </div>
            <div class="credentials-info">
              <h4>ข้อมูลการเข้าสู่ระบบ</h4>
              <div class="credential-item">
                <label>ชื่อผู้ใช้:</label>
                <span>{{ shopData.credentials?.username || 'ไม่ระบุ' }}</span>
              </div>
              <div class="credential-item">
                <label>รหัสผ่านปัจจุบัน:</label>
                <div class="current-password-wrapper">
                  <span v-if="shopData.credentials?.password">
                    {{ showCurrentPassword ? shopData.credentials.password : '••••••••' }}
                  </span>
                  <span v-else>ไม่ระบุ</span>
                  <button 
                    v-if="shopData.credentials?.password"
                    type="button" 
                    class="password-toggle-btn current-password-toggle" 
                    @click="toggleCurrentPassword"
                    :title="showCurrentPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                  >
                    <i :class="showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
              </div>
            </div>
            <div class="password-section">
              <h4>เปลี่ยนรหัสผ่าน</h4>
              <div class="form-group">
                <label>รหัสผ่านใหม่:</label>
                <div class="password-input-wrapper">
                  <input 
                    :type="showNewPassword ? 'text' : 'password'" 
                    v-model="passwordForm.newPassword" 
                    placeholder="กรอกรหัสผ่านใหม่"
                    :class="{ 'error': passwordError }"
                  >
                  <button 
                    type="button" 
                    class="password-toggle-btn" 
                    @click="toggleNewPassword"
                    :title="showNewPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                  >
                    <i :class="showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
                <small class="error-message" v-if="passwordError">{{ passwordError }}</small>
              </div>
              <div class="form-group">
                <label>ยืนยันรหัสผ่าน:</label>
                <div class="password-input-wrapper">
                  <input 
                    :type="showConfirmPassword ? 'text' : 'password'" 
                    v-model="passwordForm.confirmPassword" 
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    :class="{ 'error': confirmPasswordError }"
                  >
                  <button 
                    type="button" 
                    class="password-toggle-btn" 
                    @click="toggleConfirmPassword"
                    :title="showConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'"
                  >
                    <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                  </button>
                </div>
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
                <button class="cancel-btn" @click="closeChangePasswordModal">ยกเลิก</button>
                <button class="save-btn" @click="handleChangePassword" :disabled="!isPasswordValid">
                  <i class="fas fa-key"></i> เปลี่ยนรหัสผ่าน
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click="closeDetailsModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>รายละเอียดร้านค้า</h3>
          <button class="close-btn" @click="closeDetailsModal">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="shop-image-container" @click="showImagePopup = true">
            <img :src="getFullImageUrl(shopData.image)" alt="รูปภาพร้านค้า" class="shop-image">
          </div>
          <div class="shop-info">
            <div class="detail-item">
              <label>รหัสร้าน:</label>
              <span>{{ shopData.customId || 'ไม่ระบุ' }}</span>
            </div>
            <div class="detail-item">
              <label>ชื่อร้าน:</label>
              <span>{{ shopData.name || 'ไม่ระบุ' }}</span>
            </div>
            <div class="detail-item">
              <label>ประเภท:</label>
              <span>{{ getShopTypeLabel(shopData.type) }}</span>
            </div>
            <div class="detail-item">
              <label>ตำแหน่ง:</label>
              <span>{{ shopData.location || 'ไม่ระบุ' }}</span>
            </div>
            <div class="detail-item">
              <label>รายละเอียด:</label>
              <span>{{ getDescription(shopData.description) }}</span>
            </div>
            <div class="detail-item">
              <label>โรงอาหาร:</label>
              <span>{{ getCanteenName(shopData.canteenId) }}</span>
            </div>
            <div class="detail-item">
              <label>วันที่เริ่มสัญญา:</label>
              <span>{{ formatDate(shopData.contractStartDate) || 'ไม่ระบุ' }}</span>
            </div>
            <div class="detail-item">
              <label>วันที่สิ้นสุดสัญญา:</label>
              <span class="detail-value">{{ formatDate(shopData.contractEndDate) || 'ไม่ระบุ' }}</span>
            </div>
            <div class="detail-item">
              <label>สถานะสัญญา:</label>
              <span :class="{ 'expired': isExpired(shopData) }">
                <i :class="isExpired(shopData) ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
                {{ isExpired(shopData) ? 'หมดอายุ' : 'มีผล' }}
              </span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="close-btn" @click="closeDetailsModal">ปิด</button>
        </div>
      </div>
    </div>

    <!-- Image Popup -->
    <div v-if="showImagePopup" class="image-popup" @click="showImagePopup = false">
      <div class="image-popup-content" @click.stop>
        <button class="image-popup-close-btn" @click="showImagePopup = false">
          <i class="fas fa-times"></i>
        </button>
        <img :src="getFullImageUrl(shopData.image)" :alt="shopData.name || 'รูปภาพร้านค้า'" class="popup-image">
      </div>
    </div>
  </div>
</template>

<script>
import NotificationDropdown from './NotificationDropdown.vue'
import { resolveShopImageSrc } from '../utils/imageUtils'

export default {
  name: 'LayoutUser',
  components: {
    NotificationDropdown
  },
  data() {
    return {
      showUserMenu: false,
      displayName: 'User Name',
      shopData: {},
      userId: null,
      showChangePasswordModal: false,
      showDetailsModal: false,
      showImagePopup: false,
      passwordForm: {
        newPassword: '',
        confirmPassword: ''
      },
      passwordError: '',
      confirmPasswordError: '',
      showNewPassword: false,
      showConfirmPassword: false,
      showCurrentPassword: false
    }
  },
  async mounted() {
    // Check if we're on the client side
    if (process.client) {
      // Set data from sessionStorage only on client side
      this.displayName = sessionStorage.getItem('displayName') || 'User Name'
      this.shopData = JSON.parse(sessionStorage.getItem('shopData') || '{}')
      this.userId = sessionStorage.getItem('userId')
      
      // Debug sessionStorage data (ใช้ fingerprint แทน token จริง)
      const { getTokenFingerprint } = await import('@/utils/tokenUtils')
      const { token, state } = getTokenWithState()
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 sessionStorage data:', {
          displayName: this.displayName,
          userId: this.userId,
          shopData: this.shopData,
          rawShopData: sessionStorage.getItem('shopData'),
          tokenState: state,
          tokenFingerprint: getTokenFingerprint(token || ''),
          isAuthenticated: sessionStorage.getItem('isAuthenticated'),
          userRole: sessionStorage.getItem('userRole')
        })
      }
      
      // ตรวจสอบ authentication (ใช้ token validation)
      const isAuthenticated = sessionStorage.getItem('isAuthenticated')
      
      if (!isAuthenticated || state !== TokenState.VALID || !token) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`❌ User not authenticated, token state: ${state}, redirecting to login`)
        }
        this.$router.push('/login')
        return
      }
      
      // ตรวจสอบ role
      const userRole = sessionStorage.getItem('userRole')
      if (userRole !== 'user') {
        console.log('❌ User role is not user, redirecting to login')
        this.$router.push('/login')
        return
      }
      
      console.log('✅ User authenticated successfully')
      console.log('👤 User data:', {
        displayName: this.displayName,
        userId: this.userId,
        shopData: this.shopData
      })
      
      // ดึงข้อมูลร้านค้าจาก API
      await this.fetchShopDetails()
      
      // Initialize notifications ทันที
      try {
        console.log('🔄 Initializing notifications in LayoutUser...')
        await this.$initializeNotifications()
        console.log('✅ Notifications initialized successfully')
      } catch (error) {
        console.error('❌ Error initializing notifications:', error)
      }
    }
  },
  methods: {
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu
    },
    async handleLogout() {
      try {
        // เรียก backend logout API
        const { $axios } = useNuxtApp()
        if ($axios) {
          try {
            await $axios.post('/api/auth/logout', {}, {
              withCredentials: true
            })
            console.log('✅ Backend logout successful')
          } catch (error) {
            // แม้ backend logout จะล้มเหลว ก็ยังต้อง clear frontend data
            console.warn('⚠️ Backend logout failed, but continuing with frontend cleanup:', error.message)
          }
        }
      } catch (error) {
        console.warn('⚠️ Logout API call failed:', error.message)
      } finally {
        // Clear all session data
        if (process.client) {
          sessionStorage.clear()
          localStorage.clear()
          
          // Clear cookies
          document.cookie = 'user_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
          
          console.log('✅ Logged out successfully, cleared all session data')
        }
        this.$router.push('/login')
      }
    },
    openChangePasswordModal() {
      this.showChangePasswordModal = true
      this.showUserMenu = false
    },
    closeChangePasswordModal() {
      this.showChangePasswordModal = false
      this.passwordForm = {
        newPassword: '',
        confirmPassword: ''
      }
      this.passwordError = ''
      this.confirmPasswordError = ''
      this.showNewPassword = false
      this.showConfirmPassword = false
      this.showCurrentPassword = false
    },
    openDetailsModal() {
      this.showDetailsModal = true
      this.showUserMenu = false
    },
    closeDetailsModal() {
      this.showDetailsModal = false
    },
    getShopTypeLabel(type) {
      const types = {
        food: 'อาหาร',
        beverage: 'เครื่องดื่ม',
        other: 'อื่นๆ'
      }
      return types[type] || type || 'ไม่ระบุ'
    },
    getFullImageUrl(imagePath) {
      return resolveShopImageSrc(imagePath)
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
      if (!shop || !shop.contractEndDate) return false
      const endDate = new Date(shop.contractEndDate)
      const today = new Date()
      return endDate < today
    },
    getDescription(description) {
      if (!description || description === null || description === undefined) {
        return 'ไม่ระบุ'
      }
      const trimmed = description.toString().trim()
      return trimmed === '' ? 'ไม่ระบุ' : trimmed
    },
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
    async fetchShopDetails() {
      try {
        // ดึง shopId จาก localStorage หรือ shopData
        // สำหรับ user, userId จะเป็น shop._id
        const shopId = this.userId || this.shopData._id || this.shopData.id
        
        console.log('🔍 Debug shopId lookup:', {
          'this.shopData._id': this.shopData._id,
          'this.shopData.id': this.shopData.id,
          'this.userId': this.userId,
          'final shopId': shopId
        })
        
        if (!shopId) {
          console.log('❌ No shopId found')
          console.log('❌ Available data:', {
            shopData: this.shopData,
            userId: this.userId
          })
          console.log('❌ sessionStorage data:', {
            userId: sessionStorage.getItem('userId'),
            shopData: sessionStorage.getItem('shopData'),
            displayName: sessionStorage.getItem('displayName'),
            userRole: sessionStorage.getItem('userRole')
          })
          return
        }
        
        console.log('🔍 Fetching shop details for shopId:', shopId)
        
        const response = await this.$axios.get(`/api/shops/details/${shopId}`)
        
        if (response.data.success) {
          this.shopData = response.data.data
          console.log('✅ Shop details fetched successfully:', this.shopData)
          console.log('🔍 Description value:', this.shopData.description)
          console.log('🔍 Description type:', typeof this.shopData.description)
        }
      } catch (error) {
        console.error('❌ Error fetching shop details:', error)
      }
    },
    async handleChangePassword() {
      if (this.validatePassword()) {
        try {
          const shopId = this.shopData._id || this.shopData.id
          
          if (!shopId) {
            alert('ไม่พบข้อมูลร้านค้า')
            return
          }
          
          console.log('Changing password for shop:', shopId)
          console.log('New password:', this.passwordForm.newPassword)
          
          const response = await this.$axios.put(`/api/shops/update-password/${shopId}`, {
            newPassword: this.passwordForm.newPassword
          })
          
          if (response.data.success) {
            alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว')
            this.closeChangePasswordModal()
            
            // ดึงข้อมูลร้านค้าใหม่เพื่ออัปเดต credentials
            await this.fetchShopDetails()
          } else {
            alert(response.data.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้')
          }
        } catch (error) {
          console.error('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน:', error)
          const errorMessage = error.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้'
          alert(errorMessage)
        }
      }
    }
  },
  computed: {
    shopName() {
      return this.shopData.name || ''
    },
    shopType() {
      return this.shopData.type || ''
    },
    shopLocation() {
      return this.shopData.location || ''
    },
    userInitials() {
      if (this.displayName && this.displayName !== 'User Name') {
        return this.displayName.charAt(0).toUpperCase()
      }
      return 'U'
    },
    toggleNewPassword() {
      this.showNewPassword = !this.showNewPassword
    },
    toggleConfirmPassword() {
      this.showConfirmPassword = !this.showConfirmPassword
    },
    toggleCurrentPassword() {
      this.showCurrentPassword = !this.showCurrentPassword
    },
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
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700;800;900&family=Inter:wght@400;600;700&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css');
.user-layout {
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
  padding: 0 var(--page-padding);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--page-padding);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Make top and bottom nav stretch edge-to-edge */
.navbar-top .navbar-container {
  max-width: none;
  margin: 0;
  padding: 0 var(--page-padding);
}

.navbar-container.grid {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
}

.area-left { justify-self: start; }
.area-right { justify-self: end; }

.brand {
  display: flex;
  align-items: center;
  gap: var(--gap);
}

.logo img { height: clamp(44px, 10vw, 72px); width: auto; }

.navbar-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  gap: 2px;
}

.navbar-title-text {
  margin: 0;
  font-size: var(--font-lg);
  font-weight: 800;
  color: #111827;
  font-family: 'Kanit', 'Noto Sans Thai', sans-serif;
  line-height: 1.1;
}

.navbar-subtitle-text {
  margin: 0;
  font-size: var(--font-md);
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 600;
  font-family: 'Inter', 'Kanit', 'Noto Sans', sans-serif;
  align-self: center;
  text-align: center;
  line-height: 1.1;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: var(--gap);
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
  font-size: var(--font-sm);
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
  font-size: var(--font-sm);
}

.caret {
  color: #6b7280;
  font-size: var(--font-sm);
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
  font-size: var(--font-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-text {
  font-size: var(--font-md);
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

.mobile-nav-toggle {
  display: none;
}

.mobile-nav-button {
  display: none;
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

/* Mobile navigation (hamburger) */
@media (max-width: 768px) {
  .navbar-bottom .navbar-container {
    position: relative;
    padding: 0 16px;
  }

  .mobile-nav-button {
    display: flex;
    width: 44px;
    height: 44px;
    border-radius: 10px;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,0.15);
    cursor: pointer;
  }

  .hamburger-lines {
    width: 22px;
    height: 2px;
    background: #fff;
    position: relative;
    display: block;
  }
  .hamburger-lines::before,
  .hamburger-lines::after {
    content: '';
    position: absolute;
    left: 0;
    width: 22px;
    height: 2px;
    background: #fff;
  }
  .hamburger-lines::before { top: -7px; }
  .hamburger-lines::after { top: 7px; }

  .nav-list {
    display: none;
    flex-direction: column;
    justify-content: flex-start;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background-color: #e74c3c;
    padding: 8px 0;
    border-radius: 0 0 12px 12px;
    z-index: 1000;
  }

  .nav-list li {
    justify-content: flex-start;
    width: 100%;
  }

  .nav-link {
    width: 100%;
    padding: 12px 16px;
    text-align: left;
    min-height: 44px;
  }

  /* checkbox hack: show menu when checked */
  .mobile-nav-toggle:checked ~ .nav-list {
    display: flex;
  }
}

/* Main Content */
.user-main {
  flex: 1;
  padding: 0 var(--page-padding) var(--page-padding) var(--page-padding);
  background-color: #f5f6fa;
}

/* Footer */
.user-footer {
  background-color: #e74c3c;
  color: white;
  padding: var(--spacing-lg) var(--page-padding);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  text-align: center;
}

.footer-section {
  flex: 1;
}

.footer-title {
  font-size: clamp(14px, 3.5vw, 20px);
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  color: white;
  font-family: 'Kanit', sans-serif;
}

.contact-info {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  align-items: center;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: var(--gap);
  font-size: var(--font-md);
  line-height: 1.5;
}

.contact-item i {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-md);
  color: #ffd700;
}

.social-links {
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  align-items: center;
}

.social-link {
  display: flex;
  align-items: center;
  gap: var(--gap);
  color: white;
  text-decoration: none;
  font-size: var(--font-md);
  padding: 8px 12px;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
  min-height: 44px;
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
  font-size: var(--font-md);
  color: #ffd700;
}

.social-link.facebook i {
  color: #1877f2;
}

.social-link.facebook:hover i {
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
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

@media (max-width: 640px) {
  .user-footer {
    padding: 16px;
  }

  .footer-content {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 12px;
    text-align: left;
  }

  .footer-section {
    flex: 1;
    min-width: 140px;
  }

  .footer-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .contact-item,
  .social-link {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    padding: 0;
    border: none;
    border-radius: 0;
    background: transparent;
    min-height: auto;
  }

  .contact-item i,
  .social-link i {
    font-size: 14px;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
}

/* Modal Styles */
.password-modal, .modal-overlay {
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

.modal-close-btn, .close-btn {
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

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
}

/* Password Form Styles */
.credentials-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.shop-info-header, .credentials-info, .password-section {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
}

.shop-info-header h4, .credentials-info h4, .password-section h4 {
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

.cancel-btn, .save-btn {
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

/* Password Input Wrapper */
.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper input {
  width: 100%;
  padding-right: 45px; /* Space for toggle button */
}

.password-toggle-btn {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  padding: 5px;
  border-radius: 3px;
  transition: color 0.2s ease;
  z-index: 1;
}

.password-toggle-btn:hover {
  color: #333;
  background-color: #f8f9fa;
}

.password-toggle-btn:focus {
  outline: none;
  background-color: #e9ecef;
}

.password-toggle-btn i {
  font-size: 14px;
}

/* Current Password Wrapper */
.current-password-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.current-password-toggle {
  position: static !important;
  transform: none !important;
  margin-left: 5px;
}

.save-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

/* Details Modal Styles */
.shop-image-container {
  text-align: center;
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.shop-image-container:hover {
  transform: scale(1.05);
}

.shop-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  object-fit: cover;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.shop-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-item {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 10px;
  align-items: center;
}

.detail-item label {
  color: #666;
  font-weight: 500;
}

.detail-item span {
  color: #333;
}

.detail-item span.expired {
  color: #dc3545;
}

/* Image Popup Styles */
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
  z-index: 3000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.image-popup-content {
  position: relative;
  max-width: 90%;
  max-height: 90vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-popup-close-btn {
  position: absolute;
  top: -50px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  font-size: 28px;
  cursor: pointer;
  padding: 10px 15px;
  border-radius: 50%;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  z-index: 3001;
}

.image-popup-close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.popup-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  animation: zoomIn 0.3s ease;
}

@keyframes zoomIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Responsive Modal */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
  }

  .credential-item, .detail-item {
    grid-template-columns: 1fr;
    gap: 5px;
  }

  .form-actions {
    flex-direction: column;
  }

  .cancel-btn, .save-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
  