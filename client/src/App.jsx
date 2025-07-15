import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './Dashboard/pages/Admin/AdminDashboard';
import Streaming from './Streaming/Streaming';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/stream" element={<Streaming />} />
      </Routes>
    </Router>
  );
}

export default App;
