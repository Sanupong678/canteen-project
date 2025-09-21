import Ranking from '../models/rankingModel.js';
import Canteen from '../models/canteenModel.js';
import Evaluation from '../models/Evaluation.js';
import Shop from '../models/Shop.js';
import multer from 'multer';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

// Get all rankings with filters
const getRankings = async (req, res) => {
  try {
    const { canteenId, search, status } = req.query;
    
    let query = {};
    
    // Filter by canteen
    if (canteenId) {
      query.canteenId = canteenId;
    }
    
    // Filter by search term
    if (search) {
      query.shopName = { $regex: search, $options: 'i' };
    }
    
    // Filter by status
    if (status) {
      if (status === 'เสร็จสิ้น' || status === 'รอดำเนินการ') {
        query.overallStatus = status;
      } else if (status === 'ผ่าน' || status === 'ไม่ผ่าน') {
        query.evaluationStatus = status;
      }
    }
    
    const rankings = await Ranking.find(query)
      .sort({ revenue: -1, createdAt: -1 })
      .populate('canteenId', 'name');
    
    // Transform data for frontend
    const transformedRankings = rankings.map(ranking => ({
      _id: ranking._id,
      shopName: ranking.shopName,
      canteenId: ranking.canteenId._id,
      canteenName: ranking.canteenName,
      revenue: ranking.revenue,
      evaluationStatus: ranking.evaluationStatus,
      overallStatus: ranking.overallStatus,
      notes: ranking.notes,
      evaluationDate: ranking.evaluationDate,
      evaluatorName: ranking.evaluatorName,
      createdAt: ranking.createdAt,
      updatedAt: ranking.updatedAt
    }));
    
    res.json({
      success: true,
      data: transformedRankings
    });
  } catch (error) {
    console.error('Error getting rankings:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล ranking'
    });
  }
};

// Get ranking statistics
const getRankingStats = async (req, res) => {
  try {
    const { canteenId } = req.query;
    
    let matchQuery = {};
    if (canteenId) {
      matchQuery.canteenId = canteenId;
    }
    
    const stats = await Ranking.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$revenue' },
          averageRevenue: { $avg: '$revenue' },
          totalShops: { $sum: 1 },
          passedEvaluation: {
            $sum: { $cond: [{ $eq: ['$evaluationStatus', 'ผ่าน'] }, 1, 0] }
          }
        }
      }
    ]);
    
    const result = stats[0] || {
      totalRevenue: 0,
      averageRevenue: 0,
      totalShops: 0,
      passedEvaluation: 0
    };
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting ranking stats:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ'
    });
  }
};

