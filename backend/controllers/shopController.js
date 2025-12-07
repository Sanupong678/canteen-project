import Shop from '../models/shopModel.js';
import Bill from '../models/billModel.js';
import Canteen from '../models/canteenModel.js';

// Mapping table สำหรับชื่อย่อโรงอาหาร
const canteenAbbreviations = {
  'โรงอาหาร C5': 'C5',
  'โรงอาหาร D1': 'D1', 
  'โรงอาหาร Dormity': 'D',
  'โรงอาหาร E1': 'E1',
  'โรงอาหาร E2': 'E2',
  'โรงอาหาร Epark': 'EP',
  'โรงอาหาร Msquare': 'MQ',
  'โรงอาหาร RuemRim': 'RRN',
  'โรงอาหาร S2': 'S2'
};

// Function สำหรับสร้าง customId ใหม่
async function generateNewCustomId(canteenId) {
  try {
    // ดึงข้อมูลโรงอาหาร
    const canteen = await Canteen.findOne({ canteenId });
    if (!canteen) {
      throw new Error(`ไม่พบโรงอาหารที่มี canteenId: ${canteenId}`);
    }
    
    const canteenName = canteen.name;
    const abbreviation = canteenAbbreviations[canteenName];
    
    if (!abbreviation) {
      throw new Error(`ไม่พบชื่อย่อสำหรับโรงอาหาร: ${canteenName}`);
    }
    
    // หาเลขลำดับถัดไป
    let nextNumber = 1;
    const pattern = new RegExp(`^${abbreviation}(\\d{3})$`);
    
    // หาเลขสูงสุดที่มีอยู่แล้ว
    const existingShops = await Shop.find({
      customId: { $regex: pattern }
    });
    
    if (existingShops.length > 0) {
      const existingNumbers = existingShops
        .map(shop => {
          const match = shop.customId.match(pattern);
          return match ? parseInt(match[1]) : 0;
        })
        .sort((a, b) => b - a);
      
      nextNumber = existingNumbers[0] + 1;
    }
    
    // สร้าง customId ใหม่ (3 หลัก)
    return `${abbreviation}${nextNumber.toString().padStart(3, '0')}`;
  } catch (error) {
    console.error('Error generating customId:', error);
    throw error;
  }
}

