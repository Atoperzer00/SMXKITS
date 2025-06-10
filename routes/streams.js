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

// Stream control - Start stream
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
    
    await session.save();
    
    // Notify connected clients
    const io = req.app.get('io');
    io.to(`stream:${classObj.streamKey}`).emit('streamStatus', { 
      status: 'live',
      source: classObj.currentStreamSource,
      lessonId: classObj.currentLesson
    });
    
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

// Stream control - Stop stream
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

module.exports = router;