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
  
  // Update visual feedback for completed practices
  setTimeout(() => {
    if (typeof updateLeftBarColors === 'function') {
      updateLeftBarColors();
    }
  }, 1000); // Delay to ensure modules are loaded
});

// Update visual feedback for module/practice completion
function updateLeftBarColors() {
  const progress = getUserProgress();
  
  document.querySelectorAll('.module-group').forEach((modDiv, i) => {
    // Check if ALL practices completed
    let allComplete = true;
    for (let j = 0; j < 20; j++) {
      if (!progress.modules?.[i]?.practices?.[j]?.completed) allComplete = false;
    }
    
    // Color module button
    const modBtn = modDiv.querySelector('button[data-module]');
    if (allComplete) {
      modBtn.classList.add('bg-green-500', 'text-white', 'shadow-md');
      modBtn.classList.remove('bg-zinc-800/70');
    } else {
      modBtn.classList.remove('bg-green-500', 'text-white', 'shadow-md');
      modBtn.classList.add('bg-zinc-800/70');
    }
    
    // Practices
    modDiv.querySelectorAll('button[data-practice]').forEach((pBtn, j) => {
      if (progress.modules?.[i]?.practices?.[j]?.completed) {
        pBtn.classList.add('text-green-400', 'font-bold');
        pBtn.classList.remove('text-zinc-200');
        
        // Add checkmark if not present
        if (!pBtn.querySelector('.checkmark')) {
          const check = document.createElement('span');
          check.className = 'checkmark ml-2';
          check.innerHTML = '✓';
          pBtn.appendChild(check);
        }
      } else {
        pBtn.classList.remove('text-green-400', 'font-bold');
        pBtn.classList.add('text-zinc-200');
        
        // Remove checkmark if present
        const check = pBtn.querySelector('.checkmark');
        if (check) check.remove();
      }
    });
  });
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