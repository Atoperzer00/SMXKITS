const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'instructor', 'student'], default: 'student' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  name: { type: String, required: true },
  email: { type: String },
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);