const express = require('express');
const http = require('http');
const path = require('path');
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
    stage: String
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

// Real-time chat and streaming with MongoDB storage
io.on('connection', socket => {
  console.log('🔌 New socket connection established');
  
  // ===== OPSLOG HANDLERS =====
  socket.on('join_room', roomId => {
    console.log(`👤 User joined OpsLog room: ${roomId}`);
    socket.join(roomId);
  });
  
  // ===== STREAMING HANDLERS =====
  // Track connected viewers
  const activeStreamRooms = new Set();
  
  // Join stream room
  socket.on('joinStream', async (streamKey) => {
    if (!streamKey) return;
    
    const roomName = `stream:${streamKey}`;
    socket.join(roomName);
    activeStreamRooms.add(roomName);
    
    console.log(`👤 User joined stream: ${streamKey}`);
    
    try {
      // Find class by stream key
      const Class = require('./models/Class');
      const classObj = await Class.findOne({ streamKey }).populate('currentLesson');
      
      if (classObj) {
        // Emit current stream status
        socket.emit('streamStatus', {
          status: classObj.streamStatus,
          source: classObj.currentStreamSource,
          lesson: classObj.currentLesson
        });
        
        // Broadcast updated viewer count
        const roomMembers = io.sockets.adapter.rooms.get(roomName);
        const viewerCount = roomMembers ? roomMembers.size : 0;
        io.to(roomName).emit('viewerCount', { count: viewerCount });
        
        // Load bookmarks
        socket.emit('bookmarks', classObj.bookmarks);
      }
    } catch (error) {
      console.error('❌ Error handling joinStream:', error);
    }
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
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));