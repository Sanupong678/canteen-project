<template>
  <div class="guide-widget">
    <button class="guide-trigger" type="button" @click="openGuide" title="ดูคำแนะนำการใช้งาน">
      ?
    </button>

    <div v-if="isOpen" class="guide-overlay" @click.self="closeGuide">
      <div class="guide-card">
        <div class="guide-header">
          <h3 class="guide-title">{{ title }}</h3>
          <button class="guide-close" type="button" @click="closeGuide">ปิด</button>
        </div>

        <p v-if="intro" class="guide-intro">{{ intro }}</p>

        <ol class="guide-list">
          <li v-for="(step, index) in steps" :key="`${storageKey}-${index}`">{{ step }}</li>
        </ol>

        <label class="guide-checkbox">
          <input v-model="dontShowToday" type="checkbox" />
          <span class="check-icon">✓</span>
          <span>ไม่ต้องแสดงคำแนะนำอีกในวันนี้</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  storageKey: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  intro: {
    type: String,
    default: ''
  },
  steps: {
    type: Array,
    default: () => []
  },
  autoOpen: {
    type: Boolean,
    default: true
  }
})

const isOpen = ref(false)
const dontShowToday = ref(false)

const todayKey = () => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const loadDismissState = () => {
  if (typeof window === 'undefined') return false
  const savedDate = localStorage.getItem(`guide_dismiss_${props.storageKey}`)
  const isDismissed = savedDate === todayKey()
  dontShowToday.value = isDismissed
  return isDismissed
}

const saveDismissState = () => {
  if (typeof window === 'undefined') return
  const key = `guide_dismiss_${props.storageKey}`
  if (dontShowToday.value) {
    localStorage.setItem(key, todayKey())
  } else {
    localStorage.removeItem(key)
  }
}

const openGuide = () => {
  isOpen.value = true
}

const closeGuide = () => {
  saveDismissState()
  isOpen.value = false
}

onMounted(() => {
  const dismissedToday = loadDismissState()
  if (props.autoOpen && !dismissedToday) {
    isOpen.value = true
  }
})
</script>

<style scoped>
.guide-widget {
  display: inline-flex;
  align-items: center;
}

.guide-trigger {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  color: #1e293b;
  font-weight: 700;
  cursor: pointer;
}

.guide-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 2000;
}

.guide-card {
  width: min(560px, 96vw);
  max-height: 85vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.guide-title {
  margin: 0;
  font-size: 1rem;
  color: #0f172a;
}

.guide-close {
  border: none;
  background: #ef4444;
  color: #fff;
  border-radius: 8px;
  min-height: 36px;
  padding: 0 10px;
  cursor: pointer;
}

.guide-intro {
  margin: 10px 0 8px;
  color: #475569;
  font-size: 0.9rem;
}

.guide-list {
  margin: 0;
  padding-left: 1.1rem;
  color: #334155;
  line-height: 1.6;
}

.guide-checkbox {
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: #1f2937;
  font-size: 0.9rem;
}

.check-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #16a34a;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
</style>
