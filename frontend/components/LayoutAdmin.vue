<template>
  <div class="admin-layout">
    <!-- Navbar ชั้นที่ 1 -->
    <nav class="navbar-top">
      <div class="navbar-container">
        <div class="logo">
          <img src="/images/Logo.jpg" alt="Logo">
        </div>
        <div class="user-actions">
          <AdminNotificationDropdown />
          <div class="user-profile" @click="toggleUserMenu">
            <span class="username">{{ displayName }}</span>
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
          <li><router-link to="/admin">หน้าแรก</router-link></li>
          <li><router-link to="/admin/management">การจัดการ</router-link></li>
          <li><router-link to="/admin/ranking">จัดอันดับ</router-link></li>
          <li><router-link to="/admin/repair">แจ้งซ่อม</router-link></li>
          <li><router-link to="/admin/leave">แจ้งลา</router-link></li>
          <li><router-link to="/admin/bill">บิล</router-link></li>
        </ul>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="admin-main">
      <slot></slot>
    </main>

    <!-- Footer -->
    <footer class="admin-footer">
      <p>สำนักงานมหาวิทยาลัยส่วนกลาง กรุงเทพมหานคร</p>
      <p>127 ถ.ปัญญาอุดม 2 ชั้น 2</p>
      <p>โทรศัพท์: 0-2679-0038-9 | โทรสาร: 0-2679-0038</p>
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
      displayName: localStorage.getItem('displayName') || 'Admin User'
    }
  },
  methods: {
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu
    },
    handleLogout() {
      localStorage.removeItem('displayName')
      this.$router.push('/')
    },
    checkAuth() {
      if (process.client) {
        const isAuthenticated = localStorage.getItem('isAuthenticated')
        const userRole = localStorage.getItem('userRole')
        if (!isAuthenticated || userRole !== 'admin') {
          this.$router.push('/login')
        }
      }
    }
  },
  mounted() {
    this.checkAuth()
  }
}
</script>

<style scoped>
.admin-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Navbar ชั้นที่ 1 */
.navbar-top {
  background-color: white;
  padding: 10px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.navbar-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo img {
  height: 50px;
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
  padding: 10px 0;
}

.nav-list {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 10px;
  justify-content: center;
}

.nav-list li {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-left: 100px;
}

.nav-list a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  text-align: center;
  padding: 8px 16px;
}

.nav-list a:hover {
  text-decoration: underline;
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
  text-align: center;
  padding: 20px;
}

.admin-footer p {
  margin: 5px 0;
}
</style>
