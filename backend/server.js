  // Load environment variables FIRST before any other imports
  import dotenv from 'dotenv';
  dotenv.config();

  import express from 'express';
  import mongoose from 'mongoose';
  import cors from 'cors';
  import path from 'path';
  import multer from 'multer';
  import { fileURLToPath } from 'url';
  import cookieParser from 'cookie-parser';
  import helmet from 'helmet';
  import compression from 'compression';
  import rateLimit from 'express-rate-limit';
  import morgan from 'morgan';
  import { requestTimeout, logSlowRequests, startEventLoopMonitor, stopEventLoopMonitor } from './middleware/performanceMiddleware.js';
  import { requestProfiler } from './middleware/requestProfiler.js';

  // Routes
  import userRoutes from './routes/userRoutes.js';
  import leaveRoutes from './routes/leaveRoutes.js';
  import repairRoutes from './routes/repairRoutes.js';
  import canteenRoutes from './routes/canteenRoutes.js';
  import newsRoutes from './routes/newsRoutes.js';
  import backgroundRoutes from './routes/backgroundRoutes.js';
  import authRoutes from './routes/authRoutes.js';
  import shopRoutes from './routes/shopRoutes.js';
  import billRoutes from './routes/billRoutes.js';
  import uploadRoutes from './routes/uploadRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminNotificationRoutes from './routes/adminNotificationRoutes.js';
import evaluationRoutes from './routes/evaluationRoutes.js';
import monthlyRankingNotificationRoutes from './routes/monthlyRankingNotificationRoutes.js';
  import monthSettingsRoutes from './routes/monthSettingsRoutes.js';
  import paymentSettingsRoutes from './routes/paymentSettingsRoutes.js';
  import rankingRoutes from './routes/rankingRoutes.js';
  import moneyHistoryRoutes from './routes/moneyHistoryRoutes.js';
  import welcomeRoutes from './routes/welcomeRoutes.js';
  import evaluationTopicRoutes from './routes/evaluationTopicRoutes.js';
  import connectDB from './config/database.js';
  import { sanitizeInputs, auditLoggingMiddleware } from './middleware/securityMiddleware.js';
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

const parseAllowedOrigins = () => {
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ];

  const configuredOrigins = [
    process.env.CORS_ORIGINS || '',
    process.env.FRONTEND_URL || ''
  ]
    .join(',')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...configuredOrigins, ...defaultOrigins])];
};

