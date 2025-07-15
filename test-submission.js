const mongoose = require('mongoose');
const User = require('./models/User');
const Class = require('./models/Class');
const Submission = require('./models/Submission');
const fs = require('fs');
const path = require('path');

async function createTestSubmission() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/smxkits', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Find the student and Alpha Squadron class
    const student = await User.findOne({ username: 'student' });
    const alphaSquadron = await Class.findOne({ name: 'Alpha Squadron' });

    if (!student || !alphaSquadron) {
      console.error('❌ Student or Alpha Squadron not found');
      return;
    }

    console.log('📋 Found student:', student.name);
    console.log('📋 Found class:', alphaSquadron.name);

    // Create a test file in the uploads directory
    const uploadsDir = path.join(__dirname, 'uploads');
    const testFileName = `test-submission-${Date.now()}.txt`;
    const testFilePath = path.join(uploadsDir, testFileName);
    
    // Create test file content
    const testContent = `Test Submission File
Created: ${new Date().toISOString()}
Student: ${student.name}
Class: ${alphaSquadron.name}

This is a test submission to verify the instructor grading system is working properly.
`;

    fs.writeFileSync(testFilePath, testContent);
    console.log('📄 Created test file:', testFilePath);

    // Create submission record
    const submission = new Submission({
      studentId: student._id,
      classId: alphaSquadron._id,
      studentName: student.name,
      studentEmail: student.email || 'student@example.com',
      className: alphaSquadron.name,
      fileName: testFileName,
      originalFileName: 'Test Mission Report.txt',
      filePath: testFilePath,
      fileSize: Buffer.byteLength(testContent, 'utf8'),
      fileType: 'text/plain',
      missionTitle: 'Test Mission Submission'
    });

    await submission.save();
    console.log('✅ Created test submission:', submission._id);

    // Create another submission with different status
    const testFileName2 = `test-submission-graded-${Date.now()}.txt`;
    const testFilePath2 = path.join(uploadsDir, testFileName2);
    fs.writeFileSync(testFilePath2, testContent + '\n\nThis submission has been graded.');

    const submission2 = new Submission({
      studentId: student._id,
      classId: alphaSquadron._id,
      studentName: student.name,
      studentEmail: student.email || 'student@example.com',
      className: alphaSquadron.name,
      fileName: testFileName2,
      originalFileName: 'Graded Mission Report.txt',
      filePath: testFilePath2,
      fileSize: Buffer.byteLength(testContent + '\n\nThis submission has been graded.', 'utf8'),
      fileType: 'text/plain',
      missionTitle: 'Graded Test Mission',
      status: 'graded',
      grade: 85,
      rubricScores: [
        { category: 'Technical Accuracy', score: 8, maxScore: 10 },
        { category: 'Presentation Quality', score: 9, maxScore: 10 },
        { category: 'Content Depth', score: 8, maxScore: 10 },
        { category: 'Creativity', score: 9, maxScore: 10 },
        { category: 'Timeliness', score: 8, maxScore: 10 }
      ],
      instructorNotes: 'Good work! Well structured report with clear analysis.'
    });

    await submission2.save();
    console.log('✅ Created graded test submission:', submission2._id);

    console.log('\n🎉 Test submissions created successfully!');
    console.log('📋 You can now test the instructor grading page at: http://localhost:5000/instructor-grading.html');
    console.log('🔑 Login as instructor with: username=instructor, password=instructor123');

  } catch (error) {
    console.error('❌ Error creating test submission:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

createTestSubmission();