<template>
  <LayoutAdmin>
    <div class="canteen-management">
      <h1>จัดการโรงอาหาร</h1>
      <div class="canteen-grid">
        <div 
          v-for="canteen in canteens" 
          :key="canteen.id" 
          class="canteen-container"
        >
          <div class="canteen-image">
            <img :src="canteen.image" :alt="canteen.name">
          </div>
          <div class="canteen-info">
            <h2>{{ canteen.name }}</h2>
            <button class="select-btn" @click="selectCanteen(canteen)">
              เลือก
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
      canteens: [
        {
          id: 1,
          name: 'โรงอาหาร C5',
          image: '/images/C5.jpg',
          path: '/admin/canteen/c5'
        },
        {
          id: 2,
          name: 'โรงอาหาร D1',
          image: '/images/D1.jpg',
          path: '/admin/canteen/d1'
        },
        {
          id: 3,
          name: 'โรงอาหาร Dormity',
          image: '/images/Dormity.jpg',
          path: '/admin/canteen/dormity'
        },
        {
          id: 4,
          name: 'โรงอาหาร E1',
          image: '/images/E1.jpg',
          path: '/admin/canteen/e1'
        },
        {
          id: 5,
          name: 'โรงอาหาร E2',
          image: '/images/E2.jpg',
          path: '/admin/canteen/e2'
        },
        {
          id: 6,
          name: 'โรงอาหาร Epark',
          image: '/images/Epark.jpg',
          path: '/admin/canteen/epark'
        },
        {
          id: 7,
          name: 'โรงอาหาร Msquare',
          image: '/images/Msquare.jpg',
          path: '/admin/canteen/msquare'
        },
        {
          id: 8,
          name: 'โรงอาหาร RuemRim',
          image: '/images/RuemRim.jpg',
          path: '/admin/canteen/ruemrim'
        },
        {
          id: 9,
          name: 'โรงอาหาร S2',
          image: '/images/S2.jpg',
          path: '/admin/canteen/s2'
        }
      ]
    }
  },
  methods: {
    selectCanteen(canteen) {
      this.$router.push(canteen.path)
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
}

.canteen-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.canteen-info {
  padding: 15px;
  text-align: center;
}

.canteen-info h2 {
  color: #333;
  margin-bottom: 15px;
  font-size: 18px;
}

.select-btn {
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
</style> 