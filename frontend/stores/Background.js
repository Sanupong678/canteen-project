import { defineStore } from 'pinia'

export const useBackgroundStore = defineStore('background', {
  state: () => ({
    backgroundImages: JSON.parse(localStorage.getItem('backgroundImages')) || [
      { url: null }
    ]
  }),
  actions: {
    setBackgroundImageUrl(index, url) {
      this.backgroundImages[index].url = url;
      this.saveToLocalStorage();
    },
    removeBackgroundImage(index) {
      this.backgroundImages.splice(index, 1);
      if (this.backgroundImages.length === 0) {
        this.backgroundImages.push({ url: null });
      }
      this.saveToLocalStorage();
    },
    saveToLocalStorage() {
      localStorage.setItem('backgroundImages', JSON.stringify(this.backgroundImages));
    }
  }
})
