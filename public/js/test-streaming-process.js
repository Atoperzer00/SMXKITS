const io = require('socket.io-client');

console.log('🧪 Testing Streaming Process...\n');

// Test configuration
const SERVER_URL = 'http://localhost:5000';
const TEST_CLASS_ID = 'test123';

let instructorSocket = null;
let studentSocket = null;

// Test results
let testResults = {
  instructorConnect: false,
  studentConnect: false,
  instructorJoin: false,
  studentJoin: false,
  streamInit: false,
  streamPlay: false,
  streamPause: false,
  viewerCount: false
};

function log(message) {
  console.log(`${new Date().toLocaleTimeString()}: ${message}`);
}

function runTest() {
  return new Promise((resolve) => {
    let completedTests = 0;
    const totalTests = Object.keys(testResults).length;

    function checkCompletion() {
      completedTests++;
      if (completedTests >= totalTests) {
        setTimeout(() => {
          printResults();
          cleanup();
          resolve();
        }, 1000);
      }
    }

    // Test 1: Instructor Connection
    log('1️⃣ Testing instructor connection...');
    instructorSocket = io(SERVER_URL);
    
    instructorSocket.on('connect', () => {
      log('✅ Instructor connected: ' + instructorSocket.id);
      testResults.instructorConnect = true;
      
      // Test 3: Instructor Join Class
      log('3️⃣ Testing instructor join class...');
      instructorSocket.emit('instructor-join-class', { classId: TEST_CLASS_ID });
    });

    instructorSocket.on('stream:instructor-ready', (data) => {
      log('✅ Instructor ready received: ' + JSON.stringify(data));
      testResults.instructorJoin = true;
      checkCompletion();

      // Test 5: Stream Initialization
      setTimeout(() => {
        log('5️⃣ Testing stream initialization...');
        instructorSocket.emit('stream:init', {
          classId: TEST_CLASS_ID,
          streamUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
          filename: 'test_video.mp4',
          startTime: new Date().toISOString(),
          currentTime: 0,
          playing: false
        });
      }, 500);
    });

    instructorSocket.on('viewerCount', (data) => {
      log('👥 Instructor received viewer count: ' + data.count);
      testResults.viewerCount = true;
      checkCompletion();
    });

    // Test 2: Student Connection
    setTimeout(() => {
      log('2️⃣ Testing student connection...');
      studentSocket = io(SERVER_URL);
      
      studentSocket.on('connect', () => {
        log('✅ Student connected: ' + studentSocket.id);
        testResults.studentConnect = true;
        
        // Test 4: Student Join Class
        log('4️⃣ Testing student join class...');
        studentSocket.emit('student-join-class', { classId: TEST_CLASS_ID });
      });

      studentSocket.on('stream:student-ready', (data) => {
        log('✅ Student ready received: ' + JSON.stringify(data));
        testResults.studentJoin = true;
        checkCompletion();
      });

      studentSocket.on('stream:init', (data) => {
        log('✅ Student received stream init: ' + JSON.stringify(data));
        testResults.streamInit = true;
        checkCompletion();

        // Test 6: Stream Play
        setTimeout(() => {
          log('6️⃣ Testing stream play...');
          instructorSocket.emit('stream:play', {
            classId: TEST_CLASS_ID,
            time: 0,
            timestamp: new Date().toISOString()
          });
        }, 500);
      });

      studentSocket.on('stream:play', (data) => {
        log('✅ Student received stream play: ' + JSON.stringify(data));
        testResults.streamPlay = true;
        checkCompletion();

        // Test 7: Stream Pause
        setTimeout(() => {
          log('7️⃣ Testing stream pause...');
          instructorSocket.emit('stream:pause', {
            classId: TEST_CLASS_ID,
            time: 5,
            timestamp: new Date().toISOString()
          });
        }, 500);
      });

      studentSocket.on('stream:pause', (data) => {
        log('✅ Student received stream pause: ' + JSON.stringify(data));
        testResults.streamPause = true;
        checkCompletion();
      });

      studentSocket.on('stream:current-state', (data) => {
        log('📥 Student received current state: ' + JSON.stringify(data));
      });

      studentSocket.on('stream:no-state', (data) => {
        log('📭 Student received no state message');
      });

    }, 1000);

    // Timeout after 10 seconds
    setTimeout(() => {
      log('⏰ Test timeout reached');
      printResults();
      cleanup();
      resolve();
    }, 10000);
  });
}

function printResults() {
  console.log('\n📊 TEST RESULTS:');
  console.log('================');
  
  Object.entries(testResults).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });

  const passedTests = Object.values(testResults).filter(Boolean).length;
  const totalTests = Object.keys(testResults).length;
  
  console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! Streaming system is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the server logs for issues.');
  }
}

function cleanup() {
  if (instructorSocket) {
    instructorSocket.disconnect();
  }
  if (studentSocket) {
    studentSocket.disconnect();
  }
}

// Run the test
runTest().then(() => {
  process.exit(0);
});