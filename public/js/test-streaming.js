#!/usr/bin/env node

/**
 * Streaming System Test Script
 * 
 * This script tests the streaming functionality by simulating:
 * 1. Instructor uploading a video
 * 2. Instructor going live
 * 3. Student joining the stream
 * 4. Stream synchronization
 */

const io = require('socket.io-client');
const fetch = require('node-fetch');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_CLASS_ID = '507f1f77bcf86cd799439011'; // Replace with actual class ID
const INSTRUCTOR_TOKEN = 'your-instructor-token'; // Replace with actual token
const STUDENT_TOKEN = 'your-student-token'; // Replace with actual token

console.log('🧪 Starting Streaming System Test...\n');

// Test 1: Instructor Socket Connection
function testInstructorConnection() {
  return new Promise((resolve, reject) => {
    console.log('📡 Testing instructor socket connection...');
    
    const instructorSocket = io(SERVER_URL);
    
    instructorSocket.on('connect', () => {
      console.log('✅ Instructor connected with ID:', instructorSocket.id);
      
      // Join class as instructor
      instructorSocket.emit('instructor-join-class', {
        classId: TEST_CLASS_ID,
        mode: 'file'
      });
      
      instructorSocket.on('stream:instructor-ready', (data) => {
        console.log('✅ Instructor ready for streaming:', data.message);
        instructorSocket.disconnect();
        resolve();
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        instructorSocket.disconnect();
        reject(new Error('Instructor connection timeout'));
      }, 5000);
    });
    
    instructorSocket.on('connect_error', (error) => {
      console.error('❌ Instructor connection failed:', error);
      reject(error);
    });
  });
}

// Test 2: Student Socket Connection
function testStudentConnection() {
  return new Promise((resolve, reject) => {
    console.log('📡 Testing student socket connection...');
    
    const studentSocket = io(SERVER_URL);
    
    studentSocket.on('connect', () => {
      console.log('✅ Student connected with ID:', studentSocket.id);
      
      // Join class as student
      studentSocket.emit('student-join-class', {
        classId: TEST_CLASS_ID
      });
      
      studentSocket.on('stream:no-state', (data) => {
        console.log('✅ Student received no-state (expected when no stream active)');
        studentSocket.disconnect();
        resolve();
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        studentSocket.disconnect();
        reject(new Error('Student connection timeout'));
      }, 5000);
    });
    
    studentSocket.on('connect_error', (error) => {
      console.error('❌ Student connection failed:', error);
      reject(error);
    });
  });
}

// Test 3: Stream Status API
async function testStreamStatusAPI() {
  console.log('🔍 Testing stream status API...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/stream/status/${TEST_CLASS_ID}`, {
      headers: {
        'Authorization': `Bearer ${STUDENT_TOKEN}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Stream status API working:', data.status);
    } else {
      console.log('⚠️ Stream status API returned:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Stream status API failed:', error.message);
  }
}

// Test 4: Full Streaming Flow
function testFullStreamingFlow() {
  return new Promise((resolve, reject) => {
    console.log('🎬 Testing full streaming flow...');
    
    const instructorSocket = io(SERVER_URL);
    const studentSocket = io(SERVER_URL);
    
    let instructorReady = false;
    let studentReady = false;
    let streamReceived = false;
    
    // Instructor setup
    instructorSocket.on('connect', () => {
      console.log('👨‍🏫 Instructor connected');
      instructorSocket.emit('instructor-join-class', {
        classId: TEST_CLASS_ID,
        mode: 'file'
      });
      instructorReady = true;
      checkAndStartStream();
    });
    
    // Student setup
    studentSocket.on('connect', () => {
      console.log('👤 Student connected');
      studentSocket.emit('student-join-class', {
        classId: TEST_CLASS_ID
      });
      studentReady = true;
      checkAndStartStream();
    });
    
    // Student listens for stream
    studentSocket.on('stream:init', (data) => {
      console.log('✅ Student received stream init:', data.streamUrl ? 'with URL' : 'without URL');
      streamReceived = true;
      cleanup();
      resolve();
    });
    
    studentSocket.on('streamStatus', (data) => {
      console.log('✅ Student received stream status:', data.status);
      if (data.status === 'live' && data.streamUrl) {
        streamReceived = true;
        cleanup();
        resolve();
      }
    });
    
    function checkAndStartStream() {
      if (instructorReady && studentReady) {
        console.log('🚀 Both connected, simulating stream start...');
        
        // Simulate instructor starting stream
        setTimeout(() => {
          instructorSocket.emit('stream:init', {
            streamUrl: 'http://localhost:3000/api/stream/video/test-video.mp4',
            startTime: new Date().toISOString(),
            currentTime: 0,
            playing: true
          });
        }, 1000);
      }
    }
    
    function cleanup() {
      instructorSocket.disconnect();
      studentSocket.disconnect();
    }
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!streamReceived) {
        cleanup();
        reject(new Error('Stream flow test timeout'));
      }
    }, 10000);
  });
}

// Run all tests
async function runTests() {
  const tests = [
    { name: 'Instructor Connection', fn: testInstructorConnection },
    { name: 'Student Connection', fn: testStudentConnection },
    { name: 'Stream Status API', fn: testStreamStatusAPI },
    { name: 'Full Streaming Flow', fn: testFullStreamingFlow }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n🧪 Running test: ${test.name}`);
      await test.fn();
      console.log(`✅ ${test.name} - PASSED`);
      passed++;
    } catch (error) {
      console.error(`❌ ${test.name} - FAILED:`, error.message);
      failed++;
    }
  }
  
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Streaming system is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the issues above.');
  }
}

// Run the tests
runTests().catch(console.error);