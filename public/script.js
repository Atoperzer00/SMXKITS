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
  
  // Load modules and content
  loadModules();
  loadCourseContent();
  loadPowerPointLessons();
  
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
}

// Screen-specific navigation functions
function goToKITS() {
  showScreen('screen-dashboard');
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
  // This would normally fetch from a server
  modules = [
    {
      id: 'module1',
      title: 'Module 1: Basic Typing',
      description: 'Learn the basics of touch typing',
      practices: [
        { id: 'practice1', title: 'Practice 1: Home Row Keys', text: 'asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl; asdf jkl;' },
        { id: 'practice2', title: 'Practice 2: Common Words', text: 'the and for that this with have from what been work were when where will would should could' }
      ]
    },
    {
      id: 'module2',
      title: 'Module 2: Numbers and Symbols',
      description: 'Practice typing numbers and special characters',
      practices: [
        { id: 'practice1', title: 'Practice 1: Numbers', text: '1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0' },
        { id: 'practice2', title: 'Practice 2: Symbols', text: '! @ # $ % ^ & * ( ) _ + ! @ # $ % ^ & * ( ) _ + ! @ # $ % ^ & * ( ) _ +' }
      ]
    },
    {
      id: 'module3',
      title: 'Module 3: Military Terminology',
      description: 'Practice typing common military terms and acronyms',
      practices: [
        { id: 'practice1', title: 'Practice 1: Military Ranks', text: 'Private Corporal Sergeant Lieutenant Captain Major Colonel General Admiral Commander' },
        { id: 'practice2', title: 'Practice 2: Military Acronyms', text: 'USAF USA USN USMC USCG DOD NATO CENTCOM SOCOM STRATCOM NORTHCOM' }
      ]
    }
  ];
  
  // Render modules list
  const moduleListEl = document.getElementById('module-list');
  if (moduleListEl) {
    moduleListEl.innerHTML = modules.map(module => `
      <div class="module-item" onclick="showPractices('${module.id}')">
        <h3>${module.title}</h3>
        <p>${module.description}</p>
      </div>
    `).join('');
  }
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

function retryTest() {
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
  
  // In a real app, this would validate with a server
  // For demo purposes, accept any input
  showScreen('screen-home');
  
  // Update sidebar info
  document.getElementById('info-student-sidebar').textContent = studentCode;
  document.getElementById('info-class-sidebar').textContent = classCode;
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