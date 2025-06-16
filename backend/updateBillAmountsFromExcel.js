import mongoose from 'mongoose';
import xlsx from 'xlsx';
import Bill from './models/billModel.js';

// 1. เชื่อมต่อ MongoDB
await mongoose.connect('mongodb://localhost:27017/your-db-name', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 2. อ่านไฟล์ Excel
const workbook = xlsx.readFile('./bills.xlsx'); // ชื่อไฟล์ Excel
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet);

// 3. อัปเดต amount ในแต่ละบิล
for (const row of rows) {
  // ตรวจสอบว่าข้อมูลครบ
  if (!row.shopId || !row.billType || !row.month || !row.year || typeof row.amount !== 'number') {
    console.log('ข้อมูลไม่ครบหรือผิดพลาด:', row);
    continue;
  }

  // อัปเดตบิลที่ตรงกับ shopId, billType, month, year
  const result = await Bill.updateOne(
    {
      shopId: row.shopId,
      billType: row.billType, // 'water' หรือ 'electricity'
      month: row.month,
      year: row.year
    },
    { $set: { amount: row.amount } }
  );

  if (result.nModified > 0) {
    console.log(`อัปเดตบิล shopId=${row.shopId} (${row.billType}) เดือน ${row.month}/${row.year} => amount=${row.amount}`);
  } else {
    console.log(`ไม่พบหรือไม่ได้อัปเดตบิล shopId=${row.shopId} (${row.billType}) เดือน ${row.month}/${row.year}`);
  }
}

await mongoose.disconnect();
console.log('เสร็จสิ้น'); 