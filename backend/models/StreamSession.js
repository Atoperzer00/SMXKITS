const mongoose = require('mongoose');

const StreamSessionSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  status: {
    type: String,
    enum: ['live', 'paused', 'offline'],
    default: 'offline'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  },
  currentLesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  currentSource: {
    type: String,
    enum: ['mp4', 'live', 'other'],
    default: 'live'
  },
  viewerCount: {
    type: Number,
    default: 0
  },
  bookmarks: [{
    time: Number,
    label: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
});

module.exports = mongoose.model('StreamSession', StreamSessionSchema);