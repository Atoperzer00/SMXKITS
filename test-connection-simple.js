const io = require('socket.io-client');

console.log('Testing basic Socket.IO connection...');

const socket = io('http://localhost:5000', {
  transports: ['polling']
});

socket.on('connect', () => {
  console.log('✅ Connected successfully:', socket.id);
  
  // Test a simple emit
  socket.emit('test-message', { message: 'Hello from test' });
  
  setTimeout(() => {
    socket.disconnect();
    console.log('✅ Test completed successfully');
    process.exit(0);
  }, 1000);
});

socket.on('connect_error', (error) => {
  console.log('❌ Connection error:', error.message);
  process.exit(1);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('❌ Connection timeout');
  process.exit(1);
}, 5000);