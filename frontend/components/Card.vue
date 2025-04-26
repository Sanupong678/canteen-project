<template>
    <div class="card">
      <h2>{{ title }}</h2>
    </div>
  </template>
  
  <script setup>
  defineProps({
    title: String
  })
  </script>
  
  <style scoped>
  .card {
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 10px;
    text-align: center;
  }
  .card-img {
    width: 100px;
    margin-bottom: 10px;
  }
  </style>
  