import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shop from '../models/Shop.js';
import Canteen from '../models/canteenModel.js';

dotenv.config();

// Mapping ของ canteenId กับชื่อโรงอาหาร
const canteenMapping = {
  1: 'โรงอาหาร C5',
  2: 'โรงอาหาร D1', 
  3: 'โรงอาหาร Dormity',
  4: 'โรงอาหาร E1',
  5: 'โรงอาหาร E2',
  6: 'โรงอาหาร Epark',
  7: 'โรงอาหาร Msquare',
  8: 'โรงอาหาร RuemRim',
  9: 'โรงอาหาร S2'
};

const updateShopCanteenIds = async () => {
  try {
    // เชื่อมต่อฐานข้อมูล
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // สร้างโรงอาหารในฐานข้อมูลถ้ายังไม่มี
    console.log('🔍 Checking and creating canteens...');
    for (const [canteenId, canteenName] of Object.entries(canteenMapping)) {
      let canteen = await Canteen.findOne({ name: canteenName });
      
      if (!canteen) {
        // สร้างโรงอาหารใหม่
        canteen = new Canteen({
          name: canteenName,
          type: 'canteen',
          path: `/admin/canteen/${canteenName.toLowerCase().replace(/โรงอาหาร /g, '')}`,
          image: '/images/default-canteen.png'
        });
        await canteen.save();
        console.log(`✅ Created canteen: ${canteenName} (ID: ${canteen._id})`);
      } else {
        console.log(`ℹ️  Canteen already exists: ${canteenName} (ID: ${canteen._id})`);
      }
    }

    // อัปเดตร้านค้าที่ไม่มี canteenId
    console.log('🔍 Updating shops without canteenId...');
    
    // หาร้านค้าทั้งหมด
    const allShops = await Shop.find({});
    console.log(`📊 Found ${allShops.length} total shops`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const shop of allShops) {
      // ถ้าร้านค้ามี canteenId อยู่แล้ว ให้ข้าม
      if (shop.canteenId) {
        console.log(`⏭️  Shop "${shop.name}" already has canteenId: ${shop.canteenId}`);
        skippedCount++;
        continue;
      }

      // พยายามหาว่าร้านค้านี้อยู่ในโรงอาหารไหน
      let assignedCanteenId = null;

      // ตรวจสอบจากชื่อร้านค้า
      const shopName = shop.name.toLowerCase();
      
      if (shopName.includes('c5') || shopName.includes('โรงอาหาร c5')) {
        assignedCanteenId = 1;
      } else if (shopName.includes('d1') || shopName.includes('โรงอาหาร d1')) {
        assignedCanteenId = 2;
      } else if (shopName.includes('dormity') || shopName.includes('dorm')) {
        assignedCanteenId = 3;
      } else if (shopName.includes('e1') || shopName.includes('โรงอาหาร e1')) {
        assignedCanteenId = 4;
      } else if (shopName.includes('e2') || shopName.includes('โรงอาหาร e2')) {
        assignedCanteenId = 5;
      } else if (shopName.includes('epark')) {
        assignedCanteenId = 6;
      } else if (shopName.includes('msquare') || shopName.includes('m-square')) {
        assignedCanteenId = 7;
      } else if (shopName.includes('ruemrim') || shopName.includes('ruem-rim')) {
        assignedCanteenId = 8;
      } else if (shopName.includes('s2') || shopName.includes('โรงอาหาร s2')) {
        assignedCanteenId = 9;
      }

      // ถ้าไม่สามารถระบุได้ ให้ใช้ค่าเริ่มต้น (C5)
      if (!assignedCanteenId) {
        assignedCanteenId = 1;
        console.log(`⚠️  Could not determine canteen for shop "${shop.name}", assigning to C5 (ID: 1)`);
      }

      // อัปเดตร้านค้า
      shop.canteenId = assignedCanteenId;
      await shop.save();
      
      const canteenName = canteenMapping[assignedCanteenId];
      console.log(`✅ Updated shop "${shop.name}" -> ${canteenName} (ID: ${assignedCanteenId})`);
      updatedCount++;
    }

    console.log('\n📊 Update Summary:');
    console.log(`- Total shops: ${allShops.length}`);
    console.log(`- Updated shops: ${updatedCount}`);
    console.log(`- Skipped shops: ${skippedCount}`);
    console.log(`- Shops without canteenId: ${allShops.length - skippedCount}`);

    // แสดงสถิติของร้านค้าในแต่ละโรงอาหาร
    console.log('\n🏢 Shops by Canteen:');
    for (const [canteenId, canteenName] of Object.entries(canteenMapping)) {
      const shopCount = await Shop.countDocuments({ canteenId: parseInt(canteenId) });
      console.log(`- ${canteenName}: ${shopCount} shops`);
    }

    console.log('\n🎉 Shop canteenId update completed successfully!');

  } catch (error) {
    console.error('❌ Error updating shop canteenIds:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// รัน script
updateShopCanteenIds(); 