import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import instructor components
import Login from './components/auth/Login';
import InstructorDashboard from './components/instructor/InstructorDashboard';
import InstructorInterface from './components/instructor/InstructorInterface';
import InstructorGrading from './components/instructor/InstructorGrading';
import InstructorMessaging from './components/instructor/InstructorMessaging';
import InstructorFeedback from './components/instructor/InstructorFeedback';
import Classes from './components/admin/Classes';
import Schedule from './components/schedule/Schedule';

function InstructorApp() {
  return (
    <Router>
      <div className="App instructor-theme">
        <Routes>
          {/* Auth Routes */}
          <Route path="/login.html" element={<Login />} />
          
          {/* Instructor Dashboard and Interface Routes */}
          <Route path="/instructor-dashboard.html" element={<InstructorDashboard />} />
          <Route path="/instructor-interface.html" element={<InstructorInterface />} />
          <Route path="/instructor-grading.html" element={<InstructorGrading />} />
          <Route path="/instructor-messaging.html" element={<InstructorMessaging />} />
          <Route path="/instructor-feedback.html" element={<InstructorFeedback />} />
          
          {/* Shared Components */}
          <Route path="/classes.html" element={<Classes />} />
          <Route path="/schedule.html" element={<Schedule />} />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/instructor-dashboard.html" replace />} />
          <Route path="*" element={<Navigate to="/instructor-dashboard.html" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default InstructorApp;