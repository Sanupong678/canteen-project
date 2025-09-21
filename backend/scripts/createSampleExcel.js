import xlsx from 'xlsx';

// สร้างข้อมูลตัวอย่างตามข้อมูลจริงที่คุณให้มา
const sampleData = [
  {
    shopId: 'ShopID014',
    month: 9,
    year: 2025,
    revenue: 7345.80
  },
  {
    shopId: 'ShopID015', 
    month: 9,
    year: 2025,
    revenue: 4275.00
  },
  {
    shopId: 'ShopID016',
    month: 9,
    year: 2025,
    revenue: 2904.30
  },
  {
    shopId: 'ShopID017',
    month: 9,
    year: 2025,
    revenue: 4751.10
  },
  {
    shopId: 'ShopID018',
    month: 9,
    year: 2025,
    revenue: 1634.40
  }
];

// สร้าง workbook
const workbook = xlsx.utils.book_new();

// สร้าง worksheet
const worksheet = xlsx.utils.json_to_sheet(sampleData);

// เพิ่ม worksheet ลงใน workbook
xlsx.utils.book_append_sheet(workbook, worksheet, 'Revenue Data');

// บันทึกไฟล์
xlsx.writeFile(workbook, './revenue_data_sample.xlsx');

console.log('✅ สร้างไฟล์ Excel ตัวอย่างเสร็จสิ้น: revenue_data_sample.xlsx');
console.log('📊 ข้อมูลตัวอย่าง:');
console.table(sampleData);
console.log('\n📋 วิธีทดสอบ API:');
console.log('1. ใช้ Postman: POST /api/shops/import-revenue');
console.log('2. Body: form-data, Key: excelFile, Value: เลือกไฟล์ revenue_data_sample.xlsx');
console.log('3. หรือใช้ curl: curl -X POST -F "excelFile=@revenue_data_sample.xlsx" http://localhost:3000/api/shops/import-revenue');
