const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['single', 'multiple', 'blank'],
    default: 'single',
  },
  codeSnippet: {
    type: String,
    default: '',
  },
  passageSnippet: {
    type: String,
    default: '',
  },
  imageUrl: {
    type: String,
    default: '',
  },
  options: [{
    type: String,
  }],
  correctOptionIndex: {
    type: Number,
    default: 0,
  },
  correctOptionIndices: [{
    type: Number,
  }],
  blankAnswer: {
    type: String,
    default: '',
  },
  timeLimitSeconds: {
    type: Number,
    default: 0,
  },
  explanation: {
    type: String,
    default: '',
  },
  marks: {
    type: Number,
    default: 4,
  },
  negativeMarks: {
    type: Number,
    default: 1,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  subject: {
    type: String,
    default: 'General',
  },
  topic: {
    type: String,
    default: 'General Concept',
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  type: {
    type: String,
    enum: ['mock', 'practice', 'both'],
    default: 'both',
  },
  practiceMode: {
    type: String,
    enum: ['mcq', 'exam', 'both'],
    default: 'both',
  },
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
