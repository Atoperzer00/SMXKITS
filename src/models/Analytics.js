const mongoose = require('mongoose');

const StudentActivitySchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  sessionId: {
    type: String,
    required: true
  },
  activityType: {
    type: String,
    enum: ['login', 'logout', 'page-view', 'assignment-start', 'assignment-submit', 'quiz-start', 'quiz-complete', 'video-watch', 'material-download', 'chat-message', 'whiteboard-edit', 'exercise-participate'],
    required: true
  },
  details: {
    pageUrl: String,
    assignmentId: mongoose.Schema.Types.ObjectId,
    quizId: mongoose.Schema.Types.ObjectId,
    exerciseId: mongoose.Schema.Types.ObjectId,
    materialId: mongoose.Schema.Types.ObjectId,
    videoId: String,
    watchTime: Number, // in seconds
    score: Number,
    timeSpent: Number, // in seconds
    metadata: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipAddress: String,
  userAgent: String,
  location: {
    country: String,
    city: String,
    timezone: String
  }
});

const ClassAnalyticsSchema = new mongoose.Schema({
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    unique: true
  },
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'semester'],
    default: 'daily'
  },
  date: {
    type: Date,
    required: true
  },
  metrics: {
    // Engagement Metrics
    totalStudents: {
      type: Number,
      default: 0
    },
    activeStudents: {
      type: Number,
      default: 0
    },
    averageSessionDuration: {
      type: Number,
      default: 0
    },
    totalSessions: {
      type: Number,
      default: 0
    },
    
    // Academic Performance
    averageGrade: {
      type: Number,
      default: 0
    },
    assignmentsSubmitted: {
      type: Number,
      default: 0
    },
    assignmentsOverdue: {
      type: Number,
      default: 0
    },
    quizzesCompleted: {
      type: Number,
      default: 0
    },
    averageQuizScore: {
      type: Number,
      default: 0
    },
    
    // Content Engagement
    materialsDownloaded: {
      type: Number,
      default: 0
    },
    videosWatched: {
      type: Number,
      default: 0
    },
    totalVideoWatchTime: {
      type: Number,
      default: 0
    },
    forumPosts: {
      type: Number,
      default: 0
    },
    chatMessages: {
      type: Number,
      default: 0
    },
    
    // Collaboration
    whiteboardSessions: {
      type: Number,
      default: 0
    },
    exerciseParticipation: {
      type: Number,
      default: 0
    },
    peerReviews: {
      type: Number,
      default: 0
    },
    
    // Attendance & Participation
    liveStreamAttendance: {
      type: Number,
      default: 0
    },
    averageAttendanceRate: {
      type: Number,
      default: 0
    },
    participationScore: {
      type: Number,
      default: 0
    }
  },
  
  // Detailed breakdowns
  studentMetrics: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    loginCount: Number,
    sessionDuration: Number,
    assignmentsCompleted: Number,
    averageGrade: Number,
    participationScore: Number,
    lastActive: Date,
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    }
  }],
  
  // Time-based activity patterns
  activityPatterns: {
    hourlyActivity: [{
      hour: Number,
      count: Number
    }],
    dailyActivity: [{
      day: String,
      count: Number
    }],
    weeklyTrends: [{
      week: Number,
      engagement: Number,
      performance: Number
    }]
  },
  
  // Content performance
  contentAnalytics: {
    mostViewedMaterials: [{
      materialId: mongoose.Schema.Types.ObjectId,
      title: String,
      views: Number,
      downloads: Number
    }],
    mostEngagingVideos: [{
      videoId: String,
      title: String,
      totalWatchTime: Number,
      completionRate: Number
    }],
    difficultAssignments: [{
      assignmentId: mongoose.Schema.Types.ObjectId,
      title: String,
      averageScore: Number,
      completionRate: Number,
      averageTimeSpent: Number
    }]
  }
}, {
  timestamps: true
});

// Indexes for better performance
StudentActivitySchema.index({ studentId: 1, classId: 1, timestamp: -1 });
StudentActivitySchema.index({ classId: 1, activityType: 1, timestamp: -1 });
StudentActivitySchema.index({ sessionId: 1 });

ClassAnalyticsSchema.index({ classId: 1, date: -1 });
ClassAnalyticsSchema.index({ classId: 1, period: 1, date: -1 });

// Static methods for StudentActivity
StudentActivitySchema.statics.logActivity = function(activityData) {
  const activity = new this(activityData);
  return activity.save();
};

StudentActivitySchema.statics.getStudentActivity = function(studentId, classId, startDate, endDate) {
  const query = { studentId, classId };
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  return this.find(query).sort({ timestamp: -1 });
};

StudentActivitySchema.statics.getClassActivity = function(classId, activityType, startDate, endDate) {
  const query = { classId };
  
  if (activityType) {
    query.activityType = activityType;
  }
  
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lte = endDate;
  }
  
  return this.find(query).populate('studentId', 'name').sort({ timestamp: -1 });
};

// Static methods for ClassAnalytics
ClassAnalyticsSchema.statics.generateDailyReport = async function(classId, date = new Date()) {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  
  // Get all activities for the day
  const activities = await mongoose.model('StudentActivity').find({
    classId,
    timestamp: { $gte: startOfDay, $lt: endOfDay }
  }).populate('studentId', 'name');
  
  // Calculate metrics
  const uniqueStudents = new Set(activities.map(a => a.studentId._id.toString()));
  const sessions = new Map();
  
  activities.forEach(activity => {
    if (!sessions.has(activity.sessionId)) {
      sessions.set(activity.sessionId, {
        studentId: activity.studentId._id,
        start: activity.timestamp,
        end: activity.timestamp,
        activities: []
      });
    }
    
    const session = sessions.get(activity.sessionId);
    session.end = activity.timestamp;
    session.activities.push(activity);
  });
  
  const totalSessionDuration = Array.from(sessions.values())
    .reduce((total, session) => total + (session.end - session.start), 0);
  
  const metrics = {
    totalStudents: uniqueStudents.size,
    activeStudents: uniqueStudents.size,
    totalSessions: sessions.size,
    averageSessionDuration: sessions.size > 0 ? totalSessionDuration / sessions.size / 1000 / 60 : 0, // in minutes
    assignmentsSubmitted: activities.filter(a => a.activityType === 'assignment-submit').length,
    quizzesCompleted: activities.filter(a => a.activityType === 'quiz-complete').length,
    materialsDownloaded: activities.filter(a => a.activityType === 'material-download').length,
    videosWatched: activities.filter(a => a.activityType === 'video-watch').length,
    chatMessages: activities.filter(a => a.activityType === 'chat-message').length,
    whiteboardSessions: activities.filter(a => a.activityType === 'whiteboard-edit').length,
    exerciseParticipation: activities.filter(a => a.activityType === 'exercise-participate').length
  };
  
  // Generate hourly activity pattern
  const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: activities.filter(a => a.timestamp.getHours() === hour).length
  }));
  
  // Update or create analytics record
  const analytics = await this.findOneAndUpdate(
    { classId, date: startOfDay, period: 'daily' },
    {
      classId,
      date: startOfDay,
      period: 'daily',
      metrics,
      activityPatterns: { hourlyActivity }
    },
    { upsert: true, new: true }
  );
  
  return analytics;
};

ClassAnalyticsSchema.statics.getEngagementTrends = function(classId, days = 30) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  
  return this.find({
    classId,
    period: 'daily',
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });
};

ClassAnalyticsSchema.statics.getPerformanceMetrics = function(classId, period = 'weekly') {
  return this.findOne({
    classId,
    period,
    date: { $lte: new Date() }
  }).sort({ date: -1 });
};

// Method to calculate risk level for students
ClassAnalyticsSchema.methods.calculateStudentRiskLevels = function() {
  this.studentMetrics.forEach(student => {
    let riskScore = 0;
    
    // Low login frequency
    if (student.loginCount < 3) riskScore += 2;
    
    // Short session duration
    if (student.sessionDuration < 30) riskScore += 2; // less than 30 minutes
    
    // Low assignment completion
    if (student.assignmentsCompleted < 2) riskScore += 3;
    
    // Low average grade
    if (student.averageGrade < 70) riskScore += 3;
    
    // Low participation
    if (student.participationScore < 50) riskScore += 2;
    
    // Inactive for long period
    const daysSinceActive = (new Date() - student.lastActive) / (1000 * 60 * 60 * 24);
    if (daysSinceActive > 7) riskScore += 3;
    
    // Assign risk level
    if (riskScore >= 8) {
      student.riskLevel = 'high';
    } else if (riskScore >= 4) {
      student.riskLevel = 'medium';
    } else {
      student.riskLevel = 'low';
    }
  });
};

const StudentActivity = mongoose.model('StudentActivity', StudentActivitySchema);
const ClassAnalytics = mongoose.model('ClassAnalytics', ClassAnalyticsSchema);

module.exports = {
  StudentActivity,
  ClassAnalytics
};