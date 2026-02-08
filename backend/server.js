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
  import rankingRoutes from './routes/rankingRoutes.js';
  import moneyHistoryRoutes from './routes/moneyHistoryRoutes.js';
  import welcomeRoutes from './routes/welcomeRoutes.js';
  import evaluationTopicRoutes from './routes/evaluationTopicRoutes.js';
  import connectDB from './config/database.js';
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';

  // Get current directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Trust proxy for rate limiting
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use(limiter);

  // Logging middleware
  app.use(morgan('dev'));

  // CORS configuration
  const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  };
  
  app.use(cors(corsOptions));

  // Handle preflight requests globally with same options
  app.options('*', cors(corsOptions));

  // Additional CORS headers for all routes
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    next();
  });

  // Cookie parser middleware
  app.use(cookieParser());

  // Body parser middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Prevent 30s drops: increase per-request timeouts
  app.use((req, res, next) => {
    const requestTimeoutMs = parseInt(process.env.REQUEST_TIMEOUT_MS) || 0; // 0 disables
    const responseTimeoutMs = parseInt(process.env.RESPONSE_TIMEOUT_MS) || 0; // 0 disables
    try { req.setTimeout(requestTimeoutMs); } catch (_) {}
    try { res.setTimeout(responseTimeoutMs); } catch (_) {}
    next();
  });

  // Static files with CORS for all uploads subdirectories
  app.use('/uploads', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    next();
  }, express.static(path.join(__dirname, 'uploads')));

  // Static files for images with CORS
  app.use('/images', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
  }, express.static(path.join(__dirname, 'images')));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dbState: mongoose.connection.readyState
    });
  });

  // Routes
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
  app.use('/api/rankings', rankingRoutes);
  app.use('/api/money-history', moneyHistoryRoutes);
  app.use('/api/welcome', welcomeRoutes);
  app.use('/api/evaluation-topics', evaluationTopicRoutes);

  // Add CORS headers for all API routes
  app.use('/api', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    next();
  });

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
    console.error(err.stack);
    
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
  });

  // Initialize Socket.IO
  try {
    const { initSocket } = await import('./socket.js');
    initSocket(server);
    console.log('🔌 Socket.IO initialized');
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
