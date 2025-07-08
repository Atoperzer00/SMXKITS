// Enhanced Instructor Dashboard Functionality
// This file contains advanced features for real-time monitoring and control

class InstructorDashboardEnhanced {
  constructor() {
    this.socket = null;
    this.currentClass = null;
    this.currentUser = null;
    this.isAdmin = false;
    this.activePolls = new Map();
    this.breakoutRooms = new Map();
    this.onlineStudents = new Set();
    this.activityStream = [];
    this.charts = {};
    
    this.init();
  }

  async init() {
    try {
      // Initialize Socket.IO connection
      this.initializeSocket();
      
      // Set up real-time event handlers
      this.setupRealTimeHandlers();
      
      // Initialize UI components
      this.initializeUI();
      
      console.log('✅ Enhanced dashboard initialized');
    } catch (error) {
      console.error('❌ Failed to initialize enhanced dashboard:', error);
    }
  }

  initializeSocket() {
    this.socket = io();
    
    // Authenticate socket connection
    this.socket.on('connect', () => {
      console.log('🔌 Socket connected');
      
      if (this.currentUser && this.currentClass) {
        this.socket.emit('authenticate', {
          userId: this.currentUser.id,
          role: this.currentUser.role,
          classId: this.currentClass._id
        });
        
        if (this.currentUser.role === 'instructor' || this.currentUser.role === 'admin') {
          this.socket.emit('join-instructor', {
            userId: this.currentUser.id,
            classId: this.currentClass._id
          });
        }
      }
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });
  }

  setupRealTimeHandlers() {
    // Student activity monitoring
    this.socket.on('student-activity', (data) => {
      this.handleStudentActivity(data);
    });

    // Real-time progress updates
    this.socket.on('student-progress-update', (data) => {
      this.handleProgressUpdate(data);
    });

    // New submissions
    this.socket.on('new-submission', (data) => {
      this.handleNewSubmission(data);
    });

    // Quiz submissions
    this.socket.on('quiz-submission', (data) => {
      this.handleQuizSubmission(data);
    });

    // Poll responses
    this.socket.on('poll-update', (data) => {
      this.handlePollUpdate(data);
    });

    // Viewer count updates for streaming
    this.socket.on('viewer-count', (data) => {
      this.updateViewerCount(data);
    });

    // Chat messages
    this.socket.on('new-message', (data) => {
      this.handleNewMessage(data);
    });

    // Typing indicators
    this.socket.on('user-typing', (data) => {
      this.handleTypingIndicator(data);
    });
  }

  initializeUI() {
    // Initialize charts
    this.initializeCharts();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start real-time updates
    this.startRealTimeUpdates();
  }

