import mongoose from 'mongoose';
import Notification from '../models/notificationModel.js';
import Evaluation from '../models/Evaluation.js';
import MoneyHistory from '../models/moneyHistoryModel.js';
import Shop from '../models/shopModel.js';

// ตรวจสอบและสร้าง Monthly Ranking Notification
export const checkAndCreateMonthlyRankingNotification = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    console.log(`🔍 Checking monthly ranking notification for ${currentMonth}/${currentYear}`);
    
    // ดึงร้านค้าทั้งหมดที่ยังไม่หมดสัญญา
    const activeShops = await Shop.find({
      contractEndDate: { $gte: currentDate },
      'credentials.status': 'active'
    });
    
    console.log(`📊 Found ${activeShops.length} active shops`);
    
    const results = {
      totalShops: activeShops.length,
      notificationsCreated: 0,
      notificationsSkipped: 0,
      errors: []
    };
    
    for (const shop of activeShops) {
      try {
        // ตรวจสอบว่ามี notification สำหรับเดือนนี้แล้วหรือยัง
        const existingNotification = await Notification.findOne({
          shopId: shop._id,
          type: 'monthly_ranking',
          'monthlyRankingData.month': currentMonth,
          'monthlyRankingData.year': currentYear
        });
        
        if (existingNotification) {
          console.log(`⏭️ Notification already exists for shop ${shop.name} in ${currentMonth}/${currentYear}`);
          results.notificationsSkipped++;
          continue;
        }
        
        // ตรวจสอบข้อมูล 3 ส่วน
        const hasCompleteData = await checkCompleteRankingData(shop._id, currentMonth, currentYear);
        
        if (hasCompleteData.isComplete) {
          // สร้าง notification
          const notification = await createMonthlyRankingNotification(shop, hasCompleteData.data, currentMonth, currentYear);
          console.log(`✅ Created monthly ranking notification for shop ${shop.name}`);
          results.notificationsCreated++;
        } else {
          console.log(`❌ Incomplete data for shop ${shop.name}: ${hasCompleteData.missing.join(', ')}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing shop ${shop.name}:`, error);
        results.errors.push({
          shopId: shop._id,
          shopName: shop.name,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Monthly ranking notification check completed for ${currentMonth}/${currentYear}`,
      results
    });
    
  } catch (error) {
    console.error('❌ Error in checkAndCreateMonthlyRankingNotification:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบและสร้าง monthly ranking notification',
      error: error.message
    });
  }
};

// ตรวจสอบว่ามีข้อมูลครบ 3 ส่วนหรือไม่
const checkCompleteRankingData = async (shopId, month, year) => {
  const missing = [];
  const data = {};
  
  try {
    // 1. ตรวจสอบรายได้ (MoneyHistory)
    const moneyHistory = await MoneyHistory.findOne({
      shopId: shopId,
      month: month,
      year: year
    });
    
    if (!moneyHistory || moneyHistory.totals === 0) {
      missing.push('รายได้');
    } else {
      data.revenue = moneyHistory.totals;
      data.revenueUpdatedAt = moneyHistory.updatedAt;
    }
    
    // 2. ตรวจสอบคะแนนประเมิน (Evaluation)
    const evaluation = await Evaluation.findOne({
      shopId: shopId,
      evaluationMonth: month,
      evaluationYear: year,
      isActive: true,
      evaluationSent: true
    });
    
    if (!evaluation || evaluation.totalScore === undefined) {
      missing.push('คะแนนประเมิน');
    } else {
      data.score = evaluation.totalScore;
      data.finalStatus = evaluation.finalStatus;
      data.evaluatedAt = evaluation.evaluatedAt;
    }
    
    // 3. ตรวจสอบลำดับ Ranking (คำนวณจาก Evaluation)
    if (evaluation) {
      // คำนวณลำดับในโรงอาหารเดียวกัน
      const allEvaluations = await Evaluation.find({
        canteenName: evaluation.canteenName,
        evaluationMonth: month,
        evaluationYear: year,
        isActive: true,
        evaluationSent: true
      }).sort({ totalScore: -1 });
      
      const rank = allEvaluations.findIndex(evalItem => 
        evalItem.shopId.toString() === shopId.toString()
      ) + 1;
      
      if (rank > 0) {
        data.rank = rank;
        data.totalShopsInCanteen = allEvaluations.length;
      } else {
        missing.push('ลำดับ Ranking');
      }
    } else {
      missing.push('ลำดับ Ranking');
    }
    
    return {
      isComplete: missing.length === 0,
      missing,
      data
    };
    
  } catch (error) {
    console.error('❌ Error checking complete ranking data:', error);
    return {
      isComplete: false,
      missing: ['เกิดข้อผิดพลาดในการตรวจสอบ'],
      data: {}
    };
  }
};

// สร้าง Monthly Ranking Notification
const createMonthlyRankingNotification = async (shop, rankingData, month, year) => {
  const monthNames = [
    '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const monthName = monthNames[month];
  const title = 'มีการอัปเดตข้อมูล Ranking';
  const message = `ข้อมูลการจัดอันดับประจำเดือน ${monthName} ${year} ได้รับการอัปเดตแล้ว\nกรุณาเช็คข้อมูลในหน้า Ranking เพื่อดูรายละเอียด`;
  
  const notification = new Notification({
    userId: shop._id,
    shopId: shop._id,
    type: 'monthly_ranking',
    title: title,
    message: message,
    status: 'ใหม่',
    monthlyRankingData: {
      month: month,
      year: year,
      monthName: monthName,
      revenue: rankingData.revenue,
      score: rankingData.score,
      rank: rankingData.rank,
      finalStatus: rankingData.finalStatus,
      totalShopsInCanteen: rankingData.totalShopsInCanteen,
      revenueUpdatedAt: rankingData.revenueUpdatedAt,
      evaluatedAt: rankingData.evaluatedAt
    }
  });
  
  await notification.save();
  return notification;
};

// ตรวจสอบสถานะข้อมูลสำหรับร้านค้าเฉพาะ
export const checkShopRankingStatus = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { month, year } = req.query;
    
    const currentDate = new Date();
    const checkMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    const checkYear = year ? parseInt(year) : currentDate.getFullYear();
    
    console.log(`🔍 Checking ranking status for shop ${shopId} in ${checkMonth}/${checkYear}`);
    
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลร้านค้า'
      });
    }
    
    // ตรวจสอบข้อมูล 3 ส่วน
    const rankingStatus = await checkCompleteRankingData(shopId, checkMonth, checkYear);
    
    // ตรวจสอบว่ามี notification แล้วหรือยัง
    const existingNotification = await Notification.findOne({
      shopId: shopId,
      type: 'monthly_ranking',
      'monthlyRankingData.month': checkMonth,
      'monthlyRankingData.year': checkYear
    });
    
    res.json({
      success: true,
      data: {
        shopId: shop._id,
        shopName: shop.name,
        month: checkMonth,
        year: checkYear,
        isComplete: rankingStatus.isComplete,
        missing: rankingStatus.missing,
        rankingData: rankingStatus.data,
        hasNotification: !!existingNotification,
        notificationId: existingNotification?._id
      }
    });
    
  } catch (error) {
    console.error('❌ Error in checkShopRankingStatus:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ ranking',
      error: error.message
    });
  }
};

// สร้าง notification สำหรับร้านค้าเฉพาะ (manual trigger)
export const createShopMonthlyNotification = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { month, year } = req.body;
    
    const currentDate = new Date();
    const targetMonth = month || currentDate.getMonth() + 1;
    const targetYear = year || currentDate.getFullYear();
    
    console.log(`🔍 Creating monthly notification for shop ${shopId} in ${targetMonth}/${targetYear}`);
    
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลร้านค้า'
      });
    }
    
    // ตรวจสอบว่ามี notification แล้วหรือยัง
    const existingNotification = await Notification.findOne({
      shopId: shopId,
      type: 'monthly_ranking',
      'monthlyRankingData.month': targetMonth,
      'monthlyRankingData.year': targetYear
    });
    
    if (existingNotification) {
      return res.status(400).json({
        success: false,
        message: `มี notification สำหรับเดือน ${targetMonth}/${targetYear} อยู่แล้ว`
      });
    }
    
    // ตรวจสอบข้อมูล 3 ส่วน
    const rankingStatus = await checkCompleteRankingData(shopId, targetMonth, targetYear);
    
    if (!rankingStatus.isComplete) {
      return res.status(400).json({
        success: false,
        message: `ข้อมูลยังไม่ครบ: ${rankingStatus.missing.join(', ')}`,
        missing: rankingStatus.missing
      });
    }
    
    // สร้าง notification
    const notification = await createMonthlyRankingNotification(shop, rankingStatus.data, targetMonth, targetYear);
    
    res.json({
      success: true,
      message: 'สร้าง monthly ranking notification สำเร็จ',
      data: {
        notificationId: notification._id,
        shopName: shop.name,
        month: targetMonth,
        year: targetYear,
        rankingData: rankingStatus.data
      }
    });
    
  } catch (error) {
    console.error('❌ Error in createShopMonthlyNotification:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้าง monthly ranking notification',
      error: error.message
    });
  }
};
