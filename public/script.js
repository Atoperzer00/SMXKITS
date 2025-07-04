// Global variables
let activeScreen = 'screen-home';
let modules = [];
let currentModule = '';
let currentPractice = '';
let typingText = '';
let startTime;
let timer;
let accuracy;
let wpm;
let courseContentItems = [];
let powerPointItems = [];
let currentSlideDoc = null;
let currentSlideNumber = 1;
let totalSlides = 0;

// Initialize sidebar toggle
document.addEventListener('DOMContentLoaded', function() {
  // Check if sidebar elements exist
  const sidebarTab = document.getElementById('sidebar-tab');
  const closeTab = document.getElementById('close-tab');
  const sidebar = document.getElementById('sidebar');
  
  if (sidebarTab && closeTab && sidebar) {
    sidebarTab.addEventListener('click', function() {
      sidebar.classList.add('open');
    });
    
    closeTab.addEventListener('click', function() {
      sidebar.classList.remove('open');
    });
  }
  
  // Initialize FMV overlay close button
  const closeFmvBtn = document.getElementById('closeFmvOverlay');
  const fmvOverlay = document.getElementById('fmvOverlay');
  
  if (closeFmvBtn && fmvOverlay) {
    closeFmvBtn.addEventListener('click', function() {
      fmvOverlay.style.display = 'none';
    });
  }
  
  // Initialize the clock for FMV overlay
  startClock();
  
  // Load modules and content - with error handling
  try {
    console.log('Loading modules...');
    loadModules();
    console.log('Loading course content...');
    loadCourseContent();
    console.log('Loading PowerPoint lessons...');
    loadPowerPointLessons();
  } catch (error) {
    console.error('Error during content loading:', error);
  }
  
  // Handle hash-based navigation
  console.log('Handling hash change...');
  handleHashChange();
  
  // Set up PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js';
});

// Navigation functions
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  document.getElementById(screenId).classList.add('active');
  activeScreen = screenId;
}

function goToScreen(screenId) {
  showScreen(screenId);
  // Update URL hash without triggering a new hashchange event
  history.pushState(null, null, `#${screenId}`);
}

// Handle hash-based navigation
function handleHashChange() {
  // Check if there's a hash in the URL
  if (window.location.hash) {
    const screenId = window.location.hash.substring(1); // Remove the # character
    if (document.getElementById(screenId)) {
      showScreen(screenId);
      // Store the active section
      localStorage.setItem('activeSection', screenId);
      
      // Check if we need to force module reload (when coming from dashboard)
      if (screenId === 'screen-dashboard' && localStorage.getItem('forceModuleReload') === 'true') {
        console.log('Force module reload flag detected, reloading modules');
        setTimeout(() => {
          loadModules();
          localStorage.removeItem('forceModuleReload'); // Clear the flag
        }, 800);
      }
    }
  } else {
    // Check if we have a stored section
    const storedSection = localStorage.getItem('activeSection');
    if (storedSection && document.getElementById(storedSection)) {
      showScreen(storedSection);
      
      // Same check for forced module reload
      if (storedSection === 'screen-dashboard' && localStorage.getItem('forceModuleReload') === 'true') {
        console.log('Force module reload flag detected, reloading modules');
        setTimeout(() => {
          loadModules();
          localStorage.removeItem('forceModuleReload'); // Clear the flag
        }, 800);
      }
    }
  }
}

// Listen for hash changes
window.addEventListener('hashchange', handleHashChange);

// Screen-specific navigation functions
function goToKITS() {
  console.log('Going to KITS screen-dashboard');
  showScreen('screen-dashboard');
  
  // Force reload modules - for debugging
  setTimeout(() => {
    console.log('Forcing module reload...');
    reloadModules();
  }, 300);
}

