const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Cleanup function to remove old files
function cleanupOldFiles() {
  const tempDir = path.join(__dirname, '..', 'temp');
  
  if (!fs.existsSync(tempDir)) {
    return;
  }
  
  fs.readdir(tempDir, (err, files) => {
    if (err) {
      console.error('Error reading temp directory:', err);
      return;
    }
    
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Error getting file stats:', err);
          return;
        }
        
        const fileAge = now - stats.mtime.getTime();
        
        if (fileAge > maxAge) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error('Error deleting old file:', filePath, err);
            } else {
              console.log('🧹 Cleaned up old file:', filePath);
            }
          });
        }
      });
    });
  });
}

// Run cleanup every hour
setInterval(cleanupOldFiles, 60 * 60 * 1000); // 1 hour

// Run cleanup on startup
cleanupOldFiles();
const Class = require('../models/Class');
const StreamSession = require('../models/StreamSession');
const auth = require('../middleware/auth');

// Set up multer for temporary video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'stream-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 4 * 1024 * 1024 * 1024 }, // 4GB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'video/mp4') {
      cb(null, true);
    } else {
      cb(new Error('Only MP4 files are allowed for streaming'));
    }
  }
});

// POST /api/stream/upload
router.post('/upload', auth(['admin', 'instructor']), upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { classId } = req.body;
    
    if (!classId) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    // Check if user has access to this class
    const classObj = await Class.findById(classId);
    
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Check authorization
    if (req.user.role !== 'admin' && 
        !classObj.instructors.includes(req.user.id) && 
        classObj.instructorId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }

    const filename = req.file.filename;
    const tempPath = req.file.path;
    
    // Generate stream URL for the uploaded file
    const streamUrl = `${req.protocol}://${req.get('host')}/api/stream/video/${filename}`;
    
    // Update class to indicate we're streaming an uploaded file
    classObj.streamStatus = 'live';
    classObj.currentStreamSource = 'upload';
    classObj.currentUploadPath = tempPath;
    classObj.currentUploadFilename = filename;
    await classObj.save();

    // Create or update stream session
    let session = await StreamSession.findOne({ 
      classId: classObj._id, 
      status: { $ne: 'offline' } 
    });
    
    if (!session) {
      session = new StreamSession({
        classId: classObj._id,
        status: 'live',
        startedAt: new Date(),
        currentSource: 'upload',
        uploadPath: tempPath,
        uploadFilename: filename
      });
    } else {
      session.status = 'live';
      session.currentSource = 'upload';
      session.uploadPath = tempPath;
      session.uploadFilename = filename;
    }
    
    await session.save();

    // Notify connected clients via Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Emit to both room naming conventions for compatibility
      const classRoom = `class:${classObj._id}`;
      const streamRoom = `stream:${classObj.streamKey}`;
      
      const streamData = { 
        status: 'live',
        source: 'upload',
        streamUrl: streamUrl,
        filename: req.file.originalname
      };
      
      console.log(`📡 Emitting streamStatus to rooms: ${classRoom}, ${streamRoom}`);
      console.log(`📡 Stream data:`, streamData);
      
      // Check how many clients are in each room
      const classRoomClients = io.sockets.adapter.rooms.get(classRoom);
      const streamRoomClients = io.sockets.adapter.rooms.get(streamRoom);
      
      console.log(`📊 Room statistics:`);
      console.log(`  - ${classRoom}: ${classRoomClients ? classRoomClients.size : 0} clients`);
      console.log(`  - ${streamRoom}: ${streamRoomClients ? streamRoomClients.size : 0} clients`);
      
      io.to(classRoom).emit('streamStatus', streamData);
      if (classObj.streamKey) {
        io.to(streamRoom).emit('streamStatus', streamData);
      }
    }

    console.log(`✅ Video uploaded for streaming: ${req.file.originalname} -> ${filename}`);

    // Auto-delete file after 24 hours
    setTimeout(() => {
      fs.unlink(tempPath, (err) => {
        if (err) {
          console.error('Failed to delete temp file:', tempPath);
        } else {
          console.log('✅ Deleted temp file after 24 hours:', tempPath);
        }
      });
    }, 24 * 60 * 60 * 1000); // 24 hours

    res.json({ 
      streamUrl,
      filename,
      originalName: req.file.originalname,
      status: 'live',
      message: 'Video uploaded and streaming started',
      classId: classObj._id,
      streamKey: classObj.streamKey
    });

  } catch (error) {
    console.error('❌ Error uploading video for stream:', error);
    
    // Clean up file if there was an error
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to delete temp file after error:', req.file.path);
      });
    }
    
    res.status(500).json({ error: 'Server error uploading video' });
  }
});

