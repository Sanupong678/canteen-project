import MoneyHistory from '../models/moneyHistoryModel.js';
import Shop from '../models/shopModel.js';
import multer from 'multer';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import Evaluation from '../models/Evaluation.js'; // Added import for Evaluation

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'revenue-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('รองรับเฉพาะไฟล์ Excel (.xlsx, .xls) เท่านั้น'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload revenue data from Excel file
export const uploadRevenueExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกไฟล์ Excel'
      });
    }

    const { canteenId, month, year } = req.body;
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    console.log('📊 Processing revenue upload:', {
      filename: req.file.filename,
      canteenId,
      month: currentMonth,
      year: currentYear
    });

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log('📋 Excel data rows:', data.length);

    let totalProcessed = 0;
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each row
    for (const row of data) {
      try {
        totalProcessed++;

        // Extract data from Excel row
        const shopName = row['ชื่อร้านค้า'] || row['Shop Name'] || row['shopName'] || row['name'];
        const totals = parseFloat(row['รายได้'] || row['Revenue'] || row['revenue'] || row['totals'] || 0);

        if (!shopName) {
          errorCount++;
          errors.push(`Row ${totalProcessed}: ไม่พบชื่อร้านค้า`);
          continue;
        }

        // Find shop by name and canteenId
        let query = { name: shopName };
        if (canteenId) {
          query.canteenId = parseInt(canteenId);
        }

        const shop = await Shop.findOne(query);

        if (!shop) {
          errorCount++;
          errors.push(`Row ${totalProcessed}: ไม่พบร้านค้า "${shopName}" ในโรงอาหารที่เลือก`);
          continue;
        }

        // Update shop revenue
        shop.revenue = totals;
        await shop.save();

        // Create or update money history
        const historyData = {
          shopId: shop._id,
          shopName: shop.name,
          canteenId: shop.canteenId,
          month: currentMonth,
          year: currentYear,
          totals: totals,
          uploadedAt: new Date()
        };

        // Use upsert to create or update
        await MoneyHistory.findOneAndUpdate(
          { 
            shopId: shop._id, 
            month: currentMonth, 
            year: currentYear 
          },
          historyData,
          { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true
          }
        );

        successCount++;
        console.log(`✅ Updated shop: ${shop.name}, Revenue: ${totals}`);

      } catch (error) {
        errorCount++;
        errors.push(`Row ${totalProcessed}: ${error.message}`);
        console.error(`❌ Error processing row ${totalProcessed}:`, error);
      }
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error('Warning: Could not delete uploaded file:', cleanupError);
    }

    console.log('📊 Upload completed:', {
      totalProcessed,
      successCount,
      errorCount
    });

    res.json({
      success: true,
      message: 'อัปโหลดข้อมูลรายได้เรียบร้อยแล้ว',
      data: {
        totalProcessed,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('❌ Error in uploadRevenueExcel:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์',
      error: error.message
    });
  }
};

// Get money history for a shop
export const getMoneyHistory = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { month, year } = req.query;

    let query = { shopId };

    if (month) {
      query.month = parseInt(month);
    }

    if (year) {
      query.year = parseInt(year);
    }

    const history = await MoneyHistory.find(query)
      .sort({ year: -1, month: -1 })
      .limit(12); // Get last 12 months

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error getting money history:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติรายได้',
      error: error.message
    });
  }
};

// Get current month revenue for a shop (ดึงจาก Evaluation)
export const getCurrentMonthRevenue = async (req, res) => {
  try {
    const { shopId } = req.params;
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    console.log('🔍 Getting current month revenue from Evaluation for shopId:', shopId);

    // ดึงข้อมูลจาก Evaluation collection แทน MoneyHistory
    const currentEvaluation = await Evaluation.findOne({
      shopId,
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      isActive: true
    });

    console.log('📊 Current evaluation found:', !!currentEvaluation);

    res.json({
      success: true,
      data: {
        month: currentMonth,
        year: currentYear,
        totals: currentEvaluation ? (currentEvaluation.revenue || 0) : 0,
        uploadedAt: currentEvaluation ? currentEvaluation.updatedAt : null
      }
    });

  } catch (error) {
    console.error('Error getting current month revenue:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลรายได้เดือนปัจจุบัน',
      error: error.message
    });
  }
};

