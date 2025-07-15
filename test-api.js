// Simple API test script
const http = require('http');

function testAPI(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing SMX KITS Backend API...\n');

  try {
    // Test 1: Check if backend is responding
    console.log('1. Testing backend health...');
    const healthTest = await testAPI('/api/auth/verify');
    console.log(`   Status: ${healthTest.status} (Expected: 401 - No token provided)`);
    
    // Test 2: Test login endpoint
    console.log('\n2. Testing login endpoint...');
    const loginTest = await testAPI('/api/auth/login', 'POST', {
      username: 'admin',
      password: 'admin123'
    });
    console.log(`   Status: ${loginTest.status} (Expected: 200 - Login successful)`);
    
    if (loginTest.status === 200) {
      const loginData = JSON.parse(loginTest.data);
      console.log(`   ✅ Login successful for user: ${loginData.user?.username}`);
    }

    // Test 3: Test video list endpoint
    console.log('\n3. Testing video list endpoint...');
    const videoTest = await testAPI('/api/stream/videos/demo-class');
    console.log(`   Status: ${videoTest.status} (Expected: 200)`);

    console.log('\n✅ API tests completed successfully!');
    console.log('\n🌐 Frontend available at: http://localhost:5174');
    console.log('🔧 Backend API available at: http://localhost:3001');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();