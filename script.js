// Default phrase used as fallback - will be replaced with actual phrases from file
const PHRASE = "Loading practice text...";

let currentModule = 1;
let currentPractice = 1;
let currentText = "";
let startTime = 0;
let timerInterval = null;
let currentSection = "kits"; // "kits" or "course-content"

let classCode = "";
let studentCode = "";
let lastWPM = 0;
let wpmHistory = [];

// Module names mapping
const moduleNames = {
  1: "Intro to POL Basics",
  2: "Routine Activity and Compound Life",
  3: "Vehicles, Movement, and Ingress/Egress",
  4: "Suspicious Indicators and Assessment Language",
  5: "Full Narrative Product Construction"
};

let moduleData = {
  1: { completed: 0, practices: {} },
  2: { completed: 0, practices: {} },
  3: { completed: 0, practices: {} },
  4: { completed: 0, practices: {} },
  5: { completed: 0, practices: {} },
};

// Phrases loaded directly from phrases-new.txt content
let customPhrases = {
  "1-1": "One adult male, One adult female, one child. Two adult males, two adult females, two children, One adult male, One adult female, one child. Two adult males, two adult females, two children. One adult male, One adult female, one child. Two adult males, two adult females, two children. One adult male, One adult female, one child. Two adult males, two adult females, two children.",
  "1-2": "One adult male in dark traditional wear. One adult male in light traditional wear. One adult male in dark traditional wear. One adult male in light traditional wear. One adult male in dark traditional wear. One adult male in light traditional wear. One adult male in dark traditional wear. One adult male in light traditional wear. One adult male in dark traditional wear. One adult male in light traditional wear.",
  "1-3": "One adult male in light traditional wear and a red headdress. One adult male in western wear. One adult male in light traditional wear and a red headdress. One adult male in western wear. One adult male in light traditional wear and a red headdress. One adult male in western wear. One adult male in light traditional wear and a red headdress. One adult male in western wear. One adult male in light traditional wear and a red headdress. One adult male in western wear.",
  "1-4": "Two adult males; one in a blue jacket and brown pants, and one tan jacket and brown futah. Two adult males; one in a blue jacket and brown pants, and one tan jacket and brown futah. Two adult males; one in a blue jacket and brown pants, and one tan jacket and brown futah. Two adult males; one in a blue jacket and brown pants, and one tan jacket and brown futah.",
  "1-5": "One adult female in dark traditional wear. One adult female in dark traditional wear. One adult female in dark traditional wear. One adult female in dark traditional wear. One adult female in dark traditional wear. One adult female in dark traditional wear. One adult female in dark traditional wear. One adult female in dark traditional wear. One adult female in dark traditional wear. One adult female in dark traditional wear.",
  "1-6": "One adult male in a blue jacket and brown futah. One adult male in a blue jacket and brown futah. One adult male in a blue jacket and brown futah. One adult male in a blue jacket and brown futah. One adult male in a blue jacket and brown futah. One adult male in a blue jacket and brown futah. One adult male in a blue jacket and brown futah.",
  "1-7": "Two children played in the courtyard. Two children played in the courtyard. Two children played in the courtyard. Two children played in the courtyard. Two children played in the courtyard. Two children played in the courtyard. Two children played in the courtyard. Two children played in the courtyard. Two children played in the courtyard.",
  "1-8": "One adult male in western wear walked S through the courtyard. Further activity was masked due to foliage. One adult male in western wear walked S through the courtyard. Further activity was masked due to foliage. One adult male in western wear walked S through the courtyard. Further activity was masked due to foliage. One adult male in western wear walked S through the courtyard. Further activity was masked due to foliage. One adult male in western wear walked S through the courtyard. Further activity was masked due to foliage. One adult male in western wear walked S through the courtyard. Further activity was masked due to foliage.",
  "1-9": "One adult female in dark traditional wear and one child played on the SE side of the courtyard. One adult female in dark traditional wear and one child played on the SE side of the courtyard. One adult female in dark traditional wear and one child played on the SE side of the courtyard. One adult female in dark traditional wear and one child played on the SE side of the courtyard. One adult female in dark traditional wear and one child played on the SE side of the courtyard. One adult female in dark traditional wear and one child played on the SE side of the courtyard.",
  "1-10": "Three adult males; one in dark traditional wear, one in a blue jacket and tan pants, and one in a green top and blue jeans. Three adult males; one in dark traditional wear, one in a blue jacket and tan pants, and one in a green top and blue jeans. Three adult males; one in dark traditional wear, one in a blue jacket and tan pants, and one in a green top and blue jeans. Three adult males; one in dark traditional wear, one in a blue jacket and tan pants, and one in a green top and blue jeans. Three adult males; one in dark traditional wear, one in a blue jacket and tan pants, and one in a green top and blue jeans.",
  "1-11": "One adult female in dark traditional wear, one adult male in a tan jacket and blue jeans, and one adult male in light traditional wear and a red headdress. One adult female in dark traditional wear, one adult male in a tan jacket and blue jeans, and one adult male in light traditional wear and a red headdress. One adult female in dark traditional wear, one adult male in a tan jacket and blue jeans, and one adult male in light traditional wear and a red headdress. One adult female in dark traditional wear, one adult male in a tan jacket and blue jeans, and one adult male in light traditional wear and a red headdress.",
  "1-12": "One white SUV. One white SUV. One white SUV. One white SUV. One white SUV. One white SUV. One white SUV. One white SUV. One white SUV. One white SUV. One white SUV. One white SUV. One white SUV. One single cab truck. One single cab truck. One single cab truck. One single cab truck. One single cab truck. One single cab truck. One single cab truck. One single cab truck.",
  "1-13": "One adult male exited the front left side of the SUV. One adult male exited the front left side of the SUV. One adult male exited the front left side of the SUV. One adult male exited the front left side of the SUV. One adult male exited the front left side of the SUV. One adult male exited the front left side of the SUV. One adult male exited the front left side of the SUV.",
  "1-14": "Three SUVs, two white and one black, were parked on the E side of the business. Three SUVs, two white and one black, were parked on the E side of the business. Three SUVs, two white and one black, were parked on the E side of the business. Three SUVs, two white and one black, were parked on the E side of the business. Three SUVs, two white and one black, were parked on the E side of the business. Three SUVs, two white and one black, were parked on the E side of the business.",
  "1-15": "One single cab truck departed E on a dirt road with at least one adult male internal. One single cab truck departed E on a dirt road with at least one adult male internal. One single cab truck departed E on a dirt road with at least one adult male internal. One single cab truck departed E on a dirt road with at least one adult male internal. One single cab truck departed E on a dirt road with at least one adult male internal.",
  "1-16": "The adult male in black western wear exited the front left side of the black sedan, retrieved a large black bag from the rear right side, and entered the N side of the residence. The adult male in black western wear exited the front left side of the black sedan, retrieved a large black bag from the rear right side, and entered the N side of the residence.",
  "1-17": "One white SUV arrived from the NW FOV and parked on the S side of the business. One white SUV arrived from the NW FOV and parked on the S side of the business. One white SUV arrived from the NW FOV and parked on the S side of the business. One white SUV arrived from the NW FOV and parked on the S side of the business. One white SUV arrived from the NW FOV and parked on the S side of the business.",
  "1-18": "Two adult males in dark traditional wear, one with a red headdress, conversed at the S entrance of the business. Two adult males in dark traditional wear, one with a red headdress, conversed at the S entrance of the business. Two adult males in dark traditional wear, one with a red headdress, conversed at the S entrance of the business.",
  "1-19": "One adult female in traditional wear conducted chores, and one child played in the courtyard. One adult female in traditional wear conducted chores, and one child played in the courtyard. One adult female in traditional wear conducted chores, and one child played in the courtyard. One adult female in traditional wear conducted chores, and one child played in the courtyard.",
  "1-20": "One previously unobserved male arrived from the N FOV and conversed with the adult male in a yellow shirt and black pants through the front left window of the black sedan. One previously unobserved male arrived from the N FOV and conversed with the adult male in a yellow shirt and black pants through the front left window of the black sedan. One previously unobserved male arrived from the N FOV and conversed with the adult male in a yellow shirt and black pants through the front left window of the black sedan.",
  "2-1": "SITREP: At 0630Z, one adult male in black traditional wear departed from the E gate on a red motorcycle and rode S out of FOV 0635Z. No nefarious or other EEI-related activity was observed. SLANT 1/0/0",
  "2-2": "SITREP: At 0745Z, a white sedan with at least one adult male internal entered the compound through the W gate and parked on the E side of the compound. No nefarious or other EEI-related activity was observed. SLANT 1/0/0",
  "2-3": "SITREP: At 1100Z, two adult females in traditional wear exited the N side of a residence, walked W, and entered the N side of a of business. SLANT 0/2/0",
  "2-4": "SITREP: At 2030Z, one adult male was in a dark jacket and dark pants, smoked on the NW side of the business rooftop, and then entered a door on the E side of the rooftop. Further activity was obscured. SLANT 1/0/0",
  "2-5": "SITREP: At 1500Z, three children played on the S side of the courtyard. One adult female in traditional wear sat at on the S side of the courtyard and smoked. SLANT 0/1/2",
  "2-6": "SITREP: At 0430Z, one heat signature, assessed to be a campfire fire was observed. No nefarious or other EEI-related activity was observed. SLANT 0/0/0",
  "2-7": "SITREP: At 1810Z, one adult male in a red headdress and light traditional wear exited the S side of a business and opened the trunk of a white sedan parked outside the entrance. The adult male returned with a small brown bag in his left hand and reentered the S side of the business. SLANT 1/0/0",
  "2-8": "SITREP: At 0915Z, two adult males in western wear unloaded bags from the rear of a quad-cab pickup truck at the compounds W entrance. SLANT 2/0/0",
  "2-9": "SITREP: At 1330Z, four adult males; two in dark traditional wear, one in light traditional wear, and one in a brown futah and dark top conversed on the E side of the courtyard at a table. SLANT 4/0/0",
  "2-10": "SITREP: At 1900Z, one adult male ascended from the building, exited the S entrance, and paced along the rooftop. SLANT 1/0/0",
  "2-11": "The plus + and minus - signs are used for addition and subtraction.",
  "2-12": "The equals sign = is used to assign values or check equality.",
  "2-13": "The forward slash / and backslash \\ have different uses in computing.",
  "2-14": "The pipe symbol | is used to separate commands in many command-line interfaces.",
  "2-15": "The tilde ~ is often used to represent a home directory in Unix-like systems.",
  "2-16": "The exclamation mark ! is used to negate conditions in programming.",
  "2-17": "The question mark ? is often used in conditional expressions.",
  "2-18": "The colon : and semicolon ; serve different purposes in programming languages.",
  "2-19": "Quotation marks \"\" are used to define strings in many programming languages.",
  "2-20": "Great job completing the special characters module!",
  "3-1": "This is to show typing speed results.",
  "3-2": "Variables are used to store data values that can change during program execution.",
  "3-3": "Functions are blocks of code designed to perform a particular task.",
  "3-4": "Loops allow you to execute a block of code multiple times.",
  "3-5": "Conditional statements like if-else help programs make decisions.",
  "3-6": "Arrays are used to store multiple values in a single variable.",
  "3-7": "Objects are collections of properties, each with a key and value.",
  "3-8": "Classes are templates for creating objects with predefined properties and methods.",
  "3-9": "Inheritance allows a class to inherit properties and methods from another class.",
  "3-10": "Polymorphism allows objects to take on many forms depending on the context.",
  "3-11": "Encapsulation is the bundling of data and methods that operate on that data.",
  "3-12": "Abstraction is the concept of hiding complex implementation details.",
  "3-13": "Algorithms are step-by-step procedures for solving problems.",
  "3-14": "Data structures are specialized formats for organizing and storing data.",
  "3-15": "Recursion is when a function calls itself to solve a problem.",
  "3-16": "Debugging is the process of finding and fixing errors in code.",
  "3-17": "Version control systems like Git help track changes to code over time.",
  "3-18": "APIs (Application Programming Interfaces) allow different software to communicate.",
  "3-19": "Frameworks provide a foundation of code to build applications more efficiently.",
  "3-20": "Libraries contain pre-written code that developers can use in their programs.",
  "4-1": "Module 4 covers common programming language syntax.",
  "4-2": "print(\"Hello, World!\") is often the first program written in a new language.",
  "4-3": "for (int i = 0; i < 10; i++) { console.log(i); } is a common loop in JavaScript.",
  "4-4": "if (x > 0) { return true; } else { return false; } is a basic conditional statement.",
  "4-5": "function add(a, b) { return a + b; } defines a simple addition function.",
  "4-6": "class Person { constructor(name) { this.name = name; } } creates a class in JavaScript.",
  "4-7": "const numbers = [1, 2, 3, 4, 5]; creates an array of numbers.",
  "4-8": "let sum = 0; for (let num of numbers) { sum += num; } calculates the sum of an array.",
  "4-9": "try { riskyOperation(); } catch (error) { handleError(error); } handles exceptions.",
  "4-10": "import React from 'react'; is how you import libraries in JavaScript.",
  "4-11": "const double = (x) => x * 2; is an arrow function in JavaScript.",
  "4-12": "const { name, age } = person; uses destructuring to extract object properties.",
  "4-13": "const newArray = array.map(item => item * 2); transforms each item in an array.",
  "4-14": "const result = array.filter(item => item > 0); filters items in an array.",
  "4-15": "const total = array.reduce((sum, item) => sum + item, 0); reduces an array to a single value.",
  "4-16": "async function fetchData() { const response = await fetch(url); } handles asynchronous operations.",
  "4-17": "const promise = new Promise((resolve, reject) => { /* code */ }); creates a new Promise.",
  "4-18": "switch (day) { case 'Monday': /* code */; break; default: /* code */; } is a switch statement.",
  "4-19": "const regex = /^[A-Za-z0-9]+$/; is a regular expression for alphanumeric characters.",
  "4-20": "document.getElementById('demo').innerHTML = 'Hello'; manipulates HTML content.",
  "5-1": "Module 5 focuses on typing code snippets from different programming languages.",
  "5-2": "SELECT * FROM users WHERE age > 18 ORDER BY name; is a SQL query.",
  "5-3": "def fibonacci(n): if n <= 1: return n; return fibonacci(n-1) + fibonacci(n-2) is Python code.",
  "5-4": "public static void main(String[] args) { System.out.println(\"Hello, Java!\"); } is Java code.",
  "5-5": "#include <iostream> int main() { std::cout << \"Hello, C++!\" << std::endl; return 0; } is C++.",
  "5-6": "func main() { fmt.Println(\"Hello, Go!\") } is written in Go.",
  "5-7": "console.log(`Template literals can include ${variables}`); demonstrates template literals.",
  "5-8": "const person = { name: \"John\", age: 30, city: \"New York\" }; creates an object literal.",
  "5-9": "let [first, second, ...rest] = [1, 2, 3, 4, 5]; uses array destructuring with rest parameters.",
  "5-10": "const merged = { ...obj1, ...obj2 }; uses the spread operator to merge objects.",
  "5-11": "useEffect(() => { document.title = `You clicked ${count} times`; }, [count]); is React code.",
  "5-12": "@Component({ selector: 'app-root', templateUrl: './app.component.html' }) is Angular decorator.",
  "5-13": "<template><div v-for=\"item in items\" :key=\"item.id\">{{ item.text }}</div></template> is Vue.js.",
  "5-14": "const server = http.createServer((req, res) => { res.end('Hello Node!'); }); creates a Node.js server.",
  "5-15": "mongoose.connect('mongodb://localhost:27017/myapp', { useNewUrlParser: true }); connects to MongoDB.",
  "5-16": "docker run -d -p 80:80 --name webserver nginx is a Docker command.",
  "5-17": "git commit -m \"Initial commit\" && git push origin master performs Git operations.",
  "5-18": "terraform apply -auto-approve deploys infrastructure as code.",
  "5-19": "kubectl get pods --all-namespaces lists Kubernetes pods.",
  "5-20": "Congratulations on completing all typing modules! Keep practicing to maintain your skills."
};
let phrasesLoaded = true; // Phrases are now embedded, so always loaded

