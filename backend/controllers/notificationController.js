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
    // ดึงข้อมูล Bill ล่าสุด
    const billQuery = (shopId && shopId !== 'admin') ? { shopId } : {};
    const latestBills = await Bill.find(billQuery)
      .sort({ updatedAt: -1 })
      .limit(5);
    
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

    console.log('🔍 Searching for leaves with shopId:', shopId);
    // ดึงข้อมูล Leave ล่าสุด
    const leaveQuery = (shopId && shopId !== 'admin') ? { shopId } : {};
    const latestLeaves = await Leave.find(leaveQuery)
      .sort({ updatedAt: -1 })
      .limit(5);
    
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

    console.log('🔍 Searching for repairs with shopId:', shopId);
    // ดึงข้อมูล Repair ล่าสุด
    const repairQuery = (shopId && shopId !== 'admin') ? { shopId } : {};
    const latestRepairs = await Repair.find(repairQuery)
      .sort({ updatedAt: -1 })
      .limit(5);
    
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

    // ดึงข้อมูล Monthly Ranking notifications ล่าสุด
    console.log('🔍 Searching for monthly ranking notifications with shopId:', shopId);
    const monthlyRankingQuery = (shopId && shopId !== 'admin') ? { shopId, type: 'monthly_ranking' } : { type: 'monthly_ranking' };
    const latestMonthlyRankingNotifications = await Notification.find(monthlyRankingQuery)
      .sort({ isRead: 1, createdAt: -1 }) // ยังไม่อ่านขึ้นก่อน, แล้วเรียงตามวันที่ใหม่สุด
      .limit(5);
    
    console.log('📋 Found monthly ranking notifications:', latestMonthlyRankingNotifications.length);
    for (const monthlyRankingNotification of latestMonthlyRankingNotifications) {
      console.log('📋 Monthly ranking notification:', {
        id: monthlyRankingNotification._id,
        message: monthlyRankingNotification.message,
        createdAt: monthlyRankingNotification.createdAt,
        isRead: monthlyRankingNotification.isRead
      });
      
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

    // ดึง admin notifications สำหรับร้านค้านี้ (ไม่แสดงให้ admin เอง)
    if (req.user.role !== 'admin') {
      console.log('🔍 Fetching admin notifications for shopId:', shopId);
      const adminNotifications = await Notification.find({
        type: 'admin_notification',
        $or: [
          { recipients: 'all' },
          { recipients: 'active' },
          { recipients: 'expired' },
          { recipientShopId: shopId }
        ]
      }).sort({ isRead: 1, createdAt: -1 }); // ยังไม่อ่านขึ้นก่อน, แล้วเรียงตามวันที่ใหม่สุด

      console.log('📋 Found admin notifications:', adminNotifications.length);

      // เพิ่ม admin notifications เข้าไปในรายการ
      for (const adminNotification of adminNotifications) {
        notifications.push({
          _id: `admin_${adminNotification._id}`,
          type: 'admin_notification',
          title: adminNotification.title,
          message: adminNotification.message,
          status: 'new',
          createdAt: adminNotification.createdAt,
          isRead: adminNotification.isRead || false, // ใช้ค่า isRead จาก database
          priority: adminNotification.priority, // เพิ่ม priority ตรงนี้
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

    console.log('📋 Total notifications found (including admin):', notifications.length);
    console.log('📋 Notifications (sorted by date, newest first):', notifications.map(n => ({ 
      type: n.type, 
      status: n.status, 
      message: n.message, 
      isRead: n.isRead,
      createdAt: n.createdAt,
      updatedTime: new Date(n.createdAt).toLocaleString('th-TH')
    })));

    res.status(200).json({
      success: true,
      data: notifications
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
    const userId = req.user.userId;
    const shopId = req.user.shopId;

    console.log('🔍 Marking all notifications as read for user:', userId);

    // ดึงหรือสร้าง user read status
    let userReadStatus = await UserReadStatus.findOne({ userId });
    if (!userReadStatus) {
      userReadStatus = new UserReadStatus({ userId, shopId });
    }

    // ดึงข้อมูลทั้งหมดที่ยังไม่ได้อ่าน
    const bills = await Bill.find({ 
      shopId, 
      status: { $ne: 'รอดำเนินการ' } 
    });
    
    const leaves = await Leave.find({ 
      shopId, 
      status: { $ne: 'pending' } 
    });
    
    const repairs = await Repair.find({ 
      shopId, 
      status: { $ne: 'pending' } 
    });

    // เพิ่ม ID ของบิลที่อ่านแล้ว
    bills.forEach(bill => {
      if (!userReadStatus.readBills.includes(bill._id.toString())) {
        userReadStatus.readBills.push(bill._id.toString());
      }
    });

    // เพิ่ม ID ของการลาที่อ่านแล้ว
    leaves.forEach(leave => {
      if (!userReadStatus.readLeaves.includes(leave._id.toString())) {
        userReadStatus.readLeaves.push(leave._id.toString());
      }
    });

    // เพิ่ม ID ของการแจ้งซ่อมที่อ่านแล้ว
    repairs.forEach(repair => {
      if (!userReadStatus.readRepairs.includes(repair._id.toString())) {
        userReadStatus.readRepairs.push(repair._id.toString());
      }
    });

    // อัปเดตเวลาที่อ่านล่าสุด
    userReadStatus.lastReadAt = new Date();
    
    await userReadStatus.save();

    // อัปเดต admin notifications ให้เป็น isRead = true
    if (shopId) {
      await Notification.updateMany(
        {
          type: 'admin_notification',
          $or: [
            { recipients: 'all' },
            { recipients: 'active' },
            { recipients: 'expired' },
            { recipientShopId: shopId }
          ]
        },
        { $set: { isRead: true } }
      );
      console.log('✅ Admin notifications marked as read for shopId:', shopId);
    }

    console.log('✅ All notifications marked as read');
    console.log('📊 Read status updated:', {
      readBills: userReadStatus.readBills.length,
      readLeaves: userReadStatus.readLeaves.length,
      readRepairs: userReadStatus.readRepairs.length
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        readBills: userReadStatus.readBills.length,
        readLeaves: userReadStatus.readLeaves.length,
        readRepairs: userReadStatus.readRepairs.length
      }
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: error.message
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
    const title = 'แจ้งเตือนผลการประเมิน Ranking';
    const message = `คะแนน ranking ในเดือน ${evaluation.evaluationMonth}/${evaluation.evaluationYear} ของคุณถูกประเมินแล้ว\nคะแนน: ${evaluation.totalScore}/100\nสถานะ: ${evaluation.finalStatus}\nตรวจสอบรายละเอียดในระบบได้เลยค่ะ`;
    
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