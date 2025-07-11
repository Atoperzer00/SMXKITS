import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import admin components
import Login from './components/auth/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import UsersRoles from './components/admin/UsersRoles';
import Classes from './components/admin/Classes';
import AddClass from './components/admin/AddClass';
import AddStudent from './components/admin/AddStudent';
import TemplateEditor from './components/admin/TemplateEditor';
import EditCourseContent from './components/admin/EditCourseContent';
import EditMissionLinks from './components/admin/EditMissionLinks';
import EditScreenerTraining from './components/admin/EditScreenerTraining';
import EditIATraining from './components/admin/EditIATraining';
import EditTypingTests from './components/admin/EditTypingTests';
import Schedule from './components/schedule/Schedule';

function AdminApp() {
  return (
    <Router>
      <div className="App admin-theme">
        <Routes>
          {/* Auth Routes */}
          <Route path="/login.html" element={<Login />} />
          
          {/* Admin Dashboard and Management Routes */}
          <Route path="/admin-dashboard.html" element={<AdminDashboard />} />
          <Route path="/users-roles.html" element={<UsersRoles />} />
          <Route path="/classes.html" element={<Classes />} />
          <Route path="/add-class.html" element={<AddClass />} />
          <Route path="/add-student.html" element={<AddStudent />} />
          <Route path="/template-editor.html" element={<TemplateEditor />} />
          
          {/* Content Management */}
          <Route path="/edit-course-content.html" element={<EditCourseContent />} />
          <Route path="/edit-mission-links.html" element={<EditMissionLinks />} />
          <Route path="/edit-screener-training.html" element={<EditScreenerTraining />} />
          <Route path="/edit-ia-training.html" element={<EditIATraining />} />
          <Route path="/edit-typing-tests.html" element={<EditTypingTests />} />
          
          {/* Shared Components */}
          <Route path="/schedule.html" element={<Schedule />} />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/admin-dashboard.html" replace />} />
          <Route path="*" element={<Navigate to="/admin-dashboard.html" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AdminApp;