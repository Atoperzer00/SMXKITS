import React, { useState, useEffect } from 'react';
import Layout from '../shared/Layout';
import './Altis.css';

const Altis = () => {
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
      <div className="altis-container fade-in ">
        <div className="page-header">
          <h1 className="page-title">
            <i className="fas fa-cog"></i>
            Altis
          </h1>
          <p className="page-subtitle">
            Interactive mapping and terrain analysis application.
          </p>
        </div>
        
        
        <div className="content-placeholder">
          <div className="placeholder-card">
            <i className="fas fa-tools"></i>
            <h3>Component Under Development</h3>
            <p>
              This Altis component is being converted from the original HTML page. 
              All functionality and design will be preserved in the React implementation.
            </p>
            <div className="original-features">
              <h4>Original Features Being Converted:</h4>
              <ul>
                <li>Exact visual design match</li>
                <li>All interactive functionality</li>
                <li>Real-time data updates</li>
                <li>Role-based access control</li>
                <li>Responsive design</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Altis;