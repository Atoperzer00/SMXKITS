// 🔍 COMPREHENSIVE BUTTON DEBUG INJECTION SCRIPT
// This script can be run in the browser console on OpsLog.html to debug button issues

console.log("🚀 INJECTING COMPREHENSIVE BUTTON DEBUG TOOL");

// Create debug overlay
const debugOverlay = document.createElement('div');
debugOverlay.id = 'buttonDebugOverlay';
debugOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.95);
    z-index: 10000;
    overflow-y: auto;
    font-family: 'Consolas', 'Monaco', monospace;
    color: #00ff00;
    padding: 20px;
    box-sizing: border-box;
`;

debugOverlay.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h1 style="color: #ffff00; margin: 0;">🔍 BUTTON DEBUG SWEEP</h1>
            <button onclick="document.getElementById('buttonDebugOverlay').remove()" 
                    style="background: #ff4444; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                ✕ Close Debug
            </button>
        </div>
        
        <div id="debugResults" style="display: grid; gap: 15px;">
            <div class="debug-section">
                <div class="debug-title">🎯 Step 1: Element Existence Check</div>
                <div id="elementCheck">Running...</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-title">🔗 Step 2: Event Handler Binding Check</div>
                <div id="bindingCheck">Running...</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-title">⏰ Step 3: Script Timing Analysis</div>
                <div id="timingCheck">Running...</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-title">🖱️ Step 4: Manual Click Simulation</div>
                <div id="clickTest">Running...</div>
                <button onclick="simulateClicks()" style="margin-top: 10px; background: #333; color: #fff; border: 1px solid #666; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    🔄 Re-run Click Tests
                </button>
            </div>
            
            <div class="debug-section">
                <div class="debug-title">🧬 Step 5: DOM Mutation Test</div>
                <div id="mutationTest">Running...</div>
                <button onclick="testMutationObserver()" style="margin-top: 10px; background: #333; color: #fff; border: 1px solid #666; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    🧪 Test Mutation Observer
                </button>
            </div>
            
            <div class="debug-section">
                <div class="debug-title">🎨 Step 6: CSS & Layout Validation</div>
                <div id="cssCheck">Running...</div>
            </div>
            
            <div class="debug-section">
                <div class="debug-title">📊 Debug Summary & Recommendations</div>
                <div id="debugSummary">Analyzing...</div>
            </div>
        </div>
    </div>
`;

// Add CSS for debug sections
const debugCSS = document.createElement('style');
debugCSS.textContent = `
    .debug-section {
        background: #2a2a2a;
        border: 2px solid #444;
        border-radius: 8px;
        padding: 15px;
    }
    .debug-title {
        color: #ffff00;
        font-size: 1.2em;
        font-weight: bold;
        margin-bottom: 10px;
    }
    .debug-section pre {
        background: #111;
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
        white-space: pre-wrap;
        margin: 0;
    }
    .success { color: #00ff00; }
    .error { color: #ff4444; }
    .warning { color: #ffaa00; }
    .info { color: #44aaff; }
`;
document.head.appendChild(debugCSS);
document.body.appendChild(debugOverlay);

// Debug functionality
const debugResults = {
    elementCheck: {},
    bindingCheck: {},
    timingCheck: {},
    clickTest: {},
    mutationTest: {},
    cssCheck: {}
};

const targetButtons = [
    "createFollowBtn",
    "gradingBtn", 
    "editCalloutBtn",
    "viewHistoryBtn",
    "joinRoomBtn",
    "dashboardBtn",
    "logoutBtn"
];

// Step 1: Element Existence Check
function checkElementExistence() {
    console.log("🔍 Step 1: Checking element existence...");
    const results = [];
    const allButtons = document.querySelectorAll('button');
    
    results.push(`📋 Total buttons found in DOM: ${allButtons.length}`);
    results.push(`📋 All button IDs: ${Array.from(allButtons).map(btn => btn.id || 'NO-ID').join(', ')}`);
    results.push('');
    
    targetButtons.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            debugResults.elementCheck[id] = true;
            results.push(`✅ ${id}: EXISTS`);
            results.push(`   - Tag: ${element.tagName}`);
            results.push(`   - Type: ${element.type || 'N/A'}`);
            results.push(`   - Disabled: ${element.disabled}`);
            results.push(`   - Display: ${getComputedStyle(element).display}`);
            results.push(`   - Visibility: ${getComputedStyle(element).visibility}`);
            results.push(`   - Pointer Events: ${getComputedStyle(element).pointerEvents}`);
            results.push(`   - Text Content: "${element.textContent.trim()}"`);
        } else {
            debugResults.elementCheck[id] = false;
            results.push(`❌ ${id}: NOT FOUND`);
        }
        results.push('');
    });

    document.getElementById('elementCheck').innerHTML = `<pre>${results.join('\n')}</pre>`;
}

