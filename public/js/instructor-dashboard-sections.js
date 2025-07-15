// Instructor Dashboard Sections
// This file contains the content and functionality for each dashboard section

class InstructorDashboardSections {
  constructor(dashboardInstance) {
    this.dashboard = dashboardInstance;
    this.currentSection = 'overview';
  }

  // Initialize all sections
  init() {
    this.setupSectionSwitching();
    this.loadAllSections();
  }

  setupSectionSwitching() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const section = item.dataset.section;
        this.switchToSection(section);
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
      });
    });
  }

  switchToSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
      section.style.display = 'none';
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
      targetSection.style.display = 'block';
      this.currentSection = sectionName;
      
      // Load section-specific data
      this.loadSectionData(sectionName);
    }
  }

  async loadSectionData(sectionName) {
    switch (sectionName) {
      case 'overview':
        await this.loadOverviewData();
        break;
      case 'stream':
        await this.loadStreamData();
        break;
      case 'students':
        await this.loadStudentsData();
        break;
      case 'content':
        await this.loadContentData();
        break;
      case 'assignments':
        await this.loadAssignmentsData();
        break;
      case 'grading':
        await this.loadGradingData();
        break;
      case 'analytics':
        await this.loadAnalyticsData();
        break;
      case 'schedule':
        await this.loadScheduleData();
        break;
      case 'settings':
        await this.loadSettingsData();
        break;
    }
  }

  loadAllSections() {
    this.createStreamSection();
    this.createStudentsSection();
    this.createContentSection();
    this.createAssignmentsSection();
    this.createGradingSection();
    this.createAnalyticsSection();
    this.createScheduleSection();
    this.createSettingsSection();
  }

  // Stream Management Section
  createStreamSection() {
    const section = document.getElementById('stream-section');
    section.innerHTML = `
      <div class="section-header">
        <h2>Live Stream Management</h2>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="this.openStreamSettings()">
            <i class="fas fa-cog"></i>
            Stream Settings
          </button>
        </div>
      </div>

      <div class="stream-management-grid">
        <!-- Stream Control Panel -->
        <div class="stream-control-panel">
          <div class="panel-header">
            <h3>Stream Control</h3>
            <span class="stream-status-indicator" id="streamStatusIndicator">Offline</span>
          </div>
          
          <div class="stream-preview-large" id="streamPreviewLarge">
            <video id="streamVideo" controls style="width: 100%; height: 100%; display: none;"></video>
            <div class="stream-placeholder" id="streamPlaceholder">
              <i class="fas fa-video-slash"></i>
              <p>Stream Offline</p>
            </div>
          </div>
          
          <div class="stream-controls-extended">
            <div class="control-group">
              <button class="btn btn-success" id="startStreamExtended">
                <i class="fas fa-play"></i>
                Start Stream
              </button>
              <button class="btn btn-danger" id="stopStreamExtended" style="display: none;">
                <i class="fas fa-stop"></i>
                Stop Stream
              </button>
              <button class="btn btn-warning" id="pauseStream">
                <i class="fas fa-pause"></i>
                Pause
              </button>
            </div>
            
            <div class="control-group">
              <button class="btn btn-primary" id="shareScreenExtended">
                <i class="fas fa-desktop"></i>
                Share Screen
              </button>
              <button class="btn btn-primary" id="shareCamera">
                <i class="fas fa-camera"></i>
                Camera
              </button>
              <button class="btn btn-primary" id="shareAudio">
                <i class="fas fa-microphone"></i>
                Audio
              </button>
            </div>
          </div>
          
          <div class="stream-info-extended">
            <div class="info-item">
              <label>Stream Key:</label>
              <div class="stream-key-display">
                <input type="text" id="streamKeyDisplay" readonly>
                <button class="btn btn-small" onclick="this.copyStreamKey()">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
            <div class="info-item">
              <label>Stream URL:</label>
              <span id="streamUrlDisplay">Not active</span>
            </div>
            <div class="info-item">
              <label>Viewers:</label>
              <span id="viewerCountExtended">0</span>
            </div>
            <div class="info-item">
              <label>Duration:</label>
              <span id="streamDuration">00:00:00</span>
            </div>
          </div>
        </div>

        <!-- Viewer Management -->
        <div class="viewer-management">
          <div class="panel-header">
            <h3>Active Viewers</h3>
            <span class="viewer-count-badge" id="viewerCountBadge">0</span>
          </div>
          
          <div class="viewer-list" id="viewerList">
            <!-- Viewers will be populated here -->
          </div>
          
          <div class="viewer-actions">
            <button class="btn btn-primary" onclick="this.sendViewerMessage()">
              <i class="fas fa-comment"></i>
              Send Message
            </button>
            <button class="btn btn-warning" onclick="this.kickViewer()">
              <i class="fas fa-user-times"></i>
              Remove Viewer
            </button>
          </div>
        </div>

        <!-- Stream Chat -->
        <div class="stream-chat">
          <div class="panel-header">
            <h3>Live Chat</h3>
            <button class="btn btn-small" onclick="this.clearChat()">
              <i class="fas fa-trash"></i>
              Clear
            </button>
          </div>
          
          <div class="chat-messages" id="streamChatMessages">
            <!-- Chat messages will appear here -->
          </div>
          
          <div class="chat-input">
            <input type="text" placeholder="Type a message..." id="streamChatInput">
            <button class="btn btn-primary" onclick="this.sendChatMessage()">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Students Management Section
  createStudentsSection() {
    const section = document.getElementById('students-section');
    section.innerHTML = `
      <div class="section-header">
        <h2>Student Management</h2>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="this.addStudent()">
            <i class="fas fa-user-plus"></i>
            Add Student
          </button>
          <button class="btn btn-primary" onclick="this.importStudents()">
            <i class="fas fa-upload"></i>
            Import CSV
          </button>
        </div>
      </div>

      <div class="students-management-grid">
        <!-- Student List -->
        <div class="student-list-panel">
          <div class="panel-header">
            <h3>Class Roster</h3>
            <div class="search-box">
              <input type="text" placeholder="Search students..." id="studentSearch">
              <i class="fas fa-search"></i>
            </div>
          </div>
          
          <div class="student-filters">
            <button class="filter-btn active" data-filter="all">All</button>
            <button class="filter-btn" data-filter="online">Online</button>
            <button class="filter-btn" data-filter="offline">Offline</button>
            <button class="filter-btn" data-filter="struggling">Struggling</button>
          </div>
          
          <div class="student-list-detailed" id="studentListDetailed">
            <!-- Students will be populated here -->
          </div>
        </div>

        <!-- Student Details -->
        <div class="student-details-panel">
          <div class="panel-header">
            <h3>Student Details</h3>
            <button class="btn btn-small" onclick="this.editStudent()">
              <i class="fas fa-edit"></i>
              Edit
            </button>
          </div>
          
          <div class="student-profile" id="studentProfile">
            <div class="profile-placeholder">
              <i class="fas fa-user"></i>
              <p>Select a student to view details</p>
            </div>
          </div>
        </div>

        <!-- Student Activity -->
        <div class="student-activity-panel">
          <div class="panel-header">
            <h3>Recent Activity</h3>
            <select id="activityTimeframe">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          
          <div class="activity-timeline" id="studentActivityTimeline">
            <!-- Activity timeline will be populated here -->
          </div>
        </div>
      </div>
    `;
  }

  // Content Management Section
  createContentSection() {
    const section = document.getElementById('content-section');
    section.innerHTML = `
      <div class="section-header">
        <h2>Content Management</h2>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="this.uploadContent()">
            <i class="fas fa-upload"></i>
            Upload Content
          </button>
          <button class="btn btn-primary" onclick="this.createLesson()">
            <i class="fas fa-plus"></i>
            Create Lesson
          </button>
        </div>
      </div>

      <div class="content-management-grid">
        <!-- Content Library -->
        <div class="content-library">
          <div class="panel-header">
            <h3>Content Library</h3>
            <div class="content-filters">
              <select id="contentCategoryFilter">
                <option value="all">All Categories</option>
                <option value="lecture">Lectures</option>
                <option value="assignment">Assignments</option>
                <option value="resource">Resources</option>
                <option value="video">Videos</option>
                <option value="document">Documents</option>
              </select>
            </div>
          </div>
          
          <div class="content-grid" id="contentGrid">
            <!-- Content items will be populated here -->
          </div>
        </div>

        <!-- Content Editor -->
        <div class="content-editor">
          <div class="panel-header">
            <h3>Content Editor</h3>
            <div class="editor-actions">
              <button class="btn btn-success" onclick="this.saveContent()">
                <i class="fas fa-save"></i>
                Save
              </button>
              <button class="btn btn-secondary" onclick="this.previewContent()">
                <i class="fas fa-eye"></i>
                Preview
              </button>
            </div>
          </div>
          
          <div class="editor-container" id="contentEditor">
            <div class="editor-placeholder">
              <i class="fas fa-edit"></i>
              <p>Select content to edit or create new content</p>
            </div>
          </div>
        </div>

        <!-- Course Structure -->
        <div class="course-structure">
          <div class="panel-header">
            <h3>Course Structure</h3>
            <button class="btn btn-small" onclick="this.reorderModules()">
              <i class="fas fa-sort"></i>
              Reorder
            </button>
          </div>
          
          <div class="module-tree" id="moduleTree">
            <!-- Course modules will be displayed here -->
          </div>
        </div>
      </div>
    `;
  }

  // Assignments Section
  createAssignmentsSection() {
    const section = document.getElementById('assignments-section');
    section.innerHTML = `
      <div class="section-header">
        <h2>Assignment Management</h2>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="this.createAssignment()">
            <i class="fas fa-plus"></i>
            Create Assignment
          </button>
          <button class="btn btn-primary" onclick="this.createQuiz()">
            <i class="fas fa-question-circle"></i>
            Create Quiz
          </button>
        </div>
      </div>

      <div class="assignments-grid">
        <!-- Assignment List -->
        <div class="assignment-list-panel">
          <div class="panel-header">
            <h3>Assignments</h3>
            <div class="assignment-filters">
              <button class="filter-btn active" data-filter="all">All</button>
              <button class="filter-btn" data-filter="active">Active</button>
              <button class="filter-btn" data-filter="draft">Draft</button>
              <button class="filter-btn" data-filter="completed">Completed</button>
            </div>
          </div>
          
          <div class="assignment-list" id="assignmentListDetailed">
            <!-- Assignments will be populated here -->
          </div>
        </div>

        <!-- Assignment Details -->
        <div class="assignment-details-panel">
          <div class="panel-header">
            <h3>Assignment Details</h3>
            <div class="assignment-actions">
              <button class="btn btn-primary" onclick="this.editAssignment()">
                <i class="fas fa-edit"></i>
                Edit
              </button>
              <button class="btn btn-success" onclick="this.publishAssignment()">
                <i class="fas fa-paper-plane"></i>
                Publish
              </button>
            </div>
          </div>
          
          <div class="assignment-details" id="assignmentDetails">
            <div class="details-placeholder">
              <i class="fas fa-tasks"></i>
              <p>Select an assignment to view details</p>
            </div>
          </div>
        </div>

        <!-- Submission Overview -->
        <div class="submission-overview">
          <div class="panel-header">
            <h3>Submission Overview</h3>
            <button class="btn btn-small" onclick="this.exportSubmissions()">
              <i class="fas fa-download"></i>
              Export
            </button>
          </div>
          
          <div class="submission-stats" id="submissionStats">
            <!-- Submission statistics will be displayed here -->
          </div>
          
          <div class="submission-list" id="submissionOverviewList">
            <!-- Recent submissions will be listed here -->
          </div>
        </div>
      </div>
    `;
  }

  // Grading Section
  createGradingSection() {
    const section = document.getElementById('grading-section');
    section.innerHTML = `
      <div class="section-header">
        <h2>Grading Center</h2>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="this.bulkGrade()">
            <i class="fas fa-list"></i>
            Bulk Grade
          </button>
          <button class="btn btn-primary" onclick="this.exportGrades()">
            <i class="fas fa-download"></i>
            Export Grades
          </button>
        </div>
      </div>

      <div class="grading-interface">
        <!-- Grading Queue -->
        <div class="grading-queue">
          <div class="panel-header">
            <h3>Grading Queue</h3>
            <div class="queue-filters">
              <select id="gradingFilter">
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
          
          <div class="submission-queue" id="submissionQueue">
            <!-- Submissions to grade will be listed here -->
          </div>
        </div>

        <!-- Grading Interface -->
        <div class="grading-workspace">
          <div class="panel-header">
            <h3>Grading Workspace</h3>
            <div class="grading-tools">
              <button class="btn btn-small" onclick="this.addComment()">
                <i class="fas fa-comment"></i>
                Comment
              </button>
              <button class="btn btn-small" onclick="this.addRubric()">
                <i class="fas fa-list-ul"></i>
                Rubric
              </button>
            </div>
          </div>
          
          <div class="submission-viewer" id="submissionViewer">
            <div class="viewer-placeholder">
              <i class="fas fa-file-alt"></i>
              <p>Select a submission to grade</p>
            </div>
          </div>
          
          <div class="grading-panel" id="gradingPanel">
            <!-- Grading controls will appear here -->
          </div>
        </div>

        <!-- Grade Book -->
        <div class="gradebook">
          <div class="panel-header">
            <h3>Grade Book</h3>
            <button class="btn btn-small" onclick="this.configureGradebook()">
              <i class="fas fa-cog"></i>
              Configure
            </button>
          </div>
          
          <div class="gradebook-table" id="gradebookTable">
            <!-- Gradebook will be displayed here -->
          </div>
        </div>
      </div>
    `;
  }

  // Analytics Section
  createAnalyticsSection() {
    const section = document.getElementById('analytics-section');
    section.innerHTML = `
      <div class="section-header">
        <h2>Analytics & Reports</h2>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="this.generateReport()">
            <i class="fas fa-chart-line"></i>
            Generate Report
          </button>
          <button class="btn btn-primary" onclick="this.scheduleReport()">
            <i class="fas fa-clock"></i>
            Schedule Report
          </button>
        </div>
      </div>

      <div class="analytics-dashboard">
        <!-- Key Metrics -->
        <div class="metrics-overview">
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-users"></i>
            </div>
            <div class="metric-data">
              <h3 id="totalStudentsMetric">0</h3>
              <p>Total Students</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="metric-data">
              <h3 id="avgProgressMetric">0%</h3>
              <p>Average Progress</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <div class="metric-data">
              <h3 id="avgGradeMetric">0</h3>
              <p>Average Grade</p>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="metric-data">
              <h3 id="avgTimeMetric">0h</h3>
              <p>Avg. Study Time</p>
            </div>
          </div>
        </div>

        <!-- Charts and Graphs -->
        <div class="analytics-charts">
          <div class="chart-container">
            <div class="chart-header">
              <h3>Student Progress Over Time</h3>
              <select id="progressTimeframe">
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="semester">This Semester</option>
              </select>
            </div>
            <canvas id="progressChart"></canvas>
          </div>
          
          <div class="chart-container">
            <div class="chart-header">
              <h3>Grade Distribution</h3>
              <select id="gradeAssignment">
                <option value="all">All Assignments</option>
                <!-- Assignment options will be populated -->
              </select>
            </div>
            <canvas id="gradeChart"></canvas>
          </div>
          
          <div class="chart-container">
            <div class="chart-header">
              <h3>Activity Heatmap</h3>
              <select id="activityPeriod">
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div id="activityHeatmap"></div>
          </div>
          
          <div class="chart-container">
            <div class="chart-header">
              <h3>Engagement Metrics</h3>
            </div>
            <canvas id="engagementChart"></canvas>
          </div>
        </div>

        <!-- Reports -->
        <div class="reports-section">
          <div class="panel-header">
            <h3>Generated Reports</h3>
            <button class="btn btn-small" onclick="this.refreshReports()">
              <i class="fas fa-sync"></i>
              Refresh
            </button>
          </div>
          
          <div class="reports-list" id="reportsList">
            <!-- Generated reports will be listed here -->
          </div>
        </div>
      </div>
    `;
  }

  // Schedule Section
  createScheduleSection() {
    const section = document.getElementById('schedule-section');
    section.innerHTML = `
      <div class="section-header">
        <h2>Schedule Management</h2>
        <div class="header-actions">
          <button class="btn btn-primary" onclick="this.createEvent()">
            <i class="fas fa-plus"></i>
            Create Event
          </button>
          <button class="btn btn-primary" onclick="this.importSchedule()">
            <i class="fas fa-upload"></i>
            Import Schedule
          </button>
        </div>
      </div>

      <div class="schedule-interface">
        <!-- Calendar -->
        <div class="calendar-container">
          <div class="calendar-header">
            <h3>Class Calendar</h3>
            <div class="calendar-controls">
              <button class="btn btn-small" onclick="this.previousMonth()">
                <i class="fas fa-chevron-left"></i>
              </button>
              <span id="currentMonth">Loading...</span>
              <button class="btn btn-small" onclick="this.nextMonth()">
                <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
          
          <div id="scheduleCalendar"></div>
        </div>

        <!-- Event Details -->
        <div class="event-details">
          <div class="panel-header">
            <h3>Event Details</h3>
            <button class="btn btn-small" onclick="this.editEvent()">
              <i class="fas fa-edit"></i>
              Edit
            </button>
          </div>
          
          <div class="event-info" id="eventInfo">
            <div class="event-placeholder">
              <i class="fas fa-calendar"></i>
              <p>Select an event to view details</p>
            </div>
          </div>
        </div>

        <!-- Upcoming Events -->
        <div class="upcoming-events">
          <div class="panel-header">
            <h3>Upcoming Events</h3>
            <select id="upcomingTimeframe">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          
          <div class="events-list" id="upcomingEventsList">
            <!-- Upcoming events will be listed here -->
          </div>
        </div>
      </div>
    `;
  }

  // Settings Section
  createSettingsSection() {
    const section = document.getElementById('settings-section');
    section.innerHTML = `
      <div class="section-header">
        <h2>Settings</h2>
        <div class="header-actions">
          <button class="btn btn-success" onclick="this.saveSettings()">
            <i class="fas fa-save"></i>
            Save Changes
          </button>
          <button class="btn btn-secondary" onclick="this.resetSettings()">
            <i class="fas fa-undo"></i>
            Reset
          </button>
        </div>
      </div>

      <div class="settings-interface">
        <!-- Settings Navigation -->
        <div class="settings-nav">
          <ul class="settings-menu">
            <li class="settings-item active" data-setting="general">
              <i class="fas fa-cog"></i>
              General
            </li>
            <li class="settings-item" data-setting="notifications">
              <i class="fas fa-bell"></i>
              Notifications
            </li>
            <li class="settings-item" data-setting="grading">
              <i class="fas fa-graduation-cap"></i>
              Grading
            </li>
            <li class="settings-item" data-setting="streaming">
              <i class="fas fa-video"></i>
              Streaming
            </li>
            <li class="settings-item" data-setting="security">
              <i class="fas fa-shield-alt"></i>
              Security
            </li>
            <li class="settings-item" data-setting="integrations">
              <i class="fas fa-plug"></i>
              Integrations
            </li>
          </ul>
        </div>

        <!-- Settings Content -->
        <div class="settings-content">
          <!-- General Settings -->
          <div class="settings-panel active" id="general-settings">
            <h3>General Settings</h3>
            
            <div class="setting-group">
              <label>Class Name</label>
              <input type="text" id="className" class="form-input">
            </div>
            
            <div class="setting-group">
              <label>Time Zone</label>
              <select id="timeZone" class="form-select">
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Time</option>
                <option value="PST">Pacific Time</option>
                <!-- More time zones -->
              </select>
            </div>
            
            <div class="setting-group">
              <label>Language</label>
              <select id="language" class="form-select">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            
            <div class="setting-group">
              <label>Auto-save Interval</label>
              <select id="autoSave" class="form-select">
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
                <option value="300">5 minutes</option>
              </select>
            </div>
          </div>

          <!-- Notification Settings -->
          <div class="settings-panel" id="notifications-settings">
            <h3>Notification Settings</h3>
            
            <div class="setting-group">
              <div class="setting-toggle">
                <input type="checkbox" id="emailNotifications">
                <label for="emailNotifications">Email Notifications</label>
              </div>
            </div>
            
            <div class="setting-group">
              <div class="setting-toggle">
                <input type="checkbox" id="pushNotifications">
                <label for="pushNotifications">Push Notifications</label>
              </div>
            </div>
            
            <div class="setting-group">
              <div class="setting-toggle">
                <input type="checkbox" id="submissionAlerts">
                <label for="submissionAlerts">New Submission Alerts</label>
              </div>
            </div>
            
            <div class="setting-group">
              <div class="setting-toggle">
                <input type="checkbox" id="studentActivityAlerts">
                <label for="studentActivityAlerts">Student Activity Alerts</label>
              </div>
            </div>
          </div>

          <!-- More settings panels... -->
        </div>
      </div>
    `;
  }

  // Data loading methods for each section
  async loadOverviewData() {
    // Already implemented in main dashboard
  }

  async loadStreamData() {
    try {
      const response = await fetch(`/api/streams/class/${this.dashboard.currentClass._id}/status`);
      if (response.ok) {
        const streamData = await response.json();
        this.updateStreamInterface(streamData);
      }
    } catch (error) {
      console.error('Failed to load stream data:', error);
    }
  }

  async loadStudentsData() {
    try {
      const response = await fetch(`/api/classes/${this.dashboard.currentClass._id}/students`);
      if (response.ok) {
        const students = await response.json();
        this.updateStudentsList(students);
      }
    } catch (error) {
      console.error('Failed to load students data:', error);
    }
  }

  async loadContentData() {
    try {
      const response = await fetch(`/api/materials/class/${this.dashboard.currentClass._id}`);
      if (response.ok) {
        const materials = await response.json();
        this.updateContentLibrary(materials);
      }
    } catch (error) {
      console.error('Failed to load content data:', error);
    }
  }

  async loadAssignmentsData() {
    try {
      const response = await fetch(`/api/assignments/class/${this.dashboard.currentClass._id}`);
      if (response.ok) {
        const assignments = await response.json();
        this.updateAssignmentsList(assignments);
      }
    } catch (error) {
      console.error('Failed to load assignments data:', error);
    }
  }

  async loadGradingData() {
    try {
      const response = await fetch(`/api/submissions/class/${this.dashboard.currentClass._id}?status=pending`);
      if (response.ok) {
        const submissions = await response.json();
        this.updateGradingQueue(submissions.submissions);
      }
    } catch (error) {
      console.error('Failed to load grading data:', error);
    }
  }

  async loadAnalyticsData() {
    try {
      const response = await fetch(`/api/analytics/class/${this.dashboard.currentClass._id}/stats`);
      if (response.ok) {
        const analytics = await response.json();
        this.updateAnalytics(analytics);
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    }
  }

  async loadScheduleData() {
    // Load calendar events
    this.initializeCalendar();
  }

  async loadSettingsData() {
    // Load current settings
    this.loadCurrentSettings();
  }

  // Update methods for UI
  updateStreamInterface(streamData) {
    const statusIndicator = document.getElementById('streamStatusIndicator');
    const streamVideo = document.getElementById('streamVideo');
    const streamPlaceholder = document.getElementById('streamPlaceholder');
    
    if (streamData.status === 'live') {
      statusIndicator.textContent = 'Live';
      statusIndicator.className = 'stream-status-indicator live';
      streamVideo.style.display = 'block';
      streamPlaceholder.style.display = 'none';
    } else {
      statusIndicator.textContent = 'Offline';
      statusIndicator.className = 'stream-status-indicator offline';
      streamVideo.style.display = 'none';
      streamPlaceholder.style.display = 'flex';
    }
  }

  updateStudentsList(students) {
    const studentList = document.getElementById('studentListDetailed');
    if (!studentList) return;
    
    studentList.innerHTML = students.map(student => `
      <div class="student-item-detailed" onclick="this.selectStudent('${student._id}')">
        <div class="student-avatar">${student.name.charAt(0).toUpperCase()}</div>
        <div class="student-info">
          <h4>${student.name}</h4>
          <p>${student.email}</p>
          <span class="last-active">Last active: ${this.dashboard.formatTime(student.lastActive)}</span>
        </div>
        <div class="student-status">
          <div class="activity-indicator ${student.status}"></div>
          <span class="status-text">${student.status}</span>
        </div>
      </div>
    `).join('');
  }

  updateContentLibrary(materials) {
    const contentGrid = document.getElementById('contentGrid');
    if (!contentGrid) return;
    
    contentGrid.innerHTML = materials.map(material => `
      <div class="content-item-card" onclick="this.selectContent('${material._id}')">
        <div class="content-icon">
          <i class="fas fa-${this.getContentIcon(material.category)}"></i>
        </div>
        <div class="content-info">
          <h4>${material.title}</h4>
          <p>${material.category}</p>
          <span class="content-size">${material.fileSizeFormatted}</span>
        </div>
        <div class="content-actions">
          <button class="btn btn-small" onclick="this.downloadContent('${material._id}')">
            <i class="fas fa-download"></i>
          </button>
          <button class="btn btn-small" onclick="this.editContent('${material._id}')">
            <i class="fas fa-edit"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  getContentIcon(category) {
    const icons = {
      'lecture': 'chalkboard-teacher',
      'assignment': 'tasks',
      'resource': 'book',
      'video': 'video',
      'document': 'file-alt',
      'presentation': 'file-powerpoint'
    };
    return icons[category] || 'file';
  }

  // Initialize calendar
  initializeCalendar() {
    const calendarEl = document.getElementById('scheduleCalendar');
    if (!calendarEl) return;
    
    // Initialize FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      events: `/api/calendar/class/${this.dashboard.currentClass._id}/events`,
      eventClick: (info) => {
        this.selectEvent(info.event);
      },
      dateClick: (info) => {
        this.createEventOnDate(info.date);
      }
    });
    
    calendar.render();
    this.calendar = calendar;
  }

  // Utility methods
  selectStudent(studentId) {
    // Implementation for selecting a student
    console.log('Selected student:', studentId);
  }

  selectContent(contentId) {
    // Implementation for selecting content
    console.log('Selected content:', contentId);
  }

  selectEvent(event) {
    // Implementation for selecting an event
    console.log('Selected event:', event);
  }
}

// Export for use in main dashboard
window.InstructorDashboardSections = InstructorDashboardSections;