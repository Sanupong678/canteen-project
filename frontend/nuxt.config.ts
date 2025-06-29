// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'
import { createProxyMiddleware } from 'http-proxy-middleware'

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

  compatibilityDate: '2025-04-27',

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        prependPath: false
      }
    }
  }
})