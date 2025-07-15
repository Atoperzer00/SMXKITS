const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const socketio = require('socket.io');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Initialize Express app
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

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/smxkits', { 
  useNewUrlParser: true, 
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Continuing without MongoDB - some features may not work');
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
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

// Import models
const User = require('./models/User');
const Class = require('./models/Class');
const Lesson = require('./models/Lesson');
const StreamSession = require('./models/StreamSession');
const Callout = require('./models/Callout');

// JWT Authentication middleware
function auth(req, res, next) {
  const token = req.header('x-auth-token');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    const decoded = jwt.verify(token, 'smxkits-jwt-secret'); // Replace with a proper environment variable in production
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid' });
  }
}

// Socket.io viewer tracking
const activeViewers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Join class room
  socket.on('joinClass', (classKey) => {
    socket.join(classKey);
    
    // Increment viewer count
    if (!activeViewers.has(classKey)) {
      activeViewers.set(classKey, new Set());
    }
    activeViewers.get(classKey).add(socket.id);
    
    // Broadcast updated viewer count
    io.to(classKey).emit('viewerCount', {
      count: activeViewers.get(classKey).size
    });
    
    console.log(`Client ${socket.id} joined class ${classKey}. Active viewers: ${activeViewers.get(classKey).size}`);
  });
  
  socket.on('leaveClass', (classKey) => {
    socket.leave(classKey);
    
    // Decrement viewer count
    if (activeViewers.has(classKey)) {
      activeViewers.get(classKey).delete(socket.id);
      
      // Broadcast updated viewer count
      io.to(classKey).emit('viewerCount', {
        count: activeViewers.get(classKey).size
      });
      
      console.log(`Client ${socket.id} left class ${classKey}. Active viewers: ${activeViewers.get(classKey).size}`);
    }
  });
  
  // Handle notices/messages
  socket.on('sendNotice', ({ classKey, msg, userId }) => {
    io.to(classKey).emit('notice', { msg, userId });
    
    // Save message to database
    if (classKey && msg && userId) {
      StreamSession.findOne({ 'classId.streamKey': classKey, status: 'live' })
        .then(session => {
          if (session) {
            session.messages.push({
              userId,
              message: msg
            });
            session.save();
          }
        })
        .catch(err => console.error('Error saving message:', err));
    }
  });
  
  // Handle chat messages
  socket.on('sendMessage', ({ classKey, message, userId, username }) => {
    io.to(classKey).emit('message', { message, userId, username, timestamp: new Date() });
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    
    // Remove from all class viewer counts
    activeViewers.forEach((viewers, classKey) => {
      if (viewers.has(socket.id)) {
        viewers.delete(socket.id);
        
        // Broadcast updated viewer count
        io.to(classKey).emit('viewerCount', {
          count: viewers.size
        });
        
        console.log(`Client ${socket.id} disconnected from class ${classKey}. Active viewers: ${viewers.size}`);
      }
    });
  });
  
  // Ops Log room joining
  socket.on('join_room', roomId => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined Ops Log room ${roomId}`);
  });
  
  // KitComm room joining
  socket.on('join', (room) => {
    socket.join(room);
    console.log(`Client ${socket.id} joined KitComm room ${room}`);
  });
  
  socket.on('leave', (room) => {
    socket.leave(room);
    console.log(`Client ${socket.id} left KitComm room ${room}`);
  });
});

// API Routes

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      username,
      email,
      passwordHash: password,
      role: role || 'student'
    });
    
    await user.save();
    
    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      'smxkits-jwt-secret', // Replace with a proper environment variable in production
      { expiresIn: '1d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      'smxkits-jwt-secret', // Replace with a proper environment variable in production
      { expiresIn: '1d' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Class routes
app.get('/api/classes', auth, async (req, res) => {
  try {
    let classes;
    
    switch (req.user.role) {
      case 'admin':
        // Admins can see all classes
        classes = await Class.find().populate('instructors students', 'username email');
        break;
      case 'instructor':
        // Instructors can see classes they teach
        classes = await Class.find({ instructors: req.user.id }).populate('instructors students', 'username email');
        break;
      case 'student':
        // Students can see classes they're enrolled in
        classes = await Class.find({ students: req.user.id }).populate('instructors', 'username email');
        break;
      default:
        return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json(classes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/classes/:id', auth, async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id)
      .populate('instructors students', 'username email')
      .populate('currentLesson');
    
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if user has access to this class
    if (req.user.role !== 'admin' && 
        !classObj.instructors.some(inst => inst._id.toString() === req.user.id) && 
        !classObj.students.some(stu => stu._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Get active session if exists
    const activeSession = await StreamSession.findOne({ 
      classId: classObj._id, 
      status: { $ne: 'offline' } 
    }).sort({ startedAt: -1 });
    
    res.json({
      ...classObj.toObject(),
      activeSession: activeSession || null,
      viewerCount: activeViewers.has(classObj.streamKey) ? activeViewers.get(classObj.streamKey).size : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/classes', auth, async (req, res) => {
  try {
    // Only admins can create classes
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const { name, description, instructorIds, studentIds } = req.body;
    
    const newClass = new Class({
      name,
      description,
      instructors: instructorIds || [req.user.id],
      students: studentIds || []
    });
    
    // Generate stream key
    newClass.generateStreamKey();
    
    await newClass.save();
    
    res.status(201).json(newClass);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Lesson routes
app.get('/api/lessons', auth, async (req, res) => {
  try {
    const { classId } = req.query;
    
    if (classId) {
      // Check if user has access to this class
      const classObj = await Class.findById(classId);
      
      if (!classObj) {
        return res.status(404).json({ message: 'Class not found' });
      }
      
      if (req.user.role !== 'admin' && 
          !classObj.instructors.some(inst => inst.toString() === req.user.id) && 
          !classObj.students.some(stu => stu.toString() === req.user.id)) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      
      const lessons = await Lesson.find({ classId }).sort({ order: 1 });
      return res.json(lessons);
    }
    
    // If no classId provided, return based on role
    if (req.user.role === 'admin') {
      // Admins can see all lessons
      const lessons = await Lesson.find().sort({ createdAt: -1 });
      return res.json(lessons);
    } else if (req.user.role === 'instructor') {
      // Instructors can see lessons they created
      const lessons = await Lesson.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
      return res.json(lessons);
    } else {
      // Students can only see lessons for classes they're enrolled in
      const studentClasses = await Class.find({ students: req.user.id });
      const classIds = studentClasses.map(c => c._id);
      const lessons = await Lesson.find({ classId: { $in: classIds } }).sort({ order: 1 });
      return res.json(lessons);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/lessons', auth, upload.single('file'), async (req, res) => {
  try {
    // Only admins and instructors can upload lessons
    if (req.user.role !== 'admin' && req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { title, description, module, order, classId } = req.body;
    
    // Check if user has access to this class
    if (classId) {
      const classObj = await Class.findById(classId);
      
      if (!classObj) {
        return res.status(404).json({ message: 'Class not found' });
      }
      
      if (req.user.role !== 'admin' && 
          !classObj.instructors.some(inst => inst.toString() === req.user.id)) {
        return res.status(403).json({ message: 'Unauthorized' });
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stream control routes
app.post('/api/classes/:id/startStream', auth, async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id);
    
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if user is an instructor for this class
    if (req.user.role !== 'admin' && 
        !classObj.instructors.some(inst => inst.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Check if there's already an active session
    const existingSession = await StreamSession.findOne({ 
      classId: classObj._id, 
      status: { $ne: 'offline' } 
    });
    
    if (existingSession) {
      return res.status(400).json({ message: 'Class already has an active streaming session' });
    }
    
    // Create new session
    const session = new StreamSession({
      classId: {
        _id: classObj._id,
        name: classObj.name,
        streamKey: classObj.streamKey
      },
      status: 'live',
      startedAt: new Date(),
      startedBy: req.user.id
    });
    
    await session.save();
    
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/classes/:id/stopStream', auth, async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id);
    
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if user is an instructor for this class
    if (req.user.role !== 'admin' && 
        !classObj.instructors.some(inst => inst.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Find active session
    const session = await StreamSession.findOne({ 
      'classId._id': classObj._id, 
      status: { $ne: 'offline' } 
    });
    
    if (!session) {
      return res.status(404).json({ message: 'No active streaming session found' });
    }
    
    // Update session
    session.status = 'offline';
    session.endedAt = new Date();
    session.endedBy = req.user.id;
    
    await session.save();
    
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/classes/:id/sendNotice', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Notice text is required' });
    }
    
    const classObj = await Class.findById(req.params.id);
    
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if user is an instructor for this class
    if (req.user.role !== 'admin' && 
        !classObj.instructors.some(inst => inst.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Emit notice to connected clients
    io.to(classObj.streamKey).emit('notice', {
      message,
      userId: req.user.id,
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Viewer count route
app.get('/api/classes/:id/viewers', auth, async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id);
    
    if (!classObj) {
      return res.status(404).json({ message: 'Class not found' });
    }
    
    // Check if user has access to this class
    if (req.user.role !== 'admin' && 
        !classObj.instructors.some(inst => inst.toString() === req.user.id) && 
        !classObj.students.some(stu => stu.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const viewerCount = activeViewers.has(classObj.streamKey) ? 
      activeViewers.get(classObj.streamKey).size : 0;
    
    res.json({ count: viewerCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Callout Routes (Ops Log)
// Get all callouts for a room
app.get('/api/callouts/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  const logs = await Callout.find({ roomId }).sort({ createdAt: -1 });
  res.json(logs);
});

// Create callout
app.post('/api/callouts', async (req, res) => {
  const callout = await Callout.create(req.body);
  io.to(callout.roomId).emit('new_callout', callout);
  res.json(callout);
});

// Edit callout
app.put('/api/callouts/:id', async (req, res) => {
  const id = req.params.id;
  const current = await Callout.findById(id);
  if (!current) return res.status(404).end();

  // Save previous version to history
  current.history.push({
    editedBy: req.body.editedBy || 'Unknown',
    editedAt: new Date(),
    changes: { ...current.toObject() }
  });
  // Update fields
  Object.assign(current, req.body, { editedAt: new Date() });
  await current.save();
  io.to(current.roomId).emit('update_callout', current);
  res.json(current);
});

// Delete callout
app.delete('/api/callouts/:id', async (req, res) => {
  const callout = await Callout.findByIdAndDelete(req.params.id);
  if (callout) io.to(callout.roomId).emit('delete_callout', callout._id);
  res.json({ ok: true });
});

// Get callout history
app.get('/api/callouts/:id/history', async (req, res) => {
  const callout = await Callout.findById(req.params.id);
  if (!callout) return res.status(404).end();
  res.json(callout.history || []);
});

// KitComm Routes
const kitcommRoutes = require('../routes/kitcomm');
app.use('/api/kitcomm', kitcommRoutes);

// Make io available to routes
app.set('io', io);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start server
const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`SMX Backend running on port ${PORT}`);
});