// Debug function to reload modules
function reloadModules() {
  const moduleListEl = document.getElementById('module-list');
  console.log('Module list element exists:', !!moduleListEl);
  
  if (!moduleListEl) {
    console.error('Module list element not found!');
    console.log('Available elements with ID containing "module":');
    document.querySelectorAll('[id*="module"]').forEach(el => {
      console.log('- Element ID:', el.id);
    });
    return;
  }
  
  // Try rendering modules again
  moduleListEl.innerHTML = modules.map(module => `
    <div class="module-item" onclick="showPractices('${module.id}')">
      <h3>${module.title}</h3>
      <p>${module.description}</p>
    </div>
  `).join('');
  console.log('Modules reloaded');
}

function goToCourseContent() {
  showScreen('screen-course-content');
}

function goToISRTraining() {
  showScreen('screen-isr-training');
}

function goToPEDTraining() {
  showScreen('screen-ped-training');
}

// Clock function for FMV overlay
function startClock() {
  setInterval(function() {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const clockElement = document.getElementById('clock-time');
    if (clockElement) {
      clockElement.textContent = timeStr;
    }
  }, 1000);
}

// Module loading and navigation
function loadModules() {
  // Check if we have custom typing tests in localStorage
  let customTexts = [];
  try {
    customTexts = JSON.parse(localStorage.getItem('smx_typing_tests') || '[]');
  } catch (e) {
    console.error('Error loading custom typing tests:', e);
  }
  
  // This would normally fetch from a server
  modules = [
    {
      id: 'module1',
      title: 'Module 1: Basic Typing',
      description: 'Learn the basics of touch typing',
      practices: [
        { id: 'practice1', title: 'Practice 1: Home Row Keys', text: (customTexts?.[0]?.[0] !== undefined && customTexts[0][0] !== null) ? customTexts[0][0] : 'asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl;' },
        { id: 'practice2', title: 'Practice 2: Common Words', text: (customTexts?.[0]?.[1] !== undefined && customTexts[0][1] !== null) ? customTexts[0][1] : 'the and for that this with have from what been work were when where will would should could' }
      ]
    },
    {
      id: 'module2',
      title: 'Module 2: Numbers and Symbols',
      description: 'Practice typing numbers and special characters',
      practices: [
        { id: 'practice1', title: 'Practice 1: Numbers', text: (customTexts?.[1]?.[0] !== undefined && customTexts[1][0] !== null) ? customTexts[1][0] : '1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0' },
        { id: 'practice2', title: 'Practice 2: Symbols', text: (customTexts?.[1]?.[1] !== undefined && customTexts[1][1] !== null) ? customTexts[1][1] : '! @ # $ % ^ & * ( ) _ + ! @ # $ % ^ & * ( ) _ + ! @ # $ % ^ & * ( ) _ +' }
      ]
    },
    {
      id: 'module3',
      title: 'Module 3: Military Terminology',
      description: 'Practice typing common military terms and acronyms',
      practices: [
        { id: 'practice1', title: 'Practice 1: Military Ranks', text: (customTexts?.[2]?.[0] !== undefined && customTexts[2][0] !== null) ? customTexts[2][0] : 'Private Corporal Sergeant Lieutenant Captain Major Colonel General Admiral Commander' },
        { id: 'practice2', title: 'Practice 2: Military Acronyms', text: (customTexts?.[2]?.[1] !== undefined && customTexts[2][1] !== null) ? customTexts[2][1] : 'USAF USA USN USMC USCG DOD NATO CENTCOM SOCOM STRATCOM NORTHCOM' }
      ]
    },
    // POL Typing Modules
    {
      id: 'pol-module1',
      title: 'POL Module 1: Basic Descriptors',
      description: 'Practice typing basic POL descriptors',
      practices: [
        { id: 'practice1', title: 'Practice 1: Personnel Counting', text: (customTexts?.[3]?.[0] !== undefined && customTexts[3][0] !== null) ? customTexts[3][0] : 'One adult male, One adult female, one child. Two adult males, two adult females, two children, One adult male, One adult female, one child. Two adult males, two adult females, two children.' },
        { id: 'practice2', title: 'Practice 2: Basic Description', text: (customTexts?.[3]?.[1] !== undefined && customTexts[3][1] !== null) ? customTexts[3][1] : 'One adult male in dark traditional wear. One adult male in light traditional wear. One adult male in dark traditional wear. One adult male in light traditional wear.' }
      ]
    },
    {
      id: 'pol-module2',
      title: 'POL Module 2: SITREP Format',
      description: 'Practice typing in SITREP format',
      practices: [
        { id: 'practice1', title: 'Practice 1: Basic SITREP', text: (customTexts?.[4]?.[0] !== undefined && customTexts[4][0] !== null) ? customTexts[4][0] : 'SITREP: At 0630Z, one adult male in black traditional wear departed from the E gate on a red motorcycle and rode S out of FOV 0635Z. No nefarious or other EEI-related activity was observed. SLANT 1/0/0' },
        { id: 'practice2', title: 'Practice 2: Complex SITREP', text: (customTexts?.[4]?.[1] !== undefined && customTexts[4][1] !== null) ? customTexts[4][1] : 'SITREP: At 0745Z, a white sedan with at least one adult male internal entered the compound through the W gate and parked on the E side of the compound. No nefarious or other EEI-related activity was observed. SLANT 1/0/0' }
      ]
    }
  ];
  
  // Render modules list - delay to ensure DOM is ready
  setTimeout(() => {
    const moduleListEl = document.getElementById('module-list');
    console.log('Rendering modules, element exists:', !!moduleListEl);
    
    if (moduleListEl) {
      // Get user progress to show completion status
      let userProgress = {};
      try {
        userProgress = JSON.parse(localStorage.getItem('smx_user_progress') || '{}');
      } catch (e) {
        console.error('Error parsing user progress:', e);
      }

      // Create enhanced module list with completion indicators
      moduleListEl.innerHTML = '';
      
      modules.forEach((module, moduleIdx) => {
        // Create module container with accordion
        const moduleGroup = document.createElement('div');
        moduleGroup.className = 'module-group mb-4';
        
        // Check if all practices in this module are completed
        let allCompleted = module.practices.every((p, i) => 
          userProgress?.modules?.[moduleIdx]?.practices?.[i]?.completed);
        
        // Create the module header button
        const moduleButton = document.createElement('button');
        moduleButton.className = `w-full text-left flex items-center justify-between p-4 mb-2 rounded-xl ${
          allCompleted ? 'bg-green-500 text-white shadow-md' : 'bg-zinc-800/70'
        } hover:bg-blue-600/50 hover:shadow-blue-500/60 transition-all duration-200`;
        moduleButton.setAttribute('data-module', moduleIdx);
        moduleButton.innerHTML = `
          <div>
            <h3 class="text-lg font-semibold">${module.title}</h3>
            <p class="text-sm text-zinc-300">${module.description}</p>
          </div>
          <span class="text-2xl">▾</span>
        `;
        
        // Create the practice list container
        const practiceList = document.createElement('div');
        practiceList.className = 'ml-4 space-y-2 mt-2 hidden';
        
        // Add practices
        module.practices.forEach((practice, practiceIdx) => {
          const practiceCompleted = userProgress?.modules?.[moduleIdx]?.practices?.[practiceIdx]?.completed;
          
          const practiceButton = document.createElement('button');
          practiceButton.className = `w-full text-left px-4 py-3 rounded-xl ${
            practiceCompleted ? 'text-green-400 font-bold' : 'text-zinc-200'
          } hover:bg-blue-800/40 transition-all duration-200 flex justify-between items-center`;
          practiceButton.setAttribute('data-practice', practiceIdx);
          
          practiceButton.innerHTML = `
            <span>${practice.title}</span>
            ${practiceCompleted ? '<span class="checkmark">✓</span>' : ''}
          `;
          
          practiceButton.onclick = () => {
            currentModule = module.id;
            startPractice(practice.id);
          };
          
          practiceList.appendChild(practiceButton);
        });
        
        // Toggle practice list visibility on module button click
        moduleButton.onclick = () => {
          const isHidden = practiceList.classList.contains('hidden');
          practiceList.classList.toggle('hidden', !isHidden);
          moduleButton.querySelector('span').textContent = isHidden ? '▾' : '▴';
        };
        
        moduleGroup.appendChild(moduleButton);
        moduleGroup.appendChild(practiceList);
        moduleListEl.appendChild(moduleGroup);
      });
    } else {
      console.error('Module list element not found in the DOM');
    }
  }, 500); // Small delay to ensure the DOM is ready
}

