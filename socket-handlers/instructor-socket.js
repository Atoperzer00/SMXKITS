// Instructor-specific Socket.IO handlers
const User = require('../models/User');
const Class = require('../models/Class');
const Message = require('../models/Message');
const Progress = require('../models/Progress');
const Submission = require('../models/Submission');

class InstructorSocketHandler {
  constructor(io) {
    this.io = io;
    this.instructorSockets = new Map(); // instructorId -> socket
    this.classRooms = new Map(); // classId -> Set of socketIds
    this.onlineStudents = new Map(); // classId -> Set of studentIds
    this.activePolls = new Map(); // pollId -> poll data
    this.breakoutRooms = new Map(); // roomId -> room data
  }

  handleConnection(socket) {
    console.log(`🔌 Instructor socket connected: ${socket.id}`);

    // Handle instructor authentication
    socket.on('authenticate-instructor', async (data) => {
      try {
        const { userId, classId, token } = data;
        
        // Verify user is instructor or admin
        const user = await User.findById(userId);
        if (!user || !['instructor', 'admin'].includes(user.role)) {
          socket.emit('auth-error', { message: 'Unauthorized' });
          return;
        }

        // Store instructor socket
        socket.userId = userId;
        socket.userRole = user.role;
        socket.userName = user.name;
        socket.classId = classId;
        
        this.instructorSockets.set(userId, socket);

        // Join class room
        if (classId) {
          socket.join(`class-${classId}`);
          socket.join(`instructor-${classId}`);
          
          if (!this.classRooms.has(classId)) {
            this.classRooms.set(classId, new Set());
          }
          this.classRooms.get(classId).add(socket.id);
        }

        socket.emit('authenticated', { 
          userId, 
          role: user.role,
          classId 
        });

        console.log(`✅ Instructor authenticated: ${user.name} (${user.role})`);
      } catch (error) {
        console.error('❌ Instructor authentication error:', error);
        socket.emit('auth-error', { message: 'Authentication failed' });
      }
    });

    // Handle real-time messaging
    socket.on('send-broadcast-message', async (data) => {
      try {
        const { classId, message, type = 'announcement' } = data;
        
        if (!socket.userId || !classId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Save message to database
        const messageDoc = new Message({
          senderId: socket.userId,
          classId,
          content: message,
          type,
          timestamp: new Date()
        });
        await messageDoc.save();

        // Broadcast to all students in class
        this.io.to(`class-${classId}`).emit('instructor-message', {
          messageId: messageDoc._id,
          senderName: socket.userName,
          message,
          type,
          timestamp: messageDoc.timestamp,
          classId
        });

        socket.emit('message-sent', { messageId: messageDoc._id });
        console.log(`📢 Broadcast message sent to class ${classId}`);
      } catch (error) {
        console.error('❌ Failed to send broadcast message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle direct messaging to students
    socket.on('send-direct-message', async (data) => {
      try {
        const { studentId, message, classId } = data;
        
        if (!socket.userId || !classId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Save message to database
        const messageDoc = new Message({
          senderId: socket.userId,
          recipientId: studentId,
          classId,
          content: message,
          type: 'direct',
          timestamp: new Date()
        });
        await messageDoc.save();

        // Send to specific student
        this.io.to(`user-${studentId}`).emit('direct-message', {
          messageId: messageDoc._id,
          senderName: socket.userName,
          senderId: socket.userId,
          message,
          timestamp: messageDoc.timestamp,
          classId
        });

        socket.emit('message-sent', { messageId: messageDoc._id });
        console.log(`💬 Direct message sent to student ${studentId}`);
      } catch (error) {
        console.error('❌ Failed to send direct message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle poll creation
    socket.on('create-poll', async (data) => {
      try {
        const { classId, question, options, duration = 300 } = data; // 5 minutes default
        
        if (!socket.userId || !classId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const pollId = `poll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const poll = {
          id: pollId,
          classId,
          question,
          options: options.map((option, index) => ({
            id: index,
            text: option,
            votes: 0
          })),
          duration,
          createdBy: socket.userId,
          createdAt: new Date(),
          responses: new Map(),
          totalVotes: 0,
          active: true
        };

        this.activePolls.set(pollId, poll);

        // Send poll to all students in class
        this.io.to(`class-${classId}`).emit('new-poll', {
          pollId,
          question,
          options: poll.options,
          duration,
          createdAt: poll.createdAt
        });

        // Auto-close poll after duration
        setTimeout(() => {
          this.closePoll(pollId);
        }, duration * 1000);

        socket.emit('poll-created', { pollId, poll });
        console.log(`📊 Poll created: ${pollId} for class ${classId}`);
      } catch (error) {
        console.error('❌ Failed to create poll:', error);
        socket.emit('error', { message: 'Failed to create poll' });
      }
    });

    // Handle poll responses (from students)
    socket.on('poll-response', (data) => {
      try {
        const { pollId, optionId, studentId } = data;
        
        const poll = this.activePolls.get(pollId);
        if (!poll || !poll.active) {
          return;
        }

        // Update poll data
        if (poll.responses.has(studentId)) {
          // Student already voted, update their vote
          const oldOptionId = poll.responses.get(studentId);
          poll.options[oldOptionId].votes--;
        } else {
          poll.totalVotes++;
        }

        poll.responses.set(studentId, optionId);
        poll.options[optionId].votes++;

        // Send updated results to instructor
        const instructorSocket = this.instructorSockets.get(poll.createdBy);
        if (instructorSocket) {
          instructorSocket.emit('poll-update', {
            pollId,
            totalVotes: poll.totalVotes,
            options: poll.options,
            responses: poll.responses.size
          });
        }

        console.log(`📊 Poll response received: ${pollId} option ${optionId}`);
      } catch (error) {
        console.error('❌ Failed to handle poll response:', error);
      }
    });

    // Handle breakout room creation
    socket.on('create-breakout-room', async (data) => {
      try {
        const { classId, roomName, studentIds, duration = 900 } = data; // 15 minutes default
        
        if (!socket.userId || !classId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        const roomId = `breakout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const room = {
          id: roomId,
          name: roomName,
          classId,
          studentIds,
          duration,
          createdBy: socket.userId,
          createdAt: new Date(),
          active: true,
          participants: new Set()
        };

        this.breakoutRooms.set(roomId, room);

        // Move students to breakout room
        studentIds.forEach(studentId => {
          this.io.to(`user-${studentId}`).emit('join-breakout-room', {
            roomId,
            roomName,
            duration,
            participants: studentIds
          });
        });

        // Auto-close room after duration
        setTimeout(() => {
          this.closeBreakoutRoom(roomId);
        }, duration * 1000);

        socket.emit('breakout-room-created', { roomId, room });
        console.log(`🏠 Breakout room created: ${roomId} for class ${classId}`);
      } catch (error) {
        console.error('❌ Failed to create breakout room:', error);
        socket.emit('error', { message: 'Failed to create breakout room' });
      }
    });

    // Handle screen sharing requests
    socket.on('start-screen-share', (data) => {
      try {
        const { classId } = data;
        
        if (!socket.userId || !classId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Notify all students in class
        this.io.to(`class-${classId}`).emit('instructor-screen-share-started', {
          instructorId: socket.userId,
          instructorName: socket.userName
        });

        console.log(`🖥️ Screen sharing started by ${socket.userName} in class ${classId}`);
      } catch (error) {
        console.error('❌ Failed to start screen sharing:', error);
        socket.emit('error', { message: 'Failed to start screen sharing' });
      }
    });

    socket.on('stop-screen-share', (data) => {
      try {
        const { classId } = data;
        
        if (!socket.userId || !classId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Notify all students in class
        this.io.to(`class-${classId}`).emit('instructor-screen-share-stopped', {
          instructorId: socket.userId,
          instructorName: socket.userName
        });

        console.log(`🖥️ Screen sharing stopped by ${socket.userName} in class ${classId}`);
      } catch (error) {
        console.error('❌ Failed to stop screen sharing:', error);
        socket.emit('error', { message: 'Failed to stop screen sharing' });
      }
    });

    // Handle live stream controls
    socket.on('stream-control', (data) => {
      try {
        const { classId, action, streamData } = data;
        
        if (!socket.userId || !classId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Broadcast stream control to students
        this.io.to(`class-${classId}`).emit('stream-update', {
          action,
          streamData,
          instructorId: socket.userId
        });

        console.log(`📺 Stream ${action} by ${socket.userName} in class ${classId}`);
      } catch (error) {
        console.error('❌ Failed to handle stream control:', error);
        socket.emit('error', { message: 'Failed to control stream' });
      }
    });

    // Handle student activity monitoring
    socket.on('request-student-activity', async (data) => {
      try {
        const { classId } = data;
        
        if (!socket.userId || !classId) {
          socket.emit('error', { message: 'Not authenticated' });
          return;
        }

        // Get online students for this class
        const onlineStudents = this.onlineStudents.get(classId) || new Set();
        
        // Get recent activity from database
        const recentActivity = await Progress.find({
          classId,
          lastAccessed: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        }).populate('userId', 'name').sort({ lastAccessed: -1 }).limit(50);

        socket.emit('student-activity-update', {
          onlineCount: onlineStudents.size,
          onlineStudents: Array.from(onlineStudents),
          recentActivity: recentActivity.map(activity => ({
            studentId: activity.userId._id,
            studentName: activity.userId.name,
            lessonId: activity.lessonId,
            progress: activity.completionPercentage,
            lastAccessed: activity.lastAccessed
          }))
        });
      } catch (error) {
        console.error('❌ Failed to get student activity:', error);
        socket.emit('error', { message: 'Failed to get student activity' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Instructor socket disconnected: ${socket.id}`);
      
      if (socket.userId) {
        this.instructorSockets.delete(socket.userId);
      }
      
      if (socket.classId) {
        const classRoom = this.classRooms.get(socket.classId);
        if (classRoom) {
          classRoom.delete(socket.id);
          if (classRoom.size === 0) {
            this.classRooms.delete(socket.classId);
          }
        }
      }
    });
  }

  // Helper methods
  closePoll(pollId) {
    const poll = this.activePolls.get(pollId);
    if (poll) {
      poll.active = false;
      
      // Send final results to instructor
      const instructorSocket = this.instructorSockets.get(poll.createdBy);
      if (instructorSocket) {
        instructorSocket.emit('poll-closed', {
          pollId,
          finalResults: {
            totalVotes: poll.totalVotes,
            options: poll.options,
            responses: poll.responses.size
          }
        });
      }

      // Notify students
      this.io.to(`class-${poll.classId}`).emit('poll-ended', {
        pollId,
        results: poll.options
      });

      console.log(`📊 Poll closed: ${pollId}`);
    }
  }

  closeBreakoutRoom(roomId) {
    const room = this.breakoutRooms.get(roomId);
    if (room) {
      room.active = false;
      
      // Return students to main class
      room.studentIds.forEach(studentId => {
        this.io.to(`user-${studentId}`).emit('breakout-room-ended', {
          roomId,
          roomName: room.name
        });
      });

      // Notify instructor
      const instructorSocket = this.instructorSockets.get(room.createdBy);
      if (instructorSocket) {
        instructorSocket.emit('breakout-room-closed', {
          roomId,
          roomName: room.name,
          duration: room.duration
        });
      }

      this.breakoutRooms.delete(roomId);
      console.log(`🏠 Breakout room closed: ${roomId}`);
    }
  }

  // Method to update student online status
  updateStudentOnlineStatus(classId, studentId, isOnline) {
    if (!this.onlineStudents.has(classId)) {
      this.onlineStudents.set(classId, new Set());
    }
    
    const classStudents = this.onlineStudents.get(classId);
    
    if (isOnline) {
      classStudents.add(studentId);
    } else {
      classStudents.delete(studentId);
    }

    // Notify instructors of the change
    this.io.to(`instructor-${classId}`).emit('student-online-status', {
      studentId,
      isOnline,
      totalOnline: classStudents.size
    });
  }

  // Method to broadcast student progress updates
  broadcastProgressUpdate(classId, studentId, progressData) {
    this.io.to(`instructor-${classId}`).emit('student-progress-update', {
      studentId,
      ...progressData
    });
  }

  // Method to broadcast new submissions
  broadcastNewSubmission(classId, submissionData) {
    this.io.to(`instructor-${classId}`).emit('new-submission', submissionData);
  }
}

module.exports = InstructorSocketHandler;