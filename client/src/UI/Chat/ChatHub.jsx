import React, { useState } from 'react';
import { FaComments, FaPaperPlane, FaPaperclip } from 'react-icons/fa';

import './ChatHub.css'; 

export default function ChatHub() {
  const [message, setMessage] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [loading, setLoading] = useState(true); // simulate loading state

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadStatus(`Uploading: ${file.name}...`);
      // Simulate upload
      setTimeout(() => {
        setUploadStatus(`Uploaded: ${file.name}`);
      }, 1500);
    }
  };

  const sendChatMessage = () => {
    if (!message.trim()) return;
    console.log('Send message:', message);
    setMessage('');
  };

  const triggerFilePicker = () => {
    document.getElementById('chatFile').click();
  };

  return (
    <section className="chat-section fade-in stagger-4">
      <h3>
        <FaComments /> Instructor Chat Hub
      </h3>

      <div className="chatbox-messages">
        {loading ? (
          <div className="chat-loading">Loading messages...</div>
        ) : (
          <div className="chat-message">Hello, this is a test message.</div>
        )}
      </div>

      <div className="chatbox-inputs">
        <input
          type="text"
          placeholder="Type your message to students and staff..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <input type="file" id="chatFile" style={{ display: 'none' }} onChange={handleFileUpload} />

        <button type="button" onClick={triggerFilePicker}>
          <FaPaperclip /> Send File
        </button>

        <button type="button" onClick={sendChatMessage}>
          <FaPaperPlane /> Send
        </button>
      </div>

      {uploadStatus && (
        <div id="uploadStatus" className='chat-upload-status'>
          {uploadStatus}
        </div>
      )}
    </section>
  );
}
