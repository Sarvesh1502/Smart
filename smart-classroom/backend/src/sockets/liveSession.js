const Lecture = require('../models/Lecture');
const Attendance = require('../models/Attendance');

const liveSessionHandler = (io, socket) => {
  // Join live session room
  socket.on('join-live-session', async (data) => {
    try {
      const { lectureId, userId, userRole } = data;
      
      // Join the lecture room
      socket.join(`lecture-${lectureId}`);
      
      // Update lecture with participant
      const lecture = await Lecture.findById(lectureId);
      if (lecture) {
        await lecture.addParticipant(userId);
        
        // Mark attendance for students
        if (userRole === 'student') {
          await lecture.markAttendance(userId, 'present');
          
          // Create attendance record
          const attendance = new Attendance({
            student: userId,
            course: lecture.course,
            lecture: lectureId,
            date: new Date(),
            status: 'present',
            joinTime: new Date(),
            liveSessionData: {
              jitsiRoomId: lecture.liveSession.jitsiRoomId,
              connectionQuality: 'good'
            }
          });
          await attendance.save();
        }
        
        // Notify all participants about new join
        socket.to(`lecture-${lectureId}`).emit('participant-joined', {
          userId,
          userRole,
          timestamp: new Date()
        });
        
        // Send current participants list to the new user
        const participants = lecture.liveSession.participants.map(p => ({
          userId: p.user,
          joinTime: p.joinTime
        }));
        
        socket.emit('participants-list', participants);
      }
    } catch (error) {
      console.error('Join live session error:', error);
      socket.emit('error', { message: 'Failed to join live session' });
    }
  });

  // Leave live session room
  socket.on('leave-live-session', async (data) => {
    try {
      const { lectureId, userId, userRole } = data;
      
      // Leave the lecture room
      socket.leave(`lecture-${lectureId}`);
      
      // Update lecture participant
      const lecture = await Lecture.findById(lectureId);
      if (lecture) {
        await lecture.removeParticipant(userId);
        
        // Update attendance for students
        if (userRole === 'student') {
          const attendance = await Attendance.findOne({
            student: userId,
            lecture: lectureId
          });
          
          if (attendance) {
            attendance.leaveTime = new Date();
            attendance.duration = Math.round(
              (attendance.leaveTime - attendance.joinTime) / (1000 * 60)
            );
            await attendance.save();
          }
        }
        
        // Notify all participants about leave
        socket.to(`lecture-${lectureId}`).emit('participant-left', {
          userId,
          userRole,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Leave live session error:', error);
      socket.emit('error', { message: 'Failed to leave live session' });
    }
  });

  // Send chat message
  socket.on('send-chat-message', async (data) => {
    try {
      const { lectureId, userId, message, messageType = 'message' } = data;
      
      const lecture = await Lecture.findById(lectureId);
      if (lecture) {
        await lecture.addChatMessage(userId, message, messageType);
        
        // Broadcast message to all participants in the room
        io.to(`lecture-${lectureId}`).emit('chat-message', {
          userId,
          message,
          messageType,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Send chat message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Start live session (instructor only)
  socket.on('start-live-session', async (data) => {
    try {
      const { lectureId, instructorId, jitsiRoomId } = data;
      
      const lecture = await Lecture.findById(lectureId);
      if (lecture && lecture.instructor.toString() === instructorId) {
        lecture.status = 'live';
        lecture.liveSession.jitsiRoomId = jitsiRoomId;
        lecture.liveSession.startTime = new Date();
        await lecture.save();
        
        // Notify all participants
        io.to(`lecture-${lectureId}`).emit('live-session-started', {
          lectureId,
          jitsiRoomId,
          startTime: lecture.liveSession.startTime
        });
      }
    } catch (error) {
      console.error('Start live session error:', error);
      socket.emit('error', { message: 'Failed to start live session' });
    }
  });

  // End live session (instructor only)
  socket.on('end-live-session', async (data) => {
    try {
      const { lectureId, instructorId } = data;
      
      const lecture = await Lecture.findById(lectureId);
      if (lecture && lecture.instructor.toString() === instructorId) {
        lecture.status = 'completed';
        lecture.liveSession.endTime = new Date();
        lecture.liveSession.duration = Math.round(
          (lecture.liveSession.endTime - lecture.liveSession.startTime) / (1000 * 60)
        );
        await lecture.save();
        
        // Notify all participants
        io.to(`lecture-${lectureId}`).emit('live-session-ended', {
          lectureId,
          endTime: lecture.liveSession.endTime,
          duration: lecture.liveSession.duration
        });
      }
    } catch (error) {
      console.error('End live session error:', error);
      socket.emit('error', { message: 'Failed to end live session' });
    }
  });

  // Share screen (instructor only)
  socket.on('share-screen', (data) => {
    const { lectureId, instructorId, isSharing } = data;
    
    // Broadcast screen sharing status to all participants
    socket.to(`lecture-${lectureId}`).emit('screen-sharing-updated', {
      instructorId,
      isSharing,
      timestamp: new Date()
    });
  });

  // Raise hand (student)
  socket.on('raise-hand', (data) => {
    const { lectureId, userId, isRaised } = data;
    
    // Notify instructor about hand raise
    socket.to(`lecture-${lectureId}`).emit('hand-raised', {
      userId,
      isRaised,
      timestamp: new Date()
    });
  });

  // Mute/unmute (instructor control)
  socket.on('mute-participant', (data) => {
    const { lectureId, targetUserId, isMuted } = data;
    
    // Notify specific participant about mute status
    io.to(`lecture-${lectureId}`).emit('participant-muted', {
      targetUserId,
      isMuted,
      timestamp: new Date()
    });
  });

  // Connection quality update
  socket.on('connection-quality-update', (data) => {
    const { lectureId, userId, quality } = data;
    
    // Update attendance record with connection quality
    Attendance.findOneAndUpdate(
      { student: userId, lecture: lectureId },
      { 'liveSessionData.connectionQuality': quality },
      { new: true }
    ).catch(error => {
      console.error('Update connection quality error:', error);
    });
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      // Find and update any active sessions for this socket
      // This would require tracking active sessions per socket
      console.log('Socket disconnected:', socket.id);
    } catch (error) {
      console.error('Disconnect handler error:', error);
    }
  });
};

module.exports = liveSessionHandler;
