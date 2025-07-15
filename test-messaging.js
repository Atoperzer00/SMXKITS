const fetch = require('node-fetch');
const io = require('socket.io-client');

// Test configuration
const SERVER_URL = 'http://localhost:5000';
const users = {
  admin: { username: 'admin', password: 'admin123' },
  instructor: { username: 'instructor', password: 'instructor123' },
  student: { username: 'student', password: 'student123' }
};

let tokens = {};
let userIds = {};

// Login function
async function login(userType) {
  try {
    const response = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(users[userType])
    });

    if (response.ok) {
      const data = await response.json();
      tokens[userType] = data.token;
      
      // Decode JWT to get user ID
      const payload = JSON.parse(Buffer.from(data.token.split('.')[1], 'base64').toString());
      userIds[userType] = payload.id;
      
      console.log(`✅ ${userType} logged in successfully (ID: ${userIds[userType]})`);
      return data;
    } else {
      const error = await response.json();
      console.error(`❌ ${userType} login failed:`, error.message);
      return null;
    }
  } catch (error) {
    console.error(`❌ ${userType} login error:`, error.message);
    return null;
  }
}

// Send message function
async function sendMessage(fromUser, toUserId, content) {
  try {
    const response = await fetch(`${SERVER_URL}/api/direct-messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens[fromUser]}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipientId: toUserId,
        content: content
      })
    });

    if (response.ok) {
      const message = await response.json();
      console.log(`📨 Message sent from ${fromUser} to ${message.recipient.name}: ${content}`);
      return message;
    } else {
      const error = await response.json();
      console.error(`❌ Failed to send message:`, error.error);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error sending message:`, error.message);
    return null;
  }
}

// Get unread count
async function getUnreadCount(userType) {
  try {
    const response = await fetch(`${SERVER_URL}/api/direct-messages/unread-count`, {
      headers: {
        'Authorization': `Bearer ${tokens[userType]}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`📊 ${userType} unread count: ${data.unreadCount}`);
      return data.unreadCount;
    } else {
      console.error(`❌ Failed to get unread count for ${userType}`);
      return 0;
    }
  } catch (error) {
    console.error(`❌ Error getting unread count:`, error.message);
    return 0;
  }
}

// Setup Socket.IO listener
function setupSocketListener(userType, userId) {
  const socket = io(SERVER_URL);
  
  socket.on('connect', () => {
    console.log(`🔌 ${userType} connected to Socket.IO`);
    socket.emit('join_user_room', { userId: userId });
  });

  socket.on('direct_message', (message) => {
    console.log(`🔔 ${userType} received real-time message from ${message.sender.name}: ${message.content}`);
  });

  socket.on('conversation_updated', (data) => {
    console.log(`🔄 ${userType} conversation updated:`, data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 ${userType} disconnected from Socket.IO`);
  });

  return socket;
}

// Main test function
async function runTest() {
  console.log('🚀 Starting messaging system test...\n');

  // Step 1: Login all users
  console.log('📝 Step 1: Logging in users...');
  const adminData = await login('admin');
  const instructorData = await login('instructor');
  const studentData = await login('student');

  if (!adminData || !instructorData || !studentData) {
    console.error('❌ Failed to login users. Exiting test.');
    return;
  }

  console.log('\n📊 User IDs:');
  console.log(`Admin: ${userIds.admin}`);
  console.log(`Instructor: ${userIds.instructor}`);
  console.log(`Student: ${userIds.student}`);

  // Step 2: Setup Socket.IO listeners
  console.log('\n🔌 Step 2: Setting up Socket.IO listeners...');
  const adminSocket = setupSocketListener('admin', userIds.admin);
  const instructorSocket = setupSocketListener('instructor', userIds.instructor);
  const studentSocket = setupSocketListener('student', userIds.student);

  // Wait for connections
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Test messaging
  console.log('\n📨 Step 3: Testing messaging...');
  
  // Send message from instructor to student
  await sendMessage('instructor', userIds.student, 'Hello student! This is a test message from your instructor.');
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check unread counts
  await getUnreadCount('student');
  await getUnreadCount('instructor');
  
  // Send reply from student to instructor
  await sendMessage('student', userIds.instructor, 'Hello instructor! Thank you for the message.');
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check unread counts again
  await getUnreadCount('student');
  await getUnreadCount('instructor');

  // Send message from admin to both
  await sendMessage('admin', userIds.student, 'Admin message to student: Please check your progress.');
  await sendMessage('admin', userIds.instructor, 'Admin message to instructor: New student enrolled.');

  // Final unread count check
  await new Promise(resolve => setTimeout(resolve, 1000));
  await getUnreadCount('student');
  await getUnreadCount('instructor');
  await getUnreadCount('admin');

  console.log('\n✅ Test completed! Check the dashboard for real-time notifications.');
  console.log('💡 Open http://localhost:5000/dashboard.html and login as student to see notifications.');
  
  // Keep sockets open for a while to see real-time updates
  setTimeout(() => {
    adminSocket.disconnect();
    instructorSocket.disconnect();
    studentSocket.disconnect();
    console.log('\n🔌 All sockets disconnected. Test finished.');
    process.exit(0);
  }, 10000);
}

// Run the test
runTest().catch(console.error);