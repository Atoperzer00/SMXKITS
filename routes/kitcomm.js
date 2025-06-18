const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const KitCommMessage = require('../models/KitCommMessage');
const auth = require('../middleware/auth');

// In-memory storage for user status
const userStatus = {
  // classId: {
  //   userId: { name: 'User Name', status: 'online|offline', lastSeen: Date }
  // }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/kitcomm');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'kitcomm-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only certain file types
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: File type not supported!'));
    }
  }
});

// Get messages for a channel
router.get('/channels/:channel', async (req, res) => {
  try {
    const { channel } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const messages = await KitCommMessage.find({ channel })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json(messages.reverse());
  } catch (error) {
    console.error('❌ Error fetching KitComm messages:', error);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
});

// Get list of all channels with optional search
router.get('/channels', async (req, res) => {
  try {
    // Get optional search parameter
    const search = req.query.search ? req.query.search.toLowerCase() : '';
    // Get optional class parameter
    const classId = req.query.class || '';
    
    // Get all channels
    let channels = await KitCommMessage.distinct('channel');
    
    // Filter by search term if provided
    if (search) {
      channels = channels.filter(ch => ch.toLowerCase().includes(search));
    }
    
    // In a real implementation, you would filter channels by class
    // For now, just return all channels with the search filter
    
    res.json(channels);
  } catch (error) {
    console.error('❌ Error fetching KitComm channels:', error);
    res.status(500).json({ error: 'Server error fetching channels' });
  }
});

// Post a new message
router.post('/message', async (req, res) => {
  try {
    const { author, role, content, channel } = req.body;
    
    if (!author || !role || !content || !channel) {
      return res.status(400).json({ error: 'Author, role, content, and channel are required' });
    }
    
    const message = new KitCommMessage({
      author,
      role,
      content,
      channel,
      timestamp: new Date()
    });
    
    await message.save();
    
    // Emit through Socket.io
    req.app.get('io').to(`kitcomm:${channel}`).emit('kitcomm:message', message);
    
    res.status(201).json(message);
  } catch (error) {
    console.error('❌ Error posting KitComm message:', error);
    res.status(500).json({ error: 'Server error posting message' });
  }
});

// Upload a file with message
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { author, role, content, channel } = req.body;
    const file = req.file;
    
    if (!author || !role || !channel) {
      return res.status(400).json({ error: 'Author, role, and channel are required' });
    }
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create message with attachment
    const message = new KitCommMessage({
      author,
      role,
      content: content || `Shared a file: ${file.originalname}`,
      channel,
      attachment: {
        filename: file.originalname,
        path: `/uploads/kitcomm/${file.filename}`,
        type: file.mimetype
      },
      timestamp: new Date()
    });
    
    await message.save();
    
    // Emit through Socket.io
    req.app.get('io').to(`kitcomm:${channel}`).emit('kitcomm:message', message);
    
    res.status(201).json(message);
  } catch (error) {
    console.error('❌ Error uploading KitComm file:', error);
    res.status(500).json({ error: 'Server error uploading file' });
  }
});

// Clear all messages in a channel (Admin only)
router.delete('/channels/:channel/messages', auth, async (req, res) => {
  try {
    const { channel } = req.params;
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can clear chat logs' });
    }
    
    // Delete all messages in the channel
    const result = await KitCommMessage.deleteMany({ channel });
    
    // Notify all clients that the channel has been cleared
    req.app.get('io').to(`kitcomm:${channel}`).emit('kitcomm:channelCleared', { 
      channel,
      clearedBy: req.user.name || 'Admin',
      timestamp: new Date()
    });
    
    res.json({ 
      success: true, 
      message: `Cleared ${result.deletedCount} messages from ${channel}`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('❌ Error clearing channel messages:', error);
    res.status(500).json({ error: 'Server error clearing messages' });
  }
});

// Delete a channel
router.delete('/channels/:name', auth, async (req, res) => {
  try {
    const channelName = req.params.name;
    
    // Don't allow deleting default channels
    if (channelName === 'Global') {
      return res.status(403).json({ error: 'Cannot delete default channels' });
    }
    
    // Delete all messages in the channel
    await KitCommMessage.deleteMany({ channel: channelName });
    
    // Notify all clients that the channel has been deleted
    req.app.get('io').emit('kitcomm:channelDeleted', { channel: channelName });
    
    res.json({ success: true, message: `Channel ${channelName} deleted` });
  } catch (error) {
    console.error('❌ Error deleting channel:', error);
    res.status(500).json({ error: 'Server error deleting channel' });
  }
});

// Get users for a class with online status
router.get('/users', auth, async (req, res) => {
  try {
    const classId = req.query.class || 'default';
    
    // In a real implementation, fetch users from the database
    // For now, use mock data
    const mockUsers = [
      { id: '1', name: 'John Doe', status: 'online' },
      { id: '2', name: 'Jane Smith', status: 'online' },
      { id: '3', name: 'Bob Johnson', status: 'offline' },
      { id: '4', name: 'Alice Williams', status: 'offline' }
    ];
    
    // Add the current user
    const currentUser = {
      id: req.user.id || '0',
      name: req.user.name || req.body.userName || 'You',
      status: 'online'
    };
    
    // Check if user is already in the list
    if (!mockUsers.find(u => u.id === currentUser.id)) {
      mockUsers.push(currentUser);
    }
    
    // Split into online and offline
    const online = mockUsers.filter(u => u.status === 'online');
    const offline = mockUsers.filter(u => u.status === 'offline');
    
    res.json({ online, offline });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Update user status
router.post('/users/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;
    const classId = req.query.class || 'default';
    
    // Initialize class if needed
    if (!userStatus[classId]) {
      userStatus[classId] = {};
    }
    
    // Update user status
    userStatus[classId][userId] = {
      name: userName,
      status: status || 'online',
      lastSeen: new Date()
    };
    
    // Notify all clients of status change
    req.app.get('io').to(`class:${classId}`).emit('kitcomm:userStatus', {
      userId,
      userName,
      status: status || 'online'
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(500).json({ error: 'Server error updating user status' });
  }
});

module.exports = router;