// Simple admin setup script
// Run this with: node setup-admin.js

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Simple User schema (inline to avoid import issues)
const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: { type: String },
  role: { type: String, enum: ['admin', 'instructor', 'student'], default: 'student' },
  classId: { type: String }, // Changed to String for simplicity
  name: String
});

const User = mongoose.model('User', UserSchema);

async function setupAdmin() {
  try {
    console.log('🔧 Setting up admin user...');
    
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/smxkits';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('Username: admin');
      console.log('You can use this to login to the admin dashboard.');
      process.exit(0);
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      username: 'admin',
      password: adminPassword,
      role: 'admin',
      name: 'System Administrator',
      classId: 'ADMIN'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('=== LOGIN CREDENTIALS ===');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: admin');
    console.log('');
    console.log('🌐 You can now login at: http://localhost:5000/login.html');
    console.log('⚠️  Please change the password after first login!');

    // Also create test users
    try {
      const instructorPassword = await bcrypt.hash('instructor123', 10);
      const instructorUser = new User({
        username: 'instructor',
        password: instructorPassword,
        role: 'instructor',
        name: 'Test Instructor',
        classId: 'SMX001'
      });
      await instructorUser.save();
      console.log('✅ Test instructor created - Username: instructor, Password: instructor123');

      const studentPassword = await bcrypt.hash('student123', 10);
      const studentUser = new User({
        username: 'student',
        password: studentPassword,
        role: 'student',
        name: 'Test Student',
        classId: 'SMX001'
      });
      await studentUser.save();
      console.log('✅ Test student created - Username: student, Password: student123');
    } catch (error) {
      console.log('ℹ️ Test users may already exist');
    }

  } catch (error) {
    console.error('❌ Error setting up admin:', error.message);
    if (error.code === 11000) {
      console.log('✅ Admin user already exists!');
    }
  } finally {
    mongoose.connection.close();
    console.log('');
    console.log('Setup complete! You can now start your server with: npm start');
  }
}

setupAdmin();