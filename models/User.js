const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: { type: String },
  role: { type: String, enum: ['admin', 'instructor', 'student'], default: 'student' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  name: String
});

module.exports = mongoose.model('User', UserSchema);