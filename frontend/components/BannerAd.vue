<template>
  <div class="banner-container">
    <input
      type="file"
      ref="fileInput"
      @change="handleFileUpload"
      accept="image/*"
      style="display: none"
    />
    <div 
      class="banner-display" 
      :class="{ 'has-image': slides.length }"
      @mouseenter="pauseAutoplay"
      @mouseleave="startAutoplay"
      @click="!readOnly && isAdmin && !slides.length && triggerFileInput()"
    >
      <button 
        v-if="!readOnly && isAdmin && slides.length" 
        class="delete-btn" 
        title="ลบรูปภาพ"
        @click.stop="showDeleteConfirmation">
        <i class="fas fa-times"></i>
        <span class="btn-label">ลบรูปภาพ</span>
      </button>
      <button 
        v-if="!readOnly && isAdmin" 
        class="add-btn" 
        title="เพิ่มรูปภาพ"
        @click.stop="triggerFileInput">
        <i class="fas fa-plus"></i>
        <span class="btn-label">เพิ่มรูปภาพ</span>
      </button>
      <transition name="fade" mode="out-in" v-if="slides.length">
        <img
          :key="currentIndex"
          :src="getImageUrl(slides[currentIndex])"
          alt="Banner Advertisement"
          class="banner-image"
        />
      </transition>
      <transition name="fade" mode="out-in" v-else>
        <div class="placeholder">
          <i class="fas fa-image"></i>
          <p class="placeholder-title">พื้นที่แสดงแบนเนอร์</p>
          <p class="placeholder-desc" v-if="!readOnly && isAdmin">คลิกเพื่ออัปโหลดรูปภาพ (สูงสุด 5MB)</p>
          <p class="placeholder-desc" v-else>ยังไม่มีรูปภาพ</p>
        </div>
      </transition>

      
    </div>

    <!-- Indicators below the banner -->
    <div v-if="slides.length > 1" class="indicators">
      <button 
        v-for="(s, i) in slides" 
        :key="s._id || i" 
        :class="['dot', { active: i === currentIndex }]" 
        @click.stop="goTo(i)" type="button"
      />
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>ยืนยันการลบรูปภาพ</h3>
        <p>คุณแน่ใจหรือไม่ที่จะลบรูปภาพนี้?</p>
        <div class="modal-buttons">
          <button @click="removeImage" class="confirm-btn">ยืนยัน</button>
          <button @click="closeModal" class="cancel-btn">ยกเลิก</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'BannerAd',
  props: {
    readOnly: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      currentIndex: 0,
      isAdmin: false,
      showDeleteModal: false,
      backgrounds: [],
      autoplayTimer: null
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    async handleFileUpload(event) {
      const file = event.target.files[0]
      if (file) {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('ไฟล์มีขนาดใหญ่เกินไป กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB')
          return
        }
        
        try {
          // Open a temporary cropper for 21:9 banner
          const reader = new FileReader()
          reader.onload = async (e) => {
            // Create off-DOM image
            const img = new Image()
            img.src = e.target.result
            await new Promise(r => { img.onload = r })
            const Cropper = (await import('cropperjs')).default
            const container = document.createElement('div')
            container.style.position = 'fixed'
            container.style.inset = '0'
            container.style.background = 'rgba(0,0,0,0.7)'
            container.style.display = 'flex'
            container.style.alignItems = 'center'
            container.style.justifyContent = 'center'
            container.style.zIndex = '2000'
            const box = document.createElement('div')
            box.style.background = '#fff'
            box.style.borderRadius = '12px'
            box.style.padding = '12px'
            box.style.width = 'min(1000px, 96vw)'
            const imgEl = document.createElement('img')
            imgEl.src = img.src
            imgEl.style.maxWidth = '100%'
            box.appendChild(imgEl)
            const actions = document.createElement('div')
            actions.style.display = 'flex'
            actions.style.justifyContent = 'flex-end'
            actions.style.gap = '8px'
            actions.style.marginTop = '8px'
            const cancelBtn = document.createElement('button')
            cancelBtn.textContent = 'ยกเลิก'
            cancelBtn.className = 'btn btn-secondary'
            const okBtn = document.createElement('button')
            okBtn.textContent = 'ยืนยัน'
            okBtn.className = 'btn btn-primary'
            actions.appendChild(cancelBtn)
            actions.appendChild(okBtn)
            box.appendChild(actions)
            container.appendChild(box)
            document.body.appendChild(container)

            const cropper = new Cropper(imgEl, {
              viewMode: 1,
              dragMode: 'move',
              aspectRatio: 21 / 9, // locked for banner
              autoCropArea: 1,
              responsive: true,
              background: false,
              zoomOnWheel: true
            })

            const cleanup = () => { cropper.destroy(); document.body.removeChild(container) }
            cancelBtn.onclick = cleanup
            okBtn.onclick = async () => {
              try {
                const canvas = cropper.getCroppedCanvas()
                const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.9))
                if (!blob) { cleanup(); return }
                const token = localStorage.getItem('token')
                const backendUrl = this.getBackendUrl()
                const formData = new FormData()
                formData.append('image', new File([blob], 'banner.jpg', { type: 'image/jpeg' }))
                formData.append('title', 'Banner')
                formData.append('description', 'Banner advertisement')
                const response = await axios.post(`${backendUrl}/api/backgrounds`, formData, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                  }
                })
                if (response.data.success) {
                  await this.loadBackgrounds()
                  this.currentIndex = 0
                  alert('อัปโหลดรูปภาพสำเร็จ')
                }
              } catch (err) {
                console.error('Error uploading cropped banner:', err)
                alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
              } finally {
                cleanup()
              }
            }
          }
          reader.readAsDataURL(file)
        } catch (error) {
          console.error('Error uploading banner:', error)
          alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
        }
      }
    },
    showDeleteConfirmation() {
      this.showDeleteModal = true
    },
    closeModal() {
      this.showDeleteModal = false
    },
    async removeImage() {
      try {
        const backendUrl = this.getBackendUrl()
        console.log('🔍 Debugging removeImage:')
        console.log('- Backend URL:', backendUrl)
        console.log('- Backgrounds:', this.backgrounds)
        console.log('- Current Index:', this.currentIndex)
        
        const slides = this.slides
        const current = slides[this.currentIndex]
        console.log('- Current Background:', current)
        
        if (current) {
          const token = localStorage.getItem('token')
          console.log('- Token exists:', !!token)
          
          if (!token) {
            alert('กรุณาเข้าสู่ระบบใหม่')
            return
          }
          
          console.log('- Deleting background ID:', current._id)
          const response = await axios.delete(`${backendUrl}/api/backgrounds/${current._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          console.log('- Delete response:', response.data)
          await this.loadBackgrounds()
          this.currentIndex = 0
          this.closeModal()
          alert('ลบรูปภาพสำเร็จ')
        } else {
          console.log('- No current background found')
          alert('ไม่พบรูปภาพที่ต้องการลบ')
        }
      } catch (error) {
        console.error('❌ Error removing banner:', error)
        console.error('- Error response:', error.response?.data)
        console.error('- Error status:', error.response?.status)
        
        if (error.response?.status === 401) {
          alert('กรุณาเข้าสู่ระบบใหม่')
        } else if (error.response?.status === 404) {
          alert('ไม่พบรูปภาพที่ต้องการลบ')
        } else {
          alert(`เกิดข้อผิดพลาดในการลบรูปภาพ: ${error.response?.data?.error || error.message}`)
        }
      }
    },
    checkUserRole() {
      const userRole = localStorage.getItem('userRole')
      this.isAdmin = userRole === 'admin'
      console.log('🔍 User Role Debug:')
      console.log('- User Role:', userRole)
      console.log('- Is Admin:', this.isAdmin)
      console.log('- Read Only:', this.readOnly)
      console.log('- Current Image:', this.currentImage)
    },
    // กำหนด backend URL
    getBackendUrl() {
      return process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com' 
        : 'http://localhost:4000'
    },
    async loadBackgrounds() {
      try {
        const backendUrl = this.getBackendUrl()
        const response = await axios.get(`${backendUrl}/api/backgrounds`)
        if (response.data.success) {
          this.backgrounds = response.data.data
          this.currentIndex = 0
        }
      } catch (error) {
        console.error('Error loading backgrounds:', error)
      }
    },
    startAutoplay() {
      if (this.autoplayTimer || this.slides.length <= 1) return
      this.autoplayTimer = setInterval(this.next, 5000)
    },
    pauseAutoplay() {
      if (this.autoplayTimer) {
        clearInterval(this.autoplayTimer)
        this.autoplayTimer = null
      }
    },
    next() {
      if (!this.slides.length) return
      this.currentIndex = (this.currentIndex + 1) % this.slides.length
    },
    prev() {
      if (!this.slides.length) return
      this.currentIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length
    },
    goTo(index) {
      if (index >= 0 && index < this.slides.length) {
        this.currentIndex = index
      }
    },
    getImageUrl(bg) {
      const backendUrl = this.getBackendUrl()
      return `${backendUrl}/api/backgrounds/${bg._id}/image`
    }
  },
  computed: {
    slides() {
      const active = this.backgrounds.filter(bg => bg.isActive)
      return active.length ? active : this.backgrounds
    }
  },
  async mounted() {
    this.checkUserRole()
    await this.loadBackgrounds()
    this.startAutoplay()
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) this.pauseAutoplay(); else this.startAutoplay();
    })
  },
  beforeUnmount() {
    this.pauseAutoplay()
  }
}
</script>

<style scoped>
.banner-container {
  width: 100%;
  max-width: none;
  position: relative;
}

.banner-display {
  width: 100%;
  height: 420px;
  border: none;
  border-radius: 0;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2f7 100%);
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px rgba(0,0,0,0.06);
}

.banner-display.has-image {
  border-color: #e5e7eb;
  box-shadow: 0 10px 20px rgba(0,0,0,0.08);
}

.banner-display:hover {
  border-color: #cbd5e1;
}

.delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 6px 12px;
  background-color: rgba(220, 53, 69, 0.95);
  border-radius: 999px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  z-index: 2;
  transition: all 0.2s ease;
  border: none;
}

.delete-btn:hover {
  background-color: #dc3545;
  transform: scale(1.1);
}

.delete-btn i {
  color: white;
  font-size: 14px;
}
.delete-btn .btn-label { color: white; font-size: 13px; }

.add-btn {
  position: absolute;
  top: 10px;
  right: 110px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 2px solid #d23b2d;
  background: rgba(255,255,255,0.95);
  color: #d23b2d;
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
}

/* Indicators */
.indicators {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 12px;
}

.dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  border: 2px solid #d23b2d;
  box-sizing: border-box;
}

.dot.active {
  width: 16px;
  background: #d23b2d;
  border-color: #d23b2d;
}

/* removed arrows */

.banner-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (min-width: 1280px) {
  .banner-display {
    height: 480px;
  }
}

@media (min-width: 1536px) {
  .banner-display {
    height: 560px;
  }
}

/* Smooth fade transition - fade out old, fade in new */
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.placeholder {
  color: #374151;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.placeholder i {
  font-size: 56px;
  color: #94a3b8;
}

.placeholder-title {
  margin: 8px 0 0 0;
  font-size: 18px;
  font-weight: 700;
}

.placeholder-desc {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

/* Modal Styles */
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
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  text-align: center;
}

.modal-content h3 {
  margin-top: 0;
  color: #333;
}

.modal-content p {
  margin: 20px 0;
  color: #666;
}

.modal-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.confirm-btn, .cancel-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.confirm-btn {
  background-color: #dc3545;
  color: white;
}

.confirm-btn:hover {
  background-color: #c82333;
}

.cancel-btn {
  background-color: #6c757d;
  color: white;
}

.cancel-btn:hover {
  background-color: #5a6268;
}
</style> 