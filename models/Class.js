const mongoose = require('mongoose');
const crypto = require('crypto');

// Bookmark sub-schema
const BookmarkSchema = new mongoose.Schema({
  time: { type: Number, required: true },
  label: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organization: { type: String },
  country: { type: String },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  startDate: { type: Date },
  endDate: { type: Date },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  instructors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
  // Streaming properties
  streamKey: { type: String, unique: true, sparse: true },
  streamStatus: { type: String, enum: ['offline', 'live', 'paused'], default: 'offline' },
  currentLesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' },
  currentStreamSource: { type: String, enum: ['live', 'mp4', 'upload', 'other'], default: 'live' },
  currentUploadPath: { type: String }, // Path to uploaded video file
  currentUploadFilename: { type: String }, // Filename of uploaded video
  bookmarks: [BookmarkSchema],
  
  createdAt: { type: Date, default: Date.now }
});

// Method to generate a unique stream key
ClassSchema.methods.generateStreamKey = function() {
  const prefix = this.name
    .replace(/\s+/g, '')
    .toLowerCase()
    .substring(0, 6);
    
  const randomBytes = crypto
    .randomBytes(4)
    .toString('hex');
    
  this.streamKey = `${prefix}_${randomBytes}`;
  return this.streamKey;
};

module.exports = mongoose.model('Class', ClassSchema);