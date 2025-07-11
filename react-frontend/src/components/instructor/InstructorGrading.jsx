import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';
import './InstructorGrading.css';

const InstructorGrading = () => {
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeHistory, setGradeHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmissionOverlay, setShowSubmissionOverlay] = useState(false);
  const [currentSubmissionDetails, setCurrentSubmissionDetails] = useState(null);
  
  const [grades, setGrades] = useState({
    'Mission Planning': 0,
    'Execution': 0,
    'Communication': 0,
    'Decision Making': 0,
    'Technical Skills': 0
  });
  
  const [instructorNotes, setInstructorNotes] = useState('');

  useEffect(() => {
    initializePage();
    
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  const initializePage = async () => {
    await loadSubmissions();
    await loadGradeHistory();
    setLoading(false);
  };

  const loadSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login.html');
        return;
      }

      const response = await fetch('/api/submissions/pending', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const loadGradeHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/submissions/graded', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setGradeHistory(data.submissions || []);
      }
    } catch (error) {
      console.error('Error loading grade history:', error);
    }
  };

  const selectSubmission = (submission) => {
    setSelectedSubmission(submission);
    
    // Reset grades
    setGrades({
      'Mission Planning': 0,
      'Execution': 0,
      'Communication': 0,
      'Decision Making': 0,
      'Technical Skills': 0
    });
    setInstructorNotes('');
    
    // Update chart
    setTimeout(() => {
      updateGradingChart();
    }, 100);
  };

  const updateGradingChart = () => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    const categories = Object.keys(grades);
    const scores = Object.values(grades);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [{
          data: scores,
          backgroundColor: [
            'rgba(255, 107, 53, 0.8)',
            'rgba(247, 147, 30, 0.8)',
            'rgba(255, 167, 38, 0.8)',
            'rgba(255, 193, 7, 0.8)',
            'rgba(76, 175, 80, 0.8)'
          ],
          borderColor: [
            'rgba(255, 107, 53, 1)',
            'rgba(247, 147, 30, 1)',
            'rgba(255, 167, 38, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(76, 175, 80, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              padding: 15,
              font: {
                size: 11
              }
            }
          }
        }
      }
    });
  };

  const handleGradeChange = (category, value) => {
    setGrades(prev => ({
      ...prev,
      [category]: parseInt(value)
    }));
    
    // Update chart
    setTimeout(() => {
      updateGradingChart();
    }, 50);
  };

  const submitGrade = async () => {
    if (!selectedSubmission) return;

    try {
      const token = localStorage.getItem('token');
      const overallGrade = Object.values(grades).reduce((a, b) => a + b, 0) / Object.keys(grades).length;
      
      const response = await fetch('/api/submissions/grade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          grades: grades,
          overallGrade: overallGrade,
          instructorNotes: instructorNotes
        })
      });

      if (response.ok) {
        alert('Grade submitted successfully!');
        await loadSubmissions();
        await loadGradeHistory();
        setSelectedSubmission(null);
        
        // Reset form
        setGrades({
          'Mission Planning': 0,
          'Execution': 0,
          'Communication': 0,
          'Decision Making': 0,
          'Technical Skills': 0
        });
        setInstructorNotes('');
      } else {
        alert('Failed to submit grade. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting grade:', error);
      alert('Error submitting grade. Please try again.');
    }
  };

  const viewSubmissionDetails = (submission) => {
    setCurrentSubmissionDetails(submission);
    setShowSubmissionOverlay(true);
  };

  const closeSubmissionOverlay = () => {
    setShowSubmissionOverlay(false);
    setCurrentSubmissionDetails(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('classId');
    localStorage.removeItem('studentDay');
    navigate('/login.html');
  };

  if (loading) {
    return (
      <div className="grading-layout">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading grading interface...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grading-layout">
      {/* Sidebar */}
      <div className="grading-sidebar">
        <div className="sidebar-header">
          <img src="/SMXKITS.png" alt="SMX KITS Logo" className="sidebar-logo" />
          <h2>Instructor Grading</h2>
        </div>

        {/* Navigation */}
        <div className="nav-section">
          <button className="nav-btn active">
            <i className="fas fa-clipboard-check"></i>
            Grade Submissions
          </button>
          <button className="nav-btn" onClick={() => navigate('/dashboard.html')}>
            <i className="fas fa-tachometer-alt"></i>
            Dashboard
          </button>
          <button className="nav-btn" onClick={logout}>
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>

        <div className="divider"></div>

        {/* Submissions List */}
        <div className="submissions-section">
          <h3>Pending Submissions ({submissions.length})</h3>
          <div className="submissions-list">
            {submissions.length === 0 ? (
              <div className="empty-submissions">
                <i className="fas fa-inbox"></i>
                <p>No pending submissions</p>
              </div>
            ) : (
              submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`submission-item ${selectedSubmission?.id === submission.id ? 'selected' : ''}`}
                  onClick={() => selectSubmission(submission)}
                >
                  <div className="submission-info">
                    <div className="submission-student">{submission.studentName}</div>
                    <div className="submission-mission">{submission.missionTitle}</div>
                    <div className="submission-time">{formatDate(submission.submittedAt)}</div>
                  </div>
                  <button
                    className="view-details-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      viewSubmissionDetails(submission);
                    }}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="main-panel">
        <div className="top-bar">
          <div>
            {selectedSubmission ? (
              <>Grading: {selectedSubmission.studentName} - {selectedSubmission.missionTitle}</>
            ) : (
              'Select a submission to begin grading'
            )}
          </div>
        </div>

        <div className="content-area">
          {/* Grading Panel */}
          <div className="grading-panel">
            {selectedSubmission ? (
              <>
                <div className="grading-wheel-container">
                  <div className="chart-container">
                    <canvas ref={chartRef} width="300" height="300"></canvas>
                  </div>
                  
                  <div className="sliders-container">
                    {Object.entries(grades).map(([category, score]) => (
                      <div key={category} className="grade-slider">
                        <label>{category}</label>
                        <div className="slider-wrapper">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={score}
                            onChange={(e) => handleGradeChange(category, e.target.value)}
                            className="slider"
                          />
                          <span className="slider-value">{score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="notes-section">
                  <label htmlFor="instructorNotes">Instructor Notes</label>
                  <textarea
                    id="instructorNotes"
                    value={instructorNotes}
                    onChange={(e) => setInstructorNotes(e.target.value)}
                    placeholder="Add feedback and notes for the student..."
                    rows="6"
                  />
                </div>

                <div className="grading-actions">
                  <button className="submit-grade-btn" onClick={submitGrade}>
                    <i className="fas fa-check"></i>
                    Submit Grade
                  </button>
                  <button className="cancel-btn" onClick={() => setSelectedSubmission(null)}>
                    <i className="fas fa-times"></i>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="no-selection">
                <i className="fas fa-clipboard-list"></i>
                <h3>No Submission Selected</h3>
                <p>Select a submission from the sidebar to begin grading.</p>
              </div>
            )}
          </div>

          {/* Grade History Panel */}
          <div className="history-panel">
            <h3>Recent Grades</h3>
            <div className="history-list">
              {gradeHistory.length === 0 ? (
                <div className="empty-history">
                  <i className="fas fa-history"></i>
                  <p>No graded submissions yet</p>
                </div>
              ) : (
                gradeHistory.slice(0, 10).map((item) => (
                  <div key={item.id} className="history-item">
                    <h4>{item.studentName}</h4>
                    <div className="history-mission">{item.missionTitle}</div>
                    <div className="history-grade">Grade: {item.overallGrade?.toFixed(1) || 'N/A'}</div>
                    <div className="history-timestamp">{formatDate(item.gradedAt)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Details Overlay */}
      {showSubmissionOverlay && currentSubmissionDetails && (
        <div className="submission-overlay">
          <div className="submission-overlay-content">
            <button className="overlay-close" onClick={closeSubmissionOverlay}>
              <i className="fas fa-times"></i>
            </button>
            
            <div className="submission-details">
              <h3>
                <i className="fas fa-file-alt"></i>
                Submission Details
              </h3>
              
              <div className="detail-row">
                <span>Student:</span>
                <span>{currentSubmissionDetails.studentName}</span>
              </div>
              <div className="detail-row">
                <span>Mission:</span>
                <span>{currentSubmissionDetails.missionTitle}</span>
              </div>
              <div className="detail-row">
                <span>Submitted:</span>
                <span>{formatDate(currentSubmissionDetails.submittedAt)}</span>
              </div>
              <div className="detail-row">
                <span>File:</span>
                <span>{currentSubmissionDetails.fileName}</span>
              </div>
            </div>

            <div className="submission-actions">
              <button
                className="select-for-grading-btn"
                onClick={() => {
                  selectSubmission(currentSubmissionDetails);
                  closeSubmissionOverlay();
                }}
              >
                <i className="fas fa-edit"></i>
                Select for Grading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorGrading;