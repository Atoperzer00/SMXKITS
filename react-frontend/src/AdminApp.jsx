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
import EditTypingTestsSimple from './components/admin/EditTypingTestsSimple';
import Schedule from './components/schedule/Schedule';
import Calendar from './components/schedule/Calendar';

// Import tools that admins can access
import TrackPoint from './components/tools/TrackPoint';
import TrackPointFixed from './components/tools/TrackPointFixed';
import Altis from './components/tools/Altis';
import KitComm from './components/tools/KitComm';
import OpsLog from './components/tools/OpsLog';
import OpsLogCalls from './components/tools/OpsLogCalls';
import SMXKits from './components/tools/SMXKits';
import StreamMode from './components/tools/StreamMode';
import SMXStreamNew from './components/tools/SMXStreamNew';

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
          <Route path="/edit-typing-tests-simple.html" element={<EditTypingTestsSimple />} />
          
          {/* Shared Components */}
          <Route path="/schedule.html" element={<Schedule />} />
          <Route path="/calendar.html" element={<Calendar />} />
          
          {/* Tools (Admin Access) */}
          <Route path="/Trackpoint.html" element={<TrackPoint />} />
          <Route path="/TrackPoint-fixed.html" element={<TrackPointFixed />} />
          <Route path="/altis.html" element={<Altis />} />
          <Route path="/KitComm.html" element={<KitComm />} />
          <Route path="/OpsLog.html" element={<OpsLog />} />
          <Route path="/OpsLog_CALLS_STYLED.html" element={<OpsLogCalls />} />
          <Route path="/SMXKITS.html" element={<SMXKits />} />
          <Route path="/Stream Mode.html" element={<StreamMode />} />
          <Route path="/SMX-Stream-NEW.html" element={<SMXStreamNew />} />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/admin-dashboard.html" replace />} />
          <Route path="*" element={<Navigate to="/admin-dashboard.html" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AdminApp;