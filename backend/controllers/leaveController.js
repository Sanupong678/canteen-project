import Leave from '../models/leaveModel.js';
import Shop from '../models/Shop.js';
import User from '../models/userModel.js';

// Get all leaves (admin)
export const getLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find().sort({ createdAt: -1 });

    // ดึงข้อมูลร้านค้า, ผู้ใช้ และโรงอาหารเพิ่มเติม
    const leavesWithDetails = await Promise.all(leaves.map(async (leave) => {
      const shop = await Shop.findById(leave.shopId);
      const user = await User.findById(leave.userId);
      return {
        ...leave.toObject(),
        shopName: shop ? shop.name : 'ไม่ระบุร้านค้า',
        canteen: shop ? `โรงอาหาร${getCanteenName(shop.canteenId)}` : 'ไม่ระบุโรงอาหาร',
        userName: user ? user.name : 'ไม่ระบุชื่อผู้ใช้',
        department: user ? user.department : 'ไม่ระบุแผนก',
        position: user ? user.position : 'ไม่ระบุตำแหน่ง'
      };
    }));

    res.json({ data: leavesWithDetails });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user's leaves
export const getUserLeaves = async (req, res) => {
  try {
    const userId = req.user.userId;
    const shopId = req.user.shopId;

    // ตรวจสอบว่ามี userId และ shopId หรือไม่
    if (!userId || !shopId) {
      console.log('User has no userId or shopId:', { userId, shopId });
      return res.json({ 
        data: [],
        message: 'ยังไม่เคยแจ้งลามาก่อน',
        hasHistory: false
      });
    }

    const leaves = await Leave.find({ userId }).sort({ createdAt: -1 });

    // ถ้าไม่มีประวัติการลา
    if (leaves.length === 0) {
      return res.json({ 
        data: [],
        message: 'ยังไม่เคยแจ้งลามาก่อน',
        hasHistory: false
      });
    }

    // ดึงข้อมูลร้านค้าและโรงอาหารเพิ่มเติม
    const leavesWithDetails = await Promise.all(leaves.map(async (leave) => {
      const shop = await Shop.findById(leave.shopId);
      return {
        ...leave.toObject(),
        shopName: shop ? shop.name : 'ไม่ระบุร้านค้า',
        canteen: shop ? `โรงอาหาร${getCanteenName(shop.canteenId)}` : 'ไม่ระบุโรงอาหาร'
      };
    }));

    res.json({ 
      data: leavesWithDetails,
      hasHistory: true
    });
  } catch (error) {
    console.error('Error fetching user leaves:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create new leave request
export const createLeave = async (req, res) => {
  try {
    const userId = req.user.userId;
    const shopId = req.user.shopId;
    const { startDate, endDate, issue } = req.body;

    // ตรวจสอบว่ามี userId และ shopId หรือไม่
    if (!userId || !shopId) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบข้อมูลร้านค้าหรือผู้ใช้ กรุณาติดต่อผู้ดูแลระบบ'
      });
    }

    const newLeave = new Leave({
      userId,
      shopId,
      startDate,
      endDate,
      issue,
      status: 'pending'
    });

    const savedLeave = await newLeave.save();

    // ดึงข้อมูลร้านค้าเพิ่มเติม
    const shop = await Shop.findById(shopId);
    const leaveWithDetails = {
      ...savedLeave.toObject(),
      shopName: shop ? shop.name : 'ไม่ระบุร้านค้า',
      canteen: shop ? `โรงอาหาร${getCanteenName(shop.canteenId)}` : 'ไม่ระบุโรงอาหาร'
    };

    res.status(201).json({
      success: true,
      data: leaveWithDetails
    });
  } catch (error) {
    console.error('Error creating leave:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
    });
  }
};

// Update leave status (admin only)
export const updateLeaveStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'ไม่พบรายการลานี้' });
    }

    leave.status = status;
    await leave.save();

    // ดึงข้อมูลร้านค้าเพิ่มเติม
    const shop = await Shop.findById(leave.shopId);
    const leaveWithDetails = {
      ...leave.toObject(),
      shopName: shop ? shop.name : 'ไม่ระบุร้านค้า',
      canteen: shop ? `โรงอาหาร${getCanteenName(shop.canteenId)}` : 'ไม่ระบุโรงอาหาร'
    };
    
    res.json(leaveWithDetails);
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(400).json({ message: error.message });
  }
};

// Helper function
function getCanteenName(canteenId) {
  const canteenMap = {
    1: 'C5',
    2: 'D1',
    3: 'Dormitory',
    4: 'E1',
    5: 'E2',
    6: 'Epark',
    7: 'Msquare',
    8: 'Ruemrim',
    9: 'S2'
  };
  return canteenMap[canteenId] || 'ไม่ระบุ';
}

export const updateLeave = async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, reason } = req.body;
  try {
    const updatedLeave = await Leave.findByIdAndUpdate(
      id,
      { startDate, endDate, reason },
      { new: true }
    );
    if (!updatedLeave) {
      return res.status(404).json({ message: 'Leave not found' });
    }
    res.json(updatedLeave);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteLeave = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedLeave = await Leave.findByIdAndDelete(id);
    if (!deletedLeave) {
      return res.status(404).json({ message: 'Leave not found' });
    }
    res.json({ message: 'Leave deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 