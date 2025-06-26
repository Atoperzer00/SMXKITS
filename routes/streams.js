const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Class = require('../models/Class');
const Lesson = require('../models/Lesson');
const StreamSession = require('../models/StreamSession');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Set up multer for lesson uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'lessons');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'lesson-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  }
});

// Set up multer for temporary video uploads (for streaming)
const tempStorage = multer.diskStorage({
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

const tempUpload = multer({ 
  storage: tempStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for streaming'));
    }
  }
});

// Video upload for streaming
router.post('/upload-video', auth(['admin', 'instructor']), tempUpload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
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
    
    if (req.user.role !== 'admin' && 
        !classObj.instructors.includes(req.user.id) && 
        classObj.instructorId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }

    // Move file to permanent location
    const permanentDir = path.join(__dirname, '..', 'uploads', 'streaming');
    if (!fs.existsSync(permanentDir)) {
      fs.mkdirSync(permanentDir, { recursive: true });
    }

    const permanentPath = path.join(permanentDir, req.file.filename);
    fs.renameSync(req.file.path, permanentPath);

    // TODO: Here you would typically:
    // 1. Upload to DigitalOcean Spaces
    // 2. Trigger HLS transcoding
    // 3. Return the streaming URL
    
    // For now, return the local path for OBS to use
    res.json({
      success: true,
      videoPath: permanentPath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      // In production, this would be the DigitalOcean URL
      streamUrl: `/uploads/streaming/${req.file.filename}`
    });

  } catch (error) {
    console.error('❌ Error uploading video:', error);
    res.status(500).json({ error: 'Server error uploading video' });
  }
});

// Get stream key for a class
router.get('/key/:classId', auth(['admin', 'instructor']), async (req, res) => {
  try {
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
    
    // Generate stream key if one doesn't exist
    if (!classObj.streamKey) {
      classObj.generateStreamKey();
      await classObj.save();
    }
    
    res.json({ 
      streamKey: classObj.streamKey,
      serverUrl: process.env.RTMP_SERVER_URL || 'rtmp://localhost:1935/live'
    });
  } catch (error) {
    console.error('❌ Error getting stream key:', error);
    res.status(500).json({ error: 'Server error getting stream key' });
  }
});

// Stream control - Start stream (updated for new modes)
router.post('/start', auth(['admin', 'instructor']), async (req, res) => {
  const { classId, streamKey, rtmpUrl, streamMode } = req.body;
  
  try {
    const classObj = await Class.findById(classId);
    
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Check if user is an instructor for this class
    if (req.user.role !== 'admin' && 
        !classObj.instructors.includes(req.user.id) && 
        classObj.instructorId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }
    
    // Update class status
    classObj.streamStatus = 'live';
    classObj.currentStreamSource = streamMode || 'webcam';
    
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
        currentSource: streamMode || 'webcam',
        streamMode: streamMode
      });
    } else {
      session.status = 'live';
      session.currentSource = streamMode || 'webcam';
      session.streamMode = streamMode;
    }
    
    await session.save();
    
    // Notify connected clients
    const io = req.app.get('io');
    io.to(`stream:${streamKey}`).emit('streamStatus', { 
      status: 'live',
      source: streamMode,
      streamMode: streamMode
    });
    
    res.json({ 
      status: 'live',
      session,
      streamMode: streamMode,
      streamUrl: process.env.HLS_SERVER_URL 
        ? `${process.env.HLS_SERVER_URL}/live/${streamKey}/index.m3u8`
        : `http://localhost:8888/live/${streamKey}/index.m3u8`
    });
  } catch (error) {
    console.error('❌ Error starting stream:', error);
    res.status(500).json({ error: 'Server error starting stream' });
  }
});

