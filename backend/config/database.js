import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 45000,
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 120000,
      connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT) || 45000,
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 20,
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 2,
      maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME) || 60000,
      family: 4,
      keepAlive: (process.env.KEEP_ALIVE || 'true') === 'true',
      keepAliveInitialDelay: parseInt(process.env.KEEP_ALIVE_INITIAL_DELAY) || 300000
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // เพิ่ม event listeners สำหรับ connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Connection Error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB Disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB Reconnected');
    });

    // เพิ่ม connection pool monitoring
    mongoose.connection.on('connected', () => {
      console.log('📊 MongoDB Connection Pool Status:', {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      });
    });

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // ไม่ exit ทันที ให้ลองใหม่ พร้อมนับครั้งและแสดงสถานะ
    const retryDelay = parseInt(process.env.DB_RETRY_DELAY_MS) || 5000;
    setTimeout(() => {
      console.log(`🔄 Retrying MongoDB connection in ${retryDelay}ms...`);
      connectDB();
    }, retryDelay);
  }
};

export default connectDB; 