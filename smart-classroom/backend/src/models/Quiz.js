const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true,
    trim: true
  },
  questions: [{
    question: {
      type: String,
      required: true
    },
    options: [String],
    correctAnswer: String,
    explanation: String,
    points: {
      type: Number,
      default: 1
    }
  }],
  answers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId
    },
    answer: String,
    isCorrect: {
      type: Boolean,
      default: false
    },
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  duration: {
    type: Number, // in minutes
    default: 10
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
    totalParticipants: {
      type: Number,
      default: 0
    },
    averageScore: {
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

// Indexes
quizSchema.index({ lecture: 1 });
quizSchema.index({ instructor: 1 });
quizSchema.index({ status: 1 });

module.exports = mongoose.model('Quiz', quizSchema);
