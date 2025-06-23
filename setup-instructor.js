// Setup script to create default instructor account
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Class = require('./models/Class');

async function setupInstructor() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Create a default class if it doesn't exist
    let defaultClass = await Class.findOne({ name: 'Default Class' });
    if (!defaultClass) {
      defaultClass = new Class({
        name: 'Default Class',
        description: 'Default class for SMX KITS'
      });
      await defaultClass.save();
      console.log('✅ Created default class');
    }

    // Check if instructor already exists
    const existingInstructor = await User.findOne({ username: 'instructor' });
    if (existingInstructor) {
      console.log('ℹ️  Instructor account already exists');
      console.log('Username: instructor');
      console.log('Password: instructor123');
      console.log('Role:', existingInstructor.role);
      return;
    }

    // Create instructor account
    const hashedPassword = await bcrypt.hash('instructor123', 10);
    const instructor = new User({
      username: 'instructor',
      password: hashedPassword,
      role: 'instructor',
      name: 'Default Instructor',
      classId: defaultClass._id
    });

    await instructor.save();
    console.log('✅ Instructor account created successfully!');
    console.log('');
    console.log('🔑 Instructor Login Credentials:');
    console.log('Username: instructor');
    console.log('Password: instructor123');
    console.log('Role: instructor');
    console.log('');
    console.log('🌐 Access the instructor dashboard at:');
    console.log('http://localhost:5000/login.html');

  } catch (error) {
    console.error('❌ Error setting up instructor:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Also create admin account
async function setupAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Admin account already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      name: 'System Administrator'
    });

    await admin.save();
    console.log('✅ Admin account created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error setting up admin:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

async function setup() {
  console.log('🚀 Setting up SMX KITS instructor and admin accounts...');
  console.log('='.repeat(50));
  
  await setupInstructor();
  await setupAdmin();
  
  console.log('');
  console.log('🎉 Setup complete!');
  console.log('You can now login at: http://localhost:5000/login.html');
}

setup().catch(console.error);