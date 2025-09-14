const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  tags: [String],
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Language support
  language: {
    type: String,
    default: 'en'
  },
  // Translations
  translations: [{
    language: String,
    question: String,
    answer: String
  }],
  // Analytics
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    helpfulVotes: {
      type: Number,
      default: 0
    },
    notHelpfulVotes: {
      type: Number,
      default: 0
    },
    searchCount: {
      type: Number,
      default: 0
    }
  },
  // Related FAQs
  relatedFAQs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FAQ'
  }],
  // Created and updated by
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
faqSchema.index({ category: 1, subcategory: 1 });
faqSchema.index({ isActive: 1, priority: -1 });
faqSchema.index({ tags: 1 });
faqSchema.index({ language: 1 });

// Text search index
faqSchema.index({
  question: 'text',
  answer: 'text'
});

module.exports = mongoose.model('FAQ', faqSchema);
