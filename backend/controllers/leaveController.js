import Leave from '../models/leaveModel.js';
import Shop from '../models/shopModel.js';
import User from '../models/userModel.js';
import { createLeaveNotification } from './notificationController.js';
import { createAdminLeaveNotification } from './adminNotificationController.js';
import { emitToShop, emitToAdmin } from '../socket.js';

// Get all leaves (admin)
export const getLeaves = async (req, res) => {
  try {
    // ดึงข้อมูลการลาทั้งหมด
    const leaves = await Leave.find()
      .sort({ createdAt: -1 })
      .lean(); // ใช้ lean() เพื่อเพิ่มความเร็ว

    // รวบรวม shopIds และ userIds ทั้งหมด
    const shopIds = [...new Set(leaves.map(leave => leave.shopId?.toString()).filter(Boolean))];
    const userIds = [...new Set(leaves.map(leave => leave.userId?.toString()).filter(Boolean))];
    
    // Query shops และ users ทั้งหมดในครั้งเดียว (batch query)
    const [shops, users] = await Promise.all([
      Shop.find({ _id: { $in: shopIds } })
        .select('name canteenId') // เลือกเฉพาะ fields ที่จำเป็น
        .lean(),
      User.find({ _id: { $in: userIds } })
        .select('name department position') // เลือกเฉพาะ fields ที่จำเป็น
        .lean()
    ]);
    
    // สร้าง Map เพื่อ lookup เร็ว
    const shopMap = new Map();
    shops.forEach(shop => {
      shopMap.set(shop._id.toString(), shop);
    });
    
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user._id.toString(), user);
    });

    // Map ข้อมูล leaves พร้อม shop และ user details
    const leavesWithDetails = leaves.map(leave => {
      const shop = shopMap.get(leave.shopId?.toString());
      const user = userMap.get(leave.userId?.toString());
      return {
        ...leave,
        shopName: shop ? shop.name : 'ไม่ระบุร้านค้า',
        canteen: shop ? `โรงอาหาร${getCanteenName(shop.canteenId)}` : 'ไม่ระบุโรงอาหาร',
        userName: user ? user.name : 'ไม่ระบุชื่อผู้ใช้',
        department: user ? user.department : 'ไม่ระบุแผนก',
        position: user ? user.position : 'ไม่ระบุตำแหน่ง'
      };
    });

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
    
    // สร้าง notification สำหรับ admin
    try {
      await createAdminLeaveNotification(savedLeave, req.user);
      console.log('✅ Admin leave notification created');
      emitToAdmin('admin:leave:new', { leaveId: savedLeave._id, shopId });
    } catch (notificationError) {
      console.error('❌ Error creating admin leave notification:', notificationError);
    }
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
    console.log('🔍 Update leave status request:', { id, status, body: req.body });
    
    const leave = await Leave.findById(id);
    if (!leave) {
      console.log('❌ Leave not found:', id);
      return res.status(404).json({ message: 'ไม่พบรายการลานี้' });
    }

    console.log('📋 Leave before update:', {
      id: leave._id,
      shopId: leave.shopId,
      status: leave.status,
      issue: leave.issue
    });

    leave.status = status;
    await leave.save();

    console.log('✅ Leave updated successfully:', {
      id: leave._id,
      shopId: leave.shopId,
      status: leave.status,
      issue: leave.issue
    });

    // สร้าง notification สำหรับ user
    try {
      await createLeaveNotification(leave, status);
      console.log('✅ Leave notification created');
      emitToShop(leave.shopId, 'user:leave:updated', { leaveId: leave._id, status: leave.status });
    } catch (notificationError) {
      console.error('❌ Error creating leave notification:', notificationError);
    }

    // ดึงข้อมูลร้านค้าเพิ่มเติม
    const shop = await Shop.findById(leave.shopId);
    const leaveWithDetails = {
      ...leave.toObject(),
      shopName: shop ? shop.name : 'ไม่ระบุร้านค้า',
      canteen: shop ? `โรงอาหาร${getCanteenName(shop.canteenId)}` : 'ไม่ระบุโรงอาหาร'
    };
    
    res.json(leaveWithDetails);
  } catch (error) {
    console.error('❌ Error updating leave status:', error);
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

// Update leave (user can update their own leaves if status is pending)
export const updateLeave = async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, issue } = req.body;
  const userId = req.user.userId;
  const shopId = req.user.shopId;

  try {
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ 
        success: false,
        message: 'ไม่พบรายการลานี้' 
      });
    }

    // ตรวจสอบว่าเป็นเจ้าของ leave หรือไม่
    if (leave.userId.toString() !== userId.toString() || leave.shopId.toString() !== shopId.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'คุณไม่มีสิทธิ์แก้ไขรายการนี้' 
      });
    }

    // ตรวจสอบว่าสถานะเป็น pending หรือไม่ (แก้ไขได้เฉพาะรายการที่ยังรออนุมัติ)
    if (leave.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'ไม่สามารถแก้ไขรายการที่อนุมัติหรือไม่อนุมัติแล้ว' 
      });
    }

    // ตรวจสอบวันที่
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (start > end) {
        return res.status(400).json({
          success: false,
          message: 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด'
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (start < today) {
        return res.status(400).json({
          success: false,
          message: 'ไม่สามารถลาย้อนหลังได้'
        });
      }

      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays > 3) {
        return res.status(400).json({
          success: false,
          message: 'ระยะเวลาในการลาสูงสุดได้ 3 วันเท่านั้น'
        });
      }
    }

    // อัปเดตข้อมูล
    if (startDate) leave.startDate = startDate;
    if (endDate) leave.endDate = endDate;
    if (issue) leave.issue = issue;

    // เปลี่ยนสถานะกลับเป็นรออนุมัติ (pending) เพื่อให้ admin ตรวจสอบใหม่
    leave.status = 'pending';

    await leave.save();

    // ดึงข้อมูล leave ใหม่
    const updatedLeave = await Leave.findById(id).lean();

    if (updatedLeave) {
      updatedLeave._id = updatedLeave._id.toString();
    }

    res.json({ 
      success: true,
      message: 'อัปเดตรายการลารีบร้อยแล้ว',
      data: updatedLeave 
    });
  } catch (error) {
    console.error('❌ Error updating leave:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Delete leave (user can delete their own leaves if status is pending)
export const deleteLeave = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;
  const shopId = req.user.shopId;

  try {
    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ 
        success: false,
        message: 'ไม่พบรายการลานี้' 
      });
    }

    // ตรวจสอบว่าเป็นเจ้าของ leave หรือไม่
    if (leave.userId.toString() !== userId.toString() || leave.shopId.toString() !== shopId.toString()) {
      return res.status(403).json({ 
        success: false,
        message: 'คุณไม่มีสิทธิ์ลบรายการนี้' 
      });
    }

    // ตรวจสอบว่าสถานะเป็น pending หรือไม่ (ลบได้เฉพาะรายการที่ยังรออนุมัติ)
    if (leave.status !== 'pending') {
      return res.status(400).json({ 
        success: false,
        message: 'ไม่สามารถลบรายการที่อนุมัติหรือไม่อนุมัติแล้ว' 
      });
    }

    await Leave.findByIdAndDelete(id);
    res.json({ 
      success: true,
      message: 'ลบรายการลารีบร้อยแล้ว' 
    });
  } catch (error) {
    console.error('❌ Error deleting leave:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
}; 