function showPractices(moduleId) {
  currentModule = moduleId;
  const module = modules.find(m => m.id === moduleId);
  if (!module) return;
  
  document.getElementById('practice-header').textContent = module.title + ': Practice List';
  
  const practiceListEl = document.getElementById('practice-list');
  practiceListEl.innerHTML = module.practices.map(practice => `
    <div class="practice-item" onclick="startPractice('${practice.id}')">
      <h3>${practice.title}</h3>
    </div>
  `).join('');
  
  showScreen('screen-practice');
}

function startPractice(practiceId) {
  currentPractice = practiceId;
  const module = modules.find(m => m.id === currentModule);
  const practice = module.practices.find(p => p.id === practiceId);
  
  typingText = practice.text;
  displayText(typingText);
  
  // Reset stats
  document.getElementById('accuracy').textContent = 'Accuracy: 100%';
  document.getElementById('wpm').textContent = 'WPM: 0';
  document.getElementById('timer').textContent = 'Time: 0s';
  document.getElementById('progress-fill').style.width = '0%';
  
  // Reset and focus input
  const typingInput = document.getElementById('typing-input');
  typingInput.value = '';
  
  showScreen('screen-typing');
  
  // Start timer after a short delay to allow for UI to update
  setTimeout(() => {
    startTime = new Date();
    if (timer) clearInterval(timer);
    timer = setInterval(updateTimer, 1000);
    typingInput.focus();
  }, 300);
}

function displayText(text) {
  const letterContainer = document.getElementById('letter-container');
  letterContainer.innerHTML = text.split('').map(char => 
    `<span class="letter">${char === ' ' ? '&nbsp;' : char}</span>`
  ).join('');
}

function handleTyping() {
  const input = document.getElementById('typing-input').value;
  const letters = document.querySelectorAll('.letter');
  
  let correctCount = 0;
  
  for (let i = 0; i < input.length && i < letters.length; i++) {
    if (input[i] === typingText[i] || (input[i] === ' ' && typingText[i] === ' ')) {
      letters[i].classList.add('correct');
      letters[i].classList.remove('incorrect');
      correctCount++;
    } else {
      letters[i].classList.add('incorrect');
      letters[i].classList.remove('correct');
    }
  }
  
  // Reset the classes for characters not yet typed
  for (let i = input.length; i < letters.length; i++) {
    letters[i].classList.remove('correct', 'incorrect');
  }
  
  // Calculate accuracy
  accuracy = input.length > 0 ? Math.round((correctCount / input.length) * 100) : 100;
  document.getElementById('accuracy').textContent = `Accuracy: ${accuracy}%`;
  
  // Calculate WPM (assuming average word is 5 characters)
  const elapsedMinutes = (new Date() - startTime) / 60000;
  const words = input.length / 5;
  wpm = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;
  document.getElementById('wpm').textContent = `WPM: ${wpm}`;
  
  // Update progress bar
  const progress = (input.length / typingText.length) * 100;
  document.getElementById('progress-fill').style.width = `${progress}%`;
  
  // Check if practice is complete
  if (input.length >= typingText.length) {
    clearInterval(timer);
    showResults();
  }
}

function updateTimer() {
  const elapsedSeconds = Math.floor((new Date() - startTime) / 1000);
  document.getElementById('timer').textContent = `Time: ${elapsedSeconds}s`;
}

