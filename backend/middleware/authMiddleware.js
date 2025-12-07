import jwt from 'jsonwebtoken';
import Session from '../models/sessionModel.js';

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

export const generateToken = (user) => {
  // Only log in development mode, and never log sensitive data
  if (process.env.NODE_ENV === 'development') {
    console.log('Generating token for user:', { id: user._id || user.id, role: user.role });
  }
  const token = jwt.sign(user, getJwtSecret(), { expiresIn: '24h' });
  return token;
};

export const verifyToken = async (req, res, next) => {
  try {
    // Only log in development mode
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
    console.log('\n=== Token Verification Started ===');
    }
    
    let token;
    
    // ตรวจสอบ token จาก Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      if (isDev) console.log('✅ Found token in Authorization header');
    }
    // ตรวจสอบ token จาก cookies (รองรับทั้ง admin และ user)
    else if (req.cookies.admin_token) {
      token = req.cookies.admin_token;
      if (isDev) console.log('✅ Found admin token in cookies');
    }
    else if (req.cookies.user_token) {
      token = req.cookies.user_token;
      if (isDev) console.log('✅ Found user token in cookies');
    }
    // รองรับ cookie เก่า (backward compatibility)
    else if (req.cookies.token) {
      token = req.cookies.token;
      if (isDev) console.log('✅ Found legacy token in cookies');
    }

    if (!token) {
      if (isDev) console.log('❌ No token found in request');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    
    if (isDev) {
    console.log('✅ Token verified successfully');
      console.log('Decoded token:', { id: decoded._id || decoded.id, role: decoded.role, shopId: decoded.shopId });
    }

    // ถ้าเป็น admin ไม่ต้องตรวจสอบ session
    if (decoded.role === 'admin') {
      req.user = decoded;
      if (isDev) console.log('✅ Admin access granted');
      return next();
    }

    // ตรวจสอบ session สำหรับ user ทั่วไป
    const session = await Session.findOne({ 
      token,
      status: 'active',
      logoutTime: null,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      if (isDev) console.log('❌ No valid session found');
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    // อัพเดท lastActivity
    session.lastActivity = new Date();
    await session.save();

    req.user = decoded;
    if (isDev) {
    console.log('✅ User verified successfully');
    console.log('=== Token Verification Completed ===\n');
    }
    next();
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Token verification error:', error.message);
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = async (req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  
  if (!req.user) {
    if (isDev) console.log('No user found in request');
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (req.user.role !== 'admin') {
    if (isDev) console.log('User is not admin. Role:', req.user.role);
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }

  if (isDev) console.log('Admin access granted');
  next();
}; 