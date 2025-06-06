const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth'); // implement a JWT middleware

router.get('/', auth(['admin', 'instructor']), async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

// Add other user management endpoints as needed...

module.exports = router;