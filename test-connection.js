// MongoDB Connection Test Script - SSL Error Fix
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔧 Testing MongoDB connection with SSL fix...');
    console.log('MONGO_URI exists:', !!process.env.MONGO_URI);
    
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.log('❌ MONGO_URI not found in environment variables');
      process.exit(1);
    }

    console.log('Attempting to connect to MongoDB Atlas with fixed SSL settings...');

    // Use the same fixed configuration as server.js
    await mongoose.connect(mongoURI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Shorter timeout for testing
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      w: 'majority'
      // Removed problematic SSL settings
    });

    console.log('✅ MongoDB Atlas connection successful!');
    console.log('✅ Database connected:', mongoose.connection.name);
    console.log('✅ Connection state:', mongoose.connection.readyState);
    console.log('✅ Host:', mongoose.connection.host);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('✅ Available collections:', collections.map(c => c.name));
    
    console.log('🎉 SSL error should be fixed! You can now edit files without errors.');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n💡 If you still get SSL errors:');
      console.log('1. Check MongoDB Atlas cluster status');
      console.log('2. Verify IP whitelist includes your IP (or use 0.0.0.0/0)');
      console.log('3. Try restarting your MongoDB Atlas cluster');
    }
    
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection test completed');
    process.exit(0);
  }
}

testConnection();