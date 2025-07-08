const express = require('express');
const router = express.Router();
const Whiteboard = require('../models/Whiteboard');
const InteractiveExercise = require('../models/InteractiveExercise');
const Class = require('../models/Class');
const User = require('../models/User');
const auth = require('../middleware/auth');

// ===== WHITEBOARD ROUTES =====

// Get all whiteboards for a class
router.get('/whiteboards/class/:classId', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify access to class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const hasAccess = req.user.role === 'admin' || 
                     classDoc.instructors.includes(req.user.id) ||
                     classDoc.students.includes(req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const whiteboards = await Whiteboard.getActiveForClass(classId);
    res.json(whiteboards);
  } catch (error) {
    console.error('Failed to fetch whiteboards:', error);
    res.status(500).json({ error: 'Failed to fetch whiteboards' });
  }
});

// Create a new whiteboard
router.post('/whiteboards', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { title, description, classId, settings, permissions } = req.body;

    // Verify access to class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const hasAccess = req.user.role === 'admin' || classDoc.instructors.includes(req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const whiteboard = new Whiteboard({
      title,
      description,
      classId,
      createdBy: req.user.id,
      settings: settings || {},
      permissions: permissions || {}
    });

    await whiteboard.save();
    await whiteboard.populate('createdBy', 'name');

    // Notify students via Socket.IO
    if (req.io) {
      req.io.to(`class-${classId}`).emit('whiteboard-created', {
        whiteboard: whiteboard.toObject(),
        createdBy: whiteboard.createdBy.name
      });
    }

    res.status(201).json(whiteboard);
  } catch (error) {
    console.error('Failed to create whiteboard:', error);
    res.status(500).json({ error: 'Failed to create whiteboard' });
  }
});

// Get whiteboard by ID
router.get('/whiteboards/:whiteboardId', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const { whiteboardId } = req.params;

    const whiteboard = await Whiteboard.findById(whiteboardId)
      .populate('createdBy', 'name')
      .populate('activeUsers.userId', 'name');

    if (!whiteboard) {
      return res.status(404).json({ error: 'Whiteboard not found' });
    }

    // Verify access
    const classDoc = await Class.findById(whiteboard.classId);
    const hasAccess = req.user.role === 'admin' || 
                     classDoc.instructors.includes(req.user.id) ||
                     (classDoc.students.includes(req.user.id) && whiteboard.permissions.allowStudentView);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(whiteboard);
  } catch (error) {
    console.error('Failed to fetch whiteboard:', error);
    res.status(500).json({ error: 'Failed to fetch whiteboard' });
  }
});

// Update whiteboard element
router.post('/whiteboards/:whiteboardId/elements', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const { whiteboardId } = req.params;
    const elementData = req.body;

    const whiteboard = await Whiteboard.findById(whiteboardId);
    if (!whiteboard) {
      return res.status(404).json({ error: 'Whiteboard not found' });
    }

    // Check permissions
    const classDoc = await Class.findById(whiteboard.classId);
    const canEdit = req.user.role === 'admin' || 
                   classDoc.instructors.includes(req.user.id) ||
                   (classDoc.students.includes(req.user.id) && whiteboard.permissions.allowStudentEdit);

    if (!canEdit) {
      return res.status(403).json({ error: 'Edit permission denied' });
    }

    const element = whiteboard.addElement(elementData, req.user.id);
    await whiteboard.save();

    // Broadcast to all connected users
    if (req.io) {
      req.io.to(`whiteboard-${whiteboardId}`).emit('element-added', {
        whiteboardId,
        element,
        userId: req.user.id,
        userName: req.user.name
      });
    }

    res.status(201).json(element);
  } catch (error) {
    console.error('Failed to add element:', error);
    res.status(500).json({ error: 'Failed to add element' });
  }
});

