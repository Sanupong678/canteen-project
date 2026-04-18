import mongoose from 'mongoose';
import dotenv from 'dotenv';

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
    console.log('📊 Database Name:', mongoose.connection.name);
    console.log('');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// ตรวจสอบ collections และจำนวน documents
const checkCollections = async () => {
  try {
    const db = mongoose.connection.db;
    
    // ดึงรายชื่อ collections ทั้งหมด
    const collections = await db.listCollections().toArray();
    
    console.log('='.repeat(60));
    console.log('📋 รายงาน Collections และจำนวน Documents');
    console.log('='.repeat(60));
    console.log(`\n🔢 จำนวน Collections ทั้งหมด: ${collections.length}\n`);
    
    // เรียงลำดับตามชื่อ collection
    collections.sort((a, b) => a.name.localeCompare(b.name));
    
    // เก็บข้อมูลเพื่อแสดงสรุป
    const collectionData = [];
    let totalDocuments = 0;
    
    // ตรวจสอบจำนวน documents ในแต่ละ collection
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      totalDocuments += count;
      
      collectionData.push({
        name: collectionName,
        count: count
      });
      
      // แสดงผลแบบตาราง
      const namePadding = ' '.repeat(Math.max(0, 40 - collectionName.length));
      console.log(`📁 ${collectionName}${namePadding}│  ${count.toLocaleString()} documents`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 สรุป: ${collections.length} Collections, ${totalDocuments.toLocaleString()} Documents ทั้งหมด`);
    console.log('='.repeat(60));
    
    // แสดง collections ที่มี documents มากที่สุด 5 อันดับแรก
    const topCollections = collectionData
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    if (topCollections.length > 0) {
      console.log('\n🏆 Top 5 Collections (เรียงตามจำนวน Documents):');
      topCollections.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.name}: ${col.count.toLocaleString()} documents`);
      });
    }
    
    // แสดง collections ที่ไม่มี documents
    const emptyCollections = collectionData.filter(c => c.count === 0);
    if (emptyCollections.length > 0) {
      console.log('\n⚠️  Collections ที่ไม่มี Documents:');
      emptyCollections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking collections:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  }
};

// รันสคริปต์
const run = async () => {
  await connectDB();
  await checkCollections();
};

run();

