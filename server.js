const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

// Debug environment variables
console.log('Environment check:');
console.log('PORT:', process.env.PORT);
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set (Atlas)' : 'Not set - will use default');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Define root route before static middleware to ensure it takes precedence
app.get('/', (req, res) => {
  console.log('Root route accessed - redirecting to login page');
  res.redirect('/login.html');
});

// Explicitly handle /index.html and redirect to login
app.get('/index.html', (req, res) => {
  res.redirect('/login.html');
});

// Serve static files from the public directory (primary)
app.use(express.static('public'));

// Serve static files from root as fallback
app.use(express.static('.'));

// Function to create default users
async function createDefaultUsers() {
  try {
    const defaultUsers = [
      { username: 'admin', password: 'admin123', role: 'admin', name: 'System Administrator' },
      { username: 'instructor', password: 'instructor123', role: 'instructor', name: 'Demo Instructor' },
      { username: 'student', password: 'student123', role: 'student', name: 'Demo Student' }
    ];

    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ username: userData.username });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = new User({
          username: userData.username,
          password: hashedPassword,
          role: userData.role,
          name: userData.name
        });
        await user.save();
        console.log(`✅ Created default ${userData.role}: ${userData.username}`);
      } else {
        console.log(`ℹ️ Default ${userData.role} already exists: ${userData.username}`);
      }
    }
  } catch (error) {
    console.error('❌ Error creating default users:', error);
  }
}

// MongoDB connection with in-memory fallback
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/smxkits';

// In-memory user storage as fallback
global.inMemoryUsers = [];
global.usingInMemory = false;

async function connectToDatabase() {
  const options = {
    serverSelectionTimeoutMS: 10000,
    // Remove any deprecated options
    // Use unified topology (recommended for newer MongoDB versions)
    useNewUrlParser: true,
    useUnifiedTopology: true
  };

  try {
    console.log('🔄 Attempting MongoDB connection...');
    await mongoose.connect(mongoURI, options);
    console.log('✅ MongoDB connected successfully!');
    await createDefaultUsers();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('🔄 Switching to in-memory database for demo...');
    
    // Use in-memory storage
    global.usingInMemory = true;
    await createInMemoryUsers();
    console.log('✅ In-memory database ready!');
  }
}

// Create default users in memory
async function createInMemoryUsers() {
  const bcrypt = require('bcryptjs');
  
  const defaultUsers = [
    { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
    { username: 'instructor', password: 'instructor123', role: 'instructor', name: 'Instructor' },
    { username: 'student', password: 'student123', role: 'student', name: 'Student' }
  ];

  for (const userData of defaultUsers) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    global.inMemoryUsers.push({
      _id: userData.username,
      username: userData.username,
      password: hashedPassword,
      role: userData.role,
      name: userData.name,
      classId: userData.role === 'student' ? 'demo-class' : null
    });
  }
  
  console.log('✅ Created in-memory users: admin, instructor, student');
}

connectToDatabase();

