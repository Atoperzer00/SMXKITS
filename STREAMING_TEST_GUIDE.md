# 🎥 Streaming Test Guide: Stream Mode → SMXStream-new

## ✅ **Streaming Flow Verification**

### **1. Prerequisites**
- Backend server running with Socket.IO
- MongoDB connected
- User authenticated with valid JWT token
- At least one class created in the system

### **2. Complete Test Flow**

#### **Step 1: Instructor Setup (Stream Mode.html)**
```
1. Open: http://localhost:3000/public/Stream%20Mode.html
2. Login with instructor credentials
3. Select a class from dropdown
4. Drag/drop MP4 file → Video loads in player
5. Click "Upload to Server" → File uploads to backend
6. Click "Go Live" → Stream starts
```

#### **Step 2: Student Viewing (SMXStream-new.html)**
```
1. Open: http://localhost:3000/SMXStream-new.html?classId=YOUR_CLASS_ID
2. Page automatically connects to stream
3. Video should start playing when instructor goes live
4. Real-time updates when instructor pauses/stops
```

### **3. Backend API Endpoints Used**

#### **Upload Flow:**
```
POST /api/stream/upload
- Uploads MP4 to /temp directory
- Returns streamUrl for video playback
- Updates class.streamStatus = 'live'
```

#### **Stream Control:**
```
POST /api/streams/start/:classId
POST /api/streams/pause/:classId  
POST /api/streams/stop/:classId
```

#### **Student Connection:**
```
GET /api/stream/status/:classId
- Returns stream status and streamKey
- Used by SMXStream-new.html to connect
```

### **4. Socket.IO Events**

#### **Instructor → Students:**
```javascript
// When instructor goes live
io.to(`stream:${streamKey}`).emit('streamStatus', {
  status: 'live',
  source: 'upload',
  streamUrl: '/api/stream/video/filename.mp4'
});

// When instructor pauses
io.to(`stream:${streamKey}`).emit('streamStatus', {
  status: 'paused'
});

// When instructor stops
io.to(`stream:${streamKey}`).emit('streamStatus', {
  status: 'offline'
});
```

### **5. Video Playback Types**

#### **Uploaded Videos (Current Implementation):**
- **Format:** Direct MP4 playback
- **URL:** `/api/stream/video/filename.mp4`
- **Player:** Native HTML5 video element
- **Features:** Seek, pause, volume control

#### **Live Streams (Future/Alternative):**
- **Format:** HLS (HTTP Live Streaming)
- **URL:** `http://127.0.0.1:8888/live/${streamKey}/index.m3u8`
- **Player:** HLS.js library
- **Features:** Low-latency live streaming

### **6. Debugging Steps**

#### **Check Console Logs:**
```javascript
// Stream Mode.html
🎥 LIVE stream for class: 64f... with data: {...}
✅ Stream start successful: {...}

// SMXStream-new.html  
Stream status update: {status: 'live', source: 'upload', ...}
Loading uploaded video: /api/stream/video/stream-123.mp4
```

#### **Verify Backend:**
```bash
# Check if file uploaded
ls temp/
# Should show: stream-[timestamp]-[random].mp4

# Check database
# Class.streamStatus should be 'live'
# StreamSession should be created
```

#### **Network Tab:**
```
✅ POST /api/stream/upload → 200 OK
✅ POST /api/streams/start/classId → 200 OK  
✅ GET /api/stream/status/classId → 200 OK
✅ GET /api/stream/video/filename.mp4 → 206 Partial Content
```

### **7. Common Issues & Solutions**

#### **Issue: "Please select a class first"**
- **Solution:** Make sure class dropdown has options and one is selected

#### **Issue: "Please upload your video to the server first"**
- **Solution:** Click "Upload to Server" button before going live

#### **Issue: Student sees loading spinner**
- **Check:** Stream status in database
- **Check:** Socket.IO connection in browser dev tools
- **Check:** Video file exists in /temp directory

#### **Issue: Video won't play on student side**
- **Check:** CORS settings for video serving
- **Check:** File permissions in /temp directory
- **Try:** Different browser (autoplay policies)

### **8. Success Indicators**

#### **Instructor Side:**
- ✅ Status badge shows "LIVE" 
- ✅ Video plays in preview player
- ✅ Console shows successful API calls
- ✅ Pause/Stop buttons are enabled

#### **Student Side:**
- ✅ Video loads and plays automatically
- ✅ Loading spinner disappears
- ✅ Video controls work (seek, pause, volume)
- ✅ Real-time updates when instructor changes status

### **9. File Cleanup**
- Uploaded files auto-delete after 24 hours
- Cleanup runs every hour via setInterval
- Manual cleanup: Delete files in /temp directory

---

## 🎯 **Expected Result**
When instructor uploads video and goes live, students should see the video playing in real-time with full controls and synchronization!