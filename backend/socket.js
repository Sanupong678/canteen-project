import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

console.log('🔄 Loading socket.io heartbeat module');

let ioInstance = null;

const HEARTBEAT_INTERVAL_MS = 20000;
const HEARTBEAT_TIMEOUT_MS = 60000;
// Metrics
let _connectCount = 0;
let _disconnectCount = 0;
let _lastConnectTimestamps = [];

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

  const corsOrigins = (
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (corsOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Socket CORS origin not allowed: ${origin}`));
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['content-type', 'authorization']
    },
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
    maxHttpBufferSize: 1e8, // 100MB
    // ป้องกันการ drop ซ็อกเต็ต ระหว่าง rapid page navigations
    serveClient: false // ไม่ให้ serve socket.io client library
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
    // Basic lifecycle logs - ลด log level ใน production
    const id = socket.id;
    const role = socket.user?.role || 'guest';
    const shopId = socket.user?.shopId || 'none';
    
    // Log เฉพาะใน development หรือเมื่อจำเป็น
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔌 Socket connected: ${id} role=${role} shopId=${shopId}`);
    }

    // Metrics update
    try {
      _connectCount++;
      _lastConnectTimestamps.push({ id, ts: Date.now(), role, shopId });
      if (_lastConnectTimestamps.length > 200) _lastConnectTimestamps.shift();
    } catch (_) {}

    // เพิ่ม error handler
    socket.on('error', (error) => {
      console.error(`❌ Socket error for ${id}:`, error);
    });

    // ใช้ Socket.io built-in ping/pong mechanism แทน custom heartbeat
    // Socket.io จะจัดการ ping/pong อัตโนมัติตาม pingInterval และ pingTimeout ที่ตั้งไว้
    // ไม่ต้องสร้าง custom heartbeat mechanism ที่ซ้ำซ้อน

    socket.on('disconnect', (reason) => {
      // Log เฉพาะใน development หรือเมื่อ reason ไม่ใช่ปกติ (เช่น timeout, error)
      if (process.env.NODE_ENV === 'development' || 
          (reason !== 'transport close' && reason !== 'client namespace disconnect')) {
        console.log(`🔌 Socket disconnected: ${id}, reason=${reason}`);
      }

      // Metrics update
      try {
        _disconnectCount++;
      } catch (_) {}
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

export const getSocketMetrics = () => {
  const io = ioInstance;
  const sockets = [];
  try {
    const map = io?.sockets?.sockets;
    if (map) {
      // map can be a Map (socket.io v4) or object
      if (typeof map.forEach === 'function') {
        map.forEach((s) => sockets.push({ id: s.id, rooms: Array.from(s.rooms || []), user: s.user || null }));
      } else {
        Object.values(map).forEach((s) => sockets.push({ id: s.id, rooms: Array.from(s.rooms || []), user: s.user || null }));
      }
    }
  } catch (_) {}

  // build rooms summary
  const roomsSummary = {};
  try {
    const rooms = io?.sockets?.adapter?.rooms;
    if (rooms && typeof rooms.forEach === 'function') {
      rooms.forEach((socketsSet, roomName) => {
        // ignore socket-specific rooms (room names equal socket ids)
        const isSocketRoom = sockets.some(x => x.id === roomName);
        if (!isSocketRoom) roomsSummary[roomName] = socketsSet.size || 0;
      });
    }
  } catch (_) {}

  return {
    connectCount: _connectCount,
    disconnectCount: _disconnectCount,
    activeSockets: sockets.length,
    lastConnects: _lastConnectTimestamps.slice(-20),
    roomsSummary
  };
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




























