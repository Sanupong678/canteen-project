# 🔄 Token Lifecycle + Timing Issue Analysis

## 📋 ปัญหา Chain Reaction

```
CORS → Socket Timeout → JWT Malformed → Reconnect Loop
```

---

## 🕐 ลำดับเวลา (Timing) ที่เกิดปัญหา

### **Scenario 1: Page Load / Navigation**

```
Time 0ms:   Browser loads page
Time 10ms:  Nuxt plugin initializes
Time 15ms:  Socket plugin runs → getValidToken() → reads sessionStorage
Time 20ms:  Socket.io connects with token from sessionStorage
Time 25ms:  Axios interceptor runs → getValidToken() → reads sessionStorage
Time 30ms:  API request sent with token
```

**ปัญหา:**
- Socket และ Axios อ่าน token **พร้อมกัน** แต่ token อาจยังไม่พร้อม
- ถ้า token ถูกเขียนช้ากว่า (เช่น จาก login redirect) → socket จะใช้ token เก่าหรือ null

---

### **Scenario 2: Token Expired / Invalid**

```
Time 0ms:    User logged in, token stored in sessionStorage
Time 1hr:    Token expires (แต่ยังอยู่ใน sessionStorage)
Time 1hr+1s: Socket reconnects → ใช้ expired token
Time 1hr+2s: Backend rejects → "jwt expired"
Time 1hr+3s: Socket retries → ใช้ expired token อีกครั้ง
Time 1hr+4s: Backend rejects → "jwt expired"
... (loop วนไม่จบ)
```

**ปัญหา:**
- Token หมดอายุแล้ว แต่ยังอยู่ใน storage
- Socket reconnect ใช้ token เก่าที่หมดอายุ
- ไม่มีการ clear token เมื่อหมดอายุ

---

### **Scenario 3: CORS → Socket Timeout → Malformed Token**

```
Time 0ms:    CORS preflight request fails (network issue)
Time 100ms:  Socket connection timeout (60s)
Time 60s:    Socket disconnects → reason: "transport close"
Time 60s+1s: Socket auto-reconnects
Time 60s+2s: Socket reads token from sessionStorage
Time 60s+3s: Token อาจถูก corrupt (whitespace, null, undefined)
Time 60s+4s: Socket sends malformed token → "jwt malformed"
Time 60s+5s: Socket retries → ใช้ malformed token อีกครั้ง
... (infinite loop)
```

**ปัญหา:**
- CORS error ทำให้ socket timeout
- Socket reconnect อ่าน token ที่อาจถูก corrupt
- ไม่มีการ validate token ก่อนส่ง

---

## 🔍 สาเหตุหลัก: Token Lifecycle Issues

### **1. Race Condition ระหว่าง Socket และ Axios**

```javascript
// ❌ ปัญหา: อ่าน token หลายครั้งพร้อมกัน
const token1 = sessionStorage.getItem('token')  // Socket
const token2 = sessionStorage.getItem('token')  // Axios
// ถ้า token ถูก clear ระหว่างนี้ → token2 = null แต่ token1 ยังมีค่า
```

### **2. Token ไม่ถูก Clear เมื่อหมดอายุ**

```javascript
// ❌ ปัญหา: Token หมดอายุแล้วแต่ยังอยู่ใน storage
sessionStorage.setItem('token', expiredToken)
// Socket reconnect ใช้ expired token → infinite loop
```

### **3. Token Corrupt ระหว่าง Network Error**

```javascript
// ❌ ปัญหา: Network error → token อาจถูก corrupt
sessionStorage.setItem('token', 'null')  // String "null" ไม่ใช่ null
sessionStorage.setItem('token', 'undefined')  // String "undefined"
sessionStorage.setItem('token', ' ')  // Whitespace only
// Socket ส่ง malformed token → "jwt malformed"
```

### **4. Socket Reconnect ไม่ Update Token**

```javascript
// ❌ ปัญหา: Socket reconnect ใช้ token เก่า
socket.on('reconnect', () => {
  // ไม่ได้ update token → ใช้ token เก่าที่อาจหมดอายุ
  socket.connect()  // ใช้ token เก่า
})
```

---

## ✅ วิธีแก้ไข (ที่ทำไปแล้ว)

### **1. Token Validation ก่อนใช้**

```javascript
// ✅ Validate token format ก่อนส่ง
const token = getValidToken()  // Validate JWT format
if (!token) {
  clearInvalidToken()  // Clear ถ้า invalid
  return
}
```

### **2. Single Source of Truth**

```javascript
// ✅ ใช้ utility function เดียว
export const getValidToken = () => {
  let token = sessionStorage.getItem('token') || localStorage.getItem('token')
  return cleanToken(token)  // Validate และ clean
}
```

### **3. Prevent Infinite Reconnect Loop**

```javascript
// ✅ Track invalid attempts
let invalidTokenAttempts = 0
const MAX_INVALID_TOKEN_ATTEMPTS = 3

if (invalidTokenAttempts >= MAX_INVALID_TOKEN_ATTEMPTS) {
  clearInvalidToken()
  socket.disconnect()  // หยุด reconnect
  window.location.href = '/login'  // Redirect
}
```

### **4. Update Token เมื่อ Reconnect**

```javascript
// ✅ Update token เมื่อ reconnect
socket.on('connect', () => {
  const currentToken = getValidToken()
  if (currentToken && socket.auth?.token !== currentToken) {
    socket.auth = { token: currentToken }  // Update token
  }
})
```

---

## 📊 Flow Diagram

### **Before (มีปัญหา):**

```
Page Load
  ↓
Socket Init → Read Token (อาจ null/corrupt)
  ↓
Socket Connect → Send Token
  ↓
Backend Reject → "jwt malformed"
  ↓
Socket Reconnect → Read Token อีกครั้ง (ยัง malformed)
  ↓
Backend Reject → "jwt malformed"
  ↓
... (infinite loop)
```

### **After (แก้ไขแล้ว):**

```
Page Load
  ↓
Socket Init → getValidToken() → Validate Format
  ↓
Token Valid? → No → Clear & Don't Connect
  ↓
Token Valid? → Yes → Socket Connect
  ↓
Backend Reject? → Track Invalid Attempts
  ↓
Max Attempts? → Yes → Clear Token & Stop Reconnect
  ↓
Max Attempts? → No → Update Token & Retry
```

---

## 🎯 Key Takeaways

1. **Timing Issue**: Socket และ Axios อ่าน token พร้อมกัน → race condition
2. **Lifecycle Issue**: Token ไม่ถูก clear เมื่อหมดอายุ → infinite reconnect
3. **Validation Issue**: ไม่ validate token format → malformed token
4. **Update Issue**: Socket reconnect ไม่ update token → ใช้ token เก่า

**Solution**: 
- ✅ Validate token ก่อนใช้
- ✅ Single source of truth (utility function)
- ✅ Track invalid attempts
- ✅ Update token เมื่อ reconnect
- ✅ Clear token เมื่อ invalid

