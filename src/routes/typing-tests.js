const express = require('express');
const router = express.Router();
const TypingTest = require('../models/TypingTest');
const auth = require('../middleware/auth');

// GET /api/typing-tests - Get typing test configuration
router.get('/', async (req, res) => {
  try {
    console.log('📚 Fetching typing test configuration...');
    const config = await TypingTest.getConfig();
    
    console.log('✅ Typing test configuration retrieved successfully');
    res.json({
      success: true,
      data: {
        modules: config.modules,
        moduleNames: config.moduleNames,
        lastUpdated: config.lastUpdated
      }
    });
  } catch (error) {
    console.error('❌ Error fetching typing test configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch typing test configuration',
      error: error.message
    });
  }
});

// PUT /api/typing-tests - Update typing test configuration (Admin only)
router.put('/', auth(['admin']), async (req, res) => {
  try {
    console.log('📝 Updating typing test configuration...');
    console.log('User role:', req.user?.role);
    console.log('User ID:', req.user?.id);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Modules count:', req.body.modules?.length);
    console.log('Module names count:', req.body.moduleNames?.length);
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('❌ Access denied - user is not admin');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.'
      });
    }

    const { modules, moduleNames } = req.body;

    // Validate input
    if (!modules || !moduleNames) {
      console.log('❌ Invalid input - missing modules or moduleNames');
      return res.status(400).json({
        success: false,
        message: 'Both modules and moduleNames are required'
      });
    }

    if (!Array.isArray(modules) || !Array.isArray(moduleNames)) {
      console.log('❌ Invalid input - modules and moduleNames must be arrays');
      return res.status(400).json({
        success: false,
        message: 'Modules and moduleNames must be arrays'
      });
    }

    if (modules.length !== moduleNames.length) {
      console.log('❌ Invalid input - modules and moduleNames length mismatch');
      return res.status(400).json({
        success: false,
        message: 'Number of modules must match number of module names'
      });
    }

    // Validate that each module is an array of strings
    for (let i = 0; i < modules.length; i++) {
      if (!Array.isArray(modules[i])) {
        console.log(`❌ Invalid input - module ${i} is not an array`);
        return res.status(400).json({
          success: false,
          message: `Module ${i + 1} must be an array of practice texts`
        });
      }
    }

    console.log(`📊 Updating ${modules.length} modules with ${moduleNames.length} names`);
    
    const updatedConfig = await TypingTest.updateConfig({
      modules,
      moduleNames
    }, req.user.id);

    console.log('✅ Typing test configuration updated successfully');
    
    res.json({
      success: true,
      message: 'Typing test configuration updated successfully',
      data: {
        modules: updatedConfig.modules,
        moduleNames: updatedConfig.moduleNames,
        lastUpdated: updatedConfig.lastUpdated
      }
    });
  } catch (error) {
    console.error('❌ Error updating typing test configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update typing test configuration',
      error: error.message
    });
  }
});

// POST /api/typing-tests/reset - Reset to default configuration (Admin only)
router.post('/reset', auth(['admin']), async (req, res) => {
  try {
    console.log('🔄 Resetting typing test configuration to defaults...');
    
    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('❌ Access denied - user is not admin');
      return res.status(403).json({
        success: false,
        message: 'Access denied. Administrator privileges required.'
      });
    }

    // Delete existing configuration
    await TypingTest.deleteMany({});
    console.log('🗑️ Existing configuration deleted');
    
    // Get new default configuration
    const defaultConfig = await TypingTest.getConfig();
    console.log('✅ Default configuration restored');
    
    res.json({
      success: true,
      message: 'Typing test configuration reset to defaults successfully',
      data: {
        modules: defaultConfig.modules,
        moduleNames: defaultConfig.moduleNames,
        lastUpdated: defaultConfig.lastUpdated
      }
    });
  } catch (error) {
    console.error('❌ Error resetting typing test configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset typing test configuration',
      error: error.message
    });
  }
});

module.exports = router;