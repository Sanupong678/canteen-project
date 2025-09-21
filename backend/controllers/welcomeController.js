import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Welcome from '../models/welcomeModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload welcome page image
export const uploadWelcomeImage = async (req, res) => {
  try {
    console.log('\n=== UPLOAD WELCOME IMAGE DEBUG ===');
    console.log('Request file:', req.file);
    console.log('Request user:', req.user);
    
    // ตรวจสอบ user authentication
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    // ตรวจสอบว่าเป็น admin หรือไม่
    if (req.user.role !== 'admin') {
      console.log('❌ User is not admin');
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    // ตรวจสอบไฟล์
    if (!req.file) {
      console.log('❌ No file uploaded');
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    console.log('✅ File uploaded successfully:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    });
    
    // สร้างโฟลเดอร์ welcomepage ถ้ายังไม่มี
    const welcomeDir = path.join(__dirname, '../uploads/welcomepage');
    if (!fs.existsSync(welcomeDir)) {
      fs.mkdirSync(welcomeDir, { recursive: true });
    }
    
    // ย้ายไฟล์ไปยังโฟลเดอร์ welcomepage
    const newFileName = `welcome-banner-${Date.now()}${path.extname(req.file.originalname)}`;
    const newFilePath = path.join(welcomeDir, newFileName);
    
    // คัดลอกไฟล์
    fs.copyFileSync(req.file.path, newFilePath);
    
    // ลบไฟล์ชั่วคราว
    fs.unlinkSync(req.file.path);
    
    console.log('✅ File moved to welcomepage directory:', newFilePath);
    
    // บันทึกข้อมูลลงใน MongoDB
    const welcomeData = new Welcome({
      bannerImage: newFileName,
      uploadedBy: req.user.username || req.user.name,
      isActive: true
    });
    
    const savedWelcome = await welcomeData.save();
    
    console.log('✅ Welcome data saved to MongoDB:', savedWelcome);
    console.log('=== UPLOAD WELCOME IMAGE COMPLETED ===\n');
    
    res.status(200).json({ 
      success: true, 
      data: {
        filename: newFileName,
        path: `/uploads/welcomepage/${newFileName}`,
        uploadedAt: savedWelcome.uploadedAt,
        id: savedWelcome._id
      }
    });
  } catch (error) {
    console.error('❌ UPLOAD WELCOME IMAGE ERROR:', error);
    
    // ลบไฟล์ชั่วคราวถ้ามี
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('✅ Cleaned up temporary file');
      } catch (cleanupError) {
        console.error('❌ Error cleaning up temporary file:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get welcome page data
export const getWelcomeData = async (req, res) => {
  try {
    // ดึงข้อมูล banner ที่ active ล่าสุด
    const welcomeData = await Welcome.findOne({ isActive: true })
      .sort({ uploadedAt: -1 })
      .select('bannerImage uploadedAt uploadedBy');
    
    if (!welcomeData) {
      return res.status(200).json({ 
        success: true, 
        data: {
          bannerImage: null,
          uploadedAt: null,
          uploadedBy: null
        }
      });
    }
    
    res.status(200).json({ 
      success: true, 
      data: {
        bannerImage: welcomeData.bannerImage,
        uploadedAt: welcomeData.uploadedAt,
        uploadedBy: welcomeData.uploadedBy
      }
    });
  } catch (error) {
    console.error('❌ GET WELCOME DATA ERROR:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
};

// Delete welcome page image
export const deleteWelcomeImage = async (req, res) => {
  try {
    console.log('\n=== DELETE WELCOME IMAGE DEBUG ===');
    console.log('Request user:', req.user);
    
    // ตรวจสอบ user authentication
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    // ตรวจสอบว่าเป็น admin หรือไม่
    if (req.user.role !== 'admin') {
      console.log('❌ User is not admin');
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    
    // หาข้อมูล banner ที่ active
    const welcomeData = await Welcome.findOne({ isActive: true });
    
    if (!welcomeData) {
      return res.status(404).json({ 
        success: false, 
        error: 'No active welcome banner found' 
      });
    }
    
    // ลบไฟล์รูปภาพ
    if (welcomeData.bannerImage) {
      const welcomeDir = path.join(__dirname, '../uploads/welcomepage');
      const imagePath = path.join(welcomeDir, welcomeData.bannerImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('✅ Image file deleted:', imagePath);
      }
    }
    
    // ลบข้อมูลจาก MongoDB
    await Welcome.findByIdAndDelete(welcomeData._id);
    console.log('✅ Welcome data deleted from MongoDB');
    
    console.log('=== DELETE WELCOME IMAGE COMPLETED ===\n');
    
    res.status(200).json({ 
      success: true, 
      message: 'Welcome image deleted successfully' 
    });
  } catch (error) {
    console.error('❌ DELETE WELCOME IMAGE ERROR:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
};