import { io } from 'socket.io-client'
import { useNotificationStore } from '@/composables/useNotificationStore'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBase || 'http://localhost:4000'

  const token = process.client ? localStorage.getItem('token') : null

  const socket = io(baseUrl, {
    transports: ['websocket'],
    auth: token ? { token } : {},
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 20000,
    withCredentials: true
  })

  socket.on('connect', () => {
    console.log('🔌 Socket connected', socket.id)
  })
  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason)
  })

  // Wire events to stores and simple refreshers
  const notificationStore = useNotificationStore()
  const safeRefreshNotifications = async () => {
    try { await notificationStore.fetchNotifications?.() } catch (_) {}
  }

  socket.on('user:notification:new', () => safeRefreshNotifications())
  socket.on('user:bill:updated', () => safeRefreshNotifications())
  socket.on('user:bill:imageCancelled', () => safeRefreshNotifications())
  socket.on('user:leave:updated', () => safeRefreshNotifications())
  socket.on('user:repair:updated', () => safeRefreshNotifications())

  // Admin side can listen and refresh lists
  nuxtApp.provide('socket', socket)
})












