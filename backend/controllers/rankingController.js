import Ranking from '../models/rankingModel.js';
import Canteen from '../models/canteenModel.js';
import Evaluation from '../models/Evaluation.js';
import multer from 'multer';
import xlsx from 'xlsx';
import path from 'path';

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

// Get current month data for user ranking
const getCurrentRankingData = async (req, res) => {
  try {
    const { shopId } = req.query;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'ต้องระบุ shopId'
      });
    }
    
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
    const allEvaluations = await Evaluation.find({
      canteenName: evaluation.canteenName,
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      isActive: true
    }).sort({ totalScore: -1 }); // เรียงจากคะแนนสูงสุดไปต่ำสุด
    
    // หาลำดับของ shop นี้
    const rank = allEvaluations.findIndex(evaluation => evaluation.shopId.toString() === shopId) + 1;
    
    const currentData = {
      money: evaluation.revenue || 0,
      score: evaluation.totalScore || 0,
      rank: rank
    };
    
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

// Get monthly history for user ranking
const getMonthlyHistory = async (req, res) => {
  try {
    const { shopId } = req.query;
    
    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: 'ต้องระบุ shopId'
      });
    }
    
    // ดึงข้อมูล evaluation ทั้งหมดของ shop นี้
    const evaluations = await Evaluation.find({
      shopId: shopId,
      isActive: true
    }).sort({ evaluationYear: -1, evaluationMonth: -1 });
    
    const monthlyHistory = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    for (const evaluation of evaluations) {
      // คำนวณลำดับในโรงอาหารเดียวกันในเดือนนั้น
      const allEvaluationsInMonth = await Evaluation.find({
        canteenName: evaluation.canteenName,
        evaluationMonth: evaluation.evaluationMonth,
        evaluationYear: evaluation.evaluationYear,
        isActive: true
      }).sort({ totalScore: -1 }); // เรียงจากคะแนนสูงสุดไปต่ำสุด
      
      // หาลำดับของ shop นี้
      const rank = allEvaluationsInMonth.findIndex(evaluation => evaluation.shopId.toString() === shopId) + 1;
      
      // แปลงเดือนเป็นภาษาไทย
      const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ];
      
      const monthName = monthNames[evaluation.evaluationMonth - 1];
      const isCurrent = evaluation.evaluationMonth === currentMonth && evaluation.evaluationYear === currentYear;
      
      monthlyHistory.push({
        month: `${monthName} ${evaluation.evaluationYear}`,
        money: evaluation.revenue || 0,
        score: evaluation.totalScore || 0,
        rank: rank,
        notes: evaluation.finalStatus === 'ผ่าน' ? 'ผ่านการประเมิน' : 'ไม่ผ่านการประเมิน',
        isCurrent: isCurrent
      });
    }
    
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
    const { shopName, canteenId, revenue, evaluationStatus, overallStatus, notes } = req.body;
    
    // Get canteen name
    const canteen = await Canteen.findById(canteenId);
    if (!canteen) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบโรงอาหารที่ระบุ'
      });
    }
    
    const ranking = new Ranking({
      shopName,
      canteenId,
      canteenName: canteen.name,
      revenue: revenue || 0,
      evaluationStatus: evaluationStatus || 'ไม่ผ่าน',
      overallStatus: overallStatus || 'รอดำเนินการ',
      notes: notes || ''
    });
    
    await ranking.save();
    
    res.status(201).json({
      success: true,
      data: ranking
    });
  } catch (error) {
    console.error('Error creating ranking:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้าง ranking'
    });
  }
};

// Update ranking
const updateRanking = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // If updating evaluation status, add evaluation date and evaluator info
    if (updateData.evaluationStatus) {
      updateData.evaluationDate = new Date();
      updateData.evaluatorId = req.user?._id || null;
      updateData.evaluatorName = req.user?.name || 'Admin';
    }
    
    const ranking = await Ranking.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!ranking) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ ranking ที่ระบุ'
      });
    }
    
    res.json({
      success: true,
      data: ranking
    });
  } catch (error) {
    console.error('Error updating ranking:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดต ranking'
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
        message: 'ไม่พบ ranking ที่ระบุ'
      });
    }
    
    res.json({
      success: true,
      message: 'ลบ ranking สำเร็จ'
    });
  } catch (error) {
    console.error('Error deleting ranking:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบ ranking'
    });
  }
};

// Upload Excel file
const uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาอัปโหลดไฟล์ Excel'
      });
    }
    
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];
        
        // Validate required fields
        if (!row.shopName || !row.canteenName) {
          errors.push(`แถว ${i + 2}: ขาดข้อมูลชื่อร้านค้าหรือชื่อโรงอาหาร`);
          errorCount++;
          continue;
        }
        
        // Find canteen by name
        let canteen = await Canteen.findOne({ 
          name: { $regex: row.canteenName.trim(), $options: 'i' } 
        });
        
        // Create canteen if not exists
        if (!canteen) {
          canteen = new Canteen({
            name: row.canteenName.trim()
          });
          await canteen.save();
        }
        
        // Check if ranking already exists
        const existingRanking = await Ranking.findOne({
          shopName: row.shopName.trim(),
          canteenId: canteen._id
        });
        
        if (existingRanking) {
          // Update existing ranking
          existingRanking.revenue = parseFloat(row.revenue) || 0;
          existingRanking.evaluationStatus = row.evaluationStatus || 'ไม่ผ่าน';
          existingRanking.overallStatus = row.overallStatus || 'รอดำเนินการ';
          existingRanking.notes = row.notes || '';
          await existingRanking.save();
        } else {
          // Create new ranking
          const ranking = new Ranking({
            shopName: row.shopName.trim(),
            canteenId: canteen._id,
            canteenName: canteen.name,
            revenue: parseFloat(row.revenue) || 0,
            evaluationStatus: row.evaluationStatus || 'ไม่ผ่าน',
            overallStatus: row.overallStatus || 'รอดำเนินการ',
            notes: row.notes || ''
          });
          await ranking.save();
        }
        
        successCount++;
      } catch (error) {
        errors.push(`แถว ${i + 2}: ${error.message}`);
        errorCount++;
      }
    }
    
    // Clean up uploaded file
    const fs = await import('fs');
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.json({
      success: true,
      data: {
        totalProcessed: data.length,
        successCount,
        errorCount,
        errors: errors.slice(0, 10) // Limit error messages
      }
    });
  } catch (error) {
    console.error('Error uploading Excel:', error);
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