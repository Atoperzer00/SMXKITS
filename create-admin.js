const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smxkits');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      process.exit(0);
    }

    // Create admin user
    const adminPassword = 'admin123'; // Change this to a secure password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = new User({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      name: 'System Administrator',
      classId: 'ADMIN'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('⚠️  Please change the password after first login!');

    // Create a test instructor
    const instructorPassword = 'instructor123';
    const hashedInstructorPassword = await bcrypt.hash(instructorPassword, 10);

    const instructorUser = new User({
      username: 'instructor',
      password: hashedInstructorPassword,
      role: 'instructor',
      name: 'Test Instructor',
      classId: 'SMX001'
    });

    await instructorUser.save();
    console.log('✅ Instructor user created successfully!');
    console.log('Username: instructor');
    console.log('Password: instructor123');

    // Create a test student
    const studentPassword = 'student123';
    const hashedStudentPassword = await bcrypt.hash(studentPassword, 10);

    const studentUser = new User({
      username: 'student',
      password: hashedStudentPassword,
      role: 'student',
      name: 'Test Student',
      classId: 'SMX001'
    });

    await studentUser.save();
    console.log('✅ Student user created successfully!');
    console.log('Username: student');
    console.log('Password: student123');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

createAdmin();