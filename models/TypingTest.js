const mongoose = require('mongoose');

const TypingTestSchema = new mongoose.Schema({
  modules: {
    type: [[String]], // Array of arrays of strings
    required: true,
    default: []
  },
  moduleNames: {
    type: [String],
    required: true,
    default: []
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Ensure there's only one typing test configuration (singleton pattern)
TypingTestSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    // Create default configuration if none exists
    config = await this.create({
      modules: [
        // Module 1: Basic Typing
        [
          'The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.',
          'Practice makes perfect. Keep typing to improve your speed and accuracy with consistent daily training.',
          'Touch typing is a skill that will serve you well throughout your career and personal computing tasks.',
          ...Array.from({length: 17}, (_, i) => `Module 1 Practice ${i + 4}: Enter typing text here.`)
        ],
        // Module 2: Numbers and Symbols
        [
          '1234567890 !@#$%^&*() The numbers and symbols are important for data entry and programming tasks.',
          'Email addresses like user@example.com require symbol typing skills for professional communication.',
          'Special characters: ~`!@#$%^&*()_+-={}[]|\\:";\'<>?,./ are used in coding and technical writing.',
          ...Array.from({length: 17}, (_, i) => `Module 2 Practice ${i + 4}: Enter typing text here.`)
        ],
        // Module 3: Military Terminology
        [
          'Military ranks: Private, Corporal, Sergeant, Lieutenant, Captain, Major, Colonel, General.',
          'Military time: 0600 hours, 1200 hours, 1800 hours, 2400 hours for precise time coordination.',
          'NATO phonetic alphabet: Alpha, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel, India, Juliet.',
          ...Array.from({length: 17}, (_, i) => `Module 3 Practice ${i + 4}: Enter typing text here.`)
        ],
        // Module 4: POL Basic Descriptors
        [
          'One adult male in dark traditional wear. Two adult females in light clothing observed at location.',
          'Personnel count: Three adult males, one adult female, two children observed entering the compound.',
          'Description: Individual wearing dark jacket, light pants, carrying backpack, proceeding north.',
          ...Array.from({length: 17}, (_, i) => `Module 4 Practice ${i + 4}: Enter typing text here.`)
        ],
        // Module 5: POL SITREP Format
        [
          'SITREP: At 0630Z, one adult male departed E gate on red motorcycle, rode S out of FOV 0635Z. SLANT 1/0/0',
          'SITREP: At 0745Z, white sedan entered compound through W gate, parked E side. SLANT 1/0/0',
          'SITREP: At 0900Z, two adult males on foot entered compound, proceeded to building A. SLANT 2/0/0',
          ...Array.from({length: 17}, (_, i) => `Module 5 Practice ${i + 4}: Enter typing text here.`)
        ]
      ],
      moduleNames: [
        'Module 1: Basic Typing',
        'Module 2: Numbers and Symbols',
        'Module 3: Military Terminology',
        'Module 4: POL Basic Descriptors',
        'Module 5: POL SITREP Format'
      ]
    });
  }
  return config;
};

TypingTestSchema.statics.updateConfig = async function(data, userId = null) {
  let config = await this.findOne();
  if (!config) {
    config = new this(data);
  } else {
    config.modules = data.modules;
    config.moduleNames = data.moduleNames;
  }
  
  config.lastUpdated = new Date();
  if (userId) {
    config.updatedBy = userId;
  }
  
  return await config.save();
};

module.exports = mongoose.model('TypingTest', TypingTestSchema);