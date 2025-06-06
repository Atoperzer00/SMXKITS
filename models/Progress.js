const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moduleId: String,
  practice: [Boolean], // one per practice
  wpm: [Number], // array of scores
  stars: Number
});

module.exports = mongoose.model('Progress', ProgressSchema);