import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MissionLinks.css';

const MissionLinks = () => {
  const navigate = useNavigate();
  const [selectedReference, setSelectedReference] = useState('');
  const [showFileSubmission, setShowFileSubmission] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [showSlideshowModal, setShowSlideshowModal] = useState(false);
  const [slideImages, setSlideImages] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideshowLoading, setSlideshowLoading] = useState(false);
  
  const fileInputRef = useRef(null);
  const fileDropRef = useRef(null);

  // Sample student data - this would come from your backend
  const students = [
    { id: 1, name: 'John Smith', class: 'Alpha' },
    { id: 2, name: 'Sarah Johnson', class: 'Alpha' },
    { id: 3, name: 'Mike Davis', class: 'Alpha' },
    { id: 4, name: 'Emily Wilson', class: 'Alpha' },
    { id: 5, name: 'Chris Brown', class: 'Alpha' }
  ];

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role) {
      navigate('/login.html');
      return;
    }

    // Setup drag and drop event listeners
    const fileDropZone = fileDropRef.current;
    if (fileDropZone) {
      fileDropZone.addEventListener('dragover', handleDragOver);
      fileDropZone.addEventListener('dragleave', handleDragLeave);
      fileDropZone.addEventListener('drop', handleDrop);
    }

    return () => {
      if (fileDropZone) {
        fileDropZone.removeEventListener('dragover', handleDragOver);
        fileDropZone.removeEventListener('dragleave', handleDragLeave);
        fileDropZone.removeEventListener('drop', handleDrop);
      }
    };
  }, [navigate]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileDropRef.current) {
      fileDropRef.current.classList.add('dragover');
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileDropRef.current) {
      fileDropRef.current.classList.remove('dragover');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileDropRef.current) {
      fileDropRef.current.classList.remove('dragover');
    }
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileSelection(files);
  };

  const handleFileSelection = (files) => {
    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo'
      ];
      return validTypes.includes(file.type);
    });

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setShowFileSubmission(true);
    }

    if (files.length > validFiles.length) {
      alert('Some files were not added because they are not supported file types.');
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length === 1) {
      setShowFileSubmission(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const getSelectedStudentNames = () => {
    if (selectedStudents.length === 0) return 'No students selected';
    const names = selectedStudents.map(id => 
      students.find(s => s.id === id)?.name
    ).filter(Boolean);
    return names.join(', ');
  };

  const generateReference = async () => {
    if (!selectedReference) {
      alert('Please select a reference template first.');
      return;
    }

    console.log('Generating reference for:', selectedReference);
    
    // Generate slide images based on selected reference
    const imageCount = 8; // Default number of slides
    const generatedImages = [];
    
    for (let i = 1; i <= imageCount; i++) {
      generatedImages.push(`/mission-references/${selectedReference}/slide-${i}.jpg`);
    }
    
    setSlideImages(generatedImages);
    setCurrentSlideIndex(0);
    setSlideshowLoading(true);
    setShowSlideshowModal(true);
    
    // Simulate loading time
    setTimeout(() => {
      setSlideshowLoading(false);
    }, 1000);
  };

  const nextSlide = () => {
    if (currentSlideIndex < slideImages.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const previousSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const closeSlideshowModal = () => {
    setShowSlideshowModal(false);
    setSlideImages([]);
    setCurrentSlideIndex(0);
    setSlideshowLoading(false);
  };

  const openLink = (url, name) => {
    console.log('Opening link:', name, 'URL:', url);
    try {
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        console.error('Popup blocked or failed to open:', url);
        alert('Unable to open ' + name + '. Please check if popups are blocked.');
      } else {
        console.log('Successfully opened:', name);
      }
    } catch (error) {
      console.error('Error opening link:', error);
      alert('Error opening ' + name + ': ' + error.message);
    }
  };

  const submitFiles = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to submit.');
      return;
    }

    // Here you would implement the actual file submission logic
    console.log('Submitting files:', selectedFiles);
    console.log('Selected students:', selectedStudents);
    
    // Simulate submission
    alert(`Successfully submitted ${selectedFiles.length} file(s) with ${selectedStudents.length} classmate(s) selected.`);
    
    // Reset form
    setSelectedFiles([]);
    setSelectedStudents([]);
    setShowFileSubmission(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelSubmission = () => {
    setSelectedFiles([]);
    setSelectedStudents([]);
    setShowFileSubmission(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('classId');
    localStorage.removeItem('studentDay');
    navigate('/login.html');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
              <i className="fas fa-rocket"></i>
              Live PED Exercise
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/keyboard-training.html')} className="nav-link">
              <i className="fas fa-keyboard"></i>
              Keyboard Training
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
      <main className="admin-content">
        {/* Header Section */}
        <header className="dashboard-header fade-in">
          <div>
            <h1 className="dashboard-title">Mission Links</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
              Access essential mission resources and external links for training operations.
            </p>
          </div>
        </header>

        {/* Reference Section */}
        <section className="fade-in stagger-1">
          <h2 className="section-title">
            <i className="fas fa-book-open"></i>
            Quick Reference Generator
          </h2>
          <div className="tool-card" style={{ marginBottom: '2rem' }}>
            <div className="tool-description" style={{ marginBottom: '1.5rem' }}>
              Generate quick reference links for specific training scenarios and operational contexts.
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select 
                value={selectedReference}
                onChange={(e) => setSelectedReference(e.target.value)}
                style={{ 
                  background: '#f0f0f0', 
                  border: '1px solid #ccc', 
                  borderRadius: '10px', 
                  padding: '0.75rem 1rem', 
                  color: '#000000', 
                  flex: 1, 
                  minWidth: '200px' 
                }}
              >
                <option value="">Template</option>
                <option value="mission-reference-1">Mission Reference: 1</option>
                <option value="mission-reference-2">Mission Reference: 2</option>
                <option value="mission-reference-3">Mission Reference: 3</option>
              </select>
              <button 
                onClick={generateReference}
                style={{ 
                  background: 'var(--accent-gradient)', 
                  border: 'none', 
                  color: 'white', 
                  padding: '0.75rem 1.5rem', 
                  borderRadius: '10px', 
                  fontWeight: 600, 
                  cursor: 'pointer', 
                  transition: 'var(--transition)', 
                  position: 'relative', 
                  zIndex: 1 
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
              >
                <i className="fas fa-play"></i> Generate
              </button>
            </div>
          </div>
        </section>

        {/* Mission Links Grid */}
        <section className="fade-in stagger-2">
          <h2 className="section-title">
            <i className="fas fa-globe"></i>
            Essential Mission Resources
          </h2>
          <div className="tools-grid">
            <div className="tool-card" onClick={() => openLink('/KitComm.html', 'KitComm')} style={{ cursor: 'pointer', zIndex: 10 }}>
              <div className="tool-icon"><i className="fas fa-comments"></i></div>
              <h3 className="tool-title">KitComm</h3>
              <p className="tool-description">Secure team communications, messaging, and coordination platform.</p>
            </div>
            
            <div className="tool-card" onClick={() => openLink('/SMXStream-new.html', 'SMX Stream')} style={{ cursor: 'pointer', zIndex: 10 }}>
              <div className="tool-icon"><i className="fas fa-video"></i></div>
              <h3 className="tool-title">SMX Stream</h3>
              <p className="tool-description">Live training streams, recorded sessions, and real-time mission broadcasts.</p>
            </div>
            
            <div className="tool-card" onClick={() => openLink('/OpsLog.html', 'Drift')} style={{ cursor: 'pointer', zIndex: 10 }}>
              <div className="tool-icon"><i className="fas fa-clipboard-list"></i></div>
              <h3 className="tool-title">Drift</h3>
              <p className="tool-description">Mission operations logging, activity tracking, and incident reporting.</p>
            </div>
            
            <div className="tool-card" onClick={() => openLink('/Trackpoint.html', 'TrackPoint')} style={{ cursor: 'pointer', zIndex: 10 }}>
              <div className="tool-icon"><i className="fas fa-map-marked-alt"></i></div>
              <h3 className="tool-title">TrackPoint</h3>
              <p className="tool-description">Altis tactical mapping system with MGRS coordinates and city markers.</p>
            </div>
          </div>
        </section>

        {/* File Submission System */}
        <section className="fade-in stagger-3" style={{ marginTop: '3rem' }}>
          <h2 className="section-title">
            <i className="fas fa-cloud-upload-alt"></i>
            File Submission System
          </h2>
          
          {/* File Drop Zone Grid Container */}
          <div className="tools-grid">
            <div 
              ref={fileDropRef}
              className="tool-card" 
              style={{ 
                border: '2px dashed var(--glass-border)', 
                textAlign: 'center', 
                cursor: 'pointer', 
                transition: 'var(--transition)' 
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="tool-icon"><i className="fas fa-file-upload"></i></div>
              <h3 className="tool-title">Drop Files Here</h3>
              <p className="tool-description">Upload documents, images, videos, and other files for student submission.</p>
              <div style={{ marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Supports: PDF, DOC, DOCX, TXT, JPG, PNG, GIF, MP4, MOV, AVI
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi" 
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
            </div>
          </div>

          {/* File List View */}
          {showFileSubmission && (
            <div className="tools-grid">
              <div className="tool-card" style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 className="tool-title" style={{ margin: 0 }}>
                    <i className="fas fa-list"></i> Files Ready for Submission
                  </h3>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    style={{ 
                      background: 'var(--accent-gradient)', 
                      border: 'none', 
                      color: 'white', 
                      padding: '0.5rem 1rem', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      fontSize: '0.9rem' 
                    }}
                  >
                    <i className="fas fa-plus"></i> Add More Files
                  </button>
                </div>
              
                <div style={{ marginBottom: '1.5rem' }}>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="file-item" style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.75rem', 
                      marginBottom: '0.5rem', 
                      background: 'var(--glass-bg)', 
                      borderRadius: '8px', 
                      border: '1px solid var(--glass-border)' 
                    }}>
                      <div className="file-info" style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {formatFileSize(file.size)} • {file.type}
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFile(index)}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: '#ef4444', 
                          cursor: 'pointer', 
                          padding: '0.5rem', 
                          borderRadius: '4px' 
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-accent)' }}>
                      <i className="fas fa-users"></i> Select Mission Classmates:
                    </label>
                    <div className="student-dropdown-container" style={{ position: 'relative' }}>
                      <button 
                        onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          background: 'var(--glass-bg)', 
                          border: '1px solid var(--glass-border)', 
                          borderRadius: '8px', 
                          color: 'var(--text-primary)', 
                          textAlign: 'left', 
                          cursor: 'pointer', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center' 
                        }}
                      >
                        <span>Select classmates you worked with...</span>
                        <i className={`fas fa-chevron-${showStudentDropdown ? 'up' : 'down'}`}></i>
                      </button>
                      {showStudentDropdown && (
                        <div style={{ 
                          position: 'absolute', 
                          top: '100%', 
                          left: 0, 
                          right: 0, 
                          background: 'var(--card-gradient)', 
                          border: '1px solid var(--glass-border)', 
                          borderRadius: '8px', 
                          maxHeight: '200px', 
                          overflowY: 'auto', 
                          zIndex: 1000, 
                          marginTop: '4px' 
                        }}>
                          {students.map(student => (
                            <div 
                              key={student.id}
                              onClick={() => toggleStudentSelection(student.id)}
                              style={{ 
                                padding: '0.75rem', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                borderBottom: '1px solid var(--glass-border)' 
                              }}
                            >
                              <div 
                                className={`student-checkbox ${selectedStudents.includes(student.id) ? 'checked' : ''}`}
                                style={{ 
                                  width: '16px', 
                                  height: '16px', 
                                  border: '2px solid var(--glass-border)', 
                                  borderRadius: '3px', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  fontSize: '0.8rem',
                                  background: selectedStudents.includes(student.id) ? 'var(--accent-gradient)' : 'transparent',
                                  borderColor: selectedStudents.includes(student.id) ? 'var(--text-accent)' : 'var(--glass-border)',
                                  color: selectedStudents.includes(student.id) ? 'white' : 'transparent'
                                }}
                              >
                                {selectedStudents.includes(student.id) && '✓'}
                              </div>
                              <span>{student.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {getSelectedStudentNames()}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={cancelSubmission}
                    style={{ 
                      background: 'var(--glass-bg)', 
                      border: '1px solid var(--glass-border)', 
                      color: 'var(--text-primary)', 
                      padding: '0.75rem 1.5rem', 
                      borderRadius: '8px', 
                      cursor: 'pointer' 
                    }}
                  >
                    <i className="fas fa-times"></i> Cancel
                  </button>
                  <button 
                    onClick={submitFiles}
                    style={{ 
                      background: 'var(--primary-gradient)', 
                      border: 'none', 
                      color: 'white', 
                      padding: '0.75rem 2rem', 
                      borderRadius: '8px', 
                      cursor: 'pointer', 
                      fontWeight: 600 
                    }}
                  >
                    <i className="fas fa-paper-plane"></i> Submit to Grading
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Slideshow Viewer Modal */}
      {showSlideshowModal && (
        <div className="slideshow-modal active">
          <div className="slideshow-container">
            <button className="slideshow-close" onClick={closeSlideshowModal}>
              <i className="fas fa-times"></i>
            </button>
            <div className="slideshow-content">
              {slideshowLoading ? (
                <div className="slideshow-loader">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading images...</p>
                </div>
              ) : (
                <>
                  <img 
                    src={slideImages[currentSlideIndex]} 
                    alt="Mission Reference Image" 
                    className="slideshow-image visible"
                    onError={(e) => {
                      e.target.src = '/placeholder-slide.jpg';
                    }}
                  />
                  <div className="slideshow-controls">
                    <button className="slideshow-btn prev-btn" onClick={previousSlide}>
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <div className="slide-counter">
                      <span>{currentSlideIndex + 1}</span> / <span>{slideImages.length}</span>
                    </div>
                    <button className="slideshow-btn next-btn" onClick={nextSlide}>
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionLinks;