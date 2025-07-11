import React, { useState, useEffect } from 'react';
import Layout from '../shared/Layout';
import './Login.css';

const Login = () => {
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
      <Layout userRole="public">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole="public">
      <div className="login-container fade-in public-theme">
        <div className="page-header">
          <h1 className="page-title">
            <i className="fas fa-cog"></i>
            Key Intelligence Training System - Login
          </h1>
          <p className="page-subtitle">
            Access your SMX KITS training portal with your credentials.
          </p>
        </div>
        
        
        <div className="login-form-container">
          <form className="login-form">
            <div className="form-group">
              <label>Username</label>
              <input type="text" placeholder="Enter your username" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Enter your password" />
            </div>
            <button type="submit" className="login-btn">
              <i className="fas fa-sign-in-alt"></i>
              Login
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default Login;