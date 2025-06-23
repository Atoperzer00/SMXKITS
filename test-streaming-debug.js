// Streaming Service Debug Test Script
console.log('🚀 Starting Streaming Service Debug Test...');

// Test 1: Check if all required elements exist
function testDOMElements() {
  console.log('\n📋 TEST 1: DOM Elements Check');
  
  const elements = [
    'goLiveBtn',
    'stopBtn', 
    'startCameraBtn',
    'startScreenBtn',
    'stopMediaBtn',
    'fileTab',
    'liveTab',
    'classSelect',
    'previewVideo',
    'liveVideo'
  ];
  
  elements.forEach(id => {
    const element = document.getElementById(id);
    console.log(`${element ? '✅' : '❌'} ${id}: ${element ? 'Found' : 'Missing'}`);
  });
}

// Test 2: Check if event listeners are attached
function testEventListeners() {
  console.log('\n🔧 TEST 2: Event Listeners Check');
  
  const goLiveBtn = document.getElementById('goLiveBtn');
  const fileTab = document.getElementById('fileTab');
  const liveTab = document.getElementById('liveTab');
  
  // Check if buttons have click handlers
  console.log(`${goLiveBtn && goLiveBtn.onclick ? '✅' : '❌'} Go Live Button: ${goLiveBtn && goLiveBtn.onclick ? 'Has handler' : 'No handler'}`);
  console.log(`${fileTab && fileTab.onclick ? '✅' : '❌'} File Tab: ${fileTab && fileTab.onclick ? 'Has handler' : 'No handler'}`);
  console.log(`${liveTab && liveTab.onclick ? '✅' : '❌'} Live Tab: ${liveTab && liveTab.onclick ? 'Has handler' : 'No handler'}`);
}

// Test 3: Check socket connection
function testSocketConnection() {
  console.log('\n🔌 TEST 3: Socket Connection Check');
  
  if (typeof socket !== 'undefined' && socket) {
    console.log(`✅ Socket exists: ${socket.connected ? 'Connected' : 'Disconnected'}`);
    console.log(`📡 Socket ID: ${socket.id || 'Not assigned'}`);
  } else {
    console.log('❌ Socket not initialized');
  }
  
  if (typeof io !== 'undefined') {
    console.log('✅ Socket.IO library loaded');
  } else {
    console.log('❌ Socket.IO library not loaded');
  }
}

// Test 4: Check WebRTC support
function testWebRTCSupport() {
  console.log('\n📹 TEST 4: WebRTC Support Check');
  
  console.log(`${navigator.mediaDevices ? '✅' : '❌'} MediaDevices API: ${navigator.mediaDevices ? 'Supported' : 'Not supported'}`);
  console.log(`${window.RTCPeerConnection ? '✅' : '❌'} RTCPeerConnection: ${window.RTCPeerConnection ? 'Supported' : 'Not supported'}`);
  console.log(`${navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? '✅' : '❌'} getUserMedia: ${navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? 'Supported' : 'Not supported'}`);
  console.log(`${navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia ? '✅' : '❌'} getDisplayMedia: ${navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia ? 'Supported' : 'Not supported'}`);
}

// Test 5: Check global variables
function testGlobalVariables() {
  console.log('\n🌐 TEST 5: Global Variables Check');
  
  const vars = [
    'currentClassId',
    'authToken', 
    'streamingMode',
    'isLiveMode',
    'isStreaming',
    'localStream',
    'peerConnections'
  ];
  
  vars.forEach(varName => {
    const exists = typeof window[varName] !== 'undefined';
    const value = exists ? window[varName] : 'undefined';
    console.log(`${exists ? '✅' : '❌'} ${varName}: ${value}`);
  });
}

// Run all tests
function runAllTests() {
  console.log('🧪 Running Streaming Service Debug Tests...\n');
  
  testDOMElements();
  testEventListeners();
  testSocketConnection();
  testWebRTCSupport();
  testGlobalVariables();
  
  console.log('\n🏁 Debug tests completed!');
  console.log('\n💡 To test streaming:');
  console.log('1. Select a class');
  console.log('2. Choose File or Live tab');
  console.log('3. For Live: Click Camera/Screen Share first');
  console.log('4. Click Go Live button');
  console.log('5. Check browser console for errors');
}

// Auto-run tests when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAllTests);
} else {
  runAllTests();
}

// Export for manual testing
window.streamingDebugTest = {
  runAllTests,
  testDOMElements,
  testEventListeners,
  testSocketConnection,
  testWebRTCSupport,
  testGlobalVariables
};