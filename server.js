const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const socketio = require('socket.io');
const bcrypt = require('bcryptjs');
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

// MongoDB connection with fallback
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/smxkits';
console.log('Connecting to MongoDB:', mongoURI.includes('mongodb+srv') ? 'MongoDB Atlas' : 'Local MongoDB');

mongoose.connect(mongoURI, { 
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  // Remove problematic SSL settings for Atlas
  ...(mongoURI.includes('mongodb+srv') ? {
    // Atlas-specific settings
    retryWrites: true,
    w: 'majority'
  } : {
    // Local MongoDB settings
    family: 4
  })
})
  .then(() => {
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log('✅ Database name:', mongoose.connection.name);
    console.log('✅ Connection state:', mongoose.connection.readyState);
    console.log('ℹ️ To create admin user, run: node setup-admin.js');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    console.error('Error code:', err.code);
    if (err.reason) {
      console.error('Reason:', err.reason);
    }
    
    // Provide helpful troubleshooting info
    if (err.message.includes('SSL') || err.message.includes('TLS')) {
      console.log('💡 SSL/TLS Error - Try these solutions:');
      console.log('1. Check your MongoDB Atlas IP whitelist');
      console.log('2. Verify your connection string is correct');
      console.log('3. Ensure your MongoDB Atlas cluster is running');
    }
  });

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