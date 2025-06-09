// Typing Progress Tracking

// Default values if no data exists
let typingData = {
  testsCompleted: 0,
  totalTests: 5,
  lastWPM: 0,
  avgWPM: 0,
  wpmHistory: []
};

// Initialize typing data when page loads
document.addEventListener('DOMContentLoaded', function() {
  loadTypingData();
  updateDashboardProgress();
});

// Load typing data from localStorage
function loadTypingData() {
  const savedData = localStorage.getItem('typingData');
  if (savedData) {
    try {
      typingData = JSON.parse(savedData);
      console.log('Loaded typing data:', typingData);
    } catch (e) {
      console.error('Error loading typing data:', e);
    }
  }
}

// Save typing data to localStorage
function saveTypingData() {
  localStorage.setItem('typingData', JSON.stringify(typingData));
}

// Update typing progress after completing a test
function updateTypingProgress(wpm, accuracy) {
  // Load current data first to ensure we have the latest
  loadTypingData();
  
  // Update test count
  typingData.testsCompleted = Math.min(typingData.testsCompleted + 1, typingData.totalTests);
  
  // Update WPM data
  typingData.lastWPM = wpm;
  typingData.wpmHistory.push(wpm);
  
  // Calculate average WPM
  if (typingData.wpmHistory.length > 0) {
    const sum = typingData.wpmHistory.reduce((a, b) => a + b, 0);
    typingData.avgWPM = Math.round(sum / typingData.wpmHistory.length);
  }
  
  // Save updated data
  saveTypingData();
  
  // Update dashboard display if we're on the dashboard page
  if (document.getElementById('typing-progress-bar')) {
    updateDashboardProgress();
  }
}

// Update the dashboard progress display
function updateDashboardProgress() {
  const progressBar = document.getElementById('typing-progress-bar');
  const progressText = document.getElementById('typing-progress-text');
  const lastWpmEl = document.getElementById('last-wpm');
  const avgWpmEl = document.getElementById('avg-wpm');
  
  if (progressBar && progressText) {
    // Calculate percentage
    const percentage = Math.round((typingData.testsCompleted / typingData.totalTests) * 100);
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${typingData.testsCompleted} of ${typingData.totalTests} typing tests completed`;
  }
  
  if (lastWpmEl) {
    lastWpmEl.textContent = typingData.lastWPM;
  }
  
  if (avgWpmEl) {
    avgWpmEl.textContent = typingData.avgWPM;
  }
  
  // Update the new dashboard stats display
  showDashboardStats();
}

// Show dashboard stats from smx_user_progress
function showDashboardStats() {
  // Skip if elements don't exist (not on dashboard page)
  if (!document.getElementById('dashboard-best-wpm')) return;
  
  // Get progress data
  let progress = {};
  try {
    progress = JSON.parse(localStorage.getItem('smx_user_progress') || '{}');
  } catch (e) {
    console.error('Error parsing user progress:', e);
    return;
  }
  
  let wpmArr = [], accArr = [], complete = 0, total = 0;
  
  // Extract stats from all modules and practices
  (progress.modules || []).forEach(mod => {
    if (!mod) return;
    (mod.practices || []).forEach(pr => {
      if (!pr) return;
      if (pr?.wpm) wpmArr.push(pr.wpm);
      if (pr?.accuracy) accArr.push(pr.accuracy);
      if (pr?.completed) complete++;
      total++;
    });
  });
  
  // Update the display elements
  document.getElementById('dashboard-best-wpm').innerText = 'Best WPM: ' + 
    (wpmArr.length ? Math.max(...wpmArr) : '--');
  
  document.getElementById('dashboard-avg-wpm').innerText = 'Average WPM: ' + 
    (wpmArr.length ? (wpmArr.reduce((a, b) => a + b, 0) / wpmArr.length).toFixed(1) : '--');
  
  document.getElementById('dashboard-accuracy').innerText = 'Accuracy: ' + 
    (accArr.length ? (accArr.reduce((a, b) => a + b, 0) / accArr.length).toFixed(1) + '%' : '--');
  
  // If we have a progress bar, update it too
  if (document.getElementById('typing-progress-bar') && total > 0) {
    const percentage = (complete / total) * 100;
    document.getElementById('typing-progress-bar').style.width = `${percentage}%`;
    document.getElementById('typing-progress-text').textContent = 
      `${complete} of ${total} typing tests completed`;
  }
}

// Integrate with the showResults function in script.js
// This should be called from script.js when a typing test is completed
window.recordTypingResult = function(wpm, accuracy) {
  updateTypingProgress(wpm, accuracy);
};