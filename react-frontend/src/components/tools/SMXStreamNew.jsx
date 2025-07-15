import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './SMXStreamNew.css';

const SMXStreamNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const hlsRef = useRef(null);

  // State management
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [streamStatus, setStreamStatus] = useState('Connecting...');
  const [isLoading, setIsLoading] = useState(true);
  const [behindLiveSeconds, setBehindLiveSeconds] = useState(0);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [clockTime, setClockTime] = useState('--:--:--');

  // Stream data
  const [classId, setClassId] = useState(null);
  const [streamKey, setStreamKey] = useState(null);
  const [isInstructor, setIsInstructor] = useState(false);

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || !role) {
      navigate('/login');
      return;
    }

    setIsInstructor(role === 'instructor');
    
    // Get class ID from URL params
    const classIdParam = searchParams.get('classId');
    if (classIdParam) {
      setClassId(classIdParam);
    }
  }, [navigate, searchParams]);

  // Initialize HLS streaming
  useEffect(() => {
    if (classId && typeof window !== 'undefined' && window.Hls) {
      initializeHLS();
    }
  }, [classId]);

  // Clock update
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour12: false });
      setClockTime(timeString);
    };

    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    return () => clearInterval(clockInterval);
  }, []);

  // Socket connection for real-time sync
  useEffect(() => {
    if (classId && typeof window !== 'undefined' && window.io) {
      initializeSocket();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [classId]);

  const initializeHLS = async () => {
    try {
      setIsLoading(true);
      setStreamStatus('Connecting to stream...');

      // Check if stream is available
      const response = await fetch(`/api/stream/status/${classId}`);
      const streamData = await response.json();

      if (streamData.active) {
        const hlsUrl = `/api/stream/hls/${classId}/playlist.m3u8`;
        
        if (window.Hls.isSupported()) {
          const hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });

          hls.loadSource(hlsUrl);
          hls.attachMedia(videoRef.current);

          hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            setStreamStatus('Stream ready');
            setIsLoading(false);
          });

          hls.on(window.Hls.Events.ERROR, (event, data) => {
            console.error('HLS Error:', data);
            setStreamStatus('Stream error');
            setIsLoading(false);
          });

          hlsRef.current = hls;
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          // Safari native HLS support
          videoRef.current.src = hlsUrl;
          setIsLoading(false);
        }
      } else {
        setStreamStatus('Stream not available');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to initialize HLS:', error);
      setStreamStatus('Connection failed');
      setIsLoading(false);
    }
  };

  const initializeSocket = () => {
    const socket = window.io();
    socketRef.current = socket;

    socket.emit('join-stream', { classId, role: localStorage.getItem('role') });

    socket.on('stream-sync', (data) => {
      if (!isInstructor) {
        syncWithInstructor(data);
      }
    });

    socket.on('stream-status', (data) => {
      setStreamStatus(data.status);
      setIsLive(data.isLive);
    });
  };

  const syncWithInstructor = (data) => {
    if (videoRef.current && !isInstructor) {
      const timeDiff = Math.abs(videoRef.current.currentTime - data.currentTime);
      
      if (timeDiff > 2) { // Sync if more than 2 seconds off
        videoRef.current.currentTime = data.currentTime;
      }

      if (data.isPlaying !== isPlaying) {
        if (data.isPlaying) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      }
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const rewindVideo = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - seconds);
    }
  };

  const jumpToLive = () => {
    if (videoRef.current && hlsRef.current) {
      // Jump to live edge
      const seekableEnd = videoRef.current.seekable.length > 0 
        ? videoRef.current.seekable.end(videoRef.current.seekable.length - 1) 
        : videoRef.current.duration;
      
      videoRef.current.currentTime = seekableEnd - 1; // 1 second before live edge
      setIsLive(true);
      setBehindLiveSeconds(0);
    }
  };

  const toggleFullscreen = () => {
    const videoContainer = document.querySelector('.video-container');
    
    if (!document.fullscreenElement) {
      videoContainer.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const toggleZoomMode = () => {
    setZoomMode(!zoomMode);
  };

  const toggleDebugPanel = () => {
    setShowDebugPanel(!showDebugPanel);
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      setCurrentTime(current);

      // Calculate if behind live
      const seekableEnd = videoRef.current.seekable.length > 0 
        ? videoRef.current.seekable.end(videoRef.current.seekable.length - 1) 
        : videoRef.current.duration;
      
      const behindSeconds = Math.max(0, seekableEnd - current);
      setBehindLiveSeconds(Math.floor(behindSeconds));
      setIsLive(behindSeconds < 5);

      // Emit sync data if instructor
      if (isInstructor && socketRef.current) {
        socketRef.current.emit('instructor-sync', {
          classId,
          currentTime: current,
          isPlaying,
          timestamp: Date.now()
        });
      }
    }
  };

  const handleVideoPlay = () => {
    setIsPlaying(true);
  };

  const handleVideoPause = () => {
    setIsPlaying(false);
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
    const dontShowAgain = document.getElementById('dontShowAgain')?.checked;
    if (dontShowAgain) {
      localStorage.setItem('smx-stream-welcome-seen', 'true');
    }
  };

  // Check if welcome modal should be shown
  useEffect(() => {
    const welcomeSeen = localStorage.getItem('smx-stream-welcome-seen');
    if (welcomeSeen) {
      setShowWelcomeModal(false);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'j':
          rewindVideo(10);
          break;
        case 'l':
          if (e.shiftKey) {
            jumpToLive();
          } else {
            rewindVideo(-10);
          }
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'arrowleft':
          rewindVideo(5);
          break;
        case 'arrowright':
          rewindVideo(-5);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  return (
    <div className="smx-stream-layout">
      {/* Navigation Bar */}
      <nav className="stream-navbar">
        <div className="container">
          <div className="navbar-content">
            <a href="/dashboard" className="logo">
              <span>📺</span>
              SMX STREAM
            </a>
            <div className="nav-buttons">
              <button className="btn" onClick={() => navigate('/dashboard')}>
                Dashboard
              </button>
              <button className="btn" onClick={() => navigate('/schedule')}>
                Schedule
              </button>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Refresh Stream
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="player-wrapper">
          {/* Video Container */}
          <div className="video-container">
            <video
              ref={videoRef}
              onTimeUpdate={handleVideoTimeUpdate}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onLoadedMetadata={handleVideoLoadedMetadata}
              playsInline
              muted
            />

            {/* Loading Spinner */}
            {isLoading && (
              <div className="loading-spinner"></div>
            )}

            {/* Stream Status Overlay */}
            <div className={`stream-status-overlay ${isLoading ? '' : 'hidden'}`}>
              {streamStatus}
            </div>

            {/* Video Controls Overlay */}
            <div className="video-controls-overlay">
              <button className="video-control-btn rewind-btn" onClick={() => rewindVideo(30)}>
                ⏪ 30s
              </button>
              <button className="video-control-btn rewind-btn" onClick={() => rewindVideo(60)}>
                ⏪ 1m
              </button>
              <button className="video-control-btn rewind-btn" onClick={() => rewindVideo(300)}>
                ⏪ 5m
              </button>
              <button className="video-control-btn play-pause-btn" onClick={togglePlayPause}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="video-control-btn go-live-btn" onClick={jumpToLive}>
                🔴 LIVE
              </button>
            </div>

            {/* Utility Controls */}
            <div className="video-utility-controls">
              {!isLive && (
                <button className="zoom-toggle-btn live-btn" onClick={jumpToLive}>
                  GO LIVE
                </button>
              )}
              <button 
                className={`zoom-toggle-btn ${zoomMode ? 'active' : ''}`} 
                onClick={toggleZoomMode}
              >
                Zoom
              </button>
              <button className="fullscreen-btn" onClick={toggleFullscreen}>
                ⛶
              </button>
            </div>

            {/* Clock Display */}
            <div className={`clock-display ${!isLive ? 'not-live' : ''}`}>
              {clockTime}
            </div>

            {/* Behind Live Indicator */}
            {behindLiveSeconds > 5 && (
              <div className="behind-live-indicator">
                📡 You are {behindLiveSeconds} seconds behind live
              </div>
            )}

            {/* Debug Toggle */}
            <button className="debug-toggle" onClick={toggleDebugPanel}>
              🐛
            </button>

            {/* Debug Panel */}
            {showDebugPanel && (
              <div className="debug-panel">
                <div className="debug-title">🐛 Stream Debug Info</div>
                <div className="debug-info">
                  <div>Class ID: {classId}</div>
                  <div>Current Time: {formatTime(currentTime)}</div>
                  <div>Duration: {formatTime(duration)}</div>
                  <div>Is Live: {isLive ? 'Yes' : 'No'}</div>
                  <div>Behind Live: {behindLiveSeconds}s</div>
                  <div>Status: {streamStatus}</div>
                  <div>Role: {isInstructor ? 'Instructor' : 'Student'}</div>
                </div>
                <button onClick={toggleDebugPanel} className="debug-close">
                  Hide Debug
                </button>
              </div>
            )}
          </div>

          {/* Timeline Controls */}
          <div className="controls">
            <div className="stream-controls-overlay visible">
              <div className="rewind-controls">
                <button className="rewind-btn" onClick={() => rewindVideo(30)}>
                  ⏪ 30s
                </button>
                <button className="rewind-btn" onClick={() => rewindVideo(60)}>
                  ⏪ 1m
                </button>
                <button className="rewind-btn" onClick={() => rewindVideo(300)}>
                  ⏪ 5m
                </button>
                <button className={`live-btn ${isLive ? 'active' : ''}`} onClick={jumpToLive}>
                  🔴 LIVE
                </button>
              </div>
              <div className="timeline-info">
                <span>{formatTime(currentTime)} / {isLive ? 'LIVE' : formatTime(duration)}</span>
                <span className="buffer-info">Buffer: Ready</span>
              </div>
            </div>

            {/* Timeline */}
            <div id="timeline">
              <div className="timeline-viewport">
                <canvas 
                  ref={canvasRef}
                  id="timelineCanvas"
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    zIndex: 5, 
                    cursor: 'pointer' 
                  }}
                />
                <div id="scrubber" style={{ left: `${(currentTime / duration) * 100}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div className="welcome-modal show">
          <div className="welcome-content">
            <h2 className="welcome-title">WELCOME TO SMX STREAM</h2>
            <div className="welcome-text">
              <p>SMX Stream is your live training platform for Security Mission Exercises. Watch live training sessions, access recorded content, and interact with instructors in real-time.</p>
              <br />
              <p><strong>Keyboard Shortcuts:</strong></p>
              <ul style={{ textAlign: 'left', margin: '10px 0', paddingLeft: '20px' }}>
                <li><strong>Space/K</strong> - Play/Pause</li>
                <li><strong>J/L</strong> - Skip backward/forward 10s</li>
                <li><strong>Shift+L</strong> - Jump to LIVE</li>
                <li><strong>F</strong> - Fullscreen</li>
                <li><strong>Arrow Keys</strong> - Skip 5s</li>
              </ul>
              <p><strong>Timeline:</strong> Click any time marker to jump to that position</p>
            </div>
            <div className="welcome-actions">
              <div className="welcome-checkbox">
                <input type="checkbox" id="dontShowAgain" />
                <label htmlFor="dontShowAgain">Don't show this again</label>
              </div>
              <button className="welcome-close" onClick={closeWelcomeModal}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMXStreamNew;