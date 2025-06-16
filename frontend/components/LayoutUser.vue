<template>
  <div class="user-layout">
    <!-- Navbar ชั้นที่ 1 -->
    <nav class="navbar-top">
      <div class="navbar-container">
        <div class="logo">
          <img src="/images/Logo.jpg" alt="Logo">
        </div>
        <div class="user-actions">
          <div class="notification">
            <span class="notification-icon">🔔</span>
            <span class="notification-count">3</span>
          </div>
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
          <li><router-link to="/user">หน้าแรก</router-link></li>
          <li><router-link to="/user/recommend">คำแนะนำ</router-link></li>
          <li><router-link to="/user/ranking">จัดอันดับ</router-link></li>
          <li><router-link to="/user/repair">แจ้งซ่อม</router-link></li>
          <li><router-link to="/user/leave">แจ้งลา</router-link></li>
          <li><router-link to="/user/bill">บิล</router-link></li>
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
export default {
  name: 'LayoutUser',
  data() {
    return {
      showUserMenu: false,
      displayName: localStorage.getItem('displayName') || 'User Name',
      shopData: JSON.parse(localStorage.getItem('shopData') || '{}'),
      userId: localStorage.getItem('userId')
    }
  },
  methods: {
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu
    },
    handleLogout() {
      localStorage.removeItem('userRole')
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('displayName')
      localStorage.removeItem('userId')
      localStorage.removeItem('shopData')
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
.user-layout {
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
  height: 80px;
  width: 200px;
  object-fit: contain;
  border: 2px solid #e74c3c;
  border-radius: 8px;
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
}

.nav-list a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  text-align: center;
  padding: 8px 16px;
}
.nav-list li {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-left: 100px;
}

.nav-list a:hover {
  text-decoration: underline;
}

/* Main Content */
.user-main {
  flex: 1;
  padding: 20px;
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
  