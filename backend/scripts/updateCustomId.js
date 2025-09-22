import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shop from '../models/shopModel.js';
import Canteen from '../models/canteenModel.js';
import Bill from '../models/billModel.js';
import connectDB from '../config/database.js';

// Load environment variables
dotenv.config();

// Mapping table สำหรับชื่อย่อโรงอาหาร
const canteenAbbreviations = {
  'โรงอาหาร C5': 'C5',
  'โรงอาหาร D1': 'D1', 
  'โรงอาหาร Dormity': 'D',
  'โรงอาหาร E1': 'E1',
  'โรงอาหาร E2': 'E2',
  'โรงอาหาร Epark': 'EP',
  'โรงอาหาร Msquare': 'MQ',
  'โรงอาหาร RuemRim': 'RRN',
  'โรงอาหาร S2': 'S2'
};

// Function สำหรับสร้าง customId ใหม่
function generateNewCustomId(canteenName, existingCustomIds) {
  // หาชื่อย่อจากชื่อโรงอาหาร
  const abbreviation = canteenAbbreviations[canteenName];
  
  if (!abbreviation) {
    console.log(`⚠️  ไม่พบชื่อย่อสำหรับโรงอาหาร: ${canteenName}`);
    return null; // หรือ throw error
  }
  
  // หาเลขลำดับถัดไป
  let nextNumber = 1;
  const pattern = new RegExp(`^${abbreviation}(\\d{3})$`);
  
  // หาเลขสูงสุดที่มีอยู่แล้ว
  const existingNumbers = existingCustomIds
    .filter(id => pattern.test(id))
    .map(id => parseInt(id.match(pattern)[1]))
    .sort((a, b) => b - a);
  
  if (existingNumbers.length > 0) {
    nextNumber = existingNumbers[0] + 1;
  }
  
  // สร้าง customId ใหม่ (3 หลัก)
  return `${abbreviation}${nextNumber.toString().padStart(3, '0')}`;
}

// Function หลักสำหรับอัปเดต customId
async function updateCustomIds() {
  try {
    console.log('🚀 เริ่มต้นการอัปเดต customId...');
    
    // เชื่อมต่อ database
    await connectDB();
    console.log('✅ เชื่อมต่อ database สำเร็จ');
    
    // ดึงข้อมูลโรงอาหารทั้งหมด
    const canteens = await Canteen.find();
    console.log(`📋 พบโรงอาหาร ${canteens.length} แห่ง`);
    
    // สร้าง mapping ของ canteenId กับชื่อโรงอาหาร
    const canteenMap = {};
    canteens.forEach(canteen => {
      canteenMap[canteen.canteenId] = canteen.name;
    });
    
    console.log('🏢 Mapping โรงอาหาร:', canteenMap);
    
    // ดึงข้อมูลร้านค้าทั้งหมด
    const shops = await Shop.find();
    console.log(`🏪 พบร้านค้า ${shops.length} ร้าน`);
    
    // เก็บ customId ที่มีอยู่แล้วเพื่อตรวจสอบความซ้ำ
    const existingCustomIds = shops.map(shop => shop.customId);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const shop of shops) {
      const canteenName = canteenMap[shop.canteenId];
      
      if (!canteenName) {
        console.log(`⚠️  ไม่พบโรงอาหารสำหรับร้าน ${shop.name} (canteenId: ${shop.canteenId})`);
        skippedCount++;
        continue;
      }
      
      // สร้าง customId ใหม่
      const newCustomId = generateNewCustomId(canteenName, existingCustomIds);
      
      // ตรวจสอบว่า customId ใหม่ถูกสร้างหรือไม่
      if (!newCustomId) {
        console.log(`⚠️  ไม่สามารถสร้าง customId สำหรับร้าน ${shop.name} (โรงอาหาร: ${canteenName})`);
        skippedCount++;
        continue;
      }
      
      // ตรวจสอบว่า customId ใหม่ซ้ำกับที่มีอยู่หรือไม่
      if (existingCustomIds.includes(newCustomId)) {
        console.log(`⚠️  customId ${newCustomId} ซ้ำกับที่มีอยู่แล้ว`);
        skippedCount++;
        continue;
      }
      
      console.log(`🔄 อัปเดตร้าน: ${shop.name}`);
      console.log(`   โรงอาหาร: ${canteenName}`);
      console.log(`   customId เก่า: ${shop.customId}`);
      console.log(`   customId ใหม่: ${newCustomId}`);
      
      // อัปเดต customId ใน Shop
      await Shop.findByIdAndUpdate(shop._id, { customId: newCustomId });
      
      // อัปเดต customId ใน Bill ที่เกี่ยวข้อง
      await Bill.updateMany(
        { shopId: shop._id },
        { shopCustomId: newCustomId }
      );
      
      // อัปเดต existingCustomIds เพื่อป้องกันความซ้ำ
      const oldIndex = existingCustomIds.indexOf(shop.customId);
      if (oldIndex !== -1) {
        existingCustomIds[oldIndex] = newCustomId;
      } else {
        existingCustomIds.push(newCustomId);
      }
      
      updatedCount++;
      console.log(`   ✅ อัปเดตสำเร็จ\n`);
    }
    
    console.log('🎉 การอัปเดตเสร็จสิ้น!');
    console.log(`📊 สรุปผลลัพธ์:`);
    console.log(`   - อัปเดตสำเร็จ: ${updatedCount} ร้าน`);
    console.log(`   - ข้าม: ${skippedCount} ร้าน`);
    console.log(`   - รวม: ${shops.length} ร้าน`);
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    // ปิดการเชื่อมต่อ database
    await mongoose.disconnect();
    console.log('🔌 ปิดการเชื่อมต่อ database');
  }
}

// Function สำหรับแสดงตัวอย่าง customId ที่จะสร้าง
async function previewCustomIds() {
  try {
    console.log('🔍 แสดงตัวอย่าง customId ที่จะสร้าง...');
    
    // เชื่อมต่อ database
    await connectDB();
    console.log('✅ เชื่อมต่อ database สำเร็จ');
    
    // ดึงข้อมูลโรงอาหารทั้งหมด
    const canteens = await Canteen.find();
    const canteenMap = {};
    canteens.forEach(canteen => {
      canteenMap[canteen.canteenId] = canteen.name;
    });
    
    // ดึงข้อมูลร้านค้าทั้งหมด
    const shops = await Shop.find();
    const existingCustomIds = shops.map(shop => shop.customId);
    
    console.log('\n📋 ตัวอย่าง customId ที่จะสร้าง:');
    console.log('='.repeat(80));
    
    // จัดกลุ่มร้านค้าตามโรงอาหาร
    const shopsByCanteen = {};
    shops.forEach(shop => {
      const canteenName = canteenMap[shop.canteenId];
      if (!shopsByCanteen[canteenName]) {
        shopsByCanteen[canteenName] = [];
      }
      shopsByCanteen[canteenName].push(shop);
    });
    
    // แสดงตัวอย่างสำหรับแต่ละโรงอาหาร
    Object.keys(shopsByCanteen).forEach(canteenName => {
      if (!canteenName) return;
      
      console.log(`\n🏢 โรงอาหาร: ${canteenName}`);
      console.log(`   ชื่อย่อ: ${canteenAbbreviations[canteenName] || '❌ ไม่พบ'}`);
      console.log(`   จำนวนร้าน: ${shopsByCanteen[canteenName].length} ร้าน`);
      console.log('   รายละเอียด:');
      
      shopsByCanteen[canteenName].forEach((shop, index) => {
        const newCustomId = generateNewCustomId(canteenName, existingCustomIds);
        
        if (newCustomId) {
          existingCustomIds.push(newCustomId); // เพิ่มเข้าไปเพื่อป้องกันความซ้ำ
          
          console.log(`     ${index + 1}. ${shop.name}`);
          console.log(`        เก่า: ${shop.customId} → ใหม่: ${newCustomId}`);
        } else {
          console.log(`     ${index + 1}. ${shop.name}`);
          console.log(`        เก่า: ${shop.customId} → ใหม่: ❌ ไม่สามารถสร้างได้`);
        }
      });
    });
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 ปิดการเชื่อมต่อ database');
  }
}

// ตรวจสอบ command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'preview') {
  previewCustomIds();
} else if (command === 'update') {
  updateCustomIds();
} else {
  console.log('📖 วิธีใช้งาน:');
  console.log('   node updateCustomId.js preview  - แสดงตัวอย่าง customId ที่จะสร้าง');
  console.log('   node updateCustomId.js update   - อัปเดต customId จริง');
  console.log('\n⚠️  คำเตือน: ใช้คำสั่ง update อย่างระมัดระวัง เพราะจะเปลี่ยนข้อมูลใน database');
}
