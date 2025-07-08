const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['class', 'assignment', 'exam', 'meeting', 'deadline', 'announcement', 'break', 'other'],
    default: 'other'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'weekly'
    },
    interval: {
      type: Number,
      default: 1
    },
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }],
    endRecurrence: {
      type: Date
    },
    maxOccurrences: {
      type: Number
    }
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'tentative'],
      default: 'pending'
    },
    responseDate: Date
  }],
  location: {
    type: String,
    trim: true
  },
  virtualMeeting: {
    platform: {
      type: String,
      enum: ['zoom', 'teams', 'meet', 'webex', 'other']
    },
    meetingId: String,
    password: String,
    joinUrl: String
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'notification', 'sms'],
      default: 'notification'
    },
    minutesBefore: {
      type: Number,
      default: 15
    },
    sent: {
      type: Boolean,
      default: false
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  }],
  color: {
    type: String,
    default: '#3b82f6'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'class-only'],
    default: 'class-only'
  },
  metadata: {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment'
    },
    streamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StreamSession'
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
EventSchema.index({ classId: 1, startDate: 1 });
EventSchema.index({ createdBy: 1 });
EventSchema.index({ startDate: 1, endDate: 1 });
EventSchema.index({ type: 1, status: 1 });

// Virtual for duration in minutes
EventSchema.virtual('durationMinutes').get(function() {
  return Math.round((this.endDate - this.startDate) / (1000 * 60));
});

// Method to check if event is currently active
EventSchema.methods.isActive = function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now && this.status === 'scheduled';
};

// Method to check if event is upcoming
EventSchema.methods.isUpcoming = function(minutesAhead = 60) {
  const now = new Date();
  const threshold = new Date(now.getTime() + minutesAhead * 60 * 1000);
  return this.startDate > now && this.startDate <= threshold;
};

// Static method to get events for a class within date range
EventSchema.statics.getClassEvents = function(classId, startDate, endDate, options = {}) {
  const query = this.find({
    classId,
    $or: [
      { startDate: { $gte: startDate, $lte: endDate } },
      { endDate: { $gte: startDate, $lte: endDate } },
      { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
    ]
  });

  if (options.type) {
    query.where('type', options.type);
  }

  if (options.status) {
    query.where('status', options.status);
  }

  return query.sort({ startDate: 1 }).populate('createdBy', 'name');
};

// Static method to get upcoming events
EventSchema.statics.getUpcoming = function(classId, limit = 10) {
  const now = new Date();
  return this.find({
    classId,
    startDate: { $gte: now },
    status: { $in: ['scheduled', 'in-progress'] }
  })
  .sort({ startDate: 1 })
  .limit(limit)
  .populate('createdBy', 'name');
};

// Static method to get today's events
EventSchema.statics.getTodaysEvents = function(classId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  return this.find({
    classId,
    startDate: { $gte: startOfDay, $lt: endOfDay }
  })
  .sort({ startDate: 1 })
  .populate('createdBy', 'name');
};

// Pre-save middleware to validate dates
EventSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    next(new Error('End date must be after start date'));
  } else {
    next();
  }
});

module.exports = mongoose.model('Event', EventSchema);