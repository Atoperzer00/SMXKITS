// Authentication check script
// Include this at the top of any protected page

(function() {
  'use strict';
  
  // Check authentication immediately
  function checkAuth() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const userName = localStorage.getItem('userName');
    
    // If no authentication data, redirect to login
    if (!token || !role) {
      console.log('No authentication found, redirecting to login');
      window.location.replace('/login.html');
      return false;
    }
    
    // Optional: Check if token is expired (if you implement JWT expiration)
    try {
      // Basic token validation (you can enhance this)
      if (token.length < 10) {
        throw new Error('Invalid token format');
      }
      
      console.log('Authentication verified for:', userName, '(' + role + ')');
      return true;
    } catch (error) {
      console.log('Invalid token, redirecting to login');
      localStorage.clear();
      window.location.replace('/login.html');
      return false;
    }
  }
  
  // Global logout function
  window.logout = function() {
    console.log('Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    localStorage.removeItem('classId');
    window.location.replace('/login.html');
  };
  
  // Check auth on page load
  if (!checkAuth()) {
    // Stop script execution if not authenticated
    return;
  }
  
  // Periodically check authentication (every 5 minutes)
  setInterval(function() {
    if (!localStorage.getItem('token')) {
      console.log('Token lost, redirecting to login');
      window.location.replace('/login.html');
    }
  }, 300000); // 5 minutes
  
})();