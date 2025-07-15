# WebRTC Live Streaming Test Guide

## 🚀 Server Status
✅ Server is running on http://localhost:5000
✅ Socket.IO is properly configured
✅ WebRTC signaling handlers are implemented
✅ Both pages load successfully (HTTP 200)

## 🧪 Manual Testing Steps

### 1. **Instructor Setup**
1. Open: `http://localhost:5000/Stream Mode.html`
2. Login with credentials: `instructor` / `instructor123`
3. Select a class from the dropdown
4. Click the **"🔴 Live Camera/Screen"** tab
5. Click **"📹 Start Camera"** or **"🖥️ Share Screen"**
6. Grant camera/microphone permissions when prompted
7. Verify video preview appears
8. Click **"Go Live"** to start WebRTC streaming

### 2. **Student Setup**
1. Open: `http://localhost:5000/SMXStream-new.html?classId=YOUR_CLASS_ID`
2. Login with credentials: `student` / `student123`
3. The page should automatically detect WebRTC stream
4. Stream type indicator should show "Live WebRTC Stream"
5. Video should appear when instructor starts streaming

### 3. **Expected Behavior**
- **Instructor side**: Status should change to "LIVE"
- **Student side**: Should automatically switch to WebRTC mode
- **Console logs**: Should show WebRTC connection establishment
- **Real-time**: Video should stream with minimal delay

## 🔍 Debugging Checklist

### Browser Console (F12)
Look for these messages:

**Instructor Console:**
```
🔄 Switched to live streaming mode
🔌 WebRTC Socket connected
📹 Starting camera...
✅ Camera started successfully
🔴 Starting WebRTC live stream...
🔗 Creating peer connection for student: [ID]
📤 Sent offer to student: [ID]
```

**Student Console:**
```
🔌 WebRTC Socket connected
🔴 Instructor started WebRTC stream: Camera
🔄 Switching to WebRTC mode
📡 Received WebRTC offer from instructor
🔗 Creating WebRTC peer connection...
📺 Received WebRTC stream
📤 Sent WebRTC answer to instructor
```

### Common Issues & Solutions

1. **Camera Permission Denied**
   - Grant camera/microphone permissions in browser
   - Try refreshing the page after granting permissions

2. **WebRTC Connection Failed**
   - Check if both pages are on the same domain
   - Verify STUN servers are accessible
   - Check browser compatibility (Chrome/Firefox recommended)

3. **Student Not Receiving Stream**
   - Verify class ID matches between instructor and student
   - Check if Socket.IO connection is established
   - Ensure instructor started streaming before student joined

4. **No Video Preview**
   - Check camera permissions
   - Try different browser
   - Verify camera is not being used by another application

## 🌐 Browser Compatibility
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 14+
- ✅ Edge 80+

## 📊 Performance Notes
- WebRTC uses peer-to-peer connections (low server load)
- Video quality adapts to network conditions
- Multiple students can connect simultaneously
- Screen sharing supports up to 1920x1080 resolution

## 🔧 Advanced Testing

### Test Multiple Students
1. Open multiple tabs with different student URLs
2. Each should receive the same stream
3. Check server logs for multiple peer connections

### Test Connection Recovery
1. Temporarily disconnect internet
2. Reconnect - should automatically resume
3. Check for reconnection messages in console

### Test Different Media Types
1. Test camera streaming
2. Test screen sharing
3. Test switching between media types
4. Verify audio is transmitted

## 📝 Test Results Template

**Date:** ___________
**Browser:** ___________
**OS:** ___________

- [ ] Instructor page loads
- [ ] Student page loads
- [ ] Camera access granted
- [ ] Video preview works
- [ ] WebRTC streaming starts
- [ ] Student receives stream
- [ ] Audio is transmitted
- [ ] Connection is stable
- [ ] Multiple students work
- [ ] Screen sharing works

**Issues Found:**
_________________________
_________________________

**Notes:**
_________________________
_________________________