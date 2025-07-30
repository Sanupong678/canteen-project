<template>
    <LayoutAdmin>
      <div class="canteen-management">
        <h1>จัดการโรงอาหาร</h1>
        
        <div v-if="isLoading" class="loading">
          <div class="loading-spinner"></div>
          <p>กำลังโหลดข้อมูลโรงอาหาร...</p>
        </div>
        
        <div v-else class="canteen-grid">
          <div 
            v-for="canteen in canteens" 
            :key="canteen._id" 
            class="canteen-container"
          >
                      <div class="canteen-image">
            <img 
              :src="getFullImageUrl(canteen.image)" 
              :alt="canteen.name"
              @error="handleImageError"
              crossorigin="anonymous"
            >
              <div class="image-overlay">
                <button class="edit-btn" @click="openEditModal(canteen)">
                  <i class="fas fa-edit"></i> แก้ไขรูปภาพ
                </button>
              </div>
            </div>
            <div class="canteen-info">
              <h2>{{ canteen.name }}</h2>         
              <button class="select-btn" @click="selectCanteen(canteen)">
                เลือก
              </button>
            </div>
          </div>
        </div>

        <!-- Edit Image Modal -->
        <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>แก้ไขรูปภาพ - {{ selectedCanteen?.name }}</h3>
              <button class="close-btn" @click="closeEditModal">&times;</button>
            </div>
            <div class="modal-body">
              <div class="current-image">
                <h4>รูปภาพปัจจุบัน:</h4>
                <img 
                  :src="getFullImageUrl(selectedCanteen?.image)" 
                  :alt="selectedCanteen?.name"
                  @error="handleImageError"
                  crossorigin="anonymous"
                >
              </div>
              <div class="upload-section">
                <h4>อัปโหลดรูปภาพใหม่:</h4>
                <input 
                  type="file" 
                  ref="fileInput" 
                  @change="handleFileChange" 
                  accept="image/*"
                  class="file-input"
                >
                <div v-if="selectedFile" class="preview">
                  <h5>ตัวอย่างรูปภาพใหม่:</h5>
                  <img :src="previewUrl" alt="Preview">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="cancel-btn" @click="closeEditModal">ยกเลิก</button>
              <button 
                class="save-btn" 
                @click="saveImage" 
                :disabled="!selectedFile || isUploading"
              >
                {{ isUploading ? 'กำลังอัปโหลด...' : 'บันทึก' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </LayoutAdmin>
  </template>
  
  <script>
  export default {
    name: 'CanteenManagement',
    data() {
      return {
        canteens: [],
        showEditModal: false,
        selectedCanteen: null,
        selectedFile: null,
        previewUrl: null,
        isUploading: false,
        isLoading: true
      }
    },
    async mounted() {
      await this.loadCanteens()
    },
          methods: {
        getFullImageUrl(imagePath) {
          if (!imagePath) return '/images/default-canteen.png'
          
          // ถ้าเป็น URL เต็มแล้ว ให้ใช้เลย
          if (imagePath.startsWith('http')) {
            return imagePath
          }
          
          // สร้าง full URL โดยอิงจาก backend
          const backendUrl = 'http://localhost:4000'
          return `${backendUrl}${imagePath}`
        },
        handleImageError(event) {
          // เมื่อรูปภาพโหลดไม่ได้ ให้ใช้รูปภาพ default จาก backend
          event.target.src = '/images/default-canteen.png'
          console.log('🖼️ Image failed to load, using default image')
        },
        async loadCanteens() {
          try {
            const response = await this.$axios.get('/api/canteens')
            this.canteens = response.data
          } catch (error) {
            console.error('Error loading canteens:', error)
            // ใช้ข้อมูล default ถ้าไม่สามารถโหลดจาก backend ได้
            this.canteens = [
              {
                _id: '1',
                name: 'โรงอาหาร C5',
                image: '/images/c5.png',
                path: '/admin/canteen/c5',
              },
              {
                _id: '2',
                name: 'โรงอาหาร D1',
                image: '/images/d1.png',
                path: '/admin/canteen/d1',
              },
              {
                _id: '3',
                name: 'โรงอาหาร Dormity',
                image: '/images/dorm.png',
                path: '/admin/canteen/dormity',
              },
              {
                _id: '4',
                name: 'โรงอาหาร Epark',
                image: '/images/epark.png',
                path: '/admin/canteen/epark',
              },
              {
                _id: '5',
                name: 'โรงอาหาร E1',
                image: '/images/e1.png',
                path: '/admin/canteen/e1',
              },
              {
                _id: '6',
                name: 'โรงอาหาร E2',
                image: '/images/e2.png',
                path: '/admin/canteen/e2',
              },
              {
                _id: '7',
                name: 'โรงอาหาร Msquare',
                image: '/images/msquare.png',
                path: '/admin/canteen/msquare',
              },
              {
                _id: '8',
                name: 'โรงอาหาร RuemRim',
                image: '/images/ruem.png',
                path: '/admin/canteen/ruemrim',
              },
              {
                _id: '9',
                name: 'โรงอาหาร S2',
                image: '/images/s2.png',
                path: '/admin/canteen/s2',
              }
            ]
          } finally {
            this.isLoading = false
          }
        },
        selectCanteen(canteen) {
          this.$router.push(canteen.path)
        },
      viewShopDetails(shop) {
        this.$router.push({
          name: 'shop-details',
          params: { shop }
        })
      },
      openEditModal(canteen) {
        this.selectedCanteen = canteen
        this.showEditModal = true
        this.selectedFile = null
        this.previewUrl = null
      },
      closeEditModal() {
        this.showEditModal = false
        this.selectedCanteen = null
        this.selectedFile = null
        this.previewUrl = null
        if (this.$refs.fileInput) {
          this.$refs.fileInput.value = ''
        }
      },
      handleFileChange(event) {
        const file = event.target.files[0]
        if (file) {
          this.selectedFile = file
          this.previewUrl = URL.createObjectURL(file)
        }
      },
      async saveImage() {
        if (!this.selectedFile || !this.selectedCanteen) return

        this.isUploading = true
        try {
          const formData = new FormData()
          formData.append('image', this.selectedFile)

          // อัปโหลดรูปภาพไปยัง backend
          const uploadResponse = await this.$axios.post('/api/upload/image', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })

          const newImagePath = uploadResponse.data.imagePath

          // อัปเดตข้อมูลโรงอาหารในฐานข้อมูล
          const updateResponse = await this.$axios.patch(`/api/canteens/${this.selectedCanteen._id}`, {
            image: newImagePath
          })

          // อัปเดตรูปภาพในหน้าเว็บ
          const canteenIndex = this.canteens.findIndex(c => c._id === this.selectedCanteen._id)
          if (canteenIndex !== -1) {
            this.canteens[canteenIndex].image = newImagePath
          }

          // แสดงข้อความสำเร็จ
          if (this.$toast) {
            this.$toast.success('อัปเดตรูปภาพสำเร็จ')
          } else {
            alert('อัปเดตรูปภาพสำเร็จ')
          }
          
          this.closeEditModal()
        } catch (error) {
          console.error('Error updating image:', error)
          
          // แสดงข้อความผิดพลาด
          const errorMessage = error.response?.data?.error || error.message || 'เกิดข้อผิดพลาดในการอัปเดตรูปภาพ'
          if (this.$toast) {
            this.$toast.error(errorMessage)
          } else {
            alert(errorMessage)
          }
        } finally {
          this.isUploading = false
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .canteen-management {
    padding: 20px;
  }
  
  h1 {
    color: #333;
    margin-bottom: 30px;
    font-size: 28px;
  }
  
  .canteen-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px;
  }
  
  .canteen-container {
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s;
  }
  
  .canteen-container:hover {
    transform: translateY(-5px);
  }
  
  .canteen-image {
    height: 200px;
    overflow: hidden;
    position: relative;
  }
  
  .canteen-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .canteen-container:hover .image-overlay {
    opacity: 1;
  }
  
  .edit-btn {
    background: #3498db;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
  }
  
  .edit-btn:hover {
    background: #2980b9;
  }
  
  .canteen-info {
    padding: 15px;
  }
  
  .canteen-info h2 {
    color: #333;
    margin-bottom: 15px;
    font-size: 18px;
  }
  
  .shops-list {
    margin-bottom: 15px;
  }
  
  .shop-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px;
    margin-bottom: 8px;
    background-color: #f7fafc;
    border-radius: 4px;
  }
  
  .shop-item.expired {
    background-color: #fff5f5;
  }
  
  .shop-name {
    flex: 1;
    color: #2d3748;
    font-weight: 500;
  }
  
  .shop-item.expired .shop-name {
    color: #f56565;
  }
  
  .shop-status {
    margin: 0 10px;
    padding: 2px 8px;
    background-color: #48bb78;
    color: white;
    border-radius: 4px;
    font-size: 12px;
  }
  
  .shop-status.expired {
    background-color: #f56565;
  }
  
  .details-button {
    padding: 4px 8px;
    background-color: #4299e1;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
  }
  
  .details-button:hover {
    background-color: #3182ce;
  }
  
  .no-shops {
    text-align: center;
    color: #718096;
    padding: 10px;
    font-size: 14px;
  }
  
  .select-btn {
    width: 100%;
    padding: 8px 20px;
    background-color: #e74c3c;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
  }
  
  .select-btn:hover {
    background-color: #c0392b;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-header h3 {
    margin: 0;
    color: #333;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
  }

  .close-btn:hover {
    color: #333;
  }

  .modal-body {
    padding: 20px;
  }

  .current-image {
    margin-bottom: 20px;
  }

  .current-image h4 {
    margin-bottom: 10px;
    color: #333;
  }

  .current-image img {
    width: 100%;
    max-width: 300px;
    height: 200px;
    object-fit: cover;
    border-radius: 4px;
  }

  .upload-section h4 {
    margin-bottom: 10px;
    color: #333;
  }

  .file-input {
    width: 100%;
    padding: 10px;
    border: 2px dashed #cbd5e0;
    border-radius: 4px;
    margin-bottom: 15px;
  }

  .preview {
    margin-top: 15px;
  }

  .preview h5 {
    margin-bottom: 10px;
    color: #333;
  }

  .preview img {
    width: 100%;
    max-width: 300px;
    height: 200px;
    object-fit: cover;
    border-radius: 4px;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 20px;
    border-top: 1px solid #e2e8f0;
  }

  .cancel-btn {
    padding: 10px 20px;
    background: #718096;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .cancel-btn:hover {
    background: #4a5568;
  }

  .save-btn {
    padding: 10px 20px;
    background: #48bb78;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  .save-btn:hover:not(:disabled) {
    background: #38a169;
  }

  .save-btn:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }

  /* Loading Styles */
  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading p {
    color: #666;
    font-size: 16px;
  }
  </style> 