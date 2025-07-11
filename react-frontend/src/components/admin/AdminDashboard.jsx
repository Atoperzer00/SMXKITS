import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showInbox, setShowInbox] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalStudents: 0,
    activeClasses: 0,
    completionRate: 0,
    achievements: 0,
    classProgress: []
  });

  const [messages] = useState([
    {
      id: 'sarah-johnson',
      sender: 'Sarah Johnson',
      preview: 'Quick question about the upcoming training session...',
      time: '2 minutes ago',
      unread: true
    },
    {
      id: 'mike-chen',
      sender: 'Mike Chen',
      preview: 'Can we schedule a group meeting for next week?',
      time: '15 minutes ago',
      unread: true
    },
    {
      id: 'training-team',
      sender: 'Training Team',
      preview: 'New course materials have been uploaded...',
      time: '1 hour ago',
      unread: true
    },
    {
      id: 'admin-support',
      sender: 'Admin Support',
      preview: 'System maintenance scheduled for this weekend',
      time: '3 hours ago',
      unread: false
    },
    {
      id: 'lisa-rodriguez',
      sender: 'Lisa Rodriguez',
      preview: 'Thank you for the excellent training session!',
      time: 'Yesterday',
      unread: false
    }
  ]);

  const [upcomingSessions] = useState([
    {
      title: 'Alpha Class - Module 3',
      date: 'October 9, 2023',
      time: '09:00 - 12:00',
      type: 'primary'
    },
    {
      title: 'Bravo Class - Assessment',
      date: 'October 10, 2023',
      time: '14:00 - 16:00',
      type: 'secondary'
    },
    {
      title: 'Charlie Class - Introduction',
      date: 'October 11, 2023',
      time: '10:00 - 11:30',
      type: 'accent'
    }
  ]);

  useEffect(() => {
    // Check authentication and admin role
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role) {
      navigate('/login.html');
      return;
    } else if (role !== 'admin' && role !== 'instructor') {
      alert('Access denied. Admin privileges required.');
      navigate('/dashboard.html');
      return;
    }

    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load dashboard statistics
      const [studentsRes, classesRes] = await Promise.all([
        fetch('/api/users?role=student', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/classes', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (studentsRes.ok && classesRes.ok) {
        const students = await studentsRes.json();
        const classes = await classesRes.json();
        
        // Calculate completion rate (mock calculation)
        const completionRate = students.length > 0 ? Math.round((students.filter(s => s.status).length / students.length) * 100) : 0;
        
        setDashboardData({
          totalStudents: students.length,
          activeClasses: classes.filter(c => c.status).length,
          completionRate,
          achievements: Math.floor(students.length * 0.3), // Mock achievements
          classProgress: classes.map(c => ({
            name: c.name,
            progress: Math.floor(Math.random() * 40) + 60 // Mock progress 60-100%
          }))
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('classId');
    localStorage.removeItem('studentDay');
    navigate('/login.html');
  };

  const openInstructorChat = (contactId) => {
    localStorage.setItem('selectedContact', contactId);
    localStorage.setItem('userRole', 'instructor');
    navigate('/instructor-messaging.html');
  };

  const toolCards = [
    {
      icon: 'fas fa-video',
      title: 'Instructor Stream Mode',
      description: 'Advanced streaming interface with full instructor controls and real-time student interaction capabilities.',
      onClick: () => window.open('/Stream Mode.html', '_blank')
    },
    {
      icon: 'fas fa-comments',
      title: 'KitComm',
      description: 'Comprehensive communication hub for instructor-student messaging and collaboration.',
      onClick: () => window.open('/kitcomm.html', '_blank')
    },
    {
      icon: 'fas fa-clipboard-list',
      title: 'Operations Log',
      description: 'Monitor system activities, track user actions, and maintain operational oversight.',
      onClick: () => window.open('/OpsLog.html', '_blank')
    },
    {
      icon: 'fas fa-cloud-upload-alt',
      title: 'Upload Templates',
      description: 'Manage and upload course templates, resources, and educational materials.',
      onClick: () => alert('Upload Templates functionality coming soon!'),
      badge: 'Needs link'
    },
    {
      icon: 'fas fa-keyboard',
      title: 'Edit Typing Tests',
      description: 'Create, modify, and manage typing assessments and skill evaluation tests.',
      onClick: () => navigate('/edit-typing-tests.html')
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Instructor Grading',
      description: 'Grade student submissions, provide feedback, and manage exercise assessments with interactive grading tools.',
      onClick: () => navigate('/instructor-grading.html')
    },
    {
      icon: 'fas fa-map',
      title: 'TrackPoint Map (Enhanced)',
      description: 'Interactive tactical mapping system with enhanced diagnostics, improved tile loading, and real-time debug panel for mission planning.',
      onClick: () => navigate('/Trackpoint-fixed.html'),
      badge: 'Fixed'
    }
  ];

  const quickActions = [
    {
      icon: 'fas fa-users-cog',
      title: 'Users & Roles',
      onClick: () => navigate('/users-roles.html')
    },
    {
      icon: 'fas fa-plus-circle',
      title: 'Add New Class',
      onClick: () => navigate('/add-class.html')
    },
    {
      icon: 'fas fa-user-plus',
      title: 'Add New Student',
      onClick: () => navigate('/add-student.html')
    },
    {
      icon: 'fas fa-clipboard-check',
      title: 'Manage Attendance',
      badge: 'Needs link'
    },
    {
      icon: 'fas fa-inbox',
      title: 'Instructor Inbox',
      badge: '3'
    }
  ];

  if (loading) {
    return (
      <div className="admin-layout">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <img src="/SMXKITS.png" alt="SMX KITS Logo" className="admin-logo" />
        
        <nav>
          <div className="nav-item">
            <a href="#" className="nav-link active">
              <i className="fas fa-tachometer-alt"></i>
              Dashboard
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/classes.html')} className="nav-link">
              <i className="fas fa-users"></i>
              Classes
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/add-class.html')} className="nav-link">
              <i className="fas fa-plus"></i>
              Add Class
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/add-student.html')} className="nav-link">
              <i className="fas fa-user-plus"></i>
              Add Student
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/users-roles.html')} className="nav-link">
              <i className="fas fa-user-cog"></i>
              Users & Roles
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={logout} className="nav-link">
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </a>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        {/* Header */}
        <header className="dashboard-header fade-in">
          <div>
            <h1 className="dashboard-title">SMX KITS - Instructor Command Center</h1>
            <p className="dashboard-subtitle">
              Administrative control panel for managing users, courses, and system settings.
            </p>
          </div>
          
          <div className="header-actions">
            {/* Notifications */}
            <div className="notification-bubble" onClick={() => setShowNotifications(!showNotifications)}>
              <i className="fas fa-bell"></i>
              <div className="notification-badge">3</div>
              
              {showNotifications && (
                <div className="notification-dropdown active">
                  <div className="inbox-header">
                    <i className="fas fa-bell"></i>
                    Notifications (3)
                  </div>
                  <div className="inbox-messages">
                    <div className="inbox-message">
                      <div className="message-sender">System Alert</div>
                      <div className="message-preview">New student registration pending approval</div>
                      <div className="message-time">5 minutes ago</div>
                    </div>
                    <div className="inbox-message">
                      <div className="message-sender">Course Update</div>
                      <div className="message-preview">Module 3 materials have been updated</div>
                      <div className="message-time">1 hour ago</div>
                    </div>
                    <div className="inbox-message">
                      <div className="message-sender">Maintenance</div>
                      <div className="message-preview">Scheduled maintenance this weekend</div>
                      <div className="message-time">2 hours ago</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Inbox */}
            <div className="inbox-bubble" onClick={() => setShowInbox(!showInbox)}>
              <i className="fas fa-envelope"></i>
              <div className="notification-badge">5</div>
              
              {showInbox && (
                <div className="inbox-dropdown active">
                  <div className="inbox-header">
                    <i className="fas fa-inbox"></i>
                    Messages (5)
                  </div>
                  <div className="inbox-messages">
                    {messages.map(message => (
                      <div 
                        key={message.id}
                        className={`inbox-message ${message.unread ? 'unread' : ''}`}
                        onClick={() => openInstructorChat(message.id)}
                      >
                        <div className="message-sender">{message.sender}</div>
                        <div className="message-preview">{message.preview}</div>
                        <div className="message-time">{message.time}</div>
                      </div>
                    ))}
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
                <div style={{fontWeight: 600}}>{localStorage.getItem('userName') || 'Instructor'}</div>
                <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Admin Access</div>
              </div>
            </div>
          </div>
        </header>

        {/* Essential Tools Section */}
        <section className="essential-tools fade-in stagger-1">
          <h2 className="section-title">
            <i className="fas fa-tools"></i>
            Essential Instructor Tools
          </h2>
          <div className="tools-grid">
            {toolCards.map((tool, index) => (
              <div key={index} className="tool-card" onClick={tool.onClick}>
                <div className="tool-icon"><i className={tool.icon}></i></div>
                <h3 className="tool-title">
                  {tool.title}
                  {tool.badge && (
                    <span style={{fontSize: '0.7rem', color: '#f093fb', fontWeight: 400}}>
                      ({tool.badge})
                    </span>
                  )}
                </h3>
                <p className="tool-description">{tool.description}</p>
                {tool.badge === 'Fixed' && <div className="badge">Fixed</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions Grid */}
        <section className="fade-in stagger-2">
          <h2 className="section-title">
            <i className="fas fa-bolt"></i>
            Quick Actions
          </h2>
          <div className="quick-actions">
            {quickActions.map((action, index) => (
              <div key={index} className="action-card" onClick={action.onClick}>
                <div className="action-icon"><i className={action.icon}></i></div>
                <div className="action-title">
                  {action.title}
                  {action.badge && action.badge !== '3' && (
                    <span style={{fontSize: '0.7rem', color: '#f093fb', fontWeight: 400}}>
                      (Needs link)
                    </span>
                  )}
                </div>
                {action.badge === '3' && <span className="badge">3</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Dashboard Widgets */}
        <section className="dashboard-widgets fade-in stagger-4">
          <div className="widget-card">
            <h3 className="widget-title">
              <i className="fas fa-chart-line"></i>
              Analytics & Progress
            </h3>
            <div style={{marginTop: '1.5rem'}}>
              <div className="analytics-container">
                <h4 className="analytics-title">Student Progress Overview</h4>
                
                {dashboardData.classProgress.map((classItem, index) => (
                  <div key={index} className="progress-item">
                    <div className="progress-header">
                      <span>{classItem.name}</span>
                      <span>{classItem.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{width: `${classItem.progress}%`}}
                      ></div>
                    </div>
                  </div>
                ))}
                
                <div className="analytics-summary">
                  <span>Total Students: {dashboardData.totalStudents}</span>
                  <span>Active Classes: {dashboardData.activeClasses}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="widget-card">
            <h3 className="widget-title">
              <i className="fas fa-clock"></i>
              Upcoming Sessions
            </h3>
            <div style={{marginTop: '1.5rem'}}>
              {upcomingSessions.map((session, index) => (
                <div key={index} className={`session-item session-${session.type}`}>
                  <div className="session-title">{session.title}</div>
                  <div className="session-details">
                    <i className="fas fa-calendar"></i> {session.date} • {session.time}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics Cards */}
        <section className="stats-section fade-in stagger-3">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-content">
                <h3>Total Students</h3>
                <div className="stat-number">{dashboardData.totalStudents}</div>
                <div className="stat-change positive">+12% from last month</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-chalkboard-teacher"></i>
              </div>
              <div className="stat-content">
                <h3>Active Classes</h3>
                <div className="stat-number">{dashboardData.activeClasses}</div>
                <div className="stat-change positive">+2 new classes</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="stat-content">
                <h3>Completion Rate</h3>
                <div className="stat-number">{dashboardData.completionRate}%</div>
                <div className="stat-change positive">+5% improvement</div>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">
                <i className="fas fa-trophy"></i>
              </div>
              <div className="stat-content">
                <h3>Achievements</h3>
                <div className="stat-number">{dashboardData.achievements}</div>
                <div className="stat-change positive">+8 this week</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;