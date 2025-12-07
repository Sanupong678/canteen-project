# 📊 การวิเคราะห์ Shop Model ในโปรเจค

## 🔍 สรุปปัญหา

โปรเจคนี้มี **2 ไฟล์ Shop model** ที่แตกต่างกันและมีการใช้งานไม่สอดคล้องกัน:

---

## 📁 1. Shop.js (Version เก่า)

**Location:** `backend/models/Shop.js`

### คุณสมบัติ:
- ✅ `credentials.username` - ชื่อผู้ใช้ (required, unique)
- ✅ `credentials.password` - รหัสผ่านต้นฉบับ
- ✅ `credentials.password_hash` - รหัสผ่านที่เข้ารหัส
- ✅ `credentials.status` - สถานะ (active/expired)
- ✅ `userId` - **Field แยก** (ref: User, required, unique)
- ✅ `type` enum: `['food', 'drink', 'dessert', 'other']`
- ❌ ไม่มี evaluation fields (score, evaluationStatus, etc.)
- ❌ ไม่มี post-save hook สำหรับสร้าง Bill

### ถูกใช้งานใน:
- `routes/shopRoutes.js` ⚠️
- `controllers/authController.js`
- `controllers/billController.js`
- `controllers/rankingController.js`
- `controllers/evaluationController.js`
- `controllers/leaveController.js`
- `controllers/repairController.js`
- `controllers/userController.js`
- `controllers/monthlyRankingNotificationController.js`
- `controllers/adminNotificationController.js`
- `middleware/auth.js`
- `utils/cronJobs.js`
- `scripts/updateRevenueFromExcel.js`
- `scripts/testResetId.js`
- `scripts/detailedShopAnalysis.js`

---

## 📁 2. shopModel.js (Version ใหม่)

**Location:** `backend/models/shopModel.js`

### คุณสมบัติ:
- ✅ `credentials.userId` - **อ้างอิงไปยัง User model** (ref: User)
- ✅ `credentials.createdAt` - วันที่สร้าง
- ✅ `credentials.updatedAt` - วันที่อัปเดต
- ✅ `type` enum: `['food', 'beverage', 'other']` (แตกต่างจาก Shop.js)
- ✅ **Evaluation fields:**
  - `score` (default: 100)
  - `evaluationStatus` ('ผ่าน', 'ไม่ผ่าน')
  - `evaluationCompleted` (boolean)
  - `evaluationDate`
- ✅ **Post-save hook** - สร้าง Bill (water & electricity) อัตโนมัติ
- ✅ Validation สำหรับ contract dates

### ถูกใช้งานใน:
- `controllers/shopController.js` ✅ (ใช้ version ใหม่)
- `scripts/updateCustomId.js`
- `scripts/setupRankingNotifications.js`
- `scripts/sendRankingNotifications.js`
- `scripts/resetBills.js`

---

## ⚠️ ปัญหาที่พบ

### 1. **Schema ไม่สอดคล้องกัน**
   - `Shop.js` มี `userId` เป็น field แยก + `credentials.username`
   - `shopModel.js` มี `credentials.userId` (nested object) + ไม่มี username/password

### 2. **Type enum ไม่ตรงกัน**
   - `Shop.js`: `['food', 'drink', 'dessert', 'other']`
   - `shopModel.js`: `['food', 'beverage', 'other']`

### 3. **การใช้งานซ้ำซ้อน**
   - `shopRoutes.js` ใช้ `Shop.js` แต่เรียกใช้ functions จาก `shopController.js` ที่ใช้ `shopModel.js`
   - ทำให้เกิดความสับสนและอาจเกิด bug

### 4. **Credentials structure ต่างกัน**
   ```javascript
   // Shop.js
   credentials: {
     username: String,
     password: String,
     password_hash: String,
     status: String
   }
   userId: ObjectId  // แยก field

   // shopModel.js
   credentials: {
     userId: ObjectId,  // อยู่ใน credentials
     createdAt: Date,
     updatedAt: Date
   }
   // ไม่มี username/password
   ```

---

## 🔧 แนวทางแก้ไข

### ตัวเลือกที่ 1: รวมเป็นไฟล์เดียว (แนะนำ)
1. เลือก model หลัก (แนะนำ `shopModel.js` เพราะมี features ใหม่กว่า)
2. Merge schema ให้ครบถ้วน
3. อัปเดต import ทั้งหมดให้ชี้ไปที่ไฟล์เดียวกัน
4. ทดสอบให้แน่ใจว่าไม่มี breaking changes

### ตัวเลือกที่ 2: แยกให้ชัดเจน
1. ใช้ `Shop.js` สำหรับ features เก่า (legacy)
2. ใช้ `shopModel.js` สำหรับ features ใหม่
3. กำหนดให้ชัดเจนว่าแต่ละ route/controller ใช้ model ไหน

---

## 📝 รายการไฟล์ที่ต้องแก้ไข

