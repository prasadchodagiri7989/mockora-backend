const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedOption: {
      type: Number, // Index of selected option, or -1/null if unanswered
      default: -1,
    },
    selectedOptions: [{
      type: Number,
    }],
    blankAnswer: {
      type: String,
      default: '',
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    marksAwarded: {
      type: Number,
      default: 0,
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0,
    },
    markedForReview: {
      type: Boolean,
      default: false,
    },
  }],
  score: {
    type: Number,
    required: true,
    default: 0,
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 0,
  },
  accuracyPercentage: {
    type: Number,
    default: 0,
  },
  correctCount: {
    type: Number,
    default: 0,
  },
  incorrectCount: {
    type: Number,
    default: 0,
  },
  unansweredCount: {
    type: Number,
    default: 0,
  },
  timeSpentSeconds: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed', 'timed-out'],
    default: 'completed',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  aiReview: {
    weakAreas: [{ type: String }],
    suggestedTopics: [{ type: String }],
    summaryText: { type: String, default: '' },
    recommendedResources: [{ type: String }],
    generatedAt: { type: Date, default: Date.now },
  },
}, { timestamps: true });

module.exports = mongoose.model('Attempt', attemptSchema);
