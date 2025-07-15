const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true 
  },
  instructions: {
    type: String,
    default: ''
  },
  dueDate: { 
    type: Date, 
    required: true 
  },
  points: { 
    type: Number, 
    default: 100,
    min: 0,
    max: 1000
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
  
  // Assignment settings
  allowLateSubmissions: {
    type: Boolean,
    default: true
  },
  latePenalty: {
    type: Number,
    default: 10, // percentage per day
    min: 0,
    max: 100
  },
  maxAttempts: {
    type: Number,
    default: 1,
    min: 1
  },
  
  // File attachments
  attachments: [{
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    originalName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  // Grading rubric
  rubric: [{
    category: { 
      type: String, 
      required: true 
    },
    maxPoints: { 
      type: Number, 
      required: true,
      min: 0
    },
    description: { 
      type: String 
    },
    criteria: [{
      level: String, // e.g., "Excellent", "Good", "Fair", "Poor"
      points: Number,
      description: String
    }]
  }],
  
  // Assignment type and settings
  type: {
    type: String,
    enum: ['individual', 'group', 'quiz', 'project', 'presentation'],
    default: 'individual'
  },
  
  // Submission requirements
  submissionTypes: [{
    type: String,
    enum: ['file', 'text', 'url', 'media']
  }],
  
  allowedFileTypes: [{
    type: String // e.g., 'pdf', 'docx', 'pptx'
  }],
  
  maxFileSize: {
    type: Number,
    default: 10 * 1024 * 1024 // 10MB in bytes
  },
  
  // Visibility and availability
  isPublished: {
    type: Boolean,
    default: false
  },
  
  availableFrom: {
    type: Date,
    default: Date.now
  },
  
  availableUntil: {
    type: Date
  },
  
  // Auto-grading settings (for future implementation)
  autoGrading: {
    enabled: { type: Boolean, default: false },
    type: { 
      type: String, 
      enum: ['multiple-choice', 'true-false', 'fill-blank'],
      default: 'multiple-choice'
    },
    questions: [{
      question: String,
      type: String,
      options: [String],
      correctAnswer: mongoose.Schema.Types.Mixed,
      points: { type: Number, default: 1 }
    }]
  },
  
  // Statistics
  stats: {
    totalSubmissions: { type: Number, default: 0 },
    gradedSubmissions: { type: Number, default: 0 },
    averageGrade: { type: Number, default: 0 },
    highestGrade: { type: Number, default: 0 },
    lowestGrade: { type: Number, default: 0 }
  },
  
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Indexes for better performance
AssignmentSchema.index({ classId: 1, dueDate: 1 });
AssignmentSchema.index({ createdBy: 1, createdAt: -1 });
AssignmentSchema.index({ isPublished: 1, availableFrom: 1 });

// Virtual for checking if assignment is overdue
AssignmentSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate;
});

// Virtual for days until due
AssignmentSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to calculate total points from rubric
AssignmentSchema.methods.getTotalPoints = function() {
  if (this.rubric && this.rubric.length > 0) {
    return this.rubric.reduce((total, item) => total + item.maxPoints, 0);
  }
  return this.points;
};

// Method to update statistics
AssignmentSchema.methods.updateStats = async function() {
  const Submission = require('./Submission');
  
  const submissions = await Submission.find({ 
    assignmentId: this._id,
    status: 'graded'
  });
  
  if (submissions.length > 0) {
    const grades = submissions.map(s => s.grade).filter(g => g !== null && g !== undefined);
    
    this.stats.totalSubmissions = await Submission.countDocuments({ assignmentId: this._id });
    this.stats.gradedSubmissions = grades.length;
    
    if (grades.length > 0) {
      this.stats.averageGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
      this.stats.highestGrade = Math.max(...grades);
      this.stats.lowestGrade = Math.min(...grades);
    }
  }
  
  return this.save();
};

// Pre-save middleware to update timestamps
AssignmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get assignments for a class
AssignmentSchema.statics.getClassAssignments = function(classId, options = {}) {
  const query = { classId };
  
  if (options.published !== undefined) {
    query.isPublished = options.published;
  }
  
  if (options.available) {
    const now = new Date();
    query.availableFrom = { $lte: now };
    query.$or = [
      { availableUntil: { $exists: false } },
      { availableUntil: { $gte: now } }
    ];
  }
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .sort(options.sort || { dueDate: 1 });
};

// Static method to get upcoming assignments
AssignmentSchema.statics.getUpcomingAssignments = function(classId, days = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return this.find({
    classId,
    isPublished: true,
    dueDate: { $gte: now, $lte: futureDate }
  })
  .populate('createdBy', 'name')
  .sort({ dueDate: 1 });
};

// Static method to get overdue assignments
AssignmentSchema.statics.getOverdueAssignments = function(classId) {
  const now = new Date();
  
  return this.find({
    classId,
    isPublished: true,
    dueDate: { $lt: now }
  })
  .populate('createdBy', 'name')
  .sort({ dueDate: -1 });
};

module.exports = mongoose.model('Assignment', AssignmentSchema);