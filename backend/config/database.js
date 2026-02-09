import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT) || 30000,
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT) || 300000, // เพิ่มเป็น 5 นาที
      connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT) || 30000,
      // เพิ่ม connection pool size เพื่อรองรับการเรียก API หลายครั้งพร้อมกัน
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 50, // เพิ่มจาก 10 เป็น 50
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 5, // เพิ่มจาก 2 เป็น 5
      maxIdleTimeMS: parseInt(process.env.DB_MAX_IDLE_TIME) || 300000, // เพิ่มเป็น 5 นาที (300000ms)
      heartbeatFrequencyMS: 10000, // ส่ง heartbeat ทุก 10 วินาที
      family: 4,
      // เพิ่ม retry logic
      retryWrites: true,
      retryReads: true,
      // เพิ่ม options สำหรับความเสถียร
      maxStalenessSeconds: 90, // อนุญาตให้อ่านจาก secondary ที่ stale ไม่เกิน 90 วินาที
      readPreference: 'primaryPreferred', // อ่านจาก primary ก่อน แต่ถ้า primary ไม่มีให้อ่านจาก secondary
      // wait queue timeout: ป้องกัน connection pool exhaustion
      waitQueueTimeoutMS: parseInt(process.env.DB_WAIT_QUEUE_TIMEOUT_MS) || 60000, // default 60s
      // เพิ่ม connection pool monitoring
      monitorCommands: process.env.NODE_ENV === 'development' // log commands ใน development
      // Removed deprecated options: keepAlive and keepAliveInitialDelay
      // MongoDB driver now handles these automatically
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // เพิ่ม event listeners สำหรับ connection
    mongoose.connection.on('error', (err) => {
      const timestamp = new Date().toISOString();
      console.error(`\n${'='.repeat(80)}`);
      console.error(`❌ [${timestamp}] MongoDB Connection Error occurred`);
      console.error(`📋 Error name:`, err.name);
      console.error(`📋 Error message:`, err.message);
      console.error(`📋 Error code:`, err.code);
      if (err.stack) {
        console.error(`📋 Error stack:`, err.stack);
      }
      console.error(`📊 Connection state:`, {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      });
      console.error(`⚠️ Will attempt to reconnect automatically`);
      console.error(`${'='.repeat(80)}\n`);
      // ไม่ exit process ให้ reconnect อัตโนมัติ
    });
    
    mongoose.connection.on('disconnected', () => {
      const timestamp = new Date().toISOString();
      console.log(`\n${'='.repeat(80)}`);
      console.log(`⚠️ [${timestamp}] MongoDB Disconnected`);
      console.log(`📋 Disconnection stack:`, new Error().stack);
      console.log(`📊 Connection state before disconnect:`, {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      });
      console.log(`🔄 Attempting to reconnect immediately...`);
      console.log(`${'='.repeat(80)}\n`);
      
      // พยายาม reconnect อัตโนมัติทันที (ไม่ต้องรอ 5 วินาที)
      if (mongoose.connection.readyState === 0) { // 0 = disconnected
        const reconnectTimestamp = new Date().toISOString();
        console.log(`🔄 [${reconnectTimestamp}] Attempting to reconnect to MongoDB...`);
        
        // ใช้ setImmediate เพื่อให้ event loop ทำงานก่อน
        setImmediate(async () => {
          try {
            await mongoose.connect(process.env.MONGODB_URI, options);
            console.log(`✅ [${reconnectTimestamp}] Reconnected successfully`);
          } catch (err) {
            console.error(`❌ [${reconnectTimestamp}] Reconnection failed:`, err.message);
            console.error(`📋 Reconnection error stack:`, err.stack);
            
            // Retry อีกครั้งหลังจาก 5 วินาที
            setTimeout(async () => {
              try {
                await mongoose.connect(process.env.MONGODB_URI, options);
                console.log(`✅ Retry reconnection successful`);
              } catch (retryErr) {
                console.error(`❌ Retry reconnection failed:`, retryErr.message);
              }
            }, 5000);
          }
        });
      }
    });
    
    mongoose.connection.on('reconnected', () => {
      const timestamp = new Date().toISOString();
      console.log(`\n${'='.repeat(80)}`);
      console.log(`✅ [${timestamp}] MongoDB Reconnected successfully`);
      console.log(`📊 Connection state:`, {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      });
      console.log(`${'='.repeat(80)}\n`);
    });
    
    // เพิ่ม event listener สำหรับ connection timeout
    mongoose.connection.on('timeout', () => {
      const timestamp = new Date().toISOString();
      console.warn(`\n${'='.repeat(80)}`);
      console.warn(`⚠️ [${timestamp}] MongoDB Connection Timeout`);
      console.warn(`📋 Timeout stack:`, new Error().stack);
      console.warn(`📊 Connection state:`, {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name
      });
      console.warn(`🔄 Will attempt to reconnect...`);
      console.warn(`${'='.repeat(80)}\n`);
    });

    // เพิ่ม connection pool monitoring
    mongoose.connection.on('connected', () => {
      const pool = mongoose.connection.db?.serverConfig?.s?.pool;
      console.log('📊 MongoDB Connection Pool Status:', {
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name,
        poolSize: pool?.totalConnectionCount || 'N/A',
        availableConnections: pool?.availableConnectionCount || 'N/A',
        waitQueueSize: pool?.waitQueueSize || 'N/A'
      });
    });
    
    // Monitor connection pool ทุก 30 วินาที
    const poolMonitorInterval = setInterval(() => {
      const readyState = mongoose.connection.readyState;
      const readyStateNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
      
      if (readyState === 1) { // 1 = connected
        // ลองเข้าถึง pool info จากหลาย path (ขึ้นอยู่กับ mongoose version)
        let pool = null;
        try {
          // Path สำหรับ mongoose 6.x
          pool = mongoose.connection.client?.topology?.s?.pool;
          if (!pool) {
            // Path สำหรับ mongoose 5.x
            pool = mongoose.connection.db?.serverConfig?.s?.pool;
          }
          if (!pool) {
            // Path อื่นๆ
            pool = mongoose.connection.client?.topology?.s?.servers?.values()?.next()?.value?.s?.pool;
          }
        } catch (e) {
          // Ignore
        }
        
        const poolInfo = {
          readyState: readyStateNames[readyState] || readyState,
          totalConnections: pool?.totalConnectionCount || pool?.size || 'N/A',
          availableConnections: pool?.availableConnectionCount || pool?.availableCount || 'N/A',
          waitQueueSize: pool?.waitQueueSize || pool?.waitingCount || 'N/A',
          maxPoolSize: options.maxPoolSize,
          minPoolSize: options.minPoolSize
        };
        
        // Log เมื่อมีปัญหา (waitQueueSize > 0 หรือ availableConnections < minPoolSize หรือ totalConnections = 0)
        const hasIssue = 
          (typeof poolInfo.waitQueueSize === 'number' && poolInfo.waitQueueSize > 0) ||
          (typeof poolInfo.availableConnections === 'number' && poolInfo.availableConnections < poolInfo.minPoolSize) ||
          (typeof poolInfo.totalConnections === 'number' && poolInfo.totalConnections === 0);
        
        if (hasIssue) {
          console.warn('⚠️ MongoDB Connection Pool Warning:', poolInfo);
          
          // ถ้า totalConnections = 0 แสดงว่า connection หลุด ให้ reconnect
          if (typeof poolInfo.totalConnections === 'number' && poolInfo.totalConnections === 0) {
            console.warn('🔄 Connection pool is empty, checking connection state...');
            if (mongoose.connection.readyState !== 1) {
              console.warn('🔄 Connection is not ready, attempting to reconnect...');
              mongoose.connect(process.env.MONGODB_URI, options).catch(err => {
                console.error('❌ Reconnection failed:', err.message);
              });
            }
          }
        }
      } else {
        // Connection ไม่พร้อม
        console.warn(`⚠️ MongoDB Connection State: ${readyStateNames[readyState] || readyState}`);
        if (readyState === 0) {
          // Disconnected - พยายาม reconnect
          console.warn('🔄 Connection is disconnected, attempting to reconnect...');
          mongoose.connect(process.env.MONGODB_URI, options).catch(err => {
            console.error('❌ Reconnection failed:', err.message);
          });
        }
      }
    }, 30000); // ทุก 30 วินาที
    
    // Cleanup interval เมื่อ process exit
    process.on('SIGTERM', () => clearInterval(poolMonitorInterval));
    process.on('SIGINT', () => clearInterval(poolMonitorInterval));

    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // ไม่ exit ทันที ให้ลองใหม่
    setTimeout(() => {
      console.log('🔄 Retrying MongoDB connection...');
      connectDB();
    }, 5000);
  }
};

export default connectDB; 

export const getPoolInfo = () => {
  try {
    const readyState = mongoose.connection.readyState;
    const readyStateNames = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    let pool = null;
    try {
      pool = mongoose.connection.client?.topology?.s?.pool || mongoose.connection.db?.serverConfig?.s?.pool;
    } catch (e) {
      pool = null;
    }

    return {
      readyState: readyStateNames[readyState] || readyState,
      totalConnections: pool?.totalConnectionCount || pool?.size || 'N/A',
      availableConnections: pool?.availableConnectionCount || pool?.availableCount || 'N/A',
      waitQueueSize: pool?.waitQueueSize || pool?.waitingCount || 'N/A',
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 50
    };
  } catch (e) {
    return { error: String(e) };
  }
};