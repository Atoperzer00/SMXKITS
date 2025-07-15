import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = ({ userRole = 'student' }) => {
  const [activeItem, setActiveItem] = useState('dashboard');

  const getNavigationItems = () => {
    switch (userRole) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: 'fa-home', href: '/dashboard.html' },
          { id: 'keyboard-training', label: 'Keyboard Training', icon: 'fa-keyboard', href: '/keyboard-training.html' },
          { id: 'mission-links', label: 'Live PED Exercise', icon: 'fa-rocket', href: '/mission-links.html' },
          { id: 'screener-training', label: 'Screener Training', icon: 'fa-user-shield', href: '/Screener Training.html' },
          { id: 'ia-training', label: 'Intelligence Analysis', icon: 'fa-satellite-dish', href: '/IA Training.html' },
          { id: 'course-content', label: 'Course Content', icon: 'fa-book', href: '/course-content.html' },
          { id: 'messenger', label: 'Student Messenger', icon: 'fa-comments', href: '/student-messenger.html' },
          { id: 'grading', label: 'My Grades', icon: 'fa-chart-line', href: '/student-grading.html' },
          { id: 'feedback', label: 'Feedback', icon: 'fa-star', href: '/feedback.html' },
          { id: 'schedule', label: 'Schedule', icon: 'fa-calendar', href: '/schedule.html' },
          { id: 'trackpoint', label: 'TrackPoint', icon: 'fa-map', href: '/Trackpoint.html' },
          { id: 'altis', label: 'Altis', icon: 'fa-globe', href: '/altis.html' },
          { id: 'kitcomm', label: 'KitComm', icon: 'fa-radio', href: '/KitComm.html' },
          { id: 'opslog', label: 'OpsLog', icon: 'fa-clipboard-list', href: '/OpsLog.html' },
          { id: 'stream-mode', label: 'Stream Mode', icon: 'fa-video', href: '/Stream Mode.html' }
        ];
      
      case 'instructor':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt', href: '/instructor-dashboard.html' },
          { id: 'interface', label: 'Instructor Interface', icon: 'fa-chalkboard-teacher', href: '/instructor-interface.html' },
          { id: 'grading', label: 'Grading', icon: 'fa-clipboard-check', href: '/instructor-grading.html' },
          { id: 'messaging', label: 'Messaging', icon: 'fa-envelope', href: '/instructor-messaging.html' },
          { id: 'feedback', label: 'Feedback', icon: 'fa-comment-dots', href: '/instructor-feedback.html' },
          { id: 'classes', label: 'Classes', icon: 'fa-users-class', href: '/classes.html' },
          { id: 'schedule', label: 'Schedule', icon: 'fa-calendar-alt', href: '/schedule.html' }
        ];
      
      case 'admin':
        return [
          { id: 'dashboard', label: 'Admin Dashboard', icon: 'fa-cogs', href: '/admin-dashboard.html' },
          { id: 'users-roles', label: 'Users & Roles', icon: 'fa-users-cog', href: '/users-roles.html' },
          { id: 'classes', label: 'Manage Classes', icon: 'fa-school', href: '/classes.html' },
          { id: 'add-class', label: 'Add Class', icon: 'fa-plus-circle', href: '/add-class.html' },
          { id: 'add-student', label: 'Add Student', icon: 'fa-user-plus', href: '/add-student.html' },
          { id: 'template-editor', label: 'Template Editor', icon: 'fa-edit', href: '/template-editor.html' },
          { id: 'edit-course', label: 'Edit Course Content', icon: 'fa-book-open', href: '/edit-course-content.html' },
          { id: 'edit-missions', label: 'Edit Mission Links', icon: 'fa-link', href: '/edit-mission-links.html' },
          { id: 'edit-screener', label: 'Edit Screener Training', icon: 'fa-shield-alt', href: '/edit-screener-training.html' },
          { id: 'edit-ia', label: 'Edit IA Training', icon: 'fa-brain', href: '/edit-ia-training.html' },
          { id: 'edit-typing', label: 'Edit Typing Tests', icon: 'fa-keyboard', href: '/edit-typing-tests.html' }
        ];
      
      default:
        return [];
    }
  };

  const handleNavClick = (item) => {
    setActiveItem(item.id);
    window.location.href = item.href;
  };

  const navigationItems = getNavigationItems();

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-logo">
        <img 
          src="/images/SMX-KITS-LOGO.png" 
          alt="SMX KITS" 
          className="admin-logo"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'block';
          }}
        />
        <div className="logo-fallback" style={{ display: 'none' }}>
          <h2>SMX KITS</h2>
        </div>
      </div>
      
      <nav className="admin-nav">
        {navigationItems.map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
            onClick={() => handleNavClick(item)}
          >
            <i className={`fas ${item.icon}`}></i>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            <i className="fas fa-user"></i>
          </div>
          <div className="user-details">
            <span className="user-name">User</span>
            <span className="user-role">{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</span>
          </div>
        </div>
        
        <button className="logout-btn" onClick={() => window.location.href = '/login.html'}>
          <i className="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;