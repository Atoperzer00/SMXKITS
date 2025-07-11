import React, { useState, useEffect } from 'react';
import Layout from '../shared/Layout';
import './Dashboard.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // TODO: Implement API call based on original HTML functionality
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout userRole="student">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole="student">
      <div className="dashboard-container fade-in ">
        <div className="page-header">
          <h1 className="page-title">
            <i className="fas fa-tachometer-alt"></i>
            Dashboard
          </h1>
          <p className="page-subtitle">
            Your personalized learning dashboard with progress tracking and quick access to training modules.
          </p>
        </div>
        
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <i className="fas fa-graduation-cap"></i>
            <div className="stat-info">
              <h3>Training Progress</h3>
              <p>75% Complete</p>
            </div>
          </div>
          <div className="stat-card">
            <i className="fas fa-trophy"></i>
            <div className="stat-info">
              <h3>Achievements</h3>
              <p>12 Earned</p>
            </div>
          </div>
          <div className="stat-card">
            <i className="fas fa-clock"></i>
            <div className="stat-info">
              <h3>Study Time</h3>
              <p>24.5 Hours</p>
            </div>
          </div>
        </div>
        
        <div className="training-modules">
          <h2>Available Training Modules</h2>
          <div className="modules-grid">
            <div className="module-card" onClick={() => window.location.href = '/keyboard-training.html'}>
              <i className="fas fa-keyboard"></i>
              <h3>Keyboard Training</h3>
              <p>Improve typing speed and accuracy</p>
            </div>
            <div className="module-card" onClick={() => window.location.href = '/mission-links.html'}>
              <i className="fas fa-rocket"></i>
              <h3>Live PED Exercise</h3>
              <p>Real-time mission scenarios</p>
            </div>
            <div className="module-card" onClick={() => window.location.href = '/Screener Training.html'}>
              <i className="fas fa-user-shield"></i>
              <h3>Screener Training</h3>
              <p>Security screening protocols</p>
            </div>
            <div className="module-card" onClick={() => window.location.href = '/IA Training.html'}>
              <i className="fas fa-satellite-dish"></i>
              <h3>Intelligence Analysis</h3>
              <p>Advanced analysis techniques</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;