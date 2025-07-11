import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Chart from 'chart.js/auto';
import './StudentGrading.css';

const StudentGrading = () => {
  const navigate = useNavigate();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  
  const [studentData, setStudentData] = useState({
    name: "",
    missions: []
  });
  const [showModal, setShowModal] = useState(false);
  const [currentMission, setCurrentMission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializePage();
    
    return () => {
      // Cleanup chart instance
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  const initializePage = async () => {
    await loadUserInfo();
    await loadStudentSubmissions();
    setLoading(false);
  };

  const loadUserInfo = async () => {
    try {
      const userName = localStorage.getItem('userName');
      if (userName) {
        setStudentData(prev => ({ ...prev, name: userName }));
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadStudentSubmissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login.html');
        return;
      }

      const response = await fetch('/api/submissions/my-submissions', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        const missions = data.submissions
          .filter(sub => sub.status === 'graded')
          .map(sub => ({
            id: sub.id,
            title: sub.missionTitle,
            date: sub.gradedAt || sub.submittedAt,
            description: `Submitted: ${formatDate(sub.submittedAt)}${sub.gradedAt ? ` | Graded: ${formatDate(sub.gradedAt)}` : ''}`,
            overallGrade: sub.grade || 0,
            status: "Completed",
            grades: transformRubricScores(sub.rubricScores),
            instructorNotes: sub.instructorNotes,
            fileName: sub.fileName,
            gradedBy: sub.gradedBy
          }));
        
        setStudentData(prev => ({ ...prev, missions }));
      }
    } catch (error) {
      console.error('Error loading student submissions:', error);
    }
  };

  const transformRubricScores = (rubricScores) => {
    if (!rubricScores || rubricScores.length === 0) {
      return {};
    }
    
    const grades = {};
    rubricScores.forEach(score => {
      grades[score.category] = score.score;
    });
    
    return grades;
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

  const openGradeModal = (missionId) => {
    const mission = studentData.missions.find(m => m.id === missionId);
    if (mission) {
      setCurrentMission(mission);
      setShowModal(true);
      
      // Create chart after modal is shown
      setTimeout(() => {
        createGradeChart(mission);
      }, 100);
    }
  };

  const closeGradeModal = () => {
    setShowModal(false);
    setCurrentMission(null);
    
    // Destroy existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
  };

  const createGradeChart = (mission) => {
    if (!chartRef.current || !mission.grades) return;

    // Destroy existing chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    const grades = mission.grades;
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
              padding: 20,
              font: {
                size: 12
              }
            }
          }
        }
      }
    });
  };

  const openPowerPoint = () => {
    alert('PowerPoint functionality will be implemented in the future.');
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('classId');
    localStorage.removeItem('studentDay');
    navigate('/login.html');
  };

  const getSummaryStats = () => {
    const missions = studentData.missions;
    
    if (missions.length === 0) {
      return {
        averageGrade: 0,
        completedMissions: 0,
        highestGrade: 0,
        improvementTrend: 0
      };
    }

    const grades = missions.map(m => m.overallGrade).filter(g => g > 0);
    const averageGrade = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
    const highestGrade = grades.length > 0 ? Math.max(...grades) : 0;
    
    // Calculate improvement trend (simple: last grade - first grade)
    let improvementTrend = 0;
    if (grades.length >= 2) {
      improvementTrend = grades[grades.length - 1] - grades[0];
    }

    return {
      averageGrade: averageGrade.toFixed(1),
      completedMissions: missions.length,
      highestGrade: highestGrade.toFixed(1),
      improvementTrend: improvementTrend >= 0 ? `+${improvementTrend.toFixed(1)}` : improvementTrend.toFixed(1)
    };
  };

  const stats = getSummaryStats();

  if (loading) {
    return (
      <div className="admin-layout">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading grades...</p>
        </div>
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
            <a href="#" onClick={() => navigate('/mission-links.html')} className="nav-link">
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
            <a href="#" className="nav-link active">
              <i className="fas fa-chart-line"></i>
              My Grades
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/student-messenger.html')} className="nav-link">
              <i className="fas fa-comments"></i>
              Messages
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/feedback.html')} className="nav-link">
              <i className="fas fa-star"></i>
              Feedback
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
            <h1 className="dashboard-title">My Grades</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.5rem' }}>
              Track your academic progress and view detailed grade breakdowns for all completed missions.
            </p>
          </div>
          <div className="user-info">
            <div className="user-avatar" id="userAvatar">
              {studentData.name.split(' ').map(name => name.charAt(0)).join('').toUpperCase()}
            </div>
            <div className="user-details">
              <div className="user-name" id="userName">{studentData.name}</div>
              <div className="user-role">Student</div>
            </div>
          </div>
        </header>

        {/* Summary Statistics */}
        <div className="stats-grid fade-in stagger-1">
          <div className="stat-card">
            <div className="stat-value">{stats.averageGrade}</div>
            <div className="stat-label">Average Grade</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.completedMissions}</div>
            <div className="stat-label">Completed Missions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.highestGrade}</div>
            <div className="stat-label">Highest Grade</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.improvementTrend}</div>
            <div className="stat-label">Improvement Trend</div>
          </div>
        </div>

        {/* Mission Grades Section */}
        <div className="section-title">
          <span>Mission Grades</span>
        </div>

        {studentData.missions.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-clipboard-list"></i>
            <div>No grades available yet</div>
            <div style={{ fontSize: '1rem', marginTop: '10px' }}>
              Complete your first mission to see your grades here.
            </div>
          </div>
        ) : (
          <div className="missions-grid fade-in stagger-2">
            {studentData.missions.map((mission) => (
              <div key={mission.id} className="mission-card" onClick={() => openGradeModal(mission.id)}>
                <div className="mission-header">
                  <div className="mission-title">{mission.title}</div>
                  <div className="mission-date">{formatDate(mission.date)}</div>
                </div>
                <div className="mission-description">{mission.description}</div>
                <div className="mission-grade">
                  <div className="grade-score">
                    {mission.overallGrade ? mission.overallGrade.toFixed(1) : 'N/A'}
                  </div>
                  <div className="grade-status">{mission.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Grade Details Modal */}
      {showModal && currentMission && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Mission Grade Details</h2>
              <button className="modal-close" onClick={closeGradeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="grade-details-container">
              <div className="chart-container">
                <canvas ref={chartRef} width="360" height="360"></canvas>
              </div>
              
              <div className="grade-breakdown">
                {Object.entries(currentMission.grades || {}).map(([category, score]) => (
                  <div key={category} className="breakdown-item">
                    <div className="breakdown-label">{category}</div>
                    <div className="breakdown-score">{score}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* PowerPoint Section */}
            <div className="powerpoint-section">
              <h3><i className="fas fa-file-powerpoint"></i> Graded PowerPoint</h3>
              <button className="powerpoint-btn" onClick={openPowerPoint} disabled>
                <i className="fas fa-external-link-alt"></i>
                Open Graded PowerPoint
              </button>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                PowerPoint functionality will be implemented in the future.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentGrading;