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
app.use(express.static('public'));


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

// MongoDB connection with fallback
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/smxkits';
console.log('Connecting to MongoDB:', mongoURI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');

// Try multiple connection strategies for MongoDB Atlas SSL issues
async function connectToMongoDB() {
  const connectionStrategies = [
    // Strategy 1: Standard Atlas connection
    {
      name: 'Standard Atlas',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000,
        retryWrites: true,
        w: 'majority'
      }
    },
    // Strategy 2: Disable SSL validation (for SSL certificate issues)
    {
      name: 'SSL Disabled',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000,
        ssl: false
      }
    },
    // Strategy 3: Allow invalid certificates
    {
      name: 'Allow Invalid Certs',
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 15000,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true
      }
    }
  ];

  for (const strategy of connectionStrategies) {
    try {
      console.log(`🔄 Trying ${strategy.name} connection...`);
      await mongoose.connect(mongoURI, strategy.options);
      console.log(`✅ MongoDB connected successfully using ${strategy.name}!`);
      console.log('✅ Database name:', mongoose.connection.name);
      await createDefaultUsers();
      return;
    } catch (err) {
      console.log(`❌ ${strategy.name} failed:`, err.message);
    }
  }
  
  // If all strategies fail
  console.error('❌ All MongoDB connection strategies failed');
  console.log('💡 Troubleshooting steps:');
  console.log('1. Check MongoDB Atlas IP whitelist (add 0.0.0.0/0 for testing)');
  console.log('2. Verify MONGO_URI environment variable');
  console.log('3. Ensure MongoDB Atlas cluster is running');
  console.log('4. Check if your MongoDB Atlas cluster is paused');
}

// Start connection
connectToMongoDB();

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