<!-- components/CanteenTemplate.vue -->

<template>
    <div class="canteen-container">
      <h2>รายชื่อร้านค้าในโรงอาหาร {{ canteenName }}</h2>
  
      <!-- หัวตาราง -->
      <div class="table-header">
        <div class="store-index">ลำดับ</div>
        <div class="store-name store-name-header">รายชื่อ</div>
        <div class="store-buttons-header">การจัดการ</div>
      </div>
      <hr />
      
      <!-- รายการร้านค้า -->
      <div class="store-list">
        <div
          class="store-row"
          v-for="(store, index) in stores"
          :key="index"
        >
          <div class="store-index">{{ index + 1 }}</div>
          <div class="store-name">{{ store }}</div>
          <div class="store-buttons">
            <button class="small-button" @click="viewDetails(store)">ดูรายละเอียด</button>
            <button class="small-button red" @click="removeStore(index)">ลบ</button>
          </div>
        </div>
      </div>
  
      <!-- ปุ่มเพิ่มร้านค้า -->
      <div class="add-store-form">
        <button class="small-button-under" @click="addStore">เพิ่มร้านค้า</button>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      canteenName: {
        type: String,
        default: "C5",
      },
      initialStores: {
        type: Array,
        default: "D1",
      },
      initialStores: {
        type: Array,
        default: "Dormitory_Canteen",
      },
    },
    data() {
      return {
        stores: [...this.initialStores],
      };
    },
    methods: {
      addStore() {
        const name = prompt("กรุณากรอกชื่อร้านค้าใหม่:");
        if (name && name.trim() !== "") {
          this.stores.push(name.trim());
        }
      },
      removeStore(index) {
        this.stores.splice(index, 1);
      },
      viewDetails(store) {
        alert(`รายละเอียดของร้าน: ${store}`);
      },
    },
  };
  </script>
  
  <style scoped>
  /* ใช้ style เดิมที่คุณให้มา */
  .canteen-container {
    max-width: 1100px;
    height: 500px ;
    margin: auto;
    font-family: sans-serif;
  }
  
  .table-header {
    display: flex;
    font-weight: bold;
    margin-top: 20px;
    margin-bottom: 10px;
  }
  
  .store-index {
    width: 80px;
    text-align: center;
  }
  
  .store-name {
    flex: 1;
    text-align: left;
    padding-left: 400px;
  }
  
  .store-buttons,
  .store-buttons-header {
    width: 200px;
    display: flex;
    justify-content: center;
    gap: 10px;
  }
  
  .store-list {
    margin-top: 20px;
  }
  
  .store-row {
    display: flex;
    align-items: center;
    border: none;
    padding: 10px 0;
  }
  
  .small-button {
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    white-space: nowrap;
  }
  
  .small-button.red {
    background-color: #f44336;
    color: white;
    border: none;
  }
  
  .add-store-form {
    margin-top: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .small-button-under {
    width: 100px;
    height: 30px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: gray;
    color: white;
    border: none;
    cursor: pointer;
  }
  </style>
  