const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const auth = require('../middleware/auth');

// Create class (admin)
router.post('/', auth(['admin']), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }
    const newClass = new Class({ name, students: [], instructors: [] });
    await newClass.save();
    res.json(newClass);
  } catch (error) {
    console.error('❌ Error creating class:', error);
    res.status(500).json({ error: 'Server error creating class' });
  }
});

// Get all classes (admin/instructor)
router.get('/', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const classes = await Class.find().populate('students').populate('instructors');
    res.json(classes);
  } catch (error) {
    console.error('❌ Error fetching classes:', error);
    res.status(500).json({ error: 'Server error fetching classes' });
  }
});

// Add/remove students/instructors, etc.

module.exports = router;