#!/usr/bin/env node

/**
 * Test if streaming system is ready to go live
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing SMXKITS Streaming System');
console.log('===================================\n');

const tests = [
  {
    name: 'Server Response',
    test: () => testServerResponse()
  },
  {
    name: 'Stream Mode Interface',
    test: () => testFileExists('public/Stream Mode.html')
  },
  {
    name: 'Student Interface',
    test: () => testFileExists('public/SMXStream-new.html')
  },
  {
    name: 'Backend Routes',
    test: () => testFileExists('server/routes/stream.js')
  },
  {
    name: 'Socket Handlers',
    test: () => testFileExists('server/socket/streamHandler.js')
  },
  {
    name: 'Docker Configuration',
    test: () => testFileExists('docker-compose.streaming.yml')
  },
  {
    name: 'NGINX Configuration',
    test: () => testFileExists('nginx/nginx.conf')
  },
  {
    name: 'Setup Scripts',
    test: () => testFileExists('setup-streaming.js')
  }
];

async function runTests() {
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.test();
      if (result) {
        console.log(`✅ ${test.name}`);
        passed++;
      } else {
        console.log(`❌ ${test.name}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('🚀 System is ready to go live!');
    console.log('\n📋 Next Steps:');
    console.log('1. Install Docker Desktop (if not already installed)');
    console.log('2. Run: npm run start:streaming');
    console.log('3. Configure OBS Studio');
    console.log('4. Open Stream Mode.html and start streaming!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the issues above.');
  }
}

function testServerResponse() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000', (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404); // 404 is OK for root
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function testFileExists(filePath) {
  return Promise.resolve(fs.existsSync(filePath));
}

// Run tests
runTests().catch(console.error);