import express from 'express';
import EvaluationItem from '../models/EvaluationItem.js';
import Evaluation from '../models/Evaluation.js';
import EvaluationControl from '../models/EvaluationControl.js';
import Shop from '../models/Shop.js';
import { checkNewTopics, resetCurrentMonthEvaluations } from '../controllers/evaluationController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { createRankingEvaluationNotification } from '../controllers/notificationController.js';

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

// Check for new evaluation topics
router.get('/check-new-topics', checkNewTopics);

// Reset evaluations for current month only
router.post('/reset-current-month', resetCurrentMonthEvaluations);

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
    const { title, order } = req.body;
    const newItem = new EvaluationItem({
      title,
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
    const { shopId, items, totalScore, finalStatus, evaluatedAt } = req.body;
    console.log('Received evaluation data:', { shopId, items, totalScore, finalStatus, evaluatedAt });
    
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

    // ตรวจสอบว่าประเมินซ้ำในเดือนเดียวกันหรือไม่
    const existingEvaluation = await Evaluation.findOne({
      shopId,
      evaluationMonth: currentMonth,
      evaluationYear: currentYear
    });

    if (existingEvaluation) {
      return res.status(400).json({ 
        message: `ร้านค้านี้ได้รับการประเมินแล้วในเดือน ${currentMonth}/${currentYear}` 
      });
    }

    // ดึงข้อมูลร้านค้า
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }

    // สร้างการประเมินใหม่
    const evaluation = new Evaluation({
      shopId,
      shopName: shop.name,
      canteenName: `โรงอาหาร ${shop.canteenId}`,
      revenue: shop.revenue || 0,
      items,
      totalScore,
      finalStatus,
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      evaluatedAt: evaluatedAt || new Date()
    });
    
    const savedEvaluation = await evaluation.save();
    console.log('Saved evaluation:', savedEvaluation);
    
    // สร้าง notification เมื่อ admin ประเมิน ranking
    try {
      const evaluatorName = req.user?.name || req.user?.username || 'Admin';
      await createRankingEvaluationNotification(savedEvaluation, evaluatorName);
      console.log(`📊 Ranking evaluation notification sent for shop ${savedEvaluation.shopName}`);
    } catch (notificationError) {
      console.error('Error creating ranking evaluation notification:', notificationError);
      // ไม่ส่ง error กลับไปเพราะการประเมินสำเร็จแล้ว
    }
    
    res.status(201).json(savedEvaluation);
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

    const evaluation = await Evaluation.findOne({
      shopId,
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      isActive: true
    });

    res.json(evaluation);
  } catch (error) {
    console.error('Error fetching current evaluation:', error);
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
      console.log(`📊 Ranking evaluation update notification sent for shop ${updatedEvaluation.shopName}`);
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
    // อัปเดตคะแนนของร้านค้าทั้งหมดให้เป็น 100
    await Shop.updateMany({}, { score: 100, evaluationStatus: 'ไม่ผ่าน' });
    
    // ลบการประเมินเก่าทั้งหมด
    await Evaluation.updateMany({}, { isActive: false });
    
    res.json({ message: 'Reset scores successfully' });
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

export default router; 