const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  type: {
    type: String,
    enum: ['mock', 'practice'],
    default: 'mock',
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  timing: {
    enabled: {
      type: Boolean,
      default: true,
    },
    mode: {
      type: String,
      enum: ['overall', 'perQuestion', 'none'],
      default: 'overall',
    },
    duration: {
      type: Number, // In minutes for overall, or seconds for perQuestion
      default: 30,
    },
    sameTimePerQuestion: {
      type: Boolean,
      default: true,
    },
    defaultQuestionTime: {
      type: Number, // In seconds if sameTimePerQuestion is true
      default: 60,
    },
  },
  instructions: {
    type: String,
    default: '',
  },
  tags: [{
    type: String,
    trim: true,
  }],
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
  totalMarks: {
    type: Number,
    default: 100,
  },
  passingMarks: {
    type: Number,
    default: 40,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  attemptCount: {
    type: Number,
    default: 0,
  },
  averageScore: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
