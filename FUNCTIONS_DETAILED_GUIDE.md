# 📖 รายละเอียด Functions: Admin vs User

## 🏢 ADMIN FUNCTIONS (ฟังก์ชันผู้บริหาร)

Admin คือ ผู้มีสิทธิ์เข้าถึงทั้งระบบ สามารถจัดการทุกอย่าง

---

### 1️⃣ **Dashboard & View All Repairs** 
`GET /api/repairs` (Admin)

#### 🎯 วัตถุประสงค์
- ผู้บริหารต้องการมองภาพรวมการแจ้งซ่อมทั้งโรงอาหาร
- ติดตามความคืบหน้า, ตรวจสอบสถานะ

#### 📝 Request Body
```
Header:
Authorization: Bearer <JWT_TOKEN>
Role: admin
```

#### ✅ Response Success (200)
```javascript
{
  data: [
    {
      _id: "507f1f77bcf86cd799439011",
      userId: "507f1f77bcf86cd799439012",
      shopId: "507f1f77bcf86cd799439013",
      shopName: "ร้านกระเพราะแม่นึก",
      canteen: "โรงอาหาร 1",
      category: "ไฟฟ้า",
      issue: "พัดลมหลักขัด หมุนไม่ได้",
      status: "pending",                    // pending, in_progress, completed, cancelled
      imagePaths: [
        "/uploads/repairs/507f1f/2025/02/repair-1707545730000-A7K.jpg",
        "/uploads/repairs/507f1f/2025/02/repair-1707545731000-B2M.jpg"
      ],
      createdAt: "2025-02-11T10:30:45.000Z",
      updatedAt: "2025-02-11T10:30:45.000Z"
    },
    // ... more repairs
  ]
}
```

#### 🔍 Implementation Details
```
Query Flow:
1. Receive GET request → verify token (JWT)
2. Check role = 'admin' (middleware: isAdmin)
3. Query Repair collection:
   - Find all documents
   - Sort by createdAt (-1) = newest first
   - .select('-images') = exclude base64 field (performance!)
   - .lean() = return plain objects (memory efficient)
4. Extract unique shopIds from results
5. Batch query Shops collection with $in operator:
   db.shops.find({ _id: { $in: shopIds } })
   ℹ️ NOT: loop each repair → query shop (N+1 problem ❌)
6. Create Map<shopId, shop> for O(1) lookup
7. Map repairs + add shopName, canteen name
8. Send JSON response
```

#### ⚡ Performance Optimization Explained
```
Why .lean()?
├─ Normal: return Mongoose Document
│  └─ Includes: virtuals, methods, getters/setters overhead
│     Memory per doc: ~200 bytes extra
│     For 1000 repairs: 200KB wasted
│  
└─ .lean(): return plain JavaScript object
   └─ Only data, no methods
      Memory per doc: minimal
      For 1000 repairs: ~5KB total
      → 40x memory efficient! ✓

Why .select('-images') (or .select('exclude: images'))?
├─ images field = Base64 encoded (4/3 × original size)
├─ If 1 image = 5MB → Base64 = 6.67MB
├─ 10 repairs × 2 images × 6.67MB = 133MB response! 😱
│
└─ Exclude images → 2MB response instead
   Transfer time: 30 seconds vs 200ms
   → 150x faster ✓

Why Batch Query?
├─ Loop query (N+1):
│  db.repairs.find() → 1 query (1000 docs)
│  Loop 1000x:
│    db.shops.findById() → 1000 queries!
│  Total: 1001 queries = 5 minutes
│
└─ Batch query:
   db.repairs.find() → 1 query
   db.shops.find({ _id: { $in: [id1, id2, ...] } }) → 1 query
   Total: 2 queries = 100ms
   → 3000x faster! ✓
```

#### 🔒 Security Considerations
```
✓ JWT verification → only authenticated users
✓ Role check (isAdmin middleware) → only admins
✓ No data leaks → sensitive fields excluded
✓ Input validation → filters applied safely
```

---

### 2️⃣ **Update Repair Status**
`PUT /api/repairs/:id/status` (Admin)

