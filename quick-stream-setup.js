#!/usr/bin/env node

/**
 * Quick Stream Setup - No Docker Required
 * This creates a simple streaming solution for immediate testing
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));

// Create a simple HLS directory
const hlsDir = path.join(__dirname, 'public', 'hls');
if (!fs.existsSync(hlsDir)) {
  fs.mkdirSync(hlsDir, { recursive: true });
}

// Simple stream status tracking
let activeStreams = new Map();

// Socket.IO for stream notifications
io.on('connection', (socket) => {
  console.log('👤 Client connected:', socket.id);
  
  socket.on('stream:start', (data) => {
    console.log('🎬 Stream started:', data);
    activeStreams.set(data.classId, {
      status: 'live',
      startTime: new Date(),
      streamKey: data.streamKey
    });
    
    // Broadcast to all clients
    io.emit('stream:start', data);
  });
  
  socket.on('stream:stop', (data) => {
    console.log('⏹️  Stream stopped:', data);
    activeStreams.delete(data.classId);
    
    // Broadcast to all clients
    io.emit('stream:stop', data);
  });
  
  socket.on('disconnect', () => {
    console.log('👋 Client disconnected:', socket.id);
  });
});

// API endpoint to check stream status
app.get('/api/stream/:classId', (req, res) => {
  const classId = req.params.classId;
  const stream = activeStreams.get(classId);
  
  res.json({
    classId,
    isLive: !!stream,
    stream: stream || null
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('🚀 SMXKITS Server Running!');
  console.log('');
  console.log('📡 Server: http://localhost:' + PORT);
  console.log('🎬 Stream Mode: http://localhost:' + PORT + '/Stream Mode.html');
  console.log('📺 Student View: http://localhost:' + PORT + '/SMXStream-new.html?classId=test-stream');
  console.log('');
  console.log('🎯 QUICK TESTING WORKFLOW:');
  console.log('1. Open Stream Mode.html in browser');
  console.log('2. Select a class or use "test-stream"');
  console.log('3. Configure OBS with the displayed RTMP settings');
  console.log('4. Start streaming in OBS');
  console.log('5. Open SMXStream-new.html?classId=test-stream to view');
  console.log('');
  console.log('⚠️  Note: For full RTMP→HLS, you need Docker or external RTMP server');
  console.log('   This setup handles the web interface and notifications');
});