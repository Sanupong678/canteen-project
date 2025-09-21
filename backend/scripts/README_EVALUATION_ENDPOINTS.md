# Evaluation Endpoints Documentation

## ภาพรวม
ระบบประเมินร้านค้าที่ดึงข้อมูลจาก Shop collection โดยอัตโนมัติ และสร้าง Evaluation records สำหรับร้านค้าที่ยังไม่หมดสัญญา

## Endpoints ใหม่

### 1. GET `/api/evaluations/shops`
**วัตถุประสงค์**: ดึงข้อมูลร้านค้าสำหรับการประเมิน

**การทำงาน**:
- ดึงร้านค้าที่ยังไม่หมดสัญญา (`contractEndDate >= currentDate`)
- ตรวจสอบสถานะ credentials เป็น 'active'
- สร้าง Evaluation records อัตโนมัติสำหรับร้านค้าที่ยังไม่มี
- ตรวจสอบการเปิด/ปิดการประเมินจาก EvaluationControl

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "shop_id",
      "customId": "ShopID001",
      "name": "ชื่อร้าน",
      "type": "food",
      "canteenId": 1,
      "canteenName": "โรงอาหาร C5",
      "location": "ตำแหน่งร้าน",
      "contractEndDate": "2025-12-31T00:00:00.000Z",
      "evaluation": {
        "_id": "evaluation_id",
        "totalScore": 0,
        "finalStatus": "ไม่ผ่าน",
        "evaluationMonth": 9,
        "evaluationYear": 2025,
        "evaluatedAt": "2025-09-14T04:00:00.000Z",
        "items": [...]
      }
    }
  ],
  "currentMonth": 9,
  "currentYear": 2025,
  "evaluationEnabled": true
}
```

### 2. GET `/api/evaluations/control-data`
**วัตถุประสงค์**: ดึงข้อมูลสำหรับหน้า "ตัวควบคุมแบบประเมิน"

**การทำงาน**:
- ดึงข้อมูลการควบคุมการประเมิน
- นับจำนวนร้านค้าและการประเมิน
- แสดงสถานะการประเมินของแต่ละร้าน

**Response**:
```json
{
  "success": true,
  "data": {
    "currentMonth": 9,
    "currentYear": 2025,
    "isEvaluationEnabled": true,
    "reason": "",
    "totalActiveShops": 4,
    "totalEvaluations": 4,
    "completedEvaluations": 2,
    "pendingEvaluations": 2,
    "shops": [
      {
        "_id": "shop_id",
        "customId": "ShopID001",
        "name": "ชื่อร้าน",
        "type": "food",
        "canteenId": 1,
        "canteenName": "โรงอาหาร C5",
        "location": "ตำแหน่งร้าน",
        "contractEndDate": "2025-12-31T00:00:00.000Z",
        "hasEvaluation": true,
        "evaluationStatus": "ผ่าน",
        "evaluationScore": 85,
        "evaluationId": "evaluation_id"
      }
    ]
  }
}
```

## การทำงานของระบบ

### 1. การสร้าง Evaluation Records อัตโนมัติ
- ระบบจะตรวจสอบร้านค้าที่ยังไม่หมดสัญญา
- สำหรับร้านค้าที่ยังไม่มี evaluation ในเดือนปัจจุบัน จะสร้างใหม่โดยอัตโนมัติ
- Evaluation ใหม่จะมี:
  - `totalScore: 0`
  - `finalStatus: 'ไม่ผ่าน'`
  - `items` ที่ดึงจาก EvaluationItem collection
  - `evaluationMonth` และ `evaluationYear` เป็นเดือนปัจจุบัน

### 2. การตรวจสอบการเปิด/ปิดการประเมิน
- ระบบจะตรวจสอบ EvaluationControl สำหรับเดือนปัจจุบัน
- ถ้าไม่มีข้อมูล จะสร้างใหม่และเปิดการประเมิน
- ถ้าการประเมินปิด จะส่ง error message กลับ

### 3. การดึงข้อมูลร้านค้า
- ใช้เงื่อนไข: `contractEndDate >= currentDate` และ `credentials.status === 'active'`
- เรียงลำดับตามชื่อร้าน (`name`)
- Populate ข้อมูลจาก Shop collection

## การใช้งานใน Frontend

### สำหรับหน้า "ทำแบบประเมิน"
```javascript
// ดึงข้อมูลร้านค้าสำหรับการประเมิน
const response = await fetch('/api/evaluations/shops');
const data = await response.json();

if (data.success) {
  // แสดงรายการร้านค้าที่ต้องประเมิน
  data.data.forEach(shop => {
    console.log(`${shop.name} - สถานะ: ${shop.evaluation.finalStatus}`);
  });
}
```

### สำหรับหน้า "ตัวควบคุมแบบประเมิน"
```javascript
// ดึงข้อมูลสำหรับ control panel
const response = await fetch('/api/evaluations/control-data');
const data = await response.json();

if (data.success) {
  const controlData = data.data;
  console.log(`ร้านค้าทั้งหมด: ${controlData.totalActiveShops}`);
  console.log(`ประเมินเสร็จแล้ว: ${controlData.completedEvaluations}`);
  console.log(`รอดำเนินการ: ${controlData.pendingEvaluations}`);
}
```

## ข้อดีของระบบใหม่

1. **อัตโนมัติ**: ไม่ต้องสร้าง evaluation records ด้วยตนเอง
2. **สอดคล้อง**: ข้อมูลร้านค้าจาก Shop collection เป็นหลัก
3. **ยืดหยุ่น**: สามารถเปิด/ปิดการประเมินได้
4. **ครบถ้วน**: มีข้อมูลครบสำหรับการแสดงผล
5. **ปลอดภัย**: ตรวจสอบสถานะสัญญาและ credentials

## การทดสอบ

ใช้ script `testEvaluationEndpoints.js` เพื่อทดสอบการทำงาน:

```bash
node scripts/testEvaluationEndpoints.js
```

Script นี้จะ:
- ตรวจสอบร้านค้าที่ยังไม่หมดสัญญา
- ตรวจสอบหัวข้อการประเมิน
- จำลองการสร้าง evaluation records
- แสดงผลลัพธ์สำหรับ frontend

