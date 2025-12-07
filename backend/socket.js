import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

console.log('🔄 Loading socket.io heartbeat module');

let ioInstance = null;

const HEARTBEAT_INTERVAL_MS = 20000;
const HEARTBEAT_TIMEOUT_MS = 60000;

// JWT_SECRET with fallback for development mode
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'your-super-secret-jwt-key-2024-dev-only');
  if (!secret) {
    throw new Error('JWT_SECRET is required in production mode');
  }
  return secret;
};

export const initSocket = (server) => {
  if (ioInstance) return ioInstance;

  const corsOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ];

  const io = new Server(server, {
    cors: { origin: corsOrigins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], credentials: true },
    transports: ['websocket', 'polling'],
    pingInterval: 25000, // ส่ง ping ทุก 25 วินาที
    pingTimeout: 60000, // รอ 60 วินาทีก่อนตัดว่า disconnect
    allowEIO3: false,
    // เพิ่ม options สำหรับความเสถียร
    connectionStateRecovery: {
      // เปิดใช้งาน connection state recovery เพื่อ restore session หลังจาก reconnect
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true
    },
    // เพิ่ม timeout settings
    connectTimeout: 60000, // 60 seconds
    // เพิ่ม maxHttpBufferSize สำหรับ large payloads
    maxHttpBufferSize: 1e8 // 100MB
  });

  io.use((socket, next) => {
    try {
      const tokenFromAuthHeader = socket.handshake.headers.authorization?.startsWith('Bearer ')
        ? socket.handshake.headers.authorization.split(' ')[1]
        : null;
      const token = socket.handshake.auth?.token || tokenFromAuthHeader;
      if (!token) return next(); // allow anonymous; app may restrict features client-side

      const decoded = jwt.verify(token, getJwtSecret());
      socket.user = decoded;

      // Join common rooms
      socket.join('global');
      if (decoded?.role === 'admin') socket.join('admin');
      if (decoded?.shopId) socket.join(`shop:${decoded.shopId}`);

      return next();
    } catch (err) {
      // Do not block connection, but mark unauthenticated
      socket.user = null;
      return next();
    }
  });

  io.on('connection', (socket) => {
    // Basic lifecycle logs
    const id = socket.id;
    const role = socket.user?.role || 'guest';
    const shopId = socket.user?.shopId || 'none';
    console.log(`🔌 Socket connected: ${id} role=${role} shopId=${shopId}`);

    // เพิ่ม error handler
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${id}:`, error);
    });

    // Heartbeat watchdog สำหรับ socket.io v4 (ไม่ใช้ transport socket โดยตรง)
    const scheduleTimeout = () => setTimeout(() => {
      console.warn(`⚠️ Socket timed out (no heartbeat): ${id}`);
      socket.disconnect(true);
    }, HEARTBEAT_TIMEOUT_MS);

    let heartbeatTimer = scheduleTimeout();
    const resetHeartbeat = () => {
      clearTimeout(heartbeatTimer);
      heartbeatTimer = scheduleTimeout();
    };

    const heartbeatInterval = setInterval(() => {
      socket.emit('ping-check');
    }, HEARTBEAT_INTERVAL_MS);

    // รองรับทั้ง built-in pong และ custom pong-check
    socket.on('pong', resetHeartbeat);
    socket.on('pong-check', resetHeartbeat);

    // optional: mirror ping events if clientส่งมาเอง
    socket.on('ping-check', () => {
      socket.emit('pong-check');
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${id}, reason=${reason}`);
      clearTimeout(heartbeatTimer);
      clearInterval(heartbeatInterval);
    });
  });

  ioInstance = io;
  return ioInstance;
};

export const getIO = () => {
  if (!ioInstance) {
    throw new Error('Socket.io is not initialized');
  }
  return ioInstance;
};

export const emitToShop = (shopId, event, payload) => {
  try {
    if (!ioInstance) return;
    ioInstance.to(`shop:${shopId}`).emit(event, payload);
  } catch (_) {}
};

export const emitToAdmin = (event, payload) => {
  try {
    if (!ioInstance) return;
    ioInstance.to('admin').emit(event, payload);
  } catch (_) {}
};

export const emitGlobal = (event, payload) => {
  try {
    if (!ioInstance) return;
    ioInstance.to('global').emit(event, payload);
  } catch (_) {}
};




























