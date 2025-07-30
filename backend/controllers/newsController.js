import News from '../models/newsModel.js';
import path from 'path';
import fs from 'fs';

// Get all news (for users)
export const getAllNews = async (req, res) => {
  try {
    console.log('📰 Fetching all active news...');
    
    const news = await News.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('title content imageFilename createdAt views');
    
    console.log(`✅ Found ${news.length} news articles`);
    
    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news'
    });
  }
};

// Get single news by ID
export const getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📰 Fetching news with ID: ${id}`);
    
    const news = await News.findById(id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News not found'
      });
    }
    
    // เพิ่มจำนวน views
    news.views += 1;
    await news.save();
    
    console.log('✅ News fetched successfully');
    
    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news'
    });
  }
};

// Create news (admin only)
export const createNews = async (req, res) => {
  try {
    console.log('📰 Creating new news article...');
    console.log('📋 Request body:', req.body);
    console.log('📁 Uploaded file:', req.file);
    
    const { title, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Title and content are required'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image is required'
      });
    }
    
    // สร้างชื่อไฟล์ใหม่
    const imageFilename = req.file.filename;
    
    const news = new News({
      title,
      content,
      imageFilename,
      author: req.user?.displayName || 'Admin'
    });
    
    await news.save();
    
    console.log('✅ News created successfully:', {
      id: news._id,
      title: news.title,
      imageFilename: news.imageFilename
    });
    
    res.status(201).json({
      success: true,
      message: 'News created successfully',
      data: news
    });
  } catch (error) {
    console.error('❌ Error creating news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create news'
    });
  }
};

// Update news (admin only)
export const updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    
    console.log(`📰 Updating news with ID: ${id}`);
    console.log('📋 Update data:', { title, content });
    console.log('📁 Uploaded file:', req.file);
    
    const news = await News.findById(id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News not found'
      });
    }
    
    // อัปเดตข้อมูล
    news.title = title || news.title;
    news.content = content || news.content;
    
    // ถ้ามีไฟล์ใหม่
    if (req.file) {
      // ลบไฟล์เก่า
      const oldImagePath = path.join(process.cwd(), 'uploads', 'news', news.imageFilename);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log('🗑️ Deleted old image:', news.imageFilename);
      }
      
      // อัปเดตชื่อไฟล์ใหม่
      news.imageFilename = req.file.filename;
      console.log('📁 Updated image filename:', news.imageFilename);
    }
    
    await news.save();
    
    console.log('✅ News updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'News updated successfully',
      data: news
    });
  } catch (error) {
    console.error('❌ Error updating news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update news'
    });
  }
};

// Delete news (admin only)
export const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📰 Deleting news with ID: ${id}`);
    
    const news = await News.findById(id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News not found'
      });
    }
    
    // ลบไฟล์รูปภาพ
    const imagePath = path.join(process.cwd(), 'uploads', 'news', news.imageFilename);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('🗑️ Deleted image file:', news.imageFilename);
    }
    
    await News.findByIdAndDelete(id);
    
    console.log('✅ News deleted successfully');
    
    res.status(200).json({
      success: true,
      message: 'News deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete news'
    });
  }
};

// Get all news for admin (including inactive)
export const getAllNewsForAdmin = async (req, res) => {
  try {
    console.log('📰 Fetching all news for admin...');
    
    const news = await News.find()
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${news.length} news articles`);
    
    res.status(200).json({
      success: true,
      data: news
    });
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news'
    });
  }
};

// Toggle news active status (admin only)
export const toggleNewsStatus = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📰 Toggling news status for ID: ${id}`);
    
    const news = await News.findById(id);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News not found'
      });
    }
    
    news.isActive = !news.isActive;
    await news.save();
    
    console.log(`✅ News status toggled to: ${news.isActive ? 'active' : 'inactive'}`);
    
    res.status(200).json({
      success: true,
      message: `News ${news.isActive ? 'activated' : 'deactivated'} successfully`,
      data: news
    });
  } catch (error) {
    console.error('❌ Error toggling news status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle news status'
    });
  }
}; 

// Get news image
export const getNewsImage = async (req, res) => {
  try {
    const { newsId } = req.params;
    console.log(`📰 Getting image for news ID: ${newsId}`);
    
    // Add CORS headers
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    const news = await News.findById(newsId);
    
    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News not found'
      });
    }
    
    if (!news.imageFilename) {
      return res.status(404).json({
        success: false,
        error: 'News image not found'
      });
    }
    
    const imagePath = path.join(process.cwd(), 'uploads', 'news', news.imageFilename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        error: 'Image file not found'
      });
    }
    
    console.log('✅ Sending news image:', news.imageFilename);
    res.sendFile(imagePath);
  } catch (error) {
    console.error('❌ Error getting news image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get news image'
    });
  }
}; 