  import express from 'express';
  import mongoose from 'mongoose';
  import dotenv from 'dotenv';
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
  import monthSettingsRoutes from './routes/monthSettingsRoutes.js';
  import rankingRoutes from './routes/rankingRoutes.js';
  import moneyHistoryRoutes from './routes/moneyHistoryRoutes.js';
  import connectDB from './config/database.js';

  dotenv.config();
  const app = express();

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
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    preflightContinue: false,
    optionsSuccessStatus: 200
  }));

  // Handle preflight requests globally
  app.options('*', cors());

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
  app.use('/api/month-settings', monthSettingsRoutes);
  app.use('/api/rankings', rankingRoutes);
  app.use('/api/money-history', moneyHistoryRoutes);

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

  // เพิ่ม error handling สำหรับ server
  server.on('error', (error) => {
    console.error('❌ Server Error:', error);
  });

  // เพิ่ม graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      mongoose.connection.close(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      mongoose.connection.close(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(0);
      });
    });
  });

  // เพิ่ม uncaught exception handler
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    server.close(() => {
      console.log('✅ Server closed due to uncaught exception');
      mongoose.connection.close(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(1);
      });
    });
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    server.close(() => {
      console.log('✅ Server closed due to unhandled rejection');
      mongoose.connection.close(() => {
        console.log('✅ MongoDB connection closed');
        process.exit(1);
      });
    });
  });

  // Connect to MongoDB and start server
  connectDB();
