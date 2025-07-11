import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './KeyboardTraining.css';

const KeyboardTraining = () => {
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState('Student');
  const [typingModules, setTypingModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTypingModal, setShowTypingModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [currentModule, setCurrentModule] = useState(0);
  const [currentPractice, setCurrentPractice] = useState(0);
  const [typingStartTime, setTypingStartTime] = useState(null);
  const [isTypingActive, setIsTypingActive] = useState(false);
  const [typingStats, setTypingStats] = useState({
    time: '0:00',
    wpm: 0,
    accuracy: 100
  });
  const [results, setResults] = useState({
    wpm: 0,
    accuracy: 0,
    time: '0:00'
  });
  const [expandedModules, setExpandedModules] = useState({});
  const [userResults, setUserResults] = useState({});
  const [overallProgress, setOverallProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [userMetrics, setUserMetrics] = useState({ lastWpm: 0, avgWpm: 0 });
  
  const typingInputRef = useRef(null);
  const typingTimerRef = useRef(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role) {
      navigate('/login.html');
      return;
    }

    // Load user info
    const storedName = localStorage.getItem('userName') || 'Student';
    setStudentName(storedName);

    // Load typing modules and user data
    loadTypingModules();
    loadUserResults();
  }, [navigate]);

  const loadTypingModules = async () => {
    try {
      console.log('📚 Loading typing modules from API...');
      
      const response = await fetch('/api/typing-tests');
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('✅ Typing modules loaded successfully');
          setTypingModules(result.data.modules || []);
          setLoading(false);
          return;
        }
      }
      
      throw new Error('Failed to load from API');
      
    } catch (error) {
      console.warn('⚠️ Failed to load from API, using defaults:', error.message);
      
      // Use default modules if API fails
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
      
      setTypingModules(defaultModules);
      setLoading(false);
    }
  };

  const loadUserResults = () => {
    try {
      const savedResults = localStorage.getItem('typingResults');
      if (savedResults) {
        const parsedResults = JSON.parse(savedResults);
        setUserResults(parsedResults);
        updateProgressDisplay(parsedResults);
      }
    } catch (error) {
      console.error('Error loading user results:', error);
    }
  };

  const updateProgressDisplay = (results = userResults) => {
    let totalCompleted = 0;
    let totalPractices = 0;
    let totalWpm = 0;
    let completedTests = 0;
    let lastWpm = 0;

    typingModules.forEach((module, moduleIndex) => {
      module.forEach((practice, practiceIndex) => {
        if (practice && practice.trim() !== '') {
          totalPractices++;
          const result = results[moduleIndex] && results[moduleIndex][practiceIndex];
          if (result && result.completed) {
            totalCompleted++;
            totalWpm += result.wpm;
            completedTests++;
            lastWpm = result.wpm; // Keep updating to get the most recent
          }
        }
      });
    });

    const percentage = totalPractices > 0 ? Math.round((totalCompleted / totalPractices) * 100) : 0;
    const avgWpm = completedTests > 0 ? Math.round(totalWpm / completedTests) : 0;

    setOverallProgress({
      completed: totalCompleted,
      total: totalPractices,
      percentage
    });

    setUserMetrics({
      lastWpm,
      avgWpm
    });
  };

  const toggleModule = (moduleIndex) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleIndex]: !prev[moduleIndex]
    }));
  };

  const startTypingTest = (moduleIndex, practiceIndex) => {
    if (!typingModules[moduleIndex] || !typingModules[moduleIndex][practiceIndex]) {
      console.error('Practice not found:', moduleIndex, practiceIndex);
      return;
    }
    
    setCurrentModule(moduleIndex);
    setCurrentPractice(practiceIndex);
    resetTypingStats();
    setShowTypingModal(true);
    
    // Focus on input after modal opens
    setTimeout(() => {
      if (typingInputRef.current) {
        typingInputRef.current.focus();
      }
    }, 100);
  };

  const resetTypingStats = () => {
    setTypingStartTime(null);
    setIsTypingActive(false);
    
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    
    setTypingStats({
      time: '0:00',
      wpm: 0,
      accuracy: 100
    });
  };

  const startTypingTimer = () => {
    if (isTypingActive) return;
    
    setIsTypingActive(true);
    setTypingStartTime(Date.now());
    
    typingTimerRef.current = setInterval(updateTypingStats, 100);
  };

  const updateTypingStats = () => {
    if (!isTypingActive || !typingStartTime) return;
    
    const elapsedTime = (Date.now() - typingStartTime) / 1000;
    const minutes = elapsedTime / 60;
    
    const typedText = typingInputRef.current?.value || '';
    const originalText = typingModules[currentModule][currentPractice];
    
    // Calculate WPM (words per minute)
    const wordsTyped = typedText.length / 5; // Standard: 5 characters = 1 word
    const wpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
    
    // Calculate accuracy
    const accuracy = calculateAccuracy(typedText, originalText);
    
    setTypingStats({
      time: formatTime(elapsedTime),
      wpm,
      accuracy
    });
    
    // Check if typing is complete
    if (typedText.length >= originalText.length) {
      completeTypingTest();
    }
  };

  const calculateAccuracy = (typed, original) => {
    if (typed.length === 0) return 100;
    
    let correct = 0;
    const minLength = Math.min(typed.length, original.length);
    
    for (let i = 0; i < minLength; i++) {
      if (typed[i] === original[i]) {
        correct++;
      }
    }
    
    return Math.round((correct / typed.length) * 100);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const completeTypingTest = () => {
    if (!isTypingActive) return;
    
    // Stop timer
    setIsTypingActive(false);
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    
    const elapsedTime = (Date.now() - typingStartTime) / 1000;
    const typedText = typingInputRef.current?.value || '';
    const originalText = typingModules[currentModule][currentPractice];
    
    // Calculate final stats
    const wordsTyped = typedText.length / 5;
    const minutes = elapsedTime / 60;
    const wpm = minutes > 0 ? Math.round(wordsTyped / minutes) : 0;
    const accuracy = calculateAccuracy(typedText, originalText);
    
    // Save results
    saveTypingResult(currentModule, currentPractice, {
      wpm: wpm,
      accuracy: accuracy,
      time: Math.round(elapsedTime),
      completed: true,
      timestamp: new Date().toISOString()
    });
    
    // Show results modal
    setResults({
      wpm,
      accuracy,
      time: formatTime(elapsedTime)
    });
    
    setShowTypingModal(false);
    setShowResultsModal(true);
  };

  const saveTypingResult = (moduleIndex, practiceIndex, result) => {
    const newResults = { ...userResults };
    
    if (!newResults[moduleIndex]) {
      newResults[moduleIndex] = {};
    }
    
    newResults[moduleIndex][practiceIndex] = result;
    
    setUserResults(newResults);
    localStorage.setItem('typingResults', JSON.stringify(newResults));
    updateProgressDisplay(newResults);
  };

  const handleTypingInput = (e) => {
    if (!isTypingActive && e.target.value.length > 0) {
      startTypingTimer();
    }
  };

  const restartTypingTest = () => {
    if (typingInputRef.current) {
      typingInputRef.current.value = '';
    }
    resetTypingStats();
  };

  const closeTypingModal = () => {
    setShowTypingModal(false);
    resetTypingStats();
  };

  const closeResultsModal = () => {
    setShowResultsModal(false);
  };

  const retryTypingTest = () => {
    setShowResultsModal(false);
    setShowTypingModal(true);
    resetTypingStats();
    setTimeout(() => {
      if (typingInputRef.current) {
        typingInputRef.current.focus();
      }
    }, 100);
  };

  const refreshContent = () => {
    setLoading(true);
    loadTypingModules();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('classId');
    localStorage.removeItem('studentDay');
    navigate('/login.html');
  };

  const moduleNames = [
    'Module 1: Basic Typing',
    'Module 2: Numbers and Symbols', 
    'Module 3: Military Terminology',
    'Module 4: POL Basic Descriptors',
    'Module 5: POL SITREP Format'
  ];

  if (loading) {
    return (
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <img src="/SMXKITS.png" alt="SMX KITS Logo" className="admin-logo" />
          <nav>
            <div className="nav-item">
              <a href="#" onClick={() => navigate('/dashboard.html')} className="nav-link">
                <i className="fas fa-tachometer-alt"></i>
                Dashboard
              </a>
            </div>
            <div className="nav-item">
              <a href="#" className="nav-link active">
                <i className="fas fa-keyboard"></i>
                Keyboard Training
              </a>
            </div>
            <div className="nav-item">
              <a href="#" onClick={logout} className="nav-link">
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </a>
            </div>
          </nav>
        </aside>

        <main className="admin-main">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', color: 'var(--text-secondary)' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
            <div>Loading modules...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <img src="/SMXKITS.png" alt="SMX KITS Logo" className="admin-logo" />
        
        <nav>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/dashboard.html')} className="nav-link">
              <i className="fas fa-tachometer-alt"></i>
              Dashboard
            </a>
          </div>
          <div className="nav-item">
            <a href="#" className="nav-link active">
              <i className="fas fa-keyboard"></i>
              Keyboard Training
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/mission-links.html')} className="nav-link">
              <i className="fas fa-rocket"></i>
              Live PED Exercise
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/Screener Training.html')} className="nav-link">
              <i className="fas fa-user-shield"></i>
              Screener Training
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/IA Training.html')} className="nav-link">
              <i className="fas fa-satellite-dish"></i>
              IA Training
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={logout} className="nav-link">
              <i className="fas fa-sign-out-alt"></i>
              Logout
            </a>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Keyboard Training</h1>
            <p className="page-subtitle">Welcome back, <span>{studentName}</span>! Continue your typing journey.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button onClick={refreshContent} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
              <i className="fas fa-sync-alt" style={{ marginRight: '0.5rem' }}></i>Refresh Content
            </button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="progress-section">
          <h2 className="section-title">Your Progress</h2>
          <div className="progress-grid">
            <div className="progress-item">
              <h3 style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Overall Progress</h3>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${overallProgress.percentage}%` }}></div>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {overallProgress.completed} of {overallProgress.total} practices completed
              </div>
            </div>
            
            <div className="progress-item">
              <h3 style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Your Metrics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Last WPM</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-accent)' }}>{userMetrics.lastWpm}</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Avg WPM</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-accent)' }}>{userMetrics.avgWpm}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modules Section */}
        <div className="modules-section">
          <h2 className="section-title">Training Modules</h2>
          <div>
            {typingModules.map((module, moduleIndex) => {
              // Calculate module progress
              let completedPractices = 0;
              let totalPractices = 0;
              
              module.forEach((practice, practiceIndex) => {
                if (practice && practice.trim() !== '') {
                  totalPractices++;
                  if (userResults[moduleIndex] && userResults[moduleIndex][practiceIndex] && userResults[moduleIndex][practiceIndex].completed) {
                    completedPractices++;
                  }
                }
              });
              
              const progressPercent = totalPractices > 0 ? Math.round((completedPractices / totalPractices) * 100) : 0;
              const isExpanded = expandedModules[moduleIndex];
              
              return (
                <div key={moduleIndex} className="module-item">
                  <div className="module-header" onClick={() => toggleModule(moduleIndex)}>
                    <div className="module-title">{moduleNames[moduleIndex] || `Module ${moduleIndex + 1}`}</div>
                    <div className="module-description">Practice typing with specialized content</div>
                    <div className="module-progress">
                      <span>{completedPractices} of {totalPractices} practices completed</span>
                      <span style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{progressPercent}%</span>
                    </div>
                    <div className="progress-bar" style={{ marginTop: '1rem' }}>
                      <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <div className="module-arrow" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</div>
                  </div>
                  
                  {isExpanded && (
                    <div className="module-practices">
                      {module.map((practice, practiceIndex) => {
                        if (!practice || practice.trim() === '') return null;
                        
                        const previewText = practice.length > 60 ? practice.substring(0, 60) + '...' : practice;
                        const result = userResults[moduleIndex] && userResults[moduleIndex][practiceIndex];
                        
                        return (
                          <div key={practiceIndex} className="practice-item" onClick={() => startTypingTest(moduleIndex, practiceIndex)}>
                            <div className="practice-info">
                              <div className="practice-title">Practice {practiceIndex + 1}</div>
                              <div className="practice-preview">{previewText}</div>
                            </div>
                            <div className="practice-results">
                              {result ? (
                                <>
                                  <div style={{ color: '#22c55e', fontWeight: 'bold' }}>WPM: {result.wpm}</div>
                                  <div style={{ color: '#fbbf24' }}>Acc: {result.accuracy}%</div>
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{result.time}s</div>
                                </>
                              ) : (
                                <div style={{ color: 'var(--text-secondary)', padding: '0.5rem', border: '1px dashed var(--glass-border)', borderRadius: '5px' }}>
                                  Not completed
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Typing Interface Modal */}
      {showTypingModal && (
        <div className="typing-modal">
          <div className="typing-container">
            <div className="typing-header">
              <h2 className="typing-title">Module {currentModule + 1} - Practice {currentPractice + 1}</h2>
              <div className="typing-stats">
                <span>Time: <span>{typingStats.time}</span></span>
                <span>WPM: <span>{typingStats.wpm}</span></span>
                <span>Accuracy: <span>{typingStats.accuracy}%</span></span>
              </div>
            </div>
            
            <div className="typing-text">
              {typingModules[currentModule] && typingModules[currentModule][currentPractice]}
            </div>
            
            <textarea 
              ref={typingInputRef}
              className="typing-input" 
              placeholder="Start typing here..." 
              rows="4"
              onChange={handleTypingInput}
            ></textarea>
            
            <div className="typing-controls">
              <button type="button" onClick={restartTypingTest} className="btn btn-secondary">Restart</button>
              <button type="button" onClick={closeTypingModal} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && (
        <div className="results-modal">
          <div className="results-container">
            <h2 className="results-title">Practice Complete!</h2>
            
            <div className="results-grid">
              <div className="result-item">
                <div className="result-label">WPM</div>
                <div className="result-value">{results.wpm}</div>
              </div>
              <div className="result-item">
                <div className="result-label">Accuracy</div>
                <div className="result-value">{results.accuracy}%</div>
              </div>
              <div className="result-item">
                <div className="result-label">Time</div>
                <div className="result-value">{results.time}</div>
              </div>
            </div>
            
            <div className="typing-controls">
              <button type="button" onClick={retryTypingTest} className="btn btn-primary">Try Again</button>
              <button type="button" onClick={closeResultsModal} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardTraining;