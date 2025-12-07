import express from 'express';
import EvaluationItem from '../models/EvaluationItem.js';
import Evaluation from '../models/Evaluation.js';
import EvaluationControl from '../models/EvaluationControl.js';
import ResetControl from '../models/ResetControl.js';
import Shop from '../models/shopModel.js';
import { checkNewTopics, resetCurrentMonthEvaluations } from '../controllers/evaluationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { createRankingEvaluationNotification } from '../controllers/notificationController.js';

// Helper function to get canteen name
const getCanteenName = (canteenId) => {
  const canteenMapping = {
    1: 'โรงอาหาร C5',
    2: 'โรงอาหาร D1', 
    3: 'โรงอาหาร Dormity',
    4: 'โรงอาหาร E1',
    5: 'โรงอาหาร E2',
    6: 'โรงอาหาร Epark',
    7: 'โรงอาหาร Msquare',
    8: 'โรงอาหาร RuemRim',
    9: 'โรงอาหาร S2'
  };
  return canteenMapping[canteenId] || `โรงอาหาร ${canteenId}`;
};

// Helper function to get current resetId
const getCurrentResetId = async () => {
  try {
    let resetControl = await ResetControl.findOne();
    if (!resetControl) {
      resetControl = new ResetControl({
        currentResetId: 1,
        lastResetDate: new Date()
      });
      await resetControl.save();
    }
    return resetControl.currentResetId;
  } catch (error) {
    console.error('Error getting current resetId:', error);
    return 1;
  }
};

// Helper function to increment resetId
const incrementResetId = async (resetBy, resetReason = '') => {
  try {
    let resetControl = await ResetControl.findOne();
    if (!resetControl) {
      resetControl = new ResetControl({
        currentResetId: 1,
        lastResetDate: new Date()
      });
    }
    
    resetControl.currentResetId += 1;
    resetControl.lastResetDate = new Date();
    resetControl.resetBy = resetBy;
    resetControl.resetReason = resetReason;
    
    await resetControl.save();
    return resetControl.currentResetId;
  } catch (error) {
    console.error('Error incrementing resetId:', error);
    throw error;
  }
};

// Helper function to get current evaluation round for a shop
const getCurrentEvaluationRound = async (shopId, month, year, resetId) => {
  try {
    const latestEvaluation = await Evaluation.findOne({
      shopId,
      evaluationMonth: month,
      evaluationYear: year,
      resetId,
      isActive: true
    }).sort({ evaluationRound: -1 });
    
    return latestEvaluation ? latestEvaluation.evaluationRound + 1 : 1;
  } catch (error) {
    console.error('Error getting current evaluation round:', error);
    return 1;
  }
};

const router = express.Router();

// Apply auth middleware to all routes
router.use(verifyToken);

