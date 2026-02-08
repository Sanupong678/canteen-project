import mongoose from 'mongoose';

const readyStateNames = { 
  0: 'disconnected', 
  1: 'connected', 
  2: 'connecting', 
  3: 'disconnecting' 
};

/**
 * ตรวจสอบว่า MongoDB connection พร้อมใช้งานหรือไม่
 * @returns {boolean} true ถ้า connection พร้อมใช้งาน
 */
export const isConnectionReady = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * ตรวจสอบและ reconnect MongoDB connection ถ้าจำเป็น
 * @returns {Promise<boolean>} true ถ้า connection พร้อมใช้งานหลังจาก reconnect
 */
export const ensureConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return true; // Connection พร้อมใช้งานแล้ว
  }
  
  const state = readyStateNames[mongoose.connection.readyState] || mongoose.connection.readyState;
  console.warn(`⚠️ MongoDB connection not ready: ${state}, attempting to reconnect...`);
  
  try {
    const mongoUri = process.env.MONGODB_URI || mongoose.connection._connectionString;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined');
    }
    
    // ถ้ายัง connecting อยู่ ให้รอ
    if (mongoose.connection.readyState === 2) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);
        
        mongoose.connection.once('connected', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        mongoose.connection.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });
      return true;
    }
    
    // Reconnect
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 50,
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 5,
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 300000,
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 30000,
      connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT) || 30000,
      retryWrites: true,
      retryReads: true
    });
    
    console.log('✅ MongoDB reconnected successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to reconnect to MongoDB:', error.message);
    return false;
  }
};

/**
 * ตรวจสอบ connection state และ log status
 * @returns {object} connection status info
 */
export const getConnectionStatus = () => {
  const state = mongoose.connection.readyState;
  return {
    readyState: readyStateNames[state] || state,
    readyStateCode: state,
    isReady: state === 1,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    port: mongoose.connection.port
  };
};

