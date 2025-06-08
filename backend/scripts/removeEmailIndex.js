import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const removeEmailIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the users collection
    const usersCollection = mongoose.connection.collection('users');

    // Drop the email index
    await usersCollection.dropIndex('email_1');
    console.log('Successfully dropped email index');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

removeEmailIndex(); 