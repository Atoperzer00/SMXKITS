# SMXKITS Streaming System

This document explains how to set up and use the SMXKITS live streaming system based on OBS → RTMP → HLS.

## Architecture

```
OBS Studio → RTMP (NGINX) → HLS → Students
     ↓
WebSocket API ← Node.js Server → Socket.IO → Real-time Updates
```

## Quick Start

### 1. Start Streaming Infrastructure

**Linux/Mac:**
```bash
./start-streaming.sh
```

**Windows:**
```cmd
start-streaming.bat
```

**Manual:**
```bash
npm run start:streaming
```

### 2. Configure OBS Studio

1. **Install OBS WebSocket Plugin:**
   - Download from: https://github.com/obsproject/obs-websocket/releases
   - Install and restart OBS

2. **Configure WebSocket:**
   - Tools → WebSocket Server Settings
   - Enable Server: ✅
   - Server Port: `4455`
   - Server Password: (leave empty)

3. **Configure RTMP Output:**
   - Settings → Output → Streaming
   - Service: Custom
   - Server: `rtmp://localhost:1935/live`
   - Stream Key: Will be set automatically by the system

### 3. Start Streaming

1. **Instructor Interface:**
   - Open: http://localhost:3000/Stream%20Mode.html
   - Select class from dropdown
   - Click "Connect to OBS Studio"
   - Click "Start Class Stream"

2. **Student Interface:**
   - Open: http://localhost:3000/SMXStream-new.html?classId=YOUR_CLASS_ID
   - Stream will start automatically when instructor begins

## Features

### For Instructors (Stream Mode.html)
- ✅ Class selection dropdown
- ✅ OBS WebSocket integration
- ✅ Automatic RTMP configuration
- ✅ Real-time connection status
- ✅ Stream start/stop controls
- ✅ Viewer count display
- ✅ Connection log

### For Students (SMXStream-new.html)
- ✅ HLS live streaming
- ✅ 5-minute rewind buffer
- ✅ Pause and seek controls
- ✅ Real-time timeline
- ✅ Live edge indicator
- ✅ Automatic stream detection

## API Endpoints

### Stream Control
- `POST /api/stream/start` - Start streaming for a class
- `POST /api/stream/stop` - Stop streaming for a class
- `GET /api/stream/status/:classId` - Get stream status
- `GET /api/stream/active` - List active streams
- `GET /api/stream/viewers/:classId` - Get viewer count

### Socket.IO Events
- `stream:started` - Stream began
- `stream:ended` - Stream ended
- `viewer:count` - Viewer count update
- `instructor-join-class` - Instructor joins
- `student-join-class` - Student joins

## URLs

- **Instructor Interface:** http://localhost:3000/Stream%20Mode.html
- **Student Interface:** http://localhost:3000/SMXStream-new.html?classId=CLASS_ID
- **HLS Streams:** http://localhost:8888/hls/CLASS_ID.m3u8
- **RTMP Endpoint:** rtmp://localhost:1935/live/CLASS_ID
- **Stream Statistics:** http://localhost:8888/stat

## Troubleshooting

### OBS Connection Issues
1. Ensure OBS WebSocket plugin is installed
2. Check WebSocket server is enabled on port 4455
3. Verify no firewall blocking connections
4. Restart OBS if needed

### Stream Not Appearing
1. Check NGINX RTMP server is running: `docker ps`
2. Verify HLS files are being created: `ls data/hls/`
3. Check browser console for errors
4. Ensure class ID matches between instructor and student

### Performance Issues
1. Adjust OBS encoding settings (lower bitrate/resolution)
2. Check network bandwidth
3. Monitor server resources: `docker stats`

## Commands

```bash
# Start streaming infrastructure
npm run start:streaming

# Stop streaming infrastructure
npm run stop:streaming

# View logs
npm run logs:streaming

# Check service status
docker-compose -f docker-compose.streaming.yml ps

# Restart specific service
docker-compose -f docker-compose.streaming.yml restart nginx-rtmp
```

## Security Notes

- Stream keys are based on class IDs
- WebSocket connections should be secured in production
- Consider adding authentication for RTMP publishing
- Use HTTPS/WSS in production environments

## File Structure

```
├── Stream Mode.html          # Instructor streaming interface
├── SMXStream-new.html        # Student viewing interface
├── server/
│   ├── routes/stream.js      # Stream API endpoints
│   └── socket/streamHandler.js # Socket.IO handlers
├── nginx/
│   └── nginx.conf           # NGINX RTMP configuration
├── data/
│   ├── hls/                 # HLS stream files
│   ├── recordings/          # Stream recordings
│   └── redis/               # Redis data
└── docker-compose.streaming.yml # Docker services
```
