const mongoose = require('mongoose');

const KitCommMessageSchema = new mongoose.Schema({
  author: { type: String, required: true },
  role: { type: String, required: true },
  content: { type: String, required: true },
  channel: { type: String, required: true, default: 'Global' },
  attachment: {
    filename: String,
    path: String,
    type: String
  },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('KitCommMessage', KitCommMessageSchema);