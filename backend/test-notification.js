import axios from 'axios';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your-super-secret-jwt-key-2024';

const testNotificationEndpoint = async () => {
  try {
    console.log('🧪 Testing notification endpoint...');
    
    // สร้าง token ที่ถูกต้องสำหรับ admin
    const adminData = {
      username: 'admin',
      role: 'admin',
      displayName: 'Administrator'
    };
    
    const adminToken = jwt.sign(adminData, JWT_SECRET, { expiresIn: '24h' });
    console.log('🔑 Generated admin token:', adminToken.substring(0, 50) + '...');
    
    const response = await axios.get('http://localhost:4000/api/notifications/user', {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response:', response.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('❌ Status:', error.response?.status);
  }
};

testNotificationEndpoint(); 