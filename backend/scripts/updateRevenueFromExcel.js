import mongoose from 'mongoose';
import xlsx from 'xlsx';
import Evaluation from '../models/Evaluation.js';
import Shop from '../models/shopModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const updateRevenueFromExcel = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canteen-project');
    console.log('Connected to MongoDB');

    // Read Excel file
    const workbook = xlsx.readFile('./revenue_data.xlsx'); // ชื่อไฟล์ Excel
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    console.log(`Found ${rows.length} rows in Excel file`);

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each row
    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.shopId || !row.month || !row.year || typeof row.revenue !== 'number') {
          const error = `ข้อมูลไม่ครบหรือผิดพลาด: shopId=${row.shopId}, month=${row.month}, year=${row.year}, revenue=${row.revenue}`;
          console.log('❌', error);
          errors.push(error);
          errorCount++;
          continue;
        }

        // Find shop by shopId (could be customId or _id)
        let shop = await Shop.findOne({ customId: row.shopId });
        if (!shop) {
          shop = await Shop.findById(row.shopId);
        }

        if (!shop) {
          const error = `ไม่พบร้านค้า: shopId=${row.shopId}`;
          console.log('❌', error);
          errors.push(error);
          errorCount++;
          continue;
        }

        // Update revenue in evaluations for this shop, month, year
        const result = await Evaluation.updateMany(
          {
            shopId: shop._id,
            evaluationMonth: parseInt(row.month),
            evaluationYear: parseInt(row.year)
          },
          { $set: { revenue: parseFloat(row.revenue) } }
        );

        if (result.modifiedCount > 0) {
          console.log(`✅ อัปเดตรายได้ร้าน ${shop.name} (${shop.customId}) เดือน ${row.month}/${row.year} => ${row.revenue} บาท (${result.modifiedCount} การประเมิน)`);
          successCount++;
        } else {
          const error = `ไม่พบการประเมินสำหรับร้าน ${shop.name} (${shop.customId}) เดือน ${row.month}/${row.year}`;
          console.log('⚠️', error);
          errors.push(error);
          errorCount++;
        }

      } catch (error) {
        const errorMsg = `เกิดข้อผิดพลาดในการประมวลผลแถว: ${JSON.stringify(row)} - ${error.message}`;
        console.log('❌', errorMsg);
        errors.push(errorMsg);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 สรุปผลการอัปเดต:');
    console.log(`✅ สำเร็จ: ${successCount} รายการ`);
    console.log(`❌ ผิดพลาด: ${errorCount} รายการ`);
    console.log(`📁 ทั้งหมด: ${rows.length} รายการ`);

    if (errors.length > 0) {
      console.log('\n❌ รายการข้อผิดพลาด:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

  } catch (error) {
    console.error('❌ Error updating revenue from Excel:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the update
updateRevenueFromExcel();
