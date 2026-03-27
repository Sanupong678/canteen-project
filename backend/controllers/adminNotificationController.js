import Shop from '../models/shopModel.js';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';

// ส่งการแจ้งเตือนจาก admin
export const sendAdminNotification = async (req, res) => {
  try {
    console.log('🔍 Admin notification request:', req.body);
    console.log('👤 User:', req.user);
    
    const { recipients, recipientShopId, recipientCanteenId, priority, title, message } = req.body;
    
    console.log('📋 Notification parameters:');
    console.log('  - recipients:', recipients);
    console.log('  - recipientShopId:', recipientShopId);
    console.log('  - recipientCanteenId:', recipientCanteenId);
    console.log('  - priority:', priority);
    console.log('  - title:', title);
    console.log('  - message:', message);
    
    // หา user ID จาก database หรือใช้ username เป็น sentBy
    let sentBy;
    if (req.user._id) {
      sentBy = req.user._id;
    } else if (req.user.id) {
      sentBy = req.user.id;
    } else {
      // ถ้าไม่มี ID ให้ใช้ username เป็น sentBy
      sentBy = req.user.username;
    }
    
    console.log('👤 SentBy:', sentBy);

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!recipients || !priority || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }

    // สร้าง admin notification แบบง่ายๆ ก่อน
    console.log('📝 Creating admin notification with data:', {
      recipients,
      recipientShopId,
      priority,
      title,
      message,
      sentBy: sentBy || req.user.username
    });
    
    const adminNotificationData = {
      recipients,
      recipientShopId,
      priority,
      title,
      message,
      sentBy: sentBy || req.user.username
    };
    
    console.log('📝 Admin notification data:', adminNotificationData);
    
    const adminNotification = new Notification({
      type: 'admin_notification',
      title: title,
      message: message,
      priority: priority,
      recipients: recipients,
      recipientShopId: recipientShopId,
      recipientCanteenId: recipientCanteenId,
      sentBy: sentBy || req.user.username,
      sentAt: new Date(),
      isRead: false
    });

    console.log('💾 Saving admin notification...');
    await adminNotification.save();
    console.log('✅ Admin notification saved successfully');

    // หาร้านค้าที่จะส่งการแจ้งเตือน
    let targetShops = [];
    
    console.log('🔍 Finding target shops for recipients:', recipients);
    
    try {
      if (recipients === 'all') {
        targetShops = await Shop.find({});
        console.log('📊 Found all shops:', targetShops.length);
      } else if (recipientShopId) {
        console.log('🔍 Looking for specific shop with ID:', recipientShopId);
        const specificShop = await Shop.findById(recipientShopId);
        if (specificShop) {
          targetShops = [specificShop];
          console.log('📊 Found specific shop:', specificShop.name, 'ID:', specificShop._id);
        } else {
          console.log('❌ Specific shop not found with ID:', recipientShopId);
        }
      } else if (recipientCanteenId) {
        console.log('🔍 Looking for shops in canteen ID:', recipientCanteenId);
        targetShops = await Shop.find({ canteenId: parseInt(recipientCanteenId) });
        console.log('📊 Found shops in canteen:', targetShops.length);
        console.log('📊 Shop names:', targetShops.map(shop => shop.name));
      } else {
        console.log('⚠️ No valid recipients, recipientShopId, or recipientCanteenId provided');
      }
    } catch (shopError) {
      console.error('❌ Error finding shops:', shopError);
      throw shopError;
    }

    // สร้าง notification สำหรับแต่ละร้านค้า
    console.log('📧 Creating notifications for', targetShops.length, 'shops');
    
    const notificationPromises = targetShops.map(async (shop) => {
      try {
        console.log('📧 Creating notification for shop:', shop.name);
        
        const notification = new Notification({
          userId: shop.userId || shop._id, // ใช้ userId หรือ shop._id
          shopId: shop._id,
          type: 'admin_notification',
          title: title,
          message: message,
          status: 'new',
          isRead: false,
          relatedId: adminNotification._id,
          priority: priority,
          sentBy: sentBy,
          sentAt: adminNotification.sentAt
        });

        const savedNotification = await notification.save();
        console.log('✅ Notification created for shop:', shop.name);
        return savedNotification;
      } catch (error) {
        console.error('❌ Error creating notification for shop:', shop.name, error);
        throw error;
      }
    });

    const savedNotifications = await Promise.all(notificationPromises);
    console.log('✅ All notifications created:', savedNotifications.length);

    // อัปเดต deliveredTo ใน admin notification
    adminNotification.deliveredTo = targetShops.map(shop => ({
      shopId: shop._id,
      deliveredAt: new Date()
    }));

    await adminNotification.save();

    res.status(201).json({
      success: true,
      message: 'ส่งการแจ้งเตือนสำเร็จ',
      data: {
        adminNotificationId: adminNotification._id,
        deliveredTo: targetShops.length,
        priority,
        title,
        message
      }
    });

  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถส่งการแจ้งเตือนได้',
      error: error.message
    });
  }
};