// GET /api/stream/state/:classId - Get current stream state for late joiners
router.get('/state/:classId', auth(), async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.classId);
    
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Check if user has access to this class
    if (req.user.role === 'student' && 
        !classObj.students.includes(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }
    
    // Get current stream state from memory
    const io = req.app.get('io');
    const streamState = io.streamStates?.get(req.params.classId);
    
    if (streamState && classObj.streamStatus === 'live') {
      res.json({
        ...streamState,
        status: 'live',
        classId: req.params.classId
      });
    } else {
      res.json({
        status: classObj.streamStatus || 'offline',
        classId: req.params.classId,
        message: 'No active stream state'
      });
    }
  } catch (error) {
    console.error('❌ Error getting stream state:', error);
    res.status(500).json({ error: 'Server error getting stream state' });
  }
});

// GET /api/stream/status/:classId - Get current stream status
router.get('/status/:classId', auth(), async (req, res) => {
  try {
    console.log('📊 Student requesting stream status for class:', req.params.classId);
    
    const classObj = await Class.findById(req.params.classId)
      .populate('currentLesson');
    
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Check if user has access to this class
    if (req.user.role === 'student' && 
        !classObj.students.includes(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    } else if (req.user.role === 'instructor' && 
               !classObj.instructors.includes(req.user.id) && 
               classObj.instructorId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }
    
    // Get active session if exists
    const session = await StreamSession.findOne({ 
      classId: classObj._id, 
      status: { $ne: 'offline' } 
    }).populate('currentLesson');
    
    const io = req.app.get('io');
    const connectedSockets = io?.sockets.adapter.rooms.get(`stream:${classObj.streamKey}`);
    const viewerCount = connectedSockets ? connectedSockets.size : 0;
    
    const responseData = {
      status: classObj.streamStatus,
      streamKey: classObj.streamKey,
      currentLesson: classObj.currentLesson,
      currentSource: classObj.currentStreamSource,
      session: session || null,
      viewerCount: viewerCount,
      streamUrl: classObj.streamStatus === 'live' && classObj.streamKey 
        ? `${process.env.HLS_SERVER_URL || 'http://localhost:8888'}/live/${classObj.streamKey}/index.m3u8`
        : null
    };
    
    console.log('📤 Sending stream status response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('❌ Error getting stream status:', error);
    res.status(500).json({ error: 'Server error getting stream status' });
  }
});

// POST /api/stream/notice/:classId - Send notice to viewers
router.post('/notice/:classId', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const classObj = await Class.findById(req.params.classId);
    
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Check if user is an instructor for this class
    if (req.user.role !== 'admin' && 
        !classObj.instructors.includes(req.user.id) && 
        classObj.instructorId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }
    
    // Get user details
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('name username');
    
    // Emit notice to connected clients
    const io = req.app.get('io');
    if (io && classObj.streamKey) {
      io.to(`stream:${classObj.streamKey}`).emit('notice', {
        message,
        userId: req.user.id,
        userName: user ? (user.name || user.username) : 'Instructor',
        timestamp: new Date()
      });
    }
    
    // Save message to active session if exists
    const session = await StreamSession.findOne({ 
      classId: classObj._id, 
      status: { $ne: 'offline' } 
    });
    
    if (session) {
      session.messages.push({
        userId: req.user.id,
        message
      });
      await session.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error sending notice:', error);
    res.status(500).json({ error: 'Server error sending notice' });
  }
});

// GET /api/stream/viewers/:classId - Get viewer count
router.get('/viewers/:classId', auth(), async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.classId);
    
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Check if user has access to this class
    if (req.user.role === 'student' && 
        !classObj.students.includes(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    } else if (req.user.role === 'instructor' && 
               !classObj.instructors.includes(req.user.id) && 
               classObj.instructorId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }
    
    const io = req.app.get('io');
    const connectedSockets = io?.sockets.adapter.rooms.get(`stream:${classObj.streamKey}`);
    const viewerCount = connectedSockets ? connectedSockets.size : 0;
    
    res.json({ count: viewerCount });
  } catch (error) {
    console.error('❌ Error getting viewer count:', error);
    res.status(500).json({ error: 'Server error getting viewer count' });
  }
});

// Serve uploaded video files
router.get('/video/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '..', 'temp', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    // Get file stats for range requests (for video seeking)
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Handle range requests for video seeking
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // Serve the entire file
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error('Error serving video file:', error);
    res.status(500).json({ error: 'Error serving video file' });
  }
});

// Endpoint to fetch all uploads
router.get('/uploads', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) return res.json([]);

    const files = fs.readdirSync(tempDir).map(file => ({ filename: file }));
    res.json(files);
  } catch (error) {
    console.error('Error fetching uploads:', error);
    res.status(500).json({ error: 'Server error fetching uploads' });
  }
});

// Endpoint to delete an upload
router.delete('/uploads/:filename', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const tempDir = path.join(__dirname, '..', 'temp');
    const filePath = path.join(tempDir, req.params.filename);

    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found' });

    fs.unlinkSync(filePath);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting upload:', error);
    res.status(500).json({ error: 'Server error deleting upload' });
  }
});

module.exports = router;