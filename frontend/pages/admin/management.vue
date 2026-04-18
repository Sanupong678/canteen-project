<template>
    <LayoutAdmin>
      <div class="canteen-management">
        <h1>จัดการโรงอาหาร</h1>
        
        <!-- Search Box -->
        <div class="search-container">
          <div class="search-box">
            <i class="fas fa-search search-icon"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="ค้นหาโรงอาหาร..."
              class="search-input"
              @input="filterCanteens"
            >
            <button 
              v-if="searchQuery" 
              @click="clearSearch" 
              class="clear-search-btn"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="search-results">
            <span v-if="searchQuery && filteredCanteens.length > 0">
              พบ {{ filteredCanteens.length }} รายการ
            </span>
            <span v-else-if="searchQuery && filteredCanteens.length === 0">
              ไม่พบโรงอาหารที่ค้นหา
            </span>
          </div>
        </div>
        
        <div v-if="isLoading" class="loading">
          <div class="loading-spinner"></div>
          <p>กำลังโหลดข้อมูลโรงอาหาร...</p>
        </div>
        
        <div v-else class="canteen-grid">
          <div 
            v-for="canteen in displayCanteens" 
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
        filteredCanteens: [],
        searchQuery: '',
        showEditModal: false,
        selectedCanteen: null,
        selectedFile: null,
        previewUrl: null,
        isUploading: false,
        isLoading: true
      }
    },
    computed: {
      displayCanteens() {
        return this.searchQuery ? this.filteredCanteens : this.canteens
      }
    },
    async mounted() {
      await this.loadCanteens()
    },
          methods: {
        filterCanteens() {
          if (!this.searchQuery.trim()) {
            this.filteredCanteens = []
            return
          }
          
          const query = this.searchQuery.toLowerCase().trim()
          this.filteredCanteens = this.canteens.filter(canteen => 
            canteen.name.toLowerCase().includes(query)
          )
        },
        
        clearSearch() {
          this.searchQuery = ''
          this.filteredCanteens = []
        },
        
        getFullImageUrl(imagePath) {
          const backendUrl = this.$axios.defaults.baseURL || ''
          if (!imagePath) {
            return `${backendUrl}/uploads/canteen/canteen-c5.png`
          }
          
          // ถ้าเป็น URL เต็มแล้ว ให้ใช้เลย
          if (imagePath.startsWith('http')) {
            return imagePath
          }
          
          return `${backendUrl}${imagePath}`
        },
        handleImageError(event) {
          const backendUrl = this.$axios.defaults.baseURL || ''
          event.target.src = `${backendUrl}/uploads/canteen/canteen-c5.png`
          console.log('🖼️ Image failed to load, using default image from uploads/canteen')
        },
        async loadCanteens() {
          try {
            const response = await this.$axios.get('/api/canteens')
            this.canteens = response.data
          } catch (error) {
            console.error('Error loading canteens:', error)
            this.canteens = []
          } finally {
            this.isLoading = false
          }
        },
        selectCanteen(canteen) {
          if (!canteen || !canteen.path) return
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

          // อัปโหลดรูปภาพไปยัง canteen API โดยตรง
          const updateResponse = await this.$axios.patch(`/api/canteens/${this.selectedCanteen._id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })

          // อัปเดตรูปภาพในหน้าเว็บ
          const canteenIndex = this.canteens.findIndex(c => c._id === this.selectedCanteen._id)
          if (canteenIndex !== -1) {
            this.canteens[canteenIndex].image = updateResponse.data.image
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
    font-size: clamp(1.35rem, 4vw, 1.75rem);
  }
  
  /* Search Styles */
  .search-container {
    margin-bottom: 30px;
  }
  
  .search-box {
    position: relative;
    max-width: 500px;
    margin-bottom: 10px;
  }
  
  .search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    font-size: 16px;
  }
  
  .search-input {
    width: 100%;
    padding: 12px 45px 12px 45px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 16px;
    transition: all 0.3s;
    box-sizing: border-box;
  }
  
  .search-input:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
  
  .clear-search-btn {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
    transition: all 0.3s;
  }
  
  .clear-search-btn:hover {
    background: #f1f1f1;
    color: #333;
  }
  
  .search-results {
    font-size: 14px;
    color: #666;
    margin-top: 5px;
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
    height: auto;
    aspect-ratio: 16 / 9;
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
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    padding: 10px 14px;
    background-color: #4299e1;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    width: 44px;
    height: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    height: auto;
    aspect-ratio: 16 / 9;
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
    height: auto;
    aspect-ratio: 16 / 9;
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
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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

  /* Mobile padding / spacing */
  @media (max-width: 768px) {
    .canteen-management {
      padding: 16px;
    }

    h1 {
      margin-bottom: 16px;
    }

    .search-container {
      margin-bottom: 16px;
    }

    .modal-header,
    .modal-body,
    .modal-footer {
      padding: 16px;
    }

    .current-image {
      margin-bottom: 16px;
    }

    .loading {
      padding: 24px;
    }
  }
  </style> 