// Add connection event listeners for better monitoring
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('🛑 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// ===== OpsLog Mongoose Schema =====
const calloutSchema = new mongoose.Schema({
  roomId: String,
  classification: String,
  asset: String,
  sensor: String,
  operation: String,
  countryCode: String,
  team: String,
  zulu: String,
  mgrs: String,
  location: String,
  activity: String,
  males: Number,
  females: Number,
  children: Number,
  iaNotes: String,
  follow: {
    name: String,
    stage: String,
    followId: { type: String, default: () => Math.random().toString(36).substr(2, 6).toUpperCase() },
    ended: { type: Boolean, default: false }
  },
  qc: { type: String, default: "qc-orange" },
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  editedAt: Date,
  history: [
    {
      editedBy: String,
      editedAt: Date,
      changes: Object
    }
  ]
});
const Callout = mongoose.model('Callout', calloutSchema);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/kitcomm', require('./routes/kitcomm'));
app.use('/api/streams', require('./routes/streams'));
app.use('/api/stream', require('./routes/stream-upload.route'));
const feedbackRoutes = require('./routes/feedback.route');
app.use('/api/feedback', feedbackRoutes);

// ===== OpsLog API Routes =====
// Get all callouts for a room
app.get('/api/callouts/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  try {
    const logs = await Callout.find({ roomId }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    console.error('❌ Error fetching callouts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create callout
app.post('/api/callouts', async (req, res) => {
  try {
    const callout = await Callout.create(req.body);
    io.to(callout.roomId).emit('new_callout', callout);
    res.json(callout);
  } catch (error) {
    console.error('❌ Error creating callout:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit callout
app.put('/api/callouts/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const current = await Callout.findById(id);
    if (!current) return res.status(404).json({ message: 'Callout not found' });
    
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
  } catch (error) {
    console.error('❌ Error updating callout:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete callout
app.delete('/api/callouts/:id', async (req, res) => {
  try {
    const callout = await Callout.findByIdAndDelete(req.params.id);
    if (callout) io.to(callout.roomId).emit('delete_callout', callout._id);
    res.json({ ok: true });
  } catch (error) {
    console.error('❌ Error deleting callout:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get callout history
app.get('/api/callouts/:id/history', async (req, res) => {
  try {
    const callout = await Callout.findById(req.params.id);
    if (!callout) return res.status(404).json({ message: 'Callout not found' });
    res.json(callout.history || []);
  } catch (error) {
    console.error('❌ Error fetching callout history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve temporary stream files (for testing/preview)
app.use('/temp', express.static(path.join(__dirname, 'temp')));

// Protected routes - require authentication
const jwt = require('jsonwebtoken');

// Middleware to check authentication for protected pages
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.redirect('/login.html');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch (error) {
    return res.redirect('/login.html');
  }
}

// Serve protected dashboard with server-side check
app.get('/dashboard.html', (req, res) => {
  // Simply serve the file - client-side JS will handle authentication
  res.sendFile(__dirname + '/public/dashboard.html');
});

// Serve admin dashboard with client-side auth check
app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(__dirname + '/public/admin-dashboard.html');
});

// Make io available to routes
app.set('io', io);

// ===== STREAM FILE SERVING ENDPOINTS =====

// Serve uploaded stream files
app.get('/api/stream/file/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const Class = require('./models/Class');
    
    const classObj = await Class.findById(classId);
    if (!classObj || !classObj.currentStreamFile) {
      return res.status(404).json({ error: 'No stream file found for this class' });
    }
    
    const filePath = path.join(__dirname, 'uploads', classObj.currentStreamFile);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Stream file not found on disk' });
    }
    
    // Set appropriate headers for video streaming
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // Support range requests for video seeking
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
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
    
  } catch (error) {
    console.error('Error serving stream file:', error);
    res.status(500).json({ error: 'Failed to serve stream file' });
  }
});

// Get current stream state for late joiners
app.get('/api/stream/state/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const io = req.app.get('io');
    
    // Get stream state from memory (managed by Socket.IO handlers)
    const streamStates = io.streamStates || new Map();
    const state = streamStates.get(classId);
    
    if (state) {
      res.json({
        ...state,
        timeSinceStart: Date.now() - new Date(state.startTime).getTime()
      });
    } else {
      // Try to get from database as fallback
      const Class = require('./models/Class');
      const classObj = await Class.findById(classId);
      
      if (classObj && classObj.streamStatus === 'live') {
        res.json({
          streamUrl: classObj.currentStreamFile ? `/api/stream/file/${classId}` : null,
          currentTime: 0,
          playing: true,
          startTime: new Date().toISOString(),
          timeSinceStart: 0
        });
      } else {
        res.status(404).json({ error: 'No active stream found' });
      }
    }
    
  } catch (error) {
    console.error('Error getting stream state:', error);
    res.status(500).json({ error: 'Failed to get stream state' });
  }
});

// Update stream state (for instructors)
app.post('/api/stream/state/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const { currentTime, playing, streamUrl } = req.body;
    const io = req.app.get('io');
    
    // Store in memory for Socket.IO
    if (!io.streamStates) io.streamStates = new Map();
    
    const state = {
      currentTime,
      playing,
      streamUrl,
      startTime: io.streamStates.get(classId)?.startTime || new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    };
    
    io.streamStates.set(classId, state);
    
    // Broadcast to all connected students
    io.to(`stream:class_${classId}`).emit('stream:time', {
      time: currentTime,
      playing,
      timestamp: new Date().toISOString()
    });
    
    res.json({ success: true, state });
    
  } catch (error) {
    console.error('Error updating stream state:', error);
    res.status(500).json({ error: 'Failed to update stream state' });
  }
});

// Real-time chat and streaming with MongoDB storage
io.on('connection', socket => {
  console.log('🔌 New socket connection established');
  
  // ===== OPSLOG HANDLERS =====
  socket.on('join_room', roomId => {
    console.log(`👤 User joined OpsLog room: ${roomId}`);
    socket.join(roomId);
  });
  
  // ===== FILE SUBMISSION HANDLERS =====
  // Handle file submissions from mission-links to instructor grading
  socket.on('file-submission', (data) => {
    console.log('📁 File submission received:', data.fileName);
    
    // Create submission object
    const submission = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      studentName: data.studentName || 'Unknown Student',
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      fileData: data.fileData,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      vaultType: data.vaultType // 'slideVault' or 'sheetVault'
    };
    
    // Broadcast to all instructor grading pages
    io.emit('new-file-submission', submission);
    
    console.log(`📤 File submission broadcasted: ${data.fileName} from ${data.vaultType}`);
  });
  
  // Handle instructor joining grading room
  socket.on('join-instructor-grading', () => {
    console.log('👨‍🏫 Instructor joined grading room');
    socket.join('instructor-grading');
  });
  
  // Handle student joining mission links
  socket.on('join-mission-links', (studentData) => {
    console.log('👤 Student joined mission links:', studentData.name);
    socket.studentName = studentData.name;
    socket.join('mission-links');
  });
  
  // ===== STREAMING HANDLERS =====
  // Track connected viewers
  const activeStreamRooms = new Set();
  
  // ===== WEBRTC HANDLERS =====
  // Track WebRTC connections
  const webrtcRooms = new Map(); // classId -> { instructor: socketId, students: Set<socketId> }
  
  // Instructor joins class for WebRTC streaming
  socket.on('instructor-join-class', (data) => {
    const { classId } = data;
    console.log(`🎓 Instructor joined class: ${classId} (Socket: ${socket.id})`);
    
    if (!webrtcRooms.has(classId)) {
      webrtcRooms.set(classId, { instructor: null, students: new Set() });
    }
    
    const room = webrtcRooms.get(classId);
    room.instructor = socket.id;
    
    // Join both WebRTC room and streaming room
    socket.join(`webrtc:${classId}`);
    const streamRoomName = `class:${classId}`;
    socket.join(streamRoomName);
    
    socket.classId = classId;
    socket.role = 'instructor';
    socket.currentStreamRoom = streamRoomName;
    socket.isInstructor = true;
    
    console.log(`👨‍🏫 Instructor joined streaming room: ${streamRoomName}`);
    
    // Initialize viewer count for instructor
    const roomMembers = io.sockets.adapter.rooms.get(streamRoomName);
    const viewerCount = roomMembers ? roomMembers.size - 1 : 0; // Subtract instructor
    console.log(`👥 Viewer count for ${streamRoomName}: ${viewerCount}`);
    socket.emit('viewerCount', { count: viewerCount });
    
    // Send confirmation to instructor
    socket.emit('stream:instructor-ready', {
      message: 'Ready to broadcast to class',
      classId: classId,
      timestamp: new Date().toISOString()
    });
  });
  
  // Student joins class for WebRTC streaming
  socket.on('student-join-class', (data) => {
    const { classId } = data;
    console.log(`👤 Student joined class: ${classId} (Socket: ${socket.id})`);
    
    if (!webrtcRooms.has(classId)) {
      webrtcRooms.set(classId, { instructor: null, students: new Set() });
    }
    
    const room = webrtcRooms.get(classId);
    room.students.add(socket.id);
    
    // Join both WebRTC room and streaming room
    socket.join(`webrtc:${classId}`);
    const streamRoomName = `class:${classId}`;
    socket.join(streamRoomName);
    
    socket.classId = classId;
    socket.role = 'student';
    socket.currentStreamRoom = streamRoomName;
    socket.isInstructor = false;
    
    console.log(`🎓 Student joined streaming room: ${streamRoomName}`);
    
    // Notify instructor that a student joined
    if (room.instructor) {
      io.to(room.instructor).emit('student-joined', { 
        studentId: socket.id,
        classId: classId 
      });
    }
    
    // Send current stream state to late joiner
    if (io.streamStates && io.streamStates.has(classId)) {
      const currentState = io.streamStates.get(classId);
      console.log(`📥 Sending current stream state to student ${socket.id}:`, currentState);
      socket.emit('stream:current-state', currentState);
    } else {
      console.log(`ℹ️ No active stream state for class: ${classId}, sending no-state`);
      socket.emit('stream:no-state', { classId });
    }
    
    // Update viewer count for the instructor
    const roomMembers = io.sockets.adapter.rooms.get(streamRoomName);
    const viewerCount = roomMembers ? roomMembers.size - 1 : 0; // Subtract instructor
    console.log(`👥 Updated viewer count for ${streamRoomName}: ${viewerCount}`);
    io.to(streamRoomName).emit('viewerCount', { count: viewerCount });
  });
  
  // Instructor starts WebRTC streaming
  socket.on('instructor-start-webrtc', (data) => {
    const { classId, mediaType } = data;
    console.log(`🔴 Instructor started WebRTC stream for class ${classId}: ${mediaType}`);
    
    // Notify all students in the class via WebRTC socket
    socket.to(`webrtc:${classId}`).emit('instructor-started-webrtc', {
      classId: classId,
      mediaType: mediaType
    });
    
    // Also notify via regular streaming socket for status updates
    socket.to(`class:${classId}`).emit('streamStatus', {
      status: 'live',
      source: 'webrtc',
      mediaType: mediaType,
      classId: classId
    });
  });

  // Get existing students for peer connection setup
  socket.on('get-existing-students', (data) => {
    const { classId } = data;
    console.log(`📋 Getting existing students for class ${classId}`);
    
    if (webrtcRooms.has(classId)) {
      const room = webrtcRooms.get(classId);
      const students = Array.from(room.students);
      console.log(`👥 Found ${students.length} existing students:`, students);
      
      // Send each student as a "joined" event to trigger peer connection creation
      students.forEach(studentId => {
        socket.emit('student-joined', { 
          studentId: studentId,
          classId: classId 
        });
      });
    }
  });
  
  // Instructor stops WebRTC streaming
  socket.on('instructor-stop-webrtc', (data) => {
    const { classId } = data;
    console.log(`⏹️ Instructor stopped WebRTC stream for class ${classId}`);
    
    // Notify all students in the class
    socket.to(`webrtc:${classId}`).emit('instructor-stopped-webrtc', {
      classId: classId
    });
  });
  
  // WebRTC Signaling - Offer from instructor to student
  socket.on('webrtc-offer', (data) => {
    const { to, offer } = data;
    console.log(`📡 Forwarding WebRTC offer from ${socket.id} to ${to}`);
    
    io.to(to).emit('webrtc-offer', {
      from: socket.id,
      offer: offer
    });
  });
  
  // WebRTC Signaling - Answer from student to instructor
  socket.on('webrtc-answer', (data) => {
    const { to, answer } = data;
    console.log(`📡 Forwarding WebRTC answer from ${socket.id} to instructor`);
    
    // Find instructor in the same class
    const classId = socket.classId;
    if (classId && webrtcRooms.has(classId)) {
      const room = webrtcRooms.get(classId);
      if (room.instructor) {
        io.to(room.instructor).emit('webrtc-answer', {
          from: socket.id,
          answer: answer
        });
      }
    }
  });
  
  // WebRTC Signaling - ICE Candidates
  socket.on('webrtc-ice-candidate', (data) => {
    const { to, candidate } = data;
    
    if (to === 'instructor') {
      // Student sending to instructor
      const classId = socket.classId;
      if (classId && webrtcRooms.has(classId)) {
        const room = webrtcRooms.get(classId);
        if (room.instructor) {
          io.to(room.instructor).emit('webrtc-ice-candidate', {
            from: socket.id,
            candidate: candidate
          });
        }
      }
    } else {
      // Instructor sending to specific student
      io.to(to).emit('webrtc-ice-candidate', {
        from: socket.id,
        candidate: candidate
      });
    }
  });
  
  // WebRTC Stream Control - Instructor started streaming
  socket.on('instructor-started-webrtc', (data) => {
    const { classId, mediaType } = data;
    console.log(`🔴 Instructor started WebRTC streaming in class ${classId}: ${mediaType}`);
    
    // Notify all students in the class
    io.to(`webrtc:${classId}`).emit('instructor-started-webrtc', {
      mediaType: mediaType
    });
  });
  
  // WebRTC Stream Control - Instructor stopped streaming
  socket.on('instructor-stopped-webrtc', (data) => {
    const { classId } = data;
    console.log(`⏹️ Instructor stopped WebRTC streaming in class ${classId}`);
    
    // Notify all students in the class
    io.to(`webrtc:${classId}`).emit('instructor-stopped-webrtc', {});
  });
  
  // ===== LIVE STREAMING SYNCHRONIZATION HANDLERS =====
  
  // Combined instructor/student join class handler for streaming
  socket.on('join-class-stream', (data) => {
    const { classId, role } = data;
    const roomName = `class:${classId}`;
    
    console.log(`${role === 'instructor' ? '👨‍🏫' : '🎓'} ${role} joined class room: ${roomName}`);
    socket.join(roomName);
    socket.currentStreamRoom = roomName;
    socket.classId = classId;
    socket.isInstructor = role === 'instructor';
    
    if (role === 'instructor') {
      // Send confirmation to instructor
      socket.emit('stream:instructor-ready', {
        message: 'Ready to broadcast to class',
        classId: classId,
        timestamp: new Date().toISOString()
      });
    } else {
      // Send current stream state to new student
      const streamState = io.streamStates?.get(classId);
      if (streamState) {
        socket.emit('stream:current-state', streamState);
      } else {
        socket.emit('stream:no-state', { message: 'No active stream' });
      }
      
      // Update viewer count for the class
      const roomMembers = io.sockets.adapter.rooms.get(roomName);
      const viewerCount = roomMembers ? roomMembers.size - 1 : 0; // Subtract instructor
      io.to(roomName).emit('viewerCount', { count: viewerCount });
    }
  });
  
  // Legacy support for old join-stream method
  socket.on('join-stream', async (data) => {
    console.log('🔌 Legacy join-stream called with data:', data);
    
    // Handle both string and object formats
    let streamKey, classId;
    
    if (typeof data === 'string') {
      streamKey = data;
    } else if (typeof data === 'object' && data !== null) {
      streamKey = data.streamKey;
      classId = data.classId;
    }
    
    console.log('📋 Extracted streamKey:', streamKey, 'classId:', classId);
    
    // Convert to new class-based system if classId is available
    if (classId) {
      console.log('🔄 Redirecting to class-based system for classId:', classId);
      socket.emit('student-join-class', { classId });
      return;
    }
    
    // Handle streamKey-based joining (legacy)
    if (streamKey) {
      try {
        const Class = require('./models/Class');
        const classObj = await Class.findOne({ streamKey });
        
        if (classObj) {
          console.log('🔄 Found class by streamKey, redirecting to class-based system');
          socket.emit('student-join-class', { classId: classObj._id.toString() });
        } else {
          console.log('❌ No class found for streamKey:', streamKey);
          socket.emit('error', { message: 'Stream not found' });
        }
      } catch (error) {
        console.error('❌ Error in legacy join-stream handler:', error);
        socket.emit('error', { message: 'Failed to join stream' });
      }
    } else {
      console.log('❌ No valid streamKey or classId provided');
      socket.emit('error', { message: 'Invalid stream data' });
    }
  });
  
  // Instructor stream control events
  socket.on('stream:init', (data) => {
    const classId = socket.classId;
    if (!classId) {
      console.warn('⚠️ No classId for stream:init from socket:', socket.id);
      return;
    }
    
    if (!socket.isInstructor) {
      console.warn('⚠️ Non-instructor trying to init stream:', socket.id);
      return;
    }
    
    console.log('🎬 Stream initialized by instructor for class:', classId);
    console.log('📋 Stream data:', data);
    
    // Store stream state
    if (!io.streamStates) {
      io.streamStates = new Map();
    }
    
    const streamState = {
      streamUrl: data.streamUrl,
      startTime: data.startTime || new Date().toISOString(),
      currentTime: data.currentTime || 0,
      playing: data.playing || false,
      filename: data.filename,
      lastUpdate: new Date().toISOString()
    };
    
    io.streamStates.set(classId, streamState);
    console.log('💾 Stored stream state for class:', classId);
    
    // Broadcast to all students in the class
    const roomName = `class:${classId}`;
    const roomMembers = io.sockets.adapter.rooms.get(roomName);
    const memberCount = roomMembers ? roomMembers.size : 0;
    
    console.log(`📡 Broadcasting stream:init to room: ${roomName} (${memberCount} members)`);
    socket.to(roomName).emit('stream:init', streamState);
    
    // Also send as streamStatus for compatibility
    socket.to(roomName).emit('streamStatus', {
      status: 'live',
      source: 'upload',
      streamUrl: data.streamUrl,
      filename: data.filename
    });
    
    console.log('✅ Stream broadcast completed');
  });
  
  // Handle streamStatus events from instructor (for compatibility)
  socket.on('streamStatus', (data) => {
    const classId = socket.classId;
    if (!classId || !socket.isInstructor) {
      console.warn('⚠️ streamStatus from non-instructor or no classId');
      return;
    }
    
    console.log('📡 Instructor sent streamStatus:', data);
    
    // Broadcast to all students in the class
    const roomName = `class:${classId}`;
    socket.to(roomName).emit('streamStatus', data);
    
    // Also update stream state if it's a live status
    if (data.status === 'live' && data.streamUrl) {
      if (!io.streamStates) {
        io.streamStates = new Map();
      }
      
      const streamState = {
        streamUrl: data.streamUrl,
        startTime: new Date().toISOString(),
        currentTime: 0,
        playing: true,
        filename: data.filename,
        lastUpdate: new Date().toISOString()
      };
      
      io.streamStates.set(classId, streamState);
      console.log('💾 Stored stream state for class:', classId);
    }
  });
  
  // Initialize stream states if not exists
  if (!io.streamStates) {
    io.streamStates = new Map();
  }
  
  // Handle stream state updates from instructor
  socket.on('stream:state-update', (data) => {
    const { classId, ...stateData } = data;
    if (!classId) return;
    
    console.log('📊 Stream state update for class:', classId, stateData);
    
    // Store the current state
    io.streamStates.set(classId, {
      ...stateData,
      lastUpdate: new Date().toISOString(),
      timeSinceStart: Date.now() - new Date(stateData.startTime).getTime()
    });
    
    // Broadcast to students in the class
    const classRoom = `class:${classId}`;
    socket.to(classRoom).emit('stream:state-sync', stateData);
  });
  
  // Initialize throttle tracking
  if (!socket.lastTimeUpdate) {
    socket.lastTimeUpdate = 0;
  }
  
  socket.on('stream:play', (data) => {
    if (!socket.currentStreamRoom || !socket.isInstructor) return;
    
    console.log('▶️ Instructor played stream at:', data.time);
    
    // Update stream state
    const classId = socket.classId;
    const state = io.streamStates.get(classId) || {};
    const updatedState = {
      ...state,
      currentTime: data.time,
      playing: true,
      lastUpdate: new Date().toISOString(),
      startTime: state.startTime || new Date().toISOString()
    };
    io.streamStates.set(classId, updatedState);
    
    socket.to(socket.currentStreamRoom).emit('stream:play', {
      time: data.time,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('stream:pause', (data) => {
    if (!socket.currentStreamRoom || !socket.isInstructor) return;
    
    console.log('⏸️ Instructor paused stream at:', data.time);
    
    // Update stream state
    const classId = socket.classId;
    const state = io.streamStates.get(classId) || {};
    const updatedState = {
      ...state,
      currentTime: data.time,
      playing: false,
      lastUpdate: new Date().toISOString(),
      startTime: state.startTime || new Date().toISOString()
    };
    io.streamStates.set(classId, updatedState);
    
    socket.to(socket.currentStreamRoom).emit('stream:pause', {
      time: data.time,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('stream:seek', (data) => {
    if (!socket.currentStreamRoom || !socket.isInstructor) return;
    
    console.log('⏭️ Instructor seeked to:', data.time);
    
    // Update stream state
    const classId = socket.classId;
    const state = io.streamStates.get(classId) || {};
    const updatedState = {
      ...state,
      currentTime: data.time,
      lastUpdate: new Date().toISOString(),
      startTime: state.startTime || new Date().toISOString()
    };
    io.streamStates.set(classId, updatedState);
    
    socket.to(socket.currentStreamRoom).emit('stream:seek', {
      time: data.time,
      timestamp: new Date().toISOString()
    });
  });
  
  // Throttled time updates (max once every 500ms)
  socket.on('stream:time', (data) => {
    if (!socket.currentStreamRoom || !socket.isInstructor) return;
    
    const now = Date.now();
    if (now - socket.lastTimeUpdate < 500) return; // Throttle to 500ms
    socket.lastTimeUpdate = now;
    
    // Update stream state
    const classId = socket.classId;
    const state = io.streamStates.get(classId) || {};
    const updatedState = {
      ...state,
      currentTime: data.time,
      playing: data.playing,
      lastUpdate: new Date().toISOString(),
      startTime: state.startTime || new Date().toISOString()
    };
    io.streamStates.set(classId, updatedState);
    
    socket.to(socket.currentStreamRoom).emit('stream:time', {
      time: data.time,
      playing: data.playing,
      timestamp: new Date().toISOString()
    });
  });
  

  

  
  // Leave stream room
  socket.on('leaveStream', (streamKey) => {
    if (!streamKey) return;
    
    const roomName = `stream:${streamKey}`;
    socket.leave(roomName);
    
    console.log(`👤 User left stream: ${streamKey}`);
    
    // Broadcast updated viewer count
    const roomMembers = io.sockets.adapter.rooms.get(roomName);
    const viewerCount = roomMembers ? roomMembers.size : 0;
    io.to(roomName).emit('viewerCount', { count: viewerCount });
  });
  
  // Handle stream chat messages
  socket.on('streamMessage', async (data) => {
    try {
      const { streamKey, message, userId, userName } = data;
      
      if (!streamKey || !message) return;
      
      const roomName = `stream:${streamKey}`;
      
      // Broadcast to everyone in the stream room
      io.to(roomName).emit('streamMessage', {
        message,
        userId,
        userName,
        timestamp: new Date()
      });
      
      // Save to database if session exists
      const StreamSession = require('./models/StreamSession');
      const Class = require('./models/Class');
      
      const classObj = await Class.findOne({ streamKey });
      if (classObj) {
        const session = await StreamSession.findOne({ 
          classId: classObj._id, 
          status: { $ne: 'offline' } 
        });
        
        if (session) {
          session.messages.push({
            userId,
            message
          });
          await session.save();
        }
      }
    } catch (error) {
      console.error('❌ Error handling stream message:', error);
    }
  });
  
  // ===== INSTRUCTOR CHAT HANDLERS =====
  socket.on('join', async (channel) => {
    socket.join(channel);
    console.log(`👤 User joined instructor channel: ${channel}`);
    
    try {
      // Load message history from database
      const Message = require('./models/Message');
      const messages = await Message.find({ channel })
        .sort({ timestamp: -1 })
        .limit(50);
      
      socket.emit('history', messages.reverse());
    } catch (error) {
      console.error('❌ Error loading instructor chat history:', error);
    }
  });
  
  socket.on('message', async (data) => {
    try {
      // Store the message in database
      const Message = require('./models/Message');
      const message = new Message({
        sender: data.sender,
        content: data.content,
        attachment: data.attachment,
        channel: data.channel || 'instructor',
        timestamp: new Date()
      });
      
      await message.save();
      
      // Broadcast to all clients in the channel
      io.to(data.channel || 'instructor').emit('message', message);
    } catch (error) {
      console.error('❌ Error saving instructor chat message:', error);
      socket.emit('error', { message: 'Failed to save message' });
    }
  });
  
  // ===== KITCOMM CHAT HANDLERS =====
  socket.on('kitcomm:join', async (channel) => {
    const roomName = `kitcomm:${channel}`;
    socket.join(roomName);
    console.log(`👤 User joined KitComm channel: ${channel}`);
    
    try {
      // Load KitComm message history from database
      const KitCommMessage = require('./models/KitCommMessage');
      const messages = await KitCommMessage.find({ channel })
        .sort({ timestamp: -1 })
        .limit(50);
      
      socket.emit('kitcomm:history', messages.reverse());
    } catch (error) {
      console.error('❌ Error loading KitComm chat history:', error);
    }
  });
  
  // Join class-specific room for user status updates
  socket.on('kitcomm:joinClass', async (data) => {
    const { classId, userId, userName } = data;
    const roomName = `class:${classId || 'default'}`;
    
    // Join the class room
    socket.join(roomName);
    console.log(`👤 User ${userName} (${userId}) joined class: ${classId || 'default'}`);
    
    // Store user data with socket for disconnect handling
    socket.userData = { 
      userId,
      userName,
      classId: classId || 'default',
      status: 'online'
    };
    
    // Update user status to online
    try {
      // This would usually be a database update
      // For now, we'll broadcast the status change
      io.to(roomName).emit('kitcomm:userStatus', {
        userId,
        userName,
        status: 'online'
      });
    } catch (error) {
      console.error('❌ Error updating user status:', error);
    }
  });
  
  socket.on('kitcomm:message', async (data) => {
    try {
      if (!data.author || !data.role || !data.content || !data.channel) {
        socket.emit('kitcomm:error', { message: 'Missing required fields' });
        return;
      }
      
      // Store the KitComm message in database
      const KitCommMessage = require('./models/KitCommMessage');
      const message = new KitCommMessage({
        author: data.author,
        role: data.role,
        content: data.content,
        channel: data.channel,
        attachment: data.attachment,
        timestamp: new Date()
      });
      
      await message.save();
      
      // Broadcast to all clients in the KitComm channel
      io.to(`kitcomm:${data.channel}`).emit('kitcomm:message', message);
    } catch (error) {
      console.error('❌ Error saving KitComm message:', error);
      socket.emit('kitcomm:error', { message: 'Failed to save message' });
    }
  });
  // Update user status
  socket.on('kitcomm:updateStatus', (status) => {
    if (socket.userData) {
      const { userId, userName, classId } = socket.userData;
      socket.userData.status = status;
      
      // Broadcast status update to class
      io.to(`class:${classId}`).emit('kitcomm:userStatus', {
        userId,
        userName,
        status
      });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
    
    // Handle WebRTC disconnection
    if (socket.classId && socket.role) {
      const classId = socket.classId;
      const room = webrtcRooms.get(classId);
      
      if (room) {
        if (socket.role === 'instructor' && room.instructor === socket.id) {
          // Instructor disconnected - notify all students
          console.log(`🎓 Instructor disconnected from WebRTC class: ${classId}`);
          room.instructor = null;
          
          socket.to(`webrtc:${classId}`).emit('instructor-stopped-webrtc', {
            classId: classId,
            reason: 'Instructor disconnected'
          });
        } else if (socket.role === 'student' && room.students.has(socket.id)) {
          // Student disconnected - notify instructor
          console.log(`👤 Student disconnected from WebRTC class: ${classId}`);
          room.students.delete(socket.id);
          
          if (room.instructor) {
            io.to(room.instructor).emit('student-left', {
              studentId: socket.id,
              classId: classId
            });
          }
        }
        
        // Clean up empty rooms
        if (!room.instructor && room.students.size === 0) {
          webrtcRooms.delete(classId);
          console.log(`🧹 Cleaned up empty WebRTC room: ${classId}`);
        }
        
        // Update viewer count for streaming room
        if (socket.currentStreamRoom) {
          const roomMembers = io.sockets.adapter.rooms.get(socket.currentStreamRoom);
          const viewerCount = roomMembers ? roomMembers.size - 1 : 0; // Subtract instructor if present
          console.log(`👥 Updated viewer count after disconnect for ${socket.currentStreamRoom}: ${viewerCount}`);
          io.to(socket.currentStreamRoom).emit('viewerCount', { count: viewerCount });
        }
      }
    }
    
    // If we have user data, update their status to offline
    if (socket.userData) {
      const { userId, userName, classId } = socket.userData;
      
      // Broadcast offline status to class
      io.to(`class:${classId}`).emit('kitcomm:userStatus', {
        userId,
        userName,
        status: 'offline'
      });
    }
    
    // Update viewer counts for any stream rooms
    if (socket.rooms) {
      // Get all rooms this socket was in
      for (const room of socket.rooms) {
        if (room.startsWith('stream:')) {
          const roomMembers = io.sockets.adapter.rooms.get(room);
          const viewerCount = roomMembers ? roomMembers.size : 0;
          io.to(room).emit('viewerCount', { count: viewerCount });
        }
      }
    }
    
    // Handle streaming room disconnection
    if (socket.currentStreamRoom) {
      console.log(`📺 User left stream room: ${socket.currentStreamRoom}`);
    }
  });
  
  // ===== STREAM STATE MANAGEMENT =====
  // Use the global io.streamStates instead of local streamStates
  
  // Store stream state for late-joining students
  socket.on('stream:state-update', (data) => {
    const { classId, currentTime, playing, streamUrl, startTime } = data;
    
    if (!io.streamStates) io.streamStates = new Map();
    
    io.streamStates.set(classId, {
      currentTime,
      playing,
      streamUrl,
      startTime: startTime || new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    });
    
    console.log(`💾 Stream state updated for class ${classId}:`, { currentTime, playing });
  });
  
  // Send current stream state to new joiners
  socket.on('request-stream-state', (data) => {
    const { classId } = data;
    const state = io.streamStates?.get(classId);
    
    if (state) {
      socket.emit('stream:current-state', {
        ...state,
        timeSinceStart: Date.now() - new Date(state.startTime).getTime()
      });
      console.log(`📤 Sent current stream state to new joiner for class ${classId}`);
    } else {
      socket.emit('stream:no-state', { message: 'No active stream found' });
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));