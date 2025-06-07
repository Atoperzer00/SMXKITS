const express = require('express');
const http = require('http');
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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/classes', require('./routes/classes'));
app.use('/api/progress', require('./routes/progress'));

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

// Serve protected dashboard (optional - for enhanced security)
app.get('/dashboard.html', (req, res) => {
  // For now, just serve the file. In production, you might want to add server-side auth check
  res.sendFile(__dirname + '/public/dashboard.html');
});

// KitComm - real-time chat (simple, can expand as needed)
const channels = {}; // { channel: [msg, msg, ...] }

io.on('connection', socket => {
  socket.on('join', channel => {
    socket.join(channel);
    if (channels[channel]) {
      socket.emit('history', channels[channel]);
    }
  });
  
  socket.on('message', data => {
    if (!channels[data.channel]) channels[data.channel] = [];
    channels[data.channel].push(data);
    io.to(data.channel).emit('message', data);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));