// Get all evaluations
router.get('/', async (req, res) => {
  try {
    const evaluations = await Evaluation.find().sort({ createdAt: -1 });
    console.log(`Found ${evaluations.length} evaluations`);
    res.json({ data: evaluations });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get shops for evaluation (active shops that need evaluation)
router.get('/shops', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // ตรวจสอบว่าการประเมินเปิดอยู่หรือไม่
    const control = await EvaluationControl.findOne({ 
      month: currentMonth, 
      year: currentYear 
    });
    
    if (control && !control.isEvaluationEnabled) {
      return res.status(400).json({ 
        message: `การประเมินปิดสำหรับเดือน ${currentMonth}/${currentYear}: ${control.reason}` 
      });
    }

    // ดึงร้านค้าที่ยังไม่หมดสัญญา (เลือกเฉพาะ fields ที่จำเป็น)
    const activeShops = await Shop.find({
      contractEndDate: { $gte: currentDate },
      'credentials.status': 'active'
    })
      .select('_id customId name type canteenId location contractEndDate')
      .sort({ name: 1 })
      .lean();

    console.log(`Found ${activeShops.length} active shops`);

    // ดึงหัวข้อการประเมินปัจจุบัน
    const evaluationItems = await EvaluationItem.find().sort({ order: 1 }).lean();
    
    // ดึง resetId ปัจจุบัน
    const currentResetId = await getCurrentResetId();
    
    // ✅ ใช้ batch query แทน N+1 query - query evaluations ทั้งหมดในครั้งเดียว
    const shopIds = activeShops.map(shop => shop._id);
    const existingEvaluations = await Evaluation.find({
      shopId: { $in: shopIds },
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      resetId: currentResetId
    }).lean();
    
    // สร้าง Map เพื่อ lookup เร็ว
    const evaluationsByShop = new Map();
    existingEvaluations.forEach(evalItem => {
      const shopIdStr = evalItem.shopId.toString();
      evaluationsByShop.set(shopIdStr, evalItem);
    });
    
    // สร้าง evaluation records สำหรับร้านค้าที่ยังไม่มี
    const shopsWithEvaluations = [];
    const evaluationsToCreate = [];
    
    for (const shop of activeShops) {
      const shopIdStr = shop._id.toString();
      let evaluation = evaluationsByShop.get(shopIdStr);

      // ถ้าไม่มี ให้สร้างใหม่
      if (!evaluation) {
        const evaluationRound = await getCurrentEvaluationRound(shop._id, currentMonth, currentYear, currentResetId);
        
        const evaluationData = {
          shopId: shop._id,
          revenue: 0,
          items: evaluationItems.map(item => ({
            id: item._id,
            title: item.title,
            description: item.description || '',
            maxScore: item.maxScore,
            order: item.order || 0,
            status: '',
            suggestion: '',
            driveLink: ''
          })),
          totalScore: 0,
          finalStatus: 'ไม่ผ่าน',
          evaluationMonth: currentMonth,
          evaluationYear: currentYear,
          evaluationRound: evaluationRound,
          resetId: currentResetId,
          evaluatedAt: new Date(),
          isActive: true,
          evaluationSent: false
        };

        // เพิ่มเข้า array เพื่อสร้างทีเดียว
        evaluationsToCreate.push(evaluationData);
        evaluation = evaluationData; // ใช้ข้อมูลชั่วคราว
        console.log(`Will create evaluation for shop: ${shop.name} with resetId: ${currentResetId}`);
      }

      // เพิ่มข้อมูลร้านค้าและ evaluation
      shopsWithEvaluations.push({
        _id: shop._id,
        customId: shop.customId,
        name: shop.name,
        type: shop.type,
        canteenId: shop.canteenId,
        canteenName: getCanteenName(shop.canteenId),
        location: shop.location,
        contractEndDate: shop.contractEndDate,
        evaluationSent: evaluation.evaluationSent || false,
        evaluation: {
          _id: evaluation._id || null,
          totalScore: evaluation.totalScore || 0,
          finalStatus: evaluation.finalStatus || 'ไม่ผ่าน',
          evaluationMonth: evaluation.evaluationMonth || currentMonth,
          evaluationYear: evaluation.evaluationYear || currentYear,
          evaluatedAt: evaluation.evaluatedAt || new Date(),
          evaluationSent: evaluation.evaluationSent || false,
          items: evaluation.items || []
        }
      });
    }
    
    // สร้าง evaluations ทั้งหมดในครั้งเดียว (batch insert)
    if (evaluationsToCreate.length > 0) {
      await Evaluation.insertMany(evaluationsToCreate);
      console.log(`Created ${evaluationsToCreate.length} new evaluations`);
      
      // อัปเดตข้อมูลใน shopsWithEvaluations สำหรับ evaluations ที่เพิ่งสร้าง
      const newlyCreatedEvaluations = await Evaluation.find({
        shopId: { $in: shopIds },
        evaluationMonth: currentMonth,
        evaluationYear: currentYear,
        resetId: currentResetId
      }).lean();
      
      // อัปเดต evaluation._id ใน shopsWithEvaluations
      newlyCreatedEvaluations.forEach(evalItem => {
        const shopIndex = shopsWithEvaluations.findIndex(
          shop => shop._id.toString() === evalItem.shopId.toString()
        );
        if (shopIndex !== -1 && !shopsWithEvaluations[shopIndex].evaluation._id) {
          shopsWithEvaluations[shopIndex].evaluation._id = evalItem._id;
          shopsWithEvaluations[shopIndex].evaluation.evaluatedAt = evalItem.evaluatedAt;
        }
      });
    }

    res.json({
      success: true,
      data: shopsWithEvaluations,
      currentMonth,
      currentYear,
      evaluationEnabled: !control || control.isEvaluationEnabled
    });

  } catch (error) {
    console.error('Error fetching shops for evaluation:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get evaluation control data (for admin control panel)
router.get('/control-data', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // ตรวจสอบการควบคุมการประเมิน
    let control = await EvaluationControl.findOne({ 
      month: currentMonth, 
      year: currentYear 
    });

    if (!control) {
      // ถ้าไม่มีข้อมูล ให้สร้างใหม่และเปิดการประเมิน
      control = new EvaluationControl({
        month: currentMonth,
        year: currentYear,
        isEvaluationEnabled: true
      });
      await control.save();
    }

    // ดึงร้านค้าที่ยังไม่หมดสัญญา (เลือกเฉพาะ fields ที่จำเป็น)
    const activeShops = await Shop.find({
      contractEndDate: { $gte: currentDate },
      'credentials.status': 'active'
    })
      .select('_id customId name type canteenId location contractEndDate')
      .sort({ name: 1 })
      .lean();

    // ดึงการประเมินสำหรับเดือนนี้ (ใช้ lean() เพื่อเพิ่มความเร็ว)
    const currentEvaluations = await Evaluation.find({
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      isActive: true
    })
      .select('shopId totalScore finalStatus evaluationSent sentAt revenue')
      .populate('shopId', 'customId name type canteenId')
      .lean();

    // สร้างข้อมูลสำหรับแสดงผล
    const shopsData = activeShops.map(shop => {
      const evaluation = currentEvaluations.find(e => e.shopId._id.toString() === shop._id.toString());
      
      // กำหนดสถานะการส่งตามเงื่อนไข
      let submissionStatus;
      if (!control.isEvaluationEnabled) {
        // ถ้าปิดระบบ แสดง "ปิดระบบ"
        submissionStatus = 'ปิดระบบ';
      } else {
        // ถ้าเปิดระบบ แสดงสถานะปกติ
        if (evaluation) {
          submissionStatus = evaluation.evaluationSent ? 'เสร็จสิ้น' : 'รอดำเนินการ';
        } else {
          submissionStatus = 'รอดำเนินการ';
        }
      }
      
      return {
        _id: shop._id,
        customId: shop.customId,
        name: shop.name,
        type: shop.type,
        canteenId: shop.canteenId,
        canteenName: getCanteenName(shop.canteenId),
        location: shop.location,
        contractEndDate: shop.contractEndDate,
        hasEvaluation: !!evaluation,
        evaluationStatus: evaluation ? evaluation.finalStatus : 'รอดำเนินการ',
        evaluationScore: evaluation ? evaluation.totalScore : 0,
        evaluationId: evaluation ? evaluation._id : null,
        evaluationSent: evaluation ? evaluation.evaluationSent : false,
        sentAt: evaluation ? evaluation.sentAt : null,
        submissionStatus: submissionStatus, // สถานะการส่งใหม่
        revenue: evaluation ? evaluation.revenue || 0 : 0 // เพิ่ม revenue
      };
    });


    const controlData = {
      currentMonth,
      currentYear,
      isEvaluationEnabled: control.isEvaluationEnabled,
      reason: control.reason || '',
      totalActiveShops: activeShops.length,
      totalEvaluations: currentEvaluations.length,
      completedEvaluations: currentEvaluations.filter(e => e.finalStatus !== 'ไม่ผ่าน').length,
      pendingEvaluations: currentEvaluations.filter(e => e.finalStatus === 'ไม่ผ่าน').length,
      shops: shopsData
    };

    res.json({
      success: true,
      data: controlData
    });

  } catch (error) {
    console.error('Error fetching evaluation control data:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Send evaluation to shop
router.post('/send/:evaluationId', async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const { sentBy } = req.body;
    
    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ 
        success: false,
        message: 'Evaluation not found' 
      });
    }
    
    // อัปเดตสถานะการส่ง
    evaluation.evaluationSent = true;
    evaluation.sentAt = new Date();
    evaluation.sentBy = sentBy;
    
    await evaluation.save();
    
    console.log(`Evaluation sent for shop: ${evaluation.shopId}`);
    
    res.json({
      success: true,
      message: 'Evaluation sent successfully',
      data: {
        evaluationId: evaluation._id,
        evaluationSent: evaluation.evaluationSent,
        sentAt: evaluation.sentAt
      }
    });
    
  } catch (error) {
    console.error('Error sending evaluation:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Check for new evaluation topics
router.get('/check-new-topics', checkNewTopics);

// Reset evaluations for current month only
router.post('/reset-current-month', resetCurrentMonthEvaluations);

// Reset system (increment resetId)
router.post('/reset-system', async (req, res) => {
  try {
    const { resetReason } = req.body;
    const resetBy = req.user?.id;
    
    // Increment resetId
    const newResetId = await incrementResetId(resetBy, resetReason);
    
    console.log(`System reset to resetId: ${newResetId}`);
    
    res.json({
      success: true,
      message: 'System reset successfully',
      newResetId,
      resetReason: resetReason || '',
      resetBy: resetBy || null
    });
  } catch (error) {
    console.error('Error resetting system:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get current reset information
router.get('/reset-info', async (req, res) => {
  try {
    const resetControl = await ResetControl.findOne();
    const currentResetId = await getCurrentResetId();
    
    res.json({
      success: true,
      currentResetId,
      lastResetDate: resetControl?.lastResetDate || null,
      resetBy: resetControl?.resetBy || null,
      resetReason: resetControl?.resetReason || ''
    });
  } catch (error) {
    console.error('Error getting reset info:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get available resetIds for filtering
router.get('/reset-ids', async (req, res) => {
  try {
    // Get all unique resetIds from evaluations
    const resetIds = await Evaluation.distinct('resetId', {
      isActive: true
    });
    
    // Sort resetIds in descending order (newest first)
    const sortedResetIds = resetIds.sort((a, b) => b - a);
    
    // Get reset control info for each resetId
    const resetInfo = await Promise.all(
      sortedResetIds.map(async (resetId) => {
        const evaluationCount = await Evaluation.countDocuments({
          resetId,
          isActive: true
        });
        
        const firstEvaluation = await Evaluation.findOne({
          resetId,
          isActive: true
        }).sort({ createdAt: 1 });
        
        return {
          resetId,
          evaluationCount,
          firstEvaluationDate: firstEvaluation?.createdAt || null,
          lastEvaluationDate: firstEvaluation?.updatedAt || null
        };
      })
    );
    
    res.json({
      success: true,
      resetIds: sortedResetIds,
      resetInfo
    });
  } catch (error) {
    console.error('Error getting reset IDs:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get shop rankings with average scores for current resetId
router.get('/rankings', async (req, res) => {
  try {
    const { resetId, minRounds = 2 } = req.query;
    const currentResetId = resetId ? parseInt(resetId) : await getCurrentResetId();
    
    // Get all active shops (เลือกเฉพาะ fields ที่จำเป็น)
    const shops = await Shop.find({
      'credentials.status': 'active'
    })
      .select('_id customId name canteenId type')
      .lean();
    
    const shopIds = shops.map(shop => shop._id);
    
    // ✅ ใช้ batch query แทน N+1 query - query evaluations ทั้งหมดในครั้งเดียว
    const allEvaluations = await Evaluation.find({
      shopId: { $in: shopIds },
      resetId: currentResetId,
      isActive: true,
      evaluationSent: true
    })
      .select('shopId totalScore revenue finalStatus evaluationRound evaluationMonth evaluationYear')
      .sort({ shopId: 1, evaluationRound: 1 })
      .lean();
    
    // สร้าง Map เพื่อจัดกลุ่ม evaluations ตาม shopId
    const evaluationsByShop = new Map();
    allEvaluations.forEach(evalItem => {
      const shopIdStr = evalItem.shopId.toString();
      if (!evaluationsByShop.has(shopIdStr)) {
        evaluationsByShop.set(shopIdStr, []);
      }
      evaluationsByShop.get(shopIdStr).push(evalItem);
    });
    
    // Calculate average scores for each shop
    const shopRankings = [];
    
    for (const shop of shops) {
      const shopIdStr = shop._id.toString();
      const evaluations = evaluationsByShop.get(shopIdStr) || [];
      
      if (evaluations.length === 0) continue;
      
      // Calculate average score
      const totalScore = evaluations.reduce((sum, evaluation) => sum + (evaluation.totalScore || 0), 0);
      const avgScore = totalScore / evaluations.length;
      const evaluationRounds = evaluations.length;
      
      // Calculate total revenue for this shop in current resetId
      const totalRevenue = evaluations.reduce((sum, evaluation) => sum + (evaluation.revenue || 0), 0);
      
      // Only include shops with enough evaluation rounds
      if (evaluationRounds >= minRounds) {
        shopRankings.push({
          shopId: shop._id,
          customId: shop.customId,
          name: shop.name,
          canteenId: shop.canteenId,
          canteenName: getCanteenName(shop.canteenId),
          type: shop.type,
          avgScore: Math.round(avgScore * 100) / 100, // Round to 2 decimal places
          totalScore: totalScore,
          totalRevenue: totalRevenue, // Total revenue for this resetId
          evaluationRounds: evaluationRounds,
          evaluations: evaluations.map(evaluation => ({
            round: evaluation.evaluationRound,
            score: evaluation.totalScore,
            revenue: evaluation.revenue || 0,
            status: evaluation.finalStatus,
            month: evaluation.evaluationMonth,
            year: evaluation.evaluationYear
          }))
        });
      }
    }
    
    // Sort by average score (low to high - worst performers first)
    shopRankings.sort((a, b) => a.avgScore - b.avgScore);
    
    // Group by canteen
    const rankingsByCanteen = {};
    shopRankings.forEach(shop => {
      if (!rankingsByCanteen[shop.canteenId]) {
        rankingsByCanteen[shop.canteenId] = {
          canteenId: shop.canteenId,
          canteenName: shop.canteenName,
          shops: []
        };
      }
      rankingsByCanteen[shop.canteenId].shops.push(shop);
    });
    
    res.json({
      success: true,
      resetId: currentResetId,
      minRounds: parseInt(minRounds),
      totalShops: shopRankings.length,
      rankingsByCanteen: Object.values(rankingsByCanteen),
      allRankings: shopRankings
    });
  } catch (error) {
    console.error('Error getting rankings:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Eliminate shops (mark as 'คัดออก')
router.post('/eliminate-shops', async (req, res) => {
  try {
    const { shopIds, resetId, minRounds = 2 } = req.body;
    const currentResetId = resetId || await getCurrentResetId();
    
    if (!shopIds || !Array.isArray(shopIds) || shopIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุร้านค้าที่ต้องการคัดออก'
      });
    }
    
    const eliminatedShops = [];
    const errors = [];
    
    for (const shopId of shopIds) {
      try {
        // Check if shop has enough evaluation rounds
        const evaluations = await Evaluation.find({
          shopId,
          resetId: currentResetId,
          isActive: true,
          evaluationSent: true
        });
        
        if (evaluations.length < minRounds) {
          errors.push({
            shopId,
            message: `ร้านค้านี้มีรอบการประเมินน้อยกว่า ${minRounds} รอบ ไม่สามารถคัดออกได้`
          });
          continue;
        }
        
        // Update all evaluations for this shop in current resetId to 'คัดออก'
        const updateResult = await Evaluation.updateMany(
          {
            shopId,
            resetId: currentResetId,
            isActive: true
          },
          {
            $set: {
              finalStatus: 'คัดออก',
              updatedAt: new Date()
            }
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          eliminatedShops.push({
            shopId,
            evaluationsUpdated: updateResult.modifiedCount
          });
        }
      } catch (error) {
        errors.push({
          shopId,
          message: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `คัดออกร้านค้า ${eliminatedShops.length} ร้านสำเร็จ`,
      eliminatedShops,
      errors,
      resetId: currentResetId,
      minRounds
    });
  } catch (error) {
    console.error('Error eliminating shops:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get all evaluation items
router.get('/items', async (req, res) => {
  try {
    const items = await EvaluationItem.find().sort({ order: 1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching evaluation items:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new evaluation item
router.post('/items', async (req, res) => {
  try {
    const { title, description, maxScore, order } = req.body;
    
    if (!title || !maxScore) {
      return res.status(400).json({
        success: false,
        error: 'กรุณากรอกชื่อหัวข้อและคะแนนเต็ม'
      });
    }
    
    const newItem = new EvaluationItem({
      title,
      description: description || '',
      maxScore: parseInt(maxScore),
      order: order || 0
    });
    const savedItem = await newItem.save();
    
    // หลังจากเพิ่มหัวข้อใหม่ ให้รีเซ็ตการประเมินเฉพาะเดือนปัจจุบัน
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // หาการประเมินทั้งหมดในเดือนปัจจุบัน
    const currentEvaluations = await Evaluation.find({
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      isActive: true
    });
    
    // อัปเดตการประเมินทั้งหมดในเดือนปัจจุบันให้มีหัวข้อใหม่
    for (let evaluation of currentEvaluations) {
      // เพิ่มหัวข้อใหม่เข้าไปใน items
      evaluation.items.push({
        id: savedItem._id,
        title: savedItem.title,
        description: savedItem.description || '',
        maxScore: savedItem.maxScore,
        order: savedItem.order || 0,
        status: '' // ยังไม่มีการประเมิน
      });
      
      // รีเซ็ตคะแนนเฉพาะเดือนปัจจุบัน (ไม่กระทบประวัติเก่า)
      evaluation.totalScore = 100;
      evaluation.finalStatus = 'ไม่ผ่าน';
      evaluation.updatedAt = new Date();
      
      await evaluation.save();
    }
    
    console.log(`Added new evaluation item and updated ${currentEvaluations.length} evaluations`);
    
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating evaluation item:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update evaluation item
router.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedItem = await EvaluationItem.findByIdAndUpdate(
      id,
      req.body,
      { new: true }
    );
    if (!updatedItem) {
      return res.status(404).json({ message: 'Evaluation item not found' });
    }
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating evaluation item:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete evaluation item
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await EvaluationItem.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ message: 'Evaluation item not found' });
    }
    res.json({ message: 'Evaluation item deleted successfully' });
  } catch (error) {
    console.error('Error deleting evaluation item:', error);
    res.status(500).json({ message: error.message });
  }
});

// Check if evaluation is enabled for current month
router.get('/control/current', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    const currentYear = currentDate.getFullYear();

    let control = await EvaluationControl.findOne({ 
      month: currentMonth, 
      year: currentYear 
    });

    if (!control) {
      // ถ้าไม่มีข้อมูล ให้สร้างใหม่และเปิดการประเมิน
      control = new EvaluationControl({
        month: currentMonth,
        year: currentYear,
        isEvaluationEnabled: true
      });
      await control.save();
    }

    res.json({
      isEnabled: control.isEvaluationEnabled,
      reason: control.reason,
      month: currentMonth,
      year: currentYear
    });
  } catch (error) {
    console.error('Error checking evaluation control:', error);
    res.status(500).json({ message: error.message });
  }
});

// Set evaluation control for specific month
router.post('/control', async (req, res) => {
  try {
    const { month, year, isEvaluationEnabled, reason } = req.body;
    
    let control = await EvaluationControl.findOne({ month, year });
    
    if (control) {
      control.isEvaluationEnabled = isEvaluationEnabled;
      control.reason = reason || '';
      await control.save();
    } else {
      control = new EvaluationControl({
        month,
        year,
        isEvaluationEnabled,
        reason: reason || ''
      });
      await control.save();
    }

    res.json(control);
  } catch (error) {
    console.error('Error setting evaluation control:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get evaluation control history
router.get('/control/history', async (req, res) => {
  try {
    const controls = await EvaluationControl.find()
      .sort({ year: -1, month: -1 })
      .limit(20); // จำกัดให้แสดง 20 รายการล่าสุด
    
    res.json(controls);
  } catch (error) {
    console.error('Error fetching control history:', error);
    res.status(500).json({ message: error.message });
  }
});

// Save evaluation
router.post('/', async (req, res) => {
  try {
    const { shopId, items, evaluatedAt } = req.body;
    console.log('Received evaluation data:', { shopId, items, evaluatedAt });
    
    // ตรวจสอบว่าการประเมินเปิดอยู่หรือไม่
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const control = await EvaluationControl.findOne({ 
      month: currentMonth, 
      year: currentYear 
    });
    
    if (control && !control.isEvaluationEnabled) {
      return res.status(400).json({ 
        message: `การประเมินปิดสำหรับเดือน ${currentMonth}/${currentYear}: ${control.reason}` 
      });
    }

    // ดึง resetId ปัจจุบัน
    const currentResetId = await getCurrentResetId();
    
    // หารอบประเมินปัจจุบัน
    const currentRound = await getCurrentEvaluationRound(shopId, currentMonth, currentYear, currentResetId);
    
    // ดึงข้อมูลร้านค้า
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // คำนวณ totalScore จาก items (คะแนนที่ได้จริง)
    let earnedScore = 0; // คะแนนที่ได้จริง
    let maxPossibleScore = 0; // คะแนนเต็มทั้งหมด
    
    console.log('Calculating score from items:', items);
    
    items.forEach(item => {
      const maxScore = item.maxScore || 0;
      maxPossibleScore += maxScore;
      
      // ได้คะแนนเมื่อเลือก "ผ่าน" เท่านั้น
      if (item.status === 'ผ่าน') {
        earnedScore += maxScore;
      }
      
      console.log(`Item: ${item.title}, Status: ${item.status}, MaxScore: ${maxScore}, EarnedScore: ${earnedScore}`);
    });

    // คำนวณ finalStatus (ผ่านเมื่อได้คะแนน >= 50% ของคะแนนเต็ม)
    const finalStatus = earnedScore >= (maxPossibleScore * 0.5) ? 'ผ่าน' : 'ไม่ผ่าน';
    
    console.log(`Final calculation - EarnedScore: ${earnedScore}, MaxPossibleScore: ${maxPossibleScore}, FinalStatus: ${finalStatus}`);

    // ตรวจสอบข้อมูลที่จำเป็น
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'ไม่มีข้อมูล items สำหรับการประเมิน' });
    }

    if (earnedScore === undefined || finalStatus === undefined) {
      return res.status(400).json({ message: 'เกิดข้อผิดพลาดในการคำนวณคะแนน' });
    }

    // ตรวจสอบว่า maxPossibleScore มากกว่า 0
    if (maxPossibleScore === 0) {
      return res.status(400).json({ message: 'คะแนนเต็มต้องมากกว่า 0' });
    }

    // หา evaluation ที่มีอยู่แล้วสำหรับร้านค้านี้ในเดือนนี้
    const existingEvaluation = await Evaluation.findOne({
      shopId,
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      resetId: currentResetId
    });
    
    if (existingEvaluation) {
      // อัปเดตข้อมูลที่มีอยู่แล้ว
      console.log('Updating existing evaluation:', existingEvaluation._id);
      
      existingEvaluation.items = items;
      existingEvaluation.totalScore = earnedScore;
      existingEvaluation.finalStatus = finalStatus;
      existingEvaluation.evaluatedAt = evaluatedAt || new Date();
      existingEvaluation.evaluationSent = true;
      existingEvaluation.sentAt = new Date();
      existingEvaluation.updatedAt = new Date();
      
      const updatedEvaluation = await existingEvaluation.save();
      console.log('Updated evaluation:', updatedEvaluation);
      
      // สร้าง notification เมื่อ admin อัปเดตการประเมิน ranking
      try {
        const evaluatorName = req.user?.name || req.user?.username || 'Admin';
        await createRankingEvaluationNotification(updatedEvaluation, evaluatorName);
        console.log(`📊 Ranking evaluation notification sent for shop ${shop.name}`);
      } catch (notificationError) {
        console.error('Error creating ranking evaluation notification:', notificationError);
        // ไม่ส่ง error กลับไปเพราะการประเมินสำเร็จแล้ว
      }
      
      return res.status(200).json(updatedEvaluation);
    } else {
      // ถ้าไม่มี evaluation สำหรับร้านค้านี้ในเดือนนี้ ให้สร้างใหม่
      console.log('Creating new evaluation for shop:', shopId);
      
      const evaluationData = {
        shopId,
        revenue: shop.revenue || 0,
        items,
        totalScore: earnedScore,
        finalStatus,
        evaluationMonth: currentMonth,
        evaluationYear: currentYear,
        evaluationRound: currentRound,
        resetId: currentResetId,
        evaluatedAt: evaluatedAt || new Date(),
        evaluationSent: true,
        sentAt: new Date(),
        isActive: true
      };
      
      const newEvaluation = new Evaluation(evaluationData);
      const savedEvaluation = await newEvaluation.save();
      console.log('Created new evaluation:', savedEvaluation);
      
      // สร้าง notification เมื่อ admin ประเมิน ranking
      try {
        const evaluatorName = req.user?.name || req.user?.username || 'Admin';
        await createRankingEvaluationNotification(savedEvaluation, evaluatorName);
        console.log(`📊 Ranking evaluation notification sent for shop ${shop.name}`);
      } catch (notificationError) {
        console.error('Error creating ranking evaluation notification:', notificationError);
        // ไม่ส่ง error กลับไปเพราะการประเมินสำเร็จแล้ว
      }
      
      return res.status(201).json(savedEvaluation);
    }
  } catch (error) {
    console.error('Error saving evaluation:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'การประเมินซ้ำในเดือนเดียวกัน' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// Get evaluations by shop
router.get('/shop/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const evaluations = await Evaluation.find({ 
      shopId, 
      isActive: true 
    }).sort({ evaluationYear: -1, evaluationMonth: -1 });
    res.json(evaluations);
  } catch (error) {
    console.error('Error fetching shop evaluations:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get current month evaluation for shop
router.get('/shop/:shopId/current', async (req, res) => {
  try {
    const { shopId } = req.params;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    console.log(`Looking for evaluation: shopId=${shopId}, month=${currentMonth}, year=${currentYear}`);

    const evaluation = await Evaluation.findOne({
      shopId,
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      isActive: true
    });

    console.log('Found evaluation:', evaluation);
    res.json(evaluation);
  } catch (error) {
    console.error('Error fetching current evaluation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Debug endpoint to check all evaluations in database
router.get('/debug/all', async (req, res) => {
  try {
    const allEvaluations = await Evaluation.find({}).sort({ createdAt: -1 });
    console.log(`Found ${allEvaluations.length} evaluations in database`);
    
    res.json({
      collectionName: 'evaluations',
      count: allEvaluations.length,
      evaluations: allEvaluations
    });
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete evaluation by ID
router.delete('/:evaluationId', async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const deletedEvaluation = await Evaluation.findByIdAndDelete(evaluationId);
    
    if (!deletedEvaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Error deleting evaluation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get evaluation history for shop
router.get('/shop/:shopId/history', async (req, res) => {
  try {
    const { shopId } = req.params;
    
    const evaluations = await Evaluation.find({
      shopId,
      isActive: true
    }).sort({ evaluatedAt: -1 });
    
    res.json(evaluations);
  } catch (error) {
    console.error('Error fetching evaluation history:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update evaluation
router.put('/:evaluationId', async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const { items, totalScore, finalStatus } = req.body;
    
    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    evaluation.items = items;
    evaluation.totalScore = totalScore;
    evaluation.finalStatus = finalStatus;
    evaluation.updatedAt = new Date();
    
    const updatedEvaluation = await evaluation.save();
    
    // สร้าง notification เมื่อ admin อัปเดตการประเมิน ranking
    try {
      const evaluatorName = req.user?.name || req.user?.username || 'Admin';
      await createRankingEvaluationNotification(updatedEvaluation, evaluatorName);
      console.log(`📊 Ranking evaluation update notification sent for evaluation ${updatedEvaluation._id}`);
    } catch (notificationError) {
      console.error('Error creating ranking evaluation notification:', notificationError);
      // ไม่ส่ง error กลับไปเพราะการอัปเดตสำเร็จแล้ว
    }
    
    res.json(updatedEvaluation);
  } catch (error) {
    console.error('Error updating evaluation:', error);
    res.status(500).json({ message: error.message });
  }
});

// Check for new evaluation items
router.get('/check-new-items/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    
    // ดึงหัวข้อการประเมินปัจจุบัน
    const currentItems = await EvaluationItem.find().sort({ order: 1 });
    const currentItemIds = currentItems.map(item => item._id.toString());
    
    // ดึงการประเมินปัจจุบันของร้านค้า
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    const currentEvaluation = await Evaluation.findOne({
      shopId,
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      isActive: true
    });
    
    if (!currentEvaluation) {
      return res.json({ hasNewItems: false, needsReset: false });
    }
    
    // ตรวจสอบว่ามีหัวข้อใหม่หรือไม่ (เฉพาะเดือนปัจจุบัน)
    const evaluationItemIds = currentEvaluation.items.map(item => item.id.toString());
    const hasNewItems = currentItemIds.some(id => !evaluationItemIds.includes(id));
    
    res.json({
      hasNewItems,
      needsReset: hasNewItems,
      currentItemCount: currentItems.length,
      evaluationItemCount: currentEvaluation.items.length,
      currentMonth,
      currentYear
    });
  } catch (error) {
    console.error('Error checking for new items:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reset all scores (for new academic year)
router.post('/reset-scores', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // ไม่ต้องอัปเดต Shop collection เพราะไม่มี evaluation fields แล้ว
    
    // ลบการประเมินเก่าทั้งหมด (เฉพาะเดือนปัจจุบัน)
    const result = await Evaluation.updateMany(
      { 
        evaluationMonth: currentMonth, 
        evaluationYear: currentYear,
        isActive: true 
      }, 
      { isActive: false }
    );
    
    console.log(`Reset ${result.modifiedCount} evaluations for ${currentMonth}/${currentYear}`);
    
    res.json({ 
      message: 'Reset scores successfully',
      resetCount: result.modifiedCount,
      month: currentMonth,
      year: currentYear
    });
  } catch (error) {
    console.error('Error resetting scores:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get evaluation statistics
router.get('/stats', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const stats = await Evaluation.aggregate([
      {
        $match: {
          evaluationMonth: currentMonth,
          evaluationYear: currentYear,
          isActive: true
        }
      },
      {
        $group: {
          _id: null,
          totalShops: { $sum: 1 },
          passedCount: {
            $sum: { $cond: [{ $eq: ['$finalStatus', 'ผ่าน'] }, 1, 0] }
          },
          failedCount: {
            $sum: { $cond: [{ $eq: ['$finalStatus', 'ไม่ผ่าน'] }, 1, 0] }
          },
          averageScore: { $avg: '$totalScore' }
        }
      }
    ]);

    res.json(stats[0] || {
      totalShops: 0,
      passedCount: 0,
      failedCount: 0,
      averageScore: 0
    });
  } catch (error) {
    console.error('Error fetching evaluation stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get evaluation history for admin
router.get('/history', async (req, res) => {
  try {
    const { month, year, canteenName, status, resetId } = req.query;
    
    // Build query - เฉพาะข้อมูลที่ประเมินแล้วเท่านั้น
    let query = { 
      isActive: true,
      evaluationSent: true  // เฉพาะข้อมูลที่ส่งแล้ว (ประเมินแล้ว)
    };
    
    if (month) {
      query.evaluationMonth = parseInt(month);
    }
    
    if (year) {
      query.evaluationYear = parseInt(year);
    }
    
    if (resetId) {
      query.resetId = parseInt(resetId);
    }
    
    if (canteenName) {
      query.canteenName = { $regex: canteenName, $options: 'i' };
    }
    
    if (status) {
      query.finalStatus = status;
    }
    
    // Get evaluations with shop data
    const evaluations = await Evaluation.find(query)
      .populate('shopId', 'customId name canteenId type')
      .sort({ evaluationYear: -1, evaluationMonth: -1, resetId: -1, evaluationRound: -1, createdAt: -1 });
    
    // Transform data to include proper shop information
    const transformedEvaluations = evaluations.map(evaluation => {
      const shop = evaluation.shopId;
      return {
        _id: evaluation._id,
        customId: shop?.customId || shop?._id,
        shopName: shop?.name || '-',
        canteenName: getCanteenName(shop?.canteenId) || '-',
        type: shop?.type || '-',
        revenue: evaluation.revenue || 0,
        totalScore: evaluation.totalScore || 0,
        finalStatus: evaluation.finalStatus || 'รอดำเนินการ',
        evaluationMonth: evaluation.evaluationMonth,
        evaluationYear: evaluation.evaluationYear,
        evaluationRound: evaluation.evaluationRound || 1,
        resetId: evaluation.resetId || 1,
        updatedAt: evaluation.updatedAt
      };
    });
    
    res.json({
      success: true,
      data: transformedEvaluations
    });
  } catch (error) {
    console.error('Error fetching evaluation history:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
});

// Get available evaluation rounds for a shop in specific month/year
router.get('/shop/:shopId/rounds', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { month, year } = req.query;
    
    console.log('Getting rounds for shop:', { shopId, month, year });
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุเดือนและปี'
      });
    }
    
    const evaluations = await Evaluation.find({
      shopId,
      evaluationMonth: parseInt(month),
      evaluationYear: parseInt(year),
      isActive: true,
      evaluationSent: true
    }).sort({ evaluationRound: 1 });
    
    console.log('Found evaluations:', evaluations.length);
    
    const rounds = evaluations.map(evaluation => evaluation.evaluationRound);
    
    res.json({
      success: true,
      rounds: rounds
    });
  } catch (error) {
    console.error('Error fetching evaluation rounds:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get available evaluation rounds by evaluation ID (alternative)
router.get('/:evaluationId/rounds', async (req, res) => {
  try {
    const { evaluationId } = req.params;
    
    console.log('Getting rounds for evaluation:', evaluationId);
    
    const currentEvaluation = await Evaluation.findById(evaluationId);
    
    if (!currentEvaluation) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการประเมิน'
      });
    }
    
    // หาการประเมินทั้งหมดของร้านเดียวกันในเดือนเดียวกัน
    const evaluations = await Evaluation.find({
      shopId: currentEvaluation.shopId,
      evaluationMonth: currentEvaluation.evaluationMonth,
      evaluationYear: currentEvaluation.evaluationYear,
      isActive: true,
      evaluationSent: true
    }).sort({ evaluationRound: 1 });
    
    console.log('Found evaluations for rounds:', evaluations.length);
    
    const rounds = evaluations.map(evaluation => evaluation.evaluationRound);
    
    res.json({
      success: true,
      rounds: rounds
    });
  } catch (error) {
    console.error('Error fetching evaluation rounds by ID:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get evaluation details for specific round
router.get('/details', async (req, res) => {
  try {
    const { shopId, month, year, round } = req.query;
    
    console.log('Evaluation details request:', { shopId, month, year, round });
    
    if (!shopId || !month || !year || !round) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุข้อมูลครบถ้วน'
      });
    }
    
    const query = {
      shopId,
      evaluationMonth: parseInt(month),
      evaluationYear: parseInt(year),
      evaluationRound: parseInt(round),
      isActive: true,
      evaluationSent: true
    };
    
    console.log('Searching with query:', query);
    
    const evaluation = await Evaluation.findOne(query).populate('shopId', 'customId name canteenId type');
    
    console.log('Found evaluation:', evaluation ? evaluation._id : 'none');
    
    if (!evaluation) {
      // ลองหาข้อมูลที่เกี่ยวข้องเพื่อ debug
      const relatedEvaluations = await Evaluation.find({
        shopId,
        evaluationMonth: parseInt(month),
        evaluationYear: parseInt(year),
        isActive: true
      }).select('_id evaluationRound evaluationSent isActive');
      
      console.log('Related evaluations found:', relatedEvaluations);
      
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการประเมิน',
        debug: {
          requestedQuery: query,
          relatedEvaluations: relatedEvaluations
        }
      });
    }
    
    // Transform data และเรียงลำดับ items ตาม order
    const sortedItems = (evaluation.items || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    const transformedEvaluation = {
      _id: evaluation._id,
      shopId: evaluation.shopId,
      customId: evaluation.shopId?.customId,
      shopName: evaluation.shopId?.name,
      canteenName: getCanteenName(evaluation.shopId?.canteenId),
      type: evaluation.shopId?.type,
      revenue: evaluation.revenue || 0,
      items: sortedItems,
      totalScore: evaluation.totalScore || 0,
      finalStatus: evaluation.finalStatus || 'รอดำเนินการ',
      evaluationMonth: evaluation.evaluationMonth,
      evaluationYear: evaluation.evaluationYear,
      evaluationRound: evaluation.evaluationRound,
      evaluatedAt: evaluation.evaluatedAt,
      updatedAt: evaluation.updatedAt
    };
    
    res.json({
      success: true,
      evaluation: transformedEvaluation
    });
  } catch (error) {
    console.error('Error fetching evaluation details:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get evaluation details by evaluation ID (alternative endpoint)
router.get('/details/:evaluationId', async (req, res) => {
  try {
    const { evaluationId } = req.params;
    
    console.log('Getting evaluation details by ID:', evaluationId);
    
    const evaluation = await Evaluation.findById(evaluationId)
      .populate('shopId', 'customId name canteenId type');
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการประเมิน'
      });
    }
    
    // Transform data และเรียงลำดับ items ตาม order
    const sortedItems = (evaluation.items || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    const transformedEvaluation = {
      _id: evaluation._id,
      shopId: evaluation.shopId,
      customId: evaluation.shopId?.customId,
      shopName: evaluation.shopId?.name,
      canteenName: getCanteenName(evaluation.shopId?.canteenId),
      type: evaluation.shopId?.type,
      revenue: evaluation.revenue || 0,
      items: sortedItems,
      totalScore: evaluation.totalScore || 0,
      finalStatus: evaluation.finalStatus || 'รอดำเนินการ',
      evaluationMonth: evaluation.evaluationMonth,
      evaluationYear: evaluation.evaluationYear,
      evaluationRound: evaluation.evaluationRound,
      evaluatedAt: evaluation.evaluatedAt,
      updatedAt: evaluation.updatedAt
    };
    
    res.json({
      success: true,
      evaluation: transformedEvaluation
    });
  } catch (error) {
    console.error('Error fetching evaluation details by ID:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get evaluation details by evaluation ID and round
router.get('/details/:evaluationId/round/:round', async (req, res) => {
  try {
    const { evaluationId, round } = req.params;
    
    console.log('Getting evaluation details by ID and round:', { evaluationId, round });
    
    const currentEvaluation = await Evaluation.findById(evaluationId);
    
    if (!currentEvaluation) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการประเมิน'
      });
    }
    
    // หาการประเมินตามรอบที่ระบุ
    const evaluation = await Evaluation.findOne({
      shopId: currentEvaluation.shopId,
      evaluationMonth: currentEvaluation.evaluationMonth,
      evaluationYear: currentEvaluation.evaluationYear,
      evaluationRound: parseInt(round),
      isActive: true,
      evaluationSent: true
    }).populate('shopId', 'customId name canteenId type');
    
    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: `ไม่พบข้อมูลการประเมินรอบที่ ${round}`
      });
    }
    
    // Transform data และเรียงลำดับ items ตาม order
    const sortedItems = (evaluation.items || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    
    const transformedEvaluation = {
      _id: evaluation._id,
      shopId: evaluation.shopId,
      customId: evaluation.shopId?.customId,
      shopName: evaluation.shopId?.name,
      canteenName: getCanteenName(evaluation.shopId?.canteenId),
      type: evaluation.shopId?.type,
      revenue: evaluation.revenue || 0,
      items: sortedItems,
      totalScore: evaluation.totalScore || 0,
      finalStatus: evaluation.finalStatus || 'รอดำเนินการ',
      evaluationMonth: evaluation.evaluationMonth,
      evaluationYear: evaluation.evaluationYear,
      evaluationRound: evaluation.evaluationRound,
      evaluatedAt: evaluation.evaluatedAt,
      updatedAt: evaluation.updatedAt
    };
    
    res.json({
      success: true,
      evaluation: transformedEvaluation
    });
  } catch (error) {
    console.error('Error fetching evaluation details by ID and round:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;