// Create shop and bill
export const createShop = async (req, res) => {
  try {
    // สร้าง customId ใหม่ตามรูปแบบที่กำหนด
    const newCustomId = await generateNewCustomId(req.body.canteenId);
    
    // 1. Create shop
    const shopData = {
      ...req.body,
      customId: newCustomId
    };
    const shop = new Shop(shopData);
    await shop.save();
    
    console.log(`✅ สร้างร้านค้าใหม่: ${shop.name} (${newCustomId})`);

    // 2. Create water bill
    const waterBill = new Bill({
      shopId: shop._id,
      shopName: shop.name,
      shopCustomId: shop.customId,
      canteen: shop.canteenId,
      contractStartDate: shop.contractStartDate,
      contractEndDate: shop.contractEndDate,
      billType: 'water',
      status: 'รอดำเนินการ',
      month: new Date().getMonth() + 1
    });
    await waterBill.save();

    // 3. Create electricity bill
    const electricityBill = new Bill({
      shopId: shop._id,
      shopName: shop.name,
      shopCustomId: shop.customId,
      canteen: shop.canteenId,
      contractStartDate: shop.contractStartDate,
      contractEndDate: shop.contractEndDate,
      billType: 'electricity',
      status: 'รอดำเนินการ',
      month: new Date().getMonth() + 1
    });
    await electricityBill.save();

    res.status(201).json({
      success: true,
      data: {
        shop,
        bills: [waterBill, electricityBill]
      }
    });
  } catch (error) {
    console.error('Error creating shop:', error);
    
    // จัดการ error สำหรับ duplicate username
    if (error.code === 11000 && error.keyPattern && error.keyPattern['credentials.username']) {
      return res.status(400).json({
        success: false,
        message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว กรุณาเปลี่ยนชื่อใหม่',
        errorType: 'duplicate_username',
        field: 'username'
      });
    }
    
    // จัดการ error อื่นๆ
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all shops
export const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find()
      .populate('userId', 'username email') // ใช้ userId field แยก (จาก Shop.js)
      .populate('credentials.userId', 'username email') // หรือ populate credentials.userId ถ้ามี
      .sort({ createdAt: -1 });

    // Debug: ตรวจสอบข้อมูลการประเมิน
    console.log('=== DEBUG: Shop Evaluation Data ===');
    shops.forEach(shop => {
      console.log(`Shop: ${shop.name}`);
      console.log(`  - evaluationCompleted: ${shop.evaluationCompleted}`);
      console.log(`  - evaluationDate: ${shop.evaluationDate}`);
      console.log(`  - score: ${shop.score}`);
      console.log(`  - evaluationStatus: ${shop.evaluationStatus}`);
      console.log('---');
    });

    // Get bills with notification status
    const bills = await Bill.find({
      shopId: { $in: shops.map(shop => shop._id) }
    });

    // Combine shop and bill data
    const shopsWithBills = shops.map(shop => {
      const bill = bills.find(b => b.shopId.toString() === shop._id.toString());
      return {
        ...shop.toObject(),
        bill
      };
    });

    res.json({
      success: true,
      data: shopsWithBills
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get shop by ID
export const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate('userId', 'username email') // ใช้ userId field แยก
      .populate('credentials.userId', 'username email'); // หรือ populate credentials.userId ถ้ามี

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านค้า'
      });
    }

    // Get associated bill with notification status
    const bill = await Bill.findOne({ shopId: shop._id });

    res.json({
      success: true,
      data: {
        shop,
        bill
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update shop
export const updateShop = async (req, res) => {
  try {
    console.log('=== DEBUG: Updating Shop ===');
    console.log('Shop ID:', req.params.id);
    console.log('Update data:', req.body);
    
    // แยก credentials object ออกมาเพื่อป้องกัน conflict
    const { credentials, ...otherFields } = req.body;
    
    // สร้าง update object โดยใช้ dot notation สำหรับ nested fields
    const updateData = { ...otherFields };
    
    // ถ้ามีการส่ง credentials มา ให้แปลงเป็น dot notation
    if (credentials && typeof credentials === 'object') {
      // ใช้ $set operator สำหรับ nested fields
      Object.keys(credentials).forEach(key => {
        updateData[`credentials.${key}`] = credentials[key];
      });
      
      // อัพเดท credentials.updatedAt อัตโนมัติ
      updateData['credentials.updatedAt'] = new Date();
    }
    
    console.log('Update data with dot notation:', updateData);
    
    // อัพเดท shop ใน database โดยใช้ $set operator เพื่อป้องกัน conflict
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true // ตรวจสอบ validation
      }
    );

    if (!shop) {
      console.error('Shop not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านค้า'
      });
    }
    
    // ตรวจสอบว่า shop ถูกบันทึกแล้ว
    console.log('✅ Shop updated in database:', {
      _id: shop._id,
      name: shop.name,
      customId: shop.customId,
      evaluationCompleted: shop.evaluationCompleted,
      evaluationDate: shop.evaluationDate,
      score: shop.score,
      evaluationStatus: shop.evaluationStatus
    });

    // Update associated bills (อาจมีหลาย bills)
    const bills = await Bill.find({ shopId: shop._id });
    if (bills && bills.length > 0) {
      for (const bill of bills) {
        let billUpdated = false;
        
        if (req.body.name && bill.shopName !== req.body.name) {
          bill.shopName = req.body.name;
          billUpdated = true;
        }
        
        if (req.body.contractEndDate && bill.contractEndDate !== new Date(req.body.contractEndDate)) {
          bill.contractEndDate = new Date(req.body.contractEndDate);
          if (bill.calculateNotificationDates) {
            bill.calculateNotificationDates(req.body.contractEndDate);
          }
          billUpdated = true;
        }
        
        if (billUpdated) {
          await bill.save();
          console.log(`✅ Bill ${bill._id} updated for shop ${shop.name}`);
        }
      }
    }

    // ส่งกลับ shop object ที่อัปเดตแล้ว
    res.json({
      success: true,
      data: {
        shop,
        bills: bills || []
      }
    });
  } catch (error) {
    console.error('❌ Error updating shop:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการอัพเดทร้านค้า'
    });
  }
};

// Delete shop
export const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านค้า'
      });
    }

    // Delete associated bill
    await Bill.findOneAndDelete({ shopId: shop._id });

    res.json({
      success: true,
      message: 'ลบร้านค้าและบิลที่เกี่ยวข้องเรียบร้อยแล้ว'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 

// Debug: Check evaluation data
export const checkEvaluationData = async (req, res) => {
  try {
    console.log('=== DEBUG: Checking Evaluation Data ===');
    
    const shops = await Shop.find().select('name evaluationCompleted evaluationDate score evaluationStatus');
    
    console.log('All shops evaluation data:');
    shops.forEach(shop => {
      console.log(`Shop: ${shop.name}`);
      console.log(`  - evaluationCompleted: ${shop.evaluationCompleted}`);
      console.log(`  - evaluationDate: ${shop.evaluationDate}`);
      console.log(`  - score: ${shop.score}`);
      console.log(`  - evaluationStatus: ${shop.evaluationStatus}`);
      console.log('---');
    });
    
    res.json({
      success: true,
      data: shops,
      message: 'Evaluation data checked successfully'
    });
  } catch (error) {
    console.error('Error checking evaluation data:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}; 