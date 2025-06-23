/**
 * KEYBOARD TRAINING SUPPORT FUNCTIONS
 * Additional utility functions for the keyboard training system
 * This file provides compatibility and helper functions
 */

/**
 * Legacy compatibility functions
 * These functions maintain compatibility with existing code
 */

// Compatibility function for old progress tracking
function getUserProgress() {
  const userName = localStorage.getItem('userName') || 'student';
  const storageKey = 'smx_typing_results_' + userName;
  const results = JSON.parse(localStorage.getItem(storageKey) || '{}');
  
  // Convert to old format if needed
  const progress = { modules: [] };
  
  Object.keys(results).forEach(moduleIndex => {
    if (!progress.modules[moduleIndex]) {
      progress.modules[moduleIndex] = { practices: [] };
    }
    
    Object.keys(results[moduleIndex]).forEach(practiceIndex => {
      progress.modules[moduleIndex].practices[practiceIndex] = results[moduleIndex][practiceIndex];
    });
  });
  
  return progress;
}

/**
 * Save practice result in legacy format
 * Maintains compatibility with existing save functions
 */
function savePracticeResult(moduleIdx, practiceIdx, stats) {
  const userName = localStorage.getItem('userName') || 'student';
  const storageKey = 'smx_typing_results_' + userName;
  
  let results = JSON.parse(localStorage.getItem(storageKey) || '{}');
  
  if (!results[moduleIdx]) {
    results[moduleIdx] = {};
  }
  
  results[moduleIdx][practiceIdx] = {
    wpm: stats.wpm || 0,
    accuracy: stats.accuracy || 0,
    time: stats.time || 0,
    completed: true,
    timestamp: new Date().toISOString()
  };
  
  localStorage.setItem(storageKey, JSON.stringify(results));
  
  console.log(`Saved result for Module ${moduleIdx + 1}, Practice ${practiceIdx + 1}:`, stats);
}

/**
 * Integration functions for external scripts
 * These functions provide hooks for other parts of the system
 */

// Function called when typing test is completed (for integration with script.js)
function onTypingTestComplete(moduleIdx, practiceIdx, wpm, accuracy, time) {
  // Save the result
  savePracticeResult(moduleIdx, practiceIdx, { wpm, accuracy, time });
  
  // Update typing progress if function exists
  if (typeof updateTypingProgress === 'function') {
    updateTypingProgress(wpm, accuracy);
  }
  
  // Trigger any external callbacks
  if (typeof window.recordTypingResult === 'function') {
    window.recordTypingResult(wpm, accuracy);
  }
  
  console.log(`Typing test completed: Module ${moduleIdx + 1}, Practice ${practiceIdx + 1}`);
}

/**
 * Utility functions for data management
 */

// Get typing tests from localStorage with fallback
function getTypingTests() {
  return JSON.parse(localStorage.getItem('smx_typing_tests') || '[]');
}

// Get specific practice text
function getPracticeText(moduleIdx, practiceIdx) {
  const tests = getTypingTests();
  if (tests[moduleIdx] && tests[moduleIdx][practiceIdx]) {
    return tests[moduleIdx][practiceIdx];
  }
  return null;
}

// Check if practice is completed
function isPracticeCompleted(moduleIdx, practiceIdx) {
  const userName = localStorage.getItem('userName') || 'student';
  const storageKey = 'smx_typing_results_' + userName;
  const results = JSON.parse(localStorage.getItem(storageKey) || '{}');
  
  return !!(results[moduleIdx] && results[moduleIdx][practiceIdx] && results[moduleIdx][practiceIdx].completed);
}

// Get practice result
function getPracticeResult(moduleIdx, practiceIdx) {
  const userName = localStorage.getItem('userName') || 'student';
  const storageKey = 'smx_typing_results_' + userName;
  const results = JSON.parse(localStorage.getItem(storageKey) || '{}');
  
  if (results[moduleIdx] && results[moduleIdx][practiceIdx]) {
    return results[moduleIdx][practiceIdx];
  }
  return null;
}

/**
 * Statistics and reporting functions
 */

// Calculate overall statistics
function getOverallStats() {
  const userName = localStorage.getItem('userName') || 'student';
  const storageKey = 'smx_typing_results_' + userName;
  const results = JSON.parse(localStorage.getItem(storageKey) || '{}');
  
  let totalCompleted = 0;
  let totalWPM = 0;
  let wpmCount = 0;
  let bestWPM = 0;
  let totalAccuracy = 0;
  let accuracyCount = 0;
  
  Object.keys(results).forEach(moduleIndex => {
    Object.keys(results[moduleIndex]).forEach(practiceIndex => {
      const result = results[moduleIndex][practiceIndex];
      if (result && result.completed) {
        totalCompleted++;
        
        if (result.wpm) {
          totalWPM += result.wpm;
          wpmCount++;
          bestWPM = Math.max(bestWPM, result.wpm);
        }
        
        if (result.accuracy) {
          totalAccuracy += result.accuracy;
          accuracyCount++;
        }
      }
    });
  });
  
  return {
    totalCompleted,
    averageWPM: wpmCount > 0 ? Math.round(totalWPM / wpmCount) : 0,
    bestWPM,
    averageAccuracy: accuracyCount > 0 ? Math.round(totalAccuracy / accuracyCount) : 0
  };
}

// Get module completion percentage
function getModuleCompletion(moduleIdx) {
  const tests = getTypingTests();
  if (!tests[moduleIdx]) return 0;
  
  const practices = tests[moduleIdx].filter(practice => 
    practice && practice.trim() !== '' && !practice.includes('Enter typing text here')
  );
  
  if (practices.length === 0) return 0;
  
  let completed = 0;
  practices.forEach((practice, practiceIdx) => {
    if (isPracticeCompleted(moduleIdx, practiceIdx)) {
      completed++;
    }
  });
  
  return Math.round((completed / practices.length) * 100);
}

/**
 * Debug and maintenance functions
 */

// Log current state for debugging
function debugTypingSystem() {
  console.log('=== TYPING SYSTEM DEBUG ===');
  console.log('Typing Tests:', getTypingTests());
  console.log('User Results:', getUserProgress());
  console.log('Overall Stats:', getOverallStats());
  console.log('Module Completions:', [0,1,2,3,4].map(i => getModuleCompletion(i)));
  console.log('=== END DEBUG ===');
}

// Validate data integrity
function validateTypingData() {
  const tests = getTypingTests();
  const results = getUserProgress();
  
  let issues = [];
  
  if (tests.length === 0) {
    issues.push('No typing tests found');
  }
  
  tests.forEach((module, moduleIdx) => {
    if (!Array.isArray(module)) {
      issues.push(`Module ${moduleIdx} is not an array`);
    }
  });
  
  if (issues.length > 0) {
    console.warn('Typing data validation issues:', issues);
    return false;
  }
  
  console.log('Typing data validation passed');
  return true;
}

/**
 * Export functions for external use
 */
window.TypingSystem = {
  getUserProgress,
  savePracticeResult,
  onTypingTestComplete,
  getTypingTests,
  getPracticeText,
  isPracticeCompleted,
  getPracticeResult,
  getOverallStats,
  getModuleCompletion,
  debugTypingSystem,
  validateTypingData
};

// Legacy function names for compatibility
window.updateLeftBarColors = function() {
  console.log('updateLeftBarColors called - handled by main system');
};

window.loadPracticesDropdown = function() {
  console.log('loadPracticesDropdown called - handled by main system');
};

console.log('Keyboard Training Support Functions loaded');