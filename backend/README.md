# Backend API

## โครงสร้าง
- routes/ : กำหนด API endpoint
- controllers/ : จัดการ logic ของแต่ละฟีเจอร์
- models/ : กำหนด schema ของข้อมูล (MongoDB)
- server.js : จุดเริ่มต้น Express server

## ฟีเจอร์ที่รองรับ
- Auth (login)
- Leave (การลา)
- Repair (แจ้งซ่อม)
- Canteen (ร้านค้า)
- News (ข่าว)
- Background (ภาพพื้นหลัง)

## วิธีใช้งาน
1. สร้างไฟล์ `.env` ในโฟลเดอร์ backend และกำหนดค่า
   ```
   MONGODB_URI=mongodb://localhost:27017
   ```
2. ติดตั้ง dependencies
   ```
   npm install
   ```
3. รันเซิร์ฟเวอร์
   ```
   npm start
   ```

## หมายเหตุ
- ต้องมี MongoDB รันอยู่ที่เครื่อง หรือใช้ MongoDB Atlas
- สามารถเชื่อมต่อ frontend ผ่าน API เช่น `http://localhost:5000/api/leaves` 