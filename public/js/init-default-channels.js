const mongoose = require('mongoose');
const KitCommChannel = require('./models/KitCommChannel');
require('dotenv').config();

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smxkits';

async function initDefaultChannels() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const defaultChannels = ['Global', 'Team-1', 'Team-2', 'Instructor'];

    for (const channelName of defaultChannels) {
      const existing = await KitCommChannel.findOne({ name: channelName });
      if (!existing) {
        await KitCommChannel.create({
          name: channelName,
          createdBy: 'System',
          createdAt: new Date()
        });
        console.log(`✅ Created default channel: ${channelName}`);
      } else {
        console.log(`ℹ️  Channel already exists: ${channelName}`);
      }
    }

    console.log('🎉 Default channels initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing default channels:', error);
    process.exit(1);
  }
}

initDefaultChannels();