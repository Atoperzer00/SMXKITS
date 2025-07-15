const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
require('dotenv').config();

const app = express();

// Serve static files from the public directory
app.use(express.static('public'));

// Serve static files from root as fallback
app.use(express.static('.'));

// Define root route before static middleware to ensure it takes precedence
app.get('/', (req, res) => {
  console.log('Root route accessed - redirecting to login page');
  res.redirect('/login.html');
});

// Explicitly handle /index.html and redirect to login
app.get('/index.html', (req, res) => {
  res.redirect('/login.html');
});

// Serve protected dashboard with server-side check
app.get('/dashboard.html', (req, res) => {
  res.sendFile(__dirname + '/public/dashboard.html');
});

// Serve admin dashboard with client-side auth check
app.get('/admin-dashboard.html', (req, res) => {
  res.sendFile(__dirname + '/public/admin-dashboard.html');
});

// Proxy API requests to backend
const apiProxy = createProxyMiddleware({
  target: `http://localhost:${process.env.BACKEND_PORT || 3001}`,
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying for Socket.IO
  logLevel: 'info',
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Backend service unavailable' 
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying ${req.method} ${req.url} to backend`);
  }
});

// Proxy all API requests to backend
app.use('/api', apiProxy);

// Proxy Socket.IO requests to backend
app.use('/socket.io', apiProxy);

// Serve uploaded files from backend
const uploadsProxy = createProxyMiddleware({
  target: `http://localhost:${process.env.BACKEND_PORT || 3001}`,
  changeOrigin: true,
  logLevel: 'info'
});

app.use('/uploads', uploadsProxy);

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Proxy server error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Proxy server error' 
  });
});

// 404 handler for non-API routes
app.use('*', (req, res) => {
  if (req.url.startsWith('/api')) {
    res.status(404).json({ 
      success: false, 
      message: 'API endpoint not found' 
    });
  } else {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  }
});

const PORT = process.env.PORT || 5173;

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`🔗 Frontend: http://localhost:${PORT}`);
  console.log(`🔄 Proxying API requests to backend on port ${process.env.BACKEND_PORT || 3001}`);
  console.log(`📁 Serving static files from ./public and ./`);
});