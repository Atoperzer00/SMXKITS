import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Classes.css';

const Classes = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    maxStudents: 20,
    status: 'active'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);

  useEffect(() => {
    // Check authentication and admin role
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || (role !== 'admin' && role !== 'instructor')) {
      navigate('/login.html');
      return;
    }

    loadClasses();
  }, [navigate]);

  const loadClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/classes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setClasses(Array.isArray(data) ? data : data.classes || []);
      } else {
        // Fallback to sample data if API not available
        setClasses([
          { 
            _id: '1', 
            name: 'Alpha Squadron', 
            description: 'Advanced tactical training program',
            startDate: '2025-01-15', 
            endDate: '2025-03-15',
            maxStudents: 20,
            status: 'active',
            students: ['student1', 'student2']
          },
          { 
            _id: '2', 
            name: 'Bravo Team', 
            description: 'Intelligence analysis specialization',
            startDate: '2025-02-01', 
            endDate: '2025-04-01',
            maxStudents: 15,
            status: 'active',
            students: ['student3']
          }
        ]);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      // Fallback to sample data
      setClasses([
        { 
          _id: '1', 
          name: 'Alpha Squadron', 
          description: 'Advanced tactical training program',
          startDate: '2025-01-15', 
          endDate: '2025-03-15',
          maxStudents: 20,
          status: 'active',
          students: ['student1', 'student2']
        },
        { 
          _id: '2', 
          name: 'Bravo Team', 
          description: 'Intelligence analysis specialization',
          startDate: '2025-02-01', 
          endDate: '2025-04-01',
          maxStudents: 15,
          status: 'active',
          students: ['student3']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadClassStudents = async (classId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/classes/${classId}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const studentData = await response.json();
        setStudents(studentData);
      } else {
        // Fallback data
        setStudents([
          { _id: '1', name: 'John Smith', email: 'john@example.com', status: true },
          { _id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', status: true }
        ]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([
        { _id: '1', name: 'John Smith', email: 'john@example.com', status: true },
        { _id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', status: true }
      ]);
    }
  };

  const isActive = (endDateStr) => {
    const today = new Date();
    const endDate = new Date(endDateStr);
    return today <= endDate;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const showAddClassForm = () => {
    setEditingClass(null);
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      maxStudents: 20,
      status: 'active'
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const editClass = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name || '',
      description: classItem.description || '',
      startDate: classItem.startDate || '',
      endDate: classItem.endDate || '',
      maxStudents: classItem.maxStudents || 20,
      status: classItem.status || 'active'
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const saveClass = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      
      const classData = {
        name: formData.name,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        maxStudents: parseInt(formData.maxStudents),
        status: formData.status
      };

      let response;

      if (editingClass) {
        // Update existing class
        response = await fetch(`/api/classes/${editingClass._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(classData)
        });
      } else {
        // Create new class
        response = await fetch('/api/classes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(classData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save class');
      }

      setSuccess(editingClass ? 'Class updated successfully!' : 'Class created successfully!');
      
      // Refresh data and close modal after a short delay
      setTimeout(() => {
        setShowModal(false);
        loadClasses();
      }, 1500);

    } catch (error) {
      console.error('Error saving class:', error);
      setError(error.message);
    }
  };

  const removeClass = async (classId) => {
    if (!window.confirm("Are you sure you want to remove this class? This will also remove all associated students.")) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setSuccess('Class removed successfully!');
        setTimeout(() => setSuccess(''), 3000);
        await loadClasses();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove class');
      }
    } catch (error) {
      console.error('Error removing class:', error);
      setError(error.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const viewStudents = (classItem) => {
    setSelectedClass(classItem);
    loadClassStudents(classItem._id);
    setShowStudentsModal(true);
  };

  const removeStudentFromClass = async (studentId) => {
    if (!window.confirm("Are you sure you want to remove this student from the class?")) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/classes/${selectedClass._id}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Student removed from class successfully!');
        setTimeout(() => setSuccess(''), 3000);
        await loadClassStudents(selectedClass._id);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove student');
      }
    } catch (error) {
      console.error('Error removing student:', error);
      setError(error.message);
      setTimeout(() => setError(''), 5000);
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
      <div className="classes-layout">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="classes-layout">
      {/* Header */}
      <div className="classes-header">
        <div className="header-content">
          <h1 className="classes-title">Class Management</h1>
          <button 
            className="back-btn"
            onClick={() => navigate('/admin-dashboard.html')}
          >
            <i className="fas fa-arrow-left"></i>
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="classes-content">
        {/* Action Bar */}
        <div className="action-bar">
          <button className="add-class-btn" onClick={showAddClassForm}>
            <i className="fas fa-plus"></i>
            Add Class
          </button>
          
          {error && (
            <div className="alert alert-error">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              <i className="fas fa-check-circle"></i>
              {success}
            </div>
          )}
        </div>

        {/* Classes Grid */}
        <div className="classes-grid">
          {classes.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-graduation-cap"></i>
              <h3>No classes found</h3>
              <p>Click "Add Class" to create your first class.</p>
            </div>
          ) : (
            classes.map(classItem => (
              <div key={classItem._id} className="class-card">
                <div className="class-header">
                  <h3 className="class-name">{classItem.name}</h3>
                  <span className={`status-badge ${classItem.status}`}>
                    {classItem.status}
                  </span>
                </div>
                
                <div className="class-body">
                  <p className="class-description">{classItem.description}</p>
                  
                  <div className="class-details">
                    <div className="detail-item">
                      <i className="fas fa-calendar-alt"></i>
                      <span>Start: {new Date(classItem.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-calendar-check"></i>
                      <span>End: {new Date(classItem.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <i className="fas fa-users"></i>
                      <span>Students: {classItem.students?.length || 0}/{classItem.maxStudents}</span>
                    </div>
                  </div>
                </div>

                <div className="class-actions">
                  <button 
                    className="view-btn"
                    onClick={() => viewStudents(classItem)}
                    title="View Students"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button 
                    className="edit-btn"
                    onClick={() => editClass(classItem)}
                    title="Edit Class"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => removeClass(classItem._id)}
                    title="Delete Class"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Class Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="class-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingClass ? 'Edit Class' : 'Add Class'}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={saveClass} className="class-form">
              <div className="form-group">
                <label htmlFor="name">Class Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date *</label>
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
                  <label htmlFor="endDate">End Date *</label>
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

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="maxStudents">Max Students</label>
                  <input
                    type="number"
                    id="maxStudents"
                    name="maxStudents"
                    value={formData.maxStudents}
                    onChange={handleInputChange}
                    min="1"
                    max="100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="form-error">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              {success && (
                <div className="form-success">
                  <i className="fas fa-check-circle"></i>
                  {success}
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="save-btn">
                  <i className="fas fa-save"></i>
                  {editingClass ? 'Update Class' : 'Create Class'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Students Modal */}
      {showStudentsModal && (
        <div className="modal-overlay" onClick={() => setShowStudentsModal(false)}>
          <div className="students-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Students in {selectedClass?.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowStudentsModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="students-content">
              {students.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-user-graduate"></i>
                  <p>No students enrolled in this class yet.</p>
                </div>
              ) : (
                <div className="students-list">
                  {students.map(student => (
                    <div key={student._id} className="student-item">
                      <div className="student-info">
                        <div className="student-avatar">
                          {student.name.split(' ').map(n => n.charAt(0)).join('').toUpperCase()}
                        </div>
                        <div className="student-details">
                          <h4>{student.name}</h4>
                          <span>{student.email}</span>
                        </div>
                      </div>
                      <div className="student-actions">
                        <span className={`status-badge ${student.status ? 'active' : 'inactive'}`}>
                          {student.status ? 'Active' : 'Inactive'}
                        </span>
                        <button 
                          className="remove-student-btn"
                          onClick={() => removeStudentFromClass(student._id)}
                          title="Remove from class"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;