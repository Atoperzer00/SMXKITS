const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');

// Get all users (for admin and instructors)
router.get('/', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// Create a new user (admin only)
router.post('/', auth(['admin']), async (req, res) => {
  try {
    const { name, email, username, password, role, status } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ error: 'Name, username, password, and role are required' });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
      role,
      status: status === 'Active' ? true : false
    });

    await newUser.save();
    
    // Return the user without password
    const userResponse = { ...newUser.toObject() };
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ error: 'Server error creating user' });
  }
});

// Update a user (admin only)
router.put('/:id', auth(['admin']), async (req, res) => {
  try {
    const { name, email, username, password, role, status } = req.body;

    // Find user by ID
    let user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if updating username and it already exists for another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
    }

    // Update user fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.username = username || user.username;
    user.role = role || user.role;
    user.status = status === 'Active' ? true : false;

    // Only update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();

    // Return the user without password
    const userResponse = { ...user.toObject() };
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({ error: 'Server error updating user' });
  }
});

// Delete a user (admin only)
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

module.exports = router;