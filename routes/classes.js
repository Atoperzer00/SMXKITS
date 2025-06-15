const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Create class (admin/instructor)
router.post('/', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const { name, organization, country, instructorId, startDate, endDate } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }
    
    const newClass = new Class({ 
      name, 
      organization, 
      country, 
      instructorId, 
      startDate, 
      endDate, 
      students: [], 
      instructors: [] 
    });
    
    await newClass.save();
    
    // If an instructor is assigned, add them to the instructors array
    if (instructorId) {
      await Class.findByIdAndUpdate(newClass._id, {
        $addToSet: { instructors: instructorId }
      });
      
      // Also update the instructor's record
      await User.findByIdAndUpdate(instructorId, {
        $set: { classId: newClass._id }
      });
    }
    
    res.status(201).json(newClass);
  } catch (error) {
    console.error('❌ Error creating class:', error);
    res.status(500).json({ error: 'Server error creating class' });
  }
});

// Get all classes (admin/instructor)
router.get('/', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('students', '-password')
      .populate('instructors', '-password')
      .populate('instructorId', '-password');
    res.json(classes);
  } catch (error) {
    console.error('❌ Error fetching classes:', error);
    res.status(500).json({ error: 'Server error fetching classes' });
  }
});

// Get user's assigned classes (students get their enrolled classes, instructors get their teaching classes)
router.get('/my-classes', auth(), async (req, res) => {
  try {
    console.log(`📚 Fetching classes for user: ${req.user.id} (${req.user.role})`);
    
    let classes = [];
    
    if (req.user.role === 'student') {
      // For students: find classes they are enrolled in
      classes = await Class.find({
        students: req.user.id
      })
      .populate('instructorId', 'name email')
      .select('name description streamStatus streamKey currentStreamSource createdAt updatedAt')
      .sort({ updatedAt: -1 });
      
      console.log(`📖 Found ${classes.length} classes for student`);
      
    } else if (req.user.role === 'instructor') {
      // For instructors: find classes they are teaching
      classes = await Class.find({
        $or: [
          { instructorId: req.user.id },
          { instructors: req.user.id }
        ]
      })
      .populate('instructorId', 'name email')
      .select('name description streamStatus streamKey currentStreamSource createdAt updatedAt students instructors')
      .sort({ updatedAt: -1 });
      
      console.log(`👨‍🏫 Found ${classes.length} classes for instructor`);
      
    } else if (req.user.role === 'admin') {
      // For admins: get all classes
      classes = await Class.find()
        .populate('instructorId', 'name email')
        .select('name description streamStatus streamKey currentStreamSource createdAt updatedAt')
        .sort({ updatedAt: -1 });
        
      console.log(`👑 Found ${classes.length} classes for admin`);
    }
    
    // Add some metadata for better class selection
    const enrichedClasses = classes.map(cls => ({
      ...cls.toObject(),
      hasActiveStream: cls.streamStatus === 'live',
      isStreamReady: !!cls.streamKey,
      studentCount: cls.students ? cls.students.length : 0
    }));
    
    res.json(enrichedClasses);
    
  } catch (error) {
    console.error('❌ Error fetching user classes:', error);
    res.status(500).json({ error: 'Server error fetching user classes' });
  }
});

// Get single class by ID
router.get('/:id', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id)
      .populate('students', '-password')
      .populate('instructors', '-password')
      .populate('instructorId', '-password');
      
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    res.json(classObj);
  } catch (error) {
    console.error('❌ Error fetching class:', error);
    res.status(500).json({ error: 'Server error fetching class' });
  }
});

// Update class
router.put('/:id', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const { name, organization, country, instructorId, startDate, endDate } = req.body;
    
    // Find class first
    const classObj = await Class.findById(req.params.id);
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Update basic fields
    classObj.name = name || classObj.name;
    classObj.organization = organization || classObj.organization;
    classObj.country = country || classObj.country;
    classObj.startDate = startDate || classObj.startDate;
    classObj.endDate = endDate || classObj.endDate;
    
    // Handle instructor change if needed
    if (instructorId && instructorId !== classObj.instructorId?.toString()) {
      // Remove old instructor if there was one
      if (classObj.instructorId) {
        await User.findByIdAndUpdate(classObj.instructorId, {
          $unset: { classId: "" }
        });
      }
      
      // Add new instructor to class and update instructor's record
      classObj.instructorId = instructorId;
      await User.findByIdAndUpdate(instructorId, {
        $set: { classId: classObj._id }
      });
    }
    
    await classObj.save();
    res.json(classObj);
  } catch (error) {
    console.error('❌ Error updating class:', error);
    res.status(500).json({ error: 'Server error updating class' });
  }
});

// Delete class
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id);
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Update all students in this class to remove their class association
    await User.updateMany(
      { classId: classObj._id },
      { $unset: { classId: "" } }
    );
    
    // Delete the class
    await Class.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting class:', error);
    res.status(500).json({ error: 'Server error deleting class' });
  }
});

// Add student to class
router.post('/:id/students/:studentId', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id);
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    const student = await User.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Add student to class
    await Class.findByIdAndUpdate(req.params.id, {
      $addToSet: { students: req.params.studentId }
    });
    
    // Update student's record with class ID
    await User.findByIdAndUpdate(req.params.studentId, {
      $set: { classId: req.params.id }
    });
    
    res.json({ message: 'Student added to class successfully' });
  } catch (error) {
    console.error('❌ Error adding student to class:', error);
    res.status(500).json({ error: 'Server error adding student to class' });
  }
});

// Remove student from class
router.delete('/:id/students/:studentId', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const classObj = await Class.findById(req.params.id);
    if (!classObj) {
      return res.status(404).json({ error: 'Class not found' });
    }
    
    // Remove student from class
    await Class.findByIdAndUpdate(req.params.id, {
      $pull: { students: req.params.studentId }
    });
    
    // Update student's record to remove class association
    await User.findByIdAndUpdate(req.params.studentId, {
      $unset: { classId: "" }
    });
    
    res.json({ message: 'Student removed from class successfully' });
  } catch (error) {
    console.error('❌ Error removing student from class:', error);
    res.status(500).json({ error: 'Server error removing student from class' });
  }
});

module.exports = router;