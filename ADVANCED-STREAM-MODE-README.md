# Advanced Stream Mode - Complete OBS v31+ Integration

## 🎯 Overview
The Advanced Stream Mode provides a comprehensive browser-based streaming control panel that interfaces directly with OBS Studio v31+ via WebSocket 5+ protocol. It enables complete streaming automation without manually touching OBS, supporting multiple streaming sources and advanced features.

## ✨ Features

### 🎬 Multiple Streaming Sources
- **📷 Webcam Mode**: Live webcam streaming using Video Capture Device
- **🖥️ Desktop Mode**: Screen mirroring using Display Capture  
- **🎬 Video Upload Mode**: Upload and stream video files with HLS transcoding
- **📺 Picture-in-Picture**: Webcam overlay on desktop capture

### 🔄 Live Source Switching
- Switch between streaming sources during live streams
- Real-time scene transitions in OBS
- No interruption to the stream

### 📊 Stream Analytics & Monitoring
- **Live Viewer Count**: Real-time viewer statistics
- **Peak/Average Viewers**: Session analytics
- **Stream Quality**: Bitrate and dropped frame monitoring
- **Stream Duration**: Live timer and session tracking

### 🎛️ Advanced OBS Integration
- **Auto-Scene Creation**: Automatically creates required OBS scenes
- **Source Management**: Adds and configures video sources automatically
- **Stream Configuration**: RTMP settings configured via WebSocket
- **Real-time Status**: Live connection and stream state monitoring

### 🌐 DigitalOcean Integration
- **Video Upload**: Direct upload to DigitalOcean server
- **HLS Transcoding**: Automatic conversion to streaming format
- **RTMP Streaming**: Direct streaming to DigitalOcean RTMP server
- **CDN Delivery**: HLS feeds served via CDN

## 🚀 Quick Start Guide

### 1. Prerequisites
- **OBS Studio v31+** (WebSocket 5+ built-in)
- **Node.js Server** running with required dependencies
- **DigitalOcean Server** with RTMP/HLS configured

### 2. OBS Setup
1. Open OBS Studio v31 or later
2. Go to **Tools → WebSocket Server Settings**
3. Enable **WebSocket server**
4. Set port to **4455** (default)
5. Optionally set authentication password

### 3. Using Stream Mode
1. **Select a Class** from the dropdown
2. **Connect to OBS** - Click "Connect to OBS Studio"
3. **Choose Stream Source**:
   - 📷 **Webcam** for live camera
   - 🖥️ **Desktop** for screen sharing
   - 🎬 **Video File** for uploaded content
   - 📺 **Picture-in-Picture** for combined view
4. **Start Streaming** - Click "Start Live Stream"
5. **Monitor Analytics** - View real-time statistics
6. **Switch Sources** - Change sources during live stream
7. **Stop Stream** when finished

## 🎛️ Interface Components

### Left Panel - Stream Controls
- **Connection Status**: OBS WebSocket connection indicator
- **Stream Mode Selector**: Choose between 4 streaming modes
- **Video Upload**: Drag & drop or select video files
- **Live Controls**: Start/Stop streaming buttons
- **Source Switching**: Real-time source change buttons

### Center - Video Preview
- **OBS Status Display**: Shows connection state when offline
- **HLS Preview Player**: Live stream preview when streaming
- **Stream Ready Indicator**: Visual confirmation of live status

### Right Panel - Configuration & Analytics
- **OBS Configuration**: WebSocket and RTMP settings
- **Stream Information**: Class, status, viewer count, duration
- **Live Analytics**: Peak viewers, bitrate, quality indicators
- **Connection Log**: Real-time event logging

## 🔧 Technical Implementation

### OBS WebSocket 5+ Protocol
```javascript
// Connection with modern protocol
obs = new OBSWebSocket();
await obs.connect('localhost:4455', undefined, {
  rpcVersion: 1
});

// Scene switching
await obs.call('SetCurrentProgramScene', { sceneName });

// Stream control
await obs.call('StartStream');
await obs.call('StopStream');
```

### Auto-Scene Management
The system automatically creates and manages OBS scenes:

- **SMX_Webcam_Scene**: Video Capture Device source
- **SMX_Desktop_Scene**: Display Capture source  
- **SMX_Media_Scene**: Media Source for uploaded videos
- **SMX_PIP_Scene**: Combined webcam + desktop with positioning

### Video Upload & Processing
```javascript
// Upload to DigitalOcean
const formData = new FormData();
formData.append('video', file);
formData.append('classId', currentClassId);

// Automatic HLS transcoding
// Creates .m3u8 playlist and .ts segments
// Enables rewind/pause functionality
```

### Real-time Analytics
```javascript
// Stream statistics monitoring
const stats = await obs.call('GetStreamStatus');
streamAnalytics.bitrate = stats.outputBytes * 8 / 1024;
streamAnalytics.droppedFrames = stats.outputSkippedFrames;

// Quality assessment
const droppedFrameRate = stats.outputSkippedFrames / stats.outputTotalFrames;
// Updates quality indicator (Excellent/Good/Poor)
```

## 🌐 Backend Integration

### New API Endpoints

#### Video Upload
```
POST /api/stream/upload-video
- Uploads video files to DigitalOcean
- Triggers HLS transcoding
- Returns streaming URLs
```

#### Enhanced Stream Control
```
POST /api/stream/start
- Supports streamMode parameter
- Records streaming source type
- Enables analytics tracking

POST /api/stream/stop  
- Stops streaming and analytics
- Saves session data
- Notifies connected clients
```

### Socket.IO Events
```javascript
// Stream status updates
socket.emit('stream:start', {
  classId, streamKey, status: 'live', streamMode
});

// Viewer count updates
socket.on('viewerCount', (data) => {
  updateAnalytics(data.count);
});
```

## 📊 Analytics & Monitoring

### Real-time Metrics
- **Current Viewers**: Live count from Socket.IO
- **Peak Viewers**: Highest concurrent viewers in session
- **Average Viewers**: Mean viewers over session duration
- **Stream Bitrate**: Current upload bitrate in kbps
- **Dropped Frames**: Frame loss indicator for quality
- **Stream Duration**: Live session timer

### Quality Indicators
- **🟢 Excellent**: <1% dropped frames
- **🟡 Good**: 1-5% dropped frames  
- **🔴 Poor**: >5% dropped frames

### Session Recording
All streaming sessions are logged with:
- Start/end timestamps
- Stream source type
- Viewer statistics
- Quality metrics
- Class and instructor information

## 🔒 Security & Permissions

### Authentication
- JWT token-based authentication
- Role-based access control (admin/instructor)
- Class-specific permissions

### OBS Security
- Local WebSocket connections (localhost:4455)
- Optional password authentication
- Secure scene and source management

## 🚀 Deployment

### Development Setup
```bash
# Install dependencies
npm install obs-websocket-js@5

# Start server
npm start

# Access Stream Mode
http://localhost:3000/Stream%20Mode.html
```

### Production Deployment
1. **DigitalOcean Server**: RTMP/HLS streaming server
2. **CDN Configuration**: HLS delivery optimization
3. **SSL Certificates**: Secure WebSocket connections
4. **Load Balancing**: Multiple server instances

## 🔧 Troubleshooting

### Common Issues

#### OBS Connection Failed
- Ensure OBS Studio v31+ is running
- Check WebSocket server is enabled (Tools → WebSocket Server Settings)
- Verify port 4455 is not blocked
- Try disabling authentication temporarily

#### Video Upload Failed
- Check file size limits (500MB max)
- Verify supported video formats (MP4, AVI, MOV, etc.)
- Ensure sufficient disk space on server
- Check network connectivity

#### Stream Quality Issues
- Monitor dropped frame percentage
- Check network bandwidth
- Verify RTMP server capacity
- Adjust OBS encoding settings

#### Scene Creation Failed
- Ensure OBS has proper permissions
- Check video device availability (/dev/video0)
- Verify display capture permissions
- Try manual scene creation first

### Debug Steps
1. **Open Browser Console**: Check for JavaScript errors
2. **Check Connection Log**: Review real-time event messages
3. **Test OBS Connection**: Use "Test Connection" button
4. **Verify Stream Key**: Ensure proper class selection
5. **Monitor Network**: Check RTMP server connectivity

## 🔮 Future Enhancements

### Planned Features
- **Multi-Camera Support**: Switch between multiple webcams
- **Audio Mixing**: Advanced audio source management
- **Recording Control**: Automatic session recording
- **Stream Scheduling**: Automated streaming at set times
- **Advanced Transitions**: Custom scene transition effects
- **Mobile Support**: Responsive design for tablets/phones

### Integration Possibilities
- **YouTube Live**: Direct streaming to YouTube
- **Twitch Integration**: Multi-platform streaming
- **Zoom Integration**: Hybrid classroom streaming
- **LMS Integration**: Direct embedding in learning platforms

## 📝 API Reference

### Stream Control
```javascript
// Start streaming with specific mode
await fetch('/api/stream/start', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    classId, streamKey, rtmpUrl, streamMode
  })
});

// Upload video for streaming
const formData = new FormData();
formData.append('video', file);
formData.append('classId', classId);

await fetch('/api/stream/upload-video', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});
```

### OBS WebSocket Commands
```javascript
// Scene management
await obs.call('CreateScene', { sceneName });
await obs.call('SetCurrentProgramScene', { sceneName });

// Source management  
await obs.call('CreateInput', {
  sceneName, inputName, inputKind, inputSettings
});

// Stream control
await obs.call('StartStream');
await obs.call('StopStream');
await obs.call('GetStreamStatus');
```

## 📄 Files Modified/Created

### Core Files
- `public/Stream Mode.html` - Main streaming interface (enhanced)
- `routes/streams.js` - Backend API routes (updated)
- `package.json` - Added obs-websocket-js@5 dependency

### Documentation
- `ADVANCED-STREAM-MODE-README.md` - This comprehensive guide
- `OBS-V31-UPGRADE-SUMMARY.md` - Technical upgrade details
- `test-obs-v31.html` - Standalone OBS connection test

## 🎯 Success Metrics

The Advanced Stream Mode delivers:
- **🔌 Seamless OBS Integration**: Zero manual OBS configuration
- **📹 Multiple Source Support**: 4 different streaming modes
- **🔄 Live Source Switching**: Real-time transitions during streams
- **📊 Comprehensive Analytics**: Detailed streaming metrics
- **🌐 Cloud Integration**: DigitalOcean upload and HLS delivery
- **📱 Modern UI/UX**: Intuitive, responsive interface
- **🔒 Enterprise Security**: Role-based access and authentication

This implementation provides a complete, production-ready streaming solution that rivals commercial streaming platforms while being fully integrated with the SMX KITS educational platform.