import mongoose from 'mongoose';
import Evaluation from '../models/Evaluation.js';
import ResetControl from '../models/ResetControl.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const migrateResetId = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canteen-project');
    console.log('Connected to MongoDB');

    // Initialize ResetControl if it doesn't exist
    let resetControl = await ResetControl.findOne();
    if (!resetControl) {
      resetControl = new ResetControl({
        currentResetId: 1,
        lastResetDate: new Date()
      });
      await resetControl.save();
      console.log('Created initial ResetControl with resetId: 1');
    }

    // Update all existing evaluations to have resetId = 1
    const updateResult = await Evaluation.updateMany(
      { resetId: { $exists: false } },
      { $set: { resetId: 1 } }
    );

    console.log(`Updated ${updateResult.modifiedCount} evaluations with resetId: 1`);

    // Verify the migration
    const totalEvaluations = await Evaluation.countDocuments();
    const evaluationsWithResetId = await Evaluation.countDocuments({ resetId: { $exists: true } });
    
    console.log(`Total evaluations: ${totalEvaluations}`);
    console.log(`Evaluations with resetId: ${evaluationsWithResetId}`);
    
    if (totalEvaluations === evaluationsWithResetId) {
      console.log('✅ Migration completed successfully!');
    } else {
      console.log('❌ Migration incomplete. Some evaluations still missing resetId.');
    }

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run migration
migrateResetId();