### ไฟล์ที่ใช้ `Shop.js` (ควรเปลี่ยนเป็น `shopModel.js`):
- [ ] `routes/shopRoutes.js`
- [ ] `controllers/authController.js`
- [ ] `controllers/billController.js`
- [ ] `controllers/rankingController.js`
- [ ] `controllers/evaluationController.js`
- [ ] `controllers/leaveController.js`
- [ ] `controllers/repairController.js`
- [ ] `controllers/userController.js`
- [ ] `controllers/monthlyRankingNotificationController.js`
- [ ] `controllers/adminNotificationController.js`
- [ ] `middleware/auth.js`
- [ ] `utils/cronJobs.js`
- [ ] `scripts/updateRevenueFromExcel.js`
- [ ] `scripts/testResetId.js`
- [ ] `scripts/detailedShopAnalysis.js`

---

## 🎯 สรุป

**ปัญหาหลัก:** มี 2 model files ที่มี schema แตกต่างกัน ทำให้เกิดความสับสนและอาจเกิด bug

**แนะนำ:** รวมเป็นไฟล์เดียวโดยใช้ `shopModel.js` เป็นหลัก และ merge features จาก `Shop.js` เข้าไป

---

## ✅ **คำตอบสำหรับคำถามของคุณ**

### ❓ "ถ้าโปรเจคสามารถรันได้ด้วย Shop.js (version เก่า) แสดงว่าคุณสมบัติของ shopModel.js (version ใหม่) ไม่ถูกใช้งานจริง ถูกไหม?"

### ✅ **คำตอบ: ใช่ ถูกต้อง!**

### 🔍 **เหตุผล:**

#### 1. **MongoDB Model Registration**
```javascript
// ทั้งสองไฟล์ใช้ชื่อ model เดียวกัน
mongoose.model('Shop', shopSchema);  // ใน Shop.js
mongoose.model('Shop', shopSchema);  // ใน shopModel.js
```

- ไฟล์ที่ถูก `import` ก่อนจะ register model ชื่อ 'Shop' ก่อน
- ไฟล์ที่ `import` ทีหลังจะ **override** model ก่อนหน้า
- **แต่โค้ดส่วนใหญ่ใช้ `Shop.js`** (ใน routes/controllers)

#### 2. **ลำดับการ Load Model**
```
server.js 
  → shopRoutes.js (import Shop.js) ← **ถูก load ก่อน**
  → shopController.js (import shopModel.js) ← **ถูก load ทีหลัง แต่ override แล้ว**
```

#### 3. **Evaluation Fields ไม่ทำงานจริง**
- `shopRoutes.js` (ใช้ Shop.js) พยายามอ่าน `evaluationStatus`, `evaluationCompleted`, `score`
- แต่ `Shop.js` **ไม่มี fields เหล่านี้** ใน schema
- MongoDB **จะเก็บ fields เหล่านี้ได้** (เพราะ MongoDB ไม่ strict กับ schema) แต่:
  - ❌ ไม่มี validation
  - ❌ ไม่มี default values
  - ❌ ไม่มี type checking
  - ⚠️ อาจเกิด bug เมื่อ fields เหล่านี้เป็น `undefined`

#### 4. **Post-save Hook ไม่ทำงาน**
- `shopModel.js` มี post-save hook สร้าง Bill อัตโนมัติ
- แต่ `shopController.js` สร้าง Bill เองในโค้ด (บรรทัด 78-104)
- **ไม่พึ่งพา hook เลย** เพราะไม่แน่ใจว่า model ไหนถูกใช้งาน

#### 5. **Credentials Structure ไม่สอดคล้อง**
- `shopRoutes.js` พยายามใช้ `shop.credentials.username` และ `shop.userId`
- แต่ถ้า database มีข้อมูลแบบ `shopModel.js` (credentials.userId) จะทำให้เกิด error

---

## 📊 **สรุป: คุณสมบัติที่ไม่ได้ใช้งานจริง**

จาก `shopModel.js`:

1. ❌ **Evaluation fields** (score, evaluationStatus, evaluationCompleted, evaluationDate)
   - ถูกอ่านในโค้ด แต่ schema ไม่มี
   - MongoDB เก็บได้ แต่ไม่มี validation/default

2. ❌ **Post-save hook** สำหรับสร้าง Bill
   - มีใน code แต่ไม่ทำงานเพราะ Shop.js ไม่มี hook
   - โค้ดสร้าง Bill เองแทน

3. ❌ **Credentials.userId structure**
   - มีใน schema แต่โค้ดส่วนใหญ่ใช้ `credentials.username` + `userId` (แยก field)

4. ❌ **Type enum** (`['food', 'beverage', 'other']`)
   - ไม่ตรงกับที่ใช้จริง (`['food', 'drink', 'dessert', 'other']`)

---

## ⚠️ **ความเสี่ยง**

1. **Data Inconsistency** - Database อาจมีข้อมูลแบบเก่าและใหม่ปนกัน
2. **Silent Failures** - Fields ที่ไม่มีใน schema อาจเป็น `undefined` โดยไม่รู้ตัว
3. **Breaking Changes** - ถ้าเปลี่ยนไปใช้ `shopModel.js` อาจทำให้โค้ดเดิมพัง

---

## 🔧 **แนะนำให้แก้ไขทันที**

1. ✅ ตรวจสอบ database ว่าใช้ schema ไหนจริง
2. ✅ ตรวจสอบว่า fields ใน database ตรงกับ model ไหน
3. ✅ รวม model เป็นไฟล์เดียว
4. ✅ Update migrations ถ้าจำเป็น

