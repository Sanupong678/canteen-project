# 🔄 Token System Comparison: Old vs New

## 📊 เปรียบเทียบระบบ Token Management

---

## ❌ ระบบเก่า (Old System)

### **1. Token Storage & Retrieval**

```javascript
// ❌ อ่าน token ตรงๆ จาก storage
const token = sessionStorage.getItem('token')
if (token) {
  config.headers.Authorization = `Bearer ${token}`
}
```

**ปัญหา:**
- ไม่ validate format
- ไม่ trim whitespace
- ไม่ตรวจสอบ format
- ส่ง token แม้จะเป็น "null", "undefined", หรือ whitespace

---

### **2. Token State Management**

```javascript
// ❌ ใช้ boolean/null
const token = sessionStorage.getItem('token')
if (token) {
  // ใช้ token
} else {
  // ไม่มี token
}
```

**ปัญหา:**
- ไม่รู้ว่า token หมดอายุหรือ malformed
- ไม่แยกแยะระหว่าง MISSING, EXPIRED, MALFORMED
- Decision ไม่ชัดเจน

---

### **3. Error Handling**

```javascript
// ❌ ไม่ validate ก่อนส่ง
const token = sessionStorage.getItem('token')
axios.get('/api/notifications/user', {
  headers: { Authorization: `Bearer ${token}` }
})
```

**ปัญหา:**
- ส่ง malformed token → Backend reject → "jwt malformed"
- ไม่ clear token เมื่อ invalid
- ไม่รู้สาเหตุที่แท้จริง

---

### **4. Socket Reconnection**

```javascript
// ❌ Reconnect ทันทีโดยไม่ delay
socket.on('disconnect', (reason) => {
  socket.connect()  // Reconnect ทันที
})
```

**ปัญหา:**
- Connection storm
- ใช้ token เก่าที่อาจ corrupt
- ไม่ validate token ก่อน reconnect

---

### **5. Logging**

```javascript
// ❌ Log token จริง (เสี่ยง security)
console.log('Token:', token)
```

**ปัญหา:**
- เปิดเผย token ใน log
- ไม่ปลอดภัย
- Debug ยาก

---

## ✅ ระบบใหม่ (New System)

### **1. Token Storage & Retrieval**

```javascript
// ✅ ใช้ utility function ที่ validate
import { getTokenWithState, TokenState } from '@/utils/tokenUtils'

const { token, state } = getTokenWithState()
if (state === TokenState.VALID && token) {
  config.headers.Authorization = `Bearer ${token}`
} else {
  clearInvalidToken()  // Clear ถ้า invalid
}
```

**ข้อดี:**
- Validate format ก่อนใช้
- Trim whitespace
- ตรวจสอบ JWT format (3 parts)
- Clear token อัตโนมัติเมื่อ invalid

---

### **2. Token State Management**

```javascript
// ✅ ใช้ Enum
export const TokenState = {
  VALID: 'VALID',
  EXPIRED: 'EXPIRED',
  MALFORMED: 'MALFORMED',
  MISSING: 'MISSING'
}

const { token, state } = getTokenWithState()
switch (state) {
  case TokenState.VALID:
    // ใช้ token
    break
  case TokenState.EXPIRED:
    // Clear และ redirect
    break
  case TokenState.MALFORMED:
    // Clear และ redirect
    break
  case TokenState.MISSING:
    // Redirect to login
    break
}
```

**ข้อดี:**
- Decision ชัดเจน
- Backend/Frontend reason ตรงกัน
- Log อ่านง่าย

---

### **3. Error Handling**

```javascript
// ✅ Validate ก่อนส่ง
const { token, state } = getTokenWithState()

if (state !== TokenState.VALID || !token) {
  logTokenState(state, token)
  clearInvalidToken()
  return  // ไม่ส่ง request
}

// ใช้ axios interceptor (validate อัตโนมัติ)
axios.get('/api/notifications/user')
```

**ข้อดี:**
- ไม่ส่ง malformed token
- Clear token อัตโนมัติ
- รู้สาเหตุที่แท้จริง (state)

---

### **4. Socket Reconnection**