// Get current month data for user ranking (ดึงจาก Evaluation)
const getCurrentRankingData = async (req, res) => {
  try {
    const { shopId } = req.query;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'ต้องระบุ shopId'
      });
    }
    
    console.log('🔍 Getting current ranking data from Evaluation for shopId:', shopId);
    
    // ดึงข้อมูลเดือนปัจจุบัน
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    // ดึงข้อมูล evaluation ของ shop นี้ในเดือนปัจจุบัน
    const evaluation = await Evaluation.findOne({
      shopId: shopId,
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      isActive: true
    });
    
    console.log('📊 Current evaluation found:', !!evaluation);
    
    if (!evaluation) {
      return res.json({
        success: true,
        data: {
          money: 0,
          score: 0,
          rank: 0
        }
      });
    }
    
    // คำนวณลำดับในโรงอาหารเดียวกัน
    // ใช้ canteenId จาก Shop แทน canteenName จาก Evaluation
    const shop = await Shop.findById(shopId);
    const canteenId = shop?.canteenId;
    
    console.log('🏪 Shop canteenId:', canteenId);
    console.log('📊 Evaluation canteenName:', evaluation.canteenName);
    
    // หา evaluations ใน canteen เดียวกัน โดยใช้ canteenId จาก Shop
    const allEvaluations = await Evaluation.find({
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      isActive: true,
      evaluationSent: true
    }).populate('shopId', 'canteenId').sort({ totalScore: -1 });
    
    // กรองเฉพาะ evaluations ที่อยู่ใน canteen เดียวกัน
    const sameCanteenEvaluations = allEvaluations.filter(evaluation => 
      evaluation.shopId && evaluation.shopId.canteenId === canteenId
    );
    
    console.log('📊 All evaluations for ranking:', allEvaluations.length);
    console.log('📊 Same canteen evaluations:', sameCanteenEvaluations.length);
    console.log('📊 Same canteen evaluations data:', sameCanteenEvaluations.map(evaluation => ({
      shopId: evaluation.shopId._id.toString(),
      canteenId: evaluation.shopId.canteenId,
      totalScore: evaluation.totalScore,
      evaluationSent: evaluation.evaluationSent
    })));
    
    // คำนวณคะแนนเฉลี่ยของร้านค้านี้จากประวัติทั้งหมด
    const allShopEvaluations = await Evaluation.find({
      shopId,
      isActive: true,
      evaluationSent: true,
      totalScore: { $exists: true, $ne: null }
    }).sort({ evaluationYear: -1, evaluationMonth: -1 });
    
    console.log('📊 All shop evaluations for average:', allShopEvaluations.length);
    
    let currentShopAverageScore = 0;
    if (allShopEvaluations.length > 0) {
      const totalScore = allShopEvaluations.reduce((sum, evaluation) => sum + (evaluation.totalScore || 0), 0);
      currentShopAverageScore = Math.round((totalScore / allShopEvaluations.length) * 100) / 100; // รอบเป็นทศนิยม 2 ตำแหน่ง
    }
    
    console.log('📊 Current shop average score calculated:', currentShopAverageScore);
    console.log('📊 Total evaluations used:', allShopEvaluations.length);
    
    // คำนวณคะแนนเฉลี่ยของทุกร้านค้าใน canteen เดียวกัน
    const allShopsInCanteen = await Shop.find({ canteenId }).select('_id');
    const shopIdsInCanteen = allShopsInCanteen.map(shop => shop._id);
    
    console.log('📊 All shops in canteen:', shopIdsInCanteen.length);
    
    const shopsWithAverageScores = [];
    
    for (const shopIdInCanteen of shopIdsInCanteen) {
      // คำนวณคะแนนเฉลี่ยของแต่ละร้าน
      const shopEvaluations = await Evaluation.find({
        shopId: shopIdInCanteen,
        isActive: true,
        evaluationSent: true,
        totalScore: { $exists: true, $ne: null }
      });
      
      if (shopEvaluations.length > 0) {
        const totalScore = shopEvaluations.reduce((sum, evaluation) => sum + (evaluation.totalScore || 0), 0);
        const averageScore = Math.round((totalScore / shopEvaluations.length) * 100) / 100;
        
        shopsWithAverageScores.push({
          shopId: shopIdInCanteen,
          averageScore: averageScore,
          evaluationCount: shopEvaluations.length
        });
      }
    }
    
    // เรียงลำดับตามคะแนนเฉลี่ยจากมากไปน้อย
    shopsWithAverageScores.sort((a, b) => b.averageScore - a.averageScore);
    
    console.log('📊 Shops with average scores:', shopsWithAverageScores.map(shop => ({
      shopId: shop.shopId.toString(),
      averageScore: shop.averageScore,
      evaluationCount: shop.evaluationCount
    })));
    
    // หาลำดับของร้านค้านี้จากคะแนนเฉลี่ย
    const rank = shopsWithAverageScores.findIndex(shop => shop.shopId.toString() === shopId) + 1;
    
    console.log('📊 Calculated rank based on average score:', rank);
    console.log('📊 Target shopId:', shopId);
    console.log('📊 Target shop average score:', currentShopAverageScore);
    
    const currentData = {
      money: evaluation.revenue || 0,
      score: currentShopAverageScore, // คะแนนเฉลี่ยของร้านค้านี้
      rank: rank // อันดับจากการเปรียบเทียบคะแนนเฉลี่ย
    };
    
    console.log('✅ Current ranking data:', currentData);
    
    res.json({
      success: true,
      data: currentData
    });
  } catch (error) {
    console.error('Error getting current ranking data:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล ranking ปัจจุบัน'
    });
  }
};

