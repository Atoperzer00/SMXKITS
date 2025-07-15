import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('Student');
  const [studentDay, setStudentDay] = useState('Day 3/7');
  const [currentDate, setCurrentDate] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [showInstructorModal, setShowInstructorModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  const loadNotifications = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) return;

      const response = await fetch('/api/direct-messages/conversations', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const conversations = await response.json();
        // Filter conversations with unread messages for notifications
        const unreadConversations = conversations.filter(conv => conv.unreadCount > 0);
        setNotificationCount(unreadConversations.length);
      } else {
        console.error('Failed to load notifications');
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadRecentMessages = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
        console.log('No user token found');
        return;
      }

      const response = await fetch('/api/direct-messages/conversations', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const conversations = await response.json();
        const totalUnread = conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
      } else {
        console.error('Failed to load conversations');
      }
    } catch (error) {
      console.error('Error loading recent messages:', error);
    }
  };

  useEffect(() => {
    // Check authentication like original
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role) {
      navigate('/login.html');
      return;
    }

    // Load student data
    const userName = localStorage.getItem('userName') || 'Student';
    const day = localStorage.getItem('studentDay') || 'Day 3/7';
    
    setStudentName(userName);
    setStudentDay(day);

    // Set current date
    const today = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(today.toLocaleDateString('en-US', options));

    // Load initial message counts
    loadRecentMessages();
    loadNotifications();

    console.log('✅ Authentication verified - loading student dashboard');
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    navigate('/login.html');
  };

  const goToFeedback = () => {
    navigate('/feedback.html');
  };

  const toggleNotifications = async () => {
    const isOpening = !showNotifications;
    setShowNotifications(isOpening);
    setShowInbox(false);
    
    if (isOpening) {
      await loadNotifications();
    }
  };

  const toggleInbox = async () => {
    const isOpening = !showInbox;
    setShowInbox(isOpening);
    setShowNotifications(false);
    
    if (isOpening) {
      await loadRecentMessages();
    }
  };

  const openConversation = (userId, userName) => {
    localStorage.setItem('selectedContact', JSON.stringify({
      id: userId,
      name: userName
    }));
    
    setShowInbox(false);
    setShowNotifications(false);
    
    navigate('/student-messenger.html');
  };

  const openInstructorModal = (instructorId) => {
    // Sample instructor data - this would come from your backend
    const instructors = {
      instructor1: {
        name: "Dr. Sarah Johnson",
        title: "Senior Intelligence Analyst",
        avatar: "/instructor1.jpg",
        bio: "Dr. Johnson has over 15 years of experience in intelligence analysis and has worked with various government agencies. She specializes in pattern recognition and threat assessment."
      },
      instructor2: {
        name: "Major Mike Rodriguez",
        title: "Cybersecurity Specialist",
        avatar: "/instructor2.jpg", 
        bio: "Major Rodriguez brings extensive military experience in cybersecurity and information warfare. He has led multiple training programs and specializes in defensive cyber operations."
      }
    };
    
    setSelectedInstructor(instructors[instructorId]);
    setShowInstructorModal(true);
  };

  const closeInstructorModal = () => {
    setShowInstructorModal(false);
    setSelectedInstructor(null);
  };

  const getTodayEvents = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const weeklySchedule = {
      1: [ // Monday
        {
          hour: 9,
          title: "Keyboard Training Session",
          description: "Improve typing speed and accuracy with military terminology",
          type: "training"
        },
        {
          hour: 15,
          title: "Live PED Exercise",
          description: "Real-time pattern of life exercises and mission scenarios",
          type: "training"
        }
      ],
      2: [ // Tuesday
        {
          hour: 14,
          title: "Screener Training",
          description: "Advanced screening techniques and threat identification",
          type: "training"
        }
      ],
      3: [ // Wednesday
        {
          hour: 10,
          title: "IA Training Exam",
          description: "Intelligence analysis assessment",
          type: "exam"
        }
      ],
      4: [ // Thursday
        {
          hour: 13,
          title: "Assignment Review",
          description: "Review completed assignments and prepare submissions",
          type: "meeting"
        }
      ],
      5: [ // Friday
        {
          hour: 13,
          title: "Weekly Progress Review",
          description: "Meet with instructor to discuss weekly progress",
          type: "meeting"
        }
      ]
    };
    
    return weeklySchedule[dayOfWeek] || [];
  };

  const formatHour = (hour) => {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  const openTimeBlockDetails = (hour, events) => {
    const timeStr = formatHour(hour);
    
    if (events.length === 0) {
      alert(`${timeStr}\n\nNo scheduled activities for this time slot.\n\nClick "View Full Calendar" to see your complete schedule or add new events.`);
    } else {
      let message = `${timeStr}\n\n`;
      events.forEach((event, index) => {
        message += `${event.title}\n${event.description}\nType: ${event.type.toUpperCase()}`;
        if (index < events.length - 1) message += '\n\n';
      });
      message += '\n\nClick "View Full Calendar" to manage your schedule.';
      alert(message);
    }
  };

  const generateScheduleTimeline = () => {
    const startHour = 7; // 7 AM
    const endHour = 18; // 6 PM
    const todayEvents = getTodayEvents();
    const timeline = [];
    
    for (let hour = startHour; hour <= endHour; hour++) {
      const hourEvents = todayEvents.filter(event => event.hour === hour);
      const hasEvents = hourEvents.length > 0;
      
      timeline.push(
        <div 
          key={hour}
          className={`schedule-hour ${hasEvents ? 'has-event' : ''}`}
          onClick={() => openTimeBlockDetails(hour, hourEvents)}
        >
          <div className="schedule-time">
            {formatHour(hour)}
          </div>
          <div className="schedule-content">
            {hasEvents ? (
              hourEvents.map((event, index) => (
                <div key={index} className="schedule-event">
                  <div className="event-title">{event.title}</div>
                  <div className="event-description">{event.description}</div>
                  <div className={`event-type ${event.type}`}>{event.type}</div>
                </div>
              ))
            ) : (
              <div className="schedule-empty">No scheduled activities</div>
            )}
          </div>
        </div>
      );
    }
    
    return timeline;
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <img src="/SMXKITS.png" alt="SMXKITS Logo" className="admin-logo" />
        <ul className="admin-nav">
          <li className="active"><i className="fas fa-tachometer-alt"></i> Dashboard</li>
          <li onClick={() => navigate('/mission-links.html')}><i className="fas fa-rocket"></i> Live PED Exercise</li>
          <li onClick={() => navigate('/keyboard-training.html')}><i className="fas fa-keyboard"></i> Keyboard Training</li>
          <li onClick={() => navigate('/Screener Training.html')}><i className="fas fa-user-shield"></i> Screener Training</li>
          <li onClick={() => navigate('/IA Training.html')}><i className="fas fa-satellite-dish"></i> IA Training</li>
          <li onClick={() => navigate('/course-content.html')}><i className="fas fa-book-open"></i> Course Content</li>
          <li onClick={() => navigate('/student-grading.html')}><i className="fas fa-clipboard-list"></i> Grading</li>
          <li onClick={() => navigate('/schedule.html')}><i className="fas fa-calendar-alt"></i> Schedule</li>
          <li onClick={goToFeedback}><i className="fas fa-comments"></i> Feedback</li>
          <li onClick={logout}><i className="fas fa-sign-out-alt"></i> Logout</li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        {/* Header Section */}
        <header className="dashboard-header fade-in">
          <div>
            <h1 className="dashboard-title">Student Dashboard</h1>
            <p style={{color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem'}}>
              Welcome back! Access live training, modules, progress, and instructor info here.
            </p>
          </div>
          <div className="header-actions">
            {/* Notification Bell */}
            <div className="notification-bubble" onClick={toggleNotifications}>
              <i className="fas fa-bell"></i>
              {notificationCount > 0 && (
                <div className="notification-badge">{notificationCount}</div>
              )}
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="notification-dropdown">
                  <div onClick={() => navigate('/student-messenger.html')} className="dropdown-header clickable">
                    <i className="fas fa-bell"></i>
                    Notifications
                  </div>
                  <div className="inbox-messages">
                    <div className="dropdown-item no-messages">No notifications to display</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Inbox */}
            <div className="inbox-bubble" onClick={toggleInbox}>
              <i className="fas fa-envelope"></i>
              {unreadCount > 0 && (
                <div className="notification-badge">{unreadCount}</div>
              )}
              
              {/* Inbox Dropdown */}
              {showInbox && (
                <div className="inbox-dropdown">
                  <div onClick={() => navigate('/student-messenger.html')} className="dropdown-header clickable">
                    <i className="fas fa-inbox"></i>
                    Messages
                  </div>
                  <div className="inbox-messages">
                    <div className="dropdown-item no-messages">No messages to display</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* User Info */}
            <div className="user-info">
              <div className="user-avatar">
                <i className="fas fa-user"></i>
              </div>
              <div>
                <div style={{fontWeight: 600}}>{studentName}</div>
                <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>{studentDay}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Training Modules Section */}
        <section className="fade-in stagger-1">
          <h2 className="section-title">
            <i className="fas fa-graduation-cap"></i>
            Training Modules
          </h2>
          <div className="tools-grid">
            <div className="tool-card" onClick={() => navigate('/mission-links.html')}>
              <div className="tool-icon"><i className="fas fa-rocket"></i></div>
              <h3 className="tool-title">Live PED Exercise</h3>
              <p className="tool-description">Access real-time pattern of life exercises and mission scenarios.</p>
            </div>
            
            <div className="tool-card" onClick={() => navigate('/keyboard-training.html')}>
              <div className="tool-icon"><i className="fas fa-keyboard"></i></div>
              <h3 className="tool-title">Keyboard Training</h3>
              <p className="tool-description">Improve typing speed and accuracy with specialized military terminology.</p>
            </div>
            
            <div className="tool-card" onClick={() => navigate('/Screener Training.html')}>
              <div className="tool-icon"><i className="fas fa-user-shield"></i></div>
              <h3 className="tool-title">Screener Training</h3>
              <p className="tool-description">Learn advanced screening techniques and threat identification protocols.</p>
            </div>
            
            <div className="tool-card" onClick={() => navigate('/IA Training.html')}>
              <div className="tool-icon"><i className="fas fa-satellite-dish"></i></div>
              <h3 className="tool-title">IA Training</h3>
              <p className="tool-description">Intelligence analysis training with real-world scenarios and case studies.</p>
            </div>
          </div>
        </section>

        {/* Progress & Tools Section */}
        <section className="fade-in stagger-2">
          <h2 className="section-title">
            <i className="fas fa-chart-line"></i>
            Progress & Tools
          </h2>
          <div className="tools-grid">
            <div className="tool-card" onClick={() => navigate('/student-grading.html')}>
              <div className="tool-icon"><i className="fas fa-clipboard-list"></i></div>
              <h3 className="tool-title">Grading & Assessment</h3>
              <p className="tool-description">View your grades, performance metrics, and instructor feedback.</p>
            </div>
            
            <div className="tool-card" onClick={() => navigate('/student-messenger.html')}>
              <div className="tool-icon"><i className="fas fa-comments"></i></div>
              <h3 className="tool-title">Student Messenger</h3>
              <p className="tool-description">Send messages to instructors, ask questions, and communicate with your training team.</p>
            </div>
          </div>
        </section>

        {/* Instructor Information Section */}
        <section className="fade-in stagger-3">
          <h2 className="section-title">
            <i className="fas fa-chalkboard-teacher"></i>
            Your Instructors
          </h2>
          <div id="instructor-list">
            <div className="instructor-bubble" onClick={() => openInstructorModal('instructor1')}>
              <img src="/instructor1.jpg" alt="Dr. Sarah Johnson" onError={(e) => {e.target.src = '/default-avatar.svg'}} />
              <div>Dr. Sarah Johnson</div>
            </div>
            <div className="instructor-bubble" onClick={() => openInstructorModal('instructor2')}>
              <img src="/instructor2.jpg" alt="Major Mike Rodriguez" onError={(e) => {e.target.src = '/default-avatar.svg'}} />
              <div>Major Mike Rodriguez</div>
            </div>
          </div>
        </section>

        {/* Daily Schedule Section */}
        <section className="fade-in stagger-4">
          <h2 className="section-title">
            <i className="fas fa-clock"></i>
            Today's Schedule
          </h2>
          <div className="daily-schedule-container">
            <div className="schedule-header">
              <div className="schedule-date">
                <i className="fas fa-calendar-day"></i>
                <span>{currentDate}</span>
              </div>
              <button className="schedule-calendar-btn" onClick={() => navigate('/schedule.html')}>
                <i className="fas fa-calendar-alt"></i>
                View Full Calendar
              </button>
            </div>
            <div className="schedule-timeline" id="scheduleTimeline">
              {generateScheduleTimeline()}
            </div>
          </div>
        </section>
      </main>

      {/* Instructor Modal */}
      {showInstructorModal && selectedInstructor && (
        <div className="instructor-modal active" onClick={closeInstructorModal}>
          <div className="instructor-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="instructor-modal-close" onClick={closeInstructorModal}>
              <i className="fas fa-times"></i>
            </button>
            <div className="instructor-bio-header">
              <img 
                src={selectedInstructor.avatar} 
                alt={selectedInstructor.name}
                className="instructor-bio-avatar"
                onError={(e) => {e.target.src = '/default-avatar.svg'}}
              />
              <div>
                <div className="instructor-bio-name">{selectedInstructor.name}</div>
                <div className="instructor-bio-title">{selectedInstructor.title}</div>
              </div>
            </div>
            <div className="instructor-bio-content">
              {selectedInstructor.bio}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;