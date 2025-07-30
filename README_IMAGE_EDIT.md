# ฟีเจอร์แก้ไขรูปภาพโรงอาหาร

## ภาพรวม
ฟีเจอร์นี้ช่วยให้ผู้ดูแลระบบสามารถแก้ไขรูปภาพของโรงอาหารได้ โดยจะอัปโหลดรูปภาพใหม่ไปยัง backend และอัปเดตข้อมูลในฐานข้อมูล

## ฟีเจอร์ที่เพิ่มเข้ามา

### Frontend (Vue.js)
- **ปุ่ม Edit**: แสดงเมื่อ hover ที่รูปภาพโรงอาหาร
- **Modal แก้ไขรูปภาพ**: แสดงรูปภาพปัจจุบันและให้อัปโหลดรูปภาพใหม่
- **Preview รูปภาพ**: แสดงตัวอย่างรูปภาพที่เลือกก่อนบันทึก
- **Loading State**: แสดงสถานะการโหลดและอัปโหลด
- **Error Handling**: จัดการข้อผิดพลาดและแสดงข้อความแจ้งเตือน

### Backend (Node.js/Express)
- **Upload API**: `/api/upload/image` สำหรับอัปโหลดรูปภาพ
- **Update Canteen API**: `/api/canteens/:id` สำหรับอัปเดตข้อมูลโรงอาหาร
- **Static File Serving**: ให้เข้าถึงไฟล์รูปภาพที่อัปโหลดได้
- **File Validation**: ตรวจสอบประเภทและขนาดไฟล์

## การติดตั้งและใช้งาน

### 1. รัน Backend
```bash
cd backend
npm install
npm run dev
```

### 2. เพิ่มข้อมูลโรงอาหารเริ่มต้น
```bash
cd backend
npm run seed-canteens
```

### 3. รัน Frontend
```bash
cd frontend
npm install
npm run dev
```

## การใช้งาน

1. เข้าไปที่หน้า "จัดการโรงอาหาร"
2. Hover ที่รูปภาพโรงอาหารที่ต้องการแก้ไข
3. คลิกปุ่ม "แก้ไขรูปภาพ"
4. เลือกรูปภาพใหม่จากเครื่อง
5. ดูตัวอย่างรูปภาพใน Preview
6. คลิก "บันทึก" เพื่ออัปโหลดและอัปเดต

## โครงสร้างไฟล์

### Frontend
```
frontend/pages/admin/management.vue
├── Template: Modal และ UI สำหรับแก้ไขรูปภาพ
├── Script: ฟังก์ชันอัปโหลดและอัปเดตข้อมูล
└── Style: CSS สำหรับ Modal และ UI
```

### Backend
```
backend/
├── routes/
│   ├── uploadRoutes.js      # API สำหรับอัปโหลดรูปภาพ
│   └── canteenRoutes.js     # API สำหรับจัดการโรงอาหาร
├── controllers/
│   └── canteenController.js # Logic สำหรับจัดการข้อมูลโรงอาหาร
├── models/
│   └── canteenModel.js      # Schema ของโรงอาหาร
├── scripts/
│   └── seedCanteens.js      # Script เพิ่มข้อมูลเริ่มต้น
└── uploads/                 # โฟลเดอร์เก็บรูปภาพที่อัปโหลด
```

## API Endpoints

### อัปโหลดรูปภาพ
```
POST /api/upload/image
Content-Type: multipart/form-data
Body: { image: File }

Response:
{
  "success": true,
  "imagePath": "/uploads/image-123456789.jpg",
  "filename": "image-123456789.jpg"
}
```

### อัปเดตโรงอาหาร
```
PATCH /api/canteens/:id
Content-Type: application/json
Body: { "image": "/uploads/image-123456789.jpg" }

Response:
{
  "_id": "...",
  "name": "โรงอาหาร C5",
  "image": "/uploads/image-123456789.jpg",
  "path": "/admin/canteen/c5",
  "type": "canteen",
  "createdAt": "...",
  "updatedAt": "..."
}
```

## การตั้งค่า

### ไฟล์ที่อัปโหลด
- รูปภาพจะถูกเก็บในโฟลเดอร์ `backend/uploads/`
- ชื่อไฟล์จะถูกสร้างอัตโนมัติเพื่อป้องกันการซ้ำ
- รองรับไฟล์: JPG, JPEG, PNG, GIF
- ขนาดไฟล์สูงสุด: 5MB

### การเข้าถึงไฟล์
- ไฟล์รูปภาพสามารถเข้าถึงได้ผ่าน URL: `http://localhost:3000/uploads/filename.jpg`
- Static file serving ถูกตั้งค่าใน `server.js`

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

1. **ไม่สามารถอัปโหลดรูปภาพได้**
   - ตรวจสอบว่าโฟลเดอร์ `uploads` มีอยู่และมีสิทธิ์เขียน
   - ตรวจสอบขนาดไฟล์ไม่เกิน 5MB
   - ตรวจสอบประเภทไฟล์เป็นรูปภาพ

2. **รูปภาพไม่แสดง**
   - ตรวจสอบ static file serving ใน `server.js`
   - ตรวจสอบ path ของรูปภาพในฐานข้อมูล

3. **API Error**
   - ตรวจสอบ console ของ browser และ server
   - ตรวจสอบการเชื่อมต่อฐานข้อมูล

## การพัฒนาต่อ

### ฟีเจอร์ที่อาจเพิ่มในอนาคต
- การ crop และ resize รูปภาพ
- การลบรูปภาพเก่าเมื่ออัปโหลดใหม่
- การอัปโหลดหลายรูปภาพพร้อมกัน
- การแสดงประวัติการแก้ไขรูปภาพ 