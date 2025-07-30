import jwt from 'jsonwebtoken';
import Shop from '../models/Shop.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';

// Protect routes
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // ถ้าเป็น admin ให้ใช้ข้อมูลจาก token โดยตรง
      if (decoded.role === 'admin') {
        req.user = decoded;
        console.log('✅ Admin authenticated from token:', {
          username: req.user.username,
          role: req.user.role
        });
        return next();
      }

      // Get shop from database using shopId from token
      const shopId = decoded.shopId || decoded.userId;
      const shop = await Shop.findById(shopId);
      
      if (!shop) {
        console.log('❌ Shop not found in database:', shopId);
        return res.status(401).json({
          success: false,
          error: 'Shop not found or account has been deleted'
        });
      }

      // ตรวจสอบสถานะของ shop
      if (shop.credentials.status === 'expired') {
        console.log('❌ Shop account is expired:', shopId);
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

      console.log('✅ Shop authenticated from database:', {
        username: req.user.name,
        role: req.user.role,
        shopId: req.user.shopId,
        userId: req.user.userId
        });

      next();
    } catch (error) {
      console.error('❌ Token verification error:', error);
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Admin middleware
export const isAdmin = async (req, res, next) => {
  try {
    // ตรวจสอบ admin จาก token โดยตรง (สำหรับ admin login)
    if (req.user && req.user.role === 'admin') {
      console.log('✅ Admin access granted from token');
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
      console.log('❌ User is not admin. Role:', req.user.role);
      return res.status(403).json({
        success: false,
        error: 'Not authorized as an admin'
      });
    }

    console.log('✅ Admin access granted');
    next();
  } catch (error) {
    next(error);
  }
}; 