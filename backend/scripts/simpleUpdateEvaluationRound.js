import mongoose from 'mongoose';
import Evaluation from '../models/Evaluation.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Simple function to add evaluationRound = 1 to all existing evaluations
const addEvaluationRoundToExisting = async () => {
  try {
    console.log('🔄 Adding evaluationRound = 1 to all existing evaluations...');
    
    // Find all evaluations that don't have evaluationRound field
    const result = await Evaluation.updateMany(
      {
        isActive: true,
        $or: [
          { evaluationRound: { $exists: false } },
          { evaluationRound: null }
        ]
      },
      {
        $set: { evaluationRound: 1 }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} evaluations`);
    console.log(`📊 Matched ${result.matchedCount} evaluations`);
    
    // Verify the update
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
    
    // Show some examples
    console.log('\n📋 Sample updated evaluations:');
    const sampleEvaluations = await Evaluation.find({ isActive: true })
      .populate('shopId', 'name customId')
      .sort({ createdAt: -1 })
      .limit(3);
    
    sampleEvaluations.forEach(evaluation => {
      const shop = evaluation.shopId;
      console.log(`   🏪 ${shop?.name || 'Unknown'} (${shop?.customId || 'N/A'})`);
      console.log(`      📅 ${evaluation.evaluationMonth}/${evaluation.evaluationYear}`);
      console.log(`      🔄 Round: ${evaluation.evaluationRound}`);
      console.log(`      📊 Score: ${evaluation.totalScore}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error updating evaluations:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    await connectDB();
    await addEvaluationRoundToExisting();
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
