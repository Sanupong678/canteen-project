import News from '../models/newsModel.js';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { parsePagination, toPaginationMeta } from '../utils/pagination.js';
import { clearCacheByPrefix } from '../middleware/cacheMiddleware.js';

// Get all news (for users)
export const getAllNews = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const query = { isActive: true };
    // Avoid expensive countDocuments on hot path by default.
    const includeTotal = String(req.query.includeTotal || '').toLowerCase() === 'true';
    const queryLimit = includeTotal ? limit : (limit + 1);
    const rows = await News.find(query)
      .sort({ createdAt: -1 })
      .select('title content imageFilename createdAt views author')
      .skip(skip)
      .limit(queryLimit)
      .lean();

    const hasNextPage = includeTotal ? rows.length === limit : rows.length > limit;
    const news = includeTotal ? rows : rows.slice(0, limit);

    res.status(200).json({
      success: true,
      data: news,
      pagination: includeTotal
        ? toPaginationMeta({ page, limit, total: await News.countDocuments(query) })
        : { page, limit, hasNextPage }
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
    clearCacheByPrefix('/api/news');
    
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
      author: req.user?.displayName || 'Admin',
      isActive: true
    });
    
    await news.save();
    clearCacheByPrefix('/api/news');
    
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

    const news = await News.findById(id);
    if (!news) {
      return res.status(404).json({
        success: false,
        error: 'News not found'
      });
    }

    if (title) news.title = title;
    if (content) news.content = content;

    if (req.file) {
      if (news.imageFilename) {
        const oldImagePath = path.join(process.cwd(), 'uploads', 'news', news.imageFilename);
        await fsPromises.unlink(oldImagePath).catch(() => {});
      }
      news.imageFilename = req.file.filename;
    }

    await news.save();
    clearCacheByPrefix('/api/news');

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
    if (news.imageFilename) {
      const imagePath = path.join(process.cwd(), 'uploads', 'news', news.imageFilename);
      await fsPromises.unlink(imagePath).catch(() => {});
    }
    
    await News.findByIdAndDelete(id);
    clearCacheByPrefix('/api/news');
    
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

// Get news image
export const getNewsImage = async (req, res) => {
  try {
    const { newsId } = req.params;
    console.log(`📰 Getting image for news ID: ${newsId}`);
    
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

    // Allow frontend (different origin) to embed this image safely.
    const frontendOrigin = process.env.FRONTEND_URL || req.headers.origin || '*';
    res.setHeader('Access-Control-Allow-Origin', frontendOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    
    console.log('✅ Sending news image:', news.imageFilename);
    res.sendFile(imagePath, (err) => {
      if (err) {
        console.error('❌ Error sending news image file:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'Failed to send image' });
        }
      }
    });
  } catch (error) {
    console.error('❌ Error getting news image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get news image'
    });
  }
}; 