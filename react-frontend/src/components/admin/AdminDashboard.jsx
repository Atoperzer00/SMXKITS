import React, { useState, useEffect } from 'react';
import Layout from '../shared/Layout';
import './AdminDashboard.css';

const AdminDashboard = () => {
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
      <Layout userRole="admin">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole="admin">
      <div className="admindashboard-container fade-in admin-theme">
        <div className="page-header">
          <h1 className="page-title">
            <i className="fas fa-tachometer-alt"></i>
            Instructor Command Center
          </h1>
          <p className="page-subtitle">
            Administrative control panel for managing users, courses, and system settings.
          </p>
        </div>
        
        
        <div className="admin-overview">
          <div className="overview-cards">
            <div className="overview-card">
              <i className="fas fa-users"></i>
              <div className="card-info">
                <h3>Total Students</h3>
                <p className="card-number">156</p>
              </div>
            </div>
            <div className="overview-card">
              <i className="fas fa-chalkboard-teacher"></i>
              <div className="card-info">
                <h3>Active Instructors</h3>
                <p className="card-number">12</p>
              </div>
            </div>
            <div className="overview-card">
              <i className="fas fa-book"></i>
              <div className="card-info">
                <h3>Active Courses</h3>
                <p className="card-number">8</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="admin-actions">
          <h2>Quick Actions</h2>
          <div className="actions-grid">
            <button className="action-btn" onClick={() => window.location.href = '/users-roles.html'}>
              <i className="fas fa-user-cog"></i>
              Manage Users & Roles
            </button>
            <button className="action-btn" onClick={() => window.location.href = '/classes.html'}>
              <i className="fas fa-school"></i>
              Manage Classes
            </button>
            <button className="action-btn" onClick={() => window.location.href = '/template-editor.html'}>
              <i className="fas fa-edit"></i>
              Template Editor
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;