function showResults() {
  const elapsedTime = (new Date() - startTime) / 1000;
  const module = modules.find(m => m.id === currentModule);
  const practice = module.practices.find(p => p.id === currentPractice);
  
  // Find current module index and practice index
  const moduleIndex = modules.findIndex(m => m.id === currentModule);
  const practiceIndex = module.practices.findIndex(p => p.id === currentPractice);
  
  // Determine if completed successfully
  const isCompleted = wpm > 25 && accuracy > 85;
  
  // Check if we're on the standalone keyboard-training.html page with the enhanced overlay
  if (document.getElementById('resultsModal')) {
    // Use the enhanced results overlay
    showResultsOverlay(
      moduleIndex,
      practiceIndex,
      module.title,
      practice.title,
      elapsedTime.toFixed(1),
      accuracy,
      wpm,
      isCompleted
    );
    
    // Also update the left bar colors
    if (typeof updateLeftBarColors === 'function') {
      updateLeftBarColors();
    }
  } else {
    // Fall back to the original results screen
    document.getElementById('result-module').textContent = module.title;
    document.getElementById('result-practice').textContent = practice.title;
    document.getElementById('result-time').textContent = `${elapsedTime.toFixed(1)} seconds`;
    document.getElementById('result-accuracy').textContent = `${accuracy}%`;
    document.getElementById('result-wpm').textContent = wpm;
    
    // Determine star rating
    const starElement = document.getElementById('result-star');
    if (wpm > 40 && accuracy > 95) {
      starElement.textContent = '★★★';
      starElement.classList.add('gold-star');
    } else if (wpm > 30 && accuracy > 90) {
      starElement.textContent = '★★';
      starElement.classList.add('silver-star');
    } else {
      starElement.textContent = '★';
      starElement.classList.add('bronze-star');
    }
    
    showScreen('screen-results');
  }
  
  // Record the results for dashboard tracking
  if (typeof window.recordTypingResult === 'function') {
    window.recordTypingResult(wpm, accuracy);
    console.log('Recorded typing result:', wpm, accuracy);
  } else {
    console.warn('recordTypingResult function not available');
  }
}

// For reloading the current typing test (used by the overlay)
function reloadCurrentTypingTest() {
  startPractice(currentPractice);
}

function retryTest() {
  if (document.getElementById('resultsModal') && 
      !document.getElementById('resultsModal').classList.contains('hidden')) {
    // Hide the modal first if it's showing
    hideResultsOverlay();
  }
  startPractice(currentPractice);
}

function goBackToPractices() {
  if (timer) clearInterval(timer);
  showPractices(currentModule);
}

// Course Content functions
function loadCourseContent() {
  // This would normally fetch from a server
  courseContentItems = [
    { id: 'course1', title: 'Introduction to Intelligence, Surveillance, and Reconnaissance (ISR)', type: 'practices' },
    { id: 'course2', title: 'Processing, Exploitation, and Dissemination (PED) Fundamentals', type: 'practices' },
    { id: 'powerpoints', title: 'Lesson PowerPoints', type: 'powerpoints' }
  ];
  
  // Render course content list
  const courseContentListEl = document.getElementById('course-content-list');
  if (courseContentListEl) {
    courseContentListEl.innerHTML = courseContentItems.map(item => `
      <div class="module-item" onclick="showCourseContent('${item.id}', '${item.type}')">
        <h3>${item.title}</h3>
      </div>
    `).join('');
  }
}

function showCourseContent(itemId, type) {
  if (type === 'powerpoints') {
    showScreen('screen-powerpoint-lessons');
  } else {
    // Handle practice-based course content
    const item = courseContentItems.find(i => i.id === itemId);
    document.getElementById('course-practice-header').textContent = item.title;
    
    // Mock practice list for course content
    const practiceListEl = document.getElementById('course-practice-list');
    practiceListEl.innerHTML = `
      <div class="practice-item">
        <h3>Lesson 1: Introduction</h3>
      </div>
      <div class="practice-item">
        <h3>Lesson 2: Basic Concepts</h3>
      </div>
      <div class="practice-item">
        <h3>Lesson 3: Advanced Techniques</h3>
      </div>
    `;
    
    showScreen('screen-course-practice');
  }
}

// PowerPoint lesson functions
function loadPowerPointLessons() {
  // This would normally fetch from a server
  powerPointItems = [
    { id: 'ppt1', title: 'Lesson 1: Introduction to mIRC Setup', file: 'mIRC_SETUP_AND_OVERVIEW.pdf' },
    { id: 'ppt2', title: 'Lesson 2: Basic PED Workflow', file: 'PED_WORKFLOW.pdf' },
    { id: 'ppt3', title: 'Lesson 3: Advanced ISR Techniques', file: 'ISR_TECHNIQUES.pdf' }
  ];
  
  // Render powerpoint list
  const powerPointListEl = document.getElementById('powerpoint-list');
  if (powerPointListEl) {
    powerPointListEl.innerHTML = powerPointItems.map(item => `
      <div class="powerpoint-item" onclick="showPowerPointPDF('${item.file}', '${item.title}')">
        ${item.title}
      </div>
    `).join('');
  }
}

async function showPowerPointPDF(pdfFile, title) {
  showScreen('screen-slide-viewer');
  document.getElementById('slide-title').textContent = title;
  document.getElementById('slide-loading').style.display = 'block';
  
  try {
    // Clear any previous PDF
    if (currentSlideDoc) {
      currentSlideDoc = null;
    }
    
    // Load the PDF
    currentSlideDoc = await pdfjsLib.getDocument(`/assets/powerpoints/${pdfFile}`).promise;
    totalSlides = currentSlideDoc.numPages;
    currentSlideNumber = 1;
    
    document.getElementById('slide-counter').textContent = `Slide ${currentSlideNumber} of ${totalSlides}`;
    
    // Display the first slide
    renderSlide(currentSlideNumber);
    
    // Set up navigation arrows
    document.getElementById('prev').onclick = prevSlide;
    document.getElementById('next').onclick = nextSlide;
    
  } catch (error) {
    console.error('Error loading PDF:', error);
    document.getElementById('slide-loading').textContent = 'Error loading PDF. Please try again.';
  }
}

async function renderSlide(slideNumber) {
  if (!currentSlideDoc) return;
  
  try {
    const canvas = document.getElementById('slide');
    const ctx = canvas.getContext('2d');
    const page = await currentSlideDoc.getPage(slideNumber);
    
    // Scale the page to fit the canvas
    const viewport = page.getViewport({ scale: 1.5 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Render the page
    await page.render({
      canvasContext: ctx,
      viewport: viewport
    }).promise;
    
    document.getElementById('slide-loading').style.display = 'none';
    document.getElementById('slide-counter').textContent = `Slide ${currentSlideNumber} of ${totalSlides}`;
    
    // Display notes if available
    // This would typically come from a separate source
    document.getElementById('notes-content').textContent = `Notes for slide ${slideNumber}: This is placeholder text for the instructor notes that would accompany this slide.`;
    
  } catch (error) {
    console.error('Error rendering slide:', error);
    document.getElementById('slide-loading').textContent = 'Error rendering slide. Please try again.';
  }
}

function prevSlide() {
  if (currentSlideNumber > 1) {
    currentSlideNumber--;
    renderSlide(currentSlideNumber);
  }
}

function nextSlide() {
  if (currentSlideNumber < totalSlides) {
    currentSlideNumber++;
    renderSlide(currentSlideNumber);
  }
}

// Authentication functions
function handleLogin() {
  const classCode = document.getElementById('classCode').value;
  const studentCode = document.getElementById('studentCode').value;
  
  if (!classCode || !studentCode) {
    document.getElementById('login-error').textContent = 'Please enter both Class Code and Student Code';
    return;
  }
}
  
  
// Ensure PDF directories exist
function ensurePDFDirectoriesExist() {
  // Create PowerPoints directory if it doesn't exist
  const dir = '/assets/powerpoints';
  // This would normally be handled server-side
}

// Additional handlers for links
document.addEventListener('DOMContentLoaded', function() {
  const contactLink = document.getElementById('contactLink');
  if (contactLink) {
    contactLink.addEventListener('click', function(e) {
      e.preventDefault();
      // In a real app, show contact form or modal
      alert('Contact: support@smxkits.com');
    });
  }
  
  const insideKitLink = document.getElementById('insideKitLink');
  if (insideKitLink) {
    insideKitLink.addEventListener('click', function(e) {
      e.preventDefault();
      // In a real app, show info modal
      alert('Inside the Kit: A comprehensive training platform for military intelligence specialists.');
    });
  }
}); 
