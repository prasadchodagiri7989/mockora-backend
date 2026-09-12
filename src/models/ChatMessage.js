const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  senderName: {
    type: String,
    default: 'Anonymous Visitor',
    trim: true,
  },
  senderEmail: {
    type: String,
    default: '',
    trim: true,
    lowercase: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  page: {
    type: String,
    default: '/',
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied'],
    default: 'new',
  },
  adminNote: {
    type: String,
    default: '',
  },
  adminReply: {
    type: String,
    default: '',
  },
  repliedAt: {
    type: Date,
  },
  repliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  ipAddress: {
    type: String,
    default: '',
  },
  userAgent: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
