const mongoose = require('mongoose');

const KitCommChannelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('KitCommChannel', KitCommChannelSchema);