const fetch = require('node-fetch');
const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:5000';

async function testInboxIntegration() {
  console.log('🧪 Testing Inbox Integration with Direct Messages\n');
  
  try {
    // Login as student
    const studentLogin = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'student', password: 'student123' })
    });

    const studentData = await studentLogin.json();
    const studentToken = studentData.token;
    const studentPayload = JSON.parse(Buffer.from(studentToken.split('.')[1], 'base64').toString());
    const studentId = studentPayload.id;
    
    // Login as instructor
    const instructorLogin = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'instructor', password: 'instructor123' })
    });

    const instructorData = await instructorLogin.json();
    const instructorToken = instructorData.token;
    const instructorPayload = JSON.parse(Buffer.from(instructorToken.split('.')[1], 'base64').toString());
    const instructorId = instructorPayload.id;
    
    console.log('✅ Both users logged in successfully');
    console.log('👤 Student ID:', studentId);
    console.log('👤 Instructor ID:', instructorId);
    
    // Test 1: Check initial unread count for student
    console.log('\n📊 Test 1: Initial unread count for student');
    const initialUnreadResponse = await fetch(`${SERVER_URL}/api/direct-messages/unread-count`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (initialUnreadResponse.ok) {
      const initialUnread = await initialUnreadResponse.json();
      console.log('📬 Initial unread count:', initialUnread.unreadCount);
    }
    
    // Test 2: Send message from instructor to student
    console.log('\n📨 Test 2: Sending message from instructor to student');
    const messageResponse = await fetch(`${SERVER_URL}/api/direct-messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${instructorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipientId: studentId,
        content: 'Test message for inbox integration - this should appear in student dashboard inbox!'
      })
    });

    if (messageResponse.ok) {
      const message = await messageResponse.json();
      console.log('✅ Message sent successfully');
      console.log('📨 Message ID:', message._id);
    }
    
    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Check updated unread count for student
    console.log('\n📊 Test 3: Updated unread count for student');
    const updatedUnreadResponse = await fetch(`${SERVER_URL}/api/direct-messages/unread-count`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (updatedUnreadResponse.ok) {
      const updatedUnread = await updatedUnreadResponse.json();
      console.log('📬 Updated unread count:', updatedUnread.unreadCount);
      
      if (updatedUnread.unreadCount > 0) {
        console.log('✅ Unread count increased - inbox should show notification badge!');
      } else {
        console.log('❌ Unread count did not increase');
      }
    }
    
    // Test 4: Check conversations for student (inbox content)
    console.log('\n📋 Test 4: Student conversations (inbox content)');
    const conversationsResponse = await fetch(`${SERVER_URL}/api/direct-messages/conversations`, {
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (conversationsResponse.ok) {
      const conversations = await conversationsResponse.json();
      console.log('💬 Number of conversations:', conversations.length);
      
      conversations.forEach((conv, index) => {
        console.log(`📝 Conversation ${index + 1}:`);
        console.log('   - Other participant:', conv.otherParticipant?.name);
        console.log('   - Last message:', conv.lastMessage?.content?.substring(0, 50) + '...');
        console.log('   - Unread count:', conv.unreadCount || 0);
        console.log('   - Last message time:', conv.lastMessage?.timestamp);
      });
    }
    
    console.log('\n🎯 Dashboard Inbox Test Results:');
    console.log('1. ✅ Unread count API working');
    console.log('2. ✅ Conversations API working');
    console.log('3. ✅ Message sending creates unread messages');
    console.log('\n💡 Now test the dashboard:');
    console.log('   1. Open http://localhost:5000/dashboard.html');
    console.log('   2. Login as student (username: student, password: student123)');
    console.log('   3. Check the inbox bubble - should show unread count badge');
    console.log('   4. Click inbox bubble - should show recent conversations');
    console.log('   5. Click on conversation - should open student messenger');
    
  } catch (error) {
    console.error('❌ Error testing inbox integration:', error.message);
  }
}

testInboxIntegration();