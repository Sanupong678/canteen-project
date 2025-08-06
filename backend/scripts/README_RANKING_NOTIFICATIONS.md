# Ranking Notifications Setup

สคริปต์สำหรับสร้างข้อมูล ranking และส่ง notification ให้ทุกร้านที่มีข้อมูล ranking

## 📁 Files

1. **setupRankingNotifications.js** - สคริปต์หลัก (แนะนำให้ใช้)
2. **sendRankingNotifications.js** - สคริปต์เฉพาะการส่ง notification
3. **createRankingData.js** - สคริปต์เฉพาะการสร้างข้อมูล ranking

## 🚀 การใช้งาน

### วิธีที่ 1: ใช้สคริปต์หลัก (แนะนำ)

```bash
# สร้างข้อมูล ranking และส่ง notification ทั้งหมด
node scripts/setupRankingNotifications.js setup

# สร้างข้อมูล ranking เท่านั้น
node scripts/setupRankingNotifications.js create-ranking

# ส่ง notification เท่านั้น
node scripts/setupRankingNotifications.js send-notifications

# ดูสถิติ
node scripts/setupRankingNotifications.js stats
```

### วิธีที่ 2: ใช้สคริปต์แยก

```bash
# สร้างข้อมูล ranking
node scripts/createRankingData.js create

# ส่ง notification
node scripts/sendRankingNotifications.js send-new

# ดูสถิติ
node scripts/createRankingData.js stats
```

## 📊 สิ่งที่สคริปต์จะทำ

### 1. สร้างข้อมูล Ranking
- ดึงข้อมูลร้านค้าทั้งหมดจากฐานข้อมูล
- สร้างข้อมูล ranking จำลองสำหรับร้านที่ยังไม่มีข้อมูล
- กำหนดรายได้แบบสุ่ม (10,000 - 110,000 บาท)
- กำหนดสถานะการประเมิน (70% ผ่าน, 30% ไม่ผ่าน)

### 2. ส่ง Notification
- ดึงข้อมูล ranking ทั้งหมด
- สร้าง notification สำหรับแต่ละร้าน
- ตรวจสอบว่าไม่มีการส่ง notification ซ้ำ
- ส่งข้อความแจ้งเตือนผลการประเมิน ranking

## 📋 ข้อมูลที่สร้าง

### Ranking Data
```javascript
{
  shopName: "ชื่อร้านค้า",
  canteenId: "รหัสโรงอาหาร",
  canteenName: "ชื่อโรงอาหาร",
  revenue: 50000, // รายได้แบบสุ่ม
  evaluationStatus: "ผ่าน" | "ไม่ผ่าน",
  overallStatus: "เสร็จสิ้น" | "รอดำเนินการ",
  notes: "ข้อมูลจำลองสำหรับ [ชื่อร้าน]",
  evaluationDate: new Date(),
  evaluatorName: "Admin"
}
```

### Notification Data
```javascript
{
  userId: "shopId",
  shopId: "shopId",
  type: "ranking_evaluation",
  title: "แจ้งเตือนผลการประเมิน Ranking",
  message: "คะแนน ranking ในเดือน [เดือน]/[ปี] ของคุณถูกประเมินแล้ว...",
  status: "ประเมินแล้ว",
  rankingEvaluationData: {
    revenue: 50000,
    score: 100,
    rank: 1,
    canteenName: "โรงอาหาร C5",
    evaluationMonth: 7,
    evaluationYear: 2025,
    evaluatedBy: "Admin",
    evaluatedAt: new Date()
  }
}
```

## 🎯 ผลลัพธ์ที่คาดหวัง

หลังจากรันสคริปต์แล้ว:

1. **ทุกร้านค้า** จะมีข้อมูล ranking
2. **ทุกร้านที่มีข้อมูล ranking** จะได้รับ notification
3. **ผู้ใช้สามารถเห็น notification** ในระบบได้ทันที

## ⚠️ ข้อควรระวัง

1. **ตรวจสอบการเชื่อมต่อฐานข้อมูล** ก่อนรันสคริปต์
2. **สคริปต์จะไม่สร้างข้อมูลซ้ำ** หากมีข้อมูลอยู่แล้ว
3. **สคริปต์จะไม่ส่ง notification ซ้ำ** หากมีการส่งไปแล้ว
4. **รอสักครู่ระหว่างการประมวลผล** เพื่อไม่ให้ server ทำงานหนักเกินไป

## 🔧 การแก้ไขปัญหา

### ปัญหา: ไม่สามารถเชื่อมต่อฐานข้อมูลได้
```bash
# ตรวจสอบไฟล์ .env
cat .env

# ตรวจสอบ MONGODB_URI
echo $MONGODB_URI
```

### ปัญหา: ไม่มีข้อมูลร้านค้า
```bash
# ตรวจสอบข้อมูลร้านค้า
node -e "
const mongoose = require('mongoose');
const Shop = require('./models/shopModel.js');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const shops = await Shop.find({});
  console.log('Shops:', shops.length);
  mongoose.disconnect();
});
"
```

### ปัญหา: ไม่สามารถสร้าง notification ได้
```bash
# ตรวจสอบข้อมูล ranking
node scripts/setupRankingNotifications.js stats
```

## 📈 การตรวจสอบผลลัพธ์

### 1. ตรวจสอบข้อมูล Ranking
```bash
node scripts/setupRankingNotifications.js stats
```

### 2. ตรวจสอบ Notification ในระบบ
- เข้าสู่ระบบในแอปพลิเคชัน
- ดูที่ส่วน notification
- ควรเห็น notification ใหม่สำหรับ ranking

### 3. ตรวจสอบในฐานข้อมูล
```bash
# ตรวจสอบ ranking
node -e "
const mongoose = require('mongoose');
const Ranking = require('./models/rankingModel.js');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const rankings = await Ranking.find({});
  console.log('Rankings:', rankings.length);
  rankings.forEach(r => console.log(r.shopName, r.revenue));
  mongoose.disconnect();
});
"

# ตรวจสอบ notification
node -e "
const mongoose = require('mongoose');
const Notification = require('./models/notificationModel.js');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const notifications = await Notification.find({type: 'ranking_evaluation'});
  console.log('Ranking notifications:', notifications.length);
  notifications.forEach(n => console.log(n.shopId, n.title));
  mongoose.disconnect();
});
"
```

## 🎉 ตัวอย่างผลลัพธ์

```
🎯 Setting up ranking notifications for all shops...
==================================================

📊 Step 1: Creating ranking data...
📊 Found 15 shops
✅ Created ranking data for shop: ร้านอาหาร A
   - Revenue: 75,000
   - Status: ผ่าน
✅ Created ranking data for shop: ร้านอาหาร B
   - Revenue: 45,000
   - Status: ไม่ผ่าน
...

📈 Ranking Data Summary:
✅ Created ranking data: 15
⚠️  Skipped (already exists): 0

📧 Step 2: Sending notifications...
📊 Found 15 ranking records
✅ Notification created for shop: ร้านอาหาร A
   - Status: ผ่าน
   - Revenue: 75,000
   - Canteen: โรงอาหาร C5
...

📈 Notification Summary:
✅ Successfully created notifications: 15
❌ Failed to create notifications: 0
📊 Total rankings processed: 15

🎉 Setup Complete!
==================
✅ Ranking data created: 15
📧 Notifications sent: 15

🎯 All shops with ranking data now have notifications!
``` 