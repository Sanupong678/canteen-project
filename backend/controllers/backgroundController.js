import Background from '../models/backgroundModel.js';
import path from 'path';
import fs from 'fs';

export const getBackgrounds = async (req, res) => {
  try {
    console.log('🖼️ Fetching backgrounds...');
    
    const backgrounds = await Background.find({ isActive: true })
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${backgrounds.length} backgrounds`);
    
    res.status(200).json({
      success: true,
      data: backgrounds
    });
  } catch (error) {
    console.error('❌ Error fetching backgrounds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch backgrounds'
    });
  }
};

export const createBackground = async (req, res) => {
  try {
    console.log('🖼️ Creating new background...');
    console.log('📋 Request body:', req.body);
    console.log('📁 Uploaded file:', req.file);
    
    const { title, description } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image is required'
      });
    }
    
    // สร้างชื่อไฟล์ใหม่
    const imageFilename = req.file.filename;
    
    const background = new Background({
      title: title || 'Banner',
      description: description || '',
      imageFilename,
      isActive: true
    });
    
    await background.save();
    
    console.log('✅ Background created successfully:', {
      id: background._id,
      title: background.title,
      imageFilename: background.imageFilename
    });
    
    res.status(201).json({
      success: true,
      message: 'Background created successfully',
      data: background
    });
  } catch (error) {
    console.error('❌ Error creating background:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create background'
    });
  }
};

export const updateBackground = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    
    console.log(`🖼️ Updating background with ID: ${id}`);
    console.log('📋 Update data:', { title, description });
    console.log('📁 Uploaded file:', req.file);
    
    const background = await Background.findById(id);
    
    if (!background) {
      return res.status(404).json({
        success: false,
        error: 'Background not found'
      });
    }
    
    // อัปเดตข้อมูล
    background.title = title || background.title;
    background.description = description || background.description;
    
    // ถ้ามีไฟล์ใหม่
    if (req.file) {
      // ลบไฟล์เก่า
      const oldImagePath = path.join(process.cwd(), 'uploads', 'banner', background.imageFilename);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('🗑️ Deleted old image:', background.imageFilename);
      }
      
      // อัปเดตชื่อไฟล์ใหม่
      background.imageFilename = req.file.filename;
      console.log('📁 Updated image filename:', background.imageFilename);
    }
    
    await background.save();
    
    console.log('✅ Background updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Background updated successfully',
      data: background
    });
  } catch (error) {
    console.error('❌ Error updating background:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update background'
    });
  }
};

export const deleteBackground = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🖼️ Deleting background with ID: ${id}`);
    
    const background = await Background.findById(id);
    
    if (!background) {
      return res.status(404).json({
        success: false,
        error: 'Background not found'
      });
    }
    
    // ลบไฟล์รูปภาพ
    const imagePath = path.join(process.cwd(), 'uploads', 'banner', background.imageFilename);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('🗑️ Deleted image file:', background.imageFilename);
    }
    
    await Background.findByIdAndDelete(id);
    
    console.log('✅ Background deleted successfully');
    
    res.status(200).json({
      success: true,
      message: 'Background deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting background:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete background'
    });
  }
};

export const toggleBackgroundStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🖼️ Toggling background status for ID: ${id}`);
    
    const background = await Background.findById(id);
    
    if (!background) {
      return res.status(404).json({
        success: false,
        error: 'Background not found'
      });
    }
    
    background.isActive = !background.isActive;
    await background.save();
    
    console.log(`✅ Background status toggled to: ${background.isActive ? 'active' : 'inactive'}`);
    
    res.status(200).json({
      success: true,
      message: `Background ${background.isActive ? 'activated' : 'deactivated'} successfully`,
      data: background
    });
  } catch (error) {
    console.error('❌ Error toggling background status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle background status'
    });
  }
}; 

// Get background image
export const getBackgroundImage = async (req, res) => {
  try {
    const { backgroundId } = req.params;
    console.log(`🖼️ Getting image for background ID: ${backgroundId}`);
    
    // Add CORS headers
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    const background = await Background.findById(backgroundId);
    
    if (!background) {
      return res.status(404).json({
        success: false,
        error: 'Background not found'
      });
    }
    
    if (!background.imageFilename) {
      return res.status(404).json({
        success: false,
        error: 'Background image not found'
      });
    }
    
    const imagePath = path.join(process.cwd(), 'uploads', 'banner', background.imageFilename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        error: 'Image file not found'
      });
    }
    
    console.log('✅ Sending background image:', background.imageFilename);
    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error('❌ Error sending background image file:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'Failed to send image' });
        }
      }
    });
  } catch (error) {
    console.error('❌ Error getting background image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get background image'
    });
  }
}; 