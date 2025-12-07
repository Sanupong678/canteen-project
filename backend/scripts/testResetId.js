import mongoose from 'mongoose';
import Evaluation from '../models/Evaluation.js';
import ResetControl from '../models/ResetControl.js';
import Shop from '../models/shopModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testResetIdFunctionality = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canteen-project');
    console.log('Connected to MongoDB');

    // Test 1: Check ResetControl
    console.log('\n=== Test 1: ResetControl ===');
    const resetControl = await ResetControl.findOne();
    if (resetControl) {
      console.log(`Current resetId: ${resetControl.currentResetId}`);
      console.log(`Last reset date: ${resetControl.lastResetDate}`);
    } else {
      console.log('No ResetControl found');
    }

    // Test 2: Check evaluations with resetId
    console.log('\n=== Test 2: Evaluations with resetId ===');
    const evaluationsWithResetId = await Evaluation.countDocuments({ resetId: { $exists: true } });
    const totalEvaluations = await Evaluation.countDocuments();
    console.log(`Total evaluations: ${totalEvaluations}`);
    console.log(`Evaluations with resetId: ${evaluationsWithResetId}`);

    // Test 3: Check resetId distribution
    console.log('\n=== Test 3: ResetId Distribution ===');
    const resetIdStats = await Evaluation.aggregate([
      { $group: { _id: '$resetId', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    resetIdStats.forEach(stat => {
      console.log(`ResetId ${stat._id}: ${stat.count} evaluations`);
    });

    // Test 4: Check status distribution
    console.log('\n=== Test 4: Status Distribution ===');
    const statusStats = await Evaluation.aggregate([
      { $group: { _id: '$finalStatus', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    statusStats.forEach(stat => {
      console.log(`Status '${stat._id}': ${stat.count} evaluations`);
    });

    // Test 5: Check shops with evaluations
    console.log('\n=== Test 5: Shops with Evaluations ===');
    const shopsWithEvaluations = await Evaluation.distinct('shopId');
    console.log(`Shops with evaluations: ${shopsWithEvaluations.length}`);

    // Test 6: Sample evaluation data
    console.log('\n=== Test 6: Sample Evaluation Data ===');
    const sampleEvaluation = await Evaluation.findOne().populate('shopId', 'name customId');
    if (sampleEvaluation) {
      console.log('Sample evaluation:');
      console.log(`- Shop: ${sampleEvaluation.shopId?.name} (${sampleEvaluation.shopId?.customId})`);
      console.log(`- ResetId: ${sampleEvaluation.resetId}`);
      console.log(`- Round: ${sampleEvaluation.evaluationRound}`);
      console.log(`- Status: ${sampleEvaluation.finalStatus}`);
      console.log(`- Score: ${sampleEvaluation.totalScore}`);
      console.log(`- Month/Year: ${sampleEvaluation.evaluationMonth}/${sampleEvaluation.evaluationYear}`);
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run tests
testResetIdFunctionality();

