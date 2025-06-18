// Simple server startup script for testing
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

// Mock KitComm data
let mockMessages = {
  'Global': [
    { author: 'System', role: 'INFO', content: 'Welcome to KitComm Global channel', timestamp: new Date() },
    { author: 'Admin', role: 'ITC', content: 'Server is now online', timestamp: new Date() }
  ],
  'Team-1': [],
  'Team-2': [],
  'Instructor': []
};

// Socket.io handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined room ${room}`);
  });
  
  socket.on('leave', (room) => {
    socket.leave(room);
    console.log(`Client ${socket.id} left room ${room}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Mock API routes
app.get('/api/kitcomm/channels', (req, res) => {
  const channels = Object.keys(mockMessages);
  res.json(channels);
});

app.get('/api/kitcomm/channels/:channel', (req, res) => {
  const channel = req.params.channel;
  const messages = mockMessages[channel] || [];
  res.json(messages);
});

app.post('/api/kitcomm/message', (req, res) => {
  const { channel, author, role, content } = req.body;
  
  if (!mockMessages[channel]) {
    mockMessages[channel] = [];
  }
  
  const message = {
    author,
    role,
    content,
    timestamp: new Date()
  };
  
  mockMessages[channel].push(message);
  
  // Emit to all clients in the channel
  io.to(`kitcomm:${channel}`).emit('kitcomm:message', message);
  
  res.json(message);
});

app.delete('/api/kitcomm/channels/:channel/messages', (req, res) => {
  const channel = req.params.channel;
  const deletedCount = mockMessages[channel] ? mockMessages[channel].length : 0;
  
  mockMessages[channel] = [];
  
  // Notify all clients
  io.to(`kitcomm:${channel}`).emit('kitcomm:channelCleared', {
    channel,
    clearedBy: 'Admin',
    timestamp: new Date()
  });
  
  res.json({
    success: true,
    message: `Cleared ${deletedCount} messages from ${channel}`,
    deletedCount
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 KitComm Test Server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT}/KitComm.html to test`);
  console.log(`🧪 Open http://localhost:${PORT}/test-kitcomm.html for diagnostics`);
});