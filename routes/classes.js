const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const auth = require('../middleware/auth');

// Create class (admin)
router.post('/', auth(['admin']), async (req, res) => {
  const { name } = req.body;
  const newClass = new Class({ name, students: [], instructors: [] });
  await newClass.save();
  res.json(newClass);
});

// Get all classes (admin/instructor)
router.get('/', auth(['admin', 'instructor']), async (req, res) => {
  const classes = await Class.find().populate('students').populate('instructors');
  res.json(classes);
});

// Add/remove students/instructors, etc.

module.exports = router;