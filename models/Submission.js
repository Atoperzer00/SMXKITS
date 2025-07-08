const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
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
  studentName: { 
    type: String, 
    required: true 
  },
  fileName: { 
    type: String, 
    required: true 
  },
  originalFileName: { 
    type: String, 
    required: true 
  },
  filePath: { 
    type: String, 
    required: true 
  },
  fileSize: { 
    type: Number, 
    required: true 
  },
  fileType: { 
    type: String, 
    required: true 
  },
  missionTitle: { 
    type: String, 
    default: 'General Submission' 
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  submittedBy: { 
    type: String,
    default: null // Name of the person who submitted on behalf of the student
  },
  status: { 
    type: String, 
    enum: ['pending', 'reviewing', 'graded'], 
    default: 'pending' 
  },
  grade: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  rubricScores: [{
    category: String,
    score: Number,
    maxScore: Number
  }],
  instructorNotes: { 
    type: String 
  },
  feedbackFile: { 
    type: String 
  },
  gradedAt: { 
    type: Date 
  },
  gradedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
});

// Index for efficient queries
SubmissionSchema.index({ classId: 1, submittedAt: -1 });
SubmissionSchema.index({ studentId: 1, submittedAt: -1 });
SubmissionSchema.index({ status: 1 });

module.exports = mongoose.model('Submission', SubmissionSchema);