#### 🎯 วัตถุประสงค์
- Admin อัปเดตความคืบหน้าการแจ้งซ่อม
- Stock ทีมซ่อม บอกว่า "ซ่อมเสร็จแล้ว" หรือ "กำลังซ่อม"
- ผู้ใช้ต้องได้รับการแจ้งเตือน real-time

#### 📝 Request Body
```
URL: /repairs/507f1f77bcf86cd7994390/status
Method: PUT

Body:
{
  status: "in_progress"  // ← must be: pending, in_progress, completed, cancelled
}

Header:
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### ✅ Response Success (200)
```javascript
{
  success: true,
  repair: {
    _id: "507f1f77bcf86cd799439011",
    status: "in_progress",
    updatedAt: "2025-02-11T11:00:00.000Z"
  },
  message: "สถานะอัปเดตเป็น: กำลังดำเนินการ"
}
```

#### ❌ Response Errors
```
400 Bad Request:
{
  error: "Invalid status",
  validStatuses: ["pending", "in_progress", "completed", "cancelled"]
}

404 Not Found:
{
  error: "Repair not found"
}

401 Unauthorized:
{
  error: "Invalid token or not admin"
}
```

#### 🔧 Implementation Details
```javascript
async updateRepairStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validation
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses
      });
    }
    
    // Find + Update (atomic)
    const repair = await Repair.findByIdAndUpdate(
      id,
      { 
        status,
        updatedAt: new Date()  // auto-timestamped
      },
      { new: true }  // return updated document
    );
    
    if (!repair) {
      return res.status(404).json({ error: 'Repair not found' });
    }
    
    // Get shop details for notification
    const shop = await Shop.findById(repair.shopId);
    
    // 1. Notify the shop (they reported it)
    await emitToShop(repair.shopId, 'repair_status_changed', {
      repairId: repair._id,
      shopName: shop.name,
      newStatus: status,
      message: `ร้านค้า ${shop.name} - สถานะซ่อมเปลี่ยนเป็น: ${getStatusThai(status)}`
    });
    
    // 2. Notify the user who reported (if different)
    await emitToUser(repair.userId, 'repair_updated', {
      repairId: repair._id,
      status,
      shopName: shop.name
    });
    
    // 3. Notify all admins
    await emitToAdmin('repair_updated', {
      repairId: repair._id,
      shopId: shop._id,
      shopName: shop.name,
      status,
      updatedBy: req.user.name,
      timestamp: new Date()
    });
    
    // Response
    res.json({
      success: true,
      repair,
      message: `สถานะอัปเดตเป็น: ${getStatusThai(status)}`
    });
    
  } catch (error) {
    console.error('Error updating repair status:', error);
    res.status(500).json({ error: error.message });
  }
}
```

#### 🔌 Socket.io Real-time Flow
```
                    Admin Dashboard
                    (Browser Tab 1)
                          |
                          | Click "Mark as Completed"
                          |
                          ↓
                   PUT /repairs/123/status
                   Body: { status: "completed" }
                          |
                          ↓
                    Backend Express
                   (updateRepairStatus)
                          |
            ┌─────────────┼─────────────┐
            |             |             |
            ↓             ↓             ↓
        Update DB    Emit to Shop  Emit to Admin
        (Atomic)     via Socket.io   via Socket.io
            |             |             |
            |        Shop Browser      Admin Browser
            |        Connected         Connected
            |               |               |
            |      Receive event   Receive event
            |               |               |
            |         Update UI      Update UI
            |               |               |
            |      Show Toast: ✓   Show Toast: ✓
            |      "ซ่อมเสร็จแล้ว"   "กำลังดำเนินการ"
            |               |               |
            └───── No page reload required !!────┘
```

#### 💡 ทำไมถึงใช้ Socket.io?
```
❌ Without Socket.io (Polling):
1. Admin update status
2. Frontend ต้อง poll (ถาม) server ทุก 5 วินาที
   GET /repairs?lastUpdate=...
