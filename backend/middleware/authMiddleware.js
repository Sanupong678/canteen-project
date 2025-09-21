import jwt from 'jsonwebtoken';
import Session from '../models/sessionModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';

export const generateToken = (user) => {
  console.log('Generating token for user:', user);
  const token = jwt.sign(user, JWT_SECRET, { expiresIn: '24h' });
  console.log('Generated token payload:', jwt.decode(token));
  return token;
};

export const verifyToken = async (req, res, next) => {
  try {
    console.log('\n=== Token Verification Started ===');
    console.log('Headers:', {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie
    });
    console.log('Cookies:', req.cookies);
    
    let token;
    
    // ตรวจสอบ token จาก Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✅ Found token in Authorization header:', token.substring(0, 20) + '...');
    }
    // ตรวจสอบ token จาก cookies (รองรับทั้ง admin และ user)
    else if (req.cookies.admin_token) {
      token = req.cookies.admin_token;
      console.log('✅ Found admin token in cookies:', token.substring(0, 20) + '...');
    }
    else if (req.cookies.user_token) {
      token = req.cookies.user_token;
      console.log('✅ Found user token in cookies:', token.substring(0, 20) + '...');
    }
    // รองรับ cookie เก่า (backward compatibility)
    else if (req.cookies.token) {
      token = req.cookies.token;
      console.log('✅ Found legacy token in cookies:', token.substring(0, 20) + '...');
    }

    if (!token) {
      console.log('❌ No token found in request');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Attempting to verify token...');
    console.log('🔍 Token value:', token ? token.substring(0, 20) + '...' : 'null');
    console.log('🔍 Token type:', typeof token);
    console.log('🔍 Token length:', token ? token.length : 0);
    
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified successfully');
    console.log('Decoded token:', decoded);

    // ถ้าเป็น admin ไม่ต้องตรวจสอบ session
    if (decoded.role === 'admin') {
      req.user = decoded;
      console.log('✅ Admin access granted');
      return next();
    }

    // ตรวจสอบ session สำหรับ user ทั่วไป
    const session = await Session.findOne({ 
      token,
      status: 'active',
      logoutTime: null,
      expiresAt: { $gt: new Date() }
    });
    console.log('Session found:', session ? '✅ Yes' : '❌ No');

    if (!session) {
      console.log('❌ No valid session found');
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    // อัพเดท lastActivity
    session.lastActivity = new Date();
    await session.save();

    req.user = decoded;
    console.log('✅ User verified successfully');
    console.log('=== Token Verification Completed ===\n');
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const isAdmin = async (req, res, next) => {
  console.log('Checking admin role...');
  console.log('User in request:', req.user);
  
  if (!req.user) {
    console.log('No user found in request');
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (req.user.role !== 'admin') {
    console.log('User is not admin. Role:', req.user.role);
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }

  console.log('Admin access granted');
  next();
}; 