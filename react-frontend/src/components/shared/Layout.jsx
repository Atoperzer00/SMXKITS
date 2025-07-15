import React, { useEffect } from 'react';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = ({ children, userRole = 'student' }) => {
  useEffect(() => {
    // Apply theme class to body
    document.body.className = userRole === 'student' ? '' : `${userRole}-theme`;
    
    return () => {
      // Cleanup on unmount
      document.body.className = '';
    };
  }, [userRole]);

  return (
    <div className={`admin-layout ${userRole}-theme`}>
      <Sidebar userRole={userRole} />
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;