// Legacy route for backward compatibility
router.post('/start/:classId', auth(['admin', 'instructor']), async (req, res) => {
  try {
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
    
    // Generate stream key if one doesn't exist
    if (!classObj.streamKey) {
      classObj.generateStreamKey();
    }
    
    // Update class status
    classObj.streamStatus = 'live';
    classObj.currentStreamSource = req.body.source || 'live';
    
    if (req.body.lessonId) {
      classObj.currentLesson = req.body.lessonId;
    }
    
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
        currentSource: req.body.source || 'live',
        currentLesson: req.body.lessonId
      });
    } else {
      session.status = 'live';
      if (req.body.source) session.currentSource = req.body.source;
      if (req.body.lessonId) session.currentLesson = req.body.lessonId;
    }
    
    // If this is an uploaded video, store the stream info
    if (req.body.source === 'upload' && req.body.streamUrl) {
      session.uploadPath = req.body.streamUrl;
      session.uploadFilename = req.body.filename;
      session.uploadOriginalName = req.body.originalName;
    }
    
    await session.save();
    
    // Prepare notification data
    let notificationData = { 
      status: 'live',
      source: classObj.currentStreamSource,
      lessonId: classObj.currentLesson
    };
    
    // Add stream URL for uploaded videos
    if (req.body.source === 'upload' && req.body.streamUrl) {
      notificationData.streamUrl = req.body.streamUrl;
      notificationData.filename = req.body.originalName;
    }
    
    // Notify connected clients
    const io = req.app.get('io');
    io.to(`stream:${classObj.streamKey}`).emit('streamStatus', notificationData);
    
    res.json({ 
      status: 'live',
      session,
      streamUrl: process.env.HLS_SERVER_URL 
        ? `${process.env.HLS_SERVER_URL}/live/${classObj.streamKey}/index.m3u8`
        : `http://localhost:8888/live/${classObj.streamKey}/index.m3u8`
    });
  } catch (error) {
    console.error('❌ Error starting stream:', error);
    res.status(500).json({ error: 'Server error starting stream' });
  }
});

// Stream control - Pause stream
router.post('/pause/:classId', auth(['admin', 'instructor']), async (req, res) => {
  try {
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
    
    // Update class status
    classObj.streamStatus = 'paused';
    await classObj.save();
    
    // Update session
    const session = await StreamSession.findOne({ 
      classId: classObj._id, 
      status: 'live' 
    });
    
    if (session) {
      session.status = 'paused';
      await session.save();
    }
    
    // Notify connected clients
    const io = req.app.get('io');
    io.to(`stream:${classObj.streamKey}`).emit('streamStatus', { status: 'paused' });
    
    res.json({ status: 'paused' });
  } catch (error) {
    console.error('❌ Error pausing stream:', error);
    res.status(500).json({ error: 'Server error pausing stream' });
  }
});

// Stream control - Stop stream (updated)
router.post('/stop', auth(['admin', 'instructor']), async (req, res) => {
  const { classId } = req.body;
  
  try {
    const classObj = await Class.findById(classId);
    
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Check if user is an instructor for this class
    if (req.user.role !== 'admin' && 
        !classObj.instructors.includes(req.user.id) && 
        classObj.instructorId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }
    
    // Update class status
    classObj.streamStatus = 'offline';
    await classObj.save();
    
    // Update session
    const session = await StreamSession.findOne({ 
      classId: classObj._id, 
      status: { $ne: 'offline' } 
    });
    
    if (session) {
      session.status = 'offline';
      session.endedAt = new Date();
      await session.save();
    }
    
    // Notify connected clients
    const io = req.app.get('io');
    if (classObj.streamKey) {
      io.to(`stream:${classObj.streamKey}`).emit('streamStatus', { status: 'offline' });
    }
    
    res.json({ status: 'offline' });
  } catch (error) {
    console.error('❌ Error stopping stream:', error);
    res.status(500).json({ error: 'Server error stopping stream' });
  }
});

// Legacy route for backward compatibility  
router.post('/stop/:classId', auth(['admin', 'instructor']), async (req, res) => {
  try {
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
    
    // Update class status
    classObj.streamStatus = 'offline';
    await classObj.save();
    
    // Update session
    const session = await StreamSession.findOne({ 
      classId: classObj._id, 
      status: { $ne: 'offline' } 
    });
    
    if (session) {
      session.status = 'offline';
      session.endedAt = new Date();
      await session.save();
    }
    
    // Notify connected clients
    const io = req.app.get('io');
    io.to(`stream:${classObj.streamKey}`).emit('streamStatus', { status: 'offline' });
    
    res.json({ status: 'offline' });
  } catch (error) {
    console.error('❌ Error stopping stream:', error);
    res.status(500).json({ error: 'Server error stopping stream' });
  }
});

// Get all lessons
router.get('/lessons', auth(), async (req, res) => {
  try {
    const { classId } = req.query;
    let query = {};
    
    if (classId) {
      query.classId = classId;
      
      // Check if user has access to this class
      const classObj = await Class.findById(classId);
      
      if (!classObj) {
        return res.status(404).json({ error: 'Class not found' });
      }
      
      if (req.user.role === 'student' && 
          !classObj.students.includes(req.user.id)) {
        return res.status(403).json({ error: 'Not authorized for this class' });
      }
    } else if (req.user.role === 'student') {
      // Students can only see lessons for their own classes
      const studentClasses = await Class.find({ students: req.user.id });
      const classIds = studentClasses.map(c => c._id);
      query.classId = { $in: classIds };
    } else if (req.user.role === 'instructor') {
      // Instructors can see lessons they created or for classes they teach
      const instructorClasses = await Class.find({ 
        $or: [
          { instructors: req.user.id },
          { instructorId: req.user.id }
        ]
      });
      const classIds = instructorClasses.map(c => c._id);
      
      query.$or = [
        { createdBy: req.user.id },
        { classId: { $in: classIds } }
      ];
    }
    // Admins can see all lessons
    
    const lessons = await Lesson.find(query).sort({ module: 1, order: 1 });
    res.json(lessons);
  } catch (error) {
    console.error('❌ Error fetching lessons:', error);
    res.status(500).json({ error: 'Server error fetching lessons' });
  }
});

// Upload lesson
router.post('/lessons', auth(['admin', 'instructor']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { title, description, module, order, classId } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Lesson title is required' });
    }
    
    // Check if user has access to this class
    if (classId) {
      const classObj = await Class.findById(classId);
      
      if (!classObj) {
        return res.status(404).json({ error: 'Class not found' });
      }
      
      if (req.user.role !== 'admin' && 
          !classObj.instructors.includes(req.user.id) && 
          classObj.instructorId?.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized for this class' });
      }
    }
    
    const lesson = new Lesson({
      title,
      description,
      filePath: req.file.path,
      module,
      order: parseInt(order) || 0,
      classId,
      createdBy: req.user.id
    });
    
    await lesson.save();
    
    res.status(201).json(lesson);
  } catch (error) {
    console.error('❌ Error uploading lesson:', error);
    res.status(500).json({ error: 'Server error uploading lesson' });
  }
});

// Play a lesson
router.post('/play/:classId/:lessonId', auth(['admin', 'instructor']), async (req, res) => {
  try {
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
    
    const lesson = await Lesson.findById(req.params.lessonId);
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    // Update class status and current lesson
    classObj.streamStatus = 'live';
    classObj.currentLesson = lesson._id;
    classObj.currentStreamSource = 'mp4';
    
    // Create or update session
    let session = await StreamSession.findOne({ 
      classId: classObj._id, 
      status: { $ne: 'offline' } 
    });
    
    if (!session) {
      session = new StreamSession({
        classId: classObj._id,
        status: 'live',
        startedAt: new Date(),
        currentSource: 'mp4',
        currentLesson: lesson._id
      });
    } else {
      session.status = 'live';
      session.currentSource = 'mp4';
      session.currentLesson = lesson._id;
    }
    
    await classObj.save();
    await session.save();
    
    // Notify connected clients
    const io = req.app.get('io');
    io.to(`stream:${classObj.streamKey}`).emit('streamStatus', { 
      status: 'live',
      source: 'mp4',
      lesson: {
        id: lesson._id,
        title: lesson.title,
        filePath: lesson.filePath
      }
    });
    
    res.json({
      status: 'live',
      lesson,
      session
    });
  } catch (error) {
    console.error('❌ Error playing lesson:', error);
    res.status(500).json({ error: 'Server error playing lesson' });
  }
});

// Create bookmark
router.post('/bookmarks/:classId', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const { time, label } = req.body;
    
    if (time === undefined || !label) {
      return res.status(400).json({ error: 'Time and label are required' });
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
    
    // Add bookmark to class
    const bookmark = {
      time: parseInt(time),
      label,
      createdBy: req.user.id,
      createdAt: new Date()
    };
    
    classObj.bookmarks.push(bookmark);
    await classObj.save();
    
    // Add bookmark to active session if exists
    const session = await StreamSession.findOne({ 
      classId: classObj._id, 
      status: { $ne: 'offline' } 
    });
    
    if (session) {
      session.bookmarks.push(bookmark);
      await session.save();
    }
    
    // Notify connected clients
    const io = req.app.get('io');
    io.to(`stream:${classObj.streamKey}`).emit('bookmark', bookmark);
    
    res.status(201).json(bookmark);
  } catch (error) {
    console.error('❌ Error creating bookmark:', error);
    res.status(500).json({ error: 'Server error creating bookmark' });
  }
});

// Get bookmarks for a class
router.get('/bookmarks/:classId', auth(), async (req, res) => {
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
    
    res.json(classObj.bookmarks);
  } catch (error) {
    console.error('❌ Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Server error fetching bookmarks' });
  }
});

