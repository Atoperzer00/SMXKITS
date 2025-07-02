const mongoose = require('mongoose');

const DirectMessageSchema = new mongoose.Schema({
  conversationId: { 
    type: String, 
    required: true,
    index: true 
  },
  sender: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    role: { type: String, required: true }
  },
  recipient: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    role: { type: String, required: true }
  },
  content: { type: String, required: true },
  attachment: {
    filename: String,
    path: String,
    type: String
  },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  readAt: { type: Date }
});

// Create compound index for efficient conversation queries
DirectMessageSchema.index({ conversationId: 1, timestamp: -1 });
DirectMessageSchema.index({ 'recipient.id': 1, read: 1 }); // For unread counts

module.exports = mongoose.model('DirectMessage', DirectMessageSchema);