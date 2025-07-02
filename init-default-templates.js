const mongoose = require('mongoose');
const ClassTemplate = require('./models/ClassTemplate');
require('dotenv').config();

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smxkits';

const defaultTemplates = [
  {
    difficulty: 'Easy',
    name: 'Basic SMX Training',
    description: 'Introductory course covering fundamental SMX concepts and basic operations',
    durationWeeks: 4,
    modules: [
      {
        name: 'Introduction to SMX',
        description: 'Basic concepts and overview',
        order: 1,
        estimatedWeeks: 1,
        lessons: [
          {
            title: 'SMX Overview',
            description: 'Introduction to SMX systems',
            order: 1,
            duration: 1800 // 30 minutes
          },
          {
            title: 'Basic Navigation',
            description: 'Learning the interface',
            order: 2,
            duration: 2400 // 40 minutes
          }
        ]
      },
      {
        name: 'Basic Operations',
        description: 'Fundamental operational procedures',
        order: 2,
        estimatedWeeks: 2,
        lessons: [
          {
            title: 'System Startup',
            description: 'How to properly start the system',
            order: 1,
            duration: 1200 // 20 minutes
          },
          {
            title: 'Basic Commands',
            description: 'Essential command operations',
            order: 2,
            duration: 3600 // 60 minutes
          }
        ]
      },
      {
        name: 'Practice Exercises',
        description: 'Hands-on practice sessions',
        order: 3,
        estimatedWeeks: 1,
        lessons: [
          {
            title: 'Guided Practice',
            description: 'Step-by-step exercises',
            order: 1,
            duration: 2700 // 45 minutes
          }
        ]
      }
    ]
  },
  {
    difficulty: 'Medium',
    name: 'Intermediate SMX Training',
    description: 'Intermediate course covering advanced operations and tactical scenarios',
    durationWeeks: 8,
    modules: [
      {
        name: 'Advanced Operations',
        description: 'Complex operational procedures',
        order: 1,
        estimatedWeeks: 2,
        lessons: [
          {
            title: 'Advanced System Configuration',
            description: 'Complex system setup procedures',
            order: 1,
            duration: 3600 // 60 minutes
          },
          {
            title: 'Multi-System Integration',
            description: 'Working with multiple systems',
            order: 2,
            duration: 4800 // 80 minutes
          }
        ]
      },
      {
        name: 'Tactical Scenarios',
        description: 'Real-world scenario training',
        order: 2,
        estimatedWeeks: 3,
        lessons: [
          {
            title: 'Scenario Planning',
            description: 'Strategic approach to scenarios',
            order: 1,
            duration: 2700 // 45 minutes
          },
          {
            title: 'Execution Techniques',
            description: 'Tactical execution methods',
            order: 2,
            duration: 5400 // 90 minutes
          }
        ]
      },
      {
        name: 'Advanced Practice',
        description: 'Complex practice scenarios',
        order: 3,
        estimatedWeeks: 2,
        lessons: [
          {
            title: 'Simulation Exercises',
            description: 'Full scenario simulations',
            order: 1,
            duration: 7200 // 120 minutes
          }
        ]
      },
      {
        name: 'Assessment',
        description: 'Skills evaluation and certification',
        order: 4,
        estimatedWeeks: 1,
        lessons: [
          {
            title: 'Practical Assessment',
            description: 'Hands-on skills evaluation',
            order: 1,
            duration: 3600 // 60 minutes
          }
        ]
      }
    ]
  },
  {
    difficulty: 'Hard',
    name: 'Advanced SMX Specialist Training',
    description: 'Expert-level course for advanced practitioners and instructors',
    durationWeeks: 12,
    modules: [
      {
        name: 'Expert Systems',
        description: 'Advanced system mastery',
        order: 1,
        estimatedWeeks: 3,
        lessons: [
          {
            title: 'System Architecture Deep Dive',
            description: 'Understanding system internals',
            order: 1,
            duration: 5400 // 90 minutes
          },
          {
            title: 'Custom Configuration',
            description: 'Advanced customization techniques',
            order: 2,
            duration: 7200 // 120 minutes
          },
          {
            title: 'Troubleshooting Mastery',
            description: 'Expert-level problem solving',
            order: 3,
            duration: 6300 // 105 minutes
          }
        ]
      },
      {
        name: 'Leadership & Training',
        description: 'Training others and leadership skills',
        order: 2,
        estimatedWeeks: 3,
        lessons: [
          {
            title: 'Instructional Design',
            description: 'Creating effective training programs',
            order: 1,
            duration: 4800 // 80 minutes
          },
          {
            title: 'Team Leadership',
            description: 'Leading technical teams',
            order: 2,
            duration: 3600 // 60 minutes
          }
        ]
      },
      {
        name: 'Complex Scenarios',
        description: 'Multi-faceted operational scenarios',
        order: 3,
        estimatedWeeks: 4,
        lessons: [
          {
            title: 'Multi-Domain Operations',
            description: 'Cross-platform scenario management',
            order: 1,
            duration: 9000 // 150 minutes
          },
          {
            title: 'Crisis Management',
            description: 'Handling critical situations',
            order: 2,
            duration: 7200 // 120 minutes
          }
        ]
      },
      {
        name: 'Certification',
        description: 'Expert certification process',
        order: 4,
        estimatedWeeks: 2,
        lessons: [
          {
            title: 'Comprehensive Examination',
            description: 'Final certification exam',
            order: 1,
            duration: 10800 // 180 minutes
          },
          {
            title: 'Practical Demonstration',
            description: 'Live skills demonstration',
            order: 2,
            duration: 7200 // 120 minutes
          }
        ]
      }
    ]
  }
];

async function initializeTemplates() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️ Clearing existing templates...');
    await ClassTemplate.deleteMany({});

    console.log('📚 Creating default templates...');
    for (const template of defaultTemplates) {
      const newTemplate = new ClassTemplate(template);
      await newTemplate.save();
      console.log(`✅ Created ${template.difficulty} template: ${template.name}`);
    }

    console.log('🎉 Default templates initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing templates:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeTemplates();
}

module.exports = { initializeTemplates, defaultTemplates };