// Initialize everything when the DOM is fully loaded
window.onload = function() {
  console.log("Window loaded - ensuring login screen is active");
  
  // Make sure only the login screen is active initially
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });
  document.getElementById("screen-login").classList.add("active");
  
  // Set up event handlers
  document.getElementById("typing-input").addEventListener("input", handleTyping);
  
  // Add click handlers for buttons that use onclick in HTML
  document.querySelectorAll("button").forEach(button => {
    const onclickAttr = button.getAttribute("onclick");
    if (onclickAttr) {
      const functionName = onclickAttr.replace(/\(.*\)/, "");
      const params = onclickAttr.match(/\((.*)\)/);
      
      button.removeAttribute("onclick");
      button.addEventListener("click", function() {
        if (params && params[1]) {
          // If there are parameters, evaluate the original onclick
          eval(onclickAttr);
        } else if (window[functionName]) {
          // If it's a simple function call without parameters
          window[functionName]();
        }
      });
    }
  });
  
  // Add Enter key functionality for login
  const loginInputs = ["classCode", "studentCode"];
  loginInputs.forEach(id => {
    document.getElementById(id).addEventListener("keypress", function(event) {
      // Check if the key pressed was Enter
      if (event.key === "Enter") {
        // Prevent default action to avoid form submission
        event.preventDefault();
        // Call the login function
        handleLogin();
      }
    });
  });

  console.log(`Phrases embedded directly in code: ${Object.keys(customPhrases).length} phrases loaded`);
  
  // Set up sidebar functionality
  setupSidebar();
};

