# Monthly Ranking Notifications System

## ภาพรวม
ระบบแจ้งเตือนผลการประเมินประจำเดือนที่ดึงข้อมูลจาก Ranking User แทนที่จะดึงจาก Evaluation โดยตรง

## เงื่อนไขการสร้าง Notification
1. **ข้อมูลครบ 3 ส่วน:**
   - รายได้ (MoneyHistory)
   - คะแนนประเมิน (Evaluation)
   - ลำดับ Ranking (คำนวณจาก Evaluation)

2. **เดือนละ 1 ครั้งเท่านั้น:**
   - ไม่สร้าง notification ซ้ำในเดือนเดียวกัน
   - ตรวจสอบจาก `monthlyRankingData.month` และ `monthlyRankingData.year`

## API Endpoints

### 1. ตรวจสอบและสร้าง Notifications สำหรับทุกร้านค้า
```bash
POST /api/monthly-ranking-notifications/check-all
Authorization: Bearer <admin_token>
```

### 2. ตรวจสอบสถานะข้อมูลสำหรับร้านค้าเฉพาะ
```bash
GET /api/monthly-ranking-notifications/shop/:shopId/status?month=12&year=2024
Authorization: Bearer <token>
```

### 3. สร้าง Notification สำหรับร้านค้าเฉพาะ (Manual)
```bash
POST /api/monthly-ranking-notifications/shop/:shopId/create
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "month": 12,
  "year": 2024
}
```

## ข้อมูลที่เก็บใน Notification

### Notification Schema
```javascript
{
  type: 'monthly_ranking',
  title: 'แจ้งเตือนผลการประเมินประจำเดือน',
  message: 'สามารถเช็คคะแนนประเมินและลำดับประจำเดือน กันยายน 2025 ได้แล้ว\nคะแนน: 85/100\nลำดับ: อันดับที่ 3\nรายได้: 50,000 บาท',
  monthlyRankingData: {
    month: 9,
    year: 2025,
    monthName: 'กันยายน',
    revenue: 50000,
    score: 85,
    rank: 3,
    finalStatus: 'ผ่าน',
    totalShopsInCanteen: 15,
    revenueUpdatedAt: '2025-09-15T10:30:00Z',
    evaluatedAt: '2025-09-20T14:45:00Z'
  }
}
```

## การทำงานของระบบ

### 1. ตรวจสอบข้อมูลครบถ้วน
```javascript
const checkCompleteRankingData = async (shopId, month, year) => {
  // ตรวจสอบรายได้จาก MoneyHistory
  const moneyHistory = await MoneyHistory.findOne({
    shopId, month, year
  });
  
  // ตรวจสอบคะแนนจาก Evaluation
  const evaluation = await Evaluation.findOne({
    shopId, evaluationMonth: month, evaluationYear: year,
    isActive: true, evaluationSent: true
  });
  
  // คำนวณลำดับจาก Evaluation
  const allEvaluations = await Evaluation.find({
    canteenName: evaluation.canteenName,
    evaluationMonth: month, evaluationYear: year,
    isActive: true, evaluationSent: true
  }).sort({ totalScore: -1 });
  
  const rank = allEvaluations.findIndex(evalItem => 
    evalItem.shopId.toString() === shopId.toString()
  ) + 1;
}
```

### 2. ป้องกันการสร้างซ้ำ
```javascript
const existingNotification = await Notification.findOne({
  shopId: shop._id,
  type: 'monthly_ranking',
  'monthlyRankingData.month': currentMonth,
  'monthlyRankingData.year': currentYear
});

if (existingNotification) {
  // ข้ามการสร้าง notification
  return;
}
```

## การใช้งาน

### 1. รัน Script ตรวจสอบ
```bash
cd backend
node scripts/checkMonthlyRankingNotifications.js
```

### 2. ตั้งค่า Cron Job (Optional)
```bash
# ตรวจสอบทุกวันที่ 1 ของเดือน เวลา 09:00
0 9 1 * * cd /path/to/backend && node scripts/checkMonthlyRankingNotifications.js
```

### 3. เรียกใช้ API จาก Frontend
```javascript
// ตรวจสอบสถานะสำหรับร้านค้าเฉพาะ
const response = await axios.get(`/api/monthly-ranking-notifications/shop/${shopId}/status`);
console.log(response.data);

// สร้าง notification สำหรับร้านค้าเฉพาะ
const response = await axios.post(`/api/monthly-ranking-notifications/shop/${shopId}/create`, {
  month: 12,
  year: 2024
});
```

## ข้อความ Notification

### ตัวอย่างข้อความ
```
สามารถเช็คคะแนนประเมินและลำดับประจำเดือน กันยายน 2025 ได้แล้ว
คะแนน: 85/100
ลำดับ: อันดับที่ 3
รายได้: 50,000 บาท
```

### การปรับแต่งข้อความ
แก้ไขใน `monthlyRankingNotificationController.js`:
```javascript
const message = `สามารถเช็คคะแนนประเมินและลำดับประจำเดือน ${monthName} ${year} ได้แล้ว\nคะแนน: ${rankingData.score}/100\nลำดับ: อันดับที่ ${rankingData.rank}\nรายได้: ${rankingData.revenue.toLocaleString()} บาท`;
```

## การแสดงผลใน Frontend

### NotificationDropdown
- Icon: 📊 (สีเขียว)
- Type: `monthly_ranking`
- ข้อมูลเพิ่มเติม: `details.monthlyRankingData`

### ข้อมูลที่แสดง
- เดือน/ปี
- คะแนน
- ลำดับ
- รายได้
- สถานะการประเมิน

## การ Debug

### ตรวจสอบข้อมูลใน Database
```javascript
// ตรวจสอบ notifications ที่สร้างแล้ว
db.notifications.find({ type: 'monthly_ranking' })

// ตรวจสอบข้อมูล ranking สำหรับร้านค้าเฉพาะ
db.evaluations.find({ shopId: ObjectId('...'), evaluationMonth: 12, evaluationYear: 2024 })
db.moneyhistories.find({ shopId: ObjectId('...'), month: 12, year: 2024 })
```

### Log Messages
- `🔍 Checking monthly ranking notification for X/Y`
- `📊 Found X active shops`
- `✅ Created monthly ranking notification for shop X`
- `⏭️ Notification already exists for shop X in X/Y`
- `❌ Incomplete data for shop X: missing items`

## ข้อดีของระบบใหม่

1. **ดึงข้อมูลจาก Ranking User**: ใช้ข้อมูลที่ user เห็นจริง
2. **ป้องกันการซ้ำ**: สร้างเดือนละครั้งเท่านั้น
3. **ข้อมูลครบถ้วน**: ตรวจสอบ 3 ส่วนก่อนสร้าง
4. **ยืดหยุ่น**: สามารถสร้าง manual ได้
5. **ติดตามได้**: มี log และ status check