```javascript
// ✅ Delayed reconnect + Token validation
const RECONNECT_DELAY_MS = 2000

socket.on('disconnect', (reason) => {
  const { token, state } = getTokenWithState()
  
  if (state === TokenState.VALID && token) {
    // Delay intentional reconnect
    setTimeout(() => {
      // Double-check token state after delay
      const { token: delayedToken, state: delayedState } = getTokenWithState()
      if (delayedState === TokenState.VALID && delayedToken) {
        socket.auth = { token: delayedToken }
        socket.connect()
      }
    }, RECONNECT_DELAY_MS)
  }
})
```

**ข้อดี:**
- ป้องกัน connection storm
- ให้ auth state settle
- Validate token ก่อน reconnect
- Update token เมื่อ reconnect

---

### **5. Logging**

```javascript
// ✅ Log fingerprint แทน token จริง
export const getTokenFingerprint = (token) => {
  return token?.slice(0, 10) + '...'
}

logTokenState(state, token)
// Output: [AUTH] Token state: VALID, fingerprint: eyJhbGciO...
```

**ข้อดี:**
- ปลอดภัย (ไม่เปิดเผย token)
- Debug ได้ (รู้ว่าเป็น token ไหน)
- ตาม best practices

---

## 📋 สรุปเปรียบเทียบ

| Feature | ระบบเก่า ❌ | ระบบใหม่ ✅ |
|---------|------------|------------|
| **Token Validation** | ไม่ validate | Validate format + expiration |
| **Token State** | Boolean/null | Enum (VALID, EXPIRED, MALFORMED, MISSING) |
| **Error Handling** | ส่ง token ไปก่อน → Backend reject | Validate ก่อน → ไม่ส่งถ้า invalid |
| **Socket Reconnect** | Reconnect ทันที | Delayed (2s) + Validate |
| **Token Clearing** | Manual | อัตโนมัติเมื่อ invalid |
| **Logging** | Log token จริง | Log fingerprint |
| **Decision Logic** | ไม่ชัดเจน | ชัดเจน (ใช้ enum) |
| **Security** | เปิดเผย token | ปลอดภัย (fingerprint) |

---

## 🎯 Key Improvements

### **1. Prevention over Detection**
- **เก่า**: ส่ง token → Backend reject → Handle error
- **ใหม่**: Validate ก่อน → ไม่ส่งถ้า invalid → ไม่เกิด error

### **2. State-based Decision**
- **เก่า**: `if (token)` → ไม่รู้ว่า valid หรือไม่
- **ใหม่**: `if (state === TokenState.VALID)` → รู้ชัดเจน

### **3. Centralized Validation**
- **เก่า**: Validate หลายที่ → ไม่ consistent
- **ใหม่**: Single source of truth (`getTokenWithState()`)

### **4. Better Error Recovery**
- **เก่า**: Error → ไม่ clear token → Retry → Error again
- **ใหม่**: Error → Clear token → Stop retry → Redirect

---

## 🔍 Example Flow Comparison

### **เก่า: Malformed Token Flow**
```
1. sessionStorage.setItem('token', 'null')  // String "null"
2. const token = sessionStorage.getItem('token')  // "null"
3. axios.get('/api/...', { headers: { Authorization: 'Bearer null' } })
4. Backend: "jwt malformed" ❌
5. Socket reconnect → ใช้ token เดิม → Error again
6. ... (infinite loop)
```

### **ใหม่: Malformed Token Flow**
```
1. sessionStorage.setItem('token', 'null')  // String "null"
2. const { token, state } = getTokenWithState()
3. state = TokenState.MALFORMED  // Detect malformed
4. clearInvalidToken()  // Clear อัตโนมัติ
5. ไม่ส่ง request → ไม่เกิด error ✅
6. Redirect to login
```

---

## 💡 Best Practices ที่ใช้

1. ✅ **Token State Enum** - Decision ชัดเจน
2. ✅ **Validate Before Send** - Prevention over detection
3. ✅ **Delayed Reconnect** - Prevent storm
4. ✅ **API First Detection** - API detect → Clear → Disconnect socket
5. ✅ **Token Fingerprint** - Safe logging
6. ✅ **Single Source of Truth** - `getTokenWithState()`

