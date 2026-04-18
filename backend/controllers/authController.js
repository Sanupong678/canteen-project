import Login from '../models/loginModel.js';
import Shop from '../models/shopModel.js';
import { generateToken } from '../middleware/authMiddleware.js';
import bcrypt from 'bcryptjs';
import Session from '../models/sessionModel.js';
import { OAuth2Client } from 'google-auth-library';

// Helper function to hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Function to update all shop passwords to hash
export const updateAllShopPasswords = async (req, res) => {
  try {
    const shops = await Shop.find({});
    let updatedCount = 0;

    for (const shop of shops) {
      if (shop.credentials && !shop.credentials.password_hash) {
        // Hash the password
        const hashedPassword = await hashPassword(shop.credentials.password);
        
        // Update the shop's password_hash
        shop.credentials.password_hash = hashedPassword;
        await shop.save();
        
        updatedCount++;
        console.log(`Updated password_hash for shop: ${shop.name}`);
      }
    }

    res.json({
      success: true,
      message: `Updated ${updatedCount} shop passwords to hash`
    });
  } catch (error) {
    console.error('Error updating shop passwords:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating shop passwords'
    });
  }
};

// Function to update password to hash for a specific shop
export const updateShopPassword = async (req, res) => {
  try {
    const { username } = req.body;
    
    const shop = await Shop.findOne({ 'credentials.username': username });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found'
      });
    }

    if (shop.credentials && shop.credentials.password) {
      // Hash the password
      const hashedPassword = await hashPassword(shop.credentials.password);
      
      // Update the shop's password_hash
      shop.credentials.password_hash = hashedPassword;
      await shop.save();
      
      console.log(`Updated password_hash for shop: ${shop.name}`);
      
      res.json({
        success: true,
        message: 'Password updated to hash successfully',
        shop: {
          id: shop._id,
          name: shop.name,
          username: shop.credentials.username
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No password found for this shop'
      });
    }
  } catch (error) {
    console.error('Error updating shop password:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating shop password'
    });
  }
};

/**
 * Authorization Code Flow - Step 1: Redirect user ไป Google
 * User กด Login with Google → Backend redirect ไป Google
 */
