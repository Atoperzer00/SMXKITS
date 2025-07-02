const mongoose = require('mongoose');

// Daily content sub-schema
const DailyContentSchema = new mongoose.Schema({
  day: { type: Number, required: true }, // Day number from start (1, 2, 3, etc.)
  date: { type: Date }, // Specific date if set
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
  notes: { type: String }
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