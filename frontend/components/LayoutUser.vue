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
              <button @click="handleLogout">ออกจากระบบ</button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- Navbar ชั้นที่ 2 -->
    <nav class="navbar-bottom">
      <div class="navbar-container">
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
      <p>สำนักงานมหาวิทยาลัยส่วนกลาง กรุงเทพมหานคร</p>
      <p>127 ถ.ปัญญาอุดม 2 ชั้น 2</p>
      <p>โทรศัพท์: 0-2679-0038-9 | โทรสาร: 0-2679-0038</p>
    </footer>
  </div>
</template>

<script>
import NotificationDropdown from './NotificationDropdown.vue'

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
      userId: null
    }
  },
  async mounted() {
    // Check if we're on the client side
    if (process.client) {
      // Set data from localStorage only on client side
      this.displayName = localStorage.getItem('displayName') || 'User Name'
      this.shopData = JSON.parse(localStorage.getItem('shopData') || '{}')
      this.userId = localStorage.getItem('userId')
      
      // ตรวจสอบ authentication
      const isAuthenticated = localStorage.getItem('isAuthenticated')
      const token = localStorage.getItem('token')
      
      if (!isAuthenticated || !token) {
        console.log('❌ User not authenticated, redirecting to login')
        this.$router.push('/login')
        return
      }
      
      // ตรวจสอบ role
      const userRole = localStorage.getItem('userRole')
      if (userRole !== 'user') {
        console.log('❌ User role is not user, redirecting to login')
        this.$router.push('/login')
        return
      }
      
      console.log('✅ User authenticated successfully')
      
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
    handleLogout() {
      if (process.client) {
        localStorage.removeItem('userRole')
        localStorage.removeItem('isAuthenticated')
        localStorage.removeItem('displayName')
        localStorage.removeItem('userId')
        localStorage.removeItem('shopData')
      }
      this.$router.push('/')
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
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Kanit:wght@400;600;700;800;900&family=Inter:wght@400;600;700&display=swap');
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
.area-right { justify-self: end; }

.brand {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo img { height: 72px; }

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
  font-family: 'Inter', 'Kanit', 'Noto Sans', sans-serif;
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
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 150px;
}

.user-menu button {
  width: 100%;
  padding: 8px;
  border: none;
  background: #e74c3c;
  color: white;
  border-radius: 4px;
  cursor: pointer;
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
.user-main {
  flex: 1;
  padding: 0 20px 20px 20px;
  background-color: #f5f6fa;
}

/* Footer */
.user-footer {
  background-color: #e74c3c;
  color: white;
  text-align: center;
  padding: 20px;
}

.user-footer p {
  margin: 5px 0;
}
</style>
  