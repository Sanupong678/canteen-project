import mongoose from 'mongoose';
import Notification from '../models/notificationModel.js';
import Bill from '../models/billModel.js';
import Leave from '../models/leaveModel.js';
import Repair from '../models/repairModel.js';
import UserReadStatus from '../models/userReadStatusModel.js';
import Evaluation from '../models/Evaluation.js';
import { emitToShop } from '../socket.js';

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    console.log('🔍 Fetching notifications for shopId:', req.user.shopId);
    console.log('🔍 User object:', req.user);
    
    // คำนวณวันที่ 1 เดือนที่แล้ว
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    console.log('📅 Filtering notifications from:', oneMonthAgo.toISOString());
    console.log('📅 Current date:', new Date().toISOString());
    
    // ตรวจสอบข้อมูลผู้ใช้
    if (!req.user) {
      console.error('❌ Missing user information:', req.user);
      return res.status(400).json({
        success: false,
        error: 'User information is missing'
      });
    }
    
    // ตรวจสอบการเชื่อมต่อ database
    if (!mongoose.connection.readyState) {
      console.error('❌ Database connection not available');
      return res.status(500).json({
        success: false,
        error: 'Database connection not available'
      });
    }
    
    // ดึงข้อมูลล่าสุดจาก database โดยตรง
    let shopId, userId;
    
    if (req.user.role === 'admin') {
      // สำหรับ admin ให้ดึงข้อมูลทั้งหมด
      console.log('🔍 Admin access - fetching all notifications');
      shopId = 'admin'; // admin ใช้ 'admin' เป็น shopId
      userId = req.user.username || 'admin';
    } else {
      // สำหรับ user ธรรมดา
      if (!req.user.shopId) {
        console.error('❌ Missing shopId for user:', req.user);
        return res.status(400).json({
          success: false,
          error: 'Shop information is missing'
        });
      }
      shopId = req.user.shopId;
      userId = req.user.userId || req.user.shopId; // fallback
    }
    const notifications = [];

    // ดึงสถานะการอ่านของผู้ใช้
    console.log('🔍 Searching for user read status for userId:', userId);
    console.log('🔍 shopId:', shopId);
    console.log('🔍 userId type:', typeof userId);
    console.log('🔍 shopId type:', typeof shopId);
    
    let userReadStatus = await UserReadStatus.findOne({ userId });
    if (!userReadStatus) {
      console.log('📝 Creating new user read status for userId:', userId);
      const userReadStatusData = { 
        userId, 
        shopId: shopId
      };
      console.log('📝 UserReadStatus data:', userReadStatusData);
      
      userReadStatus = new UserReadStatus(userReadStatusData);
      await userReadStatus.save();
      console.log('✅ User read status created successfully');
    } else {
      console.log('✅ Found existing user read status');
    }

    console.log('🔍 Searching for bills with shopId:', shopId);
    // ดึงข้อมูล Bill ล่าสุด - เฉพาะสำหรับ user ที่มี shopId และไม่เก่ากว่า 1 เดือน
    let latestBills = [];
    if (shopId && shopId !== 'admin') {
      const billQuery = { 
        shopId,
        updatedAt: { $gte: oneMonthAgo } // เฉพาะข้อมูลที่อัปเดตภายใน 1 เดือนที่แล้ว
      };
      latestBills = await Bill.find(billQuery)
        .sort({ updatedAt: -1 })
        .limit(10); // เพิ่มจำนวนให้มากขึ้นเพื่อให้มีข้อมูลเพียงพอ
    }
    
    console.log('📋 Found bills:', latestBills.length);
    console.log('📋 Bill IDs:', latestBills.map(b => b._id));
    for (const bill of latestBills) {
      console.log('📋 Bill:', {
        id: bill._id,
        status: bill.status,
        billType: bill.billType,
        amount: bill.amount,
        updatedAt: bill.updatedAt
      });
      if (bill.status && bill.status !== 'รอดำเนินการ') {
        // ตรวจสอบเพิ่มเติมว่า bill นี้เป็นของ shopId นี้จริงหรือไม่
        if (bill.shopId && bill.shopId.toString() === shopId.toString()) {
          // ตรวจสอบว่าผู้ใช้เคยอ่านแล้วหรือไม่
          const isRead = userReadStatus.readBills.includes(bill._id.toString());
          
          notifications.push({
            _id: `bill_${bill._id}`,
            type: 'bill',
            title: 'บิลค่าบริการ',
            message: `บิล${bill.billType === 'electricity' ? 'ค่าไฟ' : 'ค่าน้ำ'} - ${getStatusText(bill.status)}`,
            status: bill.status,
            createdAt: bill.updatedAt, // ใช้เวลาที่อัปเดต status
            isRead: isRead,
            details: {
              billType: bill.billType,
              amount: bill.amount,
              billMonth: bill.month,
              billYear: bill.year,
              dueDate: bill.dueDate,
              image: bill.image
            }
          });
        }
      }
    }

    console.log('🔍 Searching for leaves with shopId:', shopId);
    // ดึงข้อมูล Leave ล่าสุด - เฉพาะสำหรับ user ที่มี shopId และไม่เก่ากว่า 1 เดือน
    let latestLeaves = [];
    if (shopId && shopId !== 'admin') {
      const leaveQuery = { 
        shopId,
        updatedAt: { $gte: oneMonthAgo } // เฉพาะข้อมูลที่อัปเดตภายใน 1 เดือนที่แล้ว
      };
      latestLeaves = await Leave.find(leaveQuery)
        .sort({ updatedAt: -1 })
        .limit(10); // เพิ่มจำนวนให้มากขึ้นเพื่อให้มีข้อมูลเพียงพอ
    }
    
    console.log('📋 Found leaves:', latestLeaves.length);
    console.log('📋 Leave IDs:', latestLeaves.map(l => l._id));
    for (const leave of latestLeaves) {
      console.log('📋 Leave:', {
        id: leave._id,
        status: leave.status,
        issue: leave.issue,
        updatedAt: leave.updatedAt
      });
      if (leave.status && leave.status !== 'pending') {
        // ตรวจสอบเพิ่มเติมว่า leave นี้เป็นของ shopId นี้จริงหรือไม่
        if (leave.shopId && leave.shopId.toString() === shopId.toString()) {
          // ตรวจสอบว่าผู้ใช้เคยอ่านแล้วหรือไม่
          const isRead = userReadStatus.readLeaves.includes(leave._id.toString());
          
          notifications.push({
            _id: `leave_${leave._id}`,
            type: 'leave',
            title: 'การแจ้งลา',
            message: `คำขอแจ้งลา - ${getStatusText(leave.status)}`,
            status: leave.status,
            createdAt: leave.updatedAt, // ใช้เวลาที่อัปเดต status
            isRead: isRead,
            details: {
              startDate: leave.startDate,
              endDate: leave.endDate,
              issue: leave.issue
            }
          });
        }
      }
    }

    console.log('🔍 Searching for repairs with shopId:', shopId);
    // ดึงข้อมูล Repair ล่าสุด - เฉพาะสำหรับ user ที่มี shopId และไม่เก่ากว่า 1 เดือน
    let latestRepairs = [];
    if (shopId && shopId !== 'admin') {
      const repairQuery = { 
        shopId,
        updatedAt: { $gte: oneMonthAgo } // เฉพาะข้อมูลที่อัปเดตภายใน 1 เดือนที่แล้ว
      };
      latestRepairs = await Repair.find(repairQuery)
        .sort({ updatedAt: -1 })
        .limit(10); // เพิ่มจำนวนให้มากขึ้นเพื่อให้มีข้อมูลเพียงพอ
    }
    
    console.log('📋 Found repairs:', latestRepairs.length);
    console.log('📋 Repair IDs:', latestRepairs.map(r => r._id));
    for (const repair of latestRepairs) {
      console.log('📋 Repair:', {
        id: repair._id,
        status: repair.status,
        category: repair.category,
        updatedAt: repair.updatedAt
      });
      if (repair.status && repair.status !== 'pending') {
        // ตรวจสอบเพิ่มเติมว่า repair นี้เป็นของ shopId นี้จริงหรือไม่
        if (repair.shopId && repair.shopId.toString() === shopId.toString()) {
          // ตรวจสอบว่าผู้ใช้เคยอ่านแล้วหรือไม่
          const isRead = userReadStatus.readRepairs.includes(repair._id.toString());
          
          notifications.push({
            _id: `repair_${repair._id}`,
            type: 'repair',
            title: 'การแจ้งซ่อม',
            message: `คำขอแจ้งซ่อม - ${getStatusText(repair.status)}`,
            status: repair.status,
            createdAt: repair.updatedAt, // ใช้เวลาที่อัปเดต status
            isRead: isRead,
            details: {
              category: repair.category,
              issue: repair.issue,
              reportDate: repair.report_date
            }
          });
        }
      }
    }

    // ดึงข้อมูล Monthly Ranking notifications ล่าสุด - เฉพาะสำหรับ user ที่มี shopId และไม่เก่ากว่า 1 เดือน
    console.log('🔍 Searching for monthly ranking notifications with shopId:', shopId);
    let latestMonthlyRankingNotifications = [];
    if (shopId && shopId !== 'admin') {
      const monthlyRankingQuery = { 
        shopId, 
        type: 'monthly_ranking',
        createdAt: { $gte: oneMonthAgo } // เฉพาะข้อมูลที่สร้างภายใน 1 เดือนที่แล้ว
      };
      latestMonthlyRankingNotifications = await Notification.find(monthlyRankingQuery)
        .sort({ isRead: 1, createdAt: -1 }) // ยังไม่อ่านขึ้นก่อน, แล้วเรียงตามวันที่ใหม่สุด
        .limit(10); // เพิ่มจำนวนให้มากขึ้นเพื่อให้มีข้อมูลเพียงพอ
    }
    
    // ดึงข้อมูล Ranking Evaluation notifications ล่าสุด - เฉพาะสำหรับ user ที่มี shopId และไม่เก่ากว่า 1 เดือน
    console.log('🔍 Searching for ranking evaluation notifications with shopId:', shopId);
    let latestRankingEvaluationNotifications = [];
    if (shopId && shopId !== 'admin') {
      const rankingEvaluationQuery = { 
        shopId, 
        type: 'ranking_evaluation',
        createdAt: { $gte: oneMonthAgo } // เฉพาะข้อมูลที่สร้างภายใน 1 เดือนที่แล้ว
      };
      latestRankingEvaluationNotifications = await Notification.find(rankingEvaluationQuery)
        .sort({ isRead: 1, createdAt: -1 }) // ยังไม่อ่านขึ้นก่อน, แล้วเรียงตามวันที่ใหม่สุด
        .limit(10); // เพิ่มจำนวนให้มากขึ้นเพื่อให้มีข้อมูลเพียงพอ
    }
    
    console.log('📋 Found monthly ranking notifications:', latestMonthlyRankingNotifications.length);
    for (const monthlyRankingNotification of latestMonthlyRankingNotifications) {
      console.log('📋 Monthly ranking notification:', {
        id: monthlyRankingNotification._id,
        message: monthlyRankingNotification.message,
        createdAt: monthlyRankingNotification.createdAt,
        isRead: monthlyRankingNotification.isRead
      });
      
      // ตรวจสอบเพิ่มเติมว่า monthly ranking notification นี้เป็นของ shopId นี้จริงหรือไม่
      if (monthlyRankingNotification.shopId && 
          monthlyRankingNotification.shopId.toString() === shopId.toString()) {
        notifications.push({
          _id: `monthly_ranking_${monthlyRankingNotification._id}`,
          type: 'monthly_ranking',
          title: monthlyRankingNotification.title,
          message: monthlyRankingNotification.message,
          status: monthlyRankingNotification.status,
          createdAt: monthlyRankingNotification.createdAt,
          isRead: monthlyRankingNotification.isRead,
          details: {
            monthlyRankingData: monthlyRankingNotification.monthlyRankingData
          }
        });
      }
    }
    
    console.log('📋 Found ranking evaluation notifications:', latestRankingEvaluationNotifications.length);
    for (const rankingEvaluationNotification of latestRankingEvaluationNotifications) {
      console.log('📋 Ranking evaluation notification:', {
        id: rankingEvaluationNotification._id,
        message: rankingEvaluationNotification.message,
        createdAt: rankingEvaluationNotification.createdAt,
        isRead: rankingEvaluationNotification.isRead
      });
      
      // ตรวจสอบเพิ่มเติมว่า ranking evaluation notification นี้เป็นของ shopId นี้จริงหรือไม่
      if (rankingEvaluationNotification.shopId && 
          rankingEvaluationNotification.shopId.toString() === shopId.toString()) {
        notifications.push({
          _id: `ranking_evaluation_${rankingEvaluationNotification._id}`,
          type: 'ranking_evaluation',
          title: rankingEvaluationNotification.title,
          message: rankingEvaluationNotification.message,
          status: rankingEvaluationNotification.status,
          createdAt: rankingEvaluationNotification.createdAt,
          isRead: rankingEvaluationNotification.isRead,
          details: {
            rankingEvaluationData: rankingEvaluationNotification.rankingEvaluationData
          }
        });
      }
    }

    // ดึง admin notifications สำหรับร้านค้านี้ (ไม่แสดงให้ admin เอง)
    if (req.user.role !== 'admin') {
      console.log('🔍 Fetching admin notifications for shopId:', shopId);
      
      // แสดงเฉพาะ admin notifications ที่เกี่ยวข้องกับ shopId นี้เท่านั้น และไม่เก่ากว่า 1 เดือน
      // แก้ไข: แสดงเฉพาะ notification ที่มี shopId ตรงกับ shopId ของ user เท่านั้น
      // เพื่อป้องกันการแสดง notification ซ้ำกัน (notification หลักที่ไม่มี shopId + notification ที่มี shopId)
      let adminNotifications = [];
      if (shopId && shopId !== 'admin') {
        // แปลง shopId เป็น ObjectId อย่างปลอดภัย
        let shopObjectId;
        if (shopId instanceof mongoose.Types.ObjectId) {
          shopObjectId = shopId;
        } else if (typeof shopId === 'string' && mongoose.Types.ObjectId.isValid(shopId)) {
          shopObjectId = new mongoose.Types.ObjectId(shopId);
        }
        
        const adminNotificationQuery = {
          type: 'admin_notification',
          shopId: shopObjectId, // แสดงเฉพาะ notification ที่มี shopId ตรงกับ shopId ของ user
          createdAt: { $gte: oneMonthAgo } // เฉพาะข้อมูลที่สร้างภายใน 1 เดือนที่แล้ว
        };
        
        adminNotifications = await Notification.find(adminNotificationQuery)
          .sort({ isRead: 1, createdAt: -1 }) // ยังไม่อ่านขึ้นก่อน, แล้วเรียงตามวันที่ใหม่สุด
          .limit(15); // เพิ่มจำนวนให้มากขึ้นเพื่อให้มีข้อมูลเพียงพอ
      }
      // ถ้า user ไม่มี shopId หรือเป็น admin จะไม่แสดง admin notifications

      console.log('📋 Found admin notifications:', adminNotifications.length);

      // เพิ่ม admin notifications เข้าไปในรายการ (เฉพาะที่เกี่ยวข้องกับ shopId นี้)
      for (const adminNotification of adminNotifications) {
        // ตรวจสอบเพิ่มเติมว่า notification นี้เกี่ยวข้องกับ shopId นี้จริงหรือไม่
        // (ตอนนี้ query กรองแล้ว แต่ตรวจสอบอีกครั้งเพื่อความปลอดภัย)
        if (adminNotification.shopId && 
            adminNotification.shopId.toString() === shopId.toString()) {
          notifications.push({
            _id: `admin_${adminNotification._id}`,
            type: 'admin_notification',
            title: adminNotification.title,
            message: adminNotification.message,
            status: 'new',
            createdAt: adminNotification.createdAt,
            isRead: adminNotification.isRead || false,
            priority: adminNotification.priority,
            sentBy: adminNotification.sentBy,
            details: {
              priority: adminNotification.priority,
              sentBy: adminNotification.sentBy,
              adminNotificationData: {
                priority: adminNotification.priority,
                sentBy: adminNotification.sentBy,
                sentAt: adminNotification.sentAt
              }
            }
          });
        }
      }
    } else {
      console.log('🔍 Admin user - skipping admin notifications');
    }

    // เรียงลำดับ: ข้อมูลที่ยังไม่อ่านขึ้นก่อน, แล้วเรียงตามวันที่อัปเดตล่าสุด
    notifications.sort((a, b) => {
      // ถ้าข้อมูลหนึ่งยังไม่อ่านและอีกอันอ่านแล้ว ให้ข้อมูลที่ยังไม่อ่านขึ้นก่อน
      if (a.isRead !== b.isRead) {
        return a.isRead ? 1 : -1; // false (ยังไม่อ่าน) จะได้ -1, true (อ่านแล้ว) จะได้ 1
      }
      
      // ถ้าสถานะการอ่านเหมือนกัน ให้เรียงตามวันที่อัปเดตล่าสุด
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return dateB - dateA // เรียงจากใหม่ไปเก่า
    });

    console.log('📋 Total notifications found (filtered by shopId and date):', notifications.length);
    console.log('📋 ShopId being filtered:', shopId);
    console.log('📋 Date filter (from):', oneMonthAgo.toISOString());
    console.log('📋 Notifications (sorted by date, newest first):', notifications.map(n => ({ 
      type: n.type, 
      status: n.status, 
      message: n.message, 
      isRead: n.isRead,
      createdAt: n.createdAt,
      updatedTime: new Date(n.createdAt).toLocaleString('th-TH')
    })));

    // จำกัดจำนวน notification ที่แสดงใน popup (สูงสุด 20 รายการ)
    const limitedNotifications = notifications.slice(0, 20);
    
    console.log('📋 Final notifications to display:', limitedNotifications.length);

    res.status(200).json({
      success: true,
      data: limitedNotifications,
      meta: {
        total: notifications.length,
        displayed: limitedNotifications.length,
        dateFilter: oneMonthAgo.toISOString(),
        shopId: shopId
      }
    });
  } catch (error) {
    console.error('❌ Error getting user notifications:', error);
    
    // ส่ง error ที่เฉพาะเจาะจงมากขึ้น
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Data validation error',
        details: error.message
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format',
        details: error.message
      });
    }
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({
        success: false,
        error: 'Database error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ตรวจสอบว่าเป็น admin notification หรือไม่
    if (id.startsWith('admin_')) {
      const adminNotificationId = id.replace('admin_', '');
      
      const adminNotification = await Notification.findById(adminNotificationId);
      if (!adminNotification) {
        return res.status(404).json({
          success: false,
          error: 'Admin notification not found'
        });
      }

      adminNotification.isRead = true;
      await adminNotification.save();

      console.log('✅ Admin notification marked as read:', adminNotificationId);

      res.status(200).json({
        success: true,
        data: adminNotification
      });
    } else {
      // สำหรับ notification ปกติ
      const notification = await Notification.findById(id);
      if (!notification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found'
        });
      }

      // Check if user owns this notification
      if (notification.userId.toString() !== req.user.shopId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      notification.isRead = true;
      await notification.save();

      res.status(200).json({
        success: true,
        data: notification
      });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const isDev = process.env.NODE_ENV === 'development';
    const userId = req.user?.userId;
    const shopId = req.user?.shopId;

    // Validate required fields
    if (!userId || !shopId) {
      if (isDev) {
        console.error('❌ Missing userId or shopId:', { userId, shopId, user: req.user });
      }
      return res.status(400).json({
        success: false,
        error: 'User information is incomplete. Please login again.'
      });
    }

    if (isDev) {
      console.log('🔍 Marking all notifications as read for user:', userId, 'shopId:', shopId);
    }

    // ดึงหรือสร้าง user read status
    let userReadStatus = await UserReadStatus.findOne({ userId });
    if (!userReadStatus) {
      userReadStatus = new UserReadStatus({ userId, shopId, readBills: [], readLeaves: [], readRepairs: [] });
    }

    // ดึงข้อมูลเฉพาะ ID เท่านั้น (ไม่ต้องดึงข้อมูลทั้งหมด) - ใช้ select('_id') เพื่อเพิ่มประสิทธิภาพ
    const [bills, leaves, repairs] = await Promise.all([
      Bill.find({ shopId, status: { $ne: 'รอดำเนินการ' } }).select('_id').lean(),
      Leave.find({ shopId, status: { $ne: 'pending' } }).select('_id').lean(),
      Repair.find({ shopId, status: { $ne: 'pending' } }).select('_id').lean()
    ]);

    // ใช้ Set เพื่อเพิ่มประสิทธิภาพในการตรวจสอบ
    const readBillsSet = new Set(userReadStatus.readBills.map(id => id.toString()));
    const readLeavesSet = new Set(userReadStatus.readLeaves.map(id => id.toString()));
    const readRepairsSet = new Set(userReadStatus.readRepairs.map(id => id.toString()));

    // เพิ่ม ID ที่ยังไม่มีใน read status
    bills.forEach(bill => {
      const billId = bill._id.toString();
      if (!readBillsSet.has(billId)) {
        readBillsSet.add(billId);
        userReadStatus.readBills.push(billId);
      }
    });

    leaves.forEach(leave => {
      const leaveId = leave._id.toString();
      if (!readLeavesSet.has(leaveId)) {
        readLeavesSet.add(leaveId);
        userReadStatus.readLeaves.push(leaveId);
      }
    });

    repairs.forEach(repair => {
      const repairId = repair._id.toString();
      if (!readRepairsSet.has(repairId)) {
        readRepairsSet.add(repairId);
        userReadStatus.readRepairs.push(repairId);
      }
    });

    // อัปเดตเวลาที่อ่านล่าสุด
    userReadStatus.lastReadAt = new Date();
    
    await userReadStatus.save();

    // อัปเดต admin notifications ให้เป็น isRead = true
    if (shopId) {
      try {
        // แปลง shopId เป็น ObjectId อย่างปลอดภัย
        let shopObjectId;
        if (shopId instanceof mongoose.Types.ObjectId) {
          shopObjectId = shopId;
        } else if (typeof shopId === 'string' && mongoose.Types.ObjectId.isValid(shopId)) {
          shopObjectId = new mongoose.Types.ObjectId(shopId);
        } else {
          if (isDev) console.warn('⚠️ Invalid shopId format:', shopId);
          shopObjectId = null;
        }

        if (shopObjectId) {
      await Notification.updateMany(
        {
          type: 'admin_notification',
          $or: [
            { recipients: 'all' },
            { recipients: 'active' },
            { recipients: 'expired' },
                { recipientShopId: shopObjectId }
          ]
        },
        { $set: { isRead: true } }
      );
        }
        
        if (isDev) {
      console.log('✅ Admin notifications marked as read for shopId:', shopId);
        }
      } catch (updateError) {
        if (isDev) {
          console.error('⚠️ Error updating admin notifications:', updateError.message);
        }
        // ไม่ throw error เพราะเป็น operation รอง
      }
    }

    // คำนวณวันที่ 3 วันที่แล้ว
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    // สร้างเงื่อนไขสำหรับลบการแจ้งเตือนที่เก่ากว่า 3 วันและเป็น isRead = true
    const deleteConditions = [];

    // เพิ่มเงื่อนไขสำหรับ user notifications
    if (userId) {
      deleteConditions.push({ userId });
    }
    if (shopId) {
      deleteConditions.push({ shopId });
      
      // เพิ่มเงื่อนไขสำหรับ admin notifications ที่ส่งมาให้ shop นี้
      // แก้ไข: เพิ่มเงื่อนไขสำหรับ admin notifications ที่มี shopId ตรงกับ shopId ของ user
      try {
        let shopObjectId;
        if (shopId instanceof mongoose.Types.ObjectId) {
          shopObjectId = shopId;
        } else if (typeof shopId === 'string' && mongoose.Types.ObjectId.isValid(shopId)) {
          shopObjectId = new mongoose.Types.ObjectId(shopId);
        }
        
        if (shopObjectId) {
          // เพิ่มเงื่อนไขสำหรับ admin notifications ที่มี shopId
          deleteConditions.push({
            type: 'admin_notification',
            shopId: shopObjectId
          });
          
          // เพิ่มเงื่อนไขสำหรับ admin notifications ที่มี recipientShopId (กรณีเก่า)
          deleteConditions.push({
            type: 'admin_notification',
            recipientShopId: shopObjectId
          });
        }
      } catch (idError) {
        if (isDev) {
          console.warn('⚠️ Error creating ObjectId for shopId:', idError.message);
        }
      }
    }

    // ลบการแจ้งเตือนที่เก่ากว่า 3 วัน (ถ้ามีเงื่อนไข)
    let deleteResult = { deletedCount: 0 };
    if (deleteConditions.length > 0) {
    const deleteQuery = {
      $or: deleteConditions,
      isRead: true,
      createdAt: { $lt: threeDaysAgo }
    };

      deleteResult = await Notification.deleteMany(deleteQuery);
    
      if (isDev) {
    console.log('🗑️ Deleted old notifications:', {
      deletedCount: deleteResult.deletedCount,
      olderThan: threeDaysAgo.toISOString()
    });
      }
    }

    if (isDev) {
    console.log('✅ All notifications marked as read');
    console.log('📊 Read status updated:', {
      readBills: userReadStatus.readBills.length,
      readLeaves: userReadStatus.readLeaves.length,
      readRepairs: userReadStatus.readRepairs.length,
      deletedNotifications: deleteResult.deletedCount
    });
    }

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        readBills: userReadStatus.readBills.length,
        readLeaves: userReadStatus.readLeaves.length,
        readRepairs: userReadStatus.readRepairs.length,
        deletedNotifications: deleteResult.deletedCount
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error marking all notifications as read:', error);
      console.error('❌ Error stack:', error.stack);
    }
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while marking notifications as read',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Create notification (called by other controllers)
export const createNotification = async (userId, shopId, type, title, message, status, relatedId, billType = null) => {
  try {
    const notification = new Notification({
      userId,
      shopId,
      type,
      title,
      message,
      status,
      relatedId,
      billType
    });

    await notification.save();
    console.log(`✅ Notification created: ${type} - ${status}`);
    try {
      if (shopId) emitToShop(shopId, 'user:notification:new', { type, title, message, status, relatedId });
    } catch (_) {}
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create bill notification
export const createBillNotification = async (bill, status) => {
  try {
    const title = 'บิลค่าบริการ';
    const billTypeText = bill.billType === 'electricity' ? 'ค่าไฟ' : 'ค่าน้ำ';
    const message = `บิล${billTypeText} - ${getStatusText(status)}`;
    
    await createNotification(
      bill.shopId, // userId (using shopId for now)
      bill.shopId,
      'bill',
      title,
      message,
      status,
      bill._id,
      bill.billType
    );
    
    console.log(`✅ Bill notification created: ${billTypeText} - ${status}`);
  } catch (error) {
    console.error('Error creating bill notification:', error);
  }
};

// Create leave notification
export const createLeaveNotification = async (leave, status) => {
  try {
    const title = 'การแจ้งลา';
    const message = `คำขอแจ้งลา - ${getStatusText(status)}`;
    
    await createNotification(
      leave.userId,
      leave.shopId,
      'leave',
      title,
      message,
      status,
      leave._id
    );
  } catch (error) {
    console.error('Error creating leave notification:', error);
  }
};

// Create repair notification
export const createRepairNotification = async (repair, status) => {
  try {
    const title = 'การแจ้งซ่อม';
    const message = `คำขอแจ้งซ่อม - ${getStatusText(status)}`;
    
    await createNotification(
      repair.userId,
      repair.shopId,
      'repair',
      title,
      message,
      status,
      repair._id
    );
  } catch (error) {
    console.error('Error creating repair notification:', error);
  }
};

// Create ranking evaluation notification
export const createRankingEvaluationNotification = async (evaluation, evaluatorName) => {
  try {
    const title = 'มีการอัปเดตข้อมูล Ranking';
    const message = `ข้อมูลการจัดอันดับในเดือน ${evaluation.evaluationMonth}/${evaluation.evaluationYear} ได้รับการอัปเดตแล้ว\nกรุณาเช็คข้อมูลในหน้า Ranking เพื่อดูรายละเอียด`;
    
    // คำนวณลำดับในโรงอาหารเดียวกัน
    const allEvaluations = await Evaluation.find({
      canteenName: evaluation.canteenName,
      evaluationMonth: evaluation.evaluationMonth,
      evaluationYear: evaluation.evaluationYear,
      isActive: true
    }).sort({ totalScore: -1 });
    
    const rank = allEvaluations.findIndex(evalItem => evalItem.shopId.toString() === evaluation.shopId.toString()) + 1;
    
    const notification = new Notification({
      userId: evaluation.shopId, // ใช้ shopId เป็น userId
      shopId: evaluation.shopId,
      type: 'ranking_evaluation',
      title: title,
      message: message,
      status: 'ประเมินแล้ว',
      relatedId: evaluation._id,
      rankingEvaluationData: {
        revenue: evaluation.revenue || 0,
        score: evaluation.totalScore || 0,
        rank: rank,
        canteenName: evaluation.canteenName,
        evaluationMonth: evaluation.evaluationMonth,
        evaluationYear: evaluation.evaluationYear,
        evaluatedBy: evaluatorName || 'Admin',
        evaluatedAt: evaluation.evaluatedAt || new Date()
      }
    });

    await notification.save();
    console.log(`✅ Ranking evaluation notification created for shop ${evaluation.shopName}: Score ${evaluation.totalScore}, Rank ${rank}`);
    
    // ส่ง socket notification ให้ user
    try {
      if (evaluation.shopId) {
        emitToShop(evaluation.shopId, 'user:notification:new', { 
          type: 'ranking_evaluation', 
          title: title, 
          message: message, 
          status: 'ประเมินแล้ว', 
          relatedId: evaluation._id 
        });
        console.log(`🔔 Socket notification sent for ranking evaluation to shop ${evaluation.shopId}`);
      }
    } catch (socketError) {
      console.error('Error sending socket notification:', socketError);
      // ไม่ส่ง error กลับไปเพราะ notification ถูกสร้างแล้ว
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating ranking evaluation notification:', error);
    throw error;
  }
};

// Helper function to get status text
const getStatusText = (status) => {
  const statusMap = {
    'pending': 'รอดำเนินการ',
    'approved': 'อนุมัติแล้ว',
    'rejected': 'ปฏิเสธแล้ว',
    'รอดำเนินการ': 'รอดำเนินการ',
    'รอตรวจสอบ': 'รอตรวจสอบ',
    'เสร็จสิ้น': 'เสร็จสิ้น',
    'เลยกำหนด': 'เลยกำหนด'
  };
  return statusMap[status] || status;
}; 