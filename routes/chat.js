const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
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
router.get('/:channel', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const { channel } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const messages = await Message.find({ channel })
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json(messages.reverse());
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ error: 'Server error fetching messages' });
  }
});

// Post a new message
router.post('/', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const { content, channel } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    const message = new Message({
      sender: {
        id: req.user.id,
        name: req.user.name || 'Unknown',
        role: req.user.role
      },
      content,
      channel: channel || 'instructor'
    });
    
    await message.save();
    
    // Emit through Socket.io
    req.app.get('io').to(channel || 'instructor').emit('message', message);
    
    res.status(201).json(message);
  } catch (error) {
    console.error('❌ Error posting message:', error);
    res.status(500).json({ error: 'Server error posting message' });
  }
});

// Upload a file with optional message
router.post('/upload', auth(['admin', 'instructor']), upload.single('file'), async (req, res) => {
  try {
    const { content, channel } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Create message with attachment
    const message = new Message({
      sender: {
        id: req.user.id,
        name: req.user.name || 'Unknown',
        role: req.user.role
      },
      content: content || `Shared a file: ${file.originalname}`,
      attachment: {
        filename: file.originalname,
        path: `/uploads/${file.filename}`,
        type: file.mimetype
      },
      channel: channel || 'instructor'
    });
    
    await message.save();
    
    // Emit through Socket.io
    req.app.get('io').to(channel || 'instructor').emit('message', message);
    
    res.status(201).json(message);
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    res.status(500).json({ error: 'Server error uploading file' });
  }
});

module.exports = router;