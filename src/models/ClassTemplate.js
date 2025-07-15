const mongoose = require('mongoose');

// Time block sub-schema for detailed scheduling
const TimeBlockSchema = new mongoose.Schema({
  startTime: { type: String, required: true }, // HH:MM format
  endTime: { type: String, required: true }, // HH:MM format
  type: { 
    type: String, 
    required: true,
    enum: ['course', 'mission', 'keyboard', 'ia', 'screener', 'other']
  },
  contentId: { type: String }, // Reference to specific content
  title: { type: String }, // Custom title override
  description: { type: String },
  isRequired: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
});

// Daily content sub-schema with enhanced scheduling
const DailyContentSchema = new mongoose.Schema({
  day: { type: Number, required: true }, // Day number from start (1, 2, 3, etc.)
  date: { type: Date }, // Specific date if set
  timeBlocks: [TimeBlockSchema], // Detailed time-based schedule
  // Legacy content arrays (maintained for backward compatibility)
  missionReferences: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    filePath: { type: String },
    duration: { type: Number, default: 0 }
  }],
  courseContent: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    filePath: { type: String },
    duration: { type: Number, default: 0 }
  }],
  typingTests: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    targetWPM: { type: Number, default: 30 },
    duration: { type: Number, default: 300 } // 5 minutes default
  }],
  iaTraining: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    duration: { type: Number, default: 0 },
    level: { type: String, enum: ['basic', 'intermediate', 'advanced'], default: 'basic' }
  }],
  screenerTraining: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    duration: { type: Number, default: 0 },
    level: { type: String, enum: ['basic', 'intermediate', 'advanced'], default: 'basic' }
  }],
  notes: { type: String },
  isActive: { type: Boolean, default: true } // Whether this day is active in the schedule
});

// Module sub-schema for templates
const ModuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  order: { type: Number, required: true },
  lessons: [{
    title: { type: String, required: true },
    description: { type: String },
    filePath: { type: String },
    duration: { type: Number, default: 0 }, // in seconds
    order: { type: Number, default: 0 }
  }],
  estimatedWeeks: { type: Number, default: 1 },
  dailySchedule: [DailyContentSchema] // Daily breakdown for this module
});

const ClassTemplateSchema = new mongoose.Schema({
  difficulty: { 
    type: String, 
    enum: ['Easy', 'Medium', 'Hard'], 
    required: true,
    unique: true 
  },
  name: { type: String, required: true },
  description: { type: String },
  durationWeeks: { type: Number, required: true },
  modules: [ModuleSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
ClassTemplateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ClassTemplate', ClassTemplateSchema);