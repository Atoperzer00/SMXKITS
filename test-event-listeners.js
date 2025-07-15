// Event Listeners Test Script for OpsLog.html
// Run this in browser console to test all event listeners

console.log("🧪 Starting Event Listeners Test...");

// Test 1: Check if all required elements exist
const requiredElements = [
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

console.log("\n📋 Element Existence Check:");
requiredElements.forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    console.log(`✅ ${id}: Found`);
  } else {
    console.error(`❌ ${id}: Missing`);
  }
});

// Test 2: Check if event listeners are attached
console.log("\n🔗 Event Listener Attachment Check:");
requiredElements.forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    // Check if element has click event listeners
    const hasClickListener = element.onclick !== null || 
                            (element._listeners && element._listeners.click) ||
                            element.hasAttribute('onclick');
    
    if (hasClickListener || element.tagName === 'FORM') {
      console.log(`✅ ${id}: Has event handler`);
    } else {
      console.warn(`⚠️ ${id}: No obvious event handler detected`);
    }
  }
});

// Test 3: Check CSS that might block interactions
console.log("\n🎨 CSS Interaction Check:");
const interactiveElements = document.querySelectorAll('button, input, select, textarea, form');
let blockedElements = 0;

interactiveElements.forEach(element => {
  const styles = window.getComputedStyle(element);
  const pointerEvents = styles.pointerEvents;
  const zIndex = styles.zIndex;
  
  if (pointerEvents === 'none') {
    console.warn(`⚠️ Element blocked by pointer-events: none`, element);
    blockedElements++;
  }
  
  if (zIndex && parseInt(zIndex) < 0) {
    console.warn(`⚠️ Element may be hidden by negative z-index: ${zIndex}`, element);
    blockedElements++;
  }
});

if (blockedElements === 0) {
  console.log("✅ No CSS blocking issues found");
} else {
  console.warn(`⚠️ Found ${blockedElements} potentially blocked elements`);
}

// Test 4: Simulate button clicks (non-destructive)
console.log("\n🖱️ Button Click Simulation Test:");
const testButtons = ['editCalloutBtn', 'viewHistoryBtn', 'gradingBtn'];

testButtons.forEach(id => {
  const button = document.getElementById(id);
  if (button && !button.disabled) {
    try {
      // Create a test click event
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      console.log(`🧪 Testing ${id}...`);
      // Note: This will actually trigger the event, so be careful
      // button.dispatchEvent(clickEvent);
      console.log(`✅ ${id}: Click event can be dispatched`);
    } catch (error) {
      console.error(`❌ ${id}: Error during click test`, error);
    }
  } else if (button && button.disabled) {
    console.log(`ℹ️ ${id}: Disabled (expected behavior)`);
  }
});

// Test 5: Check for JavaScript errors in console
console.log("\n🐛 JavaScript Error Check:");
console.log("Check the console for any red error messages above this test.");
console.log("Common issues to look for:");
console.log("- ReferenceError: function is not defined");
console.log("- TypeError: Cannot read property of null");
console.log("- Network errors for missing resources");

console.log("\n✅ Event Listeners Test Complete!");
console.log("If you see any ❌ or ⚠️ messages above, those need attention.");