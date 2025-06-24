#!/usr/bin/env node

/**
 * SMXKITS Streaming Setup Script
 * 
 * This script helps set up the complete streaming infrastructure:
 * - OBS Studio configuration
 * - NGINX RTMP server
 * - HLS delivery
 * - Socket.IO integration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎬 SMXKITS Streaming Setup');
console.log('==========================\n');

// Check if required directories exist
const requiredDirs = [
  'data/hls',
  'data/recordings',
  'data/redis',
  'server/routes',
  'server/socket'
];

console.log('📁 Creating required directories...');
requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Created: ${dir}`);
  } else {
    console.log(`✓ Exists: ${dir}`);
  }
});

// Create OBS configuration template
const obsConfig = {
  "obs-websocket": {
    "ServerEnabled": true,
    "ServerPort": 4455,
    "ServerPassword": "",
    "AlertsEnabled": true,
    "AuthRequired": false
  },
  "output": {
    "Mode": "Advanced",
    "streaming": {
      "server": "rtmp://localhost:1935/live",
      "key": "class_{{CLASS_ID}}"
    }
  }
};

console.log('\n⚙️ Creating OBS configuration template...');
fs.writeFileSync('obs-config-template.json', JSON.stringify(obsConfig, null, 2));
console.log('✅ Created: obs-config-template.json');

// Create environment configuration
const envConfig = `# SMXKITS Streaming Configuration
NODE_ENV=development
PORT=3000

# Streaming URLs
HLS_BASE_URL=http://localhost:8888/hls
RTMP_BASE_URL=rtmp://localhost:1935/live

# OBS WebSocket
OBS_WEBSOCKET_URL=ws://localhost:4455

# Redis (for session management)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret-here
STREAM_SECRET=your-stream-secret-here
`;

console.log('\n🔧 Creating environment configuration...');
if (!fs.existsSync('.env.streaming')) {
  fs.writeFileSync('.env.streaming', envConfig);
  console.log('✅ Created: .env.streaming');
} else {
  console.log('✓ Exists: .env.streaming');
}

// Create package.json scripts for streaming
const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  // Add streaming-related scripts
  packageJson.scripts['start:streaming'] = 'docker-compose -f docker-compose.streaming.yml up -d';
  packageJson.scripts['stop:streaming'] = 'docker-compose -f docker-compose.streaming.yml down';
  packageJson.scripts['logs:streaming'] = 'docker-compose -f docker-compose.streaming.yml logs -f';
  packageJson.scripts['setup:streaming'] = 'node setup-streaming.js';
  
  // Add required dependencies
  if (!packageJson.dependencies) {
    packageJson.dependencies = {};
  }
  
  const streamingDeps = {
    'ws': '^8.14.2',
    'redis': '^4.6.10',
    'express': '^4.18.2',
    'socket.io': '^4.7.4'
  };
  
  Object.assign(packageJson.dependencies, streamingDeps);
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated: package.json with streaming scripts and dependencies');
}

// Create startup script
const startupScript = `#!/bin/bash

echo "🎬 Starting SMXKITS Streaming Infrastructure"
echo "============================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start streaming services
echo "🚀 Starting streaming services..."
docker-compose -f docker-compose.streaming.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "📊 Service Status:"
docker-compose -f docker-compose.streaming.yml ps

echo ""
echo "✅ Streaming infrastructure is ready!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure OBS Studio:"
echo "   - Install OBS WebSocket plugin"
echo "   - Set WebSocket server to localhost:4455"
echo "   - Configure RTMP output to rtmp://localhost:1935/live"
echo ""
echo "2. Access streaming interface:"
echo "   - Instructor: http://localhost:3000/Stream%20Mode.html"
echo "   - Students: http://localhost:3000/SMXStream-new.html?classId=YOUR_CLASS_ID"
echo ""
echo "3. Monitor streams:"
echo "   - HLS streams: http://localhost:8888/hls/"
echo "   - RTMP stats: http://localhost:8888/stat"
echo ""
echo "🔧 Useful commands:"
echo "   npm run logs:streaming  - View logs"
echo "   npm run stop:streaming  - Stop services"
echo ""
`;

fs.writeFileSync('start-streaming.sh', startupScript);
if (process.platform !== 'win32') {
  try {
    execSync('chmod +x start-streaming.sh');
  } catch (e) {
    // Ignore chmod errors on Windows
  }
}
console.log('✅ Created: start-streaming.sh');

// Create Windows batch file
const windowsScript = `@echo off
echo 🎬 Starting SMXKITS Streaming Infrastructure
echo ============================================

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Start streaming services
echo 🚀 Starting streaming services...
docker-compose -f docker-compose.streaming.yml up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check service status
echo 📊 Service Status:
docker-compose -f docker-compose.streaming.yml ps

echo.
echo ✅ Streaming infrastructure is ready!
echo.
echo 📋 Next Steps:
echo 1. Configure OBS Studio:
echo    - Install OBS WebSocket plugin
echo    - Set WebSocket server to localhost:4455
echo    - Configure RTMP output to rtmp://localhost:1935/live
echo.
echo 2. Access streaming interface:
echo    - Instructor: http://localhost:3000/Stream%%20Mode.html
echo    - Students: http://localhost:3000/SMXStream-new.html?classId=YOUR_CLASS_ID
echo.
echo 3. Monitor streams:
echo    - HLS streams: http://localhost:8888/hls/
echo    - RTMP stats: http://localhost:8888/stat
echo.
echo 🔧 Useful commands:
echo    npm run logs:streaming  - View logs
echo    npm run stop:streaming  - Stop services
echo.
pause
`;

fs.writeFileSync('start-streaming.bat', windowsScript);
console.log('✅ Created: start-streaming.bat');

// Create README for streaming setup
const streamingReadme = `# SMXKITS Streaming System

This document explains how to set up and use the SMXKITS live streaming system based on OBS → RTMP → HLS.

## Architecture

\`\`\`
OBS Studio → RTMP (NGINX) → HLS → Students
     ↓
WebSocket API ← Node.js Server → Socket.IO → Real-time Updates
\`\`\`

## Quick Start

### 1. Start Streaming Infrastructure

**Linux/Mac:**
\`\`\`bash
./start-streaming.sh
\`\`\`

**Windows:**
\`\`\`cmd
start-streaming.bat
\`\`\`

**Manual:**
\`\`\`bash
npm run start:streaming
\`\`\`

### 2. Configure OBS Studio

1. **Install OBS WebSocket Plugin:**
   - Download from: https://github.com/obsproject/obs-websocket/releases
   - Install and restart OBS

2. **Configure WebSocket:**
   - Tools → WebSocket Server Settings
   - Enable Server: ✅
   - Server Port: \`4455\`
   - Server Password: (leave empty)

3. **Configure RTMP Output:**
   - Settings → Output → Streaming
   - Service: Custom
   - Server: \`rtmp://localhost:1935/live\`
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
- \`POST /api/stream/start\` - Start streaming for a class
- \`POST /api/stream/stop\` - Stop streaming for a class
- \`GET /api/stream/status/:classId\` - Get stream status
- \`GET /api/stream/active\` - List active streams
- \`GET /api/stream/viewers/:classId\` - Get viewer count

### Socket.IO Events
- \`stream:started\` - Stream began
- \`stream:ended\` - Stream ended
- \`viewer:count\` - Viewer count update
- \`instructor-join-class\` - Instructor joins
- \`student-join-class\` - Student joins

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
1. Check NGINX RTMP server is running: \`docker ps\`
2. Verify HLS files are being created: \`ls data/hls/\`
3. Check browser console for errors
4. Ensure class ID matches between instructor and student

### Performance Issues
1. Adjust OBS encoding settings (lower bitrate/resolution)
2. Check network bandwidth
3. Monitor server resources: \`docker stats\`

## Commands

\`\`\`bash
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
\`\`\`

## Security Notes

- Stream keys are based on class IDs
- WebSocket connections should be secured in production
- Consider adding authentication for RTMP publishing
- Use HTTPS/WSS in production environments

## File Structure

\`\`\`
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
\`\`\`
`;

fs.writeFileSync('STREAMING-README.md', streamingReadme);
console.log('✅ Created: STREAMING-README.md');

console.log('\n🎉 Setup Complete!');
console.log('==================\n');
console.log('📋 Next Steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Start streaming services: ./start-streaming.sh (or .bat on Windows)');
console.log('3. Configure OBS Studio (see STREAMING-README.md)');
console.log('4. Open Stream Mode.html for instructors');
console.log('5. Open SMXStream-new.html?classId=YOUR_CLASS for students');
console.log('\n📖 Read STREAMING-README.md for detailed instructions');
console.log('\n🚀 Happy Streaming!');