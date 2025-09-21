// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.min.css', 'cropperjs/dist/cropper.css'],

  build: {
    transpile: ['vuetify'],
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:4000'
    }
  },

  compatibilityDate: '2025-04-27',

  // Add SSR configuration to improve hydration
  ssr: true,

  // Add experimental features configuration
  experimental: {
    // Disable Suspense warnings by not using experimental features
    asyncContext: false,
    asyncEntry: false
  },

  // Add app configuration
  app: {
    // Improve hydration by ensuring proper mounting
    baseURL: '/',
    buildAssetsDir: '/_nuxt/',
    head: {
      htmlAttrs: {
        lang: 'th'
      }
    }
  },

  // Add nitro configuration for better SSR
  nitro: {
    preset: 'node-server'
  },

  // Register plugins
  plugins: [
    { src: '~/plugins/socket.client.js', mode: 'client' },
    { src: '~/plugins/vuetify.js' }
  ]
})