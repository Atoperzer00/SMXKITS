import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AddStudent.css';

const AddStudent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    classId: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    classId: ''
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

    loadData();
  }, [navigate]);

  const loadData = async () => {
    await Promise.all([fetchClasses(), fetchStudents()]);
    setLoading(false);
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        navigate('/login.html');
        return;
      }
      
      const response = await fetch('/api/classes', {
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
        throw new Error(`Failed to fetch classes: ${response.status} ${response.statusText}`);
      }
      
      const classesData = await response.json();
      setClasses(classesData);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setResult({
        type: 'error',
        message: `Error loading classes: ${error.message}`
      });
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        navigate('/login.html');
        return;
      }
      
      const response = await fetch('/api/users?role=student', {
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
        throw new Error('Failed to fetch students');
      }
      
      const studentsData = await response.json();
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
      setResult({
        type: 'error',
        message: `Error loading students: ${error.message}`
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
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
      
      // Prepare student data
      const studentData = {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: 'student',
        status: true
      };
      
      // Add classId if one is selected
      if (formData.classId) {
        studentData.classId = formData.classId;
      }
      
      // Send to backend API to create the user
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(studentData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          navigate('/login.html');
          return;
        }
        
        throw new Error(error.error || 'Failed to add student');
      }
      
      const newStudent = await response.json();
      
      // If a class was selected, add the student to that class
      if (formData.classId && newStudent._id) {
        const classResponse = await fetch(`/api/classes/${formData.classId}/students/${newStudent._id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!classResponse.ok) {
          console.warn('Student created but could not be added to class');
        }
      }
      
      // Display success message
      setResult({
        type: 'success',
        data: {
          name: studentData.name,
          username: studentData.username,
          email: studentData.email
        }
      });
      
      // Reset form and refresh student list
      setFormData({
        name: '',
        email: '',
        username: '',
        password: '',
        classId: ''
      });
      
      await fetchStudents();
      
    } catch (error) {
      console.error('Failed to add student:', error);
      setResult({
        type: 'error',
        message: error.message
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setEditFormData({
      name: student.name || '',
      email: student.email || '',
      username: student.username || '',
      password: '', // Don't show password for security
      classId: student.classId || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        navigate('/login.html');
        return;
      }
      
      const studentId = editingStudent._id;
      const newClassId = editFormData.classId;
      const oldClassId = editingStudent.classId;
      
      // Prepare update data
      const studentData = {
        name: editFormData.name,
        email: editFormData.email,
        username: editFormData.username,
        role: 'student',
        status: true
      };
      
      // Only include password if provided
      if (editFormData.password) {
        studentData.password = editFormData.password;
      }
      
      // Update the user
      const response = await fetch(`/api/users/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(studentData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          navigate('/login.html');
          return;
        }
        
        throw new Error(error.error || 'Failed to update student');
      }
      
      // Handle class assignment changes if needed
      if (newClassId !== oldClassId) {
        // If student was in a class before, remove them
        if (oldClassId) {
          try {
            await fetch(`/api/classes/${oldClassId}/students/${studentId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
          } catch (error) {
            console.warn('Could not remove student from previous class:', error);
          }
        }
        
        // If student is being assigned to a new class, add them
        if (newClassId) {
          try {
            await fetch(`/api/classes/${newClassId}/students/${studentId}`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
          } catch (error) {
            console.warn('Could not add student to new class:', error);
          }
        }
      }
      
      // Close modal and refresh student list
      setShowEditModal(false);
      setEditingStudent(null);
      await fetchStudents();
      
      // Show success message
      setResult({
        type: 'success',
        message: 'Student updated successfully'
      });
      
    } catch (error) {
      console.error('Failed to update student:', error);
      setResult({
        type: 'error',
        message: error.message
      });
      setShowEditModal(false);
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication token missing. Please log in again.');
        navigate('/login.html');
        return;
      }
      
      const response = await fetch(`/api/users/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          navigate('/login.html');
          return;
        }
        
        throw new Error(error.error || 'Failed to delete student');
      }
      
      // Refresh student list
      await fetchStudents();
      
      // Show success message
      setResult({
        type: 'success',
        message: 'Student deleted successfully'
      });
      
    } catch (error) {
      console.error('Failed to delete student:', error);
      setResult({
        type: 'error',
        message: error.message
      });
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

  const getClassName = (classId) => {
    if (!classId) return 'Not Assigned';
    const classObj = classes.find(c => c._id === classId);
    return classObj ? classObj.name : 'Not Assigned';
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading data...</p>
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
            <a href="#" onClick={() => navigate('/add-class.html')} className="nav-link">
              <i className="fas fa-plus"></i>
              Add Class
            </a>
          </div>
          <div className="nav-item">
            <a href="#" className="nav-link active">
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
            <h1 className="dashboard-title">Add Student</h1>
            <p className="dashboard-subtitle">
              Create and manage student accounts in the system.
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
            <form onSubmit={handleSubmit} className="student-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter student name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter username"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="classId">Assign to Class</label>
                <select
                  id="classId"
                  name="classId"
                  value={formData.classId}
                  onChange={handleInputChange}
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(classItem => (
                    <option key={classItem._id} value={classItem._id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="submit-btn" disabled={submitting}>
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Adding Student...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus"></i>
                      Add Student
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
                      {result.data ? 'Student Added Successfully' : result.message}
                    </h3>
                    {result.data && (
                      <div className="result-details">
                        <p><strong>Name:</strong> {result.data.name}</p>
                        <p><strong>Username:</strong> {result.data.username}</p>
                        <p><strong>Email:</strong> {result.data.email}</p>
                      </div>
                    )}
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

        {/* Student List */}
        <div className="student-list-content fade-in stagger-2">
          <div className="list-container">
            <h2 className="list-title">Student List</h2>
            
            {students.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-users"></i>
                <div>No students found</div>
                <div>Add your first student using the form above.</div>
              </div>
            ) : (
              <div className="student-table-container">
                <table className="student-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Class</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student._id}>
                        <td>{student.name || ''}</td>
                        <td>{student.username || ''}</td>
                        <td>{student.email || ''}</td>
                        <td>{getClassName(student.classId)}</td>
                        <td>
                          <span className={`status-badge ${student.status ? 'active' : 'inactive'}`}>
                            {student.status ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              onClick={() => handleEditStudent(student)}
                              className="action-btn edit-btn"
                            >
                              <i className="fas fa-edit"></i>
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteStudent(student._id)}
                              className="action-btn delete-btn"
                            >
                              <i className="fas fa-trash"></i>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Student</h3>
              <button 
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleUpdateStudent} className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editName">Name</label>
                  <input
                    type="text"
                    id="editName"
                    name="name"
                    value={editFormData.name}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editEmail">Email</label>
                  <input
                    type="email"
                    id="editEmail"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editUsername">Username</label>
                  <input
                    type="text"
                    id="editUsername"
                    name="username"
                    value={editFormData.username}
                    onChange={handleEditInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editPassword">Password</label>
                  <input
                    type="password"
                    id="editPassword"
                    name="password"
                    value={editFormData.password}
                    onChange={handleEditInputChange}
                    placeholder="Leave blank to keep current password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="editClassId">Assign to Class</label>
                <select
                  id="editClassId"
                  name="classId"
                  value={editFormData.classId}
                  onChange={handleEditInputChange}
                >
                  <option value="">-- Select Class --</option>
                  {classes.map(classItem => (
                    <option key={classItem._id} value={classItem._id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="save-btn">
                  <i className="fas fa-save"></i>
                  Save Changes
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddStudent;