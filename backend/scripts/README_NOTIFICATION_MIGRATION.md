# Notification Collections Migration

## ภาพรวม
การยุบ collections จาก 3 collections เป็น 1 collection เดียว:
- `AdminToUserNotification` → `Notification` (type: 'admin_notification')
- `UserToAdminNotification` → `Notification` (type: 'bill', 'leave', 'repair')
- `Notification` → `Notification` (ขยาย schema)

## การเปลี่ยนแปลง

### 1. Notification Schema (ขยายแล้ว)
```javascript
{
  userId: ObjectId, // optional
  shopId: ObjectId, // optional
  type: String, // 'bill', 'leave', 'repair', 'ranking_evaluation', 'admin_notification'
  title: String,
  message: String,
  status: String, // optional
  isRead: Boolean,
  relatedId: ObjectId, // optional
  billType: String, // optional
  rankingEvaluationData: Object, // optional
  priority: String, // optional - 'low', 'medium', 'high'
  recipients: String, // optional - 'all', 'active', 'expired'
  recipientShopId: ObjectId, // optional
  sentBy: String, // optional
  sentAt: Date, // optional
  deliveredTo: Array, // optional
  details: Object // optional
}
```

### 2. Controllers ที่อัปเดตแล้ว
- `adminNotificationController.js` - ใช้ Notification collection
- `notificationController.js` - ใช้ Notification collection

### 3. Routes
- `/api/admin-notifications/*` - สำหรับ admin notifications
- `/api/notifications/*` - สำหรับ user notifications

## ขั้นตอนการ Migration

### 1. รัน Migration Script
```bash
cd canteen-project/backend
node scripts/migrateNotifications.js
```

### 2. ตรวจสอบผลลัพธ์
- ตรวจสอบจำนวนข้อมูลใน Notification collection
- ทดสอบ API endpoints

### 3. ลบ Collections เก่า (หลังจากยืนยันว่า migration สำเร็จ)
```bash
node scripts/cleanupOldNotifications.js
```

## การทดสอบ

### 1. ทดสอบ Admin Notifications
```bash
# ส่งการแจ้งเตือนจาก admin
POST /api/admin-notifications/send

# ดึงการแจ้งเตือนสำหรับ admin
GET /api/admin-notifications/admin

# ดึงการแจ้งเตือนสำหรับร้านค้า
GET /api/admin-notifications/shop/:shopId
```

### 2. ทดสอบ User Notifications
```bash
# ดึงการแจ้งเตือนสำหรับ user
GET /api/notifications/user

# Mark notification as read
PUT /api/notifications/:id/read

# Mark all notifications as read
PUT /api/notifications/mark-all-read
```

## ข้อดีของการยุบ Collections

1. **ลดความซับซ้อน**: ใช้ collection เดียวแทน 3 collections
2. **ประหยัดพื้นที่**: ลดการซ้ำซ้อนของข้อมูล
3. **ง่ายต่อการบำรุงรักษา**: API endpoints น้อยลง
4. **ความยืดหยุ่น**: สามารถเพิ่ม type ใหม่ได้ง่าย

## หมายเหตุ

- ข้อมูลเก่าจะถูก migrate ไปยัง Notification collection
- API endpoints ยังคงทำงานเหมือนเดิม
- Frontend ไม่ต้องเปลี่ยนแปลง
- ต้องรัน migration script ก่อนใช้งานระบบใหม่