const allowedOrigins = parseAllowedOrigins();
const primaryAllowedOrigin = allowedOrigins[0] || 'http://localhost:3000';
const toWsOrigin = (origin) => origin.replace(/^http:\/\//, 'ws://').replace(/^https:\/\//, 'wss://');
const isLoadTestMode = String(process.env.LOAD_TEST_MODE || '').toLowerCase() === 'true';
const isLoadOptimizedMode = String(process.env.LOAD_OPTIMIZED_MODE || '').toLowerCase() === 'true';
const isLocalRequestIp = (ip = '') => {
  const normalizedIp = String(ip).trim();
  return normalizedIp === '127.0.0.1' ||
    normalizedIp === '::1' ||
    normalizedIp === '::ffff:127.0.0.1';
};

  // Get current directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Trust proxy for rate limiting
  app.set('trust proxy', 1);
  app.use(requestProfiler);

  // 🛡️ Enhanced Security Headers with Helmet
  // Include CSP (Content Security Policy), HSTS, and other security headers
  if (!isLoadOptimizedMode) {
    app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // ⚠️ Consider removing unsafe-inline in production
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'", ...allowedOrigins, ...allowedOrigins.map(toWsOrigin)],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [] // Only in production
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'no-referrer' }
    }));
  }
  app.use(compression());

  // Logging middleware (keep lightweight in production)
  const enableHttpLog = !isProduction || String(process.env.ENABLE_HTTP_LOG || '').toLowerCase() === 'true';
  if (enableHttpLog) {
    app.use(morgan(isProduction ? 'tiny' : 'dev'));
  }
  app.use(logSlowRequests(parseInt(process.env.SLOW_REQUEST_MS, 10) || 1000));

  // CORS configuration - MUST be before rate limiting
  const corsOptions = {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS origin not allowed: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  };
  
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  // Rate limiting - AFTER CORS so preflight requests pass through
  // Keep protection enabled in production, but relax for explicit load tests
  const rateLimitMax = isLoadTestMode
    ? 100000
    : (process.env.NODE_ENV === 'production' ? 100 : 1000);
  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || (15 * 60 * 1000);
  const limiter = rateLimit({
    windowMs: rateLimitWindowMs,
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Always skip preflight.
      if (req.method === 'OPTIONS') return true;
      // Optional: bypass limiter for localhost/internal load tests.
      if (isLocalRequestIp(req.ip)) return true;
      return false;
    }
  });
  app.use(limiter);

  // Cookie parser middleware
  app.use(cookieParser());

  // 🛡️ Body parser middleware with reduced limits to prevent DoS attacks
  // BEFORE: 10mb - Now: 1mb (prevents large payload attacks)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 🛡️ Input Sanitization Middleware - keep enabled, with optional bypass for GET in high-load mode
  const skipSanitizeGet = isLoadOptimizedMode || String(process.env.SKIP_SANITIZE_GET || '').toLowerCase() === 'true';
  app.use((req, res, next) => {
    if (skipSanitizeGet && req.method === 'GET') return next();
    return sanitizeInputs(req, res, next);
  });

  // Ensure CORS headers are always present (redundant but safe)
  app.use((req, res, next) => {
    const requestOrigin = req.headers.origin;
    if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Vary', 'Origin');
    } else {
      res.setHeader('Access-Control-Allow-Origin', primaryAllowedOrigin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    next();
  });

  // Keep request handling bounded under concurrent load.
  app.use(requestTimeout(parseInt(process.env.REQUEST_TIMEOUT_MS, 10) || 15000));

 // Static files with CORS and CORP/COEP overrides for uploads
 // NOTE:
 // - helmet() above sets strict defaults like Cross-Origin-Resource-Policy: same-origin
 // - For image assets that are loaded from a different origin, we need to relax this
 // - This middleware overrides those headers specifically for /uploads/*
 app.use(
   '/uploads',
   (req, res, next) => {
     // Allow your frontend origin to load these resources
     const requestOrigin = req.headers.origin;
     if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
       res.setHeader('Access-Control-Allow-Origin', requestOrigin);
       res.setHeader('Vary', 'Origin');
     } else {
       res.setHeader('Access-Control-Allow-Origin', primaryAllowedOrigin);
     }
     res.setHeader('Access-Control-Allow-Credentials', 'true');
 
     // Relax cross-origin resource policy so images can be embedded
     res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
 
     // Make sure embedder policy doesn't block these resources
     res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
 
     next();
   },
   express.static(path.join(__dirname, 'uploads'))
 );

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dbState: mongoose.connection.readyState
    });
  });

  // Debug endpoint: connections / socket / db pool info
  app.get('/debug/health/connections', async (req, res) => {
    try {
      let socketMetrics = {};
      try {
        const { getSocketMetrics } = await import('./socket.js');
        socketMetrics = getSocketMetrics();
      } catch (e) {
        socketMetrics = { error: 'socket not initialized' };
      }

      let poolInfo = {};
      try {
        const dbModule = await import('./config/database.js');
        const getPoolInfo = dbModule.getPoolInfo;
        poolInfo = getPoolInfo ? getPoolInfo() : { error: 'pool info unavailable' };
      } catch (e) {
        poolInfo = { error: 'database module not available' };
      }

      res.json({
        timestamp: new Date().toISOString(),
        socket: socketMetrics,
        dbPool: poolInfo
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Debug endpoint: recent metrics log (last 50 entries)
  app.get('/debug/metrics/recent', async (req, res) => {
    try {
      const { readMetricsLog } = await import('./utils/metricsLogger.js');
      const lines = parseInt(req.query.lines || '50', 10);
      const metrics = readMetricsLog(Math.min(lines, 500)); // max 500 lines
      res.json({ metrics });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // 🛡️ Audit Logging Middleware - Track Admin Actions
  // Must be applied AFTER routes are defined but logs are applied to all API routes
  app.use('/api', (req, res, next) => {
    if (isLoadOptimizedMode && req.method === 'GET') return next();
    return auditLoggingMiddleware(req, res, next);
  });

  // Routes (placed BEFORE additional CORS middleware for /api)
  app.use('/api/users', userRoutes);
  app.use('/api/leaves', leaveRoutes);
  app.use('/api/repairs', repairRoutes);
  app.use('/api/canteens', canteenRoutes);
  app.use('/api/news', newsRoutes);
  app.use('/api/backgrounds', backgroundRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/shops', shopRoutes);
  app.use('/api/bills', billRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/admin-notifications', adminNotificationRoutes);
  app.use('/api/evaluations', evaluationRoutes);
  app.use('/api/monthly-ranking-notifications', monthlyRankingNotificationRoutes);
  app.use('/api/month-settings', monthSettingsRoutes);
  app.use('/api/payment-settings', paymentSettingsRoutes);
  app.use('/api/rankings', rankingRoutes);
  app.use('/api/money-history', moneyHistoryRoutes);
  app.use('/api/welcome', welcomeRoutes);
  app.use('/api/evaluation-topics', evaluationTopicRoutes);

  // MongoDB Connection
  // const connectDB = async () => {
  //   try {
  //     if (!process.env.MONGODB_URI) {
  //       throw new Error('MONGODB_URI is not defined in environment variables');
  //     }

  //     const conn = await mongoose.connect(process.env.MONGODB_URI, {
  //       useNewUrlParser: true,
  //       useUnifiedTopology: true,
  //       serverSelectionTimeoutMS: 5000,
  //       socketTimeoutMS: 45000,
  //       family: 4
  //     });
  //     console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  //   } catch (error) {
  //     console.error(`❌ MongoDB Connection Error: ${error.message}`);
  //     process.exit(1); // Exit with failure
  //   }
  // };

  // File Upload Configuration
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, 'uploads/'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
      req.fileValidationError = 'Only image files are allowed!';
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  };

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    fileFilter: fileFilter
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error(`[API_ERROR] ${req.method} ${req.originalUrl}`, err.stack || err.message);
    
    // Handle multer errors
    if (err.name === 'MulterError') {
      return res.status(400).json({
        status: 'error',
        message: 'File upload error: ' + err.message
      });
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
    
    // Handle other errors
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  });

  // Start Server
  const port = process.env.PORT || 4000;

  // เพิ่ม error handling สำหรับ server
  const server = app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    startEventLoopMonitor();
  });

  // Initialize Socket.IO
  let stopMetricsLogging = null;
  try {
    const { initSocket, getSocketMetrics } = await import('./socket.js');
    const { getPoolInfo } = await import('./config/database.js');
    const { startPeriodicMetricsLogging, logMetrics } = await import('./utils/metricsLogger.js');
    
    initSocket(server);
    console.log('🔌 Socket.IO initialized');

    // Start periodic metrics logging (every 30s)
    stopMetricsLogging = startPeriodicMetricsLogging(() => {
      return {
        socket: getSocketMetrics(),
        dbPool: getPoolInfo()
      };
    }, 30000);
    console.log('📊 Metrics logging started');
  } catch (e) {
    console.warn('⚠️ Failed to initialize Socket.IO:', e.message);
  }

  // เพิ่ม error handling สำหรับ server
  server.on('error', (error) => {
    const timestamp = new Date().toISOString();
    console.error(`\n${'='.repeat(80)}`);
    console.error(`❌ [${timestamp}] Server Error occurred:`);
    console.error(`📋 Error message:`, error.message);
    console.error(`📋 Error code:`, error.code);
    console.error(`📋 Error stack:`, error.stack);
    console.error(`📊 Server state:`, {
      listening: server.listening,
      address: server.address(),
      connections: server.connections || 'N/A'
    });
    console.error(`${'='.repeat(80)}\n`);
  });
  
  // Log เมื่อ server ถูกปิดโดยไม่คาดคิด
  server.on('close', () => {
    const timestamp = new Date().toISOString();
    if (!isShuttingDown) {
      console.error(`\n${'='.repeat(80)}`);
      console.error(`⚠️ [${timestamp}] Server closed unexpectedly (not via graceful shutdown)`);
      console.error(`📋 Close stack:`, new Error().stack);
      console.error(`${'='.repeat(80)}\n`);
    }
  });

  // Tune HTTP server timeouts to avoid premature disconnects (~30s)
  server.keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT_MS) || 65000; // default 65s
  server.headersTimeout = parseInt(process.env.HEADERS_TIMEOUT_MS) || 66000; // slightly above keepAliveTimeout
  server.requestTimeout = parseInt(process.env.REQUEST_TIMEOUT_MS) || 0; // disable request timeout by default
  try { server.setTimeout(parseInt(process.env.SOCKET_TIMEOUT_MS) || 0); } catch (_) {}

  // เก็บ reference ของ intervals และ timers เพื่อ cleanup
  const cleanupTasks = [];
  let isShuttingDown = false; // ป้องกันการเรียก shutdown หลายครั้ง (ประกาศไว้ก่อนเพื่อใช้ใน server.on('close'))
  
  const gracefulShutdown = async (signal) => {
    const timestamp = new Date().toISOString();
    const stackTrace = new Error().stack;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🛑 [${timestamp}] ${signal} received, starting graceful shutdown...`);
    console.log(`📋 Shutdown triggered from:`, stackTrace);
    console.log(`📊 Current process state:`, {
      pid: process.pid,
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      dbState: mongoose.connection.readyState,
      isShuttingDown
    });
    console.log(`${'='.repeat(80)}\n`);
    
    if (isShuttingDown) {
      console.log('⚠️ Shutdown already in progress, ignoring duplicate signal');
      return;
    }
    
    isShuttingDown = true;
    stopEventLoopMonitor();
    
    // Stop cleanup intervals
    try {
      const { stopCleanupInterval } = await import('./controllers/billController.js');
      stopCleanupInterval();
      console.log('✅ Cleanup intervals stopped');
    } catch (e) {
      console.warn('⚠️ Could not stop cleanup intervals:', e.message);
    }
    
    // Clear all intervals
    cleanupTasks.forEach((task, index) => {
      try {
        if (task && typeof task === 'function') {
          task();
          console.log(`✅ Cleaned up task ${index}`);
        } else if (task && typeof task.clear === 'function') {
          task.clear();
          console.log(`✅ Cleared interval ${index}`);
        }
      } catch (e) {
        console.error(`❌ Error cleaning up task ${index}:`, e.message);
      }
    });
    
    // Close server
    console.log('🔄 Closing HTTP server...');
    server.close(async () => {
      const closeTimestamp = new Date().toISOString();
      console.log(`✅ [${closeTimestamp}] HTTP server closed`);
      console.log('📋 Server close callback stack:', new Error().stack);
      
      try {
        console.log('🔄 Closing MongoDB connection...');
        await mongoose.connection.close();
        console.log(`✅ [${closeTimestamp}] MongoDB connection closed`);
        console.log(`\n${'='.repeat(80)}`);
        console.log(`✅ [${closeTimestamp}] Graceful shutdown completed successfully`);
        console.log(`${'='.repeat(80)}\n`);
        process.exit(0);
      } catch (error) {
        console.error(`❌ [${closeTimestamp}] Error closing MongoDB connection:`, error);
        console.error('📋 Error stack:', error.stack);
        process.exit(1);
      }
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      const timeoutTimestamp = new Date().toISOString();
      console.error(`\n${'='.repeat(80)}`);
      console.error(`❌ [${timeoutTimestamp}] Forcing shutdown after 10 second timeout`);
      console.error(`📋 This means graceful shutdown did not complete in time`);
      console.error(`${'='.repeat(80)}\n`);
      process.exit(1);
    }, 10000);
  };

  // เพิ่ม graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📥 SIGTERM signal received');
    gracefulShutdown('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    console.log('📥 SIGINT signal received (Ctrl+C)');
    gracefulShutdown('SIGINT');
  });
  
  // Log process events อื่นๆ
  process.on('exit', (code) => {
    const timestamp = new Date().toISOString();
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🚪 [${timestamp}] Process exiting with code: ${code}`);
    console.log(`📊 Final process state:`, {
      pid: process.pid,
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      }
    });
    console.log(`${'='.repeat(80)}\n`);
  });
  
  // Log warning เมื่อมี warning
  process.on('warning', (warning) => {
    const timestamp = new Date().toISOString();
    console.warn(`\n${'='.repeat(80)}`);
    console.warn(`⚠️ [${timestamp}] Process Warning`);
    console.warn(`📋 Warning name:`, warning.name);
    console.warn(`📋 Warning message:`, warning.message);
    console.warn(`📋 Warning stack:`, warning.stack);
    console.warn(`${'='.repeat(80)}\n`);
  });

  // เพิ่ม uncaught exception handler
  process.on('uncaughtException', async (error) => {
    const timestamp = new Date().toISOString();
    console.error(`\n${'='.repeat(80)}`);
    console.error(`❌ [${timestamp}] UNCAUGHT EXCEPTION - This is a critical error!`);
    console.error(`📋 Error name:`, error.name);
    console.error(`📋 Error message:`, error.message);
    console.error(`📋 Error stack:`, error.stack);
    console.error(`📊 Process state:`, {
      pid: process.pid,
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      dbState: mongoose.connection.readyState
    });
    console.error(`${'='.repeat(80)}\n`);
    
    // ใน production ให้ log error แต่ไม่ exit ทันที
    // เพื่อให้ server ยังทำงานต่อได้ (อาจมี error handler ที่ดีกว่า)
    if (isProduction) {
      console.error('⚠️ Uncaught exception in production - server will attempt to continue');
      console.error('⚠️ WARNING: Server may be in an unstable state!');
      // ไม่ exit เพื่อให้ server ยังทำงานต่อ
      // แต่ควรตรวจสอบ error และแก้ไข
    } else {
      // In development, log and keep the process alive for easier debugging
      console.warn('⚠️ Continuing after uncaught exception in development');
    }
  });

  process.on('unhandledRejection', async (reason, promise) => {
    const timestamp = new Date().toISOString();
    console.error(`\n${'='.repeat(80)}`);
    console.error(`❌ [${timestamp}] UNHANDLED REJECTION detected`);
    console.error(`📋 Promise:`, promise);
    console.error(`📋 Rejection reason:`, reason?.message || reason);
    if (reason?.name) {
      console.error(`📋 Error name:`, reason.name);
    }
    if (reason?.stack) {
      console.error(`📋 Error stack:`, reason.stack);
    }
    console.error(`📊 Process state:`, {
      pid: process.pid,
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
      },
      dbState: mongoose.connection.readyState
    });
    console.error(`⚠️ Server will continue running, but this should be fixed!`);
    console.error(`${'='.repeat(80)}\n`);
  });

  // Connect to MongoDB and start server
  connectDB();
