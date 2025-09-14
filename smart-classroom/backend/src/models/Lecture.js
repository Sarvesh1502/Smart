const mongoose = require('mongoose');

const lectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['live', 'recorded', 'scheduled'],
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  // Live session details
  liveSession: {
    jitsiRoomId: String,
    startTime: Date,
    endTime: Date,
    duration: Number, // in minutes
    participants: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      joinTime: Date,
      leaveTime: Date,
      duration: Number // in minutes
    }],
    chatMessages: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      message: String,
      timestamp: Date,
      type: {
        type: String,
        enum: ['message', 'question', 'answer'],
        default: 'message'
      }
    }]
  },
  // Recording details
  recording: {
    videoUrl: String,
    audioUrl: String,
    thumbnailUrl: String,
    duration: Number, // in seconds
    fileSize: Number, // in bytes
    quality: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    transcription: {
      text: String,
      language: {
        type: String,
        default: 'en'
      },
      confidence: Number,
      segments: [{
        start: Number,
        end: Number,
        text: String
      }]
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    }
  },
  // Scheduled lecture details
  scheduledTime: {
    start: Date,
    end: Date,
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  // Content and materials
  materials: [{
    title: String,
    type: {
      type: String,
      enum: ['document', 'video', 'image', 'link', 'presentation']
    },
    url: String,
    description: String,
    isRequired: {
      type: Boolean,
      default: false
    }
  }],
  slides: [{
    slideNumber: Number,
    title: String,
    content: String,
    imageUrl: String,
    notes: String
  }],
  // Interactive elements
  polls: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll'
  }],
  quizzes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz'
  }],
  // Attendance
  attendance: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present'
    },
    joinTime: Date,
    leaveTime: Date,
    duration: Number // in minutes
  }],
  // Analytics
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    averageWatchTime: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    engagementScore: {
      type: Number,
      default: 0
    }
  },
  // Settings
  settings: {
    allowQuestions: {
      type: Boolean,
      default: true
    },
    allowChat: {
      type: Boolean,
      default: true
    },
    recordSession: {
      type: Boolean,
      default: true
    },
    autoAttendance: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
lectureSchema.index({ course: 1 });
lectureSchema.index({ instructor: 1 });
lectureSchema.index({ type: 1, status: 1 });
lectureSchema.index({ 'scheduledTime.start': 1 });
lectureSchema.index({ 'liveSession.jitsiRoomId': 1 });

// Virtual for attendance count
lectureSchema.virtual('attendanceCount').get(function() {
  return this.attendance.filter(a => a.status === 'present').length;
});

// Virtual for participant count
lectureSchema.virtual('participantCount').get(function() {
  return this.liveSession.participants.length;
});

// Method to add participant to live session
lectureSchema.methods.addParticipant = function(userId) {
  const existingParticipant = this.liveSession.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (!existingParticipant) {
    this.liveSession.participants.push({
      user: userId,
      joinTime: new Date()
    });
  }
  
  return this.save();
};

// Method to remove participant from live session
lectureSchema.methods.removeParticipant = function(userId) {
  const participant = this.liveSession.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant && !participant.leaveTime) {
    participant.leaveTime = new Date();
    participant.duration = Math.round(
      (participant.leaveTime - participant.joinTime) / (1000 * 60)
    );
  }
  
  return this.save();
};

// Method to add chat message
lectureSchema.methods.addChatMessage = function(userId, message, type = 'message') {
  this.liveSession.chatMessages.push({
    user: userId,
    message,
    timestamp: new Date(),
    type
  });
  
  return this.save();
};

// Method to mark attendance
lectureSchema.methods.markAttendance = function(userId, status = 'present') {
  const existingAttendance = this.attendance.find(
    a => a.student.toString() === userId.toString()
  );
  
  if (existingAttendance) {
    existingAttendance.status = status;
  } else {
    this.attendance.push({
      student: userId,
      status,
      joinTime: new Date()
    });
  }
  
  return this.save();
};

// Method to get lecture summary
lectureSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    type: this.type,
    status: this.status,
    course: this.course,
    instructor: this.instructor,
    scheduledTime: this.scheduledTime,
    attendanceCount: this.attendanceCount,
    participantCount: this.participantCount,
    recording: this.recording.videoUrl ? {
      url: this.recording.videoUrl,
      duration: this.recording.duration,
      thumbnail: this.recording.thumbnailUrl
    } : null
  };
};

module.exports = mongoose.model('Lecture', lectureSchema);
