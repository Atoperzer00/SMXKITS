import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!username || !password || !role) {
      setError('Please fill in all fields');
      return;
    }

    // Simple authentication (matching original logic)
    if (username === 'admin' && password === 'admin' && role === 'admin') {
      localStorage.setItem('token', 'admin-token');
      localStorage.setItem('role', 'admin');
      localStorage.setItem('userName', 'Administrator');
      navigate('/admin-dashboard.html');
    } else if (username === 'instructor' && password === 'instructor' && role === 'instructor') {
      localStorage.setItem('token', 'instructor-token');
      localStorage.setItem('role', 'instructor');
      localStorage.setItem('userName', 'Instructor');
      navigate('/instructor-dashboard.html');
    } else if (username === 'student' && password === 'student' && role === 'student') {
      localStorage.setItem('token', 'student-token');
      localStorage.setItem('role', 'student');
      localStorage.setItem('userName', 'Student');
      localStorage.setItem('studentDay', 'Day 3/7');
      navigate('/dashboard.html');
    } else {
      setError('Invalid credentials');
    }
  };

  // Apply login-specific styles to body when component mounts
  useEffect(() => {
    // Store original styles
    const originalOverflow = document.body.style.overflow;
    const originalBackground = document.body.style.background;
    const originalHeight = document.body.style.height;
    
    // Apply login styles
    document.body.style.overflow = 'hidden';
    document.body.style.background = 'url("/Sign in Screen.jpg") no-repeat center center fixed';
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundColor = 'black';
    document.body.style.height = '100vh';
    document.body.style.fontFamily = 'Arial, sans-serif';
    
    // Cleanup function to restore original styles
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.background = originalBackground;
      document.body.style.height = originalHeight;
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999
    }}>
      {/* Original SMX logo in top left */}
      <img id="logo" src="/SE66806_logo_orig.png" alt="SMX Logo" />
      
      {/* Main login screen with original design */}
      <section id="screen-login" className="screen active">
        <div className="login-card">
          <img src="/images/Key Intelligence Training System Logo.png" alt="Key Intelligence Training System" className="logo" style={{width: '350px', marginBottom: '2rem'}} />
          
          {/* Login form with your original styling */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input 
                type="text" 
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username" 
                required 
              />
            </div>
            <div className="form-group">
              <input 
                type="password" 
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" 
                required 
              />
            </div>
            <div className="form-group">
              <select 
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="instructor">Instructor</option>
                <option value="student">Student</option>
              </select>
            </div>
            <button type="submit" className="login-btn">Login</button>
          </form>
          
          {error && <div id="login-error" className={`error-message ${error ? 'show' : ''}`}>{error}</div>}
        </div>
      </section>
      
      {/* Bottom bar with Kit and Contact */}
      <footer>
        Kit and Contact
      </footer>
    </div>
  );
};

export default Login;