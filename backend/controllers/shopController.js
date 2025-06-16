import Shop from '../models/shopModel.js';
import Bill from '../models/billModel.js';

// Create shop and bill
export const createShop = async (req, res) => {
  try {
    // 1. Create shop
    const shop = new Shop(req.body);
    await shop.save();

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
      .populate('credentials.userId', 'username email')
      .sort({ createdAt: -1 });

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
      .populate('credentials.userId', 'username email');

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
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        'credentials.updatedAt': new Date()
      },
      { new: true }
    );

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบร้านค้า'
      });
    }

    // Update associated bill
    const bill = await Bill.findOne({ shopId: shop._id });
    if (bill) {
      if (req.body.name) {
        bill.shopName = req.body.name;
      }
      if (req.body.contractEndDate) {
        bill.contractEndDate = req.body.contractEndDate;
        bill.calculateNotificationDates(req.body.contractEndDate);
      }
      await bill.save();
    }

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