// Sidebar functionality
function setupSidebar() {
  const sidebar = document.getElementById('sidebar');
  const sidebarTab = document.getElementById('sidebar-tab');
  const closeTab = document.getElementById('close-tab');
  
  // Open sidebar when tab is clicked
  sidebarTab.addEventListener('click', function() {
    sidebar.classList.add('open');
  });
  
  // Close sidebar when close button is clicked
  closeTab.addEventListener('click', function() {
    sidebar.classList.remove('open');
  });
  
  // Close sidebar when clicking outside of it
  document.addEventListener('click', function(event) {
    if (!sidebar.contains(event.target) && !sidebarTab.contains(event.target)) {
      sidebar.classList.remove('open');
    }
  });
}

function goToScreen(id) {
  console.log(`Switching to screen: ${id}`);
  
  // Verify the screen exists
  const targetScreen = document.getElementById(id);
  if (!targetScreen) {
    console.error(`Screen with id "${id}" not found!`);
    return;
  }
  
  // Remove active class from all screens
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  
  // Add active class to target screen
  targetScreen.classList.add("active");

  // Show/hide sidebar based on screen
  const sidebar = document.getElementById("sidebar");
  if (id === "screen-login") {
    sidebar.style.display = "none";
  } else {
    sidebar.style.display = "block";
    // Close sidebar when switching screens
    sidebar.classList.remove("open");
  }
  // Hide logo on slide viewer
  const logo = document.getElementById('logo');
  if (id === 'screen-slide-viewer') {
    if (logo) logo.style.display = 'none';
  } else {
    if (logo) logo.style.display = '';
  }
}

