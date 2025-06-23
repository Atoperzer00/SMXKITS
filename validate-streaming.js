#!/usr/bin/env node

/**
 * SMX Streaming System Validation Script
 * Checks if all streaming components are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 SMX Streaming System Validation\n');

// Check if required files exist
const requiredFiles = [
  'server.js',
  'public/SMXStream-new.html',
  'public/dashboard.html',
  'test-streaming.html'
];

console.log('📁 Checking required files...');
let filesOk = true;
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    filesOk = false;
  }
});

if (!filesOk) {
  console.log('\n❌ Some required files are missing!');
  process.exit(1);
}

// Check server.js for required WebSocket handlers
console.log('\n🔌 Checking server WebSocket handlers...');
const serverContent = fs.readFileSync('server.js', 'utf8');

const requiredHandlers = [
  'instructor-join-class',
  'student-join-class',
  'stream:init',
  'stream:play',
  'stream:pause',
  'stream:seek',
  'stream:time',
  'instructor-started-webrtc',
  'instructor-stopped-webrtc'
];

let handlersOk = true;
requiredHandlers.forEach(handler => {
  if (serverContent.includes(`socket.on('${handler}'`)) {
    console.log(`✅ ${handler}`);
  } else {
    console.log(`❌ ${handler} - MISSING`);
    handlersOk = false;
  }
});

// Check for duplicate routes
console.log('\n🛣️ Checking for duplicate routes...');
const uploadRoutes = (serverContent.match(/app\.use\('\/uploads'/g) || []).length;
if (uploadRoutes === 1) {
  console.log('✅ /uploads route declared once');
} else {
  console.log(`❌ /uploads route declared ${uploadRoutes} times - should be 1`);
  handlersOk = false;
}

// Check client-side WebSocket handlers
console.log('\n📱 Checking client WebSocket handlers...');
const clientContent = fs.readFileSync('public/SMXStream-new.html', 'utf8');

const requiredClientHandlers = [
  'stream:init',
  'stream:play',
  'stream:pause',
  'stream:seek',
  'stream:time',
  'viewerCount',
  'instructor-started-webrtc',
  'instructor-stopped-webrtc',
  'connect',
  'disconnect'
];

let clientHandlersOk = true;
requiredClientHandlers.forEach(handler => {
  if (clientContent.includes(`socket.on('${handler}'`)) {
    console.log(`✅ ${handler}`);
  } else {
    console.log(`❌ ${handler} - MISSING`);
    clientHandlersOk = false;
  }
});

// Check for video error handling
console.log('\n📺 Checking video error handling...');
if (clientContent.includes('onerror="handleVideoError') && 
    clientContent.includes('function handleVideoError')) {
  console.log('✅ Video error handling implemented');
} else {
  console.log('❌ Video error handling missing');
  clientHandlersOk = false;
}

// Check for Icons object
console.log('\n🎨 Checking Icons object...');
if (clientContent.includes('const Icons = {')) {
  console.log('✅ Icons object defined');
} else {
  console.log('❌ Icons object missing');
  clientHandlersOk = false;
}

// Check for formatTime function
console.log('\n⏰ Checking formatTime function...');
const formatTimeFunctions = (clientContent.match(/function formatTime/g) || []).length;
if (formatTimeFunctions >= 1) {
  console.log(`✅ formatTime function defined (${formatTimeFunctions} instances)`);
  if (formatTimeFunctions > 1) {
    console.log('⚠️ Multiple formatTime functions found - consider consolidating');
  }
} else {
  console.log('❌ formatTime function missing');
  clientHandlersOk = false;
}

// Final validation
console.log('\n📊 Validation Summary:');
console.log('='.repeat(50));

if (filesOk && handlersOk && clientHandlersOk) {
  console.log('✅ ALL CHECKS PASSED');
  console.log('🚀 Streaming system is properly configured!');
  console.log('\nNext steps:');
  console.log('1. Start server: node server.js');
  console.log('2. Test streaming: http://localhost:5000/test-streaming.html');
  console.log('3. Student view: http://localhost:5000/SMXStream-new.html?classId=test');
  console.log('4. Instructor view: http://localhost:5000/dashboard.html');
  process.exit(0);
} else {
  console.log('❌ VALIDATION FAILED');
  console.log('Please fix the issues above before using the streaming system.');
  process.exit(1);
}