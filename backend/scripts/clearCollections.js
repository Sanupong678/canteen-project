import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Collections ที่ต้องการลบข้อมูล
const COLLECTIONS_TO_CLEAR = [
  'bills',
  'logins',
  'notifications',
  'repairs',
  'shops',
  'leaves',
  'users'
];

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
    console.log('📊 Database Name:', mongoose.connection.name);
    console.log('');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// ตรวจสอบจำนวน documents ก่อนลบ
const checkDocumentsBeforeDelete = async () => {
  const db = mongoose.connection.db;
  const stats = {};
  let totalBefore = 0;

  console.log('='.repeat(80));
  console.log('📋 จำนวน Documents ก่อนลบ:');
  console.log('='.repeat(80));
  
  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    try {
      const count = await db.collection(collectionName).countDocuments();
      stats[collectionName] = count;
      totalBefore += count;
      console.log(`📁 ${collectionName.padEnd(20)} │ ${count.toLocaleString().padStart(10)} documents`);
    } catch (error) {
      console.log(`⚠️  ${collectionName.padEnd(20)} │ Collection ไม่พบหรือเกิดข้อผิดพลาด`);
      stats[collectionName] = 0;
    }
  }
  
  console.log('-'.repeat(80));
  console.log(`📊 รวมทั้งหมด: ${totalBefore.toLocaleString()} documents`);
  console.log('='.repeat(80));
  
  return stats;
};

// ลบข้อมูลใน collections
const clearCollections = async (confirm = false) => {
  if (!confirm) {
    console.log('\n⚠️  ต้องการยืนยันการลบข้อมูล!');
    console.log('💡 ใช้คำสั่ง: node scripts/clearCollections.js --confirm');
    console.log('   หรือ: node scripts/clearCollections.js confirm');
    return;
  }

  const db = mongoose.connection.db;
  const results = {};
  let totalDeleted = 0;

  console.log('\n' + '='.repeat(80));
  console.log('🗑️  กำลังลบข้อมูล...');
  console.log('='.repeat(80));

  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    try {
      const collection = db.collection(collectionName);
      const countBefore = await collection.countDocuments();
      
      if (countBefore > 0) {
        const result = await collection.deleteMany({});
        results[collectionName] = {
          deleted: result.deletedCount,
          success: true
        };
        totalDeleted += result.deletedCount;
        console.log(`✅ ${collectionName.padEnd(20)} │ ลบ ${result.deletedCount.toLocaleString()} documents สำเร็จ`);
      } else {
        results[collectionName] = {
          deleted: 0,
          success: true
        };
        console.log(`ℹ️  ${collectionName.padEnd(20)} │ ไม่มีข้อมูลให้ลบ`);
      }
    } catch (error) {
      results[collectionName] = {
        deleted: 0,
        success: false,
        error: error.message
      };
      console.log(`❌ ${collectionName.padEnd(20)} │ เกิดข้อผิดพลาด: ${error.message}`);
    }
  }

  console.log('-'.repeat(80));
  console.log(`📊 รวมลบทั้งหมด: ${totalDeleted.toLocaleString()} documents`);
  console.log('='.repeat(80));

  // ตรวจสอบจำนวน documents หลังลบ
  console.log('\n' + '='.repeat(80));
  console.log('📋 จำนวน Documents หลังลบ:');
  console.log('='.repeat(80));

  let totalAfter = 0;
  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    try {
      const count = await db.collection(collectionName).countDocuments();
      totalAfter += count;
      console.log(`📁 ${collectionName.padEnd(20)} │ ${count.toLocaleString().padStart(10)} documents`);
    } catch (error) {
      console.log(`⚠️  ${collectionName.padEnd(20)} │ Collection ไม่พบ`);
    }
  }

  console.log('-'.repeat(80));
  console.log(`📊 รวมทั้งหมด: ${totalAfter.toLocaleString()} documents`);
  console.log('='.repeat(80));

  return results;
};

// รันสคริปต์
const run = async () => {
  await connectDB();
  
  // ตรวจสอบ arguments
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm') || args.includes('confirm') || args.includes('yes');
  
  // แสดงจำนวน documents ก่อนลบ
  await checkDocumentsBeforeDelete();
  
  // ลบข้อมูล
  await clearCollections(confirm);
  
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
};

run();

