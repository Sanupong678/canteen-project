// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  css: ['vuetify/styles'],

  build: {
    transpile: ['vuetify'],
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:4000'
    }
  },

  compatibilityDate: '2025-04-27'
})