#!/usr/bin/env node

/**
 * Test Script: Stream Communication Flow
 * 
 * This script tests the communication between Stream Mode (instructor) 
 * and SMXStream-new (student) pages to ensure students can see the stream
 * when instructor hits "Go Live".
 */

const io = require('socket.io-client');

// Test configuration
const SERVER_URL = 'http://localhost:3000';
const TEST_CLASS_ID = '507f1f77bcf86cd799439011'; // Mock class ID
const TEST_STREAM_URL = 'http://localhost:3000/uploads/test-video.mp4';

console.log('🧪 Starting Stream Communication Test...\n');

// Create instructor socket (Stream Mode)
const instructorSocket = io(SERVER_URL);
let studentSocket = null;

// Test sequence
let testStep = 0;
const testSteps = [
  'Connect instructor socket',
  'Join instructor to class',
  'Connect student socket', 
  'Join student to class',
  'Instructor goes live',
  'Verify student receives stream',
  'Instructor stops stream',
  'Verify student receives stop signal'
];

function nextStep(message) {
  console.log(`✅ Step ${testStep + 1}: ${testSteps[testStep]} - ${message}`);
  testStep++;
  
  if (testStep >= testSteps.length) {
    console.log('\n🎉 All tests completed successfully!');
    process.exit(0);
  }
}

function failTest(step, error) {
  console.error(`❌ Step ${step + 1} failed: ${testSteps[step]} - ${error}`);
  process.exit(1);
}

// Instructor socket events
instructorSocket.on('connect', () => {
  nextStep('Instructor connected');
  
  // Step 2: Join instructor to class
  instructorSocket.emit('instructor-join-class', { classId: TEST_CLASS_ID });
});

instructorSocket.on('stream:instructor-ready', (data) => {
  nextStep(`Instructor joined class: ${data.classId}`);
  
  // Step 3: Create student socket
  studentSocket = io(SERVER_URL);
  
  studentSocket.on('connect', () => {
    nextStep('Student connected');
    
    // Step 4: Join student to class
    studentSocket.emit('student-join-class', { classId: TEST_CLASS_ID });
  });
  
  // Student socket events
  studentSocket.on('stream:current-state', (data) => {
    console.log('📥 Student received current stream state:', data);
  });
  
  studentSocket.on('stream:no-state', (data) => {
    nextStep('Student joined class (no active stream)');
    
    // Step 5: Instructor goes live
    setTimeout(() => {
      console.log('🔴 Instructor going live...');
      instructorSocket.emit('stream:init', {
        streamUrl: TEST_STREAM_URL,
        startTime: new Date().toISOString(),
        currentTime: 0,
        playing: true,
        filename: 'test-video.mp4'
      });
    }, 1000);
  });
  
  studentSocket.on('stream:init', (data) => {
    nextStep(`Student received stream: ${data.streamUrl}`);
    
    // Step 7: Instructor stops stream
    setTimeout(() => {
      console.log('⏹️ Instructor stopping stream...');
      instructorSocket.emit('stream:stop', { classId: TEST_CLASS_ID });
    }, 1000);
  });
  
  studentSocket.on('streamStatus', (data) => {
    if (data.status === 'live') {
      console.log('📡 Student received streamStatus: LIVE');
      if (!data.streamUrl) {
        console.log('⚠️ Warning: streamStatus missing streamUrl');
      }
    } else if (data.status === 'offline') {
      nextStep('Student received stream stop signal');
      
      // Clean up
      setTimeout(() => {
        instructorSocket.disconnect();
        studentSocket.disconnect();
        console.log('\n🧹 Test cleanup completed');
      }, 500);
    }
  });
  
  studentSocket.on('disconnect', () => {
    console.log('👋 Student disconnected');
  });
});

instructorSocket.on('disconnect', () => {
  console.log('👋 Instructor disconnected');
});

instructorSocket.on('connect_error', (error) => {
  failTest(0, `Instructor connection failed: ${error.message}`);
});

// Timeout for the entire test
setTimeout(() => {
  console.error('⏰ Test timeout - something went wrong');
  process.exit(1);
}, 15000);

console.log('🔌 Connecting to server...');