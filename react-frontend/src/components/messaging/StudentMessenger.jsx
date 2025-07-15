import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './StudentMessenger.css';

const StudentMessenger = () => {
  const navigate = useNavigate();
  const messageInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const socketRef = useRef(null);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentContact, setCurrentContact] = useState(null);
  const [currentContactId, setCurrentContactId] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUserForNewChat, setSelectedUserForNewChat] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      initializeSocket();
      loadConversations();
      loadContacts();
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const initializeUser = async () => {
    try {
      // Try to get user data from the user object first
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setCurrentUser({
            id: user.id,
            name: user.name,
            role: user.role,
            token: user.token
          });
          return;
        } catch (e) {
          console.warn('Failed to parse user data from localStorage');
        }
      }

      // Fallback to individual localStorage items
      const token = localStorage.getItem('token');
      const userName = localStorage.getItem('userName');
      const userRole = localStorage.getItem('role');
      const userId = localStorage.getItem('userId');
      
      if (!token || !userName) {
        navigate('/login.html');
        return;
      }

      setCurrentUser({
        id: userId || 'temp-id',
        name: userName,
        role: userRole || 'student',
        token: token
      });
    } catch (error) {
      console.error('Error initializing user:', error);
      navigate('/login.html');
    }
  };

  const initializeSocket = () => {
    if (!currentUser) return;

    socketRef.current = io();
    
    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      socketRef.current.emit('join_user_room', { userId: currentUser.id });
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socketRef.current.on('direct_message', (message) => {
      receiveDirectMessage(message);
    });

    socketRef.current.on('conversation_updated', () => {
      loadConversations();
    });

    socketRef.current.on('typing', (data) => {
      setTypingUsers(prev => new Set([...prev, data.username]));
    });

    socketRef.current.on('stop_typing', (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.username);
        return newSet;
      });
    });

    socketRef.current.on('user_online', (data) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
    });

    socketRef.current.on('user_offline', (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    socketRef.current.on('online_users', (data) => {
      setOnlineUsers(new Set(data.users));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  };

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/direct-messages/contacts', {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const contactsData = await response.json();
        setContacts(contactsData);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/direct-messages/conversations', {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const conversationsData = await response.json();
        setConversations(conversationsData);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const selectContact = async (contactId, contactName, contactRole) => {
    setCurrentContactId(contactId);
    setCurrentContact({ name: contactName, role: contactRole });
    
    // Load messages for this contact
    try {
      const response = await fetch(`/api/direct-messages/conversation/${contactId}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !currentContactId) return;

    const messageData = {
      recipientId: currentContactId,
      content: messageText.trim(),
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/direct-messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages(prev => [...prev, newMessage]);
        setMessageText('');
        
        // Emit socket event for real-time delivery
        if (socketRef.current) {
          socketRef.current.emit('send_direct_message', messageData);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const receiveDirectMessage = (message) => {
    if (message.senderId === currentContactId || message.recipientId === currentUser.id) {
      setMessages(prev => [...prev, message]);
    }
    
    // Update conversations list
    loadConversations();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const searchUsers = async () => {
    if (!userSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/direct-messages/search-users?q=${encodeURIComponent(userSearchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const startNewChat = () => {
    if (selectedUserForNewChat) {
      selectContact(selectedUserForNewChat.id, selectedUserForNewChat.name, selectedUserForNewChat.role);
      setShowNewChatModal(false);
      setSelectedUserForNewChat(null);
      setUserSearchQuery('');
      setSearchResults([]);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const goBack = () => {
    navigate('/dashboard.html');
  };

  if (loading) {
    return (
      <div className="messaging-layout">
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading messenger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messaging-layout">
      {/* Header Bar */}
      <header className="messaging-header">
        <div className="header-left">
          <button className="back-button" onClick={goBack}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div className="header-title">
            <h1>Student Messenger</h1>
            <p>Direct communication with instructors</p>
          </div>
        </div>
        <div className="header-right">
          <div className="user-info">
            <div className="user-avatar">
              {currentUser ? getInitials(currentUser.name) : 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">{currentUser?.name}</div>
              <div className="user-status online">Online</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="messaging-content">
        {/* Contacts Sidebar */}
        <aside className="contacts-sidebar">
          <div className="sidebar-header">
            <h2>Conversations</h2>
            <button className="new-chat-btn" onClick={() => setShowNewChatModal(true)}>
              <i className="fas fa-plus"></i>
            </button>
          </div>
          
          <div className="contacts-list">
            {conversations.length === 0 ? (
              <div className="empty-conversations">
                <i className="fas fa-comments"></i>
                <p>No conversations yet</p>
                <button onClick={() => setShowNewChatModal(true)}>Start a conversation</button>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  className={`contact-item ${currentContactId === conversation.otherUser.id ? 'active' : ''}`}
                  onClick={() => selectContact(conversation.otherUser.id, conversation.otherUser.name, conversation.otherUser.role)}
                >
                  <div className="contact-avatar">
                    {getInitials(conversation.otherUser.name)}
                    {onlineUsers.has(conversation.otherUser.id) && <div className="online-indicator"></div>}
                  </div>
                  <div className="contact-info">
                    <div className="contact-name">{conversation.otherUser.name}</div>
                    <div className="contact-role">{conversation.otherUser.role}</div>
                    <div className="last-message">{conversation.lastMessage?.content || 'No messages yet'}</div>
                  </div>
                  <div className="contact-meta">
                    <div className="last-time">
                      {conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : ''}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="unread-badge">{conversation.unreadCount}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <main className="chat-area">
          {currentContact ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <div className="chat-contact-info">
                  <div className="chat-avatar">
                    {getInitials(currentContact.name)}
                    {onlineUsers.has(currentContactId) && <div className="online-indicator"></div>}
                  </div>
                  <div className="chat-details">
                    <div className="chat-name">{currentContact.name}</div>
                    <div className="chat-status">
                      {onlineUsers.has(currentContactId) ? 'Online' : 'Offline'} • {currentContact.role}
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="messages-container" ref={messagesContainerRef}>
                {messages.map((message, index) => (
                  <div 
                    key={index}
                    className={`message ${message.senderId === currentUser.id ? 'sent' : 'received'}`}
                  >
                    <div className="message-avatar">
                      {message.senderId === currentUser.id 
                        ? getInitials(currentUser.name)
                        : getInitials(currentContact.name)
                      }
                    </div>
                    <div className="message-content">
                      <div className="message-text">{message.content}</div>
                      <div className="message-time">{formatTime(message.timestamp)}</div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {typingUsers.size > 0 && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span>{Array.from(typingUsers).join(', ')} is typing...</span>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="message-input-area">
                <div className="input-actions">
                  <button className="input-action-btn">
                    <i className="fas fa-paperclip"></i>
                  </button>
                  <button className="input-action-btn">
                    <i className="fas fa-image"></i>
                  </button>
                </div>
                <textarea
                  ref={messageInputRef}
                  className="message-input"
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows="1"
                />
                <button 
                  className="send-button"
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </>
          ) : (
            <div className="welcome-message">
              <div className="welcome-content">
                <i className="fas fa-comments"></i>
                <h2>Welcome to Student Messenger</h2>
                <p>Select a conversation from the sidebar or start a new one to begin messaging.</p>
                <button onClick={() => setShowNewChatModal(true)}>
                  <i className="fas fa-plus"></i>
                  Start New Conversation
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal active">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Start New Conversation</h3>
              <button className="modal-close" onClick={() => setShowNewChatModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <input 
                  type="text" 
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    searchUsers();
                  }}
                  style={{ 
                    width: '100%', 
                    padding: '0.8rem', 
                    background: 'var(--glass-bg)', 
                    border: '1px solid var(--glass-border)', 
                    borderRadius: '10px', 
                    color: 'var(--text-primary)' 
                  }} 
                  placeholder="Search users..." 
                />
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {searchResults.map((user) => (
                  <div 
                    key={user.id}
                    className={`user-search-result ${selectedUserForNewChat?.id === user.id ? 'selected' : ''}`}
                    onClick={() => setSelectedUserForNewChat(user)}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      marginBottom: '0.5rem',
                      background: selectedUserForNewChat?.id === user.id ? 'var(--accent-gradient)' : 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem'
                    }}
                  >
                    <div className="user-avatar" style={{ width: '40px', height: '40px' }}>
                      {getInitials(user.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user.name}</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{user.role}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button 
                  onClick={() => setShowNewChatModal(false)}
                  style={{ 
                    padding: '0.8rem 1.5rem', 
                    background: 'var(--glass-bg)', 
                    border: '1px solid var(--glass-border)', 
                    borderRadius: '10px', 
                    color: 'var(--text-primary)', 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={startNewChat}
                  disabled={!selectedUserForNewChat}
                  style={{ 
                    padding: '0.8rem 1.5rem', 
                    background: selectedUserForNewChat ? 'var(--accent-gradient)' : 'var(--glass-bg)', 
                    border: 'none', 
                    borderRadius: '10px', 
                    color: 'white', 
                    cursor: selectedUserForNewChat ? 'pointer' : 'not-allowed', 
                    fontWeight: '600',
                    opacity: selectedUserForNewChat ? 1 : 0.5
                  }}
                >
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentMessenger;