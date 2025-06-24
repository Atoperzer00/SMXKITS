#!/usr/bin/env node

/**
 * Simple Streaming Server (No Docker Required)
 * 
 * This is a simplified version that can run while Docker is being installed.
 * It provides basic streaming functionality using Node.js only.
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Active streams tracking
const activeStreams = new Map();
const connectedUsers = new Map();

// Mock HLS endpoint (for testing without NGINX)
app.get('/hls/:classId.m3u8', (req, res) => {
  const { classId } = req.params;
  
  // Return a basic HLS playlist for testing
  const playlist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-PLAYLIST-TYPE:EVENT
#EXTINF:10.0,
segment-${classId}-001.ts
#EXTINF:10.0,
segment-${classId}-002.ts
#EXT-X-ENDLIST`;

  res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(playlist);
});

// Stream API endpoints
app.post('/api/stream/start', (req, res) => {
  const { classId } = req.body;
  
  if (!classId) {
    return res.status(400).json({ error: 'Class ID is required' });
  }
  
  // Simulate stream start
  activeStreams.set(classId, {
    startTime: new Date(),
    hlsUrl: `http://localhost:${PORT}/hls/${classId}.m3u8`
  });
  
  // Notify students
  io.to(`class:${classId}`).emit('stream:started', {
    classId: classId,
    hlsUrl: `http://localhost:${PORT}/hls/${classId}.m3u8`,
    startTime: new Date()
  });
  
  console.log(`🔴 Mock stream started for class: ${classId}`);
  
  res.json({
    success: true,
    classId: classId,
    hlsUrl: `http://localhost:${PORT}/hls/${classId}.m3u8`,
    message: 'Mock stream started (install Docker for full functionality)'
  });
});

app.post('/api/stream/stop', (req, res) => {
  const { classId } = req.body;
  
  if (!activeStreams.has(classId)) {
    return res.status(404).json({ error: 'No active stream found' });
  }
  
  activeStreams.delete(classId);
  
  // Notify students
  io.to(`class:${classId}`).emit('stream:ended', {
    classId: classId,
    endTime: new Date()
  });
  
  console.log(`⏹️ Mock stream stopped for class: ${classId}`);
  
  res.json({
    success: true,
    classId: classId,
    message: 'Mock stream stopped'
  });
});

app.get('/api/stream/status/:classId', (req, res) => {
  const { classId } = req.params;
  
  if (activeStreams.has(classId)) {
    const streamInfo = activeStreams.get(classId);
    res.json({
      active: true,
      classId: classId,
      startTime: streamInfo.startTime,
      hlsUrl: streamInfo.hlsUrl,
      duration: Date.now() - streamInfo.startTime.getTime(),
      note: 'Mock stream - install Docker for full functionality'
    });
  } else {
    res.json({
      active: false,
      classId: classId
    });
  }
});

// Socket.IO handlers
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  connectedUsers.set(socket.id, {
    id: socket.id,
    role: null,
    classId: null,
    joinTime: new Date()
  });
  
  socket.on('instructor-join-class', (data) => {
    const { classId } = data;
    console.log(`👨‍🏫 Instructor ${socket.id} joining class: ${classId}`);
    
    socket.join(`class:${classId}`);
    
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo) {
      userInfo.role = 'instructor';
      userInfo.classId = classId;
    }
    
    socket.emit('instructor:joined', { 
      classId: classId,
      message: 'Successfully joined as instructor (mock mode)'
    });
  });
  
  socket.on('student-join-class', (data) => {
    const { classId } = data;
    console.log(`🎓 Student ${socket.id} joining class: ${classId}`);
    
    socket.join(`class:${classId}`);
    
    const userInfo = connectedUsers.get(socket.id);
    if (userInfo) {
      userInfo.role = 'student';
      userInfo.classId = classId;
    }
    
    socket.emit('student:joined', { 
      classId: classId,
      message: 'Successfully joined as student (mock mode)'
    });
    
    // Send mock stream if active
    if (activeStreams.has(classId)) {
      socket.emit('stream:started', {
        classId: classId,
        hlsUrl: `http://localhost:${PORT}/hls/${classId}.m3u8`,
        startTime: activeStreams.get(classId).startTime
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
    connectedUsers.delete(socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log('\n🎬 SMXKITS Simple Streaming Server');
  console.log('==================================');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('📋 Available Interfaces:');
  console.log(`   👨‍🏫 Instructor: http://localhost:${PORT}/Stream%20Mode.html`);
  console.log(`   🎓 Students: http://localhost:${PORT}/SMXStream-new.html?classId=TEST_CLASS`);
  console.log('');
  console.log('⚠️  NOTE: This is a simplified version for testing.');
  console.log('   Install Docker Desktop for full streaming functionality.');
  console.log('');
  console.log('🐳 Docker Setup: See GO-LIVE-CHECKLIST.md');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});