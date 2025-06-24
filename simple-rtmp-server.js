#!/usr/bin/env node

/**
 * Simple RTMP Server for Local Testing
 * This creates a basic RTMP server that OBS can stream to
 */

const NodeMediaServer = require('node-media-server');
const path = require('path');
const fs = require('fs');

// Create HLS output directory
const hlsPath = path.join(__dirname, 'public', 'hls');
if (!fs.existsSync(hlsPath)) {
  fs.mkdirSync(hlsPath, { recursive: true });
}

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8888,
    mediaroot: './public',
    allow_origin: '*'
  },
  relay: {
    ffmpeg: 'C:/ffmpeg/bin/ffmpeg.exe', // Update this path if needed
    tasks: [
      {
        app: 'live',
        mode: 'push',
        edge: 'rtmp://127.0.0.1/hls'
      }
    ]
  }
};

// Try to find ffmpeg
const possibleFFmpegPaths = [
  'C:/ffmpeg/bin/ffmpeg.exe',
  'C:/Program Files/ffmpeg/bin/ffmpeg.exe',
  'ffmpeg' // If in PATH
];

let ffmpegPath = null;
for (const path of possibleFFmpegPaths) {
  try {
    require('child_process').execSync(`"${path}" -version`, { stdio: 'ignore' });
    ffmpegPath = path;
    break;
  } catch (e) {
    // Continue to next path
  }
}

if (ffmpegPath) {
  console.log('✅ Found FFmpeg at:', ffmpegPath);
  config.relay.ffmpeg = ffmpegPath;
} else {
  console.log('⚠️  FFmpeg not found. HLS conversion may not work.');
  console.log('   Download from: https://ffmpeg.org/download.html');
}

const nms = new NodeMediaServer(config);

nms.on('preConnect', (id, args) => {
  console.log('🔌 Client connecting:', id, args);
});

nms.on('postConnect', (id, args) => {
  console.log('✅ Client connected:', id);
});

nms.on('doneConnect', (id, args) => {
  console.log('👋 Client disconnected:', id);
});

nms.on('prePublish', (id, StreamPath, args) => {
  console.log('🎬 Stream starting:', StreamPath);
  
  // Extract stream key from path (e.g., /live/test-stream)
  const streamKey = StreamPath.split('/').pop();
  console.log('🔑 Stream Key:', streamKey);
  
  // You can add authentication here if needed
  // For now, allow all streams
});

nms.on('postPublish', (id, StreamPath, args) => {
  console.log('📺 Stream published:', StreamPath);
});

nms.on('donePublish', (id, StreamPath, args) => {
  console.log('⏹️  Stream ended:', StreamPath);
});

console.log('🚀 Starting Simple RTMP Server...');
console.log('📡 RTMP Server: rtmp://localhost:1935/live');
console.log('🌐 HTTP Server: http://localhost:8888');
console.log('');
console.log('📋 OBS Configuration:');
console.log('   Service: Custom');
console.log('   Server: rtmp://localhost/live');
console.log('   Stream Key: test-stream (or any key you want)');
console.log('');
console.log('📺 View Stream: http://localhost:3000/SMXStream-new.html?classId=test-stream');

nms.run();