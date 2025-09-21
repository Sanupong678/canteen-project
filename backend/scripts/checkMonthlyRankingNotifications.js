import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {
  checkAndCreateMonthlyRankingNotification
} from '../controllers/monthlyRankingNotificationController.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Starting Monthly Ranking Notification Check...');
    
    // Connect to database
    await connectDB();
    
    // Create mock request and response objects
    const mockReq = {
      user: { id: 'system', role: 'admin' }
    };
    
    const mockRes = {
      json: (data) => {
        console.log('📊 Results:', JSON.stringify(data, null, 2));
      },
      status: (code) => ({
        json: (data) => {
          console.error(`❌ Error ${code}:`, JSON.stringify(data, null, 2));
        }
      })
    };
    
    // Run the check
    await checkAndCreateMonthlyRankingNotification(mockReq, mockRes);
    
    console.log('✅ Monthly Ranking Notification Check completed');
    
  } catch (error) {
    console.error('❌ Error in main function:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the script
main();
