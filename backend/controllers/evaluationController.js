import Evaluation from '../models/Evaluation.js';
import EvaluationItem from '../models/EvaluationItem.js';
import Shop from '../models/Shop.js';

// Check for new evaluation topics and update existing evaluations
export const checkNewTopics = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get all current evaluation items
    const currentItems = await EvaluationItem.find({ isActive: true }).sort({ order: 1 });
    const currentItemIds = currentItems.map(item => item._id.toString());

    // Get all shops
    const shops = await Shop.find({ isActive: true });

    let updatedCount = 0;
    let newEvaluationCount = 0;

    for (const shop of shops) {
      // Check if shop has evaluation for current month
      let evaluation = await Evaluation.findOne({
        shopId: shop._id,
        evaluationMonth: currentMonth,
        evaluationYear: currentYear,
        isActive: true
      });

      if (!evaluation) {
        // Create new evaluation for current month using upsert
        const evaluationData = {
          shopId: shop._id,
          shopName: shop.name,
          canteenName: `โรงอาหาร ${shop.canteenId}`,
          revenue: shop.revenue || 0,
          items: currentItems.map(item => ({
            id: item._id,
            title: item.title,
            description: item.description || '',
            maxScore: item.maxScore,
            order: item.order || 0,
            status: ''
          })),
          totalScore: 100,
          finalStatus: 'ไม่ผ่าน',
          evaluationMonth: currentMonth,
          evaluationYear: currentYear,
          evaluatedAt: new Date(),
          isActive: true
        };
        
        // หา evaluation ที่มีอยู่แล้ว
        let existingEvaluation = await Evaluation.findOne({
          shopId: shop._id,
          evaluationMonth: currentMonth,
          evaluationYear: currentYear
        });
        
        if (existingEvaluation) {
          // อัปเดตข้อมูลที่มีอยู่แล้ว
          existingEvaluation.items = evaluationData.items;
          existingEvaluation.totalScore = evaluationData.totalScore;
          existingEvaluation.finalStatus = evaluationData.finalStatus;
          existingEvaluation.updatedAt = new Date();
          evaluation = await existingEvaluation.save();
        } else {
          // สร้างใหม่
          evaluation = new Evaluation(evaluationData);
          evaluation = await evaluation.save();
        }
        newEvaluationCount++;
      } else {
        // Check if evaluation has all current items
        const evaluationItemIds = evaluation.items.map(item => item.id.toString());
        const missingItems = currentItems.filter(item => 
          !evaluationItemIds.includes(item._id.toString())
        );

        if (missingItems.length > 0) {
          // Add missing items to existing evaluation
          for (const item of missingItems) {
            evaluation.items.push({
              id: item._id,
              title: item.title,
              status: ''
            });
          }
          evaluation.updatedAt = new Date();
          await evaluation.save();
          updatedCount++;
        }
      }
    }

    res.json({
      message: 'New topics check completed',
      updatedEvaluations: updatedCount,
      newEvaluations: newEvaluationCount,
      currentMonth,
      currentYear,
      totalItems: currentItems.length
    });
  } catch (error) {
    console.error('Error checking new topics:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reset evaluations for current month only
export const resetCurrentMonthEvaluations = async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get all current evaluation items
    const currentItems = await EvaluationItem.find({ isActive: true }).sort({ order: 1 });

    // Find all evaluations for current month
    const currentEvaluations = await Evaluation.find({
      evaluationMonth: currentMonth,
      evaluationYear: currentYear,
      isActive: true
    });

    let resetCount = 0;

    for (const evaluation of currentEvaluations) {
      // Reset items to match current evaluation items
      evaluation.items = currentItems.map(item => ({
        id: item._id,
        title: item.title,
        status: ''
      }));
      
      // Reset scores
      evaluation.totalScore = 100;
      evaluation.finalStatus = 'ไม่ผ่าน';
      evaluation.updatedAt = new Date();
      
      await evaluation.save();
      resetCount++;
    }

    res.json({
      message: 'Current month evaluations reset successfully',
      resetCount,
      currentMonth,
      currentYear,
      totalItems: currentItems.length
    });
  } catch (error) {
    console.error('Error resetting current month evaluations:', error);
    res.status(500).json({ message: error.message });
  }
}; 