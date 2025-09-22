# CustomId Update Script

Script สำหรับอัปเดต customId ของร้านค้าให้เป็นรูปแบบใหม่ตามโรงอาหาร

## รูปแบบ CustomId ใหม่

### กฎการตั้งชื่อ:
- **รูปแบบ**: `[ชื่อย่อโรงอาหาร][เลขลำดับ 3 หลัก]`
- **ตัวอย่าง**: `C5001`, `D1001`, `EP001`, `MQ001`

### Mapping ชื่อย่อโรงอาหาร:
| ชื่อโรงอาหาร | ชื่อย่อ | ตัวอย่าง CustomId |
|-------------|---------|------------------|
| โรงอาหาร C5 | C5 | C5001, C5002, C5003 |
| โรงอาหาร D1 | D1 | D1001, D1002, D1003 |
| โรงอาหาร Dormity | D | D001, D002, D003 |
| โรงอาหาร E1 | E1 | E1001, E1002, E1003 |
| โรงอาหาร E2 | E2 | E2001, E2002, E2003 |
| โรงอาหาร Epark | EP | EP001, EP002, EP003 |
| โรงอาหาร Msquare | MQ | MQ001, MQ002, MQ003 |
| โรงอาหาร RuemRim | RRN | RRN001, RRN002, RRN003 |
| โรงอาหาร S2 | S2 | S2001, S2002, S2003 |

## วิธีใช้งาน

### 1. ตั้งค่า Environment Variables
สร้างไฟล์ `.env` ในโฟลเดอร์ `backend` และเพิ่ม:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name?retryWrites=true&w=majority
NODE_ENV=development
```

### 2. แสดงตัวอย่าง CustomId ที่จะสร้าง
```bash
cd canteen-project/backend
npm run customid-preview
# หรือ
node scripts/updateCustomId.js preview
```

### 3. อัปเดต CustomId จริง
```bash
cd canteen-project/backend
npm run customid-update
# หรือ
node scripts/updateCustomId.js update
```

## ⚠️ คำเตือน

- **ใช้คำสั่ง `update` อย่างระมัดระวัง** เพราะจะเปลี่ยนข้อมูลใน database
- **แนะนำให้ backup ข้อมูลก่อน** รันคำสั่ง update
- **ทดสอบกับ preview ก่อน** เพื่อดูผลลัพธ์ที่คาดหวัง

## ข้อมูลที่ Script จะอัปเดต

1. **Shop Collection**: อัปเดต field `customId`
2. **Bill Collection**: อัปเดต field `shopCustomId`

## ตัวอย่างผลลัพธ์

### ก่อนอัปเดต:
```
ร้าน: ร้านอาหาร A
โรงอาหาร: C5
customId: ShopID001

ร้าน: ร้านเครื่องดื่ม B  
โรงอาหาร: D1
customId: ShopID002
```

### หลังอัปเดต:
```
ร้าน: ร้านอาหาร A
โรงอาหาร: C5
customId: C5001

ร้าน: ร้านเครื่องดื่ม B
โรงอาหาร: D1  
customId: D1001
```

## การทำงานของ Script

1. **เชื่อมต่อ Database**: เชื่อมต่อ MongoDB
2. **ดึงข้อมูล**: ดึงข้อมูลโรงอาหารและร้านค้าทั้งหมด
3. **สร้าง Mapping**: สร้าง mapping ของ canteenId กับชื่อโรงอาหาร
4. **สร้าง CustomId ใหม่**: สำหรับแต่ละร้านค้า
   - หาชื่อย่อจากชื่อโรงอาหาร
   - หาเลขลำดับถัดไป (ไม่ซ้ำกับที่มีอยู่)
   - สร้าง customId ในรูปแบบ `[ชื่อย่อ][เลข 3 หลัก]`
5. **อัปเดต Database**: อัปเดต Shop และ Bill collections
6. **แสดงผลลัพธ์**: สรุปจำนวนร้านที่อัปเดต

## Troubleshooting

### ปัญหา: ไม่พบโรงอาหาร
```
⚠️  ไม่พบโรงอาหารสำหรับร้าน [ชื่อร้าน] (canteenId: [ID])
```
**วิธีแก้**: ตรวจสอบข้อมูลใน Canteen collection

### ปัญหา: CustomId ซ้ำ
```
⚠️  customId [ID] ซ้ำกับที่มีอยู่แล้ว
```
**วิธีแก้**: Script จะข้ามร้านนั้นและดำเนินการต่อ

### ปัญหา: เชื่อมต่อ Database ไม่ได้
```
❌ เกิดข้อผิดพลาด: MongooseServerSelectionError: connect ECONNREFUSED
```
**วิธีแก้**: 
1. ตรวจสอบไฟล์ `.env` มี MONGODB_URI ถูกต้องหรือไม่
2. ตรวจสอบการเชื่อมต่อ internet
3. ตรวจสอบ MongoDB Atlas connection string

### ปัญหา: Environment Variables ไม่โหลด
```
❌ เกิดข้อผิดพลาด: MONGODB_URI is not defined
```
**วิธีแก้**: 
1. สร้างไฟล์ `.env` ในโฟลเดอร์ `backend`
2. เพิ่ม MONGODB_URI ที่ถูกต้อง
3. รันคำสั่งใหม่
