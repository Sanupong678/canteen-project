import mongoose from 'mongoose';
import Evaluation from './models/Evaluation.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // ตรวจสอบ index ที่มีอยู่
    const indexes = await Evaluation.collection.getIndexes();
    console.log('Current indexes:');
    console.log(JSON.stringify(indexes, null, 2));
    
    // ตรวจสอบข้อมูลที่มีอยู่
    const existingData = await Evaluation.find({
      shopId: '68cfc9be80cec5302b2f7cff',
      evaluationMonth: 9,
      evaluationYear: 2025
    });
    console.log('Existing data for shop 68cfc9be80cec5302b2f7cff, month 9, year 2025:');
    console.log(JSON.stringify(existingData, null, 2));
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
