import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OpsLogCalls.css';

const OpsLogCalls = () => {
  const navigate = useNavigate();
  const [followState, setFollowState] = useState(null);
  const [showFollowCreator, setShowFollowCreator] = useState(false);
  const [followForm, setFollowForm] = useState({
    name: '',
    stage: 'START'
  });

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role) {
      navigate('/login');
      return;
    }
  }, [navigate]);

  const generateFollowId = () => {
    return `ID-${Date.now()}`;
  };

  const handleCreateFollow = () => {
    if (followState) {
      // Cancel existing follow
      setFollowState(null);
      setShowFollowCreator(false);
      setFollowForm({ name: '', stage: 'START' });
    } else {
      // Create new follow
      setShowFollowCreator(true);
    }
  };

  const handleSaveFollow = () => {
    if (!followForm.name.trim()) {
      alert('Please enter a follow name');
      return;
    }

    const newFollow = {
      id: generateFollowId(),
      name: followForm.name,
      stage: followForm.stage,
      ended: followForm.stage === 'END',
      createdAt: new Date().toISOString()
    };

    setFollowState(newFollow);
    setShowFollowCreator(false);
    
    console.log('Follow created:', newFollow);
  };

  const handleCancelFollow = () => {
    setShowFollowCreator(false);
    setFollowForm({ name: '', stage: 'START' });
  };

  const handleStageChange = (newStage) => {
    if (followState) {
      const updatedFollow = {
        ...followState,
        stage: newStage,
        ended: newStage === 'END'
      };
      setFollowState(updatedFollow);
      console.log('Follow stage updated:', updatedFollow);
    }
  };

  const handleFormChange = (e) => {
    setFollowForm({
      ...followForm,
      [e.target.name]: e.target.value
    });
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'START':
        return 'var(--qc-orange)';
      case 'CONT.':
        return 'var(--qc-blue)';
      case 'ADV.':
        return 'var(--qc-purple)';
      case 'END':
        return 'var(--qc-red)';
      default:
        return 'var(--qc-orange)';
    }
  };

  return (
    <div className="opslog-calls-layout">
      {/* Header */}
      <div className="opslog-calls-header">
        <div className="header-content">
          <h1 className="opslog-calls-title">OpsLog - Call Management</h1>
          <button 
            className="back-btn"
            onClick={() => navigate('/dashboard')}
          >
            <i className="fas fa-arrow-left"></i>
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="opslog-calls-content">
        {/* Callout Container */}
        <div className="callout-container">
          {/* Callout Information */}
          <div className="callout-info">
            <div className="callout-card">
              <h3>Current Callout Information</h3>
              <p>Callout details and operational information will be displayed here.</p>
              <div className="callout-details">
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className="value">Active</span>
                </div>
                <div className="detail-row">
                  <span className="label">Priority:</span>
                  <span className="value priority-high">High</span>
                </div>
                <div className="detail-row">
                  <span className="label">Location:</span>
                  <span className="value">Training Area Alpha</span>
                </div>
              </div>
            </div>
          </div>

          {/* Create Follow Button */}
          <div className="follow-controls">
            <button 
              className="create-follow-btn"
              onClick={handleCreateFollow}
            >
              {followState ? 'Cancel Follow' : 'Create Follow'}
            </button>
          </div>

          {/* Follow Creator */}
          {showFollowCreator && (
            <div className="follow-creator">
              <div className="follow-creator-content">
                <h4>Create New Follow</h4>
                
                <div className="form-group">
                  <label htmlFor="followName">Follow Name:</label>
                  <input
                    type="text"
                    id="followName"
                    name="name"
                    placeholder="Enter follow name"
                    value={followForm.name}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-group">
                  <label>Follow ID:</label>
                  <span className="follow-id-display">{generateFollowId()}</span>
                </div>

                <div className="form-group">
                  <label htmlFor="stageSelector">Follow Stage:</label>
                  <select
                    id="stageSelector"
                    name="stage"
                    value={followForm.stage}
                    onChange={handleFormChange}
                  >
                    <option value="START">START</option>
                    <option value="CONT.">CONT.</option>
                    <option value="ADV.">ADV.</option>
                    <option value="END">END</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button className="save-btn" onClick={handleSaveFollow}>
                    Create Follow
                  </button>
                  <button className="cancel-btn" onClick={handleCancelFollow}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Follow Display */}
          {followState && (
            <div className="active-follow">
              <div className="follow-header">
                <h4>Active Follow</h4>
                <div className="follow-status">
                  <span className={`status-badge ${followState.ended ? 'ended' : 'active'}`}>
                    {followState.ended ? 'ENDED' : 'ACTIVE'}
                  </span>
                </div>
              </div>

              <div className="follow-details">
                <div className="detail-row">
                  <span className="label">Follow Name:</span>
                  <span className="value">{followState.name}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Follow ID:</span>
                  <span className="value">{followState.id}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Current Stage:</span>
                  <div className="stage-controls">
                    <button 
                      className="stage-btn"
                      style={{ backgroundColor: getStageColor(followState.stage) }}
                    >
                      {followState.stage}
                    </button>
                    <select
                      className="stage-selector"
                      value={followState.stage}
                      onChange={(e) => handleStageChange(e.target.value)}
                      disabled={followState.ended}
                    >
                      <option value="START">START</option>
                      <option value="CONT.">CONT.</option>
                      <option value="ADV.">ADV.</option>
                      <option value="END">END</option>
                    </select>
                  </div>
                </div>
                <div className="detail-row">
                  <span className="label">Created:</span>
                  <span className="value">
                    {new Date(followState.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {followState.ended && (
                <div className="follow-ended-notice">
                  <i className="fas fa-check-circle"></i>
                  This follow has been marked as ENDED
                </div>
              )}
            </div>
          )}

          {/* SLANT and IA Notes Section */}
          <div className="notes-section">
            <div className="notes-card">
              <h4>SLANT Report</h4>
              <textarea
                className="notes-textarea"
                placeholder="Enter SLANT report details..."
                rows="4"
              />
            </div>
            
            <div className="notes-card">
              <h4>IA Notes</h4>
              <textarea
                className="notes-textarea"
                placeholder="Enter intelligence analyst notes..."
                rows="4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpsLogCalls;