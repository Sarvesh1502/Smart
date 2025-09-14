const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-classroom');
    console.log('Connected to MongoDB');

    // Drop the problematic index
    try {
      await mongoose.connection.db.collection('users').dropIndex('phone_1');
      console.log('✅ Dropped phone_1 index');
    } catch (error) {
      console.log('ℹ️  phone_1 index not found or already dropped');
    }

    // Create a new sparse index for phone
    try {
      await mongoose.connection.db.collection('users').createIndex({ 'profile.phone': 1 }, { sparse: true });
      console.log('✅ Created sparse index for profile.phone');
    } catch (error) {
      console.log('ℹ️  Index already exists or error:', error.message);
    }

    // Drop and recreate the collection to ensure clean state
    try {
      await mongoose.connection.db.collection('users').drop();
      console.log('✅ Dropped users collection');
    } catch (error) {
      console.log('ℹ️  Users collection not found or error:', error.message);
    }

    console.log('✅ Database fix completed');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixDatabase();