  initializeCharts() {
    // Progress Chart
    const progressCtx = document.getElementById('progressChart');
    if (progressCtx) {
      this.charts.progress = new Chart(progressCtx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Average Progress',
            data: [],
            borderColor: 'rgb(102, 126, 234)',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: '#ffffff'
              }
            }
          },
          scales: {
            x: {
              ticks: { color: '#b8c5d6' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
              ticks: { color: '#b8c5d6' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
          }
        }
      });
    }

    // Grade Distribution Chart
    const gradeCtx = document.getElementById('gradeChart');
    if (gradeCtx) {
      this.charts.grades = new Chart(gradeCtx, {
        type: 'doughnut',
        data: {
          labels: ['A', 'B', 'C', 'D', 'F'],
          datasets: [{
            data: [0, 0, 0, 0, 0],
            backgroundColor: [
              '#10b981',
              '#3b82f6',
              '#f59e0b',
              '#ef4444',
              '#6b7280'
            ]
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: '#ffffff'
              }
            }
          }
        }
      });
    }

    // Engagement Chart
    const engagementCtx = document.getElementById('engagementChart');
    if (engagementCtx) {
      this.charts.engagement = new Chart(engagementCtx, {
        type: 'bar',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Active Students',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(79, 172, 254, 0.8)'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: {
                color: '#ffffff'
              }
            }
          },
          scales: {
            x: {
              ticks: { color: '#b8c5d6' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            y: {
              ticks: { color: '#b8c5d6' },
              grid: { color: 'rgba(255, 255, 255, 0.1)' }
            }
          }
        }
      });
    }
  }

  setupEventListeners() {
    // Stream controls
    document.getElementById('startStreamExtended')?.addEventListener('click', () => {
      this.startStream();
    });

    document.getElementById('stopStreamExtended')?.addEventListener('click', () => {
      this.stopStream();
    });

    document.getElementById('shareScreenExtended')?.addEventListener('click', () => {
      this.shareScreen();
    });

    // Chat functionality
    document.getElementById('streamChatInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendChatMessage();
      }
    });

    // Poll creation
    document.getElementById('createPollBtn')?.addEventListener('click', () => {
      this.showCreatePollModal();
    });

    // Breakout rooms
    document.getElementById('createBreakoutBtn')?.addEventListener('click', () => {
      this.showCreateBreakoutModal();
    });

    // Bulk grading
    document.getElementById('bulkGradeBtn')?.addEventListener('click', () => {
      this.showBulkGradeModal();
    });

    // Export functionality
    document.getElementById('exportGradesBtn')?.addEventListener('click', () => {
      this.exportGrades();
    });
  }

  startRealTimeUpdates() {
    // Update activity stream every 30 seconds
    setInterval(() => {
      this.updateActivityStream();
    }, 30000);

    // Update charts every minute
    setInterval(() => {
      this.updateCharts();
    }, 60000);

    // Update online student count every 10 seconds
    setInterval(() => {
      this.updateOnlineStudents();
    }, 10000);
  }

  // Real-time event handlers
  handleStudentActivity(data) {
    console.log('👤 Student activity:', data);
    
    // Add to activity stream
    this.activityStream.unshift({
      type: 'activity',
      studentId: data.studentId,
      studentName: data.studentName,
      activity: data.activity,
      status: data.status,
      timestamp: data.timestamp
    });

    // Keep only last 100 activities
    if (this.activityStream.length > 100) {
      this.activityStream = this.activityStream.slice(0, 100);
    }

    // Update UI
    this.updateActivityDisplay();
    
    // Update student status in lists
    this.updateStudentStatus(data.studentId, data.status);
  }

  handleProgressUpdate(data) {
    console.log('📊 Progress update:', data);
    
    // Update progress displays
    this.updateStudentProgress(data.studentId, data.progress, data.completionPercentage);
    
    // Update charts
    this.updateProgressChart();
  }

  handleNewSubmission(data) {
    console.log('📝 New submission:', data);
    
    // Show notification
    this.showNotification('New Submission', `New submission from ${data.studentName}`, 'info');
    
    // Update grading queue
    this.updateGradingQueue();
    
    // Update submission count
    this.updateSubmissionCount();
  }

  handleQuizSubmission(data) {
    console.log('🧪 Quiz submission:', data);
    
    // Show notification
    this.showNotification('Quiz Completed', `${data.studentName} completed a quiz (Score: ${data.score})`, 'success');
    
    // Update grade distribution
    this.updateGradeDistribution();
  }

  handlePollUpdate(data) {
    console.log('📊 Poll update:', data);
    
    const poll = this.activePolls.get(data.pollId);
    if (poll) {
      poll.totalResponses = data.totalResponses;
      poll.responses = data.responses;
      
      // Update poll display
      this.updatePollDisplay(data.pollId);
    }
  }

  handleNewMessage(data) {
    console.log('💬 New message:', data);
    
    // Add to chat display
    this.addMessageToChat(data);
  }

  handleTypingIndicator(data) {
    // Show/hide typing indicator
    this.updateTypingIndicator(data.userId, data.userName, data.typing);
  }

  // Stream management
  async startStream() {
    try {
      const response = await fetch(`/api/streams/class/${this.currentClass._id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update UI
        document.getElementById('streamStatusIndicator').textContent = 'Live';
        document.getElementById('streamStatusIndicator').className = 'stream-status-indicator live';
        document.getElementById('startStreamExtended').style.display = 'none';
        document.getElementById('stopStreamExtended').style.display = 'inline-block';
        
        // Show stream URL
        document.getElementById('streamUrlDisplay').textContent = data.streamUrl;
        
        this.showNotification('Stream Started', 'Live stream is now active', 'success');
      } else {
        throw new Error('Failed to start stream');
      }
    } catch (error) {
      console.error('Failed to start stream:', error);
      this.showNotification('Stream Error', 'Failed to start stream', 'error');
    }
  }

  async stopStream() {
    try {
      const response = await fetch(`/api/streams/class/${this.currentClass._id}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        // Update UI
        document.getElementById('streamStatusIndicator').textContent = 'Offline';
        document.getElementById('streamStatusIndicator').className = 'stream-status-indicator offline';
        document.getElementById('startStreamExtended').style.display = 'inline-block';
        document.getElementById('stopStreamExtended').style.display = 'none';
        
        // Clear stream URL
        document.getElementById('streamUrlDisplay').textContent = 'Not active';
        
        this.showNotification('Stream Stopped', 'Live stream has ended', 'info');
      } else {
        throw new Error('Failed to stop stream');
      }
    } catch (error) {
      console.error('Failed to stop stream:', error);
      this.showNotification('Stream Error', 'Failed to stop stream', 'error');
    }
  }

  async shareScreen() {
    try {
      // Request screen sharing
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // Notify students
      this.socket.emit('request-screen-share', {
        classId: this.currentClass._id,
        instructorId: this.currentUser.id
      });

      this.showNotification('Screen Sharing', 'Screen sharing started', 'info');
    } catch (error) {
      console.error('Failed to share screen:', error);
      this.showNotification('Screen Share Error', 'Failed to start screen sharing', 'error');
    }
  }

  // Chat functionality
  sendChatMessage() {
    const input = document.getElementById('streamChatInput');
    const message = input.value.trim();
    
    if (!message) return;

    this.socket.emit('send-message', {
      classId: this.currentClass._id,
      message,
      type: 'broadcast',
      senderId: this.currentUser.id,
      senderName: this.currentUser.name
    });

    input.value = '';
  }

  addMessageToChat(data) {
    const chatMessages = document.getElementById('streamChatMessages');
    if (!chatMessages) return;

    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    messageElement.innerHTML = `
      <div class="message-header">
        <span class="sender-name">${data.senderName}</span>
        <span class="message-time">${new Date(data.timestamp).toLocaleTimeString()}</span>
      </div>
      <div class="message-content">${data.message}</div>
    `;

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // Poll management
  showCreatePollModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create Poll</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Question</label>
            <input type="text" id="pollQuestion" class="form-input" placeholder="Enter your question">
          </div>
          <div class="form-group">
            <label>Options</label>
            <div id="pollOptions">
              <input type="text" class="form-input poll-option" placeholder="Option 1">
              <input type="text" class="form-input poll-option" placeholder="Option 2">
            </div>
            <button type="button" class="btn btn-secondary" onclick="this.addPollOption()">Add Option</button>
          </div>
          <div class="form-group">
            <label>Duration (minutes)</label>
            <input type="number" id="pollDuration" class="form-input" value="5" min="1" max="60">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="this.createPoll()">Create Poll</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  async createPoll() {
    const question = document.getElementById('pollQuestion').value.trim();
    const optionInputs = document.querySelectorAll('.poll-option');
    const options = Array.from(optionInputs).map(input => input.value.trim()).filter(option => option);
    const duration = parseInt(document.getElementById('pollDuration').value);

    if (!question || options.length < 2) {
      this.showNotification('Invalid Poll', 'Please provide a question and at least 2 options', 'error');
      return;
    }

    try {
      const response = await fetch('/api/collaboration/polls/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          classId: this.currentClass._id,
          question,
          options,
          duration
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.activePolls.set(data.poll.id, data.poll);
        
        // Close modal
        document.querySelector('.modal-overlay').remove();
        
        this.showNotification('Poll Created', 'Poll sent to students', 'success');
      } else {
        throw new Error('Failed to create poll');
      }
    } catch (error) {
      console.error('Failed to create poll:', error);
      this.showNotification('Poll Error', 'Failed to create poll', 'error');
    }
  }

  // Breakout room management
  showCreateBreakoutModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Create Breakout Room</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Room Name</label>
            <input type="text" id="breakoutRoomName" class="form-input" placeholder="Enter room name">
          </div>
          <div class="form-group">
            <label>Select Students</label>
            <div id="studentSelection" class="student-selection">
              <!-- Students will be populated here -->
            </div>
          </div>
          <div class="form-group">
            <label>Duration (minutes)</label>
            <input type="number" id="breakoutDuration" class="form-input" value="15" min="5" max="120">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="this.createBreakoutRoom()">Create Room</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.populateStudentSelection();
  }

  async createBreakoutRoom() {
    const roomName = document.getElementById('breakoutRoomName').value.trim();
    const selectedStudents = Array.from(document.querySelectorAll('.student-checkbox:checked'))
      .map(checkbox => checkbox.value);
    const duration = parseInt(document.getElementById('breakoutDuration').value);

    if (!roomName || selectedStudents.length === 0) {
      this.showNotification('Invalid Room', 'Please provide a room name and select students', 'error');
      return;
    }

    try {
      const response = await fetch('/api/collaboration/breakout-rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          classId: this.currentClass._id,
          roomName,
          studentIds: selectedStudents,
          duration
        })
      });

      if (response.ok) {
        const data = await response.json();
        this.breakoutRooms.set(data.breakoutRoom.id, data.breakoutRoom);
        
        // Close modal
        document.querySelector('.modal-overlay').remove();
        
        this.showNotification('Breakout Room Created', `${selectedStudents.length} students moved to ${roomName}`, 'success');
      } else {
        throw new Error('Failed to create breakout room');
      }
    } catch (error) {
      console.error('Failed to create breakout room:', error);
      this.showNotification('Breakout Room Error', 'Failed to create breakout room', 'error');
    }
  }

  // Bulk grading
  showBulkGradeModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Bulk Grade Submissions</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Select Submissions</label>
            <div id="submissionSelection" class="submission-selection">
              <!-- Submissions will be populated here -->
            </div>
          </div>
          <div class="form-group">
            <label>Grade</label>
            <input type="number" id="bulkGrade" class="form-input" min="0" max="100" placeholder="Enter grade">
          </div>
          <div class="form-group">
            <label>Feedback</label>
            <textarea id="bulkFeedback" class="form-textarea" placeholder="Enter feedback (optional)"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="this.applyBulkGrade()">Apply Grade</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.populateSubmissionSelection();
  }

  async applyBulkGrade() {
    const selectedSubmissions = Array.from(document.querySelectorAll('.submission-checkbox:checked'))
      .map(checkbox => checkbox.value);
    const grade = parseFloat(document.getElementById('bulkGrade').value);
    const feedback = document.getElementById('bulkFeedback').value.trim();

    if (selectedSubmissions.length === 0 || isNaN(grade)) {
      this.showNotification('Invalid Input', 'Please select submissions and enter a valid grade', 'error');
      return;
    }

    try {
      const response = await fetch('/api/assignments/bulk-grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          submissionIds: selectedSubmissions,
          grade,
          feedback
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Close modal
        document.querySelector('.modal-overlay').remove();
        
        this.showNotification('Bulk Grading Complete', data.message, 'success');
        
        // Refresh grading queue
        this.updateGradingQueue();
      } else {
        throw new Error('Failed to apply bulk grade');
      }
    } catch (error) {
      console.error('Failed to apply bulk grade:', error);
      this.showNotification('Bulk Grading Error', 'Failed to apply bulk grade', 'error');
    }
  }

  // Export functionality
  async exportGrades() {
    try {
      const response = await fetch(`/api/grades/class/${this.currentClass._id}/export?format=csv`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grades-${this.currentClass.name}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification('Export Complete', 'Grades exported successfully', 'success');
      } else {
        throw new Error('Failed to export grades');
      }
    } catch (error) {
      console.error('Failed to export grades:', error);
      this.showNotification('Export Error', 'Failed to export grades', 'error');
    }
  }

  // UI update methods
  updateActivityDisplay() {
    const timeline = document.getElementById('studentActivityTimeline');
    if (!timeline) return;

    timeline.innerHTML = this.activityStream.slice(0, 20).map(activity => `
      <div class="activity-item">
        <div class="activity-icon">
          <i class="fas fa-${this.getActivityIcon(activity.activity)}"></i>
        </div>
        <div class="activity-content">
          <div class="activity-text">
            <strong>${activity.studentName}</strong> ${activity.activity}
          </div>
          <div class="activity-time">${this.formatTime(activity.timestamp)}</div>
        </div>
      </div>
    `).join('');
  }

  updateViewerCount(data) {
    const viewerCountElements = document.querySelectorAll('#viewerCountExtended, #viewerCountBadge');
    viewerCountElements.forEach(element => {
      if (element) element.textContent = data.count;
    });
  }

  updateCharts() {
    // Update progress chart with real data
    this.updateProgressChart();
    
    // Update grade distribution
    this.updateGradeDistribution();
    
    // Update engagement chart
    this.updateEngagementChart();
  }

  async updateProgressChart() {
    try {
      const response = await fetch(`/api/progress/class/${this.currentClass._id}/detailed`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Calculate average progress over time
        const progressData = data.students.map(student => student.overallProgress);
        const averageProgress = progressData.reduce((sum, progress) => sum + progress, 0) / progressData.length;
        
        // Update chart
        if (this.charts.progress) {
          this.charts.progress.data.labels.push(new Date().toLocaleDateString());
          this.charts.progress.data.datasets[0].data.push(averageProgress);
          
          // Keep only last 30 data points
          if (this.charts.progress.data.labels.length > 30) {
            this.charts.progress.data.labels.shift();
            this.charts.progress.data.datasets[0].data.shift();
          }
          
          this.charts.progress.update();
        }
      }
    } catch (error) {
      console.error('Failed to update progress chart:', error);
    }
  }

  // Utility methods
  getActivityIcon(activity) {
    const icons = {
      'logged in': 'sign-in-alt',
      'started lesson': 'play',
      'completed lesson': 'check',
      'submitted assignment': 'paper-plane',
      'joined stream': 'video',
      'left stream': 'video-slash'
    };
    return icons[activity] || 'user';
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }

  showNotification(title, message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
      <button class="notification-close" onclick="this.parentElement.remove()">×</button>
    `;

    // Add to notification container
    let container = document.getElementById('notificationContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notificationContainer';
      container.className = 'notification-container';
      document.body.appendChild(container);
    }

    container.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // Public methods for external access
  setCurrentUser(user) {
    this.currentUser = user;
    this.isAdmin = user.role === 'admin';
  }

  setCurrentClass(classData) {
    this.currentClass = classData;
  }
}

// Initialize enhanced dashboard
window.instructorDashboardEnhanced = new InstructorDashboardEnhanced();