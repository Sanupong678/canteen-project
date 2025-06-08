import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useImageStore = defineStore('image', () => {
  const images = ref(loadFromLocalStorage())

  const addContainer = () => {
    images.value.push({
      url: '',
      inputText: '',
      confirmedText: '',
    })
  }

  const removeContainer = (index) => {
    images.value.splice(index, 1)
  }

  const setImageUrl = (index, url) => {
    images.value[index].url = url
  }

  const setInputText = (index, text) => {
    images.value[index].inputText = text
  }

  const confirmText = (index) => {
    images.value[index].confirmedText = images.value[index].inputText
    images.value[index].inputText = ''
  }

  watch(images, (newImages) => {
    localStorage.setItem('news_images', JSON.stringify(newImages))
  }, { deep: true })

  return {
    images,
    addContainer,
    removeContainer,
    setImageUrl,
    setInputText,
    confirmText,
  }
})

function loadFromLocalStorage() {
  const data = localStorage.getItem('news_images')
  return data ? JSON.parse(data) : []
}
