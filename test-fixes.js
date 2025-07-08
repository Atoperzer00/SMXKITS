const fetch = require('node-fetch');
const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:5000';

async function testMessagePositioning() {
  console.log('🧪 Testing message positioning fix...\n');
  
  try {
    // Login as student
    const loginResponse = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student', password: 'student123' })
    });

    if (!loginResponse.ok) {
      console.error('❌ Failed to login as student');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    // Decode JWT to get user ID
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const studentId = payload.id;
    
    console.log('✅ Student logged in successfully');
    console.log('👤 Student ID:', studentId);
    
    // Get instructor ID
    const instructorLogin = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'instructor', password: 'instructor123' })
    });
    
    const instructorData = await instructorLogin.json();
    const instructorPayload = JSON.parse(Buffer.from(instructorData.token.split('.')[1], 'base64').toString());
    const instructorId = instructorPayload.id;
    
    console.log('✅ Instructor ID obtained:', instructorId);
    
    // Send a message from student to instructor
    const messageResponse = await fetch(`${SERVER_URL}/api/direct-messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipientId: instructorId,
        content: 'Test message from student - this should appear on the RIGHT side when student refreshes the page'
      })
    });

    if (messageResponse.ok) {
      const message = await messageResponse.json();
      console.log('✅ Message sent successfully');
      console.log('📨 Message details:');
      console.log('   - Sender ID:', message.sender.id);
      console.log('   - Sender Name:', message.sender.name);
      console.log('   - Content:', message.content);
      console.log('\n💡 Now open student messenger and check:');
      console.log('   1. Login as student (username: student, password: student123)');
      console.log('   2. Open conversation with instructor');
      console.log('   3. Refresh the page');
      console.log('   4. The message should appear on the RIGHT side (sent messages)');
    } else {
      console.error('❌ Failed to send message');
    }
    
  } catch (error) {
    console.error('❌ Error testing message positioning:', error.message);
  }
}

async function testOnlineStatus() {
  console.log('\n🧪 Testing online status fix...\n');
  
  const studentSocket = io(SERVER_URL);
  const instructorSocket = io(SERVER_URL);
  
  let studentConnected = false;
  let instructorConnected = false;
  
  // Student connection
  studentSocket.on('connect', () => {
    console.log('✅ Student socket connected');
    studentConnected = true;
    
    // Simulate student joining their room
    studentSocket.emit('join_user_room', { userId: 'student-test-id' });
  });
  
  // Instructor connection
  instructorSocket.on('connect', () => {
    console.log('✅ Instructor socket connected');
    instructorConnected = true;
    
    // Simulate instructor joining their room
    instructorSocket.emit('join_user_room', { userId: 'instructor-test-id' });
  });
  
  // Listen for online status events
  studentSocket.on('user_online', (data) => {
    console.log('📡 Student received user_online event:', data.userId);
  });
  
  instructorSocket.on('user_online', (data) => {
    console.log('📡 Instructor received user_online event:', data.userId);
  });
  
  studentSocket.on('online_users', (data) => {
    console.log('📡 Student received online_users list:', data.users);
  });
  
  instructorSocket.on('online_users', (data) => {
    console.log('📡 Instructor received online_users list:', data.users);
  });
  
  // Test disconnection after 3 seconds
  setTimeout(() => {
    console.log('\n🔌 Testing disconnection...');
    studentSocket.disconnect();
    
    setTimeout(() => {
      instructorSocket.disconnect();
      console.log('\n✅ Online status test completed');
      console.log('💡 Check the student messenger:');
      console.log('   1. Users should show as "Offline" when not connected');
      console.log('   2. Users should show as "Online" when connected');
      console.log('   3. Status indicators should be gray for offline, green for online');
      
      process.exit(0);
    }, 1000);
  }, 3000);
}

async function runTests() {
  console.log('🚀 Running Student Messenger Fixes Test\n');
  console.log('=' .repeat(50));
  
  await testMessagePositioning();
  await testOnlineStatus();
}

runTests().catch(console.error);