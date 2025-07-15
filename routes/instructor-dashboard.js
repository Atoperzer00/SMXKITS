const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Message = require('../models/Message');
const Progress = require('../models/Progress');
const StreamSession = require('../models/StreamSession');
const Material = require('../models/Material');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/materials');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|ppt|pptx|xls|xlsx|txt|mp4|avi|mov|wmv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Get instructor's classes
router.get('/my-classes', auth(['instructor', 'admin']), async (req, res) => {
  try {
    let classes;
    
    if (req.user.role === 'admin') {
      // Admin can see all classes
      classes = await Class.find({})
        .populate('instructorId', 'name email')
        .populate('students', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Instructor can only see their classes
      classes = await Class.find({
        $or: [
          { instructorId: req.user._id },
          { instructors: req.user._id }
        ]
      })
      .populate('instructorId', 'name email')
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
    }
    
    res.json(classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get class students with activity status
router.get('/classes/:classId/students', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Verify instructor has access to this class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get students with their progress and activity
    const students = await User.find({ 
      _id: { $in: classDoc.students } 
    }).select('name email createdAt');
    
    // Get recent progress for each student
    const studentsWithActivity = await Promise.all(
      students.map(async (student) => {
        const recentProgress = await Progress.findOne({
          userId: student._id,
          classId: classId
        }).sort({ updatedAt: -1 });
        
        return {
          ...student.toObject(),
          lastActive: recentProgress?.updatedAt || student.createdAt,
          status: getActivityStatus(recentProgress?.updatedAt)
        };
      })
    );
    
    res.json(studentsWithActivity);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// Get class analytics and statistics
router.get('/analytics/class/:classId/stats', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get statistics
    const totalStudents = classDoc.students.length;
    
    // Count active students (active in last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeStudents = await Progress.distinct('userId', {
      classId: classId,
      updatedAt: { $gte: oneDayAgo }
    });
    
    // Count pending submissions
    const pendingSubmissions = await Submission.countDocuments({
      classId: classId,
      status: 'pending'
    });
    
    // Calculate average progress
    const progressData = await Progress.find({ classId: classId });
    const avgProgress = progressData.length > 0 
      ? Math.round(progressData.reduce((sum, p) => sum + (p.completionPercentage || 0), 0) / progressData.length)
      : 0;
    
    // Get recent activity
    const recentSubmissions = await Submission.find({ classId: classId })
      .sort({ submittedAt: -1 })
      .limit(10)
      .populate('studentId', 'name');
    
    const recentMessages = await Message.find({ classId: classId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('senderId', 'name');
    
    res.json({
      totalStudents,
      activeStudents: activeStudents.length,
      pendingSubmissions,
      avgProgress,
      recentActivity: {
        submissions: recentSubmissions,
        messages: recentMessages
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Stream management routes
router.get('/streams/class/:classId/status', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Verify access
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get current stream session
    const currentSession = await StreamSession.findOne({
      classId: classId,
      status: 'live'
    });
    
    res.json({
      status: classDoc.streamStatus || 'offline',
      streamKey: classDoc.streamKey,
      viewerCount: currentSession?.viewerCount || 0,
      startedAt: currentSession?.startedAt,
      currentSource: classDoc.currentStreamSource
    });
  } catch (error) {
    console.error('Error fetching stream status:', error);
    res.status(500).json({ error: 'Failed to fetch stream status' });
  }
});

router.post('/streams/class/:classId/start', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Verify access
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Generate stream key if not exists
    if (!classDoc.streamKey) {
      classDoc.generateStreamKey();
    }
    
    // Update class stream status
    classDoc.streamStatus = 'live';
    await classDoc.save();
    
    // Create new stream session
    const streamSession = new StreamSession({
      classId: classId,
      instructorId: req.user._id,
      status: 'live',
      startedAt: new Date(),
      streamKey: classDoc.streamKey
    });
    await streamSession.save();
    
    // Emit to all connected clients
    req.io.to(`class-${classId}`).emit('stream-started', {
      classId: classId,
      streamKey: classDoc.streamKey,
      startedAt: streamSession.startedAt
    });
    
    res.json({
      status: 'live',
      streamKey: classDoc.streamKey,
      viewerCount: 0,
      startedAt: streamSession.startedAt
    });
  } catch (error) {
    console.error('Error starting stream:', error);
    res.status(500).json({ error: 'Failed to start stream' });
  }
});

router.post('/streams/class/:classId/stop', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Verify access
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update class stream status
    classDoc.streamStatus = 'offline';
    await classDoc.save();
    
    // End current stream session
    await StreamSession.updateMany(
      { classId: classId, status: 'live' },
      { 
        status: 'ended',
        endedAt: new Date()
      }
    );
    
    // Emit to all connected clients
    req.io.to(`class-${classId}`).emit('stream-ended', {
      classId: classId,
      endedAt: new Date()
    });
    
    res.json({
      status: 'offline',
      streamKey: classDoc.streamKey,
      viewerCount: 0,
      endedAt: new Date()
    });
  } catch (error) {
    console.error('Error stopping stream:', error);
    res.status(500).json({ error: 'Failed to stop stream' });
  }
});

// Assignment management
router.get('/assignments/class/:classId', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get assignments with submission counts
    const assignments = await Assignment.find({ classId: classId })
      .sort({ createdAt: -1 });
    
    // Add submission counts
    const assignmentsWithCounts = await Promise.all(
      assignments.map(async (assignment) => {
        const submissionCount = await Submission.countDocuments({
          assignmentId: assignment._id
        });
        
        return {
          ...assignment.toObject(),
          submissionCount
        };
      })
    );
    
    res.json(assignmentsWithCounts);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

router.post('/assignments/create', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { title, description, dueDate, points, classId } = req.body;
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const assignment = new Assignment({
      title,
      description,
      dueDate: new Date(dueDate),
      points,
      classId,
      createdBy: req.user._id
    });
    
    await assignment.save();
    
    // Notify students
    req.io.to(`class-${classId}`).emit('new-assignment', {
      assignment: assignment.toObject(),
      className: classDoc.name
    });
    
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Material management
router.get('/materials/class/:classId', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const materials = await Material.find({ classId: classId })
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name');
    
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: 'Failed to fetch materials' });
  }
});

router.post('/materials/upload', auth(['instructor', 'admin']), upload.single('file'), async (req, res) => {
  try {
    const { title, description, category, classId } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const material = new Material({
      title,
      description,
      category,
      classId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id
    });
    
    await material.save();
    
    // Notify students
    req.io.to(`class-${classId}`).emit('new-material', {
      material: material.toObject(),
      className: classDoc.name
    });
    
    res.status(201).json(material);
  } catch (error) {
    console.error('Error uploading material:', error);
    res.status(500).json({ error: 'Failed to upload material' });
  }
});

router.get('/materials/:materialId/download', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { materialId } = req.params;
    
    const material = await Material.findById(materialId);
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    
    // Verify access to the class
    const classDoc = await Class.findById(material.classId);
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if file exists
    try {
      await fs.access(material.filePath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    
    res.download(material.filePath, material.originalName);
  } catch (error) {
    console.error('Error downloading material:', error);
    res.status(500).json({ error: 'Failed to download material' });
  }
});

// Messaging routes
router.post('/messages/send', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId, message, type = 'broadcast', recipientId } = req.body;
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const messageDoc = new Message({
      senderId: req.user._id,
      classId: classId,
      message: message,
      type: type,
      recipientId: recipientId || null
    });
    
    await messageDoc.save();
    await messageDoc.populate('senderId', 'name');
    
    // Emit message to appropriate recipients
    if (type === 'broadcast') {
      req.io.to(`class-${classId}`).emit('new-message', {
        ...messageDoc.toObject(),
        senderName: req.user.name,
        timestamp: messageDoc.createdAt
      });
    } else if (type === 'direct' && recipientId) {
      req.io.to(`user-${recipientId}`).emit('new-message', {
        ...messageDoc.toObject(),
        senderName: req.user.name,
        timestamp: messageDoc.createdAt
      });
    }
    
    res.status(201).json(messageDoc);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.get('/messages/class/:classId', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const messages = await Message.find({ classId: classId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('senderId', 'name role')
      .populate('recipientId', 'name');
    
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Grading routes
router.get('/submissions/class/:classId', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const query = { classId: classId };
    if (status) {
      query.status = status;
    }
    
    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('studentId', 'name email')
      .populate('gradedBy', 'name');
    
    const total = await Submission.countDocuments(query);
    
    res.json({
      submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

router.put('/submissions/:submissionId/grade', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, rubricScores, instructorNotes } = req.body;
    
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Verify access to the class
    const classDoc = await Class.findById(submission.classId);
    if (req.user.role !== 'admin' && 
        !classDoc.instructorId.equals(req.user._id) && 
        !classDoc.instructors.includes(req.user._id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Update submission
    submission.grade = grade;
    submission.rubricScores = rubricScores || [];
    submission.instructorNotes = instructorNotes || '';
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id;
    
    await submission.save();
    await submission.populate('studentId', 'name email');
    
    // Notify student
    req.io.to(`user-${submission.studentId._id}`).emit('submission-graded', {
      submissionId: submission._id,
      grade: grade,
      missionTitle: submission.missionTitle,
      className: classDoc.name
    });
    
    res.json(submission);
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

// Utility function to determine activity status
function getActivityStatus(lastActive) {
  if (!lastActive) return 'offline';
  
  const now = new Date();
  const diffMinutes = (now - new Date(lastActive)) / (1000 * 60);
  
  if (diffMinutes < 5) return 'online';
  if (diffMinutes < 30) return 'away';
  return 'offline';
}

// Create missing models if they don't exist
const Assignment = require('../models/Assignment') || createAssignmentModel();

function createAssignmentModel() {
  const mongoose = require('mongoose');
  
  const AssignmentSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true },
    points: { type: Number, default: 100 },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    attachments: [{
      fileName: String,
      filePath: String,
      originalName: String
    }],
    rubric: [{
      category: String,
      maxPoints: Number,
      description: String
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  });
  
  return mongoose.model('Assignment', AssignmentSchema);
}



// Calendar and scheduling routes
router.get('/calendar/class/:classId/events', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { start, end } = req.query;
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && !classDoc.instructors.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // For now, return sample events - in production, you'd have an Event model
    const events = [
      {
        id: '1',
        title: 'Class Session',
        start: new Date().toISOString(),
        end: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        type: 'class'
      },
      {
        id: '2',
        title: 'Assignment Due',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        type: 'assignment'
      }
    ];
    
    res.json(events);
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// Live collaboration routes
router.post('/collaboration/polls/create', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId, question, options, duration } = req.body;
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && !classDoc.instructors.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const poll = {
      id: Date.now().toString(),
      classId,
      question,
      options,
      duration,
      createdBy: req.user.id,
      createdAt: new Date(),
      responses: []
    };
    
    // Broadcast poll to students via Socket.IO
    if (req.io) {
      req.io.to(`class-${classId}`).emit('new-poll', poll);
    }
    
    res.json({ success: true, poll });
  } catch (error) {
    console.error('Failed to create poll:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// Breakout room management
router.post('/collaboration/breakout-rooms/create', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId, roomName, studentIds, duration } = req.body;
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && !classDoc.instructors.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const breakoutRoom = {
      id: `breakout-${classId}-${Date.now()}`,
      name: roomName,
      classId,
      studentIds,
      duration,
      createdBy: req.user.id,
      createdAt: new Date(),
      active: true
    };
    
    // Move students to breakout room via Socket.IO
    if (req.io) {
      studentIds.forEach(studentId => {
        req.io.to(`user-${studentId}`).emit('joined-breakout-room', {
          roomId: breakoutRoom.id,
          roomName,
          duration
        });
      });
    }
    
    res.json({ success: true, breakoutRoom });
  } catch (error) {
    console.error('Failed to create breakout room:', error);
    res.status(500).json({ error: 'Failed to create breakout room' });
  }
});

// Student progress tracking
router.get('/progress/class/:classId/detailed', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && !classDoc.instructors.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get detailed progress for all students
    const students = await User.find({ 
      _id: { $in: classDoc.students },
      role: 'student'
    }).select('name email lastActive');
    
    const progressData = await Promise.all(students.map(async (student) => {
      const progress = await Progress.find({ 
        userId: student._id, 
        classId 
      }).populate('lessonId', 'title');
      
      const submissions = await Submission.find({
        studentId: student._id,
        classId
      }).populate('assignmentId', 'title dueDate');
      
      return {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          lastActive: student.lastActive
        },
        progress: progress.map(p => ({
          lessonId: p.lessonId._id,
          lessonTitle: p.lessonId.title,
          completionPercentage: p.completionPercentage,
          timeSpent: p.timeSpent,
          lastAccessed: p.lastAccessed
        })),
        submissions: submissions.map(s => ({
          assignmentId: s.assignmentId._id,
          assignmentTitle: s.assignmentId.title,
          submittedAt: s.submittedAt,
          grade: s.grade,
          status: s.status
        })),
        overallProgress: progress.length > 0 
          ? progress.reduce((sum, p) => sum + p.completionPercentage, 0) / progress.length 
          : 0
      };
    }));
    
    res.json({ students: progressData });
  } catch (error) {
    console.error('Failed to fetch detailed progress:', error);
    res.status(500).json({ error: 'Failed to fetch detailed progress' });
  }
});

// Bulk operations
router.post('/assignments/bulk-grade', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { submissionIds, grade, feedback } = req.body;
    
    if (!submissionIds || !Array.isArray(submissionIds)) {
      return res.status(400).json({ error: 'Invalid submission IDs' });
    }
    
    // Update all submissions
    const result = await Submission.updateMany(
      { 
        _id: { $in: submissionIds },
        status: 'submitted'
      },
      {
        $set: {
          grade,
          instructorNotes: feedback,
          status: 'graded',
          gradedAt: new Date(),
          gradedBy: req.user.id
        }
      }
    );
    
    // Notify students via Socket.IO
    if (req.io) {
      const submissions = await Submission.find({ 
        _id: { $in: submissionIds } 
      }).populate('studentId', 'name');
      
      submissions.forEach(submission => {
        req.io.to(`user-${submission.studentId._id}`).emit('assignment-graded', {
          assignmentId: submission.assignmentId,
          grade,
          feedback
        });
      });
    }
    
    res.json({ 
      success: true, 
      message: `${result.modifiedCount} submissions graded successfully` 
    });
  } catch (error) {
    console.error('Failed to bulk grade:', error);
    res.status(500).json({ error: 'Failed to bulk grade submissions' });
  }
});

// Export grades
router.get('/grades/class/:classId/export', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { format = 'csv' } = req.query;
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && !classDoc.instructors.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get all submissions for the class
    const submissions = await Submission.find({ classId })
      .populate('studentId', 'name email')
      .populate('assignmentId', 'title points')
      .sort({ 'studentId.name': 1, 'assignmentId.title': 1 });
    
    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Student Name,Student Email,Assignment,Grade,Max Points,Percentage,Status,Submitted At,Graded At\n';
      const csvRows = submissions.map(sub => {
        const percentage = sub.grade && sub.assignmentId.points 
          ? ((sub.grade / sub.assignmentId.points) * 100).toFixed(2)
          : 'N/A';
        
        return [
          sub.studentId.name,
          sub.studentId.email,
          sub.assignmentId.title,
          sub.grade || 'Not Graded',
          sub.assignmentId.points,
          percentage + '%',
          sub.status,
          sub.submittedAt ? sub.submittedAt.toISOString() : 'Not Submitted',
          sub.gradedAt ? sub.gradedAt.toISOString() : 'Not Graded'
        ].join(',');
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="grades-${classDoc.name}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON format
      res.json({ submissions });
    }
  } catch (error) {
    console.error('Failed to export grades:', error);
    res.status(500).json({ error: 'Failed to export grades' });
  }
});

// Real-time activity monitoring
router.get('/activity/class/:classId/live', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Verify access
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    if (req.user.role !== 'admin' && !classDoc.instructors.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get current online students
    const onlineStudents = [];
    if (req.io) {
      const sockets = await req.io.in(`class-${classId}`).fetchSockets();
      sockets.forEach(socket => {
        if (socket.userRole === 'student') {
          onlineStudents.push({
            userId: socket.userId,
            socketId: socket.id,
            connectedAt: socket.handshake.time
          });
        }
      });
    }
    
    // Get recent activity (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentProgress = await Progress.find({
      classId,
      lastAccessed: { $gte: yesterday }
    }).populate('userId', 'name').sort({ lastAccessed: -1 });
    
    const recentSubmissions = await Submission.find({
      classId,
      submittedAt: { $gte: yesterday }
    }).populate('studentId', 'name').populate('assignmentId', 'title').sort({ submittedAt: -1 });
    
    res.json({
      onlineStudents,
      recentActivity: {
        progress: recentProgress.map(p => ({
          studentName: p.userId.name,
          lessonId: p.lessonId,
          progress: p.completionPercentage,
          timestamp: p.lastAccessed
        })),
        submissions: recentSubmissions.map(s => ({
          studentName: s.studentId.name,
          assignmentTitle: s.assignmentId.title,
          timestamp: s.submittedAt
        }))
      }
    });
  } catch (error) {
    console.error('Failed to fetch live activity:', error);
    res.status(500).json({ error: 'Failed to fetch live activity' });
  }
});

module.exports = router;