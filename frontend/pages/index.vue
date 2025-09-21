<template>
  <div class="welcome-page">
    <!-- Full Screen Banner -->
    <div class="banner-container">
      <img 
        v-if="welcomeImage" 
        :src="welcomeImage" 
        alt="Welcome Banner" 
        class="welcome-banner"
      />
      <div v-else class="default-banner">
        <div class="banner-content">
          <h1 class="banner-title">ยินดีต้อนรับสู่ระบบจัดการโรงอาหาร</h1>
          <p class="banner-subtitle">บริการครบวงจรสำหรับการจัดการโรงอาหารและร้านค้า</p>
        </div>
      </div>
      
      <!-- Login Button Overlay -->
      <div class="button-overlay">
        <router-link to="/login" class="login-button">
          <span class="button-text">เข้าสู่ระบบ</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'IndexPage',
  data() {
    return {
      welcomeImage: null
    }
  },
  async mounted() {
    await this.loadWelcomeImage();
  },
  methods: {
    async loadWelcomeImage() {
      try {
        const response = await this.$axios.get('/api/welcome/data');
        if (response.data.success && response.data.data.bannerImage) {
          // ใช้ full URL ไปยัง backend server
          this.welcomeImage = `http://localhost:4000/uploads/welcomepage/${response.data.data.bannerImage}`;
        }
      } catch (error) {
        console.log('No welcome image found or error loading:', error);
      }
    }
  }
}
</script>

<style scoped>
.welcome-page {
  min-height: 100vh;
  background: #000;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* Full Screen Banner Container */
.banner-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.welcome-banner {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.default-banner {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.default-banner::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.banner-content {
  text-align: center;
  color: white;
  z-index: 2;
  position: relative;
  padding: 20px;
}

.banner-title {
  font-size: 3rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  line-height: 1.3;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.banner-subtitle {
  font-size: 1.5rem;
  font-weight: 400;
  margin: 0;
  opacity: 0.9;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

/* Button Overlay */
.button-overlay {
  position: absolute;
  bottom: 10%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.login-button {
  display: inline-block;
  padding: 20px 50px;
  background: white;
  color: #dc3545;
  text-decoration: none;
  border-radius: 30px;
  font-size: 1.4rem;
  font-weight: 700;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
  border: none;
  cursor: pointer;
  min-width: 220px;
  position: relative;
  overflow: hidden;
}

.login-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(220, 53, 69, 0.1), transparent);
  transition: left 0.5s;
}

.login-button:hover::before {
  left: 100%;
}

.login-button:hover {
  background: #dc3545;
  color: white;
  transform: translateY(-8px);
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
  text-decoration: none;
}

.login-button:active {
  transform: translateY(-4px);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.button-text {
  position: relative;
  z-index: 2;
  font-weight: 700;
}

/* Responsive Design */
@media (max-width: 768px) {
  .banner-title {
    font-size: 2.2rem;
  }
  
  .banner-subtitle {
    font-size: 1.2rem;
  }
  
  .login-button {
    padding: 18px 40px;
    font-size: 1.2rem;
    min-width: 200px;
  }
  
  .button-overlay {
    bottom: 8%;
  }
}

@media (max-width: 480px) {
  .banner-title {
    font-size: 1.8rem;
  }
  
  .banner-subtitle {
    font-size: 1rem;
  }
  
  .login-button {
    padding: 16px 35px;
    font-size: 1.1rem;
    min-width: 180px;
  }
  
  .button-overlay {
    bottom: 5%;
  }
}
</style>
