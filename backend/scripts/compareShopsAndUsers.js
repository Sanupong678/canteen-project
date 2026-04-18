import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Shop from '../models/shopModel.js';
import User from '../models/userModel.js';

// Load environment variables
dotenv.config();

// เชื่อมต่อ database
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is required');
    }
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      family: 4
    };

    await mongoose.connect(mongoUri, options);
    console.log('✅ Connected to MongoDB:', mongoose.connection.host);
    console.log('');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// เปรียบเทียบข้อมูล shops และ users
const compareShopsAndUsers = async () => {
  try {
    // ดึงข้อมูลตัวอย่าง
    const shops = await Shop.find().limit(3).lean();
    const users = await User.find().limit(3).lean();
    
    console.log('='.repeat(80));
    console.log('📊 เปรียบเทียบโครงสร้างข้อมูล: Shops vs Users');
    console.log('='.repeat(80));
    
    // แสดงโครงสร้าง Shop
    console.log('\n🏪 โครงสร้างข้อมูล SHOP:');
    console.log('-'.repeat(80));
    if (shops.length > 0) {
      const shopFields = Object.keys(shops[0]);
      shopFields.forEach((field, index) => {
        const value = shops[0][field];
        const valueType = typeof value;
        const valuePreview = valueType === 'object' && value !== null 
          ? (Array.isArray(value) ? `[Array(${value.length})]` : `{Object}`)
          : String(value).substring(0, 50);
        console.log(`  ${index + 1}. ${field.padEnd(25)} │ Type: ${valueType.padEnd(10)} │ Example: ${valuePreview}`);
      });
    } else {
      console.log('  ไม่มีข้อมูล Shop');
    }
    
    // แสดงโครงสร้าง User
    console.log('\n👤 โครงสร้างข้อมูล USER:');
    console.log('-'.repeat(80));
    if (users.length > 0) {
      const userFields = Object.keys(users[0]);
      userFields.forEach((field, index) => {
        const value = users[0][field];
        const valueType = typeof value;
        const valuePreview = valueType === 'object' && value !== null 
          ? (Array.isArray(value) ? `[Array(${value.length})]` : `{Object}`)
          : String(value).substring(0, 50);
        console.log(`  ${index + 1}. ${field.padEnd(25)} │ Type: ${valueType.padEnd(10)} │ Example: ${valuePreview}`);
      });
    } else {
      console.log('  ไม่มีข้อมูล User');
    }
    
    // เปรียบเทียบ fields
    console.log('\n' + '='.repeat(80));
    console.log('🔍 วิเคราะห์ความแตกต่าง:');
    console.log('='.repeat(80));
    
    if (shops.length > 0 && users.length > 0) {
      const shopFields = new Set(Object.keys(shops[0]));
      const userFields = new Set(Object.keys(users[0]));
      
      // Fields ที่มีเฉพาะใน Shop
      const shopOnlyFields = [...shopFields].filter(f => !userFields.has(f));
      console.log('\n📌 Fields ที่มีเฉพาะใน SHOP:');
      if (shopOnlyFields.length > 0) {
        shopOnlyFields.forEach(field => {
          console.log(`   • ${field}`);
        });
      } else {
        console.log('   (ไม่มี)');
      }
      
      // Fields ที่มีเฉพาะใน User
      const userOnlyFields = [...userFields].filter(f => !shopFields.has(f));
      console.log('\n📌 Fields ที่มีเฉพาะใน USER:');
      if (userOnlyFields.length > 0) {
        userOnlyFields.forEach(field => {
          console.log(`   • ${field}`);
        });
      } else {
        console.log('   (ไม่มี)');
      }
      
      // Fields ที่เหมือนกัน
      const commonFields = [...shopFields].filter(f => userFields.has(f));
      console.log('\n📌 Fields ที่เหมือนกันทั้งสอง:');
      if (commonFields.length > 0) {
        commonFields.forEach(field => {
          console.log(`   • ${field}`);
        });
      } else {
        console.log('   (ไม่มี)');
      }
    }
    
    // ตรวจสอบความสัมพันธ์
    console.log('\n' + '='.repeat(80));
    console.log('🔗 ความสัมพันธ์ระหว่าง Shop และ User:');
    console.log('='.repeat(80));
    
    const shopsWithUsers = await Shop.find().populate('userId').limit(3).lean();
    const usersWithShops = await User.find().populate('shopId').limit(3).lean();
    
    console.log('\n🏪 Shop → User (userId):');
    if (shopsWithUsers.length > 0) {
      shopsWithUsers.forEach((shop, index) => {
        console.log(`   ${index + 1}. Shop: ${shop.name} (${shop.customId})`);
        if (shop.userId && typeof shop.userId === 'object') {
          console.log(`      → User: ${shop.userId.name} (${shop.userId.role})`);
        } else {
          console.log(`      → User ID: ${shop.userId}`);
        }
      });
    }
    
    console.log('\n👤 User → Shop (shopId):');
    if (usersWithShops.length > 0) {
      usersWithShops.forEach((user, index) => {
        console.log(`   ${index + 1}. User: ${user.name} (${user.role})`);
        if (user.shopId && typeof user.shopId === 'object') {
          console.log(`      → Shop: ${user.shopId.name} (${user.shopId.customId})`);
        } else if (user.shopId) {
          console.log(`      → Shop ID: ${user.shopId}`);
        } else {
          console.log(`      → ไม่มี Shop`);
        }
      });
    }
    
    // สถิติ
    console.log('\n' + '='.repeat(80));
    console.log('📈 สถิติ:');
    console.log('='.repeat(80));
    
    const totalShops = await Shop.countDocuments();
    const totalUsers = await User.countDocuments();
    const usersWithShopId = await User.countDocuments({ shopId: { $exists: true, $ne: null } });
    const shopsWithUserId = await Shop.countDocuments({ userId: { $exists: true, $ne: null } });
    const shopRoleUsers = await User.countDocuments({ role: 'shop' });
    
    console.log(`\n🏪 Shops: ${totalShops} ร้าน`);
    console.log(`👤 Users: ${totalUsers} คน`);
    console.log(`   - Users ที่มี shopId: ${usersWithShopId} คน`);
    console.log(`   - Users ที่เป็น role 'shop': ${shopRoleUsers} คน`);
    console.log(`   - Shops ที่มี userId: ${shopsWithUserId} ร้าน`);
    
    // ตรวจสอบความสอดคล้อง
    console.log('\n' + '='.repeat(80));
    console.log('✅ ตรวจสอบความสอดคล้อง:');
    console.log('='.repeat(80));
    
    const shopsWithoutUser = await Shop.find({ userId: { $exists: false } }).countDocuments();
    const usersWithShopButNoShop = await User.aggregate([
      { $match: { shopId: { $exists: true, $ne: null } } },
      { $lookup: { from: 'shops', localField: 'shopId', foreignField: '_id', as: 'shop' } },
      { $match: { shop: { $size: 0 } } },
      { $count: 'count' }
    ]);
    
    console.log(`\n⚠️  Shops ที่ไม่มี userId: ${shopsWithoutUser} ร้าน`);
    if (usersWithShopButNoShop.length > 0) {
      console.log(`⚠️  Users ที่มี shopId แต่ Shop ไม่มีอยู่: ${usersWithShopButNoShop[0].count} คน`);
    } else {
      console.log(`✅ Users ที่มี shopId ทั้งหมดมี Shop อยู่จริง`);
    }
    
  } catch (error) {
    console.error('❌ Error comparing shops and users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
};

// รันสคริปต์
const run = async () => {
  await connectDB();
  await compareShopsAndUsers();
};

run();

