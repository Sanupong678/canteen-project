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

  dotenv.config();
  const app = express();

  // Get current directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

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
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Cookie parser middleware
  app.use(cookieParser());

  // Body parser middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Static files
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Routes
  app.use('/api/users', userRoutes);
  app.use('/api/leaves', leaveRoutes);
  app.use('/api/repairs', repairRoutes);
  app.use('/api/canteens', canteenRoutes);
  app.use('/api/news', newsRoutes);
  app.use('/api/backgrounds', backgroundRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/shops', shopRoutes);

  // MongoDB Connection
  const connectDB = async () => {
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not defined in environment variables');
      }

      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
      });
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`❌ MongoDB Connection Error: ${error.message}`);
      process.exit(1); // Exit with failure
    }
  };

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

  // Connect to MongoDB and start server
  connectDB().then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  });
