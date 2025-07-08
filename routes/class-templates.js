const express = require('express');
const router = express.Router();
const ClassTemplate = require('../models/ClassTemplate');
const auth = require('../middleware/auth');

// Get all class templates
router.get('/', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const templates = await ClassTemplate.find().sort({ difficulty: 1 });
    res.json(templates);
  } catch (error) {
    console.error('❌ Error fetching class templates:', error);
    res.status(500).json({ error: 'Server error fetching class templates' });
  }
});

// Get a specific template by difficulty
router.get('/:difficulty', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const { difficulty } = req.params;
    
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    const template = await ClassTemplate.findOne({ difficulty });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('❌ Error fetching class template:', error);
    res.status(500).json({ error: 'Server error fetching class template' });
  }
});

// Create a new class template
router.post('/', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const { difficulty, name, description, durationWeeks, modules } = req.body;
    
    if (!difficulty || !name || !durationWeeks) {
      return res.status(400).json({ error: 'Difficulty, name, and duration are required' });
    }
    
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    // Check if template with this difficulty already exists
    const existingTemplate = await ClassTemplate.findOne({ difficulty });
    if (existingTemplate) {
      return res.status(400).json({ error: `Template for ${difficulty} difficulty already exists` });
    }
    
    const newTemplate = new ClassTemplate({
      difficulty,
      name,
      description,
      durationWeeks,
      modules: modules || []
    });
    
    await newTemplate.save();
    res.status(201).json(newTemplate);
  } catch (error) {
    console.error('❌ Error creating class template:', error);
    res.status(500).json({ error: 'Server error creating class template' });
  }
});

// Update a class template
router.put('/:difficulty', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const { difficulty } = req.params;
    const { name, description, durationWeeks, modules } = req.body;
    
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    const template = await ClassTemplate.findOne({ difficulty });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Update fields
    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (durationWeeks) template.durationWeeks = durationWeeks;
    if (modules) template.modules = modules;
    
    await template.save();
    res.json(template);
  } catch (error) {
    console.error('❌ Error updating class template:', error);
    res.status(500).json({ error: 'Server error updating class template' });
  }
});

// Delete a class template
router.delete('/:difficulty', auth(['admin']), async (req, res) => {
  try {
    const { difficulty } = req.params;
    
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    const template = await ClassTemplate.findOneAndDelete({ difficulty });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting class template:', error);
    res.status(500).json({ error: 'Server error deleting class template' });
  }
});

// Get daily content for a specific template and day
router.get('/:difficulty/day/:dayNumber', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const { difficulty, dayNumber } = req.params;
    
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    const template = await ClassTemplate.findOne({ difficulty });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Find daily content across all modules
    let dailyContent = null;
    for (const module of template.modules) {
      const dayContent = module.dailySchedule.find(d => d.day === parseInt(dayNumber));
      if (dayContent) {
        dailyContent = dayContent;
        break;
      }
    }
    
    if (!dailyContent) {
      // Return empty structure if no content found
      dailyContent = {
        day: parseInt(dayNumber),
        missionReferences: [],
        courseContent: [],
        typingTests: [],
        notes: ''
      };
    }
    
    res.json(dailyContent);
  } catch (error) {
    console.error('❌ Error fetching daily content:', error);
    res.status(500).json({ error: 'Server error fetching daily content' });
  }
});

// Update daily content for a specific template and day
router.put('/:difficulty/day/:dayNumber', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const { difficulty, dayNumber } = req.params;
    const { missionReferences, courseContent, typingTests, notes } = req.body;
    
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    const template = await ClassTemplate.findOne({ difficulty });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const dayNum = parseInt(dayNumber);
    
    // Find which module this day belongs to (for now, add to first module)
    let targetModule = template.modules[0];
    if (!targetModule) {
      return res.status(400).json({ error: 'Template has no modules' });
    }
    
    // Find existing daily content or create new
    let dailyContentIndex = targetModule.dailySchedule.findIndex(d => d.day === dayNum);
    
    const dailyContent = {
      day: dayNum,
      missionReferences: missionReferences || [],
      courseContent: courseContent || [],
      typingTests: typingTests || [],
      notes: notes || ''
    };
    
    if (dailyContentIndex >= 0) {
      // Update existing
      targetModule.dailySchedule[dailyContentIndex] = dailyContent;
    } else {
      // Add new
      targetModule.dailySchedule.push(dailyContent);
      targetModule.dailySchedule.sort((a, b) => a.day - b.day);
    }
    
    await template.save();
    res.json(dailyContent);
  } catch (error) {
    console.error('❌ Error updating daily content:', error);
    res.status(500).json({ error: 'Server error updating daily content' });
  }
});

