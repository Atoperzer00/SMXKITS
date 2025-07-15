import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UsersRoles.css';

const UsersRoles = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'instructor',
    status: true,
    classId: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check authentication and admin role
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
    try {
      await Promise.all([fetchUsers(), fetchClasses()]);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login.html');
        return;
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          navigate('/login.html');
          return;
        } else if (response.status === 403) {
          throw new Error('You do not have permission to view users');
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch users');
        }
      }

      const userData = await response.json();
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login.html');
        return;
      }

      const response = await fetch('/api/classes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const classData = await response.json();
        setClasses(classData);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setFormData(prev => ({
      ...prev,
      role,
      classId: role === 'student' ? prev.classId : ''
    }));
  };

  const showAddUserForm = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      role: 'instructor',
      status: true,
      classId: ''
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const editUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      username: user.username || '',
      password: '',
      role: user.role || 'instructor',
      status: user.status !== false,
      classId: user.classId || ''
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const saveUser = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login.html');
        return;
      }

      const userData = {
        name: formData.name,
        email: formData.email,
        username: formData.username,
        role: formData.role.toLowerCase(),
        status: formData.status
      };

      // Only include password if it's provided
      if (formData.password) {
        userData.password = formData.password;
      }

      // Validate required fields
      if (!editingUser && !formData.password) {
        setError('Password is required for new users');
        return;
      }

      let response;
      let savedUser;

      if (editingUser) {
        // Update existing user
        response = await fetch(`/api/users/${editingUser._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userData)
        });
      } else {
        // Create new user
        response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(userData)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          navigate('/login.html');
          return;
        } else if (response.status === 403) {
          throw new Error('You do not have permission to perform this action');
        } else if (response.status === 409) {
          throw new Error('Username already exists. Please choose a different username.');
        } else {
          throw new Error(errorData.error || 'Failed to save user');
        }
      }

      savedUser = await response.json();

      // Handle class assignment for students
      if (userData.role === 'student') {
        const userId = editingUser ? editingUser._id : savedUser._id;
        const oldClassId = editingUser ? editingUser.classId : null;
        const newClassId = formData.classId || null;

        // If class assignment changed
        if (oldClassId !== newClassId) {
          // Remove from old class if needed
          if (oldClassId) {
            try {
              await fetch(`/api/classes/${oldClassId}/students/${userId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
            } catch (error) {
              console.warn('Could not remove student from previous class:', error);
            }
          }

          // Add to new class if selected
          if (newClassId) {
            try {
              await fetch(`/api/classes/${newClassId}/students/${userId}`, {
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
      }

      setSuccess(editingUser ? 'User updated successfully!' : 'User created successfully!');
      
      // Refresh data and close modal after a short delay
      setTimeout(() => {
        setShowModal(false);
        loadData();
      }, 1500);

    } catch (error) {
      console.error('Error saving user:', error);
      setError(error.message);
    }
  };

  const removeUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login.html');
        return;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 401) {
          alert('Session expired. Please login again.');
          navigate('/login.html');
          return;
        } else if (response.status === 403) {
          throw new Error('You do not have permission to perform this action');
        } else if (response.status === 404) {
          throw new Error('User not found. It may have been already deleted.');
        } else {
          throw new Error(errorData.error || 'Failed to delete user');
        }
      }

      setSuccess('User deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchUsers();

    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const getClassName = (user) => {
    if (user.classId && classes.length > 0) {
      const classObj = classes.find(c => c._id === user.classId);
      return classObj ? ` (${classObj.name})` : '';
    }
    return '';
  };

  if (loading) {
    return (
      <div className="users-roles-layout">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-roles-layout">
      {/* Header */}
      <div className="users-header">
        <div className="header-content">
          <h1 className="users-title">Users & Roles</h1>
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
      <div className="users-content">
        {/* Action Bar */}
        <div className="action-bar">
          <button className="add-user-btn" onClick={showAddUserForm}>
            <i className="fas fa-plus"></i>
            Add User
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

        {/* Users Table */}
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">
                    No users found. Click "Add User" to create the first user.
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user._id}>
                    <td>{user.name || 'N/A'}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'N/A'}
                      </span>
                      {getClassName(user)}
                    </td>
                    <td>
                      <span className={`status-badge ${user.status ? 'active' : 'inactive'}`}>
                        {user.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="actions">
                      <button 
                        className="edit-btn"
                        onClick={() => editUser(user)}
                        title="Edit User"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => removeUser(user._id)}
                        title="Delete User"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingUser ? 'Edit User' : 'Add User'}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <form onSubmit={saveUser} className="user-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
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
                <label htmlFor="email">Email *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  Password {!editingUser && '*'}
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                />
                {editingUser && (
                  <small className="form-help">
                    Leave blank to keep existing password
                  </small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleRoleChange}
                  required
                >
                  <option value="admin">Admin</option>
                  <option value="instructor">Instructor</option>
                  <option value="student">Student</option>
                </select>
              </div>

              {formData.role === 'student' && (
                <div className="form-group">
                  <label htmlFor="classId">Class</label>
                  <select
                    id="classId"
                    name="classId"
                    value={formData.classId}
                    onChange={handleInputChange}
                  >
                    <option value="">-- No Class --</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="status"
                    checked={formData.status}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  Active User
                </label>
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
                  {editingUser ? 'Update User' : 'Create User'}
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
    </div>
  );
};

export default UsersRoles;