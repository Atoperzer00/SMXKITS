import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import all student components
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import KeyboardTraining from './components/training/KeyboardTraining';
import MissionLinks from './components/training/MissionLinks';
import ScreenerTraining from './components/training/ScreenerTraining';
import IATraining from './components/training/IATraining';
import CourseContent from './components/training/CourseContent';
import StudentMessenger from './components/messaging/StudentMessenger';
import StudentGrading from './components/grading/StudentGrading';
import Feedback from './components/feedback/Feedback';
import Schedule from './components/schedule/Schedule';
import TrackPoint from './components/tools/TrackPoint';
import Altis from './components/tools/Altis';
import KitComm from './components/tools/KitComm';
import OpsLog from './components/tools/OpsLog';
import SMXKits from './components/tools/SMXKits';
import StreamMode from './components/tools/StreamMode';

function StudentApp() {
  return (
    <Router>
      <div className="App student-theme">
        <Routes>
          {/* Auth Routes */}
          <Route path="/login.html" element={<Login />} />
          
          {/* Student Dashboard and Training Routes */}
          <Route path="/dashboard.html" element={<Dashboard />} />
          <Route path="/keyboard-training.html" element={<KeyboardTraining />} />
          <Route path="/mission-links.html" element={<MissionLinks />} />
          <Route path="/Screener Training.html" element={<ScreenerTraining />} />
          <Route path="/IA Training.html" element={<IATraining />} />
          <Route path="/course-content.html" element={<CourseContent />} />
          
          {/* Communication and Grading */}
          <Route path="/student-messenger.html" element={<StudentMessenger />} />
          <Route path="/student-grading.html" element={<StudentGrading />} />
          <Route path="/feedback.html" element={<Feedback />} />
          <Route path="/schedule.html" element={<Schedule />} />
          
          {/* Tools */}
          <Route path="/Trackpoint.html" element={<TrackPoint />} />
          <Route path="/altis.html" element={<Altis />} />
          <Route path="/KitComm.html" element={<KitComm />} />
          <Route path="/OpsLog.html" element={<OpsLog />} />
          <Route path="/SMXKITS.html" element={<SMXKits />} />
          <Route path="/Stream Mode.html" element={<StreamMode />} />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard.html" replace />} />
          <Route path="*" element={<Navigate to="/dashboard.html" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default StudentApp;