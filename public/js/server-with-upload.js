const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 8080;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(__dirname));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename with timestamp to avoid conflicts
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024 * 1024 // 4GB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed!'), false);
    }
  }
});

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Upload endpoint for simple file upload
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('✅ File uploaded:', req.file.filename);
    console.log('📁 File path:', req.file.path);
    console.log('📊 File size:', (req.file.size / (1024 * 1024)).toFixed(2) + ' MB');

    res.json({
      success: true,
      message: 'File uploaded successfully',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
});

// Upload endpoint for stream mode (matches existing frontend)
app.post('/stream/upload', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const classId = req.body.classId || 'default';
    console.log('🎥 Stream video uploaded:', req.file.filename);
    console.log('🏫 Class ID:', classId);
    console.log('📊 File size:', (req.file.size / (1024 * 1024)).toFixed(2) + ' MB');

    res.json({
      success: true,
      message: 'Video uploaded successfully for streaming',
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      classId: classId,
      streamUrl: `/uploads/${req.file.filename}`,
      uploadTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Stream upload error:', error);
    res.status(500).json({ error: 'Stream upload failed: ' + error.message });
  }
});

// Get list of uploaded files
app.get('/uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir).map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        uploadTime: stats.mtime,
        url: `/uploads/${filename}`
      };
    });

    res.json({ files });
  } catch (error) {
    console.error('❌ Error listing files:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Delete uploaded file
app.delete('/uploads/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️ File deleted:', filename);
      res.json({ success: true, message: 'File deleted successfully' });
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uploadsDir: uploadsDir,
    port: port
  });
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 4GB.' });
    }
  }
  
  console.error('❌ Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}/`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`📤 Upload endpoint: http://localhost:${port}/upload`);
  console.log(`🎥 Stream upload endpoint: http://localhost:${port}/stream/upload`);
  console.log(`📂 Uploads directory: ${uploadsDir}`);
  console.log('✅ Ready to accept file uploads!');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Server shutting down gracefully...');
  process.exit(0);
});