// Send notice/message to all viewers
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
    const user = await User.findById(req.user.id).select('name username');
    
    // Emit notice to connected clients
    const io = req.app.get('io');
    io.to(`stream:${classObj.streamKey}`).emit('notice', {
      message,
      userId: req.user.id,
      userName: user ? (user.name || user.username) : 'Instructor',
      timestamp: new Date()
    });
    
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

// Get viewer count
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
    const connectedSockets = io.sockets.adapter.rooms.get(`stream:${classObj.streamKey}`);
    const viewerCount = connectedSockets ? connectedSockets.size : 0;
    
    res.json({ count: viewerCount });
  } catch (error) {
    console.error('❌ Error getting viewer count:', error);
    res.status(500).json({ error: 'Server error getting viewer count' });
  }
});

// Get stream status
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
    const connectedSockets = io.sockets.adapter.rooms.get(`stream:${classObj.streamKey}`);
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

// Upload video for immediate streaming
router.post('/upload', auth(['admin', 'instructor']), tempUpload.single('video'), async (req, res) => {
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
    
    if (req.user.role !== 'admin' && 
        !classObj.instructors.includes(req.user.id) && 
        classObj.instructorId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this class' });
    }

    const filename = req.file.filename;
    const tempPath = req.file.path;
    
    // Generate stream URL - this would typically point to your streaming service
    // For now, we'll create a local stream URL that can be used by the frontend
    const streamUrl = `${process.env.HLS_SERVER_URL || 'http://localhost:8888'}/temp/${filename}`;
    
    // Update class to indicate we're streaming an uploaded file
    classObj.streamStatus = 'live';
    classObj.currentStreamSource = 'upload';
    classObj.currentUploadPath = tempPath;
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
        uploadPath: tempPath
      });
    } else {
      session.status = 'live';
      session.currentSource = 'upload';
      session.uploadPath = tempPath;
    }
    
    await session.save();

    // Notify connected clients
    const io = req.app.get('io');
    io.to(`stream:${classObj.streamKey}`).emit('streamStatus', { 
      status: 'live',
      source: 'upload',
      streamUrl: streamUrl
    });

    // Optional: delete file after 5 minutes
    setTimeout(() => {
      fs.unlink(tempPath, (err) => {
        if (err) console.error('Failed to delete temp file:', tempPath);
        else console.log('✅ Deleted temp file:', tempPath);
      });
    }, 5 * 60 * 1000); // 5 minutes

    res.json({ 
      streamUrl,
      filename,
      status: 'live',
      message: 'Video uploaded and streaming started'
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

// Get current stream state for recovery and sync
router.get('/state/:classId', auth(), async (req, res) => {
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
    
    // Get active session
    const session = await StreamSession.findOne({ 
      classId: classObj._id, 
      status: { $ne: 'offline' } 
    }).populate('currentLesson');
    
    if (!session || classObj.streamStatus !== 'live') {
      return res.json({ 
        success: false, 
        message: 'No active stream',
        state: null 
      });
    }
    
    // Get stream state from memory (if available)
    const io = req.app.get('io');
    if (!io.streamStates) {
      io.streamStates = new Map();
    }
    
    const memoryState = io.streamStates.get(req.params.classId);
    
    // Calculate current live time
    let currentLiveTime = 0;
    let elapsedSeconds = 0;
    let isPlaying = false;
    
    if (memoryState) {
      const now = new Date();
      const lastUpdate = new Date(memoryState.lastUpdate);
      const timeSinceUpdate = (now - lastUpdate) / 1000;
      
      currentLiveTime = memoryState.currentTime;
      isPlaying = memoryState.playing;
      
      // If playing, add elapsed time since last update
      if (isPlaying) {
        currentLiveTime += timeSinceUpdate;
      }
      
      const startTime = new Date(memoryState.startTime);
      elapsedSeconds = (now - startTime) / 1000;
    }
    
    res.json({
      success: true,
      state: {
        streamUrl: classObj.streamStatus === 'live' && classObj.streamKey 
          ? `${process.env.HLS_SERVER_URL || 'http://localhost:8888'}/live/${classObj.streamKey}/index.m3u8`
          : null,
        currentTime: currentLiveTime,
        playing: isPlaying,
        startTime: session.startedAt,
        currentLiveTime,
        elapsedSeconds,
        lesson: session.currentLesson,
        source: session.currentSource
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting stream state:', error);
    res.status(500).json({ error: 'Failed to get stream state' });
  }
});

module.exports = router;