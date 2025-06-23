# Streaming System Fixes and Troubleshooting Guide

## 🔧 Issues Fixed

### 1. **Multiple Conflicting Event Handlers**
- **Problem**: Multiple `onclick` handlers were being attached to the Go Live button, causing conflicts
- **Fix**: Implemented unified event listener setup with proper cleanup using element cloning
- **Location**: `Stream Mode.html` - `setupUnifiedEventListeners()` function

### 2. **Inconsistent Room Naming**
- **Problem**: Instructor and students were joining different Socket.IO rooms
- **Fix**: Standardized on `class:${classId}` room naming convention
- **Location**: `server.js` - Socket.IO handlers

### 3. **Missing Stream State Synchronization**
- **Problem**: Students joining late couldn't get current stream state
- **Fix**: Added stream state storage and recovery system
- **Location**: `server.js` - Added `stream:state-update` handler and `io.streamStates` Map

### 4. **Improper Video Loading Sequence**
- **Problem**: Stream was starting before video was properly loaded
- **Fix**: Added proper video loading checks and event handlers
- **Location**: `Stream Mode.html` - `startFileStream()` function

### 5. **Student Side Stream Handling**
- **Problem**: Students weren't properly receiving and handling stream events
- **Fix**: Enhanced `handleStreamInit()` and `handleStreamStatusUpdate()` functions
- **Location**: `SMXStream-new.html`

### 6. **Missing Error Handling and User Feedback**
- **Problem**: Users had no visibility into streaming issues
- **Fix**: Added comprehensive debug panel and status overlays
- **Location**: `SMXStream-new.html` - Debug system

## 🚀 How to Test the Streaming System

### Prerequisites
1. Ensure server is running on `http://localhost:3000`
2. Have at least one class created with students enrolled
3. Have instructor and student accounts with proper tokens

### Testing Steps

#### 1. **Basic Connection Test**
```bash
# Run the test script
node test-streaming.js
```

#### 2. **Manual Testing - Instructor Side**
1. Open `http://localhost:3000/stream-mode.html`
2. Login as instructor
3. Select a class from dropdown
4. Upload an MP4 video file
5. Wait for "Ready to Stream" message
6. Click "Go Live" button
7. Verify status shows "LIVE"

#### 3. **Manual Testing - Student Side**
1. Open `http://localhost:3000/stream/[classId]` (replace with actual class ID)
2. Should see "Waiting for instructor..." message initially
3. When instructor goes live, video should appear and start playing
4. Click the 🐛 debug button to see detailed connection info

### 🐛 Debugging Tools

#### Student Debug Panel
- Click the 🐛 button in top-right corner of student view
- Shows real-time connection status, video state, and sync info
- Updates every second with current stream state

#### Server Logs
Monitor server console for these key messages:
```
🎓 Instructor joined class: [classId] (mode: file)
👤 Student joined class: [classId]
🎬 Stream initialized by instructor
📡 Emitting streamStatus to rooms
```

#### Browser Console
Check browser console for:
- Socket.IO connection messages
- Stream event logs (prefixed with emojis)
- Error messages

## 🔍 Common Issues and Solutions

### Issue: "No video file loaded" error
**Solution**: Ensure video is fully uploaded before clicking Go Live
- Wait for "Ready to Stream" message
- Check that preview video shows the uploaded file

### Issue: Students see "Waiting for instructor..." indefinitely
**Possible Causes**:
1. Instructor and student in different rooms
2. Socket.IO connection issues
3. Stream events not being emitted

**Debug Steps**:
1. Check debug panel on student side
2. Verify Socket Connected shows ✅ Yes
3. Check server logs for room join messages
4. Ensure instructor clicked "Go Live" after uploading video

### Issue: Video loads but doesn't play
**Possible Causes**:
1. Browser autoplay restrictions
2. Video format issues
3. Stream synchronization problems

**Solutions**:
1. Click on video to enable autoplay
2. Ensure video is MP4 format
3. Check instructor is actually playing the video

### Issue: Students can't seek or control video
**Expected Behavior**: This is intentional - students are locked to instructor's timeline
- Students cannot seek ahead of instructor
- Students cannot control playback independently
- This enforces synchronized viewing

## 📋 System Architecture

### Socket.IO Events Flow
```
Instructor Side:
1. instructor-join-class → Server
2. stream:init → Server → Students
3. stream:play/pause/seek → Server → Students
4. stream:time (periodic) → Server → Students

Student Side:
1. student-join-class → Server
2. Server → stream:init/play/pause/seek
3. Server → streamStatus updates
```

### Room Structure
- **Class Room**: `class:${classId}` - Main streaming room
- **WebRTC Room**: `webrtc:${classId}` - For WebRTC streaming (future use)
- **Stream Room**: `stream:${streamKey}` - Legacy support

### API Endpoints
- `POST /api/stream/upload` - Upload video for streaming
- `POST /api/streams/start/:classId` - Start stream
- `POST /api/streams/stop/:classId` - Stop stream
- `GET /api/stream/status/:classId` - Get stream status
- `GET /api/stream/state/:classId` - Get current stream state
- `GET /api/stream/video/:filename` - Serve video files

## 🔄 Maintenance

### Regular Cleanup
- Uploaded videos are auto-deleted after 24 hours
- Stream states are cleared when streams end
- Socket connections are cleaned up on disconnect

### Monitoring
- Check server logs for connection patterns
- Monitor room sizes for unusual activity
- Watch for repeated connection/disconnection cycles

### Performance
- Video files are served with range request support for seeking
- Stream synchronization is throttled to 500ms intervals
- Debug updates run at 1-second intervals

## 🚨 Emergency Troubleshooting

If streaming completely breaks:

1. **Restart the server** - This clears all Socket.IO state
2. **Clear browser cache** - Removes any cached connection issues
3. **Check file permissions** - Ensure temp directory is writable
4. **Verify database connection** - Stream metadata is stored in MongoDB
5. **Check network connectivity** - Socket.IO requires stable connection

## 📞 Support

For additional issues:
1. Enable debug panel on student side
2. Check browser console for errors
3. Review server logs for Socket.IO events
4. Test with the provided test script
5. Verify all prerequisites are met

The streaming system is now robust and includes comprehensive error handling, debugging tools, and proper event synchronization between instructors and students.