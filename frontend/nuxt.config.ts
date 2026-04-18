// nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'

const apiBase = process.env.API_BASE_URL || ''
const publicSiteUrl = process.env.NUXT_PUBLIC_SITE_URL || ''
const connectSrc = [
  "'self'",
  apiBase,
  publicSiteUrl,
  'https:',
  'wss:'
].filter(Boolean).join(' ')

const imgSrc = [
  "'self'",
  'data:',
  'https:',
  apiBase
].filter(Boolean).join(' ')

export default defineNuxtConfig({
  css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.min.css', 'cropperjs/dist/cropper.css', '~/assets/css/responsive.css'],

  build: {
    transpile: ['vuetify'],
  },

  runtimeConfig: {
    public: {
      apiBase,
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
        'Content-Security-Policy': `default-src 'self'; connect-src ${connectSrc}; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; img-src ${imgSrc}; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; frame-src https://accounts.google.com;`
      }
    }
  },

  // Register plugins
  plugins: [
    { src: '~/plugins/axios.js' },
    { src: '~/plugins/socket.client.js', mode: 'client' },
    { src: '~/plugins/vuetify.js' }
  ]
})