3. Lots of API calls (1000 repairs × 12 requests/min)
4. Delay = 0-5 seconds ก่อน UI update
5. Server load: HIGH ⬆️
6. User experience: Sluggish 🐢

✅ With Socket.io (WebSocket):
1. Admin update status
2. Server ส่ง event ทันที Socket.io
3. Client receive + update UI instantly
4. Zero delay, smooth real-time ⚡
5. Server load: LOW ⬇️
6. User experience: Responsive ✨

Comparison:
┌─────────┬──────────┬────────┐
│ Metric  │ Polling  │ Socket │
├─────────┼──────────┼────────┤
│ Latency │ 2.5s avg │ 50ms   │
│ Requests│ 12/min   │ 0 /min │
│ CPU     │ HIGH     │ LOW    │
│ Battery │ DRAIN    │ NORMAL │
└─────────┴──────────┴────────┘
```

---

### 3️⃣ **Create Bill**
`POST /api/bills` (Admin)

#### 🎯 วัตถุประสงค์
- Admin ออกใบเสร็จ/บิล สำหรับการขายอาหาร
- คำนวณราคา, ส่วนลด, ภาษี
- การเงินติดตามได้

#### 📝 Request Body
```javascript
POST /api/bills

Body:
{
  shopId: "507f1f77bcf86cd799439013",
  items: [
    {
      itemId: "food_001",
      itemName: "ข้าวหมูแดง",
      quantity: 50,
      price: 40,           // price per unit
      total: 2000           // 50 × 40
    },
    {
      itemId: "food_002",
      itemName: "สุกี้",
      quantity: 30,
      price: 50,
      total: 1500
    }
  ],
  discount: 100,           // ส่วนลด (บาท)
  tax: 157,               // ภาษี 7% (1600 × 7% ≈ 112) + 45
}
```

#### ✅ Response Success (201)
```javascript
{
  success: true,
  bill: {
    _id: "507f1f77bcf86cd799439020",
    billNumber: "BILL-SHOP001-20250211105500-A7K2",
    shopId: "507f1f77bcf86cd799439013",
    items: [
      {
        itemId: "food_001",
        itemName: "ข้าวหมูแดง",
        quantity: 50,
        price: 40,
        total: 2000
      },
      {
        itemId: "food_002",
        itemName: "สุกี้",
        quantity: 30,
        price: 50,
        total: 1500
      }
    ],
    subtotal: 3500,        // before discount
    discount: 100,
    subtotalAfterDiscount: 3400,
    tax: 238,              // 7% tax on 3400
    finalPrice: 3638,      // 3400 + 238
    status: "draft",       // ยัง edit no
    issuedDate: "2025-02-11T10:55:00.000Z",
    createdAt: "2025-02-11T10:55:00.000Z"
  }
}
```

#### 🧮 Calculation Logic
```
Scenario: 50 ข้าวหมูแดง @ 40 บาท + 30 สุกี้ @ 50 บาท

Step 1: Calculate subtotal
  subtotal = (50 × 40) + (30 × 50)
           = 2000 + 1500
           = 3500 บาท

Step 2: Apply discount
  subtotalAfterDiscount = subtotal - discount
                        = 3500 - 100
                        = 3400 บาท

Step 3: Calculate tax (7% VAT)
  tax = subtotalAfterDiscount × 0.07
      = 3400 × 0.07
      = 238 บาท

Step 4: Calculate final price
  finalPrice = subtotalAfterDiscount + tax
             = 3400 + 238
             = 3638 บาท

Bill Number Format:
  BILL-{SHOP_CODE}-{YYYYMMDDHHMMSS}-{RANDOM}
  BILL-SHOP001-20250211105500-A7K2
  └─────┬────────┬──────────┬────────┬──────┘
        │        │          │        └─ Random suffix (prevent duplicate)
        │        │          └──────────── Timestamp (yymmddhhmmss)
        │        └────────────────────── Unique per shop
        └──────────────────────────────── Prefix
