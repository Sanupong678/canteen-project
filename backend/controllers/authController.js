import Login from '../models/loginModel.js';
import Shop from '../models/Shop.js';
import { generateToken } from '../middleware/authMiddleware.js';
import bcrypt from 'bcryptjs';
import Session from '../models/sessionModel.js';

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

export const login = async (req, res) => {
  console.log('\n=== Login Request Started ===');
  console.log('Time:', new Date().toISOString());
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const { username, password } = req.body;
  
  try {
    // Debug: Show all shops in database
    const allShops = await Shop.find({});
    console.log('\nAll shops in database:', JSON.stringify(allShops.map(shop => ({
      id: shop._id,
      name: shop.name,
      credentials: {
        username: shop.credentials.username,
        password: shop.credentials.password,
        password_hash: shop.credentials.password_hash
      }
    })), null, 2));

    // Find shop by username (case-insensitive)
    console.log('\nLooking for shop with username:', username);
    const shop = await Shop.findOne({
      'credentials.username': { $regex: new RegExp(`^${username}$`, 'i') }
    });
    
    if (shop) {
      console.log('Found shop:', {
        id: shop._id,
        name: shop.name,
        credentials: {
          username: shop.credentials.username,
          password: shop.credentials.password,
          password_hash: shop.credentials.password_hash
        }
      });

      // Check if password_hash exists
      if (!shop.credentials.password_hash && shop.credentials.password) {
        // Create password hash if it doesn't exist
        console.log('Creating password hash for shop:', shop.name);
        shop.credentials.password_hash = await hashPassword(shop.credentials.password);
        await shop.save();
        console.log('Password hash created and saved');
      }

      // Compare password with hash
      console.log('Comparing passwords:');
      console.log('Input password:', password);
      console.log('Stored password:', shop.credentials.password);
      console.log('Stored hash:', shop.credentials.password_hash);
      
      const isPasswordValid = await bcrypt.compare(password, shop.credentials.password_hash);
      console.log('Password comparison result:', isPasswordValid);
      
      if (isPasswordValid) {
        console.log('Credentials matched! Creating session...');
        const role = 'user';
        const displayName = shop.name;
        
        const token = generateToken({ 
          username, 
          role,
          shopId: shop._id,
          displayName
        });
        
        // Create session
        const session = new Session({
          userId: shop._id,
          token,
          deviceInfo: {
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
          },
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
        
        await session.save();
        console.log('Session created:', session._id);
        
        // Create login record
        const loginRecord = new Login({
          username,
          role,
          displayName,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          token,
          deviceInfo: {
            userAgent: req.headers['user-agent']
          },
          status: 'active'
        });
        
        await loginRecord.save();
        console.log('Login record created:', loginRecord._id);
        
        // Set HTTP-only cookie
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', // เปลี่ยนจาก 'strict' เป็น 'lax' เพื่อให้ทำงานได้ดีขึ้น
          maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });
        
        console.log('\n=== Login Successful ===');
        return res.json({ 
          success: true, 
          role,
          displayName,
          userData: {
            id: shop._id,
            name: shop.name,
            username: shop.credentials.username,
            type: shop.type,
            description: shop.description,
            location: shop.location,
            contractStartDate: shop.contractStartDate,
            contractEndDate: shop.contractEndDate,
            image: shop.image
          }
        });
      } else {
        console.log('Password mismatch');
      }
    } else {
      console.log('No shop found with username:', username);
    }

    // Check admin/user
    if ((username === 'admin' && password === '1234') || (username === 'user' && password === '12345')) {
      console.log('\nAdmin/User login detected');
      const role = username === 'admin' ? 'admin' : 'user';
      const displayName = role === 'admin' ? 'Administrator' : 'User';
      
      const token = generateToken({ 
        username, 
        role,
        displayName
      });
      
      const loginRecord = new Login({
        username,
        role,
        displayName,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        token,
        deviceInfo: {
          userAgent: req.headers['user-agent']
        },
        status: 'active'
      });
      
      await loginRecord.save();
      console.log('Login record created:', loginRecord._id);
      
      // Set HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });
      
      console.log('\n=== Login Successful ===');
      return res.json({ 
        success: true, 
        role,
        displayName,
        userData: {
          username,
          role,
          displayName
        }
      });
    }

    console.log('\n=== Login Failed: Invalid credentials ===');
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid credentials' 
    });
  } catch (error) {
    console.error('\n=== Login Error ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      success: false, 
      message: 'Error during login' 
    });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies.token;
    
    // อัพเดทสถานะ session
    await Session.findOneAndUpdate(
      { token },
      { 
        status: 'logged_out',
        logoutTime: new Date()
      }
    );
    
    // ลบ cookie
    res.clearCookie('token');
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ success: false, message: 'Error during logout' });
  }
};

export const logoutAll = async (req, res) => {
  try {
    // อัพเดททุก session ของผู้ใช้
    await Session.updateMany(
      { userId: req.user._id },
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