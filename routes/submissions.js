const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Submission = require('../models/Submission');
const Class = require('../models/Class');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create submissions directory if it doesn't exist
const submissionsDir = path.join(__dirname, '..', 'submissions');
if (!fs.existsSync(submissionsDir)) {
  fs.mkdirSync(submissionsDir, { recursive: true });
  console.log('📁 Created submissions directory at:', submissionsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, submissionsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept common document and presentation files
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.ms-powerpoint',
      'application/vnd.ms-excel',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Please upload PDF, Word, PowerPoint, Excel, or image files.'), false);
    }
  }
});

// Submit a file on behalf of a student (instructors/admins only)
router.post('/submit-for-student', auth(['instructor', 'admin']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { studentId, missionTitle } = req.body;
    
    if (!studentId) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // Get student information
    const student = await User.findById(studentId);
    if (!student) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Student not found' });
    }

    if (!student.classId) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Student is not enrolled in any class' });
    }

    // Verify instructor has access to this student's class
    if (req.user.role === 'instructor') {
      const classObj = await Class.findById(student.classId);
      if (!classObj || (!classObj.instructors.includes(req.user.id) && classObj.instructorId.toString() !== req.user.id)) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ error: 'Access denied to this student\'s class' });
      }
    }

    // Create submission record
    const submission = new Submission({
      studentId: studentId,
      classId: student.classId,
      studentName: student.name,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      missionTitle: missionTitle || 'Instructor Submitted File'
    });

    await submission.save();

    console.log(`📄 New submission for ${student.name} by instructor: ${req.file.originalname}`);

    res.status(201).json({
      success: true,
      message: 'File submitted successfully for student',
      submission: {
        id: submission._id,
        studentName: submission.studentName,
        fileName: submission.originalFileName,
        submittedAt: submission.submittedAt,
        status: submission.status
      }
    });

  } catch (error) {
    console.error('❌ Error submitting file for student:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Server error submitting file' });
  }
});

// Submit a file (students only)
router.post('/submit', auth(['student']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { missionTitle } = req.body;
    
    // Get student's class
    const student = await User.findById(req.user.id);
    if (!student.classId) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Student is not enrolled in any class' });
    }

    // Create submission record
    const submission = new Submission({
      studentId: req.user.id,
      classId: student.classId,
      studentName: student.name,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      missionTitle: missionTitle || 'General Submission'
    });

    await submission.save();

    console.log(`📄 New submission from ${student.name}: ${req.file.originalname}`);

    res.status(201).json({
      success: true,
      message: 'File submitted successfully',
      submission: {
        id: submission._id,
        fileName: submission.originalFileName,
        submittedAt: submission.submittedAt,
        status: submission.status
      }
    });

  } catch (error) {
    console.error('❌ Error submitting file:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ error: 'Server error submitting file' });
  }
});

// Get submissions for a class (instructors only)
router.get('/class/:classId', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Verify instructor has access to this class
    if (req.user.role === 'instructor') {
      const classObj = await Class.findById(classId);
      if (!classObj || (!classObj.instructors.includes(req.user.id) && classObj.instructorId.toString() !== req.user.id)) {
        return res.status(403).json({ error: 'Access denied to this class' });
      }
    }

    const submissions = await Submission.find({ classId })
      .populate('studentId', 'name email')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      submissions: submissions.map(sub => ({
        id: sub._id,
        studentId: sub.studentId._id,
        studentName: sub.studentName,
        fileName: sub.originalFileName,
        fileType: sub.fileType,
        fileSize: sub.fileSize,
        missionTitle: sub.missionTitle,
        submittedAt: sub.submittedAt,
        status: sub.status,
        grade: sub.grade,
        gradedAt: sub.gradedAt
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching class submissions:', error);
    res.status(500).json({ error: 'Server error fetching submissions' });
  }
});

// Get all submissions for instructor's classes
router.get('/my-classes', auth(['instructor', 'admin']), async (req, res) => {
  try {
    let classIds = [];
    
    if (req.user.role === 'instructor') {
      // Get classes where user is instructor
      const classes = await Class.find({
        $or: [
          { instructorId: req.user.id },
          { instructors: req.user.id }
        ]
      }).select('_id name');
      
      classIds = classes.map(c => c._id);
    } else if (req.user.role === 'admin') {
      // Admin can see all classes
      const classes = await Class.find().select('_id name');
      classIds = classes.map(c => c._id);
    }

    const submissions = await Submission.find({ classId: { $in: classIds } })
      .populate('studentId', 'name email')
      .populate('classId', 'name')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      submissions: submissions.map(sub => ({
        id: sub._id,
        studentId: sub.studentId._id,
        studentName: sub.studentName,
        className: sub.classId.name,
        fileName: sub.originalFileName,
        fileType: sub.fileType,
        fileSize: sub.fileSize,
        missionTitle: sub.missionTitle,
        submittedAt: sub.submittedAt,
        status: sub.status,
        grade: sub.grade,
        gradedAt: sub.gradedAt
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching instructor submissions:', error);
    res.status(500).json({ error: 'Server error fetching submissions' });
  }
});

// Get student's own submissions
router.get('/my-submissions', auth(['student']), async (req, res) => {
  try {
    const submissions = await Submission.find({ studentId: req.user.id })
      .populate('classId', 'name')
      .populate('gradedBy', 'name')
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      submissions: submissions.map(sub => ({
        id: sub._id,
        missionTitle: sub.missionTitle,
        fileName: sub.originalFileName,
        fileType: sub.fileType,
        fileSize: sub.fileSize,
        submittedAt: sub.submittedAt,
        status: sub.status,
        grade: sub.grade,
        rubricScores: sub.rubricScores,
        instructorNotes: sub.instructorNotes,
        gradedAt: sub.gradedAt,
        gradedBy: sub.gradedBy ? sub.gradedBy.name : null,
        className: sub.classId ? sub.classId.name : 'Unknown Class'
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching student submissions:', error);
    res.status(500).json({ error: 'Server error fetching submissions' });
  }
});

// Get grades from JSON file (fallback/alternative endpoint)
router.get('/grades-json/:studentId?', auth(['student', 'instructor', 'admin']), async (req, res) => {
  try {
    const gradesFilePath = path.join(__dirname, '..', 'data', 'grades.json');
    
    if (!fs.existsSync(gradesFilePath)) {
      return res.json({ success: true, grades: [] });
    }
    
    const fileContent = fs.readFileSync(gradesFilePath, 'utf8');
    let gradesData = JSON.parse(fileContent);
    
    // Filter by student if requested
    const targetStudentId = req.params.studentId || req.user.id;
    
    // Students can only see their own grades
    if (req.user.role === 'student' && targetStudentId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Filter grades for the specific student
    const studentGrades = gradesData.filter(grade => grade.studentId === targetStudentId);
    
    res.json({
      success: true,
      grades: studentGrades
    });

  } catch (error) {
    console.error('❌ Error reading grades JSON file:', error);
    res.status(500).json({ error: 'Server error reading grades' });
  }
});

// Get single submission details
router.get('/:id', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('studentId', 'name email')
      .populate('classId', 'name')
      .populate('gradedBy', 'name');

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check access permissions
    if (req.user.role === 'student' && submission.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'instructor') {
      const classObj = await Class.findById(submission.classId._id);
      if (!classObj || (!classObj.instructors.includes(req.user.id) && classObj.instructorId.toString() !== req.user.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({
      success: true,
      submission: {
        id: submission._id,
        studentId: submission.studentId._id,
        studentName: submission.studentName,
        studentEmail: submission.studentId.email,
        className: submission.classId.name,
        fileName: submission.originalFileName,
        fileType: submission.fileType,
        fileSize: submission.fileSize,
        missionTitle: submission.missionTitle,
        submittedAt: submission.submittedAt,
        status: submission.status,
        grade: submission.grade,
        rubricScores: submission.rubricScores,
        instructorNotes: submission.instructorNotes,
        gradedAt: submission.gradedAt,
        gradedBy: submission.gradedBy ? submission.gradedBy.name : null
      }
    });

  } catch (error) {
    console.error('❌ Error fetching submission:', error);
    res.status(500).json({ error: 'Server error fetching submission' });
  }
});

// Download submission file
router.get('/:id/download', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('studentId', 'name')
      .populate('classId', 'name');

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check access permissions
    if (req.user.role === 'student' && submission.studentId._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (req.user.role === 'instructor') {
      const classObj = await Class.findById(submission.classId._id);
      if (!classObj || (!classObj.instructors.includes(req.user.id) && classObj.instructorId.toString() !== req.user.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Check if file exists
    if (!fs.existsSync(submission.filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${submission.originalFileName}"`);
    res.setHeader('Content-Type', submission.fileType);

    // Stream the file
    const fileStream = fs.createReadStream(submission.filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('❌ Error downloading submission:', error);
    res.status(500).json({ error: 'Server error downloading file' });
  }
});

// Grade a submission (instructors only)
router.put('/:id/grade', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { grade, rubricScores, instructorNotes } = req.body;
    
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check access permissions
    if (req.user.role === 'instructor') {
      const classObj = await Class.findById(submission.classId);
      if (!classObj || (!classObj.instructors.includes(req.user.id) && classObj.instructorId.toString() !== req.user.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    // Update submission with grade
    submission.grade = grade;
    submission.rubricScores = rubricScores || [];
    submission.instructorNotes = instructorNotes || '';
    submission.status = 'graded';
    submission.gradedAt = new Date();
    submission.gradedBy = req.user.id;

    await submission.save();

    // Also save to JSON file for backup/compatibility
    try {
      const gradesFilePath = path.join(__dirname, '..', 'data', 'grades.json');
      let gradesData = [];
      
      // Read existing grades if file exists
      if (fs.existsSync(gradesFilePath)) {
        const fileContent = fs.readFileSync(gradesFilePath, 'utf8');
        gradesData = JSON.parse(fileContent);
      }
      
      // Add or update grade record
      const gradeRecord = {
        submissionId: submission._id.toString(),
        studentId: submission.studentId.toString(),
        studentName: submission.studentName,
        missionTitle: submission.missionTitle,
        grade: grade,
        rubricScores: rubricScores || [],
        instructorNotes: instructorNotes || '',
        gradedAt: submission.gradedAt,
        gradedBy: req.user.id
      };
      
      // Remove existing record for this submission if it exists
      gradesData = gradesData.filter(g => g.submissionId !== submission._id.toString());
      
      // Add new record
      gradesData.push(gradeRecord);
      
      // Write back to file
      fs.writeFileSync(gradesFilePath, JSON.stringify(gradesData, null, 2));
      
    } catch (jsonError) {
      console.error('❌ Error saving to grades JSON file:', jsonError);
      // Don't fail the main operation if JSON backup fails
    }

    console.log(`✅ Graded submission ${submission._id}: ${grade}%`);

    res.json({
      success: true,
      message: 'Submission graded successfully',
      submission: {
        id: submission._id,
        grade: submission.grade,
        status: submission.status,
        gradedAt: submission.gradedAt
      }
    });

  } catch (error) {
    console.error('❌ Error grading submission:', error);
    res.status(500).json({ error: 'Server error grading submission' });
  }
});

// Update submission status
router.put('/:id/status', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'reviewing', 'graded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Check access permissions
    if (req.user.role === 'instructor') {
      const classObj = await Class.findById(submission.classId);
      if (!classObj || (!classObj.instructors.includes(req.user.id) && classObj.instructorId.toString() !== req.user.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    submission.status = status;
    await submission.save();

    res.json({
      success: true,
      message: 'Status updated successfully',
      submission: {
        id: submission._id,
        status: submission.status
      }
    });

  } catch (error) {
    console.error('❌ Error updating submission status:', error);
    res.status(500).json({ error: 'Server error updating status' });
  }
});

module.exports = router;