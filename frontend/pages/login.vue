<template>
  <div class="login-page">
    <div class="login-container">
      <div class="logo-container">
      </div>
      <h1>เข้าสู่ระบบ</h1>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">ชื่อผู้ใช้</label>
          <input
            type="text"
            id="username"
            v-model="username"
            placeholder="กรอกชื่อผู้ใช้"
            required
          >
        </div>
        <div class="form-group">
          <label for="password">รหัสผ่าน</label>
          <input
            type="password"
            id="password"
            v-model="password"
            placeholder="กรอกรหัสผ่าน"
            required
          >
        </div>
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
        <button type="submit" class="login-btn">เข้าสู่ระบบ</button>

        <div class="login-divider">
          <span>หรือ</span>
        </div>
        <a :href="googleAuthUrl" class="google-login-btn">
          <svg class="google-icon" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
            <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
            <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
            <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
          </svg>
          Login with Google
        </a>
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

const ERROR_MESSAGES = {
  missing_code: 'ไม่ได้รับ authorization code จาก Google',
  config_missing: 'ระบบยังไม่ได้ตั้งค่า Google Login',
  no_id_token: 'ไม่ได้รับ id token จาก Google',
  no_email: 'ไม่สามารถดึงอีเมลจาก Google ได้',
  shop_not_found: 'ไม่พบร้านค้าที่ลงทะเบียนด้วยอีเมลนี้',
  auth_failed: 'ไม่สามารถยืนยันตัวตนกับ Google ได้'
}

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      error: ''
    }
  },
  computed: {
    googleAuthUrl() {
      const config = typeof useRuntimeConfig === 'function' ? useRuntimeConfig() : {}
      const apiBase = config?.public?.apiBase || ''
      return `${apiBase}/api/auth/google`
    }
  },
  mounted() {
    this.handleGoogleCallback()
  },
  methods: {
    handleGoogleCallback() {
      if (typeof window === 'undefined') return
      const params = new URLSearchParams(window.location.search)
      const googleSuccess = params.get('google_success')
      const token = params.get('token')
      const error = params.get('error')
      const email = params.get('email')

      if (error) {
        this.error = ERROR_MESSAGES[error] || (error === 'shop_not_found' && email
          ? `ไม่พบร้านค้าที่ลงทะเบียนด้วยอีเมล ${email} กรุณาติดต่อผู้ดูแลระบบ`
          : 'ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่')
        window.history.replaceState({}, document.title, window.location.pathname)
        return
      }

      if (googleSuccess === '1' && token) {
        const role = params.get('role') || 'user'
        const displayName = params.get('displayName') || ''
        let userData = {}
        try {
          const userDataStr = params.get('userData')
          if (userDataStr) userData = JSON.parse(userDataStr)
        } catch (_) {}

        sessionStorage.clear()
        sessionStorage.setItem('token', token)
        sessionStorage.setItem('displayName', displayName)
        sessionStorage.setItem('isAuthenticated', 'true')
        sessionStorage.setItem('userRole', role)
        if (userData.id) {
          sessionStorage.setItem('userId', userData.id)
          const essentialShopData = {
            id: userData.id,
            name: userData.name,
            username: userData.username,
            type: userData.type,
            description: userData.description,
            location: userData.location,
            contractStartDate: userData.contractStartDate,
            contractEndDate: userData.contractEndDate,
            canteenId: userData.canteenId,
            customId: userData.customId
          }
          sessionStorage.setItem('shopData', JSON.stringify(essentialShopData))
        }
        axios.defaults.withCredentials = true
        window.history.replaceState({}, document.title, window.location.pathname)
        if (role === 'admin') {
          this.$router.push('/admin')
        } else {
          this.$router.push('/user')
        }
      }
    },
    async handleLogin() {
      this.error = ''
      try {
        console.log('🔐 Attempting login with:', this.username)
        
        // ใช้ axios จาก plugin ที่ตั้งค่าไว้แล้ว
        const { $axios } = useNuxtApp()
        const axiosInstance = $axios || axios
        
        const response = await axiosInstance.post('/api/auth/login', {
          username: this.username,
          password: this.password
        }, {
          withCredentials: true, // สำคัญ! เพื่อให้รับ cookies
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        console.log('✅ Login response:', response.data)
        
        if (response.data.success) {
          // Clear old session data ก่อน
          sessionStorage.clear()
          
          // เก็บ token และ displayName ใน sessionStorage
          sessionStorage.setItem('token', response.data.token)
          sessionStorage.setItem('displayName', response.data.displayName || (response.data.userData && response.data.userData.name) || '')
          sessionStorage.setItem('isAuthenticated', 'true');
          sessionStorage.setItem('userRole', response.data.role);
          
          // เก็บ userId และ shopData สำหรับ user (เก็บเฉพาะข้อมูลที่จำเป็น)
          if (response.data.userData) {
            try {
              // เก็บ userId (ใช้ shop._id เป็น userId สำหรับ user)
              sessionStorage.setItem('userId', response.data.userData.id || '');
              
              // เก็บเฉพาะข้อมูลที่จำเป็น ไม่เก็บ image หรือข้อมูลใหญ่ๆ
              const essentialShopData = {
                id: response.data.userData.id,
                name: response.data.userData.name,
                username: response.data.userData.username,
                type: response.data.userData.type,
                description: response.data.userData.description,
                location: response.data.userData.location,
                contractStartDate: response.data.userData.contractStartDate,
                contractEndDate: response.data.userData.contractEndDate,
                canteenId: response.data.userData.canteenId,
                // ไม่เก็บ image เพื่อประหยัด storage
                customId: response.data.userData.customId
              };
              
              sessionStorage.setItem('shopData', JSON.stringify(essentialShopData));
              console.log('✅ Stored essential shop data (excluding image)');
            } catch (storageError) {
              console.error('⚠️ Storage error (likely quota exceeded):', storageError);
              // เก็บเฉพาะข้อมูลสำคัญที่สุด
              try {
                sessionStorage.setItem('userId', response.data.userData.id || '');
                sessionStorage.setItem('shopName', response.data.userData.name || '');
                sessionStorage.setItem('shopId', response.data.userData.id || '');
              } catch (minimalStorageError) {
                console.error('❌ Failed to store even minimal data:', minimalStorageError);
              }
            }
          }
          
          console.log('💾 Stored in sessionStorage:', {
            token: response.data.token ? 'exists' : 'missing',
            tokenValue: response.data.token ? response.data.token.substring(0, 20) + '...' : 'missing',
            displayName: response.data.displayName,
            isAuthenticated: 'true',
            userRole: response.data.role,
            userId: response.data.userData?._id || response.data.userData?.id || 'missing',
            shopData: response.data.userData?.shopData ? 'exists' : 'missing'
          })
          
          // ตั้งค่า axios
          axios.defaults.withCredentials = true
          
          // Redirect ตาม role
          if (response.data.role === 'admin') {
            console.log('🔄 Redirecting to admin page')
            await this.$router.push('/admin')
          } else if (response.data.role === 'user') {
            console.log('🔄 Redirecting to user page')
            await this.$router.push('/user')
          } else {
            console.log('🔄 Redirecting to home page')
            await this.$router.push('/')
          }
        }
      } catch (error) {
        console.error('❌ Login error:', error.response?.data || error.message)
        this.error = error.response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f8f9fa;
  background-image: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-container {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  margin: 1rem;
}

.logo-container {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  max-width: 180px;
  height: auto;
  margin-bottom: 1rem;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
  font-size: 1.8rem;
  font-weight: 600;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

label {
  color: #333;
  font-weight: 500;
  font-size: 0.95rem;
}

input {
  padding: 0.75rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #dc3545;
  box-shadow: 0 0 0 2px rgba(220, 53, 69, 0.1);
}

.error-message {
  color: #dc3545;
  text-align: center;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.login-btn {
  background-color: #dc3545;
  color: white;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.login-btn:hover {
  background-color: #c82333;
  transform: translateY(-1px);
}

.login-btn:active {
  transform: translateY(0);
}

.login-divider {
  display: flex;
  align-items: center;
  margin: 1rem 0;
  gap: 1rem;
}
.login-divider::before,
.login-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ddd;
}
.login-divider span {
  color: #888;
  font-size: 0.9rem;
}

.google-login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  color: #333;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
}
.google-login-btn:hover {
  background: #f8f9fa;
  border-color: #ccc;
  transform: translateY(-1px);
}
.google-icon {
  flex-shrink: 0;
}
</style> 