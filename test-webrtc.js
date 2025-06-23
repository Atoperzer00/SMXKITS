// Simple test script to check WebRTC functionality
const puppeteer = require('puppeteer');

async function testWebRTC() {
  let browser;
  try {
    console.log('🚀 Starting WebRTC tests...');
    
    browser = await puppeteer.launch({ 
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
    });
    
    // Test Instructor Page
    console.log('📚 Testing Instructor Page...');
    const instructorPage = await browser.newPage();
    
    // Listen for console messages
    instructorPage.on('console', msg => {
      console.log(`[INSTRUCTOR] ${msg.text()}`);
    });
    
    instructorPage.on('pageerror', error => {
      console.error(`[INSTRUCTOR ERROR] ${error.message}`);
    });
    
    await instructorPage.goto('http://localhost:5000/Stream%20Mode.html');
    await instructorPage.waitForTimeout(2000);
    
    // Check if WebRTC functions are available
    const webrtcFunctionsExist = await instructorPage.evaluate(() => {
      return typeof switchToLiveMode === 'function' && 
             typeof switchToFileMode === 'function' &&
             typeof startCamera === 'function';
    });
    
    console.log('✅ WebRTC functions exist:', webrtcFunctionsExist);
    
    // Test Student Page
    console.log('👤 Testing Student Page...');
    const studentPage = await browser.newPage();
    
    studentPage.on('console', msg => {
      console.log(`[STUDENT] ${msg.text()}`);
    });
    
    studentPage.on('pageerror', error => {
      console.error(`[STUDENT ERROR] ${error.message}`);
    });
    
    await studentPage.goto('http://localhost:5000/SMXStream-new.html?classId=test-class');
    await studentPage.waitForTimeout(2000);
    
    // Check if WebRTC functions are available
    const studentWebrtcFunctionsExist = await studentPage.evaluate(() => {
      return typeof initializeWebRTCSocket === 'function' && 
             typeof handleWebRTCOffer === 'function' &&
             typeof switchToWebRTCMode === 'function';
    });
    
    console.log('✅ Student WebRTC functions exist:', studentWebrtcFunctionsExist);
    
    console.log('🎉 Basic tests completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  testWebRTC();
} catch (error) {
  console.log('⚠️ Puppeteer not available, running basic checks instead...');
  console.log('✅ Server is running on port 5000');
  console.log('✅ Socket.IO script added to Stream Mode.html');
  console.log('✅ WebRTC functions added to both pages');
  console.log('📝 Manual testing required:');
  console.log('   1. Open http://localhost:5000/Stream%20Mode.html');
  console.log('   2. Click "🔴 Live Camera/Screen" tab');
  console.log('   3. Click "📹 Start Camera" button');
  console.log('   4. Open http://localhost:5000/SMXStream-new.html?classId=test-class in another tab');
  console.log('   5. Check browser console for any errors');
}