// Step 2: Event Handler Binding Check
function checkEventBindings() {
    console.log("🔗 Step 2: Checking event bindings...");
    const results = [];
    
    targetButtons.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const bound = element.dataset.bound === "true";
            const hasOnClick = element.onclick !== null;
            const hasEventListeners = typeof getEventListeners === 'function' ? getEventListeners(element) : 'N/A (DevTools required)';
            
            debugResults.bindingCheck[id] = {
                bound: bound,
                hasOnClick: hasOnClick,
                hasEventListeners: hasEventListeners
            };
            
            results.push(`🔍 ${id}:`);
            results.push(`   - dataset.bound: ${bound ? '✅' : '❌'} (${element.dataset.bound || 'undefined'})`);
            results.push(`   - onclick handler: ${hasOnClick ? '✅' : '❌'}`);
            if (typeof hasEventListeners === 'object' && hasEventListeners.click) {
                results.push(`   - Click listeners: ✅ ${hasEventListeners.click.length} found`);
            } else {
                results.push(`   - Click listeners: ${typeof hasEventListeners === 'string' ? hasEventListeners : '❌ None detected'}`);
            }
        } else {
            results.push(`❌ ${id}: Element not found`);
        }
        results.push('');
    });

    document.getElementById('bindingCheck').innerHTML = `<pre>${results.join('\n')}</pre>`;
}

// Step 3: Script Timing Analysis
function checkScriptTiming() {
    console.log("⏰ Step 3: Analyzing script timing...");
    const results = [];
    
    results.push(`📊 Document ready state: ${document.readyState}`);
    results.push(`📊 Total DOM elements: ${document.querySelectorAll('*').length}`);
    results.push(`📊 Current timestamp: ${new Date().toISOString()}`);
    results.push(`📊 Page load time: ${performance.now().toFixed(2)}ms`);
    results.push('');
    
    // Check if DOMContentLoaded has fired
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        results.push('✅ DOMContentLoaded should have fired');
    } else {
        results.push('⚠️ DOM may not be fully loaded');
    }
    
    // Check for multiple script tags and DOMContentLoaded listeners
    const scripts = document.querySelectorAll('script');
    results.push(`📊 Total script tags: ${scripts.length}`);
    
    // Try to detect multiple DOMContentLoaded listeners (this is tricky)
    results.push('');
    results.push('🔍 Checking for potential script conflicts...');
    
    // Look for multiple DOMContentLoaded in script content
    let domContentLoadedCount = 0;
    scripts.forEach((script, index) => {
        if (script.textContent && script.textContent.includes('DOMContentLoaded')) {
            const matches = script.textContent.match(/DOMContentLoaded/g);
            if (matches) {
                domContentLoadedCount += matches.length;
                results.push(`   - Script ${index + 1}: ${matches.length} DOMContentLoaded references`);
            }
        }
    });
    
    if (domContentLoadedCount > 1) {
        results.push(`⚠️ POTENTIAL ISSUE: ${domContentLoadedCount} DOMContentLoaded references found`);
        results.push('   This could indicate multiple conflicting event listeners');
    } else {
        results.push('✅ No obvious script conflicts detected');
    }
    
    debugResults.timingCheck = {
        readyState: document.readyState,
        elementCount: document.querySelectorAll('*').length,
        scriptCount: scripts.length,
        domContentLoadedCount: domContentLoadedCount
    };

    document.getElementById('timingCheck').innerHTML = `<pre>${results.join('\n')}</pre>`;
}

// Step 4: Manual Click Simulation
window.simulateClicks = function() {
    console.log("🖱️ Step 4: Simulating manual clicks...");
    const results = [];
    
    targetButtons.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            try {
                // Capture console logs during click
                const originalLog = console.log;
                let clickLogs = [];
                console.log = (...args) => {
                    clickLogs.push(args.join(' '));
                    originalLog.apply(console, args);
                };
                
                // Try multiple click methods
                results.push(`🖱️ ${id}:`);
                
                // Method 1: Direct click()
                try {
                    element.click();
                    results.push(`   - element.click(): ✅`);
                } catch (e) {
                    results.push(`   - element.click(): ❌ ${e.message}`);
                }
                
                // Method 2: dispatchEvent
                try {
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    element.dispatchEvent(clickEvent);
                    results.push(`   - dispatchEvent: ✅`);
                } catch (e) {
                    results.push(`   - dispatchEvent: ❌ ${e.message}`);
                }
                
                // Restore console.log
                console.log = originalLog;
                
                debugResults.clickTest[id] = {
                    success: true,
                    logs: clickLogs
                };
                
                results.push(`   - Console logs captured: ${clickLogs.length > 0 ? clickLogs.join(', ') : 'None'}`);
                
            } catch (error) {
                debugResults.clickTest[id] = {
                    success: false,
                    error: error.message
                };
                results.push(`🖱️ ${id}:`);
                results.push(`   - Click failed: ❌ ${error.message}`);
            }
        } else {
            results.push(`🖱️ ${id}: Element not found`);
        }
        results.push('');
    });

    document.getElementById('clickTest').innerHTML = `<pre>${results.join('\n')}</pre>`;
};

