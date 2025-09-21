import mongoose from 'mongoose';
import Evaluation from '../models/Evaluation.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canteen-project');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Function to add evaluationRound field to existing evaluations
const addEvaluationRoundField = async () => {
  try {
    console.log('🔄 Adding evaluationRound field to existing evaluations...');
    
    // Find all evaluations that don't have evaluationRound field
    const evaluationsWithoutRound = await Evaluation.find({
      isActive: true,
      $or: [
        { evaluationRound: { $exists: false } },
        { evaluationRound: null }
      ]
    }).sort({ shopId: 1, evaluationYear: 1, evaluationMonth: 1, createdAt: 1 });
    
    console.log(`📊 Found ${evaluationsWithoutRound.length} evaluations without evaluationRound field`);
    
    if (evaluationsWithoutRound.length === 0) {
      console.log('✅ All evaluations already have evaluationRound field');
      return;
    }
    
    // Group by shop, year, month to assign round numbers
    const groupedEvaluations = {};
    
    evaluationsWithoutRound.forEach(evaluation => {
      const key = `${evaluation.shopId}_${evaluation.evaluationYear}_${evaluation.evaluationMonth}`;
      
      if (!groupedEvaluations[key]) {
        groupedEvaluations[key] = [];
      }
      
      groupedEvaluations[key].push(evaluation);
    });
    
    console.log(`📁 Grouped into ${Object.keys(groupedEvaluations).length} groups`);
    
    let updatedCount = 0;
    
    // Process each group
    for (const [key, groupEvaluations] of Object.entries(groupedEvaluations)) {
      const [shopId, year, month] = key.split('_');
      
      console.log(`\n🏪 Processing shop ${shopId} - ${month}/${year}`);
      console.log(`   Found ${groupEvaluations.length} evaluations`);
      
      // Sort by creation date to determine round order
      groupEvaluations.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Update each evaluation with round number
      for (let i = 0; i < groupEvaluations.length; i++) {
        const evaluation = groupEvaluations[i];
        const roundNumber = i + 1;
        
        try {
          await Evaluation.findByIdAndUpdate(
            evaluation._id,
            { evaluationRound: roundNumber },
            { new: true }
          );
          
          console.log(`   ✅ Updated evaluation ${evaluation._id} to round ${roundNumber}`);
          updatedCount++;
        } catch (error) {
          console.error(`   ❌ Failed to update evaluation ${evaluation._id}:`, error.message);
        }
      }
    }
    
    console.log('\n📈 Update Summary:');
    console.log(`   ✅ Successfully updated: ${updatedCount} evaluations`);
    
    // Verify the update
    console.log('\n🔍 Verification:');
    const remainingWithoutRound = await Evaluation.countDocuments({
      isActive: true,
      $or: [
        { evaluationRound: { $exists: false } },
        { evaluationRound: null }
      ]
    });
    
    if (remainingWithoutRound === 0) {
      console.log('✅ All evaluations now have evaluationRound field');
    } else {
      console.log(`⚠️  ${remainingWithoutRound} evaluations still missing evaluationRound`);
    }
    
    // Show statistics
    const totalEvaluations = await Evaluation.countDocuments({ isActive: true });
    const evaluationsWithRound = await Evaluation.countDocuments({
      isActive: true,
      evaluationRound: { $exists: true, $ne: null }
    });
    
    console.log('\n📊 Final Statistics:');
    console.log(`   📋 Total active evaluations: ${totalEvaluations}`);
    console.log(`   ✅ Evaluations with evaluationRound: ${evaluationsWithRound}`);
    console.log(`   ❌ Evaluations without evaluationRound: ${totalEvaluations - evaluationsWithRound}`);
    
  } catch (error) {
    console.error('❌ Error adding evaluationRound field:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await addEvaluationRoundField();
    console.log('\n🎉 Script completed successfully!');
  } catch (error) {
    console.error('💥 Script failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
main();
