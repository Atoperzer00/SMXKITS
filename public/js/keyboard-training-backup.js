// Keyboard Training page JavaScript

// This script helps integrate the original SMXKITS typing functionality
// with the new standalone keyboard-training.html page

document.addEventListener('DOMContentLoaded', function() {
  console.log('Keyboard training page loaded');
  
  // Load student data
  const studentName = localStorage.getItem('userName') || 'Student';
  const studentDay = localStorage.getItem('studentDay') || 'Day 3/7';
  
  // Update display
  document.getElementById('studentName').textContent = studentName;
  document.getElementById('studentDay').textContent = studentDay;
  
  // Load typing progress from typing-progress.js
  if (typeof loadTypingData === 'function') {
    loadTypingData();
    updateDashboardProgress();
  }
  
  // Load modules from script.js
  if (typeof loadModules === 'function') {
    console.log('Loading modules for keyboard training...');
    loadModules();
  } else {
    console.error('loadModules function not available');
  }
  
  // Update visual feedback for completed practices
  setTimeout(() => {
    if (typeof updateLeftBarColors === 'function') {
      updateLeftBarColors();
    }
  }, 1000); // Delay to ensure modules are loaded
});

// Update visual feedback for module/practice completion
function updateLeftBarColors() {
  // This function is no longer needed as the current HTML structure
  // handles visual feedback through renderModuleList() and updateModuleProgress()
  console.log('updateLeftBarColors called - visual updates handled by keyboard-training.html');
  
  // Visual updates are now handled exclusively by the main HTML file
  // to prevent race conditions and duplicate rendering
}

// Helper function to integrate with SMXKITS.js screens
function showScreen(screenId) {
  // First hide all screens in the dynamic content
  const screens = document.querySelectorAll('#dynamic-content .screen');
  screens.forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Show requested screen
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
    
    // Move it out of dynamic-content and into main view
    document.body.appendChild(targetScreen);
    
    // Set current screen for script.js to reference
    window.activeScreen = screenId;
  }
}

// Redirect back to dashboard
function goToDashboard() {
  window.location.href = 'dashboard.html';
}

// Function to go directly to typing mode
function startTyping(moduleId, practiceId) {
  if (typeof setupTypingTest === 'function') {
    setupTypingTest(moduleId, practiceId);
  } else {
    console.error('Setup typing test function not available');
  }
}

// Save progress to localStorage (swap with API if needed)
function savePracticeResult(moduleIdx, practiceIdx, stats) {
  let userProgress = JSON.parse(localStorage.getItem('smx_user_progress') || '{}');
  if (!userProgress.modules) userProgress.modules = [];
  if (!userProgress.modules[moduleIdx]) userProgress.modules[moduleIdx] = { practices: [] };
  userProgress.modules[moduleIdx].practices[practiceIdx] = stats;
  localStorage.setItem('smx_user_progress', JSON.stringify(userProgress));
}

// Load progress on page load
function getUserProgress() {
  return JSON.parse(localStorage.getItem('smx_user_progress') || '{}');
}

// Show the results modal
function showResultsOverlay(moduleIdx, practiceIdx, moduleName, practiceName, time, accuracy, wpm, completed) {
  document.getElementById('resultsModuleTitle').innerText = moduleName;
  document.getElementById('resultsPracticeTitle').innerText = practiceName;
  document.getElementById('resultsCompletionTime').innerText = 'Completion Time: ' + time + 's';
  document.getElementById('resultsAccuracy').innerText = 'Accuracy: ' + accuracy + '%';
  document.getElementById('resultsWPM').innerText = 'Words Per Minute: ' + wpm;

  // Make stats green if complete, else blue/gray
  const statEls = [
    document.getElementById('resultsCompletionTime'),
    document.getElementById('resultsAccuracy'),
    document.getElementById('resultsWPM')
  ];
  statEls.forEach(el => el.classList.remove('text-green-400', 'text-zinc-300', 'text-blue-300'));
  
  if (completed) {
    statEls.forEach(el => el.classList.add('text-green-400'));
    document.getElementById('resultsStar').style.display = '';
  } else {
    statEls.forEach(el => el.classList.add('text-blue-300'));
    document.getElementById('resultsStar').style.display = 'none';
  }
  
  document.getElementById('resultsModal').classList.remove('hidden');
  
  // Save progress
  savePracticeResult(moduleIdx, practiceIdx, { completed, time, accuracy, wpm });
  
  // Recolor left bar if needed
  if (typeof updateLeftBarColors === 'function') updateLeftBarColors();
}

// Hide modal
function hideResultsOverlay() {
  document.getElementById('resultsModal').classList.add('hidden');
}

// Retry typing
function retryTyping() {
  hideResultsOverlay();
  if (typeof reloadCurrentTypingTest === 'function') reloadCurrentTypingTest();
}

// This function is no longer needed as the module list is rendered by the main HTML
// The renderModuleList() function in keyboard-training.html handles module display
function loadPracticesDropdown() {
  console.log('loadPracticesDropdown called - module rendering is handled by keyboard-training.html');
  // Module rendering is now exclusively handled by keyboard-training.html DOMContentLoaded
  // No need to call renderModuleList() here as it creates conflicts
}

// Removed DOMContentLoaded listener to prevent duplicate calls
// All module rendering is now handled in keyboard-training.html