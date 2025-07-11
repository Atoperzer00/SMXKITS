import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './InstructorDashboard.css';

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [streamStatus, setStreamStatus] = useState('offline');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    completedAssignments: 0,
    pendingGrades: 0
  });
  const [messagingOpen, setMessagingOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Check authentication and instructor role
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('userName');
    
    if (!token || !role) {
      navigate('/login.html');
      return;
    } else if (role !== 'instructor' && role !== 'admin') {
      alert('Access denied. Instructor privileges required.');
      navigate('/dashboard.html');
      return;
    }

    setUserName(name || 'Instructor');
    setUserRole(role);
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        fetchClasses(),
        fetchStudents(),
        fetchStats(),
        fetchNotifications()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const classData = await response.json();
        setClasses(classData);
        if (classData.length > 0 && !selectedClass) {
          setSelectedClass(classData[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      // Fallback data
      const fallbackClasses = [
        { _id: '1', name: 'Alpha Squadron', students: 12, active: true },
        { _id: '2', name: 'Bravo Team', students: 8, active: true }
      ];
      setClasses(fallbackClasses);
      setSelectedClass(fallbackClasses[0]);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users?role=student', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const studentData = await response.json();
        const studentsWithActivity = studentData.map(student => ({
          ...student,
          status: Math.random() > 0.3 ? 'online' : Math.random() > 0.5 ? 'away' : 'offline',
          lastActivity: new Date(Date.now() - Math.random() * 3600000).toLocaleTimeString()
        }));
        setStudents(studentsWithActivity);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      // Fallback data
      setStudents([
        { _id: '1', name: 'John Smith', email: 'john@example.com', status: 'online', lastActivity: '2:30 PM' },
        { _id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', status: 'away', lastActivity: '2:15 PM' },
        { _id: '3', name: 'Mike Davis', email: 'mike@example.com', status: 'offline', lastActivity: '1:45 PM' }
      ]);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/instructor-dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Fallback data
      setStats({
        totalStudents: 24,
        activeStudents: 18,
        completedAssignments: 156,
        pendingGrades: 12
      });
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const notificationData = await response.json();
        setNotifications(notificationData);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback data
      setNotifications([
        { id: '1', message: 'New assignment submitted by John Smith', time: '5 min ago', type: 'assignment' },
        { id: '2', message: 'Class Alpha Squadron starts in 30 minutes', time: '25 min ago', type: 'schedule' }
      ]);
    }
  };

  const handleStreamToggle = () => {
    setStreamStatus(streamStatus === 'offline' ? 'live' : 'offline');
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  const handleClassChange = (classId) => {
    const selectedClassData = classes.find(cls => cls._id === classId);
    setSelectedClass(selectedClassData);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    navigate('/login.html');
  };

  if (loading) {
    return (
      <div className="instructor-dashboard">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading instructor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <img src="/SMXKITS.png" alt="SMX KITS Logo" className="logo" />
        
        <nav className="nav-menu">
          <div 
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => handleSectionChange('overview')}
          >
            <i className="fas fa-tachometer-alt"></i>
            Overview
          </div>
          <div 
            className={`nav-item ${activeSection === 'stream' ? 'active' : ''}`}
            onClick={() => handleSectionChange('stream')}
          >
            <i className="fas fa-video"></i>
            Live Stream
          </div>
          <div 
            className={`nav-item ${activeSection === 'students' ? 'active' : ''}`}
            onClick={() => handleSectionChange('students')}
          >
            <i className="fas fa-users"></i>
            Students
          </div>
          <div 
            className={`nav-item ${activeSection === 'grading' ? 'active' : ''}`}
            onClick={() => navigate('/instructor-grading.html')}
          >
            <i className="fas fa-clipboard-check"></i>
            Grading
          </div>
          <div 
            className={`nav-item ${activeSection === 'content' ? 'active' : ''}`}
            onClick={() => handleSectionChange('content')}
          >
            <i className="fas fa-book"></i>
            Content
          </div>
          <div 
            className={`nav-item ${activeSection === 'messaging' ? 'active' : ''}`}
            onClick={() => navigate('/instructor-messaging.html')}
          >
            <i className="fas fa-comments"></i>
            Messaging
          </div>
          <div 
            className="nav-item"
            onClick={() => navigate('/schedule.html')}
          >
            <i className="fas fa-calendar"></i>
            Schedule
          </div>
          <div 
            className="nav-item"
            onClick={logout}
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </div>
        </nav>

        <div className="user-info">
          <div className="user-avatar">
            {getInitials(userName)}
          </div>
          <div className="user-details">
            <h4>{userName}</h4>
            <span>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-left">
            <h1>Instructor Command Center</h1>
            <p className="header-subtitle">
              Manage your classes, monitor student progress, and deliver engaging content
            </p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setMessagingOpen(!messagingOpen)}
            >
              <i className="fas fa-envelope"></i>
              Messages
            </button>
            <button className="btn btn-primary">
              <i className="fas fa-bell"></i>
              Notifications ({notifications.length})
            </button>
          </div>
        </header>

        {/* Class Tabs (if admin) */}
        {userRole === 'admin' && classes.length > 0 && (
          <div className="class-tabs show">
            <div className="tab-list">
              {classes.map(cls => (
                <button
                  key={cls._id}
                  className={`tab-button ${selectedClass?._id === cls._id ? 'active' : ''}`}
                  onClick={() => handleClassChange(cls._id)}
                >
                  {cls.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.activeStudents}</div>
            <div className="stat-label">Active Now</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completedAssignments}</div>
            <div className="stat-label">Completed Assignments</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.pendingGrades}</div>
            <div className="stat-label">Pending Grades</div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="dashboard-grid">
          {/* Live Stream Control */}
          <div className="stream-control">
            <div className="stream-header">
              <h2 className="stream-title">Live Stream Control</h2>
              <span className={`stream-status ${streamStatus}`}>
                {streamStatus === 'live' ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            
            <div className="stream-preview">
              {streamStatus === 'live' ? (
                <div>
                  <i className="fas fa-video" style={{ fontSize: '3rem', color: '#22c55e' }}></i>
                  <p>Stream is live</p>
                </div>
              ) : (
                <div>
                  <i className="fas fa-video-slash" style={{ fontSize: '3rem' }}></i>
                  <p>Stream offline</p>
                </div>
              )}
            </div>

            <div className="stream-controls">
              <button 
                className={`btn ${streamStatus === 'live' ? 'btn-danger' : 'btn-success'}`}
                onClick={handleStreamToggle}
              >
                <i className={`fas ${streamStatus === 'live' ? 'fa-stop' : 'fa-play'}`}></i>
                {streamStatus === 'live' ? 'Stop Stream' : 'Start Stream'}
              </button>
              <button className="btn btn-primary">
                <i className="fas fa-cog"></i>
                Settings
              </button>
            </div>

            <div className="stream-info">
              <p><strong>Viewers:</strong> {streamStatus === 'live' ? stats.activeStudents : 0}</p>
              <p><strong>Duration:</strong> {streamStatus === 'live' ? '15:32' : '00:00'}</p>
            </div>
          </div>

          {/* Student Activity Panel */}
          <div className="activity-panel">
            <h2 className="panel-title">Student Activity</h2>
            <div className="student-list">
              {students.slice(0, 8).map(student => (
                <div key={student._id} className="student-item">
                  <div className="student-info">
                    <div className="student-avatar">
                      {getInitials(student.name)}
                    </div>
                    <div className="student-details">
                      <h4>{student.name}</h4>
                      <span>Last active: {student.lastActivity}</span>
                    </div>
                  </div>
                  <div className={`activity-indicator ${student.status}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Management Section */}
        <div className="content-section">
          <div className="content-card">
            <div className="content-header">
              <h2 className="content-title">Recent Assignments</h2>
              <button className="btn btn-primary">
                <i className="fas fa-plus"></i>
                New Assignment
              </button>
            </div>
            <div className="content-list">
              <div className="content-item">
                <div>
                  <h4>Mission Planning Exercise</h4>
                  <p>Due: Tomorrow, 5:00 PM</p>
                </div>
                <div>
                  <span className="badge badge-warning">12 Pending</span>
                </div>
              </div>
              <div className="content-item">
                <div>
                  <h4>Tactical Analysis Report</h4>
                  <p>Due: Friday, 11:59 PM</p>
                </div>
                <div>
                  <span className="badge badge-success">All Submitted</span>
                </div>
              </div>
              <div className="content-item">
                <div>
                  <h4>Equipment Familiarization Quiz</h4>
                  <p>Due: Next Monday</p>
                </div>
                <div>
                  <span className="badge badge-info">8 Completed</span>
                </div>
              </div>
            </div>
          </div>

          <div className="content-card">
            <div className="content-header">
              <h2 className="content-title">Course Materials</h2>
              <button className="btn btn-primary">
                <i className="fas fa-upload"></i>
                Upload
              </button>
            </div>
            <div className="content-list">
              <div className="content-item">
                <div>
                  <h4>Week 3 - Intelligence Analysis</h4>
                  <p>Updated 2 days ago</p>
                </div>
                <div>
                  <button className="btn btn-sm">
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
              </div>
              <div className="content-item">
                <div>
                  <h4>Mission Planning Templates</h4>
                  <p>Updated 1 week ago</p>
                </div>
                <div>
                  <button className="btn btn-sm">
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
              </div>
              <div className="content-item">
                <div>
                  <h4>Equipment Reference Guide</h4>
                  <p>Updated 2 weeks ago</p>
                </div>
                <div>
                  <button className="btn btn-sm">
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Messaging Panel */}
      <div className={`messaging-panel ${messagingOpen ? 'open' : ''}`}>
        <div className="messaging-header">
          <h3>Messages</h3>
          <button 
            className="close-btn"
            onClick={() => setMessagingOpen(false)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="messaging-content">
          {notifications.map(notification => (
            <div key={notification.id} className="message-item">
              <div className="message-content">
                <p>{notification.message}</p>
                <span className="message-time">{notification.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;