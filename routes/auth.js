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
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: 'User not found' });
  
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Invalid password' });
  
  const token = jwt.sign({ id: user._id, role: user.role, classId: user.classId }, process.env.JWT_SECRET, { expiresIn: '1d' });
  res.json({ token, role: user.role, classId: user.classId, name: user.name });
});

module.exports = router;