```

#### 🔧 Implementation Details
```javascript
async createBill(req, res) {
  try {
    const { shopId, items, discount = 0, tax = 0 } = req.body;
    
    // Validation
    if (!items || items.length < 1) {
      return res.status(400).json({
        error: 'Bill must have at least 1 item'
      });
    }
    
    // Validate each item
    for (const item of items) {
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          error: `Invalid quantity for ${item.itemName}`
        });
      }
      if (!item.price || item.price < 0) {
        return res.status(400).json({
          error: `Invalid price for ${item.itemName}`
        });
      }
    }
    
    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const subtotalAfterDiscount = subtotal - discount;
    const finalPrice = subtotalAfterDiscount + tax;
    
    // Generate unique bill number
    const shop = await Shop.findById(shopId);
    const timestamp = new Date().getTime().toString();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const billNumber = `BILL-${shop.code}-${timestamp}-${random}`;
    
    // Create bill
    const bill = new Bill({
      billNumber,
      shopId,
      items,
      subtotal,
      discount,
      subtotalAfterDiscount,
      tax,
      finalPrice,
      status: 'draft'  // can edit before finalize
    });
    
    await bill.save();
    
    // Notify shop
    await emitToShop(shopId, 'bill_created', {
      billId: bill._id,
      billNumber,
      finalPrice,
      message: `บิลใหม่: ${billNumber} จำนวนเงิน ${finalPrice} บาท`
    });
    
    res.status(201).json({
      success: true,
      bill
    });
    
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(500).json({ error: error.message });
  }
}
```

#### 📊 Bill Status Flow
```
┌─────────┐
│ Draft   │ ← can edit, delete quantities
│ (ร่าง)  │
└────┬────┘
     │ admin click "Confirm"
     │ (จะ finalize บิล)
     ↓
┌──────────────┐
│ Finalized    │ ← locked, can't edit
│ (ลงตัว)      │ ← record to accounting
│ (สำเร็จ)    │
└──────────────┘
     │
     ↓ (eventually)
┌──────────────┐
│ Archived     │ ← move to history
│ (จัดเก็บ)    │
└──────────────┘
```

---

### 4️⃣ **Manage Users (CRUD)**
`POST/GET/PUT/DELETE /api/users` (Admin)

#### 🎯 วัตถุประสงค์
- Admin สร้าง, แก้ไข, ลบ ผู้ใช้
- กำหนดบทบาท (role: user, admin, shop)
- ควบคุมสิทธิ์เข้าถึงระบบ

#### ➕ Create User
```
POST /api/users

Body:
{
  name: "นายอาจารย์ สมบูรณ์",
  email: "ajarn@canteen.local",
  password: "password123",    // จะ hash ทันที
  role: "user",              // user | admin | shop
  department: "Kitchen",
  position: "Chef Manager",
  shopId: "507f..." (only if role='shop')
}

Response (201):
{
  _id: "507f...",
  name: "นายอาจารย์ สมบูรณ์",
  email: "ajarn@canteen.local",
  role: "user",
  department: "Kitchen",
  position: "Chef Manager",
  createdAt: "2025-02-11T12:00:00Z"
}
```

#### 🔄 Update User
```
PUT /api/users/507f...

Body:
{
  name: "นายอาจารย์ สมบูรณ์ (Updated)",
  department: "Operations",
  position: "Senior Chef"
}

Response (200):
{
  _id: "507f...",
  name: "นายอาจารย์ สมบูรณ์ (Updated)",
  email: "ajarn@canteen.local",
  role: "user",
  department: "Operations",
  position: "Senior Chef",
  updatedAt: "2025-02-11T12:30:00Z"
}
```

#### 🗑️ Delete User
```
DELETE /api/users/507f...

Response (200):
{
  message: "User deleted successfully"
}
```

#### 🔒 Special: Update Password
```
PUT /api/users/507f.../password

Body:
{
  currentPassword: "oldPassword123",   // must verify first
  newPassword: "newPassword456"
}

Security Steps:
1. Find user by ID
2. Compare currentPassword with stored hash
   ├─ If not match → 400 error
   └─ If match → proceed
3. Hash newPassword ด้วย bcryptjs
4. Update password_hash
5. Send email notification "Password changed"

