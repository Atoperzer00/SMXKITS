const mongoose = require('mongoose');
const path = require('path');

const MaterialSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  category: { 
    type: String, 
    enum: ['lecture', 'assignment', 'resource', 'reference', 'video', 'audio', 'document', 'presentation', 'spreadsheet', 'other'],
    default: 'resource'
  },
  
  // Class association
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true 
  },
  
  // File information
  fileName: { 
    type: String, 
    required: true 
  },
  originalName: { 
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
  mimeType: { 
    type: String, 
    required: true 
  },
  fileExtension: {
    type: String,
    lowercase: true
  },
  
  // Upload information
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  
  // Access control
  isPublic: { 
    type: Boolean, 
    default: false 
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Visibility settings
  visibleToStudents: {
    type: Boolean,
    default: true
  },
  visibleToInstructors: {
    type: Boolean,
    default: true
  },
  
  // Availability dates
  availableFrom: {
    type: Date,
    default: Date.now
  },
  availableUntil: {
    type: Date
  },
  
  // Usage statistics
  downloadCount: { 
    type: Number, 
    default: 0 
  },
  viewCount: {
    type: Number,
    default: 0
  },
  lastAccessed: {
    type: Date
  },
  
  // Content metadata
  metadata: {
    duration: Number, // for video/audio files in seconds
    pageCount: Number, // for documents
    resolution: String, // for images/videos
    author: String,
    subject: String,
    keywords: [String],
    language: String
  },
  
  // Thumbnail/preview
  thumbnail: {
    fileName: String,
    filePath: String,
    generated: { type: Boolean, default: false }
  },
  
  // Version control
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    fileName: String,
    filePath: String,
    uploadedAt: Date,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changeLog: String
  }],
  
  // Tags for organization
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  
  // Learning objectives
  learningObjectives: [String],
  
  // Prerequisites
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  
  // Related materials
  relatedMaterials: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material'
  }],
  
  // Comments and feedback
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Average rating
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  // Content status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'under-review'],
    default: 'published'
  },
  
  // Virus scan results
  virusScan: {
    scanned: { type: Boolean, default: false },
    clean: { type: Boolean, default: true },
    scanDate: Date,
    scanEngine: String
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
MaterialSchema.index({ classId: 1, category: 1 });
MaterialSchema.index({ uploadedBy: 1, uploadedAt: -1 });
MaterialSchema.index({ tags: 1 });
MaterialSchema.index({ status: 1, isActive: 1 });
MaterialSchema.index({ availableFrom: 1, availableUntil: 1 });

// Text index for search functionality
MaterialSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  'metadata.keywords': 'text'
});

// Virtual for file URL
MaterialSchema.virtual('fileUrl').get(function() {
  return `/api/materials/${this._id}/download`;
});

// Virtual for thumbnail URL
MaterialSchema.virtual('thumbnailUrl').get(function() {
  if (this.thumbnail && this.thumbnail.fileName) {
    return `/api/materials/${this._id}/thumbnail`;
  }
  return null;
});

// Virtual for human-readable file size
MaterialSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Virtual for checking if material is available
MaterialSchema.virtual('isAvailable').get(function() {
  const now = new Date();
  const availableFrom = this.availableFrom || new Date(0);
  const availableUntil = this.availableUntil || new Date('2099-12-31');
  
  return this.isActive && 
         this.status === 'published' && 
         now >= availableFrom && 
         now <= availableUntil;
});

// Pre-save middleware
MaterialSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Extract file extension
  if (this.originalName && !this.fileExtension) {
    this.fileExtension = path.extname(this.originalName).toLowerCase().substring(1);
  }
  
  // Auto-categorize based on file type
  if (!this.category || this.category === 'other') {
    this.category = this.getCategoryFromMimeType();
  }
  
  next();
});

// Method to get category from MIME type
MaterialSchema.methods.getCategoryFromMimeType = function() {
  const mimeType = this.mimeType.toLowerCase();
  
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('image/')) return 'resource';
  
  if (mimeType.includes('pdf')) return 'document';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  
  return 'other';
};

// Method to increment download count
MaterialSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Method to increment view count
MaterialSchema.methods.incrementView = function() {
  this.viewCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

// Method to add comment and update rating
MaterialSchema.methods.addComment = function(userId, comment, rating) {
  this.comments.push({
    userId,
    comment,
    rating,
    createdAt: new Date()
  });
  
  // Recalculate average rating
  const ratings = this.comments.filter(c => c.rating).map(c => c.rating);
  if (ratings.length > 0) {
    this.averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  }
  
  return this.save();
};

// Method to create new version
MaterialSchema.methods.createNewVersion = function(newFileData, changeLog) {
  // Move current version to previous versions
  this.previousVersions.push({
    version: this.version,
    fileName: this.fileName,
    filePath: this.filePath,
    uploadedAt: this.uploadedAt,
    uploadedBy: this.uploadedBy,
    changeLog: changeLog || 'Version update'
  });
  
  // Update current version
  this.version += 1;
  this.fileName = newFileData.fileName;
  this.filePath = newFileData.filePath;
  this.fileSize = newFileData.fileSize;
  this.mimeType = newFileData.mimeType;
  this.uploadedAt = new Date();
  
  return this.save();
};

// Static method to get materials for a class
MaterialSchema.statics.getClassMaterials = function(classId, options = {}) {
  const query = { 
    classId,
    isActive: true
  };
  
  if (options.category) {
    query.category = options.category;
  }
  
  if (options.available) {
    const now = new Date();
    query.availableFrom = { $lte: now };
    query.$or = [
      { availableUntil: { $exists: false } },
      { availableUntil: { $gte: now } }
    ];
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('uploadedBy', 'name email')
    .sort(options.sort || { uploadedAt: -1 });
};

// Static method to search materials
MaterialSchema.statics.searchMaterials = function(classId, searchTerm, options = {}) {
  const query = {
    classId,
    isActive: true,
    $text: { $search: searchTerm }
  };
  
  if (options.category) {
    query.category = options.category;
  }
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .populate('uploadedBy', 'name')
    .sort({ score: { $meta: 'textScore' } });
};

// Static method to get popular materials
MaterialSchema.statics.getPopularMaterials = function(classId, limit = 10) {
  return this.find({ 
    classId,
    isActive: true,
    status: 'published'
  })
  .populate('uploadedBy', 'name')
  .sort({ downloadCount: -1, viewCount: -1 })
  .limit(limit);
};

// Static method to get recent materials
MaterialSchema.statics.getRecentMaterials = function(classId, days = 7, limit = 10) {
  const dateThreshold = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
  
  return this.find({
    classId,
    isActive: true,
    status: 'published',
    uploadedAt: { $gte: dateThreshold }
  })
  .populate('uploadedBy', 'name')
  .sort({ uploadedAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Material', MaterialSchema);