// Get monthly history for user ranking (ดึงจาก Evaluation)
const getMonthlyHistory = async (req, res) => {
  try {
    const { shopId } = req.query;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'ต้องระบุ shopId'
      });
    }
    
    console.log('🔍 Getting monthly history from Evaluation for shopId:', shopId);
    
    // ดึงข้อมูล evaluation history
    const evaluationHistory = await Evaluation.find({ 
      shopId,
      isActive: true 
    })
      .sort({ evaluationYear: -1, evaluationMonth: -1 })
      .limit(12); // Get last 12 months
    
    console.log('📊 Evaluation history records:', evaluationHistory.length);
    
    // Calculate ranks for each month
    const monthlyHistory = [];
    
    for (const evaluation of evaluationHistory) {
      // Get all evaluations for this month to calculate rank
      const monthEvaluations = await Evaluation.find({
        evaluationYear: evaluation.evaluationYear,
        evaluationMonth: evaluation.evaluationMonth,
        isActive: true
      }).sort({ totalScore: -1 }); // Sort by score descending
      
      // Find rank of current shop
      const rank = monthEvaluations.findIndex(evalItem => 
        evalItem.shopId.toString() === shopId
      ) + 1;
      
      const historyItem = {
        year: evaluation.evaluationYear,
        month: evaluation.evaluationMonth,
        revenue: evaluation.revenue || 0,
        score: evaluation.totalScore,
        rank: rank,
        finalStatus: evaluation.finalStatus,
        evaluatedAt: evaluation.evaluatedAt,
        updatedAt: evaluation.updatedAt
      };
      
      monthlyHistory.push(historyItem);
    }
    
    // Sort by year and month descending
    monthlyHistory.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    console.log('📈 Monthly history records:', monthlyHistory.length);
    
    res.json({
      success: true,
      data: monthlyHistory
    });
    
  } catch (error) {
    console.error('Error getting monthly history:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลประวัติรายเดือน'
    });
  }
};

// Create new ranking
const createRanking = async (req, res) => {
  try {
    const { shopName, canteenId, canteenName, revenue, evaluationStatus, overallStatus, notes } = req.body;
    
    const ranking = new Ranking({
      shopName,
      canteenId,
      canteenName,
      revenue: revenue || 0,
      evaluationStatus: evaluationStatus || 'ไม่ผ่าน',
      overallStatus: overallStatus || 'รอดำเนินการ',
      notes: notes || ''
    });
    
    await ranking.save();
    
    res.status(201).json({
      success: true,
      message: 'สร้างข้อมูล ranking สำเร็จ',
      data: ranking
    });
  } catch (error) {
    console.error('Error creating ranking:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างข้อมูล ranking'
    });
  }
};

// Update ranking
const updateRanking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const ranking = await Ranking.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!ranking) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล ranking'
      });
    }
    
    res.json({
      success: true,
      message: 'อัปเดตข้อมูล ranking สำเร็จ',
      data: ranking
    });
  } catch (error) {
    console.error('Error updating ranking:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล ranking'
    });
  }
};

// Delete ranking
const deleteRanking = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ranking = await Ranking.findByIdAndDelete(id);
    
    if (!ranking) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูล ranking'
      });
    }
    
    res.json({
      success: true,
      message: 'ลบข้อมูล ranking สำเร็จ'
    });
  } catch (error) {
    console.error('Error deleting ranking:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบข้อมูล ranking'
    });
  }
};

// Upload Excel file
const uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาเลือกไฟล์ Excel'
      });
    }
    
    const filePath = req.file.path;
    console.log('📁 Processing Excel file:', filePath);
    
    // Read Excel file
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    console.log('📊 Excel data rows:', data.length);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const row of data) {
      try {
        const { shopName, canteenName, revenue, evaluationStatus, overallStatus, notes } = row;
        
        if (!shopName || !canteenName) {
          errors.push(`แถว ${successCount + errorCount + 1}: ขาดข้อมูล shopName หรือ canteenName`);
          errorCount++;
          continue;
        }
        
        // Check if ranking already exists
        const existingRanking = await Ranking.findOne({ shopName, canteenName });
        
        if (existingRanking) {
          // Update existing ranking
          await Ranking.findByIdAndUpdate(existingRanking._id, {
            revenue: revenue || 0,
            evaluationStatus: evaluationStatus || 'ไม่ผ่าน',
            overallStatus: overallStatus || 'รอดำเนินการ',
            notes: notes || ''
          });
        } else {
          // Create new ranking
          const ranking = new Ranking({
            shopName,
            canteenName,
            revenue: revenue || 0,
            evaluationStatus: evaluationStatus || 'ไม่ผ่าน',
            overallStatus: overallStatus || 'รอดำเนินการ',
            notes: notes || ''
          });
          
          await ranking.save();
        }
        
        successCount++;
      } catch (error) {
        console.error('Error processing row:', error);
        errors.push(`แถว ${successCount + errorCount + 1}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
    }
    
    res.json({
      success: true,
      message: `อัปโหลดไฟล์ Excel สำเร็จ`,
      data: {
        totalRows: data.length,
        successCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined
      }
    });
    
  } catch (error) {
    console.error('Error uploading Excel:', error);
    
    // Clean up uploaded file
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์ Excel'
    });
  }
};

export {
  getRankings,
  getRankingStats,
  getCurrentRankingData,
  getMonthlyHistory,
  createRanking,
  updateRanking,
  deleteRanking,
  uploadExcel
};