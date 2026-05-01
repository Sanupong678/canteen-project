import jwt from 'jsonwebtoken';
import Shop from '../models/shopModel.js';

// Lazy loading JWT_SECRET to ensure dotenv.config() has run first
let _jwtSecret = null;
let _warningShown = false;

const getJwtSecret = () => {
  if (_jwtSecret === null) {
    // Check if JWT_SECRET is set in environment
    const envSecret = process.env.JWT_SECRET;
    
    if (!envSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ CRITICAL: JWT_SECRET is not set in environment variables!');
        console.error('Please set JWT_SECRET in your .env file before running the application.');
        process.exit(1);
      } else {
        // Use default for development only
        _jwtSecret = 'your-super-secret-jwt-key-2024-dev-only';
        if (!_warningShown) {
          console.warn('⚠️  WARNING: Using default JWT_SECRET for development. This is NOT secure for production!');
          console.warn('⚠️  Please create a .env file and set JWT_SECRET with a strong random value.');
          _warningShown = true;
        }
      }
    } else {
      _jwtSecret = envSecret;
    }
  }
  return _jwtSecret;
};

// Don't initialize here - let it be lazy loaded when actually used

// Protect routes
export const protect = async (req, res, next) => {
  const perfStart = process.hrtime.bigint();
  try {
    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
    console.log('\n🔍 === DEBUG: protect middleware ===');
    }
    
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      if (isDev) console.log('✅ Found token in Authorization header');
    }
    // Check for token in cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
      if (isDev) console.log('✅ Found token in cookies');
    }

    if (!token) {
      if (isDev) console.log('❌ No token found in request');
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, getJwtSecret());
      
      if (isDev) {
      console.log('✅ Token verified successfully');
        console.log('🔍 Decoded token:', { id: decoded._id || decoded.id, role: decoded.role, shopId: decoded.shopId });
      }

      // ถ้าเป็น admin ให้ใช้ข้อมูลจาก token โดยตรง
      if (decoded.role === 'admin') {
        req.user = decoded;
        if (isDev) {
        console.log('✅ Admin authenticated from token:', {
          username: req.user.username,
          role: req.user.role
        });
        }
        req.perf?.mark('middleware.auth.protect', Number(process.hrtime.bigint() - perfStart) / 1_000_000);
        return next();
      }

      // Get shop from database using shopId from token
      const shopId = decoded.shopId || decoded.userId;
      
      const shop = await Shop.findById(shopId);
      
      if (!shop) {
        if (isDev) console.log('❌ Shop not found in database:', shopId);
        return res.status(401).json({
          success: false,
          error: 'Shop not found or account has been deleted'
        });
      }

      // ตรวจสอบสถานะของ shop
      if (shop.credentials.status === 'expired') {
        if (isDev) console.log('❌ Shop account is expired:', shopId);
        return res.status(401).json({
          success: false,
          error: 'Account has been expired'
        });
      }

      // ใช้ข้อมูลจาก database และเพิ่มข้อมูลจาก token
      req.user = {
        _id: shop._id,
        name: shop.name,
        username: shop.credentials.username,
        role: 'user',
        shopId: shop._id,
        userId: shop.userId,
        displayName: shop.name,
        type: shop.type,
        description: shop.description,
        location: shop.location,
        contractStartDate: shop.contractStartDate,
        contractEndDate: shop.contractEndDate,
        image: shop.image,
        canteenId: shop.canteenId
      };

      if (isDev) {
      console.log('✅ Shop authenticated from database:', {
        username: req.user.name,
        role: req.user.role,
        shopId: req.user.shopId,
        userId: req.user.userId
      });
      }

      req.perf?.mark('middleware.auth.protect', Number(process.hrtime.bigint() - perfStart) / 1_000_000);
      next();
    } catch (error) {
      if (isDev) {
        console.error('❌ Token verification error:', error.message);
      }
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
    console.error('❌ Protect middleware error:', error);
    }
    next(error);
  }
};

// Admin middleware
export const isAdmin = async (req, res, next) => {
  const perfStart = process.hrtime.bigint();
  try {
    const isDev = process.env.NODE_ENV === 'development';
    
    // ตรวจสอบ admin จาก token โดยตรง (สำหรับ admin login)
    if (req.user && req.user.role === 'admin') {
      if (isDev) console.log('✅ Admin access granted from token');
      req.perf?.mark('middleware.auth.isAdmin', Number(process.hrtime.bigint() - perfStart) / 1_000_000);
      return next();
    }

    // ตรวจสอบ admin จาก database (สำหรับ shop ที่เป็น admin)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // ถ้าเป็น shop ให้ตรวจสอบว่าเป็น admin หรือไม่
    if (req.user.role !== 'admin') {
      if (isDev) console.log('❌ User is not admin. Role:', req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Not authorized as an admin'
      });
    }

    if (isDev) console.log('✅ Admin access granted');
    req.perf?.mark('middleware.auth.isAdmin', Number(process.hrtime.bigint() - perfStart) / 1_000_000);
    next();
  } catch (error) {
    next(error);
  }
}; 