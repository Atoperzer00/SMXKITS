const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: String,
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Class', ClassSchema);