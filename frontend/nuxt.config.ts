// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.min.css', 'cropperjs/dist/cropper.css', '~/assets/css/responsive.css'],

  build: {
    transpile: ['vuetify'],
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:4000',
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID || ''
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
      },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' }
      ],
      script: []
    }
  },

  // Add nitro configuration for better SSR
  nitro: {
    preset: 'node-server'
  },

  // CSP สำหรับ dev: อนุญาต source maps, websocket, Google OAuth
  routeRules: {
    '/**': {
      headers: {
        'Content-Security-Policy': "default-src 'self'; connect-src 'self' http://localhost:3000 http://localhost:4000 ws://localhost:3000 ws://localhost:4000; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; img-src 'self' data: https: http://localhost:4000 http://127.0.0.1:4000; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; frame-src https://accounts.google.com;"
      }
    }
  },

  // Register plugins
  plugins: [
    { src: '~/plugins/socket.client.js', mode: 'client' },
    { src: '~/plugins/vuetify.js' }
  ]
})