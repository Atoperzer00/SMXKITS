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
import EditTypingTestsSimple from './components/admin/EditTypingTestsSimple';
import Schedule from './components/schedule/Schedule';
import Calendar from './components/schedule/Calendar';

// Import tools that instructors can access
import TrackPoint from './components/tools/TrackPoint';
import TrackPointFixed from './components/tools/TrackPointFixed';
import Altis from './components/tools/Altis';
import KitComm from './components/tools/KitComm';
import OpsLog from './components/tools/OpsLog';
import OpsLogCalls from './components/tools/OpsLogCalls';
import SMXKits from './components/tools/SMXKits';
import StreamMode from './components/tools/StreamMode';
import SMXStreamNew from './components/tools/SMXStreamNew';

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
          <Route path="/edit-typing-tests-simple.html" element={<EditTypingTestsSimple />} />
          <Route path="/schedule.html" element={<Schedule />} />
          <Route path="/calendar.html" element={<Calendar />} />
          
          {/* Tools (Instructor Access) */}
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
          <Route path="/" element={<Navigate to="/instructor-dashboard.html" replace />} />
          <Route path="*" element={<Navigate to="/instructor-dashboard.html" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default InstructorApp;