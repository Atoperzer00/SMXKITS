import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddClass.css';

const AddClass = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [instructors, setInstructors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  
  const [formData, setFormData] = useState({
    className: '',
    organization: '',
    country: 'United States',
    instructorId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    // Check authentication and admin/instructor role
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role) {
      navigate('/login.html');
      return;
    } else if (role !== 'admin' && role !== 'instructor') {
      alert('Access denied. Admin or Instructor privileges required.');
      navigate('/dashboard.html');
      return;
    }

    fetchInstructors();
  }, [navigate]);

  const fetchInstructors = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        navigate('/login.html');
        return;
      }
      
      const response = await fetch('/api/users?role=instructor', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          navigate('/login.html');
          return;
        }
        throw new Error('Failed to fetch instructors');
      }
      
      const users = await response.json();
      
      // Filter only instructors/admins with Active status
      const activeInstructors = users.filter(u => 
        (u.role === 'instructor' || u.role === 'admin') && u.status === true
      );
      
      setInstructors(activeInstructors);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      setResult({
        type: 'error',
        message: `Error loading instructors: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        navigate('/login.html');
        return;
      }
      
      // Prepare class data
      const classData = {
        name: formData.className,
        organization: formData.organization,
        country: formData.country,
        instructorId: formData.instructorId,
        startDate: formData.startDate,
        endDate: formData.endDate
      };
      
      // Make API call to create class
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(classData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          navigate('/login.html');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to create class');
      }
      
      const createdClass = await response.json();
      
      // Display success message
      setResult({
        type: 'success',
        data: createdClass
      });
      
      // Reset form
      setFormData({
        className: '',
        organization: '',
        country: 'United States',
        instructorId: '',
        startDate: '',
        endDate: ''
      });
    } catch (error) {
      console.error('Error creating class:', error);
      setResult({
        type: 'error',
        message: error.message
      });
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div className="admin-layout">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading instructors...</p>
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
            <a href="#" onClick={() => navigate('/admin-dashboard.html')} className="nav-link">
              <i className="fas fa-tachometer-alt"></i>
              Dashboard
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/classes.html')} className="nav-link">
              <i className="fas fa-users"></i>
              Classes
            </a>
          </div>
          <div className="nav-item">
            <a href="#" className="nav-link active">
              <i className="fas fa-plus"></i>
              Add Class
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/add-student.html')} className="nav-link">
              <i className="fas fa-user-plus"></i>
              Add Student
            </a>
          </div>
          <div className="nav-item">
            <a href="#" onClick={() => navigate('/users-roles.html')} className="nav-link">
              <i className="fas fa-user-cog"></i>
              Users & Roles
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
            <h1 className="dashboard-title">Add Class</h1>
            <p className="dashboard-subtitle">
              Create a new training class in the system.
            </p>
          </div>
          <div className="user-info">
            <div className="user-avatar">
              {localStorage.getItem('userName')?.split(' ').map(name => name.charAt(0)).join('').toUpperCase() || 'A'}
            </div>
            <div className="user-details">
              <div className="user-name">{localStorage.getItem('userName') || 'Administrator'}</div>
              <div className="user-role">{localStorage.getItem('role') || 'Admin'}</div>
            </div>
          </div>
        </header>

        {/* Form Content */}
        <div className="form-content fade-in stagger-1">
          <div className="form-container">
            <form onSubmit={handleSubmit} className="class-form">
              <div className="form-group">
                <label htmlFor="className">Class Name</label>
                <input
                  type="text"
                  id="className"
                  name="className"
                  value={formData.className}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter class name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="organization">Organization</label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter organization name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="country">Country</label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                >
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="instructorId">Instructor</label>
                <select
                  id="instructorId"
                  name="instructorId"
                  value={formData.instructorId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select an instructor</option>
                  {instructors.map(instructor => (
                    <option key={instructor._id} value={instructor._id}>
                      {instructor.name} ✔️
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Course Start Date</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">Course End Date</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Creating Class...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus"></i>
                      Add Class
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Result Display */}
            {result && (
              <div className={`result-container ${result.type}`}>
                {result.type === 'success' ? (
                  <div className="success-result">
                    <h3>
                      <i className="fas fa-check-circle"></i>
                      Class Created Successfully
                    </h3>
                    <div className="result-details">
                      <p><strong>Name:</strong> {result.data.name}</p>
                      <p><strong>Organization:</strong> {result.data.organization || 'N/A'}</p>
                      <p><strong>Dates:</strong> {new Date(result.data.startDate).toLocaleDateString()} to {new Date(result.data.endDate).toLocaleDateString()}</p>
                      <p><strong>ID:</strong> {result.data._id}</p>
                    </div>
                  </div>
                ) : (
                  <div className="error-result">
                    <h3>
                      <i className="fas fa-exclamation-circle"></i>
                      Error
                    </h3>
                    <p>{result.message}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddClass;