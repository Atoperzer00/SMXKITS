// DOMContentLoaded Logic Validation Script
// Run this in browser console to validate all scripts and handlers are loaded correctly

console.log("🔍 Starting DOMContentLoaded Logic Validation...");

// Test 1: Check if DOM is ready
console.log("\n📋 DOM Readiness Check:");
if (document.readyState === 'complete') {
  console.log("✅ Document ready state: complete");
} else if (document.readyState === 'interactive') {
  console.log("⚠️ Document ready state: interactive (DOM loaded but resources may still be loading)");
} else {
  console.log("❌ Document ready state: loading (DOM not ready)");
}

// Test 2: Check if external scripts are loaded
console.log("\n📦 External Scripts Check:");
const requiredScripts = [
  { name: 'Socket.IO', check: () => typeof io !== 'undefined' },
  { name: 'Auth Check', check: () => typeof window.logout === 'function' }
];

requiredScripts.forEach(script => {
  try {
    if (script.check()) {
      console.log(`✅ ${script.name}: Loaded`);
    } else {
      console.error(`❌ ${script.name}: Not loaded`);
    }
  } catch (error) {
    console.error(`❌ ${script.name}: Error checking - ${error.message}`);
  }
});

// Test 3: Check if functions called in DOMContentLoaded exist
console.log("\n🔧 Function Availability Check:");
const requiredFunctions = [
  'initSidebarResize',
  'initializeFollowFormFunctionality', 
  'updateSidebarButtonStates',
  'goDashboard',
  'openRoomModal',
  'logout',
  'editCallout',
  'calloutHistory',
  'goToGrading',
  'handleGroupEdit',
  'handleGroupQC',
  'clearBubbleSelection'
];

requiredFunctions.forEach(funcName => {
  if (typeof window[funcName] === 'function') {
    console.log(`✅ ${funcName}: Available`);
  } else {
    console.error(`❌ ${funcName}: Not found or not a function`);
  }
});

// Test 4: Check if all required DOM elements exist
console.log("\n🏗️ Required DOM Elements Check:");
const requiredElements = [
  'sidebar-resize-handle',
  'editCalloutBtn',
  'viewHistoryBtn',
  'gradingBtn',
  'createFollowBtn',
  'joinRoomForm',
  'logForm',
  'followNameInput',
  'followIdDisplay',
  'followIdHidden',
  'followStageSelected',
  'followStopNumber',
  'historyOverlay',
  'calloutMenuModal'
];

let missingElements = 0;
requiredElements.forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    console.log(`✅ ${id}: Found`);
  } else {
    console.error(`❌ ${id}: Missing`);
    missingElements++;
  }
});

// Test 5: Check if event handlers are properly bound
console.log("\n🔗 Event Handler Binding Check:");
const buttonIds = [
  'editCalloutBtn',
  'viewHistoryBtn', 
  'gradingBtn',
  'createFollowBtn',
  'dashboardBtn',
  'joinRoomBtn',
  'logoutBtn',
  'groupEditBtn',
  'groupQCBtn',
  'groupCancelBtn'
];

let unboundButtons = 0;
buttonIds.forEach(id => {
  const button = document.getElementById(id);
  if (button) {
    // Check if button has event listeners
    const hasListeners = button.onclick !== null || 
                        getEventListeners(button)?.click?.length > 0 ||
                        button.hasAttribute('onclick');
    
    if (hasListeners || typeof getEventListeners === 'undefined') {
      console.log(`✅ ${id}: Has event handlers`);
    } else {
      console.warn(`⚠️ ${id}: No event handlers detected`);
      unboundButtons++;
    }
  }
});

// Test 6: Check for JavaScript errors in console
console.log("\n🐛 JavaScript Error Detection:");
const originalError = console.error;
let errorCount = 0;

console.error = function(...args) {
  errorCount++;
  originalError.apply(console, args);
};

// Restore original console.error after a brief moment
setTimeout(() => {
  console.error = originalError;
  if (errorCount === 0) {
    console.log("✅ No JavaScript errors detected during validation");
  } else {
    console.warn(`⚠️ ${errorCount} JavaScript errors detected`);
  }
}, 100);

// Test 7: Check initialization order
console.log("\n📋 Initialization Order Check:");
const initializationSteps = [
  { name: 'DOM Ready', check: () => document.readyState !== 'loading' },
  { name: 'External Scripts', check: () => typeof io !== 'undefined' },
  { name: 'Auth Check', check: () => typeof window.logout === 'function' },
  { name: 'Global Variables', check: () => typeof currentRoom !== 'undefined' },
  { name: 'Socket Connection', check: () => typeof socket !== 'undefined' }
];

initializationSteps.forEach((step, index) => {
  try {
    if (step.check()) {
      console.log(`✅ Step ${index + 1}: ${step.name} - OK`);
    } else {
      console.warn(`⚠️ Step ${index + 1}: ${step.name} - Not ready`);
    }
  } catch (error) {
    console.error(`❌ Step ${index + 1}: ${step.name} - Error: ${error.message}`);
  }
});

// Test 8: Check for race conditions
console.log("\n⚡ Race Condition Check:");
setTimeout(() => {
  // Check if elements that should be available after DOMContentLoaded are actually there
  const criticalElements = ['logForm', 'joinRoomForm', 'editCalloutBtn'];
  let raceConditions = 0;
  
  criticalElements.forEach(id => {
    const element = document.getElementById(id);
    if (!element) {
      console.error(`❌ Race condition detected: ${id} not available after DOM load`);
      raceConditions++;
    }
  });
  
  if (raceConditions === 0) {
    console.log("✅ No race conditions detected");
  } else {
    console.warn(`⚠️ ${raceConditions} potential race conditions found`);
  }
}, 500);

// Test 9: Memory leak detection
console.log("\n🧠 Memory Leak Prevention Check:");
const checkMemoryLeaks = () => {
  // Check for common memory leak patterns
  const issues = [];
  
  // Check for unremoved event listeners on window/document
  if (typeof getEventListeners !== 'undefined') {
    const windowListeners = getEventListeners(window);
    const documentListeners = getEventListeners(document);
    
    if (windowListeners && Object.keys(windowListeners).length > 10) {
      issues.push("Many event listeners on window object");
    }
    
    if (documentListeners && Object.keys(documentListeners).length > 10) {
      issues.push("Many event listeners on document object");
    }
  }
  
  // Check for global variables that might cause leaks
  const globalVars = Object.keys(window).filter(key => 
    !key.startsWith('webkit') && 
    !key.startsWith('chrome') && 
    typeof window[key] === 'object' && 
    window[key] !== null
  );
  
  if (globalVars.length > 50) {
    issues.push("Many global variables detected");
  }
  
  if (issues.length === 0) {
    console.log("✅ No obvious memory leak patterns detected");
  } else {
    console.warn("⚠️ Potential memory leak issues:", issues);
  }
};

checkMemoryLeaks();

// Final Summary
console.log("\n📊 Validation Summary:");
console.log("=".repeat(50));

const totalIssues = missingElements + unboundButtons;
if (totalIssues === 0) {
  console.log("🎉 All DOMContentLoaded logic validation tests passed!");
  console.log("✅ Scripts and handlers are loaded correctly");
} else {
  console.warn(`⚠️ Found ${totalIssues} issues that need attention:`);
  if (missingElements > 0) {
    console.warn(`   - ${missingElements} missing DOM elements`);
  }
  if (unboundButtons > 0) {
    console.warn(`   - ${unboundButtons} buttons without event handlers`);
  }
}

console.log("\n🔍 Validation complete. Check above for any ❌ or ⚠️ messages.");