import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './EditTypingTestsSimple.css';

const EditTypingTestsSimple = () => {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [typingModules, setTypingModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const moduleNames = [
    'Module 1: Basic Typing',
    'Module 2: Numbers and Symbols', 
    'Module 3: Military Terminology',
    'Module 4: POL Basic Descriptors',
    'Module 5: POL SITREP Format'
  ];

  const defaultModules = [
    [
      'The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.',
      'Practice makes perfect. Keep typing to improve your speed and accuracy with consistent daily training.',
      'Touch typing is a skill that will serve you well throughout your career and personal computing tasks.'
    ],
    [
      '1234567890 !@#$%^&*() The numbers and symbols are important for data entry and programming tasks.',
      'Email addresses like user@example.com require symbol typing skills for professional communication.',
      'Special characters: ~`!@#$%^&*()_+-={}[]|\\:";\'<>?,./ are used in coding and technical writing.'
    ],
    [
      'Military ranks: Private, Corporal, Sergeant, Lieutenant, Captain, Major, Colonel, General.',
      'Military time: 0600 hours, 1200 hours, 1800 hours, 2400 hours for precise time coordination.',
      'NATO phonetic alphabet: Alpha, Bravo, Charlie, Delta, Echo, Foxtrot, Golf, Hotel, India, Juliet.'
    ],
    [
      'One adult male in dark traditional wear. Two adult females in light clothing observed at location.',
      'Personnel count: Three adult males, one adult female, two children observed entering the compound.',
      'Description: Individual wearing dark jacket, light pants, carrying backpack, proceeding north.'
    ],
    [
      'SITREP: At 0630Z, one adult male departed E gate on red motorcycle, rode S out of FOV 0635Z. SLANT 1/0/0',
      'SITREP: At 0745Z, white sedan entered compound through W gate, parked E side. SLANT 1/0/0',
      'SITREP: At 0900Z, two adult males on foot entered compound, proceeded to building A. SLANT 2/0/0'
    ]
  ];

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role) {
      navigate('/login');
      return;
    }

    if (role !== 'admin' && role !== 'instructor') {
      navigate('/dashboard');
      return;
    }
  }, [navigate]);

  // Initialize socket connection
  useEffect(() => {
    if (typeof window !== 'undefined' && window.io) {
      const socket = window.io();
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
      });

      return () => {
        if (socket) {
          socket.disconnect();
        }
      };
    }
  }, []);

  // Load typing modules
  useEffect(() => {
    loadTypingModules();
  }, []);

  const loadTypingModules = async () => {
    try {
      setIsLoading(true);
      console.log('📚 Loading typing modules...');
      
      const response = await fetch('/api/typing-tests');
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTypingModules(result.data.modules || defaultModules);
          console.log(`✅ Loaded ${result.data.modules?.length || 0} modules`);
          setIsLoading(false);
          return;
        }
      }
      
      throw new Error('Failed to load from API');
    } catch (error) {
      console.warn('⚠️ Using default modules:', error.message);
      setTypingModules(defaultModules);
      console.log(`Using ${defaultModules.length} default modules`);
      setIsLoading(false);
    }
  };

  const updatePractice = (moduleIndex, practiceIndex, value) => {
    const updatedModules = [...typingModules];
    updatedModules[moduleIndex][practiceIndex] = value;
    setTypingModules(updatedModules);
  };

  const saveModule = async (moduleIndex) => {
    try {
      console.log(`💾 Saving module ${moduleIndex}...`);
      
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Please log in again.', true);
        navigate('/login');
        return;
      }
      
      // Save to API
      const response = await fetch('/api/typing-tests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          modules: typingModules
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Emit socket event to update training page
          if (socketRef.current) {
            socketRef.current.emit('typing-modules-updated', { modules: typingModules });
          }
          
          showNotification(`✅ Module ${moduleIndex + 1} saved!`);
          console.log(`✅ Module ${moduleIndex} saved and broadcasted`);
        }
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      showNotification('❌ Save failed', true);
    }
  };

  const addModule = () => {
    const newModule = [
      'New practice text 1',
      'New practice text 2', 
      'New practice text 3'
    ];
    setTypingModules([...typingModules, newModule]);
  };

  const removeModule = (moduleIndex) => {
    if (window.confirm('Are you sure you want to remove this module?')) {
      const updatedModules = typingModules.filter((_, index) => index !== moduleIndex);
      setTypingModules(updatedModules);
    }
  };

  const addPractice = (moduleIndex) => {
    const updatedModules = [...typingModules];
    updatedModules[moduleIndex].push('New practice text');
    setTypingModules(updatedModules);
  };

  const removePractice = (moduleIndex, practiceIndex) => {
    if (typingModules[moduleIndex].length <= 1) {
      showNotification('Module must have at least one practice text', true);
      return;
    }

    const updatedModules = [...typingModules];
    updatedModules[moduleIndex].splice(practiceIndex, 1);
    setTypingModules(updatedModules);
  };

  const showNotification = (message, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('classId');
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading typing modules...</p>
      </div>
    );
  }

  return (
    <div className="edit-typing-simple-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <img src="/smx-logo.png" alt="SMX KITS Logo" className="admin-logo" />
        
        <nav>
          <div className="nav-item">
            <button onClick={() => navigate('/admin-dashboard')} className="nav-link">
              <i className="fas fa-tachometer-alt"></i>Dashboard
            </button>
          </div>
          <div className="nav-item">
            <button className="nav-link active">
              <i className="fas fa-keyboard"></i>Edit Typing Tests
            </button>
          </div>
          <div className="nav-item">
            <button onClick={() => navigate('/keyboard-training')} className="nav-link">
              <i className="fas fa-graduation-cap"></i>Keyboard Training
            </button>
          </div>
          <div className="nav-item">
            <button onClick={logout} className="nav-link">
              <i className="fas fa-sign-out-alt"></i>Logout
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Edit Typing Tests</h1>
          <p className="dashboard-subtitle">
            Simple editor with instant updates via socket connection.
          </p>
        </div>
        
        <div className="controls">
          <button onClick={addModule} className="btn btn-primary">
            <i className="fas fa-plus"></i>
            Add New Module
          </button>
        </div>
        
        <div className="modules-container">
          {typingModules.map((practices, moduleIndex) => (
            <div key={moduleIndex} className="module-card">
              <div className="module-header">
                <h3 className="module-title">
                  {moduleNames[moduleIndex] || `Module ${moduleIndex + 1}`}
                </h3>
                <div className="module-actions">
                  <button 
                    onClick={() => addPractice(moduleIndex)} 
                    className="btn btn-secondary"
                    title="Add Practice"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                  <button 
                    onClick={() => saveModule(moduleIndex)} 
                    className="btn btn-success"
                  >
                    <i className="fas fa-save"></i>
                    Save Module
                  </button>
                  {typingModules.length > 1 && (
                    <button 
                      onClick={() => removeModule(moduleIndex)} 
                      className="btn btn-danger"
                      title="Remove Module"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  )}
                </div>
              </div>
              
              <div className="practices">
                {practices.map((practice, practiceIndex) => (
                  <div key={practiceIndex} className="practice-item">
                    <div className="practice-header">
                      <label className="practice-label">
                        Practice {practiceIndex + 1}:
                      </label>
                      {practices.length > 1 && (
                        <button
                          onClick={() => removePractice(moduleIndex, practiceIndex)}
                          className="remove-practice-btn"
                          title="Remove Practice"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    <textarea 
                      className="practice-textarea"
                      value={practice}
                      onChange={(e) => updatePractice(moduleIndex, practiceIndex, e.target.value)}
                      rows="3"
                      placeholder="Enter practice text..."
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Notification */}
      {notification && (
        <div className={`notification ${notification.isError ? 'error' : 'success'}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default EditTypingTestsSimple;