function handleLogin() {
  classCode = document.getElementById("classCode").value.trim();
  studentCode = document.getElementById("studentCode").value.trim();
  const errorElement = document.getElementById("login-error");
  
  // Clear previous error messages
  errorElement.textContent = "";
  
  // Validate class code (for demo purposes, let's say valid class codes start with "SMX")
  if (classCode === "") {
    errorElement.textContent = "Please enter a class code";
    return;
  } else if (!classCode.startsWith("SMX")) {
    errorElement.textContent = "Class Code Incorrect";
    return;
  }
  
  // Validate student code (for demo purposes, let's say valid student codes are 6 digits)
  if (studentCode === "") {
    errorElement.textContent = "Please enter a student code";
    return;
  } else if (!/^\d{6}$/.test(studentCode)) {
    errorElement.textContent = "Student Code Incorrect";
    return;
  }

  // If we get here, both codes are valid
  goToScreen("screen-home");
  updateStudentInfo();
}

function goToCourseContent() {
  currentSection = "course-content";
  goToScreen("screen-course-content");
  renderCourseContent();
}

function goToKITS() {
  currentSection = "kits";
  goToScreen("screen-dashboard");
  renderModules();
}

function goToISRTraining() {
  goToScreen("screen-isr-training");
}

function goToPEDTraining() {
  goToScreen("screen-ped-training");
}

function goToPowerpointLessons() {
  goToScreen("screen-powerpoint-lessons");
  renderPowerpointLessons();
}

function goBackToPractices() {
  if (currentSection === "course-content") {
    goToScreen("screen-course-practice");
  } else {
    goToScreen("screen-practice");
  }
}

function retryTest() {
  if (currentSection === "course-content") {
    startCourseTest(currentModule, currentPractice);
  } else {
    startTest(currentModule, currentPractice);
  }
}

function renderModules() {
  const container = document.getElementById("module-list");
  container.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const mod = moduleData[i];
    const card = document.createElement("div");
    card.className = "module-card";
    card.innerHTML = `
      <div class="module-info">
        <h3>Module ${i}: ${moduleNames[i]}</h3>
        <small>${Object.keys(mod.practices).length}/20 practices completed</small>
      </div>
      <button onclick="renderPractices(${i})">Open</button>
    `;
    container.appendChild(card);
  }
}

