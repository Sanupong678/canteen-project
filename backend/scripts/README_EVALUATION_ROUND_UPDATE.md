# การอัปเดต evaluationRound สำหรับข้อมูลที่มีอยู่แล้ว

## ภาพรวม
เมื่อเพิ่มฟิลด์ `evaluationRound` ลงใน Evaluation model แล้ว ข้อมูลที่มีอยู่แล้วในฐานข้อมูลจะยังไม่มีฟิลด์นี้ ต้องใช้ script เพื่ออัปเดตข้อมูลเก่า

## Script ที่มีให้เลือกใช้

### 1. simpleUpdateEvaluationRound.js (แนะนำ)
**วิธีที่ง่ายและปลอดภัยที่สุด**
- ตั้งค่า `evaluationRound = 1` ให้กับทุก evaluation ที่ยังไม่มีฟิลด์นี้
- เหมาะสำหรับการเริ่มต้นใหม่
- ปลอดภัยและรวดเร็ว

```bash
cd backend
node scripts/simpleUpdateEvaluationRound.js
```

### 2. addEvaluationRoundField.js
**วิธีที่ซับซ้อนกว่า**
- วิเคราะห์ข้อมูลและกำหนดรอบประเมินตามลำดับเวลาที่สร้าง
- เหมาะสำหรับการรักษาประวัติการประเมินที่ถูกต้อง
- ใช้เวลานานกว่า

```bash
cd backend
node scripts/addEvaluationRoundField.js
```

### 3. updateEvaluationRound.js
**วิธีที่ซับซ้อนที่สุด**
- วิเคราะห์ข้อมูลอย่างละเอียด
- จัดกลุ่มตาม shop, month, year
- กำหนดรอบประเมินตามลำดับที่ถูกต้อง

```bash
cd backend
node scripts/updateEvaluationRound.js
```

## วิธีการใช้งาน

### ขั้นตอนที่ 1: สำรองข้อมูล
```bash
# สำรองข้อมูลก่อนอัปเดต (แนะนำ)
mongodump --db canteen-project --collection evaluations --out backup/
```

### ขั้นตอนที่ 2: รัน Script
```bash
# เข้าไปในโฟลเดอร์ backend
cd backend

# รัน script ที่ต้องการ (แนะนำใช้ simpleUpdateEvaluationRound.js)
node scripts/simpleUpdateEvaluationRound.js
```

### ขั้นตอนที่ 3: ตรวจสอบผลลัพธ์
Script จะแสดงผลลัพธ์ดังนี้:
```
✅ Connected to MongoDB
🔄 Adding evaluationRound = 1 to all existing evaluations...
✅ Updated 25 evaluations
📊 Matched 25 evaluations
✅ All evaluations now have evaluationRound field

📋 Sample updated evaluations:
   🏪 ร้านอาหาร A (SHOP001)
      📅 12/2024
      🔄 Round: 1
      📊 Score: 85

🎉 Update completed successfully!
🔌 Database connection closed
```

## ข้อมูลที่ Script จะอัปเดต

### ก่อนอัปเดต:
```json
{
  "_id": "...",
  "shopId": "...",
  "evaluationMonth": 12,
  "evaluationYear": 2024,
  "totalScore": 85,
  "finalStatus": "ผ่าน",
  "isActive": true
  // ไม่มี evaluationRound
}
```

### หลังอัปเดต:
```json
{
  "_id": "...",
  "shopId": "...",
  "evaluationMonth": 12,
  "evaluationYear": 2024,
  "evaluationRound": 1,
  "totalScore": 85,
  "finalStatus": "ผ่าน",
  "isActive": true
}
```

## หมายเหตุสำคัญ

1. **การสำรองข้อมูล**: ควรสำรองข้อมูลก่อนรัน script เสมอ
2. **การทดสอบ**: ทดสอบในสภาพแวดล้อม development ก่อน
3. **การตรวจสอบ**: ตรวจสอบผลลัพธ์หลังรัน script
4. **การประเมินใหม่**: หลังอัปเดตแล้ว การประเมินใหม่จะเริ่มรอบที่ 2, 3, 4... ตามลำดับ

## การแก้ไขปัญหา

### หากเกิดข้อผิดพลาด:
1. ตรวจสอบการเชื่อมต่อฐานข้อมูล
2. ตรวจสอบสิทธิ์การเข้าถึงฐานข้อมูล
3. ตรวจสอบว่า Evaluation model ถูก import ถูกต้อง

### หากต้องการย้อนกลับ:
```bash
# ใช้ข้อมูลสำรองที่สร้างไว้
mongorestore --db canteen-project --collection evaluations backup/canteen-project/evaluations.bson
```

## หลังจากอัปเดตเสร็จ

1. ระบบจะสามารถแสดงรอบประเมินในหน้าประวัติย้อนหลังได้
2. การประเมินใหม่จะเริ่มรอบที่ 2, 3, 4... ตามลำดับ
3. การกด Reset จะเริ่มรอบที่ 1 ใหม่สำหรับเดือนนั้น
