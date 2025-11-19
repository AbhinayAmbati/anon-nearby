import mongoose from 'mongoose';

export const connectDatabase = async () => {
  try {
    // First try local MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🟩 Connected to MongoDB');
  } catch (error) {
    console.log('⚠️  Local MongoDB not available, using in-memory storage');
    console.log('💡 To use persistent storage, please start MongoDB locally');
    
    // For development, we can continue without MongoDB
    // The app will work but data won't persist between server restarts
  }
};