function renderCourseContent() {
  const container = document.getElementById("course-content-list");
  container.innerHTML = "";
  
  const courseItems = [
    { name: "Lesson Powerpoints", action: "goToPowerpointLessons()" },
    { name: "Quick Guides", action: "alert('Quick Guides - Coming Soon!')" }, 
    { name: "Templates", action: "alert('Templates - Coming Soon!')" }
  ];
  
  courseItems.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "module-card";
    card.innerHTML = `
      <div class="module-info">
        <h3>${item.name}</h3>
        <div class="star">☆</div>
      </div>
      <button onclick="${item.action}">Open</button>
    `;
    container.appendChild(card);
  });
}

function renderPowerpointLessons() {
  const container = document.getElementById("powerpoint-list");
  container.innerHTML = "";
  // Only show PowerPoint 1 for now, since only that PDF exists
  const card = document.createElement("div");
  card.className = "module-card";
  card.innerHTML = `
    <div class="module-info">
      <h3>PowerPoint 1</h3>
      <div class="star">☆</div>
    </div>
    <button onclick="openSlideViewer(1)">Open</button>
  `;
  container.appendChild(card);
}

function renderCoursePractices(moduleNum) {
  currentModule = moduleNum;
  document.getElementById("course-practice-header").textContent = `Module ${moduleNum}: ${moduleNames[moduleNum]} - Practice List`;
  const container = document.getElementById("course-practice-list");
  container.innerHTML = "";

  for (let i = 1; i <= 20; i++) {
    const passed = moduleData[moduleNum].practices[i];
    const card = document.createElement("div");
    card.className = "module-card";
    card.innerHTML = `
      <div class="module-info">
        <h3>Practice ${i}</h3>
      </div>
      <div class="practice-actions">
        <span class="practice-star">${passed ? "⭐️" : "☆"}</span>
        <button onclick="startCourseTest(${moduleNum}, ${i})">Start</button>
      </div>
    `;
    container.appendChild(card);
  }

  goToScreen("screen-course-practice");
}

function renderPractices(moduleNum) {
  currentModule = moduleNum;
  document.getElementById("practice-header").textContent = `Module ${moduleNum}: ${moduleNames[moduleNum]} - Practice List`;
  const container = document.getElementById("practice-list");
  container.innerHTML = "";

  for (let i = 1; i <= 20; i++) {
    const passed = moduleData[moduleNum].practices[i];
    const card = document.createElement("div");
    card.className = "module-card";
    card.innerHTML = `
      <div class="module-info">
        <h3>Practice ${i}</h3>
      </div>
      <div class="practice-actions">
        <span class="practice-star">${passed ? "⭐️" : "☆"}</span>
        <button onclick="startTest(${moduleNum}, ${i})">Start</button>
      </div>
    `;
    container.appendChild(card);
  }

  goToScreen("screen-practice");
}

function startTest(modNum, pracNum) {
  currentSection = "kits";
  currentModule = modNum;
  currentPractice = pracNum;

  // Use phrase from embedded phrases
  const key = `${modNum}-${pracNum}`;
  
  console.log(`Starting test for module ${modNum}, practice ${pracNum}`);
  console.log(`Looking for key: "${key}"`);
  
  // Check if the key exists in customPhrases
  if (customPhrases[key]) {
    currentText = customPhrases[key];
    console.log(`Using phrase for ${key}: "${currentText.substring(0, 50)}..."`);
  } else {
    // If phrase not found, show an error message
    currentText = `Error: Practice text for Module ${modNum}, Practice ${pracNum} not found.`;
    console.error(`No phrase found for ${key}. Available keys: ${Object.keys(customPhrases).slice(0, 10).join(', ')}`);
  }

  // Reset the typing input and UI
  document.getElementById("typing-input").value = "";
  document.getElementById("progress-fill").style.width = "0%";
  resetStats();
  clearInterval(timerInterval);
  startTime = 0;

  // Render the letter boxes and switch to typing screen
  renderLetterBoxes();
  goToScreen("screen-typing");
}

function startCourseTest(modNum, pracNum) {
  currentSection = "course-content";
  currentModule = modNum;
  currentPractice = pracNum;

  // Use phrase from embedded phrases
  const key = `${modNum}-${pracNum}`;
  
  console.log(`Starting course test for module ${modNum}, practice ${pracNum}`);
  console.log(`Looking for key: "${key}"`);
  
  // Check if the key exists in customPhrases
  if (customPhrases[key]) {
    currentText = customPhrases[key];
    console.log(`Using phrase for ${key}: "${currentText.substring(0, 50)}..."`);
  } else {
    // If phrase not found, show an error message
    currentText = `Error: Practice text for Module ${modNum}, Practice ${pracNum} not found.`;
    console.error(`No phrase found for ${key}. Available keys: ${Object.keys(customPhrases).slice(0, 10).join(', ')}`);
  }

  // Reset the typing input and UI
  document.getElementById("typing-input").value = "";
  document.getElementById("progress-fill").style.width = "0%";
  resetStats();
  clearInterval(timerInterval);
  startTime = 0;

  // Render the letter boxes and switch to typing screen
  renderLetterBoxes();
  goToScreen("screen-typing");
}

