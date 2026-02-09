# Backend Stability Fix - Testing Guide

## ปัญหาที่แก้ไข
เมื่อสลับหน้า (page navigation) บ่อยๆ backend หลุด ซึ่งอาจเกิดจาก:
1. **Socket connection churn** - การสร้าง/ลบ socket ซ้ำๆ
2. **DB pool exhaustion** - connection pool ใช้งานหมดเมื่อหลาย request พร้อมกัน
3. **Unhandled reconnection storms** - client พยายาม reconnect หลายครั้งพร้อมกัน

## การแก้ไข

### 1. Backend (Socket.IO) - `backend/socket.js`
- ✅ เพิ่ม metrics tracking (connect/disconnect counts)
- ✅ เปิด `connectionStateRecovery` เพื่อ restore session หลังจาก brief disconnect
- ✅ ปรับ ping/pong timeouts: `pingInterval=25s`, `pingTimeout=60s`
- ✅ เพิ่ม `serveClient=false` เพื่อลด overhead

### 2. Backend (Database) - `backend/config/database.js`
- ✅ เพิ่ม `waitQueueTimeoutMS=60s` เพื่อป้องกัน pool exhaustion
- ✅ เพิ่ม connection pool monitoring ทุก 30 วินาที
- ✅ เปิด `retryReads/retryWrites` และ `readPreference=primaryPreferred`

### 3. Frontend (Socket Client) - `frontend/plugins/socket.client.js`
- ✅ Singleton pattern: เก็บ socket ที่ `window.__CANTEEN_SOCKET__` เพื่อหลีกเลี่ยง duplicate connections
- ✅ Delayed reconnect: อปป้องกัน reconnect storm ด้วย 2s delay
- ✅ Health check ทุก 30s แม้ disconnect

### 4. Logging & Monitoring
- ✅ `backend/utils/metricsLogger.js`: Periodic metrics logging ลง file (rotate at 10MB)
- ✅ Debug endpoints:
  - `GET /debug/health/connections` - real-time socket + db pool stats
  - `GET /debug/metrics/recent?lines=50` - read last N log lines

## วิธีทดสอบ

### ขั้นที่ 1: เริ่ม Backend
```bash
cd backend
npm install
npm run start
```
✅ คุณจะเห็น:
```
🔌 Socket.IO initialized
📊 Metrics logging started
✅ MongoDB Connected
```

### ขั้นที่ 2: เริ่ม Frontend
```bash
cd frontend
npm run dev
```

### ขั้นที่ 3: ทดสอบ Rapid Page Navigation
1. เปิด http://localhost:3000 ในเบราว์เซอร์
2. Login ด้วยบัญชี test
3. สลับหน้าบ่อยๆ (อย่างน้อย 5-10 ครั้ง) - เช่น:
   - Home → Ranking → News → Leave → Home
   - ทำซ้ำประมาณ 20-30 ครั้ง ในเวลา 1 นาที
4. ตรวจสอบ:
   - Frontend มี error หรือ disconnect notifications ไหม?
   - Data ยังอัปเดตได้หรือไม่?

### ขั้นที่ 4: ตรวจสอบ Debug Endpoints
เปิด Terminal อีกหนึ่งและรัน:

```bash
# Real-time stats
curl http://localhost:4000/debug/health/connections | jq

# ผลที่คาดหวัง:
# {
#   "timestamp": "2026-02-09T10:00:00.000Z",
#   "socket": {
#     "connectCount": 5,
#     "disconnectCount": 0,
#     "activeSockets": 5,
#     "roomsSummary": { "global": 5, "admin": 1 }
#   },
#   "dbPool": {
#     "readyState": "connected",
#     "totalConnections": 10,
#     "availableConnections": 9
#   }
# }
```

```bash
# Recent metrics log
curl "http://localhost:4000/debug/metrics/recent?lines=20" | jq
```

### ขั้นที่ 5: ตรวจสอบ Metrics Log File
```bash
# หลังจากรัน ~30s ขึ้นไป
cat backend/logs/metrics.log | head -20

# ผลที่คาดหวัง:
# {"timestamp":"...","label":"PERIODIC_CHECK","data":{"socket":{...},"dbPool":{...}},"memory":{...}}
# {"timestamp":"...","label":"PERIODIC_CHECK","data":{...},...}
```

## สัญญาณที่บ่งชี้ปัญหา

❌ **ไม่ดี**:
- Socket disconnect frequently (> 1 per minute ที่ไม่จำเป็น)
- `waitQueueSize > 0` ใน dbPool (connection wait queue growing)
- `totalConnections = 0` (pool collapsed)
- Frontend แสดง error notifications
- API requests fail with 5xx errors

✅ **ดี**:
- `activeSockets` ≈ จำนวน tabs/windows ที่เปิด
- `connectCount` ≈ `disconnectCount` (หมายถึง graceful disconnects)
- `availableConnections` > 0 (pool มี connections พร้อม)
- No repeated error messages ใน server logs
- Frontend smooth transitions ระหว่าง pages

## Environmental Variables (ถ้าต้องปรับ)
```bash
# backend/.env
DB_MAX_POOL_SIZE=50           # max connections ใน pool
DB_MIN_POOL_SIZE=5            # min connections
DB_WAIT_QUEUE_TIMEOUT_MS=60000 # timeout ก่อน error
DB_SOCKET_TIMEOUT=300000      # 5 นาที socket timeout
```

## Cleanup / Logs
```bash
# ดูและลบ old metrics logs (เก็บเฉพาะ 1 สัปดาห์)
ls -la backend/logs/archive/
rm backend/logs/archive/*-old-*.log
```

## ถ้าปัญหายังมี

ให้บันทึก:
1. **Exact repro steps** - ทำอะไรที่เกิดปัญหา?
2. **Timestamps** - เมื่อไร backend หลุด?
3. **Metrics from `/debug/health/connections`** - ค่า stats ตอนเกิดปัญหา
4. **Server console logs** - copy-paste ข้อความ error/warning
5. **File logs** - send `backend/logs/metrics.log` + `backend/logs/archive/*`

### ติดตามและรายงาน
- Check `/debug/health/connections` ทุก 1 นาทีระหว่างการทดสอบ
- Record `connectCount` + `disconnectCount` ที่ timestamp เดียวกัน
- ถ้า ratio disconnects >> connects → indicator ของ stability issue
