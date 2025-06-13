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
    
    // Generate stream URL for smxstream.new or HLS stream service
    const streamUrl = `https://smxstream.new/stream/${filename}.m3u8`;
    
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
    if (io && classObj.streamKey) {
      io.to(`stream:${classObj.streamKey}`).emit('streamStatus', { 
        status: 'live',
        source: 'upload',
        streamUrl: streamUrl,
        filename: req.file.originalname
      });
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

// GET /api/stream/status/:classId - Get current stream status
router.get('/status/:classId', auth(), async (req, res) => {
  try {
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
    
    res.json({
      status: classObj.streamStatus,
      streamKey: classObj.streamKey,
      currentLesson: classObj.currentLesson,
      currentSource: classObj.currentStreamSource,
      session: session || null,
      viewerCount: viewerCount,
      streamUrl: classObj.streamStatus === 'live' && classObj.streamKey 
        ? `${process.env.HLS_SERVER_URL || 'http://localhost:8888'}/live/${classObj.streamKey}/index.m3u8`
        : null
    });
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

module.exports = router;