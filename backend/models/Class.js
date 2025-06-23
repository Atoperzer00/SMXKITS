const mongoose = require('mongoose');

const ClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  instructors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  streamKey: {
    type: String,
    unique: true
  },
  status: {
    type: String,
    enum: ['offline', 'live', 'paused'],
    default: 'offline'
  },
  currentLesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  },
  bookmarks: [{
    time: Number,
    label: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to generate a unique stream key
ClassSchema.methods.generateStreamKey = function() {
  const prefix = this.name.replace(/\s+/g, '').toLowerCase().substring(0, 6);
  const randomChars = Math.random().toString(36).substring(2, 10);
  this.streamKey = `${prefix}-${randomChars}`;
  return this.streamKey;
};

module.exports = mongoose.model('Class', ClassSchema);