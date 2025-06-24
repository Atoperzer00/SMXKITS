// Socket.IO handlers for HLS streaming system

const streamHandler = (io) => {
  // Track connected users and their roles
  const connectedUsers = new Map();
  const classRooms = new Map(); // Track users in each class room
  
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);
    
    // Store user info
    connectedUsers.set(socket.id, {
      id: socket.id,
      role: null,
      classId: null,
      joinTime: new Date()
    });
    
    // Instructor joins class room
    socket.on('instructor-join-class', (data) => {
      const { classId } = data;
      console.log(`👨‍🏫 Instructor ${socket.id} joining class: ${classId}`);
      
      if (!classId) {
        socket.emit('error', { message: 'Class ID is required' });
        return;
      }
      
      // Leave previous rooms
      socket.rooms.forEach(room => {
        if (room.startsWith('class:')) {
          socket.leave(room);
        }
      });
      
      // Join new class room
      const roomName = `class:${classId}`;
      socket.join(roomName);
      
      // Update user info
      const userInfo = connectedUsers.get(socket.id);
      if (userInfo) {
        userInfo.role = 'instructor';
        userInfo.classId = classId;
      }
      
      // Track room membership
      if (!classRooms.has(classId)) {
        classRooms.set(classId, new Set());
      }
      classRooms.get(classId).add(socket.id);
      
      // Send confirmation
      socket.emit('instructor:joined', { 
        classId: classId,
        room: roomName,
        message: 'Successfully joined as instructor'
      });
      
      console.log(`✅ Instructor ${socket.id} joined class ${classId}`);
    });
    
    // Student joins class room
    socket.on('student-join-class', (data) => {
      const { classId } = data;
      console.log(`🎓 Student ${socket.id} joining class: ${classId}`);
      
      if (!classId) {
        socket.emit('error', { message: 'Class ID is required' });
        return;
      }
      
      // Leave previous rooms
      socket.rooms.forEach(room => {
        if (room.startsWith('class:')) {
          socket.leave(room);
        }
      });
      
      // Join new class room
      const roomName = `class:${classId}`;
      socket.join(roomName);
      
      // Update user info
      const userInfo = connectedUsers.get(socket.id);
      if (userInfo) {
        userInfo.role = 'student';
        userInfo.classId = classId;
      }
      
      // Track room membership
      if (!classRooms.has(classId)) {
        classRooms.set(classId, new Set());
      }
      classRooms.get(classId).add(socket.id);
      
      // Send confirmation
      socket.emit('student:joined', { 
        classId: classId,
        room: roomName,
        message: 'Successfully joined as student'
      });
      
      // Update viewer count for the class
      updateViewerCount(classId);
      
      console.log(`✅ Student ${socket.id} joined class ${classId}`);
    });
    
    // Handle stream start notification (from instructor)
    socket.on('stream:start', (data) => {
      const userInfo = connectedUsers.get(socket.id);
      if (!userInfo || userInfo.role !== 'instructor') {
        socket.emit('error', { message: 'Only instructors can start streams' });
        return;
      }
      
      const { classId } = data;
      console.log(`🔴 Stream starting for class: ${classId}`);
      
      // Notify all students in the class
      const roomName = `class:${classId}`;
      socket.to(roomName).emit('stream:started', {
        classId: classId,
        hlsUrl: `http://localhost:8888/hls/${classId}.m3u8`,
        startTime: new Date(),
        instructor: socket.id
      });
      
      console.log(`📡 Notified students in class ${classId} about stream start`);
    });
    
    // Handle stream end notification (from instructor)
    socket.on('stream:end', (data) => {
      const userInfo = connectedUsers.get(socket.id);
      if (!userInfo || userInfo.role !== 'instructor') {
        socket.emit('error', { message: 'Only instructors can end streams' });
        return;
      }
      
      const { classId } = data;
      console.log(`⏹️ Stream ending for class: ${classId}`);
      
      // Notify all students in the class
      const roomName = `class:${classId}`;
      socket.to(roomName).emit('stream:ended', {
        classId: classId,
        endTime: new Date(),
        instructor: socket.id
      });
      
      console.log(`📡 Notified students in class ${classId} about stream end`);
    });
    
    // Handle viewer count requests
    socket.on('get-viewer-count', (data) => {
      const { classId } = data;
      const count = getViewerCount(classId);
      socket.emit('viewer:count', { classId, count });
    });
    
    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User disconnected: ${socket.id} (${reason})`);
      
      const userInfo = connectedUsers.get(socket.id);
      if (userInfo && userInfo.classId) {
        // Remove from class room tracking
        const classUsers = classRooms.get(userInfo.classId);
        if (classUsers) {
          classUsers.delete(socket.id);
          if (classUsers.size === 0) {
            classRooms.delete(userInfo.classId);
          }
        }
        
        // Update viewer count
        updateViewerCount(userInfo.classId);
      }
      
      // Remove from connected users
      connectedUsers.delete(socket.id);
    });
    
    // Legacy WebRTC event handlers (for backward compatibility)
    socket.on('instructor-start-webrtc', (data) => {
      console.log('🔄 Legacy WebRTC start event - converting to HLS');
      socket.emit('stream:start', data);
    });
    
    socket.on('instructor-stop-webrtc', (data) => {
      console.log('🔄 Legacy WebRTC stop event - converting to HLS');
      socket.emit('stream:end', data);
    });
    
    // Utility functions
    function getViewerCount(classId) {
      const room = io.sockets.adapter.rooms.get(`class:${classId}`);
      return room ? room.size : 0;
    }
    
    function updateViewerCount(classId) {
      const count = getViewerCount(classId);
      const roomName = `class:${classId}`;
      
      // Send to all users in the class room
      io.to(roomName).emit('viewer:count', { 
        classId: classId, 
        count: count 
      });
      
      // Also send legacy event
      io.to(roomName).emit('viewerCount', { 
        count: count 
      });
      
      console.log(`👥 Updated viewer count for class ${classId}: ${count}`);
    }
  });
  
  // Periodic viewer count updates
  setInterval(() => {
    classRooms.forEach((users, classId) => {
      if (users.size > 0) {
        updateViewerCount(classId);
      }
    });
  }, 30000); // Update every 30 seconds
  
  console.log('✅ Stream Socket.IO handlers initialized');
};

module.exports = streamHandler;