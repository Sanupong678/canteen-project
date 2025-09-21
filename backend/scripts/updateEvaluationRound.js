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

// Function to update evaluation rounds
const updateEvaluationRounds = async () => {
  try {
    console.log('🔄 Starting evaluation round update...');
    
    // Get all evaluations grouped by shop, month, and year
    const evaluations = await Evaluation.find({ isActive: true })
      .sort({ shopId: 1, evaluationYear: 1, evaluationMonth: 1, createdAt: 1 });
    
    console.log(`📊 Found ${evaluations.length} evaluations to process`);
    
    // Group evaluations by shop, month, and year
    const groupedEvaluations = {};
    
    evaluations.forEach(evaluation => {
      const key = `${evaluation.shopId}_${evaluation.evaluationYear}_${evaluation.evaluationMonth}`;
      
      if (!groupedEvaluations[key]) {
        groupedEvaluations[key] = [];
      }
      
      groupedEvaluations[key].push(evaluation);
    });
    
    console.log(`📁 Grouped into ${Object.keys(groupedEvaluations).length} groups`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each group
    for (const [key, groupEvaluations] of Object.entries(groupedEvaluations)) {
      console.log(`\n🏪 Processing group: ${key}`);
      console.log(`   Found ${groupEvaluations.length} evaluations`);
      
      // Sort by creation date to determine round order
      groupEvaluations.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Update each evaluation with round number
      for (let i = 0; i < groupEvaluations.length; i++) {
        const evaluation = groupEvaluations[i];
        const roundNumber = i + 1;
        
        // Check if evaluationRound already exists
        if (evaluation.evaluationRound && evaluation.evaluationRound > 0) {
          console.log(`   ⏭️  Skipping ${evaluation._id} - already has round ${evaluation.evaluationRound}`);
          skippedCount++;
          continue;
        }
        
        // Update the evaluation
        await Evaluation.findByIdAndUpdate(
          evaluation._id,
          { evaluationRound: roundNumber },
          { new: true }
        );
        
        console.log(`   ✅ Updated ${evaluation._id} to round ${roundNumber}`);
        updatedCount++;
      }
    }
    
    console.log('\n📈 Update Summary:');
    console.log(`   ✅ Updated: ${updatedCount} evaluations`);
    console.log(`   ⏭️  Skipped: ${skippedCount} evaluations`);
    console.log(`   📊 Total processed: ${updatedCount + skippedCount} evaluations`);
    
    // Verify the update
    console.log('\n🔍 Verification:');
    const evaluationsWithoutRound = await Evaluation.countDocuments({
      isActive: true,
      $or: [
        { evaluationRound: { $exists: false } },
        { evaluationRound: null },
        { evaluationRound: 0 }
      ]
    });
    
    if (evaluationsWithoutRound === 0) {
      console.log('✅ All evaluations now have evaluationRound field');
    } else {
      console.log(`⚠️  ${evaluationsWithoutRound} evaluations still missing evaluationRound`);
    }
    
    // Show some examples
    console.log('\n📋 Sample updated evaluations:');
    const sampleEvaluations = await Evaluation.find({ isActive: true })
      .populate('shopId', 'name customId')
      .sort({ createdAt: -1 })
      .limit(5);
    
    sampleEvaluations.forEach(evaluation => {
      const shop = evaluation.shopId;
      console.log(`   🏪 ${shop?.name || 'Unknown'} (${shop?.customId || 'N/A'})`);
      console.log(`      📅 ${evaluation.evaluationMonth}/${evaluation.evaluationYear}`);
      console.log(`      🔄 Round: ${evaluation.evaluationRound}`);
      console.log(`      📊 Score: ${evaluation.totalScore}`);
      console.log(`      📝 Status: ${evaluation.finalStatus}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error updating evaluation rounds:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await updateEvaluationRounds();
    console.log('\n🎉 Update completed successfully!');
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