// Step 5: DOM Mutation Test
window.testMutationObserver = function() {
    console.log("🧬 Step 5: Testing DOM mutation...");
    const results = [];
    
    // Create a test button
    const testBtn = document.createElement('button');
    testBtn.id = 'dynamicTestBtn';
    testBtn.textContent = 'Dynamic Test Button';
    testBtn.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        background: #444;
        color: #fff;
        border: 1px solid #666;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
    `;
    
    // Add click handler to test button
    testBtn.onclick = () => {
        console.log("✅ Dynamic test button clicked!");
        alert("Dynamic test button works!");
    };
    
    // Add it to the DOM
    document.body.appendChild(testBtn);
    
    results.push('🧪 Dynamic button test:');
    results.push('   - Button created and added to DOM: ✅');
    results.push('   - Button should be visible in top-right corner');
    results.push('   - Checking MutationObserver response...');
    
    // Wait a moment for MutationObserver to potentially trigger
    setTimeout(() => {
        const dynamicElement = document.getElementById('dynamicTestBtn');
        if (dynamicElement) {
            const bound = dynamicElement.dataset.bound === "true";
            results.push(`   - MutationObserver binding: ${bound ? '✅' : '❌'}`);
            
            // Test click on dynamic button
            try {
                dynamicElement.click();
                results.push(`   - Click test: ✅`);
            } catch (error) {
                results.push(`   - Click test: ❌ ${error.message}`);
            }
            
            // Keep the button for manual testing
            results.push('   - Button kept for manual testing (top-right corner)');
            results.push('   - Click it manually to verify functionality');
        } else {
            results.push('❌ Failed to create dynamic button');
        }
        
        debugResults.mutationTest = { tested: true, results: results };
        document.getElementById('mutationTest').innerHTML = `<pre>${results.join('\n')}</pre>`;
    }, 1000);
    
    results.push('⏳ Please wait 1 second for MutationObserver test results...');
    document.getElementById('mutationTest').innerHTML = `<pre>${results.join('\n')}</pre>`;
};

// Step 6: CSS & Layout Validation
function checkCSSLayout() {
    console.log("🎨 Step 6: Checking CSS and layout...");
    const results = [];
    
    targetButtons.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const styles = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            
            const issues = [];
            
            // Check for common CSS issues
            if (styles.pointerEvents === 'none') issues.push('pointer-events: none');
            if (styles.display === 'none') issues.push('display: none');
            if (styles.visibility === 'hidden') issues.push('visibility: hidden');
            if (parseFloat(styles.opacity) === 0) issues.push('opacity: 0');
            if (rect.width === 0 || rect.height === 0) issues.push('zero dimensions');
            if (styles.zIndex && parseInt(styles.zIndex) < 0) issues.push('negative z-index');
            
            // Check if element is covered by other elements
            const elementAtPoint = document.elementFromPoint(rect.left + rect.width/2, rect.top + rect.height/2);
            const isCovered = elementAtPoint && elementAtPoint !== element && !element.contains(elementAtPoint);
            if (isCovered) issues.push('covered by other element');
            
            debugResults.cssCheck[id] = {
                issues: issues,
                styles: {
                    display: styles.display,
                    visibility: styles.visibility,
                    pointerEvents: styles.pointerEvents,
                    opacity: styles.opacity,
                    zIndex: styles.zIndex
                },
                dimensions: {
                    width: rect.width,
                    height: rect.height
                },
                position: {
                    left: rect.left,
                    top: rect.top
                }
            };
            
            results.push(`🎨 ${id}:`);
            results.push(`   - Issues: ${issues.length > 0 ? '❌ ' + issues.join(', ') : '✅ None'}`);
            results.push(`   - Dimensions: ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}`);
            results.push(`   - Position: (${rect.left.toFixed(1)}, ${rect.top.toFixed(1)})`);
            results.push(`   - Visible in viewport: ${rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth ? '✅' : '❌'}`);
        } else {
            results.push(`🎨 ${id}: Element not found`);
        }
        results.push('');
    });

    document.getElementById('cssCheck').innerHTML = `<pre>${results.join('\n')}</pre>`;
}

// Generate Debug Summary
function generateSummary() {
    const results = [];
    let totalIssues = 0;
    const criticalIssues = [];
    const recommendations = [];
    
    results.push('📊 COMPREHENSIVE DEBUG SUMMARY');
    results.push('=' .repeat(50));
    results.push('');
    
    // Element existence summary
    const missingElements = targetButtons.filter(id => !debugResults.elementCheck[id]);
    if (missingElements.length > 0) {
        results.push(`❌ Missing Elements (${missingElements.length}): ${missingElements.join(', ')}`);
        criticalIssues.push('Missing DOM elements');
        recommendations.push('Ensure all button elements exist in HTML');
        totalIssues += missingElements.length;
    } else {
        results.push('✅ All target elements exist');
    }
    
    // Binding summary
    const unboundElements = targetButtons.filter(id => {
        const binding = debugResults.bindingCheck[id];
        return binding && !binding.bound && !binding.hasOnClick;
    });
    if (unboundElements.length > 0) {
        results.push(`❌ Unbound Elements (${unboundElements.length}): ${unboundElements.join(', ')}`);
        criticalIssues.push('Missing event handlers');
        recommendations.push('Fix event handler binding for unbound elements');
        totalIssues += unboundElements.length;
    } else {
        results.push('✅ All elements have event handlers');
    }
    
    // CSS issues summary
    const elementsWithCSSIssues = Object.keys(debugResults.cssCheck).filter(id => 
        debugResults.cssCheck[id].issues && debugResults.cssCheck[id].issues.length > 0
    );
    if (elementsWithCSSIssues.length > 0) {
        results.push(`❌ CSS Issues (${elementsWithCSSIssues.length}): ${elementsWithCSSIssues.join(', ')}`);
        criticalIssues.push('CSS layout problems');
        recommendations.push('Resolve CSS layout issues preventing interaction');
        totalIssues += elementsWithCSSIssues.length;
    } else {
        results.push('✅ No CSS layout issues detected');
    }
    
    // Script timing issues
    if (debugResults.timingCheck.domContentLoadedCount > 1) {
        results.push(`⚠️ Multiple DOMContentLoaded listeners detected (${debugResults.timingCheck.domContentLoadedCount})`);
        criticalIssues.push('Script conflicts');
        recommendations.push('Consolidate multiple DOMContentLoaded event listeners');
        totalIssues++;
    }
    
    results.push('');
    results.push(`🎯 TOTAL ISSUES FOUND: ${totalIssues}`);
    results.push(`🚨 CRITICAL ISSUES: ${criticalIssues.length > 0 ? criticalIssues.join(', ') : 'None'}`);
    
    if (totalIssues === 0) {
        results.push('');
        results.push('🎉 NO ISSUES DETECTED!');
        results.push('If buttons still don\'t work, the issue may be:');
        results.push('- JavaScript errors preventing execution (check console)');
        results.push('- Event propagation being stopped by other handlers');
        results.push('- Browser security restrictions');
        results.push('- Network/server connectivity issues');
        results.push('- Race conditions in script execution');
    } else {
        results.push('');
        results.push('🔧 RECOMMENDED FIXES:');
        recommendations.forEach((rec, index) => {
            results.push(`${index + 1}. ${rec}`);
        });
        
        results.push('');
        results.push('🛠️ IMMEDIATE ACTIONS:');
        if (missingElements.length > 0) {
            results.push('- Check HTML structure for missing button elements');
        }
        if (unboundElements.length > 0) {
            results.push('- Verify JavaScript event binding code is executing');
            results.push('- Check for JavaScript errors in console');
        }
        if (elementsWithCSSIssues.length > 0) {
            results.push('- Review CSS styles that may prevent interaction');
        }
        if (debugResults.timingCheck.domContentLoadedCount > 1) {
            results.push('- Consolidate multiple script blocks into one');
            results.push('- Remove duplicate event listeners');
        }
    }

    document.getElementById('debugSummary').innerHTML = `<pre>${results.join('\n')}</pre>`;
}

// Run all debug steps
function runAllDebugSteps() {
    console.log("🚀 Starting comprehensive button debug sweep...");
    
    checkElementExistence();
    checkEventBindings();
    checkScriptTiming();
    simulateClicks();
    testMutationObserver();
    checkCSSLayout();
    
    // Generate summary after a short delay to allow async operations
    setTimeout(generateSummary, 1500);
}

// Run the debug sweep
runAllDebugSteps();

console.log("🔍 Comprehensive Button Debug Tool Injected and Running");
console.log("Check the overlay for detailed results");