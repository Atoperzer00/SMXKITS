const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    role: { type: String, required: true }
  }],
  lastMessage: {
    content: String,
    timestamp: Date,
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: new Map()
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create index for efficient participant queries
ConversationSchema.index({ 'participants.id': 1 });

// Helper method to generate conversation ID from participant IDs
ConversationSchema.statics.generateConversationId = function(userId1, userId2) {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return ids.join('_');
};

// Helper method to find or create conversation
ConversationSchema.statics.findOrCreateConversation = async function(user1, user2) {
  const conversationId = this.generateConversationId(user1.id, user2.id);
  
  let conversation = await this.findOne({
    $and: [
      { 'participants.id': user1.id },
      { 'participants.id': user2.id }
    ]
  });

  if (!conversation) {
    conversation = new this({
      participants: [
        { id: user1.id, name: user1.name, role: user1.role },
        { id: user2.id, name: user2.name, role: user2.role }
      ],
      unreadCounts: new Map([
        [user1.id.toString(), 0],
        [user2.id.toString(), 0]
      ])
    });
    await conversation.save();
  }

  return conversation;
};

module.exports = mongoose.model('Conversation', ConversationSchema);