// Update whiteboard element
router.put('/whiteboards/:whiteboardId/elements/:elementId', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const { whiteboardId, elementId } = req.params;
    const updates = req.body;

    const whiteboard = await Whiteboard.findById(whiteboardId);
    if (!whiteboard) {
      return res.status(404).json({ error: 'Whiteboard not found' });
    }

    // Check permissions
    const classDoc = await Class.findById(whiteboard.classId);
    const canEdit = req.user.role === 'admin' || 
                   classDoc.instructors.includes(req.user.id) ||
                   (classDoc.students.includes(req.user.id) && whiteboard.permissions.allowStudentEdit);

    if (!canEdit) {
      return res.status(403).json({ error: 'Edit permission denied' });
    }

    const element = whiteboard.updateElement(elementId, updates);
    if (!element) {
      return res.status(404).json({ error: 'Element not found' });
    }

    await whiteboard.save();

    // Broadcast to all connected users
    if (req.io) {
      req.io.to(`whiteboard-${whiteboardId}`).emit('element-updated', {
        whiteboardId,
        elementId,
        updates,
        userId: req.user.id,
        userName: req.user.name
      });
    }

    res.json(element);
  } catch (error) {
    console.error('Failed to update element:', error);
    res.status(500).json({ error: 'Failed to update element' });
  }
});

// Delete whiteboard element
router.delete('/whiteboards/:whiteboardId/elements/:elementId', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const { whiteboardId, elementId } = req.params;

    const whiteboard = await Whiteboard.findById(whiteboardId);
    if (!whiteboard) {
      return res.status(404).json({ error: 'Whiteboard not found' });
    }

    // Check permissions
    const classDoc = await Class.findById(whiteboard.classId);
    const canEdit = req.user.role === 'admin' || 
                   classDoc.instructors.includes(req.user.id) ||
                   (classDoc.students.includes(req.user.id) && whiteboard.permissions.allowStudentEdit);

    if (!canEdit) {
      return res.status(403).json({ error: 'Edit permission denied' });
    }

    const removed = whiteboard.removeElement(elementId);
    if (!removed) {
      return res.status(404).json({ error: 'Element not found' });
    }

    await whiteboard.save();

    // Broadcast to all connected users
    if (req.io) {
      req.io.to(`whiteboard-${whiteboardId}`).emit('element-removed', {
        whiteboardId,
        elementId,
        userId: req.user.id,
        userName: req.user.name
      });
    }

    res.json({ message: 'Element removed successfully' });
  } catch (error) {
    console.error('Failed to remove element:', error);
    res.status(500).json({ error: 'Failed to remove element' });
  }
});

// ===== INTERACTIVE EXERCISE ROUTES =====

// Get all exercises for a class
router.get('/exercises/class/:classId', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const { classId } = req.params;
    const { status, type } = req.query;

    // Verify access to class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const hasAccess = req.user.role === 'admin' || 
                     classDoc.instructors.includes(req.user.id) ||
                     classDoc.students.includes(req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let query = { classId };
    
    // Students can only see published/active exercises
    if (req.user.role === 'student') {
      query.status = { $in: ['published', 'active'] };
    } else if (status) {
      query.status = status;
    }

    if (type) {
      query.type = type;
    }

    const exercises = await InteractiveExercise.find(query)
      .populate('createdBy', 'name')
      .sort({ 'scheduling.startDate': -1 });

    res.json(exercises);
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// Create a new interactive exercise
router.post('/exercises', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const exerciseData = req.body;
    exerciseData.createdBy = req.user.id;

    // Verify access to class
    const classDoc = await Class.findById(exerciseData.classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const hasAccess = req.user.role === 'admin' || classDoc.instructors.includes(req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate unique IDs for questions
    if (exerciseData.questions) {
      exerciseData.questions.forEach(question => {
        question.id = `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        if (question.options) {
          question.options.forEach(option => {
            option.id = `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          });
        }
      });
    }

    const exercise = new InteractiveExercise(exerciseData);
    await exercise.save();
    await exercise.populate('createdBy', 'name');

    // Notify students if published
    if (req.io && exercise.status === 'published') {
      req.io.to(`class-${exercise.classId}`).emit('new-exercise', {
        exercise: exercise.toObject(),
        createdBy: exercise.createdBy.name
      });
    }

    res.status(201).json(exercise);
  } catch (error) {
    console.error('Failed to create exercise:', error);
    res.status(500).json({ error: 'Failed to create exercise' });
  }
});

