const mongoose = require('mongoose');

const teacherSheetSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Google Sheets integration
  googleSheetId: {
    type: String,
    required: true
  },
  sheetName: {
    type: String,
    required: true
  },
  sheetUrl: {
    type: String,
    required: true
  },
  // Sheet structure
  columns: [{
    name: String,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'boolean', 'dropdown']
    },
    isRequired: {
      type: Boolean,
      default: false
    },
    options: [String] // For dropdown type
  }],
  // Data mapping
  dataMapping: {
    studentName: String,
    rollNumber: String,
    attendance: String,
    marks: String,
    remarks: String
  },
  // Sync settings
  syncSettings: {
    autoSync: {
      type: Boolean,
      default: true
    },
    syncInterval: {
      type: Number,
      default: 30 // minutes
    },
    lastSync: Date,
    syncStatus: {
      type: String,
      enum: ['idle', 'syncing', 'error'],
      default: 'idle'
    },
    lastError: String
  },
  // Permissions
  permissions: {
    canEdit: {
      type: Boolean,
      default: true
    },
    canDelete: {
      type: Boolean,
      default: false
    },
    canShare: {
      type: Boolean,
      default: false
    }
  },
  // Version control
  versions: [{
    version: Number,
    data: mongoose.Schema.Types.Mixed,
    createdAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  currentVersion: {
    type: Number,
    default: 1
  },
  // Analytics
  analytics: {
    totalRows: {
      type: Number,
      default: 0
    },
    lastModified: Date,
    modificationCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
teacherSheetSchema.index({ course: 1 });
teacherSheetSchema.index({ teacher: 1 });
teacherSheetSchema.index({ googleSheetId: 1 });

module.exports = mongoose.model('TeacherSheet', teacherSheetSchema);