// Get available content for selection
router.get('/content/available', auth(['admin', 'instructor']), async (req, res) => {
  try {
    // In a real application, this would fetch from actual content databases
    const availableContent = {
      mission: [
        { id: 'mission1', name: 'Basic Navigation Mission', description: 'Learn basic system navigation', duration: 1800 },
        { id: 'mission2', name: 'Communication Protocols', description: 'Standard communication procedures', duration: 2400 },
        { id: 'mission3', name: 'Emergency Procedures', description: 'Emergency response protocols', duration: 3600 },
        { id: 'mission4', name: 'System Diagnostics', description: 'Diagnostic procedures and troubleshooting', duration: 2700 },
        { id: 'mission5', name: 'Advanced Operations', description: 'Complex operational scenarios', duration: 4800 },
        { id: 'mission6', name: 'Team Coordination', description: 'Multi-person operation procedures', duration: 3000 },
        { id: 'mission7', name: 'Equipment Maintenance', description: 'Routine maintenance procedures', duration: 2100 },
        { id: 'mission8', name: 'Data Analysis', description: 'Information processing and analysis', duration: 3300 }
      ],
      course: [
        { id: 'course1', name: 'Introduction to SMX', description: 'Basic SMX concepts and overview', duration: 2700 },
        { id: 'course2', name: 'System Architecture', description: 'Understanding system components', duration: 3600 },
        { id: 'course3', name: 'User Interface Guide', description: 'Navigating the user interface', duration: 1800 },
        { id: 'course4', name: 'Configuration Management', description: 'System configuration procedures', duration: 4200 },
        { id: 'course5', name: 'Best Practices', description: 'Industry best practices and standards', duration: 2400 },
        { id: 'course6', name: 'Security Protocols', description: 'System security and access control', duration: 3000 },
        { id: 'course7', name: 'Performance Optimization', description: 'System performance tuning', duration: 3900 },
        { id: 'course8', name: 'Troubleshooting Guide', description: 'Common issues and solutions', duration: 3300 }
      ],
      typing: [
        { id: 'typing1', name: 'Basic Typing Test', description: '30 WPM accuracy test', targetWPM: 30, duration: 300 },
        { id: 'typing2', name: 'Speed Challenge', description: '50 WPM speed test', targetWPM: 50, duration: 300 },
        { id: 'typing3', name: 'Technical Terms', description: 'Technical vocabulary typing test', targetWPM: 35, duration: 600 },
        { id: 'typing4', name: 'Code Typing', description: 'Programming syntax typing test', targetWPM: 40, duration: 450 },
        { id: 'typing5', name: 'Advanced Speed Test', description: '70+ WPM advanced test', targetWPM: 70, duration: 300 },
        { id: 'typing6', name: 'Accuracy Challenge', description: '99% accuracy test', targetWPM: 25, duration: 600 },
        { id: 'typing7', name: 'Endurance Test', description: '15-minute sustained typing', targetWPM: 45, duration: 900 },
        { id: 'typing8', name: 'Professional Test', description: 'Business document typing', targetWPM: 55, duration: 420 }
      ],
      keyboard: [ // Alias for typing for backward compatibility
        { id: 'typing1', name: 'Basic Typing Test', description: '30 WPM accuracy test', targetWPM: 30, duration: 300 },
        { id: 'typing2', name: 'Speed Challenge', description: '50 WPM speed test', targetWPM: 50, duration: 300 },
        { id: 'typing3', name: 'Technical Terms', description: 'Technical vocabulary typing test', targetWPM: 35, duration: 600 },
        { id: 'typing4', name: 'Code Typing', description: 'Programming syntax typing test', targetWPM: 40, duration: 450 },
        { id: 'typing5', name: 'Advanced Speed Test', description: '70+ WPM advanced test', targetWPM: 70, duration: 300 },
        { id: 'typing6', name: 'Accuracy Challenge', description: '99% accuracy test', targetWPM: 25, duration: 600 },
        { id: 'typing7', name: 'Endurance Test', description: '15-minute sustained typing', targetWPM: 45, duration: 900 },
        { id: 'typing8', name: 'Professional Test', description: 'Business document typing', targetWPM: 55, duration: 420 }
      ],
      ia: [
        { id: 'ia1', name: 'IA Fundamentals', description: 'Basic IA concepts and procedures', duration: 3600, level: 'basic' },
        { id: 'ia2', name: 'IA Assessment Techniques', description: 'Assessment methodologies and tools', duration: 2700, level: 'intermediate' },
        { id: 'ia3', name: 'IA Documentation Standards', description: 'Proper documentation procedures', duration: 1800, level: 'basic' },
        { id: 'ia4', name: 'IA Quality Control', description: 'Quality assurance processes', duration: 2400, level: 'intermediate' },
        { id: 'ia5', name: 'Advanced IA Analysis', description: 'Complex analysis techniques', duration: 4200, level: 'advanced' },
        { id: 'ia6', name: 'IA Report Writing', description: 'Professional report preparation', duration: 3000, level: 'intermediate' },
        { id: 'ia7', name: 'IA Case Studies', description: 'Real-world scenario analysis', duration: 3600, level: 'advanced' },
        { id: 'ia8', name: 'IA Certification Prep', description: 'Certification examination preparation', duration: 5400, level: 'advanced' }
      ],
      screener: [
        { id: 'screener1', name: 'Screener Basics', description: 'Introduction to screening procedures', duration: 2400, level: 'basic' },
        { id: 'screener2', name: 'Advanced Screening Techniques', description: 'Complex screening scenarios', duration: 3600, level: 'advanced' },
        { id: 'screener3', name: 'Screener Protocols', description: 'Standard operating procedures', duration: 1800, level: 'basic' },
        { id: 'screener4', name: 'Screener Equipment Training', description: 'Equipment operation and maintenance', duration: 2700, level: 'intermediate' },
        { id: 'screener5', name: 'Threat Detection', description: 'Identifying potential threats', duration: 4200, level: 'advanced' },
        { id: 'screener6', name: 'Screener Communication', description: 'Effective communication protocols', duration: 2100, level: 'intermediate' },
        { id: 'screener7', name: 'Emergency Response', description: 'Emergency situation handling', duration: 3300, level: 'advanced' },
        { id: 'screener8', name: 'Screener Certification', description: 'Certification requirements and testing', duration: 4800, level: 'advanced' }
      ]
    };
    
    res.json(availableContent);
  } catch (error) {
    console.error('❌ Error fetching available content:', error);
    res.status(500).json({ error: 'Server error fetching available content' });
  }
});

