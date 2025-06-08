const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const KitCommMessage = require('../models/KitCommMessage');
const auth = require('../middleware/auth');

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

// Get list of all channels
router.get('/channels', async (req, res) => {
  try {
    const channels = await KitCommMessage.distinct('channel');
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

module.exports = router;