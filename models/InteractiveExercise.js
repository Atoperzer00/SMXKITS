const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer', 'drag-drop', 'matching', 'fill-blank', 'code', 'drawing'],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  points: {
    type: Number,
    default: 1,
    min: 0
  },
  timeLimit: {
    type: Number, // in seconds
    default: 0 // 0 means no limit
  },
  options: [{
    id: String,
    text: String,
    isCorrect: Boolean,
    explanation: String
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed
  },
  hints: [{
    text: String,
    pointDeduction: {
      type: Number,
      default: 0
    }
  }],
  explanation: {
    type: String
  },
  media: {
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document']
    },
    url: String,
    caption: String
  },
  codeTemplate: {
    type: String // for coding questions
  },
  language: {
    type: String, // programming language for code questions
    default: 'javascript'
  },
  testCases: [{
    input: String,
    expectedOutput: String,
    hidden: Boolean
  }],
  dragDropItems: [{
    id: String,
    content: String,
    category: String
  }],
  matchingPairs: [{
    left: String,
    right: String
  }]
});

const InteractiveExerciseSchema = new mongoose.Schema({
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
    enum: ['quiz', 'poll', 'survey', 'game', 'simulation', 'collaborative', 'assessment'],
    default: 'quiz'
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
  questions: [QuestionSchema],
  settings: {
    timeLimit: {
      type: Number, // in minutes
      default: 0 // 0 means no limit
    },
    attempts: {
      type: Number,
      default: 1,
      min: 1
    },
    shuffleQuestions: {
      type: Boolean,
      default: false
    },
    shuffleOptions: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: String,
      enum: ['immediately', 'after-submission', 'after-due-date', 'never'],
      default: 'after-submission'
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true
    },
    allowReview: {
      type: Boolean,
      default: true
    },
    requireAllQuestions: {
      type: Boolean,
      default: true
    },
    randomizeFromPool: {
      type: Boolean,
      default: false
    },
    questionsPerAttempt: {
      type: Number,
      default: 0 // 0 means all questions
    }
  },
  scheduling: {
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  grading: {
    totalPoints: {
      type: Number,
      default: 0
    },
    passingScore: {
      type: Number,
      default: 70
    },
    gradingMethod: {
      type: String,
      enum: ['highest', 'latest', 'average'],
      default: 'highest'
    },
    partialCredit: {
      type: Boolean,
      default: true
    }
  },
  collaboration: {
    allowTeamwork: {
      type: Boolean,
      default: false
    },
    maxTeamSize: {
      type: Number,
      default: 4
    },
    teams: [{
      name: String,
      members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      leader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  },
  gamification: {
    enabled: {
      type: Boolean,
      default: false
    },
    badges: [{
      name: String,
      description: String,
      icon: String,
      condition: String // JSON string describing condition
    }],
    leaderboard: {
      enabled: {
        type: Boolean,
        default: false
      },
      anonymous: {
        type: Boolean,
        default: false
      }
    },
    streaks: {
      enabled: {
        type: Boolean,
        default: false
      }
    }
  },
  analytics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number,
      default: 0
    },
    difficultyRating: {
      type: Number,
      default: 0,
      min: 1,
      max: 5
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'active', 'completed', 'archived'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['public', 'class-only', 'private'],
    default: 'class-only'
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'intermediate'
  }
}, {
  timestamps: true
});

// Indexes for better performance
InteractiveExerciseSchema.index({ classId: 1, status: 1 });
InteractiveExerciseSchema.index({ createdBy: 1 });
InteractiveExerciseSchema.index({ type: 1, status: 1 });
InteractiveExerciseSchema.index({ 'scheduling.startDate': 1, 'scheduling.endDate': 1 });

// Virtual for checking if exercise is active
InteractiveExerciseSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'active' && 
         now >= this.scheduling.startDate && 
         (!this.scheduling.endDate || now <= this.scheduling.endDate);
});

// Virtual for checking if exercise is available
InteractiveExerciseSchema.virtual('isAvailable').get(function() {
  const now = new Date();
  return this.status === 'published' && 
         now >= this.scheduling.startDate && 
         (!this.scheduling.endDate || now <= this.scheduling.endDate);
});

// Pre-save middleware to calculate total points
InteractiveExerciseSchema.pre('save', function(next) {
  this.grading.totalPoints = this.questions.reduce((total, question) => {
    return total + (question.points || 0);
  }, 0);
  next();
});

// Method to start exercise session
InteractiveExerciseSchema.methods.startSession = function(userId, teamId = null) {
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    sessionId,
    exerciseId: this._id,
    userId,
    teamId,
    startTime: new Date(),
    questions: this.settings.shuffleQuestions ? 
      this.shuffleArray([...this.questions]) : 
      [...this.questions],
    currentQuestionIndex: 0,
    answers: {},
    score: 0,
    timeRemaining: this.settings.timeLimit * 60, // convert to seconds
    status: 'in-progress'
  };
};

// Method to shuffle array
InteractiveExerciseSchema.methods.shuffleArray = function(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Method to validate answer
InteractiveExerciseSchema.methods.validateAnswer = function(questionId, answer) {
  const question = this.questions.find(q => q.id === questionId);
  if (!question) {
    return { valid: false, error: 'Question not found' };
  }

  let isCorrect = false;
  let score = 0;

  switch (question.type) {
    case 'multiple-choice':
      isCorrect = question.options.find(opt => opt.id === answer && opt.isCorrect);
      score = isCorrect ? question.points : 0;
      break;
      
    case 'true-false':
      isCorrect = answer === question.correctAnswer;
      score = isCorrect ? question.points : 0;
      break;
      
    case 'short-answer':
      // Simple string comparison (can be enhanced with fuzzy matching)
      isCorrect = answer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
      score = isCorrect ? question.points : 0;
      break;
      
    case 'fill-blank':
      // Check if all blanks are filled correctly
      const correctAnswers = Array.isArray(question.correctAnswer) ? 
        question.correctAnswer : [question.correctAnswer];
      const userAnswers = Array.isArray(answer) ? answer : [answer];
      
      isCorrect = correctAnswers.every((correct, index) => 
        userAnswers[index] && 
        userAnswers[index].toLowerCase().trim() === correct.toLowerCase().trim()
      );
      score = isCorrect ? question.points : 0;
      break;
      
    case 'matching':
      // Check if all pairs are matched correctly
      const correctPairs = question.matchingPairs;
      isCorrect = correctPairs.every(pair => 
        answer[pair.left] === pair.right
      );
      score = isCorrect ? question.points : 0;
      break;
      
    default:
      return { valid: false, error: 'Unsupported question type' };
  }

  return {
    valid: true,
    isCorrect,
    score,
    explanation: question.explanation,
    correctAnswer: question.correctAnswer
  };
};

// Static method to get active exercises for class
InteractiveExerciseSchema.statics.getActiveForClass = function(classId) {
  const now = new Date();
  return this.find({
    classId,
    status: { $in: ['published', 'active'] },
    'scheduling.startDate': { $lte: now },
    $or: [
      { 'scheduling.endDate': { $exists: false } },
      { 'scheduling.endDate': { $gte: now } }
    ]
  }).populate('createdBy', 'name').sort({ 'scheduling.startDate': 1 });
};

// Static method to get upcoming exercises
InteractiveExerciseSchema.statics.getUpcoming = function(classId, days = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return this.find({
    classId,
    status: 'published',
    'scheduling.startDate': { $gt: now, $lte: futureDate }
  }).populate('createdBy', 'name').sort({ 'scheduling.startDate': 1 });
};

module.exports = mongoose.model('InteractiveExercise', InteractiveExerciseSchema);