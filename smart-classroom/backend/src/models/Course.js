const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    trim: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  thumbnail: {
    type: String,
    default: null
  },
  schedule: {
    days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    time: {
      start: String, // Format: "09:00"
      end: String    // Format: "10:00"
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    }
  },
  settings: {
    isLiveStreamingEnabled: {
      type: Boolean,
      default: true
    },
    isRecordingEnabled: {
      type: Boolean,
      default: true
    },
    allowStudentQuestions: {
      type: Boolean,
      default: true
    },
    maxStudents: {
      type: Number,
      default: 50
    },
    autoAttendance: {
      type: Boolean,
      default: true
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  enrollmentDeadline: {
    type: Date
  },
  prerequisites: [String],
  learningObjectives: [String],
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['document', 'video', 'link', 'assignment']
    },
    url: String,
    description: String,
    isRequired: {
      type: Boolean,
      default: false
    }
  }],
  assignments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment'
  }],
  lectures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture'
  }],
  announcements: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Announcement'
  }],
  // Google Sheets integration
  googleSheetId: String,
  sheetSyncEnabled: {
    type: Boolean,
    default: false
  },
  lastSheetSync: Date,
  // Analytics
  analytics: {
    totalViews: {
      type: Number,
      default: 0
    },
    averageAttendance: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
courseSchema.index({ instructor: 1 });
courseSchema.index({ subject: 1, class: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ startDate: 1, endDate: 1 });
courseSchema.index({ 'schedule.days': 1 });

// Virtual for student count
courseSchema.virtual('studentCount').get(function() {
  return this.students.length;
});

// Virtual for lecture count
courseSchema.virtual('lectureCount').get(function() {
  return this.lectures.length;
});

// Method to check if user is enrolled
courseSchema.methods.isEnrolled = function(userId) {
  return this.students.includes(userId);
};

// Method to add student
courseSchema.methods.addStudent = function(userId) {
  if (!this.students.includes(userId)) {
    this.students.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove student
courseSchema.methods.removeStudent = function(userId) {
  this.students = this.students.filter(id => !id.equals(userId));
  return this.save();
};

// Method to get course summary
courseSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    subject: this.subject,
    class: this.class,
    instructor: this.instructor,
    studentCount: this.studentCount,
    status: this.status,
    startDate: this.startDate,
    endDate: this.endDate,
    thumbnail: this.thumbnail
  };
};

module.exports = mongoose.model('Course', courseSchema);