// ดึงข้อมูล admin notifications สำหรับร้านค้า
export const getShopAdminNotifications = async (req, res) => {
  try {
    const { shopId } = req.params;
    
    // หา notifications ที่ส่งให้ร้านค้านี้
    const notifications = await Notification.find({
      $or: [
        { shopId: shopId, type: 'admin_notification' },
        { recipientShopId: shopId, type: 'admin_notification' }
      ]
    }).sort({ isRead: 1, createdAt: -1 }); // ยังไม่อ่านขึ้นก่อน, แล้วเรียงตามวันที่ใหม่สุด

    res.status(200).json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error getting shop admin notifications:', error);
    res.status(500).json({
      success: false,
      message: 'ไม่สามารถดึงข้อมูลการแจ้งเตือนได้',
      error: error.message
    });
  }
};

// Get admin notifications
export const getAdminNotifications = async (req, res) => {
  try {
    console.log('🔍 Fetching admin notifications...');
    console.log('👤 User:', req.user);
    
    // ดึงข้อมูล notifications ทั้งหมด (user-to-admin notifications)
    // กรองเฉพาะ notifications ที่ยังไม่อ่าน (isRead: false) เท่านั้น
    // และต้องมี userId หรือ shopId (เพื่อแยกจาก notifications อื่นๆ)
    const query = {
      type: { $in: ['bill', 'leave', 'repair'] },
      isRead: false, // แสดงเฉพาะที่ยังไม่อ่านเท่านั้น
      $or: [
        { userId: { $exists: true, $ne: null } },
        { shopId: { $exists: true, $ne: null } }
      ]
    };
    
    console.log('📋 Query filter:', JSON.stringify(query, null, 2));
    
    // Query ข้อมูลใหม่สุดก่อน (เพราะดึงเฉพาะที่ยังไม่อ่านแล้ว ไม่ต้อง sort ใหม่)
    // และ populate ข้อมูล user / shop เพื่อใช้เติม details ให้ครบ
    const rawNotifications = await Notification.find(query)
      .sort({ createdAt: -1 }) // ดึงข้อมูลใหม่สุดก่อน
      .limit(50) // จำกัด 50 รายการ
      .populate({ path: 'shopId', select: 'name canteenId' })
      .populate({ path: 'userId', select: 'username displayName name email' });
    
    console.log('📋 Total unread notifications found:', rawNotifications.length);
    
    // เติม details ให้ครบกรณี notification เก่าๆ ที่ยังไม่มีฟิลด์เหล่านี้
    const notifications = rawNotifications.map((doc) => {
      const notification = doc.toObject();
      const details = notification.details || {};
      
      // เติมชื่อผู้ใช้ (ผู้ส่ง) ถ้ายังไม่มีใน details
      if ((!details.userDisplayName && !details.userName) && notification.userId) {
        details.userDisplayName =
          notification.userId.displayName ||
          notification.userId.name ||
          undefined;
        details.userName =
          notification.userId.username ||
          notification.userId.email ||
          undefined;
      }
      
      // เติมชื่อร้านค้า / โรงอาหาร ถ้ายังไม่มีใน details
      if (!details.shopName && notification.shopId?.name) {
        details.shopName = notification.shopId.name;
      }
      if (!details.canteenName && typeof notification.shopId?.canteenId === 'number') {
        details.canteenName = `โรงอาหาร${getCanteenName(notification.shopId.canteenId)}`;
      }
      
      notification.details = details;
      return notification;
    });
    
    console.log('📋 Final unread admin notifications:', notifications.length);
    
    // แสดงข้อมูลของแต่ละ notification (ทุกอันควรเป็น isRead: false)
    notifications.forEach((notification, index) => {
      console.log(`📋 Notification ${index + 1}:`, {
        id: notification._id,
        title: notification.title,
        message: notification.message?.substring(0, 50) + '...',
        isRead: notification.isRead,
        type: notification.type,
        status: notification.status,
        userId: notification.userId,
        shopId: notification.shopId,
        createdAt: notification.createdAt
      });
    });
    
    const unreadCount = notifications.length; // ทุกอันควรเป็น unread แล้ว
    console.log('📊 Unread count:', unreadCount);
    
    res.status(200).json({
      success: true,
      data: notifications,
      meta: {
        total: notifications.length,
        unread: unreadCount
      }
    });
  } catch (error) {
    console.error('❌ Error getting admin notifications:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Mark notification as read
export const markAdminNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔄 Marking admin notification as read:', id);
    console.log('👤 User:', req.user);
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      console.log('❌ Notification not found:', id);
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    
    console.log('✅ Admin notification marked as read:', id);
    console.log('📋 Updated notification:', {
      id: notification._id,
      title: notification.title,
      isRead: notification.isRead
    });
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('❌ Error marking admin notification as read:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Mark all notifications as read
export const markAllAdminNotificationsAsRead = async (req, res) => {
  try {
    console.log('🔄 Marking all admin notifications as read...');
    console.log('👤 User:', req.user);
    
    // ตรวจสอบจำนวน notifications ที่ยังไม่ได้อ่าน
    const unreadCount = await Notification.countDocuments({ 
      type: { $in: ['bill', 'leave', 'repair'] },
      isRead: false 
    });
    console.log('📊 Unread notifications count:', unreadCount);
    
    if (unreadCount === 0) {
      console.log('ℹ️ No unread notifications to mark');
      return res.status(200).json({
        success: true,
        message: 'No unread notifications to mark',
        updatedCount: 0
      });
    }
    
    const result = await Notification.updateMany(
      { 
        type: { $in: ['bill', 'leave', 'repair'] },
        isRead: false 
      },
      { isRead: true }
    );
    
    console.log('✅ Update result:', result);
    console.log('✅ All admin notifications marked as read');
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('❌ Error marking all admin notifications as read:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create admin notification for bill
export const createAdminBillNotification = async (bill, user) => {
  try {
    console.log('🔍 Creating admin bill notification for bill:', bill._id);
    console.log('👤 User:', user);
    
    // ดึงข้อมูล shop
    const shop = await Shop.findById(bill.shopId);
    if (!shop) {
      console.error('❌ Shop not found for bill notification');
      return;
    }
    
    console.log('🏪 Shop found:', shop.name);
    
    const notificationData = {
      userId: user._id || user.userId,
      shopId: bill.shopId,
      type: 'bill',
      title: 'อัปโหลดสลิปใหม่',
      message: `${user.displayName || user.username} จาก ${shop.name} (โรงอาหาร${getCanteenName(shop.canteenId)}) อัปโหลดสลิปสำหรับบิล ${bill.billType} - ${bill.amount} บาท`,
      status: 'pending',
      isRead: false,
      details: {
        userName: user.username,
        userDisplayName: user.displayName,
        shopName: shop.name,
        canteenName: `โรงอาหาร${getCanteenName(shop.canteenId)}`,
        billType: bill.billType,
        amount: bill.amount,
        dueDate: bill.dueDate,
        imagePath: bill.imagePath,
        slipImageUrl: bill.slip_image_url
      }
    };
    
    console.log('📝 Notification data:', notificationData);
    
    const notification = new Notification(notificationData);
    
    console.log('💾 Saving admin bill notification...');
    await notification.save();
    console.log('✅ Admin bill notification created successfully');
    
  } catch (error) {
    console.error('❌ Error creating admin bill notification:', error);
    console.error('❌ Error stack:', error.stack);
  }
};

// Create admin notification for leave
export const createAdminLeaveNotification = async (leave, user) => {
  try {
    console.log('🔍 Creating admin leave notification for leave:', leave._id);
    console.log('👤 User:', user);
    
    // ดึงข้อมูล shop
    const shop = await Shop.findById(leave.shopId);
    if (!shop) {
      console.error('❌ Shop not found for leave notification');
      return;
    }
    
    console.log('🏪 Shop found:', shop.name);
    
    const notificationData = {
      userId: user._id || user.userId,
      shopId: leave.shopId,
      type: 'leave',
      title: 'คำขอแจ้งลาใหม่',
      message: `${user.displayName || user.username} จาก ${shop.name} (โรงอาหาร${getCanteenName(shop.canteenId)}) แจ้งลาตั้งแต่วันที่ ${new Date(leave.startDate).toLocaleDateString('th-TH')} ถึง ${new Date(leave.endDate).toLocaleDateString('th-TH')}`,
      status: 'pending',
      isRead: false,
      details: {
        userName: user.username,
        userDisplayName: user.displayName,
        shopName: shop.name,
        canteenName: `โรงอาหาร${getCanteenName(shop.canteenId)}`,
        startDate: leave.startDate,
        endDate: leave.endDate,
        issue: leave.issue
      }
    };
    
    console.log('📝 Notification data:', notificationData);
    
    const notification = new Notification(notificationData);
    
    console.log('💾 Saving admin leave notification...');
    await notification.save();
    console.log('✅ Admin leave notification created successfully');
    
  } catch (error) {
    console.error('❌ Error creating admin leave notification:', error);
    console.error('❌ Error stack:', error.stack);
  }
};

// Create admin notification for repair
export const createAdminRepairNotification = async (repair, user) => {
  try {
    console.log('🔍 Creating admin repair notification for repair:', repair._id);
    console.log('👤 User:', user);
    
    // ดึงข้อมูล shop
    const shop = await Shop.findById(repair.shopId);
    if (!shop) {
      console.error('❌ Shop not found for repair notification');
      return;
    }
    
    console.log('🏪 Shop found:', shop.name);
    
    const notificationData = {
      userId: user._id || user.userId,
      shopId: repair.shopId,
      type: 'repair',
      title: 'คำขอแจ้งซ่อมใหม่',
      message: `${user.displayName || user.username} จาก ${shop.name} (โรงอาหาร${getCanteenName(shop.canteenId)}) แจ้งซ่อม${repair.category} - ${repair.issue}`,
      status: 'pending',
      isRead: false,
      details: {
        userName: user.username,
        userDisplayName: user.displayName,
        shopName: shop.name,
        canteenName: `โรงอาหาร${getCanteenName(shop.canteenId)}`,
        category: repair.category,
        repairIssue: repair.issue,
        reportDate: repair.report_date,
        images: repair.images || [],
        imagePaths: repair.imagePaths || []
      }
    };
    
    console.log('📝 Notification data:', notificationData);
    
    const notification = new Notification(notificationData);
    
    console.log('💾 Saving admin repair notification...');
    await notification.save();
    console.log('✅ Admin repair notification created successfully');
    
  } catch (error) {
    console.error('❌ Error creating admin repair notification:', error);
    console.error('❌ Error stack:', error.stack);
  }
};

// Helper function
const getCanteenName = (canteenId) => {
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
}; 