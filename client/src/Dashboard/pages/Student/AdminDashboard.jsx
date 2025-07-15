import React from 'react';
import Calendar from '../../../UI/Calendar/Calendar';
import AdminSidebar from '../../../UI/Sidebar/Sidebar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const openNewTab = (url) => window.open(url, '_blank');
  const goTo = (url) => window.location.href = url;
  const sendChatMessage = () => {
    // Implement chat logic here
    console.log('Sending message...');
  };

  const events = [
    { title: 'Math Class', start: '2025-07-10', instructor: 'Alice', students: 25 },
    { title: 'Physics Lab', start: '2025-07-12', instructor: 'Bob', students: 30 },
  ];

  const notify = (msg, type) => {
    console.log(`[${type}] ${msg}`);
  };

  return (
    <div>
      <AdminSidebar />
      <main className="admin-content">
        {/* Header Section */}
        <header className="dashboard-header fade-in">
          <div>
            <h1 className="dashboard-title">Instructor Command Center</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
              Welcome back! Manage your classes, students, and training resources.
            </p>
          </div>
          <div className="user-info">
            <div className="user-avatar">
              <i className="fas fa-user"></i>
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>Instructor</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Admin Access</div>
            </div>
          </div>
        </header>

        {/* Essential Tools */}
        <section className="essential-tools fade-in stagger-1">
          <h2 className="section-title"><i className="fas fa-tools"></i> Essential Instructor Tools</h2>
          <div className="tools-grid">
            <div className="tool-card" onClick={() => openNewTab('/stream')}>
              <div className="tool-icon"><i className="fas fa-video"></i></div>
              <h3 className="tool-title">Instructor Stream Mode</h3>
              <p className="tool-description">Advanced streaming interface with real-time student interaction.</p>
            </div>

            <div className="tool-card" onClick={() => openNewTab('kitcomm.html')}>
              <div className="tool-icon"><i className="fas fa-comments"></i></div>
              <h3 className="tool-title">KitComm</h3>
              <p className="tool-description">Messaging and collaboration hub.</p>
            </div>

            <div className="tool-card" onClick={() => openNewTab('../OpsLog.html')}>
              <div className="tool-icon"><i className="fas fa-clipboard-list"></i></div>
              <h3 className="tool-title">Operations Log</h3>
              <p className="tool-description">Track system activity and user behavior.</p>
            </div>

            <div className="tool-card" onClick={() => alert('Upload Templates functionality coming soon!')}>
              <div className="tool-icon"><i className="fas fa-cloud-upload-alt"></i></div>
              <h3 className="tool-title">
                Upload Templates <span style={{ fontSize: '0.7rem', color: '#f093fb' }}>(Needs link)</span>
              </h3>
              <p className="tool-description">Manage course resources and templates.</p>
            </div>

            <div className="tool-card" onClick={() => goTo('edit-typing-tests.html')}>
              <div className="tool-icon"><i className="fas fa-keyboard"></i></div>
              <h3 className="tool-title">Edit Typing Tests</h3>
              <p className="tool-description">Create and manage typing assessments.</p>
            </div>

            <div className="tool-card" onClick={() => goTo('instructor-grading.html')}>
              <div className="tool-icon"><i className="fas fa-chart-line"></i></div>
              <h3 className="tool-title">Instructor Grading</h3>
              <p className="tool-description">Interactive grading tools and feedback.</p>
            </div>

            <div className="tool-card" onClick={() => goTo('Trackpoint-fixed.html')}>
              <div className="tool-icon"><i className="fas fa-map"></i></div>
              <h3 className="tool-title">TrackPoint Map (Enhanced)</h3>
              <p className="tool-description">Tactical mapping with real-time diagnostics.</p>
              <div className="badge">Fixed</div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="fade-in stagger-2">
          <h2 className="section-title"><i className="fas fa-bolt"></i> Quick Actions</h2>
          <div className="quick-actions">
            <div className="action-card" onClick={() => goTo('users-roles.html')}>
              <div className="action-icon"><i className="fas fa-users-cog"></i></div>
              <div className="action-title">Users & Roles</div>
            </div>
            <div className="action-card" onClick={() => goTo('add-class.html')}>
              <div className="action-icon"><i className="fas fa-plus-circle"></i></div>
              <div className="action-title">Add New Class</div>
            </div>
            <div className="action-card" onClick={() => goTo('add-student.html')}>
              <div className="action-icon"><i className="fas fa-user-plus"></i></div>
              <div className="action-title">Add New Student</div>
            </div>
            <div className="action-card">
              <div className="action-icon"><i className="fas fa-clipboard-check"></i></div>
              <div className="action-title">Manage Attendance <span style={{ fontSize: '0.7rem', color: '#f093fb' }}>(Needs link)</span></div>
            </div>
            <div className="action-card">
              <div className="action-icon"><i className="fas fa-inbox"></i></div>
              <div className="action-title">Instructor Inbox <span style={{ fontSize: '0.7rem', color: '#f093fb' }}>(Needs link)</span></div>
              <span className="badge">3</span>
            </div>
          </div>
        </section>

        {/* Calendar Widget */}
        <section className="calendar-widget fade-in stagger-3">
          <h2 className="widget-title"><i className="fas fa-calendar-alt"></i> Course Calendar</h2>
          <Calendar classEvents={events} showNotification={notify} />;
        </section>

        {/* Dashboard Widgets */}
        <section className="dashboard-widgets fade-in stagger-4">
          <div className="widget-card">
            <h3 className="widget-title"><i className="fas fa-chart-line"></i> Analytics & Progress</h3>
            <div style={{ marginTop: '1.5rem' }}>
              {[
                { className: 'Alpha', percent: 65 },
                { className: 'Bravo', percent: 82 }
              ].map(({ className, percent }) => (
                <div key={className} style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: 15, marginBottom: '1rem' }}>
                  <h4 style={{ color: 'var(--text-accent)' }}>{className} Class</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{className} Class</span>
                    <span>{percent}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span>Total Students: 68</span>
                <span>Active Classes: 3</span>
              </div>
            </div>
          </div>

          <div className="widget-card">
            <h3 className="widget-title"><i className="fas fa-clock"></i> Upcoming Sessions</h3>
            <div style={{ marginTop: '1.5rem' }}>
              {/* Repeatable session blocks */}
              {[
                { name: 'Alpha Class - Module 3', date: 'October 9, 2023 • 09:00 - 12:00', color: '#4facfe' },
                { name: 'Bravo Class - Module 1', date: 'October 15, 2023 • 13:00 - 16:00', color: '#f093fb' },
                { name: 'Charlie Class - Assessment', date: 'October 18, 2023 • 14:00 - 17:00', color: '#667eea' }
              ].map((session, index) => (
                <div key={index} style={{
                  padding: '1rem',
                  borderLeft: `4px solid ${session.color}`,
                  background: `${session.color}1A`,
                  borderRadius: '0 10px 10px 0',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{session.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <i className="fas fa-calendar"></i> {session.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Instructor Chat */}
        <section className="chat-section fade-in stagger-4">
          <h3 style={{ color: 'var(--text-accent)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-comments"></i> Instructor Chat Hub
          </h3>
          <div className="chatbox-messages">
            <div className="chat-loading">Loading messages...</div>
          </div>
          <div className="chatbox-inputs">
            <input type="text" placeholder="Type your message to students and staff..." />
            <input type="file" id="chatFile" style={{ display: 'none' }} />
            <button type="button" onClick={() => document.getElementById('chatFile').click()}>
              <i className="fas fa-paperclip"></i> Send File
            </button>
            <button type="button" onClick={sendChatMessage}>
              <i className="fas fa-paper-plane"></i> Send
            </button>
          </div>
          <div id="uploadStatus" style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}></div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
