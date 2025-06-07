const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/register (admin only)
router.post('/register', async (req, res) => {
  const { username, password, role, classId, name } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hash, role, classId, name });
  await user.save();
  res.json({ success: true });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body.username, 'as', req.body.role);
    
    const { username, password, role } = req.body;
    
    if (!username || !password) {
      console.log('❌ Missing credentials');
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    let user = null;
    
    // Wait for mongoose connection before querying
    if (require('mongoose').connection.readyState !== 1) {
      console.log('❌ Mongoose not connected, cannot query users');
      return res.status(503).json({ error: 'Database not connected. Please try again later.' });
    }
    user = await User.findOne({ username });
    
    console.log('👤 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('❌ User not found:', username);
      return res.status(401).json({ error: 'User not found' });
    }
    
    const match = await bcrypt.compare(password, user.password);
    console.log('🔑 Password match:', match ? 'Yes' : 'No');
    
    if (!match) {
      console.log('❌ Invalid password for:', username);
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Check if role matches (optional validation)
    if (role && user.role !== role) {
      console.log('❌ Role mismatch. Expected:', role, 'Got:', user.role);
      return res.status(401).json({ error: 'Role mismatch' });
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key';
    const token = jwt.sign(
      { id: user._id, role: user.role, classId: user.classId }, 
      jwtSecret, 
      { expiresIn: '1d' }
    );
    
    console.log('✅ Login successful for:', username, 'as', user.role);
    res.json({ 
      token, 
      role: user.role, 
      classId: user.classId, 
      name: user.name || username 
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;