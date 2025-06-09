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
  
  // Initialize for typing test functionality
  // This will be handled by script.js after it's loaded from SMXKITS.html
});

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