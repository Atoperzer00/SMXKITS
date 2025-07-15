import React, { useState, useRef, useEffect } from 'react';
import FileUploader from '../utils/FileUploader';
import VideoPlayer from '../utils/VideoPlayer';

import './Streaming.css';

const Streaming = () => {
  const [videoFileName, setVideoFileName] = useState(null)
  const handleGoLive = () => {

  }

  return (
    <>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <div className="header-icon">🎥</div>
            Stream Control Center
          </div>
          <div className="status-section">
            <div className="viewer-count">
              <div className="viewer-count-icon">👥</div>
              <span id="viewerCount">0</span> viewers
            </div>
            <div className="status-badge status-offline" id="streamStatus">OFFLINE</div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="container">
        <div className="main-layout">

          {/* Stream Control Card */}
          <div className="card stream-control-card">
            <div className="card-header">
              <div className="card-title">
                <div className="card-icon">🎬</div>
                Stream Setup
              </div>
            </div>
            <div className="card-content">

              {/* Class Selection */}
              <div className="class-selection">
                <label htmlFor="classSelect" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Select Class
                </label>
                <select id="classSelect" className="class-select">
                  <option value="">Choose your class...</option>
                  {/* Dynamically populated */}
                </select>
              </div>

              {/* Stream Source Tabs */}
              <div className="stream-source-tabs">
                <button className="source-tab active" id="fileTab">📁 File Upload</button>
                <button className="source-tab" id="liveTab">📹 Live Stream</button>
              </div>

              {/* Video Preview */}
              <div className="video-preview-container" id="videoPreview">
                <VideoPlayer filename="1722694-uhd_3840_2160_25fps" />
              </div>


              {/* Stream Controls */}
              <div className="stream-controls">
                <button className="btn btn-primary btn-full" id="goLiveBtn">🔴 Go Live</button>
                <button className="btn btn-danger btn-full" id="stopBtn" disabled>⏹️ End Stream</button>
                <button className="btn btn-secondary" id="startCameraBtn" style={{ display: 'none' }}>📹 Camera</button>
                <button className="btn btn-secondary" id="startScreenBtn" style={{ display: 'none' }}>🖥️ Screen Share</button>
                <button className="btn btn-danger" id="stopMediaBtn" style={{ display: 'none' }}>⏹️ Stop Media</button>
              </div>

            </div>
          </div>

          {/* Right Panel */}
          <div className="right-panel">
            <div className="panel-section">
              <div className="section-title">Upload Video</div>
              <FileUploader setVideoFileName={setVideoFileName}/>
              <div className="upload-status" id="uploadStatus"></div>
              <div className="progress-bar">
                <div className="progress-fill" id="progressFill"></div>
              </div>
              <div className="file-info" id="fileInfo">
                <div className="file-info-title" id="fileInfoTitle"></div>
                <div className="file-info-details" id="fileInfoDetails"></div>
                <div className="drag-hint" id="dragHint" style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '8px', display: 'none' }}>
                  🎬 Drag this to the video player to load it
                </div>
                <button className="control-btn" id="uploadBtn" style={{ width: '100%', marginTop: '12px', display: 'none' }}>
                  📤 Upload to Server (Required for Streaming)
                </button>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-title">Stream Information</div>
              <div className="settings-row">Class: <span id="classLabel">Not selected</span></div>
              <div className="settings-row">Status: <span id="streamStatusInfo">Offline</span></div>
              <div className="settings-row">Viewers: <span id="viewerCountInfo">0</span></div>
            </div>

            <div className="panel-section">
              <div className="section-title">Submitted Files</div>
              <div id="submittedFiles" className="server-uploads"></div>
            </div>

            <div className="panel-section">
              <div className="section-title">Server Uploads</div>
              <div id="serverUploads" className="server-uploads"></div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Streaming;
