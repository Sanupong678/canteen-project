import jwt from 'jsonwebtoken';
import Session from '../models/sessionModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (user) => {
  return jwt.sign(
    { 
      username: user.username,
      role: user.role,
      shopId: user.shopId,
      displayName: user.displayName
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // ตรวจสอบ session
    const session = await Session.findOne({ 
      token,
      status: 'active',
      logoutTime: null,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    // อัพเดท lastActivity
    session.lastActivity = new Date();
    await session.save();

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}; 