const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    role: { type: String, required: true }
  },
  content: { type: String, required: true },
  attachment: {
    filename: String,
    path: String,
    type: String
  },
  channel: { type: String, default: 'instructor' }, // For supporting multiple chat channels
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);