function renderLetterBoxes() {
  const container = document.getElementById("letter-container");
  container.innerHTML = "";

  const words = currentText.split(" ");
  words.forEach((word, wordIndex) => {
    const wordSpan = document.createElement("span");
    wordSpan.className = "word-box";

    word.split("").forEach(char => {
      const charSpan = document.createElement("span");
      charSpan.className = "letter-box";
      charSpan.textContent = char;
      wordSpan.appendChild(charSpan);
    });

    if (wordIndex < words.length - 1) {
      const spaceSpan = document.createElement("span");
      spaceSpan.className = "letter-box";
      spaceSpan.textContent = " ";
      wordSpan.appendChild(spaceSpan);
    }

    container.appendChild(wordSpan);
  });
}

function handleTyping() {
  const typed = document.getElementById("typing-input").value;
  if (!startTime) {
    startTime = Date.now();
    timerInterval = setInterval(updateStats, 300);
  }

  const letters = document.querySelectorAll(".letter-box");
  let correct = 0;

  letters.forEach((span, i) => {
    span.className = "letter-box";
    if (typed[i]) {
      if (typed[i] === currentText[i]) {
        span.classList.add("correct");
        correct++;
      } else {
        span.classList.add("incorrect");
      }
    }
    if (i === typed.length) {
      span.classList.add("current");
    }
  });

  const progress = Math.min((typed.length / currentText.length) * 100, 100);
  document.getElementById("progress-fill").style.width = `${progress}%`;

  if (typed.length >= currentText.length) {
    clearInterval(timerInterval);
    setTimeout(showResults, 400);
  }
}

function updateStats() {
  const typed = document.getElementById("typing-input").value;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const correct = typed.split("").filter((c, i) => c === currentText[i]).length;
  const accuracy = ((correct / typed.length) * 100 || 0).toFixed(0);
  const wpm = ((typed.length / 5) / (elapsed / 60) || 0).toFixed(0);

  document.getElementById("accuracy").textContent = `Accuracy: ${accuracy}%`;
  document.getElementById("wpm").textContent = `WPM: ${wpm}`;
  document.getElementById("timer").textContent = `Time: ${elapsed}s`;
}

function resetStats() {
  document.getElementById("accuracy").textContent = "Accuracy: 100%";
  document.getElementById("wpm").textContent = "WPM: 0";
  document.getElementById("timer").textContent = "Time: 0s";
  document.getElementById("progress-fill").style.width = "0%";
}

function showResults() {
  const typed = document.getElementById("typing-input").value;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const correct = typed.split("").filter((c, i) => c === currentText[i]).length;
  const accuracy = ((correct / typed.length) * 100 || 0).toFixed(0);
  const wpm = ((typed.length / 5) / (elapsed / 60) || 0).toFixed(0);
  lastWPM = wpm;
  wpmHistory.push(parseInt(wpm));

  const passed = accuracy >= 70 && wpm > 45 && elapsed <= 120;
  const resultStar = document.getElementById("result-star");
  resultStar.textContent = passed ? "⭐️" : "☆";

  if (passed && !moduleData[currentModule].practices[currentPractice]) {
    moduleData[currentModule].practices[currentPractice] = true;
  }

  document.getElementById("result-module").textContent = `Module ${currentModule}: ${moduleNames[currentModule]}`;
  document.getElementById("result-practice").textContent = `Practice ${currentPractice}`;
  document.getElementById("result-time").textContent = `${elapsed}s`;
  document.getElementById("result-accuracy").textContent = `${accuracy}%`;
  document.getElementById("result-wpm").textContent = `${wpm}`;
  updateStudentInfo();
  renderPractices(currentModule);
  goToScreen("screen-results");
}

function retryTest() {
  startTest(currentModule, currentPractice);
}

function updateStudentInfo() {
  const totalStars = Object.values(moduleData).reduce((sum, mod) => sum + Object.keys(mod.practices).length, 0);
  const avgWPM = wpmHistory.length ? (wpmHistory.reduce((a, b) => a + b) / wpmHistory.length).toFixed(1) : 0;
  
  // Update sidebar elements
  document.getElementById("info-student-sidebar").textContent = studentCode;
  document.getElementById("info-class-sidebar").textContent = classCode;
  document.getElementById("info-last-wpm-sidebar").textContent = lastWPM;
  document.getElementById("info-avg-wpm-sidebar").textContent = avgWPM;
  document.getElementById("info-stars-sidebar").textContent = totalStars;
}

// FMV HUD Data
const metaStates = [
  {
    topLeft: `POINT   UN
IR BLK  P1
123/118
1173`,
    topRight: `ACFT   398 KD
56419 0831
10331 MSL
LST     IDLE
        1111`,
    leftSide: `60
0
< 42`,
    rightSide: `398 KD
54966 -876S
BRG     263
RNG   3915M
RNG2  2111M
THD     54M
ELY  -462FT`,
    bottomRight: ``
  },
  {
    topLeft: `POINT   UN
IR BLK  P1
124/119
1180`,
    topRight: `ACFT   386 KD
56420 0832
10124 MSL
LST     IDLE
        1122`,
    leftSide: `58
0
< 38`,
    rightSide: `386 KD
53888 -822S
BRG     270
RNG   3890M
RNG2  1982M
THD     50M
ELY  -455FT`,
    bottomRight: ``
  },
  {
    topLeft: `POINT   UN
IR BLK  P1
125/121
1201`,
    topRight: `ACFT   368 KD
56421 0833
9875 MSL
LST     IDLE
        1143`,
    leftSide: `55
0
< 36`,
    rightSide: `368 KD
52800 -810S
BRG     269
RNG   3820M
RNG2  1933M
THD     49M
ELY  -440FT`,
    bottomRight: ``
  }
];

let hudIndex = 0;
let clockInterval = null;

function updateHUD() {
  const state = metaStates[hudIndex];
  document.getElementById('top-left').textContent = state.topLeft;
  document.getElementById('top-right').textContent = state.topRight;
  document.getElementById('left-side').textContent = state.leftSide;
  document.getElementById('right-side').textContent = state.rightSide;
  document.getElementById('bottom-right').textContent = state.bottomRight;
}

function updateHUDBasedOnScroll(scrollPosition, maxScroll) {
  // Calculate which HUD state to show based on scroll position
  // Divide the scroll range into segments equal to the number of HUD states
  const segmentSize = maxScroll / (metaStates.length - 1);
  const newHudIndex = Math.min(
    Math.floor(scrollPosition / segmentSize),
    metaStates.length - 1
  );
  
  // Only update if the index has changed
  if (newHudIndex !== hudIndex) {
    hudIndex = newHudIndex;
    updateHUD();
  }
}

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  const clockElement = document.getElementById('clock-time');
  if (clockElement) {
    clockElement.textContent = `${h}:${m}:${s}`;
  }
}

// Inside the Kit overlay functionality
document.addEventListener('DOMContentLoaded', function() {
  // Toggle overlay when "Inside the Kit" link is clicked
  document.getElementById('insideKitLink').addEventListener('click', function(e) {
    e.preventDefault();
    const overlay = document.getElementById('fmvOverlay');
    if (overlay.style.display === 'flex') {
      overlay.style.display = 'none';
      // Stop clock when overlay is closed
      if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
      }
    } else {
      overlay.style.display = 'flex';
      // Initialize HUD and start clock
      updateHUD();
      updateClock();
      clockInterval = setInterval(updateClock, 1000);
    }
  });

  // Close overlay when close button is clicked
  document.getElementById('closeFmvOverlay').addEventListener('click', function() {
    document.getElementById('fmvOverlay').style.display = 'none';
    if (clockInterval) {
      clearInterval(clockInterval);
      clockInterval = null;
    }
  });

  // Close overlay when clicking outside the FMV window
  document.getElementById('fmvOverlay').addEventListener('click', function(e) {
    if (e.target === this) {
      this.style.display = 'none';
      if (clockInterval) {
        clearInterval(clockInterval);
        clockInterval = null;
      }
    }
  });

  // Close overlay with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      const overlay = document.getElementById('fmvOverlay');
      if (overlay.style.display === 'flex') {
        overlay.style.display = 'none';
        if (clockInterval) {
          clearInterval(clockInterval);
          clockInterval = null;
        }
      }
    }
  });

  // Controlled image scrolling with bounds checking
  document.getElementById('scrollArea').addEventListener('wheel', function(e) {
    e.preventDefault();
    
    const scrollContainer = this;
    const image = scrollContainer.querySelector('.scroll-image');
    const window = scrollContainer.parentElement;
    
    // Get dimensions
    const windowHeight = window.clientHeight;
    const imageHeight = image.offsetHeight;
    const currentScrollTop = scrollContainer.scrollTop;
    
    // Calculate scroll amount (adjust this value to control scroll speed)
    const scrollAmount = 50;
    const maxScroll = Math.max(0, imageHeight - windowHeight);
    
    if (e.deltaY > 0) {
      // Scrolling down
      const newScrollTop = Math.min(currentScrollTop + scrollAmount, maxScroll);
      scrollContainer.scrollTop = newScrollTop;
    } else {
      // Scrolling up
      const newScrollTop = Math.max(currentScrollTop - scrollAmount, 0);
      scrollContainer.scrollTop = newScrollTop;
    }
    
    // Update HUD based on new scroll position
    updateHUDBasedOnScroll(scrollContainer.scrollTop, maxScroll);
  });

  // Also listen for scroll events (in case scrolling happens through other means)
  document.getElementById('scrollArea').addEventListener('scroll', function() {
    const scrollContainer = this;
    const image = scrollContainer.querySelector('.scroll-image');
    const window = scrollContainer.parentElement;
    const windowHeight = window.clientHeight;
    const imageHeight = image.offsetHeight;
    const maxScroll = Math.max(0, imageHeight - windowHeight);
    
    updateHUDBasedOnScroll(scrollContainer.scrollTop, maxScroll);
  });

  // HUD data cycling with keyboard (since mouse wheel now controls scrolling)
  document.addEventListener('keydown', function(e) {
    const overlay = document.getElementById('fmvOverlay');
    if (overlay.style.display === 'flex') {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        hudIndex = (hudIndex - 1 + metaStates.length) % metaStates.length;
        updateHUD();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        hudIndex = (hudIndex + 1) % metaStates.length;
        updateHUD();
      }
    }
  });
});

// ===== SLIDE VIEWER FUNCTIONALITY =====

