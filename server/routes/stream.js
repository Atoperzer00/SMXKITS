const express = require('express');
const router = express.Router();
const WebSocket = require('ws');

// OBS WebSocket configuration
const OBS_WEBSOCKET_URL = 'ws://localhost:4455';
let obsWebSocket = null;

// Active streams tracking
const activeStreams = new Map();

// Connect to OBS WebSocket
function connectToOBS() {
  if (obsWebSocket) {
    obsWebSocket.close();
  }
  
  try {
    obsWebSocket = new WebSocket(OBS_WEBSOCKET_URL);
    
    obsWebSocket.on('open', () => {
      console.log('✅ Connected to OBS WebSocket');
    });
    
    obsWebSocket.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('📥 OBS message:', message);
      
      // Handle OBS events
      if (message['update-type'] === 'StreamStarted') {
        console.log('🔴 OBS stream started');
      } else if (message['update-type'] === 'StreamStopped') {
        console.log('⏹️ OBS stream stopped');
      }
    });
    
    obsWebSocket.on('close', () => {
      console.log('❌ OBS WebSocket connection closed');
      obsWebSocket = null;
    });
    
    obsWebSocket.on('error', (error) => {
      console.error('❌ OBS WebSocket error:', error);
    });
    
  } catch (error) {
    console.error('❌ Failed to connect to OBS:', error);
  }
}

// Send request to OBS
function sendOBSRequest(requestType, requestData = {}) {
  return new Promise((resolve, reject) => {
    if (!obsWebSocket || obsWebSocket.readyState !== WebSocket.OPEN) {
      reject(new Error('OBS WebSocket not connected'));
      return;
    }
    
    const messageId = Date.now().toString();
    const request = {
      'request-type': requestType,
      'message-id': messageId,
      ...requestData
    };
    
    // Set up response handler
    const responseHandler = (data) => {
      const message = JSON.parse(data.toString());
      if (message['message-id'] === messageId) {
        obsWebSocket.removeListener('message', responseHandler);
        if (message.status === 'ok') {
          resolve(message);
        } else {
          reject(new Error(message.error || 'OBS request failed'));
        }
      }
    };
    
    obsWebSocket.on('message', responseHandler);
    obsWebSocket.send(JSON.stringify(request));
    
    // Timeout after 10 seconds
    setTimeout(() => {
      obsWebSocket.removeListener('message', responseHandler);
      reject(new Error('OBS request timeout'));
    }, 10000);
  });
}

// POST /api/stream/start - Start streaming for a class
router.post('/start', async (req, res) => {
  try {
    const { classId } = req.body;
    
    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }
    
    // Check if stream is already active for this class
    if (activeStreams.has(classId)) {
      return res.status(409).json({ error: 'Stream already active for this class' });
    }
    
    // Connect to OBS if not connected
    if (!obsWebSocket || obsWebSocket.readyState !== WebSocket.OPEN) {
      connectToOBS();
      // Wait a moment for connection
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Configure OBS RTMP output
    const rtmpUrl = `rtmp://localhost:1935/live/${classId}`;
    
    try {
      // Set output settings
      await sendOBSRequest('SetOutputSettings', {
        'output-name': 'rtmp_output',
        'output-settings': {
          'server': 'rtmp://localhost:1935/live',
          'key': classId
        }
      });
      
      // Start streaming
      await sendOBSRequest('StartStreaming');
      
      // Track active stream
      activeStreams.set(classId, {
        startTime: new Date(),
        rtmpUrl: rtmpUrl,
        hlsUrl: `http://localhost:8888/hls/${classId}.m3u8`
      });
      
      // Notify clients via Socket.IO
      if (req.io) {
        req.io.to(`class:${classId}`).emit('stream:started', {
          classId: classId,
          hlsUrl: `http://localhost:8888/hls/${classId}.m3u8`,
          startTime: new Date()
        });
      }
      
      console.log(`🔴 Stream started for class ${classId}`);
      
      res.json({
        success: true,
        classId: classId,
        rtmpUrl: rtmpUrl,
        hlsUrl: `http://localhost:8888/hls/${classId}.m3u8`,
        message: 'Stream started successfully'
      });
      
    } catch (obsError) {
      console.error('❌ OBS error:', obsError);
      res.status(500).json({ error: 'Failed to start OBS stream: ' + obsError.message });
    }
    
  } catch (error) {
    console.error('❌ Stream start error:', error);
    res.status(500).json({ error: 'Failed to start stream: ' + error.message });
  }
});

// POST /api/stream/stop - Stop streaming for a class
router.post('/stop', async (req, res) => {
  try {
    const { classId } = req.body;
    
    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }
    
    // Check if stream exists
    if (!activeStreams.has(classId)) {
      return res.status(404).json({ error: 'No active stream found for this class' });
    }
    
    try {
      // Stop OBS streaming
      if (obsWebSocket && obsWebSocket.readyState === WebSocket.OPEN) {
        await sendOBSRequest('StopStreaming');
      }
      
      // Remove from active streams
      activeStreams.delete(classId);
      
      // Notify clients via Socket.IO
      if (req.io) {
        req.io.to(`class:${classId}`).emit('stream:ended', {
          classId: classId,
          endTime: new Date()
        });
      }
      
      console.log(`⏹️ Stream stopped for class ${classId}`);
      
      res.json({
        success: true,
        classId: classId,
        message: 'Stream stopped successfully'
      });
      
    } catch (obsError) {
      console.error('❌ OBS stop error:', obsError);
      // Still remove from active streams even if OBS fails
      activeStreams.delete(classId);
      res.status(500).json({ error: 'Failed to stop OBS stream: ' + obsError.message });
    }
    
  } catch (error) {
    console.error('❌ Stream stop error:', error);
    res.status(500).json({ error: 'Failed to stop stream: ' + error.message });
  }
});

// GET /api/stream/status/:classId - Get stream status for a class
router.get('/status/:classId', (req, res) => {
  const { classId } = req.params;
  
  if (activeStreams.has(classId)) {
    const streamInfo = activeStreams.get(classId);
    res.json({
      active: true,
      classId: classId,
      startTime: streamInfo.startTime,
      rtmpUrl: streamInfo.rtmpUrl,
      hlsUrl: streamInfo.hlsUrl,
      duration: Date.now() - streamInfo.startTime.getTime()
    });
  } else {
    res.json({
      active: false,
      classId: classId
    });
  }
});

// GET /api/stream/active - Get all active streams
router.get('/active', (req, res) => {
  const streams = Array.from(activeStreams.entries()).map(([classId, info]) => ({
    classId,
    startTime: info.startTime,
    rtmpUrl: info.rtmpUrl,
    hlsUrl: info.hlsUrl,
    duration: Date.now() - info.startTime.getTime()
  }));
  
  res.json({ streams });
});

// GET /api/stream/viewers/:classId - Get viewer count for a class
router.get('/viewers/:classId', (req, res) => {
  const { classId } = req.params;
  
  // Get viewer count from Socket.IO rooms
  let viewerCount = 0;
  if (req.io) {
    const room = req.io.sockets.adapter.rooms.get(`class:${classId}`);
    viewerCount = room ? room.size : 0;
  }
  
  res.json({ 
    classId: classId,
    count: viewerCount 
  });
});

// Initialize OBS connection on module load
connectToOBS();

module.exports = router;