// Get all money history (admin)
export const getAllMoneyHistory = async (req, res) => {
  try {
    const { canteenId, month, year, shopId } = req.query;

    let query = {};

    if (canteenId) {
      query.canteenId = parseInt(canteenId);
    }

    if (month) {
      query.month = parseInt(month);
    }

    if (year) {
      query.year = parseInt(year);
    }

    if (shopId) {
      query.shopId = shopId;
    }

    const history = await MoneyHistory.find(query)
      .sort({ year: -1, month: -1, uploadedAt: -1 })
      .populate('shopId', 'name customId');

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    console.error('Error getting all money history:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติรายได้ทั้งหมด',
      error: error.message
    });
  }
};

export { upload };

// Get combined money and evaluation history for a shop (ดึงจาก Evaluation เท่านั้น)
export const getCombinedHistory = async (req, res) => {
  try {
    const { shopId } = req.params;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ shopId'
      });
    }

    console.log('🔍 Fetching combined history from Evaluation for shopId:', shopId);

    // ดึงข้อมูลจาก Evaluation collection เท่านั้น
    const evaluationHistory = await Evaluation.find({ 
      shopId,
      isActive: true 
    })
      .sort({ evaluationYear: -1, evaluationMonth: -1 })
      .limit(24); // Get last 24 months

    console.log('📊 Evaluation history records:', evaluationHistory.length);

    // Calculate ranks for each month
    const combinedHistory = [];
    
    for (const evaluation of evaluationHistory) {
      const key = `${evaluation.evaluationYear}-${evaluation.evaluationMonth}`;
      
      // Get all evaluations for this month in the same canteen to calculate rank
      const monthEvaluations = await Evaluation.find({
        evaluationYear: evaluation.evaluationYear,
        evaluationMonth: evaluation.evaluationMonth,
        isActive: true,
        evaluationSent: true
      }).populate('shopId', 'canteenId').sort({ totalScore: -1 }); // Sort by score descending

      // Get the canteenId of the current shop
      const currentShop = await Shop.findById(shopId).select('canteenId');
      const currentCanteenId = currentShop ? currentShop.canteenId : null;
      
      // Filter evaluations to only include shops in the same canteen
      const sameCanteenEvaluations = monthEvaluations.filter(evaluation => 
        evaluation.shopId && evaluation.shopId.canteenId === currentCanteenId
      );

      console.log('📊 Month evaluations for ranking:', monthEvaluations.length);
      console.log('📊 Same canteen evaluations:', sameCanteenEvaluations.length);

      // Find rank of current shop within the same canteen
      const rank = sameCanteenEvaluations.findIndex(evaluationItem => 
        evaluationItem.shopId._id.toString() === shopId
      ) + 1;

      const historyItem = {
        year: evaluation.evaluationYear,
        month: evaluation.evaluationMonth,
        revenue: evaluation.revenue || 0,
        score: evaluation.totalScore,
        rank: rank,
        uploadedAt: evaluation.updatedAt, // ใช้วันที่อัปเดตแทน
        evaluatedAt: evaluation.evaluatedAt,
        finalStatus: evaluation.finalStatus,
        hasRevenue: !!(evaluation.revenue && evaluation.revenue > 0),
        hasEvaluation: true
      };

      combinedHistory.push(historyItem);
    }

    // Sort by year and month descending
    combinedHistory.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    console.log('📈 Combined history records:', combinedHistory.length);

    res.json({
      success: true,
      data: combinedHistory
    });

  } catch (error) {
    console.error('❌ Error getting combined history:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติรายได้และคะแนน',
      error: error.message
    });
  }
}; 