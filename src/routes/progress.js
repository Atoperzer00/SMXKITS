const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const auth = require('../middleware/auth');

// Get progress for a user
router.get('/:userId', auth(['admin', 'instructor', 'student']), async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.params.userId });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update progress
router.post('/', auth(['student', 'admin', 'instructor']), async (req, res) => {
  try {
    const { userId, moduleId, practice, wpm, stars } = req.body;
    
    let progress = await Progress.findOne({ userId, moduleId });
    
    if (progress) {
      // Update existing progress
      if (practice !== undefined) progress.practice = practice;
      if (wpm !== undefined) progress.wpm = wpm;
      if (stars !== undefined) progress.stars = stars;
      await progress.save();
    } else {
      // Create new progress
      progress = new Progress({ userId, moduleId, practice, wpm, stars });
      await progress.save();
    }
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all progress (admin/instructor)
router.get('/', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const progress = await Progress.find().populate('userId');
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;