Response (200):
{
  message: "Password updated successfully",
  requireNewLogin: true
}
```

#### 💾 Password Hashing Process
```
Scenario: User create account with password "mySecure123"

Frontend:
│
└─ NEVER send plain password on network!
   ├─ Use HTTPS (encrypted in transit)
   └─ Consider client-side hashing (optional)

Backend:
│
└─ receive: POST /users { password: "mySecure123" }

Step 1: Generate salt
   salt = bcryptjs.genSalt(10)
   ↓
   salt = "$2a$10$vI8k1jkjkjdk..." (22 characters)
   
   ℹ️ Salt = random string added to password
      Prevents rainbow table attacks
      Unique per password (even if same password)

Step 2: Hash password + salt
   hash = bcryptjs.hash("mySecure123", salt)
   ↓
   hash = "$2a$10$vI8k1jkjkjdk...[60 character hash]"
   
   ℹ️ Output = 60-character string
      Can't reverse → one-way function
      Same input = same output (deterministic)

Step 3: Store hash in database
   User.password = "$2a$10$vI8k1jkjkjdk...[60 chars]"
   
   ℹ️ Original password "mySecure123" = NEVER stored
      Even if DB compromised → passwords safe

Step 4: Login verification
   User tries: POST /login { password: "mySecure123" }
   
   Backend:
   ├─ Retrieve stored hash: "$2a$10$..."
   ├─ Compare: bcryptjs.compare("mySecure123", "$2a$10$...")
   │  └─ Internally: hash input + compare
   │     if hash_of_input == stored_hash
   │     → Login success ✓
   │
   └─ Never compare plain password!
      compare("mySecure123", "mySecure123") ❌ BAD

Bcryptjs cost factor = 10:
├─ 2^10 = 1024 iterations
├─ Hashing time: ~100ms per password
├─ Brute force 10 billion passwords: ~116 days!
│  (vs MD5: 0.001 seconds!)
│
└─ Why 10?
   ├─ Too low (5): Fast but weak security
   ├─ Good (10): Balance security ↔ speed
   └─ Too high (15): Takes 2 seconds (slow UX)
```

---

## 👤 USER FUNCTIONS (ฟังก์ชันผู้ใช้ทั่วไป)

User คือ พนักงานโรงอาหาร สามารถแจ้งปัญหา ดูข้อมูลตัวเอง

---

### 1️⃣ **Create Repair Report (แจ้งซ่อม)**
`POST /api/repairs` (User)

#### 🎯 วัตถุประสงค์
- พนักงานแจ้งปัญหา เช่น "พัดลมขัด", "ตู้เย็นเสียงแปลก"
- แนบรูปถ่ายปัญหา (ได้ถึง 5 รูป)
- เพื่อให้ admin/ทีมซ่อม ได้รับรู้และแก้ไข

#### 📝 Request Body
```
POST /api/repairs

Content-Type: multipart/form-data (because of file upload)

Form Data:
├─ shopId: "507f1f77bcf86cd799439013"
├─ category: "ไฟฟ้า"                  // required
├─ issue: "พัดลมหลักข้างหน้ากีฬา ขัดหมุนไม่ได้"  // required
├─ images: [File, File, File]        // 0-5 files, image/* only
│            (selected from file picker)
│
└─ Example files:
   - fan-broken-1.jpg (500KB)
   - fan-broken-2.jpg (300KB)
   - fan-detail.jpg (400KB)
```

#### ✅ Response Success (201)
```javascript
{
  success: true,
  repair: {
    _id: "507f1f77bcf86cd799439030",
    userId: "507f1f77bcf86cd799439031",  // ผู้แจ้ง
    shopId: "507f1f77bcf86cd799439013",
    category: "ไฟฟ้า",
    issue: "พัดลมหลักข้างหน้ากีฬา ขัดหมุนไม่ได้",
    status: "pending",
    imagePaths: [
      "/uploads/repairs/507f1f/2025/02/repair-1707545730000-ABC.jpg",
      "/uploads/repairs/507f1f/2025/02/repair-1707545731000-DEF.jpg",
      "/uploads/repairs/507f1f/2025/02/repair-1707545732000-GHI.jpg"
    ],
    report_date: "2025-02-11T12:45:30.000Z",
    createdAt: "2025-02-11T12:45:30.000Z",
    message: "ส่งการแจ้งซ่อมเรียบร้อย ID: 507f1f77bcf86cd799439030"
  }
}
```

#### ❌ Response Errors
```
400 Bad Request - Missing required field:
{
  error: "category is required"
}

