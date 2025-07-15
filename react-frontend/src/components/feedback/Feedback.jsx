import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Feedback.css';

const Feedback = () => {
  const navigate = useNavigate();
  const [activeWeek, setActiveWeek] = useState('week1');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [formData, setFormData] = useState({
    week1: {
      rating: '',
      valuable: '',
      improvements: '',
      comments: ''
    },
    week2: {
      rating: '',
      pace: '',
      engaging: '',
      comments: ''
    },
    week3: {
      overallRating: '',
      recommend: '',
      futureTopics: '',
      finalComments: ''
    }
  });

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role) {
      navigate('/login.html');
      return;
    }
  }, [navigate]);

  const switchWeek = (week) => {
    setActiveWeek(week);
  };

  const handleInputChange = (week, field, value) => {
    setFormData(prev => ({
      ...prev,
      [week]: {
        ...prev[week],
        [field]: value
      }
    }));
  };

  const submitFeedback = async (e, week) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          week: week,
          feedback: formData[week]
        })
      });

      if (response.ok) {
        setShowSuccessMessage(true);
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);
        
        // Reset form for this week
        setFormData(prev => ({
          ...prev,
          [week]: week === 'week1' ? {
            rating: '',
            valuable: '',
            improvements: '',
            comments: ''
          } : week === 'week2' ? {
            rating: '',
            pace: '',
            engaging: '',
            comments: ''
          } : {
            overallRating: '',
            recommend: '',
            futureTopics: '',
            finalComments: ''
          }
        }));
      } else {
        alert('Failed to submit feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
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
            <a href="#" onClick={() => navigate('/student-grading.html')} className="nav-link">
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
            <a href="#" className="nav-link active">
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
        {/* Page Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Course Feedback</h1>
            <p className="dashboard-subtitle">Share your thoughts to help us improve the training experience</p>
          </div>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="success-message">
            <i className="fas fa-check-circle"></i>
            <span>Feedback submitted successfully! Thank you for your input.</span>
          </div>
        )}

        {/* Feedback Section */}
        <div className="feedback-section">
          {/* Week Selector */}
          <div className="week-selector">
            <div className="week-tabs">
              <button 
                className={`week-tab ${activeWeek === 'week1' ? 'active' : ''}`}
                onClick={() => switchWeek('week1')}
              >
                Week 1
              </button>
              <button 
                className={`week-tab ${activeWeek === 'week2' ? 'active' : ''}`}
                onClick={() => switchWeek('week2')}
              >
                Week 2
              </button>
              <button 
                className={`week-tab ${activeWeek === 'week3' ? 'active' : ''}`}
                onClick={() => switchWeek('week3')}
              >
                Week 3
              </button>
            </div>
          </div>

          {/* Week 1 Content */}
          {activeWeek === 'week1' && (
            <div className="week-content active">
              <form className="feedback-form" onSubmit={(e) => submitFeedback(e, 'week1')}>
                <div className="form-group">
                  <label className="form-label">How would you rate the first week of training?</label>
                  <div className="rating-group">
                    {[
                      { value: '5', label: 'Excellent' },
                      { value: '4', label: 'Good' },
                      { value: '3', label: 'Average' },
                      { value: '2', label: 'Below Average' },
                      { value: '1', label: 'Poor' }
                    ].map(option => (
                      <label key={option.value} className="rating-option">
                        <input 
                          type="radio" 
                          name="week1Rating" 
                          value={option.value}
                          checked={formData.week1.rating === option.value}
                          onChange={(e) => handleInputChange('week1', 'rating', e.target.value)}
                          required 
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">What aspects of the training were most valuable?</label>
                  <textarea 
                    className="form-textarea" 
                    value={formData.week1.valuable}
                    onChange={(e) => handleInputChange('week1', 'valuable', e.target.value)}
                    placeholder="Please describe what you found most helpful during the first week..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">What could be improved?</label>
                  <textarea 
                    className="form-textarea" 
                    value={formData.week1.improvements}
                    onChange={(e) => handleInputChange('week1', 'improvements', e.target.value)}
                    placeholder="Please share any suggestions for improvement..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Comments</label>
                  <textarea 
                    className="form-textarea" 
                    value={formData.week1.comments}
                    onChange={(e) => handleInputChange('week1', 'comments', e.target.value)}
                    placeholder="Any other thoughts or feedback about Week 1..."
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-paper-plane" style={{ marginRight: '0.5rem' }}></i>
                    Submit Week 1 Feedback
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Week 2 Content */}
          {activeWeek === 'week2' && (
            <div className="week-content active">
              <form className="feedback-form" onSubmit={(e) => submitFeedback(e, 'week2')}>
                <div className="form-group">
                  <label className="form-label">How would you rate the second week of training?</label>
                  <div className="rating-group">
                    {[
                      { value: '5', label: 'Excellent' },
                      { value: '4', label: 'Good' },
                      { value: '3', label: 'Average' },
                      { value: '2', label: 'Below Average' },
                      { value: '1', label: 'Poor' }
                    ].map(option => (
                      <label key={option.value} className="rating-option">
                        <input 
                          type="radio" 
                          name="week2Rating" 
                          value={option.value}
                          checked={formData.week2.rating === option.value}
                          onChange={(e) => handleInputChange('week2', 'rating', e.target.value)}
                          required 
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Was the pace of instruction appropriate?</label>
                  <div className="rating-group">
                    {[
                      { value: 'too-fast', label: 'Too Fast' },
                      { value: 'slightly-fast', label: 'Slightly Fast' },
                      { value: 'just-right', label: 'Just Right' },
                      { value: 'slightly-slow', label: 'Slightly Slow' },
                      { value: 'too-slow', label: 'Too Slow' }
                    ].map(option => (
                      <label key={option.value} className="rating-option">
                        <input 
                          type="radio" 
                          name="week2Pace" 
                          value={option.value}
                          checked={formData.week2.pace === option.value}
                          onChange={(e) => handleInputChange('week2', 'pace', e.target.value)}
                          required 
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">What topics were most engaging?</label>
                  <textarea 
                    className="form-textarea" 
                    value={formData.week2.engaging}
                    onChange={(e) => handleInputChange('week2', 'engaging', e.target.value)}
                    placeholder="Tell us about the topics that captured your interest..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Additional Comments</label>
                  <textarea 
                    className="form-textarea" 
                    value={formData.week2.comments}
                    onChange={(e) => handleInputChange('week2', 'comments', e.target.value)}
                    placeholder="Any other thoughts or feedback about Week 2..."
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-paper-plane" style={{ marginRight: '0.5rem' }}></i>
                    Submit Week 2 Feedback
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Week 3 Content */}
          {activeWeek === 'week3' && (
            <div className="week-content active">
              <form className="feedback-form" onSubmit={(e) => submitFeedback(e, 'week3')}>
                <div className="form-group">
                  <label className="form-label">How would you rate your overall course experience?</label>
                  <div className="rating-group">
                    {[
                      { value: '5', label: 'Excellent' },
                      { value: '4', label: 'Good' },
                      { value: '3', label: 'Average' },
                      { value: '2', label: 'Below Average' },
                      { value: '1', label: 'Poor' }
                    ].map(option => (
                      <label key={option.value} className="rating-option">
                        <input 
                          type="radio" 
                          name="overallRating" 
                          value={option.value}
                          checked={formData.week3.overallRating === option.value}
                          onChange={(e) => handleInputChange('week3', 'overallRating', e.target.value)}
                          required 
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Would you recommend this course to others?</label>
                  <div className="rating-group">
                    {[
                      { value: 'definitely', label: 'Definitely' },
                      { value: 'probably', label: 'Probably' },
                      { value: 'maybe', label: 'Maybe' },
                      { value: 'probably-not', label: 'Probably Not' },
                      { value: 'definitely-not', label: 'Definitely Not' }
                    ].map(option => (
                      <label key={option.value} className="rating-option">
                        <input 
                          type="radio" 
                          name="recommend" 
                          value={option.value}
                          checked={formData.week3.recommend === option.value}
                          onChange={(e) => handleInputChange('week3', 'recommend', e.target.value)}
                          required 
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">What topics would you like to see in future training?</label>
                  <textarea 
                    className="form-textarea" 
                    value={formData.week3.futureTopics}
                    onChange={(e) => handleInputChange('week3', 'futureTopics', e.target.value)}
                    placeholder="Suggest topics for future training sessions..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Final Comments</label>
                  <textarea 
                    className="form-textarea" 
                    value={formData.week3.finalComments}
                    onChange={(e) => handleInputChange('week3', 'finalComments', e.target.value)}
                    placeholder="Any final thoughts about the entire course experience..."
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    <i className="fas fa-paper-plane" style={{ marginRight: '0.5rem' }}></i>
                    Submit Final Feedback
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Feedback;