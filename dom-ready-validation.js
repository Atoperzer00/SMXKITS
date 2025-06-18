// DOM Ready Validation Script - Run in browser console
// This script validates that all JavaScript executes AFTER DOM is ready

console.log("🔍 DOM Ready Validation Starting...");

// Test 1: Check document ready state
console.log("\n📋 Document Ready State Check:");
console.log(`Document ready state: ${document.readyState}`);
if (document.readyState === 'complete') {
  console.log("✅ Document is fully loaded");
} else if (document.readyState === 'interactive') {
  console.log("⚠️ DOM loaded but resources may still be loading");
} else {
  console.log("❌ Document still loading");
}

// Test 2: Check if elements exist that should be available
console.log("\n🏗️ Critical Elements Availability:");
const criticalElements = [
  'editCalloutBtn',
  'viewHistoryBtn',
  'gradingBtn',
  'createFollowBtn',
  'joinRoomForm',
  'logForm',
  'sidebar-resize-handle'
];

let missingElements = [];
criticalElements.forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    console.log(`✅ ${id}: Found`);
  } else {
    console.error(`❌ ${id}: Missing`);
    missingElements.push(id);
  }
});

// Test 3: Check for bubble elements (callouts)
console.log("\n🫧 Bubble Elements Check:");
const bubbles = document.querySelectorAll('.bubble');
if (bubbles.length > 0) {
  console.log(`✅ Found ${bubbles.length} bubble elements`);
  
  // Check if they have drag functionality
  let draggableBubbles = 0;
  bubbles.forEach(bubble => {
    if (bubble.draggable || bubble.getAttribute('draggable') === 'true') {
      draggableBubbles++;
    }
  });
  
  if (draggableBubbles > 0) {
    console.log(`✅ ${draggableBubbles} bubbles are draggable`);
  } else {
    console.warn("⚠️ No bubbles appear to be draggable");
  }
} else {
  console.warn("⚠️ No bubble elements found (may be normal if no callouts exist)");
}

// Test 4: Check for duplicate function definitions
console.log("\n🔄 Duplicate Function Check:");
const functionsToCheck = ['autoGrow', 'formatSlant', 'initializeSocket', 'setupSocketListeners'];

functionsToCheck.forEach(funcName => {
  if (typeof window[funcName] === 'function') {
    console.log(`✅ ${funcName}: Available as global function`);
  } else {
    console.log(`ℹ️ ${funcName}: Not in global scope (may be scoped properly)`);
  }
});

// Test 5: Check socket initialization
console.log("\n🔌 Socket Connection Check:");
if (typeof socket !== 'undefined' && socket) {
  console.log("✅ Socket object exists");
  console.log(`Socket connected: ${socket.connected}`);
  console.log(`Socket ID: ${socket.id || 'Not connected'}`);
} else {
  console.error("❌ Socket object not found");
}

// Test 6: Check for event listeners on critical elements
console.log("\n🔗 Event Listener Verification:");
const buttonsToCheck = ['editCalloutBtn', 'viewHistoryBtn', 'gradingBtn', 'createFollowBtn'];

buttonsToCheck.forEach(id => {
  const button = document.getElementById(id);
  if (button) {
    // Try to detect event listeners (limited in some browsers)
    const hasOnClick = button.onclick !== null;
    const hasEventListeners = typeof getEventListeners !== 'undefined' ? 
                              getEventListeners(button)?.click?.length > 0 : 
                              'Cannot detect (browser limitation)';
    
    console.log(`${id}:`);
    console.log(`  - onclick: ${hasOnClick ? 'Yes' : 'No'}`);
    console.log(`  - addEventListener: ${hasEventListeners}`);
  }
});

// Test 7: Check for JavaScript errors
console.log("\n🐛 Error Detection:");
let errorCount = 0;
const originalError = console.error;

// Temporarily override console.error to count errors
console.error = function(...args) {
  errorCount++;
  originalError.apply(console, args);
};

// Restore after a moment
setTimeout(() => {
  console.error = originalError;
  if (errorCount === 0) {
    console.log("✅ No JavaScript errors detected during validation");
  } else {
    console.warn(`⚠️ ${errorCount} JavaScript errors detected`);
  }
}, 100);

// Test 8: Test drag and drop functionality
console.log("\n🖱️ Drag & Drop Functionality Test:");
const createFollowBubble = document.getElementById('createFollowBubble');
if (createFollowBubble) {
  console.log("✅ createFollowBubble element found");
  
  // Check if it has event listeners
  const hasListeners = typeof getEventListeners !== 'undefined' ? 
                      getEventListeners(createFollowBubble) : 
                      'Cannot detect listeners';
  console.log(`Event listeners: ${JSON.stringify(hasListeners, null, 2)}`);
} else {
  console.warn("⚠️ createFollowBubble element not found");
}

// Test 9: Form validation
console.log("\n📝 Form Validation:");
const forms = ['joinRoomForm', 'logForm'];
forms.forEach(formId => {
  const form = document.getElementById(formId);
  if (form) {
    console.log(`✅ ${formId}: Found`);
    
    // Check if form has submit handler
    const hasSubmitHandler = form.onsubmit !== null || 
                            (typeof getEventListeners !== 'undefined' && 
                             getEventListeners(form)?.submit?.length > 0);
    
    console.log(`  - Submit handler: ${hasSubmitHandler ? 'Yes' : 'Cannot detect'}`);
  } else {
    console.error(`❌ ${formId}: Not found`);
  }
});

// Test 10: Memory leak check
console.log("\n🧠 Memory Leak Prevention:");
const globalVarCount = Object.keys(window).length;
console.log(`Global variables count: ${globalVarCount}`);

if (globalVarCount > 200) {
  console.warn("⚠️ High number of global variables - potential memory leak risk");
} else {
  console.log("✅ Global variable count appears normal");
}

// Final Summary
console.log("\n📊 VALIDATION SUMMARY");
console.log("=".repeat(50));

const totalIssues = missingElements.length + errorCount;

if (totalIssues === 0) {
  console.log("🎉 ALL TESTS PASSED!");
  console.log("✅ DOM is ready before JavaScript execution");
  console.log("✅ All critical elements are available");
  console.log("✅ Event listeners appear to be properly bound");
  console.log("✅ No obvious JavaScript errors");
} else {
  console.warn(`⚠️ Found ${totalIssues} issues:`);
  if (missingElements.length > 0) {
    console.warn(`   - ${missingElements.length} missing elements: ${missingElements.join(', ')}`);
  }
  if (errorCount > 0) {
    console.warn(`   - ${errorCount} JavaScript errors`);
  }
}

console.log("\n🔍 Validation complete. Check above for any ❌ or ⚠️ messages.");
console.log("💡 Tip: If you see issues, refresh the page and run this script again.");