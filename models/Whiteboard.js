const mongoose = require('mongoose');

const WhiteboardElementSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['line', 'rectangle', 'circle', 'text', 'image', 'arrow', 'freehand'],
    required: true
  },
  x: {
    type: Number,
    required: true
  },
  y: {
    type: Number,
    required: true
  },
  width: {
    type: Number,
    default: 0
  },
  height: {
    type: Number,
    default: 0
  },
  strokeColor: {
    type: String,
    default: '#000000'
  },
  fillColor: {
    type: String,
    default: 'transparent'
  },
  strokeWidth: {
    type: Number,
    default: 2
  },
  text: {
    type: String,
    default: ''
  },
  fontSize: {
    type: Number,
    default: 16
  },
  fontFamily: {
    type: String,
    default: 'Arial'
  },
  points: [{
    x: Number,
    y: Number
  }],
  imageUrl: {
    type: String
  },
  rotation: {
    type: Number,
    default: 0
  },
  opacity: {
    type: Number,
    default: 1,
    min: 0,
    max: 1
  },
  layer: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const WhiteboardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
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
  elements: [WhiteboardElementSchema],
  settings: {
    width: {
      type: Number,
      default: 1920
    },
    height: {
      type: Number,
      default: 1080
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    gridEnabled: {
      type: Boolean,
      default: true
    },
    gridSize: {
      type: Number,
      default: 20
    },
    snapToGrid: {
      type: Boolean,
      default: false
    }
  },
  permissions: {
    allowStudentEdit: {
      type: Boolean,
      default: false
    },
    allowStudentView: {
      type: Boolean,
      default: true
    },
    moderatedMode: {
      type: Boolean,
      default: false
    }
  },
  activeUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    cursor: {
      x: Number,
      y: Number
    },
    color: {
      type: String,
      default: '#3b82f6'
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  }],
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sessionId: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
WhiteboardSchema.index({ classId: 1, isActive: 1 });
WhiteboardSchema.index({ sessionId: 1 });
WhiteboardSchema.index({ createdBy: 1 });

// Generate unique session ID before saving
WhiteboardSchema.pre('save', function(next) {
  if (!this.sessionId) {
    this.sessionId = `wb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Method to add element
WhiteboardSchema.methods.addElement = function(elementData, userId) {
  const element = {
    ...elementData,
    id: `elem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdBy: userId,
    createdAt: new Date()
  };
  
  this.elements.push(element);
  this.version += 1;
  return element;
};

// Method to update element
WhiteboardSchema.methods.updateElement = function(elementId, updates) {
  const element = this.elements.id(elementId);
  if (element) {
    Object.assign(element, updates);
    this.version += 1;
    return element;
  }
  return null;
};

// Method to remove element
WhiteboardSchema.methods.removeElement = function(elementId) {
  const element = this.elements.id(elementId);
  if (element) {
    element.remove();
    this.version += 1;
    return true;
  }
  return false;
};

// Method to add active user
WhiteboardSchema.methods.addActiveUser = function(userId, cursor, color) {
  const existingUser = this.activeUsers.find(user => user.userId.toString() === userId.toString());
  
  if (existingUser) {
    existingUser.cursor = cursor;
    existingUser.lastActive = new Date();
  } else {
    this.activeUsers.push({
      userId,
      cursor,
      color: color || '#3b82f6',
      lastActive: new Date()
    });
  }
};

// Method to remove inactive users
WhiteboardSchema.methods.removeInactiveUsers = function(timeoutMinutes = 5) {
  const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);
  this.activeUsers = this.activeUsers.filter(user => user.lastActive > cutoff);
};

// Static method to get active whiteboards for class
WhiteboardSchema.statics.getActiveForClass = function(classId) {
  return this.find({ classId, isActive: true })
    .populate('createdBy', 'name')
    .populate('activeUsers.userId', 'name')
    .sort({ updatedAt: -1 });
};

module.exports = mongoose.model('Whiteboard', WhiteboardSchema);