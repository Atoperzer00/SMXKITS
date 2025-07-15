const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

// Submit feedback
router.post('/submit', async (req, res) => {
  try {
    const { classId, studentId, feedback } = req.body;
    const newFeedback = new Feedback({ classId, studentId, feedback });
    await newFeedback.save();
    res.status(200).json({ message: 'Feedback submitted successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
});

// Get feedback for instructor
router.get('/instructor', async (req, res) => {
  try {
    const feedbacks = await Feedback.find();
    res.status(200).json(feedbacks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feedback.' });
  }
});

module.exports = router;
