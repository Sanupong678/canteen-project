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
      </form>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'LoginPage',
  data() {
    return {
      username: '',
      password: '',
      error: ''
    }
  },
  methods: {
    async handleLogin() {
      this.error = ''
      try {
        const response = await axios.post('http://localhost:4000/api/auth/login', {
          username: this.username,
          password: this.password
        }, {
          withCredentials: true, // สำคัญ! เพื่อให้รับ cookies
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data.success) {
          // เก็บ token และ displayName ใน localStorage
          localStorage.setItem('token', response.data.token)
          localStorage.setItem('displayName', response.data.displayName || (response.data.userData && response.data.userData.name) || '')
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userRole', response.data.role);
          // ตั้งค่า axios
          axios.defaults.withCredentials = true
          // Redirect ตาม role
          if (response.data.role === 'admin') {
            await this.$router.push('/admin')
          } else if (response.data.role === 'user') {
            await this.$router.push('/user')
          } else {
            await this.$router.push('/')
          }
        }
      } catch (error) {
        console.error('Login error:', error)
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
</style> 