// Get template schedule (time blocks for all days)
router.get('/:difficulty/schedule', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const { difficulty } = req.params;
    
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    const template = await ClassTemplate.findOne({ difficulty });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Extract schedule from all modules
    const schedule = {};
    template.modules.forEach(module => {
      if (module.dailySchedule) {
        module.dailySchedule.forEach(dayData => {
          schedule[dayData.day] = {
            timeBlocks: dayData.timeBlocks || [],
            isActive: dayData.isActive !== false,
            notes: dayData.notes || ''
          };
        });
      }
    });
    
    res.json(schedule);
  } catch (error) {
    console.error('❌ Error fetching template schedule:', error);
    res.status(500).json({ error: 'Server error fetching template schedule' });
  }
});

// Update template schedule (time blocks for all days)
router.put('/:difficulty/schedule', auth(['admin', 'instructor']), async (req, res) => {
  try {
    const { difficulty } = req.params;
    const { schedule } = req.body;
    
    if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      return res.status(400).json({ error: 'Invalid difficulty level' });
    }
    
    const template = await ClassTemplate.findOne({ difficulty });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Update the first module's daily schedule (or create if doesn't exist)
    if (!template.modules || template.modules.length === 0) {
      template.modules = [{
        name: 'Main Module',
        description: 'Generated module',
        order: 1,
        lessons: [],
        estimatedWeeks: template.durationWeeks || 1,
        dailySchedule: []
      }];
    }
    
    const mainModule = template.modules[0];
    mainModule.dailySchedule = [];
    
    // Convert schedule object to daily schedule array
    Object.keys(schedule).forEach(day => {
      const dayNumber = parseInt(day);
      const dayData = schedule[day];
      
      mainModule.dailySchedule.push({
        day: dayNumber,
        timeBlocks: dayData.timeBlocks || [],
        isActive: dayData.isActive !== false,
        notes: dayData.notes || '',
        // Keep legacy arrays empty for now
        missionReferences: [],
        courseContent: [],
        typingTests: [],
        iaTraining: [],
        screenerTraining: []
      });
    });
    
    // Sort by day number
    mainModule.dailySchedule.sort((a, b) => a.day - b.day);
    
    await template.save();
    res.json({ message: 'Template schedule updated successfully', schedule });
  } catch (error) {
    console.error('❌ Error updating template schedule:', error);
    res.status(500).json({ error: 'Server error updating template schedule' });
  }
});

module.exports = router;