let currentSlideViewer = {
  pageNum: 1,
  totalSlides: 9,
  currentPowerPoint: 1,
  slideImages: [
    'mIRC SETUP AND OVERVIEW 01.jpg',
    'mIRC SETUP AND OVERVIEW 02.jpg',
    'mIRC SETUP AND OVERVIEW 03.jpg',
    'mIRC SETUP AND OVERVIEW 04.jpg',
    'mIRC SETUP AND OVERVIEW 05.jpg',
    'mIRC SETUP AND OVERVIEW 06.jpg',
    'mIRC SETUP AND OVERVIEW 07.jpg',
    'mIRC SETUP AND OVERVIEW 08.jpg',
    'mIRC SETUP AND OVERVIEW 09.jpg'
  ],
  notes: {
    1: [
      'mIRC Setup and Overview - Introduction to IRC communication',
      'Cover the basic installation and configuration of mIRC',
      'Emphasize security considerations and proper channel etiquette',
      'Demonstrate connection procedures and basic commands',
      '', '', '', '', ''
    ]
  }
};

function openSlideViewer(powerpointNum) {
  currentSlideViewer.currentPowerPoint = powerpointNum;
  currentSlideViewer.pageNum = 1;
  document.getElementById('slide-title').textContent = `PowerPoint ${powerpointNum}`;
  goToScreen('screen-slide-viewer');
  renderImageSlide();
  setupSlideNavigation();
  updateInstructorNotes();
  updateSlideCounter();
}

// Listen for sidebar open/close to adjust slide viewer layout
(function() {
  const sidebar = document.getElementById('sidebar');
  const observer = new MutationObserver(() => {
    if (sidebar.classList.contains('open')) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
  });
  observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
})();

function renderImageSlide() {
  const canvas = document.getElementById('slide');
  const ctx = canvas.getContext('2d');
  const img = new window.Image();
  const slideIdx = currentSlideViewer.pageNum - 1;
  img.src = currentSlideViewer.slideImages[slideIdx];
  document.getElementById('slide-loading').style.display = 'block';
  img.onload = function() {
    // Fit image to canvas size
    const notesOpen = document.getElementById('notes').classList.contains('show');
    const containerWidth = canvas.parentElement.clientWidth - 100;
    // If notes are open, reduce available height for slide
    const containerHeight = notesOpen ? (canvas.parentElement.clientHeight * 0.62) : (canvas.parentElement.clientHeight - 100);
    let scale = Math.min(containerWidth / img.width, containerHeight / img.height, 2);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    document.getElementById('slide-loading').style.display = 'none';
  };
  img.onerror = function() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = '24px Arial';
    ctx.fillStyle = 'red';
    ctx.fillText('Failed to load slide image.', 50, 100);
    document.getElementById('slide-loading').style.display = 'none';
  };
}

function setupSlideNavigation() {
  const arrows = document.querySelectorAll('.nav-arrow');
  const topBar = document.querySelector('.slide-top-bar');
  const notesHeader = document.getElementById('notes-header');
  const notesBox = document.getElementById('notes');
  const slideViewerScreen = document.getElementById('screen-slide-viewer');
  const slideCanvas = document.getElementById('slide');
  let hideTimer;
  function showNavigation() {
    arrows.forEach(arrow => {
      arrow.classList.add('visible');
    });
    topBar.classList.add('visible');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      arrows.forEach(arrow => {
        arrow.classList.remove('visible');
      });
      topBar.classList.remove('visible');
    }, 2500);
  }
  document.addEventListener('mousemove', showNavigation);
  document.getElementById('next').onclick = () => {
    if (currentSlideViewer.pageNum < currentSlideViewer.totalSlides) {
      currentSlideViewer.pageNum++;
      renderImageSlide();
      updateInstructorNotes();
      updateSlideCounter();
    }
  };
  document.getElementById('prev').onclick = () => {
    if (currentSlideViewer.pageNum > 1) {
      currentSlideViewer.pageNum--;
      renderImageSlide();
      updateInstructorNotes();
      updateSlideCounter();
    }
  };
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('#screen-slide-viewer.active')) {
      if (e.key === 'ArrowRight') {
        document.getElementById('next').onclick();
      } else if (e.key === 'ArrowLeft') {
        document.getElementById('prev').onclick();
      } else if (e.key === 'Escape') {
        goToScreen('screen-powerpoint-lessons');
      }
    }
  });
  notesHeader.onclick = () => {
    notesBox.classList.toggle('show');
    slideViewerScreen.classList.toggle('notes-open', notesBox.classList.contains('show'));
  };
  // Click on slide to close notes
  slideCanvas.onclick = () => {
    if (notesBox.classList.contains('show')) {
      notesBox.classList.remove('show');
      slideViewerScreen.classList.remove('notes-open');
    }
  };
}

function updateSlideCounter() {
  const counter = document.getElementById('slide-counter');
  if (counter) {
    counter.textContent = `Slide ${currentSlideViewer.pageNum} of ${currentSlideViewer.totalSlides}`;
  }
}

function updateInstructorNotes() {
  const notesContent = document.getElementById('notes-content');
  const notes = currentSlideViewer.notes[1];
  const currentNote = notes[currentSlideViewer.pageNum - 1] || 'No instructor notes available for this slide.';
  notesContent.textContent = currentNote;
}

// Mission Reference Sheet dropdown logic
const missionDropdown = document.getElementById('mission-ref-dropdown');
const outputFileLink = document.getElementById('output-file-link');
if (missionDropdown && outputFileLink) {
  missionDropdown.addEventListener('change', function() {
    if (this.value) {
      outputFileLink.href = this.value;
      outputFileLink.style.display = 'inline-block';
    } else {
      outputFileLink.style.display = 'none';
      outputFileLink.href = '#';
    }
  });
  // Hide link on load
  outputFileLink.style.display = 'none';
}