export const googleAuthRedirect = (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.error('GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI is not set');
    return res.status(500).json({
      success: false,
      message: 'ระบบยังไม่ได้ตั้งค่า Google Login กรุณาติดต่อผู้ดูแลระบบ'
    });
  }

  const scopes = ['openid', 'email', 'profile'];
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(scopes.join(' '))}` +
    `&access_type=offline` +
    `&prompt=consent`;

  res.redirect(authUrl);
};

/**
 * Authorization Code Flow - Step 2: Google redirect กลับมาพร้อม code
 * Backend ใช้ code + Client ID + Client Secret แลก access_token และ id_token
 */
export const googleAuthCallback = async (req, res) => {
  const { code } = req.query;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    return res.status(500).json({
      success: false,
      message: 'FRONTEND_URL is required for Google OAuth callback'
    });
  }

  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=missing_code`);
  }

  if (!clientId || !clientSecret || !redirectUri || !frontendUrl) {
    console.error('GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, or FRONTEND_URL is not set');
    return res.redirect(`${frontendUrl}/login?error=config_missing`);
  }

  try {
    const client = new OAuth2Client(clientId, clientSecret, redirectUri);
    const { tokens } = await client.getToken(code);
    const idToken = tokens.id_token;

    if (!idToken) {
      return res.redirect(`${frontendUrl}/login?error=no_id_token`);
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId
    });
    const payload = ticket.getPayload();
    const email = (payload.email || '').trim().toLowerCase();

    if (!email) {
      return res.redirect(`${frontendUrl}/login?error=no_email`);
    }

    const shop = await Shop.findOne({
      'credentials.googleEmail': { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    if (!shop) {
      return res.redirect(`${frontendUrl}/login?error=shop_not_found&email=${encodeURIComponent(email)}`);
    }

    const token = generateToken({
      username: shop.credentials.username,
      role: 'user',
      shopId: shop._id,
      userId: shop.userId,
      displayName: shop.name,
      email
    });

    const session = new Session({
      userId: shop.userId,
      shopId: shop._id,
      token,
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      },
      status: 'active',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await session.save();

    const loginRecord = new Login({
      username: shop.credentials.username,
      role: 'user',
      userId: shop.userId,
      displayName: shop.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      token,
      deviceInfo: { userAgent: req.headers['user-agent'] },
      status: 'active'
    });
    await loginRecord.save();

    const userData = {
      id: shop._id,
      name: shop.name,
      username: shop.credentials.username,
      type: shop.type,
      description: shop.description,
      location: shop.location,
      contractStartDate: shop.contractStartDate,
      contractEndDate: shop.contractEndDate,
      canteenId: shop.canteenId,
      customId: shop.customId
    };

    const params = new URLSearchParams({
      google_success: '1',
      token,
      role: 'user',
      displayName: shop.name,
      userData: JSON.stringify(userData)
    });

    res.redirect(`${frontendUrl}/login?${params.toString()}`);
  } catch (error) {
    console.error('Google auth callback error:', error);
    const message = error.message || 'auth_failed';
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(message)}`);
  }
};

export const login = async (req, res) => {
  console.log('\n=== Login Request Started ===');
  
  const { username, password } = req.body;
  
  try {
    // ตรวจสอบ admin ก่อนเป็นอันดับแรก
    if (username === 'admin' && password === 'lto6rd@MFU2026') {
      console.log('Admin login successful');
      
      // สร้าง token สำหรับ admin
      const adminData = {
        username: 'admin',
        role: 'admin',
        displayName: 'Administrator'
      };
      console.log('Creating admin token with:', adminData);
      
      const token = generateToken(adminData);
      console.log('====== Token Information ======');
      console.log('Your token:', token);
      console.log('==============================');

      // บันทึกประวัติการ login
      const loginRecord = new Login({
        username: 'admin',
        role: 'admin',
        displayName: 'Administrator',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        token,
        deviceInfo: {
          userAgent: req.headers['user-agent']
        },
        status: 'active'
      });
      await loginRecord.save();

      console.log('====== Login Response ======');
      console.log('Setting cookie with token');

    // ตั้งค่า cookie สำหรับ admin (ใช้ชื่อต่างกัน)
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // เปลี่ยนเป็น lax เพื่อให้เปิดหลาย tab ได้
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

      console.log('Cookie set successfully');
      console.log('==========================');

      // ส่ง token ใน response body ด้วย
      const responseBody = {
        success: true,
        role: 'admin',
        displayName: 'Administrator',
        userData: adminData,
        token
      };
      console.log('RESPONSE BODY:', responseBody);
      return res.json(responseBody);
    }

    // ถ้าไม่ใช่ admin จึงค่อยตรวจสอบ shop
    console.log('Not admin, checking shop credentials...');
    console.log('Looking for username:', username);
    
    // ค้นหา shop โดยใช้ username (case sensitive หรือ case insensitive)
    const shop = await Shop.findOne({
      'credentials.username': { $regex: new RegExp(`^${username}$`, 'i') }
    });

    if (!shop) {
      console.log('Shop not found for username:', username);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    console.log('Shop found:', {
      id: shop._id,
      name: shop.name,
      username: shop.credentials.username,
      hasPasswordHash: !!shop.credentials.password_hash,
      hasPassword: !!shop.credentials.password
    });

    // ตรวจสอบ password_hash
    if (!shop.credentials.password_hash) {
      // ถ้าไม่มี password_hash แต่มี password ให้ hash ใหม่
      if (shop.credentials.password) {
        console.log('Hashing password for shop:', shop.name);
        shop.credentials.password_hash = await hashPassword(shop.credentials.password);
        await shop.save();
        console.log('Password hashed and saved');
      } else {
        console.error('No password or password_hash found for shop:', shop.name);
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid credentials - password not set' 
        });
      }
    }

    // ตรวจสอบ password
    console.log('Comparing password...');
    const isPasswordValid = await bcrypt.compare(password, shop.credentials.password_hash);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Invalid password for shop:', shop.name);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // สร้าง token สำหรับ shop
    const token = generateToken({ 
      username: shop.credentials.username,
      role: 'user',
      shopId: shop._id,
      userId: shop.userId,
      displayName: shop.name
    });

    // สร้าง session สำหรับ shop
    const session = new Session({
      userId: shop.userId,
      shopId: shop._id,
      token,
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      },
      status: 'active',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    await session.save();

    // บันทึกประวัติการ login
    const loginRecord = new Login({
      username: shop.credentials.username,
      role: 'user',
      userId: shop.userId,
      displayName: shop.name,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      token,
      deviceInfo: {
        userAgent: req.headers['user-agent']
      },
      status: 'active'
    });
    await loginRecord.save();

    // ตั้งค่า cookie สำหรับ user (ใช้ชื่อต่างกัน)
    res.cookie('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    // ส่งเฉพาะข้อมูลที่จำเป็น ไม่ส่ง image เพื่อประหยัด storage quota
    return res.json({
      success: true,
      role: 'user',
      displayName: shop.name,
      userData: {
        id: shop._id,
        name: shop.name,
        username: shop.credentials.username,
        type: shop.type,
        description: shop.description,
        location: shop.location,
        contractStartDate: shop.contractStartDate,
        contractEndDate: shop.contractEndDate,
        canteenId: shop.canteenId,
        customId: shop.customId
        // ไม่ส่ง image เพื่อประหยัด storage quota (สามารถดึงจาก API ได้ถ้าต้องการ)
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error during login' 
    });
  }
};

export const logout = async (req, res) => {
  try {
    // ตรวจสอบ token จาก cookies ต่างๆ
    const adminToken = req.cookies.admin_token;
    const userToken = req.cookies.user_token;
    const legacyToken = req.cookies.token;
    
    const token = adminToken || userToken || legacyToken;
    
    if (token) {
      try {
        // อัพเดทสถานะ session (ถ้ามี) - ไม่ต้อง throw error ถ้าไม่พบ session
        await Session.findOneAndUpdate(
          { token },
          { 
            status: 'logged_out',
            logoutTime: new Date()
          }
        );
      } catch (sessionError) {
        // Log error แต่ยังคงดำเนินการ logout ต่อ
        console.warn('⚠️ Session update failed during logout (non-critical):', sessionError.message);
      }
    }
    
    // ลบ cookies ทั้งหมด (สำคัญ: ต้องทำเสมอแม้ session update จะล้มเหลว)
    res.clearCookie('admin_token', { path: '/', httpOnly: true, secure: false, sameSite: 'lax' });
    res.clearCookie('user_token', { path: '/', httpOnly: true, secure: false, sameSite: 'lax' });
    res.clearCookie('token', { path: '/', httpOnly: true, secure: false, sameSite: 'lax' }); // ลบ legacy cookie ด้วย
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Error during logout:', error);
    // แม้จะเกิด error ก็ยังต้องพยายาม clear cookies
    try {
      res.clearCookie('admin_token', { path: '/', httpOnly: true, secure: false, sameSite: 'lax' });
      res.clearCookie('user_token', { path: '/', httpOnly: true, secure: false, sameSite: 'lax' });
      res.clearCookie('token', { path: '/', httpOnly: true, secure: false, sameSite: 'lax' });
    } catch (clearError) {
      console.error('❌ Failed to clear cookies:', clearError);
    }
    res.status(500).json({ success: false, message: 'Error during logout' });
  }
};

export const logoutAll = async (req, res) => {
  try {
    // อัพเดททุก session ของผู้ใช้
    await Session.updateMany(
      { userId: req.user.userId },
      { 
        status: 'logged_out',
        logoutTime: new Date()
      }
    );
    
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Error during logout all:', error);
    res.status(500).json({ success: false, message: 'Error during logout all' });
  }
};

export const getLoginHistory = async (req, res) => {
  try {
    const { username } = req.query;
    
    const query = username ? { username } : {};
    const loginHistory = await Login.find(query)
      .sort({ loginTime: -1 })
      .limit(10);

    res.json({
      success: true,
      data: loginHistory
    });
  } catch (error) {
    console.error('Error fetching login history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching login history'
    });
  }
};

export const updateShopPasswords = async (req, res) => {
  try {
    const shops = await Shop.find({});
    let updatedCount = 0;

    for (const shop of shops) {
      if (shop.credentials && shop.credentials.password) {
        // Hash the password
        const hashedPassword = await bcrypt.hash(shop.credentials.password, 10);
        
        // Update the shop's password
        shop.credentials.password = hashedPassword;
        await shop.save();
        
        updatedCount++;
        console.log(`Updated password for shop: ${shop.name}`);
      }
    }

    res.json({
      success: true,
      message: `Updated ${updatedCount} shop passwords to bcrypt hashes`
    });
  } catch (error) {
    console.error('Error updating shop passwords:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating shop passwords'
    });
  }
}; 