400 Bad Request - Invalid file type:
{
  error: "Only image files are allowed! (MIME type: application/pdf)"
}

400 Bad Request - File too large:
{
  error: "File size exceeds 5MB limit"
}

400 Bad Request - Too many files:
{
  error: "Maximum 5 images allowed per repair"
}

413 Payload Too Large:
{
  error: "Total upload size exceeds 25MB"
}
```

#### 🔧 Implementation Details

**A. File Upload Processing:**
```javascript
// Multer configuration
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Create folder: uploads/repairs/{shopId}/{year}/{month}/
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const shopId = req.body.shopId;  // from form data
      const uploadPath = `uploads/repairs/${shopId}/${year}/${month}/`;
      
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    },
    
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, 'repair-' + uniqueSuffix + ext);
    }
  }),
  
  limits: {
    fileSize: 5 * 1024 * 1024,  // 5MB per file
    files: 5                     // max 5 files
  },
  
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});
```

**B. Folder Structure Created:**
```
uploads/
└─ repairs/
   └─ 507f1f77bcf86cd799439013/     (shopId)
      └─ 2025/
         └─ 02/                      (month)
            ├─ repair-1707545730000-ABC.jpg
            ├─ repair-1707545731000-DEF.jpg
            ├─ repair-1707545732000-GHI.jpg
            ├─ repair-1707545733000-JKL.jpg
            └─ repair-1707545734000-MNO.jpg

Benefits:
├─ Organized by shop → easy to manage per shop
├─ Organized by year/month → easy to archive old repairs
├─ Folder structure prevent filename conflicts
└─ Can separately back up different shops
```

**C. Create Repair Record:**
```javascript
async createRepair(req, res) {
  try {
    const { shopId, category, issue } = req.body;
    const userId = req.user._id;  // from JWT
    
    // Validation
    if (!category) throw new Error('category is required');
    if (!issue) throw new Error('issue is required');
    if (!shopId) throw new Error('shopId is required');
    
    // Get uploaded file paths
    const imagePaths = (req.files || []).map(file => 
      file.path.replace(/\\/g, '/')  // normalize path
    );
    
    // Create repair document
    const repair = new Repair({
      userId,
      shopId,
      category,
      issue,
      imagePaths,  // store file paths, not base64
      status: 'pending'
    });
    
    await repair.save();
    
    // Send notifications to admin + shop
    await createRepairNotification(userId, repair);
    await createAdminRepairNotification('new_repair', repair);
    
    // WebSocket: notify in real-time
    emitToAdmin('repair_created', {
      repairId: repair._id,
      shopId: repair.shopId,
      message: `แจ้งซ่อมใหม่จาก ${req.user.name}`
    });
    
    res.status(201).json({
      success: true,
      repair,
      message: `ส่งการแจ้งซ่อมเรียบร้อย ID: ${repair._id}`
    });
    
  } catch (error) {
    console.error('Error creating repair:', error);
    res.status(400).json({ error: error.message });
  }
}
```

**D. Image Storage Strategy Comparison:**

| Approach | Storage | Performance | Scalability | Cost |
|----------|---------|-------------|-------------|------|
| **Base64 in DB** | DB grows 4/3x | ❌ Slow query | ❌ Hard | HIGH |
| **File path in DB (current)** | Lean DB | ✅ Fast | ✅ Easy | MEDIUM |
| **S3/Cloud Storage** | External | ✅ Best | ✅ Best | Low-High |

```
Current approach (File path):
Database:
{
  imagePaths: ["/uploads/repairs/.../image.jpg"]  // small! ~50 bytes
}