// Get exercise by ID
router.get('/exercises/:exerciseId', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const { exerciseId } = req.params;

    const exercise = await InteractiveExercise.findById(exerciseId)
      .populate('createdBy', 'name');

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Verify access
    const classDoc = await Class.findById(exercise.classId);
    const hasAccess = req.user.role === 'admin' || 
                     classDoc.instructors.includes(req.user.id) ||
                     (classDoc.students.includes(req.user.id) && exercise.isAvailable);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // For students, hide correct answers and explanations unless allowed
    if (req.user.role === 'student' && exercise.settings.showCorrectAnswers === false) {
      exercise.questions.forEach(question => {
        delete question.correctAnswer;
        delete question.explanation;
        if (question.options) {
          question.options.forEach(option => {
            delete option.isCorrect;
            delete option.explanation;
          });
        }
      });
    }

    res.json(exercise);
  } catch (error) {
    console.error('Failed to fetch exercise:', error);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

// Start exercise session
router.post('/exercises/:exerciseId/start', auth(['student']), async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const { teamId } = req.body;

    const exercise = await InteractiveExercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Check if exercise is available
    if (!exercise.isAvailable) {
      return res.status(400).json({ error: 'Exercise is not available' });
    }

    // Verify student has access to class
    const classDoc = await Class.findById(exercise.classId);
    if (!classDoc.students.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Start session
    const session = exercise.startSession(req.user.id, teamId);

    // Store session in cache or database (implement session storage)
    // For now, we'll return the session data
    
    res.json(session);
  } catch (error) {
    console.error('Failed to start exercise session:', error);
    res.status(500).json({ error: 'Failed to start exercise session' });
  }
});

// Submit answer for exercise question
router.post('/exercises/:exerciseId/answer', auth(['student']), async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const { questionId, answer, sessionId } = req.body;

    const exercise = await InteractiveExercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Validate answer
    const validation = exercise.validateAnswer(questionId, answer);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Update analytics
    exercise.analytics.totalAttempts += 1;
    await exercise.save();

    // Broadcast to instructor if real-time monitoring is enabled
    if (req.io) {
      req.io.to(`instructor-${exercise.classId}`).emit('student-answer-submitted', {
        exerciseId,
        questionId,
        studentId: req.user.id,
        studentName: req.user.name,
        isCorrect: validation.isCorrect,
        score: validation.score,
        timestamp: new Date()
      });
    }

    res.json({
      isCorrect: validation.isCorrect,
      score: validation.score,
      explanation: exercise.settings.showResults === 'immediately' ? validation.explanation : undefined,
      correctAnswer: exercise.settings.showCorrectAnswers && exercise.settings.showResults === 'immediately' ? 
        validation.correctAnswer : undefined
    });
  } catch (error) {
    console.error('Failed to submit answer:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Get active exercises for class
router.get('/exercises/class/:classId/active', auth(['instructor', 'admin', 'student']), async (req, res) => {
  try {
    const { classId } = req.params;

    // Verify access to class
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const hasAccess = req.user.role === 'admin' || 
                     classDoc.instructors.includes(req.user.id) ||
                     classDoc.students.includes(req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const exercises = await InteractiveExercise.getActiveForClass(classId);
    res.json(exercises);
  } catch (error) {
    console.error('Failed to fetch active exercises:', error);
    res.status(500).json({ error: 'Failed to fetch active exercises' });
  }
});

// Update exercise status
router.patch('/exercises/:exerciseId/status', auth(['instructor', 'admin']), async (req, res) => {
  try {
    const { exerciseId } = req.params;
    const { status } = req.body;

    if (!['draft', 'published', 'active', 'completed', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const exercise = await InteractiveExercise.findById(exerciseId);
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Verify access
    const classDoc = await Class.findById(exercise.classId);
    const hasAccess = req.user.role === 'admin' || 
                     classDoc.instructors.includes(req.user.id) ||
                     exercise.createdBy.toString() === req.user.id;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    exercise.status = status;
    await exercise.save();

    // Notify students via Socket.IO
    if (req.io && status === 'active') {
      req.io.to(`class-${exercise.classId}`).emit('exercise-activated', {
        exerciseId,
        title: exercise.title,
        type: exercise.type,
        timestamp: new Date()
      });
    }

    res.json({ message: 'Exercise status updated successfully', status });
  } catch (error) {
    console.error('Failed to update exercise status:', error);
    res.status(500).json({ error: 'Failed to update exercise status' });
  }
});

module.exports = router;