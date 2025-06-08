import express from 'express';
import Shop from '../models/Shop.js';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get all shops for C5 canteen
router.get('/c5', async (req, res) => {
  try {
    const shops = await Shop.find({ canteenId: 1 });
    console.log('Found C5 shops:', shops);
    res.json(shops);
  } catch (error) {
    console.error('Error fetching C5 shops:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all shops for Dormity canteen
router.get('/dormity', async (req, res) => {
  try {
    const shops = await Shop.find({ canteenId: 3 });
    console.log('Found Dormity shops:', shops);
    res.json(shops);
  } catch (error) {
    console.error('Error fetching Dormity shops:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all shops for D1 canteen
router.get('/d1', async (req, res) => {
  try {
    const shops = await Shop.find({ canteenId: 2 });
    console.log('Found D1 shops:', shops);
    res.json(shops);
  } catch (error) {
    console.error('Error fetching D1 shops:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/e1', async (req, res) => {
  try {
    const shops = await Shop.find({ canteenId: 4 });
    console.log('Found E1 shops:', shops);
    res.json(shops);
  } catch (error) {
    console.error('Error fetching E1 shops:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/e2', async (req, res) => {
  try {
    const shops = await Shop.find({ canteenId: 5 });
    console.log('Found E2 shops:', shops);
    res.json(shops);
  } catch (error) {
    console.error('Error fetching E2 shops:', error);
    res.status(500).json({ message: error.message });
  }
});
  //get all shop for epark canteen
router.get('/epark', async (req, res) => {
  try {
    const shops = await Shop.find({ canteenId: 6 });
    console.log('Found Epark shops:', shops);
    res.json(shops);
  } catch (error) {
    console.error('Error fetching Epark shops:', error);
    res.status(500).json({ message: error.message });
  }
});
  //get all shop for msquare canteen
router.get('/msquare', async (req, res) => {
  try {
    const shops = await Shop.find({ canteenId: 7 });
    console.log('Found Msquare shops:', shops);
    res.json(shops);
  } catch (error) {
    console.error('Error fetching Msquare shops:', error);
    res.status(500).json({ message: error.message });
  }
});
//get all shop for ruemrim canteen
router.get('/ruemrim', async (req, res) => {
  try {
    const shops = await Shop.find({ canteenId: 8 });
    console.log('Found RuemRim shops:', shops);
    res.json(shops);
  }catch (error) {
    console.error('Error fetching RuemRim shops:', error);
    res.status(500).json({ message: error.message });
  }
});

//get all shop for s2 canteen
router.get('/s2', async (req, res) => {
  try {
    const shops = await Shop.find({ canteenId: 9 });
    console.log('Found S2 shops:', shops);
    res.json(shops);
  }catch (error) {
    console.error('Error fetching S2 shops:', error);
    res.status(500).json({ message: error.message });
  }
});
// Create a new shop
router.post('/', async (req, res) => {
  try {
    console.log('Creating new shop with data:', req.body);
    
    // Create user account first
    const { credentials } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(credentials.password, salt);
    
    const user = new User({
      name: req.body.name,
      password: hashedPassword,
      role: 'shop',
      department: 'Shop',
      position: 'Shop Owner'
    });
    
    const savedUser = await user.save();
    console.log('Created new user:', savedUser);
    
    // Get the latest shop to determine the next customId
    const latestShop = await Shop.findOne().sort({ customId: -1 });
    let nextCustomId = 'ShopID001';

    if (latestShop && latestShop.customId) {
      const currentNumber = parseInt(latestShop.customId.replace('ShopID', ''));
      nextCustomId = `ShopID${String(currentNumber + 1).padStart(3, '0')}`;
    }

    // Create shop with user reference and hashed password
    const shop = new Shop({
      ...req.body,
      customId: nextCustomId,
      credentials: {
        username: credentials.username,
        password: credentials.password,
        password_hash: hashedPassword,
        status: 'active'
      },
      userId: savedUser._id
    });
    
    const newShop = await shop.save();
    console.log('Created new shop:', newShop);
    
    // Update user with shop reference
    savedUser.shopId = newShop._id;
    await savedUser.save();
    
    res.status(201).json(newShop);
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update a shop
router.put('/:id', async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a shop
router.delete('/:id', async (req, res) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single shop
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update shop password
router.patch('/:id/password', async (req, res) => {
  try {
    const { password } = req.body;
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update shop password
    shop.credentials.password = password;        // เก็บรหัสผ่านต้นฉบับ
    shop.credentials.password_hash = hashedPassword;  // เก็บรหัสผ่านที่เข้ารหัสแล้ว
    await shop.save();

    // Update associated user password if exists
    if (shop.userId) {
      const user = await User.findById(shop.userId);
      if (user) {
        user.password = hashedPassword;
        await user.save();
      }
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update existing shop passwords to be hashed
router.post('/update-passwords', async (req, res) => {
  try {
    const shops = await Shop.find({});
    let updatedCount = 0;

    for (const shop of shops) {
      // Skip if password is already hashed (bcrypt hashed passwords start with $2)
      if (shop.credentials.password_hash && shop.credentials.password_hash.startsWith('$2')) {
        continue;
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(shop.credentials.password || '', salt);

      // Update the shop's password
      shop.credentials.password = shop.credentials.password;  // เก็บรหัสผ่านต้นฉบับ
      shop.credentials.password_hash = hashedPassword;        // เก็บรหัสผ่านที่เข้ารหัสแล้ว
      await shop.save();
      updatedCount++;

      // Also update the associated user's password if exists
      if (shop.userId) {
        const user = await User.findById(shop.userId);
        if (user) {
          user.password = hashedPassword;
          await user.save();
        }
      }
    }

    res.json({ 
      message: `Updated ${updatedCount} shop passwords to be hashed`,
      updatedCount 
    });
  } catch (error) {
    console.error('Error updating shop passwords:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router; 