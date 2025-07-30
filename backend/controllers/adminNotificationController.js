import AdminNotification from '../models/adminNotificationModel.js';
import Shop from '../models/Shop.js';
import User from '../models/userModel.js';

// Get admin notifications
export const getAdminNotifications = async (req, res) => {
  try {
    console.log('🔍 Fetching admin notifications...');
    
    // ดึงข้อมูล notifications ทั้งหมด
    const notifications = await AdminNotification.find()
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log('📋 Found admin notifications:', notifications.length);
    
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting admin notifications:', error);
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
    
    const notification = await AdminNotification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }
    
    console.log('✅ Admin notification marked as read:', id);
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking admin notification as read:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Mark all notifications as read
export const markAllAdminNotificationsAsRead = async (req, res) => {
  try {
    await AdminNotification.updateMany(
      { isRead: false },
      { isRead: true }
    );
    
    console.log('✅ All admin notifications marked as read');
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all admin notifications as read:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create admin notification for bill
export const createAdminBillNotification = async (bill, user) => {
  try {
    // ดึงข้อมูล shop
    const shop = await Shop.findById(bill.shopId);
    if (!shop) {
      console.error('❌ Shop not found for bill notification');
      return;
    }
    
    const notification = new AdminNotification({
      userId: user._id,
      shopId: bill.shopId,
      type: 'bill',
      title: 'บิลค่าบริการใหม่',
      message: `${user.displayName || user.username} จาก ${shop.name} (โรงอาหาร${getCanteenName(shop.canteenId)}) อัปโหลดบิล${bill.billType === 'electricity' ? 'ค่าไฟ' : 'ค่าน้ำ'} เดือน ${bill.month}/${bill.year}`,
      status: 'pending',
      details: {
        userName: user.username,
        userDisplayName: user.displayName,
        shopName: shop.name,
        canteenName: `โรงอาหาร${getCanteenName(shop.canteenId)}`,
        billType: bill.billType,
        amount: bill.amount,
        month: bill.month,
        year: bill.year,
        dueDate: bill.dueDate,
        images: bill.images || [],
        imagePaths: bill.imagePaths || []
      }
    });
    
    await notification.save();
    console.log('✅ Admin bill notification created');
    
  } catch (error) {
    console.error('❌ Error creating admin bill notification:', error);
  }
};

// Create admin notification for leave
export const createAdminLeaveNotification = async (leave, user) => {
  try {
    // ดึงข้อมูล shop
    const shop = await Shop.findById(leave.shopId);
    if (!shop) {
      console.error('❌ Shop not found for leave notification');
      return;
    }
    
    const notification = new AdminNotification({
      userId: user._id,
      shopId: leave.shopId,
      type: 'leave',
      title: 'คำขอแจ้งลาใหม่',
      message: `${user.displayName || user.username} จาก ${shop.name} (โรงอาหาร${getCanteenName(shop.canteenId)}) แจ้งลาตั้งแต่วันที่ ${new Date(leave.startDate).toLocaleDateString('th-TH')} ถึง ${new Date(leave.endDate).toLocaleDateString('th-TH')}`,
      status: 'pending',
      details: {
        userName: user.username,
        userDisplayName: user.displayName,
        shopName: shop.name,
        canteenName: `โรงอาหาร${getCanteenName(shop.canteenId)}`,
        startDate: leave.startDate,
        endDate: leave.endDate,
        issue: leave.issue
      }
    });
    
    await notification.save();
    console.log('✅ Admin leave notification created');
    
  } catch (error) {
    console.error('❌ Error creating admin leave notification:', error);
  }
};

// Create admin notification for repair
export const createAdminRepairNotification = async (repair, user) => {
  try {
    // ดึงข้อมูล shop
    const shop = await Shop.findById(repair.shopId);
    if (!shop) {
      console.error('❌ Shop not found for repair notification');
      return;
    }
    
    const notification = new AdminNotification({
      userId: user._id,
      shopId: repair.shopId,
      type: 'repair',
      title: 'คำขอแจ้งซ่อมใหม่',
      message: `${user.displayName || user.username} จาก ${shop.name} (โรงอาหาร${getCanteenName(shop.canteenId)}) แจ้งซ่อม${repair.category} - ${repair.issue}`,
      status: 'pending',
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
    });
    
    await notification.save();
    console.log('✅ Admin repair notification created');
    
  } catch (error) {
    console.error('❌ Error creating admin repair notification:', error);
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