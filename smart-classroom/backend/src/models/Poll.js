const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  lecture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lecture',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [{
    text: String,
    votes: {
      type: Number,
      default: 0
    }
  }],
  votes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    optionIndex: Number,
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  duration: {
    type: Number, // in seconds, 0 for no time limit
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  // Analytics
  analytics: {
    totalVotes: {
      type: Number,
      default: 0
    },
    participationRate: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
pollSchema.index({ lecture: 1 });
pollSchema.index({ instructor: 1 });
pollSchema.index({ status: 1 });

module.exports = mongoose.model('Poll', pollSchema);
