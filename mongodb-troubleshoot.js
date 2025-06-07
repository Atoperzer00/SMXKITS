// MongoDB Atlas Connection Troubleshooting
const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 MongoDB Atlas Connection Troubleshooting');
console.log('='.repeat(50));

const mongoURI = process.env.MONGO_URI;
console.log('Connection String:', mongoURI ? 'Found' : 'Missing');

if (!mongoURI) {
  console.log('❌ MONGO_URI not found in environment variables');
  process.exit(1);
}

// Test different connection options
const connectionOptions = [
  {
    name: 'Standard Options',
    options: { useNewUrlParser: true, useUnifiedTopology: true }
  },
  {
    name: 'IPv4 Only',
    options: { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      family: 4
    }
  },
  {
    name: 'With Extended Timeouts',
    options: { 
      useNewUrlParser: true, 
      useUnifiedTopology: true,
      family: 4,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000
    }
  }
];

async function testConnection(name, options) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log('-'.repeat(30));
  
  try {
    await mongoose.connect(mongoURI, options);
    console.log('✅ SUCCESS! Connection established');
    console.log('Database:', mongoose.connection.name);
    console.log('Ready State:', mongoose.connection.readyState);
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.log('❌ FAILED:', err.message);
    if (err.code) console.log('Error Code:', err.code);
    if (err.reason) console.log('Reason:', err.reason);
    return false;
  }
}

async function runTests() {
  for (const test of connectionOptions) {
    const success = await testConnection(test.name, test.options);
    if (success) {
      console.log('\n🎉 Found working configuration!');
      console.log('Use these options in your server.js:');
      console.log(JSON.stringify(test.options, null, 2));
      break;
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📋 Troubleshooting Checklist:');
  console.log('1. ✅ Check MongoDB Atlas Network Access');
  console.log('   - Go to Network Access in Atlas dashboard');
  console.log('   - Add your current IP address or 0.0.0.0/0 for all IPs');
  console.log('2. ✅ Verify Database User Permissions');
  console.log('   - Ensure user has read/write access to the database');
  console.log('3. ✅ Check Connection String');
  console.log('   - Verify username, password, and cluster name');
  console.log('4. ✅ Try Different Network');
  console.log('   - Some corporate/school networks block MongoDB Atlas');
}

runTests().catch(console.error);