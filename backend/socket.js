import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let ioInstance = null;

const getJwtSecret = () => process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';

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
    pingInterval: 25000,
    pingTimeout: 60000,
    allowEIO3: false
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

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${id}, reason=${reason}`);
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




























