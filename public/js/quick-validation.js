// Quick validation to check if critical elements exist
console.log("🔍 Quick Element Validation:");

const criticalElements = [
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

let allFound = true;
criticalElements.forEach(id => {
  const element = document.getElementById(id);
  if (element) {
    console.log(`✅ ${id}: Found`);
  } else {
    console.error(`❌ ${id}: Missing`);
    allFound = false;
  }
});

if (allFound) {
  console.log("🎉 All critical elements found!");
} else {
  console.error("❌ Some elements are missing - this will cause event binding failures");
}

// Check for the problematic element
const createFollowBubble = document.getElementById('createFollowBubble');
if (createFollowBubble) {
  console.warn("⚠️ createFollowBubble found - this shouldn't exist based on our analysis");
} else {
  console.log("✅ createFollowBubble correctly doesn't exist (as expected)");
}