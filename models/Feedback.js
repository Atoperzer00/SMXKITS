const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  classId: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  feedback: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
