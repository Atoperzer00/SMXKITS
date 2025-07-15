import React from 'react';
import Calendar from '../../../UI/Calendar/Calendar';
import AdminSidebar from '../../../UI/Sidebar/Sidebar';
import ToolSection from '../../components/ToolSection/ToolSection';
import QuickActions from '../../components/QuickAction/QuickAction';
import ChatHub from '../../../UI/Chat/ChatHub';
import AnalyticsWidget from '../../components/Analytics/AnalyticsWidget';
import UpcomingSessions from '../../components/UpcomingSessions/UpcomingSessions';
import {
  FaClipboardList,
  FaVideo,
  FaComments,
  FaCloudUploadAlt,
  FaKeyboard,
  FaChartLine,
  FaMap,
  FaUserCog,
  FaPlusCircle,
  FaUserPlus,
  FaClipboardCheck,
  FaInbox,
  FaTools,
  FaBolt,
  FaClock,
  FaUser
} from "react-icons/fa";

import './AdminDashboard.css';

const AdminDashboard = () => {
  const openNewTab = (url) => window.open(url, '_blank');
  const goTo = (url) => window.location.href = url;

  const notify = (msg, type) => {
    console.log(`[${type}] ${msg}`);
  };

  const sendChatMessage = () => {
    // Implement chat logic here
    console.log('Sending message...');
  };

  const events = [
    { title: 'Math Class', start: '2025-07-10', instructor: 'Alice', students: 25 },
    { title: 'Physics Lab', start: '2025-07-12', instructor: 'Bob', students: 30 },
  ];

  const essentialTools = [
    {
      id: 'stream',
      title: 'Instructor Stream Mode',
      description: 'Advanced streaming interface with real-time student interaction.',
      icon: <FaVideo style={{ color: 'var(--text-accent)' }} />,
      onClick: () => openNewTab('/stream'),
    },
    {
      id: 'kitcomm',
      title: 'KitComm',
      description: 'Messaging and collaboration hub.',
      icon: <FaComments style={{ color: 'var(--text-accent)' }} />,
      onClick: () => openNewTab('kitcomm.html'),
    },
    {
      id: 'opslog',
      title: 'Operations Log',
      description: 'Track system activity and user behavior.',
      icon: <FaClipboardList style={{ color: 'var(--text-accent)' }} />,
      onClick: () => openNewTab('../OpsLog.html'),
    },
    {
      id: 'upload-templates',
      title: 'Upload Templates',
      description: 'Manage course resources and templates.',
      icon: <FaCloudUploadAlt style={{ color: 'var(--text-accent)' }} />,
      onClick: () => alert('Upload Templates functionality coming soon!'),
    },
    {
      id: 'typing-tests',
      title: 'Edit Typing Tests',
      description: 'Create and manage typing assessments.',
      icon: <FaKeyboard style={{ color: 'var(--text-accent)' }} />,
      onClick: () => goTo('edit-typing-tests.html'),
    },
    {
      id: 'grading',
      title: 'Instructor Grading',
      description: 'Interactive grading tools and feedback.',
      icon: <FaChartLine style={{ color: 'var(--text-accent)' }} />,
      onClick: () => goTo('instructor-grading.html'),
    },
    {
      id: 'trackpoint',
      title: 'TrackPoint Map (Enhanced)',
      description: 'Tactical mapping with real-time diagnostics.',
      icon: <FaMap style={{ color: 'var(--text-accent)' }} />,
      onClick: () => goTo('Trackpoint-fixed.html'),
      badge: 'Fixed',
    },
  ];

  const actions = [
    {
      id: 'users-roles',
      icon: <FaUserCog />,
      title: 'Users & Roles',
      onClick: () => goTo('users-roles.html'),
    },
    {
      id: 'add-class',
      icon: <FaPlusCircle />,
      title: 'Add New Class',
      onClick: () => goTo('add-class.html'),
    },
    {
      id: 'add-student',
      icon: <FaUserPlus />,
      title: 'Add New Student',
      onClick: () => goTo('add-student.html'),
    },
    {
      id: 'manage-attendance',
      icon: <FaClipboardCheck />,
      title: 'Manage Attendance',
      note: 'Needs link',
      onClick: () => alert('Manage Attendance link not set yet.'),
    },
    {
      id: 'instructor-inbox',
      icon: <FaInbox />,
      title: 'Instructor Inbox',
      badge: 3,
      note: 'Needs link',
      onClick: () => alert('Inbox link not set yet.'),
    },
  ];

  const classStats = [
    { className: 'Alpha', percent: 65 },
    { className: 'Bravo', percent: 82 },
  ];

  const summaryStats = {
    totalStudents: 68,
    activeClasses: 2,
  };

  const sessionData = [
    {
      name: 'Alpha Class - Module 3',
      date: 'October 9, 2023 • 09:00 - 12:00',
      color: '#4facfe',
    },
    {
      name: 'Bravo Class - Module 1',
      date: 'October 15, 2023 • 13:00 - 16:00',
      color: '#f093fb',
    },
    {
      name: 'Charlie Class - Assessment',
      date: 'October 18, 2023 • 14:00 - 17:00',
      color: '#667eea',
    },
  ];

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
              <FaUser />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>System Administrator</div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Admin Access</div>
            </div>
          </div>
        </header>

        {/* Essential Tools */}
        <ToolSection
          title="Essential Instructor Tools"
          icon={<FaTools />}
          tools={essentialTools}
          extraCls={['fade-in', 'stagger-1']}
        />

        {/* Quick Actions */}
        <QuickActions
          title="Quick Actions"
          icon={<FaBolt />}
          actions={actions}
          extraCls={['fade-in', 'stagger-2']}
        />

        {/* Calendar Widget */}
        <section className="calendar-widget fade-in stagger-3">
          <h2 className="widget-title"><i className="fas fa-calendar-alt"></i> Course Calendar</h2>
          <Calendar classEvents={events} showNotification={notify} />;
        </section>

        {/* Dashboard Widgets */}
        <section className="dashboard-widgets fade-in stagger-4">
          <div className="widget-card">
            <AnalyticsWidget
              title="Analytics & Progress"
              Icon={FaChartLine}
              classData={classStats}
              stats={summaryStats}
            />
          </div>

          <div className="widget-card">
            <UpcomingSessions
              title="Upcoming Sessions"
              Icon={FaClock}
              sessions={sessionData}
            />
          </div>
        </section>

        {/* Chat */}
        <ChatHub />
      </main>
    </div>
  );
};

export default AdminDashboard;
