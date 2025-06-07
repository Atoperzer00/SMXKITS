const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth'); // implement a JWT middleware

router.get('/', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Add other user management endpoints as needed...

module.exports = router;