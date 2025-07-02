const express = require('express');
const router = express.Router();
const DirectMessage = require('../models/DirectMessage');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get user's conversations list
router.get('/conversations', auth(['admin', 'instructor', 'student']), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const conversations = await Conversation.find({
      'participants.id': userId
    }).sort({ updatedAt: -1 });

    // Add unread counts for current user
    const conversationsWithUnread = conversations.map(conv => {
      const unreadCount = conv.unreadCounts.get(userId.toString()) || 0;
      return {
        ...conv.toObject(),
        unreadCount,
        otherParticipant: conv.participants.find(p => p.id.toString() !== userId.toString())
      };
    });

    res.json(conversationsWithUnread);
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ error: 'Server error fetching conversations' });
  }
});

// Get available contacts based on user role
router.get('/contacts', auth(['admin', 'instructor', 'student']), async (req, res) => {
  try {
    const currentUser = req.user;
    let contacts = [];

    if (currentUser.role === 'admin') {
      // Admins can see everyone
      contacts = await User.find({ 
        _id: { $ne: currentUser.id } 
      }).select('name role classId').sort({ role: 1, name: 1 });
    } else if (currentUser.role === 'instructor') {
      // Instructors can see everyone
      contacts = await User.find({ 
        _id: { $ne: currentUser.id } 
      }).select('name role classId').sort({ role: 1, name: 1 });
    } else if (currentUser.role === 'student') {
      // Students can see instructors and admins in their class, plus other students in same class
      contacts = await User.find({
        $and: [
          { _id: { $ne: currentUser.id } },
          {
            $or: [
              { role: { $in: ['admin', 'instructor'] } },
              { 
                $and: [
                  { role: 'student' },
                  { classId: currentUser.classId }
                ]
              }
            ]
          }
        ]
      }).select('name role classId').sort({ role: 1, name: 1 });
    }

    res.json(contacts);
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({ error: 'Server error fetching contacts' });
  }
});

// Get messages for a specific conversation
router.get('/conversation/:userId', auth(['admin', 'instructor', 'student']), async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;
    const limit = parseInt(req.query.limit) || 50;

    // Generate conversation ID
    const conversationId = Conversation.generateConversationId(currentUserId, otherUserId);

    // Get messages
    const messages = await DirectMessage.find({ conversationId })
      .sort({ timestamp: -1 })
      .limit(limit);

    // Mark messages as read for current user
    await DirectMessage.updateMany(
      { 
        conversationId,
        'recipient.id': currentUserId,
        read: false 
      },
      { 
        read: true,
        readAt: new Date()
      }
    );

    // Update conversation unread count
    await Conversation.updateOne(
      { 'participants.id': { $all: [currentUserId, otherUserId] } },
      { $set: { [`unreadCounts.${currentUserId}`]: 0 } }
    );

    res.json(messages.reverse());
  } catch (error) {
    console.error('❌ Error fetching conversation:', error);
    res.status(500).json({ error: 'Server error fetching conversation' });
  }
});

// Send a direct message
router.post('/send', auth(['admin', 'instructor', 'student']), async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    const sender = req.user;

    if (!recipientId || !content) {
      return res.status(400).json({ error: 'Recipient ID and content are required' });
    }

    // Get recipient info
    const recipient = await User.findById(recipientId).select('name role');
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    // Generate conversation ID
    const conversationId = Conversation.generateConversationId(sender.id, recipientId);

    // Create the message
    const message = new DirectMessage({
      conversationId,
      sender: {
        id: sender.id,
        name: sender.name,
        role: sender.role
      },
      recipient: {
        id: recipient._id,
        name: recipient.name,
        role: recipient.role
      },
      content
    });

    await message.save();

    // Update or create conversation
    const conversation = await Conversation.findOrCreateConversation(
      { id: sender.id, name: sender.name, role: sender.role },
      { id: recipient._id, name: recipient.name, role: recipient.role }
    );

    // Update conversation with last message and increment unread count for recipient
    conversation.lastMessage = {
      content,
      timestamp: message.timestamp,
      senderId: sender.id
    };
    conversation.updatedAt = new Date();
    
    const currentUnread = conversation.unreadCounts.get(recipientId.toString()) || 0;
    conversation.unreadCounts.set(recipientId.toString(), currentUnread + 1);
    
    await conversation.save();

    // Emit real-time message
    const io = req.app.get('io');
    io.to(`user:${recipientId}`).emit('direct_message', message);
    io.to(`user:${recipientId}`).emit('conversation_updated', {
      conversationId,
      lastMessage: conversation.lastMessage,
      unreadCount: currentUnread + 1
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('❌ Error sending direct message:', error);
    res.status(500).json({ error: 'Server error sending message' });
  }
});

// Get unread message count for current user
router.get('/unread-count', auth(['admin', 'instructor', 'student']), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const conversations = await Conversation.find({
      'participants.id': userId
    });

    const totalUnread = conversations.reduce((total, conv) => {
      return total + (conv.unreadCounts.get(userId.toString()) || 0);
    }, 0);

    res.json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('❌ Error fetching unread count:', error);
    res.status(500).json({ error: 'Server error fetching unread count' });
  }
});

module.exports = router;