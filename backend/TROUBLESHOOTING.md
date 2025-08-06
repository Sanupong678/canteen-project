# Troubleshooting Guide - การแก้ปัญหาการหลุดการเชื่อมต่อ

## ปัญหาที่พบบ่อย

### 1. เซิร์ฟเวอร์หลุดการเชื่อมต่อบ่อย

**สาเหตุที่เป็นไปได้:**
- การตั้งค่า MongoDB connection timeout ต่ำเกินไป
- ไม่มี error handling ที่ดี
- การตั้งค่า rate limiting แข็งเกินไป
- ปัญหาจาก network หรือ firewall

**วิธีแก้ไข:**

#### A. ตรวจสอบการตั้งค่า MongoDB
```javascript
// ใน config/database.js
const options = {
  serverSelectionTimeoutMS: 30000, // เพิ่มจาก 5000
  socketTimeoutMS: 60000, // เพิ่มจาก 45000
  connectTimeoutMS: 30000, // เพิ่มใหม่
  maxPoolSize: 10, // จำกัดจำนวน connection
  minPoolSize: 2, // กำหนดจำนวน connection ขั้นต่ำ
  maxIdleTimeMS: 30000, // เวลาที่ connection จะถูกปิด
  keepAlive: true, // เปิดใช้งาน keepAlive
  keepAliveInitialDelay: 300000 // 5 นาที
};
```

#### B. เพิ่ม Error Handling
```javascript
// ใน server.js
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // ไม่ exit ทันที ให้ลองใหม่
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  // ไม่ exit ทันที ให้ลองใหม่
});
```

#### C. ปรับ Rate Limiting
```javascript
// ใน config/server.js
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 นาที
  max: 200, // เพิ่มจาก 100
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 900 // 15 นาที
  }
});
```

### 2. MongoDB Connection Lost

**วิธีแก้ไข:**
```javascript
// เพิ่ม event listeners
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Connection Error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB Disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB Reconnected');
});
```

### 3. Memory Leaks

**วิธีแก้ไข:**
```javascript
// เพิ่ม memory monitoring
setInterval(() => {
  const used = process.memoryUsage();
  console.log('📊 Memory Usage:', {
    rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`
  });
}, 300000); // ทุก 5 นาที
```

### 4. Network Issues

**วิธีแก้ไข:**
```javascript
// เพิ่ม timeout สำหรับ requests
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 วินาที
  res.setTimeout(30000);
  next();
});
```

## การตั้งค่าที่แนะนำ

### Environment Variables
```env
# Database Configuration
DB_SERVER_SELECTION_TIMEOUT=30000
DB_SOCKET_TIMEOUT=60000
DB_CONNECT_TIMEOUT=30000
DB_MAX_POOL_SIZE=10
DB_MIN_POOL_SIZE=2
DB_MAX_IDLE_TIME=30000

# Keep Alive Settings
KEEP_ALIVE=true
KEEP_ALIVE_INITIAL_DELAY=300000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=200

# File Upload
MAX_FILE_SIZE=10485760
```

### การ Monitor เซิร์ฟเวอร์

```javascript
// เพิ่มใน server.js
const server = app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

// Monitor server health
setInterval(() => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  console.log('📊 Server Health:', {
    uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    memory: `${Math.round(memory.heapUsed / 1024 / 1024)} MB`,
    connections: server._connections || 'N/A'
  });
}, 60000); // ทุก 1 นาที
```

## การ Debug

### 1. เปิด Debug Mode
```javascript
// เพิ่มใน server.js
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}
```

### 2. ตรวจสอบ Logs
```bash
# ดู logs แบบ real-time
npm start 2>&1 | tee server.log

# หรือใช้ PM2
pm2 start server.js --name canteen-backend --log canteen.log
pm2 logs canteen-backend
```

### 3. ตรวจสอบ Network
```bash
# ตรวจสอบ port ที่ใช้
netstat -an | findstr :4000

# ตรวจสอบ MongoDB connection
mongo --eval "db.serverStatus()"
```

## การป้องกัน

1. **ใช้ PM2 สำหรับ Production**
```bash
npm install -g pm2
pm2 start server.js --name canteen-backend
pm2 startup
pm2 save
```

2. **เพิ่ม Health Check Endpoint**
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

3. **ใช้ Load Balancer** (ถ้าจำเป็น)
4. **ตั้งค่า Auto-restart** เมื่อเซิร์ฟเวอร์ล่ม
5. **Monitor Database Connection Pool** 