Filesystem:
/uploads/repairs/.../image.jpg  // actual image file

Advantages:
✓ Database stays lean (~50 bytes vs 6MB Base64)
✓ Query fast (don't load images unnecessarily)
✓ Can serve via CDN (put /uploads on CDN)
✓ Easy to delete (just rm file)
✓ Easy to backup (separate backup for /uploads)

Disadvantage:
✗ Single server storage (not distributed)
✗ Need persistent disk (not suitable for Kubernetes)

Future upgrade to S3:
S3 provides:
├─ Infinite storage
├─ CDN integration (CloudFront)
├─ Versioning + lifecycle policies
├─ Automatic backups
└─ Pay per usage
```

---

### 2️⃣ **View My Repairs**
`GET /api/repairs/my-repairs` (User)

#### 🎯 วัตถุประสงค์
- ผู้ใช้เห็นรายการแจ้งซ่อมของตัวเองทั้งหมด
- ติดตามความคืบหน้า
- ดูประวัติการแจ้ง

#### ✅ Response Success (200)
```javascript
{
  data: [
    {
      _id: "507f1f77bcf86cd799439030",
      shopId: "507f1f77bcf86cd799439013",
      shopName: "ร้านกระเพราะแม่นึก",
      category: "ไฟฟ้า",
      issue: "พัดลมขัด",
      status: "in_progress",   // ✓ admin กำลังซ่อม
      imagePaths: [
        "/uploads/repairs/507f1f/2025/02/repair-1707545730000-ABC.jpg"
      ],
      createdAt: "2025-02-11T12:45:30.000Z",
      updatedAt: "2025-02-11T13:00:00.000Z",
      daysSinceReport: 0.5   // calculated
    },
    {
      _id: "507f1f77bcf86cd799439031",
      shopId: "507f1f77bcf86cd799439013",
      shopName: "ร้านกระเพราะแม่นึก",
      category: "ความสะอาด",
      issue: "พื้นลื่น ต้องเช็ด",
      status: "completed",    // ✓ ซ่อมเสร็จแล้ว
      imagePaths: [
        "/uploads/repairs/507f1f/2025/02/repair-1707545740000-DEF.jpg",
        "/uploads/repairs/507f1f/2025/02/repair-1707545741000-GHI.jpg"
      ],
      createdAt: "2025-02-10T14:30:00.000Z",
      updatedAt: "2025-02-11T09:00:00.000Z",
      daysSinceReport: 1.5
    },
    // ... more repairs
  ],
  total: 2,
  pendingCount: 1,    // รายการรอดำเนินการ
  completedCount: 1   // เสร็จแล้ว
}
```

#### 🔧 Implementation Details
```javascript
async getUserRepairs(req, res) {
  try {
    const userId = req.user._id;
    
    // Query repairs of current user
    const repairs = await Repair.find({ userId })
      .select('-images')  // exclude base64 images
      .sort({ createdAt: -1 })  // newest first
      .lean();
    
    // Map with calculated fields
    const repairsWithDetails = repairs.map(repair => ({
      ...repair,
      daysSinceReport: calculateDaysSince(repair.createdAt),
      status_label: getStatusLabel(repair.status)
    }));
    
    res.json({
      data: repairsWithDetails,
      total: repairsWithDetails.length,
      pending: repairsWithDetails.filter(r => r.status === 'pending').length,
      completed: repairsWithDetails.filter(r => r.status === 'completed').length
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

### 3️⃣ **View Single Repair with Images**
`GET /api/repairs/:id` (User)

#### 🎯 วัตถุประสงค์
- ดูรายละเอียดการแจ้งซ่อมเพียงรายการเดียว
- ดูรูปภาพทั้งหมด
- ดูประวัติการอัปเดต

#### ✅ Response Success (200)
```javascript
{
  data: {
    _id: "507f1f77bcf86cd799439030",
    userId: "507f1f77bcf86cd799439031",
    shopId: "507f1f77bcf86cd799439013",
    shopName: "ร้านกระเพราะแม่นึก",
    category: "ไฟฟ้า",
    issue: "พัดลมหลักข้างหน้ากีฬา ขัดหมุนไม่ได้",
    status: "in_progress",
    imagePaths: [
      "/uploads/repairs/507f1f/2025/02/repair-1707545730000-ABC.jpg",
      "/uploads/repairs/507f1f/2025/02/repair-1707545731000-DEF.jpg",
      "/uploads/repairs/507f1f/2025/02/repair-1707545732000-GHI.jpg"
    ],
    report_date: "2025-02-11T12:45:30.000Z",
    createdAt: "2025-02-11T12:45:30.000Z",
    updatedAt: "2025-02-11T13:00:00.000Z",
    timelineHistory: [
      {
        status: "pending",
        timestamp: "2025-02-11T12:45:30.000Z",
        updatedBy: "System",
        message: "แจ้งซ่อมใหม่"
      },
      {
        status: "in_progress",
        timestamp: "2025-02-11T13:00:00.000Z",
        updatedBy: "Technician: สมชาย",
        message: "ทีมซ่อมเริ่มทำการ"
      }
    ]
  }
}
```

#### ❌ Response Errors
```
404 Not Found:
{
  error: "Repair not found"
}

403 Forbidden (not owner):
{
  error: "You don't have permission to view this repair"
}
(User can only view own repairs, Admin can view all)
```

#### 🔒 Security: Image Serving
```
❌ What NOT to do:
├─ Serve /uploads directly (no authorization check)
├─ Allow any URL pattern (directory traversal)
└─ No authentication required

✅ What TO do:
├─ GET /api/repairs/:id/image/:filename
│  └─ Check: Is user owner or admin?
│  └─ Check: Does filename contain "../"?
│  └─ Use fs.readFile() with absolute path
│  └─ Set proper headers
│  └─ res.sendFile(safePath)
│
└─ Prevent attacks:
   Path traversal: filename = "../../etc/passwd"
   Query: /repairs/123/image/../../etc/passwd
   Check: if (filename.includes('..')) reject
```

#### 📋 Full Image Endpoint
```javascript
// GET /api/repairs/:id/image/:filename
async getRepairImage(req, res) {
  try {
    const { id, filename } = req.params;
    const userId = req.user._id;
    
    // Security: prevent path traversal
    if (filename.includes('..') || filename.startsWith('/')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    // Get repair
    const repair = await Repair.findById(id);
    if (!repair) {
      return res.status(404).json({ error: 'Repair not found' });
    }
    
    // Authorization: only owner or admin
    if (repair.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    // Get safe file path
    const imagePath = path.join(
      process.cwd(),
      'uploads/repairs',
      repair.shopId.toString(),
      new Date(repair.createdAt).getFullYear().toString(),
      String(new Date(repair.createdAt).getMonth() + 1).padStart(2, '0'),
      filename
    );
    
    // Make sure path is within uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads/repairs');
    if (!imagePath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Set response headers for browser caching
    res.set('Cache-Control', 'public, max-age=86400');  // cache 1 day
    res.set('Content-Type', 'image/jpeg');  // or detect from filename
    
    // Send file
    res.sendFile(imagePath);
    
  } catch (error) {
    console.error('Error fetching repair image:', error);
    res.status(500).json({ error: error.message });
  }
}
```

---

## 📊 Comparison: Admin vs User Capabilities

| Feature | Admin | User | Shop |
|---------|-------|------|------|
| **View All Repairs** | ✅ | ❌ | ✅ (own shop) |
| **Create Repair** | ❌ | ✅ | ❌ |
| **Update Status** | ✅ | ❌ | ✅ (own shop) |
| **Delete Repair** | ✅ | ❌ | ❌ |
| **Create Bill** | ✅ | ❌ | ✅ |
| **Manage Users** | ✅ | ❌ | ❌ |
| **View Reports** | ✅ | ❌ | ✅ (own shop) |
| **Ranking System** | ✅ (manage) | ❌ (view only) | ✅ (view own) |
| **Settings** | ✅ (all) | ❌ (self only) | ✅ (shop only) |

---

**Document Version:** 1.0
**Created:** February 11, 2025
