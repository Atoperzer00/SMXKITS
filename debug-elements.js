// Debug script to check element availability
// Run this in browser console AFTER page loads

console.log("🔍 DEBUG: Checking element availability...");

// Check document ready state
console.log(`Document ready state: ${document.readyState}`);

// Check critical elements
const elementsToCheck = [
  'editCalloutBtn',
  'viewHistoryBtn', 
  'gradingBtn',
  'createFollowBtn',
  'joinRoomForm',
  'logForm',
  'dashboardBtn',
  'joinRoomBtn',
  'logoutBtn'
];

console.log("\n📋 Element Check Results:");
elementsToCheck.forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    console.log(`✅ ${id}: Found (${element.tagName})`);
    
    // Check if it has event listeners
    if (element.onclick) {
      console.log(`   - Has onclick handler`);
    }
    
    // Try to detect addEventListener listeners (limited browser support)
    if (typeof getEventListeners !== 'undefined') {
      const listeners = getEventListeners(element);
      if (listeners && Object.keys(listeners).length > 0) {
        console.log(`   - Has addEventListener listeners:`, Object.keys(listeners));
      }
    }
  } else {
    console.error(`❌ ${id}: NOT FOUND`);
  }
});

// Test a simple click simulation
console.log("\n🖱️ Testing button click simulation:");
const testBtn = document.getElementById('gradingBtn');
if (testBtn) {
  console.log("Found gradingBtn, testing click...");
  
  // Create and dispatch a click event
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  
  try {
    testBtn.dispatchEvent(clickEvent);
    console.log("✅ Click event dispatched successfully");
  } catch (error) {
    console.error("❌ Error dispatching click:", error);
  }
} else {
  console.error("❌ gradingBtn not found for testing");
}

// Check for JavaScript errors
console.log("\n🐛 Checking for JavaScript errors:");
console.log("Look above this message for any red error messages in the console.");

console.log("\n✅ Debug complete!");